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
  Menu,
  X,
  ChevronRight,
  ClipboardList,
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
import { FarmerDashboardSection } from "@/components/farmer/FarmerDashboardSection";
import type {
  EnvironmentalDataResponse,
  ProviderStatusItem,
} from "@/lib/types/environmental";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

type ActiveTab =
  | "dashboard"
  | "farmer_adss"
  | "crops"
  | "historical"
  | "economics"
  | "advisor"
  | "providers";

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: Compass,
    description: "Real-time agroclimatology & soil",
  },
  {
    id: "farmer_adss",
    label: "Farm Intelligence (ADSS)",
    icon: ClipboardList,
    description: "My farm, field plots & activities",
  },
  {
    id: "crops",
    label: "Crop Recommendations",
    icon: Sprout,
    description: "15-vegetable suitability engine",
  },
  {
    id: "historical",
    label: "5-Year Climate History",
    icon: TrendingUp,
    description: "NASA POWER 2021–2025 records",
  },
  {
    id: "economics",
    label: "Farm Economics & Profit",
    icon: DollarSign,
    description: "USDA market prices & budgets",
  },
  {
    id: "advisor",
    label: "AI Environmental Advisor",
    icon: Sparkles,
    description: "Grounded telemetry synthesis",
  },
  {
    id: "providers",
    label: "Data Sources & Telemetry",
    icon: Database,
    description: "Verified APIs & SSURGO status",
  },
];

export default function GaiaApp() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Data states (Fixed strictly to Green Valley, AZ for MVP phase)
  const [telemetry, setTelemetry] = useState<EnvironmentalDataResponse | null>(
    null,
  );
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
      id: "usda_ssurgo",
      name: "USDA NRCS SSURGO / Soil Data Access",
      category: "Soil Survey & Taxonomy",
      status: "Connected",
      message: "Soil Data Access REST service active. Map unit 53844 verified.",
      dataProvided:
        "Soil series, texture fractions, AWC, Ksat, taxonomic benchmark pH & salinity",
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
      dataProvided:
        "Environmental conditions, opportunities, risks & recommendations",
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
    setIsLoading(true);
    if (forceRefresh) setIsRefreshing(true);
    setErrorMsg(null);

    try {
      const queryParams = new URLSearchParams({
        lat: GREEN_VALLEY_LOCATION.latitude.toString(),
        lon: GREEN_VALLEY_LOCATION.longitude.toString(),
        locationName: GREEN_VALLEY_LOCATION.name,
      });

      if (forceRefresh) {
        queryParams.set("refresh", "true");
      }

      const res = await fetch(`/api/power?${queryParams.toString()}`);
      if (!res.ok) {
        throw new Error(
          `Failed to load NASA POWER telemetry: HTTP ${res.status}`,
        );
      }

      const data: EnvironmentalDataResponse = await res.json();
      setTelemetry(data);
    } catch (err) {
      console.error("Telemetry fetch error:", err);
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Failed to load meteorological and soil telemetry.",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Fetch provider connection statuses
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
    <div className="min-h-screen bg-[#F5F3E9] text-[#28301C] flex font-sans overflow-x-clip">
      {/* 1. Left Sidebar Navigation (Desktop) */}
      <aside className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 z-40 border-r border-[#E2E6DA] bg-[#FFFFFF] shadow-sm justify-between">
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Logo & Platform Name Header */}
          <div className="p-5 border-b border-[#E2E6DA] flex items-center gap-3 bg-[#FFFFFF]">
            <GaiaLogo />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xl font-black tracking-tight text-[#28301C]">
                  GAIA
                </span>
                <Badge
                  variant="outline"
                  className="border-[#41644A]/40 bg-[#EEF0E6] text-[#243B2A] font-mono text-[9px] font-bold"
                >
                  MVP
                </Badge>
              </div>
              <p className="text-[11px] text-[#687365] font-medium leading-tight mt-0.5">
                Earth Intelligence &amp; Crop Advisor
              </p>
            </div>
          </div>

          {/* Prototype Location Card in Sidebar */}
          <div className="p-4 border-b border-[#E2E6DA] bg-[#EEF0E6]/50">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-md bg-[#FFFFFF] border border-[#E2E6DA] text-[#41644A] shrink-0">
                <MapPin className="size-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#687365] block font-semibold">
                  Fixed Prototype Site
                </span>
                <h4 className="text-xs font-bold text-[#28301C]">
                  Green Valley, Arizona, USA
                </h4>
                <div className="text-[10px] font-mono text-[#687365] mt-0.5">
                  31.8543°N, 111.0000°W (962m)
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Items List */}
          <nav className="p-3 space-y-1.5 flex-1">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#687365]">
              Main Sections
            </div>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer text-left active:scale-[0.98] ${
                    isActive
                      ? "bg-[#41644A] text-white shadow-xs font-bold hover:bg-[#34503B]"
                      : "text-[#28301C] hover:bg-[#EEF0E6] hover:text-[#243B2A] active:bg-[#DCE2D5]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`size-4 shrink-0 ${isActive ? "text-white" : "text-[#41644A]"}`}
                    />
                    <div className="truncate">
                      <div className="truncate">{item.label}</div>
                      <div
                        className={`text-[10px] font-normal truncate ${isActive ? "text-white/80" : "text-[#687365]"}`}
                      >
                        {item.description}
                      </div>
                    </div>
                  </div>
                  {isActive && (
                    <ChevronRight className="size-3.5 text-white shrink-0 ml-1" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="p-4 border-t border-[#E2E6DA] bg-[#EEF0E6]/40 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#687365] flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[#41644A] animate-pulse" />
              NASA POWER
            </span>
            <span className="font-bold text-[#28301C]">{powerStatus}</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchTelemetry(true)}
            disabled={isRefreshing || isLoading}
            className="w-full justify-center shadow-xs"
          >
            <RefreshCw
              data-icon="inline-start"
              className={`size-3.5 ${isRefreshing ? "animate-spin text-[#41644A]" : "text-[#41644A]"}`}
            />
            <span>{isRefreshing ? "Refreshing..." : "Refresh NASA Data"}</span>
          </Button>

          <div className="text-[10px] text-center text-[#687365] font-mono">
            Dataset: 2021–2025 (1,826 days)
          </div>
        </div>
      </aside>

      {/* 2. Mobile Top Navigation Bar (< lg screens) */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-30 flex items-center justify-between px-4 py-2.5 bg-[#FFFFFF] border-b border-[#E2E6DA] shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <GaiaLogo size={34} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-mono text-base font-bold text-[#28301C]">
                GAIA
              </span>
              <span className="text-[10px] text-[#687365] font-mono truncate">
                • Green Valley, AZ
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-lg border border-[#E2E6DA] bg-[#FFFFFF] text-[#28301C] cursor-pointer transition-all duration-150 hover:bg-[#EEF0E6] hover:border-[#41644A] active:scale-95 shrink-0"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? (
            <X className="size-5" />
          ) : (
            <Menu className="size-5" />
          )}
        </button>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-xs flex">
          <div className="w-72 max-w-[85vw] bg-[#FFFFFF] border-r border-[#E2E6DA] h-full flex flex-col justify-between shadow-2xl p-4 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E6DA]">
                <div className="flex items-center gap-2">
                  <GaiaLogo size={32} />
                  <span className="font-mono font-bold text-base text-[#28301C]">
                    GAIA
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer p-1.5 rounded-md text-[#687365] transition-all duration-150 hover:bg-[#EEF0E6] hover:text-[#28301C]"
                  aria-label="Close navigation menu"
                >
                  <X className="size-5" />
                </button>
              </div>

              <nav className="space-y-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full min-h-[44px] flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-left transition-all duration-150 cursor-pointer active:scale-[0.98] ${
                        isActive
                          ? "bg-[#41644A] text-white font-bold hover:bg-[#34503B]"
                          : "text-[#28301C] hover:bg-[#EEF0E6] hover:text-[#243B2A] active:bg-[#DCE2D5]"
                      }`}
                    >
                      <Icon
                        className={`size-4 shrink-0 ${isActive ? "text-white" : "text-[#41644A]"}`}
                      />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchTelemetry(true);
                setMobileMenuOpen(false);
              }}
              disabled={isRefreshing || isLoading}
              className="w-full min-h-[44px] mt-4"
            >
              <RefreshCw
                className={`size-3.5 mr-1.5 ${isRefreshing ? "animate-spin" : ""}`}
              />
              <span>Refresh NASA Data</span>
            </Button>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* 3. Main Content Container (Pushed right by sidebar on desktop) */}
      <div className="lg:pl-72 flex flex-col flex-1 min-h-screen w-full min-w-0">
        {/* Main Content Area */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 flex flex-col gap-6 w-full max-w-7xl mx-auto pt-16 lg:pt-8 min-w-0">
          {/* Prototype Location Banner */}
          <Card className="border-[#E2E6DA] bg-[#FFFFFF] shadow-xs">
            <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex size-9 items-center justify-center rounded-lg bg-[#EEF0E6] border border-[#E2E6DA] text-[#41644A] shrink-0">
                  <MapPin className="size-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-bold text-[#28301C]">
                      {GREEN_VALLEY_LOCATION.name}
                    </h2>
                    <Badge
                      variant="outline"
                      className="border-[#41644A]/40 bg-[#EEF0E6] text-[#243B2A] font-semibold text-[10px]"
                    >
                      Active Prototype Site
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono text-[#687365] mt-0.5">
                    <span>
                      Latitude: {GREEN_VALLEY_LOCATION.latitude.toFixed(4)}°N
                    </span>
                    <span>
                      Longitude: {GREEN_VALLEY_LOCATION.longitude.toFixed(4)}°W
                    </span>
                    <span>
                      Elevation: {GREEN_VALLEY_LOCATION.elevationMeters}m
                      (~3,150 ft)
                    </span>
                    <span className="text-[#E2E6DA] hidden sm:inline">•</span>
                    <span>Zone: USDA 9a/9b (Low-to-Mid Sonoran Desert)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Badge
                  variant="outline"
                  className="border-[#E2E6DA] bg-[#EEF0E6]/60 font-mono text-[11px] text-[#243B2A] px-3 py-1 whitespace-normal sm:whitespace-nowrap text-center w-full sm:w-auto"
                >
                  Dataset: 2021-01-01 to 2025-12-31 (1,826 days)
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Global Error Banner */}
          {errorMsg && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertTitle>NASA POWER Telemetry Notice</AlertTitle>
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}

          {/* Tab 1: Dashboard */}
          {activeTab === "dashboard" && (
            <div className="flex flex-col gap-6">
              {isLoading && !telemetry ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-[#E2E6DA] bg-[#FFFFFF] py-20 shadow-xs">
                  <RefreshCw className="size-8 text-[#41644A] animate-spin mb-3" />
                  <p className="text-sm font-semibold text-[#28301C]">
                    Retrieving 5-Year Historical Environmental Records from NASA
                    POWER API...
                  </p>
                  <p className="text-xs text-[#687365] mt-1 font-mono">
                    Ingesting 10 parameters for Green Valley, AZ (2021–2025).
                  </p>
                </div>
              ) : telemetry ? (
                <>
                  {/* Quick Feature Shortcut Banners */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-[#E2E6DA] bg-[#FFFFFF] shadow-xs">
                      <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <ClipboardList className="size-6 text-[#41644A] shrink-0" />
                          <div className="min-w-0">
                            <h3 className="text-sm font-bold text-[#28301C]">
                              Farmer Intelligence (ADSS)
                            </h3>
                            <p className="text-xs text-[#687365] line-clamp-2">
                              Register fields, upload tests, and track farming activities.
                            </p>
                          </div>
                        </div>
                        <Button size="sm" onClick={() => setActiveTab("farmer_adss")} className="w-full sm:w-auto shrink-0">
                          Open ADSS{" "}
                          <ArrowRight
                            data-icon="inline-end"
                            className="size-3.5"
                          />
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border-[#E2E6DA] bg-[#FFFFFF] shadow-xs">
                      <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <Sprout className="size-6 text-[#41644A] shrink-0" />
                          <div className="min-w-0">
                            <h3 className="text-sm font-bold text-[#28301C]">
                              Vegetable Suitability
                            </h3>
                            <p className="text-xs text-[#687365] line-clamp-2">
                              15 vegetables evaluated against NASA climate extremes.
                            </p>
                          </div>
                        </div>
                        <Button size="sm" onClick={() => setActiveTab("crops")} className="w-full sm:w-auto shrink-0">
                          View Crops{" "}
                          <ArrowRight
                            data-icon="inline-end"
                            className="size-3.5"
                          />
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border-[#E2E6DA] bg-[#FFFFFF] shadow-xs">
                      <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <DollarSign className="size-6 text-[#41644A] shrink-0" />
                          <div className="min-w-0">
                            <h3 className="text-sm font-bold text-[#28301C]">
                              Farm Economics &amp; Profit
                            </h3>
                            <p className="text-xs text-[#687365] line-clamp-2">
                              USDA market prices, UA enterprise budgets &amp; scenarios.
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => setActiveTab("economics")}
                          className="w-full sm:w-auto shrink-0"
                        >
                          View Economics{" "}
                          <ArrowRight
                            data-icon="inline-end"
                            className="size-3.5"
                          />
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  <DashboardMetrics
                    location={telemetry.location}
                    latestObservation={telemetry.latestObservation}
                    summaryStats={telemetry.summaryStats}
                    parameterMetadata={telemetry.parameterMetadata}
                    retrievalTimestamp={telemetry.retrievalTimestamp}
                    isCached={telemetry.isCached}
                    providerStatus={powerStatus}
                    soilProfile={telemetry.soilProfile}
                    provenance={telemetry.provenance}
                  />

                  {/* Satellite Imagery Preview */}
                  <div className="grid grid-cols-1 gap-6">
                    <div className="lg:col-span-2">
                      <NasaInteractiveMap
                        lat={GREEN_VALLEY_LOCATION.latitude}
                        lon={GREEN_VALLEY_LOCATION.longitude}
                        locationName={GREEN_VALLEY_LOCATION.name}
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
                  <div className="flex flex-col gap-6">
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
                </>
              ) : null}
            </div>
          )}

          {/* Tab 2: Farmer ADSS */}
          {activeTab === "farmer_adss" && (
            <div className="flex flex-col gap-6">
              <FarmerDashboardSection />
            </div>
          )}

          {/* Tab 3: Crop Recommendations */}
          {activeTab === "crops" && (
            <div className="flex flex-col gap-6">
              <CropRecommendationsSection />
            </div>
          )}

          {/* Tab 3: Historical Data */}
          {activeTab === "historical" && telemetry && (
            <div className="flex flex-col gap-6">
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
            <div className="flex flex-col gap-6">
              <FarmEconomicsSection />
            </div>
          )}

          {/* Tab 5: AI Advisor */}
          {activeTab === "advisor" && (
            <div className="flex flex-col gap-6">
              <AiAdvisorSection
                telemetry={telemetry}
                geminiAvailable={geminiAvailable}
              />
            </div>
          )}

          {/* Tab 6: Data Sources Panel */}
          {activeTab === "providers" && (
            <div className="flex flex-col gap-6">
              <DataSourcesPanel
                providers={providers}
                isLoading={isLoading}
                onRefresh={fetchProviderStatuses}
              />
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-auto border-t border-[#E2E6DA] bg-[#FFFFFF] py-4 text-xs text-[#687365]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-bold text-[#28301C]">
                GAIA Environmental Platform
              </span>
              <span>•</span>
              <span>NASA POWER (2021–2025)</span>
              <span>•</span>
              <span>USDA NRCS SSURGO</span>
              <span>•</span>
              <span>UA Cooperative Extension</span>
            </div>
            <div className="text-[11px] font-mono break-all sm:break-normal">
              Fixed Prototype Site: {GREEN_VALLEY_LOCATION.name} (
              {GREEN_VALLEY_LOCATION.latitude.toFixed(4)}°N,{" "}
              {GREEN_VALLEY_LOCATION.longitude.toFixed(4)}°W)
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
