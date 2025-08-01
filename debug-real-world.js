#!/usr/bin/env node

/**
 * Real-world simulation test for Pomodoro timer
 * This test simulates actual editor usage patterns to identify the "always paused" issue
 */

const BufferEditor = require('./src/editor/buffer-editor');
const blessed = require('blessed');
const fs = require('fs').promises;

async function realWorldPomodoroTest() {
  console.log('🔍 Real-World Pomodoro Timer Test...\n');

  try {
    // Create test file
    const testContent = `# My Test Story

This is a test story for debugging the pomodoro timer.

I will write some content here and test the timer functionality.

## Chapter 1

Once upon a time, there was a developer who wanted to fix a timer...
`;

    await fs.writeFile('test-real-world.md', testContent);
    console.log('✅ Test file created');

    // Create a minimal screen for testing (like the real editor)
    const screen = blessed.screen({
      smartCSR: true,
      title: 'Real World Pomodoro Test',
      debug: false,
      warnings: false,
      autoPadding: false
    });

    // Create editor instance and fully initialize it
    const editor = new BufferEditor();
    editor.screen = screen;
    editor.createInterface();
    editor.setupKeybindings();

    console.log('✅ Editor fully initialized');

    // Load the test file (like opening a real story)
    await editor.openFile('test-real-world.md');
    console.log('✅ Test file loaded');

    // Simulate real writing workflow
    console.log('\n🎬 Simulating Real Writing Workflow...');

    // Step 1: Check initial state
    console.log('\n📊 Step 1: Initial state check');
    let status = editor.pomodoroTimer.getStatus();
    console.log(`   Timer: isRunning=${status.isRunning}, isPaused=${status.isPaused}`);

    // Simulate updateStatus call (happens continuously in real editor)
    editor.updateStatus();
    let statusBarContent = editor.statusBar.content;
    console.log(`   Status bar: "${statusBarContent}"`);

    // Step 2: Start timer (F3 press)
    console.log('\n📊 Step 2: Start timer (F3)');
    editor.togglePomodoroTimer();

    // Wait a moment for any async operations
    await new Promise(resolve => setTimeout(resolve, 200));

    status = editor.pomodoroTimer.getStatus();
    console.log(`   Timer after start: isRunning=${status.isRunning}, isPaused=${status.isPaused}`);

    // Update status bar (like real editor does)
    editor.updateStatus();
    statusBarContent = editor.statusBar.content;
    console.log(`   Status bar after start: "${statusBarContent}"`);

    // Check if timer appears correctly
    const hasTimerDisplay = statusBarContent.includes('🍅') || statusBarContent.includes('☕');
    const hasRunningIcon = statusBarContent.includes('▶️');
    const hasPausedIcon = statusBarContent.includes('⏸️');

    console.log(`   Timer visible: ${hasTimerDisplay}`);
    console.log(`   Shows running (▶️): ${hasRunningIcon}`);
    console.log(`   Shows paused (⏸️): ${hasPausedIcon}`);

    if (hasTimerDisplay && hasPausedIcon && status.isRunning && !status.isPaused) {
      console.log(`   ❌ BUG DETECTED: Timer is running but status bar shows paused!`);
    }

    // Step 3: Simulate typing (real editor operations)
    console.log('\n📊 Step 3: Simulate typing and editor operations');

    // Simulate cursor movement and typing
    editor.cursorY = editor.lines.length - 1;
    editor.cursorX = editor.lines[editor.cursorY].length;

    // Insert some text (simulating typing)
    const newText = '\n\nThis is some new content I am typing while the timer runs.';
    for (const char of newText) {
      if (char === '\n') {
        editor.insertNewline();
      } else {
        editor.insertChar(char);
      }
    }

    // Update status after typing
    editor.updateStatus();
    statusBarContent = editor.statusBar.content;
    console.log(`   Status bar after typing: "${statusBarContent}"`);

    // Check timer state after editing operations
    status = editor.pomodoroTimer.getStatus();
    console.log(`   Timer after typing: isRunning=${status.isRunning}, isPaused=${status.isPaused}`);

    // Step 4: Wait and check if timer is ticking
    console.log('\n📊 Step 4: Check if timer is actually ticking');
    const timeBefore = status.timeFormatted;
    console.log(`   Time before wait: ${timeBefore}`);

    // Wait 3 seconds
    await new Promise(resolve => setTimeout(resolve, 3100));

    status = editor.pomodoroTimer.getStatus();
    const timeAfter = status.timeFormatted;
    console.log(`   Time after wait: ${timeAfter}`);
    console.log(`   Time changed: ${timeBefore !== timeAfter ? 'YES ✅' : 'NO ❌'}`);

    // Update status bar again
    editor.updateStatus();
    statusBarContent = editor.statusBar.content;
    console.log(`   Status bar after wait: "${statusBarContent}"`);

    // Step 5: Test pause functionality
    console.log('\n📊 Step 5: Test pause (F3 again)');
    editor.togglePomodoroTimer();

    await new Promise(resolve => setTimeout(resolve, 200));

    status = editor.pomodoroTimer.getStatus();
    console.log(`   Timer after pause: isRunning=${status.isRunning}, isPaused=${status.isPaused}`);

    editor.updateStatus();
    statusBarContent = editor.statusBar.content;
    console.log(`   Status bar after pause: "${statusBarContent}"`);

    // Step 6: Test resume functionality
    console.log('\n📊 Step 6: Test resume (F3 again)');
    editor.togglePomodoroTimer();

    await new Promise(resolve => setTimeout(resolve, 200));

    status = editor.pomodoroTimer.getStatus();
    console.log(`   Timer after resume: isRunning=${status.isRunning}, isPaused=${status.isPaused}`);

    editor.updateStatus();
    statusBarContent = editor.statusBar.content;
    console.log(`   Status bar after resume: "${statusBarContent}"`);

    // Step 7: Test save operation (real world scenario)
    console.log('\n📊 Step 7: Test save operation');
    await editor.saveFile();

    status = editor.pomodoroTimer.getStatus();
    console.log(`   Timer after save: isRunning=${status.isRunning}, isPaused=${status.isPaused}`);

    editor.updateStatus();
    statusBarContent = editor.statusBar.content;
    console.log(`   Status bar after save: "${statusBarContent}"`);

    // Step 8: Test theme switching (can affect status bar)
    console.log('\n📊 Step 8: Test theme switching');
    const currentTheme = editor.themeManager.currentTheme.name;
    console.log(`   Current theme: ${currentTheme}`);

    // Save timer state before theme switch
    const stateBeforeTheme = editor.pomodoroTimer.getStatus();

    // Switch theme (this recreates the interface)
    editor.switchTheme();

    // Check timer state after theme switch
    const stateAfterTheme = editor.pomodoroTimer.getStatus();
    console.log(`   Timer before theme switch: isRunning=${stateBeforeTheme.isRunning}, isPaused=${stateBeforeTheme.isPaused}`);
    console.log(`   Timer after theme switch: isRunning=${stateAfterTheme.isRunning}, isPaused=${stateAfterTheme.isPaused}`);

    // Update status bar with new theme
    editor.updateStatus();
    statusBarContent = editor.statusBar.content;
    console.log(`   Status bar after theme switch: "${statusBarContent}"`);

    // Step 9: Test rapid status updates (simulate real editor behavior)
    console.log('\n📊 Step 9: Test rapid status updates');

    for (let i = 0; i < 5; i++) {
      editor.updateStatus();
      const rapidStatus = editor.pomodoroTimer.getStatus();
      const rapidStatusBar = editor.statusBar.content;

      console.log(`   Update ${i + 1}: isRunning=${rapidStatus.isRunning}, isPaused=${rapidStatus.isPaused}`);

      const rapidHasPaused = rapidStatusBar.includes('⏸️');
      const rapidHasRunning = rapidStatusBar.includes('▶️');

      if (rapidStatus.isRunning && !rapidStatus.isPaused && rapidHasPaused) {
        console.log(`   ❌ BUG DETECTED on update ${i + 1}: Timer running but shows paused!`);
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Step 10: Manual status bar generation test
    console.log('\n📊 Step 10: Manual status bar generation test');

    const finalTimerStatus = editor.pomodoroTimer.getStatus();
    console.log(`   Raw timer status: ${JSON.stringify(finalTimerStatus, null, 2)}`);

    // Manually create editor state like updateStatus() does
    const manualEditorState = {
      mode: editor.mode,
      line: editor.cursorY + 1,
      col: editor.cursorX + 1,
      filename: 'test-real-world.md',
      modified: editor.isDirty,
      wordCount: 100, // approximation
      totalLines: editor.lines.length,
      typewriterMode: editor.typewriterMode,
      pomodoro: finalTimerStatus
    };

    // Generate status bar manually
    const manualStatusBar = editor.themeManager.getStatusBarContent(manualEditorState);
    console.log(`   Manual status bar: "${manualStatusBar}"`);

    // Compare with actual status bar
    const actualStatusBar = editor.statusBar.content.trim();
    console.log(`   Actual status bar: "${actualStatusBar}"`);
    console.log(`   Status bars match: ${manualStatusBar === actualStatusBar ? 'YES ✅' : 'NO ❌'}`);

    // Final analysis
    console.log('\n🔍 FINAL ANALYSIS:');
    console.log('=====================================');

    const finalStatus = editor.pomodoroTimer.getStatus();
    const finalStatusBarContent = editor.statusBar.content;

    console.log(`Timer State: isRunning=${finalStatus.isRunning}, isPaused=${finalStatus.isPaused}`);
    console.log(`Status Bar: "${finalStatusBarContent}"`);

    const finalHasPaused = finalStatusBarContent.includes('⏸️');
    const finalHasRunning = finalStatusBarContent.includes('▶️');

    if (finalStatus.isRunning && !finalStatus.isPaused && finalHasPaused) {
      console.log(`❌ CONFIRMED BUG: Timer is running but status bar shows paused`);
      console.log(`   This suggests an issue with status bar update timing or theme logic`);
    } else if (finalStatus.isRunning && !finalStatus.isPaused && finalHasRunning) {
      console.log(`✅ Timer working correctly: Running and shows as running`);
    } else if (finalStatus.isRunning && finalStatus.isPaused && finalHasPaused) {
      console.log(`✅ Timer working correctly: Paused and shows as paused`);
    } else {
      console.log(`ℹ️  Timer state: ${JSON.stringify(finalStatus)}`);
    }

    // Clean up
    console.log('\n🧹 Cleaning up...');
    editor.pomodoroTimer.stop();
    screen.destroy();

    // Remove test file
    try {
      await fs.unlink('test-real-world.md');
      console.log('✅ Test file removed');
    } catch (error) {
      console.log('⚠️  Could not remove test file');
    }

  } catch (error) {
    console.error('❌ Real-world test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run test if called directly
if (require.main === module) {
  realWorldPomodoroTest().then(() => {
    console.log('\n🏁 Real-world test complete.');
    process.exit(0);
  });
}

module.exports = { realWorldPomodoroTest };
