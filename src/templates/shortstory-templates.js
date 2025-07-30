const shortStoryTemplates = {
  basic: {
    name: "Basic Short Story",
    description: "Simple, clean template for any short story",
    content: `# {{title}}

*Created: {{date}}*
*Author: {{author}}*

---

## Story Information
- **Genre:** {{genre}}
- **Target Length:** {{targetLength}}
- **Status:** Planning
- **Theme:**

## Summary
[Brief description of your story concept]

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
- **Time:**
- **Place:**
- **Atmosphere:**

## Plot Outline
- **Opening:**
- **Inciting Incident:**
- **Rising Action:**
- **Climax:**
- **Resolution:**

## Notes
[Research notes, inspiration, or reminders]

---

## Story Content

[Begin writing your story here...]

`
  },

  flash: {
    name: "Flash Fiction",
    description: "Ultra-short stories (100-1000 words)",
    content: `# {{title}}

*Created: {{date}}*
*Author: {{author}}*
*Target: 100-1,000 words*

---

## Flash Fiction Focus
- **Central Image/Moment:** [What single moment captures everything?]
- **Emotional Core:** [What feeling drives this piece?]
- **Constraint:** [What limitation will sharpen the focus?]

## Story Information
- **Genre:** {{genre}}
- **Target Length:** {{targetLength}}
- **Status:** Planning
- **Word Budget:** Every word must earn its place

## The Essence
**What's at stake:**
**The twist/revelation:**
**Final image:**

## Structure Notes
- Start as close to the end as possible
- One central conflict or realization
- Leave room for reader interpretation
- Focus on subtext and implication

---

## Story Content

[Begin writing your flash fiction here...]

`
  },

  "character-study": {
    name: "Character Study",
    description: "Stories focused on character development and internal journey",
    content: `# {{title}}

*Created: {{date}}*
*Author: {{author}}*

---

## Story Information
- **Genre:** {{genre}}
- **Target Length:** {{targetLength}}
- **Status:** Planning
- **Theme:** Character development and transformation

## Character Deep Dive
**Main Character:**
- **Name:**
- **Age:**
- **Occupation:**
- **Background:**
- **Personality traits:**
- **Speech patterns:**
- **Habits/quirks:**
- **Fears:**
- **Desires:**

## Character Arc
- **Starting point:** [Who is this person at the beginning?]
- **Internal conflict:** [What's the internal struggle?]
- **External catalyst:** [What event forces change?]
- **Resistance:** [How do they resist change?]
- **Breakthrough moment:** [When do they realize they must change?]
- **Transformation:** [Who have they become by the end?]

## Supporting Cast
**Each character should reveal something about the protagonist:**
- **Character 2:** [Role in protagonist's journey]
- **Character 3:** [Role in protagonist's journey]

## Setting & Atmosphere
- **Primary setting:**
- **How setting reflects character's internal state:**
- **Symbolic elements:**

## Plot Structure
- **Opening:** [Character in their normal world]
- **Inciting incident:** [What disrupts their equilibrium?]
- **Complications:** [How does the character respond/resist?]
- **Crisis:** [Moment of maximum pressure]
- **Climax:** [Character makes crucial choice]
- **Resolution:** [How has the character changed?]

## Themes to Explore
-
-
-

---

## Story Content

[Begin writing your character study here...]

`
  },

  twist: {
    name: "Twist Ending",
    description: "Stories with surprise endings that recontextualize everything",
    content: `# {{title}}

*Created: {{date}}*
*Author: {{author}}*

---

## Story Information
- **Genre:** {{genre}}
- **Target Length:** {{targetLength}}
- **Status:** Planning
- **Type:** Twist ending story

## Twist Planning
**The Reveal:** [What is the surprise that changes everything?]

**Misdirection Strategy:**
- **What readers will assume:**
- **How you'll encourage this assumption:**
- **What you're actually hiding:**

**Clue Placement:**
- **Clue 1:** [Subtle hint that makes sense in retrospect]
- **Clue 2:** [Another hint that seems innocent]
- **Clue 3:** [Final piece of the puzzle]

**Fair Play Checklist:**
- [ ] All information needed for the solution is present
- [ ] Clues are visible but not obvious
- [ ] The twist is surprising but inevitable in hindsight
- [ ] The story works even when you know the ending

## Character Perspective
**POV Character:**
- **What they know:**
- **What they don't know:**
- **What they assume:**
- **How their assumptions mislead the reader:**

## Story Structure
- **Setup:** [Establish the world and apparent situation]
- **Development:** [Layer in clues while building false assumptions]
- **Complications:** [Increase tension without revealing truth]
- **Revelation:** [The moment of truth]
- **Recontextualization:** [How everything changes meaning]

## Red Herrings
- **False lead 1:**
- **False lead 2:**
- **How they serve the misdirection:**

## The Reveal Scene
- **Trigger event:** [What causes the truth to come out?]
- **Character reactions:** [How do characters respond?]
- **Reader realization:** [What will readers understand?]

---

## Story Content

[Begin writing your twist story here...]

`
  },

  literary: {
    name: "Literary Fiction",
    description: "Character-driven stories with deeper themes and beautiful prose",
    content: `# {{title}}

*Created: {{date}}*
*Author: {{author}}*

---

## Story Information
- **Genre:** Literary Fiction
- **Target Length:** {{targetLength}}
- **Status:** Planning
- **Theme:** {{theme}}

## Thematic Foundation
**Central Theme:** [What universal human experience are you exploring?]
**Subtopics:**
-
-
-

**Symbolic Elements:**
- **Key symbol:**
- **What it represents:**
- **How it appears throughout:**

## Character Development
**Protagonist:**
- **Name:**
- **Age/Background:**
- **Internal conflict:**
- **External situation:**
- **Character flaw:**
- **Redeeming quality:**
- **Voice/perspective:**

## Literary Elements
**Mood/Atmosphere:**
**Point of View:** [1st person, 3rd limited, etc.]
**Narrative Style:** [Stream of consciousness, traditional, experimental]
**Language Goals:** [Lyrical, spare, conversational, etc.]

## Setting as Character
**Location:**
**Time period:**
**Social context:**
**How setting reflects theme:**
**Sensory details to emphasize:**

## Structure & Pacing
**Opening:** [How do you draw readers into this world?]
**Complications:** [What challenges the character's worldview?]
**Climax:** [Moment of recognition or decision]
**Resolution:** [Subtle change or realization]

## Style Notes
- Focus on subtext and implication
- Show internal life through external actions
- Use precise, evocative language
- Build toward a moment of recognition or revelation

## Research Needed
-
-
-

---

## Story Content

[Begin writing your literary story here...]

`
  },

  genre: {
    name: "Genre Fiction",
    description: "Science fiction, fantasy, horror, mystery, and other genre stories",
    content: `# {{title}}

*Created: {{date}}*
*Author: {{author}}*

---

## Story Information
- **Primary Genre:** {{genre}}
- **Subgenre:**
- **Target Length:** {{targetLength}}
- **Status:** Planning

## Genre Elements
**Core Speculative Element:** [What makes this story genre fiction?]
**Genre Conventions to Include:**
-
-
-

**Genre Conventions to Subvert:**
-
-

## World Building (if applicable)
**Setting Rules:**
- **Magic/Technology system:**
- **Limitations/costs:**
- **How it affects society:**

**Cultural Elements:**
- **Social structure:**
- **Values and beliefs:**
- **Daily life details:**

## Plot Structure
**Hook:** [Genre-specific opening that establishes the world]
**Inciting Incident:** [What sets the genre plot in motion?]
**Complications:** [How do genre elements create obstacles?]
**Climax:** [Confrontation using genre elements]
**Resolution:** [How are genre conflicts resolved?]

## Character Roles
**Protagonist:**
- **Name:**
- **Role in genre context:**
- **Special abilities/knowledge:**
- **Character arc:**

**Antagonist:**
- **Name/Nature:**
- **Motivation:**
- **Powers/Resources:**
- **Connection to protagonist:**

## Research & Consistency
**Science/Magic Research:**
-
-

**Internal Logic Rules:**
-
-

**Consistency Checklist:**
- [ ] World rules established early
- [ ] Rules followed consistently
- [ ] Genre elements serve story, not dominate it
- [ ] Characters' actions make sense in this world

---

## Story Content

[Begin writing your genre story here...]

`
  },

  experimental: {
    name: "Experimental Fiction",
    description: "Stories that push boundaries of form and structure",
    content: `# {{title}}

*Created: {{date}}*
*Author: {{author}}*

---

## Story Information
- **Genre:** Experimental Fiction
- **Target Length:** {{targetLength}}
- **Status:** Planning
- **Experimental Element:** [What are you experimenting with?]

## Experimental Framework
**Traditional Element Being Challenged:**
- [ ] Linear narrative
- [ ] Single POV
- [ ] Standard dialogue
- [ ] Conventional structure
- [ ] Reader expectations
- [ ] Language/style
- [ ] Genre boundaries

**Your Innovation:**
[Describe what you're trying instead]

**Why This Approach:**
[What does this technique allow you to express that traditional methods don't?]

## Structure Planning
**Organizing Principle:** [What holds this story together?]
- Time
- Theme
- Image patterns
- Character consciousness
- Musical structure
- Visual layout
- Other: ___________

**Section Breakdown:**
1.
2.
3.
4.

## Reader Experience
**What you want readers to feel:**
**How the form creates this feeling:**
**Potential reader challenges:**
**How you'll guide readers:**

## Technical Considerations
**Point of View experiments:**
**Tense experiments:**
**Typography/layout:**
**Language constraints:**

## Grounding Elements
[Even experimental fiction needs some familiar anchors]
**Character:**
**Emotion:**
**Conflict:**
**Stakes:**

## Testing Framework
- [ ] Does the experimental element serve the story?
- [ ] Is it accessible to readers?
- [ ] Does it create the intended effect?
- [ ] Is there enough story beneath the experiment?

---

## Story Content

[Begin your experimental story here...]

`
  },

  collection: {
    name: "Collection Story",
    description: "Story designed as part of a larger collection",
    content: `# {{title}}

*Created: {{date}}*
*Author: {{author}}*
*Collection: {{collection}}*

---

## Story Information
- **Genre:** {{genre}}
- **Target Length:** {{targetLength}}
- **Status:** Planning
- **Collection Theme:** {{theme}}
- **Position in Collection:** [Beginning/Middle/End/Standalone]

## Collection Integration
**How this story serves the collection:**
**Shared elements with other stories:**
- Characters:
- Setting:
- Time period:
- Theme:
- Style:

**Unique contribution:**
[What does this story add that others don't?]

## Thematic Resonance
**Collection's central theme:**
**This story's perspective on theme:**
**Contrasts with other stories:**
**Reinforces from other stories:**

## Character Connections
**Shared characters:**
**Character references:**
**Character parallels:**

## Setting/Time
**Geographic connections:**
**Temporal relationship:**
**Atmospheric continuity:**

## Standalone Quality
- [ ] Story works independently
- [ ] Complete narrative arc
- [ ] Satisfying resolution
- [ ] Clear without other stories

## Collection Goals
- [ ] Advances overall theme
- [ ] Provides different perspective
- [ ] Maintains stylistic consistency
- [ ] Offers variety in tone/approach

## Plot Structure
**Opening:** [How does this fit collection flow?]
**Development:** [Building on collection elements]
**Climax:** [Story-specific high point]
**Resolution:** [How does it prepare for next story?]

---

## Story Content

[Begin writing your collection story here...]

`
  },

  workshop: {
    name: "Workshop Exercise",
    description: "Practice stories for skill development",
    content: `# {{title}}

*Created: {{date}}*
*Author: {{author}}*
*Exercise Type: {{exerciseType}}*

---

## Workshop Information
- **Skill Focus:** {{skillFocus}}
- **Target Length:** {{targetLength}}
- **Status:** Exercise
- **Time Limit:** [How long to spend on this?]

## Learning Objectives
**Primary skill to practice:**
**Secondary skills:**
-
-

**Success criteria:**
-
-

## Exercise Parameters
**Constraints:** [What limitations will sharpen focus?]
- Word count:
- Time limit:
- POV restriction:
- Setting requirement:
- Character limitation:
- Other: ___________

**Prompt/Inspiration:**
[What sparked this exercise?]

## Technical Focus Areas
- [ ] Dialogue
- [ ] Description
- [ ] Character development
- [ ] Plot structure
- [ ] Pacing
- [ ] Voice
- [ ] Point of view
- [ ] Setting
- [ ] Theme
- [ ] Style

## Experimental Elements
[What will you try that's new for you?]

## Evaluation Criteria
**What worked:**
**What didn't work:**
**What you learned:**
**Next steps:**

## Notes for Future Reference
[Techniques to remember or avoid]

---

## Story Content

[Begin your workshop exercise here...]

`
  },

  prompt: {
    name: "Prompt Response",
    description: "Story based on a specific writing prompt",
    content: `# {{title}}

*Created: {{date}}*
*Author: {{author}}*
*Prompt Response*

---

## Prompt Information
**Original Prompt:**
"{{prompt}}"

**Source:** {{promptSource}}
**Time Limit:** {{timeLimit}}

## Story Information
- **Genre:** {{genre}}
- **Target Length:** {{targetLength}}
- **Status:** Prompt Response

## Prompt Interpretation
**What caught your attention:**
**Your unique angle:**
**What you want to explore:**

## Quick Planning
**Main character:**
**Conflict:**
**Setting:**
**Mood:**

## Approach
- [ ] Take prompt literally
- [ ] Subvert prompt expectations
- [ ] Use prompt as inspiration only
- [ ] Combine with another prompt
- [ ] Focus on specific element

## Success Metrics
- [ ] Responds to prompt
- [ ] Complete story arc
- [ ] Satisfying for reader
- [ ] Personally interesting

---

## Story Content

[Begin your prompt response here...]

`
  }
};

function getTemplate(templateName, variables = {}) {
  const template = shortStoryTemplates[templateName];
  if (!template) {
    throw new Error(`Template "${templateName}" not found`);
  }

  let content = template.content;

  // Replace variables
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    content = content.replace(regex, value || '');
  });

  // Set default date if not provided
  if (!variables.date) {
    content = content.replace(/{{date}}/g, new Date().toLocaleDateString());
  }

  return {
    name: template.name,
    description: template.description,
    content: content
  };
}

function getAvailableTemplates() {
  return Object.keys(shortStoryTemplates).map(key => ({
    value: key,
    name: shortStoryTemplates[key].name,
    description: shortStoryTemplates[key].description
  }));
}

function getTemplateNames() {
  return Object.keys(shortStoryTemplates);
}

function getTemplateDescription(templateName) {
  const template = shortStoryTemplates[templateName];
  return template ? template.description : null;
}

// Length presets for easy selection
const lengthPresets = {
  flash: "100-1,000 words",
  micro: "300 words or less",
  short: "1,000-2,500 words",
  standard: "2,500-7,500 words",
  long: "7,500-15,000 words",
  novelette: "15,000-40,000 words"
};

function getLengthPresets() {
  return lengthPresets;
}

// Genre suggestions
const genreSuggestions = [
  "Literary Fiction",
  "Science Fiction",
  "Fantasy",
  "Horror",
  "Mystery",
  "Thriller",
  "Romance",
  "Historical Fiction",
  "Contemporary Fiction",
  "Magical Realism",
  "Experimental",
  "Flash Fiction",
  "Young Adult",
  "Crime",
  "Western",
  "Comedy",
  "Drama",
  "Adventure"
];

function getGenreSuggestions() {
  return genreSuggestions;
}

module.exports = {
  getTemplate,
  getAvailableTemplates,
  getTemplateNames,
  getTemplateDescription,
  getLengthPresets,
  getGenreSuggestions,
  shortStoryTemplates
};
