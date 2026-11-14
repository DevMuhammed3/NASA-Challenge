"use client";

import React, { useState, useEffect } from "react";
import {
  Sprout,
  Droplet,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Plus,
  FileText,
  Activity,
  Layers,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  ThumbsUp,
  ThumbsDown,
  Info,
  Clock,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { FarmerOnboardingModal } from "./FarmerOnboardingModal";
import type {
  FarmRecord,
  FarmFieldRecord,
  GrowingSeasonRecord,
  CropActivityRecord,
  PersonalizedCropRecommendation,
} from "@/lib/farmer/types";

export function FarmerDashboardSection() {
  const [farm, setFarm] = useState<FarmRecord | null>(null);
  const [fields, setFields] = useState<FarmFieldRecord[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<number | null>(null);
  const [seasons, setSeasons] = useState<GrowingSeasonRecord[]>([]);
  const [activities, setActivities] = useState<CropActivityRecord[]>([]);
  const [recommendations, setRecommendations] = useState<PersonalizedCropRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);

  // New Activity Log Form State
  const [showAddActivity, setShowAddActivity] = useState<boolean>(false);
  const [actType, setActType] = useState<"irrigation" | "fertilization" | "pesticide" | "harvest" | "planting">("irrigation");
  const [actDate, setActDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [actQuantity, setActQuantity] = useState<string>("1.2");
  const [actUnit, setActUnit] = useState<string>("inches");
  const [actNotes, setActNotes] = useState<string>("");

  // Feedback Modal State
  const [feedbackCrop, setFeedbackCrop] = useState<PersonalizedCropRecommendation | null>(null);
  const [feedbackAction, setFeedbackAction] = useState<"accepted" | "rejected">("accepted");
  const [feedbackReason, setFeedbackReason] = useState<string>("");

  // Fetch farm data
  const loadFarmData = async () => {
    setIsLoading(true);
    try {
      // 1. Get profile
      const farmRes = await fetch("/api/farmer/profile?farmId=1");
      const farmJson = await farmRes.json();
      if (farmJson.farm) {
        setFarm(farmJson.farm);
      }

      // 2. Get fields
      const fieldsRes = await fetch("/api/farmer/fields?farmId=1");
      const fieldsJson = await fieldsRes.json();
      if (fieldsJson.fields) {
        setFields(fieldsJson.fields);
        if (fieldsJson.fields.length > 0 && !selectedFieldId) {
          setSelectedFieldId(fieldsJson.fields[0].id);
        }
      }

      // 3. Get seasons
      const seasonsRes = await fetch("/api/farmer/seasons");
      const seasonsJson = await seasonsRes.json();
      if (seasonsJson.seasons) setSeasons(seasonsJson.seasons);

      // 4. Get activities
      const actsRes = await fetch("/api/farmer/activities");
      const actsJson = await actsRes.json();
      if (actsJson.activities) setActivities(actsJson.activities);

      // 5. Get recommendations
      const recsRes = await fetch("/api/farmer/recommendations?farmId=1");
      const recsJson = await recsRes.json();
      if (recsJson.recommendations) {
        setRecommendations(recsJson.recommendations);
      }
    } catch (err) {
      console.error("Error loading farmer ADSS:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFarmData();
  }, []);

  const handleSaveActivity = async () => {
    if (!seasons[0]) return;
    try {
      await fetch("/api/farmer/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seasonId: seasons[0].id,
          activityType: actType,
          activityDate: actDate,
          quantity: actQuantity ? Number(actQuantity) : undefined,
          unit: actUnit,
          notes: actNotes,
        }),
      });
      setShowAddActivity(false);
      setActNotes("");
      loadFarmData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendFeedback = async () => {
    if (!feedbackCrop) return;
    try {
      await fetch("/api/farmer/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cropCode: feedbackCrop.crop.id,
          action: feedbackAction,
          reason: feedbackReason,
        }),
      });
      setFeedbackCrop(null);
      setFeedbackReason("");
      loadFarmData();
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <Sparkles className="size-8 animate-spin text-[#41644A] mb-3" />
        <p className="text-sm font-semibold text-[#28301C]">
          Loading Farmer Intelligence System & Ground-Truth Profile...
        </p>
      </div>
    );
  }

  const completeness = farm?.completeness;

  return (
    <div className="space-y-6 min-w-0">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#E2E6DA] bg-[#FFFFFF] p-4 sm:p-5 shadow-xs">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#EEF0E6] px-2.5 py-0.5 text-xs font-semibold text-[#41644A] border border-[#E2E6DA]">
              Field Management &amp; Activity Log
            </span>
            <span className="text-xs text-[#687365]">
              {farm?.name || "Active Farm"}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#28301C] flex flex-wrap items-center gap-2">
            <span>{farm?.name || "Rancho Santa Cruz Demo Farm"}</span>
            <span className="text-xs font-normal text-[#687365]">
              ({farm?.regionName || "Green Valley, AZ"})
            </span>
          </h1>
          <p className="text-xs text-[#687365]">
            Manage your fields, record daily water or harvest activities, and get personalized crop recommendations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => setIsOnboardingOpen(true)}
            className="text-xs font-semibold w-full sm:w-auto"
          >
            Edit Farm &amp; Soil Test
          </Button>
          <Button
            variant="default"
            onClick={() => setShowAddActivity(true)}
            className="text-xs font-bold bg-[#41644A] text-white flex items-center justify-center gap-1.5 w-full sm:w-auto"
          >
            <Plus className="size-4" />
            <span>Log Farm Activity</span>
          </Button>
        </div>
      </div>

      {/* 1. Farm Overview Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border-[#E2E6DA]">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#687365] mb-1">
            <MapPin className="size-3.5 text-[#41644A]" />
            <span>Total Cultivated Area</span>
          </div>
          <div className="text-lg font-bold text-[#28301C]">
            {farm?.totalArea || 40} {farm?.areaUnit || "acres"}
          </div>
          <div className="text-[11px] text-[#687365]">
            {fields.length} Subdivided Fields
          </div>
        </Card>

        <Card className="p-4 bg-white border-[#E2E6DA]">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#687365] mb-1">
            <Sprout className="size-3.5 text-[#41644A]" />
            <span>Active Growing Cycle</span>
          </div>
          <div className="text-lg font-bold text-[#28301C]">
            {seasons[0]?.cropName || "Broccoli"}
          </div>
          <div className="text-[11px] text-[#41644A] font-semibold">
            Status: {seasons[0]?.status || "Active Cycle"}
          </div>
        </Card>

        <Card className="p-4 bg-white border-[#E2E6DA]">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#687365] mb-1">
            <Droplet className="size-3.5 text-[#41644A]" />
            <span>Irrigation Delivery</span>
          </div>
          <div className="text-lg font-bold text-[#28301C]">
            Deep Well & Drip
          </div>
          <div className="text-[11px] text-[#687365]">
            450 GPM Capacity (DU &gt; 85%)
          </div>
        </Card>

        <Card className="p-4 bg-white border-[#E2E6DA]">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#687365] mb-1">
            <Activity className="size-3.5 text-[#41644A]" />
            <span>Farm Data Completeness</span>
          </div>
          <div className="text-lg font-bold text-[#28301C]">
            {completeness?.overallScore || 78}%
          </div>
          <div className="text-[11px] text-[#687365]">
            6 Evaluated Dimensions
          </div>
        </Card>
      </div>

      {/* 2. Farm Data Completeness & Missing Information Breakdown */}
      <Card className="border-[#E2E6DA] bg-white">
        <CardHeader className="pb-3 border-b border-[#E2E6DA]">
          <CardTitle className="text-sm font-bold text-[#28301C] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-[#41644A]" />
              <span>Farm Data Completeness & Diagnostic Status</span>
            </div>
            <span className="text-xs font-mono font-bold text-[#41644A]">
              Distinct Dimensional Evaluation
            </span>
          </CardTitle>
          <CardDescription className="text-xs text-[#687365]">
            Scientific confidence requires distinct completeness across each domain — missing lab tests are explicitly identified rather than hidden.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
            <div className="rounded-xl border border-[#E2E6DA] bg-[#EEF0E6]/30 p-2.5">
              <div className="text-[11px] font-semibold text-[#687365]">Location</div>
              <div className="text-base font-bold text-[#28301C]">{completeness?.locationScore}%</div>
            </div>
            <div className="rounded-xl border border-[#E2E6DA] bg-[#EEF0E6]/30 p-2.5">
              <div className="text-[11px] font-semibold text-[#687365]">Climate (NASA)</div>
              <div className="text-base font-bold text-[#41644A]">{completeness?.climateScore}%</div>
            </div>
            <div className="rounded-xl border border-[#E2E6DA] bg-[#EEF0E6]/30 p-2.5">
              <div className="text-[11px] font-semibold text-[#687365]">Soil Diagnostic</div>
              <div className="text-base font-bold text-amber-600">{completeness?.soilScore}%</div>
            </div>
            <div className="rounded-xl border border-[#E2E6DA] bg-[#EEF0E6]/30 p-2.5">
              <div className="text-[11px] font-semibold text-[#687365]">Water & Pumping</div>
              <div className="text-base font-bold text-[#28301C]">{completeness?.waterScore}%</div>
            </div>
            <div className="rounded-xl border border-[#E2E6DA] bg-[#EEF0E6]/30 p-2.5">
              <div className="text-[11px] font-semibold text-[#687365]">Crop History</div>
              <div className="text-base font-bold text-[#28301C]">{completeness?.historyScore}%</div>
            </div>
            <div className="rounded-xl border border-[#E2E6DA] bg-[#EEF0E6]/30 p-2.5">
              <div className="text-[11px] font-semibold text-[#687365]">Economics</div>
              <div className="text-base font-bold text-[#28301C]">{completeness?.economicsScore}%</div>
            </div>
          </div>

          {/* Missing Checklist & Blockers */}
          {completeness?.blockersForAnalysis && completeness.blockersForAnalysis.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                <ShieldAlert className="size-4 text-amber-700" />
                <span>Diagnostic Notice & Agronomic Limitations</span>
              </div>
              <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
                {completeness.blockersForAnalysis.map((b, idx) => (
                  <li key={idx}>{b}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Action Center */}
      <div className="rounded-2xl border border-[#E2E6DA] bg-[#FFFFFF] p-4 space-y-3">
        <h3 className="text-xs font-bold text-[#28301C] flex items-center gap-1.5">
          <Clock className="size-4 text-[#41644A]" />
          <span>Action Center — Recommended Next Steps for Your Farm</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setIsOnboardingOpen(true)}
            className="flex items-center justify-between rounded-xl border border-[#E2E6DA] bg-[#EEF0E6]/40 p-3 text-left hover:border-[#41644A] hover:bg-[#EEF0E6] transition-all cursor-pointer"
          >
            <div>
              <div className="text-xs font-bold text-[#28301C]">Upload Certified Soil Test</div>
              <div className="text-[11px] text-[#687365]">Unlock precision nitrogen fertigation</div>
            </div>
            <ChevronRight className="size-4 text-[#687365]" />
          </button>

          <button
            type="button"
            onClick={() => setShowAddActivity(true)}
            className="flex items-center justify-between rounded-xl border border-[#E2E6DA] bg-[#EEF0E6]/40 p-3 text-left hover:border-[#41644A] hover:bg-[#EEF0E6] transition-all cursor-pointer"
          >
            <div>
              <div className="text-xs font-bold text-[#28301C]">Log Daily Irrigation Event</div>
              <div className="text-[11px] text-[#687365]">Track groundwater pumping lift costs</div>
            </div>
            <ChevronRight className="size-4 text-[#687365]" />
          </button>

          <button
            type="button"
            onClick={() => setIsOnboardingOpen(true)}
            className="flex items-center justify-between rounded-xl border border-[#E2E6DA] bg-[#EEF0E6]/40 p-3 text-left hover:border-[#41644A] hover:bg-[#EEF0E6] transition-all cursor-pointer"
          >
            <div>
              <div className="text-xs font-bold text-[#28301C]">Review Crop Preferences</div>
              <div className="text-[11px] text-[#687365]">Filter out high-risk or excluded crops</div>
            </div>
            <ChevronRight className="size-4 text-[#687365]" />
          </button>
        </div>
      </div>

      {/* 4. Personalized Recommendations Section */}
      <Card className="border-[#E2E6DA] bg-white">
        <CardHeader className="pb-3 border-b border-[#E2E6DA]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold text-[#28301C] flex items-center gap-2">
                <Sprout className="size-5 text-[#41644A]" />
                <span>Personalized Crop Recommendations</span>
              </CardTitle>
              <CardDescription className="text-xs text-[#687365]">
                Evaluated against your farm&apos;s field size ({fields[0]?.area || 15} acres), budget limits, predecessor crops, and Green Valley climate.
              </CardDescription>
            </div>
            <div className="text-xs font-mono text-[#687365]">
              Total evaluated: {recommendations.length} vegetables
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          <div className="space-y-3">
            {recommendations.slice(0, 6).map((rec, idx) => {
              const isExcluded = rec.farmerPreferenceMatch.isExcluded;
              return (
                <div
                  key={rec.crop.id}
                  className={`rounded-2xl border p-4 transition-all ${
                    isExcluded
                      ? "border-red-200 bg-red-50/20 opacity-75"
                      : "border-[#E2E6DA] bg-[#FFFFFF] hover:border-[#41644A]/50"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-[#28301C]">
                          {idx + 1}. {rec.crop.name} ({rec.crop.scientificName})
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            rec.suitabilityClass === "Suitable with Irrigation in Season"
                              ? "bg-[#41644A] text-white"
                              : rec.suitabilityClass === "Soil Diagnostic Required"
                              ? "bg-amber-100 text-amber-800 border border-amber-300"
                              : "bg-[#EEF0E6] text-[#243B2A]"
                          }`}
                        >
                          {rec.suitabilityClass}
                        </span>
                        {rec.farmerPreferenceMatch.isPreferred && (
                          <span className="rounded-full bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 text-[10px] font-bold">
                            ★ Preferred Crop
                          </span>
                        )}
                        {isExcluded && (
                          <span className="rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-[10px] font-bold">
                            Excluded by Farmer
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#687365] leading-relaxed">
                        {rec.rationale}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 text-left sm:text-right w-full sm:w-auto">
                      <div>
                        <div className="text-xs font-mono font-bold text-[#41644A]">
                          Est. Net Profit: ${rec.economicViability.estimatedNetProfitPerAcre.toLocaleString()}/acre
                        </div>
                        <div className="text-[11px] text-[#687365]">
                          ROI: {rec.economicViability.roiPercent}% • Break-even: ${rec.economicViability.breakEvenPricePerLb}/lb
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setFeedbackCrop(rec);
                            setFeedbackAction("accepted");
                          }}
                          className="cursor-pointer p-2 rounded-lg border border-[#E2E6DA] bg-white text-[#41644A] hover:bg-[#EEF0E6]"
                          title="Accept Recommendation"
                        >
                          <ThumbsUp className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFeedbackCrop(rec);
                            setFeedbackAction("rejected");
                          }}
                          className="cursor-pointer p-2 rounded-lg border border-[#E2E6DA] bg-white text-red-600 hover:bg-red-50"
                          title="Reject with Reason"
                        >
                          <ThumbsDown className="size-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Multi-Dimensional Detail Strip */}
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-2.5 border-t border-[#E2E6DA]/60 text-[11px]">
                    <div>
                      <span className="text-[#687365]">Seasonal Window:</span>{" "}
                      <span className="font-semibold text-[#28301C]">{rec.seasonalWindow}</span>
                    </div>
                    <div>
                      <span className="text-[#687365]">Water Demand:</span>{" "}
                      <span className="font-semibold text-[#28301C]">
                        {rec.waterRequirements.seasonalNeedInches} inches ({rec.waterRequirements.irrigationMatch})
                      </span>
                    </div>
                    <div>
                      <span className="text-[#687365]">Rotation Credit:</span>{" "}
                      <span className="font-semibold text-[#41644A]">
                        +{rec.rotationAnalysis.nitrogenCreditKgHa} kg N/ha ({rec.rotationAnalysis.predecessorCompatibility})
                      </span>
                    </div>
                    <div>
                      <span className="text-[#687365]">Budget Feasibility:</span>{" "}
                      <span
                        className={`font-semibold ${
                          rec.economicViability.budgetFeasibility === "Within Farmer Budget"
                            ? "text-[#41644A]"
                            : "text-amber-700"
                        }`}
                      >
                        {rec.economicViability.budgetFeasibility}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 5. Season & Activity Monitoring */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growing Seasons */}
        <Card className="border-[#E2E6DA] bg-white">
          <CardHeader className="pb-3 border-b border-[#E2E6DA]">
            <CardTitle className="text-sm font-bold text-[#28301C] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-[#41644A]" />
                <span>Growing Seasons & Field Assignments</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {seasons.map((s) => (
              <div
                key={s.id}
                className="rounded-xl border border-[#E2E6DA] bg-[#EEF0E6]/30 p-3.5 space-y-1.5 text-xs"
              >
                <div className="flex items-center justify-between font-bold text-[#28301C]">
                  <span>{s.seasonName}</span>
                  <span className="rounded-full bg-[#41644A] text-white px-2 py-0.5 text-[10px]">
                    {s.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[#687365] text-[11px]">
                  <span>Crop: {s.cropName}</span>
                  <span>Area: {s.cultivatedAreaAcre} acres</span>
                  <span>Harvest: {s.expectedHarvestDate}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Farm Activity Log */}
        <Card className="border-[#E2E6DA] bg-white">
          <CardHeader className="pb-3 border-b border-[#E2E6DA]">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold text-[#28301C] flex items-center gap-2">
                <Activity className="size-4 text-[#41644A]" />
                <span>Recent Farm Activity Log</span>
              </CardTitle>
              <button
                type="button"
                onClick={() => setShowAddActivity(true)}
                className="cursor-pointer text-xs font-semibold text-[#41644A] hover:underline"
              >
                + Log Event
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-2.5">
            {activities.slice(0, 5).map((act) => (
              <div
                key={act.id}
                className="flex items-center justify-between rounded-xl border border-[#E2E6DA] bg-[#FFFFFF] p-3 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-[#28301C] capitalize flex items-center gap-2">
                    <span>{act.activityType}</span>
                    <span className="text-[10px] text-[#687365] font-normal">
                      • {act.activityDate}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#687365]">{act.notes}</p>
                </div>
                {act.quantity && (
                  <div className="text-right font-mono font-bold text-[#41644A]">
                    {act.quantity} {act.unit}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Log Activity Modal */}
      {showAddActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3.5 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-[#E2E6DA] bg-white p-4 sm:p-5 shadow-2xl space-y-4 min-w-0">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-[#28301C]">Log Farming Activity</h3>
              <button
                type="button"
                onClick={() => setShowAddActivity(false)}
                className="cursor-pointer text-[#687365]"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-[#28301C]">Event Type</label>
                <select
                  value={actType}
                  onChange={(e) => setActType(e.target.value as any)}
                  className="w-full mt-1 rounded-xl border border-[#E2E6DA] p-2"
                >
                  <option value="irrigation">Irrigation (Groundwater Pulse)</option>
                  <option value="fertilization">Fertilization / Fertigation</option>
                  <option value="pesticide">Plant Protection / IPM</option>
                  <option value="planting">Planting / Transplanting</option>
                  <option value="harvest">Harvest Event</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-[#28301C]">Date</label>
                <input
                  type="date"
                  value={actDate}
                  onChange={(e) => setActDate(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-[#E2E6DA] p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-[#28301C]">Quantity</label>
                  <input
                    type="number"
                    step="0.1"
                    value={actQuantity}
                    onChange={(e) => setActQuantity(e.target.value)}
                    className="w-full mt-1 rounded-xl border border-[#E2E6DA] p-2"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#28301C]">Unit</label>
                  <input
                    type="text"
                    value={actUnit}
                    onChange={(e) => setActUnit(e.target.value)}
                    className="w-full mt-1 rounded-xl border border-[#E2E6DA] p-2"
                    placeholder="inches / lbs / acres"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#28301C]">Notes & Observations</label>
                <textarea
                  value={actNotes}
                  onChange={(e) => setActNotes(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-[#E2E6DA] p-2 h-20"
                  placeholder="e.g. Applied 1.2 inches subsurface drip at 12 psi pressure."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setShowAddActivity(false)}>
                Cancel
              </Button>
              <Button variant="default" onClick={handleSaveActivity} className="bg-[#41644A] text-white">
                Save Activity Record
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Recommendation Feedback Modal */}
      {feedbackCrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3.5 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-[#E2E6DA] bg-white p-4 sm:p-5 shadow-2xl space-y-4 min-w-0">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-[#28301C]">
                Record Decision for {feedbackCrop.crop.name}
              </h3>
              <button
                type="button"
                onClick={() => setFeedbackCrop(null)}
                className="cursor-pointer text-[#687365]"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-[#28301C]">Your Decision</label>
                <select
                  value={feedbackAction}
                  onChange={(e) => setFeedbackAction(e.target.value as any)}
                  className="w-full mt-1 rounded-xl border border-[#E2E6DA] p-2"
                >
                  <option value="accepted">Accept (Plan for upcoming season)</option>
                  <option value="rejected">Reject (Not suitable for my farm)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-[#28301C]">
                  {feedbackAction === "rejected" ? "Reason for Rejection" : "Implementation Notes"}
                </label>
                <textarea
                  value={feedbackReason}
                  onChange={(e) => setFeedbackReason(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-[#E2E6DA] p-2 h-24"
                  placeholder={
                    feedbackAction === "rejected"
                      ? "e.g. Lack of cold chain storage, or broker contract already filled."
                      : "e.g. Will allocate 10 acres in North Pivot block."
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setFeedbackCrop(null)}>
                Cancel
              </Button>
              <Button variant="default" onClick={handleSendFeedback} className="bg-[#41644A] text-white">
                Submit Farmer Decision
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding / Edit Profile Modal */}
      <FarmerOnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onSuccess={loadFarmData}
      />
    </div>
  );
}
