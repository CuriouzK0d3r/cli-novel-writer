/**
 * Writers CLI - Main Application Controller
 *
 * This is the main entry point for the renderer process.
 * It initializes all components and manages the application state.
 */

class WritersApp {
    constructor() {
        this.initialized = false;
        this.currentFile = null;
        this.currentProject = null;
        this.isModified = false;
        this.autosaveTimer = null;
        this.sessionStartTime = Date.now();

        // Component instances
        this.components = {
            editor: null,
            sidebar: null,
            statusBar: null,
            toolbar: null,
            modal: null,
            notification: null,
            contextMenu: null
        };

        // Service instances
        this.services = {
            fileManager: null,
            projectManager: null,
            statsManager: null,
            themeManager: null,
            settingsManager: null
        };

        // Application state
        this.state = {
            activeView: 'welcome',
            sidebarCollapsed: false,
            distractionFree: false,
            editorMode: 'insert', // 'insert' or 'navigation'
            theme: 'dark',
            settings: {}
        };

        // Event handlers
        this.eventHandlers = new Map();

        // Initialize the application
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('Initializing Writers CLI...');

            // Show loading screen
            this.showLoadingScreen();

            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.onDOMReady());
            } else {
                await this.onDOMReady();
            }

        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showError('Failed to initialize application', error.message);
        }
    }

    /**
     * Called when DOM is ready
     */
    async onDOMReady() {
        try {
            // Initialize services first
            await this.initializeServices();

            // Load settings
            await this.loadSettings();

            // Initialize components
            await this.initializeComponents();

            // Setup global event listeners
            this.setupGlobalEventListeners();

            // Setup IPC communication
            this.setupIPC();

            // Apply initial theme
            await this.applyTheme();

            // Hide loading screen and show app
            this.hideLoadingScreen();

            // Mark as initialized
            this.initialized = true;

            console.log('Writers CLI initialized successfully');

            // Load recent files
            this.loadRecentFiles();

            // Check for command line arguments or auto-open files
            this.handleInitialLoad();

        } catch (error) {
            console.error('Error during initialization:', error);
            this.showError('Initialization Error', error.message);
        }
    }

    /**
     * Initialize all services
     */
    async initializeServices() {
        try {
            // Settings service (load first)
            this.services.settingsManager = new SettingsManager();
            await this.services.settingsManager.init();

            // Theme service
            this.services.themeManager = new ThemeManager();
            await this.services.themeManager.init();

            // File service
            this.services.fileManager = new FileManager();
            await this.services.fileManager.init();

            // Project service
            this.services.projectManager = new ProjectManager();
            await this.services.projectManager.init();

            // Statistics service
            this.services.statsManager = new StatsManager();
            await this.services.statsManager.init();

            console.log('Services initialized');
        } catch (error) {
            console.error('Error initializing services:', error);
            throw error;
        }
    }

    /**
     * Initialize all UI components
     */
    async initializeComponents() {
        try {
            // Initialize components in dependency order
            this.components.notification = new Notification();
            this.components.modal = new Modal();
            this.components.contextMenu = new ContextMenu();

            this.components.statusBar = new StatusBar();
            this.components.toolbar = new Toolbar();
            this.components.sidebar = new Sidebar();
            this.components.editor = new Editor();

            // Setup component event listeners
            this.setupComponentEventListeners();

            console.log('Components initialized');
        } catch (error) {
            console.error('Error initializing components:', error);
            throw error;
        }
    }

    /**
     * Load application settings
     */
    async loadSettings() {
        try {
            this.state.settings = await this.services.settingsManager.getSettings();
            this.state.theme = this.state.settings.theme?.name || 'dark';
            this.state.sidebarCollapsed = this.state.settings.ui?.sidebarCollapsed || false;

            console.log('Settings loaded');
        } catch (error) {
            console.error('Error loading settings:', error);
            // Use defaults if loading fails
            this.state.settings = this.services.settingsManager.getDefaults();
        }
    }

    /**
     * Setup global event listeners
     */
    setupGlobalEventListeners() {
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleGlobalKeydown(e));

        // Window events
        window.addEventListener('beforeunload', (e) => this.handleBeforeUnload(e));
        window.addEventListener('focus', () => this.handleWindowFocus());
        window.addEventListener('blur', () => this.handleWindowBlur());

        // Custom app events
        document.addEventListener('app:fileOpened', (e) => this.handleFileOpened(e));
        document.addEventListener('app:fileSaved', (e) => this.handleFileSaved(e));
        document.addEventListener('app:fileModified', (e) => this.handleFileModified(e));
        document.addEventListener('app:projectOpened', (e) => this.handleProjectOpened(e));
        document.addEventListener('app:themeChanged', (e) => this.handleThemeChanged(e));

        // UI events
        document.addEventListener('click', (e) => this.handleGlobalClick(e));
        document.addEventListener('contextmenu', (e) => this.handleContextMenu(e));

        console.log('Global event listeners setup');
    }

    /**
     * Setup component event listeners
     */
    setupComponentEventListeners() {
        // Editor events
        if (this.components.editor) {
            this.components.editor.on('contentChanged', (data) => {
                this.handleContentChanged(data);
            });

            this.components.editor.on('cursorMoved', (data) => {
                this.components.statusBar.updateCursorPosition(data);
            });

            this.components.editor.on('selectionChanged', (data) => {
                this.components.statusBar.updateSelection(data);
            });

            this.components.editor.on('modeChanged', (mode) => {
                this.state.editorMode = mode;
                this.components.toolbar.updateModeIndicator(mode);
            });
        }

        // Sidebar events
        if (this.components.sidebar) {
            this.components.sidebar.on('fileSelected', (filePath) => {
                this.openFile(filePath);
            });

            this.components.sidebar.on('projectSelected', (projectPath) => {
                this.openProject(projectPath);
            });

            this.components.sidebar.on('toggleCollapse', (collapsed) => {
                this.toggleSidebar(collapsed);
            });
        }

        // File manager events
        if (this.services.fileManager) {
            this.services.fileManager.on('recentFilesChanged', (files) => {
                this.components.sidebar.updateRecentFiles(files);
                this.updateWelcomeRecentFiles(files);
            });
        }

        console.log('Component event listeners setup');
    }

    /**
     * Setup IPC communication with main process
     */
    setupIPC() {
        if (!window.electronAPI) {
            console.warn('Electron API not available');
            return;
        }

        // Listen for main process events
        window.electronAPI.onFileChanged((filePath) => {
            this.handleExternalFileChange(filePath);
        });

        window.electronAPI.onProjectChanged((projectData) => {
            this.handleExternalProjectChange(projectData);
        });

        window.electronAPI.onThemeChanged((theme) => {
            this.applyTheme(theme);
        });

        window.electronAPI.onSettingsChanged((settings) => {
            this.handleSettingsChanged(settings);
        });

        window.electronAPI.onAppReady(() => {
            console.log('Main process ready');
        });

        window.electronAPI.onAppClose(() => {
            this.handleAppClose();
        });

        console.log('IPC communication setup');
    }

    /**
     * Apply theme to the application
     */
    async applyTheme(themeName = null) {
        try {
            if (!themeName) {
                themeName = this.state.theme;
            }

            await this.services.themeManager.applyTheme(themeName);
            this.state.theme = themeName;

            // Update theme in settings
            await this.services.settingsManager.updateSetting('theme.name', themeName);

            console.log(`Theme applied: ${themeName}`);
        } catch (error) {
            console.error('Error applying theme:', error);
        }
    }

    /**
     * Handle global keyboard shortcuts
     */
    handleGlobalKeydown(event) {
        const { ctrlKey, metaKey, shiftKey, altKey, key, code } = event;
        const cmdKey = ctrlKey || metaKey;

        // File operations
        if (cmdKey && key === 'n') {
            event.preventDefault();
            this.newFile();
            return;
        }

        if (cmdKey && key === 'o') {
            event.preventDefault();
            this.openFileDialog();
            return;
        }

        if (cmdKey && key === 's') {
            event.preventDefault();
            if (shiftKey) {
                this.saveAsFile();
            } else {
                this.saveFile();
            }
            return;
        }

        // Edit operations
        if (cmdKey && key === 'z') {
            event.preventDefault();
            if (shiftKey) {
                this.redo();
            } else {
                this.undo();
            }
            return;
        }

        if (cmdKey && key === 'y') {
            event.preventDefault();
            this.redo();
            return;
        }

        // Find operations
        if (cmdKey && key === 'f') {
            event.preventDefault();
            this.showFindDialog();
            return;
        }

        if (cmdKey && key === 'r') {
            event.preventDefault();
            this.showReplaceDialog();
            return;
        }

        if (cmdKey && key === 'g') {
            event.preventDefault();
            this.showGoToLineDialog();
            return;
        }

        // View operations
        if (key === 'F11') {
            event.preventDefault();
            this.toggleFullscreen();
            return;
        }

        if (key === 'F10') {
            event.preventDefault();
            this.toggleDistractionFree();
            return;
        }

        if (cmdKey && key === 'b') {
            event.preventDefault();
            this.toggleSidebar();
            return;
        }

        // Statistics
        if (cmdKey && shiftKey && key === 'W') {
            event.preventDefault();
            this.showWordCountDialog();
            return;
        }

        // Help
        if (key === 'F1') {
            event.preventDefault();
            this.showHelpDialog();
            return;
        }

        // Navigation mode (Vim-like)
        if (this.state.editorMode === 'navigation') {
            this.handleNavigationKeydown(event);
        }
    }

    /**
     * Handle navigation mode keyboard shortcuts
     */
    handleNavigationKeydown(event) {
        const { key } = event;

        switch (key) {
            case 'i':
                event.preventDefault();
                this.components.editor.setMode('insert');
                break;
            case 'h':
            case 'ArrowLeft':
                event.preventDefault();
                this.components.editor.moveCursor('left');
                break;
            case 'j':
            case 'ArrowDown':
                event.preventDefault();
                this.components.editor.moveCursor('down');
                break;
            case 'k':
            case 'ArrowUp':
                event.preventDefault();
                this.components.editor.moveCursor('up');
                break;
            case 'l':
            case 'ArrowRight':
                event.preventDefault();
                this.components.editor.moveCursor('right');
                break;
            case 'w':
                event.preventDefault();
                this.components.editor.moveCursor('word-forward');
                break;
            case 'b':
                event.preventDefault();
                this.components.editor.moveCursor('word-backward');
                break;
            case '0':
                event.preventDefault();
                this.components.editor.moveCursor('line-start');
                break;
            case '$':
                event.preventDefault();
                this.components.editor.moveCursor('line-end');
                break;
        }
    }

    /**
     * Create a new file
     */
    async newFile() {
        try {
            if (this.isModified) {
                const shouldSave = await this.confirmSave();
                if (shouldSave === null) return; // Cancelled
            }

            this.currentFile = null;
            this.isModified = false;
            this.components.editor.clear();
            this.components.editor.focus();
            this.switchToEditorView();
            this.updateTitle('Untitled');
            this.components.statusBar.setFileStatus('New file');

            console.log('New file created');
        } catch (error) {
            console.error('Error creating new file:', error);
            this.showError('Error', 'Failed to create new file');
        }
    }

    /**
     * Open file dialog
     */
    async openFileDialog() {
        try {
            const result = await window.electronAPI.openFile();
            if (result && result.filePath) {
                await this.openFile(result.filePath);
            }
        } catch (error) {
            console.error('Error opening file dialog:', error);
            this.showError('Error', 'Failed to open file dialog');
        }
    }

    /**
     * Open a file
     */
    async openFile(filePath) {
        try {
            if (this.isModified) {
                const shouldSave = await this.confirmSave();
                if (shouldSave === null) return; // Cancelled
            }

            this.components.statusBar.setFileStatus('Loading...');

            const fileData = await this.services.fileManager.loadFile(filePath);

            this.currentFile = fileData;
            this.isModified = false;
            this.components.editor.setContent(fileData.content);
            this.components.editor.focus();
            this.switchToEditorView();
            this.updateTitle(fileData.name);
            this.components.statusBar.setFileStatus('File loaded');

            // Add to recent files
            this.services.fileManager.addToRecentFiles(filePath);

            // Start auto-save timer
            this.startAutoSave();

            console.log(`File opened: ${filePath}`);

            // Emit event
            document.dispatchEvent(new CustomEvent('app:fileOpened', {
                detail: { filePath, fileData }
            }));

        } catch (error) {
            console.error('Error opening file:', error);
            this.showError('Error', `Failed to open file: ${error.message}`);
            this.components.statusBar.setFileStatus('Error loading file');
        }
    }

    /**
     * Save current file
     */
    async saveFile() {
        try {
            if (!this.currentFile) {
                return this.saveAsFile();
            }

            this.components.statusBar.setFileStatus('Saving...');

            const content = this.components.editor.getContent();
            await this.services.fileManager.saveFile(this.currentFile.filePath, content);

            this.isModified = false;
            this.components.statusBar.setSaveStatus('saved');
            this.components.statusBar.setFileStatus('Saved');

            console.log(`File saved: ${this.currentFile.filePath}`);

            // Emit event
            document.dispatchEvent(new CustomEvent('app:fileSaved', {
                detail: { filePath: this.currentFile.filePath }
            }));

        } catch (error) {
            console.error('Error saving file:', error);
            this.showError('Error', `Failed to save file: ${error.message}`);
            this.components.statusBar.setFileStatus('Error saving file');
        }
    }

    /**
     * Save file with new name/location
     */
    async saveAsFile() {
        try {
            const content = this.components.editor.getContent();
            const result = await window.electronAPI.saveFileAs(content);

            if (result && result.success) {
                const fileData = await this.services.fileManager.loadFile(result.filePath);
                this.currentFile = fileData;
                this.isModified = false;
                this.updateTitle(fileData.name);
                this.components.statusBar.setSaveStatus('saved');
                this.components.statusBar.setFileStatus('Saved as new file');

                console.log(`File saved as: ${result.filePath}`);
            }

        } catch (error) {
            console.error('Error saving file as:', error);
            this.showError('Error', `Failed to save file: ${error.message}`);
        }
    }

    /**
     * Handle content changes in editor
     */
    handleContentChanged(data) {
        if (!this.isModified) {
            this.isModified = true;
            this.components.statusBar.setSaveStatus('modified');
            this.updateTitle();
        }

        // Update statistics
        this.updateStatistics(data.content);

        // Emit event
        document.dispatchEvent(new CustomEvent('app:fileModified', {
            detail: data
        }));
    }

    /**
     * Update word count and statistics
     */
    updateStatistics(content) {
        const stats = this.services.statsManager.getTextStats(content);
        this.components.statusBar.updateStats(stats);
        this.components.sidebar.updateStats(stats);
    }

    /**
     * Start auto-save timer
     */
    startAutoSave() {
        this.stopAutoSave(); // Clear existing timer

        const interval = this.state.settings.editor?.autoSaveInterval || 30000;
        if (this.state.settings.editor?.autoSave && this.currentFile) {
            this.autosaveTimer = setInterval(() => {
                if (this.isModified && this.currentFile) {
                    this.saveFile();
                }
            }, interval);
        }
    }

    /**
     * Stop auto-save timer
     */
    stopAutoSave() {
        if (this.autosaveTimer) {
            clearInterval(this.autosaveTimer);
            this.autosaveTimer = null;
        }
    }

    /**
     * Switch to editor view
     */
    switchToEditorView() {
        this.state.activeView = 'editor';
        document.getElementById('welcome-view').classList.remove('active');
        document.getElementById('editor-view').classList.add('active');
    }

    /**
     * Switch to welcome view
     */
    switchToWelcomeView() {
        this.state.activeView = 'welcome';
        document.getElementById('editor-view').classList.remove('active');
        document.getElementById('welcome-view').classList.add('active');
    }

    /**
     * Update window title
     */
    updateTitle(fileName = null) {
        let title = 'Writers CLI';

        if (fileName) {
            title = `${fileName}${this.isModified ? ' •' : ''} - Writers CLI`;
        } else if (this.currentFile) {
            title = `${this.currentFile.name}${this.isModified ? ' •' : ''} - Writers CLI`;
        }

        document.title = title;

        const titleElement = document.getElementById('window-title');
        if (titleElement) {
            titleElement.textContent = title;
        }
    }

    /**
     * Toggle sidebar
     */
    toggleSidebar(force = null) {
        const collapsed = force !== null ? force : !this.state.sidebarCollapsed;
        this.state.sidebarCollapsed = collapsed;
        this.components.sidebar.setCollapsed(collapsed);

        // Save preference
        this.services.settingsManager.updateSetting('ui.sidebarCollapsed', collapsed);
    }

    /**
     * Toggle distraction-free mode
     */
    toggleDistractionFree() {
        this.state.distractionFree = !this.state.distractionFree;
        document.body.classList.toggle('distraction-free', this.state.distractionFree);

        if (this.state.distractionFree) {
            this.showNotification('Distraction-free mode enabled. Press F10 to exit.', 'info');
        }
    }

    /**
     * Toggle fullscreen
     */
    async toggleFullscreen() {
        try {
            await window.electronAPI.toggleFullscreen();
        } catch (error) {
            console.error('Error toggling fullscreen:', error);
        }
    }

    /**
     * Show loading screen
     */
    showLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
        }
    }

    /**
     * Hide loading screen and show app
     */
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const app = document.getElementById('app');

        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }

        if (app) {
            app.classList.remove('hidden');
        }
    }

    /**
     * Show error message
     */
    showError(title, message) {
        if (this.components.notification) {
            this.components.notification.show(message, 'error');
        } else {
            alert(`${title}: ${message}`);
        }
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        if (this.components.notification) {
            this.components.notification.show(message, type);
        }
    }

    /**
     * Confirm save dialog
     */
    async confirmSave() {
        if (!this.isModified) return true;

        const result = await this.components.modal.showConfirm(
            'Unsaved Changes',
            'You have unsaved changes. Do you want to save them?',
            ['Save', 'Don\'t Save', 'Cancel']
        );

        if (result === 'Save') {
            await this.saveFile();
            return true;
        } else if (result === 'Don\'t Save') {
            return true;
        } else {
            return null; // Cancelled
        }
    }

    /**
     * Handle before unload
     */
    handleBeforeUnload(event) {
        if (this.isModified) {
            event.preventDefault();
            event.returnValue = '';
            return '';
        }
    }

    /**
     * Handle window focus
     */
    handleWindowFocus() {
        // Check if current file was modified externally
        if (this.currentFile) {
            this.services.fileManager.checkExternalChanges(this.currentFile.filePath);
        }
    }

    /**
     * Handle window blur
     */
    handleWindowBlur() {
        // Auto-save on focus loss if enabled
        if (this.state.settings.editor?.autoSave && this.isModified && this.currentFile) {
            this.saveFile();
        }
    }

    /**
     * Load recent files
     */
    loadRecentFiles() {
        const recentFiles = this.services.fileManager.getRecentFiles();
        this.components.sidebar.updateRecentFiles(recentFiles);
        this.updateWelcomeRecentFiles(recentFiles);
    }

    /**
     * Update recent files in welcome view
     */
    updateWelcomeRecentFiles(files) {
        const recentList = document.getElementById('welcome-recent-list');
        if (!recentList) return;

        if (files.length === 0) {
            recentList.innerHTML = '<div class="empty-recent"><p>No recent files</p></div>';
            return;
        }

        const items = files.slice(0, 5).map(file => `
            <div class="recent-item" data-path="${file.path}">
                <div class="recent-info">
                    <div class="recent-name">${file.name}</div>
                    <div class="recent-path">${file.dir}</div>
                </div>
                <div class="recent-meta">
                    <span class="recent-date">${this.formatDate(file.modified)}</span>
                </div>
            </div>
        `).join('');

        recentList.innerHTML = items;

        // Add click handlers
        recentList.querySelectorAll('.recent-item').forEach(item => {
            item.addEventListener('click', () => {
                const path = item.dataset.path;
                this.openFile(path);
            });
        });
    }

    /**
     * Handle initial load (command line args, etc.)
     */
    handleInitialLoad() {
        // Check for file to open from command line or system
        // This would be handled by the main process and sent via IPC
    }

    /**
     * Format date for display
     */
    formatDate(date) {
        if (!date) return '';
        const d = new Date(date);
        const now = new Date();
        const diffMs = now - d;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;

        return d.toLocaleDateString();
    }

    /**
     * Cleanup when app is closing
     */
    cleanup() {
        this.stopAutoSave();

        // Cleanup components
        Object.values(this.components).forEach(component => {
            if (component && typeof component.cleanup === 'function') {
                component.cleanup();
            }
        });

        // Cleanup services
        Object.values(this.services).forEach(service => {
            if (service && typeof service.cleanup === 'function') {
                service.cleanup();
            }
        });

        console.log('Application cleanup completed');
    }

    // Additional methods for dialog handling, menu actions, etc.
    // These would be implemented as needed...

    showFindDialog() {
        // Implementation for find dialog
        console.log('Show find dialog');
    }

    showReplaceDialog() {
        // Implementation for replace dialog
        console.log('Show replace dialog');
    }

    showGoToLineDialog() {
        // Implementation for go to line dialog
        console.log('Show go to line dialog');
    }

    showWordCountDialog() {
        // Implementation for word count dialog
        console.log('Show word count dialog');
    }

    showHelpDialog() {
        // Implementation for help dialog
        console.log('Show help dialog');
    }

    undo() {
        if (this.components.editor) {
            this.components.editor.undo();
        }
    }

    redo() {
        if (this.components.editor) {
            this.components.editor.redo();
        }
    }

    handleGlobalClick(event) {
        // Handle global clicks for closing menus, etc.
        if (this.components.contextMenu) {
            this.components.contextMenu.hide();
        }
    }

    handleContextMenu(event) {
        // Handle right-click context menus
        event.preventDefault();

        if (this.components.contextMenu) {
            const items = this.getContextMenuItems(event.target);
            this.components.contextMenu.show(event.clientX, event.clientY, items);
        }
    }

    getContextMenuItems(target) {
        // Return context menu items based on target element
        return [
            { label: 'Cut', action: () => document.execCommand('cut') },
            { label: 'Copy', action: () => document.execCommand('copy') },
            { label: 'Paste', action: () => document.execCommand('paste') },
            { separator: true },
            { label: 'Select All', action: () => document.execCommand('selectAll') }
        ];
    }

    // Event handlers for external changes
    handleFileOpened(event) {
        // Handle file opened event
    }

    handleFileSaved(event) {
        // Handle file saved event
    }

    handleFileModified(event) {
        // Handle file modified event
    }

    handleProjectOpened(event) {
        // Handle project opened event
    }

    handleThemeChanged(event) {
        // Handle theme changed event
    }

    handleExternalFileChange(filePath) {
        // Handle external file changes
        if (this.currentFile && this.currentFile.filePath === filePath) {
            this.showNotification('File was modified externally', 'warning');
        }
    }

    handleExternalProjectChange(projectData) {
        // Handle external project changes
    }

    handleSettingsChanged(settings) {
        // Handle settings changes
        this.state.settings = settings;
    }

    handleAppClose() {
        // Handle app close event
        this.cleanup();
    }

    openProject(projectPath) {
        // Implementation for opening projects
        console.log('Open project:', projectPath);
    }
}

// Initialize the application when the script loads
const writersApp = new WritersApp();

// Make app instance globally available for debugging
window.writersApp = writersApp;
