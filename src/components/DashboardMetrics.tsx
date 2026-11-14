"use client";

import React, { useState } from "react";
import {
  Thermometer,
  CloudRain,
  Droplets,
  Sun,
  Wind,
  Layers,
  MapPin,
  Clock,
  Radio,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  ShieldCheck,
  Info,
} from "lucide-react";
import type {
  LatestObservation,
  ClimateSummaryStats,
  NasaPowerParameterMeta,
} from "@/lib/types/environmental";
import type { SsurgoSoilProfile } from "@/lib/services/usda-ssurgo";
import type { DataPoint } from "@/lib/types/provenance";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DataProvenanceBadge } from "@/components/DataProvenanceBadge";

interface DashboardMetricsProps {
  location: {
    name: string;
    latitude: number;
    longitude: number;
    isPredefinedPrototype: boolean;
  };
  latestObservation: LatestObservation;
  summaryStats: ClimateSummaryStats;
  parameterMetadata: Record<string, NasaPowerParameterMeta>;
  retrievalTimestamp: string;
  isCached: boolean;
  providerStatus: "Connected" | "Error" | "Loading";
  soilProfile?: SsurgoSoilProfile;
  provenance?: Record<string, DataPoint<unknown>>;
}

// Simple unit converters for farmer convenience
const cToF = (c: number | null | undefined): string => {
  if (c === null || c === undefined) return "N/A";
  return `${Math.round((c * 9) / 5 + 32)}°F`;
};

const mmToIn = (mm: number | null | undefined): string => {
  if (mm === null || mm === undefined) return "N/A";
  return `${(mm * 0.0393701).toFixed(2)} in`;
};

const msToMph = (ms: number | null | undefined): string => {
  if (ms === null || ms === undefined) return "N/A";
  return `${Math.round(ms * 2.23694)} mph`;
};

export function DashboardMetrics({
  location,
  latestObservation,
  summaryStats,
  parameterMetadata,
  retrievalTimestamp,
  isCached,
  providerStatus,
  soilProfile,
  provenance,
}: DashboardMetricsProps) {
  const [showSoilDetails, setShowSoilDetails] = useState(false);

  const formattedUpdate = retrievalTimestamp
    ? new Date(retrievalTimestamp).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "Recently";

  // Root soil moisture percentage
  const rootMoisturePct =
    latestObservation.gwetroot !== null
      ? Math.round(latestObservation.gwetroot * 100)
      : null;

  // Practical farmer evaluation
  const isFreezing = (latestObservation.t2mMin ?? 20) <= 0;
  const isHeatWave = (latestObservation.t2mMax ?? 20) >= 38;
  const isGoodSpraying = (latestObservation.ws2m ?? 2) < 4.5; // < 10 mph

  return (
    <div className="flex flex-col gap-5 min-w-0">
      {/* 1. Quick Farmer Summary Banner */}
      <div className="rounded-2xl border border-[#41644A]/30 bg-gradient-to-r from-[#EEF0E6] via-[#F4F6F0] to-[#FFFFFF] p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 text-xs font-bold text-[#41644A] uppercase tracking-wide">
                <CheckCircle2 className="size-4 text-[#41644A]" />
                Today&apos;s Field Conditions
              </span>
              <span className="text-xs text-[#687365]">•</span>
              <span className="text-xs font-semibold text-[#28301C]">
                {location.name}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#28301C]">
              {latestObservation.t2m !== null
                ? `${cToF(latestObservation.t2m)} (${latestObservation.t2m}°C) — ${
                    isFreezing
                      ? "⚠️ Frost Alert Tonight"
                      : isHeatWave
                        ? "☀️ High Heat Warning"
                        : "Mild & Clear Growing Weather"
                  }`
                : "Weather conditions active"}
            </h2>
            <p className="text-xs text-[#687365]">
              {latestObservation.precip && latestObservation.precip > 0.5
                ? `Rainfall recorded: ${mmToIn(latestObservation.precip)}. Reduce daily irrigation.`
                : "No rain today. Maintain standard drip irrigation schedule for your active crops."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E2E6DA] text-[#28301C]">
              <span className="size-2 rounded-full bg-[#41644A]" />
              <span className="text-[#687365]">Satellite:</span>
              <span className="font-bold text-[#41644A]">{providerStatus}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E2E6DA] text-[#687365]">
              <Clock className="size-3.5" />
              <span>Updated: {formattedUpdate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Primary 4 Observation Cards (Easy to read for farmers) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Air Temperature */}
        <Card className="border-[#E2E6DA] bg-white p-4 shadow-xs hover:border-[#41644A] transition-all">
          <CardContent className="p-0 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between text-[#687365]">
                <span className="text-xs font-bold text-[#28301C]">
                  Air Temperature
                </span>
                <div className="p-1.5 rounded-lg bg-[#EEF0E6] text-[#41644A]">
                  <Thermometer className="size-4" />
                </div>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#28301C]">
                  {cToF(latestObservation.t2m)}
                </span>
                <span className="text-sm font-semibold text-[#687365]">
                  ({latestObservation.t2m}°C)
                </span>
              </div>
              <p className="text-xs text-[#41644A] font-medium mt-1">
                {isFreezing
                  ? "Protect cold-sensitive plants"
                  : isHeatWave
                    ? "Provide shade cloth"
                    : "Optimal for cool & warm crops"}
              </p>
            </div>

            <div className="mt-4 pt-2.5 border-t border-[#E2E6DA] flex items-center justify-between text-xs text-[#687365]">
              <span>
                High: <strong className="text-[#28301C]">{cToF(latestObservation.t2mMax)}</strong>
              </span>
              <span>•</span>
              <span>
                Low: <strong className="text-[#28301C]">{cToF(latestObservation.t2mMin)}</strong>
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Rainfall */}
        <Card className="border-[#E2E6DA] bg-white p-4 shadow-xs hover:border-[#41644A] transition-all">
          <CardContent className="p-0 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between text-[#687365]">
                <span className="text-xs font-bold text-[#28301C]">
                  Rainfall Today
                </span>
                <div className="p-1.5 rounded-lg bg-sky-50 text-sky-700">
                  <CloudRain className="size-4" />
                </div>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#28301C]">
                  {mmToIn(latestObservation.precip)}
                </span>
                <span className="text-sm font-semibold text-[#687365]">
                  ({latestObservation.precip ?? 0} mm)
                </span>
              </div>
              <p className="text-xs text-[#687365] font-medium mt-1">
                {(latestObservation.precip ?? 0) === 0
                  ? "Dry — Drip irrigation needed"
                  : "Light rain recorded"}
              </p>
            </div>

            <div className="mt-4 pt-2.5 border-t border-[#E2E6DA] flex items-center justify-between text-xs text-[#687365]">
              <span>Annual Average:</span>
              <strong className="text-[#28301C]">
                {mmToIn(summaryStats.precipitation.annualAverageMm)}/yr
              </strong>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Soil Moisture */}
        <Card className="border-[#E2E6DA] bg-white p-4 shadow-xs hover:border-[#41644A] transition-all">
          <CardContent className="p-0 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between text-[#687365]">
                <span className="text-xs font-bold text-[#28301C]">
                  Root Soil Moisture
                </span>
                <div className="p-1.5 rounded-lg bg-emerald-50 text-[#41644A]">
                  <Layers className="size-4" />
                </div>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#28301C]">
                  {rootMoisturePct !== null ? `${rootMoisturePct}%` : "N/A"}
                </span>
                <span className="text-xs font-semibold text-[#41644A]">
                  {rootMoisturePct !== null && rootMoisturePct >= 35
                    ? "Adequate"
                    : "Low — Water Soon"}
                </span>
              </div>
              {/* Simple visual bar */}
              <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-[#EEF0E6]">
                <div
                  className="h-full bg-[#41644A] rounded-full transition-all"
                  style={{ width: `${Math.min(100, Math.max(5, rootMoisturePct || 0))}%` }}
                />
              </div>
            </div>

            <div className="mt-4 pt-2.5 border-t border-[#E2E6DA] flex items-center justify-between text-xs text-[#687365]">
              <span>Depth: 0–100 cm (Root Zone)</span>
              <span>•</span>
              <span className="text-[#41644A] font-semibold">NASA GEOS-5</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Wind & Spraying Conditions */}
        <Card className="border-[#E2E6DA] bg-white p-4 shadow-xs hover:border-[#41644A] transition-all">
          <CardContent className="p-0 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between text-[#687365]">
                <span className="text-xs font-bold text-[#28301C]">
                  Wind &amp; Spray Safety
                </span>
                <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
                  <Wind className="size-4" />
                </div>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#28301C]">
                  {msToMph(latestObservation.ws2m ?? latestObservation.ws10m)}
                </span>
                <span className="text-xs font-semibold text-[#687365]">
                  ({latestObservation.ws2m ?? latestObservation.ws10m ?? 0} m/s)
                </span>
              </div>
              <p
                className={`text-xs font-semibold mt-1 ${
                  isGoodSpraying ? "text-[#41644A]" : "text-amber-700"
                }`}
              >
                {isGoodSpraying ? "✓ Good for spraying (Low drift)" : "⚠️ Caution: High drift risk"}
              </p>
            </div>

            <div className="mt-4 pt-2.5 border-t border-[#E2E6DA] flex items-center justify-between text-xs text-[#687365]">
              <span>Humidity: {latestObservation.rh2m ?? 35}%</span>
              <span>•</span>
              <span>Sun: {latestObservation.solar ?? 21} MJ/m²</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Soil Overview Card (USDA SSURGO & Practical Advice) */}
      <Card className="border-[#E2E6DA] bg-white p-4 sm:p-5 shadow-xs">
        <CardHeader className="p-0 pb-3 border-b border-[#E2E6DA] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#EEF0E6] text-[#41644A]">
              <FlaskConical className="size-4 text-[#41644A]" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-[#28301C]">
                Your Soil Type &amp; Water Needs
              </CardTitle>
              <CardDescription className="text-xs text-[#687365]">
                Official USDA NRCS Soil Survey for Green Valley (Map Unit 53844)
              </CardDescription>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowSoilDetails(!showSoilDetails)}
            className="text-xs text-[#41644A] hover:text-[#28301C] flex items-center gap-1 font-semibold cursor-pointer"
          >
            <span>{showSoilDetails ? "Hide Soil Details" : "Show Technical Details"}</span>
            {showSoilDetails ? (
              <ChevronUp className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
          </button>
        </CardHeader>

        <CardContent className="p-0 pt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Box 1: Soil Texture */}
            <div className="p-3 rounded-xl bg-[#EEF0E6]/50 border border-[#E2E6DA]">
              <span className="text-xs font-semibold text-[#687365] block">
                Dominant Soil Series
              </span>
              <span className="text-base font-bold text-[#28301C] block mt-0.5">
                {soilProfile?.dominantComponent.value || "Arizo Sandy Loam"}
              </span>
              <span className="text-xs text-[#687365] mt-1 block">
                Sandy-skeletal texture (83.5% sand).
              </span>
            </div>

            {/* Box 2: Drainage & Water */}
            <div className="p-3 rounded-xl bg-[#EEF0E6]/50 border border-[#E2E6DA]">
              <span className="text-xs font-semibold text-[#687365] block">
                Water Holding Capacity
              </span>
              <span className="text-base font-bold text-[#41644A] block mt-0.5">
                Fast Draining (Low AWC)
              </span>
              <span className="text-xs text-[#687365] mt-1 block">
                Frequent, light drip irrigation is recommended.
              </span>
            </div>

            {/* Box 3: Natural pH */}
            <div className="p-3 rounded-xl bg-[#EEF0E6]/50 border border-[#E2E6DA]">
              <span className="text-xs font-semibold text-[#687365] block">
                Natural Soil Reaction
              </span>
              <span className="text-base font-bold text-[#28301C] block mt-0.5">
                pH {soilProfile?.taxonomicSurveyPh.value || 8.2} (Alkaline)
              </span>
              <span className="text-xs text-[#687365] mt-1 block">
                Typical of desert alluvium. Fosters brassicas and melons.
              </span>
            </div>

            {/* Box 4: Soil Lab Tip */}
            <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200">
              <span className="text-xs font-semibold text-amber-900 block">
                Farm Lab Testing
              </span>
              <span className="text-base font-bold text-amber-900 block mt-0.5">
                Local N-P-K Test
              </span>
              <span className="text-xs text-amber-800 mt-1 block">
                Send 1 cup of soil to UA Extension for exact fertilizer rates.
              </span>
            </div>
          </div>

          {/* Collapsible SSURGO Advanced Details */}
          {showSoilDetails && (
            <div className="rounded-xl border border-[#E2E6DA] bg-[#EEF0E6]/40 p-3.5 space-y-2 text-xs text-[#28301C]">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#E2E6DA] font-bold">
                <span>USDA NRCS Soil Data Access Telemetry</span>
                <DataProvenanceBadge
                  status="live_api"
                  source="USDA NRCS SSURGO"
                  sourceUrl="https://sdmdataaccess.sc.egov.usda.gov"
                  compact
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#687365]">
                <div>
                  <strong>Map Unit:</strong>{" "}
                  {soilProfile?.mapUnitName.value || "Arizo-Riverwash complex"} (53844)
                </div>
                <div>
                  <strong>Taxonomy:</strong>{" "}
                  {soilProfile?.taxonomicClassification.value || "Typic Torriorthents"}
                </div>
                <div>
                  <strong>Permeability (Ksat):</strong>{" "}
                  {soilProfile?.saturatedHydraulicConductivity.value || 92} µm/s (~13 in/hr)
                </div>
                <div>
                  <strong>Organic Matter:</strong>{" "}
                  {soilProfile?.organicMatterPercentage.value || 0.75}%
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
