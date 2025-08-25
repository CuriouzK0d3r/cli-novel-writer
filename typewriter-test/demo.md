# Typewriter Mode Demo

This is a demo file to test the typewriter mode with line dimming functionality.

## How It Works

When typewriter mode is enabled in the GUI editor, only the current line and one line before and after will remain fully visible. All other lines will be dimmed to help you focus on the immediate context of what you're writing.

## Test Lines

Line 1: This line should be dimmed when cursor is not nearby
Line 2: This line should be dimmed when cursor is not nearby
Line 3: This line should be dimmed when cursor is not nearby
Line 4: This line should be dimmed when cursor is not nearby
Line 5: This line should be dimmed when cursor is not nearby

**Current line area - place cursor here to test**

Line 7: This line should be dimmed when cursor is not nearby
Line 8: This line should be dimmed when cursor is not nearby
Line 9: This line should be dimmed when cursor is not nearby
Line 10: This line should be dimmed when cursor is not nearby
Line 11: This line should be dimmed when cursor is not nearby

## Testing Instructions

1. Open this file in the Writers CLI GUI editor
2. Click the "Typewriter: OFF" button to enable typewriter mode
3. You should see a toast message: "Typewriter mode enabled - lines dimmed except current ±1"
4. Place your cursor on different lines and observe the dimming effect
5. Try typing new content and see how the dimming follows your cursor
6. Test in both regular editor mode and focus mode

## Expected Behavior

- Only the current line (where cursor is) should be fully visible
- One line above and one line below should also be fully visible
- All other lines should be dimmed with reduced opacity and slight blur
- The dimming should update smoothly as you move the cursor
- The effect should work in both light and dark themes
- The effect should work in both normal editor and focus mode

## Additional Features

- The text remains fully editable even when dimmed
- Smooth transitions when moving between lines
- Consistent with the existing typewriter centering behavior
- No performance impact on typing or editing

## Dark Theme Testing

Switch to dark theme to test the different dimming styles applied for better contrast.

That's all! This demo file has enough content to thoroughly test the typewriter line dimming feature.