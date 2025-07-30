# Typewriter Mode

Typewriter mode is a writing feature that keeps your current line of text positioned at a consistent location on the screen as you type, similar to how a physical typewriter works where the paper moves up as you add new lines.

## What is Typewriter Mode?

When typewriter mode is enabled, the editor automatically scrolls the document to keep your cursor at approximately 2/3 down the screen (66% from the top). This creates a more comfortable writing experience by:

- Keeping your active writing line in a consistent, comfortable viewing position
- Reducing eye strain by maintaining optimal cursor placement
- Creating a focused writing environment similar to traditional typewriters
- Allowing you to concentrate on writing without manual scrolling

## How to Use Typewriter Mode

### Enabling/Disabling
- **Toggle**: Press `F9` to turn typewriter mode on or off
- **Status**: When active, "TYPEWRITER" appears in the status bar
- **Persistence**: The setting is saved to your project configuration

### Key Behaviors

**When Typing Forward (Adding New Content):**
- The cursor stays at the target line position (2/3 down the screen)
- Text above scrolls up automatically as you add new lines
- Provides smooth, continuous writing experience

**When Moving Cursor Manually:**
- Arrow key navigation works normally
- Typewriter mode doesn't interfere with deliberate cursor movement
- Only activates when you're actively typing new content

**Visual Feedback:**
- Status bar shows "TYPEWRITER" when mode is active
- Cursor position remains visually consistent
- No disruptive scrolling during active writing

## Configuration

### Default Position
The default cursor position is set to 66% down the screen (2/3 from top). This can be configured in the editor settings:

```javascript
config: {
  typewriterPosition: 0.66  // 0.0 = top, 1.0 = bottom
}
```

### Project Settings
Typewriter mode preference is automatically saved to your project's `writers.config.json`:

```json
{
  "settings": {
    "editor": {
      "typewriterMode": true
    }
  }
}
```

## Use Cases

### Perfect For:
- **Long writing sessions**: Maintains comfortable viewing position
- **First drafts**: Keeps focus on current content being written
- **Stream-of-consciousness writing**: Minimal interface distractions
- **Touch typists**: Consistent cursor position aids muscle memory

### Less Ideal For:
- **Heavy editing**: May prefer normal scrolling for jumping around document
- **Code editing**: Better suited for prose writing than structured text
- **Very short documents**: Benefit is minimal with small amounts of text

## Tips for Best Experience

1. **Combine with Distraction-Free Mode**: Press `F11` for full-screen writing
2. **Use Insert Mode**: Press `i` to enter insert mode for active writing
3. **Toggle as Needed**: Switch between modes based on whether you're writing or editing
4. **Adjust Terminal Size**: Larger terminal windows provide more context around cursor

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `F9` | Toggle typewriter mode on/off |
| `F11` | Toggle distraction-free mode |
| `i` | Enter insert mode (for writing) |
| `Escape` | Return to navigation mode |
| `Ctrl+W` | Show document statistics |

## Technical Details

- **Scroll Trigger**: Only scrolls when cursor moves down (new content)
- **Position Calculation**: Maintains cursor at `editorHeight * 0.66` lines from top
- **Smooth Operation**: Integrates with existing cursor movement and rendering
- **Mode Independence**: Works in both navigation and insert modes

## Troubleshooting

**Cursor doesn't stay centered:**
- Ensure you're in insert mode (`i`) when writing
- Typewriter mode only activates when adding new lines forward
- Manual cursor movement (arrow keys) temporarily overrides positioning

**Mode not persisting:**
- Check that you're in a Writers CLI project directory
- Ensure `writers.config.json` is writable
- Setting saves automatically when toggled

**Scrolling feels jumpy:**
- Try adjusting terminal size for smoother experience
- Consider using a terminal with better rendering performance

---

*Typewriter mode enhances the focused writing experience in Writers CLI, helping you maintain flow and concentration during creative sessions.*