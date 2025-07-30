const chalk = require("chalk");
const inquirer = require("inquirer");
const fs = require("fs").promises;
const path = require("path");
const projectManager = require("../utils/project");

async function workflowCommand(workflowType, options = {}) {
  try {
    // Check if in a writers project
    if (!projectManager.isWritersProject()) {
      console.log(
        chalk.red('❌ Not a Writers project. Run "writers init" or "writers init-shortstory" to initialize.')
      );
      return;
    }

    console.log(chalk.blue.bold(`\n🔄 Starting ${workflowType} workflow...\n`));

    switch (workflowType) {
      case 'daily':
        await dailyWritingWorkflow(options);
        break;
      case 'submission':
        await submissionWorkflow(options);
        break;
      case 'revision':
        await revisionWorkflow(options);
        break;
      case 'collection':
        await collectionWorkflow(options);
        break;
      case 'prompt':
        await promptWorkflow(options);
        break;
      case 'sprint':
        await sprintWorkflow(options);
        break;
      case 'publish':
        await publishWorkflow(options);
        break;
      case 'backup':
        await backupWorkflow(options);
        break;
      default:
        console.log(chalk.red(`❌ Unknown workflow: ${workflowType}`));
        showWorkflowHelp();
    }
  } catch (error) {
    console.error(chalk.red("❌ Workflow error:"), error.message);
  }
}

async function dailyWritingWorkflow(options) {
  console.log(chalk.green.bold("📝 Daily Writing Session\n"));

  // Get current project stats
  const stats = await getProjectStats();
  console.log(chalk.gray(`Current project: ${stats.totalStories} stories, ${stats.totalWords} words\n`));

  const { sessionType } = await inquirer.prompt([
    {
      type: "list",
      name: "sessionType",
      message: "What kind of writing session?",
      choices: [
        { name: "Continue existing story", value: "continue" },
        { name: "Start new story", value: "new" },
        { name: "Writing exercise/prompt", value: "exercise" },
        { name: "Revision session", value: "revise" },
        { name: "Free writing", value: "freewrite" }
      ]
    }
  ]);

  switch (sessionType) {
    case 'continue':
      await continueStorySession();
      break;
    case 'new':
      await newStorySession();
      break;
    case 'exercise':
      await exerciseSession();
      break;
    case 'revise':
      await revisionSession();
      break;
    case 'freewrite':
      await freewriteSession();
      break;
  }

  // End session summary
  const newStats = await getProjectStats();
  const wordsWritten = newStats.totalWords - stats.totalWords;
  if (wordsWritten > 0) {
    console.log(chalk.green.bold(`\n✨ Session complete! You wrote ${wordsWritten} words today.`));
  }
}

async function continueStorySession() {
  const stories = await getIncompleteStories();

  if (stories.length === 0) {
    console.log(chalk.yellow("No incomplete stories found. Starting a new story..."));
    await newStorySession();
    return;
  }

  const { selectedStory } = await inquirer.prompt([
    {
      type: "list",
      name: "selectedStory",
      message: "Which story would you like to continue?",
      choices: stories.map(story => ({
        name: `${story.title} (${story.wordCount || 0} words, ${story.status})`,
        value: story
      }))
    }
  ]);

  const { sessionGoal } = await inquirer.prompt([
    {
      type: "list",
      name: "sessionGoal",
      message: "What's your goal for this session?",
      choices: [
        { name: "Write 250 words", value: { type: "words", target: 250 } },
        { name: "Write 500 words", value: { type: "words", target: 500 } },
        { name: "Write for 25 minutes", value: { type: "time", target: 25 } },
        { name: "Write for 45 minutes", value: { type: "time", target: 45 } },
        { name: "Complete a scene", value: { type: "scene", target: 1 } },
        { name: "Custom goal", value: { type: "custom" } }
      ]
    }
  ]);

  if (sessionGoal.type === "custom") {
    const { customGoal } = await inquirer.prompt([
      {
        type: "input",
        name: "customGoal",
        message: "What's your custom goal for this session?"
      }
    ]);
    sessionGoal.description = customGoal;
  }

  console.log(chalk.blue(`\n🎯 Session Goal: ${getGoalDescription(sessionGoal)}`));
  console.log(chalk.gray(`Opening: ${selectedStory.filePath}`));

  // Create session notes
  await createSessionNotes(selectedStory, sessionGoal);

  // Open the story for editing
  console.log(chalk.green("Happy writing! 🚀"));
}

async function newStorySession() {
  const { storyDetails } = await inquirer.prompt([
    {
      type: "input",
      name: "storyDetails.title",
      message: "Story title:",
      validate: input => input.trim().length > 0 || "Title cannot be empty"
    },
    {
      type: "list",
      name: "storyDetails.template",
      message: "Choose a template:",
      choices: [
        { name: "Basic Short Story", value: "basic" },
        { name: "Flash Fiction", value: "flash" },
        { name: "Character Study", value: "character-study" },
        { name: "Genre Fiction", value: "genre" },
        { name: "Workshop Exercise", value: "workshop" }
      ]
    },
    {
      type: "list",
      name: "storyDetails.length",
      message: "Target length:",
      choices: [
        { name: "Flash (100-1,000 words)", value: "100-1,000 words" },
        { name: "Short (1,000-2,500 words)", value: "1,000-2,500 words" },
        { name: "Standard (2,500-7,500 words)", value: "2,500-7,500 words" },
        { name: "Long (7,500+ words)", value: "7,500+ words" }
      ]
    }
  ]);

  const { sessionGoal } = await inquirer.prompt([
    {
      type: "list",
      name: "sessionGoal",
      message: "Goal for first session:",
      choices: [
        { name: "Complete the outline", value: { type: "outline" } },
        { name: "Write opening paragraph", value: { type: "opening" } },
        { name: "Write 500 words", value: { type: "words", target: 500 } },
        { name: "Write for 30 minutes", value: { type: "time", target: 30 } }
      ]
    }
  ]);

  console.log(chalk.blue("\n📝 Creating your new story..."));

  // This would integrate with the existing new command
  console.log(chalk.green(`✅ Created "${storyDetails.title}"`));
  console.log(chalk.blue(`🎯 Session Goal: ${getGoalDescription(sessionGoal)}`));
}

async function exerciseSession() {
  const exercises = [
    {
      name: "Character Voice Exercise",
      description: "Write the same scene from three different character perspectives",
      timeLimit: 30,
      wordTarget: 400
    },
    {
      name: "Dialogue Only",
      description: "Tell a complete story using only dialogue",
      timeLimit: 20,
      wordTarget: 300
    },
    {
      name: "Single Sentence Story",
      description: "Write a complete story in exactly one sentence",
      timeLimit: 15,
      wordTarget: 50
    },
    {
      name: "Emotion Focus",
      description: "Write a scene that conveys a specific emotion without naming it",
      timeLimit: 25,
      wordTarget: 350
    },
    {
      name: "Setting as Character",
      description: "Write where the setting is so important it becomes a character",
      timeLimit: 30,
      wordTarget: 500
    }
  ];

  const { selectedExercise } = await inquirer.prompt([
    {
      type: "list",
      name: "selectedExercise",
      message: "Choose a writing exercise:",
      choices: exercises.map(ex => ({
        name: `${ex.name} (${ex.timeLimit}min, ~${ex.wordTarget} words)`,
        value: ex
      }))
    }
  ]);

  console.log(chalk.blue.bold(`\n🏋️ Exercise: ${selectedExercise.name}`));
  console.log(chalk.gray(selectedExercise.description));
  console.log(chalk.yellow(`⏱️ Time limit: ${selectedExercise.timeLimit} minutes`));
  console.log(chalk.yellow(`🎯 Target: ${selectedExercise.wordTarget} words`));

  const exerciseFileName = `exercises/exercise-${Date.now()}.md`;
  await createExerciseFile(exerciseFileName, selectedExercise);

  console.log(chalk.green("\n🚀 Exercise file created! Start writing when ready."));
}

async function submissionWorkflow(options) {
  console.log(chalk.purple.bold("📤 Submission Preparation Workflow\n"));

  const completedStories = await getStoriesByStatus(['complete', 'revised']);

  if (completedStories.length === 0) {
    console.log(chalk.yellow("No completed stories found for submission."));
    return;
  }

  const { selectedStory } = await inquirer.prompt([
    {
      type: "list",
      name: "selectedStory",
      message: "Which story are you submitting?",
      choices: completedStories.map(story => ({
        name: `${story.title} (${story.wordCount || 0} words)`,
        value: story
      }))
    }
  ]);

  console.log(chalk.blue.bold(`\n📋 Submission Checklist for "${selectedStory.title}"\n`));

  const checklist = [
    "Story is complete and polished",
    "Grammar and spelling checked",
    "Word count verified",
    "Formatted to standard manuscript format",
    "Publication researched",
    "Submission guidelines reviewed",
    "Cover letter written",
    "Simultaneous submission policy checked"
  ];

  const { completedChecks } = await inquirer.prompt([
    {
      type: "checkbox",
      name: "completedChecks",
      message: "Check off completed items:",
      choices: checklist
    }
  ]);

  const remaining = checklist.filter(item => !completedChecks.includes(item));

  if (remaining.length > 0) {
    console.log(chalk.yellow("\n⚠️ Remaining tasks:"));
    remaining.forEach(task => console.log(chalk.yellow(`  • ${task}`)));
  } else {
    console.log(chalk.green("\n✅ All checklist items complete!"));

    // Create submission-ready version
    await prepareSubmissionFile(selectedStory);

    const { trackSubmission } = await inquirer.prompt([
      {
        type: "confirm",
        name: "trackSubmission",
        message: "Would you like to add this to your submission tracker?",
        default: true
      }
    ]);

    if (trackSubmission) {
      await addToSubmissionTracker(selectedStory);
    }
  }
}

async function revisionWorkflow(options) {
  console.log(chalk.orange.bold("🔧 Revision Workflow\n"));

  const draftStories = await getStoriesByStatus(['drafting', 'complete']);

  if (draftStories.length === 0) {
    console.log(chalk.yellow("No draft stories found for revision."));
    return;
  }

  const { selectedStory } = await inquirer.prompt([
    {
      type: "list",
      name: "selectedStory",
      message: "Which story needs revision?",
      choices: draftStories.map(story => ({
        name: `${story.title} (${story.wordCount || 0} words)`,
        value: story
      }))
    }
  ]);

  const { revisionType } = await inquirer.prompt([
    {
      type: "list",
      name: "revisionType",
      message: "What type of revision?",
      choices: [
        { name: "Structural (plot, pacing, character arcs)", value: "structural" },
        { name: "Line editing (prose, style, flow)", value: "line" },
        { name: "Copy editing (grammar, punctuation)", value: "copy" },
        { name: "Proofreading (final polish)", value: "proof" }
      ]
    }
  ]);

  // Create revision checklist based on type
  const checklists = {
    structural: [
      "Opening hooks the reader",
      "Plot has clear beginning, middle, end",
      "Character motivations are clear",
      "Pacing feels right",
      "Ending is satisfying",
      "Theme comes through naturally"
    ],
    line: [
      "Every sentence serves a purpose",
      "Word choice is precise",
      "Dialogue sounds natural",
      "Show vs tell balance",
      "Transitions between scenes work",
      "Voice is consistent"
    ],
    copy: [
      "Grammar is correct",
      "Punctuation is proper",
      "Spelling is accurate",
      "Tense is consistent",
      "POV is consistent",
      "Formatting is clean"
    ],
    proof: [
      "Read aloud for flow",
      "Check for typos",
      "Verify names/facts are consistent",
      "Format for submission",
      "Final spell check",
      "One last read-through"
    ]
  };

  console.log(chalk.blue.bold(`\n📝 ${revisionType.charAt(0).toUpperCase() + revisionType.slice(1)} Revision Checklist:\n`));

  const checklist = checklists[revisionType];
  checklist.forEach((item, index) => {
    console.log(chalk.gray(`${index + 1}. ${item}`));
  });

  // Create revision notes file
  await createRevisionNotes(selectedStory, revisionType, checklist);

  console.log(chalk.green(`\n✅ Revision notes created for "${selectedStory.title}"`));
  console.log(chalk.blue("🚀 Happy revising!"));
}

async function collectionWorkflow(options) {
  console.log(chalk.magenta.bold("📚 Collection Management Workflow\n"));

  const stories = await getAllStories();

  if (stories.length === 0) {
    console.log(chalk.yellow("No stories found for collection management."));
    return;
  }

  const { action } = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "What would you like to do?",
      choices: [
        { name: "Plan a new collection", value: "plan" },
        { name: "Review collection themes", value: "themes" },
        { name: "Organize existing stories", value: "organize" },
        { name: "Check collection readiness", value: "readiness" }
      ]
    }
  ]);

  switch (action) {
    case 'plan':
      await planNewCollection(stories);
      break;
    case 'themes':
      await reviewCollectionThemes(stories);
      break;
    case 'organize':
      await organizeStories(stories);
      break;
    case 'readiness':
      await checkCollectionReadiness(stories);
      break;
  }
}

async function promptWorkflow(options) {
  console.log(chalk.cyan.bold("💭 Writing Prompt Workflow\n"));

  const prompts = [
    "Write about someone who finds a letter addressed to them from 50 years ago.",
    "Two strangers get stuck in an elevator during a power outage.",
    "A character discovers their reflection is acting independently.",
    "Someone inherits a house that's bigger on the inside than the outside.",
    "Write about the last person on Earth who isn't lonely.",
    "A character can hear everyone's thoughts except one person's.",
    "Someone finds a door in their house that wasn't there yesterday.",
    "Write about a world where lies become visible.",
    "A character remembers a place that never existed.",
    "Someone receives a call from their future self."
  ];

  const { selectedPrompt, timeLimit } = await inquirer.prompt([
    {
      type: "list",
      name: "selectedPrompt",
      message: "Choose a writing prompt:",
      choices: [
        ...prompts.map(prompt => ({ name: prompt, value: prompt })),
        { name: "Random prompt", value: "random" },
        { name: "Custom prompt", value: "custom" }
      ]
    },
    {
      type: "list",
      name: "timeLimit",
      message: "How long do you want to write?",
      choices: [
        { name: "15 minutes (flash fiction)", value: 15 },
        { name: "30 minutes (short piece)", value: 30 },
        { name: "45 minutes (full scene)", value: 45 },
        { name: "60 minutes (complete story)", value: 60 }
      ]
    }
  ]);

  let finalPrompt = selectedPrompt;

  if (selectedPrompt === "random") {
    finalPrompt = prompts[Math.floor(Math.random() * prompts.length)];
  } else if (selectedPrompt === "custom") {
    const { customPrompt } = await inquirer.prompt([
      {
        type: "input",
        name: "customPrompt",
        message: "Enter your custom prompt:",
        validate: input => input.trim().length > 0 || "Prompt cannot be empty"
      }
    ]);
    finalPrompt = customPrompt;
  }

  console.log(chalk.blue.bold(`\n💭 Your Prompt:\n`));
  console.log(chalk.yellow(`"${finalPrompt}"`));
  console.log(chalk.gray(`\n⏱️ Time limit: ${timeLimit} minutes`));

  const promptFileName = `prompts/prompt-${Date.now()}.md`;
  await createPromptFile(promptFileName, finalPrompt, timeLimit);

  console.log(chalk.green("\n🚀 Prompt file created! Start your timer and begin writing."));
}

async function sprintWorkflow(options) {
  console.log(chalk.red.bold("🏃 Writing Sprint Workflow\n"));

  const { sprintType } = await inquirer.prompt([
    {
      type: "list",
      name: "sprintType",
      message: "What kind of sprint?",
      choices: [
        { name: "Pomodoro (25 min write, 5 min break)", value: "pomodoro" },
        { name: "Word Sprint (500 words as fast as possible)", value: "word" },
        { name: "Timed Sprint (custom time)", value: "timed" },
        { name: "Challenge Sprint (specific constraint)", value: "challenge" }
      ]
    }
  ]);

  let sprintConfig = {};

  switch (sprintType) {
    case 'pomodoro':
      sprintConfig = { duration: 25, breaks: true, cycles: 4 };
      break;
    case 'word':
      sprintConfig = { wordTarget: 500, timeLimit: null };
      break;
    case 'timed':
      const { customTime } = await inquirer.prompt([
        {
          type: "number",
          name: "customTime",
          message: "Sprint duration in minutes:",
          default: 15,
          validate: input => input > 0 || "Duration must be positive"
        }
      ]);
      sprintConfig = { duration: customTime };
      break;
    case 'challenge':
      const { constraint } = await inquirer.prompt([
        {
          type: "list",
          name: "constraint",
          message: "Choose your challenge:",
          choices: [
            "Write without using the letter 'e'",
            "Write only in dialogue",
            "Write in second person",
            "Write backwards (end to beginning)",
            "Write using only questions"
          ]
        }
      ]);
      sprintConfig = { constraint, duration: 20 };
      break;
  }

  console.log(chalk.blue.bold("\n🏃 Sprint Configuration:"));
  Object.entries(sprintConfig).forEach(([key, value]) => {
    if (value !== null) {
      console.log(chalk.gray(`  ${key}: ${value}`));
    }
  });

  const sprintFileName = `sprints/sprint-${Date.now()}.md`;
  await createSprintFile(sprintFileName, sprintType, sprintConfig);

  console.log(chalk.green("\n🚀 Sprint file created! Get ready to write fast!"));
}

async function publishWorkflow(options) {
  console.log(chalk.green.bold("📖 Publishing Workflow\n"));

  const submittedStories = await getStoriesByStatus(['submitted', 'accepted']);

  if (submittedStories.length === 0) {
    console.log(chalk.yellow("No submitted stories found."));
    return;
  }

  const { action } = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "What would you like to do?",
      choices: [
        { name: "Update submission status", value: "update" },
        { name: "Prepare for publication", value: "prepare" },
        { name: "Track publication metrics", value: "metrics" },
        { name: "Plan promotional activities", value: "promo" }
      ]
    }
  ]);

  switch (action) {
    case 'update':
      await updateSubmissionStatus(submittedStories);
      break;
    case 'prepare':
      await prepareForPublication(submittedStories);
      break;
    case 'metrics':
      await trackPublicationMetrics(submittedStories);
      break;
    case 'promo':
      await planPromotionalActivities(submittedStories);
      break;
  }
}

async function backupWorkflow(options) {
  console.log(chalk.blue.bold("💾 Backup Workflow\n"));

  const backupDir = `backups/${new Date().toISOString().split('T')[0]}`;

  try {
    await fs.mkdir(backupDir, { recursive: true });

    // Copy all story files
    const storyDirs = ['stories', 'shortstories', 'drafts', 'submission-ready'];
    let fileCount = 0;

    for (const dir of storyDirs) {
      try {
        const files = await fs.readdir(dir);
        await fs.mkdir(path.join(backupDir, dir), { recursive: true });

        for (const file of files) {
          if (file.endsWith('.md')) {
            await fs.copyFile(
              path.join(dir, file),
              path.join(backupDir, dir, file)
            );
            fileCount++;
          }
        }
      } catch (error) {
        // Directory might not exist
      }
    }

    // Copy config and important files
    try {
      await fs.copyFile('writers.config.json', path.join(backupDir, 'writers.config.json'));
      await fs.copyFile('README.md', path.join(backupDir, 'README.md'));
    } catch (error) {
      // Files might not exist
    }

    console.log(chalk.green(`✅ Backup complete! ${fileCount} files backed up to ${backupDir}`));

  } catch (error) {
    console.error(chalk.red("❌ Backup failed:"), error.message);
  }
}

// Helper functions

async function getProjectStats() {
  // This would integrate with existing stats functionality
  return {
    totalStories: 0,
    totalWords: 0,
    storiesByStatus: {}
  };
}

async function getIncompleteStories() {
  // Mock implementation - would integrate with existing story management
  return [];
}

async function getStoriesByStatus(statuses) {
  // Mock implementation
  return [];
}

async function getAllStories() {
  // Mock implementation
  return [];
}

function getGoalDescription(goal) {
  switch (goal.type) {
    case 'words':
      return `Write ${goal.target} words`;
    case 'time':
      return `Write for ${goal.target} minutes`;
    case 'scene':
      return `Complete ${goal.target} scene(s)`;
    case 'outline':
      return `Complete the story outline`;
    case 'opening':
      return `Write the opening paragraph`;
    case 'custom':
      return goal.description;
    default:
      return 'Complete the session';
  }
}

async function createSessionNotes(story, goal) {
  const notesDir = 'session-notes';
  await fs.mkdir(notesDir, { recursive: true });

  const notesFile = path.join(notesDir, `session-${Date.now()}.md`);
  const content = `# Writing Session Notes

**Date:** ${new Date().toLocaleDateString()}
**Story:** ${story.title}
**Goal:** ${getGoalDescription(goal)}

## Pre-writing Notes
[What do you want to accomplish in this session?]

## Progress Notes
[Track your progress as you write]

## Post-writing Reflection
[How did the session go? What worked? What didn't?]

## Next Session
[What should you focus on next time?]
`;

  await fs.writeFile(notesFile, content);
}

async function createExerciseFile(fileName, exercise) {
  await fs.mkdir(path.dirname(fileName), { recursive: true });

  const content = `# Writing Exercise: ${exercise.name}

**Date:** ${new Date().toLocaleDateString()}
**Time Limit:** ${exercise.timeLimit} minutes
**Word Target:** ${exercise.wordTarget} words

## Exercise Description
${exercise.description}

## Your Response
[Start writing here...]

## Reflection
[What did you learn from this exercise?]
`;

  await fs.writeFile(fileName, content);
}

async function createPromptFile(fileName, prompt, timeLimit) {
  await fs.mkdir(path.dirname(fileName), { recursive: true });

  const content = `# Prompt Response

**Date:** ${new Date().toLocaleDateString()}
**Time Limit:** ${timeLimit} minutes

## Prompt
"${prompt}"

## Your Story
[Start writing here...]

## Notes
[Any thoughts about the prompt or your response?]
`;

  await fs.writeFile(fileName, content);
}

async function createSprintFile(fileName, sprintType, config) {
  await fs.mkdir(path.dirname(fileName), { recursive: true });

  const content = `# Writing Sprint: ${sprintType}

**Date:** ${new Date().toLocaleDateString()}
**Configuration:** ${JSON.stringify(config, null, 2)}

## Sprint Goal
[What are you trying to accomplish?]

## Your Writing
[Start your sprint here...]

## Sprint Results
**Words written:**
**Time taken:**
**What worked:**
**What didn't:**
`;

  await fs.writeFile(fileName, content);
}

async function createRevisionNotes(story, revisionType, checklist) {
  const notesDir = 'revision-notes';
  await fs.mkdir(notesDir, { recursive: true });

  const notesFile = path.join(notesDir, `${story.title.toLowerCase().replace(/\s+/g, '-')}-${revisionType}.md`);
  const content = `# Revision Notes: ${story.title}

**Date:** ${new Date().toLocaleDateString()}
**Revision Type:** ${revisionType}

## Checklist
${checklist.map(item => `- [ ] ${item}`).join('\n')}

## Issues Found
[List specific problems to address]

## Changes Made
[Track your revisions]

## Notes for Next Revision
[What should you focus on in the next pass?]
`;

  await fs.writeFile(notesFile, content);
}

async function prepareSubmissionFile(story) {
  // Mock implementation
  console.log(chalk.gray(`Preparing submission file for ${story.title}...`));
}

async function addToSubmissionTracker(story) {
  // Mock implementation
  console.log(chalk.gray(`Adding ${story.title} to submission tracker...`));
}

// Additional helper functions would be implemented here...

function showWorkflowHelp() {
  console.log(chalk.blue.bold("\n🔄 Available Workflows\n"));

  console.log(chalk.bold("Writing Workflows:"));
  console.log("  daily       - Daily writing session with goals and tracking");
  console.log("  prompt      - Writing prompt session with timer");
  console.log("  sprint      - Fast writing sessions with constraints");

  console.log(chalk.bold("\nRevision Workflows:"));
  console.log("  revision    - Structured revision process");

  console.log(chalk.bold("\nSubmission Workflows:"));
  console.log("  submission  - Prepare stories for submission");
  console.log("  publish     - Manage publication process");

  console.log(chalk.bold("\nOrganization Workflows:"));
  console.log("  collection  - Manage story collections");
  console.log("  backup      - Create project backups");

  console.log(chalk.bold("\nExamples:"));
  console.log(chalk.cyan("  writers workflow daily"));
  console.log(chalk.cyan("  writers workflow submission"));
  console.log(chalk.cyan("  writers workflow sprint"));
}

module.exports = workflowCommand;
