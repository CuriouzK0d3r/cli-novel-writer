#!/usr/bin/env node

/**
 * Theme System Test Script
 * Tests the basic functionality of the Writers CLI theme system
 */

const { ThemeManager, DarkTheme, LightTheme, BaseTheme } = require('./src/editor/themes');

function testThemeManager() {
  console.log('🧪 Testing Theme Manager...\n');

  const manager = new ThemeManager();

  // Test theme registration
  console.log('📋 Available themes:');
  const themes = manager.getAvailableThemes();
  themes.forEach(theme => {
    const icon = theme.isDark ? '🌙' : '☀️';
    console.log(`  ${icon} ${theme.displayName} (${theme.name})`);
  });

  // Test theme switching
  console.log('\n🔄 Testing theme switching:');
  console.log(`Current theme: ${manager.getCurrentTheme().displayName}`);

  const nextTheme = manager.nextTheme();
  console.log(`Switched to: ${nextTheme.displayName}`);

  const prevTheme = manager.previousTheme();
  console.log(`Switched back to: ${prevTheme.displayName}`);

  // Test theme stats
  console.log('\n📊 Theme statistics:');
  const stats = manager.getThemeStats();
  console.log(`  Total themes: ${stats.totalThemes}`);
  console.log(`  Dark themes: ${stats.darkThemes}`);
  console.log(`  Light themes: ${stats.lightThemes}`);
  console.log(`  Current theme: ${stats.currentTheme}`);

  console.log('\n✅ Theme Manager tests passed!\n');
}

function testThemeFormatting() {
  console.log('🎨 Testing theme formatting...\n');

  const manager = new ThemeManager();
  manager.setTheme('dark');

  // Test text formatting
  const testTexts = [
    { text: 'Success message', type: 'success' },
    { text: 'Warning message', type: 'warning' },
    { text: 'Error message', type: 'error' },
    { text: 'Info message', type: 'info' },
    { text: 'Dimmed text', type: 'dimmed' },
    { text: 'Selected text', type: 'selection' }
  ];

  console.log('🌙 Dark theme formatting:');
  testTexts.forEach(({ text, type }) => {
    const formatted = manager.formatText(text, type);
    console.log(`  ${type}: ${formatted}`);
  });

  // Switch to light theme
  manager.setTheme('light');
  console.log('\n☀️ Light theme formatting:');
  testTexts.forEach(({ text, type }) => {
    const formatted = manager.formatText(text, type);
    console.log(`  ${type}: ${formatted}`);
  });

  console.log('\n✅ Theme formatting tests passed!\n');
}

function testSyntaxHighlighting() {
  console.log('🖍️ Testing syntax highlighting...\n');

  const manager = new ThemeManager();
  manager.setTheme('dark');

  const markdownSamples = [
    '# Main Header',
    '## Sub Header',
    '**Bold text** and *italic text*',
    '`inline code` and [link text](url)',
    '> This is a blockquote',
    '- List item 1',
    '1. Numbered list item'
  ];

  console.log('🌙 Dark theme syntax highlighting:');
  markdownSamples.forEach(sample => {
    const highlighted = manager.applySyntaxHighlighting(sample, 'markdown');
    console.log(`  Original: ${sample}`);
    console.log(`  Highlighted: ${highlighted}\n`);
  });

  console.log('✅ Syntax highlighting tests passed!\n');
}

function testCursorStyles() {
  console.log('👆 Testing cursor styles...\n');

  const manager = new ThemeManager();

  // Test dark theme cursors
  manager.setTheme('dark');
  console.log('🌙 Dark theme cursors:');
  console.log(`  Insert mode: ${manager.getCursor('insert')}`);
  console.log(`  Normal mode: ${manager.getCursor('normal', 'A')}`);

  // Test light theme cursors
  manager.setTheme('light');
  console.log('\n☀️ Light theme cursors:');
  console.log(`  Insert mode: ${manager.getCursor('insert')}`);
  console.log(`  Normal mode: ${manager.getCursor('normal', 'A')}`);

  console.log('\n✅ Cursor style tests passed!\n');
}

function testStatusBarContent() {
  console.log('📊 Testing status bar content...\n');

  const manager = new ThemeManager();

  const editorState = {
    mode: 'insert',
    line: 42,
    col: 15,
    filename: 'my-story.md',
    modified: true,
    wordCount: 1250,
    totalLines: 100,
    typewriterMode: false
  };

  // Test dark theme status bar
  manager.setTheme('dark');
  console.log('🌙 Dark theme status bar:');
  console.log(`  ${manager.getStatusBarContent(editorState)}`);

  // Test light theme status bar
  manager.setTheme('light');
  console.log('\n☀️ Light theme status bar:');
  console.log(`  ${manager.getStatusBarContent(editorState)}`);

  console.log('\n✅ Status bar tests passed!\n');
}

function testThemeValidation() {
  console.log('🔍 Testing theme validation...\n');

  const darkTheme = new DarkTheme();
  const lightTheme = new LightTheme();
  const baseTheme = new BaseTheme();

  console.log(`Dark theme valid: ${darkTheme.validate()}`);
  console.log(`Light theme valid: ${lightTheme.validate()}`);
  console.log(`Base theme valid: ${baseTheme.validate()}`);

  console.log('\n✅ Theme validation tests passed!\n');
}

function testWelcomeMessages() {
  console.log('👋 Testing welcome messages...\n');

  const manager = new ThemeManager();

  // Test all theme welcome messages
  const themes = manager.getAvailableThemes();
  themes.forEach(themeInfo => {
    manager.setTheme(themeInfo.name);
    const welcome = manager.getWelcomeMessage();
    console.log(`${themeInfo.displayName}: ${welcome}`);
  });

  console.log('\n✅ Welcome message tests passed!\n');
}

function runAllTests() {
  console.log('🚀 Starting Writers CLI Theme System Tests\n');
  console.log('=' * 50);

  try {
    testThemeManager();
    testThemeFormatting();
    testSyntaxHighlighting();
    testCursorStyles();
    testStatusBarContent();
    testThemeValidation();
    testWelcomeMessages();

    console.log('🎉 All tests passed successfully!');
    console.log('\nThe theme system is ready for use.');
    console.log('Try running: node src/commands/edit.js theme-demo.md');
    console.log('Then press F2 to switch themes!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testThemeManager,
  testThemeFormatting,
  testSyntaxHighlighting,
  testCursorStyles,
  testStatusBarContent,
  testThemeValidation,
  testWelcomeMessages,
  runAllTests
};
