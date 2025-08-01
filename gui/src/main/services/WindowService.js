const { BrowserWindow } = require('electron');

class WindowService {
  constructor() {
    this.mainWindow = null;
    this.childWindows = new Map();
    this.windowSettings = {
      minWidth: 800,
      minHeight: 600,
      defaultWidth: 1400,
      defaultHeight: 900
    };
  }

  /**
   * Set the main window reference
   */
  setMainWindow(window) {
    this.mainWindow = window;
  }

  /**
   * Get the main window
   */
  getMainWindow() {
    return this.mainWindow;
  }

  /**
   * Minimize the main window
   */
  minimize() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.minimize();
    }
  }

  /**
   * Maximize or restore the main window
   */
  toggleMaximize() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      if (this.mainWindow.isMaximized()) {
        this.mainWindow.restore();
      } else {
        this.mainWindow.maximize();
      }
    }
  }

  /**
   * Toggle fullscreen mode
   */
  toggleFullscreen() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      const isFullscreen = this.mainWindow.isFullScreen();
      this.mainWindow.setFullScreen(!isFullscreen);
      return !isFullscreen;
    }
    return false;
  }

  /**
   * Close the main window
   */
  close() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.close();
    }
  }

  /**
   * Show the main window
   */
  show() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.show();
      this.mainWindow.focus();
    }
  }

  /**
   * Hide the main window
   */
  hide() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.hide();
    }
  }

  /**
   * Focus the main window
   */
  focus() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.focus();
    }
  }

  /**
   * Get window bounds
   */
  getBounds() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      return this.mainWindow.getBounds();
    }
    return null;
  }

  /**
   * Set window bounds
   */
  setBounds(bounds) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.setBounds(bounds);
    }
  }

  /**
   * Get window state
   */
  getWindowState() {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      return null;
    }

    const bounds = this.mainWindow.getBounds();
    return {
      ...bounds,
      maximized: this.mainWindow.isMaximized(),
      minimized: this.mainWindow.isMinimized(),
      fullscreen: this.mainWindow.isFullScreen(),
      focused: this.mainWindow.isFocused(),
      visible: this.mainWindow.isVisible()
    };
  }

  /**
   * Restore window state
   */
  restoreWindowState(state) {
    if (!this.mainWindow || this.mainWindow.isDestroyed() || !state) {
      return;
    }

    // Set bounds first
    if (state.x !== undefined && state.y !== undefined) {
      this.mainWindow.setBounds({
        x: state.x,
        y: state.y,
        width: state.width || this.windowSettings.defaultWidth,
        height: state.height || this.windowSettings.defaultHeight
      });
    }

    // Then handle window state
    if (state.maximized) {
      this.mainWindow.maximize();
    } else if (state.minimized) {
      this.mainWindow.minimize();
    } else if (state.fullscreen) {
      this.mainWindow.setFullScreen(true);
    }
  }

  /**
   * Create a child window
   */
  createChildWindow(options = {}) {
    const defaultOptions = {
      width: 800,
      height: 600,
      parent: this.mainWindow,
      modal: false,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        sandbox: false
      }
    };

    const windowOptions = { ...defaultOptions, ...options };
    const childWindow = new BrowserWindow(windowOptions);

    // Generate unique ID for the child window
    const windowId = Date.now().toString();
    this.childWindows.set(windowId, childWindow);

    // Clean up when window is closed
    childWindow.on('closed', () => {
      this.childWindows.delete(windowId);
    });

    return { window: childWindow, id: windowId };
  }

  /**
   * Close child window
   */
  closeChildWindow(windowId) {
    const childWindow = this.childWindows.get(windowId);
    if (childWindow && !childWindow.isDestroyed()) {
      childWindow.close();
      this.childWindows.delete(windowId);
    }
  }

  /**
   * Close all child windows
   */
  closeAllChildWindows() {
    for (const [windowId, childWindow] of this.childWindows.entries()) {
      if (!childWindow.isDestroyed()) {
        childWindow.close();
      }
    }
    this.childWindows.clear();
  }

  /**
   * Get all child windows
   */
  getChildWindows() {
    return Array.from(this.childWindows.values());
  }

  /**
   * Set window always on top
   */
  setAlwaysOnTop(flag) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.setAlwaysOnTop(flag);
    }
  }

  /**
   * Set window opacity
   */
  setOpacity(opacity) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.setOpacity(Math.max(0.1, Math.min(1.0, opacity)));
    }
  }

  /**
   * Flash window to get attention
   */
  flashFrame(flag = true) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.flashFrame(flag);
    }
  }

  /**
   * Set window title
   */
  setTitle(title) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.setTitle(title);
    }
  }

  /**
   * Get window title
   */
  getTitle() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      return this.mainWindow.getTitle();
    }
    return '';
  }

  /**
   * Center window on screen
   */
  center() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.center();
    }
  }

  /**
   * Move window to display
   */
  moveToDisplay(displayId) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      const { screen } = require('electron');
      const displays = screen.getAllDisplays();
      const targetDisplay = displays.find(display => display.id === displayId);

      if (targetDisplay) {
        const { x, y, width, height } = targetDisplay.bounds;
        const windowBounds = this.mainWindow.getBounds();

        // Center window on the target display
        const newX = x + (width - windowBounds.width) / 2;
        const newY = y + (height - windowBounds.height) / 2;

        this.mainWindow.setPosition(Math.round(newX), Math.round(newY));
      }
    }
  }

  /**
   * Get current display
   */
  getCurrentDisplay() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      const { screen } = require('electron');
      return screen.getDisplayNearestPoint(this.mainWindow.getBounds());
    }
    return null;
  }

  /**
   * Check if window is on screen
   */
  isOnScreen() {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      return false;
    }

    const { screen } = require('electron');
    const windowBounds = this.mainWindow.getBounds();
    const displays = screen.getAllDisplays();

    return displays.some(display => {
      const { x, y, width, height } = display.bounds;
      return (
        windowBounds.x >= x &&
        windowBounds.y >= y &&
        windowBounds.x + windowBounds.width <= x + width &&
        windowBounds.y + windowBounds.height <= y + height
      );
    });
  }

  /**
   * Ensure window is visible on screen
   */
  ensureOnScreen() {
    if (!this.isOnScreen()) {
      this.center();
    }
  }

  /**
   * Get window statistics
   */
  getWindowStats() {
    const stats = {
      mainWindow: {
        exists: this.mainWindow && !this.mainWindow.isDestroyed(),
        state: this.getWindowState()
      },
      childWindows: {
        count: this.childWindows.size,
        windows: []
      }
    };

    for (const [id, window] of this.childWindows.entries()) {
      if (!window.isDestroyed()) {
        stats.childWindows.windows.push({
          id,
          bounds: window.getBounds(),
          visible: window.isVisible(),
          focused: window.isFocused()
        });
      }
    }

    return stats;
  }

  /**
   * Cleanup all windows
   */
  cleanup() {
    this.closeAllChildWindows();
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.removeAllListeners();
    }
    this.mainWindow = null;
  }
}

module.exports = WindowService;
