import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";

const execAsync = promisify(exec);

const WHISPER_BINARY = process.env.WHISPER_BINARY_PATH || "whisper";
const WHISPER_MODEL = process.env.WHISPER_MODEL_PATH || "";

export async function transcribeWithLocal(
  audioBase64: string
): Promise<string> {
  // Validate Whisper binary
  try {
    await execAsync(`which ${WHISPER_BINARY}`);
  } catch {
    throw new Error("Whisper binary not found. Please install Whisper.cpp.");
  }

  // Validate model file
  if (!WHISPER_MODEL) {
    throw new Error("WHISPER_MODEL_PATH not configured");
  }

  // Create temporary file for audio
  const tempFile = `/tmp/temp_audio_${Date.now()}.wav`;

  try {
    // Decode base64 and write to temp file
    const buffer = Buffer.from(audioBase64, "base64");
    await fs.promises.writeFile(tempFile, buffer);

    // Run Whisper
    const command = `${WHISPER_BINARY} -m ${WHISPER_MODEL} -f ${tempFile} -nt 4 -otxt`;
    const { stdout } = await execAsync(command, {
      timeout: 60000, // 60s timeout
    });

    // Extract text from output (Whisper outputs to stdout)
    const text = stdout.trim();

    // Clean up temp file
    await fs.promises.unlink(tempFile);

    return text;
  } catch (error) {
    // Clean up temp file on error
    try {
      await fs.promises.unlink(tempFile);
    } catch {}

    console.error("Local transcription error:", error);
    throw new Error(
      `Local transcription failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export async function refineWithLocal(
  text: string,
  systemPrompt: string
): Promise<string> {
  const ollamaUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  const ollamaModel = process.env.OLLAMA_MODEL || "llama3.2:1b";

  try {
    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: ollamaModel,
        prompt: `${systemPrompt}\n\n${text}`,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response || text;
  } catch (error) {
    console.error("Local refinement error:", error);
    throw new Error(
      `Local refinement failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
