/* Writers CLI - Enhanced Editor JavaScript */

class EditorEnhancements {
    constructor() {
        this.isInitialized = false;
        this.settings = {
            theme: 'default',
            fontFamily: 'Crimson Text',
            fontSize: 16,
            lineHeight: 1.8,
            typewriterMode: false,
            focusMode: false,
            zenMode: false,
            autoSave: true,
            autoSaveInterval: 30000, // 30 seconds
            wordWrapWidth: 80,
            showWordCount: true,
            showReadingTime: true,
            enableAnimations: true
        };
        this.stats = {
            wordsWritten: 0,
            timeSpent: 0,
            sessionsToday: 0,
            streak: 0
        };
        this.timers = {
            autoSave: null,
            typing: null,
            session: null
        };
        this.isTyping = false;
        this.sessionStartTime = null;
    }

    init() {
        if (this.isInitialized) return;

        this.loadSettings();
        this.setupEventListeners();
        this.initializeEditor();
        this.startSession();

        this.isInitialized = true;
        console.log('Editor enhancements initialized');
    }

    loadSettings() {
        const saved = localStorage.getItem('writers-cli-editor-settings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
    }

    saveSettings() {
        localStorage.setItem('writers-cli-editor-settings', JSON.stringify(this.settings));
    }

    setupEventListeners() {
        // Enhanced typing detection
        document.addEventListener('input', (e) => {
            if (e.target.matches('.editor-textarea, .focus-mode-textarea')) {
                this.handleTyping(e);
            }
        });

        // Enhanced focus management
        document.addEventListener('focusin', (e) => {
            if (e.target.matches('.editor-textarea, .focus-mode-textarea')) {
                this.handleEditorFocus(e);
            }
        });

        document.addEventListener('focusout', (e) => {
            if (e.target.matches('.editor-textarea, .focus-mode-textarea')) {
                this.handleEditorBlur(e);
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Theme switching
        const themeButtons = document.querySelectorAll('[data-theme]');
        themeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTheme(e.target.dataset.theme);
            });
        });

        // Window resize handling
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Visibility change (for pause/resume tracking)
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });
    }

    initializeEditor() {
        const modal = document.getElementById('editor-modal');
        if (modal) {
            modal.classList.add('editor-enhanced');
        }

        this.setupAutoSave();
        this.setupProgressTracking();
        this.applyTheme();
        this.updateEditorStats();
    }

    handleTyping(event) {
        const textarea = event.target;

        // Mark as typing
        this.isTyping = true;
        textarea.classList.add('typing');

        // Clear existing timer
        if (this.timers.typing) {
            clearTimeout(this.timers.typing);
        }

        // Set timer to stop typing indicator
        this.timers.typing = setTimeout(() => {
            this.isTyping = false;
            textarea.classList.remove('typing');
        }, 1500);

        // Update stats
        this.updateWordCount(textarea);
        this.updateReadingTime(textarea);

        // Trigger auto-save
        this.triggerAutoSave();

        // Handle typewriter scroll
        if (this.settings.typewriterMode) {
            this.handleTypewriterScroll(textarea);
        }
    }

    handleEditorFocus(event) {
        const textarea = event.target;
        const modal = textarea.closest('.modal');

        // Add focus animations
        if (this.settings.enableAnimations) {
            textarea.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            modal?.classList.add('editor-focused');
        }

        // Start session timer if not already started
        if (!this.sessionStartTime) {
            this.startSession();
        }
    }

    handleEditorBlur(event) {
        const textarea = event.target;
        const modal = textarea.closest('.modal');

        // Remove focus styling
        modal?.classList.remove('editor-focused');

        // Save current state
        this.saveEditorState(textarea);
    }

    handleKeyboardShortcuts(event) {
        // Ctrl/Cmd + S: Save
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
            event.preventDefault();
            this.saveDocument();
            return;
        }

        // Ctrl/Cmd + F: Focus mode
        if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
            event.preventDefault();
            this.toggleFocusMode();
            return;
        }

        // Ctrl/Cmd + T: Typewriter mode
        if ((event.ctrlKey || event.metaKey) && event.key === 't') {
            event.preventDefault();
            this.toggleTypewriterMode();
            return;
        }

        // Ctrl/Cmd + Z: Zen mode
        if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
            event.preventDefault();
            this.toggleZenMode();
            return;
        }

        // Escape: Exit modes
        if (event.key === 'Escape') {
            this.exitSpecialModes();
            return;
        }
    }

    updateWordCount(textarea) {
        const text = textarea.value;
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const chars = text.length;
        const charsNoSpaces = text.replace(/\s/g, '').length;

        // Update display
        const wordCountEl = document.getElementById('editor-word-count');
        if (wordCountEl) {
            wordCountEl.innerHTML = `
                <i class="fas fa-file-word"></i>
                ${words} words, ${chars} chars
            `;
            wordCountEl.classList.add('word-count-badge');
        }

        // Update stats
        this.stats.wordsWritten = Math.max(this.stats.wordsWritten, words);

        return { words, chars, charsNoSpaces };
    }

    updateReadingTime(textarea) {
        const text = textarea.value;
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        const readingTime = Math.ceil(words / 200); // Average reading speed

        const readingTimeEl = document.getElementById('editor-reading-time');
        if (readingTimeEl) {
            readingTimeEl.innerHTML = `
                <i class="fas fa-clock"></i>
                ${readingTime} min read
            `;
        }

        return readingTime;
    }

    handleTypewriterScroll(textarea) {
        if (!this.settings.typewriterMode) return;

        // Get cursor position
        const cursorPos = textarea.selectionStart;
        const textBeforeCursor = textarea.value.substring(0, cursorPos);
        const lines = textBeforeCursor.split('\n');
        const currentLine = lines.length;

        // Calculate scroll position to center current line
        const lineHeight = parseInt(getComputedStyle(textarea).lineHeight);
        const containerHeight = textarea.clientHeight;
        const scrollTop = (currentLine * lineHeight) - (containerHeight / 2);

        // Smooth scroll to position
        textarea.scrollTo({
            top: Math.max(0, scrollTop),
            behavior: 'smooth'
        });
    }

    setupAutoSave() {
        if (!this.settings.autoSave) return;

        this.timers.autoSave = setInterval(() => {
            const textarea = document.querySelector('.editor-textarea, .focus-mode-textarea');
            if (textarea && textarea.value) {
                this.saveEditorState(textarea);
                this.showNotification('Document auto-saved', 'success');
            }
        }, this.settings.autoSaveInterval);
    }

    triggerAutoSave() {
        // Debounced auto-save
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
        }

        this.autoSaveTimeout = setTimeout(() => {
            const textarea = document.querySelector('.editor-textarea, .focus-mode-textarea');
            if (textarea) {
                this.saveEditorState(textarea);
            }
        }, 2000);
    }

    saveEditorState(textarea) {
        const state = {
            content: textarea.value,
            cursorPosition: textarea.selectionStart,
            timestamp: Date.now()
        };

        localStorage.setItem('writers-cli-editor-state', JSON.stringify(state));
    }

    restoreEditorState(textarea) {
        const saved = localStorage.getItem('writers-cli-editor-state');
        if (saved) {
            const state = JSON.parse(saved);
            textarea.value = state.content;
            textarea.setSelectionRange(state.cursorPosition, state.cursorPosition);
        }
    }

    switchTheme(themeName) {
        const body = document.body;
        const currentTheme = body.className.match(/theme-[\w-]+/);

        if (currentTheme) {
            body.classList.remove(currentTheme[0]);
        }

        body.classList.add(`theme-${themeName}`);
        this.settings.theme = themeName;
        this.saveSettings();

        this.showNotification(`Switched to ${themeName.replace('-', ' ')} theme`, 'info');
    }

    applyTheme() {
        if (this.settings.theme !== 'default') {
            this.switchTheme(this.settings.theme);
        }
    }

    toggleTypewriterMode() {
        this.settings.typewriterMode = !this.settings.typewriterMode;
        const textarea = document.querySelector('.editor-textarea, .focus-mode-textarea');

        if (textarea) {
            textarea.classList.toggle('typewriter-mode', this.settings.typewriterMode);
        }

        const indicator = document.getElementById('typewriter-indicator');
        const button = document.getElementById('typewriter-toggle-btn');

        if (indicator) {
            indicator.style.display = this.settings.typewriterMode ? 'inline-flex' : 'none';
            indicator.classList.add('status-indicator', 'typewriter-mode');
        }

        if (button) {
            button.innerHTML = `
                <i class="fas fa-align-center"></i>
                Typewriter: ${this.settings.typewriterMode ? 'ON' : 'OFF'}
            `;
        }

        this.saveSettings();
        this.showNotification(
            `Typewriter mode ${this.settings.typewriterMode ? 'enabled' : 'disabled'}`,
            'info'
        );
    }

    toggleFocusMode() {
        const focusMode = document.querySelector('.focus-mode');
        const isActive = focusMode?.classList.contains('active');

        if (isActive) {
            focusMode.classList.remove('active');
            this.settings.focusMode = false;
        } else {
            focusMode?.classList.add('active');
            this.settings.focusMode = true;

            // Focus the textarea
            setTimeout(() => {
                const textarea = document.querySelector('.focus-mode-textarea');
                textarea?.focus();
            }, 100);
        }

        this.saveSettings();
        this.showNotification(
            `Focus mode ${this.settings.focusMode ? 'enabled' : 'disabled'}`,
            'info'
        );
    }

    toggleZenMode() {
        this.settings.zenMode = !this.settings.zenMode;
        const modal = document.querySelector('.editor-enhanced');

        if (modal) {
            modal.classList.toggle('zen-mode', this.settings.zenMode);
        }

        this.saveSettings();
        this.showNotification(
            `Zen mode ${this.settings.zenMode ? 'enabled' : 'disabled'}`,
            'info'
        );
    }

    exitSpecialModes() {
        // Exit focus mode
        if (this.settings.focusMode) {
            this.toggleFocusMode();
        }

        // Exit zen mode
        if (this.settings.zenMode) {
            this.toggleZenMode();
        }
    }

    startSession() {
        this.sessionStartTime = Date.now();
        this.stats.sessionsToday++;

        // Start session timer
        this.timers.session = setInterval(() => {
            this.updateSessionTime();
        }, 1000);
    }

    updateSessionTime() {
        if (!this.sessionStartTime) return;

        const elapsed = Date.now() - this.sessionStartTime;
        this.stats.timeSpent = Math.floor(elapsed / 1000);

        // Update UI if there's a session timer element
        const sessionEl = document.getElementById('session-time');
        if (sessionEl) {
            const minutes = Math.floor(this.stats.timeSpent / 60);
            const seconds = this.stats.timeSpent % 60;
            sessionEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    handleVisibilityChange() {
        if (document.hidden) {
            // Page is hidden, pause session
            if (this.timers.session) {
                clearInterval(this.timers.session);
            }
        } else {
            // Page is visible, resume session
            this.startSession();
        }
    }

    setupProgressTracking() {
        const modal = document.querySelector('.editor-enhanced .modal-content');
        if (!modal) return;

        // Add progress bar
        const progressBar = document.createElement('div');
        progressBar.className = 'writing-progress';
        progressBar.innerHTML = '<div class="writing-progress-bar" style="width: 0%"></div>';
        modal.appendChild(progressBar);
    }

    updateProgressBar(percentage) {
        const progressBar = document.querySelector('.writing-progress-bar');
        if (progressBar) {
            progressBar.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
        }
    }

    setupWritingGoal(wordGoal) {
        this.settings.dailyWordGoal = wordGoal;
        this.saveSettings();
    }

    checkWritingGoal() {
        if (!this.settings.dailyWordGoal) return;

        const progress = (this.stats.wordsWritten / this.settings.dailyWordGoal) * 100;
        this.updateProgressBar(progress);

        if (progress >= 100) {
            this.showNotification('🎉 Daily writing goal achieved!', 'success', 5000);
        }
    }

    saveDocument() {
        const textarea = document.querySelector('.editor-textarea, .focus-mode-textarea');
        if (!textarea) return;

        // Trigger the existing save functionality
        const saveBtn = document.getElementById('editor-save-btn');
        if (saveBtn) {
            saveBtn.click();
        } else {
            // Fallback save
            this.saveEditorState(textarea);
            this.showNotification('Document saved', 'success');
        }
    }

    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
        `;

        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 16px',
            background: this.getNotificationColor(type),
            color: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: '10000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            fontFamily: 'var(--font-family)',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            minWidth: '200px'
        });

        document.body.appendChild(notification);

        // Animate in
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
        });

        // Remove after duration
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, duration);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    getNotificationColor(type) {
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#06b6d4'
        };
        return colors[type] || '#06b6d4';
    }

    updateEditorStats() {
        const statsContainer = document.querySelector('.editor-info');
        if (!statsContainer) return;

        // Clear existing content and rebuild
        statsContainer.innerHTML = `
            <div class="editor-info-left">
                <span id="editor-word-count">0 words</span>
                <span id="editor-reading-time">0 min read</span>
                <span id="session-time">0:00</span>
            </div>
            <div class="editor-info-right">
                <span id="editor-status" class="status-indicator">NORMAL</span>
                <span id="typewriter-indicator" class="status-indicator typewriter-mode" style="display: none">
                    <i class="fas fa-align-center"></i>
                    TYPEWRITER
                </span>
                <span id="vim-help">ESC: Normal | i: Insert | h/j/k/l: Navigate</span>
            </div>
        `;
    }

    handleResize() {
        // Recalculate typewriter scroll if active
        if (this.settings.typewriterMode) {
            const textarea = document.querySelector('.editor-textarea.typewriter-mode');
            if (textarea) {
                this.handleTypewriterScroll(textarea);
            }
        }
    }

    destroy() {
        // Clear all timers
        Object.values(this.timers).forEach(timer => {
            if (timer) clearInterval(timer);
        });

        // Remove event listeners
        // Note: Using anonymous functions makes cleanup difficult
        // In a production app, you'd store references to remove them

        this.isInitialized = false;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.editorEnhancements = new EditorEnhancements();
});

// Initialize when editor modal opens
document.addEventListener('click', (e) => {
    if (e.target.matches('[data-view="chapters"], [data-view="scenes"], [data-view="notes"]') ||
        e.target.closest('[data-view="chapters"], [data-view="scenes"], [data-view="notes"]')) {

        // Small delay to ensure modal is rendered
        setTimeout(() => {
            if (window.editorEnhancements && !window.editorEnhancements.isInitialized) {
                window.editorEnhancements.init();
            }
        }, 100);
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EditorEnhancements;
}
