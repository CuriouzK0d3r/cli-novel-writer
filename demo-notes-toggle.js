#!/usr/bin/env node

const chalk = require('chalk');

/**
 * Demo script to test the notes toggle functionality
 */

async function demonstrateNotesToggle() {
  console.log(chalk.blue.bold(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                      Notes Toggle Feature Demo                              ║
║                        Writers CLI v2.0                                     ║
╚══════════════════════════════════════════════════════════════════════════════╝
`));

  console.log(chalk.green("🎯 This demo shows the new Ctrl+T notes toggle feature.\n"));

  console.log(chalk.cyan.bold("✍️  How it works:"));
  console.log(`
1. ${chalk.yellow("Write your story")} in any file (drafts/, finished/, etc.)
2. ${chalk.yellow("Press Ctrl+T")} to instantly switch to notes for that story
3. ${chalk.yellow("Jot down ideas")} - plot points, character notes, research
4. ${chalk.yellow("Press Ctrl+T again")} to switch back to your story
5. ${chalk.yellow("Continue writing")} with your notes fresh in mind

${chalk.green("✨ The magic:")}
• Notes are auto-created if they don't exist
• Smart file discovery finds your story from notes
• Works with any project structure
• Organized in notes/ folder for simple projects
`);

  console.log(chalk.cyan.bold("📁 Example workflow:"));
  console.log(`
${chalk.gray("# You're writing in:")} ${chalk.blue("drafts/robot-story.md")}
${chalk.gray("# Press Ctrl+T, and you get:")} ${chalk.blue("notes/robot-story-notes.md")}

${chalk.gray("# The notes file includes:")}
${chalk.yellow("# Notes for 'Robot Story'")}
${chalk.yellow("*Created: Today's date*")}
${chalk.yellow("*Story: robot-story.md*")}

${chalk.yellow("## Plot Ideas")}

${chalk.yellow("## Character Notes")}

${chalk.yellow("## Research")}

${chalk.yellow("## Revision Notes")}

${chalk.yellow("---")}
${chalk.yellow("Press Ctrl+T to switch back to your story.")}
`);

  console.log(chalk.cyan.bold("🔧 Technical details:"));
  console.log(`
• ${chalk.blue("Smart discovery:")} Finds stories in drafts/, finished/, stories/, etc.
• ${chalk.blue("Auto-organization:")} Notes go in notes/ folder (simple projects)
• ${chalk.blue("Bidirectional:")} Works from story→notes and notes→story
• ${chalk.blue("Auto-creation:")} Creates notes template if file doesn't exist
• ${chalk.blue("File matching:")} Links robot-story.md ↔ robot-story-notes.md
`);

  console.log(chalk.cyan.bold("🚀 Try it out:"));
  console.log(`
${chalk.green("# Create a simple project and story")}
${chalk.cyan("writers init-short my-test")}
${chalk.cyan("cd my-test")}
${chalk.cyan("writers write 'Test Story'")}

${chalk.green("# In the editor:")}
${chalk.cyan("1. Type some story content")}
${chalk.cyan("2. Press Ctrl+T")}
${chalk.cyan("3. Add some notes")}
${chalk.cyan("4. Press Ctrl+T again")}
${chalk.cyan("5. You're back to your story!")}

${chalk.yellow("💡 Pro tip:")} Use this during writing sprints to capture ideas without losing momentum!
`);

  console.log(chalk.green.bold(`
✨ Benefits:

${chalk.blue("✓")} No context switching to external apps
${chalk.blue("✓")} Notes stay organized and linked to stories
${chalk.blue("✓")} Instant toggle preserves your mental flow
${chalk.blue("✓")} Auto-creation means no setup needed
${chalk.blue("✓")} Works with any project structure
${chalk.blue("✓")} Perfect for capturing fleeting inspiration

Happy writing! 📝✨
`));
}

// Run the demo
if (require.main === module) {
  demonstrateNotesToggle().catch(console.error);
}

module.exports = { demonstrateNotesToggle };
