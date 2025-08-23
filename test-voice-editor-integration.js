#!/usr/bin/env node

/**
 * Voice Editor Integration Test
 * Tests the integrated voice dictation functionality
 */

const path = require('path');
const fs = require('fs-extra');
const { spawn } = require('child_process');

class VoiceEditorIntegrationTest {
    constructor() {
        this.projectRoot = __dirname;
        this.testResults = [];
    }

    async runTests() {
        console.log('\n🧪 Voice Editor Integration Test Suite');
        console.log('='.repeat(50));

        try {
            await this.testFileStructure();
            await this.testCSSIntegration();
            await this.testJavaScriptIntegration();
            await this.testElectronHandlers();
            await this.testConfigurationFiles();
            await this.generateTestReport();

        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
            process.exit(1);
        }
    }

    async testFileStructure() {
        console.log('\n📁 Testing file structure...');

        const requiredFiles = [
            // Core voice integration files
            'gui/assets/js/voice-editor-integration.js',
            'gui/assets/css/voice-editor-integration.css',

            // Existing voice system files
            'src/voice/electron-handlers.js',
            'gui/assets/js/voice-transcription.js',
            'gui/assets/css/voice-transcription.css',

            // GUI integration files
            'gui/project-interface.html',
            'gui/main-enhanced.js',

            // Documentation and demos
            'VOICE_EDITOR_INTEGRATION.md',
            'voice-editor-demo.js'
        ];

        for (const file of requiredFiles) {
            const filePath = path.join(this.projectRoot, file);
            const exists = await fs.pathExists(filePath);

            this.testResults.push({
                test: `File exists: ${file}`,
                passed: exists,
                details: exists ? 'Found' : 'Missing'
            });

            if (exists) {
                console.log(`  ✅ ${file}`);
            } else {
                console.log(`  ❌ ${file} - MISSING`);
            }
        }
    }

    async testCSSIntegration() {
        console.log('\n🎨 Testing CSS integration...');

        const htmlFile = path.join(this.projectRoot, 'gui/project-interface.html');

        if (await fs.pathExists(htmlFile)) {
            const htmlContent = await fs.readFile(htmlFile, 'utf8');
            const hasCSSLink = htmlContent.includes('voice-editor-integration.css');

            this.testResults.push({
                test: 'CSS file linked in HTML',
                passed: hasCSSLink,
                details: hasCSSLink ? 'voice-editor-integration.css linked' : 'CSS link missing'
            });

            console.log(`  ${hasCSSLink ? '✅' : '❌'} CSS integration: ${hasCSSLink ? 'Linked' : 'Missing'}`);
        }

        // Check CSS file content
        const cssFile = path.join(this.projectRoot, 'gui/assets/css/voice-editor-integration.css');
        if (await fs.pathExists(cssFile)) {
            const cssContent = await fs.readFile(cssFile, 'utf8');

            const requiredClasses = [
                '.voice-controls-container',
                '.btn-voice',
                '.voice-popup',
                '.voice-record-button',
                '.voice-floating-controls',
                '.voice-toast'
            ];

            let classesFound = 0;
            for (const className of requiredClasses) {
                if (cssContent.includes(className)) {
                    classesFound++;
                }
            }

            const allClassesPresent = classesFound === requiredClasses.length;
            this.testResults.push({
                test: 'Required CSS classes present',
                passed: allClassesPresent,
                details: `${classesFound}/${requiredClasses.length} classes found`
            });

            console.log(`  ${allClassesPresent ? '✅' : '❌'} CSS classes: ${classesFound}/${requiredClasses.length}`);
        }
    }

    async testJavaScriptIntegration() {
        console.log('\n📜 Testing JavaScript integration...');

        const htmlFile = path.join(this.projectRoot, 'gui/project-interface.html');

        if (await fs.pathExists(htmlFile)) {
            const htmlContent = await fs.readFile(htmlFile, 'utf8');
            const hasJSScript = htmlContent.includes('voice-editor-integration.js');

            this.testResults.push({
                test: 'JavaScript file linked in HTML',
                passed: hasJSScript,
                details: hasJSScript ? 'voice-editor-integration.js linked' : 'Script tag missing'
            });

            console.log(`  ${hasJSScript ? '✅' : '❌'} JS integration: ${hasJSScript ? 'Linked' : 'Missing'}`);
        }

        // Check JavaScript file content
        const jsFile = path.join(this.projectRoot, 'gui/assets/js/voice-editor-integration.js');
        if (await fs.pathExists(jsFile)) {
            const jsContent = await fs.readFile(jsFile, 'utf8');

            const requiredMethods = [
                'class VoiceEditorIntegration',
                'createVoiceControls',
                'bindEvents',
                'startRecording',
                'stopRecording',
                'transcribeAudio',
                'insertTextAtCursor',
                'toggleVoicePopup'
            ];

            let methodsFound = 0;
            for (const method of requiredMethods) {
                if (jsContent.includes(method)) {
                    methodsFound++;
                }
            }

            const allMethodsPresent = methodsFound === requiredMethods.length;
            this.testResults.push({
                test: 'Required JavaScript methods present',
                passed: allMethodsPresent,
                details: `${methodsFound}/${requiredMethods.length} methods found`
            });

            console.log(`  ${allMethodsPresent ? '✅' : '❌'} JS methods: ${methodsFound}/${requiredMethods.length}`);

            // Check for proper error handling
            const hasErrorHandling = jsContent.includes('catch (error)') && jsContent.includes('try {');
            this.testResults.push({
                test: 'Error handling implemented',
                passed: hasErrorHandling,
                details: hasErrorHandling ? 'Try-catch blocks found' : 'Error handling missing'
            });

            console.log(`  ${hasErrorHandling ? '✅' : '❌'} Error handling: ${hasErrorHandling ? 'Present' : 'Missing'}`);
        }
    }

    async testElectronHandlers() {
        console.log('\n⚡ Testing Electron IPC handlers...');

        const handlersFile = path.join(this.projectRoot, 'src/voice/electron-handlers.js');

        if (await fs.pathExists(handlersFile)) {
            const handlersContent = await fs.readFile(handlersFile, 'utf8');

            const requiredHandlers = [
                'save-temp-audio',
                'transcribe-audio',
                'voice-initialize'
            ];

            let handlersFound = 0;
            for (const handler of requiredHandlers) {
                if (handlersContent.includes(`"${handler}"`)) {
                    handlersFound++;
                }
            }

            const allHandlersPresent = handlersFound === requiredHandlers.length;
            this.testResults.push({
                test: 'IPC handlers present',
                passed: allHandlersPresent,
                details: `${handlersFound}/${requiredHandlers.length} handlers found`
            });

            console.log(`  ${allHandlersPresent ? '✅' : '❌'} IPC handlers: ${handlersFound}/${requiredHandlers.length}`);

            // Check for proper async handling
            const hasAsyncHandling = handlersContent.includes('async (event,') || handlersContent.includes('async(event,');
            this.testResults.push({
                test: 'Async IPC handling',
                passed: hasAsyncHandling,
                details: hasAsyncHandling ? 'Async handlers found' : 'Async handling missing'
            });

            console.log(`  ${hasAsyncHandling ? '✅' : '❌'} Async handling: ${hasAsyncHandling ? 'Present' : 'Missing'}`);
        } else {
            this.testResults.push({
                test: 'Electron handlers file exists',
                passed: false,
                details: 'File not found'
            });
        }
    }

    async testConfigurationFiles() {
        console.log('\n⚙️ Testing configuration files...');

        // Test enhanced launcher configuration
        const launcherFile = path.join(this.projectRoot, 'gui-enhanced-launcher.js');

        if (await fs.pathExists(launcherFile)) {
            const launcherContent = await fs.readFile(launcherFile, 'utf8');
            const hasVoiceConfig = launcherContent.includes('voice:') && launcherContent.includes('enabled: true');

            this.testResults.push({
                test: 'Voice config in enhanced launcher',
                passed: hasVoiceConfig,
                details: hasVoiceConfig ? 'Voice configuration found' : 'Voice config missing'
            });

            console.log(`  ${hasVoiceConfig ? '✅' : '❌'} Enhanced launcher config: ${hasVoiceConfig ? 'Present' : 'Missing'}`);
        }

        // Test package.json scripts
        const packageFile = path.join(this.projectRoot, 'package.json');

        if (await fs.pathExists(packageFile)) {
            const packageContent = await fs.readFile(packageFile, 'utf8');
            const packageData = JSON.parse(packageContent);

            const hasDemoScript = packageData.scripts && packageData.scripts['demo:voice-editor'];

            this.testResults.push({
                test: 'Demo script in package.json',
                passed: hasDemoScript,
                details: hasDemoScript ? 'demo:voice-editor script found' : 'Demo script missing'
            });

            console.log(`  ${hasDemoScript ? '✅' : '❌'} Package.json demo script: ${hasDemoScript ? 'Present' : 'Missing'}`);
        }
    }

    async generateTestReport() {
        console.log('\n📊 Test Results Summary');
        console.log('='.repeat(50));

        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(result => result.passed).length;
        const failedTests = totalTests - passedTests;

        console.log(`Total tests: ${totalTests}`);
        console.log(`Passed: ${passedTests} ✅`);
        console.log(`Failed: ${failedTests} ❌`);
        console.log(`Success rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

        if (failedTests > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults
                .filter(result => !result.passed)
                .forEach(result => {
                    console.log(`  - ${result.test}: ${result.details}`);
                });
        }

        // Generate detailed test report file
        const reportData = {
            timestamp: new Date().toISOString(),
            summary: {
                total: totalTests,
                passed: passedTests,
                failed: failedTests,
                successRate: ((passedTests / totalTests) * 100).toFixed(1) + '%'
            },
            tests: this.testResults,
            recommendations: this.generateRecommendations()
        };

        const reportPath = path.join(this.projectRoot, 'voice-integration-test-report.json');
        await fs.writeFile(reportPath, JSON.stringify(reportData, null, 2));
        console.log(`\n📄 Detailed report saved to: voice-integration-test-report.json`);

        if (passedTests === totalTests) {
            console.log('\n🎉 All tests passed! Voice editor integration is ready to use.');
            console.log('\nTo test the integration:');
            console.log('1. Run: npm run demo:voice-editor');
            console.log('2. Or: npm run gui-enhanced');
            console.log('3. Open a file and try the voice button 🎤');
        } else {
            console.log('\n⚠️  Some tests failed. Please address the issues before using voice integration.');
            process.exit(1);
        }
    }

    generateRecommendations() {
        const recommendations = [];
        const failedTests = this.testResults.filter(result => !result.passed);

        if (failedTests.length === 0) {
            recommendations.push('All integration tests passed successfully');
            recommendations.push('Consider running the demo script to test functionality');
            recommendations.push('Test voice dictation with different browsers and audio devices');
        } else {
            failedTests.forEach(test => {
                switch (test.test) {
                    case 'CSS file linked in HTML':
                        recommendations.push('Add voice-editor-integration.css link to project-interface.html');
                        break;
                    case 'JavaScript file linked in HTML':
                        recommendations.push('Add voice-editor-integration.js script tag to project-interface.html');
                        break;
                    case 'IPC handlers present':
                        recommendations.push('Ensure all required IPC handlers are implemented in electron-handlers.js');
                        break;
                    case 'Voice config in enhanced launcher':
                        recommendations.push('Add voice configuration section to gui-enhanced-launcher.js');
                        break;
                    default:
                        recommendations.push(`Fix issue: ${test.test} - ${test.details}`);
                }
            });
        }

        return recommendations;
    }
}

// CLI Interface
if (require.main === module) {
    const test = new VoiceEditorIntegrationTest();
    test.runTests().catch(error => {
        console.error('Test error:', error);
        process.exit(1);
    });
}

module.exports = VoiceEditorIntegrationTest;
