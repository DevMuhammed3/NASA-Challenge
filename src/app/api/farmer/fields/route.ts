import { NextRequest, NextResponse } from "next/server";
import { FarmerStorage } from "@/lib/farmer/farmer-storage";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const farmId = Number(searchParams.get("farmId") || "1");
    const fields = FarmerStorage.getFields(farmId);
    return NextResponse.json({ status: "Success", fields });
  } catch (err) {
    return NextResponse.json(
      { status: "Error", error: err instanceof Error ? err.message : "Failed to load fields" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.farmId || !body.name || typeof body.area !== "number") {
      return NextResponse.json(
        { status: "Error", error: "farmId, name, and area are required." },
        { status: 400 }
      );
    }

    const newField = FarmerStorage.addField({
      farmId: body.farmId,
      name: body.name,
      area: body.area,
      areaUnit: body.areaUnit || "acre",
      boundaryGeojson: body.boundaryGeojson,
      currentCrop: body.currentCrop || null,
      soilType: body.soilType || null,
      irrigationType: body.irrigationType || "drip",
      isActive: body.isActive !== undefined ? body.isActive : true,
    });

    // Also register soil profile if provided
    if (body.soilProfile) {
      FarmerStorage.upsertSoilProfile({
        fieldId: newField.id,
        texture: body.soilProfile.texture || "unknown",
        soilPh: body.soilProfile.soilPh,
        ecDsM: body.soilProfile.ecDsM,
        organicMatterPercent: body.soilProfile.organicMatterPercent,
        nitrogenPpm: body.soilProfile.nitrogenPpm,
        phosphorusPpm: body.soilProfile.phosphorusPpm,
        potassiumPpm: body.soilProfile.potassiumPpm,
        drainageClass: body.soilProfile.drainageClass || "well_drained",
        salinityRisk: body.soilProfile.salinityRisk || "unknown",
        provenanceStatus: body.soilProfile.provenanceStatus || "farmer_reported",
      });
    }

    return NextResponse.json({ status: "Success", field: newField });
  } catch (err) {
    return NextResponse.json(
      { status: "Error", error: err instanceof Error ? err.message : "Failed to add field" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ status: "Error", error: "Field id is required." }, { status: 400 });
    }

    const updated = FarmerStorage.updateField(body.id, body);
    if (!updated) {
      return NextResponse.json({ status: "Error", error: "Field not found" }, { status: 404 });
    }

    return NextResponse.json({ status: "Success", field: updated });
  } catch (err) {
    return NextResponse.json(
      { status: "Error", error: err instanceof Error ? err.message : "Failed to update field" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));
    if (!id) {
      return NextResponse.json({ status: "Error", error: "id is required." }, { status: 400 });
    }

    const success = FarmerStorage.deleteField(id);
    return NextResponse.json({ status: "Success", deleted: success });
  } catch (err) {
    return NextResponse.json(
      { status: "Error", error: err instanceof Error ? err.message : "Failed to delete field" },
      { status: 500 }
    );
  }
}
