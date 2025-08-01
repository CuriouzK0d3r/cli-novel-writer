#!/usr/bin/env node

/**
 * Test Script for GUI Popup Visibility
 * Launches the GUI and provides instructions for testing character visibility
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(title) {
  const separator = '='.repeat(60);
  log(separator, 'cyan');
  log(`  ${title}`, 'bright');
  log(separator, 'cyan');
}

function section(title) {
  log(`\n${colors.yellow}${title}${colors.reset}`);
  log('-'.repeat(title.length), 'yellow');
}

function checkGuiFiles() {
  section('Checking GUI Files');

  const requiredFiles = [
    'gui/renderer.html',
    'gui/renderer.js',
    'gui/project-interface.html',
    'gui/project-main.js',
    'gui/main.js'
  ];

  let allFilesExist = true;

  for (const file of requiredFiles) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      log(`  ✅ ${file}`, 'green');
    } else {
      log(`  ❌ ${file} - NOT FOUND`, 'red');
      allFilesExist = false;
    }
  }

  return allFilesExist;
}

function checkElectron() {
  section('Checking Electron Installation');

  const packageJsonPath = path.join(__dirname, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    if (packageJson.dependencies && packageJson.dependencies.electron) {
      log(`  ✅ Electron found in dependencies: ${packageJson.dependencies.electron}`, 'green');
      return true;
    } else if (packageJson.devDependencies && packageJson.devDependencies.electron) {
      log(`  ✅ Electron found in devDependencies: ${packageJson.devDependencies.electron}`, 'green');
      return true;
    } else {
      log('  ❌ Electron not found in package.json', 'red');
      return false;
    }
  } else {
    log('  ❌ package.json not found', 'red');
    return false;
  }
}

function showVisibilityTestInstructions() {
  section('Popup Visibility Test Instructions');

  log('\n🎯 How to Test Character Visibility:', 'cyan');
  log('', 'white');

  log('1. Find Dialog Test:', 'blue');
  log('   • Press Ctrl+F to open the find dialog', 'white');
  log('   • Type some text in the input field', 'white');
  log('   • Characters should be BRIGHT WHITE on BLACK background', 'green');
  log('   • Border should be WHITE (3px thick)', 'white');
  log('   • When focused: border turns GREEN with glow effect', 'green');
  log('', 'white');

  log('2. Replace Dialog Test:', 'blue');
  log('   • Press Ctrl+R to open the replace dialog', 'white');
  log('   • Test both "Find" and "Replace with" inputs', 'white');
  log('   • Same visibility requirements as above', 'white');
  log('', 'white');

  log('3. Go to Line Test:', 'blue');
  log('   • Press Ctrl+G to open go-to-line dialog', 'white');
  log('   • Type a line number', 'white');
  log('   • Should have same high contrast appearance', 'white');
  log('', 'white');

  log('4. Project Interface Test:', 'blue');
  log('   • If using project interface, test modals there too', 'white');
  log('   • All inputs should have maximum contrast styling', 'white');
  log('', 'white');

  log('🔍 What to Look For:', 'magenta');
  log('   ✅ Characters are clearly visible when typing', 'green');
  log('   ✅ Black background with white text', 'green');
  log('   ✅ Thick white borders (3px)', 'green');
  log('   ✅ Green glow effect when focused', 'green');
  log('   ✅ Bold, large font (16px, weight 700)', 'green');
  log('', 'white');

  log('❌ If Characters Are Still Not Visible:', 'red');
  log('   • Check browser developer tools (F12)', 'yellow');
  log('   • Look for CSS conflicts in the Console tab', 'yellow');
  log('   • Check if other extensions are interfering', 'yellow');
  log('   • Try refreshing the GUI (Ctrl+R in the window)', 'yellow');
  log('   • Report the issue with browser and OS details', 'yellow');
}

function showTechnicalDetails() {
  section('Technical Implementation Details');

  log('\n🔧 Contrast Improvements Applied:', 'cyan');
  log('', 'white');

  log('CSS Changes:', 'blue');
  log('   • Background: #000000 (pure black)', 'white');
  log('   • Text: #ffffff (pure white)', 'white');
  log('   • Border: 3px solid #ffffff', 'white');
  log('   • Font: 16px, weight 700 (bold)', 'white');
  log('   • Focus: Green border + glow effect', 'white');
  log('', 'white');

  log('JavaScript Enforcement:', 'blue');
  log('   • forceHighContrastInput() method added', 'white');
  log('   • Styles applied with !important priority', 'white');
  log('   • Applied when modals open', 'white');
  log('   • Focus/blur event handlers added', 'white');
  log('', 'white');

  log('Files Modified:', 'blue');
  log('   • gui/renderer.html - CSS + ID selectors', 'white');
  log('   • gui/renderer.js - JavaScript enforcement', 'white');
  log('   • gui/project-interface.html - CSS + ID selectors', 'white');
  log('   • gui/project-main.js - JavaScript enforcement', 'white');
  log('   • src/editor/themes/dark-theme.js - CLI contrast', 'white');
  log('   • src/editor/dialogs.js - Theme integration', 'white');
}

function launchGui() {
  section('Launching GUI');

  log('Starting Writers CLI GUI...', 'cyan');
  log('(Press Ctrl+C in this terminal to stop)\n', 'yellow');

  // Try different launch methods
  const launchMethods = [
    { cmd: 'npm', args: ['run', 'gui'], desc: 'npm run gui' },
    { cmd: 'electron', args: ['gui/main.js'], desc: 'electron gui/main.js' },
    { cmd: 'node', args: ['gui-launcher.js'], desc: 'node gui-launcher.js' }
  ];

  let launched = false;

  for (const method of launchMethods) {
    if (!launched) {
      try {
        log(`Trying: ${method.desc}`, 'blue');

        const child = spawn(method.cmd, method.args, {
          stdio: 'inherit',
          cwd: __dirname
        });

        child.on('error', (error) => {
          log(`Failed: ${error.message}`, 'red');
        });

        child.on('exit', (code) => {
          if (code === 0) {
            log('\nGUI closed successfully.', 'green');
          } else {
            log(`\nGUI exited with code ${code}`, 'yellow');
          }
        });

        // If we get here without immediate error, consider it launched
        launched = true;
        log('GUI should be starting...', 'green');

        // Keep the process alive
        process.on('SIGINT', () => {
          log('\nShutting down...', 'yellow');
          child.kill();
          process.exit(0);
        });

        break;

      } catch (error) {
        log(`Launch method failed: ${error.message}`, 'red');
      }
    }
  }

  if (!launched) {
    log('\n❌ Could not launch GUI with any method', 'red');
    log('Try manually running:', 'yellow');
    log('  npm install', 'white');
    log('  npm run gui', 'white');
    process.exit(1);
  }
}

async function main() {
  header('GUI Popup Visibility Test');

  log('Testing character visibility improvements in popup menus...', 'white');

  try {
    // Pre-flight checks
    if (!checkGuiFiles()) {
      log('\n❌ Required GUI files missing. Cannot continue.', 'red');
      process.exit(1);
    }

    if (!checkElectron()) {
      log('\n⚠️  Electron not found. Attempting to install...', 'yellow');
      log('Run: npm install electron', 'white');
    }

    // Show test instructions
    showVisibilityTestInstructions();
    showTechnicalDetails();

    // Wait for user to be ready
    log('\n🚀 Ready to launch GUI?', 'cyan');
    log('Press Enter to continue, or Ctrl+C to cancel...', 'yellow');

    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', (key) => {
      if (key[0] === 0x0D || key[0] === 0x0A) { // Enter key
        process.stdin.setRawMode(false);
        process.stdin.pause();
        launchGui();
      } else if (key[0] === 0x03) { // Ctrl+C
        process.exit(0);
      }
    });

  } catch (error) {
    log(`\n❌ Test failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Auto-run if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  checkGuiFiles,
  checkElectron,
  showVisibilityTestInstructions,
  showTechnicalDetails
};
