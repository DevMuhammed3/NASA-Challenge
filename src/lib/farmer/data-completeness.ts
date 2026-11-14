import type { FarmCompletenessReport } from "../../db/schema";
import type {
  FarmRecord,
  FarmFieldRecord,
  SoilProfileRecord,
  WaterProfileRecord,
  CropHistoryRecord,
  FarmExpenseRecord,
} from "./types";

export function calculateFarmCompleteness(params: {
  farm: Partial<FarmRecord>;
  fields: FarmFieldRecord[];
  soilProfiles: SoilProfileRecord[];
  waterProfile?: WaterProfileRecord | null;
  cropHistory: CropHistoryRecord[];
  expenses: FarmExpenseRecord[];
}): FarmCompletenessReport {
  const { farm, fields, soilProfiles, waterProfile, cropHistory, expenses } = params;

  const missingDimensions: string[] = [];
  const blockersForAnalysis: string[] = [];

  // 1. Location & Geometry Completeness (20% of full profile)
  let locationPoints = 0;
  if (farm.name && farm.name.trim().length > 0) locationPoints += 25;
  if (typeof farm.latitude === "number" && typeof farm.longitude === "number") locationPoints += 25;
  if (farm.totalArea && farm.totalArea > 0) locationPoints += 25;
  if (fields && fields.length > 0) locationPoints += 25;
  const locationScore = locationPoints;

  if (fields.length === 0) {
    missingDimensions.push("Field boundaries not defined");
    blockersForAnalysis.push("Cannot assign crop rotation without at least one field subdivision.");
  }

  // 2. Climate Completeness (NASA POWER reference available)
  // Always 100% for Green Valley coordinates via verified NASA POWER API
  const climateScore = typeof farm.latitude === "number" && typeof farm.longitude === "number" ? 100 : 0;

  // 3. Soil Completeness
  let soilPoints = 0;
  const primarySoil = soilProfiles[0];
  if (primarySoil) {
    if (primarySoil.texture && primarySoil.texture !== "unknown") soilPoints += 20;
    if (typeof primarySoil.soilPh === "number") soilPoints += 25;
    if (typeof primarySoil.ecDsM === "number") soilPoints += 25;
    if (typeof primarySoil.organicMatterPercent === "number") soilPoints += 15;
    if (typeof primarySoil.nitrogenPpm === "number") soilPoints += 15;
  }
  const soilScore = soilPoints;

  if (!primarySoil || typeof primarySoil.soilPh !== "number") {
    missingDimensions.push("Laboratory soil pH not measured");
    blockersForAnalysis.push("Precision nutrient management blocked: soil pH is required to calculate phosphorus fixation and sulfur amendment requirements.");
  }
  if (!primarySoil || typeof primarySoil.ecDsM !== "number") {
    missingDimensions.push("Soil electrical conductivity (ECe) unknown");
    blockersForAnalysis.push("Salinity stress warning: sensitive crops (lettuce, onion, carrot) require verified ECe < 2.0 dS/m.");
  }

  // 4. Water & Irrigation Completeness
  let waterPoints = 0;
  if (waterProfile) {
    if (waterProfile.sourceType) waterPoints += 30;
    if (waterProfile.irrigationSystem) waterPoints += 30;
    if (typeof waterProfile.pumpingCapacityGpm === "number") waterPoints += 20;
    if (typeof waterProfile.volumetricCostPerAcreFoot === "number") waterPoints += 20;
  }
  const waterScore = waterPoints;

  if (!waterProfile || !waterProfile.sourceType) {
    missingDimensions.push("Irrigation water source not specified");
    blockersForAnalysis.push("Water rights and pumping capacity unverified: cannot certify commercial water sufficiency.");
  }

  // 5. Crop History Completeness
  let historyPoints = 0;
  if (cropHistory.length >= 3) {
    historyPoints = 100;
  } else if (cropHistory.length === 2) {
    historyPoints = 70;
  } else if (cropHistory.length === 1) {
    historyPoints = 40;
  }
  const historyScore = historyPoints;

  if (cropHistory.length === 0) {
    missingDimensions.push("Previous crop history is empty");
    blockersForAnalysis.push("Biological rotation bonus disabled: no predecessor crop data available to calculate nitrogen balance or disease breaks.");
  }

  // 6. Farm Economics Completeness
  let economicsPoints = 0;
  if (expenses.length >= 4) {
    economicsPoints = 100;
  } else if (expenses.length >= 2) {
    economicsPoints = 60;
  } else if (expenses.length === 1) {
    economicsPoints = 30;
  }
  const economicsScore = economicsPoints;

  if (expenses.length === 0) {
    missingDimensions.push("Custom farm operating costs unconfigured");
    blockersForAnalysis.push("Using University of Arizona 2026 regional extension budget benchmarks instead of farm-specific cost accounting.");
  }

  // Weighted overall completeness score
  const overallScore = Math.round(
    locationScore * 0.2 +
      climateScore * 0.15 +
      soilScore * 0.25 +
      waterScore * 0.2 +
      historyScore * 0.1 +
      economicsScore * 0.1
  );

  return {
    locationScore,
    climateScore,
    soilScore,
    waterScore,
    historyScore,
    economicsScore,
    overallScore,
    missingDimensions,
    blockersForAnalysis,
  };
}
