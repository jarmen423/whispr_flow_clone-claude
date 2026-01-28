import ZAI from "z-ai-web-dev-sdk";

// Initialize Z-AI SDK singleton
let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

export async function transcribeWithCloud(
  audioBase64: string
): Promise<string> {
  try {
    const zai = await getZAI();
    const response = await zai.audio.asr.create({
      file_base64: audioBase64,
    });

    return response.text || "";
  } catch (error) {
    console.error("Cloud transcription error:", error);
    throw new Error(
      `Cloud transcription failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export async function refineWithCloud(
  text: string,
  systemPrompt: string
): Promise<string> {
  try {
    const zai = await getZAI();
    const response = await zai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "assistant", content: systemPrompt },
        { role: "user", content: text },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    return response.choices[0]?.message?.content || text;
  } catch (error) {
    console.error("Cloud refinement error:", error);
    throw new Error(
      `Cloud refinement failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
