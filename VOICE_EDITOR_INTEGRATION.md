# Voice Editor Integration

## Overview

The Voice Editor Integration brings seamless voice dictation capabilities directly into the Writers CLI writing editor, allowing authors to compose and edit their work using speech-to-text technology. This feature integrates with both the main editor modal and focus mode, providing a natural writing experience.

## Features

### 🎤 Direct Editor Integration
- **Toolbar Integration**: Voice button directly in the editor toolbar
- **Popup Controls**: Compact voice recording interface that doesn't interrupt writing flow
- **Cursor Position Insertion**: Transcribed text is inserted exactly where your cursor is positioned
- **Real-time Preview**: Review transcribed text before insertion

### 🎯 Focus Mode Support
- **Floating Controls**: Unobtrusive voice controls that don't break focus mode immersion
- **Minimal Interface**: Clean, floating voice recorder that stays out of your way
- **Seamless Integration**: Voice dictation works naturally with focus mode and typewriter mode

### ⚙️ Smart Settings
- **Auto-insert Mode**: Automatically insert transcribed text at cursor position
- **Insert Modes**: 
  - Cursor position (default)
  - Append to end
  - Replace all text
- **Language Support**: Multiple language options for transcription
- **Auto-save**: Automatically save after voice insertion

### 🎨 Visual Feedback
- **Audio Visualizer**: Real-time audio waveform display during recording
- **Recording Timer**: Track recording duration
- **Status Indicators**: Clear visual feedback for recording states
- **Toast Notifications**: Non-intrusive feedback messages

## Getting Started

### Prerequisites

1. **Microphone Permission**: Grant microphone access when prompted
2. **Enhanced Mode**: Voice integration requires the enhanced GUI mode
3. **Audio Dependencies**: Ensure system audio recording capabilities

### Installation

The voice editor integration is automatically included when you run the enhanced GUI:

```bash
npm run gui-enhanced
```

## Usage

### Basic Voice Dictation

#### In Main Editor
1. Open any file for editing
2. Place your cursor where you want to insert text
3. Click the voice button 🎤 in the toolbar, or press `Ctrl+Shift+V`
4. Click the record button to start dictation
5. Speak clearly into your microphone
6. Click stop when finished
7. Review the transcribed text and click "Insert"

#### In Focus Mode
1. Enter focus mode (`F11` or `Ctrl+Shift+F`)
2. Click the voice button in the focus controls
3. Use the floating voice recorder
4. Speak your content
5. Text is automatically inserted at cursor position

### Keyboard Shortcuts

- `Ctrl+Shift+V`: Toggle voice dictation interface
- `Escape`: Stop recording (if currently recording)

### Voice Commands

While the system doesn't support voice commands for punctuation by default, you can speak naturally and the AI transcription will add appropriate punctuation. For best results:

- **Speak clearly** at a moderate pace
- **Pause briefly** between sentences
- **Use natural speech** patterns
- **Avoid background noise** when possible

## Settings

Access voice settings through the gear icon in the voice popup:

### Auto-insert Settings
- **Auto-insert**: Automatically insert transcribed text without preview
- **Manual Review**: Show preview before insertion (recommended for accuracy)

### Insert Mode Options
- **Cursor Position**: Insert text at current cursor position
- **Append to End**: Add text to the end of the document
- **Replace All**: Replace entire document content

### Audio Settings
- **Language**: Select transcription language (English, Spanish, French, German, etc.)
- **Visualizer**: Toggle audio waveform display
- **Auto-save**: Automatically save document after text insertion

## Technical Details

### Architecture

```
Voice Editor Integration
├── Frontend (JavaScript)
│   ├── VoiceEditorIntegration class
│   ├── Audio recording (MediaRecorder API)
│   ├── UI management
│   └── Settings persistence
├── IPC Communication
│   ├── Audio data transfer
│   └── Transcription requests
└── Backend (Node.js)
    ├── VoiceElectronHandlers
    ├── Audio file handling
    └── AI transcription service
```

### Audio Processing Pipeline

1. **Capture**: Browser MediaRecorder API captures audio in WebM format
2. **Transfer**: Audio data sent to Electron main process via IPC
3. **Storage**: Temporary audio file created in system temp directory
4. **Transcription**: Audio processed through AI transcription service
5. **Cleanup**: Temporary files automatically cleaned up
6. **Insertion**: Transcribed text inserted into editor at cursor position

### Supported Audio Formats

- **Input**: WebM with Opus codec (browser standard)
- **Processing**: Automatic conversion to formats supported by transcription service
- **Quality**: 44.1kHz sample rate with noise suppression

## Integration Points

### Editor Integration

The voice integration seamlessly works with existing editor features:

- **Vim Keybindings**: Voice insertion respects vim mode states
- **Auto-save**: Triggers existing auto-save functionality
- **Word Count**: Updates statistics after voice insertion
- **Undo/Redo**: Voice insertions can be undone like any text edit
- **Typewriter Mode**: Compatible with typewriter scrolling

### Theme Support

Voice controls automatically adapt to:
- Light/Dark theme switching
- Custom color schemes
- High contrast accessibility modes
- Reduced motion preferences

## Troubleshooting

### Common Issues

#### Microphone Not Working
- **Check Permissions**: Ensure microphone access is granted in browser
- **System Settings**: Verify microphone is enabled in system settings
- **Browser Support**: Use a modern browser with MediaRecorder API support

#### Transcription Errors
- **Audio Quality**: Ensure clear audio without background noise
- **Language Settings**: Verify correct language is selected
- **Network Connection**: Some transcription may require internet connectivity

#### Performance Issues
- **Memory Usage**: Long recordings consume more memory
- **Audio Visualizer**: Disable visualizer on slower systems
- **File Cleanup**: Temporary files are automatically cleaned up

### Debug Mode

Enable debug logging by opening browser developer tools and checking console output. Voice integration provides detailed logging for troubleshooting.

## Accessibility

### Keyboard Navigation
- All voice controls are keyboard accessible
- Tab navigation through voice interface elements
- ARIA labels for screen reader support

### Visual Accessibility
- High contrast mode support
- Reduced motion animations when preferred
- Clear visual indicators for recording states

### Audio Accessibility
- Visual feedback for audio cues
- Text-based status indicators
- No audio-only feedback

## Privacy & Security

### Data Handling
- **Local Processing**: Audio temporarily stored locally
- **Automatic Cleanup**: Audio files deleted after transcription
- **No Persistent Storage**: Voice data is not permanently stored
- **User Control**: Users control when recording starts and stops

### Network Usage
- **Minimal Data**: Only processed audio sent for transcription
- **Secure Transfer**: All data transferred over secure connections
- **No Cloud Storage**: Raw audio never stored in cloud services

## Performance Considerations

### Memory Usage
- Audio recording uses system memory for buffering
- Large recordings (>5 minutes) automatically stopped
- Memory cleanup after each transcription

### CPU Impact
- Audio visualization uses moderate CPU
- Transcription processing happens in background
- UI remains responsive during processing

### Storage
- Temporary files stored in system temp directory
- Files automatically cleaned up after use
- No permanent storage of audio data

## Future Enhancements

### Planned Features
- **Voice Commands**: Support for formatting commands ("bold", "italic")
- **Real-time Transcription**: Live transcription as you speak
- **Custom Vocabulary**: User-defined words and phrases
- **Noise Cancellation**: Enhanced audio processing
- **Multi-language**: Dynamic language switching

### Integration Roadmap
- **Collaboration**: Voice comments in collaborative editing
- **Templates**: Voice-activated text templates
- **Shortcuts**: Voice-triggered editor shortcuts
- **Export**: Voice annotations in exported documents

## Examples

### Basic Dictation Session

```javascript
// User speaks: "The sun was setting over the mountains, casting long shadows across the valley."
// Result: Clean, properly punctuated text inserted at cursor position
```

### Focus Mode Workflow

```javascript
// 1. Enter focus mode (F11)
// 2. Click floating voice button
// 3. Dictate entire paragraph
// 4. Continue typing without leaving focus mode
```

### Settings Customization

```javascript
// Voice settings stored in localStorage
{
  "autoInsert": true,
  "insertMode": "cursor",
  "language": "en-US",
  "showVisualizer": true,
  "autoSave": true
}
```

## API Reference

### VoiceEditorIntegration Class

```javascript
class VoiceEditorIntegration {
  // Initialize voice integration
  constructor()
  
  // Start recording
  async startRecording(context)
  
  // Stop recording and process
  async stopRecording()
  
  // Insert text at cursor
  insertTextAtCursor(text)
  
  // Show/hide voice controls
  toggleVoicePopup(type)
  
  // Settings management
  loadSettings()
  saveSettings()
}
```

### IPC Handlers

```javascript
// Save temporary audio file
ipcMain.handle('save-temp-audio', async (event, { audioData }) => {
  // Returns: { success: boolean, filePath: string }
})

// Transcribe audio file
ipcMain.handle('transcribe-audio', async (event, { audioPath, keepAudio }) => {
  // Returns: { success: boolean, text: string, raw: object }
})
```

## Contributing

### Development Setup

1. Install dependencies: `npm install`
2. Start development mode: `npm run gui-enhanced`
3. Open developer tools for debugging
4. Make changes to `/gui/assets/js/voice-editor-integration.js`

### Testing Voice Features

1. Run the demo: `node voice-editor-demo.js`
2. Test different browsers and operating systems
3. Verify microphone permissions and audio quality
4. Test various dictation scenarios and edge cases

### Code Style

- Follow existing JavaScript patterns in the project
- Use async/await for asynchronous operations
- Include error handling for all voice operations
- Add JSDoc comments for new methods

## License

This voice editor integration is part of the Writers CLI project and follows the same license terms as the main project.

---

**Note**: Voice dictation requires a modern browser with MediaRecorder API support and microphone access. The quality of transcription depends on audio quality, speaking clarity, and the underlying speech-to-text service.