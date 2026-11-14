import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CROP_CATALOG } from "../src/lib/crops/crop-catalog";
import {
  evaluateAllCrops,
  evaluateCropSuitability,
} from "../src/lib/crops/suitability-engine";
import type { EnvironmentalDataResponse } from "../src/lib/types/environmental";

// Mock 5-year NASA POWER telemetry matching Green Valley, AZ (2021-2025)
const mockGreenValleyTelemetry: EnvironmentalDataResponse = {
  status: "Success",
  sourceName: "NASA POWER Daily API v2.10 (Native MERRA-2 / GEOS-5)",
  retrievalTimestamp: new Date().toISOString(),
  isCached: true,
  location: {
    name: "Green Valley, Arizona, USA",
    latitude: 31.8543,
    longitude: -111.0,
    elevationMeters: 962,
    isPredefinedPrototype: true,
  },
  summaryStats: {
    period: {
      start: "2021-01-01",
      end: "2025-12-31",
      totalDays: 1826,
      validDays: 1826,
      missingRatePercent: 0,
    },
    temperature: {
      mean: 20.5,
      maxRecord: 44.99,
      maxRecordDate: "2021-06-15",
      minRecord: -4.43,
      minRecordDate: "2024-01-08",
    },
    precipitation: {
      totalFiveYearMm: 1534.2,
      annualAverageMm: 306.84,
      wettestMonth: { month: "2021-07", amountMm: 112.5 },
      driestMonth: { month: "2023-05", amountMm: 0.1 },
      rainDaysCount: 165,
    },
    humidity: {
      meanPercent: 32.4,
    },
    solar: {
      meanMjM2Day: 21.12,
    },
    wind: {
      meanSpeedMs: 3.6,
    },
    soilMoisture: {
      surfaceMean: 0.14,
      rootZoneMean: 0.21,
      profileMean: 0.26,
    },
  },
  monthlyAggregates: [],
  recentDailyObservations: [],
  totalObservationsCount: 1826,
  missingMeasurementsCount: 0,
  latestObservation: {
    date: "2025-12-31",
    formattedDate: "December 31, 2025",
    isHistoricalNotice: "Historical observation (NASA POWER 2021-2025 archive)",
    t2m: 14.2,
    t2mMax: 21.5,
    t2mMin: 6.8,
    precip: 0,
    rh2m: 38,
    ws10m: 2.4,
    solar: 14.1,
    gwettop: 0.12,
    gwetroot: 0.19,
    gwetprof: 0.24,
  },
  parameterMetadata: {},
};

describe("GAIA Crop Recommendation Suite - Green Valley, AZ", () => {
  describe("Crop Catalog Specifications", () => {
    it("should contain exactly 15 verified vegetable crops", () => {
      assert.equal(CROP_CATALOG.length, 15);
    });

    it("should evaluate all 15 required MVP vegetables", () => {
      const expectedCrops = [
        "tomato",
        "potato",
        "onion",
        "garlic",
        "lettuce",
        "spinach",
        "cucumber",
        "pepper",
        "eggplant",
        "carrot",
        "cabbage",
        "broccoli",
        "zucchini",
        "green_beans",
        "okra",
      ];
      const actualIds = CROP_CATALOG.map((c) => c.id).sort();
      assert.deepEqual(actualIds, expectedCrops.sort());
    });

    it("should cite authoritative agricultural extension references for all crops", () => {
      for (const crop of CROP_CATALOG) {
        assert.ok(crop.references.primarySource, `${crop.name} must cite a primary source`);
        assert.ok(
          crop.references.primarySource.includes("University of Arizona") ||
            crop.references.primarySource.includes("FAO"),
          `${crop.name} primary source must be UA Extension or FAO`
        );
        assert.ok(crop.references.sourceUrl, `${crop.name} must have a valid reference URL`);
      }
    });

    it("should define planting windows with specific months for all crops", () => {
      for (const crop of CROP_CATALOG) {
        assert.ok(crop.suitablePlantingWindows.length > 0, `${crop.name} must have planting windows`);
        for (const window of crop.suitablePlantingWindows) {
          assert.ok(window.startMonth >= 1 && window.startMonth <= 12);
          assert.ok(window.endMonth >= 1 && window.endMonth <= 12);
          assert.ok(window.seasonName.length > 0);
          assert.ok(window.harvestWindow.length > 0);
        }
      }
    });
  });

  describe("Deterministic Suitability Engine", () => {
    const summary = evaluateAllCrops(mockGreenValleyTelemetry);

    it("should evaluate all 15 crops without omissions", () => {
      assert.equal(summary.totalCropsEvaluated, 15);
      const totalEvaluated =
        summary.suitableCount + summary.conditionalCount + summary.highRiskCount;
      assert.equal(totalEvaluated, 15);
    });

    it("should classify cool-season crops as Suitable with Irrigation in Season", () => {
      const coolCrops = [
        "garlic",
        "onion",
        "spinach",
        "lettuce",
        "broccoli",
        "cabbage",
        "carrot",
      ];
      for (const cropId of coolCrops) {
        const evalResult = summary.topRecommended.find((c) => c.crop.id === cropId);
        assert.ok(
          evalResult,
          `Expected ${cropId} to be in topRecommended (Suitable with Irrigation in Season)`
        );
        assert.equal(
          evalResult.classification,
          "Suitable with Irrigation in Season",
          `${cropId} should be Suitable with Irrigation in Season`
        );
      }
    });

    it("should classify Okra as Suitable with Irrigation in Season due to high heat tolerance", () => {
      const okraEval = summary.topRecommended.find((c) => c.crop.id === "okra");
      assert.ok(okraEval, "Okra must be in topRecommended");
      assert.equal(okraEval.classification, "Suitable with Irrigation in Season");
      assert.equal(okraEval.factors.heatStressRisk.status, "optimal");
    });

    it("should classify heat-sensitive warm-season crops as Conditionally Suitable", () => {
      const conditionalCrops = [
        "tomato",
        "pepper",
        "green_beans",
        "cucumber",
        "zucchini",
      ];
      for (const cropId of conditionalCrops) {
        const evalResult = summary.conditionalCrops.find((c) => c.crop.id === cropId);
        assert.ok(
          evalResult,
          `Expected ${cropId} to be in conditionalCrops (Conditionally Suitable)`
        );
        assert.equal(
          evalResult.classification,
          "Conditionally Suitable (Risk Management Required)",
          `${cropId} should be Conditionally Suitable`
        );
        // Risk factors must highlight heat or frost
        assert.ok(
          evalResult.primaryRiskFactors.length > 0,
          `${cropId} must document primary risk factors`
        );
      }
    });

    it("should strictly evaluate Soil Suitability as UNKNOWN for all 15 crops", () => {
      const allEvaluations = [...summary.topRecommended, ...summary.conditionalCrops];
      for (const ev of allEvaluations) {
        assert.equal(
          ev.factors.soilSuitability.status,
          "unknown",
          `Soil suitability for ${ev.crop.name} must be strictly 'unknown'`
        );
        assert.ok(
          ev.factors.soilSuitability.headline.includes("UNKNOWN"),
          "Soil headline must explicitly declare UNKNOWN status"
        );
        assert.ok(
          ev.factors.soilSuitability.managementAdvice?.includes("laboratory"),
          "Soil management advice must recommend certified laboratory testing"
        );
      }
    });

    it("should enforce mandatory irrigation notice for all crops", () => {
      assert.ok(
        summary.irrigationNotice.includes("MANDATORY"),
        "Summary must contain mandatory irrigation notice"
      );
      assert.ok(
        summary.soilNotice.includes("CRITICAL"),
        "Summary must contain critical soil testing notice"
      );

      const allEvaluations = [...summary.topRecommended, ...summary.conditionalCrops];
      for (const ev of allEvaluations) {
        assert.ok(
          ev.factors.rainfallAndIrrigationRequirement.headline.includes("irrigation is mandatory"),
          `${ev.crop.name} rainfall assessment must declare mandatory irrigation`
        );
      }
    });

    it("should accurately reflect Green Valley location coordinates and elevation", () => {
      assert.equal(summary.locationName, "Green Valley, Arizona, USA");
      assert.equal(summary.coordinates.lat, 31.8543);
      assert.equal(summary.coordinates.lon, -111.0);
    });

    it("should maintain transparent factor assessments without arbitrary composite scores", () => {
      for (const ev of summary.topRecommended) {
        // Ensure all 7 distinct factor objects exist
        const factors = ev.factors;
        assert.ok(factors.temperatureCompatibility);
        assert.ok(factors.heatStressRisk);
        assert.ok(factors.frostExposureRisk);
        assert.ok(factors.rainfallAndIrrigationRequirement);
        assert.ok(factors.solarIrradianceCompatibility);
        assert.ok(factors.seasonalWindowAlignment);
        assert.ok(factors.soilSuitability);

        // Every factor must have calculationMethod and referenceSource
        for (const [factorKey, assessment] of Object.entries(factors)) {
          assert.ok(assessment.factorName, `${factorKey} must have factorName`);
          assert.ok(assessment.status, `${factorKey} must have status`);
          assert.ok(assessment.calculationMethod, `${factorKey} must have calculationMethod`);
          assert.ok(assessment.referenceSource, `${factorKey} must have referenceSource`);
        }
      }
    });
  });
});
