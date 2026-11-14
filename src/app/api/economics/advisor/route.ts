import { NextRequest, NextResponse } from "next/server";
import { generateFarmEconomicAnalysis } from "@/lib/services/gemini-economic-advisor";
import { isAiAdvisorConfigured } from "@/lib/services/gemini-advisor";
import {
  CropEconomicComparisonItem,
  FarmFinancialResults,
  FinancialScenario,
} from "@/lib/types/economics";

export async function POST(request: NextRequest) {
  try {
    if (!isAiAdvisorConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Neither GEMINI_API_KEY nor OLLAMA_API_KEY is configured on the server. Please configure an API key to enable AI Economic Analysis.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      cropName = "Tomato",
      acreage = 1.0,
      financialResults,
      scenarios,
      comparisonTop5,
    } = body as {
      cropName: string;
      acreage: number;
      financialResults: FarmFinancialResults;
      scenarios: Record<string, FinancialScenario>;
      comparisonTop5: CropEconomicComparisonItem[];
    };

    if (!financialResults || !scenarios) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required financial baseline or scenarios data.",
        },
        { status: 400 }
      );
    }

    const advisorReport = await generateFarmEconomicAnalysis({
      cropName,
      acreage,
      financialResults,
      scenarios,
      comparisonTop5: comparisonTop5 || [],
    });

    return NextResponse.json({
      success: true,
      report: advisorReport,
    });
  } catch (error) {
    console.error("Error in /api/economics/advisor:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to generate AI economic analysis",
      },
      { status: 500 }
    );
  }
}
