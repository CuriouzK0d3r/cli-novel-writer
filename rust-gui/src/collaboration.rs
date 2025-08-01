use anyhow::{anyhow, Result};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CollaborationProject {
    pub id: String,
    pub name: String,
    pub owner_id: String,
    pub collaborators: Vec<Collaborator>,
    pub permissions: ProjectPermissions,
    pub sync_settings: SyncSettings,
    pub created_at: DateTime<Utc>,
    pub last_synced: Option<DateTime<Utc>>,
    pub local_path: PathBuf,
    pub remote_url: Option<String>,
    pub conflict_resolution: ConflictResolution,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Collaborator {
    pub id: String,
    pub email: String,
    pub name: String,
    pub role: CollaboratorRole,
    pub permissions: UserPermissions,
    pub status: CollaboratorStatus,
    pub last_active: Option<DateTime<Utc>>,
    pub avatar_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CollaboratorRole {
    Owner,
    Editor,
    Reviewer,
    Commenter,
    Viewer,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserPermissions {
    pub can_edit: bool,
    pub can_comment: bool,
    pub can_review: bool,
    pub can_export: bool,
    pub can_invite: bool,
    pub can_manage_settings: bool,
    pub can_delete: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CollaboratorStatus {
    Active,
    Pending,
    Inactive,
    Removed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectPermissions {
    pub is_public: bool,
    pub allow_comments: bool,
    pub allow_suggestions: bool,
    pub require_approval: bool,
    pub version_control: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncSettings {
    pub auto_sync: bool,
    pub sync_interval_minutes: u64,
    pub conflict_resolution_strategy: ConflictResolution,
    pub backup_before_sync: bool,
    pub notify_on_changes: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ConflictResolution {
    Manual,
    KeepLocal,
    KeepRemote,
    MergeAutomatic,
    CreateBranch,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Comment {
    pub id: String,
    pub author_id: String,
    pub content: String,
    pub file_path: PathBuf,
    pub line_number: Option<usize>,
    pub selection_start: Option<usize>,
    pub selection_end: Option<usize>,
    pub created_at: DateTime<Utc>,
    pub updated_at: Option<DateTime<Utc>>,
    pub resolved: bool,
    pub replies: Vec<CommentReply>,
    pub tags: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommentReply {
    pub id: String,
    pub author_id: String,
    pub content: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChangeRequest {
    pub id: String,
    pub author_id: String,
    pub title: String,
    pub description: String,
    pub file_path: PathBuf,
    pub original_content: String,
    pub suggested_content: String,
    pub status: ChangeRequestStatus,
    pub created_at: DateTime<Utc>,
    pub updated_at: Option<DateTime<Utc>>,
    pub reviewed_by: Option<String>,
    pub review_notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ChangeRequestStatus {
    Pending,
    Approved,
    Rejected,
    Merged,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncConflict {
    pub id: String,
    pub file_path: PathBuf,
    pub local_content: String,
    pub remote_content: String,
    pub local_timestamp: DateTime<Utc>,
    pub remote_timestamp: DateTime<Utc>,
    pub conflict_type: ConflictType,
    pub resolved: bool,
    pub resolution: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ConflictType {
    ContentMismatch,
    FileDeleted,
    FileAdded,
    PermissionConflict,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivityLog {
    pub id: String,
    pub project_id: String,
    pub user_id: String,
    pub action: CollaborationAction,
    pub timestamp: DateTime<Utc>,
    pub details: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CollaborationAction {
    ProjectCreated,
    UserInvited,
    UserJoined,
    UserLeft,
    FileEdited,
    CommentAdded,
    CommentResolved,
    ChangeRequested,
    ChangeApproved,
    ChangeRejected,
    ProjectSynced,
    ConflictResolved,
    PermissionsChanged,
}

pub struct CollaborationManager {
    projects: HashMap<String, CollaborationProject>,
    comments: HashMap<String, Vec<Comment>>,
    change_requests: HashMap<String, Vec<ChangeRequest>>,
    conflicts: HashMap<String, Vec<SyncConflict>>,
    activity_logs: HashMap<String, Vec<ActivityLog>>,
    current_user_id: Option<String>,
    settings_path: PathBuf,
}

impl CollaborationManager {
    pub fn new() -> Self {
        let settings_path = dirs::config_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("writers-cli")
            .join("collaboration.json");

        let mut manager = Self {
            projects: HashMap::new(),
            comments: HashMap::new(),
            change_requests: HashMap::new(),
            conflicts: HashMap::new(),
            activity_logs: HashMap::new(),
            current_user_id: None,
            settings_path,
        };

        // Load existing data
        if let Err(e) = manager.load_collaboration_data() {
            log::warn!("Failed to load collaboration data: {}", e);
        }

        manager
    }

    pub fn share_project(
        &mut self,
        project_path: &str,
        collaborators: &[String],
    ) -> Result<String> {
        let project_path = Path::new(project_path);
        let project_id = Uuid::new_v4().to_string();

        // Create collaboration project
        let collaboration_project = CollaborationProject {
            id: project_id.clone(),
            name: project_path
                .file_name()
                .unwrap_or_default()
                .to_str()
                .unwrap_or("Untitled")
                .to_string(),
            owner_id: self.current_user_id.clone().unwrap_or_default(),
            collaborators: collaborators
                .iter()
                .map(|email| Collaborator {
                    id: Uuid::new_v4().to_string(),
                    email: email.clone(),
                    name: email.split('@').next().unwrap_or(email).to_string(),
                    role: CollaboratorRole::Editor,
                    permissions: UserPermissions::default_editor(),
                    status: CollaboratorStatus::Pending,
                    last_active: None,
                    avatar_url: None,
                })
                .collect(),
            permissions: ProjectPermissions::default(),
            sync_settings: SyncSettings::default(),
            created_at: Utc::now(),
            last_synced: None,
            local_path: project_path.to_path_buf(),
            remote_url: None,
            conflict_resolution: ConflictResolution::Manual,
        };

        // Add to projects
        self.projects
            .insert(project_id.clone(), collaboration_project);

        // Initialize collections for this project
        self.comments.insert(project_id.clone(), Vec::new());
        self.change_requests.insert(project_id.clone(), Vec::new());
        self.conflicts.insert(project_id.clone(), Vec::new());
        self.activity_logs.insert(project_id.clone(), Vec::new());

        // Log activity
        self.log_activity(
            &project_id,
            CollaborationAction::ProjectCreated,
            HashMap::new(),
        );

        // Send invitations (placeholder - would integrate with email service)
        for email in collaborators {
            self.send_invitation(&project_id, email)?;
        }

        // Save data
        self.save_collaboration_data()?;

        Ok(project_id)
    }

    pub fn invite_collaborator(
        &mut self,
        project_id: &str,
        email: &str,
        permissions: &str,
    ) -> Result<()> {
        let project = self
            .projects
            .get_mut(project_id)
            .ok_or_else(|| anyhow!("Project not found: {}", project_id))?;

        // Check if user already exists
        if project.collaborators.iter().any(|c| c.email == email) {
            return Err(anyhow!("User already invited: {}", email));
        }

        // Parse permissions
        let role = match permissions {
            "owner" => CollaboratorRole::Owner,
            "editor" => CollaboratorRole::Editor,
            "reviewer" => CollaboratorRole::Reviewer,
            "commenter" => CollaboratorRole::Commenter,
            "viewer" => CollaboratorRole::Viewer,
            _ => CollaboratorRole::Viewer,
        };

        let user_permissions = match role {
            CollaboratorRole::Owner => UserPermissions::default_owner(),
            CollaboratorRole::Editor => UserPermissions::default_editor(),
            CollaboratorRole::Reviewer => UserPermissions::default_reviewer(),
            CollaboratorRole::Commenter => UserPermissions::default_commenter(),
            CollaboratorRole::Viewer => UserPermissions::default_viewer(),
        };

        // Add collaborator
        let collaborator = Collaborator {
            id: Uuid::new_v4().to_string(),
            email: email.to_string(),
            name: email.split('@').next().unwrap_or(email).to_string(),
            role,
            permissions: user_permissions,
            status: CollaboratorStatus::Pending,
            last_active: None,
            avatar_url: None,
        };

        project.collaborators.push(collaborator);

        // Log activity
        let mut details = HashMap::new();
        details.insert("email".to_string(), email.to_string());
        details.insert("permissions".to_string(), permissions.to_string());
        self.log_activity(project_id, CollaborationAction::UserInvited, details);

        // Send invitation
        self.send_invitation(project_id, email)?;

        // Save data
        self.save_collaboration_data()?;

        Ok(())
    }

    pub fn sync_changes(&mut self, project_id: &str) -> Result<()> {
        let project = self
            .projects
            .get_mut(project_id)
            .ok_or_else(|| anyhow!("Project not found: {}", project_id))?;

        // Create backup if enabled
        if project.sync_settings.backup_before_sync {
            self.create_sync_backup(project_id)?;
        }

        // Simulate sync process (would integrate with actual sync service)
        // For now, just update the last synced timestamp
        project.last_synced = Some(Utc::now());

        // Log activity
        self.log_activity(
            project_id,
            CollaborationAction::ProjectSynced,
            HashMap::new(),
        );

        // Save data
        self.save_collaboration_data()?;

        log::info!("Synced project: {}", project_id);
        Ok(())
    }

    pub fn add_comment(
        &mut self,
        project_id: &str,
        file_path: &str,
        content: &str,
        line_number: Option<usize>,
        selection_start: Option<usize>,
        selection_end: Option<usize>,
    ) -> Result<String> {
        let comment_id = Uuid::new_v4().to_string();

        let comment = Comment {
            id: comment_id.clone(),
            author_id: self.current_user_id.clone().unwrap_or_default(),
            content: content.to_string(),
            file_path: PathBuf::from(file_path),
            line_number,
            selection_start,
            selection_end,
            created_at: Utc::now(),
            updated_at: None,
            resolved: false,
            replies: Vec::new(),
            tags: Vec::new(),
        };

        // Add comment to project
        self.comments
            .entry(project_id.to_string())
            .or_insert_with(Vec::new)
            .push(comment);

        // Log activity
        let mut details = HashMap::new();
        details.insert("file_path".to_string(), file_path.to_string());
        details.insert(
            "content_preview".to_string(),
            content.chars().take(50).collect(),
        );
        self.log_activity(project_id, CollaborationAction::CommentAdded, details);

        // Save data
        self.save_collaboration_data()?;

        Ok(comment_id)
    }

    pub fn resolve_comment(&mut self, project_id: &str, comment_id: &str) -> Result<()> {
        let comments = self
            .comments
            .get_mut(project_id)
            .ok_or_else(|| anyhow!("Project not found: {}", project_id))?;

        let comment = comments
            .iter_mut()
            .find(|c| c.id == comment_id)
            .ok_or_else(|| anyhow!("Comment not found: {}", comment_id))?;

        comment.resolved = true;
        comment.updated_at = Some(Utc::now());

        // Log activity
        self.log_activity(
            project_id,
            CollaborationAction::CommentResolved,
            HashMap::new(),
        );

        // Save data
        self.save_collaboration_data()?;

        Ok(())
    }

    pub fn create_change_request(
        &mut self,
        project_id: &str,
        title: &str,
        description: &str,
        file_path: &str,
        original_content: &str,
        suggested_content: &str,
    ) -> Result<String> {
        let request_id = Uuid::new_v4().to_string();

        let change_request = ChangeRequest {
            id: request_id.clone(),
            author_id: self.current_user_id.clone().unwrap_or_default(),
            title: title.to_string(),
            description: description.to_string(),
            file_path: PathBuf::from(file_path),
            original_content: original_content.to_string(),
            suggested_content: suggested_content.to_string(),
            status: ChangeRequestStatus::Pending,
            created_at: Utc::now(),
            updated_at: None,
            reviewed_by: None,
            review_notes: None,
        };

        // Add change request to project
        self.change_requests
            .entry(project_id.to_string())
            .or_insert_with(Vec::new)
            .push(change_request);

        // Log activity
        let mut details = HashMap::new();
        details.insert("title".to_string(), title.to_string());
        details.insert("file_path".to_string(), file_path.to_string());
        self.log_activity(project_id, CollaborationAction::ChangeRequested, details);

        // Save data
        self.save_collaboration_data()?;

        Ok(request_id)
    }

    pub fn approve_change_request(
        &mut self,
        project_id: &str,
        request_id: &str,
        review_notes: Option<String>,
    ) -> Result<()> {
        let change_requests = self
            .change_requests
            .get_mut(project_id)
            .ok_or_else(|| anyhow!("Project not found: {}", project_id))?;

        let request = change_requests
            .iter_mut()
            .find(|r| r.id == request_id)
            .ok_or_else(|| anyhow!("Change request not found: {}", request_id))?;

        request.status = ChangeRequestStatus::Approved;
        request.updated_at = Some(Utc::now());
        request.reviewed_by = self.current_user_id.clone();
        request.review_notes = review_notes;

        // Apply the change (write to file)
        fs::write(&request.file_path, &request.suggested_content)?;

        // Log activity
        self.log_activity(
            project_id,
            CollaborationAction::ChangeApproved,
            HashMap::new(),
        );

        // Save data
        self.save_collaboration_data()?;

        Ok(())
    }

    pub fn reject_change_request(
        &mut self,
        project_id: &str,
        request_id: &str,
        review_notes: Option<String>,
    ) -> Result<()> {
        let change_requests = self
            .change_requests
            .get_mut(project_id)
            .ok_or_else(|| anyhow!("Project not found: {}", project_id))?;

        let request = change_requests
            .iter_mut()
            .find(|r| r.id == request_id)
            .ok_or_else(|| anyhow!("Change request not found: {}", request_id))?;

        request.status = ChangeRequestStatus::Rejected;
        request.updated_at = Some(Utc::now());
        request.reviewed_by = self.current_user_id.clone();
        request.review_notes = review_notes;

        // Log activity
        self.log_activity(
            project_id,
            CollaborationAction::ChangeRejected,
            HashMap::new(),
        );

        // Save data
        self.save_collaboration_data()?;

        Ok(())
    }

    pub fn get_project_collaborators(&self, project_id: &str) -> Result<Vec<Collaborator>> {
        let project = self
            .projects
            .get(project_id)
            .ok_or_else(|| anyhow!("Project not found: {}", project_id))?;

        Ok(project.collaborators.clone())
    }

    pub fn get_project_comments(&self, project_id: &str) -> Result<Vec<Comment>> {
        Ok(self.comments.get(project_id).cloned().unwrap_or_default())
    }

    pub fn get_project_change_requests(&self, project_id: &str) -> Result<Vec<ChangeRequest>> {
        Ok(self
            .change_requests
            .get(project_id)
            .cloned()
            .unwrap_or_default())
    }

    pub fn get_project_conflicts(&self, project_id: &str) -> Result<Vec<SyncConflict>> {
        Ok(self.conflicts.get(project_id).cloned().unwrap_or_default())
    }

    pub fn get_activity_log(&self, project_id: &str) -> Result<Vec<ActivityLog>> {
        Ok(self
            .activity_logs
            .get(project_id)
            .cloned()
            .unwrap_or_default())
    }

    pub fn set_current_user(&mut self, user_id: String) {
        self.current_user_id = Some(user_id);
    }

    fn send_invitation(&self, _project_id: &str, _email: &str) -> Result<()> {
        // Placeholder for email invitation functionality
        // Would integrate with email service
        log::info!("Invitation sent to: {}", _email);
        Ok(())
    }

    fn create_sync_backup(&self, _project_id: &str) -> Result<()> {
        // Placeholder for backup creation before sync
        // Would integrate with backup manager
        log::info!("Created sync backup for project: {}", _project_id);
        Ok(())
    }

    fn log_activity(
        &mut self,
        project_id: &str,
        action: CollaborationAction,
        details: HashMap<String, String>,
    ) {
        let activity = ActivityLog {
            id: Uuid::new_v4().to_string(),
            project_id: project_id.to_string(),
            user_id: self.current_user_id.clone().unwrap_or_default(),
            action,
            timestamp: Utc::now(),
            details,
        };

        self.activity_logs
            .entry(project_id.to_string())
            .or_insert_with(Vec::new)
            .push(activity);
    }

    fn load_collaboration_data(&mut self) -> Result<()> {
        if !self.settings_path.exists() {
            return Ok(());
        }

        let content = fs::read_to_string(&self.settings_path)?;
        let data: serde_json::Value = serde_json::from_str(&content)?;

        if let Some(projects) = data.get("projects") {
            self.projects = serde_json::from_value(projects.clone())?;
        }

        if let Some(comments) = data.get("comments") {
            self.comments = serde_json::from_value(comments.clone())?;
        }

        if let Some(change_requests) = data.get("change_requests") {
            self.change_requests = serde_json::from_value(change_requests.clone())?;
        }

        if let Some(conflicts) = data.get("conflicts") {
            self.conflicts = serde_json::from_value(conflicts.clone())?;
        }

        if let Some(activity_logs) = data.get("activity_logs") {
            self.activity_logs = serde_json::from_value(activity_logs.clone())?;
        }

        Ok(())
    }

    fn save_collaboration_data(&self) -> Result<()> {
        // Ensure parent directory exists
        if let Some(parent) = self.settings_path.parent() {
            fs::create_dir_all(parent)?;
        }

        let data = serde_json::json!({
            "projects": self.projects,
            "comments": self.comments,
            "change_requests": self.change_requests,
            "conflicts": self.conflicts,
            "activity_logs": self.activity_logs
        });

        let content = serde_json::to_string_pretty(&data)?;
        fs::write(&self.settings_path, content)?;

        Ok(())
    }
}

impl Default for CollaborationManager {
    fn default() -> Self {
        Self::new()
    }
}

impl Default for ProjectPermissions {
    fn default() -> Self {
        Self {
            is_public: false,
            allow_comments: true,
            allow_suggestions: true,
            require_approval: true,
            version_control: true,
        }
    }
}

impl Default for SyncSettings {
    fn default() -> Self {
        Self {
            auto_sync: true,
            sync_interval_minutes: 15,
            conflict_resolution_strategy: ConflictResolution::Manual,
            backup_before_sync: true,
            notify_on_changes: true,
        }
    }
}

impl UserPermissions {
    pub fn default_owner() -> Self {
        Self {
            can_edit: true,
            can_comment: true,
            can_review: true,
            can_export: true,
            can_invite: true,
            can_manage_settings: true,
            can_delete: true,
        }
    }

    pub fn default_editor() -> Self {
        Self {
            can_edit: true,
            can_comment: true,
            can_review: true,
            can_export: true,
            can_invite: false,
            can_manage_settings: false,
            can_delete: false,
        }
    }

    pub fn default_reviewer() -> Self {
        Self {
            can_edit: false,
            can_comment: true,
            can_review: true,
            can_export: true,
            can_invite: false,
            can_manage_settings: false,
            can_delete: false,
        }
    }

    pub fn default_commenter() -> Self {
        Self {
            can_edit: false,
            can_comment: true,
            can_review: false,
            can_export: false,
            can_invite: false,
            can_manage_settings: false,
            can_delete: false,
        }
    }

    pub fn default_viewer() -> Self {
        Self {
            can_edit: false,
            can_comment: false,
            can_review: false,
            can_export: false,
            can_invite: false,
            can_manage_settings: false,
            can_delete: false,
        }
    }
}
