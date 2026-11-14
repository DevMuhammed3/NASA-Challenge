import { NextRequest, NextResponse } from "next/server";
import { FarmerStorage } from "@/lib/farmer/farmer-storage";

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const farmId = Number(formData.get("farmId") || "1");
    const fileType = (formData.get("fileType") as string) || "soil_test_pdf";

    if (!file) {
      return NextResponse.json(
        { status: "Error", error: "No file uploaded." },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          status: "Error",
          error: `Unsupported file format (${file.type}). Allowed: PDF, JPEG, PNG, WEBP.`,
        },
        { status: 415 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { status: "Error", error: "File exceeds 10MB limit." },
        { status: 413 }
      );
    }

    // Sanitize file name
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `uploads/farm_${farmId}/${Date.now()}_${sanitizedName}`;

    const doc = FarmerStorage.addDocument({
      farmId,
      fileName: sanitizedName,
      fileType: fileType as "soil_test_pdf" | "water_test_pdf" | "invoice" | "photo",
      fileSize: file.size,
      mimeType: file.type,
      storagePath,
      verificationStatus: "pending_review",
    });

    return NextResponse.json({
      status: "Success",
      document: doc,
      notice:
        "Document uploaded securely. Uploaded diagnostic reports remain in quarantine ('pending_review') until verified by an agronomic review process and do not automatically overwrite physical soil physics.",
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: "Error",
        error: err instanceof Error ? err.message : "Failed to process document upload",
      },
      { status: 500 }
    );
  }
}
