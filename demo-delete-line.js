#!/usr/bin/env node

/**
 * Demo script for the new Delete Line feature in Writers CLI Editor
 * Shows off the Ctrl+Shift+K shortcut functionality
 */

const chalk = require("chalk");
const WritersEditor = require("./src/editor/index.js");
const fs = require("fs");
const path = require("path");

function showDemo() {
  console.log(chalk.bold.cyan("\n🗑️  DELETE LINE FEATURE DEMO"));
  console.log(chalk.cyan("=====================================\n"));

  console.log(chalk.bold("✨ New Feature Added: Delete Current Line"));
  console.log(
    chalk.gray(
      'Press "dd" (d twice quickly) to delete the current line instantly!\n',
    ),
  );

  console.log(chalk.bold("🎯 Key Features:"));
  console.log(
    "  • " + chalk.green("dd") + " - Delete current line (Vim-style)",
  );
  console.log("  • Works in navigation mode only");
  console.log("  • Smart cursor positioning after deletion");
  console.log("  • Full undo/redo support");
  console.log("  • Handles edge cases (single line, empty files)");

  console.log(chalk.bold("\n📚 Usage Examples:"));
  console.log("  1. Navigate to any line (must be in navigation mode)");
  console.log("  2. Press " + chalk.yellow("dd") + " (d twice quickly)");
  console.log("  3. Line disappears instantly!");
  console.log("  4. Use " + chalk.yellow("Ctrl+Z") + " to undo if needed");

  console.log(chalk.bold("\n🔧 Technical Details:"));
  console.log("  • Preserves file integrity");
  console.log("  • Maintains cursor position intelligently");
  console.log("  • Integrates with existing undo system");
  console.log("  • Added to help dialog (F1)");

  console.log(chalk.bold("\n🎨 Perfect for:"));
  console.log("  • Removing unwanted lines quickly");
  console.log("  • Cleaning up drafts");
  console.log("  • Fast editing workflows");
  console.log("  • Writers who need quick line removal");

  console.log(chalk.bold("\n💡 Pro Tip:"));
  console.log(
    "  Combine with navigation shortcuts for lightning-fast editing!",
  );
  console.log(
    "  Example: " +
      chalk.yellow("j j j dd") +
      " (go down 3 lines, delete line)",
  );
}

async function launchDemo() {
  // Create demo content
  const demoContent = `Welcome to the Delete Line Demo!
This is line 2 - try deleting me with "dd" (d twice quickly)
Line 3: I'm safe for now
Line 4: Delete me too if you want!
Line 5: Navigation mode - use j/k to move up/down
Line 6: Insert mode - press 'i' to enter, 'Esc' to exit (but dd only works in nav mode)
Line 7: This line demonstrates the feature
Line 8: Remember - Ctrl+Z to undo deletions
Line 9: Press F1 to see all shortcuts in help
Line 10: Happy writing with your new delete feature!

Instructions:
1. Make sure you're in navigation mode (NAV should show in status bar)
2. Use arrow keys or j/k to navigate between lines
3. Press "dd" (d twice quickly) on any line to delete it
4. Watch how the cursor adjusts automatically
5. Try Ctrl+Z to undo deletions
6. Press F1 to see the updated help with the new shortcut
7. Exit with Ctrl+X when done

Have fun testing the new delete line feature!`;

  const demoFile = path.join(__dirname, "demo-delete-temp.txt");

  try {
    fs.writeFileSync(demoFile, demoContent);

    console.log(chalk.bold("\n🚀 Launching Demo Editor..."));
    console.log(
      chalk.gray(
        "The editor will open with demo content to test the delete line feature.\n",
      ),
    );

    const editor = new WritersEditor();
    await editor.launch(demoFile);
  } catch (error) {
    console.error(chalk.red("❌ Demo failed:"), error.message);
  } finally {
    // Cleanup
    try {
      if (fs.existsSync(demoFile)) {
        fs.unlinkSync(demoFile);
      }
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    showDemo();
    console.log(chalk.bold("\n📖 Usage:"));
    console.log(
      "  node demo-delete-line.js          Show this demo info and launch editor",
    );
    console.log("  node demo-delete-line.js --help   Show this help message");
    console.log("  node demo-delete-line.js --info   Show feature info only");
    return;
  }

  if (args.includes("--info")) {
    showDemo();
    return;
  }

  showDemo();

  console.log(chalk.bold("\n⏳ Starting in 3 seconds..."));
  console.log(chalk.gray("Press Ctrl+C to cancel\n"));

  await new Promise((resolve) => setTimeout(resolve, 3000));
  await launchDemo();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { showDemo, launchDemo };
