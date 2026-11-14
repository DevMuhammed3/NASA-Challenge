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
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

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

const getCropEmoji = (name: string): string => {
  const n = name.toLowerCase();
  if (n.includes("tomato")) return "🍅";
  if (n.includes("lettuce")) return "🥬";
  if (n.includes("spinach")) return "🍃";
  if (n.includes("carrot")) return "🥕";
  if (n.includes("broccoli")) return "🥦";
  if (n.includes("pepper") || n.includes("chili")) return "🫑";
  if (n.includes("onion")) return "🧅";
  if (n.includes("garlic")) return "🧄";
  if (n.includes("corn")) return "🌽";
  if (n.includes("cucumber")) return "🥒";
  if (n.includes("squash") || n.includes("zucchini")) return "🪴";
  if (n.includes("bean")) return "🫘";
  if (n.includes("pea")) return "🫛";
  if (n.includes("cabbage")) return "🥗";
  if (n.includes("eggplant")) return "🍆";
  if (n.includes("melon") || n.includes("watermelon")) return "🍉";
  return "🌱";
};

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
    <div className="flex flex-col gap-6 min-w-0">
      {/* 1. Header & Mandatory Data Notice */}
      <Card className="border-border bg-card/90 p-3.5 sm:p-5 shadow-xl backdrop-blur-xs flex flex-col gap-4 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-[#41644A]/40 bg-[#EEF0E6] text-[#243B2A] font-semibold text-xs">
                <Sprout className="size-3.5 mr-1 text-[#41644A]" />
                Vegetable Suitability Guide
              </Badge>
              <Badge variant="outline" className="border-[#E2E6DA] bg-white font-mono text-[11px] text-[#28301C]">
                {GREEN_VALLEY_LOCATION.name}
              </Badge>
            </div>
            <h2 className="mt-1 text-xl sm:text-2xl font-bold text-[#28301C]">
              What to Plant in Green Valley, AZ
            </h2>
            <p className="mt-0.5 text-xs text-[#687365]">
              15 vegetables evaluated against NASA satellite climate data and University of Arizona Extension standards.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={handleAnalyzeBestCrops}
              disabled={isAiLoading || !summary}
              className="bg-[#41644A] text-white font-bold hover:bg-[#34503B] shadow-xs"
            >
              <Sparkles
                data-icon="inline-start"
                className={`size-3.5 ${isAiLoading ? "animate-spin" : ""}`}
              />
              {isAiLoading ? "Analyzing crops..." : "Ask AI Crop Advisor"}
            </Button>

            {selectedForComparison.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowComparisonModal(true)}
              >
                <Scale data-icon="inline-start" className="size-3.5 text-[#41644A]" />
                Compare ({selectedForComparison.length})
              </Button>
            )}
          </div>
        </div>

        {/* Farmer-Friendly Tip */}
        <Alert className="border-[#41644A]/30 bg-[#EEF0E6]/50 text-[#28301C]">
          <Info className="size-4 text-[#41644A] shrink-0" />
          <AlertDescription className="text-xs leading-relaxed">
            <strong>Grower Tip:</strong> In Southern Arizona&apos;s desert climate, timing your planting window is critical to avoid peak summer heat or winter frost. All crops require consistent <strong>drip irrigation</strong> due to low annual rainfall.
          </AlertDescription>
        </Alert>

        {/* Environmental Indicators Summary for Crops */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-1">
          <div className="rounded-xl bg-[#EEF0E6]/50 p-2.5 border border-[#E2E6DA]">
            <span className="text-[#687365] text-[10px] uppercase block font-semibold">Location &amp; Elevation</span>
            <span className="text-[#28301C] font-bold">Green Valley, AZ</span>
            <span className="text-[10px] text-[#687365] block">3,150 ft (Sonoran Desert Zone 9b)</span>
          </div>
          <div className="rounded-xl bg-[#EEF0E6]/50 p-2.5 border border-[#E2E6DA]">
            <span className="text-[#687365] text-[10px] uppercase block font-semibold">Temperature Range</span>
            <span className="text-[#28301C] font-bold">24°F to 113°F (-4°C to 45°C)</span>
            <span className="text-[10px] text-[#41644A] block">Two distinct growing seasons</span>
          </div>
          <div className="rounded-xl bg-[#EEF0E6]/50 p-2.5 border border-[#E2E6DA]">
            <span className="text-[#687365] text-[10px] uppercase block font-semibold">Irrigation Requirement</span>
            <span className="text-[#41644A] font-bold">Drip System Required</span>
            <span className="text-[10px] text-[#687365] block">Average 12.1 inches rain/year</span>
          </div>
          <div className="rounded-xl bg-[#EEF0E6]/50 p-2.5 border border-[#E2E6DA]">
            <span className="text-[#687365] text-[10px] uppercase block font-semibold">Solar Sunlight</span>
            <span className="text-[#28301C] font-bold">21.1 MJ/m²/day</span>
            <span className="text-[10px] text-[#41644A] block">High sunlight for rapid growth</span>
          </div>
        </div>
      </Card>

      {/* 2. AI Advisor Report Section (if generated) */}
      {aiReport && (
        <Card className="border-primary/60 bg-card p-5 shadow-xl flex flex-col gap-4">
          <CardHeader className="p-0 pb-3 flex flex-wrap items-center justify-between gap-2 border-b border-border">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <CardTitle className="text-base font-bold text-foreground">
                AI Agronomic Analysis ({aiReport.provider} — {aiReport.model})
              </CardTitle>
            </div>
            <span className="text-[11px] text-muted-foreground">
              Grounded exclusively in NASA observations and UA Extension publications
            </span>
          </CardHeader>

          <CardContent className="p-0 flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Section A */}
              <Card className="border-border bg-background/50 p-4 shadow-none flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[#9A7E3B] font-bold text-sm border-b border-border pb-1.5">
                  <CheckCircle2 className="size-4" />
                  <h4>A. Best Potential Crops</h4>
                </div>
                <div className="text-xs text-foreground/95 leading-relaxed whitespace-pre-line">
                  {aiReport.sections.bestCrops}
                </div>
              </Card>

              {/* Section B */}
              <Card className="border-border bg-background/50 p-4 shadow-none flex flex-col gap-2">
                <div className="flex items-center gap-2 text-primary font-bold text-sm border-b border-border pb-1.5">
                  <ShieldAlert className="size-4" />
                  <h4>B. Crops With Important Risks</h4>
                </div>
                <div className="text-xs text-foreground/95 leading-relaxed whitespace-pre-line">
                  {aiReport.sections.riskyCrops}
                </div>
              </Card>

              {/* Section C */}
              <Card className="border-border bg-background/50 p-4 shadow-none flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[#9A7E3B] font-bold text-sm border-b border-border pb-1.5">
                  <Calendar className="size-4" />
                  <h4>C. Preliminary Planting Calendar</h4>
                </div>
                <div className="text-xs text-foreground/95 leading-relaxed whitespace-pre-line">
                  {aiReport.sections.plantingCalendar}
                </div>
              </Card>

              {/* Section D */}
              <Card className="border-border bg-background/50 p-4 shadow-none flex flex-col gap-2">
                <div className="flex items-center gap-2 text-primary font-bold text-sm border-b border-border pb-1.5">
                  <FileQuestion className="size-4" />
                  <h4>D. Missing Information to Test</h4>
                </div>
                <div className="text-xs text-foreground/95 leading-relaxed whitespace-pre-line">
                  {aiReport.sections.missingInformation}
                </div>
              </Card>
            </div>

            {/* Section E: Practical Recommendation Full-Width */}
            <Card className="border-[#9A7E3B]/40 bg-background/60 p-4 shadow-none flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[#9A7E3B] font-bold text-sm border-b border-border pb-1.5">
                <ArrowRight className="size-4" />
                <h4>E. Practical Conclusion &amp; Next Steps for the Grower</h4>
              </div>
              <div className="text-xs text-foreground leading-relaxed whitespace-pre-line">
                {aiReport.sections.practicalRecommendation}
              </div>
            </Card>
          </CardContent>
        </Card>
      )}

      {/* AI Error banner if any */}
      {aiErrorMsg && (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertTitle>AI Advisor Message</AlertTitle>
          <AlertDescription>{aiErrorMsg}</AlertDescription>
        </Alert>
      )}

      {/* 3. Crop Filter Bar & Toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-semibold text-muted-foreground mr-1">Filter Vegetables:</span>
          <Button
            size="sm"
            variant={categoryFilter === "all" ? "default" : "outline"}
            onClick={() => setCategoryFilter("all")}
            className={categoryFilter === "all" ? "font-bold shadow-xs" : ""}
          >
            All 15 Vegetables ({allEvaluations.length})
          </Button>
          <Button
            size="sm"
            variant={categoryFilter === "cool" ? "default" : "outline"}
            onClick={() => setCategoryFilter("cool")}
            className={categoryFilter === "cool" ? "font-bold shadow-xs" : ""}
          >
            Cool-Season Crops (Fall - Spring)
          </Button>
          <Button
            size="sm"
            variant={categoryFilter === "warm" ? "default" : "outline"}
            onClick={() => setCategoryFilter("warm")}
            className={categoryFilter === "warm" ? "font-bold shadow-xs" : ""}
          >
            Warm-Season Crops (Spring / Summer / Monsoon)
          </Button>
        </div>

        <div className="text-[11px] text-muted-foreground font-mono">
          Showing {filteredCrops.length} verified vegetable profiles
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card/60 py-16 text-center">
          <RefreshCw className="size-8 text-primary animate-spin mb-3" />
          <p className="text-sm font-semibold text-foreground">
            Evaluating Vegetable Requirements Against NASA POWER Observations...
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Assessing heat stress limits, frost exposure, solar saturation, and rainfall deficits for Green Valley, AZ.
          </p>
        </div>
      )}

      {/* Error state */}
      {errorMsg && (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertTitle>Evaluation Error</AlertTitle>
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
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
              <Card
                key={item.crop.id}
                className={`transition shadow-lg flex flex-col justify-between ${
                  isTopSuitable
                    ? "border-[#9A7E3B]/60 bg-card hover:border-[#9A7E3B]"
                    : "border-border bg-card/90 hover:border-primary/70"
                }`}
              >
                {/* Card Top */}
                <CardContent className="p-4 sm:p-5 flex flex-col gap-3">
                  {/* Badges row */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
                    <Badge
                      variant="outline"
                      className={
                        isTopSuitable
                          ? "border-[#41644A]/40 bg-[#EEF0E6] text-[#243B2A] font-bold text-[11px]"
                          : "border-amber-300 bg-amber-50 text-amber-900 font-semibold text-[11px]"
                      }
                    >
                      {isTopSuitable ? (
                        <CheckCircle2 className="size-3 mr-1 text-[#41644A]" />
                      ) : (
                        <AlertTriangle className="size-3 mr-1 text-amber-700" />
                      )}
                      {isTopSuitable ? "Suitable with Irrigation" : "Conditional / Extra Care"}
                    </Badge>

                    <Badge variant="outline" className="border-[#E2E6DA] bg-white font-mono text-[10px] text-[#687365] capitalize">
                      {item.crop.category.replace("_", " ")}
                    </Badge>
                  </div>

                  {/* Crop Header with Emoji */}
                  <div className="flex items-center gap-2.5">
                    <span className="text-3xl shrink-0">{getCropEmoji(item.crop.name)}</span>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-[#28301C]">
                        {item.crop.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-[#687365]">
                        <span className="italic">{item.crop.scientificName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Farmer Chips */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-xl bg-[#EEF0E6]/50 border border-[#E2E6DA]">
                      <span className="text-[10px] uppercase font-semibold text-[#687365] block">
                        When to Plant
                      </span>
                      <span className="font-bold text-[#28301C] block mt-0.5 truncate">
                        {item.crop.suitablePlantingWindows[0]?.seasonName || "Seasonal"}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-[#EEF0E6]/50 border border-[#E2E6DA]">
                      <span className="text-[10px] uppercase font-semibold text-[#687365] block">
                        Water Demand
                      </span>
                      <span className="font-bold text-[#41644A] block mt-0.5 capitalize truncate">
                        {item.crop.waterRequirements.category || "Moderate Drip"}
                      </span>
                    </div>
                  </div>

                  {/* Supporting Factors */}
                  <div className="flex flex-col gap-1 text-xs">
                    <span className="font-semibold text-[#41644A] text-[11px] block">
                      Why it grows well here:
                    </span>
                    <p className="text-xs text-[#28301C] leading-snug">
                      {item.primarySupportingFactors[0] || "Well suited for local seasonal temperature bands."}
                    </p>
                  </div>

                  {/* Risks */}
                  <div className="flex flex-col gap-1.5 text-xs">
                    <span className="font-semibold text-primary text-[11px] uppercase tracking-wide block">
                      Documented Environmental Constraints:
                    </span>
                    <ul className="list-disc list-inside flex flex-col gap-1 text-foreground/80 text-[11px]">
                      {item.primaryRiskFactors.slice(0, 2).map((r, idx) => (
                        <li key={idx} className="leading-snug">
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Expandable Factor Breakdown */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-border flex flex-col gap-2 text-xs font-mono">
                      <div className="p-2.5 rounded-lg bg-background text-[11px] flex flex-col gap-1 border border-border">
                        <div className="text-muted-foreground">Thermal Limits:</div>
                        <div className="text-foreground">
                          Vegetative: {item.crop.suitableTempRange.min}°C – {item.crop.suitableTempRange.max}°C (Opt: {item.crop.suitableTempRange.optMin}–{item.crop.suitableTempRange.optMax}°C)
                        </div>
                        <div className="text-primary">
                          Absolute Injury Limit: {item.crop.temperatureToleranceLimits.absoluteMin}°C min / {item.crop.temperatureToleranceLimits.absoluteMax}°C max
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-background text-[11px] flex flex-col gap-1 border border-border">
                        <div className="text-muted-foreground">Water &amp; Irrigation:</div>
                        <div className="text-sky-400">
                          Seasonal ETc: {item.crop.waterRequirements.seasonalNeedMm} mm ({item.crop.waterRequirements.category})
                        </div>
                        <div className="text-foreground/90">
                          {item.crop.waterRequirements.description}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-background text-[11px] flex flex-col gap-1 border border-border">
                        <div className="text-muted-foreground">Soil Status (On-Farm):</div>
                        <div className="text-destructive">
                          {item.factors.soilSuitability.headline}
                        </div>
                        <div className="text-muted-foreground text-[10px]">
                          Target pH: {item.crop.soilRequirements.preferredPhMin}–{item.crop.soilRequirements.preferredPhMax} | Salinity tolerance: {item.crop.soilRequirements.salinityTolerance}
                        </div>
                      </div>

                      <div className="text-[10px] text-muted-foreground pt-1">
                        Source:{" "}
                        <a
                          href={item.crop.references.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary underline inline-flex items-center gap-0.5"
                        >
                          {item.crop.references.primarySource} <ExternalLink className="size-2.5" />
                        </a>
                      </div>
                    </div>
                  )}
                </CardContent>

                {/* Card Bottom Actions */}
                <CardFooter className="p-4 border-t border-border bg-background/50 rounded-b-xl flex items-center justify-between text-xs">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedCropId(isExpanded ? null : item.crop.id)}
                    className="font-semibold text-foreground hover:text-primary transition"
                  >
                    {isExpanded ? (
                      <>
                        Less Details <ChevronUp data-icon="inline-end" className="size-3.5" />
                      </>
                    ) : (
                      <>
                        Scientific Details <ChevronDown data-icon="inline-end" className="size-3.5" />
                      </>
                    )}
                  </Button>

                  <Button
                    size="xs"
                    variant={isCompared ? "default" : "outline"}
                    onClick={() => toggleComparison(item.crop.id)}
                    className={isCompared ? "font-bold" : ""}
                  >
                    {isCompared ? "Selected for Compare" : "+ Compare"}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* 5. Crop Comparison Dialog */}
      <Dialog open={showComparisonModal} onOpenChange={setShowComparisonModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-border text-foreground">
          <DialogHeader className="border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Scale className="size-5 text-primary" />
              <DialogTitle className="text-base font-bold text-foreground">
                Side-by-Side Crop Comparison (Green Valley Climate)
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Compare climatic requirements, thermal thresholds, and water needs.
            </DialogDescription>
          </DialogHeader>

          {comparedCropObjects.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">
              No crops selected. Click &quot;+ Compare&quot; on any crop card to add it to the comparison view.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border bg-background/60">
                  <TableHead className="font-bold text-foreground">Attribute</TableHead>
                  {comparedCropObjects.map((c) => (
                    <TableHead key={c.crop.id} className="font-bold text-foreground">
                      {c.crop.name}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody className="font-mono text-xs">
                <TableRow className="border-border">
                  <TableCell className="text-muted-foreground font-sans font-semibold">Classification</TableCell>
                  {comparedCropObjects.map((c) => (
                    <TableCell key={c.crop.id}>
                      <span className="text-foreground font-bold">{c.classification}</span>
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow className="border-border">
                  <TableCell className="text-muted-foreground font-sans font-semibold">Seasonal Category</TableCell>
                  {comparedCropObjects.map((c) => (
                    <TableCell key={c.crop.id} className="capitalize">
                      {c.crop.category.replace("_", " ")}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow className="border-border">
                  <TableCell className="text-muted-foreground font-sans font-semibold">Optimal Temperature</TableCell>
                  {comparedCropObjects.map((c) => (
                    <TableCell key={c.crop.id} className="text-[#9A7E3B] font-bold">
                      {c.crop.suitableTempRange.optMin}°C – {c.crop.suitableTempRange.optMax}°C
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow className="border-border">
                  <TableCell className="text-muted-foreground font-sans font-semibold">Absolute Heat Limit</TableCell>
                  {comparedCropObjects.map((c) => (
                    <TableCell key={c.crop.id} className="text-primary">
                      {c.crop.temperatureToleranceLimits.absoluteMax}°C ({c.crop.heatSensitivity} sensitivity)
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow className="border-border">
                  <TableCell className="text-muted-foreground font-sans font-semibold">Frost Tolerance</TableCell>
                  {comparedCropObjects.map((c) => (
                    <TableCell key={c.crop.id}>
                      Down to {c.crop.temperatureToleranceLimits.absoluteMin}°C ({c.crop.frostSensitivity})
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow className="border-border">
                  <TableCell className="text-muted-foreground font-sans font-semibold">Seasonal Water Need</TableCell>
                  {comparedCropObjects.map((c) => (
                    <TableCell key={c.crop.id} className="text-sky-400">
                      {c.crop.waterRequirements.seasonalNeedMm} mm ({c.crop.waterRequirements.category})
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow className="border-border">
                  <TableCell className="text-muted-foreground font-sans font-semibold">Planting Window</TableCell>
                  {comparedCropObjects.map((c) => (
                    <TableCell key={c.crop.id} className="text-primary">
                      {c.crop.suitablePlantingWindows.map((w) => w.seasonName).join(" or ")}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow className="border-border">
                  <TableCell className="text-muted-foreground font-sans font-semibold">Primary Risk in Green Valley</TableCell>
                  {comparedCropObjects.map((c) => (
                    <TableCell key={c.crop.id} className="text-destructive font-sans text-[11px]">
                      {c.primaryRiskFactors[0]}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          )}

          <div className="pt-2 flex justify-end">
            <Button
              size="sm"
              onClick={() => setShowComparisonModal(false)}
            >
              Close Comparison
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
