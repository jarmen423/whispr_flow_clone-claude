import { NextRequest, NextResponse } from "next/server";
import { transcribeWithCloud } from "@/lib/transcribe/cloud";
import { transcribeWithLocal } from "@/lib/transcribe/local";
import type { TranscribeRequest, TranscribeResponse } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body: TranscribeRequest = await request.json();

    // Validate request
    if (!body.audio) {
      return NextResponse.json(
        { success: false, error: "Audio data is required" },
        { status: 400 }
      );
    }

    if (!body.mode || !["cloud", "local"].includes(body.mode)) {
      return NextResponse.json(
        { success: false, error: "Mode must be 'cloud' or 'local'" },
        { status: 400 }
      );
    }

    // Validate audio size (max 5MB)
    const audioSize = Buffer.byteLength(body.audio, "base64");
    if (audioSize > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "Audio size exceeds 5MB limit" },
        { status: 400 }
      );
    }

    let text = "";

    // Transcribe based on mode
    if (body.mode === "cloud") {
      text = await transcribeWithCloud(body.audio);
    } else {
      text = await transcribeWithLocal(body.audio);
    }

    // Return response
    const response: TranscribeResponse = {
      success: true,
      text,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Transcription API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
