# Voice Editor Integration - Quick Start Guide

## 🎤 Get Started in 3 Minutes

The Voice Editor Integration brings seamless speech-to-text capabilities directly into your writing workflow. Here's how to get started quickly.

### Prerequisites

✅ **Microphone**: Ensure you have a working microphone  
✅ **Permissions**: Browser microphone access (you'll be prompted)  
✅ **Enhanced Mode**: Use the enhanced GUI for voice features

### Step 1: Launch Enhanced GUI

```bash
npm run gui-enhanced
```

### Step 2: Open Any Writing Project

1. Create a new project or open existing one
2. Open any chapter, scene, or document for editing

### Step 3: Start Voice Dictation

#### Method 1: Toolbar Button
- Click the **🎤 Voice** button in the editor toolbar
- Click the **red record button** in the popup
- Start speaking clearly
- Click **stop** when finished
- Review text and click **Insert**

#### Method 2: Keyboard Shortcut
- Press **`Ctrl+Shift+V`** anywhere in the editor
- Follow the same recording process

#### Method 3: Focus Mode
- Enter focus mode with **`F11`**
- Click the **🎤 Voice** button in focus controls
- Use the floating voice recorder
- Text auto-inserts at cursor position

## 🎯 Voice Dictation Tips

### Speaking Best Practices
- **Speak clearly** at normal conversation pace
- **Pause briefly** between sentences
- **Minimize background noise** for better accuracy
- **Use natural speech patterns** - AI handles punctuation

### Positioning Your Cursor
- Place cursor **exactly where** you want text inserted
- Voice text appears **at cursor position** by default
- You can change insert mode in settings (cursor/append/replace)

### Sample Dictation Session

1. **Position cursor** in your document
2. **Activate voice** (Ctrl+Shift+V or click button)
3. **Speak naturally**: *"Sarah walked through the misty forest, her footsteps echoing in the silence. She had never felt more alone."*
4. **Review** the transcribed text
5. **Insert** into your document

## ⚙️ Voice Settings

Click the **gear icon** in the voice popup to configure:

| Setting | Options | Recommendation |
|---------|---------|----------------|
| **Auto-insert** | On/Off | Off (for review) |
| **Insert Mode** | Cursor/Append/Replace | Cursor |
| **Language** | Multiple supported | Your native language |
| **Visualizer** | Show/Hide | Show (helpful feedback) |
| **Auto-save** | On/Off | On (saves after insert) |

## 🚨 Troubleshooting

### Microphone Not Working
- **Check browser permissions** (usually shows in address bar)
- **Test system microphone** in other applications
- **Refresh page** and grant permissions when prompted

### Poor Transcription Quality
- **Reduce background noise** (close windows, turn off fans)
- **Speak closer to microphone** (6-12 inches ideal)
- **Check language setting** matches your speech
- **Speak at moderate pace** (not too fast/slow)

### Voice Button Missing
- **Ensure enhanced GUI** is running (`npm run gui-enhanced`)
- **Refresh browser** if running in development
- **Check console** for JavaScript errors

## 🎵 Advanced Features

### Focus Mode Integration
- **Seamless workflow**: Voice works naturally in focus mode
- **Floating controls**: Minimal interface that stays out of your way
- **Auto-insertion**: Text appears immediately for uninterrupted flow

### Keyboard Shortcuts
- **`Ctrl+Shift+V`**: Toggle voice dictation interface
- **`Escape`**: Stop recording (while recording)
- **`F11`**: Enter/exit focus mode (with voice support)

### Visual Feedback
- **Audio visualizer**: See your voice levels while recording
- **Recording timer**: Track how long you've been speaking
- **Status indicators**: Clear feedback on recording state

## 🎬 Demo & Examples

### Run the Interactive Demo
```bash
npm run demo:voice-editor
```

This creates sample content and launches the GUI with voice integration enabled.

### Example Use Cases

**📝 Creative Writing**
- Dictate dialogue naturally
- Capture inspiration quickly
- Overcome writer's block with spoken brainstorming

**📖 Content Creation**
- Draft blog posts conversationally
- Create outlines by speaking your thoughts
- Add details to existing scenes

**✏️ Editing & Revision**
- Add new paragraphs between existing content
- Insert character descriptions
- Expand on plot points

## 🚀 Next Steps

1. **Try the demo**: `npm run demo:voice-editor`
2. **Practice with short sentences** first
3. **Experiment with different insert modes**
4. **Use in focus mode** for distraction-free dictation
5. **Adjust settings** to match your workflow

## 🔧 Technical Notes

- **Audio format**: WebM with automatic conversion
- **Processing**: Local temporary files, auto-cleaned
- **Privacy**: Audio not stored permanently
- **Languages**: Multiple supported (English, Spanish, French, German, etc.)
- **Browser support**: Modern browsers with MediaRecorder API

---

**🎉 You're Ready!** Voice dictation is now seamlessly integrated into your writing workflow. Start with short phrases and gradually work up to longer passages as you get comfortable with the feature.

**Need Help?** Check the full documentation in `VOICE_EDITOR_INTEGRATION.md` or run `npm run test:voice-editor` to verify your setup.