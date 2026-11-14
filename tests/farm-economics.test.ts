import test, { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  parseUsdaMarsReportDetails,
  PHOENIX_SHIPPING_POINT_REFERENCE_DATA,
} from "../src/lib/economics/usda-market-news";
import {
  NASS_ARIZONA_BENCHMARKS,
  parseNassApiResponse,
} from "../src/lib/economics/usda-nass";
import {
  UA_ENTERPRISE_BUDGETS,
  getOrCreateProductionBudget,
} from "../src/lib/economics/production-budgets";
import {
  calculateFarmFinancials,
  generateFinancialScenarios,
  compareAllCropsEconomics,
} from "../src/lib/economics/financial-engine";
import { generateCostReductionOpportunities } from "../src/lib/economics/cost-reduction-engine";
import { CROP_CATALOG as CROPS } from "../src/lib/crops/crop-catalog";
import type { FarmFinancialInputs } from "../src/lib/types/economics";

describe("GAIA Farm Economics & Profitability Suite", () => {
  describe("1. USDA AMS MyMarketNews Phoenix Shipping Point Parser", () => {
    it("should parse raw MARS API details into structured quotes", () => {
      const mockMarsRaw = {
        results: [
          {
            commodity: "TOMATOES",
            package: "cartons 2 layer",
            grade: "U.S. One",
            price_min: 16.0,
            price_max: 20.0,
            report_date: "2026-03-15",
            market_type: "Shipping Point",
            market_location_city: "Phoenix",
          },
        ],
      };

      const parsed = parseUsdaMarsReportDetails(mockMarsRaw);
      assert.strictEqual(parsed.length, 1);
      assert.strictEqual(parsed[0].commodity, "TOMATOES");
      assert.strictEqual(parsed[0].matchedCropId, "tomato");
      assert.strictEqual(parsed[0].priceMin, 16.0);
      assert.strictEqual(parsed[0].priceMax, 20.0);
      assert.strictEqual(parsed[0].priceAverage, 18.0);
      assert.strictEqual(parsed[0].unitWeightLbs, 25); // Standard 25-lb loose carton
      assert.strictEqual(parsed[0].pricePerLb, 0.72); // 18.0 / 25 = 0.72 $/lb
    });

    it("should provide validated Phoenix shipping point reference quotes for GAIA crops", () => {
      assert(PHOENIX_SHIPPING_POINT_REFERENCE_DATA.length >= 15);
      const tomato = PHOENIX_SHIPPING_POINT_REFERENCE_DATA.find((q) => q.matchedCropId === "tomato");
      assert(tomato);
      assert.strictEqual(tomato.reportId, 2403);
      assert.strictEqual(tomato.reportSlug, "IX_FV120");
      assert(tomato.pricePerLb > 0.4 && tomato.pricePerLb < 2.5);
    });
  });

  describe("2. USDA NASS Agricultural Statistics Parser", () => {
    it("should parse NASS API JSON and filter suppressed data gracefully", () => {
      const mockNassJson = {
        data: [
          {
            commodity_desc: "TOMATOES",
            year: "2024",
            agg_level_desc: "STATE",
            state_alpha: "AZ",
            statisticcat_desc: "YIELD",
            unit_desc: "CWT / ACRE",
            Value: "240",
          },
          {
            commodity_desc: "GARLIC",
            year: "2024",
            agg_level_desc: "COUNTY",
            county_name: "PIMA",
            statisticcat_desc: "YIELD",
            unit_desc: "CWT / ACRE",
            Value: " (D) ", // Withheld for grower privacy
          },
        ],
      };

      const parsed = parseNassApiResponse(mockNassJson);
      assert.strictEqual(parsed.length, 2);
      assert.strictEqual(parsed[0].yieldPerAcre, 240);
      assert.strictEqual(parsed[0].geographicLevel, "State (Arizona)");
      assert.strictEqual(parsed[1].yieldPerAcre, null);
      assert(parsed[1].referenceNote.includes("withheld"));
    });

    it("should load verified Arizona historical census benchmarks", () => {
      assert(NASS_ARIZONA_BENCHMARKS.length >= 15);
      const lettuce = NASS_ARIZONA_BENCHMARKS.find((s) => s.cropId === "lettuce");
      assert(lettuce);
      assert(lettuce.yieldPerAcre && lettuce.yieldPerAcre > 100);
    });
  });

  describe("3. University of Arizona Enterprise Cost Budgets", () => {
    it("should provide official budgets for primary Southern Arizona vegetables", () => {
      const officialBudgetCrops = ["tomato", "potato", "onion", "lettuce", "spinach"];
      for (const cropId of officialBudgetCrops) {
        const budget = UA_ENTERPRISE_BUDGETS[cropId];
        assert(budget, `Expected official budget for ${cropId}`);
        assert.strictEqual(budget.hasOfficialUaBudget, true);
        assert(budget.totalCostPerAcre > 1500, `Cost should be realistic for ${cropId}`);
        assert(budget.totalVariableCostPerAcre > 0);
        assert(budget.totalFixedCostPerAcre > 0);
        // Cost sum integrity
        const variableSum = budget.costs
          .filter((c) => c.isVariable)
          .reduce((sum, c) => sum + c.amountPerAcre, 0);
        const fixedSum = budget.costs
          .filter((c) => !c.isVariable)
          .reduce((sum, c) => sum + c.amountPerAcre, 0);
        assert.strictEqual(Math.round(variableSum), Math.round(budget.totalVariableCostPerAcre));
        assert.strictEqual(Math.round(fixedSum), Math.round(budget.totalFixedCostPerAcre));
      }

      // Check specialized trial extension models
      assert.strictEqual(UA_ENTERPRISE_BUDGETS["garlic"].hasOfficialUaBudget, false);
      assert.strictEqual(UA_ENTERPRISE_BUDGETS["okra"].hasOfficialUaBudget, false);
    });

    it("should dynamically generate representative extension budgets for unbudgeted crops", () => {
      const budget = getOrCreateProductionBudget("watermelon");
      assert(budget);
      assert.strictEqual(budget.hasOfficialUaBudget, false);
      assert(budget.totalCostPerAcre > 1000);
      assert(budget.costs.some((c) => c.category === "irrigation_water"));
    });
  });

  describe("4. Deterministic Financial Calculation Engine", () => {
    it("should calculate exact mathematical revenues, costs, margins, and break-evens", () => {
      const budget = getOrCreateProductionBudget("tomato");
      const inputs: FarmFinancialInputs = {
        cropId: "tomato",
        acreage: 2.0,
        expectedYieldPerAcreLbs: 24000,
        marketablePercent: 85,
        sellingPricePerLb: 0.9,
        sellingPriceUnitDescription: "$/lb",
        priceCategory: "Shipping Point (Regional Wholesale Reference)",
        priceSource: "USDA AMS Report 2403",
      };

      const result = calculateFarmFinancials(inputs, budget);

      // Verify calculations:
      // Gross Yield = 24,000 * 2 = 48,000 lbs
      assert.strictEqual(result.grossYieldLbs, 48000);
      // Marketable Yield = 48,000 * 0.85 = 40,800 lbs
      assert.strictEqual(result.marketableYieldLbs, 40800);
      // Gross Revenue = 40,800 * 0.90 = $36,720.00
      assert.strictEqual(result.grossRevenue, 36720);
      assert.strictEqual(result.revenuePerAcre, 18360);

      // Costs
      assert.strictEqual(result.variableCostsTotal, Math.round(budget.totalVariableCostPerAcre * 2 * 100) / 100);
      assert.strictEqual(result.totalProductionCosts, Math.round(budget.totalCostPerAcre * 2 * 100) / 100);

      // Net profit = Gross Revenue - Total Costs
      assert.strictEqual(
        result.netProfit,
        Math.round((36720 - result.totalProductionCosts) * 100) / 100
      );

      // Break-even price = Total Costs / Marketable Yield
      const expectedBreakEvenPrice =
        Math.round((result.totalProductionCosts / 40800) * 10000) / 10000;
      assert.strictEqual(result.breakEvenSellingPricePerLb, expectedBreakEvenPrice);

      // Inputs completeness check
      assert.strictEqual(result.isInputComplete, true);
      assert.strictEqual(result.missingRequiredInputs.length, 0);
    });

    it("should report missing required inputs when incomplete without inventing fake numbers", () => {
      const incompleteInputs: FarmFinancialInputs = {
        cropId: "tomato",
        acreage: 0,
        expectedYieldPerAcreLbs: 0,
        marketablePercent: 0,
        sellingPricePerLb: 0,
        sellingPriceUnitDescription: "$/lb",
        priceCategory: "Shipping Point (Regional Wholesale Reference)",
        priceSource: "",
      };

      const result = calculateFarmFinancials(incompleteInputs);
      assert.strictEqual(result.isInputComplete, false);
      assert(result.missingRequiredInputs.length >= 3);
      assert.strictEqual(result.grossRevenue, 0);
    });
  });

  describe("5. 3-Tier Financial Scenario Modeling", () => {
    it("should compute Conservative, Expected, and Optimistic scenarios with documented multipliers", () => {
      const budget = getOrCreateProductionBudget("onion");
      const inputs: FarmFinancialInputs = {
        cropId: "onion",
        acreage: 1.0,
        expectedYieldPerAcreLbs: 28000,
        marketablePercent: 90,
        sellingPricePerLb: 0.65,
        sellingPriceUnitDescription: "$/lb",
        priceCategory: "Shipping Point (Regional Wholesale Reference)",
        priceSource: "Phoenix Wholesale Report",
      };

      const scenarios = generateFinancialScenarios(inputs, budget);

      assert(scenarios.conservative);
      assert(scenarios.expected);
      assert(scenarios.optimistic);

      // Multipliers check
      assert.strictEqual(scenarios.conservative.yieldMultiplier, 0.8);
      assert.strictEqual(scenarios.conservative.priceMultiplier, 0.85);
      assert.strictEqual(scenarios.conservative.costMultiplier, 1.1);

      assert.strictEqual(scenarios.expected.yieldMultiplier, 1.0);
      assert.strictEqual(scenarios.optimistic.yieldMultiplier, 1.18);
      assert.strictEqual(scenarios.optimistic.priceMultiplier, 1.15);
      assert.strictEqual(scenarios.optimistic.costMultiplier, 0.92);

      // Financial progression: Conservative profit < Expected profit < Optimistic profit
      assert(
        scenarios.conservative.results.netProfit < scenarios.expected.results.netProfit,
        "Conservative scenario must have lower net profit than Expected"
      );
      assert(
        scenarios.expected.results.netProfit < scenarios.optimistic.results.netProfit,
        "Expected scenario must have lower net profit than Optimistic"
      );

      // Verify documented assumptions exist
      assert(scenarios.conservative.documentedAssumptions.length >= 2);
      assert(scenarios.optimistic.documentedAssumptions.length >= 2);
    });
  });

  describe("6. Cost Reduction Engine", () => {
    it("should produce actionable opportunities with realistic $/acre savings", () => {
      const budget = getOrCreateProductionBudget("tomato");
      const opps = generateCostReductionOpportunities("tomato", budget, 305, true);

      assert(opps.length >= 5);
      const waterOpp = opps.find((o) => o.targetExpense === "Irrigation & Water Pumping");
      assert(waterOpp);
      assert(waterOpp.estimatedSavingsPerAcreRange.minUsd > 50);
      assert(waterOpp.estimatedSavingsPerAcreRange.maxUsd > waterOpp.estimatedSavingsPerAcreRange.minUsd);
      assert(waterOpp.recommendedAction.length > 20);
      assert(waterOpp.documentedAssumptions.length >= 2);
    });
  });

  describe("7. Deterministic 15-Crop Ranking Comparison", () => {
    it("should evaluate and rank all 15 crops without crash or NaN values", () => {
      const budgets: Record<string, any> = {};
      const nassStats: Record<string, any> = {};
      for (const crop of CROPS) {
        budgets[crop.id] = getOrCreateProductionBudget(crop.id);
        const stat = NASS_ARIZONA_BENCHMARKS.find((s) => s.cropId === crop.id);
        if (stat) nassStats[crop.id] = stat;
      }

      const comparison = compareAllCropsEconomics(
        PHOENIX_SHIPPING_POINT_REFERENCE_DATA,
        budgets,
        nassStats
      );

      assert.strictEqual(comparison.length, 15);
      // Verify sorted descending by net profit per acre
      for (let i = 0; i < comparison.length - 1; i++) {
        assert(
          comparison[i].netProfitPerAcre >= comparison[i + 1].netProfitPerAcre,
          `Items should be sorted descending: ${comparison[i].netProfitPerAcre} vs ${comparison[i + 1].netProfitPerAcre}`
        );
      }

      // Check risk levels
      for (const item of comparison) {
        assert(["Low", "Moderate", "High"].includes(item.financialRiskLevel));
        assert(!isNaN(item.revenuePerAcre));
        assert(!isNaN(item.costPerAcre));
        assert(!isNaN(item.netProfitPerAcre));
        assert(!isNaN(item.breakEvenPricePerLb));
      }
    });
  });
});
