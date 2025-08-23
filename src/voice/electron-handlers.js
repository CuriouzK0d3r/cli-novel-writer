const { ipcMain, dialog } = require("electron");
const fs = require("fs-extra");
const path = require("path");
const os = require("os");
const VoiceTranscriber = require("./transcriber");

class VoiceElectronHandlers {
  constructor() {
    this.transcriber = new VoiceTranscriber();
    this.setupHandlers();
  }

  setupHandlers() {
    // Initialize transcription handler
    ipcMain.handle("voice-initialize", async () => {
      try {
        await this.transcriber.initialize();
        return { success: true };
      } catch (error) {
        console.error("Voice initialization failed:", error);
        return { success: false, error: error.message };
      }
    });

    // Save temporary audio data handler
    ipcMain.handle("save-temp-audio", async (event, { audioData }) => {
      try {
        const tempDir = os.tmpdir();
        const filename = `voice_recording_${Date.now()}.webm`;
        const filePath = path.join(tempDir, filename);

        // Convert array back to buffer and save
        const buffer = Buffer.from(audioData);
        await fs.writeFile(filePath, buffer);

        return { success: true, filePath };
      } catch (error) {
        console.error("Error saving temporary audio:", error);
        return { success: false, error: error.message };
      }
    });

    // Transcribe audio handler
    ipcMain.handle(
      "transcribe-audio",
      async (event, { audioPath, keepAudio = false }) => {
        try {
          // Initialize transcriber if not already done
          await this.transcriber.initialize();

          const transcription =
            await this.transcriber.transcribeFile(audioPath);

          // Extract text from transcription result (it's an object with text property)
          const text =
            transcription && transcription.text ? transcription.text : "";

          // Clean up temporary audio file if not keeping it
          if (!keepAudio) {
            try {
              await fs.unlink(audioPath);
            } catch (cleanupError) {
              console.warn(
                "Failed to clean up temporary audio file:",
                cleanupError.message,
              );
            }
          }

          return {
            success: true,
            text: text,
            raw: transcription,
            audioPath: keepAudio ? audioPath : null,
          };
        } catch (error) {
          console.error("Transcription failed:", error);
          return { success: false, error: error.message };
        }
      },
    );

    // Transcribe existing file handler
    ipcMain.handle(
      "transcribe-file",
      async (event, { filePath, keepAudio = false }) => {
        try {
          if (!(await fs.pathExists(filePath))) {
            throw new Error(`File not found: ${filePath}`);
          }

          // Initialize transcriber if not already done
          await this.transcriber.initialize();

          const transcription = await this.transcriber.transcribeFile(filePath);

          // Extract text from transcription result (it's an object with text property)
          const text =
            transcription && transcription.text ? transcription.text : "";

          return {
            success: true,
            text: text,
            raw: transcription,
            audioPath: keepAudio ? filePath : null,
          };
        } catch (error) {
          console.error("File transcription failed:", error);
          return { success: false, error: error.message };
        }
      },
    );

    // Save transcription handler
    ipcMain.handle(
      "save-transcription",
      async (event, { text, timestamp, filename = null }) => {
        try {
          // Generate filename if not provided
          let outputFile = filename;
          if (!outputFile) {
            const date = new Date(timestamp);
            const dateStr = date.toISOString().slice(0, 10);
            const timeStr = date.toISOString().slice(11, 19).replace(/:/g, "-");
            outputFile = `voice_transcription_${dateStr}_${timeStr}.md`;
          }

          // Format the transcription content
          const content = this.formatTranscription(text, timestamp);

          // Save to current working directory or show save dialog
          const currentDir = process.cwd();
          const fullPath = path.join(currentDir, outputFile);

          await fs.writeFile(fullPath, content, "utf8");

          return { success: true, filePath: fullPath };
        } catch (error) {
          console.error("Error saving transcription:", error);
          return { success: false, error: error.message };
        }
      },
    );

    // Append transcription to existing file handler
    ipcMain.handle(
      "append-transcription",
      async (event, { text, timestamp }) => {
        try {
          // Show file dialog to select target file
          const result = await dialog.showOpenDialog({
            title: "Select file to append transcription to",
            filters: [
              { name: "Markdown Files", extensions: ["md"] },
              { name: "Text Files", extensions: ["txt"] },
              { name: "All Files", extensions: ["*"] },
            ],
            properties: ["openFile"],
          });

          if (result.canceled || result.filePaths.length === 0) {
            return { success: false, error: "No file selected" };
          }

          const targetFile = result.filePaths[0];

          // Format the transcription content
          const content = this.formatTranscription(text, timestamp, true);

          // Append to the selected file
          await fs.appendFile(targetFile, "\n\n" + content, "utf8");

          return { success: true, filePath: targetFile };
        } catch (error) {
          console.error("Error appending transcription:", error);
          return { success: false, error: error.message };
        }
      },
    );

    // Save transcription with dialog handler
    ipcMain.handle(
      "save-transcription-dialog",
      async (event, { text, timestamp }) => {
        try {
          // Show save dialog
          const result = await dialog.showSaveDialog({
            title: "Save Transcription",
            defaultPath: `voice_transcription_${new Date().toISOString().slice(0, 10)}.md`,
            filters: [
              { name: "Markdown Files", extensions: ["md"] },
              { name: "Text Files", extensions: ["txt"] },
              { name: "All Files", extensions: ["*"] },
            ],
          });

          if (result.canceled || !result.filePath) {
            return { success: false, error: "Save canceled" };
          }

          // Format the transcription content
          const content = this.formatTranscription(text, timestamp);

          // Save to selected path
          await fs.writeFile(result.filePath, content, "utf8");

          return { success: true, filePath: result.filePath };
        } catch (error) {
          console.error("Error saving transcription:", error);
          return { success: false, error: error.message };
        }
      },
    );

    // Batch transcribe handler
    ipcMain.handle(
      "batch-transcribe",
      async (event, { filePaths, options = {} }) => {
        try {
          const results = await this.transcriber.batchTranscribe(
            filePaths,
            options,
          );

          return { success: true, results };
        } catch (error) {
          console.error("Batch transcription failed:", error);
          return { success: false, error: error.message };
        }
      },
    );

    // Check system compatibility handler
    ipcMain.handle("voice-system-check", async () => {
      try {
        const check = await this.transcriber.checkSystemCompatibility();
        const formats = this.transcriber.getSupportedFormats();

        return {
          success: true,
          isReady: check.isReady,
          fullSupport: check.fullSupport,
          issues: check.issues,
          recommendations: check.recommendations,
          supportedFormats: formats,
          nodeVersion: process.version,
          platform: process.platform,
        };
      } catch (error) {
        console.error("System check failed:", error);
        return { success: false, error: error.message };
      }
    });

    // Get available audio devices handler (for future use)
    ipcMain.handle("get-audio-devices", async () => {
      try {
        // This would require additional native modules to enumerate audio devices
        // For now, return a placeholder response
        return {
          success: true,
          devices: [],
        };
      } catch (error) {
        console.error("Error getting audio devices:", error);
        return { success: false, error: error.message };
      }
    });

    // Convert audio format handler (for future use)
    ipcMain.handle(
      "convert-audio",
      async (event, { inputPath, outputPath, format = "wav" }) => {
        try {
          // This would require FFmpeg or similar for audio conversion
          // For now, just copy the file
          await fs.copy(inputPath, outputPath);

          return { success: true, outputPath };
        } catch (error) {
          console.error("Audio conversion failed:", error);
          return { success: false, error: error.message };
        }
      },
    );

    // Clean up temporary files handler
    ipcMain.handle("cleanup-voice-files", async (event, { filePaths = [] }) => {
      try {
        const cleanupResults = [];

        for (const filePath of filePaths) {
          try {
            if (await fs.pathExists(filePath)) {
              await fs.unlink(filePath);
              cleanupResults.push({ filePath, success: true });
            }
          } catch (error) {
            cleanupResults.push({
              filePath,
              success: false,
              error: error.message,
            });
          }
        }

        return { success: true, results: cleanupResults };
      } catch (error) {
        console.error("Cleanup failed:", error);
        return { success: false, error: error.message };
      }
    });
  }

  // Format transcription content for saving
  formatTranscription(text, timestamp, isAppend = false) {
    let content = "";

    if (!isAppend) {
      content += "# Voice Transcription\n\n";
    } else {
      content += "---\n\n## Voice Note\n\n";
    }

    content += `**Transcribed:** ${new Date(timestamp).toLocaleString()}\n`;
    content += `**Words:** ${
      text
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0).length
    }\n\n`;
    content += "---\n\n";
    content += text.trim();

    return content;
  }

  // Clean up resources
  cleanup() {
    if (this.transcriber) {
      this.transcriber.cleanup();
    }

    // Remove all IPC handlers
    ipcMain.removeHandler("voice-initialize");
    ipcMain.removeHandler("save-temp-audio");
    ipcMain.removeHandler("transcribe-audio");
    ipcMain.removeHandler("transcribe-file");
    ipcMain.removeHandler("save-transcription");
    ipcMain.removeHandler("append-transcription");
    ipcMain.removeHandler("save-transcription-dialog");
    ipcMain.removeHandler("batch-transcribe");
    ipcMain.removeHandler("voice-system-check");
    ipcMain.removeHandler("get-audio-devices");
    ipcMain.removeHandler("convert-audio");
    ipcMain.removeHandler("cleanup-voice-files");
  }
}

module.exports = VoiceElectronHandlers;
