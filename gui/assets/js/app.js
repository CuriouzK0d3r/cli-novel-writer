// Writers CLI GUI - Main Application Logic
const { ipcRenderer } = require('electron');

class WritersApp {
  constructor() {
    this.currentView = 'dashboard';
    this.currentProject = null;
    this.currentStats = null;
    this.currentFile = null;
    this.autoSaveTimeout = null;

    this.init();
  }

  async init() {
    try {
      await this.loadProject();
      this.setupEventListeners();
      this.hideLoading();
    } catch (error) {
      console.error('Initialization error:', error);
      this.hideLoading();
      this.showWelcomeModal();
    }
  }

  async loadProject() {
    try {
      const config = await ipcRenderer.invoke('get-project-config');

      if (!config) {
        this.showWelcomeModal();
        return;
      }

      this.currentProject = config;
      await this.loadStats();
      this.updateUI();
      this.loadDashboard();
    } catch (error) {
      console.error('Error loading project:', error);
      this.showWelcomeModal();
    }
  }

  async loadStats() {
    try {
      this.currentStats = await ipcRenderer.invoke('get-project-stats');
    } catch (error) {
      console.error('Error loading stats:', error);
      this.currentStats = null;
    }
  }

  hideLoading() {
    const loadingScreen = document.getElementById('loading-screen');
    const app = document.getElementById('app');

    loadingScreen.style.opacity = '0';
    setTimeout(() => {
      loadingScreen.style.display = 'none';
      app.classList.remove('hidden');
    }, 300);
  }

  updateUI() {
    if (!this.currentProject) return;

    // Update navbar
    document.getElementById('project-name').textContent = this.currentProject.name;
    document.getElementById('project-author').textContent = this.currentProject.author;

    // Update counts in sidebar
    if (this.currentStats && this.currentStats.files) {
      const counts = this.currentStats.files;
      document.getElementById('chapters-count').textContent = counts.chapters || 0;
      document.getElementById('scenes-count').textContent = counts.scenes || 0;
      document.getElementById('characters-count').textContent = counts.characters || 0;
      document.getElementById('notes-count').textContent = counts.notes || 0;
      document.getElementById('shortstories-count').textContent = counts.shortstories || 0;
    }
  }

  loadDashboard() {
    if (!this.currentStats) return;

    // Update progress card
    const totalWords = this.currentStats.totalWords || 0;
    const wordGoal = this.currentStats.wordGoal || 50000;
    const progress = Math.min(100, (totalWords / wordGoal) * 100);
    const wordsRemaining = Math.max(0, wordGoal - totalWords);

    document.getElementById('total-words').textContent = totalWords.toLocaleString();
    document.getElementById('word-goal').textContent = wordGoal.toLocaleString();
    document.getElementById('progress-percent').textContent = `${progress.toFixed(1)}%`;
    document.getElementById('progress-fill').style.width = `${progress}%`;
    document.getElementById('words-remaining').textContent = `${wordsRemaining.toLocaleString()} words remaining`;

    // Calculate estimated completion
    if (this.currentStats.created) {
      const startDate = new Date(this.currentStats.created);
      const daysSinceStart = Math.max(1, Math.ceil((new Date() - startDate) / (1000 * 60 * 60 * 24)));
      const wordsPerDay = Math.round(totalWords / daysSinceStart);

      if (wordsPerDay > 0 && wordsRemaining > 0) {
        const daysToComplete = Math.ceil(wordsRemaining / wordsPerDay);
        const completionDate = new Date();
        completionDate.setDate(completionDate.getDate() + daysToComplete);
        document.getElementById('estimated-completion').textContent = `Est. completion: ${completionDate.toLocaleDateString()}`;
      } else {
        document.getElementById('estimated-completion').textContent = 'Est. completion: -';
      }
    }

    // Update quick stats
    const files = this.currentStats.files || {};
    document.getElementById('total-chapters').textContent = files.chapters || 0;
    document.getElementById('total-scenes').textContent = files.scenes || 0;
    document.getElementById('total-characters').textContent = files.characters || 0;
    document.getElementById('total-notes').textContent = files.notes || 0;

    // Load recent files
    this.loadRecentFiles();
  }

  async loadRecentFiles() {
    try {
      const recentFiles = document.getElementById('recent-files');
      recentFiles.innerHTML = '';

      // Get files from all categories
      const categories = ['chapters', 'scenes', 'characters', 'notes', 'shortstories'];
      const allFiles = [];

      for (const category of categories) {
        const files = await ipcRenderer.invoke('get-files', category);
        files.forEach(file => {
          allFiles.push({ ...file, category });
        });
      }

      // Sort by modification date and take top 5
      allFiles.sort((a, b) => new Date(b.modified) - new Date(a.modified));
      const recentTop = allFiles.slice(0, 5);

      if (recentTop.length === 0) {
        recentFiles.innerHTML = `
          <div class="no-content">
            <i class="fas fa-inbox"></i>
            <p>No recent activity</p>
          </div>
        `;
        return;
      }

      recentTop.forEach(file => {
        const fileElement = this.createRecentFileElement(file);
        recentFiles.appendChild(fileElement);
      });
    } catch (error) {
      console.error('Error loading recent files:', error);
    }
  }

  createRecentFileElement(file) {
    const div = document.createElement('div');
    div.className = 'recent-file';

    const iconMap = {
      chapters: 'fa-book',
      scenes: 'fa-film',
      characters: 'fa-user',
      notes: 'fa-sticky-note',
      shortstories: 'fa-book-open'
    };

    const timeAgo = this.getTimeAgo(new Date(file.modified));

    div.innerHTML = `
      <div class="file-info">
        <div class="file-icon">
          <i class="fas ${iconMap[file.category] || 'fa-file'}"></i>
        </div>
        <div class="file-details">
          <h4>${file.name}</h4>
          <p>${this.capitalize(file.category)} • ${timeAgo}</p>
        </div>
      </div>
      <div class="file-actions">
        <button class="file-action" onclick="app.editFile('${file.path}')" title="Edit">
          <i class="fas fa-edit"></i>
        </button>
      </div>
    `;

    return div;
  }

  getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 7) return date.toLocaleDateString();
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  setupEventListeners() {
    // Sidebar navigation
    document.querySelectorAll('.sidebar-item[data-view]').forEach(item => {
      item.addEventListener('click', (e) => {
        const view = e.currentTarget.dataset.view;
        this.switchView(view);
      });
    });

    // Theme toggle
    document.getElementById('theme-toggle').addEventListener('click', () => {
      this.toggleTheme();
    });

    // Settings button
    document.getElementById('settings-btn').addEventListener('click', () => {
      this.showSettingsModal();
    });

    // Refresh button
    document.getElementById('refresh-btn').addEventListener('click', () => {
      this.refreshData();
    });

    // Quick action buttons
    document.getElementById('new-chapter-btn').addEventListener('click', () => {
      this.showCreateModal('chapters', 'New Chapter');
    });

    document.getElementById('new-scene-btn').addEventListener('click', () => {
      this.showCreateModal('scenes', 'New Scene');
    });

    document.getElementById('new-character-btn').addEventListener('click', () => {
      this.showCreateModal('characters', 'New Character');
    });

    document.getElementById('backup-btn').addEventListener('click', () => {
      this.createBackup();
    });

    // Content view new buttons
    document.getElementById('new-chapter-modal-btn').addEventListener('click', () => {
      this.showCreateModal('chapters', 'New Chapter');
    });

    document.getElementById('new-scene-modal-btn').addEventListener('click', () => {
      this.showCreateModal('scenes', 'New Scene');
    });

    document.getElementById('new-character-modal-btn').addEventListener('click', () => {
      this.showCreateModal('characters', 'New Character');
    });

    document.getElementById('new-note-modal-btn').addEventListener('click', () => {
      this.showCreateModal('notes', 'New Note');
    });

    document.getElementById('new-shortstory-modal-btn').addEventListener('click', () => {
      this.showCreateModal('shortstories', 'New Short Story');
    });

    // Export button
    document.getElementById('export-project-btn').addEventListener('click', () => {
      this.exportProject();
    });

    // Modal event listeners
    this.setupModalEventListeners();

    // Welcome modal listeners
    this.setupWelcomeModalListeners();

    // Menu actions from main process
    ipcRenderer.on('menu-action', (event, action, ...args) => {
      this.handleMenuAction(action, ...args);
    });
  }

  setupModalEventListeners() {
    // Create modal
    const createModal = document.getElementById('create-modal');
    const createForm = document.getElementById('create-form');
    const createClose = document.getElementById('create-modal-close');
    const createCancel = document.getElementById('create-cancel');

    createClose.addEventListener('click', () => this.hideModal('create-modal'));
    createCancel.addEventListener('click', () => this.hideModal('create-modal'));

    createForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleCreateSubmit();
    });

    // Editor modal
    const editorModal = document.getElementById('editor-modal');
    const editorSave = document.getElementById('editor-save-btn');
    const editorClose = document.getElementById('editor-close-btn');
    const editorTextarea = document.getElementById('editor-textarea');

    editorSave.addEventListener('click', () => this.saveCurrentFile());
    editorClose.addEventListener('click', () => this.hideModal('editor-modal'));

    // Auto-save functionality
    editorTextarea.addEventListener('input', () => {
      this.updateEditorStats();
      this.scheduleAutoSave();
    });

    // Settings modal
    const settingsModal = document.getElementById('settings-modal');
    const settingsForm = document.getElementById('settings-form');
    const settingsClose = document.getElementById('settings-modal-close');
    const settingsCancel = document.getElementById('settings-cancel');

    settingsClose.addEventListener('click', () => this.hideModal('settings-modal'));
    settingsCancel.addEventListener('click', () => this.hideModal('settings-modal'));

    settingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSettingsSubmit();
    });

    // Close modals on outside click
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.hideModal(modal.id);
        }
      });
    });
  }

  setupWelcomeModalListeners() {
    document.getElementById('create-project-btn').addEventListener('click', () => {
      this.hideModal('welcome-modal');
      this.showProjectCreationModal();
    });

    document.getElementById('open-project-btn').addEventListener('click', () => {
      this.openProject();
    });

    // Project creation modal
    const projectCreationForm = document.getElementById('project-creation-form');
    const projectCreationClose = document.getElementById('project-creation-close');
    const projectCreationCancel = document.getElementById('project-creation-cancel');

    projectCreationClose.addEventListener('click', () => this.hideModal('project-creation-modal'));
    projectCreationCancel.addEventListener('click', () => this.hideModal('project-creation-modal'));

    projectCreationForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleProjectCreationSubmit();
    });
  }

  switchView(view) {
    // Update sidebar active state
    document.querySelectorAll('.sidebar-item').forEach(item => {
      item.classList.remove('active');
    });
    document.querySelector(`[data-view="${view}"]`).classList.add('active');

    // Update content views
    document.querySelectorAll('.content-view').forEach(contentView => {
      contentView.classList.remove('active');
    });
    document.getElementById(`${view}-view`).classList.add('active');

    this.currentView = view;

    // Load content for the view
    this.loadViewContent(view);
  }

  async loadViewContent(view) {
    switch (view) {
      case 'dashboard':
        this.loadDashboard();
        break;
      case 'chapters':
      case 'scenes':
      case 'characters':
      case 'notes':
      case 'shortstories':
        await this.loadContentList(view);
        break;
      case 'statistics':
        await this.loadStatistics();
        break;
      case 'export':
        // Export view is static
        break;
    }
  }

  async loadContentList(type) {
    try {
      const files = await ipcRenderer.invoke('get-files', type);
      const container = document.getElementById(`${type}-content`);
      container.innerHTML = '';

      if (files.length === 0) {
        container.innerHTML = `
          <div class="no-content">
            <i class="fas fa-inbox"></i>
            <p>No ${type} found</p>
            <button class="btn btn-primary" onclick="app.showCreateModal('${type}', 'New ${this.capitalize(type.slice(0, -1))}')">
              <i class="fas fa-plus"></i>
              Create Your First ${this.capitalize(type.slice(0, -1))}
            </button>
          </div>
        `;
        return;
      }

      // Sort files by modification date (most recent first)
      files.sort((a, b) => new Date(b.modified) - new Date(a.modified));

      const iconMap = {
        chapters: 'fa-book',
        scenes: 'fa-film',
        characters: 'fa-user',
        notes: 'fa-sticky-note',
        shortstories: 'fa-book-open'
      };

      for (const file of files) {
        const fileElement = await this.createContentItem(file, type, iconMap[type]);
        container.appendChild(fileElement);
      }
    } catch (error) {
      console.error(`Error loading ${type}:`, error);
      this.showToast(`Error loading ${type}`, 'error');
    }
  }

  async createContentItem(file, type, iconClass) {
    const div = document.createElement('div');
    div.className = 'content-item';

    let wordCount = 0;
    let readingTime = '0 min';

    try {
      const content = await ipcRenderer.invoke('read-file', file.path);
      wordCount = await ipcRenderer.invoke('count-words', content);
      readingTime = await ipcRenderer.invoke('estimate-reading-time', content);
    } catch (error) {
      console.warn(`Could not read file ${file.path}:`, error);
    }

    const modifiedDate = new Date(file.modified).toLocaleDateString();

    div.innerHTML = `
      <div class="content-icon">
        <i class="fas ${iconClass}"></i>
      </div>
      <div class="content-details">
        <div class="content-title">${file.name}</div>
        <div class="content-meta">
          <span>${wordCount.toLocaleString()} words</span>
          <span>${readingTime}</span>
          <span>Modified ${modifiedDate}</span>
        </div>
      </div>
      <div class="content-actions">
        <button class="content-action" onclick="app.editFile('${file.path}')" title="Edit">
          <i class="fas fa-edit"></i>
        </button>
        <button class="content-action" onclick="app.deleteFile('${file.path}', '${file.name}')" title="Delete">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;

    // Add click handler for main content area
    div.addEventListener('click', (e) => {
      if (!e.target.closest('.content-actions')) {
        this.editFile(file.path);
      }
    });

    return div;
  }

  async loadStatistics() {
    const statsGrid = document.querySelector('.statistics-content .stats-grid');
    if (!this.currentStats) {
      statsGrid.innerHTML = '<p>No statistics available</p>';
      return;
    }

    const stats = this.currentStats;
    const totalWords = stats.totalWords || 0;
    const wordGoal = stats.wordGoal || 50000;
    const progress = Math.min(100, (totalWords / wordGoal) * 100);

    // Calculate additional stats
    const startDate = new Date(stats.created);
    const daysSinceStart = Math.max(1, Math.ceil((new Date() - startDate) / (1000 * 60 * 60 * 24)));
    const wordsPerDay = Math.round(totalWords / daysSinceStart);
    const avgChapterWords = stats.chapters && stats.chapters.length > 0
      ? Math.round(totalWords / stats.chapters.length)
      : 0;

    statsGrid.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3><i class="fas fa-chart-line"></i> Writing Progress</h3>
        </div>
        <div class="card-content">
          <div class="stats-row">
            <div class="stat-item">
              <span class="stat-label">Total Words</span>
              <span class="stat-value">${totalWords.toLocaleString()}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Word Goal</span>
              <span class="stat-value">${wordGoal.toLocaleString()}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Progress</span>
              <span class="stat-value">${progress.toFixed(1)}%</span>
            </div>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progress}%"></div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3><i class="fas fa-calendar"></i> Writing Pace</h3>
        </div>
        <div class="card-content">
          <div class="stats-row">
            <div class="stat-item">
              <span class="stat-label">Days Since Start</span>
              <span class="stat-value">${daysSinceStart}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Words per Day</span>
              <span class="stat-value">${wordsPerDay}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Avg Chapter Length</span>
              <span class="stat-value">${avgChapterWords.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3><i class="fas fa-folder"></i> Content Breakdown</h3>
        </div>
        <div class="card-content">
          <div class="content-breakdown">
            <div class="breakdown-item">
              <i class="fas fa-book"></i>
              <span>Chapters: ${stats.files.chapters || 0}</span>
            </div>
            <div class="breakdown-item">
              <i class="fas fa-film"></i>
              <span>Scenes: ${stats.files.scenes || 0}</span>
            </div>
            <div class="breakdown-item">
              <i class="fas fa-users"></i>
              <span>Characters: ${stats.files.characters || 0}</span>
            </div>
            <div class="breakdown-item">
              <i class="fas fa-sticky-note"></i>
              <span>Notes: ${stats.files.notes || 0}</span>
            </div>
            <div class="breakdown-item">
              <i class="fas fa-book-open"></i>
              <span>Short Stories: ${stats.files.shortstories || 0}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  showModal(modalId) {
    document.getElementById(modalId).classList.add('active');
  }

  hideModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
  }

  showWelcomeModal() {
    this.showModal('welcome-modal');
  }

  showProjectCreationModal() {
    this.showModal('project-creation-modal');
  }

  showCreateModal(type, title) {
    document.getElementById('create-modal-title').textContent = title;
    document.getElementById('create-form').dataset.type = type;
    document.getElementById('create-name').value = '';
    this.showModal('create-modal');
    document.getElementById('create-name').focus();
  }

  showSettingsModal() {
    if (!this.currentProject) return;

    // Populate current settings
    document.getElementById('settings-name').value = this.currentProject.name || '';
    document.getElementById('settings-author').value = this.currentProject.author || '';
    document.getElementById('settings-word-goal').value = this.currentProject.wordGoal || 50000;

    this.showModal('settings-modal');
  }

  async handleCreateSubmit() {
    const form = document.getElementById('create-form');
    const type = form.dataset.type;
    const name = document.getElementById('create-name').value.trim();

    if (!name) {
      this.showToast('Please enter a name', 'error');
      return;
    }

    try {
      await ipcRenderer.invoke('create-file', type, name);
      this.hideModal('create-modal');
      this.showToast(`${this.capitalize(type.slice(0, -1))} created successfully`, 'success');

      // Refresh current view
      await this.refreshData();

      // Switch to the appropriate view if not already there
      if (this.currentView !== type) {
        this.switchView(type);
      }
    } catch (error) {
      console.error('Error creating file:', error);
      this.showToast(error.message || 'Error creating file', 'error');
    }
  }

  async handleSettingsSubmit() {
    const name = document.getElementById('settings-name').value.trim();
    const author = document.getElementById('settings-author').value.trim();
    const wordGoal = parseInt(document.getElementById('settings-word-goal').value) || 50000;

    if (!name || !author) {
      this.showToast('Please fill in all fields', 'error');
      return;
    }

    try {
      const updates = { name, author, wordGoal };
      this.currentProject = await ipcRenderer.invoke('update-config', updates);

      this.hideModal('settings-modal');
      this.showToast('Settings updated successfully', 'success');

      // Refresh UI
      await this.refreshData();
    } catch (error) {
      console.error('Error updating settings:', error);
      this.showToast('Error updating settings', 'error');
    }
  }

  async handleProjectCreationSubmit() {
    const name = document.getElementById('project-name').value.trim();
    const author = document.getElementById('project-author').value.trim();
    const type = document.getElementById('project-type').value;
    const wordGoal = parseInt(document.getElementById('project-word-goal').value) || 50000;

    if (!name || !author) {
      this.showToast('Please fill in all fields', 'error');
      return;
    }

    try {
      const options = { name, author, wordGoal, type };
      this.currentProject = await ipcRenderer.invoke('init-project', options);

      this.hideModal('project-creation-modal');
      this.showToast('Project created successfully', 'success');

      // Load the new project
      await this.loadProject();
    } catch (error) {
      console.error('Error creating project:', error);
      this.showToast(error.message || 'Error creating project', 'error');
    }
  }

  async openProject() {
    try {
      const result = await ipcRenderer.invoke('show-open-dialog', {
        properties: ['openDirectory'],
        title: 'Open Writers CLI Project'
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const projectPath = result.filePaths[0];
        // Change working directory and reload
        process.chdir(projectPath);
        await this.loadProject();
        this.hideModal('welcome-modal');
      }
    } catch (error) {
      console.error('Error opening project:', error);
      this.showToast('Error opening project', 'error');
    }
  }

  async editFile(filePath) {
    try {
      const content = await ipcRenderer.invoke('read-file', filePath);

      // Set up editor
      document.getElementById('editor-title').textContent = `Edit: ${filePath.split('/').pop().replace('.md', '')}`;
      document.getElementById('editor-textarea').value = content;

      this.currentFile = filePath;
      this.updateEditorStats();

      this.showModal('editor-modal');
      document.getElementById('editor-textarea').focus();
    } catch (error) {
      console.error('Error reading file:', error);
      this.showToast('Error opening file', 'error');
    }
  }

  async saveCurrentFile() {
    if (!this.currentFile) return;

    try {
      const content = document.getElementById('editor-textarea').value;
      await ipcRenderer.invoke('write-file', this.currentFile, content);

      document.getElementById('editor-status').textContent = `Saved at ${new Date().toLocaleTimeString()}`;
      this.showToast('File saved successfully', 'success');

      // Clear auto-save timeout
      if (this.autoSaveTimeout) {
        clearTimeout(this.autoSaveTimeout);
        this.autoSaveTimeout = null;
      }
    } catch (error) {
      console.error('Error saving file:', error);
      this.showToast('Error saving file', 'error');
    }
  }

  scheduleAutoSave() {
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }

    this.autoSaveTimeout = setTimeout(() => {
      this.saveCurrentFile();
    }, 3000); // Auto-save after 3 seconds of inactivity
  }

  async updateEditorStats() {
    const content = document.getElementById('editor-textarea').value;
    const wordCount = await ipcRenderer.invoke('count-words', content);
    const readingTime = await ipcRenderer.invoke('estimate-reading-time', content);

    document.getElementById('editor-word-count').textContent = `${wordCount} words`;
    document.getElementById('editor-reading-time').textContent = readingTime;
    document.getElementById('editor-status').textContent = 'Modified';
  }

  async deleteFile(filePath, fileName) {
    const result = await ipcRenderer.invoke('show-message-box', {
      type: 'warning',
      buttons: ['Delete', 'Cancel'],
      defaultId: 1,
      title: 'Delete File',
      message: `Are you sure you want to delete "${fileName}"?`,
      detail: 'This action cannot be undone.'
    });

    if (result.response === 0) {
      try {
        await ipcRenderer.invoke('delete-file', filePath);
        this.showToast('File deleted successfully', 'success');
        await this.refreshData();
      } catch (error) {
        console.error('Error deleting file:', error);
        this.showToast('Error deleting file', 'error');
      }
    }
  }

  async createBackup() {
    try {
      const backupPath = await ipcRenderer.invoke('create-backup');
      this.showToast(`Backup created: ${backupPath}`, 'success');
    } catch (error) {
      console.error('Error creating backup:', error);
      this.showToast('Error creating backup', 'error');
    }
  }

  async exportProject() {
    const format = document.querySelector('input[name="export-format"]:checked').value;

    try {
      const result = await ipcRenderer.invoke('show-save-dialog', {
        defaultPath: `${this.currentProject.name}.${format}`,
        filters: [
          { name: format.toUpperCase(), extensions: [format] }
        ]
      });

      if (!result.canceled) {
        await ipcRenderer.invoke('export-project', format, { output: result.filePath });
        this.showToast('Project exported successfully', 'success');
      }
    } catch (error) {
      console.error('Error exporting project:', error);
      this.showToast('Error exporting project', 'error');
    }
  }

  toggleTheme() {
    const body = document.body;
    const isDark = body.classList.contains('theme-dark');

    if (isDark) {
      body.classList.remove('theme-dark');
      body.classList.add('theme-light');
      document.getElementById('theme-toggle').innerHTML = '<i class="fas fa-moon"></i>';
    } else {
      body.classList.remove('theme-light');
      body.classList.add('theme-dark');
      document.getElementById('theme-toggle').innerHTML = '<i class="fas fa-sun"></i>';
    }

    // Save theme preference
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
  }

  async refreshData() {
    try {
      await this.loadStats();
      this.updateUI();
      this.loadViewContent(this.currentView);
      this.showToast('Data refreshed', 'info');
    } catch (error) {
      console.error('Error refreshing data:', error);
      this.showToast('Error refreshing data', 'error');
    }
  }

  handleMenuAction(action, ...args) {
    switch (action) {
      case 'new-project':
        this.showProjectCreationModal();
        break;
      case 'open-project':
        this.openProject();
        break;
      case 'new-chapter':
        this.showCreateModal('chapters', 'New Chapter');
        break;
      case 'new-scene':
        this.showCreateModal('scenes', 'New Scene');
        break;
      case 'new-character':
        this.showCreateModal('characters', 'New Character');
        break;
      case 'export':
        this.switchView('export');
        break;
      case 'statistics':
        this.switchView('statistics');
        break;
      case 'word-count':
        // Show current word count in toast
        if (this.currentStats) {
          this.showToast(`Total words: ${this.currentStats.totalWords.toLocaleString()}`, 'info');
        }
        break;
      case 'backup':
        this.createBackup();
        break;
      case 'settings':
        this.showSettingsModal();
        break;
      case 'toggle-theme':
        this.toggleTheme();
        break;
      case 'about':
        this.showAbout();
        break;
    }
  }

  showAbout() {
    ipcRenderer.invoke('show-message-box', {
      type: 'info',
      title: 'About Writers CLI',
      message: 'Writers CLI GUI',
      detail: 'A comprehensive writing tool for novelists and short story writers.\n\nVersion 1.0.0\n\nBuilt with Electron and modern web technologies.'
    });
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const iconMap = {
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle',
      warning: 'fa-exclamation-triangle',
      info: 'fa-info-circle'
    };

    toast.innerHTML = `
      <div class="toast-header">
        <i class="fas ${iconMap[type] || 'fa-info-circle'}"></i>
        ${this.capitalize(type)}
      </div>
      <div class="toast-body">${message}</div>
    `;

    container.appendChild(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (container.contains(toast)) {
          container.removeChild(toast);
        }
      }, 300);
    }, 5000);
  }

  // Initialize theme from localStorage
  initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.className = `theme-${savedTheme}`;

    const themeIcon = savedTheme === 'dark' ? 'fa-sun' : 'fa-moon';
    document.getElementById('theme-toggle').innerHTML = `<i class="fas ${themeIcon}"></i>`;
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new WritersApp();
  window.app.initTheme();
});

// Handle window events
window.addEventListener('beforeunload', () => {
  if (window.app && window.app.autoSaveTimeout) {
    clearTimeout(window.app.autoSaveTimeout);
    if (window.app.currentFile) {
      window.app.saveCurrentFile();
    }
  }
});
