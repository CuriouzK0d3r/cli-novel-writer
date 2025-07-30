# Cursor Modes in Writers Editor

The Writers Editor features modal editing with different cursor styles to indicate the current mode.

## Cursor Styles

### Navigation Mode (NAV)
- **Cursor Style**: Block cursor (solid rectangle)
- **Behavior**: The cursor appears as an inverted character block
- **Purpose**: Used for navigation and text manipulation commands
- **Status Bar**: Shows "NAV" in the mode indicator

### Insert Mode (INS)
- **Cursor Style**: Line cursor (vertical bar)
- **Behavior**: The cursor appears as a thin vertical line `|`
- **Purpose**: Used for typing and inserting new text
- **Status Bar**: Shows "INS" in the mode indicator

## Mode Switching

### Entering Insert Mode
- **Key**: `i` (when in navigation mode)
- **Effect**: 
  - Cursor changes from block to line
  - Status bar shows "INS"
  - Ready to type and insert text

### Returning to Navigation Mode
- **Key**: `Escape` (when in insert mode)
- **Effect**:
  - Cursor changes from line to block
  - Status bar shows "NAV"
  - Ready for navigation commands

## Visual Indicators

### Status Bar
The status bar at the bottom of the editor displays the current mode:
```
filename.md* | Mode: NAV | Words: 1,247 | Reading: 6m 14s | Line: 42, Col: 15
filename.md* | Mode: INS | Words: 1,247 | Reading: 6m 14s | Line: 42, Col: 15
```

### Cursor Blinking
- Both cursor styles blink at the same interval (530ms)
- Blinking helps maintain cursor visibility
- Blinking resets when moving the cursor or changing modes

## Implementation Details

### Block Cursor (Navigation Mode)
- Inverts the character at the cursor position
- If at end of line, shows an inverted space character
- Maintains character visibility while clearly indicating position

### Line Cursor (Insert Mode)
- Shows a vertical bar `|` at the insertion point
- Does not obscure existing characters
- Indicates where new text will be inserted

## Benefits

### Visual Clarity
- Immediately clear which mode you're in
- No need to check status bar constantly
- Intuitive cursor behavior matches expectation

### Productivity
- Reduces mode confusion
- Faster context switching
- Better muscle memory development

## Testing the Feature

To test the cursor mode changes:

1. Launch the editor: `node test-cursor-modes.js`
2. Observe the initial block cursor (navigation mode)
3. Press `i` to enter insert mode - cursor becomes a line
4. Press `Escape` to return to navigation mode - cursor becomes a block
5. Watch the status bar mode indicator change accordingly

## Compatibility

- Works with all terminal types that support inverse colors
- Compatible with both light and dark terminal themes
- Scales properly with different terminal sizes
- Maintains visibility in distraction-free mode