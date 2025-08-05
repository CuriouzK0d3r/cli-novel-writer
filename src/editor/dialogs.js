const blessed = require("blessed");

class EditorDialogs {
  constructor(screen, editor) {
    this.screen = screen;
    this.editor = editor;
    this.themeManager = editor.themeManager;
  }

  createDialog(options) {
    const theme = this.themeManager.getCurrentTheme();
    const colors = theme.colors;

    const dialog = blessed.box({
      parent: this.screen,
      top: "center",
      left: "center",
      width: options.width || 60,
      height: options.height || "shrink",
      border: {
        type: "line",
        fg: colors.borderFocus,
      },
      label: options.label || " Dialog ",
      style: {
        fg: colors.foreground,
        bg: colors.background,
        border: {
          fg: colors.borderFocus,
        },
      },
      keys: true,
      mouse: true,
      grabKeys: options.grabKeys || false,
      modal: options.modal || false,
    });

    return dialog;
  }

  showOpenDialog() {
    return new Promise((resolve) => {
      const dialog = this.createDialog({
        label: " Open File ",
        width: 70,
        height: 8,
      });

      const input = blessed.textbox({
        parent: dialog,
        top: 1,
        left: 2,
        right: 2,
        height: 1,
        border: {
          type: "line",
        },
        style: {
          fg: "white",
          bg: "black",
        },
        inputOnFocus: true,
      });

      const instructions = blessed.text({
        parent: dialog,
        top: 3,
        left: 2,
        right: 2,
        height: 2,
        content:
          "Enter file path or press Tab to browse current directory.\nPress Enter to open, Escape to cancel.",
        style: {
          fg: "cyan",
        },
      });

      input.focus();

      input.key(["enter"], () => {
        const value = input.getValue();
        dialog.destroy();
        this.screen.render();
        resolve(value);
      });

      input.key(["escape"], () => {
        dialog.destroy();
        this.screen.render();
        resolve(null);
      });

      this.screen.render();
    });
  }

  showSaveAsDialog(currentFile = "") {
    return new Promise((resolve) => {
      const dialog = this.createDialog({
        label: " Save As ",
        width: 70,
        height: 8,
      });

      const input = blessed.textbox({
        parent: dialog,
        top: 1,
        left: 2,
        right: 2,
        height: 1,
        border: {
          type: "line",
        },
        style: {
          fg: "white",
          bg: "black",
        },
        inputOnFocus: true,
      });

      if (currentFile) {
        input.setValue(currentFile);
      }

      const instructions = blessed.text({
        parent: dialog,
        top: 3,
        left: 2,
        right: 2,
        height: 2,
        content:
          "Enter file path to save.\nPress Enter to save, Escape to cancel.",
        style: {
          fg: "cyan",
        },
      });

      input.focus();

      input.key(["enter"], () => {
        const value = input.getValue();
        dialog.destroy();
        this.screen.render();
        resolve(value);
      });

      input.key(["escape"], () => {
        dialog.destroy();
        this.screen.render();
        resolve(null);
      });

      this.screen.render();
    });
  }

  showFindDialog() {
    return new Promise((resolve) => {
      const dialog = this.createDialog({
        label: " Find Text ",
        width: 60,
        height: 8,
      });

      const theme = this.themeManager.getCurrentTheme();
      const colors = theme.colors;

      const input = blessed.textbox({
        parent: dialog,
        top: 1,
        left: 2,
        right: 2,
        height: 1,
        border: {
          type: "line",
          fg: colors.border,
        },
        style: {
          fg: colors.inputFg || colors.foreground,
          bg: colors.inputBg || colors.infoBg,
          focus: {
            fg: colors.inputFg || colors.foreground,
            bg: colors.inputFocusBg || colors.selectionBg,
            border: {
              fg: colors.inputFocusBorder || colors.borderFocus,
            },
          },
        },
        inputOnFocus: true,
      });

      const instructions = blessed.text({
        parent: dialog,
        top: 3,
        left: 2,
        right: 2,
        height: 2,
        content:
          "Enter text to search for.\nPress Enter to find, Escape to cancel.",
        style: {
          fg: colors.info,
        },
      });

      input.focus();

      input.key(["enter"], () => {
        const value = input.getValue();
        dialog.destroy();
        this.screen.render();
        resolve(value);
      });

      input.key(["escape"], () => {
        dialog.destroy();
        this.screen.render();
        resolve(null);
      });

      this.screen.render();
    });
  }

  showReplaceDialog() {
    return new Promise((resolve) => {
      const dialog = this.createDialog({
        label: " Find and Replace ",
        width: 70,
        height: 12,
      });

      const theme = this.themeManager.getCurrentTheme();
      const colors = theme.colors;

      const findInput = blessed.textbox({
        parent: dialog,
        top: 1,
        left: 2,
        right: 2,
        height: 1,
        border: {
          type: "line",
          fg: colors.border,
        },
        label: " Find ",
        style: {
          fg: colors.inputFg || colors.foreground,
          bg: colors.inputBg || colors.infoBg,
          focus: {
            fg: colors.inputFg || colors.foreground,
            bg: colors.inputFocusBg || colors.selectionBg,
            border: {
              fg: colors.inputFocusBorder || colors.borderFocus,
            },
          },
        },
        inputOnFocus: true,
      });

      const replaceInput = blessed.textbox({
        parent: dialog,
        top: 4,
        left: 2,
        right: 2,
        height: 1,
        border: {
          type: "line",
          fg: colors.border,
        },
        label: " Replace with ",
        style: {
          fg: colors.inputFg || colors.foreground,
          bg: colors.inputBg || colors.infoBg,
          focus: {
            fg: colors.inputFg || colors.foreground,
            bg: colors.inputFocusBg || colors.selectionBg,
            border: {
              fg: colors.inputFocusBorder || colors.borderFocus,
            },
          },
        },
        inputOnFocus: true,
      });

      const instructions = blessed.text({
        parent: dialog,
        top: 7,
        left: 2,
        right: 2,
        height: 2,
        content:
          "Enter find and replace text.\nPress Enter to replace all, Escape to cancel.",
        style: {
          fg: colors.info,
        },
      });

      findInput.focus();

      const handleSubmit = () => {
        const findValue = findInput.getValue();
        const replaceValue = replaceInput.getValue();
        dialog.destroy();
        this.screen.render();
        resolve({ find: findValue, replace: replaceValue });
      };

      findInput.key(["enter"], () => {
        replaceInput.focus();
      });

      replaceInput.key(["enter"], handleSubmit);

      dialog.key(["escape"], () => {
        dialog.destroy();
        this.screen.render();
        resolve(null);
      });

      this.screen.render();
    });
  }

  showGoToLineDialog(totalLines) {
    return new Promise((resolve) => {
      const dialog = this.createDialog({
        label: " Go to Line ",
        width: 50,
        height: 8,
        modal: true,
        grabKeys: true,
      });

      const theme = this.themeManager.getCurrentTheme();
      const colors = theme.colors;

      const input = blessed.textbox({
        parent: dialog,
        top: 1,
        left: 2,
        right: 2,
        height: 1,
        border: {
          type: "line",
          fg: colors.inputBorder || colors.border,
        },
        style: {
          fg: colors.inputFg || colors.foreground,
          bg: colors.inputBg || colors.background,
          focus: {
            fg: colors.inputFg || colors.foreground,
            bg: colors.inputFocusBg || colors.selectionBg,
            border: {
              fg: colors.inputFocusBorder || colors.borderFocus,
            },
          },
        },
        inputOnFocus: true,
        keys: true,
        mouse: true,
      });

      const instructions = blessed.text({
        parent: dialog,
        top: 3,
        left: 2,
        right: 2,
        height: 2,
        content: `Enter line number (1-${totalLines}).\nPress Enter to go, Escape to cancel.`,
        style: {
          fg: colors.info,
        },
      });

      // Focus the input after a brief delay to ensure proper rendering
      setImmediate(() => {
        input.focus();
        this.screen.render();
      });

      input.key(["enter"], () => {
        const value = parseInt(input.getValue());
        dialog.destroy();
        this.screen.render();
        if (!isNaN(value) && value >= 1 && value <= totalLines) {
          resolve(value);
        } else {
          resolve(null);
        }
      });

      input.key(["escape", "C-c"], () => {
        dialog.destroy();
        this.screen.render();
        resolve(null);
      });

      // Handle dialog-level escape
      dialog.key(["escape", "C-c"], () => {
        dialog.destroy();
        this.screen.render();
        resolve(null);
      });

      this.screen.render();
    });
  }

  showWordCountDialog(stats) {
    return new Promise((resolve) => {
      const theme = this.themeManager.getCurrentTheme();
      const colors = theme.colors;

      const dialog = this.createDialog({
        label: " Document Statistics ",
        width: 60,
        height: 14,
      });

      const content = `
Word Count: ${stats.words || 0}
Characters: ${stats.characters || 0}
Characters (no spaces): ${stats.charactersNoSpaces || 0}
Lines: ${stats.lines || 0}
Paragraphs: ${stats.paragraphs || 0}
Reading Time: ${stats.readingTime || "N/A"}

Current Position:
  Line: ${stats.currentLine || 1}
  Column: ${stats.currentColumn || 1}
      `.trim();

      const text = blessed.text({
        parent: dialog,
        top: 1,
        left: 2,
        right: 2,
        bottom: 3,
        content: content,
        style: {
          fg: colors.foreground,
        },
      });

      const instructions = blessed.text({
        parent: dialog,
        bottom: 1,
        left: 2,
        right: 2,
        height: 1,
        content: "Auto-closing in 5 seconds... (Press any key to close now)",
        style: {
          fg: colors.info,
        },
      });

      // Auto-close after 5 seconds
      const timeout = setTimeout(() => {
        if (!dialog.destroyed) {
          dialog.destroy();
          this.screen.render();
          resolve();
        }
      }, 5000);

      // Allow manual close with any key
      dialog.key(["escape", "enter", "space", "q"], () => {
        clearTimeout(timeout);
        if (!dialog.destroyed) {
          dialog.destroy();
          this.screen.render();
        }
        resolve();
      });

      // Also listen for any keypress
      dialog.on("keypress", () => {
        clearTimeout(timeout);
        if (!dialog.destroyed) {
          dialog.destroy();
          this.screen.render();
        }
        resolve();
      });

      dialog.focus();
      this.screen.render();
    });
  }

  showHelpDialog() {
    return new Promise((resolve) => {
      const dialog = this.createDialog({
        label: " Novel Editor Help ",
        width: 80,
        height: "90%",
        grabKeys: true, // Grab all keys for this dialog
        modal: true, // Make this a modal dialog
      });

      const helpText = `
WRITERS CLI EDITOR - BEAUTIFUL THEMED WRITING

🎨 THEMES:
The editor features beautiful themes for optimal writing:
  🌙 Dark Theme    - Modern dark colors, easy on the eyes
  ☀️ Light Theme   - Clean bright interface for daylight
  🎨 Base Theme    - Simple classic appearance

Theme Controls:
  F2             Switch between themes instantly

MODES:
The editor has two modes (shown in status bar):
  Navigation Mode (NAV) - Default mode, cannot edit text
  Insert Mode (INS)     - Allows text editing

Mode Switching:
  i              Enter Insert mode from Navigation mode
  Escape         Return to Navigation mode from any mode

NAVIGATION MODE:
Movement:
  Arrow Keys     Move cursor (up/down/left/right)
  h/j/k/l        Left/Down/Up/Right (Vim-style)
  w/a/s/d        Up/Left/Down/Right (WASD-style)
  Home/End       Beginning/End of line
  Page Up/Down   Scroll by page
  Ctrl+Left/Right  Move by word
  Ctrl+Home/End    Beginning/End of document

INSERT MODE:
Movement:
  Arrow Keys     Move cursor
  Ctrl+Left/Right  Move by word
  Home           Beginning of line
  End            End of line
  Ctrl+Home      Beginning of document
  Ctrl+End       End of document
  Page Up/Down   Scroll by page

Text Editing (Insert mode only):
  Enter          New line
  Backspace      Delete character before cursor
  Delete         Delete character at cursor
  Tab            Insert tab/spaces

BOTH MODES:
File Operations:
  Ctrl+N         New file
  Ctrl+O         Open file
  Ctrl+S         Save file
  Ctrl+T         Toggle between story and notes
  Ctrl+X         Exit editor

Edit Operations:
  Ctrl+Z         Undo
  Ctrl+Y         Redo
  Ctrl+A         Select all
  Ctrl+C         Copy selection (or current line if no selection)
  Ctrl+V         Paste from clipboard
  Ctrl+X         Cut selection (or current line if no selection)
  dd             Delete current line (navigation mode)

Text Selection:
  Shift+Arrow    Extend selection with arrow keys
  Shift+Home/End Extend selection to line start/end
  Shift+Ctrl+Arrow Extend selection by word
  Shift+Ctrl+Home/End Extend selection to document start/end

Search and Replace:
  Ctrl+F         Find text
  Ctrl+R         Find and replace
  Ctrl+G         Go to line number

View & Themes:
  F2             🎨 Switch theme (Dark/Light/Base)
  F11            Toggle distraction-free mode
  F9             Toggle typewriter mode (focused window with dimming)
  Ctrl+W         Show document statistics
  F1             Show this help

Pomodoro Timer:
  F3 or Ctrl+P   🍅 Start/pause Pomodoro timer
  F4 or Ctrl+Shift+P Show timer status and configuration
  Shift+F3 or Ctrl+R Reset timer and session count

Writing Features:
  - 🎨 Beautiful dark & light themes with syntax highlighting
  - 🍅 Built-in Pomodoro timer for focused writing sessions
  - Real-time word count in status bar
  - Reading time estimation
  - Auto-save every 30 seconds
  - Line numbers
  - Modal editing for focused writing
  - Distraction-free writing mode
  - Typewriter mode with focused window (dims all but current ±1 line)
  - Markdown-aware word counting and syntax highlighting
  - Professional status bars with theme integration

Tips for Modal Editing:
  - Start in Navigation mode for browsing
  - Press 'i' when ready to write/edit
  - Use Escape to quickly return to navigation
  - Navigation mode prevents accidental edits
  - Use h/j/k/l or w/a/s/d for quick movement

Press any key to close this help.
      `.trim();

      const text = blessed.scrollabletext({
        parent: dialog,
        top: 1,
        left: 2,
        right: 2,
        bottom: 1,
        content: helpText,
        style: {
          fg: "white",
        },
        scrollable: true,
        alwaysScroll: true,
        mouse: true,
        keys: false, // Don't let this handle keys
        keyable: false,
      });

      // Catch ALL key events before they bubble up
      dialog.on("keypress", (ch, key) => {
        // Close on any key except pure modifiers
        if (key && !key.ctrl && !key.meta && !key.alt && !key.shift) {
          dialog.destroy();
          this.screen.render();
          resolve();
        }
      });

      // Also handle specific keys as before
      dialog.key(["escape", "f1", "q"], () => {
        dialog.destroy();
        this.screen.render();
        resolve();
      });

      dialog.focus();
      this.screen.render();
    });
  }

  showConfirmDialog(message, title = " Confirm ") {
    return new Promise((resolve) => {
      const dialog = this.createDialog({
        label: title,
        width: 60,
        height: 8,
        borderColor: "yellow",
      });

      const text = blessed.text({
        parent: dialog,
        top: 1,
        left: 2,
        right: 2,
        height: 2,
        content: message,
        style: {
          fg: "white",
        },
      });

      const instructions = blessed.text({
        parent: dialog,
        top: 4,
        left: 2,
        right: 2,
        height: 1,
        content: "Y/y = Yes, N/n = No, Escape = Cancel",
        style: {
          fg: "yellow",
        },
      });

      dialog.key(["y"], () => {
        dialog.destroy();
        this.screen.render();
        resolve(true);
      });

      dialog.key(["n"], () => {
        dialog.destroy();
        this.screen.render();
        resolve(false);
      });

      dialog.key(["escape"], () => {
        dialog.destroy();
        this.screen.render();
        resolve(null);
      });

      dialog.focus();
      this.screen.render();
    });
  }

  showMessage(message, title = " Message ", timeout = 3000) {
    const dialog = this.createDialog({
      label: title,
      width: Math.min(message.length + 10, 70),
      height: 5,
    });

    const text = blessed.text({
      parent: dialog,
      top: 1,
      left: 2,
      right: 2,
      height: 1,
      content: message,
      style: {
        fg: "white",
      },
    });

    this.screen.render();

    setTimeout(() => {
      dialog.destroy();
      this.screen.render();
    }, timeout);
  }

  showError(message, title = " Error ") {
    return new Promise((resolve) => {
      const dialog = this.createDialog({
        label: title,
        width: Math.min(message.length + 10, 70),
        height: 6,
        borderColor: "red",
      });

      const text = blessed.text({
        parent: dialog,
        top: 1,
        left: 2,
        right: 2,
        height: 2,
        content: message,
        style: {
          fg: "red",
        },
      });

      const instructions = blessed.text({
        parent: dialog,
        bottom: 0,
        left: 2,
        right: 2,
        height: 1,
        content: "Press any key to continue",
        style: {
          fg: "cyan",
        },
      });

      dialog.key(["escape", "enter", "space"], () => {
        dialog.destroy();
        this.screen.render();
        resolve();
      });

      // Also listen for any other keypress to close error (excluding special keys)
      dialog.on("keypress", (ch, key) => {
        if (
          key &&
          key.name &&
          !["escape", "enter", "space"].includes(key.name) &&
          !key.ctrl &&
          !key.meta &&
          !key.alt
        ) {
          dialog.destroy();
          this.screen.render();
          resolve();
        }
      });

      dialog.focus();
      this.screen.render();
    });
  }

  showInfoDialog(content, title = " Information ") {
    return new Promise((resolve) => {
      const dialog = this.createDialog({
        label: title,
        width: 80,
        height: "70%",
        grabKeys: true,
        modal: true,
      });

      const text = blessed.scrollabletext({
        parent: dialog,
        top: 1,
        left: 2,
        right: 2,
        bottom: 2,
        content: content,
        style: {
          fg: "white",
        },
        scrollable: true,
        alwaysScroll: true,
        mouse: true,
        keys: false,
        keyable: false,
      });

      const instructions = blessed.text({
        parent: dialog,
        bottom: 0,
        left: 2,
        right: 2,
        height: 1,
        content: "Press any key to close",
        style: {
          fg: "cyan",
        },
      });

      // Catch ALL key events before they bubble up
      dialog.on("keypress", (ch, key) => {
        // Close on any key except pure modifiers
        if (key && !key.ctrl && !key.meta && !key.alt && !key.shift) {
          dialog.destroy();
          this.screen.render();
          resolve();
        }
      });

      // Also handle specific keys as before
      dialog.key(["escape", "enter", "space"], () => {
        dialog.destroy();
        this.screen.render();
        resolve();
      });

      dialog.focus();
      this.screen.render();
    });
  }
}

module.exports = EditorDialogs;
