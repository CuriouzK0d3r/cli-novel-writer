use anyhow::Result;
use colored::*;

pub async fn run(name: Option<String>, author: Option<String>) -> Result<()> {
    println!("{}", "📰 Initialize Blog Project".cyan().bold());

    if let Some(name) = name {
        println!("Blog Name: {}", name.cyan());
    }

    if let Some(author) = author {
        println!("Author: {}", author.cyan());
    }

    println!(
        "{}",
        "This will create a blog project structure for articles and posts.".yellow()
    );
    println!("{}", "📝 This feature is coming soon!".bright_black());

    Ok(())
}
