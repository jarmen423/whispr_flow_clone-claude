# LocalFlow Desktop Agent

A cross-platform Python agent for system-wide dictation with global hotkey support.

## Features

- **Global Hotkey**: Press `Alt+V` to start/stop recording from anywhere
- **Real-time Processing**: Audio is sent to LocalFlow service for transcription
- **Automatic Paste**: Transcribed text is automatically pasted into the active application
- **Cross-platform**: Works on Windows, macOS, and Linux

## Installation

### Prerequisites

- Python 3.8 or higher
- Pip package manager

### Install Dependencies

```bash
cd agent
pip install -r requirements.txt
```

### macOS

On macOS, you may need to grant accessibility permissions:

1. Open System Preferences → Security & Privacy → Privacy
2. Select "Accessibility" from the left
3. Add Terminal or your Python interpreter
4. Check the box to enable accessibility

### Linux

On Linux, you may need to run with `sudo` for global hotkey support:

```bash
sudo python localflow-agent.py
```

## Usage

### Starting the Agent

Make sure the LocalFlow WebSocket service is running:

```bash
# In one terminal
bun run websocket:dev
```

Then start the agent:

```bash
# In another terminal
cd agent
python localflow-agent.py
```

### Using Dictation

1. Press `Alt+V` to start recording
2. Speak into your microphone
3. Press `Alt+V` again to stop recording
4. Wait for processing (2-5 seconds)
5. Text will be automatically pasted into your active application

## Configuration

Configuration is done via environment variables:

```bash
# WebSocket service URL (default: http://localhost:3001)
export WS_URL=http://localhost:3001

# Global hotkey (default: <alt>v)
export AGENT_HOTKEY="<alt>v"

# Audio sample rate in Hz (default: 16000)
export AGENT_AUDIO_SAMPLE_RATE=16000

# Audio channels (default: 1 for mono)
export AGENT_AUDIO_CHANNELS=1
```

## Hotkey Format

The agent uses pynput hotkey format. Examples:

- `<alt>v` - Alt+V
- `<ctrl>+<shift>d` - Ctrl+Shift+D
- `<cmd>.space` - Cmd+Space (macOS)
- `<ctrl>`<`shift>`<`alt>`<`cmd>`<`q` - Ctrl+Shift+Alt+Cmd+Q (macOS)

## Troubleshooting

### "Could not register hotkey"

- **Linux**: Run with `sudo` or add your user to the `input` group
- **macOS**: Grant accessibility permissions in System Preferences
- **Windows**: Run as Administrator

### "Not connected to server"

- Ensure WebSocket service is running on port 3001
- Check firewall settings
- Verify WS_URL environment variable

### "Could not paste text"

- Ensure text field is focused before dictation ends
- Some applications may block programmatic paste
- Check clipboard permissions (macOS)

## Audio Quality Issues

- Use a good quality microphone
- Speak clearly and at moderate pace
- Reduce background noise
- Try different sample rates if needed

## Privacy

- Audio data is sent to the LocalFlow service for processing
- No audio is stored permanently by the agent
- Transcription history depends on your LocalFlow configuration
- For local-only processing, configure LocalFlow to use local mode
