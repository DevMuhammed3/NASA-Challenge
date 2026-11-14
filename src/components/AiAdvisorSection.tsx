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
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

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
          data.error || "Failed to generate AI analysis from telemetry.",
        );
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Error contacting AI Advisor service",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-border bg-card/90 p-3.5 sm:p-5 shadow-xl backdrop-blur-xs flex flex-col gap-4 min-w-0">
      {/* Header */}
      <CardHeader className="p-0 pb-3 flex flex-wrap items-center justify-between gap-3 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-[#41644A]" />
            <CardTitle className="text-base font-bold text-[#28301C]">
              Smart Farm Advisor
            </CardTitle>
          </div>
          <CardDescription className="mt-0.5 text-xs text-[#687365]">
            Get plain-English farming guidance on planting, irrigation timing, and crop risks based on your field&apos;s real weather.
          </CardDescription>
        </div>

        <div className="flex items-center gap-2">
          {geminiAvailable ? (
            <Button
              size="sm"
              onClick={handleAnalyzeData}
              disabled={isLoading || !telemetry}
              className="bg-[#41644A] text-white font-bold hover:bg-[#34503B] shadow-xs"
            >
              <Sparkles
                data-icon="inline-start"
                className={`size-3.5 ${isLoading ? "animate-spin" : ""}`}
              />
              {isLoading ? "Generating Advice..." : "Get Farm Advice"}
            </Button>
          ) : (
            <Badge
              variant="outline"
              className="border-border bg-background text-muted-foreground text-xs py-1"
            >
              AI Advisor Configured
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0 flex flex-col gap-4">
        {/* Telemetry Input Transparency Summary */}
        {telemetry && (
          <div className="rounded-xl border border-border bg-background/80 p-3.5 text-xs font-mono">
            <div className="flex items-center justify-between text-muted-foreground border-b border-border pb-2">
              <span className="font-semibold text-foreground">
                Data Fed to AI Advisor:
              </span>
              <span>{telemetry.sourceName}</span>
            </div>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-foreground">
              <div>
                <span className="text-muted-foreground">Location:</span>{" "}
                {telemetry.location.name}
              </div>
              <div>
                <span className="text-muted-foreground">Coords:</span>{" "}
                {telemetry.location.latitude}°N, {telemetry.location.longitude}
                °W
              </div>
              <div>
                <span className="text-muted-foreground">Range:</span>{" "}
                {telemetry.summaryStats.period.start} to{" "}
                {telemetry.summaryStats.period.end}
              </div>
              <div>
                <span className="text-muted-foreground">Days Ingested:</span>{" "}
                {telemetry.summaryStats.period.totalDays} (0 missing)
              </div>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {errorMsg && (
          <Alert variant="destructive">
            <AlertTriangle className="size-4" />
            <AlertTitle>AI Analysis Notice</AlertTitle>
            <AlertDescription>{errorMsg}</AlertDescription>
          </Alert>
        )}

        {/* Empty State before Analyze Data clicked */}
        {!analysis && !isLoading && !errorMsg && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 px-4 text-center">
            <Sparkles className="size-8 text-primary/60 mb-2" />
            <h4 className="text-sm font-semibold text-foreground">
              Ready to Analyze Real Environmental Data
            </h4>
            <p className="mt-1 max-w-md text-xs text-muted-foreground">
              Click &quot;Analyze Data&quot; to invoke Google Gemini 2.5 Flash
              on the 5-year NASA POWER daily records for Green Valley, AZ.
            </p>
            {geminiAvailable && (
              <Button
                size="sm"
                onClick={handleAnalyzeData}
                disabled={!telemetry}
                className="mt-3.5 bg-primary text-primary-foreground font-bold hover:bg-primary/90"
              >
                Analyze Data
              </Button>
            )}
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="flex flex-col gap-2 rounded-xl border border-border bg-background/60 p-6 text-center">
            <RefreshCw className="size-7 text-primary animate-spin mx-auto mb-2" />
            <div className="text-xs font-semibold text-foreground">
              Consulting Google Gemini 2.5 Flash...
            </div>
            <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
              Evaluating historical temperature records, precipitation
              accumulation, humidity levels, and soil moisture fractions against
              agronomic parameters.
            </p>
          </div>
        )}

        {/* Render 6 Structured AI Sections */}
        {analysis && !isLoading && (
          <div className="flex flex-col gap-4 pt-1">
            {/* Ground truth disclaimer */}
            <Alert className="border-primary/40 bg-primary/10 text-foreground">
              <Info className="size-4 text-primary shrink-0" />
              <AlertDescription className="text-xs">
                <strong>Advisory Ground Truth Notice:</strong>{" "}
                {analysis.groundTruthNotice}
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Section 1: Environmental Summary */}
              <Card className="border-border bg-background/50 p-4 shadow-none flex flex-col gap-2">
                <div className="flex items-center gap-2 text-foreground border-b border-border pb-2">
                  <Info className="size-4 text-primary" />
                  <h4 className="text-sm font-bold">
                    1. Environmental Conditions Summary
                  </h4>
                </div>
                <div className="text-xs text-foreground/90 leading-relaxed whitespace-pre-line">
                  {analysis.sections.environmentalSummary}
                </div>
              </Card>

              {/* Section 2: Five-Year Climate Patterns */}
              <Card className="border-border bg-background/50 p-4 shadow-none flex flex-col gap-2">
                <div className="flex items-center gap-2 text-foreground border-b border-border pb-2">
                  <TrendingUp className="size-4 text-[#41644A]" />
                  <h4 className="text-sm font-bold">
                    2. Five-Year Climate Patterns &amp; Trends
                  </h4>
                </div>
                <div className="text-xs text-foreground/90 leading-relaxed whitespace-pre-line">
                  {analysis.sections.climatePatterns}
                </div>
              </Card>

              {/* Section 3: Potential Agricultural Opportunities */}
              <Card className="border-border bg-background/50 p-4 shadow-none flex flex-col gap-2">
                <div className="flex items-center gap-2 text-foreground border-b border-border pb-2">
                  <Sprout className="size-4 text-[#41644A]" />
                  <h4 className="text-sm font-bold">
                    3. Potential Agricultural Opportunities
                  </h4>
                </div>
                <div className="text-xs text-foreground/90 leading-relaxed whitespace-pre-line">
                  {analysis.sections.agriculturalOpportunities}
                </div>
              </Card>

              {/* Section 4: Environmental & Climatic Risks */}
              <Card className="border-border bg-background/50 p-4 shadow-none flex flex-col gap-2">
                <div className="flex items-center gap-2 text-foreground border-b border-border pb-2">
                  <ShieldAlert className="size-4 text-primary" />
                  <h4 className="text-sm font-bold">
                    4. Environmental &amp; Climatic Risks
                  </h4>
                </div>
                <div className="text-xs text-foreground/90 leading-relaxed whitespace-pre-line">
                  {analysis.sections.environmentalRisks}
                </div>
              </Card>
            </div>

            {/* Section 5: Missing Ground-Truth Information (Highlighted Full-Width) */}
            <Card className="border-primary/50 bg-card p-4 shadow-none flex flex-col gap-2">
              <div className="flex items-center gap-2 text-foreground border-b border-border pb-2">
                <FileQuestion className="size-4 text-primary" />
                <h4 className="text-sm font-bold">
                  5. Missing Ground-Truth Information (Must Test in Laboratory)
                </h4>
              </div>
              <div className="text-xs text-foreground/95 leading-relaxed whitespace-pre-line">
                {analysis.sections.missingInformation}
              </div>
            </Card>

            {/* Section 6: Recommended Next Steps (Actionable Box) */}
            <Card className="border-[#41644A]/40 bg-background/60 p-4 shadow-none flex flex-col gap-2">
              <div className="flex items-center gap-2 text-foreground border-b border-border pb-2">
                <ArrowRight className="size-4 text-[#41644A]" />
                <h4 className="text-sm font-bold">
                  6. Recommended Practical Next Steps
                </h4>
              </div>
              <div className="text-xs text-foreground/95 leading-relaxed whitespace-pre-line">
                {analysis.sections.recommendedNextSteps}
              </div>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
