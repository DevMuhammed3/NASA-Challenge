export type DataProvenanceStatus =
  | "live_api"
  | "cached_api"
  | "official_dataset"
  | "farmer_provided"
  | "calculated"
  | "unavailable"
  | "demo_test_only";

export interface DataPoint<T = number | string | boolean> {
  value: T | null;
  isAvailable: boolean;
  unit: string;
  source: string;
  sourceUrl: string;
  retrievedAt: string; // ISO 8601
  observationDate: string; // YYYY-MM-DD or date range
  status: DataProvenanceStatus;
  methodology: string;
  unavailableReason?: string;
  requiredMeasurementOrSource?: string;
}

export function createAvailableDataPoint<T>(params: {
  value: T;
  unit: string;
  source: string;
  sourceUrl: string;
  retrievedAt?: string;
  observationDate: string;
  status: "live_api" | "cached_api" | "official_dataset" | "farmer_provided" | "calculated";
  methodology: string;
}): DataPoint<T> {
  return {
    value: params.value,
    isAvailable: true,
    unit: params.unit,
    source: params.source,
    sourceUrl: params.sourceUrl,
    retrievedAt: params.retrievedAt || new Date().toISOString(),
    observationDate: params.observationDate,
    status: params.status,
    methodology: params.methodology,
  };
}

export function createUnavailableDataPoint<T = number | string>(params: {
  unit: string;
  source: string;
  sourceUrl: string;
  observationDate?: string;
  unavailableReason: string;
  requiredMeasurementOrSource: string;
  methodology?: string;
}): DataPoint<T> {
  return {
    value: null,
    isAvailable: false,
    unit: params.unit,
    source: params.source,
    sourceUrl: params.sourceUrl,
    retrievedAt: new Date().toISOString(),
    observationDate: params.observationDate || new Date().toISOString().split("T")[0],
    status: "unavailable",
    methodology:
      params.methodology ||
      "Metric not provided by regional data source; marked unavailable to prevent ungrounded estimation.",
    unavailableReason: params.unavailableReason,
    requiredMeasurementOrSource: params.requiredMeasurementOrSource,
  };
}
