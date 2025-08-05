use anyhow::Result;
use colored::*;
use dialoguer::{theme::ColorfulTheme, Select};
use std::path::PathBuf;

use crate::editor::WritersEditor;
use crate::utils::ProjectManager;

pub async fn run(target: Option<String>) -> Result<()> {
    // Check if in a writers project
    if !ProjectManager::is_writers_project() {
        println!(
            "{}",
            "❌ Not a Writers project. Run \"writers init\" to initialize.".red()
        );
        return Ok(());
    }

    let target_file = if let Some(target) = target {
        // Try to find the specified file
        match ProjectManager::find_file(&target).await? {
            Some(file) => file,
            None => {
                println!("{} {}", "❌ File not found:".red(), target);
                println!(
                    "{}",
                    "💡 Use \"writers list\" to see available files".yellow()
                );
                return Ok(());
            }
        }
    } else {
        // Show file selection menu
        select_file_to_edit().await?
    };

    // Launch the built-in editor
    launch_editor(target_file).await
}

async fn select_file_to_edit() -> Result<PathBuf> {
    println!("{}", "📝 Select a file to edit:".cyan().bold());
    println!();

    let config = ProjectManager::get_config().await?;
    let mut all_files = Vec::new();
    let mut file_descriptions = Vec::new();

    // Get files based on project type
    match config.r#type.as_str() {
        "novel" => {
            // Add chapters
            let chapters = ProjectManager::get_chapters().await?;
            for chapter in chapters {
                if let Some(file_name) = chapter.file_name().and_then(|n| n.to_str()) {
                    all_files.push(chapter.clone());
                    file_descriptions.push(format!("📖 Chapter: {}", file_name));
                }
            }

            // Add scenes
            let scenes = ProjectManager::get_scenes().await?;
            for scene in scenes {
                if let Some(file_name) = scene.file_name().and_then(|n| n.to_str()) {
                    all_files.push(scene.clone());
                    file_descriptions.push(format!("🎬 Scene: {}", file_name));
                }
            }

            // Add characters
            let characters = ProjectManager::get_characters().await?;
            for character in characters {
                if let Some(file_name) = character.file_name().and_then(|n| n.to_str()) {
                    all_files.push(character.clone());
                    file_descriptions.push(format!("👤 Character: {}", file_name));
                }
            }

            // Add outline if it exists
            if std::path::Path::new("outline.md").exists() {
                all_files.push(PathBuf::from("outline.md"));
                file_descriptions.push("📋 Outline".to_string());
            }
        }
        "short-story" => {
            let stories = ProjectManager::get_short_stories().await?;
            for story in stories {
                if let Some(file_name) = story.file_name().and_then(|n| n.to_str()) {
                    all_files.push(story.clone());
                    file_descriptions.push(format!("📚 Story: {}", file_name));
                }
            }

            let characters = ProjectManager::get_characters().await?;
            for character in characters {
                if let Some(file_name) = character.file_name().and_then(|n| n.to_str()) {
                    all_files.push(character.clone());
                    file_descriptions.push(format!("👤 Character: {}", file_name));
                }
            }
        }
        "simple-short-story" => {
            let stories = ProjectManager::get_short_stories().await?;
            for story in stories {
                if let Some(file_name) = story.file_name().and_then(|n| n.to_str()) {
                    all_files.push(story.clone());
                    file_descriptions.push(format!("✍️  Draft: {}", file_name));
                }
            }
        }
        "blog" => {
            let posts = ProjectManager::get_blog_posts().await?;
            for post in posts {
                if let Some(file_name) = post.file_name().and_then(|n| n.to_str()) {
                    all_files.push(post.clone());
                    file_descriptions.push(format!("📝 Post: {}", file_name));
                }
            }
        }
        _ => {
            // Generic project - get all markdown files
            let all_content = ProjectManager::get_all_content_files().await?;
            for file in all_content {
                if let Some(file_name) = file.file_name().and_then(|n| n.to_str()) {
                    all_files.push(file.clone());
                    file_descriptions.push(format!("📄 File: {}", file_name));
                }
            }
        }
    }

    // Add notes
    let notes = ProjectManager::get_notes().await?;
    for note in notes {
        if let Some(file_name) = note.file_name().and_then(|n| n.to_str()) {
            all_files.push(note.clone());
            file_descriptions.push(format!("📝 Note: {}", file_name));
        }
    }

    if all_files.is_empty() {
        println!("{}", "No files found to edit.".yellow());
        println!("{}", "💡 Create some content first".yellow());
        return Err(anyhow::anyhow!("No files available"));
    }

    // Add README if it exists
    if std::path::Path::new("README.md").exists() {
        all_files.push(PathBuf::from("README.md"));
        file_descriptions.push("📖 README".to_string());
    }

    let selection = Select::with_theme(&ColorfulTheme::default())
        .with_prompt("Choose a file to edit")
        .default(0)
        .items(&file_descriptions)
        .interact()?;

    Ok(all_files[selection].clone())
}

async fn launch_editor(file_path: PathBuf) -> Result<()> {
    println!();
    println!(
        "{} {}",
        "🚀 Launching editor for:".green(),
        file_path.display().to_string().cyan()
    );
    println!();
    println!("{}", "Editor Controls:".yellow().bold());
    println!(
        "  • {} - Switch between Navigation and Insert mode",
        "ESC".cyan()
    );
    println!("  • {} - Save file", "Ctrl+S".cyan());
    println!("  • {} - Quit editor", "Ctrl+Q".cyan());
    println!("  • {} - Search text", "/".cyan());
    println!("  • {} - Toggle typewriter mode", "Ctrl+T".cyan());
    println!("  • {} - Toggle distraction-free mode", "F3".cyan());
    println!("  • {} - Undo", "Ctrl+Z".cyan());
    println!("  • {} - Redo", "Ctrl+Y".cyan());
    println!();
    println!("{}", "Navigation Mode:".yellow().bold());
    println!(
        "  • {} - Move cursor",
        "hjkl, Shift+WASD, or arrow keys".cyan()
    );
    println!("  • {} - Enter insert mode", "i".cyan());
    println!("  • {} - Enter insert mode at end of line", "a".cyan());
    println!("  • {} - Create new line and enter insert mode", "o".cyan());
    println!("  • {} - Delete current line", "dd".cyan());
    println!("  • {} - Go to beginning/end of line", "0 / $".cyan());
    println!("  • {} - Page up/down", "Page Up/Down".cyan());
    println!();
    println!("{}", "Insert Mode:".yellow().bold());
    println!("  • {} - Type normally", "Any character".cyan());
    println!("  • {} - Return to navigation mode", "ESC".cyan());
    println!(
        "  • {} - Move cursor while in insert mode",
        "Arrow keys".cyan()
    );
    println!();
    println!("{}", "Press any key to continue...".bright_black());

    // Wait for a key press (simple implementation)
    use std::io::{self, Read};
    let mut buffer = [0];
    let _ = io::stdin().read(&mut buffer);

    // Clear screen and launch editor
    print!("\x1B[2J\x1B[1;1H"); // Clear screen and move cursor to top-left

    let mut editor = WritersEditor::new();
    let file_path_str = file_path.to_string_lossy().to_string();

    match editor.launch(Some(file_path_str)).await {
        Ok(_) => {
            println!();
            println!("{}", "✅ Editor session completed.".green());
        }
        Err(e) => {
            println!();
            if e.to_string().contains("TTY") {
                println!("{}", "❌ Editor requires a real terminal to run.".red());
                println!("{}", "💡 Make sure you're running this command directly in a terminal, not through pipes or scripts.".yellow());
            } else {
                println!("{} {}", "❌ Editor error:".red(), e);
            }
            return Err(e);
        }
    }

    Ok(())
}
