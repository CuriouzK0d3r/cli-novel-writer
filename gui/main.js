const { app, BrowserWindow, Menu, dialog, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs-extra");
const projectManager = require("../src/utils/project");

class WritersGUI {
  constructor() {
    this.mainWindow = null;
    this.currentProject = null;
    this.currentFile = null;
    this.isModified = false;
  }

  createWindow() {
    // Create the browser window
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true,
        sandbox: false,
      },
      icon: path.join(__dirname, "../assets/icon.png"),
      show: false,
      titleBarStyle: "default",
    });

    // Load the project interface
    this.mainWindow.loadFile(path.join(__dirname, "project-interface.html"));

    // Show window when ready to prevent visual flash
    this.mainWindow.once("ready-to-show", () => {
      this.mainWindow.show();
    });

    // Handle window closed
    this.mainWindow.on("closed", () => {
      this.mainWindow = null;
    });

    // Handle before close to check for unsaved changes
    this.mainWindow.on("close", async (event) => {
      if (this.isModified) {
        event.preventDefault();
        const result = await this.confirmSave();
        if (result !== "cancel") {
          this.mainWindow.destroy();
        }
      }
    });

    this.setupMenu();
    this.setupIPC();
  }

  setupMenu() {
    const template = [
      {
        label: "File",
        submenu: [
          {
            label: "New",
            accelerator: "CmdOrCtrl+N",
            click: () => this.newFile(),
          },
          {
            label: "Open...",
            accelerator: "CmdOrCtrl+O",
            click: () => this.openFile(),
          },
          {
            type: "separator",
          },
          {
            label: "Save",
            accelerator: "CmdOrCtrl+S",
            click: () => this.saveFile(),
          },
          {
            label: "Save As...",
            accelerator: "CmdOrCtrl+Shift+S",
            click: () => this.saveAsFile(),
          },
          {
            type: "separator",
          },
          {
            label: "Exit",
            accelerator: process.platform === "darwin" ? "Cmd+Q" : "Ctrl+X",
            click: () => this.exit(),
          },
        ],
      },
      {
        label: "Edit",
        submenu: [
          {
            label: "Undo",
            accelerator: "CmdOrCtrl+Z",
            click: () => this.sendToRenderer("undo"),
          },
          {
            label: "Redo",
            accelerator: "CmdOrCtrl+Y",
            click: () => this.sendToRenderer("redo"),
          },
          {
            type: "separator",
          },
          {
            label: "Select All",
            accelerator: "CmdOrCtrl+A",
            click: () => this.sendToRenderer("selectAll"),
          },
          {
            type: "separator",
          },
          {
            label: "Find",
            accelerator: "CmdOrCtrl+F",
            click: () => this.sendToRenderer("showFind"),
          },
          {
            label: "Replace",
            accelerator: "CmdOrCtrl+R",
            click: () => this.sendToRenderer("showReplace"),
          },
          {
            label: "Go to Line",
            accelerator: "CmdOrCtrl+G",
            click: () => this.sendToRenderer("showGoToLine"),
          },
        ],
      },
      {
        label: "View",
        submenu: [
          {
            label: "Word Count",
            accelerator: "CmdOrCtrl+W",
            click: () => this.sendToRenderer("showWordCount"),
          },
          {
            label: "Toggle Distraction Free",
            accelerator: "F11",
            click: () => this.toggleDistractionFree(),
          },
          {
            type: "separator",
          },
          {
            label: "Toggle Developer Tools",
            accelerator:
              process.platform === "darwin" ? "Alt+Cmd+I" : "Ctrl+Shift+I",
            click: () => this.mainWindow.webContents.toggleDevTools(),
          },
        ],
      },
      {
        label: "Help",
        submenu: [
          {
            label: "Help",
            accelerator: "F1",
            click: () => this.sendToRenderer("showHelp"),
          },
          {
            label: "About",
            click: () => this.showAbout(),
          },
        ],
      },
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  setupIPC() {
    // Project operations
    ipcMain.handle("check-project", async () => {
      return projectManager.isWritersProject();
    });

    ipcMain.handle("get-project-config", async () => {
      if (!projectManager.isWritersProject()) {
        throw new Error("Not a Writers project");
      }
      return await projectManager.getConfig();
    });

    ipcMain.handle("create-project", async (event, projectData) => {
      try {
        // Show save dialog to select directory
        const result = await dialog.showSaveDialog(this.mainWindow, {
          title: "Create New Project",
          defaultPath: projectData.name,
          properties: ["createDirectory"],
        });

        if (result.canceled) {
          throw new Error("Project creation cancelled");
        }

        const projectPath = result.filePath;

        // Create directory if it doesn't exist
        await fs.ensureDir(projectPath);

        // Change to project directory
        process.chdir(projectPath);

        // Initialize project
        const config = await projectManager.initProject(projectData);
        this.currentProject = projectPath;

        return config;
      } catch (error) {
        throw new Error(`Failed to create project: ${error.message}`);
      }
    });

    ipcMain.handle("open-project-dialog", async () => {
      const result = await dialog.showOpenDialog(this.mainWindow, {
        properties: ["openDirectory"],
        title: "Open Project Directory",
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const projectPath = result.filePaths[0];

        // Change to project directory
        process.chdir(projectPath);

        if (!projectManager.isWritersProject()) {
          throw new Error("Selected directory is not a Writers project");
        }

        const config = await projectManager.getConfig();
        this.currentProject = projectPath;

        return config;
      }

      return null;
    });

    ipcMain.handle("update-project-config", async (event, updates) => {
      return await projectManager.updateConfig(updates);
    });

    // File operations
    ipcMain.handle("get-files", async (event, type) => {
      try {
        const files = await projectManager.getFiles(type);

        // Add word count for each file
        const filesWithStats = await Promise.all(
          files.map(async (file) => {
            try {
              const content = await fs.readFile(file.path, "utf8");
              const words = projectManager.countWords(content);
              return { ...file, words };
            } catch (error) {
              console.error(`Error reading file ${file.path}:`, error);
              return { ...file, words: 0 };
            }
          }),
        );

        return filesWithStats;
      } catch (error) {
        console.error("Error getting files:", error);
        throw new Error(`Failed to get files: ${error.message}`);
      }
    });

    ipcMain.handle("create-file", async (event, type, name) => {
      try {
        // Map singular types to plural types that projectManager expects
        const typeMap = {
          chapter: "chapters",
          scene: "scenes",
          character: "characters",
          shortstory: "shortstories",
          note: "notes",
        };

        const pluralType = typeMap[type] || type;
        return await projectManager.createFile(pluralType, name);
      } catch (error) {
        console.error("Error creating file:", error);
        throw new Error(`Failed to create ${type}: ${error.message}`);
      }
    });

    ipcMain.handle("read-file", async (event, filePath) => {
      try {
        return await fs.readFile(filePath, "utf8");
      } catch (error) {
        console.error("Error reading file:", error);
        throw new Error(`Failed to read file: ${error.message}`);
      }
    });

    ipcMain.handle("write-file", async (event, filePath, content) => {
      try {
        await fs.writeFile(filePath, content, "utf8");
        return { success: true };
      } catch (error) {
        console.error("Error writing file:", error);
        throw new Error(`Failed to save file: ${error.message}`);
      }
    });

    // Statistics
    ipcMain.handle("get-project-stats", async () => {
      try {
        return await projectManager.getProjectStats();
      } catch (error) {
        console.error("Error getting project stats:", error);
        throw new Error(`Failed to get statistics: ${error.message}`);
      }
    });

    ipcMain.handle("get-detailed-stats", async () => {
      try {
        const stats = await projectManager.getProjectStats();

        // Add more detailed statistics
        const detailedStats = {
          ...stats,
          avgChapterLength:
            stats.chapters.length > 0
              ? Math.round(stats.totalWords / stats.chapters.length)
              : 0,
          readingTime: Math.ceil(stats.totalWords / 200), // 200 words per minute
          lastModified:
            stats.chapters.length > 0
              ? Math.max(
                  ...stats.chapters.map((c) =>
                    new Date(c.modified || 0).getTime(),
                  ),
                )
              : null,
        };

        return detailedStats;
      } catch (error) {
        console.error("Error getting detailed stats:", error);
        throw new Error(`Failed to get detailed statistics: ${error.message}`);
      }
    });

    // Export
    ipcMain.handle("export-project", async (event, options = {}) => {
      try {
        // Show save dialog for export location
        const result = await dialog.showSaveDialog(this.mainWindow, {
          title: "Export Project",
          defaultPath: `${this.currentProject ? path.basename(this.currentProject) : "project"}-export`,
          filters: [
            { name: "HTML Files", extensions: ["html"] },
            { name: "Text Files", extensions: ["txt"] },
            { name: "PDF Files", extensions: ["pdf"] },
          ],
        });

        if (result.canceled) {
          return null;
        }

        // Simple HTML export for now
        const stats = await projectManager.getProjectStats();
        const files = await projectManager.getFiles("chapters");

        let html = `<!DOCTYPE html>
<html>
<head>
    <title>${stats.project}</title>
    <style>
        body { font-family: Georgia, serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { border-bottom: 2px solid #333; }
        h2 { margin-top: 2em; }
        .chapter { page-break-before: always; }
    </style>
</head>
<body>
    <h1>${stats.project}</h1>
    <p>By ${stats.author}</p>
    <hr>
`;

        for (const file of files) {
          try {
            const content = await fs.readFile(file.path, "utf8");
            html += `<div class="chapter">
              <h2>${file.name}</h2>
              ${content.replace(/\n/g, "<br>")}
            </div>`;
          } catch (error) {
            console.error(`Error reading ${file.path}:`, error);
          }
        }

        html += `
</body>
</html>`;

        await fs.writeFile(result.filePath, html, "utf8");
        return { success: true, path: result.filePath };
      } catch (error) {
        throw new Error(`Export failed: ${error.message}`);
      }
    });

    // Legacy file operations for compatibility
    ipcMain.handle("save-file", async (event, content) => {
      return await this.saveFileContent(content);
    });

    ipcMain.handle("open-file", async () => {
      return await this.openFileDialog();
    });

    ipcMain.handle("save-as-file", async (event, content) => {
      return await this.saveAsFileDialog(content);
    });

    // Content change notifications
    ipcMain.on("content-changed", (event, isModified) => {
      this.isModified = isModified;
      this.updateWindowTitle();
    });

    // Get current file info
    ipcMain.handle("get-current-file", () => {
      return this.currentFile;
    });

    // Exit application
    ipcMain.on("exit-app", () => {
      this.exit();
    });
  }

  sendToRenderer(action, data = null) {
    if (this.mainWindow && this.mainWindow.webContents) {
      this.mainWindow.webContents.send(action, data);
    }
  }

  async newFile() {
    if (this.isModified) {
      const result = await this.confirmSave();
      if (result === "cancel") return;
    }

    this.currentFile = null;
    this.isModified = false;
    this.sendToRenderer("new-file");
    this.updateWindowTitle();
  }

  async openFile() {
    if (this.isModified) {
      const result = await this.confirmSave();
      if (result === "cancel") return;
    }

    const result = await dialog.showOpenDialog(this.mainWindow, {
      properties: ["openFile"],
      filters: [
        { name: "Text Files", extensions: ["txt", "md", "markdown"] },
        { name: "All Files", extensions: ["*"] },
      ],
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      try {
        const content = await fs.readFile(filePath, "utf-8");
        this.currentFile = filePath;
        this.isModified = false;
        this.sendToRenderer("load-file", { content, filePath });
        this.updateWindowTitle();
      } catch (error) {
        dialog.showErrorBox("Error", `Failed to open file: ${error.message}`);
      }
    }
  }

  async openFileDialog() {
    const result = await dialog.showOpenDialog(this.mainWindow, {
      properties: ["openFile"],
      filters: [
        { name: "Text Files", extensions: ["txt", "md", "markdown"] },
        { name: "All Files", extensions: ["*"] },
      ],
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      try {
        const content = await fs.readFile(filePath, "utf-8");
        this.currentFile = filePath;
        this.isModified = false;
        this.updateWindowTitle();
        return { content, filePath };
      } catch (error) {
        throw new Error(`Failed to open file: ${error.message}`);
      }
    }
    return null;
  }

  async saveFile() {
    this.sendToRenderer("request-save");
  }

  async saveFileContent(content) {
    if (!this.currentFile) {
      return await this.saveAsFileDialog(content);
    }

    try {
      await fs.writeFile(this.currentFile, content, "utf-8");
      this.isModified = false;
      this.updateWindowTitle();
      return { success: true, filePath: this.currentFile };
    } catch (error) {
      throw new Error(`Failed to save file: ${error.message}`);
    }
  }

  async saveAsFile() {
    this.sendToRenderer("request-save-as");
  }

  async saveAsFileDialog(content) {
    const result = await dialog.showSaveDialog(this.mainWindow, {
      filters: [
        { name: "Text Files", extensions: ["txt", "md", "markdown"] },
        { name: "All Files", extensions: ["*"] },
      ],
    });

    if (!result.canceled) {
      try {
        await fs.writeFile(result.filePath, content, "utf-8");
        this.currentFile = result.filePath;
        this.isModified = false;
        this.updateWindowTitle();
        return { success: true, filePath: result.filePath };
      } catch (error) {
        throw new Error(`Failed to save file: ${error.message}`);
      }
    }
    return null;
  }

  async confirmSave() {
    const result = await dialog.showMessageBox(this.mainWindow, {
      type: "warning",
      buttons: ["Save", "Don't Save", "Cancel"],
      defaultId: 0,
      message: "Do you want to save the changes to your document?",
      detail: "Your changes will be lost if you don't save them.",
    });

    switch (result.response) {
      case 0: // Save
        this.sendToRenderer("request-save");
        return "save";
      case 1: // Don't Save
        return "dont-save";
      case 2: // Cancel
      default:
        return "cancel";
    }
  }

  updateWindowTitle() {
    let title = "Writers CLI";

    if (this.currentProject) {
      const projectName = path.basename(this.currentProject);
      title = `${projectName} - Writers CLI`;
    }

    if (this.currentFile) {
      const fileName = path.basename(this.currentFile);
      title = `${fileName}${this.isModified ? " •" : ""} - ${title}`;
    } else if (this.isModified) {
      title = `Untitled • - ${title}`;
    }

    if (this.mainWindow) {
      this.mainWindow.setTitle(title);
    }
  }

  toggleDistractionFree() {
    this.sendToRenderer("toggle-distraction-free");
  }

  showAbout() {
    dialog.showMessageBox(this.mainWindow, {
      type: "info",
      title: "About Writers CLI",
      message: "Writers CLI",
      detail:
        "A comprehensive writing tool for novels and short stories.\n\nVersion 1.0.0\nBuilt with Electron and Node.js",
    });
  }

  async exit() {
    if (this.isModified) {
      const result = await this.confirmSave();
      if (result === "cancel") return;
    }
    app.quit();
  }
}

// Electron app event handlers
const writersGUI = new WritersGUI();

app.whenReady().then(() => {
  writersGUI.createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      writersGUI.createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Export for testing purposes
module.exports = WritersGUI;
