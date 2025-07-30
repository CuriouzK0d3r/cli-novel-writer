const BaseTheme = require("./base-theme");
const DarkTheme = require("./dark-theme");
const LightTheme = require("./light-theme");

/**
 * Theme Manager
 * Handles theme loading, switching, and configuration
 */
class ThemeManager {
  constructor() {
    this.themes = new Map();
    this.currentTheme = null;
    this.defaultTheme = "dark";

    // Register built-in themes
    this.registerTheme(new BaseTheme());
    this.registerTheme(new DarkTheme());
    this.registerTheme(new LightTheme());

    // Load default theme
    this.setTheme(this.defaultTheme);
  }

  /**
   * Register a new theme
   * @param {BaseTheme} theme - Theme instance to register
   */
  registerTheme(theme) {
    if (!(theme instanceof BaseTheme)) {
      throw new Error("Theme must extend BaseTheme");
    }

    if (!theme.validate()) {
      throw new Error(`Invalid theme: ${theme.name}`);
    }

    this.themes.set(theme.name, theme);
  }

  /**
   * Set the active theme
   * @param {string} themeName - Name of theme to activate
   * @returns {boolean} True if theme was set successfully
   */
  setTheme(themeName) {
    const theme = this.themes.get(themeName);
    if (!theme) {
      console.warn(`Theme '${themeName}' not found, using default`);
      return false;
    }

    this.currentTheme = theme;
    return true;
  }

  /**
   * Get the current active theme
   * @returns {BaseTheme} Current theme instance
   */
  getCurrentTheme() {
    return this.currentTheme || this.themes.get(this.defaultTheme);
  }

  /**
   * Get list of available themes
   * @returns {Array} Array of theme info objects
   */
  getAvailableThemes() {
    return Array.from(this.themes.values()).map((theme) => ({
      name: theme.name,
      displayName: theme.displayName,
      isDark: theme.isDark,
    }));
  }

  /**
   * Get theme by name
   * @param {string} themeName - Name of theme to get
   * @returns {BaseTheme|null} Theme instance or null if not found
   */
  getTheme(themeName) {
    return this.themes.get(themeName) || null;
  }

  /**
   * Check if a theme exists
   * @param {string} themeName - Name of theme to check
   * @returns {boolean} True if theme exists
   */
  hasTheme(themeName) {
    return this.themes.has(themeName);
  }

  /**
   * Switch to next available theme
   * @returns {BaseTheme} New active theme
   */
  nextTheme() {
    const themeNames = Array.from(this.themes.keys());
    const currentIndex = themeNames.indexOf(this.currentTheme.name);
    const nextIndex = (currentIndex + 1) % themeNames.length;
    const nextThemeName = themeNames[nextIndex];

    this.setTheme(nextThemeName);
    return this.currentTheme;
  }

  /**
   * Switch to previous available theme
   * @returns {BaseTheme} New active theme
   */
  previousTheme() {
    const themeNames = Array.from(this.themes.keys());
    const currentIndex = themeNames.indexOf(this.currentTheme.name);
    const prevIndex =
      currentIndex === 0 ? themeNames.length - 1 : currentIndex - 1;
    const prevThemeName = themeNames[prevIndex];

    this.setTheme(prevThemeName);
    return this.currentTheme;
  }

  /**
   * Get styles for blessed components
   * @returns {Object} Style configuration object
   */
  getComponentStyles() {
    const theme = this.getCurrentTheme();
    return theme.styles;
  }

  /**
   * Get screen configuration
   * @returns {Object} Screen configuration for blessed
   */
  getScreenConfig() {
    const theme = this.getCurrentTheme();
    return theme.getScreenConfig();
  }

  /**
   * Format text with theme styling
   * @param {string} text - Text to format
   * @param {string} type - Type of formatting to apply
   * @returns {string} Formatted text
   */
  formatText(text, type = "normal") {
    const theme = this.getCurrentTheme();
    return theme.formatText(text, type);
  }

  /**
   * Get cursor style for current theme
   * @param {string} mode - Editor mode
   * @param {string} char - Character at cursor position
   * @returns {string} Formatted cursor
   */
  getCursor(mode, char = " ") {
    const theme = this.getCurrentTheme();
    return theme.getCursor(mode, char);
  }

  /**
   * Apply syntax highlighting
   * @param {string} text - Text to highlight
   * @param {string} language - Language for syntax highlighting
   * @returns {string} Highlighted text
   */
  applySyntaxHighlighting(text, language = "markdown") {
    const theme = this.getCurrentTheme();
    return theme.applySyntaxHighlighting(text, language);
  }

  /**
   * Get welcome message for current theme
   * @returns {string} Themed welcome message
   */
  getWelcomeMessage() {
    const theme = this.getCurrentTheme();
    if (typeof theme.getWelcomeMessage === "function") {
      return theme.getWelcomeMessage();
    }
    return `Theme: ${theme.displayName}`;
  }

  /**
   * Get status bar content with theme formatting
   * @param {Object} editorState - Current editor state
   * @returns {string} Formatted status bar content
   */
  getStatusBarContent(editorState) {
    const theme = this.getCurrentTheme();
    if (typeof theme.getStatusBarContent === "function") {
      return theme.getStatusBarContent(editorState);
    }

    // Fallback status bar formatting
    const { mode, line, col, filename, modified, wordCount } = editorState;
    const modeText = mode === "insert" ? "INSERT" : "NORMAL";
    const fileText = filename || "New File";
    const modifiedText = modified ? " *" : "";
    const positionText = `${line}:${col}`;
    const wordText = wordCount ? ` | ${wordCount} words` : "";

    return `${modeText} | ${fileText}${modifiedText} | ${positionText}${wordText}`;
  }

  /**
   * Create theme-aware dialog configuration
   * @param {Object} baseConfig - Base dialog configuration
   * @returns {Object} Themed dialog configuration
   */
  createDialogConfig(baseConfig = {}) {
    const theme = this.getCurrentTheme();
    const styles = theme.styles;

    return {
      ...baseConfig,
      style: {
        fg: styles.editor.fg,
        bg: styles.editor.bg,
        border: {
          fg: styles.editor.border.fg,
        },
        focus: {
          border: {
            fg: styles.editor.focus.border.fg,
          },
        },
        ...baseConfig.style,
      },
    };
  }

  /**
   * Export current theme configuration
   * @returns {Object} Serializable theme configuration
   */
  exportThemeConfig() {
    const theme = this.getCurrentTheme();
    return {
      name: theme.name,
      displayName: theme.displayName,
      isDark: theme.isDark,
      colors: theme.colors,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get theme statistics
   * @returns {Object} Theme usage statistics
   */
  getThemeStats() {
    return {
      totalThemes: this.themes.size,
      currentTheme: this.currentTheme?.name || "none",
      availableThemes: Array.from(this.themes.keys()),
      darkThemes: Array.from(this.themes.values()).filter((t) => t.isDark)
        .length,
      lightThemes: Array.from(this.themes.values()).filter((t) => !t.isDark)
        .length,
    };
  }
}

module.exports = ThemeManager;
