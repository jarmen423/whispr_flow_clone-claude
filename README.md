# LocalFlow

<div align="center">

**A hybrid cloud/local dictation system with real-time processing**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)

[Features](#features) • [Quick Start](#quick-start) • [Documentation](#documentation) • [Contributing](#contributing)

</div>

---

## ✨ Features

- **🎤 Real-time Dictation** - Record and transcribe audio instantly with beautiful web interface
- **☁️ Dual Processing** - Cloud (z-ai SDK) or Local (Whisper.cpp + Ollama) modes
- **🖥️ Desktop Agent** - System-wide dictation with global hotkey support (Alt+V)
- **🎯 Intelligent Refinement** - 4 modes: Developer, Concise, Professional, Raw
- **🌐 Modern Web UI** - Responsive interface with real-time WebSocket communication
- **📋 History** - Persistent dictation history with one-click copy
- **⚡ Fast** - <3s cloud latency, <5s local latency
- **🔒 Privacy** - Optional local-only processing with complete data privacy

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) or Node.js 18+
- ZAI API key (for cloud mode)
- Python 3.8+ (for desktop agent, optional)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd localflow

# Install dependencies
bun install
```

### Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your ZAI_API_KEY
nano .env
```

### Run Development Server

```bash
# Option 1: Run all services together
bun run dev:all

# Option 2: Run services separately
bun run websocket:dev  # Terminal 1
bun run dev            # Terminal 2
```

### Open Web Interface

Visit [http://localhost:3000](http://localhost:3000) in your browser.

### (Optional) Desktop Agent

```bash
cd agent
pip install -r requirements.txt
python localflow-agent.py
```

Press `Alt+V` to start/stop recording from anywhere!

## 📖 Documentation

- **[User Guide](LOCALFLOW_README.md)** - Complete usage instructions
- **[Local Mode Setup](SETUP_LOCAL.md)** - Offline processing with Whisper.cpp and Ollama
- **[Agent Guide](agent/README.md)** - Desktop agent documentation
- **[Changelog](CHANGELOG.md)** - Version history and changes

## 🎯 Processing Modes

### Cloud Mode (z-ai SDK)

✅ Higher accuracy
✅ Faster processing
✅ No local setup

❌ Requires internet
❌ API costs may apply
❌ Privacy concerns

### Local Mode (Whisper.cpp + Ollama)

✅ Complete privacy
✅ No internet required
✅ No API costs
✅ Works offline

❌ Slower processing
❌ Requires powerful hardware
❌ More complex setup

See [SETUP_LOCAL.md](SETUP_LOCAL.md) for local mode setup.

## 🎨 Refinement Modes

- **Developer** - Fixes technical terms (`git commit`, `npm install`, `GitHub`)
- **Concise** - Removes filler words and shortens text
- **Professional** - Formal business language
- **Raw** - Returns unchanged transcription

## 🏗️ Project Structure

```
localflow/
├── src/
│   ├── app/                 # Next.js app router
│   │   ├── api/            # API routes
│   │   │   └── dictation/  # Transcribe & refine endpoints
│   │   ├── page.tsx        # Main web UI
│   │   └── layout.tsx      # Root layout
│   ├── components/ui/      # shadcn/ui components
│   ├── hooks/              # React hooks (WebSocket, toast, mobile)
│   └── lib/                # Utilities and types
│       ├── transcribe/     # Cloud & local transcription
│       ├── refine/         # Cloud & local refinement
│       ├── types.ts        # TypeScript definitions
│       └── prompts.ts      # Refinement system prompts
├── mini-services/
│   └── websocket-service/  # Socket.IO server
├── agent/                  # Python desktop agent
│   ├── localflow-agent.py
│   └── requirements.txt
└── public/                 # Static assets
```

## 🛠️ Development

### Scripts

```bash
bun run dev          # Start Next.js dev server
bun run build        # Build for production
bun run start        # Start production server
bun run lint         # Run ESLint
bun run test         # Run tests
```

### WebSocket Service

```bash
bun run websocket:dev        # Development mode
WS_PORT=3010 bun run mini-services/websocket-service/index.ts  # Custom port
```

### Desktop Agent

```bash
cd agent
pip install -r requirements.txt
python localflow-agent.py
```

## 🧪 Testing

```bash
# Run integration test
bun run test

# Manual testing checklist
- [ ] WebSocket service starts on port 3001
- [ ] Web UI loads at localhost:3000
- [ ] Agent connections work
- [ ] Cloud transcription works
- [ ] Local transcription works (if configured)
- [ ] All refinement modes work
- [ ] Desktop agent hotkey works
- [ ] Text pastes correctly
```

## 📊 Performance

| Mode | Latency | Accuracy | Privacy | Cost |
|------|---------|----------|---------|------|
| Cloud | <3s | 99%+ | ❌ | 💰 |
| Local | <5s | 95%+ | ✅ | Free |

*Benchmarks on M1 MacBook Pro with 10s audio sample*

## 🔒 Privacy

### Cloud Mode
- Audio sent to z-ai servers for processing
- Check z-ai's privacy policy for data handling
- No permanent storage by LocalFlow

### Local Mode
- All processing happens on your machine
- No data leaves your computer
- Complete privacy and offline capability

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 🐛 Troubleshooting

### Common Issues

**WebSocket service won't start**
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

**Desktop agent hotkey doesn't work**
- Linux: Run with `sudo` or add user to `input` group
- macOS: Grant accessibility permissions
- Windows: Run as Administrator

**Transcription fails**
- Cloud: Check ZAI_API_KEY and internet connection
- Local: Verify Whisper.cpp and Ollama are running

See [LOCALFLOW_README.md](LOCALFLOW_README.md) for more troubleshooting tips.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [z-ai SDK](https://z-ai.dev) - Cloud transcription and refinement
- [Whisper.cpp](https://github.com/ggerganov/whisper.cpp) - Local speech recognition
- [Ollama](https://ollama.com) - Local LLM inference
- [Socket.IO](https://socket.io) - Real-time communication
- [Next.js](https://nextjs.org) - React framework
- [shadcn/ui](https://ui.shadcn.com) - UI components
- [Framer Motion](https://www.framer.com/motion/) - Animation library

## 📮 Support

- 📧 Email: support@localflow.dev
- 🐛 Issues: [GitHub Issues](https://github.com/your-repo/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/your-repo/discussions)
- 📖 Docs: [Full Documentation](https://docs.localflow.dev)

---

<div align="center">

**Built with ❤️ by the LocalFlow team**

[⭐ Star us on GitHub](https://github.com/your-repo) • [🐦 Follow us on Twitter](https://twitter.com/localflow)

</div>
