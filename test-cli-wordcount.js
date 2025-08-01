#!/usr/bin/env node

/**
 * Test Script for CLI Word Count Dialog
 * Helps debug and test the word count modal functionality in the CLI editor
 */

const blessed = require('blessed');
const path = require('path');

// Create a simple test to isolate the word count dialog issue
function createTestDialog() {
  // Create a screen
  const screen = blessed.screen({
    smartCSR: true,
    title: 'Word Count Dialog Test',
    cursor: {
      artificial: true,
      shape: 'line',
      blink: true
    }
  });

  // Create main content area
  const mainBox = blessed.box({
    parent: screen,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    content: `Word Count Dialog Test

Press 'w' to open word count dialog
Press 'q' to quit

This test helps debug the word count dialog closing issue.
The dialog should close when you press any key.

Status: Waiting for input...`,
    style: {
      fg: 'white',
      bg: 'black'
    },
    tags: true
  });

  // Mock word count stats
  const mockStats = {
    words: 1250,
    characters: 7500,
    charactersNoSpaces: 6250,
    lines: 85,
    paragraphs: 15,
    readingTime: '6 minutes',
    currentLine: 42,
    currentColumn: 18
  };

  // Function to show word count dialog
  function showWordCountDialog() {
    return new Promise((resolve) => {
      console.log('Creating word count dialog...');

      const dialog = blessed.box({
        parent: screen,
        top: 'center',
        left: 'center',
        width: 60,
        height: 15,
        border: {
          type: 'line',
          fg: 'green'
        },
        label: ' Document Statistics ',
        style: {
          fg: 'white',
          bg: 'black',
          border: {
            fg: 'green'
          }
        },
        keys: true,
        mouse: true,
        grabKeys: true,
        modal: true
      });

      const content = `
Word Count: ${mockStats.words}
Characters: ${mockStats.characters}
Characters (no spaces): ${mockStats.charactersNoSpaces}
Lines: ${mockStats.lines}
Paragraphs: ${mockStats.paragraphs}
Reading Time: ${mockStats.readingTime}

Current Position:
  Line: ${mockStats.currentLine}
  Column: ${mockStats.currentColumn}
      `.trim();

      const text = blessed.text({
        parent: dialog,
        top: 1,
        left: 2,
        right: 2,
        bottom: 2,
        content: content,
        style: {
          fg: 'white'
        }
      });

      const instructions = blessed.text({
        parent: dialog,
        bottom: 0,
        left: 2,
        right: 2,
        height: 1,
        content: 'Press any key to close (debugging enabled)',
        style: {
          fg: 'cyan'
        }
      });

      console.log('Dialog created, setting up event handlers...');

      let dialogClosed = false;

      // Close function with debugging
      const closeDialog = (reason) => {
        if (dialogClosed) {
          console.log(`Close attempt ignored - dialog already closed (reason: ${reason})`);
          return;
        }

        console.log(`Closing dialog - reason: ${reason}`);
        dialogClosed = true;

        try {
          dialog.destroy();
          screen.render();
          mainBox.setContent(mainBox.getContent() + '\n\nDialog closed successfully!');
          screen.render();
          resolve();
        } catch (error) {
          console.error('Error closing dialog:', error);
          resolve();
        }
      };

      // Multiple event handlers for debugging

      // 1. Specific key handlers
      dialog.key(['escape'], () => {
        closeDialog('escape key');
      });

      dialog.key(['enter'], () => {
        closeDialog('enter key');
      });

      dialog.key(['space'], () => {
        closeDialog('space key');
      });

      dialog.key(['q'], () => {
        closeDialog('q key');
      });

      // 2. General keypress handler
      dialog.on('keypress', (ch, key) => {
        console.log('Keypress detected:', {
          ch: ch,
          key: key ? {
            name: key.name,
            ctrl: key.ctrl,
            meta: key.meta,
            alt: key.alt,
            shift: key.shift
          } : null
        });

        if (!dialogClosed) {
          closeDialog(`keypress: ${key ? key.name : ch}`);
        }
      });

      // 3. Mouse click handler
      dialog.on('click', () => {
        console.log('Dialog clicked');
        closeDialog('mouse click');
      });

      // 4. Focus handlers for debugging
      dialog.on('focus', () => {
        console.log('Dialog gained focus');
      });

      dialog.on('blur', () => {
        console.log('Dialog lost focus');
      });

      // 5. Backup timeout
      const timeoutId = setTimeout(() => {
        if (!dialogClosed) {
          console.log('Dialog timeout - force closing after 10 seconds');
          closeDialog('timeout');
        }
      }, 10000);

      // Clean up timeout when dialog closes
      const originalResolve = resolve;
      resolve = () => {
        clearTimeout(timeoutId);
        originalResolve();
      };

      console.log('Focusing dialog...');
      dialog.focus();
      screen.render();
      console.log('Dialog should now be visible and focused');
    });
  }

  // Main screen key handlers
  screen.key(['q', 'C-c'], () => {
    console.log('Quitting application...');
    process.exit(0);
  });

  screen.key(['w'], async () => {
    console.log('Opening word count dialog...');
    mainBox.setContent(mainBox.getContent() + '\n\nOpening word count dialog...');
    screen.render();

    try {
      await showWordCountDialog();
      console.log('Word count dialog closed successfully');
    } catch (error) {
      console.error('Error with word count dialog:', error);
      mainBox.setContent(mainBox.getContent() + '\n\nError: ' + error.message);
      screen.render();
    }
  });

  // Focus the main box
  mainBox.focus();
  screen.render();

  return screen;
}

// Test different scenarios
function runTests() {
  console.log('Starting CLI Word Count Dialog Tests...');
  console.log('Console logging enabled for debugging');

  const screen = createTestDialog();

  console.log('Test instructions:');
  console.log('1. Press "w" to open word count dialog');
  console.log('2. Try different ways to close it:');
  console.log('   - Press Enter');
  console.log('   - Press Escape');
  console.log('   - Press Space');
  console.log('   - Press any other key');
  console.log('   - Click on the dialog');
  console.log('3. Check console output for debugging info');
  console.log('4. Press "q" to quit the test');
  console.log('');
  console.log('Look for any error messages or unexpected behavior');
}

// Show debug information
function showDebugInfo() {
  console.log('='.repeat(60));
  console.log('CLI Word Count Dialog Debug Information');
  console.log('='.repeat(60));
  console.log('Node.js version:', process.version);
  console.log('Platform:', process.platform);
  console.log('Terminal:', process.env.TERM || 'unknown');
  console.log('TTY:', process.stdout.isTTY);
  console.log('Blessed version:', require('blessed/package.json').version);
  console.log('Current directory:', process.cwd());

  // Check if we're in the right directory
  const expectedFile = path.join(process.cwd(), 'src', 'editor', 'dialogs.js');
  const fs = require('fs');
  if (fs.existsSync(expectedFile)) {
    console.log('✅ Found dialogs.js - in correct project directory');
  } else {
    console.log('❌ dialogs.js not found - may not be in project directory');
    console.log('Expected:', expectedFile);
  }

  console.log('='.repeat(60));
  console.log('');
}

// Main execution
if (require.main === module) {
  showDebugInfo();
  runTests();
}

module.exports = {
  createTestDialog,
  showDebugInfo
};
