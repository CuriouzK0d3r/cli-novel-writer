/**
 * Voice Model Manager - GUI Component
 * Handles model downloading, switching, and management in the browser
 */

class ModelManager {
  constructor() {
    this.currentConfig = null;
    this.models = {};
    this.downloadProgress = {};
    this.isModalOpen = false;
    this.refreshInterval = null;

    this.initializeElements();
    this.bindEvents();
    this.loadConfiguration();
  }

  /**
   * Initialize DOM elements
   */
  initializeElements() {
    this.elements = {
      modal: document.getElementById("modelManagerModal"),
      currentModelDisplay: document.getElementById("currentModelDisplay"),
      downloadedCount: document.getElementById("downloadedCount"),
      totalCount: document.getElementById("totalCount"),
      storageUsed: document.getElementById("storageUsed"),
      modelGrid: document.getElementById("modelGrid"),
      progressSection: document.getElementById("modelProgress"),
      progressText: document.getElementById("progressText"),
      progressPercent: document.getElementById("progressPercent"),
      progressFill: document.getElementById("progressFill"),
      managerBtn: document.getElementById("modelManagerBtn"),
    };
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Close modal when clicking outside
    if (this.elements.modal) {
      this.elements.modal.addEventListener("click", (e) => {
        if (e.target === this.elements.modal) {
          this.closeModal();
        }
      });
    }

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isModalOpen) {
        this.closeModal();
      }
    });
  }

  /**
   * Load configuration from backend
   */
  async loadConfiguration() {
    try {
      const response = await fetch("http://localhost:3002/api/voice/config");
      if (response.ok) {
        this.currentConfig = await response.json();
        this.models = this.currentConfig.features?.voice?.availableModels || {};
        this.updateUI();
      } else {
        console.error("Failed to load voice configuration");
        this.showToast("Failed to load model configuration", "error");
      }
    } catch (error) {
      console.error("Error loading configuration:", error);
      this.showToast("Error loading configuration", "error");
    }
  }

  /**
   * Save configuration to backend
   */
  async saveConfiguration() {
    try {
      const response = await fetch("http://localhost:3002/api/voice/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(this.currentConfig),
      });

      if (!response.ok) {
        throw new Error("Failed to save configuration");
      }

      return true;
    } catch (error) {
      console.error("Error saving configuration:", error);
      this.showToast("Failed to save configuration", "error");
      return false;
    }
  }

  /**
   * Open model manager modal
   */
  openModal() {
    if (!this.elements.modal) return;

    this.isModalOpen = true;
    this.elements.modal.classList.remove("hidden");
    this.loadConfiguration(); // Refresh data
    this.startProgressPolling();

    // Focus management
    document.body.style.overflow = "hidden";
  }

  /**
   * Close model manager modal
   */
  closeModal() {
    if (!this.elements.modal) return;

    this.isModalOpen = false;
    this.elements.modal.classList.add("hidden");
    this.stopProgressPolling();

    // Restore focus
    document.body.style.overflow = "";
    if (this.elements.managerBtn) {
      this.elements.managerBtn.focus();
    }
  }

  /**
   * Update the entire UI
   */
  updateUI() {
    this.updateCurrentModelDisplay();
    this.updateModelStats();
    this.updateModelGrid();
  }

  /**
   * Update current model display
   */
  updateCurrentModelDisplay() {
    if (!this.elements.currentModelDisplay || !this.currentConfig) return;

    const currentModelId = this.currentConfig.features?.voice?.currentModel;
    const currentModel = this.models[currentModelId];

    if (currentModel) {
      this.elements.currentModelDisplay.innerHTML = `
        <div class="model-name">${currentModel.name}</div>
        <div class="model-size">${currentModel.size}</div>
        <div class="model-status current">Active</div>
      `;
    } else {
      this.elements.currentModelDisplay.innerHTML = `
        <div class="model-name">No model selected</div>
        <div class="model-size">--</div>
        <div class="model-status not-downloaded">None</div>
      `;
    }
  }

  /**
   * Update model statistics
   */
  updateModelStats() {
    if (
      !this.elements.downloadedCount ||
      !this.elements.totalCount ||
      !this.elements.storageUsed
    )
      return;

    const totalModels = Object.keys(this.models).length;
    let downloadedCount = 0;
    let totalStorage = 0;

    Object.values(this.models).forEach((model) => {
      if (model.downloaded) {
        downloadedCount++;
        totalStorage += parseInt(model.size.replace("MB", ""));
      }
    });

    this.elements.downloadedCount.textContent = downloadedCount;
    this.elements.totalCount.textContent = totalModels;
    this.elements.storageUsed.textContent = `${totalStorage} MB`;
  }

  /**
   * Update model grid
   */
  updateModelGrid() {
    if (!this.elements.modelGrid) return;

    const currentModelId = this.currentConfig.features?.voice?.currentModel;
    this.elements.modelGrid.innerHTML = "";

    Object.entries(this.models).forEach(([modelId, model]) => {
      const modelCard = this.createModelCard(
        modelId,
        model,
        modelId === currentModelId,
      );
      this.elements.modelGrid.appendChild(modelCard);
    });
  }

  /**
   * Create a model card element
   */
  createModelCard(modelId, model, isCurrent) {
    const card = document.createElement("div");
    card.className = `model-grid-item ${isCurrent ? "current" : ""}`;

    const isDownloading = this.downloadProgress[modelId];
    if (isDownloading) {
      card.classList.add("downloading");
    }

    card.innerHTML = `
      <div class="model-item-header">
        <div class="model-item-name">${model.name}</div>
        <div class="model-item-status ${this.getStatusClass(model, isCurrent, isDownloading)}">
          ${this.getStatusText(model, isCurrent, isDownloading)}
        </div>
      </div>

      <div class="model-item-details">
        <div class="model-item-specs">
          <div class="model-item-spec">
            <div class="spec-label">Size</div>
            <div class="spec-value">${model.size}</div>
          </div>
          <div class="model-item-spec">
            <div class="spec-label">Language</div>
            <div class="spec-value">${model.language === "en" ? "English" : "Multi"}</div>
          </div>
          <div class="model-item-spec">
            <div class="spec-label">Accuracy</div>
            <div class="spec-value">${model.accuracy}</div>
          </div>
          <div class="model-item-spec">
            <div class="spec-label">Speed</div>
            <div class="spec-value">${model.speed}</div>
          </div>
        </div>
      </div>

      <div class="model-actions">
        ${this.getActionButtons(modelId, model, isCurrent, isDownloading)}
      </div>
    `;

    return card;
  }

  /**
   * Get status class for model
   */
  getStatusClass(model, isCurrent, isDownloading) {
    if (isDownloading) return "downloading";
    if (isCurrent) return "current";
    if (model.downloaded) return "downloaded";
    return "not-downloaded";
  }

  /**
   * Get status text for model
   */
  getStatusText(model, isCurrent, isDownloading) {
    if (isDownloading) return "Downloading";
    if (isCurrent) return "Active";
    if (model.downloaded) return "Ready";
    return "Available";
  }

  /**
   * Get action buttons for model
   */
  getActionButtons(modelId, model, isCurrent, isDownloading) {
    if (isDownloading) {
      return `
        <button class="model-action-btn secondary" disabled>
          Downloading...
        </button>
      `;
    }

    if (isCurrent) {
      return `
        <button class="model-action-btn secondary" disabled>
          Currently Active
        </button>
        ${
          model.downloaded
            ? `
          <button class="model-action-btn danger" onclick="modelManager.deleteModel('${modelId}')">
            Delete
          </button>
        `
            : ""
        }
      `;
    }

    if (model.downloaded) {
      return `
        <button class="model-action-btn primary" onclick="modelManager.switchToModel('${modelId}')">
          Switch to This
        </button>
        <button class="model-action-btn danger" onclick="modelManager.deleteModel('${modelId}')">
          Delete
        </button>
      `;
    }

    return `
      <button class="model-action-btn primary" onclick="modelManager.downloadModel('${modelId}')">
        Download & Use
      </button>
    `;
  }

  /**
   * Download a model
   */
  async downloadModel(modelId) {
    const model = this.models[modelId];
    if (!model) {
      this.showToast("Model not found", "error");
      return;
    }

    try {
      this.downloadProgress[modelId] = { progress: 0, status: "starting" };
      this.updateModelGrid();
      this.showProgressSection(`Downloading ${model.name}...`, 0);

      const response = await fetch(
        "http://localhost:3002/api/voice/models/download",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ modelId }),
        },
      );

      if (!response.ok) {
        throw new Error("Download failed");
      }

      // The actual download progress will be updated via polling
      this.showToast(`Started downloading ${model.name}`, "success");
    } catch (error) {
      console.error("Download error:", error);
      this.showToast(`Failed to start download: ${error.message}`, "error");
      delete this.downloadProgress[modelId];
      this.updateModelGrid();
      this.hideProgressSection();
    }
  }

  /**
   * Switch to a model
   */
  async switchToModel(modelId) {
    const model = this.models[modelId];
    if (!model) {
      this.showToast("Model not found", "error");
      return;
    }

    if (!model.downloaded) {
      this.showToast("Model not downloaded", "error");
      return;
    }

    try {
      this.showProgressSection(`Switching to ${model.name}...`, -1);

      const response = await fetch(
        "http://localhost:3002/api/voice/models/switch",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ modelId }),
        },
      );

      if (!response.ok) {
        throw new Error("Switch failed");
      }

      // Update configuration
      this.currentConfig.features.voice.currentModel = modelId;
      await this.saveConfiguration();

      this.updateUI();
      this.hideProgressSection();
      this.showToast(`Switched to ${model.name}`, "success");
    } catch (error) {
      console.error("Switch error:", error);
      this.showToast(`Failed to switch model: ${error.message}`, "error");
      this.hideProgressSection();
    }
  }

  /**
   * Delete a model
   */
  async deleteModel(modelId) {
    const model = this.models[modelId];
    if (!model) {
      this.showToast("Model not found", "error");
      return;
    }

    const currentModelId = this.currentConfig.features?.voice?.currentModel;
    if (modelId === currentModelId) {
      this.showToast("Cannot delete the currently active model", "error");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete ${model.name}? This will free up ${model.size} of storage.`,
      )
    ) {
      return;
    }

    try {
      this.showProgressSection(`Deleting ${model.name}...`, -1);

      const response = await fetch(
        "http://localhost:3002/api/voice/models/delete",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ modelId }),
        },
      );

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      // Update configuration
      this.models[modelId].downloaded = false;
      await this.saveConfiguration();

      this.updateUI();
      this.hideProgressSection();
      this.showToast(`Deleted ${model.name}`, "success");
    } catch (error) {
      console.error("Delete error:", error);
      this.showToast(`Failed to delete model: ${error.message}`, "error");
      this.hideProgressSection();
    }
  }

  /**
   * Show progress section
   */
  showProgressSection(text, percent) {
    if (!this.elements.progressSection) return;

    this.elements.progressSection.classList.remove("hidden");
    if (this.elements.progressText) {
      this.elements.progressText.textContent = text;
    }

    if (percent >= 0) {
      if (this.elements.progressPercent) {
        this.elements.progressPercent.textContent = `${percent}%`;
      }
      if (this.elements.progressFill) {
        this.elements.progressFill.style.width = `${percent}%`;
      }
    } else {
      // Indeterminate progress
      if (this.elements.progressPercent) {
        this.elements.progressPercent.textContent = "";
      }
      if (this.elements.progressFill) {
        this.elements.progressFill.style.width = "50%";
        this.elements.progressFill.style.animation = "pulse 2s infinite";
      }
    }
  }

  /**
   * Hide progress section
   */
  hideProgressSection() {
    if (this.elements.progressSection) {
      this.elements.progressSection.classList.add("hidden");
    }
    if (this.elements.progressFill) {
      this.elements.progressFill.style.animation = "";
    }
  }

  /**
   * Start polling for download progress
   */
  startProgressPolling() {
    if (this.refreshInterval) return;

    this.refreshInterval = setInterval(async () => {
      if (!this.isModalOpen) return;

      try {
        const response = await fetch(
          "http://localhost:3002/api/voice/models/status",
        );
        if (response.ok) {
          const status = await response.json();
          this.updateDownloadProgress(status);
        }
      } catch (error) {
        console.error("Progress polling error:", error);
      }
    }, 1000); // Poll every second
  }

  /**
   * Stop progress polling
   */
  stopProgressPolling() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  /**
   * Update download progress from status
   */
  updateDownloadProgress(status) {
    let hasActiveDownloads = false;

    Object.keys(this.downloadProgress).forEach((modelId) => {
      const modelStatus = status[modelId];

      if (modelStatus && modelStatus.isDownloading) {
        hasActiveDownloads = true;
        const progress = modelStatus.progress || 0;

        this.downloadProgress[modelId] = {
          progress,
          status: "downloading",
        };

        const model = this.models[modelId];
        if (model) {
          this.showProgressSection(`Downloading ${model.name}...`, progress);
        }
      } else if (modelStatus && modelStatus.downloadComplete) {
        // Download completed
        this.models[modelId].downloaded = true;
        delete this.downloadProgress[modelId];
        this.updateUI();
      }
    });

    if (
      !hasActiveDownloads &&
      Object.keys(this.downloadProgress).length === 0
    ) {
      this.hideProgressSection();
    }

    // Update model grid if there are changes
    this.updateModelGrid();
  }

  /**
   * Show toast notification
   */
  showToast(message, type = "info") {
    // Try to use the main voice manager's toast system if available
    if (
      typeof window.voiceManager !== "undefined" &&
      window.voiceManager.showToast
    ) {
      window.voiceManager.showToast(message, type);
      return;
    }

    // Fallback to console and simple alert for critical errors
    console.log(`[${type.toUpperCase()}] ${message}`);
    if (type === "error") {
      alert(message);
    }
  }

  /**
   * Refresh model data
   */
  async refresh() {
    await this.loadConfiguration();
  }

  /**
   * Get model recommendations based on use case
   */
  getModelRecommendations() {
    return {
      fastest: "whisper-tiny.en",
      balanced: "whisper-base.en",
      accurate: "whisper-small.en",
      multilingual: "whisper-base",
      best: "whisper-large-v3",
    };
  }
}

// Global functions for HTML onclick handlers
function openModelManager() {
  if (window.modelManager) {
    window.modelManager.openModal();
  }
}

function closeModelManager() {
  if (window.modelManager) {
    window.modelManager.closeModal();
  }
}

// Initialize model manager when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  window.modelManager = new ModelManager();
});

// Export for module systems
if (typeof module !== "undefined" && module.exports) {
  module.exports = ModelManager;
}
