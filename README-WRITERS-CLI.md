# Writers CLI

A comprehensive writing tool for novelists and short story writers with both command-line and graphical interfaces.

## 🌟 Features

### Comprehensive GUI Interface
- **Project Management**: Create, open, and manage writing projects
- **Real-time Statistics**: Track word counts, progress, and writing pace
- **File Organization**: Manage chapters, scenes, characters, notes, and short stories
- **Integrated Editor**: Write directly in the GUI with auto-save functionality
- **Export Tools**: Export your work to various formats
- **Progress Tracking**: Visual progress bars and detailed analytics

### Powerful CLI Tools
- **Project Initialization**: Set up structured writing projects
- **Content Creation**: Generate chapters, characters, scenes with templates
- **Writing Environment**: Built-in editor with distraction-free mode and typewriter mode
- **Statistics & Analytics**: Detailed word counts and progress tracking
- **Export Options**: Multiple format support (HTML, PDF, EPUB, etc.)
- **Backup System**: Automatic project backups

### Content Organization
- **Chapters**: Main story progression with templates
- **Scenes**: Individual story segments and drafts
- **Characters**: Detailed character profiles and development
- **Short Stories**: Complete standalone works
- **Notes**: Research, plot ideas, and world-building
- **Exports**: Generated files in various formats

## 🚀 Quick Start

### Installation
```bash
npm install -g writers-cli
```

### Basic Usage

#### Command Line Interface
```bash
# Initialize a new project
writers init

# Create content
writers new chapter "Chapter 1"
writers new character "Main Character"
writers new scene "Opening Scene"

# Start writing
writers write chapter1

# View progress
writers stats

# Export your work
writers export html
```

#### Graphical User Interface
```bash
# Launch the comprehensive GUI
writers gui

# Or run the interactive demo
npm run demo-gui
```

## 🖥️ GUI Features

### Dashboard
- **Real-time Word Counts**: Live tracking of your writing progress
- **Progress Visualization**: Visual progress bars toward your word goals
- **Writing Statistics**: Daily averages, chapter counts, and pace tracking
- **Quick Actions**: Fast access to common operations

### File Management
- **Organized Sidebar**: Browse all content types in structured folders
- **One-Click Creation**: Add new chapters, characters, scenes with + buttons
- **Word Count Display**: See word counts for each file at a glance
- **Easy Navigation**: Switch between files without losing your place

### Integrated Editor
- **Full-Featured Writing**: Professional text editor with syntax highlighting
- **Auto-Save**: Automatic saving every 30 seconds
- **Real-time Updates**: Statistics update as you type
- **Keyboard Shortcuts**: Efficient navigation and editing

### Statistics & Analytics
- **Detailed Breakdown**: Chapter-by-chapter analysis
- **Reading Time Estimates**: Calculated based on average reading speed
- **Progress Tracking**: Visual representation of goal completion
- **Writing Patterns**: Track your productivity over time

### Export & Sharing
- **Multiple Formats**: Export to HTML, PDF, and other formats
- **Professional Formatting**: Clean, readable output
- **Project Metadata**: Includes author and project information

## 📁 Project Structure

```
your-novel/
├── writers.config.json    # Project configuration
├── chapters/             # Main story chapters
├── scenes/              # Individual scenes and drafts
├── characters/          # Character profiles
├── shortstories/       # Complete short stories
├── notes/              # Research and plot notes
└── exports/            # Generated export files
```

## 🎯 Getting Started

### 1. Create Your First Project

#### Using GUI
1. Run `writers gui`
2. Click "New Project"
3. Fill in your project details (name, author, word goal, genre)
4. Start writing!

#### Using CLI
```bash
mkdir my-novel
cd my-novel
writers init
```

### 2. Add Content
```bash
# Create your first chapter
writers new chapter "The Beginning"

# Add a character
writers new character "Protagonist"

# Start writing
writers write the-beginning
```

### 3. Track Progress
```bash
# View statistics
writers stats

# List all content
writers list

# See detailed chapter breakdown
writers stats --detailed
```

### 4. Export Your Work
```bash
# Export to HTML
writers export html

# Export specific format
writers export pdf --output "my-novel.pdf"
```

## 🔧 Advanced Features

### Writing Features
- **Typewriter Mode**: Keep your cursor centered while writing (toggle with F9)
- **Distraction-Free Mode**: Full-screen writing environment (F11)
- **Auto-save**: Automatic saving every 30 seconds
- **Word Count Tracking**: Real-time statistics as you write

### Templates
Writers CLI includes templates for different content types:
- **Chapter Template**: Structure for story chapters
- **Character Template**: Comprehensive character development
- **Scene Template**: Individual scene organization
- **Story Template**: Complete short story structure

### Customization
- **Word Goals**: Set and track custom word count targets
- **Genres**: Choose from predefined genres or create custom ones
- **Editor Preferences**: Customize the writing environment
- **Export Settings**: Control output formatting and content inclusion

### Backup & Recovery
- **Automatic Backups**: Regular project backups
- **Version Control**: Track changes over time
- **Export Archives**: Save complete project snapshots

## 📊 Statistics & Analytics

### Real-time Tracking
- **Word Counts**: Live updates as you write
- **Chapter Progress**: Individual chapter statistics
- **Daily Goals**: Track daily writing targets
- **Pace Analysis**: Monitor your writing speed

### Detailed Reports
- **Project Overview**: Complete project statistics
- **Chapter Breakdown**: Detailed analysis per chapter
- **Character Analysis**: Track character development
- **Timeline Tracking**: Monitor project progression

## 🎨 Interface Options

### GUI (Graphical Interface)
- **Modern Design**: Clean, professional interface
- **Real-time Updates**: Live statistics and file management
- **Integrated Tools**: All features in one application
- **Visual Progress**: Charts and progress bars

### CLI (Command Line)
- **Powerful Commands**: Full feature access via terminal
- **Scriptable**: Automate workflows and tasks
- **Efficient**: Fast operations for experienced users
- **Cross-platform**: Works on any system with Node.js

## 🛠️ Installation & Setup

### Requirements
- Node.js 14.0.0 or higher
- npm or yarn package manager
- Electron (for GUI features)

### Development Setup
```bash
git clone https://github.com/yourusername/writers-cli.git
cd writers-cli
npm install
npm run gui
```

### Building from Source
```bash
npm run build
```

## 📚 Documentation

- **GUI Features Guide**: [GUI_FEATURES.md](./GUI_FEATURES.md)
- **Testing Guide**: [GUI_TESTING_GUIDE.md](./GUI_TESTING_GUIDE.md)
- **Editor Guide**: [EDITOR_GUIDE.md](./EDITOR_GUIDE.md)
- **Short Story Guide**: [SHORT_STORY_GUIDE.md](./SHORT_STORY_GUIDE.md)

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines and:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- **Documentation**: Check the guides in the docs/ folder including [TYPEWRITER_MODE.md](./TYPEWRITER_MODE.md)
- **Issues**: Report bugs on GitHub Issues
- **Discussions**: Join community discussions
- **Wiki**: Additional tips and tutorials

## 🎉 What's New

### Latest Version Features
- **Typewriter Mode**: New focused writing mode that keeps cursor centered (F9)
- **Comprehensive GUI**: Full graphical interface with all CLI features
- **Real-time Statistics**: Live progress tracking and analytics
- **Enhanced Editor**: Improved writing experience with auto-save
- **Better Organization**: Streamlined file management
- **Export Tools**: Multiple format support
- **Project Management**: Complete project lifecycle support

### Recent Updates
- Added typewriter mode for focused writing experience
- Added comprehensive GUI interface
- Improved file organization system
- Enhanced statistics and progress tracking
- Better export functionality
- Streamlined project management
- Auto-save and backup features

## 🌟 Why Writers CLI?

- **Complete Solution**: Everything you need for novel and short story writing
- **Flexible Interface**: Choose between GUI and CLI based on your preference
- **Professional Tools**: Features used by published authors
- **Open Source**: Free and customizable
- **Cross-platform**: Works on Windows, Mac, and Linux
- **Active Development**: Regular updates and improvements

Start your writing journey today with Writers CLI - where creativity meets productivity!