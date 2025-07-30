# Writers Editor Quick Start Guide

## Getting Started

The Writers CLI includes a built-in terminal-based text editor designed specifically for writers. Here's how to use it effectively:

### Launching the Editor

```bash
# Edit a specific file
writers edit chapter1
writers edit "My Character Name"

# Choose from existing files
writers edit

# Alternative: use write command and select built-in editor
writers write
```

## Basic Text Editing

The editor uses the `blessed` library which provides a terminal-based interface. Here's what you need to know:

### Text Input
- **Normal typing works** - just start typing to add text
- **Enter key** creates new lines
- **Arrow keys** move the cursor around
- **Backspace/Delete** work as expected
- **Page Up/Down** scroll through the document

### Essential Keyboard Shortcuts

| Key Combination | Action |
|----------------|--------|
| `Ctrl+S` | Save file |
| `Ctrl+O` | Open file |
| `Ctrl+X` | Exit editor |
| `Ctrl+F` | Find text |
| `Ctrl+R` | Find and replace |
| `Ctrl+W` | Show word count statistics |
| `F1` | Show help |
| `F9` | Toggle typewriter mode |
| `F11` | Toggle distraction-free mode |

## Getting Text Into the Editor

### Method 1: Open Existing Files
1. Press `Ctrl+O`
2. Type the file path
3. Press Enter

### Method 2: Copy-Paste from External Source
1. Copy text from another application
2. In the editor, right-click and paste (or use terminal paste shortcut)
3. Most terminals support `Ctrl+Shift+V` for pasting

### Method 3: Start with Project Files
```bash
# Create a new chapter first
writers new chapter "My New Chapter"

# Then edit it
writers edit "My New Chapter"
```

## Editing Tips

### For Better Text Editing Experience:

1. **Use a good terminal**:
   - On macOS: iTerm2 or Terminal.app
   - On Linux: GNOME Terminal, Konsole, or Alacritty
   - On Windows: Windows Terminal or WSL

2. **Enable mouse support** (if your terminal supports it):
   - Most modern terminals allow clicking to position cursor
   - Scroll wheel works for scrolling

3. **Terminal Settings**:
   - Increase font size for better readability
   - Use a monospace font you're comfortable with
   - Set up good color scheme

### Writing Workflow:

1. **Start writing immediately** - the editor autosaves every 30 seconds
2. **Use Ctrl+W** regularly to check your progress
3. **Press F11** for distraction-free writing mode
4. **Save manually** with Ctrl+S for important milestones

## Features Designed for Writers

### Real-time Statistics
- Word count updates as you type
- Reading time estimation
- Character count (with and without spaces)
- Line and paragraph counts

### Typewriter Mode (F9)
- Keeps cursor centered while writing
- Automatically scrolls text up as you type
- Creates focused writing experience
- Perfect for long writing sessions

### Distraction-Free Mode (F11)
- Hides all interface elements
- Full-screen text editing
- Perfect for focused writing sessions

### Auto-save
- Saves your work every 30 seconds
- Creates backups before editing sessions
- Prevents work loss from unexpected exits

### Find and Replace (Ctrl+F / Ctrl+R)
- Search for specific text
- Replace words or phrases globally
- Case-insensitive search

## Troubleshooting

### "Can't type in the editor"
1. Make sure the editor window is focused (click in it)
2. Try pressing `Tab` to ensure focus is on the text area
3. Check if your terminal supports the blessed library properly

### "Text looks weird"
1. Make sure your terminal supports UTF-8 encoding
2. Try resizing the terminal window
3. Check terminal compatibility with blessed.js

### "Editor crashes or freezes"
1. Try using a different terminal application
2. Make sure you have the latest version of Node.js
3. Check that the blessed dependency is properly installed

### "Can't see cursor"
1. Some terminals don't show the cursor properly
2. The cursor position is tracked internally
3. Use arrow keys and text input will appear at the correct location

## Navigation Modes

The editor supports multiple navigation styles to suit different preferences:

### Navigation Mode
- **Arrow Keys**: Standard up/down/left/right navigation
- **Vim Style**: h/j/k/l for left/down/up/right
- **WASD Style**: w/a/s/d for up/left/down/right
- **Extended**: Home/End, Page Up/Down, Ctrl+Arrow for word movement

### Insert Mode
- **Arrow Keys**: Move cursor while editing
- **Standard Keys**: Home/End, Page Up/Down
- **Word Navigation**: Ctrl+Left/Right for word jumping

## Alternative Editors

If the built-in editor doesn't work well in your environment, you can still use external editors:

```bash
# Use external editors
writers write chapter1 --editor nano
writers write chapter1 --editor vim
writers write chapter1 --editor code  # VS Code
```

## Best Practices

1. **Keep sessions manageable** - don't edit extremely large files (>50KB) in the terminal editor
2. **Use regular saves** - Press Ctrl+S frequently, don't rely only on auto-save
3. **Test your setup** - Try the demo first: `npm run demo-editor`
4. **Have a backup plan** - Know how to use at least one external editor as fallback

## Getting Help

- **In-editor**: Press `F1` for comprehensive help
- **Command line**: `writers edit --help`
- **Documentation**: Check the main README and editor documentation

Remember: The terminal editor is designed for focused writing. If you need advanced formatting, consider using the export features to generate HTML or other formats after writing your content.