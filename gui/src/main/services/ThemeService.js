const { nativeTheme } = require('electron');
const fs = require('fs-extra');
const path = require('path');

class ThemeService {
  constructor() {
    this.themes = new Map();
    this.currentTheme = 'dark';
    this.customThemes = new Map();
    this.themeChangeCallbacks = new Set();

    this.initializeBuiltInThemes();
  }

  /**
   * Initialize built-in themes
   */
  initializeBuiltInThemes() {
    // Dark theme (default)
    this.themes.set('dark', {
      name: 'Dark',
      id: 'dark',
      type: 'built-in',
      colors: {
        // Main colors
        background: '#1a1a1a',
        foreground: '#e0e0e0',
        accent: '#007acc',

        // UI elements
        sidebar: '#2d2d2d',
        toolbar: '#333333',
        statusbar: '#252525',
        border: '#404040',

        // Editor
        editorBackground: '#1e1e1e',
        editorForeground: '#d4d4d4',
        lineNumber: '#858585',
        selection: '#264f78',
        cursor: '#aeafad',

        // Syntax highlighting
        keyword: '#569cd6',
        string: '#ce9178',
        comment: '#6a9955',
        number: '#b5cea8',
        operator: '#d4d4d4',

        // States
        hover: '#404040',
        active: '#007acc',
        disabled: '#6a6a6a',

        // Notifications
        success: '#4caf50',
        warning: '#ff9800',
        error: '#f44336',
        info: '#2196f3'
      },
      typography: {
        fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, "Courier New", monospace',
        fontSize: 14,
        lineHeight: 1.6
      }
    });

    // Light theme
    this.themes.set('light', {
      name: 'Light',
      id: 'light',
      type: 'built-in',
      colors: {
        background: '#ffffff',
        foreground: '#333333',
        accent: '#0078d4',

        sidebar: '#f8f8f8',
        toolbar: '#f0f0f0',
        statusbar: '#eeeeee',
        border: '#d0d0d0',

        editorBackground: '#ffffff',
        editorForeground: '#333333',
        lineNumber: '#666666',
        selection: '#add6ff',
        cursor: '#000000',

        keyword: '#0000ff',
        string: '#a31515',
        comment: '#008000',
        number: '#098658',
        operator: '#333333',

        hover: '#e0e0e0',
        active: '#0078d4',
        disabled: '#999999',

        success: '#4caf50',
        warning: '#ff9800',
        error: '#f44336',
        info: '#2196f3'
      },
      typography: {
        fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, "Courier New", monospace',
        fontSize: 14,
        lineHeight: 1.6
      }
    });

    // High contrast theme
    this.themes.set('high-contrast', {
      name: 'High Contrast',
      id: 'high-contrast',
      type: 'built-in',
      colors: {
        background: '#000000',
        foreground: '#ffffff',
        accent: '#ffff00',

        sidebar: '#000000',
        toolbar: '#000000',
        statusbar: '#000000',
        border: '#ffffff',

        editorBackground: '#000000',
        editorForeground: '#ffffff',
        lineNumber: '#ffffff',
        selection: '#0000ff',
        cursor: '#ffffff',

        keyword: '#00ffff',
        string: '#00ff00',
        comment: '#808080',
        number: '#ffff00',
        operator: '#ffffff',

        hover: '#333333',
        active: '#ffff00',
        disabled: '#808080',

        success: '#00ff00',
        warning: '#ffff00',
        error: '#ff0000',
        info: '#00ffff'
      },
      typography: {
        fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, "Courier New", monospace',
        fontSize: 16,
        lineHeight: 1.8
      }
    });

    // Sepia theme (easy on eyes)
    this.themes.set('sepia', {
      name: 'Sepia',
      id: 'sepia',
      type: 'built-in',
      colors: {
        background: '#f4f1ea',
        foreground: '#5c4b37',
        accent: '#8b4513',

        sidebar: '#ede6d3',
        toolbar: '#e8dcc0',
        statusbar: '#e0d3b7',
        border: '#d2c5a2',

        editorBackground: '#faf6ef',
        editorForeground: '#5c4b37',
        lineNumber: '#8b7d6b',
        selection: '#d2c5a2',
        cursor: '#5c4b37',

        keyword: '#8b4513',
        string: '#a0522d',
        comment: '#8fbc8f',
        number: '#cd853f',
        operator: '#5c4b37',

        hover: '#e8dcc0',
        active: '#8b4513',
        disabled: '#a0a0a0',

        success: '#8fbc8f',
        warning: '#daa520',
        error: '#cd5c5c',
        info: '#4682b4'
      },
      typography: {
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: 14,
        lineHeight: 1.7
      }
    });

    // Monokai theme
    this.themes.set('monokai', {
      name: 'Monokai',
      id: 'monokai',
      type: 'built-in',
      colors: {
        background: '#272822',
        foreground: '#f8f8f2',
        accent: '#66d9ef',

        sidebar: '#3e3d32',
        toolbar: '#414339',
        statusbar: '#3a3936',
        border: '#49483e',

        editorBackground: '#272822',
        editorForeground: '#f8f8f2',
        lineNumber: '#90908a',
        selection: '#49483e',
        cursor: '#f8f8f0',

        keyword: '#f92672',
        string: '#e6db74',
        comment: '#75715e',
        number: '#ae81ff',
        operator: '#f8f8f2',

        hover: '#49483e',
        active: '#66d9ef',
        disabled: '#75715e',

        success: '#a6e22e',
        warning: '#fd971f',
        error: '#f92672',
        info: '#66d9ef'
      },
      typography: {
        fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, "Courier New", monospace',
        fontSize: 14,
        lineHeight: 1.6
      }
    });

    // Solarized Dark
    this.themes.set('solarized-dark', {
      name: 'Solarized Dark',
      id: 'solarized-dark',
      type: 'built-in',
      colors: {
        background: '#002b36',
        foreground: '#839496',
        accent: '#268bd2',

        sidebar: '#073642',
        toolbar: '#0a3c47',
        statusbar: '#073642',
        border: '#586e75',

        editorBackground: '#002b36',
        editorForeground: '#839496',
        lineNumber: '#586e75',
        selection: '#073642',
        cursor: '#93a1a1',

        keyword: '#859900',
        string: '#2aa198',
        comment: '#586e75',
        number: '#d33682',
        operator: '#839496',

        hover: '#073642',
        active: '#268bd2',
        disabled: '#586e75',

        success: '#859900',
        warning: '#b58900',
        error: '#dc322f',
        info: '#268bd2'
      },
      typography: {
        fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, "Courier New", monospace',
        fontSize: 14,
        lineHeight: 1.6
      }
    });
  }

  /**
   * Get all available themes
   */
  getAllThemes() {
    const themes = [];

    // Add built-in themes
    for (const theme of this.themes.values()) {
      themes.push(theme);
    }

    // Add custom themes
    for (const theme of this.customThemes.values()) {
      themes.push(theme);
    }

    return themes;
  }

  /**
   * Get theme by ID
   */
  getTheme(themeId) {
    return this.themes.get(themeId) || this.customThemes.get(themeId);
  }

  /**
   * Get current theme
   */
  getCurrentTheme() {
    return this.getTheme(this.currentTheme) || this.themes.get('dark');
  }

  /**
   * Set current theme
   */
  async setTheme(themeId) {
    const theme = this.getTheme(themeId);
    if (!theme) {
      throw new Error(`Theme not found: ${themeId}`);
    }

    this.currentTheme = themeId;

    // Update native theme if needed
    if (themeId === 'light') {
      nativeTheme.themeSource = 'light';
    } else if (themeId === 'dark') {
      nativeTheme.themeSource = 'dark';
    } else {
      nativeTheme.themeSource = 'system';
    }

    // Notify all callbacks
    for (const callback of this.themeChangeCallbacks) {
      try {
        callback(theme);
      } catch (error) {
        console.error('Error in theme change callback:', error);
      }
    }

    return theme;
  }

  /**
   * Add theme change listener
   */
  onThemeChange(callback) {
    this.themeChangeCallbacks.add(callback);

    // Return unsubscribe function
    return () => {
      this.themeChangeCallbacks.delete(callback);
    };
  }

  /**
   * Create custom theme
   */
  createCustomTheme(themeData) {
    const theme = {
      ...themeData,
      type: 'custom',
      id: themeData.id || `custom-${Date.now()}`,
      created: new Date().toISOString()
    };

    // Validate theme structure
    if (!this.validateTheme(theme)) {
      throw new Error('Invalid theme structure');
    }

    this.customThemes.set(theme.id, theme);
    return theme;
  }

  /**
   * Update custom theme
   */
  updateCustomTheme(themeId, updates) {
    const theme = this.customThemes.get(themeId);
    if (!theme) {
      throw new Error(`Custom theme not found: ${themeId}`);
    }

    const updatedTheme = {
      ...theme,
      ...updates,
      modified: new Date().toISOString()
    };

    if (!this.validateTheme(updatedTheme)) {
      throw new Error('Invalid theme structure');
    }

    this.customThemes.set(themeId, updatedTheme);

    // If this is the current theme, apply changes
    if (this.currentTheme === themeId) {
      this.setTheme(themeId);
    }

    return updatedTheme;
  }

  /**
   * Delete custom theme
   */
  deleteCustomTheme(themeId) {
    const theme = this.customThemes.get(themeId);
    if (!theme) {
      throw new Error(`Custom theme not found: ${themeId}`);
    }

    this.customThemes.delete(themeId);

    // If this was the current theme, switch to default
    if (this.currentTheme === themeId) {
      this.setTheme('dark');
    }

    return true;
  }

  /**
   * Validate theme structure
   */
  validateTheme(theme) {
    if (!theme || typeof theme !== 'object') {
      return false;
    }

    // Required fields
    const requiredFields = ['name', 'id', 'colors'];
    for (const field of requiredFields) {
      if (!theme[field]) {
        return false;
      }
    }

    // Required colors
    const requiredColors = [
      'background', 'foreground', 'accent',
      'editorBackground', 'editorForeground'
    ];

    for (const color of requiredColors) {
      if (!theme.colors[color]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Generate CSS from theme
   */
  generateCSS(theme) {
    if (!theme) {
      theme = this.getCurrentTheme();
    }

    const { colors, typography } = theme;

    return `
      :root {
        /* Main colors */
        --color-background: ${colors.background};
        --color-foreground: ${colors.foreground};
        --color-accent: ${colors.accent};

        /* UI elements */
        --color-sidebar: ${colors.sidebar};
        --color-toolbar: ${colors.toolbar || colors.sidebar};
        --color-statusbar: ${colors.statusbar || colors.sidebar};
        --color-border: ${colors.border};

        /* Editor */
        --color-editor-background: ${colors.editorBackground};
        --color-editor-foreground: ${colors.editorForeground};
        --color-line-number: ${colors.lineNumber || colors.foreground};
        --color-selection: ${colors.selection || colors.accent + '40'};
        --color-cursor: ${colors.cursor || colors.foreground};

        /* Syntax highlighting */
        --color-keyword: ${colors.keyword || colors.accent};
        --color-string: ${colors.string || colors.foreground};
        --color-comment: ${colors.comment || colors.foreground + '80'};
        --color-number: ${colors.number || colors.accent};
        --color-operator: ${colors.operator || colors.foreground};

        /* States */
        --color-hover: ${colors.hover || colors.accent + '20'};
        --color-active: ${colors.active || colors.accent};
        --color-disabled: ${colors.disabled || colors.foreground + '60'};

        /* Notifications */
        --color-success: ${colors.success || '#4caf50'};
        --color-warning: ${colors.warning || '#ff9800'};
        --color-error: ${colors.error || '#f44336'};
        --color-info: ${colors.info || colors.accent};

        /* Typography */
        --font-family: ${typography?.fontFamily || 'Monaco, monospace'};
        --font-size: ${typography?.fontSize || 14}px;
        --line-height: ${typography?.lineHeight || 1.6};
      }

      /* Apply theme to body */
      body {
        background-color: var(--color-background);
        color: var(--color-foreground);
        font-family: var(--font-family);
        font-size: var(--font-size);
        line-height: var(--line-height);
      }
    `;
  }

  /**
   * Get background color for window
   */
  getBackgroundColor(themeId = null) {
    const theme = themeId ? this.getTheme(themeId) : this.getCurrentTheme();
    return theme?.colors?.background || '#1a1a1a';
  }

  /**
   * Auto-detect system theme preference
   */
  detectSystemTheme() {
    return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
  }

  /**
   * Import theme from file
   */
  async importTheme(filePath) {
    try {
      if (!await fs.pathExists(filePath)) {
        throw new Error('Theme file does not exist');
      }

      const themeData = await fs.readFile(filePath, 'utf8');
      const theme = JSON.parse(themeData);

      if (!this.validateTheme(theme)) {
        throw new Error('Invalid theme format');
      }

      // Ensure unique ID
      if (this.themes.has(theme.id) || this.customThemes.has(theme.id)) {
        theme.id = `${theme.id}-imported-${Date.now()}`;
      }

      return this.createCustomTheme(theme);
    } catch (error) {
      console.error('Error importing theme:', error);
      throw error;
    }
  }

  /**
   * Export theme to file
   */
  async exportTheme(themeId, filePath) {
    try {
      const theme = this.getTheme(themeId);
      if (!theme) {
        throw new Error(`Theme not found: ${themeId}`);
      }

      const exportData = {
        ...theme,
        exportedAt: new Date().toISOString(),
        exportedBy: 'Writers CLI'
      };

      await fs.writeFile(filePath, JSON.stringify(exportData, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error('Error exporting theme:', error);
      throw error;
    }
  }

  /**
   * Get theme preview data
   */
  getThemePreview(themeId) {
    const theme = this.getTheme(themeId);
    if (!theme) {
      return null;
    }

    return {
      id: theme.id,
      name: theme.name,
      type: theme.type,
      colors: {
        background: theme.colors.background,
        foreground: theme.colors.foreground,
        accent: theme.colors.accent,
        sidebar: theme.colors.sidebar
      },
      preview: this.generatePreviewHTML(theme)
    };
  }

  /**
   * Generate preview HTML for theme
   */
  generatePreviewHTML(theme) {
    const { colors } = theme;

    return `
      <div style="
        background: ${colors.background};
        color: ${colors.foreground};
        border: 1px solid ${colors.border};
        padding: 8px;
        border-radius: 4px;
        font-family: monospace;
        font-size: 12px;
        min-height: 60px;
      ">
        <div style="background: ${colors.sidebar}; padding: 4px; margin-bottom: 4px;">
          Sidebar
        </div>
        <div style="background: ${colors.editorBackground}; padding: 4px; color: ${colors.editorForeground};">
          <span style="color: ${colors.keyword};">function</span>
          <span style="color: ${colors.string};">"hello world"</span>
        </div>
      </div>
    `;
  }

  /**
   * Reset to default theme
   */
  resetToDefault() {
    return this.setTheme('dark');
  }

  /**
   * Get theme statistics
   */
  getThemeStats() {
    return {
      total: this.themes.size + this.customThemes.size,
      builtIn: this.themes.size,
      custom: this.customThemes.size,
      current: this.currentTheme,
      listeners: this.themeChangeCallbacks.size
    };
  }
}

module.exports = ThemeService;
