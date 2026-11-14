import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { crops, farmAnalyses } from "@/db/schema";
import {
  INITIAL_CROPS_SEED,
  FARM_PRESETS,
  acquireNasaAndSoilData,
  evaluateCropSuitability,
  generateCropRotationPlan,
  generateClimateAlerts,
  type CropSeedItem,
} from "@/lib/gaia-engine";
import { ensureGaiaDatabaseSeeded, getLatestAnalysesList } from "@/lib/db-seed";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    await ensureGaiaDatabaseSeeded();
    const analyses = await getLatestAnalysesList(10);
    const dbCrops = await db.select().from(crops);

    return NextResponse.json({
      status: "Success",
      analyses,
      crops: dbCrops.length > 0 ? dbCrops : INITIAL_CROPS_SEED,
      presets: FARM_PRESETS,
    });
  } catch (error) {
    console.error("GET /api/analyze error:", error);
    return NextResponse.json(
      {
        status: "Error",
        message:
          error instanceof Error ? error.message : "Failed to load farm analyses",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureGaiaDatabaseSeeded();
    const body = await req.json();

    const lat = Number(body.lat ?? 30.0444);
    const lon = Number(body.lon ?? 31.2357);

    if (
      Number.isNaN(lat) ||
      Number.isNaN(lon) ||
      lat < -65 ||
      lat > 75 ||
      lon < -180 ||
      lon > 180
    ) {
      return NextResponse.json(
        {
          status: "Error",
          message: "إحداثيات الموقع غير صالحة (Invalid Latitude/Longitude).",
        },
        { status: 400 }
      );
    }

    const previousCropCode: string | null = body.previousCropCode || null;
    const areaFeddans = Math.max(1, Number(body.areaFeddans ?? 12));
    const startMonth =
      typeof body.startMonth === "number" ? body.startMonth : undefined;

    // Match preset name if close to a preset, or use custom name
    const matchedPreset = FARM_PRESETS.find(
      (p) => Math.abs(p.lat - lat) < 0.08 && Math.abs(p.lon - lon) < 0.08
    );

    const farmName: string =
      body.farmName?.trim() ||
      matchedPreset?.nameAr ||
      `مزرعة عند (${lat.toFixed(3)}°N, ${lon.toFixed(3)}°E)`;

    const regionName: string =
      body.regionName?.trim() ||
      matchedPreset?.regionAr ||
      `نطاق جغرافي (${lat.toFixed(4)}, ${lon.toFixed(4)})`;

    // 1. Acquire NASA POWER & SoilGrids telemetry
    const telemetry = await acquireNasaAndSoilData(lat, lon, startMonth);

    // 2. Load crops knowledge base from PostgreSQL (or seed fallback)
    const dbCrops = await db.select().from(crops);
    const cropCatalog: CropSeedItem[] =
      dbCrops.length > 0
        ? dbCrops.map((c) => ({
            code: c.code,
            nameAr: c.nameAr,
            nameEn: c.nameEn,
            scientificName: c.scientificName,
            family: c.family,
            familyAr: c.familyAr,
            tempMin: c.tempMin,
            tempMax: c.tempMax,
            tempOpt: c.tempOpt,
            phMin: c.phMin,
            phMax: c.phMax,
            phOpt: c.phOpt,
            humidityMin: c.humidityMin,
            humidityMax: c.humidityMax,
            waterNeed: c.waterNeed as "low" | "medium" | "high",
            salinityTolerance: c.salinityTolerance as "low" | "medium" | "high",
            growthDurationDays: c.growthDurationDays,
            rootDepth: c.rootDepth as "shallow" | "medium" | "deep",
            weightTemp: c.weightTemp,
            weightPh: c.weightPh,
            weightMoisture: c.weightMoisture,
            expectedYieldTonHa: c.expectedYieldTonHa,
            nutrientsNpk: c.nutrientsNpk,
            rotationRules: c.rotationRules,
            descriptionAr: c.descriptionAr,
            descriptionEn: c.descriptionEn,
          }))
        : INITIAL_CROPS_SEED;

    // 3. Run Suitability Scoring Engine
    const recommendations = evaluateCropSuitability(
      cropCatalog,
      telemetry,
      previousCropCode
    );

    // 4. Run 3-Season Crop Rotation Planner
    const rotationPlan = generateCropRotationPlan(
      recommendations,
      previousCropCode
    );

    // 5. Generate Agro-Climatic Early Warnings
    const climateAlerts = generateClimateAlerts(telemetry, recommendations[0]);

    // 6. Persist analysis report in PostgreSQL
    const [inserted] = await db
      .insert(farmAnalyses)
      .values({
        farmName,
        regionName,
        latitude: Number(lat.toFixed(4)),
        longitude: Number(lon.toFixed(4)),
        areaFeddans,
        previousCropCode,
        avgTemp3Mo: telemetry.avgTemp3Mo,
        maxTemp3Mo: telemetry.maxTemp3Mo,
        minTemp3Mo: telemetry.minTemp3Mo,
        relativeHumidity: telemetry.relativeHumidity,
        soilPh: telemetry.soilPh,
        totalPrecip3Mo: telemetry.totalPrecip3Mo,
        soilMoistureSurface: telemetry.soilMoistureSurface,
        soilMoistureRoot: telemetry.soilMoistureRoot,
        solarRadiation: telemetry.solarRadiation,
        ndviIndex: telemetry.ndviIndex,
        soilTextureAr: telemetry.soilTextureAr,
        soilTextureEn: telemetry.soilTextureEn,
        organicCarbonGkg: telemetry.organicCarbonGkg,
        salinityEc: telemetry.salinityEc,
        dataSourceStatus: telemetry.dataSourceStatus,
        forecast3Months: telemetry.forecast3Months,
        recommendations,
        rotationPlan,
        climateAlerts,
        rawNasaPayload: telemetry.rawNasaPayload,
      })
      .returning();

    const analyses = await getLatestAnalysesList(10);

    return NextResponse.json({
      status: "Success",
      analysis: inserted,
      analyses,
    });
  } catch (error) {
    console.error("POST /api/analyze error:", error);
    return NextResponse.json(
      {
        status: "Error",
        message:
          error instanceof Error ? error.message : "Failed to analyze field",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));
    if (!id || Number.isNaN(id)) {
      return NextResponse.json(
        { status: "Error", message: "Invalid analysis ID" },
        { status: 400 }
      );
    }
    await db.delete(farmAnalyses).where(eq(farmAnalyses.id, id));
    const analyses = await getLatestAnalysesList(10);
    return NextResponse.json({ status: "Success", analyses });
  } catch (error) {
    console.error("DELETE /api/analyze error:", error);
    return NextResponse.json(
      { status: "Error", message: "Failed to delete analysis" },
      { status: 500 }
    );
  }
}
