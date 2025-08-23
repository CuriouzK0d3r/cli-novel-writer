#!/usr/bin/env node

/**
 * Voice Integration Doctor
 * Diagnoses and helps fix voice integration issues
 */

const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');

class VoiceIntegrationDoctor {
    constructor() {
        this.projectRoot = __dirname;
        this.issues = [];
        this.fixes = [];
    }

    async diagnose() {
        console.log('\n🩺 Voice Integration Doctor');
        console.log('='.repeat(50));
        console.log('Diagnosing voice integration issues...\n');

        await this.checkFileStructure();
        await this.checkDependencies();
        await this.checkElectronConfig();
        await this.checkVoiceHandlers();
        await this.checkBrowserCompatibility();

        this.generateReport();
        await this.suggestFixes();
    }

    async checkFileStructure() {
        console.log('📁 Checking file structure...');

        const requiredFiles = [
            'gui/assets/js/voice-editor-integration.js',
            'gui/assets/css/voice-editor-integration.css',
            'src/voice/electron-handlers.js',
            'gui/main-enhanced.js',
            'gui/project-interface.html'
        ];

        for (const file of requiredFiles) {
            const filePath = path.join(this.projectRoot, file);
            const exists = await fs.pathExists(filePath);

            if (exists) {
                console.log(`  ✅ ${file}`);
            } else {
                console.log(`  ❌ ${file} - MISSING`);
                this.issues.push({
                    type: 'missing_file',
                    file: file,
                    severity: 'high',
                    description: `Required file ${file} is missing`
                });
            }
        }
    }

    async checkDependencies() {
        console.log('\n📦 Checking dependencies...');

        // Check package.json
        const packagePath = path.join(this.projectRoot, 'package.json');
        if (await fs.pathExists(packagePath)) {
            const packageData = JSON.parse(await fs.readFile(packagePath, 'utf8'));

            // Check for required scripts
            const requiredScripts = ['gui-enhanced', 'test:voice-editor', 'demo:voice-editor'];
            for (const script of requiredScripts) {
                if (packageData.scripts && packageData.scripts[script]) {
                    console.log(`  ✅ Script: ${script}`);
                } else {
                    console.log(`  ❌ Script: ${script} - MISSING`);
                    this.issues.push({
                        type: 'missing_script',
                        script: script,
                        severity: 'medium',
                        description: `Package.json missing ${script} script`
                    });
                }
            }

            // Check for Electron
            if (packageData.dependencies?.electron || packageData.devDependencies?.electron) {
                console.log('  ✅ Electron dependency found');
            } else {
                console.log('  ❌ Electron dependency - MISSING');
                this.issues.push({
                    type: 'missing_dependency',
                    dependency: 'electron',
                    severity: 'high',
                    description: 'Electron is required for voice integration'
                });
            }
        }
    }

    async checkElectronConfig() {
        console.log('\n⚡ Checking Electron configuration...');

        // Check main.js configuration
        const mainPath = path.join(this.projectRoot, 'gui/main.js');
        if (await fs.pathExists(mainPath)) {
            const mainContent = await fs.readFile(mainPath, 'utf8');

            if (mainContent.includes('nodeIntegration: true')) {
                console.log('  ✅ Node integration enabled');
            } else {
                console.log('  ❌ Node integration - DISABLED');
                this.issues.push({
                    type: 'electron_config',
                    setting: 'nodeIntegration',
                    severity: 'high',
                    description: 'Node integration must be enabled for voice features'
                });
            }

            if (mainContent.includes('contextIsolation: false')) {
                console.log('  ✅ Context isolation disabled');
            } else {
                console.log('  ❌ Context isolation - ENABLED');
                this.issues.push({
                    type: 'electron_config',
                    setting: 'contextIsolation',
                    severity: 'high',
                    description: 'Context isolation must be disabled for voice features'
                });
            }

            if (mainContent.includes('VoiceElectronHandlers')) {
                console.log('  ✅ Voice handlers imported');
            } else {
                console.log('  ❌ Voice handlers - NOT IMPORTED');
                this.issues.push({
                    type: 'electron_config',
                    setting: 'voice_handlers',
                    severity: 'high',
                    description: 'Voice electron handlers not imported in main.js'
                });
            }
        }
    }

    async checkVoiceHandlers() {
        console.log('\n🎤 Checking voice handlers...');

        const handlersPath = path.join(this.projectRoot, 'src/voice/electron-handlers.js');
        if (await fs.pathExists(handlersPath)) {
            const handlersContent = await fs.readFile(handlersPath, 'utf8');

            const requiredHandlers = [
                'voice-initialize',
                'save-temp-audio',
                'transcribe-audio'
            ];

            for (const handler of requiredHandlers) {
                if (handlersContent.includes(`"${handler}"`)) {
                    console.log(`  ✅ Handler: ${handler}`);
                } else {
                    console.log(`  ❌ Handler: ${handler} - MISSING`);
                    this.issues.push({
                        type: 'missing_handler',
                        handler: handler,
                        severity: 'high',
                        description: `IPC handler ${handler} not found`
                    });
                }
            }
        }
    }

    async checkBrowserCompatibility() {
        console.log('\n🌐 Checking browser compatibility...');

        // Create a simple test HTML to check APIs
        const testHtml = `
        <script>
            const results = {
                mediaRecorder: typeof MediaRecorder !== 'undefined',
                getUserMedia: navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function',
                audioContext: typeof (window.AudioContext || window.webkitAudioContext) !== 'undefined',
                webAudio: typeof AnalyserNode !== 'undefined'
            };

            console.log('Browser compatibility:', results);

            Object.entries(results).forEach(([api, supported]) => {
                console.log(supported ? '✅' : '❌', api);
            });
        </script>
        `;

        // For now, just check common issues
        console.log('  ⚠️  Browser compatibility check requires running GUI');
        console.log('  💡 Run `npm run gui-enhanced` and check browser console');
    }

    generateReport() {
        console.log('\n📊 Diagnosis Report');
        console.log('='.repeat(30));

        if (this.issues.length === 0) {
            console.log('🎉 No issues detected! Voice integration should work properly.');
            return;
        }

        const highIssues = this.issues.filter(i => i.severity === 'high');
        const mediumIssues = this.issues.filter(i => i.severity === 'medium');
        const lowIssues = this.issues.filter(i => i.severity === 'low');

        console.log(`Total issues found: ${this.issues.length}`);
        console.log(`🔴 High priority: ${highIssues.length}`);
        console.log(`🟡 Medium priority: ${mediumIssues.length}`);
        console.log(`🟢 Low priority: ${lowIssues.length}`);

        if (highIssues.length > 0) {
            console.log('\n🔴 High Priority Issues (Fix these first):');
            highIssues.forEach((issue, index) => {
                console.log(`  ${index + 1}. ${issue.description}`);
            });
        }

        if (mediumIssues.length > 0) {
            console.log('\n🟡 Medium Priority Issues:');
            mediumIssues.forEach((issue, index) => {
                console.log(`  ${index + 1}. ${issue.description}`);
            });
        }
    }

    async suggestFixes() {
        if (this.issues.length === 0) {
            console.log('\n✨ Recommendations:');
            console.log('  • Test voice integration: npm run test:voice-editor');
            console.log('  • Try the demo: npm run demo:voice-editor');
            console.log('  • Start enhanced GUI: npm run gui-enhanced');
            return;
        }

        console.log('\n🔧 Suggested Fixes');
        console.log('='.repeat(20));

        const fixMap = {
            missing_file: (issue) => {
                console.log(`📁 Missing file: ${issue.file}`);
                console.log(`   Fix: Ensure the voice integration files are properly installed`);
                console.log(`   Run: npm install && npm run test:voice-editor`);
            },
            missing_script: (issue) => {
                console.log(`📜 Missing script: ${issue.script}`);
                console.log(`   Fix: Add script to package.json:`);
                console.log(`   "${issue.script}": "..."`);
            },
            missing_dependency: (issue) => {
                console.log(`📦 Missing dependency: ${issue.dependency}`);
                console.log(`   Fix: Install dependency:`);
                console.log(`   npm install ${issue.dependency}`);
            },
            electron_config: (issue) => {
                console.log(`⚡ Electron config issue: ${issue.setting}`);
                if (issue.setting === 'nodeIntegration') {
                    console.log(`   Fix: Set nodeIntegration: true in webPreferences`);
                } else if (issue.setting === 'contextIsolation') {
                    console.log(`   Fix: Set contextIsolation: false in webPreferences`);
                } else if (issue.setting === 'voice_handlers') {
                    console.log(`   Fix: Import VoiceElectronHandlers in main.js`);
                }
            },
            missing_handler: (issue) => {
                console.log(`🎤 Missing IPC handler: ${issue.handler}`);
                console.log(`   Fix: Check src/voice/electron-handlers.js implementation`);
            }
        };

        // Group issues by type for cleaner output
        const groupedIssues = {};
        this.issues.forEach(issue => {
            if (!groupedIssues[issue.type]) {
                groupedIssues[issue.type] = [];
            }
            groupedIssues[issue.type].push(issue);
        });

        Object.entries(groupedIssues).forEach(([type, issues]) => {
            issues.forEach(issue => {
                if (fixMap[type]) {
                    fixMap[type](issue);
                    console.log('');
                }
            });
        });

        // Common fixes
        console.log('🔧 Common Solutions:');
        console.log('');
        console.log('1. Restart with enhanced GUI:');
        console.log('   npm run gui-enhanced');
        console.log('');
        console.log('2. Run full system test:');
        console.log('   npm run test:voice-editor');
        console.log('');
        console.log('3. Check microphone permissions:');
        console.log('   - Browser: Allow microphone access when prompted');
        console.log('   - System: Check privacy settings for microphone access');
        console.log('');
        console.log('4. Test voice functionality:');
        console.log('   npm run demo:voice-editor');
    }

    async runQuickFix() {
        console.log('\n🚀 Running Quick Fix...');

        // Check if we're in the right directory
        const packagePath = path.join(this.projectRoot, 'package.json');
        if (!(await fs.pathExists(packagePath))) {
            console.log('❌ Not in Writers CLI project directory');
            return false;
        }

        try {
            // Try to run the voice test
            console.log('Running voice integration test...');

            const testProcess = spawn('npm', ['run', 'test:voice-editor'], {
                cwd: this.projectRoot,
                stdio: 'pipe'
            });

            return new Promise((resolve) => {
                let output = '';

                testProcess.stdout.on('data', (data) => {
                    output += data.toString();
                });

                testProcess.stderr.on('data', (data) => {
                    output += data.toString();
                });

                testProcess.on('close', (code) => {
                    if (code === 0) {
                        console.log('✅ Voice integration test passed!');
                        console.log('\n🎉 Voice integration is working properly.');
                        console.log('\nNext steps:');
                        console.log('• Run: npm run gui-enhanced');
                        console.log('• Open a file and try the 🎤 voice button');
                        console.log('• Or press Ctrl+Shift+V for voice dictation');
                    } else {
                        console.log('❌ Voice integration test failed');
                        console.log('Check the output above for specific errors');
                    }
                    resolve(code === 0);
                });
            });

        } catch (error) {
            console.log('❌ Quick fix failed:', error.message);
            return false;
        }
    }
}

// CLI interface
async function main() {
    const args = process.argv.slice(2);
    const doctor = new VoiceIntegrationDoctor();

    if (args.includes('--fix') || args.includes('-f')) {
        const success = await doctor.runQuickFix();
        if (!success) {
            console.log('\nQuick fix unsuccessful. Running full diagnosis...');
            await doctor.diagnose();
        }
    } else if (args.includes('--help') || args.includes('-h')) {
        console.log('\n🩺 Voice Integration Doctor');
        console.log('\nUsage:');
        console.log('  node voice-integration-doctor.js          # Run full diagnosis');
        console.log('  node voice-integration-doctor.js --fix    # Try quick fix first');
        console.log('  node voice-integration-doctor.js --help   # Show this help');
        console.log('\nThis tool helps diagnose and fix voice integration issues.');
    } else {
        await doctor.diagnose();
    }
}

if (require.main === module) {
    main().catch(error => {
        console.error('\n❌ Doctor encountered an error:', error.message);
        process.exit(1);
    });
}

module.exports = VoiceIntegrationDoctor;
