const blessed = require("blessed");
const fs = require("fs-extra");
const path = require("path");
const markdownUtils = require("../utils/markdown");
const EditorDialogs = require("./dialogs");

class BufferEditor {
  constructor() {
    this.screen = null;
    this.editor = null;
    this.statusBar = null;
    this.infoBar = null;
    this.helpBar = null;

    // File state
    this.currentFile = null;
    this.isDirty = false;

    // Editor mode state
    this.mode = "navigation"; // "navigation" or "insert"

    // Buffer state
    this.lines = [""];
    this.cursorX = 0;
    this.cursorY = 0;
    this.scrollY = 0;
    this.scrollX = 0;

    // Undo/Redo
    this.undoStack = [];
    this.redoStack = [];
    this.maxUndoLevels = 100;

    // Display state
    this.distraction_free = false;
    this.showLineNumbers = true;

    // Search state
    this.searchTerm = "";
    this.searchResults = [];
    this.currentSearchIndex = -1;

    // Cursor blinking state
    this.cursorVisible = true;
    this.cursorBlinkTimer = null;
    this.cursorBlinkInterval = 530; // milliseconds

    // Dialogs
    this.dialogs = null;

    // Configuration
    this.config = {
      autoSave: true,
      autoSaveInterval: 30000,
      showWordCount: true,
      showReadingTime: true,
      tabSize: 2,
      wrapText: false,
    };
  }

  async launch(filePath = null) {
    try {
      this.createScreen();
      this.createInterface();
      this.setupKeybindings();

      if (filePath) {
        await this.openFile(filePath);
      }

      this.render();
      this.updateStatus();

      // Initialize dialogs
      this.dialogs = new EditorDialogs(this.screen, this);

      // Auto-save timer
      if (this.config.autoSave) {
        this.autoSaveTimer = setInterval(() => {
          if (this.isDirty && this.currentFile) {
            this.saveFile();
          }
        }, this.config.autoSaveInterval);
      }

      // Start cursor blinking
      this.startCursorBlink();
    } catch (error) {
      console.error("Error launching editor:", error.message);
      process.exit(1);
    }
  }

  createScreen() {
    this.screen = blessed.screen({
      smartCSR: true,
      title: "Writers Editor",
      cursor: {
        artificial: false,
        shape: "line",
        blink: false,
      },
      debug: false,
    });

    this.screen.on("resize", () => {
      this.render();
    });
  }

  createInterface() {
    // Main editor area
    this.editor = blessed.box({
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
          border: { fg: "green" },
        },
      },
      keys: true,
      mouse: true,
      scrollable: false,
      alwaysScroll: false,
      tags: true,
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
    });

    // Info bar
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

    this.editor.focus();

    // Enable mouse support on screen and editor
    this.screen.enableMouse();
    this.editor.enableMouse();

    // Mouse click navigation
    this.editor.on("mouse", (data) => {
      if (
        (data.action === "mousedown" || data.action === "click") &&
        typeof data.x === "number" &&
        typeof data.y === "number"
      ) {
        // Calculate relative coordinates inside the editor box
        const editorLeft = this.editor.aleft || this.editor.left || 0;
        const editorTop = this.editor.atop || this.editor.top || 0;
        const x = data.x - editorLeft - 1; // -1 for border
        const y = data.y - editorTop - 1; // -1 for border

        // Clamp y to visible lines
        const visibleY = Math.max(0, Math.min(y, this.editor.height - 3)); // -3 for borders and bars
        const bufferY = this.scrollY + visibleY;
        if (bufferY >= 0 && bufferY < this.lines.length) {
          this.cursorY = bufferY;
          // Clamp x to line length
          const lineLength = this.lines[this.cursorY]
            ? this.lines[this.cursorY].length
            : 0;
          this.cursorX = Math.max(0, Math.min(x + this.scrollX, lineLength));
          this.render();
        }
      }
    });
  }

  setupKeybindings() {
    // Flag to prevent double processing of events
    this.processingKey = false;

    // File operations (work in both modes)
    this.screen.key(["C-s"], () => this.saveFile());
    this.screen.key(["C-o"], () => this.showOpenDialog());
    this.screen.key(["C-n"], () => this.newFile());
    this.screen.key(["C-x", "C-c"], () => this.exit());

    // Edit operations (work in both modes)
    this.screen.key(["C-z"], () => this.undo());
    this.screen.key(["C-y"], () => this.redo());
    this.screen.key(["C-a"], () => this.selectAll());

    // Search (work in both modes)
    this.screen.key(["C-f"], () => this.showFindDialog());
    this.screen.key(["C-r"], () => this.showReplaceDialog());
    this.screen.key(["C-g"], () => this.showGoToLineDialog());

    // View (work in both modes)
    this.screen.key(["C-w"], () => this.showWordCountDialog());
    this.screen.key(["f1"], () => this.showHelp());
    this.screen.key(["f11"], () => this.toggleDistractionFree());

    // Handle all character input and navigation
    this.screen.on("keypress", (ch, key) => {
      if (!key || this.processingKey) return;

      this.processingKey = true;

      try {
        // Handle escape key
        if (key.name === "escape") {
          this.setMode("navigation");
          return;
        }

        // Handle mode switching
        if (key.name === "i" && this.mode === "navigation") {
          this.setMode("insert");
          return;
        }

        // Handle navigation keys in navigation mode
        if (this.mode === "navigation") {
          switch (key.name) {
            case "w":
            case "k":
              this.moveCursor(0, -1);
              return;
            case "a":
            case "h":
              this.moveCursor(-1, 0);
              return;
            case "s":
            case "j":
              this.moveCursor(0, 1);
              return;
            case "d":
            case "l":
              this.moveCursor(1, 0);
              return;
          }
        }

        // Handle insert mode keys
        if (this.mode === "insert") {
          // Movement keys
          switch (key.name) {
            case "up":
              this.moveCursor(0, -1);
              return;
            case "down":
              this.moveCursor(0, 1);
              return;
            case "left":
              this.moveCursor(-1, 0);
              return;
            case "right":
              this.moveCursor(1, 0);
              return;
            case "home":
              this.moveCursorToLineStart();
              return;
            case "end":
              this.moveCursorToLineEnd();
              return;
            case "pageup":
              this.pageUp();
              return;
            case "pagedown":
              this.pageDown();
              return;
            case "enter":
              this.insertNewLine();
              return;
            case "backspace":
              this.backspace();
              return;
            case "delete":
              this.delete();
              return;
            case "tab":
              this.insertTab();
              return;
          }

          // Word navigation with Ctrl
          if (key.ctrl) {
            switch (key.name) {
              case "left":
                this.moveWordLeft();
                return;
              case "right":
                this.moveWordRight();
                return;
              case "home":
                this.moveCursorToDocStart();
                return;
              case "end":
                this.moveCursorToDocEnd();
                return;
            }
          }

          // Regular character input
          if (this.isRegularChar(ch, key)) {
            this.insertChar(ch);
          }
        }
      } finally {
        // Reset the flag after a small delay to allow for the current event to complete
        setTimeout(() => {
          this.processingKey = false;
        }, 0);
      }
    });
  }

  isRegularChar(ch, key) {
    if (!ch || !key) return false;
    if (key.ctrl || key.meta) return false;
    if (
      key.name === "enter" ||
      key.name === "backspace" ||
      key.name === "delete" ||
      key.name === "tab" ||
      key.name === "escape"
    )
      return false;
    if (
      key.name &&
      key.name.match(/^(up|down|left|right|home|end|pageup|pagedown)$/)
    )
      return false;
    if (key.name && key.name.match(/^f\d+$/)) return false;

    // In navigation mode, don't treat navigation keys as regular chars
    if (
      this.mode === "navigation" &&
      key.name &&
      ["w", "a", "s", "d", "h", "j", "k", "l", "i"].includes(key.name)
    ) {
      return false;
    }

    return ch.length === 1 && ch.charCodeAt(0) >= 32;
  }

  moveCursor(deltaX, deltaY) {
    const newY = Math.max(
      0,
      Math.min(this.lines.length - 1, this.cursorY + deltaY),
    );
    let newX = this.cursorX;

    if (deltaY !== 0) {
      // Moving vertically - clamp X to line length
      newX = Math.min(this.cursorX, this.lines[newY].length);
    } else {
      // Moving horizontally
      newX = this.cursorX + deltaX;

      // Handle line wrapping
      if (newX < 0 && newY > 0) {
        this.cursorY = newY - 1;
        this.cursorX = this.lines[this.cursorY].length;
        this.ensureCursorVisible();
        this.render();
        return;
      } else if (
        newX > this.lines[newY].length &&
        newY < this.lines.length - 1
      ) {
        this.cursorY = newY + 1;
        this.cursorX = 0;
        this.ensureCursorVisible();
        this.render();
        return;
      }

      newX = Math.max(0, Math.min(this.lines[newY].length, newX));
    }

    this.cursorX = newX;
    this.cursorY = newY;

    this.resetCursorBlink();
    this.ensureCursorVisible();
    this.render();
  }

  moveWordLeft() {
    if (this.cursorX === 0 && this.cursorY > 0) {
      this.moveCursor(0, -1);
      this.moveCursorToLineEnd();
      return;
    }

    const line = this.lines[this.cursorY];
    let x = this.cursorX - 1;

    // Skip whitespace
    while (x >= 0 && /\s/.test(line[x])) x--;

    // Skip word characters
    while (x >= 0 && !/\s/.test(line[x])) x--;

    this.cursorX = Math.max(0, x + 1);
    this.ensureCursorVisible();
    this.render();
  }

  moveWordRight() {
    const line = this.lines[this.cursorY];

    if (this.cursorX === line.length && this.cursorY < this.lines.length - 1) {
      this.moveCursor(0, 1);
      this.moveCursorToLineStart();
      return;
    }

    let x = this.cursorX;

    // Skip current word
    while (x < line.length && !/\s/.test(line[x])) x++;

    // Skip whitespace
    while (x < line.length && /\s/.test(line[x])) x++;

    this.cursorX = Math.min(line.length, x);
    this.ensureCursorVisible();
    this.render();
  }

  moveCursorToLineStart() {
    this.cursorX = 0;
    this.ensureCursorVisible();
    this.render();
  }

  moveCursorToLineEnd() {
    this.cursorX = this.lines[this.cursorY].length;
    this.ensureCursorVisible();
    this.render();
  }

  moveCursorToDocStart() {
    this.cursorX = 0;
    this.cursorY = 0;
    this.scrollX = 0;
    this.scrollY = 0;
    this.render();
  }

  moveCursorToDocEnd() {
    this.cursorY = this.lines.length - 1;
    this.cursorX = this.lines[this.cursorY].length;
    this.ensureCursorVisible();
    this.render();
  }

  pageUp() {
    const pageSize = this.getEditorHeight() - 2;
    this.moveCursor(0, -pageSize);
  }

  pageDown() {
    const pageSize = this.getEditorHeight() - 2;
    this.moveCursor(0, pageSize);
  }

  insertChar(ch) {
    this.pushUndo();

    const line = this.lines[this.cursorY];
    const newLine =
      line.substring(0, this.cursorX) + ch + line.substring(this.cursorX);
    this.lines[this.cursorY] = newLine;
    this.cursorX++;

    this.markDirty();
    this.resetCursorBlink();
    this.ensureCursorVisible();
    this.render();
    this.updateStatus();
  }

  insertNewLine() {
    this.pushUndo();

    const currentLine = this.lines[this.cursorY];
    const beforeCursor = currentLine.substring(0, this.cursorX);
    const afterCursor = currentLine.substring(this.cursorX);

    this.lines[this.cursorY] = beforeCursor;
    this.lines.splice(this.cursorY + 1, 0, afterCursor);

    this.cursorY++;
    this.cursorX = 0;

    this.markDirty();
    this.resetCursorBlink();
    this.ensureCursorVisible();
    this.render();
    this.updateStatus();
  }

  backspace() {
    if (this.cursorX === 0 && this.cursorY === 0) return;

    this.pushUndo();

    if (this.cursorX === 0) {
      // Beginning of line - merge with previous line
      const currentLine = this.lines[this.cursorY];
      const prevLine = this.lines[this.cursorY - 1];

      this.lines[this.cursorY - 1] = prevLine + currentLine;
      this.lines.splice(this.cursorY, 1);

      this.cursorY--;
      this.cursorX = prevLine.length;
    } else {
      // Middle of line - remove character before cursor
      const line = this.lines[this.cursorY];
      const newLine =
        line.substring(0, this.cursorX - 1) + line.substring(this.cursorX);
      this.lines[this.cursorY] = newLine;
      this.cursorX--;
    }

    this.markDirty();
    this.resetCursorBlink();
    this.ensureCursorVisible();
    this.render();
    this.updateStatus();
  }

  delete() {
    const line = this.lines[this.cursorY];

    if (this.cursorX === line.length && this.cursorY === this.lines.length - 1)
      return;

    this.pushUndo();

    if (this.cursorX === line.length) {
      // Join with next line
      const nextLine = this.lines[this.cursorY + 1];
      this.lines[this.cursorY] = line + nextLine;
      this.lines.splice(this.cursorY + 1, 1);
    } else {
      // Delete character at cursor
      this.lines[this.cursorY] =
        line.substring(0, this.cursorX) + line.substring(this.cursorX + 1);
    }

    this.markDirty();
    this.resetCursorBlink();
    this.render();
    this.updateStatus();
  }

  insertTab() {
    const spaces = " ".repeat(this.config.tabSize);
    for (let i = 0; i < spaces.length; i++) {
      this.insertChar(" ");
    }
  }

  ensureCursorVisible() {
    const editorHeight = this.getEditorHeight();
    const editorWidth = this.getEditorWidth();

    // Vertical scrolling
    if (this.cursorY < this.scrollY) {
      this.scrollY = this.cursorY;
    } else if (this.cursorY >= this.scrollY + editorHeight) {
      this.scrollY = this.cursorY - editorHeight + 1;
    }

    // Horizontal scrolling
    const displayX = this.cursorX + (this.showLineNumbers ? 5 : 0);
    if (displayX < this.scrollX) {
      this.scrollX = displayX;
    } else if (displayX >= this.scrollX + editorWidth) {
      this.scrollX = displayX - editorWidth + 1;
    }

    this.scrollY = Math.max(0, this.scrollY);
    this.scrollX = Math.max(0, this.scrollX);
  }

  getEditorHeight() {
    return this.editor.height - (this.editor.border ? 2 : 0);
  }

  getEditorWidth() {
    return this.editor.width - (this.editor.border ? 2 : 0);
  }

  render() {
    const editorHeight = this.getEditorHeight();
    const editorWidth = this.getEditorWidth();

    let content = "";

    for (let i = 0; i < editorHeight; i++) {
      const lineIndex = this.scrollY + i;
      let line = "";

      if (lineIndex < this.lines.length) {
        let lineContent = this.lines[lineIndex];

        // Add line numbers if enabled
        if (this.showLineNumbers) {
          const lineNum = (lineIndex + 1).toString().padStart(4, " ");
          line = `${lineNum} `;
        }

        // Apply horizontal scrolling
        const startX = Math.max(
          0,
          this.scrollX - (this.showLineNumbers ? 5 : 0),
        );
        lineContent = lineContent.substring(
          startX,
          startX + editorWidth - (this.showLineNumbers ? 5 : 0),
        );

        // Handle cursor rendering for this line
        const screenY = this.cursorY - this.scrollY;
        const cursorScreenX =
          this.cursorX - this.scrollX + (this.showLineNumbers ? 5 : 0);

        if (
          i === screenY &&
          this.cursorVisible &&
          cursorScreenX >= (this.showLineNumbers ? 5 : 0) &&
          cursorScreenX < editorWidth
        ) {
          // Insert visual cursor character
          const cursorPos = cursorScreenX - (this.showLineNumbers ? 5 : 0);
          const char =
            cursorPos < lineContent.length ? lineContent[cursorPos] : " ";
          // Create cursor by inverting the character at cursor position
          const beforeCursor = lineContent.substring(0, cursorPos);
          const afterCursor = lineContent.substring(cursorPos + 1);
          lineContent =
            beforeCursor + `{inverse}${char}{/inverse}` + afterCursor;
        }

        line += lineContent;
      } else if (this.showLineNumbers) {
        line = "     ";

        // Handle cursor on empty lines
        const screenY = this.cursorY - this.scrollY;
        const cursorScreenX =
          this.cursorX - this.scrollX + (this.showLineNumbers ? 5 : 0);

        if (i === screenY && this.cursorVisible && cursorScreenX === 5) {
          line += "{inverse} {/inverse}";
        }
      } else {
        // Handle cursor on empty lines without line numbers
        const screenY = this.cursorY - this.scrollY;
        const cursorScreenX = this.cursorX - this.scrollX;

        if (i === screenY && this.cursorVisible && cursorScreenX === 0) {
          line = "{inverse} {/inverse}";
        }
      }

      // Pad line to full width
      line = line.padEnd(editorWidth);

      content += line;
      if (i < editorHeight - 1) content += "\n";
    }

    this.editor.setContent(content);
    this.screen.render();
  }

  async openFile(filePath) {
    try {
      if (this.isDirty) {
        const save = await this.confirmSave();
        if (save === null) return;
      }

      const content = await fs.readFile(filePath, "utf8");
      this.lines = content.split("\n");
      if (this.lines.length === 0) this.lines = [""];

      this.currentFile = filePath;
      this.cursorX = 0;
      this.cursorY = 0;
      this.scrollX = 0;
      this.scrollY = 0;
      this.isDirty = false;

      this.resetCursorBlink();
      this.render();
      this.updateStatus();
      this.showMessage(`Opened: ${path.basename(filePath)}`);
    } catch (error) {
      this.showError(`Error opening file: ${error.message}`);
    }
  }

  async saveFile(filePath = null) {
    try {
      const targetPath = filePath || this.currentFile;

      if (!targetPath) {
        await this.showSaveAsDialog();
        return;
      }

      const content = this.lines.join("\n");
      await fs.writeFile(targetPath, content, "utf8");

      this.currentFile = targetPath;
      this.isDirty = false;

      this.updateStatus();
      this.showMessage(`Saved: ${path.basename(targetPath)}`);
    } catch (error) {
      this.showError(`Error saving file: ${error.message}`);
    }
  }

  newFile() {
    if (this.isDirty) {
      this.confirmSave().then((save) => {
        if (save !== null) {
          this.lines = [""];
          this.currentFile = null;
          this.cursorX = 0;
          this.cursorY = 0;
          this.scrollX = 0;
          this.scrollY = 0;
          this.isDirty = false;
          this.resetCursorBlink();
          this.render();
          this.updateStatus();
          this.showMessage("New file created");
        }
      });
    } else {
      this.lines = [""];
      this.currentFile = null;
      this.cursorX = 0;
      this.cursorY = 0;
      this.scrollX = 0;
      this.scrollY = 0;
      this.isDirty = false;
      this.resetCursorBlink();
      this.render();
      this.updateStatus();
      this.showMessage("New file created");
    }
  }

  pushUndo() {
    const state = {
      lines: this.lines.map((line) => line),
      cursorX: this.cursorX,
      cursorY: this.cursorY,
    };

    this.undoStack.push(state);
    if (this.undoStack.length > this.maxUndoLevels) {
      this.undoStack.shift();
    }

    this.redoStack = [];
  }

  undo() {
    if (this.undoStack.length === 0) return;

    const currentState = {
      lines: this.lines.map((line) => line),
      cursorX: this.cursorX,
      cursorY: this.cursorY,
    };
    this.redoStack.push(currentState);

    const prevState = this.undoStack.pop();
    this.lines = prevState.lines;
    this.cursorX = prevState.cursorX;
    this.cursorY = prevState.cursorY;

    this.resetCursorBlink();
    this.ensureCursorVisible();
    this.render();
    this.updateStatus();
    this.showMessage("Undo");
  }

  redo() {
    if (this.redoStack.length === 0) return;

    const currentState = {
      lines: this.lines.map((line) => line),
      cursorX: this.cursorX,
      cursorY: this.cursorY,
    };
    this.undoStack.push(currentState);

    const nextState = this.redoStack.pop();
    this.lines = nextState.lines;
    this.cursorX = nextState.cursorX;
    this.cursorY = nextState.cursorY;

    this.resetCursorBlink();
    this.ensureCursorVisible();
    this.render();
    this.updateStatus();
    this.showMessage("Redo");
  }

  markDirty() {
    this.isDirty = true;
  }

  updateStatus() {
    const fileName = this.currentFile
      ? path.basename(this.currentFile)
      : "Untitled";
    const dirtyFlag = this.isDirty ? "*" : "";
    const content = this.lines.join("\n");

    let status = ` ${fileName}${dirtyFlag}`;

    // Show current mode
    const modeText = this.mode === "navigation" ? "NAV" : "INS";
    status += ` | Mode: ${modeText}`;

    if (this.config.showWordCount) {
      const wordCount = markdownUtils.countWords(content);
      status += ` | Words: ${wordCount}`;
    }

    if (this.config.showReadingTime) {
      const readingTime = markdownUtils.estimateReadingTime(content);
      status += ` | Reading: ${readingTime}`;
    }

    status += ` | Line: ${this.cursorY + 1}, Col: ${this.cursorX + 1}`;
    status += ` | Lines: ${this.lines.length}`;

    this.statusBar.setContent(status);
    this.screen.render();
  }

  showMessage(message) {
    this.infoBar.setContent(` ${message}`);
    this.screen.render();

    setTimeout(() => {
      this.infoBar.setContent("");
      this.screen.render();
    }, 3000);
  }

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

  // Dialog methods
  async showOpenDialog() {
    const filePath = await this.dialogs.showOpenDialog();
    if (filePath) {
      await this.openFile(filePath);
    }
    this.editor.focus();
    this.render();
    this.showMessage("Redo");
  }

  async showSaveAsDialog() {
    const filePath = await this.dialogs.showSaveAsDialog(this.currentFile);
    if (filePath) {
      await this.saveFile(filePath);
    }
    this.editor.focus();
    this.render();
    this.showMessage("Undo");
  }

  async showFindDialog() {
    const searchTerm = await this.dialogs.showFindDialog();
    if (searchTerm) {
      this.findText(searchTerm);
    }
    this.editor.focus();
    this.render();
    this.showMessage("Undo");
  }

  async showReplaceDialog() {
    const result = await this.dialogs.showReplaceDialog();
    if (result && result.find) {
      this.replaceText(result.find, result.replace || "");
    }
    this.editor.focus();
    this.render();
    this.showMessage("Redo");
  }

  async showGoToLineDialog() {
    const lineNumber = await this.dialogs.showGoToLineDialog(this.lines.length);
    if (lineNumber) {
      this.goToLine(lineNumber);
    }
    this.editor.focus();
    this.render();
  }

  async showWordCountDialog() {
    const content = this.lines.join("\n");
    const stats = {
      words: markdownUtils.countWords(content),
      characters: content.length,
      charactersNoSpaces: content.replace(/\s/g, "").length,
      lines: this.lines.length,
      paragraphs: content.split(/\n\s*\n/).filter((p) => p.trim()).length,
      readingTime: markdownUtils.estimateReadingTime(content),
      currentLine: this.cursorY + 1,
      currentColumn: this.cursorX + 1,
    };

    await this.dialogs.showWordCountDialog(stats);
    this.editor.focus();
    this.render();
  }

  async showHelp() {
    await this.dialogs.showHelpDialog();
    this.editor.focus();
    this.render();
  }

  // Search functionality
  findText(searchTerm) {
    this.searchTerm = searchTerm;
    this.searchResults = [];
    this.currentSearchIndex = -1;

    if (!searchTerm) return;

    // Find all occurrences
    for (let lineIndex = 0; lineIndex < this.lines.length; lineIndex++) {
      const line = this.lines[lineIndex];
      let startIndex = 0;

      while (true) {
        const index = line
          .toLowerCase()
          .indexOf(searchTerm.toLowerCase(), startIndex);
        if (index === -1) break;

        this.searchResults.push({
          line: lineIndex,
          column: index,
          length: searchTerm.length,
        });

        startIndex = index + 1;
      }
    }

    if (this.searchResults.length > 0) {
      // Find the next result from current cursor position
      let nextIndex = this.searchResults.findIndex(
        (result) =>
          result.line > this.cursorY ||
          (result.line === this.cursorY && result.column >= this.cursorX),
      );

      if (nextIndex === -1) {
        nextIndex = 0; // Wrap to beginning
      }

      this.currentSearchIndex = nextIndex;
      this.jumpToSearchResult();
      this.showMessage(
        `Found ${this.searchResults.length} occurrences of "${searchTerm}"`,
      );
    } else {
      this.showMessage(`Not found: "${searchTerm}"`);
    }
  }

  jumpToSearchResult() {
    if (
      this.currentSearchIndex >= 0 &&
      this.currentSearchIndex < this.searchResults.length
    ) {
      const result = this.searchResults[this.currentSearchIndex];
      this.cursorY = result.line;
      this.cursorX = result.column;
      this.resetCursorBlink();
      this.ensureCursorVisible();
      this.render();
    }
  }

  replaceText(findText, replaceWith) {
    if (!findText) return;

    this.pushUndo();

    let replacements = 0;
    const regex = new RegExp(
      findText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "gi",
    );

    for (let i = 0; i < this.lines.length; i++) {
      const originalLine = this.lines[i];
      const newLine = originalLine.replace(regex, replaceWith);
      if (newLine !== originalLine) {
        this.lines[i] = newLine;
        replacements++;
      }
    }

    if (replacements > 0) {
      this.markDirty();
      this.render();
      this.updateStatus();
      this.showMessage(
        `Replaced ${replacements} occurrence(s) of "${findText}"`,
      );
    } else {
      this.showMessage(`Not found: "${findText}"`);
    }
  }

  goToLine(lineNumber) {
    if (lineNumber >= 1 && lineNumber <= this.lines.length) {
      this.cursorY = lineNumber - 1;
      this.cursorX = 0;
      this.resetCursorBlink();
      this.ensureCursorVisible();
      this.render();
      this.showMessage(`Jumped to line ${lineNumber}`);
    } else {
      this.showMessage(
        `Invalid line number. Document has ${this.lines.length} lines.`,
      );
    }
  }

  selectAll() {
    this.showMessage("Select all - implementation needed");
  }

  toggleDistractionFree() {
    this.distraction_free = !this.distraction_free;

    if (this.distraction_free) {
      this.statusBar.hide();
      this.infoBar.hide();
      this.helpBar.hide();
      this.editor.border = null;
      this.editor.top = 0;
      this.editor.bottom = 0;
      this.showLineNumbers = false;
    } else {
      this.statusBar.show();
      this.infoBar.show();
      this.helpBar.show();
      this.editor.border = { type: "line", fg: "blue" };
      this.editor.top = 0;
      this.editor.bottom = 3;
      this.showLineNumbers = true;
    }

    this.render();
    this.showMessage(
      `Distraction-free mode ${this.distraction_free ? "ON" : "OFF"}`,
    );
  }

  async confirmSave() {
    if (this.isDirty) {
      const result = await this.dialogs.showConfirmDialog(
        "File has unsaved changes. Do you want to save?",
        " Unsaved Changes ",
      );
      if (result === true) {
        await this.saveFile();
        return true;
      } else if (result === false) {
        return false;
      } else {
        return null; // Cancel
      }
    }
    return false;
  }

  async exit() {
    if (this.isDirty) {
      const save = await this.confirmSave();
      if (save === null) return; // Cancelled
    }

    this.stopCursorBlink();

    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }

    this.screen.destroy();
    process.exit();
  }

  startCursorBlink() {
    this.stopCursorBlink();
    this.cursorVisible = true;
    this.cursorBlinkTimer = setInterval(() => {
      this.cursorVisible = !this.cursorVisible;
      this.render();
    }, this.cursorBlinkInterval);
  }

  stopCursorBlink() {
    if (this.cursorBlinkTimer) {
      clearInterval(this.cursorBlinkTimer);
      this.cursorBlinkTimer = null;
    }
    this.cursorVisible = true;
  }

  resetCursorBlink() {
    this.stopCursorBlink();
    this.startCursorBlink();
  }

  /**
   * Set the editor mode
   */
  setMode(mode) {
    if (mode === "navigation" || mode === "insert") {
      this.mode = mode;
      this.updateStatus();
      this.render();
    }
  }

  /**
   * Get the current editor mode
   */
  getMode() {
    return this.mode;
  }
}

module.exports = BufferEditor;
