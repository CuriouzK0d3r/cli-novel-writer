const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const EventEmitter = require('events');

// Import service modules
const FileService = require('./services/FileService');
const ProjectService = require('./services/ProjectService');
const StatsService = require('./services/StatsService');
const SettingsService = require('./services/SettingsService');
const ThemeService = require('./services/ThemeService');
const BackupService = require('./services/BackupService');
const MenuService = require('./services/MenuService');
const WindowService = require('./services/WindowService');

class WritersApp extends EventEmitter {
  constructor() {
    super();
    this.mainWindow = null;
    this.isQuitting = false;
    this.settings = null;

    // Initialize services
    this.fileService = new FileService();
    this.projectService = new ProjectService();
    this.statsService = new StatsService();
    this.settingsService = new SettingsService();
    this.themeService = new ThemeService();
    this.backupService = new BackupService();
    this.menuService = new MenuService();
    this.windowService = new WindowService();

    this.init();
  }

  async init() {
    await this.loadSettings();
    this.setupAppEvents();
    this.setupIPC();
  }

  async loadSettings() {
    try {
      this.settings = await this.settingsService.load();
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.settings = this.settingsService.getDefaults();
    }
  }

  setupAppEvents() {
    app.whenReady().then(() => {
      this.createWindow();
      this.setupMenu();

      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          this.createWindow();
        }
      });
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('before-quit', (event) => {
      this.isQuitting = true;

      // Check for unsaved changes
      if (this.mainWindow && this.mainWindow.webContents) {
        this.mainWindow.webContents.send('app:beforeQuit');
        // Give the renderer process time to save if needed
        event.preventDefault();
        setTimeout(() => {
          this.isQuitting = false;
          app.quit();
        }, 1000);
      }
    });

    // Security: Prevent new window creation
    app.on('web-contents-created', (event, contents) => {
      contents.on('new-window', (event, navigationUrl) => {
        event.preventDefault();
        shell.openExternal(navigationUrl);
      });
    });
  }

  createWindow() {
    const windowSettings = this.settings.window || {};

    this.mainWindow = new BrowserWindow({
      width: windowSettings.width || 1400,
      height: windowSettings.height || 900,
      minWidth: 800,
      minHeight: 600,
      x: windowSettings.x,
      y: windowSettings.y,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        sandbox: false,
        preload: path.join(__dirname, '../preload.js'),
        webSecurity: true,
        allowRunningInsecureContent: false,
        experimentalFeatures: false
      },
      icon: this.getAppIcon(),
      show: false,
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
      frame: process.platform !== 'darwin',
      backgroundColor: this.themeService.getBackgroundColor(this.settings.theme)
    });

    // Load the main interface
    this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow.show();

      if (windowSettings.maximized) {
        this.mainWindow.maximize();
      }

      if (this.settings.devMode) {
        this.mainWindow.webContents.openDevTools();
      }
    });

    // Handle window events
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    this.mainWindow.on('close', async (event) => {
      if (!this.isQuitting) {
        event.preventDefault();

        // Save window state
        await this.saveWindowState();

        // Check for unsaved changes
        const canClose = await this.checkUnsavedChanges();
        if (canClose) {
          this.isQuitting = true;
          this.mainWindow.close();
        }
      }
    });

    // Window state management
    this.mainWindow.on('resize', () => this.saveWindowState());
    this.mainWindow.on('move', () => this.saveWindowState());
    this.mainWindow.on('maximize', () => this.saveWindowState());
    this.mainWindow.on('unmaximize', () => this.saveWindowState());

    this.windowService.setMainWindow(this.mainWindow);
  }

  getAppIcon() {
    const iconPath = path.join(__dirname, '../../assets');

    if (process.platform === 'win32') {
      return path.join(iconPath, 'icon.ico');
    } else if (process.platform === 'darwin') {
      return path.join(iconPath, 'icon.icns');
    } else {
      return path.join(iconPath, 'icon.png');
    }
  }

  setupMenu() {
    const menuTemplate = this.menuService.createMenuTemplate({
      onNew: () => this.mainWindow.webContents.send('menu:new'),
      onOpen: () => this.handleOpenFile(),
      onSave: () => this.mainWindow.webContents.send('menu:save'),
      onSaveAs: () => this.handleSaveAs(),
      onExport: () => this.mainWindow.webContents.send('menu:export'),
      onQuit: () => app.quit(),
      onUndo: () => this.mainWindow.webContents.send('menu:undo'),
      onRedo: () => this.mainWindow.webContents.send('menu:redo'),
      onCut: () => this.mainWindow.webContents.send('menu:cut'),
      onCopy: () => this.mainWindow.webContents.send('menu:copy'),
      onPaste: () => this.mainWindow.webContents.send('menu:paste'),
      onSelectAll: () => this.mainWindow.webContents.send('menu:selectAll'),
      onFind: () => this.mainWindow.webContents.send('menu:find'),
      onReplace: () => this.mainWindow.webContents.send('menu:replace'),
      onToggleFullscreen: () => this.windowService.toggleFullscreen(),
      onToggleDevTools: () => this.mainWindow.webContents.toggleDevTools(),
      onAbout: () => this.showAbout(),
      onHelp: () => this.mainWindow.webContents.send('menu:help')
    });

    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);
  }

  setupIPC() {
    // File operations
    ipcMain.handle('dialog:openFile', async () => {
      return await this.fileService.showOpenDialog(this.mainWindow);
    });

    ipcMain.handle('dialog:saveFile', async (event, content) => {
      return await this.fileService.showSaveDialog(this.mainWindow, content);
    });

    ipcMain.handle('file:load', async (event, filePath) => {
      return await this.fileService.loadFile(filePath);
    });

    ipcMain.handle('file:save', async (event, filePath, content) => {
      return await this.fileService.saveFile(filePath, content);
    });

    // Project operations
    ipcMain.handle('project:create', async (event, projectData) => {
      return await this.projectService.createProject(projectData);
    });

    ipcMain.handle('project:load', async (event, projectPath) => {
      return await this.projectService.loadProject(projectPath);
    });

    ipcMain.handle('project:save', async (event, projectData) => {
      return await this.projectService.saveProject(projectData);
    });

    ipcMain.handle('dialog:openProject', async () => {
      return await this.projectService.showOpenProjectDialog(this.mainWindow);
    });

    // Statistics
    ipcMain.handle('stats:wordCount', async (event, text) => {
      return this.statsService.getWordCount(text);
    });

    ipcMain.handle('stats:fileStats', async (event, filePath) => {
      return await this.statsService.getFileStats(filePath);
    });

    ipcMain.handle('stats:projectStats', async (event, projectPath) => {
      return await this.statsService.getProjectStats(projectPath);
    });

    // Settings
    ipcMain.handle('settings:load', async () => {
      return this.settings;
    });

    ipcMain.handle('settings:save', async (event, newSettings) => {
      this.settings = { ...this.settings, ...newSettings };
      await this.settingsService.save(this.settings);
      this.mainWindow.webContents.send('settings:changed', this.settings);
      return this.settings;
    });

    // Theme
    ipcMain.handle('theme:get', async () => {
      return this.themeService.getCurrentTheme();
    });

    ipcMain.handle('theme:set', async (event, themeName) => {
      await this.themeService.setTheme(themeName);
      this.mainWindow.webContents.send('theme:changed', themeName);
      return themeName;
    });

    // Window operations
    ipcMain.handle('window:minimize', () => {
      this.windowService.minimize();
    });

    ipcMain.handle('window:maximize', () => {
      this.windowService.toggleMaximize();
    });

    ipcMain.handle('window:close', () => {
      this.mainWindow.close();
    });

    ipcMain.handle('window:toggleFullscreen', () => {
      return this.windowService.toggleFullscreen();
    });

    // Dialogs
    ipcMain.handle('dialog:messageBox', async (event, options) => {
      const result = await dialog.showMessageBox(this.mainWindow, options);
      return result;
    });

    ipcMain.handle('dialog:error', async (event, title, message) => {
      await dialog.showErrorBox(title, message);
    });

    // Development
    ipcMain.handle('dev:openTools', () => {
      this.mainWindow.webContents.openDevTools();
    });

    ipcMain.handle('dev:reload', () => {
      this.mainWindow.webContents.reload();
    });

    // App info
    ipcMain.handle('app:getVersion', () => {
      return app.getVersion();
    });

    ipcMain.handle('platform:get', () => {
      return process.platform;
    });

    // Backup operations
    ipcMain.handle('backup:create', async (event, filePath) => {
      return await this.backupService.createBackup(filePath);
    });

    ipcMain.handle('backup:restore', async (event, backupPath) => {
      return await this.backupService.restoreBackup(backupPath);
    });

    ipcMain.handle('backup:list', async (event, filePath) => {
      return await this.backupService.listBackups(filePath);
    });

    // Logging
    ipcMain.handle('log:info', (event, message, data) => {
      console.log(`[INFO] ${message}`, data || '');
    });

    ipcMain.handle('log:warn', (event, message, data) => {
      console.warn(`[WARN] ${message}`, data || '');
    });

    ipcMain.handle('log:error', (event, message, data) => {
      console.error(`[ERROR] ${message}`, data || '');
    });

    ipcMain.handle('log:debug', (event, message, data) => {
      if (this.settings.devMode) {
        console.log(`[DEBUG] ${message}`, data || '');
      }
    });
  }

  async handleOpenFile() {
    try {
      const result = await this.fileService.showOpenDialog(this.mainWindow);
      if (result && !result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        const content = await this.fileService.loadFile(filePath);
        this.mainWindow.webContents.send('file:opened', { filePath, content });
      }
    } catch (error) {
      console.error('Error opening file:', error);
      await dialog.showErrorBox('Error', 'Failed to open file: ' + error.message);
    }
  }

  async handleSaveAs() {
    this.mainWindow.webContents.send('menu:saveAs');
  }

  async saveWindowState() {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) return;

    const bounds = this.mainWindow.getBounds();
    const windowState = {
      ...bounds,
      maximized: this.mainWindow.isMaximized()
    };

    this.settings.window = windowState;
    await this.settingsService.save(this.settings);
  }

  async checkUnsavedChanges() {
    return new Promise((resolve) => {
      // Send message to renderer to check for unsaved changes
      this.mainWindow.webContents.send('app:checkUnsavedChanges');

      // Listen for response
      ipcMain.once('app:canClose', (event, canClose) => {
        resolve(canClose);
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        resolve(true);
      }, 5000);
    });
  }

  showAbout() {
    const aboutOptions = {
      type: 'info',
      title: 'About Writers CLI',
      message: 'Writers CLI GUI',
      detail: `Version: ${app.getVersion()}\n\nA modern writing environment for novelists and storytellers.\n\nBuilt with Electron and love for writers everywhere.`,
      buttons: ['OK']
    };

    dialog.showMessageBox(this.mainWindow, aboutOptions);
  }
}

// Create and initialize the app
const writersApp = new WritersApp();

// Handle app events
app.on('ready', async () => {
  // Additional app initialization if needed
});

// Export for testing
module.exports = WritersApp;
