const { dialog } = require('electron');
const fs = require('fs-extra');
const path = require('path');
const { EventEmitter } = require('events');

class FileService extends EventEmitter {
  constructor() {
    super();
    this.recentFiles = [];
    this.maxRecentFiles = 10;
    this.supportedExtensions = ['.txt', '.md', '.markdown', '.text'];
  }

  /**
   * Show open file dialog
   */
  async showOpenDialog(parentWindow) {
    const options = {
      title: 'Open File',
      filters: [
        { name: 'Text Files', extensions: ['txt', 'md', 'markdown', 'text'] },
        { name: 'Markdown Files', extensions: ['md', 'markdown'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    };

    try {
      const result = await dialog.showOpenDialog(parentWindow, options);
      return result;
    } catch (error) {
      console.error('Error showing open dialog:', error);
      throw error;
    }
  }

  /**
   * Show save file dialog
   */
  async showSaveDialog(parentWindow, content = '') {
    const options = {
      title: 'Save File',
      filters: [
        { name: 'Markdown Files', extensions: ['md'] },
        { name: 'Text Files', extensions: ['txt'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      defaultPath: 'untitled.md'
    };

    try {
      const result = await dialog.showSaveDialog(parentWindow, options);

      if (!result.canceled && result.filePath) {
        await this.saveFile(result.filePath, content);
        this.addToRecentFiles(result.filePath);
        this.emit('fileSaved', result.filePath);
        return { success: true, filePath: result.filePath };
      }

      return { success: false, canceled: true };
    } catch (error) {
      console.error('Error showing save dialog:', error);
      throw error;
    }
  }

  /**
   * Load file content
   */
  async loadFile(filePath) {
    try {
      if (!await fs.pathExists(filePath)) {
        throw new Error(`File does not exist: ${filePath}`);
      }

      const stats = await fs.stat(filePath);
      if (!stats.isFile()) {
        throw new Error(`Path is not a file: ${filePath}`);
      }

      // Check file size (limit to 50MB for performance)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (stats.size > maxSize) {
        throw new Error(`File too large: ${this.formatFileSize(stats.size)}. Maximum size is ${this.formatFileSize(maxSize)}`);
      }

      const content = await fs.readFile(filePath, 'utf8');
      const fileInfo = {
        content,
        filePath,
        size: stats.size,
        modified: stats.mtime,
        created: stats.birthtime || stats.ctime,
        extension: path.extname(filePath).toLowerCase()
      };

      this.addToRecentFiles(filePath);
      this.emit('fileLoaded', fileInfo);

      return fileInfo;
    } catch (error) {
      console.error('Error loading file:', error);
      this.emit('fileError', { filePath, error: error.message });
      throw error;
    }
  }

  /**
   * Save file content
   */
  async saveFile(filePath, content) {
    try {
      // Ensure directory exists
      const dir = path.dirname(filePath);
      await fs.ensureDir(dir);

      // Create backup if file exists
      if (await fs.pathExists(filePath)) {
        await this.createBackup(filePath);
      }

      // Save the file
      await fs.writeFile(filePath, content, 'utf8');

      const stats = await fs.stat(filePath);
      const fileInfo = {
        filePath,
        size: stats.size,
        modified: stats.mtime,
        content
      };

      this.addToRecentFiles(filePath);
      this.emit('fileSaved', fileInfo);

      return fileInfo;
    } catch (error) {
      console.error('Error saving file:', error);
      this.emit('fileError', { filePath, error: error.message });
      throw error;
    }
  }

  /**
   * Create a backup of the file
   */
  async createBackup(filePath) {
    try {
      if (!await fs.pathExists(filePath)) {
        return;
      }

      const dir = path.dirname(filePath);
      const basename = path.basename(filePath, path.extname(filePath));
      const extension = path.extname(filePath);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

      const backupPath = path.join(dir, `.${basename}.backup.${timestamp}${extension}`);
      await fs.copy(filePath, backupPath);

      // Keep only last 5 backups
      await this.cleanupBackups(filePath);

      return backupPath;
    } catch (error) {
      console.error('Error creating backup:', error);
      // Don't throw here, backup failure shouldn't prevent saving
    }
  }

  /**
   * Clean up old backup files
   */
  async cleanupBackups(filePath) {
    try {
      const dir = path.dirname(filePath);
      const basename = path.basename(filePath, path.extname(filePath));
      const extension = path.extname(filePath);

      const files = await fs.readdir(dir);
      const backupFiles = files
        .filter(file => file.startsWith(`.${basename}.backup.`) && file.endsWith(extension))
        .map(file => ({
          name: file,
          path: path.join(dir, file),
          stat: null
        }));

      // Get file stats for sorting by modification time
      for (const backup of backupFiles) {
        try {
          backup.stat = await fs.stat(backup.path);
        } catch (error) {
          // Skip files that can't be accessed
        }
      }

      // Sort by modification time (newest first) and keep only 5
      const validBackups = backupFiles
        .filter(backup => backup.stat)
        .sort((a, b) => b.stat.mtime - a.stat.mtime);

      // Remove old backups
      const toDelete = validBackups.slice(5);
      for (const backup of toDelete) {
        try {
          await fs.unlink(backup.path);
        } catch (error) {
          console.error('Error deleting old backup:', error);
        }
      }
    } catch (error) {
      console.error('Error cleaning up backups:', error);
    }
  }

  /**
   * Add file to recent files list
   */
  addToRecentFiles(filePath) {
    // Remove if already exists
    this.recentFiles = this.recentFiles.filter(file => file !== filePath);

    // Add to beginning
    this.recentFiles.unshift(filePath);

    // Limit list size
    if (this.recentFiles.length > this.maxRecentFiles) {
      this.recentFiles = this.recentFiles.slice(0, this.maxRecentFiles);
    }

    this.emit('recentFilesChanged', this.recentFiles);
  }

  /**
   * Get recent files list
   */
  getRecentFiles() {
    return [...this.recentFiles];
  }

  /**
   * Clear recent files list
   */
  clearRecentFiles() {
    this.recentFiles = [];
    this.emit('recentFilesChanged', this.recentFiles);
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath) {
    try {
      return await fs.pathExists(filePath);
    } catch (error) {
      return false;
    }
  }

  /**
   * Get file information
   */
  async getFileInfo(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        modified: stats.mtime,
        created: stats.birthtime || stats.ctime,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        extension: path.extname(filePath).toLowerCase(),
        basename: path.basename(filePath),
        dirname: path.dirname(filePath)
      };
    } catch (error) {
      throw new Error(`Cannot get file info: ${error.message}`);
    }
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Check if file extension is supported
   */
  isSupportedFile(filePath) {
    const extension = path.extname(filePath).toLowerCase();
    return this.supportedExtensions.includes(extension);
  }

  /**
   * Create new file
   */
  async createFile(filePath, content = '') {
    try {
      // Check if file already exists
      if (await fs.pathExists(filePath)) {
        throw new Error(`File already exists: ${filePath}`);
      }

      // Ensure directory exists
      const dir = path.dirname(filePath);
      await fs.ensureDir(dir);

      // Create the file
      await fs.writeFile(filePath, content, 'utf8');

      const stats = await fs.stat(filePath);
      const fileInfo = {
        filePath,
        size: stats.size,
        modified: stats.mtime,
        created: stats.birthtime || stats.ctime,
        content
      };

      this.addToRecentFiles(filePath);
      this.emit('fileCreated', fileInfo);

      return fileInfo;
    } catch (error) {
      console.error('Error creating file:', error);
      this.emit('fileError', { filePath, error: error.message });
      throw error;
    }
  }

  /**
   * Delete file
   */
  async deleteFile(filePath) {
    try {
      if (!await fs.pathExists(filePath)) {
        throw new Error(`File does not exist: ${filePath}`);
      }

      // Create backup before deletion
      await this.createBackup(filePath);

      // Delete the file
      await fs.unlink(filePath);

      // Remove from recent files
      this.recentFiles = this.recentFiles.filter(file => file !== filePath);
      this.emit('recentFilesChanged', this.recentFiles);
      this.emit('fileDeleted', filePath);

      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      this.emit('fileError', { filePath, error: error.message });
      throw error;
    }
  }

  /**
   * Rename/move file
   */
  async renameFile(oldPath, newPath) {
    try {
      if (!await fs.pathExists(oldPath)) {
        throw new Error(`File does not exist: ${oldPath}`);
      }

      if (await fs.pathExists(newPath)) {
        throw new Error(`Target file already exists: ${newPath}`);
      }

      // Ensure target directory exists
      const newDir = path.dirname(newPath);
      await fs.ensureDir(newDir);

      // Move the file
      await fs.move(oldPath, newPath);

      // Update recent files
      const index = this.recentFiles.indexOf(oldPath);
      if (index !== -1) {
        this.recentFiles[index] = newPath;
        this.emit('recentFilesChanged', this.recentFiles);
      }

      this.emit('fileRenamed', { oldPath, newPath });

      return newPath;
    } catch (error) {
      console.error('Error renaming file:', error);
      this.emit('fileError', { filePath: oldPath, error: error.message });
      throw error;
    }
  }

  /**
   * Watch file for changes
   */
  watchFile(filePath, callback) {
    try {
      const watcher = fs.watch(filePath, (eventType, filename) => {
        if (eventType === 'change') {
          callback(filePath);
        }
      });

      return watcher;
    } catch (error) {
      console.error('Error watching file:', error);
      throw error;
    }
  }
}

module.exports = FileService;
