# Voice Model Quick Start Guide

Get up and running with different Whisper AI models in 5 minutes.

## 🚀 Quick Setup

1. **Open Writers CLI GUI**
   ```bash
   npm run gui
   ```

2. **Go to Voice Interface**
   - Click "Voice Transcription" in the main menu
   - Or press `Ctrl+Shift+V`

3. **Open Model Manager**
   - Click "🤖 Manage Models" button in settings panel

## 📋 Choose Your Model

### For Beginners
Start with **whisper-base.en** (74MB):
- Good accuracy for English
- Fast enough for real-time use
- Small download size

### For Quality Work
Use **whisper-small.en** (244MB):
- Very good accuracy
- Still reasonably fast
- Best balance for professional use

### For Speed
Stick with **whisper-tiny.en** (39MB):
- Already downloaded by default
- Fastest transcription
- Perfect for quick notes

## 🔽 Download a Model

1. **Find your chosen model** in the model grid
2. **Click "Download & Use"**
3. **Wait for download** (progress shown at bottom)
4. **Start transcribing** when complete!

**Download times:**
- Tiny (39MB): ~1 minute
- Base (74MB): ~2-3 minutes  
- Small (244MB): ~5-8 minutes

## 🔄 Switch Models

To change between downloaded models:
1. **Click "Switch to This"** on any downloaded model
2. **Wait 2-3 seconds** for switch to complete
3. **New model is active** - start transcribing!

## 🎤 Test Your Model

1. **Click the red record button**
2. **Speak clearly** for 10-15 seconds
3. **Click stop** when finished
4. **Check transcription quality**
5. **Switch models** if needed for better results

## 💡 Quick Tips

- **Start small**: Download base or small models first
- **Test quality**: Record the same phrase with different models
- **Manage storage**: Delete unused models to save space
- **English vs Multilingual**: Use `.en` models for English-only work

## 🆘 Troubleshooting

**Download stuck?**
- Check internet connection
- Close and reopen model manager
- Try a smaller model first

**Poor quality?**
- Try a larger model (base → small → medium)
- Speak closer to microphone
- Reduce background noise

**Out of space?**
- Delete unused models
- Start with tiny/base models only
- Check available disk space

## 🎯 Recommended Workflows

### Writer's Workflow
1. Start with `whisper-base.en` (good balance)
2. Download `whisper-small.en` for final drafts
3. Keep `whisper-tiny.en` for quick notes

### Multilingual Workflow  
1. Download `whisper-base` (multilingual, fast)
2. Add `whisper-small` for higher quality
3. Use `whisper-large-v3` for maximum accuracy

### Storage-Conscious Workflow
1. Use `whisper-tiny.en` (already installed)
2. Download one additional model based on needs
3. Delete models when not in use

## 🔧 Advanced

### Model Comparison
Test the same 30-second recording with different models to find your preference.

### Batch Downloads
Download multiple models when you have good internet - they'll be ready when needed.

### Performance Monitoring
Watch CPU/RAM usage in task manager when using larger models.

---

**Need more details?** See the full [MODEL_MANAGEMENT.md](./MODEL_MANAGEMENT.md) guide.

**Having issues?** Check the troubleshooting section or open a GitHub issue.