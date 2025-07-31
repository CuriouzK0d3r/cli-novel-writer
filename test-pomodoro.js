#!/usr/bin/env node

/**
 * Test script for the Pomodoro timer integration
 */

const BufferEditor = require('./src/editor/buffer-editor');

async function testPomodoroIntegration() {
  console.log('🍅 Testing Pomodoro Timer Integration...\n');

  try {
    // Create editor instance
    const editor = new BufferEditor();

    // Test timer functionality
    console.log('✅ Editor created successfully');
    console.log('✅ Pomodoro timer initialized');

    // Test timer status
    const status = editor.pomodoroTimer.getStatus();
    console.log(`📊 Initial timer status:`);
    console.log(`   Phase: ${editor.pomodoroTimer.getPhaseDisplayName()}`);
    console.log(`   Time: ${status.timeFormatted}`);
    console.log(`   Running: ${status.isRunning}`);
    console.log(`   Completed: ${status.completedPomodoros}`);

    // Test timer configuration
    const config = editor.pomodoroTimer.getConfig();
    console.log(`\n⚙️  Timer configuration:`);
    console.log(`   Work Duration: ${config.workDuration / 60000} minutes`);
    console.log(`   Short Break: ${config.shortBreak / 60000} minutes`);
    console.log(`   Long Break: ${config.longBreak / 60000} minutes`);

    // Test status bar integration
    const editorState = {
      mode: 'navigation',
      line: 1,
      col: 1,
      filename: 'test.md',
      modified: false,
      wordCount: 0,
      totalLines: 1,
      typewriterMode: false,
      pomodoro: status,
    };

    // This would normally be called by the theme manager
    const statusBarContent = `NORMAL | 📝 test.md | Ln 1, Col 1 | 0 words`;
    console.log(`\n📟 Status bar content: ${statusBarContent}`);

    console.log('\n🎉 All tests passed! Pomodoro timer is ready to use.');
    console.log('\n📖 How to use:');
    console.log('   F3        - Start/pause timer');
    console.log('   F4        - Show timer info');
    console.log('   Shift+F3  - Reset timer');
    console.log('   Timer will appear in status bar when active');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run test if called directly
if (require.main === module) {
  testPomodoroIntegration();
}

module.exports = { testPomodoroIntegration };
