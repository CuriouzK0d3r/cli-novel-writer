#!/usr/bin/env node

const WritersEditor = require("./src/editor");

async function testCursorModes() {
  console.log("Testing cursor mode changes...");
  console.log("\nInstructions:");
  console.log("1. The editor will start in NAVIGATION mode with a BLOCK cursor");
  console.log("2. Press 'i' to enter INSERT mode - cursor should change to a LINE");
  console.log("3. Press 'Escape' to return to NAVIGATION mode - cursor should change back to BLOCK");
  console.log("4. Look at the status bar to see the current mode (NAV/INS)");
  console.log("5. Press Ctrl+X to exit when done testing\n");

  console.log("Starting in 3 seconds...");
  await new Promise(resolve => setTimeout(resolve, 3000));

  try {
    // Override terminal type for better compatibility
    const originalTerm = process.env.TERM;
    process.env.TERM = "xterm-256color";

    const editor = new WritersEditor();

    // Create a test file with some content
    const testContent = `# Cursor Mode Test

This is a test file to verify cursor mode changes.

Navigation mode: Block cursor (solid rectangle)
Insert mode: Line cursor (vertical bar)

Try switching between modes:
- Press 'i' to enter insert mode
- Press 'Escape' to return to navigation mode

Type some text in insert mode to see the line cursor in action.
Use arrow keys in navigation mode to see the block cursor.`;

    await editor.launch();

    // Restore original TERM if it existed
    if (originalTerm) {
      process.env.TERM = originalTerm;
    }
  } catch (error) {
    console.error("Error testing cursor modes:", error.message);

    // Restore terminal settings on error
    if (process.env.TERM !== originalTerm && originalTerm) {
      process.env.TERM = originalTerm;
    }

    process.exit(1);
  }
}

// Handle process interruption gracefully
process.on("SIGINT", () => {
  console.log("\n\nExiting cursor mode test...");
  process.exit(0);
});

process.on("uncaughtException", (error) => {
  console.error("\nUncaught exception:", error.message);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("\nUnhandled rejection:", reason);
  process.exit(1);
});

testCursorModes();
