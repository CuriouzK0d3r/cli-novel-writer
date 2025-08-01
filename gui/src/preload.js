const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveFile: (filePath, content) => ipcRenderer.invoke('file:save', filePath, content),
  saveFileAs: (content) => ipcRenderer.invoke('dialog:saveFile', content),
  loadFile: (filePath) => ipcRenderer.invoke('file:load', filePath),

  // Project operations
  createProject: (projectData) => ipcRenderer.invoke('project:create', projectData),
  openProject: () => ipcRenderer.invoke('dialog:openProject'),
  loadProject: (projectPath) => ipcRenderer.invoke('project:load', projectPath),
  saveProject: (projectData) => ipcRenderer.invoke('project:save', projectData),
  exportProject: (exportOptions) => ipcRenderer.invoke('project:export', exportOptions),

  // File system operations
  readDirectory: (dirPath) => ipcRenderer.invoke('fs:readDirectory', dirPath),
  createFile: (filePath, content) => ipcRenderer.invoke('fs:createFile', filePath, content),
  deleteFile: (filePath) => ipcRenderer.invoke('fs:deleteFile', filePath),
  renameFile: (oldPath, newPath) => ipcRenderer.invoke('fs:renameFile', oldPath, newPath),

  // Statistics and analysis
  getWordCount: (text) => ipcRenderer.invoke('stats:wordCount', text),
  getFileStats: (filePath) => ipcRenderer.invoke('stats:fileStats', filePath),
  getProjectStats: (projectPath) => ipcRenderer.invoke('stats:projectStats', projectPath),

  // Window operations
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  toggleFullscreen: () => ipcRenderer.invoke('window:toggleFullscreen'),

  // Theme and settings
  loadSettings: () => ipcRenderer.invoke('settings:load'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
  getTheme: () => ipcRenderer.invoke('theme:get'),
  setTheme: (theme) => ipcRenderer.invoke('theme:set', theme),

  // Event listeners for main process notifications
  onFileChanged: (callback) => {
    ipcRenderer.on('file:changed', (event, filePath) => callback(filePath));
  },

  onProjectChanged: (callback) => {
    ipcRenderer.on('project:changed', (event, projectData) => callback(projectData));
  },

  onThemeChanged: (callback) => {
    ipcRenderer.on('theme:changed', (event, theme) => callback(theme));
  },

  onSettingsChanged: (callback) => {
    ipcRenderer.on('settings:changed', (event, settings) => callback(settings));
  },

  // Menu operations
  showContextMenu: (options) => ipcRenderer.invoke('menu:showContext', options),

  // Utility functions
  showMessageBox: (options) => ipcRenderer.invoke('dialog:messageBox', options),
  showErrorDialog: (title, message) => ipcRenderer.invoke('dialog:error', title, message),
  showSaveDialog: (options) => ipcRenderer.invoke('dialog:save', options),

  // Remove all listeners for a specific channel
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },

  // Auto-save functionality
  enableAutoSave: (interval) => ipcRenderer.invoke('autosave:enable', interval),
  disableAutoSave: () => ipcRenderer.invoke('autosave:disable'),

  // Recent files
  getRecentFiles: () => ipcRenderer.invoke('recent:getFiles'),
  addRecentFile: (filePath) => ipcRenderer.invoke('recent:addFile', filePath),
  clearRecentFiles: () => ipcRenderer.invoke('recent:clear'),

  // Backup operations
  createBackup: (filePath) => ipcRenderer.invoke('backup:create', filePath),
  restoreBackup: (backupPath) => ipcRenderer.invoke('backup:restore', backupPath),
  listBackups: (filePath) => ipcRenderer.invoke('backup:list', filePath),

  // Search operations
  searchInFiles: (query, directory) => ipcRenderer.invoke('search:inFiles', query, directory),
  searchInProject: (query, projectPath) => ipcRenderer.invoke('search:inProject', query, projectPath),

  // Export operations
  exportToPDF: (content, options) => ipcRenderer.invoke('export:toPDF', content, options),
  exportToEPUB: (content, options) => ipcRenderer.invoke('export:toEPUB', content, options),
  exportToWord: (content, options) => ipcRenderer.invoke('export:toWord', content, options),

  // Platform information
  getPlatform: () => ipcRenderer.invoke('platform:get'),
  getVersion: () => ipcRenderer.invoke('app:getVersion'),

  // Development and debugging
  openDevTools: () => ipcRenderer.invoke('dev:openTools'),
  reloadWindow: () => ipcRenderer.invoke('dev:reload'),

  // Custom events for application state
  onAppReady: (callback) => {
    ipcRenderer.on('app:ready', () => callback());
  },

  onAppClose: (callback) => {
    ipcRenderer.on('app:close', () => callback());
  }
});

// Expose node environment information safely
contextBridge.exposeInMainWorld('nodeAPI', {
  platform: process.platform,
  arch: process.arch,
  versions: process.versions
});

// Logging utility that sends to main process
contextBridge.exposeInMainWorld('logger', {
  info: (message, data) => ipcRenderer.invoke('log:info', message, data),
  warn: (message, data) => ipcRenderer.invoke('log:warn', message, data),
  error: (message, data) => ipcRenderer.invoke('log:error', message, data),
  debug: (message, data) => ipcRenderer.invoke('log:debug', message, data)
});
