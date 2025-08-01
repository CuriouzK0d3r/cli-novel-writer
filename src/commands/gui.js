const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const chalk = require("chalk");
const boxen = require("boxen");

async function guiCommand(options = {}) {
  // Check if enhanced edition is available
  const enhancedLauncherPath = path.join(
    __dirname,
    "..",
    "..",
    "gui-enhanced-launcher.js",
  );
  const useEnhanced = fs.existsSync(enhancedLauncherPath) && !options.classic;

  if (useEnhanced) {
    console.log(chalk.cyan("🚀 Starting Writers CLI Enhanced Edition..."));
  } else {
    console.log(chalk.cyan("🖥️  Starting Writers CLI GUI..."));
  }

  // Show appropriate features info
  if (!options.quiet) {
    const message = useEnhanced
      ? `
${chalk.bold.magenta("Writers CLI Enhanced Edition")}

${chalk.green("✨ Enhanced Features:")}
${chalk.green("•")} Advanced project management with templates
${chalk.green("•")} Multiple theme options (Dark, Light, Sepia, High Contrast)
${chalk.green("•")} Real-time collaboration and version control
${chalk.green("•")} Comprehensive export system (PDF, EPUB, DOCX, HTML)
${chalk.green("•")} Smart writing tools and Pomodoro timer
${chalk.green("•")} Character and plot tracking
${chalk.green("•")} Research notes and timeline management
${chalk.green("•")} Advanced backup and restore system

${chalk.blue("Starting the enhanced interface...")}
`
      : `
${chalk.bold("Writers CLI - Project Interface")}

${chalk.green("✨ Comprehensive GUI Features:")}
${chalk.green("•")} Full project management
${chalk.green("•")} Chapter, scene, and character organization
${chalk.green("•")} Real-time statistics and progress tracking
${chalk.green("•")} Integrated editor with auto-save
${chalk.green("•")} Export functionality
${chalk.green("•")} Project settings management

${chalk.blue("Starting the interface...")}
`;

    console.log(
      boxen(message.trim(), {
        padding: 1,
        margin: 1,
        borderStyle: useEnhanced ? "double" : "round",
        borderColor: useEnhanced ? "magenta" : "blue",
      }),
    );
  }

  // Check if electron is available
  try {
    require.resolve("electron");
  } catch (error) {
    console.error(chalk.red("❌ Electron is not installed."));
    console.log(chalk.yellow("Please run: npm install electron"));
    process.exit(1);
  }

  try {
    if (useEnhanced) {
      // Launch enhanced edition
      const { spawn } = require("child_process");
      const child = spawn(
        "node",
        [
          enhancedLauncherPath,
          ...(options.debug ? ["--debug"] : []),
          ...(options.quiet ? ["--quiet"] : []),
        ],
        {
          stdio: "inherit",
          cwd: path.join(__dirname, "..", ".."),
        },
      );

      child.on("error", (error) => {
        console.error(
          chalk.red("❌ Failed to start Enhanced GUI:"),
          error.message,
        );
        console.log(chalk.yellow("💡 Falling back to classic GUI..."));
        return launchClassicGUI(options);
      });

      child.on("close", (code) => {
        if (code !== 0 && !options.quiet) {
          console.error(
            chalk.red(`❌ Enhanced GUI process exited with code ${code}`),
          );
        }
        process.exit(code);
      });

      return;
    } else {
      return launchClassicGUI(options);
    }
  } catch (error) {
    console.error(chalk.red("❌ Error launching GUI:"), error.message);
    console.log(chalk.yellow("💡 Try running: npm run gui"));
    process.exit(1);
  }
}

async function launchClassicGUI(options = {}) {
  // Check if GUI files exist
  const guiMainPath = path.join(__dirname, "..", "..", "gui", "main.js");
  const guiInterfacePath = path.join(
    __dirname,
    "..",
    "..",
    "gui",
    "project-interface.html",
  );

  if (!fs.existsSync(guiMainPath)) {
    console.error(chalk.red("❌ GUI main file not found."));
    console.log(
      chalk.yellow("Please ensure the gui folder exists with main.js"),
    );
    process.exit(1);
  }

  if (!fs.existsSync(guiInterfacePath)) {
    console.error(chalk.red("❌ GUI interface file not found."));
    console.log(
      chalk.yellow(
        "Please ensure project-interface.html exists in the gui folder",
      ),
    );
    process.exit(1);
  }

  try {
    // Launch Electron with the classic GUI
    const electronPath = require("electron");
    const child = spawn(electronPath, ["--no-sandbox", guiMainPath], {
      stdio: options.debug ? "inherit" : "pipe",
      cwd: path.join(__dirname, "..", ".."),
    });

    if (!options.debug) {
      // Suppress electron output unless in debug mode
      child.stdout?.on("data", () => {});
      child.stderr?.on("data", (data) => {
        const output = data.toString();
        // Only show actual errors, not warnings
        if (output.includes("ERROR") || output.includes("FATAL")) {
          console.error(chalk.red(output));
        }
      });
    }

    child.on("error", (error) => {
      console.error(chalk.red("❌ Failed to start GUI:"), error.message);
      process.exit(1);
    });

    child.on("close", (code) => {
      if (code !== 0 && !options.quiet) {
        console.error(chalk.red(`❌ GUI process exited with code ${code}`));
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
    console.error(chalk.red("❌ Error launching GUI:"), error.message);
    console.log(chalk.yellow("💡 Try running: npm run gui"));
    process.exit(1);
  }
}

module.exports = guiCommand;
