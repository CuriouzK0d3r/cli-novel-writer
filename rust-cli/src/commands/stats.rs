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

    println!("{}", "📊 Project Statistics".cyan().bold());
    println!();
    println!("Project: {}", config.name.cyan());
    println!("Author: {}", config.author.cyan());
    println!("Type: {}", config.r#type.cyan());
    println!();

    // Get all content files
    let all_files = ProjectManager::get_all_content_files().await?;
    let mut total_words = 0;
    let mut total_chars = 0;
    let total_files = all_files.len();

    for file in &all_files {
        if let Ok(content) = tokio::fs::read_to_string(&file).await {
            let word_count = content.split_whitespace().count();
            let char_count = content.chars().count();
            total_words += word_count;
            total_chars += char_count;
        }
    }

    // Overall statistics
    println!("{}", "📈 Overall Statistics:".green().bold());
    println!("  Files: {}", total_files.to_string().cyan());
    println!("  Words: {}", total_words.to_string().cyan());
    println!("  Characters: {}", total_chars.to_string().cyan());

    if total_words > 0 {
        let reading_time = (total_words as f64 / 200.0).ceil() as u32; // 200 words per minute
        println!(
            "  Reading Time: {} minutes",
            reading_time.to_string().cyan()
        );
    }
    println!();

    // Project type specific stats
    match config.r#type.as_str() {
        "novel" => {
            let chapters = ProjectManager::get_chapters().await?;
            let scenes = ProjectManager::get_scenes().await?;
            let characters = ProjectManager::get_characters().await?;

            println!("{}", "📖 Novel Statistics:".green().bold());
            println!("  Chapters: {}", chapters.len().to_string().cyan());
            println!("  Scenes: {}", scenes.len().to_string().cyan());
            println!("  Characters: {}", characters.len().to_string().cyan());
            println!();
        }
        "short-story" => {
            let stories = ProjectManager::get_short_stories().await?;
            println!("{}", "📚 Short Story Statistics:".green().bold());
            println!("  Stories: {}", stories.len().to_string().cyan());
            println!();
        }
        "blog" => {
            let posts = ProjectManager::get_blog_posts().await?;
            println!("{}", "📝 Blog Statistics:".green().bold());
            println!("  Posts: {}", posts.len().to_string().cyan());
            println!();
        }
        _ => {}
    }

    Ok(())
}
