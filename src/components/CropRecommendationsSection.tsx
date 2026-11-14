"use client";

import React, { useState, useEffect } from "react";
import {
  Sprout,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  Thermometer,
  CloudRain,
  Sun,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Info,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Scale,
  X,
  FileQuestion,
} from "lucide-react";
import type {
  CropSuitabilityEvaluation,
  RecommendationSummary,
} from "@/lib/crops/suitability-engine";
import { GREEN_VALLEY_LOCATION } from "@/lib/config/location";

interface CropRecommendationsSectionProps {
  onNavigateToMap?: () => void;
}

interface CropAdvisorReport {
  status: string;
  provider: string;
  model: string;
  sections: {
    bestCrops: string;
    riskyCrops: string;
    plantingCalendar: string;
    missingInformation: string;
    practicalRecommendation: string;
  };
  disclaimer: string;
}

export function CropRecommendationsSection({}: CropRecommendationsSectionProps) {
  const [summary, setSummary] = useState<RecommendationSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filter & tab state
  const [categoryFilter, setCategoryFilter] = useState<"all" | "cool" | "warm">("all");
  const [expandedCropId, setExpandedCropId] = useState<string | null>(null);

  // Comparison drawer state (up to 3 crops)
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>(["tomato", "lettuce"]);
  const [showComparisonModal, setShowComparisonModal] = useState<boolean>(false);

  // AI Advisor state
  const [aiReport, setAiReport] = useState<CropAdvisorReport | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiErrorMsg, setAiErrorMsg] = useState<string | null>(null);

  // Load recommendations
  useEffect(() => {
    async function loadCrops() {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const res = await fetch("/api/crops");
        const data = await res.json();
        if (res.ok && data.status === "Success" && data.summary) {
          setSummary(data.summary);
        } else {
          setErrorMsg(data.error || "Failed to load crop recommendations");
        }
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Error contacting crops service");
      } finally {
        setIsLoading(false);
      }
    }

    loadCrops();
  }, []);

  // Request AI Crop Advisory
  const handleAnalyzeBestCrops = async () => {
    setIsAiLoading(true);
    setAiErrorMsg(null);
    try {
      const res = await fetch("/api/crops/advisor", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.status === "Success" && data.sections) {
        setAiReport(data);
      } else {
        setAiErrorMsg(data.error || "AI advisory generation encountered an error.");
      }
    } catch (err) {
      setAiErrorMsg(err instanceof Error ? err.message : "Failed to contact AI advisor");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Toggle crop comparison selection
  const toggleComparison = (cropId: string) => {
    if (selectedForComparison.includes(cropId)) {
      setSelectedForComparison(selectedForComparison.filter((id) => id !== cropId));
    } else {
      if (selectedForComparison.length >= 3) {
        setSelectedForComparison([...selectedForComparison.slice(1), cropId]);
      } else {
        setSelectedForComparison([...selectedForComparison, cropId]);
      }
    }
  };

  // Filter crops
  const allEvaluations: CropSuitabilityEvaluation[] = summary
    ? [...summary.topRecommended, ...summary.conditionalCrops, ...summary.highRiskCrops]
    : [];

  const filteredCrops = allEvaluations.filter((item) => {
    if (categoryFilter === "cool") return item.crop.category === "cool_season";
    if (categoryFilter === "warm") return item.crop.category === "warm_season";
    return true;
  });

  const comparedCropObjects = allEvaluations.filter((c) =>
    selectedForComparison.includes(c.crop.id)
  );

  return (
    <div className="space-y-6">
      {/* 1. Header & Mandatory Data Notice */}
      <div className="rounded-2xl border border-[#435133] bg-[#323D25]/90 p-5 shadow-xl backdrop-blur-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#435133]/60 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#52B788]/20 px-2.5 py-0.5 text-xs font-semibold text-[#52B788] border border-[#52B788]/40">
                <Sprout className="h-3.5 w-3.5" />
                Evidence-Based Crop Evaluation
              </span>
              <span className="rounded bg-[#28301C] px-2 py-0.5 text-[11px] font-mono text-[#D2CF9A] border border-[#435133]">
                {GREEN_VALLEY_LOCATION.name}
              </span>
            </div>
            <h2 className="mt-1 text-xl sm:text-2xl font-bold text-[#D2CF9A]">
              Vegetable Suitability &amp; Planting Windows
            </h2>
            <p className="mt-0.5 text-xs text-[#9FA37C]">
              Deterministic evaluation matching 5-year NASA POWER satellite climate observations (2021–2025) with verified University of Arizona Extension &amp; FAO requirements.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleAnalyzeBestCrops}
              disabled={isAiLoading || !summary}
              className="inline-flex items-center gap-2 rounded-xl bg-[#9A7E3B] px-4 py-2 text-xs font-bold text-[#28301C] transition hover:bg-[#D2CF9A] disabled:opacity-50 shadow-md"
            >
              <Sparkles className={`h-3.5 w-3.5 ${isAiLoading ? "animate-spin" : ""}`} />
              {isAiLoading ? "Consulting AI Advisor..." : "Analyze Best Crops"}
            </button>

            {selectedForComparison.length > 0 && (
              <button
                onClick={() => setShowComparisonModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#435133] bg-[#28301C] px-3.5 py-2 text-xs font-semibold text-[#D2CF9A] transition hover:border-[#9A7E3B] hover:text-[#9A7E3B]"
              >
                <Scale className="h-3.5 w-3.5 text-[#9A7E3B]" />
                Compare Crops ({selectedForComparison.length})
              </button>
            )}
          </div>
        </div>

        {/* Farmer-Friendly Data Notice */}
        <div className="flex items-start gap-3 rounded-xl border border-[#9A7E3B]/40 bg-[#9A7E3B]/10 p-3.5 text-xs text-[#D2CF9A]">
          <Info className="h-4 w-4 shrink-0 text-[#9A7E3B] mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-[#D2CF9A]">Essential Ground Truth Notice:</strong> These recommendations are calculated from <strong>regional atmospheric satellite data</strong> (temperatures, solar irradiance, rainfall patterns) and published university horticultural standards. They assume a functioning <strong>irrigation system</strong>. 
            <span className="block mt-1 text-[#9FA37C]">
              NASA satellite sensors cannot measure your specific farm soil pH, salt levels (salinity EC), nutrients (NPK), or subsoil drainage. Always verify your soil through a certified laboratory before purchasing seeds or equipment.
            </span>
          </div>
        </div>

        {/* Environmental Indicators Summary for Crops */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono pt-1">
          <div className="rounded-lg bg-[#28301C]/80 p-2.5 border border-[#435133]">
            <span className="text-[#9FA37C] text-[10px] uppercase block">Location & Elevation</span>
            <span className="text-[#D2CF9A] font-bold">Green Valley, AZ</span>
            <span className="text-[10px] text-[#9FA37C] block">962m / ~3,150 ft (Low-Mid Desert)</span>
          </div>
          <div className="rounded-lg bg-[#28301C]/80 p-2.5 border border-[#435133]">
            <span className="text-[#9FA37C] text-[10px] uppercase block">Temperature Extremes</span>
            <span className="text-[#D2CF9A] font-bold">-4.4°C to 45.0°C</span>
            <span className="text-[10px] text-[#E09F3E] block">Bimodal seasonal swings</span>
          </div>
          <div className="rounded-lg bg-[#28301C]/80 p-2.5 border border-[#435133]">
            <span className="text-[#9FA37C] text-[10px] uppercase block">Annual Rainfall Deficit</span>
            <span className="text-[#48CAE4] font-bold">306.8 mm/yr avg</span>
            <span className="text-[10px] text-red-300 block">Drip irrigation strictly mandatory</span>
          </div>
          <div className="rounded-lg bg-[#28301C]/80 p-2.5 border border-[#435133]">
            <span className="text-[#9FA37C] text-[10px] uppercase block">Solar Resource</span>
            <span className="text-[#D2CF9A] font-bold">21.1 MJ/m²/day</span>
            <span className="text-[10px] text-[#52B788] block">Abundant photosynthetic light</span>
          </div>
        </div>
      </div>

      {/* 2. AI Advisor Report Section (if generated) */}
      {aiReport && (
        <div className="rounded-2xl border border-[#9A7E3B]/60 bg-[#28301C] p-5 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#435133] pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#9A7E3B]" />
              <h3 className="text-base font-bold text-[#D2CF9A]">
                AI Agronomic Analysis ({aiReport.provider} — {aiReport.model})
              </h3>
            </div>
            <span className="text-[11px] text-[#9FA37C]">
              Grounded exclusively in NASA observations and UA Extension publications
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Section A */}
            <div className="rounded-xl border border-[#435133] bg-[#323D25]/70 p-4 space-y-2">
              <div className="flex items-center gap-2 text-[#52B788] font-bold text-sm border-b border-[#435133]/60 pb-1.5">
                <CheckCircle2 className="h-4 w-4" />
                <h4>A. Best Potential Crops</h4>
              </div>
              <div className="text-xs text-[#D2CF9A]/95 leading-relaxed whitespace-pre-line">
                {aiReport.sections.bestCrops}
              </div>
            </div>

            {/* Section B */}
            <div className="rounded-xl border border-[#435133] bg-[#323D25]/70 p-4 space-y-2">
              <div className="flex items-center gap-2 text-[#E09F3E] font-bold text-sm border-b border-[#435133]/60 pb-1.5">
                <ShieldAlert className="h-4 w-4" />
                <h4>B. Crops With Important Risks</h4>
              </div>
              <div className="text-xs text-[#D2CF9A]/95 leading-relaxed whitespace-pre-line">
                {aiReport.sections.riskyCrops}
              </div>
            </div>

            {/* Section C */}
            <div className="rounded-xl border border-[#435133] bg-[#323D25]/70 p-4 space-y-2">
              <div className="flex items-center gap-2 text-[#74C69D] font-bold text-sm border-b border-[#435133]/60 pb-1.5">
                <Calendar className="h-4 w-4" />
                <h4>C. Preliminary Planting Calendar</h4>
              </div>
              <div className="text-xs text-[#D2CF9A]/95 leading-relaxed whitespace-pre-line">
                {aiReport.sections.plantingCalendar}
              </div>
            </div>

            {/* Section D */}
            <div className="rounded-xl border border-[#435133] bg-[#323D25]/70 p-4 space-y-2">
              <div className="flex items-center gap-2 text-[#9A7E3B] font-bold text-sm border-b border-[#435133]/60 pb-1.5">
                <FileQuestion className="h-4 w-4" />
                <h4>D. Missing Information to Test</h4>
              </div>
              <div className="text-xs text-[#D2CF9A]/95 leading-relaxed whitespace-pre-line">
                {aiReport.sections.missingInformation}
              </div>
            </div>
          </div>

          {/* Section E: Practical Recommendation Full-Width */}
          <div className="rounded-xl border border-[#52B788]/40 bg-[#323D25] p-4 space-y-2">
            <div className="flex items-center gap-2 text-[#52B788] font-bold text-sm border-b border-[#435133]/60 pb-1.5">
              <ArrowRight className="h-4 w-4" />
              <h4>E. Practical Conclusion &amp; Next Steps for the Grower</h4>
            </div>
            <div className="text-xs text-[#D2CF9A] leading-relaxed whitespace-pre-line">
              {aiReport.sections.practicalRecommendation}
            </div>
          </div>
        </div>
      )}

      {/* AI Error banner if any */}
      {aiErrorMsg && (
        <div className="rounded-xl border border-red-700/60 bg-red-900/20 p-3.5 text-xs text-red-200 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
          <div>
            <strong>AI Advisor Message:</strong> {aiErrorMsg}
          </div>
        </div>
      )}

      {/* 3. Crop Filter Bar & Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#435133] bg-[#323D25] p-3 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-semibold text-[#9FA37C] mr-1">Filter Vegetables:</span>
          <button
            onClick={() => setCategoryFilter("all")}
            className={`rounded-md px-3 py-1 font-medium transition ${
              categoryFilter === "all"
                ? "bg-[#9A7E3B] text-[#28301C] font-bold"
                : "bg-[#28301C] text-[#D2CF9A] hover:bg-[#435133]"
            }`}
          >
            All 15 Vegetables ({allEvaluations.length})
          </button>
          <button
            onClick={() => setCategoryFilter("cool")}
            className={`rounded-md px-3 py-1 font-medium transition ${
              categoryFilter === "cool"
                ? "bg-[#9A7E3B] text-[#28301C] font-bold"
                : "bg-[#28301C] text-[#D2CF9A] hover:bg-[#435133]"
            }`}
          >
            Cool-Season Crops (Fall - Spring)
          </button>
          <button
            onClick={() => setCategoryFilter("warm")}
            className={`rounded-md px-3 py-1 font-medium transition ${
              categoryFilter === "warm"
                ? "bg-[#9A7E3B] text-[#28301C] font-bold"
                : "bg-[#28301C] text-[#D2CF9A] hover:bg-[#435133]"
            }`}
          >
            Warm-Season Crops (Spring / Summer / Monsoon)
          </button>
        </div>

        <div className="text-[11px] text-[#9FA37C]">
          Showing {filteredCrops.length} verified vegetable profiles
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[#435133] bg-[#323D25]/60 py-16 text-center">
          <RefreshCw className="h-8 w-8 text-[#9A7E3B] animate-spin mb-3" />
          <p className="text-sm font-semibold text-[#D2CF9A]">
            Evaluating Vegetable Requirements Against NASA POWER Observations...
          </p>
          <p className="text-xs text-[#9FA37C] mt-1">
            Assessing heat stress limits, frost exposure, solar saturation, and rainfall deficits for Green Valley, AZ.
          </p>
        </div>
      )}

      {/* Error state */}
      {errorMsg && (
        <div className="rounded-xl border border-red-700/60 bg-red-900/25 p-4 text-xs text-red-200">
          <strong>Evaluation Error:</strong> {errorMsg}
        </div>
      )}

      {/* 4. Crop Cards Grid */}
      {!isLoading && summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCrops.map((item) => {
            const isExpanded = expandedCropId === item.crop.id;
            const isCompared = selectedForComparison.includes(item.crop.id);

            const isTopSuitable =
              item.classification === "Suitable with Irrigation in Season";

            return (
              <div
                key={item.crop.id}
                className={`rounded-2xl border transition shadow-lg flex flex-col justify-between ${
                  isTopSuitable
                    ? "border-[#52B788]/60 bg-[#323D25] hover:border-[#52B788]"
                    : "border-[#435133] bg-[#323D25]/90 hover:border-[#9A7E3B]/70"
                }`}
              >
                {/* Card Top */}
                <div className="p-5 space-y-3">
                  {/* Badges row */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${
                        isTopSuitable
                          ? "bg-[#52B788]/20 text-[#52B788] border-[#52B788]/40"
                          : "bg-[#E09F3E]/20 text-[#E09F3E] border-[#E09F3E]/40"
                      }`}
                    >
                      {isTopSuitable ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <AlertTriangle className="h-3 w-3" />
                      )}
                      {item.classification}
                    </span>

                    <span className="rounded bg-[#28301C] px-2 py-0.5 text-[10px] text-[#9FA37C] border border-[#435133] capitalize">
                      {item.crop.category.replace("_", " ")}
                    </span>
                  </div>

                  {/* Crop Header */}
                  <div>
                    <h3 className="text-lg font-bold text-[#D2CF9A]">
                      {item.crop.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-[#9FA37C] italic">
                      <span>{item.crop.scientificName}</span>
                      <span>•</span>
                      <span>{item.crop.botanicalFamily}</span>
                    </div>
                  </div>

                  {/* Recommended Season */}
                  <div className="rounded-lg bg-[#28301C]/80 p-2.5 border border-[#435133] text-xs">
                    <span className="text-[#9FA37C] text-[10px] uppercase block font-semibold">
                      Recommended Planting Window (UA Extension)
                    </span>
                    <span className="text-[#D2CF9A] font-medium mt-0.5 block">
                      {item.crop.suitablePlantingWindows
                        .map((w) => w.seasonName)
                        .join(" or ")}
                    </span>
                    <span className="text-[11px] text-[#9A7E3B] font-mono mt-0.5 block">
                      Harvest: {item.crop.suitablePlantingWindows[0]?.harvestWindow}
                    </span>
                  </div>

                  {/* Supporting Factors */}
                  <div className="space-y-1.5 text-xs">
                    <span className="font-semibold text-[#52B788] text-[11px] uppercase tracking-wide block">
                      Key Climatic Supports:
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-[#D2CF9A]/90 text-[11px]">
                      {item.primarySupportingFactors.slice(0, 2).map((s, idx) => (
                        <li key={idx} className="leading-snug">
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Risks */}
                  <div className="space-y-1.5 text-xs">
                    <span className="font-semibold text-[#E09F3E] text-[11px] uppercase tracking-wide block">
                      Documented Environmental Constraints:
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-[#D2CF9A]/80 text-[11px]">
                      {item.primaryRiskFactors.slice(0, 2).map((r, idx) => (
                        <li key={idx} className="leading-snug">
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Expandable Factor Breakdown */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-[#435133]/60 space-y-2 text-xs font-mono">
                      <div className="p-2 rounded bg-[#28301C] text-[11px] space-y-1">
                        <div className="text-[#9FA37C]">Thermal Limits:</div>
                        <div className="text-[#D2CF9A]">
                          Vegetative: {item.crop.suitableTempRange.min}°C – {item.crop.suitableTempRange.max}°C (Opt: {item.crop.suitableTempRange.optMin}–{item.crop.suitableTempRange.optMax}°C)
                        </div>
                        <div className="text-[#E09F3E]">
                          Absolute Injury Limit: {item.crop.temperatureToleranceLimits.absoluteMin}°C min / {item.crop.temperatureToleranceLimits.absoluteMax}°C max
                        </div>
                      </div>

                      <div className="p-2 rounded bg-[#28301C] text-[11px] space-y-1">
                        <div className="text-[#9FA37C]">Water &amp; Irrigation:</div>
                        <div className="text-[#48CAE4]">
                          Seasonal ETc: {item.crop.waterRequirements.seasonalNeedMm} mm ({item.crop.waterRequirements.category})
                        </div>
                        <div className="text-[#D2CF9A]/90">
                          {item.crop.waterRequirements.description}
                        </div>
                      </div>

                      <div className="p-2 rounded bg-[#28301C] text-[11px] space-y-1">
                        <div className="text-[#9FA37C]">Soil Status (On-Farm):</div>
                        <div className="text-red-300">
                          {item.factors.soilSuitability.headline}
                        </div>
                        <div className="text-[#9FA37C] text-[10px]">
                          Target pH: {item.crop.soilRequirements.preferredPhMin}–{item.crop.soilRequirements.preferredPhMax} | Salinity tolerance: {item.crop.soilRequirements.salinityTolerance}
                        </div>
                      </div>

                      <div className="text-[10px] text-[#9FA37C] pt-1">
                        Source:{" "}
                        <a
                          href={item.crop.references.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#9A7E3B] underline inline-flex items-center gap-0.5"
                        >
                          {item.crop.references.primarySource} <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Bottom Actions */}
                <div className="p-4 border-t border-[#435133]/60 bg-[#28301C]/50 rounded-b-2xl flex items-center justify-between text-xs">
                  <button
                    onClick={() => setExpandedCropId(isExpanded ? null : item.crop.id)}
                    className="inline-flex items-center gap-1 font-semibold text-[#D2CF9A] hover:text-[#9A7E3B] transition"
                  >
                    {isExpanded ? (
                      <>
                        Less Details <ChevronUp className="h-3.5 w-3.5" />
                      </>
                    ) : (
                      <>
                        Scientific Details <ChevronDown className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => toggleComparison(item.crop.id)}
                    className={`rounded px-2.5 py-1 text-[11px] font-medium border transition ${
                      isCompared
                        ? "bg-[#9A7E3B] text-[#28301C] border-[#9A7E3B] font-bold"
                        : "border-[#435133] text-[#9FA37C] hover:text-[#D2CF9A] hover:border-[#9A7E3B]"
                    }`}
                  >
                    {isCompared ? "Selected for Compare" : "+ Compare"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Crop Comparison Modal / Drawer */}
      {showComparisonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-[#435133] bg-[#28301C] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#435133] pb-3">
              <div className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-[#9A7E3B]" />
                <h3 className="text-base font-bold text-[#D2CF9A]">
                  Side-by-Side Crop Comparison (Green Valley Climate)
                </h3>
              </div>
              <button
                onClick={() => setShowComparisonModal(false)}
                className="rounded-lg p-1 text-[#9FA37C] hover:text-[#D2CF9A]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {comparedCropObjects.length === 0 ? (
              <p className="text-xs text-[#9FA37C] py-8 text-center">
                No crops selected. Click &quot;+ Compare&quot; on any crop card to add it to the comparison view.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-[#435133] text-[11px] uppercase text-[#9FA37C]">
                      <th className="py-2.5 pr-3">Attribute</th>
                      {comparedCropObjects.map((c) => (
                        <th key={c.crop.id} className="py-2.5 px-3 font-bold text-[#D2CF9A]">
                          {c.crop.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#435133]/40">
                    <tr>
                      <td className="py-2.5 pr-3 text-[#9FA37C] font-sans font-semibold">Classification</td>
                      {comparedCropObjects.map((c) => (
                        <td key={c.crop.id} className="py-2.5 px-3">
                          <span className="text-[#D2CF9A] font-bold">{c.classification}</span>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-3 text-[#9FA37C] font-sans font-semibold">Seasonal Category</td>
                      {comparedCropObjects.map((c) => (
                        <td key={c.crop.id} className="py-2.5 px-3 capitalize">
                          {c.crop.category.replace("_", " ")}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-3 text-[#9FA37C] font-sans font-semibold">Optimal Temperature</td>
                      {comparedCropObjects.map((c) => (
                        <td key={c.crop.id} className="py-2.5 px-3 text-[#52B788]">
                          {c.crop.suitableTempRange.optMin}°C – {c.crop.suitableTempRange.optMax}°C
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-3 text-[#9FA37C] font-sans font-semibold">Absolute Heat Limit</td>
                      {comparedCropObjects.map((c) => (
                        <td key={c.crop.id} className="py-2.5 px-3 text-[#E09F3E]">
                          {c.crop.temperatureToleranceLimits.absoluteMax}°C ({c.crop.heatSensitivity} sensitivity)
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-3 text-[#9FA37C] font-sans font-semibold">Frost Tolerance</td>
                      {comparedCropObjects.map((c) => (
                        <td key={c.crop.id} className="py-2.5 px-3">
                          Down to {c.crop.temperatureToleranceLimits.absoluteMin}°C ({c.crop.frostSensitivity})
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-3 text-[#9FA37C] font-sans font-semibold">Seasonal Water Need</td>
                      {comparedCropObjects.map((c) => (
                        <td key={c.crop.id} className="py-2.5 px-3 text-[#48CAE4]">
                          {c.crop.waterRequirements.seasonalNeedMm} mm ({c.crop.waterRequirements.category})
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-3 text-[#9FA37C] font-sans font-semibold">Planting Window</td>
                      {comparedCropObjects.map((c) => (
                        <td key={c.crop.id} className="py-2.5 px-3 text-[#9A7E3B]">
                          {c.crop.suitablePlantingWindows.map((w) => w.seasonName).join(" or ")}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-2.5 pr-3 text-[#9FA37C] font-sans font-semibold">Primary Risk in Green Valley</td>
                      {comparedCropObjects.map((c) => (
                        <td key={c.crop.id} className="py-2.5 px-3 text-red-300 font-sans text-[11px]">
                          {c.primaryRiskFactors[0]}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowComparisonModal(false)}
                className="rounded-lg bg-[#9A7E3B] px-4 py-1.5 text-xs font-bold text-[#28301C] transition hover:bg-[#D2CF9A]"
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
