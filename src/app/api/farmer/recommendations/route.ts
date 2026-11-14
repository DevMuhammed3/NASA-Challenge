import { NextRequest, NextResponse } from "next/server";
import { FarmerStorage } from "@/lib/farmer/farmer-storage";
import { getHistoricalEnvironmentalData } from "@/lib/services/nasa-power";
import { generatePersonalizedRecommendations } from "@/lib/farmer/personalized-recommendations";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const farmId = Number(searchParams.get("farmId") || "1");
    const fieldIdParam = searchParams.get("fieldId");

    const farm = FarmerStorage.getFarm(farmId);
    if (!farm) {
      return NextResponse.json({ status: "Error", error: "Farm not found" }, { status: 404 });
    }

    const fields = FarmerStorage.getFields(farmId);
    const selectedField = fieldIdParam
      ? fields.find((f) => f.id === Number(fieldIdParam)) || fields[0]
      : fields[0] || null;

    const soil = selectedField ? FarmerStorage.getSoilProfile(selectedField.id) : null;
    const water = FarmerStorage.getWaterProfile(farmId);
    const history = selectedField ? FarmerStorage.getCropHistory(selectedField.id) : [];
    const preferences = FarmerStorage.getPreferences(farmId);

    // Fetch verified NASA observations for the farm's actual centroid
    const telemetry = await getHistoricalEnvironmentalData(farm.latitude, farm.longitude, {
      locationName: farm.regionName,
    });

    const recommendations = generatePersonalizedRecommendations({
      farm,
      field: selectedField,
      telemetry,
      soil,
      water,
      history,
      preferences,
    });

    return NextResponse.json({
      status: "Success",
      farmId,
      fieldId: selectedField?.id,
      fieldName: selectedField?.name || "All Farm Acreage",
      totalCropsEvaluated: recommendations.length,
      recommendations,
      completeness: farm.completeness,
      telemetrySummary: {
        provider: telemetry.sourceName,
        t2mMean: telemetry.summaryStats.temperature.mean,
        annualPrecipMm: telemetry.summaryStats.precipitation.annualAverageMm,
        solarRadiation: telemetry.summaryStats.solar.meanMjM2Day,
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: "Error",
        error: err instanceof Error ? err.message : "Failed to compute personalized recommendations",
      },
      { status: 500 }
    );
  }
}
