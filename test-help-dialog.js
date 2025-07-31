#!/usr/bin/env node

// Quick test to verify help dialog key handling
const blessed = require('blessed');

// Create a test screen
const screen = blessed.screen({
  smartCSR: true,
  title: 'Help Dialog Test'
});

// Create a simple version of the help dialog
const dialog = blessed.box({
  parent: screen,
  top: 'center',
  left: 'center',
  width: 60,
  height: 20,
  border: { type: 'line', fg: 'green' },
  label: ' Help Dialog Test ',
  style: { fg: 'white', bg: 'black' },
  keys: true,
  mouse: true,
  grabKeys: true,
  modal: true,
});

const helpText = blessed.text({
  parent: dialog,
  top: 1,
  left: 2,
  right: 2,
  bottom: 2,
  content: 'Test help dialog\n\nPress any key to close this dialog.\n\nIf this works correctly, any key should close it.',
  style: { fg: 'white' },
});

const instructions = blessed.text({
  parent: dialog,
  bottom: 0,
  left: 2,
  right: 2,
  height: 1,
  content: 'Press any key to close',
  style: { fg: 'cyan' },
});

// Handle keypress events
let keyPressed = false;

dialog.on('keypress', (ch, key) => {
  if (!keyPressed && key && (!key.ctrl && !key.meta && !key.alt && !key.shift)) {
    keyPressed = true;
    console.log(`✅ Key pressed: ${key.name || ch || 'unknown'}`);
    dialog.destroy();
    screen.render();
    setTimeout(() => process.exit(0), 100);
  }
});

// Also handle specific keys
dialog.key(['escape'], () => {
  if (!keyPressed) {
    keyPressed = true;
    console.log('✅ Escape pressed');
    dialog.destroy();
    screen.render();
    setTimeout(() => process.exit(0), 100);
  }
});

dialog.focus();
screen.render();

console.log('🧪 Testing help dialog key handling...');
console.log('A dialog should appear. Try pressing any key to close it.');

// Exit gracefully
screen.key(['C-c'], () => {
  console.log('\n❌ Test cancelled');
  process.exit(0);
});
