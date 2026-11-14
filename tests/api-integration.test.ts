import test, { describe, it } from "node:test";
import assert from "node:assert/strict";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

describe("GAIA Crop Recommendation - Live API Integration Tests", () => {
  describe("GET /api/crops", () => {
    it("should return HTTP 200 with Green Valley environmental summary & all 15 evaluations", async () => {
      const res = await fetch(`${BASE_URL}/api/crops`);
      assert.equal(res.status, 200, "Expected HTTP 200");

      const body = await res.json();
      assert.equal(body.status, "Success");
      assert.ok(body.summary, "Body must contain summary object");

      const summary = body.summary;
      assert.equal(summary.locationName, "Green Valley, Arizona, USA");
      assert.equal(summary.coordinates.lat, 31.8543);
      assert.equal(summary.coordinates.lon, -111.0);
      assert.equal(summary.historicalPeriod, "2021-01-01 to 2025-12-31");
      assert.equal(summary.totalCropsEvaluated, 15);
      assert.equal(summary.suitableCount, 9);
      assert.equal(summary.conditionalCount, 6);
      assert.equal(summary.highRiskCount, 0);

      // Verify soil and irrigation warnings
      assert.ok(summary.soilNotice.includes("CRITICAL"));
      assert.ok(summary.irrigationNotice.includes("MANDATORY"));

      // Verify top recommended includes garlic, onion, okra, etc.
      const topNames = summary.topRecommended.map((c: any) => c.crop.name);
      assert.ok(topNames.includes("Garlic"));
      assert.ok(topNames.includes("Onion"));
      assert.ok(topNames.includes("Spinach"));
      assert.ok(topNames.includes("Okra"));

      // Verify conditional crops includes tomato, pepper, green beans
      const condNames = summary.conditionalCrops.map((c: any) => c.crop.name);
      assert.ok(condNames.includes("Tomato"));
      assert.ok(condNames.includes("Pepper (Sweet & Chile)"));
      assert.ok(condNames.includes("Green Beans (Snap Beans)"));

      // Verify telemetry metadata
      assert.ok(body.telemetry);
      assert.equal(body.telemetry.location.name, "Green Valley, Arizona, USA");
      assert.ok(body.telemetry.summaryStats);
    });
  });

  describe("POST /api/crops/advisor", () => {
    it("should return HTTP 200 with 5 structured advisory sections", async () => {
      const res = await fetch(`${BASE_URL}/api/crops/advisor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      assert.equal(res.status, 200, "Expected HTTP 200");
      const body = await res.json();

      assert.equal(body.status, "Success");
      assert.ok(body.provider, "Must identify AI provider");
      assert.ok(body.model, "Must identify AI model");
      assert.equal(body.location, "Green Valley, Arizona, USA");

      const sections = body.sections;
      assert.ok(sections, "Must contain sections object");

      // Verify all 5 structured sections are present and non-empty
      assert.ok(
        sections.bestCrops && sections.bestCrops.length > 50,
        "Section A (bestCrops) must be populated"
      );
      assert.ok(
        sections.riskyCrops && sections.riskyCrops.length > 50,
        "Section B (riskyCrops) must be populated"
      );
      assert.ok(
        sections.plantingCalendar && sections.plantingCalendar.length > 50,
        "Section C (plantingCalendar) must be populated"
      );
      assert.ok(
        sections.missingInformation && sections.missingInformation.length > 50,
        "Section D (missingInformation) must be populated"
      );
      assert.ok(
        sections.practicalRecommendation && sections.practicalRecommendation.length > 50,
        "Section E (practicalRecommendation) must be populated"
      );

      // Verify anti-hallucination guardrails in the output
      assert.ok(
        sections.missingInformation.toLowerCase().includes("soil") &&
          sections.missingInformation.toLowerCase().includes("ph"),
        "Missing information section must explain unmeasured soil pH"
      );
      assert.ok(body.disclaimer, "Advisory response must contain a disclaimer");
    });
  });

  describe("GET /api/economics", () => {
    it("should return HTTP 200 with market quotes, budgets, scenarios, and 15-crop comparison", async () => {
      const res = await fetch(`${BASE_URL}/api/economics?cropId=tomato&acreage=1.0`);
      assert.equal(res.status, 200, "Expected HTTP 200");

      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.location.name, "Green Valley, Arizona, USA");
      assert.equal(body.location.latitude, 31.8543);
      assert.equal(body.location.longitude, -111.0);

      // Verify market report
      assert.ok(body.marketReport, "Must contain marketReport");
      assert.ok(body.marketReport.quotes.length >= 15, "Must have quotes");
      assert.ok(
        body.marketReport.transparencyNotice.includes("wholesale"),
        "Must disclose wholesale reference nature of market prices"
      );

      // Verify selected crop financials
      const fin = body.selectedCropFinancials;
      assert.ok(fin);
      assert.equal(fin.cropId, "tomato");
      assert.equal(fin.acreage, 1.0);
      assert.ok(fin.grossRevenue > 0);
      assert.ok(fin.totalProductionCosts > 0);
      assert.ok(fin.breakEvenSellingPricePerLb > 0);
      assert.ok(fin.breakEvenYieldLbsPerAcre > 0);
      assert.equal(fin.currency, "USD");

      // Verify scenarios
      const scenarios = body.selectedCropScenarios;
      assert.ok(scenarios.conservative);
      assert.ok(scenarios.expected);
      assert.ok(scenarios.optimistic);
      assert.equal(scenarios.conservative.yieldMultiplier, 0.8);
      assert.equal(scenarios.expected.yieldMultiplier, 1.0);
      assert.equal(scenarios.optimistic.yieldMultiplier, 1.18);

      // Verify cost reduction opportunities
      assert.ok(body.costReductionOpportunities.length >= 4);

      // Verify 15-crop comparison ranking
      assert.equal(body.cropComparison.length, 15);
      assert.equal(body.totalCropsEvaluated, 15);
    });
  });

  describe("POST /api/economics/advisor", () => {
    it("should return HTTP 200 with 5 grounded economic advisory sections", async () => {
      const payload = {
        cropName: "Tomato",
        acreage: 1,
        financialResults: {
          cropId: "tomato",
          cropName: "Tomato",
          acreage: 1,
          grossYieldLbs: 24000,
          marketableYieldLbs: 20400,
          sellingPricePerLb: 0.65,
          priceCategory: "Shipping Point (Regional Wholesale Reference)",
          priceSource: "Phoenix, Arizona Shipping Point",
          grossRevenue: 13260,
          revenuePerAcre: 13260,
          variableCostsTotal: 5900,
          variableCostPerAcre: 5900,
          fixedCostsTotal: 520,
          fixedCostPerAcre: 520,
          totalProductionCosts: 6420,
          totalCostPerAcre: 6420,
          grossMargin: 7360,
          grossMarginPerAcre: 7360,
          grossMarginPercent: 55.5,
          netProfit: 6840,
          netProfitPerAcre: 6840,
          netProfitPercent: 51.6,
          returnOnInvestmentPercent: 106.5,
          breakEvenSellingPricePerLb: 0.3147,
          breakEvenYieldLbsPerAcre: 9877,
          breakEvenSafetyMarginPercent: 51.6,
          isInputComplete: true,
          missingRequiredInputs: [],
          costDataSource: "University of Arizona Extension",
          currency: "USD",
        },
        scenarios: {
          conservative: {
            scenarioType: "conservative",
            label: "Conservative",
            description: "Stress test",
            yieldMultiplier: 0.8,
            priceMultiplier: 0.85,
            costMultiplier: 1.1,
            results: {
              netProfit: 2487.6,
              returnOnInvestmentPercent: 35.2,
              breakEvenSellingPricePerLb: 0.4328,
            },
            documentedAssumptions: ["Oversupply", "Heat stress"],
          },
          expected: {
            scenarioType: "expected",
            label: "Expected",
            description: "Baseline",
            yieldMultiplier: 1.0,
            priceMultiplier: 1.0,
            costMultiplier: 1.0,
            results: {
              netProfit: 6840,
              returnOnInvestmentPercent: 106.5,
              breakEvenSellingPricePerLb: 0.3147,
            },
            documentedAssumptions: ["Baseline"],
          },
          optimistic: {
            scenarioType: "optimistic",
            label: "Optimistic",
            description: "Premium",
            yieldMultiplier: 1.18,
            priceMultiplier: 1.15,
            costMultiplier: 0.92,
            results: {
              netProfit: 12056.4,
              returnOnInvestmentPercent: 204.1,
              breakEvenSellingPricePerLb: 0.2458,
            },
            documentedAssumptions: ["Premium packout"],
          },
        },
        comparisonTop5: [],
      };

      const res = await fetch(`${BASE_URL}/api/economics/advisor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      assert.equal(res.status, 200, "Expected HTTP 200");
      const body = await res.json();
      assert.equal(body.success, true);
      assert.ok(body.report);
      assert.ok(body.report.sections.promisingCropsSummary.length > 20);
      assert.ok(body.report.sections.riskAndConcentrationAnalysis.length > 20);
      assert.ok(body.report.sections.costReductionRoadmap.length > 20);
      assert.ok(body.report.sections.marketSensitivity.length > 20);
      assert.ok(body.report.sections.missingDataAndNextSteps.length > 20);
    });
  });
});
