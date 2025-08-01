#!/usr/bin/env node

/**
 * F3 Keybinding Debug Test
 * This script specifically tests why F3 key is not working to start the pomodoro timer
 */

const BufferEditor = require('./src/editor/buffer-editor');
const blessed = require('blessed');

async function debugF3Keybinding() {
  console.log('🔍 F3 Keybinding Debug Test...\n');

  try {
    // Create a simple screen for testing
    const screen = blessed.screen({
      smartCSR: true,
      title: 'F3 Debug Test',
      debug: false,
      warnings: false
    });

    console.log('✅ Screen created');

    // Test 1: Basic blessed key handling
    console.log('\n📊 Test 1: Basic Blessed Key Handling');

    let f3Pressed = false;
    let anyKeyPressed = false;

    screen.key(['f3'], () => {
      f3Pressed = true;
      console.log('  🎯 F3 key detected by blessed!');
    });

    screen.key(['q'], () => {
      console.log('  🎯 Q key detected - test working');
      screen.destroy();
    });

    screen.on('keypress', (ch, key) => {
      anyKeyPressed = true;
      console.log(`  📝 Key pressed: name="${key?.name}", full="${key?.full}", sequence="${key?.sequence}"`);
      if (key?.name === 'f3') {
        console.log('  ✅ F3 detected in keypress handler');
      }
    });

    console.log('  ℹ️  Press F3 to test, then Q to continue...');

    // Wait for user input
    await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.log('  ⏰ Timeout - continuing without input');
        screen.destroy();
        resolve();
      }, 5000);

      screen.key(['q'], () => {
        clearTimeout(timeout);
        screen.destroy();
        resolve();
      });

      screen.render();
    });

    console.log(`  F3 detected: ${f3Pressed ? '✅ YES' : '❌ NO'}`);
    console.log(`  Any key detected: ${anyKeyPressed ? '✅ YES' : '❌ NO'}`);

    // Test 2: Editor F3 binding
    console.log('\n📊 Test 2: Editor F3 Binding');

    const editor = new BufferEditor();
    console.log('  ✅ Editor created');

    // Create new screen for editor
    const editorScreen = blessed.screen({
      smartCSR: true,
      title: 'Editor F3 Test',
      debug: false
    });

    editor.screen = editorScreen;
    editor.createInterface();
    console.log('  ✅ Editor interface created');

    editor.setupKeybindings();
    console.log('  ✅ Editor keybindings setup');

    // Check timer before F3
    const beforeStatus = editor.pomodoroTimer.getStatus();
    console.log(`  Timer before F3: isRunning=${beforeStatus.isRunning}`);

    // Test if we can manually trigger the toggle
    console.log('\n  🧪 Manual toggle test:');
    editor.togglePomodoroTimer();
    const manualStatus = editor.pomodoroTimer.getStatus();
    console.log(`  Manual toggle result: isRunning=${manualStatus.isRunning}`);
    editor.pomodoroTimer.stop(); // Reset

    // Test F3 key simulation
    console.log('\n  🧪 F3 simulation test:');
    let editorF3Fired = false;

    // Override the toggle method to detect if it's called
    const originalToggle = editor.togglePomodoroTimer;
    editor.togglePomodoroTimer = function() {
      editorF3Fired = true;
      console.log('  🎯 togglePomodoroTimer called via F3!');
      return originalToggle.call(this);
    };

    // Try different F3 key formats
    const f3Variants = [
      { name: 'f3' },
      { name: 'f3', full: 'f3' },
      { name: 'F3' },
      { name: 'F3', full: 'F3' },
      { sequence: '\u001bOP' }, // Some terminals use this for F1
      { sequence: '\u001bOQ' }, // F2
      { sequence: '\u001bOR' }, // F3
      { sequence: '\u001b[13~' }, // Another F3 variant
    ];

    for (const keyVariant of f3Variants) {
      try {
        editorScreen.emit('keypress', null, keyVariant);
        await new Promise(resolve => setTimeout(resolve, 10));
      } catch (error) {
        console.log(`  ⚠️  Error with key variant ${JSON.stringify(keyVariant)}: ${error.message}`);
      }
    }

    console.log(`  F3 handler called: ${editorF3Fired ? '✅ YES' : '❌ NO'}`);

    // Test 3: Check exact keybinding registration
    console.log('\n📊 Test 3: Keybinding Registration');

    // Check if the screen has the F3 binding
    if (editorScreen._events && editorScreen._events.keypress) {
      console.log('  ✅ Screen has keypress events');

      // Try to inspect the key mappings
      if (editorScreen.keyMap) {
        console.log('  ✅ Screen has keyMap');
        const f3Keys = Object.keys(editorScreen.keyMap).filter(k =>
          k.includes('f3') || k.includes('F3')
        );
        console.log(`  F3 keys in keyMap: ${JSON.stringify(f3Keys)}`);
      } else {
        console.log('  ❌ Screen has no keyMap');
      }
    } else {
      console.log('  ❌ Screen has no keypress events');
    }

    // Test 4: Direct key binding test
    console.log('\n📊 Test 4: Direct Key Binding Test');

    let directF3Called = false;

    // Add our own F3 handler
    editorScreen.key(['f3'], () => {
      directF3Called = true;
      console.log('  🎯 Direct F3 handler called!');
    });

    // Emit F3 key
    editorScreen.emit('keypress', null, { name: 'f3' });

    console.log(`  Direct F3 handler called: ${directF3Called ? '✅ YES' : '❌ NO'}`);

    // Test 5: Check for conflicts
    console.log('\n📊 Test 5: Key Conflict Check');

    // Check if any other handlers might be interfering
    if (editorScreen._events) {
      const eventTypes = Object.keys(editorScreen._events);
      console.log(`  Event types registered: ${eventTypes.join(', ')}`);

      if (editorScreen._events.keypress) {
        const handlerCount = Array.isArray(editorScreen._events.keypress)
          ? editorScreen._events.keypress.length
          : 1;
        console.log(`  Keypress handlers: ${handlerCount}`);
      }
    }

    // Test 6: Alternative key binding
    console.log('\n📊 Test 6: Alternative Key Binding');

    let altKeyWorking = false;

    // Try binding to a different key that should work
    editorScreen.key(['f1'], () => {
      altKeyWorking = true;
      console.log('  🎯 F1 alternative key working!');
    });

    editorScreen.emit('keypress', null, { name: 'f1' });
    console.log(`  Alternative key (F1) working: ${altKeyWorking ? '✅ YES' : '❌ NO'}`);

    editorScreen.destroy();

    // Summary and recommendations
    console.log('\n🔍 F3 KEYBINDING ANALYSIS:');
    console.log('=====================================');

    console.log('\nTest Results:');
    console.log(`  Manual timer toggle: ${manualStatus.isRunning ? '✅ WORKS' : '❌ BROKEN'}`);
    console.log(`  F3 key simulation: ${editorF3Fired ? '✅ WORKS' : '❌ BROKEN'}`);
    console.log(`  Direct F3 binding: ${directF3Called ? '✅ WORKS' : '❌ BROKEN'}`);
    console.log(`  Alternative key: ${altKeyWorking ? '✅ WORKS' : '❌ BROKEN'}`);

    console.log('\n💡 DIAGNOSIS:');
    if (!manualStatus.isRunning) {
      console.log('❌ CRITICAL: Timer toggle method is broken');
    } else if (!directF3Called && !altKeyWorking) {
      console.log('❌ ISSUE: Blessed keybinding system not working');
    } else if (!directF3Called && altKeyWorking) {
      console.log('❌ ISSUE: F3 key specifically not working (terminal/blessed issue)');
    } else if (!editorF3Fired && directF3Called) {
      console.log('❌ ISSUE: Editor keybinding setup has problems');
    } else {
      console.log('✅ Keybinding should be working - may be environment specific');
    }

    console.log('\n🎯 SOLUTIONS:');
    if (!directF3Called) {
      console.log('1. Try using a different key (F2, F5, etc.) for pomodoro timer');
      console.log('2. Check terminal F3 key support: some terminals intercept F3');
      console.log('3. Try Ctrl+P or another key combination instead');
    } else if (!editorF3Fired) {
      console.log('1. Check setupKeybindings() is called after createInterface()');
      console.log('2. Verify no other key handlers are blocking F3');
      console.log('3. Check for keybinding order conflicts');
    }

    console.log('\n🔧 WORKAROUND:');
    console.log('Try these keys in the editor as alternatives to F3:');
    console.log('  F2 - Theme switch (currently)');
    console.log('  F5 - Could be reassigned to timer');
    console.log('  Ctrl+P - Good alternative for "Pomodoro"');

  } catch (error) {
    console.error('❌ F3 debug failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run debug if called directly
if (require.main === module) {
  debugF3Keybinding().then(() => {
    console.log('\n🏁 F3 keybinding debug complete.');
    process.exit(0);
  });
}

module.exports = { debugF3Keybinding };
