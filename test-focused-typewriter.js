#!/usr/bin/env node

const WritersEditor = require("./src/editor");

async function testFocusedTypewriterMode() {
  console.log("Testing Focused Typewriter Mode with Dimming...");
  console.log("");
  console.log("NEW FEATURE: Typewriter mode now shows only the current line");
  console.log(
    "and 1 line before/after it clearly, while dimming all other text.",
  );
  console.log("");
  console.log("Instructions:");
  console.log("1. Press F9 to toggle typewriter mode ON/OFF");
  console.log("2. Press i to enter insert mode");
  console.log("3. Navigate to different lines (arrow keys)");
  console.log("4. Notice how only the current line ± 1 line are bright");
  console.log("5. All other lines should appear dimmed (dark gray)");
  console.log("6. Type new content and see the focus window move");
  console.log("7. Press F9 again to turn off typewriter mode");
  console.log("8. Press Ctrl+X to exit");
  console.log("");
  console.log("Features to test:");
  console.log("- Focus window moves with cursor");
  console.log("- Dimmed lines outside focus area");
  console.log("- Cursor visibility in dimmed lines");
  console.log("- Line numbers respect dimming");
  console.log("- Normal mode shows all lines clearly");
  console.log("");
  console.log("Starting editor in 3 seconds...");

  await new Promise((resolve) => setTimeout(resolve, 3000));

  const editor = new WritersEditor();
  await editor.launch("./typewriter-demo.txt");
}

testFocusedTypewriterMode().catch(console.error);
