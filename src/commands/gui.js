const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const chalk = require("chalk");

async function guiCommand() {
  console.log(chalk.cyan("🖥️  Starting Writers CLI GUI..."));

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
  if (!fs.existsSync(guiMainPath)) {
    console.error(chalk.red("❌ GUI files not found."));
    console.log(
      chalk.yellow("Please ensure the gui folder exists with main.js"),
    );
    process.exit(1);
  }

  try {
    // Launch Electron with the GUI
    const electronPath = require("electron");
    const child = spawn(electronPath, ["--no-sandbox", guiMainPath], {
      stdio: "inherit",
      cwd: path.join(__dirname, "..", ".."),
    });

    child.on("error", (error) => {
      console.error(chalk.red("❌ Failed to start GUI:"), error.message);
      process.exit(1);
    });

    child.on("close", (code) => {
      if (code !== 0) {
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
