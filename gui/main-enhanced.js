// Enhanced Main Process - extends the base main.js with enhanced features
const baseMain = require('./main.js');
const path = require('path');

// Enhanced features initialization
process.env.WRITERS_ENHANCED = 'true';

// Pass enhanced config to renderer
const originalCreateWindow = global.createWindow || (() => {});
global.createWindow = function(...args) {
  const result = originalCreateWindow.apply(this, args);

  // Add enhanced features to the window
  if (global.mainWindow && global.mainWindow.webContents) {
    global.mainWindow.webContents.on('dom-ready', () => {
      global.mainWindow.webContents.executeJavaScript(`
        window.WRITERS_ENHANCED = true;
        window.ENHANCED_CONFIG = ${process.argv.find(arg => arg.startsWith('--config='))?.slice(9) || '{}'};
      `);
    });
  }

  return result;
};

// Load enhanced interface
const originalLoadFile = global.mainWindow?.loadFile;
if (originalLoadFile) {
  global.mainWindow.loadFile(path.join(__dirname, 'project-interface-enhanced.html'));
}