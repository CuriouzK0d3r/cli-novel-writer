const chalk = require("chalk");
const inquirer = require("inquirer");
const fs = require("fs").promises;
const path = require("path");
const projectManager = require("../utils/project");

/**
 * Blog project initialization
 * Creates a structured blog writing environment
 */
async function initBlogCommand(options) {
  console.log(chalk.cyan.bold(`
📝 Blog Project Setup
Creating your personal blogging workspace...
`));

  // Get basic project info
  const projectInfo = await gatherBlogProjectInfo(options);

  // Create blog project structure
  await createBlogProject(projectInfo);

  console.log(chalk.green.bold(`
🎉 Your blog project "${projectInfo.name}" is ready!

Quick start:
${chalk.cyan("cd " + projectInfo.name)}
${chalk.cyan("writers new blogpost")}     # Create your first blog post
${chalk.cyan("writers write")}            # Start writing
${chalk.cyan("writers list")}             # View all your posts

Your blog is organized and ready for consistent publishing!
`));
}

async function gatherBlogProjectInfo(options) {
  const questions = [];

  if (!options.name) {
    questions.push({
      type: "input",
      name: "name",
      message: "Blog project name:",
      default: "my-blog",
      validate: input => input.trim().length > 0 || "Name cannot be empty"
    });
  }

  if (!options.author) {
    questions.push({
      type: "input",
      name: "author",
      message: "Your name (blog author):",
      validate: input => input.trim().length > 0 || "Author name cannot be empty"
    });
  }

  // Additional blog-specific questions
  questions.push(
    {
      type: "input",
      name: "blogTitle",
      message: "Blog title:",
      default: answers => `${(options.name || answers.name).replace(/-/g, ' ')} Blog`,
      validate: input => input.trim().length > 0 || "Blog title cannot be empty"
    },
    {
      type: "input",
      name: "blogDescription",
      message: "Blog description:",
      default: "My personal blog about thoughts, ideas, and experiences"
    },
    {
      type: "input",
      name: "blogUrl",
      message: "Blog URL (optional):",
      default: ""
    },
    {
      type: "list",
      name: "defaultFormat",
      message: "Default export format:",
      choices: [
        { name: "Markdown (for Jekyll, Hugo, etc.)", value: "markdown" },
        { name: "HTML (for direct publishing)", value: "html" },
        { name: "Both", value: "both" }
      ],
      default: "markdown"
    },
    {
      type: "confirm",
      name: "useCategories",
      message: "Use category organization?",
      default: true
    },
    {
      type: "confirm",
      name: "useTags",
      message: "Use tag system?",
      default: true
    }
  );

  const answers = questions.length > 0 ? await inquirer.prompt(questions) : {};

  return {
    name: options.name || answers.name,
    author: options.author || answers.author,
    blogTitle: answers.blogTitle,
    blogDescription: answers.blogDescription,
    blogUrl: answers.blogUrl,
    defaultFormat: answers.defaultFormat,
    useCategories: answers.useCategories,
    useTags: answers.useTags,
    type: "blog"
  };
}

async function createBlogProject(projectInfo) {
  const projectDir = projectInfo.name;

  // Create main directory
  await fs.mkdir(projectDir, { recursive: true });

  // Create blog folder structure
  const folders = [
    "drafts",
    "published",
    "exports",
    "assets/images",
    "templates"
  ];

  if (projectInfo.useCategories) {
    folders.push("categories");
  }

  for (const folder of folders) {
    await fs.mkdir(path.join(projectDir, folder), { recursive: true });
  }

  // Create blog config
  const config = {
    name: projectInfo.name,
    author: projectInfo.author,
    type: "blog",
    blog: {
      title: projectInfo.blogTitle,
      description: projectInfo.blogDescription,
      url: projectInfo.blogUrl,
      defaultFormat: projectInfo.defaultFormat,
      useCategories: projectInfo.useCategories,
      useTags: projectInfo.useTags
    },
    created: new Date().toISOString(),
    version: "2.0"
  };

  await fs.writeFile(
    path.join(projectDir, "writers.config.json"),
    JSON.stringify(config, null, 2)
  );

  // Create blog README
  const readme = generateBlogReadme(projectInfo);
  await fs.writeFile(path.join(projectDir, "README.md"), readme);

  // Create .gitignore
  const gitignore = `# Writers CLI Blog
exports/
.DS_Store
*.bak
*.tmp
session-notes/
node_modules/
dist/
`;
  await fs.writeFile(path.join(projectDir, ".gitignore"), gitignore);

  // Create sample post template
  const sampleTemplate = generateBlogPostTemplate(projectInfo);
  await fs.writeFile(
    path.join(projectDir, "templates", "default-post.md"),
    sampleTemplate
  );

  // Create blog metadata template
  const metadataTemplate = generateMetadataTemplate(projectInfo);
  await fs.writeFile(
    path.join(projectDir, "templates", "post-metadata.json"),
    metadataTemplate
  );

  // Create categories index if enabled
  if (projectInfo.useCategories) {
    const categoriesReadme = generateCategoriesReadme();
    await fs.writeFile(
      path.join(projectDir, "categories", "README.md"),
      categoriesReadme
    );
  }
}

function generateBlogReadme(projectInfo) {
  return `# ${projectInfo.blogTitle}

**Author:** ${projectInfo.author}
**Type:** Blog Project
**Created:** ${new Date().toLocaleDateString()}
${projectInfo.blogUrl ? `**URL:** ${projectInfo.blogUrl}` : ''}

## About
${projectInfo.blogDescription}

## Project Structure

### Folders
- \`drafts/\` - Blog posts you're working on
- \`published/\` - Finished posts ready for publishing
- \`exports/\` - Export-ready files (HTML, markdown, etc.)
- \`assets/images/\` - Images and media for your posts
- \`templates/\` - Post templates and metadata schemas
${projectInfo.useCategories ? '- `categories/` - Organized posts by category' : ''}

### Writing Workflow
1. **Create a new post**: \`writers new blogpost "My Post Title"\`
2. **Write your post**: \`writers write "my-post-title"\`
3. **Review and edit**: Posts auto-save in \`drafts/\`
4. **Publish**: Move from \`drafts/\` to \`published/\` when ready
5. **Export**: \`writers export "my-post-title"\` to generate web-ready files

### Available Commands
\`\`\`bash
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
\`\`\`

### Blog Features
- **Auto-generated metadata**: SEO-friendly frontmatter
- **Category organization**: ${projectInfo.useCategories ? 'Enabled' : 'Disabled'}
- **Tag system**: ${projectInfo.useTags ? 'Enabled' : 'Disabled'}
- **Export formats**: ${projectInfo.defaultFormat}
- **Image management**: Organized asset structure
- **Publishing workflow**: Draft → Published → Exported

## Getting Started
1. Create your first post: \`writers new blogpost "Hello World"\`
2. Start writing: \`writers write "hello-world"\`
3. Use the templates in \`templates/\` for consistent formatting
4. Organize with categories and tags as you write
5. Export when ready to publish online

## Tips for Blog Writing
- Use descriptive post titles for better SEO
- Add relevant tags to improve discoverability
- Include images in \`assets/images/\` and reference them in posts
- Review the metadata template for SEO optimization
- Keep drafts organized and publish regularly

Happy blogging! 📝✨

---
*Created with Writers CLI - Blog Mode*
`;
}

function generateBlogPostTemplate(projectInfo) {
  const today = new Date().toISOString().split('T')[0];

  return `---
title: "Your Post Title Here"
date: ${today}
author: ${projectInfo.author}
${projectInfo.useCategories ? 'category: "general"' : ''}
${projectInfo.useTags ? 'tags: ["tag1", "tag2"]' : ''}
excerpt: "A brief description of your post for SEO and social sharing"
published: false
slug: "your-post-slug"
---

# Your Post Title Here

## Introduction

Write your engaging introduction here. This should hook your readers and give them a reason to continue reading.

## Main Content

### Subheading 1

Your main content goes here. Use markdown formatting for:

- **Bold text** for emphasis
- *Italic text* for subtle emphasis
- \`Code snippets\` for technical content
- Links: [Link text](https://example.com)

### Subheading 2

More content here. You can include:

1. Numbered lists
2. For step-by-step instructions
3. Or sequential content

### Images and Media

To include images, place them in \`assets/images/\` and reference them like:

![Alt text](../assets/images/your-image.jpg)

### Code Blocks

For code examples:

\`\`\`javascript
function example() {
    console.log("Hello, blog readers!");
}
\`\`\`

## Conclusion

Wrap up your post with key takeaways or a call to action.

---

*Published on ${projectInfo.blogTitle}*
`;
}

function generateMetadataTemplate(projectInfo) {
  return JSON.stringify({
    "title": "Post title for SEO",
    "description": "Meta description for search engines (150-160 characters)",
    "keywords": ["keyword1", "keyword2", "keyword3"],
    "author": projectInfo.author,
    "date": "YYYY-MM-DD",
    "category": projectInfo.useCategories ? "general" : null,
    "tags": projectInfo.useTags ? ["tag1", "tag2"] : null,
    "featuredImage": "path/to/featured-image.jpg",
    "socialImage": "path/to/social-sharing-image.jpg",
    "published": false,
    "slug": "url-friendly-post-slug",
    "excerpt": "Brief excerpt for previews and social sharing",
    "readingTime": "estimated-minutes",
    "wordCount": 0,
    "lastModified": "YYYY-MM-DD HH:MM:SS"
  }, null, 2);
}

function generateCategoriesReadme() {
  return `# Blog Categories

This folder organizes your blog posts by category. Each category can have its own subfolder.

## Usage

1. Create category folders as needed (e.g., \`technology/\`, \`personal/\`, \`tutorials/\`)
2. Move or copy published posts into appropriate category folders
3. Use category names in your post frontmatter
4. Export by category for themed content

## Tips

- Use clear, descriptive category names
- Keep categories broad enough to have multiple posts
- Consider your blog's main themes when creating categories
- Update post metadata when moving between categories
`;
}

module.exports = initBlogCommand;
