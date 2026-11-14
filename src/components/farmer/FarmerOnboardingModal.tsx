"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Sprout,
  Droplet,
  History,
  DollarSign,
  Target,
  Upload,
  ChevronRight,
  ChevronLeft,
  Save,
  HelpCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { GREEN_VALLEY_LOCATION } from "@/lib/config/location";
import { CROP_CATALOG } from "@/lib/crops/crop-catalog";
import type LType from "leaflet";

interface FarmerOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function FarmerOnboardingModal({
  isOpen,
  onClose,
  onSuccess,
}: FarmerOnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  // --- Step 1: Farm Profile & Fields ---
  const [farmName, setFarmName] = useState<string>("Rancho Santa Cruz");
  const [regionName, setRegionName] = useState<string>(GREEN_VALLEY_LOCATION.name);
  const [latitude, setLatitude] = useState<number>(GREEN_VALLEY_LOCATION.latitude);
  const [longitude, setLongitude] = useState<number>(GREEN_VALLEY_LOCATION.longitude);
  const [totalArea, setTotalArea] = useState<number>(40);
  const [areaUnit, setAreaUnit] = useState<"acre" | "hectare" | "sqm">("acre");
  const [productionType, setProductionType] = useState<"open_field" | "greenhouse" | "dual">("open_field");
  const [description, setDescription] = useState<string>("");
  const [fields, setFields] = useState<Array<{ name: string; area: number; currentCrop: string }>>([
    { name: "Field 1 - North Pivot", area: 15, currentCrop: "Broccoli" },
    { name: "Field 2 - South Block", area: 25, currentCrop: "Spinach" },
  ]);

  // Leaflet map container ref
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<LType.Map | null>(null);

  // --- Step 2: Soil Profile ---
  const [soilTexture, setSoilTexture] = useState<string>("sandy_loam");
  const [soilPh, setSoilPh] = useState<string>("7.8");
  const [soilEc, setSoilEc] = useState<string>("1.2");
  const [soilOrganicMatter, setSoilOrganicMatter] = useState<string>("1.2");
  const [soilDrainage, setSoilDrainage] = useState<string>("well_drained");
  const [knownSalinity, setKnownSalinity] = useState<string>("slight");
  const [soilUnknown, setSoilUnknown] = useState<boolean>(false);
  const [soilFile, setSoilFile] = useState<File | null>(null);

  // --- Step 3: Water & Irrigation ---
  const [waterSource, setWaterSource] = useState<string>("deep_well");
  const [wellDepth, setWellDepth] = useState<string>("310");
  const [pumpingGpm, setPumpingGpm] = useState<string>("450");
  const [irrigationSystem, setIrrigationSystem] = useState<string>("drip");
  const [seasonalWaterLimitation, setSeasonalWaterLimitation] = useState<string>("Summer peak electrical tariff limitation (12 PM - 6 PM)");
  const [waterCostAcreFoot, setWaterCostAcreFoot] = useState<string>("65");
  const [waterFile, setWaterFile] = useState<File | null>(null);

  // --- Step 4: Crop History ---
  const [historyRecords, setHistoryRecords] = useState<
    Array<{ seasonYear: number; cropName: string; yieldLbs: number; assessment: "successful" | "moderate" | "failed" }>
  >([
    { seasonYear: 2024, cropName: "Faba Bean (Legume Predecessor)", yieldLbs: 3200, assessment: "successful" },
    { seasonYear: 2025, cropName: "Sweet Corn", yieldLbs: 9500, assessment: "moderate" },
  ]);

  // --- Step 5: Farm Resources & Economics ---
  const [currency, setCurrency] = useState<string>("USD");
  const [seedCost, setSeedCost] = useState<string>("350");
  const [fertilizerCost, setFertilizerCost] = useState<string>("480");
  const [pumpingCost, setPumpingCost] = useState<string>("260");
  const [laborCost, setLaborCost] = useState<string>("850");
  const [seasonalBudget, setSeasonalBudget] = useState<string>("75000");

  // --- Step 6: Farmer Goals & Preferences ---
  const [primaryObjective, setPrimaryObjective] = useState<string>("maximize_profit");
  const [riskTolerance, setRiskTolerance] = useState<string>("moderate");
  const [preferredCrops, setPreferredCrops] = useState<string[]>(["broccoli", "lettuce_romaine", "spinach"]);
  const [excludedCropCode, setExcludedCropCode] = useState<string>("watermelon");
  const [excludedReason, setExcludedReason] = useState<string>("High peak water demand exceeds off-peak well pumping capacity.");

  // Initialize Map for Step 1
  useEffect(() => {
    if (!isOpen || currentStep !== 1 || !mapContainerRef.current) return;
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;
      const L = (await import("leaflet")).default;
      if (!isMounted || !mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [latitude, longitude],
        zoom: 13,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 18 }
      ).addTo(map);

      // Farm boundary polygon
      const bounds: [number, number][] = [
        [31.851, -111.006],
        [31.851, -110.994],
        [31.858, -110.994],
        [31.858, -111.006],
      ];

      L.polygon(bounds, {
        color: "#41644A",
        fillColor: "#41644A",
        fillOpacity: 0.25,
        weight: 3,
      }).addTo(map);

      // Location marker
      L.circleMarker([latitude, longitude], {
        radius: 8,
        color: "#D6C99A",
        fillColor: "#41644A",
        fillOpacity: 1,
        weight: 2,
      })
        .addTo(map)
        .bindPopup("<b>Farm Centroid</b><br>Green Valley, AZ")
        .openPopup();

      mapInstanceRef.current = map;
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, currentStep, latitude, longitude]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < 6) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSaveAndSubmit = async (isDraft = false) => {
    setIsSubmitting(true);
    setNotification(null);
    try {
      // 1. Save Farm Profile
      const farmRes = await fetch("/api/farmer/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: farmName,
          regionName,
          latitude,
          longitude,
          totalArea,
          areaUnit,
          productionType,
          description,
        }),
      });
      const farmData = await farmRes.json();
      const farmId = farmData.farm?.id || 1;

      // 2. Save Fields & Soil
      for (const f of fields) {
        await fetch("/api/farmer/fields", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            farmId,
            name: f.name,
            area: f.area,
            currentCrop: f.currentCrop,
            soilProfile: !soilUnknown
              ? {
                  texture: soilTexture,
                  soilPh: soilPh ? Number(soilPh) : undefined,
                  ecDsM: soilEc ? Number(soilEc) : undefined,
                  organicMatterPercent: soilOrganicMatter ? Number(soilOrganicMatter) : undefined,
                  drainageClass: soilDrainage,
                  salinityRisk: knownSalinity,
                  provenanceStatus: "farmer_reported",
                }
              : undefined,
          }),
        });
      }

      // 3. Save Preferences
      await fetch("/api/farmer/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          farmId,
          primaryObjective,
          riskTolerance,
          preferredCropCodes: preferredCrops,
          excludedCropCodes: excludedCropCode ? [{ code: excludedCropCode, reason: excludedReason }] : [],
          maxSeasonalBudget: seasonalBudget ? Number(seasonalBudget) : undefined,
        }),
      });

      // 4. Upload document if attached
      if (soilFile) {
        const formData = new FormData();
        formData.append("file", soilFile);
        formData.append("farmId", String(farmId));
        formData.append("fileType", "soil_test_pdf");
        await fetch("/api/farmer/upload", { method: "POST", body: formData }).catch(() => null);
      }

      onSuccess();
      onClose();
    } catch {
      setNotification("Failed to save farm profile. Please check inputs.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const STEPS = [
    { num: 1, title: "Farm Profile", icon: MapPin },
    { num: 2, title: "Soil Profile", icon: Sprout },
    { num: 3, title: "Water & Irrigation", icon: Droplet },
    { num: 4, title: "Crop History", icon: History },
    { num: 5, title: "Economics", icon: DollarSign },
    { num: 6, title: "Goals & Preferences", icon: Target },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-[#E2E6DA] bg-[#FFFFFF] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E2E6DA] bg-[#EEF0E6] px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-[#28301C]">
              Farmer Onboarding & Farm Intelligence
            </h2>
            <p className="text-xs text-[#687365]">
              Progressive registration — unmeasured fields can be marked as &quot;I don&apos;t know&quot; or skipped.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer p-1.5 rounded-lg text-[#687365] hover:bg-[#E2E6DA] hover:text-[#28301C] transition-all"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Step Indicator Bar */}
        <div className="grid grid-cols-6 border-b border-[#E2E6DA] bg-[#FFFFFF] px-4 py-2.5">
          {STEPS.map((s) => {
            const Icon = s.icon;
            const isDone = s.num < currentStep;
            const isCurrent = s.num === currentStep;
            return (
              <button
                key={s.num}
                type="button"
                onClick={() => setCurrentStep(s.num)}
                className={`flex flex-col items-center gap-1 py-1.5 text-center cursor-pointer transition-all ${
                  isCurrent
                    ? "border-b-2 border-[#41644A] text-[#41644A] font-bold"
                    : isDone
                    ? "text-[#41644A]/80 hover:text-[#41644A]"
                    : "text-[#687365]/60 hover:text-[#28301C]"
                }`}
              >
                <div
                  className={`flex size-6 items-center justify-center rounded-full text-[11px] font-bold ${
                    isCurrent
                      ? "bg-[#41644A] text-white"
                      : isDone
                      ? "bg-[#EEF0E6] text-[#41644A]"
                      : "bg-[#EEF0E6] text-[#687365]"
                  }`}
                >
                  {isDone ? <CheckCircle2 className="size-3.5" /> : s.num}
                </div>
                <span className="text-[10px] hidden sm:inline truncate max-w-[90px]">
                  {s.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* Step Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {notification && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
              <AlertTriangle className="size-4 shrink-0" />
              <span>{notification}</span>
            </div>
          )}

          {/* STEP 1: FARM PROFILE */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#28301C]">
                    Farm Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={farmName}
                    onChange={(e) => setFarmName(e.target.value)}
                    className="w-full rounded-xl border border-[#E2E6DA] bg-white px-3.5 py-2 text-xs text-[#28301C] focus:border-[#41644A] focus:outline-none"
                    placeholder="e.g. Rancho Santa Cruz"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#28301C]">
                    Region & Climate Zone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={regionName}
                    onChange={(e) => setRegionName(e.target.value)}
                    className="w-full rounded-xl border border-[#E2E6DA] bg-white px-3.5 py-2 text-xs text-[#28301C] focus:border-[#41644A] focus:outline-none"
                    placeholder="Green Valley, Pima County, AZ"
                  />
                </div>
              </div>

              {/* Map Polygon Drawing & Boundary */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#28301C] flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-[#41644A]" />
                    <span>Farm Boundary (Leaflet Map Vector Polygon)</span>
                  </label>
                  <span className="text-[11px] text-[#687365] font-mono">
                    Green Valley Prototype Center: {latitude.toFixed(4)}°N, {longitude.toFixed(4)}°W
                  </span>
                </div>
                <div
                  ref={mapContainerRef}
                  className="h-56 w-full rounded-xl border border-[#E2E6DA] overflow-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#28301C]">Total Cultivated Area</label>
                  <input
                    type="number"
                    value={totalArea}
                    onChange={(e) => setTotalArea(Number(e.target.value))}
                    className="w-full rounded-xl border border-[#E2E6DA] bg-white px-3.5 py-2 text-xs text-[#28301C]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#28301C]">Area Unit</label>
                  <select
                    value={areaUnit}
                    onChange={(e) => setAreaUnit(e.target.value as "acre" | "hectare" | "sqm")}
                    className="w-full rounded-xl border border-[#E2E6DA] bg-white px-3 py-2 text-xs text-[#28301C]"
                  >
                    <option value="acre">Acres</option>
                    <option value="hectare">Hectares</option>
                    <option value="sqm">Square Meters</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#28301C]">Production System</label>
                  <select
                    value={productionType}
                    onChange={(e) => setProductionType(e.target.value as "open_field" | "greenhouse" | "dual")}
                    className="w-full rounded-xl border border-[#E2E6DA] bg-white px-3 py-2 text-xs text-[#28301C]"
                  >
                    <option value="open_field">Open Field (Arid Sonoran)</option>
                    <option value="greenhouse">Protected Greenhouse / Shade Net</option>
                    <option value="dual">Both Open Field & Shade Net</option>
                  </select>
                </div>
              </div>

              {/* Subdivided Fields */}
              <div className="space-y-2 pt-2 border-t border-[#E2E6DA]">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#28301C]">
                    Subdivided Fields / Plots ({fields.length})
                  </h4>
                  <button
                    type="button"
                    onClick={() =>
                      setFields([
                        ...fields,
                        { name: `Field ${fields.length + 1}`, area: 10, currentCrop: "None" },
                      ])
                    }
                    className="cursor-pointer text-[11px] font-semibold text-[#41644A] hover:underline flex items-center gap-1"
                  >
                    <Plus className="size-3" />
                    <span>Add Plot</span>
                  </button>
                </div>
                <div className="space-y-2">
                  {fields.map((fld, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 rounded-xl border border-[#E2E6DA] bg-[#EEF0E6]/50 p-2.5 text-xs"
                    >
                      <input
                        type="text"
                        value={fld.name}
                        onChange={(e) => {
                          const updated = [...fields];
                          updated[idx].name = e.target.value;
                          setFields(updated);
                        }}
                        className="flex-1 rounded-lg border border-[#E2E6DA] bg-white px-2.5 py-1 text-xs"
                        placeholder="Field Name"
                      />
                      <input
                        type="number"
                        value={fld.area}
                        onChange={(e) => {
                          const updated = [...fields];
                          updated[idx].area = Number(e.target.value);
                          setFields(updated);
                        }}
                        className="w-20 rounded-lg border border-[#E2E6DA] bg-white px-2 py-1 text-xs"
                        placeholder="Acres"
                      />
                      <span className="text-[#687365] text-[11px]">acres</span>
                      <button
                        type="button"
                        onClick={() => setFields(fields.filter((_, i) => i !== idx))}
                        className="cursor-pointer text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: SOIL PROFILE */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between rounded-xl bg-[#EEF0E6] p-3 text-xs">
                <span className="text-[#28301C] font-medium">
                  Don&apos;t have laboratory soil tests yet?
                </span>
                <button
                  type="button"
                  onClick={() => setSoilUnknown(!soilUnknown)}
                  className={`cursor-pointer px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    soilUnknown
                      ? "bg-[#41644A] text-white border-[#41644A]"
                      : "bg-white text-[#28301C] border-[#E2E6DA] hover:bg-[#EEF0E6]"
                  }`}
                >
                  {soilUnknown ? "Marked as Unknown" : "Select: I don't know"}
                </button>
              </div>

              {!soilUnknown ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#28301C]">Soil Texture</label>
                      <select
                        value={soilTexture}
                        onChange={(e) => setSoilTexture(e.target.value)}
                        className="w-full rounded-xl border border-[#E2E6DA] bg-white px-3 py-2 text-xs"
                      >
                        <option value="sandy_loam">Sandy Loam</option>
                        <option value="loam">Loam</option>
                        <option value="clay_loam">Clay Loam</option>
                        <option value="gravelly_sand">Gravelly Sand (Arizo Complex)</option>
                        <option value="silt_loam">Silt Loam</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#28301C]">
                        Soil pH (e.g. 7.6 - 8.2)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={soilPh}
                        onChange={(e) => setSoilPh(e.target.value)}
                        className="w-full rounded-xl border border-[#E2E6DA] bg-white px-3.5 py-2 text-xs"
                        placeholder="7.8"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#28301C]">
                        Electrical Conductivity (ECe dS/m)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={soilEc}
                        onChange={(e) => setSoilEc(e.target.value)}
                        className="w-full rounded-xl border border-[#E2E6DA] bg-white px-3.5 py-2 text-xs"
                        placeholder="1.2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#28301C]">Organic Matter (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={soilOrganicMatter}
                        onChange={(e) => setSoilOrganicMatter(e.target.value)}
                        className="w-full rounded-xl border border-[#E2E6DA] bg-white px-3.5 py-2 text-xs"
                        placeholder="1.2"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#28301C]">Drainage Class</label>
                      <select
                        value={soilDrainage}
                        onChange={(e) => setSoilDrainage(e.target.value)}
                        className="w-full rounded-xl border border-[#E2E6DA] bg-white px-3 py-2 text-xs"
                      >
                        <option value="well_drained">Well Drained</option>
                        <option value="moderately_well">Moderately Well Drained</option>
                        <option value="poorly_drained">Poorly Drained</option>
                        <option value="excessively_drained">Excessively Drained</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#28301C]">Known Salinity Issues</label>
                      <select
                        value={knownSalinity}
                        onChange={(e) => setKnownSalinity(e.target.value)}
                        className="w-full rounded-xl border border-[#E2E6DA] bg-white px-3 py-2 text-xs"
                      >
                        <option value="none">None (Fresh)</option>
                        <option value="slight">Slight (Typical Arid Horizon)</option>
                        <option value="severe">Severe (Requires Leaching)</option>
                        <option value="unknown">Unknown</option>
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 space-y-1">
                  <p className="font-bold">Soil measurements marked as Unknown.</p>
                  <p>
                    GAIA will calibrate recommendations to regional USDA SSURGO Map Unit 53844, and will mark precision nutrient recommendations as requiring laboratory test verification.
                  </p>
                </div>
              )}

              {/* Lab Soil Test Report Upload */}
              <div className="rounded-xl border border-dashed border-[#E2E6DA] bg-[#EEF0E6]/30 p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#28301C]">
                  <Upload className="size-4 text-[#41644A]" />
                  <span>Upload Certified Laboratory Soil Test (PDF / PNG / JPG)</span>
                </div>
                <p className="text-[11px] text-[#687365]">
                  Uploaded reports remain in quarantine (`pending_review`) until verified, ensuring scientific data provenance.
                </p>
                <input
                  type="file"
                  accept="application/pdf,image/png,image/jpeg"
                  onChange={(e) => setSoilFile(e.target.files?.[0] || null)}
                  className="text-xs text-[#28301C] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-[#41644A] file:text-white file:text-xs file:font-semibold hover:file:bg-[#34503B] cursor-pointer"
                />
                {soilFile && (
                  <span className="text-[11px] text-[#41644A] font-medium block">
                    Selected: {soilFile.name} ({(soilFile.size / 1024).toFixed(1)} KB)
                  </span>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: WATER & IRRIGATION */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#28301C]">Water Source</label>
                  <select
                    value={waterSource}
                    onChange={(e) => setWaterSource(e.target.value)}
                    className="w-full rounded-xl border border-[#E2E6DA] bg-white px-3 py-2 text-xs"
                  >
                    <option value="deep_well">Deep Aquifer Agricultural Well (Santa Cruz Basin)</option>
                    <option value="canal_district">Irrigation District Surface Canal</option>
                    <option value="municipal_reclaimed">Municipal Reclaimed / Treated Water</option>
                    <option value="shallow_well">Shallow Alluvial Well</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#28301C]">Irrigation Delivery System</label>
                  <select
                    value={irrigationSystem}
                    onChange={(e) => setIrrigationSystem(e.target.value)}
                    className="w-full rounded-xl border border-[#E2E6DA] bg-white px-3 py-2 text-xs"
                  >
                    <option value="drip">Subsurface / Surface Precision Drip (DU &gt; 85%)</option>
                    <option value="sprinkler">Center Pivot / Overhead Micro-Sprinkler</option>
                    <option value="flood">Furrow / Gravity Flood</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#28301C]">Dynamic Well Depth (Feet)</label>
                  <input
                    type="number"
                    value={wellDepth}
                    onChange={(e) => setWellDepth(e.target.value)}
                    className="w-full rounded-xl border border-[#E2E6DA] bg-white px-3.5 py-2 text-xs"
                    placeholder="310"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#28301C]">Pumping Capacity (GPM)</label>
                  <input
                    type="number"
                    value={pumpingGpm}
                    onChange={(e) => setPumpingGpm(e.target.value)}
                    className="w-full rounded-xl border border-[#E2E6DA] bg-white px-3.5 py-2 text-xs"
                    placeholder="450"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#28301C]">Pumping Energy Cost ($/Acre-Foot)</label>
                  <input
                    type="number"
                    value={waterCostAcreFoot}
                    onChange={(e) => setWaterCostAcreFoot(e.target.value)}
                    className="w-full rounded-xl border border-[#E2E6DA] bg-white px-3.5 py-2 text-xs"
                    placeholder="65"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#28301C]">Seasonal Limitations & Pumping Rules</label>
                <input
                  type="text"
                  value={seasonalWaterLimitation}
                  onChange={(e) => setSeasonalWaterLimitation(e.target.value)}
                  className="w-full rounded-xl border border-[#E2E6DA] bg-white px-3.5 py-2 text-xs"
                  placeholder="e.g. Summer peak power tariff avoidance between 12 PM - 6 PM"
                />
              </div>
            </div>
          )}

          {/* STEP 4: CROP HISTORY */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-[#28301C]">
                    Multi-Season Crop History (Previous 2–5 Seasons)
                  </h3>
                  <p className="text-[11px] text-[#687365]">
                    Used to calculate biological nitrogen carryover credits and prevent soil-borne diseases.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setHistoryRecords([
                      ...historyRecords,
                      { seasonYear: 2024, cropName: "New Crop", yieldLbs: 4000, assessment: "successful" },
                    ])
                  }
                  className="cursor-pointer text-xs font-semibold text-[#41644A] hover:underline flex items-center gap-1"
                >
                  <Plus className="size-3.5" />
                  <span>Add Past Season</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {historyRecords.map((rec, idx) => (
                  <div
                    key={idx}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-[#E2E6DA] bg-[#EEF0E6]/40 p-3 text-xs"
                  >
                    <input
                      type="number"
                      value={rec.seasonYear}
                      onChange={(e) => {
                        const copy = [...historyRecords];
                        copy[idx].seasonYear = Number(e.target.value);
                        setHistoryRecords(copy);
                      }}
                      className="w-20 rounded-lg border border-[#E2E6DA] bg-white px-2 py-1 text-xs"
                    />
                    <input
                      type="text"
                      value={rec.cropName}
                      onChange={(e) => {
                        const copy = [...historyRecords];
                        copy[idx].cropName = e.target.value;
                        setHistoryRecords(copy);
                      }}
                      className="flex-1 min-w-[150px] rounded-lg border border-[#E2E6DA] bg-white px-2.5 py-1 text-xs"
                      placeholder="e.g. Faba Bean or Maize"
                    />
                    <input
                      type="number"
                      value={rec.yieldLbs}
                      onChange={(e) => {
                        const copy = [...historyRecords];
                        copy[idx].yieldLbs = Number(e.target.value);
                        setHistoryRecords(copy);
                      }}
                      className="w-24 rounded-lg border border-[#E2E6DA] bg-white px-2 py-1 text-xs"
                      placeholder="Yield (lbs)"
                    />
                    <select
                      value={rec.assessment}
                      onChange={(e) => {
                        const copy = [...historyRecords];
                        copy[idx].assessment = e.target.value as "successful" | "moderate" | "failed";
                        setHistoryRecords(copy);
                      }}
                      className="rounded-lg border border-[#E2E6DA] bg-white px-2 py-1 text-xs"
                    >
                      <option value="successful">Successful</option>
                      <option value="moderate">Moderate</option>
                      <option value="failed">Failed / Disease</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setHistoryRecords(historyRecords.filter((_, i) => i !== idx))}
                      className="cursor-pointer text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: ECONOMICS */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#28301C]">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full rounded-xl border border-[#E2E6DA] bg-white px-3 py-2 text-xs"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="EGP">EGP (LE)</option>
                  </select>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-[#28301C]">Seasonal Operating Budget Limit</label>
                  <input
                    type="number"
                    value={seasonalBudget}
                    onChange={(e) => setSeasonalBudget(e.target.value)}
                    className="w-full rounded-xl border border-[#E2E6DA] bg-white px-3.5 py-2 text-xs"
                    placeholder="75000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[#28301C]">Seeds/Transplants ($/acre)</label>
                  <input
                    type="number"
                    value={seedCost}
                    onChange={(e) => setSeedCost(e.target.value)}
                    className="w-full rounded-xl border border-[#E2E6DA] bg-white px-3 py-2 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[#28301C]">Fertilizer ($/acre)</label>
                  <input
                    type="number"
                    value={fertilizerCost}
                    onChange={(e) => setFertilizerCost(e.target.value)}
                    className="w-full rounded-xl border border-[#E2E6DA] bg-white px-3 py-2 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[#28301C]">Pumping Energy ($/acre)</label>
                  <input
                    type="number"
                    value={pumpingCost}
                    onChange={(e) => setPumpingCost(e.target.value)}
                    className="w-full rounded-xl border border-[#E2E6DA] bg-white px-3 py-2 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[#28301C]">Seasonal Labor ($/acre)</label>
                  <input
                    type="number"
                    value={laborCost}
                    onChange={(e) => setLaborCost(e.target.value)}
                    className="w-full rounded-xl border border-[#E2E6DA] bg-white px-3 py-2 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: GOALS & PREFERENCES */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#28301C]">Primary Farm Objective</label>
                  <select
                    value={primaryObjective}
                    onChange={(e) => setPrimaryObjective(e.target.value)}
                    className="w-full rounded-xl border border-[#E2E6DA] bg-white px-3 py-2 text-xs"
                  >
                    <option value="maximize_profit">Maximize Net Commercial Profit</option>
                    <option value="conserve_water">Conserve Groundwater / Minimize Acre-Feet</option>
                    <option value="minimize_risk">Minimize Climatic & Market Risk</option>
                    <option value="organic_certification">Transition to Certified Organic IPM</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#28301C]">Risk Tolerance</label>
                  <select
                    value={riskTolerance}
                    onChange={(e) => setRiskTolerance(e.target.value)}
                    className="w-full rounded-xl border border-[#E2E6DA] bg-white px-3 py-2 text-xs"
                  >
                    <option value="low">Conservative (Low Risk)</option>
                    <option value="moderate">Moderate (Balanced Extension Baseline)</option>
                    <option value="high">Aggressive (High Yield / Market Timing)</option>
                  </select>
                </div>
              </div>

              {/* Preferred Crops Selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#28301C]">
                  Preferred Crops (Click to select from GAIA 15-crop catalog)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {CROP_CATALOG.map((c) => {
                    const isSelected = preferredCrops.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setPreferredCrops(preferredCrops.filter((code) => code !== c.id));
                          } else {
                            setPreferredCrops([...preferredCrops, c.id]);
                          }
                        }}
                        className={`cursor-pointer px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                          isSelected
                            ? "bg-[#41644A] text-white border-[#41644A]"
                            : "bg-white text-[#28301C] border-[#E2E6DA] hover:bg-[#EEF0E6]"
                        }`}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Excluded Crops */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#28301C]">Excluded Crop (Do not recommend)</label>
                  <select
                    value={excludedCropCode}
                    onChange={(e) => setExcludedCropCode(e.target.value)}
                    className="w-full rounded-xl border border-[#E2E6DA] bg-white px-3 py-2 text-xs"
                  >
                    <option value="">None</option>
                    {CROP_CATALOG.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#28301C]">Reason for Exclusion</label>
                  <input
                    type="text"
                    value={excludedReason}
                    onChange={(e) => setExcludedReason(e.target.value)}
                    className="w-full rounded-xl border border-[#E2E6DA] bg-white px-3.5 py-2 text-xs"
                    placeholder="e.g. Lack of cold chain storage"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between border-t border-[#E2E6DA] bg-[#EEF0E6] px-6 py-3.5">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="flex items-center gap-1.5 text-xs font-semibold"
          >
            <ChevronLeft className="size-4" />
            <span>Previous</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => handleSaveAndSubmit(true)}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 text-xs text-[#687365]"
            >
              <Save className="size-3.5" />
              <span>Save Draft</span>
            </Button>

            {currentStep < 6 ? (
              <Button
                variant="default"
                onClick={handleNext}
                className="flex items-center gap-1.5 text-xs font-bold"
              >
                <span>Continue</span>
                <ChevronRight className="size-4" />
              </Button>
            ) : (
              <Button
                variant="default"
                onClick={() => handleSaveAndSubmit(false)}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 text-xs font-bold bg-[#41644A] text-white"
              >
                <CheckCircle2 className="size-4" />
                <span>{isSubmitting ? "Generating Farm ADSS..." : "Complete & Activate ADSS"}</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
