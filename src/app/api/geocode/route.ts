import { NextRequest, NextResponse } from "next/server";
import { resolveLocationCoordinates } from "@/lib/services/geocoding";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || searchParams.get("address") || "";

    const result = await resolveLocationCoordinates(query);
    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/geocode error:", error);
    return NextResponse.json(
      {
        status: "Error",
        error: error instanceof Error ? error.message : "Geocoding failed",
      },
      { status: 500 }
    );
  }
}
