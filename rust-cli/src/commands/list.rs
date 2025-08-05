use anyhow::Result;
use colored::*;

use crate::utils::ProjectManager;

pub async fn run() -> Result<()> {
    // Check if in a writers project
    if !ProjectManager::is_writers_project() {
        println!(
            "{}",
            "❌ Not a Writers project. Run \"writers init\" to initialize.".red()
        );
        return Ok(());
    }

    let config = ProjectManager::get_config().await?;

    println!("{}", "📋 Project Contents".cyan().bold());
    println!();
    println!("Project: {}", config.name.cyan());
    println!("Type: {}", config.r#type.cyan());
    println!();

    // Get all content files
    let all_files = ProjectManager::get_all_content_files().await?;

    if all_files.is_empty() {
        println!("{}", "No content files found.".yellow());
        println!("{}", "💡 Create some files to get started!".bright_black());
        return Ok(());
    }

    println!("{}", "📄 Files:".green().bold());
    for file in all_files {
        if let Some(file_name) = file.file_name().and_then(|n| n.to_str()) {
            if let Ok(content) = tokio::fs::read_to_string(&file).await {
                let word_count = content.split_whitespace().count();
                println!(
                    "  • {} ({} words)",
                    file_name.cyan(),
                    word_count.to_string().yellow()
                );
            } else {
                println!("  • {}", file_name.cyan());
            }
        }
    }
    println!();

    Ok(())
}
