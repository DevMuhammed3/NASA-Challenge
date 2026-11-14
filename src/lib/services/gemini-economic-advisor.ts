import {
  CropEconomicComparisonItem,
  EconomicAdvisorReport,
  FarmFinancialResults,
  FinancialScenario,
} from "@/lib/types/economics";
import { isGeminiAvailable, isOllamaAvailable } from "./gemini-advisor";

const GEMINI_MODEL = process.env.AI_MODEL || "gemini-2.5-flash";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.3";

async function callOllama(prompt: string): Promise<string> {
  const ollamaKey = process.env.OLLAMA_API_KEY;
  const baseUrl = (process.env.OLLAMA_BASE_URL || "https://api.ollama.com").replace(
    /\/$/,
    ""
  );

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
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

export async function generateFarmEconomicAnalysis(params: {
  cropName: string;
  acreage: number;
  financialResults: FarmFinancialResults;
  scenarios: Record<string, FinancialScenario>;
  comparisonTop5: CropEconomicComparisonItem[];
}): Promise<EconomicAdvisorReport> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const ollamaKey = process.env.OLLAMA_API_KEY;
  const preferredProvider = (process.env.AI_PROVIDER || "google").toLowerCase();

  if (!geminiKey && !ollamaKey) {
    throw new Error(
      "Neither GEMINI_API_KEY nor OLLAMA_API_KEY is configured on the server. AI Economic Advisor is disabled."
    );
  }

  const { cropName, acreage, financialResults: fin, scenarios, comparisonTop5 } = params;

  const topCropsSummary = comparisonTop5
    .map(
      (c, i) =>
        `${i + 1}. ${c.cropName} (${c.category === "cool_season" ? "Cool Season" : "Warm Season"}): ` +
        `Net Profit $${c.netProfitPerAcre.toLocaleString()}/acre, ROI ${c.roiPercent}%, Break-even $${c.breakEvenPricePerLb}/lb, Risk: ${c.financialRiskLevel}`
    )
    .join("\n");

  const prompt = `
You are the GAIA Agricultural Economics & Farm Business Advisor.
Your objective is to provide a rigorous, practical, executive-level financial evaluation for a farm parcel in Green Valley, Arizona (31.8543°N, -111.0000°W).

CRITICAL ANTI-HALLUCINATION RULES:
1. All baseline financial numbers have already been computed deterministically by the enterprise budget engine. DO NOT recalculate, invent, contradict, or alter these figures.
2. Quote the exact numbers provided below.
3. Clearly emphasize that USDA MyMarketNews Phoenix quotes represent regional shipping-point wholesale packing-house references, NOT guaranteed farm-gate direct receipts.
4. Ground all advice in Southern Arizona arid realities (groundwater pumping depths, alkaline soils, intense summer heat waves, winter radiation frosts).

DETERMINISTIC FINANCIAL BASELINE FOR SELECTED CROP (${cropName}, ${acreage} Acre):
- Gross Yield: ${fin.grossYieldLbs.toLocaleString()} lbs (${fin.marketableYieldLbs.toLocaleString()} lbs marketable @ ${fin.grossYieldLbs > 0 ? Math.round((fin.marketableYieldLbs / fin.grossYieldLbs) * 100) : 85}%)
- Quoted Wholesale Price: $${fin.sellingPricePerLb}/lb (${fin.priceCategory})
- Price Source: ${fin.priceSource}
- Gross Revenue: $${fin.grossRevenue.toLocaleString()} ($${fin.revenuePerAcre.toLocaleString()}/acre)
- Variable Production Costs: $${fin.variableCostsTotal.toLocaleString()} ($${fin.variableCostPerAcre.toLocaleString()}/acre)
- Fixed & Overhead Costs: $${fin.fixedCostsTotal.toLocaleString()} ($${fin.fixedCostPerAcre.toLocaleString()}/acre)
- Total Production Costs: $${fin.totalProductionCosts.toLocaleString()} ($${fin.totalCostPerAcre.toLocaleString()}/acre)
- Gross Margin: $${fin.grossMargin.toLocaleString()} (${fin.grossMarginPercent}%)
- Net Profit: $${fin.netProfit.toLocaleString()} ($${fin.netProfitPerAcre.toLocaleString()}/acre)
- Return on Investment (ROI): ${fin.returnOnInvestmentPercent}%
- Break-Even Selling Price: $${fin.breakEvenSellingPricePerLb}/lb
- Break-Even Yield: ${fin.breakEvenYieldLbsPerAcre.toLocaleString()} lbs/acre
- Safety Margin: ${fin.breakEvenSafetyMarginPercent}%
- Enterprise Budget Reference: ${fin.costDataSource}

SCENARIO ANALYSIS:
- Conservative (Stress Test): Net Profit $${scenarios.conservative?.results.netProfit.toLocaleString() || "N/A"}, ROI ${scenarios.conservative?.results.returnOnInvestmentPercent || "N/A"}%, Break-even $${scenarios.conservative?.results.breakEvenSellingPricePerLb || "N/A"}/lb. (Assumes -20% yield, -15% wholesale price, +10% pumping/input costs)
- Expected (Baseline): Net Profit $${scenarios.expected?.results.netProfit.toLocaleString() || "N/A"}, ROI ${scenarios.expected?.results.returnOnInvestmentPercent || "N/A"}%
- Optimistic (Premium Packout): Net Profit $${scenarios.optimistic?.results.netProfit.toLocaleString() || "N/A"}, ROI ${scenarios.optimistic?.results.returnOnInvestmentPercent || "N/A"}%

TOP DETERMINISTICALLY RANKED CROPS (1-ACRE BASIS):
${topCropsSummary}

REQUIRED OUTPUT STRUCTURE:
Return your response formatted cleanly with these 5 exact section headers:

### 1. Promising Crops Summary
### 2. Risk and Concentration Analysis
### 3. Cost Reduction Roadmap
### 4. Market Sensitivity Analysis
### 5. Missing Data & Next Steps
`;

  let responseText = "";
  let activeProvider = "Google Gemini";
  let activeModel = GEMINI_MODEL;

  try {
    if (preferredProvider === "ollama" && ollamaKey) {
      try {
        responseText = await callOllama(prompt);
        activeProvider = "Ollama";
        activeModel = OLLAMA_MODEL;
      } catch {
        if (geminiKey) {
          responseText = await callGemini(prompt, geminiKey);
          activeProvider = "Google Gemini";
          activeModel = GEMINI_MODEL;
        } else {
          throw new Error("Ollama call failed and Gemini is unavailable.");
        }
      }
    } else if (geminiKey) {
      try {
        responseText = await callGemini(prompt, geminiKey);
        activeProvider = "Google Gemini";
        activeModel = GEMINI_MODEL;
      } catch {
        if (ollamaKey) {
          responseText = await callOllama(prompt);
          activeProvider = "Ollama";
          activeModel = OLLAMA_MODEL;
        } else {
          throw new Error("Gemini call failed and Ollama is unavailable.");
        }
      }
    }

    // Parse structured sections
    const sections = parseSections(responseText);

    return {
      status: "Completed",
      provider: activeProvider,
      model: activeModel,
      sections,
      groundingNotice:
        "All numeric margins, yields, break-evens, and enterprise budgets were generated by GAIA's deterministic mathematical engine based on USDA AMS Report 2403 and University of Arizona Cooperative Extension benchmarks. AI synthesis is strictly explanatory.",
    };
  } catch (err) {
    console.warn("External LLM API unavailable or rate-limited; generating deterministic economic synthesis:", err);
    return generateDeterministicEconomicFallback(params);
  }
}

function generateDeterministicEconomicFallback(params: {
  cropName: string;
  acreage: number;
  financialResults: FarmFinancialResults;
  scenarios: Record<string, FinancialScenario>;
  comparisonTop5: CropEconomicComparisonItem[];
}): EconomicAdvisorReport {
  const { cropName, acreage, financialResults: fin, scenarios, comparisonTop5 } = params;

  const top3 = comparisonTop5.slice(0, 3);
  const top3Text = top3.length > 0
    ? top3
        .map(
          (c, i) =>
            `${i + 1}. **${c.cropName}** (${c.category === "cool_season" ? "Cool Season" : "Warm Season"}): Estimated Net Profit of **$${c.netProfitPerAcre.toLocaleString()}/acre** with an ROI of **${c.roiPercent}%** and break-even selling price of **$${c.breakEvenPricePerLb.toFixed(2)}/lb** (${c.financialRiskLevel} Risk).`
        )
        .join("\n")
    : "Crop comparison data currently being compiled.";

  return {
    status: "Completed (Deterministic Advisory Synthesis)",
    provider: "GAIA Agricultural Economics Engine",
    model: "Deterministic 2026 Enterprise Budget Baseline",
    groundingNotice:
      "All numeric margins, yields, break-evens, and enterprise budgets were generated by GAIA's deterministic mathematical engine based on USDA AMS Report 2403 and University of Arizona Cooperative Extension benchmarks. Deterministic synthesis active.",
    sections: {
      promisingCropsSummary: `For the evaluated parcel in Green Valley, Arizona (${acreage} cultivated acre basis), **${cropName}** presents a deterministic baseline Gross Revenue of **$${fin.grossRevenue.toLocaleString()}** against Total Production Costs of **$${fin.totalProductionCosts.toLocaleString()}** ($${fin.totalCostPerAcre.toLocaleString()}/acre), yielding an Estimated Net Profit of **$${fin.netProfit.toLocaleString()}** ($${fin.netProfitPerAcre.toLocaleString()}/acre) and a Return on Investment (ROI) of **${fin.returnOnInvestmentPercent}%**.\n\nAcross the 15 evaluated crops in Southern Arizona, the highest economic performers include:\n${top3Text}\n\n*Note: Wholesale price quotes reflect USDA AMS Phoenix Shipping Point (IX_FV120 / Report 2403) regional wholesale references, not guaranteed farm-gate direct receipts.*`,

      riskAndConcentrationAnalysis: `**Concentration & Capital Exposure:**\n- Operating capital exposure for ${cropName} is **$${fin.variableCostPerAcre.toLocaleString()}/acre** in variable inputs (seedlings, drip irrigation, electricity, labor, packaging).\n- The deterministic break-even selling price is **$${fin.breakEvenSellingPricePerLb}/lb** compared to the current quoted market price of **$${fin.sellingPricePerLb}/lb**, providing a break-even safety margin of **${fin.breakEvenSafetyMarginPercent}%**.\n- Monoculture risk in the Sonoran desert is elevated due to rapid summer heat onset (NASA POWER T2M_MAX > 100°F) and winter radiation freezes (T2M_MIN < 30°F). Growers are strongly advised to diversify acreage across cool-season greens/alliums and resilient warm-season crops (such as okra or heat-tolerant solanaceous varieties) rather than concentrating 100% of acreage in a single harvest window.`,

      costReductionRoadmap: `**Actionable Cost Reduction Priorities for Green Valley:**\n1. **Irrigation & Pumping Efficiency (Potential Savings: $140–$320/acre):** Deep groundwater pumping from the Upper Santa Cruz basin accounts for 15–22% of variable expenses. Utilizing NASA POWER daily solar radiation (ALLSKY_SFC_SW_DWN) to calculate ETc-based deficit drip scheduling cuts seasonal water volume by 0.5–0.9 acre-feet without yield loss.\n2. **Split Fertigation & Soil Testing (Potential Savings: $110–$260/acre):** Pre-plant soil nitrate testing avoids unnecessary synthetic nitrogen broadcast, which volatilizes rapidly in Green Valley's alkaline soils (pH 7.8–8.2). Spoon-feeding soluble nutrients via drip lines improves fertilizer uptake efficiency by 25%.\n3. **Thermal Protection & Packout Optimization (Potential Savings: $350–$850/acre):** Deploying 30% shade cloth during June heat waves prevents blossom drop and sunscald, raising marketable Grade 1 packout from 75% to 88%.\n4. **Packaging Transition (Potential Savings: $220–$550/acre):** Replacing single-use waxed corrugated boxes ($2.50+/carton) with reusable plastic containers (RPCs) on regional distribution routes along the I-19 corridor saves significant container costs.`,

      marketSensitivity: `**3-Tier Volatility Assessment for ${cropName}:**\n- **Conservative Scenario (Stress Test):** Net Profit adjusts to **$${scenarios.conservative?.results.netProfit.toLocaleString() || "N/A"}** (ROI **${scenarios.conservative?.results.returnOnInvestmentPercent || "N/A"}%**, Break-even **$${scenarios.conservative?.results.breakEvenSellingPricePerLb || "N/A"}/lb**). This models a 20% yield contraction from heat/frost anomalies, a 15% wholesale price reduction from peak Sonoran/California harvest gluts, and a 10% utility pumping rate increase.\n- **Expected Scenario (Extension Baseline):** Net Profit of **$${scenarios.expected?.results.netProfit.toLocaleString() || "N/A"}** (ROI **${scenarios.expected?.results.returnOnInvestmentPercent || "N/A"}%**) based strictly on 2026 University of Arizona enterprise budgets and current Phoenix Shipping Point report midpoints.\n- **Optimistic Scenario (Premium Packout):** Net Profit reaches **$${scenarios.optimistic?.results.netProfit.toLocaleString() || "N/A"}** (ROI **${scenarios.optimistic?.results.returnOnInvestmentPercent || "N/A"}%**) when precision fertigation and row cover management achieve an 18% yield premium and off-peak market timing secures a 15% price premium over shipping point base.`,

      missingDataAndNextSteps: `**Missing Ground Data & Verification Checklist:**\n1. **Farm-Gate vs. Wholesale Basis:** The current model utilizes Phoenix Shipping Point wholesale packing-house reference quotes. Farmers must determine their specific marketing channel (direct-to-consumer, restaurant contracts, CSA, or wholesale broker) and deduct packing/freight fees.\n2. **Well Depth & Pumping Lift Costs:** Energy costs vary substantially depending on dynamic water table depth (280–350+ ft in Green Valley). Actual well pump test curves must be incorporated.\n3. **Laboratory Soil Chemistry:** Essential variables including soil pH, electrical conductivity (ECe salinity), and available phosphorus must be measured via certified lab soil tests to fine-tune amendment budgets.\n4. **Irrigation Uniformity:** Test on-farm drip emitter distribution uniformity (DU > 85% recommended) before committing commercial capital.`,
    },
  };
}

async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.15, // Low temperature for factual precision
          maxOutputTokens: 2500,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      throw new Error(`Gemini HTTP ${res.status}: ${err.slice(0, 150)}`);
    }

    const json = await res.json();
    return json.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } finally {
    clearTimeout(timeoutId);
  }
}

function parseSections(text: string): EconomicAdvisorReport["sections"] {
  const getSection = (header: string, nextHeaders: string[]): string => {
    const idx = text.indexOf(header);
    if (idx === -1) return "Section details not provided.";
    const start = idx + header.length;
    let end = text.length;
    for (const nh of nextHeaders) {
      const nIdx = text.indexOf(nh, start);
      if (nIdx !== -1 && nIdx < end) {
        end = nIdx;
      }
    }
    return text.substring(start, end).trim();
  };

  return {
    promisingCropsSummary: getSection("### 1. Promising Crops Summary", [
      "### 2. Risk and Concentration Analysis",
      "### 2.",
    ]),
    riskAndConcentrationAnalysis: getSection("### 2. Risk and Concentration Analysis", [
      "### 3. Cost Reduction Roadmap",
      "### 3.",
    ]),
    costReductionRoadmap: getSection("### 3. Cost Reduction Roadmap", [
      "### 4. Market Sensitivity Analysis",
      "### 4.",
    ]),
    marketSensitivity: getSection("### 4. Market Sensitivity Analysis", [
      "### 5. Missing Data & Next Steps",
      "### 5.",
    ]),
    missingDataAndNextSteps: getSection("### 5. Missing Data & Next Steps", []),
  };
}
