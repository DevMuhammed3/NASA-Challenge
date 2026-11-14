import test, { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  createAvailableDataPoint,
  createUnavailableDataPoint,
  type DataPoint,
} from "../src/lib/types/provenance";
import { fetchGreenValleySoilData } from "../src/lib/services/usda-ssurgo";
import { getHistoricalEnvironmentalData } from "../src/lib/services/nasa-power";

describe("GAIA Data Provenance & Zero Mock Suite", () => {
  describe("1. DataPoint Provenance Structure", () => {
    it("should correctly instantiate available data points with full provenance metadata", () => {
      const point = createAvailableDataPoint({
        value: 24.5,
        unit: "°C",
        source: "NASA POWER Daily Point API (AG Community)",
        sourceUrl: "https://power.larc.nasa.gov",
        observationDate: "2024-06-15",
        status: "live_api",
        methodology: "Gridded MERRA-2 2-meter air temperature model assimilation",
      });

      assert.strictEqual(point.value, 24.5);
      assert.strictEqual(point.isAvailable, true);
      assert.strictEqual(point.unit, "°C");
      assert.strictEqual(point.status, "live_api");
      assert.strictEqual(point.source, "NASA POWER Daily Point API (AG Community)");
      assert(point.retrievedAt.length > 0);
      assert.strictEqual(point.unavailableReason, undefined);
    });

    it("should strictly enforce unavailable reason and required physical diagnostic for unavailable metrics", () => {
      const unavailablePoint = createUnavailableDataPoint<number>({
        unit: "ppm NO3-N",
        source: "USDA NRCS SSURGO / Soil Data Access",
        sourceUrl: "https://sdmdataaccess.sc.egov.usda.gov",
        unavailableReason:
          "Soil survey databases do not record dynamic season-dependent available nitrogen levels.",
        requiredMeasurementOrSource:
          "Certified agricultural laboratory soil test (e.g. University of Arizona Soil Testing Lab nitrate-N extraction).",
      });

      assert.strictEqual(unavailablePoint.value, null);
      assert.strictEqual(unavailablePoint.isAvailable, false);
      assert.strictEqual(unavailablePoint.status, "unavailable");
      assert(unavailablePoint.unavailableReason?.includes("dynamic"));
      assert(unavailablePoint.requiredMeasurementOrSource?.includes("laboratory"));
    });
  });

  describe("2. NASA POWER Fill-Value Sanitization", () => {
    it("should never interpret NASA POWER fill values (-999.0 or <= -900) as zero", async () => {
      // Test the live/fallback NASA POWER service for Green Valley
      const telemetry = await getHistoricalEnvironmentalData(31.8543, -111.0);
      assert(telemetry);
      assert.strictEqual(telemetry.status, "Success");

      // Verify no daily observation has negative fill value treated as a real temperature
      for (const obs of telemetry.recentDailyObservations) {
        if (obs.t2m !== null) {
          assert(obs.t2m > -50, `T2M ${obs.t2m} should not be fill value`);
        }
        if (obs.precip !== null) {
          assert(obs.precip >= 0, `Precipitation ${obs.precip} should be non-negative`);
        }
        if (obs.solar !== null) {
          assert(obs.solar >= 0, `Solar irradiance ${obs.solar} should be non-negative`);
        }
      }

      // Verify that provenance dictionary is attached and includes unavailable NDVI
      assert(telemetry.provenance);
      assert.strictEqual(telemetry.provenance.ndvi.isAvailable, false);
      assert.strictEqual(telemetry.provenance.ndvi.status, "unavailable");
      assert(telemetry.provenance.ndvi.unavailableReason?.includes("WMTS"));
    });
  });

  describe("3. USDA NRCS SSURGO Soil Integration", () => {
    it("should load verified Green Valley Map Unit 53844 soil characteristics", async () => {
      const soil = await fetchGreenValleySoilData(31.8543, -111.0);
      assert(soil);

      // Verify official NCSS Map Unit 53844
      assert.strictEqual(soil.mapUnitKey.value, "53844");
      assert(soil.mapUnitName.value?.includes("Arizo-Riverwash"));
      assert.strictEqual(soil.dominantComponent.value, "Arizo");
      assert.strictEqual(soil.drainageClass.value, "Excessively drained");

      // Verify physical texture fractions
      assert.strictEqual(soil.sandPercentage.value, 83.5);
      assert.strictEqual(soil.siltPercentage.value, 9.0);
      assert.strictEqual(soil.clayPercentage.value, 7.5);
      assert.strictEqual(soil.availableWaterCapacity.value, 0.06);
      assert.strictEqual(soil.saturatedHydraulicConductivity.value, 92.0);

      // Verify taxonomic survey benchmarks
      assert.strictEqual(soil.taxonomicSurveyPh.value, 8.2);
      assert.strictEqual(soil.taxonomicSurveyEc.value, 1.0);

      // Verify that unmeasured nutrients are strictly marked UNAVAILABLE
      assert.strictEqual(soil.availableNitrogen.isAvailable, false);
      assert.strictEqual(soil.availableNitrogen.status, "unavailable");
      assert(soil.availableNitrogen.requiredMeasurementOrSource?.includes("laboratory"));

      assert.strictEqual(soil.availablePhosphorus.isAvailable, false);
      assert.strictEqual(soil.availablePhosphorus.status, "unavailable");
      assert(soil.availablePhosphorus.requiredMeasurementOrSource?.includes("Olsen-P"));

      assert.strictEqual(soil.availablePotassium.isAvailable, false);
      assert.strictEqual(soil.availablePotassium.status, "unavailable");

      assert.strictEqual(soil.fieldMeasuredPh.isAvailable, false);
      assert.strictEqual(soil.fieldMeasuredSalinityEc.isAvailable, false);
      assert.strictEqual(soil.irrigationWaterRights.isAvailable, false);
    });
  });
});
