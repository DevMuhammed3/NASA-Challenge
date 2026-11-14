import { NextResponse } from "next/server";
import { getHistoricalEnvironmentalData } from "@/lib/services/nasa-power";
import { GREEN_VALLEY_LOCATION } from "@/lib/config/location";
import { evaluateAllCrops } from "@/lib/crops/suitability-engine";

export async function GET() {
  try {
    // 1. Fetch real NASA POWER observations for Green Valley, AZ
    const telemetry = await getHistoricalEnvironmentalData(
      GREEN_VALLEY_LOCATION.latitude,
      GREEN_VALLEY_LOCATION.longitude,
      { locationName: GREEN_VALLEY_LOCATION.name }
    );

    // 2. Run deterministic evidence-based crop suitability evaluation
    const summary = evaluateAllCrops(telemetry);

    return NextResponse.json({
      status: "Success",
      summary,
      telemetry: {
        location: telemetry.location,
        retrievalTimestamp: telemetry.retrievalTimestamp,
        summaryStats: telemetry.summaryStats,
        latestObservation: telemetry.latestObservation,
        sourceName: telemetry.sourceName,
      },
    });
  } catch (error) {
    console.error("GET /api/crops error:", error);
    return NextResponse.json(
      {
        status: "Error",
        error:
          error instanceof Error
            ? error.message
            : "Failed to evaluate crop recommendations",
      },
      { status: 500 }
    );
  }
}
