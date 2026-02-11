# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Dev Commands

```bash
npm run tauri dev          # Run full Tauri desktop app (frontend + Rust backend)
npm run dev                # Frontend-only dev server (http://localhost:1420)
npm run build              # Production build (tsc + vite build)
npm run preview            # Preview production build
```

Rust backend builds automatically via Tauri when using `npm run tauri dev`. For Rust-only checks:

```bash
cd src-tauri && cargo check    # Type-check Rust code
cd src-tauri && cargo build    # Build Rust backend only
```

No test suite or linter is configured.

## Architecture

Tauri 2.5 desktop app: **React 19 frontend** communicates with a **Rust backend** via Tauri IPC commands.

### Frontend → Backend Commands (defined in `src/lib/commands.ts`)

| Command | Rust handler | Purpose |
|---------|-------------|---------|
| `read_markdown_files` | `src-tauri/src/commands/files.rs` | Async-read multiple .md files from disk |
| `save_markdown_file` | `src-tauri/src/commands/files.rs` | Write content to a file in chosen output folder |
| `stream_perplexity_chat` | `src-tauri/src/commands/perplexity.rs` | Stream SSE from Perplexity API via Tauri `Channel<StreamEvent>` |

### Streaming Pattern

The Perplexity integration uses Tauri's `Channel` for real-time token streaming:
- Rust parses SSE `data:` lines, sends `StreamEvent::Token(String)` per chunk
- Frontend buffers tokens via `requestAnimationFrame` (~10fps) to prevent UI freeze
- `StreamEvent::Done(String)` finalizes the message; `StreamEvent::Error(String)` for failures

### State Management

Single Zustand store (`src/store/appStore.ts`) holds all app state: loaded files, conversation messages, streaming state, settings, prompt queue, and UI flags. Settings are persisted to disk via `@tauri-apps/plugin-store`.

### Prompt Queue System

- **0-1 files loaded:** Prompts execute sequentially
- **2+ files loaded:** Each file is processed against all queued prompts (file-by-file batching)
- **20-second cooldown** between API calls with visual countdown (`CooldownBar`)
- Abort support via `useRef` abort signals (`abortRef`, `queueAbortRef`)

### Document Extraction

Assistant responses can contain delimited markdown blocks (`==== filename.md ====` ... `==== koniec ====`). These are parsed by `src/lib/parseFences.ts` for individual download/save. Auto-save writes extracted blocks to the user-selected output folder.

## Key Directories

- `src/components/` — React components (Layout, Toolbar, FileDropZone, CommandInput, ConversationPanel, MessageBubble, MarkdownRenderer, etc.)
- `src/hooks/` — `usePerplexityStream` (API streaming + queue), `useFileLoader` (file I/O), `useSettings` (persistence), `useOutputFolder`
- `src/lib/` — `commands.ts` (Tauri invoke wrappers), `markdown.ts` (message building), `parseFences.ts` (block extraction)
- `src/i18n/` — Polish (`pl.json`) and English (`en.json`) translations; Polish is default
- `src/store/` — Zustand store definition
- `src-tauri/src/commands/` — Rust Tauri command handlers
- `src-tauri/src/models/` — Rust data types (`ChatMessage`, `StreamEvent`, `MarkdownFile`, etc.)

## Conventions

- **TypeScript strict mode** with `noUnusedLocals` and `noUnusedParameters` enforced
- **Tailwind CSS 4** with `@tailwindcss/typography` plugin; dark theme using zinc palette
- **Named exports** for all components; `React.memo()` on expensive components (e.g., `MessageBubble`)
- **Rust errors** use `thiserror` crate with `AppError` enum implementing `Serialize` for Tauri IPC
- **Tauri plugins:** dialog (native file picker), store (persistent settings), fs (file access), shell
- **Perplexity models:** sonar, sonar-pro, sonar-reasoning, sonar-reasoning-pro
- Vite dev server runs on port **1420** (strict), HMR on port **1421**

## Adding a New Tauri Command

1. Define the Rust handler in `src-tauri/src/commands/` with `#[tauri::command]`
2. Re-export from `src-tauri/src/commands/mod.rs`
3. Register in `src-tauri/src/lib.rs` → `generate_handler![]`
4. Add TypeScript wrapper in `src/lib/commands.ts` using `invoke()`
5. If using new plugin APIs, add permissions to `src-tauri/capabilities/default.json`

## Gotchas

- **Tauri FS scope:** File operations are restricted to `$HOME`, `$DESKTOP`, `$DOCUMENT`, `$DOWNLOAD` paths. To access other paths, update `src-tauri/capabilities/default.json` `fs:scope`.
- **Capability permissions:** New Tauri plugin APIs require explicit permissions in `src-tauri/capabilities/default.json`. Operations will silently fail without the right permission entry.
- **StreamEvent serialization:** Rust enums serialize as tagged unions (`{ type: "Token", data: "..." }`) — match on `event.type` in TypeScript, not on string content.
- **Store plugin init:** Uses Builder pattern (`.plugin(tauri_plugin_store::Builder::default().build())`), unlike other plugins that use `::init()`.
- **No .gitignore:** This project currently has no `.gitignore` file.
