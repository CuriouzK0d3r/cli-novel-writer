# Writers Editor

A built-in terminal-based text editor designed specifically for writers, featuring markdown support, real-time statistics, and distraction-free writing modes.

## Features

### Core Editing

- **Full-featured terminal editor** with syntax highlighting
- **Markdown support** with live preview formatting
- **Auto-save** functionality (every 30 seconds)
- **Undo/Redo** with 50-level history
- **Find and Replace** with regex support
- **Go to line** navigation
- **File operations** (new, open, save, save as)

### Writer-Specific Features

- **Real-time word count** and character count
- **Reading time estimation** based on average reading speed
- **Writing session statistics** including words per minute
- **Document analysis** with readability metrics
- **Distraction-free mode** (F11) for focused writing
- **Writing suggestions** based on text analysis
- **Project integration** with automatic file discovery

### Interface

- **Clean, intuitive interface** with status bars
- **Keyboard shortcuts** optimized for writers
- **Multiple themes** support (dark mode default)
- **Responsive layout** that adapts to terminal size
- **Context-sensitive help** system

## Getting Started

### Launch the Editor

From within a Writers project directory:

```bash
# Edit a specific file
writers edit chapter1
writers edit "My Character"

# Launch with file selection menu
writers edit

# Alternative: Use the write command and select built-in editor
writers write
```

### First Time Setup

1. Initialize a Writers project: `writers init`
2. Create your first chapter: `writers new chapter "Chapter 1"`
3. Launch the editor: `writers edit "Chapter 1"`

## Keyboard Shortcuts

### File Operations

| Shortcut | Action      |
| -------- | ----------- |
| `Ctrl+N` | New file    |
| `Ctrl+O` | Open file   |
| `Ctrl+S` | Save file   |
| `Ctrl+X` | Exit editor |

### Editing

| Shortcut | Action            |
| -------- | ----------------- |
| `Ctrl+Z` | Undo              |
| `Ctrl+Y` | Redo              |
| `Ctrl+A` | Select all        |
| `Ctrl+F` | Find text         |
| `Ctrl+R` | Replace text      |
| `Ctrl+G` | Go to line number |

### View & Navigation

| Shortcut        | Action                                            |
| --------------- | ------------------------------------------------- |
| `F1`            | Show help                                         |
| `F11`           | Toggle distraction-free mode                      |
| `Ctrl+W`        | Show detailed word count (press any key to close) |
| `Arrow Keys`    | Move cursor                                       |
| `Page Up/Down`  | Scroll by page                                    |
| `Home/End`      | Beginning/end of line                             |
| `Ctrl+Home/End` | Beginning/end of document                         |

## Interface Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Document Content                        │
│                                                             │
│  # Chapter 1                                               │
│                                                             │
│  It was the best of times, it was the worst of times...   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ chapter1.md* | Words: 1,247 | Reading: 6m 14s | Line: 42  │ Status Bar
├─────────────────────────────────────────────────────────────┤
│ Saved successfully                                          │ Info Bar
├─────────────────────────────────────────────────────────────┤
│ ^S Save  ^O Open  ^X Exit  ^F Find  ^G Go  ^W Stats  F1 Help│ Help Bar
└─────────────────────────────────────────────────────────────┘
```

### Status Bar Elements

- **File name** with dirty indicator (\*)
- **Word count** - live updating
- **Reading time** - estimated based on 200 WPM
- **Current line** number
- **Column position** (when available)

## Writing Features

### Real-Time Statistics

The editor continuously tracks:

- Word count (excluding markdown formatting)
- Character count (with and without spaces)
- Reading time estimation
- Session statistics (words written, time spent, WPM)

### Document Analysis

Access detailed analysis via `Ctrl+W`:

- Readability metrics (Flesch Reading Ease, Grade Level)
- Average words per sentence
- Average sentences per paragraph
- Writing suggestions and improvements

### Distraction-Free Mode

Press `F11` to toggle distraction-free mode:

- Hides all UI elements except the text
- Full-screen writing experience
- Minimal visual distractions
- Perfect for focused writing sessions

### Auto-Save

- Automatically saves changes every 30 seconds
- Creates backups before editing sessions
- Prevents data loss from unexpected exits
- Can be configured in project settings

## Markdown Support

The editor provides enhanced support for markdown:

### Syntax Highlighting

- **Headers** (`# ## ###`) in different colors
- **Bold** (`**text**`) and _italic_ (`*text*`) formatting
- **Code blocks** (```and`inline code`)
- **Links** (`[text](url)`) and images
- **Lists** and blockquotes
- **Horizontal rules** (`---`)

### Live Preview

While not a full preview, the editor applies visual formatting to:

- Make headers stand out with colors
- Highlight emphasis and strong text
- Show code blocks in monospace
- Distinguish quotes and lists

## Project Integration

### Automatic File Discovery

- Scans project structure for chapters, scenes, characters, notes
- Provides context-aware file selection
- Integrates with project statistics
- Supports project-wide search and navigation

### Template Support

- Automatically applies templates for new files
- Supports custom templates per file type
- Includes frontmatter for metadata
- Maintains consistent project structure

### Progress Tracking

- Shows project-wide progress toward word goals
- Tracks daily writing statistics
- Provides motivation and milestone celebrations
- Integrates with export and publishing workflows

## Configuration

### Editor Settings

Configure the editor through your `writers.config.json`:

```json
{
  "editor": {
    "theme": "dark",
    "autoSave": true,
    "autoSaveInterval": 30000,
    "showWordCount": true,
    "showReadingTime": true,
    "wrapText": true,
    "tabSize": 2,
    "distraction_free_on_start": false
  }
}
```

### Available Themes

- `dark` (default) - Dark background, light text
- `light` - Light background, dark text
- `solarized` - Solarized color scheme
- `monokai` - Monokai-inspired colors

## Tips for Writers

### Workflow Optimization

1. **Start with outlines** - Use the built-in navigation to jump between sections
2. **Use distraction-free mode** for first drafts
3. **Regular saves** - Rely on auto-save but manually save important milestones
4. **Track progress** - Use `Ctrl+W` to monitor your writing metrics

### Writing Sprints

1. Enter distraction-free mode (`F11`)
2. Set a timer outside the editor
3. Focus solely on writing without editing
4. Use word count to track sprint progress
5. Exit and review after the sprint

### Editing Sessions

1. Use normal mode with full interface
2. Leverage find/replace for global changes
3. Use go-to-line for navigating to specific areas
4. Check readability metrics during revision

### Long Documents

1. Use headers to structure your content
2. Navigate with `Ctrl+G` to jump to specific sections
3. Use the project-wide search when available
4. Break large chapters into multiple files if needed

## Troubleshooting

### Common Issues

**Editor won't start**

- Ensure you're in a Writers project directory
- Check that the blessed dependency is installed
- Verify terminal compatibility

**Text appears garbled**

- Check terminal encoding (should be UTF-8)
- Try resizing the terminal window
- Restart the editor

**Auto-save not working**

- Check file permissions in the project directory
- Ensure adequate disk space
- Verify the backup directory is writable

**Slow performance**

- Large files (>10MB) may cause slowdowns
- Consider breaking very large documents into chapters
- Check available system memory

### Getting Help

1. **In-editor help** - Press `F1` for comprehensive help
2. **Command line help** - `writers edit --help`
3. **Project documentation** - Check the main README
4. **Community support** - See project repository for issues and discussions

## Advanced Usage

### Custom Key Bindings

While not yet configurable, the editor supports standard terminal key combinations and can be extended for custom workflows.

### Integration with External Tools

The editor works seamlessly with:

- Version control (Git) for tracking changes
- External markdown processors
- Publishing and export workflows
- Backup and sync solutions

### Scripting and Automation

The editor can be launched programmatically for:

- Automated editing workflows
- Batch processing of files
- Integration with other writing tools
- Custom project management scripts

---

_The Writers Editor is designed to be your companion throughout the entire writing process, from first draft to final manuscript. It combines the power of a modern text editor with features specifically crafted for authors and novelists._
