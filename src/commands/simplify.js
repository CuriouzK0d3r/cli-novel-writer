const chalk = require("chalk");
const fs = require("fs").promises;
const path = require("path");

/**
 * Simplification command to migrate complex projects to simple structure
 */
async function simplifyCommand(options = {}) {
  console.log(chalk.cyan.bold(`
🧹 Project Simplification
Converting to streamlined short story workflow...
`));

  // Check if this is a writers project
  const configPath = "writers.config.json";
  let config;

  try {
    const configContent = await fs.readFile(configPath, 'utf8');
    config = JSON.parse(configContent);
  } catch (error) {
    console.log(chalk.red("❌ No writers.config.json found. Run this in a Writers CLI project."));
    return;
  }

  // Create backup of current structure
  console.log(chalk.yellow("📦 Creating backup..."));
  await createBackup();

  // Analyze current structure
  const currentStructure = await analyzeCurrentStructure();
  console.log(chalk.blue(`Found ${currentStructure.storyFiles.length} story files across ${currentStructure.directories.length} directories`));

  // Create simplified structure
  console.log(chalk.yellow("🔄 Creating simplified structure..."));
  await createSimplifiedStructure();

  // Move and organize files
  console.log(chalk.yellow("📁 Organizing story files..."));
  await organizeStoryFiles(currentStructure.storyFiles);

  // Update config
  config.type = "simple-short-story";
  config.simplified = new Date().toISOString();
  await fs.writeFile(configPath, JSON.stringify(config, null, 2));

  // Create new simplified README
  console.log(chalk.yellow("📄 Updating documentation..."));
  await createSimplifiedReadme(config);

  console.log(chalk.green.bold(`
✅ Simplification Complete!

Your project now has a clean, focused structure:
${chalk.blue("drafts/")}     - Work in progress stories
${chalk.blue("finished/")}   - Completed stories
${chalk.blue("exports/")}    - Submission-ready files

${chalk.cyan("Quick start:")}
${chalk.cyan("writers write")}     # See all your stories and start writing

${chalk.gray("Backup saved in: backup-" + new Date().toISOString().split('T')[0] + "/")}
`));
}

async function createBackup() {
  const backupDir = `backup-${new Date().toISOString().split('T')[0]}`;
  await fs.mkdir(backupDir, { recursive: true });

  // Copy all current files and folders to backup
  const items = await fs.readdir(".");
  for (const item of items) {
    if (item.startsWith("backup-") || item === ".git") continue;

    const stats = await fs.stat(item);
    if (stats.isDirectory()) {
      await copyDirectory(item, path.join(backupDir, item));
    } else {
      await fs.copyFile(item, path.join(backupDir, item));
    }
  }
}

async function copyDirectory(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function analyzeCurrentStructure() {
  const storyFiles = [];
  const directories = [];

  // Look for story files in common directories
  const searchDirs = [
    "chapters", "scenes", "shortstories", "stories", "drafts",
    "notes", "character-notes", "submission-ready", "exercises",
    "prompts", "revisions", "research"
  ];

  for (const dir of searchDirs) {
    try {
      const stats = await fs.stat(dir);
      if (stats.isDirectory()) {
        directories.push(dir);
        const files = await findStoryFilesInDirectory(dir);
        storyFiles.push(...files.map(file => ({ file, originalDir: dir })));
      }
    } catch {
      // Directory doesn't exist, skip
    }
  }

  return { storyFiles, directories };
}

async function findStoryFilesInDirectory(dir) {
  const files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.txt'))) {
      files.push(path.join(dir, entry.name));
    }
  }

  return files;
}

async function createSimplifiedStructure() {
  const newDirs = ["drafts", "finished", "exports"];

  for (const dir of newDirs) {
    await fs.mkdir(dir, { recursive: true });
  }
}

async function organizeStoryFiles(storyFiles) {
  for (const { file, originalDir } of storyFiles) {
    const content = await fs.readFile(file, 'utf8');
    const isComplete = await determineIfComplete(content, file);

    const fileName = path.basename(file);
    const targetDir = isComplete ? "finished" : "drafts";
    const targetPath = path.join(targetDir, fileName);

    // Avoid overwriting files with same name
    let finalPath = targetPath;
    let counter = 1;
    while (await fileExists(finalPath)) {
      const name = path.parse(fileName).name;
      const ext = path.parse(fileName).ext;
      finalPath = path.join(targetDir, `${name}-${counter}${ext}`);
      counter++;
    }

    await fs.copyFile(file, finalPath);
    console.log(chalk.gray(`   Moved: ${file} → ${finalPath}`));
  }
}

async function determineIfComplete(content, filePath) {
  // Simple heuristics to determine if a story is complete
  const wordCount = content.split(/\s+/).length;
  const hasEnding = /\b(end|ending|concluded|finished|the end)\b/i.test(content.toLowerCase());
  const isInCompletedDir = filePath.includes("stories") ||
                          filePath.includes("submission-ready") ||
                          filePath.includes("complete");

  // Consider complete if:
  // - More than 500 words AND has ending markers, OR
  // - Was in a "completed" directory, OR
  // - More than 2000 words (assume longer pieces are more likely complete)
  return (wordCount > 500 && hasEnding) || isInCompletedDir || wordCount > 2000;
}

async function createSimplifiedReadme(config) {
  const readme = `# ${config.name}

**Author:** ${config.author}
**Type:** Simple Short Story Project
**Simplified:** ${new Date().toLocaleDateString()}

## Your Simplified Writing Space

This project has been streamlined for focused short story writing.

### Structure
- \`drafts/\` - Stories you're working on
- \`finished/\` - Completed stories ready for submission
- \`exports/\` - Submission-ready files (auto-generated)

### Quick Commands
\`\`\`bash
writers write           # Start writing (shows menu of stories)
writers list            # See all your stories
writers stats           # Check word counts and progress
writers export "Story"  # Create submission-ready file
\`\`\`

### What Changed
- All story files consolidated into \`drafts/\` and \`finished/\`
- Complex folder structure simplified
- Advanced features still available but hidden by default
- Original structure backed up in \`backup-*/\` folder

Happy writing! ✍️

---
*Simplified with Writers CLI v2.0*
`;

  await fs.writeFile("README.md", readme);
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

module.exports = simplifyCommand;
