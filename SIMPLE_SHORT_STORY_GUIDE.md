# Simple Short Story Writing with Writers CLI

A streamlined approach to writing short stories without complexity.

## Quick Start (2 minutes)

### 1. Create Your Writing Space

```bash
writers init-short my-stories
cd my-stories
```

### 2. Start Writing

```bash
writers write
```

That's it! The `write` command will:

- Show you all your stories
- Let you pick one to continue or create a new one
- Open your editor automatically
- Track word counts for you

## Core Commands (All You Need)

### `writers write` - Your Main Command

- **No arguments**: Shows menu of all stories + option to create new
- **With story name**: Opens that specific story (creates if it doesn't exist)
- **Smart matching**: `writers write robot` finds "the-robot-story.md"

```bash
writers write                    # Interactive menu
writers write "My New Story"     # Create or open specific story
writers write robot              # Find story with "robot" in the name
```

### `writers list` - See Your Stories

```bash
writers list                     # All stories with word counts and status
```

### `writers stats` - Check Progress

```bash
writers stats                    # Total word counts, writing streaks
```

### `writers export` - Prepare for Submission

```bash
writers export "My Story"        # Creates clean submission file
```

## Editor Shortcuts

When editing stories, you have powerful shortcuts at your fingertips:

### Quick Notes Toggle

- **Ctrl+T** - Instantly switch between your story and its notes
- Auto-creates a notes file if it doesn't exist
- Organizes notes in the `notes/` folder
- Perfect for capturing ideas without breaking your writing flow

### Other Useful Shortcuts

- **Ctrl+S** - Save your work
- **Ctrl+W** - Check word count and stats (press any key to close)
- **F11** - Distraction-free writing mode
- **F1** - Show all available shortcuts (press any key to close)

## Simple Project Structure

```
my-stories/
├── drafts/      # Stories you're working on
├── finished/    # Completed stories
└── exports/     # Submission-ready files (auto-generated)
```

**How it works:**

- Start writing in `drafts/`
- When finished, move file to `finished/`
- Use `writers export` to create clean submission versions

## Daily Workflow Example

```bash
# Day 1: Start
cd my-stories
writers write
# → Choose "Create new story"
# → Enter "The Last Robot"
# → Editor opens, write your story

# Day 2: Continue
writers write
# → See "The Last Robot (1,200 words, draft)"
# → Select it, continue writing

# Day 3: Finish
# Move file from drafts/ to finished/
mv "drafts/the-last-robot.md" "finished/"

# Export for submission
writers export "the-last-robot"
# → Creates clean file in exports/
```

## Migration from Complex Projects

If you have an existing complex Writers CLI project:

```bash
writers simplify
```

This command will:

- Back up your current structure
- Move all story files to `drafts/` or `finished/`
- Create the simple folder structure
- Preserve all your work

## Benefits of the Simple Approach

1. **Less Cognitive Load**: Only 3 folders instead of 8+
2. **Faster**: No complex menus or configuration
3. **Intuitive**: Draft → Finished → Export makes sense
4. **Flexible**: Smart file discovery finds your stories anywhere
5. **Focused**: Optimized for the way most people actually write short stories

## When to Use Advanced Features

The full feature set is still available when you need it:

```bash
writers init-shortstory          # Full-featured project
writers workflow daily           # Guided writing sessions
writers story list --detailed    # Advanced story management
```

But for most short story writers, the simple commands handle 90% of needs with 10% of the complexity.

## Tips for Success

1. **Start small**: Create 2-3 short stories before adding complexity
2. **Use descriptive names**: "the-robot-story" is better than "story1"
3. **Write first, organize later**: Focus on the writing, not the filing system
4. **Export often**: Get in the habit of creating submission-ready files
5. **Keep it simple**: Resist the urge to over-organize until you actually need it

---

_Happy writing! Remember: the best writing tool is the one you actually use._ ✍️
