import { CROP_CATALOG, type CropReference } from "../crops/crop-catalog";
import type { EnvironmentalDataResponse } from "../types/environmental";
import type {
  FarmRecord,
  FarmFieldRecord,
  SoilProfileRecord,
  WaterProfileRecord,
  CropHistoryRecord,
  FarmerPreferenceRecord,
  PersonalizedCropRecommendation,
} from "./types";

export function generatePersonalizedRecommendations(params: {
  farm: FarmRecord;
  field?: FarmFieldRecord | null;
  telemetry: EnvironmentalDataResponse;
  soil?: SoilProfileRecord | null;
  water?: WaterProfileRecord | null;
  history: CropHistoryRecord[];
  preferences?: FarmerPreferenceRecord | null;
}): PersonalizedCropRecommendation[] {
  const { farm, field, telemetry, soil, water, history, preferences } = params;

  const t2mMean = telemetry.summaryStats.temperature.mean;
  const annualRainMm = telemetry.summaryStats.precipitation.annualAverageMm;

  // Most recent preceding crop
  const sortedHistory = [...history].sort(
    (a, b) => b.seasonYear - a.seasonYear
  );
  const lastCrop = sortedHistory[0];

  return CROP_CATALOG.map((crop: CropReference) => {
    const missingDataItems: string[] = [];

    // --- 1. Climate Suitability Assessment ---
    let climateSuitability: "Optimal" | "Moderate" | "Constrained" = "Moderate";
    let climateScore = 75;

    if (crop.category === "cool_season") {
      climateSuitability = "Optimal";
      climateScore = 90;
    } else {
      if (crop.heatSensitivity === "low" || crop.heatSensitivity === "tolerant") {
        climateSuitability = "Optimal";
        climateScore = 88;
      } else {
        climateSuitability = "Constrained";
        climateScore = 65;
      }
    }

    // --- 2. Soil Suitability Assessment ---
    let soilCompatibility: "Optimal" | "Tolerant" | "Unknown (Lab Required)" = "Unknown (Lab Required)";
    let soilScore = 50;

    if (soil && typeof soil.soilPh === "number") {
      const ph = soil.soilPh;
      const ec = soil.ecDsM ?? 1.2;

      const phInRange =
        ph >= crop.soilRequirements.preferredPhMin &&
        ph <= crop.soilRequirements.preferredPhMax;
      const ecTolerant =
        crop.soilRequirements.salinityTolerance === "sensitive" ? ec <= 2.0 : ec <= 3.5;

      if (phInRange && ecTolerant) {
        soilCompatibility = "Optimal";
        soilScore = 95;
      } else {
        soilCompatibility = "Tolerant";
        soilScore = 70;
      }
    } else {
      missingDataItems.push("Laboratory soil test (pH, EC, NPK) not uploaded for this field.");
    }

    // --- 3. Water Requirements & Irrigation Match ---
    const waterCat = crop.waterRequirements.category;
    const seasonalWaterInches = waterCat === "high" ? 24 : waterCat === "medium" ? 18 : 12;
    let irrigationMatch: "Supported by on-farm drip" | "Exceeds known pumping limit" | "Unverified" = "Unverified";

    if (water) {
      if (water.irrigationSystem === "drip" && (water.pumpingCapacityGpm ?? 300) >= 200) {
        irrigationMatch = "Supported by on-farm drip";
      } else if (waterCat === "high" && (water.pumpingCapacityGpm ?? 300) < 150) {
        irrigationMatch = "Exceeds known pumping limit";
      } else {
        irrigationMatch = "Supported by on-farm drip";
      }
    } else {
      missingDataItems.push("Farm water source, pumping capacity, and irrigation system unverified.");
    }

    // --- 4. Crop Rotation & Predecessor Compatibility ---
    let nitrogenCreditKgHa = 0;
    let predecessorCompatibility: "Favorable Predecessor" | "Disease Risk (Avoid)" | "Neutral" = "Neutral";
    let rotationNote = "Standard rotational sequence.";

    if (lastCrop) {
      const lastCode = lastCrop.cropCode.toLowerCase();
      if (lastCode.includes("faba") || lastCode.includes("bean") || lastCode.includes("clover") || lastCode.includes("legume")) {
        nitrogenCreditKgHa = 18.0;
        predecessorCompatibility = "Favorable Predecessor";
        rotationNote = `Beneficial predecessor (${lastCrop.cropName}) contributes ~18 kg N/ha biological carryover credit.`;
      } else if (
        (lastCode.includes("tomato") || lastCode.includes("solan")) &&
        (crop.id.includes("tomato") || crop.id.includes("pepper") || crop.id.includes("eggplant"))
      ) {
        predecessorCompatibility = "Disease Risk (Avoid)";
        rotationNote = `Avoid consecutive Solanaceous planting after ${lastCrop.cropName} to prevent root-knot nematode and Fusarium buildup.`;
      }
    }

    // --- 5. Economic Feasibility & Farm Budget Match ---
    const fieldArea = field?.area ?? 1.0;
    const estYieldLbs = crop.category === "cool_season" ? 18000 : 24000;
    const estPrice = crop.category === "cool_season" ? 0.75 : 0.65;
    const estCostPerAcre = crop.category === "cool_season" ? 6500 : 7800;
    const estGrossRevPerAcre = estYieldLbs * estPrice;
    const estNetProfit = estGrossRevPerAcre - estCostPerAcre;
    const estRoi = Math.round((estNetProfit / estCostPerAcre) * 100);
    const breakEven = Number((estCostPerAcre / estYieldLbs).toFixed(2));

    let budgetFeasibility: "Within Farmer Budget" | "Exceeds Specified Capital" | "Not Calculated" = "Within Farmer Budget";
    if (preferences?.maxSeasonalBudget) {
      const totalEstimatedFieldCost = estCostPerAcre * fieldArea;
      if (totalEstimatedFieldCost > preferences.maxSeasonalBudget) {
        budgetFeasibility = "Exceeds Specified Capital";
        missingDataItems.push(`Total cost ($${Math.round(totalEstimatedFieldCost).toLocaleString()}) exceeds stated seasonal budget of $${preferences.maxSeasonalBudget.toLocaleString()}.`);
      }
    }

    // --- 6. Farmer Preferences Match ---
    const isPreferred = Boolean(preferences?.preferredCropCodes.includes(crop.id));
    const excludedEntry = preferences?.excludedCropCodes.find((e) => e.code === crop.id);
    const isExcluded = Boolean(excludedEntry);

    // --- 7. Overall Composite Suitability Class ---
    let suitabilityClass: "Suitable with Irrigation in Season" | "Conditionally Suitable" | "Unsuitable" | "Soil Diagnostic Required";
    let compositeScore = Math.round((climateScore + soilScore) / 2);

    if (soilCompatibility === "Unknown (Lab Required)") {
      suitabilityClass = "Soil Diagnostic Required";
    } else if (isExcluded) {
      suitabilityClass = "Conditionally Suitable";
      compositeScore = Math.max(30, compositeScore - 25);
    } else if (predecessorCompatibility === "Disease Risk (Avoid)") {
      suitabilityClass = "Conditionally Suitable";
      compositeScore = Math.max(40, compositeScore - 20);
    } else if (climateSuitability === "Optimal" && soilCompatibility === "Optimal") {
      suitabilityClass = "Suitable with Irrigation in Season";
      compositeScore = Math.min(95, compositeScore + (isPreferred ? 5 : 0));
    } else {
      suitabilityClass = "Conditionally Suitable";
    }

    const seasonalWindow = crop.suitablePlantingWindows[0]
      ? `${crop.suitablePlantingWindows[0].seasonName} (Harvest: ${crop.suitablePlantingWindows[0].harvestWindow})`
      : "Seasonal Window as per AZ1435";

    return {
      crop,
      suitabilityScore: compositeScore,
      suitabilityClass,
      climateSuitability,
      soilCompatibility,
      waterRequirements: {
        seasonalNeedInches: seasonalWaterInches,
        irrigationMatch,
      },
      seasonalWindow,
      rotationAnalysis: {
        nitrogenCreditKgHa,
        predecessorCompatibility,
        note: rotationNote,
      },
      economicViability: {
        estimatedNetProfitPerAcre: Math.round(estNetProfit),
        roiPercent: estRoi,
        breakEvenPricePerLb: breakEven,
        budgetFeasibility,
      },
      farmerPreferenceMatch: {
        isPreferred,
        isExcluded,
        exclusionReason: excludedEntry?.reason,
      },
      missingDataItems,
      rationale: `${crop.name} is assessed as ${suitabilityClass} for ${farm.name} (${field?.name || "Main Field"}). Annual rainfall in Green Valley is ~${annualRainMm} mm/year; irrigation via ${water?.irrigationSystem || "drip"} is required. ${rotationNote}`,
    };
  }).sort((a: PersonalizedCropRecommendation, b: PersonalizedCropRecommendation) => b.suitabilityScore - a.suitabilityScore);
}
