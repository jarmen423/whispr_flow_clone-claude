# LocalFlow

A hybrid cloud/local dictation system with real-time processing and system-wide text input capabilities.

## Features

- **🎤 Real-time Dictation**: Record and transcribe audio instantly
- **☁️ Dual Processing**: Cloud (z-ai SDK) or Local (Whisper.cpp + Ollama)
- **🖥️ Desktop Agent**: System-wide dictation with global hotkey support
- **🎯 Intelligent Refinement**: 4 refinement modes (Developer, Concise, Professional, Raw)
- **🌐 Web Interface**: Beautiful, responsive UI with real-time status
- **📋 History**: Persistent dictation history with one-click copy
- **🔌 WebSocket**: Real-time communication between web and desktop components
- **⚡ Fast**: <3s cloud latency, <5s local latency

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd localflow
bun install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env and add your ZAI_API_KEY
```

### 3. Start Services

```bash
# Terminal 1: WebSocket service
bun run websocket:dev

# Terminal 2: Next.js app
bun run dev
```

### 4. Open Web Interface

Visit `http://localhost:3000` in your browser.

### 5. (Optional) Install Desktop Agent

```bash
cd agent
pip install -r requirements.txt
python localflow-agent.py
```

Press `Alt+V` to start/stop recording from anywhere.

## Processing Modes

### Cloud Mode (z-ai SDK)

**Pros:**
- Higher accuracy
- Faster processing
- No local setup required

**Cons:**
- Requires internet connection
- API costs may apply
- Privacy concerns (data sent to cloud)

### Local Mode (Whisper.cpp + Ollama)

**Pros:**
- Complete privacy
- No internet required
- No API costs
- Works offline

**Cons:**
- Slower processing
- Requires powerful hardware
- More complex setup

See [SETUP_LOCAL.md](SETUP_LOCAL.md) for local mode setup instructions.

## Refinement Modes

### Developer
Fixes common technical term misrecognizations:
- "get commit" → "git commit"
- "get hub" → "GitHub"
- "NPM" → "npm"
- "node js" → "Node.js"

### Concise
Removes filler words and shortens text:
- Removes: um, uh, like, you know, basically
- Preserves core message
- More professional tone

### Professional
Converts casual speech to formal business language:
- Formal vocabulary
- Professional grammar
- Business-appropriate tone

### Raw
Returns transcription unchanged:
- No refinement applied
- Fastest processing
- Original transcription only

## Installation

### Prerequisites

- **Bun** - JavaScript runtime and package manager
- **Node.js 18+** - Alternative to Bun
- **Python 3.8+** - For desktop agent
- **ZAI API Key** - For cloud mode

### Install Bun

```bash
curl -fsSL https://bun.sh/install | bash
```

### Install Dependencies

```bash
bun install
```

### Environment Variables

Create a `.env` file:

```bash
# Z-AI SDK (Cloud mode)
ZAI_API_KEY=your_api_key_here
ZAI_API_BASE=https://api.z-ai.dev/v1

# Local Processing (Optional)
WHISPER_BINARY_PATH=/usr/local/bin/whisper
WHISPER_MODEL_PATH=/path/to/models/ggml-small-q5_1.bin
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:1b

# WebSocket
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Usage

### Web Interface

1. Open `http://localhost:3000`
2. Click the microphone button to start recording
3. Speak clearly into your microphone
4. Click again to stop recording
5. Wait for processing (2-5 seconds)
6. Copy text to clipboard with one click

### Desktop Agent

1. Start the agent: `python agent/localflow-agent.py`
2. Press `Alt+V` to start recording
3. Speak into your microphone
4. Press `Alt+V` to stop recording
5. Text is automatically pasted into the active application

### Settings

Access settings via the gear icon in the web interface:

- **Processing Mode**: Cloud or Local
- **Refinement Mode**: Developer, Concise, Professional, or Raw
- **Auto-copy**: Automatically copy to clipboard after transcription

## Troubleshooting

### WebSocket service won't start

**Error**: `Port 3001 already in use`

**Solution**:
```bash
# Find and kill process using port 3001
lsof -ti:3001 | xargs kill -9

# Or use a different port
export WS_PORT=3010
bun run websocket:dev
```

### Desktop agent hotkey doesn't work

**Linux**: Run with sudo or add user to input group:
```bash
sudo usermod -a -G input $USER
# Log out and back in
```

**macOS**: Grant accessibility permissions:
1. System Preferences → Security & Privacy → Privacy
2. Select "Accessibility"
3. Add Terminal or Python interpreter

### Transcription fails

**Cloud mode**:
- Check ZAI_API_KEY is valid
- Verify internet connection
- Check API quota

**Local mode**:
- Verify Whisper.cpp is installed
- Check model file path
- Ensure Ollama is running (for refinement)

### Audio not recording

**Web interface**:
- Grant microphone permissions in browser
- Check system microphone settings
- Try a different browser

**Desktop agent**:
- Check microphone permissions
- Verify microphone is connected
- Test with `sounddevice` demo:
  ```bash
  python -m sounddevice
  ```

## Development

### Project Structure

```
localflow/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── dictation/
│   │   │       ├── transcribe/
│   │   │       └── refine/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   └── ui/
│   ├── hooks/
│   ├── lib/
│   │   ├── transcribe/
│   │   ├── refine/
│   │   ├── types.ts
│   │   ├── prompts.ts
│   │   └── utils.ts
│   └── middleware.ts
├── mini-services/
│   └── websocket-service/
│       └── index.ts
├── agent/
│   ├── localflow-agent.py
│   ├── requirements.txt
│   └── README.md
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

### Running in Development

```bash
# All services together
bun run dev:all

# Or individually
bun run websocket:dev  # Terminal 1
bun run dev            # Terminal 2
bun run agent:start    # Terminal 3
```

### Building for Production

```bash
bun run build
bun run start
```

## Privacy

### Cloud Mode
- Audio data is sent to z-ai servers for processing
- Transcriptions are processed in the cloud
- No audio is stored permanently by LocalFlow
- Check z-ai's privacy policy for data handling

### Local Mode
- All processing happens on your machine
- No data leaves your computer
- Complete privacy and offline capability
- Recommended for sensitive content

## License

MIT License - See LICENSE file for details

## Support

- GitHub Issues: [Report bugs and request features]
- Documentation: [Full documentation]
- Community: [Discussions and Discord]

## Acknowledgments

- **z-ai SDK** - Cloud transcription and refinement
- **Whisper.cpp** - Local speech recognition
- **Ollama** - Local LLM inference
- **Socket.IO** - Real-time communication
- **Next.js** - Web framework
- **shadcn/ui** - UI components
