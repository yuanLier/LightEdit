#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod shortcuts;
mod window_native;

use std::sync::atomic::{AtomicBool, Ordering};

use tauri::{AppHandle, Emitter, Manager, WebviewWindow};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

const MAIN_WINDOW_LABEL: &str = "main";
const FOCUS_EDITOR_EVENT: &str = "lightedit://focus-editor";

#[derive(Default)]
struct WindowSession {
    pinned: AtomicBool,
}

impl WindowSession {
    fn set_pinned(&self, pinned: bool) {
        self.pinned.store(pinned, Ordering::Relaxed);
    }

    fn is_pinned(&self) -> bool {
        self.pinned.load(Ordering::Relaxed)
    }
}

fn should_hide_on_focus_lost(is_pinned: bool) -> bool {
    !is_pinned
}

fn main_window(app: &AppHandle) -> Result<WebviewWindow, String> {
    app.get_webview_window(MAIN_WINDOW_LABEL)
        .ok_or_else(|| "LightEdit main window is unavailable.".to_string())
}

fn request_editor_focus(window: &WebviewWindow) {
    if let Err(error) = window.emit(FOCUS_EDITOR_EVENT, ()) {
        eprintln!("failed to request editor focus: {error}");
    }
}

fn show_and_focus_main_window(app: &AppHandle) -> Result<(), String> {
    let window = main_window(app)?;
    window.show().map_err(|error| error.to_string())?;
    window_native::position_main_window_near_cursor(&window)?;
    window_native::raise_main_window(&window)?;
    window.set_focus().map_err(|error| error.to_string())?;
    window_native::schedule_deferred_raise(&window);
    request_editor_focus(&window);
    Ok(())
}

#[tauri::command]
fn show_main_window(app: AppHandle) -> Result<(), String> {
    show_and_focus_main_window(&app)
}

#[tauri::command]
fn hide_main_window(app: AppHandle) -> Result<(), String> {
    let window = main_window(&app)?;
    window.hide().map_err(|error| error.to_string())?;
    window_native::restore_regular_activation_policy(&app)
}

#[tauri::command]
fn toggle_main_window(app: AppHandle) -> Result<(), String> {
    let window = main_window(&app)?;
    let is_visible = window.is_visible().map_err(|error| error.to_string())?;
    let is_focused = window.is_focused().unwrap_or(false);

    if is_visible && is_focused {
        window.hide().map_err(|error| error.to_string())?;
        window_native::restore_regular_activation_policy(&app)?;
        return Ok(());
    }

    show_and_focus_main_window(&app)
}

#[tauri::command]
fn set_main_window_always_on_top(app: AppHandle, pinned: bool) -> Result<(), String> {
    let window = main_window(&app)?;
    window
        .set_always_on_top(pinned)
        .map_err(|error| error.to_string())?;
    window_native::set_main_window_floating(&window, pinned)?;
    app.state::<WindowSession>().set_pinned(pinned);
    if pinned {
        window_native::raise_main_window(&window)?;
        window_native::schedule_deferred_raise(&window);
    }
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .manage(WindowSession::default())
        .plugin(tauri_nspanel::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, shortcut, event| {
                    if event.state() != ShortcutState::Pressed {
                        return;
                    }

                    if shortcuts::matches_toggle_window(shortcut) {
                        if let Err(error) = toggle_main_window(app.clone()) {
                            eprintln!("failed to toggle LightEdit from global shortcut: {error}");
                        }
                    }
                })
                .build(),
        )
        .setup(|app| {
            if let Err(error) = app
                .global_shortcut()
                .register(shortcuts::toggle_window_shortcut())
            {
                eprintln!(
                    "failed to register global shortcut for {}: {error}",
                    shortcuts::TOGGLE_WINDOW_SHORTCUT_NAME
                );
            }
            if let Err(error) = window_native::configure_main_panel(app.handle(), MAIN_WINDOW_LABEL)
            {
                eprintln!("failed to configure LightEdit main panel: {error}");
            }
            Ok(())
        })
        .on_window_event(|window, event| {
            if window.label() != MAIN_WINDOW_LABEL {
                return;
            }

            match event {
                tauri::WindowEvent::CloseRequested { api, .. } => {
                    api.prevent_close();
                    if let Err(error) = window.hide() {
                        eprintln!("failed to hide LightEdit main window: {error}");
                    }
                    if let Err(error) =
                        window_native::restore_regular_activation_policy(window.app_handle())
                    {
                        eprintln!("failed to restore LightEdit activation policy: {error}");
                    }
                }
                tauri::WindowEvent::Focused(false)
                    if should_hide_on_focus_lost(
                        window.app_handle().state::<WindowSession>().is_pinned(),
                    ) =>
                {
                    if let Err(error) = window.hide() {
                        eprintln!("failed to auto-hide LightEdit main window: {error}");
                    }
                    if let Err(error) =
                        window_native::restore_regular_activation_policy(window.app_handle())
                    {
                        eprintln!("failed to restore LightEdit activation policy: {error}");
                    }
                }
                _ => {}
            }
        })
        .invoke_handler(tauri::generate_handler![
            show_main_window,
            hide_main_window,
            toggle_main_window,
            set_main_window_always_on_top,
        ])
        .run(tauri::generate_context!())
        .expect("error while running LightEdit");
}

#[cfg(test)]
mod tests {
    use super::{should_hide_on_focus_lost, WindowSession};

    #[test]
    fn unpinned_window_hides_on_focus_lost() {
        assert!(should_hide_on_focus_lost(false));
    }

    #[test]
    fn pinned_window_stays_visible_on_focus_lost() {
        assert!(!should_hide_on_focus_lost(true));
    }

    #[test]
    fn window_session_tracks_runtime_pin_state() {
        let session = WindowSession::default();

        assert!(!session.is_pinned());
        session.set_pinned(true);
        assert!(session.is_pinned());
        session.set_pinned(false);
        assert!(!session.is_pinned());
    }
}
