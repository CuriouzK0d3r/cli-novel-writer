# Notes Toggle Feature - Implementation Summary

## Overview

Added a **Ctrl+T** shortcut to quickly switch between a story and its associated notes while editing, making it easy to capture ideas without breaking writing flow.

## How It Works

### In the Editor

- **Press Ctrl+T** while editing any story file
- **Instantly switches** to the associated notes file
- **Auto-creates** notes file if it doesn't exist
- **Press Ctrl+T again** to switch back to your story

### Smart File Matching

- `robot-story.md` ↔ `robot-story-notes.md`
- Works from any directory (drafts/, finished/, stories/, etc.)
- Notes organized in `notes/` folder for simplified projects
- Bidirectional linking (story→notes and notes→story)

## Features

### Auto-Creation

When switching to notes for the first time, creates a structured template:

```markdown
# Notes for "Story Title"

_Created: Today's date_
_Story: story-filename.md_

## Plot Ideas

## Character Notes

## Research

## Revision Notes

## Random Thoughts

---

Press Ctrl+T to switch back to your story.
```

### Smart Discovery

- **From story**: Creates/opens `notes/story-name-notes.md`
- **From notes**: Finds original story in:
  - `drafts/story-name.md`
  - `finished/story-name.md`
  - `stories/story-name.md`
  - `shortstories/story-name.md`
  - Same directory as notes
  - Falls back to most likely location

### Error Handling

- Shows helpful messages when switching
- Warns if original story file not found
- Requires saved file before creating notes (prevents orphaned notes)

## User Interface Updates

### Help Bar

Updated to show: `^S Save  ^O Open  ^X Exit  ^F Find  ^G Go  ^W Stats  ^T Notes  F1 Help`

### Help Dialog (F1)

Added to File Operations section:

```
Ctrl+T         Toggle between story and notes
```

### Command Description

Updated `writers write` description to mention notes toggle feature.

## Implementation Details

### New Methods in BufferEditor

- `toggleNotes()` - Main toggle functionality
- `isNotesFile()` - Detects if current file is a notes file
- `getNotesPathFromStory()` - Generates notes path from story path
- `getStoryPathFromNotes()` - Finds story path from notes path (with file existence checking)
- `createNotesFile()` - Creates structured notes template
- `fileExists()` - Utility for checking file existence

### Key Binding

- Added `this.screen.key(["C-t"], async () => await this.toggleNotes());`
- Works in both navigation and insert modes

## Benefits

### For Writers

- **No context switching** to external apps
- **Instant idea capture** without losing place
- **Organized notes** linked to specific stories
- **Seamless workflow** integration

### For the Simplified Workflow

- **Reduces complexity** - no need to manually manage notes files
- **Auto-organization** - notes go where they belong
- **Discoverable** - shown in help and status bar
- **Intuitive** - Ctrl+T is a natural toggle shortcut

## Documentation Updates

### Updated Files

- `SIMPLIFIED_SHORT_STORY_WORKFLOW.md` - Added Auto-Magic Features section
- `SIMPLE_SHORT_STORY_GUIDE.md` - Added Editor Shortcuts section
- `demo-simple-shortstory.js` - Mentioned in write command demo
- `demo-notes-toggle.js` - Dedicated demonstration script

### Help Text

- Editor help dialog updated with new shortcut
- CLI command description enhanced
- Status bar shows shortcut hint

## Usage Examples

### Basic Workflow

```bash
# Create and start writing
writers init-short my-stories
cd my-stories
writers write "The Robot Story"

# In editor:
# 1. Write your story
# 2. Press Ctrl+T when you have an idea
# 3. Jot down notes
# 4. Press Ctrl+T to continue writing
```

### File Organization

```
my-stories/
├── drafts/
│   └── the-robot-story.md       # Your story
├── finished/
├── notes/
│   └── the-robot-story-notes.md # Auto-created notes
└── exports/
```

## Future Enhancements

### Potential Improvements

- Multiple note types (plot, character, research)
- Note templates based on story genre
- Quick note insertion without full file switch
- Cross-story note linking
- Search across all notes

### Advanced Features

- Notes preview in split view
- Timestamp tracking in notes
- Integration with story statistics
- Export notes alongside stories

## Testing

### Demo Script

`demo-notes-toggle.js` provides comprehensive demonstration of:

- Basic toggle functionality
- Auto-creation behavior
- File organization
- Benefits and use cases

### Manual Testing

1. Create a story with `writers write "test"`
2. Add some content
3. Press Ctrl+T - notes should be created and opened
4. Add some notes
5. Press Ctrl+T - should return to story
6. Verify notes are saved in proper location

## Integration

### With Simplified Workflow

- Works seamlessly with `writers init-short` projects
- Respects simplified folder structure
- No additional setup required
- Enhances core writing workflow

### With Existing Features

- Compatible with all editor modes (navigation/insert)
- Works with typewriter mode, distraction-free mode
- Integrates with auto-save functionality
- Maintains undo/redo history per file

This feature significantly enhances the writing experience by providing instant access to notes without disrupting the creative flow, perfectly aligning with the simplified short story workflow philosophy.
