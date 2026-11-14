import { NextRequest, NextResponse } from "next/server";
import { getPhoenixVegetablePrices } from "@/lib/economics/usda-market-news";
import { getNassVegetableStats } from "@/lib/economics/usda-nass";
import {
  getOrCreateProductionBudget,
  UA_ENTERPRISE_BUDGETS,
} from "@/lib/economics/production-budgets";
import {
  calculateFarmFinancials,
  compareAllCropsEconomics,
  generateFinancialScenarios,
} from "@/lib/economics/financial-engine";
import { generateCostReductionOpportunities } from "@/lib/economics/cost-reduction-engine";
import { CROPS } from "@/lib/crop-requirements";
import {
  CropProductionBudget,
  FarmFinancialInputs,
  NassAgriculturalStat,
} from "@/lib/types/economics";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get("refresh") === "true";
    const selectedCropId = searchParams.get("cropId") || "tomato";
    const acreageParam = parseFloat(searchParams.get("acreage") || "1.0");
    const acreage = isNaN(acreageParam) || acreageParam <= 0 ? 1.0 : acreageParam;

    // 1. Fetch USDA MyMarketNews Report 2403 (Phoenix Shipping Point)
    const marketReport = await getPhoenixVegetablePrices(forceRefresh);

    // 2. Fetch USDA NASS Arizona agricultural statistics
    const nassResponse = await getNassVegetableStats();

    // Index NASS stats by cropId
    const nassLookup: Record<string, NassAgriculturalStat> = {};
    for (const stat of nassResponse.records) {
      nassLookup[stat.cropId] = stat;
    }

    // 3. Assemble all 15 crop production budgets
    const allBudgets: Record<string, CropProductionBudget> = {};
    for (const crop of CROPS) {
      allBudgets[crop.id] = getOrCreateProductionBudget(crop.id);
    }

    // 4. Run deterministic comparison across all 15 crops
    const cropComparison = compareAllCropsEconomics(
      marketReport.quotes,
      allBudgets,
      nassLookup
    );

    // 5. Selected Crop Calculations
    const targetCrop = CROPS.find((c) => c.id === selectedCropId) || CROPS[0];
    const cropId = targetCrop.id;
    const selectedBudget = allBudgets[cropId] || getOrCreateProductionBudget(cropId);
    const matchedPrice = marketReport.quotes.find((q) => q.matchedCropId === cropId);
    const nassStat = nassLookup[cropId];

    // Determine default or overridden yield
    const yieldParam = parseFloat(searchParams.get("expectedYieldPerAcreLbs") || "");
    const isUserYield = !isNaN(yieldParam) && yieldParam > 0;
    let expectedYield = isUserYield ? yieldParam : 0;
    let yieldSource = isUserYield ? "Farmer Input Override" : "";

    if (!expectedYield) {
      if (nassStat?.yieldPerAcre) {
        expectedYield = nassStat.yieldUnit.includes("CWT")
          ? nassStat.yieldPerAcre * 100
          : nassStat.yieldPerAcre;
        yieldSource = nassStat.dataSource;
      } else {
        const compItem = cropComparison.find((c) => c.cropId === cropId);
        expectedYield = compItem?.yieldPerAcreLbs || 0;
        yieldSource = "UArizona Cooperative Extension Baseline Budget";
      }
    }

    // Determine default or overridden price
    const priceParam = parseFloat(searchParams.get("sellingPricePerLb") || "");
    const isUserPrice = !isNaN(priceParam) && priceParam > 0;
    const sellingPrice = isUserPrice
      ? priceParam
      : matchedPrice
      ? matchedPrice.pricePerLb
      : 0;

    const priceSource = isUserPrice
      ? "Farmer Input Override"
      : matchedPrice
      ? `${matchedPrice.marketName} (${matchedPrice.grade})`
      : "Unavailable (Awaiting farmer selling price input)";

    // Determine marketable percent
    const mktParam = parseFloat(searchParams.get("marketablePercent") || "");
    const marketablePercent = !isNaN(mktParam) && mktParam > 0 && mktParam <= 100 ? mktParam : 85;

    const financialInputs: FarmFinancialInputs = {
      cropId,
      acreage,
      expectedYieldPerAcreLbs: expectedYield,
      marketablePercent,
      sellingPricePerLb: sellingPrice,
      sellingPriceUnitDescription: "$/lb",
      priceCategory: isUserPrice
        ? "Farm-Gate Price (Direct)"
        : "Shipping Point (Regional Wholesale Reference)",
      priceSource,
    };

    const selectedCropFinancials = calculateFarmFinancials(financialInputs, selectedBudget);
    const selectedCropScenarios = generateFinancialScenarios(financialInputs, selectedBudget);
    const costReductionOpportunities = generateCostReductionOpportunities(cropId, selectedBudget);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      location: {
        name: "Green Valley, Arizona, USA",
        latitude: 31.8543,
        longitude: -111.0,
      },
      marketReport,
      nassData: {
        status: nassResponse.status,
        dataSource: nassResponse.sourceAttribution,
        stats: nassResponse.records,
        historicalNotes: nassResponse.geographicTransparencyNotice,
      },
      selectedCropFinancials,
      selectedCropScenarios,
      costReductionOpportunities,
      cropComparison,
      availableBudgetsCount: Object.keys(UA_ENTERPRISE_BUDGETS).length,
      totalCropsEvaluated: CROPS.length,
    });
  } catch (error) {
    console.error("Error in /api/economics:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to compute economics data",
      },
      { status: 500 }
    );
  }
}
