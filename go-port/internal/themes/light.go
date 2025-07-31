package themes

import (
	"github.com/gdamore/tcell/v2"
)

// LightTheme implements a beautiful clean light theme
type LightTheme struct {
	*BaseTheme
}

// NewLightTheme creates a new light theme instance
func NewLightTheme() *LightTheme {
	return &LightTheme{
		BaseTheme: NewBaseTheme("light", "Light Theme", false),
	}
}

// Background colors - Clean white background with dark text
func (t *LightTheme) GetBackgroundColor() tcell.Color {
	return tcell.NewHexColor(0xffffff) // Pure white background
}

func (t *LightTheme) GetForegroundColor() tcell.Color {
	return tcell.NewHexColor(0x2d3748) // Dark readable text
}

// Border colors - Subtle borders with modern accents
func (t *LightTheme) GetBorderColor() tcell.Color {
	return tcell.NewHexColor(0xe2e8f0) // Light gray border
}

func (t *LightTheme) GetBorderFocusColor() tcell.Color {
	return tcell.NewHexColor(0x4299e1) // Professional blue focus
}

func (t *LightTheme) GetTitleColor() tcell.Color {
	return tcell.NewHexColor(0x2b6cb0) // Strong blue for titles
}

// Status bar colors - Professional and clean
func (t *LightTheme) GetStatusBgColor() tcell.Color {
	return tcell.NewHexColor(0x4299e1) // Professional blue background
}

func (t *LightTheme) GetStatusFgColor() tcell.Color {
	return tcell.NewHexColor(0xffffff) // White text
}

// Info bar colors
func (t *LightTheme) GetInfoBgColor() tcell.Color {
	return tcell.NewHexColor(0xf7fafc) // Very light gray background
}

func (t *LightTheme) GetInfoFgColor() tcell.Color {
	return tcell.NewHexColor(0x4a5568) // Medium gray text
}

// Help bar colors
func (t *LightTheme) GetHelpBgColor() tcell.Color {
	return tcell.NewHexColor(0xedf2f7) // Light gray background
}

func (t *LightTheme) GetHelpFgColor() tcell.Color {
	return tcell.NewHexColor(0x2d3748) // Dark text
}

// Line number colors - Subtle but readable
func (t *LightTheme) GetLineNumberBgColor() tcell.Color {
	return tcell.NewHexColor(0xffffff) // Same as background
}

func (t *LightTheme) GetLineNumberFgColor() tcell.Color {
	return tcell.NewHexColor(0xa0aec0) // Light gray
}

func (t *LightTheme) GetLineNumberActiveFgColor() tcell.Color {
	return tcell.NewHexColor(0x4a5568) // Darker gray for active line
}

// Selection colors - Gentle blue selection
func (t *LightTheme) GetSelectionBgColor() tcell.Color {
	return tcell.NewHexColor(0xbee3f8) // Light blue selection background
}

func (t *LightTheme) GetSelectionFgColor() tcell.Color {
	return tcell.NewHexColor(0x2a4365) // Dark blue selected text
}

// Cursor colors - Dark and visible
func (t *LightTheme) GetCursorColor() tcell.Color {
	return tcell.NewHexColor(0x2d3748) // Dark cursor
}

func (t *LightTheme) GetCursorInsertColor() tcell.Color {
	return tcell.NewHexColor(0x718096) // Medium gray for insert mode
}

// Message colors - Clear and distinct
func (t *LightTheme) GetSuccessColor() tcell.Color {
	return tcell.NewHexColor(0x38a169) // Green for success
}

func (t *LightTheme) GetWarningColor() tcell.Color {
	return tcell.NewHexColor(0xd69e2e) // Amber for warnings
}

func (t *LightTheme) GetErrorColor() tcell.Color {
	return tcell.NewHexColor(0xe53e3e) // Red for errors
}

func (t *LightTheme) GetInfoColor() tcell.Color {
	return tcell.NewHexColor(0x3182ce) // Blue for info
}

// Special colors
func (t *LightTheme) GetDimmedColor() tcell.Color {
	return tcell.NewHexColor(0xcbd5e0) // Gentle dimming for typewriter mode
}

// Color codes for markup
func (t *LightTheme) GetErrorColorCode() string {
	return "#e53e3e"
}

func (t *LightTheme) GetSuccessColorCode() string {
	return "#38a169"
}

func (t *LightTheme) GetWarningColorCode() string {
	return "#d69e2e"
}

func (t *LightTheme) GetInfoColorCode() string {
	return "#3182ce"
}

// Syntax highlighting colors - Clean, readable colors
func (t *LightTheme) GetSyntaxColors() SyntaxColors {
	return SyntaxColors{
		// Markdown specific colors
		Heading:   tcell.NewHexColor(0x2b6cb0), // Strong blue for headings
		Emphasis:  tcell.NewHexColor(0xd56565), // Warm red for italic text
		Strong:    tcell.NewHexColor(0xd69e2e), // Amber for bold text
		Link:      tcell.NewHexColor(0x3182ce), // Blue for links
		Code:      tcell.NewHexColor(0x805ad5), // Purple for inline code
		CodeBlock: tcell.NewHexColor(0xd56565), // Red for code blocks
		Quote:     tcell.NewHexColor(0x38a169), // Green for blockquotes
		List:      tcell.NewHexColor(0x9f7aea), // Purple for list markers

		// General syntax colors
		Keyword:     tcell.NewHexColor(0x2b6cb0), // Blue for keywords
		String:      tcell.NewHexColor(0xd56565), // Red for strings
		Comment:     tcell.NewHexColor(0x38a169), // Green for comments
		Number:      tcell.NewHexColor(0x38b2ac), // Teal for numbers
		Operator:    tcell.NewHexColor(0x2d3748), // Dark for operators
		Punctuation: tcell.NewHexColor(0x4a5568), // Gray for punctuation
		Variable:    tcell.NewHexColor(0x3182ce), // Blue for variables
		Function:    tcell.NewHexColor(0xd69e2e), // Amber for functions
		Type:        tcell.NewHexColor(0x38b2ac), // Teal for types
	}
}

// GetWelcomeMessage returns a themed welcome message
func (t *LightTheme) GetWelcomeMessage() string {
	return "☀️ Light Theme Active - Happy Writing!"
}
