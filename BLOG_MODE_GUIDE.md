# Blog Mode Guide - Writers CLI

## Overview

Writers CLI now includes a powerful **Blog Mode** designed specifically for bloggers who want a structured, organized approach to content creation. This mode provides specialized templates, workflows, and project organization tailored for blog writing.

## Getting Started

### 1. Initialize a Blog Project

Create a new blog project with the init command:

```bash
writers init-blog
```

You'll be prompted for:
- **Project name** (e.g., "my-blog")
- **Author name** (your name)
- **Blog title** (e.g., "My Tech Blog")
- **Blog description** (brief description)
- **Blog URL** (optional website URL)
- **Default export format** (Markdown, HTML, or both)
- **Use categories** (organize posts by topic)
- **Use tags** (tag system for posts)

### 2. Project Structure

Your blog project will be created with this structure:

```
my-blog/
├── drafts/              # Work-in-progress posts
├── published/           # Finished posts ready for publishing
├── exports/            # Generated files for web publishing
├── assets/images/      # Images and media files
├── templates/          # Post templates and metadata
├── categories/         # Category-organized posts (if enabled)
├── writers.config.json # Project configuration
├── README.md          # Project documentation
└── .gitignore         # Git ignore file
```

## Writing Blog Posts

### Creating a New Post

```bash
writers new blogpost "My Post Title"
```

This will:
1. Prompt you to choose a template type
2. Create a new markdown file in `drafts/`
3. Generate SEO-friendly frontmatter
4. Optionally open the post for immediate editing

### Available Templates

Writers CLI provides 10 specialized blog post templates:

1. **General Blog Post** - Versatile template for most content
2. **Tutorial/How-To** - Step-by-step instructional content
3. **Product Review** - Structured reviews with pros/cons
4. **Personal Story** - Narrative and reflective posts
5. **Top 10 List** - Listicle format with numbered items
6. **Step-by-Step Guide** - Detailed process instructions
7. **News Analysis** - Current events and commentary
8. **Interview** - Q&A format conversations
9. **Opinion Piece** - Persuasive and argumentative content
10. **Technical Deep Dive** - In-depth technical explanations

### Template Features

Each template includes:
- **YAML frontmatter** with SEO metadata
- **Structured content sections** appropriate for the type
- **Placeholder text** to guide your writing
- **Best practices** built into the format
- **Call-to-action** suggestions

## Writing Workflow

### 1. Draft Phase

```bash
# Create a new post
writers new blogpost "How to Learn JavaScript"

# Start writing
writers write "how-to-learn-javascript"
```

Posts are automatically saved in the `drafts/` folder where you can:
- Write and edit freely
- Save multiple versions
- Track word count and progress

### 2. Review and Edit

```bash
# List all drafts
writers list --type drafts

# Check statistics
writers stats "how-to-learn-javascript"

# Continue editing
writers write "how-to-learn-javascript"
```

### 3. Publishing

When your post is ready:

1. **Move to published**: Copy the file from `drafts/` to `published/`
2. **Update frontmatter**: Set `published: true`
3. **Export for web**: Use the export command

```bash
# Export a single post
writers export "how-to-learn-javascript"

# Export all published posts
writers export --all
```

## Blog Post Frontmatter

Each blog post includes comprehensive metadata:

```yaml
---
title: "Your Post Title"
date: 2025-01-08
author: Your Name
category: "tutorials"
tags: ["javascript", "programming", "beginner"]
excerpt: "A brief description for SEO and social sharing"
published: false
slug: "your-post-slug"
featuredImage: "path/to/image.jpg"
difficulty: "beginner"           # For tutorials
estimatedTime: "15 minutes"     # Reading/completion time
---
```

### Frontmatter Fields

- **title**: SEO-optimized post title
- **date**: Publication date (YYYY-MM-DD)
- **author**: Post author name
- **category**: Primary topic category
- **tags**: Array of relevant tags
- **excerpt**: Meta description (150-160 characters)
- **published**: Publication status (true/false)
- **slug**: URL-friendly identifier
- **featuredImage**: Path to social/featured image
- **difficulty**: Content difficulty level
- **estimatedTime**: Reading/completion time

## Categories and Tags

### Using Categories

If enabled, categories help organize posts by major topics:

```yaml
category: "web-development"
```

Create category folders in `categories/` to group related posts:

```
categories/
├── web-development/
├── design/
├── productivity/
└── personal/
```

### Using Tags

Tags provide granular content labeling:

```yaml
tags: ["javascript", "tutorial", "beginner", "frontend"]
```

Best practices:
- Use 3-7 tags per post
- Keep tags consistent across posts
- Mix broad and specific tags
- Consider your audience's search terms

## Advanced Features

### Image Management

Store images in `assets/images/` and reference them:

```markdown
![Alt text](../assets/images/my-screenshot.png)
```

Organize images by:
- Post-specific folders: `assets/images/post-name/`
- Content type: `assets/images/screenshots/`, `assets/images/diagrams/`
- Date: `assets/images/2025/01/`

### SEO Optimization

Templates include SEO best practices:
- Structured headings (H1, H2, H3)
- Meta descriptions in excerpts
- Alt text placeholders for images
- Internal linking opportunities
- Call-to-action suggestions

### Export Formats

Generate publication-ready files:

```bash
# Markdown for Jekyll/Hugo
writers export "post-name" --format markdown

# HTML for direct publishing
writers export "post-name" --format html

# Both formats
writers export "post-name" --format both
```

## Commands Reference

### Project Commands

```bash
writers init-blog                    # Create new blog project
writers init-blog -n "blog-name" -a "Author"  # With options
```

### Content Commands

```bash
writers new blogpost "Title"         # Create new post
writers new blogpost "Title" -t general  # With specific template
writers write "post-slug"            # Edit existing post
writers write                        # Show posts menu
```

### Management Commands

```bash
writers list                         # All content
writers list --type drafts          # Only drafts
writers list --type published       # Only published
writers stats                       # Project statistics
writers stats "post-slug"           # Post-specific stats
```

### Export Commands

```bash
writers export "post-slug"          # Export single post
writers export --all                # Export all published
writers export "post-slug" --format html  # Specific format
```

## Tips for Blog Writing

### Content Planning

1. **Create a content calendar** using categories
2. **Batch similar content** (e.g., all tutorials)
3. **Use templates consistently** for brand recognition
4. **Plan series** with related tags

### Writing Process

1. **Start with templates** to maintain structure
2. **Write drafts quickly** without editing
3. **Use placeholder sections** to maintain flow
4. **Review and edit** in separate sessions
5. **Optimize for SEO** before publishing

### Organization

1. **Use descriptive filenames** for easy searching
2. **Maintain consistent tagging** across posts
3. **Archive old drafts** regularly
4. **Backup your work** using git or cloud storage

### Publishing Workflow

1. **Draft** → Write content freely
2. **Review** → Check structure and flow
3. **Edit** → Polish language and formatting
4. **SEO Check** → Optimize metadata and headings
5. **Publish** → Move to published folder
6. **Export** → Generate web-ready files

## Integration with Static Site Generators

Blog mode works seamlessly with popular static site generators:

### Jekyll
- Frontmatter format is Jekyll-compatible
- Export to `_posts/` directory
- Categories and tags work automatically

### Hugo
- Frontmatter translates directly
- Use content organization features
- Export to `content/posts/`

### Gatsby
- Markdown files work with gatsby-transformer-remark
- Frontmatter becomes GraphQL data
- Image references resolve correctly

### Next.js
- Compatible with MDX and markdown processing
- Frontmatter becomes page metadata
- Easy integration with blog APIs

## Troubleshooting

### Common Issues

**Posts not showing in list**
- Check that files are in `drafts/` or `published/`
- Verify proper markdown file extension (.md)
- Ensure frontmatter is valid YAML

**Template not applying**
- Confirm template selection during creation
- Check for typos in template names
- Verify blog project type in config

**Export failing**
- Ensure target directory exists
- Check file permissions
- Verify frontmatter syntax

### Getting Help

```bash
writers --help                      # General help
writers new --help                  # Command-specific help
```

## Examples

### Quick Start Example

```bash
# Create blog project
writers init-blog -n "tech-blog" -a "Jane Doe"

# Enter project
cd tech-blog

# Create first post
writers new blogpost "Welcome to My Blog"

# Start writing
writers write "welcome-to-my-blog"

# Check progress
writers stats

# Export when ready
writers export "welcome-to-my-blog"
```

### Content Series Example

```bash
# Create related posts with consistent tagging
writers new blogpost "JavaScript Basics - Variables"
writers new blogpost "JavaScript Basics - Functions"
writers new blogpost "JavaScript Basics - Objects"

# Use consistent tags: ["javascript", "basics", "tutorial"]
# Use same category: "programming"
# Number in titles for series organization
```

## Conclusion

Writers CLI Blog Mode provides a complete solution for structured blog writing. With specialized templates, organized workflows, and built-in SEO optimization, you can focus on creating great content while maintaining professional publishing standards.

Happy blogging! 📝✨

---

*For more information, visit the [Writers CLI documentation](https://github.com/yourusername/writers-cli) or run `writers --help`.*