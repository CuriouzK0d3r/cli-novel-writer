use crate::AppState;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use tauri::State;

// Project-related structures
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub path: PathBuf,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub last_modified: chrono::DateTime<chrono::Utc>,
    pub word_count: usize,
    pub target_word_count: Option<usize>,
    pub description: Option<String>,
    pub genre: Option<String>,
    pub status: ProjectStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ProjectStatus {
    Planning,
    Drafting,
    Editing,
    Reviewing,
    Complete,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileInfo {
    pub name: String,
    pub path: PathBuf,
    pub size: u64,
    pub modified: chrono::DateTime<chrono::Utc>,
    pub content_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WritingStats {
    pub session_duration: std::time::Duration,
    pub words_written: usize,
    pub total_words: usize,
    pub pages: usize,
    pub characters: usize,
    pub paragraphs: usize,
    pub reading_time: std::time::Duration,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportOptions {
    pub format: String,
    pub output_path: PathBuf,
    pub include_metadata: bool,
    pub custom_styles: Option<String>,
    pub page_size: Option<String>,
    pub font_family: Option<String>,
    pub font_size: Option<u32>,
}

// Project Commands
#[tauri::command]
pub async fn create_new_project(
    name: String,
    path: String,
    template: Option<String>,
    state: State<'_, AppState>,
) -> Result<Project, String> {
    let mut project_manager = state.project_manager.lock();
    project_manager
        .create_project(&name, &path, template.as_deref())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn open_project(path: String, state: State<'_, AppState>) -> Result<Project, String> {
    let mut project_manager = state.project_manager.lock();
    project_manager
        .open_project(&path)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn save_project(project: Project, state: State<'_, AppState>) -> Result<(), String> {
    let mut project_manager = state.project_manager.lock();
    project_manager
        .save_project(&project)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_recent_projects(state: State<'_, AppState>) -> Result<Vec<Project>, String> {
    let project_manager = state.project_manager.lock();
    Ok(project_manager.get_recent_projects())
}

// File Operations
#[tauri::command]
pub async fn read_file_content(file_path: String) -> Result<String, String> {
    std::fs::read_to_string(&file_path)
        .map_err(|e| format!("Failed to read file {}: {}", file_path, e))
}

#[tauri::command]
pub async fn write_file_content(file_path: String, content: String) -> Result<(), String> {
    std::fs::write(&file_path, content)
        .map_err(|e| format!("Failed to write file {}: {}", file_path, e))
}

#[tauri::command]
pub async fn create_file(file_path: String, content: Option<String>) -> Result<(), String> {
    let content = content.unwrap_or_default();

    // Create parent directories if they don't exist
    if let Some(parent) = std::path::Path::new(&file_path).parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directories: {}", e))?;
    }

    std::fs::write(&file_path, content)
        .map_err(|e| format!("Failed to create file {}: {}", file_path, e))
}

#[tauri::command]
pub async fn delete_file(file_path: String) -> Result<(), String> {
    std::fs::remove_file(&file_path)
        .map_err(|e| format!("Failed to delete file {}: {}", file_path, e))
}

#[tauri::command]
pub async fn rename_file(old_path: String, new_path: String) -> Result<(), String> {
    std::fs::rename(&old_path, &new_path)
        .map_err(|e| format!("Failed to rename file {} to {}: {}", old_path, new_path, e))
}

// Export Commands
#[tauri::command]
pub async fn export_to_pdf(
    project_path: String,
    output_path: String,
    options: ExportOptions,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let export_manager = state.export_manager.lock();
    export_manager
        .export_to_pdf(&project_path, &output_path, &options)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn export_to_epub(
    project_path: String,
    output_path: String,
    options: ExportOptions,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let export_manager = state.export_manager.lock();
    export_manager
        .export_to_epub(&project_path, &output_path, &options)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn export_to_docx(
    project_path: String,
    output_path: String,
    options: ExportOptions,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let export_manager = state.export_manager.lock();
    export_manager
        .export_to_docx(&project_path, &output_path, &options)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn export_to_html(
    project_path: String,
    output_path: String,
    options: ExportOptions,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let export_manager = state.export_manager.lock();
    export_manager
        .export_to_html(&project_path, &output_path, &options)
        .map_err(|e| e.to_string())
}

// Writing Session Commands
#[tauri::command]
pub async fn start_writing_session(
    project_id: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let mut writing_session = state.writing_session.lock();
    *writing_session = Some(crate::writing::WritingSession::new(project_id));
    Ok(())
}

#[tauri::command]
pub async fn end_writing_session(state: State<'_, AppState>) -> Result<WritingStats, String> {
    let mut writing_session = state.writing_session.lock();
    if let Some(session) = writing_session.take() {
        Ok(session.get_stats())
    } else {
        Err("No active writing session".to_string())
    }
}

#[tauri::command]
pub async fn get_writing_stats(state: State<'_, AppState>) -> Result<Option<WritingStats>, String> {
    let writing_session = state.writing_session.lock();
    Ok(writing_session.as_ref().map(|s| s.get_stats()))
}

// Theme Commands
#[tauri::command]
pub async fn get_available_themes(state: State<'_, AppState>) -> Result<Vec<String>, String> {
    let theme_manager = state.theme_manager.lock();
    Ok(theme_manager.get_available_themes())
}

#[tauri::command]
pub async fn set_theme(theme_name: String, state: State<'_, AppState>) -> Result<(), String> {
    let mut theme_manager = state.theme_manager.lock();
    theme_manager
        .set_theme(&theme_name)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_current_theme(state: State<'_, AppState>) -> Result<String, String> {
    let theme_manager = state.theme_manager.lock();
    Ok(theme_manager.get_current_theme())
}

// Backup Commands
#[tauri::command]
pub async fn create_backup(
    project_path: String,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let backup_manager = state.backup_manager.lock();
    backup_manager
        .create_backup(&project_path)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn restore_backup(
    backup_path: String,
    target_path: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let backup_manager = state.backup_manager.lock();
    backup_manager
        .restore_backup(&backup_path, &target_path)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_backups(
    project_path: String,
    state: State<'_, AppState>,
) -> Result<Vec<String>, String> {
    let backup_manager = state.backup_manager.lock();
    backup_manager
        .list_backups(&project_path)
        .map_err(|e| e.to_string())
}

// Collaboration Commands
#[tauri::command]
pub async fn share_project(
    project_path: String,
    collaborators: Vec<String>,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let mut collaboration_manager = state.collaboration_manager.lock();
    collaboration_manager
        .share_project(&project_path, &collaborators)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn invite_collaborator(
    project_id: String,
    email: String,
    permissions: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let mut collaboration_manager = state.collaboration_manager.lock();
    collaboration_manager
        .invite_collaborator(&project_id, &email, &permissions)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn sync_changes(project_id: String, state: State<'_, AppState>) -> Result<(), String> {
    let mut collaboration_manager = state.collaboration_manager.lock();
    collaboration_manager
        .sync_changes(&project_id)
        .map_err(|e| e.to_string())
}

// Utility Commands
#[tauri::command]
pub async fn get_word_count(text: String) -> Result<usize, String> {
    Ok(crate::utils::count_words(&text))
}

#[tauri::command]
pub async fn spell_check_text(
    text: String,
    language: Option<String>,
) -> Result<Vec<String>, String> {
    crate::utils::spell_check(&text, language.as_deref()).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_app_settings(
    state: State<'_, AppState>,
) -> Result<HashMap<String, serde_json::Value>, String> {
    let settings = state.settings.lock();
    Ok(settings.clone())
}

#[tauri::command]
pub async fn save_app_settings(
    settings: HashMap<String, serde_json::Value>,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let mut app_settings = state.settings.lock();
    *app_settings = settings;
    Ok(())
}
