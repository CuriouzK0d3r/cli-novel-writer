package cmd

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var cfgFile string

// rootCmd represents the base command when called without any subcommands
var rootCmd = &cobra.Command{
	Use:   "writers",
	Short: "A beautiful CLI tool for writers with dark themes and modal editing",
	Long: `Writers CLI - A Professional Writing Environment

A modern, feature-rich command-line editor designed specifically for writers.
Features include:

🎨 Beautiful Themes:
  • Dark theme - Modern colors, easy on the eyes
  • Light theme - Clean interface for daylight writing
  • Syntax highlighting for Markdown

✍️ Writing-Focused Features:
  • Modal editing (Navigation/Insert modes)
  • Distraction-free writing mode
  • Typewriter mode with focus dimming
  • Real-time word count and reading time
  • Professional status bars

📝 File Management:
  • Smart project initialization
  • Template system for different writing projects
  • Auto-save and backup functionality
  • Cross-platform clipboard support

Perfect for novels, short stories, articles, and any serious writing work.`,
	Version: "2.0.0",
}

// Execute adds all child commands to the root command and sets flags appropriately.
func Execute() error {
	return rootCmd.Execute()
}

func init() {
	cobra.OnInitialize(initConfig)

	// Global flags
	rootCmd.PersistentFlags().StringVar(&cfgFile, "config", "", "config file (default is $HOME/.writers-cli.yaml)")
	rootCmd.PersistentFlags().Bool("debug", false, "enable debug mode")

	// Bind flags to viper
	viper.BindPFlag("debug", rootCmd.PersistentFlags().Lookup("debug"))

	// Add subcommands
	rootCmd.AddCommand(newCmd)
	rootCmd.AddCommand(editCmd)
	rootCmd.AddCommand(initCmd)
	rootCmd.AddCommand(storyCmd)
	rootCmd.AddCommand(workflowCmd)
	rootCmd.AddCommand(themeCmd)
}

// initConfig reads in config file and ENV variables if set.
func initConfig() {
	if cfgFile != "" {
		// Use config file from the flag.
		viper.SetConfigFile(cfgFile)
	} else {
		// Find home directory.
		home, err := os.UserHomeDir()
		cobra.CheckErr(err)

		// Search config in home directory with name ".writers-cli" (without extension).
		viper.AddConfigPath(home)
		viper.SetConfigType("yaml")
		viper.SetConfigName(".writers-cli")
	}

	viper.AutomaticEnv() // read in environment variables that match

	// If a config file is found, read it in.
	if err := viper.ReadInConfig(); err == nil {
		if viper.GetBool("debug") {
			fmt.Fprintln(os.Stderr, "Using config file:", viper.ConfigFileUsed())
		}
	}

	// Set default values
	setDefaults()
}

func setDefaults() {
	// Editor defaults
	viper.SetDefault("editor.theme", "dark")
	viper.SetDefault("editor.show_line_numbers", true)
	viper.SetDefault("editor.auto_save", true)
	viper.SetDefault("editor.auto_save_interval", "30s")
	viper.SetDefault("editor.tab_size", 2)
	viper.SetDefault("editor.wrap_text", false)
	viper.SetDefault("editor.typewriter_mode", false)
	viper.SetDefault("editor.typewriter_position", 0.66)
	viper.SetDefault("editor.typewriter_focus_lines", 1)

	// Writing defaults
	viper.SetDefault("writing.show_word_count", true)
	viper.SetDefault("writing.show_reading_time", true)
	viper.SetDefault("writing.words_per_minute", 200)
	viper.SetDefault("writing.daily_goal", 500)

	// Project defaults
	viper.SetDefault("project.default_template", "novel")
	viper.SetDefault("project.backup_enabled", true)
	viper.SetDefault("project.backup_interval", "5m")

	// Theme defaults
	viper.SetDefault("theme.current", "dark")
	viper.SetDefault("theme.auto_switch", false)
	viper.SetDefault("theme.dark_hours", []int{18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5, 6})
}
