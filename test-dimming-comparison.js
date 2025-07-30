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

function testDimmingComparison() {
  console.log("🔍 Dimming Comparison Test - Old vs New Settings\n");

  const editor = createMockEditor();

  // Set up test content
  editor.lines = [
    "Line 0: Far above cursor",
    "Line 1: Still above cursor",
    "Line 2: Close above cursor",
    "Line 3: Adjacent above cursor (OLD: bright, NEW: bright)",
    "Line 4: Adjacent above cursor (OLD: bright, NEW: bright)",
    "Line 5: CURRENT CURSOR LINE (always bright)",
    "Line 6: Adjacent below cursor (OLD: bright, NEW: bright)",
    "Line 7: Adjacent below cursor (OLD: bright, NEW: bright)",
    "Line 8: Close below cursor",
    "Line 9: Still below cursor",
    "Line 10: Far below cursor"
  ];

  // Position cursor at line 5
  editor.cursorY = 5;
  editor.cursorX = 0;
  editor.scrollY = 0;
  editor.typewriterMode = true;

  console.log("📊 COMPARISON: Cursor at line 5\n");

  // Test OLD settings (2 lines, lighter dimming)
  console.log("🔹 OLD SETTINGS (focus ±2 lines, lighter dimming):");
  editor.typewriterFocusLines = 2;

  // Temporarily change dimming color to old setting
  const originalRender = editor.render;
  editor.render = function() {
    const editorHeight = this.getEditorHeight();
    const editorWidth = this.getEditorWidth();
    let content = "";

    for (let i = 0; i < editorHeight; i++) {
      const lineIndex = this.scrollY + i;
      let line = "";

      if (lineIndex < this.lines.length) {
        let lineContent = this.lines[lineIndex];

        // OLD dimming logic with lighter color
        const shouldDimLine = this.typewriterMode &&
          (lineIndex < this.cursorY - this.typewriterFocusLines ||
           lineIndex > this.cursorY + this.typewriterFocusLines);

        if (shouldDimLine) {
          lineContent = `{#666666-fg}${lineContent}{/}`;
        }

        line += lineContent;
      }

      content += line;
      if (i < editorHeight - 1) content += "\n";
    }

    this.editor.setContent(content);
  };

  editor.render();
  const oldContent = editor.editor.content.split('\n');

  for (let i = 0; i < Math.min(oldContent.length, editor.lines.length); i++) {
    const lineIndex = i;
    const isDimmed = oldContent[i].includes('{#666666-fg}');
    const status = isDimmed ? "DIMMED   " : "BRIGHT   ";
    const focusRange = (lineIndex >= 3 && lineIndex <= 7) ? "IN FOCUS" : "OUT OF FOCUS";
    console.log(`  Line ${lineIndex}: ${status} - ${focusRange}`);
  }

  console.log("\n🔸 NEW SETTINGS (focus ±1 line, darker dimming):");

  // Test NEW settings (1 line, darker dimming)
  editor.typewriterFocusLines = 1;

  // Restore original render with new dimming
  editor.render = originalRender;
  editor.render();
  const newContent = editor.editor.content.split('\n');

  for (let i = 0; i < Math.min(newContent.length, editor.lines.length); i++) {
    const lineIndex = i;
    const isDimmed = newContent[i].includes('{#333333-fg}');
    const status = isDimmed ? "DIMMED   " : "BRIGHT   ";
    const focusRange = (lineIndex >= 4 && lineIndex <= 6) ? "IN FOCUS" : "OUT OF FOCUS";
    console.log(`  Line ${lineIndex}: ${status} - ${focusRange}`);
  }

  console.log("\n" + "=".repeat(60));
  console.log("📈 COMPARISON SUMMARY:\n");

  console.log("OLD SETTINGS:");
  console.log("  • Focus window: 5 lines (current ± 2)");
  console.log("  • Dimming color: #666666 (medium gray)");
  console.log("  • Lines in focus: 3, 4, 5, 6, 7");
  console.log("  • Lines dimmed: 0, 1, 2, 8, 9, 10");

  console.log("\nNEW SETTINGS:");
  console.log("  • Focus window: 3 lines (current ± 1)");
  console.log("  • Dimming color: #333333 (dark gray)");
  console.log("  • Lines in focus: 4, 5, 6");
  console.log("  • Lines dimmed: 0, 1, 2, 3, 7, 8, 9, 10");

  console.log("\n🎯 BENEFITS OF NEW SETTINGS:");
  console.log("  ✓ More aggressive dimming creates stronger focus");
  console.log("  ✓ Smaller focus window reduces distractions");
  console.log("  ✓ Darker dimming makes focused lines more prominent");
  console.log("  ✓ Tighter focus improves concentration");

  console.log("\n💡 VISUAL IMPACT:");
  console.log("  • OLD: More context visible, moderate contrast");
  console.log("  • NEW: Minimal context, high contrast for laser focus");

  // Demonstrate color difference
  console.log("\n🎨 COLOR COMPARISON (if your terminal supports colors):");
  console.log("  Old dimming: \x1b[38;5;246mThis text appears in medium gray\x1b[0m");
  console.log("  New dimming: \x1b[38;5;238mThis text appears in dark gray\x1b[0m");
  console.log("  Normal text: This text appears in normal brightness");

  return true;
}

// Run the test
if (require.main === module) {
  try {
    testDimmingComparison();
  } catch (error) {
    console.error("Test failed with error:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

module.exports = { testDimmingComparison };
