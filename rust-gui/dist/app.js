// Writers CLI - Rust GUI Application
// Main JavaScript file for the Tauri-based GUI

const { invoke } = window.__TAURI__.tauri;
const { listen } = window.__TAURI__.event;
const { open, save } = window.__TAURI__.dialog;
const { writeText, readText } = window.__TAURI__.clipboard;

class WritersApp {
    constructor() {
        this.currentProject = null;
        this.currentFile = null;
        this.writingSession = null;
        this.autoSaveInterval = null;
        this.wordCountUpdateInterval = null;
        this.sessionTimer = null;
        this.sessionStartTime = null;
        this.sidebarCollapsed = false;

        this.init();
    }

    async init() {
        console.log('Initializing Writers CLI...');

        // Initialize event listeners
        this.setupEventListeners();

        // Initialize Tauri event listeners
        this.setupTauriListeners();

        // Load settings
        await this.loadSettings();

        // Start auto-save
        this.startAutoSave();

        // Start word count updates
        this.startWordCountUpdates();

        // Hide loading screen and show app
        setTimeout(() => {
            document.getElementById('loading-screen').classList.add('hidden');
            document.getElementById('app').classList.remove('hidden');
        }, 1500);

        console.log('Writers CLI initialized successfully');
    }

    setupEventListeners() {
        // Sidebar toggle
        document.getElementById('toggle-sidebar').addEventListener('click', () => {
            this.toggleSidebar();
        });

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.switchSection(section);
            });
        });

        // Theme selector
        document.getElementById('theme-select').addEventListener('change', (e) => {
            this.setTheme(e.target.value);
        });

        // Editor events
        const editor = document.getElementById('main-editor');
        editor.addEventListener('input', () => {
            this.updateWordCount();
            this.updateCursorPosition();
            this.markAsUnsaved();
        });

        editor.addEventListener('keydown', (e) => {
            this.handleEditorKeydown(e);
        });

        editor.addEventListener('contextmenu', (e) => {
            this.showContextMenu(e);
        });

        // Toolbar buttons
        this.setupToolbarEvents();

        // Modal events
        this.setupModalEvents();

        // Writing session
        document.getElementById('session-toggle').addEventListener('click', () => {
            this.toggleWritingSession();
        });

        // Distraction free mode
        document.getElementById('distraction-free').addEventListener('click', () => {
            this.toggleDistractionFree();
        });

        // Window events
        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges()) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleGlobalKeydown(e);
        });
    }

    setupTauriListeners() {
        // Listen for menu events
        listen('menu-new-project', () => {
            this.showNewProjectModal();
        });

        listen('menu-open-project', () => {
            this.openProject();
        });

        listen('menu-save', () => {
            this.saveCurrentFile();
        });

        listen('menu-save-as', () => {
            this.saveAsCurrentFile();
        });

        listen('menu-export', (event) => {
            this.exportProject(event.payload);
        });

        listen('menu-find', () => {
            this.showFindDialog();
        });

        listen('menu-replace', () => {
            this.showReplaceDialog();
        });

        listen('menu-toggle-sidebar', () => {
            this.toggleSidebar();
        });

        listen('menu-distraction-free', () => {
            this.toggleDistractionFree();
        });

        listen('menu-split-view', () => {
            this.toggleSplitView();
        });

        listen('menu-word-count', () => {
            this.showWordCountDialog();
        });

        listen('auto-save', () => {
            this.autoSave();
        });
    }

    setupToolbarEvents() {
        // Text formatting
        document.getElementById('bold').addEventListener('click', () => {
            this.formatText('bold');
        });

        document.getElementById('italic').addEventListener('click', () => {
            this.formatText('italic');
        });

        document.getElementById('strikethrough').addEventListener('click', () => {
            this.formatText('strikethrough');
        });

        document.getElementById('heading').addEventListener('click', () => {
            this.formatText('heading');
        });

        document.getElementById('quote').addEventListener('click', () => {
            this.formatText('quote');
        });

        document.getElementById('list').addEventListener('click', () => {
            this.formatText('list');
        });

        // Find and replace
        document.getElementById('find').addEventListener('click', () => {
            this.showFindDialog();
        });

        document.getElementById('replace').addEventListener('click', () => {
            this.showReplaceDialog();
        });
    }

    setupModalEvents() {
        // New project modal
        document.getElementById('new-project').addEventListener('click', () => {
            this.showNewProjectModal();
        });

        document.getElementById('create-project').addEventListener('click', () => {
            this.createNewProject();
        });

        document.getElementById('cancel-project').addEventListener('click', () => {
            this.hideModal();
        });

        // Browse path button
        document.getElementById('browse-path').addEventListener('click', () => {
            this.browseProjectPath();
        });

        // Template buttons
        document.querySelectorAll('.template-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const template = e.currentTarget.dataset.template;
                this.createProjectFromTemplate(template);
            });
        });

        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                this.hideModal();
            });
        });

        // Modal overlay click
        document.getElementById('modal-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.hideModal();
            }
        });
    }

    async loadSettings() {
        try {
            const settings = await invoke('get_app_settings');

            // Apply theme
            if (settings.theme) {
                this.setTheme(settings.theme);
            }

            // Apply other settings
            if (settings.fontSize) {
                document.documentElement.style.setProperty('--font-size-base', settings.fontSize + 'px');
            }

            if (settings.fontFamily) {
                document.documentElement.style.setProperty('--font-editor', settings.fontFamily);
            }

            // Load recent projects
            await this.loadRecentProjects();

        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }

    async saveSettings() {
        try {
            const settings = {
                theme: document.body.className.replace('theme-', ''),
                fontSize: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--font-size-base')),
                fontFamily: getComputedStyle(document.documentElement).getPropertyValue('--font-editor'),
                lastProject: this.currentProject?.id
            };

            await invoke('save_app_settings', { settings });
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }

    async loadRecentProjects() {
        try {
            const projects = await invoke('get_recent_projects');
            const listElement = document.getElementById('recent-projects-list');

            if (projects.length === 0) {
                listElement.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-folder-open"></i>
                        <p>No recent projects</p>
                    </div>
                `;
                return;
            }

            listElement.innerHTML = projects.map(project => `
                <div class="recent-project-item" data-project-id="${project.id}">
                    <div class="project-info">
                        <h4>${project.name}</h4>
                        <p>${project.path}</p>
                        <span class="project-stats">${project.word_count} words • ${new Date(project.last_modified).toLocaleDateString()}</span>
                    </div>
                    <button class="btn btn-secondary btn-sm" onclick="app.openRecentProject('${project.id}')">
                        Open
                    </button>
                </div>
            `).join('');

        } catch (error) {
            console.error('Failed to load recent projects:', error);
        }
    }

    setTheme(themeName) {
        // Remove existing theme classes
        document.body.className = document.body.className.replace(/theme-\w+/g, '');

        // Add new theme class
        document.body.classList.add(`theme-${themeName}`);

        // Update theme selector
        document.getElementById('theme-select').value = themeName;

        // Save to settings
        this.saveSettings();
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('collapsed');
        this.sidebarCollapsed = !this.sidebarCollapsed;
    }

    switchSection(sectionName) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        // Show section
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(`${sectionName}-section`).classList.add('active');
    }

    async updateWordCount() {
        const editor = document.getElementById('main-editor');
        const text = editor.value;

        try {
            const wordCount = await invoke('get_word_count', { text });
            document.getElementById('word-count').textContent = wordCount;
            document.getElementById('total-words').textContent = wordCount;

            // Update character count
            const charCount = text.length;
            document.getElementById('character-count').textContent = `${charCount} characters`;

            // Update reading time
            const readingTime = Math.ceil(wordCount / 225); // 225 WPM average
            document.getElementById('reading-time').textContent = `${readingTime} min read`;

        } catch (error) {
            console.error('Failed to update word count:', error);
        }
    }

    updateCursorPosition() {
        const editor = document.getElementById('main-editor');
        const text = editor.value;
        const cursorPos = editor.selectionStart;

        const lines = text.substring(0, cursorPos).split('\n');
        const line = lines.length;
        const column = lines[lines.length - 1].length + 1;

        document.getElementById('cursor-position').textContent = `Line ${line}, Column ${column}`;
    }

    formatText(format) {
        const editor = document.getElementById('main-editor');
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        const selectedText = editor.value.substring(start, end);

        let formattedText = '';

        switch (format) {
            case 'bold':
                formattedText = `**${selectedText}**`;
                break;
            case 'italic':
                formattedText = `*${selectedText}*`;
                break;
            case 'strikethrough':
                formattedText = `~~${selectedText}~~`;
                break;
            case 'heading':
                formattedText = `# ${selectedText}`;
                break;
            case 'quote':
                formattedText = `> ${selectedText}`;
                break;
            case 'list':
                formattedText = `- ${selectedText}`;
                break;
        }

        editor.value = editor.value.substring(0, start) + formattedText + editor.value.substring(end);
        editor.focus();
        editor.setSelectionRange(start + formattedText.length, start + formattedText.length);

        this.updateWordCount();
        this.markAsUnsaved();
    }

    handleEditorKeydown(e) {
        // Tab for indentation
        if (e.key === 'Tab' && !e.shiftKey) {
            e.preventDefault();
            const editor = e.target;
            const start = editor.selectionStart;
            const end = editor.selectionEnd;

            editor.value = editor.value.substring(0, start) + '    ' + editor.value.substring(end);
            editor.setSelectionRange(start + 4, start + 4);
        }
    }

    handleGlobalKeydown(e) {
        // Global keyboard shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 's':
                    e.preventDefault();
                    this.saveCurrentFile();
                    break;
                case 'n':
                    e.preventDefault();
                    this.showNewProjectModal();
                    break;
                case 'o':
                    e.preventDefault();
                    this.openProject();
                    break;
                case 'f':
                    e.preventDefault();
                    this.showFindDialog();
                    break;
                case 'h':
                    e.preventDefault();
                    this.showReplaceDialog();
                    break;
                case 'b':
                    if (document.activeElement.id === 'main-editor') {
                        e.preventDefault();
                        this.formatText('bold');
                    }
                    break;
                case 'i':
                    if (document.activeElement.id === 'main-editor') {
                        e.preventDefault();
                        this.formatText('italic');
                    }
                    break;
            }
        }

        // F11 for distraction-free mode
        if (e.key === 'F11') {
            e.preventDefault();
            this.toggleDistractionFree();
        }
    }

    showContextMenu(e) {
        e.preventDefault();

        const contextMenu = document.getElementById('context-menu');
        contextMenu.style.left = e.pageX + 'px';
        contextMenu.style.top = e.pageY + 'px';
        contextMenu.classList.remove('hidden');

        // Handle context menu clicks
        const handleContextClick = (event) => {
            const action = event.target.closest('.context-menu-item')?.dataset.action;

            if (action) {
                switch (action) {
                    case 'cut':
                        document.execCommand('cut');
                        break;
                    case 'copy':
                        document.execCommand('copy');
                        break;
                    case 'paste':
                        document.execCommand('paste');
                        break;
                    case 'select-all':
                        document.getElementById('main-editor').select();
                        break;
                }
            }

            contextMenu.classList.add('hidden');
            document.removeEventListener('click', handleContextClick);
        };

        // Hide context menu on outside click
        setTimeout(() => {
            document.addEventListener('click', handleContextClick);
        }, 10);
    }

    showNewProjectModal() {
        document.getElementById('modal-overlay').classList.remove('hidden');
        document.getElementById('project-name').focus();
    }

    hideModal() {
        document.getElementById('modal-overlay').classList.add('hidden');

        // Clear form
        document.getElementById('new-project-form').reset();
    }

    async browseProjectPath() {
        try {
            const selected = await open({
                directory: true,
                multiple: false,
                title: 'Select Project Directory'
            });

            if (selected) {
                document.getElementById('project-path').value = selected;
            }
        } catch (error) {
            console.error('Failed to browse path:', error);
        }
    }

    async createNewProject() {
        const name = document.getElementById('project-name').value;
        const path = document.getElementById('project-path').value;
        const template = document.getElementById('project-template').value;

        if (!name || !path) {
            this.showStatus('Please fill in all required fields', 'error');
            return;
        }

        try {
            const project = await invoke('create_new_project', {
                name,
                path,
                template: template || null
            });

            this.currentProject = project;
            this.hideModal();
            this.loadRecentProjects();
            this.showStatus(`Project "${name}" created successfully`, 'success');

            // Switch to editor
            this.switchSection('editor');

        } catch (error) {
            console.error('Failed to create project:', error);
            this.showStatus('Failed to create project: ' + error, 'error');
        }
    }

    async createProjectFromTemplate(template) {
        // Pre-fill the modal with template
        document.getElementById('project-template').value = template;
        this.showNewProjectModal();
    }

    async openProject() {
        try {
            const selected = await open({
                directory: true,
                multiple: false,
                title: 'Open Project Directory'
            });

            if (selected) {
                const project = await invoke('open_project', { path: selected });
                this.currentProject = project;
                this.loadRecentProjects();
                this.showStatus(`Project "${project.name}" opened`, 'success');

                // Load project files
                await this.loadProjectFiles();
            }
        } catch (error) {
            console.error('Failed to open project:', error);
            this.showStatus('Failed to open project: ' + error, 'error');
        }
    }

    async openRecentProject(projectId) {
        try {
            const projects = await invoke('get_recent_projects');
            const project = projects.find(p => p.id === projectId);

            if (project) {
                const openedProject = await invoke('open_project', { path: project.path });
                this.currentProject = openedProject;
                this.showStatus(`Project "${project.name}" opened`, 'success');

                // Load project files
                await this.loadProjectFiles();
            }
        } catch (error) {
            console.error('Failed to open recent project:', error);
            this.showStatus('Failed to open project: ' + error, 'error');
        }
    }

    async loadProjectFiles() {
        if (!this.currentProject) return;

        try {
            // Load the main file or first chapter
            const mainFile = `${this.currentProject.path}/chapters/chapter-1.md`;
            const content = await invoke('read_file_content', { filePath: mainFile });

            document.getElementById('main-editor').value = content;
            document.getElementById('document-title').textContent = this.currentProject.name;
            document.getElementById('file-path').textContent = mainFile;

            this.updateWordCount();

        } catch (error) {
            console.log('No main file found, starting with empty editor');
            document.getElementById('main-editor').value = '';
        }
    }

    async saveCurrentFile() {
        if (!this.currentProject) {
            this.showStatus('No project open', 'error');
            return;
        }

        try {
            const content = document.getElementById('main-editor').value;
            const filePath = this.currentFile || `${this.currentProject.path}/chapters/chapter-1.md`;

            await invoke('write_file_content', { filePath, content });

            document.getElementById('last-saved').textContent = 'Saved ' + new Date().toLocaleTimeString();
            this.showStatus('File saved successfully', 'success');

        } catch (error) {
            console.error('Failed to save file:', error);
            this.showStatus('Failed to save file: ' + error, 'error');
        }
    }

    async saveAsCurrentFile() {
        try {
            const filePath = await save({
                filters: [{
                    name: 'Markdown',
                    extensions: ['md']
                }, {
                    name: 'Text',
                    extensions: ['txt']
                }]
            });

            if (filePath) {
                const content = document.getElementById('main-editor').value;
                await invoke('write_file_content', { filePath, content });

                this.currentFile = filePath;
                document.getElementById('file-path').textContent = filePath;
                this.showStatus('File saved successfully', 'success');
            }
        } catch (error) {
            console.error('Failed to save file:', error);
            this.showStatus('Failed to save file: ' + error, 'error');
        }
    }

    async exportProject(format) {
        if (!this.currentProject) {
            this.showStatus('No project open', 'error');
            return;
        }

        try {
            const outputPath = await save({
                filters: [{
                    name: format.toUpperCase(),
                    extensions: [format]
                }]
            });

            if (outputPath) {
                const options = {
                    format,
                    outputPath,
                    includeMetadata: true,
                    customStyles: null,
                    pageSize: 'A4',
                    fontFamily: 'Georgia',
                    fontSize: 12
                };

                switch (format) {
                    case 'pdf':
                        await invoke('export_to_pdf', {
                            projectPath: this.currentProject.path,
                            outputPath,
                            options
                        });
                        break;
                    case 'epub':
                        await invoke('export_to_epub', {
                            projectPath: this.currentProject.path,
                            outputPath,
                            options
                        });
                        break;
                    case 'docx':
                        await invoke('export_to_docx', {
                            projectPath: this.currentProject.path,
                            outputPath,
                            options
                        });
                        break;
                    case 'html':
                        await invoke('export_to_html', {
                            projectPath: this.currentProject.path,
                            outputPath,
                            options
                        });
                        break;
                }

                this.showStatus(`Project exported as ${format.toUpperCase()}`, 'success');
            }
        } catch (error) {
            console.error('Failed to export project:', error);
            this.showStatus('Failed to export project: ' + error, 'error');
        }
    }

    toggleWritingSession() {
        if (this.writingSession) {
            this.endWritingSession();
        } else {
            this.startWritingSession();
        }
    }

    async startWritingSession() {
        try {
            if (this.currentProject) {
                await invoke('start_writing_session', { projectId: this.currentProject.id });
            }

            this.sessionStartTime = Date.now();
            this.sessionTimer = setInterval(() => {
                this.updateSessionTimer();
            }, 1000);

            document.getElementById('session-toggle').innerHTML = '<i class="fas fa-pause"></i>';
            document.getElementById('session-toggle').title = 'Pause Session';

            this.writingSession = true;
            this.showStatus('Writing session started', 'success');

        } catch (error) {
            console.error('Failed to start writing session:', error);
        }
    }

    async endWritingSession() {
        try {
            if (this.currentProject) {
                const stats = await invoke('end_writing_session');
                console.log('Writing session stats:', stats);
            }

            if (this.sessionTimer) {
                clearInterval(this.sessionTimer);
                this.sessionTimer = null;
            }

            document.getElementById('session-toggle').innerHTML = '<i class="fas fa-play"></i>';
            document.getElementById('session-toggle').title = 'Start Session';

            this.writingSession = false;
            this.sessionStartTime = null;
            this.showStatus('Writing session ended', 'info');

        } catch (error) {
            console.error('Failed to end writing session:', error);
        }
    }

    updateSessionTimer() {
        if (!this.sessionStartTime) return;

        const elapsed = Math.floor((Date.now() - this.sessionStartTime) / 1000);
        const hours = Math.floor(elapsed / 3600);
        const minutes = Math.floor((elapsed % 3600) / 60);
        const seconds = elapsed % 60;

        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.querySelector('.session-time').textContent = timeString;
        document.getElementById('session-time').textContent = `${Math.floor(elapsed / 60)}m`;
    }

    toggleDistractionFree() {
        document.body.classList.toggle('distraction-free');
        const button = document.getElementById('distraction-free');

        if (document.body.classList.contains('distraction-free')) {
            button.innerHTML = '<i class="fas fa-compress"></i>';
            button.title = 'Exit Distraction Free Mode';
        } else {
            button.innerHTML = '<i class="fas fa-expand"></i>';
            button.title = 'Distraction Free Mode (F11)';
        }
    }

    toggleSplitView() {
        // Placeholder for split view functionality
        this.showStatus('Split view coming soon!', 'info');
    }

    showFindDialog() {
        // Placeholder for find dialog
        this.showStatus('Find dialog coming soon!', 'info');
    }

    showReplaceDialog() {
        // Placeholder for replace dialog
        this.showStatus('Replace dialog coming soon!', 'info');
    }

    showWordCountDialog() {
        // Placeholder for word count dialog
        this.showStatus('Word count dialog coming soon!', 'info');
    }

    startAutoSave() {
        this.autoSaveInterval = setInterval(() => {
            this.autoSave();
        }, 30000); // Auto-save every 30 seconds
    }

    startWordCountUpdates() {
        this.wordCountUpdateInterval = setInterval(() => {
            this.updateWordCount();
        }, 5000); // Update word count every 5 seconds
    }

    async autoSave() {
        if (this.hasUnsavedChanges() && this.currentProject) {
            try {
                await this.saveCurrentFile();
                document.getElementById('backup-status').textContent = 'Auto-save: ' + new Date().toLocaleTimeString();
            } catch (error) {
                console.error('Auto-save failed:', error);
            }
        }
    }

    hasUnsavedChanges() {
        // Simple implementation - in real app, would track dirty state
        return true;
    }

    markAsUnsaved() {
        document.getElementById('last-saved').textContent = 'Unsaved changes';
    }

    showStatus(message, type = 'info') {
        const statusElement = document.getElementById('status-message');
        statusElement.textContent = message;
        statusElement.className = `text-${type}`;

        // Clear status after 5 seconds
        setTimeout(() => {
            statusElement.textContent = 'Ready';
            statusElement.className = '';
        }, 5000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new WritersApp();
});

// Add CSS for distraction-free mode
const style = document.createElement('style');
style.textContent = `
    .distraction-free .sidebar,
    .distraction-free .header,
    .distraction-free .status-bar,
    .distraction-free .editor-toolbar {
        display: none !important;
    }

    .distraction-free .main-content {
        margin-left: 0 !important;
    }

    .distraction-free .editor-container {
        height: 100vh !important;
    }

    .distraction-free .main-editor {
        padding: 10% 15% !important;
        font-size: 18px !important;
        line-height: 1.8 !important;
    }
`;
document.head.appendChild(style);
