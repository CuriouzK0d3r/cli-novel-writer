use anyhow::Result;
use colored::*;

pub async fn run(name: Option<String>, author: Option<String>) -> Result<()> {
    println!(
        "{}",
        "📚 Initialize Short Story Collection Project".cyan().bold()
    );

    if let Some(name) = name {
        println!("Project Name: {}", name.cyan());
    }

    if let Some(author) = author {
        println!("Author: {}", author.cyan());
    }

    println!(
        "{}",
        "This will create a short story collection project structure.".yellow()
    );
    println!("{}", "📝 This feature is coming soon!".bright_black());

    Ok(())
}
