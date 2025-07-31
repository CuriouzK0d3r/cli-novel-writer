package themes

import (
	"fmt"
	"sync"
)

// ThemeInfo holds basic information about a theme
type ThemeInfo struct {
	Name        string
	DisplayName string
	IsDark      bool
}

// Manager handles theme registration, switching, and management
type Manager struct {
	themes       map[string]Theme
	currentTheme Theme
	defaultTheme string
	mutex        sync.RWMutex
}

// NewManager creates a new theme manager with built-in themes
func NewManager() *Manager {
	manager := &Manager{
		themes:       make(map[string]Theme),
		defaultTheme: "dark",
	}

	// Register built-in themes
	manager.registerTheme(NewBaseTheme("base", "Base Theme", false))
	manager.registerTheme(NewDarkTheme())
	manager.registerTheme(NewLightTheme())

	// Set default theme
	manager.SetTheme(manager.defaultTheme)

	return manager
}

// registerTheme registers a theme without validation (internal use)
func (m *Manager) registerTheme(theme Theme) {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	m.themes[theme.GetName()] = theme
}

// RegisterTheme registers a new theme with validation
func (m *Manager) RegisterTheme(theme Theme) error {
	if theme == nil {
		return fmt.Errorf("theme cannot be nil")
	}

	if !theme.Validate() {
		return fmt.Errorf("invalid theme: %s", theme.GetName())
	}

	m.mutex.Lock()
	defer m.mutex.Unlock()

	m.themes[theme.GetName()] = theme
	return nil
}

// SetTheme sets the active theme by name
func (m *Manager) SetTheme(themeName string) bool {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	theme, exists := m.themes[themeName]
	if !exists {
		return false
	}

	m.currentTheme = theme
	return true
}

// GetCurrentTheme returns the currently active theme
func (m *Manager) GetCurrentTheme() Theme {
	m.mutex.RLock()
	defer m.mutex.RUnlock()

	if m.currentTheme == nil {
		// Fallback to default theme if current is nil
		if defaultTheme, exists := m.themes[m.defaultTheme]; exists {
			m.currentTheme = defaultTheme
		} else {
			// Ultimate fallback to base theme
			m.currentTheme = NewBaseTheme("base", "Base Theme", false)
		}
	}

	return m.currentTheme
}

// GetAvailableThemes returns a list of all available themes
func (m *Manager) GetAvailableThemes() []ThemeInfo {
	m.mutex.RLock()
	defer m.mutex.RUnlock()

	themes := make([]ThemeInfo, 0, len(m.themes))
	for _, theme := range m.themes {
		themes = append(themes, ThemeInfo{
			Name:        theme.GetName(),
			DisplayName: theme.GetDisplayName(),
			IsDark:      theme.IsDark(),
		})
	}

	return themes
}

// GetTheme returns a theme by name
func (m *Manager) GetTheme(themeName string) (Theme, bool) {
	m.mutex.RLock()
	defer m.mutex.RUnlock()

	theme, exists := m.themes[themeName]
	return theme, exists
}

// HasTheme checks if a theme exists
func (m *Manager) HasTheme(themeName string) bool {
	m.mutex.RLock()
	defer m.mutex.RUnlock()

	_, exists := m.themes[themeName]
	return exists
}

// NextTheme switches to the next available theme
func (m *Manager) NextTheme() Theme {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	themeNames := make([]string, 0, len(m.themes))
	for name := range m.themes {
		themeNames = append(themeNames, name)
	}

	if len(themeNames) == 0 {
		return m.currentTheme
	}

	currentIndex := -1
	for i, name := range themeNames {
		if m.currentTheme != nil && name == m.currentTheme.GetName() {
			currentIndex = i
			break
		}
	}

	nextIndex := (currentIndex + 1) % len(themeNames)
	nextThemeName := themeNames[nextIndex]

	if nextTheme, exists := m.themes[nextThemeName]; exists {
		m.currentTheme = nextTheme
		return nextTheme
	}

	return m.currentTheme
}

// PreviousTheme switches to the previous available theme
func (m *Manager) PreviousTheme() Theme {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	themeNames := make([]string, 0, len(m.themes))
	for name := range m.themes {
		themeNames = append(themeNames, name)
	}

	if len(themeNames) == 0 {
		return m.currentTheme
	}

	currentIndex := -1
	for i, name := range themeNames {
		if m.currentTheme != nil && name == m.currentTheme.GetName() {
			currentIndex = i
			break
		}
	}

	prevIndex := currentIndex - 1
	if prevIndex < 0 {
		prevIndex = len(themeNames) - 1
	}

	prevThemeName := themeNames[prevIndex]

	if prevTheme, exists := m.themes[prevThemeName]; exists {
		m.currentTheme = prevTheme
		return prevTheme
	}

	return m.currentTheme
}

// GetThemeStats returns statistics about the theme manager
func (m *Manager) GetThemeStats() map[string]interface{} {
	m.mutex.RLock()
	defer m.mutex.RUnlock()

	darkThemes := 0
	lightThemes := 0
	themeNames := make([]string, 0, len(m.themes))

	for _, theme := range m.themes {
		themeNames = append(themeNames, theme.GetName())
		if theme.IsDark() {
			darkThemes++
		} else {
			lightThemes++
		}
	}

	currentThemeName := "none"
	if m.currentTheme != nil {
		currentThemeName = m.currentTheme.GetName()
	}

	return map[string]interface{}{
		"total_themes":     len(m.themes),
		"current_theme":    currentThemeName,
		"available_themes": themeNames,
		"dark_themes":      darkThemes,
		"light_themes":     lightThemes,
	}
}

// ExportThemeConfig exports the current theme configuration
func (m *Manager) ExportThemeConfig() map[string]interface{} {
	theme := m.GetCurrentTheme()
	if theme == nil {
		return nil
	}

	return map[string]interface{}{
		"name":         theme.GetName(),
		"display_name": theme.GetDisplayName(),
		"is_dark":      theme.IsDark(),
		"welcome":      theme.GetWelcomeMessage(),
		"timestamp":    "now", // Could use time.Now() if needed
	}
}

// GetWelcomeMessage returns the welcome message for the current theme
func (m *Manager) GetWelcomeMessage() string {
	theme := m.GetCurrentTheme()
	if theme == nil {
		return "Welcome to Writers CLI Editor"
	}

	return theme.GetWelcomeMessage()
}

// ValidateAllThemes validates all registered themes
func (m *Manager) ValidateAllThemes() []string {
	m.mutex.RLock()
	defer m.mutex.RUnlock()

	var errors []string
	for name, theme := range m.themes {
		if !theme.Validate() {
			errors = append(errors, fmt.Sprintf("Theme '%s' is invalid", name))
		}
	}

	return errors
}

// GetDefaultTheme returns the name of the default theme
func (m *Manager) GetDefaultTheme() string {
	return m.defaultTheme
}

// SetDefaultTheme sets the default theme name
func (m *Manager) SetDefaultTheme(themeName string) bool {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	if _, exists := m.themes[themeName]; exists {
		m.defaultTheme = themeName
		return true
	}

	return false
}

// RemoveTheme removes a theme from the manager
func (m *Manager) RemoveTheme(themeName string) bool {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	// Don't allow removing built-in themes
	if themeName == "base" || themeName == "dark" || themeName == "light" {
		return false
	}

	if _, exists := m.themes[themeName]; exists {
		delete(m.themes, themeName)

		// If we're removing the current theme, switch to default
		if m.currentTheme != nil && m.currentTheme.GetName() == themeName {
			if defaultTheme, exists := m.themes[m.defaultTheme]; exists {
				m.currentTheme = defaultTheme
			}
		}

		return true
	}

	return false
}

// ListThemeNames returns a sorted list of theme names
func (m *Manager) ListThemeNames() []string {
	m.mutex.RLock()
	defer m.mutex.RUnlock()

	names := make([]string, 0, len(m.themes))
	for name := range m.themes {
		names = append(names, name)
	}

	return names
}

// GetThemeCount returns the total number of registered themes
func (m *Manager) GetThemeCount() int {
	m.mutex.RLock()
	defer m.mutex.RUnlock()

	return len(m.themes)
}
