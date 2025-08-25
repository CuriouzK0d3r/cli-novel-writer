#!/usr/bin/env node

/**
 * Test script for typewriter mode line dimming functionality
 * This script helps verify that the typewriter dimming feature works correctly
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🎯 Typewriter Line Dimming Test Script');
console.log('=====================================\n');

// Check if demo file exists
const demoFile = path.join(__dirname, 'typewriter-test', 'demo.md');
if (!fs.existsSync(demoFile)) {
    console.error('❌ Demo file not found at:', demoFile);
    console.log('Please ensure the demo file exists first.');
    process.exit(1);
}

console.log('✅ Demo file found:', demoFile);

// Test checklist
const testChecklist = [
    '1. Launch GUI with demo file',
    '2. Enable typewriter mode',
    '3. Verify line dimming behavior',
    '4. Test cursor movement',
    '5. Test focus mode typewriter',
    '6. Test in dark theme',
    '7. Verify smooth transitions'
];

console.log('\n📋 Test Checklist:');
testChecklist.forEach(item => console.log(`   ${item}`));

console.log('\n🚀 Starting GUI with demo file...\n');

// Launch the GUI with the demo file
const guiProcess = spawn('node', ['gui-enhanced-launcher.js', demoFile], {
    cwd: __dirname,
    stdio: 'inherit'
});

guiProcess.on('error', (error) => {
    console.error('❌ Failed to start GUI:', error.message);
    process.exit(1);
});

guiProcess.on('close', (code) => {
    console.log(`\n🏁 GUI process exited with code ${code}`);

    if (code === 0) {
        console.log('\n✅ Test completed successfully!');
        console.log('\nExpected behaviors to verify:');
        console.log('  - Current line and ±1 lines are fully visible');
        console.log('  - Other lines are dimmed with reduced opacity');
        console.log('  - Smooth transitions when moving cursor');
        console.log('  - Works in both normal and focus modes');
        console.log('  - Adapts to light/dark themes');
    } else {
        console.log('\n⚠️  GUI exited with non-zero code. Check for errors.');
    }
});

// Handle script termination
process.on('SIGINT', () => {
    console.log('\n\n🛑 Test interrupted by user');
    guiProcess.kill('SIGTERM');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n\n🛑 Test terminated');
    guiProcess.kill('SIGTERM');
    process.exit(0);
});
