# Writers CLI - Comprehensive GUI Features

The Writers CLI now includes a full-featured graphical user interface that provides comprehensive project management capabilities beyond just editing.

## 🚀 Key Features

### Project Management
- **Create New Projects**: Initialize projects with custom settings, author information, word goals, and genres
- **Open Existing Projects**: Browse and open any Writers CLI project directory
- **Project Settings**: Modify project name, author, word goal, and genre at any time
- **Auto-detection**: Automatically detects and loads Writers projects when opening the GUI

### File Organization & Management
- **Chapters**: Create, organize, and manage your main story chapters
- **Scenes**: Draft individual scenes and story segments
- **Characters**: Develop character profiles and backstories
- **Short Stories**: Write complete standalone stories
- **Notes**: Keep research notes, plot ideas, and story development thoughts
- **One-click Creation**: Add new content with simple buttons and forms

### Advanced Integrated Editor
- **Vim-inspired Keybindings**: Dual-mode editor with navigation and insert modes
- **Professional Features**: Built-in find/replace, go-to-line, word count statistics
- **Auto-save**: Automatically saves your work every 30 seconds
- **Real-time Updates**: File changes immediately reflect in statistics and lists
- **Quick Navigation**: Switch between files without losing your place
- **Distraction-Free Mode**: F11 toggles full-screen writing mode
- **Comprehensive Shortcuts**: Full keyboard navigation and editing commands

### Statistics & Progress Tracking
- **Live Dashboard**: Real-time word counts, chapter counts, and progress tracking
- **Progress Visualization**: Visual progress bars showing completion percentage
- **Writing Pace**: Track your daily writing average and estimated completion
- **Chapter Breakdown**: Detailed statistics for each chapter including word counts and reading time
- **Project Overview**: Comprehensive view of all project content and metrics

### User Interface
- **Collapsible Sidebar**: Maximize writing space when needed
- **Tabbed Navigation**: Easy switching between dashboard, files, statistics, and settings
- **Responsive Design**: Works well on different screen sizes
- **Dark Theme**: Eye-friendly interface for long writing sessions
- **Advanced Editor Interface**: Professional toolbar with mode indicators and cursor position
- **Comprehensive Keyboard Shortcuts**: Efficient navigation and file operations

### Export Capabilities
- **HTML Export**: Export your complete project to a formatted HTML file
- **Chapter Organization**: Maintains proper chapter structure in exports
- **Project Metadata**: Includes author and project information

## 🎯 Getting Started

### Launch the GUI
```bash
# Start the comprehensive GUI
writers gui

# Or use npm script
npm run gui

# Debug mode (shows electron output)
writers gui --debug
```

### First Time Setup
1. **Create a New Project**: Click "New Project" and fill in your project details
2. **Or Open Existing**: Click "Open Project" and select your Writers CLI project folder
3. **Start Writing**: Use the sidebar to create chapters, scenes, or characters
4. **Track Progress**: Monitor your writing progress in the dashboard

## 📂 Interface Overview

### Sidebar Navigation
- **📊 Dashboard**: Project overview, statistics, and progress tracking
- **📁 Files**: Browse and manage all your content (chapters, scenes, characters, stories, notes)
- **📈 Statistics**: Detailed analytics and chapter breakdown
- **⚙️ Settings**: Project configuration and preferences

### Main Content Area
- **Welcome View**: Getting started and quick actions
- **Editor View**: Full-featured text editor for writing
- **Statistics View**: Comprehensive project analytics

### Quick Actions
- **Ctrl/Cmd + N**: Create new chapter (or Shift+N for new project)
- **Ctrl/Cmd + O**: Open project
- **Ctrl/Cmd + S**: Save current file
- **Ctrl/Cmd + W**: Close editor
- **Ctrl/Cmd + E**: Export project
- **Escape**: Toggle between navigation and insert modes / Close modals

### Advanced Editor Shortcuts
#### Navigation Mode (Press Esc)
- **h, j, k, l**: Move cursor (vim-style navigation)
- **w, b**: Move by word forward/backward
- **0, $**: Start/end of line
- **gg, G**: Start/end of document
- **i, a**: Enter insert mode (before/after cursor)

#### Insert Mode (Default)
- **Esc**: Return to navigation mode
- **Ctrl/Cmd + F**: Find text
- **Ctrl/Cmd + R**: Find and replace
- **Ctrl/Cmd + G**: Go to specific line
- **Ctrl/Cmd + W**: Show detailed word count statistics
- **F11**: Toggle distraction-free writing mode
- **F1**: Show keyboard shortcuts help
- **Ctrl/Cmd + Z**: Undo
- **Ctrl/Cmd + Y**: Redo
- **Ctrl/Cmd + A**: Select all text

## 💡 Tips & Best Practices

### Organization
- Use **Chapters** for your main story progression
- Use **Scenes** for drafting individual story segments
- Use **Characters** to develop detailed character profiles
- Use **Notes** for research, plot ideas, and world-building

### Writing Workflow
1. Start with creating a few chapters in the Files tab
2. Switch to the editor to begin writing
3. Monitor your progress in the Dashboard
4. Use the Statistics view to analyze your writing patterns

### Project Management
- Set realistic word goals in Settings
- Export your work regularly as backup
- Use the auto-save feature but manually save important changes
- Check the Statistics tab to track your writing pace

## 🔧 Technical Details

### File Structure
The GUI maintains the same file structure as the CLI:
```
project/
├── chapters/          # Main story chapters
├── scenes/           # Individual scenes
├── characters/       # Character profiles
├── shortstories/     # Complete short stories
├── notes/           # Research and notes
├── exports/         # Exported files
└── writers.config.json # Project configuration
```

### Data Storage
- All content is stored as Markdown files
- Project settings are saved in `writers.config.json`
- Statistics are calculated in real-time from file content
- Advanced editor maintains undo/redo history
- Auto-save functionality preserves work automatically
- No external database required

### Performance
- Optimized for projects with hundreds of files
- Real-time statistics calculation
- Efficient file watching and updates
- Advanced editor with vim-inspired navigation for speed
- Memory-friendly text editor with efficient undo/redo
- Distraction-free mode for focused writing sessions

## 🆕 What's New

This comprehensive GUI includes all the functionality of the CLI tool plus:
- Visual project management
- Real-time statistics dashboard
- Advanced integrated editing environment with vim-inspired keybindings
- Dual-mode editor (navigation and insert modes)
- Professional editing features (find/replace, go-to-line, word count)
- Distraction-free writing mode
- Export functionality
- Project settings management
- File organization tools
- Comprehensive keyboard shortcuts for efficient writing

The GUI complements the existing CLI commands - you can use both interfaces with the same project files.

## 🐛 Troubleshooting

### GUI Won't Start
- Ensure Electron is installed: `npm install electron`
- Check that GUI files exist in the `gui/` directory
- Try debug mode: `writers gui --debug`

### Project Not Loading
- Verify you're in a Writers CLI project directory
- Check that `writers.config.json` exists
- Try running `writers init` first

### File Changes Not Reflecting
- The GUI auto-refreshes every few seconds
- Manually refresh by switching tabs
- Ensure file permissions allow reading/writing

### Editor-Specific Issues
- **Mode Confusion**: Press Esc to enter navigation mode, i/a to enter insert mode
- **Shortcuts Not Working**: Ensure you're in the correct mode (navigation vs insert)
- **Distraction-Free Mode**: Press F11 to toggle, or check View menu

### Getting Help
- **In-Editor Help**: Press F1 while in the editor for keyboard shortcuts
- **Editor Modes**: The mode indicator shows current mode (INSERT/NAVIGATION)
- **Cursor Position**: Bottom toolbar shows line and column numbers

For more help, refer to the main README.md or create an issue on the project repository.