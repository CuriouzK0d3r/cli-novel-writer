const blessed = require("blessed");
const fs = require("fs-extra");
const path = require("path");
const chalk = require("chalk");
const markdownUtils = require("../utils/markdown");
const projectManager = require("../utils/project");

class WritersTextEditor {
  constructor() {
    this.screen = null;
    this.editor = null;
    this.statusBar = null;
    this.currentFile = null;
    this.originalContent = "";
    this.isDirty = false;
    this.wordCount = 0;
    this.characterCount = 0;
    this.readingTime = "";

    // Editor state
    this.undoStack = [];
    this.redoStack = [];
    this.searchMode = false;
    this.replaceMode = false;
    this.distraction_free = false;

    // Configuration
    this.config = {
      theme: "dark",
      autoSave: true,
      autoSaveInterval: 30000, // 30 seconds
      showWordCount: true,
      showReadingTime: true,
      wrapText: true,
      tabSize: 2,
    };
  }

  /**
   * Initialize and launch the editor
   */
  async launch(filePath = null) {
    try {
      this.createScreen();
      this.createInterface();
      this.setupKeybindings();

      if (filePath) {
        await this.openFile(filePath);
      } else {
        this.editor.setValue("");
        this.updateStatus();
      }

      this.screen.render();

      // Auto-save timer
      if (this.config.autoSave) {
        this.autoSaveTimer = setInterval(() => {
          if (this.isDirty && this.currentFile) {
            this.saveFile();
          }
        }, this.config.autoSaveInterval);
      }
    } catch (error) {
      console.error("Error launching editor:", error.message);
      process.exit(1);
    }
  }

  /**
   * Create the main screen
   */
  createScreen() {
    this.screen = blessed.screen({
      smartCSR: true,
      title: "Novel Editor",
      cursor: {
        artificial: true,
        shape: "line",
        blink: true,
        color: null,
      },
      debug: false,
    });

    // Handle screen resize
    this.screen.on("resize", () => {
      this.updateLayout();
    });
  }

  /**
   * Create the editor interface
   */
  createInterface() {
    // Main editor - using textarea for better text editing
    this.editor = blessed.textarea({
      parent: this.screen,
      top: 0,
      left: 0,
      right: 0,
      bottom: 3,
      border: {
        type: "line",
        fg: "blue",
      },
      style: {
        fg: "white",
        bg: "black",
        focus: {
          border: {
            fg: "green",
          },
        },
      },
      scrollable: true,
      alwaysScroll: true,
      mouse: true,
      keys: true,
      vi: false,
      wrap: this.config.wrapText,
      tags: false,
      inputOnFocus: true,
    });

    // Status bar
    this.statusBar = blessed.box({
      parent: this.screen,
      bottom: 2,
      left: 0,
      right: 0,
      height: 1,
      style: {
        fg: "white",
        bg: "blue",
      },
      content: " Ready",
    });

    // Command line / info bar
    this.infoBar = blessed.box({
      parent: this.screen,
      bottom: 1,
      left: 0,
      right: 0,
      height: 1,
      style: {
        fg: "yellow",
        bg: "black",
      },
    });

    // Help bar
    this.helpBar = blessed.box({
      parent: this.screen,
      bottom: 0,
      left: 0,
      right: 0,
      height: 1,
      style: {
        fg: "cyan",
        bg: "black",
      },
      content:
        " ^S Save  ^O Open  ^X Exit  ^F Find  ^G Go to Line  ^W Word Count  F1 Help",
    });

    // Focus on editor and make it editable
    this.editor.focus();
    this.editor.readInput();

    // Editor content change handler
    this.editor.on("keypress", (ch, key) => {
      // Skip control keys for content changes
      if (key && (key.ctrl || key.meta)) {
        return;
      }

      // Allow normal typing
      setTimeout(() => {
        this.markDirty();
        this.updateStats();
        this.updateStatus();
      }, 10);
    });

    // Handle value changes
    this.editor.on("submit", () => {
      // This fires when Enter is pressed
      this.markDirty();
      this.updateStats();
      this.updateStatus();
    });
  }

  /**
   * Setup keyboard shortcuts
   */
  setupKeybindings() {
    // Save file
    this.screen.key(["C-s"], async () => {
      await this.saveFile();
    });

    // Open file
    this.screen.key(["C-o"], () => {
      this.showOpenDialog();
    });

    // Exit
    this.screen.key(["C-x", "C-c"], async () => {
      await this.exit();
    });

    // Find
    this.screen.key(["C-f"], () => {
      this.showFindDialog();
    });

    // Replace
    this.screen.key(["C-r"], () => {
      this.showReplaceDialog();
    });

    // Go to line
    this.screen.key(["C-g"], () => {
      this.showGoToLineDialog();
    });

    // Word count
    this.screen.key(["C-w"], () => {
      this.showWordCountDialog();
    });

    // Help
    this.screen.key(["f1"], () => {
      this.showHelp();
    });

    // Undo
    this.screen.key(["C-z"], () => {
      this.undo();
    });

    // Redo
    this.screen.key(["C-y"], () => {
      this.redo();
    });

    // Toggle distraction-free mode
    this.screen.key(["f11"], () => {
      this.toggleDistractionFree();
    });

    // New file
    this.screen.key(["C-n"], () => {
      this.newFile();
    });

    // Select all
    this.screen.key(["C-a"], () => {
      this.selectAll();
    });
  }

  /**
   * Open a file
   */
  async openFile(filePath) {
    try {
      if (this.isDirty) {
        const save = await this.confirmSave();
        if (save === null) return; // Cancelled
      }

      const content = await fs.readFile(filePath, "utf8");
      this.currentFile = filePath;
      this.originalContent = content;
      this.editor.setValue(content);
      this.isDirty = false;
      this.updateStats();
      this.updateStatus();

      this.showMessage(`Opened: ${path.basename(filePath)}`);
    } catch (error) {
      this.showError(`Error opening file: ${error.message}`);
    }
  }

  /**
   * Save current file
   */
  async saveFile(filePath = null) {
    try {
      const targetPath = filePath || this.currentFile;

      if (!targetPath) {
        await this.showSaveAsDialog();
        return;
      }

      const content = this.editor.getValue();
      await fs.writeFile(targetPath, content, "utf8");

      this.currentFile = targetPath;
      this.originalContent = content;
      this.isDirty = false;
      this.updateStatus();

      this.showMessage(`Saved: ${path.basename(targetPath)}`);
    } catch (error) {
      this.showError(`Error saving file: ${error.message}`);
    }
  }

  /**
   * Create new file
   */
  newFile() {
    if (this.isDirty) {
      this.confirmSave().then((save) => {
        if (save !== null) {
          this.currentFile = null;
          this.editor.setValue("");
          this.originalContent = "";
          this.isDirty = false;
          this.updateStats();
          this.updateStatus();
          this.showMessage("New file created");
        }
      });
    } else {
      this.currentFile = null;
      this.editor.setValue("");
      this.originalContent = "";
      this.isDirty = false;
      this.updateStats();
      this.updateStatus();
      this.showMessage("New file created");
    }
  }

  /**
   * Mark content as dirty (modified)
   */
  markDirty() {
    if (!this.isDirty) {
      this.isDirty = true;
      this.pushUndo();
    }
  }

  /**
   * Update statistics
   */
  updateStats() {
    const content = this.editor.getValue();
    this.wordCount = markdownUtils.countWords(content);
    this.characterCount = content.length;
    this.readingTime = markdownUtils.estimateReadingTime(content);
  }

  /**
   * Update status bar
   */
  updateStatus() {
    const fileName = this.currentFile
      ? path.basename(this.currentFile)
      : "Untitled";
    const dirtyFlag = this.isDirty ? "*" : "";
    const content = this.editor.getValue();
    const lines = content.split("\n");
    const currentLine = lines.length;

    let status = ` ${fileName}${dirtyFlag}`;

    if (this.config.showWordCount) {
      status += ` | Words: ${this.wordCount}`;
    }

    if (this.config.showReadingTime) {
      status += ` | Reading: ${this.readingTime}`;
    }

    status += ` | Lines: ${currentLine}`;

    this.statusBar.setContent(status);
    this.screen.render();
  }

  /**
   * Show open file dialog
   */
  async showOpenDialog() {
    const dialog = blessed.prompt({
      parent: this.screen,
      top: "center",
      left: "center",
      width: 60,
      height: "shrink",
      border: {
        type: "line",
      },
      label: " Open File ",
      style: {
        fg: "white",
        bg: "black",
        border: {
          fg: "green",
        },
      },
    });

    dialog.input("Enter file path:", "", async (err, value) => {
      if (!err && value) {
        await this.openFile(value);
      }
      dialog.destroy();
      this.screen.render();
      this.editor.focus();
      this.editor.readInput();
    });
  }

  /**
   * Show save as dialog
   */
  async showSaveAsDialog() {
    const dialog = blessed.prompt({
      parent: this.screen,
      top: "center",
      left: "center",
      width: 60,
      height: "shrink",
      border: {
        type: "line",
      },
      label: " Save As ",
      style: {
        fg: "white",
        bg: "black",
        border: {
          fg: "green",
        },
      },
    });

    dialog.input(
      "Enter file path:",
      this.currentFile || "",
      async (err, value) => {
        if (!err && value) {
          await this.saveFile(value);
        }
        dialog.destroy();
        this.screen.render();
        this.editor.focus();
        this.editor.readInput();
      },
    );
  }

  /**
   * Show find dialog
   */
  showFindDialog() {
    const dialog = blessed.prompt({
      parent: this.screen,
      top: "center",
      left: "center",
      width: 60,
      height: "shrink",
      border: {
        type: "line",
      },
      label: " Find ",
      style: {
        fg: "white",
        bg: "black",
        border: {
          fg: "green",
        },
      },
    });

    dialog.input("Search for:", "", (err, value) => {
      if (!err && value) {
        this.findText(value);
      }
      dialog.destroy();
      this.screen.render();
      this.editor.focus();
      this.editor.readInput();
    });
  }

  /**
   * Show replace dialog
   */
  showReplaceDialog() {
    const dialog = blessed.prompt({
      parent: this.screen,
      top: "center",
      left: "center",
      width: 60,
      height: "shrink",
      border: {
        type: "line",
      },
      label: " Replace ",
      style: {
        fg: "white",
        bg: "black",
        border: {
          fg: "green",
        },
      },
    });

    dialog.input("Find:", "", (err, findValue) => {
      if (!err && findValue) {
        dialog.input("Replace with:", "", (err, replaceValue) => {
          if (!err) {
            this.replaceText(findValue, replaceValue || "");
          }
          dialog.destroy();
          this.screen.render();
          this.editor.focus();
          this.editor.readInput();
        });
      } else {
        dialog.destroy();
        this.screen.render();
        this.editor.focus();
        this.editor.readInput();
      }
    });
  }

  /**
   * Show go to line dialog
   */
  showGoToLineDialog() {
    const dialog = blessed.prompt({
      parent: this.screen,
      top: "center",
      left: "center",
      width: 40,
      height: "shrink",
      border: {
        type: "line",
      },
      label: " Go to Line ",
      style: {
        fg: "white",
        bg: "black",
        border: {
          fg: "green",
        },
      },
    });

    dialog.input("Line number:", "", (err, value) => {
      if (!err && value) {
        const lineNum = parseInt(value);
        if (!isNaN(lineNum)) {
          this.goToLine(lineNum);
        }
      }
      dialog.destroy();
      this.screen.render();
      this.editor.focus();
      this.editor.readInput();
    });
  }

  /**
   * Show word count dialog with detailed stats
   */
  showWordCountDialog() {
    const content = this.editor.getValue();
    const words = markdownUtils.countWords(content);
    const characters = content.length;
    const charactersNoSpaces = content.replace(/\s/g, "").length;
    const lines = content.split("\n").length;
    const paragraphs = content.split(/\n\s*\n/).filter((p) => p.trim()).length;
    const readingTime = markdownUtils.estimateReadingTime(content);

    const stats = `
Word Count: ${words}
Characters: ${characters}
Characters (no spaces): ${charactersNoSpaces}
Lines: ${lines}
Paragraphs: ${paragraphs}
Reading Time: ${readingTime}
    `.trim();

    const dialog = blessed.message({
      parent: this.screen,
      top: "center",
      left: "center",
      width: 50,
      height: "shrink",
      border: {
        type: "line",
      },
      label: " Document Statistics ",
      style: {
        fg: "white",
        bg: "black",
        border: {
          fg: "green",
        },
      },
    });

    dialog.display(stats, 0, () => {
      this.editor.focus();
      this.editor.readInput();
    });
  }

  /**
   * Show help dialog
   */
  showHelp() {
    const helpText = `
NOVEL EDITOR HELP

File Operations:
  Ctrl+N    - New file
  Ctrl+O    - Open file
  Ctrl+S    - Save file
  Ctrl+X    - Exit

Editing:
  Ctrl+Z    - Undo
  Ctrl+Y    - Redo
  Ctrl+A    - Select all
  Ctrl+F    - Find text
  Ctrl+R    - Replace text
  Ctrl+G    - Go to line

View:
  F11       - Toggle distraction-free mode
  Ctrl+W    - Show word count and statistics

Navigation:
  Arrow keys - Move cursor
  Page Up/Down - Scroll page
  Home/End  - Beginning/end of line
  Ctrl+Home/End - Beginning/end of document

Writing Features:
  - Auto-save every 30 seconds
  - Real-time word count
  - Reading time estimation
  - Markdown support
  - Distraction-free mode

Press any key to close this help.
    `.trim();

    const dialog = blessed.message({
      parent: this.screen,
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      border: {
        type: "line",
      },
      label: " Help ",
      style: {
        fg: "white",
        bg: "black",
        border: {
          fg: "green",
        },
      },
    });

    dialog.display(helpText, 0, () => {
      this.editor.focus();
      this.editor.readInput();
    });
  }

  /**
   * Find text in editor
   */
  findText(searchTerm) {
    const content = this.editor.getValue();
    const index = content.toLowerCase().indexOf(searchTerm.toLowerCase());

    if (index !== -1) {
      // Calculate line and column
      const beforeText = content.substring(0, index);
      const line = (beforeText.match(/\n/g) || []).length;

      this.goToLine(line + 1);
      this.showMessage(`Found: ${searchTerm}`);
    } else {
      this.showMessage(`Not found: ${searchTerm}`);
    }
  }

  /**
   * Replace text in editor
   */
  replaceText(findText, replaceWith) {
    let content = this.editor.getValue();
    const regex = new RegExp(
      findText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "gi",
    );
    const matches = content.match(regex);

    if (matches) {
      content = content.replace(regex, replaceWith);
      this.editor.setValue(content);
      this.markDirty();
      this.updateStats();
      this.updateStatus();
      this.showMessage(`Replaced ${matches.length} occurrence(s)`);
    } else {
      this.showMessage(`Not found: ${findText}`);
    }
  }

  /**
   * Go to specific line
   */
  goToLine(lineNumber) {
    const content = this.editor.getValue();
    const lines = content.split("\n");

    if (lineNumber > 0 && lineNumber <= lines.length) {
      // For blessed textarea, we can't easily position cursor
      // but we can at least validate and give feedback
      this.editor.focus();
      this.showMessage(
        `Line ${lineNumber} of ${lines.length} (use arrow keys to navigate)`,
      );
    } else {
      this.showMessage(
        `Invalid line number. Document has ${lines.length} lines.`,
      );
    }
  }

  /**
   * Undo last action
   */
  undo() {
    if (this.undoStack.length > 0) {
      const currentContent = this.editor.getValue();
      this.redoStack.push(currentContent);

      const previousContent = this.undoStack.pop();
      this.editor.setValue(previousContent);
      this.updateStats();
      this.updateStatus();
      this.showMessage("Undo");
    }
  }

  /**
   * Redo last undone action
   */
  redo() {
    if (this.redoStack.length > 0) {
      const currentContent = this.editor.getValue();
      this.undoStack.push(currentContent);

      const nextContent = this.redoStack.pop();
      this.editor.setValue(nextContent);
      this.updateStats();
      this.updateStatus();
      this.showMessage("Redo");
    }
  }

  /**
   * Push current content to undo stack
   */
  pushUndo() {
    const content = this.editor.getValue();
    this.undoStack.push(content);

    // Limit undo stack size
    if (this.undoStack.length > 50) {
      this.undoStack.shift();
    }

    // Clear redo stack on new action
    this.redoStack = [];
  }

  /**
   * Toggle distraction-free mode
   */
  toggleDistractionFree() {
    this.distraction_free = !this.distraction_free;

    if (this.distraction_free) {
      this.statusBar.hide();
      this.infoBar.hide();
      this.helpBar.hide();
      this.editor.style.border.type = "none";
      this.editor.top = 0;
      this.editor.bottom = 0;
      this.showMessage("Distraction-free mode ON");
    } else {
      this.statusBar.show();
      this.infoBar.show();
      this.helpBar.show();
      this.editor.style.border.type = "line";
      this.editor.top = 0;
      this.editor.bottom = 3;
      this.showMessage("Distraction-free mode OFF");
    }

    this.screen.render();
  }

  /**
   * Select all text
   */
  selectAll() {
    // For blessed textarea, we can simulate select all by giving feedback
    const content = this.editor.getValue();
    this.showMessage(`Document selected (${content.length} characters)`);
  }

  /**
   * Update layout on screen resize
   */
  updateLayout() {
    if (!this.distraction_free) {
      this.editor.bottom = 3;
    } else {
      this.editor.bottom = 0;
    }
    this.screen.render();
  }

  /**
   * Show message in info bar
   */
  showMessage(message) {
    this.infoBar.setContent(` ${message}`);
    this.screen.render();

    // Clear message after 3 seconds
    setTimeout(() => {
      this.infoBar.setContent("");
      this.screen.render();
    }, 3000);
  }

  /**
   * Show error message
   */
  showError(message) {
    this.infoBar.style.fg = "red";
    this.infoBar.setContent(` ERROR: ${message}`);
    this.screen.render();

    setTimeout(() => {
      this.infoBar.style.fg = "yellow";
      this.infoBar.setContent("");
      this.screen.render();
    }, 5000);
  }

  /**
   * Confirm save dialog
   */
  async confirmSave() {
    return new Promise((resolve) => {
      const dialog = blessed.question({
        parent: this.screen,
        top: "center",
        left: "center",
        width: 60,
        height: "shrink",
        border: {
          type: "line",
        },
        label: " Unsaved Changes ",
        style: {
          fg: "white",
          bg: "black",
          border: {
            fg: "yellow",
          },
        },
      });

      dialog.ask("Save changes? (y/n/c)", (err, value) => {
        if (err) {
          resolve(null);
        } else {
          const response = value.toLowerCase();
          if (response === "y" || response === "yes") {
            this.saveFile().then(() => resolve(true));
          } else if (response === "n" || response === "no") {
            resolve(false);
          } else {
            resolve(null); // Cancel
          }
        }
        dialog.destroy();
        this.screen.render();
        this.editor.focus();
        this.editor.readInput();
      });
    });
  }

  /**
   * Exit the editor
   */
  async exit() {
    if (this.isDirty) {
      const save = await this.confirmSave();
      if (save === null) return; // Cancelled
    }

    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }

    this.screen.destroy();
    process.exit(0);
  }
}

module.exports = WritersTextEditor;
