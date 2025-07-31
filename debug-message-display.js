#!/usr/bin/env node

/**
 * Debug script to check what message is displayed when pressing F3
 * This will help identify why the user sees "timer is paused"
 */

const PomodoroTimer = require('./src/editor/pomodoro-timer');

async function debugMessageDisplay() {
  console.log('🔍 Debugging Message Display for F3 Press...\n');

  try {
    // Create timer instance
    const timer = new PomodoroTimer();
    console.log('✅ Timer created');

    // Mock the showMessage function to capture what would be displayed
    const messages = [];
    const mockEditor = {
      pomodoroTimer: timer,
      showMessage: (message) => {
        messages.push(message);
        console.log(`📱 Message displayed: "${message}"`);
      },
      render: () => {
        console.log('🎨 render() called');
      }
    };

    // Simulate the togglePomodoroTimer function
    function togglePomodoroTimer() {
      const status = mockEditor.pomodoroTimer.getStatus();
      console.log(`📊 Current status before toggle: Running=${status.isRunning}, Paused=${status.isPaused}`);

      if (!status.isRunning) {
        console.log('   → Condition: !status.isRunning (should start)');
        mockEditor.pomodoroTimer.start();
        mockEditor.showMessage(`🍅 Pomodoro started: ${mockEditor.pomodoroTimer.getPhaseDisplayName()} session`);
      } else if (status.isPaused) {
        console.log('   → Condition: status.isPaused (should resume)');
        mockEditor.pomodoroTimer.resume();
        mockEditor.showMessage("▶️  Pomodoro resumed");
      } else {
        console.log('   → Condition: else (should pause)');
        mockEditor.pomodoroTimer.pause();
        mockEditor.showMessage("⏸️  Pomodoro paused");
      }

      mockEditor.render();

      const newStatus = mockEditor.pomodoroTimer.getStatus();
      console.log(`📊 Status after toggle: Running=${newStatus.isRunning}, Paused=${newStatus.isPaused}`);
    }

    // Test sequence of F3 presses
    console.log('\n🎬 Simulating F3 press #1 (Initial state)...');
    togglePomodoroTimer();

    console.log('\n⏳ Waiting 2 seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\n🎬 Simulating F3 press #2 (After 2 seconds)...');
    togglePomodoroTimer();

    console.log('\n⏳ Waiting 1 second...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('\n🎬 Simulating F3 press #3 (After 1 more second)...');
    togglePomodoroTimer();

    // Test edge case: what if timer is in a weird state?
    console.log('\n🧪 Testing edge case - manually setting weird state...');
    timer.isRunning = true;
    timer.isPaused = true;
    console.log('   → Manually set: isRunning=true, isPaused=true');
    togglePomodoroTimer();

    // Test another edge case
    console.log('\n🧪 Testing edge case - reset and immediate toggle...');
    timer.resetAll();
    console.log('   → Timer reset');
    togglePomodoroTimer();

    console.log('\n📋 Summary of all messages displayed:');
    messages.forEach((msg, index) => {
      console.log(`   ${index + 1}. "${msg}"`);
    });

    // Check if any message contains "paused"
    const pausedMessages = messages.filter(msg => msg.toLowerCase().includes('paused'));
    console.log(`\n⚠️  Messages containing "paused": ${pausedMessages.length}`);
    pausedMessages.forEach(msg => {
      console.log(`   • "${msg}"`);
    });

    // Final status check
    const finalStatus = timer.getStatus();
    console.log(`\n📊 Final timer status:`);
    console.log(`   isRunning: ${finalStatus.isRunning}`);
    console.log(`   isPaused: ${finalStatus.isPaused}`);
    console.log(`   phase: ${finalStatus.phase}`);
    console.log(`   timeFormatted: ${finalStatus.timeFormatted}`);

    timer.stop();
    console.log('\n✅ Debug complete');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run debug if called directly
if (require.main === module) {
  debugMessageDisplay().then(() => {
    console.log('\n🏁 Message display debug complete.');
    process.exit(0);
  });
}

module.exports = { debugMessageDisplay };
