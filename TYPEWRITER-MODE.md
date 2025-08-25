# Typewriter Mode Documentation

Typewriter mode is a focus-enhancing feature in the Writers CLI GUI that keeps your current line of text centered in the editor view. This creates a distraction-free writing experience similar to classic typewriters, where the paper moves up as you write, keeping your typing position consistent.

## What is Typewriter Mode?

Typewriter mode automatically scrolls the editor so that the line you're currently writing on remains vertically centered in the editor window. Additionally, it dims all lines except the current line and one line before/after to help you focus on the immediate context. As you type, move your cursor, or navigate through your document, the view adjusts to keep the active line in the center of your screen with proper focus highlighting.

## Benefits

- **Enhanced Focus**: Keep your attention on the current line with automatic line dimming that reduces visual distractions
- **Contextual Awareness**: Only the current line and one line before/after remain fully visible, providing just enough context
- **Reduced Eye Strain**: No need to track your cursor position across different parts of the screen
- **Consistent Writing Position**: Your writing area stays in the same visual location
- **Immersive Experience**: Creates a more natural, typewriter-like writing flow with focus-driven dimming

## How to Enable/Disable Typewriter Mode

### Using the Editor Interface

1. Open any file in the Writers CLI GUI editor
2. Look for the "Typewriter: OFF" button in the editor toolbar
3. Click the button to toggle typewriter mode on/off
4. When enabled, the button shows "Typewriter: ON" with a highlighted appearance
5. A "TYPEWRITER" indicator will appear in the editor status bar

### Visual Indicators

When typewriter mode is active, you'll see:
- **Toolbar Button**: Shows "Typewriter: ON" with primary color highlighting
- **Status Indicator**: A centered align icon with "TYPEWRITER" text in the editor info bar
- **Enhanced Padding**: The editor adds extra padding at the top and bottom for proper centering
- **Smooth Scrolling**: The editor scrolls smoothly to center your current line
- **Line Dimming**: All lines except the current line ±1 are dimmed with reduced opacity and subtle blur
- **Toast Notification**: "Typewriter mode enabled - lines dimmed except current ±1"

## How It Works

Typewriter mode works by:

1. **Monitoring Cursor Position**: Tracks where your text cursor is located
2. **Calculating Line Position**: Determines which line contains your cursor
3. **Auto-Scrolling**: Adjusts the editor's scroll position to center that line
4. **Line Dimming**: Creates an overlay that dims lines outside the focus range (current ±1 line)
5. **Real-time Updates**: Updates both scrolling and dimming as you type, click, or use keyboard navigation
6. **Visual Focus**: Maintains smooth transitions between focused and dimmed states

## Technical Details

### Triggering Events

Typewriter mode activates on:
- **Typing**: As you add or delete text
- **Cursor Movement**: When you click or use arrow keys to move
- **Line Changes**: When you press Enter to create new lines

### Line Dimming System

The line dimming feature uses an overlay approach:
- **Overlay Layer**: A transparent div positioned over the textarea
- **Focus Range**: Current line plus one line before and after (±1) remain fully visible
- **Dimming Effect**: Other lines get 20-25% opacity with subtle blur effect
- **Theme Adaptation**: Different dimming intensities for light and dark themes
- **Performance**: Optimized updates that don't interfere with typing performance

### Scroll Calculation

The feature calculates the optimal scroll position by:
- Measuring line height based on font size and line-height CSS properties
- Counting lines from the beginning of the document to your cursor
- Computing the pixel position of your current line
- Centering that position within the visible editor area

### Performance Considerations

- **Debounced Updates**: Scroll updates are debounced to prevent excessive calculations
- **Smooth Scrolling**: Uses optimized scrolling for better visual experience
- **Bounds Checking**: Ensures scrolling stays within document limits

## Compatibility

### Works With

- ✅ **Vim Mode**: Fully compatible with both Normal and Insert modes
- ✅ **Auto-save**: Does not interfere with automatic saving
- ✅ **Word Count**: Statistics continue to update normally
- ✅ **All Themes**: Works with light, dark, and custom themes
- ✅ **All File Types**: Supports markdown and other text files

### Browser Support

- ✅ **Chrome/Chromium**: Full support
- ✅ **Firefox**: Full support  
- ✅ **Safari**: Full support
- ✅ **Edge**: Full support

## Usage Tips

### Best Practices

1. **Enable for Long Documents**: Most beneficial when working with documents longer than a screen
2. **Combine with Vim Mode**: Use with Vim keybindings for a powerful writing setup
3. **Use with Focus Mode**: Consider dimming other UI elements for maximum focus
4. **Adjust Font Size**: Larger fonts work particularly well with typewriter mode

### When to Use

**Ideal for:**
- Long-form writing (novels, articles, essays)
- First drafts where focus is critical
- Editing sessions requiring line-by-line attention
- Creative writing sessions

**Consider Disabling for:**
- Quick edits or small changes
- Document structure work (reorganizing sections)
- Copy-paste heavy tasks
- When you need to see more context

## Troubleshooting

### Common Issues

**Problem**: Scrolling feels too aggressive or jumpy
**Solution**: The feature includes debouncing, but you can disable and re-enable if needed

**Problem**: Typewriter mode doesn't center properly
**Solution**: Ensure your browser zoom is at 100% for best results

**Problem**: Mode doesn't activate
**Solution**: Make sure you've clicked in the text area after enabling the feature

### Known Limitations

- May not work perfectly with extremely long lines that wrap
- Optimal experience requires documents with regular line breaks
- Very small editor windows may not provide ideal centering
- Line dimming overlay requires modern browser support for CSS overlays
- Best visual experience achieved with documents that have regular paragraph breaks

## Keyboard Shortcuts

Currently, typewriter mode can only be toggled via the toolbar button. Future versions may include:
- `Ctrl/Cmd + T`: Toggle typewriter mode
- Integration with Vim command mode
- Customizable focus range (±2, ±3 lines instead of just ±1)

## Configuration

Typewriter mode currently uses these default settings:
- **Debounce Delay**: 10ms for responsive scrolling
- **Scroll Behavior**: Smooth scrolling enabled
- **Padding**: 50vh top and bottom padding when active
- **Focus Range**: ±1 line (current line plus one before and after)
- **Dimming Opacity**: 20% for light theme, 25% for dark theme
- **Transition Speed**: 0.3s for smooth opacity changes

Future versions may include customizable settings for these parameters.

## Integration with Other Features

### Vim Mode Integration

When both typewriter mode and Vim mode are enabled:
- Typewriter mode respects Vim navigation commands
- Scrolling updates when moving with `h`, `j`, `k`, `l` keys
- Works in both Normal and Insert modes
- Mode switching doesn't affect typewriter functionality

### Statistics Integration

Typewriter mode works seamlessly with:
- Real-time word counting
- Reading time estimation  
- Character counting
- Line counting

## Future Enhancements

Planned improvements include:
- **Customizable Focus Range**: Choose how many lines before/after to keep visible (±1, ±2, ±3)
- **Customizable Center Position**: Choose where the active line appears (top third, center, etc.)
- **Focus Line Highlighting**: Subtle highlighting of the current line
- **Keyboard Shortcuts**: Quick toggle options
- **Smart Centering**: Better handling of wrapped lines and code blocks
- **Configuration Options**: User-customizable scroll behavior, timing, and dimming intensity
- **Advanced Dimming**: Gradient dimming effects and paragraph-aware dimming

---

For questions, issues, or feature requests related to typewriter mode, please refer to the main Writers CLI documentation or submit an issue in the project repository.