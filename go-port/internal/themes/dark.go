package themes

import (
	"github.com/gdamore/tcell/v2"
)

// DarkTheme implements a beautiful modern dark theme
type DarkTheme struct {
	*BaseTheme
}

// NewDarkTheme creates a new dark theme instance
func NewDarkTheme() *DarkTheme {
	return &DarkTheme{
		BaseTheme: NewBaseTheme("dark", "Dark Theme", true),
	}
}

// Background colors - Deep dark background with warm white text
func (t *DarkTheme) GetBackgroundColor() tcell.Color {
	return tcell.NewHexColor(0x1e1e1e) // Deep dark background
}

func (t *DarkTheme) GetForegroundColor() tcell.Color {
	return tcell.NewHexColor(0xd4d4d4) // Warm white text
}

// Border colors - Subtle borders with accent highlights
func (t *DarkTheme) GetBorderColor() tcell.Color {
	return tcell.NewHexColor(0x3e3e42) // Subtle gray border
}

func (t *DarkTheme) GetBorderFocusColor() tcell.Color {
	return tcell.NewHexColor(0x007acc) // Professional blue focus
}

func (t *DarkTheme) GetTitleColor() tcell.Color {
	return tcell.NewHexColor(0x9cdcfe) // Light blue for titles
}

// Status bar colors - Professional blue with high contrast
func (t *DarkTheme) GetStatusBgColor() tcell.Color {
	return tcell.NewHexColor(0x007acc) // Professional blue background
}

func (t *DarkTheme) GetStatusFgColor() tcell.Color {
	return tcell.NewHexColor(0xffffff) // Pure white text
}

// Info bar colors
func (t *DarkTheme) GetInfoBgColor() tcell.Color {
	return tcell.NewHexColor(0x252526) // Dark gray background
}

func (t *DarkTheme) GetInfoFgColor() tcell.Color {
	return tcell.NewHexColor(0xcccccc) // Light gray text
}

// Help bar colors
func (t *DarkTheme) GetHelpBgColor() tcell.Color {
	return tcell.NewHexColor(0x2d2d30) // Slightly lighter dark gray
}

func (t *DarkTheme) GetHelpFgColor() tcell.Color {
	return tcell.NewHexColor(0x9cdcfe) // Light blue text
}

// Line number colors - Subtle but readable
func (t *DarkTheme) GetLineNumberBgColor() tcell.Color {
	return tcell.NewHexColor(0x1e1e1e) // Same as background
}

func (t *DarkTheme) GetLineNumberFgColor() tcell.Color {
	return tcell.NewHexColor(0x858585) // Medium gray
}

func (t *DarkTheme) GetLineNumberActiveFgColor() tcell.Color {
	return tcell.NewHexColor(0xc6c6c6) // Lighter gray for active line
}

// Selection colors - Vibrant blue selection
func (t *DarkTheme) GetSelectionBgColor() tcell.Color {
	return tcell.NewHexColor(0x264f78) // Dark blue selection background
}

func (t *DarkTheme) GetSelectionFgColor() tcell.Color {
	return tcell.NewHexColor(0xffffff) // White selected text
}

// Cursor colors - Bright and visible
func (t *DarkTheme) GetCursorColor() tcell.Color {
	return tcell.NewHexColor(0xffffff) // Bright white cursor
}

func (t *DarkTheme) GetCursorInsertColor() tcell.Color {
	return tcell.NewHexColor(0xaeafad) // Slightly dimmed for insert mode
}

// Message colors - Colorful and distinct
func (t *DarkTheme) GetSuccessColor() tcell.Color {
	return tcell.NewHexColor(0x4ec9b0) // Teal for success
}

func (t *DarkTheme) GetWarningColor() tcell.Color {
	return tcell.NewHexColor(0xffcc02) // Bright yellow for warnings
}

func (t *DarkTheme) GetErrorColor() tcell.Color {
	return tcell.NewHexColor(0xf44747) // Bright red for errors
}

func (t *DarkTheme) GetInfoColor() tcell.Color {
	return tcell.NewHexColor(0x9cdcfe) // Light blue for info
}

// Special colors
func (t *DarkTheme) GetDimmedColor() tcell.Color {
	return tcell.NewHexColor(0x5a5a5a) // Elegant dimming for typewriter mode
}

// Color codes for markup
func (t *DarkTheme) GetErrorColorCode() string {
	return "#f44747"
}

func (t *DarkTheme) GetSuccessColorCode() string {
	return "#4ec9b0"
}

func (t *DarkTheme) GetWarningColorCode() string {
	return "#ffcc02"
}

func (t *DarkTheme) GetInfoColorCode() string {
	return "#9cdcfe"
}

// Syntax highlighting colors - VS Code Dark+ inspired
func (t *DarkTheme) GetSyntaxColors() SyntaxColors {
	return SyntaxColors{
		// Markdown specific colors
		Heading:   tcell.NewHexColor(0x9cdcfe), // Light blue for headings
		Emphasis:  tcell.NewHexColor(0xce9178), // Orange for italic text
		Strong:    tcell.NewHexColor(0xdcdcaa), // Yellow for bold text
		Link:      tcell.NewHexColor(0x4fc1ff), // Bright blue for links
		Code:      tcell.NewHexColor(0xd7ba7d), // Golden for inline code
		CodeBlock: tcell.NewHexColor(0xce9178), // Orange for code blocks
		Quote:     tcell.NewHexColor(0x6a9955), // Green for blockquotes
		List:      tcell.NewHexColor(0xc586c0), // Purple for list markers

		// General syntax colors
		Keyword:     tcell.NewHexColor(0x569cd6), // Blue for keywords
		String:      tcell.NewHexColor(0xce9178), // Orange for strings
		Comment:     tcell.NewHexColor(0x6a9955), // Green for comments
		Number:      tcell.NewHexColor(0xb5cea8), // Light green for numbers
		Operator:    tcell.NewHexColor(0xd4d4d4), // White for operators
		Punctuation: tcell.NewHexColor(0xd4d4d4), // White for punctuation
		Variable:    tcell.NewHexColor(0x9cdcfe), // Light blue for variables
		Function:    tcell.NewHexColor(0xdcdcaa), // Yellow for functions
		Type:        tcell.NewHexColor(0x4ec9b0), // Teal for types
	}
}

// GetWelcomeMessage returns a themed welcome message
func (t *DarkTheme) GetWelcomeMessage() string {
	return "🌙 Dark Theme Active - Happy Writing!"
}
