#!/usr/bin/env node

/**
 * Test script for alternative Pomodoro timer keybindings
 * This test verifies that Ctrl+P works as an alternative to F3
 */

const BufferEditor = require('./src/editor/buffer-editor');
const blessed = require('blessed');

async function testCtrlPTimer() {
  console.log('🔍 Testing Ctrl+P Timer Keybinding...\n');

  try {
    // Create editor instance
    const editor = new BufferEditor();
    console.log('✅ Editor created');

    // Create minimal screen
    const screen = blessed.screen({
      smartCSR: true,
      title: 'Ctrl+P Timer Test',
      debug: false
    });

    editor.screen = screen;
    editor.createInterface();
    editor.setupKeybindings();
    console.log('✅ Editor fully initialized');

    // Test 1: Manual toggle to verify timer works
    console.log('\n📊 Test 1: Manual Timer Toggle');
    const beforeManual = editor.pomodoroTimer.getStatus();
    editor.togglePomodoroTimer();
    const afterManual = editor.pomodoroTimer.getStatus();
    console.log(`  Manual toggle: ${beforeManual.isRunning} → ${afterManual.isRunning}`);
    console.log(`  Result: ${afterManual.isRunning ? '✅ PASS' : '❌ FAIL'}`);
    editor.pomodoroTimer.stop(); // Reset

    // Test 2: Ctrl+P keybinding simulation
    console.log('\n📊 Test 2: Ctrl+P Keybinding');

    let ctrlPCalled = false;
    const originalToggle = editor.togglePomodoroTimer;
    editor.togglePomodoroTimer = function() {
      ctrlPCalled = true;
      console.log('  🎯 togglePomodoroTimer called via Ctrl+P!');
      return originalToggle.call(this);
    };

    const beforeCtrlP = editor.pomodoroTimer.getStatus();
    console.log(`  Before Ctrl+P: isRunning=${beforeCtrlP.isRunning}`);

    // Simulate Ctrl+P keypress
    screen.emit('keypress', null, { name: 'p', ctrl: true });
    await new Promise(resolve => setTimeout(resolve, 100));

    const afterCtrlP = editor.pomodoroTimer.getStatus();
    console.log(`  After Ctrl+P: isRunning=${afterCtrlP.isRunning}`);
    console.log(`  Handler called: ${ctrlPCalled ? '✅ YES' : '❌ NO'}`);
    console.log(`  Timer started: ${afterCtrlP.isRunning ? '✅ YES' : '❌ NO'}`);

    // Test 3: Ctrl+R reset keybinding
    console.log('\n📊 Test 3: Ctrl+R Reset Keybinding');

    let ctrlRCalled = false;
    const originalReset = editor.resetPomodoroTimer;
    editor.resetPomodoroTimer = function() {
      ctrlRCalled = true;
      console.log('  🎯 resetPomodoroTimer called via Ctrl+R!');
      return originalReset.call(this);
    };

    // Make sure timer is running first
    if (!afterCtrlP.isRunning) {
      editor.pomodoroTimer.start();
    }

    const beforeCtrlR = editor.pomodoroTimer.getStatus();
    console.log(`  Before Ctrl+R: isRunning=${beforeCtrlR.isRunning}`);

    // Simulate Ctrl+R keypress
    screen.emit('keypress', null, { name: 'r', ctrl: true });
    await new Promise(resolve => setTimeout(resolve, 100));

    const afterCtrlR = editor.pomodoroTimer.getStatus();
    console.log(`  After Ctrl+R: isRunning=${afterCtrlR.isRunning}`);
    console.log(`  Handler called: ${ctrlRCalled ? '✅ YES' : '❌ NO'}`);
    console.log(`  Timer reset: ${!afterCtrlR.isRunning ? '✅ YES' : '❌ NO'}`);

    // Test 4: Ctrl+Shift+P dialog keybinding
    console.log('\n📊 Test 4: Ctrl+Shift+P Dialog Keybinding');

    let ctrlShiftPCalled = false;
    const originalDialog = editor.showPomodoroDialog;
    editor.showPomodoroDialog = function() {
      ctrlShiftPCalled = true;
      console.log('  🎯 showPomodoroDialog called via Ctrl+Shift+P!');
      // Don't actually show dialog in test
      return Promise.resolve();
    };

    // Simulate Ctrl+Shift+P keypress
    screen.emit('keypress', null, { name: 'p', ctrl: true, shift: true });
    await new Promise(resolve => setTimeout(resolve, 100));

    console.log(`  Dialog handler called: ${ctrlShiftPCalled ? '✅ YES' : '❌ NO'}`);

    // Test 5: Status bar integration
    console.log('\n📊 Test 5: Status Bar Integration');

    // Start timer
    editor.pomodoroTimer.start();

    // Update status bar
    editor.updateStatus();

    const statusBarContent = editor.statusBar.content;
    const hasTimerInfo = statusBarContent.includes('🍅') || statusBarContent.includes('☕');
    const hasRunningIcon = statusBarContent.includes('▶️');

    console.log(`  Status bar: "${statusBarContent}"`);
    console.log(`  Has timer info: ${hasTimerInfo ? '✅ YES' : '❌ NO'}`);
    console.log(`  Shows running: ${hasRunningIcon ? '✅ YES' : '❌ NO'}`);

    // Cleanup
    screen.destroy();

    // Summary
    console.log('\n🔍 TEST SUMMARY:');
    console.log('=====================================');
    console.log(`Manual toggle:     ${afterManual.isRunning ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Ctrl+P keybinding: ${ctrlPCalled && afterCtrlP.isRunning ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Ctrl+R reset:      ${ctrlRCalled && !afterCtrlR.isRunning ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Ctrl+Shift+P:      ${ctrlShiftPCalled ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Status bar:        ${hasTimerInfo && hasRunningIcon ? '✅ PASS' : '❌ FAIL'}`);

    const allPassed = afterManual.isRunning &&
                     ctrlPCalled && afterCtrlP.isRunning &&
                     ctrlRCalled && !afterCtrlR.isRunning &&
                     ctrlShiftPCalled &&
                     hasTimerInfo && hasRunningIcon;

    if (allPassed) {
      console.log('\n🎉 ALL TESTS PASSED!');
      console.log('The alternative keybindings are working correctly.');
      console.log('\n📖 How to use the timer now:');
      console.log('  Ctrl+P         - Start/pause timer (alternative to F3)');
      console.log('  Ctrl+R         - Reset timer (alternative to Shift+F3)');
      console.log('  Ctrl+Shift+P   - Show timer info (alternative to F4)');
      console.log('\nIf F3 doesn\'t work in your terminal, use Ctrl+P instead!');
    } else {
      console.log('\n⚠️  SOME TESTS FAILED');
      console.log('Check the individual test results above.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run test if called directly
if (require.main === module) {
  testCtrlPTimer().then(() => {
    console.log('\n🏁 Ctrl+P timer test complete.');
    process.exit(0);
  });
}

module.exports = { testCtrlPTimer };
