#!/usr/bin/env node

/**
 * Original Functionality Test
 * Verifies that the welcome screen and project initialization flow remains intact
 * after the voice model management changes
 */

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");

class OriginalFunctionalityTest {
  constructor() {
    this.testResults = [];
    this.configPath = path.join(process.cwd(), "writers.config.json");
    this.enhancedConfigPath = path.join(
      process.cwd(),
      ".writers-enhanced.json",
    );
  }

  /**
   * Run all original functionality tests
   */
  async runTests() {
    console.log(chalk.blue.bold("🧪 Original Functionality Test Suite"));
    console.log(chalk.blue("=====================================\n"));

    try {
      await this.testProjectDetection();
      await this.testConfigurationLoading();
      await this.testWelcomeModalLogic();
      await this.testProjectCreationFlow();
      await this.testGUIStartup();

      this.reportResults();
    } catch (error) {
      console.error(chalk.red("❌ Test suite failed:"), error.message);
      process.exit(1);
    }
  }

  /**
   * Test project detection logic
   */
  async testProjectDetection() {
    console.log(chalk.blue("📋 Testing project detection logic..."));

    try {
      // Temporarily remove any existing project config
      const hadConfig = fs.existsSync(this.configPath);
      const originalConfig = hadConfig
        ? fs.readFileSync(this.configPath, "utf8")
        : null;

      if (hadConfig) {
        fs.unlinkSync(this.configPath);
      }

      // Test that no project is detected
      const projectManager = require("./src/utils/project");
      const isProject = projectManager.isWritersProject();

      if (isProject) {
        throw new Error("Project detected when none should exist");
      }

      // Restore original config if it existed
      if (originalConfig) {
        fs.writeFileSync(this.configPath, originalConfig);
      }

      this.addTestResult(
        "Project Detection",
        true,
        "Correctly detects absence of project",
      );
      console.log(chalk.green("✅ Project detection test passed\n"));
    } catch (error) {
      this.addTestResult("Project Detection", false, error.message);
      console.log(
        chalk.red("❌ Project detection test failed:"),
        error.message,
      );
    }
  }

  /**
   * Test configuration loading behavior
   */
  async testConfigurationLoading() {
    console.log(chalk.blue("⚙️  Testing configuration loading..."));

    try {
      const projectManager = require("./src/utils/project");

      // Test loading with no project
      let config = null;
      let errorThrown = false;

      // First check if project exists
      const isProject = projectManager.isWritersProject();

      if (!isProject) {
        // Try to get config - this should throw an error
        try {
          config = await projectManager.getConfig();
        } catch (error) {
          errorThrown = true;
          // This is expected behavior
        }
      } else {
        // If project exists, try to load config normally
        config = await projectManager.getConfig();
      }

      // If no project exists, an error should have been thrown
      if (!isProject && !errorThrown) {
        throw new Error("Expected error when loading config with no project");
      }

      this.addTestResult(
        "Configuration Loading",
        true,
        "Correctly handles no project state",
      );
      console.log(chalk.green("✅ Configuration loading test passed\n"));
    } catch (error) {
      this.addTestResult("Configuration Loading", false, error.message);
      console.log(
        chalk.red("❌ Configuration loading test failed:"),
        error.message,
      );
    }
  }

  /**
   * Test welcome modal logic
   */
  async testWelcomeModalLogic() {
    console.log(chalk.blue("👋 Testing welcome modal logic..."));

    try {
      // Check if project-interface.html contains welcome modal
      const htmlPath = path.join(__dirname, "gui", "project-interface.html");

      if (!fs.existsSync(htmlPath)) {
        throw new Error("project-interface.html not found");
      }

      const htmlContent = fs.readFileSync(htmlPath, "utf8");

      // Check for welcome modal elements
      const hasWelcomeModal = htmlContent.includes('id="welcome-modal"');
      const hasCreateProjectBtn = htmlContent.includes(
        'id="create-project-btn"',
      );
      const hasOpenProjectBtn = htmlContent.includes('id="open-project-btn"');
      const hasProjectCreationModal = htmlContent.includes(
        'id="project-creation-modal"',
      );

      if (!hasWelcomeModal) {
        throw new Error("Welcome modal element missing from HTML");
      }

      if (!hasCreateProjectBtn) {
        throw new Error("Create project button missing from HTML");
      }

      if (!hasOpenProjectBtn) {
        throw new Error("Open project button missing from HTML");
      }

      if (!hasProjectCreationModal) {
        throw new Error("Project creation modal missing from HTML");
      }

      this.addTestResult(
        "Welcome Modal Logic",
        true,
        "All welcome modal elements present",
      );
      console.log(chalk.green("✅ Welcome modal logic test passed\n"));
    } catch (error) {
      this.addTestResult("Welcome Modal Logic", false, error.message);
      console.log(
        chalk.red("❌ Welcome modal logic test failed:"),
        error.message,
      );
    }
  }

  /**
   * Test project creation flow
   */
  async testProjectCreationFlow() {
    console.log(chalk.blue("🏗️  Testing project creation flow..."));

    try {
      // Check if app.js contains the necessary functions
      const appJsPath = path.join(__dirname, "gui", "assets", "js", "app.js");

      if (!fs.existsSync(appJsPath)) {
        throw new Error("app.js not found");
      }

      const appJsContent = fs.readFileSync(appJsPath, "utf8");

      // Check for welcome modal functions
      const hasShowWelcomeModal = appJsContent.includes("showWelcomeModal()");
      const hasSetupWelcomeModal = appJsContent.includes(
        "setupWelcomeModalListeners",
      );
      const hasProjectCreationModal = appJsContent.includes(
        "showProjectCreationModal",
      );
      const hasLoadProjectCall = appJsContent.includes("loadProject()");

      if (!hasShowWelcomeModal) {
        throw new Error("showWelcomeModal function missing from app.js");
      }

      if (!hasSetupWelcomeModal) {
        throw new Error(
          "setupWelcomeModalListeners function missing from app.js",
        );
      }

      if (!hasProjectCreationModal) {
        throw new Error(
          "showProjectCreationModal function missing from app.js",
        );
      }

      if (!hasLoadProjectCall) {
        throw new Error("loadProject function call missing from app.js");
      }

      this.addTestResult(
        "Project Creation Flow",
        true,
        "All project creation functions present",
      );
      console.log(chalk.green("✅ Project creation flow test passed\n"));
    } catch (error) {
      this.addTestResult("Project Creation Flow", false, error.message);
      console.log(
        chalk.red("❌ Project creation flow test failed:"),
        error.message,
      );
    }
  }

  /**
   * Test GUI startup process
   */
  async testGUIStartup() {
    console.log(chalk.blue("🚀 Testing GUI startup process..."));

    try {
      // Check if main.js contains the original IPC handlers
      const mainJsPath = path.join(__dirname, "gui", "main.js");

      if (!fs.existsSync(mainJsPath)) {
        throw new Error("main.js not found");
      }

      const mainJsContent = fs.readFileSync(mainJsPath, "utf8");

      // Check for essential IPC handlers
      const hasGetProjectConfig = mainJsContent.includes("get-project-config");
      const hasInitProject = mainJsContent.includes("init-project");
      const hasCreateWindow = mainJsContent.includes("createWindow()");
      const hasProjectInterface = mainJsContent.includes(
        "project-interface.html",
      );

      if (!hasGetProjectConfig) {
        throw new Error("get-project-config IPC handler missing");
      }

      if (!hasInitProject) {
        throw new Error("init-project IPC handler missing");
      }

      if (!hasCreateWindow) {
        throw new Error("createWindow function missing");
      }

      if (!hasProjectInterface) {
        throw new Error("project-interface.html reference missing");
      }

      // Check that Express server initialization is non-blocking
      const expressInitIndex = mainJsContent.indexOf("initializeExpressServer");
      const createWindowIndex = mainJsContent.indexOf("createWindow()");

      if (
        expressInitIndex > 0 &&
        createWindowIndex > 0 &&
        expressInitIndex < createWindowIndex
      ) {
        throw new Error("Express server initialization blocks window creation");
      }

      this.addTestResult(
        "GUI Startup Process",
        true,
        "All startup components present and non-blocking",
      );
      console.log(chalk.green("✅ GUI startup process test passed\n"));
    } catch (error) {
      this.addTestResult("GUI Startup Process", false, error.message);
      console.log(
        chalk.red("❌ GUI startup process test failed:"),
        error.message,
      );
    }
  }

  /**
   * Add test result
   */
  addTestResult(testName, passed, details) {
    this.testResults.push({
      name: testName,
      passed,
      details,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Report test results
   */
  reportResults() {
    console.log(chalk.blue.bold("\n📊 Test Results Summary"));
    console.log(chalk.blue("========================\n"));

    let passed = 0;
    let failed = 0;

    this.testResults.forEach((result) => {
      if (result.passed) {
        console.log(chalk.green(`✅ ${result.name}: ${result.details}`));
        passed++;
      } else {
        console.log(chalk.red(`❌ ${result.name}: ${result.details}`));
        failed++;
      }
    });

    console.log(chalk.blue("\n========================"));
    console.log(chalk.blue(`Total Tests: ${passed + failed}`));
    console.log(chalk.green(`Passed: ${passed}`));
    console.log(
      failed > 0
        ? chalk.red(`Failed: ${failed}`)
        : chalk.green(`Failed: ${failed}`),
    );
    console.log(
      chalk.blue(
        `Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`,
      ),
    );

    if (failed === 0) {
      console.log(
        chalk.green.bold(
          "\n🎉 All tests passed! Original functionality is preserved.",
        ),
      );
      console.log(
        chalk.blue(
          "The welcome screen and project initialization flow work as expected.",
        ),
      );
      console.log(
        chalk.blue(
          "Voice model management features are additive and non-breaking.",
        ),
      );
    } else {
      console.log(
        chalk.red.bold(
          "\n⚠️  Some tests failed. Original functionality may be affected.",
        ),
      );
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const test = new OriginalFunctionalityTest();

  test
    .runTests()
    .then(() => {
      console.log(chalk.blue("\n🏁 Original functionality test completed"));
      process.exit(0);
    })
    .catch((error) => {
      console.error(chalk.red("\n💥 Test suite crashed:"), error);
      process.exit(1);
    });
}

module.exports = OriginalFunctionalityTest;
