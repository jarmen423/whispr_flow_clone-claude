export type ProcessingMode = "cloud" | "local";

export type RefinementMode = "developer" | "concise" | "professional" | "raw";

export interface TranscribeRequest {
  audio: string; // base64 encoded audio
  mode: ProcessingMode;
  refinementMode?: RefinementMode;
}

export interface TranscribeResponse {
  success: boolean;
  text?: string;
  refinedText?: string;
  error?: string;
}

export interface RefineRequest {
  text: string;
  mode: RefinementMode;
  processingMode: ProcessingMode;
}

export interface RefineResponse {
  success: boolean;
  text?: string;
  error?: string;
}

export interface AgentStatus {
  online: number;
  agents: Array<{
    id: string;
    connected: boolean;
    lastActivity: number;
  }>;
}

export type LiveActivityType = "recording" | "processing" | "success" | "error";

export interface LiveActivity {
  type: LiveActivityType;
  message: string;
  timestamp: number;
  agentId?: string;
}

export interface Settings {
  processingMode: ProcessingMode;
  refinementMode: RefinementMode;
  autoCopy: boolean;
}

export interface DictationItem {
  id: string;
  originalText: string;
  refinedText: string;
  timestamp: number;
  duration: number;
}
