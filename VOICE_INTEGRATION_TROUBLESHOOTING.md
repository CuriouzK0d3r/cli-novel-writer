# Voice Integration Troubleshooting Guide

## Common Issues and Solutions

### ❌ "Failed to process recording: Transcription service not available"

This error occurs when the voice transcription service cannot be accessed. Here are the solutions:

#### Solution 1: Use Enhanced GUI Mode
The voice integration requires the enhanced GUI. Make sure you're using:
```bash
npm run gui-enhanced
```
**NOT** `npm run gui` or `npm run gui-classic`

#### Solution 2: Check Electron Context
If you're still getting the error:

1. **Close the application completely**
2. **Restart using enhanced mode**:
   ```bash
   npm run gui-enhanced
   ```
3. **Wait for full initialization** - don't try voice immediately
4. **Check console** for initialization messages

#### Solution 3: Verify Voice Service Initialization
Open the browser developer tools (F12) and look for:
```
Voice transcription handlers initialized
Voice Editor Integration initialized successfully
```

If you see errors, restart the application.

#### Solution 4: Manual Voice Service Check
In the developer console, test the voice service:
```javascript
// Test if ipcRenderer is available
console.log(window.require ? 'Electron available' : 'Electron NOT available');

// Test voice initialization
const { ipcRenderer } = window.require('electron');
ipcRenderer.invoke('voice-initialize').then(console.log);
```

### ❌ "Microphone permission denied"

#### Solution 1: Browser Permissions
1. **Look for microphone icon** in browser address bar
2. **Click the icon** and select "Allow"
3. **Refresh the page** if needed
4. **Try voice recording again**

#### Solution 2: System Permissions (macOS)
1. **System Preferences** → **Security & Privacy** → **Privacy**
2. **Select Microphone** from left sidebar
3. **Check the box** next to your browser or Electron app
4. **Restart the application**

#### Solution 3: System Permissions (Windows)
1. **Settings** → **Privacy** → **Microphone**
2. **Turn on microphone access** for this device
3. **Allow apps to access microphone**
4. **Restart the application**

### ❌ "No microphone found"

#### Solution 1: Hardware Check
1. **Verify microphone is connected** and working
2. **Test in other applications** (System preferences, other apps)
3. **Try a different microphone** if available
4. **Check USB connections** for external microphones

#### Solution 2: Browser/System Recognition
1. **Close the application**
2. **Connect microphone** before starting
3. **Test microphone** in system settings
4. **Restart application**: `npm run gui-enhanced`

### ❌ "Voice button missing or not working"

#### Solution 1: Check Enhanced Mode
Only the enhanced GUI has voice integration:
```bash
# Correct way to start
npm run gui-enhanced

# These won't have voice integration
npm run gui          # ❌
npm run gui-classic  # ❌
```

#### Solution 2: Verify File Loading
Check browser developer console for JavaScript errors:
1. **Open DevTools** (F12)
2. **Look for errors** in Console tab
3. **Check if voice-editor-integration.js loaded**
4. **Refresh page** if there are loading errors

#### Solution 3: HTML Integration Check
The voice button appears in the editor toolbar. To see it:
1. **Open any file for editing** (not just project view)
2. **Look for 🎤 Voice button** in toolbar
3. **Try keyboard shortcut**: `Ctrl+Shift+V`

### ❌ "Recording works but no text appears"

#### Solution 1: Check Audio Quality
- **Speak clearly** and close to microphone
- **Reduce background noise**
- **Speak at normal pace** (not too fast/slow)
- **Ensure microphone isn't muted**

#### Solution 2: Language Settings
1. **Click gear icon** in voice popup
2. **Check language setting** matches your speech
3. **Try changing language** and test again

#### Solution 3: Recording Duration
- **Record for at least 2-3 seconds**
- **Don't record for too long** (max 5 minutes)
- **Check if timer is counting** during recording

### ❌ "Voice visualizer not showing"

#### Solution 1: Enable in Settings
1. **Click voice button** 🎤
2. **Click gear icon** for settings
3. **Enable "Show audio visualizer"**
4. **Try recording again**

#### Solution 2: Browser Support
Some browsers may not support audio visualization:
- **Try Chrome/Chromium** for best support
- **Update your browser** to latest version
- **Check developer console** for WebAudio errors

### ❌ "Auto-save not working after voice insertion"

#### Solution 1: Enable Auto-save
1. **Open voice settings** (gear icon)
2. **Enable "Auto-save after insertion"**
3. **Test voice insertion again**

#### Solution 2: Manual Save
After voice insertion:
- **Click Save button** in editor
- **Use Ctrl+S** keyboard shortcut
- **Check file modification time**

## Diagnostic Commands

### Test Voice Integration Status
```bash
# Run comprehensive test
npm run test:voice-editor

# Run voice demo
npm run demo:voice-editor
```

### Check File Structure
Ensure all required files exist:
```bash
ls -la gui/assets/js/voice-editor-integration.js
ls -la gui/assets/css/voice-editor-integration.css
ls -la src/voice/electron-handlers.js
```

### Browser Console Diagnostics
In browser DevTools Console:
```javascript
// Check if voice integration loaded
console.log(typeof VoiceEditorIntegration);

// Check if global voice instance exists  
console.log(window.voiceEditor);

// Test microphone access
navigator.mediaDevices.getUserMedia({audio: true})
  .then(() => console.log('Microphone OK'))
  .catch(console.error);
```

## System Requirements

### Minimum Requirements
- **Node.js**: 14.0 or later
- **Modern Browser**: Chrome 60+, Firefox 55+, Safari 11+
- **Operating System**: Windows 10, macOS 10.14+, or Linux
- **Microphone**: Any working microphone (built-in or external)
- **Memory**: 4GB RAM minimum (8GB recommended)

### Recommended Setup
- **Microphone**: External USB microphone for best quality
- **Environment**: Quiet room with minimal background noise
- **Browser**: Latest Chrome or Chromium for full feature support
- **Audio**: Test microphone in system settings before using

## Getting Help

### Before Reporting Issues

1. **Run the test suite**: `npm run test:voice-editor`
2. **Try the demo**: `npm run demo:voice-editor`  
3. **Check browser console** for error messages
4. **Verify you're using enhanced GUI**: `npm run gui-enhanced`
5. **Test microphone in other apps**

### Debug Information to Collect

When reporting issues, include:
- **Operating system and version**
- **Browser name and version** 
- **Node.js version**: `node --version`
- **Error messages** from browser console
- **Steps to reproduce** the issue
- **Audio setup** (built-in vs external microphone)

### Console Log Collection

To collect detailed logs:
1. **Open DevTools** (F12)
2. **Go to Console tab**
3. **Clear console** (🗑️ icon)
4. **Reproduce the issue**
5. **Copy all console output**

## Performance Optimization

### Improve Transcription Speed
- **Use shorter recordings** (30 seconds or less)
- **Speak clearly** without long pauses
- **Close other applications** using microphone
- **Ensure stable internet** connection

### Reduce Memory Usage
- **Disable audio visualizer** if not needed
- **Close voice popup** when not using
- **Restart app** after extended voice sessions

### Better Audio Quality
- **Use external microphone** when possible
- **Position microphone** 6-12 inches from mouth
- **Reduce background noise** (close windows, turn off fans)
- **Speak at consistent volume**

---

**Still having issues?** Check the main documentation in `VOICE_EDITOR_INTEGRATION.md` or run `npm run test:voice-editor` for a full system check.