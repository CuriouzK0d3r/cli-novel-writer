#!/usr/bin/env node

const chalk = require('chalk');

/**
 * Demo script to showcase the simplified short story workflow
 */

async function runSimpleDemo() {
  console.log(chalk.blue.bold(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                     Simplified Short Story Workflow                         ║
║                            Writers CLI v2.0                                 ║
╚══════════════════════════════════════════════════════════════════════════════╝
`));

  console.log(chalk.green("🎯 This demo shows the new simplified approach to short story writing.\n"));
  console.log(chalk.yellow("The goal: Remove 80% of complexity while keeping 90% of functionality.\n"));

  await pauseForUser();

  // Demo 1: Simple Setup
  console.log(chalk.cyan.bold("📁 DEMO 1: Simple Project Setup"));
  console.log(chalk.gray("─".repeat(60)));
  console.log(`
${chalk.yellow("# Create a simple short story project")}
${chalk.green("writers init-short my-stories")}

${chalk.dim("Creates minimal structure:")}
${chalk.blue("my-stories/")}
├── ${chalk.blue("drafts/")}          ${chalk.gray("# Work in progress")}
├── ${chalk.blue("finished/")}        ${chalk.gray("# Completed stories")}
└── ${chalk.blue("exports/")}         ${chalk.gray("# Submission-ready files")}

${chalk.cyan("Only 3 folders instead of 8+!")}
No overwhelming choices, just start writing.
`);

  await pauseForUser();

  // Demo 2: Smart Write Command
  console.log(chalk.cyan.bold("✍️  DEMO 2: Smart Write Command"));
  console.log(chalk.gray("─".repeat(60)));
  console.log(`
${chalk.yellow("# The main command you'll use")}
${chalk.green("writers write")}

${chalk.dim("What happens:")}
1. ${chalk.blue("Shows menu")} of all your stories
2. ${chalk.blue("Auto-detects")} files in drafts/ and finished/
3. ${chalk.blue("Smart matching")} - finds partial names
4. ${chalk.blue("Creates new")} if story doesn't exist
5. ${chalk.blue("Opens editor")} automatically

### Smart Write Command
- **No arguments**: Shows menu of all stories + option to create new
- **Auto-detects** files in drafts/ and finished/
- **Smart matching** - finds partial names
- **Creates new** if story doesn't exist
- **Opens editor** automatically
- **Built-in notes toggle** - Press Ctrl+T to switch between story and notes

${chalk.yellow("# Examples")}
${chalk.green("writers write")}                     ${chalk.gray("# Interactive menu")}
${chalk.green("writers write 'My New Story'")}      ${chalk.gray("# Create or open specific story")}
${chalk.green("writers write robot")}               ${chalk.gray("# Find 'the-robot-story.md'")}

${chalk.cyan("💡 Pro tip:")} While editing, press Ctrl+T to toggle to notes for quick idea capture!
`);

  await pauseForUser();

  // Demo 3: Simple Commands
  console.log(chalk.cyan.bold("🎯 DEMO 3: Core Commands (All You Need)"));
  console.log(chalk.gray("─".repeat(60)));
  console.log(`
${chalk.yellow("# See all your stories")}
${chalk.green("writers list")}

${chalk.dim("Shows:")}
• Story names and word counts
• Status (draft/finished)
• Last modified dates

${chalk.yellow("# Check progress")}
${chalk.green("writers stats")}                    ${chalk.gray("# Total words, writing streaks")}

${chalk.yellow("# Export for submission")}
${chalk.green("writers export 'My Story'")}        ${chalk.gray("# Creates clean submission file")}

${chalk.cyan("That's it! 4 commands handle 90% of use cases.")}
`);

  await pauseForUser();

  // Demo 4: Daily Workflow
  console.log(chalk.cyan.bold("📅 DEMO 4: Typical Daily Workflow"));
  console.log(chalk.gray("─".repeat(60)));
  console.log(`
${chalk.yellow("# Day 1: Start writing")}
cd my-stories
${chalk.green("writers write")}
${chalk.gray("→ Choose 'Create new story'")}
${chalk.gray("→ Enter 'The Last Robot'")}
${chalk.gray("→ Editor opens, write 800 words")}

${chalk.yellow("# Day 2: Continue")}
${chalk.green("writers write")}
${chalk.gray("→ See 'The Last Robot (800 words, draft)'")}
${chalk.gray("→ Select it, write 700 more words")}

${chalk.yellow("# Day 3: Finish")}
${chalk.gray("→ Move file: drafts/ → finished/")}
${chalk.green("writers export 'the-last-robot'")}
${chalk.gray("→ Clean submission file created")}

${chalk.cyan("Simple, intuitive, no complex workflows to remember.")}
`);

  await pauseForUser();

  // Demo 5: Migration
  console.log(chalk.cyan.bold("🔄 DEMO 5: Simplify Existing Projects"));
  console.log(chalk.gray("─".repeat(60)));
  console.log(`
${chalk.yellow("# Convert complex project to simple structure")}
${chalk.green("writers simplify")}

${chalk.dim("This command:")}
• ${chalk.blue("Backs up")} current structure
• ${chalk.blue("Consolidates")} all story files
• ${chalk.blue("Organizes")} into drafts/finished based on completion
• ${chalk.blue("Preserves")} all your work
• ${chalk.blue("Creates")} simple README

${chalk.cyan("Keeps your stories, removes the complexity!")}
`);

  await pauseForUser();

  // Demo 6: Benefits
  console.log(chalk.cyan.bold("🎉 DEMO 6: Why This Approach Works"));
  console.log(chalk.gray("─".repeat(60)));
  console.log(`
${chalk.green("✓")} ${chalk.yellow("Faster onboarding")} - Start writing in under 2 minutes
${chalk.green("✓")} ${chalk.yellow("Less decision fatigue")} - Fewer folders and commands
${chalk.green("✓")} ${chalk.yellow("Clearer mental model")} - Draft → Finished → Export
${chalk.green("✓")} ${chalk.yellow("Smart defaults")} - Auto-discovery, word tracking
${chalk.green("✓")} ${chalk.yellow("Easier maintenance")} - Simpler structure, fewer bugs
${chalk.green("✓")} ${chalk.yellow("Better mobile sync")} - Works great with cloud storage

${chalk.magenta("Perfect for:")}
• New short story writers
• Writers who want focus over features
• Anyone overwhelmed by complex workflows
• Quick prototyping and experimentation

${chalk.dim("Advanced features still available when needed!")}
`);

  await pauseForUser();

  console.log(chalk.green.bold(`
🚀 Ready to Try Simplified Short Story Writing?

${chalk.cyan("Get started:")}
${chalk.cyan("writers init-short my-stories")}  ${chalk.gray("# Create simple project")}
${chalk.cyan("cd my-stories")}
${chalk.cyan("writers write")}                  ${chalk.gray("# Start writing immediately")}

${chalk.yellow("Migration:")}
${chalk.cyan("writers simplify")}               ${chalk.gray("# Convert existing complex project")}

${chalk.blue("Remember: The best writing tool is the one you actually use!")}

Happy writing! ✍️✨
`));
}

async function pauseForUser() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(chalk.gray('\nPress Enter to continue...'), () => {
      rl.close();
      console.log(); // Add spacing
      resolve();
    });
  });
}

// Run the demo
if (require.main === module) {
  runSimpleDemo().catch(console.error);
}

module.exports = { runSimpleDemo };
