const chalk = require("chalk");
const inquirer = require("inquirer");
const boxen = require("boxen");
const fs = require("fs").promises;
const path = require("path");

async function initShortStoryCommand(options) {
  try {
    console.log(chalk.blue.bold("\n📚 Writers CLI - Short Story Project Initialization\n"));

    // Check if already a writers project
    if (await isWritersProject()) {
      console.log(
        chalk.yellow("⚠️  This directory is already a Writers project."),
      );
      const { overwrite } = await inquirer.prompt([
        {
          type: "confirm",
          name: "overwrite",
          message: "Do you want to reinitialize this project?",
          default: false,
        },
      ]);

      if (!overwrite) {
        console.log(chalk.gray("Initialization cancelled."));
        return;
      }
    }

    // Gather project information
    const projectInfo = await gatherShortStoryProjectInfo(options);

    // Create the project
    console.log(chalk.blue("\n⚡ Creating your short story project..."));

    const config = await initShortStoryProject(projectInfo);

    // Show success message
    displayShortStorySuccessMessage(config);
  } catch (error) {
    console.error(chalk.red("❌ Error initializing short story project:"), error.message);
    process.exit(1);
  }
}

async function gatherShortStoryProjectInfo(options) {
  const questions = [];

  // Project type
  questions.push({
    type: "list",
    name: "projectType",
    message: "What type of short story project are you creating?",
    choices: [
      {
        name: "Single Story - Work on one story at a time",
        value: "single"
      },
      {
        name: "Collection - Multiple related stories",
        value: "collection"
      },
      {
        name: "Workshop - Practice and experimental stories",
        value: "workshop"
      },
      {
        name: "Themed Collection - Stories around a specific theme",
        value: "themed"
      }
    ],
    default: "single"
  });

  // Project name
  if (!options.name) {
    questions.push({
      type: "input",
      name: "name",
      message: "What is the title of your story/collection?",
      default: require("path").basename(process.cwd()),
      validate: (input) => {
        if (input.trim().length === 0) {
          return "Project name cannot be empty";
        }
        return true;
      },
    });
  }

  // Author name
  if (!options.author) {
    questions.push({
      type: "input",
      name: "author",
      message: "Who is the author?",
      default: process.env.USER || process.env.USERNAME || "Unknown Author",
      validate: (input) => {
        if (input.trim().length === 0) {
          return "Author name cannot be empty";
        }
        return true;
      },
    });
  }

  // Primary genre
  questions.push({
    type: "list",
    name: "genre",
    message: "What is your primary genre?",
    choices: [
      "Literary Fiction",
      "Science Fiction",
      "Fantasy",
      "Horror",
      "Mystery",
      "Romance",
      "Thriller",
      "Historical Fiction",
      "Flash Fiction",
      "Experimental",
      "Magic Realism",
      "Contemporary",
      "Mixed/Various",
      "Other",
    ],
    default: "Literary Fiction",
  });

  // Target length
  questions.push({
    type: "list",
    name: "targetLength",
    message: "What is your typical story length?",
    choices: [
      { name: "Flash Fiction (100-1,000 words)", value: "flash" },
      { name: "Short Short (1,000-2,500 words)", value: "short" },
      { name: "Standard Short Story (2,500-7,500 words)", value: "standard" },
      { name: "Long Short Story (7,500-15,000 words)", value: "long" },
      { name: "Mixed Lengths", value: "mixed" }
    ],
    default: "standard"
  });

  // Default editor
  questions.push({
    type: "list",
    name: "editor",
    message: "Which editor would you like to use by default?",
    choices: [
      {
        name: "Novel Editor (built-in, writer-focused)",
        value: "novel-editor",
      },
      { name: "Nano (simple, built-in)", value: "nano" },
      { name: "Vim (advanced)", value: "vim" },
      { name: "VS Code (if installed)", value: "code" },
      { name: "System default", value: "default" },
    ],
    default: "novel-editor",
  });

  const answers = await inquirer.prompt(questions);

  // Merge with provided options
  return {
    name: options.name || answers.name,
    author: options.author || answers.author,
    projectType: answers.projectType,
    genre: answers.genre,
    targetLength: answers.targetLength,
    editor: answers.editor,
  };
}

async function initShortStoryProject(projectInfo) {
  const config = {
    name: projectInfo.name,
    author: projectInfo.author,
    type: "shortstory-project",
    projectType: projectInfo.projectType,
    genre: projectInfo.genre,
    targetLength: projectInfo.targetLength,
    editor: projectInfo.editor,
    created: new Date().toISOString(),
    version: "1.0.0"
  };

  // Create directory structure based on project type
  const directories = getDirectoriesForProjectType(projectInfo.projectType);

  for (const dir of directories) {
    try {
      await fs.mkdir(dir, { recursive: true });
      console.log(chalk.gray(`  📁 Created ${dir}/`));
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  // Create config file
  await fs.writeFile(
    'writers.config.json',
    JSON.stringify(config, null, 2)
  );

  // Create README
  const readme = generateReadmeContent(config);
  await fs.writeFile('README.md', readme);

  // Create initial templates and examples based on project type
  await createInitialContent(projectInfo);

  // Create .gitignore if it doesn't exist
  const gitignoreContent = `
# Writers CLI
exports/
backups/
.writers-temp/

# OS
.DS_Store
Thumbs.db

# Editor
.vscode/
*.swp
*.swo
*~

# Node (if using any JS tools)
node_modules/
npm-debug.log*
`;

  try {
    await fs.access('.gitignore');
  } catch {
    await fs.writeFile('.gitignore', gitignoreContent.trim());
  }

  return config;
}

function getDirectoriesForProjectType(projectType) {
  const baseDirectories = ['stories', 'drafts', 'notes', 'exports', 'research'];

  switch (projectType) {
    case 'single':
      return [...baseDirectories, 'revisions', 'character-notes'];
    case 'collection':
      return [...baseDirectories, 'themes', 'connections', 'submission-ready'];
    case 'workshop':
      return [...baseDirectories, 'exercises', 'prompts', 'feedback', 'experiments'];
    case 'themed':
      return [...baseDirectories, 'themes', 'mood-boards', 'inspiration', 'submission-ready'];
    default:
      return baseDirectories;
  }
}

async function createInitialContent(projectInfo) {
  // Create a starter story based on project type and target length
  const template = getTemplateForProject(projectInfo);
  const filename = 'stories/starter-story.md';

  await fs.writeFile(filename, template);
  console.log(chalk.gray(`  📝 Created ${filename}`));

  // Create project-specific guides
  const guide = getProjectGuide(projectInfo);
  await fs.writeFile('PROJECT_GUIDE.md', guide);
  console.log(chalk.gray(`  📖 Created PROJECT_GUIDE.md`));

  // Create submission tracker for collection projects
  if (projectInfo.projectType === 'collection' || projectInfo.projectType === 'themed') {
    const submissionTracker = generateSubmissionTracker();
    await fs.writeFile('submission-tracker.md', submissionTracker);
    console.log(chalk.gray(`  📋 Created submission-tracker.md`));
  }

  // Create writing prompts for workshop projects
  if (projectInfo.projectType === 'workshop') {
    const prompts = generateWritingPrompts();
    await fs.writeFile('prompts/daily-prompts.md', prompts);
    console.log(chalk.gray(`  💭 Created prompts/daily-prompts.md`));
  }
}

function getTemplateForProject(projectInfo) {
  const lengthTargets = {
    flash: "100-1,000 words",
    short: "1,000-2,500 words",
    standard: "2,500-7,500 words",
    long: "7,500-15,000 words",
    mixed: "Variable length"
  };

  return `# ${projectInfo.name}

*Created: ${new Date().toLocaleDateString()}*
*Author: ${projectInfo.author}*

---

## Story Information
- **Genre:** ${projectInfo.genre}
- **Target Length:** ${lengthTargets[projectInfo.targetLength]}
- **Project Type:** ${projectInfo.projectType}
- **Status:** Planning

## Initial Concept
[Describe your story concept, theme, or the central question you want to explore]

## Characters
**Main Character:**
- **Name:**
- **Age:**
- **Background:**
- **Goal:**
- **Conflict:**

**Supporting Characters:**
-

## Setting
**Time:**
**Place:**
**Atmosphere:**

## Plot Structure
**Opening:** [How does the story begin?]
**Inciting Incident:** [What sets the story in motion?]
**Rising Action:** [What complications arise?]
**Climax:** [What is the peak moment of tension?]
**Resolution:** [How does it end?]

## Themes to Explore
-
-
-

## Research Notes
[Any research needed for this story]

## Revision Notes
[Notes for future revisions]

---

## Story Content

[Begin writing your story here...]

`;
}

function generateReadmeContent(config) {
  return `# ${config.name}

**Author:** ${config.author}
**Genre:** ${config.genre}
**Project Type:** ${config.projectType}
**Created:** ${new Date(config.created).toLocaleDateString()}

## About This Project

This is a ${config.projectType} short story project created with Writers CLI.

## Project Structure

\`\`\`
${config.name}/
├── stories/          # Your completed stories
├── drafts/           # Work-in-progress drafts
├── notes/            # Plot notes, character development
├── research/         # Background research and inspiration
├── exports/          # Exported versions for submission
${config.projectType === 'collection' || config.projectType === 'themed' ? '├── submission-ready/ # Stories ready for publication' : ''}
${config.projectType === 'workshop' ? '├── exercises/       # Writing exercises and experiments' : ''}
${config.projectType === 'workshop' ? '├── prompts/         # Writing prompts and challenges' : ''}
└── README.md         # This file
\`\`\`

## Getting Started

### Create a new story
\`\`\`bash
writers new shortstory "Story Title"
\`\`\`

### Start writing
\`\`\`bash
writers write story-title
\`\`\`

### View your progress
\`\`\`bash
writers stats
writers list
\`\`\`

### Export for submission
\`\`\`bash
writers export html
writers export text
\`\`\`

## Workflow Tips

${getWorkflowTips(config.projectType)}

## Project Goals

- [ ] Complete first draft
- [ ] Self-edit and revise
- [ ] Get feedback from beta readers
- [ ] Polish for submission
- [ ] Submit to publications

---

*Generated by Writers CLI - A tool for writers, by writers.*
`;
}

function getWorkflowTips(projectType) {
  switch (projectType) {
    case 'single':
      return `- Focus on one story at a time
- Use the drafts/ folder for multiple versions
- Track revisions in the revisions/ folder
- Keep character notes separate from the main story`;

    case 'collection':
      return `- Maintain thematic consistency across stories
- Use the connections/ folder to track how stories relate
- Move polished stories to submission-ready/
- Consider the order and flow of your collection`;

    case 'workshop':
      return `- Try new techniques and styles
- Use prompts to break writer's block
- Keep experimental pieces in experiments/
- Document what you learn in your notes`;

    case 'themed':
      return `- Define your theme clearly in themes/
- Collect inspiration in mood-boards/
- Ensure each story serves the overall theme
- Consider multiple perspectives on your theme`;

    default:
      return `- Write regularly and consistently
- Don't edit while drafting
- Keep notes on ideas and inspiration
- Celebrate small victories`;
  }
}

function getProjectGuide(projectInfo) {
  return `# ${projectInfo.name} - Project Guide

## Your Project Type: ${projectInfo.projectType.charAt(0).toUpperCase() + projectInfo.projectType.slice(1)}

${getDetailedProjectGuide(projectInfo)}

## Target Length Guidelines

${getLengthGuidelines(projectInfo.targetLength)}

## Genre-Specific Tips: ${projectInfo.genre}

${getGenreTips(projectInfo.genre)}

## Writing Schedule Suggestions

### Daily Practice
- Set a consistent writing time
- Start with small, achievable goals
- Track your progress

### Weekly Goals
- Aim for 1-2 completed drafts per week
- Reserve time for revision and editing
- Read stories in your genre for inspiration

### Monthly Milestones
- Complete and polish 2-4 stories
- Submit to publications or contests
- Reflect on your progress and growth

## Submission Guidelines

### Before Submitting
- [ ] Multiple drafts completed
- [ ] Self-edited for grammar and style
- [ ] Beta reader feedback incorporated
- [ ] Formatted according to submission guidelines
- [ ] Cover letter written

### Tracking Submissions
Use the submission tracker to monitor where you've sent your work and track responses.

---

*Remember: Every professional writer started as a beginner. Keep writing, keep improving.*
`;
}

function getDetailedProjectGuide(projectInfo) {
  switch (projectInfo.projectType) {
    case 'single':
      return `### Single Story Focus

This project is designed for deep focus on one story at a time. Benefits include:
- Complete attention to character development
- Thorough exploration of themes
- Multiple revision cycles
- Perfect for longer short stories or novelettes

**Recommended Workflow:**
1. Brainstorm and outline in notes/
2. Write first draft in drafts/
3. Revise multiple times
4. Move final version to stories/
5. Export for submission`;

    case 'collection':
      return `### Story Collection

Building a cohesive collection of related stories. Consider:
- Thematic unity across stories
- Character or setting connections
- Varied perspectives on similar themes
- Strong opening and closing stories

**Recommended Workflow:**
1. Define your collection's theme
2. Plan 5-12 interconnected stories
3. Write each story individually
4. Consider arrangement and flow
5. Polish collection as a whole`;

    case 'workshop':
      return `### Writing Workshop

Focused on skill development and experimentation. Goals:
- Try different narrative techniques
- Experiment with voice and style
- Practice specific skills (dialogue, description, etc.)
- Build a portfolio of diverse work

**Recommended Workflow:**
1. Choose a specific skill to practice
2. Find or create relevant prompts
3. Write experimental pieces
4. Analyze what worked and what didn't
5. Apply lessons to more serious work`;

    case 'themed':
      return `### Themed Collection

Stories unified by a central theme or concept. Features:
- Deep exploration of a specific idea
- Multiple perspectives and approaches
- Rich thematic resonance
- Suitable for publication as a collection

**Recommended Workflow:**
1. Define your theme clearly
2. Brainstorm different angles and approaches
3. Research your theme thoroughly
4. Write diverse stories within the theme
5. Ensure thematic coherence`;

    default:
      return 'General short story project for flexible writing and experimentation.';
  }
}

function getLengthGuidelines(targetLength) {
  switch (targetLength) {
    case 'flash':
      return `### Flash Fiction (100-1,000 words)
- Focus on a single moment or image
- Every word must count
- Start as close to the climax as possible
- Leave room for reader interpretation
- Perfect for daily writing practice`;

    case 'short':
      return `### Short Short Stories (1,000-2,500 words)
- One central conflict or revelation
- Limited number of characters
- Single setting or timeframe
- Strong emotional impact
- Ideal for literary magazines`;

    case 'standard':
      return `### Standard Short Stories (2,500-7,500 words)
- Room for character development
- Multiple scenes possible
- Subplot potential
- More complex themes
- Standard magazine length`;

    case 'long':
      return `### Long Short Stories (7,500-15,000 words)
- Novelette territory
- Multiple characters and perspectives
- Complex plot structures
- Rich world-building
- Suitable for special issues`;

    case 'mixed':
      return `### Mixed Lengths
- Variety keeps writing fresh
- Match length to story needs
- Build a diverse portfolio
- Practice different techniques
- Appeal to various publications`;

    default:
      return 'Flexible length based on story requirements.';
  }
}

function getGenreTips(genre) {
  const tips = {
    'Literary Fiction': 'Focus on character development, beautiful prose, and universal themes. Pay attention to literary magazines and their aesthetic.',
    'Science Fiction': 'Build believable worlds with consistent rules. Ground fantastical elements in real science. Consider the human impact of technology.',
    'Fantasy': 'Create immersive worlds with their own logic. Develop unique magic systems. Focus on character growth through extraordinary circumstances.',
    'Horror': 'Build atmosphere and tension gradually. Use psychological elements alongside supernatural ones. The unknown is often scarier than the revealed.',
    'Mystery': 'Play fair with clues while maintaining suspense. Create satisfying revelations. Every detail should serve the puzzle.',
    'Romance': 'Develop believable relationship dynamics. Create obstacles that test the connection. Focus on emotional authenticity.',
    'Thriller': 'Maintain constant tension and pacing. Use short chapters and cliffhangers. Keep stakes high and personal.',
    'Historical Fiction': 'Research thoroughly but wear it lightly. Capture the period\'s voice without alienating modern readers. Focus on universal human experiences.',
    'Flash Fiction': 'Compress time and focus. Use powerful imagery. End with impact. Every word must earn its place.',
    'Experimental': 'Push boundaries while maintaining readability. Ground innovation in strong fundamentals. Take risks with form and structure.',
    'Magic Realism': 'Blend fantastic elements seamlessly with reality. Treat magical events as natural. Focus on emotional and symbolic truth.',
    'Contemporary': 'Capture current zeitgeist and concerns. Use authentic modern voice. Address relevant social issues.'
  };

  return tips[genre] || 'Focus on strong characters, engaging plots, and polished prose. Read widely in your chosen genre.';
}

function generateSubmissionTracker() {
  return `# Submission Tracker

## Stories Ready for Submission

| Story Title | Word Count | Genre | Status | Notes |
|-------------|------------|-------|--------|-------|
| | | | | |

## Submission Log

### [Story Title]

| Publication | Date Sent | Response Date | Result | Notes |
|-------------|-----------|---------------|--------|-------|
| | | | | |

## Target Publications

### Tier 1 (Dream Markets)
- [ ] Publication Name - Genre, Length, Pay Rate
- [ ] Publication Name - Genre, Length, Pay Rate

### Tier 2 (Good Markets)
- [ ] Publication Name - Genre, Length, Pay Rate
- [ ] Publication Name - Genre, Length, Pay Rate

### Tier 3 (Building Credits)
- [ ] Publication Name - Genre, Length, Pay Rate
- [ ] Publication Name - Genre, Length, Pay Rate

## Submission Guidelines Checklist

### Before Submitting
- [ ] Story is polished and error-free
- [ ] Word count fits publication requirements
- [ ] Formatted according to standard manuscript format
- [ ] Cover letter written and personalized
- [ ] Simultaneous submission policy checked
- [ ] Response time noted
- [ ] Rights and payment terms understood

### After Submitting
- [ ] Logged in submission tracker
- [ ] Calendar reminder set for follow-up
- [ ] Prepared for next submission if rejected
- [ ] Celebrated the achievement of submitting

## Response Tracking

### Acceptances
- Date:
- Publication:
- Story:
- Payment:
- Rights:
- Publication date:

### Rejections
- Date:
- Publication:
- Story:
- Type: (Form/Personal)
- Feedback:
- Resubmit elsewhere:

### Statistics
- Stories written this year:
- Submissions sent:
- Acceptances:
- Rejections:
- Acceptance rate:
- Average response time:

---

*Remember: Rejection is part of the process. Keep writing, keep submitting!*
`;
}

function generateWritingPrompts() {
  return `# Daily Writing Prompts

## How to Use These Prompts
- Set a timer for 15-30 minutes
- Don't edit while writing
- Focus on exploration, not perfection
- Use prompts as starting points, not rigid rules

## Character-Based Prompts

1. Write about someone who collects something unusual and why.
2. A character discovers a letter addressed to them from 50 years ago.
3. Someone who speaks only in questions for an entire day.
4. A person who remembers everything but wishes they could forget.
5. Write about someone's last day at a job they've held for 20 years.

## Situation Prompts

1. Two strangers get stuck in an elevator during a power outage.
2. A family dinner where everyone is hiding the same secret.
3. The last human on Earth discovers they're not alone.
4. Someone finds a door in their house that wasn't there yesterday.
5. A character inherits something unexpected from a stranger.

## Opening Line Prompts

1. "The package arrived exactly 100 years late."
2. "She had been dead for three minutes when the phone rang."
3. "The museum was supposed to be empty, but the paintings were watching."
4. "Every Tuesday, the same stranger sits in my coffee shop and cries."
5. "The GPS said 'turn left,' but there was no road there."

## Dialogue Prompts

1. "I'm not saying it's aliens, but..."
2. "That's not how I remember it happening."
3. "Please tell me you kept the receipt."
4. "It was here a minute ago, I swear."
5. "Don't look now, but I think we're being followed."

## Setting Prompts

1. A 24-hour laundromat at 3 AM
2. The lost and found box of a train station
3. An abandoned amusement park in winter
4. The waiting room of a time travel agency
5. A library where books write themselves

## Genre Exercises

### Science Fiction
- Explore the consequences of a single technological change
- Write about humanity's first contact with alien life
- Imagine a world where one law of physics works differently

### Fantasy
- Create a magic system with unique costs and limitations
- Write about a world where a common object has magical properties
- Explore what happens when magic stops working

### Horror
- Start with something comforting and make it terrifying
- Write about a character who slowly realizes their reality isn't real
- Explore fear without using violence or gore

### Literary Fiction
- Focus on a moment of profound change in someone's life
- Write about the space between what people say and mean
- Explore a universal experience through a specific lens

### Mystery
- Write a locked-room mystery in an unusual setting
- Create a detective who has an unusual limitation
- Write about solving a crime that hasn't happened yet

## Weekly Challenges

### Week 1: Constraint Writing
- Write a story using only dialogue
- Write without using the letter 'e'
- Tell a story in exactly 55 words

### Week 2: POV Experiments
- Write the same scene from three different perspectives
- Try second person narration
- Write from the POV of an inanimate object

### Week 3: Structure Play
- Write a story backwards
- Use only fragments and incomplete sentences
- Structure a story as a list or manual

### Week 4: Voice Development
- Write in the voice of a child, teenager, and elderly person
- Mimic the style of your favorite author
- Write as someone from a different era

## Monthly Projects

### Collection Development
- Write five stories that share a theme
- Create stories that could be chapters in a novel
- Develop a series of connected characters

### Skill Building
- Focus on dialogue for a month
- Practice description and setting
- Work on pacing and tension

### Genre Exploration
- Try a new genre each week
- Blend two genres in interesting ways
- Write the same story in different genres

---

*Remember: The goal is practice and exploration. Not every prompt will spark a great story, but each one will make you a better writer.*
`;
}

async function isWritersProject() {
  try {
    await fs.access('writers.config.json');
    return true;
  } catch {
    return false;
  }
}

function displayShortStorySuccessMessage(config) {
  const typeDescriptions = {
    single: "focused single-story project",
    collection: "story collection project",
    workshop: "writing workshop project",
    themed: "themed collection project"
  };

  const message = `
${chalk.green.bold("✅ Short Story Project initialized successfully!")}

${chalk.bold("Project Details:")}
📚 Title: ${chalk.cyan(config.name)}
✍️  Author: ${chalk.cyan(config.author)}
🎭 Genre: ${chalk.cyan(config.genre)}
📏 Target Length: ${chalk.cyan(config.targetLength)}
🎯 Type: ${chalk.cyan(typeDescriptions[config.projectType])}

${chalk.bold("Next Steps:")}
${chalk.green("•")} Create your first story: ${chalk.yellow('writers new shortstory "Story Title"')}
${chalk.green("•")} Start writing: ${chalk.yellow("writers write starter-story")}
${chalk.green("•")} View project stats: ${chalk.yellow("writers stats")}
${chalk.green("•")} List all content: ${chalk.yellow("writers list")}
${chalk.green("•")} Read the project guide: ${chalk.yellow("cat PROJECT_GUIDE.md")}

${chalk.bold("Project Structure:")}
📂 stories/          - Your completed stories
📂 drafts/           - Work-in-progress drafts
📂 notes/            - Plot notes and ideas
📂 research/         - Background research
📂 exports/          - Exported versions for submission
${config.projectType === 'collection' || config.projectType === 'themed' ? '📂 submission-ready/  - Stories ready for publication' : ''}
${config.projectType === 'workshop' ? '📂 exercises/       - Writing exercises and experiments' : ''}
${config.projectType === 'workshop' ? '📂 prompts/         - Writing prompts and challenges' : ''}

${chalk.bold("Pro Tips:")}
${chalk.blue("•")} Use ${chalk.yellow('writers list --type stories')} to see only stories
${chalk.blue("•")} Export stories for submission with ${chalk.yellow('writers export')}
${chalk.blue("•")} Track your progress with the built-in statistics
${chalk.blue("•")} Keep backup copies of important work

Happy writing! 🎉✨
`;

  console.log(
    boxen(message, {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: "green",
    }),
  );
}

module.exports = initShortStoryCommand;
