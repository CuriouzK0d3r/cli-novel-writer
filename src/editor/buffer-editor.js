const blessed = require("blessed");
const fs = require("fs").promises;
const path = require("path");
const markdownUtils = require("../utils/markdown");
const EditorDialogs = require("./dialogs");
const Clipboard = require("./clipboard");
const { ThemeManager } = require("./themes");
const PomodoroTimer = require("./pomodoro-timer");

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

    // Pomodoro timer
    this.pomodoroTimer = new PomodoroTimer();
    this.setupPomodoroCallbacks();

    // Typewriter mode state
    this.typewriterMode = false;
    this.typewriterTargetLine = null; // Target line position for typewriter mode
    this.lastCursorY = 0; // Track cursor movement direction
    this.typewriterFocusLines = 1; // Number of lines before/after cursor to keep in focus

    // Text selection state
    this.selecting = false;
    this.selectionStart = { x: 0, y: 0 };
    this.selectionEnd = { x: 0, y: 0 };
    this.clipboard = new Clipboard();

    // Configuration
    this.config = {
      autoSave: true,
      autoSaveInterval: 30000,
      showWordCount: true,
      showReadingTime: true,
      tabSize: 2,
      wrapText: false,
      typewriterMode: false,
      typewriterPosition: 0.66, // Position as ratio of screen height (0.66 = 2/3 down)
      typewriterFocusLines: 1, // Number of lines before/after cursor to keep in focus
    };

    // Theme system
    this.themeManager = new ThemeManager();
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

      // Initialize typewriter mode from config
      try {
        const projectManager = require("../utils/project");
        if (projectManager.isWritersProject()) {
          const config = await projectManager.getConfig();
          this.typewriterMode =
            config.settings?.editor?.typewriterMode ||
            this.config.typewriterMode ||
            false;
          this.typewriterFocusLines =
            config.settings?.editor?.typewriterFocusLines ||
            this.config.typewriterFocusLines ||
            1;
        } else {
          this.typewriterMode = this.config.typewriterMode || false;
          this.typewriterFocusLines = this.config.typewriterFocusLines || 1;
        }
      } catch (error) {
        this.typewriterMode = this.config.typewriterMode || false;
        this.typewriterFocusLines = this.config.typewriterFocusLines || 1;
      }

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
    const screenConfig = this.themeManager.getScreenConfig();
    this.screen = blessed.screen(screenConfig);

    this.screen.on("resize", () => {
      this.render();
    });
  }

  createInterface() {
    const styles = this.themeManager.getComponentStyles();

    // Main editor area
    this.editor = blessed.box({
      parent: this.screen,
      top: 0,
      left: 0,
      right: 0,
      bottom: 3,
      border: styles.editor.border,
      style: styles.editor,
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
      style: styles.statusBar,
    });

    // Info bar
    this.infoBar = blessed.box({
      parent: this.screen,
      bottom: 1,
      left: 0,
      right: 0,
      height: 1,
      style: styles.infoBar,
    });

    // Help bar
    this.helpBar = blessed.box({
      parent: this.screen,
      bottom: 0,
      left: 0,
      right: 0,
      height: 1,
      style: styles.helpBar,
      content:
        " ^S Save  ^O Open  ^X Exit  ^F Find  ^G Go  ^W Stats  ^T Notes  F1 Help  F3/^P Timer",
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
    this.screen.key(["C-c"], () => this.copySelection());
    this.screen.key(["C-v"], () => this.pasteFromClipboard());
    this.screen.key(["C-x"], () => this.cutSelection());
    this.screen.key(["C-S-k"], () => this.deleteLine());

    // Search (work in both modes)
    this.screen.key(["C-f"], () => this.showFindDialog());
    this.screen.key(["C-r"], () => this.showReplaceDialog());
    this.screen.key(["C-g"], () => this.showGoToLineDialog());

    // View (work in both modes)
    this.screen.key(["C-w"], () => this.showWordCountDialog());
    this.screen.key(["f1"], () => this.showHelp());
    this.screen.key(["f2"], () => this.switchTheme());
    this.screen.key(["f11"], () => this.toggleDistractionFree());
    this.screen.key(["f9"], async () => await this.toggleTypewriterMode());

    // Notes toggle (work in both modes)
    this.screen.key(["C-t"], async () => await this.toggleNotes());

    // Pomodoro timer controls (work in both modes)
    this.screen.key(["f3"], () => this.togglePomodoroTimer());
    this.screen.key(["C-p"], () => this.togglePomodoroTimer()); // Alternative to F3
    this.screen.key(["f4"], () => this.showPomodoroDialog());
    this.screen.key(["C-S-p"], () => this.showPomodoroDialog()); // Alternative to F4
    this.screen.key(["S-f3"], () => this.resetPomodoroTimer());
    // Note: C-r is already used for Replace dialog, using only Shift+F3 for reset

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
            case "up":
              this.moveCursor(0, -1, key.shift);
              return;
            case "a":
            case "h":
            case "left":
              this.moveCursor(-1, 0, key.shift);
              return;
            case "s":
            case "j":
            case "down":
              this.moveCursor(0, 1, key.shift);
              return;
            case "d":
            case "l":
            case "right":
              this.moveCursor(1, 0, key.shift);
              return;
            case "home":
              this.moveCursorToLineStart(key.shift);
              return;
            case "end":
              this.moveCursorToLineEnd(key.shift);
              return;
            case "pageup":
              this.pageUp();
              return;
            case "pagedown":
              this.pageDown();
              return;
          }

          // Word navigation with Ctrl in navigation mode
          if (key.ctrl) {
            switch (key.name) {
              case "left":
                this.moveWordLeft(key.shift);
                return;
              case "right":
                this.moveWordRight(key.shift);
                return;
              case "home":
                this.moveCursorToDocStart(key.shift);
                return;
              case "end":
                this.moveCursorToDocEnd(key.shift);
                return;
            }
          }
        }

        // Handle insert mode keys
        if (this.mode === "insert") {
          // Movement keys
          switch (key.name) {
            case "up":
              this.moveCursor(0, -1, key.shift);
              return;
            case "down":
              this.moveCursor(0, 1, key.shift);
              return;
            case "left":
              this.moveCursor(-1, 0, key.shift);
              return;
            case "right":
              this.moveCursor(1, 0, key.shift);
              return;
            case "home":
              this.moveCursorToLineStart(key.shift);
              return;
            case "end":
              this.moveCursorToLineEnd(key.shift);
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
                this.moveWordLeft(key.shift);
                return;
              case "right":
                this.moveWordRight(key.shift);
                return;
              case "home":
                this.moveCursorToDocStart(key.shift);
                return;
              case "end":
                this.moveCursorToDocEnd(key.shift);
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

  moveCursor(deltaX, deltaY, extend = false) {
    if (extend && !this.selecting) {
      this.startSelection();
    } else if (!extend) {
      this.clearSelection();
    }

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
        if (extend) {
          this.updateSelection();
        }
        this.ensureCursorVisible();
        this.render();
        return;
      } else if (
        newX > this.lines[newY].length &&
        newY < this.lines.length - 1
      ) {
        this.cursorY = newY + 1;
        this.cursorX = 0;
        if (extend) {
          this.updateSelection();
        }
        this.ensureCursorVisible();
        this.render();
        return;
      }

      newX = Math.max(0, Math.min(this.lines[newY].length, newX));
    }

    this.cursorX = newX;
    this.cursorY = newY;

    if (extend) {
      this.updateSelection();
    }

    this.resetCursorBlink();
    this.ensureCursorVisible();
    this.render();
  }

  moveWordLeft(extend = false) {
    if (extend && !this.selecting) {
      this.startSelection();
    } else if (!extend) {
      this.clearSelection();
    }

    if (this.cursorX === 0 && this.cursorY > 0) {
      this.moveCursor(0, -1, extend);
      this.moveCursorToLineEnd(extend);
      return;
    }

    const line = this.lines[this.cursorY];
    let x = this.cursorX - 1;

    // Skip whitespace
    while (x >= 0 && /\s/.test(line[x])) x--;

    // Skip word characters
    while (x >= 0 && !/\s/.test(line[x])) x--;

    this.cursorX = Math.max(0, x + 1);

    if (extend) {
      this.updateSelection();
    }

    this.ensureCursorVisible();
    this.render();
  }

  moveWordRight(extend = false) {
    if (extend && !this.selecting) {
      this.startSelection();
    } else if (!extend) {
      this.clearSelection();
    }

    const line = this.lines[this.cursorY];

    if (this.cursorX === line.length && this.cursorY < this.lines.length - 1) {
      this.moveCursor(0, 1, extend);
      this.moveCursorToLineStart(extend);
      return;
    }

    let x = this.cursorX;

    // Skip whitespace
    while (x < line.length && /\s/.test(line[x])) x++;

    // Skip word characters
    while (x < line.length && !/\s/.test(line[x])) x++;

    this.cursorX = Math.min(line.length, x);

    if (extend) {
      this.updateSelection();
    }

    this.ensureCursorVisible();
    this.render();
  }

  moveCursorToLineStart(extend = false) {
    if (extend && !this.selecting) {
      this.startSelection();
    } else if (!extend) {
      this.clearSelection();
    }

    this.cursorX = 0;

    if (extend) {
      this.updateSelection();
    }

    this.render();
  }

  moveCursorToLineEnd(extend = false) {
    if (extend && !this.selecting) {
      this.startSelection();
    } else if (!extend) {
      this.clearSelection();
    }

    this.cursorX = this.lines[this.cursorY].length;

    if (extend) {
      this.updateSelection();
    }

    this.render();
  }

  moveCursorToDocStart(extend = false) {
    if (extend && !this.selecting) {
      this.startSelection();
    } else if (!extend) {
      this.clearSelection();
    }

    this.cursorX = 0;
    this.cursorY = 0;
    this.scrollY = 0;
    this.scrollX = 0;

    if (extend) {
      this.updateSelection();
    }

    this.render();
  }

  moveCursorToDocEnd(extend = false) {
    if (extend && !this.selecting) {
      this.startSelection();
    } else if (!extend) {
      this.clearSelection();
    }

    this.cursorY = this.lines.length - 1;
    this.cursorX = this.lines[this.cursorY].length;

    if (extend) {
      this.updateSelection();
    }

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

  deleteLine() {
    // Don't delete if there's only one line and it's empty
    if (this.lines.length === 1 && this.lines[0] === "") {
      return;
    }

    this.pushUndo();

    // If there's only one line, clear it
    if (this.lines.length === 1) {
      this.lines[0] = "";
      this.cursorX = 0;
    } else {
      // Remove the current line
      this.lines.splice(this.cursorY, 1);

      // Adjust cursor position
      if (this.cursorY >= this.lines.length) {
        this.cursorY = this.lines.length - 1;
      }

      // Ensure cursor X is within the line bounds
      const currentLine = this.lines[this.cursorY];
      if (this.cursorX > currentLine.length) {
        this.cursorX = currentLine.length;
      }
    }

    this.markDirty();
    this.resetCursorBlink();
    this.ensureCursorVisible();
    this.render();
    this.updateStatus();
  }

  ensureCursorVisible() {
    const editorHeight = this.getEditorHeight();
    const editorWidth = this.getEditorWidth();

    // Typewriter mode: keep cursor at a fixed position on screen
    if (this.typewriterMode) {
      const targetLine = Math.floor(
        editorHeight * this.config.typewriterPosition,
      );

      // Calculate desired scroll position to keep cursor at target line
      const desiredScrollY = this.cursorY - targetLine;

      // Only apply typewriter positioning when moving down (typing forward)
      // or when the cursor would go off screen
      const movingDown = this.cursorY > this.lastCursorY;
      const cursorOffScreen =
        this.cursorY < this.scrollY ||
        this.cursorY >= this.scrollY + editorHeight;

      if (movingDown || cursorOffScreen) {
        this.scrollY = Math.max(0, desiredScrollY);
      }
    } else {
      // Normal scrolling behavior
      if (this.cursorY < this.scrollY) {
        this.scrollY = this.cursorY;
      } else if (this.cursorY >= this.scrollY + editorHeight) {
        this.scrollY = this.cursorY - editorHeight + 1;
      }
    }

    // Horizontal scrolling (same for both modes)
    const displayX = this.cursorX + (this.showLineNumbers ? 5 : 0);
    if (displayX < this.scrollX) {
      this.scrollX = displayX;
    } else if (displayX >= this.scrollX + editorWidth) {
      this.scrollX = displayX - editorWidth + 1;
    }

    this.scrollY = Math.max(0, this.scrollY);
    this.scrollX = Math.max(0, this.scrollX);

    // Update last cursor position for typewriter mode
    this.lastCursorY = this.cursorY;
  }

  getEditorHeight() {
    if (!this.editor) return 20; // Default height when editor not initialized
    return this.editor.height - (this.editor.border ? 2 : 0);
  }

  getEditorWidth() {
    if (!this.editor) return 80; // Default width when editor not initialized
    return this.editor.width - (this.editor.border ? 2 : 0);
  }

  render() {
    // Guard against rendering when editor is not initialized
    if (!this.editor || !this.screen) {
      return;
    }

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

        // Apply syntax highlighting first
        lineContent = this.themeManager.applySyntaxHighlighting(
          lineContent,
          "markdown",
        );

        // Apply text selection highlighting
        if (this.hasSelection()) {
          lineContent = this.applySelectionHighlight(
            lineContent,
            lineIndex,
            startX,
          );
        }

        // Check if this line should be dimmed in typewriter mode
        const shouldDimLine =
          this.typewriterMode &&
          (lineIndex < this.cursorY - this.typewriterFocusLines ||
            lineIndex > this.cursorY + this.typewriterFocusLines);

        // Apply dimming to the line content if needed
        if (shouldDimLine) {
          lineContent = this.themeManager.formatText(lineContent, "dimmed");
        }

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

          // Different cursor styles for different modes
          const beforeCursor = lineContent.substring(0, cursorPos);
          const afterCursor = lineContent.substring(cursorPos);

          if (this.mode === "insert") {
            // Line cursor for insert mode - use theme cursor
            const cursor = this.themeManager.getCursor("insert");
            lineContent = beforeCursor + cursor + afterCursor;
          } else {
            // Block cursor for navigation mode - use theme cursor
            const cursor = this.themeManager.getCursor("normal", char);
            const afterChar = lineContent.substring(cursorPos + 1);
            lineContent = beforeCursor + cursor + afterChar;
          }
        }

        line += lineContent;
      } else if (this.showLineNumbers) {
        line = "     ";

        // Check if this empty line should be dimmed in typewriter mode
        const shouldDimLine =
          this.typewriterMode &&
          (lineIndex < this.cursorY - this.typewriterFocusLines ||
            lineIndex > this.cursorY + this.typewriterFocusLines);

        // Handle cursor on empty lines
        const screenY = this.cursorY - this.scrollY;
        const cursorScreenX =
          this.cursorX - this.scrollX + (this.showLineNumbers ? 5 : 0);

        if (i === screenY && this.cursorVisible && cursorScreenX === 5) {
          const cursor = this.themeManager.getCursor(this.mode);
          line += cursor;
        } else if (shouldDimLine) {
          line += this.themeManager.formatText(" ", "dimmed");
        }
      } else {
        // Check if this empty line should be dimmed in typewriter mode
        const shouldDimLine =
          this.typewriterMode &&
          (lineIndex < this.cursorY - this.typewriterFocusLines ||
            lineIndex > this.cursorY + this.typewriterFocusLines);

        // Handle cursor on empty lines without line numbers
        const screenY = this.cursorY - this.scrollY;
        const cursorScreenX = this.cursorX - this.scrollX;

        if (i === screenY && this.cursorVisible && cursorScreenX === 0) {
          const cursor = this.themeManager.getCursor(this.mode);
          line = cursor;
        } else if (shouldDimLine) {
          line = this.themeManager.formatText(" ", "dimmed");
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

  async toggleNotes() {
    if (!this.currentFile) {
      this.showError("Save the current file first to create associated notes");
      return;
    }

    try {
      const currentPath = this.currentFile;
      const isNotesFile = this.isNotesFile(currentPath);

      if (isNotesFile) {
        // Currently viewing notes, switch back to story
        const storyPath = await this.getStoryPathFromNotes(currentPath);
        if (await this.fileExists(storyPath)) {
          await this.openFile(storyPath);
          this.showMessage(`Switched to story: ${path.basename(storyPath)}`);
        } else {
          this.showError("Original story file not found");
        }
      } else {
        // Currently viewing story, switch to notes
        const notesPath = this.getNotesPathFromStory(currentPath);

        // Create notes file if it doesn't exist
        if (!(await this.fileExists(notesPath))) {
          await this.createNotesFile(notesPath, currentPath);
        }

        await this.openFile(notesPath);
        this.showMessage(`Switched to notes: ${path.basename(notesPath)}`);
      }
    } catch (error) {
      this.showError(`Error switching to notes: ${error.message}`);
    }
  }

  isNotesFile(filePath) {
    return filePath.includes("-notes.md") || filePath.startsWith("notes/");
  }

  getNotesPathFromStory(storyPath) {
    const dir = path.dirname(storyPath);
    const name = path.basename(storyPath, path.extname(storyPath));

    // For simplified structure, put notes in notes/ directory
    if (dir === "drafts" || dir === "finished") {
      return path.join("notes", `${name}-notes.md`);
    }

    // For other structures, put notes alongside the file
    return path.join(dir, `${name}-notes.md`);
  }

  async getStoryPathFromNotes(notesPath) {
    const dir = path.dirname(notesPath);
    const name = path.basename(notesPath, "-notes.md");

    // Look for story in common locations
    const possiblePaths = [
      path.join("drafts", `${name}.md`),
      path.join("finished", `${name}.md`),
      path.join("stories", `${name}.md`),
      path.join("shortstories", `${name}.md`),
      path.join(dir, `${name}.md`),
      path.join(dir, `${name}.txt`),
    ];

    // Find the first path that actually exists
    for (const possiblePath of possiblePaths) {
      if (await this.fileExists(possiblePath)) {
        return possiblePath;
      }
    }

    // If no existing file found, return the most likely location
    return possiblePaths[0];
  }

  async createNotesFile(notesPath, storyPath) {
    const storyName = path
      .basename(storyPath, path.extname(storyPath))
      .replace(/-/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());

    const content = `# Notes for "${storyName}"

*Created: ${new Date().toLocaleDateString()}*
*Story: ${path.basename(storyPath)}*

## Plot Ideas

## Character Notes

## Research

## Revision Notes

## Random Thoughts

---

Press Ctrl+T to switch back to your story.
`;

    // Ensure notes directory exists
    await fs.mkdir(path.dirname(notesPath), { recursive: true });
    await fs.writeFile(notesPath, content);
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
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
    const fileName = this.currentFile ? path.basename(this.currentFile) : null;
    const content = this.lines.join("\n");
    const wordCount = this.config.showWordCount
      ? markdownUtils.countWords(content)
      : null;

    // Create editor state object for themed status bar
    const editorState = {
      mode: this.mode,
      line: this.cursorY + 1,
      col: this.cursorX + 1,
      filename: fileName,
      modified: this.isDirty,
      wordCount: wordCount,
      totalLines: this.lines.length,
      typewriterMode: this.typewriterMode,
      pomodoro: this.pomodoroTimer.getStatus(),
    };

    // Get themed status bar content
    const status = this.themeManager.getStatusBarContent(editorState);
    this.statusBar.setContent(` ${status}`);
    this.screen.render();
  }

  showMessage(message, type = "info") {
    // Guard against showing messages when editor is not initialized
    if (!this.infoBar || !this.screen) {
      return;
    }

    const themedMessage = this.themeManager.formatText(message, type);
    this.infoBar.setContent(` ${themedMessage}`);
    this.screen.render();

    setTimeout(() => {
      if (this.infoBar && this.screen) {
        this.infoBar.setContent("");
        this.screen.render();
      }
    }, 3000);
  }

  showError(message) {
    const themedMessage = this.themeManager.formatText(message, "error");
    this.infoBar.setContent(` ERROR: ${themedMessage}`);
    this.screen.render();

    setTimeout(() => {
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
    if (this.lines.length === 0) {
      this.showMessage("No text to select");
      return;
    }

    this.selecting = true;
    this.selectionStart = { x: 0, y: 0 };
    this.selectionEnd = {
      x: this.lines[this.lines.length - 1].length,
      y: this.lines.length - 1,
    };

    this.render();
    this.showMessage("All text selected");
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

  async toggleTypewriterMode() {
    this.typewriterMode = !this.typewriterMode;
    this.config.typewriterMode = this.typewriterMode;

    // Save to project config if available
    try {
      const projectManager = require("../utils/project");
      if (projectManager.isWritersProject()) {
        const config = await projectManager.getConfig();
        if (!config.settings.editor) {
          config.settings.editor = {};
        }
        config.settings.editor.typewriterMode = this.typewriterMode;
        config.settings.editor.typewriterFocusLines = this.typewriterFocusLines;
        await projectManager.updateConfig(config);
      }
    } catch (error) {
      // Silently ignore if not in a project or config save fails
    }

    // Reset scroll position when enabling typewriter mode
    if (this.typewriterMode) {
      const editorHeight = this.getEditorHeight();
      const targetLine = Math.floor(
        editorHeight * this.config.typewriterPosition,
      );
      this.scrollY = Math.max(0, this.cursorY - targetLine);
    }

    this.render();
    this.showMessage(`Typewriter mode ${this.typewriterMode ? "ON" : "OFF"}`);
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

  // Text selection methods
  startSelection() {
    this.selecting = true;
    this.selectionStart = { x: this.cursorX, y: this.cursorY };
    this.selectionEnd = { x: this.cursorX, y: this.cursorY };
  }

  updateSelection() {
    if (this.selecting) {
      this.selectionEnd = { x: this.cursorX, y: this.cursorY };
    }
  }

  clearSelection() {
    this.selecting = false;
    this.selectionStart = { x: 0, y: 0 };
    this.selectionEnd = { x: 0, y: 0 };
  }

  hasSelection() {
    return (
      this.selecting &&
      (this.selectionStart.x !== this.selectionEnd.x ||
        this.selectionStart.y !== this.selectionEnd.y)
    );
  }

  getSelectedText() {
    if (!this.hasSelection()) {
      return "";
    }

    let start = this.selectionStart;
    let end = this.selectionEnd;

    // Ensure start comes before end
    if (start.y > end.y || (start.y === end.y && start.x > end.x)) {
      [start, end] = [end, start];
    }

    if (start.y === end.y) {
      // Single line selection
      return this.lines[start.y].substring(start.x, end.x);
    } else {
      // Multi-line selection
      let result = [];

      // First line
      result.push(this.lines[start.y].substring(start.x));

      // Middle lines
      for (let i = start.y + 1; i < end.y; i++) {
        result.push(this.lines[i]);
      }

      // Last line
      result.push(this.lines[end.y].substring(0, end.x));

      return result.join("\n");
    }
  }

  deleteSelection() {
    if (!this.hasSelection()) {
      return;
    }

    this.pushUndo();

    let start = this.selectionStart;
    let end = this.selectionEnd;

    // Ensure start comes before end
    if (start.y > end.y || (start.y === end.y && start.x > end.x)) {
      [start, end] = [end, start];
    }

    if (start.y === end.y) {
      // Single line deletion
      const line = this.lines[start.y];
      this.lines[start.y] = line.substring(0, start.x) + line.substring(end.x);
    } else {
      // Multi-line deletion
      const startLine = this.lines[start.y].substring(0, start.x);
      const endLine = this.lines[end.y].substring(end.x);

      // Remove lines in between
      this.lines.splice(start.y, end.y - start.y + 1, startLine + endLine);
    }

    this.cursorX = start.x;
    this.cursorY = start.y;
    this.clearSelection();
    this.markDirty();
  }

  async copySelection() {
    if (!this.hasSelection()) {
      // If no selection, copy current line
      const currentLine = this.lines[this.cursorY];
      try {
        await this.clipboard.copyToSystem(currentLine);
        this.showMessage("Current line copied to clipboard");
      } catch (error) {
        this.clipboard.setInternal(currentLine);
        this.showMessage("Current line copied to internal clipboard");
      }
      return;
    }

    const selectedText = this.getSelectedText();
    try {
      await this.clipboard.copyToSystem(selectedText);
      this.showMessage(`${selectedText.length} characters copied to clipboard`);
    } catch (error) {
      this.clipboard.setInternal(selectedText);
      this.showMessage(
        `${selectedText.length} characters copied to internal clipboard`,
      );
    }
  }

  async pasteFromClipboard() {
    try {
      const text = await this.clipboard.pasteFromSystem();
      if (text) {
        this.insertText(text);
        this.showMessage("Text pasted from clipboard");
      } else {
        this.showMessage("Clipboard is empty");
      }
    } catch (error) {
      const text = this.clipboard.getInternal();
      if (text) {
        this.insertText(text);
        this.showMessage("Text pasted from internal clipboard");
      } else {
        this.showMessage("No text to paste");
      }
    }
  }

  async cutSelection() {
    if (this.hasSelection()) {
      await this.copySelection();
      this.deleteSelection();
      this.render();
      this.showMessage("Selection cut to clipboard");
    } else {
      // Cut current line if no selection
      const currentLine = this.lines[this.cursorY];
      try {
        await this.clipboard.copyToSystem(currentLine);
        this.pushUndo();
        this.lines.splice(this.cursorY, 1);
        if (this.lines.length === 0) {
          this.lines = [""];
        }
        if (this.cursorY >= this.lines.length) {
          this.cursorY = this.lines.length - 1;
        }
        this.cursorX = Math.min(this.cursorX, this.lines[this.cursorY].length);
        this.markDirty();
        this.render();
        this.showMessage("Current line cut to clipboard");
      } catch (error) {
        this.showMessage("Failed to cut line");
      }
    }
  }

  insertText(text) {
    if (!text) return;

    // If there's a selection, delete it first
    if (this.hasSelection()) {
      this.deleteSelection();
    }

    this.pushUndo();

    const lines = text.split("\n");
    const currentLine = this.lines[this.cursorY];
    const before = currentLine.substring(0, this.cursorX);
    const after = currentLine.substring(this.cursorX);

    if (lines.length === 1) {
      // Single line paste
      this.lines[this.cursorY] = before + lines[0] + after;
      this.cursorX += lines[0].length;
    } else {
      // Multi-line paste
      this.lines[this.cursorY] = before + lines[0];

      // Insert middle lines
      for (let i = 1; i < lines.length - 1; i++) {
        this.lines.splice(this.cursorY + i, 0, lines[i]);
      }

      // Insert last line
      this.lines.splice(
        this.cursorY + lines.length - 1,
        0,
        lines[lines.length - 1] + after,
      );

      this.cursorY += lines.length - 1;
      this.cursorX = lines[lines.length - 1].length;
    }

    this.markDirty();
    this.render();
  }

  // Helper method to apply selection highlighting to a line
  applySelectionHighlight(lineContent, lineIndex, startX) {
    let start = this.selectionStart;
    let end = this.selectionEnd;

    // Ensure start comes before end
    if (start.y > end.y || (start.y === end.y && start.x > end.x)) {
      [start, end] = [end, start];
    }

    // Check if this line is within the selection
    if (lineIndex < start.y || lineIndex > end.y) {
      return lineContent; // No selection on this line
    }

    let selStart = 0;
    let selEnd = lineContent.length;

    if (lineIndex === start.y) {
      selStart = Math.max(0, start.x - startX);
    }

    if (lineIndex === end.y) {
      selEnd = Math.min(lineContent.length, end.x - startX);
    }

    // Ensure selection bounds are valid
    selStart = Math.max(0, Math.min(lineContent.length, selStart));
    selEnd = Math.max(selStart, Math.min(lineContent.length, selEnd));

    if (selStart >= selEnd) {
      return lineContent; // No valid selection range
    }

    // Apply highlighting
    const before = lineContent.substring(0, selStart);
    const selected = lineContent.substring(selStart, selEnd);
    const after = lineContent.substring(selEnd);

    return before + this.themeManager.formatText(selected, "selection") + after;
  }

  /**
   * Switch to next theme
   */
  switchTheme() {
    const newTheme = this.themeManager.nextTheme();

    // Recreate interface with new theme
    this.screen.destroy();
    this.createScreen();
    this.createInterface();
    this.setupKeybindings();

    // Show theme change message
    this.showMessage(`Switched to ${newTheme.displayName}`);
    this.render();
  }

  /**
   * Setup Pomodoro timer callbacks
   */
  setupPomodoroCallbacks() {
    this.pomodoroTimer.setCallbacks({
      onTick: (timeRemaining, phase) => {
        // Update status bar every second (only if editor is initialized)
        if (this.editor && this.screen) {
          this.render();
        }
      },
      onPhaseComplete: (completedPhase, newPhase) => {
        const phaseNames = {
          work: "Focus session",
          break: "Break",
        };

        if (completedPhase === "work") {
          this.showMessage(`🎉 ${phaseNames.work} complete! Time for a break.`);
        } else {
          this.showMessage(`✍️  Break over! Time to focus.`);
        }

        // Auto-start next phase (optional - can be made configurable)
        setTimeout(() => {
          this.pomodoroTimer.start();
        }, 2000);
      },
      onPomodoroComplete: (completedCount) => {
        this.showMessage(
          `🍅 Pomodoro #${completedCount} completed! Great work!`,
        );
      },
    });
  }

  /**
   * Toggle Pomodoro timer (start/pause)
   */
  togglePomodoroTimer() {
    const status = this.pomodoroTimer.getStatus();

    if (!status.isRunning) {
      this.pomodoroTimer.start();
      this.showMessage(
        `🍅 Pomodoro started: ${this.pomodoroTimer.getPhaseDisplayName()} session`,
      );
    } else if (status.isPaused) {
      this.pomodoroTimer.resume();
      this.showMessage("▶️  Pomodoro resumed");
    } else {
      this.pomodoroTimer.pause();
      this.showMessage("⏸️  Pomodoro paused");
    }

    this.render();
  }

  /**
   * Reset Pomodoro timer
   */
  resetPomodoroTimer() {
    this.pomodoroTimer.resetAll();
    this.showMessage("🔄 Pomodoro timer reset");
    this.render();
  }

  /**
   * Show Pomodoro configuration dialog
   */
  async showPomodoroDialog() {
    const status = this.pomodoroTimer.getStatus();
    const config = this.pomodoroTimer.getConfig();

    const dialogContent = `
🍅 POMODORO TIMER

Current Status:
  Phase: ${this.pomodoroTimer.getPhaseDisplayName()}
  Time: ${status.timeFormatted}
  Status: ${status.isRunning ? (status.isPaused ? "Paused" : "Running") : "Stopped"}
  Completed: ${status.completedPomodoros} Pomodoros

Configuration:
  Work Duration: ${config.workDuration / 60000} minutes
  Short Break: ${config.shortBreak / 60000} minutes
  Long Break: ${config.longBreak / 60000} minutes
  Long Break Every: ${config.longBreakInterval} Pomodoros

Controls:
  F3        Start/Pause timer
  Shift+F3  Reset timer
  F4        Show this dialog

Tips:
• The timer will show in your status bar
• Automatic notifications when phases complete
• Focus sessions help maintain writing flow
• Take breaks to avoid fatigue and maintain creativity

Current Phase Progress: ${"█".repeat(Math.floor(status.phaseProgress * 20))}${"░".repeat(20 - Math.floor(status.phaseProgress * 20))} ${Math.floor(status.phaseProgress * 100)}%
    `.trim();

    await this.dialogs.showInfoDialog(dialogContent, " Pomodoro Timer ");
  }
}

module.exports = BufferEditor;
