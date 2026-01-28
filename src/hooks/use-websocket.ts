"use client";

import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import type { AgentStatus, LiveActivity, Settings } from "@/lib/types";

interface UseWebSocketReturn {
  socket: Socket | null;
  status: {
    connected: boolean;
    online: number;
    lastActivity: number | null;
    agentId: string | null;
  };
  liveActivities: LiveActivity[];
  sendSettings: (settings: Settings) => void;
}

export function useWebSocket(): UseWebSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<{
    connected: boolean;
    online: number;
    lastActivity: number | null;
    agentId: string | null;
  }>({
    connected: false,
    online: 0,
    lastActivity: null,
    agentId: null,
  });
  const [liveActivities, setLiveActivities] = useState<LiveActivity[]>([]);

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001";
    const socketInstance = io(`${wsUrl}/ui`, {
      transports: ["websocket", "polling"],
    });

    socketInstance.on("connect", () => {
      console.log("Connected to WebSocket service");
      setStatus((prev) => ({ ...prev, connected: true }));
    });

    socketInstance.on("disconnect", () => {
      console.log("Disconnected from WebSocket service");
      setStatus((prev) => ({ ...prev, connected: false }));
    });

    socketInstance.on("agent_status", (data: AgentStatus) => {
      console.log("Agent status update:", data);
      setStatus((prev) => ({
        ...prev,
        online: data.online,
        agentId: data.agents[0]?.id || null,
        lastActivity: data.agents[0]?.lastActivity || null,
      }));
    });

    socketInstance.on("live_activities", (activities: LiveActivity[]) => {
      setLiveActivities(activities);
    });

    socketInstance.on("update", (activity: LiveActivity) => {
      setLiveActivities((prev) => [...prev.slice(-49), activity]);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const sendSettings = useCallback((settings: Settings) => {
    if (socket?.connected) {
      socket.emit("settings", settings);
    }
  }, [socket]);

  return {
    socket,
    status,
    liveActivities,
    sendSettings,
  };
}
