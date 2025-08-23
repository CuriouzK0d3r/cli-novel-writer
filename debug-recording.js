#!/usr/bin/env node

/**
 * Debug Recording Issues - Diagnostic Script
 *
 * This script helps diagnose voice recording and processing issues
 * by testing each component of the voice transcription pipeline.
 */

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const VoiceTranscriber = require('./src/voice/transcriber');
const AudioProcessor = require('./src/voice/audio-processor');

console.log(chalk.bold.blue('🔧 Voice Recording Debug Tool\n'));

async function runDiagnostics() {
  const results = {
    system: { passed: 0, failed: 0, tests: [] },
    audio: { passed: 0, failed: 0, tests: [] },
    recording: { passed: 0, failed: 0, tests: [] },
    processing: { passed: 0, failed: 0, tests: [] }
  };

  console.log(chalk.yellow('Running comprehensive diagnostics...\n'));

  // 1. System Checks
  console.log(chalk.blue('1️⃣  System Environment'));
  await testSystemEnvironment(results.system);

  // 2. Audio Processing
  console.log(chalk.blue('\n2️⃣  Audio Processing'));
  await testAudioProcessing(results.audio);

  // 3. Recording Capabilities
  console.log(chalk.blue('\n3️⃣  Recording Test'));
  await testRecordingCapabilities(results.recording);

  // 4. Processing Pipeline
  console.log(chalk.blue('\n4️⃣  Processing Pipeline'));
  await testProcessingPipeline(results.processing);

  // Summary
  console.log(chalk.bold.cyan('\n📊 Diagnostic Summary'));
  const totalPassed = Object.values(results).reduce((sum, cat) => sum + cat.passed, 0);
  const totalFailed = Object.values(results).reduce((sum, cat) => sum + cat.failed, 0);

  for (const [category, result] of Object.entries(results)) {
    const status = result.failed === 0 ? chalk.green('✅') : chalk.red('❌');
    console.log(`${status} ${category}: ${result.passed} passed, ${result.failed} failed`);
  }

  console.log(chalk.bold(`\nOverall: ${totalPassed} passed, ${totalFailed} failed`));

  if (totalFailed > 0) {
    console.log(chalk.red('\n🔍 Issues Found - See details above'));
    console.log(chalk.yellow('💡 Common fixes:'));
    console.log('  • Check microphone permissions');
    console.log('  • Ensure no other apps are using microphone');
    console.log('  • Try a shorter recording duration');
    console.log('  • Check available disk space');
  } else {
    console.log(chalk.green('\n🎉 All diagnostics passed!'));
  }
}

async function testSystemEnvironment(results) {
  // Node.js version
  await runTest(results, 'Node.js Version', () => {
    const version = process.version;
    const major = parseInt(version.slice(1));
    if (major >= 14) {
      return { success: true, message: `${version} ✓` };
    }
    throw new Error(`${version} - requires Node.js 14+`);
  });

  // Platform check
  await runTest(results, 'Platform Support', () => {
    const platform = process.platform;
    const supported = ['darwin', 'win32', 'linux'];
    if (supported.includes(platform)) {
      return { success: true, message: `${platform} ✓` };
    }
    throw new Error(`${platform} - may not be supported`);
  });

  // Memory check
  await runTest(results, 'Available Memory', () => {
    const totalMem = Math.round(require('os').totalmem() / 1024 / 1024 / 1024);
    if (totalMem >= 2) {
      return { success: true, message: `${totalMem}GB ✓` };
    }
    throw new Error(`${totalMem}GB - recommend 2GB+ for voice processing`);
  });

  // Disk space check
  await runTest(results, 'Disk Space', () => {
    try {
      const stats = fs.statSync('.');
      return { success: true, message: 'Accessible ✓' };
    } catch (error) {
      throw new Error('Cannot write to current directory');
    }
  });
}

async function testAudioProcessing(results) {
  // Audio processor initialization
  await runTest(results, 'Audio Processor', () => {
    const processor = new AudioProcessor();
    const formats = processor.supportedFormats;
    return { success: true, message: `${formats.length} formats supported` };
  });

  // FFmpeg check
  await runTest(results, 'FFmpeg Available', async () => {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    try {
      await execAsync('ffmpeg -version');
      return { success: true, message: 'FFmpeg found ✓' };
    } catch (error) {
      throw new Error('FFmpeg not found - required for non-WAV files');
    }
  });

  // Whisper model check
  await runTest(results, 'Whisper Model', async () => {
    const transcriber = new VoiceTranscriber();
    await transcriber.initialize();
    transcriber.cleanup();
    return { success: true, message: 'Model loaded successfully ✓' };
  });
}

async function testRecordingCapabilities(results) {
  // Recording dependencies
  await runTest(results, 'Recording Dependencies', () => {
    try {
      const recorder = require('node-record-lpcm16');
      const wav = require('wav');
      return { success: true, message: 'Dependencies available ✓' };
    } catch (error) {
      throw new Error(`Missing dependencies: ${error.message}`);
    }
  });

  // Test file creation
  await runTest(results, 'File Write Permission', async () => {
    const testFile = `test_write_${Date.now()}.tmp`;
    try {
      await fs.promises.writeFile(testFile, 'test');
      await fs.promises.unlink(testFile);
      return { success: true, message: 'Can create files ✓' };
    } catch (error) {
      throw new Error('Cannot write files in current directory');
    }
  });

  // Quick recording test (1 second)
  await runTest(results, 'Quick Recording Test', async () => {
    const transcriber = new VoiceTranscriber();
    const testFile = `debug_recording_${Date.now()}.wav`;

    try {
      console.log('    Recording 1 second of audio...');

      // Start recording
      const recordingPromise = transcriber.startRecording(testFile);

      // Stop after 1 second
      setTimeout(() => {
        transcriber.stopRecording();
      }, 1000);

      const audioPath = await recordingPromise;

      // Check if file exists and has content
      const stats = fs.statSync(audioPath);
      if (stats.size > 0) {
        fs.unlinkSync(audioPath); // Clean up
        return { success: true, message: `Recorded ${stats.size} bytes ✓` };
      } else {
        throw new Error('Recording file is empty');
      }
    } catch (error) {
      // Clean up on error
      if (fs.existsSync(testFile)) {
        fs.unlinkSync(testFile);
      }
      throw error;
    } finally {
      transcriber.cleanup();
    }
  });
}

async function testProcessingPipeline(results) {
  // Create a minimal test WAV file
  await runTest(results, 'WAV File Processing', async () => {
    const processor = new AudioProcessor();

    // Create a minimal valid WAV file (1 second of silence)
    const testWavFile = `test_processing_${Date.now()}.wav`;

    try {
      // Create a minimal WAV file header + 1 second of silence at 16kHz
      const sampleRate = 16000;
      const duration = 1; // 1 second
      const samples = sampleRate * duration;
      const dataSize = samples * 2; // 16-bit samples

      const buffer = Buffer.alloc(44 + dataSize);

      // WAV header
      buffer.write('RIFF', 0);
      buffer.writeUInt32LE(36 + dataSize, 4);
      buffer.write('WAVE', 8);
      buffer.write('fmt ', 12);
      buffer.writeUInt32LE(16, 16); // fmt chunk size
      buffer.writeUInt16LE(1, 20);  // PCM format
      buffer.writeUInt16LE(1, 22);  // mono
      buffer.writeUInt32LE(sampleRate, 24);
      buffer.writeUInt32LE(sampleRate * 2, 28); // byte rate
      buffer.writeUInt16LE(2, 32);  // block align
      buffer.writeUInt16LE(16, 34); // bits per sample
      buffer.write('data', 36);
      buffer.writeUInt32LE(dataSize, 40);

      // Data (silence - all zeros)
      buffer.fill(0, 44);

      fs.writeFileSync(testWavFile, buffer);

      // Test processing
      const audioData = await processor.processAudioFile(testWavFile);

      fs.unlinkSync(testWavFile); // Clean up

      if (audioData && audioData.length > 0) {
        return { success: true, message: `Processed ${audioData.length} samples ✓` };
      } else {
        throw new Error('No audio data returned from processor');
      }
    } catch (error) {
      if (fs.existsSync(testWavFile)) {
        fs.unlinkSync(testWavFile);
      }
      throw error;
    }
  });

  // Test full transcription pipeline
  await runTest(results, 'End-to-End Pipeline', async () => {
    const transcriber = new VoiceTranscriber();

    try {
      await transcriber.initialize();

      // Create the same test WAV file
      const testWavFile = `test_transcribe_${Date.now()}.wav`;
      const sampleRate = 16000;
      const duration = 1;
      const samples = sampleRate * duration;
      const dataSize = samples * 2;

      const buffer = Buffer.alloc(44 + dataSize);

      // WAV header (same as above)
      buffer.write('RIFF', 0);
      buffer.writeUInt32LE(36 + dataSize, 4);
      buffer.write('WAVE', 8);
      buffer.write('fmt ', 12);
      buffer.writeUInt32LE(16, 16);
      buffer.writeUInt16LE(1, 20);
      buffer.writeUInt16LE(1, 22);
      buffer.writeUInt32LE(sampleRate, 24);
      buffer.writeUInt32LE(sampleRate * 2, 28);
      buffer.writeUInt16LE(2, 32);
      buffer.writeUInt16LE(16, 34);
      buffer.write('data', 36);
      buffer.writeUInt32LE(dataSize, 40);
      buffer.fill(0, 44);

      fs.writeFileSync(testWavFile, buffer);

      // Test transcription
      const result = await transcriber.transcribeFile(testWavFile);

      fs.unlinkSync(testWavFile); // Clean up

      if (result && typeof result.text === 'string') {
        return { success: true, message: 'Transcription pipeline works ✓' };
      } else {
        throw new Error('Invalid transcription result');
      }
    } catch (error) {
      throw error;
    } finally {
      transcriber.cleanup();
    }
  });
}

async function runTest(results, testName, testFn) {
  process.stdout.write(`  ${testName}: `);

  try {
    const result = await testFn();
    console.log(chalk.green(result.message || '✅ Pass'));
    results.passed++;
    results.tests.push({ name: testName, status: 'pass', message: result.message });
  } catch (error) {
    console.log(chalk.red(`❌ ${error.message}`));
    results.failed++;
    results.tests.push({ name: testName, status: 'fail', message: error.message });
  }
}

// Handle graceful exit
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\n🛑 Diagnostics interrupted'));
  process.exit(0);
});

// Main execution
if (require.main === module) {
  runDiagnostics().catch((error) => {
    console.error(chalk.red('\n💥 Diagnostic script failed:'), error.message);
    process.exit(1);
  });
}

module.exports = { runDiagnostics };
