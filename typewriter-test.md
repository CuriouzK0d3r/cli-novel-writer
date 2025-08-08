# Typewriter Mode Test Document

This is a test document to verify that typewriter mode is working correctly in the Writers CLI GUI editor.

## Introduction

Typewriter mode is a writing feature that keeps the current line centered in the editor view as you type. This helps maintain focus on the current line of text and provides a distraction-free writing experience.

## Test Instructions

1. Open this document in the Writers CLI GUI editor
2. Enable typewriter mode by clicking the "Typewriter: OFF" button in the editor toolbar
3. Click anywhere in this document to position your cursor
4. Type or navigate using arrow keys
5. The current line should stay centered in the editor view

## Sample Content for Testing

Here are multiple lines of text to test typewriter mode scrolling behavior:

Line 1: This is the first line of test content.
Line 2: This is the second line of test content.
Line 3: This is the third line of test content.
Line 4: This is the fourth line of test content.
Line 5: This is the fifth line of test content.
Line 6: This is the sixth line of test content.
Line 7: This is the seventh line of test content.
Line 8: This is the eighth line of test content.
Line 9: This is the ninth line of test content.
Line 10: This is the tenth line of test content.

## More Content

Add more lines here to test scrolling behavior...

Line 11: Additional content for scrolling tests.
Line 12: Additional content for scrolling tests.
Line 13: Additional content for scrolling tests.
Line 14: Additional content for scrolling tests.
Line 15: Additional content for scrolling tests.
Line 16: Additional content for scrolling tests.
Line 17: Additional content for scrolling tests.
Line 18: Additional content for scrolling tests.
Line 19: Additional content for scrolling tests.
Line 20: Additional content for scrolling tests.

## Even More Content

Line 21: More test content to ensure proper scrolling.
Line 22: More test content to ensure proper scrolling.
Line 23: More test content to ensure proper scrolling.
Line 24: More test content to ensure proper scrolling.
Line 25: More test content to ensure proper scrolling.
Line 26: More test content to ensure proper scrolling.
Line 27: More test content to ensure proper scrolling.
Line 28: More test content to ensure proper scrolling.
Line 29: More test content to ensure proper scrolling.
Line 30: More test content to ensure proper scrolling.

## Final Section

This is the final section with more content to test typewriter mode behavior at the end of the document.

Line 31: Final test line.
Line 32: Final test line.
Line 33: Final test line.
Line 34: Final test line.
Line 35: Final test line.
Line 36: Final test line.
Line 37: Final test line.
Line 38: Final test line.
Line 39: Final test line.
Line 40: This is the last line for testing typewriter mode.

## Expected Behavior

When typewriter mode is enabled:
- The current line should remain centered vertically in the editor
- As you move your cursor up or down, the view should scroll to keep the current line centered
- The scrolling should be smooth and responsive
- The typewriter indicator should be visible in the editor info bar

Test by placing your cursor on different lines and observing the centering behavior.

## Troubleshooting Typewriter Mode

If typewriter mode is not working correctly (e.g., scrolling in the wrong direction), try these steps:

### Debug Steps
1. Open the browser's Developer Tools (F12)
2. Go to the Console tab
3. Enable typewriter mode in the editor
4. Type `debugTypewriter()` in the console and press Enter
5. This will show detailed information about the current state

### Common Issues
- **Scrolling in opposite direction**: This was a bug in the scroll calculation that has been fixed
- **Not centering properly**: Make sure your browser zoom is at 100%
- **Jumpy scrolling**: The system now uses smooth scrolling to improve the experience

### Debug Information
When typewriter mode is enabled, debug information will be logged to the console showing:
- Current cursor position
- Number of lines before cursor
- Calculated scroll positions
- Padding and height values

Use this information to verify that the calculations are working correctly.