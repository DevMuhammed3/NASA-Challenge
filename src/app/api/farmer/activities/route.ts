import { NextRequest, NextResponse } from "next/server";
import { FarmerStorage } from "@/lib/farmer/farmer-storage";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const seasonId = searchParams.get("seasonId") ? Number(searchParams.get("seasonId")) : undefined;
    const activities = FarmerStorage.getActivities(seasonId);
    return NextResponse.json({ status: "Success", activities });
  } catch (err) {
    return NextResponse.json(
      { status: "Error", error: err instanceof Error ? err.message : "Failed to load activities" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.seasonId || !body.activityType || !body.activityDate) {
      return NextResponse.json(
        { status: "Error", error: "seasonId, activityType, and activityDate are required." },
        { status: 400 }
      );
    }

    const activity = FarmerStorage.addActivity({
      seasonId: body.seasonId,
      activityType: body.activityType,
      activityDate: body.activityDate,
      quantity: typeof body.quantity === "number" ? body.quantity : undefined,
      unit: body.unit,
      notes: body.notes,
      documentId: body.documentId,
    });

    return NextResponse.json({ status: "Success", activity });
  } catch (err) {
    return NextResponse.json(
      { status: "Error", error: err instanceof Error ? err.message : "Failed to record activity" },
      { status: 500 }
    );
  }
}
