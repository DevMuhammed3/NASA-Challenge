import type { SsurgoSoilProfile } from "../services/usda-ssurgo";
import type { DataPoint } from "./provenance";

export interface NasaPowerParameterMeta {
  units: string;
  longname: string;
}

export interface DailyObservation {
  date: string; // YYYY-MM-DD
  rawDate: string; // YYYYMMDD
  t2m: number | null; // °C
  t2mMax: number | null; // °C
  t2mMin: number | null; // °C
  precip: number | null; // mm/day
  rh2m: number | null; // %
  ws2m?: number | null; // m/s (agricultural 2m standard)
  ws10m: number | null; // m/s
  solar: number | null; // MJ/m^2/day
  gwettop: number | null; // 0-1 fraction
  gwetroot: number | null; // 0-1 fraction
  gwetprof: number | null; // 0-1 fraction
}

export interface MonthlyAggregate {
  month: string; // YYYY-MM
  year: number;
  monthNum: number;
  label: string; // e.g. "Jan 2021"
  t2mMean: number | null;
  t2mMax: number | null;
  t2mMin: number | null;
  precipSum: number | null; // accumulated mm, null if no valid measurements
  rh2mMean: number | null;
  solarMean: number | null;
  gwettopMean: number | null;
  gwetrootMean: number | null;
  gwetprofMean: number | null;
  totalDays: number;
  validDays: number;
}

export interface LatestObservation {
  date: string;
  formattedDate: string;
  isHistoricalNotice: string;
  t2m: number | null;
  t2mMax: number | null;
  t2mMin: number | null;
  precip: number | null;
  rh2m: number | null;
  ws2m?: number | null;
  ws10m: number | null;
  solar: number | null;
  gwettop: number | null;
  gwetroot: number | null;
  gwetprof: number | null;
}

export interface ClimateSummaryStats {
  period: {
    start: string;
    end: string;
    totalDays: number;
    validDays: number;
    missingRatePercent: number;
  };
  temperature: {
    mean: number;
    maxRecord: number;
    maxRecordDate: string;
    minRecord: number;
    minRecordDate: string;
  };
  precipitation: {
    totalFiveYearMm: number;
    annualAverageMm: number;
    wettestMonth: { month: string; amountMm: number };
    driestMonth: { month: string; amountMm: number };
    rainDaysCount: number;
  };
  humidity: {
    meanPercent: number;
  };
  solar: {
    meanMjM2Day: number;
  };
  wind: {
    meanSpeedMs: number;
  };
  soilMoisture: {
    surfaceMean: number;
    rootZoneMean: number;
    profileMean: number;
  };
}

export interface EnvironmentalDataResponse {
  status: "Success" | "Partial" | "Error";
  sourceName: string;
  retrievalTimestamp: string;
  isCached: boolean;
  location: {
    name: string;
    latitude: number;
    longitude: number;
    elevationMeters?: number;
    isPredefinedPrototype: boolean;
  };
  parameterMetadata: Record<string, NasaPowerParameterMeta>;
  latestObservation: LatestObservation;
  summaryStats: ClimateSummaryStats;
  monthlyAggregates: MonthlyAggregate[];
  recentDailyObservations: DailyObservation[];
  totalObservationsCount: number;
  missingMeasurementsCount: number;
  soilProfile?: SsurgoSoilProfile;
  provenance?: Record<string, DataPoint<unknown>>;
  error?: string;
}

export interface ProviderStatusItem {
  id:
    | "nasa_power"
    | "nasa_gibs"
    | "usda_ssurgo"
    | "google_geocoding"
    | "gemini_ai"
    | "ollama_ai"
    | "usda_mymarketnews"
    | "usda_nass";
  name: string;
  category: string;
  status: "Connected" | "Configured" | "Missing" | "Error";
  message: string;
  dataProvided: string;
  lastChecked: string;
  latencyMs?: number;
}

export interface AiAdvisorAnalysis {
  timestamp: string;
  model: string;
  provider: string;
  location: string;
  coordinates: { lat: number; lon: number };
  sections: {
    environmentalSummary: string;
    climatePatterns: string;
    agriculturalOpportunities: string;
    environmentalRisks: string;
    missingInformation: string;
    recommendedNextSteps: string;
  };
  groundTruthNotice: string;
}
