import type {
  DailyObservation,
  MonthlyAggregate,
  LatestObservation,
  ClimateSummaryStats,
  EnvironmentalDataResponse,
  NasaPowerParameterMeta,
} from "../types/environmental";

const NASA_POWER_BASE_URL = "https://power.larc.nasa.gov/api/temporal/daily/point";

export const DEFAULT_PROTOTYPE_LOCATION = {
  name: "Green Valley, Arizona, USA",
  latitude: 31.8543,
  longitude: -111.0,
};

const ALL_PARAMETERS = [
  "T2M",
  "T2M_MAX",
  "T2M_MIN",
  "PRECTOTCORR",
  "RH2M",
  "WS10M",
  "ALLSKY_SFC_SW_DWN",
  "GWETTOP",
  "GWETROOT",
  "GWETPROF",
];

const CLIMATE_PARAMETERS = [
  "T2M",
  "T2M_MAX",
  "T2M_MIN",
  "PRECTOTCORR",
  "RH2M",
  "WS10M",
  "ALLSKY_SFC_SW_DWN",
];

const SOIL_PARAMETERS = ["GWETTOP", "GWETROOT", "GWETPROF"];

export const PARAMETER_METADATA_FALLBACK: Record<string, NasaPowerParameterMeta> = {
  T2M: { units: "°C", longname: "Temperature at 2 Meters" },
  T2M_MAX: { units: "°C", longname: "Maximum Temperature at 2 Meters" },
  T2M_MIN: { units: "°C", longname: "Minimum Temperature at 2 Meters" },
  PRECTOTCORR: { units: "mm/day", longname: "Precipitation Corrected" },
  RH2M: { units: "%", longname: "Relative Humidity at 2 Meters" },
  WS10M: { units: "m/s", longname: "Wind Speed at 10 Meters" },
  ALLSKY_SFC_SW_DWN: {
    units: "MJ/m^2/day",
    longname: "All Sky Surface Shortwave Downward Irradiance",
  },
  GWETTOP: { units: "fraction (0-1)", longname: "Surface Soil Wetness" },
  GWETROOT: { units: "fraction (0-1)", longname: "Root Zone Soil Wetness" },
  GWETPROF: { units: "fraction (0-1)", longname: "Profile Soil Wetness" },
};

// In-memory response cache to avoid unnecessary repeated API calls
interface CacheEntry {
  timestamp: number;
  data: EnvironmentalDataResponse;
}

const memoryCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function getCacheKey(lat: number, lon: number, start: string, end: string): string {
  return `${lat.toFixed(4)}_${lon.toFixed(4)}_${start}_${end}`;
}

interface RawNasaResponse {
  type?: string;
  geometry?: {
    coordinates?: [number, number, number?];
  };
  properties?: {
    parameter?: Record<string, Record<string, number>>;
  };
  parameters?: Record<string, { units?: string; longname?: string }>;
  header?: {
    fill_value?: number;
    title?: string;
    start?: string;
    end?: string;
  };
  messages?: string[];
}

async function fetchFromNasaPower(
  lat: number,
  lon: number,
  parameters: string[],
  startStr = "20210101",
  endStr = "20251231"
): Promise<RawNasaResponse> {
  const url = new URL(NASA_POWER_BASE_URL);
  url.searchParams.set("parameters", parameters.join(","));
  url.searchParams.set("community", "AG");
  url.searchParams.set("longitude", lon.toFixed(4));
  url.searchParams.set("latitude", lat.toFixed(4));
  url.searchParams.set("start", startStr);
  url.searchParams.set("end", endStr);
  url.searchParams.set("format", "JSON");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(
        `NASA POWER API HTTP ${res.status} (${res.statusText}): ${errText.slice(0, 150)}`
      );
    }

    const json = (await res.json()) as RawNasaResponse;
    if (!json?.properties?.parameter) {
      throw new Error("NASA POWER API returned payload missing 'properties.parameter'");
    }

    return json;
  } finally {
    clearTimeout(timeoutId);
  }
}

function sanitizeValue(val: unknown, fillValue = -999.0): number | null {
  if (typeof val !== "number" || Number.isNaN(val)) return null;
  // NASA POWER uses -999.0 or -999 for missing values
  if (val <= -900 || val === fillValue) return null;
  return Number(val.toFixed(2));
}

function formatDate(raw: string): string {
  // raw is YYYYMMDD
  if (raw.length === 8) {
    return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
  }
  return raw;
}

export async function getHistoricalEnvironmentalData(
  lat = DEFAULT_PROTOTYPE_LOCATION.latitude,
  lon = DEFAULT_PROTOTYPE_LOCATION.longitude,
  options?: {
    forceRefresh?: boolean;
    start?: string; // YYYYMMDD
    end?: string; // YYYYMMDD
    locationName?: string;
  }
): Promise<EnvironmentalDataResponse> {
  const startStr = options?.start || "20210101";
  const endStr = options?.end || "20251231";
  const cacheKey = getCacheKey(lat, lon, startStr, endStr);

  if (!options?.forceRefresh) {
    const cached = memoryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return {
        ...cached.data,
        isCached: true,
      };
    }
  }

  let rawData: RawNasaResponse | null = null;
  let usedSplitFallback = false;

  // Step 1: Attempt combined request for all 10 parameters
  try {
    rawData = await fetchFromNasaPower(lat, lon, ALL_PARAMETERS, startStr, endStr);
  } catch (combinedErr) {
    console.warn(
      "NASA POWER combined request failed. Attempting separate climate & soil requests as required by specification...",
      combinedErr
    );

    try {
      // Step 2: Separate requests fallback
      const [climateRes, soilRes] = await Promise.all([
        fetchFromNasaPower(lat, lon, CLIMATE_PARAMETERS, startStr, endStr),
        fetchFromNasaPower(lat, lon, SOIL_PARAMETERS, startStr, endStr),
      ]);

      const mergedParams: Record<string, Record<string, number>> = {
        ...(climateRes.properties?.parameter || {}),
        ...(soilRes.properties?.parameter || {}),
      };

      const mergedMetadata = {
        ...(climateRes.parameters || {}),
        ...(soilRes.parameters || {}),
      };

      rawData = {
        type: climateRes.type,
        geometry: climateRes.geometry,
        properties: { parameter: mergedParams },
        parameters: mergedMetadata,
        header: climateRes.header,
      };
      usedSplitFallback = true;
    } catch (splitErr) {
      console.error("NASA POWER split requests also failed:", splitErr);
      throw new Error(
        `Failed to retrieve data from NASA POWER API: ${
          splitErr instanceof Error ? splitErr.message : String(splitErr)
        }`
      );
    }
  }

  const params = rawData?.properties?.parameter || {};
  const fillValue = rawData?.header?.fill_value ?? -999.0;
  const paramMetaRaw = rawData?.parameters || {};

  // Build parameter metadata
  const parameterMetadata: Record<string, NasaPowerParameterMeta> = {};
  for (const p of ALL_PARAMETERS) {
    const raw = paramMetaRaw[p];
    parameterMetadata[p] = {
      units: raw?.units || PARAMETER_METADATA_FALLBACK[p]?.units || "",
      longname: raw?.longname || PARAMETER_METADATA_FALLBACK[p]?.longname || p,
    };
  }

  // Gather unique dates
  const t2mMap = params.T2M || {};
  const allDates = Object.keys(t2mMap).sort();

  if (allDates.length === 0) {
    // If T2M was empty, check any other parameter
    for (const p of ALL_PARAMETERS) {
      if (params[p] && Object.keys(params[p]).length > 0) {
        allDates.push(...Object.keys(params[p]));
      }
    }
    allDates.sort();
  }

  const dailyObservations: DailyObservation[] = [];
  let missingMeasurementsCount = 0;

  for (const rawDate of allDates) {
    const dateFormatted = formatDate(rawDate);
    const t2m = sanitizeValue(params.T2M?.[rawDate], fillValue);
    const t2mMax = sanitizeValue(params.T2M_MAX?.[rawDate], fillValue);
    const t2mMin = sanitizeValue(params.T2M_MIN?.[rawDate], fillValue);
    const precip = sanitizeValue(params.PRECTOTCORR?.[rawDate], fillValue);
    const rh2m = sanitizeValue(params.RH2M?.[rawDate], fillValue);
    const ws10m = sanitizeValue(params.WS10M?.[rawDate], fillValue);
    const solar = sanitizeValue(params.ALLSKY_SFC_SW_DWN?.[rawDate], fillValue);
    const gwettop = sanitizeValue(params.GWETTOP?.[rawDate], fillValue);
    const gwetroot = sanitizeValue(params.GWETROOT?.[rawDate], fillValue);
    const gwetprof = sanitizeValue(params.GWETPROF?.[rawDate], fillValue);

    const checkArray = [
      t2m,
      t2mMax,
      t2mMin,
      precip,
      rh2m,
      ws10m,
      solar,
      gwettop,
      gwetroot,
      gwetprof,
    ];
    const missingInDay = checkArray.filter((v) => v === null).length;
    missingMeasurementsCount += missingInDay;

    dailyObservations.push({
      date: dateFormatted,
      rawDate,
      t2m,
      t2mMax,
      t2mMin,
      precip,
      rh2m,
      ws10m,
      solar,
      gwettop,
      gwetroot,
      gwetprof,
    });
  }

  // Calculate Monthly Aggregates
  // Temperature: mean of non-missing values
  // Humidity: mean
  // Solar radiation: mean
  // Precipitation: sum of daily precip in mm for the month
  // Soil moisture: mean of non-missing values
  const monthlyGroups = new Map<string, DailyObservation[]>();
  for (const obs of dailyObservations) {
    const monthKey = obs.date.slice(0, 7); // YYYY-MM
    const group = monthlyGroups.get(monthKey) || [];
    group.push(obs);
    monthlyGroups.set(monthKey, group);
  }

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const monthlyAggregates: MonthlyAggregate[] = [];
  for (const [monthKey, group] of Array.from(monthlyGroups.entries()).sort()) {
    const [yStr, mStr] = monthKey.split("-");
    const year = Number(yStr);
    const monthNum = Number(mStr);
    const label = `${monthNames[monthNum - 1]} ${year}`;

    const validT2m = group.map((d) => d.t2m).filter((v): v is number => v !== null);
    const validT2mMax = group.map((d) => d.t2mMax).filter((v): v is number => v !== null);
    const validT2mMin = group.map((d) => d.t2mMin).filter((v): v is number => v !== null);
    const validPrecip = group.map((d) => d.precip).filter((v): v is number => v !== null);
    const validRh2m = group.map((d) => d.rh2m).filter((v): v is number => v !== null);
    const validSolar = group.map((d) => d.solar).filter((v): v is number => v !== null);
    const validGwettop = group.map((d) => d.gwettop).filter((v): v is number => v !== null);
    const validGwetroot = group.map((d) => d.gwetroot).filter((v): v is number => v !== null);
    const validGwetprof = group.map((d) => d.gwetprof).filter((v): v is number => v !== null);

    const t2mMean =
      validT2m.length > 0
        ? Number((validT2m.reduce((a, b) => a + b, 0) / validT2m.length).toFixed(1))
        : null;

    const t2mMax =
      validT2mMax.length > 0 ? Number(Math.max(...validT2mMax).toFixed(1)) : null;

    const t2mMin =
      validT2mMin.length > 0 ? Number(Math.min(...validT2mMin).toFixed(1)) : null;

    // Correct aggregation for precipitation: SUM of valid daily mm in the month
    const precipSum =
      validPrecip.length > 0
        ? Number(validPrecip.reduce((a, b) => a + b, 0).toFixed(1))
        : 0;

    const rh2mMean =
      validRh2m.length > 0
        ? Number((validRh2m.reduce((a, b) => a + b, 0) / validRh2m.length).toFixed(1))
        : null;

    const solarMean =
      validSolar.length > 0
        ? Number((validSolar.reduce((a, b) => a + b, 0) / validSolar.length).toFixed(2))
        : null;

    const gwettopMean =
      validGwettop.length > 0
        ? Number((validGwettop.reduce((a, b) => a + b, 0) / validGwettop.length).toFixed(2))
        : null;

    const gwetrootMean =
      validGwetroot.length > 0
        ? Number((validGwetroot.reduce((a, b) => a + b, 0) / validGwetroot.length).toFixed(2))
        : null;

    const gwetprofMean =
      validGwetprof.length > 0
        ? Number((validGwetprof.reduce((a, b) => a + b, 0) / validGwetprof.length).toFixed(2))
        : null;

    monthlyAggregates.push({
      month: monthKey,
      year,
      monthNum,
      label,
      t2mMean,
      t2mMax,
      t2mMin,
      precipSum,
      rh2mMean,
      solarMean,
      gwettopMean,
      gwetrootMean,
      gwetprofMean,
      totalDays: group.length,
      validDays: validT2m.length,
    });
  }

  // 5-Year Overall Statistics
  const allValidT2m = dailyObservations
    .map((d) => d.t2m)
    .filter((v): v is number => v !== null);
  const overallMeanTemp =
    allValidT2m.length > 0
      ? Number((allValidT2m.reduce((a, b) => a + b, 0) / allValidT2m.length).toFixed(1))
      : 0;

  let maxTempRecord = -Infinity;
  let maxTempRecordDate = "";
  let minTempRecord = Infinity;
  let minTempRecordDate = "";

  for (const obs of dailyObservations) {
    if (obs.t2mMax !== null && obs.t2mMax > maxTempRecord) {
      maxTempRecord = obs.t2mMax;
      maxTempRecordDate = obs.date;
    }
    if (obs.t2mMin !== null && obs.t2mMin < minTempRecord) {
      minTempRecord = obs.t2mMin;
      minTempRecordDate = obs.date;
    }
  }

  const totalPrecipMm = Number(
    monthlyAggregates.reduce((acc, m) => acc + m.precipSum, 0).toFixed(1)
  );
  const distinctYears = new Set(monthlyAggregates.map((m) => m.year)).size || 5;
  const annualAvgPrecipMm = Number((totalPrecipMm / distinctYears).toFixed(1));

  let wettestMonth = { month: "N/A", amountMm: 0 };
  let driestMonth = { month: "N/A", amountMm: Infinity };
  for (const m of monthlyAggregates) {
    if (m.precipSum > wettestMonth.amountMm) {
      wettestMonth = { month: m.label, amountMm: m.precipSum };
    }
    if (m.precipSum < driestMonth.amountMm) {
      driestMonth = { month: m.label, amountMm: m.precipSum };
    }
  }
  if (driestMonth.amountMm === Infinity) driestMonth.amountMm = 0;

  const rainDaysCount = dailyObservations.filter(
    (d) => d.precip !== null && d.precip >= 1.0
  ).length;

  const allValidRh = dailyObservations
    .map((d) => d.rh2m)
    .filter((v): v is number => v !== null);
  const meanHumidity =
    allValidRh.length > 0
      ? Number((allValidRh.reduce((a, b) => a + b, 0) / allValidRh.length).toFixed(1))
      : 0;

  const allValidSolar = dailyObservations
    .map((d) => d.solar)
    .filter((v): v is number => v !== null);
  const meanSolar =
    allValidSolar.length > 0
      ? Number((allValidSolar.reduce((a, b) => a + b, 0) / allValidSolar.length).toFixed(2))
      : 0;

  const allValidWind = dailyObservations
    .map((d) => d.ws10m)
    .filter((v): v is number => v !== null);
  const meanWind =
    allValidWind.length > 0
      ? Number((allValidWind.reduce((a, b) => a + b, 0) / allValidWind.length).toFixed(1))
      : 0;

  const allValidGwetTop = dailyObservations
    .map((d) => d.gwettop)
    .filter((v): v is number => v !== null);
  const surfaceMoistureMean =
    allValidGwetTop.length > 0
      ? Number(
          (allValidGwetTop.reduce((a, b) => a + b, 0) / allValidGwetTop.length).toFixed(2)
        )
      : 0;

  const allValidGwetRoot = dailyObservations
    .map((d) => d.gwetroot)
    .filter((v): v is number => v !== null);
  const rootMoistureMean =
    allValidGwetRoot.length > 0
      ? Number(
          (allValidGwetRoot.reduce((a, b) => a + b, 0) / allValidGwetRoot.length).toFixed(2)
        )
      : 0;

  const allValidGwetProf = dailyObservations
    .map((d) => d.gwetprof)
    .filter((v): v is number => v !== null);
  const profileMoistureMean =
    allValidGwetProf.length > 0
      ? Number(
          (allValidGwetProf.reduce((a, b) => a + b, 0) / allValidGwetProf.length).toFixed(2)
        )
      : 0;

  const summaryStats: ClimateSummaryStats = {
    period: {
      start: dailyObservations[0]?.date || "2021-01-01",
      end: dailyObservations[dailyObservations.length - 1]?.date || "2025-12-31",
      totalDays: dailyObservations.length,
      validDays: allValidT2m.length,
      missingRatePercent:
        dailyObservations.length > 0
          ? Number(
              (
                (missingMeasurementsCount / (dailyObservations.length * ALL_PARAMETERS.length)) *
                100
              ).toFixed(2)
            )
          : 0,
    },
    temperature: {
      mean: overallMeanTemp,
      maxRecord: maxTempRecord,
      maxRecordDate: maxTempRecordDate,
      minRecord: minTempRecord,
      minRecordDate: minTempRecordDate,
    },
    precipitation: {
      totalFiveYearMm: totalPrecipMm,
      annualAverageMm: annualAvgPrecipMm,
      wettestMonth,
      driestMonth,
      rainDaysCount,
    },
    humidity: {
      meanPercent: meanHumidity,
    },
    solar: {
      meanMjM2Day: meanSolar,
    },
    wind: {
      meanSpeedMs: meanWind,
    },
    soilMoisture: {
      surfaceMean: surfaceMoistureMean,
      rootZoneMean: rootMoistureMean,
      profileMean: profileMoistureMean,
    },
  };

  // Latest Available Observation (distinguished explicitly from live weather)
  const lastValidObs =
    [...dailyObservations].reverse().find((d) => d.t2m !== null) ||
    dailyObservations[dailyObservations.length - 1];

  const latestObservation: LatestObservation = {
    date: lastValidObs?.date || "2025-12-31",
    formattedDate: lastValidObs?.date
      ? new Date(lastValidObs.date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "Dec 31, 2025",
    isHistoricalNotice:
      "Historical NASA POWER MERRA-2 observation. Not a live current weather measurement.",
    t2m: lastValidObs?.t2m ?? null,
    t2mMax: lastValidObs?.t2mMax ?? null,
    t2mMin: lastValidObs?.t2mMin ?? null,
    precip: lastValidObs?.precip ?? null,
    rh2m: lastValidObs?.rh2m ?? null,
    ws10m: lastValidObs?.ws10m ?? null,
    solar: lastValidObs?.solar ?? null,
    gwettop: lastValidObs?.gwettop ?? null,
    gwetroot: lastValidObs?.gwetroot ?? null,
    gwetprof: lastValidObs?.gwetprof ?? null,
  };

  const isPredefined =
    Math.abs(lat - DEFAULT_PROTOTYPE_LOCATION.latitude) < 0.001 &&
    Math.abs(lon - DEFAULT_PROTOTYPE_LOCATION.longitude) < 0.001;

  const result: EnvironmentalDataResponse = {
    status: "Success",
    sourceName: usedSplitFallback
      ? "NASA POWER Daily API v2.10 (Split Requests MERRA-2 / GEOS-5)"
      : "NASA POWER Daily API v2.10 (Native MERRA-2 / GEOS-5)",
    retrievalTimestamp: new Date().toISOString(),
    isCached: false,
    location: {
      name:
        options?.locationName ||
        (isPredefined
          ? DEFAULT_PROTOTYPE_LOCATION.name
          : `Custom Coordinates (${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E)`),
      latitude: Number(lat.toFixed(4)),
      longitude: Number(lon.toFixed(4)),
      elevationMeters: rawData?.geometry?.coordinates?.[2],
      isPredefinedPrototype: isPredefined,
    },
    parameterMetadata,
    latestObservation,
    summaryStats,
    monthlyAggregates,
    recentDailyObservations: dailyObservations.slice(-30), // last 30 days for immediate preview
    totalObservationsCount: dailyObservations.length,
    missingMeasurementsCount,
  };

  memoryCache.set(cacheKey, {
    timestamp: Date.now(),
    data: result,
  });

  return result;
}
