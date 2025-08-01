const { nativeTheme } = require('electron');
const fs = require('fs-extra');
const path = require('path');

class ThemeManager {
  constructor() {
    this.themes = {
      dark: {
        name: 'Dark',
        colors: {
          primary: '#007acc',
          secondary: '#264f78',
          background: '#1e1e1e',
          surface: '#252526',
          sidebar: '#2d2d30',
          editor: '#1e1e1e',
          text: '#cccccc',
          textSecondary: '#969696',
          border: '#3e3e42',
          accent: '#0078d4',
          success: '#4caf50',
          warning: '#ff9800',
          error: '#f44336',
          info: '#2196f3'
        },
        fonts: {
          ui: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          editor: "'JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', monospace"
        },
        editor: {
          backgroundColor: '#1e1e1e',
          foregroundColor: '#d4d4d4',
          selectionBackground: '#264f78',
          cursorColor: '#ffffff',
          lineHighlight: '#2a2d2e',
          commentColor: '#6a9955',
          keywordColor: '#569cd6',
          stringColor: '#ce9178',
          numberColor: '#b5cea8',
          functionColor: '#dcdcaa'
        }
      },
      light: {
        name: 'Light',
        colors: {
          primary: '#0078d4',
          secondary: '#106ebe',
          background: '#ffffff',
          surface: '#f8f8f8',
          sidebar: '#f3f3f3',
          editor: '#ffffff',
          text: '#333333',
          textSecondary: '#666666',
          border: '#e0e0e0',
          accent: '#0078d4',
          success: '#107c10',
          warning: '#ff8c00',
          error: '#d13438',
          info: '#0078d4'
        },
        fonts: {
          ui: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          editor: "'JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', monospace"
        },
        editor: {
          backgroundColor: '#ffffff',
          foregroundColor: '#333333',
          selectionBackground: '#add6ff',
          cursorColor: '#000000',
          lineHighlight: '#f0f0f0',
          commentColor: '#008000',
          keywordColor: '#0000ff',
          stringColor: '#a31515',
          numberColor: '#098658',
          functionColor: '#795e26'
        }
      },
      sepia: {
        name: 'Sepia',
        colors: {
          primary: '#8b4513',
          secondary: '#a0522d',
          background: '#f5f5dc',
          surface: '#faf0e6',
          sidebar: '#f0e68c',
          editor: '#fdf5e6',
          text: '#8b4513',
          textSecondary: '#a0522d',
          border: '#deb887',
          accent: '#cd853f',
          success: '#228b22',
          warning: '#ff8c00',
          error: '#dc143c',
          info: '#4682b4'
        },
        fonts: {
          ui: "'Georgia', 'Times New Roman', serif",
          editor: "'Courier New', 'Monaco', 'Consolas', monospace"
        },
        editor: {
          backgroundColor: '#fdf5e6',
          foregroundColor: '#8b4513',
          selectionBackground: '#deb887',
          cursorColor: '#8b4513',
          lineHighlight: '#f5deb3',
          commentColor: '#6b8e23',
          keywordColor: '#4169e1',
          stringColor: '#b22222',
          numberColor: '#008b8b',
          functionColor: '#9932cc'
        }
      },
      'high-contrast': {
        name: 'High Contrast',
        colors: {
          primary: '#ffffff',
          secondary: '#ffff00',
          background: '#000000',
          surface: '#000000',
          sidebar: '#000000',
          editor: '#000000',
          text: '#ffffff',
          textSecondary: '#ffff00',
          border: '#ffffff',
          accent: '#00ff00',
          success: '#00ff00',
          warning: '#ffff00',
          error: '#ff0000',
          info: '#00ffff'
        },
        fonts: {
          ui: "'Arial', sans-serif",
          editor: "'Courier New', monospace"
        },
        editor: {
          backgroundColor: '#000000',
          foregroundColor: '#ffffff',
          selectionBackground: '#0000ff',
          cursorColor: '#ffffff',
          lineHighlight: '#333333',
          commentColor: '#808080',
          keywordColor: '#00ff00',
          stringColor: '#ffff00',
          numberColor: '#ff00ff',
          functionColor: '#00ffff'
        }
      },
      // Custom writer-focused themes
      'midnight-writer': {
        name: 'Midnight Writer',
        colors: {
          primary: '#bb86fc',
          secondary: '#03dac6',
          background: '#121212',
          surface: '#1e1e1e',
          sidebar: '#242424',
          editor: '#0d1117',
          text: '#e1e4e8',
          textSecondary: '#8b949e',
          border: '#30363d',
          accent: '#58a6ff',
          success: '#28a745',
          warning: '#ffc107',
          error: '#dc3545',
          info: '#17a2b8'
        },
        fonts: {
          ui: "'Inter', sans-serif",
          editor: "'JetBrains Mono', monospace"
        },
        editor: {
          backgroundColor: '#0d1117',
          foregroundColor: '#e1e4e8',
          selectionBackground: '#264f78',
          cursorColor: '#58a6ff',
          lineHighlight: '#161b22',
          commentColor: '#8b949e',
          keywordColor: '#bb86fc',
          stringColor: '#03dac6',
          numberColor: '#79c0ff',
          functionColor: '#d2a8ff'
        }
      },
      'forest-focus': {
        name: 'Forest Focus',
        colors: {
          primary: '#4a7c59',
          secondary: '#6b8e23',
          background: '#2f3e2f',
          surface: '#3a4a3a',
          sidebar: '#2d3d2d',
          editor: '#1a2f1a',
          text: '#e8f5e8',
          textSecondary: '#a8c8a8',
          border: '#4a5a4a',
          accent: '#7cb342',
          success: '#66bb6a',
          warning: '#ffab40',
          error: '#ef5350',
          info: '#42a5f5'
        },
        fonts: {
          ui: "'Inter', sans-serif",
          editor: "'Source Code Pro', monospace"
        },
        editor: {
          backgroundColor: '#1a2f1a',
          foregroundColor: '#e8f5e8',
          selectionBackground: '#4a7c59',
          cursorColor: '#7cb342',
          lineHighlight: '#233323',
          commentColor: '#6b8e23',
          keywordColor: '#81c784',
          stringColor: '#c8e6c9',
          numberColor: '#a5d6a7',
          functionColor: '#4caf50'
        }
      },
      'warm-paper': {
        name: 'Warm Paper',
        colors: {
          primary: '#8b4513',
          secondary: '#a0522d',
          background: '#fef9e7',
          surface: '#fcf4e4',
          sidebar: '#f5e6d3',
          editor: '#fffbf0',
          text: '#5d4037',
          textSecondary: '#8d6e63',
          border: '#e0c097',
          accent: '#d2691e',
          success: '#689f38',
          warning: '#f57c00',
          error: '#d32f2f',
          info: '#1976d2'
        },
        fonts: {
          ui: "'Crimson Text', Georgia, serif",
          editor: "'Inconsolata', 'Courier New', monospace"
        },
        editor: {
          backgroundColor: '#fffbf0',
          foregroundColor: '#5d4037',
          selectionBackground: '#d7ccc8',
          cursorColor: '#8b4513',
          lineHighlight: '#f7f1e8',
          commentColor: '#8d6e63',
          keywordColor: '#d84315',
          stringColor: '#2e7d32',
          numberColor: '#1565c0',
          functionColor: '#7b1fa2'
        }
      }
    };

    this.currentTheme = 'dark';
    this.customThemes = new Map();
    this.loadCustomThemes();
  }

  // Get available themes
  getThemes() {
    const allThemes = { ...this.themes };
    for (const [name, theme] of this.customThemes) {
      allThemes[name] = theme;
    }
    return allThemes;
  }

  // Get current theme
  getCurrentTheme() {
    return this.getTheme(this.currentTheme);
  }

  // Get specific theme
  getTheme(themeName) {
    return this.themes[themeName] || this.customThemes.get(themeName) || this.themes.dark;
  }

  // Set theme
  setTheme(themeName) {
    if (this.themes[themeName] || this.customThemes.has(themeName)) {
      this.currentTheme = themeName;

      // Update native theme for system integration
      if (themeName.includes('light') || themeName === 'warm-paper') {
        nativeTheme.themeSource = 'light';
      } else {
        nativeTheme.themeSource = 'dark';
      }

      return this.getCurrentTheme();
    }
    return null;
  }

  // Create custom theme
  createCustomTheme(name, baseTheme, customizations) {
    const base = this.getTheme(baseTheme);
    const customTheme = {
      name,
      isCustom: true,
      baseTheme,
      colors: { ...base.colors, ...customizations.colors },
      fonts: { ...base.fonts, ...customizations.fonts },
      editor: { ...base.editor, ...customizations.editor }
    };

    this.customThemes.set(name, customTheme);
    this.saveCustomThemes();
    return customTheme;
  }

  // Update custom theme
  updateCustomTheme(name, updates) {
    if (this.customThemes.has(name)) {
      const existing = this.customThemes.get(name);
      const updated = {
        ...existing,
        colors: { ...existing.colors, ...updates.colors },
        fonts: { ...existing.fonts, ...updates.fonts },
        editor: { ...existing.editor, ...updates.editor }
      };

      this.customThemes.set(name, updated);
      this.saveCustomThemes();
      return updated;
    }
    return null;
  }

  // Delete custom theme
  deleteCustomTheme(name) {
    if (this.customThemes.has(name)) {
      this.customThemes.delete(name);
      this.saveCustomThemes();

      // If current theme was deleted, switch to dark
      if (this.currentTheme === name) {
        this.setTheme('dark');
      }

      return true;
    }
    return false;
  }

  // Generate CSS variables for theme
  generateCSSVariables(theme = null) {
    const activeTheme = theme || this.getCurrentTheme();
    let css = ':root {\n';

    // Color variables
    for (const [key, value] of Object.entries(activeTheme.colors)) {
      css += `  --color-${this.kebabCase(key)}: ${value};\n`;
    }

    // Font variables
    for (const [key, value] of Object.entries(activeTheme.fonts)) {
      css += `  --font-${this.kebabCase(key)}: ${value};\n`;
    }

    // Editor variables
    for (const [key, value] of Object.entries(activeTheme.editor)) {
      css += `  --editor-${this.kebabCase(key)}: ${value};\n`;
    }

    css += '}\n';
    return css;
  }

  // Generate theme-specific styles
  generateThemeStyles(theme = null) {
    const activeTheme = theme || this.getCurrentTheme();

    return `
      /* Theme: ${activeTheme.name} */

      body {
        background-color: var(--color-background);
        color: var(--color-text);
        font-family: var(--font-ui);
      }

      .sidebar {
        background-color: var(--color-sidebar);
        border-right: 1px solid var(--color-border);
      }

      .editor {
        background-color: var(--editor-background-color);
        color: var(--editor-foreground-color);
        font-family: var(--font-editor);
      }

      .editor::selection {
        background-color: var(--editor-selection-background);
      }

      .editor:focus {
        caret-color: var(--editor-cursor-color);
      }

      .line-highlight {
        background-color: var(--editor-line-highlight);
      }

      .modal {
        background-color: var(--color-surface);
        border: 1px solid var(--color-border);
        color: var(--color-text);
      }

      .btn-primary {
        background-color: var(--color-primary);
        color: white;
      }

      .btn-secondary {
        background-color: var(--color-secondary);
        color: white;
      }

      .status-bar {
        background-color: var(--color-surface);
        border-top: 1px solid var(--color-border);
        color: var(--color-text-secondary);
      }

      .syntax-comment { color: var(--editor-comment-color); }
      .syntax-keyword { color: var(--editor-keyword-color); }
      .syntax-string { color: var(--editor-string-color); }
      .syntax-number { color: var(--editor-number-color); }
      .syntax-function { color: var(--editor-function-color); }
    `;
  }

  // Apply theme to renderer
  applyTheme(webContents, themeName = null) {
    const theme = themeName ? this.getTheme(themeName) : this.getCurrentTheme();
    const css = this.generateCSSVariables(theme) + this.generateThemeStyles(theme);

    webContents.insertCSS(css);
    return theme;
  }

  // Auto-detect system theme preference
  detectSystemTheme() {
    return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
  }

  // Enable auto theme switching
  enableAutoTheme(callback) {
    nativeTheme.on('updated', () => {
      const systemTheme = this.detectSystemTheme();
      this.setTheme(systemTheme);
      if (callback) callback(systemTheme);
    });
  }

  // Theme accessibility helpers
  getContrastRatio(color1, color2) {
    const l1 = this.getLuminance(color1);
    const l2 = this.getLuminance(color2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  getLuminance(color) {
    const rgb = this.hexToRgb(color);
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  // Validate theme accessibility
  validateThemeAccessibility(theme) {
    const issues = [];
    const { colors, editor } = theme;

    // Check main text contrast
    const textContrast = this.getContrastRatio(colors.text, colors.background);
    if (textContrast < 4.5) {
      issues.push(`Low text contrast: ${textContrast.toFixed(2)} (should be at least 4.5)`);
    }

    // Check editor contrast
    const editorContrast = this.getContrastRatio(editor.foregroundColor, editor.backgroundColor);
    if (editorContrast < 7) {
      issues.push(`Low editor contrast: ${editorContrast.toFixed(2)} (should be at least 7 for extended reading)`);
    }

    return {
      isAccessible: issues.length === 0,
      issues,
      textContrast,
      editorContrast
    };
  }

  // Export theme
  exportTheme(themeName, filePath) {
    const theme = this.getTheme(themeName);
    if (!theme) return false;

    try {
      const exportData = {
        name: theme.name,
        version: '1.0.0',
        author: 'Writers CLI',
        description: `Exported theme: ${theme.name}`,
        theme: {
          colors: theme.colors,
          fonts: theme.fonts,
          editor: theme.editor
        }
      };

      fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2));
      return true;
    } catch (error) {
      console.error('Error exporting theme:', error);
      return false;
    }
  }

  // Import theme
  importTheme(filePath) {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const themeName = data.name || path.basename(filePath, '.json');

      this.createCustomTheme(themeName, 'dark', {
        colors: data.theme.colors || {},
        fonts: data.theme.fonts || {},
        editor: data.theme.editor || {}
      });

      return { success: true, themeName };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Save custom themes to disk
  saveCustomThemes() {
    try {
      const { app } = require('electron');
      const themesPath = path.join(app.getPath('userData'), 'custom-themes.json');
      const themesData = Object.fromEntries(this.customThemes);
      fs.writeFileSync(themesPath, JSON.stringify(themesData, null, 2));
    } catch (error) {
      console.error('Error saving custom themes:', error);
    }
  }

  // Load custom themes from disk
  loadCustomThemes() {
    try {
      const { app } = require('electron');
      const themesPath = path.join(app.getPath('userData'), 'custom-themes.json');

      if (fs.existsSync(themesPath)) {
        const themesData = JSON.parse(fs.readFileSync(themesPath, 'utf8'));
        this.customThemes = new Map(Object.entries(themesData));
      }
    } catch (error) {
      console.error('Error loading custom themes:', error);
      this.customThemes = new Map();
    }
  }

  // Utility function
  kebabCase(str) {
    return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
  }
}

module.exports = new ThemeManager();
