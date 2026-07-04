#[cfg(target_os = "macos")]
use std::{thread, time::Duration};

use tauri::{AppHandle, WebviewWindow};

#[cfg(target_os = "macos")]
use tauri::{Manager, Wry};
#[cfg(target_os = "macos")]
use tauri_nspanel::{
    objc2::{rc::Retained as ObjcRetained, MainThreadMarker as ObjcMainThreadMarker},
    objc2_app_kit::{
        NSApplication, NSApplicationActivationPolicy, NSEvent as AppKitEvent,
        NSFloatingWindowLevel, NSNormalWindowLevel, NSScreen, NSWindow as AppKitWindow,
        NSWindowCollectionBehavior,
    },
    objc2_foundation::{NSPoint as ObjcNSPoint, NSRect as ObjcNSRect},
    tauri_panel, ManagerExt, PanelHandle, WebviewWindowExt,
};

#[cfg(target_os = "macos")]
tauri_panel! {
    panel!(LightEditPanel {
        config: {
            can_become_key_window: true,
            can_become_main_window: true,
            becomes_key_only_if_needed: false,
            is_floating_panel: true,
            hides_on_deactivate: false,
            works_when_modal: true
        }
    })
}

#[cfg(target_os = "macos")]
fn overlay_window_behavior() -> NSWindowCollectionBehavior {
    NSWindowCollectionBehavior::CanJoinAllSpaces
        | NSWindowCollectionBehavior::FullScreenAuxiliary
        | NSWindowCollectionBehavior::CanJoinAllApplications
        | NSWindowCollectionBehavior::IgnoresCycle
        | NSWindowCollectionBehavior::Transient
}

#[cfg(target_os = "macos")]
fn overlay_panel_level() -> i64 {
    NSFloatingWindowLevel as i64
}

#[cfg(target_os = "macos")]
fn normal_panel_level() -> i64 {
    NSNormalWindowLevel as i64
}

#[cfg(target_os = "macos")]
fn appkit_application() -> ObjcRetained<NSApplication> {
    let marker = ObjcMainThreadMarker::new().expect("must run on the AppKit main thread");
    NSApplication::sharedApplication(marker)
}

#[cfg(target_os = "macos")]
fn activation_policy_request_succeeded(is_already_desired: bool, change_succeeded: bool) -> bool {
    is_already_desired || change_succeeded
}

#[cfg(target_os = "macos")]
fn ensure_activation_policy(
    application: &NSApplication,
    desired: NSApplicationActivationPolicy,
) -> bool {
    let is_already_desired = application.activationPolicy() == desired;
    if is_already_desired {
        return activation_policy_request_succeeded(true, false);
    }
    activation_policy_request_succeeded(false, application.setActivationPolicy(desired))
}

#[cfg(target_os = "macos")]
fn activate_lightedit_overlay(application: &NSApplication) -> Result<(), String> {
    if !ensure_activation_policy(application, NSApplicationActivationPolicy::Accessory) {
        return Err("Unable to switch LightEdit into overlay activation mode.".to_string());
    }
    application.activate();
    Ok(())
}

#[cfg(target_os = "macos")]
fn restore_regular_activation_policy_on_main_thread() -> Result<(), String> {
    let application = appkit_application();
    ensure_activation_policy(&application, NSApplicationActivationPolicy::Regular)
        .then_some(())
        .ok_or_else(|| "Unable to restore LightEdit regular activation mode.".to_string())
}

#[cfg(target_os = "macos")]
fn configure_panel_for_overlay(panel: &PanelHandle<Wry>) {
    panel.set_level(overlay_panel_level());
    panel.set_floating_panel(true);
    panel.set_becomes_key_only_if_needed(false);
    panel.set_hides_on_deactivate(false);
    panel.set_works_when_modal(true);
    panel.set_released_when_closed(false);
    panel.set_has_shadow(true);
    panel.set_opaque(true);
    panel.set_transparent(false);
    panel.set_movable_by_window_background(true);
    panel.set_collection_behavior(overlay_window_behavior());
}

#[cfg(target_os = "macos")]
fn get_or_create_main_panel(app: &AppHandle, label: &str) -> Result<PanelHandle<Wry>, String> {
    if let Ok(panel) = app.get_webview_panel(label) {
        return Ok(panel);
    }

    app.get_webview_window(label)
        .ok_or_else(|| format!("LightEdit window `{label}` is unavailable."))?
        .to_panel::<LightEditPanel>()
        .map_err(|error| error.to_string())
}

#[cfg(target_os = "macos")]
pub fn configure_main_panel(app: &AppHandle, label: &str) -> Result<(), String> {
    let panel = get_or_create_main_panel(app, label)?;
    configure_panel_for_overlay(&panel);
    Ok(())
}

#[cfg(not(target_os = "macos"))]
pub fn configure_main_panel(_app: &AppHandle, _label: &str) -> Result<(), String> {
    Ok(())
}

#[cfg(target_os = "macos")]
fn clamp_f64(value: f64, min: f64, max: f64) -> f64 {
    value.max(min).min(max.max(min))
}

#[cfg(target_os = "macos")]
fn top_left_for_cursor(
    cursor: (f64, f64),
    window_size: (f64, f64),
    visible_frame: (f64, f64, f64, f64),
) -> (f64, f64) {
    let (visible_x, visible_y, visible_width, visible_height) = visible_frame;
    let origin_x = clamp_f64(
        cursor.0 - window_size.0 / 2.0,
        visible_x,
        visible_x + visible_width - window_size.0,
    );
    let origin_y = clamp_f64(
        cursor.1 - window_size.1 / 2.0,
        visible_y,
        visible_y + visible_height - window_size.1,
    );
    (origin_x, origin_y + window_size.1)
}

#[cfg(target_os = "macos")]
fn point_is_inside_rect(point: ObjcNSPoint, rect: ObjcNSRect) -> bool {
    point.x >= rect.origin.x
        && point.x < rect.origin.x + rect.size.width
        && point.y >= rect.origin.y
        && point.y < rect.origin.y + rect.size.height
}

#[cfg(target_os = "macos")]
fn visible_frame_for_point(marker: ObjcMainThreadMarker, point: ObjcNSPoint) -> Option<ObjcNSRect> {
    let screens = NSScreen::screens(marker);
    for index in 0..screens.count() {
        let screen = screens.objectAtIndex(index);
        if point_is_inside_rect(point, screen.frame()) {
            return Some(screen.visibleFrame());
        }
    }
    NSScreen::mainScreen(marker).map(|screen| screen.visibleFrame())
}

#[cfg(target_os = "macos")]
fn position_native_window_near_cursor(native_window: &AppKitWindow) -> Result<(), String> {
    let frame = native_window.frame();
    let window_size = (frame.size.width, frame.size.height);
    let marker = ObjcMainThreadMarker::new().expect("must run on the AppKit main thread");
    let cursor = AppKitEvent::mouseLocation();
    let visible = visible_frame_for_point(marker, cursor)
        .ok_or_else(|| "Unable to find the display under the cursor.".to_string())?;
    let top_left = top_left_for_cursor(
        (cursor.x, cursor.y),
        window_size,
        (
            visible.origin.x,
            visible.origin.y,
            visible.size.width,
            visible.size.height,
        ),
    );
    native_window.setFrameTopLeftPoint(ObjcNSPoint::new(top_left.0, top_left.1));
    Ok(())
}

#[cfg(target_os = "macos")]
fn with_native_window<T>(
    window: &WebviewWindow,
    callback: impl FnOnce(&AppKitWindow) -> T + Send + 'static,
) -> Result<T, String>
where
    T: Send + 'static,
{
    let ns_window = window.ns_window().map_err(|error| error.to_string())? as usize;
    if ObjcMainThreadMarker::new().is_some() {
        let native_window = unsafe { &*(ns_window as *const AppKitWindow) };
        return Ok(callback(native_window));
    }

    let (sender, receiver) = std::sync::mpsc::sync_channel(1);
    window
        .run_on_main_thread(move || {
            let native_window = unsafe { &*(ns_window as *const AppKitWindow) };
            let _ = sender.send(callback(native_window));
        })
        .map_err(|error| error.to_string())?;
    receiver.recv().map_err(|error| error.to_string())
}

#[cfg(target_os = "macos")]
pub fn position_main_window_near_cursor(window: &WebviewWindow) -> Result<(), String> {
    with_native_window(window, position_native_window_near_cursor)?
}

#[cfg(not(target_os = "macos"))]
pub fn position_main_window_near_cursor(_window: &WebviewWindow) -> Result<(), String> {
    Ok(())
}

#[cfg(target_os = "macos")]
pub fn restore_regular_activation_policy(app: &AppHandle) -> Result<(), String> {
    if ObjcMainThreadMarker::new().is_some() {
        return restore_regular_activation_policy_on_main_thread();
    }

    let (sender, receiver) = std::sync::mpsc::sync_channel(1);
    app.run_on_main_thread(move || {
        let _ = sender.send(restore_regular_activation_policy_on_main_thread());
    })
    .map_err(|error| error.to_string())?;
    receiver.recv().map_err(|error| error.to_string())?
}

#[cfg(not(target_os = "macos"))]
pub fn restore_regular_activation_policy(_app: &AppHandle) -> Result<(), String> {
    Ok(())
}

#[cfg(target_os = "macos")]
fn raise_native_window(native_window: &AppKitWindow) {
    native_window.setLevel(NSFloatingWindowLevel);
    native_window.setCollectionBehavior(overlay_window_behavior());
    native_window.setHidesOnDeactivate(false);
    native_window.setCanHide(false);
    native_window.orderFrontRegardless();
    native_window.makeKeyAndOrderFront(None);
}

#[cfg(target_os = "macos")]
pub fn set_main_window_floating(window: &WebviewWindow, pinned: bool) -> Result<(), String> {
    let app = window.app_handle().clone();
    let label = window.label().to_string();
    let panel = app.get_webview_panel(&label).ok();
    if let Some(panel) = panel {
        window
            .run_on_main_thread(move || {
                panel.set_floating_panel(pinned);
                panel.set_hides_on_deactivate(!pinned);
                if pinned {
                    panel.set_level(overlay_panel_level());
                    panel.set_collection_behavior(overlay_window_behavior());
                    panel.order_front_regardless();
                } else {
                    panel.set_level(normal_panel_level());
                    panel.set_collection_behavior(NSWindowCollectionBehavior::Default);
                }
            })
            .map_err(|error| error.to_string())?;
        return Ok(());
    }

    with_native_window(window, move |native_window| {
        if pinned {
            native_window.setLevel(NSFloatingWindowLevel);
            native_window.setCollectionBehavior(overlay_window_behavior());
            native_window.setHidesOnDeactivate(false);
            native_window.setCanHide(false);
            native_window.orderFrontRegardless();
        } else {
            native_window.setLevel(NSNormalWindowLevel);
            native_window.setCollectionBehavior(NSWindowCollectionBehavior::Default);
            native_window.setHidesOnDeactivate(true);
            native_window.setCanHide(true);
        }
    })
}

#[cfg(target_os = "macos")]
pub fn raise_main_window(window: &WebviewWindow) -> Result<(), String> {
    let app = window.app_handle().clone();
    let label = window.label().to_string();
    if let Ok(panel) = app.get_webview_panel(&label) {
        let (sender, receiver) = std::sync::mpsc::sync_channel(1);
        window
            .run_on_main_thread(move || {
                let result = (|| {
                    let application = appkit_application();
                    activate_lightedit_overlay(&application)?;
                    configure_panel_for_overlay(&panel);
                    // Re-apply all-Spaces behavior after switching to Accessory so
                    // WindowServer creates the panel in the currently active Space,
                    // including another app's fullscreen Space.
                    panel.set_collection_behavior(overlay_window_behavior());
                    panel.show();
                    panel.order_front_regardless();
                    panel.show_and_make_key();
                    Ok::<(), String>(())
                })();
                let _ = sender.send(result);
            })
            .map_err(|error| error.to_string())?;
        receiver.recv().map_err(|error| error.to_string())??;
        return Ok(());
    }

    with_native_window(window, move |native_window| {
        let application = appkit_application();
        activate_lightedit_overlay(&application)?;
        raise_native_window(native_window);
        Ok::<(), String>(())
    })
    .and_then(|result| result)
}

#[cfg(target_os = "macos")]
pub fn schedule_deferred_raise(window: &WebviewWindow) {
    let pending_window = window.clone();
    thread::spawn(move || {
        for _ in 0..12 {
            thread::sleep(Duration::from_millis(20));
            if !pending_window.is_visible().unwrap_or(false) {
                return;
            }
            if raise_main_window(&pending_window).is_err() {
                return;
            }
        }
    });
}

#[cfg(not(target_os = "macos"))]
pub fn schedule_deferred_raise(_window: &WebviewWindow) {}

#[cfg(not(target_os = "macos"))]
pub fn raise_main_window(_window: &WebviewWindow) -> Result<(), String> {
    Ok(())
}

#[cfg(not(target_os = "macos"))]
pub fn set_main_window_floating(_window: &WebviewWindow, _pinned: bool) -> Result<(), String> {
    Ok(())
}

#[cfg(test)]
mod tests {
    #[cfg(target_os = "macos")]
    #[test]
    fn overlay_window_behavior_spans_apps_and_spaces() {
        use super::overlay_window_behavior;
        use tauri_nspanel::objc2_app_kit::NSWindowCollectionBehavior;

        let behavior = overlay_window_behavior();
        assert!(behavior.contains(NSWindowCollectionBehavior::CanJoinAllSpaces));
        assert!(behavior.contains(NSWindowCollectionBehavior::FullScreenAuxiliary));
        assert!(behavior.contains(NSWindowCollectionBehavior::CanJoinAllApplications));
        assert!(behavior.contains(NSWindowCollectionBehavior::IgnoresCycle));
        assert!(behavior.contains(NSWindowCollectionBehavior::Transient));
    }

    #[cfg(target_os = "macos")]
    #[test]
    fn cursor_positioning_supports_negative_origin_external_display() {
        let top_left = super::top_left_for_cursor(
            (-900.0, 450.0),
            (800.0, 560.0),
            (-1920.0, 0.0, 1920.0, 1080.0),
        );

        assert_eq!(top_left, (-1300.0, 730.0));
    }

    #[cfg(target_os = "macos")]
    #[test]
    fn cursor_positioning_clamps_to_visible_frame() {
        let top_left =
            super::top_left_for_cursor((1400.0, 890.0), (800.0, 560.0), (0.0, 23.0, 1440.0, 844.0));

        assert_eq!(top_left, (640.0, 867.0));
    }

    #[cfg(target_os = "macos")]
    #[test]
    fn activation_policy_success_accepts_already_desired_policy() {
        assert!(super::activation_policy_request_succeeded(true, false));
        assert!(super::activation_policy_request_succeeded(false, true));
        assert!(!super::activation_policy_request_succeeded(false, false));
    }
}
