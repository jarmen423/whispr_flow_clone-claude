# Changelog

All notable changes to LocalFlow will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-27

### Added
- 🎉 Initial release of LocalFlow
- Real-time dictation with web interface
- Dual processing modes: Cloud (z-ai SDK) and Local (Whisper.cpp)
- Four refinement modes: Developer, Concise, Professional, Raw
- WebSocket service for real-time communication
- Desktop Python agent with global hotkey support (Alt+V)
- Persistent dictation history
- Settings management with localStorage
- Audio level visualization during recording
- Live activity feed
- Copy to clipboard functionality
- Download agent button in web interface
- Complete TypeScript type safety
- Responsive design with Tailwind CSS
- shadcn/ui component library integration

### Features
#### Web Interface
- Recording interface with animated microphone button
- Real-time audio level visualization
- Original and refined text display
- Dictation history with timestamps
- Settings modal for configuration
- Agent status indicator
- Live activity monitoring

#### Desktop Agent
- Global hotkey (Alt+V) for system-wide dictation
- Audio recording with sounddevice
- WebSocket communication
- Automatic clipboard paste
- Cross-platform support (Windows, macOS, Linux)
- Heartbeat monitoring
- Stale connection detection

#### APIs
- `/api/dictation/transcribe` - Audio transcription endpoint
- `/api/dictation/refine` - Text refinement endpoint
- Dual processing mode support
- Comprehensive error handling
- Input validation

#### WebSocket Service
- Two namespaces: `/agent` and `/ui`
- Agent lifecycle management
- Real-time status broadcasting
- Live activity updates
- 30s stale connection detection
- 5s heartbeat monitoring

### Documentation
- Complete user guide (LOCALFLOW_README.md)
- Local mode setup guide (SETUP_LOCAL.md)
- Agent documentation (agent/README.md)
- Environment variable reference (.env.example)
- Troubleshooting guides

### Developer Experience
- TypeScript strict mode
- ESLint configuration
- Tailwind CSS 4
- Modular architecture
- Reusable hooks
- Component library

## [Unreleased]

### Planned Features
- [ ] Multi-language support
- [ ] Custom vocabulary for developer mode
- [ ] Voice command support
- [ ] Export history to file
- [ ] Keyboard shortcuts in web interface
- [ ] Dark mode toggle
- [ ] Mobile app (React Native)
- [ ] Browser extension
- [ ] Plugin system for custom refinement modes
- [ ] Team collaboration features

### Known Issues
- Desktop agent may require elevated privileges on Linux
- Audio quality varies with microphone hardware
- Local mode requires powerful hardware for good performance
- WebSocket service may need port configuration if 3001 is in use

---

## Version Format

- **Major.Minor.Patch** (e.g., 1.0.0)
- **Major**: Breaking changes
- **Minor**: New features (backward compatible)
- **Patch**: Bug fixes (backward compatible)

## Release Notes

For detailed release notes, see the GitHub Releases page.
