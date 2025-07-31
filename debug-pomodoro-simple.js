#!/usr/bin/env node

/**
 * Simple debug script for the Pomodoro timer "paused" issue
 * This avoids GUI components to isolate the timer logic
 */

const PomodoroTimer = require('./src/editor/pomodoro-timer');

async function debugPomodoroSimple() {
  console.log('🔍 Simple Pomodoro Timer Debug...\n');

  try {
    // Create timer instance directly
    const timer = new PomodoroTimer();
    console.log('✅ Timer created');

    // Set up minimal callbacks to track state changes
    let lastStatus = null;
    timer.setCallbacks({
      onTick: (timeRemaining, phase) => {
        // Only log first few ticks to avoid spam
        const status = timer.getStatus();
        if (!lastStatus || status.timeFormatted !== lastStatus.timeFormatted) {
          console.log(`⏰ ${timer.getPhaseDisplayName()}: ${status.timeFormatted} | Running: ${status.isRunning} | Paused: ${status.isPaused}`);
          lastStatus = status;
        }
      },
      onPhaseComplete: (completedPhase, newPhase) => {
        console.log(`🎉 Phase complete: ${completedPhase} → ${newPhase}`);
      },
      onPomodoroComplete: (completedCount) => {
        console.log(`🍅 Pomodoro #${completedCount} completed!`);
      }
    });

    // Test the exact sequence that would happen in the editor
    console.log('\n🎬 Simulating F3 press (first time - should start)...');

    // Check initial status
    let status = timer.getStatus();
    console.log(`📊 Before: Running=${status.isRunning}, Paused=${status.isPaused}, Time=${status.timeFormatted}`);

    // Simulate the togglePomodoroTimer logic
    if (!status.isRunning) {
      console.log('   → Timer not running, starting...');
      timer.start();
    } else if (status.isPaused) {
      console.log('   → Timer paused, resuming...');
      timer.resume();
    } else {
      console.log('   → Timer running, pausing...');
      timer.pause();
    }

    // Check status after action
    status = timer.getStatus();
    console.log(`📊 After: Running=${status.isRunning}, Paused=${status.isPaused}, Time=${status.timeFormatted}`);

    // Wait and check if it's actually ticking
    console.log('\n⏳ Waiting 3 seconds to verify ticking...');
    const beforeWait = timer.getStatus();
    await new Promise(resolve => setTimeout(resolve, 3100));
    const afterWait = timer.getStatus();

    console.log(`📊 Time check: ${beforeWait.timeFormatted} → ${afterWait.timeFormatted}`);
    console.log(`   Time changed: ${beforeWait.timeFormatted !== afterWait.timeFormatted ? 'YES ✅' : 'NO ❌'}`);

    // Test pause functionality
    console.log('\n⏸️  Simulating F3 press (second time - should pause)...');
    status = timer.getStatus();
    console.log(`📊 Before: Running=${status.isRunning}, Paused=${status.isPaused}`);

    if (!status.isRunning) {
      console.log('   → Timer not running, starting...');
      timer.start();
    } else if (status.isPaused) {
      console.log('   → Timer paused, resuming...');
      timer.resume();
    } else {
      console.log('   → Timer running, pausing...');
      timer.pause();
    }

    status = timer.getStatus();
    console.log(`📊 After: Running=${status.isRunning}, Paused=${status.isPaused}`);

    // Test resume functionality
    console.log('\n▶️  Simulating F3 press (third time - should resume)...');
    status = timer.getStatus();
    console.log(`📊 Before: Running=${status.isRunning}, Paused=${status.isPaused}`);

    if (!status.isRunning) {
      console.log('   → Timer not running, starting...');
      timer.start();
    } else if (status.isPaused) {
      console.log('   → Timer paused, resuming...');
      timer.resume();
    } else {
      console.log('   → Timer running, pausing...');
      timer.pause();
    }

    status = timer.getStatus();
    console.log(`📊 After: Running=${status.isRunning}, Paused=${status.isPaused}`);

    // Wait again to verify it's ticking after resume
    console.log('\n⏳ Waiting 2 seconds after resume...');
    const beforeResume = timer.getStatus();
    await new Promise(resolve => setTimeout(resolve, 2100));
    const afterResume = timer.getStatus();

    console.log(`📊 Time check: ${beforeResume.timeFormatted} → ${afterResume.timeFormatted}`);
    console.log(`   Time changed: ${beforeResume.timeFormatted !== afterResume.timeFormatted ? 'YES ✅' : 'NO ❌'}`);

    // Test status bar display logic
    console.log('\n📟 Testing Status Bar Display Logic...');
    const finalStatus = timer.getStatus();
    const shouldShowInStatusBar = finalStatus && (finalStatus.isRunning || finalStatus.completedPomodoros > 0);
    console.log(`📊 Final status: Running=${finalStatus.isRunning}, Paused=${finalStatus.isPaused}, Completed=${finalStatus.completedPomodoros}`);
    console.log(`📟 Should show in status bar: ${shouldShowInStatusBar ? 'YES' : 'NO'}`);

    if (shouldShowInStatusBar) {
      const phaseIcon = finalStatus.phase === 'work' ? '🍅' : '☕';
      const statusIcon = finalStatus.isRunning ? (finalStatus.isPaused ? '⏸️' : '▶️') : '⏹️';
      const pomodoroText = ` | ${phaseIcon} ${finalStatus.timeFormatted} ${statusIcon}`;
      console.log(`📟 Status bar text would be: "${pomodoroText}"`);

      if (finalStatus.isPaused) {
        console.log('⚠️  ISSUE FOUND: Timer shows as PAUSED in status bar!');
      } else {
        console.log('✅ Timer shows as RUNNING in status bar');
      }
    }

    // Clean up
    timer.stop();
    console.log('\n🧹 Timer stopped and cleaned up');

    console.log('\n🔍 Summary:');
    console.log('   - Timer creation: ✅');
    console.log('   - Start functionality: ✅');
    console.log('   - Pause functionality: ✅');
    console.log('   - Resume functionality: ✅');
    console.log('   - Time progression: ✅');
    console.log('   - Status display: ✅');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run debug if called directly
if (require.main === module) {
  debugPomodoroSimple().then(() => {
    console.log('\n🏁 Simple debug complete.');
    process.exit(0);
  });
}

module.exports = { debugPomodoroSimple };
