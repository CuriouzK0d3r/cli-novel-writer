#!/usr/bin/env node

const WritersEditor = require("./src/editor");

async function testNavigation() {
  console.log("Testing Arrow Key Navigation in Both Modes...");
  console.log("");
  console.log("This test demonstrates that arrow keys now work in both modes:");
  console.log("");
  console.log("NAVIGATION MODE:");
  console.log("  • Arrow Keys: ↑↓←→ for movement");
  console.log("  • Vim Style: h/j/k/l for left/down/up/right");
  console.log("  • WASD Style: w/a/s/d for up/left/down/right");
  console.log("  • Home/End: Beginning/End of line");
  console.log("  • Page Up/Down: Scroll by page");
  console.log("  • Ctrl+Arrow: Move by word");
  console.log("");
  console.log("INSERT MODE:");
  console.log("  • Arrow Keys: ↑↓←→ for movement while editing");
  console.log("  • All standard navigation keys work");
  console.log("");
  console.log("Instructions:");
  console.log("1. Editor starts in NAVIGATION mode");
  console.log("2. Try arrow keys, vim keys (h/j/k/l), and WASD keys");
  console.log("3. Press 'i' to enter INSERT mode");
  console.log("4. Arrow keys still work for navigation while editing");
  console.log("5. Press Escape to return to NAVIGATION mode");
  console.log("6. Try F9 for typewriter mode with arrow navigation");
  console.log("7. Press Ctrl+X to exit");
  console.log("");
  console.log("Starting editor in 3 seconds...");

  await new Promise((resolve) => setTimeout(resolve, 3000));

  const editor = new WritersEditor();
  await editor.launch("./typewriter-demo.txt");
}

testNavigation().catch(console.error);
