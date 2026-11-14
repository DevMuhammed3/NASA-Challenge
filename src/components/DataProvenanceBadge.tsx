"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Clock,
  HelpCircle,
  AlertTriangle,
  FileText,
  UserCheck,
  Calculator,
  ExternalLink,
  FlaskConical,
} from "lucide-react";
import type { DataPoint, DataProvenanceStatus } from "@/lib/types/provenance";

interface DataProvenanceBadgeProps {
  dataPoint?: DataPoint<unknown>;
  status?: DataProvenanceStatus;
  source?: string;
  methodology?: string;
  unavailableReason?: string;
  requiredMeasurementOrSource?: string;
  sourceUrl?: string;
  className?: string;
  compact?: boolean;
  placement?: "top" | "bottom" | "auto";
  align?: "left" | "right" | "center";
}

export function DataProvenanceBadge({
  dataPoint,
  status: propStatus,
  source: propSource,
  methodology: propMethodology,
  unavailableReason: propUnavailableReason,
  requiredMeasurementOrSource: propRequiredSource,
  sourceUrl: propSourceUrl,
  className = "",
  compact = false,
  placement = "bottom",
  align = "right",
}: DataProvenanceBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);

  const status = dataPoint?.status ?? propStatus ?? "calculated";
  const source = dataPoint?.source ?? propSource ?? "GAIA Deterministic Engine";
  const methodology = dataPoint?.methodology ?? propMethodology;
  const unavailableReason =
    dataPoint?.unavailableReason ?? propUnavailableReason;
  const requiredMeasurement =
    dataPoint?.requiredMeasurementOrSource ?? propRequiredSource;
  const sourceUrl = dataPoint?.sourceUrl ?? propSourceUrl;
  const observationDate = dataPoint?.observationDate;
  const retrievedAt = dataPoint?.retrievedAt;

  const getStatusConfig = () => {
    switch (status) {
      case "live_api":
        return {
          label: "Live API",
          color: "border-[#41644A]/50 bg-[#EEF0E6] text-[#28301C]",
          dot: "bg-[#41644A]",
          icon: CheckCircle2,
        };
      case "official_dataset":
        return {
          label: "Official Dataset",
          color: "border-[#41644A]/50 bg-[#EEF0E6] text-[#28301C]",
          dot: "bg-[#41644A]",
          icon: FileText,
        };
      case "cached_api":
        return {
          label: "Cached API",
          color: "border-sky-600/30 bg-sky-100 text-sky-900",
          dot: "bg-sky-600",
          icon: Clock,
        };
      case "farmer_provided":
        return {
          label: "Farmer Provided",
          color: "border-stone-400 bg-stone-100 text-stone-900",
          dot: "bg-stone-600",
          icon: UserCheck,
        };
      case "calculated":
        return {
          label: "Calculated",
          color: "border-[#E2E6DA] bg-[#FFFFFF] text-[#28301C]",
          dot: "bg-[#41644A]",
          icon: Calculator,
        };
      case "unavailable":
        return {
          label: "Unavailable",
          color: "border-rose-400 bg-rose-100 text-rose-900",
          dot: "bg-rose-600",
          icon: AlertTriangle,
        };
      case "demo_test_only":
        return {
          label: "Test Only",
          color: "border-amber-400 bg-amber-100 text-amber-900",
          dot: "bg-amber-600",
          icon: AlertTriangle,
        };
      default:
        return {
          label: "Verified",
          color: "border-[#E2E6DA] bg-[#FFFFFF] text-[#28301C]",
          dot: "bg-[#41644A]",
          icon: CheckCircle2,
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const positionClasses =
    placement === "top"
      ? "bottom-full mb-2"
      : "top-full mt-2";

  const alignClasses =
    align === "right"
      ? "right-0"
      : align === "left"
      ? "left-0"
      : "left-1/2 -translate-x-1/2";

  return (
    <div
      className={`relative inline-flex items-center ${isOpen ? "z-50" : "z-10"} ${className}`}
      data-state={isOpen ? "open" : "closed"}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all cursor-pointer shadow-xs hover:brightness-95 active:scale-95 ${config.color}`}
        title="View Data Provenance"
        aria-label="Data provenance information"
      >
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
        {!compact && <span>{config.label}</span>}
        <Icon className="w-3 h-3 opacity-80" />
      </button>

      {isOpen && (
        <div
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          className={`absolute ${positionClasses} ${alignClasses} z-[100] w-[calc(100vw-2.5rem)] max-w-xs sm:w-80 p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E2E6DA] shadow-2xl text-xs text-[#28301C] space-y-2 pointer-events-auto ring-1 ring-black/5 animate-in fade-in-0 zoom-in-95 duration-150`}
        >
          <div className="flex items-center justify-between border-b border-[#E2E6DA] pb-1.5">
            <span className="font-semibold text-[#28301C] flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${config.dot}`} />
              Provenance: {config.label}
            </span>
            {sourceUrl && (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#687365] hover:text-[#41644A] flex items-center gap-0.5"
                title="View Official Source"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          <div>
            <span className="text-[10px] uppercase tracking-wider text-[#687365] block font-semibold">
              Official Source
            </span>
            <span className="font-medium text-[#28301C]">{source}</span>
          </div>

          {methodology && (
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[#687365] block font-semibold">
                Methodology
              </span>
              <p className="text-[11px] text-[#28301C]/90 leading-relaxed">
                {methodology}
              </p>
            </div>
          )}

          {observationDate && (
            <div className="flex justify-between text-[10px] text-[#687365] pt-1 border-t border-[#E2E6DA]">
              <span>Date: {observationDate}</span>
              {retrievedAt && (
                <span>Retrieved: {retrievedAt.split("T")[0]}</span>
              )}
            </div>
          )}

          {status === "unavailable" && unavailableReason && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 space-y-1">
              <div className="flex items-center gap-1 text-rose-900 font-semibold text-[11px]">
                <AlertTriangle className="w-3 h-3 flex-shrink-0 text-rose-600" />
                <span>Why Unavailable?</span>
              </div>
              <p className="text-[11px] text-rose-800 leading-snug">
                {unavailableReason}
              </p>
              {requiredMeasurement && (
                <div className="pt-1 mt-1 border-t border-rose-200 flex items-start gap-1 text-[11px] text-[#28301C]">
                  <FlaskConical className="w-3.5 h-3.5 flex-shrink-0 text-[#41644A] mt-0.5" />
                  <span>
                    <strong>Required to obtain:</strong> {requiredMeasurement}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
