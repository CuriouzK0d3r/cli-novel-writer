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
    const validTypes = [
      "chapter",
      "scene",
      "character",
      "note",
      "shortstory",
      "blogpost",
    ];
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
      blogpost: "drafts",
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
    blogpost: [
      { name: "General Blog Post", value: "general" },
      { name: "Tutorial/How-To", value: "tutorial" },
      { name: "Product Review", value: "review" },
      { name: "Personal Story", value: "personal" },
      { name: "Top 10 List", value: "listicle" },
      { name: "Step-by-Step Guide", value: "howto" },
      { name: "News Analysis", value: "news" },
      { name: "Interview", value: "interview" },
      { name: "Opinion Piece", value: "opinion" },
      { name: "Technical Deep Dive", value: "technical" },
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

    // Blog post templates
    general: `---
title: "{TITLE}"
date: {DATE}
author: {AUTHOR}
category: "general"
tags: ["blog", "writing"]
excerpt: "A compelling excerpt that summarizes your post and encourages readers to continue."
published: false
slug: "{SLUG}"
featuredImage: ""
---

# {TITLE}

## Introduction

Start with a hook that grabs your reader's attention. This could be a question, a surprising fact, or a relatable scenario.

## Main Content

### Key Point 1

Develop your first main idea here. Use clear, concise language and provide examples or evidence to support your points.

### Key Point 2

Continue with your second main point. Remember to:

- Use bullet points for clarity
- Include relevant examples
- Keep paragraphs focused and readable
- Link to authoritative sources when appropriate

### Key Point 3

Your third main point completes your argument or narrative. Consider including:

1. Step-by-step instructions if applicable
2. Personal anecdotes that illustrate your point
3. Data or research that supports your claims

## Conclusion

Summarize your key points and provide a clear takeaway for your readers. End with a call-to-action or thought-provoking question.

---

*What are your thoughts on this topic? Share your experiences in the comments below.*
`,

    tutorial: `---
title: "How to {TITLE}: A Step-by-Step Guide"
date: {DATE}
author: {AUTHOR}
category: "tutorials"
tags: ["tutorial", "guide", "how-to"]
excerpt: "Learn how to accomplish {TITLE} with this comprehensive step-by-step guide."
published: false
slug: "{SLUG}"
difficulty: "beginner"
estimatedTime: "30 minutes"
---

# How to {TITLE}: A Step-by-Step Guide

## What You'll Learn

By the end of this tutorial, you'll be able to:

- [ ] Accomplish the main objective
- [ ] Understand the key concepts
- [ ] Apply the techniques in your own projects

## Prerequisites

Before starting this tutorial, you should have:

- Basic knowledge of [relevant topic]
- [Required software/tools] installed
- [Any other requirements]

## Step 1: [First Step Title]

Detailed explanation of the first step.

\`\`\`code
// Include relevant code examples
example.code();
\`\`\`

**Expected result:** Describe what should happen after completing this step.

## Step 2: [Second Step Title]

Continue with clear, actionable instructions.

### Troubleshooting

If you encounter issues:
- **Problem:** Common issue description
- **Solution:** How to fix it

## Step 3: [Third Step Title]

Keep building on previous steps.

![Screenshot or diagram](../assets/images/tutorial-step3.png)

## Testing Your Work

How to verify that everything is working correctly:

1. Test step 1
2. Test step 2
3. Expected final result

## Next Steps

Now that you've completed this tutorial, consider:

- Exploring [related topic]
- Trying [advanced variation]
- Reading [related tutorial]

## Conclusion

Recap what was accomplished and encourage readers to experiment further.

---

*Did this tutorial help you? Let me know in the comments or share your results!*
`,

    review: `---
title: "{TITLE} Review: An Honest Assessment"
date: {DATE}
author: {AUTHOR}
category: "reviews"
tags: ["review", "product", "recommendation"]
excerpt: "An honest, in-depth review of {TITLE} covering features, pros, cons, and whether it's worth your money."
published: false
slug: "{SLUG}"
rating: "4/5"
affiliate: false
---

# {TITLE} Review: An Honest Assessment

## Quick Summary

**Rating:** ⭐⭐⭐⭐☆ (4/5)
**Price:** $XX.XX
**Best for:** [Target audience]
**Bottom line:** [One sentence verdict]

## What Is [Product/Service]?

Brief overview of what you're reviewing, who makes it, and what problem it solves.

## Key Features

### Feature 1: [Name]
Description and assessment of this feature.

### Feature 2: [Name]
How this feature works and its effectiveness.

### Feature 3: [Name]
Your experience with this particular aspect.

## Pros and Cons

### What I Loved ✅

- **Specific benefit:** Why this matters
- **Another strength:** Real-world impact
- **Third positive:** How it helped you

### What Could Be Better ❌

- **Limitation:** Why this is problematic
- **Missing feature:** What you wish it had
- **Minor issue:** Small but notable problem

## Final Verdict

Overall assessment and recommendation. Would you buy it again? Would you recommend it to others?

**Value Rating:** [X/5]
**Quality Rating:** [X/5]
**Ease of Use:** [X/5]

---

*Have you tried [product/service]? Share your experience in the comments below!*

**Disclosure:** [Include any affiliate relationships or how you obtained the product]
`,

    personal: `---
title: "{TITLE}"
date: {DATE}
author: {AUTHOR}
category: "personal"
tags: ["personal", "reflection", "life"]
excerpt: "Personal thoughts and reflections on {TITLE} and what I've learned along the way."
published: false
slug: "{SLUG}"
mood: "reflective"
---

# {TITLE}

## Setting the Scene

Paint a picture of the context - where you were, what was happening, what led to this reflection.

## The Experience

### What Happened

Tell your story with vivid details. Help readers feel like they were there with you.

### My Initial Reaction

How did you feel in the moment? What were your immediate thoughts?

### Looking Back

With the benefit of hindsight, how do you view the experience now?

## Lessons Learned

### Insight 1: [Key Learning]

Explain what you discovered about yourself, life, or the world.

### Insight 2: [Another Realization]

Share how this experience changed your perspective.

### Insight 3: [Practical Wisdom]

What practical advice would you give to others in similar situations?

## How It Changed Me

Describe the lasting impact this experience has had on your:
- **Mindset:** How you think about things
- **Behavior:** What you do differently
- **Relationships:** How you interact with others
- **Goals:** What you're working toward

## Final Thoughts

Wrap up with your current perspective and perhaps pose a thoughtful question to readers.

---

*Have you had a similar experience? I'd love to hear your story in the comments.*
`,

    listicle: `---
title: "X Essential {TITLE} Every [Person] Should Know"
date: {DATE}
author: {AUTHOR}
category: "lists"
tags: ["list", "tips", "guide"]
excerpt: "A curated list of the most important {TITLE} that every [person] should know."
published: false
slug: "{SLUG}"
listType: "numbered"
---

# X Essential {TITLE} Every [Person] Should Know

## Introduction

Brief introduction explaining why this list matters and who it's for.

## 1. [First Item Title]

**Why it matters:** Explain the importance of this item.

**Key details:** Provide specific information, tips, or examples.

**Action step:** What should readers do with this information?

## 2. [Second Item Title]

**The concept:** Clearly explain what this is.

**Real-world application:** How to use this in practice.

**Pro tip:** An advanced insight or lesser-known aspect.

## 3. [Third Item Title]

**Background:** Context that helps readers understand.

**Implementation:** Step-by-step guidance if applicable.

**Common mistakes:** What to avoid.

## 4. [Fourth Item Title]

**The basics:** Fundamental information everyone should know.

**Going deeper:** Advanced considerations for those ready.

**Resources:** Where to learn more.

## 5. [Fifth Item Title]

**Quick overview:** Summarize the key point.

**Why people miss this:** Common oversight or misconception.

**Simple start:** Easy first step to implement.

## Quick Reference

For easy scanning, here's the complete list:

1. [Item 1 summary]
2. [Item 2 summary]
3. [Item 3 summary]
4. [Item 4 summary]
5. [Item 5 summary]

## Conclusion

Tie everything together and encourage readers to take action on what they've learned.

---

*Which of these resonated most with you? Let me know in the comments!*
`,

    howto: `---
title: "How to {TITLE} in [Timeframe]"
date: {DATE}
author: {AUTHOR}
category: "how-to"
tags: ["how-to", "guide", "tips"]
excerpt: "A practical guide showing you exactly how to {TITLE} with proven strategies and actionable steps."
published: false
slug: "{SLUG}"
difficulty: "intermediate"
timeRequired: "X hours/days/weeks"
---

# How to {TITLE} in [Timeframe]

## What You'll Achieve

By following this guide, you'll:
- Accomplish [main goal]
- Learn [key skill/knowledge]
- Avoid [common pitfall]
- Save [time/money/effort]

## Before You Start

### What You'll Need
- [ ] [Requirement 1]
- [ ] [Requirement 2]
- [ ] [Requirement 3]

### Time Investment
- **Total time:** [X hours/days]
- **Daily commitment:** [X minutes/hours]
- **When to do it:** [Best timing]

## The Complete Process

### Phase 1: [Preparation/Setup]

**Goal:** Set yourself up for success

1. **[Specific action]**
   - Why: [Reasoning]
   - How: [Detailed steps]
   - Tips: [Helpful hints]

2. **[Second action]**
   - What to expect: [Realistic expectations]
   - Common issues: [How to handle them]

### Phase 2: [Implementation/Action]

**Goal:** Execute the main strategy

3. **[Core action item]**
   - Step-by-step process
   - Best practices
   - Quality checkpoints

4. **[Supporting action]**
   - How this reinforces the main goal
   - Timing considerations

## Measuring Your Success

Track these metrics to know you're on the right path:
- [ ] [Measurable outcome 1]
- [ ] [Measurable outcome 2]
- [ ] [Qualitative indicator]

## Conclusion

Recap the key points and encourage readers to start implementing.

---

*How did this guide work for you? Share your results and any tips you discovered!*
`,

    news: `---
title: "[Breaking/Latest]: {TITLE} - What You Need to Know"
date: {DATE}
author: {AUTHOR}
category: "news"
tags: ["news", "current-events", "analysis"]
excerpt: "Breaking down the latest developments in {TITLE} and what it means for [affected parties]."
published: false
slug: "{SLUG}"
newsType: "analysis"
---

# [Breaking/Latest]: {TITLE} - What You Need to Know

## The Story in Brief

**What happened:** [Concise summary of the main event]

**When:** [Timeline of events]

**Who's involved:** [Key players and stakeholders]

**Why it matters:** [Significance and impact]

## Background Context

### What Led to This

Provide the historical context that readers need to understand the significance.

### Key Players

- **[Person/Organization 1]:** Their role and stake in this
- **[Person/Organization 2]:** How they're involved
- **[Affected parties]:** Who this impacts

## Breaking Down What Happened

### The Initial Event

Detailed account of what triggered this news story.

### The Response

How different parties have reacted:
- **[Authority/Official response]**
- **[Industry response]**
- **[Public reaction]**

### Current Status

Where things stand right now.

## Analysis and Implications

### Short-term Impact

What we can expect to see immediately:
- [Immediate consequence 1]
- [Immediate consequence 2]

### Long-term Implications

Potential lasting effects:
- [Long-term impact 1]
- [Long-term impact 2]

## What This Means for You

### If You're [Affected Group 1]

Specific implications and recommended actions.

### For Everyone Else

General significance and why you should care.

## The Bigger Picture

How this fits into larger trends or ongoing stories.

---

*What's your take on this development? Share your thoughts in the comments.*

**Last updated:** {DATE} at [time]
`,

    interview: `---
title: "Interview with [Name]: {TITLE}"
date: {DATE}
author: {AUTHOR}
category: "interviews"
tags: ["interview", "expert", "conversation"]
excerpt: "An insightful conversation with [name] about {TITLE} and their unique perspective."
published: false
slug: "{SLUG}"
interviewee: "[Name]"
---

# Interview with [Name]: {TITLE}

## Meet [Interviewee Name]

Brief bio of your interview subject, including:
- Their background and expertise
- Current role or position
- Why their perspective is valuable
- Notable achievements or credentials

## The Conversation

### On [Topic 1]

**You:** [Your question about their background/entry into the field]

**[Name]:** "[Their response - keep their voice and style intact]"

**You:** [Follow-up question for clarification or depth]

**[Name]:** "[Their detailed response]"

### On [Topic 2: Current Work/Projects]

**You:** [Question about what they're working on now]

**[Name]:** "[Response about current projects or focus]"

### On [Topic 3: Lessons Learned]

**You:** [Question about their biggest learning or turning point]

**[Name]:** "[Story or insight about their journey]"

### On [Topic 4: Future Outlook]

**You:** [Question about where they see things heading]

**[Name]:** "[Predictions or hopes for the future]"

## Key Takeaways

From our conversation, here are the main insights:

1. **[Key insight 1]:** [Summary of important point]
2. **[Key insight 2]:** [Another valuable perspective]
3. **[Key insight 3]:** [Practical advice or wisdom]

## Quotable Moments

> "[Particularly insightful or memorable quote]"
> — [Name]

## Connect with [Name]

- **Website:** [URL]
- **Social Media:** [Handles]
- **Latest Work:** [Recent project/book/initiative]

## Final Thoughts

Your reflection on the conversation and what readers should take away from it.

---

*What resonated most with you from this interview? Share your thoughts in the comments.*
`,

    opinion: `---
title: "Why I Believe {TITLE}"
date: {DATE}
author: {AUTHOR}
category: "opinion"
tags: ["opinion", "commentary", "perspective"]
excerpt: "My thoughts on {TITLE} and why I believe [your main argument] matters more than ever."
published: false
slug: "{SLUG}"
disclaimer: "These are personal opinions"
---

# Why I Believe {TITLE}

## My Position

Let me be clear from the start: I believe [state your main argument clearly and concisely].

This isn't a popular opinion in all circles, and I understand why people might disagree. But after [time period/experience], I've come to this conclusion, and I think it's worth sharing why.

## The Context

### What's Happening Now

Current state of affairs regarding this topic.

### Why This Matters

The stakes involved and who is affected.

### The Prevailing View

What most people think about this issue and why.

## My Argument

### Point 1: [Core Reason]

**The evidence:** [Facts, examples, or experiences that support this]

**Why it matters:** [Implications of this point]

**Counter-argument:** I know some will say [opposing view], but [your response].

### Point 2: [Supporting Reason]

**From experience:** [Personal anecdotes or observations]

**The broader pattern:** [How this fits into larger trends]

**Real-world impact:** [Concrete examples of consequences]

### Point 3: [Additional Support]

**Historical perspective:** [What history teaches us about this]

**Looking forward:** [Future implications]

**The alternative:** [What happens if we don't consider this view]

## Addressing the Opposition

### "But what about [common objection]?"

I understand this concern, and here's how I see it: [thoughtful response].

### "You're ignoring [other perspective]"

Actually, I think [acknowledge validity where it exists, then explain your position].

## I Could Be Wrong

I want to acknowledge that:
- My perspective is shaped by [personal background/experience]
- I might be missing [potential blind spots]
- Reasonable people can disagree because [valid reasons]

But even considering these limitations, I still think [restate core argument] because [key reason].

## Conclusion

I've shared my perspective not to convince everyone I'm right, but to add another voice to an important conversation. Whether you agree or disagree, I hope this gives you something to think about.

---

*What's your take? I genuinely want to hear different perspectives, especially if you disagree. Let's discuss in the comments.*
`,

    technical: `---
title: "Deep Dive: {TITLE} Explained"
date: {DATE}
author: {AUTHOR}
category: "technical"
tags: ["technical", "development", "programming"]
excerpt: "A comprehensive technical exploration of {TITLE} with practical examples and real-world applications."
published: false
slug: "{SLUG}"
difficulty: "intermediate"
prerequisites: ["Basic knowledge of X", "Familiarity with Y"]
---

# Deep Dive: {TITLE} Explained

## Overview

Brief explanation of what this technical topic is and why it's important.

**TL;DR:** [One-sentence summary for busy readers]

## Prerequisites

Before diving in, you should be familiar with:
- [ ] [Concept/technology 1]
- [ ] [Concept/technology 2]
- [ ] [Tool/framework 3]

## The Problem

### What We're Solving

Clear description of the technical challenge or need this addresses.

### Why Traditional Approaches Fall Short

Explain limitations of existing solutions.

## Technical Foundation

### Core Concepts

#### Concept 1: [Key Technology/Pattern]

\`\`\`javascript
// Simple example demonstrating the concept
function exampleFunction() {
    // Clear, commented code
    return "Expected result";
}
\`\`\`

#### Concept 2: [Related Technology]

Technical explanation with visual aids if helpful.

## Implementation

### Step 1: Setup and Configuration

\`\`\`bash
# Installation commands
npm install required-package
\`\`\`

\`\`\`json
// Configuration file
{
    "setting1": "value1",
    "setting2": "value2"
}
\`\`\`

### Step 2: Core Implementation

\`\`\`javascript
// Main implementation with detailed comments
class TechnicalExample {
    constructor(options) {
        this.config = options;
        this.initialize();
    }

    initialize() {
        // Setup logic
    }

    processData(input) {
        // Core business logic
        return this.transform(input);
    }
}
\`\`\`

## Real-World Example

### Use Case: [Practical Scenario]

Complete example showing how this works in practice.

## Performance Considerations

### Optimization Tips

1. **Cache frequently accessed data**
   \`\`\`javascript
   const cache = new Map();
   // Caching implementation
   \`\`\`

2. **Use efficient algorithms**
   - Explanation of algorithmic improvements
   - Time/space complexity analysis

## Best Practices

1. **Always validate input data**
2. **Handle errors gracefully**
3. **Document your configuration**
4. **Monitor performance in production**

## Conclusion

Summary of what we've covered and key takeaways.

### Next Steps

- Explore [related technology]
- Read about [advanced topic]
- Try implementing [suggested project]

---

*Have you implemented something similar? Share your experience and any optimizations you've discovered!*
`,
  };

  let template = templates[templateName] || "";

  // Replace placeholders
  const timestamp = new Date().toISOString().split("T")[0];
  const projectManager = require("../utils/project");
  let author = "Your Name";

  // Try to get author from project config
  try {
    if (projectManager.isWritersProject()) {
      const config = await projectManager.getConfig();
      author = config?.author || "Your Name";
    }
  } catch (error) {
    // If not in a project or config unavailable, use default
  }

  const slug = (name || "untitled")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  template = template.replace(/{DATE}/g, timestamp);
  template = template.replace(/{TITLE}/g, name || "Untitled");
  template = template.replace(/{AUTHOR}/g, author);
  template = template.replace(/{SLUG}/g, slug);

  return template;
}

module.exports = newCommand;
