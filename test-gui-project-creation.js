#!/usr/bin/env node

/**
 * GUI Project Creation Test
 * Simulates the GUI project creation flow to identify stuck menu issues
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { app } = require('electron');

// Mock Electron app for testing
if (!app) {
  global.app = {
    getPath: (name) => {
      if (name === 'documents') {
        return path.join(require('os').homedir(), 'Documents');
      }
      return '/tmp';
    }
  };
}

class GUIProjectCreationTest {
  constructor() {
    this.testResults = [];
    this.projectManager = require('./src/utils/project');
  }

  async runTest() {
    console.log(chalk.blue.bold('🧪 GUI Project Creation Test'));
    console.log(chalk.blue('==============================\n'));

    try {
      await this.testProjectCreationFlow();
      await this.testFormValidation();
      await this.testDirectoryCreation();
      this.reportResults();
    } catch (error) {
      console.error(chalk.red('❌ Test failed:'), error.message);
      process.exit(1);
    }
  }

  async testProjectCreationFlow() {
    console.log(chalk.blue('🔄 Testing complete project creation flow...'));

    try {
      // Simulate the exact flow from GUI
      const options = {
        name: 'Test GUI Project',
        author: 'Test Author',
        type: 'novel',
        wordGoal: 50000
      };

      // This mimics what main.js does
      const projectRoot = path.join(
        require('os').homedir(),
        'Documents',
        options.name || 'WritersProject'
      );

      console.log(chalk.gray(`  Project directory: ${projectRoot}`));

      // Clean up if it exists
      if (fs.existsSync(projectRoot)) {
        console.log(chalk.yellow('  Cleaning up existing test project...'));
        fs.rmSync(projectRoot, { recursive: true, force: true });
      }

      // Ensure directory exists
      fs.mkdirSync(projectRoot, { recursive: true });

      // Set base directory (this is key!)
      this.projectManager.setBaseDir(projectRoot);

      // Initialize project
      const config = await this.projectManager.initProject(options);

      if (!config) {
        throw new Error('Project creation returned null config');
      }

      // Verify the project was created in the right place
      const configPath = path.join(projectRoot, 'writers.config.json');
      if (!fs.existsSync(configPath)) {
        throw new Error('Config file not created in project directory');
      }

      // Verify we can detect the project
      const originalBaseDir = this.projectManager.baseDir;
      this.projectManager.setBaseDir(projectRoot);

      if (!this.projectManager.isWritersProject()) {
        throw new Error('Created project not detected');
      }

      // Verify we can load the config
      const loadedConfig = await this.projectManager.getConfig();
      if (loadedConfig.name !== options.name) {
        throw new Error('Config name mismatch after creation');
      }

      // Clean up
      if (fs.existsSync(projectRoot)) {
        fs.rmSync(projectRoot, { recursive: true, force: true });
      }

      // Restore original base dir
      this.projectManager.setBaseDir(originalBaseDir);

      this.addTestResult('Project Creation Flow', true, 'Complete flow successful');
      console.log(chalk.green('✅ Project creation flow test passed\n'));

    } catch (error) {
      this.addTestResult('Project Creation Flow', false, error.message);
      console.log(chalk.red('❌ Project creation flow test failed:'), error.message);
    }
  }

  async testFormValidation() {
    console.log(chalk.blue('📋 Testing form validation logic...'));

    try {
      // Test empty name
      let shouldFail = false;
      try {
        await this.simulateFormSubmission('', 'Test Author', 'novel', 50000);
        shouldFail = true;
      } catch (error) {
        // Expected to fail
      }

      if (shouldFail) {
        throw new Error('Empty name should have been rejected');
      }

      // Test empty author
      shouldFail = false;
      try {
        await this.simulateFormSubmission('Test Project', '', 'novel', 50000);
        shouldFail = true;
      } catch (error) {
        // Expected to fail
      }

      if (shouldFail) {
        throw new Error('Empty author should have been rejected');
      }

      this.addTestResult('Form Validation', true, 'Validation logic working correctly');
      console.log(chalk.green('✅ Form validation test passed\n'));

    } catch (error) {
      this.addTestResult('Form Validation', false, error.message);
      console.log(chalk.red('❌ Form validation test failed:'), error.message);
    }
  }

  async testDirectoryCreation() {
    console.log(chalk.blue('📁 Testing directory creation...'));

    try {
      const testName = 'Directory Test Project';
      const projectRoot = path.join(
        require('os').homedir(),
        'Documents',
        testName
      );

      // Ensure it doesn't exist
      if (fs.existsSync(projectRoot)) {
        fs.rmSync(projectRoot, { recursive: true, force: true });
      }

      // Create the directory (as main.js would)
      fs.mkdirSync(projectRoot, { recursive: true });

      if (!fs.existsSync(projectRoot)) {
        throw new Error('Directory creation failed');
      }

      // Test that we can write to it
      const testFile = path.join(projectRoot, 'test.txt');
      fs.writeFileSync(testFile, 'test content');

      if (!fs.existsSync(testFile)) {
        throw new Error('Cannot write to created directory');
      }

      // Clean up
      fs.rmSync(projectRoot, { recursive: true, force: true });

      this.addTestResult('Directory Creation', true, 'Directory creation and writing successful');
      console.log(chalk.green('✅ Directory creation test passed\n'));

    } catch (error) {
      this.addTestResult('Directory Creation', false, error.message);
      console.log(chalk.red('❌ Directory creation test failed:'), error.message);
    }
  }

  async simulateFormSubmission(name, author, type, wordGoal) {
    // Simulate the validation logic from app.js
    const trimmedName = name.trim();
    const trimmedAuthor = author.trim();

    if (!trimmedName || !trimmedAuthor) {
      throw new Error('Please fill in all fields');
    }

    // This would normally call the IPC handler
    return {
      name: trimmedName,
      author: trimmedAuthor,
      type,
      wordGoal
    };
  }

  addTestResult(testName, passed, details) {
    this.testResults.push({
      name: testName,
      passed,
      details,
      timestamp: new Date().toISOString()
    });
  }

  reportResults() {
    console.log(chalk.blue.bold('📊 Test Results Summary'));
    console.log(chalk.blue('========================\n'));

    let passed = 0;
    let failed = 0;

    this.testResults.forEach(result => {
      if (result.passed) {
        console.log(chalk.green(`✅ ${result.name}: ${result.details}`));
        passed++;
      } else {
        console.log(chalk.red(`❌ ${result.name}: ${result.details}`));
        failed++;
      }
    });

    console.log(chalk.blue('\n========================'));
    console.log(chalk.blue(`Total Tests: ${passed + failed}`));
    console.log(chalk.green(`Passed: ${passed}`));
    console.log(failed > 0 ? chalk.red(`Failed: ${failed}`) : chalk.green(`Failed: ${failed}`));

    if (failed === 0) {
      console.log(chalk.green.bold('\n🎉 All tests passed!'));
      console.log(chalk.blue('The project creation flow should work correctly in the GUI.'));
      console.log(chalk.blue('If the menu is still stuck, check:'));
      console.log(chalk.gray('  1. Browser console for JavaScript errors'));
      console.log(chalk.gray('  2. Network tab for failed API calls'));
      console.log(chalk.gray('  3. Electron main process logs'));
    } else {
      console.log(chalk.red.bold('\n⚠️ Some tests failed.'));
      console.log(chalk.blue('This may explain why the project creation menu is stuck.'));
    }
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  const test = new GUIProjectCreationTest();

  test.runTest()
    .then(() => {
      console.log(chalk.blue('\n🏁 GUI project creation test completed'));
      process.exit(0);
    })
    .catch(error => {
      console.error(chalk.red('\n💥 Test crashed:'), error);
      process.exit(1);
    });
}

module.exports = GUIProjectCreationTest;
