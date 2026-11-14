"use client";

import React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Radio,
  Layers,
  MapPin,
  Sparkles,
  DollarSign,
  Database,
} from "lucide-react";
import type { ProviderStatusItem } from "@/lib/types/environmental";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

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
          <Badge
            variant="outline"
            className="border-[#41644A]/40 bg-[#41644A]/15 text-[#41644A] font-semibold text-xs"
          >
            <CheckCircle2 className="size-3 mr-1 text-[#41644A]" />
            Connected
          </Badge>
        );
      case "Configured":
        return (
          <Badge
            variant="outline"
            className="border-primary/40 bg-primary/20 text-foreground font-semibold text-xs"
          >
            <CheckCircle2 className="size-3 mr-1 text-primary" />
            Configured
          </Badge>
        );
      case "Missing":
        return (
          <Badge
            variant="outline"
            className="border-border bg-background text-muted-foreground font-semibold text-xs"
          >
            <AlertTriangle className="size-3 mr-1" />
            Missing (Fallback Active)
          </Badge>
        );
      case "Error":
      default:
        return (
          <Badge
            variant="outline"
            className="border-destructive/40 bg-destructive/20 text-destructive font-semibold text-xs"
          >
            <XCircle className="size-3 mr-1 text-destructive" />
            Error
          </Badge>
        );
    }
  };

  const getProviderIcon = (id: string) => {
    switch (id) {
      case "nasa_power":
        return <Radio className="size-4 text-primary" />;
      case "nasa_gibs":
        return <Layers className="size-4 text-[#3C7A89]" />;
      case "google_geocoding":
        return <MapPin className="size-4 text-[#3C7A89]" />;
      case "gemini_ai":
        return <Sparkles className="size-4 text-foreground" />;
      case "usda_mymarketnews":
        return <DollarSign className="size-4 text-[#41644A]" />;
      case "usda_nass":
        return <Database className="size-4 text-primary" />;
      default:
        return <Radio className="size-4 text-primary" />;
    }
  };

  return (
    <Card className="border-border bg-card/90 shadow-xl backdrop-blur-xs">
      <CardHeader className="p-5 pb-3 flex flex-wrap items-center justify-between gap-3 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block size-2 rounded-full bg-[#41644A] animate-pulse" />
            <CardTitle className="text-base font-bold text-foreground">
              Active Data Providers
            </CardTitle>
          </div>
          <CardDescription className="mt-0.5 text-xs text-muted-foreground">
            Live provider telemetry responses (not hardcoded statuses). Excludes
            SoilGrids, FAOSTAT, and paid imagery.
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw
            data-icon="inline-start"
            className={`size-3 ${isLoading ? "animate-spin" : ""}`}
          />
          Verify Connections
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-border bg-background/60">
              <TableHead className="font-bold text-foreground">
                Provider
              </TableHead>
              <TableHead className="font-bold text-foreground">
                Status
              </TableHead>
              <TableHead className="font-bold text-foreground">
                Data Ingested
              </TableHead>
              <TableHead className="text-right font-bold text-foreground">
                Diagnostic Note
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {providers.map((p) => (
              <TableRow
                key={p.id}
                className="border-border hover:bg-background/40"
              >
                <TableCell className="font-medium text-foreground">
                  <div className="flex items-center gap-2">
                    {getProviderIcon(p.id)}
                    <span>{p.name}</span>
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {getStatusBadge(p.status)}
                </TableCell>
                <TableCell className="text-foreground/90 font-mono text-[11px]">
                  {p.dataProvided}
                </TableCell>
                <TableCell className="text-right text-[11px] text-muted-foreground">
                  {p.message}
                  {p.latencyMs !== undefined && (
                    <span className="ml-2 font-mono text-[10px] text-muted-foreground/80">
                      ({p.latencyMs}ms)
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
