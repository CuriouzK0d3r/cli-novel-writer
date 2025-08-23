// Voice Transcription JavaScript Module
class VoiceTranscriptionManager {
  constructor() {
    this.isRecording = false;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
    this.audioContext = null;
    this.analyser = null;
    this.visualizerInterval = null;
    this.recordingTimer = null;
    this.startTime = null;

    // Settings
    this.settings = {
      keepAudio: false,
      autoSave: true,
      maxDuration: 300, // 5 minutes
    };

    this.initializeElements();
    this.bindEvents();
    this.initializeVoiceSystem();
  }

  initializeElements() {
    // Recording controls
    this.recordBtn = document.getElementById("voice-record-btn");
    this.pauseBtn = document.getElementById("voice-pause-btn");
    this.stopBtn = document.getElementById("voice-stop-btn");
    this.clearBtn = document.getElementById("voice-clear-btn");

    // Status elements
    this.statusText = document.getElementById("record-status-text");
    this.timer = document.getElementById("record-timer");
    this.micStatus = document.getElementById("voice-mic-status");
    this.modelStatus = document.getElementById("voice-model-status");

    // Visualizer
    this.visualizer = document.getElementById("voice-visualizer");
    this.canvas = document.getElementById("visualizer-canvas");
    this.ctx = this.canvas.getContext("2d");

    // File upload
    this.dropZone = document.getElementById("voice-drop-zone");
    this.fileInput = document.getElementById("voice-file-input");

    // Progress
    this.progressContainer = document.getElementById("voice-progress");
    this.progressFill = document.getElementById("voice-progress-fill");
    this.progressText = document.getElementById("voice-progress-text");

    // Output
    this.transcriptionOutput = document.getElementById(
      "voice-transcription-output",
    );
    this.wordCount = document.getElementById("voice-word-count");

    // Actions
    this.saveBtn = document.getElementById("voice-save-btn");
    this.copyBtn = document.getElementById("voice-copy-btn");
    this.appendBtn = document.getElementById("voice-append-btn");

    // Settings
    this.keepAudioCheckbox = document.getElementById("voice-keep-audio");
    this.autoSaveCheckbox = document.getElementById("voice-auto-save");
    this.maxDurationSelect = document.getElementById("voice-max-duration");

    // Recent list
    this.recentList = document.getElementById("voice-recent-list");
  }

  bindEvents() {
    // Recording controls
    this.recordBtn?.addEventListener("click", () => this.toggleRecording());
    this.pauseBtn?.addEventListener("click", () => this.pauseRecording());
    this.stopBtn?.addEventListener("click", () => this.stopRecording());
    this.clearBtn?.addEventListener("click", () => this.clearTranscription());

    // File upload
    this.dropZone?.addEventListener("click", () => this.fileInput?.click());
    this.dropZone?.addEventListener("dragover", (e) => this.handleDragOver(e));
    this.dropZone?.addEventListener("drop", (e) => this.handleDrop(e));
    this.fileInput?.addEventListener("change", (e) => this.handleFileSelect(e));

    // Actions
    this.saveBtn?.addEventListener("click", () => this.saveTranscription());
    this.copyBtn?.addEventListener("click", () => this.copyToClipboard());
    this.appendBtn?.addEventListener("click", () => this.appendToFile());

    // Settings
    this.keepAudioCheckbox?.addEventListener("change", (e) => {
      this.settings.keepAudio = e.target.checked;
    });
    this.autoSaveCheckbox?.addEventListener("change", (e) => {
      this.settings.autoSave = e.target.checked;
    });
    this.maxDurationSelect?.addEventListener("change", (e) => {
      this.settings.maxDuration = parseInt(e.target.value);
    });

    // Transcription editing
    this.transcriptionOutput?.addEventListener("input", () =>
      this.updateWordCount(),
    );
    this.transcriptionOutput?.addEventListener("focus", () =>
      this.hidePlaceholder(),
    );
    this.transcriptionOutput?.addEventListener("blur", () =>
      this.showPlaceholderIfEmpty(),
    );
  }

  async initializeVoiceSystem() {
    try {
      this.updateModelStatus("loading", "Initializing AI model...");

      if (window.require) {
        const { ipcRenderer } = window.require("electron");

        const result = await ipcRenderer.invoke("voice-initialize");

        if (result.success) {
          this.updateModelStatus("ready", "AI model ready");
        } else {
          this.updateModelStatus("error", "AI model failed to load");
          console.error("Voice initialization failed:", result.error);
        }
      } else {
        this.updateModelStatus("error", "Desktop app required");
      }
    } catch (error) {
      console.error("Error initializing voice system:", error);
      this.updateModelStatus("error", "Initialization failed");
    }

    // Also check system status
    await this.checkSystemStatus();
  }

  async checkSystemStatus() {
    // Check microphone permission
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.updateMicStatus("ready", "Available");
      } else {
        this.updateMicStatus("error", "Not supported");
      }
    } catch (error) {
      this.updateMicStatus("error", "Permission denied");
    }

    // Check AI model status
    try {
      this.updateModelStatus("loading", "Initializing");

      // Send IPC message to check model status
      if (window.require) {
        const { ipcRenderer } = window.require("electron");
        const result = await ipcRenderer.invoke("voice-system-check");

        if (result.success) {
          this.updateModelStatus("ready", "Ready");
        } else {
          this.updateModelStatus("error", "Failed to load");
        }
      }
    } catch (error) {
      this.updateModelStatus("error", "Initialization failed");
    }
  }

  updateMicStatus(type, text) {
    if (!this.micStatus) return;
    this.micStatus.textContent = text;
    this.micStatus.className = `status-${type}`;
  }

  updateModelStatus(type, text) {
    if (!this.modelStatus) return;
    this.modelStatus.textContent = text;
    this.modelStatus.className = `status-${type}`;
  }

  async toggleRecording() {
    if (!this.isRecording) {
      await this.startRecording();
    } else {
      await this.stopRecording();
    }
  }

  async startRecording() {
    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
        },
      });

      // Setup audio context for visualization
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      const source = this.audioContext.createMediaStreamSource(this.stream);
      source.connect(this.analyser);
      this.analyser.fftSize = 256;

      // Setup MediaRecorder
      this.audioChunks = [];
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(this.audioChunks, { type: "audio/webm" });
        await this.processRecording(audioBlob);
      };

      // Start recording
      this.mediaRecorder.start(1000);
      this.isRecording = true;
      this.startTime = Date.now();

      // Update UI
      this.updateRecordingUI(true);
      this.startTimer();
      this.startVisualizer();

      // Auto-stop after max duration
      setTimeout(() => {
        if (this.isRecording) {
          this.stopRecording();
        }
      }, this.settings.maxDuration * 1000);

      this.showToast("Recording started", "success");
    } catch (error) {
      console.error("Error starting recording:", error);
      this.showToast("Failed to start recording: " + error.message, "error");
      this.isRecording = false;
      this.updateRecordingUI(false);
    }
  }

  async stopRecording() {
    if (!this.isRecording || !this.mediaRecorder) {
      return;
    }

    try {
      this.mediaRecorder.stop();
      this.isRecording = false;

      // Stop tracks
      if (this.stream) {
        this.stream.getTracks().forEach((track) => track.stop());
        this.stream = null;
      }

      // Close audio context
      if (this.audioContext) {
        this.audioContext.close();
        this.audioContext = null;
      }

      // Update UI
      this.updateRecordingUI(false);
      this.stopTimer();
      this.stopVisualizer();

      this.showToast("Processing recording...", "info");
    } catch (error) {
      console.error("Error stopping recording:", error);
      this.showToast("Error stopping recording", "error");
    }
  }

  pauseRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
      this.mediaRecorder.pause();
      this.pauseBtn.innerHTML = '<i class="fas fa-play"></i> Resume';
      this.pauseBtn.onclick = () => this.resumeRecording();
      this.showToast("Recording paused", "info");
    }
  }

  resumeRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === "paused") {
      this.mediaRecorder.resume();
      this.pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
      this.pauseBtn.onclick = () => this.pauseRecording();
      this.showToast("Recording resumed", "success");
    }
  }

  async processRecording(audioBlob) {
    try {
      this.showProgress(0, "Converting audio...");

      // Send to main process for transcription
      if (window.require) {
        const { ipcRenderer } = window.require("electron");

        // Convert blob to array buffer
        const arrayBuffer = await audioBlob.arrayBuffer();

        this.showProgress(25, "Preparing for transcription...");

        // Save temporary audio file
        const result = await ipcRenderer.invoke("save-temp-audio", {
          audioData: Array.from(new Uint8Array(arrayBuffer)),
        });

        this.showProgress(50, "Transcribing...");

        // Transcribe audio
        const transcriptionResult = await ipcRenderer.invoke(
          "transcribe-audio",
          {
            audioPath: result.filePath,
            keepAudio: this.settings.keepAudio,
          },
        );

        this.showProgress(100, "Complete!");
        setTimeout(() => this.hideProgress(), 1000);

        if (transcriptionResult.success) {
          this.displayTranscription(transcriptionResult.text);
          this.showToast("Transcription complete!", "success");

          if (this.settings.autoSave) {
            await this.saveTranscription();
          }
        } else {
          this.showToast(
            "Transcription failed: " + transcriptionResult.error,
            "error",
          );
        }
      }
    } catch (error) {
      console.error("Error processing recording:", error);
      this.showToast("Error processing recording", "error");
      this.hideProgress();
    }
  }

  async handleFileSelect(event) {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      await this.processUploadedFiles(files);
    }
  }

  handleDragOver(event) {
    event.preventDefault();
    this.dropZone.classList.add("dragover");
  }

  async handleDrop(event) {
    event.preventDefault();
    this.dropZone.classList.remove("dragover");

    const files = Array.from(event.dataTransfer.files);
    await this.processUploadedFiles(files);
  }

  async processUploadedFiles(files) {
    for (const file of files) {
      if (this.isAudioFile(file)) {
        await this.transcribeFile(file);
      } else {
        this.showToast(`Skipping ${file.name} - not an audio file`, "error");
      }
    }
  }

  isAudioFile(file) {
    const audioTypes = [
      "audio/wav",
      "audio/mp3",
      "audio/mpeg",
      "audio/m4a",
      "audio/flac",
      "audio/ogg",
      "audio/webm",
    ];
    return (
      audioTypes.includes(file.type) ||
      file.name.match(/\.(wav|mp3|m4a|flac|ogg|webm)$/i)
    );
  }

  async transcribeFile(file) {
    try {
      this.showProgress(0, "Processing file...");
      this.showToast("Transcribing uploaded file...", "info");

      if (window.require) {
        const { ipcRenderer } = window.require("electron");

        const result = await ipcRenderer.invoke("transcribe-file", {
          filePath: file.path,
          keepAudio: this.settings.keepAudio,
        });

        this.showProgress(100, "Complete!");
        setTimeout(() => this.hideProgress(), 1000);

        if (result.success) {
          this.displayTranscription(result.text);
          this.showToast("File transcription complete!", "success");

          if (this.settings.autoSave) {
            await this.saveTranscription();
          }
        } else {
          this.showToast("File transcription failed: " + result.error, "error");
        }
      }
    } catch (error) {
      console.error("Error transcribing file:", error);
      this.showToast("Error transcribing file", "error");
      this.hideProgress();
    }
  }

  displayTranscription(text) {
    if (this.transcriptionOutput) {
      this.transcriptionOutput.textContent = text;
      this.transcriptionOutput.classList.remove("placeholder-text");
      this.updateWordCount();
      this.enableTranscriptionControls(true);
      this.addToRecent(text);
    }
  }

  updateWordCount() {
    if (!this.transcriptionOutput || !this.wordCount) return;

    const text = this.transcriptionOutput.textContent || "";
    const words = text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);
    this.wordCount.textContent = `Words: ${words.length}`;
  }

  hidePlaceholder() {
    const placeholder =
      this.transcriptionOutput?.querySelector(".placeholder-text");
    if (placeholder) {
      placeholder.style.display = "none";
    }
  }

  showPlaceholderIfEmpty() {
    const text = this.transcriptionOutput?.textContent || "";
    if (text.trim() === "") {
      this.transcriptionOutput.innerHTML =
        '<p class="placeholder-text">Your transcribed text will appear here...</p>';
    }
  }

  clearTranscription() {
    if (this.transcriptionOutput) {
      this.transcriptionOutput.innerHTML =
        '<p class="placeholder-text">Your transcribed text will appear here...</p>';
      this.updateWordCount();
      this.enableTranscriptionControls(false);
      this.showToast("Transcription cleared", "info");
    }
  }

  enableTranscriptionControls(enabled) {
    [this.saveBtn, this.copyBtn, this.appendBtn].forEach((btn) => {
      if (btn) {
        btn.disabled = !enabled;
      }
    });
  }

  async saveTranscription() {
    const text = this.transcriptionOutput?.textContent;
    if (!text || text.includes("Your transcribed text will appear here")) {
      return;
    }

    try {
      if (window.require) {
        const { ipcRenderer } = window.require("electron");

        const result = await ipcRenderer.invoke("save-transcription", {
          text: text,
          timestamp: new Date().toISOString(),
        });

        if (result.success) {
          this.showToast(`Saved to: ${result.filePath}`, "success");
        } else {
          this.showToast("Error saving transcription", "error");
        }
      }
    } catch (error) {
      console.error("Error saving transcription:", error);
      this.showToast("Error saving transcription", "error");
    }
  }

  async copyToClipboard() {
    const text = this.transcriptionOutput?.textContent;
    if (!text || text.includes("Your transcribed text will appear here")) {
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      this.showToast("Copied to clipboard!", "success");
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      this.showToast("Error copying to clipboard", "error");
    }
  }

  async appendToFile() {
    const text = this.transcriptionOutput?.textContent;
    if (!text || text.includes("Your transcribed text will appear here")) {
      return;
    }

    try {
      if (window.require) {
        const { ipcRenderer } = window.require("electron");

        const result = await ipcRenderer.invoke("append-transcription", {
          text: text,
          timestamp: new Date().toISOString(),
        });

        if (result.success) {
          this.showToast(`Appended to: ${result.filePath}`, "success");
        } else {
          this.showToast("Error appending to file", "error");
        }
      }
    } catch (error) {
      console.error("Error appending to file:", error);
      this.showToast("Error appending to file", "error");
    }
  }

  updateRecordingUI(recording) {
    if (!this.recordBtn) return;

    if (recording) {
      this.recordBtn.classList.add("recording");
      this.recordBtn.innerHTML = '<i class="fas fa-stop"></i>';
      this.statusText.textContent = "Recording...";
      this.pauseBtn.style.display = "inline-block";
      this.stopBtn.style.display = "inline-block";
      this.visualizer.classList.add("active");
    } else {
      this.recordBtn.classList.remove("recording");
      this.recordBtn.classList.add("stopped");
      this.recordBtn.innerHTML = '<i class="fas fa-microphone"></i>';
      this.statusText.textContent = "Ready to Record";
      this.pauseBtn.style.display = "none";
      this.stopBtn.style.display = "none";
      this.visualizer.classList.remove("active");

      // Reset button after delay
      setTimeout(() => {
        this.recordBtn.classList.remove("stopped");
      }, 1000);
    }
  }

  startTimer() {
    this.recordingTimer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      this.timer.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }, 1000);
  }

  stopTimer() {
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }
    this.timer.textContent = "00:00";
  }

  startVisualizer() {
    if (!this.analyser || !this.ctx) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    this.visualizerInterval = setInterval(() => {
      this.analyser.getByteFrequencyData(dataArray);

      // Clear canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // Draw waveform
      const barWidth = (this.canvas.width / dataArray.length) * 2;
      let x = 0;

      for (let i = 0; i < dataArray.length; i++) {
        const barHeight = (dataArray[i] / 255) * this.canvas.height;

        const gradient = this.ctx.createLinearGradient(
          0,
          0,
          0,
          this.canvas.height,
        );
        gradient.addColorStop(0, "#4f46e5");
        gradient.addColorStop(1, "#7c3aed");

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(
          x,
          this.canvas.height - barHeight,
          barWidth,
          barHeight,
        );

        x += barWidth + 1;
      }
    }, 50);
  }

  stopVisualizer() {
    if (this.visualizerInterval) {
      clearInterval(this.visualizerInterval);
      this.visualizerInterval = null;
    }

    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  showProgress(percent, text) {
    if (this.progressContainer) {
      this.progressContainer.style.display = "block";
      this.progressFill.style.width = `${percent}%`;
      this.progressText.textContent = text;
    }
  }

  hideProgress() {
    if (this.progressContainer) {
      this.progressContainer.style.display = "none";
    }
  }

  showToast(message, type = "info") {
    // Create toast element
    const toast = document.createElement("div");
    toast.className = `voice-toast ${type}`;

    const iconMap = {
      success: "fas fa-check-circle",
      error: "fas fa-exclamation-circle",
      info: "fas fa-info-circle",
    };

    toast.innerHTML = `
            <div class="voice-toast-content">
                <i class="voice-toast-icon ${iconMap[type]}"></i>
                <span class="voice-toast-message">${message}</span>
            </div>
        `;

    document.body.appendChild(toast);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  addToRecent(text) {
    if (!this.recentList) return;

    // Remove "no items" message
    const noItems = this.recentList.querySelector(".no-items");
    if (noItems) {
      noItems.remove();
    }

    // Create recent item
    const item = document.createElement("div");
    item.className = "recent-item";

    const preview = text.length > 100 ? text.substring(0, 100) + "..." : text;
    const wordCount = text.split(/\s+/).filter((w) => w.length > 0).length;

    item.innerHTML = `
            <div class="recent-item-title">Voice Transcription</div>
            <div class="recent-item-meta">
                <span>${new Date().toLocaleDateString()}</span>
                <span>${wordCount} words</span>
            </div>
            <div class="recent-item-preview">${preview}</div>
        `;

    item.addEventListener("click", () => {
      this.displayTranscription(text);
    });

    // Add to top of list
    this.recentList.insertBefore(item, this.recentList.firstChild);

    // Keep only 10 most recent
    const items = this.recentList.querySelectorAll(".recent-item");
    if (items.length > 10) {
      items[items.length - 1].remove();
    }
  }

  cleanup() {
    if (this.isRecording) {
      this.stopRecording();
    }

    if (this.visualizerInterval) {
      clearInterval(this.visualizerInterval);
    }

    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
    }
  }
}

// Initialize voice transcription when the page loads
let voiceManager = null;

document.addEventListener("DOMContentLoaded", () => {
  // Initialize when voice transcription view is shown
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (
        mutation.type === "attributes" &&
        mutation.attributeName === "class"
      ) {
        const voiceView = document.getElementById("voice-transcription-view");
        if (voiceView && voiceView.classList.contains("active")) {
          if (!voiceManager) {
            voiceManager = new VoiceTranscriptionManager();
          }
        }
      }
    });
  });

  const voiceView = document.getElementById("voice-transcription-view");
  if (voiceView) {
    observer.observe(voiceView, { attributes: true });
  }
});

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  if (voiceManager) {
    voiceManager.cleanup();
  }
});

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = VoiceTranscriptionManager;
}
