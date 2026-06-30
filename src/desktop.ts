const FOCUS_EDITOR_EVENT = 'lightedit://focus-editor'

declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown
  }
}

function isTauriRuntime() {
  return Boolean(window.__TAURI_INTERNALS__)
}

export async function setMainWindowAlwaysOnTop(pinned: boolean) {
  if (!isTauriRuntime()) return false

  const { invoke } = await import('@tauri-apps/api/core')
  await invoke('set_main_window_always_on_top', { pinned })
  return true
}

export async function listenForEditorFocusRequest(onFocus: () => void) {
  if (!isTauriRuntime()) return undefined

  const { listen } = await import('@tauri-apps/api/event')
  return listen(FOCUS_EDITOR_EVENT, onFocus)
}
