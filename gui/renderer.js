const { ipcRenderer } = require("electron");

class WritersGUIEditor {
  constructor() {
    this.editor = document.getElementById("editor");
    this.modeIndicator = document.getElementById("modeIndicator");
    this.fileInfo = document.getElementById("fileInfo");
    this.cursorPos = document.getElementById("cursorPos");
    this.selection = document.getElementById("selection");
    this.wordCount = document.getElementById("wordCount");
    this.charCount = document.getElementById("charCount");
    this.saveStatus = document.getElementById("saveStatus");

    this.mode = "insert"; // 'insert' or 'navigation'
    this.isModified = false;
    this.currentFile = null;
    this.undoStack = [];
    this.redoStack = [];
    this.maxUndoSteps = 100;
    this.autoSaveInterval = null;
    this.isDistractionFree = false;
    this.searchResults = [];
    this.currentSearchIndex = 0;

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupIPC();
    this.startAutoSave();
    this.updateStatus();
    this.pushUndo();
  }

  setupEventListeners() {
    // Editor focus and content changes
    this.editor.addEventListener("input", () => {
      this.markDirty();
      this.updateStatus();
      this.pushUndo();
    });

    this.editor.addEventListener("selectionchange", () => {
      this.updateCursorPosition();
    });

    this.editor.addEventListener("click", () => {
      this.updateCursorPosition();
    });

    this.editor.addEventListener("keyup", () => {
      this.updateCursorPosition();
    });

    // Keyboard event handling
    this.editor.addEventListener("keydown", (e) => {
      this.handleKeydown(e);
    });

    // Modal event handlers
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeAllModals();
        if (this.mode === "insert") {
          this.setMode("navigation");
        }
      }
    });

    // Find modal enter key
    document.getElementById("findInput").addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        this.findNext();
      }
    });

    // Replace modal enter keys
    document.getElementById("replaceFind").addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        this.replaceNext();
      }
    });

    document.getElementById("replaceWith").addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        this.replaceNext();
      }
    });

    // Go to line modal enter key
    document.getElementById("lineNumber").addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        this.goToLine();
      }
    });
  }

  setupIPC() {
    // Handle menu actions
    ipcRenderer.on("new-file", () => {
      this.newFile();
    });

    ipcRenderer.on("load-file", (event, data) => {
      this.loadFile(data.content, data.filePath);
    });

    ipcRenderer.on("request-save", () => {
      this.saveFile();
    });

    ipcRenderer.on("request-save-as", () => {
      this.saveAsFile();
    });

    ipcRenderer.on("undo", () => {
      this.undo();
    });

    ipcRenderer.on("redo", () => {
      this.redo();
    });

    ipcRenderer.on("selectAll", () => {
      this.selectAll();
    });

    ipcRenderer.on("showFind", () => {
      this.showFindModal();
    });

    ipcRenderer.on("showReplace", () => {
      this.showReplaceModal();
    });

    ipcRenderer.on("showGoToLine", () => {
      this.showGoToLineModal();
    });

    ipcRenderer.on("showWordCount", () => {
      this.showWordCountModal();
    });

    ipcRenderer.on("showHelp", () => {
      this.showHelpModal();
    });

    ipcRenderer.on("toggle-distraction-free", () => {
      this.toggleDistractionFree();
    });
  }

  handleKeydown(e) {
    // Handle global shortcuts first
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case "s":
          e.preventDefault();
          this.saveFile();
          return;
        case "o":
          e.preventDefault();
          this.openFile();
          return;
        case "n":
          e.preventDefault();
          this.newFile();
          return;
        case "x":
          e.preventDefault();
          this.exit();
          return;
        case "z":
          e.preventDefault();
          this.undo();
          return;
        case "y":
          e.preventDefault();
          this.redo();
          return;
        case "a":
          e.preventDefault();
          this.selectAll();
          return;
        case "f":
          e.preventDefault();
          this.showFindModal();
          return;
        case "r":
          e.preventDefault();
          this.showReplaceModal();
          return;
        case "g":
          e.preventDefault();
          this.showGoToLineModal();
          return;
        case "w":
          e.preventDefault();
          this.showWordCountModal();
          return;
      }
    }

    // Handle function keys
    if (e.key === "F1") {
      e.preventDefault();
      this.showHelpModal();
      return;
    }

    if (e.key === "F11") {
      e.preventDefault();
      this.toggleDistractionFree();
      return;
    }

    // Handle mode-specific keys
    if (e.key === "Escape") {
      e.preventDefault();
      this.setMode("navigation");
      return;
    }

    if (this.mode === "navigation") {
      this.handleNavigationMode(e);
    }
  }

  handleNavigationMode(e) {
    e.preventDefault();

    const start = this.editor.selectionStart;
    const text = this.editor.value;
    const lines = text.substr(0, start).split("\n");
    const currentLine = lines.length - 1;
    const currentCol = lines[lines.length - 1].length;

    switch (e.key.toLowerCase()) {
      case "i":
        this.setMode("insert");
        return;

      case "w":
      case "k":
        this.moveCursor(0, -1);
        return;

      case "s":
      case "j":
        this.moveCursor(0, 1);
        return;

      case "a":
      case "h":
        this.moveCursor(-1, 0);
        return;

      case "d":
      case "l":
        this.moveCursor(1, 0);
        return;
    }

    // Allow arrow keys in navigation mode
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      e.preventDefault();
      return false; // Let default behavior handle arrow keys
    }
  }

  moveCursor(deltaX, deltaY) {
    const start = this.editor.selectionStart;
    const text = this.editor.value;
    const lines = text.split("\n");
    const beforeCursor = text.substr(0, start);
    const linesBefore = beforeCursor.split("\n");
    const currentLine = linesBefore.length - 1;
    const currentCol = linesBefore[linesBefore.length - 1].length;

    let newLine = currentLine + deltaY;
    let newCol = currentCol + deltaX;

    // Constrain line bounds
    if (newLine < 0) newLine = 0;
    if (newLine >= lines.length) newLine = lines.length - 1;

    // Constrain column bounds
    if (newCol < 0) newCol = 0;
    if (newCol > lines[newLine].length) newCol = lines[newLine].length;

    // Calculate new cursor position
    let newPos = 0;
    for (let i = 0; i < newLine; i++) {
      newPos += lines[i].length + 1; // +1 for newline
    }
    newPos += newCol;

    this.editor.setSelectionRange(newPos, newPos);
    this.updateCursorPosition();
  }

  setMode(mode) {
    this.mode = mode;
    this.modeIndicator.textContent = mode.toUpperCase();
    this.modeIndicator.className = `mode-indicator ${mode}`;

    if (mode === "insert") {
      this.editor.focus();
    }
  }

  markDirty() {
    if (!this.isModified) {
      this.isModified = true;
      ipcRenderer.send("content-changed", true);
    }
    this.saveStatus.textContent = "●";
  }

  markClean() {
    this.isModified = false;
    ipcRenderer.send("content-changed", false);
    this.saveStatus.textContent = "";
  }

  newFile() {
    this.editor.value = "";
    this.currentFile = null;
    this.markClean();
    this.fileInfo.textContent = "Untitled";
    this.undoStack = [];
    this.redoStack = [];
    this.pushUndo();
    this.updateStatus();
    this.editor.focus();
  }

  loadFile(content, filePath) {
    this.editor.value = content;
    this.currentFile = filePath;
    this.markClean();
    this.fileInfo.textContent = this.getFileName(filePath);
    this.undoStack = [];
    this.redoStack = [];
    this.pushUndo();
    this.updateStatus();
    this.editor.focus();
  }

  async openFile() {
    try {
      const result = await ipcRenderer.invoke("open-file");
      if (result) {
        this.loadFile(result.content, result.filePath);
      }
    } catch (error) {
      this.showError("Failed to open file: " + error.message);
    }
  }

  async saveFile() {
    try {
      const result = await ipcRenderer.invoke("save-file", this.editor.value);
      if (result && result.success) {
        this.markClean();
        this.currentFile = result.filePath;
        this.fileInfo.textContent = this.getFileName(result.filePath);
        this.saveStatus.textContent = "✓";
        setTimeout(() => {
          if (!this.isModified) this.saveStatus.textContent = "";
        }, 2000);
      }
    } catch (error) {
      this.showError("Failed to save file: " + error.message);
    }
  }

  async saveAsFile() {
    try {
      const result = await ipcRenderer.invoke(
        "save-as-file",
        this.editor.value,
      );
      if (result && result.success) {
        this.markClean();
        this.currentFile = result.filePath;
        this.fileInfo.textContent = this.getFileName(result.filePath);
        this.saveStatus.textContent = "✓";
        setTimeout(() => {
          if (!this.isModified) this.saveStatus.textContent = "";
        }, 2000);
      }
    } catch (error) {
      this.showError("Failed to save file: " + error.message);
    }
  }

  pushUndo() {
    const state = {
      content: this.editor.value,
      selectionStart: this.editor.selectionStart,
      selectionEnd: this.editor.selectionEnd,
    };

    // Don't push duplicate states
    const lastState = this.undoStack[this.undoStack.length - 1];
    if (lastState && lastState.content === state.content) {
      return;
    }

    this.undoStack.push(state);
    if (this.undoStack.length > this.maxUndoSteps) {
      this.undoStack.shift();
    }
    this.redoStack = []; // Clear redo stack on new action
  }

  undo() {
    if (this.undoStack.length > 1) {
      const currentState = this.undoStack.pop();
      this.redoStack.push(currentState);

      const previousState = this.undoStack[this.undoStack.length - 1];
      this.editor.value = previousState.content;
      this.editor.setSelectionRange(
        previousState.selectionStart,
        previousState.selectionEnd,
      );
      this.markDirty();
      this.updateStatus();
    }
  }

  redo() {
    if (this.redoStack.length > 0) {
      const state = this.redoStack.pop();
      this.undoStack.push(state);

      this.editor.value = state.content;
      this.editor.setSelectionRange(state.selectionStart, state.selectionEnd);
      this.markDirty();
      this.updateStatus();
    }
  }

  selectAll() {
    this.editor.select();
    this.updateCursorPosition();
  }

  updateStatus() {
    const text = this.editor.value;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    const charsNoSpaces = text.replace(/\s/g, "").length;

    this.wordCount.textContent = `${words} words`;
    this.charCount.textContent = `${chars} chars`;
  }

  updateCursorPosition() {
    const start = this.editor.selectionStart;
    const end = this.editor.selectionEnd;
    const text = this.editor.value.substr(0, start);
    const lines = text.split("\n");
    const line = lines.length;
    const col = lines[lines.length - 1].length + 1;

    this.cursorPos.textContent = `Ln ${line}, Col ${col}`;

    if (start !== end) {
      const selectedLength = end - start;
      this.selection.textContent = `(${selectedLength} selected)`;
    } else {
      this.selection.textContent = "";
    }
  }

  startAutoSave() {
    this.autoSaveInterval = setInterval(() => {
      if (this.isModified && this.currentFile) {
        this.saveFile();
      }
    }, 30000); // Auto-save every 30 seconds
  }

  toggleDistractionFree() {
    this.isDistractionFree = !this.isDistractionFree;
    document.body.classList.toggle("distraction-free", this.isDistractionFree);
  }

  // Modal functions
  showFindModal() {
    document.getElementById("findModal").style.display = "flex";
    document.getElementById("findInput").focus();
  }

  closeFindModal() {
    document.getElementById("findModal").style.display = "none";
    this.clearSearchHighlights();
    this.editor.focus();
  }

  showReplaceModal() {
    document.getElementById("replaceModal").style.display = "flex";
    document.getElementById("replaceFind").focus();
  }

  closeReplaceModal() {
    document.getElementById("replaceModal").style.display = "none";
    this.clearSearchHighlights();
    this.editor.focus();
  }

  showGoToLineModal() {
    document.getElementById("goToLineModal").style.display = "flex";
    document.getElementById("lineNumber").focus();
  }

  closeGoToLineModal() {
    document.getElementById("goToLineModal").style.display = "none";
    this.editor.focus();
  }

  showWordCountModal() {
    const text = this.editor.value;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    const charsNoSpaces = text.replace(/\s/g, "").length;
    const lines = text.split("\n").length;
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim()).length;

    // Estimate reading time (average 200 words per minute)
    const readingTime = Math.ceil(words / 200);

    const statsHTML = `
      <table style="width: 100%; margin: 16px 0;">
        <tr><td><strong>Words:</strong></td><td>${words}</td></tr>
        <tr><td><strong>Characters:</strong></td><td>${chars}</td></tr>
        <tr><td><strong>Characters (no spaces):</strong></td><td>${charsNoSpaces}</td></tr>
        <tr><td><strong>Lines:</strong></td><td>${lines}</td></tr>
        <tr><td><strong>Paragraphs:</strong></td><td>${paragraphs}</td></tr>
        <tr><td><strong>Estimated reading time:</strong></td><td>${readingTime} minute${readingTime !== 1 ? "s" : ""}</td></tr>
      </table>
    `;

    document.getElementById("wordCountStats").innerHTML = statsHTML;
    document.getElementById("wordCountModal").style.display = "flex";
  }

  closeWordCountModal() {
    document.getElementById("wordCountModal").style.display = "none";
    this.editor.focus();
  }

  showHelpModal() {
    document.getElementById("helpModal").style.display = "flex";
  }

  closeHelpModal() {
    document.getElementById("helpModal").style.display = "none";
    this.editor.focus();
  }

  closeAllModals() {
    const modals = document.querySelectorAll(".modal-overlay");
    modals.forEach((modal) => {
      modal.style.display = "none";
    });
    this.clearSearchHighlights();
  }

  // Search functionality
  findNext() {
    const searchTerm = document.getElementById("findInput").value;
    if (!searchTerm) return;

    const text = this.editor.value;
    const currentPos = this.editor.selectionStart;
    const index = text
      .toLowerCase()
      .indexOf(searchTerm.toLowerCase(), currentPos);

    if (index !== -1) {
      this.editor.setSelectionRange(index, index + searchTerm.length);
      this.editor.focus();
    } else {
      // Search from beginning
      const indexFromStart = text
        .toLowerCase()
        .indexOf(searchTerm.toLowerCase());
      if (indexFromStart !== -1) {
        this.editor.setSelectionRange(
          indexFromStart,
          indexFromStart + searchTerm.length,
        );
        this.editor.focus();
      }
    }
  }

  findPrevious() {
    const searchTerm = document.getElementById("findInput").value;
    if (!searchTerm) return;

    const text = this.editor.value;
    const currentPos = this.editor.selectionStart;
    const beforeCursor = text.substring(0, currentPos);
    const index = beforeCursor
      .toLowerCase()
      .lastIndexOf(searchTerm.toLowerCase());

    if (index !== -1) {
      this.editor.setSelectionRange(index, index + searchTerm.length);
      this.editor.focus();
    } else {
      // Search from end
      const indexFromEnd = text
        .toLowerCase()
        .lastIndexOf(searchTerm.toLowerCase());
      if (indexFromEnd !== -1) {
        this.editor.setSelectionRange(
          indexFromEnd,
          indexFromEnd + searchTerm.length,
        );
        this.editor.focus();
      }
    }
  }

  replaceNext() {
    const findText = document.getElementById("replaceFind").value;
    const replaceText = document.getElementById("replaceWith").value;

    if (!findText) return;

    const selectedText = this.editor.value.substring(
      this.editor.selectionStart,
      this.editor.selectionEnd,
    );

    if (selectedText.toLowerCase() === findText.toLowerCase()) {
      // Replace the currently selected text
      const start = this.editor.selectionStart;
      const end = this.editor.selectionEnd;
      this.editor.setRangeText(replaceText, start, end, "end");
      this.markDirty();
      this.pushUndo();
    }

    // Find next occurrence
    this.findNext();
  }

  replaceAll() {
    const findText = document.getElementById("replaceFind").value;
    const replaceText = document.getElementById("replaceWith").value;

    if (!findText) return;

    const regex = new RegExp(this.escapeRegExp(findText), "gi");
    const newText = this.editor.value.replace(regex, replaceText);

    if (newText !== this.editor.value) {
      this.editor.value = newText;
      this.markDirty();
      this.pushUndo();
      this.updateStatus();
    }

    this.closeReplaceModal();
  }

  goToLine() {
    const lineNumber = parseInt(document.getElementById("lineNumber").value);
    if (!lineNumber || lineNumber < 1) return;

    const lines = this.editor.value.split("\n");
    if (lineNumber > lines.length) return;

    let position = 0;
    for (let i = 0; i < lineNumber - 1; i++) {
      position += lines[i].length + 1; // +1 for newline
    }

    this.editor.setSelectionRange(position, position);
    this.editor.focus();
    this.updateCursorPosition();
    this.closeGoToLineModal();
  }

  clearSearchHighlights() {
    // Clear any search highlighting
    this.searchResults = [];
    this.currentSearchIndex = 0;
  }

  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  getFileName(filePath) {
    if (!filePath) return "Untitled";
    return filePath.split(/[/\\]/).pop();
  }

  showError(message) {
    // Simple error display - could be enhanced with a proper modal
    alert(message);
  }

  exit() {
    ipcRenderer.send("exit-app");
  }
}

// Initialize the editor when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  editorInstance = new WritersGUIEditor();
});

// Global modal functions (called from HTML)
window.closeFindModal = function () {
  document.getElementById("findModal").style.display = "none";
  document.getElementById("editor").focus();
};

window.closeReplaceModal = function () {
  document.getElementById("replaceModal").style.display = "none";
  document.getElementById("editor").focus();
};

window.closeGoToLineModal = function () {
  document.getElementById("goToLineModal").style.display = "none";
  document.getElementById("editor").focus();
};

window.closeWordCountModal = function () {
  document.getElementById("wordCountModal").style.display = "none";
  document.getElementById("editor").focus();
};

window.closeHelpModal = function () {
  document.getElementById("helpModal").style.display = "none";
  document.getElementById("editor").focus();
};

// Store editor instance globally for modal functions
let editorInstance;

window.findNext = function () {
  if (editorInstance) editorInstance.findNext();
};

window.findPrevious = function () {
  if (editorInstance) editorInstance.findPrevious();
};

window.replaceNext = function () {
  if (editorInstance) editorInstance.replaceNext();
};

window.replaceAll = function () {
  if (editorInstance) editorInstance.replaceAll();
};

window.goToLine = function () {
  if (editorInstance) editorInstance.goToLine();
};
