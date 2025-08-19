#!/usr/bin/env node

/**
 * Writers CLI - Enhanced Editor Setup Script
 *
 * This script ensures all enhanced editor features are properly integrated
 * and sets up the improved writing environment.
 */

const fs = require('fs');
const path = require('path');

class EnhancedEditorSetup {
    constructor() {
        this.baseDir = __dirname;
        this.guiDir = path.join(this.baseDir, 'gui');
        this.assetsDir = path.join(this.guiDir, 'assets');
        this.errors = [];
        this.warnings = [];
        this.success = [];
    }

    async run() {
        console.log('🎨 Setting up Enhanced Editor Features...\n');

        try {
            await this.checkDirectories();
            await this.verifyFiles();
            await this.updateHtmlFiles();
            await this.createBackups();
            await this.initializeSettings();

            this.printResults();

        } catch (error) {
            console.error('❌ Setup failed:', error.message);
            process.exit(1);
        }
    }

    async checkDirectories() {
        const requiredDirs = [
            'gui',
            'gui/assets',
            'gui/assets/css',
            'gui/assets/js',
            'gui/assets/themes'
        ];

        for (const dir of requiredDirs) {
            const fullPath = path.join(this.baseDir, dir);
            if (!fs.existsSync(fullPath)) {
                fs.mkdirSync(fullPath, { recursive: true });
                this.success.push(`Created directory: ${dir}`);
            }
        }
    }

    async verifyFiles() {
        const requiredFiles = [
            'gui/assets/css/editor-enhancements.css',
            'gui/assets/css/theme-selector.css',
            'gui/assets/themes/writer-warm.css',
            'gui/assets/themes/forest-calm.css',
            'gui/assets/js/editor-enhancements.js',
            'gui/assets/js/theme-selector.js'
        ];

        for (const file of requiredFiles) {
            const fullPath = path.join(this.baseDir, file);
            if (fs.existsSync(fullPath)) {
                this.success.push(`✓ Found: ${file}`);
            } else {
                this.errors.push(`✗ Missing: ${file}`);
            }
        }
    }

    async updateHtmlFiles() {
        const htmlFile = path.join(this.guiDir, 'project-interface.html');

        if (!fs.existsSync(htmlFile)) {
            this.errors.push('Missing project-interface.html file');
            return;
        }

        let content = fs.readFileSync(htmlFile, 'utf8');
        let modified = false;

        // Check for enhanced CSS imports
        const cssImports = [
            '<link rel="stylesheet" href="assets/css/editor-enhancements.css" />',
            '<link rel="stylesheet" href="assets/css/theme-selector.css" />'
        ];

        for (const cssImport of cssImports) {
            if (!content.includes(cssImport)) {
                // Add after the main styles.css import
                content = content.replace(
                    '<link rel="stylesheet" href="assets/css/styles.css" />',
                    `<link rel="stylesheet" href="assets/css/styles.css" />\n        ${cssImport}`
                );
                modified = true;
            }
        }

        // Check for Google Fonts preconnect
        const fontPreconnects = [
            '<link rel="preconnect" href="https://fonts.googleapis.com" />',
            '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />'
        ];

        for (const preconnect of fontPreconnects) {
            if (!content.includes(preconnect)) {
                content = content.replace(
                    '</head>',
                    `        ${preconnect}\n    </head>`
                );
                modified = true;
            }
        }

        // Check for enhanced JS imports
        const jsImports = [
            '<script src="assets/js/theme-selector.js"></script>',
            '<script src="assets/js/editor-enhancements.js"></script>'
        ];

        for (const jsImport of jsImports) {
            if (!content.includes(jsImport)) {
                content = content.replace(
                    '<script src="assets/js/app.js"></script>',
                    `        ${jsImport}\n        <script src="assets/js/app.js"></script>`
                );
                modified = true;
            }
        }

        if (modified) {
            fs.writeFileSync(htmlFile, content);
            this.success.push('Updated project-interface.html with enhanced imports');
        } else {
            this.success.push('project-interface.html already up to date');
        }
    }

    async createBackups() {
        const backupDir = path.join(this.baseDir, 'backups', 'pre-enhanced');

        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        const filesToBackup = [
            'gui/project-interface.html',
            'gui/assets/css/styles.css'
        ];

        for (const file of filesToBackup) {
            const sourcePath = path.join(this.baseDir, file);
            if (fs.existsSync(sourcePath)) {
                const backupPath = path.join(backupDir, path.basename(file));
                if (!fs.existsSync(backupPath)) {
                    fs.copyFileSync(sourcePath, backupPath);
                    this.success.push(`Created backup: ${path.basename(file)}`);
                }
            }
        }
    }

    async initializeSettings() {
        const settingsFile = path.join(this.baseDir, 'enhanced-editor-settings.json');

        const defaultSettings = {
            version: "1.0.0",
            features: {
                enhancedEditor: true,
                themeSelector: true,
                writerWarmTheme: true,
                forestCalmTheme: true,
                advancedTypography: true,
                writingModes: true,
                autoSave: true,
                smartNotifications: true
            },
            themes: {
                available: [
                    "light",
                    "dark",
                    "writer-warm",
                    "forest-calm",
                    "sepia",
                    "nord",
                    "monokai",
                    "high-contrast"
                ],
                default: "light"
            },
            typography: {
                defaultFont: "Crimson Text",
                defaultSize: 16,
                defaultLineHeight: 1.8
            },
            setupDate: new Date().toISOString(),
            setupBy: "enhanced-editor-setup.js"
        };

        if (!fs.existsSync(settingsFile)) {
            fs.writeFileSync(settingsFile, JSON.stringify(defaultSettings, null, 2));
            this.success.push('Created enhanced editor settings file');
        } else {
            this.success.push('Enhanced editor settings file already exists');
        }
    }

    printResults() {
        console.log('\n📊 Setup Results:\n');

        if (this.success.length > 0) {
            console.log('✅ Success:');
            this.success.forEach(msg => console.log(`   ${msg}`));
            console.log('');
        }

        if (this.warnings.length > 0) {
            console.log('⚠️  Warnings:');
            this.warnings.forEach(msg => console.log(`   ${msg}`));
            console.log('');
        }

        if (this.errors.length > 0) {
            console.log('❌ Errors:');
            this.errors.forEach(msg => console.log(`   ${msg}`));
            console.log('');
            console.log('Please fix the errors above and run the setup again.');
            process.exit(1);
        }

        console.log('🎉 Enhanced Editor Setup Complete!\n');
        console.log('New Features Available:');
        console.log('  • Beautiful new themes (Writer Warm, Forest Calm)');
        console.log('  • Enhanced typography with premium fonts');
        console.log('  • Advanced theme customization panel');
        console.log('  • Improved writing modes (Typewriter, Focus, Zen)');
        console.log('  • Smart auto-save and session management');
        console.log('  • Real-time writing statistics');
        console.log('  • Smooth animations and transitions');
        console.log('  • Better accessibility features');
        console.log('');
        console.log('🎨 To access themes: Click the palette icon in the navbar');
        console.log('⌨️  Keyboard shortcuts: Ctrl/Cmd + , for theme panel');
        console.log('📚 Documentation: See ENHANCED_EDITOR_FEATURES.md');
        console.log('');
        console.log('Happy writing! ✍️');
    }
}

// Run the setup if this file is executed directly
if (require.main === module) {
    const setup = new EnhancedEditorSetup();
    setup.run().catch(error => {
        console.error('Setup failed:', error);
        process.exit(1);
    });
}

module.exports = EnhancedEditorSetup;
