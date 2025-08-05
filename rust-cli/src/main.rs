use clap::{CommandFactory, Parser, Subcommand};
use colored::*;
use std::process;

mod commands;
mod editor;
mod utils;

#[derive(Parser)]
#[command(
    name = "writers",
    about = "A CLI tool for writing novels and short stories with markdown support",
    version = "1.0.0"
)]
struct Cli {
    #[command(subcommand)]
    command: Option<Commands>,
}

#[derive(Subcommand)]
enum Commands {
    /// Initialize a new writing project
    Init {
        /// Project name
        #[arg(short, long)]
        name: Option<String>,
        /// Author name
        #[arg(short, long)]
        author: Option<String>,
    },
    /// Edit a file with the built-in editor
    Edit {
        /// File to edit (optional - shows selection menu if not provided)
        file: Option<String>,
    },
    /// Show project statistics
    Stats,
    /// List all content
    List,
}

fn print_banner() {
    println!(
        "{}",
        " __  __   ____     ____      _      _   _   _   _   ____   _   _   ____   ____   _     _"
            .bold()
            .cyan()
    );
    println!("{}", "|  \\/  | |  _ \\   / ___|    / \\    | \\ | | | \\ | | / ___| | \\ | | / ___| / ___| | |   | |".bold().cyan());
    println!("{}", "| |\\/| | | | | | | |  _    / _ \\   |  \\| | |  \\| | \\___ \\ |  \\| | \\___ \\ \\___ \\ | |   | |".bold().cyan());
    println!("{}", "| |  | | | |_| | | |_| |  / ___ \\  | |\\  | | |\\  |  ___) || |\\  |  ___) | ___) || |___| |".bold().cyan());
    println!("{}", "|_|  |_| |____/   \\____| /_/   \\_\\ |_| \\_| |_| \\_| |____/ |_| \\_| |____/ |____/ |_____|_|".bold().cyan());
    println!();
    println!(
        "{}",
        "    ✦✦✦  Welcome to your CLI Writing Adventure!  ✦✦✦".magenta()
    );
    println!(
        "{}",
        "          For novels, short stories, and more...".bright_black()
    );
    println!();
}

fn main() {
    let cli = Cli::parse();

    // If no command is provided, show banner and help
    if cli.command.is_none() {
        print_banner();
        let mut cmd = Cli::command();
        cmd.print_help().unwrap();
        return;
    }

    let rt = tokio::runtime::Runtime::new().unwrap();
    let result = match cli.command.unwrap() {
        Commands::Init { name, author } => rt.block_on(commands::init::run(name, author)),
        Commands::Edit { file } => rt.block_on(commands::edit::run(file)),
        Commands::Stats => rt.block_on(commands::stats::run()),
        Commands::List => rt.block_on(commands::list::run()),
    };

    if let Err(e) = result {
        eprintln!("{} {}", "Error:".red().bold(), e);
        process::exit(1);
    }
}
