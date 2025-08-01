const { app, BrowserWindow, Menu, dialog, ipcMain, shell, nativeTheme } = require('electron');
const path = require('path');
const fs = require('fs-extra');

// Import the new modular main application
const WritersApp = require('./src/main/main.js');

// Single instance enforcement
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    // Initialize the main application
    let writersApp = null;

    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // Someone tried to run a second instance, focus our window instead
        if (writersApp && writersApp.mainWindow) {
            if (writersApp.mainWindow.isMinimized()) {
                writersApp.mainWindow.restore();
            }
            writersApp.mainWindow.focus();
        }
    });

    // App event handlers
    app.whenReady().then(async () => {
        try {
            // Create and initialize the main application
            writersApp = new WritersApp();
            await writersApp.init();

            console.log('Writers CLI started successfully');
        } catch (error) {
            console.error('Failed to start Writers CLI:', error);

            // Show error dialog
            dialog.showErrorBox(
                'Startup Error',
                `Failed to start Writers CLI: ${error.message}`
            );

            app.quit();
        }
    });

    app.on('window-all-closed', () => {
        // On macOS, keep app running even when all windows are closed
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });

    app.on('activate', () => {
        // On macOS, re-create window when dock icon is clicked
        if (BrowserWindow.getAllWindows().length === 0 && writersApp) {
            writersApp.createWindow();
        }
    });

    app.on('before-quit', async (event) => {
        if (writersApp) {
            // Give the app a chance to handle cleanup
            event.preventDefault();

            try {
                await writersApp.handleAppClose();
                app.exit(0);
            } catch (error) {
                console.error('Error during app shutdown:', error);
                app.exit(1);
            }
        }
    });

    // Handle protocol for opening files (if registered)
    app.setAsDefaultProtocolClient('writers-cli');

    // Security: Prevent new window creation from renderer
    app.on('web-contents-created', (event, contents) => {
        contents.on('new-window', (event, navigationUrl) => {
            event.preventDefault();
            shell.openExternal(navigationUrl);
        });

        contents.on('will-navigate', (event, navigationUrl) => {
            const parsedUrl = new URL(navigationUrl);

            // Only allow navigation to local files
            if (parsedUrl.protocol !== 'file:') {
                event.preventDefault();
            }
        });
    });

    // Handle certificate errors
    app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
        // In development, ignore certificate errors for localhost
        if (url.startsWith('https://localhost')) {
            event.preventDefault();
            callback(true);
            return;
        }

        // In production, use default behavior
        callback(false);
    });

    // Handle file protocol registration for opening files
    if (process.defaultApp) {
        if (process.argv.length >= 2) {
            app.setAsDefaultProtocolClient('writers-cli', process.execPath, [path.resolve(process.argv[1])]);
        }
    } else {
        app.setAsDefaultProtocolClient('writers-cli');
    }

    // Handle command line arguments for file opening
    const handleFileOpen = (argv) => {
        if (argv.length > 1 && writersApp) {
            const filePath = argv[argv.length - 1];
            if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
                writersApp.openFileFromCommandLine(filePath);
            }
        }
    };

    // Handle file opening on Windows/Linux
    app.on('second-instance', (event, argv, cwd) => {
        handleFileOpen(argv);
    });

    // Handle file opening on app start
    if (process.argv.length > 1) {
        app.whenReady().then(() => {
            setTimeout(() => handleFileOpen(process.argv), 1000);
        });
    }

    // macOS file opening
    app.on('open-file', (event, filePath) => {
        event.preventDefault();
        if (writersApp) {
            writersApp.openFileFromCommandLine(filePath);
        }
    });

    // Handle GPU process crash
    app.on('gpu-process-crashed', (event, killed) => {
        console.log('GPU process crashed, killed:', killed);
    });

    // Handle renderer process crash
    app.on('render-process-gone', (event, webContents, details) => {
        console.log('Renderer process gone:', details);

        if (writersApp && writersApp.mainWindow) {
            dialog.showMessageBox(writersApp.mainWindow, {
                type: 'error',
                title: 'Application Error',
                message: 'The application encountered an error and needs to restart.',
                buttons: ['Restart', 'Quit']
            }).then((result) => {
                if (result.response === 0) {
                    app.relaunch();
                }
                app.quit();
            });
        }
    });

    // Development helpers
    if (process.env.NODE_ENV === 'development') {
        // Enable live reload for Electron
        try {
            require('electron-reload')(__dirname, {
                electron: require(`${__dirname}/node_modules/electron`),
                hardResetMethod: 'exit'
            });
        } catch (err) {
            console.log('Electron-reload not available in production');
        }

        // Install React Developer Tools (if using React in renderer)
        app.whenReady().then(() => {
            // Uncomment if using React DevTools
            // const { default: installExtension, REACT_DEVELOPER_TOOLS } = require('electron-devtools-installer');
            // installExtension(REACT_DEVELOPER_TOOLS)
            //     .then((name) => console.log(`Added Extension: ${name}`))
            //     .catch((err) => console.log('An error occurred: ', err));
        });
    }

    // Cleanup function
    const cleanup = () => {
        if (writersApp) {
            writersApp.cleanup();
            writersApp = null;
        }
    };

    // Handle various exit signals
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('exit', cleanup);
    process.on('uncaughtException', (error) => {
        console.error('Uncaught Exception:', error);
        cleanup();
        process.exit(1);
    });
    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });
}

// Export for testing
module.exports = { app };
