const chalk = require('chalk');
const inquirer = require('inquirer');
const boxen = require('boxen');
const projectManager = require('../utils/project');

async function initCommand(options) {
  try {
    console.log(chalk.blue.bold('\n📝 Writers CLI - Project Initialization\n'));

    // Check if already a writers project
    if (projectManager.isWritersProject()) {
      console.log(chalk.yellow('⚠️  This directory is already a Writers project.'));
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: 'Do you want to reinitialize this project?',
          default: false
        }
      ]);

      if (!overwrite) {
        console.log(chalk.gray('Initialization cancelled.'));
        return;
      }
    }

    // Gather project information
    const projectInfo = await gatherProjectInfo(options);

    // Create the project
    console.log(chalk.blue('\n⚡ Creating your writing project...'));

    const config = await projectManager.initProject(projectInfo);

    // Show success message
    displaySuccessMessage(config);

  } catch (error) {
    console.error(chalk.red('❌ Error initializing project:'), error.message);
    process.exit(1);
  }
}

async function gatherProjectInfo(options) {
  const questions = [];

  // Project name
  if (!options.name) {
    questions.push({
      type: 'input',
      name: 'name',
      message: 'What is the title of your novel?',
      default: require('path').basename(process.cwd()),
      validate: (input) => {
        if (input.trim().length === 0) {
          return 'Project name cannot be empty';
        }
        return true;
      }
    });
  }

  // Author name
  if (!options.author) {
    questions.push({
      type: 'input',
      name: 'author',
      message: 'Who is the author?',
      default: process.env.USER || process.env.USERNAME || 'Unknown Author',
      validate: (input) => {
        if (input.trim().length === 0) {
          return 'Author name cannot be empty';
        }
        return true;
      }
    });
  }

  // Word goal
  questions.push({
    type: 'number',
    name: 'wordGoal',
    message: 'What is your target word count?',
    default: 50000,
    validate: (input) => {
      if (input <= 0) {
        return 'Word goal must be greater than 0';
      }
      return true;
    }
  });

  // Genre
  questions.push({
    type: 'list',
    name: 'genre',
    message: 'What genre are you writing?',
    choices: [
      'Fiction',
      'Non-Fiction',
      'Fantasy',
      'Science Fiction',
      'Mystery',
      'Romance',
      'Thriller',
      'Historical Fiction',
      'Literary Fiction',
      'Young Adult',
      'Children\'s',
      'Biography',
      'Other'
    ],
    default: 'Fiction'
  });

  // Default editor
  questions.push({
    type: 'list',
    name: 'editor',
    message: 'Which editor would you like to use by default?',
    choices: [
      { name: 'Nano (simple, built-in)', value: 'nano' },
      { name: 'Vim (advanced)', value: 'vim' },
      { name: 'VS Code (if installed)', value: 'code' },
      { name: 'System default', value: 'default' }
    ],
    default: 'nano'
  });

  const answers = await inquirer.prompt(questions);

  // Merge with provided options
  return {
    name: options.name || answers.name,
    author: options.author || answers.author,
    wordGoal: answers.wordGoal,
    genre: answers.genre,
    editor: answers.editor
  };
}

function displaySuccessMessage(config) {
  const message = `
${chalk.green.bold('✅ Project initialized successfully!')}

${chalk.bold('Project Details:')}
📖 Title: ${chalk.cyan(config.name)}
✍️  Author: ${chalk.cyan(config.author)}
🎯 Word Goal: ${chalk.cyan(config.wordGoal.toLocaleString())} words
📁 Structure created with folders for chapters, scenes, characters, and notes

${chalk.bold('Next Steps:')}
${chalk.green('•')} Create your first chapter: ${chalk.yellow('writers new chapter "Chapter 1"')}
${chalk.green('•')} Start writing: ${chalk.yellow('writers write chapter1')}
${chalk.green('•')} View project stats: ${chalk.yellow('writers stats')}
${chalk.green('•')} List all content: ${chalk.yellow('writers list')}

${chalk.bold('Project Structure:')}
📂 chapters/     - Your main story chapters
📂 scenes/       - Individual scenes and drafts
📂 characters/   - Character profiles and development
📂 notes/        - Research, plot notes, and ideas
📂 exports/      - Exported versions of your work

Happy writing! 🎉
`;

  console.log(boxen(message, {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: 'green'
  }));
}

module.exports = initCommand;
