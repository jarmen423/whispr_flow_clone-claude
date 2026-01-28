import { refineWithLocal } from "@/lib/transcribe/local";

export async function refineTextWithLocal(
  text: string,
  mode: "developer" | "concise" | "professional"
): Promise<string> {
  // Import prompts dynamically to avoid circular dependencies
  const { REFINEMENT_PROMPTS } = await import("@/lib/prompts");
  const systemPrompt = REFINEMENT_PROMPTS[mode];

  return refineWithLocal(text, systemPrompt);
}
