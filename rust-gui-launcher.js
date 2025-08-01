#!/usr/bin/env node

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const chalk = require("chalk");
const boxen = require("boxen");

async function launchRustGUI(options = {}) {
  console.log(chalk.cyan("🚀 Starting Writers CLI Rust GUI..."));

  if (!options.quiet) {
    const message = `
${chalk.bold.magenta("Writers CLI - Rust Edition")}

${chalk.green("✨ Features:")}
${chalk.green("•")} Native performance with Rust backend
${chalk.green("•")} Modern Tauri-based GUI framework
${chalk.green("•")} Cross-platform compatibility
${chalk.green("•")} Integrated project management
${chalk.green("•")} Real-time collaboration tools
${chalk.green("•")} Advanced export capabilities
${chalk.green("•")} Distraction-free writing mode
${chalk.green("•")} Built-in backup and version control

${chalk.blue("🎨 Interface:")}
${chalk.blue("•")} Clean, modern design
${chalk.blue("•")} Multiple theme options
${chalk.blue("•")} Customizable workspace
${chalk.blue("•")} Responsive layout
${chalk.blue("•")} Keyboard shortcuts

${chalk.yellow("⚡ Performance:")}
${chalk.yellow("•")} Fast startup and operation
${chalk.yellow("•")} Low memory footprint
${chalk.yellow("•")} Efficient file handling
${chalk.yellow("•")} Background processing

${chalk.magenta("Launching the Rust-powered interface...")}
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

  const rustGuiDir = path.join(__dirname, "rust-gui");

  // Check if Rust GUI directory exists
  if (!fs.existsSync(rustGuiDir)) {
    console.error(chalk.red("❌ Rust GUI directory not found."));
    console.log(chalk.yellow("Expected:", rustGuiDir));
    console.log(chalk.yellow("💡 Please ensure the Rust GUI is properly built."));
    process.exit(1);
  }

  // Check if Cargo is available
  try {
    const { execSync } = require("child_process");
    execSync("cargo --version", { stdio: "pipe" });
  } catch (error) {
    console.error(chalk.red("❌ Cargo (Rust) is not installed."));
    console.log(chalk.yellow("Please install Rust from: https://rustup.rs/"));
    process.exit(1);
  }

  // Check if Tauri CLI is available
  try {
    const { execSync } = require("child_process");
    execSync("cargo tauri --version", { stdio: "pipe", cwd: rustGuiDir });
  } catch (error) {
    console.log(chalk.yellow("Installing Tauri CLI..."));
    try {
      const { execSync } = require("child_process");
      execSync("cargo install tauri-cli", { stdio: "inherit" });
      console.log(chalk.green("✅ Tauri CLI installed successfully."));
    } catch (installError) {
      console.error(chalk.red("❌ Failed to install Tauri CLI."));
      console.log(chalk.yellow("Please run: cargo install tauri-cli"));
      process.exit(1);
    }
  }

  try {
    console.log(chalk.blue("🔧 Building and launching Rust GUI..."));

    const args = options.development ? ["tauri", "dev"] : ["tauri", "build", "--", "--run"];

    if (options.debug) {
      args.push("--verbose");
    }

    const child = spawn("cargo", args, {
      stdio: options.debug ? "inherit" : "pipe",
      cwd: rustGuiDir,
      env: {
        ...process.env,
        RUST_LOG: options.debug ? "debug" : "info",
        TAURI_DEV: options.development ? "true" : "false"
      }
    });

    if (!options.debug && !options.development) {
      // Show loading progress for production builds
      const loadingSteps = [
        "Compiling Rust backend...",
        "Building frontend assets...",
        "Bundling application...",
        "Optimizing for production...",
        "Preparing launcher...",
        "Starting application... ✨"
      ];

      let stepIndex = 0;
      const loadingInterval = setInterval(() => {
        if (stepIndex < loadingSteps.length) {
          console.log(chalk.gray(`   ${loadingSteps[stepIndex]}`));
          stepIndex++;
        } else {
          clearInterval(loadingInterval);
        }
      }, 2000);

      child.stdout?.on("data", (data) => {
        const output = data.toString();
        if (output.includes("Finished") || output.includes("success")) {
          clearInterval(loadingInterval);
          console.log(chalk.green("🎉 Writers CLI Rust GUI is ready!"));
        }
      });

      child.stderr?.on("data", (data) => {
        const output = data.toString();
        if (output.includes("error") || output.includes("Error")) {
          console.error(chalk.red(output.trim()));
        }
      });
    } else if (options.development) {
      console.log(chalk.yellow("🔥 Running in development mode..."));
    }

    child.on("error", (error) => {
      console.error(chalk.red("❌ Failed to launch Rust GUI:"), error.message);

      console.log(chalk.yellow("\n💡 Troubleshooting suggestions:"));
      console.log(chalk.yellow("   • Ensure Rust and Cargo are installed"));
      console.log(chalk.yellow("   • Try running: cargo install tauri-cli"));
      console.log(chalk.yellow("   • Check the rust-gui directory exists"));
      console.log(chalk.yellow("   • Run with --debug flag for more information"));
      console.log(chalk.yellow("   • Try the Electron GUI: npm run gui"));

      process.exit(1);
    });

    child.on("close", (code) => {
      if (code !== 0 && !options.quiet) {
        console.error(chalk.red(`❌ Rust GUI process exited with code ${code}`));

        console.log(chalk.yellow("\n💡 Troubleshooting suggestions:"));
        console.log(chalk.yellow("   • Try running with --debug flag"));
        console.log(chalk.yellow("   • Check system requirements"));
        console.log(chalk.yellow("   • Try rebuilding: cd rust-gui && cargo clean && cargo build"));
        console.log(chalk.yellow("   • Fall back to Electron GUI: npm run gui"));
      } else if (code === 0 && !options.quiet) {
        console.log(chalk.green("✅ Writers CLI Rust GUI closed successfully."));
      }
      process.exit(code);
    });

    // Handle termination signals gracefully
    const cleanup = () => {
      console.log(chalk.yellow("\n🛑 Shutting down Writers CLI Rust GUI..."));
      child.kill("SIGTERM");
      setTimeout(() => {
        child.kill("SIGKILL");
      }, 5000);
    };

    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
    process.on("exit", cleanup);

  } catch (error) {
    console.error(chalk.red("❌ Error launching Rust GUI:"), error.message);
    console.log(chalk.yellow("💡 Try running the Electron GUI instead: npm run gui"));
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
${chalk.bold.cyan("Writers CLI Rust GUI Launcher")}

${chalk.bold("Usage:")}
  node rust-gui-launcher.js [options]

${chalk.bold("Options:")}
  -d, --debug         Show debug output and verbose logging
  -q, --quiet         Suppress startup messages and progress
  --dev, --development Run in development mode with hot reload
  -h, --help          Show this help message

${chalk.bold("Examples:")}
  node rust-gui-launcher.js                # Launch production GUI
  node rust-gui-launcher.js --dev          # Launch in development mode
  node rust-gui-launcher.js --debug        # Launch with debug output
  node rust-gui-launcher.js --quiet        # Launch silently

${chalk.bold("Features:")}
  • Rust-powered backend for maximum performance
  • Tauri framework for native GUI experience
  • Cross-platform compatibility (Windows, macOS, Linux)
  • Modern web technologies for the frontend
  • Automatic dependency management and building

${chalk.bold("Requirements:")}
  • Rust and Cargo (install from https://rustup.rs/)
  • Node.js and npm
  • Platform-specific build tools

${chalk.bold("Support:")}
  Report issues: https://github.com/yourusername/writers-cli/issues
  Documentation: https://writers-cli.com/docs/rust-gui
`);
}

// Build script functionality
async function buildRustGUI() {
  console.log(chalk.cyan("🔧 Building Writers CLI Rust GUI..."));

  const rustGuiDir = path.join(__dirname, "rust-gui");

  try {
    const { execSync } = require("child_process");

    console.log(chalk.blue("📦 Installing dependencies..."));
    execSync("cargo fetch", { stdio: "inherit", cwd: rustGuiDir });

    console.log(chalk.blue("🔨 Building application..."));
    execSync("cargo tauri build", { stdio: "inherit", cwd: rustGuiDir });

    console.log(chalk.green("✅ Build completed successfully!"));
    console.log(chalk.yellow("💡 Run the application with: node rust-gui-launcher.js"));

  } catch (error) {
    console.error(chalk.red("❌ Build failed:"), error.message);
    process.exit(1);
  }
}

// Main execution
async function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    return;
  }

  // Check for build command
  if (process.argv.includes("build")) {
    await buildRustGUI();
    return;
  }

  // Show banner
  if (!options.quiet) {
    console.log(chalk.bold.magenta(`
╔══════════════════════════════════════╗
║     Writers CLI - Rust Edition       ║
║      Native Performance Writing      ║
╚══════════════════════════════════════╝
`));
  }

  try {
    await launchRustGUI(options);
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
    launchRustGUI,
    buildRustGUI,
    parseArgs,
    showHelp
  };
}
