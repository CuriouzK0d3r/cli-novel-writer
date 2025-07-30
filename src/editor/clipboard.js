const { spawn } = require('child_process');
const os = require('os');

/**
 * Clipboard utility for handling copy/paste operations
 * Supports system clipboard integration across platforms
 */
class Clipboard {
  constructor() {
    this.internalClipboard = '';
    this.platform = os.platform();
  }

  /**
   * Copy text to system clipboard
   * @param {string} text - Text to copy
   * @returns {Promise<boolean>} - Success status
   */
  async copyToSystem(text) {
    try {
      await this.writeToSystemClipboard(text);
      this.internalClipboard = text;
      return true;
    } catch (error) {
      // Fallback to internal clipboard
      this.internalClipboard = text;
      return false;
    }
  }

  /**
   * Paste text from system clipboard
   * @returns {Promise<string>} - Clipboard content
   */
  async pasteFromSystem() {
    try {
      const systemContent = await this.readFromSystemClipboard();
      if (systemContent) {
        this.internalClipboard = systemContent;
        return systemContent;
      }
    } catch (error) {
      // Fallback to internal clipboard
    }
    return this.internalClipboard;
  }

  /**
   * Get internal clipboard content
   * @returns {string} - Clipboard content
   */
  getInternal() {
    return this.internalClipboard;
  }

  /**
   * Set internal clipboard content
   * @param {string} text - Text to store
   */
  setInternal(text) {
    this.internalClipboard = text;
  }

  /**
   * Clear clipboard
   */
  clear() {
    this.internalClipboard = '';
  }

  /**
   * Write text to system clipboard based on platform
   * @param {string} text - Text to write
   * @returns {Promise<void>}
   */
  async writeToSystemClipboard(text) {
    return new Promise((resolve, reject) => {
      let command, args;

      switch (this.platform) {
        case 'darwin': // macOS
          command = 'pbcopy';
          args = [];
          break;
        case 'linux':
          // Try xclip first, then xsel
          command = 'xclip';
          args = ['-selection', 'clipboard'];
          break;
        case 'win32': // Windows
          command = 'clip';
          args = [];
          break;
        default:
          reject(new Error(`Unsupported platform: ${this.platform}`));
          return;
      }

      const proc = spawn(command, args, { stdio: ['pipe', 'ignore', 'ignore'] });

      proc.on('error', (error) => {
        if (this.platform === 'linux' && command === 'xclip') {
          // Try xsel as fallback
          this.writeToSystemClipboardXsel(text).then(resolve).catch(reject);
        } else {
          reject(error);
        }
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Clipboard command failed with code ${code}`));
        }
      });

      proc.stdin.write(text);
      proc.stdin.end();
    });
  }

  /**
   * Fallback for Linux using xsel
   * @param {string} text - Text to write
   * @returns {Promise<void>}
   */
  async writeToSystemClipboardXsel(text) {
    return new Promise((resolve, reject) => {
      const proc = spawn('xsel', ['--clipboard', '--input'], {
        stdio: ['pipe', 'ignore', 'ignore']
      });

      proc.on('error', reject);
      proc.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`xsel failed with code ${code}`));
        }
      });

      proc.stdin.write(text);
      proc.stdin.end();
    });
  }

  /**
   * Read text from system clipboard based on platform
   * @returns {Promise<string>}
   */
  async readFromSystemClipboard() {
    return new Promise((resolve, reject) => {
      let command, args;

      switch (this.platform) {
        case 'darwin': // macOS
          command = 'pbpaste';
          args = [];
          break;
        case 'linux':
          // Try xclip first, then xsel
          command = 'xclip';
          args = ['-selection', 'clipboard', '-out'];
          break;
        case 'win32': // Windows
          command = 'powershell';
          args = ['-command', 'Get-Clipboard'];
          break;
        default:
          reject(new Error(`Unsupported platform: ${this.platform}`));
          return;
      }

      const proc = spawn(command, args, { stdio: ['ignore', 'pipe', 'ignore'] });
      let output = '';

      proc.stdout.on('data', (data) => {
        output += data.toString();
      });

      proc.on('error', (error) => {
        if (this.platform === 'linux' && command === 'xclip') {
          // Try xsel as fallback
          this.readFromSystemClipboardXsel().then(resolve).catch(reject);
        } else {
          reject(error);
        }
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Clipboard read failed with code ${code}`));
        }
      });
    });
  }

  /**
   * Fallback for Linux using xsel
   * @returns {Promise<string>}
   */
  async readFromSystemClipboardXsel() {
    return new Promise((resolve, reject) => {
      const proc = spawn('xsel', ['--clipboard', '--output'], {
        stdio: ['ignore', 'pipe', 'ignore']
      });
      let output = '';

      proc.stdout.on('data', (data) => {
        output += data.toString();
      });

      proc.on('error', reject);
      proc.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`xsel read failed with code ${code}`));
        }
      });
    });
  }

  /**
   * Check if system clipboard is available
   * @returns {Promise<boolean>}
   */
  async isSystemClipboardAvailable() {
    try {
      await this.readFromSystemClipboard();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get platform-specific clipboard info
   * @returns {Object} - Platform and available commands
   */
  getInfo() {
    const info = {
      platform: this.platform,
      commands: []
    };

    switch (this.platform) {
      case 'darwin':
        info.commands = ['pbcopy', 'pbpaste'];
        break;
      case 'linux':
        info.commands = ['xclip', 'xsel'];
        break;
      case 'win32':
        info.commands = ['clip', 'powershell'];
        break;
    }

    return info;
  }
}

module.exports = Clipboard;
