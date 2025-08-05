use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use tokio::fs as async_fs;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectConfig {
    pub name: String,
    pub author: String,
    pub r#type: String, // "novel", "short-story", "simple-short-story", "blog"
    pub version: String,
    pub created: String,
    pub settings: Option<ProjectSettings>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectSettings {
    pub default_editor: Option<String>,
    pub auto_save: Option<bool>,
    pub auto_save_interval: Option<u32>,
    pub show_word_count: Option<bool>,
    pub show_reading_time: Option<bool>,
    pub tab_size: Option<u32>,
    pub wrap_text: Option<bool>,
    pub typewriter_mode: Option<bool>,
    pub typewriter_position: Option<f32>,
    pub typewriter_focus_lines: Option<u32>,
}

impl Default for ProjectSettings {
    fn default() -> Self {
        Self {
            default_editor: None,
            auto_save: Some(true),
            auto_save_interval: Some(30000),
            show_word_count: Some(true),
            show_reading_time: Some(true),
            tab_size: Some(2),
            wrap_text: Some(false),
            typewriter_mode: Some(false),
            typewriter_position: Some(0.66),
            typewriter_focus_lines: Some(1),
        }
    }
}

pub struct ProjectManager;

impl ProjectManager {
    /// Check if current directory is a Writers project
    pub fn is_writers_project() -> bool {
        Path::new("writers.config.json").exists()
    }

    /// Get the project configuration
    pub async fn get_config() -> Result<ProjectConfig> {
        if !Self::is_writers_project() {
            return Err(anyhow!("Not a Writers project"));
        }

        let config_content = async_fs::read_to_string("writers.config.json").await?;
        let config: ProjectConfig = serde_json::from_str(&config_content)?;
        Ok(config)
    }

    /// Save the project configuration
    pub async fn save_config(config: &ProjectConfig) -> Result<()> {
        let config_json = serde_json::to_string_pretty(config)?;
        async_fs::write("writers.config.json", config_json).await?;
        Ok(())
    }

    /// Create a new project configuration
    pub async fn create_project(
        name: String,
        author: String,
        project_type: String,
    ) -> Result<ProjectConfig> {
        let config = ProjectConfig {
            name,
            author,
            r#type: project_type,
            version: "1.0.0".to_string(),
            created: chrono::Utc::now().to_rfc3339(),
            settings: Some(ProjectSettings::default()),
        };

        Self::save_config(&config).await?;
        Ok(config)
    }

    /// Get all chapters in the project
    pub async fn get_chapters() -> Result<Vec<PathBuf>> {
        let mut chapters = Vec::new();

        if Path::new("chapters").exists() {
            let mut entries = async_fs::read_dir("chapters").await?;
            while let Some(entry) = entries.next_entry().await? {
                if entry.path().extension().and_then(|s| s.to_str()) == Some("md") {
                    chapters.push(entry.path());
                }
            }
        }

        chapters.sort();
        Ok(chapters)
    }

    /// Get all scenes in the project
    pub async fn get_scenes() -> Result<Vec<PathBuf>> {
        let mut scenes = Vec::new();

        if Path::new("scenes").exists() {
            let mut entries = async_fs::read_dir("scenes").await?;
            while let Some(entry) = entries.next_entry().await? {
                if entry.path().extension().and_then(|s| s.to_str()) == Some("md") {
                    scenes.push(entry.path());
                }
            }
        }

        scenes.sort();
        Ok(scenes)
    }

    /// Get all characters in the project
    pub async fn get_characters() -> Result<Vec<PathBuf>> {
        let mut characters = Vec::new();

        if Path::new("characters").exists() {
            let mut entries = async_fs::read_dir("characters").await?;
            while let Some(entry) = entries.next_entry().await? {
                if entry.path().extension().and_then(|s| s.to_str()) == Some("md") {
                    characters.push(entry.path());
                }
            }
        }

        characters.sort();
        Ok(characters)
    }

    /// Get all short stories in the project
    pub async fn get_short_stories() -> Result<Vec<PathBuf>> {
        let mut stories = Vec::new();

        // Check multiple possible directories
        let story_dirs = ["shortstories", "short", "stories", "drafts"];

        for dir in &story_dirs {
            if Path::new(dir).exists() {
                let mut entries = async_fs::read_dir(dir).await?;
                while let Some(entry) = entries.next_entry().await? {
                    if entry.path().extension().and_then(|s| s.to_str()) == Some("md") {
                        stories.push(entry.path());
                    }
                }
            }
        }

        stories.sort();
        Ok(stories)
    }

    /// Get all blog posts in the project
    pub async fn get_blog_posts() -> Result<Vec<PathBuf>> {
        let mut posts = Vec::new();

        if Path::new("drafts").exists() {
            let mut entries = async_fs::read_dir("drafts").await?;
            while let Some(entry) = entries.next_entry().await? {
                if entry.path().extension().and_then(|s| s.to_str()) == Some("md") {
                    posts.push(entry.path());
                }
            }
        }

        posts.sort();
        Ok(posts)
    }

    /// Get all notes in the project
    pub async fn get_notes() -> Result<Vec<PathBuf>> {
        let mut notes = Vec::new();

        if Path::new("notes").exists() {
            let mut entries = async_fs::read_dir("notes").await?;
            while let Some(entry) = entries.next_entry().await? {
                if entry.path().extension().and_then(|s| s.to_str()) == Some("md") {
                    notes.push(entry.path());
                }
            }
        }

        notes.sort();
        Ok(notes)
    }

    /// Find a file by name or partial name
    pub async fn find_file(target: &str) -> Result<Option<PathBuf>> {
        let target_lower = target.to_lowercase();

        // First try exact matches
        let possible_paths = vec![
            format!("chapters/{}.md", target),
            format!("scenes/{}.md", target),
            format!("characters/{}.md", target),
            format!("shortstories/{}.md", target),
            format!("short/{}.md", target),
            format!("stories/{}.md", target),
            format!("drafts/{}.md", target),
            format!("notes/{}.md", target),
            format!("{}.md", target),
        ];

        for path in possible_paths {
            if Path::new(&path).exists() {
                return Ok(Some(PathBuf::from(path)));
            }
        }

        // Then try partial matches
        let all_files = Self::get_all_content_files().await?;
        for file in all_files {
            if let Some(stem) = file.file_stem().and_then(|s| s.to_str()) {
                if stem.to_lowercase().contains(&target_lower) {
                    return Ok(Some(file));
                }
            }
        }

        Ok(None)
    }

    /// Get all content files in the project
    pub async fn get_all_content_files() -> Result<Vec<PathBuf>> {
        let mut files = Vec::new();

        files.extend(Self::get_chapters().await?);
        files.extend(Self::get_scenes().await?);
        files.extend(Self::get_characters().await?);
        files.extend(Self::get_short_stories().await?);
        files.extend(Self::get_blog_posts().await?);
        files.extend(Self::get_notes().await?);

        Ok(files)
    }

    /// Create necessary directories for a project type
    pub async fn create_project_structure(project_type: &str) -> Result<()> {
        match project_type {
            "novel" => {
                async_fs::create_dir_all("chapters").await?;
                async_fs::create_dir_all("scenes").await?;
                async_fs::create_dir_all("characters").await?;
                async_fs::create_dir_all("notes").await?;
                async_fs::create_dir_all("exports").await?;
            }
            "short-story" => {
                async_fs::create_dir_all("shortstories").await?;
                async_fs::create_dir_all("characters").await?;
                async_fs::create_dir_all("notes").await?;
                async_fs::create_dir_all("exports").await?;
            }
            "simple-short-story" => {
                async_fs::create_dir_all("drafts").await?;
                async_fs::create_dir_all("notes").await?;
            }
            "blog" => {
                async_fs::create_dir_all("drafts").await?;
                async_fs::create_dir_all("published").await?;
                async_fs::create_dir_all("assets").await?;
                async_fs::create_dir_all("templates").await?;
            }
            _ => {
                return Err(anyhow!("Unknown project type: {}", project_type));
            }
        }
        Ok(())
    }

    /// Get word count for a file
    pub async fn get_word_count(file_path: &Path) -> Result<usize> {
        let content = async_fs::read_to_string(file_path).await?;
        Ok(content.split_whitespace().count())
    }

    /// Get total word count for the project
    pub async fn get_total_word_count() -> Result<usize> {
        let files = Self::get_all_content_files().await?;
        let mut total = 0;

        for file in files {
            if let Ok(count) = Self::get_word_count(&file).await {
                total += count;
            }
        }

        Ok(total)
    }

    /// Backup the project
    pub async fn create_backup() -> Result<PathBuf> {
        let config = Self::get_config().await?;
        let timestamp = chrono::Utc::now().format("%Y%m%d_%H%M%S");
        let backup_name = format!("{}_{}.zip", config.name, timestamp);
        let backup_path = PathBuf::from("backups").join(&backup_name);

        // Create backups directory if it doesn't exist
        async_fs::create_dir_all("backups").await?;

        // TODO: Implement ZIP creation
        // For now, just create an empty file to indicate backup was attempted
        async_fs::write(&backup_path, "").await?;

        Ok(backup_path)
    }
}
