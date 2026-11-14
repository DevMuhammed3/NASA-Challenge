import { NextRequest, NextResponse } from "next/server";
import { FarmerStorage } from "@/lib/farmer/farmer-storage";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const farmId = Number(searchParams.get("farmId") || "1");
    const preferences = FarmerStorage.getPreferences(farmId);
    return NextResponse.json({ status: "Success", preferences });
  } catch (err) {
    return NextResponse.json(
      { status: "Error", error: err instanceof Error ? err.message : "Failed to load preferences" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.farmId) {
      return NextResponse.json({ status: "Error", error: "farmId is required." }, { status: 400 });
    }

    const saved = FarmerStorage.upsertPreferences({
      farmId: body.farmId,
      primaryObjective: body.primaryObjective || "maximize_profit",
      preferredCropCodes: Array.isArray(body.preferredCropCodes) ? body.preferredCropCodes : [],
      excludedCropCodes: Array.isArray(body.excludedCropCodes) ? body.excludedCropCodes : [],
      maxSeasonalBudget: typeof body.maxSeasonalBudget === "number" ? body.maxSeasonalBudget : undefined,
      waterConstraintAcreFeet: typeof body.waterConstraintAcreFeet === "number" ? body.waterConstraintAcreFeet : undefined,
      laborConstraint: body.laborConstraint,
      preferredGrowingSeasons: Array.isArray(body.preferredGrowingSeasons) ? body.preferredGrowingSeasons : ["fall_winter", "spring"],
      targetMarkets: Array.isArray(body.targetMarkets) ? body.targetMarkets : ["wholesale_shipping"],
      riskTolerance: body.riskTolerance || "moderate",
    });

    return NextResponse.json({ status: "Success", preferences: saved });
  } catch (err) {
    return NextResponse.json(
      { status: "Error", error: err instanceof Error ? err.message : "Failed to save preferences" },
      { status: 500 }
    );
  }
}
