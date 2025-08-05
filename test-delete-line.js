#!/usr/bin/env node

/**
 * Test script for the deleteLine functionality in the buffer editor
 * This script tests the new Ctrl+Shift+K shortcut to delete lines
 */

const WritersEditor = require('./src/editor/index.js');
const fs = require('fs');
const path = require('path');

async function testDeleteLine() {
  console.log('🧪 Testing Delete Line Functionality (Ctrl+Shift+K)');
  console.log('====================================================');

  // Create a temporary test file
  const testFilePath = path.join(__dirname, 'test-delete-line-temp.txt');
  const testContent = `Line 1: This is the first line
Line 2: This line will be deleted
Line 3: This is the third line
Line 4: Another line to test with
Line 5: Final line for testing`;

  try {
    // Write test content to file
    fs.writeFileSync(testFilePath, testContent);
    console.log('✅ Created test file with 5 lines');

    console.log('\n📝 Test Instructions:');
    console.log('1. The editor will open with 5 test lines');
    console.log('2. Navigate to line 2 (press j or down arrow in navigation mode)');
    console.log('3. Press Ctrl+Shift+K to delete the current line');
    console.log('4. The line "Line 2: This line will be deleted" should disappear');
    console.log('5. Test with other lines to verify functionality');
    console.log('6. Press F1 to see the help dialog and verify the shortcut is documented');
    console.log('7. Press Ctrl+X to exit when done testing');

    console.log('\n🎯 Expected Behavior:');
    console.log('- Ctrl+Shift+K deletes the current line');
    console.log('- Cursor adjusts position appropriately');
    console.log('- Undo (Ctrl+Z) should restore deleted lines');
    console.log('- Works in both navigation and insert modes');

    console.log('\n🚀 Starting editor...\n');

    // Launch the editor with the test file
    const editor = new WritersEditor();
    await editor.launch(testFilePath);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    // Clean up test file if it exists
    try {
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
        console.log('🧹 Cleaned up test file');
      }
    } catch (cleanupError) {
      console.warn('⚠️ Could not clean up test file:', cleanupError.message);
    }
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testDeleteLine().catch(console.error);
}

module.exports = { testDeleteLine };
