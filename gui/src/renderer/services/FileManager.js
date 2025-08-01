/**
 * FileManager Service - Renderer Process
 *
 * Handles file operations in the renderer process by communicating
 * with the main process through IPC. Manages recent files, file
 * validation, and local file state.
 */

class FileManager extends EventTarget {
    constructor() {
        super();
        this.recentFiles = [];
        this.currentFile = null;
        this.maxRecentFiles = 10;
        this.supportedExtensions = ['.txt', '.md', '.markdown', '.text'];
        this.initialized = false;
    }

    /**
     * Initialize the file manager
     */
    async init() {
        try {
            // Load recent files from local storage
            await this.loadRecentFiles();

            // Load settings
            await this.loadSettings();

            this.initialized = true;
            console.log('FileManager initialized');
        } catch (error) {
            console.error('Error initializing FileManager:', error);
            throw error;
        }
    }

    /**
     * Load recent files from storage
     */
    async loadRecentFiles() {
        try {
            const stored = localStorage.getItem('writers-cli-recent-files');
            if (stored) {
                const files = JSON.parse(stored);
                // Validate and filter existing files
                this.recentFiles = await this.validateRecentFiles(files);
            }
        } catch (error) {
            console.error('Error loading recent files:', error);
            this.recentFiles = [];
        }
    }

    /**
     * Save recent files to storage
     */
    saveRecentFiles() {
        try {
            localStorage.setItem('writers-cli-recent-files', JSON.stringify(this.recentFiles));
        } catch (error) {
            console.error('Error saving recent files:', error);
        }
    }

    /**
     * Load settings
     */
    async loadSettings() {
        try {
            if (window.electronAPI) {
                const settings = await window.electronAPI.loadSettings();
                this.maxRecentFiles = settings.file?.maxRecentFiles || 10;
                this.supportedExtensions = settings.file?.supportedExtensions || this.supportedExtensions;
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    /**
     * Validate recent files (check if they still exist)
     */
    async validateRecentFiles(files) {
        const validFiles = [];

        for (const file of files) {
            try {
                // For now, just add them all - validation would require IPC call
                // In a full implementation, we'd check file existence
                validFiles.push(file);
            } catch (error) {
                console.log(`Removing invalid recent file: ${file.path}`);
            }
        }

        return validFiles.slice(0, this.maxRecentFiles);
    }

    /**
     * Create a new file
     */
    async createNewFile() {
        try {
            this.currentFile = null;

            this.dispatchEvent(new CustomEvent('fileCreated', {
                detail: { type: 'new' }
            }));

            return { success: true, type: 'new' };
        } catch (error) {
            console.error('Error creating new file:', error);
            throw error;
        }
    }

    /**
     * Open file dialog and load file
     */
    async openFileDialog() {
        try {
            if (!window.electronAPI) {
                throw new Error('Electron API not available');
            }

            const result = await window.electronAPI.openFile();

            if (result && !result.canceled && result.filePaths && result.filePaths.length > 0) {
                const filePath = result.filePaths[0];
                return await this.loadFile(filePath);
            }

            return { success: false, canceled: true };
        } catch (error) {
            console.error('Error opening file dialog:', error);
            throw error;
        }
    }

    /**
     * Load a file
     */
    async loadFile(filePath) {
        try {
            if (!window.electronAPI) {
                throw new Error('Electron API not available');
            }

            // Validate file extension
            if (!this.isSupportedFile(filePath)) {
                throw new Error('Unsupported file type');
            }

            const fileData = await window.electronAPI.loadFile(filePath);

            if (fileData) {
                this.currentFile = {
                    ...fileData,
                    path: filePath,
                    name: this.getFileName(filePath),
                    dir: this.getFileDirectory(filePath),
                    extension: this.getFileExtension(filePath),
                    lastOpened: new Date().toISOString()
                };

                // Add to recent files
                this.addToRecentFiles(this.currentFile);

                this.dispatchEvent(new CustomEvent('fileLoaded', {
                    detail: { file: this.currentFile }
                }));

                return { success: true, file: this.currentFile };
            }

            throw new Error('Failed to load file data');
        } catch (error) {
            console.error('Error loading file:', error);
            throw error;
        }
    }

    /**
     * Save current file
     */
    async saveFile(content) {
        try {
            if (!window.electronAPI) {
                throw new Error('Electron API not available');
            }

            if (!this.currentFile || !this.currentFile.path) {
                // No current file, use Save As
                return await this.saveAsFile(content);
            }

            const result = await window.electronAPI.saveFile(this.currentFile.path, content);

            if (result) {
                this.currentFile.modified = new Date().toISOString();
                this.currentFile.size = content.length;

                this.dispatchEvent(new CustomEvent('fileSaved', {
                    detail: { file: this.currentFile }
                }));

                return { success: true, file: this.currentFile };
            }

            throw new Error('Failed to save file');
        } catch (error) {
            console.error('Error saving file:', error);
            throw error;
        }
    }

    /**
     * Save file with new name/location
     */
    async saveAsFile(content) {
        try {
            if (!window.electronAPI) {
                throw new Error('Electron API not available');
            }

            const result = await window.electronAPI.saveFileAs(content);

            if (result && result.success && result.filePath) {
                // Update current file info
                this.currentFile = {
                    path: result.filePath,
                    name: this.getFileName(result.filePath),
                    dir: this.getFileDirectory(result.filePath),
                    extension: this.getFileExtension(result.filePath),
                    content: content,
                    size: content.length,
                    created: new Date().toISOString(),
                    modified: new Date().toISOString(),
                    lastOpened: new Date().toISOString()
                };

                // Add to recent files
                this.addToRecentFiles(this.currentFile);

                this.dispatchEvent(new CustomEvent('fileSaved', {
                    detail: { file: this.currentFile, type: 'saveAs' }
                }));

                return { success: true, file: this.currentFile };
            }

            return { success: false, canceled: true };
        } catch (error) {
            console.error('Error saving file as:', error);
            throw error;
        }
    }

    /**
     * Add file to recent files list
     */
    addToRecentFiles(file) {
        if (!file || !file.path) return;

        const fileInfo = {
            path: file.path,
            name: file.name || this.getFileName(file.path),
            dir: file.dir || this.getFileDirectory(file.path),
            extension: file.extension || this.getFileExtension(file.path),
            lastOpened: file.lastOpened || new Date().toISOString(),
            size: file.size || 0
        };

        // Remove if already exists
        this.recentFiles = this.recentFiles.filter(f => f.path !== file.path);

        // Add to beginning
        this.recentFiles.unshift(fileInfo);

        // Limit list size
        if (this.recentFiles.length > this.maxRecentFiles) {
            this.recentFiles = this.recentFiles.slice(0, this.maxRecentFiles);
        }

        // Save to storage
        this.saveRecentFiles();

        // Emit event
        this.dispatchEvent(new CustomEvent('recentFilesChanged', {
            detail: { files: this.recentFiles }
        }));
    }

    /**
     * Remove file from recent files
     */
    removeFromRecentFiles(filePath) {
        this.recentFiles = this.recentFiles.filter(f => f.path !== filePath);
        this.saveRecentFiles();

        this.dispatchEvent(new CustomEvent('recentFilesChanged', {
            detail: { files: this.recentFiles }
        }));
    }

    /**
     * Clear all recent files
     */
    clearRecentFiles() {
        this.recentFiles = [];
        this.saveRecentFiles();

        this.dispatchEvent(new CustomEvent('recentFilesChanged', {
            detail: { files: this.recentFiles }
        }));
    }

    /**
     * Get recent files
     */
    getRecentFiles() {
        return [...this.recentFiles];
    }

    /**
     * Get current file
     */
    getCurrentFile() {
        return this.currentFile;
    }

    /**
     * Set current file
     */
    setCurrentFile(file) {
        this.currentFile = file;
    }

    /**
     * Clear current file
     */
    clearCurrentFile() {
        this.currentFile = null;
    }

    /**
     * Check if file extension is supported
     */
    isSupportedFile(filePath) {
        const extension = this.getFileExtension(filePath);
        return this.supportedExtensions.includes(extension);
    }

    /**
     * Get file name from path
     */
    getFileName(filePath) {
        if (!filePath) return '';
        return filePath.split(/[\\/]/).pop() || '';
    }

    /**
     * Get file directory from path
     */
    getFileDirectory(filePath) {
        if (!filePath) return '';
        const parts = filePath.split(/[\\/]/);
        return parts.slice(0, -1).join('/') || '';
    }

    /**
     * Get file extension from path
     */
    getFileExtension(filePath) {
        if (!filePath) return '';
        const name = this.getFileName(filePath);
        const lastDot = name.lastIndexOf('.');
        return lastDot !== -1 ? name.substring(lastDot).toLowerCase() : '';
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
     * Check for external file changes
     */
    async checkExternalChanges(filePath) {
        try {
            if (!window.electronAPI || !filePath) return false;

            // This would require an IPC call to check file modification time
            // For now, we'll emit an event that can be handled by the app
            this.dispatchEvent(new CustomEvent('checkExternalChanges', {
                detail: { filePath }
            }));

            return true;
        } catch (error) {
            console.error('Error checking external changes:', error);
            return false;
        }
    }

    /**
     * Get file statistics
     */
    getFileStats() {
        return {
            currentFile: this.currentFile ? {
                name: this.currentFile.name,
                path: this.currentFile.path,
                size: this.currentFile.size || 0,
                extension: this.currentFile.extension,
                lastOpened: this.currentFile.lastOpened
            } : null,
            recentFilesCount: this.recentFiles.length,
            supportedExtensions: this.supportedExtensions,
            maxRecentFiles: this.maxRecentFiles
        };
    }

    /**
     * Export settings
     */
    exportSettings() {
        return {
            recentFiles: this.recentFiles,
            maxRecentFiles: this.maxRecentFiles,
            supportedExtensions: this.supportedExtensions
        };
    }

    /**
     * Import settings
     */
    importSettings(settings) {
        if (settings.recentFiles) {
            this.recentFiles = settings.recentFiles.slice(0, this.maxRecentFiles);
            this.saveRecentFiles();
        }

        if (settings.maxRecentFiles) {
            this.maxRecentFiles = settings.maxRecentFiles;
        }

        if (settings.supportedExtensions) {
            this.supportedExtensions = settings.supportedExtensions;
        }

        this.dispatchEvent(new CustomEvent('settingsImported', {
            detail: { settings }
        }));
    }

    /**
     * Cleanup
     */
    cleanup() {
        // Save current state
        this.saveRecentFiles();

        // Clear references
        this.currentFile = null;
        this.recentFiles = [];

        console.log('FileManager cleaned up');
    }
}
