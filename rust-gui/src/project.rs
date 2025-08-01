use anyhow::{anyhow, Result};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use uuid::Uuid;
use walkdir::WalkDir;

use crate::commands::{Project, ProjectStatus};

const PROJECT_CONFIG_FILE: &str = "writers-project.json";
const CHAPTERS_DIR: &str = "chapters";
const CHARACTERS_DIR: &str = "characters";
const NOTES_DIR: &str = "notes";
const RESEARCH_DIR: &str = "research";
const EXPORTS_DIR: &str = "exports";
const BACKUPS_DIR: &str = "backups";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectConfig {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub genre: Option<String>,
    pub target_word_count: Option<usize>,
    pub created_at: DateTime<Utc>,
    pub last_modified: DateTime<Utc>,
    pub status: ProjectStatus,
    pub author: Option<String>,
    pub tags: Vec<String>,
    pub settings: ProjectSettings,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectSettings {
    pub auto_save: bool,
    pub auto_backup: bool,
    pub word_count_goal: Option<usize>,
    pub daily_goal: Option<usize>,
    pub chapter_numbering: ChapterNumbering,
    pub export_format: String,
    pub theme: Option<String>,
    pub font_family: Option<String>,
    pub font_size: Option<u32>,
    pub line_spacing: Option<f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ChapterNumbering {
    Numeric,
    Roman,
    Named,
    None,
}

impl Default for ProjectSettings {
    fn default() -> Self {
        Self {
            auto_save: true,
            auto_backup: true,
            word_count_goal: None,
            daily_goal: None,
            chapter_numbering: ChapterNumbering::Numeric,
            export_format: "pdf".to_string(),
            theme: None,
            font_family: Some("Georgia".to_string()),
            font_size: Some(12),
            line_spacing: Some(1.5),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Chapter {
    pub id: String,
    pub title: String,
    pub file_path: PathBuf,
    pub word_count: usize,
    pub created_at: DateTime<Utc>,
    pub last_modified: DateTime<Utc>,
    pub synopsis: Option<String>,
    pub status: ChapterStatus,
    pub order: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ChapterStatus {
    Planning,
    Drafting,
    FirstDraft,
    Editing,
    Reviewing,
    Complete,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Character {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub age: Option<u32>,
    pub occupation: Option<String>,
    pub role: CharacterRole,
    pub traits: Vec<String>,
    pub backstory: Option<String>,
    pub notes: Option<String>,
    pub image_path: Option<PathBuf>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CharacterRole {
    Protagonist,
    Antagonist,
    Supporting,
    Minor,
}

pub struct ProjectManager {
    recent_projects: Vec<Project>,
    current_project: Option<Project>,
    settings_path: PathBuf,
}

impl ProjectManager {
    pub fn new() -> Self {
        let settings_path = dirs::config_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("writers-cli")
            .join("settings.json");

        let mut manager = Self {
            recent_projects: Vec::new(),
            current_project: None,
            settings_path,
        };

        // Load recent projects
        if let Err(e) = manager.load_recent_projects() {
            log::warn!("Failed to load recent projects: {}", e);
        }

        manager
    }

    pub fn create_project(
        &mut self,
        name: &str,
        path: &str,
        template: Option<&str>,
    ) -> Result<Project> {
        let project_path = PathBuf::from(path);

        // Create project directory if it doesn't exist
        if !project_path.exists() {
            fs::create_dir_all(&project_path)?;
        }

        // Create project structure
        self.create_project_structure(&project_path)?;

        // Generate project ID
        let project_id = Uuid::new_v4().to_string();

        // Create project configuration
        let config = ProjectConfig {
            id: project_id.clone(),
            name: name.to_string(),
            description: None,
            genre: None,
            target_word_count: None,
            created_at: Utc::now(),
            last_modified: Utc::now(),
            status: ProjectStatus::Planning,
            author: None,
            tags: Vec::new(),
            settings: ProjectSettings::default(),
        };

        // Save project configuration
        let config_path = project_path.join(PROJECT_CONFIG_FILE);
        let config_json = serde_json::to_string_pretty(&config)?;
        fs::write(&config_path, config_json)?;

        // Apply template if specified
        if let Some(template_name) = template {
            self.apply_template(&project_path, template_name)?;
        }

        // Create project object
        let project = Project {
            id: project_id,
            name: name.to_string(),
            path: project_path,
            created_at: config.created_at,
            last_modified: config.last_modified,
            word_count: 0,
            target_word_count: config.target_word_count,
            description: config.description,
            genre: config.genre,
            status: config.status,
        };

        // Add to recent projects
        self.add_to_recent_projects(&project);
        self.current_project = Some(project.clone());

        Ok(project)
    }

    pub fn open_project(&mut self, path: &str) -> Result<Project> {
        let project_path = PathBuf::from(path);
        let config_path = project_path.join(PROJECT_CONFIG_FILE);

        if !config_path.exists() {
            return Err(anyhow!(
                "Project configuration not found at {}",
                config_path.display()
            ));
        }

        // Load project configuration
        let config_content = fs::read_to_string(&config_path)?;
        let config: ProjectConfig = serde_json::from_str(&config_content)?;

        // Calculate current word count
        let word_count = self.calculate_project_word_count(&project_path)?;

        // Create project object
        let project = Project {
            id: config.id,
            name: config.name,
            path: project_path,
            created_at: config.created_at,
            last_modified: config.last_modified,
            word_count,
            target_word_count: config.target_word_count,
            description: config.description,
            genre: config.genre,
            status: config.status,
        };

        // Add to recent projects
        self.add_to_recent_projects(&project);
        self.current_project = Some(project.clone());

        Ok(project)
    }

    pub fn save_project(&mut self, project: &Project) -> Result<()> {
        let config_path = project.path.join(PROJECT_CONFIG_FILE);

        // Load existing config or create new one
        let mut config = if config_path.exists() {
            let config_content = fs::read_to_string(&config_path)?;
            serde_json::from_str::<ProjectConfig>(&config_content)?
        } else {
            ProjectConfig {
                id: project.id.clone(),
                name: project.name.clone(),
                description: project.description.clone(),
                genre: project.genre.clone(),
                target_word_count: project.target_word_count,
                created_at: project.created_at,
                last_modified: Utc::now(),
                status: project.status.clone(),
                author: None,
                tags: Vec::new(),
                settings: ProjectSettings::default(),
            }
        };

        // Update config with current project data
        config.name = project.name.clone();
        config.description = project.description.clone();
        config.genre = project.genre.clone();
        config.target_word_count = project.target_word_count;
        config.last_modified = Utc::now();
        config.status = project.status.clone();

        // Save configuration
        let config_json = serde_json::to_string_pretty(&config)?;
        fs::write(&config_path, config_json)?;

        // Update current project
        self.current_project = Some(project.clone());

        Ok(())
    }

    pub fn get_recent_projects(&self) -> Vec<Project> {
        self.recent_projects.clone()
    }

    pub fn get_current_project(&self) -> Option<&Project> {
        self.current_project.as_ref()
    }

    pub fn get_chapters(&self, project_path: &Path) -> Result<Vec<Chapter>> {
        let chapters_dir = project_path.join(CHAPTERS_DIR);
        let mut chapters = Vec::new();

        if !chapters_dir.exists() {
            return Ok(chapters);
        }

        for entry in WalkDir::new(&chapters_dir)
            .max_depth(1)
            .into_iter()
            .filter_map(|e| e.ok())
        {
            if entry.file_type().is_file() {
                if let Some(extension) = entry.path().extension() {
                    if extension == "md" || extension == "txt" {
                        let chapter = self.load_chapter(entry.path())?;
                        chapters.push(chapter);
                    }
                }
            }
        }

        // Sort chapters by order
        chapters.sort_by_key(|c| c.order);

        Ok(chapters)
    }

    pub fn create_chapter(
        &self,
        project_path: &Path,
        title: &str,
        content: Option<&str>,
    ) -> Result<Chapter> {
        let chapters_dir = project_path.join(CHAPTERS_DIR);
        fs::create_dir_all(&chapters_dir)?;

        let file_name = format!("{}.md", self.sanitize_filename(title));
        let file_path = chapters_dir.join(&file_name);

        let chapter_id = Uuid::new_v4().to_string();
        let now = Utc::now();

        // Create chapter content with metadata
        let content = content.unwrap_or("");
        let chapter_content = format!(
            r#"---
id: {}
title: {}
created_at: {}
last_modified: {}
status: Drafting
order: 1
---

# {}

{}
"#,
            chapter_id,
            title,
            now.to_rfc3339(),
            now.to_rfc3339(),
            title,
            content
        );

        fs::write(&file_path, chapter_content)?;

        let chapter = Chapter {
            id: chapter_id,
            title: title.to_string(),
            file_path,
            word_count: crate::utils::count_words(content),
            created_at: now,
            last_modified: now,
            synopsis: None,
            status: ChapterStatus::Drafting,
            order: 1,
        };

        Ok(chapter)
    }

    pub fn get_characters(&self, project_path: &Path) -> Result<Vec<Character>> {
        let characters_dir = project_path.join(CHARACTERS_DIR);
        let characters_file = characters_dir.join("characters.json");

        if !characters_file.exists() {
            return Ok(Vec::new());
        }

        let content = fs::read_to_string(&characters_file)?;
        let characters: Vec<Character> = serde_json::from_str(&content)?;

        Ok(characters)
    }

    pub fn save_characters(&self, project_path: &Path, characters: &[Character]) -> Result<()> {
        let characters_dir = project_path.join(CHARACTERS_DIR);
        fs::create_dir_all(&characters_dir)?;

        let characters_file = characters_dir.join("characters.json");
        let content = serde_json::to_string_pretty(characters)?;
        fs::write(&characters_file, content)?;

        Ok(())
    }

    fn create_project_structure(&self, project_path: &Path) -> Result<()> {
        // Create main directories
        fs::create_dir_all(project_path.join(CHAPTERS_DIR))?;
        fs::create_dir_all(project_path.join(CHARACTERS_DIR))?;
        fs::create_dir_all(project_path.join(NOTES_DIR))?;
        fs::create_dir_all(project_path.join(RESEARCH_DIR))?;
        fs::create_dir_all(project_path.join(EXPORTS_DIR))?;
        fs::create_dir_all(project_path.join(BACKUPS_DIR))?;

        // Create initial files
        let readme_content = r#"# Project Notes

This is your project workspace. Here's how it's organized:

- **chapters/**: Your story chapters in Markdown format
- **characters/**: Character profiles and development
- **notes/**: General writing notes and ideas
- **research/**: Research materials and references
- **exports/**: Exported versions of your work
- **backups/**: Automatic backups of your project

## Getting Started

1. Start writing your first chapter in the `chapters/` directory
2. Develop your characters in the `characters/` directory
3. Keep notes and ideas in the `notes/` directory
4. Store research materials in the `research/` directory

Happy writing!
"#;
        fs::write(project_path.join("README.md"), readme_content)?;

        // Create initial chapter
        let first_chapter_content = r#"---
id: chapter-1
title: Chapter 1
created_at: ""
last_modified: ""
status: Drafting
order: 1
---

# Chapter 1

Start writing your story here...
"#;
        fs::write(
            project_path.join(CHAPTERS_DIR).join("chapter-1.md"),
            first_chapter_content,
        )?;

        Ok(())
    }

    fn apply_template(&self, project_path: &Path, template_name: &str) -> Result<()> {
        match template_name {
            "novel" => self.apply_novel_template(project_path)?,
            "short-story" => self.apply_short_story_template(project_path)?,
            "screenplay" => self.apply_screenplay_template(project_path)?,
            _ => return Err(anyhow!("Unknown template: {}", template_name)),
        }
        Ok(())
    }

    fn apply_novel_template(&self, project_path: &Path) -> Result<()> {
        // Create additional chapters for novel template
        for i in 2..=5 {
            let chapter_content = format!(
                r#"---
id: chapter-{}
title: Chapter {}
created_at: ""
last_modified: ""
status: Planning
order: {}
---

# Chapter {}

[Chapter {} content goes here...]
"#,
                i, i, i, i, i
            );
            fs::write(
                project_path
                    .join(CHAPTERS_DIR)
                    .join(format!("chapter-{}.md", i)),
                chapter_content,
            )?;
        }

        // Create character template
        let characters = vec![
            Character {
                id: Uuid::new_v4().to_string(),
                name: "Protagonist".to_string(),
                description: Some("The main character of your story".to_string()),
                age: None,
                occupation: None,
                role: CharacterRole::Protagonist,
                traits: vec!["brave".to_string(), "determined".to_string()],
                backstory: None,
                notes: None,
                image_path: None,
            },
            Character {
                id: Uuid::new_v4().to_string(),
                name: "Antagonist".to_string(),
                description: Some("The primary opposing force".to_string()),
                age: None,
                occupation: None,
                role: CharacterRole::Antagonist,
                traits: vec!["cunning".to_string(), "ruthless".to_string()],
                backstory: None,
                notes: None,
                image_path: None,
            },
        ];

        self.save_characters(project_path, &characters)?;

        Ok(())
    }

    fn apply_short_story_template(&self, project_path: &Path) -> Result<()> {
        // Replace the default chapter with a short story template
        let story_content = r#"---
id: short-story
title: Short Story
created_at: ""
last_modified: ""
status: Drafting
order: 1
---

# [Story Title]

**Opening Hook**
Start with a compelling opening that draws the reader in immediately.

**Setup**
Introduce your character and the situation they find themselves in.

**Conflict**
Present the central conflict or problem that drives the story.

**Rising Action**
Build tension and develop the conflict.

**Climax**
The turning point or moment of highest tension.

**Resolution**
Conclude the story and resolve the conflict.

---

*Word Count Goal: 1,000 - 5,000 words*
"#;
        fs::write(
            project_path.join(CHAPTERS_DIR).join("story.md"),
            story_content,
        )?;

        // Remove the default chapter
        let _ = fs::remove_file(project_path.join(CHAPTERS_DIR).join("chapter-1.md"));

        Ok(())
    }

    fn apply_screenplay_template(&self, project_path: &Path) -> Result<()> {
        let screenplay_content = r#"---
id: screenplay
title: Screenplay
created_at: ""
last_modified: ""
status: Drafting
order: 1
---

# [TITLE]

**FADE IN:**

## EXT. LOCATION - DAY

*Scene description goes here...*

**CHARACTER NAME**
Dialogue goes here.

**CHARACTER NAME (CONT'D)**
(character direction)
More dialogue.

*Action description...*

## INT. ANOTHER LOCATION - NIGHT

*Continue your screenplay...*

**FADE OUT.**

---

*Standard screenplay format. One page ≈ one minute of screen time.*
"#;
        fs::write(
            project_path.join(CHAPTERS_DIR).join("screenplay.md"),
            screenplay_content,
        )?;

        // Remove the default chapter
        let _ = fs::remove_file(project_path.join(CHAPTERS_DIR).join("chapter-1.md"));

        Ok(())
    }

    fn calculate_project_word_count(&self, project_path: &Path) -> Result<usize> {
        let chapters_dir = project_path.join(CHAPTERS_DIR);
        let mut total_words = 0;

        if chapters_dir.exists() {
            for entry in WalkDir::new(&chapters_dir)
                .into_iter()
                .filter_map(|e| e.ok())
            {
                if entry.file_type().is_file() {
                    if let Some(extension) = entry.path().extension() {
                        if extension == "md" || extension == "txt" {
                            let content = fs::read_to_string(entry.path())?;
                            total_words += crate::utils::count_words(&content);
                        }
                    }
                }
            }
        }

        Ok(total_words)
    }

    fn load_chapter(&self, file_path: &Path) -> Result<Chapter> {
        let content = fs::read_to_string(file_path)?;

        // Parse frontmatter if present
        let (metadata, content_body) = self.parse_frontmatter(&content);

        let chapter_id = metadata
            .get("id")
            .and_then(|v| v.as_str())
            .unwrap_or_else(|| file_path.file_stem().unwrap().to_str().unwrap())
            .to_string();

        let title = metadata
            .get("title")
            .and_then(|v| v.as_str())
            .unwrap_or_else(|| file_path.file_stem().unwrap().to_str().unwrap())
            .to_string();

        let order = metadata.get("order").and_then(|v| v.as_u64()).unwrap_or(1) as usize;

        let status = metadata
            .get("status")
            .and_then(|v| v.as_str())
            .map(|s| match s {
                "Planning" => ChapterStatus::Planning,
                "Drafting" => ChapterStatus::Drafting,
                "FirstDraft" => ChapterStatus::FirstDraft,
                "Editing" => ChapterStatus::Editing,
                "Reviewing" => ChapterStatus::Reviewing,
                "Complete" => ChapterStatus::Complete,
                _ => ChapterStatus::Drafting,
            })
            .unwrap_or(ChapterStatus::Drafting);

        let file_metadata = fs::metadata(file_path)?;
        let modified = DateTime::from(file_metadata.modified()?);

        Ok(Chapter {
            id: chapter_id,
            title,
            file_path: file_path.to_path_buf(),
            word_count: crate::utils::count_words(&content_body),
            created_at: modified,
            last_modified: modified,
            synopsis: None,
            status,
            order,
        })
    }

    fn parse_frontmatter(&self, content: &str) -> (HashMap<String, serde_json::Value>, String) {
        let mut metadata = HashMap::new();
        let mut content_body = content.to_string();

        if content.starts_with("---\n") {
            if let Some(end_pos) = content[4..].find("\n---\n") {
                let frontmatter = &content[4..end_pos + 4];
                content_body = content[end_pos + 8..].to_string();

                // Parse YAML-like frontmatter
                for line in frontmatter.lines() {
                    if let Some(colon_pos) = line.find(':') {
                        let key = line[..colon_pos].trim();
                        let value = line[colon_pos + 1..].trim();

                        // Try to parse as number, boolean, or string
                        let parsed_value = if let Ok(num) = value.parse::<i64>() {
                            serde_json::Value::Number(serde_json::Number::from(num))
                        } else if let Ok(boolean) = value.parse::<bool>() {
                            serde_json::Value::Bool(boolean)
                        } else {
                            serde_json::Value::String(value.trim_matches('"').to_string())
                        };

                        metadata.insert(key.to_string(), parsed_value);
                    }
                }
            }
        }

        (metadata, content_body)
    }

    fn sanitize_filename(&self, name: &str) -> String {
        name.chars()
            .map(|c| match c {
                'a'..='z' | 'A'..='Z' | '0'..='9' | '-' | '_' => c,
                ' ' => '-',
                _ => '_',
            })
            .collect::<String>()
            .to_lowercase()
    }

    fn add_to_recent_projects(&mut self, project: &Project) {
        // Remove if already exists
        self.recent_projects.retain(|p| p.id != project.id);

        // Add to front
        self.recent_projects.insert(0, project.clone());

        // Keep only last 10 projects
        self.recent_projects.truncate(10);

        // Save recent projects
        let _ = self.save_recent_projects();
    }

    fn load_recent_projects(&mut self) -> Result<()> {
        if !self.settings_path.exists() {
            return Ok(());
        }

        let content = fs::read_to_string(&self.settings_path)?;
        let settings: serde_json::Value = serde_json::from_str(&content)?;

        if let Some(recent) = settings.get("recent_projects") {
            if let Ok(projects) = serde_json::from_value::<Vec<Project>>(recent.clone()) {
                self.recent_projects = projects;
            }
        }

        Ok(())
    }

    fn save_recent_projects(&self) -> Result<()> {
        // Ensure parent directory exists
        if let Some(parent) = self.settings_path.parent() {
            fs::create_dir_all(parent)?;
        }

        let mut settings = if self.settings_path.exists() {
            let content = fs::read_to_string(&self.settings_path)?;
            serde_json::from_str::<serde_json::Value>(&content)
                .unwrap_or_else(|_| serde_json::json!({}))
        } else {
            serde_json::json!({})
        };

        settings["recent_projects"] = serde_json::to_value(&self.recent_projects)?;

        let content = serde_json::to_string_pretty(&settings)?;
        fs::write(&self.settings_path, content)?;

        Ok(())
    }
}

impl Default for ProjectManager {
    fn default() -> Self {
        Self::new()
    }
}
