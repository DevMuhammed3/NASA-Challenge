"use client";

import React, { useState } from "react";
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  ShieldAlert,
  Sprout,
  FileQuestion,
  ArrowRight,
  RefreshCw,
  Info,
} from "lucide-react";
import type {
  EnvironmentalDataResponse,
  AiAdvisorAnalysis,
} from "@/lib/types/environmental";

interface AiAdvisorSectionProps {
  telemetry: EnvironmentalDataResponse | null;
  geminiAvailable: boolean;
}

export function AiAdvisorSection({
  telemetry,
  geminiAvailable,
}: AiAdvisorSectionProps) {
  const [analysis, setAnalysis] = useState<AiAdvisorAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAnalyzeData = async () => {
    if (!telemetry) return;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telemetry }),
      });

      const data = await res.json();
      if (res.ok && data.status === "Success" && data.analysis) {
        setAnalysis(data.analysis);
      } else {
        setErrorMsg(
          data.error || "Failed to generate AI analysis from telemetry."
        );
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Error contacting AI Advisor service"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-[#435133] bg-[#323D25]/90 p-5 shadow-xl backdrop-blur-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#435133]/60 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#9A7E3B]" />
            <h3 className="text-base font-bold text-[#D2CF9A]">
              AI Environmental Advisor (Google Gemini 2.5 Flash)
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-[#9FA37C]">
            Synthesizes 5-year NASA POWER climatology into agricultural patterns, opportunities, risks, and missing laboratory parameters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {geminiAvailable ? (
            <button
              onClick={handleAnalyzeData}
              disabled={isLoading || !telemetry}
              className="inline-flex items-center gap-2 rounded-xl bg-[#9A7E3B] px-4 py-2 text-xs font-bold text-[#28301C] transition hover:bg-[#D2CF9A] disabled:opacity-50 shadow-md"
            >
              <Sparkles className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              {isLoading ? "Synthesizing Telemetry..." : "Analyze Data"}
            </button>
          ) : (
            <div className="rounded-lg border border-[#435133] bg-[#28301C] px-3 py-1.5 text-xs text-[#9FA37C]">
              GEMINI_API_KEY Missing on Server
            </div>
          )}
        </div>
      </div>

      {/* Telemetry Input Transparency Summary */}
      {telemetry && (
        <div className="rounded-xl border border-[#435133] bg-[#28301C]/80 p-3.5 text-xs font-mono">
          <div className="flex items-center justify-between text-[#9FA37C] border-b border-[#435133]/50 pb-2">
            <span className="font-semibold text-[#D2CF9A]">Data Fed to AI Advisor:</span>
            <span>{telemetry.sourceName}</span>
          </div>
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-[#D2CF9A]">
            <div>
              <span className="text-[#9FA37C]">Location:</span> {telemetry.location.name}
            </div>
            <div>
              <span className="text-[#9FA37C]">Coords:</span> {telemetry.location.latitude}°N, {telemetry.location.longitude}°W
            </div>
            <div>
              <span className="text-[#9FA37C]">Range:</span> {telemetry.summaryStats.period.start} to {telemetry.summaryStats.period.end}
            </div>
            <div>
              <span className="text-[#9FA37C]">Days Ingested:</span> {telemetry.summaryStats.period.totalDays} (0 missing)
            </div>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {errorMsg && (
        <div className="rounded-xl border border-red-700/50 bg-red-900/20 p-3.5 text-xs text-red-200 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
          <div>
            <strong className="font-semibold">AI Analysis Notice:</strong> {errorMsg}
          </div>
        </div>
      )}

      {/* Empty State before Analyze Data clicked */}
      {!analysis && !isLoading && !errorMsg && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#435133] py-12 px-4 text-center">
          <Sparkles className="h-8 w-8 text-[#9A7E3B]/60 mb-2" />
          <h4 className="text-sm font-semibold text-[#D2CF9A]">
            Ready to Analyze Real Environmental Data
          </h4>
          <p className="mt-1 max-w-md text-xs text-[#9FA37C]">
            Click &quot;Analyze Data&quot; to invoke Google Gemini 2.5 Flash on the 5-year NASA POWER daily records for Green Valley, AZ.
          </p>
          {geminiAvailable && (
            <button
              onClick={handleAnalyzeData}
              disabled={!telemetry}
              className="mt-3.5 inline-flex items-center gap-1.5 rounded-lg bg-[#9A7E3B] px-3.5 py-1.5 text-xs font-bold text-[#28301C] transition hover:bg-[#D2CF9A]"
            >
              Analyze Data
            </button>
          )}
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-3 rounded-xl border border-[#435133] bg-[#28301C]/60 p-6 text-center">
          <RefreshCw className="h-7 w-7 text-[#9A7E3B] animate-spin mx-auto mb-2" />
          <div className="text-xs font-semibold text-[#D2CF9A]">
            Consulting Google Gemini 2.5 Flash...
          </div>
          <p className="text-[11px] text-[#9FA37C] max-w-sm mx-auto">
            Evaluating historical temperature records, precipitation accumulation, humidity levels, and soil moisture fractions against agronomic parameters.
          </p>
        </div>
      )}

      {/* Render 6 Structured AI Sections */}
      {analysis && !isLoading && (
        <div className="space-y-4 pt-1">
          {/* Ground truth disclaimer */}
          <div className="flex items-start gap-2.5 rounded-lg border border-[#9A7E3B]/30 bg-[#9A7E3B]/10 p-3 text-xs text-[#D2CF9A]">
            <Info className="h-4 w-4 shrink-0 text-[#9A7E3B] mt-0.5" />
            <div>
              <strong>Advisory Ground Truth Notice:</strong> {analysis.groundTruthNotice}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Section 1: Environmental Summary */}
            <div className="rounded-xl border border-[#435133] bg-[#28301C] p-4 space-y-2">
              <div className="flex items-center gap-2 text-[#D2CF9A] border-b border-[#435133]/50 pb-2">
                <Info className="h-4 w-4 text-[#9A7E3B]" />
                <h4 className="text-sm font-bold">1. Environmental Conditions Summary</h4>
              </div>
              <div className="text-xs text-[#D2CF9A]/90 leading-relaxed whitespace-pre-line">
                {analysis.sections.environmentalSummary}
              </div>
            </div>

            {/* Section 2: Five-Year Climate Patterns */}
            <div className="rounded-xl border border-[#435133] bg-[#28301C] p-4 space-y-2">
              <div className="flex items-center gap-2 text-[#D2CF9A] border-b border-[#435133]/50 pb-2">
                <TrendingUp className="h-4 w-4 text-[#52B788]" />
                <h4 className="text-sm font-bold">2. Five-Year Climate Patterns & Trends</h4>
              </div>
              <div className="text-xs text-[#D2CF9A]/90 leading-relaxed whitespace-pre-line">
                {analysis.sections.climatePatterns}
              </div>
            </div>

            {/* Section 3: Potential Agricultural Opportunities */}
            <div className="rounded-xl border border-[#435133] bg-[#28301C] p-4 space-y-2">
              <div className="flex items-center gap-2 text-[#D2CF9A] border-b border-[#435133]/50 pb-2">
                <Sprout className="h-4 w-4 text-[#74C69D]" />
                <h4 className="text-sm font-bold">3. Potential Agricultural Opportunities</h4>
              </div>
              <div className="text-xs text-[#D2CF9A]/90 leading-relaxed whitespace-pre-line">
                {analysis.sections.agriculturalOpportunities}
              </div>
            </div>

            {/* Section 4: Environmental & Climatic Risks */}
            <div className="rounded-xl border border-[#435133] bg-[#28301C] p-4 space-y-2">
              <div className="flex items-center gap-2 text-[#D2CF9A] border-b border-[#435133]/50 pb-2">
                <ShieldAlert className="h-4 w-4 text-[#E09F3E]" />
                <h4 className="text-sm font-bold">4. Environmental & Climatic Risks</h4>
              </div>
              <div className="text-xs text-[#D2CF9A]/90 leading-relaxed whitespace-pre-line">
                {analysis.sections.environmentalRisks}
              </div>
            </div>
          </div>

          {/* Section 5: Missing Ground-Truth Information (Highlighted Full-Width) */}
          <div className="rounded-xl border border-[#9A7E3B]/50 bg-[#323D25] p-4 space-y-2">
            <div className="flex items-center gap-2 text-[#D2CF9A] border-b border-[#435133]/60 pb-2">
              <FileQuestion className="h-4 w-4 text-[#9A7E3B]" />
              <h4 className="text-sm font-bold">
                5. Missing Ground-Truth Information (Must Test in Laboratory)
              </h4>
            </div>
            <div className="text-xs text-[#D2CF9A]/95 leading-relaxed whitespace-pre-line">
              {analysis.sections.missingInformation}
            </div>
          </div>

          {/* Section 6: Recommended Next Steps (Actionable Box) */}
          <div className="rounded-xl border border-[#52B788]/40 bg-[#28301C] p-4 space-y-2">
            <div className="flex items-center gap-2 text-[#D2CF9A] border-b border-[#435133]/60 pb-2">
              <ArrowRight className="h-4 w-4 text-[#52B788]" />
              <h4 className="text-sm font-bold">6. Recommended Practical Next Steps</h4>
            </div>
            <div className="text-xs text-[#D2CF9A]/95 leading-relaxed whitespace-pre-line">
              {analysis.sections.recommendedNextSteps}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
