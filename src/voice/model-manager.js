const { pipeline } = require("@xenova/transformers");
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const EventEmitter = require("events");

/**
 * Voice Model Manager - Handles downloading, switching, and managing Whisper models
 */
class VoiceModelManager extends EventEmitter {
  constructor() {
    super();
    this.modelsCache = new Map();
    this.currentModel = null;
    this.currentModelId = null;
    this.downloadInProgress = new Set();
    this.configPath = path.join(process.cwd(), ".writers-enhanced.json");
    this.modelCachePath = path.join(process.cwd(), ".writers-cache", "models");

    // Ensure cache directory exists
    this.ensureCacheDirectory();
  }

  /**
   * Ensure model cache directory exists
   */
  ensureCacheDirectory() {
    if (!fs.existsSync(this.modelCachePath)) {
      fs.mkdirSync(this.modelCachePath, { recursive: true });
    }
  }

  /**
   * Load configuration from .writers-enhanced.json
   */
  loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const configData = fs.readFileSync(this.configPath, "utf8");
        return JSON.parse(configData);
      }
    } catch (error) {
      console.error(chalk.red("Failed to load configuration:"), error.message);
    }
    return null;
  }

  /**
   * Save configuration to .writers-enhanced.json
   */
  saveConfig(config) {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
      return true;
    } catch (error) {
      console.error(chalk.red("Failed to save configuration:"), error.message);
      return false;
    }
  }

  /**
   * Get list of available models
   */
  getAvailableModels() {
    const config = this.loadConfig();
    if (config && config.features && config.features.voice) {
      return config.features.voice.availableModels || {};
    }
    return {};
  }

  /**
   * Get current model configuration
   */
  getCurrentModelConfig() {
    const config = this.loadConfig();
    if (config && config.features && config.features.voice) {
      const currentModelId = config.features.voice.currentModel;
      const availableModels = config.features.voice.availableModels || {};
      return {
        id: currentModelId,
        config: availableModels[currentModelId] || null
      };
    }
    return { id: null, config: null };
  }

  /**
   * Check if a model is downloaded
   */
  isModelDownloaded(modelId) {
    const models = this.getAvailableModels();
    return models[modelId] && models[modelId].downloaded;
  }

  /**
   * Mark model as downloaded in config
   */
  markModelAsDownloaded(modelId) {
    const config = this.loadConfig();
    if (config && config.features && config.features.voice && config.features.voice.availableModels) {
      config.features.voice.availableModels[modelId].downloaded = true;
      return this.saveConfig(config);
    }
    return false;
  }

  /**
   * Set current model in config
   */
  setCurrentModel(modelId) {
    const config = this.loadConfig();
    if (config && config.features && config.features.voice) {
      config.features.voice.currentModel = modelId;
      return this.saveConfig(config);
    }
    return false;
  }

  /**
   * Download and initialize a model
   */
  async downloadModel(modelId, options = {}) {
    const { onProgress, force = false } = options;

    // Check if already downloaded and not forcing
    if (!force && this.isModelDownloaded(modelId)) {
      console.log(chalk.green(`✅ Model ${modelId} already downloaded`));
      return true;
    }

    // Check if download is already in progress
    if (this.downloadInProgress.has(modelId)) {
      console.log(chalk.yellow(`⏳ Model ${modelId} download already in progress`));
      return false;
    }

    const models = this.getAvailableModels();
    const modelConfig = models[modelId];

    if (!modelConfig) {
      throw new Error(`Unknown model: ${modelId}`);
    }

    this.downloadInProgress.add(modelId);
    this.emit("downloadStarted", { modelId, modelConfig });

    try {
      console.log(chalk.blue(`🔄 Downloading ${modelConfig.name} (${modelConfig.size})...`));

      if (onProgress) {
        onProgress(0, `Starting download of ${modelConfig.name}...`);
      }

      // Create a progress callback for the pipeline
      const progressCallback = (progress) => {
        const percentage = Math.round(progress * 100);
        console.log(chalk.blue(`📥 Download progress: ${percentage}%`));

        if (onProgress) {
          onProgress(percentage, `Downloading ${modelConfig.name}... ${percentage}%`);
        }

        this.emit("downloadProgress", { modelId, percentage, modelConfig });
      };

      // Download and initialize the model
      const model = await pipeline(
        "automatic-speech-recognition",
        modelConfig.path,
        {
          chunk_length_s: 30,
          stride_length_s: 5,
          progress_callback: progressCallback
        }
      );

      // Cache the model
      this.modelsCache.set(modelId, model);

      // Mark as downloaded in config
      this.markModelAsDownloaded(modelId);

      console.log(chalk.green(`✅ Successfully downloaded ${modelConfig.name}`));

      if (onProgress) {
        onProgress(100, `${modelConfig.name} ready to use`);
      }

      this.emit("downloadCompleted", { modelId, modelConfig });
      return true;

    } catch (error) {
      console.error(chalk.red(`❌ Failed to download ${modelConfig.name}:`), error.message);

      if (onProgress) {
        onProgress(-1, `Download failed: ${error.message}`);
      }

      this.emit("downloadFailed", { modelId, modelConfig, error });
      throw error;
    } finally {
      this.downloadInProgress.delete(modelId);
    }
  }

  /**
   * Load a model (download if necessary)
   */
  async loadModel(modelId, options = {}) {
    // Check if model is already loaded in cache
    if (this.modelsCache.has(modelId)) {
      console.log(chalk.green(`🚀 Using cached model: ${modelId}`));
      this.currentModel = this.modelsCache.get(modelId);
      this.currentModelId = modelId;
      this.setCurrentModel(modelId);
      return this.currentModel;
    }

    // Download model if not already downloaded
    if (!this.isModelDownloaded(modelId)) {
      await this.downloadModel(modelId, options);
    }

    // Load from cache (should be available after download)
    if (this.modelsCache.has(modelId)) {
      this.currentModel = this.modelsCache.get(modelId);
      this.currentModelId = modelId;
      this.setCurrentModel(modelId);
      return this.currentModel;
    }

    // If still not in cache, try to load directly
    const models = this.getAvailableModels();
    const modelConfig = models[modelId];

    if (!modelConfig) {
      throw new Error(`Unknown model: ${modelId}`);
    }

    console.log(chalk.blue(`🔄 Loading model: ${modelConfig.name}...`));

    try {
      const model = await pipeline(
        "automatic-speech-recognition",
        modelConfig.path,
        {
          chunk_length_s: 30,
          stride_length_s: 5,
        }
      );

      this.modelsCache.set(modelId, model);
      this.currentModel = model;
      this.currentModelId = modelId;
      this.setCurrentModel(modelId);

      console.log(chalk.green(`✅ Model loaded: ${modelConfig.name}`));
      return model;

    } catch (error) {
      console.error(chalk.red(`❌ Failed to load model ${modelConfig.name}:`), error.message);
      throw error;
    }
  }

  /**
   * Switch to a different model
   */
  async switchModel(modelId, options = {}) {
    if (this.currentModelId === modelId && this.currentModel) {
      console.log(chalk.yellow(`⚠️ Already using model: ${modelId}`));
      return this.currentModel;
    }

    console.log(chalk.blue(`🔄 Switching to model: ${modelId}`));
    this.emit("modelSwitchStarted", { fromModel: this.currentModelId, toModel: modelId });

    try {
      const model = await this.loadModel(modelId, options);
      this.emit("modelSwitched", { fromModel: this.currentModelId, toModel: modelId });
      return model;
    } catch (error) {
      this.emit("modelSwitchFailed", { fromModel: this.currentModelId, toModel: modelId, error });
      throw error;
    }
  }

  /**
   * Get current loaded model
   */
  getCurrentModel() {
    return {
      id: this.currentModelId,
      model: this.currentModel
    };
  }

  /**
   * Get model statistics
   */
  getModelStats() {
    const models = this.getAvailableModels();
    const stats = {
      total: Object.keys(models).length,
      downloaded: 0,
      totalSize: 0,
      downloadedSize: 0,
      languages: new Set(),
      accuracyLevels: new Set()
    };

    Object.entries(models).forEach(([id, config]) => {
      const sizeInMB = parseInt(config.size.replace("MB", ""));
      stats.totalSize += sizeInMB;
      stats.languages.add(config.language);
      stats.accuracyLevels.add(config.accuracy);

      if (config.downloaded) {
        stats.downloaded++;
        stats.downloadedSize += sizeInMB;
      }
    });

    stats.languages = Array.from(stats.languages);
    stats.accuracyLevels = Array.from(stats.accuracyLevels);

    return stats;
  }

  /**
   * Delete a downloaded model
   */
  async deleteModel(modelId) {
    const models = this.getAvailableModels();
    const modelConfig = models[modelId];

    if (!modelConfig) {
      throw new Error(`Unknown model: ${modelId}`);
    }

    if (!this.isModelDownloaded(modelId)) {
      console.log(chalk.yellow(`⚠️ Model ${modelId} is not downloaded`));
      return false;
    }

    try {
      // Remove from cache
      this.modelsCache.delete(modelId);

      // If this was the current model, clear it
      if (this.currentModelId === modelId) {
        this.currentModel = null;
        this.currentModelId = null;
      }

      // Mark as not downloaded in config
      const config = this.loadConfig();
      if (config && config.features && config.features.voice && config.features.voice.availableModels) {
        config.features.voice.availableModels[modelId].downloaded = false;
        this.saveConfig(config);
      }

      console.log(chalk.green(`✅ Deleted model: ${modelConfig.name}`));
      this.emit("modelDeleted", { modelId, modelConfig });
      return true;

    } catch (error) {
      console.error(chalk.red(`❌ Failed to delete model ${modelConfig.name}:`), error.message);
      this.emit("modelDeleteFailed", { modelId, modelConfig, error });
      throw error;
    }
  }

  /**
   * Initialize the default model
   */
  async initialize() {
    const { id: currentModelId } = this.getCurrentModelConfig();

    if (currentModelId) {
      try {
        console.log(chalk.blue(`🔄 Initializing default model: ${currentModelId}`));
        await this.loadModel(currentModelId);
        return true;
      } catch (error) {
        console.error(chalk.red(`❌ Failed to initialize default model: ${error.message}`));

        // Fallback to whisper-tiny.en if available
        if (currentModelId !== "whisper-tiny.en") {
          try {
            console.log(chalk.yellow("🔄 Falling back to whisper-tiny.en..."));
            await this.loadModel("whisper-tiny.en");
            return true;
          } catch (fallbackError) {
            console.error(chalk.red(`❌ Fallback model also failed: ${fallbackError.message}`));
          }
        }
        return false;
      }
    }

    console.error(chalk.red("❌ No default model configured"));
    return false;
  }

  /**
   * Clean up resources
   */
  cleanup() {
    this.modelsCache.clear();
    this.currentModel = null;
    this.currentModelId = null;
    this.downloadInProgress.clear();
    this.removeAllListeners();
  }

  /**
   * Get download status for all models
   */
  getDownloadStatus() {
    const models = this.getAvailableModels();
    const status = {};

    Object.entries(models).forEach(([id, config]) => {
      status[id] = {
        ...config,
        isDownloading: this.downloadInProgress.has(id),
        isLoaded: this.modelsCache.has(id),
        isCurrent: this.currentModelId === id
      };
    });

    return status;
  }
}

module.exports = VoiceModelManager;
