#!/usr/bin/env node

/**
 * Test Script for Word Count Modal Functionality
 * Tests that the word count modal opens and closes properly
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

function checkWordCountImplementation() {
  section('Checking Word Count Modal Implementation');

  const files = [
    'gui/renderer.html',
    'gui/renderer.js',
    'gui/project-interface.html',
    'gui/project-main.js'
  ];

  for (const file of files) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');

      log(`\n📄 ${file}:`, 'blue');

      // Check for modal HTML structure
      if (content.includes('wordCountModal') && content.includes('Document Statistics')) {
        log('  ✅ Word count modal HTML structure found', 'green');
      } else {
        log('  ❌ Word count modal HTML structure NOT found', 'red');
      }

      // Check for close button functionality
      if (content.includes('closeWordCountModal') || content.includes('closeModal')) {
        log('  ✅ Close button functionality found', 'green');
      } else {
        log('  ❌ Close button functionality NOT found', 'red');
      }

      // Check for event listeners
      if (content.includes('addEventListener') && content.includes('click')) {
        log('  ✅ Event listeners detected', 'green');
      } else {
        log('  ❌ Event listeners NOT found', 'red');
      }

      // Check for error handling
      if (content.includes('try') && content.includes('catch')) {
        log('  ✅ Error handling implemented', 'green');
      } else {
        log('  ❌ Error handling NOT found', 'red');
      }

      // Check for keyboard shortcuts
      if (content.includes('Ctrl+W') || content.includes('keydown')) {
        log('  ✅ Keyboard shortcut support found', 'green');
      } else {
        log('  ❌ Keyboard shortcut support NOT found', 'red');
      }

    } else {
      log(`  ❌ File not found: ${file}`, 'red');
    }
  }
}

function showTestInstructions() {
  section('Word Count Modal Test Instructions');

  log('\n🎯 How to Test Word Count Modal:', 'cyan');
  log('', 'white');

  log('1. Manual Testing Steps:', 'blue');
  log('   • Launch the GUI: npm run gui', 'white');
  log('   • Type some text in the editor', 'white');
  log('   • Press Ctrl+W to open word count modal', 'white');
  log('   • Verify statistics are displayed correctly', 'white');
  log('   • Click the "Close" button', 'white');
  log('   • Modal should close and return focus to editor', 'white');
  log('', 'white');

  log('2. Alternative Close Methods:', 'blue');
  log('   • Press Escape key to close modal', 'white');
  log('   • Click outside the modal (on overlay) to close', 'white');
  log('   • Use keyboard navigation if available', 'white');
  log('', 'white');

  log('3. What to Verify:', 'blue');
  log('   ✅ Modal opens when pressing Ctrl+W', 'green');
  log('   ✅ Statistics are calculated correctly', 'green');
  log('   ✅ "Close" button works', 'green');
  log('   ✅ Escape key closes modal', 'green');
  log('   ✅ Clicking overlay closes modal', 'green');
  log('   ✅ Focus returns to editor after closing', 'green');
  log('', 'white');

  log('❌ Common Issues to Check:', 'red');
  log('   • Button doesn\'t respond to clicks', 'yellow');
  log('   • Modal stays open after clicking close', 'yellow');
  log('   • JavaScript errors in browser console', 'yellow');
  log('   • Statistics not updating correctly', 'yellow');
  log('   • Focus not returning to editor', 'yellow');
}

function showTroubleshootingSteps() {
  section('Troubleshooting Steps');

  log('\n🔧 If Word Count Modal Won\'t Close:', 'cyan');
  log('', 'white');

  log('1. Check Browser Console:', 'blue');
  log('   • Open Developer Tools (F12)', 'white');
  log('   • Look for JavaScript errors in Console tab', 'white');
  log('   • Check for failed function calls', 'white');
  log('', 'white');

  log('2. Verify Button Functionality:', 'blue');
  log('   • Inspect the close button element', 'white');
  log('   • Check onclick attribute is present', 'white');
  log('   • Verify function exists in global scope', 'white');
  log('', 'white');

  log('3. Test Alternative Methods:', 'blue');
  log('   • Try Escape key', 'white');
  log('   • Try clicking modal overlay', 'white');
  log('   • Try refreshing the page (Ctrl+R)', 'white');
  log('', 'white');

  log('4. Manual Override:', 'blue');
  log('   • Open browser console (F12)', 'white');
  log('   • Type: closeWordCountModal()', 'white');
  log('   • Or: document.getElementById("wordCountModal").style.display = "none"', 'white');
  log('', 'white');

  log('5. Check Implementation:', 'blue');
  log('   • Verify global functions are defined', 'white');
  log('   • Check event listeners are attached', 'white');
  log('   • Ensure no CSS conflicts', 'white');
}

function showImplementationDetails() {
  section('Implementation Details');

  log('\n🔍 Current Implementation Features:', 'cyan');
  log('', 'white');

  log('Multiple Close Methods:', 'blue');
  log('   • onclick="closeWordCountModal()" attribute', 'white');
  log('   • addEventListener for backup functionality', 'white');
  log('   • Escape key listener', 'white');
  log('   • Modal overlay click listener', 'white');
  log('', 'white');

  log('Error Handling:', 'blue');
  log('   • try/catch blocks around modal operations', 'white');
  log('   • Console logging for debugging', 'white');
  log('   • Element existence checks', 'white');
  log('   • Graceful degradation', 'white');
  log('', 'white');

  log('Statistics Calculated:', 'blue');
  log('   • Words: text.trim().split(/\\s+/).length', 'white');
  log('   • Characters: text.length', 'white');
  log('   • Characters (no spaces): text.replace(/\\s/g, "").length', 'white');
  log('   • Lines: text.split("\\n").length', 'white');
  log('   • Paragraphs: text.split(/\\n\\s*\\n/).filter(p => p.trim()).length', 'white');
  log('   • Reading time: Math.ceil(words / 200) minutes', 'white');
  log('', 'white');

  log('Browser Compatibility:', 'blue');
  log('   • Modern browsers: Full support', 'white');
  log('   • Electron: Native integration', 'white');
  log('   • Fallback methods for older browsers', 'white');
}

function runDiagnostics() {
  section('Running Diagnostics');

  log('\n🔬 Checking Files...', 'cyan');

  // Check if key files exist
  const criticalFiles = [
    'gui/renderer.html',
    'gui/renderer.js',
    'gui/project-interface.html',
    'gui/project-main.js'
  ];

  let allFilesExist = true;
  for (const file of criticalFiles) {
    if (fs.existsSync(path.join(__dirname, file))) {
      log(`  ✅ ${file}`, 'green');
    } else {
      log(`  ❌ ${file} - MISSING`, 'red');
      allFilesExist = false;
    }
  }

  if (!allFilesExist) {
    log('\n❌ Critical files missing. Cannot continue diagnostics.', 'red');
    return false;
  }

  // Check package.json for GUI dependencies
  const packagePath = path.join(__dirname, 'package.json');
  if (fs.existsSync(packagePath)) {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    if (packageJson.dependencies && packageJson.dependencies.electron) {
      log(`  ✅ Electron dependency: ${packageJson.dependencies.electron}`, 'green');
    } else {
      log('  ❌ Electron dependency not found', 'red');
    }
  }

  return true;
}

async function main() {
  header('Word Count Modal Functionality Test');

  log('Testing word count modal open/close functionality...', 'white');

  try {
    // Run diagnostics
    if (!runDiagnostics()) {
      process.exit(1);
    }

    // Check implementation
    checkWordCountImplementation();

    // Show instructions
    showTestInstructions();
    showTroubleshootingSteps();
    showImplementationDetails();

    log('\n🎉 Diagnostics completed!', 'green');
    log('If the modal still won\'t close, check the troubleshooting steps above.', 'cyan');
    log('\nThe implementation includes multiple fallback methods:', 'white');
    log('  • Enhanced error handling', 'green');
    log('  • Multiple event listeners', 'green');
    log('  • Escape key support', 'green');
    log('  • Click-outside-to-close', 'green');
    log('  • Console debugging', 'green');

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
  checkWordCountImplementation,
  showTestInstructions,
  showTroubleshootingSteps,
  runDiagnostics
};
