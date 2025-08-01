const BaseTheme = require("./base-theme");

/**
 * Light Theme - A beautiful modern light theme for the Writers CLI editor
 * Inspired by clean, minimal interfaces with excellent readability
 */
class LightTheme extends BaseTheme {
  constructor() {
    super();
    this.name = "light";
    this.displayName = "Light Theme";
    this.isDark = false;

    // Override with light theme colors and styles
    this.colors = this.getColors();
    this.styles = this.getStyles();
  }

  /**
   * Light theme color palette
   * @returns {Object} Light color definitions
   */
  getColors() {
    return {
      // Primary colors - Clean white background with dark text
      background: "#ffffff",
      foreground: "#2d3748",

      // UI elements - Subtle borders with modern accents
      border: "#e2e8f0",
      borderFocus: "#4299e1",
      borderActive: "#38b2ac",

      // Status bars - Professional and clean
      statusBg: "#4299e1",
      statusFg: "#ffffff",
      infoBg: "#f7fafc",
      infoFg: "#4a5568",
      helpBg: "#edf2f7",
      helpFg: "#2d3748",

      // Dialog inputs - Enhanced contrast for better visibility
      inputBg: "#ffffff",
      inputFg: "#2d3748",
      inputBorder: "#cbd5e0",
      inputFocusBg: "#f7fafc",
      inputFocusBorder: "#4299e1",

      // Text selection - Gentle blue selection
      selectionBg: "#bee3f8",
      selectionFg: "#2a4365",

      // Cursor - Dark and visible
      cursor: "#2d3748",
      cursorInsert: "#718096",

      // Line numbers - Subtle but readable
      lineNumber: "#a0aec0",
      lineNumberActive: "#4a5568",

      // Typewriter mode - Gentle dimming
      dimmed: "#cbd5e0",

      // Messages - Clear and distinct
      success: "#38a169",
      warning: "#d69e2e",
      error: "#e53e3e",
      info: "#3182ce",

      // Syntax highlighting colors
      syntax: {
        // Markdown specific
        heading: "#2b6cb0", // Strong blue for headings
        emphasis: "#d56565", // Warm red for italic/bold
        strong: "#d69e2e", // Amber for strong text
        link: "#3182ce", // Blue for links
        code: "#805ad5", // Purple for inline code
        codeBlock: "#d56565", // Red for code blocks
        quote: "#38a169", // Green for blockquotes
        list: "#9f7aea", // Purple for list markers

        // General syntax
        keyword: "#2b6cb0", // Blue for keywords
        string: "#d56565", // Red for strings
        comment: "#38a169", // Green for comments
        number: "#38b2ac", // Teal for numbers
        operator: "#2d3748", // Dark for operators
        punctuation: "#4a5568", // Gray for punctuation
        variable: "#3182ce", // Blue for variables
        function: "#d69e2e", // Amber for functions
        type: "#38b2ac", // Teal for types
      },
    };
  }

  /**
   * Enhanced styles for light theme
   * @returns {Object} Light style configurations
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
        // Add subtle shadow effect
        shadow: false,
      },

      statusBar: {
        fg: this.colors.statusFg,
        bg: this.colors.statusBg,
        bold: true,
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
   * Enhanced text formatting with light theme colors
   * @param {string} text - Text to format
   * @param {string} type - Type of formatting
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

      case "lineNumberActive":
        return `{${this.colors.lineNumberActive}-fg}{bold}${text}{/}`;

      case "cursor":
        return `{${this.colors.background}-bg}{${this.colors.cursor}-fg}{inverse}${text}{/inverse}{/}`;

      case "cursorInsert":
        return `{${this.colors.cursorInsert}-fg}│{/}`;

      case "success":
        return `{${this.colors.success}-fg}${text}{/}`;

      case "warning":
        return `{${this.colors.warning}-fg}${text}{/}`;

      case "error":
        return `{${this.colors.error}-fg}${text}{/}`;

      case "info":
        return `{${this.colors.info}-fg}${text}{/}`;

      // Syntax highlighting types
      case "heading":
        return `{${this.colors.syntax.heading}-fg}{bold}${text}{/}`;

      case "emphasis":
        return `{${this.colors.syntax.emphasis}-fg}${text}{/}`;

      case "strong":
        return `{${this.colors.syntax.strong}-fg}{bold}${text}{/}`;

      case "link":
        return `{${this.colors.syntax.link}-fg}{underline}${text}{/}`;

      case "code":
        return `{${this.colors.syntax.code}-fg}${text}{/}`;

      case "codeBlock":
        return `{${this.colors.syntax.codeBlock}-fg}${text}{/}`;

      case "quote":
        return `{${this.colors.syntax.quote}-fg}${text}{/}`;

      case "list":
        return `{${this.colors.syntax.list}-fg}${text}{/}`;

      default:
        return text;
    }
  }

  /**
   * Enhanced cursor with modern styling
   * @param {string} mode - Editor mode
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
   * Apply beautiful syntax highlighting for markdown
   * @param {string} text - Text to highlight
   * @param {string} language - Language for syntax highlighting
   * @returns {string} Highlighted text
   */
  applySyntaxHighlighting(text, language = "markdown") {
    if (language !== "markdown") {
      return text;
    }

    // Apply markdown syntax highlighting
    let highlighted = text;

    // Headers (# ## ###)
    highlighted = highlighted.replace(
      /^(#{1,6})\s+(.+)$/gm,
      (match, hashes, content) => {
        return (
          this.formatText(hashes, "syntax") +
          " " +
          this.formatText(content, "heading")
        );
      },
    );

    // Bold text (**text** or __text__)
    highlighted = highlighted.replace(
      /(\*\*|__)(.*?)\1/g,
      (match, marker, content) => {
        return (
          this.formatText(marker, "syntax") +
          this.formatText(content, "strong") +
          this.formatText(marker, "syntax")
        );
      },
    );

    // Italic text (*text* or _text_)
    highlighted = highlighted.replace(
      /(?<!\*|\w)(\*|_)(?!\s)(.*?)(?<!\s)\1(?!\w)/g,
      (match, marker, content) => {
        return (
          this.formatText(marker, "syntax") +
          this.formatText(content, "emphasis") +
          this.formatText(marker, "syntax")
        );
      },
    );

    // Inline code (`code`)
    highlighted = highlighted.replace(/`([^`]+)`/g, (match, content) => {
      return (
        this.formatText("`", "syntax") +
        this.formatText(content, "code") +
        this.formatText("`", "syntax")
      );
    });

    // Links [text](url)
    highlighted = highlighted.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      (match, text, url) => {
        return (
          this.formatText("[", "syntax") +
          this.formatText(text, "link") +
          this.formatText("](", "syntax") +
          this.formatText(url, "info") +
          this.formatText(")", "syntax")
        );
      },
    );

    // Blockquotes (> text)
    highlighted = highlighted.replace(/^>\s+(.+)$/gm, (match, content) => {
      return (
        this.formatText(">", "syntax") + " " + this.formatText(content, "quote")
      );
    });

    // List items (- * +)
    highlighted = highlighted.replace(
      /^(\s*)([-*+])\s+(.+)$/gm,
      (match, indent, marker, content) => {
        return indent + this.formatText(marker, "list") + " " + content;
      },
    );

    // Numbered lists (1. 2. etc.)
    highlighted = highlighted.replace(
      /^(\s*)(\d+\.)\s+(.+)$/gm,
      (match, indent, marker, content) => {
        return indent + this.formatText(marker, "list") + " " + content;
      },
    );

    return highlighted;
  }

  /**
   * Enhanced screen configuration for light theme
   * @returns {Object} Screen options optimized for light theme
   */
  getScreenConfig() {
    return {
      smartCSR: true,
      title: "Writers CLI Editor - Light Theme",
      cursor: {
        artificial: false,
        shape: "line",
        blink: true,
      },
      debug: false,
      // Enhanced for light theme
      autoPadding: false,
      warnings: false,
    };
  }

  /**
   * Get theme-specific welcome message
   * @returns {string} Themed welcome message
   */
  getWelcomeMessage() {
    return (
      this.formatText("☀️ Light Theme Active", "info") +
      " - " +
      this.formatText("Happy Writing!", "success")
    );
  }

  /**
   * Get status bar content with theme colors
   * @param {Object} editorState - Current editor state
   * @returns {string} Formatted status bar content
   */
  getStatusBarContent(editorState) {
    const { mode, line, col, filename, modified, wordCount } = editorState;

    const modeText = mode === "insert" ? "INSERT" : "NORMAL";
    const fileText = filename ? `📝 ${filename}` : "📄 New File";
    const modifiedText = modified ? " ●" : "";
    const positionText = `Ln ${line}, Col ${col}`;
    const wordText = wordCount ? ` | ${wordCount} words` : "";

    return `${modeText} | ${fileText}${modifiedText} | ${positionText}${wordText}`;
  }
}

module.exports = LightTheme;
