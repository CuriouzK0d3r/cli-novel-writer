const chalk = require("chalk");
const inquirer = require("inquirer");
const projectManager = require("../utils/project");

async function newCommand(type, name, options) {
  // Fix Commander.js argument shifting when [name] is omitted
  if (typeof name === "object" && name !== null && !Array.isArray(name)) {
    options = name;
    name = undefined;
  }
  try {
    // Check if in a writers project
    if (!projectManager.isWritersProject()) {
      console.log(
        chalk.red(
          '❌ Not a Writers project. Run "writers init" to initialize.',
        ),
      );
      return;
    }

    console.log(chalk.blue.bold(`\n📝 Creating new ${type}...\n`));

    // Validate type
    const validTypes = ["chapter", "scene", "character", "note", "shortstory"];
    if (!validTypes.includes(type)) {
      console.log(chalk.red(`❌ Invalid type: ${type}`));
      console.log(chalk.yellow(`Valid types: ${validTypes.join(", ")}`));
      return;
    }

    // Get name if not provided
    if (!name) {
      const { itemName } = await inquirer.prompt([
        {
          type: "input",
          name: "itemName",
          message: `What is the name of this ${type}?`,
          validate: (input) => {
            if (input.trim().length === 0) {
              return `${type} name cannot be empty`;
            }
            return true;
          },
        },
      ]);
      name = itemName;
    }

    // Pluralize type for directory mapping
    const typeMap = {
      chapter: "chapters",
      scene: "scenes",
      character: "characters",
      note: "notes",
      shortstory: "shortstories",
    };

    const pluralType = typeMap[type];

    // Check if using template
    let template = "";
    if (options.template) {
      template = await getTemplate(options.template, type, name);
    } else {
      // Ask if user wants to use a template
      const { useTemplate } = await inquirer.prompt([
        {
          type: "confirm",
          name: "useTemplate",
          message: `Would you like to use a template for this ${type}?`,
          default: true,
        },
      ]);

      if (useTemplate) {
        const templateChoice = await selectTemplate(type);
        if (templateChoice) {
          template = await getTemplate(templateChoice, type, name);
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
        type: "confirm",
        name: "startWriting",
        message: `Would you like to start writing in this ${type} now?`,
        default: true,
      },
    ]);

    if (startWriting) {
      const writeCommand = require("./write");
      await writeCommand(result.name.toLowerCase().replace(/\s+/g, "-"), {});
    } else {
      console.log(
        chalk.blue(
          `\n💡 To start writing: ${chalk.yellow(`writers write ${result.name.toLowerCase().replace(/\s+/g, "-")}`)}`,
        ),
      );
    }
  } catch (error) {
    if (error.message.includes("already exists")) {
      console.log(chalk.yellow(`⚠️  ${error.message}`));

      const { overwrite } = await inquirer.prompt([
        {
          type: "confirm",
          name: "overwrite",
          message: "Would you like to overwrite it?",
          default: false,
        },
      ]);

      if (overwrite) {
        // TODO: Implement overwrite functionality
        console.log(
          chalk.gray(
            "Overwrite functionality coming soon. Please use a different name for now.",
          ),
        );
      }
    } else {
      console.error(chalk.red("❌ Error creating new item:"), error.message);
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
      type: "list",
      name: "template",
      message: `Select a template for your ${type}:`,
      choices: [...templates, { name: "None (use default)", value: null }],
    },
  ]);

  return template;
}

function getAvailableTemplates(type) {
  const templates = {
    chapter: [
      { name: "Basic Chapter", value: "basic" },
      { name: "Action Scene", value: "action" },
      { name: "Dialogue Heavy", value: "dialogue" },
      { name: "Flashback", value: "flashback" },
    ],
    scene: [
      { name: "Basic Scene", value: "basic" },
      { name: "Conflict Scene", value: "conflict" },
      { name: "Romance Scene", value: "romance" },
      { name: "Setting Description", value: "setting" },
    ],
    character: [
      { name: "Protagonist", value: "protagonist" },
      { name: "Antagonist", value: "antagonist" },
      { name: "Supporting Character", value: "supporting" },
      { name: "Minor Character", value: "minor" },
    ],
    note: [
      { name: "Plot Note", value: "plot" },
      { name: "Research Note", value: "research" },
      { name: "World Building", value: "worldbuilding" },
      { name: "Timeline", value: "timeline" },
    ],
    shortstory: [
      { name: "Basic Short Story", value: "basic" },
      { name: "Character Study", value: "character-study" },
      { name: "Twist Ending", value: "twist" },
      { name: "Flash Fiction", value: "flash" },
      { name: "Literary Fiction", value: "literary" },
      { name: "Genre Story", value: "genre" },
    ],
  };

  return templates[type] || [];
}

async function getTemplate(templateName, type, name) {
  const templates = {
    // Chapter templates
    action: `# {TITLE}

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

    dialogue: `# {TITLE}

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

    flashback: `# {TITLE}

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
    conflict: `# {TITLE}

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

    romance: `# {TITLE}

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

    setting: `# {TITLE}

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
    protagonist: `# {TITLE}

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

    antagonist: `# {TITLE}

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
    plot: `# Plot Note: {TITLE}

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

    // Short story templates
    "character-study": `# {TITLE}

*Created: {DATE}*

---

## Story Information
- **Genre:** Character Study
- **Target Length:** 2,000-5,000 words
- **Theme:** Character development and internal journey
- **Setting:**

## Character Focus
**Main Character:**
- **Name:**
- **Age:**
- **Background:**
- **Internal Conflict:**
- **What they want:**
- **What they need:**

## Story Structure
- **Opening:** Introduce character in their normal world
- **Inciting Incident:** Something disrupts their routine
- **Internal Journey:** Character grapples with change/realization
- **Revelation:** Character discovers something about themselves
- **Resolution:** How the character has changed

## Key Scenes
1. **Character Introduction:** Show who they are
2. **Moment of Change:** The turning point
3. **Internal Struggle:** Character wrestling with decisions
4. **Resolution:** New understanding or acceptance

---

## Story Content

She had always believed that routine was safety...

`,

    twist: `# {TITLE}

*Created: {DATE}*

---

## Story Information
- **Genre:** Twist/Surprise Ending
- **Target Length:** 1,500-3,000 words
- **Theme:**
- **Setting:**

## Twist Planning
**The Reveal:** What is the surprise?

**Misdirection:** How do you lead readers away from the truth?

**Clues:** What hints do you plant? (subtle enough to miss first time)
-
-
-

**Foreshadowing:** What seems innocent but gains new meaning after the twist?
-
-
-

## Story Structure
- **Setup:** Establish the "normal" situation
- **Misdirection:** Plant false clues
- **Build Tension:** Increase stakes
- **The Twist:** The revelation
- **Recontextualization:** Show how everything changes

## Revision Notes
- Check that clues are present but not obvious
- Ensure twist is fair (readers could figure it out)
- Make sure story works even knowing the twist

---

## Story Content

Everything seemed perfectly ordinary that Tuesday morning...

`,

    flash: `# {TITLE}

*Created: {DATE}*

---

## Story Information
- **Genre:** Flash Fiction
- **Target Length:** 100-1,000 words
- **Theme:**
- **Setting:**

## Flash Fiction Focus
**Single Moment:** What specific moment are you capturing?

**Emotional Core:** What feeling drives this piece?

**Compression:** What's the essence that must be preserved?

## Structure (Very Tight)
- **Opening:** Drop reader directly into the moment
- **Development:** Minimal but essential details
- **Impact:** Strong emotional or intellectual punch
- **Ending:** Resonant final image or thought

## Constraints
- Every word must earn its place
- Start as close to the end as possible
- One central image or metaphor
- Leave room for reader interpretation

---

## Story Content

The photograph fell from the book like a pressed flower...

`,

    literary: `# {TITLE}

*Created: {DATE}*

---

## Story Information
- **Genre:** Literary Fiction
- **Target Length:** 3,000-7,000 words
- **Theme:**
- **Setting:**

## Literary Elements
**Central Theme:** What universal human experience are you exploring?

**Symbolism:** What objects/images carry deeper meaning?
-
-
-

**Style:** What narrative voice and tone serve the story?

**Language:** What specific word choices enhance meaning?

## Character Development
**Protagonist:**
- **External journey:**
- **Internal journey:**
- **Character arc:**

**Supporting Characters:** How do they illuminate the protagonist?

## Story Structure
- **Opening:** Establish voice and mood
- **Rising Action:** Develop character and theme
- **Climax:** Moment of truth or realization
- **Resolution:** Changed understanding

## Themes to Explore
- Relationships and connection
- Identity and belonging
- Memory and time
- Love and loss
- Meaning and purpose

---

## Story Content

In the amber light of late afternoon, she understood...

`,

    genre: `# {TITLE}

*Created: {DATE}*

---

## Story Information
- **Genre:**
- **Subgenre:**
- **Target Length:** 3,000-6,000 words
- **Setting:**

## Genre Elements
**Tropes to Use:**
-
-
-

**Tropes to Subvert:**
-
-
-

**World Building:** What makes this world unique?

**Genre Expectations:** What do readers expect? How will you deliver/surprise?

## Plot Structure
- **Hook:** Grab attention with genre-appropriate opening
- **World Establishment:** Show the rules of this world
- **Conflict:** Central problem that fits the genre
- **Escalation:** Raise stakes according to genre conventions
- **Climax:** Satisfying genre payoff
- **Resolution:** Tie up loose ends appropriately

## Research/Consistency
**Genre Rules:**
-
-
-

**Technical Details to Get Right:**
-
-
-

---

## Story Content

The signal came from deep space at exactly 3:33 AM...

`,

    research: `# Research Note: {TITLE}

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

    worldbuilding: `# World Building: {TITLE}

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


`,
  };

  let template = templates[templateName] || "";

  // Replace placeholders
  const timestamp = new Date().toISOString().split("T")[0];
  template = template.replace(/{DATE}/g, timestamp);
  template = template.replace(/{TITLE}/g, name || "Untitled");

  return template;
}

module.exports = newCommand;
