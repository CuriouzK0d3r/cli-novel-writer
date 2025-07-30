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
  editor.getEditorHeight = () => 15;
  editor.getEditorWidth = () => 80;

  return editor;
}

function testExactFocusWindow() {
  console.log("🎯 Testing EXACT Focus Window Behavior\n");

  const editor = createMockEditor();

  // Set up test content with clear line numbers
  editor.lines = [
    "Line 0: Should be DIMMED when cursor at line 5",
    "Line 1: Should be DIMMED when cursor at line 5",
    "Line 2: Should be DIMMED when cursor at line 5",
    "Line 3: Should be DIMMED when cursor at line 5",
    "Line 4: Should be BRIGHT (1 line BEFORE cursor)",
    "Line 5: Should be BRIGHT (CURRENT cursor line)",
    "Line 6: Should be BRIGHT (1 line AFTER cursor)",
    "Line 7: Should be DIMMED when cursor at line 5",
    "Line 8: Should be DIMMED when cursor at line 5",
    "Line 9: Should be DIMMED when cursor at line 5"
  ];

  // Enable typewriter mode with focus = 1
  editor.typewriterMode = true;
  editor.typewriterFocusLines = 1;

  // Position cursor at line 5
  editor.cursorY = 5;
  editor.cursorX = 0;
  editor.scrollY = 0;

  console.log("📍 Cursor positioned at line 5");
  console.log("⚙️  typewriterFocusLines = 1");
  console.log("🔍 Expected focus window: lines 4, 5, 6\n");

  // Render and analyze
  editor.render();
  const content = editor.editor.content;
  const lines = content.split('\n');

  console.log("📊 ACTUAL RESULTS:\n");

  let focusWindowCorrect = true;
  const expectedBrightLines = [4, 5, 6];

  for (let i = 0; i < Math.min(lines.length, editor.lines.length); i++) {
    const lineIndex = i;
    const isDimmed = lines[i].includes('{#333333-fg}');
    const shouldBeBright = expectedBrightLines.includes(lineIndex);

    let status;
    let correctness = "";

    if (shouldBeBright && !isDimmed) {
      status = "✅ BRIGHT";
      correctness = " (CORRECT)";
    } else if (!shouldBeBright && isDimmed) {
      status = "🔘 DIMMED";
      correctness = " (CORRECT)";
    } else if (shouldBeBright && isDimmed) {
      status = "❌ DIMMED";
      correctness = " (SHOULD BE BRIGHT!)";
      focusWindowCorrect = false;
    } else {
      status = "❌ BRIGHT";
      correctness = " (SHOULD BE DIMMED!)";
      focusWindowCorrect = false;
    }

    console.log(`  Line ${lineIndex}: ${status}${correctness}`);
  }

  console.log("\n" + "=".repeat(50));

  if (focusWindowCorrect) {
    console.log("🎉 SUCCESS: Focus window is working exactly as expected!");
    console.log("\n📋 SUMMARY:");
    console.log("  • Line 4: BRIGHT (1 before cursor)");
    console.log("  • Line 5: BRIGHT (current cursor line)");
    console.log("  • Line 6: BRIGHT (1 after cursor)");
    console.log("  • All other lines: DIMMED");
    console.log("\n✨ This gives you exactly 3 visible lines total:");
    console.log("   - 1 line before cursor");
    console.log("   - Current cursor line");
    console.log("   - 1 line after cursor");
  } else {
    console.log("❌ ISSUE: Focus window is not behaving as expected!");
    console.log("Please check the implementation in buffer-editor.js");
  }

  // Test edge case: cursor at line 1
  console.log("\n" + "=".repeat(50));
  console.log("🧪 EDGE CASE TEST: Cursor at line 1\n");

  editor.cursorY = 1;
  editor.render();
  const edgeContent = editor.editor.content.split('\n');

  console.log("📍 Cursor positioned at line 1");
  console.log("🔍 Expected focus window: lines 0, 1, 2\n");

  const expectedBrightEdge = [0, 1, 2];
  let edgeCorrect = true;

  for (let i = 0; i < Math.min(edgeContent.length, editor.lines.length); i++) {
    const lineIndex = i;
    const isDimmed = edgeContent[i].includes('{#333333-fg}');
    const shouldBeBright = expectedBrightEdge.includes(lineIndex);

    let status;
    if (shouldBeBright && !isDimmed) {
      status = "✅ BRIGHT";
    } else if (!shouldBeBright && isDimmed) {
      status = "🔘 DIMMED";
    } else {
      status = "❌ WRONG";
      edgeCorrect = false;
    }

    console.log(`  Line ${lineIndex}: ${status}`);
  }

  if (edgeCorrect) {
    console.log("\n✅ Edge case handling is correct!");
  } else {
    console.log("\n❌ Edge case has issues!");
  }

  return focusWindowCorrect && edgeCorrect;
}

// Run the test
if (require.main === module) {
  try {
    const success = testExactFocusWindow();
    if (success) {
      console.log("\n🚀 All tests passed! The focus window is working perfectly.");
    } else {
      console.log("\n🔧 Some tests failed. Check the implementation.");
      process.exit(1);
    }
  } catch (error) {
    console.error("Test failed with error:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

module.exports = { testExactFocusWindow };
