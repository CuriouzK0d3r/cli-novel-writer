#!/usr/bin/env node

/**
 * Comprehensive Pomodoro Timer Debug Script
 * Tests actual editor behavior to identify the "always paused" issue
 */

const BufferEditor = require('./src/editor/buffer-editor');
const blessed = require('blessed');

async function debugPomodoroComprehensive() {
  console.log('🔍 Comprehensive Pomodoro Timer Debug...\n');

  try {
    // Create a minimal screen for testing
    const screen = blessed.screen({
      smartCSR: true,
      title: 'Pomodoro Debug',
      debug: false,
      warnings: false
    });

    // Create editor instance
    const editor = new BufferEditor();

    // Initialize the editor with a minimal screen setup
    editor.screen = screen;
    editor.createInterface();

    console.log('✅ Editor with UI components created');

    // Load a test file
    await editor.openFile('test-story.md');
    console.log('✅ Test file loaded');

    // Check initial timer state
    const initialStatus = editor.pomodoroTimer.getStatus();
    console.log('\n📊 Initial Timer State:');
    console.log(`   isRunning: ${initialStatus.isRunning}`);
    console.log(`   isPaused: ${initialStatus.isPaused}`);
    console.log(`   phase: ${initialStatus.phase}`);
    console.log(`   timeFormatted: ${initialStatus.timeFormatted}`);

    // Test status bar generation with initial state
    let editorState = {
      mode: 'insert',
      line: 1,
      col: 1,
      filename: 'test-story.md',
      modified: false,
      wordCount: 42,
      totalLines: 1,
      typewriterMode: false,
      pomodoro: initialStatus,
    };

    let statusBarContent = editor.themeManager.getStatusBarContent(editorState);
    console.log(`\n📟 Initial status bar: "${statusBarContent}"`);
    console.log(`   Contains pomodoro: ${statusBarContent.includes('🍅') || statusBarContent.includes('☕') ? 'YES' : 'NO'}`);

    // Test starting the timer (F3 press simulation)
    console.log('\n🎬 Simulating F3 press (start timer)...');
    editor.togglePomodoroTimer();

    // Wait a moment for any async operations
    await new Promise(resolve => setTimeout(resolve, 100));

    const afterStartStatus = editor.pomodoroTimer.getStatus();
    console.log('\n📊 Status after start:');
    console.log(`   isRunning: ${afterStartStatus.isRunning}`);
    console.log(`   isPaused: ${afterStartStatus.isPaused}`);
    console.log(`   phase: ${afterStartStatus.phase}`);
    console.log(`   timeFormatted: ${afterStartStatus.timeFormatted}`);

    // Update editor state and test status bar
    editorState.pomodoro = afterStartStatus;
    statusBarContent = editor.themeManager.getStatusBarContent(editorState);
    console.log(`\n📟 Status bar after start: "${statusBarContent}"`);

    // Check specific status icon logic
    const shouldShowPomodoro = afterStartStatus && (afterStartStatus.isRunning || afterStartStatus.completedPomodoros > 0);
    console.log(`\n🔍 Status Bar Logic Analysis:`);
    console.log(`   shouldShowPomodoro: ${shouldShowPomodoro}`);
    console.log(`   afterStartStatus exists: ${!!afterStartStatus}`);
    console.log(`   isRunning: ${afterStartStatus.isRunning}`);
    console.log(`   completedPomodoros > 0: ${afterStartStatus.completedPomodoros > 0}`);

    if (shouldShowPomodoro) {
      const phaseIcon = afterStartStatus.phase === 'work' ? '🍅' : '☕';
      console.log(`   phaseIcon: ${phaseIcon}`);
      console.log(`   phase: ${afterStartStatus.phase}`);

      // This is the problematic logic from dark-theme.js
      const statusIcon = afterStartStatus.isRunning
        ? (afterStartStatus.isPaused ? '⏸️' : '▶️')
        : '⏹️';
      console.log(`   statusIcon calculation:`);
      console.log(`     isRunning: ${afterStartStatus.isRunning}`);
      console.log(`     isPaused: ${afterStartStatus.isPaused}`);
      console.log(`     Result: ${statusIcon}`);

      const expectedPomodoroText = ` | ${phaseIcon} ${afterStartStatus.timeFormatted} ${statusIcon}`;
      console.log(`   Expected pomodoro text: "${expectedPomodoroText}"`);

      const actualPomodoroInStatusBar = statusBarContent.match(/\| (🍅|☕) \d+:\d+ (▶️|⏸️|⏹️)/);
      console.log(`   Actual pomodoro in status bar: ${actualPomodoroInStatusBar ? actualPomodoroInStatusBar[0] : 'NOT FOUND'}`);

      if (actualPomodoroInStatusBar && actualPomodoroInStatusBar[0].includes('⏸️')) {
        console.log(`   ❌ ISSUE CONFIRMED: Timer shows as PAUSED when it should be RUNNING!`);
      }
    }

    // Wait and check if timer is actually ticking
    console.log('\n⏳ Waiting 3 seconds to check if timer ticks...');
    await new Promise(resolve => setTimeout(resolve, 3100));

    const afterWaitStatus = editor.pomodoroTimer.getStatus();
    console.log('\n📊 Status after 3 seconds:');
    console.log(`   timeFormatted: ${afterWaitStatus.timeFormatted}`);
    console.log(`   Time changed: ${afterWaitStatus.timeFormatted !== afterStartStatus.timeFormatted ? 'YES ✅' : 'NO ❌'}`);

    // Test pause functionality (F3 again)
    console.log('\n⏸️  Simulating F3 press (pause timer)...');
    editor.togglePomodoroTimer();

    await new Promise(resolve => setTimeout(resolve, 100));

    const afterPauseStatus = editor.pomodoroTimer.getStatus();
    console.log('\n📊 Status after pause:');
    console.log(`   isRunning: ${afterPauseStatus.isRunning}`);
    console.log(`   isPaused: ${afterPauseStatus.isPaused}`);

    // Test status bar with paused state
    editorState.pomodoro = afterPauseStatus;
    statusBarContent = editor.themeManager.getStatusBarContent(editorState);
    console.log(`\n📟 Status bar after pause: "${statusBarContent}"`);

    // Test resume functionality (F3 again)
    console.log('\n▶️  Simulating F3 press (resume timer)...');
    editor.togglePomodoroTimer();

    await new Promise(resolve => setTimeout(resolve, 100));

    const afterResumeStatus = editor.pomodoroTimer.getStatus();
    console.log('\n📊 Status after resume:');
    console.log(`   isRunning: ${afterResumeStatus.isRunning}`);
    console.log(`   isPaused: ${afterResumeStatus.isPaused}`);

    // Test status bar with resumed state
    editorState.pomodoro = afterResumeStatus;
    statusBarContent = editor.themeManager.getStatusBarContent(editorState);
    console.log(`\n📟 Status bar after resume: "${statusBarContent}"`);

    // Test the exact sequence that happens during updateStatus()
    console.log('\n🔧 Testing updateStatus() method integration...');

    // This simulates what happens when the editor calls updateStatus()
    const testEditorState = {
      mode: editor.mode,
      line: editor.cursorY + 1,
      col: editor.cursorX + 1,
      filename: 'test-story.md',
      modified: editor.isDirty,
      wordCount: 42,
      totalLines: editor.lines.length,
      typewriterMode: editor.typewriterMode,
      pomodoro: editor.pomodoroTimer.getStatus(),
    };

    const realStatusBar = editor.themeManager.getStatusBarContent(testEditorState);
    console.log(`📟 Real status bar from updateStatus(): "${realStatusBar}"`);

    // Test timer info dialog (F4)
    console.log('\n📋 Testing F4 dialog...');
    // Note: We can't actually show the dialog in a test environment, but we can test the content generation
    const dialogStatus = editor.pomodoroTimer.getStatus();
    const dialogConfig = editor.pomodoroTimer.getConfig();

    console.log(`📊 Dialog would show:`);
    console.log(`   Phase: ${editor.pomodoroTimer.getPhaseDisplayName()}`);
    console.log(`   Time: ${dialogStatus.timeFormatted}`);
    console.log(`   Status: ${dialogStatus.isRunning ? (dialogStatus.isPaused ? 'Paused' : 'Running') : 'Stopped'}`);
    console.log(`   Completed: ${dialogStatus.completedPomodoros} Pomodoros`);

    // Clean up
    console.log('\n🧹 Cleaning up...');
    editor.pomodoroTimer.stop();
    screen.destroy();

    console.log('\n🔍 COMPREHENSIVE ANALYSIS RESULTS:');
    console.log('=====================================');

    const finalStatus = editor.pomodoroTimer.getStatus();
    console.log(`✅ Timer Creation: Working`);
    console.log(`✅ Timer Start: ${afterStartStatus.isRunning ? 'Working' : 'BROKEN'}`);
    console.log(`✅ Timer Ticking: ${afterWaitStatus.timeFormatted !== afterStartStatus.timeFormatted ? 'Working' : 'BROKEN'}`);
    console.log(`✅ Timer Pause: ${afterPauseStatus.isPaused ? 'Working' : 'BROKEN'}`);
    console.log(`✅ Timer Resume: ${afterResumeStatus.isRunning && !afterResumeStatus.isPaused ? 'Working' : 'BROKEN'}`);

    // Check if status bar logic is the issue
    const hasWrongStatusIcon = realStatusBar.includes('⏸️') && afterResumeStatus.isRunning && !afterResumeStatus.isPaused;
    console.log(`${hasWrongStatusIcon ? '❌' : '✅'} Status Bar Logic: ${hasWrongStatusIcon ? 'BROKEN - Shows paused when running' : 'Working'}`);

    if (hasWrongStatusIcon) {
      console.log('\n🎯 ISSUE IDENTIFIED:');
      console.log('The timer logic is working correctly, but the status bar display logic');
      console.log('in the theme file is showing the wrong status icon.');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run debug if called directly
if (require.main === module) {
  debugPomodoroComprehensive().then(() => {
    console.log('\n🏁 Comprehensive debug complete.');
    process.exit(0);
  });
}

module.exports = { debugPomodoroComprehensive };
