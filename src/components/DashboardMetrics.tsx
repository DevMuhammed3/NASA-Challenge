"use client";

import React from "react";
import {
  Thermometer,
  CloudRain,
  Droplets,
  Sun,
  Wind,
  Layers,
  MapPin,
  Calendar,
  Clock,
  Radio,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import type {
  LatestObservation,
  ClimateSummaryStats,
  NasaPowerParameterMeta,
} from "@/lib/types/environmental";

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
}

export function DashboardMetrics({
  location,
  latestObservation,
  summaryStats,
  parameterMetadata,
  retrievalTimestamp,
  isCached,
  providerStatus,
}: DashboardMetricsProps) {
  const getUnit = (code: string) => parameterMetadata[code]?.units || "";

  const formattedUpdate = retrievalTimestamp
    ? new Date(retrievalTimestamp).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "Never";

  return (
    <div className="space-y-5">
      {/* Location & Status Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#435133] bg-[#323D25]/90 p-5 shadow-lg backdrop-blur-sm">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#9A7E3B]/20 px-2.5 py-0.5 text-xs font-semibold text-[#D2CF9A] border border-[#9A7E3B]/40">
              <MapPin className="h-3 w-3 text-[#9A7E3B]" />
              Prototype Test Location
            </span>
            {location.isPredefinedPrototype && (
              <span className="rounded bg-[#28301C] px-2 py-0.5 text-[10px] font-medium text-[#9FA37C] border border-[#435133]">
                Default Predefined
              </span>
            )}
            {isCached && (
              <span className="rounded bg-[#435133]/40 px-2 py-0.5 text-[10px] text-[#9FA37C]">
                Cached Response
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#D2CF9A]">
            {location.name}
          </h2>
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#9FA37C]">
            <span>Lat: {location.latitude.toFixed(4)}°N</span>
            <span>Lon: {location.longitude.toFixed(4)}°W</span>
            <span className="text-[#9FA37C]/60">•</span>
            <span className="text-[#9FA37C]/90 italic">
              Coordinates represent a location marker, not a surveyed farm boundary.
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#9FA37C]">NASA POWER Status:</span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                providerStatus === "Connected"
                  ? "bg-[#52B788]/20 text-[#52B788] border border-[#52B788]/30"
                  : providerStatus === "Loading"
                  ? "bg-[#9A7E3B]/20 text-[#D2CF9A] border border-[#9A7E3B]/30"
                  : "bg-red-900/30 text-red-300 border border-red-700/40"
              }`}
            >
              <Radio className="h-3 w-3" />
              {providerStatus}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#9FA37C]">
            <Clock className="h-3 w-3" />
            <span>Last Update: {formattedUpdate}</span>
          </div>
        </div>
      </div>

      {/* Critical Distinction Notice */}
      <div className="flex items-start gap-3 rounded-xl border border-[#9A7E3B]/40 bg-[#9A7E3B]/10 p-3.5 text-xs text-[#D2CF9A]">
        <AlertCircle className="h-4 w-4 shrink-0 text-[#9A7E3B] mt-0.5" />
        <div>
          <span className="font-semibold text-[#D2CF9A]">
            Temporal Semantics Clarification:
          </span>{" "}
          The cards below display the{" "}
          <strong className="underline">
            Latest Available Historical Observation
          </strong>{" "}
          from the NASA POWER MERRA-2 daily dataset (recorded on{" "}
          <span className="font-mono font-bold text-[#D2CF9A]">
            {latestObservation.date}
          </span>
          ). This is historical satellite reanalysis and must{" "}
          <strong className="underline">not</strong> be interpreted as live current weather conditions.
        </div>
      </div>

      {/* Primary Observations Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Temperature Card */}
        <div className="rounded-xl border border-[#435133] bg-[#323D25] p-4 transition hover:border-[#9A7E3B]/50">
          <div className="flex items-center justify-between text-[#9FA37C]">
            <span className="text-xs font-medium uppercase tracking-wider">
              Temperature (T2M)
            </span>
            <Thermometer className="h-4 w-4 text-[#E09F3E]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#D2CF9A]">
              {latestObservation.t2m !== null ? `${latestObservation.t2m}` : "N/A"}
            </span>
            <span className="text-xs text-[#9FA37C] font-mono">
              {getUnit("T2M")} (Daily Mean)
            </span>
          </div>
          <div className="mt-2.5 flex items-center justify-between border-t border-[#435133]/50 pt-2 text-[11px] font-mono text-[#9FA37C]">
            <span>
              Max:{" "}
              <strong className="text-[#D2CF9A]">
                {latestObservation.t2mMax !== null ? `${latestObservation.t2mMax}°C` : "N/A"}
              </strong>
            </span>
            <span>
              Min:{" "}
              <strong className="text-[#D2CF9A]">
                {latestObservation.t2mMin !== null ? `${latestObservation.t2mMin}°C` : "N/A"}
              </strong>
            </span>
          </div>
          <div className="mt-1 text-[10px] text-[#9FA37C]/80 italic">
            5-Year Mean: {summaryStats.temperature.mean}°C
          </div>
        </div>

        {/* Precipitation Card */}
        <div className="rounded-xl border border-[#435133] bg-[#323D25] p-4 transition hover:border-[#9A7E3B]/50">
          <div className="flex items-center justify-between text-[#9FA37C]">
            <span className="text-xs font-medium uppercase tracking-wider">
              Precipitation (PRECTOTCORR)
            </span>
            <CloudRain className="h-4 w-4 text-[#48CAE4]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#D2CF9A]">
              {latestObservation.precip !== null ? `${latestObservation.precip}` : "N/A"}
            </span>
            <span className="text-xs text-[#9FA37C] font-mono">
              {getUnit("PRECTOTCORR")}
            </span>
          </div>
          <div className="mt-2.5 flex items-center justify-between border-t border-[#435133]/50 pt-2 text-[11px] font-mono text-[#9FA37C]">
            <span>
              Annual Avg:{" "}
              <strong className="text-[#D2CF9A]">
                {summaryStats.precipitation.annualAverageMm} mm
              </strong>
            </span>
          </div>
          <div className="mt-1 text-[10px] text-[#9FA37C]/80 italic">
            5-Year Cumulative: {summaryStats.precipitation.totalFiveYearMm} mm
          </div>
        </div>

        {/* Relative Humidity Card */}
        <div className="rounded-xl border border-[#435133] bg-[#323D25] p-4 transition hover:border-[#9A7E3B]/50">
          <div className="flex items-center justify-between text-[#9FA37C]">
            <span className="text-xs font-medium uppercase tracking-wider">
              Relative Humidity (RH2M)
            </span>
            <Droplets className="h-4 w-4 text-[#52B788]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#D2CF9A]">
              {latestObservation.rh2m !== null ? `${latestObservation.rh2m}` : "N/A"}
            </span>
            <span className="text-xs text-[#9FA37C] font-mono">
              {getUnit("RH2M")}
            </span>
          </div>
          <div className="mt-2.5 flex items-center justify-between border-t border-[#435133]/50 pt-2 text-[11px] font-mono text-[#9FA37C]">
            <span>
              Wind Speed (WS10M):{" "}
              <strong className="text-[#D2CF9A]">
                {latestObservation.ws10m !== null ? `${latestObservation.ws10m} m/s` : "N/A"}
              </strong>
            </span>
          </div>
          <div className="mt-1 text-[10px] text-[#9FA37C]/80 italic">
            5-Year Mean Humidity: {summaryStats.humidity.meanPercent}%
          </div>
        </div>

        {/* Solar Radiation Card */}
        <div className="rounded-xl border border-[#435133] bg-[#323D25] p-4 transition hover:border-[#9A7E3B]/50">
          <div className="flex items-center justify-between text-[#9FA37C]">
            <span className="text-xs font-medium uppercase tracking-wider">
              Solar Radiation
            </span>
            <Sun className="h-4 w-4 text-[#9A7E3B]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#D2CF9A]">
              {latestObservation.solar !== null ? `${latestObservation.solar}` : "N/A"}
            </span>
            <span className="text-xs text-[#9FA37C] font-mono">
              MJ/m²/day
            </span>
          </div>
          <div className="mt-2.5 flex items-center justify-between border-t border-[#435133]/50 pt-2 text-[11px] font-mono text-[#9FA37C]">
            <span>
              5-Yr Mean:{" "}
              <strong className="text-[#D2CF9A]">
                {summaryStats.solar.meanMjM2Day} MJ/m²/day
              </strong>
            </span>
          </div>
          <div className="mt-1 text-[10px] text-[#9FA37C]/80 italic">
            Shortwave Downward Irradiance (ALLSKY)
          </div>
        </div>
      </div>

      {/* Soil Moisture Indicators Bar */}
      <div className="rounded-2xl border border-[#435133] bg-[#323D25]/80 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#435133]/50 pb-2.5">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-[#9A7E3B]" />
            <h4 className="text-sm font-semibold text-[#D2CF9A]">
              Soil Moisture Indicators (NASA POWER Wetness Fraction 0–1)
            </h4>
          </div>
          <span className="text-xs text-[#9FA37C]">
            Observed on: {latestObservation.formattedDate}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Surface GWETTOP */}
          <div className="rounded-xl bg-[#28301C]/80 p-3.5 border border-[#435133]">
            <div className="flex justify-between text-xs text-[#9FA37C]">
              <span>Surface Soil Wetness (GWETTOP)</span>
              <span className="font-mono text-[#D2CF9A]">0–5 cm depth</span>
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-[#D2CF9A]">
                {latestObservation.gwettop !== null
                  ? `${(latestObservation.gwettop * 100).toFixed(1)}%`
                  : "N/A"}
              </span>
              <span className="text-xs text-[#9FA37C]">
                ({latestObservation.gwettop ?? "N/A"} fraction)
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#323D25]">
              <div
                className="h-full bg-[#48CAE4] transition-all"
                style={{
                  width: `${Math.min(100, (latestObservation.gwettop || 0) * 100)}%`,
                }}
              />
            </div>
            <div className="mt-1.5 text-[10px] text-[#9FA37C]">
              5-Year Mean: {(summaryStats.soilMoisture.surfaceMean * 100).toFixed(1)}%
            </div>
          </div>

          {/* Root Zone GWETROOT */}
          <div className="rounded-xl bg-[#28301C]/80 p-3.5 border border-[#435133]">
            <div className="flex justify-between text-xs text-[#9FA37C]">
              <span>Root Zone Wetness (GWETROOT)</span>
              <span className="font-mono text-[#D2CF9A]">0–100 cm depth</span>
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-[#D2CF9A]">
                {latestObservation.gwetroot !== null
                  ? `${(latestObservation.gwetroot * 100).toFixed(1)}%`
                  : "N/A"}
              </span>
              <span className="text-xs text-[#9FA37C]">
                ({latestObservation.gwetroot ?? "N/A"} fraction)
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#323D25]">
              <div
                className="h-full bg-[#52B788] transition-all"
                style={{
                  width: `${Math.min(100, (latestObservation.gwetroot || 0) * 100)}%`,
                }}
              />
            </div>
            <div className="mt-1.5 text-[10px] text-[#9FA37C]">
              5-Year Mean: {(summaryStats.soilMoisture.rootZoneMean * 100).toFixed(1)}%
            </div>
          </div>

          {/* Profile GWETPROF */}
          <div className="rounded-xl bg-[#28301C]/80 p-3.5 border border-[#435133]">
            <div className="flex justify-between text-xs text-[#9FA37C]">
              <span>Profile Soil Wetness (GWETPROF)</span>
              <span className="font-mono text-[#D2CF9A]">Total root zone</span>
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-[#D2CF9A]">
                {latestObservation.gwetprof !== null
                  ? `${(latestObservation.gwetprof * 100).toFixed(1)}%`
                  : "N/A"}
              </span>
              <span className="text-xs text-[#9FA37C]">
                ({latestObservation.gwetprof ?? "N/A"} fraction)
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#323D25]">
              <div
                className="h-full bg-[#9A7E3B] transition-all"
                style={{
                  width: `${Math.min(100, (latestObservation.gwetprof || 0) * 100)}%`,
                }}
              />
            </div>
            <div className="mt-1.5 text-[10px] text-[#9FA37C]">
              5-Year Mean: {(summaryStats.soilMoisture.profileMean * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
