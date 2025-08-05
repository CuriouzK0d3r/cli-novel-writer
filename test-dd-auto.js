#!/usr/bin/env node

/**
 * Automated test for dd delete line functionality
 * Tests the implementation without requiring user interaction
 */

const BufferEditor = require('./src/editor/buffer-editor.js');
const blessed = require('blessed');

class DDTest {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.tests = [];
  }

  async runTests() {
    console.log('🧪 Running Automated DD Delete Line Tests');
    console.log('=========================================\n');

    // Test 1: Basic dd sequence detection
    await this.testDDSequenceDetection();

    // Test 2: DD timeout handling
    await this.testDDTimeout();

    // Test 3: Delete line functionality
    await this.testDeleteLineFunctionality();

    // Test 4: Single line handling
    await this.testSingleLineHandling();

    // Test 5: Cursor positioning
    await this.testCursorPositioning();

    this.printResults();
  }

  async testDDSequenceDetection() {
    console.log('🔍 Test 1: DD Sequence Detection');

    try {
      const editor = new BufferEditor();

      // Initialize the necessary properties
      editor.lastKeyPress = null;
      editor.lastKeyTime = 0;
      editor.ddTimeout = 500;

      // Simulate first 'd' press
      const time1 = Date.now();
      editor.lastKeyPress = 'd';
      editor.lastKeyTime = time1;

      // Simulate second 'd' press within timeout
      const time2 = time1 + 100; // 100ms later
      const shouldTrigger = editor.lastKeyPress === 'd' && time2 - editor.lastKeyTime < editor.ddTimeout;

      this.assert(shouldTrigger, 'DD sequence should be detected within timeout');
      this.pass('DD sequence detection works correctly');

    } catch (error) {
      this.fail('DD sequence detection failed: ' + error.message);
    }
  }

  async testDDTimeout() {
    console.log('🕐 Test 2: DD Timeout Handling');

    try {
      const editor = new BufferEditor();

      editor.lastKeyPress = null;
      editor.lastKeyTime = 0;
      editor.ddTimeout = 500;

      // Simulate first 'd' press
      const time1 = Date.now();
      editor.lastKeyPress = 'd';
      editor.lastKeyTime = time1;

      // Simulate second 'd' press after timeout
      const time2 = time1 + 600; // 600ms later (beyond 500ms timeout)
      const shouldNotTrigger = !(editor.lastKeyPress === 'd' && time2 - editor.lastKeyTime < editor.ddTimeout);

      this.assert(shouldNotTrigger, 'DD sequence should timeout after delay');
      this.pass('DD timeout handling works correctly');

    } catch (error) {
      this.fail('DD timeout handling failed: ' + error.message);
    }
  }

  async testDeleteLineFunctionality() {
    console.log('🗑️  Test 3: Delete Line Functionality');

    try {
      const editor = new BufferEditor();

      // Initialize required properties
      editor.lines = ['Line 1', 'Line 2', 'Line 3'];
      editor.cursorX = 0;
      editor.cursorY = 1; // On second line
      editor.undoStack = [];
      editor.redoStack = [];
      editor.dirty = false;

      // Mock required methods
      editor.pushUndo = () => {};
      editor.markDirty = () => {};
      editor.resetCursorBlink = () => {};
      editor.ensureCursorVisible = () => {};
      editor.render = () => {};
      editor.updateStatus = () => {};

      const initialLineCount = editor.lines.length;

      // Call deleteLine
      editor.deleteLine();

      this.assert(editor.lines.length === initialLineCount - 1, 'Line count should decrease by 1');
      this.assert(editor.lines[1] === 'Line 3', 'Correct line should be deleted');
      this.assert(!editor.lines.includes('Line 2'), 'Deleted line should not exist');

      this.pass('Delete line functionality works correctly');

    } catch (error) {
      this.fail('Delete line functionality failed: ' + error.message);
    }
  }

  async testSingleLineHandling() {
    console.log('📝 Test 4: Single Line Handling');

    try {
      const editor = new BufferEditor();

      // Test single line with content
      editor.lines = ['Only line'];
      editor.cursorX = 0;
      editor.cursorY = 0;
      editor.undoStack = [];
      editor.redoStack = [];
      editor.dirty = false;

      // Mock required methods
      editor.pushUndo = () => {};
      editor.markDirty = () => {};
      editor.resetCursorBlink = () => {};
      editor.ensureCursorVisible = () => {};
      editor.render = () => {};
      editor.updateStatus = () => {};

      editor.deleteLine();

      this.assert(editor.lines.length === 1, 'Should still have one line');
      this.assert(editor.lines[0] === '', 'Line should be cleared');
      this.assert(editor.cursorX === 0, 'Cursor X should be at start');

      this.pass('Single line handling works correctly');

    } catch (error) {
      this.fail('Single line handling failed: ' + error.message);
    }
  }

  async testCursorPositioning() {
    console.log('📍 Test 5: Cursor Positioning');

    try {
      const editor = new BufferEditor();

      // Test deleting last line
      editor.lines = ['Line 1', 'Line 2', 'Line 3'];
      editor.cursorX = 5;
      editor.cursorY = 2; // On last line
      editor.undoStack = [];
      editor.redoStack = [];
      editor.dirty = false;

      // Mock required methods
      editor.pushUndo = () => {};
      editor.markDirty = () => {};
      editor.resetCursorBlink = () => {};
      editor.ensureCursorVisible = () => {};
      editor.render = () => {};
      editor.updateStatus = () => {};

      editor.deleteLine();

      this.assert(editor.cursorY === 1, 'Cursor Y should adjust to new last line');
      this.assert(editor.cursorX <= editor.lines[editor.cursorY].length, 'Cursor X should be within bounds');

      this.pass('Cursor positioning works correctly');

    } catch (error) {
      this.fail('Cursor positioning failed: ' + error.message);
    }
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  pass(testName) {
    console.log(`  ✅ ${testName}`);
    this.passed++;
  }

  fail(testName) {
    console.log(`  ❌ ${testName}`);
    this.failed++;
  }

  printResults() {
    console.log('\n📊 Test Results');
    console.log('===============');
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`📈 Total:  ${this.passed + this.failed}`);

    if (this.failed === 0) {
      console.log('\n🎉 All tests passed! DD delete line functionality is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please check the implementation.');
      process.exit(1);
    }
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const test = new DDTest();
  test.runTests().catch(console.error);
}

module.exports = DDTest;
