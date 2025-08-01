const { Menu } = require('electron');

class MenuService {
  constructor() {
    this.callbacks = {};
  }

  /**
   * Create the main application menu template
   */
  createMenuTemplate(callbacks = {}) {
    this.callbacks = callbacks;

    const isMac = process.platform === 'darwin';

    const template = [
      // macOS app menu
      ...(isMac ? [{
        label: 'Writers CLI',
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          {
            label: 'Preferences...',
            accelerator: 'Cmd+,',
            click: this.callbacks.onPreferences || (() => {})
          },
          { type: 'separator' },
          { role: 'services' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideothers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' }
        ]
      }] : []),

      // File menu
      {
        label: 'File',
        submenu: [
          {
            label: 'New File',
            accelerator: 'CmdOrCtrl+N',
            click: this.callbacks.onNew || (() => {})
          },
          {
            label: 'New Project',
            accelerator: 'CmdOrCtrl+Shift+N',
            click: this.callbacks.onNewProject || (() => {})
          },
          { type: 'separator' },
          {
            label: 'Open File...',
            accelerator: 'CmdOrCtrl+O',
            click: this.callbacks.onOpen || (() => {})
          },
          {
            label: 'Open Project...',
            accelerator: 'CmdOrCtrl+Shift+O',
            click: this.callbacks.onOpenProject || (() => {})
          },
          {
            label: 'Open Recent',
            submenu: this.createRecentFilesMenu()
          },
          { type: 'separator' },
          {
            label: 'Save',
            accelerator: 'CmdOrCtrl+S',
            click: this.callbacks.onSave || (() => {})
          },
          {
            label: 'Save As...',
            accelerator: 'CmdOrCtrl+Shift+S',
            click: this.callbacks.onSaveAs || (() => {})
          },
          {
            label: 'Save All',
            accelerator: 'CmdOrCtrl+Alt+S',
            click: this.callbacks.onSaveAll || (() => {})
          },
          { type: 'separator' },
          {
            label: 'Export',
            submenu: [
              {
                label: 'Export as PDF...',
                click: this.callbacks.onExportPDF || (() => {})
              },
              {
                label: 'Export as EPUB...',
                click: this.callbacks.onExportEPUB || (() => {})
              },
              {
                label: 'Export as Word Document...',
                click: this.callbacks.onExportWord || (() => {})
              },
              {
                label: 'Export as HTML...',
                click: this.callbacks.onExportHTML || (() => {})
              }
            ]
          },
          { type: 'separator' },
          {
            label: 'Close File',
            accelerator: 'CmdOrCtrl+W',
            click: this.callbacks.onCloseFile || (() => {})
          },
          ...(isMac ? [] : [
            { type: 'separator' },
            {
              label: 'Quit',
              accelerator: 'CmdOrCtrl+Q',
              click: this.callbacks.onQuit || (() => {})
            }
          ])
        ]
      },

      // Edit menu
      {
        label: 'Edit',
        submenu: [
          {
            label: 'Undo',
            accelerator: 'CmdOrCtrl+Z',
            click: this.callbacks.onUndo || (() => {})
          },
          {
            label: 'Redo',
            accelerator: 'CmdOrCtrl+Y',
            click: this.callbacks.onRedo || (() => {})
          },
          { type: 'separator' },
          {
            label: 'Cut',
            accelerator: 'CmdOrCtrl+X',
            click: this.callbacks.onCut || (() => {})
          },
          {
            label: 'Copy',
            accelerator: 'CmdOrCtrl+C',
            click: this.callbacks.onCopy || (() => {})
          },
          {
            label: 'Paste',
            accelerator: 'CmdOrCtrl+V',
            click: this.callbacks.onPaste || (() => {})
          },
          {
            label: 'Select All',
            accelerator: 'CmdOrCtrl+A',
            click: this.callbacks.onSelectAll || (() => {})
          },
          { type: 'separator' },
          {
            label: 'Find',
            accelerator: 'CmdOrCtrl+F',
            click: this.callbacks.onFind || (() => {})
          },
          {
            label: 'Find and Replace',
            accelerator: 'CmdOrCtrl+R',
            click: this.callbacks.onReplace || (() => {})
          },
          {
            label: 'Find Next',
            accelerator: 'F3',
            click: this.callbacks.onFindNext || (() => {})
          },
          {
            label: 'Find Previous',
            accelerator: 'Shift+F3',
            click: this.callbacks.onFindPrevious || (() => {})
          },
          {
            label: 'Go to Line',
            accelerator: 'CmdOrCtrl+G',
            click: this.callbacks.onGoToLine || (() => {})
          },
          { type: 'separator' },
          ...(isMac ? [] : [
            {
              label: 'Preferences...',
              accelerator: 'CmdOrCtrl+,',
              click: this.callbacks.onPreferences || (() => {})
            }
          ])
        ]
      },

      // View menu
      {
        label: 'View',
        submenu: [
          {
            label: 'Toggle Sidebar',
            accelerator: 'CmdOrCtrl+B',
            click: this.callbacks.onToggleSidebar || (() => {})
          },
          {
            label: 'Toggle Status Bar',
            click: this.callbacks.onToggleStatusBar || (() => {})
          },
          {
            label: 'Toggle Toolbar',
            click: this.callbacks.onToggleToolbar || (() => {})
          },
          { type: 'separator' },
          {
            label: 'Focus Mode',
            accelerator: 'F10',
            click: this.callbacks.onToggleFocusMode || (() => {})
          },
          {
            label: 'Typewriter Mode',
            accelerator: 'CmdOrCtrl+T',
            click: this.callbacks.onToggleTypewriterMode || (() => {})
          },
          {
            label: 'Distraction Free',
            accelerator: 'F11',
            click: this.callbacks.onToggleFullscreen || (() => {})
          },
          { type: 'separator' },
          {
            label: 'Themes',
            submenu: [
              {
                label: 'Dark Theme',
                type: 'radio',
                checked: true,
                click: () => this.callbacks.onThemeChange && this.callbacks.onThemeChange('dark')
              },
              {
                label: 'Light Theme',
                type: 'radio',
                click: () => this.callbacks.onThemeChange && this.callbacks.onThemeChange('light')
              },
              {
                label: 'High Contrast',
                type: 'radio',
                click: () => this.callbacks.onThemeChange && this.callbacks.onThemeChange('high-contrast')
              },
              {
                label: 'Sepia',
                type: 'radio',
                click: () => this.callbacks.onThemeChange && this.callbacks.onThemeChange('sepia')
              }
            ]
          },
          { type: 'separator' },
          {
            label: 'Zoom In',
            accelerator: 'CmdOrCtrl+Plus',
            click: this.callbacks.onZoomIn || (() => {})
          },
          {
            label: 'Zoom Out',
            accelerator: 'CmdOrCtrl+-',
            click: this.callbacks.onZoomOut || (() => {})
          },
          {
            label: 'Reset Zoom',
            accelerator: 'CmdOrCtrl+0',
            click: this.callbacks.onZoomReset || (() => {})
          },
          { type: 'separator' },
          { role: 'reload' },
          { role: 'forceReload' },
          { role: 'toggleDevTools' }
        ]
      },

      // Tools menu
      {
        label: 'Tools',
        submenu: [
          {
            label: 'Word Count',
            accelerator: 'CmdOrCtrl+Shift+W',
            click: this.callbacks.onWordCount || (() => {})
          },
          {
            label: 'Document Statistics',
            accelerator: 'CmdOrCtrl+Shift+D',
            click: this.callbacks.onDocumentStats || (() => {})
          },
          {
            label: 'Reading Time Calculator',
            click: this.callbacks.onReadingTime || (() => {})
          },
          { type: 'separator' },
          {
            label: 'Spell Check',
            type: 'checkbox',
            checked: true,
            click: this.callbacks.onToggleSpellCheck || (() => {})
          },
          {
            label: 'Grammar Check',
            type: 'checkbox',
            click: this.callbacks.onToggleGrammarCheck || (() => {})
          },
          { type: 'separator' },
          {
            label: 'Pomodoro Timer',
            accelerator: 'CmdOrCtrl+Shift+P',
            click: this.callbacks.onPomodoroTimer || (() => {})
          },
          {
            label: 'Writing Goals',
            click: this.callbacks.onWritingGoals || (() => {})
          },
          { type: 'separator' },
          {
            label: 'Backup Project',
            click: this.callbacks.onBackupProject || (() => {})
          },
          {
            label: 'Restore from Backup',
            click: this.callbacks.onRestoreBackup || (() => {})
          }
        ]
      },

      // Project menu
      {
        label: 'Project',
        submenu: [
          {
            label: 'Project Overview',
            accelerator: 'CmdOrCtrl+Shift+O',
            click: this.callbacks.onProjectOverview || (() => {})
          },
          {
            label: 'Project Statistics',
            click: this.callbacks.onProjectStats || (() => {})
          },
          { type: 'separator' },
          {
            label: 'Add Chapter',
            accelerator: 'CmdOrCtrl+Shift+C',
            click: this.callbacks.onAddChapter || (() => {})
          },
          {
            label: 'Add Character',
            click: this.callbacks.onAddCharacter || (() => {})
          },
          {
            label: 'Add Note',
            accelerator: 'CmdOrCtrl+Shift+N',
            click: this.callbacks.onAddNote || (() => {})
          },
          { type: 'separator' },
          {
            label: 'Project Settings',
            click: this.callbacks.onProjectSettings || (() => {})
          },
          {
            label: 'Export Project',
            click: this.callbacks.onExportProject || (() => {})
          }
        ]
      },

      // Window menu
      {
        label: 'Window',
        submenu: [
          { role: 'minimize' },
          { role: 'close' },
          ...(isMac ? [
            { type: 'separator' },
            { role: 'front' },
            { type: 'separator' },
            { role: 'window' }
          ] : [])
        ]
      },

      // Help menu
      {
        label: 'Help',
        submenu: [
          {
            label: 'Keyboard Shortcuts',
            accelerator: 'F1',
            click: this.callbacks.onHelp || (() => {})
          },
          {
            label: 'Writing Guide',
            click: this.callbacks.onWritingGuide || (() => {})
          },
          {
            label: 'User Manual',
            click: this.callbacks.onUserManual || (() => {})
          },
          { type: 'separator' },
          {
            label: 'Report Bug',
            click: this.callbacks.onReportBug || (() => {})
          },
          {
            label: 'Feature Request',
            click: this.callbacks.onFeatureRequest || (() => {})
          },
          { type: 'separator' },
          {
            label: 'Check for Updates',
            click: this.callbacks.onCheckUpdates || (() => {})
          },
          ...(isMac ? [] : [
            { type: 'separator' },
            {
              label: 'About Writers CLI',
              click: this.callbacks.onAbout || (() => {})
            }
          ])
        ]
      }
    ];

    return template;
  }

  /**
   * Create recent files submenu
   */
  createRecentFilesMenu(recentFiles = []) {
    if (!recentFiles || recentFiles.length === 0) {
      return [
        {
          label: 'No recent files',
          enabled: false
        }
      ];
    }

    const recentItems = recentFiles.slice(0, 10).map((filePath, index) => ({
      label: `${index + 1}. ${this.getFileDisplayName(filePath)}`,
      click: () => {
        if (this.callbacks.onOpenRecent) {
          this.callbacks.onOpenRecent(filePath);
        }
      }
    }));

    return [
      ...recentItems,
      { type: 'separator' },
      {
        label: 'Clear Recent Files',
        click: this.callbacks.onClearRecent || (() => {})
      }
    ];
  }

  /**
   * Create context menu for editor
   */
  createEditorContextMenu(hasSelection = false) {
    return [
      {
        label: 'Cut',
        role: 'cut',
        enabled: hasSelection
      },
      {
        label: 'Copy',
        role: 'copy',
        enabled: hasSelection
      },
      {
        label: 'Paste',
        role: 'paste'
      },
      { type: 'separator' },
      {
        label: 'Select All',
        role: 'selectall'
      },
      { type: 'separator' },
      {
        label: 'Find',
        click: this.callbacks.onFind || (() => {})
      },
      {
        label: 'Replace',
        click: this.callbacks.onReplace || (() => {})
      }
    ];
  }

  /**
   * Create context menu for file list
   */
  createFileContextMenu(filePath) {
    return [
      {
        label: 'Open',
        click: () => {
          if (this.callbacks.onOpenFile) {
            this.callbacks.onOpenFile(filePath);
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Rename',
        click: () => {
          if (this.callbacks.onRenameFile) {
            this.callbacks.onRenameFile(filePath);
          }
        }
      },
      {
        label: 'Delete',
        click: () => {
          if (this.callbacks.onDeleteFile) {
            this.callbacks.onDeleteFile(filePath);
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Show in Folder',
        click: () => {
          if (this.callbacks.onShowInFolder) {
            this.callbacks.onShowInFolder(filePath);
          }
        }
      },
      {
        label: 'Copy Path',
        click: () => {
          if (this.callbacks.onCopyPath) {
            this.callbacks.onCopyPath(filePath);
          }
        }
      }
    ];
  }

  /**
   * Update recent files menu
   */
  updateRecentFiles(recentFiles) {
    const menu = Menu.getApplicationMenu();
    if (menu) {
      // Find the File menu and Recent Files submenu
      const fileMenu = menu.items.find(item => item.label === 'File');
      if (fileMenu) {
        const recentSubmenu = fileMenu.submenu.items.find(item => item.label === 'Open Recent');
        if (recentSubmenu) {
          recentSubmenu.submenu = Menu.buildFromTemplate(this.createRecentFilesMenu(recentFiles));
        }
      }
    }
  }

  /**
   * Update theme menu selection
   */
  updateThemeSelection(currentTheme) {
    const menu = Menu.getApplicationMenu();
    if (menu) {
      const viewMenu = menu.items.find(item => item.label === 'View');
      if (viewMenu) {
        const themesSubmenu = viewMenu.submenu.items.find(item => item.label === 'Themes');
        if (themesSubmenu) {
          themesSubmenu.submenu.items.forEach(item => {
            if (item.type === 'radio') {
              item.checked = item.label.toLowerCase().includes(currentTheme);
            }
          });
        }
      }
    }
  }

  /**
   * Get display name for file
   */
  getFileDisplayName(filePath) {
    const path = require('path');
    const fileName = path.basename(filePath);
    const dirName = path.basename(path.dirname(filePath));

    if (fileName.length > 30) {
      return `${fileName.substring(0, 27)}... (${dirName})`;
    }

    return `${fileName} (${dirName})`;
  }

  /**
   * Show context menu
   */
  showContextMenu(window, template) {
    const menu = Menu.buildFromTemplate(template);
    menu.popup({ window });
  }

  /**
   * Enable/disable menu items
   */
  setMenuItemEnabled(menuPath, enabled) {
    const menu = Menu.getApplicationMenu();
    if (menu) {
      const parts = menuPath.split('.');
      let currentMenu = menu;

      for (let i = 0; i < parts.length - 1; i++) {
        const item = currentMenu.items.find(item => item.label === parts[i]);
        if (item && item.submenu) {
          currentMenu = item.submenu;
        } else {
          return;
        }
      }

      const targetItem = currentMenu.items.find(item => item.label === parts[parts.length - 1]);
      if (targetItem) {
        targetItem.enabled = enabled;
      }
    }
  }
}

module.exports = MenuService;
