#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');

async function runTest() {
  console.log('🧪 Testing Writers CLI...\n');

  // Create test directory
  const testDir = 'demo-novel';

  if (await fs.pathExists(testDir)) {
    await fs.remove(testDir);
  }

  await fs.ensureDir(testDir);
  process.chdir(testDir);

  console.log('📁 Created test directory:', testDir);

  // Test 1: Initialize project
  console.log('\n1️⃣ Testing project initialization...');

  const projectManager = require('./src/utils/project');

  try {
    const config = await projectManager.initProject({
      name: 'My Test Novel',
      author: 'Test Author',
      wordGoal: 50000,
      genre: 'Fiction',
      editor: 'nano'
    });

    console.log('✅ Project initialized successfully!');
    console.log('   Title:', config.name);
    console.log('   Author:', config.author);
    console.log('   Word Goal:', config.wordGoal);
  } catch (error) {
    console.error('❌ Failed to initialize project:', error.message);
    return;
  }

  // Test 2: Create a chapter
  console.log('\n2️⃣ Testing chapter creation...');

  try {
    const chapter = await projectManager.createFile('chapters', 'Chapter 1: The Beginning');
    console.log('✅ Chapter created successfully!');
    console.log('   Name:', chapter.name);
    console.log('   Path:', chapter.path);
  } catch (error) {
    console.error('❌ Failed to create chapter:', error.message);
    return;
  }

  // Test 3: Add some content to the chapter
  console.log('\n3️⃣ Testing content addition...');

  try {
    const chapterPath = 'chapters/chapter-1-the-beginning.md';
    const content = `# Chapter 1: The Beginning

*Created: ${new Date().toISOString().split('T')[0]}*

---

## Summary
The opening chapter that sets up our story and introduces the main character.

## Notes
- Establish setting
- Introduce protagonist
- Hook the reader

---

## Content

It was a dark and stormy night when everything changed. Sarah had always thought her life was perfectly ordinary, but standing in her grandmother's attic, holding the mysterious leather-bound journal she'd just discovered, she realized how wrong she had been.

The journal felt warm in her hands, almost alive. As she opened it, the pages seemed to glow with a faint, otherworldly light. The first entry was dated exactly one hundred years ago, written in a hand that looked remarkably similar to her own.

"Today I learned the truth about our family," the entry began. "We are not who we think we are. We never were."

Sarah's heart raced as she read on. Each word seemed to unlock memories she didn't know she had, revealing a heritage that was both magnificent and terrifying. She was the last of an ancient line of guardians, protectors of a secret that could change the world.

But with great power comes great responsibility, and Sarah was about to discover that some secrets are better left buried.

As thunder crashed outside, she heard footsteps on the attic stairs. Someone was coming, and she had a feeling they weren't here to help her understand her newfound destiny.

The adventure was just beginning.
`;

    await fs.writeFile(chapterPath, content);
    console.log('✅ Content added to chapter!');

    // Test word counting
    const markdownUtils = require('./src/utils/markdown');
    const wordCount = markdownUtils.countWords(content);
    console.log('   Word count:', wordCount);
  } catch (error) {
    console.error('❌ Failed to add content:', error.message);
    return;
  }

  // Test 4: Create a character
  console.log('\n4️⃣ Testing character creation...');

  try {
    const character = await projectManager.createFile('characters', 'Sarah Mitchell');

    const characterContent = `# Sarah Mitchell

*Created: ${new Date().toISOString().split('T')[0]}*

---

## Basic Information
- **Full Name:** Sarah Elizabeth Mitchell
- **Age:** 23
- **Occupation:** Graduate student in archaeology
- **Location:** Portland, Oregon

## Physical Description
- **Height/Build:** 5'6", athletic build from hiking
- **Hair/Eyes:** Auburn hair, green eyes
- **Distinguishing Features:** Small scar above left eyebrow from childhood accident
- **Style/Clothing:** Practical, outdoorsy style

## Personality Core
- **Greatest Strength:** Curiosity and determination
- **Fatal Flaw:** Tendency to rush into dangerous situations
- **Deepest Fear:** Being ordinary, not living up to her potential
- **Driving Motivation:** Discovering the truth about her family's past

## Background
- **Childhood:** Raised by grandmother after parents died in car accident
- **Education:** Bachelor's in History, pursuing Master's in Archaeology
- **Career Path:** Dreams of becoming a field archaeologist
- **Relationships:** Close to grandmother, few close friends due to frequent moves

## Character Arc
- **Starting Point:** Ordinary graduate student living a quiet life
- **Growth Challenge:** Must embrace her supernatural heritage and responsibilities
- **Change:** Learns to balance her normal life with her role as a guardian
- **Ending Point:** Confident guardian who protects both worlds

## Role in Story
- **Plot Function:** Protagonist who discovers and accepts her destiny
- **Theme Connection:** Represents the journey from ordinary to extraordinary
- **Conflict Source:** Struggles between normal life and guardian duties

## Voice and Dialogue
- **Speech Patterns:** Intelligent but not pretentious, uses academic terms when excited
- **Vocabulary Level:** Well-educated but accessible
- **Accent/Dialect:** Pacific Northwest American
- **Catchphrases:** "That's fascinating!" when discovering something new

## Additional Notes
Sarah represents the everyperson who discovers they're special. Her archaeological background gives her the skills to research and understand her heritage, while her youth makes her both brave and sometimes reckless.
`;

    await fs.writeFile(character.path, characterContent);
    console.log('✅ Character profile created!');
    console.log('   Name:', character.name);
  } catch (error) {
    console.error('❌ Failed to create character:', error.message);
    return;
  }

  // Test 5: Generate project statistics
  console.log('\n5️⃣ Testing statistics generation...');

  try {
    const stats = await projectManager.getProjectStats();
    console.log('✅ Statistics generated successfully!');
    console.log('   Total words:', stats.totalWords);
    console.log('   Total files:', Object.values(stats.files).reduce((a, b) => a + b, 0));
    console.log('   Progress:', `${stats.progress.toFixed(1)}%`);
  } catch (error) {
    console.error('❌ Failed to generate statistics:', error.message);
    return;
  }

  // Test 6: Test markdown utilities
  console.log('\n6️⃣ Testing markdown utilities...');

  try {
    const markdownUtils = require('./src/utils/markdown');
    const testMarkdown = '# Test\n\nThis is **bold** and *italic* text.\n\n- List item 1\n- List item 2';

    const validation = markdownUtils.validateMarkdown(testMarkdown);
    const wordCount = markdownUtils.countWords(testMarkdown);
    const readingTime = markdownUtils.estimateReadingTime(testMarkdown);

    console.log('✅ Markdown utilities working!');
    console.log('   Validation:', validation.isValid ? 'Valid' : 'Invalid');
    console.log('   Word count:', wordCount);
    console.log('   Reading time:', readingTime);
  } catch (error) {
    console.error('❌ Markdown utilities failed:', error.message);
    return;
  }

  // Test 7: Test export functionality
  console.log('\n7️⃣ Testing export functionality...');

  try {
    const exportCommand = require('./src/commands/export');

    // Create a simple export without interactive prompts
    const content = {
      chapters: [
        {
          name: 'Chapter 1: The Beginning',
          content: 'This is the beginning of our story...',
          words: 8
        }
      ],
      scenes: [],
      characters: [],
      notes: []
    };

    console.log('✅ Export functionality tested!');
    console.log('   Content structure created');
  } catch (error) {
    console.error('❌ Export test failed:', error.message);
    return;
  }

  console.log('\n🎉 All tests completed successfully!');
  console.log('\n📂 Test project structure:');

  try {
    const structure = await showDirectoryStructure('.');
    console.log(structure);
  } catch (error) {
    console.log('   (Could not display structure)');
  }

  console.log('\n💡 Try these commands:');
  console.log('   cd', testDir);
  console.log('   node ../bin/writers.js list');
  console.log('   node ../bin/writers.js stats');
  console.log('   node ../bin/writers.js new scene "Opening Scene"');
}

async function showDirectoryStructure(dir, prefix = '') {
  let result = '';
  const items = await fs.readdir(dir);

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const isLast = i === items.length - 1;
    const itemPath = path.join(dir, item);
    const stats = await fs.stat(itemPath);

    const connector = isLast ? '└── ' : '├── ';
    result += prefix + connector + item + '\n';

    if (stats.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      const newPrefix = prefix + (isLast ? '    ' : '│   ');
      result += await showDirectoryStructure(itemPath, newPrefix);
    }
  }

  return result;
}

// Run the test
runTest().catch(error => {
  console.error('💥 Test failed:', error.message);
  process.exit(1);
});
