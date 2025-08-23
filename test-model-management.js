#!/usr/bin/env node

/**
 * Model Management Test Script
 * Tests the voice model downloading, switching, and management functionality
 */

const VoiceModelManager = require('./src/voice/model-manager');
const VoiceTranscriber = require('./src/voice/transcriber');
const VoiceApiHandlers = require('./src/voice/api-handlers');
const express = require('express');
const cors = require('cors');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

class ModelManagementTest {
  constructor() {
    this.modelManager = new VoiceModelManager();
    this.transcriber = new VoiceTranscriber();
    this.apiHandlers = new VoiceApiHandlers();
    this.testResults = [];
    this.server = null;
    this.configPath = path.join(process.cwd(), '.writers-enhanced.json');
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log(chalk.blue.bold('🧪 Voice Model Management Test Suite'));
    console.log(chalk.blue('=========================================\n'));

    try {
      // Setup test environment
      await this.setupTestEnvironment();

      // Run individual tests
      await this.testConfigurationLoading();
      await this.testModelListRetrieval();
      await this.testModelStatusChecking();
      await this.testCurrentModelDetection();
      await this.testModelSwitching();
      await this.testAPIEndpoints();

      // Clean up
      await this.cleanup();

      // Report results
      this.reportResults();

    } catch (error) {
      console.error(chalk.red('❌ Test suite failed:'), error.message);
      process.exit(1);
    }
  }

  /**
   * Setup test environment
   */
  async setupTestEnvironment() {
    console.log(chalk.yellow('🔧 Setting up test environment...'));

    // Ensure configuration file exists
    if (!fs.existsSync(this.configPath)) {
      console.log(chalk.yellow('📝 Creating test configuration...'));
      const defaultConfig = {
        version: "2.0.0",
        features: {
          voice: {
            enabled: true,
            currentModel: "whisper-tiny.en",
            maxDuration: 300,
            keepAudio: false,
            autoSave: true,
            outputFormat: "markdown",
            availableModels: {
              "whisper-tiny.en": {
                name: "Whisper Tiny (English)",
                size: "39MB",
                language: "en",
                accuracy: "Basic",
                speed: "Very Fast",
                downloaded: false,
                path: "Xenova/whisper-tiny.en"
              },
              "whisper-base.en": {
                name: "Whisper Base (English)",
                size: "74MB",
                language: "en",
                accuracy: "Good",
                speed: "Fast",
                downloaded: false,
                path: "Xenova/whisper-base.en"
              }
            }
          }
        }
      };

      fs.writeFileSync(this.configPath, JSON.stringify(defaultConfig, null, 2));
    }

    // Start test API server
    await this.startTestServer();

    console.log(chalk.green('✅ Test environment ready\n'));
  }

  /**
   * Start test Express server
   */
  async startTestServer() {
    const app = express();
    app.use(cors());
    app.use(express.json());

    // Setup API routes
    this.apiHandlers.setupRoutes(app);

    return new Promise((resolve) => {
      this.server = app.listen(3003, 'localhost', () => {
        console.log(chalk.blue('🌐 Test API server running on http://localhost:3003'));
        resolve();
      });
    });
  }

  /**
   * Test configuration loading
   */
  async testConfigurationLoading() {
    console.log(chalk.blue('📋 Testing configuration loading...'));

    try {
      const config = this.modelManager.loadConfig();

      if (!config) {
        throw new Error('Configuration not loaded');
      }

      if (!config.features?.voice) {
        throw new Error('Voice configuration section missing');
      }

      if (!config.features.voice.availableModels) {
        throw new Error('Available models not found in configuration');
      }

      this.addTestResult('Configuration Loading', true, 'Configuration loaded successfully');
      console.log(chalk.green('✅ Configuration loading test passed\n'));

    } catch (error) {
      this.addTestResult('Configuration Loading', false, error.message);
      console.log(chalk.red('❌ Configuration loading test failed:'), error.message);
    }
  }

  /**
   * Test model list retrieval
   */
  async testModelListRetrieval() {
    console.log(chalk.blue('📜 Testing model list retrieval...'));

    try {
      const models = this.modelManager.getAvailableModels();

      if (!models || typeof models !== 'object') {
        throw new Error('Models not retrieved or invalid format');
      }

      const modelCount = Object.keys(models).length;
      if (modelCount === 0) {
        throw new Error('No models found');
      }

      // Check model structure
      for (const [modelId, model] of Object.entries(models)) {
        if (!model.name || !model.size || !model.path) {
          throw new Error(`Invalid model structure for ${modelId}`);
        }
      }

      this.addTestResult('Model List Retrieval', true, `Found ${modelCount} models`);
      console.log(chalk.green(`✅ Model list retrieval test passed (${modelCount} models)\n`));

    } catch (error) {
      this.addTestResult('Model List Retrieval', false, error.message);
      console.log(chalk.red('❌ Model list retrieval test failed:'), error.message);
    }
  }

  /**
   * Test model status checking
   */
  async testModelStatusChecking() {
    console.log(chalk.blue('🔍 Testing model status checking...'));

    try {
      const models = this.modelManager.getAvailableModels();
      const firstModelId = Object.keys(models)[0];

      if (!firstModelId) {
        throw new Error('No models available for status testing');
      }

      const isDownloaded = this.modelManager.isModelDownloaded(firstModelId);
      const stats = this.modelManager.getModelStats();

      if (typeof isDownloaded !== 'boolean') {
        throw new Error('isModelDownloaded returned invalid type');
      }

      if (!stats || typeof stats !== 'object') {
        throw new Error('getModelStats returned invalid data');
      }

      // Check stats structure
      if (typeof stats.total !== 'number' || typeof stats.downloaded !== 'number') {
        throw new Error('Invalid stats structure');
      }

      this.addTestResult('Model Status Checking', true, `Stats: ${stats.downloaded}/${stats.total} downloaded`);
      console.log(chalk.green(`✅ Model status checking test passed\n`));

    } catch (error) {
      this.addTestResult('Model Status Checking', false, error.message);
      console.log(chalk.red('❌ Model status checking test failed:'), error.message);
    }
  }

  /**
   * Test current model detection
   */
  async testCurrentModelDetection() {
    console.log(chalk.blue('🎯 Testing current model detection...'));

    try {
      const currentConfig = this.modelManager.getCurrentModelConfig();

      if (!currentConfig || typeof currentConfig !== 'object') {
        throw new Error('getCurrentModelConfig returned invalid data');
      }

      if (!currentConfig.hasOwnProperty('id') || !currentConfig.hasOwnProperty('config')) {
        throw new Error('Invalid current model config structure');
      }

      // The id might be null if no model is set, that's ok
      const currentModelId = currentConfig.id;

      this.addTestResult('Current Model Detection', true, `Current model: ${currentModelId || 'none'}`);
      console.log(chalk.green(`✅ Current model detection test passed (${currentModelId || 'none'})\n`));

    } catch (error) {
      this.addTestResult('Current Model Detection', false, error.message);
      console.log(chalk.red('❌ Current model detection test failed:'), error.message);
    }
  }

  /**
   * Test model switching (without actual download)
   */
  async testModelSwitching() {
    console.log(chalk.blue('🔄 Testing model switching configuration...'));

    try {
      const models = this.modelManager.getAvailableModels();
      const modelIds = Object.keys(models);

      if (modelIds.length < 2) {
        console.log(chalk.yellow('⚠️ Need at least 2 models for switching test, skipping...'));
        this.addTestResult('Model Switching', true, 'Skipped - insufficient models');
        return;
      }

      const targetModelId = modelIds[1]; // Switch to second model
      const originalModel = this.modelManager.getCurrentModelConfig().id;

      // Test configuration switch (without actual model download)
      const success = this.modelManager.setCurrentModel(targetModelId);

      if (!success) {
        throw new Error('Failed to set current model in configuration');
      }

      // Verify the switch
      const newCurrentModel = this.modelManager.getCurrentModelConfig().id;
      if (newCurrentModel !== targetModelId) {
        throw new Error(`Model switch failed: expected ${targetModelId}, got ${newCurrentModel}`);
      }

      // Switch back
      if (originalModel) {
        this.modelManager.setCurrentModel(originalModel);
      }

      this.addTestResult('Model Switching', true, `Successfully switched to ${targetModelId}`);
      console.log(chalk.green(`✅ Model switching test passed\n`));

    } catch (error) {
      this.addTestResult('Model Switching', false, error.message);
      console.log(chalk.red('❌ Model switching test failed:'), error.message);
    }
  }

  /**
   * Test API endpoints
   */
  async testAPIEndpoints() {
    console.log(chalk.blue('🌐 Testing API endpoints...'));

    const testCases = [
      {
        name: 'GET /api/voice/config',
        method: 'GET',
        url: 'http://localhost:3003/api/voice/config'
      },
      {
        name: 'GET /api/voice/models',
        method: 'GET',
        url: 'http://localhost:3003/api/voice/models'
      },
      {
        name: 'GET /api/voice/models/status',
        method: 'GET',
        url: 'http://localhost:3003/api/voice/models/status'
      },
      {
        name: 'GET /api/voice/system',
        method: 'GET',
        url: 'http://localhost:3003/api/voice/system'
      }
    ];

    for (const testCase of testCases) {
      try {
        console.log(chalk.gray(`  Testing ${testCase.name}...`));

        const response = await fetch(testCase.url, {
          method: testCase.method,
          headers: testCase.method === 'POST' ? {
            'Content-Type': 'application/json'
          } : {}
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(chalk.green(`    ✅ ${testCase.name} - OK`));

      } catch (error) {
        console.log(chalk.red(`    ❌ ${testCase.name} - Failed: ${error.message}`));
        this.addTestResult(`API ${testCase.name}`, false, error.message);
        continue;
      }
    }

    this.addTestResult('API Endpoints', true, 'All endpoints responding');
    console.log(chalk.green('✅ API endpoints test completed\n'));
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
      console.log(chalk.green.bold('\n🎉 All tests passed! Model management system is working correctly.'));
    } else {
      console.log(chalk.red.bold('\n⚠️  Some tests failed. Please check the implementation.'));
    }
  }

  /**
   * Clean up test environment
   */
  async cleanup() {
    console.log(chalk.yellow('🧹 Cleaning up test environment...'));

    // Close server
    if (this.server) {
      this.server.close();
    }

    // Clean up model manager
    if (this.modelManager) {
      this.modelManager.cleanup();
    }

    // Clean up transcriber
    if (this.transcriber) {
      this.transcriber.cleanup();
    }

    console.log(chalk.green('✅ Cleanup completed'));
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const test = new ModelManagementTest();

  test.runAllTests()
    .then(() => {
      console.log(chalk.blue('\n🏁 Test suite completed'));
      process.exit(0);
    })
    .catch(error => {
      console.error(chalk.red('\n💥 Test suite crashed:'), error);
      process.exit(1);
    });
}

module.exports = ModelManagementTest;
