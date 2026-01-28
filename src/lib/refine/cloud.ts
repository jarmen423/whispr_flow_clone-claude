import { refineWithCloud } from "@/lib/transcribe/cloud";

export async function refineTextWithCloud(
  text: string,
  mode: "developer" | "concise" | "professional"
): Promise<string> {
  // Import prompts dynamically to avoid circular dependencies
  const { REFINEMENT_PROMPTS } = await import("@/lib/prompts");
  const systemPrompt = REFINEMENT_PROMPTS[mode];

  return refineWithCloud(text, systemPrompt);
}
