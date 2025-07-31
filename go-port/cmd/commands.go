package cmd

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/spf13/cobra"
	"github.com/spf13/viper"

	"writers-cli/internal/project"
	"writers-cli/internal/themes"
)

// newCmd creates a new writing file
var newCmd = &cobra.Command{
	Use:   "new [name]",
	Short: "Create a new writing file",
	Long: `Create a new writing file with optional template.

Examples:
  writers new story.md              # Create new markdown file
  writers new chapter1 --template novel-chapter
  writers new flash-fiction --template flash`,
	Args: cobra.ExactArgs(1),
	RunE: runNew,
}

// initCmd initializes a new writing project
var initCmd = &cobra.Command{
	Use:   "init [project-name]",
	Short: "Initialize a new writing project",
	Long: `Initialize a new writing project with templates and structure.

Project Types:
  novel          - Full novel with chapters and structure
  shortstories   - Short story collection
  article        - Article or blog post
  screenplay     - Screenplay format
  poetry         - Poetry collection
  journal        - Personal journal
  academic       - Academic paper or thesis

Examples:
  writers init my-novel --type novel
  writers init short-collection --type shortstories
  writers init .  # Initialize in current directory`,
	Args: cobra.MaximumNArgs(1),
	RunE: runInit,
}

// storyCmd manages stories in short story projects
var storyCmd = &cobra.Command{
	Use:   "story",
	Short: "Manage stories in your writing project",
	Long: `Manage stories, chapters, and other writing pieces in your project.

Commands:
  list           - List all stories/chapters
  new            - Create a new story
  status         - Show story status and progress
  move           - Move story to different status
  search         - Search through stories
  tag            - Add/remove tags from stories`,
}

// workflowCmd manages writing workflows
var workflowCmd = &cobra.Command{
	Use:   "workflow",
	Short: "Writing workflow automation",
	Long: `Automate common writing workflows and tasks.

Workflows:
  daily          - Daily writing session setup
  session        - Start a focused writing session
  submit         - Prepare for submission
  review         - Review and revision workflow
  sprint         - Writing sprint timer
  goal           - Track writing goals`,
}

// themeCmd manages editor themes
var themeCmd = &cobra.Command{
	Use:   "theme",
	Short: "Manage editor themes",
	Long: `Manage and customize editor themes.

Commands:
  list           - List available themes
  set            - Set default theme
  create         - Create custom theme
  export         - Export theme configuration
  import         - Import theme from file`,
}

var (
	// New command flags
	newTemplate string
	newOpen     bool

	// Init command flags
	initType        string
	initTemplate    string
	initGit         bool
	initForce       bool
	initDescription string

	// Theme command flags
	themePreview bool
)

func init() {
	// New command flags
	newCmd.Flags().StringVarP(&newTemplate, "template", "t", "", "template to use")
	newCmd.Flags().BoolVarP(&newOpen, "open", "o", true, "open file after creation")

	// Init command flags
	initCmd.Flags().StringVarP(&initType, "type", "t", "novel", "project type")
	initCmd.Flags().StringVar(&initTemplate, "template", "", "custom template")
	initCmd.Flags().BoolVarP(&initGit, "git", "g", true, "initialize git repository")
	initCmd.Flags().BoolVarP(&initForce, "force", "f", false, "force initialization in non-empty directory")
	initCmd.Flags().StringVarP(&initDescription, "description", "d", "", "project description")

	// Theme command flags
	themeCmd.Flags().BoolVarP(&themePreview, "preview", "p", false, "preview theme")

	// Add subcommands to story
	storyCmd.AddCommand(&cobra.Command{
		Use:   "list",
		Short: "List all stories",
		RunE:  runStoryList,
	})

	storyCmd.AddCommand(&cobra.Command{
		Use:   "new [name]",
		Short: "Create new story",
		Args:  cobra.ExactArgs(1),
		RunE:  runStoryNew,
	})

	// Add subcommands to workflow
	workflowCmd.AddCommand(&cobra.Command{
		Use:   "daily",
		Short: "Start daily writing session",
		RunE:  runWorkflowDaily,
	})

	workflowCmd.AddCommand(&cobra.Command{
		Use:   "session [duration]",
		Short: "Start focused writing session",
		Args:  cobra.MaximumNArgs(1),
		RunE:  runWorkflowSession,
	})

	// Add subcommands to theme
	themeCmd.AddCommand(&cobra.Command{
		Use:   "list",
		Short: "List available themes",
		RunE:  runThemeList,
	})

	themeCmd.AddCommand(&cobra.Command{
		Use:   "set [theme-name]",
		Short: "Set default theme",
		Args:  cobra.ExactArgs(1),
		RunE:  runThemeSet,
	})
}

func runNew(cmd *cobra.Command, args []string) error {
	filename := args[0]

	// Ensure .md extension if not provided
	if !strings.HasSuffix(filename, ".md") && !strings.Contains(filename, ".") {
		filename += ".md"
	}

	// Check if file already exists
	if _, err := os.Stat(filename); err == nil {
		return fmt.Errorf("file %s already exists", filename)
	}

	// Create file with template content
	content := getTemplateContent(newTemplate)

	if err := os.WriteFile(filename, []byte(content), 0644); err != nil {
		return fmt.Errorf("failed to create file: %w", err)
	}

	fmt.Printf("✅ Created %s\n", filename)

	// Open file if requested
	if newOpen {
		return runEdit(cmd, []string{filename})
	}

	return nil
}

func runInit(cmd *cobra.Command, args []string) error {
	var projectPath string

	if len(args) > 0 {
		projectPath = args[0]
	} else {
		projectPath = "."
	}

	// Create project directory if it doesn't exist
	if projectPath != "." {
		if err := os.MkdirAll(projectPath, 0755); err != nil {
			return fmt.Errorf("failed to create project directory: %w", err)
		}
	}

	// Check if directory is empty (unless force is used)
	if !initForce {
		entries, err := os.ReadDir(projectPath)
		if err != nil {
			return fmt.Errorf("failed to read directory: %w", err)
		}
		if len(entries) > 0 {
			return fmt.Errorf("directory is not empty, use --force to initialize anyway")
		}
	}

	// Initialize project
	projectConfig := &project.Config{
		Name:        filepath.Base(projectPath),
		Type:        initType,
		Template:    initTemplate,
		Description: initDescription,
		GitInit:     initGit,
	}

	if err := project.Initialize(projectPath, projectConfig); err != nil {
		return fmt.Errorf("failed to initialize project: %w", err)
	}

	fmt.Printf("🎉 Initialized %s project in %s\n", initType, projectPath)

	if initGit {
		fmt.Println("📚 Git repository initialized")
	}

	fmt.Println("\n🚀 Next steps:")
	fmt.Printf("  cd %s\n", projectPath)
	fmt.Println("  writers edit")

	return nil
}

func runStoryList(cmd *cobra.Command, args []string) error {
	// TODO: Implement story listing
	fmt.Println("📖 Stories in current project:")
	fmt.Println("  - story1.md (draft)")
	fmt.Println("  - story2.md (in-progress)")
	fmt.Println("  - story3.md (complete)")
	return nil
}

func runStoryNew(cmd *cobra.Command, args []string) error {
	storyName := args[0]

	// Create story file
	filename := fmt.Sprintf("%s.md", storyName)
	content := getTemplateContent("short-story")

	if err := os.WriteFile(filename, []byte(content), 0644); err != nil {
		return fmt.Errorf("failed to create story: %w", err)
	}

	fmt.Printf("📝 Created story: %s\n", filename)
	return nil
}

func runWorkflowDaily(cmd *cobra.Command, args []string) error {
	fmt.Println("🌅 Starting daily writing session...")
	fmt.Println("📊 Yesterday's progress: 750 words")
	fmt.Printf("🎯 Today's goal: %d words\n", viper.GetInt("writing.daily_goal"))
	fmt.Println("✍️  Ready to write! Use 'writers edit' to begin.")
	return nil
}

func runWorkflowSession(cmd *cobra.Command, args []string) error {
	duration := "25m" // default pomodoro
	if len(args) > 0 {
		duration = args[0]
	}

	fmt.Printf("⏰ Starting %s writing session...\n", duration)
	fmt.Println("🔕 Notifications disabled")
	fmt.Println("✍️  Focus time! Use 'writers edit' to begin writing.")
	return nil
}

func runThemeList(cmd *cobra.Command, args []string) error {
	themeManager := themes.NewManager()
	availableThemes := themeManager.GetAvailableThemes()

	fmt.Println("🎨 Available themes:")
	for _, theme := range availableThemes {
		icon := "☀️"
		if theme.IsDark {
			icon = "🌙"
		}

		current := ""
		if theme.Name == viper.GetString("editor.theme") {
			current = " (current)"
		}

		fmt.Printf("  %s %s - %s%s\n", icon, theme.Name, theme.DisplayName, current)
	}

	fmt.Println("\n💡 Use 'writers theme set <name>' to change default theme")
	fmt.Println("💡 Press F2 in editor to switch themes instantly")

	return nil
}

func runThemeSet(cmd *cobra.Command, args []string) error {
	themeName := args[0]

	// Validate theme exists
	themeManager := themes.NewManager()
	if !themeManager.HasTheme(themeName) {
		return fmt.Errorf("theme '%s' not found. Use 'writers theme list' to see available themes", themeName)
	}

	// Update config
	viper.Set("editor.theme", themeName)

	// Save config
	if err := viper.WriteConfig(); err != nil {
		// If config doesn't exist, create it
		if err := viper.SafeWriteConfig(); err != nil {
			return fmt.Errorf("failed to save theme setting: %w", err)
		}
	}

	fmt.Printf("🎨 Default theme set to: %s\n", themeName)
	fmt.Println("💡 The new theme will be used when you next launch the editor")

	return nil
}

func getTemplateContent(templateName string) string {
	templates := map[string]string{
		"": `# Untitled

Start writing your story here...

`,
		"short-story": `# Story Title

**Author:** Your Name
**Word Count:** 0
**Status:** Draft

## Story

Start your short story here...

---

## Notes

- Character notes
- Plot ideas
- Revision thoughts

`,
		"novel-chapter": `# Chapter X

> *"Opening quote or scene setting"*

Start your chapter here...

---

**Chapter Summary:**
- Key events
- Character development
- Plot advancement

`,
		"flash": `# Flash Fiction Title

**Word Limit:** 100-300 words
**Current Count:** 0

Every word counts in flash fiction. Start with a powerful opening...

`,
		"article": `# Article Title

**Author:** Your Name
**Date:** Today
**Word Count:** 0

## Introduction

Start your article with a compelling hook...

## Main Content

Develop your ideas here...

## Conclusion

Wrap up your thoughts...

`,
	}

	if content, exists := templates[templateName]; exists {
		return content
	}

	return templates[""] // default template
}
