const { pipeline } = require("@xenova/transformers");
const fs = require("fs");
const path = require("path");
const recorder = require("node-record-lpcm16");
const wav = require("wav");
const chalk = require("chalk");
const AudioProcessor = require("./audio-processor");
const VoiceModelManager = require("./model-manager");

class VoiceTranscriber {
  constructor() {
    this.transcriber = null;
    this.isRecording = false;
    this.outputPath = null;
    this.recordingStream = null;
    this.fileWriter = null;
    this.audioProcessor = new AudioProcessor();
    this.modelManager = new VoiceModelManager();
  }

  /**
   * Initialize the Whisper transcription model
   */
  async initialize(modelId = null) {
    try {
      // Initialize the model manager
      if (!this.modelManager.getCurrentModel().model) {
        await this.modelManager.initialize();
      }

      // Use specific model if requested
      if (modelId) {
        await this.modelManager.switchModel(modelId);
      }

      // Get current model from manager
      const currentModel = this.modelManager.getCurrentModel();
      if (currentModel.model) {
        this.transcriber = currentModel.model;
        console.log(chalk.green(`✅ Using model: ${currentModel.id}`));
        return this.transcriber;
      }

      throw new Error("No model available");
    } catch (error) {
      console.error(
        chalk.red("❌ Failed to initialize Whisper model:"),
        error.message,
      );
      throw error;
    }
  }

  /**
   * Start recording audio from microphone
   */
  async startRecording(outputFile = null) {
    if (this.isRecording) {
      throw new Error("Recording is already in progress");
    }

    // Create output path
    this.outputPath =
      outputFile || path.join(process.cwd(), `recording_${Date.now()}.wav`);

    console.log(chalk.blue("🎤 Starting voice recording..."));
    console.log(chalk.gray(`Recording to: ${this.outputPath}`));
    console.log(chalk.yellow("Press Ctrl+C to stop recording"));

    this.isRecording = true;

    try {
      // Create WAV file writer
      this.fileWriter = new wav.FileWriter(this.outputPath, {
        channels: 1,
        sampleRate: 16000,
        bitDepth: 16,
      });

      // Start recording
      this.recordingStream = recorder.record({
        sampleRate: 16000,
        channels: 1,
        audioType: "wav",
        silence: "5.0", // Stop after 5 seconds of silence
        threshold: 0.5,
        thresholdStart: null,
        thresholdEnd: null,
        verbose: false,
      });

      // Pipe recording to file
      this.recordingStream.stream().pipe(this.fileWriter);

      return new Promise((resolve, reject) => {
        this.recordingStream.stream().on("end", () => {
          this.isRecording = false;
          console.log(chalk.green("🛑 Recording stopped"));
          resolve(this.outputPath);
        });

        this.recordingStream.stream().on("error", (error) => {
          this.isRecording = false;
          reject(error);
        });

        // Handle manual stop
        process.on("SIGINT", () => {
          this.stopRecording();
        });
      });
    } catch (error) {
      this.isRecording = false;
      throw error;
    }
  }

  /**
   * Stop current recording
   */
  stopRecording() {
    if (!this.isRecording) {
      return;
    }

    console.log(chalk.yellow("\n🛑 Stopping recording..."));

    if (this.recordingStream) {
      this.recordingStream.stop();
      this.recordingStream = null;
    }

    if (this.fileWriter) {
      this.fileWriter.end();
      this.fileWriter = null;
    }

    this.isRecording = false;
  }

  /**
   * Transcribe audio file to text
   */
  async transcribeFile(audioPath, options = {}) {
    if (!fs.existsSync(audioPath)) {
      throw new Error(`Audio file not found: ${audioPath}`);
    }

    console.log(chalk.blue("🎯 Processing audio file..."));

    try {
      await this.initialize();

      // Validate audio file first
      const validation = this.audioProcessor.validateAudioFile(audioPath);
      if (!validation.valid) {
        throw new Error(`Invalid audio file: ${validation.issues.join(", ")}`);
      }

      // Process audio file to get raw audio data
      const audioData = await this.audioProcessor.processAudioFile(audioPath);

      console.log(chalk.blue("🤖 Transcribing with Whisper AI..."));

      // Progress callback
      if (options.progress) {
        options.progress(50); // Audio processed
      }

      // Ensure we have a transcriber
      if (!this.transcriber) {
        await this.initialize(options.modelId);
      }

      // Transcribe using processed audio data
      const result = await this.transcriber(audioData);

      if (options.progress) {
        options.progress(100); // Transcription complete
      }

      const text = result.text || "";
      const wordCount = text
        .split(/\s+/)
        .filter((word) => word.length > 0).length;

      console.log(chalk.green("✅ Transcription complete!"));

      return {
        text,
        wordCount,
        duration: Math.round(audioData.length / 16000), // Estimate duration
        confidence: 0.9, // Whisper doesn't provide confidence scores
      };
    } catch (error) {
      console.error(chalk.red("❌ Transcription failed:"), error.message);
      throw error;
    }
  }

  /**
   * Record and transcribe in one step
   */
  async recordAndTranscribe(outputFile = null, options = {}) {
    const {
      keepAudio = false,
      maxDuration = 300, // 5 minutes max
      autoStop = true,
    } = options;

    try {
      // Start recording
      const audioPath = await this.startRecording(outputFile);

      // Add timeout for max duration
      if (maxDuration > 0) {
        setTimeout(() => {
          if (this.isRecording) {
            console.log(
              chalk.yellow(
                `\n⏰ Max duration (${maxDuration}s) reached, stopping...`,
              ),
            );
            this.stopRecording();
          }
        }, maxDuration * 1000);
      }

      // Wait for recording to complete
      await new Promise((resolve) => {
        const checkRecording = () => {
          if (!this.isRecording) {
            resolve();
          } else {
            setTimeout(checkRecording, 100);
          }
        };
        checkRecording();
      });

      // Small delay to ensure file is fully written
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Transcribe the recording
      const transcription = await this.transcribeFile(audioPath);

      // Clean up audio file if not keeping it
      if (!keepAudio && fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
        console.log(chalk.gray("🗑️  Temporary audio file deleted"));
      }

      // Return a plain text string for `text` (so callers can do `result.text.trim()`),
      // but preserve the full transcription object as `raw` for callers that need
      // the additional metadata (wordCount, duration, confidence, etc).
      return {
        text: transcription && transcription.text ? transcription.text : "",
        raw: transcription,
        audioPath: keepAudio ? audioPath : null,
      };
    } catch (error) {
      // Clean up on error
      if (this.outputPath && fs.existsSync(this.outputPath)) {
        try {
          fs.unlinkSync(this.outputPath);
        } catch (cleanupError) {
          console.error(
            chalk.red("Warning: Failed to clean up audio file"),
            cleanupError.message,
          );
        }
      }
      throw error;
    }
  }

  /**
   * Process multiple audio files in batch
   */
  async batchTranscribe(audioPaths, options = {}) {
    const {
      outputFormat = "text", // 'text' or 'json'
      includeTimestamps = false,
    } = options;

    await this.initialize();

    const results = [];

    for (let i = 0; i < audioPaths.length; i++) {
      const audioPath = audioPaths[i];
      console.log(
        chalk.blue(
          `📝 Transcribing ${i + 1}/${audioPaths.length}: ${path.basename(audioPath)}`,
        ),
      );

      try {
        const transcription = await this.transcribeFile(audioPath);

        results.push({
          file: audioPath,
          text: transcription,
          success: true,
        });

        console.log(chalk.green(`✅ Completed: ${path.basename(audioPath)}`));
      } catch (error) {
        console.error(
          chalk.red(`❌ Failed: ${path.basename(audioPath)}`),
          error.message,
        );
        results.push({
          file: audioPath,
          error: error.message,
          success: false,
        });
      }
    }

    return results;
  }

  /**
   * Get supported audio formats
   */
  getSupportedFormats() {
    return this.audioProcessor.supportedFormats;
  }

  /**
   * Check system dependencies and compatibility
   */
  async checkSystemCompatibility() {
    console.log(chalk.blue("🔍 Checking system dependencies..."));

    const audioCheck = await this.audioProcessor.checkSystemRequirements();
    const issues = [];

    if (!audioCheck.nodejs) {
      issues.push("Node.js version is too old (requires 14+)");
    }

    if (!audioCheck.ffmpeg) {
      issues.push("FFmpeg not found (required for non-WAV files)");
    }

    // Add recommendations as warnings
    if (audioCheck.recommendations.length > 0) {
      console.log(chalk.yellow("📋 Recommendations:"));
      audioCheck.recommendations.forEach((rec) => {
        console.log(chalk.yellow(`  • ${rec}`));
      });
    }

    return {
      isReady: audioCheck.ready,
      fullSupport: audioCheck.fullSupport,
      issues,
      recommendations: audioCheck.recommendations,
    };
  }

  /**
   * Switch to a different model
   */
  async switchModel(modelId, options = {}) {
    try {
      console.log(chalk.blue(`🔄 Switching transcriber to model: ${modelId}`));
      await this.modelManager.switchModel(modelId, options);
      this.transcriber = this.modelManager.getCurrentModel().model;
      console.log(chalk.green(`✅ Transcriber now using: ${modelId}`));
      return true;
    } catch (error) {
      console.error(chalk.red(`❌ Failed to switch model: ${error.message}`));
      throw error;
    }
  }

  /**
   * Get available models
   */
  getAvailableModels() {
    return this.modelManager.getAvailableModels();
  }

  /**
   * Download a model
   */
  async downloadModel(modelId, options = {}) {
    return await this.modelManager.downloadModel(modelId, options);
  }

  /**
   * Get current model info
   */
  getCurrentModelInfo() {
    return this.modelManager.getCurrentModelConfig();
  }

  /**
   * Get model download status
   */
  getModelDownloadStatus() {
    return this.modelManager.getDownloadStatus();
  }

  /**
   * Get model manager instance for direct access
   */
  getModelManager() {
    return this.modelManager;
  }

  /**
   * Clean up resources
   */
  cleanup() {
    if (this.isRecording) {
      this.stopRecording();
    }

    // Clean up temporary files
    if (this.outputPath && fs.existsSync(this.outputPath)) {
      try {
        fs.unlinkSync(this.outputPath);
      } catch (error) {
        console.error(
          chalk.yellow("Warning: Failed to clean up audio file"),
          error.message,
        );
      }
    }

    // Clean up model manager
    if (this.modelManager) {
      this.modelManager.cleanup();
    }
  }
}

module.exports = VoiceTranscriber;
