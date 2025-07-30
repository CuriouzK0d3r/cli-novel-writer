# Enhanced Edit Command Guide

This guide covers the enhanced `writers edit` command that now seamlessly supports all short story directories and improved file discovery.

## Quick Start

### Basic Usage
```bash
# Edit any story from any directory
writers edit my-story

# Interactive file browser
writers edit

# Edit with story name matching
writers edit "flash fiction piece"
```

## Enhanced File Discovery

The `writers edit` command now searches across ALL story directories:

### Standard Directories
- `chapters/` - Novel chapters
- `scenes/` - Individual scenes
- `characters/` - Character profiles
- `notes/` - Research and notes

### Enhanced Short Story Directories
- `stories/` - Completed stories
- `shortstories/` - Legacy short stories
- `drafts/` - Work-in-progress stories
- `submission-ready/` - Polished stories ready for publication
- `exercises/` - Writing practice and experiments
- `prompts/` - Prompt-based writing responses

## Smart File Matching

### Exact Name Matching
```bash
writers edit "the-last-message"    # Finds the-last-message.md
writers edit "The Last Message"    # Case-insensitive matching
```

### Partial Name Matching
```bash
writers edit "last"                # Finds "the-last-message.md"
writers edit "message"             # Finds stories containing "message"
```

### Prefix Matching
```bash
writers edit story1                # Finds files starting with "story"
writers edit draft2                # Finds files in drafts/ directory
writers edit exercise-dialogue     # Finds exercise files
writers edit prompt-response       # Finds prompt responses
```

### Common Prefixes Supported
- `chapter` → searches `chapters/`
- `scene` → searches `scenes/`
- `character` → searches `characters/`
- `story` → searches `stories/`
- `draft` → searches `drafts/`
- `exercise` → searches `exercises/`
- `prompt` → searches `prompts/`

## Interactive File Browser

When you run `writers edit` without a target, you get an organized file browser:

```
📖 chapter: Chapter 1
📗 story: The Last Message
📝 draft: Time Travel Draft
🏋️ exercise: Dialogue Practice
💭 prompt: Robot Rebellion
📝 note: Character Ideas
+ Create new file
Cancel
```

### File Browser Features
- **Organized by type** - Stories grouped by category
- **Color-coded** - Different colors for different file types
- **Icon indicators** - Visual cues for file categories
- **Smart sorting** - Files sorted alphabetically within categories
- **Create new files** - Option to create files during editing session

## Creating New Files

### During Edit Session
When using the interactive browser, you can create new files:

1. Select "**+ Create new file**"
2. Choose file type:
   - 📖 Chapter
   - 🎬 Scene  
   - 👤 Character
   - 📚 Short Story (legacy)
   - 📗 Story (enhanced)
   - 📝 Draft
   - 🏋️ Exercise
   - 💭 Prompt Response
   - 📝 Note

3. Enter the name
4. File is created with appropriate template
5. Opens immediately for editing

### Enhanced File Types

The new enhanced file types come with specialized templates:

#### Story (`stories/`)
```markdown
# Story Title
*Created: Date*

## Story Information
- **Genre:**
- **Target Length:**
- **Status:** Planning
- **Theme:**

## Summary
[Brief description]

## Characters
**Main Character:**
- **Name:**
- **Goal:**
- **Conflict:**

## Plot Outline
- **Opening:**
- **Inciting Incident:**
- **Climax:**
- **Resolution:**

## Story Content
[Begin writing here...]
```

#### Draft (`drafts/`)
```markdown
# Story Title - Draft
*Created: Date*

## Draft Notes
- **Version:** 1.0
- **Focus:** [What are you working on?]
- **Target:** [Word count or goal]

## Story Content
[Start writing here...]
```

#### Exercise (`exercises/`)
```markdown
# Writing Exercise: Exercise Name
*Created: Date*

## Exercise Goals
- **Skill Focus:** [What are you practicing?]
- **Time Limit:** [How long to spend?]
- **Success Criteria:** [How will you know you succeeded?]

## Exercise Content
[Begin your writing exercise here...]

## Reflection
[What did you learn?]
```

#### Prompt Response (`prompts/`)
```markdown
# Prompt Response: Response Name
*Created: Date*

## Prompt
[Write the prompt that inspired this piece]

## Response Goals
- **Length Target:**
- **Time Limit:**
- **Focus:**

## Story Content
[Write your response here...]
```

## Editor Integration

### Built-in Editor
The enhanced edit command works seamlessly with the built-in Novel Editor:

```bash
writers edit my-story
# → Launches Novel Editor with writer-focused features
# → Typewriter mode, focus highlighting, word count tracking
# → Auto-save and session statistics
```

### External Editors
You can also use external editors through the `writers write` command:

```bash
writers write my-story --editor code    # VS Code
writers write my-story --editor vim     # Vim
writers write my-story --editor nano    # Nano
```

## File Organization Tips

### Naming Conventions
- Use descriptive names: `character-study-sarah.md`
- Include version numbers for drafts: `story-v2.md`
- Use prefixes for series: `collection-01-opening.md`

### Directory Usage
- **`stories/`** - Final, polished stories
- **`drafts/`** - Multiple versions and experiments
- **`submission-ready/`** - Stories formatted for submission
- **`exercises/`** - Practice pieces and skill-building
- **`prompts/`** - Quick responses and idea exploration

### Status Tracking
Stories can have metadata status:
- **Planning** - Concept development
- **Drafting** - First draft writing
- **Revising** - Multiple revision passes
- **Complete** - Ready for submission
- **Submitted** - Out to publications
- **Published** - Accepted and published

## Error Handling

### File Not Found
If a file isn't found, the command provides helpful suggestions:

```
❌ File not found: mystory
💡 Use "writers list" to see available files
💡 Use "writers new" to create a new file
```

### Directory Not Found
The command gracefully handles missing directories:
- Searches available directories only
- Skips non-existent directories
- Suggests creating new files if needed

### Ambiguous Matches
When multiple files match your search:
- Shows all matching options
- Lets you choose interactively
- Provides context (directory, file type)

## Advanced Usage

### Search Across All Directories
```bash
# Find all files containing "robot"
writers edit robot
# → Shows all matches across all directories

# Find specific type
writers edit draft    # Shows all draft files
writers edit exercise # Shows all exercise files
```

### Quick Access Patterns
```bash
writers edit latest   # Often finds most recently modified
writers edit wip      # Common abbreviation for "work in progress"
writers edit current  # Finds files with "current" in name
```

### Integration with Workflows
```bash
# Start daily workflow and edit result
writers workflow daily
# → Creates/selects story
# → Opens for editing automatically

# Quick exercise creation and editing
writers workflow prompt
# → Creates prompt response file
# → Opens for immediate writing
```

## Troubleshooting

### Common Issues

**Command not finding files:**
- Check file extension (should be `.md`)
- Verify file is in supported directory
- Try partial name matching
- Use interactive browser (`writers edit`)

**Multiple matches:**
- Be more specific with filename
- Use directory prefix (`story:filename`)
- Use interactive selection

**Permission errors:**
- Check file permissions
- Ensure directory is writable
- Try running from project root

### Getting Help
```bash
writers edit --help        # Command help
writers list               # See all available files
writers story list         # See all stories specifically
```

## Best Practices

### File Organization
1. **Use consistent naming** - Develop a naming convention
2. **Organize by status** - Move files through directories as they progress
3. **Keep backups** - The system creates automatic backups
4. **Tag appropriately** - Use the story management system for metadata

### Editing Workflow
1. **Start with interactive browser** - Get familiar with your files
2. **Use specific names** - More efficient than browsing
3. **Create templates** - Customize templates for your needs
4. **Track progress** - Use status metadata and word counts

### Integration with Other Commands
- Use `writers story list` to see all stories before editing
- Use `writers story status filename` for detailed file information
- Use `writers workflow daily` for guided editing sessions
- Use `writers story move` to organize files between directories

## Examples

### Daily Editing Session
```bash
# See what you have
writers story list --status drafting

# Edit a specific story
writers edit time-travel-story

# Quick exercise
writers edit exercise-dialogue

# Review and organize
writers story move finished-story --to submission-ready
```

### File Browser Navigation
```bash
# Start interactive browser
writers edit

# Browser shows:
📗 story: The Last Message
📝 draft: Character Study Draft  
🏋️ exercise: Dialogue Practice
💭 prompt: Future Society
📝 note: Plot Ideas

# Select any file to open immediately
```

The enhanced `writers edit` command makes it effortless to work with stories across your entire project, regardless of how they're organized. The smart file discovery and interactive browser ensure you can always find and edit exactly what you need.

Happy editing! ✍️✨