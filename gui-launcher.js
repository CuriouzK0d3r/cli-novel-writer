#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Check if electron is available
try {
  require.resolve('electron');
} catch (error) {
  console.error('Electron is not installed. Please run: npm install electron');
  process.exit(1);
}

// Check if GUI files exist
const guiMainPath = path.join(__dirname, 'gui', 'main.js');
if (!fs.existsSync(guiMainPath)) {
  console.error('GUI files not found. Please ensure the gui folder exists with main.js');
  process.exit(1);
}

console.log('Starting Writers CLI GUI...');

// Launch Electron with the GUI
const electronPath = require('electron');
const child = spawn(electronPath, [guiMainPath], {
  stdio: 'inherit',
  cwd: __dirname
});

child.on('error', (error) => {
  console.error('Failed to start GUI:', error.message);
  process.exit(1);
});

child.on('close', (code) => {
  if (code !== 0) {
    console.error(`GUI process exited with code ${code}`);
  }
  process.exit(code);
});

// Handle termination signals
process.on('SIGINT', () => {
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  child.kill('SIGTERM');
});
