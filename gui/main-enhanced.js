// Enhanced Main Process - extends the base main.js with enhanced features
const baseMain = require("./main.js");
const path = require("path");
const VoiceElectronHandlers = require("../src/voice/electron-handlers");

// Enhanced features initialization
process.env.WRITERS_ENHANCED = "true";

// Initialize voice transcription handlers
let voiceHandlers = null;
try {
  voiceHandlers = new VoiceElectronHandlers();
  console.log("Voice transcription handlers initialized");
} catch (error) {
  console.warn("Failed to initialize voice transcription:", error.message);
}

// Pass enhanced config to renderer
const originalCreateWindow = global.createWindow || (() => {});
global.createWindow = function (...args) {
  const result = originalCreateWindow.apply(this, args);

  // Add enhanced features to the window
  if (global.mainWindow && global.mainWindow.webContents) {
    global.mainWindow.webContents.on("dom-ready", () => {
      global.mainWindow.webContents.executeJavaScript(`
        window.WRITERS_ENHANCED = true;
        window.ENHANCED_CONFIG = ${process.argv.find((arg) => arg.startsWith("--config="))?.slice(9) || "{}"};
      `);
    });
  }

  return result;
};

// Load enhanced interface
const originalLoadFile = global.mainWindow?.loadFile;
if (originalLoadFile) {
  global.mainWindow.loadFile(
    path.join(__dirname, "project-interface-enhanced.html"),
  );
}

// Clean up voice handlers on app quit
const { app } = require("electron");
app.on("before-quit", () => {
  if (voiceHandlers) {
    try {
      voiceHandlers.cleanup();
      console.log("Voice handlers cleaned up");
    } catch (error) {
      console.warn("Error cleaning up voice handlers:", error.message);
    }
  }
});
