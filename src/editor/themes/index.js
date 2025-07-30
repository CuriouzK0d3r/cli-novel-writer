/**
 * Themes Index
 * Central export point for all editor themes
 */

const BaseTheme = require('./base-theme');
const DarkTheme = require('./dark-theme');
const LightTheme = require('./light-theme');
const ThemeManager = require('./theme-manager');

module.exports = {
  BaseTheme,
  DarkTheme,
  LightTheme,
  ThemeManager,

  // Convenience function to create a new theme manager
  createThemeManager() {
    return new ThemeManager();
  },

  // Available theme names
  THEME_NAMES: {
    BASE: 'base',
    DARK: 'dark',
    LIGHT: 'light'
  },

  // Default theme
  DEFAULT_THEME: 'dark'
};
