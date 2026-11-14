import { NextRequest, NextResponse } from "next/server";
import { FarmerStorage } from "@/lib/farmer/farmer-storage";

export async function GET() {
  try {
    const feedbacks = FarmerStorage.getFeedbacks();
    const harvests = FarmerStorage.getHarvests();
    return NextResponse.json({ status: "Success", feedbacks, harvests });
  } catch (err) {
    return NextResponse.json(
      { status: "Error", error: err instanceof Error ? err.message : "Failed to load feedback" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Check if harvest record or recommendation feedback
    if (body.type === "harvest") {
      if (!body.seasonId || typeof body.actualYield !== "number" || typeof body.realizedPricePerUnit !== "number") {
        return NextResponse.json(
          { status: "Error", error: "seasonId, actualYield, and realizedPricePerUnit are required for harvest log." },
          { status: 400 }
        );
      }

      const totalRevenue = body.actualYield * body.realizedPricePerUnit;
      const totalCosts = typeof body.totalActualCosts === "number" ? body.totalActualCosts : 0;
      const netProfit = totalRevenue - totalCosts;

      const record = FarmerStorage.addHarvest({
        seasonId: body.seasonId,
        harvestDate: body.harvestDate || new Date().toISOString().split("T")[0],
        actualYield: body.actualYield,
        yieldUnit: body.yieldUnit || "lbs/acre",
        marketableYieldPercent: typeof body.marketableYieldPercent === "number" ? body.marketableYieldPercent : 85,
        realizedPricePerUnit: body.realizedPricePerUnit,
        totalRevenue: Math.round(totalRevenue),
        totalActualCosts: Math.round(totalCosts),
        actualNetProfit: Math.round(netProfit),
        farmerSatisfaction: body.farmerSatisfaction || "satisfied",
        productionChallenges: body.productionChallenges,
      });

      return NextResponse.json({ status: "Success", harvest: record });
    }

    // Recommendation decision feedback
    if (!body.cropCode || !body.action) {
      return NextResponse.json(
        { status: "Error", error: "cropCode and action (accepted/rejected) are required." },
        { status: 400 }
      );
    }

    const feedback = FarmerStorage.addFeedback({
      recommendationId: body.recommendationId || 1,
      cropCode: body.cropCode,
      action: body.action,
      reason: body.reason,
      feedbackNotes: body.feedbackNotes,
    });

    return NextResponse.json({ status: "Success", feedback });
  } catch (err) {
    return NextResponse.json(
      { status: "Error", error: err instanceof Error ? err.message : "Failed to save feedback" },
      { status: 500 }
    );
  }
}
