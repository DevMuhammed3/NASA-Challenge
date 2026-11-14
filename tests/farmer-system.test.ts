import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { FarmerStorage } from "../src/lib/farmer/farmer-storage";
import { calculateFarmCompleteness } from "../src/lib/farmer/data-completeness";
import { generatePersonalizedRecommendations } from "../src/lib/farmer/personalized-recommendations";
import { GREEN_VALLEY_LOCATION } from "../src/lib/config/location";
import type { EnvironmentalDataResponse } from "../src/lib/types/environmental";

// Mock verified telemetry structure matching NASA POWER point output
const mockTelemetry: EnvironmentalDataResponse = {
  status: "Success",
  location: {
    name: GREEN_VALLEY_LOCATION.name,
    latitude: GREEN_VALLEY_LOCATION.latitude,
    longitude: GREEN_VALLEY_LOCATION.longitude,
    elevationMeters: 900,
    isPredefinedPrototype: true,
  },
  retrievalTimestamp: new Date().toISOString(),
  sourceName: "NASA POWER Agroclimatology API",
  isCached: false,
  latestObservation: {
    date: "2025-12-31",
    formattedDate: "December 31, 2025",
    isHistoricalNotice: "Verified NASA Observation",
    t2m: 14.5,
    t2mMax: 22.0,
    t2mMin: 6.0,
    precip: 0.0,
    rh2m: 35.0,
    ws10m: 2.1,
    solar: 14.2,
    gwettop: 0.12,
    gwetroot: 0.18,
    gwetprof: 0.22,
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
      mean: 19.8,
      maxRecord: 43.5,
      maxRecordDate: "2021-06-15",
      minRecord: -4.2,
      minRecordDate: "2024-01-08",
    },
    precipitation: {
      totalFiveYearMm: 1560,
      annualAverageMm: 312,
      rainDaysCount: 140,
      wettestMonth: { month: "August", amountMm: 68 },
      driestMonth: { month: "May", amountMm: 2 },
    },
    humidity: { meanPercent: 32.5 },
    solar: { meanMjM2Day: 21.4 },
    wind: { meanSpeedMs: 2.6 },
    soilMoisture: { surfaceMean: 0.12, rootZoneMean: 0.18, profileMean: 0.22 },
  },
  parameterMetadata: {
    T2M: { longname: "Temperature at 2m", units: "°C" },
  },
  monthlyAggregates: [],
  recentDailyObservations: [],
  totalObservationsCount: 1826,
  missingMeasurementsCount: 0,
};

describe("GAIA Farmer Interaction & Farm Intelligence Suite", () => {
  describe("1. Progressive Completeness & Diagnostic Blockers", () => {
    it("should calculate distinct dimensional scores and flag missing soil lab test", () => {
      const completeness = calculateFarmCompleteness({
        farm: {
          name: "Test Pima Farm",
          latitude: 31.8543,
          longitude: -111.0,
          totalArea: 20,
        },
        fields: [],
        soilProfiles: [],
        waterProfile: null,
        cropHistory: [],
        expenses: [],
      });

      assert.ok(completeness.locationScore < 100);
      assert.strictEqual(completeness.climateScore, 100); // Green Valley coordinates verified
      assert.strictEqual(completeness.soilScore, 0); // No soil test
      assert.ok(completeness.missingDimensions.length > 0);
      assert.ok(
        completeness.blockersForAnalysis.some((b) => b.includes("soil pH")),
        "Must flag missing soil pH as an analytical blocker"
      );
    });

    it("should award higher soil score when pH and ECe are farmer-reported", () => {
      const completeness = calculateFarmCompleteness({
        farm: {
          name: "Test Pima Farm",
          latitude: 31.8543,
          longitude: -111.0,
          totalArea: 20,
        },
        fields: [{ id: 1, farmId: 1, name: "Field 1", area: 20, areaUnit: "acre", irrigationType: "drip", isActive: true, createdAt: "" }],
        soilProfiles: [
          {
            id: 1,
            fieldId: 1,
            texture: "sandy_loam",
            soilPh: 7.7,
            ecDsM: 1.1,
            organicMatterPercent: 1.3,
            nitrogenPpm: 20,
            drainageClass: "well_drained",
            salinityRisk: "slight",
            provenanceStatus: "farmer_reported",
            updatedAt: "",
          },
        ],
        waterProfile: {
          id: 1,
          farmId: 1,
          sourceType: "deep_well",
          irrigationSystem: "drip",
          pumpingCapacityGpm: 400,
          volumetricCostPerAcreFoot: 60,
          updatedAt: "",
        },
        cropHistory: [],
        expenses: [],
      });

      assert.ok(completeness.soilScore >= 70);
      assert.ok(completeness.waterScore >= 80);
    });
  });

  describe("2. Farmer Storage & Multi-Tenant Boundary", () => {
    it("should retrieve pre-seeded Green Valley demo farm", () => {
      const farm = FarmerStorage.getFarm(1);
      assert.ok(farm !== null);
      assert.strictEqual(farm.name, "Rancho Santa Cruz Demo Farm");
      assert.strictEqual(farm.latitude, 31.8543);
      assert.strictEqual(farm.longitude, -111.0);
    });

    it("should allow creating, updating, and partitioning fields", () => {
      const farm = FarmerStorage.createFarm({
        farmerId: "tenant_farmer_42",
        name: "Valley Vista Ranch",
        regionName: "Green Valley, AZ",
        latitude: 31.8543,
        longitude: -111.0,
        totalArea: 50,
        areaUnit: "acre",
        productionType: "open_field",
      });

      assert.ok(farm.id > 0);
      assert.strictEqual(farm.farmerId, "tenant_farmer_42");

      const field = FarmerStorage.addField({
        farmId: farm.id,
        name: "East Drip Block",
        area: 25,
        areaUnit: "acre",
        irrigationType: "drip",
        isActive: true,
      });

      assert.strictEqual(field.farmId, farm.id);
      const fields = FarmerStorage.getFields(farm.id);
      assert.strictEqual(fields.length, 1);
    });
  });

  describe("3. Personalized Recommendation Engine", () => {
    it("should integrate biological rotation credit from legume predecessor", () => {
      const farm = FarmerStorage.getFarm(1)!;
      const fields = FarmerStorage.getFields(1);
      const field = fields[0];

      const recommendations = generatePersonalizedRecommendations({
        farm,
        field,
        telemetry: mockTelemetry,
        soil: FarmerStorage.getSoilProfile(field.id),
        water: FarmerStorage.getWaterProfile(farm.id),
        history: [
          {
            id: 1,
            fieldId: field.id,
            seasonYear: 2024,
            seasonName: "Fall 2024",
            cropCode: "faba_bean",
            cropName: "Faba Bean",
            actualYield: 3000,
            yieldUnit: "lbs/acre",
            farmerAssessment: "successful",
            createdAt: "",
          },
        ],
        preferences: FarmerStorage.getPreferences(farm.id),
      });

      assert.strictEqual(recommendations.length, 15);
      const topRec = recommendations[0];
      assert.ok(topRec.rotationAnalysis.nitrogenCreditKgHa > 0, "Legume must yield biological N credit");
      assert.strictEqual(topRec.rotationAnalysis.predecessorCompatibility, "Favorable Predecessor");
    });

    it("should respect farmer excluded crop preference without falsifying scientific score", () => {
      const farm = FarmerStorage.getFarm(1)!;
      const field = FarmerStorage.getFields(1)[0];

      const recommendations = generatePersonalizedRecommendations({
        farm,
        field,
        telemetry: mockTelemetry,
        soil: FarmerStorage.getSoilProfile(field.id),
        water: FarmerStorage.getWaterProfile(farm.id),
        history: [],
        preferences: {
          id: 1,
          farmId: 1,
          primaryObjective: "maximize_profit",
          preferredCropCodes: ["broccoli"],
          excludedCropCodes: [{ code: "cucumber", reason: "Lack of cold chain packing facility" }],
          riskTolerance: "moderate",
          preferredGrowingSeasons: ["fall_winter"],
          targetMarkets: ["wholesale_shipping"],
          updatedAt: "",
        },
      });

      const cucumberRec = recommendations.find((r) => r.crop.id === "cucumber");
      assert.ok(cucumberRec !== undefined);
      assert.strictEqual(cucumberRec.farmerPreferenceMatch.isExcluded, true);
      assert.strictEqual(cucumberRec.farmerPreferenceMatch.exclusionReason, "Lack of cold chain packing facility");
    });
  });

  describe("4. Growing Seasons & Activity Event Logging", () => {
    it("should create active season and log irrigation & harvest records", () => {
      const season = FarmerStorage.addSeason({
        fieldId: 1,
        seasonName: "Spring 2026 Trial Cycle",
        cropCode: "lettuce_romaine",
        cropName: "Romaine Lettuce",
        startDate: "2026-01-15",
        expectedHarvestDate: "2026-04-10",
        cultivatedAreaAcre: 10,
        status: "active",
      });

      assert.ok(season.id > 0);

      const activity = FarmerStorage.addActivity({
        seasonId: season.id,
        activityType: "irrigation",
        activityDate: "2026-02-01",
        quantity: 1.2,
        unit: "inches",
        notes: "Subsurface drip pulse at 12 psi.",
      });

      assert.strictEqual(activity.seasonId, season.id);
      assert.strictEqual(activity.quantity, 1.2);

      const harvest = FarmerStorage.addHarvest({
        seasonId: season.id,
        harvestDate: "2026-04-10",
        actualYield: 24000,
        yieldUnit: "lbs/acre",
        marketableYieldPercent: 88,
        realizedPricePerUnit: 0.65,
        totalRevenue: 15600,
        totalActualCosts: 9200,
        actualNetProfit: 6400,
        farmerSatisfaction: "satisfied",
      });

      assert.strictEqual(harvest.seasonId, season.id);
      assert.strictEqual(harvest.actualNetProfit, 6400);
    });

    it("should record farmer recommendation decisions (feedback loop)", () => {
      const feedback = FarmerStorage.addFeedback({
        recommendationId: 1,
        cropCode: "broccoli",
        action: "accepted",
        feedbackNotes: "Allocating 15 acres for Fall 2026 cycle.",
      });

      assert.ok(feedback.id > 0);
      assert.strictEqual(feedback.action, "accepted");
      assert.strictEqual(feedback.cropCode, "broccoli");
    });
  });
});
