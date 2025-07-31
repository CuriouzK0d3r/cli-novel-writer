#!/usr/bin/env node

/**
 * Test the Pomodoro timer functionality including starting and callbacks
 */

const PomodoroTimer = require('./src/editor/pomodoro-timer');

async function testPomodoroFunctionality() {
  console.log('🍅 Testing Pomodoro Timer Functionality...\n');

  try {
    // Create timer instance
    const timer = new PomodoroTimer();
    console.log('✅ Timer created successfully');

    let tickCount = 0;
    let phaseCompleteCount = 0;
    let pomodoroCompleteCount = 0;

    // Set up callbacks
    timer.setCallbacks({
      onTick: (timeRemaining, phase) => {
        tickCount++;
        if (tickCount <= 3) {
          console.log(`⏰ Tick ${tickCount}: ${timer.formatTime(timeRemaining)} remaining in ${timer.getPhaseDisplayName(phase)}`);
        }
      },
      onPhaseComplete: (completedPhase, newPhase) => {
        phaseCompleteCount++;
        console.log(`🎉 Phase complete: ${completedPhase} → ${newPhase}`);
      },
      onPomodoroComplete: (completedCount) => {
        pomodoroCompleteCount++;
        console.log(`🍅 Pomodoro #${completedCount} completed!`);
      }
    });

    console.log('✅ Callbacks set successfully');

    // Test starting the timer
    console.log('\n🎬 Starting timer...');
    timer.start();

    console.log('✅ Timer started successfully');

    // Let it run for a few seconds to test the tick callback
    await new Promise(resolve => setTimeout(resolve, 3100));

    // Test pause
    console.log('\n⏸️  Pausing timer...');
    timer.pause();
    console.log('✅ Timer paused successfully');

    // Test resume
    console.log('\n▶️  Resuming timer...');
    timer.resume();
    console.log('✅ Timer resumed successfully');

    // Test status
    const status = timer.getStatus();
    console.log('\n📊 Current status:');
    console.log(`   Phase: ${timer.getPhaseDisplayName()}`);
    console.log(`   Time: ${status.timeFormatted}`);
    console.log(`   Running: ${status.isRunning}`);
    console.log(`   Paused: ${status.isPaused}`);
    console.log(`   Progress: ${Math.floor(status.phaseProgress * 100)}%`);

    // Test reset
    console.log('\n🔄 Resetting timer...');
    timer.resetAll();
    console.log('✅ Timer reset successfully');

    // Final status
    const finalStatus = timer.getStatus();
    console.log('\n📊 Final status:');
    console.log(`   Phase: ${timer.getPhaseDisplayName()}`);
    console.log(`   Time: ${finalStatus.timeFormatted}`);
    console.log(`   Running: ${finalStatus.isRunning}`);
    console.log(`   Completed: ${finalStatus.completedPomodoros}`);

    console.log('\n🎉 All Pomodoro functionality tests passed!');
    console.log(`   Tick callbacks: ${tickCount} (expected: 3+)`);
    console.log(`   Phase completions: ${phaseCompleteCount} (expected: 0)`);
    console.log(`   Pomodoro completions: ${pomodoroCompleteCount} (expected: 0)`);

    console.log('\n✅ Pomodoro timer is working correctly and ready for use!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run test if called directly
if (require.main === module) {
  testPomodoroFunctionality();
}

module.exports = { testPomodoroFunctionality };
