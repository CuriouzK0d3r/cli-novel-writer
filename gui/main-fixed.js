const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs-extra');

// Project manager for handling project operations
const projectManager = require('../src/utils/project');

let mainWindow;

async function createWindow() {
  console.log('🚀 Creating Writers CLI window...');

  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, '..', 'gui-logo.icns'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show: false,
    backgroundColor: '#667eea',
  });

  // Load the fixed interface
  const fixedInterface = path.join(__dirname, 'project-interface-fixed.html');

  console.log('📁 Loading interface:', fixedInterface);

  if (!await fs.pathExists(fixedInterface)) {
    console.error('❌ Interface file not found:', fixedInterface);
    process.exit(1);
  }

  await mainWindow.loadFile(fixedInterface);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    console.log('✅ Writers CLI window shown');

    // Center the window
    mainWindow.center();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Set window title
  mainWindow.setTitle('Writers CLI');

  console.log('✅ Writers CLI window created');
}

// App event handlers
app.whenReady().then(async () => {
  console.log('🔧 Electron app ready, setting up IPC handlers...');

  // Set up IPC handlers
  setupIpcHandlers();

  // Create window
  await createWindow();

  console.log('🎉 Writers CLI launched successfully!');
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    await createWindow();
  }
});

function setupIpcHandlers() {
  console.log('⚙️  Setting up IPC handlers...');

  // Project initialization handler
  ipcMain.handle('init-project', async (event, options) => {
    console.log('📨 IPC: init-project called with options:', options);

    try {
      // Validate options
      if (!options.name || !options.author) {
        throw new Error('Project name and author are required');
      }

      // Sanitize project name for directory
      const sanitizedName = options.name.replace(/[^a-zA-Z0-9\s-_]/g, '').trim();
      if (!sanitizedName) {
        throw new Error('Invalid project name');
      }

      // Create project root directory in Documents
      const projectRoot = path.join(
        app.getPath('documents'),
        sanitizedName
      );

      console.log('📂 Creating project in:', projectRoot);

      // Check if directory already exists
      if (await fs.pathExists(projectRoot)) {
        const configExists = await fs.pathExists(path.join(projectRoot, 'writers.config.json'));
        if (configExists) {
          throw new Error(`Project "${sanitizedName}" already exists. Please choose a different name.`);
        }
      }

      // Ensure directory exists
      await fs.ensureDir(projectRoot);
      console.log('✅ Project directory created');

      // Set base directory for project manager
      if (typeof projectManager.setBaseDir === 'function') {
        projectManager.setBaseDir(projectRoot);
        console.log('✅ Base directory set to:', projectRoot);
      } else {
        throw new Error('ProjectManager setBaseDir method not available');
      }

      // Initialize project
      console.log('🚀 Initializing project...');
      const config = await projectManager.initProject({
        name: options.name,
        author: options.author,
        type: options.type || 'novel',
        wordGoal: options.wordGoal || 50000
      });

      console.log('✅ Project initialized successfully');

      // Add the project path to the config for the frontend
      config.projectPath = projectRoot;

      return config;

    } catch (error) {
      console.error('❌ Error initializing project:', error.message);
      throw error;
    }
  });

  // Project config getter
  ipcMain.handle('get-project-config', async (event) => {
    console.log('📨 IPC: get-project-config called');

    try {
      const config = await projectManager.getConfig();
      console.log('✅ Config retrieved');
      return config;
    } catch (error) {
      console.warn('⚠️ No project config found:', error.message);
      return null;
    }
  });

  // Open project dialog
  ipcMain.handle('open-project-dialog', async (event) => {
    console.log('📨 IPC: open-project-dialog called');

    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
        title: 'Select Project Directory',
        buttonLabel: 'Open Project',
        message: 'Choose the folder containing your Writers CLI project'
      });

      if (result.canceled) {
        console.log('📂 Project dialog canceled');
        return { canceled: true };
      }

      const projectPath = result.filePaths[0];
      console.log('📂 Project path selected:', projectPath);

      // Check if it's a valid Writers CLI project
      const configPath = path.join(projectPath, 'writers.config.json');
      const hasConfig = await fs.pathExists(configPath);

      if (!hasConfig) {
        throw new Error('The selected folder is not a Writers CLI project.\n\nPlease select a folder that contains a writers.config.json file.');
      }

      // Set base directory and load config
      projectManager.setBaseDir(projectPath);
      const config = await projectManager.getConfig();

      // Add project path to config
      config.projectPath = projectPath;

      console.log('✅ Project opened successfully:', config.name);
      return { canceled: false, config, path: projectPath };

    } catch (error) {
      console.error('❌ Error opening project:', error.message);
      throw error;
    }
  });

  // Update config handler
  ipcMain.handle('update-config', async (event, updates) => {
    console.log('📨 IPC: update-config called');

    try {
      const config = await projectManager.updateConfig(updates);
      console.log('✅ Config updated');
      return config;
    } catch (error) {
      console.error('❌ Error updating config:', error.message);
      throw error;
    }
  });

  console.log('✅ IPC handlers set up successfully');
}

// Handle uncaught exceptions gracefully
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);

  // Show error dialog to user
  if (mainWindow) {
    dialog.showErrorBox(
      'Unexpected Error',
      `An unexpected error occurred:\n\n${error.message}\n\nThe application will continue running, but you may want to restart it.`
    );
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);

  // Show error dialog to user
  if (mainWindow) {
    dialog.showErrorBox(
      'Unexpected Error',
      `An unexpected error occurred:\n\n${reason}\n\nThe application will continue running, but you may want to restart it.`
    );
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    console.warn('Prevented new window creation for:', navigationUrl);
  });
});

// Log startup info
console.log('🖊️  Writers CLI - Main GUI');
console.log('==========================');
console.log('Node.js version:', process.version);
console.log('Electron version:', process.versions.electron);
console.log('Platform:', process.platform);
console.log('Working directory:', process.cwd());
console.log('Documents path:', app.getPath('documents'));
console.log('');
console.log('Starting application...');

module.exports = { createWindow };
