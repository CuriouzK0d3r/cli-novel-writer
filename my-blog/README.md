# my blog Blog

**Author:** alexis
**Type:** Blog Project
**Created:** 8/5/2025


## About
My personal blog about thoughts, ideas, and experiences

## Project Structure

### Folders
- `drafts/` - Blog posts you're working on
- `published/` - Finished posts ready for publishing
- `exports/` - Export-ready files (HTML, markdown, etc.)
- `assets/images/` - Images and media for your posts
- `templates/` - Post templates and metadata schemas
- `categories/` - Organized posts by category

### Writing Workflow
1. **Create a new post**: `writers new blogpost "My Post Title"`
2. **Write your post**: `writers write "my-post-title"`
3. **Review and edit**: Posts auto-save in `drafts/`
4. **Publish**: Move from `drafts/` to `published/` when ready
5. **Export**: `writers export "my-post-title"` to generate web-ready files

### Available Commands
```bash
# Create new blog post
writers new blogpost "Post Title"

# Write/edit a post
writers write "post-slug"
writers write                    # Shows menu of all posts

# List all posts
writers list                     # All posts
writers list --type published    # Only published posts
writers list --type drafts      # Only drafts

# Post statistics
writers stats                    # Overall blog stats
writers stats "post-slug"       # Specific post stats

# Export posts
writers export "post-slug"      # Export single post
writers export --all            # Export all published posts
```

### Blog Features
- **Auto-generated metadata**: SEO-friendly frontmatter
- **Category organization**: Enabled
- **Tag system**: Enabled
- **Export formats**: markdown
- **Image management**: Organized asset structure
- **Publishing workflow**: Draft → Published → Exported

## Getting Started
1. Create your first post: `writers new blogpost "Hello World"`
2. Start writing: `writers write "hello-world"`
3. Use the templates in `templates/` for consistent formatting
4. Organize with categories and tags as you write
5. Export when ready to publish online

## Tips for Blog Writing
- Use descriptive post titles for better SEO
- Add relevant tags to improve discoverability
- Include images in `assets/images/` and reference them in posts
- Review the metadata template for SEO optimization
- Keep drafts organized and publish regularly

Happy blogging! 📝✨

---
*Created with Writers CLI - Blog Mode*
