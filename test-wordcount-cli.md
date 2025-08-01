# CLI Word Count Dialog Test

This is a test file to verify the word count dialog functionality in the CLI editor.

## Test Content

This file contains various types of content to test the word count statistics:

### Sample Text

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

### Multiple Paragraphs

This is paragraph one with some text content.

This is paragraph two with different content.

This is paragraph three with even more content to test paragraph counting.

### Testing Instructions

1. Open this file with: `writers edit test-wordcount-cli.md`
2. Press **Ctrl+W** to open the word count dialog
3. Verify the statistics are displayed correctly:
   - Words: should be around 150-200 words
   - Characters: should include spaces and punctuation
   - Lines: should count all lines including empty ones
   - Paragraphs: should count text blocks separated by blank lines
   - Reading time: should be estimated based on word count
   - Current position: should show your cursor location

### Expected Behavior

- Dialog should open when pressing Ctrl+W
- Statistics should be accurate
- Dialog should auto-close after 5 seconds
- Dialog should close immediately when pressing any key
- Focus should return to editor after closing

### Troubleshooting

If the dialog doesn't close:
- Try pressing Escape, Enter, or Space
- The dialog has a 5-second auto-close timeout
- Check the terminal for any error messages

This test file helps verify that the word count dialog fix is working correctly.