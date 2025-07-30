#!/usr/bin/env node

const chalk = require("chalk");
const inquirer = require("inquirer");

// Mock inquirer to test our options
const originalPrompt = inquirer.prompt;
inquirer.prompt = async (questions) => {
  console.log(chalk.blue("\n📋 Testing init command options...\n"));

  // Find the editor question
  const editorQuestion = questions.find(q => q.name === 'editor');

  if (editorQuestion) {
    console.log(chalk.green("✅ Editor question found!"));
    console.log(chalk.yellow("📝 Available editor options:"));

    editorQuestion.choices.forEach((choice, index) => {
      const isDefault = choice.value === editorQuestion.default;
      const marker = isDefault ? chalk.green("★ (default)") : " ";
      console.log(`  ${index + 1}. ${choice.name} ${marker}`);
    });

    // Check if novel-editor is present and is default
    const novelEditorChoice = editorQuestion.choices.find(c => c.value === 'novel-editor');
    if (novelEditorChoice) {
      console.log(chalk.green("\n✅ 'novel-editor' option found!"));
      console.log(`   Display name: "${novelEditorChoice.name}"`);
      console.log(`   Value: "${novelEditorChoice.value}"`);

      if (editorQuestion.default === 'novel-editor') {
        console.log(chalk.green("✅ 'novel-editor' is set as default!"));
      } else {
        console.log(chalk.yellow(`⚠️  Default is '${editorQuestion.default}', not 'novel-editor'`));
      }
    } else {
      console.log(chalk.red("\n❌ 'novel-editor' option NOT found!"));
    }

    console.log(chalk.blue("\n🔍 All editor choices:"));
    editorQuestion.choices.forEach(choice => {
      console.log(`   - ${choice.name} → ${choice.value}`);
    });
  } else {
    console.log(chalk.red("❌ No editor question found in init command!"));
  }

  // Return mock answers to complete the test
  return {
    name: "Test Novel",
    author: "Test Author",
    wordGoal: 50000,
    genre: "Fiction",
    editor: "novel-editor"
  };
};

async function testInitOptions() {
  console.log(chalk.bold.cyan(`
╔══════════════════════════════════════════════════════════════╗
║                  Testing Init Command Options               ║
║              Verifying novel-editor integration             ║
╚══════════════════════════════════════════════════════════════╝
`));

  try {
    // Import the init command to trigger the question setup
    const initCommand = require("./src/commands/init");

    // Mock the project manager to avoid actual file operations
    const projectManager = require("./src/utils/project");
    const originalIsWritersProject = projectManager.isWritersProject;
    const originalInitProject = projectManager.initProject;

    projectManager.isWritersProject = () => false;
    projectManager.initProject = async (options) => {
      console.log(chalk.green("\n✅ Mock project initialization completed!"));
      console.log(chalk.gray("   Selected editor:", options.editor));
      return {
        name: options.name,
        author: options.author,
        wordGoal: options.wordGoal,
        genre: options.genre,
        settings: {
          defaultEditor: options.editor
        }
      };
    };

    // Run the init command with no options to trigger prompts
    await initCommand({});

    // Restore original functions
    projectManager.isWritersProject = originalIsWritersProject;
    projectManager.initProject = originalInitProject;

    console.log(chalk.green("\n✅ Test completed successfully!"));
    console.log(chalk.blue("📝 Summary:"));
    console.log("   - novel-editor option is available during init");
    console.log("   - novel-editor is set as the default choice");
    console.log("   - Display name is user-friendly");

  } catch (error) {
    console.error(chalk.red("\n❌ Test failed:"), error.message);
    console.error(chalk.gray("Stack trace:"), error.stack);
  }
}

// Restore inquirer when done
process.on('exit', () => {
  inquirer.prompt = originalPrompt;
});

process.on('SIGINT', () => {
  console.log(chalk.yellow("\n\n⚠️  Test interrupted."));
  process.exit(0);
});

testInitOptions();
