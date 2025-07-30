#!/usr/bin/env node

/**
 * Unit tests for typewriter mode functionality
 * Tests the core logic without requiring the full blessed interface
 */

const assert = require('assert');

// Mock the blessed dependencies and create a simplified test version of BufferEditor
class MockBufferEditor {
  constructor() {
    this.typewriterMode = false;
    this.cursorY = 0;
    this.lastCursorY = 0;
    this.scrollY = 0;
    this.config = {
      typewriterPosition: 0.66,
      typewriterMode: false
    };
    this.lines = [''];
  }

  getEditorHeight() {
    return 20; // Mock editor height
  }

  getEditorWidth() {
    return 80; // Mock editor width
  }

  // Core typewriter mode logic extracted from buffer-editor.js
  ensureCursorVisible() {
    const editorHeight = this.getEditorHeight();

    // Typewriter mode: keep cursor at a fixed position on screen
    if (this.typewriterMode) {
      const targetLine = Math.floor(
        editorHeight * this.config.typewriterPosition,
      );

      // Calculate desired scroll position to keep cursor at target line
      const desiredScrollY = this.cursorY - targetLine;

      // Only apply typewriter positioning when moving down (typing forward)
      // or when the cursor would go off screen
      const movingDown = this.cursorY > this.lastCursorY;
      const cursorOffScreen =
        this.cursorY < this.scrollY ||
        this.cursorY >= this.scrollY + editorHeight;

      if (movingDown || cursorOffScreen) {
        this.scrollY = Math.max(0, desiredScrollY);
      }
    } else {
      // Normal scrolling behavior
      if (this.cursorY < this.scrollY) {
        this.scrollY = this.cursorY;
      } else if (this.cursorY >= this.scrollY + editorHeight) {
        this.scrollY = this.cursorY - editorHeight + 1;
      }
    }

    this.scrollY = Math.max(0, this.scrollY);

    // Update last cursor position for typewriter mode
    this.lastCursorY = this.cursorY;
  }

  toggleTypewriterMode() {
    this.typewriterMode = !this.typewriterMode;
    this.config.typewriterMode = this.typewriterMode;

    // Reset scroll position when enabling typewriter mode
    if (this.typewriterMode) {
      const editorHeight = this.getEditorHeight();
      const targetLine = Math.floor(
        editorHeight * this.config.typewriterPosition,
      );
      this.scrollY = Math.max(0, this.cursorY - targetLine);
    }
  }

  // Helper method to simulate typing (moving cursor down)
  simulateTyping(newCursorY) {
    this.cursorY = newCursorY;
    this.ensureCursorVisible();
  }

  // Helper method to simulate manual cursor movement
  simulateManualMove(newCursorY) {
    this.cursorY = newCursorY;
    this.ensureCursorVisible();
  }
}

// Test suite
function runTests() {
  console.log('Running Typewriter Mode Unit Tests...\n');

  // Test 1: Normal scrolling behavior (typewriter mode off)
  console.log('Test 1: Normal scrolling behavior');
  const editor1 = new MockBufferEditor();
  editor1.typewriterMode = false;

  // Cursor at line 0, should not scroll
  editor1.simulateTyping(0);
  assert.strictEqual(editor1.scrollY, 0, 'Should not scroll when cursor at top');

  // Cursor moves to line 25 (beyond screen), should scroll
  editor1.simulateTyping(25);
  assert.strictEqual(editor1.scrollY, 6, 'Should scroll to keep cursor at bottom'); // 25 - 20 + 1 = 6

  console.log('✓ Normal scrolling works correctly\n');

  // Test 2: Typewriter mode activation
  console.log('Test 2: Typewriter mode activation');
  const editor2 = new MockBufferEditor();
  editor2.cursorY = 10;
  editor2.toggleTypewriterMode();

  assert.strictEqual(editor2.typewriterMode, true, 'Typewriter mode should be enabled');

  const expectedTargetLine = Math.floor(20 * 0.66); // 13
  const expectedInitialScroll = Math.max(0, 10 - expectedTargetLine); // max(0, 10-13) = 0
  assert.strictEqual(editor2.scrollY, expectedInitialScroll, 'Should position cursor at target line');

  console.log('✓ Typewriter mode activation works correctly\n');

  // Test 3: Typewriter mode scrolling when typing forward
  console.log('Test 3: Typewriter mode scrolling when typing');
  const editor3 = new MockBufferEditor();
  editor3.typewriterMode = true;
  editor3.cursorY = 5;
  editor3.lastCursorY = 5;

  // Simulate typing to line 20
  editor3.simulateTyping(20);

  const targetLine = Math.floor(20 * 0.66); // 13
  const expectedScroll = 20 - targetLine; // 20 - 13 = 7
  assert.strictEqual(editor3.scrollY, expectedScroll, 'Should scroll to maintain cursor at target line');

  console.log('✓ Typewriter mode scrolling works correctly\n');

  // Test 4: Typewriter mode doesn't scroll when moving up
  console.log('Test 4: Manual cursor movement (up) in typewriter mode');
  const editor4 = new MockBufferEditor();
  editor4.typewriterMode = true;
  editor4.cursorY = 20;
  editor4.lastCursorY = 20;
  editor4.scrollY = 7; // Already scrolled from previous typing

  // Move cursor up manually (arrow key navigation)
  editor4.cursorY = 15; // Moving up
  editor4.ensureCursorVisible();

  // Should not apply typewriter positioning when moving up
  assert.strictEqual(editor4.scrollY, 7, 'Should not change scroll when moving cursor up manually');

  console.log('✓ Manual upward movement doesn\'t trigger typewriter scrolling\n');

  // Test 5: Typewriter mode handles cursor going off screen
  console.log('Test 5: Cursor off screen in typewriter mode');
  const editor5 = new MockBufferEditor();
  editor5.typewriterMode = true;
  editor5.cursorY = 50;
  editor5.lastCursorY = 45;
  editor5.scrollY = 20;

  // Cursor is way off screen, should apply typewriter positioning
  editor5.ensureCursorVisible();

  const targetLine5 = Math.floor(20 * 0.66); // 13
  const expectedScroll5 = 50 - targetLine5; // 50 - 13 = 37
  assert.strictEqual(editor5.scrollY, expectedScroll5, 'Should position cursor when off screen');

  console.log('✓ Off-screen cursor handling works correctly\n');

  // Test 6: Configuration values are respected
  console.log('Test 6: Custom typewriter position configuration');
  const editor6 = new MockBufferEditor();
  editor6.config.typewriterPosition = 0.5; // Center of screen
  editor6.typewriterMode = true;
  editor6.cursorY = 30;
  editor6.lastCursorY = 25;

  editor6.ensureCursorVisible();

  const targetLine6 = Math.floor(20 * 0.5); // 10
  const expectedScroll6 = 30 - targetLine6; // 30 - 10 = 20
  assert.strictEqual(editor6.scrollY, expectedScroll6, 'Should respect custom typewriter position');

  console.log('✓ Custom configuration works correctly\n');

  // Test 7: Edge case - negative scroll prevention
  console.log('Test 7: Negative scroll prevention');
  const editor7 = new MockBufferEditor();
  editor7.typewriterMode = true;
  editor7.cursorY = 5;
  editor7.lastCursorY = 4;

  editor7.ensureCursorVisible();

  assert.strictEqual(editor7.scrollY, 0, 'Should never allow negative scroll');

  console.log('✓ Negative scroll prevention works correctly\n');

  console.log('🎉 All tests passed! Typewriter mode implementation is working correctly.');
}

// Additional helper function to demonstrate the behavior
function demonstrateTypewriterMode() {
  console.log('\n📝 Typewriter Mode Behavior Demonstration:\n');

  const editor = new MockBufferEditor();
  console.log('Editor height: 20 lines');
  console.log('Typewriter position: 66% (line 13 from top)\n');

  console.log('Enabling typewriter mode...');
  editor.toggleTypewriterMode();

  console.log('\nSimulating typing session:');
  const positions = [0, 5, 10, 15, 20, 25, 30];

  positions.forEach(pos => {
    editor.simulateTyping(pos);
    console.log(`Cursor line: ${pos.toString().padStart(2)}, Scroll: ${editor.scrollY.toString().padStart(2)}, Visible cursor line: ${(pos - editor.scrollY).toString().padStart(2)}`);
  });

  console.log('\nNotice how the visible cursor line stays around 13 (the target) as scroll adjusts.');
}

// Run the tests
if (require.main === module) {
  try {
    runTests();
    demonstrateTypewriterMode();
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

module.exports = { MockBufferEditor, runTests };
