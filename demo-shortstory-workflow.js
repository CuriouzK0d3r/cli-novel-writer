#!/usr/bin/env node

const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');

/**
 * Demo script to showcase the enhanced short story workflow
 */

async function runDemo() {
  console.log(chalk.blue.bold(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                    Enhanced Short Story Workflow Demo                       ║
║                           Writers CLI v2.0                                  ║
╚══════════════════════════════════════════════════════════════════════════════╝
`));

  console.log(chalk.green("🎯 This demo showcases the new enhanced short story workflow features.\n"));

  // Demo 1: Project Initialization
  console.log(chalk.cyan.bold("📚 DEMO 1: Short Story Project Initialization"));
  console.log(chalk.gray("─".repeat(60)));
  console.log(`
${chalk.yellow("# Initialize a dedicated short story project")}
${chalk.green("writers init-shortstory")}

${chalk.dim("This creates a focused project structure:")}
${chalk.blue("stories/")}           ${chalk.gray("- Completed stories")}
${chalk.blue("drafts/")}            ${chalk.gray("- Work-in-progress")}
${chalk.blue("notes/")}             ${chalk.gray("- Story notes and ideas")}
${chalk.blue("research/")}          ${chalk.gray("- Background research")}
${chalk.blue("exports/")}           ${chalk.gray("- Submission-ready files")}
${chalk.blue("submission-ready/")}  ${chalk.gray("- Polished stories")}
${chalk.blue("exercises/")}         ${chalk.gray("- Writing practice")}
${chalk.blue("prompts/")}           ${chalk.gray("- Prompt responses")}
`);

  await pauseForUser();

  // Demo 2: Story Management
  console.log(chalk.cyan.bold("📖 DEMO 2: Advanced Story Management"));
  console.log(chalk.gray("─".repeat(60)));
  console.log(`
${chalk.yellow("# List all stories with filters")}
${chalk.green("writers story list")}                    ${chalk.gray("# All stories")}
${chalk.green("writers story list --status drafting")}  ${chalk.gray("# Filter by status")}
${chalk.green("writers story list --genre sci-fi")}     ${chalk.gray("# Filter by genre")}
${chalk.green("writers story list --detailed")}         ${chalk.gray("# Detailed table view")}

${chalk.yellow("# Get detailed story information")}
${chalk.green("writers story status my-story")}

${chalk.yellow("# Organize stories")}
${chalk.green("writers story move my-story --to submission-ready")}
${chalk.green("writers story copy my-story --as my-story-v2")}
${chalk.green("writers story archive old-story")}

${chalk.yellow("# Search and tag stories")}
${chalk.green("writers story search 'time travel'")}
${chalk.green("writers story tags my-story --add 'sci-fi,dystopian'")}
`);

  await pauseForUser();

  // Demo 3: Daily Workflow
  console.log(chalk.cyan.bold("✍️  DEMO 3: Daily Writing Workflows"));
  console.log(chalk.gray("─".repeat(60)));
  console.log(`
${chalk.yellow("# Start a guided daily writing session")}
${chalk.green("writers workflow daily")}

${chalk.dim("This interactive workflow helps you:")}
• Continue existing stories
• Start new stories with templates
• Practice with writing exercises
• Run revision sessions
• Set and track goals

${chalk.yellow("# Quick writing sprints")}
${chalk.green("writers workflow sprint")}     ${chalk.gray("# Fast writing with constraints")}
${chalk.green("writers workflow prompt")}     ${chalk.gray("# Writing prompt sessions")}
`);

  await pauseForUser();

  // Demo 4: Templates
  console.log(chalk.cyan.bold("📝 DEMO 4: Enhanced Story Templates"));
  console.log(chalk.gray("─".repeat(60)));
  console.log(`
${chalk.yellow("# Create stories with specialized templates")}
${chalk.green("writers new shortstory 'Flash Fiction' --template flash")}
${chalk.green("writers new shortstory 'Character Study' --template character-study")}
${chalk.green("writers new shortstory 'Twist Ending' --template twist")}
${chalk.green("writers new shortstory 'Literary Story' --template literary")}

${chalk.dim("Available templates:")}
• ${chalk.magenta("basic")} - Simple, clean short story template
• ${chalk.magenta("flash")} - Ultra-short stories (100-1000 words)
• ${chalk.magenta("character-study")} - Character-focused development
• ${chalk.magenta("twist")} - Stories with surprise endings
• ${chalk.magenta("literary")} - Character-driven with deeper themes
• ${chalk.magenta("genre")} - Sci-fi, fantasy, horror, etc.
• ${chalk.magenta("experimental")} - Form and structure experiments
• ${chalk.magenta("collection")} - Part of a larger collection
• ${chalk.magenta("workshop")} - Skill-building practice
• ${chalk.magenta("prompt")} - Based on writing prompts
`);

  await pauseForUser();

  // Demo 5: Submission Workflow
  console.log(chalk.cyan.bold("📤 DEMO 5: Professional Submission Workflow"));
  console.log(chalk.gray("─".repeat(60)));
  console.log(`
${chalk.yellow("# Prepare stories for submission")}
${chalk.green("writers workflow submission")}

${chalk.dim("Automated checklist includes:")}
• Story completion verification
• Grammar and spelling check
• Word count validation
• Standard manuscript formatting
• Publication research
• Cover letter preparation
• Submission guidelines review

${chalk.yellow("# Track submissions and responses")}
${chalk.green("writers story submit my-story")}

${chalk.dim("Built-in submission tracker with:")}
• Publication targets (dream, good, building credits)
• Submission logs with dates and responses
• Response tracking (acceptances, rejections, feedback)
• Statistics (acceptance rates, response times)
`);

  await pauseForUser();

  // Demo 6: Revision Workflow
  console.log(chalk.cyan.bold("🔧 DEMO 6: Structured Revision Process"));
  console.log(chalk.gray("─".repeat(60)));
  console.log(`
${chalk.yellow("# Run structured revision sessions")}
${chalk.green("writers workflow revision")}

${chalk.dim("Four types of revision:")}
• ${chalk.blue("Structural")} - Plot, pacing, character arcs
• ${chalk.blue("Line editing")} - Prose, style, flow
• ${chalk.blue("Copy editing")} - Grammar, punctuation
• ${chalk.blue("Proofreading")} - Final polish

${chalk.dim("Each type includes specific checklists and guidance.")}
`);

  await pauseForUser();

  // Demo 7: Editing Integration
  console.log(chalk.cyan.bold("✏️  DEMO 7: Seamless Editing Integration"));
  console.log(chalk.gray("─".repeat(60)));
  console.log(`
${chalk.yellow("# Edit stories from any directory")}
${chalk.green("writers edit my-story")}           ${chalk.gray("# Finds story in any directory")}
${chalk.green("writers edit story1")}             ${chalk.gray("# Works with simplified names")}
${chalk.green("writers edit")}                    ${chalk.gray("# Interactive file browser")}

${chalk.yellow("# Write command also enhanced")}
${chalk.green("writers write my-story")}          ${chalk.gray("# Opens external editor")}

${chalk.dim("Enhanced file discovery:")}
• Searches all story directories (stories, drafts, exercises, etc.)
• Smart name matching (exact, partial, prefix-based)
• Interactive file browser with category grouping
• Support for creating new files during editing
`);

  await pauseForUser();

  // Demo 8: Collection Management
  console.log(chalk.cyan.bold("📚 DEMO 8: Collection Building"));
  console.log(chalk.gray("─".repeat(60)));
  console.log(`
${chalk.yellow("# Manage story collections")}
${chalk.green("writers workflow collection")}

${chalk.dim("Features:")}
• Theme planning and unity tracking
• Story organization and arrangement
• Collection readiness assessment
• Connection mapping between stories

${chalk.yellow("# Collection types:")}
• ${chalk.magenta("Thematic")} - Stories exploring similar themes
• ${chalk.magenta("Character-linked")} - Shared characters or settings
• ${chalk.magenta("Chronological")} - Time-based connections
• ${chalk.magenta("Stylistic")} - Experimental approach variations
`);

  await pauseForUser();

  console.log(chalk.green.bold(`
🎉 Enhanced Short Story Workflow Complete!

Key Benefits:
${chalk.blue("✓")} Independent short story projects (no novel clutter)
${chalk.blue("✓")} Professional submission preparation
${chalk.blue("✓")} Advanced story organization and search
${chalk.blue("✓")} Guided daily writing workflows
${chalk.blue("✓")} Specialized templates for different story types
${chalk.blue("✓")} Structured revision processes
${chalk.blue("✓")} Collection building tools
${chalk.blue("✓")} Seamless editing integration

Ready to start your short story journey?
${chalk.cyan("writers init-shortstory")} ${chalk.gray("# Create your first project")}
${chalk.cyan("writers workflow daily")}  ${chalk.gray("# Start writing today")}
`));

  console.log(chalk.yellow.bold("\n📖 For detailed documentation, see:"));
  console.log(chalk.cyan("   ENHANCED_SHORT_STORY_WORKFLOW.md"));
  console.log(chalk.cyan("   SHORT_STORY_GUIDE.md"));
}

async function pauseForUser() {
  console.log(chalk.gray("\n   Press Enter to continue..."));
  await new Promise(resolve => {
    process.stdin.once('data', () => resolve());
  });
  console.log();
}

// Demo different story statuses
function showStatusDemo() {
  console.log(chalk.cyan.bold("📊 Story Status Tracking"));
  console.log(chalk.gray("─".repeat(40)));

  const statuses = [
    { status: 'planning', color: 'yellow', icon: '📋', desc: 'Concept development' },
    { status: 'drafting', color: 'blue', icon: '✍️', desc: 'First draft writing' },
    { status: 'revising', color: 'orange', icon: '🔧', desc: 'Multiple revision passes' },
    { status: 'complete', color: 'green', icon: '✅', desc: 'Ready for submission' },
    { status: 'submitted', color: 'purple', icon: '📤', desc: 'Out to publications' },
    { status: 'published', color: 'cyan', icon: '🎉', desc: 'Accepted and published' }
  ];

  statuses.forEach(({ status, color, icon, desc }) => {
    const colorFn = chalk[color] || chalk.white;
    console.log(`${colorFn(icon)} ${colorFn(status.padEnd(10))} - ${chalk.gray(desc)}`);
  });
}

// Demo file organization
function showOrganizationDemo() {
  console.log(chalk.cyan.bold("📁 Enhanced File Organization"));
  console.log(chalk.gray("─".repeat(40)));

  const directories = [
    { name: 'stories/', desc: 'Completed, polished stories', icon: '📗' },
    { name: 'drafts/', desc: 'Work-in-progress stories', icon: '📝' },
    { name: 'submission-ready/', desc: 'Stories ready for publication', icon: '📤' },
    { name: 'exercises/', desc: 'Writing practice and experiments', icon: '🏋️' },
    { name: 'prompts/', desc: 'Prompt-based writing', icon: '💭' },
    { name: 'notes/', desc: 'Story ideas and research', icon: '📋' },
    { name: 'research/', desc: 'Background information', icon: '🔍' }
  ];

  directories.forEach(({ name, desc, icon }) => {
    console.log(`${icon} ${chalk.blue(name.padEnd(18))} ${chalk.gray(desc)}`);
  });
}

// Run the demo
if (require.main === module) {
  runDemo().catch(console.error);
}

module.exports = { runDemo, showStatusDemo, showOrganizationDemo };
