"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, Copy, Settings as SettingsIcon, History, Activity, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useWebSocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";
import { formatDuration, formatTimestamp } from "@/lib/utils";
import type { Settings, DictationItem, ProcessingMode, RefinementMode } from "@/lib/types";

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [originalText, setOriginalText] = useState("");
  const [refinedText, setRefinedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<DictationItem[]>([]);
  const [settings, setSettings] = useState<Settings>({
    processingMode: "cloud",
    refinementMode: "developer",
    autoCopy: false,
  });
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { status, liveActivities } = useWebSocket();
  const { success, error } = useToast();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load settings and history from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem("localflow-settings");
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }

    const savedHistory = localStorage.getItem("localflow-history");
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem("localflow-settings", JSON.stringify(settings));
  }, [settings]);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem("localflow-history", JSON.stringify(history));
  }, [history]);

  // Update audio level visualization
  const updateAudioLevel = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    setAudioLevel(average / 255);

    animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.start();

      setIsRecording(true);
      setRecordingTime(0);
      setOriginalText("");
      setRefinedText("");

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      updateAudioLevel();
    } catch (err) {
      error("Failed to access microphone");
      console.error(err);
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }

    setIsRecording(false);
    setAudioLevel(0);

    // Process audio
    setIsProcessing(true);
    try {
      // Get audio blob and convert to base64
      const chunks: BlobPart[] = [];
      mediaRecorderRef.current.ondataavailable = (e) => chunks.push(e.data);

      await new Promise((resolve) => {
        mediaRecorderRef.current!.onstop = resolve;
      });

      const blob = new Blob(chunks, { type: "audio/webm" });
      const arrayBuffer = await blob.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
      );

      // Call transcribe API
      const transcribeResponse = await fetch("/api/dictation/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audio: base64,
          mode: settings.processingMode,
        }),
      });

      const transcribeData = await transcribeResponse.json();

      if (!transcribeData.success) {
        throw new Error(transcribeData.error || "Transcription failed");
      }

      setOriginalText(transcribeData.text);

      // Call refine API if not raw mode
      if (settings.refinementMode !== "raw") {
        const refineResponse = await fetch("/api/dictation/refine", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: transcribeData.text,
            mode: settings.refinementMode,
            processingMode: settings.processingMode,
          }),
        });

        const refineData = await refineResponse.json();

        if (!refineData.success) {
          throw new Error(refineData.error || "Refinement failed");
        }

        setRefinedText(refineData.text);
      } else {
        setRefinedText(transcribeData.text);
      }

      // Add to history
      const newItem: DictationItem = {
        id: Date.now().toString(),
        originalText: transcribeData.text,
        refinedText: settings.refinementMode === "raw" ? transcribeData.text : refinedText,
        timestamp: Date.now(),
        duration: recordingTime,
      };
      setHistory((prev) => [newItem, ...prev.slice(0, 9)]);

      success("Dictation completed!");
    } catch (err) {
      error(err instanceof Error ? err.message : "Processing failed");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    success("Copied to clipboard!");
  };

  const downloadAgent = () => {
    window.location.href = "/agent/localflow-agent.py";
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-50">
              LocalFlow
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Hybrid dictation system
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 shadow-sm">
              <div
                className={`w-2 h-2 rounded-full ${
                  status.connected ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {status.online} Agent{status.online !== 1 ? "s" : ""} Online
              </span>
            </div>
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <SettingsIcon className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Processing Mode</label>
                    <Select
                      value={settings.processingMode}
                      onValueChange={(value: ProcessingMode) =>
                        setSettings({ ...settings, processingMode: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cloud">Cloud (z-ai)</SelectItem>
                        <SelectItem value="local">Local (Whisper.cpp)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Refinement Mode</label>
                    <Select
                      value={settings.refinementMode}
                      onValueChange={(value: RefinementMode) =>
                        setSettings({ ...settings, refinementMode: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="developer">Developer</SelectItem>
                        <SelectItem value="concise">Concise</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="raw">Raw (No refinement)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Auto-copy to clipboard</label>
                    <Switch
                      checked={settings.autoCopy}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, autoCopy: checked })
                      }
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Recording Area */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dictation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Recording Button */}
                <div className="flex flex-col items-center gap-4">
                  <motion.div
                    className="relative"
                    animate={isRecording ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Button
                      size="lg"
                      variant={isRecording ? "destructive" : "default"}
                      className={`w-24 h-24 rounded-full ${
                        isRecording ? "animate-pulse" : ""
                      }`}
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={isProcessing}
                    >
                      {isRecording ? (
                        <MicOff className="h-10 w-10" />
                      ) : (
                        <Mic className="h-10 w-10" />
                      )}
                    </Button>
                  </motion.div>

                  {isRecording && (
                    <div className="text-center space-y-2">
                      <div className="text-2xl font-mono">
                        {formatDuration(recordingTime)}
                      </div>
                      <div className="w-48 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-red-500"
                          style={{ width: `${audioLevel * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {isProcessing && (
                    <div className="text-center text-sm text-slate-600 dark:text-slate-400">
                      Processing...
                    </div>
                  )}
                </div>

                {/* Results */}
                {(originalText || refinedText) && (
                  <div className="space-y-4">
                    {originalText !== refinedText && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          Original
                        </label>
                        <Textarea
                          value={originalText}
                          readOnly
                          className="min-h-[100px]"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Refined
                      </label>
                      <Textarea
                        value={refinedText}
                        readOnly
                        className="min-h-[100px]"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(refinedText)}
                        className="w-full"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy to Clipboard
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <div className="text-center text-sm text-slate-600 dark:text-slate-400 py-8">
                    No dictations yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                          <span>{formatTimestamp(new Date(item.timestamp))}</span>
                          <span>{formatDuration(item.duration)}</span>
                        </div>
                        <p className="text-sm line-clamp-2">{item.refinedText}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(item.refinedText)}
                          className="w-full"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Download Agent */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Desktop Agent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Install the desktop agent for system-wide dictation with global
                  hotkey support.
                </p>
                <Button onClick={downloadAgent} className="w-full" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download Agent
                </Button>
              </CardContent>
            </Card>

            {/* Live Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Live Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {liveActivities.length === 0 ? (
                  <div className="text-center text-sm text-slate-600 dark:text-slate-400 py-8">
                    No recent activity
                  </div>
                ) : (
                  <div className="space-y-2">
                    {liveActivities.slice(-10).reverse().map((activity, idx) => (
                      <Alert
                        key={idx}
                        variant={
                          activity.type === "error" ? "destructive" : "default"
                        }
                      >
                        <AlertDescription className="text-xs">
                          {activity.message}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
