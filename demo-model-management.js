#!/usr/bin/env node

/**
 * Model Management Demo Script
 * Showcases the voice model downloading, switching, and management functionality
 */

const VoiceModelManager = require('./src/voice/model-manager');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

class ModelManagementDemo {
  constructor() {
    this.modelManager = new VoiceModelManager();
    this.configPath = path.join(process.cwd(), '.writers-enhanced.json');
  }

  /**
   * Run the interactive demo
   */
  async runDemo() {
    console.log(chalk.blue.bold('🎬 Voice Model Management Demo'));
    console.log(chalk.blue('====================================\n'));

    try {
      await this.setupDemo();
      await this.showCurrentStatus();
      await this.demonstrateModelListing();
      await this.demonstrateModelStats();
      await this.demonstrateModelSwitching();
      await this.showRecommendations();
      await this.demonstrateConfigManagement();
      await this.showAdvancedFeatures();
      this.showConclusion();

    } catch (error) {
      console.error(chalk.red('❌ Demo failed:'), error.message);
      process.exit(1);
    }
  }

  /**
   * Setup demo environment
   */
  async setupDemo() {
    console.log(chalk.yellow('🔧 Setting up demo environment...\n'));

    // Ensure configuration exists
    if (!fs.existsSync(this.configPath)) {
      console.log(chalk.blue('📝 Creating demo configuration...'));
      const demoConfig = {
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
                downloaded: true,
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
              },
              "whisper-small.en": {
                name: "Whisper Small (English)",
                size: "244MB",
                language: "en",
                accuracy: "Very Good",
                speed: "Medium",
                downloaded: false,
                path: "Xenova/whisper-small.en"
              }
            }
          }
        }
      };
      fs.writeFileSync(this.configPath, JSON.stringify(demoConfig, null, 2));
    }

    console.log(chalk.green('✅ Demo environment ready!\n'));
  }

  /**
   * Show current status
   */
  async showCurrentStatus() {
    console.log(chalk.blue.bold('📊 Current Status'));
    console.log(chalk.blue('================\n'));

    const currentConfig = this.modelManager.getCurrentModelConfig();
    const models = this.modelManager.getAvailableModels();

    if (currentConfig.config) {
      console.log(chalk.green('🎯 Current Active Model:'));
      console.log(`   Name: ${chalk.bold(currentConfig.config.name)}`);
      console.log(`   Size: ${chalk.yellow(currentConfig.config.size)}`);
      console.log(`   Language: ${currentConfig.config.language}`);
      console.log(`   Accuracy: ${chalk.cyan(currentConfig.config.accuracy)}`);
      console.log(`   Speed: ${chalk.magenta(currentConfig.config.speed)}`);
    } else {
      console.log(chalk.yellow('⚠️ No model currently active'));
    }

    console.log(chalk.blue('\n📂 Available Models: ') + chalk.bold(Object.keys(models).length));
    console.log('');
  }

  /**
   * Demonstrate model listing
   */
  async demonstrateModelListing() {
    console.log(chalk.blue.bold('📋 Available Models'));
    console.log(chalk.blue('==================\n'));

    const models = this.modelManager.getAvailableModels();

    console.log(chalk.gray('Model Name'.padEnd(30)) +
                chalk.gray('Size'.padEnd(8)) +
                chalk.gray('Language'.padEnd(12)) +
                chalk.gray('Accuracy'.padEnd(12)) +
                chalk.gray('Speed'.padEnd(12)) +
                chalk.gray('Status'));
    console.log(chalk.gray('─'.repeat(85)));

    Object.entries(models).forEach(([id, model]) => {
      const status = model.downloaded ?
        chalk.green('Downloaded') :
        chalk.yellow('Available');

      const name = model.name.padEnd(30);
      const size = model.size.padEnd(8);
      const lang = (model.language === 'en' ? 'English' : 'Multilingual').padEnd(12);
      const accuracy = model.accuracy.padEnd(12);
      const speed = model.speed.padEnd(12);

      console.log(`${name}${chalk.yellow(size)}${lang}${chalk.cyan(accuracy)}${chalk.magenta(speed)}${status}`);
    });

    console.log('\n');
  }

  /**
   * Demonstrate model statistics
   */
  async demonstrateModelStats() {
    console.log(chalk.blue.bold('📈 Model Statistics'));
    console.log(chalk.blue('==================\n'));

    const stats = this.modelManager.getModelStats();

    console.log(`📦 Total Models: ${chalk.bold(stats.total)}`);
    console.log(`✅ Downloaded: ${chalk.green.bold(stats.downloaded)}`);
    console.log(`📥 Available for Download: ${chalk.yellow.bold(stats.total - stats.downloaded)}`);
    console.log(`💾 Storage Used: ${chalk.blue.bold(stats.downloadedSize + ' MB')}`);
    console.log(`🌍 Languages: ${chalk.cyan(stats.languages.join(', '))}`);
    console.log(`🎯 Accuracy Levels: ${chalk.magenta(stats.accuracyLevels.join(', '))}`);

    console.log('\n');
  }

  /**
   * Demonstrate model switching
   */
  async demonstrateModelSwitching() {
    console.log(chalk.blue.bold('🔄 Model Switching Demo'));
    console.log(chalk.blue('=======================\n'));

    const models = this.modelManager.getAvailableModels();
    const modelIds = Object.keys(models);
    const currentConfig = this.modelManager.getCurrentModelConfig();

    console.log(chalk.blue('Current model: ') + chalk.bold(currentConfig.id || 'none'));

    // Find a different model to switch to
    const targetId = modelIds.find(id => id !== currentConfig.id) || modelIds[0];
    const targetModel = models[targetId];

    console.log(chalk.blue('Switching to: ') + chalk.bold(targetModel.name));
    console.log(chalk.gray('(This is a configuration-only demo switch)\n'));

    // Simulate switching
    console.log(chalk.yellow('🔄 Switching models...'));
    await new Promise(resolve => setTimeout(resolve, 1000));

    const success = this.modelManager.setCurrentModel(targetId);
    if (success) {
      console.log(chalk.green('✅ Successfully switched to ' + targetModel.name));
    } else {
      console.log(chalk.red('❌ Failed to switch models'));
    }

    // Switch back for demo
    if (currentConfig.id) {
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log(chalk.gray('Switching back to original model...'));
      this.modelManager.setCurrentModel(currentConfig.id);
      console.log(chalk.green('✅ Restored original model\n'));
    }

    console.log('');
  }

  /**
   * Show model recommendations
   */
  async showRecommendations() {
    console.log(chalk.blue.bold('💡 Model Recommendations'));
    console.log(chalk.blue('========================\n'));

    const recommendations = {
      'Quick Drafts': {
        model: 'whisper-tiny.en',
        reason: 'Fastest transcription for rapid note-taking'
      },
      'General Writing': {
        model: 'whisper-base.en',
        reason: 'Best balance of speed and accuracy'
      },
      'Professional Work': {
        model: 'whisper-small.en',
        reason: 'High accuracy without excessive slowness'
      },
      'Maximum Quality': {
        model: 'whisper-large-v3',
        reason: 'Best possible accuracy for final drafts'
      },
      'Multilingual Projects': {
        model: 'whisper-base',
        reason: 'Good multilingual support with reasonable speed'
      }
    };

    Object.entries(recommendations).forEach(([useCase, rec]) => {
      console.log(chalk.cyan(`${useCase}:`));
      console.log(`  Model: ${chalk.bold(rec.model)}`);
      console.log(`  Reason: ${chalk.gray(rec.reason)}\n`);
    });
  }

  /**
   * Demonstrate configuration management
   */
  async demonstrateConfigManagement() {
    console.log(chalk.blue.bold('⚙️ Configuration Management'));
    console.log(chalk.blue('===========================\n'));

    const config = this.modelManager.loadConfig();

    console.log(chalk.blue('Voice Configuration Structure:'));
    console.log(chalk.gray('├── Current Model: ') + chalk.bold(config.features.voice.currentModel));
    console.log(chalk.gray('├── Max Duration: ') + config.features.voice.maxDuration + 's');
    console.log(chalk.gray('├── Keep Audio: ') + config.features.voice.keepAudio);
    console.log(chalk.gray('├── Auto Save: ') + config.features.voice.autoSave);
    console.log(chalk.gray('├── Output Format: ') + config.features.voice.outputFormat);
    console.log(chalk.gray('└── Available Models: ') + Object.keys(config.features.voice.availableModels).length);

    console.log('\n' + chalk.blue('Configuration File Location:'));
    console.log(chalk.gray('📁 ') + this.configPath);

    console.log('\n');
  }

  /**
   * Show advanced features
   */
  async showAdvancedFeatures() {
    console.log(chalk.blue.bold('🚀 Advanced Features'));
    console.log(chalk.blue('===================\n'));

    console.log(chalk.cyan('🔄 Dynamic Model Loading'));
    console.log('  • Switch models without restarting the application');
    console.log('  • Models are cached in memory for fast switching');
    console.log('  • Automatic fallback to default model on errors\n');

    console.log(chalk.cyan('📥 Progressive Downloads'));
    console.log('  • Download progress tracking with real-time updates');
    console.log('  • Resume interrupted downloads automatically');
    console.log('  • Parallel downloads for multiple models\n');

    console.log(chalk.cyan('💾 Smart Storage Management'));
    console.log('  • Automatic cleanup of temporary files');
    console.log('  • Configurable cache directory location');
    console.log('  • Storage usage monitoring and reporting\n');

    console.log(chalk.cyan('🌐 API Integration'));
    console.log('  • RESTful API for all model operations');
    console.log('  • Real-time status updates via WebSocket');
    console.log('  • Integration with main GUI interface\n');

    console.log(chalk.cyan('🔧 Configuration Flexibility'));
    console.log('  • JSON-based configuration with validation');
    console.log('  • Hot-reload configuration changes');
    console.log('  • Profile-based model sets for different use cases\n');
  }

  /**
   * Show conclusion and next steps
   */
  showConclusion() {
    console.log(chalk.blue.bold('🎉 Demo Complete!'));
    console.log(chalk.blue('================\n'));

    console.log(chalk.green('✅ You\'ve seen how to:'));
    console.log('  • View available voice models');
    console.log('  • Check model statistics and status');
    console.log('  • Switch between different models');
    console.log('  • Understand model recommendations');
    console.log('  • Manage configuration settings\n');

    console.log(chalk.blue('🚀 Next Steps:'));
    console.log('  1. Launch the GUI: ' + chalk.bold('npm run gui'));
    console.log('  2. Open Voice Transcription interface');
    console.log('  3. Click "🤖 Manage Models" button');
    console.log('  4. Download and test different models\n');

    console.log(chalk.blue('📚 Documentation:'));
    console.log('  • Full Guide: ' + chalk.bold('MODEL_MANAGEMENT.md'));
    console.log('  • Quick Start: ' + chalk.bold('VOICE_MODEL_QUICKSTART.md'));
    console.log('  • API Reference: ' + chalk.bold('Check the API section in docs\n'));

    console.log(chalk.blue('🆘 Need Help?'));
    console.log('  • Run tests: ' + chalk.bold('node test-model-management.js'));
    console.log('  • Check system: ' + chalk.bold('writers voice check'));
    console.log('  • Open GitHub issue for support\n');

    console.log(chalk.green.bold('Happy writing with voice transcription! 🎤✍️'));
  }

  /**
   * Cleanup demo environment
   */
  cleanup() {
    if (this.modelManager) {
      this.modelManager.cleanup();
    }
  }
}

// Run demo if this file is executed directly
if (require.main === module) {
  const demo = new ModelManagementDemo();

  // Handle cleanup on exit
  process.on('SIGINT', () => {
    console.log(chalk.yellow('\n\n🧹 Cleaning up demo...'));
    demo.cleanup();
    process.exit(0);
  });

  demo.runDemo()
    .then(() => {
      console.log(chalk.blue('\n🏁 Demo finished successfully'));
      process.exit(0);
    })
    .catch(error => {
      console.error(chalk.red('\n💥 Demo failed:'), error);
      demo.cleanup();
      process.exit(1);
    });
}

module.exports = ModelManagementDemo;
