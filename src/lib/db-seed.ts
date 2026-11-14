import { db } from "@/db";
import { crops, farmAnalyses } from "@/db/schema";
import {
  INITIAL_CROPS_SEED,
  FARM_PRESETS,
  acquireNasaAndSoilData,
  evaluateCropSuitability,
  generateCropRotationPlan,
  generateClimateAlerts,
} from "./gaia-engine";
import { count, desc } from "drizzle-orm";

let isSeeding = false;

export async function ensureGaiaDatabaseSeeded() {
  if (isSeeding) return;
  try {
    const existingCropsCount = await db.select({ value: count() }).from(crops);
    const totalCrops = Number(existingCropsCount[0]?.value ?? 0);

    if (totalCrops === 0) {
      isSeeding = true;
      await db
        .insert(crops)
        .values(
          INITIAL_CROPS_SEED.map((c) => ({
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
            waterNeed: c.waterNeed,
            salinityTolerance: c.salinityTolerance,
            growthDurationDays: c.growthDurationDays,
            rootDepth: c.rootDepth,
            weightTemp: c.weightTemp,
            weightPh: c.weightPh,
            weightMoisture: c.weightMoisture,
            expectedYieldTonHa: c.expectedYieldTonHa,
            nutrientsNpk: c.nutrientsNpk,
            rotationRules: c.rotationRules,
            descriptionAr: c.descriptionAr,
            descriptionEn: c.descriptionEn,
          }))
        )
        .onConflictDoNothing();
    }

    const existingAnalysesCount = await db
      .select({ value: count() })
      .from(farmAnalyses);
    const totalAnalyses = Number(existingAnalysesCount[0]?.value ?? 0);

    if (totalAnalyses === 0) {
      isSeeding = true;
      const defaultPreset = FARM_PRESETS[0]; // Nile Delta - Kafr El-Sheikh
      const telemetry = await acquireNasaAndSoilData(
        defaultPreset.lat,
        defaultPreset.lon
      );
      const recommendations = evaluateCropSuitability(
        INITIAL_CROPS_SEED,
        telemetry,
        defaultPreset.defaultPreviousCrop
      );
      const rotationPlan = generateCropRotationPlan(
        recommendations,
        defaultPreset.defaultPreviousCrop
      );
      const climateAlerts = generateClimateAlerts(telemetry, recommendations[0]);

      await db.insert(farmAnalyses).values({
        farmName: defaultPreset.nameAr,
        regionName: defaultPreset.regionAr,
        latitude: defaultPreset.lat,
        longitude: defaultPreset.lon,
        areaFeddans: 15,
        previousCropCode: defaultPreset.defaultPreviousCrop,
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
      });
    }
  } catch (err) {
    console.error("Database seed notice:", err);
  } finally {
    isSeeding = false;
  }
}

export async function getLatestAnalysesList(limitCount = 8) {
  await ensureGaiaDatabaseSeeded();
  return db
    .select()
    .from(farmAnalyses)
    .orderBy(desc(farmAnalyses.createdAt))
    .limit(limitCount);
}
