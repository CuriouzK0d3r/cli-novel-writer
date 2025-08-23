const VoiceModelManager = require("./model-manager");
const VoiceTranscriber = require("./transcriber");
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");

/**
 * Voice Model API Handlers
 * Express.js route handlers for model management
 */
class VoiceApiHandlers {
  constructor() {
    this.modelManager = new VoiceModelManager();
    this.transcriber = new VoiceTranscriber();
    this.configPath = path.join(process.cwd(), ".writers-enhanced.json");

    // Track active downloads and operations
    this.activeOperations = new Map();

    // Bind methods to preserve context
    this.getConfig = this.getConfig.bind(this);
    this.saveConfig = this.saveConfig.bind(this);
    this.downloadModel = this.downloadModel.bind(this);
    this.switchModel = this.switchModel.bind(this);
    this.deleteModel = this.deleteModel.bind(this);
    this.getModelStatus = this.getModelStatus.bind(this);
    this.getAvailableModels = this.getAvailableModels.bind(this);
  }

  /**
   * Get voice configuration
   * GET /api/voice/config
   */
  async getConfig(req, res) {
    try {
      console.log(chalk.blue("📡 API: Getting voice configuration"));

      if (!fs.existsSync(this.configPath)) {
        return res.status(404).json({
          error: "Configuration file not found",
          message: "Please initialize the project first",
        });
      }

      const configData = fs.readFileSync(this.configPath, "utf8");
      const config = JSON.parse(configData);

      // Ensure voice configuration exists
      if (!config.features) {
        config.features = {};
      }
      if (!config.features.voice) {
        config.features.voice = {
          enabled: true,
          currentModel: "whisper-tiny.en",
          maxDuration: 300,
          keepAudio: false,
          autoSave: true,
          outputFormat: "markdown",
          availableModels: {},
        };
      }

      res.json(config);
    } catch (error) {
      console.error(chalk.red("❌ API Error getting config:"), error);
      res.status(500).json({
        error: "Failed to load configuration",
        message: error.message,
      });
    }
  }

  /**
   * Save voice configuration
   * POST /api/voice/config
   */
  async saveConfig(req, res) {
    try {
      console.log(chalk.blue("📡 API: Saving voice configuration"));

      const config = req.body;

      if (!config) {
        return res.status(400).json({
          error: "No configuration provided",
          message: "Request body must contain configuration data",
        });
      }

      // Validate configuration structure
      if (!config.features || !config.features.voice) {
        return res.status(400).json({
          error: "Invalid configuration",
          message: "Configuration must include features.voice section",
        });
      }

      const configJson = JSON.stringify(config, null, 2);
      fs.writeFileSync(this.configPath, configJson);

      console.log(chalk.green("✅ Configuration saved successfully"));
      res.json({ success: true, message: "Configuration saved" });
    } catch (error) {
      console.error(chalk.red("❌ API Error saving config:"), error);
      res.status(500).json({
        error: "Failed to save configuration",
        message: error.message,
      });
    }
  }

  /**
   * Download a model
   * POST /api/voice/models/download
   */
  async downloadModel(req, res) {
    try {
      const { modelId } = req.body;

      if (!modelId) {
        return res.status(400).json({
          error: "Model ID required",
          message: "Request must include modelId",
        });
      }

      console.log(chalk.blue(`📡 API: Starting download for model ${modelId}`));

      // Check if download is already in progress
      if (this.activeOperations.has(`download-${modelId}`)) {
        return res.status(409).json({
          error: "Download in progress",
          message: `Model ${modelId} is already being downloaded`,
        });
      }

      // Mark download as active
      this.activeOperations.set(`download-${modelId}`, {
        type: "download",
        modelId,
        progress: 0,
        startTime: Date.now(),
      });

      // Start download asynchronously
      this.performModelDownload(modelId).catch((error) => {
        console.error(chalk.red(`❌ Download failed for ${modelId}:`), error);
        this.activeOperations.delete(`download-${modelId}`);
      });

      res.json({
        success: true,
        message: `Started downloading ${modelId}`,
        modelId,
      });
    } catch (error) {
      console.error(chalk.red("❌ API Error starting download:"), error);
      res.status(500).json({
        error: "Failed to start download",
        message: error.message,
      });
    }
  }

  /**
   * Perform actual model download
   */
  async performModelDownload(modelId) {
    try {
      console.log(chalk.blue(`🔄 Starting download: ${modelId}`));

      const operationKey = `download-${modelId}`;

      await this.modelManager.downloadModel(modelId, {
        onProgress: (progress, message) => {
          if (this.activeOperations.has(operationKey)) {
            this.activeOperations.set(operationKey, {
              ...this.activeOperations.get(operationKey),
              progress,
              message,
              lastUpdate: Date.now(),
            });
          }
          console.log(chalk.blue(`📥 ${modelId}: ${progress}% - ${message}`));
        },
      });

      console.log(chalk.green(`✅ Download completed: ${modelId}`));

      // Mark as completed
      this.activeOperations.set(operationKey, {
        ...this.activeOperations.get(operationKey),
        progress: 100,
        completed: true,
        completedAt: Date.now(),
      });

      // Clean up after a delay
      setTimeout(() => {
        this.activeOperations.delete(operationKey);
      }, 5000);
    } catch (error) {
      console.error(chalk.red(`❌ Download failed: ${modelId}`), error);
      this.activeOperations.delete(`download-${modelId}`);
      throw error;
    }
  }

  /**
   * Switch to a different model
   * POST /api/voice/models/switch
   */
  async switchModel(req, res) {
    try {
      const { modelId } = req.body;

      if (!modelId) {
        return res.status(400).json({
          error: "Model ID required",
          message: "Request must include modelId",
        });
      }

      console.log(chalk.blue(`📡 API: Switching to model ${modelId}`));

      // Check if model is available
      const availableModels = this.modelManager.getAvailableModels();
      if (!availableModels[modelId]) {
        return res.status(404).json({
          error: "Model not found",
          message: `Model ${modelId} is not available`,
        });
      }

      // Check if model is downloaded
      if (!this.modelManager.isModelDownloaded(modelId)) {
        return res.status(400).json({
          error: "Model not downloaded",
          message: `Model ${modelId} must be downloaded first`,
        });
      }

      // Switch model in transcriber
      await this.transcriber.switchModel(modelId);

      // Update configuration
      this.modelManager.setCurrentModel(modelId);

      console.log(chalk.green(`✅ Switched to model: ${modelId}`));

      res.json({
        success: true,
        message: `Switched to ${modelId}`,
        modelId,
        currentModel: this.modelManager.getCurrentModelConfig(),
      });
    } catch (error) {
      console.error(chalk.red("❌ API Error switching model:"), error);
      res.status(500).json({
        error: "Failed to switch model",
        message: error.message,
      });
    }
  }

  /**
   * Delete a model
   * POST /api/voice/models/delete
   */
  async deleteModel(req, res) {
    try {
      const { modelId } = req.body;

      if (!modelId) {
        return res.status(400).json({
          error: "Model ID required",
          message: "Request must include modelId",
        });
      }

      console.log(chalk.blue(`📡 API: Deleting model ${modelId}`));

      // Check if model exists
      const availableModels = this.modelManager.getAvailableModels();
      if (!availableModels[modelId]) {
        return res.status(404).json({
          error: "Model not found",
          message: `Model ${modelId} is not available`,
        });
      }

      // Check if it's the current model
      const currentConfig = this.modelManager.getCurrentModelConfig();
      if (currentConfig.id === modelId) {
        return res.status(400).json({
          error: "Cannot delete current model",
          message: "Switch to a different model before deleting this one",
        });
      }

      // Delete the model
      await this.modelManager.deleteModel(modelId);

      console.log(chalk.green(`✅ Deleted model: ${modelId}`));

      res.json({
        success: true,
        message: `Deleted ${modelId}`,
        modelId,
      });
    } catch (error) {
      console.error(chalk.red("❌ API Error deleting model:"), error);
      res.status(500).json({
        error: "Failed to delete model",
        message: error.message,
      });
    }
  }

  /**
   * Get model download/operation status
   * GET /api/voice/models/status
   */
  async getModelStatus(req, res) {
    try {
      const availableModels = this.modelManager.getAvailableModels();
      const currentConfig = this.modelManager.getCurrentModelConfig();
      const status = {};

      // Get basic model information
      Object.entries(availableModels).forEach(([modelId, model]) => {
        status[modelId] = {
          ...model,
          isCurrent: currentConfig.id === modelId,
          isDownloading: false,
          progress: 0,
          downloadComplete: model.downloaded,
        };
      });

      // Add active operation status
      this.activeOperations.forEach((operation, key) => {
        if (key.startsWith("download-")) {
          const modelId = key.replace("download-", "");
          if (status[modelId]) {
            status[modelId].isDownloading = !operation.completed;
            status[modelId].progress = operation.progress || 0;
            status[modelId].downloadComplete = operation.completed || false;
            status[modelId].message = operation.message;
          }
        }
      });

      res.json(status);
    } catch (error) {
      console.error(chalk.red("❌ API Error getting status:"), error);
      res.status(500).json({
        error: "Failed to get model status",
        message: error.message,
      });
    }
  }

  /**
   * Get available models list
   * GET /api/voice/models
   */
  async getAvailableModels(req, res) {
    try {
      console.log(chalk.blue("📡 API: Getting available models"));

      const models = this.modelManager.getAvailableModels();
      const currentConfig = this.modelManager.getCurrentModelConfig();
      const stats = this.modelManager.getModelStats();

      res.json({
        models,
        current: currentConfig,
        stats,
        recommendations: {
          fastest: "whisper-tiny.en",
          balanced: "whisper-base.en",
          accurate: "whisper-small.en",
          multilingual: "whisper-base",
          best: "whisper-large-v3",
        },
      });
    } catch (error) {
      console.error(chalk.red("❌ API Error getting models:"), error);
      res.status(500).json({
        error: "Failed to get available models",
        message: error.message,
      });
    }
  }

  /**
   * Initialize voice system and default model
   * POST /api/voice/initialize
   */
  async initializeVoice(req, res) {
    try {
      console.log(chalk.blue("📡 API: Initializing voice system"));

      // Initialize model manager
      const success = await this.modelManager.initialize();

      if (success) {
        const currentModel = this.modelManager.getCurrentModelConfig();
        res.json({
          success: true,
          message: "Voice system initialized",
          currentModel,
        });
      } else {
        res.status(500).json({
          success: false,
          error: "Failed to initialize voice system",
          message: "Could not load default model",
        });
      }
    } catch (error) {
      console.error(chalk.red("❌ API Error initializing voice:"), error);
      res.status(500).json({
        error: "Failed to initialize voice system",
        message: error.message,
      });
    }
  }

  /**
   * Get system requirements and compatibility
   * GET /api/voice/system
   */
  async getSystemInfo(req, res) {
    try {
      console.log(chalk.blue("📡 API: Getting system information"));

      // Get compatibility info with fallbacks
      let compatibility = {
        isReady: true,
        fullSupport: false,
        issues: [],
        recommendations: [],
      };

      try {
        if (
          this.transcriber &&
          typeof this.transcriber.checkSystemCompatibility === "function"
        ) {
          compatibility = await this.transcriber.checkSystemCompatibility();
        }
      } catch (compatError) {
        console.warn(
          chalk.yellow(
            "⚠️ Could not check system compatibility:",
            compatError.message,
          ),
        );
        compatibility.recommendations = [
          "System compatibility check unavailable",
        ];
      }

      // Get model stats with fallbacks
      let modelStats = {
        total: 0,
        downloaded: 0,
        totalSize: 0,
        downloadedSize: 0,
        languages: [],
        accuracyLevels: [],
      };

      try {
        if (
          this.modelManager &&
          typeof this.modelManager.getModelStats === "function"
        ) {
          modelStats = this.modelManager.getModelStats();
        }
      } catch (statsError) {
        console.warn(
          chalk.yellow("⚠️ Could not get model stats:", statsError.message),
        );
      }

      res.json({
        compatibility,
        modelStats,
        system: {
          node: process.version,
          platform: process.platform,
          arch: process.arch,
        },
      });
    } catch (error) {
      console.error(chalk.red("❌ API Error getting system info:"), error);
      res.status(500).json({
        error: "Failed to get system information",
        message: error.message,
      });
    }
  }

  /**
   * Setup Express.js routes
   */
  setupRoutes(app) {
    console.log(chalk.blue("🔧 Setting up voice API routes"));

    // Configuration routes
    app.get("/api/voice/config", this.getConfig);
    app.post("/api/voice/config", this.saveConfig);

    // Model management routes
    app.get("/api/voice/models", this.getAvailableModels);
    app.get("/api/voice/models/status", this.getModelStatus);
    app.post("/api/voice/models/download", this.downloadModel);
    app.post("/api/voice/models/switch", this.switchModel);
    app.post("/api/voice/models/delete", this.deleteModel);

    // System routes
    app.post("/api/voice/initialize", this.initializeVoice);
    app.get("/api/voice/system", this.getSystemInfo);

    console.log(chalk.green("✅ Voice API routes configured"));
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    if (this.modelManager) {
      this.modelManager.cleanup();
    }
    if (this.transcriber) {
      this.transcriber.cleanup();
    }
    this.activeOperations.clear();
  }
}

module.exports = VoiceApiHandlers;
