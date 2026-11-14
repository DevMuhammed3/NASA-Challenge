import { NextRequest, NextResponse } from "next/server";
import { FarmerStorage } from "@/lib/farmer/farmer-storage";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fieldId = searchParams.get("fieldId") ? Number(searchParams.get("fieldId")) : undefined;
    const seasons = FarmerStorage.getSeasons(fieldId);
    return NextResponse.json({ status: "Success", seasons });
  } catch (err) {
    return NextResponse.json(
      { status: "Error", error: err instanceof Error ? err.message : "Failed to load seasons" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.fieldId || !body.cropCode || !body.cropName || !body.startDate || !body.expectedHarvestDate) {
      return NextResponse.json(
        { status: "Error", error: "fieldId, cropCode, cropName, startDate, and expectedHarvestDate are required." },
        { status: 400 }
      );
    }

    const season = FarmerStorage.addSeason({
      fieldId: body.fieldId,
      seasonName: body.seasonName || `${body.cropName} Season`,
      cropCode: body.cropCode,
      cropName: body.cropName,
      startDate: body.startDate,
      expectedHarvestDate: body.expectedHarvestDate,
      actualHarvestDate: body.actualHarvestDate,
      cultivatedAreaAcre: typeof body.cultivatedAreaAcre === "number" ? body.cultivatedAreaAcre : 1.0,
      status: body.status || "active",
    });

    return NextResponse.json({ status: "Success", season });
  } catch (err) {
    return NextResponse.json(
      { status: "Error", error: err instanceof Error ? err.message : "Failed to add season" },
      { status: 500 }
    );
  }
}
