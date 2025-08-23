const fs = require('fs');
const path = require('path');

class AudioUtils {
  /**
   * Get audio file information
   */
  static async getAudioInfo(filePath) {
    try {
      const stats = await fs.promises.stat(filePath);
      const extension = path.extname(filePath).toLowerCase();

      return {
        path: filePath,
        size: stats.size,
        extension,
        isSupported: this.isSupportedFormat(extension),
        mimeType: this.getMimeType(extension)
      };
    } catch (error) {
      throw new Error(`Failed to get audio info: ${error.message}`);
    }
  }

  /**
   * Check if audio format is supported
   */
  static isSupportedFormat(extension) {
    const supportedFormats = ['.wav', '.mp3', '.m4a', '.flac', '.ogg', '.webm'];
    return supportedFormats.includes(extension.toLowerCase());
  }

  /**
   * Get MIME type for audio file extension
   */
  static getMimeType(extension) {
    const mimeTypes = {
      '.wav': 'audio/wav',
      '.mp3': 'audio/mpeg',
      '.m4a': 'audio/mp4',
      '.flac': 'audio/flac',
      '.ogg': 'audio/ogg',
      '.webm': 'audio/webm'
    };

    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Validate audio file
   */
  static async validateAudioFile(filePath) {
    const errors = [];

    try {
      if (!fs.existsSync(filePath)) {
        errors.push('File does not exist');
        return { isValid: false, errors };
      }

      const info = await this.getAudioInfo(filePath);

      if (!info.isSupported) {
        errors.push(`Unsupported audio format: ${info.extension}`);
      }

      if (info.size === 0) {
        errors.push('File is empty');
      }

      if (info.size > 100 * 1024 * 1024) { // 100MB limit
        errors.push('File is too large (max 100MB)');
      }

      return {
        isValid: errors.length === 0,
        errors,
        info: errors.length === 0 ? info : null
      };
    } catch (error) {
      errors.push(`Validation failed: ${error.message}`);
      return { isValid: false, errors };
    }
  }

  /**
   * Convert Blob to Buffer (for Electron renderer to main process)
   */
  static async blobToBuffer(blob) {
    if (typeof blob.arrayBuffer === 'function') {
      const arrayBuffer = await blob.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } else {
      // Fallback for older browsers
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(Buffer.from(reader.result));
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
      });
    }
  }

  /**
   * Create a temporary file with unique name
   */
  static createTempFilename(extension = '.wav') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `voice_${timestamp}_${random}${extension}`;
  }

  /**
   * Estimate audio duration (rough approximation based on file size)
   */
  static estimateAudioDuration(fileSizeBytes, format = 'wav') {
    // Rough estimates in seconds per MB for different formats
    const estimatesPerMB = {
      wav: 6,    // Uncompressed WAV ~10MB per minute
      mp3: 60,   // MP3 ~1MB per minute at 128kbps
      m4a: 60,   // Similar to MP3
      flac: 30,  // FLAC ~2-4MB per minute
      ogg: 60,   // Similar to MP3
      webm: 60   // Similar to MP3
    };

    const fileSizeMB = fileSizeBytes / (1024 * 1024);
    const secondsPerMB = estimatesPerMB[format.replace('.', '')] || 30;

    return Math.round(fileSizeMB * secondsPerMB);
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Format duration in seconds to human readable string
   */
  static formatDuration(seconds) {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    } else if (seconds < 3600) {
      const mins = Math.floor(seconds / 60);
      const secs = Math.round(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = Math.round(seconds % 60);
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  }

  /**
   * Clean filename for cross-platform compatibility
   */
  static sanitizeFilename(filename) {
    // Remove or replace invalid characters
    return filename
      .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid chars with underscore
      .replace(/\s+/g, '_')          // Replace spaces with underscore
      .replace(/_{2,}/g, '_')        // Replace multiple underscores with single
      .replace(/^_+|_+$/g, '');      // Remove leading/trailing underscores
  }

  /**
   * Check available disk space
   */
  static async checkDiskSpace(directory = process.cwd()) {
    try {
      const stats = await fs.promises.statfs ? fs.promises.statfs(directory) : null;

      if (stats) {
        return {
          available: stats.bavail * stats.bsize,
          total: stats.blocks * stats.bsize,
          free: stats.bfree * stats.bsize
        };
      } else {
        // Fallback - not available on all systems
        return null;
      }
    } catch (error) {
      return null;
    }
  }

  /**
   * Create audio processing progress callback
   */
  static createProgressCallback(onProgress) {
    let lastUpdate = 0;
    const throttleMs = 100; // Update at most every 100ms

    return (current, total, stage = 'Processing') => {
      const now = Date.now();
      if (now - lastUpdate >= throttleMs || current === total) {
        lastUpdate = now;
        const percent = total > 0 ? Math.round((current / total) * 100) : 0;
        onProgress({ percent, current, total, stage });
      }
    };
  }

  /**
   * Generate audio waveform data (simplified version)
   */
  static async generateWaveformData(audioBuffer, samples = 100) {
    try {
      // This is a simplified version - a full implementation would use Web Audio API
      // or a library like WaveformData.js
      const data = new Array(samples).fill(0);

      if (audioBuffer && audioBuffer.length) {
        const blockSize = Math.floor(audioBuffer.length / samples);

        for (let i = 0; i < samples; i++) {
          const start = i * blockSize;
          const end = start + blockSize;
          let sum = 0;

          for (let j = start; j < end && j < audioBuffer.length; j++) {
            sum += Math.abs(audioBuffer[j] || 0);
          }

          data[i] = blockSize > 0 ? sum / blockSize : 0;
        }
      }

      return data;
    } catch (error) {
      console.warn('Failed to generate waveform data:', error.message);
      return new Array(samples).fill(0);
    }
  }

  /**
   * Check browser audio capabilities (for renderer process)
   */
  static checkBrowserAudioSupport() {
    if (typeof window === 'undefined') {
      return { supported: false, reason: 'Not in browser environment' };
    }

    const issues = [];

    if (!navigator.mediaDevices) {
      issues.push('MediaDevices API not available');
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      issues.push('getUserMedia not available');
    }

    if (!window.MediaRecorder) {
      issues.push('MediaRecorder API not available');
    }

    if (!window.AudioContext && !window.webkitAudioContext) {
      issues.push('Web Audio API not available');
    }

    return {
      supported: issues.length === 0,
      issues,
      capabilities: {
        mediaDevices: !!navigator.mediaDevices,
        getUserMedia: !!navigator.mediaDevices?.getUserMedia,
        mediaRecorder: !!window.MediaRecorder,
        audioContext: !!(window.AudioContext || window.webkitAudioContext)
      }
    };
  }

  /**
   * Get optimal audio recording settings
   */
  static getOptimalRecordingSettings() {
    return {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 16000, // Good balance for speech recognition
        channelCount: 1,   // Mono is sufficient for speech
        sampleSize: 16     // 16-bit is sufficient for speech
      },
      mimeType: this.getOptimalMimeType()
    };
  }

  /**
   * Get optimal MIME type for recording
   */
  static getOptimalMimeType() {
    if (typeof window === 'undefined' || !window.MediaRecorder) {
      return 'audio/wav';
    }

    const preferredTypes = [
      'audio/webm;codecs=opus',
      'audio/ogg;codecs=opus',
      'audio/webm',
      'audio/ogg',
      'audio/wav'
    ];

    for (const type of preferredTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'audio/wav'; // Fallback
  }
}

module.exports = AudioUtils;
