# Writers CLI - GUI Application

A modern, feature-rich graphical user interface for the Writers CLI writing tool. This GUI provides an intuitive way to manage your writing projects, chapters, scenes, characters, and notes with advanced features and beautiful themes.

## Features

### 🎨 Core Features
- **Project Dashboard** - Overview of your writing progress and statistics
- **File Management** - Create, edit, and organize chapters, scenes, characters, and notes
- **Integrated Editor** - Built-in markdown editor with auto-save functionality
- **Statistics Tracking** - Real-time word count, progress tracking, and writing analytics
- **Export Functionality** - Export your work to HTML, PDF, and EPUB formats
- **Project Settings** - Customize word goals, author information, and preferences

### ⚡ Enhanced Edition Features
- **Multiple Themes** - Dark, Light, Sepia, High Contrast, Nord, and Monokai themes
- **Smart Writing Tools** - Grammar checking and style suggestions
- **Focus Mode** - Distraction-free writing environment
- **Pomodoro Timer** - Built-in productivity timer for writing sessions
- **Advanced Analytics** - Deep insights into your writing patterns
- **Collaboration Tools** - Real-time collaborative editing (coming soon)
- **Enhanced Export** - Additional formats including DOCX and LaTeX

## Installation

The GUI is included with Writers CLI. Make sure you have all dependencies installed:

```bash
npm install
```

## Quick Start

### Method 1: Using the CLI Command
```bash
# Launch Enhanced Edition (default)
writers gui

# Launch Classic GUI
writers gui --classic

# Launch with debug output
writers gui --debug

# Launch quietly (no startup messages)
writers gui --quiet
```

### Method 2: Using NPM Scripts
```bash
# Enhanced Edition
npm run gui

# Classic GUI
npm run gui-classic

# Development mode (with auto-restart)
npm run gui-dev
```

### Method 3: Direct Launch
```bash
# Enhanced Edition
node gui-enhanced-launcher.js

# Classic GUI
npx electron gui/main.js
```

## Interface Overview

### Main Sections

1. **Navigation Bar** - Project name, author, and settings
2. **Sidebar** - Content navigation and file counts
3. **Main Content Area** - Dashboard, file lists, editor, and tools
4. **Modals** - File creation, settings, and editor windows

### Dashboard

The dashboard provides a comprehensive overview of your project:

- **Writing Progress** - Visual progress bar with word count and goal tracking
- **Quick Stats** - File counts and project statistics
- **Recent Activity** - Recently modified files and chapters
- **Quick Actions** - Create new content with one click

### Content Management

Navigate through different content types using the sidebar:

- **📖 Chapters** - Main story chapters
- **🎬 Scenes** - Individual scenes and drafts
- **👤 Characters** - Character profiles and development
- **📝 Notes** - Research, plot notes, and ideas
- **📚 Short Stories** - Complete short stories

### Integrated Editor

The built-in editor provides:

- **Markdown Support** - Full markdown formatting
- **Auto-save** - Automatic saving every 3 seconds
- **Live Statistics** - Real-time word count and reading time
- **Syntax Highlighting** - Markdown syntax highlighting
- **Distraction-free** - Clean, focused writing environment

## Keyboard Shortcuts

### Global Shortcuts
- `Ctrl+N` - New project
- `Ctrl+O` - Open project
- `Ctrl+S` - Save current file (in editor)
- `Ctrl+Shift+C` - New chapter
- `Ctrl+Shift+S` - New scene
- `Ctrl+Shift+H` - New character
- `Ctrl+E` - Export project
- `Ctrl+I` - Show statistics
- `F11` - Toggle fullscreen

### Editor Shortcuts
- `Ctrl+F` - Find text
- `Ctrl+H` - Find and replace
- `Ctrl+Z` - Undo
- `Ctrl+Y` - Redo
- `Ctrl+A` - Select all

### Enhanced Edition Shortcuts
- `Ctrl+Shift+F` - Focus mode
- `Ctrl+Shift+T` - Toggle Pomodoro timer
- `Ctrl+Shift+O` - Toggle outline panel
- `Ctrl+Shift+R` - Toggle research panel

## Themes

The GUI supports multiple themes for different writing preferences:

### Built-in Themes
- **Light** - Clean, bright interface for daytime writing
- **Dark** - Easy on the eyes for low-light environments
- **Sepia** - Warm, paper-like colors for comfortable reading
- **High Contrast** - Maximum contrast for accessibility
- **Nord** - Cool, arctic color palette
- **Monokai** - Popular dark theme for developers

### Switching Themes
1. Click the theme toggle button in the navigation bar
2. Use the View menu → Dark Theme
3. Enhanced Edition: Use theme selector in settings

## Project Management

### Creating a New Project

1. **Via Welcome Screen**:
   - Click "Create New Project"
   - Fill in project details (name, author, type, word goal)
   - Click "Create Project"

2. **Via Menu**:
   - File → New Project
   - Or use `Ctrl+N`

### Opening an Existing Project

1. **Via Welcome Screen**:
   - Click "Open Existing Project"
   - Navigate to project folder
   - Select the folder containing `writers.config.json`

2. **Via Menu**:
   - File → Open Project
   - Or use `Ctrl+O`

### Project Settings

Access project settings via:
- Settings button in navigation bar
- Tools menu → Project Settings

Customize:
- Project name and author
- Word goal
- Auto-save preferences
- Backup settings

## File Operations

### Creating Content

1. **Quick Actions** (Dashboard):
   - Click any "New [Type]" button

2. **Content Views**:
   - Navigate to the content type (Chapters, Scenes, etc.)
   - Click "New [Type]" button

3. **Keyboard Shortcuts**:
   - Use the shortcuts listed above

### Editing Files

1. **From Content Lists**:
   - Click on any file to open in editor
   - Or click the edit icon

2. **From Recent Activity**:
   - Click the edit icon next to recent files

3. **Editor Features**:
   - Auto-save every 3 seconds
   - Live word count and reading time
   - Markdown formatting support

### Deleting Files

1. In content lists, click the trash icon
2. Confirm deletion in the dialog
3. **Note**: Deleted files cannot be recovered

## Export Features

Export your project in various formats:

### Available Formats

**Standard Edition**:
- **HTML** - Web-ready format with styling
- **PDF** - Portable document format
- **EPUB** - E-book format

**Enhanced Edition** (Additional formats):
- **DOCX** - Microsoft Word format
- **LaTeX** - Academic/scientific document format
- **InDesign** - Professional publishing format

### Export Process

1. Navigate to Export view
2. Select desired format
3. Click "Export Project"
4. Choose save location
5. Wait for export completion

## Statistics and Analytics

### Dashboard Statistics
- Total word count
- Progress toward goal
- Estimated completion date
- File counts by type
- Recent activity

### Detailed Statistics
Navigate to Statistics view for:
- Chapter-by-chapter breakdown
- Writing pace analysis
- Content distribution
- Length analysis
- Progress tracking

### Enhanced Analytics (Enhanced Edition)
- Writing session tracking
- Daily writing patterns
- Productivity insights
- Goal achievement metrics

## Backup and Data Safety

### Automatic Backups
- Auto-save every 3 seconds in editor
- Project files saved locally
- No data sent to external servers

### Manual Backups
1. Use "Create Backup" quick action
2. Or Tools menu → Backup Project
3. Backups stored in `backups/` folder

### Data Location
- Project files: Current working directory
- Configuration: `writers.config.json`
- Enhanced settings: `.writers-enhanced.json`
- Backups: `backups/` subfolder

## Troubleshooting

### Common Issues

**GUI Won't Start**:
- Ensure Electron is installed: `npm install electron`
- Check for port conflicts (Enhanced Edition)
- Try classic mode: `writers gui --classic`

**Files Not Loading**:
- Ensure you're in a Writers CLI project directory
- Check for `writers.config.json` file
- Try refreshing: Click refresh button or `Ctrl+R`

**Performance Issues**:
- Close unused modal windows
- Reduce file count in large projects
- Use classic GUI for better performance

**Theme Issues**:
- Theme toggle button in navigation bar
- Check browser compatibility (internal)
- Reset theme via settings

### Debug Mode

For troubleshooting, use debug mode:

```bash
writers gui --debug
```

This provides:
- Console output
- Error messages
- Performance metrics
- Feature status

### Getting Help

1. **Documentation**: This README and CLI help
2. **Issues**: GitHub issues page
3. **Debug Info**: Use `--debug` flag for detailed output

## Advanced Features (Enhanced Edition)

### Focus Mode
- Distraction-free writing environment
- Hidden interface elements
- Typewriter mode available
- Access via `Ctrl+Shift+F`

### Pomodoro Timer
- 25-minute work sessions
- 5-minute breaks
- Long breaks after 4 sessions
- Customizable durations in settings

### Smart Writing Tools
- Grammar checking
- Style suggestions
- Readability analysis
- Word choice improvements

### Collaboration (Coming Soon)
- Real-time collaborative editing
- Project sharing
- Comment system
- Version control integration

## System Requirements

### Minimum Requirements
- **OS**: Windows 10, macOS 10.12, or Linux
- **RAM**: 4GB
- **Storage**: 500MB free space
- **Node.js**: Version 14 or higher

### Recommended Requirements
- **RAM**: 8GB or more
- **Storage**: 1GB free space
- **Display**: 1280x800 or higher resolution

### Dependencies
- Electron (included)
- Node.js modules (installed via npm)
- Writers CLI core files

## Contributing

The Writers CLI GUI is part of the Writers CLI project. Contributions are welcome!

### Development Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Run in development mode: `npm run gui-dev`

### File Structure
```
gui/
├── main.js                 # Main Electron process
├── project-interface.html  # Main UI
├── assets/
│   ├── css/
│   │   └── styles.css     # Main stylesheet
│   ├── js/
│   │   └── app.js         # Application logic
│   ├── themes/            # Additional themes
│   └── icons/             # Application icons
├── collaboration/         # Real-time collaboration
└── smart-tools/          # AI writing tools
```

### Contributing Guidelines
- Follow existing code style
- Test changes with both Classic and Enhanced editions
- Update documentation for new features
- Ensure cross-platform compatibility

## License

Writers CLI GUI is released under the MIT License. See the main project LICENSE file for details.

---

**Happy Writing!** 📖✨

The Writers CLI GUI is designed to make your writing process more enjoyable and productive. Whether you're working on a novel, short stories, or any other writing project, the GUI provides the tools you need to stay organized and focused on your craft.