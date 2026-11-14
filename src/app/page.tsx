"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Compass,
  Sprout,
  TrendingUp,
  Satellite,
  Sparkles,
  Database,
  RefreshCw,
  MapPin,
  AlertCircle,
  Radio,
  ArrowRight,
  DollarSign,
} from "lucide-react";
import { GaiaLogo } from "@/components/GaiaLogo";
import { NasaInteractiveMap } from "@/components/NasaInteractiveMap";
import { DashboardMetrics } from "@/components/DashboardMetrics";
import { HistoricalDataSection } from "@/components/HistoricalDataSection";
import { DataSourcesPanel } from "@/components/DataSourcesPanel";
import { AiAdvisorSection } from "@/components/AiAdvisorSection";
import { CropRecommendationsSection } from "@/components/CropRecommendationsSection";
import { FarmEconomicsSection } from "@/components/FarmEconomicsSection";
import { GREEN_VALLEY_LOCATION } from "@/lib/config/location";
import type {
  EnvironmentalDataResponse,
  ProviderStatusItem,
} from "@/lib/types/environmental";

type ActiveTab =
  | "dashboard"
  | "crops"
  | "historical"
  | "economics"
  | "advisor"
  | "providers";

export default function GaiaApp() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");

  // Data states (Fixed strictly to Green Valley, AZ for MVP phase)
  const [telemetry, setTelemetry] = useState<EnvironmentalDataResponse | null>(null);
  const [providers, setProviders] = useState<ProviderStatusItem[]>([
    {
      id: "nasa_power",
      name: "NASA POWER",
      category: "Climatology & Soil Moisture",
      status: "Connected",
      message: "Daily Point API initialized.",
      dataProvided: "Climate and soil moisture (10 parameters)",
      lastChecked: new Date().toISOString(),
    },
    {
      id: "nasa_gibs",
      name: "NASA GIBS",
      category: "Satellite Imagery (WMTS)",
      status: "Connected",
      message: "WMTS Tile service active.",
      dataProvided: "MODIS Terra True Color, NDVI (8-Day), Land Cover (Annual)",
      lastChecked: new Date().toISOString(),
    },
    {
      id: "google_geocoding",
      name: "Google Geocoding",
      category: "Location Resolution",
      status: "Missing",
      message: "API key missing. Fixed prototype location active.",
      dataProvided: "Location resolution",
      lastChecked: new Date().toISOString(),
    },
    {
      id: "gemini_ai",
      name: "Google Gemini AI (gemini-2.5-flash)",
      category: "AI Environmental Advisor",
      status: "Configured",
      message: "Ready for telemetry synthesis.",
      dataProvided: "Environmental conditions, opportunities, risks & recommendations",
      lastChecked: new Date().toISOString(),
    },
    {
      id: "ollama_ai",
      name: "Ollama AI (llama3.3)",
      category: "Alternative AI Advisor",
      status: "Configured",
      message: "Ollama API key configured.",
      dataProvided: "Alternative LLM environmental advisor synthesis",
      lastChecked: new Date().toISOString(),
    },
  ]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch telemetry from NASA POWER for Green Valley, AZ
  const fetchTelemetry = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setErrorMsg(null);

    try {
      const queryParams = new URLSearchParams({
        lat: String(GREEN_VALLEY_LOCATION.latitude),
        lon: String(GREEN_VALLEY_LOCATION.longitude),
        name: GREEN_VALLEY_LOCATION.name,
        refresh: forceRefresh ? "true" : "false",
      });

      const res = await fetch(`/api/power?${queryParams.toString()}`);
      const data = await res.json();

      if (res.ok && data.status === "Success") {
        setTelemetry(data);
      } else {
        setErrorMsg(data.error || "Failed to load NASA POWER telemetry.");
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Network error fetching NASA POWER"
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Fetch provider status check
  const fetchProviderStatuses = useCallback(async () => {
    try {
      const res = await fetch("/api/providers");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.providers)) {
          setProviders(data.providers);
        }
      }
    } catch (err) {
      console.warn("Provider status check error:", err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchTelemetry();
    fetchProviderStatuses();
  }, [fetchTelemetry, fetchProviderStatuses]);

  const powerStatus =
    providers.find((p) => p.id === "nasa_power")?.status === "Connected"
      ? "Connected"
      : isLoading
      ? "Loading"
      : "Error";

  const geminiAvailable =
    providers.find((p) => p.id === "gemini_ai")?.status === "Configured" ||
    providers.find((p) => p.id === "ollama_ai")?.status === "Configured";

  return (
    <div className="min-h-screen bg-[#28301C] text-[#D2CF9A] flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-[#435133] bg-[#28301C]/95 backdrop-blur-md text-[#D2CF9A] shadow-xs">
        <div className="mx-auto max-w-[1440px] px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-4">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <GaiaLogo size={38} />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-lg font-bold tracking-tight text-[#D2CF9A]">
                  GAIA
                </span>
                <span className="rounded bg-[#9A7E3B]/20 px-2 py-0.5 text-[10px] font-semibold text-[#D2CF9A] border border-[#9A7E3B]/40">
                  Green Valley, AZ MVP
                </span>
              </div>
              <p className="text-[11px] text-[#9FA37C]">
                NASA Environmental Intelligence &amp; AI Crop Advisor
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex flex-wrap items-center gap-1 rounded-xl border border-[#435133] bg-[#323D25] p-1 text-xs">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                activeTab === "dashboard"
                  ? "bg-[#9A7E3B] font-bold text-[#28301C] shadow-sm"
                  : "text-[#D2CF9A] hover:bg-[#435133]/50 hover:text-[#9A7E3B]"
              }`}
            >
              <Compass className="h-3.5 w-3.5" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("crops")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                activeTab === "crops"
                  ? "bg-[#52B788] font-bold text-[#28301C] shadow-sm"
                  : "text-[#74C69D] hover:bg-[#435133]/50 hover:text-[#52B788]"
              }`}
            >
              <Sprout className="h-3.5 w-3.5" />
              Crop Recommendations
            </button>
            <button
              onClick={() => setActiveTab("historical")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                activeTab === "historical"
                  ? "bg-[#9A7E3B] font-bold text-[#28301C] shadow-sm"
                  : "text-[#D2CF9A] hover:bg-[#435133]/50 hover:text-[#9A7E3B]"
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              Historical Data (5-Year)
            </button>
            <button
              onClick={() => setActiveTab("economics")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                activeTab === "economics"
                  ? "bg-[#52B788] font-bold text-[#28301C] shadow-sm"
                  : "text-[#74C69D] hover:bg-[#435133]/50 hover:text-[#52B788]"
              }`}
            >
              <DollarSign className="h-3.5 w-3.5" />
              Farm Benefits & Profitability
            </button>
            <button
              onClick={() => setActiveTab("advisor")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                activeTab === "advisor"
                  ? "bg-[#9A7E3B] font-bold text-[#28301C] shadow-sm"
                  : "text-[#D2CF9A] hover:bg-[#435133]/50 hover:text-[#9A7E3B]"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              AI Advisor
            </button>
            <button
              onClick={() => setActiveTab("providers")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                activeTab === "providers"
                  ? "bg-[#9A7E3B] font-bold text-[#28301C] shadow-sm"
                  : "text-[#D2CF9A] hover:bg-[#435133]/50 hover:text-[#9A7E3B]"
              }`}
            >
              <Database className="h-3.5 w-3.5" />
              Data Sources
            </button>
          </nav>

          {/* Refresh Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchTelemetry(true)}
              disabled={isRefreshing || isLoading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#435133] bg-[#323D25] px-3 py-1.5 text-xs font-semibold text-[#D2CF9A] transition hover:border-[#9A7E3B] hover:text-[#9A7E3B] disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${
                  isRefreshing ? "animate-spin text-[#9A7E3B]" : ""
                }`}
              />
              <span>{isRefreshing ? "Refreshing..." : "Refresh NASA Data"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-[1440px] flex-1 px-4 py-6 sm:px-6 space-y-6 w-full">
        {/* Fixed Prototype Location Banner (Section 1 Requirement) */}
        <section className="rounded-2xl border border-[#435133] bg-[#323D25]/90 p-4 shadow-lg backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#9A7E3B]/20 border border-[#9A7E3B]/40 text-[#9A7E3B]">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm sm:text-base font-bold text-[#D2CF9A]">
                      {GREEN_VALLEY_LOCATION.name}
                    </h2>
                    <span className="rounded bg-[#52B788]/20 px-2 py-0.5 text-[10px] font-semibold text-[#52B788] border border-[#52B788]/40">
                      Active Prototype Location
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[#9FA37C] mt-0.5">
                    <span>Latitude: {GREEN_VALLEY_LOCATION.latitude.toFixed(4)}°N</span>
                    <span>Longitude: {GREEN_VALLEY_LOCATION.longitude.toFixed(4)}°W</span>
                    <span>Elevation: {GREEN_VALLEY_LOCATION.elevationMeters}m (~3,150 ft)</span>
                    <span className="text-[#9FA37C]/60">•</span>
                    <span>Zone: USDA 9a/9b (Low-to-Mid Desert)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-[#9FA37C]">
              <span className="rounded bg-[#28301C] px-3 py-1 font-mono text-[11px] border border-[#435133]">
                Dataset: 2021-01-01 to 2025-12-31 (1,826 days)
              </span>
            </div>
          </div>
        </section>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="rounded-xl border border-red-700/60 bg-red-900/25 p-4 text-xs text-red-200 flex items-start gap-3">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
            <div>
              <strong className="font-semibold">NASA POWER Ingestion Notice:</strong>{" "}
              {errorMsg}
            </div>
          </div>
        )}

        {/* Tab 1: Dashboard */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {isLoading && !telemetry ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-[#435133] bg-[#323D25]/60 py-20">
                <RefreshCw className="h-8 w-8 text-[#9A7E3B] animate-spin mb-3" />
                <p className="text-sm font-semibold text-[#D2CF9A]">
                  Retrieving 5-Year Historical Environmental Records from NASA POWER API...
                </p>
                <p className="text-xs text-[#9FA37C] mt-1">
                  Ingesting 10 parameters for Green Valley, AZ (2021–2025).
                </p>
              </div>
            ) : telemetry ? (
              <>
                {/* Quick Feature Banners */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#52B788]/50 bg-[#52B788]/10 p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <Sprout className="h-6 w-6 text-[#52B788] shrink-0" />
                      <div>
                        <h3 className="text-sm font-bold text-[#D2CF9A]">
                          Vegetable Recommendations
                        </h3>
                        <p className="text-xs text-[#9FA37C]">
                          15 vegetables evaluated against NASA climate extremes and seasonal windows.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab("crops")}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#52B788] px-3.5 py-1.5 text-xs font-bold text-[#28301C] transition hover:bg-[#74C69D]"
                    >
                      View Crops <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#9A7E3B]/50 bg-[#9A7E3B]/10 p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-6 w-6 text-[#9A7E3B] shrink-0" />
                      <div>
                        <h3 className="text-sm font-bold text-[#D2CF9A]">
                          Farm Benefits & Profitability
                        </h3>
                        <p className="text-xs text-[#9FA37C]">
                          USDA Phoenix market prices, UA enterprise budgets & 3-tier scenario models.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab("economics")}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#9A7E3B] px-3.5 py-1.5 text-xs font-bold text-[#28301C] transition hover:bg-[#b29347]"
                    >
                      View Economics <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <DashboardMetrics
                  location={telemetry.location}
                  latestObservation={telemetry.latestObservation}
                  summaryStats={telemetry.summaryStats}
                  parameterMetadata={telemetry.parameterMetadata}
                  retrievalTimestamp={telemetry.retrievalTimestamp}
                  isCached={telemetry.isCached}
                  providerStatus={powerStatus}
                />

                {/* Satellite Imagery Preview */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <NasaInteractiveMap
                      lat={GREEN_VALLEY_LOCATION.latitude}
                      lon={GREEN_VALLEY_LOCATION.longitude}
                      locationName={GREEN_VALLEY_LOCATION.name}
                    />
                  </div>
                  <div className="space-y-6">
                    <DataSourcesPanel
                      providers={providers}
                      isLoading={isLoading}
                      onRefresh={fetchProviderStatuses}
                    />
                    <AiAdvisorSection
                      telemetry={telemetry}
                      geminiAvailable={geminiAvailable}
                    />
                  </div>
                </div>

                {/* Historical Charts Quick Section */}
                <HistoricalDataSection
                  monthlyAggregates={telemetry.monthlyAggregates}
                  recentObservations={telemetry.recentDailyObservations}
                  totalObservationsCount={telemetry.totalObservationsCount}
                  parameterMetadata={telemetry.parameterMetadata}
                />
              </>
            ) : null}
          </div>
        )}

        {/* Tab 2: Crop Recommendations (New Feature) */}
        {activeTab === "crops" && (
          <div className="space-y-6">
            <CropRecommendationsSection />
          </div>
        )}

        {/* Tab 3: Historical Data */}
        {activeTab === "historical" && telemetry && (
          <div className="space-y-6">
            <HistoricalDataSection
              monthlyAggregates={telemetry.monthlyAggregates}
              recentObservations={telemetry.recentDailyObservations}
              totalObservationsCount={telemetry.totalObservationsCount}
              parameterMetadata={telemetry.parameterMetadata}
            />
          </div>
        )}

        {/* Tab 4: Farm Benefits & Profitability */}
        {activeTab === "economics" && (
          <div className="space-y-6">
            <FarmEconomicsSection />
          </div>
        )}

        {/* Tab 5: AI Advisor */}
        {activeTab === "advisor" && (
          <div className="space-y-6">
            <AiAdvisorSection
              telemetry={telemetry}
              geminiAvailable={geminiAvailable}
            />
          </div>
        )}

        {/* Tab 6: Data Sources Panel */}
        {activeTab === "providers" && (
          <div className="space-y-6">
            <DataSourcesPanel
              providers={providers}
              isLoading={isLoading}
              onRefresh={fetchProviderStatuses}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#435133] bg-[#28301C]/90 py-5 text-center text-xs text-[#9FA37C]">
        <div className="mx-auto max-w-[1440px] px-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#D2CF9A]">GAIA Environmental MVP</span>
            <span>•</span>
            <span>NASA POWER Daily API (2021–2025)</span>
            <span>•</span>
            <span>NASA GIBS WMTS</span>
            <span>•</span>
            <span>University of Arizona Cooperative Extension</span>
            <span>•</span>
            <span>Google Gemini 2.5 Flash</span>
          </div>
          <div className="text-[11px] text-[#9FA37C]/80 font-mono">
            Location: {GREEN_VALLEY_LOCATION.name} ({GREEN_VALLEY_LOCATION.latitude.toFixed(4)}°N, {GREEN_VALLEY_LOCATION.longitude.toFixed(4)}°W)
          </div>
        </div>
      </footer>
    </div>
  );
}
