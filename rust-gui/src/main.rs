// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use parking_lot::Mutex;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use tauri::{
    CustomMenuItem, Manager, Menu, MenuItem, Submenu, SystemTray, SystemTrayEvent, SystemTrayMenu,
    Window, WindowBuilder, WindowUrl,
};

mod backup;
mod collaboration;
mod commands;
mod export;
mod project;
mod themes;
mod utils;
mod writing;

use backup::BackupManager;
use collaboration::CollaborationManager;
use commands::*;
use export::ExportManager;
use project::ProjectManager;
use themes::ThemeManager;
use writing::WritingSession;

// Application state
#[derive(Default)]
pub struct AppState {
    project_manager: Arc<Mutex<ProjectManager>>,
    export_manager: Arc<Mutex<ExportManager>>,
    theme_manager: Arc<Mutex<ThemeManager>>,
    writing_session: Arc<Mutex<Option<WritingSession>>>,
    backup_manager: Arc<Mutex<BackupManager>>,
    collaboration_manager: Arc<Mutex<CollaborationManager>>,
    settings: Arc<Mutex<HashMap<String, serde_json::Value>>>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            project_manager: Arc::new(Mutex::new(ProjectManager::new())),
            export_manager: Arc::new(Mutex::new(ExportManager::new())),
            theme_manager: Arc::new(Mutex::new(ThemeManager::new())),
            writing_session: Arc::new(Mutex::new(None)),
            backup_manager: Arc::new(Mutex::new(BackupManager::new())),
            collaboration_manager: Arc::new(Mutex::new(CollaborationManager::new())),
            settings: Arc::new(Mutex::new(HashMap::new())),
        }
    }
}

// Create the application menu
fn create_menu() -> Menu {
    let file_menu = Submenu::new(
        "File",
        Menu::new()
            .add_item(CustomMenuItem::new("new_project", "New Project").accelerator("CmdOrCtrl+N"))
            .add_item(
                CustomMenuItem::new("open_project", "Open Project").accelerator("CmdOrCtrl+O"),
            )
            .add_item(CustomMenuItem::new("save", "Save").accelerator("CmdOrCtrl+S"))
            .add_item(CustomMenuItem::new("save_as", "Save As").accelerator("CmdOrCtrl+Shift+S"))
            .add_native_item(MenuItem::Separator)
            .add_submenu(Submenu::new(
                "Export",
                Menu::new()
                    .add_item(CustomMenuItem::new("export_pdf", "Export as PDF"))
                    .add_item(CustomMenuItem::new("export_epub", "Export as EPUB"))
                    .add_item(CustomMenuItem::new("export_docx", "Export as DOCX"))
                    .add_item(CustomMenuItem::new("export_html", "Export as HTML")),
            ))
            .add_native_item(MenuItem::Separator)
            .add_item(CustomMenuItem::new("quit", "Quit").accelerator("CmdOrCtrl+Q")),
    );

    let edit_menu = Submenu::new(
        "Edit",
        Menu::new()
            .add_native_item(MenuItem::Undo)
            .add_native_item(MenuItem::Redo)
            .add_native_item(MenuItem::Separator)
            .add_native_item(MenuItem::Cut)
            .add_native_item(MenuItem::Copy)
            .add_native_item(MenuItem::Paste)
            .add_native_item(MenuItem::SelectAll)
            .add_native_item(MenuItem::Separator)
            .add_item(CustomMenuItem::new("find", "Find").accelerator("CmdOrCtrl+F"))
            .add_item(CustomMenuItem::new("replace", "Replace").accelerator("CmdOrCtrl+H")),
    );

    let view_menu = Submenu::new(
        "View",
        Menu::new()
            .add_item(
                CustomMenuItem::new("toggle_sidebar", "Toggle Sidebar").accelerator("CmdOrCtrl+B"),
            )
            .add_item(
                CustomMenuItem::new("distraction_free", "Distraction Free").accelerator("F11"),
            )
            .add_item(CustomMenuItem::new("split_view", "Split View").accelerator("CmdOrCtrl+\\"))
            .add_native_item(MenuItem::Separator)
            .add_item(CustomMenuItem::new("zoom_in", "Zoom In").accelerator("CmdOrCtrl+Plus"))
            .add_item(CustomMenuItem::new("zoom_out", "Zoom Out").accelerator("CmdOrCtrl+-"))
            .add_item(CustomMenuItem::new("reset_zoom", "Reset Zoom").accelerator("CmdOrCtrl+0")),
    );

    let tools_menu = Submenu::new(
        "Tools",
        Menu::new()
            .add_item(
                CustomMenuItem::new("word_count", "Word Count").accelerator("CmdOrCtrl+Shift+W"),
            )
            .add_item(CustomMenuItem::new("writing_goals", "Writing Goals"))
            .add_item(CustomMenuItem::new("pomodoro_timer", "Pomodoro Timer"))
            .add_native_item(MenuItem::Separator)
            .add_item(CustomMenuItem::new(
                "character_tracker",
                "Character Tracker",
            ))
            .add_item(CustomMenuItem::new("plot_tracker", "Plot Tracker"))
            .add_item(CustomMenuItem::new("research_notes", "Research Notes"))
            .add_native_item(MenuItem::Separator)
            .add_item(CustomMenuItem::new("spell_check", "Spell Check").accelerator("F7"))
            .add_item(CustomMenuItem::new("grammar_check", "Grammar Check")),
    );

    let window_menu = Submenu::new(
        "Window",
        Menu::new()
            .add_native_item(MenuItem::Minimize)
            .add_native_item(MenuItem::CloseWindow),
    );

    let help_menu = Submenu::new(
        "Help",
        Menu::new()
            .add_item(CustomMenuItem::new(
                "keyboard_shortcuts",
                "Keyboard Shortcuts",
            ))
            .add_item(CustomMenuItem::new("writing_tips", "Writing Tips"))
            .add_item(CustomMenuItem::new("user_guide", "User Guide"))
            .add_native_item(MenuItem::Separator)
            .add_item(CustomMenuItem::new("check_updates", "Check for Updates"))
            .add_item(CustomMenuItem::new("report_issue", "Report Issue"))
            .add_item(CustomMenuItem::new("about", "About Writers CLI")),
    );

    Menu::new()
        .add_submenu(file_menu)
        .add_submenu(edit_menu)
        .add_submenu(view_menu)
        .add_submenu(tools_menu)
        .add_submenu(window_menu)
        .add_submenu(help_menu)
}

// Create system tray
fn create_system_tray() -> SystemTray {
    let tray_menu = SystemTrayMenu::new()
        .add_item(CustomMenuItem::new("show", "Show Writers CLI"))
        .add_native_item(tauri::SystemTrayMenuItem::Separator)
        .add_item(CustomMenuItem::new("new_quick_note", "Quick Note"))
        .add_item(CustomMenuItem::new("continue_writing", "Continue Writing"))
        .add_native_item(tauri::SystemTrayMenuItem::Separator)
        .add_item(CustomMenuItem::new("quit_tray", "Quit"));

    SystemTray::new().with_menu(tray_menu)
}

// Handle menu events
fn handle_menu_event(event: tauri::WindowMenuEvent) {
    let window = event.window();
    match event.menu_item_id() {
        "new_project" => {
            window.emit("menu-new-project", {}).unwrap();
        }
        "open_project" => {
            window.emit("menu-open-project", {}).unwrap();
        }
        "save" => {
            window.emit("menu-save", {}).unwrap();
        }
        "save_as" => {
            window.emit("menu-save-as", {}).unwrap();
        }
        "export_pdf" => {
            window.emit("menu-export", "pdf").unwrap();
        }
        "export_epub" => {
            window.emit("menu-export", "epub").unwrap();
        }
        "export_docx" => {
            window.emit("menu-export", "docx").unwrap();
        }
        "export_html" => {
            window.emit("menu-export", "html").unwrap();
        }
        "quit" => {
            std::process::exit(0);
        }
        "find" => {
            window.emit("menu-find", {}).unwrap();
        }
        "replace" => {
            window.emit("menu-replace", {}).unwrap();
        }
        "toggle_sidebar" => {
            window.emit("menu-toggle-sidebar", {}).unwrap();
        }
        "distraction_free" => {
            window.emit("menu-distraction-free", {}).unwrap();
        }
        "split_view" => {
            window.emit("menu-split-view", {}).unwrap();
        }
        "zoom_in" => {
            window.emit("menu-zoom", "in").unwrap();
        }
        "zoom_out" => {
            window.emit("menu-zoom", "out").unwrap();
        }
        "reset_zoom" => {
            window.emit("menu-zoom", "reset").unwrap();
        }
        "word_count" => {
            window.emit("menu-word-count", {}).unwrap();
        }
        "writing_goals" => {
            window.emit("menu-writing-goals", {}).unwrap();
        }
        "pomodoro_timer" => {
            window.emit("menu-pomodoro", {}).unwrap();
        }
        "character_tracker" => {
            window.emit("menu-character-tracker", {}).unwrap();
        }
        "plot_tracker" => {
            window.emit("menu-plot-tracker", {}).unwrap();
        }
        "research_notes" => {
            window.emit("menu-research-notes", {}).unwrap();
        }
        "spell_check" => {
            window.emit("menu-spell-check", {}).unwrap();
        }
        "grammar_check" => {
            window.emit("menu-grammar-check", {}).unwrap();
        }
        "keyboard_shortcuts" => {
            window.emit("menu-shortcuts", {}).unwrap();
        }
        "writing_tips" => {
            window.emit("menu-writing-tips", {}).unwrap();
        }
        "user_guide" => {
            window.emit("menu-user-guide", {}).unwrap();
        }
        "check_updates" => {
            window.emit("menu-check-updates", {}).unwrap();
        }
        "report_issue" => {
            window.emit("menu-report-issue", {}).unwrap();
        }
        "about" => {
            window.emit("menu-about", {}).unwrap();
        }
        _ => {}
    }
}

// Handle system tray events
fn handle_system_tray_event(app: &tauri::AppHandle, event: SystemTrayEvent) {
    match event {
        SystemTrayEvent::LeftClick {
            position: _,
            size: _,
            ..
        } => {
            if let Some(window) = app.get_window("main") {
                window.show().unwrap();
                window.set_focus().unwrap();
            }
        }
        SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
            "show" => {
                if let Some(window) = app.get_window("main") {
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }
            }
            "new_quick_note" => {
                if let Some(window) = app.get_window("main") {
                    window.emit("tray-quick-note", {}).unwrap();
                }
            }
            "continue_writing" => {
                if let Some(window) = app.get_window("main") {
                    window.emit("tray-continue-writing", {}).unwrap();
                }
            }
            "quit_tray" => {
                std::process::exit(0);
            }
            _ => {}
        },
        _ => {}
    }
}

fn main() {
    // Initialize logging
    env_logger::init();

    // Create application state
    let app_state = AppState::new();

    tauri::Builder::default()
        .menu(create_menu())
        .system_tray(create_system_tray())
        .on_menu_event(handle_menu_event)
        .on_system_tray_event(handle_system_tray_event)
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            // Project commands
            create_new_project,
            open_project,
            save_project,
            get_recent_projects,
            // File operations
            read_file_content,
            write_file_content,
            create_file,
            delete_file,
            rename_file,
            // Export commands
            export_to_pdf,
            export_to_epub,
            export_to_docx,
            export_to_html,
            // Writing session commands
            start_writing_session,
            end_writing_session,
            get_writing_stats,
            // Theme commands
            get_available_themes,
            set_theme,
            get_current_theme,
            // Backup commands
            create_backup,
            restore_backup,
            list_backups,
            // Collaboration commands
            share_project,
            invite_collaborator,
            sync_changes,
            // Utility commands
            get_word_count,
            spell_check_text,
            get_app_settings,
            save_app_settings,
        ])
        .setup(|app| {
            // Initialize the application
            let app_handle = app.handle();

            // Load user settings
            if let Some(window) = app.get_window("main") {
                // Set up auto-save
                let window_clone = window.clone();
                std::thread::spawn(move || loop {
                    std::thread::sleep(std::time::Duration::from_secs(30));
                    let _ = window_clone.emit("auto-save", {});
                });
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
