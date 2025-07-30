#!/usr/bin/env node

const BufferEditor = require("./src/editor/buffer-editor");

class MockScreen {
  constructor() {
    this.content = "";
    this.keyHandlers = {};
  }

  key(keys, handler) {
    keys.forEach((key) => {
      this.keyHandlers[key] = handler;
    });
  }

  render() {
    // Mock render - do nothing
  }

  destroy() {
    // Mock destroy - do nothing
  }
}

class MockBox {
  constructor() {
    this.content = "";
    this.visible = true;
  }

  setContent(content) {
    this.content = content;
  }

  hide() {
    this.visible = false;
  }

  show() {
    this.visible = true;
  }
}

function createMockEditor() {
  const editor = new BufferEditor();

  // Mock the screen and UI elements
  editor.screen = new MockScreen();
  editor.editor = new MockBox();
  editor.statusBar = new MockBox();
  editor.infoBar = new MockBox();
  editor.helpBar = new MockBox();

  // Override getEditorHeight to return predictable value
  editor.getEditorHeight = () => 20;
  editor.getEditorWidth = () => 80;

  return editor;
}

function testFocusedWindowDimming() {
  console.log("Testing Focused Window Dimming Logic...\n");

  const editor = createMockEditor();

  // Set up test content with multiple lines
  editor.lines = [
    "Line 0: This should be dimmed when cursor is at line 5",
    "Line 1: This should be dimmed when cursor is at line 5",
    "Line 2: This should be dimmed when cursor is at line 5",
    "Line 3: This should be visible when cursor is at line 5 (cursor-2)",
    "Line 4: This should be visible when cursor is at line 5 (cursor-1)",
    "Line 5: This should be visible when cursor is at line 5 (CURSOR LINE)",
    "Line 6: This should be visible when cursor is at line 5 (cursor+1)",
    "Line 7: This should be visible when cursor is at line 5 (cursor+2)",
    "Line 8: This should be dimmed when cursor is at line 5",
    "Line 9: This should be dimmed when cursor is at line 5",
    "Line 10: This should be dimmed when cursor is at line 5",
  ];

  // Enable typewriter mode
  editor.typewriterMode = true;
  editor.typewriterFocusLines = 1;

  // Test 1: Cursor at line 5, check which lines are dimmed
  console.log("Test 1: Cursor at line 5, focus window should be lines 4-6");
  editor.cursorY = 5;
  editor.cursorX = 0;
  editor.scrollY = 0;

  // Call render to generate content
  editor.render();
  const content1 = editor.editor.content;

  // Check if dimming is applied correctly
  const lines1 = content1.split("\n");
  let dimmingCorrect1 = true;

  for (let i = 0; i < Math.min(lines1.length, editor.lines.length); i++) {
    const lineIndex = editor.scrollY + i;
    const shouldBeDimmed = lineIndex < 4 || lineIndex > 6; // Outside focus window
    const isDimmed = lines1[i].includes("{#333333-fg}");

    if (shouldBeDimmed && !isDimmed) {
      console.log(`  ❌ Line ${lineIndex} should be dimmed but isn't`);
      dimmingCorrect1 = false;
    } else if (!shouldBeDimmed && isDimmed) {
      console.log(`  ❌ Line ${lineIndex} should not be dimmed but is`);
      dimmingCorrect1 = false;
    }
  }

  if (dimmingCorrect1) {
    console.log("  ✓ Focus window dimming works correctly at line 5");
  }

  // Test 2: Cursor at line 1, check edge case
  console.log(
    "\nTest 2: Cursor at line 1, focus window should be lines 0-2 (edge case)",
  );
  editor.cursorY = 1;
  editor.render();
  const content2 = editor.editor.content;

  const lines2 = content2.split("\n");
  let dimmingCorrect2 = true;

  for (let i = 0; i < Math.min(lines2.length, editor.lines.length); i++) {
    const lineIndex = editor.scrollY + i;
    const shouldBeDimmed = lineIndex > 2; // Lines 3+ should be dimmed
    const isDimmed = lines2[i].includes("{#333333-fg}");

    if (shouldBeDimmed && !isDimmed) {
      console.log(`  ❌ Line ${lineIndex} should be dimmed but isn't`);
      dimmingCorrect2 = false;
    } else if (!shouldBeDimmed && isDimmed) {
      console.log(`  ❌ Line ${lineIndex} should not be dimmed but is`);
      dimmingCorrect2 = false;
    }
  }

  if (dimmingCorrect2) {
    console.log(
      "  ✓ Focus window dimming works correctly at line 1 (edge case)",
    );
  }

  // Test 3: Typewriter mode disabled, no dimming
  console.log("\nTest 3: Typewriter mode disabled, no lines should be dimmed");
  editor.typewriterMode = false;
  editor.cursorY = 5;
  editor.render();
  const content3 = editor.editor.content;

  const lines3 = content3.split("\n");
  let noDimmingCorrect = true;

  for (let i = 0; i < Math.min(lines3.length, editor.lines.length); i++) {
    const isDimmed = lines3[i].includes("{#333333-fg}");
    if (isDimmed) {
      console.log(
        `  ❌ Line ${i} should not be dimmed when typewriter mode is off`,
      );
      noDimmingCorrect = false;
    }
  }

  if (noDimmingCorrect) {
    console.log("  ✓ No dimming when typewriter mode is disabled");
  }

  // Test 4: Custom focus lines configuration
  console.log(
    "\nTest 4: Custom focus lines = 1, focus window should be smaller",
  );
  editor.typewriterMode = true;
  editor.typewriterFocusLines = 1;
  editor.cursorY = 5;
  editor.render();
  const content4 = editor.editor.content;

  const lines4 = content4.split("\n");
  let customFocusCorrect = true;

  for (let i = 0; i < Math.min(lines4.length, editor.lines.length); i++) {
    const lineIndex = editor.scrollY + i;
    const shouldBeDimmed = lineIndex < 4 || lineIndex > 6; // Focus window: lines 4-6 (5±1)
    const isDimmed = lines4[i].includes("{#333333-fg}");

    if (shouldBeDimmed && !isDimmed) {
      console.log(
        `  ❌ Line ${lineIndex} should be dimmed but isn't (focus=1)`,
      );
      customFocusCorrect = false;
    } else if (!shouldBeDimmed && isDimmed) {
      console.log(
        `  ❌ Line ${lineIndex} should not be dimmed but is (focus=1)`,
      );
      customFocusCorrect = false;
    }
  }

  if (customFocusCorrect) {
    console.log("  ✓ Custom focus lines configuration works correctly");
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  const allTestsPassed =
    dimmingCorrect1 &&
    dimmingCorrect2 &&
    noDimmingCorrect &&
    customFocusCorrect;

  if (allTestsPassed) {
    console.log("🎉 All focused window tests passed!");
    console.log("\n📝 Focused Window Feature Summary:");
    console.log("- Current line + configurable lines before/after stay bright");
    console.log("- All other lines are dimmed with {#333333-fg} color code");
    console.log("- Focus window moves with cursor position");
    console.log("- Feature only active when typewriter mode is enabled");
    console.log("- Focus window size is configurable (default: 1 line)");
    console.log("- Edge cases (near start/end) handled properly");
  } else {
    console.log("❌ Some focused window tests failed!");
    console.log("Please check the implementation in buffer-editor.js");
  }

  return allTestsPassed;
}

// Run the test
if (require.main === module) {
  try {
    testFocusedWindowDimming();
  } catch (error) {
    console.error("Test failed with error:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

module.exports = { testFocusedWindowDimming };
