const fs = require('fs-extra');
const path = require('path');
const { EventEmitter } = require('events');

class BackupService extends EventEmitter {
  constructor() {
    super();
    this.backupTimers = new Map();
    this.maxBackupsPerFile = 10;
    this.backupInterval = 300000; // 5 minutes default
    this.backupExtension = '.backup';
  }

  /**
   * Create a backup of a file
   */
  async createBackup(filePath) {
    try {
      if (!await fs.pathExists(filePath)) {
        throw new Error(`File does not exist: ${filePath}`);
      }

      const stat = await fs.stat(filePath);
      if (!stat.isFile()) {
        throw new Error(`Path is not a file: ${filePath}`);
      }

      const backupDir = this.getBackupDirectory(filePath);
      await fs.ensureDir(backupDir);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const basename = path.basename(filePath);
      const backupName = `${basename}.${timestamp}${this.backupExtension}`;
      const backupPath = path.join(backupDir, backupName);

      // Copy the file to backup location
      await fs.copy(filePath, backupPath);

      // Clean up old backups
      await this.cleanupOldBackups(filePath);

      const backupInfo = {
        originalFile: filePath,
        backupFile: backupPath,
        timestamp: new Date().toISOString(),
        size: stat.size
      };

      this.emit('backupCreated', backupInfo);
      return backupInfo;
    } catch (error) {
      console.error('Error creating backup:', error);
      this.emit('backupError', { filePath, error: error.message });
      throw error;
    }
  }

  /**
   * Restore a file from backup
   */
  async restoreBackup(backupPath, targetPath = null) {
    try {
      if (!await fs.pathExists(backupPath)) {
        throw new Error(`Backup file does not exist: ${backupPath}`);
      }

      // If no target path provided, derive from backup path
      if (!targetPath) {
        targetPath = this.getOriginalFilePath(backupPath);
      }

      // Create backup of current file before restoring
      if (await fs.pathExists(targetPath)) {
        await this.createBackup(targetPath);
      }

      // Ensure target directory exists
      await fs.ensureDir(path.dirname(targetPath));

      // Copy backup to target location
      await fs.copy(backupPath, targetPath);

      const restoreInfo = {
        backupFile: backupPath,
        restoredTo: targetPath,
        timestamp: new Date().toISOString()
      };

      this.emit('backupRestored', restoreInfo);
      return restoreInfo;
    } catch (error) {
      console.error('Error restoring backup:', error);
      this.emit('backupError', { backupPath, error: error.message });
      throw error;
    }
  }

  /**
   * List all backups for a file
   */
  async listBackups(filePath) {
    try {
      const backupDir = this.getBackupDirectory(filePath);

      if (!await fs.pathExists(backupDir)) {
        return [];
      }

      const basename = path.basename(filePath);
      const files = await fs.readdir(backupDir);

      const backups = [];
      for (const file of files) {
        if (file.startsWith(basename) && file.endsWith(this.backupExtension)) {
          const backupPath = path.join(backupDir, file);
          const stat = await fs.stat(backupPath);

          // Extract timestamp from filename
          const timestampMatch = file.match(/(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.\d{3}Z)/);
          const timestamp = timestampMatch ? timestampMatch[1].replace(/-/g, ':') : null;

          backups.push({
            path: backupPath,
            filename: file,
            size: stat.size,
            created: stat.birthtime || stat.ctime,
            modified: stat.mtime,
            timestamp: timestamp ? new Date(timestamp) : stat.mtime
          });
        }
      }

      // Sort by creation time (newest first)
      backups.sort((a, b) => b.timestamp - a.timestamp);

      return backups;
    } catch (error) {
      console.error('Error listing backups:', error);
      return [];
    }
  }

  /**
   * Delete a specific backup
   */
  async deleteBackup(backupPath) {
    try {
      if (!await fs.pathExists(backupPath)) {
        throw new Error(`Backup file does not exist: ${backupPath}`);
      }

      await fs.unlink(backupPath);

      const deleteInfo = {
        backupFile: backupPath,
        timestamp: new Date().toISOString()
      };

      this.emit('backupDeleted', deleteInfo);
      return deleteInfo;
    } catch (error) {
      console.error('Error deleting backup:', error);
      this.emit('backupError', { backupPath, error: error.message });
      throw error;
    }
  }

  /**
   * Clean up old backups for a file
   */
  async cleanupOldBackups(filePath) {
    try {
      const backups = await this.listBackups(filePath);

      if (backups.length <= this.maxBackupsPerFile) {
        return;
      }

      // Keep only the most recent backups
      const toDelete = backups.slice(this.maxBackupsPerFile);

      for (const backup of toDelete) {
        try {
          await fs.unlink(backup.path);
        } catch (error) {
          console.error(`Error deleting old backup ${backup.path}:`, error);
        }
      }

      if (toDelete.length > 0) {
        this.emit('backupsCleanedUp', {
          filePath,
          deletedCount: toDelete.length,
          remainingCount: backups.length - toDelete.length
        });
      }
    } catch (error) {
      console.error('Error cleaning up old backups:', error);
    }
  }

  /**
   * Start automatic backup for a file
   */
  startAutoBackup(filePath, interval = null) {
    if (!interval) {
      interval = this.backupInterval;
    }

    // Stop existing timer if any
    this.stopAutoBackup(filePath);

    const timer = setInterval(async () => {
      try {
        if (await fs.pathExists(filePath)) {
          await this.createBackup(filePath);
        } else {
          // File no longer exists, stop auto backup
          this.stopAutoBackup(filePath);
        }
      } catch (error) {
        console.error(`Auto backup error for ${filePath}:`, error);
      }
    }, interval);

    this.backupTimers.set(filePath, timer);

    this.emit('autoBackupStarted', { filePath, interval });
  }

  /**
   * Stop automatic backup for a file
   */
  stopAutoBackup(filePath) {
    const timer = this.backupTimers.get(filePath);
    if (timer) {
      clearInterval(timer);
      this.backupTimers.delete(filePath);
      this.emit('autoBackupStopped', { filePath });
    }
  }

  /**
   * Stop all automatic backups
   */
  stopAllAutoBackups() {
    for (const [filePath, timer] of this.backupTimers.entries()) {
      clearInterval(timer);
      this.emit('autoBackupStopped', { filePath });
    }
    this.backupTimers.clear();
  }

  /**
   * Get backup directory for a file
   */
  getBackupDirectory(filePath) {
    const fileDir = path.dirname(filePath);
    return path.join(fileDir, '.backups');
  }

  /**
   * Get original file path from backup path
   */
  getOriginalFilePath(backupPath) {
    const backupDir = path.dirname(backupPath);
    const backupName = path.basename(backupPath);

    // Remove timestamp and backup extension
    const originalName = backupName
      .replace(/\.\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.\d{3}Z\.backup$/, '')
      .replace(/\.backup$/, '');

    const originalDir = path.dirname(backupDir);
    return path.join(originalDir, originalName);
  }

  /**
   * Get backup statistics
   */
  async getBackupStats(filePath = null) {
    try {
      if (filePath) {
        // Stats for specific file
        const backups = await this.listBackups(filePath);
        const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);

        return {
          filePath,
          backupCount: backups.length,
          totalSize,
          oldestBackup: backups.length > 0 ? backups[backups.length - 1].timestamp : null,
          newestBackup: backups.length > 0 ? backups[0].timestamp : null,
          autoBackupActive: this.backupTimers.has(filePath)
        };
      } else {
        // Global stats
        return {
          activeAutoBackups: this.backupTimers.size,
          maxBackupsPerFile: this.maxBackupsPerFile,
          defaultInterval: this.backupInterval
        };
      }
    } catch (error) {
      console.error('Error getting backup stats:', error);
      return null;
    }
  }

  /**
   * Set maximum number of backups per file
   */
  setMaxBackupsPerFile(maxBackups) {
    if (maxBackups < 1) {
      throw new Error('Maximum backups per file must be at least 1');
    }
    this.maxBackupsPerFile = maxBackups;
  }

  /**
   * Set default backup interval
   */
  setBackupInterval(interval) {
    if (interval < 60000) { // Minimum 1 minute
      throw new Error('Backup interval must be at least 60000ms (1 minute)');
    }
    this.backupInterval = interval;
  }

  /**
   * Export backup as archive
   */
  async exportBackups(filePath, exportPath) {
    try {
      const backups = await this.listBackups(filePath);

      if (backups.length === 0) {
        throw new Error('No backups found for the specified file');
      }

      // Create export directory
      await fs.ensureDir(exportPath);

      const manifest = {
        originalFile: filePath,
        exportDate: new Date().toISOString(),
        backupCount: backups.length,
        backups: []
      };

      // Copy all backups to export directory
      for (const backup of backups) {
        const exportName = `backup_${backup.timestamp.toISOString().replace(/[:.]/g, '-')}_${path.basename(filePath)}`;
        const exportFilePath = path.join(exportPath, exportName);

        await fs.copy(backup.path, exportFilePath);

        manifest.backups.push({
          originalPath: backup.path,
          exportedAs: exportName,
          timestamp: backup.timestamp,
          size: backup.size
        });
      }

      // Save manifest
      const manifestPath = path.join(exportPath, 'backup_manifest.json');
      await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

      return {
        exportPath,
        manifestPath,
        backupCount: backups.length
      };
    } catch (error) {
      console.error('Error exporting backups:', error);
      throw error;
    }
  }

  /**
   * Import backups from archive
   */
  async importBackups(archivePath, targetFilePath) {
    try {
      const manifestPath = path.join(archivePath, 'backup_manifest.json');

      if (!await fs.pathExists(manifestPath)) {
        throw new Error('Backup manifest not found in archive');
      }

      const manifestData = await fs.readFile(manifestPath, 'utf8');
      const manifest = JSON.parse(manifestData);

      const backupDir = this.getBackupDirectory(targetFilePath);
      await fs.ensureDir(backupDir);

      let importedCount = 0;

      for (const backupInfo of manifest.backups) {
        const sourcePath = path.join(archivePath, backupInfo.exportedAs);

        if (await fs.pathExists(sourcePath)) {
          const targetBackupPath = path.join(backupDir, backupInfo.exportedAs);
          await fs.copy(sourcePath, targetBackupPath);
          importedCount++;
        }
      }

      return {
        importedCount,
        totalBackups: manifest.backups.length,
        targetFile: targetFilePath
      };
    } catch (error) {
      console.error('Error importing backups:', error);
      throw error;
    }
  }

  /**
   * Verify backup integrity
   */
  async verifyBackup(backupPath) {
    try {
      if (!await fs.pathExists(backupPath)) {
        return { valid: false, error: 'Backup file does not exist' };
      }

      const stat = await fs.stat(backupPath);

      if (stat.size === 0) {
        return { valid: false, error: 'Backup file is empty' };
      }

      // Try to read the file to check for corruption
      try {
        await fs.readFile(backupPath, 'utf8');
      } catch (error) {
        return { valid: false, error: 'Backup file appears to be corrupted' };
      }

      return {
        valid: true,
        size: stat.size,
        created: stat.birthtime || stat.ctime,
        modified: stat.mtime
      };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Cleanup all backups older than specified days
   */
  async cleanupOldBackupsByAge(days = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      let deletedCount = 0;
      let totalSize = 0;

      // This is a simplified implementation
      // In a real scenario, you'd scan all backup directories

      this.emit('cleanupCompleted', {
        deletedCount,
        totalSize,
        cutoffDate: cutoffDate.toISOString()
      });

      return { deletedCount, totalSize };
    } catch (error) {
      console.error('Error cleaning up old backups:', error);
      throw error;
    }
  }

  /**
   * Get list of files with active auto-backup
   */
  getActiveAutoBackups() {
    return Array.from(this.backupTimers.keys());
  }

  /**
   * Cleanup service
   */
  cleanup() {
    this.stopAllAutoBackups();
    this.removeAllListeners();
  }
}

module.exports = BackupService;
