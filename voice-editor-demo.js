#!/usr/bin/env node

/**
 * Voice Editor Integration Demo
 * Demonstrates the integrated voice dictation functionality in the Writers CLI GUI
 */

const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs-extra');

class VoiceEditorDemo {
    constructor() {
        this.projectRoot = __dirname;
        this.demoContent = this.generateDemoContent();
    }

    async run() {
        console.log('\n🎤 Writers CLI - Voice Editor Integration Demo');
        console.log('='.repeat(50));

        try {
            // Check if GUI files exist
            await this.checkRequiredFiles();

            // Create demo project structure
            await this.setupDemoProject();

            // Start the enhanced GUI
            await this.launchGUI();

        } catch (error) {
            console.error('❌ Demo failed:', error.message);
            process.exit(1);
        }
    }

    async checkRequiredFiles() {
        console.log('\n📋 Checking required files...');

        const requiredFiles = [
            'gui/project-interface.html',
            'gui/assets/js/voice-editor-integration.js',
            'gui/assets/css/voice-editor-integration.css',
            'gui/main-enhanced.js',
            'src/voice/electron-handlers.js'
        ];

        for (const file of requiredFiles) {
            const filePath = path.join(this.projectRoot, file);
            if (!(await fs.pathExists(filePath))) {
                throw new Error(`Required file missing: ${file}`);
            }
            console.log(`✅ ${file}`);
        }
    }

    async setupDemoProject() {
        console.log('\n📝 Setting up demo project...');

        // Create demo directories
        const demoDir = path.join(this.projectRoot, 'demo-voice-project');
        await fs.ensureDir(demoDir);
        await fs.ensureDir(path.join(demoDir, 'chapters'));
        await fs.ensureDir(path.join(demoDir, 'scenes'));

        // Create demo files with sample content
        const demoFiles = [
            {
                path: path.join(demoDir, 'chapters', 'chapter-1.md'),
                content: this.demoContent.chapter1
            },
            {
                path: path.join(demoDir, 'scenes', 'opening-scene.md'),
                content: this.demoContent.openingScene
            },
            {
                path: path.join(demoDir, 'project.json'),
                content: JSON.stringify(this.demoContent.projectConfig, null, 2)
            }
        ];

        for (const file of demoFiles) {
            await fs.writeFile(file.path, file.content);
            console.log(`📄 Created: ${path.relative(this.projectRoot, file.path)}`);
        }

        console.log(`✅ Demo project created at: ${path.relative(this.projectRoot, demoDir)}`);
    }

    async launchGUI() {
        console.log('\n🚀 Launching Enhanced GUI with Voice Integration...');
        console.log('\nVoice Features Available:');
        console.log('• 🎤 Voice dictation button in editor toolbar');
        console.log('• ⌨️  Keyboard shortcut: Ctrl+Shift+V');
        console.log('• 🎯 Focus mode voice controls');
        console.log('• 🔄 Real-time transcription');
        console.log('• ⚙️  Voice settings and preferences');
        console.log('• 📝 Auto-insert at cursor position');

        console.log('\nHow to use Voice Dictation:');
        console.log('1. Open a file for editing');
        console.log('2. Click the voice button 🎤 or press Ctrl+Shift+V');
        console.log('3. Click the record button and start speaking');
        console.log('4. Click stop when finished');
        console.log('5. Review and insert the transcribed text');

        console.log('\n📱 Starting GUI...');

        // Launch the enhanced GUI
        const guiProcess = spawn('npm', ['run', 'gui-enhanced'], {
            cwd: this.projectRoot,
            stdio: 'inherit',
            shell: true
        });

        guiProcess.on('error', (error) => {
            console.error('❌ Failed to start GUI:', error.message);
            console.log('\nTry running manually: npm run gui-enhanced');
        });

        guiProcess.on('exit', (code) => {
            console.log(`\n📱 GUI exited with code ${code}`);
        });

        // Handle process cleanup
        process.on('SIGINT', () => {
            console.log('\n🛑 Stopping demo...');
            guiProcess.kill('SIGINT');
            process.exit(0);
        });
    }

    generateDemoContent() {
        return {
            projectConfig: {
                name: 'Voice Demo Novel',
                author: 'Voice Writer',
                type: 'novel',
                description: 'A demonstration project for voice dictation features',
                created: new Date().toISOString(),
                settings: {
                    voiceEnabled: true,
                    autoSave: true,
                    language: 'en-US'
                }
            },
            chapter1: `# Chapter 1: The Beginning

*This chapter was created to demonstrate voice dictation features.*

## Getting Started

This is a sample chapter where you can test the voice dictation functionality. Try the following:

1. **Place your cursor** anywhere in this text
2. **Press Ctrl+Shift+V** or click the voice button 🎤
3. **Start speaking** when the recording begins
4. **Review the transcription** and insert it

## Voice Tips

- Speak clearly and at a moderate pace
- Pause briefly between sentences
- Use punctuation commands like "comma", "period", "question mark"
- Say "new paragraph" to start a new line

## Sample Content

The old lighthouse stood weathered against the rocky coast, its beacon long since extinguished. Sarah approached cautiously, the salty wind whipping her hair across her face. She had come here seeking answers, but found only more questions.

*Try adding more content here using voice dictation!*
`,
            openingScene: `# Opening Scene: The Lighthouse

*Use voice dictation to expand this scene.*

## Setting
- Time: Sunset
- Location: Abandoned lighthouse on the coast
- Weather: Windy, overcast

## Characters
- Sarah: Protagonist, seeking answers about her past
- The lighthouse: Silent witness to forgotten secrets

## Scene Description

[Use voice dictation to describe the scene in detail]

## Dialogue

"Hello?" Sarah called out, her voice barely audible over the wind.

[Add more dialogue using voice dictation]

## Notes

*Voice dictation is perfect for:*
- Capturing dialogue naturally
- Describing action sequences
- Adding emotional depth
- Quick note-taking during inspiration
`
        };
    }
}

// CLI Interface
if (require.main === module) {
    const demo = new VoiceEditorDemo();
    demo.run().catch(error => {
        console.error('Demo error:', error);
        process.exit(1);
    });
}

module.exports = VoiceEditorDemo;
