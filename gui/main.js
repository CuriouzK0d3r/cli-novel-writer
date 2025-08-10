const {
  app,
  BrowserWindow,
  Menu,
  ipcMain,
  dialog,
  shell,
} = require("electron");
const path = require("path");
const fs = require("fs-extra");
const projectManager = require("../src/utils/project");
const markdownUtils = require("../src/utils/markdown");

// Keep a global reference of the window object
let mainWindow;
let isQuitting = false;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    icon: path.join(__dirname, "assets", "icon.png"),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    show: false, // Don't show until ready
  });

  // Load the project interface
  mainWindow.loadFile(path.join(__dirname, "project-interface.html"));

  // Show window when ready to prevent visual flash
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();

    // Focus on macOS
    if (process.platform === "darwin") {
      mainWindow.focus();
    }
  });

  // Handle window closed
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Handle window close event
  mainWindow.on("close", (event) => {
    if (process.platform === "darwin" && !isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  // Create application menu
  createMenu();

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

function createMenu() {
  const template = [
    {
      label: "File",
      submenu: [
        {
          label: "New Project...",
          accelerator: "CmdOrCtrl+N",
          click: () => {
            mainWindow.webContents.send("menu-action", "new-project");
          },
        },
        {
          label: "Open Project...",
          accelerator: "CmdOrCtrl+O",
          click: () => {
            mainWindow.webContents.send("menu-action", "open-project");
          },
        },
        { type: "separator" },
        {
          label: "New Chapter",
          accelerator: "CmdOrCtrl+Shift+C",
          click: () => {
            mainWindow.webContents.send("menu-action", "new-chapter");
          },
        },
        {
          label: "New Scene",
          accelerator: "CmdOrCtrl+Shift+S",
          click: () => {
            mainWindow.webContents.send("menu-action", "new-scene");
          },
        },
        {
          label: "New Character",
          accelerator: "CmdOrCtrl+Shift+H",
          click: () => {
            mainWindow.webContents.send("menu-action", "new-character");
          },
        },
        { type: "separator" },
        {
          label: "Export...",
          accelerator: "CmdOrCtrl+E",
          click: () => {
            mainWindow.webContents.send("menu-action", "export");
          },
        },
        { type: "separator" },
        process.platform === "darwin"
          ? {
              label: "Close",
              accelerator: "CmdOrCtrl+W",
              role: "close",
            }
          : {
              label: "Exit",
              accelerator: "CmdOrCtrl+Q",
              click: () => {
                app.quit();
              },
            },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { label: "Undo", accelerator: "CmdOrCtrl+Z", role: "undo" },
        { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", role: "redo" },
        { type: "separator" },
        { label: "Cut", accelerator: "CmdOrCtrl+X", role: "cut" },
        { label: "Copy", accelerator: "CmdOrCtrl+C", role: "copy" },
        { label: "Paste", accelerator: "CmdOrCtrl+V", role: "paste" },
        { label: "Select All", accelerator: "CmdOrCtrl+A", role: "selectall" },
        { type: "separator" },
        {
          label: "Find",
          accelerator: "CmdOrCtrl+F",
          click: () => {
            mainWindow.webContents.send("menu-action", "find");
          },
        },
        {
          label: "Find and Replace",
          accelerator: "CmdOrCtrl+H",
          click: () => {
            mainWindow.webContents.send("menu-action", "find-replace");
          },
        },
      ],
    },
    {
      label: "View",
      submenu: [
        { label: "Reload", accelerator: "CmdOrCtrl+R", role: "reload" },
        {
          label: "Force Reload",
          accelerator: "CmdOrCtrl+Shift+R",
          role: "forceReload",
        },
        {
          label: "Toggle Developer Tools",
          accelerator: "F12",
          role: "toggleDevTools",
        },
        { type: "separator" },
        { label: "Actual Size", accelerator: "CmdOrCtrl+0", role: "resetZoom" },
        { label: "Zoom In", accelerator: "CmdOrCtrl+Plus", role: "zoomIn" },
        { label: "Zoom Out", accelerator: "CmdOrCtrl+-", role: "zoomOut" },
        { type: "separator" },
        {
          label: "Toggle Fullscreen",
          accelerator: "F11",
          role: "togglefullscreen",
        },
        { type: "separator" },
        {
          label: "Dark Theme",
          type: "checkbox",
          checked: false,
          click: (menuItem) => {
            mainWindow.webContents.send(
              "menu-action",
              "toggle-theme",
              menuItem.checked,
            );
          },
        },
      ],
    },
    {
      label: "Tools",
      submenu: [
        {
          label: "Statistics",
          accelerator: "CmdOrCtrl+I",
          click: () => {
            mainWindow.webContents.send("menu-action", "statistics");
          },
        },
        {
          label: "Word Count",
          accelerator: "CmdOrCtrl+Shift+W",
          click: () => {
            mainWindow.webContents.send("menu-action", "word-count");
          },
        },
        { type: "separator" },
        {
          label: "Backup Project",
          click: () => {
            mainWindow.webContents.send("menu-action", "backup");
          },
        },
        {
          label: "Project Settings",
          click: () => {
            mainWindow.webContents.send("menu-action", "settings");
          },
        },
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "About Writers CLI",
          click: () => {
            mainWindow.webContents.send("menu-action", "about");
          },
        },
        {
          label: "Keyboard Shortcuts",
          click: () => {
            mainWindow.webContents.send("menu-action", "shortcuts");
          },
        },
        { type: "separator" },
        {
          label: "Report Issue",
          click: () => {
            shell.openExternal(
              "https://github.com/yourusername/writers-cli/issues",
            );
          },
        },
      ],
    },
  ];

  // macOS specific menu adjustments
  if (process.platform === "darwin") {
    template.unshift({
      label: "Writers CLI",
      submenu: [
        { label: "About Writers CLI", role: "about" },
        { type: "separator" },
        { label: "Services", role: "services", submenu: [] },
        { type: "separator" },
        { label: "Hide Writers CLI", accelerator: "Command+H", role: "hide" },
        {
          label: "Hide Others",
          accelerator: "Command+Shift+H",
          role: "hideothers",
        },
        { label: "Show All", role: "unhide" },
        { type: "separator" },
        { label: "Quit", accelerator: "Command+Q", click: () => app.quit() },
      ],
    });

    // Remove redundant quit from File menu
    template[1].submenu.pop();
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// App event handlers
app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else if (mainWindow) {
    mainWindow.show();
  }
});

app.on("before-quit", () => {
  isQuitting = true;
});

// IPC handlers for communication with renderer process
ipcMain.handle("get-project-config", async () => {
  try {
    if (!projectManager.isWritersProject()) {
      return null;
    }
    return await projectManager.getConfig();
  } catch (error) {
    console.error("Error getting project config:", error);
    return null;
  }
});

ipcMain.handle("get-project-stats", async () => {
  try {
    if (!projectManager.isWritersProject()) {
      return null;
    }
    return await projectManager.getProjectStats();
  } catch (error) {
    console.error("Error getting project stats:", error);
    return null;
  }
});

ipcMain.handle("get-files", async (event, type) => {
  try {
    return await projectManager.getFiles(type);
  } catch (error) {
    console.error(`Error getting ${type} files:`, error);
    return [];
  }
});

ipcMain.handle("read-file", async (event, filePath) => {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (error) {
    console.error("Error reading file:", error);
    throw error;
  }
});

ipcMain.handle("write-file", async (event, filePath, content) => {
  try {
    await fs.writeFile(filePath, content, "utf8");
    return true;
  } catch (error) {
    console.error("Error writing file:", error);
    throw error;
  }
});

ipcMain.handle("create-file", async (event, type, name, template) => {
  try {
    return await projectManager.createFile(type, name, template);
  } catch (error) {
    console.error("Error creating file:", error);
    throw error;
  }
});

ipcMain.handle("delete-file", async (event, filePath) => {
  try {
    await fs.remove(filePath);
    return true;
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
});

ipcMain.handle("init-project", async (event, options) => {
  try {
    const projectRoot = path.join(
      app.getPath("documents"),
      options.name || "WritersProject",
    );
    await fs.ensureDir(projectRoot);
    if (typeof projectManager.setBaseDir === "function") {
      projectManager.setBaseDir(projectRoot);
    }
    return await projectManager.initProject(options);
  } catch (error) {
    console.error("Error initializing project:", error);
    throw error;
  }
});

ipcMain.handle("update-config", async (event, updates) => {
  try {
    return await projectManager.updateConfig(updates);
  } catch (error) {
    console.error("Error updating config:", error);
    throw error;
  }
});

ipcMain.handle("create-backup", async () => {
  try {
    return await projectManager.createBackup();
  } catch (error) {
    console.error("Error creating backup:", error);
    throw error;
  }
});

ipcMain.handle("export-project", async (event, format, options) => {
  try {
    const exportCommand = require("../src/commands/export");
    return await exportCommand(format, options);
  } catch (error) {
    console.error("Error exporting project:", error);
    throw error;
  }
});

ipcMain.handle("show-save-dialog", async (event, options) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, options);
    return result;
  } catch (error) {
    console.error("Error showing save dialog:", error);
    throw error;
  }
});

ipcMain.handle("show-open-dialog", async (event, options) => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, options);
    if (!result.canceled && result.filePaths && result.filePaths[0]) {
      const projectPath = result.filePaths[0];
      if (typeof projectManager.setBaseDir === "function") {
        projectManager.setBaseDir(projectPath);
      }
    }
    return result;
  } catch (error) {
    console.error("Error showing open dialog:", error);
    throw error;
  }
});

ipcMain.handle("show-message-box", async (event, options) => {
  try {
    const result = await dialog.showMessageBox(mainWindow, options);
    return result;
  } catch (error) {
    console.error("Error showing message box:", error);
    throw error;
  }
});

// Count words using the project manager's utility
ipcMain.handle("count-words", async (event, text) => {
  try {
    return projectManager.countWords(text);
  } catch (error) {
    console.error("Error counting words:", error);
    return 0;
  }
});

// Markdown utilities
ipcMain.handle("estimate-reading-time", async (event, text) => {
  try {
    return markdownUtils.estimateReadingTime(text);
  } catch (error) {
    console.error("Error estimating reading time:", error);
    return "0 min";
  }
});

// Handle app protocol for opening projects
app.setAsDefaultProtocolClient("writers-cli");

// Handle the protocol on Windows/Linux
app.on("second-instance", (event, commandLine, workingDirectory) => {
  // Someone tried to run a second instance, focus our window instead
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});
