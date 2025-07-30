#!/usr/bin/env node

const { Command } = require("commander");
const chalk = require("chalk");
const packageJson = require("../package.json");

// Import commands
const initCommand = require("../src/commands/init");
const newCommand = require("../src/commands/new");
const writeCommand = require("../src/commands/write");
const editCommand = require("../src/commands/edit");
const statsCommand = require("../src/commands/stats");
const exportCommand = require("../src/commands/export");
const listCommand = require("../src/commands/list");

const program = new Command();

// Configure the CLI
program
  .name("writers")
  .description(
    "A CLI tool for writing novels and short stories with markdown support",
  )
  .version(packageJson.version);

// Add banner
program.addHelpText(
  "before",
  chalk.bold.cyan(`
 __  __   ____     ____      _      _   _   _   _   ____   _   _   ____   ____   _     _
|  \/  | |  _ \   / ___|    / \    | \ | | | \ | | / ___| | \ | | / ___| / ___| | |   | |
| |\/| | | | | | | |  _    / _ \   |  \| | |  \| | \___ \ |  \| | \___ \ \___ \ | |   | |
| |  | | | |_| | | |_| |  / ___ \  | |\  | | |\  |  ___) || |\  |  ___) | ___) || |___| |
|_|  |_| |____/   \____| /_/   \_\ |_| \_| |_| \_| |____/ |_| \_| |____/ |____/ |_____|_|

${chalk.magenta("    ✦✦✦  Welcome to your CLI Writing Adventure!  ✦✦✦")}
${chalk.gray("          For novels, short stories, and more...")}
`),
);

// Register commands
program
  .command("init")
  .description("Initialize a new writing project")
  .option("-n, --name <n>", "Project name")
  .option("-a, --author <author>", "Author name")
  .action(initCommand);

program
  .command("new")
  .description("Create new content")
  .argument(
    "<type>",
    "Type of content (chapter, scene, character, shortstory, note)",
  )
  .argument("[name]", "Name of the new content")
  .option("-t, --template <template>", "Use a specific template")
  .action(newCommand);

program
  .command("write")
  .description("Open a chapter or scene for writing (external editor)")
  .argument("[target]", "Chapter or scene to write (e.g., chapter1, scene2)")
  .option(
    "-e, --editor <editor>",
    "Preferred editor (novel-editor, nano, vim, code)",
  )
  .action(writeCommand);

program
  .command("edit")
  .description("Open a chapter or scene in the built-in editor")
  .argument("[target]", "Chapter or scene to edit (e.g., chapter1, scene2)")
  .action(editCommand);

program
  .command("stats")
  .description("Show project statistics")
  .option("-c, --chapter <chapter>", "Stats for specific chapter")
  .option("-d, --detailed", "Show detailed statistics")
  .action(statsCommand);

program
  .command("export")
  .description("Export your novel to different formats")
  .argument("[format]", "Export format (html, pdf, epub)", "html")
  .option("-o, --output <path>", "Output file path")
  .option(
    "--chapters <chapters>",
    "Specific chapters to export (comma-separated)",
  )
  .action(exportCommand);

program
  .command("list")
  .description("List all content")
  .option(
    "-t, --type <type>",
    "Filter by type (chapters, scenes, characters, shortstories, notes)",
  )
  .action(listCommand);

// Handle unknown commands
program.on("command:*", () => {
  console.error(chalk.red(`Invalid command: ${program.args.join(" ")}`));
  console.log(chalk.yellow("See --help for a list of available commands."));
  process.exit(1);
});

// Parse command line arguments
program.parse();

// Show help if no command is provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
