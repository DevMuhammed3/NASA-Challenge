/**
 * Centralized Prototype Location Configuration
 *
 * For the GAIA MVP, all environmental data retrieval, satellite imagery,
 * and crop recommendation calculations operate exclusively on this location.
 *
 * Centralizing this configuration allows future multi-location support
 * to be introduced without rewriting the core calculation and UI modules.
 */

export interface LocationConfig {
  name: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  elevationMeters: number;
  climateZone: string;
  usdaHardinessZone: string;
  isFixed: boolean;
  description: string;
}

export const GREEN_VALLEY_LOCATION: LocationConfig = {
  name: "Green Valley, Arizona, USA",
  region: "Pima County, Southern Arizona",
  country: "United States",
  latitude: 31.8543,
  longitude: -111.0,
  elevationMeters: 962, // ~3,156 ft (low-to-mid desert transition)
  climateZone: "BWh / BSh (Sonoran Warm Semi-Arid, High Solar, Bimodal Precipitation)",
  usdaHardinessZone: "Zone 9a / 9b (Average annual extreme minimum: -6.7°C to -1.1°C)",
  isFixed: true,
  description:
    "Fixed prototype location for the GAIA MVP. Located in the Santa Cruz Valley of southern Arizona, characterized by hot summers, mild winters with episodic freeze events, high solar irradiance, and a bimodal rainfall regime.",
};
