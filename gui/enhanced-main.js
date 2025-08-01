const { app, BrowserWindow, Menu, dialog, ipcMain, shell, nativeTheme } = require("electron");
const path = require("path");
const fs = require("fs-extra");
const { spawn } = require("child_process");

// Import services
const projectManager = require("../src/utils/project");
const themeManager = require("./src/main/services/theme-manager");
const exportManager = require("./src/main/services/export-manager");
const collaborationManager = require("./src/main/services/collaboration-manager");
const backupManager = require("./src/main/services/backup-manager");

class EnhancedWritersGUI {
  constructor() {
    this.mainWindow = null;
    this.currentProject = null;
    this.currentFile = null;
    this.isModified = false;
    this.recentProjects = [];
    this.settings = {
      theme: 'dark',
      fontSize: 14,
      fontFamily: 'JetBrains Mono',
      lineHeight: 1.6,
      writingGoals: {
        daily: 500,
        session: 250
      },
      pomodoroSettings: {
        workDuration: 25,
        shortBreak: 5,
        longBreak: 15,
        sessionsUntilLongBreak: 4
      },
      autoSave: true,
      autoSaveInterval: 30000,
      spellCheck: true,
      wordWrap: true,
      showLineNumbers: false,
      distractionFreeMode: false,
      collaborationEnabled: false,
      autoBackup: true,
      backupInterval: 300000 // 5 minutes
    };
    this.writingSession = {
      startTime: null,
      wordsWritten: 0,
      goalReached: false,
      pomodoroTimer: null,
      currentPomodoro: 0,
      isBreak: false
    };

    this.loadSettings();
    this.loadRecentProjects();
  }

  // Window Management
  createWindow() {
    this.mainWindow = new BrowserWindow({
      width: this.settings.windowWidth || 1400,
      height: this.settings.windowHeight || 900,
      minWidth: 800,
      minHeight: 600,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true,
        sandbox: false,
        webSecurity: false
      },
      icon: path.join(__dirname, "../assets/icon.png"),
      show: false,
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
      frame: process.platform !== 'win32',
      backgroundColor: this.settings.theme === 'dark' ? '#1a1a1a' : '#ffffff'
    });

    // Load the enhanced interface
    this.mainWindow.loadFile(path.join(__dirname, "enhanced-interface.html"));

    // Show window when ready
    this.mainWindow.once("ready-to-show", () => {
      this.mainWindow.show();
      this.setupTheme();
      if (this.settings.maximized) {
        this.mainWindow.maximize();
      }
    });

    // Handle window events
    this.mainWindow.on("closed", () => {
      this.saveSettings();
      this.mainWindow = null;
    });

    this.mainWindow.on("close", async (event) => {
      if (this.isModified) {
        event.preventDefault();
        const result = await this.confirmSave();
        if (result !== "cancel") {
          this.mainWindow.destroy();
        }
      }
      this.saveWindowState();
    });

    this.mainWindow.on("resize", () => {
      this.saveWindowState();
    });

    this.mainWindow.on("maximize", () => {
      this.settings.maximized = true;
    });

    this.mainWindow.on("unmaximize", () => {
      this.settings.maximized = false;
    });

    this.setupMenu();
    this.setupIPC();
    this.startAutoSave();
    if (this.settings.autoBackup) {
      this.startAutoBackup();
    }
  }

  setupMenu() {
    const template = [
      {
        label: 'File',
        submenu: [
          {
            label: 'New Project',
            accelerator: 'CmdOrCtrl+Shift+N',
            click: () => this.newProject()
          },
          {
            label: 'Open Project',
            accelerator: 'CmdOrCtrl+Shift+O',
            click: () => this.openProject()
          },
          {
            label: 'Recent Projects',
            submenu: this.buildRecentProjectsMenu()
          },
          { type: 'separator' },
          {
            label: 'New File',
            accelerator: 'CmdOrCtrl+N',
            click: () => this.newFile()
          },
          {
            label: 'Open File',
            accelerator: 'CmdOrCtrl+O',
            click: () => this.openFile()
          },
          { type: 'separator' },
          {
            label: 'Save',
            accelerator: 'CmdOrCtrl+S',
            click: () => this.saveFile()
          },
          {
            label: 'Save As',
            accelerator: 'CmdOrCtrl+Shift+S',
            click: () => this.saveAsFile()
          },
          {
            label: 'Save All',
            accelerator: 'CmdOrCtrl+Alt+S',
            click: () => this.saveAllFiles()
          },
          { type: 'separator' },
          {
            label: 'Export',
            submenu: [
              {
                label: 'Export as PDF',
                click: () => this.exportProject('pdf')
              },
              {
                label: 'Export as EPUB',
                click: () => this.exportProject('epub')
              },
              {
                label: 'Export as HTML',
                click: () => this.exportProject('html')
              },
              {
                label: 'Export as DOCX',
                click: () => this.exportProject('docx')
              }
            ]
          },
          { type: 'separator' },
          {
            label: 'Project Settings',
            accelerator: 'CmdOrCtrl+,',
            click: () => this.showProjectSettings()
          },
          { type: 'separator' },
          {
            label: 'Exit',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => this.exit()
          }
        ]
      },
      {
        label: 'Edit',
        submenu: [
          {
            label: 'Undo',
            accelerator: 'CmdOrCtrl+Z',
            role: 'undo'
          },
          {
            label: 'Redo',
            accelerator: 'CmdOrCtrl+Y',
            role: 'redo'
          },
          { type: 'separator' },
          {
            label: 'Cut',
            accelerator: 'CmdOrCtrl+X',
            role: 'cut'
          },
          {
            label: 'Copy',
            accelerator: 'CmdOrCtrl+C',
            role: 'copy'
          },
          {
            label: 'Paste',
            accelerator: 'CmdOrCtrl+V',
            role: 'paste'
          },
          {
            label: 'Select All',
            accelerator: 'CmdOrCtrl+A',
            role: 'selectall'
          },
          { type: 'separator' },
          {
            label: 'Find',
            accelerator: 'CmdOrCtrl+F',
            click: () => this.showFind()
          },
          {
            label: 'Find and Replace',
            accelerator: 'CmdOrCtrl+H',
            click: () => this.showReplace()
          },
          {
            label: 'Go to Line',
            accelerator: 'CmdOrCtrl+G',
            click: () => this.showGoToLine()
          }
        ]
      },
      {
        label: 'View',
        submenu: [
          {
            label: 'Toggle Sidebar',
            accelerator: 'CmdOrCtrl+B',
            click: () => this.toggleSidebar()
          },
          {
            label: 'Toggle Distraction Free',
            accelerator: 'F11',
            click: () => this.toggleDistractionFree()
          },
          {
            label: 'Toggle Split View',
            accelerator: 'CmdOrCtrl+\\',
            click: () => this.toggleSplitView()
          },
          { type: 'separator' },
          {
            label: 'Zoom In',
            accelerator: 'CmdOrCtrl+Plus',
            click: () => this.zoomIn()
          },
          {
            label: 'Zoom Out',
            accelerator: 'CmdOrCtrl+-',
            click: () => this.zoomOut()
          },
          {
            label: 'Reset Zoom',
            accelerator: 'CmdOrCtrl+0',
            click: () => this.resetZoom()
          },
          { type: 'separator' },
          {
            label: 'Themes',
            submenu: [
              {
                label: 'Dark Theme',
                type: 'radio',
                checked: this.settings.theme === 'dark',
                click: () => this.setTheme('dark')
              },
              {
                label: 'Light Theme',
                type: 'radio',
                checked: this.settings.theme === 'light',
                click: () => this.setTheme('light')
              },
              {
                label: 'Sepia Theme',
                type: 'radio',
                checked: this.settings.theme === 'sepia',
                click: () => this.setTheme('sepia')
              },
              {
                label: 'High Contrast',
                type: 'radio',
                checked: this.settings.theme === 'high-contrast',
                click: () => this.setTheme('high-contrast')
              }
            ]
          }
        ]
      },
      {
        label: 'Writing',
        submenu: [
          {
            label: 'Start Writing Session',
            accelerator: 'CmdOrCtrl+Shift+W',
            click: () => this.startWritingSession()
          },
          {
            label: 'End Writing Session',
            accelerator: 'CmdOrCtrl+Shift+E',
            click: () => this.endWritingSession()
          },
          { type: 'separator' },
          {
            label: 'Start Pomodoro Timer',
            accelerator: 'CmdOrCtrl+T',
            click: () => this.startPomodoroTimer()
          },
          {
            label: 'Pause Timer',
            click: () => this.pausePomodoroTimer()
          },
          {
            label: 'Reset Timer',
            click: () => this.resetPomodoroTimer()
          },
          { type: 'separator' },
          {
            label: 'Writing Goals',
            click: () => this.showWritingGoals()
          },
          {
            label: 'Writing Statistics',
            accelerator: 'CmdOrCtrl+Shift+S',
            click: () => this.showWritingStatistics()
          },
          { type: 'separator' },
          {
            label: 'Character Tracker',
            click: () => this.showCharacterTracker()
          },
          {
            label: 'Plot Tracker',
            click: () => this.showPlotTracker()
          },
          {
            label: 'Research Notes',
            click: () => this.showResearchNotes()
          }
        ]
      },
      {
        label: 'Tools',
        submenu: [
          {
            label: 'Spell Check',
            type: 'checkbox',
            checked: this.settings.spellCheck,
            click: () => this.toggleSpellCheck()
          },
          {
            label: 'Grammar Check',
            click: () => this.runGrammarCheck()
          },
          { type: 'separator' },
          {
            label: 'Word Count',
            accelerator: 'CmdOrCtrl+Shift+C',
            click: () => this.showWordCount()
          },
          {
            label: 'Reading Time Calculator',
            click: () => this.showReadingTime()
          },
          { type: 'separator' },
          {
            label: 'Version Control',
            submenu: [
              {
                label: 'Initialize Repository',
                click: () => this.initGitRepo()
              },
              {
                label: 'Commit Changes',
                accelerator: 'CmdOrCtrl+Shift+G',
                click: () => this.commitChanges()
              },
              {
                label: 'View History',
                click: () => this.showGitHistory()
              }
            ]
          },
          { type: 'separator' },
          {
            label: 'Backup Project',
            click: () => this.backupProject()
          },
          {
            label: 'Restore from Backup',
            click: () => this.restoreFromBackup()
          }
        ]
      },
      {
        label: 'Collaboration',
        submenu: [
          {
            label: 'Enable Collaboration',
            type: 'checkbox',
            checked: this.settings.collaborationEnabled,
            click: () => this.toggleCollaboration()
          },
          { type: 'separator' },
          {
            label: 'Share Project',
            click: () => this.shareProject()
          },
          {
            label: 'Invite Collaborator',
            click: () => this.inviteCollaborator()
          },
          {
            label: 'Manage Permissions',
            click: () => this.managePermissions()
          },
          { type: 'separator' },
          {
            label: 'Comments & Annotations',
            click: () => this.showComments()
          },
          {
            label: 'Sync Status',
            click: () => this.showSyncStatus()
          }
        ]
      },
      {
        label: 'Window',
        submenu: [
          {
            label: 'Minimize',
            accelerator: 'CmdOrCtrl+M',
            role: 'minimize'
          },
          {
            label: 'Close',
            accelerator: 'CmdOrCtrl+W',
            role: 'close'
          }
        ]
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'Quick Start Guide',
            click: () => this.showQuickStart()
          },
          {
            label: 'Keyboard Shortcuts',
            accelerator: 'F1',
            click: () => this.showKeyboardShortcuts()
          },
          {
            label: 'Writing Tips',
            click: () => this.showWritingTips()
          },
          { type: 'separator' },
          {
            label: 'Check for Updates',
            click: () => this.checkForUpdates()
          },
          {
            label: 'Report Issue',
            click: () => this.reportIssue()
          },
          { type: 'separator' },
          {
            label: 'About',
            click: () => this.showAbout()
          }
        ]
      }
    ];

    if (process.platform === 'darwin') {
      template.unshift({
        label: 'Writers CLI',
        submenu: [
          {
            label: 'About Writers CLI',
            role: 'about'
          },
          { type: 'separator' },
          {
            label: 'Preferences',
            accelerator: 'Cmd+,',
            click: () => this.showPreferences()
          },
          { type: 'separator' },
          {
            label: 'Services',
            role: 'services',
            submenu: []
          },
          { type: 'separator' },
          {
            label: 'Hide Writers CLI',
            accelerator: 'Cmd+H',
            role: 'hide'
          },
          {
            label: 'Hide Others',
            accelerator: 'Cmd+Alt+H',
            role: 'hideothers'
          },
          {
            label: 'Show All',
            role: 'unhide'
          },
          { type: 'separator' },
          {
            label: 'Quit',
            accelerator: 'Cmd+Q',
            click: () => this.exit()
          }
        ]
      });
    }

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  buildRecentProjectsMenu() {
    if (this.recentProjects.length === 0) {
      return [{
        label: 'No recent projects',
        enabled: false
      }];
    }

    const menu = this.recentProjects.map(project => ({
      label: project.name,
      click: () => this.openRecentProject(project.path)
    }));

    menu.push(
      { type: 'separator' },
      {
        label: 'Clear Recent Projects',
        click: () => this.clearRecentProjects()
      }
    );

    return menu;
  }

  setupIPC() {
    // Project Management
    ipcMain.handle('project:new', async (event, data) => {
      return await this.createNewProject(data);
    });

    ipcMain.handle('project:open', async (event, projectPath) => {
      return await this.loadProject(projectPath);
    });

    ipcMain.handle('project:save', async (event, data) => {
      return await this.saveProject(data);
    });

    ipcMain.handle('project:export', async (event, format, options) => {
      return await this.exportProject(format, options);
    });

    // File Management
    ipcMain.handle('file:new', async (event, type) => {
      return await this.createNewFile(type);
    });

    ipcMain.handle('file:open', async (event, filePath) => {
      return await this.loadFile(filePath);
    });

    ipcMain.handle('file:save', async (event, filePath, content) => {
      return await this.saveFileContent(filePath, content);
    });

    ipcMain.handle('file:delete', async (event, filePath) => {
      return await this.deleteFile(filePath);
    });

    // Writing Tools
    ipcMain.handle('writing:start-session', async (event, goals) => {
      return this.startWritingSession(goals);
    });

    ipcMain.handle('writing:end-session', async (event) => {
      return this.endWritingSession();
    });

    ipcMain.handle('writing:update-progress', async (event, wordCount) => {
      return this.updateWritingProgress(wordCount);
    });

    ipcMain.handle('pomodoro:start', async (event, settings) => {
      return this.startPomodoroTimer(settings);
    });

    ipcMain.handle('pomodoro:pause', async (event) => {
      return this.pausePomodoroTimer();
    });

    ipcMain.handle('pomodoro:reset', async (event) => {
      return this.resetPomodoroTimer();
    });

    // Settings
    ipcMain.handle('settings:get', async (event) => {
      return this.settings;
    });

    ipcMain.handle('settings:update', async (event, newSettings) => {
      this.settings = { ...this.settings, ...newSettings };
      this.saveSettings();
      return this.settings;
    });

    // Theme Management
    ipcMain.handle('theme:set', async (event, theme) => {
      return this.setTheme(theme);
    });

    ipcMain.handle('theme:get', async (event) => {
      return this.settings.theme;
    });

    // Collaboration
    ipcMain.handle('collaboration:enable', async (event) => {
      return await collaborationManager.enable();
    });

    ipcMain.handle('collaboration:share', async (event, projectData) => {
      return await collaborationManager.shareProject(projectData);
    });

    ipcMain.handle('collaboration:invite', async (event, email, permissions) => {
      return await collaborationManager.inviteUser(email, permissions);
    });

    // Version Control
    ipcMain.handle('git:init', async (event, projectPath) => {
      return await this.initGitRepo(projectPath);
    });

    ipcMain.handle('git:commit', async (event, message, files) => {
      return await this.commitChanges(message, files);
    });

    ipcMain.handle('git:history', async (event, projectPath) => {
      return await this.getGitHistory(projectPath);
    });

    // Backup & Restore
    ipcMain.handle('backup:create', async (event, projectPath) => {
      return await backupManager.createBackup(projectPath);
    });

    ipcMain.handle('backup:restore', async (event, backupPath) => {
      return await backupManager.restoreBackup(backupPath);
    });

    ipcMain.handle('backup:list', async (event, projectPath) => {
      return await backupManager.listBackups(projectPath);
    });

    // Dialog handlers
    ipcMain.handle('dialog:show-open-dialog', async (event, options) => {
      const result = await dialog.showOpenDialog(this.mainWindow, options);
      return result;
    });

    ipcMain.handle('dialog:show-save-dialog', async (event, options) => {
      const result = await dialog.showSaveDialog(this.mainWindow, options);
      return result;
    });

    ipcMain.handle('dialog:show-message-box', async (event, options) => {
      const result = await dialog.showMessageBox(this.mainWindow, options);
      return result;
    });

    // System integration
    ipcMain.handle('system:open-external', async (event, url) => {
      return shell.openExternal(url);
    });

    ipcMain.handle('system:show-item-in-folder', async (event, fullPath) => {
      return shell.showItemInFolder(fullPath);
    });

    // Window management
    ipcMain.handle('window:minimize', async (event) => {
      this.mainWindow.minimize();
    });

    ipcMain.handle('window:maximize', async (event) => {
      if (this.mainWindow.isMaximized()) {
        this.mainWindow.unmaximize();
      } else {
        this.mainWindow.maximize();
      }
    });

    ipcMain.handle('window:close', async (event) => {
      this.mainWindow.close();
    });

    ipcMain.handle('window:toggle-fullscreen', async (event) => {
      this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
    });
  }

  // Settings Management
  loadSettings() {
    try {
      const settingsPath = path.join(app.getPath('userData'), 'settings.json');
      if (fs.existsSync(settingsPath)) {
        const savedSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        this.settings = { ...this.settings, ...savedSettings };
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  saveSettings() {
    try {
      const settingsPath = path.join(app.getPath('userData'), 'settings.json');
      fs.writeFileSync(settingsPath, JSON.stringify(this.settings, null, 2));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  saveWindowState() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      const bounds = this.mainWindow.getBounds();
      this.settings.windowWidth = bounds.width;
      this.settings.windowHeight = bounds.height;
      this.settings.windowX = bounds.x;
      this.settings.windowY = bounds.y;
      this.settings.maximized = this.mainWindow.isMaximized();
    }
  }

  // Recent Projects Management
  loadRecentProjects() {
    try {
      const recentPath = path.join(app.getPath('userData'), 'recent-projects.json');
      if (fs.existsSync(recentPath)) {
        this.recentProjects = JSON.parse(fs.readFileSync(recentPath, 'utf8'));
      }
    } catch (error) {
      console.error('Error loading recent projects:', error);
      this.recentProjects = [];
    }
  }

  saveRecentProjects() {
    try {
      const recentPath = path.join(app.getPath('userData'), 'recent-projects.json');
      fs.writeFileSync(recentPath, JSON.stringify(this.recentProjects, null, 2));
    } catch (error) {
      console.error('Error saving recent projects:', error);
    }
  }

  addToRecentProjects(projectPath, projectName) {
    const existingIndex = this.recentProjects.findIndex(p => p.path === projectPath);
    if (existingIndex !== -1) {
      this.recentProjects.splice(existingIndex, 1);
    }

    this.recentProjects.unshift({
      name: projectName,
      path: projectPath,
      lastOpened: new Date().toISOString()
    });

    // Keep only last 10 projects
    this.recentProjects = this.recentProjects.slice(0, 10);
    this.saveRecentProjects();
  }

  // Auto-save functionality
  startAutoSave() {
    if (this.settings.autoSave) {
      setInterval(() => {
        this.sendToRenderer('auto-save-triggered');
      }, this.settings.autoSaveInterval);
    }
  }

  // Auto-backup functionality
  startAutoBackup() {
    setInterval(async () => {
      if (this.currentProject) {
        try {
          await backupManager.createAutoBackup(this.currentProject.path);
        } catch (error) {
          console.error('Auto-backup failed:', error);
        }
      }
    }, this.settings.backupInterval);
  }

  // Theme Management
  setupTheme() {
    nativeTheme.themeSource = this.settings.theme === 'light' ? 'light' : 'dark';
    this.sendToRenderer('theme-changed', this.settings.theme);
  }

  setTheme(theme) {
    this.settings.theme = theme;
    this.setupTheme();
    this.saveSettings();
  }

  // Communication with renderer
  sendToRenderer(channel, data) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }

  // Enhanced file operations
  async newProject() {
    this.sendToRenderer('show-new-project-dialog');
  }

  async openProject() {
    const result = await dialog.showOpenDialog(this.mainWindow, {
      title: 'Open Writing Project',
      properties: ['openDirectory'],
      message: 'Select the folder containing your writing project'
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const projectPath = result.filePaths[0];
      await this.loadProject(projectPath);
    }
  }

  async loadProject(projectPath) {
    try {
      const projectData = await projectManager.loadProject(projectPath);
      this.currentProject = {
        path: projectPath,
        data: projectData
      };

      this.addToRecentProjects(projectPath, projectData.name || path.basename(projectPath));
      this.updateWindowTitle(projectData.name || path.basename(projectPath));
      this.sendToRenderer('project-loaded', { path: projectPath, data: projectData });

      return { success: true, project: projectData };
    } catch (error) {
      console.error('Error loading project:', error);
      await dialog.showErrorBox('Error', `Failed to load project: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async saveProject(projectData) {
    if (!this.currentProject) return;

    try {
      await projectManager.saveProject(this.currentProject.path, projectData);
      this.isModified = false;
      this.sendToRenderer('project-saved');
      return { success: true };
    } catch (error) {
      console.error('Error saving project:', error);
      return { success: false, error: error.message };
    }
  }

  // Enhanced export functionality
  async exportProject(format, options = {}) {
    if (!this.currentProject) {
      await dialog.showErrorBox('Error', 'No project is currently open');
      return;
    }

    try {
      const result = await exportManager.exportProject(
        this.currentProject.path,
        this.currentProject.data,
        format,
        options
      );

      if (result.success) {
        const choice = await dialog.showMessageBox(this.mainWindow, {
          type: 'info',
          title: 'Export Complete',
          message: `Your project has been exported successfully to ${result.outputPath}`,
          buttons: ['OK', 'Open File', 'Show in Folder'],
          defaultId: 0
        });

        if (choice.response === 1) {
          shell.openPath(result.outputPath);
        } else if (choice.response === 2) {
          shell.showItemInFolder(result.outputPath);
        }
      } else {
        await dialog.showErrorBox('Export Failed', result.error);
      }

      return result;
    } catch (error) {
      console.error('Export error:', error);
      await dialog.showErrorBox('Export Error', error.message);
      return { success: false, error: error.message };
    }
  }

  // Writing session management
  startWritingSession(goals = {}) {
    this.writingSession = {
      startTime: new Date(),
      wordsWritten: 0,
      goalReached: false,
      pomodoroTimer: null,
      currentPomodoro: 0,
      isBreak: false,
      goals: { ...this.settings.writingGoals, ...goals }
    };

    this.sendToRenderer('writing-session-started', this.writingSession);
    return this.writingSession;
  }

  endWritingSession() {
    if (!this.writingSession.startTime) return;

    const endTime = new Date();
    const duration = endTime - this.writingSession.startTime;
    const sessionData = {
      ...this.writingSession,
      endTime,
      duration,
      wordsPerMinute: this.writingSession.wordsWritten / (duration / 60000)
    };

    this.writingSession = {
      startTime: null,
      wordsWritten: 0,
      goalReached: false,
      pomodoroTimer: null,
      currentPomodoro: 0,
      isBreak: false
    };

    this.sendToRenderer('writing-session-ended', sessionData);
    return sessionData;
  }

  updateWritingProgress(wordCount) {
    if (this.writingSession.startTime) {
      this.writingSession.wordsWritten = wordCount;
      this.sendToRenderer('writing-progress-updated', this.writingSession);
    }
  }

  // Pomodoro timer
  startPomodoroTimer(settings = {}) {
    const pomodoroSettings = { ...this.settings.pomodoroSettings, ...settings };

    if (this.writingSession.pomodoroTimer) {
      clearInterval(this.writingSession.pomodoroTimer);
    }

    const duration = this.writingSession.isBreak
      ? (this.writingSession.currentPomodoro % pomodoroSettings.sessionsUntilLongBreak === 0
         ? pomodoroSettings.longBreak
         : pomodoroSettings.shortBreak)
      : pomodoroSettings.workDuration;

    let timeLeft = duration * 60; // Convert to seconds

    this.writingSession.pomodoroTimer = setInterval(() => {
      timeLeft--;

      this.sendToRenderer('pomodoro-tick', {
        timeLeft,
        isBreak: this.writingSession.isBreak,
        currentPomodoro: this.writingSession.currentPomodoro
      });

      if (timeLeft <= 0) {
        this.completePomodoroSession();
      }
    }, 1000);

    return { success: true, duration, isBreak: this.writingSession.isBreak };
  }

  completePomodoroSession() {
    clearInterval(this.writingSession.pomodoroTimer);

    if (!this.writingSession.isBreak) {
      this.writingSession.currentPomodoro++;
      this.writingSession.isBreak = true;
    } else {
      this.writingSession.isBreak = false;
    }

    this.sendToRenderer('pomodoro-complete', {
      isBreak: this.writingSession.isBreak,
      currentPomodoro: this.writingSession.currentPomodoro
    });
  }

  pausePomodoroTimer() {
    if (this.writingSession.pomodoroTimer) {
      clearInterval(this.writingSession.pomodoroTimer);
      this.writingSession.pomodoroTimer = null;
      this.sendToRenderer('pomodoro-paused');
    }
  }

  resetPomodoroTimer() {
    if (this.writingSession.pomodoroTimer) {
      clearInterval(this.writingSession.pomodoroTimer);
      this.writingSession.pomodoroTimer = null;
    }

    this.writingSession.currentPomodoro = 0;
    this.writingSession.isBreak = false;
    this.sendToRenderer('pomodoro-reset');
  }

  // Window title management
  updateWindowTitle(projectName, fileName) {
    let title = 'Writers CLI';

    if (projectName) {
      title = `${projectName} - Writers CLI`;
    }

    if (fileName) {
      title = `${fileName} - ${projectName || 'Writers CLI'}`;
    }

    if (this.isModified) {
      title = `● ${title}`;
    }

    this.mainWindow.setTitle(title);
  }

  // Version control integration
  async initGitRepo(projectPath = null) {
    const repoPath = projectPath || this.currentProject?.path;
    if (!repoPath) return { success: false, error: 'No project selected' };

    try {
      const { spawn } = require('child_process');
      await new Promise((resolve, reject) => {
        const git = spawn('git', ['init'], { cwd: repoPath });
        git.on('close', (code) => {
          if (code === 0) resolve();
          else reject(new Error(`Git init failed with code ${code}`));
        });
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async commitChanges(message = 'Auto-save commit', files = []) {
    if (!this.currentProject) return { success: false, error: 'No project selected' };

    try {
      const { spawn } = require('child_process');

      // Add files
      await new Promise((resolve, reject) => {
        const git = spawn('git', ['add', files.length > 0 ? files.join(' ') : '.'],
          { cwd: this.currentProject.path });
        git.on('close', (code) => {
          if (code === 0) resolve();
          else reject(new Error(`Git add failed with code ${code}`));
        });
      });

      // Commit
      await new Promise((resolve, reject) => {
        const git = spawn('git', ['commit', '-m', message],
          { cwd: this.currentProject.path });
        git.on('close', (code) => {
          if (code === 0) resolve();
          else reject(new Error(`Git commit failed with code ${code}`));
        });
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Application lifecycle
  async confirmSave() {
    const result = await dialog.showMessageBox(this.mainWindow, {
      type: 'question',
      title: 'Unsaved Changes',
      message: 'You have unsaved changes. Do you want to save before closing?',
      buttons: ['Save', "Don't Save", 'Cancel'],
      defaultId: 0,
      cancelId: 2
    });

    if (result.response === 0) {
      await this.saveFile();
      return 'save';
    } else if (result.response === 1) {
      return 'dont-save';
    } else {
      return 'cancel';
    }
  }

  async exit() {
    if (this.isModified) {
      const result = await this.confirmSave();
      if (result === 'cancel') return;
    }

    this.saveSettings();
    app.quit();
  }

  // Placeholder methods for UI actions
  async newFile() { this.sendToRenderer('show-new-file-dialog'); }
  async openFile() { this.sendToRenderer('show-open-file-dialog'); }
  async saveFile() { this.sendToRenderer('save-current-file'); }
  async saveAsFile() { this.sendToRenderer('show-save-as-dialog'); }
  async saveAllFiles() { this.sendToRenderer('save-all-files'); }

  toggleSidebar() { this.sendToRenderer('toggle-sidebar'); }
  toggleDistractionFree() { this.sendToRenderer('toggle-distraction-free'); }
  toggleSplitView() { this.sendToRenderer('toggle-split-view'); }

  zoomIn() { this.sendToRenderer('zoom-in'); }
  zoomOut() { this.sendToRenderer('zoom-out'); }
  resetZoom() { this.sendToRenderer('reset-zoom'); }

  showFind() { this.sendToRenderer('show-find-dialog'); }
  showReplace() { this.sendToRenderer('show-replace-dialog'); }
  showGoToLine() { this.sendToRenderer('show-goto-line-dialog'); }

  showWritingGoals() { this.sendToRenderer('show-writing-goals'); }
  showWritingStatistics() { this.sendToRenderer('show-writing-statistics'); }
  showCharacterTracker() { this.sendToRenderer('show-character-tracker'); }
  showPlotTracker() { this.sendToRenderer('show-plot-tracker'); }
  showResearchNotes() { this.sendToRenderer('show-research-notes'); }

  toggleSpellCheck() {
    this.settings.spellCheck = !this.settings.spellCheck;
    this.saveSettings();
    this.sendToRenderer('toggle-spell-check', this.settings.spellCheck);
  }

  runGrammarCheck() { this.sendToRenderer('run-grammar-check'); }
  showWordCount() { this.sendToRenderer('show-word-count'); }
  showReadingTime() { this.sendToRenderer('show-reading-time'); }

  toggleCollaboration() {
    this.settings.collaborationEnabled = !this.settings.collaborationEnabled;
    this.saveSettings();
    this.sendToRenderer('toggle-collaboration', this.settings.collaborationEnabled);
  }

  shareProject() { this.sendToRenderer('show-share-project'); }
  inviteCollaborator() { this.sendToRenderer('show-invite-collaborator'); }
  managePermissions() { this.sendToRenderer('show-manage-permissions'); }
  showComments() { this.sendToRenderer('show-comments'); }
  showSyncStatus() { this.sendToRenderer('show-sync-status'); }

  backupProject() { this.sendToRenderer('backup-project'); }
  restoreFromBackup() { this.sendToRenderer('show-restore-from-backup'); }

  showProjectSettings() { this.sendToRenderer('show-project-settings'); }
  showPreferences() { this.sendToRenderer('show-preferences'); }
  showQuickStart() { this.sendToRenderer('show-quick-start'); }
  showKeyboardShortcuts() { this.sendToRenderer('show-keyboard-shortcuts'); }
  showWritingTips() { this.sendToRenderer('show-writing-tips'); }
  checkForUpdates() { this.sendToRenderer('check-for-updates'); }
  reportIssue() { shell.openExternal('https://github.com/yourusername/writers-cli/issues'); }
  showAbout() { this.sendToRenderer('show-about'); }

  clearRecentProjects() {
    this.recentProjects = [];
    this.saveRecentProjects();
    this.setupMenu(); // Rebuild menu
  }

  openRecentProject(projectPath) {
    this.loadProject(projectPath);
  }
}

// Initialize app
const enhancedGUI = new EnhancedWritersGUI();

app.whenReady().then(() => {
  enhancedGUI.createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      enhancedGUI.createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle certificate errors for development
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (url.startsWith('https://localhost') || url.startsWith('https://127.0.0.1')) {
    event.preventDefault();
    callback(true);
  } else {
    callback(false);
  }
});

module.exports = enhancedGUI;
