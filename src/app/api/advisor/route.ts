import { NextRequest, NextResponse } from "next/server";
import {
  generateEnvironmentalAnalysis,
  isAiAdvisorConfigured,
} from "@/lib/services/gemini-advisor";
import { getHistoricalEnvironmentalData } from "@/lib/services/nasa-power";
import type { EnvironmentalDataResponse } from "@/lib/types/environmental";

export async function POST(req: NextRequest) {
  try {
    if (!isAiAdvisorConfigured()) {
      return NextResponse.json(
        {
          status: "Error",
          error:
            "No AI Advisor is configured on the server (neither Gemini nor Ollama). The rest of the GAIA application continues operating with live NASA data.",
        },
        { status: 503 }
      );
    }

    const body = await req.json().catch(() => ({}));
    let telemetry: EnvironmentalDataResponse | null = body.telemetry || null;

    if (!telemetry && typeof body.lat === "number" && typeof body.lon === "number") {
      telemetry = await getHistoricalEnvironmentalData(body.lat, body.lon);
    }

    if (!telemetry || !telemetry.summaryStats) {
      return NextResponse.json(
        {
          status: "Error",
          error: "Missing required environmental telemetry payload.",
        },
        { status: 400 }
      );
    }

    const analysis = await generateEnvironmentalAnalysis(telemetry);

    return NextResponse.json({
      status: "Success",
      analysis,
    });
  } catch (error) {
    console.error("POST /api/advisor error:", error);
    return NextResponse.json(
      {
        status: "Error",
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate AI advisor analysis",
      },
      { status: 500 }
    );
  }
}
