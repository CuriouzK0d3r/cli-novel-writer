// Voice Editor Integration Module
// Provides seamless voice dictation integration for the writing editor

class VoiceEditorIntegration {
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
    this.recordingDuration = 0;

    // Editor references
    this.activeEditor = null;
    this.cursorPosition = 0;

    // Voice transcription settings
    this.settings = {
      autoInsert: true,
      insertMode: "cursor", // 'cursor', 'append', 'replace'
      showVisualizer: true,
      autoSave: true,
      language: "en-US",
      sensitivity: 0.5,
      maxRecordingTime: 300000, // 5 minutes
      continuous: false,
    };

    // Initialize
    this.init();
  }

  async init() {
    try {
      this.createVoiceControls();
      this.bindEvents();
      this.loadSettings();
      await this.checkVoiceService();
      await this.checkMicrophonePermission();
      console.log("Voice Editor Integration initialized successfully");
    } catch (error) {
      console.error("Voice Editor Integration initialization failed:", error);
      this.showToast(
        "Voice integration unavailable: " + error.message,
        "warning",
      );
    }
  }

  async checkVoiceService() {
    try {
      // Check if we can access IPC
      let ipcRenderer = null;

      if (window.require) {
        try {
          ({ ipcRenderer } = window.require("electron"));
        } catch (requireError) {
          throw new Error("Electron not available - please use desktop app");
        }
      }

      if (!ipcRenderer && window.ipcRenderer) {
        ipcRenderer = window.ipcRenderer;
      }

      if (!ipcRenderer) {
        throw new Error("IPC not available - voice features disabled");
      }

      // Test voice service initialization
      const initResult = await ipcRenderer.invoke("voice-initialize");
      if (!initResult.success) {
        console.warn("Voice service warning:", initResult.error);
      }
    } catch (error) {
      console.warn("Voice service check failed:", error.message);
      // Don't throw - let the feature work but show warnings
    }
  }

  createVoiceControls() {
    // Create voice control elements for main editor
    this.createEditorVoiceControls();

    // Create voice control elements for focus mode
    this.createFocusModeVoiceControls();
  }

  createEditorVoiceControls() {
    const editorModal = document.getElementById("editor-modal");
    if (!editorModal) return;

    const toolbar = editorModal.querySelector(".editor-toolbar");
    if (!toolbar) return;

    // Create voice button container
    const voiceContainer = document.createElement("div");
    voiceContainer.className = "voice-controls-container";
    voiceContainer.innerHTML = `
      <button id="editor-voice-btn" class="btn btn-voice" title="Start Voice Dictation (Ctrl+Shift+V)">
        <i class="fas fa-microphone"></i>
        <span class="voice-status">Voice</span>
      </button>
      <div id="editor-voice-popup" class="voice-popup hidden">
        <div class="voice-popup-content">
          <div class="voice-record-button-container">
            <button id="editor-voice-record-btn" class="voice-record-button">
              <i class="fas fa-microphone"></i>
            </button>
            <div class="voice-status-text">
              <span id="editor-voice-status">Ready to record</span>
              <span id="editor-voice-timer" class="voice-timer">00:00</span>
            </div>
          </div>
          <div id="editor-voice-visualizer" class="voice-visualizer hidden">
            <canvas id="editor-voice-canvas" width="200" height="40"></canvas>
          </div>
          <div class="voice-controls">
            <button id="editor-voice-pause-btn" class="btn btn-secondary btn-sm" disabled>
              <i class="fas fa-pause"></i> Pause
            </button>
            <button id="editor-voice-stop-btn" class="btn btn-danger btn-sm" disabled>
              <i class="fas fa-stop"></i> Stop
            </button>
            <button id="editor-voice-settings-btn" class="btn btn-secondary btn-sm">
              <i class="fas fa-cog"></i> Settings
            </button>
          </div>
          <div id="editor-voice-preview" class="voice-preview hidden">
            <label>Preview:</label>
            <div id="editor-voice-preview-text" class="voice-preview-text"></div>
            <div class="voice-preview-actions">
              <button id="editor-voice-insert-btn" class="btn btn-primary btn-sm">
                <i class="fas fa-plus"></i> Insert
              </button>
              <button id="editor-voice-discard-btn" class="btn btn-secondary btn-sm">
                <i class="fas fa-times"></i> Discard
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    toolbar.appendChild(voiceContainer);
  }

  createFocusModeVoiceControls() {
    const focusMode = document.getElementById("focus-mode");
    if (!focusMode) return;

    const focusControls = focusMode.querySelector(".focus-controls");
    if (!focusControls) return;

    // Add voice button to focus mode controls
    const voiceBtn = document.createElement("button");
    voiceBtn.id = "focus-voice-btn";
    voiceBtn.className = "btn btn-voice";
    voiceBtn.title = "Voice Dictation (Ctrl+Shift+V)";
    voiceBtn.innerHTML = `
      <i class="fas fa-microphone"></i>
      <span class="voice-status">Voice</span>
    `;

    focusControls.insertBefore(voiceBtn, focusControls.firstChild);

    // Create floating voice controls for focus mode
    const voiceFloating = document.createElement("div");
    voiceFloating.id = "focus-voice-floating";
    voiceFloating.className = "voice-floating-controls hidden";
    voiceFloating.innerHTML = `
      <div class="voice-floating-content">
        <button id="focus-voice-record-btn" class="voice-record-button">
          <i class="fas fa-microphone"></i>
        </button>
        <div class="voice-floating-info">
          <span id="focus-voice-status">Ready</span>
          <span id="focus-voice-timer" class="voice-timer">00:00</span>
        </div>
        <div class="voice-floating-actions">
          <button id="focus-voice-stop-btn" class="btn btn-sm btn-danger" disabled>
            <i class="fas fa-stop"></i>
          </button>
          <button id="focus-voice-close-btn" class="btn btn-sm btn-secondary">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
      <div id="focus-voice-visualizer" class="voice-visualizer hidden">
        <canvas id="focus-voice-canvas" width="300" height="50"></canvas>
      </div>
    `;

    focusMode.appendChild(voiceFloating);
  }

  bindEvents() {
    // Main editor voice controls
    this.bindEditorVoiceEvents();

    // Focus mode voice controls
    this.bindFocusModeVoiceEvents();

    // Global keyboard shortcuts
    this.bindGlobalKeyboardShortcuts();

    // Editor change detection
    this.bindEditorChangeEvents();
  }

  bindEditorVoiceEvents() {
    const voiceBtn = document.getElementById("editor-voice-btn");
    const voicePopup = document.getElementById("editor-voice-popup");
    const recordBtn = document.getElementById("editor-voice-record-btn");
    const pauseBtn = document.getElementById("editor-voice-pause-btn");
    const stopBtn = document.getElementById("editor-voice-stop-btn");
    const settingsBtn = document.getElementById("editor-voice-settings-btn");
    const insertBtn = document.getElementById("editor-voice-insert-btn");
    const discardBtn = document.getElementById("editor-voice-discard-btn");

    if (voiceBtn) {
      voiceBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.toggleVoicePopup("editor");
      });
    }

    if (recordBtn) {
      recordBtn.addEventListener("click", () => this.toggleRecording("editor"));
    }

    if (pauseBtn) {
      pauseBtn.addEventListener("click", () => this.pauseRecording());
    }

    if (stopBtn) {
      stopBtn.addEventListener("click", () => this.stopRecording());
    }

    if (settingsBtn) {
      settingsBtn.addEventListener("click", () => this.showVoiceSettings());
    }

    if (insertBtn) {
      insertBtn.addEventListener("click", () => this.insertTranscribedText());
    }

    if (discardBtn) {
      discardBtn.addEventListener("click", () => this.discardTranscribedText());
    }

    // Close popup when clicking outside
    document.addEventListener("click", (e) => {
      if (
        voicePopup &&
        !voicePopup.contains(e.target) &&
        !voiceBtn?.contains(e.target)
      ) {
        this.hideVoicePopup("editor");
      }
    });
  }

  bindFocusModeVoiceEvents() {
    const voiceBtn = document.getElementById("focus-voice-btn");
    const floatingControls = document.getElementById("focus-voice-floating");
    const recordBtn = document.getElementById("focus-voice-record-btn");
    const stopBtn = document.getElementById("focus-voice-stop-btn");
    const closeBtn = document.getElementById("focus-voice-close-btn");

    if (voiceBtn) {
      voiceBtn.addEventListener("click", () => this.toggleVoiceFloating());
    }

    if (recordBtn) {
      recordBtn.addEventListener("click", () => this.toggleRecording("focus"));
    }

    if (stopBtn) {
      stopBtn.addEventListener("click", () => this.stopRecording());
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.hideVoiceFloating());
    }
  }

  bindGlobalKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      // Voice dictation shortcut (Ctrl+Shift+V)
      if (e.ctrlKey && e.shiftKey && e.key === "V") {
        e.preventDefault();
        this.handleVoiceShortcut();
      }

      // Stop recording with Escape
      if (e.key === "Escape" && this.isRecording) {
        e.preventDefault();
        this.stopRecording();
      }
    });
  }

  bindEditorChangeEvents() {
    // Track active editor
    const editorTextarea = document.getElementById("editor-textarea");
    const focusTextarea = document.getElementById("focus-mode-textarea");

    if (editorTextarea) {
      editorTextarea.addEventListener("focus", () => {
        this.setActiveEditor("editor");
      });

      editorTextarea.addEventListener("selectionchange", () => {
        this.updateCursorPosition();
      });

      editorTextarea.addEventListener("click", () => {
        this.updateCursorPosition();
      });

      editorTextarea.addEventListener("keyup", () => {
        this.updateCursorPosition();
      });
    }

    if (focusTextarea) {
      focusTextarea.addEventListener("focus", () => {
        this.setActiveEditor("focus");
      });

      focusTextarea.addEventListener("selectionchange", () => {
        this.updateCursorPosition();
      });

      focusTextarea.addEventListener("click", () => {
        this.updateCursorPosition();
      });

      focusTextarea.addEventListener("keyup", () => {
        this.updateCursorPosition();
      });
    }
  }

  setActiveEditor(type) {
    if (type === "editor") {
      this.activeEditor = document.getElementById("editor-textarea");
    } else if (type === "focus") {
      this.activeEditor = document.getElementById("focus-mode-textarea");
    }
    this.updateCursorPosition();
  }

  updateCursorPosition() {
    if (this.activeEditor) {
      this.cursorPosition = this.activeEditor.selectionStart;
    }
  }

  handleVoiceShortcut() {
    // Determine which editor is active and toggle voice accordingly
    const editorModal = document.getElementById("editor-modal");
    const focusMode = document.getElementById("focus-mode");

    if (focusMode?.classList.contains("active")) {
      this.toggleVoiceFloating();
    } else if (editorModal?.classList.contains("show")) {
      this.toggleVoicePopup("editor");
    }
  }

  toggleVoicePopup(type) {
    const popup = document.getElementById(`${type}-voice-popup`);
    if (!popup) return;

    if (popup.classList.contains("hidden")) {
      this.showVoicePopup(type);
    } else {
      this.hideVoicePopup(type);
    }
  }

  showVoicePopup(type) {
    const popup = document.getElementById(`${type}-voice-popup`);
    if (popup) {
      popup.classList.remove("hidden");
      this.setActiveEditor(type);
    }
  }

  hideVoicePopup(type) {
    const popup = document.getElementById(`${type}-voice-popup`);
    if (popup) {
      popup.classList.add("hidden");
    }
  }

  toggleVoiceFloating() {
    const floating = document.getElementById("focus-voice-floating");
    if (!floating) return;

    if (floating.classList.contains("hidden")) {
      this.showVoiceFloating();
    } else {
      this.hideVoiceFloating();
    }
  }

  showVoiceFloating() {
    const floating = document.getElementById("focus-voice-floating");
    if (floating) {
      floating.classList.remove("hidden");
      this.setActiveEditor("focus");
    }
  }

  hideVoiceFloating() {
    const floating = document.getElementById("focus-voice-floating");
    if (floating) {
      floating.classList.add("hidden");
    }
  }

  async toggleRecording(context) {
    if (!this.isRecording) {
      await this.startRecording(context);
    } else {
      await this.stopRecording();
    }
  }

  async startRecording(context) {
    try {
      // Check if voice service is available first
      await this.checkVoiceService();

      // Request microphone access with better error handling
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 44100,
          },
        });
      } catch (mediaError) {
        if (mediaError.name === "NotAllowedError") {
          throw new Error(
            "Microphone permission denied. Please allow microphone access and try again.",
          );
        } else if (mediaError.name === "NotFoundError") {
          throw new Error(
            "No microphone found. Please connect a microphone and try again.",
          );
        } else if (mediaError.name === "NotReadableError") {
          throw new Error(
            "Microphone is already in use by another application.",
          );
        } else {
          throw new Error("Microphone access failed: " + mediaError.message);
        }
      }

      // Set up MediaRecorder with format fallback
      this.audioChunks = [];
      let mimeType = "audio/webm;codecs=opus";

      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "audio/webm";
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = "audio/wav";
        }
      }

      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: mimeType,
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        await this.processRecording(context);
      };

      this.mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event.error);
        this.showToast("Recording error: " + event.error.message, "error");
        this.resetRecordingState();
      };

      // Set up audio visualization
      if (this.settings.showVisualizer) {
        this.setupAudioVisualization(context);
      }

      // Start recording
      this.mediaRecorder.start(1000); // Collect data every second
      this.isRecording = true;
      this.startTime = Date.now();

      // Update UI
      this.updateRecordingUI(context, "recording");

      // Start timer
      this.startRecordingTimer(context);

      // Auto-stop after max time
      setTimeout(() => {
        if (this.isRecording) {
          this.showToast("Maximum recording time reached", "warning");
          this.stopRecording();
        }
      }, this.settings.maxRecordingTime);

      this.showToast("Voice recording started - speak clearly", "success");
    } catch (error) {
      console.error("Error starting recording:", error);
      this.showToast("Failed to start recording: " + error.message, "error");
      this.resetRecordingState();
    }
  }

  async stopRecording() {
    if (!this.isRecording || !this.mediaRecorder) {
      return;
    }

    // Stop recording
    this.mediaRecorder.stop();
    this.isRecording = false;

    // Stop timer
    this.stopRecordingTimer();

    // Stop audio visualization
    this.stopAudioVisualization();

    // Clean up stream
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    // Update UI
    this.updateRecordingUI(null, "processing");

    this.showToast("Processing voice recording...", "info");
  }

  pauseRecording() {
    if (this.mediaRecorder && this.isRecording) {
      if (this.mediaRecorder.state === "recording") {
        this.mediaRecorder.pause();
        this.updateRecordingUI(null, "paused");
        this.showToast("Recording paused", "info");
      } else if (this.mediaRecorder.state === "paused") {
        this.mediaRecorder.resume();
        this.updateRecordingUI(null, "recording");
        this.showToast("Recording resumed", "info");
      }
    }
  }

  async processRecording(context) {
    try {
      if (this.audioChunks.length === 0) {
        this.showToast(
          "No audio data recorded - try speaking louder",
          "warning",
        );
        this.resetRecordingState();
        return;
      }

      // Show processing status
      this.updateRecordingUI(context, "processing");
      this.showToast("Processing speech...", "info");

      // Create audio blob with detected MIME type
      const mimeType = this.mediaRecorder
        ? this.mediaRecorder.mimeType
        : "audio/webm";
      const audioBlob = new Blob(this.audioChunks, { type: mimeType });

      // Validate audio blob size
      if (audioBlob.size < 1000) {
        // Less than 1KB indicates likely silence
        this.showToast(
          "Recording too short or silent - please try again",
          "warning",
        );
        this.resetRecordingState();
        return;
      }

      // Convert to format suitable for transcription
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("language", this.settings.language);

      // Send to transcription service with timeout
      const response = await Promise.race([
        this.transcribeAudio(formData),
        new Promise((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(
                  "Transcription timeout - please try a shorter recording",
                ),
              ),
            30000,
          ),
        ),
      ]);

      if (response && response.text && response.text.trim().length > 0) {
        this.handleTranscriptionResult(response.text, context);
      } else {
        this.showToast(
          "No speech detected - please speak more clearly",
          "warning",
        );
      }
    } catch (error) {
      console.error("Error processing recording:", error);

      // Provide specific error guidance
      let errorMessage = "Failed to process recording";
      if (error.message.includes("timeout")) {
        errorMessage = "Processing took too long - try a shorter recording";
      } else if (
        error.message.includes("network") ||
        error.message.includes("connection")
      ) {
        errorMessage = "Network error - check your connection and try again";
      } else if (error.message.includes("permission")) {
        errorMessage = "Permission error - please check microphone settings";
      } else if (error.message.includes("initialize")) {
        errorMessage = "Voice service unavailable - please restart the app";
      } else {
        errorMessage += ": " + error.message;
      }

      this.showToast(errorMessage, "error");
    } finally {
      this.resetRecordingState();
    }
  }

  async transcribeAudio(formData) {
    try {
      // Get ipcRenderer using the same pattern as existing voice system
      let ipcRenderer = null;

      if (window.require) {
        try {
          ({ ipcRenderer } = window.require("electron"));
        } catch (requireError) {
          console.warn("Failed to require electron:", requireError);
        }
      }

      // Fallback to global if available
      if (!ipcRenderer && window.ipcRenderer) {
        ipcRenderer = window.ipcRenderer;
      }

      if (!ipcRenderer) {
        throw new Error(
          "Electron IPC not available - please use the desktop app",
        );
      }

      // Convert FormData to buffer for IPC
      const audioBlob = formData.get("audio");
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioData = Array.from(new Uint8Array(arrayBuffer));

      // Initialize voice service first
      try {
        const initResult = await ipcRenderer.invoke("voice-initialize");
        if (!initResult.success) {
          console.warn("Voice initialization warning:", initResult.error);
        }
      } catch (initError) {
        console.warn(
          "Voice service initialization warning:",
          initError.message,
        );
      }

      // Save temporary audio file
      const tempResult = await ipcRenderer.invoke("save-temp-audio", {
        audioData,
      });

      if (!tempResult.success) {
        throw new Error(tempResult.error || "Failed to save temporary audio");
      }

      // Transcribe the audio file
      const transcribeResult = await ipcRenderer.invoke("transcribe-audio", {
        audioPath: tempResult.filePath,
        keepAudio: false,
      });

      if (!transcribeResult.success) {
        throw new Error(transcribeResult.error || "Transcription failed");
      }

      return { text: transcribeResult.text };
    } catch (error) {
      console.error("Transcription error:", error);

      // Provide more helpful error messages
      if (error.message.includes("not available")) {
        throw new Error(
          "Voice transcription requires the desktop app. Please use 'npm run gui-enhanced'",
        );
      } else if (error.message.includes("initialization")) {
        throw new Error(
          "Voice service failed to initialize. Please check your audio setup and try again.",
        );
      } else if (error.message.includes("save-temp-audio")) {
        throw new Error(
          "Failed to process audio file. Please check your microphone permissions.",
        );
      } else if (error.message.includes("transcribe-audio")) {
        throw new Error(
          "Speech recognition failed. Please speak clearly and try again.",
        );
      }

      throw error;
    }
  }

  handleTranscriptionResult(text, context) {
    if (!text || text.trim().length === 0) {
      this.showToast("No text transcribed", "warning");
      return;
    }

    // Clean up transcribed text
    const cleanText = this.cleanTranscribedText(text);

    if (this.settings.autoInsert) {
      this.insertTextAtCursor(cleanText);
      this.showToast("Voice text inserted", "success");
    } else {
      this.showTranscriptionPreview(cleanText, context);
    }
  }

  cleanTranscribedText(text) {
    // Basic text cleaning
    return text
      .trim()
      .replace(/\s+/g, " ") // Normalize whitespace
      .replace(/^\w/, (c) => c.toUpperCase()); // Capitalize first letter
  }

  showTranscriptionPreview(text, context) {
    const preview = document.getElementById(`${context}-voice-preview`);
    const previewText = document.getElementById(
      `${context}-voice-preview-text`,
    );

    if (preview && previewText) {
      previewText.textContent = text;
      preview.classList.remove("hidden");
      this.currentTranscription = text;
    }
  }

  insertTranscribedText() {
    if (this.currentTranscription) {
      this.insertTextAtCursor(this.currentTranscription);
      this.discardTranscribedText();
      this.showToast("Text inserted", "success");
    }
  }

  discardTranscribedText() {
    const previews = document.querySelectorAll(".voice-preview");
    previews.forEach((preview) => preview.classList.add("hidden"));
    this.currentTranscription = null;
  }

  insertTextAtCursor(text) {
    if (!this.activeEditor) return;

    const start = this.activeEditor.selectionStart;
    const end = this.activeEditor.selectionEnd;
    const currentValue = this.activeEditor.value;

    // Insert text at cursor position
    let newValue;
    if (this.settings.insertMode === "cursor") {
      newValue =
        currentValue.substring(0, start) + text + currentValue.substring(end);
    } else if (this.settings.insertMode === "append") {
      newValue = currentValue + (currentValue.endsWith(" ") ? "" : " ") + text;
    } else if (this.settings.insertMode === "replace") {
      newValue = text;
    }

    // Update editor value
    this.activeEditor.value = newValue;

    // Set cursor position after inserted text
    const newCursorPos = start + text.length;
    this.activeEditor.setSelectionRange(newCursorPos, newCursorPos);

    // Focus the editor
    this.activeEditor.focus();

    // Trigger input event for any listeners
    const inputEvent = new Event("input", { bubbles: true });
    this.activeEditor.dispatchEvent(inputEvent);

    // Auto-save if enabled
    if (this.settings.autoSave) {
      this.triggerAutoSave();
    }
  }

  setupAudioVisualization(context) {
    if (!this.stream) return;

    const canvas = document.getElementById(`${context}-voice-canvas`);
    const visualizer = document.getElementById(`${context}-voice-visualizer`);

    if (!canvas || !visualizer) return;

    visualizer.classList.remove("hidden");

    this.audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    const source = this.audioContext.createMediaStreamSource(this.stream);

    source.connect(this.analyser);
    this.analyser.fftSize = 256;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    const draw = () => {
      if (!this.isRecording) return;

      this.analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, width, height);

      // Draw waveform
      const barWidth = width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * height;

        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, "#4f46e5");
        gradient.addColorStop(1, "#7c3aed");

        ctx.fillStyle = gradient;
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }

      requestAnimationFrame(draw);
    };

    draw();
  }

  stopAudioVisualization() {
    // Hide visualizers
    const visualizers = document.querySelectorAll(".voice-visualizer");
    visualizers.forEach((viz) => viz.classList.add("hidden"));

    // Clean up audio context
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  startRecordingTimer(context) {
    this.recordingTimer = setInterval(() => {
      this.recordingDuration = Date.now() - this.startTime;
      this.updateTimerDisplay(context);
    }, 1000);
  }

  stopRecordingTimer() {
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }
  }

  updateTimerDisplay(context) {
    const timer = document.getElementById(`${context}-voice-timer`);
    if (timer) {
      const minutes = Math.floor(this.recordingDuration / 60000);
      const seconds = Math.floor((this.recordingDuration % 60000) / 1000);
      timer.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
  }

  updateRecordingUI(context, state) {
    // Update button states and text based on recording state
    const updateElements = (prefix) => {
      const recordBtn = document.getElementById(`${prefix}-voice-record-btn`);
      const stopBtn = document.getElementById(`${prefix}-voice-stop-btn`);
      const pauseBtn = document.getElementById(`${prefix}-voice-pause-btn`);
      const status = document.getElementById(`${prefix}-voice-status`);

      if (recordBtn) {
        recordBtn.className = `voice-record-button ${state}`;
        recordBtn.disabled = state === "processing";

        const icon = recordBtn.querySelector("i");
        if (icon) {
          if (state === "recording") {
            icon.className = "fas fa-stop";
          } else if (state === "processing") {
            icon.className = "fas fa-spinner fa-spin";
          } else {
            icon.className = "fas fa-microphone";
          }
        }
      }

      if (stopBtn) {
        stopBtn.disabled = state !== "recording" && state !== "paused";
      }

      if (pauseBtn) {
        pauseBtn.disabled = state !== "recording" && state !== "paused";
        const icon = pauseBtn.querySelector("i");
        if (icon && state === "paused") {
          icon.className = "fas fa-play";
        } else if (icon) {
          icon.className = "fas fa-pause";
        }
      }

      if (status) {
        const statusTexts = {
          recording: "Recording...",
          paused: "Paused",
          processing: "Processing...",
          ready: "Ready to record",
        };
        status.textContent = statusTexts[state] || "Ready";
      }
    };

    if (context) {
      updateElements(context);
    } else {
      // Update all contexts
      updateElements("editor");
      updateElements("focus");
    }
  }

  resetRecordingState() {
    this.isRecording = false;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.recordingDuration = 0;
    this.startTime = null;

    this.stopRecordingTimer();
    this.stopAudioVisualization();

    // Clean up stream
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    // Reset UI
    this.updateRecordingUI(null, "ready");
  }

  showVoiceSettings() {
    // Create and show voice settings modal
    const modal = this.createSettingsModal();
    document.body.appendChild(modal);
    modal.classList.add("show");
  }

  createSettingsModal() {
    const modal = document.createElement("div");
    modal.className = "modal voice-settings-modal";
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Voice Dictation Settings</h3>
          <button class="modal-close" onclick="this.closest('.modal').remove()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="setting-group">
            <label>
              <input type="checkbox" ${this.settings.autoInsert ? "checked" : ""}
                     onchange="voiceEditor.settings.autoInsert = this.checked">
              Auto-insert transcribed text
            </label>
          </div>
          <div class="setting-group">
            <label>Insert Mode:</label>
            <select onchange="voiceEditor.settings.insertMode = this.value">
              <option value="cursor" ${this.settings.insertMode === "cursor" ? "selected" : ""}>At cursor position</option>
              <option value="append" ${this.settings.insertMode === "append" ? "selected" : ""}>Append to end</option>
              <option value="replace" ${this.settings.insertMode === "replace" ? "selected" : ""}>Replace all text</option>
            </select>
          </div>
          <div class="setting-group">
            <label>
              <input type="checkbox" ${this.settings.showVisualizer ? "checked" : ""}
                     onchange="voiceEditor.settings.showVisualizer = this.checked">
              Show audio visualizer
            </label>
          </div>
          <div class="setting-group">
            <label>
              <input type="checkbox" ${this.settings.autoSave ? "checked" : ""}
                     onchange="voiceEditor.settings.autoSave = this.checked">
              Auto-save after insertion
            </label>
          </div>
          <div class="setting-group">
            <label>Language:</label>
            <select onchange="voiceEditor.settings.language = this.value">
              <option value="en-US" ${this.settings.language === "en-US" ? "selected" : ""}>English (US)</option>
              <option value="en-GB" ${this.settings.language === "en-GB" ? "selected" : ""}>English (UK)</option>
              <option value="es-ES" ${this.settings.language === "es-ES" ? "selected" : ""}>Spanish</option>
              <option value="fr-FR" ${this.settings.language === "fr-FR" ? "selected" : ""}>French</option>
              <option value="de-DE" ${this.settings.language === "de-DE" ? "selected" : ""}>German</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" onclick="voiceEditor.saveSettings(); this.closest('.modal').remove();">
            Save Settings
          </button>
        </div>
      </div>
    `;
    return modal;
  }

  async checkMicrophonePermission() {
    try {
      const result = await navigator.permissions.query({ name: "microphone" });
      if (result.state === "denied") {
        this.showToast(
          "Microphone permission denied. Voice dictation unavailable.",
          "error",
        );
      }
    } catch (error) {
      console.warn("Could not check microphone permission:", error);
    }
  }

  loadSettings() {
    const saved = localStorage.getItem("voice-editor-settings");
    if (saved) {
      try {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      } catch (error) {
        console.warn("Failed to load voice settings:", error);
      }
    }
  }

  saveSettings() {
    localStorage.setItem(
      "voice-editor-settings",
      JSON.stringify(this.settings),
    );
    this.showToast("Voice settings saved", "success");
  }

  triggerAutoSave() {
    // Trigger the app's auto-save functionality
    if (window.app && typeof window.app.scheduleAutoSave === "function") {
      window.app.scheduleAutoSave();
    } else {
      // Fallback: trigger input event to activate existing auto-save
      const inputEvent = new Event("input", { bubbles: true });
      if (this.activeEditor) {
        this.activeEditor.dispatchEvent(inputEvent);
      }
    }
  }

  showToast(message, type = "info") {
    // Create toast notification
    const toast = document.createElement("div");
    toast.className = `voice-toast ${type}`;
    toast.innerHTML = `
      <div class="voice-toast-content">
        <i class="voice-toast-icon fas fa-${this.getToastIcon(type)}"></i>
        <span class="voice-toast-message">${message}</span>
      </div>
    `;

    document.body.appendChild(toast);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  }

  getToastIcon(type) {
    const icons = {
      success: "check-circle",
      error: "exclamation-circle",
      warning: "exclamation-triangle",
      info: "info-circle",
    };
    return icons[type] || "info-circle";
  }

  cleanup() {
    // Clean up resources
    this.resetRecordingState();

    // Remove event listeners
    document.removeEventListener("keydown", this.handleKeydown);
    document.removeEventListener("click", this.handleDocumentClick);
  }
}

// Initialize voice editor integration
let voiceEditor = null;

// Wait for DOM to be ready
document.addEventListener("DOMContentLoaded", () => {
  // Initialize voice editor integration
  voiceEditor = new VoiceEditorIntegration();

  // Make it globally available for settings modal
  window.voiceEditor = voiceEditor;

  console.log("Voice Editor Integration initialized");
});

// Clean up on page unload
window.addEventListener("beforeunload", () => {
  if (voiceEditor) {
    voiceEditor.cleanup();
  }
});

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = VoiceEditorIntegration;
}
