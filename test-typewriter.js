#!/usr/bin/env node

const WritersEditor = require("./src/editor");

async function testTypewriterMode() {
  console.log("Testing Typewriter Mode...");
  console.log("");
  console.log("Instructions:");
  console.log("1. Press F9 to toggle typewriter mode ON/OFF");
  console.log("2. Press i to enter insert mode");
  console.log("3. Type some text and press Enter multiple times");
  console.log(
    "4. Notice how the cursor stays centered when typewriter mode is ON",
  );
  console.log(
    "5. Press F9 again to turn off typewriter mode and see normal scrolling",
  );
  console.log("6. Press Ctrl+X to exit");
  console.log("");
  console.log("Starting editor in 3 seconds...");

  await new Promise((resolve) => setTimeout(resolve, 3000));

  const editor = new WritersEditor();
  await editor.launch("./typewriter-demo.txt");
}

testTypewriterMode().catch(console.error);
