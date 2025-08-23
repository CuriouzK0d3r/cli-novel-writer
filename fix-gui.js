#!/usr/bin/env node

/**
 * Fix GUI Script - Resolves the stuck project creation menu issue
 * This script updates the Writers CLI to use the fixed GUI interface
 */

const fs = require('fs-extra');
const path = require('path');

async function fixGUI() {
  console.log('🔧 Fixing Writers CLI GUI...');
  console.log('============================');

  try {
    const projectRoot = __dirname;

    // Backup original files
    console.log('📦 Creating backups...');

    const originalMainJs = path.join(projectRoot, 'gui', 'main.js');
    const originalInterface = path.join(projectRoot, 'gui', 'project-interface.html');
    const fixedMainJs = path.join(projectRoot, 'gui', 'main-fixed.js');
    const fixedInterface = path.join(projectRoot, 'gui', 'project-interface-fixed.html');

    const backupDir = path.join(projectRoot, 'backups', 'gui-original');
    await fs.ensureDir(backupDir);

    // Backup original files if they exist and backups don't exist
    if (await fs.pathExists(originalMainJs)) {
      const backupMainJs = path.join(backupDir, 'main.js');
      if (!await fs.pathExists(backupMainJs)) {
        await fs.copy(originalMainJs, backupMainJs);
        console.log('✅ Backed up original main.js');
      }
    }

    if (await fs.pathExists(originalInterface)) {
      const backupInterface = path.join(backupDir, 'project-interface.html');
      if (!await fs.pathExists(backupInterface)) {
        await fs.copy(originalInterface, backupInterface);
        console.log('✅ Backed up original project-interface.html');
      }
    }

    // Check if fixed files exist
    if (!await fs.pathExists(fixedMainJs)) {
      throw new Error('Fixed main.js file not found. Please ensure main-fixed.js exists.');
    }

    if (!await fs.pathExists(fixedInterface)) {
      throw new Error('Fixed interface file not found. Please ensure project-interface-fixed.html exists.');
    }

    // Replace main.js with fixed version
    console.log('🔄 Updating main GUI files...');
    await fs.copy(fixedMainJs, originalMainJs);
    console.log('✅ Updated main.js');

    // Replace interface with fixed version
    await fs.copy(fixedInterface, originalInterface);
    console.log('✅ Updated project-interface.html');

    // Update package.json scripts if needed
    const packageJsonPath = path.join(projectRoot, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJson(packageJsonPath);

      // Ensure gui script exists and points to correct file
      if (!packageJson.scripts) {
        packageJson.scripts = {};
      }

      packageJson.scripts.gui = 'electron gui/main.js';
      packageJson.scripts['gui-debug'] = 'electron gui-fixed-launcher.js';

      await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
      console.log('✅ Updated package.json scripts');
    }

    console.log('\n🎉 GUI Fix Complete!');
    console.log('====================');
    console.log('✅ Project creation menu issue has been resolved');
    console.log('✅ GUI now shows proper welcome screen with two options:');
    console.log('   • Create New Project');
    console.log('   • Open Existing Project');
    console.log('✅ Project creation workflow now works properly');
    console.log('✅ Original files backed up to:', backupDir);
    console.log('');
    console.log('🚀 You can now launch the GUI with:');
    console.log('   npm run gui');
    console.log('   or');
    console.log('   npx electron gui/main.js');
    console.log('');
    console.log('🐛 For debugging, you can use:');
    console.log('   npm run gui-debug');
    console.log('   or');
    console.log('   npx electron gui-fixed-launcher.js');

  } catch (error) {
    console.error('❌ Error fixing GUI:', error.message);
    console.error('');
    console.error('🔍 Troubleshooting:');
    console.error('1. Make sure you are running this script from the writers-cli root directory');
    console.error('2. Ensure the fixed files (main-fixed.js and project-interface-fixed.html) exist');
    console.error('3. Check that you have write permissions to the gui directory');
    process.exit(1);
  }
}

// Create restore script
async function createRestoreScript() {
  const restoreScript = `#!/usr/bin/env node

/**
 * Restore Original GUI - Restores the original GUI files
 */

const fs = require('fs-extra');
const path = require('path');

async function restoreGUI() {
  console.log('🔄 Restoring original GUI files...');

  try {
    const projectRoot = __dirname;
    const backupDir = path.join(projectRoot, 'backups', 'gui-original');

    const originalMainJs = path.join(projectRoot, 'gui', 'main.js');
    const originalInterface = path.join(projectRoot, 'gui', 'project-interface.html');
    const backupMainJs = path.join(backupDir, 'main.js');
    const backupInterface = path.join(backupDir, 'project-interface.html');

    if (await fs.pathExists(backupMainJs)) {
      await fs.copy(backupMainJs, originalMainJs);
      console.log('✅ Restored main.js');
    }

    if (await fs.pathExists(backupInterface)) {
      await fs.copy(backupInterface, originalInterface);
      console.log('✅ Restored project-interface.html');
    }

    console.log('🎉 Original GUI files restored!');

  } catch (error) {
    console.error('❌ Error restoring GUI:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  restoreGUI();
}
`;

  const restoreScriptPath = path.join(__dirname, 'restore-gui.js');
  await fs.writeFile(restoreScriptPath, restoreScript);
  console.log('📝 Created restore script at:', restoreScriptPath);
}

// Run the fix
if (require.main === module) {
  fixGUI().then(async () => {
    await createRestoreScript();
    console.log('');
    console.log('💡 If you ever need to restore the original GUI, run:');
    console.log('   node restore-gui.js');
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { fixGUI, createRestoreScript };
