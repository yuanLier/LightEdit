[中文](README.md) | English

# LightEdit

A lightweight macOS scratch editor for quick `Text`, `JSON`, and `SQL` snippets.

![version](https://img.shields.io/badge/version-0.4.0-orange)
![platform](https://img.shields.io/badge/platform-macOS%20first-lightgrey)
![stack](https://img.shields.io/badge/stack-Tauri%202%20%2B%20React-blue)

LightEdit is not trying to be a full IDE. It is meant to feel like a quiet desktop utility: summon it when you need it, jot something down, format a payload, then let it disappear.

## Features

- **Quick scratch editing** — Keep temporary `Text`, `JSON`, and `SQL` snippets
- **Lightweight code surface** — `textarea + syntax overlay` with line numbers and low-saturation syntax highlighting
- **Formatting** — JSON pretty print and a lightweight SQL formatter
- **Project Tabs** — Switch between multiple snippets
- **Version Rail** — Keep multiple drafts under the same project
- **Notes Menu** — Reopen, rename, and delete projects
- **Inline Naming** — New projects enter rename mode immediately
- **Undo Toast** — Restore recently deleted projects or versions
- **Global Hotkey** — Summon or hide LightEdit from anywhere on macOS
- **Pin Mode** — Keep the window floating above other apps when needed

## Desktop Behavior

LightEdit V0 focuses on a compact macOS floating-window workflow:

- Default window size: about `800 x 560`
- Global shortcut: `Cmd+Shift+L`
- Unpinned window hides when it loses focus
- Pinned window stays visible above other apps
- Summon follows the current mouse display
- Fullscreen app Space overlay is supported
- Native macOS rounded chrome and traffic lights are preserved

## Getting Started

```bash
npm install
npm run tauri:dev
```

Useful commands:

```bash
npm run dev           # Web preview for UI debugging
npm run build         # Frontend build
npm run qa            # unit + build + cargo check + cargo test
npm run tauri:build   # Build the macOS .app
```

The generated macOS app is placed at:

```text
src-tauri/target/release/bundle/macos/LightEdit.app
```

## Tech Stack

| Layer | Tech |
|---|---|
| Desktop Shell | Tauri 2 + Rust |
| Frontend | React 19 + TypeScript + Vite |
| Icons | lucide-react |
| Editor | textarea + syntax overlay |
| Storage | localStorage |
| Tests | Vitest + React Testing Library + cargo test |

## Local Data

V0 stores app state in `localStorage`.

Current key:

```text
lightedit:v0.4:reference
```

To clear local validation data, run this in devtools:

```js
localStorage.removeItem('lightedit:v0.4:reference')
location.reload()
```

## V0 Scope

V0 includes:

- Single-window lightweight editor
- Project / Version lifecycle
- Text / JSON / SQL mode switching
- JSON / SQL formatting
- Notes as the global project entry
- Undo for deletion
- Global hotkey summon
- Pin mode and unpinned blur-to-hide behavior
- macOS fullscreen Space overlay and multi-display summon

V0 intentionally excludes:

- Backend sync or accounts
- Import / export
- AI summary, classification, or search
- DMG packaging, signing, notarization, and auto-update
- CodeMirror / Monaco editor core

## Release Checklist

See [docs/release-checklist.md](docs/release-checklist.md) for the V0 release validation flow.
