# Copy/Paste Functionality Guide

This guide covers the enhanced copy/paste functionality added to the Writers CLI editor.

## Overview

The Writers CLI editor now supports comprehensive copy/paste operations with:
- System clipboard integration across platforms (Windows, macOS, Linux)
- Text selection with keyboard shortcuts
- Visual selection highlighting
- Internal clipboard fallback
- Line-based operations when no text is selected

## Quick Start

### Basic Copy/Paste
```
1. Select text using Shift + Arrow keys
2. Copy with Ctrl+C
3. Move cursor to desired location
4. Paste with Ctrl+V
```

### Line Operations
```
1. Place cursor on any line (no selection needed)
2. Press Ctrl+C to copy entire line
3. Press Ctrl+X to cut entire line
4. Move to another location and Ctrl+V to paste
```

## Keyboard Shortcuts

### Primary Operations
| Shortcut | Action |
|----------|--------|
| `Ctrl+C` | Copy selection or current line |
| `Ctrl+V` | Paste from clipboard |
| `Ctrl+X` | Cut selection or current line |
| `Ctrl+A` | Select all text |

### Text Selection
| Shortcut | Action |
|----------|--------|
| `Shift+Arrow` | Extend selection in arrow direction |
| `Shift+Home` | Extend selection to line start |
| `Shift+End` | Extend selection to line end |
| `Shift+Ctrl+Arrow` | Extend selection by word |
| `Shift+Ctrl+Home` | Extend selection to document start |
| `Shift+Ctrl+End` | Extend selection to document end |
| `Shift+Page Up/Down` | Extend selection by page |

## Features

### Smart Copy Behavior
- **With selection**: Copies selected text
- **Without selection**: Copies current line including line break
- **Shows feedback**: Displays message with character count copied

### Smart Paste Behavior
- **Replaces selection**: If text is selected, paste replaces it
- **Inserts at cursor**: If no selection, inserts at cursor position
- **Preserves formatting**: Maintains line breaks and text structure
- **Multi-line support**: Handles pasting multiple lines correctly

### Smart Cut Behavior
- **With selection**: Cuts selected text to clipboard
- **Without selection**: Cuts entire current line
- **Auto-cleanup**: Removes empty lines appropriately

### Visual Selection
- **Highlighted text**: Selected text has distinct background color
- **Real-time updates**: Selection updates as you extend it
- **Works in both modes**: Visible in navigation and insert modes

## Platform Support

### Clipboard Integration
The editor integrates with system clipboard on:

**Windows**: Uses `clip` and PowerShell
**macOS**: Uses `pbcopy` and `pbpaste`  
**Linux**: Uses `xclip` or `xsel` (fallback)

### Fallback Support
- **Internal clipboard**: Works even without system clipboard tools
- **Graceful degradation**: Falls back to internal clipboard if system fails
- **User feedback**: Informs user which clipboard is being used

## Usage Examples

### Example 1: Copy a Word
```
1. Place cursor at start of word
2. Press Shift+Ctrl+Right to select word
3. Press Ctrl+C to copy
4. Move to destination
5. Press Ctrl+V to paste
```

### Example 2: Cut Multiple Lines
```
1. Place cursor at start of first line
2. Press Shift+Down to select multiple lines
3. Press Ctrl+X to cut
4. Move to destination
5. Press Ctrl+V to paste
```

### Example 3: Select All and Replace
```
1. Press Ctrl+A to select all text
2. Press Ctrl+C to copy (optional backup)
3. Start typing to replace all content
4. Or press Ctrl+V to paste replacement content
```

### Example 4: Quick Line Duplication
```
1. Place cursor on line to duplicate
2. Press Ctrl+C to copy line
3. Press End to go to line end
4. Press Enter to create new line
5. Press Ctrl+V to paste duplicate
```

## Advanced Usage

### Working with Large Selections
- Use Page Up/Down with Shift for large selections
- Ctrl+A for selecting entire document
- Visual feedback shows selection boundaries

### Multi-line Operations
- Select across paragraphs and sections
- Preserve formatting when copying code blocks
- Handle mixed content (text + markdown + code)

### Clipboard Management
- System clipboard persists between applications
- Internal clipboard persists during editing session
- Copy operations show size feedback

## Troubleshooting

### Common Issues

**Text not copying/pasting**
- Check if you have selection (should be highlighted)
- Try using internal clipboard if system clipboard fails
- Verify keyboard shortcuts are correct

**Selection not visible**
- Ensure you're holding Shift while moving cursor
- Check that selection start and end are different
- Text should have different background color

**System clipboard not working**
- Linux: Install `xclip` or `xsel`
- Windows: Ensure PowerShell is available
- macOS: Should work out of the box
- Falls back to internal clipboard automatically

**Pasted text appears incorrectly**
- Check if you have existing selection (gets replaced)
- Verify cursor position before pasting
- Multi-line pastes create new lines as expected

### Getting Help
- Press F1 in editor for complete help
- Status bar shows current mode and position
- Messages appear for copy/paste operations

## Best Practices

### Efficient Workflows
1. **Use line operations**: Quick copy/cut without selection
2. **Select by word**: Ctrl+Shift+Arrow for precise selection
3. **Visual confirmation**: Watch for selection highlighting
4. **Status feedback**: Read copy/paste messages

### Editing Strategies
1. **Backup before major changes**: Copy important text first
2. **Use cut for moving text**: More efficient than copy+delete
3. **Select all for global operations**: Replace entire content
4. **Multi-line selections**: Copy sections and paragraphs

### Performance Tips
1. **Large documents**: Use specific selections rather than select-all
2. **System clipboard**: More reliable for cross-application use
3. **Internal clipboard**: Faster for editor-only operations

## Integration with Other Features

### Works With
- **Undo/Redo**: Copy/paste operations can be undone
- **Search/Replace**: Copy text then search for it
- **File operations**: Copy text between files
- **Mode switching**: Works in both navigation and insert modes

### Complements
- **Word count**: Copied text affects document statistics
- **Auto-save**: Changes from paste operations are auto-saved
- **Typewriter mode**: Copy/paste works with focused writing
- **Distraction-free mode**: Clean interface for text operations

## Technical Details

### Implementation
- Cross-platform clipboard access via child processes
- Blessed.js terminal UI with custom selection rendering
- UTF-8 text encoding support
- Efficient selection algorithms for large documents

### Security
- No network access required
- Local clipboard operations only
- No external dependencies beyond standard tools
- Secure text handling in memory

## Examples and Testing

Test the functionality with the included `test-copy-paste.md` file:

```bash
writers edit test-copy-paste
```

This file contains various test scenarios and sample text for practicing copy/paste operations.

---

*The copy/paste functionality enhances the Writers CLI editor with modern text editing capabilities while maintaining the focused, distraction-free writing experience.*