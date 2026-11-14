import {
  CostBreakdownItem,
  CropEconomicComparisonItem,
  CropProductionBudget,
  FarmFinancialInputs,
  FarmFinancialResults,
  FinancialScenario,
  NassAgriculturalStat,
  PriceCategory,
  ScenarioType,
  UsdaMarketPriceItem,
} from "../types/economics";
import { CROP_CATALOG as CROPS } from "../crops/crop-catalog";

/**
 * Deterministic Financial Calculation Engine for GAIA
 *
 * Implements strict, mathematical agricultural budgeting without AI estimation:
 * - Gross Revenue = Marketable Yield (lbs) * Selling Price ($/lb)
 * - Marketable Yield = Gross Yield * (Marketable % / 100)
 * - Variable Costs = Σ variable costs per acre * acreage
 * - Fixed Costs = Σ fixed costs per acre * acreage
 * - Total Costs = Variable Costs + Fixed Costs
 * - Gross Margin = Gross Revenue - Variable Costs
 * - Net Profit = Gross Revenue - Total Costs
 * - ROI % = (Net Profit / Total Costs) * 100
 * - Break-even Price ($/lb) = Total Costs / Marketable Yield
 * - Break-even Yield (lbs/acre) = Total Cost Per Acre / Selling Price ($/lb)
 */

export function calculateFarmFinancials(
  inputs: FarmFinancialInputs,
  budget?: CropProductionBudget
): FarmFinancialResults {
  const missingRequiredInputs: string[] = [];

  if (!inputs.cropId) missingRequiredInputs.push("Crop selection");
  if (inputs.acreage === undefined || inputs.acreage <= 0) missingRequiredInputs.push("Acreage (> 0)");
  if (inputs.expectedYieldPerAcreLbs === undefined || inputs.expectedYieldPerAcreLbs <= 0)
    missingRequiredInputs.push("Expected yield per acre (> 0 lbs)");
  if (inputs.marketablePercent === undefined || inputs.marketablePercent <= 0 || inputs.marketablePercent > 100)
    missingRequiredInputs.push("Marketable percentage (1-100%)");
  if (inputs.sellingPricePerLb === undefined || inputs.sellingPricePerLb <= 0)
    missingRequiredInputs.push("Selling price per lb (> $0.00)");

  const acreage = Math.max(0.01, inputs.acreage || 1.0);
  const grossYieldPerAcre = Math.max(0, inputs.expectedYieldPerAcreLbs || 0);
  const marketablePct = Math.min(100, Math.max(0, inputs.marketablePercent || 85));
  const sellingPrice = Math.max(0, inputs.sellingPricePerLb || 0);

  const grossYieldLbs = grossYieldPerAcre * acreage;
  const marketableYieldLbs = grossYieldLbs * (marketablePct / 100);

  const grossRevenue = marketableYieldLbs * sellingPrice;
  const revenuePerAcre = acreage > 0 ? grossRevenue / acreage : 0;

  // Resolve costs from budget + custom overrides
  let variableCostPerAcre = 0;
  let fixedCostPerAcre = 0;
  let costDataSource = "Custom User Estimates";

  if (budget) {
    costDataSource = budget.sourceName;
    for (const costItem of budget.costs) {
      const customAmount = inputs.customCosts?.[costItem.category];
      const amount = customAmount !== undefined && customAmount >= 0 ? customAmount : costItem.amountPerAcre;
      if (costItem.isVariable) {
        variableCostPerAcre += amount;
      } else {
        fixedCostPerAcre += amount;
      }
    }
  } else if (inputs.customCosts) {
    // If no budget but user specified custom costs
    for (const [category, amount] of Object.entries(inputs.customCosts)) {
      if (typeof amount === "number" && amount >= 0) {
        if (category === "land_rent" || category === "operating_interest_overhead" || category === "machinery") {
          fixedCostPerAcre += amount;
        } else {
          variableCostPerAcre += amount;
        }
      }
    }
  }

  const totalCostPerAcre = variableCostPerAcre + fixedCostPerAcre;
  const variableCostsTotal = variableCostPerAcre * acreage;
  const fixedCostsTotal = fixedCostPerAcre * acreage;
  const totalProductionCosts = variableCostsTotal + fixedCostsTotal;

  const grossMargin = grossRevenue - variableCostsTotal;
  const grossMarginPerAcre = acreage > 0 ? grossMargin / acreage : 0;
  const grossMarginPercent = grossRevenue > 0 ? (grossMargin / grossRevenue) * 100 : 0;

  const netProfit = grossRevenue - totalProductionCosts;
  const netProfitPerAcre = acreage > 0 ? netProfit / acreage : 0;
  const netProfitPercent = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

  const returnOnInvestmentPercent =
    totalProductionCosts > 0 ? (netProfit / totalProductionCosts) * 100 : 0;

  const breakEvenSellingPricePerLb =
    marketableYieldLbs > 0 ? totalProductionCosts / marketableYieldLbs : 0;

  const breakEvenYieldLbsPerAcre =
    sellingPrice > 0 ? totalCostPerAcre / sellingPrice : 0;

  const breakEvenSafetyMarginPercent =
    sellingPrice > 0
      ? ((sellingPrice - breakEvenSellingPricePerLb) / sellingPrice) * 100
      : 0;

  const crop = CROPS.find((c) => c.id === inputs.cropId);
  const cropName = crop?.name || inputs.cropId || "Unknown Crop";

  return {
    cropId: inputs.cropId,
    cropName,
    acreage: round(acreage, 2),
    grossYieldLbs: round(grossYieldLbs, 0),
    marketableYieldLbs: round(marketableYieldLbs, 0),
    sellingPricePerLb: round(sellingPrice, 4),
    priceCategory: inputs.priceCategory || "Shipping Point (Regional Wholesale Reference)",
    priceSource: inputs.priceSource || "USDA AMS MyMarketNews Report 2403",
    grossRevenue: round(grossRevenue, 2),
    revenuePerAcre: round(revenuePerAcre, 2),
    variableCostsTotal: round(variableCostsTotal, 2),
    variableCostPerAcre: round(variableCostPerAcre, 2),
    fixedCostsTotal: round(fixedCostsTotal, 2),
    fixedCostPerAcre: round(fixedCostPerAcre, 2),
    totalProductionCosts: round(totalProductionCosts, 2),
    totalCostPerAcre: round(totalCostPerAcre, 2),
    grossMargin: round(grossMargin, 2),
    grossMarginPerAcre: round(grossMarginPerAcre, 2),
    grossMarginPercent: round(grossMarginPercent, 1),
    netProfit: round(netProfit, 2),
    netProfitPerAcre: round(netProfitPerAcre, 2),
    netProfitPercent: round(netProfitPercent, 1),
    returnOnInvestmentPercent: round(returnOnInvestmentPercent, 1),
    breakEvenSellingPricePerLb: round(breakEvenSellingPricePerLb, 4),
    breakEvenYieldLbsPerAcre: round(breakEvenYieldLbsPerAcre, 0),
    breakEvenSafetyMarginPercent: round(breakEvenSafetyMarginPercent, 1),
    isInputComplete: missingRequiredInputs.length === 0,
    missingRequiredInputs,
    costDataSource,
    currency: "USD",
  };
}

/**
 * Generate 3 deterministic financial scenarios:
 * - Conservative (stress test: lower yield, depressed price, higher inputs)
 * - Expected (standard baseline from extension and USDA reports)
 * - Optimistic (best management practices: superior packout, premium price window, cost savings)
 */
export function generateFinancialScenarios(
  inputs: FarmFinancialInputs,
  budget?: CropProductionBudget
): Record<ScenarioType, FinancialScenario> {
  // Conservative Scenario
  const conservativeInputs: FarmFinancialInputs = {
    ...inputs,
    expectedYieldPerAcreLbs: inputs.expectedYieldPerAcreLbs * 0.8, // -20%
    sellingPricePerLb: inputs.sellingPricePerLb * 0.85, // -15%
  };
  const conservativeBudget: CropProductionBudget | undefined = budget
    ? {
        ...budget,
        costs: budget.costs.map((c) => ({
          ...c,
          amountPerAcre: round(c.amountPerAcre * 1.1, 2), // +10% cost
        })),
      }
    : undefined;

  const conservativeResults = calculateFarmFinancials(conservativeInputs, conservativeBudget);

  // Expected Scenario
  const expectedResults = calculateFarmFinancials(inputs, budget);

  // Optimistic Scenario
  const optimisticInputs: FarmFinancialInputs = {
    ...inputs,
    expectedYieldPerAcreLbs: inputs.expectedYieldPerAcreLbs * 1.18, // +18%
    sellingPricePerLb: inputs.sellingPricePerLb * 1.15, // +15%
  };
  const optimisticBudget: CropProductionBudget | undefined = budget
    ? {
        ...budget,
        costs: budget.costs.map((c) => ({
          ...c,
          amountPerAcre: round(c.amountPerAcre * 0.92, 2), // -8% cost efficiency
        })),
      }
    : undefined;

  const optimisticResults = calculateFarmFinancials(optimisticInputs, optimisticBudget);

  return {
    conservative: {
      scenarioType: "conservative",
      label: "Conservative (Stress Test)",
      description:
        "Reflects desert weather anomalies (heat wave/frost), regional harvest oversupply, and higher water pumping utility rates.",
      yieldMultiplier: 0.8,
      priceMultiplier: 0.85,
      costMultiplier: 1.1,
      results: conservativeResults,
      documentedAssumptions: [
        "Marketable Grade 1 yield drops 20% due to desert heat waves or unexpected spring cold snaps.",
        "Regional wholesale shipping point prices soften by 15% due to peak import volumes from Sonora/California.",
        "Deep aquifer irrigation pumping and energy rates increase operating costs by 10% during peak summer.",
      ],
    },
    expected: {
      scenarioType: "expected",
      label: "Expected (Extension Baseline)",
      description:
        "Based directly on University of Arizona Cooperative Extension enterprise budgets and USDA AMS Phoenix wholesale quotes.",
      yieldMultiplier: 1.0,
      priceMultiplier: 1.0,
      costMultiplier: 1.0,
      results: expectedResults,
      documentedAssumptions: [
        "Yield tracks historical University of Arizona Extension trials and USDA NASS Arizona county median benchmarks.",
        "Wholesale selling price reflects current USDA AMS Phoenix Shipping Point (IX_FV120) reported midpoint.",
        "Production expenses mirror 2026 Southern Arizona Commercial Vegetable Production enterprise standards.",
      ],
    },
    optimistic: {
      scenarioType: "optimistic",
      label: "Optimistic (Premium Practice)",
      description:
        "Assumes precision drip scheduling, row cover microclimate moderation, premium wholesale packout, and solar pumping efficiency.",
      yieldMultiplier: 1.18,
      priceMultiplier: 1.15,
      costMultiplier: 0.92,
      results: optimisticResults,
      documentedAssumptions: [
        "Subsurface drip irrigation, shade/row covers, and timely pest scouting elevate marketable packout by 18%.",
        "Early seasonal market window or direct-to-distributor contract secures a 15% price premium over shipping point base.",
        "Solar-assisted well pumping and precision split-fertilizer fertigation trim variable expenses by 8%.",
      ],
    },
  };
}

/**
 * Compare all 15 GAIA crops deterministically across revenue, cost, net margin, and financial risk
 */
export function compareAllCropsEconomics(
  prices: UsdaMarketPriceItem[],
  budgets: Record<string, CropProductionBudget>,
  nassStats: Record<string, NassAgriculturalStat>
): CropEconomicComparisonItem[] {
  const comparisonItems: CropEconomicComparisonItem[] = [];

  for (const crop of CROPS) {
    const cropId = crop.id;
    const priceQuote = prices.find((p) => p.matchedCropId === cropId);
    const budget = budgets[cropId];
    const nassStat = nassStats[cropId];

    // Selling price per lb
    const marketPricePerLb = priceQuote ? priceQuote.pricePerLb : 1.25;
    const priceSource = priceQuote
      ? `${priceQuote.marketName} (${priceQuote.grade}, ${priceQuote.package})`
      : "Regional Baseline Estimate";

    // Benchmark yield (prefer NASS historical, fallback to extension baseline)
    let yieldLbs = 18000;
    if (nassStat?.yieldPerAcre) {
      if (nassStat.yieldUnit.includes("CWT")) {
        yieldLbs = nassStat.yieldPerAcre * 100;
      } else if (nassStat.yieldUnit.includes("LBS")) {
        yieldLbs = nassStat.yieldPerAcre;
      }
    } else {
      // Sensible agronomic defaults for 1 acre in desert conditions
      const defaultYields: Record<string, number> = {
        tomato: 24000,
        potato: 22000,
        onion: 28000,
        garlic: 7500,
        lettuce: 18000,
        spinach: 12000,
        okra: 11000,
        carrot: 22000,
        bell_pepper: 20000,
        watermelon: 32000,
        cabbage: 25000,
        broccoli: 13000,
        cucumber: 24000,
        squash: 19000,
        sweet_corn: 11000,
      };
      yieldLbs = defaultYields[cropId] || 16000;
    }

    // Calculate financials for 1.0 acre
    const inputs: FarmFinancialInputs = {
      cropId,
      acreage: 1.0,
      expectedYieldPerAcreLbs: yieldLbs,
      marketablePercent: 85,
      sellingPricePerLb: marketPricePerLb,
      sellingPriceUnitDescription: "$/lb",
      priceCategory: "Shipping Point (Regional Wholesale Reference)",
      priceSource,
    };

    const fin = calculateFarmFinancials(inputs, budget);

    // Assess financial risk
    let financialRiskLevel: "Low" | "Moderate" | "High" = "Moderate";
    let primaryOpportunity = "";
    let primaryRisk = "";

    if (fin.netProfitPerAcre > 4000 && fin.returnOnInvestmentPercent > 40 && fin.breakEvenSafetyMarginPercent > 30) {
      financialRiskLevel = "Low";
      primaryOpportunity = "High net return per acre with comfortable break-even margin against wholesale fluctuations.";
      primaryRisk = "Requires stringent post-harvest cooling and rapid transit to maintain wholesale packout grade.";
    } else if (fin.netProfitPerAcre < 500 || fin.returnOnInvestmentPercent < 15 || fin.breakEvenSafetyMarginPercent < 15) {
      financialRiskLevel = "High";
      primaryOpportunity = "Can serve as rotational bulk commodity or soil building cover crop between high-value seasons.";
      primaryRisk = "Thin profit margin; vulnerable to even minor water pumping spikes or Sonoran wholesale price dips.";
    } else {
      financialRiskLevel = "Moderate";
      primaryOpportunity = "Consistent regional demand with balanced capital investment and predictable harvest window.";
      primaryRisk = "Water intensive during late maturity; requires vigilant soil moisture and heat tracking.";
    }

    comparisonItems.push({
      cropId,
      cropName: crop.name,
      category: crop.category,
      suitabilityStatus: crop.category === "cool_season" ? "Cool Season Fit" : "Warm Season Fit",
      marketPricePerLb: round(marketPricePerLb, 2),
      priceSource,
      yieldPerAcreLbs: round(yieldLbs, 0),
      revenuePerAcre: fin.revenuePerAcre,
      costPerAcre: fin.totalCostPerAcre,
      netProfitPerAcre: fin.netProfitPerAcre,
      roiPercent: fin.returnOnInvestmentPercent,
      breakEvenPricePerLb: fin.breakEvenSellingPricePerLb,
      financialRiskLevel,
      primaryOpportunity,
      primaryRisk,
    });
  }

  // Sort by net profit per acre descending
  return comparisonItems.sort((a, b) => b.netProfitPerAcre - a.netProfitPerAcre);
}

function round(val: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}
