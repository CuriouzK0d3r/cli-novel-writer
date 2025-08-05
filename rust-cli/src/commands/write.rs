use anyhow::Result;
use colored::*;
use dialoguer::{theme::ColorfulTheme, Select};
use std::path::PathBuf;
use std::process::Command;

use crate::editor::WritersEditor;
use crate::utils::ProjectManager;

pub async fn run(target: Option<String>, editor: Option<String>) -> Result<()> {
    // Check if in a writers project
    if !ProjectManager::is_writers_project() {
        println!(
            "{}",
            "❌ Not a Writers project. Run \"writers init\" to initialize.".red()
        );
        return Ok(());
    }

    let config = ProjectManager::get_config().await?;

    // If no target specified, show available files
    let target_file = if let Some(target) = target {
        match ProjectManager::find_file(&target).await? {
            Some(file) => file,
            None => {
                println!("{} {}", "❌ File not found:".red(), target);
                println!(
                    "{}",
                    "💡 Use \"writers list\" to see available files".yellow()
                );
                println!("{}", "💡 Use \"writers new\" to create a new file".yellow());
                return Ok(());
            }
        }
    } else {
        select_file_to_write().await?
    };

    // Determine editor preference
    let editor_choice = editor
        .or_else(|| {
            config
                .settings
                .as_ref()
                .and_then(|s| s.default_editor.clone())
        })
        .unwrap_or_else(|| "novel-editor".to_string());

    // Launch appropriate editor
    match editor_choice.as_str() {
        "novel-editor" | "writers-editor" | "built-in" => launch_builtin_editor(target_file).await,
        "nano" => launch_external_editor("nano", &target_file).await,
        "vim" => launch_external_editor("vim", &target_file).await,
        "nvim" => launch_external_editor("nvim", &target_file).await,
        "code" => launch_external_editor("code", &target_file).await,
        "emacs" => launch_external_editor("emacs", &target_file).await,
        _ => {
            println!("{} {}", "❌ Unknown editor:".red(), editor_choice);
            println!(
                "{}",
                "💡 Supported editors: novel-editor, nano, vim, nvim, code, emacs".yellow()
            );
            Ok(())
        }
    }
}

async fn select_file_to_write() -> Result<PathBuf> {
    println!("{}", "📝 Select a file to write:".cyan().bold());
    println!();

    let config = ProjectManager::get_config().await?;
    let mut all_files = Vec::new();
    let mut file_descriptions = Vec::new();

    // Get files based on project type with smart discovery
    match config.r#type.as_str() {
        "simple-short-story" => {
            // For simple short story, prioritize main story files
            let stories = ProjectManager::get_short_stories().await?;
            for story in stories {
                if let Some(file_name) = story.file_name().and_then(|n| n.to_str()) {
                    all_files.push(story.clone());
                    file_descriptions.push(format!("✍️  {}", file_name));
                }
            }

            // Add notes
            let notes = ProjectManager::get_notes().await?;
            for note in notes {
                if let Some(file_name) = note.file_name().and_then(|n| n.to_str()) {
                    all_files.push(note.clone());
                    file_descriptions.push(format!("📝 {}", file_name));
                }
            }
        }
        "blog" => {
            // For blog, prioritize drafts
            let posts = ProjectManager::get_blog_posts().await?;
            for post in posts {
                if let Some(file_name) = post.file_name().and_then(|n| n.to_str()) {
                    all_files.push(post.clone());
                    file_descriptions.push(format!("📝 {}", file_name));
                }
            }
        }
        _ => {
            // For novels and short story collections, show all content
            let all_content = ProjectManager::get_all_content_files().await?;
            for file in all_content {
                if let Some(file_name) = file.file_name().and_then(|n| n.to_str()) {
                    let icon = if file.starts_with("chapters") {
                        "📖"
                    } else if file.starts_with("scenes") {
                        "🎬"
                    } else if file.starts_with("characters") {
                        "👤"
                    } else if file.starts_with("shortstories") {
                        "📚"
                    } else {
                        "📄"
                    };
                    all_files.push(file.clone());
                    file_descriptions.push(format!("{} {}", icon, file_name));
                }
            }
        }
    }

    if all_files.is_empty() {
        println!("{}", "No files found to write.".yellow());
        println!("{}", "💡 Use \"writers new\" to create content".yellow());
        return Err(anyhow::anyhow!("No files available"));
    }

    let selection = Select::with_theme(&ColorfulTheme::default())
        .with_prompt("Choose a file to write")
        .default(0)
        .items(&file_descriptions)
        .interact()?;

    Ok(all_files[selection].clone())
}

async fn launch_builtin_editor(file_path: PathBuf) -> Result<()> {
    println!();
    println!(
        "{} {}",
        "🚀 Launching Writers Editor for:".green(),
        file_path.display().to_string().cyan()
    );

    let mut editor = WritersEditor::new();
    let file_path_str = file_path.to_string_lossy().to_string();

    match editor.launch(Some(file_path_str)).await {
        Ok(_) => {
            println!();
            println!("{}", "✅ Writing session completed.".green());
        }
        Err(e) => {
            println!();
            println!("{} {}", "❌ Editor error:".red(), e);
            return Err(e);
        }
    }

    Ok(())
}

async fn launch_external_editor(editor_name: &str, file_path: &PathBuf) -> Result<()> {
    println!();
    println!(
        "{} {} {}",
        "🚀 Launching".green(),
        editor_name.cyan(),
        format!("for: {}", file_path.display()).green()
    );

    let mut cmd = Command::new(editor_name);
    cmd.arg(file_path);

    match cmd.status() {
        Ok(status) => {
            if status.success() {
                println!("{}", "✅ Writing session completed.".green());
            } else {
                println!(
                    "{} {}",
                    "⚠️  Editor exited with code:".yellow(),
                    status.code().unwrap_or(-1)
                );
            }
        }
        Err(e) => {
            println!("{} {}", "❌ Failed to launch editor:".red(), e);
            println!(
                "{}",
                format!("💡 Make sure {} is installed and in your PATH", editor_name).yellow()
            );
            return Err(anyhow::anyhow!("Failed to launch external editor: {}", e));
        }
    }

    Ok(())
}
