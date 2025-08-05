use anyhow::Result;
use colored::*;

pub async fn run(
    content_type: String,
    name: Option<String>,
    template: Option<String>,
) -> Result<()> {
    println!("{}", "📝 Create New Content".cyan().bold());
    println!("Type: {}", content_type.cyan());

    if let Some(name) = name {
        println!("Name: {}", name.cyan());
    }

    if let Some(template) = template {
        println!("Template: {}", template.cyan());
    }

    println!("{}", "📝 This feature is coming soon!".bright_black());

    Ok(())
}
