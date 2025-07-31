const chalk = require("chalk");
const inquirer = require("inquirer");
const fs = require("fs").promises;
const path = require("path");
const projectManager = require("../utils/project");

/**
 * Simplified short story initialization
 * Creates a minimal, focused project structure
 */
async function initShortCommand(options) {
  console.log(chalk.cyan.bold(`
✨ Simple Short Story Setup
Creating a focused writing environment...
`));

  // Get basic project info
  const projectInfo = await gatherSimpleProjectInfo(options);

  // Create simplified project structure
  await createSimpleProject(projectInfo);

  console.log(chalk.green.bold(`
🎉 Your short story project "${projectInfo.name}" is ready!

Quick start:
${chalk.cyan("cd " + projectInfo.name)}
${chalk.cyan("writers write")}     # Start writing your first story

That's it! Keep it simple and focus on your stories.
`));
}

async function gatherSimpleProjectInfo(options) {
  const questions = [];

  if (!options.name) {
    questions.push({
      type: "input",
      name: "name",
      message: "Project name:",
      default: "my-stories",
      validate: input => input.trim().length > 0 || "Name cannot be empty"
    });
  }

  if (!options.author) {
    questions.push({
      type: "input",
      name: "author",
      message: "Your name:",
      validate: input => input.trim().length > 0 || "Author name cannot be empty"
    });
  }

  const answers = questions.length > 0 ? await inquirer.prompt(questions) : {};

  return {
    name: options.name || answers.name,
    author: options.author || answers.author,
    type: "simple-short-story"
  };
}

async function createSimpleProject(projectInfo) {
  const projectDir = projectInfo.name;

  // Create main directory
  await fs.mkdir(projectDir, { recursive: true });

  // Create simple folder structure
  const folders = ["drafts", "finished", "exports"];
  for (const folder of folders) {
    await fs.mkdir(path.join(projectDir, folder), { recursive: true });
  }

  // Create simple config
  const config = {
    name: projectInfo.name,
    author: projectInfo.author,
    type: "simple-short-story",
    created: new Date().toISOString(),
    version: "2.0"
  };

  await fs.writeFile(
    path.join(projectDir, "writers.config.json"),
    JSON.stringify(config, null, 2)
  );

  // Create simple README
  const readme = generateSimpleReadme(projectInfo);
  await fs.writeFile(path.join(projectDir, "README.md"), readme);

  // Create .gitignore
  const gitignore = `# Writers CLI
exports/
.DS_Store
*.bak
session-notes/
`;
  await fs.writeFile(path.join(projectDir, ".gitignore"), gitignore);
}

function generateSimpleReadme(projectInfo) {
  return `# ${projectInfo.name}

**Author:** ${projectInfo.author}
**Type:** Simple Short Story Project
**Created:** ${new Date().toLocaleDateString()}

## Your Writing Space

This is your focused short story workspace. Keep it simple!

### Folders
- \`drafts/\` - Stories you're working on
- \`finished/\` - Completed stories ready for submission
- \`exports/\` - Submission-ready files (auto-generated)

### Quick Commands
\`\`\`bash
writers write           # Start writing (shows menu of stories)
writers write "My Story" # Write a specific story
writers list            # See all your stories
writers stats           # Check word counts and progress
writers export "My Story" # Create submission-ready file
\`\`\`

### Getting Started
1. Run \`writers write\` to start your first story
2. Write in the editor that opens
3. When finished, move the file from \`drafts/\` to \`finished/\`
4. Use \`writers export\` to create clean submission files

Happy writing! ✍️

---
*Created with Writers CLI - Simple Short Story Mode*
`;
}

module.exports = initShortCommand;
