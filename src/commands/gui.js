const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const chalk = require("chalk");
const boxen = require("boxen");

async function guiCommand(options = {}) {
  console.log(chalk.cyan("🖥️  Starting Writers CLI GUI..."));

  // Show GUI features info
  if (!options.quiet) {
    const message = `
${chalk.bold("Writers CLI - Project Interface")}

${chalk.green("✨ New Comprehensive GUI Features:")}
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
        borderStyle: "round",
        borderColor: "blue",
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
    // Launch Electron with the GUI
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
