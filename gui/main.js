const { app, BrowserWindow, Menu, dialog, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs-extra");
const WritersEditor = require("../src/editor/index");

class WritersGUI {
  constructor() {
    this.mainWindow = null;
    this.editor = new WritersEditor();
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

    // Load the index.html of the app
    this.mainWindow.loadFile(path.join(__dirname, "renderer.html"));

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
    // File operations
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
    if (this.currentFile) {
      const fileName = path.basename(this.currentFile);
      title = `${fileName}${this.isModified ? " •" : ""} - Writers CLI`;
    } else if (this.isModified) {
      title = "Untitled • - Writers CLI";
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
