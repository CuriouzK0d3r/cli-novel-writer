/**
 * Editor Component
 *
 * Handles the main text editing functionality with features like:
 * - Vim-like navigation mode
 * - Auto-save
 * - Word counting
 * - Undo/redo
 * - Find/replace
 * - Custom keyboard shortcuts
 */

class Editor extends EventTarget {
    constructor() {
        super();
        this.element = null;
        this.mode = 'insert'; // 'insert' or 'navigation'
        this.undoStack = [];
        this.redoStack = [];
        this.lastContent = '';
        this.cursorPosition = { line: 1, column: 1 };
        this.selection = { start: 0, end: 0, length: 0 };
        this.searchHighlights = [];
        this.currentSearchIndex = -1;

        // Configuration
        this.config = {
            tabSize: 2,
            lineHeight: 1.6,
            fontSize: 14,
            fontFamily: 'JetBrains Mono, Monaco, Consolas, monospace',
            wordWrap: true,
            spellCheck: true,
            autoSave: true,
            undoLimit: 100
        };

        // Timers
        this.contentChangeTimer = null;
        this.cursorMoveTimer = null;
        this.autoSaveTimer = null;

        this.init();
    }

    /**
     * Initialize the editor
     */
    init() {
        this.element = document.getElementById('editor');
        if (!this.element) {
            console.error('Editor element not found');
            return;
        }

        this.setupEventListeners();
        this.applyConfiguration();
        this.updateCursorPosition();

        console.log('Editor initialized');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Content change events
        this.element.addEventListener('input', (e) => this.handleInput(e));
        this.element.addEventListener('paste', (e) => this.handlePaste(e));

        // Cursor and selection events
        this.element.addEventListener('selectionchange', () => this.handleSelectionChange());
        this.element.addEventListener('click', () => this.handleClick());
        this.element.addEventListener('keyup', () => this.handleKeyUp());

        // Keyboard events
        this.element.addEventListener('keydown', (e) => this.handleKeyDown(e));

        // Focus events
        this.element.addEventListener('focus', () => this.handleFocus());
        this.element.addEventListener('blur', () => this.handleBlur());

        // Drag and drop
        this.element.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.element.addEventListener('drop', (e) => this.handleDrop(e));
    }

    /**
     * Apply configuration settings
     */
    applyConfiguration() {
        const style = this.element.style;
        style.fontSize = `${this.config.fontSize}px`;
        style.fontFamily = this.config.fontFamily;
        style.lineHeight = this.config.lineHeight;
        style.tabSize = this.config.tabSize;

        this.element.setAttribute('spellcheck', this.config.spellCheck);
        this.element.setAttribute('wrap', this.config.wordWrap ? 'soft' : 'off');
    }

    /**
     * Handle input events
     */
    handleInput(event) {
        clearTimeout(this.contentChangeTimer);

        this.contentChangeTimer = setTimeout(() => {
            const content = this.getContent();

            // Push to undo stack if content significantly changed
            if (this.shouldPushUndo(content)) {
                this.pushUndo();
            }

            this.lastContent = content;
            this.updateCursorPosition();

            // Emit content changed event
            this.dispatchEvent(new CustomEvent('contentChanged', {
                detail: {
                    content,
                    length: content.length,
                    lines: this.getLineCount(),
                    words: this.getWordCount(),
                    characters: content.length
                }
            }));
        }, 300); // Debounce content changes
    }

    /**
     * Handle paste events
     */
    handlePaste(event) {
        // Allow paste but track it for undo
        setTimeout(() => {
            this.pushUndo();
            this.handleInput(event);
        }, 0);
    }

    /**
     * Handle selection changes
     */
    handleSelectionChange() {
        clearTimeout(this.cursorMoveTimer);

        this.cursorMoveTimer = setTimeout(() => {
            this.updateCursorPosition();
            this.updateSelection();
        }, 50); // Debounce cursor movement
    }

    /**
     * Handle click events
     */
    handleClick() {
        this.updateCursorPosition();
        this.updateSelection();
    }

    /**
     * Handle key up events
     */
    handleKeyUp() {
        this.updateCursorPosition();
    }

    /**
     * Handle key down events
     */
    handleKeyDown(event) {
        const { key, ctrlKey, metaKey, shiftKey, altKey } = event;
        const cmdKey = ctrlKey || metaKey;

        // Mode switching
        if (key === 'Escape' && this.mode === 'insert') {
            event.preventDefault();
            this.setMode('navigation');
            return;
        }

        // Navigation mode handling
        if (this.mode === 'navigation') {
            this.handleNavigationMode(event);
            return;
        }

        // Insert mode shortcuts
        if (cmdKey) {
            switch (key) {
                case 'z':
                    event.preventDefault();
                    if (shiftKey) {
                        this.redo();
                    } else {
                        this.undo();
                    }
                    break;
                case 'y':
                    event.preventDefault();
                    this.redo();
                    break;
                case 'a':
                    event.preventDefault();
                    this.selectAll();
                    break;
            }
        }

        // Tab handling
        if (key === 'Tab') {
            event.preventDefault();
            this.insertTab(shiftKey);
        }

        // Enter handling for auto-indentation
        if (key === 'Enter') {
            this.handleEnter(event);
        }
    }

    /**
     * Handle navigation mode
     */
    handleNavigationMode(event) {
        const { key, shiftKey } = event;

        switch (key) {
            case 'i':
                event.preventDefault();
                this.setMode('insert');
                break;
            case 'a':
                event.preventDefault();
                this.setMode('insert');
                this.moveCursor('right');
                break;
            case 'I':
                event.preventDefault();
                this.moveCursor('line-start');
                this.setMode('insert');
                break;
            case 'A':
                event.preventDefault();
                this.moveCursor('line-end');
                this.setMode('insert');
                break;
            case 'h':
            case 'ArrowLeft':
                event.preventDefault();
                this.moveCursor('left', shiftKey);
                break;
            case 'j':
            case 'ArrowDown':
                event.preventDefault();
                this.moveCursor('down', shiftKey);
                break;
            case 'k':
            case 'ArrowUp':
                event.preventDefault();
                this.moveCursor('up', shiftKey);
                break;
            case 'l':
            case 'ArrowRight':
                event.preventDefault();
                this.moveCursor('right', shiftKey);
                break;
            case 'w':
                event.preventDefault();
                this.moveCursor('word-forward', shiftKey);
                break;
            case 'b':
                event.preventDefault();
                this.moveCursor('word-backward', shiftKey);
                break;
            case '0':
                event.preventDefault();
                this.moveCursor('line-start', shiftKey);
                break;
            case '$':
                event.preventDefault();
                this.moveCursor('line-end', shiftKey);
                break;
            case 'g':
                if (event.code === 'KeyG') {
                    event.preventDefault();
                    if (shiftKey) {
                        this.moveCursor('document-end', false);
                    } else {
                        this.moveCursor('document-start', false);
                    }
                }
                break;
        }
    }

    /**
     * Handle Enter key for auto-indentation
     */
    handleEnter(event) {
        const content = this.getContent();
        const cursorPos = this.element.selectionStart;
        const lines = content.substring(0, cursorPos).split('\n');
        const currentLine = lines[lines.length - 1];

        // Calculate indentation
        const indentMatch = currentLine.match(/^(\s*)/);
        const indent = indentMatch ? indentMatch[1] : '';

        // Insert newline with matching indentation
        setTimeout(() => {
            const start = this.element.selectionStart;
            const newContent = content.substring(0, start) + indent + content.substring(start);
            this.setContent(newContent);
            this.setCursorPosition(start + indent.length);
        }, 0);
    }

    /**
     * Handle focus events
     */
    handleFocus() {
        this.element.classList.add('focused');
        this.dispatchEvent(new CustomEvent('focus'));
    }

    /**
     * Handle blur events
     */
    handleBlur() {
        this.element.classList.remove('focused');
        this.dispatchEvent(new CustomEvent('blur'));
    }

    /**
     * Handle drag over
     */
    handleDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    }

    /**
     * Handle file drop
     */
    handleDrop(event) {
        event.preventDefault();

        const files = Array.from(event.dataTransfer.files);
        const textFiles = files.filter(file =>
            file.type.startsWith('text/') ||
            file.name.match(/\.(txt|md|markdown|text)$/i)
        );

        if (textFiles.length > 0) {
            this.dispatchEvent(new CustomEvent('filesDropped', {
                detail: { files: textFiles }
            }));
        }
    }

    /**
     * Set editor mode
     */
    setMode(mode) {
        if (this.mode !== mode) {
            this.mode = mode;
            this.element.classList.toggle('navigation-mode', mode === 'navigation');
            this.element.classList.toggle('insert-mode', mode === 'insert');

            // Update cursor style
            if (mode === 'navigation') {
                this.element.style.caretColor = 'transparent';
                this.element.blur();
            } else {
                this.element.style.caretColor = '';
                this.element.focus();
            }

            this.dispatchEvent(new CustomEvent('modeChanged', {
                detail: { mode }
            }));
        }
    }

    /**
     * Move cursor in different directions
     */
    moveCursor(direction, extend = false) {
        const start = this.element.selectionStart;
        const end = this.element.selectionEnd;
        const content = this.getContent();
        let newPos = start;

        switch (direction) {
            case 'left':
                newPos = Math.max(0, start - 1);
                break;
            case 'right':
                newPos = Math.min(content.length, start + 1);
                break;
            case 'up':
                newPos = this.getPositionUp(start);
                break;
            case 'down':
                newPos = this.getPositionDown(start);
                break;
            case 'word-forward':
                newPos = this.getNextWordPosition(start);
                break;
            case 'word-backward':
                newPos = this.getPreviousWordPosition(start);
                break;
            case 'line-start':
                newPos = this.getLineStart(start);
                break;
            case 'line-end':
                newPos = this.getLineEnd(start);
                break;
            case 'document-start':
                newPos = 0;
                break;
            case 'document-end':
                newPos = content.length;
                break;
        }

        if (extend) {
            this.setSelection(start, newPos);
        } else {
            this.setCursorPosition(newPos);
        }
    }

    /**
     * Get position one line up
     */
    getPositionUp(pos) {
        const content = this.getContent();
        const lines = content.substring(0, pos).split('\n');

        if (lines.length <= 1) return 0;

        const currentLineStart = pos - lines[lines.length - 1].length;
        const prevLineStart = currentLineStart - lines[lines.length - 2].length - 1;
        const columnInCurrentLine = pos - currentLineStart;
        const prevLineLength = lines[lines.length - 2].length;

        return prevLineStart + Math.min(columnInCurrentLine, prevLineLength);
    }

    /**
     * Get position one line down
     */
    getPositionDown(pos) {
        const content = this.getContent();
        const beforeCursor = content.substring(0, pos);
        const afterCursor = content.substring(pos);
        const lines = beforeCursor.split('\n');
        const nextLineEnd = afterCursor.indexOf('\n');

        if (nextLineEnd === -1) return content.length;

        const currentLineStart = pos - lines[lines.length - 1].length;
        const columnInCurrentLine = pos - currentLineStart;
        const nextLineStart = pos + nextLineEnd + 1;
        const nextLineLength = afterCursor.substring(nextLineEnd + 1).split('\n')[0].length;

        return nextLineStart + Math.min(columnInCurrentLine, nextLineLength);
    }

    /**
     * Get next word position
     */
    getNextWordPosition(pos) {
        const content = this.getContent();
        const remaining = content.substring(pos);
        const match = remaining.match(/\S+/);

        if (!match) return content.length;

        return pos + match.index + match[0].length;
    }

    /**
     * Get previous word position
     */
    getPreviousWordPosition(pos) {
        const content = this.getContent();
        const before = content.substring(0, pos);
        const words = before.match(/\S+/g);

        if (!words || words.length === 0) return 0;

        const lastWord = words[words.length - 1];
        return before.lastIndexOf(lastWord);
    }

    /**
     * Get line start position
     */
    getLineStart(pos) {
        const content = this.getContent();
        const beforeCursor = content.substring(0, pos);
        const lastNewline = beforeCursor.lastIndexOf('\n');
        return lastNewline === -1 ? 0 : lastNewline + 1;
    }

    /**
     * Get line end position
     */
    getLineEnd(pos) {
        const content = this.getContent();
        const afterCursor = content.substring(pos);
        const nextNewline = afterCursor.indexOf('\n');
        return nextNewline === -1 ? content.length : pos + nextNewline;
    }

    /**
     * Insert tab or spaces
     */
    insertTab(reverse = false) {
        const start = this.element.selectionStart;
        const end = this.element.selectionEnd;
        const content = this.getContent();
        const tabString = ' '.repeat(this.config.tabSize);

        if (start === end) {
            // No selection, insert tab
            if (reverse) {
                // Remove tab if at beginning of line
                const lineStart = this.getLineStart(start);
                const linePrefix = content.substring(lineStart, start);
                if (linePrefix === tabString) {
                    this.setContent(
                        content.substring(0, lineStart) +
                        content.substring(start)
                    );
                    this.setCursorPosition(lineStart);
                }
            } else {
                this.insertText(tabString);
            }
        } else {
            // Selection exists, indent/outdent lines
            this.indentSelection(reverse);
        }
    }

    /**
     * Indent or outdent selected lines
     */
    indentSelection(reverse = false) {
        const start = this.element.selectionStart;
        const end = this.element.selectionEnd;
        const content = this.getContent();
        const tabString = ' '.repeat(this.config.tabSize);

        const startLinePos = this.getLineStart(start);
        const endLinePos = this.getLineEnd(end);
        const selectedText = content.substring(startLinePos, endLinePos);
        const lines = selectedText.split('\n');

        let newLines;
        if (reverse) {
            // Remove indentation
            newLines = lines.map(line => {
                if (line.startsWith(tabString)) {
                    return line.substring(tabString.length);
                }
                return line;
            });
        } else {
            // Add indentation
            newLines = lines.map(line => tabString + line);
        }

        const newText = newLines.join('\n');
        const newContent =
            content.substring(0, startLinePos) +
            newText +
            content.substring(endLinePos);

        this.setContent(newContent);
        this.setSelection(startLinePos, startLinePos + newText.length);
    }

    /**
     * Insert text at current cursor position
     */
    insertText(text) {
        const start = this.element.selectionStart;
        const end = this.element.selectionEnd;
        const content = this.getContent();

        const newContent =
            content.substring(0, start) +
            text +
            content.substring(end);

        this.setContent(newContent);
        this.setCursorPosition(start + text.length);
    }

    /**
     * Update cursor position tracking
     */
    updateCursorPosition() {
        const pos = this.element.selectionStart;
        const content = this.getContent();
        const beforeCursor = content.substring(0, pos);
        const lines = beforeCursor.split('\n');

        this.cursorPosition = {
            line: lines.length,
            column: lines[lines.length - 1].length + 1,
            position: pos
        };

        this.dispatchEvent(new CustomEvent('cursorMoved', {
            detail: this.cursorPosition
        }));
    }

    /**
     * Update selection tracking
     */
    updateSelection() {
        const start = this.element.selectionStart;
        const end = this.element.selectionEnd;
        const length = end - start;

        this.selection = { start, end, length };

        this.dispatchEvent(new CustomEvent('selectionChanged', {
            detail: this.selection
        }));
    }

    /**
     * Push current content to undo stack
     */
    pushUndo() {
        const content = this.getContent();
        const cursorPos = this.element.selectionStart;

        if (this.undoStack.length >= this.config.undoLimit) {
            this.undoStack.shift();
        }

        this.undoStack.push({
            content: this.lastContent,
            cursorPos: cursorPos
        });

        // Clear redo stack when new edit is made
        this.redoStack = [];
    }

    /**
     * Check if content change should push to undo stack
     */
    shouldPushUndo(content) {
        if (!this.lastContent) return true;

        const lengthDiff = Math.abs(content.length - this.lastContent.length);
        return lengthDiff > 10 ||
               content.split('\n').length !== this.lastContent.split('\n').length;
    }

    /**
     * Undo last change
     */
    undo() {
        if (this.undoStack.length === 0) return false;

        const current = {
            content: this.getContent(),
            cursorPos: this.element.selectionStart
        };

        const state = this.undoStack.pop();
        this.redoStack.push(current);

        this.setContent(state.content);
        this.setCursorPosition(state.cursorPos);

        return true;
    }

    /**
     * Redo last undo
     */
    redo() {
        if (this.redoStack.length === 0) return false;

        const current = {
            content: this.getContent(),
            cursorPos: this.element.selectionStart
        };

        const state = this.redoStack.pop();
        this.undoStack.push(current);

        this.setContent(state.content);
        this.setCursorPosition(state.cursorPos);

        return true;
    }

    /**
     * Select all text
     */
    selectAll() {
        this.element.select();
        this.updateSelection();
    }

    /**
     * Get current content
     */
    getContent() {
        return this.element.value;
    }

    /**
     * Set content
     */
    setContent(content) {
        this.element.value = content;
        this.lastContent = content;
        this.dispatchEvent(new CustomEvent('contentChanged', {
            detail: {
                content,
                length: content.length,
                lines: this.getLineCount(),
                words: this.getWordCount(),
                characters: content.length
            }
        }));
    }

    /**
     * Clear editor content
     */
    clear() {
        this.setContent('');
        this.setCursorPosition(0);
        this.undoStack = [];
        this.redoStack = [];
    }

    /**
     * Set cursor position
     */
    setCursorPosition(pos) {
        this.element.setSelectionRange(pos, pos);
        this.updateCursorPosition();
    }

    /**
     * Set selection range
     */
    setSelection(start, end) {
        this.element.setSelectionRange(start, end);
        this.updateSelection();
    }

    /**
     * Focus the editor
     */
    focus() {
        this.element.focus();
    }

    /**
     * Get line count
     */
    getLineCount() {
        return this.getContent().split('\n').length;
    }

    /**
     * Get word count
     */
    getWordCount() {
        const content = this.getContent().trim();
        if (!content) return 0;
        return content.split(/\s+/).length;
    }

    /**
     * Get character count
     */
    getCharacterCount() {
        return this.getContent().length;
    }

    /**
     * Search for text
     */
    search(query, options = {}) {
        const content = this.getContent();
        const { caseSensitive = false, wholeWord = false, regex = false } = options;

        this.clearSearchHighlights();

        if (!query) return [];

        let searchRegex;
        if (regex) {
            try {
                searchRegex = new RegExp(query, caseSensitive ? 'g' : 'gi');
            } catch (e) {
                return [];
            }
        } else {
            const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const pattern = wholeWord ? `\\b${escapedQuery}\\b` : escapedQuery;
            searchRegex = new RegExp(pattern, caseSensitive ? 'g' : 'gi');
        }

        const matches = [];
        let match;

        while ((match = searchRegex.exec(content)) !== null) {
            matches.push({
                start: match.index,
                end: match.index + match[0].length,
                text: match[0]
            });
        }

        this.searchHighlights = matches;
        this.highlightSearchResults();

        return matches;
    }

    /**
     * Find next search result
     */
    findNext() {
        if (this.searchHighlights.length === 0) return false;

        this.currentSearchIndex = (this.currentSearchIndex + 1) % this.searchHighlights.length;
        const match = this.searchHighlights[this.currentSearchIndex];

        this.setSelection(match.start, match.end);
        this.scrollToSelection();

        return true;
    }

    /**
     * Find previous search result
     */
    findPrevious() {
        if (this.searchHighlights.length === 0) return false;

        this.currentSearchIndex = this.currentSearchIndex <= 0
            ? this.searchHighlights.length - 1
            : this.currentSearchIndex - 1;

        const match = this.searchHighlights[this.currentSearchIndex];

        this.setSelection(match.start, match.end);
        this.scrollToSelection();

        return true;
    }

    /**
     * Replace text
     */
    replace(searchText, replaceText, options = {}) {
        const start = this.element.selectionStart;
        const end = this.element.selectionEnd;
        const selectedText = this.getContent().substring(start, end);

        if (selectedText === searchText) {
            this.insertText(replaceText);
            return true;
        }

        return false;
    }

    /**
     * Replace all occurrences
     */
    replaceAll(searchText, replaceText, options = {}) {
        const matches = this.search(searchText, options);
        if (matches.length === 0) return 0;

        let content = this.getContent();
        let offset = 0;

        for (const match of matches) {
            const start = match.start + offset;
            const end = match.end + offset;

            content = content.substring(0, start) + replaceText + content.substring(end);
            offset += replaceText.length - (match.end - match.start);
        }

        this.setContent(content);
        this.clearSearchHighlights();

        return matches.length;
    }

    /**
     * Highlight search results
     */
    highlightSearchResults() {
        // This would typically be implemented with overlays or background highlighting
        // For now, we'll just dispatch an event that can be handled by the UI
        this.dispatchEvent(new CustomEvent('searchHighlighted', {
            detail: {
                matches: this.searchHighlights,
                currentIndex: this.currentSearchIndex
            }
        }));
    }

    /**
     * Clear search highlights
     */
    clearSearchHighlights() {
        this.searchHighlights = [];
        this.currentSearchIndex = -1;

        this.dispatchEvent(new CustomEvent('searchCleared'));
    }

    /**
     * Scroll to current selection
     */
    scrollToSelection() {
        // This would scroll the editor to show the current selection
        // Implementation depends on the specific scrolling container
    }

    /**
     * Update configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.applyConfiguration();
    }

    /**
     * Cleanup
     */
    cleanup() {
        clearTimeout(this.contentChangeTimer);
        clearTimeout(this.cursorMoveTimer);
        clearTimeout(this.autoSaveTimer);

        if (this.element) {
            this.element.removeEventListener('input', this.handleInput);
            this.element.removeEventListener('keydown', this.handleKeyDown);
            // Remove other event listeners...
        }
    }
}
