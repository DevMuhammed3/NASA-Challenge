export interface GibsLayerConfig {
  id: "true_color" | "ndvi" | "land_cover";
  layerIdentifier: string;
  name: string;
  source: string;
  format: "image/jpeg" | "image/png";
  extension: "jpg" | "png";
  tileMatrixSet: string;
  maxNativeZoom: number;
  cadence: "daily" | "8day" | "yearly";
  defaultDate: string;
  earliestDate: string;
  latestDate: string;
  description: string;
}

export const GIBS_AVAILABLE_LAYERS: Record<string, GibsLayerConfig> = {
  true_color: {
    id: "true_color",
    layerIdentifier: "MODIS_Terra_CorrectedReflectance_TrueColor",
    name: "MODIS Terra True Color",
    source: "NASA GIBS / MODIS Terra Corrected Reflectance",
    format: "image/jpeg",
    extension: "jpg",
    tileMatrixSet: "GoogleMapsCompatible_Level9",
    maxNativeZoom: 9,
    cadence: "daily",
    defaultDate: "2024-06-01",
    earliestDate: "2000-02-24",
    latestDate: "2026-11-14",
    description:
      "Natural-color satellite imagery showing surface features, vegetation cover, and atmospheric conditions.",
  },
  ndvi: {
    id: "ndvi",
    layerIdentifier: "MODIS_Terra_NDVI_8Day",
    name: "MODIS Terra NDVI (8-Day Composite)",
    source: "NASA GIBS / MODIS Terra Vegetation Index",
    format: "image/png",
    extension: "png",
    tileMatrixSet: "GoogleMapsCompatible_Level9",
    maxNativeZoom: 9,
    cadence: "8day",
    defaultDate: "2024-04-14",
    earliestDate: "2000-02-24",
    latestDate: "2026-11-12",
    description:
      "Vegetation vigor colorized overlay. Visual spatial reference only; not a substitute for ground numerical NDVI measurement.",
  },
  land_cover: {
    id: "land_cover",
    layerIdentifier: "MODIS_Combined_L3_IGBP_Land_Cover_Type_Annual",
    name: "MODIS Land Cover (Annual IGBP)",
    source: "NASA GIBS / MODIS Combined Terra+Aqua Annual Land Cover",
    format: "image/png",
    extension: "png",
    tileMatrixSet: "GoogleMapsCompatible_Level8",
    maxNativeZoom: 8,
    cadence: "yearly",
    defaultDate: "2023-01-01",
    earliestDate: "2001-01-01",
    latestDate: "2024-01-01",
    description:
      "Annual classification of Earth's land cover types (croplands, shrublands, grasslands, barrens, forests).",
  },
};

export interface LayerAvailabilityResult {
  available: boolean;
  effectiveDate: string;
  reason?: string;
  tileUrlTemplate: string;
}

export function buildGibsTileUrl(layer: GibsLayerConfig, dateStr: string): string {
  // Format: https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/{layer}/default/{date}/{tms}/{z}/{y}/{x}.{ext}
  return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layer.layerIdentifier}/default/${dateStr}/${layer.tileMatrixSet}/{z}/{y}/{x}.${layer.extension}`;
}

export function validateGibsLayerDate(
  layerId: string,
  requestedDate: string
): LayerAvailabilityResult {
  const config = GIBS_AVAILABLE_LAYERS[layerId];
  if (!config) {
    return {
      available: false,
      effectiveDate: requestedDate,
      reason: `Unknown GIBS layer: ${layerId}`,
      tileUrlTemplate: "",
    };
  }

  // Check bounds
  if (requestedDate < config.earliestDate) {
    return {
      available: false,
      effectiveDate: config.earliestDate,
      reason: `Requested date ${requestedDate} is before satellite mission commencement (${config.earliestDate}).`,
      tileUrlTemplate: buildGibsTileUrl(config, config.defaultDate),
    };
  }

  if (requestedDate > config.latestDate) {
    return {
      available: false,
      effectiveDate: config.latestDate,
      reason: `Requested date ${requestedDate} exceeds the latest archived composite (${config.latestDate}).`,
      tileUrlTemplate: buildGibsTileUrl(config, config.defaultDate),
    };
  }

  // Format checks based on cadence
  let effectiveDate = requestedDate;
  if (config.cadence === "yearly") {
    // Land cover requires YYYY-01-01 format
    const year = requestedDate.slice(0, 4);
    effectiveDate = `${year}-01-01`;
    if (effectiveDate > config.latestDate) {
      return {
        available: false,
        effectiveDate: config.latestDate,
        reason: `Annual Land Cover is not yet processed for year ${year}. Latest available is ${config.latestDate.slice(0, 4)}.`,
        tileUrlTemplate: buildGibsTileUrl(config, config.latestDate),
      };
    }
  }

  return {
    available: true,
    effectiveDate,
    tileUrlTemplate: buildGibsTileUrl(config, effectiveDate),
  };
}

export async function checkGibsServiceHealth(): Promise<{
  status: "Connected" | "Error";
  latencyMs: number;
  message: string;
}> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    // Ping WMTS capabilities endpoint or a lightweight tile
    const res = await fetch(
      "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/2024-06-01/GoogleMapsCompatible_Level9/0/0/0.jpg",
      {
        method: "HEAD",
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);
    const latencyMs = Date.now() - start;

    if (res.ok || res.status === 200 || res.status === 304) {
      return {
        status: "Connected",
        latencyMs,
        message: "NASA GIBS WMTS service is responding with live tile assets.",
      };
    }
    return {
      status: "Error",
      latencyMs,
      message: `GIBS responded with HTTP status ${res.status}.`,
    };
  } catch (err) {
    return {
      status: "Error",
      latencyMs: Date.now() - start,
      message: err instanceof Error ? err.message : "Failed to reach NASA GIBS endpoint",
    };
  }
}
