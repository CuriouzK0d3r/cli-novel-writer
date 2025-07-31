# Simplified Short Story Workflow

This document outlines a streamlined approach to short story writing with Writers CLI, focusing on the essential features most writers need.

## Core Philosophy

**Keep it simple**: Most short story writers need just three things:

1. A place to write
2. A way to track progress
3. An easy export for submission

## Simplified Commands

### Setup (One-time)

```bash
# Create a simple short story project
writers init-short

# This creates a minimal structure:
# my-stories/
# ├── drafts/     # Work in progress
# ├── finished/   # Completed stories
# └── exports/    # Ready for submission
```

### Daily Writing (Core workflow)

```bash
# Start writing - this is the main command you'll use
writers write [story-name]

# If no story name, shows a menu of existing drafts + option to create new
# Auto-detects if story exists in drafts/ or finished/
# Opens in your preferred editor
```

### Quick Commands

```bash
# List your stories (shows drafts and finished)
writers list

# Get word counts and progress
writers stats

# Export a finished story for submission
writers export [story-name]

# That's it! These 4 commands handle 90% of use cases
```

## Simplified Project Structure

Instead of 8+ directories, just use 3:

```
my-stories/
├── drafts/      # Stories you're working on
├── finished/    # Completed stories
└── exports/     # Submission-ready files (auto-generated)
```

## Simplified Status System

Instead of 6+ statuses, just use 2:

- **Draft** - In `drafts/` folder (work in progress)
- **Finished** - In `finished/` folder (ready for submission)

Moving between statuses is as simple as moving files between folders.

## Auto-Magic Features

### Smart File Discovery

- `writers write` with no arguments shows all your stories
- Partial name matching: `writers write my-story` finds `my-story-about-robots.md`
- Auto-creates new files if they don't exist

### Automatic Word Counting

- Every time you open a file, word count is tracked
- `writers stats` shows progress across all stories
- No manual status updates needed

### One-Click Export

- `writers export my-story` creates a clean, submission-ready version
- Removes metadata, formats properly
- Saves to `exports/` with timestamp

### Quick Notes Toggle

- **Ctrl+T** while editing instantly switches between your story and its notes
- Auto-creates notes file if it doesn't exist
- Works from any story in any directory
- Perfect for jotting down ideas without losing your place

## Advanced Features (Optional)

For users who want more features, these remain available but hidden by default:

### Templates

```bash
writers new story "My Story" --template flash
```

### Submission Tracking

```bash
writers submit "My Story" --to "Magazine Name"
```

### Backup

```bash
writers backup
```

## Migration Path

Existing complex projects can be simplified:

```bash
# Consolidate scattered files into simplified structure
writers simplify

# This command:
# 1. Moves all story files from various folders to drafts/
# 2. Moves completed stories to finished/
# 3. Creates clean exports/ folder
# 4. Backs up original structure
```

## Benefits of Simplification

1. **Faster onboarding** - New users can start writing in under 2 minutes
2. **Less decision fatigue** - Fewer folders and commands to choose from
3. **Clearer mental model** - Draft → Finished → Export is intuitive
4. **Easier maintenance** - Fewer moving parts to break
5. **Better mobile/sync** - Simpler folder structure works better with cloud sync

## Implementation Plan

### Phase 1: New Simple Commands

- Add `writers init-short` (simplified init)
- Add smart `writers write` (file discovery + menu)
- Add `writers simplify` (migration tool)

### Phase 2: Streamlined Defaults

- Make simple structure the default for new projects
- Hide advanced features behind flags
- Update help text to focus on core commands

### Phase 3: User Experience

- Interactive tutorial for new users
- Better error messages and suggestions
- Progress tracking and encouragement

## Example User Journey

```bash
# Day 1: Get started
writers init-short my-stories
cd my-stories
writers write "The Robot's Dream"
# Opens editor, user writes story

# Day 2: Continue writing
writers write
# Shows menu: "The Robot's Dream (1,200 words)" + "New story"
# User selects, continues writing

# Day 3: Finish and submit
mv drafts/the-robots-dream.md finished/
writers export "the-robots-dream"
# Creates clean submission file in exports/
```

This workflow removes 80% of the complexity while maintaining 90% of the functionality most users need.
