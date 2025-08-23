# Voice Model Management

This document explains how to download, switch between, and manage different Whisper AI models in the Writers CLI voice transcription system.

## Overview

The Writers CLI now supports multiple OpenAI Whisper models with different sizes, accuracy levels, and language support. You can download and switch between models through the GUI interface without needing to restart the application.

## Available Models

| Model | Size | Language | Accuracy | Speed | Best For |
|-------|------|----------|----------|--------|----------|
| **whisper-tiny.en** | 39MB | English only | Basic | Very Fast | Quick drafts, fast transcription |
| **whisper-tiny** | 39MB | Multilingual | Basic | Very Fast | Quick multilingual transcription |
| **whisper-base.en** | 74MB | English only | Good | Fast | Balanced speed/accuracy |
| **whisper-base** | 74MB | Multilingual | Good | Fast | Multilingual with good accuracy |
| **whisper-small.en** | 244MB | English only | Very Good | Medium | High-quality English transcription |
| **whisper-small** | 244MB | Multilingual | Very Good | Medium | High-quality multilingual |
| **whisper-medium.en** | 769MB | English only | Excellent | Slow | Professional English work |
| **whisper-medium** | 769MB | Multilingual | Excellent | Slow | Professional multilingual work |
| **whisper-large-v3** | 1550MB | Multilingual | Best | Very Slow | Maximum accuracy needed |

## How to Access Model Management

### Via GUI

1. **Open Voice Interface**: Launch the Writers CLI GUI and navigate to the voice transcription interface
2. **Click Model Manager**: In the settings panel, click the "🤖 Manage Models" button
3. **Model Manager Opens**: A modal window will display all available models and their status

### Via Command Line (Future)

```bash
writers voice models list
writers voice models download whisper-base.en
writers voice models switch whisper-base.en
writers voice models delete whisper-tiny
```

## Using the Model Manager GUI

### Current Model Display

At the top of the model manager, you'll see:
- **Current Model**: Which model is currently active
- **Model Size**: Storage space used by current model
- **Status**: Whether the model is ready for use

### Model Statistics

- **Downloaded Models**: How many models you have installed
- **Storage Used**: Total disk space used by downloaded models
- **Available Models**: Total models you can download

### Model Grid

Each model card shows:
- **Model Name**: Human-readable name and language support
- **Size**: Download size and storage requirements
- **Language**: English-only or multilingual support
- **Accuracy**: Transcription quality level
- **Speed**: Processing speed relative to other models
- **Status**: Downloaded, available, downloading, or active
- **Actions**: Download, switch, or delete buttons

## Model Operations

### Downloading a Model

1. Find the model you want in the model grid
2. Click the "Download & Use" button
3. Wait for download to complete (progress shown at bottom)
4. Model automatically becomes active when download finishes

**Download Times** (approximate):
- Tiny models (39MB): 1-2 minutes
- Base models (74MB): 2-4 minutes
- Small models (244MB): 5-10 minutes
- Medium models (769MB): 15-30 minutes
- Large models (1550MB): 30-60 minutes

### Switching Models

1. Ensure the target model is already downloaded
2. Click "Switch to This" on the desired model card
3. Wait a few seconds for the switch to complete
4. New model is now active for transcription

### Deleting Models

1. Click "Delete" on any downloaded model (except the current one)
2. Confirm deletion in the popup dialog
3. Storage space is freed immediately
4. You can re-download the model later if needed

## Model Recommendations

### For Different Use Cases

**Quick Drafts & Notes**
- Use: `whisper-tiny.en` or `whisper-tiny`
- Why: Fastest transcription, good enough for rough drafts

**General Writing**
- Use: `whisper-base.en` or `whisper-base`
- Why: Best balance of speed and accuracy for most users

**Professional Work**
- Use: `whisper-small.en` or `whisper-small`
- Why: High accuracy without excessive slowness

**Publication-Quality**
- Use: `whisper-medium.en` or `whisper-large-v3`
- Why: Maximum accuracy for final drafts and published content

**Multilingual Projects**
- Use: `whisper-base`, `whisper-small`, or `whisper-large-v3`
- Why: Support for multiple languages in same session

### Storage Considerations

**Limited Storage (< 1GB available)**
- Stick to tiny and base models
- Delete unused models regularly
- Consider cloud storage for larger models

**Moderate Storage (1-5GB available)**
- Can use up to medium models
- Keep 2-3 models for different purposes

**Abundant Storage (> 5GB available)**
- Can download all models
- Keep multiple models for different quality needs

## Technical Details

### Model Architecture

All models are based on OpenAI's Whisper architecture:
- Transformer-based neural networks
- Trained on 680,000 hours of multilingual audio
- Optimized for speech-to-text transcription
- Running locally via ONNX Runtime and WebAssembly

### Performance Characteristics

**Processing Speed** (relative to real-time):
- Tiny: ~2x faster than real-time
- Base: ~1.5x faster than real-time
- Small: ~1x real-time speed
- Medium: ~0.7x real-time speed
- Large: ~0.5x real-time speed

**Memory Usage**:
- Tiny: ~500MB RAM
- Base: ~1GB RAM
- Small: ~2GB RAM
- Medium: ~4GB RAM
- Large: ~6GB RAM

### Storage Locations

Models are cached locally in:
- **Windows**: `%APPDATA%\.writers-cache\models\`
- **macOS**: `~/.writers-cache/models/`
- **Linux**: `~/.writers-cache/models/`

## Configuration

### Settings File

Model preferences are stored in `.writers-enhanced.json`:

```json
{
  "features": {
    "voice": {
      "currentModel": "whisper-base.en",
      "availableModels": {
        "whisper-base.en": {
          "downloaded": true
        }
      }
    }
  }
}
```

### Customization Options

You can modify model behavior by editing the configuration:
- `maxDuration`: Maximum recording length
- `keepAudio`: Whether to save audio files
- `outputFormat`: Text format (markdown, plain, json)

## Troubleshooting

### Common Issues

**Download Fails**
- Check internet connection
- Ensure sufficient disk space
- Restart application and try again

**Model Switch Fails**
- Ensure target model is fully downloaded
- Check that model isn't corrupted (re-download)
- Restart application if problem persists

**Poor Transcription Quality**
- Try a larger, more accurate model
- Ensure good audio quality (quiet environment, close microphone)
- Speak clearly and at moderate pace

**Slow Performance**
- Switch to a smaller/faster model
- Close other resource-intensive applications
- Check available RAM (models need significant memory)

### Getting Help

If you encounter issues:

1. **Check System Requirements**: Ensure you have Node.js 14+ and sufficient RAM
2. **Review Error Messages**: Look for specific error details in the GUI
3. **Test with Tiny Model**: Try `whisper-tiny.en` first to ensure basic functionality
4. **Check Network**: Verify internet connection for downloads
5. **Restart Application**: Sometimes fixes temporary issues

### Advanced Troubleshooting

**Clear Model Cache**:
```bash
# Remove all downloaded models (they'll need re-download)
rm -rf ~/.writers-cache/models/  # macOS/Linux
rmdir /s "%APPDATA%\.writers-cache\models\"  # Windows
```

**Reset Configuration**:
```bash
# Reset voice settings to defaults
writers voice reset
```

**Debug Mode**:
```bash
# Launch with detailed logging
writers gui --debug
```

## API Reference

The model management system provides REST API endpoints:

### Configuration
- `GET /api/voice/config` - Get current voice configuration
- `POST /api/voice/config` - Update voice configuration

### Model Management
- `GET /api/voice/models` - List available models
- `GET /api/voice/models/status` - Get download/status information
- `POST /api/voice/models/download` - Start model download
- `POST /api/voice/models/switch` - Switch active model
- `POST /api/voice/models/delete` - Delete downloaded model

### System Information
- `GET /api/voice/system` - Get system compatibility info
- `POST /api/voice/initialize` - Initialize voice system

## Future Enhancements

Planned features for upcoming versions:

- **Custom Model Support**: Load your own trained Whisper models
- **Batch Processing**: Download multiple models simultaneously
- **Model Compression**: Reduce storage requirements
- **Cloud Sync**: Sync model preferences across devices
- **Performance Profiling**: Detailed speed/accuracy metrics
- **Automatic Updates**: Keep models updated with latest versions

## Contributing

If you'd like to contribute to the model management system:

1. **Report Issues**: Use GitHub issues for bugs and feature requests
2. **Submit PRs**: Follow contribution guidelines in CONTRIBUTING.md
3. **Test Models**: Help test new Whisper model releases
4. **Documentation**: Improve this guide based on your experience

## License

The voice model management system is part of Writers CLI and released under the MIT License. OpenAI Whisper models are subject to their own licensing terms.

---

*Last updated: 2024*
*For the latest information, check the [GitHub repository](https://github.com/yourusername/writers-cli)*