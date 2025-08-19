const fs = require("fs-extra");
const path = require("path");
const os = require("os");
const chalk = require("chalk");

class ProjectManager {
  constructor() {
    this.configFile = "writers.config.json";
    this.baseDir = process.env.WRITERS_PROJECT_DIR || process.cwd();
    this.projectStructure = {
      chapters: "chapters",
      scenes: "scenes",
      characters: "characters",
      notes: "notes",
      shortstories: "shortstories",
      stories: "stories",
      drafts: "drafts",
      "submission-ready": "submission-ready",
      exercises: "exercises",
      prompts: "prompts",
      exports: "exports",
    };
  }

  /**
   * Resolve a path relative to the current project base directory
   */
  resolvePath(...segments) {
    return path.resolve(this.baseDir, ...segments);
  }

  /**
   * Set the project base directory at runtime (e.g., from GUI)
   */
  setBaseDir(dir) {
    if (dir && typeof dir === "string") {
      this.baseDir = dir;
    }
  }

  /**
   * Check if current directory is a writers project
   */
  isWritersProject() {
    return fs.existsSync(this.resolvePath(this.configFile));
  }

  /**
   * Get project configuration
   */
  async getConfig() {
    if (!this.isWritersProject()) {
      throw new Error(
        'Not a writers project. Run "writers init" to initialize.',
      );
    }

    try {
      const config = await fs.readJson(this.resolvePath(this.configFile));
      return config;
    } catch (error) {
      throw new Error("Failed to read project configuration.");
    }
  }

  /**
   * Update project configuration
   */
  async updateConfig(updates) {
    const config = await this.getConfig();
    const newConfig = { ...config, ...updates };
    await fs.writeJson(this.resolvePath(this.configFile), newConfig, {
      spaces: 2,
    });
    return newConfig;
  }

  /**
   * Create project structure
   */
  async createProjectStructure() {
    for (const dir of Object.values(this.projectStructure)) {
      await fs.ensureDir(this.resolvePath(dir));
    }
  }

  /**
   * Initialize a new project
   */
  async initProject(options = {}) {
    if (this.isWritersProject()) {
      throw new Error("Already a writers project.");
    }

    const config = {
      name: options.name || path.basename(process.cwd()),
      author: options.author || "Unknown Author",
      created: new Date().toISOString(),
      version: "1.0.0",
      type: options.type || "novel",
      wordGoal: options.wordGoal || 50000,
      settings: {
        autoSave: true,
        backups: true,
        defaultEditor: options.editor || "nano",
      },
      structure:
        options.type === "blog"
          ? {
              posts: "posts",
              notes: "notes",
              exports: "exports",
              assets: "assets/images",
              templates: "templates",
            }
          : this.projectStructure,
    };

    // If blog project, override internal projectStructure so later calls use it
    if (options.type === "blog") {
      this.projectStructure = {
        posts: "posts",
        notes: "notes",
        exports: "exports",
        assets: "assets/images",
        templates: "templates",
      };
    }

    await fs.writeJson(this.resolvePath(this.configFile), config, {
      spaces: 2,
    });
    await this.createProjectStructure();

    // Create initial README
    const readme = this.generateReadme(config);
    await fs.writeFile(this.resolvePath("README.md"), readme);

    return config;
  }

  /**
   * Generate project README
   */
  generateReadme(config) {
    if ((config.type || "").toLowerCase() === "blog") {
      return `# ${config.name}

**Author:** ${config.author}
**Created:** ${new Date(config.created).toLocaleDateString()}
**Type:** Blog
**Word Goal:** ${config.wordGoal.toLocaleString()} words

Welcome to your blog project. Use the GUI or CLI to create and manage posts.

## Project Structure

- \`posts/\` - Your blog posts (Markdown). Each file represents a post.
- \`notes/\` - Ideas, outlines, research, and drafts not yet promoted to posts.
- \`assets/images/\` - Images and media you embed in posts.
- \`templates/\` - (Optional) Content or metadata templates.
- \`exports/\` - Generated/exported versions (HTML, PDF, etc.).

## Getting Started

1. Create a new post: \`writers new post "My First Post"\` or click "New Post" in the GUI.
2. Draft and edit in the GUI editor.
3. Export when ready.

Happy blogging!
`;
    }

    return `# ${config.name}

**Author:** ${config.author}
**Created:** ${new Date(config.created).toLocaleDateString()}
**Word Goal:** ${config.wordGoal.toLocaleString()} words

## Project Structure

- \`chapters/\` - Main story chapters
- \`scenes/\` - Individual scenes and drafts
- \`characters/\` - Character profiles and development
- \`notes/\` - Research, plot notes, and ideas
- \`shortstories/\` - Complete short stories
- \`exports/\` - Exported versions of your work

## Quick Start

- **Create a new chapter:** \`writers new chapter "Chapter Title"\`
- **Create a short story:** \`writers new shortstory "Story Title"\`
- **Start writing:** \`writers write chapter1\`
- **View statistics:** \`writers stats\`
- **Export your work:** \`writers export html\`

## Writing Progress

Use \`writers stats\` to track your progress toward your ${config.wordGoal.toLocaleString()} word goal.

---

*This project was created with Writers CLI - A tool for novelists and short story writers*
`;
  }

  /**
   * Get all files of a specific type
   */
  async getFiles(type) {
    const dir = this.projectStructure[type] || type;
    if (!(await fs.pathExists(this.resolvePath(dir)))) {
      return [];
    }

    const files = await fs.readdir(this.resolvePath(dir));
    const fileStats = await Promise.all(
      files.map(async (file) => {
        const filePath = this.resolvePath(dir, file);
        try {
          const stats = await fs.stat(filePath);
          return {
            name: path.basename(file, path.extname(file)),
            path: filePath,
            fullName: file,
            isDirectory: stats.isDirectory(),
            size: stats.size,
            modified: stats.mtime,
            created: stats.birthtime,
          };
        } catch (error) {
          console.error(`Error getting stats for ${filePath}:`, error);
          return null;
        }
      }),
    );

    // Filter out any null entries and directories, and sort by name
    return fileStats
      .filter((file) => file && !file.isDirectory)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Create a new file with template
   */
  async createFile(type, name, template = "") {
    const dir = this.projectStructure[type] || type;

    await fs.ensureDir(this.resolvePath(dir));
    const fileName = `${this.sanitizeFileName(name)}.md`;
    const filePath = this.resolvePath(dir, fileName);

    if (await fs.pathExists(filePath)) {
      throw new Error(`${type} "${name}" already exists.`);
    }

    const content = this.generateTemplate(type, name, template);
    await fs.writeFile(filePath, content);

    return {
      name,
      path: filePath,
      type,
    };
  }

  /**
   * Generate content template based on type
   */
  generateTemplate(type, name, customTemplate = "") {
    if (customTemplate) {
      return customTemplate;
    }

    const timestamp = new Date().toISOString().split("T")[0];

    switch (type) {
      case "chapters":
        return `# ${name}

*Created: ${timestamp}*

---

## Summary
Brief summary of what happens in this chapter.

## Notes
- Plot points
- Character development
- Important details

---

## Content

Write your chapter content here...

`;

      case "scenes":
        return `# ${name}

*Created: ${timestamp}*

**Setting:** Describe the location and time
**Characters:** List main characters in this scene
**Purpose:** What this scene accomplishes

---

Write your scene here...

`;

      case "characters":
        return `# ${name}

*Created: ${timestamp}*

## Basic Information
- **Full Name:**
- **Age:**
- **Occupation:**
- **Location:**

## Physical Description
- **Appearance:**
- **Distinguishing Features:**

## Personality
- **Traits:**
- **Motivations:**
- **Fears:**
- **Flaws:**

## Background
- **History:**
- **Family:**
- **Important Events:**

## Role in Story
- **Purpose:**
- **Character Arc:**
- **Relationships:**

## Notes
Additional notes and development ideas...

`;

      case "shortstories":
      case "stories":
        return `# ${name}

*Created: ${timestamp}*

---

## Story Information
- **Genre:**
- **Target Length:** (words)
- **Theme:**
- **Setting:**
- **Status:** Planning

## Summary
Brief one-sentence summary of the story.

## Characters
- **Protagonist:**
- **Supporting Characters:**

## Plot Structure
- **Opening:** How the story begins
- **Conflict:** Central problem or tension
- **Climax:** Peak moment
- **Resolution:** How it ends

## Notes
Story ideas, themes, and development notes...

---

## Story Content

Write your short story here...

`;

      case "drafts":
        return `# ${name} - Draft

*Created: ${timestamp}*

---

## Draft Information
- **Version:** 1.0
- **Status:** Drafting
- **Target Length:**
- **Genre:**

## Draft Notes
[What are you focusing on in this draft?]

## Story Content

Write your draft here...

`;

      case "exercises":
        return `# Writing Exercise: ${name}

*Created: ${timestamp}*

---

## Exercise Information
- **Skill Focus:** [What are you practicing?]
- **Time Limit:** [How long to spend?]
- **Success Criteria:** [How will you know you succeeded?]

## Exercise Content

[Begin your writing exercise here...]

## Reflection
[What did you learn from this exercise?]

`;

      case "prompts":
        return `# Prompt Response: ${name}

*Created: ${timestamp}*

---

## Prompt Information
- **Original Prompt:** [Write the prompt here]
- **Time Limit:**
- **Target Length:**

## Response

[Write your response here...]

`;

      case "submission-ready":
        return `# ${name}

*Created: ${timestamp}*
*Status: Submission Ready*

---

Write your polished story here...

`;

      default:
        return `# ${name}

*Created: ${timestamp}*

---

`;
    }
  }

  /**
   * Sanitize filename
   */
  sanitizeFileName(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim("-");
  }

  /**
   * Get project statistics
   */
  async getProjectStats() {
    const config = await this.getConfig();
    const isBlog = (config.type || "").toLowerCase() === "blog";
    const stats = {
      project: config.name,
      author: config.author,
      created: config.created,
      wordGoal: config.wordGoal,
      chapters: [],
      totalWords: 0,
      totalCharacters: 0,
      files: isBlog
        ? {
            posts: 0,
            notes: 0,
          }
        : {
            chapters: 0,
            scenes: 0,
            characters: 0,
            notes: 0,
            shortstories: 0,
          },
    };

    // Count files and words for each type
    for (const [type, dir] of Object.entries(this.projectStructure)) {
      if (type === "exports") continue;

      try {
        const files = await this.getFiles(type);
        stats.files[type] = files.length;

        for (const file of files) {
          try {
            const content = await fs.readFile(file.path, "utf8");
            const words = this.countWords(content);
            const characters = content.length;

            stats.totalWords += words;
            stats.totalCharacters += characters;

            if (type === "chapters") {
              stats.chapters.push({
                name: file.name,
                words,
                characters,
                path: file.path,
              });
            }
          } catch (error) {
            console.warn(chalk.yellow(`Warning: Could not read ${file.path}`));
          }
        }
      } catch (error) {
        // Directory might not exist, initialize with 0
        stats.files[type] = 0;
      }
    }

    stats.progress = Math.min(100, (stats.totalWords / stats.wordGoal) * 100);

    return stats;
  }

  /**
   * Count words in text
   */
  countWords(text) {
    // Remove markdown formatting and count words
    const cleanText = text
      .replace(/^#+ .*/gm, "") // Remove headers
      .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold
      .replace(/\*(.*?)\*/g, "$1") // Remove italic
      .replace(/`(.*?)`/g, "$1") // Remove code
      .replace(/\[(.*?)\]\(.*?\)/g, "$1") // Remove links
      .replace(/^\s*[-*+]\s+/gm, "") // Remove list markers
      .replace(/^\s*\d+\.\s+/gm, "") // Remove numbered lists
      .replace(/^\s*>/gm, "") // Remove blockquotes
      .replace(/---+/g, "") // Remove horizontal rules
      .trim();

    if (!cleanText) return 0;

    return cleanText.split(/\s+/).filter((word) => word.length > 0).length;
  }

  /**
   * Backup project
   */
  async createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupDir = `backups/backup-${timestamp}`;

    await fs.ensureDir("backups");
    await fs.copy(".", backupDir, {
      filter: (src) => {
        const relativePath = path.relative(".", src);
        return (
          !relativePath.startsWith("backups") &&
          !relativePath.startsWith("node_modules") &&
          !relativePath.startsWith(".git")
        );
      },
    });

    return backupDir;
  }

  /**
   * Export project structure as JSON
   */
  async exportStructure() {
    const stats = await this.getProjectStats();
    const structure = {};

    // Copy project structure as JSON
    for (const [type, dir] of Object.entries(this.projectStructure)) {
      if (type === "exports") continue;

      try {
        const files = await this.getFiles(type);
        structure[type] = [];

        for (const file of files) {
          try {
            const content = await fs.readFile(file.path, "utf8");
            structure[type].push({
              name: file.name,
              path: file.path,
              words: this.countWords(content),
              content: content,
            });
          } catch (error) {
            console.warn(chalk.yellow(`Warning: Could not read ${file.path}`));
          }
        }
      } catch (error) {
        // Directory might not exist, initialize empty array
        structure[type] = [];
      }
    }

    return {
      metadata: {
        project: stats.project,
        author: stats.author,
        created: stats.created,
        exported: new Date().toISOString(),
        totalWords: stats.totalWords,
        wordGoal: stats.wordGoal,
        progress: stats.progress,
      },
      structure,
    };
  }
}

module.exports = new ProjectManager();
