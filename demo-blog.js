#!/usr/bin/env node

const chalk = require("chalk");
const fs = require("fs").promises;
const path = require("path");

async function demoBlog() {
  console.log(chalk.cyan.bold(`
🚀 Writers CLI Blog Mode Demo
Testing blog project creation and usage...
`));

  try {
    // Clean up any existing demo
    await cleanupDemo();

    console.log(chalk.blue("📝 Step 1: Creating blog project..."));
    await createDemoBlogProject();

    console.log(chalk.blue("📝 Step 2: Creating sample blog posts..."));
    await createSamplePosts();

    console.log(chalk.blue("📝 Step 3: Testing blog structure..."));
    await verifyBlogStructure();

    console.log(chalk.green.bold(`
✅ Blog demo completed successfully!

Your demo blog project is ready at: ./demo-blog-project

Try these commands:
${chalk.cyan("cd demo-blog-project")}
${chalk.cyan("writers new blogpost \"My First Post\"")}
${chalk.cyan("writers write \"my-first-post\"")}
${chalk.cyan("writers list")}
${chalk.cyan("writers stats")}

Blog project structure:
- drafts/ - Work in progress posts
- published/ - Finished posts ready to publish
- exports/ - Generated files for web publishing
- assets/images/ - Images and media
- templates/ - Post templates
`));

  } catch (error) {
    console.error(chalk.red("❌ Demo failed:"), error.message);
    process.exit(1);
  }
}

async function cleanupDemo() {
  try {
    await fs.rmdir("demo-blog-project", { recursive: true });
  } catch (error) {
    // Directory doesn't exist, that's fine
  }
}

async function createDemoBlogProject() {
  const projectDir = "demo-blog-project";

  // Create main directory
  await fs.mkdir(projectDir, { recursive: true });

  // Create blog folder structure
  const folders = [
    "drafts",
    "published",
    "exports",
    "assets/images",
    "templates",
    "categories"
  ];

  for (const folder of folders) {
    await fs.mkdir(path.join(projectDir, folder), { recursive: true });
  }

  // Create blog config
  const config = {
    name: "demo-blog-project",
    author: "Demo Author",
    type: "blog",
    blog: {
      title: "My Demo Blog",
      description: "A demonstration blog created with Writers CLI",
      url: "https://myblog.com",
      defaultFormat: "markdown",
      useCategories: true,
      useTags: true
    },
    created: new Date().toISOString(),
    version: "2.0"
  };

  await fs.writeFile(
    path.join(projectDir, "writers.config.json"),
    JSON.stringify(config, null, 2)
  );

  // Create README
  const readme = `# My Demo Blog

**Author:** Demo Author
**Type:** Blog Project
**Created:** ${new Date().toLocaleDateString()}
**URL:** https://myblog.com

## About
A demonstration blog created with Writers CLI

## Project Structure

### Folders
- \`drafts/\` - Blog posts you're working on
- \`published/\` - Finished posts ready for publishing
- \`exports/\` - Export-ready files (HTML, markdown, etc.)
- \`assets/images/\` - Images and media for your posts
- \`templates/\` - Post templates and metadata schemas
- \`categories/\` - Organized posts by category

### Writing Workflow
1. **Create a new post**: \`writers new blogpost "My Post Title"\`
2. **Write your post**: \`writers write "my-post-title"\`
3. **Review and edit**: Posts auto-save in \`drafts/\`
4. **Publish**: Move from \`drafts/\` to \`published/\` when ready
5. **Export**: \`writers export "my-post-title"\` to generate web-ready files

Happy blogging! 📝✨

---
*Created with Writers CLI - Blog Mode*
`;

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

  console.log(chalk.green("  ✅ Blog project structure created"));
}

async function createSamplePosts() {
  const projectDir = "demo-blog-project";

  // Create sample blog posts
  const posts = [
    {
      filename: "welcome-to-my-blog.md",
      content: `---
title: "Welcome to My Blog"
date: ${new Date().toISOString().split('T')[0]}
author: Demo Author
category: "general"
tags: ["welcome", "introduction", "blogging"]
excerpt: "Welcome to my new blog! Let me tell you a bit about what you can expect."
published: false
slug: "welcome-to-my-blog"
---

# Welcome to My Blog

## Hello, World!

Welcome to my new blog! I'm excited to share my thoughts, experiences, and knowledge with you.

## What You Can Expect

This blog will cover:

- **Technology trends** and insights
- **Personal experiences** and lessons learned
- **Tutorials** and how-to guides
- **Reviews** of tools and products I use

## Why I Started Blogging

I believe in the power of sharing knowledge and connecting with others who share similar interests.

## Get in Touch

Feel free to reach out if you have questions or suggestions for future posts!

---

*Thanks for reading! More posts coming soon.*
`
    },
    {
      filename: "getting-started-with-markdown.md",
      content: `---
title: "Getting Started with Markdown: A Beginner's Guide"
date: ${new Date().toISOString().split('T')[0]}
author: Demo Author
category: "tutorials"
tags: ["markdown", "tutorial", "writing"]
excerpt: "Learn the basics of Markdown formatting in this comprehensive beginner's guide."
published: false
slug: "getting-started-with-markdown"
difficulty: "beginner"
estimatedTime: "15 minutes"
---

# Getting Started with Markdown: A Beginner's Guide

## What is Markdown?

Markdown is a lightweight markup language that allows you to format text using simple syntax.

## Basic Syntax

### Headers

\`\`\`markdown
# H1 Header
## H2 Header
### H3 Header
\`\`\`

### Text Formatting

- **Bold text**: \`**bold**\`
- *Italic text*: \`*italic*\`
- \`Code\`: \`\`code\`\`

### Lists

#### Unordered Lists
\`\`\`markdown
- Item 1
- Item 2
- Item 3
\`\`\`

#### Ordered Lists
\`\`\`markdown
1. First item
2. Second item
3. Third item
\`\`\`

### Links and Images

- Links: \`[Link text](https://example.com)\`
- Images: \`![Alt text](image.jpg)\`

## Why Use Markdown?

1. **Simple syntax** - Easy to learn and use
2. **Portable** - Works everywhere
3. **Readable** - Even the raw text is easy to read
4. **Versatile** - Converts to HTML, PDF, and more

## Conclusion

Markdown is an essential skill for modern content creation. Start using it today!

---

*Happy writing with Markdown!*
`
    },
    {
      filename: "my-favorite-productivity-tools.md",
      content: `---
title: "My Top 5 Productivity Tools for 2024"
date: ${new Date().toISOString().split('T')[0]}
author: Demo Author
category: "reviews"
tags: ["productivity", "tools", "reviews", "2024"]
excerpt: "Discover the 5 productivity tools that have transformed how I work and manage my time."
published: false
slug: "my-favorite-productivity-tools"
listType: "numbered"
---

# My Top 5 Productivity Tools for 2024

## Introduction

After trying dozens of productivity tools, I've narrowed down my favorites to these 5 essentials that actually make a difference.

## 1. Task Management: Todoist

**Why it's great:** Clean interface, natural language processing, and cross-platform sync.

**Best feature:** Smart scheduling that learns your patterns.

**Rating:** ⭐⭐⭐⭐⭐

## 2. Note-Taking: Obsidian

**Why it's great:** Powerful linking system and local storage.

**Best feature:** Graph view showing connections between notes.

**Rating:** ⭐⭐⭐⭐⭐

## 3. Time Tracking: RescueTime

**Why it's great:** Automatic tracking with detailed insights.

**Best feature:** Focus time blocking.

**Rating:** ⭐⭐⭐⭐☆

## 4. Writing: Writers CLI

**Why it's great:** Distraction-free writing environment.

**Best feature:** Integrated project management for writers.

**Rating:** ⭐⭐⭐⭐⭐

## 5. Calendar: Google Calendar

**Why it's great:** Universal compatibility and smart features.

**Best feature:** Multiple calendar overlay.

**Rating:** ⭐⭐⭐⭐☆

## Quick Summary

| Tool | Category | Price | Rating |
|------|----------|--------|--------|
| Todoist | Tasks | Free/Paid | 5/5 |
| Obsidian | Notes | Free | 5/5 |
| RescueTime | Tracking | Free/Paid | 4/5 |
| Writers CLI | Writing | Free | 5/5 |
| Google Calendar | Calendar | Free | 4/5 |

## Conclusion

The best productivity system is the one you actually use. Start with one tool and gradually build your system.

---

*What productivity tools do you swear by? Let me know in the comments!*
`
    }
  ];

  for (const post of posts) {
    await fs.writeFile(
      path.join(projectDir, "drafts", post.filename),
      post.content
    );
  }

  console.log(chalk.green("  ✅ Sample blog posts created"));
}

async function verifyBlogStructure() {
  const projectDir = "demo-blog-project";

  // Check that all expected folders exist
  const expectedFolders = [
    "drafts",
    "published",
    "exports",
    "assets/images",
    "templates",
    "categories"
  ];

  for (const folder of expectedFolders) {
    const folderPath = path.join(projectDir, folder);
    try {
      const stats = await fs.stat(folderPath);
      if (stats.isDirectory()) {
        console.log(chalk.green(`  ✅ ${folder}/ exists`));
      }
    } catch (error) {
      console.log(chalk.red(`  ❌ ${folder}/ missing`));
      throw new Error(`Missing folder: ${folder}`);
    }
  }

  // Check config file
  try {
    const configPath = path.join(projectDir, "writers.config.json");
    const configContent = await fs.readFile(configPath, "utf8");
    const config = JSON.parse(configContent);

    if (config.type === "blog") {
      console.log(chalk.green("  ✅ Blog configuration valid"));
    } else {
      throw new Error("Invalid blog configuration");
    }
  } catch (error) {
    console.log(chalk.red("  ❌ Configuration error"));
    throw error;
  }

  // Check sample posts
  const draftsPath = path.join(projectDir, "drafts");
  const files = await fs.readdir(draftsPath);

  if (files.length >= 3) {
    console.log(chalk.green(`  ✅ ${files.length} sample posts created`));
  } else {
    throw new Error("Not enough sample posts created");
  }

  console.log(chalk.green("  ✅ Blog structure verification complete"));
}

// Run the demo
if (require.main === module) {
  demoBlog().catch(error => {
    console.error(chalk.red("Demo failed:"), error);
    process.exit(1);
  });
}

module.exports = demoBlog;
