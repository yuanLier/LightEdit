# LightEdit

A lightweight macOS scratch editor for quick Text, JSON, and SQL snippets.

LightEdit is designed to feel like a small desktop tool instead of a full IDE:
fast to summon, easy to dismiss, and quiet enough to keep around while working.

## What It Does

- Quick scratch editing for `Text`, `JSON`, and `SQL`
- Lightweight syntax overlay with line numbers
- JSON formatting and simple SQL formatting
- Project tabs for switching between snippets
- Version rail for keeping multiple drafts per project
- Notes menu for reopening and managing projects
- Inline rename for projects and versions
- Delete with Undo toast
- Global hotkey summon / hide on macOS
- Optional Pin mode to keep the window floating
- Native macOS-style rounded window chrome

## Desktop Behavior

LightEdit V0 focuses on a compact macOS floating-window workflow:

- Default window size: about `800 x 560`
- Global shortcut: `Cmd+Shift+L`
- Unpinned window hides when it loses focus
- Pinned window stays visible above other apps
- Summon follows the current mouse display
- Fullscreen app Space overlay is supported

## Tech Stack

- React 19
- TypeScript
- Vite
- Tauri 2
- Rust
- Vitest
- Testing Library

## Getting Started

Install dependencies:

```bash
npm install
```

Run the web preview:

```bash
npm run dev
```

Run the Tauri app in development:

```bash
npm run tauri:dev
```

Build the frontend:

```bash
npm run build
```

Build the macOS app bundle:

```bash
npm run tauri:build
```

The generated app is placed at:

```text
src-tauri/target/release/bundle/macos/LightEdit.app
```

## Quality Gates

Run the main QA suite:

```bash
npm run qa
```

Useful individual checks:

```bash
npm test
npm run test:baseline
npm run check:rust
npm run test:rust
```

## Local Data

V0 stores app state locally in `localStorage`.

The current storage key is:

```text
lightedit:v0.4:reference
```

For a clean local validation run, clear it in the devtools console:

```js
localStorage.removeItem('lightedit:v0.4:reference')
location.reload()
```

## V0 Scope

V0 intentionally stays small:

- No backend sync
- No account system
- No import/export flow
- No DMG, signing, notarization, or auto-update yet
- No CodeMirror or Monaco editor core yet

The editor currently uses a lightweight `textarea + syntax overlay` approach.
If editing complexity grows, CodeMirror is the likely next editor-core candidate.

## Release Checklist

See [docs/release-checklist.md](docs/release-checklist.md) for the V0 release
validation flow.
