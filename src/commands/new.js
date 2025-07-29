const chalk = require('chalk');
const inquirer = require('inquirer');
const projectManager = require('../utils/project');

async function newCommand(type, name, options) {
  try {
    // Check if in a writers project
    if (!projectManager.isWritersProject()) {
      console.log(chalk.red('❌ Not a Writers project. Run "writers init" to initialize.'));
      return;
    }

    console.log(chalk.blue.bold(`\n📝 Creating new ${type}...\n`));

    // Validate type
    const validTypes = ['chapter', 'scene', 'character', 'note'];
    if (!validTypes.includes(type)) {
      console.log(chalk.red(`❌ Invalid type: ${type}`));
      console.log(chalk.yellow(`Valid types: ${validTypes.join(', ')}`));
      return;
    }

    // Get name if not provided
    if (!name) {
      const { itemName } = await inquirer.prompt([
        {
          type: 'input',
          name: 'itemName',
          message: `What is the name of this ${type}?`,
          validate: (input) => {
            if (input.trim().length === 0) {
              return `${type} name cannot be empty`;
            }
            return true;
          }
        }
      ]);
      name = itemName;
    }

    // Pluralize type for directory mapping
    const typeMap = {
      'chapter': 'chapters',
      'scene': 'scenes',
      'character': 'characters',
      'note': 'notes'
    };

    const pluralType = typeMap[type];

    // Check if using template
    let template = '';
    if (options.template) {
      template = await getTemplate(options.template, type);
    } else {
      // Ask if user wants to use a template
      const { useTemplate } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'useTemplate',
          message: `Would you like to use a template for this ${type}?`,
          default: true
        }
      ]);

      if (useTemplate) {
        const templateChoice = await selectTemplate(type);
        if (templateChoice) {
          template = await getTemplate(templateChoice, type);
        }
      }
    }

    // Create the file
    const result = await projectManager.createFile(pluralType, name, template);

    console.log(chalk.green(`✅ Created ${type}: ${chalk.bold(result.name)}`));
    console.log(chalk.gray(`   Path: ${result.path}`));

    // Ask if user wants to start writing immediately
    const { startWriting } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'startWriting',
        message: `Would you like to start writing in this ${type} now?`,
        default: true
      }
    ]);

    if (startWriting) {
      const writeCommand = require('./write');
      await writeCommand(result.name.toLowerCase().replace(/\s+/g, '-'));
    } else {
      console.log(chalk.blue(`\n💡 To start writing: ${chalk.yellow(`writers write ${result.name.toLowerCase().replace(/\s+/g, '-')}`)}`));
    }

  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log(chalk.yellow(`⚠️  ${error.message}`));

      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: 'Would you like to overwrite it?',
          default: false
        }
      ]);

      if (overwrite) {
        // TODO: Implement overwrite functionality
        console.log(chalk.gray('Overwrite functionality coming soon. Please use a different name for now.'));
      }
    } else {
      console.error(chalk.red('❌ Error creating new item:'), error.message);
    }
  }
}

async function selectTemplate(type) {
  const templates = getAvailableTemplates(type);

  if (templates.length === 0) {
    return null;
  }

  const { template } = await inquirer.prompt([
    {
      type: 'list',
      name: 'template',
      message: `Select a template for your ${type}:`,
      choices: [
        ...templates,
        { name: 'None (use default)', value: null }
      ]
    }
  ]);

  return template;
}

function getAvailableTemplates(type) {
  const templates = {
    chapter: [
      { name: 'Basic Chapter', value: 'basic' },
      { name: 'Action Scene', value: 'action' },
      { name: 'Dialogue Heavy', value: 'dialogue' },
      { name: 'Flashback', value: 'flashback' }
    ],
    scene: [
      { name: 'Basic Scene', value: 'basic' },
      { name: 'Conflict Scene', value: 'conflict' },
      { name: 'Romance Scene', value: 'romance' },
      { name: 'Setting Description', value: 'setting' }
    ],
    character: [
      { name: 'Protagonist', value: 'protagonist' },
      { name: 'Antagonist', value: 'antagonist' },
      { name: 'Supporting Character', value: 'supporting' },
      { name: 'Minor Character', value: 'minor' }
    ],
    note: [
      { name: 'Plot Note', value: 'plot' },
      { name: 'Research Note', value: 'research' },
      { name: 'World Building', value: 'worldbuilding' },
      { name: 'Timeline', value: 'timeline' }
    ]
  };

  return templates[type] || [];
}

async function getTemplate(templateName, type) {
  const templates = {
    // Chapter templates
    'action': `# {TITLE}

*Created: {DATE}*

---

## Chapter Summary
High-energy chapter with action sequence

## Key Elements
- **Conflict:**
- **Stakes:**
- **Pacing:** Fast
- **Mood:** Tense/Exciting

## Scene Breakdown
1. **Opening:** Set the scene, establish tension
2. **Rising Action:** Build to the main conflict
3. **Climax:** Peak action moment
4. **Resolution:** Immediate aftermath

---

## Content

The tension in the air was palpable as...

`,

    'dialogue': `# {TITLE}

*Created: {DATE}*

---

## Chapter Summary
Character-driven chapter focused on dialogue and relationships

## Key Elements
- **Main Characters:**
- **Relationship Dynamic:**
- **Conflict/Tension:**
- **Character Development:**

## Dialogue Notes
- Character voices and speech patterns
- Subtext and hidden meanings
- Emotional undertones

---

## Content

"We need to talk," she said, her voice barely above a whisper...

`,

    'flashback': `# {TITLE}

*Created: {DATE}*

---

## Chapter Summary
Explores past events that inform the present story

## Key Elements
- **Timeline:** When this occurred
- **Perspective:** Who is remembering
- **Relevance:** How this connects to current events
- **Emotional Impact:** What this reveals

## Transition Notes
- How to enter the flashback
- How to return to present
- Formatting/style differences

---

## Content

*Three years earlier...*

The memory came flooding back as if it were yesterday...

`,

    // Scene templates
    'conflict': `# {TITLE}

*Created: {DATE}*

**Setting:**
**Characters:**
**Purpose:** Develop/reveal conflict

---

## Conflict Elements
- **Type:** Internal/External/Interpersonal
- **Stakes:** What's at risk
- **Obstacles:** What stands in the way
- **Resolution:** How it ends (victory/defeat/stalemate)

## Character Motivations
- **Character A wants:**
- **Character B wants:**
- **Why they can't both have it:**

---

The disagreement had been simmering for weeks, but now it erupted...

`,

    'romance': `# {TITLE}

*Created: {DATE}*

**Setting:**
**Characters:**
**Purpose:** Develop romantic tension/relationship

---

## Romance Elements
- **Relationship Stage:** First meeting/developing/established
- **Emotional Beat:** Attraction/conflict/intimacy/separation
- **Obstacles:** What's keeping them apart
- **Chemistry:** How attraction manifests

## Sensory Details
- **Sight:**
- **Sound:**
- **Touch:**
- **Emotion:**

---

Their eyes met across the crowded room...

`,

    'setting': `# {TITLE}

*Created: {DATE}*

**Location:**
**Time Period:**
**Purpose:** Establish atmosphere and world

---

## Setting Details
- **Physical Description:**
- **Atmosphere/Mood:**
- **Historical Context:**
- **Cultural Elements:**

## Sensory Descriptions
- **Visual:** Colors, lighting, architecture
- **Audio:** Sounds, music, voices
- **Smell:** Scents that define the space
- **Texture:** Physical sensations
- **Taste:** If relevant

## Story Function
- How does this setting serve the plot?
- What does it reveal about characters?
- How does it affect mood?

---

The ancient city sprawled before them like a forgotten dream...

`,

    // Character templates
    'protagonist': `# {TITLE}

*Created: {DATE}*

---

## Basic Information
- **Full Name:**
- **Age:**
- **Occupation:**
- **Location:**

## Physical Description
- **Height/Build:**
- **Hair/Eyes:**
- **Distinguishing Features:**
- **Style/Clothing:**

## Personality Core
- **Greatest Strength:**
- **Fatal Flaw:**
- **Deepest Fear:**
- **Driving Motivation:**

## Background
- **Childhood:** Key formative events
- **Education:**
- **Career Path:**
- **Relationships:** Family, friends, romantic

## Character Arc
- **Starting Point:** Where they begin the story
- **Growth Challenge:** What they must overcome
- **Change:** How they transform
- **Ending Point:** Where they finish

## Role in Story
- **Plot Function:** How they drive the story forward
- **Theme Connection:** What they represent
- **Conflict Source:** Internal and external struggles

## Voice and Dialogue
- **Speech Patterns:**
- **Vocabulary Level:**
- **Accent/Dialect:**
- **Catchphrases:**

## Additional Notes
Character development ideas and inspirations...

`,

    'antagonist': `# {TITLE}

*Created: {DATE}*

---

## Basic Information
- **Full Name:**
- **Age:**
- **Occupation:**
- **Location:**

## Physical Description
- **Appearance:**
- **Intimidation Factor:**
- **Memorable Features:**

## Psychology
- **Core Motivation:** What drives them
- **Justification:** Why they believe they're right
- **Methods:** How they achieve their goals
- **Weaknesses:** What can be exploited

## Background
- **Origin Story:** How they became antagonistic
- **Key Events:** Moments that shaped them
- **Relationships:** Allies and enemies
- **Resources:** What power/influence they have

## Antagonistic Role
- **Conflict Type:** Direct opposition/indirect/internal
- **Methods:** Physical/psychological/social/political
- **Stakes:** What they want to achieve/prevent
- **Escalation:** How conflict intensifies

## Relationship to Protagonist
- **Connection:** How they know each other
- **History:** Past interactions
- **Emotional Charge:** Personal vs impersonal conflict
- **Mirror Effect:** How they reflect protagonist's flaws

## Redemption Potential
- **Redeemable?** Can they change?
- **Path to Redemption:** What would it take?
- **Cost:** What would they have to sacrifice?

## Additional Notes
Complex motivations and development ideas...

`,

    // Note templates
    'plot': `# Plot Note: {TITLE}

*Created: {DATE}*

---

## Plot Point Type
- [ ] Setup/Introduction
- [ ] Inciting Incident
- [ ] Plot Point 1
- [ ] Midpoint
- [ ] Plot Point 2
- [ ] Climax
- [ ] Resolution

## Details
**What Happens:**

**Why It Matters:**

**Characters Involved:**

**Setting:**

## Cause and Effect
**What Led to This:**

**What This Leads To:**

## Foreshadowing
**What to Plant Earlier:**

**Payoff:**

## Research Needed
- [ ]
- [ ]
- [ ]

## Additional Notes


`,

    'research': `# Research Note: {TITLE}

*Created: {DATE}*

---

## Topic
**Subject:**

**Relevance to Story:**

## Sources
1.
2.
3.

## Key Facts
-
-
-

## Story Applications
**How This Affects Plot:**

**Character Implications:**

**Setting Details:**

## Questions to Explore
-
-
-

## Further Research Needed
- [ ]
- [ ]
- [ ]

## Notes


`,

    'worldbuilding': `# World Building: {TITLE}

*Created: {DATE}*

---

## World Element
**Type:** Geography/Culture/Politics/Magic System/Technology/Other

## Description


## Rules and Limitations
-
-
-

## History/Origin
**How It Came to Be:**

**Key Historical Events:**

## Current State
**Present Day Status:**

**Who Controls It:**

**How It's Viewed:**

## Story Impact
**Plot Relevance:**

**Character Connections:**

**Conflict Potential:**

## Consistency Notes
**Rules to Remember:**

**Contradictions to Avoid:**

## Development Ideas


`
  };

  let template = templates[templateName] || '';

  // Replace placeholders
  const timestamp = new Date().toISOString().split('T')[0];
  template = template.replace(/{DATE}/g, timestamp);
  template = template.replace(/{TITLE}/g, name || 'Untitled');

  return template;
}

module.exports = newCommand;
