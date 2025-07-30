# Typewriter Mode

Typewriter mode is a writing feature that keeps your current line of text positioned at a consistent location on the screen as you type, similar to how a physical typewriter works where the paper moves up as you add new lines. It also creates a focused writing environment by dimming all text except for the current line and a few surrounding lines.

## What is Typewriter Mode?

When typewriter mode is enabled, the editor automatically scrolls the document to keep your cursor at approximately 2/3 down the screen (66% from the top). Additionally, it creates a focused writing environment by showing only the current line and 1 line before/after it clearly, while dimming all other text. This creates a more comfortable writing experience by:

- Keeping your active writing line in a consistent, comfortable viewing position
- Reducing eye strain by maintaining optimal cursor placement
- Creating a focused writing environment that highlights only relevant text
- Dimming distracting content above and below the focus area
- Allowing you to concentrate on writing without manual scrolling
- Providing a distraction-free zone around your current work

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
- Current line and 1 line before/after appear in normal brightness
- All other lines appear dimmed (dark gray) to reduce distraction
- Focus window moves smoothly as you navigate or type
- No disruptive scrolling during active writing

## Configuration

### Default Position
The default cursor position is set to 66% down the screen (2/3 from top). This can be configured in the editor settings:

```javascript
config: {
  typewriterPosition: 0.66,  // 0.0 = top, 1.0 = bottom
  typewriterFocusLines: 1    // Number of lines before/after cursor to keep in focus
}
```

### Focus Window
By default, typewriter mode shows the current line plus 1 line before and after it clearly, while dimming all other content. This creates a 3-line focus window (current + 1 above + 1 below) that moves with your cursor.

### Project Settings
Typewriter mode preferences are automatically saved to your project's `writers.config.json`:

```json
{
  "settings": {
    "editor": {
      "typewriterMode": true,
      "typewriterFocusLines": 1
    }
  }
}
```

## Use Cases

### Perfect For:
- **Long writing sessions**: Maintains comfortable viewing position with reduced distractions
- **First drafts**: Keeps focus on current content being written while hiding completed text
- **Stream-of-consciousness writing**: Minimal interface distractions with dimmed surroundings
- **Touch typists**: Consistent cursor position aids muscle memory
- **Editing and revision**: Focus window helps concentrate on specific sections
- **Distraction-prone writers**: Dimmed text reduces visual noise

### Less Ideal For:
- **Heavy editing**: May prefer normal scrolling for jumping around document
- **Code editing**: Better suited for prose writing than structured text
- **Very short documents**: Benefit is minimal with small amounts of text

## Tips for Best Experience

1. **Combine with Distraction-Free Mode**: Press `F11` for full-screen writing
2. **Use Insert Mode**: Press `i` to enter insert mode for active writing
3. **Toggle as Needed**: Switch between modes based on whether you're writing or editing
4. **Adjust Terminal Size**: Larger terminal windows provide more context around cursor
5. **Navigate to Review**: Use arrow keys to move through dimmed sections when reviewing
6. **Focus Window Movement**: The 3-line focus area automatically follows your cursor
7. **Visual Comfort**: Adjust terminal contrast if dimmed text is too faint or bright

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
- **Focus Window**: Shows current line ± 1 line clearly (configurable)
- **Dimming Effect**: Uses dark gray color codes to significantly reduce brightness of non-focus lines
- **Cursor Visibility**: Cursor remains fully visible even in dimmed areas
- **Smooth Operation**: Integrates with existing cursor movement and rendering
- **Mode Independence**: Works in both navigation and insert modes
- **Dynamic Updates**: Focus window updates in real-time as cursor moves

## Troubleshooting

**Cursor doesn't stay centered:**
- Ensure you're in insert mode (`i`) when writing
- Typewriter mode only activates when adding new lines forward
- Manual cursor movement (arrow keys) temporarily overrides positioning

**Dimming not visible or too faint:**
- Check terminal color support and contrast settings
- Some terminals may not display gray text clearly
- Adjust terminal theme for better visibility of dimmed text

**Focus window not moving:**
- Focus window follows cursor automatically
- Try moving cursor with arrow keys to see effect
- Toggle typewriter mode off and on to reset

**Mode not persisting:**
- Check that you're in a Writers CLI project directory
- Ensure `writers.config.json` is writable
- Setting saves automatically when toggled

**Scrolling feels jumpy:**
- Try adjusting terminal size for smoother experience
- Consider using a terminal with better rendering performance

---

*Typewriter mode enhances the focused writing experience in Writers CLI, helping you maintain flow and concentration during creative sessions. The focused window with heavily dimmed surroundings creates a distraction-free environment that naturally guides your attention to the most relevant content.*