# Short Story Quickstart Guide

Get up and running with the enhanced short story workflow in Writers CLI.

## 🚀 Quick Setup (2 minutes)

### 1. Create Your Short Story Project
```bash
# Initialize a dedicated short story project
writers init-shortstory

# Follow the interactive setup:
# - Choose project type (single, collection, workshop, themed)
# - Set your genre and target length
# - Configure your preferences
```

### 2. Create Your First Story
```bash
# Create a new story with a template
writers new shortstory "My First Story" --template basic

# Or choose from specialized templates:
writers new shortstory "Flash Piece" --template flash
writers new shortstory "Character Study" --template character-study
```

### 3. Start Writing
```bash
# Edit with the built-in editor
writers edit my-first-story

# Or use your preferred external editor
writers write my-first-story
```

## 📝 Daily Writing Workflow

### Start Your Writing Session
```bash
# Guided daily writing session
writers workflow daily

# This helps you:
# - Continue existing stories
# - Start new stories
# - Set and track goals
# - Practice with exercises
```

### Quick Commands
```bash
# View all your stories
writers story list

# Get detailed story info
writers story status my-story

# Search your work
writers story search "keyword"

# Quick writing sprint
writers workflow sprint
```

## 📂 Project Structure

Your short story project includes:

```
your-project/
├── stories/          # ✅ Completed stories
├── drafts/           # 📝 Work-in-progress
├── notes/            # 💭 Ideas and research
├── submission-ready/ # 📤 Polished for publication
├── exercises/        # 🏋️ Writing practice
├── prompts/          # 💡 Prompt responses
└── exports/          # 📄 Exported files
```

## 🎯 Story Status Workflow

Track your stories through their lifecycle:

1. **📋 Planning** - Developing the concept
2. **✍️ Drafting** - Writing the first draft
3. **🔧 Revising** - Multiple revision passes
4. **✅ Complete** - Ready for submission
5. **📤 Submitted** - Out to publications
6. **🎉 Published** - Accepted and published

Move stories between stages:
```bash
# Move to different directories
writers story move my-story --to submission-ready
writers story move old-story --to archive
```

## 📤 Submission Workflow

### Prepare for Submission
```bash
# Automated submission checklist
writers workflow submission

# Checks:
# ✓ Story completion
# ✓ Grammar and spelling
# ✓ Word count validation
# ✓ Standard formatting
# ✓ Publication research
```

### Track Submissions
- Built-in submission tracker
- Publication target lists
- Response tracking
- Acceptance rate statistics

## 🔧 Revision Process

### Structured Revision
```bash
# Guided revision workflow
writers workflow revision

# Choose revision type:
# - Structural (plot, pacing, characters)
# - Line editing (prose, style, flow)  
# - Copy editing (grammar, punctuation)
# - Proofreading (final polish)
```

Each type includes specific checklists and best practices.

## 🏷️ Organization & Search

### Tag Your Stories
```bash
# Add tags for easy organization
writers story tags my-story --add "sci-fi,dystopian,short"

# Filter by tags
writers story list --tag sci-fi
```

### Search Everything
```bash
# Search story content, titles, and metadata
writers story search "time travel"
writers story search "robot" --genre "science fiction"
```

## 📚 Templates Available

Choose the right template for your story type:

- **basic** - Simple, clean short story template
- **flash** - Ultra-short stories (100-1000 words)
- **character-study** - Character-focused development
- **twist** - Stories with surprise endings
- **literary** - Character-driven with deeper themes
- **genre** - Sci-fi, fantasy, horror, etc.
- **experimental** - Form and structure experiments
- **collection** - Part of a larger collection
- **workshop** - Skill-building practice
- **prompt** - Based on writing prompts

## 🏃 Writing Exercises & Prompts

### Quick Practice Sessions
```bash
# Writing prompt session
writers workflow prompt

# Writing sprint with constraints
writers workflow sprint

# Daily practice exercises
writers workflow daily
```

### Exercise Types Available
- Character voice exercises
- Dialogue-only stories
- Constraint writing challenges
- Emotion focus practice
- Setting development

## 📈 Progress Tracking

### View Statistics
```bash
# Overall project stats
writers story stats

# Individual story details
writers story status my-story

# Writing session summaries
# (automatically shown after editing)
```

## 🎛️ Customization

### Set Your Preferences
- Default editor choice
- Word count goals
- Template customizations
- Export formats

### Project Types
- **Single Story** - Focus on one story at a time
- **Collection** - Multiple related stories
- **Workshop** - Practice and experimental stories
- **Themed Collection** - Stories around a specific theme

## 🆘 Need Help?

### Command Help
```bash
writers --help                    # All commands
writers story --help              # Story management
writers workflow --help           # Workflow options
writers new shortstory --help     # Template options
```

### Documentation
- `ENHANCED_SHORT_STORY_WORKFLOW.md` - Complete feature guide
- `SHORT_STORY_GUIDE.md` - Detailed writing guidance
- Demo: `node demo-shortstory-workflow.js`

## 💡 Pro Tips

1. **Start Small** - Begin with flash fiction or short exercises
2. **Use Templates** - They provide structure and save time
3. **Track Progress** - Regular stats help maintain momentum
4. **Organize Early** - Use tags and directories from the start
5. **Revise Systematically** - Use the structured revision workflow
6. **Submit Regularly** - Build publication credits over time

## 🎯 Example Workflow

Here's a typical day with the enhanced short story workflow:

```bash
# Morning: Start your writing session
writers workflow daily
# → Choose to continue existing story
# → Set goal: 500 words in 45 minutes

# Writing: Edit your story
writers edit my-current-story
# → Built-in editor opens
# → Write 500 words
# → Session stats shown automatically

# Afternoon: Quick exercise
writers workflow prompt
# → Get random writing prompt
# → 15-minute flash fiction piece

# Evening: Check progress
writers story list --detailed
# → See all stories and word counts
# → Plan tomorrow's session
```

## Ready to Write?

```bash
# Create your first short story project
writers init-shortstory

# Start writing immediately
writers workflow daily
```

Happy writing! ✍️✨

---

*For advanced features and detailed guides, see the complete documentation in `ENHANCED_SHORT_STORY_WORKFLOW.md`.*