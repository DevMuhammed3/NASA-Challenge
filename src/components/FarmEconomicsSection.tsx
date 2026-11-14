"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  DollarSign,
  TrendingUp,
  Percent,
  Scale,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  Layers,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Droplet,
  FileText,
  ShieldAlert,
  ArrowUpRight,
  Sliders,
} from "lucide-react";
import { CROPS } from "@/lib/crop-requirements";
import type {
  CropEconomicComparisonItem,
  CropProductionBudget,
  EconomicAdvisorReport,
  FarmFinancialResults,
  FinancialScenario,
  MarketPriceReport,
  NassAgriculturalStat,
  CostReductionOpportunity,
} from "@/lib/types/economics";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

interface EconomicsApiResponse {
  success: boolean;
  marketReport: MarketPriceReport;
  nassData: {
    status: string;
    dataSource: string;
    stats: NassAgriculturalStat[];
    historicalNotes: string;
  };
  selectedCropFinancials: FarmFinancialResults;
  selectedCropScenarios: Record<string, FinancialScenario>;
  costReductionOpportunities: CostReductionOpportunity[];
  cropComparison: CropEconomicComparisonItem[];
  availableBudgetsCount: number;
}

export function FarmEconomicsSection() {
  const [selectedCropId, setSelectedCropId] = useState<string>("tomato");
  const [acreage, setAcreage] = useState<number>(1.0);
  const [sellingPriceOverride, setSellingPriceOverride] = useState<string>("");
  const [yieldOverride, setYieldOverride] = useState<string>("");
  const [marketablePct, setMarketablePct] = useState<number>(85);

  const [activeSubTab, setActiveSubTab] = useState<
    "comparison" | "scenarios" | "market_prices" | "budget" | "cost_reduction" | "advisor"
  >("comparison");

  const [data, setData] = useState<EconomicsApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // AI Advisor state
  const [isGeneratingAiReport, setIsGeneratingAiReport] = useState<boolean>(false);
  const [aiReport, setAiReport] = useState<EconomicAdvisorReport | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Fetch economics data from API
  const fetchEconomicsData = useCallback(
    async (refresh = false) => {
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);
      setErrorMsg(null);

      try {
        const params = new URLSearchParams({
          cropId: selectedCropId,
          acreage: String(acreage),
          refresh: refresh ? "true" : "false",
        });

        if (sellingPriceOverride && !isNaN(parseFloat(sellingPriceOverride))) {
          params.set("sellingPricePerLb", sellingPriceOverride);
        }
        if (yieldOverride && !isNaN(parseFloat(yieldOverride))) {
          params.set("expectedYieldPerAcreLbs", yieldOverride);
        }
        if (marketablePct && !isNaN(marketablePct)) {
          params.set("marketablePercent", String(marketablePct));
        }

        const res = await fetch(`/api/economics?${params.toString()}`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: Failed to load farm economics`);
        }
        const json: EconomicsApiResponse = await res.json();
        setData(json);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Failed to load economics data");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [selectedCropId, acreage, sellingPriceOverride, yieldOverride, marketablePct]
  );

  useEffect(() => {
    fetchEconomicsData();
  }, [fetchEconomicsData]);

  // Request AI Advisory report
  const handleGenerateAiReport = async () => {
    if (!data) return;
    setIsGeneratingAiReport(true);
    setAiError(null);

    try {
      const top5 = data.cropComparison.slice(0, 5);
      const res = await fetch("/api/economics/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cropName: data.selectedCropFinancials.cropName,
          acreage: data.selectedCropFinancials.acreage,
          financialResults: data.selectedCropFinancials,
          scenarios: data.selectedCropScenarios,
          comparisonTop5: top5,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to generate AI economic report");
      }
      setAiReport(json.report);
      setActiveSubTab("advisor");
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Failed to contact AI advisor");
    } finally {
      setIsGeneratingAiReport(false);
    }
  };

  const selectedCrop = CROPS.find((c) => c.id === selectedCropId);
  const fin = data?.selectedCropFinancials;
  const scenarios = data?.selectedCropScenarios;

  return (
    <div className="flex flex-col gap-6 min-w-0">
      {/* Header Banner */}
      <Card className="border-border bg-card p-4 sm:p-6 shadow-sm min-w-0">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-[#41644A] text-white">
                <DollarSign className="size-5" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#28301C]">
                Crop Profits &amp; Market Prices
              </h2>
              <Badge variant="outline" className="border-[#41644A]/40 bg-[#EEF0E6] font-mono text-xs font-semibold text-[#243B2A]">
                Green Valley, AZ • USDA Market Data
              </Badge>
            </div>
            <p className="text-xs text-[#687365] max-w-3xl">
              Calculate expected harvest income, input costs, and net profit per acre based on wholesale market quotes and University of Arizona enterprise budgets.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchEconomicsData(true)}
              disabled={isRefreshing || isLoading}
            >
              <RefreshCw
                data-icon="inline-start"
                className={`size-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`}
              />
              <span>{isRefreshing ? "Updating Prices..." : "Refresh Market Prices"}</span>
            </Button>
            <Button
              size="sm"
              onClick={handleGenerateAiReport}
              disabled={isGeneratingAiReport || isLoading}
              className="font-bold"
            >
              <Sparkles
                data-icon="inline-start"
                className={`size-3.5 ${isGeneratingAiReport ? "animate-spin" : ""}`}
              />
              <span>{isGeneratingAiReport ? "Analyzing Economics..." : "Analyze Farm Profitability"}</span>
            </Button>
          </div>
        </div>

        {/* Global Controls Row */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 rounded-xl border border-border bg-background/80 p-4">
          {/* Crop Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Select Crop to Evaluate
            </label>
            <div className="relative">
              <select
                value={selectedCropId}
                onChange={(e) => {
                  setSelectedCropId(e.target.value);
                  setSellingPriceOverride("");
                  setYieldOverride("");
                }}
                className="w-full appearance-none rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-xs focus:border-primary focus:outline-hidden"
              >
                {CROPS.map((c) => (
                  <option key={c.id} value={c.id} className="bg-card text-foreground">
                    {c.name} ({c.category === "cool_season" ? "Cool Season" : "Warm Season"})
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 size-4 text-muted-foreground" />
            </div>
          </div>

          {/* Acreage Input */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Cultivated Area (Acres)
            </label>
            <input
              type="number"
              min="0.1"
              max="1000"
              step="0.5"
              value={acreage}
              onChange={(e) => setAcreage(Math.max(0.1, parseFloat(e.target.value) || 1.0))}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-xs focus:border-primary focus:outline-hidden"
            />
          </div>

          {/* Selling Price Override ($/lb) */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Selling Price ($/lb)
            </label>
            <input
              type="number"
              min="0.05"
              step="0.05"
              placeholder={fin ? `$${fin.sellingPricePerLb}` : "Auto"}
              value={sellingPriceOverride}
              onChange={(e) => setSellingPriceOverride(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-xs placeholder:text-muted-foreground/50 focus:border-primary focus:outline-hidden"
            />
          </div>

          {/* Marketable Packout % */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Marketable Packout %
            </label>
            <input
              type="number"
              min="10"
              max="100"
              value={marketablePct}
              onChange={(e) => setMarketablePct(Math.min(100, Math.max(10, parseInt(e.target.value) || 85)))}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-xs focus:border-primary focus:outline-hidden"
            />
          </div>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="size-4" />
            <AlertDescription>{errorMsg}</AlertDescription>
          </Alert>
        )}
      </Card>

      {/* KPI Summary Cards */}
      {fin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* Card 1: Estimated Net Profit */}
          <Card className="border-border bg-card p-4 shadow-xs">
            <CardContent className="p-0 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Estimated Net Profit</span>
                <TrendingUp className="size-4 text-[#9A7E3B]" />
              </div>
              <div className="mt-2">
                <span className={`text-xl font-bold font-mono ${fin.netProfit >= 0 ? "text-[#28301C]" : "text-destructive"}`}>
                  ${fin.netProfit.toLocaleString()}
                </span>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  ${fin.netProfitPerAcre.toLocaleString()}/acre ({acreage} ac)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Return on Investment */}
          <Card className="border-border bg-card p-4 shadow-xs">
            <CardContent className="p-0 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Return on Investment</span>
                <Percent className="size-4 text-primary" />
              </div>
              <div className="mt-2">
                <span className={`text-xl font-bold font-mono ${fin.returnOnInvestmentPercent >= 20 ? "text-[#28301C]" : fin.returnOnInvestmentPercent >= 0 ? "text-primary" : "text-destructive"}`}>
                  {fin.returnOnInvestmentPercent}%
                </span>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Gross Margin: {fin.grossMarginPercent}%
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Gross Revenue */}
          <Card className="border-border bg-card p-4 shadow-xs">
            <CardContent className="p-0 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Gross Revenue</span>
                <DollarSign className="size-4 text-[#9A7E3B]" />
              </div>
              <div className="mt-2">
                <span className="text-xl font-bold font-mono text-foreground">
                  ${fin.grossRevenue.toLocaleString()}
                </span>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {fin.marketableYieldLbs.toLocaleString()} lbs @ ${fin.sellingPricePerLb}/lb
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Total Production Cost */}
          <Card className="border-border bg-card p-4 shadow-xs">
            <CardContent className="p-0 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Total Production Cost</span>
                <Layers className="size-4 text-primary" />
              </div>
              <div className="mt-2">
                <span className="text-xl font-bold font-mono text-foreground">
                  ${fin.totalProductionCosts.toLocaleString()}
                </span>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  ${fin.totalCostPerAcre.toLocaleString()}/acre total
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card 5: Break-Even Selling Price */}
          <Card className="border-border bg-card p-4 shadow-xs">
            <CardContent className="p-0 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Break-Even Price</span>
                <Scale className="size-4 text-muted-foreground" />
              </div>
              <div className="mt-2">
                <span className="text-xl font-bold font-mono text-foreground">
                  ${fin.breakEvenSellingPricePerLb}
                </span>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Margin: {fin.breakEvenSafetyMarginPercent}% buffer
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Card 6: Break-Even Yield */}
          <Card className="border-border bg-card p-4 shadow-xs">
            <CardContent className="p-0 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Break-Even Yield</span>
                <Sliders className="size-4 text-muted-foreground" />
              </div>
              <div className="mt-2">
                <span className="text-xl font-bold font-mono text-foreground">
                  {fin.breakEvenYieldLbsPerAcre.toLocaleString()}
                </span>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  lbs/acre needed to cover costs
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sub-Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border pb-2">
        <Button
          variant={activeSubTab === "comparison" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveSubTab("comparison")}
          className={activeSubTab === "comparison" ? "font-bold shadow-xs" : "text-foreground/80 hover:text-foreground"}
        >
          <Layers data-icon="inline-start" className="size-3.5" />
          <span>15-Crop Profitability Comparison</span>
        </Button>

        <Button
          variant={activeSubTab === "scenarios" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveSubTab("scenarios")}
          className={activeSubTab === "scenarios" ? "font-bold shadow-xs" : "text-foreground/80 hover:text-foreground"}
        >
          <Scale data-icon="inline-start" className="size-3.5" />
          <span>3-Tier Scenario Modeler</span>
        </Button>

        <Button
          variant={activeSubTab === "market_prices" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveSubTab("market_prices")}
          className={activeSubTab === "market_prices" ? "font-bold shadow-xs" : "text-foreground/80 hover:text-foreground"}
        >
          <DollarSign data-icon="inline-start" className="size-3.5" />
          <span>USDA Phoenix Wholesale Quotes</span>
        </Button>

        <Button
          variant={activeSubTab === "budget" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveSubTab("budget")}
          className={activeSubTab === "budget" ? "font-bold shadow-xs" : "text-foreground/80 hover:text-foreground"}
        >
          <FileText data-icon="inline-start" className="size-3.5" />
          <span>UA Extension Cost Budget</span>
        </Button>

        <Button
          variant={activeSubTab === "cost_reduction" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveSubTab("cost_reduction")}
          className={activeSubTab === "cost_reduction" ? "font-bold shadow-xs" : "text-foreground/80 hover:text-foreground"}
        >
          <Lightbulb data-icon="inline-start" className="size-3.5" />
          <span>Cost Reduction Roadmap</span>
        </Button>

        <Button
          variant={activeSubTab === "advisor" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveSubTab("advisor")}
          className={activeSubTab === "advisor" ? "font-bold shadow-xs" : "text-muted-foreground hover:text-foreground"}
        >
          <Sparkles data-icon="inline-start" className="size-3.5" />
          <span>AI Economic Advisor</span>
        </Button>
      </div>

      {/* Sub-Tab 1: 15-Crop Profitability Comparison */}
      {activeSubTab === "comparison" && data && (
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Deterministic 15-Crop Economic Ranking (1-Acre Basis)
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-1">
                Crops ranked strictly by net profit per acre, synthesized from University of Arizona Cooperative Extension enterprise budgets and USDA AMS Phoenix Shipping Point wholesale prices.
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-border bg-background/80 font-mono text-[11px] text-foreground">
              Currency: USD ($)
            </Badge>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border bg-background/60 text-muted-foreground hover:bg-background/60">
                  <TableHead className="font-bold text-foreground">Crop</TableHead>
                  <TableHead className="font-bold text-foreground">Season</TableHead>
                  <TableHead className="font-bold text-foreground">Wholesale Price</TableHead>
                  <TableHead className="font-bold text-foreground">Yield / Acre</TableHead>
                  <TableHead className="font-bold text-foreground">Gross Revenue</TableHead>
                  <TableHead className="font-bold text-foreground">Total Cost</TableHead>
                  <TableHead className="font-bold text-foreground">Net Profit / Acre</TableHead>
                  <TableHead className="font-bold text-foreground">ROI %</TableHead>
                  <TableHead className="font-bold text-foreground">Break-Even Price</TableHead>
                  <TableHead className="font-bold text-foreground">Risk Level</TableHead>
                  <TableHead className="font-bold text-foreground">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.cropComparison.map((item) => (
                  <TableRow
                    key={item.cropId}
                    className={`border-border hover:bg-background/50 transition font-mono ${
                      item.cropId === selectedCropId ? "bg-background/70 font-semibold" : ""
                    }`}
                  >
                    <TableCell className="font-sans font-bold text-foreground whitespace-nowrap">
                      {item.cropName}
                      {item.cropId === selectedCropId && (
                        <Badge className="ml-1.5 bg-[#9A7E3B] text-white font-bold text-[9px] px-1.5 py-0">
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-sans whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className={
                          item.category === "cool_season"
                            ? "border-sky-500/40 bg-sky-500/10 text-sky-400 font-semibold text-[10px]"
                            : "border-amber-500/40 bg-amber-500/10 text-amber-400 font-semibold text-[10px]"
                        }
                      >
                        {item.category === "cool_season" ? "Cool Season" : "Warm Season"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-foreground">
                      ${item.marketPricePerLb.toFixed(2)}/lb
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.yieldPerAcreLbs.toLocaleString()} lbs
                    </TableCell>
                    <TableCell className="text-foreground">
                      ${item.revenuePerAcre.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      ${item.costPerAcre.toLocaleString()}
                    </TableCell>
                    <TableCell
                      className={`font-bold ${
                        item.netProfitPerAcre >= 0 ? "text-[#28301C]" : "text-destructive"
                      }`}
                    >
                      ${item.netProfitPerAcre.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-foreground">{item.roiPercent}%</TableCell>
                    <TableCell className="text-muted-foreground">
                      ${item.breakEvenPricePerLb.toFixed(2)}/lb
                    </TableCell>
                    <TableCell className="font-sans whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className={
                          item.financialRiskLevel === "Low"
                            ? "border-[#9A7E3B]/40 bg-[#9A7E3B]/20 text-[#28301C] font-bold text-[10px]"
                            : item.financialRiskLevel === "Moderate"
                            ? "border-primary/40 bg-primary/20 text-primary font-bold text-[10px]"
                            : "border-destructive/40 bg-destructive/20 text-destructive font-bold text-[10px]"
                        }
                      >
                        {item.financialRiskLevel} Risk
                      </Badge>
                    </TableCell>
                    <TableCell className="font-sans">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => {
                          setSelectedCropId(item.cropId);
                          setSellingPriceOverride("");
                          setYieldOverride("");
                        }}
                        className="text-xs font-semibold"
                      >
                        Select
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Sub-Tab 2: Scenario Modeler */}
      {activeSubTab === "scenarios" && scenarios && (
        <div className="flex flex-col gap-6">
          <Alert className="border-border bg-card text-muted-foreground">
            <ShieldAlert className="size-4 text-primary" />
            <AlertDescription className="text-xs">
              <strong className="text-foreground">Scenario Methodology Notice:</strong> GAIA calculates 3 deterministic scenarios for {fin?.cropName} on {acreage} acres. Multipliers reflect empirical agricultural volatility in Southern Arizona (Sonoran Desert heat waves, groundwater pumping spikes, and Mexican/California wholesale supply surges).
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Conservative Card */}
            <Card className="border-primary/40 bg-card p-6 shadow-sm flex flex-col justify-between">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="border-primary/40 bg-primary/20 text-primary font-bold text-xs">
                    Conservative Stress Test
                  </Badge>
                  <ShieldAlert className="size-4 text-primary" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-foreground">
                    ${scenarios.conservative.results.netProfit.toLocaleString()}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Net Profit (${scenarios.conservative.results.netProfitPerAcre.toLocaleString()}/ac)
                  </p>
                </div>

                <div className="flex flex-col gap-1.5 border-t border-border pt-3 text-xs font-mono">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Yield Multiplier:</span>
                    <span className="font-bold text-destructive">0.80 (-20%)</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Wholesale Price:</span>
                    <span className="font-bold text-destructive">${scenarios.conservative.results.sellingPricePerLb}/lb (-15%)</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Operating Cost:</span>
                    <span className="font-bold text-destructive">+10% Pumping</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Gross Revenue:</span>
                    <span className="font-bold text-foreground">${scenarios.conservative.results.grossRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Total Costs:</span>
                    <span className="font-bold text-foreground">${scenarios.conservative.results.totalProductionCosts.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Break-Even Price:</span>
                    <span className="font-bold text-foreground">${scenarios.conservative.results.breakEvenSellingPricePerLb}/lb</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>ROI:</span>
                    <span className="font-bold text-primary">{scenarios.conservative.results.returnOnInvestmentPercent}%</span>
                  </div>
                </div>

                <div className="border-t border-border pt-3">
                  <p className="text-[11px] font-bold text-foreground mb-1">Documented Assumptions:</p>
                  <ul className="flex flex-col gap-1 text-[11px] text-muted-foreground list-disc list-inside">
                    {scenarios.conservative.documentedAssumptions.map((asm, i) => (
                      <li key={i}>{asm}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>

            {/* Expected Baseline Card */}
            <Card className="border-[#9A7E3B]/60 bg-card p-6 shadow-sm flex flex-col justify-between">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="border-[#9A7E3B]/40 bg-[#9A7E3B]/20 text-[#28301C] font-bold text-xs">
                    Expected Extension Baseline
                  </Badge>
                  <CheckCircle2 className="size-4 text-[#9A7E3B]" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-[#28301C]">
                    ${scenarios.expected.results.netProfit.toLocaleString()}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Net Profit (${scenarios.expected.results.netProfitPerAcre.toLocaleString()}/ac)
                  </p>
                </div>

                <div className="flex flex-col gap-1.5 border-t border-border pt-3 text-xs font-mono">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Yield Multiplier:</span>
                    <span className="font-bold text-foreground">1.00 (Standard)</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Wholesale Price:</span>
                    <span className="font-bold text-foreground">${scenarios.expected.results.sellingPricePerLb}/lb (Phoenix Mid)</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Operating Cost:</span>
                    <span className="font-bold text-foreground">1.00 (UA Budget)</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Gross Revenue:</span>
                    <span className="font-bold text-foreground">${scenarios.expected.results.grossRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Total Costs:</span>
                    <span className="font-bold text-foreground">${scenarios.expected.results.totalProductionCosts.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Break-Even Price:</span>
                    <span className="font-bold text-foreground">${scenarios.expected.results.breakEvenSellingPricePerLb}/lb</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>ROI:</span>
                    <span className="font-bold text-[#28301C]">{scenarios.expected.results.returnOnInvestmentPercent}%</span>
                  </div>
                </div>

                <div className="border-t border-border pt-3">
                  <p className="text-[11px] font-bold text-foreground mb-1">Documented Assumptions:</p>
                  <ul className="flex flex-col gap-1 text-[11px] text-muted-foreground list-disc list-inside">
                    {scenarios.expected.documentedAssumptions.map((asm, i) => (
                      <li key={i}>{asm}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>

            {/* Optimistic Card */}
            <Card className="border-[#9A7E3B]/60 bg-card p-6 shadow-sm flex flex-col justify-between">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="border-[#9A7E3B]/40 bg-[#9A7E3B]/20 text-[#28301C] font-bold text-xs">
                    Optimistic Premium Practice
                  </Badge>
                  <ArrowUpRight className="size-4 text-[#9A7E3B]" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-[#28301C]">
                    ${scenarios.optimistic.results.netProfit.toLocaleString()}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Net Profit (${scenarios.optimistic.results.netProfitPerAcre.toLocaleString()}/ac)
                  </p>
                </div>

                <div className="flex flex-col gap-1.5 border-t border-border pt-3 text-xs font-mono">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Yield Multiplier:</span>
                    <span className="font-bold text-[#28301C]">1.18 (+18%)</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Wholesale Price:</span>
                    <span className="font-bold text-[#28301C]">${scenarios.optimistic.results.sellingPricePerLb}/lb (+15%)</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Operating Cost:</span>
                    <span className="font-bold text-[#28301C]">-8% Efficiency</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Gross Revenue:</span>
                    <span className="font-bold text-foreground">${scenarios.optimistic.results.grossRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Total Costs:</span>
                    <span className="font-bold text-foreground">${scenarios.optimistic.results.totalProductionCosts.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Break-Even Price:</span>
                    <span className="font-bold text-foreground">${scenarios.optimistic.results.breakEvenSellingPricePerLb}/lb</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>ROI:</span>
                    <span className="font-bold text-[#28301C]">{scenarios.optimistic.results.returnOnInvestmentPercent}%</span>
                  </div>
                </div>

                <div className="border-t border-border pt-3">
                  <p className="text-[11px] font-bold text-foreground mb-1">Documented Assumptions:</p>
                  <ul className="flex flex-col gap-1 text-[11px] text-muted-foreground list-disc list-inside">
                    {scenarios.optimistic.documentedAssumptions.map((asm, i) => (
                      <li key={i}>{asm}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Sub-Tab 3: USDA Phoenix Market Prices */}
      {activeSubTab === "market_prices" && data && (
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-3">
            {/* Transparency Callout */}
            <Alert className="border-border bg-background/80 text-foreground">
              <HelpCircle className="size-5 text-primary shrink-0" />
              <div>
                <AlertTitle className="font-bold">Market Price Transparency Disclosure</AlertTitle>
                <AlertDescription className="text-muted-foreground mt-1 text-xs">
                  {data.marketReport.transparencyNotice}
                </AlertDescription>
                <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] font-mono text-muted-foreground">
                  <span>Report Name: {data.marketReport.reportName}</span>
                  <span>•</span>
                  <span>Report ID: {data.marketReport.reportId}</span>
                  <span>•</span>
                  <span>Market: {data.marketReport.market}</span>
                  <span>•</span>
                  <span>Report Date: {data.marketReport.reportDate}</span>
                  <span>•</span>
                  <span>API Mode: {data.marketReport.isLiveApi ? "Live USDA MARS Connection" : "Validated Regional Baseline"}</span>
                </div>
              </div>
            </Alert>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border bg-background/60 text-muted-foreground hover:bg-background/60">
                  <TableHead className="font-bold text-foreground">Commodity</TableHead>
                  <TableHead className="font-bold text-foreground">Package &amp; Specification</TableHead>
                  <TableHead className="font-bold text-foreground">Grade</TableHead>
                  <TableHead className="font-bold text-foreground">Price Range ($)</TableHead>
                  <TableHead className="font-bold text-foreground">Average Quote</TableHead>
                  <TableHead className="font-bold text-foreground">Unit Weight</TableHead>
                  <TableHead className="font-bold text-foreground">Price / Lb</TableHead>
                  <TableHead className="font-bold text-foreground">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.marketReport.quotes.map((q, idx) => (
                  <TableRow
                    key={idx}
                    className={`border-border hover:bg-background/50 transition font-mono ${
                      q.matchedCropId === selectedCropId ? "bg-background/70 font-semibold" : ""
                    }`}
                  >
                    <TableCell className="font-sans font-bold text-foreground whitespace-nowrap">
                      {q.commodity}
                      {q.variety && <span className="block text-[10px] font-normal text-muted-foreground">{q.variety}</span>}
                    </TableCell>
                    <TableCell className="font-sans text-muted-foreground">{q.package}</TableCell>
                    <TableCell className="font-sans text-foreground">{q.grade}</TableCell>
                    <TableCell className="text-muted-foreground">
                      ${q.priceMin.toFixed(2)} - ${q.priceMax.toFixed(2)}
                    </TableCell>
                    <TableCell className="font-bold text-foreground">
                      ${q.priceAverage.toFixed(2)} / {q.unit}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{q.unitWeightLbs} lbs</TableCell>
                    <TableCell className="font-bold text-[#28301C]">
                      ${q.pricePerLb.toFixed(2)}/lb
                    </TableCell>
                    <TableCell className="text-muted-foreground">{q.reportDate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Sub-Tab 4: University of Arizona Enterprise Budget */}
      {activeSubTab === "budget" && data && (
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                University of Arizona Enterprise Budget: {fin?.cropName}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-1">
                Source: {fin?.costDataSource} (1.0 Acre Commercial Baseline)
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-border bg-background/80 font-mono text-xs font-bold text-foreground px-3 py-1">
                Total Budget: ${fin?.totalCostPerAcre.toLocaleString()}/acre
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="flex flex-col gap-6">
            {/* Variable vs Fixed Breakdown Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Card className="border-border bg-background/60 p-4 shadow-none">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span className="font-bold uppercase tracking-wider text-foreground">Total Operating (Variable) Costs</span>
                    <span className="font-mono font-bold text-foreground">${fin?.variableCostPerAcre.toLocaleString()}/ac</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Includes seed, drip irrigation pumping electricity, water fees, fertilizers, crop protection, and harvest labor.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border bg-background/60 p-4 shadow-none">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span className="font-bold uppercase tracking-wider text-foreground">Total Ownership (Fixed) Costs</span>
                    <span className="font-mono font-bold text-foreground">${fin?.fixedCostPerAcre.toLocaleString()}/ac</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Includes machinery depreciation, land rental/opportunity cost, irrigation infrastructure amortization, and operating overhead.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Regional Agronomic Water and Labor Assumptions */}
            <Card className="border-border bg-card p-4 shadow-none">
              <CardContent className="p-0 flex flex-col gap-2 text-xs">
                <h4 className="font-bold text-foreground">Southern Arizona Regional Assumptions:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-muted-foreground">
                  <div className="rounded-lg bg-background/50 p-2.5 border border-border">
                    <span className="block font-semibold text-foreground">Irrigation System:</span>
                    <span>Surface Drip, 40 psi with filtration, 0.45 gpm/100ft</span>
                  </div>
                  <div className="rounded-lg bg-background/50 p-2.5 border border-border">
                    <span className="block font-semibold text-foreground">Water Lift / Cost:</span>
                    <span>$85.00 / acre-foot lifted from Upper Santa Cruz aquifer</span>
                  </div>
                  <div className="rounded-lg bg-background/50 p-2.5 border border-border">
                    <span className="block font-semibold text-foreground">Arizona AEWR Labor Rate:</span>
                    <span>$16.85 / hour base wage rate</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      )}

      {/* Sub-Tab 5: Cost Reduction Roadmap */}
      {activeSubTab === "cost_reduction" && data && (
        <div className="flex flex-col gap-6">
          <Alert className="border-border bg-card text-muted-foreground">
            <Lightbulb className="size-4 text-primary" />
            <AlertDescription className="text-xs">
              <strong className="text-foreground">Targeted Expense Optimization:</strong> Actionable cost reduction targets synthesized from NASA POWER environmental data (solar radiation ALLSKY_SFC_SW_DWN, precipitation deficits) and University of Arizona vegetable management trials.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {data.costReductionOpportunities.map((opp) => (
              <Card
                key={opp.id}
                className="border-border bg-card p-6 shadow-sm flex flex-col justify-between gap-4"
              >
                <CardContent className="p-0 flex flex-col gap-3">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Badge variant="outline" className="border-border bg-background/80 font-bold text-[10px] text-primary">
                        {opp.targetExpense}
                      </Badge>
                      <Badge variant="outline" className="border-[#9A7E3B]/40 bg-[#9A7E3B]/20 font-mono text-xs font-bold text-[#28301C]">
                        Save ${opp.estimatedSavingsPerAcreRange.minUsd} - ${opp.estimatedSavingsPerAcreRange.maxUsd} / acre
                      </Badge>
                    </div>
                    <h4 className="text-sm font-bold text-foreground">{opp.title}</h4>
                    <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                      <strong className="text-foreground">Why Reducible:</strong> {opp.whyReducible}
                    </p>
                    <p className="mt-2 text-xs text-foreground bg-background/50 p-2.5 rounded-lg border border-border">
                      <strong className="text-[#9A7E3B]">Recommended Action:</strong> {opp.recommendedAction}
                    </p>
                  </div>

                  <div className="border-t border-border pt-3 text-[11px] text-muted-foreground">
                    <strong className="block text-foreground mb-1">Underlying Assumptions:</strong>
                    <ul className="list-disc list-inside flex flex-col gap-0.5">
                      {opp.documentedAssumptions.map((asm, i) => (
                        <li key={i}>{asm}</li>
                      ))}
                    </ul>
                    <p className="mt-2 text-[10px] italic text-muted-foreground/80">
                      Evidence: {opp.evidenceSource}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Sub-Tab 6: AI Economic Advisor */}
      {activeSubTab === "advisor" && (
        <Card className="border-border bg-card p-6 shadow-sm">
          <CardHeader className="p-0 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="size-5 text-[#9A7E3B]" />
                <CardTitle className="text-base font-bold text-foreground">
                  AI Farm Economic Advisor
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-1">
                Synthesizes deterministic farm financial calculations with regional desert agronomy and wholesale market risks.
              </CardDescription>
            </div>

            <Button
              size="sm"
              onClick={handleGenerateAiReport}
              disabled={isGeneratingAiReport || isLoading}
              className="font-bold"
            >
              <Sparkles
                data-icon="inline-start"
                className={`size-3.5 ${isGeneratingAiReport ? "animate-spin" : ""}`}
              />
              <span>{isGeneratingAiReport ? "Analyzing Economics..." : "Generate Advisory Synthesis"}</span>
            </Button>
          </CardHeader>

          <CardContent className="p-0 flex flex-col gap-6">
            {aiError && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertDescription>{aiError}</AlertDescription>
              </Alert>
            )}

            {isGeneratingAiReport ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <RefreshCw className="size-8 text-[#9A7E3B] animate-spin mb-3" />
                <p className="text-sm font-bold text-foreground">
                  Synthesizing Economic Analysis for {fin?.cropName}...
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-md">
                  Correlating USDA AMS Phoenix wholesale quotes, University of Arizona enterprise budgets, and deterministic scenarios.
                </p>
              </div>
            ) : aiReport ? (
              <div className="flex flex-col gap-6">
                {/* Grounding Notice Banner */}
                <Alert className="border-border bg-background/80 text-foreground">
                  <CheckCircle2 className="size-4 text-[#9A7E3B] shrink-0" />
                  <div>
                    <AlertTitle className="font-semibold text-foreground">Deterministic Grounding Notice</AlertTitle>
                    <AlertDescription className="text-xs text-muted-foreground mt-0.5">
                      {aiReport.groundingNotice}
                      <span className="block text-[10px] text-muted-foreground/80 mt-1 font-mono">
                        Generated via {aiReport.provider} ({aiReport.model})
                      </span>
                    </AlertDescription>
                  </div>
                </Alert>

                {/* 5 Structured Sections */}
                <div className="grid grid-cols-1 gap-4">
                  <Card className="border-border bg-background/50 p-4 shadow-none">
                    <CardHeader className="p-0 pb-2">
                      <CardTitle className="text-sm font-bold text-foreground flex items-center gap-1.5">
                        <TrendingUp className="size-4 text-[#9A7E3B]" />
                        1. Promising Crops Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {aiReport.sections.promisingCropsSummary}
                    </CardContent>
                  </Card>

                  <Card className="border-border bg-background/50 p-4 shadow-none">
                    <CardHeader className="p-0 pb-2">
                      <CardTitle className="text-sm font-bold text-foreground flex items-center gap-1.5">
                        <ShieldAlert className="size-4 text-primary" />
                        2. Risk &amp; Concentration Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {aiReport.sections.riskAndConcentrationAnalysis}
                    </CardContent>
                  </Card>

                  <Card className="border-border bg-background/50 p-4 shadow-none">
                    <CardHeader className="p-0 pb-2">
                      <CardTitle className="text-sm font-bold text-foreground flex items-center gap-1.5">
                        <Lightbulb className="size-4 text-primary" />
                        3. Cost Reduction Roadmap
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {aiReport.sections.costReductionRoadmap}
                    </CardContent>
                  </Card>

                  <Card className="border-border bg-background/50 p-4 shadow-none">
                    <CardHeader className="p-0 pb-2">
                      <CardTitle className="text-sm font-bold text-foreground flex items-center gap-1.5">
                        <Scale className="size-4 text-muted-foreground" />
                        4. Market Sensitivity Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {aiReport.sections.marketSensitivity}
                    </CardContent>
                  </Card>

                  <Card className="border-border bg-background/50 p-4 shadow-none">
                    <CardHeader className="p-0 pb-2">
                      <CardTitle className="text-sm font-bold text-foreground flex items-center gap-1.5">
                        <HelpCircle className="size-4 text-muted-foreground" />
                        5. Missing Data &amp; Next Steps
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {aiReport.sections.missingDataAndNextSteps}
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl border border-dashed border-border p-8">
                <Sparkles className="size-8 text-muted-foreground mb-2" />
                <p className="text-sm font-bold text-foreground">
                  No AI Economic Analysis Generated Yet
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mb-4">
                  Click the button below to generate an AI evaluation of crop profitability, price volatility, and cost reductions.
                </p>
                <Button
                  size="sm"
                  onClick={handleGenerateAiReport}
                  className="font-bold"
                >
                  <Sparkles data-icon="inline-start" className="size-3.5" />
                  <span>Analyze Farm Profitability</span>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
