"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, RefreshCw, Radio, Layers, MapPin, Sparkles, DollarSign, Database } from "lucide-react";
import type { ProviderStatusItem } from "@/lib/types/environmental";

interface DataSourcesPanelProps {
  providers: ProviderStatusItem[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function DataSourcesPanel({
  providers,
  isLoading,
  onRefresh,
}: DataSourcesPanelProps) {
  const getStatusBadge = (status: ProviderStatusItem["status"]) => {
    switch (status) {
      case "Connected":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#52B788]/20 px-2.5 py-0.5 text-xs font-medium text-[#52B788] border border-[#52B788]/40">
            <CheckCircle2 className="h-3 w-3" />
            Connected
          </span>
        );
      case "Configured":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#9A7E3B]/20 px-2.5 py-0.5 text-xs font-medium text-[#D2CF9A] border border-[#9A7E3B]/40">
            <CheckCircle2 className="h-3 w-3 text-[#9A7E3B]" />
            Configured
          </span>
        );
      case "Missing":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#435133]/40 px-2.5 py-0.5 text-xs font-medium text-[#9FA37C] border border-[#435133]">
            <AlertTriangle className="h-3 w-3" />
            Missing (Fallback Active)
          </span>
        );
      case "Error":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-900/30 px-2.5 py-0.5 text-xs font-medium text-red-300 border border-red-700/50">
            <XCircle className="h-3 w-3 text-red-400" />
            Error
          </span>
        );
    }
  };

  const getProviderIcon = (id: string) => {
    switch (id) {
      case "nasa_power":
        return <Radio className="h-4 w-4 text-[#9A7E3B]" />;
      case "nasa_gibs":
        return <Layers className="h-4 w-4 text-[#74C69D]" />;
      case "google_geocoding":
        return <MapPin className="h-4 w-4 text-[#48CAE4]" />;
      case "gemini_ai":
        return <Sparkles className="h-4 w-4 text-[#D2CF9A]" />;
      case "usda_mymarketnews":
        return <DollarSign className="h-4 w-4 text-[#52B788]" />;
      case "usda_nass":
        return <Database className="h-4 w-4 text-[#9A7E3B]" />;
      default:
        return <Radio className="h-4 w-4 text-[#9A7E3B]" />;
    }
  };

  return (
    <div className="rounded-2xl border border-[#435133] bg-[#323D25]/90 p-5 shadow-xl backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#435133]/60 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-[#52B788] animate-pulse" />
            <h3 className="text-base font-bold text-[#D2CF9A]">Active Data Providers</h3>
          </div>
          <p className="mt-0.5 text-xs text-[#9FA37C]">
            Live provider telemetry responses (not hardcoded statuses). Excludes SoilGrids, FAOSTAT, and paid imagery.
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#435133] bg-[#28301C] px-3 py-1.5 text-xs font-medium text-[#D2CF9A] transition hover:border-[#9A7E3B] hover:text-[#9A7E3B] disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
          Verify Connections
        </button>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#435133]/60 text-[11px] font-semibold uppercase tracking-wider text-[#9FA37C]">
              <th className="py-2.5 pr-4">Provider</th>
              <th className="py-2.5 pr-4">Status</th>
              <th className="py-2.5 pr-4">Data Ingested</th>
              <th className="py-2.5 text-right">Diagnostic Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#435133]/30">
            {providers.map((p) => (
              <tr key={p.id} className="transition hover:bg-[#28301C]/40">
                <td className="py-3 pr-4 font-medium text-[#D2CF9A]">
                  <div className="flex items-center gap-2">
                    {getProviderIcon(p.id)}
                    <span>{p.name}</span>
                  </div>
                </td>
                <td className="py-3 pr-4 whitespace-nowrap">
                  {getStatusBadge(p.status)}
                </td>
                <td className="py-3 pr-4 text-[#D2CF9A]/90">
                  <span className="font-mono text-[11px]">{p.dataProvided}</span>
                </td>
                <td className="py-3 text-right text-[11px] text-[#9FA37C]">
                  {p.message}
                  {p.latencyMs !== undefined && (
                    <span className="ml-2 font-mono text-[10px] text-[#9FA37C]/80">
                      ({p.latencyMs}ms)
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
