# Copy/Paste Test Document

This document is designed to test the enhanced copy/paste functionality in the Writers CLI editor.

## Quick Test Instructions

1. **Open this file in the editor:**
   ```bash
   writers edit test-copy-paste
   ```

2. **Test basic copy/paste:**
   - Select some text using Shift+Arrow keys
   - Copy with Ctrl+C
   - Move cursor to another location
   - Paste with Ctrl+V

3. **Test line operations:**
   - Place cursor on a line (no selection)
   - Press Ctrl+C to copy entire line
   - Press Ctrl+X to cut entire line
   - Paste with Ctrl+V

## Sample Text for Testing

### Short Lines
Hello world
This is a test
Copy this line
Short text

### Longer Lines
This is a longer line of text that you can use to test partial selection and copying of text within a single line.

### Multi-line Paragraph
You can select across multiple lines to test
multi-line copying and pasting functionality.
This should work seamlessly across line boundaries
and preserve the original formatting and line breaks.

### Special Characters and Formatting
- Bullet points
- **Bold text** (markdown)
- *Italic text* (markdown)
- `Code snippets` in backticks
- Numbers: 123, 456, 789
- Special chars: @#$%^&*()_+-=[]{}|;':\",./<>?

### Code Block Example
```javascript
function testCopyPaste() {
    console.log("Testing copy and paste functionality");
    const text = "This is a test string";
    return text.length;
}
```

## Test Scenarios

### 1. Single Character Selection
Try selecting just one character and copying it.

### 2. Word Selection
Use Ctrl+Shift+Arrow to select whole words.

### 3. Line Selection
- Triple-click to select entire line (if supported)
- Or use Shift+Home/End to select from cursor to line boundaries

### 4. Multi-line Selection
Select text that spans multiple paragraphs:

Paragraph one has some text here.

Paragraph two continues the selection.

Paragraph three completes the test.

### 5. Empty Line Handling
Test copying when cursor is on empty lines:



(Empty lines above and below)



### 6. Document Boundaries
Test selection at the very beginning and end of the document.

### 7. Mixed Content
Try copying text that includes:
- Regular text
- Markdown formatting
- Code blocks
- Lists
- Special characters

## Keyboard Shortcuts Reference

| Shortcut | Action |
|----------|--------|
| Ctrl+C | Copy selection or current line |
| Ctrl+V | Paste from clipboard |
| Ctrl+X | Cut selection or current line |
| Ctrl+A | Select all text |
| Shift+Arrow | Extend selection |
| Shift+Ctrl+Arrow | Extend selection by word |
| Shift+Home/End | Extend selection to line start/end |
| Shift+Ctrl+Home/End | Extend selection to document start/end |

## Expected Behavior

### Copy (Ctrl+C)
- With selection: Copies selected text
- Without selection: Copies current line
- Shows message indicating what was copied
- Works with both system clipboard and internal fallback

### Paste (Ctrl+V)
- Inserts clipboard content at cursor position
- If text is selected, replaces selection
- Preserves line breaks and formatting
- Works from system clipboard or internal clipboard

### Cut (Ctrl+X)
- With selection: Cuts selected text
- Without selection: Cuts current line
- Removes text and copies to clipboard
- Shows confirmation message

### Selection Highlighting
- Selected text should be visually highlighted
- Different background color for selected text
- Selection should be visible in both navigation and insert modes

## Testing Notes

Write your testing observations here:

- [ ] Copy single character works
- [ ] Copy word works  
- [ ] Copy line works
- [ ] Copy multiple lines works
- [ ] Paste single character works
- [ ] Paste word works
- [ ] Paste line works
- [ ] Paste multiple lines works
- [ ] Cut operations work
- [ ] Selection highlighting visible
- [ ] System clipboard integration works
- [ ] Internal clipboard fallback works
- [ ] Undo/redo works with copy/paste operations

## End of Test Document

This marks the end of the test document. Try selecting from here back to the beginning to test large selections.