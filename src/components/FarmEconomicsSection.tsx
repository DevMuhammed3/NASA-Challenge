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
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-[#435133] bg-[#323D25] p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#52B788] text-[#FAF9F0]">
                <DollarSign className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold text-[#D2CF9A]">
                Farm Benefits & Profitability
              </h2>
              <span className="rounded bg-[#28301C] px-2.5 py-0.5 text-xs font-semibold text-[#9A7E3B] border border-[#435133]">
                Green Valley, AZ • 2026 Model
              </span>
            </div>
            <p className="text-xs text-[#9FA37C] max-w-3xl">
              Deterministic enterprise budgeting engine paired with USDA AMS MyMarketNews wholesale shipping point quotes (Report 2403) and University of Arizona Cooperative Extension cost baselines.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => fetchEconomicsData(true)}
              disabled={isRefreshing || isLoading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#435133] bg-[#323D25] px-3.5 py-2 text-xs font-semibold text-[#D2CF9A] transition hover:bg-[#28301C] disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-[#9A7E3B]" : ""}`} />
              <span>{isRefreshing ? "Updating Prices..." : "Refresh Market Prices"}</span>
            </button>
            <button
              onClick={handleGenerateAiReport}
              disabled={isGeneratingAiReport || isLoading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#52B788] px-4 py-2 text-xs font-bold text-[#FAF9F0] shadow-sm transition hover:bg-[#74C69D] disabled:opacity-50"
            >
              <Sparkles className={`h-3.5 w-3.5 ${isGeneratingAiReport ? "animate-spin" : ""}`} />
              <span>{isGeneratingAiReport ? "Analyzing Economics..." : "Analyze Farm Profitability"}</span>
            </button>
          </div>
        </div>

        {/* Global Controls Row */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 rounded-xl border border-[#435133] bg-[#28301C]/80 p-4">
          {/* Crop Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9FA37C] mb-1">
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
                className="w-full appearance-none rounded-lg border border-[#435133] bg-[#323D25] px-3 py-2 text-xs font-semibold text-[#D2CF9A] shadow-sm focus:border-[#52B788] focus:outline-none"
              >
                {CROPS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.category === "cool_season" ? "Cool Season" : "Warm Season"})
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-[#9FA37C]" />
            </div>
          </div>

          {/* Acreage Input */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9FA37C] mb-1">
              Cultivated Area (Acres)
            </label>
            <input
              type="number"
              min="0.1"
              max="1000"
              step="0.5"
              value={acreage}
              onChange={(e) => setAcreage(Math.max(0.1, parseFloat(e.target.value) || 1.0))}
              className="w-full rounded-lg border border-[#435133] bg-[#323D25] px-3 py-2 text-xs font-semibold text-[#D2CF9A] shadow-sm focus:border-[#52B788] focus:outline-none"
            />
          </div>

          {/* Selling Price Override ($/lb) */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9FA37C] mb-1">
              Selling Price ($/lb)
            </label>
            <input
              type="number"
              min="0.05"
              step="0.05"
              placeholder={fin ? `$${fin.sellingPricePerLb}` : "Auto"}
              value={sellingPriceOverride}
              onChange={(e) => setSellingPriceOverride(e.target.value)}
              className="w-full rounded-lg border border-[#435133] bg-[#323D25] px-3 py-2 text-xs font-semibold text-[#D2CF9A] shadow-sm placeholder:text-[#9FA37C]/50 focus:border-[#52B788] focus:outline-none"
            />
          </div>

          {/* Marketable Packout % */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#9FA37C] mb-1">
              Marketable Packout %
            </label>
            <input
              type="number"
              min="10"
              max="100"
              value={marketablePct}
              onChange={(e) => setMarketablePct(Math.min(100, Math.max(10, parseInt(e.target.value) || 85)))}
              className="w-full rounded-lg border border-[#435133] bg-[#323D25] px-3 py-2 text-xs font-semibold text-[#D2CF9A] shadow-sm focus:border-[#52B788] focus:outline-none"
            />
          </div>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="mt-4 rounded-xl border border-red-300 bg-red-50 p-3 text-xs text-red-800 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* KPI Summary Cards */}
      {fin && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {/* Card 1: Estimated Net Profit */}
          <div className="rounded-xl border border-[#435133] bg-[#323D25] p-4 shadow-sm">
            <div className="flex items-center justify-between text-[#9FA37C]">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Estimated Net Profit</span>
              <TrendingUp className="h-4 w-4 text-[#2D6A4F]" />
            </div>
            <div className="mt-2">
              <span className={`text-xl font-bold font-mono ${fin.netProfit >= 0 ? "text-[#52B788]" : "text-[#C62828]"}`}>
                ${fin.netProfit.toLocaleString()}
              </span>
              <p className="text-[10px] text-[#9FA37C] mt-0.5">
                ${fin.netProfitPerAcre.toLocaleString()}/acre ({acreage} ac)
              </p>
            </div>
          </div>

          {/* Card 2: Return on Investment */}
          <div className="rounded-xl border border-[#435133] bg-[#323D25] p-4 shadow-sm">
            <div className="flex items-center justify-between text-[#9FA37C]">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Return on Investment</span>
              <Percent className="h-4 w-4 text-[#9A7E3B]" />
            </div>
            <div className="mt-2">
              <span className={`text-xl font-bold font-mono ${fin.returnOnInvestmentPercent >= 20 ? "text-[#52B788]" : fin.returnOnInvestmentPercent >= 0 ? "text-[#9A7E3B]" : "text-[#C62828]"}`}>
                {fin.returnOnInvestmentPercent}%
              </span>
              <p className="text-[10px] text-[#9FA37C] mt-0.5">
                Gross Margin: {fin.grossMarginPercent}%
              </p>
            </div>
          </div>

          {/* Card 3: Gross Revenue */}
          <div className="rounded-xl border border-[#435133] bg-[#323D25] p-4 shadow-sm">
            <div className="flex items-center justify-between text-[#9FA37C]">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Gross Revenue</span>
              <DollarSign className="h-4 w-4 text-[#2D6A4F]" />
            </div>
            <div className="mt-2">
              <span className="text-xl font-bold font-mono text-[#D2CF9A]">
                ${fin.grossRevenue.toLocaleString()}
              </span>
              <p className="text-[10px] text-[#9FA37C] mt-0.5">
                {fin.marketableYieldLbs.toLocaleString()} lbs @ ${fin.sellingPricePerLb}/lb
              </p>
            </div>
          </div>

          {/* Card 4: Total Production Cost */}
          <div className="rounded-xl border border-[#435133] bg-[#323D25] p-4 shadow-sm">
            <div className="flex items-center justify-between text-[#9FA37C]">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Total Production Cost</span>
              <Layers className="h-4 w-4 text-[#9A7E3B]" />
            </div>
            <div className="mt-2">
              <span className="text-xl font-bold font-mono text-[#D2CF9A]">
                ${fin.totalProductionCosts.toLocaleString()}
              </span>
              <p className="text-[10px] text-[#9FA37C] mt-0.5">
                ${fin.totalCostPerAcre.toLocaleString()}/acre total
              </p>
            </div>
          </div>

          {/* Card 5: Break-Even Selling Price */}
          <div className="rounded-xl border border-[#435133] bg-[#323D25] p-4 shadow-sm">
            <div className="flex items-center justify-between text-[#9FA37C]">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Break-Even Price</span>
              <Scale className="h-4 w-4 text-[#D2CF9A]" />
            </div>
            <div className="mt-2">
              <span className="text-xl font-bold font-mono text-[#D2CF9A]">
                ${fin.breakEvenSellingPricePerLb}
              </span>
              <p className="text-[10px] text-[#9FA37C] mt-0.5">
                Margin: {fin.breakEvenSafetyMarginPercent}% buffer
              </p>
            </div>
          </div>

          {/* Card 6: Break-Even Yield */}
          <div className="rounded-xl border border-[#435133] bg-[#323D25] p-4 shadow-sm">
            <div className="flex items-center justify-between text-[#9FA37C]">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Break-Even Yield</span>
              <Sliders className="h-4 w-4 text-[#D2CF9A]" />
            </div>
            <div className="mt-2">
              <span className="text-xl font-bold font-mono text-[#D2CF9A]">
                {fin.breakEvenYieldLbsPerAcre.toLocaleString()}
              </span>
              <p className="text-[10px] text-[#9FA37C] mt-0.5">
                lbs/acre needed to cover costs
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#435133] pb-2">
        <button
          onClick={() => setActiveSubTab("comparison")}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
            activeSubTab === "comparison"
              ? "bg-[#9A7E3B] text-[#28301C] shadow-sm"
              : "text-[#D2CF9A] hover:bg-[#435133]"
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>15-Crop Profitability Comparison</span>
        </button>

        <button
          onClick={() => setActiveSubTab("scenarios")}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
            activeSubTab === "scenarios"
              ? "bg-[#9A7E3B] text-[#28301C] shadow-sm"
              : "text-[#D2CF9A] hover:bg-[#435133]"
          }`}
        >
          <Scale className="h-3.5 w-3.5" />
          <span>3-Tier Scenario Modeler</span>
        </button>

        <button
          onClick={() => setActiveSubTab("market_prices")}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
            activeSubTab === "market_prices"
              ? "bg-[#9A7E3B] text-[#28301C] shadow-sm"
              : "text-[#D2CF9A] hover:bg-[#435133]"
          }`}
        >
          <DollarSign className="h-3.5 w-3.5" />
          <span>USDA Phoenix Wholesale Quotes</span>
        </button>

        <button
          onClick={() => setActiveSubTab("budget")}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
            activeSubTab === "budget"
              ? "bg-[#9A7E3B] text-[#28301C] shadow-sm"
              : "text-[#D2CF9A] hover:bg-[#435133]"
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>UA Extension Cost Budget</span>
        </button>

        <button
          onClick={() => setActiveSubTab("cost_reduction")}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
            activeSubTab === "cost_reduction"
              ? "bg-[#9A7E3B] text-[#28301C] shadow-sm"
              : "text-[#D2CF9A] hover:bg-[#435133]"
          }`}
        >
          <Lightbulb className="h-3.5 w-3.5" />
          <span>Cost Reduction Roadmap</span>
        </button>

        <button
          onClick={() => setActiveSubTab("advisor")}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
            activeSubTab === "advisor"
              ? "bg-[#52B788] text-[#28301C] shadow-sm"
              : "text-[#74C69D] hover:bg-[#435133]"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>AI Economic Advisor</span>
        </button>
      </div>

      {/* Sub-Tab 1: 15-Crop Profitability Comparison */}
      {activeSubTab === "comparison" && data && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#435133] bg-[#323D25] p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-bold text-[#D2CF9A]">
                  Deterministic 15-Crop Economic Ranking (1-Acre Basis)
                </h3>
                <p className="text-xs text-[#9FA37C]">
                  Crops ranked strictly by net profit per acre, synthesized from University of Arizona Cooperative Extension enterprise budgets and USDA AMS Phoenix Shipping Point wholesale prices.
                </p>
              </div>
              <span className="rounded bg-[#28301C] px-3 py-1 font-mono text-[11px] text-[#D2CF9A] border border-[#435133]">
                Currency: USD ($)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[#435133] bg-[#28301C]/60 text-[#D2CF9A]">
                    <th className="py-2.5 px-3 font-bold">Crop</th>
                    <th className="py-2.5 px-3 font-bold">Season</th>
                    <th className="py-2.5 px-3 font-bold">Wholesale Price</th>
                    <th className="py-2.5 px-3 font-bold">Yield / Acre</th>
                    <th className="py-2.5 px-3 font-bold">Gross Revenue</th>
                    <th className="py-2.5 px-3 font-bold">Total Cost</th>
                    <th className="py-2.5 px-3 font-bold">Net Profit / Acre</th>
                    <th className="py-2.5 px-3 font-bold">ROI %</th>
                    <th className="py-2.5 px-3 font-bold">Break-Even Price</th>
                    <th className="py-2.5 px-3 font-bold">Risk Level</th>
                    <th className="py-2.5 px-3 font-bold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#B8B478]/40 font-mono">
                  {data.cropComparison.map((item) => (
                    <tr
                      key={item.cropId}
                      className={`hover:bg-[#28301C]/50 transition ${
                        item.cropId === selectedCropId ? "bg-[#28301C]/70 font-semibold" : ""
                      }`}
                    >
                      <td className="py-2.5 px-3 font-sans font-bold text-[#D2CF9A]">
                        {item.cropName}
                        {item.cropId === selectedCropId && (
                          <span className="ml-1.5 rounded bg-[#52B788] px-1.5 py-0.5 text-[9px] font-sans font-bold text-[#FAF9F0]">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-semibold border ${
                            item.category === "cool_season"
                              ? "bg-blue-50 text-blue-800 border-blue-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}
                        >
                          {item.category === "cool_season" ? "Cool Season" : "Warm Season"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[#D2CF9A]">
                        ${item.marketPricePerLb.toFixed(2)}/lb
                      </td>
                      <td className="py-2.5 px-3 text-[#9FA37C]">
                        {item.yieldPerAcreLbs.toLocaleString()} lbs
                      </td>
                      <td className="py-2.5 px-3 text-[#D2CF9A]">
                        ${item.revenuePerAcre.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-[#9FA37C]">
                        ${item.costPerAcre.toLocaleString()}
                      </td>
                      <td
                        className={`py-2.5 px-3 font-bold ${
                          item.netProfitPerAcre >= 0 ? "text-[#52B788]" : "text-[#C62828]"
                        }`}
                      >
                        ${item.netProfitPerAcre.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-[#D2CF9A]">{item.roiPercent}%</td>
                      <td className="py-2.5 px-3 text-[#9FA37C]">
                        ${item.breakEvenPricePerLb.toFixed(2)}/lb
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold border ${
                            item.financialRiskLevel === "Low"
                              ? "bg-[#52B788]/20 text-[#52B788] border-[#A5D6A7]"
                              : item.financialRiskLevel === "Moderate"
                              ? "bg-[#FFF8E1] text-[#9A7E3B] border-[#FFE082]"
                              : "bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2]"
                          }`}
                        >
                          {item.financialRiskLevel} Risk
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <button
                          onClick={() => {
                            setSelectedCropId(item.cropId);
                            setSellingPriceOverride("");
                            setYieldOverride("");
                          }}
                          className="rounded border border-[#435133] bg-[#323D25] px-2 py-1 text-[11px] font-semibold text-[#D2CF9A] hover:bg-[#28301C]"
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Scenario Modeler */}
      {activeSubTab === "scenarios" && scenarios && (
        <div className="space-y-6">
          <div className="rounded-xl border border-[#435133] bg-[#323D25] p-4 text-xs text-[#9FA37C]">
            <strong className="text-[#D2CF9A]">Scenario Methodology Notice:</strong> GAIA calculates 3 deterministic scenarios for {fin?.cropName} on {acreage} acres. Multipliers reflect empirical agricultural volatility in Southern Arizona (Sonoran Desert heat waves, groundwater pumping spikes, and Mexican/California wholesale supply surges).
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Conservative Card */}
            <div className="rounded-2xl border-2 border-[#FFE082] bg-[#323D25] p-6 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="rounded bg-[#FFF8E1] px-2.5 py-1 text-xs font-bold text-[#9A7E3B] border border-[#FFE082]">
                    Conservative Stress Test
                  </span>
                  <ShieldAlert className="h-4 w-4 text-[#9A7E3B]" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-[#D2CF9A]">
                    ${scenarios.conservative.results.netProfit.toLocaleString()}
                  </h4>
                  <p className="text-xs text-[#9FA37C]">
                    Net Profit (${scenarios.conservative.results.netProfitPerAcre.toLocaleString()}/ac)
                  </p>
                </div>

                <div className="space-y-1.5 border-t border-[#435133]/60 pt-3 text-xs font-mono">
                  <div className="flex justify-between text-[#9FA37C]">
                    <span>Yield Multiplier:</span>
                    <span className="font-bold text-[#C62828]">0.80 (-20%)</span>
                  </div>
                  <div className="flex justify-between text-[#9FA37C]">
                    <span>Wholesale Price:</span>
                    <span className="font-bold text-[#C62828]">${scenarios.conservative.results.sellingPricePerLb}/lb (-15%)</span>
                  </div>
                  <div className="flex justify-between text-[#9FA37C]">
                    <span>Operating Cost:</span>
                    <span className="font-bold text-[#C62828]">+10% Pumping</span>
                  </div>
                  <div className="flex justify-between text-[#9FA37C]">
                    <span>Gross Revenue:</span>
                    <span className="font-bold text-[#D2CF9A]">${scenarios.conservative.results.grossRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[#9FA37C]">
                    <span>Total Costs:</span>
                    <span className="font-bold text-[#D2CF9A]">${scenarios.conservative.results.totalProductionCosts.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[#9FA37C]">
                    <span>Break-Even Price:</span>
                    <span className="font-bold text-[#D2CF9A]">${scenarios.conservative.results.breakEvenSellingPricePerLb}/lb</span>
                  </div>
                  <div className="flex justify-between text-[#9FA37C]">
                    <span>ROI:</span>
                    <span className="font-bold text-[#9A7E3B]">{scenarios.conservative.results.returnOnInvestmentPercent}%</span>
                  </div>
                </div>

                <div className="border-t border-[#435133]/60 pt-3">
                  <p className="text-[11px] font-bold text-[#D2CF9A] mb-1">Documented Assumptions:</p>
                  <ul className="space-y-1 text-[11px] text-[#9FA37C] list-disc list-inside">
                    {scenarios.conservative.documentedAssumptions.map((asm, i) => (
                      <li key={i}>{asm}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Expected Baseline Card */}
            <div className="rounded-2xl border-2 border-[#2D6A4F] bg-[#323D25] p-6 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="rounded bg-[#52B788]/20 px-2.5 py-1 text-xs font-bold text-[#52B788] border border-[#A5D6A7]">
                    Expected Extension Baseline
                  </span>
                  <CheckCircle2 className="h-4 w-4 text-[#52B788]" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-[#52B788]">
                    ${scenarios.expected.results.netProfit.toLocaleString()}
                  </h4>
                  <p className="text-xs text-[#9FA37C]">
                    Net Profit (${scenarios.expected.results.netProfitPerAcre.toLocaleString()}/ac)
                  </p>
                </div>

                <div className="space-y-1.5 border-t border-[#435133]/60 pt-3 text-xs font-mono">
                  <div className="flex justify-between text-[#9FA37C]">
                    <span>Yield Multiplier:</span>
                    <span className="font-bold text-[#D2CF9A]">1.00 (Standard)</span>
                  </div>
                  <div className="flex justify-between text-[#9FA37C]">
                    <span>Wholesale Price:</span>
                    <span className="font-bold text-[#D2CF9A]">${scenarios.expected.results.sellingPricePerLb}/lb (Phoenix Mid)</span>
                  </div>
                  <div className="flex justify-between text-[#9FA37C]">
                    <span>Operating Cost:</span>
                    <span className="font-bold text-[#D2CF9A]">1.00 (UA Budget)</span>
                  </div>
                  <div className="flex justify-between text-[#9FA37C]">
                    <span>Gross Revenue:</span>
                    <span className="font-bold text-[#D2CF9A]">${scenarios.expected.results.grossRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[#9FA37C]">
                    <span>Total Costs:</span>
                    <span className="font-bold text-[#D2CF9A]">${scenarios.expected.results.totalProductionCosts.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[#9FA37C]">
                    <span>Break-Even Price:</span>
                    <span className="font-bold text-[#D2CF9A]">${scenarios.expected.results.breakEvenSellingPricePerLb}/lb</span>
                  </div>
                  <div className="flex justify-between text-[#9FA37C]">
                    <span>ROI:</span>
                    <span className="font-bold text-[#52B788]">{scenarios.expected.results.returnOnInvestmentPercent}%</span>
                  </div>
                </div>

                <div className="border-t border-[#435133]/60 pt-3">
                  <p className="text-[11px] font-bold text-[#D2CF9A] mb-1">Documented Assumptions:</p>
                  <ul className="space-y-1 text-[11px] text-[#9FA37C] list-disc list-inside">
                    {scenarios.expected.documentedAssumptions.map((asm, i) => (
                      <li key={i}>{asm}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Optimistic Card */}
            <div className="rounded-2xl border-2 border-emerald-400 bg-[#323D25] p-6 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="rounded bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-900 border border-emerald-300">
                    Optimistic Premium Practice
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-emerald-800" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-[#52B788]">
                    ${scenarios.optimistic.results.netProfit.toLocaleString()}
                  </h4>
                  <p className="text-xs text-[#9FA37C]">
                    Net Profit (${scenarios.optimistic.results.netProfitPerAcre.toLocaleString()}/ac)
                  </p>
                </div>

                <div className="space-y-1.5 border-t border-[#435133]/60 pt-3 text-xs font-mono">
                  <div className="flex justify-between text-[#9FA37C]">
                    <span>Yield Multiplier:</span>
                    <span className="font-bold text-[#52B788]">1.18 (+18%)</span>
                  </div>
                  <div className="flex justify-between text-[#9FA37C]">
                    <span>Wholesale Price:</span>
                    <span className="font-bold text-[#52B788]">${scenarios.optimistic.results.sellingPricePerLb}/lb (+15%)</span>
                  </div>
                  <div className="flex justify-between text-[#9FA37C]">
                    <span>Operating Cost:</span>
                    <span className="font-bold text-[#52B788]">-8% Efficiency</span>
                  </div>
                  <div className="flex justify-between text-[#9FA37C]">
                    <span>Gross Revenue:</span>
                    <span className="font-bold text-[#D2CF9A]">${scenarios.optimistic.results.grossRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[#9FA37C]">
                    <span>Total Costs:</span>
                    <span className="font-bold text-[#D2CF9A]">${scenarios.optimistic.results.totalProductionCosts.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[#9FA37C]">
                    <span>Break-Even Price:</span>
                    <span className="font-bold text-[#D2CF9A]">${scenarios.optimistic.results.breakEvenSellingPricePerLb}/lb</span>
                  </div>
                  <div className="flex justify-between text-[#9FA37C]">
                    <span>ROI:</span>
                    <span className="font-bold text-[#52B788]">{scenarios.optimistic.results.returnOnInvestmentPercent}%</span>
                  </div>
                </div>

                <div className="border-t border-[#435133]/60 pt-3">
                  <p className="text-[11px] font-bold text-[#D2CF9A] mb-1">Documented Assumptions:</p>
                  <ul className="space-y-1 text-[11px] text-[#9FA37C] list-disc list-inside">
                    {scenarios.optimistic.documentedAssumptions.map((asm, i) => (
                      <li key={i}>{asm}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 3: USDA Phoenix Market Prices */}
      {activeSubTab === "market_prices" && data && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#435133] bg-[#323D25] p-6 shadow-sm">
            {/* Transparency Callout */}
            <div className="mb-4 rounded-xl border border-[#435133] bg-[#28301C] p-4 text-xs text-[#D2CF9A]">
              <div className="flex items-start gap-2.5">
                <HelpCircle className="h-5 w-5 text-[#9A7E3B] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <strong className="font-bold">Market Price Transparency Disclosure:</strong>
                  <p className="text-[#9FA37C]">
                    {data.marketReport.transparencyNotice}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-mono text-[#9FA37C]">
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
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[#435133] bg-[#28301C]/60 text-[#D2CF9A]">
                    <th className="py-2.5 px-3 font-bold">Commodity</th>
                    <th className="py-2.5 px-3 font-bold">Package & Specification</th>
                    <th className="py-2.5 px-3 font-bold">Grade</th>
                    <th className="py-2.5 px-3 font-bold">Price Range ($)</th>
                    <th className="py-2.5 px-3 font-bold">Average Quote</th>
                    <th className="py-2.5 px-3 font-bold">Unit Weight</th>
                    <th className="py-2.5 px-3 font-bold">Price / Lb</th>
                    <th className="py-2.5 px-3 font-bold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#B8B478]/40 font-mono">
                  {data.marketReport.quotes.map((q, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-[#28301C]/50 transition ${
                        q.matchedCropId === selectedCropId ? "bg-[#28301C]/70 font-semibold" : ""
                      }`}
                    >
                      <td className="py-2.5 px-3 font-sans font-bold text-[#D2CF9A]">
                        {q.commodity}
                        {q.variety && <span className="block text-[10px] font-normal text-[#9FA37C]">{q.variety}</span>}
                      </td>
                      <td className="py-2.5 px-3 font-sans text-[#9FA37C]">{q.package}</td>
                      <td className="py-2.5 px-3 font-sans text-[#D2CF9A]">{q.grade}</td>
                      <td className="py-2.5 px-3 text-[#9FA37C]">
                        ${q.priceMin.toFixed(2)} - ${q.priceMax.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-[#D2CF9A]">
                        ${q.priceAverage.toFixed(2)} / {q.unit}
                      </td>
                      <td className="py-2.5 px-3 text-[#9FA37C]">{q.unitWeightLbs} lbs</td>
                      <td className="py-2.5 px-3 font-bold text-[#52B788]">
                        ${q.pricePerLb.toFixed(2)}/lb
                      </td>
                      <td className="py-2.5 px-3 text-[#9FA37C]">{q.reportDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 4: University of Arizona Enterprise Budget */}
      {activeSubTab === "budget" && data && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#435133] bg-[#323D25] p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-base font-bold text-[#D2CF9A]">
                  University of Arizona Enterprise Budget: {fin?.cropName}
                </h3>
                <p className="text-xs text-[#9FA37C]">
                  Source: {fin?.costDataSource} (1.0 Acre Commercial Baseline)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-[#28301C] px-3 py-1 font-mono text-[11px] font-bold text-[#D2CF9A] border border-[#435133]">
                  Total Budget: ${fin?.totalCostPerAcre.toLocaleString()}/acre
                </span>
              </div>
            </div>

            {/* Variable vs Fixed Breakdown Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-6">
              <div className="rounded-xl border border-[#435133] bg-[#28301C]/60 p-4">
                <div className="flex items-center justify-between text-xs text-[#9FA37C] mb-1">
                  <span className="font-bold uppercase tracking-wider text-[#D2CF9A]">Total Operating (Variable) Costs</span>
                  <span className="font-mono font-bold text-[#D2CF9A]">${fin?.variableCostPerAcre.toLocaleString()}/ac</span>
                </div>
                <p className="text-[11px] text-[#9FA37C]">
                  Includes seed, drip irrigation pumping electricity, water fees, fertilizers, crop protection, and harvest labor.
                </p>
              </div>

              <div className="rounded-xl border border-[#435133] bg-[#28301C]/60 p-4">
                <div className="flex items-center justify-between text-xs text-[#9FA37C] mb-1">
                  <span className="font-bold uppercase tracking-wider text-[#D2CF9A]">Total Ownership (Fixed) Costs</span>
                  <span className="font-mono font-bold text-[#D2CF9A]">${fin?.fixedCostPerAcre.toLocaleString()}/ac</span>
                </div>
                <p className="text-[11px] text-[#9FA37C]">
                  Includes machinery depreciation, land rental/opportunity cost, irrigation infrastructure amortization, and operating overhead.
                </p>
              </div>
            </div>

            {/* Regional Agronomic Water and Labor Assumptions */}
            <div className="rounded-xl border border-[#435133] bg-[#323D25] p-4 text-xs space-y-2">
              <h4 className="font-bold text-[#D2CF9A]">Southern Arizona Regional Assumptions:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[#9FA37C]">
                <div className="rounded bg-[#28301C]/50 p-2.5 border border-[#435133]/70">
                  <span className="block font-semibold text-[#D2CF9A]">Irrigation System:</span>
                  <span>Surface Drip, 40 psi with filtration, 0.45 gpm/100ft</span>
                </div>
                <div className="rounded bg-[#28301C]/50 p-2.5 border border-[#435133]/70">
                  <span className="block font-semibold text-[#D2CF9A]">Water Lift / Cost:</span>
                  <span>$85.00 / acre-foot lifted from Upper Santa Cruz aquifer</span>
                </div>
                <div className="rounded bg-[#28301C]/50 p-2.5 border border-[#435133]/70">
                  <span className="block font-semibold text-[#D2CF9A]">Arizona AEWR Labor Rate:</span>
                  <span>$16.85 / hour base wage rate</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 5: Cost Reduction Roadmap */}
      {activeSubTab === "cost_reduction" && data && (
        <div className="space-y-6">
          <div className="rounded-xl border border-[#435133] bg-[#323D25] p-4 text-xs text-[#9FA37C]">
            <strong className="text-[#D2CF9A]">Targeted Expense Optimization:</strong> Actionable cost reduction targets synthesized from NASA POWER environmental data (solar radiation ALLSKY_SFC_SW_DWN, precipitation deficits) and University of Arizona vegetable management trials.
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {data.costReductionOpportunities.map((opp) => (
              <div
                key={opp.id}
                className="rounded-2xl border border-[#435133] bg-[#323D25] p-6 shadow-sm flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="rounded bg-[#28301C] px-2.5 py-0.5 text-[10px] font-bold text-[#9A7E3B] border border-[#435133]">
                      {opp.targetExpense}
                    </span>
                    <span className="rounded bg-[#52B788]/20 px-2.5 py-0.5 text-xs font-mono font-bold text-[#52B788] border border-[#A5D6A7]">
                      Save ${opp.estimatedSavingsPerAcreRange.minUsd} - ${opp.estimatedSavingsPerAcreRange.maxUsd} / acre
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#D2CF9A]">{opp.title}</h4>
                  <p className="mt-1.5 text-xs text-[#9FA37C] leading-relaxed">
                    <strong className="text-[#D2CF9A]">Why Reducible:</strong> {opp.whyReducible}
                  </p>
                  <p className="mt-2 text-xs text-[#D2CF9A] bg-[#28301C]/50 p-2.5 rounded-lg border border-[#435133]/70">
                    <strong className="text-[#52B788]">Recommended Action:</strong> {opp.recommendedAction}
                  </p>
                </div>

                <div className="border-t border-[#435133]/60 pt-3 text-[11px] text-[#9FA37C]">
                  <strong className="block text-[#D2CF9A] mb-1">Underlying Assumptions:</strong>
                  <ul className="list-disc list-inside space-y-0.5">
                    {opp.documentedAssumptions.map((asm, i) => (
                      <li key={i}>{asm}</li>
                    ))}
                  </ul>
                  <p className="mt-2 text-[10px] italic text-[#9FA37C]/80">
                    Evidence: {opp.evidenceSource}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-Tab 6: AI Economic Advisor */}
      {activeSubTab === "advisor" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#435133] bg-[#323D25] p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-[#2D6A4F]" />
                  <h3 className="text-base font-bold text-[#D2CF9A]">
                    AI Farm Economic Advisor
                  </h3>
                </div>
                <p className="text-xs text-[#9FA37C] mt-1">
                  Synthesizes deterministic farm financial calculations with regional desert agronomy and wholesale market risks.
                </p>
              </div>

              <button
                onClick={handleGenerateAiReport}
                disabled={isGeneratingAiReport || isLoading}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#52B788] px-4 py-2 text-xs font-bold text-[#FAF9F0] shadow-sm transition hover:bg-[#74C69D] disabled:opacity-50"
              >
                <Sparkles className={`h-3.5 w-3.5 ${isGeneratingAiReport ? "animate-spin" : ""}`} />
                <span>{isGeneratingAiReport ? "Analyzing Economics..." : "Generate Advisory Synthesis"}</span>
              </button>
            </div>

            {aiError && (
              <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-xs text-red-800 flex items-center gap-2 mb-6">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{aiError}</span>
              </div>
            )}

            {isGeneratingAiReport ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <RefreshCw className="h-8 w-8 text-[#2D6A4F] animate-spin mb-3" />
                <p className="text-sm font-bold text-[#D2CF9A]">
                  Synthesizing Economic Analysis for {fin?.cropName}...
                </p>
                <p className="text-xs text-[#9FA37C] mt-1 max-w-md">
                  Correlating USDA AMS Phoenix wholesale quotes, University of Arizona enterprise budgets, and deterministic scenarios.
                </p>
              </div>
            ) : aiReport ? (
              <div className="space-y-6">
                {/* Grounding Notice Banner */}
                <div className="rounded-xl border border-[#435133] bg-[#28301C] p-3 text-xs text-[#D2CF9A] flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#52B788] shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold">Deterministic Grounding Notice:</strong>{" "}
                    {aiReport.groundingNotice}
                    <div className="text-[10px] text-[#9FA37C] mt-0.5 font-mono">
                      Generated via {aiReport.provider} ({aiReport.model})
                    </div>
                  </div>
                </div>

                {/* 5 Structured Sections */}
                <div className="space-y-4">
                  <div className="rounded-xl border border-[#435133] bg-[#323D25] p-4">
                    <h4 className="text-sm font-bold text-[#D2CF9A] mb-2 flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 text-[#2D6A4F]" />
                      1. Promising Crops Summary
                    </h4>
                    <div className="text-xs text-[#9FA37C] leading-relaxed whitespace-pre-wrap">
                      {aiReport.sections.promisingCropsSummary}
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#435133] bg-[#323D25] p-4">
                    <h4 className="text-sm font-bold text-[#D2CF9A] mb-2 flex items-center gap-1.5">
                      <ShieldAlert className="h-4 w-4 text-[#9A7E3B]" />
                      2. Risk & Concentration Analysis
                    </h4>
                    <div className="text-xs text-[#9FA37C] leading-relaxed whitespace-pre-wrap">
                      {aiReport.sections.riskAndConcentrationAnalysis}
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#435133] bg-[#323D25] p-4">
                    <h4 className="text-sm font-bold text-[#D2CF9A] mb-2 flex items-center gap-1.5">
                      <Lightbulb className="h-4 w-4 text-[#9A7E3B]" />
                      3. Cost Reduction Roadmap
                    </h4>
                    <div className="text-xs text-[#9FA37C] leading-relaxed whitespace-pre-wrap">
                      {aiReport.sections.costReductionRoadmap}
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#435133] bg-[#323D25] p-4">
                    <h4 className="text-sm font-bold text-[#D2CF9A] mb-2 flex items-center gap-1.5">
                      <Scale className="h-4 w-4 text-[#D2CF9A]" />
                      4. Market Sensitivity Analysis
                    </h4>
                    <div className="text-xs text-[#9FA37C] leading-relaxed whitespace-pre-wrap">
                      {aiReport.sections.marketSensitivity}
                    </div>
                  </div>

                  <div className="rounded-xl border border-[#435133] bg-[#323D25] p-4">
                    <h4 className="text-sm font-bold text-[#D2CF9A] mb-2 flex items-center gap-1.5">
                      <HelpCircle className="h-4 w-4 text-[#9FA37C]" />
                      5. Missing Data & Next Steps
                    </h4>
                    <div className="text-xs text-[#9FA37C] leading-relaxed whitespace-pre-wrap">
                      {aiReport.sections.missingDataAndNextSteps}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl border border-dashed border-[#435133] p-8">
                <Sparkles className="h-8 w-8 text-[#9FA37C] mb-2" />
                <p className="text-sm font-bold text-[#D2CF9A]">
                  No AI Economic Analysis Generated Yet
                </p>
                <p className="text-xs text-[#9FA37C] mt-1 max-w-sm mb-4">
                  Click the button below to generate an AI evaluation of crop profitability, price volatility, and cost reductions.
                </p>
                <button
                  onClick={handleGenerateAiReport}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#52B788] px-4 py-2 text-xs font-bold text-[#FAF9F0] shadow-sm hover:bg-[#74C69D]"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Analyze Farm Profitability</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
