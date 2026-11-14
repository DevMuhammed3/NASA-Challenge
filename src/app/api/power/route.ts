import { NextRequest, NextResponse } from "next/server";
import {
  getHistoricalEnvironmentalData,
  DEFAULT_PROTOTYPE_LOCATION,
} from "@/lib/services/nasa-power";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const latParam = searchParams.get("lat");
    const lonParam = searchParams.get("lon");
    const refresh = searchParams.get("refresh") === "true";
    const locationName = searchParams.get("name") || undefined;

    const lat = latParam ? Number(latParam) : DEFAULT_PROTOTYPE_LOCATION.latitude;
    const lon = lonParam ? Number(lonParam) : DEFAULT_PROTOTYPE_LOCATION.longitude;

    if (
      Number.isNaN(lat) ||
      Number.isNaN(lon) ||
      lat < -90 ||
      lat > 90 ||
      lon < -180 ||
      lon > 180
    ) {
      return NextResponse.json(
        {
          status: "Error",
          error: "Invalid coordinates. Latitude must be -90..90 and Longitude -180..180.",
        },
        { status: 400 }
      );
    }

    const data = await getHistoricalEnvironmentalData(lat, lon, {
      forceRefresh: refresh,
      locationName,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/power error:", error);
    return NextResponse.json(
      {
        status: "Error",
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch NASA POWER environmental data",
      },
      { status: 500 }
    );
  }
}
