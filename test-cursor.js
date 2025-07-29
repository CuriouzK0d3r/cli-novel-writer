#!/usr/bin/env node

const WritersEditor = require("./src/editor");

async function testCursor() {
  console.log("Testing blinking cursor implementation...");
  console.log("The cursor should blink every ~530ms");
  console.log("Press Ctrl+X to exit when done testing\n");

  try {
    // Override terminal type for better compatibility
    const originalTerm = process.env.TERM;
    process.env.TERM = "xterm-256color";

    const editor = new WritersEditor();
    await editor.launch();

    // Restore original TERM if it existed
    if (originalTerm) {
      process.env.TERM = originalTerm;
    }
  } catch (error) {
    console.error("Error testing cursor:", error.message);
    console.error("Stack trace:", error.stack);

    // Restore terminal settings on error
    if (process.env.TERM !== originalTerm && originalTerm) {
      process.env.TERM = originalTerm;
    }

    process.exit(1);
  }
}

// Handle process interruption gracefully
process.on("SIGINT", () => {
  console.log("\n\nExiting cursor test...");
  process.exit(0);
});

testCursor();
