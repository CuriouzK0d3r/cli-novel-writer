const blessed = require("blessed");

class EditorDialogs {
  constructor(screen, editor) {
    this.screen = screen;
    this.editor = editor;
  }

  createDialog(options) {
    const dialog = blessed.box({
      parent: this.screen,
      top: "center",
      left: "center",
      width: options.width || 60,
      height: options.height || "shrink",
      border: {
        type: "line",
        fg: options.borderColor || "green",
      },
      label: options.label || " Dialog ",
      style: {
        fg: "white",
        bg: "black",
        border: {
          fg: options.borderColor || "green",
        },
      },
      keys: true,
      mouse: true,
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
          "Enter text to search for.\nPress Enter to find, Escape to cancel.",
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

  showReplaceDialog() {
    return new Promise((resolve) => {
      const dialog = this.createDialog({
        label: " Find and Replace ",
        width: 70,
        height: 12,
      });

      const findInput = blessed.textbox({
        parent: dialog,
        top: 1,
        left: 2,
        right: 2,
        height: 1,
        border: {
          type: "line",
        },
        label: " Find ",
        style: {
          fg: "white",
          bg: "black",
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
        },
        label: " Replace with ",
        style: {
          fg: "white",
          bg: "black",
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
          fg: "cyan",
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
        content: `Enter line number (1-${totalLines}).\nPress Enter to go, Escape to cancel.`,
        style: {
          fg: "cyan",
        },
      });

      input.focus();

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

      input.key(["escape"], () => {
        dialog.destroy();
        this.screen.render();
        resolve(null);
      });

      this.screen.render();
    });
  }

  showWordCountDialog(stats) {
    return new Promise((resolve) => {
      const dialog = this.createDialog({
        label: " Document Statistics ",
        width: 60,
        height: 15,
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
        bottom: 2,
        content: content,
        style: {
          fg: "white",
        },
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

      dialog.key(["escape", "enter", "space"], () => {
        dialog.destroy();
        this.screen.render();
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
      });

      const helpText = `
NOVEL EDITOR - MODAL EDITING HELP

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
  Ctrl+X         Exit editor

Edit Operations:
  Ctrl+Z         Undo
  Ctrl+Y         Redo
  Ctrl+A         Select all

Search and Replace:
  Ctrl+F         Find text
  Ctrl+R         Find and replace
  Ctrl+G         Go to line number

View:
  F11            Toggle distraction-free mode
  F9             Toggle typewriter mode (focused window with dimming)
  Ctrl+W         Show document statistics
  F1             Show this help

Writing Features:
  - Real-time word count in status bar
  - Reading time estimation
  - Auto-save every 30 seconds
  - Line numbers
  - Modal editing for focused writing
  - Distraction-free writing mode
  - Typewriter mode with focused window (dims all but current ±1 line)
  - Markdown-aware word counting

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
        keys: true,
      });

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

      dialog.focus();
      this.screen.render();
    });
  }
}

module.exports = EditorDialogs;
