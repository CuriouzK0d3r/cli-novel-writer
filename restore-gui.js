#!/usr/bin/env node

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
