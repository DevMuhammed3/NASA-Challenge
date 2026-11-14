"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Layers,
  MapPin,
  Calendar,
  AlertTriangle,
  Info,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
} from "lucide-react";
import type LType from "leaflet";
import {
  GIBS_AVAILABLE_LAYERS,
  validateGibsLayerDate,
  type GibsLayerConfig,
} from "@/lib/services/nasa-gibs";
import { GREEN_VALLEY_LOCATION } from "@/lib/config/location";

interface NasaInteractiveMapProps {
  lat?: number;
  lon?: number;
  locationName?: string;
  onSelectCoordinates?: (lat: number, lon: number) => void;
}

export function NasaInteractiveMap({
  lat = GREEN_VALLEY_LOCATION.latitude,
  lon = GREEN_VALLEY_LOCATION.longitude,
  locationName = GREEN_VALLEY_LOCATION.name,
}: NasaInteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<LType.Map | null>(null);
  const leafletRef = useRef<typeof LType | null>(null);
  const gibsTileLayerRef = useRef<LType.TileLayer | null>(null);
  const markerRef = useRef<LType.Marker | null>(null);

  const [activeLayerId, setActiveLayerId] = useState<string>("true_color");
  const [selectedDate, setSelectedDate] = useState<string>("2024-06-01");
  const [mapReady, setMapReady] = useState<boolean>(false);
  const [layerOpacity, setLayerOpacity] = useState<number>(0.75);
  const [showSatelliteOverlay, setShowSatelliteOverlay] =
    useState<boolean>(true);

  const currentConfig: GibsLayerConfig =
    GIBS_AVAILABLE_LAYERS[activeLayerId] || GIBS_AVAILABLE_LAYERS.true_color;

  const validationResult = validateGibsLayerDate(activeLayerId, selectedDate);

  // Initialize Map
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;
      const L = (await import("leaflet")).default;
      if (!isMounted || !mapContainerRef.current) return;

      leafletRef.current = L;

      const map = L.map(mapContainerRef.current, {
        center: [lat, lon],
        zoom: 11,
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: "bottomleft" }).addTo(map);

      // Base Satellite Layer (Esri World Imagery)
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 18 },
      ).addTo(map);

      // Reference labels overlay
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 18, opacity: 0.7 },
      ).addTo(map);

      // Custom Location Marker Icon
      const customIcon = L.divIcon({
        className: "custom-gaia-marker",
        html: `
          <div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;background:#41644A;color:#FFFFFF;border-radius:50%;border:2px solid #FFFFFF;box-shadow:0 2px 10px rgba(36,59,42,0.3);font-weight:bold;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });

      const marker = L.marker([lat, lon], { icon: customIcon }).addTo(map);
      marker.bindPopup(`
        <div style="background:#FFFFFF;color:#28301C;padding:10px;border-radius:8px;border:1px solid #E2E6DA;font-family:'Rubik',sans-serif;font-size:12px;line-height:1.4;box-shadow:0 4px 12px rgba(36,59,42,0.12);">
          <strong style="color:#41644A;font-weight:700;">Prototype Location Marker</strong><br/>
          <span style="font-weight:600;">${locationName}</span><br/>
          <span style="font-family:monospace;font-size:10px;color:#687365;">${lat.toFixed(4)}°N, ${lon.toFixed(4)}°W</span><br/>
          <em style="font-size:10px;color:#687365;">(Marker only — not surveyed parcel boundary)</em>
        </div>
      `);
      markerRef.current = marker;

      // Fixed location marker: Clicking opens popup with Green Valley details
      marker.openPopup();

      mapInstanceRef.current = map;
      setMapReady(true);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update center & marker position when lat/lon change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const marker = markerRef.current;
    if (!map || !marker || !mapReady) return;

    map.setView([lat, lon], map.getZoom() < 8 ? 11 : map.getZoom(), {
      animate: true,
    });
    marker.setLatLng([lat, lon]);
    marker.setPopupContent(`
      <div style="background:#FFFFFF;color:#28301C;padding:10px;border-radius:8px;border:1px solid #E2E6DA;font-family:'Rubik',sans-serif;font-size:12px;line-height:1.4;box-shadow:0 4px 12px rgba(36,59,42,0.12);">
        <strong style="color:#41644A;font-weight:700;">Prototype Location Marker</strong><br/>
        <span style="font-weight:600;">${locationName}</span><br/>
        <span style="font-family:monospace;font-size:10px;color:#687365;">${lat.toFixed(4)}°N, ${lon.toFixed(4)}°W</span><br/>
        <em style="font-size:10px;color:#687365;">(Marker only — not surveyed parcel boundary)</em>
      </div>
    `);
  }, [lat, lon, locationName, mapReady]);

  // Update GIBS WMTS Layer when layer, date, or visibility changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = leafletRef.current;
    if (!map || !L || !mapReady) return;

    if (gibsTileLayerRef.current) {
      map.removeLayer(gibsTileLayerRef.current);
      gibsTileLayerRef.current = null;
    }

    if (!showSatelliteOverlay || !validationResult.available) {
      return;
    }

    const tileUrl = validationResult.tileUrlTemplate;
    if (!tileUrl) return;

    try {
      const gibsLayer = L.tileLayer(tileUrl, {
        maxNativeZoom: currentConfig.maxNativeZoom,
        maxZoom: 18,
        opacity: layerOpacity,
      });

      gibsLayer.addTo(map);
      gibsTileLayerRef.current = gibsLayer;
    } catch (err) {
      console.warn("Failed to mount GIBS WMTS layer:", err);
    }
  }, [
    activeLayerId,
    selectedDate,
    showSatelliteOverlay,
    layerOpacity,
    mapReady,
    validationResult.available,
    validationResult.tileUrlTemplate,
    currentConfig.maxNativeZoom,
  ]);

  // Handle Layer change with auto-default date
  const handleSelectLayer = (layerId: string) => {
    setActiveLayerId(layerId);
    const target = GIBS_AVAILABLE_LAYERS[layerId];
    if (target) {
      if (
        selectedDate < target.earliestDate ||
        selectedDate > target.latestDate
      ) {
        setSelectedDate(target.defaultDate);
      } else if (
        target.cadence === "yearly" &&
        !selectedDate.endsWith("-01-01")
      ) {
        setSelectedDate(`${selectedDate.slice(0, 4)}-01-01`);
      }
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-[#E2E6DA] bg-[#FFFFFF] p-3.5 sm:p-5 shadow-sm min-w-0">
      {/* Header & Layer Selector Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E6DA] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-[#41644A]" />
            <h3 className="text-base font-bold text-[#28301C]">
              NASA GIBS Satellite Imagery Visualizer
            </h3>
          </div>
          <p className="mt-0.5 text-xs text-[#687365]">
            Interactive WMTS raster tiles from NASA Global Imagery Browse
            Services (GIBS) centered on Green Valley, AZ.
          </p>
        </div>

        {/* Layer availability badge */}
        <div className="flex items-center gap-2">
          {validationResult.available ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#EEF0E6] px-2.5 py-0.5 text-xs font-semibold text-[#28301C] border border-[#E2E6DA]">
              <CheckCircle2 className="h-3 w-3 text-[#41644A]" />
              Layer Available
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-900 border border-rose-300">
              <AlertTriangle className="h-3 w-3 text-rose-600" />
              Unavailable for Date
            </span>
          )}
        </div>
      </div>

      {/* Layer Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E2E6DA] bg-[#EEF0E6]/60 p-3 text-xs">
        {/* Layer Selector */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-semibold text-[#687365] mr-1">Layer:</span>
          {Object.values(GIBS_AVAILABLE_LAYERS).map((layer) => (
            <button
              key={layer.id}
              onClick={() => handleSelectLayer(layer.id)}
              className={`rounded-lg px-2.5 py-1 text-xs transition-all duration-150 cursor-pointer font-medium active:scale-[0.98] ${
                activeLayerId === layer.id
                  ? "bg-[#41644A] text-white shadow-xs font-bold hover:bg-[#34503B]"
                  : "bg-[#FFFFFF] text-[#28301C] border border-[#E2E6DA] hover:bg-[#EEF0E6] hover:border-[#B5C2AE] hover:text-[#243B2A]"
              }`}
            >
              {layer.name}
            </button>
          ))}
        </div>

        {/* Date Selector & Visibility Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-[#41644A]" />
            <span className="font-semibold text-[#687365]">
              Observation Date:
            </span>
            <input
              type="date"
              value={selectedDate}
              min={currentConfig.earliestDate}
              max={currentConfig.latestDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-md border border-[#E2E6DA] bg-[#FFFFFF] px-2 py-1 text-xs font-mono text-[#28301C] focus:border-[#41644A] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 border-l-0 sm:border-l border-[#E2E6DA] pl-0 sm:pl-3">
            <button
              onClick={() => setShowSatelliteOverlay(!showSatelliteOverlay)}
              className={`flex items-center gap-1 rounded px-2.5 py-1 text-[11px] font-medium border cursor-pointer transition-all duration-150 active:scale-[0.98] ${
                showSatelliteOverlay
                  ? "border-[#41644A] text-[#28301C] bg-[#FFFFFF] font-semibold hover:bg-[#EEF0E6] hover:border-[#34503B]"
                  : "border-[#E2E6DA] text-[#687365] bg-[#EEF0E6] hover:bg-[#DCE2D5] hover:text-[#28301C]"
              }`}
            >
              {showSatelliteOverlay ? (
                <>
                  <Eye className="h-3 w-3 text-[#41644A]" /> Overlay Visible
                </>
              ) : (
                <>
                  <EyeOff className="h-3 w-3" /> Overlay Hidden
                </>
              )}
            </button>

            {showSatelliteOverlay && (
              <div className="flex items-center gap-1 text-[11px] text-[#5C5838]">
                <span>Opacity:</span>
                <input
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.05"
                  value={layerOpacity}
                  onChange={(e) => setLayerOpacity(Number(e.target.value))}
                  className="w-16 accent-[#41644A]"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Layer Metadata Details Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs font-mono rounded-lg bg-[#EEF0E6]/50 p-2.5 border border-[#E2E6DA]">
        <div>
          <span className="text-[#687365]">Selected Layer:</span>{" "}
          <strong className="text-[#28301C]">{currentConfig.name}</strong>
        </div>
        <div>
          <span className="text-[#687365]">Data Source:</span>{" "}
          <span className="text-[#28301C]">{currentConfig.source}</span>
        </div>
        <div>
          <span className="text-[#687365]">Effective Date:</span>{" "}
          <strong className="text-[#41644A]">
            {validationResult.effectiveDate}
          </strong>
        </div>
        <div>
          <span className="text-[#687365]">Cadence:</span>{" "}
          <span className="capitalize text-[#28301C]">
            {currentConfig.cadence}
          </span>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative h-[480px] w-full overflow-hidden rounded-xl border border-[#E2E6DA] shadow-inner">
        <div ref={mapContainerRef} className="h-full w-full z-0" />

        {/* Clear Unavailable State Overlay */}
        {!validationResult.available && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#FFFFFF]/90 backdrop-blur-sm p-6 text-center">
            <AlertTriangle className="h-10 w-10 text-rose-600 mb-2" />
            <h4 className="text-base font-bold text-[#28301C]">
              Satellite Layer Unavailable for Selected Date
            </h4>
            <p className="mt-1 max-w-md text-xs text-[#687365]">
              {validationResult.reason ||
                "This satellite layer cannot be rendered for the selected date. No fake imagery is displayed."}
            </p>
            <button
              onClick={() => setSelectedDate(currentConfig.defaultDate)}
              className="mt-3 rounded-md bg-[#41644A] px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#34503B] cursor-pointer"
            >
              Reset to Valid Composite ({currentConfig.defaultDate})
            </button>
          </div>
        )}

        {/* Map Watermark Notice */}
        <div className="absolute bottom-2 right-2 z-10 rounded-md bg-[#FFFFFF]/95 px-2 py-1 text-[10px] text-[#687365] border border-[#E2E6DA] backdrop-blur-sm shadow-xs font-mono max-w-[calc(100%-1rem)] truncate">
          <span>
            Marker: {lat.toFixed(4)}°N, {lon.toFixed(4)}°W (Prototype Location)
          </span>
        </div>
      </div>

      {/* Non-Numerical Disclaimer */}
      <div className="flex items-start gap-2.5 rounded-lg border border-[#E2E6DA] bg-[#EEF0E6]/50 p-3 text-xs text-[#687365]">
        <Info className="h-4 w-4 shrink-0 text-[#41644A] mt-0.5" />
        <div>
          <strong className="text-[#28301C]">Visualization Disclaimer:</strong>{" "}
          NASA GIBS WMTS satellite layers are provided solely for visual spatial
          reference. Rendered colorized tiles (including MODIS NDVI and Land
          Cover) are <strong className="underline">not</strong> numerical
          calibrated ground measurements.
        </div>
      </div>
    </div>
  );
}
