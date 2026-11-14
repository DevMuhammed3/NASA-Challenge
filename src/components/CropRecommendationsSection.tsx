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
    <div className="flex flex-col gap-6">
      {/* 1. Header & Mandatory Data Notice */}
      <Card className="border-border bg-card/90 p-5 shadow-xl backdrop-blur-xs flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-[#9A7E3B]/40 bg-[#9A7E3B]/20 text-[#28301C] font-semibold text-xs">
                <Sprout className="size-3.5 mr-1 text-[#9A7E3B]" />
                Evidence-Based Crop Evaluation
              </Badge>
              <Badge variant="outline" className="border-border bg-background/80 font-mono text-[11px] text-foreground">
                {GREEN_VALLEY_LOCATION.name}
              </Badge>
            </div>
            <h2 className="mt-1 text-xl sm:text-2xl font-bold text-foreground">
              Vegetable Suitability &amp; Planting Windows
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Deterministic evaluation matching 5-year NASA POWER satellite climate observations (2021–2025) with verified University of Arizona Extension &amp; FAO requirements.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={handleAnalyzeBestCrops}
              disabled={isAiLoading || !summary}
              className="bg-primary text-primary-foreground font-bold hover:bg-primary/90 shadow-md"
            >
              <Sparkles
                data-icon="inline-start"
                className={`size-3.5 ${isAiLoading ? "animate-spin" : ""}`}
              />
              {isAiLoading ? "Consulting AI Advisor..." : "Analyze Best Crops"}
            </Button>

            {selectedForComparison.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowComparisonModal(true)}
              >
                <Scale data-icon="inline-start" className="size-3.5 text-primary" />
                Compare Crops ({selectedForComparison.length})
              </Button>
            )}
          </div>
        </div>

        {/* Farmer-Friendly Data Notice */}
        <Alert className="border-primary/40 bg-primary/10 text-foreground">
          <Info className="size-4 text-primary shrink-0" />
          <AlertDescription className="text-xs leading-relaxed">
            <strong className="text-foreground">Essential Ground Truth Notice:</strong> These recommendations are calculated from <strong>regional atmospheric satellite data</strong> (temperatures, solar irradiance, rainfall patterns) and published university horticultural standards. They assume a functioning <strong>irrigation system</strong>. 
            <span className="block mt-1 text-muted-foreground">
              NASA satellite sensors cannot measure your specific farm soil pH, salt levels (salinity EC), nutrients (NPK), or subsoil drainage. Always verify your soil through a certified laboratory before purchasing seeds or equipment.
            </span>
          </AlertDescription>
        </Alert>

        {/* Environmental Indicators Summary for Crops */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono pt-1">
          <div className="rounded-lg bg-background/80 p-2.5 border border-border">
            <span className="text-muted-foreground text-[10px] uppercase block">Location &amp; Elevation</span>
            <span className="text-foreground font-bold">Green Valley, AZ</span>
            <span className="text-[10px] text-muted-foreground block">962m / ~3,150 ft (Low-Mid Desert)</span>
          </div>
          <div className="rounded-lg bg-background/80 p-2.5 border border-border">
            <span className="text-muted-foreground text-[10px] uppercase block">Temperature Extremes</span>
            <span className="text-foreground font-bold">-4.4°C to 45.0°C</span>
            <span className="text-[10px] text-primary block">Bimodal seasonal swings</span>
          </div>
          <div className="rounded-lg bg-background/80 p-2.5 border border-border">
            <span className="text-muted-foreground text-[10px] uppercase block">Annual Rainfall Deficit</span>
            <span className="text-sky-400 font-bold">306.8 mm/yr avg</span>
            <span className="text-[10px] text-destructive block">Drip irrigation strictly mandatory</span>
          </div>
          <div className="rounded-lg bg-background/80 p-2.5 border border-border">
            <span className="text-muted-foreground text-[10px] uppercase block">Solar Resource</span>
            <span className="text-foreground font-bold">21.1 MJ/m²/day</span>
            <span className="text-[10px] text-[#9A7E3B] font-semibold block">Abundant photosynthetic light</span>
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
                <CardContent className="p-5 flex flex-col gap-3">
                  {/* Badges row */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
                    <Badge
                      variant="outline"
                      className={
                        isTopSuitable
                          ? "border-[#9A7E3B]/40 bg-[#9A7E3B]/20 text-[#28301C] font-bold text-[11px]"
                          : "border-primary/40 bg-primary/20 text-primary font-semibold text-[11px]"
                      }
                    >
                      {isTopSuitable ? (
                        <CheckCircle2 className="size-3 mr-1 text-[#9A7E3B]" />
                      ) : (
                        <AlertTriangle className="size-3 mr-1" />
                      )}
                      {item.classification}
                    </Badge>

                    <Badge variant="outline" className="border-border bg-background font-mono text-[10px] text-muted-foreground capitalize">
                      {item.crop.category.replace("_", " ")}
                    </Badge>
                  </div>

                  {/* Crop Header */}
                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      {item.crop.name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground italic">
                      <span>{item.crop.scientificName}</span>
                      <span>•</span>
                      <span>{item.crop.botanicalFamily}</span>
                    </div>
                  </div>

                  {/* Recommended Season */}
                  <div className="rounded-lg bg-background/80 p-2.5 border border-border text-xs">
                    <span className="text-muted-foreground text-[10px] uppercase block font-semibold">
                      Recommended Planting Window (UA Extension)
                    </span>
                    <span className="text-foreground font-medium mt-0.5 block">
                      {item.crop.suitablePlantingWindows
                        .map((w) => w.seasonName)
                        .join(" or ")}
                    </span>
                    <span className="text-[11px] text-primary font-mono mt-0.5 block">
                      Harvest: {item.crop.suitablePlantingWindows[0]?.harvestWindow}
                    </span>
                  </div>

                  {/* Supporting Factors */}
                  <div className="flex flex-col gap-1.5 text-xs">
                    <span className="font-semibold text-[#9A7E3B] text-[11px] uppercase tracking-wide block">
                      Key Climatic Supports:
                    </span>
                    <ul className="list-disc list-inside flex flex-col gap-1 text-foreground/90 text-[11px]">
                      {item.primarySupportingFactors.slice(0, 2).map((s, idx) => (
                        <li key={idx} className="leading-snug">
                          {s}
                        </li>
                      ))}
                    </ul>
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
