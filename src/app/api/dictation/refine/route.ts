import { NextRequest, NextResponse } from "next/server";
import { refineTextWithCloud } from "@/lib/refine/cloud";
import { refineTextWithLocal } from "@/lib/refine/local";
import type { RefineRequest, RefineResponse } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body: RefineRequest = await request.json();

    // Validate request
    if (!body.text) {
      return NextResponse.json(
        { success: false, error: "Text is required" },
        { status: 400 }
      );
    }

    if (!body.mode || !["developer", "concise", "professional", "raw"].includes(body.mode)) {
      return NextResponse.json(
        { success: false, error: "Mode must be 'developer', 'concise', 'professional', or 'raw'" },
        { status: 400 }
      );
    }

    if (!body.processingMode || !["cloud", "local"].includes(body.processingMode)) {
      return NextResponse.json(
        { success: false, error: "Processing mode must be 'cloud' or 'local'" },
        { status: 400 }
      );
    }

    let refinedText = body.text;

    // Skip refinement for 'raw' mode
    if (body.mode !== "raw") {
      // Refine based on processing mode
      if (body.processingMode === "cloud") {
        refinedText = await refineTextWithCloud(body.text, body.mode);
      } else {
        refinedText = await refineTextWithLocal(body.text, body.mode);
      }
    }

    // Return response
    const response: RefineResponse = {
      success: true,
      text: refinedText,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Refinement API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
