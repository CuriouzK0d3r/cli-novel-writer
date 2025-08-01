use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Theme {
    pub name: String,
    pub display_name: String,
    pub description: String,
    pub colors: ThemeColors,
    pub fonts: ThemeFonts,
    pub spacing: ThemeSpacing,
    pub effects: ThemeEffects,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThemeColors {
    // Background colors
    pub primary_bg: String,
    pub secondary_bg: String,
    pub tertiary_bg: String,
    pub accent_bg: String,

    // Text colors
    pub primary_text: String,
    pub secondary_text: String,
    pub muted_text: String,
    pub accent_text: String,
    pub link_text: String,

    // UI element colors
    pub border: String,
    pub button_bg: String,
    pub button_text: String,
    pub button_hover_bg: String,
    pub input_bg: String,
    pub input_border: String,
    pub input_focus_border: String,

    // Status colors
    pub success: String,
    pub warning: String,
    pub error: String,
    pub info: String,

    // Editor colors
    pub editor_bg: String,
    pub editor_text: String,
    pub editor_selection: String,
    pub editor_cursor: String,
    pub editor_line_numbers: String,
    pub editor_current_line: String,

    // Syntax highlighting
    pub syntax_keyword: String,
    pub syntax_string: String,
    pub syntax_comment: String,
    pub syntax_number: String,
    pub syntax_operator: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThemeFonts {
    pub primary_family: String,
    pub secondary_family: String,
    pub monospace_family: String,
    pub editor_family: String,

    pub base_size: u32,
    pub small_size: u32,
    pub large_size: u32,
    pub heading_size: u32,

    pub line_height: f32,
    pub letter_spacing: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThemeSpacing {
    pub xs: u32,
    pub sm: u32,
    pub md: u32,
    pub lg: u32,
    pub xl: u32,

    pub border_radius: u32,
    pub border_width: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThemeEffects {
    pub shadow_small: String,
    pub shadow_medium: String,
    pub shadow_large: String,

    pub transition_fast: String,
    pub transition_normal: String,
    pub transition_slow: String,

    pub blur_light: String,
    pub blur_heavy: String,
}

pub struct ThemeManager {
    themes: HashMap<String, Theme>,
    current_theme: String,
    custom_themes_path: PathBuf,
}

impl ThemeManager {
    pub fn new() -> Self {
        let custom_themes_path = dirs::config_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("writers-cli")
            .join("themes");

        let mut manager = Self {
            themes: HashMap::new(),
            current_theme: "dark".to_string(),
            custom_themes_path,
        };

        // Load built-in themes
        manager.load_builtin_themes();

        // Load custom themes
        if let Err(e) = manager.load_custom_themes() {
            log::warn!("Failed to load custom themes: {}", e);
        }

        manager
    }

    pub fn get_available_themes(&self) -> Vec<String> {
        self.themes.keys().cloned().collect()
    }

    pub fn get_current_theme(&self) -> String {
        self.current_theme.clone()
    }

    pub fn set_theme(&mut self, theme_name: &str) -> Result<()> {
        if !self.themes.contains_key(theme_name) {
            return Err(anyhow!("Theme '{}' not found", theme_name));
        }

        self.current_theme = theme_name.to_string();
        Ok(())
    }

    pub fn get_theme(&self, theme_name: &str) -> Option<&Theme> {
        self.themes.get(theme_name)
    }

    pub fn get_current_theme_data(&self) -> Option<&Theme> {
        self.themes.get(&self.current_theme)
    }

    pub fn add_custom_theme(&mut self, theme: Theme) -> Result<()> {
        // Save theme to file
        self.save_custom_theme(&theme)?;

        // Add to memory
        self.themes.insert(theme.name.clone(), theme);

        Ok(())
    }

    pub fn remove_custom_theme(&mut self, theme_name: &str) -> Result<()> {
        // Don't allow removal of built-in themes
        if self.is_builtin_theme(theme_name) {
            return Err(anyhow!("Cannot remove built-in theme '{}'", theme_name));
        }

        // Remove from file system
        let theme_file = self.custom_themes_path.join(format!("{}.json", theme_name));
        if theme_file.exists() {
            fs::remove_file(theme_file)?;
        }

        // Remove from memory
        self.themes.remove(theme_name);

        // If this was the current theme, switch to default
        if self.current_theme == theme_name {
            self.current_theme = "dark".to_string();
        }

        Ok(())
    }

    pub fn export_theme(&self, theme_name: &str, output_path: &PathBuf) -> Result<()> {
        let theme = self
            .themes
            .get(theme_name)
            .ok_or_else(|| anyhow!("Theme '{}' not found", theme_name))?;

        let theme_json = serde_json::to_string_pretty(theme)?;
        fs::write(output_path, theme_json)?;

        Ok(())
    }

    pub fn import_theme(&mut self, theme_path: &PathBuf) -> Result<String> {
        let theme_content = fs::read_to_string(theme_path)?;
        let theme: Theme = serde_json::from_str(&theme_content)?;

        let theme_name = theme.name.clone();
        self.add_custom_theme(theme)?;

        Ok(theme_name)
    }

    pub fn generate_css(&self, theme_name: &str) -> Result<String> {
        let theme = self
            .themes
            .get(theme_name)
            .ok_or_else(|| anyhow!("Theme '{}' not found", theme_name))?;

        let css = format!(
            r#"
/* Writers CLI Theme: {} */
:root {{
  /* Background Colors */
  --color-primary-bg: {};
  --color-secondary-bg: {};
  --color-tertiary-bg: {};
  --color-accent-bg: {};

  /* Text Colors */
  --color-primary-text: {};
  --color-secondary-text: {};
  --color-muted-text: {};
  --color-accent-text: {};
  --color-link-text: {};

  /* UI Element Colors */
  --color-border: {};
  --color-button-bg: {};
  --color-button-text: {};
  --color-button-hover-bg: {};
  --color-input-bg: {};
  --color-input-border: {};
  --color-input-focus-border: {};

  /* Status Colors */
  --color-success: {};
  --color-warning: {};
  --color-error: {};
  --color-info: {};

  /* Editor Colors */
  --color-editor-bg: {};
  --color-editor-text: {};
  --color-editor-selection: {};
  --color-editor-cursor: {};
  --color-editor-line-numbers: {};
  --color-editor-current-line: {};

  /* Syntax Highlighting */
  --color-syntax-keyword: {};
  --color-syntax-string: {};
  --color-syntax-comment: {};
  --color-syntax-number: {};
  --color-syntax-operator: {};

  /* Fonts */
  --font-primary: {};
  --font-secondary: {};
  --font-monospace: {};
  --font-editor: {};

  --font-size-base: {}px;
  --font-size-small: {}px;
  --font-size-large: {}px;
  --font-size-heading: {}px;

  --line-height: {};
  --letter-spacing: {}em;

  /* Spacing */
  --spacing-xs: {}px;
  --spacing-sm: {}px;
  --spacing-md: {}px;
  --spacing-lg: {}px;
  --spacing-xl: {}px;

  --border-radius: {}px;
  --border-width: {}px;

  /* Effects */
  --shadow-small: {};
  --shadow-medium: {};
  --shadow-large: {};

  --transition-fast: {};
  --transition-normal: {};
  --transition-slow: {};

  --blur-light: {};
  --blur-heavy: {};
}}

/* Base Styles */
body {{
  background-color: var(--color-primary-bg);
  color: var(--color-primary-text);
  font-family: var(--font-primary);
  font-size: var(--font-size-base);
  line-height: var(--line-height);
  letter-spacing: var(--letter-spacing);
}}

/* Editor Styles */
.editor {{
  background-color: var(--color-editor-bg);
  color: var(--color-editor-text);
  font-family: var(--font-editor);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--border-radius);
}}

.editor::selection {{
  background-color: var(--color-editor-selection);
}}

/* Button Styles */
.button {{
  background-color: var(--color-button-bg);
  color: var(--color-button-text);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--border-radius);
  padding: var(--spacing-sm) var(--spacing-md);
  transition: var(--transition-normal);
}}

.button:hover {{
  background-color: var(--color-button-hover-bg);
  box-shadow: var(--shadow-small);
}}

/* Input Styles */
.input {{
  background-color: var(--color-input-bg);
  color: var(--color-primary-text);
  border: var(--border-width) solid var(--color-input-border);
  border-radius: var(--border-radius);
  padding: var(--spacing-sm);
  transition: var(--transition-fast);
}}

.input:focus {{
  border-color: var(--color-input-focus-border);
  box-shadow: var(--shadow-small);
  outline: none;
}}
"#,
            theme.display_name,
            theme.colors.primary_bg,
            theme.colors.secondary_bg,
            theme.colors.tertiary_bg,
            theme.colors.accent_bg,
            theme.colors.primary_text,
            theme.colors.secondary_text,
            theme.colors.muted_text,
            theme.colors.accent_text,
            theme.colors.link_text,
            theme.colors.border,
            theme.colors.button_bg,
            theme.colors.button_text,
            theme.colors.button_hover_bg,
            theme.colors.input_bg,
            theme.colors.input_border,
            theme.colors.input_focus_border,
            theme.colors.success,
            theme.colors.warning,
            theme.colors.error,
            theme.colors.info,
            theme.colors.editor_bg,
            theme.colors.editor_text,
            theme.colors.editor_selection,
            theme.colors.editor_cursor,
            theme.colors.editor_line_numbers,
            theme.colors.editor_current_line,
            theme.colors.syntax_keyword,
            theme.colors.syntax_string,
            theme.colors.syntax_comment,
            theme.colors.syntax_number,
            theme.colors.syntax_operator,
            theme.fonts.primary_family,
            theme.fonts.secondary_family,
            theme.fonts.monospace_family,
            theme.fonts.editor_family,
            theme.fonts.base_size,
            theme.fonts.small_size,
            theme.fonts.large_size,
            theme.fonts.heading_size,
            theme.fonts.line_height,
            theme.fonts.letter_spacing,
            theme.spacing.xs,
            theme.spacing.sm,
            theme.spacing.md,
            theme.spacing.lg,
            theme.spacing.xl,
            theme.spacing.border_radius,
            theme.spacing.border_width,
            theme.effects.shadow_small,
            theme.effects.shadow_medium,
            theme.effects.shadow_large,
            theme.effects.transition_fast,
            theme.effects.transition_normal,
            theme.effects.transition_slow,
            theme.effects.blur_light,
            theme.effects.blur_heavy,
        );

        Ok(css)
    }

    fn load_builtin_themes(&mut self) {
        // Dark Theme
        let dark_theme = Theme {
            name: "dark".to_string(),
            display_name: "Dark".to_string(),
            description: "A sleek dark theme perfect for late-night writing sessions".to_string(),
            colors: ThemeColors {
                primary_bg: "#1a1a1a".to_string(),
                secondary_bg: "#2d2d2d".to_string(),
                tertiary_bg: "#3d3d3d".to_string(),
                accent_bg: "#4a90e2".to_string(),
                primary_text: "#e0e0e0".to_string(),
                secondary_text: "#b0b0b0".to_string(),
                muted_text: "#808080".to_string(),
                accent_text: "#4a90e2".to_string(),
                link_text: "#5dade2".to_string(),
                border: "#404040".to_string(),
                button_bg: "#3d3d3d".to_string(),
                button_text: "#e0e0e0".to_string(),
                button_hover_bg: "#4d4d4d".to_string(),
                input_bg: "#2d2d2d".to_string(),
                input_border: "#404040".to_string(),
                input_focus_border: "#4a90e2".to_string(),
                success: "#27ae60".to_string(),
                warning: "#f39c12".to_string(),
                error: "#e74c3c".to_string(),
                info: "#3498db".to_string(),
                editor_bg: "#1e1e1e".to_string(),
                editor_text: "#d4d4d4".to_string(),
                editor_selection: "#264f78".to_string(),
                editor_cursor: "#aeafad".to_string(),
                editor_line_numbers: "#858585".to_string(),
                editor_current_line: "#2a2d2e".to_string(),
                syntax_keyword: "#569cd6".to_string(),
                syntax_string: "#ce9178".to_string(),
                syntax_comment: "#6a9955".to_string(),
                syntax_number: "#b5cea8".to_string(),
                syntax_operator: "#d4d4d4".to_string(),
            },
            fonts: ThemeFonts {
                primary_family:
                    "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif".to_string(),
                secondary_family: "'Source Serif Pro', Georgia, serif".to_string(),
                monospace_family: "'JetBrains Mono', 'Fira Code', Consolas, monospace".to_string(),
                editor_family: "'Source Serif Pro', Georgia, serif".to_string(),
                base_size: 14,
                small_size: 12,
                large_size: 16,
                heading_size: 18,
                line_height: 1.6,
                letter_spacing: 0.01,
            },
            spacing: ThemeSpacing {
                xs: 4,
                sm: 8,
                md: 16,
                lg: 24,
                xl: 32,
                border_radius: 6,
                border_width: 1,
            },
            effects: ThemeEffects {
                shadow_small: "0 1px 3px rgba(0, 0, 0, 0.3)".to_string(),
                shadow_medium: "0 4px 6px rgba(0, 0, 0, 0.3)".to_string(),
                shadow_large: "0 10px 25px rgba(0, 0, 0, 0.3)".to_string(),
                transition_fast: "all 0.15s ease".to_string(),
                transition_normal: "all 0.3s ease".to_string(),
                transition_slow: "all 0.5s ease".to_string(),
                blur_light: "blur(2px)".to_string(),
                blur_heavy: "blur(8px)".to_string(),
            },
        };

        // Light Theme
        let light_theme = Theme {
            name: "light".to_string(),
            display_name: "Light".to_string(),
            description: "A clean light theme for daytime writing".to_string(),
            colors: ThemeColors {
                primary_bg: "#ffffff".to_string(),
                secondary_bg: "#f8f9fa".to_string(),
                tertiary_bg: "#e9ecef".to_string(),
                accent_bg: "#0066cc".to_string(),
                primary_text: "#212529".to_string(),
                secondary_text: "#495057".to_string(),
                muted_text: "#6c757d".to_string(),
                accent_text: "#0066cc".to_string(),
                link_text: "#0056b3".to_string(),
                border: "#dee2e6".to_string(),
                button_bg: "#f8f9fa".to_string(),
                button_text: "#212529".to_string(),
                button_hover_bg: "#e9ecef".to_string(),
                input_bg: "#ffffff".to_string(),
                input_border: "#ced4da".to_string(),
                input_focus_border: "#0066cc".to_string(),
                success: "#28a745".to_string(),
                warning: "#ffc107".to_string(),
                error: "#dc3545".to_string(),
                info: "#17a2b8".to_string(),
                editor_bg: "#ffffff".to_string(),
                editor_text: "#212529".to_string(),
                editor_selection: "#b3d4fc".to_string(),
                editor_cursor: "#000000".to_string(),
                editor_line_numbers: "#999999".to_string(),
                editor_current_line: "#f5f5f5".to_string(),
                syntax_keyword: "#0000ff".to_string(),
                syntax_string: "#008000".to_string(),
                syntax_comment: "#808080".to_string(),
                syntax_number: "#ff0000".to_string(),
                syntax_operator: "#000000".to_string(),
            },
            fonts: dark_theme.fonts.clone(),
            spacing: dark_theme.spacing.clone(),
            effects: ThemeEffects {
                shadow_small: "0 1px 3px rgba(0, 0, 0, 0.1)".to_string(),
                shadow_medium: "0 4px 6px rgba(0, 0, 0, 0.1)".to_string(),
                shadow_large: "0 10px 25px rgba(0, 0, 0, 0.1)".to_string(),
                transition_fast: "all 0.15s ease".to_string(),
                transition_normal: "all 0.3s ease".to_string(),
                transition_slow: "all 0.5s ease".to_string(),
                blur_light: "blur(2px)".to_string(),
                blur_heavy: "blur(8px)".to_string(),
            },
        };

        // Sepia Theme
        let sepia_theme = Theme {
            name: "sepia".to_string(),
            display_name: "Sepia".to_string(),
            description: "A warm, paper-like theme that's easy on the eyes".to_string(),
            colors: ThemeColors {
                primary_bg: "#f7f3e9".to_string(),
                secondary_bg: "#f0ead6".to_string(),
                tertiary_bg: "#e8dcc0".to_string(),
                accent_bg: "#8b4513".to_string(),
                primary_text: "#3c3c3c".to_string(),
                secondary_text: "#5a5a5a".to_string(),
                muted_text: "#7a7a7a".to_string(),
                accent_text: "#8b4513".to_string(),
                link_text: "#a0522d".to_string(),
                border: "#d4c5a9".to_string(),
                button_bg: "#f0ead6".to_string(),
                button_text: "#3c3c3c".to_string(),
                button_hover_bg: "#e8dcc0".to_string(),
                input_bg: "#ffffff".to_string(),
                input_border: "#d4c5a9".to_string(),
                input_focus_border: "#8b4513".to_string(),
                success: "#228b22".to_string(),
                warning: "#daa520".to_string(),
                error: "#cd5c5c".to_string(),
                info: "#4682b4".to_string(),
                editor_bg: "#f7f3e9".to_string(),
                editor_text: "#3c3c3c".to_string(),
                editor_selection: "#d4c5a9".to_string(),
                editor_cursor: "#3c3c3c".to_string(),
                editor_line_numbers: "#8b8680".to_string(),
                editor_current_line: "#f0ead6".to_string(),
                syntax_keyword: "#8b4513".to_string(),
                syntax_string: "#556b2f".to_string(),
                syntax_comment: "#9acd32".to_string(),
                syntax_number: "#cd853f".to_string(),
                syntax_operator: "#3c3c3c".to_string(),
            },
            fonts: dark_theme.fonts.clone(),
            spacing: dark_theme.spacing.clone(),
            effects: light_theme.effects.clone(),
        };

        // High Contrast Theme
        let high_contrast_theme = Theme {
            name: "high-contrast".to_string(),
            display_name: "High Contrast".to_string(),
            description: "A high contrast theme for improved accessibility".to_string(),
            colors: ThemeColors {
                primary_bg: "#000000".to_string(),
                secondary_bg: "#1a1a1a".to_string(),
                tertiary_bg: "#333333".to_string(),
                accent_bg: "#ffff00".to_string(),
                primary_text: "#ffffff".to_string(),
                secondary_text: "#ffffff".to_string(),
                muted_text: "#cccccc".to_string(),
                accent_text: "#ffff00".to_string(),
                link_text: "#00ffff".to_string(),
                border: "#ffffff".to_string(),
                button_bg: "#1a1a1a".to_string(),
                button_text: "#ffffff".to_string(),
                button_hover_bg: "#333333".to_string(),
                input_bg: "#000000".to_string(),
                input_border: "#ffffff".to_string(),
                input_focus_border: "#ffff00".to_string(),
                success: "#00ff00".to_string(),
                warning: "#ffff00".to_string(),
                error: "#ff0000".to_string(),
                info: "#00ffff".to_string(),
                editor_bg: "#000000".to_string(),
                editor_text: "#ffffff".to_string(),
                editor_selection: "#333333".to_string(),
                editor_cursor: "#ffffff".to_string(),
                editor_line_numbers: "#cccccc".to_string(),
                editor_current_line: "#1a1a1a".to_string(),
                syntax_keyword: "#ffff00".to_string(),
                syntax_string: "#00ff00".to_string(),
                syntax_comment: "#cccccc".to_string(),
                syntax_number: "#00ffff".to_string(),
                syntax_operator: "#ffffff".to_string(),
            },
            fonts: dark_theme.fonts.clone(),
            spacing: dark_theme.spacing.clone(),
            effects: ThemeEffects {
                shadow_small: "0 1px 3px rgba(255, 255, 255, 0.3)".to_string(),
                shadow_medium: "0 4px 6px rgba(255, 255, 255, 0.3)".to_string(),
                shadow_large: "0 10px 25px rgba(255, 255, 255, 0.3)".to_string(),
                transition_fast: "all 0.15s ease".to_string(),
                transition_normal: "all 0.3s ease".to_string(),
                transition_slow: "all 0.5s ease".to_string(),
                blur_light: "blur(2px)".to_string(),
                blur_heavy: "blur(8px)".to_string(),
            },
        };

        // Add all themes
        self.themes.insert("dark".to_string(), dark_theme);
        self.themes.insert("light".to_string(), light_theme);
        self.themes.insert("sepia".to_string(), sepia_theme);
        self.themes
            .insert("high-contrast".to_string(), high_contrast_theme);
    }

    fn load_custom_themes(&mut self) -> Result<()> {
        if !self.custom_themes_path.exists() {
            fs::create_dir_all(&self.custom_themes_path)?;
            return Ok(());
        }

        for entry in fs::read_dir(&self.custom_themes_path)? {
            let entry = entry?;
            let path = entry.path();

            if path.extension().map_or(false, |ext| ext == "json") {
                match self.load_theme_from_file(&path) {
                    Ok(theme) => {
                        self.themes.insert(theme.name.clone(), theme);
                    }
                    Err(e) => {
                        log::warn!("Failed to load theme from {}: {}", path.display(), e);
                    }
                }
            }
        }

        Ok(())
    }

    fn load_theme_from_file(&self, path: &PathBuf) -> Result<Theme> {
        let content = fs::read_to_string(path)?;
        let theme: Theme = serde_json::from_str(&content)?;
        Ok(theme)
    }

    fn save_custom_theme(&self, theme: &Theme) -> Result<()> {
        fs::create_dir_all(&self.custom_themes_path)?;

        let theme_file = self.custom_themes_path.join(format!("{}.json", theme.name));
        let theme_json = serde_json::to_string_pretty(theme)?;
        fs::write(theme_file, theme_json)?;

        Ok(())
    }

    fn is_builtin_theme(&self, theme_name: &str) -> bool {
        matches!(theme_name, "dark" | "light" | "sepia" | "high-contrast")
    }
}

impl Default for ThemeManager {
    fn default() -> Self {
        Self::new()
    }
}
