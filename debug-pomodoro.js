#!/usr/bin/env node

/**
 * Debug script for the Pomodoro timer "paused" issue
 * This script will help identify why the timer shows as "paused" in the editor
 */

const BufferEditor = require('./src/editor/buffer-editor');

async function debugPomodoroIssue() {
  console.log('🔍 Debugging Pomodoro Timer "Paused" Issue...\n');

  try {
    // Create editor instance (without launching the full GUI)
    const editor = new BufferEditor();
    console.log('✅ Editor instance created');

    // Check initial timer state
    const initialStatus = editor.pomodoroTimer.getStatus();
    console.log('\n📊 Initial Timer State:');
    console.log(`   isRunning: ${initialStatus.isRunning}`);
    console.log(`   isPaused: ${initialStatus.isPaused}`);
    console.log(`   phase: ${initialStatus.phase}`);
    console.log(`   timeFormatted: ${initialStatus.timeFormatted}`);
    console.log(`   completedPomodoros: ${initialStatus.completedPomodoros}`);

    // Test the toggle function (this is what F3 calls)
    console.log('\n🎬 Testing togglePomodoroTimer() - First Press (Start)...');
    editor.togglePomodoroTimer();

    const afterStartStatus = editor.pomodoroTimer.getStatus();
    console.log('📊 Status after start:');
    console.log(`   isRunning: ${afterStartStatus.isRunning}`);
    console.log(`   isPaused: ${afterStartStatus.isPaused}`);
    console.log(`   phase: ${afterStartStatus.phase}`);
    console.log(`   timeFormatted: ${afterStartStatus.timeFormatted}`);

    // Wait a few seconds and check if it's actually ticking
    console.log('\n⏳ Waiting 3 seconds to check if timer is ticking...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    const afterWaitStatus = editor.pomodoroTimer.getStatus();
    console.log('📊 Status after 3 seconds:');
    console.log(`   isRunning: ${afterWaitStatus.isRunning}`);
    console.log(`   isPaused: ${afterWaitStatus.isPaused}`);
    console.log(`   timeFormatted: ${afterWaitStatus.timeFormatted}`);
    console.log(`   Time changed: ${afterWaitStatus.timeFormatted !== afterStartStatus.timeFormatted ? 'YES' : 'NO'}`);

    // Test pause functionality
    console.log('\n⏸️  Testing togglePomodoroTimer() - Second Press (Pause)...');
    editor.togglePomodoroTimer();

    const afterPauseStatus = editor.pomodoroTimer.getStatus();
    console.log('📊 Status after pause:');
    console.log(`   isRunning: ${afterPauseStatus.isRunning}`);
    console.log(`   isPaused: ${afterPauseStatus.isPaused}`);
    console.log(`   timeFormatted: ${afterPauseStatus.timeFormatted}`);

    // Test resume functionality
    console.log('\n▶️  Testing togglePomodoroTimer() - Third Press (Resume)...');
    editor.togglePomodoroTimer();

    const afterResumeStatus = editor.pomodoroTimer.getStatus();
    console.log('📊 Status after resume:');
    console.log(`   isRunning: ${afterResumeStatus.isRunning}`);
    console.log(`   isPaused: ${afterResumeStatus.isPaused}`);
    console.log(`   timeFormatted: ${afterResumeStatus.timeFormatted}`);

    // Test status bar generation
    console.log('\n📟 Testing Status Bar Generation...');
    const editorState = {
      mode: 'insert',
      line: 1,
      col: 1,
      filename: 'test.md',
      modified: false,
      wordCount: 42,
      totalLines: 1,
      typewriterMode: false,
      pomodoro: afterResumeStatus,
    };

    // Test theme manager status bar generation
    const statusBarContent = editor.themeManager.getStatusBarContent(editorState);
    console.log(`📟 Generated status bar: "${statusBarContent}"`);

    // Check if pomodoro info is included
    const hasPomodoro = statusBarContent.includes('🍅') || statusBarContent.includes('☕');
    console.log(`   Contains pomodoro info: ${hasPomodoro ? 'YES' : 'NO'}`);

    // Show what the timer status looks like when formatted
    console.log('\n🔍 Detailed Timer Status Analysis:');
    const status = editor.pomodoroTimer.getStatus();
    console.log(`   Raw status object:`, JSON.stringify(status, null, 2));

    // Check the specific condition in dark-theme.js
    const shouldShowPomodoro = status && (status.isRunning || status.completedPomodoros > 0);
    console.log(`   Should show in status bar: ${shouldShowPomodoro ? 'YES' : 'NO'}`);
    console.log(`   Condition breakdown:`);
    console.log(`     status exists: ${!!status}`);
    console.log(`     isRunning: ${status.isRunning}`);
    console.log(`     completedPomodoros > 0: ${status.completedPomodoros > 0}`);

    if (shouldShowPomodoro) {
      const phaseIcon = status.phase === 'work' ? '🍅' : '☕';
      const statusIcon = status.isRunning ? (status.isPaused ? '⏸️' : '▶️') : '⏹️';
      const pomodoroText = ` | ${phaseIcon} ${status.timeFormatted} ${statusIcon}`;
      console.log(`   Expected pomodoro text: "${pomodoroText}"`);
    }

    // Test reset functionality
    console.log('\n🔄 Testing Reset...');
    editor.resetPomodoroTimer();

    const afterResetStatus = editor.pomodoroTimer.getStatus();
    console.log('📊 Status after reset:');
    console.log(`   isRunning: ${afterResetStatus.isRunning}`);
    console.log(`   isPaused: ${afterResetStatus.isPaused}`);
    console.log(`   completedPomodoros: ${afterResetStatus.completedPomodoros}`);

    console.log('\n✅ Debug analysis complete!');
    console.log('\n🔍 Key Findings:');
    console.log(`   - Timer functionality: ${afterWaitStatus.timeFormatted !== afterStartStatus.timeFormatted ? 'WORKING' : 'NOT WORKING'}`);
    console.log(`   - Status bar integration: ${hasPomodoro ? 'WORKING' : 'NOT WORKING'}`);
    console.log(`   - Toggle controls: ${afterResumeStatus.isRunning && !afterResumeStatus.isPaused ? 'WORKING' : 'NEEDS INVESTIGATION'}`);

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run debug if called directly
if (require.main === module) {
  debugPomodoroIssue().then(() => {
    console.log('\n🏁 Debug session complete. Check the findings above.');
    process.exit(0);
  });
}

module.exports = { debugPomodoroIssue };
