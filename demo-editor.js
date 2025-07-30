#!/usr/bin/env node

const chalk = require("chalk");
const fs = require("fs-extra");
const path = require("path");
const WritersEditor = require("./src/editor");

async function runDemo() {
  console.log(
    chalk.bold.blue(`
╔══════════════════════════════════════════════════════════════╗
║                     Novel Editor Demo                       ║
║              Terminal-based editor for writers              ║
╚══════════════════════════════════════════════════════════════╝
`),
  );

  console.log(
    chalk.yellow("This demo will showcase the Novel Editor features.\n"),
  );

  // Create a temporary demo file
  const demoContent = `# The Mysterious Case of the Missing Manuscript

*Created: ${new Date().toLocaleDateString()}*
*Author: Demo Writer*

---

## Chapter 1: The Discovery

The old typewriter sat in the corner of the dusty attic, its keys yellowed with age. Sarah had found it while cleaning out her grandmother's house, and something about it seemed... different.

As she approached the machine, she noticed a half-finished page still rolled into it. The paper was crisp despite the years, and the text was typed in a font she didn't recognize:

> "The stories we tell ourselves are the most dangerous lies of all. But sometimes, when the moon is dark and the typewriter keys sing their mechanical song, those lies become truth."

Sarah's fingers trembled as she read the words. They seemed familiar, as if she had written them herself in a dream she couldn't quite remember.

## Chapter 2: The First Test

She decided to test the typewriter, rolling in a fresh sheet of paper. But when her fingers touched the keys, something extraordinary happened. The words that appeared were not the ones she intended to type.

Instead, the machine seemed to have a mind of its own:

*"Welcome, Sarah. I have been waiting for you. Your grandmother knew this day would come. She prepared you, though you don't remember yet. The stories are calling, and you must answer."*

## Writing Notes

- **Theme**: Reality vs. fiction, inherited gifts
- **Protagonist**: Sarah - skeptical but curious
- **Antagonist**: The typewriter itself? Or something it represents?
- **Setting**: Grandmother's attic, small town atmosphere
- **Mood**: Mysterious, slightly unsettling

## Character Development

**Sarah**:
- Age: 28
- Occupation: Freelance journalist
- Background: Practical, logical thinker who dismisses supernatural explanations
- Arc: Must learn to embrace the mysterious inheritance from her grandmother

**The Grandmother** (deceased):
- Was she a writer? A keeper of secrets?
- Left behind clues in the house
- May have used the typewriter for her own mysterious purposes

---

*Word Count Goal: 2,000 words*
*Current Progress: This is just the beginning...*
`;

  const demoFile = path.join(__dirname, "demo-chapter.md");

  try {
    await fs.writeFile(demoFile, demoContent);

    console.log(chalk.green("✅ Created demo file: demo-chapter.md"));
    console.log(chalk.blue("\n🚀 Launching Novel Editor..."));
    console.log(
      chalk.gray("The editor will open with a sample chapter loaded."),
    );
    console.log(chalk.gray("Try these features while in the editor:"));
    console.log(chalk.yellow("  • Press F1 for help"));
    console.log(chalk.yellow("  • Press Ctrl+W for word count details"));
    console.log(chalk.yellow("  • Press F11 for distraction-free mode"));
    console.log(chalk.yellow("  • Press Ctrl+F to search for text"));
    console.log(chalk.yellow("  • Press Ctrl+X to exit when done"));

    console.log(chalk.gray("\nPress Enter to continue..."));
    await waitForEnter();

    // Launch the editor
    const editor = new WritersEditor();
    await editor.launch(demoFile);

    // Cleanup
    console.log(chalk.blue("\n👋 Thanks for trying the Novel Editor!"));

    const { cleanup } = await require("inquirer").prompt([
      {
        type: "confirm",
        name: "cleanup",
        message: "Would you like to delete the demo file?",
        default: true,
      },
    ]);

    if (cleanup) {
      await fs.remove(demoFile);
      console.log(chalk.green("✅ Demo file cleaned up."));
    } else {
      console.log(chalk.blue(`📁 Demo file saved at: ${demoFile}`));
    }
  } catch (error) {
    console.error(chalk.red("❌ Demo failed:"), error.message);

    // Cleanup on error
    try {
      await fs.remove(demoFile);
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
  }
}

function waitForEnter() {
  return new Promise((resolve) => {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("data", (data) => {
      if (data[0] === 13) {
        // Enter key
        process.stdin.setRawMode(false);
        process.stdin.pause();
        resolve();
      }
    });
  });
}

// Handle script interruption
process.on("SIGINT", async () => {
  console.log(chalk.yellow("\n\n⚠️  Demo interrupted. Cleaning up..."));

  try {
    const demoFile = path.join(__dirname, "demo-chapter.md");
    await fs.remove(demoFile);
    console.log(chalk.green("✅ Cleanup completed."));
  } catch (error) {
    // Ignore cleanup errors
  }

  process.exit(0);
});

// Run the demo
if (require.main === module) {
  runDemo().catch((error) => {
    console.error(chalk.red("❌ Error running demo:"), error.message);
    process.exit(1);
  });
}

module.exports = runDemo;
