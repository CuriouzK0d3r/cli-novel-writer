/**
 * Audio Processor for Voice Transcription
 *
 * Handles audio file processing and conversion for Whisper transcription
 * Focuses on WAV file processing with fallback for other formats
 */

const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const { promisify } = require("util");
const chalk = require("chalk");

const execAsync = promisify(exec);

class AudioProcessor {
  constructor() {
    this.supportedFormats = [".wav", ".mp3", ".m4a", ".flac", ".ogg", ".webm"];
  }

  /**
   * Process audio file to extract Float32Array for Whisper
   * @param {string} audioPath - Path to audio file
   * @returns {Promise<Float32Array>} - Audio samples as Float32Array
   */
  async processAudioFile(audioPath) {
    if (!fs.existsSync(audioPath)) {
      throw new Error(`Audio file not found: ${audioPath}`);
    }

    const fileExt = path.extname(audioPath).toLowerCase();

    if (!this.supportedFormats.includes(fileExt)) {
      throw new Error(
        `Unsupported audio format: ${fileExt}. Supported formats: ${this.supportedFormats.join(", ")}`,
      );
    }

    try {
      if (fileExt === ".wav") {
        console.log(chalk.blue("📊 Processing WAV file..."));
        return await this.processWavFile(audioPath);
      } else {
        console.log(chalk.blue(`📊 Converting ${fileExt} to WAV format...`));
        return await this.convertAndProcess(audioPath);
      }
    } catch (error) {
      console.error(chalk.red("❌ Audio processing failed:"), error.message);
      throw error;
    }
  }

  /**
   * Process WAV file directly
   * @param {string} wavPath - Path to WAV file
   * @returns {Promise<Float32Array>} - Audio samples
   */
  async processWavFile(wavPath) {
    try {
      const buffer = fs.readFileSync(wavPath);

      // Validate WAV header
      if (
        buffer.slice(0, 4).toString() !== "RIFF" ||
        buffer.slice(8, 12).toString() !== "WAVE"
      ) {
        throw new Error("Invalid WAV file format");
      }

      // Parse WAV header to find data chunk
      let offset = 12; // Skip RIFF header
      let dataOffset = null;
      let dataSize = 0;

      while (offset < buffer.length - 8) {
        const chunkId = buffer.slice(offset, offset + 4).toString();
        const chunkSize = buffer.readUInt32LE(offset + 4);

        if (chunkId === "data") {
          dataOffset = offset + 8;
          dataSize = chunkSize;
          break;
        }

        offset += 8 + chunkSize;
      }

      if (!dataOffset) {
        throw new Error("No data chunk found in WAV file");
      }

      // Extract audio data
      const audioData = buffer.slice(dataOffset, dataOffset + dataSize);

      // Convert 16-bit PCM to Float32Array
      const samples = new Float32Array(audioData.length / 2);
      for (let i = 0; i < samples.length; i++) {
        const sample = audioData.readInt16LE(i * 2);
        samples[i] = sample / 32768.0; // Normalize to [-1, 1]
      }

      console.log(chalk.green(`✅ Processed ${samples.length} audio samples`));
      return samples;
    } catch (error) {
      throw new Error(`WAV processing failed: ${error.message}`);
    }
  }

  /**
   * Convert non-WAV files using ffmpeg
   * @param {string} audioPath - Path to audio file
   * @returns {Promise<Float32Array>} - Audio samples
   */
  async convertAndProcess(audioPath) {
    const tempWavPath = path.join(
      path.dirname(audioPath),
      `temp_audio_${Date.now()}.wav`,
    );

    try {
      // Check if ffmpeg is available
      try {
        await execAsync("ffmpeg -version");
      } catch (error) {
        throw new Error(
          "FFmpeg is required to process non-WAV audio files. " +
            "Please install FFmpeg or convert your audio to WAV format first. " +
            "Visit https://ffmpeg.org/download.html for installation instructions.",
        );
      }

      // Convert audio to 16kHz mono WAV using ffmpeg
      const command = [
        "ffmpeg",
        "-i",
        `"${audioPath}"`,
        "-ar",
        "16000", // Sample rate: 16kHz (Whisper requirement)
        "-ac",
        "1", // Mono audio
        "-sample_fmt",
        "s16", // 16-bit samples
        "-f",
        "wav", // WAV format
        "-y", // Overwrite output
        `"${tempWavPath}"`,
      ].join(" ");

      console.log(chalk.blue("🔄 Converting audio format..."));
      await execAsync(command);

      // Process the converted WAV file
      const samples = await this.processWavFile(tempWavPath);

      // Clean up temporary file
      fs.unlinkSync(tempWavPath);
      console.log(chalk.gray("🗑️ Cleaned up temporary file"));

      return samples;
    } catch (error) {
      // Clean up temporary file if it exists
      if (fs.existsSync(tempWavPath)) {
        try {
          fs.unlinkSync(tempWavPath);
        } catch (cleanupError) {
          console.warn(
            chalk.yellow("Warning: Failed to clean up temporary file"),
          );
        }
      }

      throw error;
    }
  }

  /**
   * Get audio file information
   * @param {string} audioPath - Path to audio file
   * @returns {object} - Audio file info
   */
  getAudioInfo(audioPath) {
    const stats = fs.statSync(audioPath);
    const ext = path.extname(audioPath).toLowerCase();

    return {
      path: audioPath,
      name: path.basename(audioPath),
      size: stats.size,
      format: ext,
      supported: this.supportedFormats.includes(ext),
      modified: stats.mtime,
    };
  }

  /**
   * Validate audio file
   * @param {string} audioPath - Path to audio file
   * @returns {object} - Validation result
   */
  validateAudioFile(audioPath) {
    const issues = [];

    try {
      if (!fs.existsSync(audioPath)) {
        issues.push("File does not exist");
        return { valid: false, issues };
      }

      const stats = fs.statSync(audioPath);
      const ext = path.extname(audioPath).toLowerCase();

      // Check file size
      if (stats.size === 0) {
        issues.push("File is empty");
      }

      // Check file size limit (100MB)
      if (stats.size > 100 * 1024 * 1024) {
        issues.push("File is too large (>100MB)");
      }

      // Check format support
      if (!this.supportedFormats.includes(ext)) {
        issues.push(`Unsupported format: ${ext}`);
      }

      // Basic WAV validation
      if (ext === ".wav") {
        try {
          const buffer = fs.readFileSync(audioPath, { start: 0, end: 12 });
          if (
            buffer.slice(0, 4).toString() !== "RIFF" ||
            buffer.slice(8, 12).toString() !== "WAVE"
          ) {
            issues.push("Invalid WAV file header");
          }
        } catch (error) {
          issues.push("Cannot read WAV header");
        }
      }
    } catch (error) {
      issues.push(`File access error: ${error.message}`);
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Check system requirements for audio processing
   * @returns {Promise<object>} - System check result
   */
  async checkSystemRequirements() {
    const results = {
      nodejs: true,
      ffmpeg: false,
      wavSupport: true,
      recommendations: [],
    };

    // Check Node.js version
    const nodeVersion = process.version;
    if (parseInt(nodeVersion.slice(1)) < 14) {
      results.nodejs = false;
      results.recommendations.push("Upgrade to Node.js 14 or higher");
    }

    // Check FFmpeg availability
    try {
      await execAsync("ffmpeg -version");
      results.ffmpeg = true;
    } catch (error) {
      results.ffmpeg = false;
      results.recommendations.push("Install FFmpeg for non-WAV audio support");
    }

    // Overall status
    results.ready = results.nodejs && results.wavSupport;
    results.fullSupport = results.ready && results.ffmpeg;

    return results;
  }

  /**
   * Convert audio file to WAV format
   * @param {string} inputPath - Input audio file path
   * @param {string} outputPath - Output WAV file path
   * @returns {Promise<string>} - Output file path
   */
  async convertToWav(inputPath, outputPath = null) {
    if (!outputPath) {
      const baseName = path.basename(inputPath, path.extname(inputPath));
      outputPath = path.join(path.dirname(inputPath), `${baseName}.wav`);
    }

    try {
      // Check if ffmpeg is available
      await execAsync("ffmpeg -version");

      const command = [
        "ffmpeg",
        "-i",
        `"${inputPath}"`,
        "-ar",
        "16000",
        "-ac",
        "1",
        "-sample_fmt",
        "s16",
        "-f",
        "wav",
        "-y",
        `"${outputPath}"`,
      ].join(" ");

      console.log(
        chalk.blue(`🔄 Converting ${path.basename(inputPath)} to WAV...`),
      );
      await execAsync(command);

      console.log(chalk.green(`✅ Converted to: ${path.basename(outputPath)}`));
      return outputPath;
    } catch (error) {
      if (error.message.includes("ffmpeg")) {
        throw new Error(
          "FFmpeg is required for audio conversion. " +
            "Please install FFmpeg from https://ffmpeg.org/download.html",
        );
      }
      throw new Error(`Audio conversion failed: ${error.message}`);
    }
  }
}

module.exports = AudioProcessor;
