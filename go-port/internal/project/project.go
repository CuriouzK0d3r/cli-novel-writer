package project

import (
	"fmt"
	"os"
	"path/filepath"
	"time"
)

// Config holds project configuration
type Config struct {
	Name        string
	Type        string
	Template    string
	Description string
	GitInit     bool
}

// Project represents a writing project
type Project struct {
	Name        string    `yaml:"name"`
	Type        string    `yaml:"type"`
	Description string    `yaml:"description"`
	Author      string    `yaml:"author"`
	Created     time.Time `yaml:"created"`
	Updated     time.Time `yaml:"updated"`
	Version     string    `yaml:"version"`
	Goals       Goals     `yaml:"goals"`
	Settings    Settings  `yaml:"settings"`
}

// Goals holds project goals and targets
type Goals struct {
	DailyWords  int `yaml:"daily_words"`
	TotalWords  int `yaml:"total_words"`
	Deadline    string `yaml:"deadline"`
	Description string `yaml:"description"`
}

// Settings holds project-specific settings
type Settings struct {
	Theme         string `yaml:"theme"`
	AutoSave      bool   `yaml:"auto_save"`
	WordWrap      bool   `yaml:"word_wrap"`
	ShowWordCount bool   `yaml:"show_word_count"`
	BackupEnabled bool   `yaml:"backup_enabled"`
}

// Initialize creates a new writing project
func Initialize(projectPath string, config *Config) error {
	// Create project directory if it doesn't exist
	if err := os.MkdirAll(projectPath, 0755); err != nil {
		return fmt.Errorf("failed to create project directory: %w", err)
	}

	// Create project structure based on type
	if err := createProjectStructure(projectPath, config.Type); err != nil {
		return fmt.Errorf("failed to create project structure: %w", err)
	}

	// Create project configuration file
	project := &Project{
		Name:        config.Name,
		Type:        config.Type,
		Description: config.Description,
		Author:      getAuthorName(),
		Created:     time.Now(),
		Updated:     time.Now(),
		Version:     "1.0.0",
		Goals: Goals{
			DailyWords:  500,
			TotalWords:  50000,
			Description: "Complete first draft",
		},
		Settings: Settings{
			Theme:         "dark",
			AutoSave:      true,
			WordWrap:      false,
			ShowWordCount: true,
			BackupEnabled: true,
		},
	}

	if err := saveProjectConfig(projectPath, project); err != nil {
		return fmt.Errorf("failed to save project config: %w", err)
	}

	// Initialize git repository if requested
	if config.GitInit {
		if err := initializeGit(projectPath); err != nil {
			return fmt.Errorf("failed to initialize git: %w", err)
		}
	}

	return nil
}

// createProjectStructure creates the directory structure for different project types
func createProjectStructure(projectPath, projectType string) error {
	structures := map[string][]string{
		"novel": {
			"chapters",
			"characters",
			"notes",
			"research",
			"drafts",
			"outline",
		},
		"shortstories": {
			"stories",
			"drafts",
			"published",
			"submissions",
			"notes",
		},
		"article": {
			"drafts",
			"research",
			"images",
			"notes",
		},
		"screenplay": {
			"scenes",
			"characters",
			"treatments",
			"notes",
			"drafts",
		},
		"poetry": {
			"poems",
			"collections",
			"drafts",
			"notes",
		},
		"journal": {
			"entries",
			"templates",
			"notes",
		},
		"academic": {
			"chapters",
			"references",
			"research",
			"notes",
			"drafts",
			"figures",
		},
	}

	dirs, exists := structures[projectType]
	if !exists {
		dirs = structures["novel"] // default structure
	}

	// Create directories
	for _, dir := range dirs {
		dirPath := filepath.Join(projectPath, dir)
		if err := os.MkdirAll(dirPath, 0755); err != nil {
			return err
		}

		// Create a README in each directory
		readmePath := filepath.Join(dirPath, "README.md")
		readmeContent := fmt.Sprintf("# %s\n\nThis directory contains %s for your %s project.\n",
			dir, dir, projectType)

		if err := os.WriteFile(readmePath, []byte(readmeContent), 0644); err != nil {
			return err
		}
	}

	// Create main project files
	if err := createProjectFiles(projectPath, projectType); err != nil {
		return err
	}

	return nil
}

// createProjectFiles creates initial files for the project
func createProjectFiles(projectPath, projectType string) error {
	files := map[string]string{
		"README.md": getReadmeTemplate(projectType),
		".gitignore": getGitignoreTemplate(),
	}

	// Add project-specific files
	switch projectType {
	case "novel":
		files["outline/main-outline.md"] = getNovelOutlineTemplate()
		files["characters/character-template.md"] = getCharacterTemplate()
		files["chapters/chapter-01.md"] = getChapterTemplate()
	case "shortstories":
		files["stories/story-template.md"] = getStoryTemplate()
		files["submissions/submission-tracker.md"] = getSubmissionTrackerTemplate()
	case "article":
		files["article.md"] = getArticleTemplate()
	case "screenplay":
		files["screenplay.fountain"] = getScreenplayTemplate()
		files["characters/character-list.md"] = getCharacterTemplate()
	case "poetry":
		files["poems/first-poem.md"] = getPoemTemplate()
		files["collections/collection-notes.md"] = getCollectionTemplate()
	case "journal":
		files["entries/template.md"] = getJournalTemplate()
	case "academic":
		files["thesis.md"] = getThesisTemplate()
		files["references/bibliography.md"] = getBibliographyTemplate()
	}

	// Create files
	for filePath, content := range files {
		fullPath := filepath.Join(projectPath, filePath)

		// Create directory if it doesn't exist
		if err := os.MkdirAll(filepath.Dir(fullPath), 0755); err != nil {
			return err
		}

		if err := os.WriteFile(fullPath, []byte(content), 0644); err != nil {
			return err
		}
	}

	return nil
}

// saveProjectConfig saves the project configuration
func saveProjectConfig(projectPath string, project *Project) error {
	// For now, create a simple YAML-like file
	// In a full implementation, you'd use gopkg.in/yaml.v3
	configPath := filepath.Join(projectPath, ".writers-project.yml")

	content := fmt.Sprintf(`name: %s
type: %s
description: %s
author: %s
created: %s
updated: %s
version: %s

goals:
  daily_words: %d
  total_words: %d
  deadline: "%s"
  description: "%s"

settings:
  theme: %s
  auto_save: %t
  word_wrap: %t
  show_word_count: %t
  backup_enabled: %t
`,
		project.Name,
		project.Type,
		project.Description,
		project.Author,
		project.Created.Format(time.RFC3339),
		project.Updated.Format(time.RFC3339),
		project.Version,
		project.Goals.DailyWords,
		project.Goals.TotalWords,
		project.Goals.Deadline,
		project.Goals.Description,
		project.Settings.Theme,
		project.Settings.AutoSave,
		project.Settings.WordWrap,
		project.Settings.ShowWordCount,
		project.Settings.BackupEnabled,
	)

	return os.WriteFile(configPath, []byte(content), 0644)
}

// initializeGit initializes a git repository
func initializeGit(projectPath string) error {
	// This is a simplified implementation
	// In a real implementation, you'd use go-git or exec git commands
	gitPath := filepath.Join(projectPath, ".git")
	return os.MkdirAll(gitPath, 0755)
}

// getAuthorName gets the author name from environment or defaults
func getAuthorName() string {
	if name := os.Getenv("GIT_AUTHOR_NAME"); name != "" {
		return name
	}
	if name := os.Getenv("USER"); name != "" {
		return name
	}
	return "Author"
}

// Template functions
func getReadmeTemplate(projectType string) string {
	return fmt.Sprintf(`# %s Project

This is a %s project created with Writers CLI.

## Getting Started

Use the Writers CLI editor to begin writing:

` + "```" + `bash
writers edit
` + "```" + `

## Project Structure

This project follows the standard %s structure with organized directories for different aspects of your work.

## Goals

- Set your daily writing goals
- Track your progress
- Meet your deadlines

## Tips

- Use F2 to switch between dark and light themes
- Press F9 for typewriter mode
- Use Ctrl+W to check word count

Happy writing! 📝
`, projectType, projectType, projectType)
}

func getGitignoreTemplate() string {
	return `# Writers CLI
.writers-backup/
*.tmp
*.bak

# OS
.DS_Store
Thumbs.db

# Editor
*.swp
*.swo
*~

# Compiled
*.pdf
*.docx
*.epub
*.mobi
`
}

func getNovelOutlineTemplate() string {
	return `# Novel Outline

## Story Overview

**Title:** Your Novel Title
**Genre:**
**Target Length:** 80,000 words
**Logline:** One sentence summary of your story

## Three-Act Structure

### Act I - Setup (25%)
- **Hook:**
- **Inciting Incident:**
- **Plot Point 1:**

### Act II - Confrontation (50%)
- **Rising Action:**
- **Midpoint:**
- **Plot Point 2:**

### Act III - Resolution (25%)
- **Climax:**
- **Falling Action:**
- **Resolution:**

## Characters

- **Protagonist:**
- **Antagonist:**
- **Supporting Characters:**

## Themes

- Primary theme:
- Secondary themes:

## Chapter Breakdown

1. Chapter 1 -
2. Chapter 2 -
3. Chapter 3 -
...
`
}

func getCharacterTemplate() string {
	return `# Character Profile

## Basic Information

**Name:**
**Age:**
**Occupation:**
**Location:**

## Physical Description

**Appearance:**
**Distinguishing Features:**

## Personality

**Traits:**
**Strengths:**
**Weaknesses:**
**Fears:**
**Goals:**

## Background

**Family:**
**Education:**
**Important Events:**

## Role in Story

**Function:**
**Character Arc:**
**Relationships:**

## Voice and Dialogue

**Speaking Style:**
**Catchphrases:**
**Internal Voice:**

## Notes

Additional character notes and development ideas.
`
}

func getChapterTemplate() string {
	return `# Chapter 1

## Chapter Summary

Brief summary of what happens in this chapter.

## Goals

- What needs to be accomplished
- Character development
- Plot advancement

---

Start writing your chapter here...

## Notes

- Revision notes
- Ideas for improvement
- Continuity reminders
`
}

func getStoryTemplate() string {
	return `# Story Title

**Author:** Your Name
**Word Count:** 0 / Target: 5,000
**Status:** Draft
**Genre:**
**Theme:**

## Story Summary

Brief summary of your story.

## Notes

- Character notes
- Plot ideas
- Setting details

---

## Story

Start your story here...
`
}

func getSubmissionTrackerTemplate() string {
	return `# Submission Tracker

| Story | Market | Submitted | Response | Status | Notes |
|-------|--------|-----------|----------|---------|-------|
| Story 1 | Magazine A | 2024-01-01 | - | Pending | - |
| Story 2 | Magazine B | 2024-01-15 | Rejection | Closed | Good feedback |

## Markets to Consider

- **Magazine A** - Sci-fi, pays $0.10/word, 5,000 word limit
- **Magazine B** - Literary, pays $50, 3,000 word limit
- **Magazine C** - Horror, pays $25, 2,500 word limit

## Submission Guidelines

- Always read guidelines carefully
- Track response times
- Keep records of feedback
- Multiple submissions only if allowed
`
}

func getArticleTemplate() string {
	return `# Article Title

**Author:** Your Name
**Publication:** Target Publication
**Word Count:** 0 / Target: 1,500
**Status:** Draft
**Deadline:**

## Article Outline

### Introduction
- Hook
- Background
- Thesis

### Main Points
1. First point
2. Second point
3. Third point

### Conclusion
- Summary
- Call to action

---

## Article

Start writing your article here...

## Research Notes

- Sources
- Statistics
- Quotes
- References
`
}

func getScreenplayTemplate() string {
	return `Title: YOUR SCREENPLAY TITLE
Author: Your Name
Contact: your.email@example.com

FADE IN:

EXT. LOCATION - DAY

Write your screenplay here using standard formatting.

Character dialogue should be centered and formatted properly.

FADE OUT.
`
}

func getPoemTemplate() string {
	return `# First Poem

**Title:** Untitled
**Form:** Free verse
**Theme:**
**Date:** Today

---

Write your poem here.
Each line can be its own line,
or you can group them into stanzas.

Let your creativity flow.

---

## Notes

- Inspiration
- Revision ideas
- Form experiments
`
}

func getCollectionTemplate() string {
	return `# Collection Notes

**Collection Title:**
**Theme:**
**Target Length:** 20-30 poems
**Status:** Planning

## Poems to Include

1. Poem 1 - Complete
2. Poem 2 - Draft
3. Poem 3 - Idea

## Themes and Motifs

- Primary theme:
- Secondary themes:
- Recurring images:

## Structure and Flow

- Opening poem:
- Sections:
- Closing poem:

## Submission Plans

- Journals to consider:
- Contest deadlines:
- Reading opportunities:
`
}

func getJournalTemplate() string {
	return `# Journal Entry - {{DATE}}

## Mood

**Overall feeling:**
**Energy level:**

## Today's Events

What happened today that was significant?

## Thoughts and Reflections

What's on your mind?

## Gratitude

Three things you're grateful for:
1.
2.
3.

## Tomorrow's Goals

What do you want to accomplish tomorrow?

---

## Free Writing

Just write whatever comes to mind...
`
}

func getThesisTemplate() string {
	return `# Thesis Title

**Author:** Your Name
**Department:**
**Advisor:**
**Target Length:** 100-200 pages
**Defense Date:**

## Abstract

Brief summary of your research and findings.

## Table of Contents

1. Introduction
2. Literature Review
3. Methodology
4. Results
5. Discussion
6. Conclusion
7. References
8. Appendices

---

## Chapter 1: Introduction

Start your thesis here...

### Research Question

What question are you trying to answer?

### Hypothesis

What do you expect to find?

### Significance

Why is this research important?
`
}

func getBibliographyTemplate() string {
	return `# Bibliography

## Primary Sources

- Author, A. (Year). *Title of work*. Publisher.
- Author, B. (Year). Title of article. *Journal Name*, Volume(Issue), pages.

## Secondary Sources

- Author, C. (Year). *Title of book*. Publisher.
- Author, D. (Year). Title of article. *Journal Name*, Volume(Issue), pages.

## Online Sources

- Author, E. (Year). Title of webpage. *Website Name*. URL

## Guidelines

- Follow your institution's citation style (APA, MLA, Chicago, etc.)
- Keep track of all sources as you research
- Include page numbers for direct quotes
- Verify all URLs and access dates
`
}
