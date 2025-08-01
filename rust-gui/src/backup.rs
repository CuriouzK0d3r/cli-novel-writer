use anyhow::{anyhow, Result};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupInfo {
    pub id: String,
    pub project_path: PathBuf,
    pub backup_path: PathBuf,
    pub created_at: DateTime<Utc>,
    pub backup_type: BackupType,
    pub size_bytes: u64,
    pub file_count: usize,
    pub description: Option<String>,
    pub tags: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BackupType {
    Manual,
    Automatic,
    Scheduled,
    PreExport,
    Milestone,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupSettings {
    pub auto_backup_enabled: bool,
    pub auto_backup_interval_minutes: u64,
    pub max_backups_per_project: usize,
    pub backup_directory: PathBuf,
    pub compress_backups: bool,
    pub exclude_patterns: Vec<String>,
    pub backup_on_save: bool,
    pub backup_on_export: bool,
}

impl Default for BackupSettings {
    fn default() -> Self {
        Self {
            auto_backup_enabled: true,
            auto_backup_interval_minutes: 30,
            max_backups_per_project: 20,
            backup_directory: dirs::data_dir()
                .unwrap_or_else(|| PathBuf::from("."))
                .join("writers-cli")
                .join("backups"),
            compress_backups: true,
            exclude_patterns: vec![
                "*.tmp".to_string(),
                ".DS_Store".to_string(),
                "Thumbs.db".to_string(),
                "*.log".to_string(),
                "node_modules/".to_string(),
                ".git/".to_string(),
            ],
            backup_on_save: false,
            backup_on_export: true,
        }
    }
}

pub struct BackupManager {
    settings: BackupSettings,
    backups_index: HashMap<String, Vec<BackupInfo>>,
    index_path: PathBuf,
}

impl BackupManager {
    pub fn new() -> Self {
        let settings = BackupSettings::default();
        let index_path = settings.backup_directory.join("backups.json");

        let mut manager = Self {
            settings,
            backups_index: HashMap::new(),
            index_path,
        };

        // Load existing backups index
        if let Err(e) = manager.load_backups_index() {
            log::warn!("Failed to load backups index: {}", e);
        }

        manager
    }

    pub fn with_settings(settings: BackupSettings) -> Self {
        let index_path = settings.backup_directory.join("backups.json");

        let mut manager = Self {
            settings,
            backups_index: HashMap::new(),
            index_path,
        };

        if let Err(e) = manager.load_backups_index() {
            log::warn!("Failed to load backups index: {}", e);
        }

        manager
    }

    pub fn create_backup(&mut self, project_path: &str) -> Result<String> {
        self.create_backup_with_type(project_path, BackupType::Manual, None)
    }

    pub fn create_backup_with_type(
        &mut self,
        project_path: &str,
        backup_type: BackupType,
        description: Option<String>,
    ) -> Result<String> {
        let project_path = Path::new(project_path);

        if !project_path.exists() {
            return Err(anyhow!(
                "Project path does not exist: {}",
                project_path.display()
            ));
        }

        // Ensure backup directory exists
        fs::create_dir_all(&self.settings.backup_directory)?;

        // Generate backup ID and path
        let backup_id = self.generate_backup_id(project_path, &backup_type);
        let backup_path = self.settings.backup_directory.join(&backup_id);

        // Create backup
        let (size_bytes, file_count) = if self.settings.compress_backups {
            self.create_compressed_backup(project_path, &backup_path)?
        } else {
            self.create_directory_backup(project_path, &backup_path)?
        };

        // Create backup info
        let backup_info = BackupInfo {
            id: backup_id.clone(),
            project_path: project_path.to_path_buf(),
            backup_path,
            created_at: Utc::now(),
            backup_type,
            size_bytes,
            file_count,
            description,
            tags: Vec::new(),
        };

        // Add to index
        let project_key = self.get_project_key(project_path);
        self.backups_index
            .entry(project_key)
            .or_insert_with(Vec::new)
            .push(backup_info);

        // Clean up old backups if necessary
        self.cleanup_old_backups(&self.get_project_key(project_path))?;

        // Save index
        self.save_backups_index()?;

        log::info!("Created backup: {}", backup_id);
        Ok(backup_id)
    }

    pub fn restore_backup(&self, backup_path: &str, target_path: &str) -> Result<()> {
        let backup_path = Path::new(backup_path);
        let target_path = Path::new(target_path);

        if !backup_path.exists() {
            return Err(anyhow!("Backup does not exist: {}", backup_path.display()));
        }

        // Ensure target directory exists
        if let Some(parent) = target_path.parent() {
            fs::create_dir_all(parent)?;
        }

        // Restore based on backup type
        if backup_path.extension().map_or(false, |ext| ext == "zip") {
            self.restore_compressed_backup(backup_path, target_path)?;
        } else {
            self.restore_directory_backup(backup_path, target_path)?;
        }

        log::info!(
            "Restored backup from {} to {}",
            backup_path.display(),
            target_path.display()
        );
        Ok(())
    }

    pub fn list_backups(&self, project_path: &str) -> Result<Vec<BackupInfo>> {
        let project_key = self.get_project_key(Path::new(project_path));

        let backups = self
            .backups_index
            .get(&project_key)
            .cloned()
            .unwrap_or_default();

        Ok(backups)
    }

    pub fn get_backup_info(&self, backup_id: &str) -> Option<&BackupInfo> {
        for backups in self.backups_index.values() {
            if let Some(backup) = backups.iter().find(|b| b.id == backup_id) {
                return Some(backup);
            }
        }
        None
    }

    pub fn delete_backup(&mut self, backup_id: &str) -> Result<()> {
        let mut found = false;
        let mut project_key_to_update = String::new();

        // Find and remove backup from index
        for (project_key, backups) in self.backups_index.iter_mut() {
            if let Some(pos) = backups.iter().position(|b| b.id == backup_id) {
                let backup_info = backups.remove(pos);

                // Delete backup file/directory
                if backup_info.backup_path.exists() {
                    if backup_info.backup_path.is_dir() {
                        fs::remove_dir_all(&backup_info.backup_path)?;
                    } else {
                        fs::remove_file(&backup_info.backup_path)?;
                    }
                }

                found = true;
                project_key_to_update = project_key.clone();
                break;
            }
        }

        if !found {
            return Err(anyhow!("Backup not found: {}", backup_id));
        }

        // Save updated index
        self.save_backups_index()?;

        log::info!("Deleted backup: {}", backup_id);
        Ok(())
    }

    pub fn cleanup_old_backups(&mut self, project_key: &str) -> Result<()> {
        if let Some(backups) = self.backups_index.get_mut(project_key) {
            // Sort by creation date (newest first)
            backups.sort_by(|a, b| b.created_at.cmp(&a.created_at));

            // Remove excess backups
            while backups.len() > self.settings.max_backups_per_project {
                if let Some(old_backup) = backups.pop() {
                    // Delete the backup file/directory
                    if old_backup.backup_path.exists() {
                        if old_backup.backup_path.is_dir() {
                            fs::remove_dir_all(&old_backup.backup_path)?;
                        } else {
                            fs::remove_file(&old_backup.backup_path)?;
                        }
                    }
                    log::info!("Cleaned up old backup: {}", old_backup.id);
                }
            }
        }

        Ok(())
    }

    pub fn get_settings(&self) -> &BackupSettings {
        &self.settings
    }

    pub fn update_settings(&mut self, settings: BackupSettings) -> Result<()> {
        self.settings = settings;
        self.index_path = self.settings.backup_directory.join("backups.json");

        // Ensure new backup directory exists
        fs::create_dir_all(&self.settings.backup_directory)?;

        Ok(())
    }

    pub fn get_total_backup_size(&self) -> u64 {
        self.backups_index
            .values()
            .flat_map(|backups| backups.iter())
            .map(|backup| backup.size_bytes)
            .sum()
    }

    pub fn get_backup_count(&self) -> usize {
        self.backups_index
            .values()
            .map(|backups| backups.len())
            .sum()
    }

    pub fn should_auto_backup(&self, last_backup_time: DateTime<Utc>) -> bool {
        if !self.settings.auto_backup_enabled {
            return false;
        }

        let elapsed = Utc::now().signed_duration_since(last_backup_time);
        elapsed.num_minutes() >= self.settings.auto_backup_interval_minutes as i64
    }

    pub fn validate_backup(&self, backup_id: &str) -> Result<bool> {
        if let Some(backup_info) = self.get_backup_info(backup_id) {
            if !backup_info.backup_path.exists() {
                return Ok(false);
            }

            // Additional validation could include:
            // - Checksum verification
            // - File count verification
            // - Size verification

            Ok(true)
        } else {
            Err(anyhow!("Backup not found: {}", backup_id))
        }
    }

    fn create_compressed_backup(
        &self,
        project_path: &Path,
        backup_path: &Path,
    ) -> Result<(u64, usize)> {
        use std::io::{Read, Write};

        let backup_file = backup_path.with_extension("zip");
        let file = fs::File::create(&backup_file)?;
        let mut archive = zip::ZipWriter::new(file);

        let mut total_size = 0u64;
        let mut file_count = 0usize;

        let options = zip::write::FileOptions::default()
            .compression_method(zip::CompressionMethod::Deflated)
            .unix_permissions(0o755);

        for entry in WalkDir::new(project_path)
            .into_iter()
            .filter_map(|e| e.ok())
        {
            let path = entry.path();

            // Skip if matches exclude patterns
            if self.should_exclude_file(path) {
                continue;
            }

            let relative_path = path.strip_prefix(project_path)?;
            let relative_path_str = relative_path.to_str().unwrap_or_default();

            if path.is_file() {
                archive.start_file(relative_path_str, options)?;
                let mut file = fs::File::open(path)?;
                let mut buffer = Vec::new();
                file.read_to_end(&mut buffer)?;
                archive.write_all(&buffer)?;

                total_size += buffer.len() as u64;
                file_count += 1;
            } else if path.is_dir() && path != project_path {
                archive.add_directory(relative_path_str, options)?;
            }
        }

        archive.finish()?;

        let final_size = fs::metadata(&backup_file)?.len();
        Ok((final_size, file_count))
    }

    fn create_directory_backup(
        &self,
        project_path: &Path,
        backup_path: &Path,
    ) -> Result<(u64, usize)> {
        fs::create_dir_all(backup_path)?;

        let mut total_size = 0u64;
        let mut file_count = 0usize;

        for entry in WalkDir::new(project_path)
            .into_iter()
            .filter_map(|e| e.ok())
        {
            let path = entry.path();

            // Skip if matches exclude patterns
            if self.should_exclude_file(path) {
                continue;
            }

            let relative_path = path.strip_prefix(project_path)?;
            let target_path = backup_path.join(relative_path);

            if path.is_file() {
                if let Some(parent) = target_path.parent() {
                    fs::create_dir_all(parent)?;
                }
                fs::copy(path, &target_path)?;

                total_size += fs::metadata(path)?.len();
                file_count += 1;
            } else if path.is_dir() && path != project_path {
                fs::create_dir_all(&target_path)?;
            }
        }

        Ok((total_size, file_count))
    }

    fn restore_compressed_backup(&self, backup_path: &Path, target_path: &Path) -> Result<()> {
        let file = fs::File::open(backup_path)?;
        let mut archive = zip::ZipArchive::new(file)?;

        for i in 0..archive.len() {
            let mut file = archive.by_index(i)?;
            let outpath = target_path.join(file.mangled_name());

            if file.name().ends_with('/') {
                fs::create_dir_all(&outpath)?;
            } else {
                if let Some(parent) = outpath.parent() {
                    fs::create_dir_all(parent)?;
                }
                let mut outfile = fs::File::create(&outpath)?;
                std::io::copy(&mut file, &mut outfile)?;
            }
        }

        Ok(())
    }

    fn restore_directory_backup(&self, backup_path: &Path, target_path: &Path) -> Result<()> {
        fs::create_dir_all(target_path)?;

        for entry in WalkDir::new(backup_path).into_iter().filter_map(|e| e.ok()) {
            let path = entry.path();
            let relative_path = path.strip_prefix(backup_path)?;
            let target_file_path = target_path.join(relative_path);

            if path.is_file() {
                if let Some(parent) = target_file_path.parent() {
                    fs::create_dir_all(parent)?;
                }
                fs::copy(path, &target_file_path)?;
            } else if path.is_dir() && path != backup_path {
                fs::create_dir_all(&target_file_path)?;
            }
        }

        Ok(())
    }

    fn should_exclude_file(&self, path: &Path) -> bool {
        let path_str = path.to_str().unwrap_or_default();

        for pattern in &self.settings.exclude_patterns {
            if pattern.ends_with('/') {
                // Directory pattern
                if path.is_dir() && path_str.contains(&pattern[..pattern.len() - 1]) {
                    return true;
                }
            } else if pattern.contains('*') {
                // Glob pattern (simple implementation)
                let pattern_without_star = pattern.replace('*', "");
                if path_str.contains(&pattern_without_star) {
                    return true;
                }
            } else if path_str.contains(pattern) {
                return true;
            }
        }

        false
    }

    fn generate_backup_id(&self, project_path: &Path, backup_type: &BackupType) -> String {
        let project_name = project_path
            .file_name()
            .unwrap_or_default()
            .to_str()
            .unwrap_or("project");

        let timestamp = Utc::now().format("%Y%m%d_%H%M%S");
        let type_suffix = match backup_type {
            BackupType::Manual => "manual",
            BackupType::Automatic => "auto",
            BackupType::Scheduled => "scheduled",
            BackupType::PreExport => "preexport",
            BackupType::Milestone => "milestone",
        };

        format!("{}_{}_backup_{}", project_name, timestamp, type_suffix)
    }

    fn get_project_key(&self, project_path: &Path) -> String {
        project_path
            .canonicalize()
            .unwrap_or_else(|_| project_path.to_path_buf())
            .to_string_lossy()
            .to_string()
    }

    fn load_backups_index(&mut self) -> Result<()> {
        if !self.index_path.exists() {
            return Ok(());
        }

        let content = fs::read_to_string(&self.index_path)?;
        self.backups_index = serde_json::from_str(&content)?;

        // Validate backups exist and remove orphaned entries
        let mut to_remove = Vec::new();

        for (project_key, backups) in &mut self.backups_index {
            backups.retain(|backup| {
                let exists = backup.backup_path.exists();
                if !exists {
                    log::warn!("Removing orphaned backup entry: {}", backup.id);
                }
                exists
            });

            if backups.is_empty() {
                to_remove.push(project_key.clone());
            }
        }

        for key in to_remove {
            self.backups_index.remove(&key);
        }

        Ok(())
    }

    fn save_backups_index(&self) -> Result<()> {
        // Ensure parent directory exists
        if let Some(parent) = self.index_path.parent() {
            fs::create_dir_all(parent)?;
        }

        let content = serde_json::to_string_pretty(&self.backups_index)?;
        fs::write(&self.index_path, content)?;

        Ok(())
    }
}

impl Default for BackupManager {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_backup_creation() {
        let temp_dir = TempDir::new().unwrap();
        let project_path = temp_dir.path().join("test_project");
        fs::create_dir_all(&project_path).unwrap();
        fs::write(project_path.join("test.txt"), "test content").unwrap();

        let backup_settings = BackupSettings {
            backup_directory: temp_dir.path().join("backups"),
            compress_backups: false,
            ..Default::default()
        };

        let mut backup_manager = BackupManager::with_settings(backup_settings);
        let backup_id = backup_manager
            .create_backup(project_path.to_str().unwrap())
            .unwrap();

        assert!(!backup_id.is_empty());
        assert_eq!(backup_manager.get_backup_count(), 1);
    }

    #[test]
    fn test_backup_exclusion() {
        let backup_manager = BackupManager::new();

        assert!(backup_manager.should_exclude_file(Path::new("test.tmp")));
        assert!(backup_manager.should_exclude_file(Path::new(".DS_Store")));
        assert!(!backup_manager.should_exclude_file(Path::new("chapter1.md")));
    }
}
