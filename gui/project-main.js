const { ipcRenderer } = require("electron");
const fs = require("fs-extra");
const path = require("path");

class WritersProjectInterface {
  constructor() {
    this.currentProject = null;
    this.currentFile = null;
    this.isModified = false;
    this.activeTab = "dashboard";
    this.activeView = "welcome-view";
    this.currentFileType = null;
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
    await this.checkForProject();
    this.updateInterface();
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

    // Editor content changes
    const editor = document.getElementById("mainEditor");
    if (editor) {
      editor.addEventListener("input", () => {
        this.markModified();
      });
    }

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
    if (!list) return;

    list.innerHTML = "";

    files.forEach((file) => {
      const li = document.createElement("li");
      li.className = "file-item";
      li.dataset.path = file.path; // Add path for active indicator

      li.innerHTML = `
                <span class="file-name">${file.name}</span>
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

      document.getElementById("mainEditor").value = content;
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
      const content = document.getElementById("mainEditor").value;
      await ipcRenderer.invoke("write-file", this.currentFile, content);
      this.markClean();
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
    document.getElementById("mainEditor").value = "";
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
    document.getElementById(modalId).style.display = "flex";
  }

  closeModal(modalId) {
    document.getElementById(modalId).style.display = "none";
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
  projectInterface.closeModal(modalId);
};

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  projectInterface = new WritersProjectInterface();
  projectInterface.init();
});

// Handle window close
window.addEventListener("beforeunload", (e) => {
  if (projectInterface && projectInterface.isModified) {
    e.preventDefault();
    e.returnValue = "";
  }
});
