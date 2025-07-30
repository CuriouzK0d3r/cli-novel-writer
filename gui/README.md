# Writers CLI GUI

A modern graphical user interface for the Writers CLI novel writing tool. This GUI version preserves all the powerful keybindings and features of the terminal-based editor while providing a clean, distraction-free writing environment.

## Features

### 🎯 **Exact Same Keybindings as CLI Editor**
All your familiar keyboard shortcuts work exactly the same:
- `Ctrl+S` - Save file
- `Ctrl+O` - Open file
- `Ctrl+N` - New file
- `Ctrl+X` - Exit
- `Ctrl+Z` - Undo
- `Ctrl+Y` - Redo
- `Ctrl+A` - Select all
- `Ctrl+F` - Find text
- `Ctrl+R` - Find and replace
- `Ctrl+G` - Go to line
- `Ctrl+W` - Word count statistics
- `F1` - Help
- `F11` - Distraction-free mode

### 📝 **Dual Mode Editing**
- **Insert Mode**: Normal typing and editing
- **Navigation Mode**: Vim-like navigation
  - Press `Esc` to enter navigation mode
  - Press `i` to return to insert mode
  - Use `w/k`, `s/j`, `a/h`, `d/l` for cursor movement

### ✨ **Writer-Focused Features**
- **Auto-save**: Automatically saves every 30 seconds
- **Real-time statistics**: Live word count, character count, and cursor position
- **Distraction-free mode**: Press F11 to hide all UI elements for focused writing
- **Dark theme**: Easy on the eyes for long writing sessions
- **Find and replace**: Powerful search functionality
- **Undo/Redo**: Full editing history with unlimited undo levels

### 🖥️ **Modern GUI Benefits**
- Native file dialogs for opening/saving
- Menu bar with all functions
- Status bar with writing statistics
- Modal dialogs for search, replace, and statistics
- Responsive design that works at any window size

## Getting Started

### Prerequisites
- Node.js 14 or higher
- Electron (automatically installed with the project)

### Launch Methods

#### 1. From CLI Command
```bash
writers gui
```

#### 2. From npm Script
```bash
npm run gui
```

#### 3. Direct Electron Launch
```bash
electron gui/main.js
```

#### 4. Using the Launcher Script
```bash
node gui-launcher.js
```

## Interface Overview

### Toolbar
- **Mode Indicator**: Shows current editing mode (INSERT/NAVIGATION)
- **File Info**: Displays current file name

### Editor Area
- **Main Text Editor**: Full-screen text editing area
- **Monospace Font**: Optimized for writing with consistent character spacing

### Status Bar
- **Cursor Position**: Line and column numbers
- **Selection Info**: Shows selected text length
- **Word Count**: Real-time word counting
- **Character Count**: Total characters including spaces
- **Save Status**: Shows save state (●=unsaved, ✓=saved)

### Modals
- **Find Dialog**: Search for text with next/previous navigation
- **Replace Dialog**: Find and replace text with individual or bulk operations
- **Go to Line**: Jump directly to any line number
- **Word Count**: Detailed statistics including reading time estimates
- **Help**: Complete keyboard shortcut reference

## Writing Workflow

### Starting a New Document
1. Launch the GUI with `writers gui`
2. Start typing immediately (auto-saves as "Untitled")
3. Press `Ctrl+S` to save with a specific filename
4. Use `Ctrl+W` to check your progress

### Opening Existing Files
1. Press `Ctrl+O` or use File → Open
2. Navigate to your document
3. The file loads with full editing history

### Focused Writing
1. Press `F11` to enter distraction-free mode
2. All UI elements disappear except the text
3. Text is centered with comfortable margins
4. Press `F11` again to return to normal view

### Navigation Mode (Vim-like)
1. Press `Esc` to enter navigation mode
2. Use keyboard shortcuts for movement:
   - `w/k` or arrow up: Move cursor up
   - `s/j` or arrow down: Move cursor down  
   - `a/h` or arrow left: Move cursor left
   - `d/l` or arrow right: Move cursor right
3. Press `i` to return to insert mode

## Tips for Maximum Productivity

### Keyboard-First Workflow
- Learn the keyboard shortcuts - they're much faster than using the mouse
- Use `Ctrl+F` to quickly find text instead of scrolling
- `Ctrl+G` lets you jump to specific lines for quick navigation

### Auto-save Benefits
- Your work is automatically saved every 30 seconds when a file is open
- The status bar shows save state with visual indicators
- You can still manually save with `Ctrl+S` for important milestones

### Statistics Tracking
- Press `Ctrl+W` anytime to see detailed writing statistics
- Track word count, reading time, and document structure
- Use this for setting and meeting daily writing goals

### Search and Replace
- `Ctrl+F` for simple text search with next/previous buttons
- `Ctrl+R` for powerful find and replace operations
- Use "Replace All" for bulk changes across your entire document

## Compatibility

### File Formats
- Plain text (.txt)
- Markdown (.md, .markdown)
- All file formats supported by the CLI version

### Cross-Platform
- Windows: Full support with native file dialogs
- macOS: Native menu bar integration
- Linux: GTK-based file dialogs

### CLI Integration
- Files created in GUI work seamlessly with CLI commands
- Project structure remains compatible
- All Writers CLI features remain accessible via command line

## Troubleshooting

### GUI Won't Start
```bash
# Check if Electron is installed
npm list electron

# Reinstall if needed
npm install electron

# Try alternative launch method
npm run gui
```

### Performance Issues
- Close other applications to free up memory
- Restart the GUI if editing very large files
- Use the CLI editor for files over 1MB

### Keyboard Shortcuts Not Working
- Make sure the editor area has focus (click in the text area)
- On macOS, some shortcuts use Cmd instead of Ctrl
- Check that no other applications are intercepting the shortcuts

## Development

### Architecture
- **Main Process**: `gui/main.js` - Electron main process, handles menus and file operations
- **Renderer Process**: `gui/renderer.html` + `gui/renderer.js` - UI and editor logic
- **Shared Logic**: Reuses existing editor utilities from `src/editor/`

### Customization
- Modify `gui/renderer.html` for UI changes
- Update `gui/renderer.js` for editor behavior
- Adjust `gui/main.js` for menu items and shortcuts

## Support

For issues, questions, or feature requests:
1. Check the main Writers CLI documentation
2. Use `F1` in the GUI for keyboard shortcut reference
3. Try the CLI version to isolate GUI-specific issues
4. Report bugs with steps to reproduce

---

**Happy Writing!** 📖✨

The GUI preserves everything you love about the Writers CLI editor while adding the convenience of a modern graphical interface. Whether you're drafting your first chapter or editing your final manuscript, this interface adapts to your writing style and workflow.