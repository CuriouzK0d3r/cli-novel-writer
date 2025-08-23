# Voice Transcription - Writers CLI

🎤 **Offline voice transcription powered by OpenAI Whisper**

Writers CLI now includes powerful offline voice transcription capabilities, allowing you to convert speech to text for your writing projects without requiring an internet connection after initial setup.

## Features

- **🔌 Completely Offline** - No internet required after initial model download
- **🎯 High Accuracy** - Powered by OpenAI Whisper AI model
- **🖥️ Cross-Platform** - Works on Windows, macOS, and Linux
- **🎙️ Multiple Input Methods** - Record live or upload audio files
- **📝 Seamless Integration** - Direct integration with your writing workflow
- **🔄 Live Transcription** - Continuous transcription in real-time chunks
- **📁 Batch Processing** - Transcribe multiple audio files at once
- **💾 Smart Saving** - Auto-save to Markdown files or append to existing documents

## Quick Start

### 1. Check System Compatibility

```bash
writers voice check
```

This will verify your system has all required dependencies and download the Whisper model if needed.

### 2. Record Your First Voice Note

```bash
writers voice record
```

This will start recording and automatically transcribe your speech to a new Markdown file.

### 3. Transcribe an Existing Audio File

```bash
writers voice transcribe path/to/audio.wav
```

## Command Reference

### Basic Commands

| Command | Description |
|---------|-------------|
| `writers voice` | Show interactive voice menu |
| `writers voice record [filename]` | Record and transcribe to new file |
| `writers voice transcribe <audiofile>` | Transcribe existing audio file |
| `writers voice live` | Start continuous live transcription |
| `writers voice batch [directory]` | Batch transcribe multiple files |
| `writers voice check` | System compatibility check |

### Command Options

| Option | Description | Default |
|--------|-------------|---------|
| `-o, --output <path>` | Specify output file path | Auto-generated |
| `--keep-audio` | Keep audio files after transcription | false |
| `--max-duration <seconds>` | Maximum recording duration | 300 (5 min) |
| `--no-preview` | Skip transcription preview | false |

## Usage Examples

### Record a Quick Voice Note

```bash
# Record with auto-generated filename
writers voice record

# Record to specific file
writers voice record "chapter1-notes.md"

# Record with custom duration (60 seconds)
writers voice record --max-duration 60
```

### Transcribe Audio Files

```bash
# Transcribe a single file
writers voice transcribe recording.wav

# Transcribe with custom output
writers voice transcribe audio.mp3 -o "transcript.md"

# Keep original audio file
writers voice transcribe interview.m4a --keep-audio
```

### Live Transcription Session

```bash
# Start continuous transcription
writers voice live

# Live transcription to specific file
writers voice live "meeting-notes.md"
```

### Batch Processing

```bash
# Transcribe all audio files in current directory
writers voice batch

# Transcribe files in specific directory
writers voice batch ./recordings/

# Transcribe specific file pattern
writers voice batch ./interviews/*.wav
```

## Supported Audio Formats

- **WAV** (recommended for best quality)
- **MP3** (widely supported)
- **M4A** (AAC format)
- **FLAC** (lossless compression)
- **OGG** (open source format)

## GUI Interface

Launch the graphical voice transcription interface:

```bash
writers gui
```

The GUI provides:
- **Visual recording controls** with audio level visualization
- **Real-time transcription** display
- **File upload** drag-and-drop support
- **Settings panel** for customization
- **Export options** (save, copy, append)

### GUI Features

- 🎤 **Large Record Button** - Easy one-click recording
- 📊 **Audio Visualizer** - Real-time microphone level display
- ⏱️ **Timer Display** - Shows recording duration
- ⏸️ **Pause/Resume** - Control recording in real-time
- 📝 **Live Preview** - See transcription as it's processed
- 💾 **Quick Save** - One-click save to Markdown
- 📋 **Copy to Clipboard** - Easy text copying
- ➕ **Append Mode** - Add to existing documents

## Tips for Best Results

### Recording Quality

- **Use a good microphone** - Better audio = better transcription
- **Minimize background noise** - Record in a quiet environment
- **Speak clearly** - Moderate pace, clear pronunciation
- **Stay close to microphone** - 6-12 inches is optimal
- **Avoid echo** - Soft furnishings help reduce echo

### File Formats

- **WAV files** provide the best transcription accuracy
- **16kHz sample rate** is optimal for speech recognition
- **Mono recording** is sufficient for speech
- **Compress files** using MP3/M4A for storage

### Integration Workflow

1. **Voice Brainstorming** - Record ideas quickly during inspiration
2. **Interview Transcription** - Convert interviews to text for analysis
3. **Story Dictation** - Speak your stories directly into text
4. **Note Taking** - Capture meeting notes hands-free
5. **Draft Creation** - Create first drafts through dictation

## Configuration

### Settings File

Voice transcription settings are stored in your `writers.config.json`:

```json
{
  "voice": {
    "maxDuration": 300,
    "keepAudio": false,
    "autoSave": true,
    "outputFormat": "markdown",
    "modelSize": "tiny"
  }
}
```

### Model Sizes

| Model | Size | Speed | Accuracy | Use Case |
|-------|------|-------|----------|----------|
| tiny | 39MB | Fastest | Good | Quick notes |
| base | 74MB | Fast | Better | General use |
| small | 244MB | Medium | Great | High quality |

## Troubleshooting

### Common Issues

**No microphone detected:**
- Check microphone permissions
- Restart the application
- Try a different microphone

**Poor transcription quality:**
- Reduce background noise
- Speak more clearly
- Check microphone positioning
- Try a different audio format

**Model download fails:**
- Check internet connection
- Clear cache: `rm -rf ~/.cache/huggingface`
- Try manual download

**Recording won't start:**
- Check microphone permissions
- Close other applications using microphone
- Restart system audio service

### System Requirements

- **Node.js** 14.0 or higher
- **Available RAM** 2GB minimum (4GB recommended)
- **Disk Space** 1GB for models and temporary files
- **Microphone** Any USB or built-in microphone
- **Operating System** Windows 10+, macOS 10.14+, or Linux

## Advanced Usage

### Custom Workflows

Create custom workflows combining voice transcription with other Writers CLI features:

```bash
# Voice note → Story creation
writers voice record "idea.md"
writers new shortstory "My New Story" --template idea.md

# Interview → Character development
writers voice transcribe interview.wav -o character-notes.md
writers new character "John Doe" --notes character-notes.md
```

### Automation Scripts

```bash
#!/bin/bash
# Daily voice journal
DATE=$(date +%Y-%m-%d)
writers voice record "journal-$DATE.md"
```

### Integration with Text Editors

The transcribed text works seamlessly with:
- **Built-in editor** (`writers write`)
- **External editors** (VS Code, Vim, etc.)
- **Word processors** (via Markdown export)

## API Integration

For developers wanting to integrate voice transcription:

```javascript
const VoiceTranscriber = require('writers-cli/src/voice/transcriber');

const transcriber = new VoiceTranscriber();
await transcriber.initialize();

// Record and transcribe
const result = await transcriber.recordAndTranscribe();
console.log(result.text);

// Transcribe file
const text = await transcriber.transcribeFile('audio.wav');
console.log(text);
```

## Privacy & Security

- **100% Offline** - No data sent to external servers
- **Local Processing** - All transcription happens on your device
- **No Cloud Dependencies** - Works without internet after setup
- **Secure Storage** - Transcriptions saved locally only
- **Open Source** - Built on open-source Whisper model

## Performance Optimization

### For Better Speed:
- Use smaller model sizes (tiny/base)
- Record shorter segments
- Use WAV format for processing
- Close unnecessary applications

### For Better Accuracy:
- Use larger model sizes (small/medium)
- High-quality audio input
- Minimize background noise
- Clear speech patterns

## Future Roadmap

- **Speaker Recognition** - Identify different speakers
- **Punctuation Enhancement** - Better automatic punctuation
- **Custom Vocabularies** - Add domain-specific terms
- **Real-time Streaming** - Live transcription display
- **Multiple Languages** - Support for non-English languages

## Support

If you encounter issues:

1. Run the system check: `writers voice check`
2. Check the troubleshooting section above
3. Review system requirements
4. Open an issue on GitHub with system info and error messages

---

**Happy writing! 🎤✍️**

*Voice transcription makes capturing ideas easier than ever. Speak your thoughts and let AI handle the typing.*