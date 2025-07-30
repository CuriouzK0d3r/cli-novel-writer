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
    "notes",
  ];

  // Try exact match first
  for (const category of categories) {
    const files = await projectManager.getFiles(category);

    // Try exact name match
    let file = files.find(
      (f) => f.name === target || f.name.toLowerCase() === target.toLowerCase(),
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
  }

  // Try with common prefixes
  const prefixes = ["chapter", "scene", "character"];
  for (const prefix of prefixes) {
    if (target.startsWith(prefix)) {
      const name = target.substring(prefix.length).replace(/^\d+/, "").trim();
      const category = prefix + "s";
      const files = await projectManager.getFiles(category);

      const file = files.find((f) =>
        f.name.toLowerCase().includes(name.toLowerCase()),
      );

      if (file) {
        return { ...file, category };
      }
    }
  }

  return null;
}

/**
 * Show file selection menu
 */
async function selectFileToEdit() {
  const allFiles = [];

  // Get files from all categories
  const categories = [
    { name: "chapters", icon: "📖", color: "blue" },
    { name: "scenes", icon: "🎬", color: "green" },
    { name: "characters", icon: "👤", color: "yellow" },
    { name: "shortstories", icon: "📚", color: "cyan" },
    { name: "notes", icon: "📝", color: "magenta" },
  ];

  for (const category of categories) {
    const files = await projectManager.getFiles(category.name);
    for (const file of files) {
      const colorFn = chalk[category.color] || chalk.white;
      allFiles.push({
        name: `${category.icon} ${colorFn(category.name.slice(0, -1))}: ${file.name}`,
        value: file.path,
        short: file.name,
      });
    }
  }

  if (allFiles.length === 0) {
    console.log(chalk.yellow('No files found. Create one with "writers new"'));
    return null;
  }

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
    // Create the file using the existing new command logic
    const newCommand = require("./new");
    const pluralType =
      answers.type === "shortstory" ? "shortstories" : answers.type + "s";
    const result = await projectManager.createFile(
      pluralType,
      answers.name,
      "", // No template for now
    );

    console.log(
      chalk.green(`✅ Created ${answers.type}: ${chalk.bold(result.name)}`),
    );
    return result.path;
  } catch (error) {
    console.error(chalk.red("❌ Error creating file:"), error.message);
    return null;
  }
}

module.exports = editCommand;
