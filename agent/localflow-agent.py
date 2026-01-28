#!/usr/bin/env python3
"""
LocalFlow Desktop Agent

A system-wide dictation agent with global hotkey support.
Records audio from microphone, sends to WebSocket service for processing,
and pastes the result into the active application.

Features:
- Global hotkey (Alt+V) to toggle recording
- Real-time audio recording
- WebSocket communication with LocalFlow service
- Automatic clipboard paste support
- Cross-platform (Windows, macOS, Linux)
"""

import os
import sys
import time
import base64
import threading
import tempfile
from typing import Optional

import sounddevice as sd
import numpy as np
from scipy.io.wavfile import write
import socketio
import pyperclip
from pynput import keyboard
import pyautogui

# Configuration
WS_URL = os.getenv("WS_URL", "http://localhost:3001")
AGENT_HOTKEY = os.getenv("AGENT_HOTKEY", "<alt>v")
SAMPLE_RATE = int(os.getenv("AGENT_AUDIO_SAMPLE_RATE", "16000"))
CHANNELS = int(os.getenv("AGENT_AUDIO_CHANNELS", "1"))


class LocalFlowAgent:
    """LocalFlow desktop agent for system-wide dictation."""

    def __init__(self):
        self.sio: Optional[socketio.Client] = None
        self.is_recording = False
        self.recording_thread: Optional[threading.Thread] = None
        self.audio_data: list = []
        self.hotkey_listener = None
        self.heartbeat_timer = None
        self.connected = False

        # Audio configuration
        self.sample_rate = SAMPLE_RATE
        self.channels = CHANNELS

    def on_connect(self):
        """Handle WebSocket connection."""
        print("✓ Connected to LocalFlow service")
        self.connected = True
        self.start_heartbeat()

    def on_disconnect(self):
        """Handle WebSocket disconnection."""
        print("✗ Disconnected from LocalFlow service")
        self.connected = False
        if self.heartbeat_timer:
            self.heartbeat_timer.cancel()

    def on_dictation_result(self, data):
        """Handle dictation result from server."""
        if data.get("success"):
            text = data.get("text", "")
            print(f"✓ Dictation result: {text}")

            # Copy to clipboard
            pyperclip.copy(text)

            # Paste (platform-specific)
            self.paste_text()

            print("✓ Text pasted to active application")
        else:
            error = data.get("error", "Unknown error")
            print(f"✗ Dictation failed: {error}")

    def paste_text(self):
        """Paste text using platform-specific keyboard shortcut."""
        try:
            if sys.platform == "darwin":
                # macOS: Cmd+V
                pyautogui.hotkey("command", "v")
            elif sys.platform == "win32":
                # Windows: Ctrl+V
                pyautogui.hotkey("ctrl", "v")
            else:
                # Linux: Ctrl+V
                pyautogui.hotkey("ctrl", "v")
        except Exception as e:
            print(f"Warning: Could not paste text: {e}")

    def start_recording(self):
        """Start audio recording."""
        if self.is_recording:
            print("⚠ Already recording")
            return

        print("🎤 Recording... (Press Alt+V to stop)")
        self.is_recording = True
        self.audio_data = []

        try:
            # Start recording in a separate thread
            self.recording_thread = threading.Thread(target=self._record_audio)
            self.recording_thread.start()
        except Exception as e:
            print(f"✗ Failed to start recording: {e}")
            self.is_recording = False

    def stop_recording(self):
        """Stop audio recording and send for processing."""
        if not self.is_recording:
            return

        print("⏹ Stopping recording...")
        self.is_recording = False

        # Wait for recording thread to finish
        if self.recording_thread:
            self.recording_thread.join(timeout=2)
            self.recording_thread = None

        # Process and send audio
        if self.audio_data:
            threading.Thread(target=self._process_audio).start()

    def _record_audio(self):
        """Record audio from microphone."""
        try:
            def audio_callback(indata, frames, time_info, status):
                if status:
                    print(f"Audio status: {status}")
                if self.is_recording:
                    # Convert to int16 for WAV compatibility
                    audio_int16 = (indata * 32767).astype(np.int16)
                    self.audio_data.append(audio_int16.copy())

            # Start recording stream
            with sd.InputStream(
                samplerate=self.sample_rate,
                channels=self.channels,
                dtype=np.float32,
                callback=audio_callback,
            ):
                while self.is_recording:
                    time.sleep(0.1)

        except Exception as e:
            print(f"✗ Recording error: {e}")
            self.is_recording = False

    def _process_audio(self):
        """Process recorded audio and send to server."""
        try:
            print("⏳ Processing audio...")

            # Combine audio chunks
            if not self.audio_data:
                print("⚠ No audio data recorded")
                return

            audio_array = np.concatenate(self.audio_data, axis=0)

            # Write to temporary WAV file
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp_file:
                tmp_path = tmp_file.name
                write(tmp_path, self.sample_rate, audio_array)

            # Encode to base64
            with open(tmp_path, "r") as f:
                audio_base64 = base64.b64encode(f.read()).decode("utf-8")

            # Clean up temp file
            os.unlink(tmp_path)

            # Send to WebSocket server
            if self.sio and self.connected:
                self.sio.emit("process_audio", {"audio": audio_base64})
            else:
                print("⚠ Not connected to server")

        except Exception as e:
            print(f"✗ Audio processing error: {e}")

    def toggle_recording(self):
        """Toggle recording state (hotkey handler)."""
        if self.is_recording:
            self.stop_recording()
        else:
            self.start_recording()

    def send_heartbeat(self):
        """Send periodic heartbeat to server."""
        if self.sio and self.connected:
            self.sio.emit("ping")

        # Schedule next heartbeat
        self.heartbeat_timer = threading.Timer(5.0, self.send_heartbeat)
        self.heartbeat_timer.start()

    def start_heartbeat(self):
        """Start heartbeat timer."""
        self.send_heartbeat()

    def connect(self):
        """Connect to WebSocket server."""
        try:
            self.sio = socketio.Client()
            self.sio.on("connect", self.on_connect)
            self.sio.on("disconnect", self.on_disconnect)
            self.sio.on("dictation_result", self.on_dictation_result)

            print(f"🔗 Connecting to {WS_URL}/agent...")
            self.sio.connect(f"{WS_URL}/agent")

        except Exception as e:
            print(f"✗ Connection failed: {e}")
            sys.exit(1)

    def setup_hotkey(self):
        """Setup global hotkey listener."""
        try:
            self.hotkey_listener = keyboard.GlobalHotKeys({
                AGENT_HOTKEY: self.toggle_recording
            })
            self.hotkey_listener.start()
            print(f"🎹 Hotkey registered: {AGENT_HOTKEY}")
        except Exception as e:
            print(f"⚠ Warning: Could not register hotkey: {e}")
            print("You may need to run with elevated privileges")

    def run(self):
        """Run the agent (main event loop)."""
        print("=" * 50)
        print("LocalFlow Desktop Agent")
        print("=" * 50)
        print(f"WebSocket URL: {WS_URL}")
        print(f"Hotkey: {AGENT_HOTKEY}")
        print(f"Audio: {self.sample_rate}Hz, {self.channels} channel(s)")
        print("=" * 50)

        # Connect to server
        self.connect()

        # Setup hotkey
        self.setup_hotkey()

        print("\n✓ Agent ready!")
        print(f"  Press {AGENT_HOTKEY} to start/stop recording")
        print("  Press Ctrl+C to quit\n")

        try:
            # Keep alive
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n\n👋 Shutting down...")
            if self.sio:
                self.sio.disconnect()
            if self.hotkey_listener:
                self.hotkey_listener.stop()
            if self.heartbeat_timer:
                self.heartbeat_timer.cancel()
            print("✓ Agent stopped")


def main():
    """Entry point for the agent."""
    agent = LocalFlowAgent()
    agent.run()


if __name__ == "__main__":
    main()
