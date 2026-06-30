use tauri_plugin_global_shortcut::{Code, Modifiers, Shortcut};

pub const TOGGLE_WINDOW_SHORTCUT_NAME: &str = "toggle-window";

#[cfg(target_os = "macos")]
const PRIMARY_MODIFIER: Modifiers = Modifiers::SUPER;

#[cfg(not(target_os = "macos"))]
const PRIMARY_MODIFIER: Modifiers = Modifiers::CONTROL;

pub fn toggle_window_shortcut() -> Shortcut {
    Shortcut::new(Some(PRIMARY_MODIFIER | Modifiers::SHIFT), Code::KeyL)
}

pub fn matches_toggle_window(shortcut: &Shortcut) -> bool {
    *shortcut == toggle_window_shortcut()
}

#[cfg(test)]
mod tests {
    use super::{matches_toggle_window, toggle_window_shortcut};
    use tauri_plugin_global_shortcut::{Code, Modifiers};

    #[test]
    fn maps_toggle_window_shortcut() {
        let shortcut = toggle_window_shortcut();

        assert_eq!(shortcut.key, Code::KeyL);
        assert!(shortcut.mods.contains(Modifiers::SHIFT));
        assert!(matches_toggle_window(&shortcut));
    }
}
