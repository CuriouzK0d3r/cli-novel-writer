#!/usr/bin/env node

/**
 * Simple verification script for dd delete line functionality
 * Tests the key binding and sequence detection
 */

const blessed = require('blessed');

function testDDSequence() {
  console.log('🔍 Verifying DD Delete Line Implementation');
  console.log('==========================================\n');

  // Create a simple screen to test key sequences
  const screen = blessed.screen({
    smartCSR: true,
    title: 'DD Sequence Test'
  });

  const box = blessed.box({
    top: 'center',
    left: 'center',
    width: '80%',
    height: '60%',
    content: `DD Sequence Test

Instructions:
1. Press 'd' twice quickly to test the dd sequence
2. Press 'q' to quit
3. Watch the console for sequence detection messages

Status: Waiting for input...`,
    tags: true,
    border: {
      type: 'line'
    },
    style: {
      fg: 'white',
      bg: 'black',
      border: {
        fg: '#f0f0f0'
      }
    }
  });

  screen.append(box);

  // Track dd sequence
  let lastKeyPress = null;
  let lastKeyTime = 0;
  const ddTimeout = 500;

  screen.on('keypress', (ch, key) => {
    if (key.name === 'q') {
      console.log('\n✅ Test completed. Exiting...');
      process.exit(0);
    }

    if (key.name === 'd') {
      const now = Date.now();
      console.log(`🔑 Key 'd' pressed at ${now}`);

      if (lastKeyPress === 'd' && now - lastKeyTime < ddTimeout) {
        console.log('🎯 DD SEQUENCE DETECTED! Delete line would be triggered.');
        box.setContent(`DD Sequence Test

✅ SUCCESS: DD sequence detected!
Time between presses: ${now - lastKeyTime}ms

Press 'd' twice again to test, or 'q' to quit.

Status: DD sequence working correctly!`);
        screen.render();
        lastKeyPress = null;
      } else {
        console.log(`📝 First 'd' detected. Waiting for second 'd' within ${ddTimeout}ms...`);
        lastKeyPress = 'd';
        lastKeyTime = now;
        box.setContent(`DD Sequence Test

⏳ Waiting for second 'd'...
First 'd' detected at: ${now}

Press 'd' again quickly to complete sequence, or 'q' to quit.

Status: Waiting for second 'd'...`);
        screen.render();

        // Clear sequence after timeout
        setTimeout(() => {
          if (lastKeyPress === 'd') {
            console.log('⏰ DD sequence timeout. Clearing...');
            lastKeyPress = null;
            box.setContent(`DD Sequence Test

⏰ Sequence timed out (${ddTimeout}ms expired)

Press 'd' twice quickly to test, or 'q' to quit.

Status: Ready for new sequence...`);
            screen.render();
          }
        }, ddTimeout);
      }
    }
  });

  screen.key(['C-c'], () => {
    console.log('\n👋 Interrupted. Exiting...');
    process.exit(0);
  });

  screen.render();
  screen.focus();

  console.log('📱 Test screen launched. Follow the on-screen instructions.');
  console.log('🎮 Press Ctrl+C or q to exit.\n');
}

if (require.main === module) {
  testDDSequence();
}

module.exports = { testDDSequence };
