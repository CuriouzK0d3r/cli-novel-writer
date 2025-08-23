# Writers CLI - Novel & Story Writing Tool

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)](https://nodejs.org/)

A comprehensive command-line interface for writing novels, short stories, and other creative content with **offline AI-powered voice transcription**.

## 🚀 Key Features

### ✍️ Writing & Organization
- **Novel Project Management** - Organize chapters, scenes, and characters
- **Short Story Workflows** - Simplified tools for short fiction
- **Smart Templates** - Pre-built structures for different story types
- **Progress Tracking** - Word counts, statistics, and writing goals
- **Export Options** - HTML, PDF, EPUB formats

### 🎤 Voice Transcription (NEW!)
- **Offline Speech-to-Text** - Powered by OpenAI Whisper AI
- **Cross-Platform Support** - Works on Windows, macOS, and Linux
- **Real-time Recording** - Live voice note capture
- **Batch Processing** - Transcribe multiple audio files
- **Smart Integration** - Direct integration with your writing projects

### 🖥️ User Interface
- **CLI Commands** - Powerful terminal interface
- **GUI Application** - Electron-based graphical interface
- **Built-in Editor** - Rich text editing with focus modes
- **External Editor Support** - VS Code, Vim, nano integration

## 📦 Installation

### Quick Install
```bash
npm install -g writers-cli
```

### From Source
```bash
git clone https://github.com/yourusername/writers-cli.git
cd writers-cli
npm install
npm link
```

## 🎤 Voice Transcription Quick Start

### 1. System Check
```bash
writers voice check
```
This downloads the AI model (~40MB) and verifies your system compatibility.

### 2. Record Your First Voice Note
```bash
writers voice record
```
Speak your ideas and watch them transform into text automatically!

### 3. Transcribe Audio Files
```bash
writers voice transcribe audio.wav
```
Convert existing recordings to text documents.

## 📋 Command Reference

### Core Writing Commands
```bash
writers init                    # Initialize a new writing project
writers init-short             # Quick short story setup
writers new chapter "Title"    # Create a new chapter
writers write                  # Smart writing interface
writers stats                  # Project statistics
writers export pdf             # Export to different formats
```

### Voice Transcription Commands
```bash
writers voice                  # Interactive voice menu
writers voice record [file]    # Record and transcribe
writers voice transcribe <audio> # Transcribe existing file
writers voice live             # Continuous transcription
writers voice batch [dir]      # Batch process files
writers voice check            # System compatibility
```

### GUI Interface
```bash
writers gui                    # Launch graphical interface
```

## 🎯 Voice Transcription Features

### Supported Audio Formats
- **WAV** (recommended) - Best transcription quality
- **MP3** - Widely compatible
- **M4A** - Apple/AAC format
- **FLAC** - Lossless compression
- **OGG** - Open source format

### Key Capabilities
- **100% Offline** - No internet required after setup
- **High Accuracy** - OpenAI Whisper AI technology
- **Fast Processing** - Real-time transcription
- **Smart Saving** - Auto-save to Markdown files
- **Workflow Integration** - Append to existing documents

### Usage Examples

#### Quick Voice Notes
```bash
# Record a 2-minute voice memo
writers voice record --max-duration 120

# Record and append to existing chapter
writers voice record chapter1-notes.md
```

#### Interview Transcription
```bash
# Transcribe interview recording
writers voice transcribe interview.mp3 -o character-development.md

# Batch transcribe multiple interviews
writers voice batch interviews/ --keep-audio
```

#### Live Writing Sessions
```bash
# Continuous dictation mode
writers voice live story-draft.md

# Voice brainstorming session
writers voice record ideas.md --max-duration 600
```

## 📖 Writing Workflow Examples

### Novel Writing
```bash
# 1. Initialize project
writers init -n "My Great Novel" -a "Your Name"

# 2. Create story structure
writers new chapter "The Beginning"
writers new character "Hero Name"
writers new scene "Opening Scene"

# 3. Voice brainstorming
writers voice record plot-ideas.md

# 4. Start writing
writers write chapter1.md

# 5. Track progress
writers stats --detailed
```

### Short Story Creation
```bash
# Quick setup
writers init-short -n "Flash Fiction"

# Voice outline
writers voice record outline.md --max-duration 300

# Write with built-in editor
writers write

# Export when ready
writers export pdf
```

### Content Creation Workflow
```bash
# Morning voice journal
writers voice record journal-$(date +%Y-%m-%d).md

# Transcribe research interviews
writers voice batch recordings/ 

# Create content from voice notes
writers new blogpost "Article Title" --template journal-2024-01-15.md
```

## ⚙️ Configuration

### Voice Settings
Configure voice transcription in `writers.config.json`:

```json
{
  "voice": {
    "maxDuration": 300,
    "keepAudio": false,
    "autoSave": true,
    "outputFormat": "markdown"
  }
}
```

### Editor Preferences
```json
{
  "editor": {
    "preferred": "novel-editor",
    "focusMode": true,
    "typewriterMode": false
  }
}
```

## 🎨 GUI Features

Launch with `writers gui` for:

- **Visual Voice Recording** - Large record button with audio visualization
- **Drag & Drop Audio** - Upload files for transcription
- **Real-time Preview** - See transcription as it processes
- **Project Management** - Visual project organization
- **Export Tools** - One-click publishing options

## 📚 Documentation

- **[Voice Transcription Guide](VOICE_TRANSCRIPTION.md)** - Comprehensive voice features
- **[GUI Usage](GUI-README.md)** - Graphical interface guide
- **[Short Story Workflow](SIMPLE_SHORT_STORY_GUIDE.md)** - Quick fiction writing
- **[Advanced Features](ENHANCED_EDITOR_FEATURES.md)** - Power user tools

## 🛠️ System Requirements

### Minimum Requirements
- **Node.js** 14.0 or higher
- **RAM** 2GB available (4GB recommended)
- **Disk Space** 1GB for AI models and cache
- **Microphone** Any USB or built-in microphone

### Operating Systems
- **Windows** 10 or later
- **macOS** 10.14 (Mojave) or later  
- **Linux** Most distributions (Ubuntu 18.04+, CentOS 7+)

## 🚀 Getting Started Tutorial

### 1. First-Time Setup
```bash
# Install globally
npm install -g writers-cli

# Check installation
writers --version

# System check (downloads AI model)
writers voice check
```

### 2. Create Your First Project
```bash
# Interactive setup
writers init

# Or quick setup
writers init -n "My Story" -a "Your Name"
```

### 3. Try Voice Transcription
```bash
# Record a test note
writers voice record test.md

# Check the generated file
cat test.md
```

### 4. Start Writing
```bash
# Use built-in editor
writers write

# Or launch GUI
writers gui
```

## 🤖 Voice Model Management

The Writers CLI supports multiple OpenAI Whisper models with different sizes and accuracy levels:

### Available Models
- **whisper-tiny.en** (39MB) - Fastest, basic accuracy
- **whisper-base.en** (74MB) - Good balance of speed/accuracy
- **whisper-small.en** (244MB) - High accuracy, moderate speed
- **whisper-medium.en** (769MB) - Excellent accuracy
- **whisper-large-v3** (1.5GB) - Best accuracy, multilingual

### Model Management via GUI
1. Open voice transcription interface
2. Click "🤖 Manage Models" button
3. Download, switch, or delete models as needed
4. Models switch instantly without restarting

### Quick Start
```bash
# Test model management
npm run demo:model-management

# Run model management tests  
npm run test:model-management
```

See [MODEL_MANAGEMENT.md](MODEL_MANAGEMENT.md) for complete guide.

## 🏗️ Architecture

### Voice Transcription Stack
- **Frontend**: Electron + HTML5 Web Audio API
- **Backend**: Node.js + OpenAI Whisper (via Transformers.js)
- **AI Models**: 9 Whisper models from 39MB to 1.5GB
- **Model Management**: Download/switch models via GUI
- **Storage**: Local file system (no cloud dependencies)

### Writing Tools
- **CLI**: Commander.js-based command interface
- **Editor**: Custom terminal-based editor with focus modes
- **Export**: Puppeteer for PDF generation, custom HTML/EPUB
- **Storage**: File-based project structure with JSON metadata

## 🤝 Contributing

We welcome contributions! Areas where you can help:

- **Voice Features**: Additional audio format support
- **Writing Tools**: New templates and workflows  
- **UI/UX**: Interface improvements
- **Documentation**: Guides and examples
- **Testing**: Cross-platform validation

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI Whisper** - Exceptional speech recognition AI
- **Transformers.js** - Client-side AI model execution
- **Electron** - Cross-platform desktop applications
- **The Writing Community** - Inspiration and feedback

---

## 🎯 Quick Examples

### Voice-to-Story Workflow
```bash
# 1. Voice brainstorm
writers voice record story-ideas.md --max-duration 600

# 2. Create project from ideas
writers init -n "New Story"

# 3. Voice outline chapters
writers voice live outline.md

# 4. Write first draft via dictation
writers voice record chapter1-draft.md --max-duration 1800

# 5. Edit and refine
writers write chapter1.md

# 6. Export finished work
writers export pdf -o "My-Story.pdf"
```

### Interview-to-Article Pipeline
```bash
# 1. Transcribe interviews
writers voice batch interviews/ --keep-audio

# 2. Create article project  
writers init-blog -n "Feature Article"

# 3. Combine transcripts
cat interviews/*_transcript.md > research.md

# 4. Write article using research
writers write article.md --notes research.md

# 5. Publish
writers export html -o article.html
```

**Start your writing journey with voice today!** 🎤✍️

```
writers voice record && writers gui
```

---

*Writers CLI - Where ideas meet innovation. Speak your story into existence.*