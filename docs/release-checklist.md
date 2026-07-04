# LightEdit V0 Release Checklist

This checklist is the final gate before sharing a local V0 macOS app build.

## Automated Gates

- `./harness/init.sh`
- `npm test`
- `npm run test:baseline`
- `npm run qa`
- `npm run tauri:build`

The expected macOS app artifact is:

- `src-tauri/target/release/bundle/macos/LightEdit.app`

## Clean-State Check

Before release validation, clear the V0 local state or launch with an empty profile.

Expected first-run state:

- One Project: `LightEdit`
- One Version: `v1`
- Type: `Text`
- Editor content: empty
- Pin: off
- Window size: about `800 x 560`

## Desktop Shell Manual Check

- Launch `LightEdit.app` by double-clicking it.
- Confirm the window has rounded macOS chrome and no extra square frame.
- Press `Cmd+Shift+L` to hide and show LightEdit.
- While another normal app is frontmost, press `Cmd+Shift+L`; LightEdit should appear above it.
- While another app is fullscreen, press `Cmd+Shift+L`; LightEdit should appear in that fullscreen Space.
- Move the mouse to another display, press `Cmd+Shift+L`, and confirm LightEdit appears near that display.
- Drag the top bar and project tabs; dragging should be smooth, without text selection or ghosting.
- Toggle Pin on and off; the icon state should update and the window should remain usable.
- Quit and relaunch; Pin should start off.

## Product Manual Check

- Type in the empty editor; content should appear in the current `LightEdit / v1` version.
- Change type between `Text`, `JSON`, and `SQL`.
- Format valid JSON and confirm it becomes pretty printed.
- Format invalid JSON and confirm content is unchanged with an error toast.
- Click top-bar `+`; the new Project should become active and enter inline naming.
- With a new Project in naming mode, press Right Arrow to accept the `Project N` suggestion.
- Create another Project, type a custom name, press Enter, and confirm the typed name replaces the suggestion.
- Open `Notes`, select a Project, and click outside the menu; the menu should close.
- Right-click Project tabs, Notes menu items, and Version rows; LightEdit custom menus should appear instead of WebView `Reload / Inspect Element`.
- Delete a Project or Version and confirm the Undo toast restores it.

## Known V0 Limits

- Storage is local only through `localStorage`.
- Window size and position are not persisted across app restarts.
- DMG packaging, code signing, notarization, and auto-update are not part of this V0 gate.
- The editor remains a lightweight `textarea + syntax overlay`; CodeMirror/Monaco are reserved for a later version.
- Visual regression is a lightweight scenario checklist, not a pixel-perfect PNG baseline.

## Failure Notes

- Do not reintroduce `window_state.rs`, frame restore, or Tauri `set_position` / `set_size` restore logic to solve shell issues.
- If fullscreen Space overlay regresses, read `harness/desktop-window-lessons.md` before changing native window code.
- If Pin regresses after restart, verify that persisted app state does not replay `isPinned: true`.
