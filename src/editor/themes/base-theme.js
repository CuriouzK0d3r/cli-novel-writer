/**
 * Base Theme Class
 * Provides the foundation for all editor themes
 */
class BaseTheme {
  constructor() {
    this.name = "base";
    this.displayName = "Base Theme";
    this.isDark = false;

    // Initialize theme configuration
    this.colors = this.getColors();
    this.styles = this.getStyles();
  }

  /**
   * Get the color palette for this theme
   * @returns {Object} Color definitions
   */
  getColors() {
    return {
      // Primary colors
      background: "#ffffff",
      foreground: "#000000",

      // UI elements
      border: "#cccccc",
      borderFocus: "#0066cc",

      // Status bars
      statusBg: "#0066cc",
      statusFg: "#ffffff",
      infoBg: "#f5f5f5",
      infoFg: "#666666",
      helpBg: "#333333",
      helpFg: "#cccccc",

      // Text selection
      selectionBg: "#0066cc",
      selectionFg: "#ffffff",

      // Cursor
      cursor: "#000000",
      cursorInsert: "#666666",

      // Special text
      lineNumber: "#999999",

      // Typewriter mode
      dimmed: "#cccccc",

      // Messages
      success: "#00aa00",
      warning: "#ff8800",
      error: "#cc0000",
      info: "#0066cc",
    };
  }

  /**
   * Get style definitions for UI components
   * @returns {Object} Style configurations
   */
  getStyles() {
    return {
      editor: {
        fg: this.colors.foreground,
        bg: this.colors.background,
        border: {
          type: "line",
          fg: this.colors.border,
        },
        focus: {
          border: { fg: this.colors.borderFocus },
        },
      },

      statusBar: {
        fg: this.colors.statusFg,
        bg: this.colors.statusBg,
      },

      infoBar: {
        fg: this.colors.infoFg,
        bg: this.colors.infoBg,
      },

      helpBar: {
        fg: this.colors.helpFg,
        bg: this.colors.helpBg,
      },
    };
  }

  /**
   * Apply text formatting with theme colors
   * @param {string} text - Text to format
   * @param {string} type - Type of formatting (selection, dimmed, etc.)
   * @returns {string} Formatted text
   */
  formatText(text, type = "normal") {
    switch (type) {
      case "selection":
        return `{${this.colors.selectionBg}-bg}{${this.colors.selectionFg}-fg}${text}{/}`;

      case "dimmed":
        return `{${this.colors.dimmed}-fg}${text}{/}`;

      case "lineNumber":
        return `{${this.colors.lineNumber}-fg}${text}{/}`;

      case "cursor":
        return `{inverse}${text}{/inverse}`;

      case "cursorInsert":
        return `{${this.colors.cursorInsert}-fg}|{/}`;

      case "success":
        return `{${this.colors.success}-fg}${text}{/}`;

      case "warning":
        return `{${this.colors.warning}-fg}${text}{/}`;

      case "error":
        return `{${this.colors.error}-fg}${text}{/}`;

      case "info":
        return `{${this.colors.info}-fg}${text}{/}`;

      default:
        return text;
    }
  }

  /**
   * Get cursor style based on mode
   * @param {string} mode - Editor mode (insert, normal)
   * @param {string} char - Character at cursor position
   * @returns {string} Formatted cursor
   */
  getCursor(mode, char = " ") {
    if (mode === "insert") {
      return this.formatText("", "cursorInsert");
    } else {
      return this.formatText(char, "cursor");
    }
  }

  /**
   * Apply syntax highlighting (base implementation - no highlighting)
   * @param {string} text - Text to highlight
   * @param {string} language - Language for syntax highlighting
   * @returns {string} Highlighted text
   */
  applySyntaxHighlighting(text, language = "markdown") {
    // Base theme doesn't apply syntax highlighting
    return text;
  }

  /**
   * Get screen configuration
   * @returns {Object} Screen options for blessed
   */
  getScreenConfig() {
    return {
      smartCSR: true,
      title: "Writers CLI Editor",
      cursor: {
        artificial: false,
        shape: "line",
        blink: false,
      },
      debug: false,
    };
  }

  /**
   * Get status bar content with theme colors
   * @param {Object} editorState - Current editor state
   * @returns {string} Formatted status bar content
   */
  getStatusBarContent(editorState) {
    const { mode, line, col, filename, modified, wordCount, pomodoro } =
      editorState;

    const modeText = mode === "insert" ? "INSERT" : "NORMAL";
    const fileText = filename ? `📝 ${filename}` : "📄 New File";
    const modifiedText = modified ? " ●" : "";
    const positionText = `Ln ${line}, Col ${col}`;
    const wordText = wordCount ? ` | ${wordCount} words` : "";

    // Pomodoro timer display
    let pomodoroText = "";
    if (pomodoro && (pomodoro.isRunning || pomodoro.completedPomodoros > 0)) {
      const phaseIcon = pomodoro.phase === "work" ? "🍅" : "☕";
      const statusIcon = pomodoro.isRunning
        ? pomodoro.isPaused
          ? "⏸️"
          : "▶️"
        : "⏹️";
      pomodoroText = ` | ${phaseIcon} ${pomodoro.timeFormatted} ${statusIcon}`;

      if (pomodoro.completedPomodoros > 0) {
        pomodoroText += ` (${pomodoro.completedPomodoros})`;
      }
    }

    return `${modeText} | ${fileText}${modifiedText} | ${positionText}${wordText}${pomodoroText}`;
  }

  /**
   * Validate theme configuration
   * @returns {boolean} True if theme is valid
   */
  validate() {
    const requiredColors = [
      "background",
      "foreground",
      "border",
      "borderFocus",
      "statusBg",
      "statusFg",
      "selectionBg",
      "selectionFg",
    ];

    for (const color of requiredColors) {
      if (!this.colors[color]) {
        console.warn(`Theme ${this.name} missing required color: ${color}`);
        return false;
      }
    }

    return true;
  }
}

module.exports = BaseTheme;
