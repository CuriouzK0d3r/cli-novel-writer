package themes

import (
	"github.com/gdamore/tcell/v2"
)

// Theme interface defines the contract for all editor themes
type Theme interface {
	// Basic theme info
	GetName() string
	GetDisplayName() string
	IsDark() bool

	// Background colors
	GetBackgroundColor() tcell.Color
	GetForegroundColor() tcell.Color

	// Border colors
	GetBorderColor() tcell.Color
	GetBorderFocusColor() tcell.Color
	GetTitleColor() tcell.Color

	// Status bar colors
	GetStatusBgColor() tcell.Color
	GetStatusFgColor() tcell.Color

	// Info bar colors
	GetInfoBgColor() tcell.Color
	GetInfoFgColor() tcell.Color

	// Help bar colors
	GetHelpBgColor() tcell.Color
	GetHelpFgColor() tcell.Color

	// Line number colors
	GetLineNumberBgColor() tcell.Color
	GetLineNumberFgColor() tcell.Color
	GetLineNumberActiveFgColor() tcell.Color

	// Selection colors
	GetSelectionBgColor() tcell.Color
	GetSelectionFgColor() tcell.Color

	// Cursor colors
	GetCursorColor() tcell.Color
	GetCursorInsertColor() tcell.Color

	// Message colors
	GetSuccessColor() tcell.Color
	GetWarningColor() tcell.Color
	GetErrorColor() tcell.Color
	GetInfoColor() tcell.Color

	// Special colors
	GetDimmedColor() tcell.Color

	// Color codes for markup
	GetErrorColorCode() string
	GetSuccessColorCode() string
	GetWarningColorCode() string
	GetInfoColorCode() string

	// Syntax highlighting colors
	GetSyntaxColors() SyntaxColors

	// Welcome message
	GetWelcomeMessage() string

	// Validate theme
	Validate() bool
}

// SyntaxColors holds colors for syntax highlighting
type SyntaxColors struct {
	Heading     tcell.Color
	Emphasis    tcell.Color
	Strong      tcell.Color
	Link        tcell.Color
	Code        tcell.Color
	CodeBlock   tcell.Color
	Quote       tcell.Color
	List        tcell.Color
	Keyword     tcell.Color
	String      tcell.Color
	Comment     tcell.Color
	Number      tcell.Color
	Operator    tcell.Color
	Punctuation tcell.Color
	Variable    tcell.Color
	Function    tcell.Color
	Type        tcell.Color
}

// BaseTheme provides a foundation for all themes
type BaseTheme struct {
	name        string
	displayName string
	isDark      bool
}

// NewBaseTheme creates a new base theme
func NewBaseTheme(name, displayName string, isDark bool) *BaseTheme {
	return &BaseTheme{
		name:        name,
		displayName: displayName,
		isDark:      isDark,
	}
}

// GetName returns the theme name
func (t *BaseTheme) GetName() string {
	return t.name
}

// GetDisplayName returns the display name
func (t *BaseTheme) GetDisplayName() string {
	return t.displayName
}

// IsDark returns whether this is a dark theme
func (t *BaseTheme) IsDark() bool {
	return t.isDark
}

// Validate checks if the theme is valid
func (t *BaseTheme) Validate() bool {
	return t.name != "" && t.displayName != ""
}

// Default implementations for base theme (simple black and white)
func (t *BaseTheme) GetBackgroundColor() tcell.Color {
	return tcell.ColorWhite
}

func (t *BaseTheme) GetForegroundColor() tcell.Color {
	return tcell.ColorBlack
}

func (t *BaseTheme) GetBorderColor() tcell.Color {
	return tcell.ColorGray
}

func (t *BaseTheme) GetBorderFocusColor() tcell.Color {
	return tcell.ColorBlue
}

func (t *BaseTheme) GetTitleColor() tcell.Color {
	return tcell.ColorBlue
}

func (t *BaseTheme) GetStatusBgColor() tcell.Color {
	return tcell.ColorBlue
}

func (t *BaseTheme) GetStatusFgColor() tcell.Color {
	return tcell.ColorWhite
}

func (t *BaseTheme) GetInfoBgColor() tcell.Color {
	return tcell.ColorWhite
}

func (t *BaseTheme) GetInfoFgColor() tcell.Color {
	return tcell.ColorBlack
}

func (t *BaseTheme) GetHelpBgColor() tcell.Color {
	return tcell.ColorGray
}

func (t *BaseTheme) GetHelpFgColor() tcell.Color {
	return tcell.ColorWhite
}

func (t *BaseTheme) GetLineNumberBgColor() tcell.Color {
	return tcell.ColorWhite
}

func (t *BaseTheme) GetLineNumberFgColor() tcell.Color {
	return tcell.ColorGray
}

func (t *BaseTheme) GetLineNumberActiveFgColor() tcell.Color {
	return tcell.ColorBlack
}

func (t *BaseTheme) GetSelectionBgColor() tcell.Color {
	return tcell.ColorBlue
}

func (t *BaseTheme) GetSelectionFgColor() tcell.Color {
	return tcell.ColorWhite
}

func (t *BaseTheme) GetCursorColor() tcell.Color {
	return tcell.ColorBlack
}

func (t *BaseTheme) GetCursorInsertColor() tcell.Color {
	return tcell.ColorGray
}

func (t *BaseTheme) GetSuccessColor() tcell.Color {
	return tcell.ColorGreen
}

func (t *BaseTheme) GetWarningColor() tcell.Color {
	return tcell.ColorYellow
}

func (t *BaseTheme) GetErrorColor() tcell.Color {
	return tcell.ColorRed
}

func (t *BaseTheme) GetInfoColor() tcell.Color {
	return tcell.ColorBlue
}

func (t *BaseTheme) GetDimmedColor() tcell.Color {
	return tcell.ColorGray
}

func (t *BaseTheme) GetErrorColorCode() string {
	return "red"
}

func (t *BaseTheme) GetSuccessColorCode() string {
	return "green"
}

func (t *BaseTheme) GetWarningColorCode() string {
	return "yellow"
}

func (t *BaseTheme) GetInfoColorCode() string {
	return "blue"
}

func (t *BaseTheme) GetSyntaxColors() SyntaxColors {
	return SyntaxColors{
		Heading:     tcell.ColorBlue,
		Emphasis:    tcell.ColorRed,
		Strong:      tcell.ColorMaroon,
		Link:        tcell.ColorBlue,
		Code:        tcell.ColorPurple,
		CodeBlock:   tcell.ColorRed,
		Quote:       tcell.ColorGreen,
		List:        tcell.ColorPurple,
		Keyword:     tcell.ColorBlue,
		String:      tcell.ColorRed,
		Comment:     tcell.ColorGreen,
		Number:      tcell.ColorTeal,
		Operator:    tcell.ColorBlack,
		Punctuation: tcell.ColorGray,
		Variable:    tcell.ColorBlue,
		Function:    tcell.ColorYellow,
		Type:        tcell.ColorTeal,
	}
}

func (t *BaseTheme) GetWelcomeMessage() string {
	return "Theme: " + t.displayName
}
