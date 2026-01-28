import { Server } from "socket.io";

const PORT = process.env.WS_PORT ? parseInt(process.env.WS_PORT) : 3001;
const HEARTBEAT_INTERVAL = process.env.WS_HEARTBEAT_INTERVAL
  ? parseInt(process.env.WS_HEARTBEAT_INTERVAL)
  : 5000;
const STALE_THRESHOLD = process.env.WS_STALE_THRESHOLD
  ? parseInt(process.env.WS_STALE_THRESHOLD)
  : 30000;

interface AgentInfo {
  id: string;
  lastActivity: number;
  connected: boolean;
}

interface LiveActivity {
  type: "recording" | "processing" | "success" | "error";
  message: string;
  timestamp: number;
  agentId?: string;
}

class WebSocketService {
  private io: Server;
  private agents: Map<string, AgentInfo> = new Map();
  private liveActivities: LiveActivity[] = [];
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.io = new Server(PORT, {
      cors: {
        origin: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    this.setupNamespaces();
    this.startHeartbeatMonitor();
    this.startStaleConnectionCheck();

    console.log(`🚀 WebSocket service running on port ${PORT}`);
  }

  private setupNamespaces() {
    // Agent namespace for desktop connections
    const agentNamespace = this.io.of("/agent");

    agentNamespace.on("connection", (socket) => {
      const agentId = socket.id;
      console.log(`📱 Agent connected: ${agentId}`);

      // Track agent connection
      this.agents.set(agentId, {
        id: agentId,
        lastActivity: Date.now(),
        connected: true,
      });

      // Broadcast agent status to UI
      this.broadcastAgentStatus();

      // Handle incoming audio from agent
      socket.on("process_audio", async (data) => {
        console.log(`🎤 Processing audio from agent ${agentId}`);
        this.updateAgentActivity(agentId);

        try {
          // Forward to Next.js API for processing
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/dictation/transcribe`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            }
          );

          const result = await response.json();

          if (response.ok) {
            // Send result back to agent
            socket.emit("dictation_result", {
              success: true,
              text: result.text,
              refinedText: result.refinedText,
            });

            // Add success activity
            this.addLiveActivity({
              type: "success",
              message: "Dictation completed successfully",
              timestamp: Date.now(),
              agentId,
            });
          } else {
            throw new Error(result.error || "Transcription failed");
          }
        } catch (error) {
          console.error("❌ Error processing audio:", error);
          socket.emit("dictation_result", {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });

          // Add error activity
          this.addLiveActivity({
            type: "error",
            message: `Dictation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            timestamp: Date.now(),
            agentId,
          });
        }
      });

      // Handle heartbeat from agent
      socket.on("ping", () => {
        this.updateAgentActivity(agentId);
        socket.emit("pong");
      });

      socket.on("disconnect", () => {
        console.log(`📱 Agent disconnected: ${agentId}`);
        this.agents.delete(agentId);
        this.broadcastAgentStatus();
      });
    });

    // UI namespace for web connections
    const uiNamespace = this.io.of("/ui");

    uiNamespace.on("connection", (socket) => {
      console.log(`🌐 UI connected: ${socket.id}`);

      // Send current agent status immediately
      socket.emit("agent_status", {
        online: this.getOnlineAgentCount(),
        agents: Array.from(this.agents.values()).map((agent) => ({
          id: agent.id,
          connected: agent.connected,
          lastActivity: agent.lastActivity,
        })),
      });

      // Send recent live activities
      socket.emit("live_activities", this.liveActivities.slice(-10));

      socket.on("disconnect", () => {
        console.log(`🌐 UI disconnected: ${socket.id}`);
      });
    });
  }

  private updateAgentActivity(agentId: string) {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.lastActivity = Date.now();
    }
  }

  private broadcastAgentStatus() {
    const uiNamespace = this.io.of("/ui");
    uiNamespace.emit("agent_status", {
      online: this.getOnlineAgentCount(),
      agents: Array.from(this.agents.values()).map((agent) => ({
        id: agent.id,
        connected: agent.connected,
        lastActivity: agent.lastActivity,
      })),
    });
  }

  private getOnlineAgentCount(): number {
    return Array.from(this.agents.values()).filter(
      (agent) => agent.connected
    ).length;
  }

  private addLiveActivity(activity: LiveActivity) {
    this.liveActivities.push(activity);

    // Keep only last 50 activities
    if (this.liveActivities.length > 50) {
      this.liveActivities = this.liveActivities.slice(-50);
    }

    // Broadcast to all UI clients
    const uiNamespace = this.io.of("/ui");
    uiNamespace.emit("update", activity);
  }

  private startHeartbeatMonitor() {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      this.agents.forEach((agent) => {
        const inactiveTime = now - agent.lastActivity;
        if (inactiveTime > HEARTBEAT_INTERVAL) {
          console.log(
            `⚠️  Agent ${agent.id} inactive for ${inactiveTime}ms`
          );
        }
      });
    }, HEARTBEAT_INTERVAL);
  }

  private startStaleConnectionCheck() {
    setInterval(() => {
      const now = Date.now();
      this.agents.forEach((agent, agentId) => {
        const inactiveTime = now - agent.lastActivity;
        if (inactiveTime > STALE_THRESHOLD) {
          console.log(
            `❌ Disconnecting stale agent ${agentId} (inactive for ${inactiveTime}ms)`
          );
          const agentNamespace = this.io.of("/agent");
          agentNamespace.to(agentId).disconnectSockets();
          this.agents.delete(agentId);
          this.broadcastAgentStatus();
        }
      });
    }, STALE_THRESHOLD / 2);
  }

  public shutdown() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.io.close();
    console.log("🛑 WebSocket service shutdown");
  }
}

// Start service
const service = new WebSocketService();

// Graceful shutdown
process.on("SIGTERM", () => service.shutdown());
process.on("SIGINT", () => service.shutdown());

export default service;
