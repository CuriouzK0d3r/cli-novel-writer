# Short Story Support Guide

This guide covers the new short story functionality added to the Writers CLI tool.

## Overview

Writers CLI now supports creating, managing, and exporting short stories alongside your novels. Short stories are treated as standalone pieces with their own templates, organization, and export options.

## Quick Start

### Creating a Short Story

```bash
# Create a new short story with basic template
writers new shortstory "The Last Message"

# Create with a specific template
writers new shortstory "Mirror Dance" --template character-study
```

### Available Templates

- **basic** - Simple short story template
- **character-study** - Focus on character development and internal journey
- **twist** - Stories with surprise endings
- **flash** - Very short fiction (100-1000 words)
- **literary** - Literary fiction with deeper themes
- **genre** - Genre-specific stories (sci-fi, fantasy, etc.)

## Project Structure

When you initialize a project, a `shortstories/` directory is created:

```
your-project/
├── chapters/          # Novel chapters
├── scenes/           # Individual scenes
├── characters/       # Character profiles
├── shortstories/     # Complete short stories
├── notes/           # Research and notes
└── exports/         # Exported files
```

## Managing Short Stories

### List Short Stories

```bash
# List all content including short stories
writers list

# List only short stories
writers list --type shortstories
```

### View Statistics

```bash
# Project overview (includes short story count)
writers stats

# Detailed statistics
writers stats --detailed
```

### Editing Short Stories

```bash
# Open in your default editor
writers write story-name

# Open in built-in editor
writers edit story-name
```

## Short Story Templates

### Character Study Template

Ideal for stories focused on character development:

```markdown
# Story Title

## Story Information
- **Genre:** Character Study
- **Target Length:** 2,000-5,000 words
- **Theme:** Character development and internal journey
- **Setting:**

## Character Focus
**Main Character:**
- **Name:**
- **Background:**
- **Internal Conflict:**
- **What they want:**
- **What they need:**

## Story Structure
- **Opening:** Introduce character in their normal world
- **Inciting Incident:** Something disrupts their routine
- **Internal Journey:** Character grapples with change
- **Revelation:** Character discovers something about themselves
- **Resolution:** How the character has changed
```

### Flash Fiction Template

For very short stories:

```markdown
# Story Title

## Story Information
- **Genre:** Flash Fiction
- **Target Length:** 100-1,000 words
- **Theme:**
- **Setting:**

## Flash Fiction Focus
**Single Moment:** What specific moment are you capturing?
**Emotional Core:** What feeling drives this piece?
**Compression:** What's the essence that must be preserved?

## Constraints
- Every word must earn its place
- Start as close to the end as possible
- One central image or metaphor
- Leave room for reader interpretation
```

### Twist Ending Template

For stories with surprise endings:

```markdown
# Story Title

## Twist Planning
**The Reveal:** What is the surprise?
**Misdirection:** How do you lead readers away from the truth?
**Clues:** What hints do you plant?
**Foreshadowing:** What seems innocent but gains new meaning?

## Revision Notes
- Check that clues are present but not obvious
- Ensure twist is fair (readers could figure it out)
- Make sure story works even knowing the twist
```

## Exporting Short Stories

Short stories can be included in exports alongside your novel:

```bash
# Export to HTML with short stories
writers export html

# During export, you'll be prompted:
# "Include short stories? (y/N)"
```

### Export Formats

All export formats support short stories:

- **HTML** - Professional web format with table of contents
- **Markdown** - Clean markdown for further processing
- **Text** - Plain text for reading
- **JSON** - Structured data for analysis

## Integration with Novel Writing

Short stories can complement your novel-writing process:

### Character Development
- Write short stories from your characters' perspectives
- Explore backstories that inform your main narrative
- Test character voices before incorporating them into your novel

### World Building
- Create short stories set in your novel's world
- Explore different time periods or locations
- Develop side characters and subplots

### Skill Development
- Practice specific techniques (dialogue, description, pacing)
- Experiment with different genres or styles
- Complete shorter projects while working on longer ones

## Best Practices

### Organization
- Use descriptive names for your short stories
- Include genre and length information in the story metadata
- Keep related stories grouped by theme or setting

### Templates
- Choose templates that match your story's focus
- Customize templates for recurring story types
- Use the planning sections to outline before writing

### Workflow
- Set word count goals appropriate for short fiction
- Use the statistics to track your short story productivity
- Export collections for sharing or submission

## Example Workflow

1. **Planning Phase**
   ```bash
   writers new shortstory "The Signal" --template genre
   ```

2. **Writing Phase**
   ```bash
   writers write the-signal
   ```

3. **Review Phase**
   ```bash
   writers list --type shortstories
   writers stats
   ```

4. **Export Phase**
   ```bash
   writers export html
   # Select to include short stories
   ```

## Tips for Short Story Writing

### Length Guidelines
- **Flash Fiction:** 100-1,000 words
- **Short Short:** 1,000-2,000 words
- **Short Story:** 2,000-7,500 words
- **Novelette:** 7,500-20,000 words

### Structure
- Start as close to the climax as possible
- Focus on a single moment, event, or realization
- Every word should serve the story's purpose
- End with impact and resonance

### Character Development
- Limit the number of characters
- Show character through action and dialogue
- Focus on one aspect of character development
- Make the protagonist active, not passive

## Troubleshooting

### Common Issues

**Short story not appearing in list:**
- Check that the file is in the `shortstories/` directory
- Ensure the file has a `.md` extension
- Verify the file isn't corrupted

**Template not working:**
- Check the template name spelling
- Use `--template basic` for the simplest template
- Templates are case-sensitive

**Export not including short stories:**
- Make sure to answer "yes" when prompted about including short stories
- Check that your short stories have content
- Verify the export directory exists

### Getting Help

```bash
# View all available commands
writers --help

# View help for specific commands
writers new --help
writers export --help
```

## Advanced Usage

### Custom Templates
You can modify the template system by editing the template definitions in the source code, or create your own template files to copy and paste.

### Automation
Use the JSON export format to create custom analysis tools for your short story collections.

### Integration
Short stories export to standard formats that work with:
- Submission management systems
- Publishing platforms
- Writing group sharing
- Portfolio websites

---

*This guide covers the short story functionality added to Writers CLI. For general usage, see the main README.md file.*