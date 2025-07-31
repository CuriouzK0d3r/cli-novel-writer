const chalk = require("chalk");
const inquirer = require("inquirer");
const fs = require("fs").promises;
const path = require("path");

/**
 * Smart write command for simplified short story workflow
 * Handles file discovery, menu selection, and new file creation
 */
async function smartWriteCommand(storyName, options = {}) {
  try {
    // If specific story name provided, try to find it
    if (storyName) {
      const storyPath = await findStoryFile(storyName);
      if (storyPath) {
        console.log(chalk.blue(`Opening: ${path.basename(storyPath)}`));
        await openStoryForEditing(storyPath, options);
        return;
      } else {
        // Story doesn't exist, offer to create it
        const { createNew } = await inquirer.prompt([{
          type: "confirm",
          name: "createNew",
          message: `Story "${storyName}" not found. Create it?`,
          default: true
        }]);

        if (createNew) {
          const newStoryPath = await createNewStory(storyName);
          await openStoryForEditing(newStoryPath, options);
          return;
        }
      }
    }

    // No story name provided or creation declined - show menu
    await showStoryMenu(options);

  } catch (error) {
    console.error(chalk.red("Error in write command:"), error.message);
  }
}

async function findStoryFile(storyName) {
  const searchDirs = ["drafts", "finished"];
  const extensions = [".md", ".txt", ""];

  // Normalize the story name
  const normalizedName = storyName.toLowerCase().replace(/\s+/g, "-");

  for (const dir of searchDirs) {
    if (!(await dirExists(dir))) continue;

    const files = await fs.readdir(dir);

    // Try exact match first
    for (const ext of extensions) {
      const exactMatch = files.find(file =>
        file.toLowerCase() === normalizedName + ext ||
        file.toLowerCase() === normalizedName + ".md"
      );
      if (exactMatch) {
        return path.join(dir, exactMatch);
      }
    }

    // Try partial match
    const partialMatch = files.find(file =>
      file.toLowerCase().includes(normalizedName) ||
      normalizedName.includes(file.toLowerCase().replace(/\.[^.]+$/, ""))
    );
    if (partialMatch) {
      return path.join(dir, partialMatch);
    }
  }

  return null;
}

async function showStoryMenu(options) {
  const stories = await getAllStories();

  if (stories.length === 0) {
    console.log(chalk.yellow("No stories found. Let's create your first one!"));
    await createFirstStory(options);
    return;
  }

  console.log(chalk.cyan.bold("📚 Your Stories\n"));

  const choices = [
    ...stories.map(story => ({
      name: `${story.name} ${chalk.gray(`(${story.wordCount} words, ${story.status})`)}`,
      value: { type: "existing", path: story.path }
    })),
    new inquirer.Separator(),
    {
      name: chalk.green("✨ Create new story"),
      value: { type: "new" }
    }
  ];

  const { selection } = await inquirer.prompt([{
    type: "list",
    name: "selection",
    message: "What would you like to work on?",
    choices
  }]);

  if (selection.type === "existing") {
    await openStoryForEditing(selection.path, options);
  } else {
    await createFirstStory(options);
  }
}

async function getAllStories() {
  const stories = [];
  const searchDirs = [
    { dir: "drafts", status: "draft" },
    { dir: "finished", status: "finished" }
  ];

  for (const { dir, status } of searchDirs) {
    if (!(await dirExists(dir))) continue;

    const files = await fs.readdir(dir);
    const storyFiles = files.filter(file =>
      file.endsWith('.md') || file.endsWith('.txt')
    );

    for (const file of storyFiles) {
      const filePath = path.join(dir, file);
      const stats = await fs.stat(filePath);
      const content = await fs.readFile(filePath, 'utf8');
      const wordCount = countWords(content);

      stories.push({
        name: file.replace(/\.[^.]+$/, "").replace(/-/g, " "),
        path: filePath,
        status,
        wordCount,
        modified: stats.mtime
      });
    }
  }

  // Sort by modification time (most recent first)
  return stories.sort((a, b) => b.modified - a.modified);
}

async function createFirstStory(options) {
  const { storyTitle } = await inquirer.prompt([{
    type: "input",
    name: "storyTitle",
    message: "Story title:",
    validate: input => input.trim().length > 0 || "Title cannot be empty"
  }]);

  const storyPath = await createNewStory(storyTitle);
  await openStoryForEditing(storyPath, options);
}

async function createNewStory(title) {
  // Ensure drafts directory exists
  await fs.mkdir("drafts", { recursive: true });

  // Create filename from title
  const filename = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const filePath = path.join("drafts", filename + ".md");

  // Create initial content
  const content = `# ${title}

*Started: ${new Date().toLocaleDateString()}*

---

`;

  await fs.writeFile(filePath, content);

  console.log(chalk.green(`✨ Created new story: ${title}`));
  console.log(chalk.gray(`   File: ${filePath}`));

  return filePath;
}

async function openStoryForEditing(filePath, options) {
  const { editor = "code" } = options;

  // Show current word count
  const content = await fs.readFile(filePath, 'utf8');
  const wordCount = countWords(content);

  console.log(chalk.blue(`📝 Opening: ${path.basename(filePath)}`));
  console.log(chalk.gray(`   Current word count: ${wordCount}`));

  // Open the file with the specified editor
  const { spawn } = require('child_process');
  const editorProcess = spawn(editor, [filePath], {
    stdio: 'inherit',
    cwd: process.cwd()
  });

  editorProcess.on('error', (err) => {
    console.error(chalk.red(`Failed to open ${editor}:`), err.message);
    console.log(chalk.yellow(`Try: writers write-classic "${filePath}" --editor nano`));
  });
}

function countWords(text) {
  return text
    .replace(/^#.*$/gm, "") // Remove headers
    .replace(/^\*.*\*$/gm, "") // Remove italic metadata lines
    .replace(/---/g, "") // Remove dividers
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0).length;
}

async function dirExists(dirPath) {
  try {
    const stats = await fs.stat(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

module.exports = smartWriteCommand;
