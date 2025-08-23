#!/usr/bin/env node

const VoiceTranscriber = require('./src/voice/transcriber');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs');

class VoiceDemo {
  constructor() {
    this.transcriber = new VoiceTranscriber();
  }

  async runDemo() {
    console.log(chalk.bold.cyan('\n🎤 Writers CLI - Voice Transcription Demo\n'));

    try {
      // System check
      console.log(chalk.blue('1. Checking system compatibility...'));
      const check = await this.transcriber.checkDependencies();

      if (check.isReady) {
        console.log(chalk.green('   ✅ System is ready for voice transcription'));
      } else {
        console.log(chalk.yellow('   ⚠️  System has some limitations:'));
        check.issues.forEach(issue => {
          console.log(chalk.yellow(`      • ${issue}`));
        });
      }

      // Initialize Whisper model
      console.log(chalk.blue('\n2. Initializing Whisper model...'));
      await this.transcriber.initialize();
      console.log(chalk.green('   ✅ Whisper model loaded successfully'));

      // Show supported formats
      const formats = this.transcriber.getSupportedFormats();
      console.log(chalk.blue('\n3. Supported audio formats:'));
      console.log(chalk.gray(`   ${formats.join(', ')}`));

      // Demo menu
      await this.showDemoMenu();

    } catch (error) {
      console.error(chalk.red('\n❌ Demo failed:'), error.message);
      console.log(chalk.yellow('\nTroubleshooting tips:'));
      console.log('• Make sure you have a working microphone');
      console.log('• Check your internet connection for initial model download');
      console.log('• Try running: npm install --save @xenova/transformers');
    } finally {
      this.transcriber.cleanup();
    }
  }

  async showDemoMenu() {
    const inquirer = require('inquirer');

    console.log(chalk.bold.cyan('\n📋 Demo Menu\n'));

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to demo?',
        choices: [
          { name: '🎤 Record 10-second voice note', value: 'record' },
          { name: '📁 Transcribe sample audio file', value: 'sample' },
          { name: '🔄 Live transcription demo', value: 'live' },
          { name: '🧪 Test transcription accuracy', value: 'accuracy' },
          { name: '❌ Exit', value: 'exit' }
        ]
      }
    ]);

    switch (action) {
      case 'record':
        await this.demoRecording();
        break;
      case 'sample':
        await this.demoSampleFile();
        break;
      case 'live':
        await this.demoLiveTranscription();
        break;
      case 'accuracy':
        await this.demoAccuracyTest();
        break;
      case 'exit':
        console.log(chalk.yellow('Demo ended. Thanks for trying Writers CLI voice transcription!'));
        return;
    }

    // Show menu again
    await this.showDemoMenu();
  }

  async demoRecording() {
    console.log(chalk.blue('\n🎤 Recording Demo'));
    console.log(chalk.yellow('This will record a 10-second voice note and transcribe it.'));

    const { proceed } = await require('inquirer').prompt([
      {
        type: 'confirm',
        name: 'proceed',
        message: 'Ready to start recording?',
        default: true
      }
    ]);

    if (!proceed) return;

    try {
      console.log(chalk.green('\n🔴 Recording started... Speak now!'));
      console.log(chalk.gray('Recording will stop automatically after 10 seconds'));

      const result = await this.transcriber.recordAndTranscribe(null, {
        maxDuration: 10,
        keepAudio: false
      });

      if (result.text.trim()) {
        console.log(chalk.green('\n✅ Recording complete!'));
        console.log(chalk.cyan('\n📝 Transcription:'));
        console.log(chalk.white(`"${result.text}"`));

        const words = result.text.split(/\s+/).filter(w => w.length > 0);
        console.log(chalk.gray(`\nWord count: ${words.length}`));

        // Save demo transcription
        const filename = `demo_transcription_${Date.now()}.md`;
        const content = `# Demo Voice Transcription\n\n**Date:** ${new Date().toLocaleString()}\n**Duration:** ~10 seconds\n**Words:** ${words.length}\n\n---\n\n${result.text}`;

        fs.writeFileSync(filename, content, 'utf8');
        console.log(chalk.green(`\n💾 Saved to: ${filename}`));
      } else {
        console.log(chalk.yellow('\n⚠️  No speech detected. Try speaking louder or closer to the microphone.'));
      }

    } catch (error) {
      console.error(chalk.red('\n❌ Recording failed:'), error.message);
    }
  }

  async demoSampleFile() {
    console.log(chalk.blue('\n📁 Sample File Demo'));

    // Create a simple sample text that user can read
    const sampleTexts = [
      "The quick brown fox jumps over the lazy dog. This is a test of voice transcription accuracy.",
      "Writers CLI makes it easy to create novels and stories using voice transcription technology.",
      "Hello world! This is a demonstration of offline voice-to-text transcription using Whisper AI."
    ];

    const randomText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];

    console.log(chalk.yellow('\nFor this demo, please read the following text aloud:'));
    console.log(chalk.white(`\n"${randomText}"\n`));

    const { proceed } = await require('inquirer').prompt([
      {
        type: 'confirm',
        name: 'proceed',
        message: 'Ready to record yourself reading this text?',
        default: true
      }
    ]);

    if (!proceed) return;

    try {
      console.log(chalk.green('\n🔴 Recording started... Read the text above!'));
      console.log(chalk.gray('Recording will stop automatically after 15 seconds'));

      const result = await this.transcriber.recordAndTranscribe(null, {
        maxDuration: 15,
        keepAudio: false
      });

      if (result.text.trim()) {
        console.log(chalk.green('\n✅ Recording complete!'));
        console.log(chalk.cyan('\n📖 Original text:'));
        console.log(chalk.gray(`"${randomText}"`));
        console.log(chalk.cyan('\n📝 Transcription:'));
        console.log(chalk.white(`"${result.text}"`));

        // Simple accuracy comparison
        const accuracy = this.calculateSimpleAccuracy(randomText, result.text);
        console.log(chalk.blue(`\n🎯 Approximate accuracy: ${accuracy}%`));

      } else {
        console.log(chalk.yellow('\n⚠️  No speech detected. Try speaking louder or closer to the microphone.'));
      }

    } catch (error) {
      console.error(chalk.red('\n❌ Recording failed:'), error.message);
    }
  }

  async demoLiveTranscription() {
    console.log(chalk.blue('\n🔄 Live Transcription Demo'));
    console.log(chalk.yellow('This will demonstrate continuous transcription in short chunks.'));

    const { proceed } = await require('inquirer').prompt([
      {
        type: 'confirm',
        name: 'proceed',
        message: 'Start live transcription demo? (Will run 3 chunks of 5 seconds each)',
        default: true
      }
    ]);

    if (!proceed) return;

    const chunks = 3;
    const chunkDuration = 5;

    console.log(chalk.green(`\n🔄 Starting live transcription (${chunks} chunks of ${chunkDuration}s each)`));

    for (let i = 1; i <= chunks; i++) {
      try {
        console.log(chalk.blue(`\n--- Chunk ${i}/${chunks} ---`));
        console.log(chalk.green('🔴 Recording... Speak now!'));

        const result = await this.transcriber.recordAndTranscribe(null, {
          maxDuration: chunkDuration,
          keepAudio: false
        });

        if (result.text.trim()) {
          console.log(chalk.cyan(`📝 Chunk ${i}:`), chalk.white(`"${result.text}"`));
        } else {
          console.log(chalk.gray(`📝 Chunk ${i}: (no speech detected)`));
        }

        // Brief pause between chunks
        if (i < chunks) {
          console.log(chalk.gray('⏸️  2-second pause...'));
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

      } catch (error) {
        console.error(chalk.red(`❌ Chunk ${i} failed:`), error.message);
      }
    }

    console.log(chalk.green('\n✅ Live transcription demo completed!'));
  }

  async demoAccuracyTest() {
    console.log(chalk.blue('\n🧪 Accuracy Test Demo'));

    const testPhrases = [
      "The quick brown fox jumps over the lazy dog",
      "She sells seashells by the seashore",
      "How much wood would a woodchuck chuck if a woodchuck could chuck wood",
      "Writers CLI voice transcription test phrase number one",
      "Artificial intelligence and machine learning are transforming technology"
    ];

    console.log(chalk.yellow('\nThis test will measure transcription accuracy with known phrases.'));
    console.log(chalk.gray('You will record yourself saying each phrase, and we\'ll compare the results.\n'));

    let totalAccuracy = 0;
    let completedTests = 0;

    for (let i = 0; i < testPhrases.length; i++) {
      const phrase = testPhrases[i];

      console.log(chalk.blue(`\n--- Test ${i + 1}/${testPhrases.length} ---`));
      console.log(chalk.yellow('Please read this phrase aloud:'));
      console.log(chalk.white(`"${phrase}"`));

      const { proceed } = await require('inquirer').prompt([
        {
          type: 'confirm',
          name: 'proceed',
          message: 'Ready to record this phrase?',
          default: true
        }
      ]);

      if (!proceed) {
        console.log(chalk.gray('Skipping this test...'));
        continue;
      }

      try {
        console.log(chalk.green('🔴 Recording... Speak clearly!'));

        const result = await this.transcriber.recordAndTranscribe(null, {
          maxDuration: 10,
          keepAudio: false
        });

        if (result.text.trim()) {
          const accuracy = this.calculateSimpleAccuracy(phrase, result.text);
          totalAccuracy += accuracy;
          completedTests++;

          console.log(chalk.cyan('📖 Expected:'), chalk.gray(`"${phrase}"`));
          console.log(chalk.cyan('📝 Transcribed:'), chalk.white(`"${result.text}"`));
          console.log(chalk.blue(`🎯 Accuracy: ${accuracy}%`));

          if (accuracy >= 90) {
            console.log(chalk.green('   Excellent!'));
          } else if (accuracy >= 70) {
            console.log(chalk.yellow('   Good'));
          } else {
            console.log(chalk.red('   Needs improvement'));
          }
        } else {
          console.log(chalk.red('❌ No speech detected for this phrase'));
        }

      } catch (error) {
        console.error(chalk.red('❌ Test failed:'), error.message);
      }
    }

    if (completedTests > 0) {
      const avgAccuracy = Math.round(totalAccuracy / completedTests);
      console.log(chalk.bold.cyan(`\n📊 Overall Results:`));
      console.log(chalk.blue(`Tests completed: ${completedTests}/${testPhrases.length}`));
      console.log(chalk.blue(`Average accuracy: ${avgAccuracy}%`));

      if (avgAccuracy >= 85) {
        console.log(chalk.green('🎉 Excellent transcription quality!'));
      } else if (avgAccuracy >= 70) {
        console.log(chalk.yellow('👍 Good transcription quality'));
      } else {
        console.log(chalk.red('💡 Tips to improve accuracy:'));
        console.log('   • Speak clearly and at moderate pace');
        console.log('   • Reduce background noise');
        console.log('   • Use a better microphone');
        console.log('   • Ensure stable internet for model download');
      }
    }
  }

  calculateSimpleAccuracy(expected, actual) {
    // Simple word-based accuracy calculation
    const expectedWords = expected.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    const actualWords = actual.toLowerCase().split(/\s+/).filter(w => w.length > 0);

    let matches = 0;
    const maxLength = Math.max(expectedWords.length, actualWords.length);

    for (let i = 0; i < Math.min(expectedWords.length, actualWords.length); i++) {
      if (expectedWords[i] === actualWords[i]) {
        matches++;
      }
    }

    return maxLength > 0 ? Math.round((matches / maxLength) * 100) : 0;
  }
}

// Run demo if called directly
if (require.main === module) {
  const demo = new VoiceDemo();
  demo.runDemo().catch(error => {
    console.error(chalk.red('\n💥 Demo crashed:'), error.message);
    process.exit(1);
  });
}

module.exports = VoiceDemo;
