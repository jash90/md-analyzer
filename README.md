# MD Analyzer

Desktop application for analyzing and improving Markdown documents using Perplexity AI. Built with Tauri 2.5, React 19, and Rust.

## Download

Get the latest release for your platform:

| Platform | Download |
|----------|----------|
| **macOS** (Apple Silicon) | [MD.Analyzer_0.1.0_aarch64.dmg](https://github.com/jash90/md-analyzer/releases/latest/download/MD.Analyzer_0.1.0_aarch64.dmg) |
| **macOS** (Intel) | [MD.Analyzer_0.1.0_x64.dmg](https://github.com/jash90/md-analyzer/releases/latest/download/MD.Analyzer_0.1.0_x64.dmg) |
| **Windows** (MSI) | [MD.Analyzer_0.1.0_x64_en-US.msi](https://github.com/jash90/md-analyzer/releases/latest/download/MD.Analyzer_0.1.0_x64_en-US.msi) |
| **Windows** (EXE) | [MD.Analyzer_0.1.0_x64-setup.exe](https://github.com/jash90/md-analyzer/releases/latest/download/MD.Analyzer_0.1.0_x64-setup.exe) |
| **Linux** (Debian) | [MD.Analyzer_0.1.0_amd64.deb](https://github.com/jash90/md-analyzer/releases/latest/download/MD.Analyzer_0.1.0_amd64.deb) |
| **Linux** (AppImage) | [MD.Analyzer_0.1.0_amd64.AppImage](https://github.com/jash90/md-analyzer/releases/latest/download/MD.Analyzer_0.1.0_amd64.AppImage) |
| **Linux** (RPM) | [MD.Analyzer-0.1.0-1.x86_64.rpm](https://github.com/jash90/md-analyzer/releases/latest/download/MD.Analyzer-0.1.0-1.x86_64.rpm) |

## Features

- **AI-Powered Analysis** — Send markdown files to Perplexity AI (sonar, sonar-pro, sonar-reasoning, sonar-reasoning-pro) with custom prompts
- **Multi-File Processing** — Load multiple `.md` files via drag-and-drop or file picker, analyze them in batch
- **Real-Time Streaming** — Token-by-token streaming of AI responses with smooth UI updates
- **Prompt Queue** — Queue multiple prompts and run them sequentially with 20-second cooldown between API calls
- **Document Extraction** — AI responses containing delimited markdown blocks are automatically parsed for individual download or auto-save
- **Conversation History** — Optionally include prior messages for context-aware analysis
- **Bilingual UI** — Polish (default) and English interface
- **Persistent Settings** — API key, model, temperature, and language saved to disk

## Requirements

- [Perplexity API key](https://docs.perplexity.ai/)
- Internet connection

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS)
- [Rust](https://www.rust-lang.org/tools/install) (stable)
- Platform-specific dependencies for [Tauri](https://v2.tauri.app/start/prerequisites/)

### Commands

```bash
npm install                # Install frontend dependencies
npm run tauri dev          # Run full desktop app (frontend + Rust backend)
npm run dev                # Frontend-only dev server (http://localhost:1420)
npm run build              # Production frontend build (tsc + vite)
npm run tauri build        # Build distributable package
```

Rust-only checks:

```bash
cd src-tauri && cargo check    # Type-check Rust code
cd src-tauri && cargo build    # Build Rust backend
```

## Architecture

```
src/                          # React 19 + TypeScript frontend
├── components/               # UI components (Layout, Toolbar, FileDropZone,
│                             #   CommandInput, ConversationPanel, MessageBubble,
│                             #   MarkdownRenderer, PromptQueue, SettingsDialog, ...)
├── hooks/                    # usePerplexityStream, useFileLoader, useSettings,
│                             #   useOutputFolder
├── lib/                      # commands.ts (Tauri IPC wrappers), markdown.ts,
│                             #   parseFences.ts (block extraction)
├── store/                    # Zustand store (single store for all app state)
├── i18n/                     # pl.json, en.json translations
└── types/                    # TypeScript interfaces

src-tauri/                    # Rust backend
├── src/
│   ├── commands/             # Tauri command handlers
│   │   ├── files.rs          #   read_markdown_files, save_markdown_file
│   │   └── perplexity.rs     #   stream_perplexity_chat (SSE streaming via Channel)
│   ├── models/               # ChatMessage, StreamEvent, MarkdownFile, AppError
│   └── lib.rs                # Tauri builder & handler registration
└── tauri.conf.json

.github/workflows/release.yml # Cross-platform CI/CD (macOS, Windows, Linux)
fastlane/                      # macOS code signing (match + Developer ID)
```

### Frontend-Backend Communication

| Tauri Command | Rust Handler | Purpose |
|---------------|-------------|---------|
| `read_markdown_files` | `commands/files.rs` | Read multiple `.md` files from disk |
| `save_markdown_file` | `commands/files.rs` | Write content to output folder |
| `stream_perplexity_chat` | `commands/perplexity.rs` | Stream SSE from Perplexity API via `Channel<StreamEvent>` |

### Tech Stack

**Frontend:** React 19, TypeScript 5.7, Vite 6, Tailwind CSS 4, Zustand 5, react-markdown, react-i18next

**Backend:** Rust, Tauri 2.5, tokio, reqwest, serde, thiserror

## License

MIT
