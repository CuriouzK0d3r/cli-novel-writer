#!/usr/bin/env node

/**
 * Debug script specifically for status bar display logic
 * Tests the exact logic used in the dark theme to identify the "always paused" issue
 */

const DarkTheme = require('./src/editor/themes/dark-theme');

async function debugStatusBarLogic() {
  console.log('🔍 Debugging Status Bar Display Logic...\n');

  try {
    const theme = new DarkTheme();
    console.log('✅ Dark theme created');

    // Test scenarios
    const testCases = [
      {
        name: 'Timer Not Running (Initial State)',
        pomodoro: {
          isRunning: false,
          isPaused: false,
          phase: 'work',
          timeFormatted: '25:00',
          completedPomodoros: 0,
          phaseProgress: 0
        }
      },
      {
        name: 'Timer Running (Started)',
        pomodoro: {
          isRunning: true,
          isPaused: false,
          phase: 'work',
          timeFormatted: '24:30',
          completedPomodoros: 0,
          phaseProgress: 0.02
        }
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
        }
      },
      {
        name: 'Timer Resumed After Pause',
        pomodoro: {
          isRunning: true,
          isPaused: false,
          phase: 'work',
          timeFormatted: '20:10',
          completedPomodoros: 0,
          phaseProgress: 0.193
        }
      },
      {
        name: 'Timer Stopped',
        pomodoro: {
          isRunning: false,
          isPaused: false,
          phase: 'work',
          timeFormatted: '25:00',
          completedPomodoros: 1,
          phaseProgress: 0
        }
      },
      {
        name: 'Break Phase Running',
        pomodoro: {
          isRunning: true,
          isPaused: false,
          phase: 'shortBreak',
          timeFormatted: '04:30',
          completedPomodoros: 1,
          phaseProgress: 0.1
        }
      }
    ];

    for (const testCase of testCases) {
      console.log(`\n📊 Test Case: ${testCase.name}`);
      console.log(`   Input pomodoro state:`);
      console.log(`     isRunning: ${testCase.pomodoro.isRunning}`);
      console.log(`     isPaused: ${testCase.pomodoro.isPaused}`);
      console.log(`     phase: ${testCase.pomodoro.phase}`);
      console.log(`     timeFormatted: ${testCase.pomodoro.timeFormatted}`);
      console.log(`     completedPomodoros: ${testCase.pomodoro.completedPomodoros}`);

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
        pomodoro: testCase.pomodoro
      };

      // Test the exact logic from dark-theme.js
      const { pomodoro } = editorState;

      console.log(`\n   🔍 Status Bar Logic Analysis:`);

      // Check if pomodoro should be displayed
      const shouldDisplay = pomodoro && (pomodoro.isRunning || pomodoro.completedPomodoros > 0);
      console.log(`     Should display: ${shouldDisplay}`);
      console.log(`       pomodoro exists: ${!!pomodoro}`);
      console.log(`       isRunning: ${pomodoro.isRunning}`);
      console.log(`       completedPomodoros > 0: ${pomodoro.completedPomodoros > 0}`);
      console.log(`       Overall condition: ${shouldDisplay}`);

      if (shouldDisplay) {
        // Test phase icon logic
        const phaseIcon = pomodoro.phase === "work" ? "🍅" : "☕";
        console.log(`     Phase icon: ${phaseIcon} (phase="${pomodoro.phase}")`);

        // Test status icon logic - THIS IS THE CRITICAL PART
        const statusIcon = pomodoro.isRunning
          ? pomodoro.isPaused
            ? "⏸️"
            : "▶️"
          : "⏹️";

        console.log(`     Status icon logic:`);
        console.log(`       isRunning: ${pomodoro.isRunning}`);
        console.log(`       isPaused: ${pomodoro.isPaused}`);
        console.log(`       Ternary evaluation:`);
        console.log(`         pomodoro.isRunning = ${pomodoro.isRunning}`);
        console.log(`         If true: pomodoro.isPaused = ${pomodoro.isPaused}`);
        console.log(`           If true: "⏸️"`);
        console.log(`           If false: "▶️"`);
        console.log(`         If false: "⏹️"`);
        console.log(`       Result: ${statusIcon}`);

        // Expected vs actual
        let expectedIcon;
        if (!pomodoro.isRunning) {
          expectedIcon = "⏹️";
        } else if (pomodoro.isPaused) {
          expectedIcon = "⏸️";
        } else {
          expectedIcon = "▶️";
        }

        console.log(`     Expected icon: ${expectedIcon}`);
        console.log(`     Actual icon: ${statusIcon}`);
        console.log(`     Icons match: ${expectedIcon === statusIcon ? '✅' : '❌'}`);

        // Build pomodoro text
        let pomodoroText = ` | ${phaseIcon} ${pomodoro.timeFormatted} ${statusIcon}`;
        if (pomodoro.completedPomodoros > 0) {
          pomodoroText += ` (${pomodoro.completedPomodoros})`;
        }
        console.log(`     Pomodoro text: "${pomodoroText}"`);
      } else {
        console.log(`     No pomodoro display (condition not met)`);
      }

      // Generate full status bar
      const fullStatusBar = theme.getStatusBarContent(editorState);
      console.log(`\n   📟 Full status bar: "${fullStatusBar}"`);

      // Check if status bar contains wrong icon
      const containsPaused = fullStatusBar.includes('⏸️');
      const containsRunning = fullStatusBar.includes('▶️');
      const containsStopped = fullStatusBar.includes('⏹️');

      console.log(`   📊 Status bar analysis:`);
      console.log(`     Contains ⏸️ (paused): ${containsPaused}`);
      console.log(`     Contains ▶️ (running): ${containsRunning}`);
      console.log(`     Contains ⏹️ (stopped): ${containsStopped}`);

      // Check for the specific issue: running but showing paused
      if (testCase.pomodoro.isRunning && !testCase.pomodoro.isPaused && containsPaused) {
        console.log(`     ❌ BUG DETECTED: Timer is running but shows as paused!`);
      } else if (testCase.pomodoro.isRunning && !testCase.pomodoro.isPaused && containsRunning) {
        console.log(`     ✅ Correct: Timer is running and shows as running`);
      } else if (testCase.pomodoro.isRunning && testCase.pomodoro.isPaused && containsPaused) {
        console.log(`     ✅ Correct: Timer is paused and shows as paused`);
      } else if (!testCase.pomodoro.isRunning && (containsStopped || (!containsRunning && !containsPaused))) {
        console.log(`     ✅ Correct: Timer is stopped and shows correctly`);
      }

      console.log(`   ${'='.repeat(60)}`);
    }

    // Test edge cases
    console.log(`\n🔧 Edge Case Tests:`);

    // Edge case 1: null pomodoro
    console.log(`\n   Edge Case 1: null pomodoro`);
    const nullPomodoroState = {
      mode: 'insert',
      line: 1,
      col: 1,
      filename: 'test.md',
      modified: false,
      wordCount: 0,
      pomodoro: null
    };
    const nullResult = theme.getStatusBarContent(nullPomodoroState);
    console.log(`     Result: "${nullResult}"`);
    console.log(`     Contains pomodoro info: ${nullResult.includes('🍅') || nullResult.includes('☕') ? 'YES ❌' : 'NO ✅'}`);

    // Edge case 2: undefined pomodoro
    console.log(`\n   Edge Case 2: undefined pomodoro`);
    const undefinedPomodoroState = {
      mode: 'insert',
      line: 1,
      col: 1,
      filename: 'test.md',
      modified: false,
      wordCount: 0
    };
    const undefinedResult = theme.getStatusBarContent(undefinedPomodoroState);
    console.log(`     Result: "${undefinedResult}"`);
    console.log(`     Contains pomodoro info: ${undefinedResult.includes('🍅') || undefinedResult.includes('☕') ? 'YES ❌' : 'NO ✅'}`);

    // Edge case 3: malformed pomodoro data
    console.log(`\n   Edge Case 3: malformed pomodoro data`);
    const malformedPomodoroState = {
      mode: 'insert',
      line: 1,
      col: 1,
      filename: 'test.md',
      modified: false,
      wordCount: 0,
      pomodoro: {
        // Missing some fields
        isRunning: true,
        timeFormatted: '20:00'
        // isPaused is undefined
      }
    };
    const malformedResult = theme.getStatusBarContent(malformedPomodoroState);
    console.log(`     Result: "${malformedResult}"`);
    console.log(`     Handled gracefully: ${malformedResult.length > 0 ? 'YES ✅' : 'NO ❌'}`);

    console.log('\n🏁 Status Bar Debug Complete');
    console.log('=====================================');
    console.log('Check the analysis above to identify any logic issues.');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run debug if called directly
if (require.main === module) {
  debugStatusBarLogic().then(() => {
    console.log('\n🏁 Status bar debug complete.');
    process.exit(0);
  });
}

module.exports = { debugStatusBarLogic };
