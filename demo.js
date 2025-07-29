#!/usr/bin/env node

const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');

// Import the CLI modules directly
const projectManager = require('./src/utils/project');
const markdownUtils = require('./src/utils/markdown');

async function runComprehensiveDemo() {
  console.log(chalk.blue.bold('🎭 Writers CLI - Comprehensive Demo\n'));

  // Clean up any existing demo
  const demoDir = 'my-fantasy-novel';
  if (await fs.pathExists(demoDir)) {
    await fs.remove(demoDir);
  }

  await fs.ensureDir(demoDir);
  process.chdir(demoDir);

  console.log(chalk.green('📁 Created demo project directory\n'));

  // 1. Initialize Project
  console.log(chalk.blue('1️⃣ Initializing project...'));

  const config = await projectManager.initProject({
    name: 'The Crystal Chronicles',
    author: 'Demo Author',
    wordGoal: 75000,
    genre: 'Fantasy',
    editor: 'nano'
  });

  console.log(chalk.green('✅ Project initialized:'));
  console.log(`   Title: ${chalk.cyan(config.name)}`);
  console.log(`   Author: ${chalk.cyan(config.author)}`);
  console.log(`   Goal: ${chalk.cyan(config.wordGoal.toLocaleString())} words\n`);

  // 2. Create Multiple Chapters
  console.log(chalk.blue('2️⃣ Creating chapters...'));

  const chapters = [
    {
      name: 'Chapter 1: The Awakening',
      content: `# Chapter 1: The Awakening

*Created: ${new Date().toISOString().split('T')[0]}*

---

## Summary
Lyra discovers her magical abilities when ancient crystals react to her presence.

## Notes
- Introduce the magic system
- Establish the protagonist's ordinary world
- First glimpse of the larger conflict

---

## Content

The morning mist clung to the Whispering Woods like secrets waiting to be told. Lyra Moonweaver had walked this path a thousand times before, gathering herbs for her grandmother's apothecary, but today something felt different.

As she knelt beside a cluster of silverleaf, her fingers brushed against something cold and smooth beneath the moss. A crystal, no larger than her thumb, pulsed with an inner light that seemed to respond to her touch.

"Impossible," she whispered, but the crystal's glow only grew brighter.

The moment her skin made contact with its surface, the world exploded into color. Every living thing around her—the trees, the flowers, even the tiny insects—radiated streams of light visible only to her newly awakened sight.

She was a Crystalwright, one of the legendary magic users her grandmother had told her stories about. The very people who had vanished from the realm fifty years ago.

But if she could see the crystal magic, that meant the old legends were true. The Dark Convergence was coming, and the realm would need its Crystalwrights more than ever.

Little did Lyra know that in the capital city, shadows were already moving, and her discovery had not gone unnoticed.`
    },
    {
      name: 'Chapter 2: Shadows and Secrets',
      content: `# Chapter 2: Shadows and Secrets

*Created: ${new Date().toISOString().split('T')[0]}*

---

## Summary
We meet the antagonist and learn about the growing threat to the realm.

## Notes
- Introduce Lord Malachar
- Show the political situation
- Establish the stakes

---

## Content

Three hundred miles away in the obsidian towers of Shadowhaven, Lord Malachar felt the disturbance like a knife through his meditation.

Someone had awakened. After fifty years of silence, crystal magic had stirred once again in the realm.

"My lord," his lieutenant, Captain Vex, entered the chamber with the deference of one who knew the price of disrespect. "The scrying orbs have detected magical resonance from the eastern provinces."

Malachar's pale eyes opened, glowing with malevolent energy. "How many?"

"Just one, my lord. A single awakening, somewhere near Millbrook."

A smile crept across the Dark Lord's face, cold as winter's bite. "Then our long wait comes to an end. Send the Void Hunters. Find this new Crystalwright before they fully understand their power."

He rose from his meditation cushion, dark robes flowing around him like liquid shadow. "And Captain? Make sure they understand the consequences of resistance. We cannot afford another uprising."

As Vex bowed and departed, Malachar gazed out at the storm clouds gathering over his fortress. Soon, very soon, his vision of a world without crystal magic would be complete.

But first, he had to eliminate this new threat before it could grow into something more dangerous.`
    },
    {
      name: 'Chapter 3: The Mentor Appears',
      content: `# Chapter 3: The Mentor Appears

*Created: ${new Date().toISOString().split('T')[0]}*

---

## Summary
Lyra meets Thaddeus, an old Crystalwright in hiding who becomes her mentor.

## Notes
- Introduce the mentor character
- Explain the magic system
- Set up the journey ahead

---

## Content

Lyra sat by her grandmother's fireplace, the mysterious crystal warm in her palm, when a knock came at the door. But it wasn't an ordinary knock—each rap seemed to resonate with the crystal's energy.

"Grandmother," Lyra called, but received no answer. The old woman had gone to the market and wouldn't return for hours.

Another knock, more insistent this time. Against her better judgment, Lyra approached the door.

"Who's there?"

"Someone who knows what you're holding, child," came a gravelly voice. "And someone who can teach you to use it before the Void Hunters find you."

Lyra's blood turned to ice. She'd heard whispers of the Void Hunters—shadow creatures that served the Dark Lord, hunting down anyone with magical abilities.

"How do I know you're not one of them?"

A soft chuckle answered her. "Because, my dear, I'm about to do something no Void Hunter ever could."

The crystal in her hand suddenly blazed with warm, golden light, and through the door's wooden panels, she could see a figure outlined in the same gentle radiance.

With trembling fingers, she opened the door to reveal an elderly man with kind eyes and robes that seemed to shimmer between brown and silver.

"My name is Thaddeus Starweaver," he said with a bow. "Last of the old Crystalwright order, and if you'll have me, your teacher."

He glanced at the horizon where dark clouds were gathering unnaturally fast. "But we must hurry. They're coming, and you have much to learn."

Thus began Lyra's true education in the ancient arts, though neither she nor Thaddeus could foresee the incredible journey that lay ahead.`
    }
  ];

  for (const chapter of chapters) {
    const result = await projectManager.createFile('chapters', chapter.name);
    await fs.writeFile(result.path, chapter.content);
    console.log(`   ✅ Created: ${chalk.cyan(chapter.name)}`);
  }

  // 3. Create Character Profiles
  console.log(chalk.blue('\n3️⃣ Creating character profiles...'));

  const characters = [
    {
      name: 'Lyra Moonweaver',
      content: `# Lyra Moonweaver

*Created: ${new Date().toISOString().split('T')[0]}*

---

## Basic Information
- **Full Name:** Lyra Moonweaver
- **Age:** 17
- **Occupation:** Herbalist's apprentice
- **Location:** Millbrook Village

## Physical Description
- **Height/Build:** 5'4", petite but strong from outdoor work
- **Hair/Eyes:** Silver-blonde hair, violet eyes that glow when using magic
- **Distinguishing Features:** Crescent-shaped birthmark on left wrist
- **Style/Clothing:** Practical earth-toned clothing, herb-gathering satchel

## Personality Core
- **Greatest Strength:** Compassion and determination
- **Fatal Flaw:** Tendency to trust too easily
- **Deepest Fear:** Losing those she loves to the darkness
- **Driving Motivation:** Protecting her world from the Dark Convergence

## Character Arc
- **Starting Point:** Ordinary village girl unaware of her heritage
- **Growth Challenge:** Must master incredible power while staying true to herself
- **Change:** Learns to balance strength with wisdom
- **Ending Point:** Confident Crystalwright ready to lead others

## Magic Abilities
- **Crystal Affinity:** Can see and manipulate crystal energy
- **Healing:** Accelerated healing for herself and others
- **Light Magic:** Can create barriers and weapons of pure light
- **Future Potential:** Prophesied to become the strongest Crystalwright in centuries`
    },
    {
      name: 'Lord Malachar',
      content: `# Lord Malachar

*Created: ${new Date().toISOString().split('T')[0]}*

---

## Basic Information
- **Full Name:** Malachar the Void Bringer
- **Age:** Unknown (appears 40, actually over 200)
- **Occupation:** Dark Lord of Shadowhaven
- **Location:** The Obsidian Fortress

## Physical Description
- **Height/Build:** 6'2", imposing and angular
- **Hair/Eyes:** Black hair, pale glowing eyes
- **Distinguishing Features:** Scar across left cheek, always cold to touch
- **Style/Clothing:** Dark robes that seem to absorb light

## Psychology
- **Core Motivation:** Believes magic corrupts and must be eliminated
- **Justification:** Lost his family to a magical disaster decades ago
- **Methods:** Systematic elimination of all magical beings
- **Weaknesses:** Obsession blinds him to alternatives

## Background
- **Origin Story:** Once a respected scholar who studied magical disasters
- **The Tragedy:** His research facility exploded, killing his wife and daughter
- **Transformation:** Made a pact with void entities for power to "save" the world
- **Rise to Power:** Conquered the eastern kingdoms through fear and shadow magic

## Abilities
- **Void Magic:** Can drain life force and magical energy
- **Shadow Control:** Commands shadow creatures and darkness itself
- **Immortality:** Sustained by void energy, nearly impossible to kill
- **Strategic Mind:** Brilliant tactician and long-term planner`
    }
  ];

  for (const character of characters) {
    const result = await projectManager.createFile('characters', character.name);
    await fs.writeFile(result.path, character.content);
    console.log(`   ✅ Created: ${chalk.cyan(character.name)}`);
  }

  // 4. Add Some Notes
  console.log(chalk.blue('\n4️⃣ Adding world-building notes...'));

  const notes = [
    {
      name: 'Magic System',
      content: `# Magic System: Crystal Magic

*Created: ${new Date().toISOString().split('T')[0]}*

---

## Core Principles

Crystal magic is based on the manipulation of natural energy that flows through special crystalline formations found throughout the realm.

### Types of Crystals
- **Healing Crystals** (Green): Accelerate natural healing and purification
- **Light Crystals** (White/Gold): Create barriers, weapons, and illumination
- **Mind Crystals** (Blue): Enable telepathy and mental shields
- **Earth Crystals** (Brown): Control over stone, metal, and growing things
- **Void Crystals** (Black): Forbidden crystals that drain energy and life

### Crystalwright Abilities
1. **Sight**: Can see magical energy flows
2. **Touch**: Direct manipulation of crystal energy
3. **Channeling**: Focus crystal power through tools or weapons
4. **Resonance**: Advanced users can connect with multiple crystals simultaneously

### Limitations
- Requires physical contact or close proximity to crystals
- Overuse causes exhaustion and potential magical burnout
- Void crystals corrupt users over time
- Natural talent varies greatly between individuals

### The Great Purge
Fifty years ago, Lord Malachar began systematically destroying crystal formations and hunting Crystalwrights, leading to the near-extinction of crystal magic.`
    },
    {
      name: 'World Geography',
      content: `# The Realm of Aethermoor

*Created: ${new Date().toISOString().split('T')[0]}*

---

## Major Regions

### The Eastern Provinces
- **Millbrook Village**: Lyra's home, known for herb cultivation
- **Whispering Woods**: Ancient forest with hidden crystal formations
- **The Shattered Peaks**: Mountain range where the first crystals were discovered

### Central Kingdoms
- **Goldenheart**: The capital, currently under Malachar's influence
- **The Great Library**: Repository of ancient magical knowledge
- **Crystal Falls**: Sacred waterfall where Crystalwrights once trained

### The Dark Lands
- **Shadowhaven**: Malachar's fortress city
- **The Void Wastes**: Corrupted lands where void magic experiments took place
- **The Sunless Sea**: Body of water that no longer reflects light

### Hidden Sanctuaries
- **The Haven**: Secret refuge for surviving Crystalwrights
- **Starweaver's Tower**: Thaddeus's hidden magical laboratory
- **The Underground**: Network of resistance fighters and magic sympathizers

## Climate and Environment
The realm has grown darker and colder as Malachar's influence spreads. Natural crystal formations maintain pockets of warmth and life, making them valuable beyond their magical properties.`
    }
  ];

  for (const note of notes) {
    const result = await projectManager.createFile('notes', note.name);
    await fs.writeFile(result.path, note.content);
    console.log(`   ✅ Created: ${chalk.cyan(note.name)}`);
  }

  // 5. Show Statistics
  console.log(chalk.blue('\n5️⃣ Generating project statistics...'));

  const stats = await projectManager.getProjectStats();

  console.log(chalk.green('\n📊 Project Overview:'));
  console.log(`   📖 Project: ${chalk.cyan(stats.project)}`);
  console.log(`   ✍️  Author: ${chalk.cyan(stats.author)}`);
  console.log(`   🎯 Word Goal: ${chalk.cyan(stats.wordGoal.toLocaleString())}`);
  console.log(`   📝 Total Words: ${chalk.cyan(stats.totalWords.toLocaleString())}`);
  console.log(`   📈 Progress: ${chalk.cyan(stats.progress.toFixed(1))}%`);

  console.log(chalk.green('\n📁 Content Count:'));
  console.log(`   📖 Chapters: ${chalk.cyan(stats.files.chapters)}`);
  console.log(`   👤 Characters: ${chalk.cyan(stats.files.characters)}`);
  console.log(`   📝 Notes: ${chalk.cyan(stats.files.notes)}`);

  // 6. Show Chapter Breakdown
  console.log(chalk.green('\n📚 Chapter Breakdown:'));
  for (const chapter of stats.chapters) {
    const readingTime = markdownUtils.estimateReadingTimeFromWords(chapter.words);
    console.log(`   • ${chalk.bold(chapter.name)}`);
    console.log(`     ${chapter.words} words • ${readingTime}`);
  }

  // 7. Demonstrate Export
  console.log(chalk.blue('\n6️⃣ Demonstrating export functionality...'));

  // Create a simple export without interactive prompts
  const exportCommand = require('./src/commands/export');

  // Generate HTML export programmatically
  const content = {
    chapters: [],
    scenes: [],
    characters: [],
    notes: []
  };

  // Collect all content
  for (const chapter of stats.chapters) {
    const fileContent = await fs.readFile(chapter.path, 'utf8');
    content.chapters.push({
      name: chapter.name,
      content: fileContent,
      words: chapter.words
    });
  }

  // Simple HTML generation
  let html = `<!DOCTYPE html>
<html>
<head>
    <title>${config.name}</title>
    <style>
        body { font-family: Georgia, serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; }
        .chapter { margin-bottom: 50px; page-break-before: always; }
    </style>
</head>
<body>
    <h1>${config.name}</h1>
    <p><strong>Author:</strong> ${config.author}</p>
    <p><strong>Exported:</strong> ${new Date().toLocaleDateString()}</p>
    <hr>
`;

  for (const chapter of content.chapters) {
    html += `<div class="chapter">${markdownUtils.renderToHtml(chapter.content)}</div>`;
  }

  html += '</body></html>';

  await fs.ensureDir('exports');
  const exportPath = `exports/novel-demo-${new Date().toISOString().split('T')[0]}.html`;
  await fs.writeFile(exportPath, html);

  console.log(chalk.green(`   ✅ HTML export created: ${chalk.cyan(exportPath)}`));

  // 8. Show File Structure
  console.log(chalk.blue('\n7️⃣ Final project structure:'));

  function showDirectory(dir, prefix = '') {
    const items = fs.readdirSync(dir).sort();

    items.forEach((item, index) => {
      const isLast = index === items.length - 1;
      const connector = isLast ? '└── ' : '├── ';
      const itemPath = path.join(dir, item);

      if (fs.statSync(itemPath).isDirectory()) {
        console.log(`${prefix}${connector}📁 ${chalk.blue(item)}/`);
        if (!item.startsWith('.') && item !== 'node_modules') {
          const newPrefix = prefix + (isLast ? '    ' : '│   ');
          showDirectory(itemPath, newPrefix);
        }
      } else {
        const icon = item.endsWith('.md') ? '📄' :
                    item.endsWith('.json') ? '⚙️' :
                    item.endsWith('.html') ? '🌐' : '📋';
        console.log(`${prefix}${connector}${icon} ${item}`);
      }
    });
  }

  showDirectory('.');

  // 9. Usage Examples
  console.log(chalk.blue.bold('\n🚀 Try these commands in the demo project:'));
  console.log('');
  console.log(chalk.yellow('# View all content'));
  console.log(`node ../bin/writers.js list`);
  console.log('');
  console.log(chalk.yellow('# Show detailed statistics'));
  console.log(`node ../bin/writers.js stats --detailed`);
  console.log('');
  console.log(chalk.yellow('# Show specific chapter stats'));
  console.log(`node ../bin/writers.js stats --chapter "Chapter 1"`);
  console.log('');
  console.log(chalk.yellow('# Export to different formats'));
  console.log(`node ../bin/writers.js export markdown`);
  console.log(`node ../bin/writers.js export text`);
  console.log('');
  console.log(chalk.yellow('# Create new content'));
  console.log(`node ../bin/writers.js new chapter "Chapter 4: The Journey Begins"`);
  console.log(`node ../bin/writers.js new character "Thaddeus Starweaver"`);
  console.log('');

  // 10. Success Summary
  console.log(chalk.green.bold('\n🎉 Demo Complete!'));
  console.log('');
  console.log(chalk.green('✅ Created a complete fantasy novel project'));
  console.log(chalk.green('✅ Generated 3 chapters with rich content'));
  console.log(chalk.green('✅ Added character profiles and world-building notes'));
  console.log(chalk.green('✅ Demonstrated statistics and progress tracking'));
  console.log(chalk.green('✅ Exported to HTML format'));
  console.log('');
  console.log(`📁 Project location: ${chalk.cyan(path.resolve('.'))}`)
  console.log(`📝 Total words: ${chalk.cyan(stats.totalWords.toLocaleString())}`);
  console.log(`📊 Progress: ${chalk.cyan(stats.progress.toFixed(1))}% toward ${stats.wordGoal.toLocaleString()} word goal`);
  console.log('');
  console.log(chalk.blue('Happy writing! ✨'));
}

// Run the demo
runComprehensiveDemo().catch(error => {
  console.error(chalk.red('Demo failed:'), error.message);
  process.exit(1);
});
