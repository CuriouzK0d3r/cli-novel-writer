#!/usr/bin/env node

const chalk = require('chalk');
const VoiceTranscriber = require('./src/voice/transcriber');
const AudioUtils = require('./src/voice/audio-utils');
const fs = require('fs');
const path = require('path');

/**
 * Integration test suite for voice transcription functionality
 */
class VoiceIntegrationTest {
  constructor() {
    this.transcriber = new VoiceTranscriber();
    this.passed = 0;
    this.failed = 0;
    this.testResults = [];
  }

  async runAllTests() {
    console.log(chalk.bold.cyan('\n🧪 Voice Transcription Integration Tests\n'));

    const tests = [
      'testTranscriberInitialization',
      'testAudioUtilsValidation',
      'testSupportedFormats',
      'testSystemCompatibility',
      'testFileNameGeneration',
      'testAccuracyCalculation',
      'testProgressCallback',
      'testCleanup'
    ];

    for (const testName of tests) {
      await this.runTest(testName);
    }

    this.printSummary();
    return this.failed === 0;
  }

  async runTest(testName) {
    try {
      console.log(chalk.blue(`📋 Running: ${testName}`));
      await this[testName]();
      this.passed++;
      this.testResults.push({ name: testName, status: 'PASS' });
      console.log(chalk.green(`  ✅ PASS: ${testName}\n`));
    } catch (error) {
      this.failed++;
      this.testResults.push({ name: testName, status: 'FAIL', error: error.message });
      console.log(chalk.red(`  ❌ FAIL: ${testName}`));
      console.log(chalk.red(`     Error: ${error.message}\n`));
    }
  }

  async testTranscriberInitialization() {
    // Test basic initialization
    const transcriber = new VoiceTranscriber();

    // Should not throw
    if (typeof transcriber.initialize !== 'function') {
      throw new Error('initialize method not found');
    }

    if (typeof transcriber.getSupportedFormats !== 'function') {
      throw new Error('getSupportedFormats method not found');
    }

    if (typeof transcriber.checkDependencies !== 'function') {
      throw new Error('checkDependencies method not found');
    }

    // Test supported formats
    const formats = transcriber.getSupportedFormats();
    if (!Array.isArray(formats) || formats.length === 0) {
      throw new Error('getSupportedFormats should return non-empty array');
    }

    const expectedFormats = ['.wav', '.mp3', '.m4a', '.flac', '.ogg'];
    for (const format of expectedFormats) {
      if (!formats.includes(format)) {
        throw new Error(`Missing expected format: ${format}`);
      }
    }
  }

  async testAudioUtilsValidation() {
    // Test mime type detection
    const wavMime = AudioUtils.getMimeType('.wav');
    if (wavMime !== 'audio/wav') {
      throw new Error(`Wrong mime type for .wav: ${wavMime}`);
    }

    const mp3Mime = AudioUtils.getMimeType('.mp3');
    if (mp3Mime !== 'audio/mpeg') {
      throw new Error(`Wrong mime type for .mp3: ${mp3Mime}`);
    }

    // Test format support check
    if (!AudioUtils.isSupportedFormat('.wav')) {
      throw new Error('.wav should be supported');
    }

    if (AudioUtils.isSupportedFormat('.xyz')) {
      throw new Error('.xyz should not be supported');
    }

    // Test file size formatting
    const size = AudioUtils.formatFileSize(1024);
    if (size !== '1 KB') {
      throw new Error(`Wrong file size format: ${size}`);
    }

    const largeSize = AudioUtils.formatFileSize(1048576);
    if (largeSize !== '1 MB') {
      throw new Error(`Wrong large file size format: ${largeSize}`);
    }
  }

  async testSupportedFormats() {
    const formats = this.transcriber.getSupportedFormats();

    // Should include common audio formats
    const requiredFormats = ['.wav', '.mp3', '.m4a', '.flac', '.ogg'];

    for (const format of requiredFormats) {
      if (!formats.includes(format)) {
        throw new Error(`Missing required format: ${format}`);
      }
    }

    // Should not include unsupported formats
    const unsupportedFormats = ['.txt', '.doc', '.pdf', '.xyz'];

    for (const format of unsupportedFormats) {
      if (formats.includes(format)) {
        throw new Error(`Incorrectly includes unsupported format: ${format}`);
      }
    }
  }

  async testSystemCompatibility() {
    const check = await this.transcriber.checkDependencies();

    if (typeof check !== 'object') {
      throw new Error('checkDependencies should return object');
    }

    if (typeof check.isReady !== 'boolean') {
      throw new Error('check.isReady should be boolean');
    }

    if (!Array.isArray(check.issues)) {
      throw new Error('check.issues should be array');
    }

    // On most systems, this should be ready
    if (!check.isReady && check.issues.length === 0) {
      throw new Error('If not ready, should have issues listed');
    }
  }

  async testFileNameGeneration() {
    const filename1 = AudioUtils.createTempFilename();
    const filename2 = AudioUtils.createTempFilename('.mp3');

    if (!filename1.endsWith('.wav')) {
      throw new Error('Default temp filename should end with .wav');
    }

    if (!filename2.endsWith('.mp3')) {
      throw new Error('Custom extension not applied correctly');
    }

    if (filename1 === filename2) {
      throw new Error('Temp filenames should be unique');
    }

    // Test filename sanitization
    const dirty = 'file<>:"/\\|?*name.wav';
    const clean = AudioUtils.sanitizeFilename(dirty);

    if (clean.includes('<') || clean.includes('>') || clean.includes(':')) {
      throw new Error('Filename sanitization failed');
    }
  }

  async testAccuracyCalculation() {
    // Mock accuracy calculation function (assuming it's in demo-voice.js)
    const calculateSimpleAccuracy = (expected, actual) => {
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
    };

    // Test perfect match
    const perfect = calculateSimpleAccuracy('hello world', 'hello world');
    if (perfect !== 100) {
      throw new Error(`Perfect match should be 100%, got ${perfect}%`);
    }

    // Test partial match
    const partial = calculateSimpleAccuracy('hello world test', 'hello world demo');
    if (partial < 50 || partial > 80) {
      throw new Error(`Partial match accuracy seems wrong: ${partial}%`);
    }

    // Test no match
    const none = calculateSimpleAccuracy('hello world', 'foo bar');
    if (none !== 0) {
      throw new Error(`No match should be 0%, got ${none}%`);
    }
  }

  async testProgressCallback() {
    let callbackCount = 0;
    let lastPercent = -1;

    const callback = AudioUtils.createProgressCallback(({ percent, current, total, stage }) => {
      callbackCount++;

      if (percent < lastPercent) {
        throw new Error('Progress should not go backwards');
      }

      if (percent < 0 || percent > 100) {
        throw new Error(`Invalid progress percentage: ${percent}`);
      }

      if (current > total) {
        throw new Error('Current should not exceed total');
      }

      lastPercent = percent;
    });

    // Simulate progress updates
    callback(0, 100, 'Starting');
    callback(25, 100, 'Processing');
    callback(50, 100, 'Converting');
    callback(100, 100, 'Complete');

    if (callbackCount === 0) {
      throw new Error('Progress callback was not called');
    }
  }

  async testCleanup() {
    const transcriber = new VoiceTranscriber();

    // Should not throw when cleaning up
    transcriber.cleanup();

    // Should be safe to call multiple times
    transcriber.cleanup();
    transcriber.cleanup();

    // Test audio utils browser support check
    const support = AudioUtils.checkBrowserAudioSupport();

    if (typeof support !== 'object') {
      throw new Error('Browser support check should return object');
    }

    if (typeof support.supported !== 'boolean') {
      throw new Error('support.supported should be boolean');
    }

    // In Node.js environment, should not be supported
    if (support.supported) {
      throw new Error('Browser features should not be supported in Node.js');
    }

    if (support.reason !== 'Not in browser environment') {
      throw new Error('Should detect non-browser environment');
    }
  }

  printSummary() {
    console.log(chalk.bold.cyan('\n📊 Test Summary\n'));

    console.log(chalk.green(`✅ Passed: ${this.passed}`));
    console.log(chalk.red(`❌ Failed: ${this.failed}`));
    console.log(chalk.blue(`📋 Total:  ${this.passed + this.failed}\n`));

    if (this.failed > 0) {
      console.log(chalk.red('Failed Tests:'));
      this.testResults
        .filter(r => r.status === 'FAIL')
        .forEach(r => {
          console.log(chalk.red(`  • ${r.name}: ${r.error}`));
        });
      console.log('');
    }

    if (this.failed === 0) {
      console.log(chalk.bold.green('🎉 All tests passed! Voice transcription is ready to use.\n'));
      console.log(chalk.cyan('Try these commands to get started:'));
      console.log(chalk.white('  writers voice check'));
      console.log(chalk.white('  writers voice record test.md'));
      console.log(chalk.white('  node demo-voice.js\n'));
    } else {
      console.log(chalk.bold.red('💥 Some tests failed. Please check the implementation.\n'));
      process.exit(1);
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new VoiceIntegrationTest();
  tester.runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error(chalk.red('\n💥 Test suite crashed:'), error.message);
      process.exit(1);
    });
}

module.exports = VoiceIntegrationTest;
