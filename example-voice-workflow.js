#!/usr/bin/env node

const chalk = require('chalk');
const VoiceTranscriber = require('./src/voice/transcriber');
const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');

/**
 * Complete voice transcription workflow example
 * Demonstrates all major features and use cases
 */
class VoiceWorkflowExample {
  constructor() {
    this.transcriber = new VoiceTranscriber();
    this.projectDir = './voice-example-project';
  }

  async runWorkflow() {
    console.log(chalk.bold.cyan('\n🎤 Complete Voice Transcription Workflow Example\n'));

    try {
      // Show workflow menu
      await this.showWorkflowMenu();
    } catch (error) {
      console.error(chalk.red('❌ Workflow failed:'), error.message);
    } finally {
      this.transcriber.cleanup();
    }
  }

  async showWorkflowMenu() {
    const { workflow } = await inquirer.prompt([
      {
        type: 'list',
        name: 'workflow',
        message: 'Choose a workflow to demonstrate:',
        choices: [
          { name: '📖 Novel Writing Workflow - From idea to chapter', value: 'novel' },
          { name: '📰 Content Creation - Interview to article', value: 'content' },
          { name: '✍️ Daily Writing - Voice journaling', value: 'journal' },
          { name: '🎙️ Podcast Notes - Episode transcription', value: 'podcast' },
          { name: '📝 Meeting Minutes - Voice memo processing', value: 'meeting' },
          { name: '🏃 Quick Demo - All features in 2 minutes', value: 'demo' },
          { name: '❌ Exit', value: 'exit' }
        ]
      }
    ]);

    switch (workflow) {
      case 'novel':
        await this.novelWritingWorkflow();
        break;
      case 'content':
        await this.contentCreationWorkflow();
        break;
      case 'journal':
        await this.dailyWritingWorkflow();
        break;
      case 'podcast':
        await this.podcastNotesWorkflow();
        break;
      case 'meeting':
        await this.meetingMinutesWorkflow();
        break;
      case 'demo':
        await this.quickDemo();
        break;
      case 'exit':
        console.log(chalk.yellow('\nThanks for trying the voice workflow examples!'));
        return;
    }

    // Ask if user wants to try another workflow
    const { another } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'another',
        message: 'Would you like to try another workflow?',
        default: false
      }
    ]);

    if (another) {
      await this.showWorkflowMenu();
    }
  }

  async novelWritingWorkflow() {
    console.log(chalk.bold.blue('\n📖 Novel Writing Workflow\n'));
    console.log(chalk.yellow('This workflow demonstrates how to use voice transcription for novel writing:\n'));
    console.log('1. Voice brainstorming for plot ideas');
    console.log('2. Character development through voice notes');
    console.log('3. Chapter outlining via dictation');
    console.log('4. Scene writing with voice input\n');

    await this.setupProject('novel-project');

    // Step 1: Voice brainstorming
    console.log(chalk.blue('📝 Step 1: Voice Brainstorming Session'));
    const { doBrainstorm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'doBrainstorm',
        message: 'Record a voice brainstorming session? (30 seconds)',
        default: true
      }
    ]);

    if (doBrainstorm) {
      console.log(chalk.green('\n🔴 Recording brainstorming session...'));
      console.log(chalk.gray('Speak about your story ideas, plot concepts, or themes...'));

      try {
        const result = await this.transcriber.recordAndTranscribe(
          path.join(this.projectDir, 'brainstorm-ideas.wav'),
          { maxDuration: 30, keepAudio: true }
        );

        if (result.text.trim()) {
          const brainstormFile = path.join(this.projectDir, 'brainstorm-notes.md');
          const content = this.formatNovelNote('Brainstorming Session', result.text, {
            type: 'ideas',
            duration: '30 seconds'
          });

          await fs.writeFile(brainstormFile, content);
          console.log(chalk.green(`✅ Brainstorm notes saved to: ${brainstormFile}`));
          console.log(chalk.cyan('💡 Ideas captured:'), chalk.white(this.truncateText(result.text, 100)));
        }
      } catch (error) {
        console.log(chalk.yellow('⚠️ Recording skipped or failed'));
      }
    }

    // Step 2: Character development
    console.log(chalk.blue('\n👤 Step 2: Character Development'));
    const { doCharacter } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'doCharacter',
        message: 'Create a character profile via voice? (45 seconds)',
        default: true
      }
    ]);

    if (doCharacter) {
      console.log(chalk.green('\n🔴 Recording character development...'));
      console.log(chalk.gray('Describe a character: appearance, personality, background, motivations...'));

      try {
        const result = await this.transcriber.recordAndTranscribe(null, {
          maxDuration: 45,
          keepAudio: false
        });

        if (result.text.trim()) {
          const characterFile = path.join(this.projectDir, 'character-profile.md');
          const content = this.formatNovelNote('Character Profile', result.text, {
            type: 'character',
            duration: '45 seconds'
          });

          await fs.writeFile(characterFile, content);
          console.log(chalk.green(`✅ Character profile saved to: ${characterFile}`));
        }
      } catch (error) {
        console.log(chalk.yellow('⚠️ Character recording skipped'));
      }
    }

    // Step 3: Chapter outline
    console.log(chalk.blue('\n📋 Step 3: Chapter Outline'));
    const { doOutline } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'doOutline',
        message: 'Create chapter outline via voice? (60 seconds)',
        default: true
      }
    ]);

    if (doOutline) {
      console.log(chalk.green('\n🔴 Recording chapter outline...'));
      console.log(chalk.gray('Outline your first chapter: setting, conflict, key events...'));

      try {
        const result = await this.transcriber.recordAndTranscribe(null, {
          maxDuration: 60,
          keepAudio: false
        });

        if (result.text.trim()) {
          const outlineFile = path.join(this.projectDir, 'chapter1-outline.md');
          const content = this.formatNovelNote('Chapter 1 Outline', result.text, {
            type: 'outline',
            chapter: 1
          });

          await fs.writeFile(outlineFile, content);
          console.log(chalk.green(`✅ Chapter outline saved to: ${outlineFile}`));
        }
      } catch (error) {
        console.log(chalk.yellow('⚠️ Outline recording skipped'));
      }
    }

    // Summary
    console.log(chalk.bold.green('\n🎉 Novel Writing Workflow Complete!'));
    console.log(chalk.cyan('\n📁 Files created in:'), chalk.white(this.projectDir));
    await this.showProjectFiles();
  }

  async contentCreationWorkflow() {
    console.log(chalk.bold.blue('\n📰 Content Creation Workflow\n'));
    console.log(chalk.yellow('This workflow shows how to turn voice recordings into polished content:\n'));
    console.log('1. Mock interview transcription');
    console.log('2. Extract key quotes and insights');
    console.log('3. Create article outline');
    console.log('4. Draft introduction via voice\n');

    await this.setupProject('content-project');

    // Step 1: Mock interview
    console.log(chalk.blue('🎤 Step 1: Mock Interview Transcription'));
    const { doInterview } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'doInterview',
        message: 'Record a mock interview? (90 seconds)',
        default: true
      }
    ]);

    if (doInterview) {
      console.log(chalk.green('\n🔴 Recording mock interview...'));
      console.log(chalk.gray('Pretend to interview someone about a topic you\'re interested in...'));
      console.log(chalk.gray('Include questions and answers, as if speaking for both people...'));

      try {
        const result = await this.transcriber.recordAndTranscribe(null, {
          maxDuration: 90,
          keepAudio: true
        });

        if (result.text.trim()) {
          const interviewFile = path.join(this.projectDir, 'interview-transcript.md');
          const content = this.formatContentNote('Interview Transcript', result.text, {
            type: 'interview',
            duration: '90 seconds'
          });

          await fs.writeFile(interviewFile, content);
          console.log(chalk.green(`✅ Interview transcript saved to: ${interviewFile}`));
        }
      } catch (error) {
        console.log(chalk.yellow('⚠️ Interview recording skipped'));
      }
    }

    // Step 2: Article outline
    console.log(chalk.blue('\n📝 Step 2: Article Outline Creation'));
    const { doArticleOutline } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'doArticleOutline',
        message: 'Create article outline via voice? (60 seconds)',
        default: true
      }
    ]);

    if (doArticleOutline) {
      console.log(chalk.green('\n🔴 Recording article outline...'));
      console.log(chalk.gray('Outline an article based on your interview: intro, main points, conclusion...'));

      try {
        const result = await this.transcriber.recordAndTranscribe(null, {
          maxDuration: 60,
          keepAudio: false
        });

        if (result.text.trim()) {
          const outlineFile = path.join(this.projectDir, 'article-outline.md');
          const content = this.formatContentNote('Article Outline', result.text, {
            type: 'outline'
          });

          await fs.writeFile(outlineFile, content);
          console.log(chalk.green(`✅ Article outline saved to: ${outlineFile}`));
        }
      } catch (error) {
        console.log(chalk.yellow('⚠️ Outline recording skipped'));
      }
    }

    console.log(chalk.bold.green('\n🎉 Content Creation Workflow Complete!'));
    await this.showProjectFiles();
  }

  async dailyWritingWorkflow() {
    console.log(chalk.bold.blue('\n✍️ Daily Writing Workflow\n'));
    console.log(chalk.yellow('This demonstrates using voice for daily writing practice:\n'));
    console.log('1. Morning pages via voice');
    console.log('2. Writing prompts response');
    console.log('3. Evening reflection\n');

    await this.setupProject('journal-project');
    const today = new Date().toISOString().slice(0, 10);

    // Morning pages
    console.log(chalk.blue('🌅 Morning Pages'));
    const { doMorning } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'doMorning',
        message: 'Record morning pages? (stream of consciousness - 90 seconds)',
        default: true
      }
    ]);

    if (doMorning) {
      console.log(chalk.green('\n🔴 Recording morning pages...'));
      console.log(chalk.gray('Speak your stream of consciousness: thoughts, feelings, plans...'));

      try {
        const result = await this.transcriber.recordAndTranscribe(null, {
          maxDuration: 90,
          keepAudio: false
        });

        if (result.text.trim()) {
          const morningFile = path.join(this.projectDir, `morning-pages-${today}.md`);
          const content = this.formatJournalEntry('Morning Pages', result.text, today);

          await fs.writeFile(morningFile, content);
          console.log(chalk.green(`✅ Morning pages saved to: ${morningFile}`));
        }
      } catch (error) {
        console.log(chalk.yellow('⚠️ Morning pages skipped'));
      }
    }

    // Writing prompt
    const prompts = [
      "Write about a door that should never be opened.",
      "Describe a world where colors have sounds.",
      "Tell the story of the last book on Earth.",
      "Write about finding a message in a bottle.",
      "Describe meeting your future self."
    ];

    const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];

    console.log(chalk.blue('\n✨ Writing Prompt Response'));
    console.log(chalk.cyan('Prompt:'), chalk.white(`"${randomPrompt}"`));

    const { doPrompt } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'doPrompt',
        message: 'Respond to this writing prompt? (90 seconds)',
        default: true
      }
    ]);

    if (doPrompt) {
      console.log(chalk.green('\n🔴 Recording prompt response...'));
      console.log(chalk.gray('Respond creatively to the prompt above...'));

      try {
        const result = await this.transcriber.recordAndTranscribe(null, {
          maxDuration: 90,
          keepAudio: false
        });

        if (result.text.trim()) {
          const promptFile = path.join(this.projectDir, `writing-prompt-${today}.md`);
          const content = `# Writing Prompt Response\n\n**Date:** ${new Date().toLocaleDateString()}\n**Prompt:** ${randomPrompt}\n\n---\n\n${result.text}`;

          await fs.writeFile(promptFile, content);
          console.log(chalk.green(`✅ Prompt response saved to: ${promptFile}`));
        }
      } catch (error) {
        console.log(chalk.yellow('⚠️ Prompt response skipped'));
      }
    }

    console.log(chalk.bold.green('\n🎉 Daily Writing Workflow Complete!'));
    await this.showProjectFiles();
  }

  async podcastNotesWorkflow() {
    console.log(chalk.bold.blue('\n🎙️ Podcast Notes Workflow\n'));
    console.log(chalk.yellow('Simulate transcribing and organizing podcast content:\n'));

    await this.setupProject('podcast-project');

    console.log(chalk.blue('📻 Mock Podcast Episode'));
    const { doPodcast } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'doPodcast',
        message: 'Record a mock podcast segment? (2 minutes)',
        default: true
      }
    ]);

    if (doPodcast) {
      console.log(chalk.green('\n🔴 Recording podcast segment...'));
      console.log(chalk.gray('Speak as if hosting a podcast: introduce topic, share insights...'));

      try {
        const result = await this.transcriber.recordAndTranscribe(null, {
          maxDuration: 120,
          keepAudio: true
        });

        if (result.text.trim()) {
          const podcastFile = path.join(this.projectDir, 'episode-transcript.md');
          const content = this.formatPodcastNote('Episode Transcript', result.text);

          await fs.writeFile(podcastFile, content);
          console.log(chalk.green(`✅ Podcast transcript saved to: ${podcastFile}`));

          // Extract key points (simplified)
          const keyPoints = this.extractKeyPoints(result.text);
          if (keyPoints.length > 0) {
            const summaryFile = path.join(this.projectDir, 'episode-summary.md');
            const summaryContent = `# Episode Summary\n\n## Key Points\n\n${keyPoints.map(point => `- ${point}`).join('\n')}\n\n## Full Transcript\n\nSee: episode-transcript.md`;

            await fs.writeFile(summaryFile, summaryContent);
            console.log(chalk.green(`✅ Episode summary saved to: ${summaryFile}`));
          }
        }
      } catch (error) {
        console.log(chalk.yellow('⚠️ Podcast recording skipped'));
      }
    }

    console.log(chalk.bold.green('\n🎉 Podcast Notes Workflow Complete!'));
    await this.showProjectFiles();
  }

  async meetingMinutesWorkflow() {
    console.log(chalk.bold.blue('\n📝 Meeting Minutes Workflow\n'));
    console.log(chalk.yellow('Transform voice memos into structured meeting minutes:\n'));

    await this.setupProject('meeting-project');

    console.log(chalk.blue('👥 Mock Meeting Recording'));
    const { doMeeting } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'doMeeting',
        message: 'Record mock meeting content? (90 seconds)',
        default: true
      }
    ]);

    if (doMeeting) {
      console.log(chalk.green('\n🔴 Recording meeting content...'));
      console.log(chalk.gray('Simulate meeting discussion: agenda items, decisions, action items...'));

      try {
        const result = await this.transcriber.recordAndTranscribe(null, {
          maxDuration: 90,
          keepAudio: false
        });

        if (result.text.trim()) {
          const meetingFile = path.join(this.projectDir, 'meeting-minutes.md');
          const content = this.formatMeetingMinutes('Team Meeting', result.text);

          await fs.writeFile(meetingFile, content);
          console.log(chalk.green(`✅ Meeting minutes saved to: ${meetingFile}`));
        }
      } catch (error) {
        console.log(chalk.yellow('⚠️ Meeting recording skipped'));
      }
    }

    console.log(chalk.bold.green('\n🎉 Meeting Minutes Workflow Complete!'));
    await this.showProjectFiles();
  }

  async quickDemo() {
    console.log(chalk.bold.blue('\n🏃 Quick Demo - 2 Minutes\n'));
    console.log(chalk.yellow('Fast demonstration of core voice features:\n'));

    await this.setupProject('quick-demo');

    // 30-second voice note
    console.log(chalk.blue('1. Quick Voice Note (30s)'));
    try {
      console.log(chalk.green('🔴 Recording quick note...'));
      const result1 = await this.transcriber.recordAndTranscribe(null, {
        maxDuration: 30,
        keepAudio: false
      });

      if (result1.text.trim()) {
        const noteFile = path.join(this.projectDir, 'quick-note.md');
        await fs.writeFile(noteFile, `# Quick Voice Note\n\n${result1.text}`);
        console.log(chalk.green('✅ Voice note saved'));
      }
    } catch (error) {
      console.log(chalk.yellow('⚠️ Quick note skipped'));
    }

    // System info
    console.log(chalk.blue('\n2. System Information'));
    const check = await this.transcriber.checkDependencies();
    console.log(chalk.green(`✅ System ready: ${check.isReady}`));
    console.log(chalk.cyan(`Supported formats: ${this.transcriber.getSupportedFormats().join(', ')}`));

    console.log(chalk.bold.green('\n🎉 Quick Demo Complete!'));
    await this.showProjectFiles();
  }

  async setupProject(name) {
    this.projectDir = `./${name}`;
    await fs.ensureDir(this.projectDir);
    console.log(chalk.cyan(`📁 Project directory: ${this.projectDir}`));
  }

  formatNovelNote(title, content, metadata = {}) {
    return `# ${title}

**Date:** ${new Date().toLocaleDateString()}
**Type:** ${metadata.type || 'note'}
${metadata.chapter ? `**Chapter:** ${metadata.chapter}` : ''}
${metadata.duration ? `**Duration:** ${metadata.duration}` : ''}

---

${content}

---

*Generated by Writers CLI Voice Transcription*`;
  }

  formatContentNote(title, content, metadata = {}) {
    return `# ${title}

**Date:** ${new Date().toLocaleDateString()}
**Type:** ${metadata.type || 'content'}
**Word Count:** ${content.split(/\s+/).length}

---

${content}

---

*Voice transcription for content creation workflow*`;
  }

  formatJournalEntry(title, content, date) {
    return `# ${title}

**Date:** ${date}
**Time:** ${new Date().toLocaleTimeString()}
**Word Count:** ${content.split(/\s+/).length}

---

${content}

---

*Daily writing practice via voice transcription*`;
  }

  formatPodcastNote(title, content) {
    return `# ${title}

**Date:** ${new Date().toLocaleDateString()}
**Duration:** ~2 minutes
**Word Count:** ${content.split(/\s+/).length}

---

${content}

---

*Podcast content transcribed with Writers CLI*`;
  }

  formatMeetingMinutes(title, content) {
    const date = new Date();
    return `# ${title}

**Date:** ${date.toLocaleDateString()}
**Time:** ${date.toLocaleTimeString()}
**Participants:** [Add participants]

## Discussion

${content}

## Action Items

- [ ] [Extract action items from discussion above]
- [ ] [Add more action items as needed]

## Next Steps

[Add next steps based on the discussion]

---

*Meeting minutes generated from voice recording*`;
  }

  extractKeyPoints(text) {
    // Simple key point extraction (look for sentences with keywords)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const keywordPatterns = /\b(important|key|main|essential|critical|significant|note|remember|focus)\b/i;

    return sentences
      .filter(sentence => keywordPatterns.test(sentence) || sentence.length > 50)
      .slice(0, 5) // Max 5 key points
      .map(sentence => sentence.trim());
  }

  truncateText(text, maxLength) {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  async showProjectFiles() {
    try {
      const files = await fs.readdir(this.projectDir);
      if (files.length > 0) {
        console.log(chalk.cyan('\n📄 Generated files:'));
        files.forEach(file => {
          console.log(chalk.white(`  • ${file}`));
        });
      }
    } catch (error) {
      // Directory might not exist or be empty
    }
  }
}

// Run example if called directly
if (require.main === module) {
  const example = new VoiceWorkflowExample();
  example.runWorkflow().catch(error => {
    console.error(chalk.red('\n💥 Workflow crashed:'), error.message);
    process.exit(1);
  });
}

module.exports = VoiceWorkflowExample;
