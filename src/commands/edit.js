const chalk = require("chalk");
const inquirer = require("inquirer");
const WritersEditor = require("../editor");
const projectManager = require("../utils/project");

async function editCommand(target, options) {
  try {
    // Check if in a writers project
    if (!projectManager.isWritersProject()) {
      console.log(
        chalk.red(
          '❌ Not a Writers project. Run "writers init" to initialize.',
        ),
      );
      return;
    }

    let filePath = null;

    // If target is provided, find the file
    if (target) {
      const fileInfo = await findFile(target);
      if (!fileInfo) {
        console.log(chalk.red(`❌ File not found: ${target}`));
        console.log(
          chalk.yellow('💡 Use "writers list" to see available files'),
        );
        console.log(chalk.yellow('💡 Use "writers new" to create a new file'));
        return;
      }
      filePath = fileInfo.path;
    } else {
      // Show file selection menu
      filePath = await selectFileToEdit();
      if (!filePath) {
        console.log(chalk.gray("No file selected for editing."));
        return;
      }
    }

    // Show ASCII art banner before launching the editor
    console.log(
      chalk.bold.cyan(`
        __  _____  __   _   ______ _    __________       ________    ____
       /  |/  /\ \/ /  / | / / __ \ |  / / ____/ /      / ____/ /   /  _/
      / /|_/ /  \  /  /  |/ / / / / | / / __/ / /      / /   / /    / /
     / /  / /   / /  / /|  / /_/ /| |/ / /___/ /___   / /___/ /____/ /
    /_/  /_/   /_/  /_/ |_/\____/ |___/_____/_____/   \____/_____/___/

${chalk.magenta("        ✦✦✦  Welcome to your CLI Novel Adventure!  ✦✦✦")}
`),
    );

    // Small delay to let user read the message
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Launch the editor
    const editor = new WritersEditor();
    await editor.launch(filePath);
  } catch (error) {
    console.error(chalk.red("❌ Error launching editor:"), error.message);
    process.exit(1);
  }
}

/**
 * Find file by name or partial match
 */
async function findFile(target) {
  const categories = [
    "chapters",
    "scenes",
    "characters",
    "shortstories",
    "stories", // Enhanced short story workflow
    "drafts",
    "submission-ready",
    "exercises",
    "prompts",
    "notes",
  ];

  // Try exact match first
  for (const category of categories) {
    try {
      const files = await getFilesFromDirectory(category);

      // Try exact name match
      let file = files.find(
        (f) =>
          f.name === target || f.name.toLowerCase() === target.toLowerCase(),
      );

      if (file) {
        return { ...file, category };
      }

      // Try partial match
      file = files.find(
        (f) =>
          f.name.toLowerCase().includes(target.toLowerCase()) ||
          projectManager.sanitizeFileName(f.name) === target,
      );

      if (file) {
        return { ...file, category };
      }
    } catch (error) {
      // Directory might not exist, continue to next
      continue;
    }
  }

  // Try with common prefixes
  const prefixes = [
    "chapter",
    "scene",
    "character",
    "story",
    "draft",
    "exercise",
    "prompt",
  ];
  for (const prefix of prefixes) {
    if (target.startsWith(prefix)) {
      const name = target.substring(prefix.length).replace(/^\d+/, "").trim();
      const category = prefix === "story" ? "stories" : prefix + "s";

      try {
        const files = await getFilesFromDirectory(category);
        const file = files.find((f) =>
          f.name.toLowerCase().includes(name.toLowerCase()),
        );

        if (file) {
          return { ...file, category };
        }
      } catch (error) {
        // Directory might not exist, continue
        continue;
      }
    }
  }

  return null;
}

/**
 * Get files from directory (handles both project manager and direct file system access)
 */
async function getFilesFromDirectory(category) {
  // First try the project manager
  try {
    return await projectManager.getFiles(category);
  } catch (error) {
    // If that fails, try direct file system access for enhanced directories
    const fs = require("fs").promises;
    const path = require("path");

    try {
      const files = await fs.readdir(category);
      const markdownFiles = files.filter((file) => file.endsWith(".md"));

      return markdownFiles.map((file) => ({
        name: path.basename(file, ".md"),
        path: path.join(category, file),
        fullName: file,
      }));
    } catch (fsError) {
      return [];
    }
  }
}

/**
 * Show file selection menu
 */
async function selectFileToEdit() {
  const allFiles = [];

  // Get files from all categories (including enhanced short story directories)
  const categories = [
    { name: "chapters", icon: "📖", color: "blue" },
    { name: "scenes", icon: "🎬", color: "green" },
    { name: "characters", icon: "👤", color: "yellow" },
    { name: "shortstories", icon: "📚", color: "cyan" },
    { name: "stories", icon: "📗", color: "cyan" },
    { name: "drafts", icon: "📝", color: "yellow" },
    { name: "submission-ready", icon: "📤", color: "green" },
    { name: "exercises", icon: "🏋️", color: "orange" },
    { name: "prompts", icon: "💭", color: "purple" },
    { name: "notes", icon: "📝", color: "magenta" },
  ];

  for (const category of categories) {
    try {
      const files = await getFilesFromDirectory(category.name);
      for (const file of files) {
        const colorFn = chalk[category.color] || chalk.white;
        const categoryLabel =
          category.name === "submission-ready"
            ? "ready"
            : category.name === "shortstories"
              ? "short story"
              : category.name.slice(0, -1);
        allFiles.push({
          name: `${category.icon} ${colorFn(categoryLabel)}: ${file.name}`,
          value: file.path,
          short: file.name,
        });
      }
    } catch (error) {
      // Directory might not exist, skip it
      continue;
    }
  }

  if (allFiles.length === 0) {
    console.log(chalk.yellow('No files found. Create one with "writers new"'));
    return null;
  }

  // Sort files by category and name
  allFiles.sort((a, b) => a.name.localeCompare(b.name));

  // Add option to create new file
  allFiles.push(new inquirer.Separator());
  allFiles.push({
    name: chalk.green("+ Create new file"),
    value: "CREATE_NEW",
  });
  allFiles.push({
    name: chalk.gray("Cancel"),
    value: null,
  });

  const { selectedFile } = await inquirer.prompt([
    {
      type: "list",
      name: "selectedFile",
      message: "Select a file to edit:",
      choices: allFiles,
      pageSize: 15,
    },
  ]);

  if (selectedFile === "CREATE_NEW") {
    return await createNewFileDialog();
  }

  return selectedFile;
}

/**
 * Show dialog to create a new file
 */
async function createNewFileDialog() {
  const questions = [
    {
      type: "list",
      name: "type",
      message: "What type of file would you like to create?",
      choices: [
        { name: "📖 Chapter", value: "chapter" },
        { name: "🎬 Scene", value: "scene" },
        { name: "👤 Character", value: "character" },
        { name: "📚 Short Story", value: "shortstory" },
        { name: "📗 Story (enhanced)", value: "story" },
        { name: "📝 Draft", value: "draft" },
        { name: "🏋️ Exercise", value: "exercise" },
        { name: "💭 Prompt Response", value: "prompt" },
        { name: "📝 Note", value: "note" },
      ],
    },
    {
      type: "input",
      name: "name",
      message: "Enter the name:",
      validate: (input) => {
        if (input.trim().length === 0) {
          return "Name cannot be empty";
        }
        return true;
      },
    },
  ];

  const answers = await inquirer.prompt(questions);

  try {
    // Handle different file types appropriately
    let result;

    if (["story", "draft", "exercise", "prompt"].includes(answers.type)) {
      // For enhanced short story types, create directly in the file system
      const fs = require("fs").promises;
      const path = require("path");

      const dirMap = {
        story: "stories",
        draft: "drafts",
        exercise: "exercises",
        prompt: "prompts",
      };

      const dir = dirMap[answers.type];
      await fs.mkdir(dir, { recursive: true });

      const fileName = `${projectManager.sanitizeFileName(answers.name)}.md`;
      const filePath = path.join(dir, fileName);

      // Generate appropriate template content
      const content = generateEnhancedTemplate(answers.type, answers.name);
      await fs.writeFile(filePath, content);

      result = {
        name: answers.name,
        path: filePath,
        type: answers.type,
      };
    } else {
      // Use existing project manager for traditional types
      const pluralType =
        answers.type === "shortstory" ? "shortstories" : answers.type + "s";
      result = await projectManager.createFile(
        pluralType,
        answers.name,
        "", // No template for now
      );
    }

    console.log(
      chalk.green(`✅ Created ${answers.type}: ${chalk.bold(result.name)}`),
    );
    return result.path;
  } catch (error) {
    console.error(chalk.red("❌ Error creating file:"), error.message);
    return null;
  }
}

/**
 * Generate templates for enhanced short story file types
 */
function generateEnhancedTemplate(type, name) {
  const timestamp = new Date().toISOString().split("T")[0];

  switch (type) {
    case "story":
      return `# ${name}

*Created: ${timestamp}*

---

## Story Information
- **Genre:**
- **Target Length:**
- **Status:** Planning
- **Theme:**

## Summary
[Brief description of your story concept]

## Characters
**Main Character:**
- **Name:**
- **Goal:**
- **Conflict:**

## Plot Outline
- **Opening:**
- **Inciting Incident:**
- **Climax:**
- **Resolution:**

---

## Story Content

[Begin writing your story here...]

`;

    case "draft":
      return `# ${name} - Draft

*Created: ${timestamp}*

---

## Draft Notes
- **Version:** 1.0
- **Focus:** [What are you working on in this draft?]
- **Target:** [Word count or completion goal]

## Story Content

[Start writing your draft here...]

`;

    case "exercise":
      return `# Writing Exercise: ${name}

*Created: ${timestamp}*

---

## Exercise Goals
- **Skill Focus:** [What are you practicing?]
- **Time Limit:** [How long to spend?]
- **Success Criteria:** [How will you know you succeeded?]

## Exercise Content

[Begin your writing exercise here...]

## Reflection
[What did you learn from this exercise?]

`;

    case "prompt":
      return `# Prompt Response: ${name}

*Created: ${timestamp}*

---

## Prompt
[Write the prompt that inspired this piece]

## Response Goals
- **Length Target:**
- **Time Limit:**
- **Focus:**

## Story Content

[Write your response here...]

`;

    default:
      return `# ${name}

*Created: ${timestamp}*

---

[Content goes here...]

`;
  }
}

module.exports = editCommand;
