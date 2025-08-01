#!/usr/bin/env node

/**
 * Debug script for timer state persistence and status updates
 * Tests if the timer state is being corrupted or incorrectly reported
 */

const PomodoroTimer = require('./src/editor/pomodoro-timer');

async function debugTimerState() {
  console.log('🔍 Debugging Timer State Persistence...\n');

  try {
    const timer = new PomodoroTimer();
    console.log('✅ Timer created');

    // Test 1: Initial state
    console.log('\n📊 Test 1: Initial State');
    let status = timer.getStatus();
    console.log(`   isRunning: ${status.isRunning}`);
    console.log(`   isPaused: ${status.isPaused}`);
    console.log(`   Expected: isRunning=false, isPaused=false`);
    console.log(`   Result: ${!status.isRunning && !status.isPaused ? '✅ PASS' : '❌ FAIL'}`);

    // Test 2: Start timer
    console.log('\n📊 Test 2: Start Timer');
    timer.start();
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
    status = timer.getStatus();
    console.log(`   isRunning: ${status.isRunning}`);
    console.log(`   isPaused: ${status.isPaused}`);
    console.log(`   Expected: isRunning=true, isPaused=false`);
    console.log(`   Result: ${status.isRunning && !status.isPaused ? '✅ PASS' : '❌ FAIL'}`);

    // Test 3: Multiple getStatus() calls (check for state corruption)
    console.log('\n📊 Test 3: Multiple getStatus() Calls');
    for (let i = 1; i <= 5; i++) {
      const testStatus = timer.getStatus();
      console.log(`   Call ${i}: isRunning=${testStatus.isRunning}, isPaused=${testStatus.isPaused}`);
      if (testStatus.isRunning !== true || testStatus.isPaused !== false) {
        console.log(`   ❌ FAIL: State changed unexpectedly on call ${i}`);
        break;
      }
      if (i === 5) {
        console.log(`   ✅ PASS: State consistent across multiple calls`);
      }
    }

    // Test 4: Pause timer
    console.log('\n📊 Test 4: Pause Timer');
    timer.pause();
    await new Promise(resolve => setTimeout(resolve, 100));
    status = timer.getStatus();
    console.log(`   isRunning: ${status.isRunning}`);
    console.log(`   isPaused: ${status.isPaused}`);
    console.log(`   Expected: isRunning=true, isPaused=true`);
    console.log(`   Result: ${status.isRunning && status.isPaused ? '✅ PASS' : '❌ FAIL'}`);

    // Test 5: Resume timer
    console.log('\n📊 Test 5: Resume Timer');
    timer.resume();
    await new Promise(resolve => setTimeout(resolve, 100));
    status = timer.getStatus();
    console.log(`   isRunning: ${status.isRunning}`);
    console.log(`   isPaused: ${status.isPaused}`);
    console.log(`   Expected: isRunning=true, isPaused=false`);
    console.log(`   Result: ${status.isRunning && !status.isPaused ? '✅ PASS' : '❌ FAIL'}`);

    // Test 6: Time progression check
    console.log('\n📊 Test 6: Time Progression');
    const beforeTime = timer.getStatus().timeRemaining;
    console.log(`   Time before wait: ${timer.formatTime(beforeTime)}`);
    await new Promise(resolve => setTimeout(resolve, 2100)); // Wait 2+ seconds
    const afterTime = timer.getStatus().timeRemaining;
    console.log(`   Time after wait: ${timer.formatTime(afterTime)}`);
    const timeDiff = beforeTime - afterTime;
    console.log(`   Time difference: ${timeDiff}ms (expected: ~2000ms)`);
    console.log(`   Result: ${timeDiff >= 1500 && timeDiff <= 2500 ? '✅ PASS' : '❌ FAIL'}`);

    // Test 7: Stop timer
    console.log('\n📊 Test 7: Stop Timer');
    timer.stop();
    await new Promise(resolve => setTimeout(resolve, 100));
    status = timer.getStatus();
    console.log(`   isRunning: ${status.isRunning}`);
    console.log(`   isPaused: ${status.isPaused}`);
    console.log(`   Expected: isRunning=false, isPaused=false`);
    console.log(`   Result: ${!status.isRunning && !status.isPaused ? '✅ PASS' : '❌ FAIL'}`);

    // Test 8: Edge case - double start
    console.log('\n📊 Test 8: Edge Case - Double Start');
    timer.start();
    const statusAfterFirstStart = timer.getStatus();
    timer.start(); // Try to start again
    const statusAfterSecondStart = timer.getStatus();
    console.log(`   First start: isRunning=${statusAfterFirstStart.isRunning}, isPaused=${statusAfterFirstStart.isPaused}`);
    console.log(`   Second start: isRunning=${statusAfterSecondStart.isRunning}, isPaused=${statusAfterSecondStart.isPaused}`);
    console.log(`   States match: ${JSON.stringify(statusAfterFirstStart) === JSON.stringify(statusAfterSecondStart)}`);
    console.log(`   Result: ${statusAfterFirstStart.isRunning === statusAfterSecondStart.isRunning ? '✅ PASS' : '❌ FAIL'}`);

    // Test 9: Edge case - pause when not running
    console.log('\n📊 Test 9: Edge Case - Pause When Stopped');
    timer.stop();
    const statusBeforePause = timer.getStatus();
    timer.pause(); // Try to pause when stopped
    const statusAfterPause = timer.getStatus();
    console.log(`   Before pause: isRunning=${statusBeforePause.isRunning}, isPaused=${statusBeforePause.isPaused}`);
    console.log(`   After pause: isRunning=${statusAfterPause.isRunning}, isPaused=${statusAfterPause.isPaused}`);
    console.log(`   Result: ${!statusAfterPause.isRunning && !statusAfterPause.isPaused ? '✅ PASS' : '❌ FAIL'}`);

    // Test 10: Toggle sequence simulation (F3 behavior)
    console.log('\n📊 Test 10: Toggle Sequence (F3 Simulation)');

    // Reset to known state
    timer.stop();

    // First F3 - should start
    console.log('   F3 Press 1 (should start):');
    status = timer.getStatus();
    if (!status.isRunning) {
      console.log('     Action: start()');
      timer.start();
    } else if (status.isPaused) {
      console.log('     Action: resume()');
      timer.resume();
    } else {
      console.log('     Action: pause()');
      timer.pause();
    }
    await new Promise(resolve => setTimeout(resolve, 100));
    status = timer.getStatus();
    console.log(`     Result: isRunning=${status.isRunning}, isPaused=${status.isPaused}`);

    // Second F3 - should pause
    console.log('   F3 Press 2 (should pause):');
    if (!status.isRunning) {
      console.log('     Action: start()');
      timer.start();
    } else if (status.isPaused) {
      console.log('     Action: resume()');
      timer.resume();
    } else {
      console.log('     Action: pause()');
      timer.pause();
    }
    await new Promise(resolve => setTimeout(resolve, 100));
    status = timer.getStatus();
    console.log(`     Result: isRunning=${status.isRunning}, isPaused=${status.isPaused}`);

    // Third F3 - should resume
    console.log('   F3 Press 3 (should resume):');
    if (!status.isRunning) {
      console.log('     Action: start()');
      timer.start();
    } else if (status.isPaused) {
      console.log('     Action: resume()');
      timer.resume();
    } else {
      console.log('     Action: pause()');
      timer.pause();
    }
    await new Promise(resolve => setTimeout(resolve, 100));
    status = timer.getStatus();
    console.log(`     Result: isRunning=${status.isRunning}, isPaused=${status.isPaused}`);
    console.log(`     Expected final state: isRunning=true, isPaused=false`);
    console.log(`     Test result: ${status.isRunning && !status.isPaused ? '✅ PASS' : '❌ FAIL'}`);

    // Test 11: Status object integrity
    console.log('\n📊 Test 11: Status Object Integrity');
    const finalStatus = timer.getStatus();
    const requiredFields = ['isRunning', 'isPaused', 'phase', 'timeRemaining', 'timeFormatted', 'completedPomodoros', 'phaseProgress'];
    let integrityPass = true;

    for (const field of requiredFields) {
      if (!(field in finalStatus)) {
        console.log(`     Missing field: ${field}`);
        integrityPass = false;
      }
    }

    console.log(`   Status object: ${JSON.stringify(finalStatus, null, 2)}`);
    console.log(`   All required fields present: ${integrityPass ? '✅ PASS' : '❌ FAIL'}`);

    // Check data types
    const typeChecks = [
      ['isRunning', 'boolean'],
      ['isPaused', 'boolean'],
      ['phase', 'string'],
      ['timeRemaining', 'number'],
      ['timeFormatted', 'string'],
      ['completedPomodoros', 'number'],
      ['phaseProgress', 'number']
    ];

    let typePass = true;
    for (const [field, expectedType] of typeChecks) {
      const actualType = typeof finalStatus[field];
      if (actualType !== expectedType) {
        console.log(`     Wrong type for ${field}: expected ${expectedType}, got ${actualType}`);
        typePass = false;
      }
    }
    console.log(`   All field types correct: ${typePass ? '✅ PASS' : '❌ FAIL'}`);

    // Clean up
    timer.stop();

    console.log('\n🏁 Timer State Debug Complete');
    console.log('=====================================');
    console.log('If all tests pass, the timer state logic is working correctly.');
    console.log('If the UI still shows "paused", the issue is in the display logic.');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run debug if called directly
if (require.main === module) {
  debugTimerState().then(() => {
    console.log('\n🏁 Timer state debug complete.');
    process.exit(0);
  });
}

module.exports = { debugTimerState };
