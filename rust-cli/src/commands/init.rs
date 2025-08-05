use anyhow::Result;
use colored::*;
use dialoguer::{theme::ColorfulTheme, Confirm, Input, Select};
use tokio::fs as async_fs;

use crate::utils::ProjectManager;

pub async fn run(name: Option<String>, author: Option<String>) -> Result<()> {
    println!(
        "{}",
        "📝 Writers CLI - Project Initialization".cyan().bold()
    );
    println!();

    // Check if already in a project
    if ProjectManager::is_writers_project() {
        println!("{}", "⚠️  Already in a Writers project!".yellow());
        let overwrite = Confirm::with_theme(&ColorfulTheme::default())
            .with_prompt("Do you want to reinitialize this project?")
            .default(false)
            .interact()?;

        if !overwrite {
            println!("{}", "Project initialization cancelled.".bright_black());
            return Ok(());
        }
    }

    // Get project name
    let project_name = match name {
        Some(n) => n,
        None => {
            let current_dir = std::env::current_dir()?
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("my-novel")
                .to_string();

            Input::with_theme(&ColorfulTheme::default())
                .with_prompt("Project name")
                .default(current_dir)
                .interact_text()?
        }
    };

    // Get author name
    let author_name = match author {
        Some(a) => a,
        None => Input::with_theme(&ColorfulTheme::default())
            .with_prompt("Author name")
            .default("Anonymous".to_string())
            .interact_text()?,
    };

    // Select project type
    let project_types = vec![
        "Novel - Full novel with chapters, scenes, and characters",
        "Short Story - Single story project",
        "Blog - Blog posts and articles",
    ];

    let selection = Select::with_theme(&ColorfulTheme::default())
        .with_prompt("What type of writing project?")
        .default(0)
        .items(&project_types)
        .interact()?;

    let project_type = match selection {
        0 => "novel",
        1 => "short-story",
        2 => "blog",
        _ => "novel",
    };

    println!();
    println!("{}", "🚀 Creating project structure...".green());

    // Create project structure
    ProjectManager::create_project_structure(project_type).await?;

    // Create configuration
    let _config = ProjectManager::create_project(
        project_name.clone(),
        author_name.clone(),
        project_type.to_string(),
    )
    .await?;

    // Create basic README
    let readme_content = format!(
        r#"# {}

**Author:** {}
**Project Type:** {}
**Created:** {}

## Getting Started

This project was created with Writers CLI (Rust version).

Use `writers --help` to see available commands.
"#,
        project_name,
        author_name,
        project_type,
        chrono::Utc::now().format("%Y-%m-%d")
    );

    async_fs::write("README.md", readme_content).await?;

    println!();
    println!(
        "{} {}",
        "✅ Project".green().bold(),
        format!("'{}'", project_name).cyan().bold()
    );
    println!("{}", "   successfully initialized!".green().bold());
    println!();

    println!("{}", "📖 Next Steps:".blue().bold());
    match project_type {
        "novel" => {
            println!("   1. Create chapters: {}", "mkdir chapters".green());
            println!(
                "   2. Start writing: {}",
                "touch chapters/chapter1.md".green()
            );
        }
        "short-story" => {
            println!("   1. Create drafts folder: {}", "mkdir drafts".green());
            println!("   2. Start writing: {}", "touch drafts/story.md".green());
        }
        "blog" => {
            println!("   1. Create posts folder: {}", "mkdir posts".green());
            println!(
                "   2. Start writing: {}",
                "touch posts/first-post.md".green()
            );
        }
        _ => {}
    }

    Ok(())
}
