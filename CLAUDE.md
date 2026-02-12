# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Prerequisites

Node >= 22, Rust >= 1.93, Tauri CLI >= 2.10 (`@tauri-apps/cli` is in devDependencies — installed via `npm install`).

## Build & Dev Commands

```bash
npm run tauri dev          # Run full Tauri desktop app (frontend + Rust backend)
npm run dev                # Frontend-only dev server (http://localhost:1420)
npm run build              # Production build (tsc + vite build)
npm run preview            # Preview production build
npx tsc --noEmit           # Type-check frontend only (no build)
```

Rust backend builds automatically via Tauri when using `npm run tauri dev`. For Rust-only checks:

```bash
cargo check --manifest-path src-tauri/Cargo.toml    # Type-check Rust code
cargo build --manifest-path src-tauri/Cargo.toml    # Build Rust backend only
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

### Three Operating Modes

The app has three modes controlled by `settings.mode`:
- **Files** (`files`): Load `.md` files via drag-drop, analyze them with prompts. Left panel shows file list + drop zone.
- **Text** (`text`): Free-form chat with the Perplexity API. No files involved.
- **List** (`list`): Define a list of items + optional template (e.g., `"Write about: {{element}}"`). Each item is processed individually. List items can be bulk-edited via `ListEditorModal`.

### State Management

Single Zustand store (`src/store/appStore.ts`) holds all app state: loaded files, conversation messages, streaming state, settings, prompt queue, list items, and UI flags. Settings are persisted to disk via `@tauri-apps/plugin-store` (`settings.json`).

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
- **Perplexity models:** sonar, sonar-pro, sonar-reasoning, sonar-reasoning-pro, sonar-deep-research
- Vite dev server runs on port **1420** (strict), HMR on port **1421**

## Adding a New Tauri Command

1. Define the Rust handler in `src-tauri/src/commands/` with `#[tauri::command]`
2. Re-export from `src-tauri/src/commands/mod.rs`
3. Register in `src-tauri/src/lib.rs` → `generate_handler![]`
4. Add TypeScript wrapper in `src/lib/commands.ts` using `invoke()`
5. If using new plugin APIs, add permissions to `src-tauri/capabilities/default.json`

## Message Building (`src/lib/markdown.ts`)

System prompts vary by mode. In files mode, each loaded file is wrapped in a markdown fence and injected into the user message. History inclusion is opt-in and pairs user+assistant messages to prevent consecutive same-role messages. The `{{element}}` placeholder in list templates is replaced with the current list item content.

## Gotchas

- **Tauri FS scope:** File operations are restricted to `$HOME`, `$DESKTOP`, `$DOCUMENT`, `$DOWNLOAD` paths. To access other paths, update `src-tauri/capabilities/default.json` `fs:scope`.
- **Capability permissions:** New Tauri plugin APIs require explicit permissions in `src-tauri/capabilities/default.json`. Operations will silently fail without the right permission entry.
- **StreamEvent serialization:** Rust enums serialize as tagged unions (`{ type: "Token", data: "..." }`) — match on `event.type` in TypeScript, not on string content.
- **Store plugin init:** Uses Builder pattern (`.plugin(tauri_plugin_store::Builder::default().build())`), unlike other plugins that use `::init()`.
- **i18n dual files:** Every new translation key must be added to both `src/i18n/pl.json` and `src/i18n/en.json`. Missing keys render as raw key strings (e.g., `list.editor`) with no build-time warning.
- **Modal pattern:** Modals use boolean state in Zustand (e.g., `listEditorOpen` / `setListEditorOpen`), render in `Layout.tsx` as siblings of `<SettingsDialog />`, and return `null` when closed. Follow `SettingsDialog.tsx` as the reference implementation.
