const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { app } = require('electron');

class SettingsService {
  constructor() {
    this.settingsPath = this.getSettingsPath();
    this.defaultSettings = this.getDefaultSettings();
    this.currentSettings = null;
  }

  /**
   * Get the path where settings should be stored
   */
  getSettingsPath() {
    const userDataPath = app.getPath('userData');
    return path.join(userDataPath, 'settings.json');
  }

  /**
   * Get default settings
   */
  getDefaultSettings() {
    return {
      // Window settings
      window: {
        width: 1400,
        height: 900,
        x: undefined,
        y: undefined,
        maximized: false
      },

      // Editor settings
      editor: {
        fontSize: 14,
        fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, "Courier New", monospace',
        lineHeight: 1.6,
        tabSize: 2,
        wordWrap: true,
        showLineNumbers: false,
        highlightCurrentLine: true,
        autoSave: true,
        autoSaveInterval: 30000, // 30 seconds
        spellCheck: true,
        focusMode: false,
        typewriterMode: false,
        darkMode: true
      },

      // Theme settings
      theme: {
        name: 'dark',
        background: '#1a1a1a',
        foreground: '#e0e0e0',
        accent: '#007acc',
        sidebar: '#2d2d2d',
        border: '#404040'
      },

      // Writing settings
      writing: {
        dailyWordGoal: 500,
        enableWordGoal: true,
        enableReadingTime: true,
        enableStatistics: true,
        trackingEnabled: true,
        pomodoroEnabled: false,
        pomodoroInterval: 25, // minutes
        pomodoroBreak: 5 // minutes
      },

      // Project settings
      project: {
        defaultProjectPath: path.join(os.homedir(), 'Documents', 'Writers CLI'),
        autoBackup: true,
        backupInterval: 300000, // 5 minutes
        maxBackups: 10,
        recentProjects: []
      },

      // File settings
      file: {
        defaultExtension: '.md',
        autoCreateBackups: true,
        maxRecentFiles: 10,
        recentFiles: [],
        defaultEncoding: 'utf8'
      },

      // Export settings
      export: {
        defaultFormat: 'pdf',
        includeMetadata: true,
        preserveFormatting: true,
        outputPath: path.join(os.homedir(), 'Documents', 'Exports')
      },

      // UI settings
      ui: {
        showSidebar: true,
        showStatusBar: true,
        showToolbar: true,
        compactMode: false,
        animations: true,
        confirmOnDelete: true,
        confirmOnExit: true
      },

      // Keyboard shortcuts
      shortcuts: {
        newFile: 'CmdOrCtrl+N',
        openFile: 'CmdOrCtrl+O',
        saveFile: 'CmdOrCtrl+S',
        saveAsFile: 'CmdOrCtrl+Shift+S',
        closeFile: 'CmdOrCtrl+W',
        quit: 'CmdOrCtrl+Q',
        undo: 'CmdOrCtrl+Z',
        redo: 'CmdOrCtrl+Y',
        cut: 'CmdOrCtrl+X',
        copy: 'CmdOrCtrl+C',
        paste: 'CmdOrCtrl+V',
        selectAll: 'CmdOrCtrl+A',
        find: 'CmdOrCtrl+F',
        replace: 'CmdOrCtrl+R',
        goToLine: 'CmdOrCtrl+G',
        wordCount: 'CmdOrCtrl+Shift+W',
        toggleFullscreen: 'F11',
        toggleFocusMode: 'F10',
        toggleSidebar: 'CmdOrCtrl+B',
        help: 'F1'
      },

      // Advanced settings
      advanced: {
        enableLogging: false,
        logLevel: 'info',
        debugMode: false,
        hardwareAcceleration: true,
        checkForUpdates: true,
        sendUsageStatistics: false
      },

      // Application metadata
      app: {
        version: app.getVersion(),
        firstRun: true,
        installDate: new Date().toISOString(),
        lastUsed: new Date().toISOString(),
        totalLaunches: 0
      }
    };
  }

  /**
   * Load settings from file
   */
  async load() {
    try {
      if (await fs.pathExists(this.settingsPath)) {
        const settingsData = await fs.readFile(this.settingsPath, 'utf8');
        const loadedSettings = JSON.parse(settingsData);

        // Merge with defaults to ensure all properties exist
        this.currentSettings = this.mergeWithDefaults(loadedSettings);

        // Update app metadata
        this.currentSettings.app.lastUsed = new Date().toISOString();
        this.currentSettings.app.totalLaunches = (this.currentSettings.app.totalLaunches || 0) + 1;

        // Save the updated settings
        await this.save(this.currentSettings);

        return this.currentSettings;
      } else {
        // First time run - create default settings
        this.currentSettings = { ...this.defaultSettings };
        await this.save(this.currentSettings);
        return this.currentSettings;
      }
    } catch (error) {
      console.error('Error loading settings:', error);

      // Return defaults if loading fails
      this.currentSettings = { ...this.defaultSettings };
      return this.currentSettings;
    }
  }

  /**
   * Save settings to file
   */
  async save(settings) {
    try {
      this.currentSettings = settings;

      // Ensure settings directory exists
      const settingsDir = path.dirname(this.settingsPath);
      await fs.ensureDir(settingsDir);

      // Create backup of existing settings
      if (await fs.pathExists(this.settingsPath)) {
        const backupPath = this.settingsPath + '.backup';
        await fs.copy(this.settingsPath, backupPath);
      }

      // Save settings
      const settingsJson = JSON.stringify(settings, null, 2);
      await fs.writeFile(this.settingsPath, settingsJson, 'utf8');

      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

  /**
   * Get current settings
   */
  get() {
    return this.currentSettings || this.defaultSettings;
  }

  /**
   * Get default settings
   */
  getDefaults() {
    return { ...this.defaultSettings };
  }

  /**
   * Update specific setting
   */
  async update(keyPath, value) {
    try {
      if (!this.currentSettings) {
        await this.load();
      }

      // Use dot notation to set nested properties
      const keys = keyPath.split('.');
      let target = this.currentSettings;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!target[keys[i]]) {
          target[keys[i]] = {};
        }
        target = target[keys[i]];
      }

      target[keys[keys.length - 1]] = value;

      await this.save(this.currentSettings);
      return this.currentSettings;
    } catch (error) {
      console.error('Error updating setting:', error);
      throw error;
    }
  }

  /**
   * Get specific setting value
   */
  getValue(keyPath, defaultValue = null) {
    try {
      const settings = this.get();
      const keys = keyPath.split('.');
      let value = settings;

      for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
          value = value[key];
        } else {
          return defaultValue;
        }
      }

      return value;
    } catch (error) {
      console.error('Error getting setting value:', error);
      return defaultValue;
    }
  }

  /**
   * Reset settings to defaults
   */
  async reset() {
    try {
      this.currentSettings = { ...this.defaultSettings };
      await this.save(this.currentSettings);
      return this.currentSettings;
    } catch (error) {
      console.error('Error resetting settings:', error);
      throw error;
    }
  }

  /**
   * Reset specific section to defaults
   */
  async resetSection(sectionName) {
    try {
      if (!this.currentSettings) {
        await this.load();
      }

      if (this.defaultSettings[sectionName]) {
        this.currentSettings[sectionName] = { ...this.defaultSettings[sectionName] };
        await this.save(this.currentSettings);
      }

      return this.currentSettings;
    } catch (error) {
      console.error('Error resetting settings section:', error);
      throw error;
    }
  }

  /**
   * Merge loaded settings with defaults
   */
  mergeWithDefaults(loadedSettings) {
    const merged = { ...this.defaultSettings };

    // Deep merge function
    const deepMerge = (target, source) => {
      for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          if (!target[key]) target[key] = {};
          deepMerge(target[key], source[key]);
        } else {
          target[key] = source[key];
        }
      }
    };

    deepMerge(merged, loadedSettings);
    return merged;
  }

  /**
   * Export settings to file
   */
  async export(exportPath) {
    try {
      const settings = this.get();
      const exportData = {
        ...settings,
        exportDate: new Date().toISOString(),
        exportVersion: app.getVersion()
      };

      const exportJson = JSON.stringify(exportData, null, 2);
      await fs.writeFile(exportPath, exportJson, 'utf8');

      return true;
    } catch (error) {
      console.error('Error exporting settings:', error);
      throw error;
    }
  }

  /**
   * Import settings from file
   */
  async import(importPath) {
    try {
      if (!await fs.pathExists(importPath)) {
        throw new Error('Import file does not exist');
      }

      const importData = await fs.readFile(importPath, 'utf8');
      const importedSettings = JSON.parse(importData);

      // Validate imported settings
      if (!this.validateSettings(importedSettings)) {
        throw new Error('Invalid settings format');
      }

      // Merge with current settings
      this.currentSettings = this.mergeWithDefaults(importedSettings);

      await this.save(this.currentSettings);
      return this.currentSettings;
    } catch (error) {
      console.error('Error importing settings:', error);
      throw error;
    }
  }

  /**
   * Validate settings structure
   */
  validateSettings(settings) {
    if (!settings || typeof settings !== 'object') {
      return false;
    }

    // Check for required sections
    const requiredSections = ['window', 'editor', 'theme', 'writing'];
    for (const section of requiredSections) {
      if (!settings[section] || typeof settings[section] !== 'object') {
        return false;
      }
    }

    return true;
  }

  /**
   * Add recent file to settings
   */
  async addRecentFile(filePath) {
    try {
      if (!this.currentSettings) {
        await this.load();
      }

      const recentFiles = this.currentSettings.file.recentFiles || [];

      // Remove if already exists
      const filtered = recentFiles.filter(file => file !== filePath);

      // Add to beginning
      filtered.unshift(filePath);

      // Limit to max recent files
      const maxFiles = this.currentSettings.file.maxRecentFiles || 10;
      this.currentSettings.file.recentFiles = filtered.slice(0, maxFiles);

      await this.save(this.currentSettings);
      return this.currentSettings.file.recentFiles;
    } catch (error) {
      console.error('Error adding recent file:', error);
      throw error;
    }
  }

  /**
   * Add recent project to settings
   */
  async addRecentProject(projectPath) {
    try {
      if (!this.currentSettings) {
        await this.load();
      }

      const recentProjects = this.currentSettings.project.recentProjects || [];

      // Remove if already exists
      const filtered = recentProjects.filter(project => project !== projectPath);

      // Add to beginning
      filtered.unshift(projectPath);

      // Limit to 5 recent projects
      this.currentSettings.project.recentProjects = filtered.slice(0, 5);

      await this.save(this.currentSettings);
      return this.currentSettings.project.recentProjects;
    } catch (error) {
      console.error('Error adding recent project:', error);
      throw error;
    }
  }

  /**
   * Get settings file path
   */
  getSettingsFilePath() {
    return this.settingsPath;
  }

  /**
   * Check if this is the first run
   */
  isFirstRun() {
    return this.getValue('app.firstRun', true);
  }

  /**
   * Mark first run as complete
   */
  async markFirstRunComplete() {
    await this.update('app.firstRun', false);
  }
}

module.exports = SettingsService;
