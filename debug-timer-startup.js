#!/usr/bin/env node

/**
 * Comprehensive Timer Startup Diagnosis
 * This script tests every aspect of timer initialization and startup to identify
 * why the timer "still does not start" in the real editor environment
 */

const BufferEditor = require('./src/editor/buffer-editor');
const PomodoroTimer = require('./src/editor/pomodoro-timer');
const blessed = require('blessed');
const fs = require('fs').promises;

async function diagnoseTimerStartup() {
  console.log('🔍 Comprehensive Timer Startup Diagnosis...\n');

  try {
    // Test 1: Basic Timer Class Functionality
    console.log('📊 Test 1: Basic Timer Class');
    const standaloneTimer = new PomodoroTimer();
    console.log('  ✅ Timer class instantiated');

    // Test starting standalone timer
    standaloneTimer.start();
    const standaloneStatus = standaloneTimer.getStatus();
    console.log(`  Timer state: isRunning=${standaloneStatus.isRunning}, isPaused=${standaloneStatus.isPaused}`);
    console.log(`  Result: ${standaloneStatus.isRunning ? '✅ Standalone timer starts' : '❌ Standalone timer fails'}`);
    standaloneTimer.stop();

    // Test 2: Editor Timer Initialization
    console.log('\n📊 Test 2: Editor Timer Initialization');
    const editor = new BufferEditor();
    console.log('  ✅ Editor created');

    // Check if pomodoro timer exists
    console.log(`  Timer exists: ${editor.pomodoroTimer ? '✅ YES' : '❌ NO'}`);
    if (editor.pomodoroTimer) {
      console.log(`  Timer type: ${typeof editor.pomodoroTimer}`);
      console.log(`  Timer constructor: ${editor.pomodoroTimer.constructor.name}`);

      // Check timer methods
      const methods = ['start', 'pause', 'resume', 'stop', 'getStatus'];
      for (const method of methods) {
        console.log(`  Has ${method}(): ${typeof editor.pomodoroTimer[method] === 'function' ? '✅' : '❌'}`);
      }
    }

    // Test 3: Timer Start Method Direct Call
    console.log('\n📊 Test 3: Direct Timer Start Call');
    if (editor.pomodoroTimer) {
      const beforeStart = editor.pomodoroTimer.getStatus();
      console.log(`  Before start: isRunning=${beforeStart.isRunning}, isPaused=${beforeStart.isPaused}`);

      editor.pomodoroTimer.start();

      const afterStart = editor.pomodoroTimer.getStatus();
      console.log(`  After start: isRunning=${afterStart.isRunning}, isPaused=${afterStart.isPaused}`);
      console.log(`  Direct start result: ${afterStart.isRunning ? '✅ SUCCESS' : '❌ FAILED'}`);

      editor.pomodoroTimer.stop();
    }

    // Test 4: Editor Toggle Method
    console.log('\n📊 Test 4: Editor Toggle Method');
    if (editor.togglePomodoroTimer) {
      console.log('  ✅ togglePomodoroTimer method exists');

      const beforeToggle = editor.pomodoroTimer.getStatus();
      console.log(`  Before toggle: isRunning=${beforeToggle.isRunning}, isPaused=${beforeToggle.isPaused}`);

      // Call toggle method
      editor.togglePomodoroTimer();

      const afterToggle = editor.pomodoroTimer.getStatus();
      console.log(`  After toggle: isRunning=${afterToggle.isRunning}, isPaused=${afterToggle.isPaused}`);
      console.log(`  Toggle result: ${afterToggle.isRunning ? '✅ SUCCESS' : '❌ FAILED'}`);

      editor.pomodoroTimer.stop();
    } else {
      console.log('  ❌ togglePomodoroTimer method missing');
    }

    // Test 5: Keybinding System
    console.log('\n📊 Test 5: Keybinding System');

    // Create minimal screen for keybinding test
    const screen = blessed.screen({
      smartCSR: true,
      title: 'Timer Diagnosis',
      debug: false
    });

    editor.screen = screen;

    // Check if setupKeybindings was called
    console.log('  ✅ Screen attached to editor');

    try {
      editor.createInterface();
      console.log('  ✅ Interface created');

      editor.setupKeybindings();
      console.log('  ✅ Keybindings setup completed');
    } catch (error) {
      console.log(`  ❌ Interface/keybinding error: ${error.message}`);
    }

    // Test 6: F3 Key Simulation
    console.log('\n📊 Test 6: F3 Key Simulation');

    // Check if F3 key is bound
    const keyMap = screen.keyMap || {};
    const hasF3Binding = Object.keys(keyMap).some(key =>
      key.includes('f3') || key.includes('F3')
    );
    console.log(`  F3 key bound: ${hasF3Binding ? '✅ YES' : '❌ NO'}`);

    // Try to simulate F3 press
    try {
      const beforeF3 = editor.pomodoroTimer.getStatus();
      console.log(`  Before F3: isRunning=${beforeF3.isRunning}, isPaused=${beforeF3.isPaused}`);

      // Simulate F3 key press
      screen.emit('keypress', null, { name: 'f3' });

      // Wait a moment for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      const afterF3 = editor.pomodoroTimer.getStatus();
      console.log(`  After F3: isRunning=${afterF3.isRunning}, isPaused=${afterF3.isPaused}`);
      console.log(`  F3 simulation result: ${afterF3.isRunning ? '✅ SUCCESS' : '❌ FAILED'}`);

    } catch (error) {
      console.log(`  ❌ F3 simulation error: ${error.message}`);
    }

    screen.destroy();

    // Test 7: Callback System
    console.log('\n📊 Test 7: Callback System');

    const testTimer = new PomodoroTimer();
    let tickCallbackCalled = false;
    let phaseCallbackCalled = false;
    let pomodoroCallbackCalled = false;

    testTimer.setCallbacks({
      onTick: () => { tickCallbackCalled = true; },
      onPhaseComplete: () => { phaseCallbackCalled = true; },
      onPomodoroComplete: () => { pomodoroCallbackCalled = true; }
    });

    console.log('  ✅ Callbacks set');

    testTimer.start();
    await new Promise(resolve => setTimeout(resolve, 1100)); // Wait for at least one tick
    testTimer.stop();

    console.log(`  Tick callback called: ${tickCallbackCalled ? '✅ YES' : '❌ NO'}`);
    console.log(`  Phase callback called: ${phaseCallbackCalled ? '✅ YES (unexpected)' : '✅ NO (expected)'}`);
    console.log(`  Pomodoro callback called: ${pomodoroCallbackCalled ? '✅ YES (unexpected)' : '✅ NO (expected)'}`);

    // Test 8: Message System
    console.log('\n📊 Test 8: Message System');

    const testEditor = new BufferEditor();

    // Check if showMessage method exists and works
    if (typeof testEditor.showMessage === 'function') {
      console.log('  ✅ showMessage method exists');

      try {
        testEditor.showMessage('Test message');
        console.log('  ✅ showMessage call succeeded');
      } catch (error) {
        console.log(`  ❌ showMessage error: ${error.message}`);
      }
    } else {
      console.log('  ❌ showMessage method missing');
    }

    // Test 9: File System Integration
    console.log('\n📊 Test 9: File System Integration');

    try {
      // Create a test file
      await fs.writeFile('timer-test.md', '# Timer Test\n\nTesting timer with actual file.');
      console.log('  ✅ Test file created');

      const fileEditor = new BufferEditor();

      // Try to open the file
      await fileEditor.openFile('timer-test.md');
      console.log('  ✅ File opened in editor');

      // Test timer with file loaded
      const beforeFileTimer = fileEditor.pomodoroTimer.getStatus();
      fileEditor.pomodoroTimer.start();
      const afterFileTimer = fileEditor.pomodoroTimer.getStatus();

      console.log(`  Timer with file: ${afterFileTimer.isRunning ? '✅ WORKS' : '❌ FAILS'}`);

      fileEditor.pomodoroTimer.stop();

      // Clean up
      await fs.unlink('timer-test.md');
      console.log('  ✅ Test file cleaned up');

    } catch (error) {
      console.log(`  ❌ File system test error: ${error.message}`);
    }

    // Test 10: Environment Check
    console.log('\n📊 Test 10: Environment Check');

    console.log(`  Node version: ${process.version}`);
    console.log(`  Platform: ${process.platform}`);
    console.log(`  TTY: ${process.stdout.isTTY ? '✅ YES' : '❌ NO'}`);
    console.log(`  Terminal: ${process.env.TERM || 'unknown'}`);

    // Check for required modules
    const requiredModules = ['blessed', 'fs'];
    for (const module of requiredModules) {
      try {
        require(module);
        console.log(`  Module ${module}: ✅ Available`);
      } catch (error) {
        console.log(`  Module ${module}: ❌ Missing`);
      }
    }

    // Test 11: Step-by-Step Timer Start
    console.log('\n📊 Test 11: Step-by-Step Timer Start Process');

    const debugTimer = new PomodoroTimer();

    console.log('  Step 1: Check initial state');
    let state = debugTimer.getStatus();
    console.log(`    isRunning: ${state.isRunning}, isPaused: ${state.isPaused}`);
    console.log(`    timeRemaining: ${state.timeRemaining}ms`);
    console.log(`    timerInterval: ${debugTimer.timerInterval || 'null'}`);

    console.log('  Step 2: Set callbacks');
    let stepTick = false;
    debugTimer.setCallbacks({
      onTick: () => { stepTick = true; }
    });

    console.log('  Step 3: Call start() method');
    debugTimer.start();

    console.log('  Step 4: Check state immediately after start');
    state = debugTimer.getStatus();
    console.log(`    isRunning: ${state.isRunning}, isPaused: ${state.isPaused}`);
    console.log(`    timerInterval: ${debugTimer.timerInterval ? 'SET' : 'null'}`);
    console.log(`    startTime: ${debugTimer.startTime ? 'SET' : 'null'}`);

    console.log('  Step 5: Wait for tick callback');
    await new Promise(resolve => setTimeout(resolve, 1100));
    console.log(`    Tick callback fired: ${stepTick ? '✅ YES' : '❌ NO'}`);

    console.log('  Step 6: Check final state');
    state = debugTimer.getStatus();
    console.log(`    isRunning: ${state.isRunning}, isPaused: ${state.isPaused}`);
    console.log(`    timeFormatted: ${state.timeFormatted}`);

    debugTimer.stop();

    // Summary and Recommendations
    console.log('\n🔍 DIAGNOSIS SUMMARY:');
    console.log('=====================================');

    // Collect all the test results for analysis
    const diagnostics = {
      standaloneTimer: standaloneStatus.isRunning,
      editorTimer: editor.pomodoroTimer ? true : false,
      directStart: editor.pomodoroTimer ? editor.pomodoroTimer.getStatus().isRunning : false,
      tickCallback: tickCallbackCalled,
      stepByStep: stepTick
    };

    console.log('Key Findings:');
    for (const [test, result] of Object.entries(diagnostics)) {
      console.log(`  ${test}: ${result ? '✅ PASS' : '❌ FAIL'}`);
    }

    // Provide specific recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    if (!diagnostics.standaloneTimer) {
      console.log('❌ CRITICAL: Basic timer class is broken - check PomodoroTimer implementation');
    } else if (!diagnostics.editorTimer) {
      console.log('❌ CRITICAL: Timer not properly initialized in BufferEditor');
    } else if (!diagnostics.tickCallback) {
      console.log('❌ ISSUE: Timer interval not firing - check setInterval/clearInterval logic');
    } else if (!diagnostics.stepByStep) {
      console.log('❌ ISSUE: Timer start process failing - check start() method implementation');
    } else {
      console.log('✅ All basic components working - issue may be in keybinding or UI integration');
    }

    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Check the specific failing component identified above');
    console.log('2. Verify F3 keybinding is properly registered');
    console.log('3. Test in actual editor environment with file loaded');
    console.log('4. Check for any error messages or console output');
    console.log('5. Verify timer callbacks are not being blocked by UI operations');

  } catch (error) {
    console.error('❌ Diagnosis failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run diagnosis if called directly
if (require.main === module) {
  diagnoseTimerStartup().then(() => {
    console.log('\n🏁 Timer startup diagnosis complete.');
    process.exit(0);
  });
}

module.exports = { diagnoseTimerStartup };
