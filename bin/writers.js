#!/usr/bin/env node

const { Command } = require("commander");
const chalk = require("chalk");
const packageJson = require("../package.json");

// Import commands
const initCommand = require("../src/commands/init");
const initShortStoryCommand = require("../src/commands/init-shortstory");
const initShortCommand = require("../src/commands/init-short");
const initBlogCommand = require("../src/commands/init-blog");
const newCommand = require("../src/commands/new");
const writeCommand = require("../src/commands/write");
const smartWriteCommand = require("../src/commands/smart-write");
const editCommand = require("../src/commands/edit");
const statsCommand = require("../src/commands/stats");
const exportCommand = require("../src/commands/export");
const listCommand = require("../src/commands/list");
const guiCommand = require("../src/commands/gui");
const storyCommand = require("../src/commands/story");
const workflowCommand = require("../src/commands/workflow");
const simplifyCommand = require("../src/commands/simplify");

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
  .command("init-shortstory")
  .description("Initialize a new short story project")
  .option("-n, --name <n>", "Project name")
  .option("-a, --author <author>", "Author name")
  .action(initShortStoryCommand);

program
  .command("init-short")
  .description("Initialize a simple short story project (recommended)")
  .option("-n, --name <n>", "Project name")
  .option("-a, --author <author>", "Author name")
  .action(initShortCommand);

program
  .command("init-blog")
  .description("Initialize a new blog project")
  .option("-n, --name <n>", "Project name")
  .option("-a, --author <author>", "Author name")
  .action(initBlogCommand);

program
  .command("new")
  .description("Create new content")
  .argument(
    "<type>",
    "Type of content (chapter, scene, character, shortstory, blogpost, note)",
  )
  .argument("[name]", "Name of the new content")
  .option("-t, --template <template>", "Use a specific template")
  .action(newCommand);

program
  .command("write")
  .description(
    "Smart write command with auto-discovery and menu (Ctrl+T for notes toggle)",
  )
  .argument("[target]", "Target name (optional - shows menu if not provided)")
  .option(
    "-e, --editor <editor>",
    "Preferred editor (novel-editor, nano, vim, code)",
  )
  .action(async (target, options) => {
    try {
      // Check if we're in a writers project
      const fs = require("fs");
      if (fs.existsSync("writers.config.json")) {
        const config = JSON.parse(
          fs.readFileSync("writers.config.json", "utf8"),
        );
        if (config.type === "simple-short-story") {
          return await smartWriteCommand(target, options);
        } else if (config.type === "blog") {
          // Blog projects default to drafts folder and support blog posts
          if (!target) {
            // Show blog posts menu
            return await smartWriteCommand(target, options);
          }
          // Handle blog post writing
          return await writeCommand(target, options);
        }
      }
      // Fallback to regular write command
      return await writeCommand(target, options);
    } catch (error) {
      // If there's any error, fallback to regular write
      return await writeCommand(target, options);
    }
  });

program
  .command("write-classic")
  .description("Classic write command (external editor)")
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
  .command("gui")
  .description("Launch the GUI version of Writers CLI (Enhanced Edition)")
  .option("--classic", "Use classic GUI instead of Enhanced Edition")
  .option("--debug", "Show debug output")
  .option("--quiet", "Suppress startup messages")
  .action(guiCommand);

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

program
  .command("story")
  .description("Advanced short story management")
  .argument(
    "<action>",
    "Action to perform (list, status, move, copy, archive, submit, stats, search, tags, notes)",
  )
  .argument("[story-name]", "Name of the story (required for most actions)")
  .option(
    "--status <status>",
    "Filter by status (planning, drafting, revising, complete, submitted, published)",
  )
  .option("--genre <genre>", "Filter by genre")
  .option("--tag <tag>", "Filter by tag")
  .option("--sort <field>", "Sort by field (name, length, status, modified)")
  .option("--detailed", "Show detailed view")
  .option("--to <destination>", "Destination directory for move action")
  .option("--as <name>", "New name for copy action")
  .option("--add <value>", "Add tags or notes")
  .option("--remove <value>", "Remove tags")
  .action(storyCommand);

program
  .command("workflow")
  .description("Automated writing workflows")
  .argument(
    "<type>",
    "Workflow type (daily, submission, revision, collection, prompt, sprint, publish, backup)",
  )
  .option("--goal <goal>", "Set a specific goal for the session")
  .option("--time <minutes>", "Set time limit in minutes")
  .option("--words <count>", "Set word count target")
  .action(workflowCommand);

program
  .command("simplify")
  .description("Convert complex project to simplified short story workflow")
  .action(simplifyCommand);

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
