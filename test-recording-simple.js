#!/usr/bin/env node

/**
 * Simple Recording Test Script
 *
 * This script tests the basic recording functionality step by step
 * to help identify where the issue is occurring.
 */

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

console.log(chalk.bold.blue('🔧 Simple Recording Test\n'));

async function testRecording() {
  console.log(chalk.blue('1️⃣ Testing basic dependencies...'));

  try {
    // Test 1: Check if recording dependencies exist
    const recorder = require('node-record-lpcm16');
    const wav = require('wav');
    console.log(chalk.green('✅ Recording dependencies available'));
  } catch (error) {
    console.log(chalk.red('❌ Missing recording dependencies:', error.message));
    return;
  }

  console.log(chalk.blue('\n2️⃣ Testing file creation...'));

  try {
    // Test 2: Check if we can create files
    const testFile = `test_${Date.now()}.tmp`;
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    console.log(chalk.green('✅ File creation works'));
  } catch (error) {
    console.log(chalk.red('❌ Cannot create files:', error.message));
    return;
  }

  console.log(chalk.blue('\n3️⃣ Testing basic recording setup...'));

  try {
    // Test 3: Try to create a basic recorder
    const recorder = require('node-record-lpcm16');

    const recordingOptions = {
      sampleRate: 16000,
      channels: 1,
      audioType: 'wav',
      silence: '1.0',
      threshold: 0.5,
      verbose: false
    };

    console.log(chalk.yellow('Recording options configured'));
    console.log(chalk.green('✅ Basic recording setup works'));
  } catch (error) {
    console.log(chalk.red('❌ Recording setup failed:', error.message));
    return;
  }

  console.log(chalk.blue('\n4️⃣ Testing short recording (2 seconds)...'));
  console.log(chalk.yellow('This will attempt a 2-second recording...'));
  console.log(chalk.gray('Make sure to allow microphone access if prompted.'));

  const audioFile = `test_recording_${Date.now()}.wav`;

  try {
    const recorder = require('node-record-lpcm16');
    const wav = require('wav');

    // Create WAV file writer
    const fileWriter = new wav.FileWriter(audioFile, {
      channels: 1,
      sampleRate: 16000,
      bitDepth: 16
    });

    // Create recording stream
    const recordingStream = recorder.record({
      sampleRate: 16000,
      channels: 1,
      audioType: 'wav',
      silence: '5.0',
      threshold: 0.5,
      thresholdStart: null,
      thresholdEnd: null,
      verbose: false
    });

    // Pipe to file
    recordingStream.stream().pipe(fileWriter);

    console.log(chalk.yellow('🎙️ Recording started... (2 seconds)'));
    console.log(chalk.gray('Speak into your microphone now!'));

    // Set up timeout to stop recording
    const recordingTimeout = setTimeout(() => {
      console.log(chalk.yellow('🛑 Stopping recording...'));
      recordingStream.stop();
    }, 2000);

    // Handle recording end
    recordingStream.stream().on('end', () => {
      clearTimeout(recordingTimeout);

      // Check if file was created and has content
      setTimeout(() => {
        if (fs.existsSync(audioFile)) {
          const stats = fs.statSync(audioFile);
          if (stats.size > 0) {
            console.log(chalk.green(`✅ Recording successful! File size: ${stats.size} bytes`));

            // Clean up
            fs.unlinkSync(audioFile);
            console.log(chalk.gray('🗑️ Cleaned up audio file'));

            console.log(chalk.bold.green('\n🎉 All tests passed! Recording is working.'));
            console.log(chalk.blue('\nNext steps:'));
            console.log(chalk.gray('• The recording system is functional'));
            console.log(chalk.gray('• The issue might be with audio processing or transcription'));
            console.log(chalk.gray('• Try running: ./bin/writers.js voice check'));
          } else {
            console.log(chalk.red('❌ Recording file is empty'));
            console.log(chalk.yellow('Possible issues:'));
            console.log(chalk.yellow('• Microphone not working'));
            console.log(chalk.yellow('• No audio input detected'));
            console.log(chalk.yellow('• Microphone permissions denied'));
          }
        } else {
          console.log(chalk.red('❌ Recording file not created'));
        }
      }, 500); // Give file system time to flush
    });

    // Handle recording errors
    recordingStream.stream().on('error', (error) => {
      clearTimeout(recordingTimeout);
      console.log(chalk.red('❌ Recording error:', error.message));

      if (error.message.includes('spawn')) {
        console.log(chalk.yellow('💡 This might be a system audio issue:'));
        console.log(chalk.yellow('• Check microphone permissions in System Preferences'));
        console.log(chalk.yellow('• Ensure no other apps are using the microphone'));
        console.log(chalk.yellow('• Try restarting Terminal/IDE'));
      }

      // Clean up on error
      if (fs.existsSync(audioFile)) {
        fs.unlinkSync(audioFile);
      }
    });

  } catch (error) {
    console.log(chalk.red('❌ Recording test failed:', error.message));
    console.log(chalk.yellow('Error details:', error.stack));

    // Clean up on error
    if (fs.existsSync(audioFile)) {
      fs.unlinkSync(audioFile);
    }
  }
}

// Handle graceful exit
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n🛑 Test interrupted by user'));
  process.exit(0);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.log(chalk.red('\n💥 Uncaught error:', error.message));
  process.exit(1);
});

// Run the test
if (require.main === module) {
  testRecording().catch((error) => {
    console.error(chalk.red('\n💥 Test script failed:'), error.message);
    process.exit(1);
  });
}

module.exports = { testRecording };
