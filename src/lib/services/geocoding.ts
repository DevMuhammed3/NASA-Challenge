import { DEFAULT_PROTOTYPE_LOCATION } from "./nasa-power";

export interface GeocodingResult {
  configured: boolean;
  status: "Configured" | "Missing" | "Error";
  locationName: string;
  latitude: number;
  longitude: number;
  formattedAddress?: string;
  source: "google_geocoding" | "manual_fallback";
  message?: string;
}

export function isGoogleGeocodingConfigured(): boolean {
  const apiKey =
    process.env.GOOGLE_GEOCODING_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_API_KEY;
  return Boolean(apiKey && apiKey.trim().length > 0);
}

export async function resolveLocationCoordinates(
  query: string
): Promise<GeocodingResult> {
  const apiKey =
    process.env.GOOGLE_GEOCODING_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_API_KEY;

  if (!apiKey || apiKey.trim().length === 0) {
    return {
      configured: false,
      status: "Missing",
      locationName: query || DEFAULT_PROTOTYPE_LOCATION.name,
      latitude: DEFAULT_PROTOTYPE_LOCATION.latitude,
      longitude: DEFAULT_PROTOTYPE_LOCATION.longitude,
      source: "manual_fallback",
      message:
        "Google Geocoding API key is not configured. Falling back to prototype test coordinates (Green Valley, AZ).",
    };
  }

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", query || DEFAULT_PROTOTYPE_LOCATION.name);
    url.searchParams.set("key", apiKey);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url.toString(), { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`Google Geocoding HTTP ${res.status}: ${res.statusText}`);
    }

    const json = await res.json();
    if (json.status === "OK" && Array.isArray(json.results) && json.results.length > 0) {
      const top = json.results[0];
      const lat = top.geometry.location.lat;
      const lng = top.geometry.location.lng;
      return {
        configured: true,
        status: "Configured",
        locationName: top.formatted_address || query,
        formattedAddress: top.formatted_address,
        latitude: Number(lat.toFixed(4)),
        longitude: Number(lng.toFixed(4)),
        source: "google_geocoding",
        message: "Successfully resolved via Google Geocoding API.",
      };
    }

    return {
      configured: true,
      status: "Error",
      locationName: query,
      latitude: DEFAULT_PROTOTYPE_LOCATION.latitude,
      longitude: DEFAULT_PROTOTYPE_LOCATION.longitude,
      source: "manual_fallback",
      message: `Geocoding status: ${json.status}. Using prototype coordinates fallback.`,
    };
  } catch (err) {
    return {
      configured: true,
      status: "Error",
      locationName: query,
      latitude: DEFAULT_PROTOTYPE_LOCATION.latitude,
      longitude: DEFAULT_PROTOTYPE_LOCATION.longitude,
      source: "manual_fallback",
      message:
        err instanceof Error ? err.message : "Geocoding query encountered an error.",
    };
  }
}
