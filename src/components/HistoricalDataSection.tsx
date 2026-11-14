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
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

interface HistoricalDataSectionProps {
  monthlyAggregates: MonthlyAggregate[];
  recentObservations: DailyObservation[];
  totalObservationsCount: number;
  parameterMetadata: Record<string, NasaPowerParameterMeta>;
}

type ChartMetric =
  | "temperature"
  | "precipitation"
  | "humidity"
  | "soil_moisture";

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
    inspectorFilter ? d.date.includes(inspectorFilter) : true,
  );
  const totalPages = Math.ceil(filteredDaily.length / pageSize) || 1;
  const pageObservations = filteredDaily.slice(
    inspectorPage * pageSize,
    (inspectorPage + 1) * pageSize,
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
        padding.top +
        innerHeight -
        ((val - minY) / (maxY - minY)) * innerHeight;

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
          .map(
            (p, i) =>
              `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`,
          )
          .join(" ");

      return (
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="h-full w-full overflow-hidden"
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
          <path
            d={makePath(maxPoints)}
            fill="none"
            stroke="#E09F3E"
            strokeWidth="1.5"
          />
          <path
            d={makePath(minPoints)}
            fill="none"
            stroke="#48CAE4"
            strokeWidth="1.5"
          />
          <path
            d={makePath(meanPoints)}
            fill="none"
            stroke="#D6C99A"
            strokeWidth="2.5"
          />

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
              className="cursor-pointer hover:fill-[#41644A]/10"
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
                stroke="#D6C99A"
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
        Math.max(...monthlyAggregates.map((m) => m.precipSum ?? 0), 10),
      );
      const yScale = (val: number) =>
        padding.top + innerHeight - (val / maxPrecip) * innerHeight;
      const barWidth = Math.max(3, (innerWidth / n) * 0.75);

      return (
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="h-full w-full overflow-hidden"
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
            const val = m.precipSum ?? 0;
            const y = yScale(val);
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
                className="cursor-pointer transition-all hover:fill-[#3C7A89]"
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
      const yScale = (val: number) =>
        padding.top + innerHeight - (val / 100) * innerHeight;

      const rhPoints = monthlyAggregates.map((m, i) => ({
        x: padding.left + i * xStep,
        y: m.rh2mMean !== null ? yScale(m.rh2mMean) : null,
      }));

      const makePath = (pts: { x: number; y: number | null }[]) =>
        pts
          .filter((p): p is { x: number; y: number } => p.y !== null)
          .map(
            (p, i) =>
              `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`,
          )
          .join(" ");

      return (
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="h-full w-full overflow-hidden"
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
            fill="#3C7A89"
            fillOpacity="0.15"
          />
          <path
            d={makePath(rhPoints)}
            fill="none"
            stroke="#3C7A89"
            strokeWidth="2.5"
          />

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
              className="cursor-pointer hover:fill-[#3C7A89]/10"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          ))}
        </svg>
      );
    }

    // Soil Moisture
    const yScale = (val: number) =>
      padding.top + innerHeight - val * innerHeight;

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
        .map(
          (p, i) =>
            `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`,
        )
        .join(" ");

    return (
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="h-full w-full overflow-hidden"
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

        <path
          d={makePath(topPoints)}
          fill="none"
          stroke="#48CAE4"
          strokeWidth="2"
        />
        <path
          d={makePath(rootPoints)}
          fill="none"
          stroke="#28301C"
          strokeWidth="2.5"
        />
        <path
          d={makePath(profPoints)}
          fill="none"
          stroke="#41644A"
          strokeWidth="1.8"
        />

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
            className="cursor-pointer hover:fill-[#41644A]/10"
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
    <Card className="border-border bg-card/90 p-3.5 sm:p-5 shadow-xl backdrop-blur-xs flex flex-col gap-4 min-w-0">
      {/* Header & Controls */}
      <CardHeader className="p-0 pb-3 flex flex-wrap items-center justify-between gap-3 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-primary" />
            <CardTitle className="text-base font-bold text-foreground">
              Historical Agroclimatology (5-Year Range: 2021-01-01 to
              2025-12-31)
            </CardTitle>
          </div>
          <CardDescription className="mt-0.5 text-xs text-muted-foreground">
            Monthly aggregated from {totalObservationsCount.toLocaleString()}{" "}
            daily NASA POWER observations. Precipitation is summed monthly;
            temperature, humidity, and soil moisture are averaged.
          </CardDescription>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Chart metric selector buttons */}
          <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-background p-1 text-xs w-full sm:w-auto">
            <Button
              variant={activeMetric === "temperature" ? "default" : "ghost"}
              size="xs"
              onClick={() => setActiveMetric("temperature")}
              className={
                activeMetric === "temperature" ? "font-bold shadow-xs" : ""
              }
            >
              <Thermometer data-icon="inline-start" className="size-3" />
              Temperature
            </Button>
            <Button
              variant={activeMetric === "precipitation" ? "default" : "ghost"}
              size="xs"
              onClick={() => setActiveMetric("precipitation")}
              className={
                activeMetric === "precipitation" ? "font-bold shadow-xs" : ""
              }
            >
              <CloudRain data-icon="inline-start" className="size-3" />
              Precipitation
            </Button>
            <Button
              variant={activeMetric === "humidity" ? "default" : "ghost"}
              size="xs"
              onClick={() => setActiveMetric("humidity")}
              className={
                activeMetric === "humidity" ? "font-bold shadow-xs" : ""
              }
            >
              <Droplets data-icon="inline-start" className="size-3" />
              Humidity
            </Button>
            <Button
              variant={activeMetric === "soil_moisture" ? "default" : "ghost"}
              size="xs"
              onClick={() => setActiveMetric("soil_moisture")}
              className={
                activeMetric === "soil_moisture" ? "font-bold shadow-xs" : ""
              }
            >
              <Layers data-icon="inline-start" className="size-3" />
              Soil Moisture
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowInspector(!showInspector)}
          >
            <TableIcon data-icon="inline-start" className="size-3" />
            {showInspector
              ? "Hide Daily Inspector"
              : "Inspect Raw Daily Values"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex flex-col gap-4">
        {/* Chart Canvas */}
        <div className="relative rounded-xl border border-border bg-background/80 p-4">
          {/* Dynamic Hover Tooltip Banner */}
          <div className="mb-2 flex flex-wrap items-center justify-between text-xs font-mono text-foreground">
            {hoveredMonth ? (
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                <span className="font-bold text-primary">
                  {hoveredMonth.label}:
                </span>
                {activeMetric === "temperature" && (
                  <>
                    <span>
                      Mean:{" "}
                      <strong className="text-foreground">
                        {hoveredMonth.t2mMean}°C
                      </strong>
                    </span>
                    <span>
                      Max:{" "}
                      <strong className="text-primary">
                        {hoveredMonth.t2mMax}°C
                      </strong>
                    </span>
                    <span>
                      Min:{" "}
                      <strong className="text-sky-400">
                        {hoveredMonth.t2mMin}°C
                      </strong>
                    </span>
                  </>
                )}
                {activeMetric === "precipitation" && (
                  <>
                    <span>
                      Total Accumulated:{" "}
                      <strong className="text-sky-400">
                        {hoveredMonth.precipSum !== null
                          ? `${hoveredMonth.precipSum} mm`
                          : "Unavailable"}
                      </strong>
                    </span>
                    <span>
                      Valid Days: {hoveredMonth.validDays}/
                      {hoveredMonth.totalDays}
                    </span>
                  </>
                )}
                {activeMetric === "humidity" && (
                  <span>
                    Mean Relative Humidity:{" "}
                    <strong className="text-[#3C7A89]">
                      {hoveredMonth.rh2mMean}%
                    </strong>
                  </span>
                )}
                {activeMetric === "soil_moisture" && (
                  <>
                    <span>
                      Surface:{" "}
                      <strong className="text-sky-400">
                        {hoveredMonth.gwettopMean
                          ? `${(hoveredMonth.gwettopMean * 100).toFixed(1)}%`
                          : "N/A"}
                      </strong>
                    </span>
                    <span>
                      Root:{" "}
                      <strong className="text-[#28301C]">
                        {hoveredMonth.gwetrootMean
                          ? `${(hoveredMonth.gwetrootMean * 100).toFixed(1)}%`
                          : "N/A"}
                      </strong>
                    </span>
                    <span>
                      Profile:{" "}
                      <strong className="text-primary">
                        {hoveredMonth.gwetprofMean
                          ? `${(hoveredMonth.gwetprofMean * 100).toFixed(1)}%`
                          : "N/A"}
                      </strong>
                    </span>
                  </>
                )}
              </div>
            ) : (
              <span className="text-[11px] text-muted-foreground italic">
                Hover over any point along the timeline to inspect monthly
                aggregates.
              </span>
            )}

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
              {activeMetric === "temperature" && (
                <>
                  <span className="flex items-center gap-1">
                    <span className="size-2 rounded-full bg-[#D6C99A]" /> Mean
                    T2M
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="size-2 rounded-full bg-[#41644A]" /> Max
                    Record
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="size-2 rounded-full bg-[#48CAE4]" /> Min
                    Record
                  </span>
                </>
              )}
              {activeMetric === "precipitation" && (
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-[#48CAE4]" /> Monthly
                  Rainfall (mm)
                </span>
              )}
              {activeMetric === "humidity" && (
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-[#3C7A89]" /> Mean
                  RH2M (%)
                </span>
              )}
              {activeMetric === "soil_moisture" && (
                <>
                  <span className="flex items-center gap-1">
                    <span className="size-2 rounded-full bg-[#48CAE4]" />{" "}
                    Surface (GWETTOP)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="size-2 rounded-full bg-[#28301C]" /> Root
                    Zone (GWETROOT)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="size-2 rounded-full bg-[#41644A]" />{" "}
                    Profile (GWETPROF)
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="h-60 w-full">{renderChart()}</div>
        </div>

        {/* Daily Observations Inspector */}
        {showInspector && (
          <Card className="border-border bg-background/90 p-4 shadow-sm flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2.5">
              <div className="flex items-center gap-2">
                <TableIcon className="size-4 text-primary" />
                <h4 className="text-sm font-semibold text-foreground">
                  Original Daily Observations Inspector
                </h4>
                <span className="text-[11px] text-muted-foreground">
                  (Displaying recent observations; missing values marked as
                  &quot;Missing / Null&quot; rather than zero)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Filter YYYY-MM..."
                    value={inspectorFilter}
                    onChange={(e) => {
                      setInspectorFilter(e.target.value);
                      setInspectorPage(0);
                    }}
                    className="rounded-md border border-border bg-card py-1 pl-8 pr-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="border-border bg-background/60 text-[10px] uppercase text-muted-foreground">
                  <TableHead>Date</TableHead>
                  <TableHead>T2M (°C)</TableHead>
                  <TableHead>Max/Min</TableHead>
                  <TableHead>Precip (mm)</TableHead>
                  <TableHead>RH2M (%)</TableHead>
                  <TableHead>WS10M (m/s)</TableHead>
                  <TableHead>Solar (MJ/m²)</TableHead>
                  <TableHead>GWET Top / Root</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="font-mono text-xs">
                {pageObservations.map((obs) => (
                  <TableRow
                    key={obs.rawDate}
                    className="border-border hover:bg-card/50"
                  >
                    <TableCell className="font-semibold text-foreground">
                      {obs.date}
                    </TableCell>
                    <TableCell>
                      {obs.t2m !== null ? (
                        `${obs.t2m}°C`
                      ) : (
                        <span className="text-destructive italic">Missing</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {obs.t2mMax !== null ? obs.t2mMax : "-"} /{" "}
                      {obs.t2mMin !== null ? obs.t2mMin : "-"}
                    </TableCell>
                    <TableCell className="text-sky-400">
                      {obs.precip !== null ? (
                        `${obs.precip} mm`
                      ) : (
                        <span className="text-destructive italic">Missing</span>
                      )}
                    </TableCell>
                    <TableCell className="text-[#3C7A89]">
                      {obs.rh2m !== null ? `${obs.rh2m}%` : "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {obs.ws10m !== null ? `${obs.ws10m}` : "-"}
                    </TableCell>
                    <TableCell className="text-primary">
                      {obs.solar !== null ? `${obs.solar}` : "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {obs.gwettop !== null ? obs.gwettop : "-"} /{" "}
                      {obs.gwetroot !== null ? obs.gwetroot : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-border pt-2 text-xs text-muted-foreground">
              <span>
                Page {inspectorPage + 1} of {totalPages} ({filteredDaily.length}{" "}
                records)
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon-xs"
                  disabled={inspectorPage === 0}
                  onClick={() => setInspectorPage((p) => Math.max(0, p - 1))}
                >
                  <ChevronLeft className="size-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon-xs"
                  disabled={inspectorPage >= totalPages - 1}
                  onClick={() => setInspectorPage((p) => p + 1)}
                >
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
