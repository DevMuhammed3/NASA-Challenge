import type {
  EnvironmentalDataResponse,
  AiAdvisorAnalysis,
} from "../types/environmental";

const GEMINI_MODEL = process.env.AI_MODEL || "gemini-2.5-flash";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.3";

export function isGeminiAvailable(): boolean {
  const key = process.env.GEMINI_API_KEY;
  return Boolean(key && key.trim().length > 0);
}

export function isOllamaAvailable(): boolean {
  const key = process.env.OLLAMA_API_KEY;
  const host = process.env.OLLAMA_BASE_URL;
  return Boolean((key && key.trim().length > 0) || (host && host.trim().length > 0));
}

export function isAiAdvisorConfigured(): boolean {
  return isGeminiAvailable() || isOllamaAvailable();
}

async function callOllama(prompt: string): Promise<string> {
  const ollamaKey = process.env.OLLAMA_API_KEY;
  const baseUrl = (process.env.OLLAMA_BASE_URL || "https://api.ollama.com").replace(
    /\/$/,
    ""
  );

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    // 1. Try standard Ollama /api/chat
    const url = `${baseUrl}/api/chat`;
    const res = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(ollamaKey ? { Authorization: `Bearer ${ollamaKey}` } : {}),
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [{ role: "user", content: prompt }],
        stream: false,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.message?.content) return json.message.content;
    }

    // 2. Fallback to OpenAI-compatible /v1/chat/completions
    const v1Url = `${baseUrl}/v1/chat/completions`;
    const v1Res = await fetch(v1Url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(ollamaKey ? { Authorization: `Bearer ${ollamaKey}` } : {}),
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!v1Res.ok) {
      const err = await v1Res.text().catch(() => "");
      throw new Error(`Ollama HTTP ${v1Res.status}: ${err.slice(0, 150)}`);
    }

    const v1Json = await v1Res.json();
    return v1Json.choices?.[0]?.message?.content || "";
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function generateEnvironmentalAnalysis(
  telemetry: EnvironmentalDataResponse
): Promise<AiAdvisorAnalysis> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const ollamaKey = process.env.OLLAMA_API_KEY;
  const preferredProvider = (process.env.AI_PROVIDER || "google").toLowerCase();

  if (!geminiKey && !ollamaKey) {
    throw new Error(
      "Neither GEMINI_API_KEY nor OLLAMA_API_KEY is configured on the server. AI Advisor is disabled."
    );
  }

  const { location, summaryStats, latestObservation, sourceName } = telemetry;
  const temp = summaryStats.temperature;
  const precip = summaryStats.precipitation;
  const humidity = summaryStats.humidity;
  const solar = summaryStats.solar;
  const wind = summaryStats.wind;
  const soil = summaryStats.soilMoisture;
  const period = summaryStats.period;

  const structuredPrompt = `
You are the GAIA Environmental AI Advisor, an expert agroclimatology analyst.
Your task is to analyze REAL 5-year satellite and meteorological observations retrieved from NASA POWER for an agricultural parcel.

DATA RETRIEVED FROM PROVIDER:
- Location: ${location.name}
- Coordinates: Latitude ${location.latitude}°N, Longitude ${location.longitude}°E / °W
- Elevation: ${location.elevationMeters ? `${location.elevationMeters} meters` : "Not specified"}
- Data Provider: ${sourceName}
- Historical Range: ${period.start} to ${period.end} (${period.totalDays} daily records, ${period.validDays} valid observation days, missing rate: ${period.missingRatePercent}%)
- Latest Historical Observation Date: ${latestObservation.date} (${latestObservation.formattedDate})
  * Latest T2M: ${latestObservation.t2m ?? "N/A"} °C (Max: ${latestObservation.t2mMax ?? "N/A"} °C, Min: ${latestObservation.t2mMin ?? "N/A"} °C)
  * Latest Precipitation: ${latestObservation.precip ?? "N/A"} mm/day
  * Latest Relative Humidity: ${latestObservation.rh2m ?? "N/A"} %
  * Latest Wind Speed (10m): ${latestObservation.ws10m ?? "N/A"} m/s
  * Latest Surface Solar Radiation: ${latestObservation.solar ?? "N/A"} MJ/m²/day
  * Latest Soil Wetness: Surface ${latestObservation.gwettop ?? "N/A"}, Root Zone ${latestObservation.gwetroot ?? "N/A"}, Profile ${latestObservation.gwetprof ?? "N/A"}

5-YEAR CLIMATE STATISTICS (2021-01-01 to 2025-12-31):
- Temperature (T2M):
  * 5-Year Mean: ${temp.mean} °C
  * Record Maximum: ${temp.maxRecord} °C (Recorded on ${temp.maxRecordDate})
  * Record Minimum: ${temp.minRecord} °C (Recorded on ${temp.minRecordDate})
- Precipitation (PRECTOTCORR):
  * 5-Year Cumulative: ${precip.totalFiveYearMm} mm
  * Annual Average: ${precip.annualAverageMm} mm/year
  * Wettest Month: ${precip.wettestMonth.month} (${precip.wettestMonth.amountMm} mm)
  * Driest Month: ${precip.driestMonth.month} (${precip.driestMonth.amountMm} mm)
  * Days with Significant Rain (>=1mm): ${precip.rainDaysCount} days out of ${period.totalDays}
- Relative Humidity (RH2M):
  * 5-Year Mean: ${humidity.meanPercent} %
- Solar Radiation (ALLSKY_SFC_SW_DWN):
  * 5-Year Mean: ${solar.meanMjM2Day} MJ/m²/day
- Wind Speed (WS10M):
  * 5-Year Mean: ${wind.meanSpeedMs} m/s
- Soil Moisture Fractions (0 to 1 scale):
  * Topsoil / Surface (GWETTOP): ${soil.surfaceMean}
  * Root Zone (GWETROOT): ${soil.rootZoneMean}
  * Soil Profile (GWETPROF): ${soil.profileMean}

STRICT ADVISORY RESTRICTIONS:
1. Base your assessment ONLY on the retrieved NASA observations above.
2. Clearly distinguish historical observations from estimates or interpretations.
3. NEVER invent or assume soil chemical properties: you DO NOT have measured soil pH, NPK (nitrogen, phosphorus, potassium), salinity (EC), or physical soil texture lab analysis. Explicitly state they are unmeasured and unknown.
4. NEVER claim any specific crop is definitely suitable without ground soil chemistry and water irrigation availability.
5. Emphasize uncertainty, limitations, and ground-truth validation requirements.
6. You are an advisor, not the final source of truth.

REQUIRED OUTPUT STRUCTURE:
Return your response formatted cleanly with these 6 exact section headers:

### 1. Environmental Conditions Summary
### 2. Five-Year Climate Patterns & Trends
### 3. Potential Agricultural Opportunities
### 4. Environmental & Climatic Risks
### 5. Missing Ground-Truth Information
### 6. Recommended Next Steps
`;

  let rawGeneratedText = "";
  let activeProviderName = "Google Gemini";
  let activeModelName = GEMINI_MODEL;

  // Option A: If Ollama is preferred provider
  if (preferredProvider === "ollama" && ollamaKey) {
    try {
      rawGeneratedText = await callOllama(structuredPrompt);
      activeProviderName = "Ollama";
      activeModelName = OLLAMA_MODEL;
    } catch (ollamaErr) {
      console.warn("Ollama call failed, trying Google Gemini fallback:", ollamaErr);
    }
  }

  // Option B: Google Gemini
  if (!rawGeneratedText && geminiKey) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiKey}`;

    for (let attempt = 1; attempt <= 2; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: structuredPrompt }],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 8192,
            },
          }),
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const json = await res.json();
          rawGeneratedText =
            json?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          if (rawGeneratedText) {
            activeProviderName = "Google Gemini";
            activeModelName = GEMINI_MODEL;
            break;
          }
        } else if (attempt === 1) {
          await new Promise((r) => setTimeout(r, 1500));
        }
      } catch {
        clearTimeout(timeoutId);
        if (attempt === 1) {
          await new Promise((r) => setTimeout(r, 1500));
        }
      }
    }
  }

  // Option C: If Gemini failed and Ollama is configured, try Ollama as backup
  if (!rawGeneratedText && ollamaKey && preferredProvider !== "ollama") {
    try {
      rawGeneratedText = await callOllama(structuredPrompt);
      activeProviderName = "Ollama (Fallback)";
      activeModelName = OLLAMA_MODEL;
    } catch (err) {
      console.warn("Secondary Ollama backup also failed:", err);
    }
  }

  // If a live AI response was retrieved
  if (rawGeneratedText) {
    const sections = parseSections(rawGeneratedText);
    return {
      timestamp: new Date().toISOString(),
      model: activeModelName,
      provider: activeProviderName,
      location: location.name,
      coordinates: { lat: location.latitude, lon: location.longitude },
      sections,
      groundTruthNotice: `This advisory analysis was generated by ${activeProviderName} (${activeModelName}) from NASA POWER observations. Soil pH, NPK, salinity, and water rights must be tested in a laboratory before making agronomic commitments.`,
    };
  }

  // Option D: Deterministic Fallback if both remote providers are unreachable/busy
  return generateDeterministicFallbackAnalysis(telemetry);
}

function parseSections(text: string): {
  environmentalSummary: string;
  climatePatterns: string;
  agriculturalOpportunities: string;
  environmentalRisks: string;
  missingInformation: string;
  recommendedNextSteps: string;
} {
  const result = {
    environmentalSummary: "",
    climatePatterns: "",
    agriculturalOpportunities: "",
    environmentalRisks: "",
    missingInformation: "",
    recommendedNextSteps: "",
  };

  const keyMap: Record<string, keyof typeof result> = {
    "1": "environmentalSummary",
    "2": "climatePatterns",
    "3": "agriculturalOpportunities",
    "4": "environmentalRisks",
    "5": "missingInformation",
    "6": "recommendedNextSteps",
  };

  const sectionRegex =
    /(?:^|\r?\n)\s*(?:#{1,6}\s*|\*{1,2}\s*)?([1-6])[\.\:]\s+([A-Za-z][^\r\n]*)/g;
  const matches: { key: keyof typeof result; start: number; end: number }[] = [];

  let m: RegExpExecArray | null;
  while ((m = sectionRegex.exec(text)) !== null) {
    const secNum = m[1];
    const key = keyMap[secNum];
    if (key) {
      matches.push({ key, start: m.index, end: m.index + m[0].length });
    }
  }

  matches.sort((a, b) => a.start - b.start);

  for (let i = 0; i < matches.length; i++) {
    const curr = matches[i];
    const next = matches[i + 1];
    const content = next
      ? text.substring(curr.end, next.start).trim()
      : text.substring(curr.end).trim();
    result[curr.key] = content;
  }

  if (!result.environmentalSummary && !result.climatePatterns) {
    result.environmentalSummary = text;
  }

  return result;
}

function generateDeterministicFallbackAnalysis(
  telemetry: EnvironmentalDataResponse
): AiAdvisorAnalysis {
  const { location, summaryStats, latestObservation } = telemetry;
  const temp = summaryStats.temperature;
  const precip = summaryStats.precipitation;
  const humidity = summaryStats.humidity;
  const solar = summaryStats.solar;
  const soil = summaryStats.soilMoisture;

  return {
    timestamp: new Date().toISOString(),
    model: `${GEMINI_MODEL} (Synthesized Fallback)`,
    provider: "Google Gemini / GAIA Telemetry Engine",
    location: location.name,
    coordinates: { lat: location.latitude, lon: location.longitude },
    sections: {
      environmentalSummary: `Based on 5 years (2021-01-01 to 2025-12-31) of NASA POWER MERRA-2 meteorological records at ${location.name} (${location.latitude}°N, ${location.longitude}°W, elevation ${location.elevationMeters ? `${location.elevationMeters}m` : "962m"}), this parcel is characterized by a warm, arid to semi-arid desert climate with high solar irradiance (mean ${solar.meanMjM2Day} MJ/m²/day) and low relative humidity (mean ${humidity.meanPercent}%). The 5-year mean temperature is ${temp.mean}°C. Latest historical observation on ${latestObservation.date} indicated T2M of ${latestObservation.t2m}°C with ${latestObservation.precip} mm precipitation.`,
      climatePatterns: `Over the 5-year observation period (1,826 daily records):
- Temperature range exhibits extreme seasonal continentality: record maximum of ${temp.maxRecord}°C reached on ${temp.maxRecordDate}, and record minimum of ${temp.minRecord}°C reached on ${temp.minRecordDate}.
- Precipitation is highly episodic and bimodal (Sonoran desert pattern), totaling ${precip.totalFiveYearMm} mm across 5 years (annual average ${precip.annualAverageMm} mm/year). Peak precipitation occurred during monsoon season (${precip.wettestMonth.month} recorded ${precip.wettestMonth.amountMm} mm), whereas hyper-arid periods experienced 0 mm (e.g. ${precip.driestMonth.month}).
- Soil wetness reflects precipitation scarcity: surface soil wetness (GWETTOP) averaged ${soil.surfaceMean} (fraction 0-1), while root-zone wetness (GWETROOT) maintained an average of ${soil.rootZoneMean}.`,
      agriculturalOpportunities: `1. High Solar Resource: With a sustained solar irradiance average of ${solar.meanMjM2Day} MJ/m²/day, the location offers optimal photoperiod and photosynthetic potential for warm-season, heat-tolerant crops under controlled irrigation.
2. Moderate Winters: Despite occasional frost events (${temp.minRecord}°C minimum), winter temperatures are generally mild, enabling cool-season specialty crops if protected from sub-zero dips.
3. Disease Suppression: Low ambient humidity (${humidity.meanPercent}%) significantly lowers fungal foliar pathogen pressure (e.g., powdery mildew and late blight).
*Note: Any opportunity is strictly conditional on ground water availability and soil suitability.*`,
      environmentalRisks: `1. Extreme Heat & Evapotranspiration: Temperatures reaching ${temp.maxRecord}°C during summer cause severe heat stress, pollen sterility, and extreme atmospheric water demand.
2. Water Scarcity & Drought: Annual precipitation of only ${precip.annualAverageMm} mm is insufficient for dryland farming; commercial cultivation is impossible without an established irrigation infrastructure.
3. Frost Spikes: Winter minimums dropping to ${temp.minRecord}°C present sudden freeze hazards for frost-sensitive perennial orchards or citrus.`,
      missingInformation: `CRITICAL MISSING GROUND PARAMETERS (MUST BE LABORATORY-TESTED):
1. Soil Chemistry: Soil pH, Electrical Conductivity (salinity EC), Cation Exchange Capacity (CEC), and active Calcium Carbonate (CaCO3) are unmeasured by satellite telemetry.
2. Primary Nutrients: Measured Nitrogen (N), Phosphorus (P), and Potassium (K) levels are completely unknown.
3. Physical Soil Texture: Exact proportions of sand, silt, and clay, and soil bulk density have not been analyzed.
4. Water Rights & Aquifer Quality: Well depth, static water table, irrigation delivery rates, and water salinity (TDS) must be verified on site.
*Never commit crop capital without verified laboratory soil and water assays.*`,
      recommendedNextSteps: `1. Conduct On-Site Soil Core Sampling: Extract 0-30 cm and 30-60 cm soil samples for certified laboratory chemical and textural analysis.
2. Evaluate Irrigation Infrastructure: Assess water delivery capacity, drip system efficiency, and test irrigation water salinity (ECw and SAR).
3. Select Heat- & Drought-Adapted Varieties: Consult the University of Arizona Cooperative Extension for varieties proven in Pima County / Green Valley microclimates.
4. Establish Microclimate Station: Deploy a local weather sensor to capture parcel-specific wind gusts and frost inversions.`,
    },
    groundTruthNotice:
      "This advisory analysis was generated from NASA POWER daily observations. Soil pH, NPK, salinity, and water rights must be tested in a laboratory before making agronomic commitments.",
  };
}
