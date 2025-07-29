const chalk = require("chalk");
const inquirer = require("inquirer");
const { spawn } = require("child_process");
const fs = require("fs-extra");
const path = require("path");
const projectManager = require("../utils/project");
const markdownUtils = require("../utils/markdown");
const WritersEditor = require("../editor");

async function writeCommand(target, options) {
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

    const config = await projectManager.getConfig();

    // If no target specified, show available files
    if (!target) {
      target = await selectFileToEdit();
      if (!target) {
        console.log(chalk.gray("No file selected for editing."));
        return;
      }
    }

    // Find the file
    const fileInfo = await findFile(target);
    if (!fileInfo) {
      console.log(chalk.red(`❌ File not found: ${target}`));
      console.log(chalk.yellow('💡 Use "writers list" to see available files'));
      console.log(chalk.yellow('💡 Use "writers new" to create a new file'));
      return;
    }

    // Determine editor - offer built-in editor as option
    let editor = options.editor || config.settings?.defaultEditor;

    if (!editor) {
      const { editorChoice } = await inquirer.prompt([
        {
          type: "list",
          name: "editorChoice",
          message: "Which editor would you like to use?",
          choices: [
            { name: "📝 Writers Editor (built-in)", value: "writers-editor" },
            { name: "📄 Nano (simple)", value: "nano" },
            { name: "⚡ Vim (advanced)", value: "vim" },
            { name: "🆚 VS Code (if installed)", value: "code" },
            { name: "🖥️  System default", value: "default" },
          ],
          default: "writers-editor",
        },
      ]);
      editor = editorChoice;
    }

    console.log(
      chalk.blue(`📝 Opening ${chalk.bold(fileInfo.name)} in ${editor}...`),
    );
    console.log(chalk.gray(`   Path: ${fileInfo.path}`));

    // Create backup if enabled
    if (config.settings?.backups !== false) {
      await createBackup(fileInfo.path);
    }

    // Get initial word count
    const initialContent = await fs.readFile(fileInfo.path, "utf8");
    const initialWords = markdownUtils.countWords(initialContent);

    // Open in editor
    if (editor === "writers-editor") {
      await openInBuiltInEditor(fileInfo.path, initialWords);
    } else {
      await openInEditor(fileInfo.path, editor);
    }

    // Show post-edit statistics
    await showPostEditStats(fileInfo.path, initialWords);
  } catch (error) {
    console.error(
      chalk.red("❌ Error opening file for editing:"),
      error.message,
    );
  }
}

async function selectFileToEdit() {
  console.log(chalk.blue("📁 Select a file to edit:\n"));

  const allFiles = [];

  // Get files from all categories
  const categories = ["chapters", "scenes", "characters", "notes"];

  for (const category of categories) {
    const files = await projectManager.getFiles(category);
    for (const file of files) {
      allFiles.push({
        name: `${chalk.cyan(category.slice(0, -1))}: ${file.name}`,
        value: file.name,
        path: file.path,
        category,
      });
    }
  }

  if (allFiles.length === 0) {
    console.log(chalk.yellow('No files found. Create one with "writers new"'));
    return null;
  }

  const { selectedFile } = await inquirer.prompt([
    {
      type: "list",
      name: "selectedFile",
      message: "Choose a file to edit:",
      choices: [
        ...allFiles,
        new inquirer.Separator(),
        { name: "Cancel", value: null },
      ],
      pageSize: 15,
    },
  ]);

  return selectedFile;
}

async function findFile(target) {
  const categories = ["chapters", "scenes", "characters", "notes"];

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

async function createBackup(filePath) {
  try {
    const backupDir = "backups";
    await fs.ensureDir(backupDir);

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = path.basename(filePath, ".md");
    const backupPath = path.join(backupDir, `${fileName}-${timestamp}.md`);

    await fs.copy(filePath, backupPath);
    console.log(chalk.gray(`💾 Backup created: ${backupPath}`));
  } catch (error) {
    console.warn(chalk.yellow("⚠️  Could not create backup:", error.message));
  }
}

async function openInEditor(filePath, editor) {
  return new Promise((resolve, reject) => {
    let editorCommand;
    let editorArgs = [filePath];

    switch (editor.toLowerCase()) {
      case "nano":
        editorCommand = "nano";
        break;
      case "vim":
      case "vi":
        editorCommand = "vim";
        break;
      case "code":
      case "vscode":
        editorCommand = "code";
        editorArgs = ["-w", filePath]; // Wait for window to close
        break;
      case "emacs":
        editorCommand = "emacs";
        break;
      case "subl":
      case "sublime":
        editorCommand = "subl";
        editorArgs = ["-w", filePath];
        break;
      case "atom":
        editorCommand = "atom";
        editorArgs = ["-w", filePath];
        break;
      case "default":
        // Use system default editor
        editorCommand = process.env.EDITOR || process.env.VISUAL || "nano";
        break;
      default:
        editorCommand = editor;
    }

    const editorProcess = spawn(editorCommand, editorArgs, {
      stdio: "inherit",
      shell: true,
    });

    editorProcess.on("exit", (code) => {
      if (code === 0) {
        console.log(chalk.green("✅ File saved successfully!"));
        resolve();
      } else if (code === null) {
        // Process was killed
        console.log(chalk.yellow("⚠️  Editor was closed"));
        resolve();
      } else {
        reject(new Error(`Editor exited with code ${code}`));
      }
    });

    editorProcess.on("error", (error) => {
      if (error.code === "ENOENT") {
        console.error(chalk.red(`❌ Editor "${editorCommand}" not found.`));
        console.log(
          chalk.yellow("💡 Try: nano, vim, code, or set a custom editor"),
        );

        // Fallback to nano
        console.log(chalk.blue("🔄 Falling back to nano..."));
        const fallbackProcess = spawn("nano", [filePath], {
          stdio: "inherit",
        });

        fallbackProcess.on("exit", () => resolve());
        fallbackProcess.on("error", () => {
          reject(new Error("Could not open any editor"));
        });
      } else {
        reject(error);
      }
    });
  });
}

async function openInBuiltInEditor(filePath, initialWords) {
  try {
    console.log(chalk.blue("🚀 Launching Writers Editor..."));
    console.log(chalk.gray("Press F1 for help once the editor loads\n"));

    // Small delay to let user read the message
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Launch the built-in editor
    const editor = new WritersEditor();
    await editor.launch(filePath);

    // Show post-edit statistics after editor closes
    await showPostEditStats(filePath, initialWords);
  } catch (error) {
    console.error(
      chalk.red("❌ Error launching built-in editor:"),
      error.message,
    );
  }
}

async function showPostEditStats(filePath, initialWords) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    const finalWords = markdownUtils.countWords(content);
    const wordDifference = finalWords - initialWords;

    console.log("\n" + chalk.blue("📊 Writing Session Summary:"));

    if (wordDifference > 0) {
      console.log(chalk.green(`✨ Added ${wordDifference} words`));
    } else if (wordDifference < 0) {
      console.log(
        chalk.yellow(`✂️  Removed ${Math.abs(wordDifference)} words`),
      );
    } else {
      console.log(chalk.gray("📝 No word count change"));
    }

    console.log(chalk.gray(`📖 Total words: ${finalWords}`));

    const readingTime = markdownUtils.estimateReadingTime(content);
    console.log(chalk.gray(`⏱️  Reading time: ${readingTime}`));

    // Validate markdown
    const validation = markdownUtils.validateMarkdown(content);
    if (!validation.isValid) {
      console.log(chalk.red("\n⚠️  Markdown Issues Found:"));
      validation.errors.forEach((error) => {
        console.log(chalk.red(`   • ${error}`));
      });
    }

    if (validation.warnings.length > 0) {
      console.log(chalk.yellow("\n💡 Markdown Warnings:"));
      validation.warnings.forEach((warning) => {
        console.log(chalk.yellow(`   • ${warning}`));
      });
    }

    // Show project progress
    const stats = await projectManager.getProjectStats();
    const progress = Math.min(100, (stats.totalWords / stats.wordGoal) * 100);

    console.log(chalk.blue("\n🎯 Project Progress:"));
    console.log(
      chalk.gray(
        `   ${stats.totalWords.toLocaleString()} / ${stats.wordGoal.toLocaleString()} words (${progress.toFixed(1)}%)`,
      ),
    );

    // Progress bar
    const barLength = 20;
    const filledLength = Math.round((progress / 100) * barLength);
    const bar = "█".repeat(filledLength) + "░".repeat(barLength - filledLength);
    console.log(`   ${chalk.green(bar)} ${progress.toFixed(1)}%`);
  } catch (error) {
    console.warn(
      chalk.yellow("⚠️  Could not calculate statistics:", error.message),
    );
  }
}

module.exports = writeCommand;
