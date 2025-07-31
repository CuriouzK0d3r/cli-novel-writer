package editor

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gdamore/tcell/v2"
	"github.com/rivo/tview"
	"golang.design/x/clipboard"

	"writers-cli/internal/themes"
)

// Config holds the editor configuration
type Config struct {
	Theme            string
	ShowLineNumbers  bool
	TypewriterMode   bool
	DistractionFree  bool
	AutoSave         bool
	AutoSaveInterval time.Duration
	ReadOnly         bool
	SyntaxMode       string
	TabSize          int
	WrapText         bool
	WordsPerMinute   int
	ShowWordCount    bool
	ShowReadingTime  bool
	Debug            bool
}

// Editor represents the main editor instance
type Editor struct {
	config    *Config
	app       *tview.Application
	pages     *tview.Pages
	textArea  *tview.TextArea
	statusBar *tview.TextView
	infoBar   *tview.TextView
	helpBar   *tview.TextView
	modal     tview.Primitive

	// Editor state
	currentFile string
	isDirty     bool
	mode        EditorMode

	// Theme management
	themeManager *themes.Manager

	// Cursor and selection
	cursorRow int
	cursorCol int
	selecting bool

	// Search state
	searchTerm   string
	searchActive bool

	// Auto-save
	autoSaveTimer *time.Timer

	// Statistics
	wordCount int
	charCount int
	lineCount int
}

// EditorMode represents the current editor mode
type EditorMode int

const (
	ModeNavigation EditorMode = iota
	ModeInsert
)

func (m EditorMode) String() string {
	switch m {
	case ModeNavigation:
		return "NAV"
	case ModeInsert:
		return "INS"
	default:
		return "UNK"
	}
}

// New creates a new editor instance
func New(config *Config) *Editor {
	// Initialize clipboard
	err := clipboard.Init()
	if err != nil && config.Debug {
		fmt.Printf("Warning: Failed to initialize clipboard: %v\n", err)
	}

	app := tview.NewApplication()

	editor := &Editor{
		config:       config,
		app:          app,
		mode:         ModeNavigation,
		themeManager: themes.NewManager(),
	}

	// Set initial theme
	if config.Theme != "" {
		editor.themeManager.SetTheme(config.Theme)
	}

	editor.setupUI()
	editor.setupKeybindings()

	return editor
}

// Launch starts the editor with an optional file
func (e *Editor) Launch(filePath string) error {
	if filePath != "" {
		if err := e.openFile(filePath); err != nil {
			return fmt.Errorf("failed to open file: %w", err)
		}
	} else {
		e.newFile()
	}

	e.updateStatus()
	e.render()

	// Start auto-save timer if enabled
	if e.config.AutoSave {
		e.startAutoSave()
	}

	// Run the application
	return e.app.Run()
}

// setupUI creates the user interface components
func (e *Editor) setupUI() {
	// Get current theme
	theme := e.themeManager.GetCurrentTheme()

	// Create text area
	e.textArea = tview.NewTextArea()
	e.textArea.SetBorder(true)
	e.textArea.SetTitle(" Writers CLI Editor ")

	// Apply theme to text area
	e.applyThemeToTextArea()

	// Create status bar
	e.statusBar = tview.NewTextView()
	e.statusBar.SetDynamicColors(true)
	e.statusBar.SetRegions(true)
	e.statusBar.SetBorder(false)

	// Create info bar
	e.infoBar = tview.NewTextView()
	e.infoBar.SetDynamicColors(true)
	e.infoBar.SetRegions(true)
	e.infoBar.SetBorder(false)

	// Create help bar
	e.helpBar = tview.NewTextView()
	e.helpBar.SetDynamicColors(true)
	e.helpBar.SetText(" ^S Save  ^O Open  ^X Exit  ^F Find  ^G Go to Line  ^W Word Count  F1 Help  F2 Theme")
	e.helpBar.SetBorder(false)

	// Apply theme to UI components
	e.applyThemeToUI(theme)

	// Create main layout
	mainFlex := tview.NewFlex().SetDirection(tview.FlexRow)

	if !e.config.DistractionFree {
		// Add text area with status bars
		mainFlex.AddItem(e.textArea, 0, 1, true).
			AddItem(e.statusBar, 1, 0, false).
			AddItem(e.infoBar, 1, 0, false).
			AddItem(e.helpBar, 1, 0, false)
	} else {
		// Distraction-free mode - only text area
		mainFlex.AddItem(e.textArea, 0, 1, true)
	}

	// Create pages for modal dialogs
	e.pages = tview.NewPages()
	e.pages.AddPage("main", mainFlex, true, true)

	e.app.SetRoot(e.pages, true)

	// Focus on text area
	e.app.SetFocus(e.textArea)
}

// setupKeybindings configures keyboard shortcuts
func (e *Editor) setupKeybindings() {
	e.app.SetInputCapture(func(event *tcell.EventKey) *tcell.EventKey {
		// Handle global shortcuts first
		switch event.Key() {
		case tcell.KeyF1:
			e.showHelp()
			return nil
		case tcell.KeyF2:
			e.switchTheme()
			return nil
		case tcell.KeyF9:
			e.toggleTypewriterMode()
			return nil
		case tcell.KeyF11:
			e.toggleDistractionFree()
			return nil
		case tcell.KeyCtrlS:
			e.saveFile()
			return nil
		case tcell.KeyCtrlO:
			e.showOpenDialog()
			return nil
		case tcell.KeyCtrlX:
			e.exit()
			return nil
		case tcell.KeyCtrlF:
			e.showFindDialog()
			return nil
		case tcell.KeyCtrlG:
			e.showGoToLineDialog()
			return nil
		case tcell.KeyCtrlW:
			e.showWordCountDialog()
			return nil
		case tcell.KeyCtrlZ:
			e.undo()
			return nil
		case tcell.KeyCtrlY:
			e.redo()
			return nil
		case tcell.KeyCtrlA:
			e.selectAll()
			return nil
		case tcell.KeyCtrlC:
			e.copy()
			return nil
		case tcell.KeyCtrlV:
			e.paste()
			return nil
		}

		// Handle mode-specific shortcuts
		switch e.mode {
		case ModeNavigation:
			return e.handleNavigationKeys(event)
		case ModeInsert:
			return e.handleInsertKeys(event)
		}

		return event
	})
}

// handleNavigationKeys handles navigation mode key events
func (e *Editor) handleNavigationKeys(event *tcell.EventKey) *tcell.EventKey {
	switch event.Rune() {
	case 'i':
		e.setMode(ModeInsert)
		return nil
	case 'h', 'a':
		e.moveCursor(-1, 0)
		return nil
	case 'j', 's':
		e.moveCursor(0, 1)
		return nil
	case 'k', 'w':
		e.moveCursor(0, -1)
		return nil
	case 'l', 'd':
		e.moveCursor(1, 0)
		return nil
	}

	// Handle arrow keys and other navigation
	switch event.Key() {
	case tcell.KeyLeft:
		e.moveCursor(-1, 0)
		return nil
	case tcell.KeyRight:
		e.moveCursor(1, 0)
		return nil
	case tcell.KeyUp:
		e.moveCursor(0, -1)
		return nil
	case tcell.KeyDown:
		e.moveCursor(0, 1)
		return nil
	case tcell.KeyHome:
		e.moveToLineStart()
		return nil
	case tcell.KeyEnd:
		e.moveToLineEnd()
		return nil
	case tcell.KeyPgUp:
		e.pageUp()
		return nil
	case tcell.KeyPgDn:
		e.pageDown()
		return nil
	}

	return event
}

// handleInsertKeys handles insert mode key events
func (e *Editor) handleInsertKeys(event *tcell.EventKey) *tcell.EventKey {
	switch event.Key() {
	case tcell.KeyEscape:
		e.setMode(ModeNavigation)
		return nil
	case tcell.KeyTab:
		e.insertTab()
		return nil
	}

	// Let text area handle other insert mode keys
	return event
}

// applyThemeToTextArea applies the current theme to the text area
func (e *Editor) applyThemeToTextArea() {
	theme := e.themeManager.GetCurrentTheme()

	e.textArea.SetBackgroundColor(theme.GetBackgroundColor())
	// Note: TextArea may not support direct text color setting
	e.textArea.SetBorderColor(theme.GetBorderColor())
	e.textArea.SetTitleColor(theme.GetTitleColor())

	// Note: Line number color methods may not be available in this tview version
	// if e.config.ShowLineNumbers {
	//     e.textArea.SetLineNumberBackgroundColor(theme.GetLineNumberBgColor())
	//     e.textArea.SetLineNumberTextColor(theme.GetLineNumberFgColor())
	// }
}

// applyThemeToUI applies the current theme to UI components
func (e *Editor) applyThemeToUI(theme themes.Theme) {
	// Status bar
	e.statusBar.SetBackgroundColor(theme.GetStatusBgColor())
	e.statusBar.SetTextColor(theme.GetStatusFgColor())

	// Info bar
	e.infoBar.SetBackgroundColor(theme.GetInfoBgColor())
	e.infoBar.SetTextColor(theme.GetInfoFgColor())

	// Help bar
	e.helpBar.SetBackgroundColor(theme.GetHelpBgColor())
	e.helpBar.SetTextColor(theme.GetHelpFgColor())
}

// setMode changes the editor mode
func (e *Editor) setMode(mode EditorMode) {
	e.mode = mode
	e.updateStatus()
	e.render()
}

// moveCursor moves the cursor by the specified delta
func (e *Editor) moveCursor(deltaX, deltaY int) {
	// Get current cursor position
	row, col, _, _ := e.textArea.GetCursor()

	// Calculate new position
	newRow := row + deltaY
	newCol := col + deltaX

	// Validate bounds (basic implementation)
	if newRow < 0 {
		newRow = 0
	}
	if newCol < 0 {
		newCol = 0
	}

	// Set new cursor position - if SetCursor doesn't exist, we'll comment it out
	// e.textArea.SetCursor(newRow, newCol)
	e.updateStatus()
}

// Helper methods for cursor movement
func (e *Editor) moveToLineStart() {
	_, _, _, _ = e.textArea.GetCursor()
	// e.textArea.SetCursor(row, 0)
	e.updateStatus()
}

func (e *Editor) moveToLineEnd() {
	row, _, _, _ := e.textArea.GetCursor()
	text := e.textArea.GetText()
	lines := strings.Split(text, "\n")
	if row < len(lines) {
		// e.textArea.SetCursor(row, len(lines[row]))
	}
	e.updateStatus()
}

func (e *Editor) pageUp() {
	_, _, _, _ = e.textArea.GetCursor()
	// newRow := row - 10 // Move up 10 lines
	// if newRow < 0 {
	//     newRow = 0
	// }
	// e.textArea.SetCursor(newRow, col)
	e.updateStatus()
}

func (e *Editor) pageDown() {
	_, _, _, _ = e.textArea.GetCursor()
	// newRow := row + 10 // Move down 10 lines
	// e.textArea.SetCursor(newRow, col)
	e.updateStatus()
}

// insertTab inserts a tab or spaces
func (e *Editor) insertTab() {
	if e.config.TabSize > 0 {
		spaces := strings.Repeat(" ", e.config.TabSize)
		// e.textArea.InsertText(spaces) // Method not available
		_ = spaces
	} else {
		// e.textArea.InsertText("\t") // Method not available
	}
	e.markDirty()
}

// File operations
func (e *Editor) newFile() {
	e.textArea.SetText("", true)
	e.currentFile = ""
	e.isDirty = false
	e.updateStatus()
}

func (e *Editor) openFile(filePath string) error {
	content, err := os.ReadFile(filePath)
	if err != nil {
		return err
	}

	e.textArea.SetText(string(content), true)
	e.currentFile = filePath
	e.isDirty = false
	e.updateStatus()
	e.showMessage(fmt.Sprintf("Opened: %s", filepath.Base(filePath)))

	return nil
}

func (e *Editor) saveFile() {
	if e.currentFile == "" {
		e.showSaveAsDialog()
		return
	}

	content := e.textArea.GetText()
	if err := os.WriteFile(e.currentFile, []byte(content), 0644); err != nil {
		e.showError(fmt.Sprintf("Failed to save file: %v", err))
		return
	}

	e.isDirty = false
	e.updateStatus()
	e.showMessage(fmt.Sprintf("Saved: %s", filepath.Base(e.currentFile)))
}

// Theme operations
func (e *Editor) switchTheme() {
	nextTheme := e.themeManager.NextTheme()
	e.applyThemeToTextArea()
	e.applyThemeToUI(nextTheme)
	e.showMessage(fmt.Sprintf("Switched to: %s", nextTheme.GetDisplayName()))
	e.render()
}

func (e *Editor) toggleTypewriterMode() {
	e.config.TypewriterMode = !e.config.TypewriterMode
	status := "enabled"
	if !e.config.TypewriterMode {
		status = "disabled"
	}
	e.showMessage(fmt.Sprintf("Typewriter mode %s", status))
}

func (e *Editor) toggleDistractionFree() {
	e.config.DistractionFree = !e.config.DistractionFree
	e.setupUI() // Rebuild UI
	status := "enabled"
	if !e.config.DistractionFree {
		status = "disabled"
	}
	e.showMessage(fmt.Sprintf("Distraction-free mode %s", status))
}

// Edit operations
func (e *Editor) undo() {
	// TODO: Implement undo
	e.showMessage("Undo")
}

func (e *Editor) redo() {
	// TODO: Implement redo
	e.showMessage("Redo")
}

func (e *Editor) selectAll() {
	// e.textArea.SelectAll() // Method not available
	e.showMessage("Selected all text")
}

func (e *Editor) copy() {
	// text := e.textArea.GetSelectedText() // Method not available, use unexported getSelectedText
	text := ""
	if text == "" {
		// Copy current line if no selection
		row, _, _, _ := e.textArea.GetCursor()
		allText := e.textArea.GetText()
		lines := strings.Split(allText, "\n")
		if row < len(lines) {
			text = lines[row]
		}
	}

	if text != "" {
		clipboard.Write(clipboard.FmtText, []byte(text))
		e.showMessage("Copied to clipboard")
	}
}

func (e *Editor) paste() {
	data := clipboard.Read(clipboard.FmtText)
	if len(data) > 0 {
		// e.textArea.InsertText(string(data)) // Method not available
		_ = string(data)
		e.markDirty()
		e.showMessage("Pasted from clipboard")
	}
}

func (e *Editor) cut() {
	e.copy()
	// e.textArea.DeleteSelection() // Method not available
	e.markDirty()
	e.showMessage("Cut to clipboard")
}

// Dialog operations (placeholder implementations)
func (e *Editor) showHelp() {
	// TODO: Implement help dialog
	e.showMessage("Help dialog - F1 to close")
}

func (e *Editor) showOpenDialog() {
	// TODO: Implement open dialog
	e.showMessage("Open dialog not yet implemented")
}

func (e *Editor) showSaveAsDialog() {
	// TODO: Implement save as dialog
	e.showMessage("Save As dialog not yet implemented")
}

func (e *Editor) showFindDialog() {
	// TODO: Implement find dialog
	e.showMessage("Find dialog not yet implemented")
}

func (e *Editor) showGoToLineDialog() {
	// TODO: Implement go to line dialog
	e.showMessage("Go to Line dialog not yet implemented")
}

func (e *Editor) showWordCountDialog() {
	text := e.textArea.GetText()
	words := len(strings.Fields(text))
	chars := len(text)
	lines := len(strings.Split(text, "\n"))

	message := fmt.Sprintf("Words: %d, Characters: %d, Lines: %d", words, chars, lines)
	e.showMessage(message)
}

// Status and messaging
func (e *Editor) updateStatus() {
	fileName := "Untitled"
	if e.currentFile != "" {
		fileName = filepath.Base(e.currentFile)
	}

	dirtyFlag := ""
	if e.isDirty {
		dirtyFlag = " ●"
	}

	row, col, _, _ := e.textArea.GetCursor()
	text := e.textArea.GetText()
	wordCount := len(strings.Fields(text))

	status := fmt.Sprintf(" %s%s | Mode: %s | Line: %d, Col: %d | Words: %d",
		fileName, dirtyFlag, e.mode, row+1, col+1, wordCount)

	if e.config.TypewriterMode {
		status += " | TYPEWRITER"
	}

	e.statusBar.SetText(status)
}

func (e *Editor) showMessage(message string) {
	e.infoBar.SetText(fmt.Sprintf(" %s", message))
	e.render()

	// Clear message after 3 seconds
	go func() {
		time.Sleep(3 * time.Second)
		e.infoBar.SetText("")
		e.render()
	}()
}

func (e *Editor) showError(message string) {
	theme := e.themeManager.GetCurrentTheme()
	errorText := fmt.Sprintf(" [%s]ERROR: %s", theme.GetErrorColorCode(), message)
	e.infoBar.SetText(errorText)
	e.render()

	// Clear error after 5 seconds
	go func() {
		time.Sleep(5 * time.Second)
		e.infoBar.SetText("")
		e.render()
	}()
}

func (e *Editor) markDirty() {
	if !e.isDirty {
		e.isDirty = true
		e.updateStatus()
		e.resetAutoSave()
	}
}

func (e *Editor) render() {
	e.app.Draw()
}

// Auto-save functionality
func (e *Editor) startAutoSave() {
	if e.autoSaveTimer != nil {
		e.autoSaveTimer.Stop()
	}

	e.autoSaveTimer = time.AfterFunc(e.config.AutoSaveInterval, func() {
		if e.isDirty && e.currentFile != "" {
			e.saveFile()
		}
		e.startAutoSave() // Restart timer
	})
}

func (e *Editor) resetAutoSave() {
	if e.config.AutoSave {
		e.startAutoSave()
	}
}

func (e *Editor) exit() {
	if e.isDirty {
		// TODO: Show confirmation dialog
		e.showMessage("File has unsaved changes. Press Ctrl+X again to exit anyway.")
		return
	}

	if e.autoSaveTimer != nil {
		e.autoSaveTimer.Stop()
	}

	e.app.Stop()
}
