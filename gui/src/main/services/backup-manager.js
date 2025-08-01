const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');
const archiver = require('archiver');
const extract = require('extract-zip');

class BackupManager {
  constructor() {
    this.config = {
      autoBackupEnabled: true,
      autoBackupInterval: 300000, // 5 minutes
      maxBackups: 20,
      compressionLevel: 6,
      includeHidden: false,
      backupFormats: ['zip', 'tar.gz'],
      defaultFormat: 'zip',
      cloudSync: false,
      cloudProvider: null, // 'dropbox', 'google-drive', 'onedrive'
      encryptionEnabled: false,
      retentionDays: 30
    };

    this.activeBackups = new Map();
    this.backupHistory = [];
    this.autoBackupTimer = null;
    this.isBackingUp = false;

    this.loadBackupHistory();
  }

  // Create manual backup
  async createBackup(projectPath, options = {}) {
    try {
      this.isBackingUp = true;
      const backupOptions = { ...this.config, ...options };

      const backup = {
        id: this.generateBackupId(),
        projectPath,
        projectName: path.basename(projectPath),
        timestamp: new Date().toISOString(),
        type: 'manual',
        format: backupOptions.format || this.config.defaultFormat,
        size: 0,
        files: 0,
        status: 'in-progress',
        description: options.description || 'Manual backup'
      };

      this.activeBackups.set(backup.id, backup);

      // Determine backup location
      const backupDir = this.getBackupDirectory(projectPath);
      await fs.ensureDir(backupDir);

      const backupFileName = this.generateBackupFileName(backup);
      backup.filePath = path.join(backupDir, backupFileName);

      // Create backup based on format
      switch (backup.format) {
        case 'zip':
          await this.createZipBackup(projectPath, backup, backupOptions);
          break;
        case 'tar.gz':
          await this.createTarBackup(projectPath, backup, backupOptions);
          break;
        default:
          throw new Error(`Unsupported backup format: ${backup.format}`);
      }

      // Encrypt if enabled
      if (backupOptions.encryptionEnabled) {
        await this.encryptBackup(backup, backupOptions.encryptionKey);
      }

      // Update backup status
      backup.status = 'completed';
      backup.completedAt = new Date().toISOString();

      const stats = await fs.stat(backup.filePath);
      backup.size = stats.size;

      // Add to history
      this.backupHistory.push(backup);
      this.saveBackupHistory();

      // Clean up old backups
      await this.cleanupOldBackups(projectPath);

      // Upload to cloud if enabled
      if (backupOptions.cloudSync && backupOptions.cloudProvider) {
        await this.uploadToCloud(backup, backupOptions);
      }

      this.activeBackups.delete(backup.id);
      this.isBackingUp = false;

      return {
        success: true,
        backup: {
          id: backup.id,
          filePath: backup.filePath,
          size: backup.size,
          timestamp: backup.timestamp,
          files: backup.files
        }
      };

    } catch (error) {
      this.isBackingUp = false;
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create automatic backup
  async createAutoBackup(projectPath) {
    if (this.isBackingUp) {
      return { success: false, error: 'Backup already in progress' };
    }

    return await this.createBackup(projectPath, {
      type: 'auto',
      description: 'Automatic backup'
    });
  }

  // Restore from backup
  async restoreBackup(backupPath, targetPath = null, options = {}) {
    try {
      if (!await fs.pathExists(backupPath)) {
        throw new Error('Backup file not found');
      }

      const restoration = {
        id: this.generateBackupId(),
        backupPath,
        targetPath: targetPath || path.dirname(backupPath),
        timestamp: new Date().toISOString(),
        status: 'in-progress'
      };

      // Decrypt if necessary
      let actualBackupPath = backupPath;
      if (path.extname(backupPath) === '.enc') {
        actualBackupPath = await this.decryptBackup(backupPath, options.encryptionKey);
      }

      // Create backup of current state before restore
      if (targetPath && await fs.pathExists(targetPath) && options.createBackupBeforeRestore !== false) {
        await this.createBackup(targetPath, {
          description: 'Pre-restore backup',
          type: 'pre-restore'
        });
      }

      // Extract based on format
      const format = this.detectBackupFormat(actualBackupPath);

      switch (format) {
        case 'zip':
          await this.extractZipBackup(actualBackupPath, restoration.targetPath);
          break;
        case 'tar.gz':
          await this.extractTarBackup(actualBackupPath, restoration.targetPath);
          break;
        default:
          throw new Error(`Unsupported backup format: ${format}`);
      }

      restoration.status = 'completed';
      restoration.completedAt = new Date().toISOString();

      return {
        success: true,
        restoration: {
          id: restoration.id,
          targetPath: restoration.targetPath,
          timestamp: restoration.timestamp
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // List available backups
  async listBackups(projectPath = null) {
    if (projectPath) {
      // List backups for specific project
      return this.backupHistory.filter(backup =>
        backup.projectPath === projectPath
      ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    // List all backups
    return this.backupHistory.sort((a, b) =>
      new Date(b.timestamp) - new Date(a.timestamp)
    );
  }

  // Get backup details
  async getBackupInfo(backupId) {
    const backup = this.backupHistory.find(b => b.id === backupId);

    if (!backup) {
      return { success: false, error: 'Backup not found' };
    }

    try {
      const stats = await fs.stat(backup.filePath);

      return {
        success: true,
        backup: {
          ...backup,
          exists: true,
          currentSize: stats.size,
          lastModified: stats.mtime
        }
      };
    } catch (error) {
      return {
        success: true,
        backup: {
          ...backup,
          exists: false,
          error: 'Backup file not found'
        }
      };
    }
  }

  // Delete backup
  async deleteBackup(backupId) {
    try {
      const backup = this.backupHistory.find(b => b.id === backupId);

      if (!backup) {
        return { success: false, error: 'Backup not found' };
      }

      // Remove file
      if (await fs.pathExists(backup.filePath)) {
        await fs.remove(backup.filePath);
      }

      // Remove from history
      this.backupHistory = this.backupHistory.filter(b => b.id !== backupId);
      this.saveBackupHistory();

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Start automatic backup timer
  startAutoBackup(projectPath) {
    if (!this.config.autoBackupEnabled) return;

    this.stopAutoBackup();

    this.autoBackupTimer = setInterval(async () => {
      try {
        await this.createAutoBackup(projectPath);
      } catch (error) {
        console.error('Auto-backup failed:', error);
      }
    }, this.config.autoBackupInterval);
  }

  // Stop automatic backup timer
  stopAutoBackup() {
    if (this.autoBackupTimer) {
      clearInterval(this.autoBackupTimer);
      this.autoBackupTimer = null;
    }
  }

  // Backup creation methods
  async createZipBackup(projectPath, backup, options) {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(backup.filePath);
      const archive = archiver('zip', {
        zlib: { level: options.compressionLevel }
      });

      let fileCount = 0;

      output.on('close', () => {
        backup.files = fileCount;
        resolve();
      });

      archive.on('error', reject);
      archive.on('entry', () => fileCount++);

      archive.pipe(output);

      // Add project files
      this.addProjectFilesToArchive(archive, projectPath, options);

      archive.finalize();
    });
  }

  async createTarBackup(projectPath, backup, options) {
    return new Promise((resolve, reject) => {
      const args = [
        '-czf',
        backup.filePath,
        '-C',
        path.dirname(projectPath),
        path.basename(projectPath)
      ];

      if (!options.includeHidden) {
        args.push('--exclude=.*');
      }

      const tar = spawn('tar', args);

      tar.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`tar command failed with code ${code}`));
        }
      });

      tar.on('error', reject);
    });
  }

  // Backup extraction methods
  async extractZipBackup(backupPath, targetPath) {
    await extract(backupPath, { dir: targetPath });
  }

  async extractTarBackup(backupPath, targetPath) {
    return new Promise((resolve, reject) => {
      const tar = spawn('tar', [
        '-xzf',
        backupPath,
        '-C',
        targetPath
      ]);

      tar.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`tar extraction failed with code ${code}`));
        }
      });

      tar.on('error', reject);
    });
  }

  // Encryption methods
  async encryptBackup(backup, encryptionKey) {
    if (!encryptionKey) {
      throw new Error('Encryption key required');
    }

    const cipher = crypto.createCipher('aes-256-cbc', encryptionKey);
    const encryptedPath = backup.filePath + '.enc';

    const input = fs.createReadStream(backup.filePath);
    const output = fs.createWriteStream(encryptedPath);

    await new Promise((resolve, reject) => {
      input.pipe(cipher).pipe(output);
      output.on('finish', resolve);
      output.on('error', reject);
    });

    // Replace original with encrypted version
    await fs.remove(backup.filePath);
    backup.filePath = encryptedPath;
    backup.encrypted = true;
  }

  async decryptBackup(encryptedPath, encryptionKey) {
    if (!encryptionKey) {
      throw new Error('Encryption key required for encrypted backup');
    }

    const decipher = crypto.createDecipher('aes-256-cbc', encryptionKey);
    const decryptedPath = encryptedPath.replace('.enc', '');

    const input = fs.createReadStream(encryptedPath);
    const output = fs.createWriteStream(decryptedPath);

    await new Promise((resolve, reject) => {
      input.pipe(decipher).pipe(output);
      output.on('finish', resolve);
      output.on('error', reject);
    });

    return decryptedPath;
  }

  // Helper methods
  addProjectFilesToArchive(archive, projectPath, options) {
    const excludePatterns = [
      '**/.git/**',
      '**/node_modules/**',
      '**/.DS_Store',
      '**/Thumbs.db',
      '**/*.tmp',
      '**/*.temp'
    ];

    if (!options.includeHidden) {
      excludePatterns.push('**/.*');
    }

    // Add all project files except excluded patterns
    archive.glob('**/*', {
      cwd: projectPath,
      ignore: excludePatterns,
      dot: options.includeHidden
    });

    // Always include essential project files
    const essentialFiles = [
      'writers.config.json',
      'package.json',
      'README.md'
    ];

    for (const file of essentialFiles) {
      const filePath = path.join(projectPath, file);
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: file });
      }
    }
  }

  detectBackupFormat(filePath) {
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.zip') return 'zip';
    if (ext === '.gz' && filePath.endsWith('.tar.gz')) return 'tar.gz';

    // Try to detect by content
    try {
      const buffer = fs.readFileSync(filePath, { start: 0, end: 4 });

      // ZIP magic number
      if (buffer[0] === 0x50 && buffer[1] === 0x4B) return 'zip';

      // GZIP magic number
      if (buffer[0] === 0x1F && buffer[1] === 0x8B) return 'tar.gz';

    } catch (error) {
      // Ignore read errors
    }

    return 'unknown';
  }

  generateBackupId() {
    return crypto.randomBytes(8).toString('hex');
  }

  generateBackupFileName(backup) {
    const timestamp = new Date(backup.timestamp);
    const dateStr = timestamp.toISOString().slice(0, 19).replace(/[:.]/g, '-');
    const projectName = backup.projectName.replace(/[^a-zA-Z0-9]/g, '_');

    return `${projectName}_${dateStr}_${backup.type}.${backup.format}`;
  }

  getBackupDirectory(projectPath) {
    const { app } = require('electron');
    const backupsDir = path.join(app.getPath('userData'), 'backups');
    const projectBackupsDir = path.join(backupsDir, path.basename(projectPath));
    return projectBackupsDir;
  }

  async cleanupOldBackups(projectPath) {
    try {
      const projectBackups = await this.listBackups(projectPath);

      // Remove backups older than retention period
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

      const oldBackups = projectBackups.filter(backup =>
        new Date(backup.timestamp) < cutoffDate
      );

      for (const backup of oldBackups) {
        await this.deleteBackup(backup.id);
      }

      // Keep only max number of backups per project
      const remainingBackups = await this.listBackups(projectPath);

      if (remainingBackups.length > this.config.maxBackups) {
        const excessBackups = remainingBackups
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
          .slice(0, remainingBackups.length - this.config.maxBackups);

        for (const backup of excessBackups) {
          await this.deleteBackup(backup.id);
        }
      }

    } catch (error) {
      console.error('Error cleaning up old backups:', error);
    }
  }

  // Cloud integration stubs
  async uploadToCloud(backup, options) {
    // Implementation depends on cloud provider
    console.log(`Uploading backup to ${options.cloudProvider}:`, backup.id);

    switch (options.cloudProvider) {
      case 'dropbox':
        return await this.uploadToDropbox(backup, options);
      case 'google-drive':
        return await this.uploadToGoogleDrive(backup, options);
      case 'onedrive':
        return await this.uploadToOneDrive(backup, options);
      default:
        throw new Error(`Unsupported cloud provider: ${options.cloudProvider}`);
    }
  }

  async uploadToDropbox(backup, options) {
    // Dropbox integration stub
    console.log('Dropbox upload not implemented');
  }

  async uploadToGoogleDrive(backup, options) {
    // Google Drive integration stub
    console.log('Google Drive upload not implemented');
  }

  async uploadToOneDrive(backup, options) {
    // OneDrive integration stub
    console.log('OneDrive upload not implemented');
  }

  // Configuration management
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.saveConfig();
  }

  getConfig() {
    return { ...this.config };
  }

  async saveConfig() {
    try {
      const { app } = require('electron');
      const configPath = path.join(app.getPath('userData'), 'backup-config.json');
      await fs.writeFile(configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('Error saving backup config:', error);
    }
  }

  async loadConfig() {
    try {
      const { app } = require('electron');
      const configPath = path.join(app.getPath('userData'), 'backup-config.json');

      if (await fs.pathExists(configPath)) {
        const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
        this.config = { ...this.config, ...config };
      }
    } catch (error) {
      console.error('Error loading backup config:', error);
    }
  }

  // Backup history management
  async saveBackupHistory() {
    try {
      const { app } = require('electron');
      const historyPath = path.join(app.getPath('userData'), 'backup-history.json');
      await fs.writeFile(historyPath, JSON.stringify(this.backupHistory, null, 2));
    } catch (error) {
      console.error('Error saving backup history:', error);
    }
  }

  async loadBackupHistory() {
    try {
      const { app } = require('electron');
      const historyPath = path.join(app.getPath('userData'), 'backup-history.json');

      if (await fs.pathExists(historyPath)) {
        this.backupHistory = JSON.parse(await fs.readFile(historyPath, 'utf8'));
      }
    } catch (error) {
      console.error('Error loading backup history:', error);
      this.backupHistory = [];
    }
  }

  // Verification methods
  async verifyBackup(backupId) {
    try {
      const backup = this.backupHistory.find(b => b.id === backupId);

      if (!backup) {
        return { success: false, error: 'Backup not found' };
      }

      if (!await fs.pathExists(backup.filePath)) {
        return { success: false, error: 'Backup file not found' };
      }

      // Basic integrity check
      const stats = await fs.stat(backup.filePath);

      if (stats.size === 0) {
        return { success: false, error: 'Backup file is empty' };
      }

      // Format-specific verification
      const format = this.detectBackupFormat(backup.filePath);
      let isValid = false;

      switch (format) {
        case 'zip':
          isValid = await this.verifyZipBackup(backup.filePath);
          break;
        case 'tar.gz':
          isValid = await this.verifyTarBackup(backup.filePath);
          break;
        default:
          return { success: false, error: 'Unknown backup format' };
      }

      return {
        success: true,
        valid: isValid,
        size: stats.size,
        format
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async verifyZipBackup(filePath) {
    try {
      // Test zip file integrity
      const yauzl = require('yauzl');

      return new Promise((resolve) => {
        yauzl.open(filePath, { lazyEntries: true }, (err, zipfile) => {
          if (err) {
            resolve(false);
            return;
          }

          zipfile.readEntry();
          zipfile.on('entry', () => {
            zipfile.readEntry();
          });

          zipfile.on('end', () => {
            resolve(true);
          });

          zipfile.on('error', () => {
            resolve(false);
          });
        });
      });
    } catch (error) {
      return false;
    }
  }

  async verifyTarBackup(filePath) {
    return new Promise((resolve) => {
      const tar = spawn('tar', ['-tzf', filePath]);

      tar.on('close', (code) => {
        resolve(code === 0);
      });

      tar.on('error', () => {
        resolve(false);
      });
    });
  }

  // Status methods
  getStatus() {
    return {
      isBackingUp: this.isBackingUp,
      autoBackupEnabled: this.config.autoBackupEnabled,
      activeBackups: this.activeBackups.size,
      totalBackups: this.backupHistory.length,
      lastBackup: this.backupHistory.length > 0
        ? this.backupHistory[this.backupHistory.length - 1].timestamp
        : null
    };
  }

  getActiveBackups() {
    return Array.from(this.activeBackups.values());
  }
}

module.exports = new BackupManager();
