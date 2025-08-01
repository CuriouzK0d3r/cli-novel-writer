#!/usr/bin/env node

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const chalk = require("chalk");
const boxen = require("boxen");

async function launchEnhancedGUI(options = {}) {
  console.log(chalk.cyan("🚀 Starting Writers CLI Enhanced Edition..."));

  // Show enhanced features info
  if (!options.quiet) {
    const message = `
${chalk.bold.magenta("Writers CLI Enhanced Edition")}

${chalk.green("✨ New Enhanced Features:")}
${chalk.green("•")} Advanced project management with templates
${chalk.green("•")} Multiple theme options (Dark, Light, Sepia, High Contrast)
${chalk.green("•")} Comprehensive export system (PDF, EPUB, DOCX, HTML)
${chalk.green("•")} Real-time collaboration and version control
${chalk.green("•")} Smart writing tools and Pomodoro timer
${chalk.green("•")} Character and plot tracking
${chalk.green("•")} Research notes and timeline management
${chalk.green("•")} Advanced backup and restore system
${chalk.green("•")} Split-screen editing and distraction-free mode
${chalk.green("•")} Writing goals and progress tracking

${chalk.blue("🎨 Visual Enhancements:")}
${chalk.blue("•")} Modern, responsive interface design
${chalk.blue("•")} Smooth animations and transitions
${chalk.blue("•")} Customizable themes and fonts
${chalk.blue("•")} Enhanced sidebar with tabbed navigation
${chalk.blue("•")} Professional status indicators

${chalk.yellow("⚡ Performance Improvements:")}
${chalk.yellow("•")} Faster file operations
${chalk.yellow("•")} Optimized memory usage
${chalk.yellow("•")} Auto-save and crash recovery
${chalk.yellow("•")} Background sync capabilities

${chalk.magenta("Starting the enhanced interface...")}
`;

    console.log(
      boxen(message.trim(), {
        padding: 1,
        margin: 1,
        borderStyle: "double",
        borderColor: "magenta",
        backgroundColor: "black",
      }),
    );
  }

  // Check if electron is available
  try {
    require.resolve("electron");
  } catch (error) {
    console.error(chalk.red("❌ Electron is not installed."));
    console.log(chalk.yellow("Installing Electron..."));

    try {
      const { execSync } = require("child_process");
      execSync("npm install electron", { stdio: "inherit" });
      console.log(chalk.green("✅ Electron installed successfully."));
    } catch (installError) {
      console.error(chalk.red("❌ Failed to install Electron."));
      console.log(chalk.yellow("Please run: npm install electron"));
      process.exit(1);
    }
  }

  // Check if enhanced GUI files exist
  const enhancedMainPath = path.join(__dirname, "gui", "enhanced-main.js");
  const enhancedInterfacePath = path.join(__dirname, "gui", "enhanced-interface.html");

  if (!fs.existsSync(enhancedMainPath)) {
    console.error(chalk.red("❌ Enhanced GUI main file not found."));
    console.log(chalk.yellow("Expected:", enhancedMainPath));

    // Fallback to regular GUI
    console.log(chalk.yellow("🔄 Falling back to regular GUI..."));
    const regularMainPath = path.join(__dirname, "gui", "main.js");

    if (fs.existsSync(regularMainPath)) {
      return launchRegularGUI(options);
    } else {
      console.error(chalk.red("❌ No GUI files found."));
      process.exit(1);
    }
  }

  if (!fs.existsSync(enhancedInterfacePath)) {
    console.error(chalk.red("❌ Enhanced GUI interface file not found."));
    console.log(chalk.yellow("Expected:", enhancedInterfacePath));
    process.exit(1);
  }

  // Check for required directories
  const requiredDirs = [
    path.join(__dirname, "gui", "styles"),
    path.join(__dirname, "gui", "src", "renderer"),
    path.join(__dirname, "gui", "src", "main", "services")
  ];

  for (const dir of requiredDirs) {
    if (!fs.existsSync(dir)) {
      console.warn(chalk.yellow(`⚠️  Directory missing: ${dir}`));
      console.log(chalk.yellow("Some features may not work correctly."));
    }
  }

  try {
    // Launch Electron with the Enhanced GUI
    const electronPath = require("electron");

    console.log(chalk.blue("🎯 Launching Enhanced Writers CLI..."));

    const child = spawn(electronPath, [
      "--no-sandbox",
      "--disable-web-security", // Allow local file access for themes
      "--enable-features=VaapiVideoDecoder", // Hardware acceleration
      enhancedMainPath
    ], {
      stdio: options.debug ? "inherit" : "pipe",
      cwd: __dirname,
      env: {
        ...process.env,
        WRITERS_CLI_ENHANCED: "true",
        NODE_ENV: options.development ? "development" : "production"
      }
    });

    if (!options.debug) {
      // Show loading progress
      const loadingSteps = [
        "Initializing enhanced interface...",
        "Loading themes and styles...",
        "Setting up project management...",
        "Initializing writing tools...",
        "Preparing collaboration features...",
        "Starting backup manager...",
        "Ready to write! ✨"
      ];

      let stepIndex = 0;
      const loadingInterval = setInterval(() => {
        if (stepIndex < loadingSteps.length) {
          console.log(chalk.gray(`   ${loadingSteps[stepIndex]}`));
          stepIndex++;
        } else {
          clearInterval(loadingInterval);
        }
      }, 500);

      // Suppress most electron output unless in debug mode
      child.stdout?.on("data", (data) => {
        const output = data.toString();
        // Only show important messages
        if (output.includes("ERROR") || output.includes("Ready")) {
          console.log(chalk.gray(output.trim()));
        }
      });

      child.stderr?.on("data", (data) => {
        const output = data.toString();
        // Only show actual errors, not warnings
        if (output.includes("ERROR") || output.includes("FATAL")) {
          console.error(chalk.red(output.trim()));
        } else if (output.includes("WARN")) {
          console.warn(chalk.yellow(output.trim()));
        }
      });

      // Clear loading interval when process starts
      setTimeout(() => {
        clearInterval(loadingInterval);
        if (!options.quiet) {
          console.log(chalk.green("🎉 Enhanced Writers CLI is now running!"));
          console.log(chalk.gray("   Close this terminal to keep the app running in background."));
        }
      }, 3000);
    }

    child.on("error", (error) => {
      console.error(chalk.red("❌ Failed to start Enhanced GUI:"), error.message);

      // Try fallback to regular GUI
      console.log(chalk.yellow("🔄 Attempting fallback to regular GUI..."));
      launchRegularGUI(options);
    });

    child.on("close", (code) => {
      if (code !== 0 && !options.quiet) {
        console.error(chalk.red(`❌ Enhanced GUI process exited with code ${code}`));

        // Suggest troubleshooting steps
        console.log(chalk.yellow("\n💡 Troubleshooting suggestions:"));
        console.log(chalk.yellow("   • Try running with --debug flag for more information"));
        console.log(chalk.yellow("   • Check if all dependencies are installed: npm install"));
        console.log(chalk.yellow("   • Try the regular GUI: node gui-launcher.js"));
        console.log(chalk.yellow("   • Report issues at: https://github.com/yourusername/writers-cli/issues"));
      } else if (code === 0 && !options.quiet) {
        console.log(chalk.green("✅ Enhanced Writers CLI closed successfully."));
      }
      process.exit(code);
    });

    // Handle termination signals gracefully
    const cleanup = () => {
      console.log(chalk.yellow("\n🛑 Shutting down Enhanced Writers CLI..."));
      child.kill("SIGTERM");
      setTimeout(() => {
        child.kill("SIGKILL");
      }, 5000);
    };

    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
    process.on("exit", cleanup);

  } catch (error) {
    console.error(chalk.red("❌ Error launching Enhanced GUI:"), error.message);
    console.log(chalk.yellow("💡 Try running: npm run gui"));
    console.log(chalk.yellow("💡 Or use regular GUI: node gui-launcher.js"));
    process.exit(1);
  }
}

// Fallback to regular GUI
async function launchRegularGUI(options = {}) {
  console.log(chalk.yellow("🔄 Starting regular Writers CLI GUI..."));

  try {
    const regularMainPath = path.join(__dirname, "gui", "main.js");
    const electronPath = require("electron");

    const child = spawn(electronPath, [
      "--no-sandbox",
      regularMainPath
    ], {
      stdio: options.debug ? "inherit" : "pipe",
      cwd: __dirname
    });

    child.on("error", (error) => {
      console.error(chalk.red("❌ Failed to start regular GUI:"), error.message);
      process.exit(1);
    });

    child.on("close", (code) => {
      process.exit(code);
    });

  } catch (error) {
    console.error(chalk.red("❌ Failed to launch any GUI version:"), error.message);
    console.log(chalk.yellow("💡 Please check your installation and try again."));
    process.exit(1);
  }
}

// CLI argument parsing
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    debug: false,
    quiet: false,
    development: false,
    help: false
  };

  for (const arg of args) {
    switch (arg) {
      case "--debug":
      case "-d":
        options.debug = true;
        break;
      case "--quiet":
      case "-q":
        options.quiet = true;
        break;
      case "--dev":
      case "--development":
        options.development = true;
        break;
      case "--help":
      case "-h":
        options.help = true;
        break;
      default:
        console.warn(chalk.yellow(`Unknown argument: ${arg}`));
    }
  }

  return options;
}

// Show help
function showHelp() {
  console.log(`
${chalk.bold.cyan("Writers CLI Enhanced Edition Launcher")}

${chalk.bold("Usage:")}
  node gui-enhanced-launcher.js [options]

${chalk.bold("Options:")}
  -d, --debug         Show debug output from Electron
  -q, --quiet         Suppress startup messages
  --dev, --development Run in development mode
  -h, --help          Show this help message

${chalk.bold("Examples:")}
  node gui-enhanced-launcher.js
  node gui-enhanced-launcher.js --debug
  node gui-enhanced-launcher.js --quiet --dev

${chalk.bold("Features:")}
  • Enhanced project management
  • Advanced theming system
  • Real-time collaboration
  • Comprehensive export options
  • Smart writing tools
  • Backup and version control

${chalk.bold("Support:")}
  Report issues: https://github.com/yourusername/writers-cli/issues
  Documentation: https://writers-cli.com/docs
`);
}

// Main execution
async function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    return;
  }

  // Show banner
  if (!options.quiet) {
    console.log(chalk.bold.magenta(`
╔══════════════════════════════════════╗
║     Writers CLI Enhanced Edition     ║
║        The Ultimate Writing Tool     ║
╚══════════════════════════════════════╝
`));
  }

  try {
    await launchEnhancedGUI(options);
  } catch (error) {
    console.error(chalk.red("❌ Fatal error:"), error.message);
    if (options.debug) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Handle unhandled errors
process.on("unhandledRejection", (reason, promise) => {
  console.error(chalk.red("❌ Unhandled Rejection at:"), promise, "reason:", reason);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error(chalk.red("❌ Uncaught Exception:"), error.message);
  process.exit(1);
});

// Export for testing
if (require.main === module) {
  main();
} else {
  module.exports = {
    launchEnhancedGUI,
    launchRegularGUI,
    parseArgs,
    showHelp
  };
}
