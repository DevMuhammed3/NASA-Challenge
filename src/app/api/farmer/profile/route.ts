import { NextRequest, NextResponse } from "next/server";
import { FarmerStorage } from "@/lib/farmer/farmer-storage";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const farmerId = searchParams.get("farmerId") || "farmer_green_valley_default";
    const farmIdParam = searchParams.get("farmId");

    if (farmIdParam) {
      const farm = FarmerStorage.getFarm(Number(farmIdParam), farmerId);
      if (!farm) {
        return NextResponse.json({ status: "Error", error: "Farm not found" }, { status: 404 });
      }
      return NextResponse.json({ status: "Success", farm });
    }

    const farms = FarmerStorage.getFarmerFarms(farmerId);
    return NextResponse.json({ status: "Success", farms });
  } catch (err) {
    return NextResponse.json(
      { status: "Error", error: err instanceof Error ? err.message : "Failed to load farm profile" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || !body.regionName) {
      return NextResponse.json(
        { status: "Error", error: "Farm name and region are required." },
        { status: 400 }
      );
    }

    const farmerId = body.farmerId || "farmer_green_valley_default";
    const farm = FarmerStorage.createFarm({
      farmerId,
      name: body.name,
      regionName: body.regionName,
      latitude: typeof body.latitude === "number" ? body.latitude : 31.8543,
      longitude: typeof body.longitude === "number" ? body.longitude : -111.0,
      boundaryGeojson: body.boundaryGeojson,
      totalArea: typeof body.totalArea === "number" ? body.totalArea : 10,
      areaUnit: body.areaUnit || "acre",
      productionType: body.productionType || "open_field",
      description: body.description || "",
    });

    return NextResponse.json({ status: "Success", farm });
  } catch (err) {
    return NextResponse.json(
      { status: "Error", error: err instanceof Error ? err.message : "Failed to create farm" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ status: "Error", error: "Farm id is required" }, { status: 400 });
    }

    const updated = FarmerStorage.updateFarm(body.id, body, body.farmerId);
    if (!updated) {
      return NextResponse.json({ status: "Error", error: "Farm not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ status: "Success", farm: updated });
  } catch (err) {
    return NextResponse.json(
      { status: "Error", error: err instanceof Error ? err.message : "Failed to update farm" },
      { status: 500 }
    );
  }
}
