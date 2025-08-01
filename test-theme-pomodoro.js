#!/usr/bin/env node

/**
 * Test script to verify all themes support the Pomodoro timer
 * This test ensures the "always paused" issue is fixed across all themes
 */

const { ThemeManager } = require('./src/editor/themes');

async function testThemePomodoroSupport() {
  console.log('🔍 Testing Pomodoro Support Across All Themes...\n');

  try {
    const themeManager = new ThemeManager();
    const availableThemes = themeManager.getAvailableThemes();

    console.log(`Found ${availableThemes.length} themes to test:`);
    availableThemes.forEach(theme => {
      console.log(`  - ${theme.displayName} (${theme.name}) ${theme.isDark ? '🌙' : '☀️'}`);
    });
    console.log('');

    // Test different pomodoro states
    const testStates = [
      {
        name: 'Timer Running',
        pomodoro: {
          isRunning: true,
          isPaused: false,
          phase: 'work',
          timeFormatted: '24:30',
          completedPomodoros: 0,
          phaseProgress: 0.02
        },
        expectedIcon: '▶️'
      },
      {
        name: 'Timer Paused',
        pomodoro: {
          isRunning: true,
          isPaused: true,
          phase: 'work',
          timeFormatted: '20:15',
          completedPomodoros: 0,
          phaseProgress: 0.19
        },
        expectedIcon: '⏸️'
      },
      {
        name: 'Timer Stopped with Progress',
        pomodoro: {
          isRunning: false,
          isPaused: false,
          phase: 'work',
          timeFormatted: '25:00',
          completedPomodoros: 2,
          phaseProgress: 0
        },
        expectedIcon: '⏹️'
      },
      {
        name: 'Break Running',
        pomodoro: {
          isRunning: true,
          isPaused: false,
          phase: 'shortBreak',
          timeFormatted: '04:30',
          completedPomodoros: 1,
          phaseProgress: 0.1
        },
        expectedIcon: '▶️'
      }
    ];

    let totalTests = 0;
    let passedTests = 0;

    // Test each theme with each state
    for (const themeInfo of availableThemes) {
      console.log(`\n🎨 Testing ${themeInfo.displayName}:`);

      // Set the theme
      themeManager.setTheme(themeInfo.name);
      const currentTheme = themeManager.getCurrentTheme();

      for (const testState of testStates) {
        totalTests++;
        console.log(`\n  📊 ${testState.name}:`);

        // Create editor state
        const editorState = {
          mode: 'insert',
          line: 42,
          col: 12,
          filename: 'test-story.md',
          modified: false,
          wordCount: 543,
          totalLines: 100,
          typewriterMode: false,
          pomodoro: testState.pomodoro
        };

        // Generate status bar
        const statusBar = themeManager.getStatusBarContent(editorState);
        console.log(`    Status bar: "${statusBar}"`);

        // Check if pomodoro info is present
        const hasPomodoroInfo = statusBar.includes('🍅') || statusBar.includes('☕');
        const hasExpectedIcon = statusBar.includes(testState.expectedIcon);

        console.log(`    Has pomodoro info: ${hasPomodoroInfo ? '✅' : '❌'}`);
        console.log(`    Has expected icon (${testState.expectedIcon}): ${hasExpectedIcon ? '✅' : '❌'}`);

        // Check for wrong icons
        const hasRunningIcon = statusBar.includes('▶️');
        const hasPausedIcon = statusBar.includes('⏸️');
        const hasStoppedIcon = statusBar.includes('⏹️');

        console.log(`    Icon analysis:`);
        console.log(`      Contains ▶️ (running): ${hasRunningIcon}`);
        console.log(`      Contains ⏸️ (paused): ${hasPausedIcon}`);
        console.log(`      Contains ⏹️ (stopped): ${hasStoppedIcon}`);

        // Validate correctness
        let testPassed = true;
        let issues = [];

        if (!hasPomodoroInfo) {
          issues.push('Missing pomodoro information');
          testPassed = false;
        }

        if (!hasExpectedIcon) {
          issues.push(`Missing expected icon ${testState.expectedIcon}`);
          testPassed = false;
        }

        // Check for specific bug: running timer showing as paused
        if (testState.pomodoro.isRunning && !testState.pomodoro.isPaused && hasPausedIcon) {
          issues.push('BUG: Timer is running but shows as paused!');
          testPassed = false;
        }

        // Check for wrong phase icon
        const expectedPhaseIcon = testState.pomodoro.phase === 'work' ? '🍅' : '☕';
        if (!statusBar.includes(expectedPhaseIcon)) {
          issues.push(`Wrong phase icon (expected ${expectedPhaseIcon})`);
          testPassed = false;
        }

        if (testPassed) {
          console.log(`    Result: ✅ PASS`);
          passedTests++;
        } else {
          console.log(`    Result: ❌ FAIL`);
          console.log(`    Issues:`);
          issues.forEach(issue => console.log(`      - ${issue}`));
        }
      }
    }

    // Test edge cases
    console.log(`\n🔧 Testing Edge Cases:`);

    // Edge case: No pomodoro data
    const noPomodoroState = {
      mode: 'insert',
      line: 1,
      col: 1,
      filename: 'test.md',
      modified: false,
      wordCount: 0
      // pomodoro is undefined
    };

    for (const themeInfo of availableThemes) {
      totalTests++;
      themeManager.setTheme(themeInfo.name);
      const statusBar = themeManager.getStatusBarContent(noPomodoroState);
      const hasPomodoroInfo = statusBar.includes('🍅') || statusBar.includes('☕');

      console.log(`  ${themeInfo.displayName}: "${statusBar}"`);
      console.log(`    Has pomodoro info: ${hasPomodoroInfo ? '❌ UNEXPECTED' : '✅ CORRECT'}`);

      if (!hasPomodoroInfo) {
        passedTests++;
      }
    }

    // Summary
    console.log('\n🏁 Test Results Summary:');
    console.log('=====================================');
    console.log(`Total tests: ${totalTests}`);
    console.log(`Passed tests: ${passedTests}`);
    console.log(`Failed tests: ${totalTests - passedTests}`);
    console.log(`Success rate: ${Math.round((passedTests / totalTests) * 100)}%`);

    if (passedTests === totalTests) {
      console.log('\n🎉 ALL TESTS PASSED!');
      console.log('The Pomodoro timer should now work correctly across all themes.');
      console.log('The "always paused" issue has been fixed.');
    } else {
      console.log('\n⚠️  SOME TESTS FAILED');
      console.log('There may still be issues with the Pomodoro timer display.');
      console.log('Check the failed tests above for details.');
    }

    // Practical usage guide
    console.log('\n📖 How to Use the Fixed Pomodoro Timer:');
    console.log('=====================================');
    console.log('1. Open any story: writers write my-story');
    console.log('2. Start timer: Press F3');
    console.log('3. Check status: Timer shows in status bar with ▶️ icon');
    console.log('4. Pause timer: Press F3 again (shows ⏸️ icon)');
    console.log('5. Resume timer: Press F3 again (shows ▶️ icon)');
    console.log('6. View details: Press F4 for full timer information');
    console.log('7. Reset timer: Press Shift+F3');
    console.log('\nThe timer should work correctly in all themes now!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run test if called directly
if (require.main === module) {
  testThemePomodoroSupport().then(() => {
    console.log('\n🏁 Theme pomodoro test complete.');
    process.exit(0);
  });
}

module.exports = { testThemePomodoroSupport };
