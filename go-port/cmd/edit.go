package cmd

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"

	"writers-cli/internal/editor"
)

var editCmd = &cobra.Command{
	Use:   "edit [file]",
	Short: "Launch the beautiful themed editor",
	Long: `Launch the Writers CLI Editor with beautiful themes and modal editing.

🎨 Features:
  • Beautiful dark and light themes with syntax highlighting
  • Modal editing (Navigation/Insert modes like Vim)
  • Real-time word count and reading time estimation
  • Distraction-free and typewriter modes
  • Professional status bars and UI
  • Cross-platform clipboard support
  • Auto-save and backup functionality

🚀 Quick Start:
  writers edit              # Create new file
  writers edit story.md     # Open existing file
  writers edit .            # Browse current directory

⌨️  Key Controls:
  F2                        # Switch themes (Dark/Light/Base)
  F1                        # Show help
  F9                        # Toggle typewriter mode
  F11                       # Toggle distraction-free mode
  Ctrl+S                    # Save file
  Ctrl+O                    # Open file
  Ctrl+X                    # Exit editor
  i                         # Enter Insert mode (when in Navigation)
  Escape                    # Return to Navigation mode

The editor will automatically detect if you're working within a writing project
and provide context-aware features and templates.`,
	Args: cobra.MaximumNArgs(1),
	RunE: runEdit,
}

var (
	editTheme       string
	editLineNumbers bool
	editTypewriter  bool
	editDistraction bool
	editAutoSave    bool
	editReadOnly    bool
	editSyntax      string
)

func init() {
	// Editor behavior flags
	editCmd.Flags().StringVarP(&editTheme, "theme", "t", "", "editor theme (dark, light, base)")
	editCmd.Flags().BoolVarP(&editLineNumbers, "line-numbers", "n", true, "show line numbers")
	editCmd.Flags().BoolVarP(&editTypewriter, "typewriter", "", false, "start in typewriter mode")
	editCmd.Flags().BoolVarP(&editDistraction, "distraction-free", "d", false, "start in distraction-free mode")
	editCmd.Flags().BoolVarP(&editAutoSave, "auto-save", "a", true, "enable auto-save")
	editCmd.Flags().BoolVarP(&editReadOnly, "read-only", "r", false, "open in read-only mode")
	editCmd.Flags().StringVarP(&editSyntax, "syntax", "s", "markdown", "syntax highlighting mode")

	// Bind flags to viper
	viper.BindPFlag("editor.theme", editCmd.Flags().Lookup("theme"))
	viper.BindPFlag("editor.show_line_numbers", editCmd.Flags().Lookup("line-numbers"))
	viper.BindPFlag("editor.typewriter_mode", editCmd.Flags().Lookup("typewriter"))
	viper.BindPFlag("editor.auto_save", editCmd.Flags().Lookup("auto-save"))
}

func runEdit(cmd *cobra.Command, args []string) error {
	var filePath string

	// Determine file path
	if len(args) > 0 {
		filePath = args[0]

		// Handle special cases
		if filePath == "." {
			// Browse current directory
			return browseDirectory(".")
		}

		// Resolve relative paths
		absPath, err := filepath.Abs(filePath)
		if err != nil {
			return fmt.Errorf("failed to resolve file path: %w", err)
		}
		filePath = absPath

		// Check if file exists and is accessible
		if info, err := os.Stat(filePath); err == nil {
			if info.IsDir() {
				return browseDirectory(filePath)
			}
		}
	}

	// Create editor configuration from flags and config
	config := &editor.Config{
		Theme:            getTheme(),
		ShowLineNumbers:  viper.GetBool("editor.show_line_numbers"),
		TypewriterMode:   viper.GetBool("editor.typewriter_mode"),
		DistractionFree:  editDistraction,
		AutoSave:         viper.GetBool("editor.auto_save"),
		AutoSaveInterval: viper.GetDuration("editor.auto_save_interval"),
		ReadOnly:         editReadOnly,
		SyntaxMode:       editSyntax,
		TabSize:          viper.GetInt("editor.tab_size"),
		WrapText:         viper.GetBool("editor.wrap_text"),
		WordsPerMinute:   viper.GetInt("writing.words_per_minute"),
		ShowWordCount:    viper.GetBool("writing.show_word_count"),
		ShowReadingTime:  viper.GetBool("writing.show_reading_time"),
		Debug:            viper.GetBool("debug"),
	}

	// Create and launch editor
	ed := editor.New(config)

	if viper.GetBool("debug") {
		fmt.Printf("Launching editor with file: %s\n", filePath)
		fmt.Printf("Theme: %s\n", config.Theme)
		fmt.Printf("Config: %+v\n", config)
	}

	// Launch the editor
	if err := ed.Launch(filePath); err != nil {
		return fmt.Errorf("failed to launch editor: %w", err)
	}

	return nil
}

func getTheme() string {
	// Priority: flag > config > default
	if editTheme != "" {
		return editTheme
	}

	theme := viper.GetString("editor.theme")
	if theme == "" {
		theme = "dark" // default
	}

	return theme
}

func browseDirectory(dirPath string) error {
	// TODO: Implement directory browser
	// For now, just show an error
	return fmt.Errorf("directory browsing not yet implemented. Please specify a file to edit")
}
