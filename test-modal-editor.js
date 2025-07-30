#!/usr/bin/env node

const path = require('path');
const fs = require('fs-extra');
const WritersEditor = require('./src/editor');

async function testModalEditor() {
  console.log('Testing Modal Editor...');

  // Create a simple test file
  const testContent = `# Test Document

This is a test document for the modal editor.

## Features to Test

1. Start in Navigation mode (NAV)
2. Press 'i' to enter Insert mode (INS)
3. Press 'Escape' to return to Navigation mode

## Navigation Mode Controls

- w/a/s/d keys for movement (up/left/down/right)
- h/j/k/l keys for movement (left/down/up/right)
- Cannot edit text in this mode

## Insert Mode Controls

- Arrow keys for movement
- Can type and edit text normally
- Backspace, Delete, Enter work normally

Try switching between modes and notice the status bar change!
`;

  const testFile = path.join(__dirname, 'test-modal.md');

  try {
    // Write test content
    await fs.writeFile(testFile, testContent);
    console.log('✅ Created test file: test-modal.md');

    // Launch editor
    const editor = new WritersEditor();
    await editor.launch(testFile);

    // Cleanup
    console.log('Cleaning up test file...');
    await fs.remove(testFile);
    console.log('✅ Test completed');

  } catch (error) {
    console.error('❌ Error:', error.message);

    // Cleanup on error
    try {
      await fs.remove(testFile);
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
  }
}

// Handle interruption
process.on('SIGINT', async () => {
  console.log('\n\n⚠️  Test interrupted. Cleaning up...');

  try {
    const testFile = path.join(__dirname, 'test-modal.md');
    await fs.remove(testFile);
    console.log('✅ Cleanup completed.');
  } catch (error) {
    // Ignore cleanup errors
  }

  process.exit(0);
});

if (require.main === module) {
  testModalEditor().catch(error => {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  });
}

module.exports = testModalEditor;
