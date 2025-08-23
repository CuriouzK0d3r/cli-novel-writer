# Voice Integration Error Solutions

## 🔧 Quick Fix for "Transcription service not available"

If you're seeing this error, follow these steps in order:

### Step 1: Use the Correct Launch Command
```bash
# ✅ CORRECT - Use enhanced GUI
npm run gui-enhanced

# ❌ WRONG - These won't work for voice
npm run gui
npm run gui-classic
electron gui/main.js
```

### Step 2: Wait for Full Initialization
After launching, wait 3-5 seconds before trying voice features. Look for these console messages:
- "Voice transcription handlers initialized"
- "Voice Editor Integration initialized successfully"

### Step 3: Test the Voice Integration
```bash
# Run the diagnostic tool
npm run doctor:voice --fix

# Or run the full test
npm run test:voice-editor
```

### Step 4: Manual Verification
1. Open the GUI with `npm run gui-enhanced`
2. Open any file for editing
3. Look for the 🎤 Voice button in the toolbar
4. Click it or press `Ctrl+Shift+V`
5. If you see a popup with recording controls, the integration is working

## 🚨 Common Causes and Solutions

### Cause 1: Using Wrong GUI Mode
**Error**: "Transcription service not available"
**Solution**: Always use `npm run gui-enhanced`, not the regular GUI

### Cause 2: IPC Communication Failed
**Error**: "Electron IPC not available"
**Solution**: 
1. Completely close the application
2. Restart with `npm run gui-enhanced`
3. Check browser console for errors

### Cause 3: Voice Service Not Initialized
**Error**: "Voice service failed to initialize"
**Solution**:
1. Check that src/voice/electron-handlers.js exists
2. Verify Node.js permissions for audio processing
3. Restart the application

### Cause 4: Browser Context Issues
**Error**: "window.require is not a function"
**Solution**:
1. Ensure you're using the desktop app (not a web browser)
2. Check that nodeIntegration is enabled in main.js
3. Verify contextIsolation is disabled

## 🩺 Diagnostic Commands

### Quick Health Check
```bash
npm run doctor:voice --fix
```

### Full Diagnosis
```bash
npm run doctor:voice
```

### Integration Test
```bash
npm run test:voice-editor
```

### Interactive Demo
```bash
npm run demo:voice-editor
```

## 🛠️ Advanced Troubleshooting

### Check Electron Configuration
The main.js file should have:
```javascript
webPreferences: {
  nodeIntegration: true,
  contextIsolation: false,
  enableRemoteModule: true,
}
```

### Verify File Structure
Required files must exist:
- `gui/assets/js/voice-editor-integration.js`
- `gui/assets/css/voice-editor-integration.css`
- `src/voice/electron-handlers.js`
- `gui/main-enhanced.js`

### Test IPC Communication
In browser DevTools Console:
```javascript
// Test if Electron is available
console.log(window.require ? 'Electron OK' : 'Electron MISSING');

// Test voice initialization
const { ipcRenderer } = window.require('electron');
ipcRenderer.invoke('voice-initialize').then(console.log).catch(console.error);
```

## 🎯 Specific Error Messages

### "Failed to process recording: Transcription service not available"
- **Cause**: Voice service can't be accessed
- **Fix**: Use `npm run gui-enhanced` and wait for initialization

### "Electron IPC not available - please use the desktop app"
- **Cause**: Running in web browser instead of Electron
- **Fix**: Use `npm run gui-enhanced`, not opening HTML directly

### "Voice service failed to initialize"
- **Cause**: Backend voice handlers not loaded
- **Fix**: Check src/voice/electron-handlers.js and restart app

### "Microphone permission denied"
- **Cause**: Browser/system permissions
- **Fix**: Allow microphone access in browser and system settings

### "No speech detected in recording"
- **Cause**: Audio quality or volume issues
- **Fix**: Speak clearly, check microphone, reduce background noise

## 📋 Pre-Flight Checklist

Before using voice integration, verify:

- [ ] Using `npm run gui-enhanced` command
- [ ] All required files exist (`npm run test:voice-editor`)
- [ ] Microphone is connected and working
- [ ] Browser/system permissions granted
- [ ] No JavaScript errors in console
- [ ] Voice button 🎤 appears in editor toolbar

## 🚑 Emergency Reset

If nothing works, try this complete reset:

1. **Close all instances** of the application
2. **Clear browser cache** (if using Electron with cache)
3. **Restart your computer** (to clear audio device locks)
4. **Run diagnostic**: `npm run doctor:voice`
5. **Launch fresh**: `npm run gui-enhanced`
6. **Test immediately**: Open file → Click 🎤 → Try recording

## 📞 Getting Help

Still having issues? Collect this information:

### System Info
```bash
node --version
npm --version
echo $SHELL
uname -a  # (on Unix systems)
```

### Error Logs
1. Open DevTools (F12)
2. Go to Console tab
3. Clear console
4. Reproduce the error
5. Copy all red error messages

### Test Results
```bash
npm run test:voice-editor > voice-test-results.txt
npm run doctor:voice > voice-diagnosis.txt
```

## 🎉 Success Indicators

You'll know voice integration is working when:

- ✅ 🎤 Voice button appears in editor toolbar
- ✅ Keyboard shortcut `Ctrl+Shift+V` opens voice popup
- ✅ Recording button shows audio visualizer
- ✅ Speaking produces transcribed text
- ✅ Text inserts at cursor position
- ✅ No error messages in console

---

**Need immediate help?** Run `npm run doctor:voice --fix` for automated diagnostics and fixes.