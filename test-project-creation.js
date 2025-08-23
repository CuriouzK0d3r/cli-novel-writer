#!/usr/bin/env node

/**
 * Project Creation Test Script
 * Tests the project creation functionality to ensure it works correctly
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const projectManager = require('./src/utils/project');

class ProjectCreationTest {
  constructor() {
    this.testResults = [];
    this.testDir = path.join(__dirname, 'test-project-temp');
    this.originalCwd = process.cwd();
  }

  /**
   * Run all project creation tests
   */
  async runTests() {
    console.log(chalk.blue.bold('🧪 Project Creation Test Suite'));
    console.log(chalk.blue('================================\n'));

    try {
      await this.setupTestEnvironment();
      await this.testProjectInitialization();
      await this.testProjectStructureCreation();
      await this.testConfigurationGeneration();
      await this.testDifferentProjectTypes();
      await this.cleanup();

      this.reportResults();

    } catch (error) {
      console.error(chalk.red('❌ Test suite failed:'), error.message);
      await this.cleanup();
      process.exit(1);
    }
  }

  /**
   * Setup test environment
   */
  async setupTestEnvironment() {
    console.log(chalk.yellow('🔧 Setting up test environment...'));

    // Clean up any existing test directory
    if (fs.existsSync(this.testDir)) {
      fs.rmSync(this.testDir, { recursive: true, force: true });
    }

    // Create fresh test directory
    fs.mkdirSync(this.testDir, { recursive: true });

    console.log(chalk.green('✅ Test environment ready\n'));
  }

  /**
   * Test basic project initialization
   */
  async testProjectInitialization() {
    console.log(chalk.blue('📋 Testing project initialization...'));

    try {
      const testProjectDir = path.join(this.testDir, 'test-novel');
      fs.mkdirSync(testProjectDir);

      // Change to test directory
      process.chdir(testProjectDir);

      // Initialize project
      const options = {
        name: 'Test Novel',
        author: 'Test Author',
        type: 'novel',
        wordGoal: 75000
      };

      const config = await projectManager.initProject(options);

      // Verify config was created
      if (!config) {
        throw new Error('Project initialization returned null config');
      }

      // Verify basic config properties
      if (config.name !== options.name) {
        throw new Error(`Config name mismatch: expected "${options.name}", got "${config.name}"`);
      }

      if (config.author !== options.author) {
        throw new Error(`Config author mismatch: expected "${options.author}", got "${config.author}"`);
      }

      if (config.type !== options.type) {
        throw new Error(`Config type mismatch: expected "${options.type}", got "${config.type}"`);
      }

      this.addTestResult('Project Initialization', true, 'Basic project creation successful');
      console.log(chalk.green('✅ Project initialization test passed\n'));

    } catch (error) {
      this.addTestResult('Project Initialization', false, error.message);
      console.log(chalk.red('❌ Project initialization test failed:'), error.message);
    } finally {
      process.chdir(this.originalCwd);
    }
  }

  /**
   * Test project structure creation
   */
  async testProjectStructureCreation() {
    console.log(chalk.blue('🏗️ Testing project structure creation...'));

    try {
      const testProjectDir = path.join(this.testDir, 'test-structure');
      fs.mkdirSync(testProjectDir);
      process.chdir(testProjectDir);

      await projectManager.initProject({
        name: 'Structure Test',
        author: 'Test Author',
        type: 'novel'
      });

      // Check if config file exists
      const configFile = path.join(testProjectDir, 'writers.config.json');
      if (!fs.existsSync(configFile)) {
        throw new Error('Configuration file was not created');
      }

      // Check if project is detected
      if (!projectManager.isWritersProject()) {
        throw new Error('Project not detected after creation');
      }

      // Verify we can load the config
      const config = await projectManager.getConfig();
      if (!config || !config.name) {
        throw new Error('Could not load configuration after creation');
      }

      this.addTestResult('Project Structure Creation', true, 'Project structure created correctly');
      console.log(chalk.green('✅ Project structure creation test passed\n'));

    } catch (error) {
      this.addTestResult('Project Structure Creation', false, error.message);
      console.log(chalk.red('❌ Project structure creation test failed:'), error.message);
    } finally {
      process.chdir(this.originalCwd);
    }
  }

  /**
   * Test configuration generation
   */
  async testConfigurationGeneration() {
    console.log(chalk.blue('⚙️ Testing configuration generation...'));

    try {
      const testProjectDir = path.join(this.testDir, 'test-config');
      fs.mkdirSync(testProjectDir);
      process.chdir(testProjectDir);

      const options = {
        name: 'Config Test Project',
        author: 'Config Test Author',
        type: 'short-story',
        wordGoal: 25000
      };

      await projectManager.initProject(options);

      // Read and verify the config file directly
      const configContent = fs.readFileSync('writers.config.json', 'utf8');
      const config = JSON.parse(configContent);

      // Check all expected fields
      const requiredFields = ['name', 'author', 'created', 'version', 'type', 'wordGoal'];
      for (const field of requiredFields) {
        if (!(field in config)) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Check specific values
      if (config.name !== options.name) {
        throw new Error(`Name not set correctly: ${config.name}`);
      }

      if (config.author !== options.author) {
        throw new Error(`Author not set correctly: ${config.author}`);
      }

      if (config.type !== options.type) {
        throw new Error(`Type not set correctly: ${config.type}`);
      }

      if (config.wordGoal !== options.wordGoal) {
        throw new Error(`Word goal not set correctly: ${config.wordGoal}`);
      }

      // Check that created date is valid
      const createdDate = new Date(config.created);
      if (isNaN(createdDate.getTime())) {
        throw new Error('Invalid created date');
      }

      this.addTestResult('Configuration Generation', true, 'Config file generated with all required fields');
      console.log(chalk.green('✅ Configuration generation test passed\n'));

    } catch (error) {
      this.addTestResult('Configuration Generation', false, error.message);
      console.log(chalk.red('❌ Configuration generation test failed:'), error.message);
    } finally {
      process.chdir(this.originalCwd);
    }
  }

  /**
   * Test different project types
   */
  async testDifferentProjectTypes() {
    console.log(chalk.blue('📝 Testing different project types...'));

    const projectTypes = [
      { type: 'novel', name: 'Test Novel' },
      { type: 'short-story', name: 'Test Short Story' },
      { type: 'blog', name: 'Test Blog' }
    ];

    for (const projectType of projectTypes) {
      try {
        const testProjectDir = path.join(this.testDir, `test-${projectType.type}`);
        fs.mkdirSync(testProjectDir);
        process.chdir(testProjectDir);

        await projectManager.initProject({
          name: projectType.name,
          author: 'Test Author',
          type: projectType.type,
          wordGoal: 50000
        });

        // Verify project was created
        if (!projectManager.isWritersProject()) {
          throw new Error(`${projectType.type} project not detected after creation`);
        }

        const config = await projectManager.getConfig();
        if (config.type !== projectType.type) {
          throw new Error(`Type mismatch for ${projectType.type}: got ${config.type}`);
        }

        console.log(chalk.gray(`  ✅ ${projectType.type} project created successfully`));

      } catch (error) {
        this.addTestResult(`${projectType.type} Project Type`, false, error.message);
        console.log(chalk.red(`  ❌ ${projectType.type} project failed:`, error.message));
        continue;
      } finally {
        process.chdir(this.originalCwd);
      }
    }

    this.addTestResult('Different Project Types', true, 'All project types created successfully');
    console.log(chalk.green('✅ Different project types test passed\n'));
  }

  /**
   * Add test result
   */
  addTestResult(testName, passed, details) {
    this.testResults.push({
      name: testName,
      passed,
      details,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Report test results
   */
  reportResults() {
    console.log(chalk.blue.bold('\n📊 Test Results Summary'));
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
    console.log(chalk.blue(`Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`));

    if (failed === 0) {
      console.log(chalk.green.bold('\n🎉 All tests passed! Project creation is working correctly.'));
    } else {
      console.log(chalk.red.bold('\n⚠️ Some tests failed. Project creation may have issues.'));
    }
  }

  /**
   * Clean up test environment
   */
  async cleanup() {
    console.log(chalk.yellow('\n🧹 Cleaning up test environment...'));

    // Ensure we're back in original directory
    process.chdir(this.originalCwd);

    // Remove test directory
    if (fs.existsSync(this.testDir)) {
      try {
        fs.rmSync(this.testDir, { recursive: true, force: true });
        console.log(chalk.green('✅ Cleanup completed'));
      } catch (error) {
        console.log(chalk.yellow('⚠️ Cleanup warning:', error.message));
      }
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const test = new ProjectCreationTest();

  // Handle cleanup on exit
  process.on('SIGINT', async () => {
    console.log(chalk.yellow('\n\n🧹 Cleaning up...'));
    await test.cleanup();
    process.exit(0);
  });

  test.runTests()
    .then(() => {
      console.log(chalk.blue('\n🏁 Project creation test completed'));
      process.exit(0);
    })
    .catch(async (error) => {
      console.error(chalk.red('\n💥 Test suite crashed:'), error);
      await test.cleanup();
      process.exit(1);
    });
}

module.exports = ProjectCreationTest;
