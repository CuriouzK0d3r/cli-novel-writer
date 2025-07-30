const BaseTheme = require('./base-theme');

/**
 * Dark Theme - A beautiful modern dark theme for the Writers CLI editor
 * Inspired by popular dark themes like VS Code Dark+ and Dracula
 */
class DarkTheme extends BaseTheme {
  constructor() {
    super();
    this.name = 'dark';
    this.displayName = 'Dark Theme';
    this.isDark = true;

    // Override with dark theme colors and styles
    this.colors = this.getColors();
    this.styles = this.getStyles();
  }

  /**
   * Dark theme color palette
   * @returns {Object} Dark color definitions
   */
  getColors() {
    return {
      // Primary colors - Deep dark background with warm white text
      background: '#1e1e1e',
      foreground: '#d4d4d4',

      // UI elements - Subtle borders with accent highlights
      border: '#3e3e42',
      borderFocus: '#007acc',
      borderActive: '#00d4aa',

      // Status bars - Professional blue with high contrast
      statusBg: '#007acc',
      statusFg: '#ffffff',
      infoBg: '#252526',
      infoFg: '#cccccc',
      helpBg: '#2d2d30',
      helpFg: '#9cdcfe',

      // Text selection - Vibrant blue selection
      selectionBg: '#264f78',
      selectionFg: '#ffffff',

      // Cursor - Bright and visible
      cursor: '#ffffff',
      cursorInsert: '#aeafad',

      // Line numbers - Subtle but readable
      lineNumber: '#858585',
      lineNumberActive: '#c6c6c6',

      // Typewriter mode - Elegant dimming
      dimmed: '#5a5a5a',

      // Messages - Colorful and distinct
      success: '#4ec9b0',
      warning: '#ffcc02',
      error: '#f44747',
      info: '#9cdcfe',

      // Syntax highlighting colors
      syntax: {
        // Markdown specific
        heading: '#9cdcfe',        // Light blue for headings
        emphasis: '#ce9178',       // Orange for italic/bold
        strong: '#dcdcaa',         // Yellow for strong text
        link: '#4fc1ff',           // Bright blue for links
        code: '#d7ba7d',           // Golden for inline code
        codeBlock: '#ce9178',      // Orange for code blocks
        quote: '#6a9955',          // Green for blockquotes
        list: '#c586c0',           // Purple for list markers

        // General syntax
        keyword: '#569cd6',        // Blue for keywords
        string: '#ce9178',         // Orange for strings
        comment: '#6a9955',        // Green for comments
        number: '#b5cea8',         // Light green for numbers
        operator: '#d4d4d4',       // White for operators
        punctuation: '#d4d4d4',    // White for punctuation
        variable: '#9cdcfe',       // Light blue for variables
        function: '#dcdcaa',       // Yellow for functions
        type: '#4ec9b0',           // Teal for types
      }
    };
  }

  /**
   * Enhanced styles for dark theme
   * @returns {Object} Dark style configurations
   */
  getStyles() {
    return {
      editor: {
        fg: this.colors.foreground,
        bg: this.colors.background,
        border: {
          type: 'line',
          fg: this.colors.border
        },
        focus: {
          border: { fg: this.colors.borderFocus }
        },
        // Add subtle shadow effect
        shadow: true
      },

      statusBar: {
        fg: this.colors.statusFg,
        bg: this.colors.statusBg,
        bold: true
      },

      infoBar: {
        fg: this.colors.infoFg,
        bg: this.colors.infoBg
      },

      helpBar: {
        fg: this.colors.helpFg,
        bg: this.colors.helpBg
      }
    };
  }

  /**
   * Enhanced text formatting with dark theme colors
   * @param {string} text - Text to format
   * @param {string} type - Type of formatting
   * @returns {string} Formatted text
   */
  formatText(text, type = 'normal') {
    switch (type) {
      case 'selection':
        return `{${this.colors.selectionBg}-bg}{${this.colors.selectionFg}-fg}${text}{/}`;

      case 'dimmed':
        return `{${this.colors.dimmed}-fg}${text}{/}`;

      case 'lineNumber':
        return `{${this.colors.lineNumber}-fg}${text}{/}`;

      case 'lineNumberActive':
        return `{${this.colors.lineNumberActive}-fg}{bold}${text}{/}`;

      case 'cursor':
        return `{${this.colors.background}-bg}{${this.colors.cursor}-fg}{inverse}${text}{/inverse}{/}`;

      case 'cursorInsert':
        return `{${this.colors.cursorInsert}-fg}│{/}`;

      case 'success':
        return `{${this.colors.success}-fg}${text}{/}`;

      case 'warning':
        return `{${this.colors.warning}-fg}${text}{/}`;

      case 'error':
        return `{${this.colors.error}-fg}${text}{/}`;

      case 'info':
        return `{${this.colors.info}-fg}${text}{/}`;

      // Syntax highlighting types
      case 'heading':
        return `{${this.colors.syntax.heading}-fg}{bold}${text}{/}`;

      case 'emphasis':
        return `{${this.colors.syntax.emphasis}-fg}${text}{/}`;

      case 'strong':
        return `{${this.colors.syntax.strong}-fg}{bold}${text}{/}`;

      case 'link':
        return `{${this.colors.syntax.link}-fg}{underline}${text}{/}`;

      case 'code':
        return `{${this.colors.syntax.code}-fg}${text}{/}`;

      case 'codeBlock':
        return `{${this.colors.syntax.codeBlock}-fg}${text}{/}`;

      case 'quote':
        return `{${this.colors.syntax.quote}-fg}${text}{/}`;

      case 'list':
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
  getCursor(mode, char = ' ') {
    if (mode === 'insert') {
      return this.formatText('', 'cursorInsert');
    } else {
      return this.formatText(char, 'cursor');
    }
  }

  /**
   * Apply beautiful syntax highlighting for markdown
   * @param {string} text - Text to highlight
   * @param {string} language - Language for syntax highlighting
   * @returns {string} Highlighted text
   */
  applySyntaxHighlighting(text, language = 'markdown') {
    if (language !== 'markdown') {
      return text;
    }

    // Apply markdown syntax highlighting
    let highlighted = text;

    // Headers (# ## ###)
    highlighted = highlighted.replace(
      /^(#{1,6})\s+(.+)$/gm,
      (match, hashes, content) => {
        return this.formatText(hashes, 'syntax') + ' ' + this.formatText(content, 'heading');
      }
    );

    // Bold text (**text** or __text__)
    highlighted = highlighted.replace(
      /(\*\*|__)(.*?)\1/g,
      (match, marker, content) => {
        return this.formatText(marker, 'syntax') +
               this.formatText(content, 'strong') +
               this.formatText(marker, 'syntax');
      }
    );

    // Italic text (*text* or _text_)
    highlighted = highlighted.replace(
      /(?<!\*|\w)(\*|_)(?!\s)(.*?)(?<!\s)\1(?!\w)/g,
      (match, marker, content) => {
        return this.formatText(marker, 'syntax') +
               this.formatText(content, 'emphasis') +
               this.formatText(marker, 'syntax');
      }
    );

    // Inline code (`code`)
    highlighted = highlighted.replace(
      /`([^`]+)`/g,
      (match, content) => {
        return this.formatText('`', 'syntax') +
               this.formatText(content, 'code') +
               this.formatText('`', 'syntax');
      }
    );

    // Links [text](url)
    highlighted = highlighted.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      (match, text, url) => {
        return this.formatText('[', 'syntax') +
               this.formatText(text, 'link') +
               this.formatText('](', 'syntax') +
               this.formatText(url, 'info') +
               this.formatText(')', 'syntax');
      }
    );

    // Blockquotes (> text)
    highlighted = highlighted.replace(
      /^>\s+(.+)$/gm,
      (match, content) => {
        return this.formatText('>', 'syntax') + ' ' + this.formatText(content, 'quote');
      }
    );

    // List items (- * +)
    highlighted = highlighted.replace(
      /^(\s*)([-*+])\s+(.+)$/gm,
      (match, indent, marker, content) => {
        return indent + this.formatText(marker, 'list') + ' ' + content;
      }
    );

    // Numbered lists (1. 2. etc.)
    highlighted = highlighted.replace(
      /^(\s*)(\d+\.)\s+(.+)$/gm,
      (match, indent, marker, content) => {
        return indent + this.formatText(marker, 'list') + ' ' + content;
      }
    );

    return highlighted;
  }

  /**
   * Enhanced screen configuration for dark theme
   * @returns {Object} Screen options optimized for dark theme
   */
  getScreenConfig() {
    return {
      smartCSR: true,
      title: 'Writers CLI Editor - Dark Theme',
      cursor: {
        artificial: false,
        shape: 'line',
        blink: true
      },
      debug: false,
      // Enhanced for dark theme
      autoPadding: false,
      warnings: false
    };
  }

  /**
   * Get theme-specific welcome message
   * @returns {string} Themed welcome message
   */
  getWelcomeMessage() {
    return this.formatText('🌙 Dark Theme Active', 'info') +
           ' - ' +
           this.formatText('Happy Writing!', 'success');
  }

  /**
   * Get status bar content with theme colors
   * @param {Object} editorState - Current editor state
   * @returns {string} Formatted status bar content
   */
  getStatusBarContent(editorState) {
    const { mode, line, col, filename, modified, wordCount } = editorState;

    const modeText = mode === 'insert' ? 'INSERT' : 'NORMAL';
    const fileText = filename ? `📝 ${filename}` : '📄 New File';
    const modifiedText = modified ? ' ●' : '';
    const positionText = `Ln ${line}, Col ${col}`;
    const wordText = wordCount ? ` | ${wordCount} words` : '';

    return `${modeText} | ${fileText}${modifiedText} | ${positionText}${wordText}`;
  }
}

module.exports = DarkTheme;
