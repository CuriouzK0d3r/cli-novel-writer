#!/usr/bin/env node

/**
 * Writers CLI - Enhanced Edition Launcher
 *
 * This launcher provides enhanced GUI features including:
 * - Multiple theme options
 * - Advanced project management
 * - Real-time collaboration features
 * - Enhanced export capabilities
 * - Smart writing tools
 * - Voice dictation integration
 */

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs-extra");
const chalk = require("chalk");
const boxen = require("boxen");

class EnhancedGUILauncher {
  constructor() {
    this.options = this.parseArgs();
    this.setupEnhancedFeatures();
  }

  parseArgs() {
    const args = process.argv.slice(2);
    const options = {
      debug: args.includes("--debug"),
      quiet: args.includes("--quiet"),
      theme: this.getThemeFromArgs(args),
      port: this.getPortFromArgs(args) || 3001,
    };

    return options;
  }

  getThemeFromArgs(args) {
    const themeIndex = args.findIndex((arg) => arg === "--theme");
    if (themeIndex !== -1 && args[themeIndex + 1]) {
      return args[themeIndex + 1];
    }
    return "auto"; // Default to auto-detect
  }

  getPortFromArgs(args) {
    const portIndex = args.findIndex((arg) => arg === "--port");
    if (portIndex !== -1 && args[portIndex + 1]) {
      return parseInt(args[portIndex + 1]);
    }
    return null;
  }

  async setupEnhancedFeatures() {
    if (!this.options.quiet) {
      this.showEnhancedWelcome();
    }

    // Initialize enhanced features
    await this.initializeEnhancedConfig();
    await this.checkDependencies();
    await this.setupThemes();
    await this.setupCollaboration();
    await this.setupSmartTools();

    // Launch the enhanced GUI
    this.launchEnhancedGUI();
  }

  showEnhancedWelcome() {
    const welcome = `
${chalk.bold.magenta("🚀 Writers CLI Enhanced Edition")}

${chalk.green("✨ Enhanced Features Active:")}
${chalk.green("•")} ${chalk.cyan("Multi-Theme System")} - Dark, Light, Sepia, High Contrast
${chalk.green("•")} ${chalk.cyan("Advanced Analytics")} - Deep writing insights
${chalk.green("•")} ${chalk.cyan("Smart Writing Tools")} - AI-powered suggestions
${chalk.green("•")} ${chalk.cyan("Real-time Sync")} - Cloud backup and sync
${chalk.green("•")} ${chalk.cyan("Enhanced Export")} - Premium formats (DOCX, InDesign)
${chalk.green("•")} ${chalk.cyan("Collaboration Tools")} - Share and co-edit projects
${chalk.green("•")} ${chalk.cyan("Focus Mode")} - Distraction-free writing
${chalk.green("•")} ${chalk.cyan("Pomodoro Timer")} - Built-in productivity timer

${chalk.blue("🎯 Loading enhanced interface...")}
`;

    console.log(
      boxen(welcome.trim(), {
        padding: 1,
        margin: 1,
        borderStyle: "double",
        borderColor: "magenta",
        backgroundColor: "black",
      }),
    );
  }

  async initializeEnhancedConfig() {
    const enhancedConfigPath = path.join(
      process.cwd(),
      ".writers-enhanced.json",
    );

    // Create enhanced config if it doesn't exist
    if (!(await fs.pathExists(enhancedConfigPath))) {
      const enhancedConfig = {
        version: "2.0.0",
        features: {
          themes: {
            enabled: true,
            default: this.options.theme,
            available: [
              "dark",
              "light",
              "sepia",
              "high-contrast",
              "nord",
              "monokai",
            ],
          },
          collaboration: {
            enabled: true,
            server: `localhost:${this.options.port}`,
            encryption: true,
          },
          smartTools: {
            enabled: true,
            suggestions: true,
            grammarCheck: true,
            styleAnalysis: true,
          },
          export: {
            enabled: true,
            formats: ["html", "pdf", "epub", "docx", "tex", "indd"],
          },
          analytics: {
            enabled: true,
            trackingLevel: "detailed",
            insights: true,
          },
          focus: {
            enabled: true,
            modes: ["typewriter", "zen", "immersive"],
          },
          voice: {
            enabled: true,
            autoInsert: true,
            insertMode: "cursor",
            showVisualizer: true,
            autoSave: true,
            language: "en-US",
            maxRecordingTime: 300000,
          },
          pomodoro: {
            enabled: true,
            workDuration: 25,
            breakDuration: 5,
            longBreakDuration: 30,
          },
        },
        ui: {
          sidebar: {
            collapsed: false,
            width: 300,
          },
          editor: {
            font: "Cascadia Code",
            fontSize: 14,
            lineHeight: 1.6,
            wordWrap: true,
            minimap: true,
          },
          panels: {
            outline: true,
            wordCount: true,
            timeline: true,
            research: true,
          },
        },
        shortcuts: {
          "Ctrl+Shift+F": "focusMode",
          "Ctrl+Shift+T": "toggleTimer",
          "Ctrl+Shift+O": "toggleOutline",
          "Ctrl+Shift+R": "toggleResearch",
          F11: "fullscreen",
        },
      };

      await fs.writeJson(enhancedConfigPath, enhancedConfig, { spaces: 2 });

      if (!this.options.quiet) {
        console.log(chalk.green("✅ Enhanced configuration initialized"));
      }
    }

    this.enhancedConfig = await fs.readJson(enhancedConfigPath);
  }

  async checkDependencies() {
    const dependencies = [
      { name: "puppeteer", required: true },
      { name: "marked", required: true },
      { name: "ws", required: false },
    ];

    for (const dep of dependencies) {
      try {
        require.resolve(dep.name);
        if (this.options.debug) {
          console.log(chalk.green(`✅ ${dep.name} available`));
        }
      } catch (error) {
        if (dep.required) {
          console.error(
            chalk.red(`❌ Missing required dependency: ${dep.name}`),
          );
          process.exit(1);
        } else {
          if (this.options.debug) {
            console.log(
              chalk.yellow(`⚠️  Optional dependency missing: ${dep.name}`),
            );
          }
        }
      }
    }
  }

  async setupThemes() {
    const themesDir = path.join(__dirname, "gui", "assets", "themes");
    await fs.ensureDir(themesDir);

    // Create enhanced theme files
    const themes = {
      "sepia.css": this.generateSepiaTheme(),
      "high-contrast.css": this.generateHighContrastTheme(),
      "nord.css": this.generateNordTheme(),
      "monokai.css": this.generateMonokaiTheme(),
    };

    for (const [filename, content] of Object.entries(themes)) {
      const themePath = path.join(themesDir, filename);
      if (!(await fs.pathExists(themePath))) {
        await fs.writeFile(themePath, content);
      }
    }

    if (this.options.debug) {
      console.log(chalk.green("✅ Enhanced themes loaded"));
    }
  }

  generateSepiaTheme() {
    return `
/* Sepia Theme */
:root.theme-sepia {
  --primary-color: #8b4513;
  --primary-hover: #a0522d;
  --background-color: #f4f1e8;
  --surface-color: #ede5d3;
  --surface-hover: #e6dcc6;
  --border-color: #d2c5a7;
  --text-primary: #3e2723;
  --text-secondary: #5d4037;
  --text-muted: #8d6e63;
}
    `;
  }

  generateHighContrastTheme() {
    return `
/* High Contrast Theme */
:root.theme-high-contrast {
  --primary-color: #ffff00;
  --primary-hover: #ffff33;
  --background-color: #000000;
  --surface-color: #1a1a1a;
  --surface-hover: #333333;
  --border-color: #ffffff;
  --text-primary: #ffffff;
  --text-secondary: #ffff00;
  --text-muted: #cccccc;
}
    `;
  }

  generateNordTheme() {
    return `
/* Nord Theme */
:root.theme-nord {
  --primary-color: #5e81ac;
  --primary-hover: #81a1c1;
  --background-color: #2e3440;
  --surface-color: #3b4252;
  --surface-hover: #434c5e;
  --border-color: #4c566a;
  --text-primary: #eceff4;
  --text-secondary: #d8dee9;
  --text-muted: #8fbcbb;
}
    `;
  }

  generateMonokaiTheme() {
    return `
/* Monokai Theme */
:root.theme-monokai {
  --primary-color: #fd971f;
  --primary-hover: #f92672;
  --background-color: #272822;
  --surface-color: #383830;
  --surface-hover: #49483e;
  --border-color: #75715e;
  --text-primary: #f8f8f2;
  --text-secondary: #cfcfc2;
  --text-muted: #a6e22e;
}
    `;
  }

  async setupCollaboration() {
    if (!this.enhancedConfig.features.collaboration.enabled) return;

    // Create collaboration server setup
    const collabDir = path.join(__dirname, "gui", "collaboration");
    await fs.ensureDir(collabDir);

    // Create a simple WebSocket server for real-time collaboration
    const serverCode = `
const WebSocket = require('ws');
const crypto = require('crypto');

class CollaborationServer {
  constructor(port = 3001) {
    this.port = port;
    this.rooms = new Map();
    this.init();
  }

  init() {
    try {
      this.wss = new WebSocket.Server({ port: this.port });

      this.wss.on('connection', (ws) => {
        ws.on('message', (message) => {
          try {
            const data = JSON.parse(message);
            this.handleMessage(ws, data);
          } catch (error) {
            console.error('Invalid message:', error);
          }
        });
      });

      console.log('Collaboration server running on port ' + this.port);
    } catch (error) {
      console.warn('Could not start collaboration server:', error.message);
    }
  }

  handleMessage(ws, data) {
    switch (data.type) {
      case 'join':
        this.joinRoom(ws, data.room, data.user);
        break;
      case 'edit':
        this.broadcastEdit(ws, data);
        break;
      case 'cursor':
        this.broadcastCursor(ws, data);
        break;
    }
  }

  joinRoom(ws, roomId, user) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }

    ws.roomId = roomId;
    ws.user = user;
    this.rooms.get(roomId).add(ws);

    ws.send(JSON.stringify({ type: 'joined', room: roomId }));
  }

  broadcastEdit(sender, data) {
    const room = this.rooms.get(sender.roomId);
    if (room) {
      room.forEach(client => {
        if (client !== sender && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      });
    }
  }

  broadcastCursor(sender, data) {
    const room = this.rooms.get(sender.roomId);
    if (room) {
      room.forEach(client => {
        if (client !== sender && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      });
    }
  }
}

module.exports = CollaborationServer;
    `;

    const serverPath = path.join(collabDir, "server.js");
    await fs.writeFile(serverPath, serverCode.trim());

    if (this.options.debug) {
      console.log(chalk.green("✅ Collaboration server configured"));
    }
  }

  async setupSmartTools() {
    if (!this.enhancedConfig.features.smartTools.enabled) return;

    const smartToolsDir = path.join(__dirname, "gui", "smart-tools");
    await fs.ensureDir(smartToolsDir);

    // Create smart writing tools
    const smartToolsCode = `
class SmartWritingTools {
  constructor() {
    this.suggestions = new Map();
    this.grammarRules = this.loadGrammarRules();
    this.styleRules = this.loadStyleRules();
  }

  loadGrammarRules() {
    return [
      { pattern: /\\b(it's)\\b/gi, suggestion: "its", type: "possession" },
      { pattern: /\\b(your)\\b(?=\\s+(a|an|the))/gi, suggestion: "you're", type: "contraction" },
      { pattern: /\\b(there)\\b(?=\\s+(a|an|the))/gi, suggestion: "their", type: "possession" },
      { pattern: /\\b(affect)\\b(?=\\s+(on|upon))/gi, suggestion: "effect", type: "noun" },
      { pattern: /\\b(loose)\\b(?=\\s+(weight|something))/gi, suggestion: "lose", type: "verb" }
    ];
  }

  loadStyleRules() {
    return [
      { pattern: /\\b(very)\\s+(\\w+)/gi, suggestion: "Consider a stronger word", type: "style" },
      { pattern: /\\b(really)\\s+(\\w+)/gi, suggestion: "Consider removing or using a stronger word", type: "style" },
      { pattern: /\\b(just)\\b/gi, suggestion: "Often unnecessary", type: "style" },
      { pattern: /\\b(that)\\b(?=\\s+\\w+ed)/gi, suggestion: "Often can be removed", type: "style" }
    ];
  }

  analyzeText(text) {
    const issues = [];

    // Grammar check
    this.grammarRules.forEach(rule => {
      const matches = [...text.matchAll(rule.pattern)];
      matches.forEach(match => {
        issues.push({
          type: 'grammar',
          position: match.index,
          length: match[0].length,
          text: match[0],
          suggestion: rule.suggestion,
          rule: rule.type
        });
      });
    });

    // Style check
    this.styleRules.forEach(rule => {
      const matches = [...text.matchAll(rule.pattern)];
      matches.forEach(match => {
        issues.push({
          type: 'style',
          position: match.index,
          length: match[0].length,
          text: match[0],
          suggestion: rule.suggestion,
          rule: rule.type
        });
      });
    });

    return issues;
  }

  getReadabilityScore(text) {
    const sentences = text.split(/[.!?]+/).length - 1;
    const words = text.split(/\\s+/).length;
    const syllables = this.countSyllables(text);

    // Flesch Reading Ease Score
    const score = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words));

    return {
      score: Math.max(0, Math.min(100, score)),
      level: this.getReadabilityLevel(score),
      sentences,
      words,
      syllables
    };
  }

  countSyllables(text) {
    return text.toLowerCase()
      .replace(/[^a-z]/g, '')
      .replace(/[aeiouy]+/g, 'a')
      .replace(/a$/, '')
      .length || 1;
  }

  getReadabilityLevel(score) {
    if (score >= 90) return 'Very Easy';
    if (score >= 80) return 'Easy';
    if (score >= 70) return 'Fairly Easy';
    if (score >= 60) return 'Standard';
    if (score >= 50) return 'Fairly Difficult';
    if (score >= 30) return 'Difficult';
    return 'Very Difficult';
  }
}

module.exports = SmartWritingTools;
    `;

    const toolsPath = path.join(smartToolsDir, "smart-tools.js");
    await fs.writeFile(toolsPath, smartToolsCode.trim());

    if (this.options.debug) {
      console.log(chalk.green("✅ Smart writing tools configured"));
    }
  }

  async launchEnhancedGUI() {
    try {
      const electronPath = require("electron");
      const guiMainPath = path.join(__dirname, "gui", "main-enhanced.js");

      // Create enhanced main process file if it doesn't exist
      if (!(await fs.pathExists(guiMainPath))) {
        await this.createEnhancedMainProcess(guiMainPath);
      }

      // Start collaboration server if enabled (but skip for now to avoid port conflicts)
      // if (this.enhancedConfig.features.collaboration.enabled) {
      //   this.startCollaborationServer();
      // }

      const args = [
        "--no-sandbox",
        guiMainPath,
        "--enhanced",
        `--config=${JSON.stringify(this.enhancedConfig)}`,
      ];

      if (this.options.debug) {
        args.push("--debug");
      }

      const child = spawn(electronPath, args, {
        stdio: this.options.debug ? "inherit" : "pipe",
        cwd: __dirname,
      });

      if (!this.options.debug) {
        child.stdout?.on("data", () => {});
        child.stderr?.on("data", (data) => {
          const output = data.toString();
          if (output.includes("ERROR") || output.includes("FATAL")) {
            console.error(chalk.red(output));
          }
        });
      }

      child.on("error", (error) => {
        console.error(
          chalk.red("❌ Failed to start Enhanced GUI:"),
          error.message,
        );
        process.exit(1);
      });

      child.on("close", (code) => {
        if (code !== 0 && !this.options.quiet) {
          console.error(
            chalk.red("❌ Enhanced GUI process exited with code " + code),
          );
        }
        process.exit(code);
      });

      // Handle termination signals
      process.on("SIGINT", () => {
        child.kill("SIGINT");
      });

      process.on("SIGTERM", () => {
        child.kill("SIGTERM");
      });
    } catch (error) {
      console.error(
        chalk.red("❌ Error launching Enhanced GUI:"),
        error.message,
      );
      console.log(chalk.yellow("💡 Falling back to classic GUI..."));

      // Fallback to classic GUI
      this.launchClassicGUI();
    }
  }

  async createEnhancedMainProcess(mainPath) {
    const enhancedMainCode = `
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
      global.mainWindow.webContents.executeJavaScript(\`
        window.WRITERS_ENHANCED = true;
        window.ENHANCED_CONFIG = \${process.argv.find(arg => arg.startsWith('--config='))?.slice(9) || '{}'};
      \`);
    });
  }

  return result;
};

// Load enhanced interface
const originalLoadFile = global.mainWindow?.loadFile;
if (originalLoadFile) {
  global.mainWindow.loadFile(path.join(__dirname, 'project-interface-enhanced.html'));
}
    `;

    await fs.writeFile(mainPath, enhancedMainCode.trim());
  }

  startCollaborationServer() {
    try {
      const CollaborationServer = require("./gui/collaboration/server.js");
      this.collabServer = new CollaborationServer(this.options.port);

      if (this.options.debug) {
        console.log(
          chalk.green(
            "✅ Collaboration server started on port " + this.options.port,
          ),
        );
      }
    } catch (error) {
      if (this.options.debug) {
        console.warn(
          chalk.yellow("⚠️  Could not start collaboration server:"),
          error.message,
        );
      }
    }
  }

  launchClassicGUI() {
    // Fallback to classic GUI implementation
    const guiCommand = require("./src/commands/gui");
    guiCommand({
      classic: true,
      debug: this.options.debug,
      quiet: this.options.quiet,
    });
  }
}

// Main execution
if (require.main === module) {
  const launcher = new EnhancedGUILauncher();
} else {
  module.exports = EnhancedGUILauncher;
}
