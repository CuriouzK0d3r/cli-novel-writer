const { ipcRenderer } = require("electron");
const fs = require("fs-extra");
const path = require("path");

// Import the advanced editor functionality
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
  }

  init() {
    this.setupEventListeners();
    this.startAutoSave();
    this.updateStatus();
    this.pushUndo();
  }

  setupEventListeners() {
    if (!this.editor) return;

    // Editor focus and content changes
    this.editor.addEventListener("input", () => {
      this.markDirty();
      this.updateStatus();
      this.pushUndo();
    });

    this.editor.addEventListener("click", () => {
      this.updateCursorPosition();
    });

    this.editor.addEventListener("keyup", () => {
      this.updateCursorPosition();
    });

    // Handle key combinations
    this.editor.addEventListener("keydown", (e) => {
      this.handleKeydown(e);
    });

    // Handle selection changes
    document.addEventListener("selectionchange", () => {
      this.updateCursorPosition();
    });
  }

  handleKeydown(e) {
    // Navigation mode keybindings
    if (this.mode === "navigation") {
      e.preventDefault();
      this.handleNavigationMode(e);
      return;
    }

    // Insert mode keybindings
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case "s":
          e.preventDefault();
          window.projectInterface.saveCurrentFile();
          break;
        case "f":
          e.preventDefault();
          this.showFindModal();
          break;
        case "r":
          e.preventDefault();
          this.showReplaceModal();
          break;
        case "g":
          e.preventDefault();
          this.showGoToLineModal();
          break;
        case "w":
          e.preventDefault();
          this.showWordCountModal();
          break;
        case "z":
          e.preventDefault();
          this.undo();
          break;
        case "y":
          e.preventDefault();
          this.redo();
          break;
        case "a":
          e.preventDefault();
          this.selectAll();
          break;
      }
    }

    // F1 for help
    if (e.key === "F1") {
      e.preventDefault();
      this.showHelpModal();
    }

    // Toggle modes
    if (e.key === "Escape") {
      e.preventDefault();
      this.setMode(this.mode === "navigation" ? "insert" : "navigation");
    }

    // Enter insert mode from navigation
    if (this.mode === "navigation" && (e.key === "i" || e.key === "a")) {
      e.preventDefault();
      this.setMode("insert");
      if (e.key === "a") {
        this.moveCursor("right");
      }
    }

    // F11 for distraction-free mode
    if (e.key === "F11") {
      e.preventDefault();
      this.toggleDistractionFree();
    }
  }

  handleNavigationMode(e) {
    switch (e.key) {
      case "h":
        this.moveCursor("left");
        break;
      case "j":
        this.moveCursor("down");
        break;
      case "k":
        this.moveCursor("up");
        break;
      case "l":
        this.moveCursor("right");
        break;
      case "w":
        this.moveCursor("wordForward");
        break;
      case "b":
        this.moveCursor("wordBackward");
        break;
      case "0":
        this.moveCursor("lineStart");
        break;
      case "$":
        this.moveCursor("lineEnd");
        break;
      case "G":
        if (e.shiftKey) {
          this.moveCursor("documentEnd");
        }
        break;
      case "g":
        if (this.lastKey === "g") {
          this.moveCursor("documentStart");
        }
        break;
      case "i":
        this.setMode("insert");
        break;
      case "a":
        this.setMode("insert");
        this.moveCursor("right");
        break;
    }
    this.lastKey = e.key;
  }

  moveCursor(direction) {
    const start = this.editor.selectionStart;
    const text = this.editor.value;
    let newPos = start;

    switch (direction) {
      case "left":
        newPos = Math.max(0, start - 1);
        break;
      case "right":
        newPos = Math.min(text.length, start + 1);
        break;
      case "up":
        newPos = this.moveVertical(-1);
        break;
      case "down":
        newPos = this.moveVertical(1);
        break;
      case "wordForward":
        newPos = this.findNextWord(start);
        break;
      case "wordBackward":
        newPos = this.findPreviousWord(start);
        break;
      case "lineStart":
        newPos = this.findLineStart(start);
        break;
      case "lineEnd":
        newPos = this.findLineEnd(start);
        break;
      case "documentStart":
        newPos = 0;
        break;
      case "documentEnd":
        newPos = text.length;
        break;
    }

    this.editor.setSelectionRange(newPos, newPos);
    this.updateCursorPosition();
  }

  moveVertical(direction) {
    const text = this.editor.value;
    const start = this.editor.selectionStart;
    const lines = text.substring(0, start).split("\n");
    const currentLine = lines.length - 1;
    const currentCol = lines[currentLine].length;
    const targetLine = currentLine + direction;

    if (targetLine < 0) return 0;

    const allLines = text.split("\n");
    if (targetLine >= allLines.length) return text.length;

    const targetLineText = allLines[targetLine];
    const targetCol = Math.min(currentCol, targetLineText.length);

    let pos = 0;
    for (let i = 0; i < targetLine; i++) {
      pos += allLines[i].length + 1; // +1 for newline
    }
    pos += targetCol;

    return Math.min(pos, text.length);
  }

  findNextWord(pos) {
    const text = this.editor.value;
    let i = pos;
    while (i < text.length && /\s/.test(text[i])) i++;
    while (i < text.length && !/\s/.test(text[i])) i++;
    return i;
  }

  findPreviousWord(pos) {
    const text = this.editor.value;
    let i = pos - 1;
    while (i >= 0 && /\s/.test(text[i])) i--;
    while (i >= 0 && !/\s/.test(text[i])) i--;
    return i + 1;
  }

  findLineStart(pos) {
    const text = this.editor.value;
    let i = pos;
    while (i > 0 && text[i - 1] !== "\n") i--;
    return i;
  }

  findLineEnd(pos) {
    const text = this.editor.value;
    let i = pos;
    while (i < text.length && text[i] !== "\n") i++;
    return i;
  }

  setMode(mode) {
    this.mode = mode;
    if (this.modeIndicator) {
      this.modeIndicator.textContent = mode.toUpperCase();
      this.modeIndicator.className = `mode-indicator ${mode}`;
    }
  }

  markDirty() {
    this.isModified = true;
    if (this.saveStatus) {
      this.saveStatus.textContent = "Modified";
    }
    if (window.projectInterface) {
      window.projectInterface.markModified();
    }
  }

  markClean() {
    this.isModified = false;
    if (this.saveStatus) {
      this.saveStatus.textContent = "Saved";
    }
  }

  newFile() {
    this.editor.value = "";
    this.currentFile = null;
    this.isModified = false;
    this.markClean();
    this.updateStatus();
    this.pushUndo();
  }

  loadFile(data) {
    this.editor.value = data.content || "";
    this.currentFile = data.filePath;
    this.isModified = false;
    this.markClean();
    this.updateStatus();
    this.pushUndo();
    if (this.fileInfo) {
      this.fileInfo.textContent = data.filePath
        ? path.basename(data.filePath)
        : "No file open";
    }
  }

  pushUndo() {
    const state = {
      content: this.editor.value,
      cursor: this.editor.selectionStart,
    };

    if (this.undoStack.length > 0) {
      const lastState = this.undoStack[this.undoStack.length - 1];
      if (lastState.content === state.content) {
        return;
      }
    }

    this.undoStack.push(state);
    if (this.undoStack.length > this.maxUndoSteps) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  undo() {
    if (this.undoStack.length > 1) {
      this.redoStack.push(this.undoStack.pop());
      const state = this.undoStack[this.undoStack.length - 1];
      this.editor.value = state.content;
      this.editor.setSelectionRange(state.cursor, state.cursor);
      this.markDirty();
      this.updateStatus();
    }
  }

  redo() {
    if (this.redoStack.length > 0) {
      const state = this.redoStack.pop();
      this.undoStack.push(state);
      this.editor.value = state.content;
      this.editor.setSelectionRange(state.cursor, state.cursor);
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
    const lines = text.split("\n").length;

    if (this.wordCount) {
      this.wordCount.textContent = `${words} words`;
    }
    if (this.charCount) {
      this.charCount.textContent = `${chars} characters`;
    }

    // Calculate reading time
    const readingTime = Math.ceil(words / 200);
    const readingTimeEl = document.getElementById("readingTime");
    if (readingTimeEl) {
      readingTimeEl.textContent = `${readingTime} min read`;
    }
  }

  updateCursorPosition() {
    if (!this.editor || !this.cursorPos) return;

    const text = this.editor.value;
    const pos = this.editor.selectionStart;
    const endPos = this.editor.selectionEnd;

    const lines = text.substring(0, pos).split("\n");
    const line = lines.length;
    const col = lines[line - 1].length + 1;

    this.cursorPos.textContent = `Ln ${line}, Col ${col}`;

    if (this.selection && pos !== endPos) {
      const selectedText = text.substring(pos, endPos);
      const selectedWords = selectedText.trim()
        ? selectedText.trim().split(/\s+/).length
        : 0;
      this.selection.textContent = `${endPos - pos} chars, ${selectedWords} words`;
    } else if (this.selection) {
      this.selection.textContent = "";
    }
  }

  startAutoSave() {
    this.autoSaveInterval = setInterval(() => {
      if (this.isModified && this.currentFile && window.projectInterface) {
        window.projectInterface.autoSave();
      }
    }, 30000);
  }

  toggleDistractionFree() {
    this.isDistractionFree = !this.isDistractionFree;
    const container = document.querySelector(".editor-container");
    if (container) {
      container.classList.toggle("distraction-free", this.isDistractionFree);
    }
  }

  showFindModal() {
    if (window.projectInterface) {
      window.projectInterface.showModal("findModal");
      setTimeout(() => {
        const input = document.getElementById("findInput");
        if (input) input.focus();
      }, 100);
    }
  }

  showReplaceModal() {
    if (window.projectInterface) {
      window.projectInterface.showModal("replaceModal");
      setTimeout(() => {
        const input = document.getElementById("replaceFind");
        if (input) input.focus();
      }, 100);
    }
  }

  showGoToLineModal() {
    if (window.projectInterface) {
      window.projectInterface.showModal("gotoLineModal");
      setTimeout(() => {
        const input = document.getElementById("gotoLineInput");
        if (input) input.focus();
      }, 100);
    }
  }

  showWordCountModal() {
    const text = this.editor.value;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    const charsNoSpaces = text.replace(/\s/g, "").length;
    const lines = text.split("\n").length;
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim()).length;

    const details = `
      <p><strong>Words:</strong> ${words}</p>
      <p><strong>Characters (with spaces):</strong> ${chars}</p>
      <p><strong>Characters (no spaces):</strong> ${charsNoSpaces}</p>
      <p><strong>Lines:</strong> ${lines}</p>
      <p><strong>Paragraphs:</strong> ${paragraphs}</p>
    `;

    const detailsEl = document.getElementById("wordCountDetails");
    if (detailsEl) {
      detailsEl.innerHTML = details;
    }

    if (window.projectInterface) {
      window.projectInterface.showModal("wordCountModal");
    }
  }

  showHelpModal() {
    if (window.projectInterface) {
      window.projectInterface.showModal("helpModal");
    }
  }

  findNext() {
    const searchText = document.getElementById("findInput")?.value;
    if (!searchText) return;

    const text = this.editor.value;
    const startPos = this.editor.selectionEnd;
    const foundPos = text.indexOf(searchText, startPos);

    if (foundPos !== -1) {
      this.editor.setSelectionRange(foundPos, foundPos + searchText.length);
      this.editor.focus();
    } else {
      // Search from beginning
      const foundFromStart = text.indexOf(searchText);
      if (foundFromStart !== -1) {
        this.editor.setSelectionRange(
          foundFromStart,
          foundFromStart + searchText.length,
        );
        this.editor.focus();
      }
    }
  }

  replaceNext() {
    const findText = document.getElementById("replaceFind")?.value;
    const replaceText = document.getElementById("replaceWith")?.value;
    if (!findText) return;

    const text = this.editor.value;
    const start = this.editor.selectionStart;
    const end = this.editor.selectionEnd;

    if (text.substring(start, end) === findText) {
      this.editor.setRangeText(replaceText, start, end);
      this.editor.setSelectionRange(start, start + replaceText.length);
      this.markDirty();
      this.updateStatus();
    }

    this.findNext();
  }

  replaceAll() {
    const findText = document.getElementById("replaceFind")?.value;
    const replaceText = document.getElementById("replaceWith")?.value;
    if (!findText) return;

    const newContent = this.editor.value.replace(
      new RegExp(this.escapeRegExp(findText), "g"),
      replaceText,
    );
    this.editor.value = newContent;
    this.markDirty();
    this.updateStatus();
    this.pushUndo();
  }

  goToLine() {
    const lineNumber = parseInt(
      document.getElementById("gotoLineInput")?.value,
    );
    if (!lineNumber) return;

    const lines = this.editor.value.split("\n");
    if (lineNumber > 0 && lineNumber <= lines.length) {
      let pos = 0;
      for (let i = 0; i < lineNumber - 1; i++) {
        pos += lines[i].length + 1;
      }
      this.editor.setSelectionRange(pos, pos);
      this.editor.focus();
      this.updateCursorPosition();
    }
  }

  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}

class WritersProjectInterface {
  constructor() {
    this.currentProject = null;
    this.currentFile = null;
    this.isModified = false;
    this.activeTab = "dashboard";
    this.activeView = "welcome-view";
    this.currentFileType = null;
    this.editorInstance = null;
    this.files = {
      chapters: [],
      scenes: [],
      characters: [],
      shortstories: [],
      notes: [],
    };
    this.stats = {
      totalWords: 0,
      totalChapters: 0,
      wordGoal: 50000,
      progress: 0,
      dailyAverage: 0,
    };
  }

  async init() {
    this.setupEventListeners();
    this.setupIPC();
    this.initializeEditor();
    await this.checkForProject();
    this.updateInterface();
  }

  initializeEditor() {
    this.editorInstance = new WritersGUIEditor();
    this.editorInstance.init();
    window.editorInstance = this.editorInstance; // Make available globally
  }

  setupEventListeners() {
    // Sidebar collapse
    document.getElementById("collapseBtn").addEventListener("click", () => {
      this.toggleSidebar();
    });

    // Tab navigation
    document.querySelectorAll(".nav-tab").forEach((tab) => {
      tab.addEventListener("click", (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // Modal close on overlay click
    document.querySelectorAll(".modal-overlay").forEach((overlay) => {
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
          this.closeModal(overlay.id);
        }
      });
    });

    // Editor content changes are now handled by WritersGUIEditor

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      this.handleKeyboardShortcuts(e);
    });

    // Auto-save timer
    setInterval(() => {
      if (this.isModified && this.currentFile) {
        this.autoSave();
      }
    }, 30000); // Auto-save every 30 seconds
  }

  setupIPC() {
    // Project operations
    ipcRenderer.on("project-loaded", (event, project) => {
      this.currentProject = project;
      this.updateInterface();
      this.loadProjectFiles();
    });

    ipcRenderer.on("file-loaded", (event, data) => {
      this.loadFileInEditor(data);
    });

    ipcRenderer.on("file-saved", (event, result) => {
      if (result.success) {
        this.markClean();
        this.showNotification("File saved successfully", "success");
      }
    });

    // Error handling
    ipcRenderer.on("error", (event, error) => {
      this.showNotification(error.message, "error");
    });
  }

  async checkForProject() {
    try {
      // Check if we're in a Writers project directory
      const isProject = await ipcRenderer.invoke("check-project");
      if (isProject) {
        const config = await ipcRenderer.invoke("get-project-config");
        this.currentProject = config;
        this.switchView("dashboard-view");
        await this.loadProjectFiles();
        this.updateInterface();
      }
    } catch (error) {
      console.log("No project found, showing welcome screen");
    }
  }

  toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const collapseBtn = document.getElementById("collapseBtn");

    sidebar.classList.toggle("collapsed");
    collapseBtn.textContent = sidebar.classList.contains("collapsed")
      ? "⟩"
      : "⟨";
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll(".nav-tab").forEach((tab) => {
      tab.classList.remove("active");
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add("active");

    // Update tab content
    document.querySelectorAll(".tab-pane").forEach((pane) => {
      pane.classList.remove("active");
    });
    document.getElementById(`${tabName}-tab`).classList.add("active");

    this.activeTab = tabName;

    // Load tab-specific content
    if (tabName === "stats") {
      this.loadStatistics();
    } else if (tabName === "settings") {
      this.loadSettings();
    }
  }

  switchView(viewName) {
    document.querySelectorAll(".content-view").forEach((view) => {
      view.classList.remove("active");
    });
    document.getElementById(viewName).classList.add("active");
    this.activeView = viewName;

    // Update main title based on view
    const titleMap = {
      "welcome-view": "Welcome to Writers CLI",
      "editor-view": this.currentFile
        ? path.basename(this.currentFile)
        : "Editor",
      "statistics-view": "Project Statistics",
    };

    document.getElementById("mainTitle").textContent =
      titleMap[viewName] || "Writers CLI";
  }

  async loadProjectFiles() {
    if (!this.currentProject) return;

    try {
      // Load files for each category
      for (const category of [
        "chapters",
        "scenes",
        "characters",
        "shortstories",
        "notes",
      ]) {
        const files = await ipcRenderer.invoke("get-files", category);
        this.files[category] = files;
        this.updateFileList(category, files);
      }

      // Update statistics
      await this.updateStatistics();
    } catch (error) {
      this.showNotification("Error loading project files", "error");
      console.error(error);
    }
  }

  updateFileList(category, files) {
    const listId =
      category === "shortstories" ? "storiesList" : `${category}List`;
    const list = document.getElementById(listId);
    if (!list) {
      console.error(`Element with ID ${listId} not found`);
      return;
    }

    // Show a message if no files are found
    if (!files || files.length === 0) {
      list.innerHTML = `
        <li class="empty-message">
          No ${category} found. Click the + button to create one.
        </li>
      `;
      return;
    }

    list.innerHTML = "";

    files.forEach((file) => {
      const li = document.createElement("li");
      li.className = "file-item";
      li.dataset.path = file.path; // Add path for active indicator

      // Format file size
      const formatSize = (bytes) => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
      };

      // Format date
      const formatDate = (date) => {
        if (!date) return "";
        return new Date(date).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      };

      li.innerHTML = `
        <div class="file-info">
          <span class="file-name">${file.name}</span>
          <div class="file-meta">
            ${file.size ? `<span class="file-size">${formatSize(file.size)}</span>` : ""}
            ${file.modified ? `<span class="file-modified" title="Last modified">${formatDate(file.modified)}</span>` : ""}
          </div>
        </div>
        <span class="file-stats">${file.words || 0}w</span>
      `;

      li.addEventListener("click", () => {
        this.openFile(file.path, category);
      });

      list.appendChild(li);
    });
  }

  async updateStatistics() {
    if (!this.currentProject) return;

    try {
      const stats = await ipcRenderer.invoke("get-project-stats");
      this.stats = stats;

      // Update dashboard stats
      document.getElementById("totalWords").textContent =
        stats.totalWords.toLocaleString();
      document.getElementById("chaptersCount").textContent =
        stats.files.chapters || 0;
      document.getElementById("dailyAverage").textContent = Math.round(
        stats.totalWords / Math.max(1, this.getDaysSinceCreation()),
      );

      // Update progress
      const progress = Math.min(100, (stats.totalWords / stats.wordGoal) * 100);
      document.getElementById("progressFill").style.width = `${progress}%`;
      document.getElementById("progressText").textContent =
        `${progress.toFixed(1)}% of goal`;

      // Update detailed stats if on stats view
      if (this.activeView === "statistics-view") {
        this.updateDetailedStatistics(stats);
      }
    } catch (error) {
      console.error("Error updating statistics:", error);
    }
  }

  updateDetailedStatistics(stats) {
    document.getElementById("detailedTotalWords").textContent =
      stats.totalWords.toLocaleString();
    document.getElementById("detailedProgress").textContent =
      `${Math.min(100, (stats.totalWords / stats.wordGoal) * 100).toFixed(1)}%`;

    const avgLength =
      stats.files.chapters > 0
        ? Math.round(stats.totalWords / stats.files.chapters)
        : 0;
    document.getElementById("avgChapterLength").textContent =
      avgLength.toLocaleString();

    const writingPace = Math.round(
      stats.totalWords / Math.max(1, this.getDaysSinceCreation()),
    );
    document.getElementById("writingPace").textContent =
      writingPace.toLocaleString();

    // Update chapter breakdown
    this.updateChapterBreakdown(stats.chapters || []);
  }

  updateChapterBreakdown(chapters) {
    const container = document.getElementById("chapterBreakdown");
    if (!container) return;

    container.innerHTML = "";

    chapters.forEach((chapter) => {
      const div = document.createElement("div");
      div.className = "chapter-item";
      div.innerHTML = `
                <div class="chapter-title">${chapter.name}</div>
                <div class="chapter-meta">
                    <span>${chapter.words} words</span>
                    <span>${this.estimateReadingTime(chapter.words)}</span>
                </div>
            `;
      div.addEventListener("click", () => {
        this.openFile(chapter.path, "chapters");
      });
      container.appendChild(div);
    });
  }

  getDaysSinceCreation() {
    if (!this.currentProject || !this.currentProject.created) return 1;
    const created = new Date(this.currentProject.created);
    const now = new Date();
    return Math.max(1, Math.ceil((now - created) / (1000 * 60 * 60 * 24)));
  }

  estimateReadingTime(words) {
    const wordsPerMinute = 200;
    const minutes = Math.ceil(words / wordsPerMinute);
    if (minutes < 60) {
      return `${minutes} min read`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m read`;
    }
  }

  async openFile(filePath, category) {
    try {
      const content = await ipcRenderer.invoke("read-file", filePath);
      this.currentFile = filePath;
      this.currentFileType = category;

      // Load file in the advanced editor
      if (this.editorInstance) {
        this.editorInstance.loadFile({
          content: content,
          filePath: filePath,
        });
      }

      this.switchView("editor-view");
      this.markClean();

      // Update active file in sidebar
      this.updateActiveFileIndicator(filePath);
    } catch (error) {
      this.showNotification("Error opening file", "error");
      console.error(error);
    }
  }

  updateActiveFileIndicator(filePath) {
    // Remove previous active indicators
    document.querySelectorAll(".file-item.active").forEach((item) => {
      item.classList.remove("active");
    });

    // Add active indicator to current file
    document.querySelectorAll(".file-item").forEach((item) => {
      if (item.dataset.path === filePath) {
        item.classList.add("active");
      }
    });
  }

  async saveCurrentFile() {
    if (!this.currentFile) return;

    try {
      const content = this.editorInstance
        ? this.editorInstance.editor.value
        : "";
      await ipcRenderer.invoke("write-file", this.currentFile, content);
      this.markClean();
      if (this.editorInstance) {
        this.editorInstance.markClean();
      }
      this.showNotification("File saved", "success");

      // Update word count and statistics
      await this.updateStatistics();
      await this.loadProjectFiles();
    } catch (error) {
      this.showNotification("Error saving file", "error");
      console.error(error);
    }
  }

  async autoSave() {
    if (this.currentFile && this.isModified) {
      await this.saveCurrentFile();
    }
  }

  closeEditor() {
    if (this.isModified) {
      if (
        !confirm("You have unsaved changes. Are you sure you want to close?")
      ) {
        return;
      }
    }

    this.currentFile = null;
    this.currentFileType = null;
    this.markClean();
    if (this.editorInstance) {
      this.editorInstance.newFile();
    }
    this.switchView("welcome-view");
  }

  markModified() {
    this.isModified = true;
    document.getElementById("editorStatus").textContent = "Modified";
  }

  markClean() {
    this.isModified = false;
    document.getElementById("editorStatus").textContent = "";
  }

  // Modal management
  showModal(modalId) {
    try {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.style.display = "flex";
        console.log(`Opened modal: ${modalId}`);

        // Force high contrast on modal inputs
        const inputs = modal.querySelectorAll('input[type="text"], textarea');
        inputs.forEach((input) => this.forceHighContrastInput(input));

        // Focus the first input if it exists
        if (inputs.length > 0) {
          setTimeout(() => inputs[0].focus(), 100);
        }
      } else {
        console.warn(`Modal not found: ${modalId}`);
      }
    } catch (error) {
      console.error(`Error showing modal ${modalId}:`, error);
    }
  }

  closeModal(modalId) {
    try {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.style.display = "none";
        console.log(`Closed modal: ${modalId}`);
      } else {
        console.warn(`Modal not found: ${modalId}`);
      }
    } catch (error) {
      console.error(`Error closing modal ${modalId}:`, error);
    }
  }

  forceHighContrastInput(input) {
    if (!input) return;

    // Force maximum contrast styling
    input.style.setProperty("background-color", "#000000", "important");
    input.style.setProperty("color", "#ffffff", "important");
    input.style.setProperty("border", "3px solid #ffffff", "important");
    input.style.setProperty("font-size", "16px", "important");
    input.style.setProperty("font-weight", "700", "important");
    input.style.setProperty("padding", "8px 12px", "important");

    // Force focus styling
    input.addEventListener("focus", () => {
      input.style.setProperty("background-color", "#222222", "important");
      input.style.setProperty("border-color", "#00ff00", "important");
      input.style.setProperty(
        "box-shadow",
        "0 0 0 5px rgba(0, 255, 0, 0.5)",
        "important",
      );
    });

    input.addEventListener("blur", () => {
      input.style.setProperty("background-color", "#000000", "important");
      input.style.setProperty("border-color", "#ffffff", "important");
      input.style.setProperty("box-shadow", "none", "important");
    });
  }

  // File creation
  createNew(type) {
    this.currentFileType = type;
    // Display name mapping for UI
    const displayNames = {
      chapter: "Chapter",
      scene: "Scene",
      character: "Character",
      shortstory: "Short Story",
      note: "Note",
    };

    document.getElementById("newFileType").textContent =
      displayNames[type] || type.charAt(0).toUpperCase() + type.slice(1);
    document.getElementById("newFileName").value = "";
    this.showModal("newFileModal");

    // Focus on input
    setTimeout(() => {
      document.getElementById("newFileName").focus();
    }, 100);
  }

  async confirmCreate() {
    const name = document.getElementById("newFileName").value.trim();
    if (!name) {
      this.showNotification("Please enter a name", "error");
      return;
    }

    try {
      const result = await ipcRenderer.invoke(
        "create-file",
        this.currentFileType,
        name,
      );
      this.closeModal("newFileModal");

      // Display name mapping for success message
      const displayNames = {
        chapter: "Chapter",
        scene: "Scene",
        character: "Character",
        shortstory: "Short Story",
        note: "Note",
      };

      this.showNotification(
        `${displayNames[this.currentFileType] || this.currentFileType} created successfully`,
        "success",
      );

      // Reload file lists and open the new file
      await this.loadProjectFiles();

      // Map type to category for opening the file
      const categoryMap = {
        chapter: "chapters",
        scene: "scenes",
        character: "characters",
        shortstory: "shortstories",
        note: "notes",
      };

      const category =
        categoryMap[this.currentFileType] || this.currentFileType;
      await this.openFile(result.path, category);
    } catch (error) {
      this.showNotification(error.message || "Error creating file", "error");
    }
  }

  // Project management
  newProject() {
    document.getElementById("projectModalTitle").textContent = "New Project";
    document.getElementById("modalProjectName").value = "";
    document.getElementById("modalAuthorName").value = "";
    document.getElementById("modalWordGoal").value = "50000";
    document.getElementById("modalGenre").value = "Fiction";
    this.showModal("projectModal");
  }

  async openProject() {
    try {
      const result = await ipcRenderer.invoke("open-project-dialog");
      if (result) {
        this.currentProject = result;
        this.switchView("dashboard-view");
        await this.loadProjectFiles();
        this.updateInterface();
        this.showNotification("Project opened successfully", "success");
      }
    } catch (error) {
      this.showNotification("Error opening project", "error");
    }
  }

  async confirmProject() {
    const name = document.getElementById("modalProjectName").value.trim();
    const author = document.getElementById("modalAuthorName").value.trim();
    const wordGoal =
      parseInt(document.getElementById("modalWordGoal").value) || 50000;
    const genre = document.getElementById("modalGenre").value;

    if (!name) {
      this.showNotification("Please enter a project name", "error");
      return;
    }

    try {
      const projectData = { name, author, wordGoal, genre };
      const result = await ipcRenderer.invoke("create-project", projectData);

      this.currentProject = result;
      this.closeModal("projectModal");
      this.switchView("dashboard-view");
      this.updateInterface();
      this.showNotification("Project created successfully", "success");
    } catch (error) {
      this.showNotification(error.message || "Error creating project", "error");
    }
  }

  async exportProject() {
    if (!this.currentProject) {
      this.showNotification("No project loaded", "error");
      return;
    }

    try {
      const result = await ipcRenderer.invoke("export-project");
      this.showNotification("Project exported successfully", "success");
    } catch (error) {
      this.showNotification("Error exporting project", "error");
    }
  }

  // Settings management
  loadSettings() {
    if (!this.currentProject) return;

    document.getElementById("projectName").value =
      this.currentProject.name || "";
    document.getElementById("authorName").value =
      this.currentProject.author || "";
    document.getElementById("wordGoal").value =
      this.currentProject.wordGoal || 50000;
    document.getElementById("genre").value =
      this.currentProject.genre || "Fiction";
  }

  async saveSettings() {
    if (!this.currentProject) return;

    const settings = {
      name: document.getElementById("projectName").value.trim(),
      author: document.getElementById("authorName").value.trim(),
      wordGoal: parseInt(document.getElementById("wordGoal").value) || 50000,
      genre: document.getElementById("genre").value,
    };

    try {
      await ipcRenderer.invoke("update-project-config", settings);
      this.currentProject = { ...this.currentProject, ...settings };
      this.updateInterface();
      this.showNotification("Settings saved successfully", "success");
    } catch (error) {
      this.showNotification("Error saving settings", "error");
    }
  }

  // Statistics view
  showStatistics() {
    this.switchView("statistics-view");
    this.updateDetailedStatistics(this.stats);
  }

  async loadStatistics() {
    const statsTab = document.getElementById("stats-tab");
    statsTab.innerHTML =
      '<div class="loading"><div class="spinner"></div>Loading statistics...</div>';

    try {
      const stats = await ipcRenderer.invoke("get-detailed-stats");
      this.renderStatistics(stats);
    } catch (error) {
      statsTab.innerHTML =
        '<div class="loading">Error loading statistics</div>';
    }
  }

  renderStatistics(stats) {
    const statsTab = document.getElementById("stats-tab");

    const html = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${stats.totalWords.toLocaleString()}</div>
                    <div class="stat-label">Total Words</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.files.chapters}</div>
                    <div class="stat-label">Chapters</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.files.characters}</div>
                    <div class="stat-label">Characters</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.files.scenes}</div>
                    <div class="stat-label">Scenes</div>
                </div>
            </div>

            <div class="section">
                <div class="section-header">
                    <div class="section-title">Recent Activity</div>
                </div>
                <div id="recentActivity"></div>
            </div>
        `;

    statsTab.innerHTML = html;
  }

  // Keyboard shortcuts
  handleKeyboardShortcuts(e) {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case "s":
          e.preventDefault();
          this.saveCurrentFile();
          break;
        case "n":
          e.preventDefault();
          if (e.shiftKey) {
            this.newProject();
          } else {
            this.createNew("chapter");
          }
          break;
        case "o":
          e.preventDefault();
          this.openProject();
          break;
        case "w":
          e.preventDefault();
          this.closeEditor();
          break;
        case "e":
          e.preventDefault();
          this.exportProject();
          break;
      }
    }

    // Escape key to close modals
    if (e.key === "Escape") {
      document.querySelectorAll(".modal-overlay").forEach((modal) => {
        if (modal.style.display === "flex") {
          this.closeModal(modal.id);
        }
      });
    }
  }

  // Interface updates
  updateInterface() {
    if (this.currentProject) {
      document.getElementById("projectTitle").textContent =
        this.currentProject.name || "Writers Project";

      // Update all project-related UI elements
      this.updateStatistics();
    }
  }

  // Notifications
  showNotification(message, type = "info") {
    // Create notification element
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Style the notification
    Object.assign(notification.style, {
      position: "fixed",
      top: "20px",
      right: "20px",
      padding: "12px 20px",
      borderRadius: "4px",
      color: "white",
      fontWeight: "500",
      zIndex: "10000",
      transition: "all 0.3s ease",
      opacity: "0",
      transform: "translateY(-20px)",
    });

    // Set background color based on type
    const colors = {
      success: "#4caf50",
      error: "#f44336",
      warning: "#ff9800",
      info: "#2196f3",
    };
    notification.style.backgroundColor = colors[type] || colors.info;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.opacity = "1";
      notification.style.transform = "translateY(0)";
    }, 10);

    // Remove after delay
    setTimeout(() => {
      notification.style.opacity = "0";
      notification.style.transform = "translateY(-20px)";
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  // Utility methods
  formatDate(date) {
    return new Date(date).toLocaleDateString();
  }

  formatTime(date) {
    return new Date(date).toLocaleTimeString();
  }

  sanitizeFileName(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim("-");
  }
}

// Global functions for HTML onclick handlers
let projectInterface;

// Advanced editor functions
window.findNext = function () {
  if (window.editorInstance) {
    window.editorInstance.findNext();
  }
};

window.replaceNext = function () {
  if (window.editorInstance) {
    window.editorInstance.replaceNext();
  }
};

window.replaceAll = function () {
  if (window.editorInstance) {
    window.editorInstance.replaceAll();
  }
};

window.goToLine = function () {
  if (window.editorInstance) {
    window.editorInstance.goToLine();
  }
  projectInterface.closeModal("gotoLineModal");
};

window.showHelp = function () {
  if (window.editorInstance) {
    window.editorInstance.showHelpModal();
  }
};

window.createNew = function (type) {
  projectInterface.createNew(type);
};

window.confirmCreate = function () {
  projectInterface.confirmCreate();
};

window.newProject = function () {
  projectInterface.newProject();
};

window.openProject = function () {
  projectInterface.openProject();
};

window.confirmProject = function () {
  projectInterface.confirmProject();
};

window.exportProject = function () {
  projectInterface.exportProject();
};

window.saveSettings = function () {
  projectInterface.saveSettings();
};

window.showStatistics = function () {
  projectInterface.showStatistics();
};

window.saveCurrentFile = function () {
  projectInterface.saveCurrentFile();
};

window.closeEditor = function () {
  projectInterface.closeEditor();
};

window.closeModal = function (modalId) {
  try {
    if (window.projectInterface) {
      window.projectInterface.closeModal(modalId);
    } else {
      console.warn("projectInterface not available, attempting direct close");
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.style.display = "none";
      }
    }
  } catch (error) {
    console.error(`Error in global closeModal for ${modalId}:`, error);
  }
};

// Setup additional modal event listeners for project interface
function setupProjectModalEventListeners() {
  // Add backup event listeners for modal close buttons
  const wordCountBtn = document.getElementById("closeWordCountBtn");
  if (wordCountBtn) {
    wordCountBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log("Project word count close button clicked");
      window.closeModal("wordCountModal");
    });
  }

  // Add click listener to modal overlay for closing
  const wordCountModal = document.getElementById("wordCountModal");
  if (wordCountModal) {
    wordCountModal.addEventListener("click", (e) => {
      if (e.target === wordCountModal) {
        console.log("Project word count modal overlay clicked");
        window.closeModal("wordCountModal");
      }
    });
  }

  // Add escape key listener for closing modals
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const visibleModals = [
        "wordCountModal",
        "findModal",
        "replaceModal",
        "helpModal",
        "newFileModal",
        "openFileModal",
      ];
      visibleModals.forEach((modalId) => {
        const modal = document.getElementById(modalId);
        if (modal && modal.style.display === "flex") {
          console.log(`Closing ${modalId} with Escape key`);
          window.closeModal(modalId);
        }
      });
    }
  });
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.projectInterface = new WritersProjectInterface();
  window.projectInterface.init();
  setupProjectModalEventListeners();
});

// Handle window close
window.addEventListener("beforeunload", (e) => {
  if (projectInterface && projectInterface.isModified) {
    e.preventDefault();
    e.returnValue = "";
  }
});
