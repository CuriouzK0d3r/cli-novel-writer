const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

class VoiceRecorder extends EventEmitter {
  constructor() {
    super();
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.stream = null;
    this.recordingStartTime = null;
  }

  /**
   * Initialize the recorder with browser MediaRecorder API
   * This is meant to be used in the Electron renderer process
   */
  async initialize() {
    if (typeof window === 'undefined' || !navigator.mediaDevices) {
      throw new Error('Voice recording requires browser environment with MediaDevices API');
    }

    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        }
      });

      console.log('✅ Microphone access granted');
      this.emit('initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to access microphone:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Start recording audio
   */
  async startRecording() {
    if (this.isRecording) {
      throw new Error('Recording is already in progress');
    }

    if (!this.stream) {
      await this.initialize();
    }

    this.audioChunks = [];

    try {
      // Create MediaRecorder with appropriate options
      const options = {
        mimeType: 'audio/webm;codecs=opus'
      };

      // Fallback for browsers that don't support webm
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'audio/wav';
      }

      this.mediaRecorder = new MediaRecorder(this.stream, options);

      // Set up event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.isRecording = false;
        const audioBlob = new Blob(this.audioChunks, { type: this.mediaRecorder.mimeType });
        const duration = Date.now() - this.recordingStartTime;

        this.emit('recordingStopped', {
          audioBlob,
          duration,
          size: audioBlob.size,
          mimeType: this.mediaRecorder.mimeType
        });
      };

      this.mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
        this.emit('error', event.error);
      };

      // Start recording
      this.mediaRecorder.start(1000); // Collect data every second
      this.isRecording = true;
      this.recordingStartTime = Date.now();

      console.log('🎤 Recording started...');
      this.emit('recordingStarted');

    } catch (error) {
      console.error('Failed to start recording:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Stop recording
   */
  stopRecording() {
    if (!this.isRecording || !this.mediaRecorder) {
      return false;
    }

    try {
      this.mediaRecorder.stop();
      console.log('🛑 Recording stopped');
      return true;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      this.emit('error', error);
      return false;
    }
  }

  /**
   * Pause recording
   */
  pauseRecording() {
    if (!this.isRecording || !this.mediaRecorder) {
      return false;
    }

    try {
      this.mediaRecorder.pause();
      this.emit('recordingPaused');
      return true;
    } catch (error) {
      console.error('Failed to pause recording:', error);
      this.emit('error', error);
      return false;
    }
  }

  /**
   * Resume recording
   */
  resumeRecording() {
    if (!this.isRecording || !this.mediaRecorder) {
      return false;
    }

    try {
      this.mediaRecorder.resume();
      this.emit('recordingResumed');
      return true;
    } catch (error) {
      console.error('Failed to resume recording:', error);
      this.emit('error', error);
      return false;
    }
  }

  /**
   * Get current recording state
   */
  getState() {
    return {
      isRecording: this.isRecording,
      state: this.mediaRecorder ? this.mediaRecorder.state : 'inactive',
      duration: this.recordingStartTime ? Date.now() - this.recordingStartTime : 0,
      hasStream: !!this.stream
    };
  }

  /**
   * Convert audio blob to WAV format for transcription
   */
  async convertToWav(audioBlob) {
    return new Promise((resolve, reject) => {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const fileReader = new FileReader();

      fileReader.onload = async (event) => {
        try {
          const arrayBuffer = event.target.result;
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

          // Convert to WAV format
          const wavBuffer = this.audioBufferToWav(audioBuffer);
          const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });

          resolve(wavBlob);
        } catch (error) {
          reject(error);
        }
      };

      fileReader.onerror = reject;
      fileReader.readAsArrayBuffer(audioBlob);
    });
  }

  /**
   * Convert AudioBuffer to WAV format
   */
  audioBufferToWav(audioBuffer) {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;

    const buffer = audioBuffer.getChannelData(0);
    const length = buffer.length;
    const arrayBuffer = new ArrayBuffer(44 + length * bytesPerSample);
    const view = new DataView(arrayBuffer);

    // Write WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * bytesPerSample, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, length * bytesPerSample, true);

    // Convert float samples to 16-bit PCM
    let offset = 44;
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, buffer[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }

    return arrayBuffer;
  }

  /**
   * Save audio blob to file
   */
  async saveToFile(audioBlob, filePath) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const buffer = Buffer.from(reader.result);

        fs.writeFile(filePath, buffer, (error) => {
          if (error) {
            reject(error);
          } else {
            resolve(filePath);
          }
        });
      };

      reader.onerror = reject;
      reader.readAsArrayBuffer(audioBlob);
    });
  }

  /**
   * Get audio level for visualization
   */
  getAudioLevel() {
    if (!this.stream) {
      return 0;
    }

    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.microphone = this.audioContext.createMediaStreamSource(this.stream);
      this.microphone.connect(this.analyser);
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    }

    this.analyser.getByteFrequencyData(this.dataArray);

    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i];
    }

    return sum / this.dataArray.length / 255; // Normalize to 0-1
  }

  /**
   * Clean up resources
   */
  cleanup() {
    if (this.mediaRecorder && this.isRecording) {
      this.stopRecording();
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.removeAllListeners();
  }

  /**
   * Check browser compatibility
   */
  static isSupported() {
    return !!(navigator.mediaDevices &&
             navigator.mediaDevices.getUserMedia &&
             window.MediaRecorder);
  }

  /**
   * Get available audio input devices
   */
  static async getAudioDevices() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return [];
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'audioinput');
    } catch (error) {
      console.error('Failed to enumerate audio devices:', error);
      return [];
    }
  }
}

module.exports = VoiceRecorder;
