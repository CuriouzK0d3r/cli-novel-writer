const { pipeline } = require("@xenova/transformers");
const fs = require("fs");
const path = require("path");
const recorder = require("node-record-lpcm16");
const wav = require("wav");
const chalk = require("chalk");
const AudioProcessor = require("./audio-processor");

class VoiceTranscriber {
  constructor(options = {}) {
    this.transcriber = null;
    this.isRecording = false;
    this.outputPath = null;
    this.recordingStream = null;
    this.fileWriter = null;
    this.audioProcessor = new AudioProcessor();
    this.modelId = options.modelId || "Xenova/whisper-base.en"; // default
    this.modelLoading = null; // promise guard
  }

  /**
   * Initialize the Whisper transcription model
   */
  async initialize(modelOverride = null) {
    if (modelOverride && modelOverride !== this.modelId) {
      await this.setModel(modelOverride);
    } else if (this.transcriber) {
      return this.transcriber;
    }

    // If a load is already in progress, await it (avoid duplicate downloads)
    if (this.modelLoading) {
      return this.modelLoading;
    }

    console.log(
      chalk.yellow(
        `🤖 Loading Whisper model "${this.modelId}" (this may take a moment on first run)...`,
      ),
    );

    this.modelLoading = (async () => {
      try {
        this.transcriber = await pipeline(
          "automatic-speech-recognition",
          this.modelId,
          {
            chunk_length_s: 30,
            stride_length_s: 5,
          },
        );
        console.log(
          chalk.green(`✅ Whisper model loaded successfully: ${this.modelId}`),
        );
        return this.transcriber;
      } catch (error) {
        console.error(
          chalk.red("❌ Failed to load Whisper model:"),
          error.message,
        );
        // Reset model on failure so we can retry later
        this.transcriber = null;
        throw error;
      } finally {
        this.modelLoading = null;
      }
    })();

    return this.modelLoading;
  }

  /**
   * Change the active model (accepts Hugging Face repo ID or local directory)
   * @param {string} modelId
   */
  async setModel(modelId) {
    if (!modelId || typeof modelId !== "string") {
      throw new Error("Model identifier must be a non-empty string");
    }

    if (modelId === this.modelId && this.transcriber) {
      return this.transcriber;
    }

    // Attempt graceful disposal of previous pipeline if possible
    if (this.transcriber && typeof this.transcriber.dispose === "function") {
      try {
        this.transcriber.dispose();
      } catch (_) {
        // ignore
      }
    }

    this.transcriber = null;
    this.modelId = modelId;
    return this.initialize();
  }

  getCurrentModel() {
    return this.modelId;
  }

  /**
   * Start recording audio from microphone
   */
  async startRecording(outputFile = null) {
    if (this.isRecording) {
      throw new Error("Recording is already in progress");
    }

    // Try to coerce a usable output path from the provided value.
    // Accept strings, objects with .path / .href properties, and URL/Buffer-like values.
    let resolvedPath = null;
    try {
      if (typeof outputFile === "string" && outputFile.trim() !== "") {
        resolvedPath = outputFile.trim();
      } else if (outputFile && typeof outputFile === "object") {
        // common object shapes
        if (
          typeof outputFile.path === "string" &&
          outputFile.path.trim() !== ""
        ) {
          resolvedPath = outputFile.path.trim();
        } else if (
          typeof outputFile.href === "string" &&
          outputFile.href.trim() !== ""
        ) {
          resolvedPath = outputFile.href.trim();
        } else if (
          outputFile instanceof URL &&
          typeof outputFile.pathname === "string"
        ) {
          resolvedPath = outputFile.pathname;
        } else if (Buffer.isBuffer(outputFile)) {
          // Buffers are not valid paths; avoid coercing to "[object Object]"
          resolvedPath = null;
        } else {
          // Fallback to String conversion but guard against "[object Object]"
          const candidate = String(outputFile);
          if (!/^\[object\s/.test(candidate) && candidate.trim() !== "") {
            resolvedPath = candidate.trim();
          } else {
            resolvedPath = null;
          }
        }
      }
    } catch (e) {
      // Defensive: if coercion fails, fall back to generated path below
      resolvedPath = null;
    }

    const looksLikeValidPath = (p) =>
      typeof p === "string" && p.length > 0 && !/^\[object\s/.test(p);

    // Final output path fallback to generated filename if nothing valid provided
    if (looksLikeValidPath(resolvedPath)) {
      this.outputPath = resolvedPath;
    } else if (
      typeof outputFile === "string" &&
      looksLikeValidPath(outputFile)
    ) {
      this.outputPath = outputFile;
    } else {
      this.outputPath = path.join(process.cwd(), `recording_${Date.now()}.wav`);
      if (outputFile && typeof outputFile === "object") {
        console.warn(
          chalk.yellow(
            "Provided outputFile was an object that couldn't be coerced to a path. Falling back to generated path.",
          ),
        );
      }
    }

    console.log(chalk.blue("🎤 Starting voice recording..."));
    console.log(chalk.gray(`Recording to: ${this.outputPath}`));
    console.log(chalk.yellow("Press Ctrl+C to stop recording"));

    this.isRecording = true;

    try {
      // Validate the resolved path before passing to wav.FileWriter
      if (!looksLikeValidPath(this.outputPath)) {
        throw new Error("Invalid output path for recording");
      }

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
      const stream = this.recordingStream.stream();
      if (!stream || typeof stream.pipe !== "function") {
        throw new Error("Recording stream is not available or not valid");
      }
      stream.pipe(this.fileWriter);

      return new Promise((resolve, reject) => {
        stream.on("end", () => {
          this.isRecording = false;
          console.log(chalk.green("🛑 Recording stopped"));
          resolve(this.outputPath);
        });

        stream.on("error", (error) => {
          this.isRecording = false;
          console.error(
            chalk.red("Recording stream error:"),
            error.message || error,
          );
          reject(error);
        });

        // Handle manual stop (Ctrl+C)
        const sigintHandler = () => {
          try {
            this.stopRecording();
          } catch (e) {
            console.error(
              chalk.red("Error stopping recording on SIGINT:"),
              e.message || e,
            );
          }
        };
        process.on("SIGINT", sigintHandler);
      });
    } catch (error) {
      this.isRecording = false;
      console.error(chalk.red("❌ Recording failed:"), error.message || error);
      // Ensure file writer is cleaned up on errors
      try {
        if (this.fileWriter) {
          this.fileWriter.end();
          this.fileWriter = null;
        }
      } catch (cleanupErr) {
        console.warn(
          chalk.yellow("Warning: failed to clean up file writer"),
          cleanupErr.message || cleanupErr,
        );
      }
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
  }
}

module.exports = VoiceTranscriber;
