"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  Thermometer,
  CloudRain,
  Droplets,
  Layers,
  Calendar,
  Table as TableIcon,
  ChevronLeft,
  ChevronRight,
  Info,
  Search,
} from "lucide-react";
import type {
  MonthlyAggregate,
  DailyObservation,
  NasaPowerParameterMeta,
} from "@/lib/types/environmental";

interface HistoricalDataSectionProps {
  monthlyAggregates: MonthlyAggregate[];
  recentObservations: DailyObservation[];
  totalObservationsCount: number;
  parameterMetadata: Record<string, NasaPowerParameterMeta>;
}

type ChartMetric = "temperature" | "precipitation" | "humidity" | "soil_moisture";

export function HistoricalDataSection({
  monthlyAggregates,
  recentObservations,
  totalObservationsCount,
  parameterMetadata,
}: HistoricalDataSectionProps) {
  const [activeMetric, setActiveMetric] = useState<ChartMetric>("temperature");
  const [showInspector, setShowInspector] = useState(false);
  const [inspectorFilter, setInspectorFilter] = useState("");
  const [inspectorPage, setInspectorPage] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const pageSize = 15;

  // Filtered daily observations
  const filteredDaily = recentObservations.filter((d) =>
    inspectorFilter ? d.date.includes(inspectorFilter) : true
  );
  const totalPages = Math.ceil(filteredDaily.length / pageSize) || 1;
  const pageObservations = filteredDaily.slice(
    inspectorPage * pageSize,
    (inspectorPage + 1) * pageSize
  );

  // SVG Chart Dimensions
  const chartWidth = 900;
  const chartHeight = 240;
  const padding = { top: 20, right: 30, bottom: 40, left: 55 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Chart configuration based on active metric
  const renderChart = () => {
    if (monthlyAggregates.length === 0) {
      return (
        <div className="flex h-56 items-center justify-center text-xs text-[#9FA37C]">
          No monthly aggregated telemetry available.
        </div>
      );
    }

    const n = monthlyAggregates.length;
    const xStep = innerWidth / Math.max(1, n - 1);

    if (activeMetric === "temperature") {
      const temps = monthlyAggregates.flatMap((m) => [
        m.t2mMean ?? 0,
        m.t2mMax ?? 0,
        m.t2mMin ?? 0,
      ]);
      const minY = Math.floor(Math.min(...temps) - 2);
      const maxY = Math.ceil(Math.max(...temps) + 2);
      const yScale = (val: number) =>
        padding.top + innerHeight - ((val - minY) / (maxY - minY)) * innerHeight;

      const meanPoints = monthlyAggregates.map((m, i) => ({
        x: padding.left + i * xStep,
        y: m.t2mMean !== null ? yScale(m.t2mMean) : null,
      }));
      const maxPoints = monthlyAggregates.map((m, i) => ({
        x: padding.left + i * xStep,
        y: m.t2mMax !== null ? yScale(m.t2mMax) : null,
      }));
      const minPoints = monthlyAggregates.map((m, i) => ({
        x: padding.left + i * xStep,
        y: m.t2mMin !== null ? yScale(m.t2mMin) : null,
      }));

      const makePath = (pts: { x: number; y: number | null }[]) =>
        pts
          .filter((p): p is { x: number; y: number } => p.y !== null)
          .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
          .join(" ");

      return (
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="h-full w-full overflow-visible"
        >
          {/* Grid lines */}
          {[minY, Math.round((minY + maxY) / 2), maxY].map((val) => (
            <g key={val}>
              <line
                x1={padding.left}
                y1={yScale(val)}
                x2={chartWidth - padding.right}
                y2={yScale(val)}
                stroke="#435133"
                strokeDasharray="4 4"
                strokeWidth="0.8"
              />
              <text
                x={padding.left - 8}
                y={yScale(val) + 4}
                textAnchor="end"
                className="fill-[#9FA37C] text-[10px] font-mono"
              >
                {val}°C
              </text>
            </g>
          ))}

          {/* Area between max and min */}
          <path
            d={`${makePath(maxPoints)} L ${minPoints
              .filter((p) => p.y !== null)
              .reverse()
              .map((p) => `${p.x.toFixed(1)} ${p.y!.toFixed(1)}`)
              .join(" L ")} Z`}
            fill="#E09F3E"
            fillOpacity="0.12"
          />

          {/* Lines */}
          <path d={makePath(maxPoints)} fill="none" stroke="#E09F3E" strokeWidth="1.5" />
          <path d={makePath(minPoints)} fill="none" stroke="#48CAE4" strokeWidth="1.5" />
          <path d={makePath(meanPoints)} fill="none" stroke="#D2CF9A" strokeWidth="2.5" />

          {/* Month X Labels */}
          {monthlyAggregates.map((m, i) => {
            if (i % 6 !== 0 && i !== n - 1) return null;
            return (
              <text
                key={m.month}
                x={padding.left + i * xStep}
                y={chartHeight - 12}
                textAnchor="middle"
                className="fill-[#9FA37C] text-[10px] font-mono"
              >
                {m.label}
              </text>
            );
          })}

          {/* Hover interactive bars */}
          {monthlyAggregates.map((m, i) => (
            <rect
              key={m.month}
              x={padding.left + i * xStep - xStep / 2}
              y={padding.top}
              width={xStep}
              height={innerHeight}
              fill="transparent"
              className="cursor-pointer hover:fill-[#9A7E3B]/10"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          ))}

          {hoveredIndex !== null && monthlyAggregates[hoveredIndex] && (
            <g>
              <line
                x1={padding.left + hoveredIndex * xStep}
                y1={padding.top}
                x2={padding.left + hoveredIndex * xStep}
                y2={chartHeight - padding.bottom}
                stroke="#D2CF9A"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
            </g>
          )}
        </svg>
      );
    }

    if (activeMetric === "precipitation") {
      const maxPrecip = Math.ceil(
        Math.max(...monthlyAggregates.map((m) => m.precipSum), 10)
      );
      const yScale = (val: number) =>
        padding.top + innerHeight - (val / maxPrecip) * innerHeight;
      const barWidth = Math.max(3, (innerWidth / n) * 0.75);

      return (
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="h-full w-full overflow-visible"
        >
          {[0, Math.round(maxPrecip / 2), maxPrecip].map((val) => (
            <g key={val}>
              <line
                x1={padding.left}
                y1={yScale(val)}
                x2={chartWidth - padding.right}
                y2={yScale(val)}
                stroke="#435133"
                strokeDasharray="4 4"
                strokeWidth="0.8"
              />
              <text
                x={padding.left - 8}
                y={yScale(val) + 4}
                textAnchor="end"
                className="fill-[#9FA37C] text-[10px] font-mono"
              >
                {val} mm
              </text>
            </g>
          ))}

          {monthlyAggregates.map((m, i) => {
            const x = padding.left + i * xStep - barWidth / 2;
            const y = yScale(m.precipSum);
            const h = padding.top + innerHeight - y;
            return (
              <rect
                key={m.month}
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(1, h)}
                fill="#48CAE4"
                fillOpacity={hoveredIndex === i ? 0.9 : 0.65}
                rx="2"
                className="cursor-pointer transition-all hover:fill-[#52B788]"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            );
          })}

          {monthlyAggregates.map((m, i) => {
            if (i % 6 !== 0 && i !== n - 1) return null;
            return (
              <text
                key={m.month}
                x={padding.left + i * xStep}
                y={chartHeight - 12}
                textAnchor="middle"
                className="fill-[#9FA37C] text-[10px] font-mono"
              >
                {m.label}
              </text>
            );
          })}
        </svg>
      );
    }

    if (activeMetric === "humidity") {
      const yScale = (val: number) => padding.top + innerHeight - (val / 100) * innerHeight;

      const rhPoints = monthlyAggregates.map((m, i) => ({
        x: padding.left + i * xStep,
        y: m.rh2mMean !== null ? yScale(m.rh2mMean) : null,
      }));

      const makePath = (pts: { x: number; y: number | null }[]) =>
        pts
          .filter((p): p is { x: number; y: number } => p.y !== null)
          .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
          .join(" ");

      return (
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="h-full w-full overflow-visible"
        >
          {[0, 25, 50, 75, 100].map((val) => (
            <g key={val}>
              <line
                x1={padding.left}
                y1={yScale(val)}
                x2={chartWidth - padding.right}
                y2={yScale(val)}
                stroke="#435133"
                strokeDasharray="4 4"
                strokeWidth="0.8"
              />
              <text
                x={padding.left - 8}
                y={yScale(val) + 4}
                textAnchor="end"
                className="fill-[#9FA37C] text-[10px] font-mono"
              >
                {val}%
              </text>
            </g>
          ))}

          <path
            d={`${makePath(rhPoints)} L ${chartWidth - padding.right} ${
              chartHeight - padding.bottom
            } L ${padding.left} ${chartHeight - padding.bottom} Z`}
            fill="#52B788"
            fillOpacity="0.15"
          />
          <path d={makePath(rhPoints)} fill="none" stroke="#52B788" strokeWidth="2.5" />

          {monthlyAggregates.map((m, i) => {
            if (i % 6 !== 0 && i !== n - 1) return null;
            return (
              <text
                key={m.month}
                x={padding.left + i * xStep}
                y={chartHeight - 12}
                textAnchor="middle"
                className="fill-[#9FA37C] text-[10px] font-mono"
              >
                {m.label}
              </text>
            );
          })}

          {monthlyAggregates.map((m, i) => (
            <rect
              key={m.month}
              x={padding.left + i * xStep - xStep / 2}
              y={padding.top}
              width={xStep}
              height={innerHeight}
              fill="transparent"
              className="cursor-pointer hover:fill-[#52B788]/10"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          ))}
        </svg>
      );
    }

    // Soil Moisture
    const yScale = (val: number) => padding.top + innerHeight - val * innerHeight;

    const topPoints = monthlyAggregates.map((m, i) => ({
      x: padding.left + i * xStep,
      y: m.gwettopMean !== null ? yScale(m.gwettopMean) : null,
    }));
    const rootPoints = monthlyAggregates.map((m, i) => ({
      x: padding.left + i * xStep,
      y: m.gwetrootMean !== null ? yScale(m.gwetrootMean) : null,
    }));
    const profPoints = monthlyAggregates.map((m, i) => ({
      x: padding.left + i * xStep,
      y: m.gwetprofMean !== null ? yScale(m.gwetprofMean) : null,
    }));

    const makePath = (pts: { x: number; y: number | null }[]) =>
      pts
        .filter((p): p is { x: number; y: number } => p.y !== null)
        .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
        .join(" ");

    return (
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="h-full w-full overflow-visible"
      >
        {[0, 0.25, 0.5, 0.75, 1.0].map((val) => (
          <g key={val}>
            <line
              x1={padding.left}
              y1={yScale(val)}
              x2={chartWidth - padding.right}
              y2={yScale(val)}
              stroke="#435133"
              strokeDasharray="4 4"
              strokeWidth="0.8"
            />
            <text
              x={padding.left - 8}
              y={yScale(val) + 4}
              textAnchor="end"
              className="fill-[#9FA37C] text-[10px] font-mono"
            >
              {(val * 100).toFixed(0)}%
            </text>
          </g>
        ))}

        <path d={makePath(topPoints)} fill="none" stroke="#48CAE4" strokeWidth="2" />
        <path d={makePath(rootPoints)} fill="none" stroke="#52B788" strokeWidth="2.5" />
        <path d={makePath(profPoints)} fill="none" stroke="#9A7E3B" strokeWidth="1.8" />

        {monthlyAggregates.map((m, i) => {
          if (i % 6 !== 0 && i !== n - 1) return null;
          return (
            <text
              key={m.month}
              x={padding.left + i * xStep}
              y={chartHeight - 12}
              textAnchor="middle"
              className="fill-[#9FA37C] text-[10px] font-mono"
            >
              {m.label}
            </text>
          );
        })}

        {monthlyAggregates.map((m, i) => (
          <rect
            key={m.month}
            x={padding.left + i * xStep - xStep / 2}
            y={padding.top}
            width={xStep}
            height={innerHeight}
            fill="transparent"
            className="cursor-pointer hover:fill-[#9A7E3B]/10"
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          />
        ))}
      </svg>
    );
  };

  const hoveredMonth =
    hoveredIndex !== null && monthlyAggregates[hoveredIndex]
      ? monthlyAggregates[hoveredIndex]
      : null;

  return (
    <div className="space-y-4 rounded-2xl border border-[#435133] bg-[#323D25]/90 p-5 shadow-xl backdrop-blur-sm">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#435133]/60 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#9A7E3B]" />
            <h3 className="text-base font-bold text-[#D2CF9A]">
              Historical Agroclimatology (5-Year Range: 2021-01-01 to 2025-12-31)
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-[#9FA37C]">
            Monthly aggregated from {totalObservationsCount.toLocaleString()} daily NASA POWER observations. Precipitation is summed monthly; temperature, humidity, and soil moisture are averaged.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Chart metric selector buttons */}
          <div className="flex rounded-lg border border-[#435133] bg-[#28301C] p-1 text-xs">
            <button
              onClick={() => setActiveMetric("temperature")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 transition ${
                activeMetric === "temperature"
                  ? "bg-[#9A7E3B] text-[#28301C] font-semibold"
                  : "text-[#D2CF9A] hover:text-[#9A7E3B]"
              }`}
            >
              <Thermometer className="h-3 w-3" />
              Temperature
            </button>
            <button
              onClick={() => setActiveMetric("precipitation")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 transition ${
                activeMetric === "precipitation"
                  ? "bg-[#9A7E3B] text-[#28301C] font-semibold"
                  : "text-[#D2CF9A] hover:text-[#9A7E3B]"
              }`}
            >
              <CloudRain className="h-3 w-3" />
              Precipitation
            </button>
            <button
              onClick={() => setActiveMetric("humidity")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 transition ${
                activeMetric === "humidity"
                  ? "bg-[#9A7E3B] text-[#28301C] font-semibold"
                  : "text-[#D2CF9A] hover:text-[#9A7E3B]"
              }`}
            >
              <Droplets className="h-3 w-3" />
              Humidity
            </button>
            <button
              onClick={() => setActiveMetric("soil_moisture")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 transition ${
                activeMetric === "soil_moisture"
                  ? "bg-[#9A7E3B] text-[#28301C] font-semibold"
                  : "text-[#D2CF9A] hover:text-[#9A7E3B]"
              }`}
            >
              <Layers className="h-3 w-3" />
              Soil Moisture
            </button>
          </div>

          <button
            onClick={() => setShowInspector(!showInspector)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#435133] bg-[#28301C] px-3 py-1.5 text-xs font-medium text-[#D2CF9A] transition hover:border-[#9A7E3B] hover:text-[#9A7E3B]"
          >
            <TableIcon className="h-3 w-3" />
            {showInspector ? "Hide Daily Inspector" : "Inspect Raw Daily Values"}
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative rounded-xl border border-[#435133]/60 bg-[#28301C]/80 p-4">
        {/* Dynamic Hover Tooltip Banner */}
        <div className="mb-2 flex flex-wrap items-center justify-between text-xs font-mono text-[#D2CF9A]">
          {hoveredMonth ? (
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
              <span className="font-bold text-[#9A7E3B]">{hoveredMonth.label}:</span>
              {activeMetric === "temperature" && (
                <>
                  <span>Mean: <strong className="text-[#D2CF9A]">{hoveredMonth.t2mMean}°C</strong></span>
                  <span>Max: <strong className="text-[#E09F3E]">{hoveredMonth.t2mMax}°C</strong></span>
                  <span>Min: <strong className="text-[#48CAE4]">{hoveredMonth.t2mMin}°C</strong></span>
                </>
              )}
              {activeMetric === "precipitation" && (
                <>
                  <span>Total Accumulated: <strong className="text-[#48CAE4]">{hoveredMonth.precipSum} mm</strong></span>
                  <span>Valid Days: {hoveredMonth.validDays}/{hoveredMonth.totalDays}</span>
                </>
              )}
              {activeMetric === "humidity" && (
                <span>Mean Relative Humidity: <strong className="text-[#52B788]">{hoveredMonth.rh2mMean}%</strong></span>
              )}
              {activeMetric === "soil_moisture" && (
                <>
                  <span>Surface: <strong className="text-[#48CAE4]">{hoveredMonth.gwettopMean ? `${(hoveredMonth.gwettopMean * 100).toFixed(1)}%` : "N/A"}</strong></span>
                  <span>Root: <strong className="text-[#52B788]">{hoveredMonth.gwetrootMean ? `${(hoveredMonth.gwetrootMean * 100).toFixed(1)}%` : "N/A"}</strong></span>
                  <span>Profile: <strong className="text-[#9A7E3B]">{hoveredMonth.gwetprofMean ? `${(hoveredMonth.gwetprofMean * 100).toFixed(1)}%` : "N/A"}</strong></span>
                </>
              )}
            </div>
          ) : (
            <span className="text-[11px] text-[#9FA37C] italic">
              Hover over any point along the timeline to inspect monthly aggregates.
            </span>
          )}

          {/* Legend */}
          <div className="flex items-center gap-3 text-[11px]">
            {activeMetric === "temperature" && (
              <>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#D2CF9A]" /> Mean T2M</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#E09F3E]" /> Max Record</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#48CAE4]" /> Min Record</span>
              </>
            )}
            {activeMetric === "precipitation" && (
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#48CAE4]" /> Monthly Rainfall (mm)</span>
            )}
            {activeMetric === "humidity" && (
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#52B788]" /> Mean RH2M (%)</span>
            )}
            {activeMetric === "soil_moisture" && (
              <>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#48CAE4]" /> Surface (GWETTOP)</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#52B788]" /> Root Zone (GWETROOT)</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#9A7E3B]" /> Profile (GWETPROF)</span>
              </>
            )}
          </div>
        </div>

        <div className="h-60 w-full">{renderChart()}</div>
      </div>

      {/* Daily Observations Inspector */}
      {showInspector && (
        <div className="rounded-xl border border-[#435133] bg-[#28301C] p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#435133]/60 pb-2.5">
            <div className="flex items-center gap-2">
              <TableIcon className="h-4 w-4 text-[#9A7E3B]" />
              <h4 className="text-sm font-semibold text-[#D2CF9A]">
                Original Daily Observations Inspector
              </h4>
              <span className="text-[11px] text-[#9FA37C]">
                (Displaying recent observations; missing values marked as &quot;Missing / Null&quot; rather than zero)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[#9FA37C]" />
                <input
                  type="text"
                  placeholder="Filter YYYY-MM..."
                  value={inspectorFilter}
                  onChange={(e) => {
                    setInspectorFilter(e.target.value);
                    setInspectorPage(0);
                  }}
                  className="rounded-md border border-[#435133] bg-[#323D25] py-1 pl-8 pr-2.5 text-xs text-[#D2CF9A] placeholder-[#9FA37C] focus:border-[#9A7E3B] focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#435133]/60 text-[10px] uppercase text-[#9FA37C]">
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">T2M (°C)</th>
                  <th className="py-2 pr-3">Max/Min</th>
                  <th className="py-2 pr-3">Precip (mm)</th>
                  <th className="py-2 pr-3">RH2M (%)</th>
                  <th className="py-2 pr-3">WS10M (m/s)</th>
                  <th className="py-2 pr-3">Solar (MJ/m²)</th>
                  <th className="py-2">GWET Top / Root</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#435133]/30">
                {pageObservations.map((obs) => (
                  <tr key={obs.rawDate} className="hover:bg-[#323D25]/50">
                    <td className="py-2 pr-3 font-semibold text-[#D2CF9A]">{obs.date}</td>
                    <td className="py-2 pr-3">
                      {obs.t2m !== null ? (
                        `${obs.t2m}°C`
                      ) : (
                        <span className="text-red-400 italic">Missing</span>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-[#9FA37C]">
                      {obs.t2mMax !== null ? obs.t2mMax : "-"} / {obs.t2mMin !== null ? obs.t2mMin : "-"}
                    </td>
                    <td className="py-2 pr-3 text-[#48CAE4]">
                      {obs.precip !== null ? (
                        `${obs.precip} mm`
                      ) : (
                        <span className="text-red-400 italic">Missing</span>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-[#52B788]">
                      {obs.rh2m !== null ? `${obs.rh2m}%` : "-"}
                    </td>
                    <td className="py-2 pr-3 text-[#9FA37C]">
                      {obs.ws10m !== null ? `${obs.ws10m}` : "-"}
                    </td>
                    <td className="py-2 pr-3 text-[#9A7E3B]">
                      {obs.solar !== null ? `${obs.solar}` : "-"}
                    </td>
                    <td className="py-2 text-[#9FA37C]">
                      {obs.gwettop !== null ? obs.gwettop : "-"} / {obs.gwetroot !== null ? obs.gwetroot : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-[#435133]/40 pt-2 text-xs text-[#9FA37C]">
            <span>
              Page {inspectorPage + 1} of {totalPages} ({filteredDaily.length} records)
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={inspectorPage === 0}
                onClick={() => setInspectorPage((p) => Math.max(0, p - 1))}
                className="rounded p-1 border border-[#435133] disabled:opacity-30 hover:border-[#9A7E3B]"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                disabled={inspectorPage >= totalPages - 1}
                onClick={() => setInspectorPage((p) => p + 1)}
                className="rounded p-1 border border-[#435133] disabled:opacity-30 hover:border-[#9A7E3B]"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
