#!/usr/bin/env node

const chalk = require("chalk");
const boxen = require("boxen");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs-extra");

class GUIDemo {
  constructor() {
    this.demoProject = "demo-gui-project";
  }

  async run() {
    console.clear();
    this.showWelcome();

    try {
      await this.createDemoProject();
      await this.showFeatures();
      await this.launchGUI();
    } catch (error) {
      console.error(chalk.red("❌ Demo failed:"), error.message);
      process.exit(1);
    }
  }

  showWelcome() {
    const welcome = `
${chalk.bold.blue("🖥️  Writers CLI - Comprehensive GUI Demo")}

This demo will showcase the new comprehensive graphical interface
that includes full project management capabilities.

${chalk.bold("What you'll see:")}
${chalk.green("•")} Complete project management interface
${chalk.green("•")} Real-time statistics and progress tracking
${chalk.green("•")} File organization (chapters, scenes, characters, etc.)
${chalk.green("•")} Integrated editor with auto-save
${chalk.green("•")} Export functionality
${chalk.green("•")} Project settings management

${chalk.yellow("Setting up demo project...")}
`;

    console.log(
      boxen(welcome.trim(), {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "blue",
      }),
    );
  }

  async createDemoProject() {
    // Clean up any existing demo project
    if (await fs.pathExists(this.demoProject)) {
      await fs.remove(this.demoProject);
    }

    // Create demo project directory
    await fs.ensureDir(this.demoProject);
    process.chdir(this.demoProject);

    console.log(chalk.cyan("📂 Creating demo project structure..."));

    // Initialize Writers project
    const projectManager = require("./src/utils/project");
    await projectManager.initProject({
      name: "My Fantasy Novel",
      author: "Demo Author",
      wordGoal: 75000,
      genre: "Fantasy",
    });

    // Create sample content
    await this.createSampleContent();

    console.log(chalk.green("✅ Demo project created successfully!"));
  }

  async createSampleContent() {
    const projectManager = require("./src/utils/project");

    // Create sample chapters
    const chapters = [
      {
        name: "The Awakening",
        content: `# The Awakening

The morning sun cast long shadows across the ancient stones of Eldoria. Kara had always known this day would come, but she never expected it to feel so... ordinary.

She stood at the edge of the cliff, watching the mist rise from the valley below. Somewhere in that fog lay her destiny, waiting to be discovered.

"Are you ready?" a voice asked behind her.

Kara turned to see Master Thorne approaching, his weathered face grave with concern. His robes billowed in the mountain wind, and the staff in his hand seemed to pulse with an inner light.

"As ready as anyone can be," she replied, though her voice betrayed her uncertainty.

The old wizard nodded slowly. "Remember what I taught you. The power within you is vast, but it must be tempered with wisdom. The Shadow King will try to corrupt you, as he has so many others."

Kara fingered the pendant at her throat—the last gift from her mother before she died. It felt warm against her skin, almost alive.

"I won't let him," she said firmly. "I'll find the Crystal of Eternal Light and end his reign of terror."

Master Thorne's eyes softened. "Your mother would be proud."

With those words echoing in her mind, Kara stepped forward into her destiny.`,
      },
      {
        name: "The Journey Begins",
        content: `# The Journey Begins

Three days into her journey, Kara realized she was being followed.

The signs were subtle at first—a branch that snapped in the distance, the feeling of eyes watching her as she made camp, tracks in the mud that weren't quite right. But by the third day, she was certain.

She sat by her small fire, pretending to study the ancient map Master Thorne had given her. In reality, she was listening to the sounds of the forest, trying to pinpoint where her stalker might be hiding.

A twig snapped to her left.

Quick as lightning, Kara spun around, her hand extended. Blue fire erupted from her palm, illuminating the darkness between the trees.

"I know you're there," she called out. "Show yourself!"

For a moment, nothing happened. Then a figure stepped into the light—a young man about her own age, with dark hair and intelligent green eyes. He raised his hands in surrender, but there was an amused smile on his lips.

"Impressive," he said. "Though you might want to work on your detection skills. I've been following you since you left the monastery."

Kara kept the magical fire burning in her palm. "Who are you? What do you want?"

"My name is Flynn," he said, taking another step closer. "And I want to help you find the Crystal of Eternal Light."

"Why would you want to help me?"

Flynn's expression grew serious. "Because the Shadow King killed my family too."`,
      },
      {
        name: "The Dark Forest",
        content: `# The Dark Forest

The Whispering Wood was even more terrifying than the legends claimed.

Kara and Flynn stood at its edge, looking into the twisted maze of blackened trees and perpetual twilight. The air itself seemed to pulse with malevolent energy, and strange sounds echoed from the depths—whispers, moans, and things that might have been laughter.

"Are you sure the Crystal is in there?" Flynn asked, his usual confidence shaken.

Kara consulted the map again. The parchment was old and worn, but the magical ink still glowed faintly. A pulsing red dot marked their destination, deep in the heart of the forest.

"According to this, yes," she said. "The Crystal of Eternal Light rests in the Temple of the First Light, right in the center of the wood."

Flynn shouldered his pack and checked his sword one last time. "Well, standing here won't get us any closer."

They stepped into the forest together.

Immediately, the temperature dropped. The whispers grew louder, more insistent, seeming to come from all directions at once. The trees pressed in around them, their branches reaching out like gnarled fingers.

"Don't listen to them," Kara warned, lighting a ball of blue fire to illuminate their path. "Master Thorne said the forest feeds on doubt and fear."

But even as she spoke, she could feel the darkness pressing against her mind, searching for weaknesses, for memories it could twist into weapons against her.

The real test was just beginning.`,
      },
    ];

    for (const chapter of chapters) {
      await projectManager.createFile(
        "chapters",
        chapter.name,
        chapter.content,
      );
    }

    // Create sample characters
    const characters = [
      {
        name: "Kara Brightblade",
        content: `# Kara Brightblade

*Created: ${new Date().toISOString().split("T")[0]}*

## Basic Information
- **Full Name:** Kara Brightblade
- **Age:** 18
- **Occupation:** Mage Apprentice / Hero
- **Location:** Originally from Eldoria

## Physical Description
- **Appearance:** Tall and athletic, with long auburn hair and piercing blue eyes
- **Distinguishing Features:** A crescent-shaped birthmark on her left shoulder, pendant from her mother

## Personality
- **Traits:** Determined, brave, sometimes impulsive
- **Motivations:** To avenge her mother's death and save the kingdom
- **Fears:** Failing those who depend on her, losing control of her powers
- **Flaws:** Quick to anger, trusts too easily

## Background
- **History:** Raised by her mother until age 12, then trained at the monastery
- **Family:** Mother (deceased), father unknown
- **Important Events:** Mother's death at the hands of the Shadow King's forces

## Role in Story
- **Purpose:** Main protagonist, chosen one with magical powers
- **Character Arc:** From uncertain apprentice to confident hero
- **Relationships:** Mentored by Master Thorne, allies with Flynn

## Magical Abilities
- **Primary Power:** Blue fire magic inherited from her bloodline
- **Secondary Abilities:** Healing, protective wards
- **Limitations:** Powers are tied to emotional state, can be overwhelming

## Notes
Kara represents the classic hero's journey, but with a focus on emotional growth and learning to balance power with responsibility.`,
      },
      {
        name: "Flynn Shadowheart",
        content: `# Flynn Shadowheart

*Created: ${new Date().toISOString().split("T")[0]}*

## Basic Information
- **Full Name:** Flynn Shadowheart
- **Age:** 19
- **Occupation:** Rogue / Thief / Reluctant Hero
- **Location:** Originally from the port city of Seahaven

## Physical Description
- **Appearance:** Medium height, lean build, dark hair and green eyes
- **Distinguishing Features:** Scar across his left eyebrow, quick smile

## Personality
- **Traits:** Charming, witty, loyal once trust is earned
- **Motivations:** Revenge against the Shadow King, protecting Kara
- **Fears:** Being abandoned, not being strong enough when it matters
- **Flaws:** Overly suspicious, hides his true feelings

## Background
- **History:** Grew up on the streets after his family was killed
- **Family:** Parents and younger sister (all deceased)
- **Important Events:** Witnessed his family's murder by Shadow King's forces

## Role in Story
- **Purpose:** Supporting protagonist, love interest, comic relief
- **Character Arc:** From lone wolf to trusted companion
- **Relationships:** Growing bond with Kara, antagonistic relationship with authority

## Skills and Abilities
- **Primary Skills:** Stealth, lock picking, swordsmanship
- **Secondary Abilities:** Street smarts, knowledge of criminal underworld
- **Limitations:** No magical abilities, haunted by past

## Notes
Flynn provides balance to Kara's magical abilities with practical skills and street knowledge. His tragic past parallels hers, creating a natural bond.`,
      },
    ];

    for (const character of characters) {
      await projectManager.createFile(
        "characters",
        character.name,
        character.content,
      );
    }

    // Create sample notes
    await projectManager.createFile(
      "notes",
      "World Building",
      `# World Building Notes

*Created: ${new Date().toISOString().split("T")[0]}*

## The Kingdom of Eldoria

### Geography
- **Capital:** Lightspire - A massive city built around a natural crystal formation
- **Major Cities:** Seahaven (port), Ironhold (mining), Greenwich (farming)
- **Dangerous Areas:** The Whispering Wood, Shadow Mountains, Deadlands

### Magic System
- **Source:** Ancient bloodlines connected to elemental forces
- **Types:** Fire, Water, Earth, Air, Light, Shadow
- **Limitations:** Requires training, emotional control, can be exhausting

### The Shadow King
- **Real Name:** Lord Malachar (formerly of House Nightfall)
- **History:** Once a noble who fell to dark magic seeking to save his dying wife
- **Powers:** Shadow manipulation, necromancy, corruption of other magics
- **Goal:** To plunge the world into eternal darkness where death has no meaning

### The Crystal of Eternal Light
- **Origin:** Created by the first light mages to counter shadow magic
- **Location:** Hidden in the Temple of the First Light in the Whispering Wood
- **Power:** Can purify corrupted magic and banish shadow creatures
- **Guardians:** Ancient light spirits that test the worthiness of seekers

## Plot Threads to Explore
- Kara's true parentage (is her father connected to the royal line?)
- Flynn's hidden magical potential (dormant due to trauma?)
- The prophecy mentioned in ancient texts
- Other crystals that might exist
- Rebellion movements in other kingdoms`,
    );

    // Create a sample scene
    await projectManager.createFile(
      "scenes",
      "The Crystal Chamber",
      `# The Crystal Chamber

*Created: ${new Date().toISOString().split("T")[0]}*

**Setting:** Deep within the Temple of the First Light
**Characters:** Kara, Flynn, the Guardian Spirit
**Purpose:** The climactic scene where Kara claims the Crystal

---

The chamber was vast and circular, its walls carved from pure white stone that seemed to glow with inner light. In the center, on a pedestal of crystal, sat the object of their quest—the Crystal of Eternal Light.

It was smaller than Kara had expected, no larger than her fist, but it pulsed with a radiance that made her eyes water. Each pulse sent waves of warmth through the chamber, driving back the shadows that had followed them through the forest.

"So beautiful," Flynn whispered beside her.

"And so dangerous," came a voice from nowhere and everywhere at once.

The air shimmered, and a figure materialized before them—tall, ethereal, with features that seemed to shift between male and female, young and old. The Guardian Spirit of the temple.

"Many have sought the Crystal," the Guardian said, its voice like wind chimes in a gentle breeze. "All have been found wanting. What makes you different, child of two worlds?"

Kara stepped forward, feeling the weight of destiny on her shoulders. "I don't know if I'm different. I only know that I have to try. Too many people are suffering because of the Shadow King."

The Guardian studied her with eyes like starlight. "And you, shadow-touched one?" it asked Flynn. "Why do you seek that which could destroy you?"

Flynn's hand instinctively went to his chest, where Kara knew the shadow mark from his family's murder still burned. "Because she asked me to come. Because I trust her. Because... because someone has to stand against the darkness."

The Guardian smiled, a expression of infinite sadness and hope. "Then take what you have earned. But know this—the Crystal's power comes with a price. Light casts shadows, and the brighter the light, the darker the shadow it creates."

Kara approached the pedestal, her heart pounding. The Crystal seemed to call to her, resonating with the magic in her blood. She reached out...

[Note: This scene needs to be expanded with the actual claiming of the crystal, the Guardian's test, and the immediate aftermath. Consider what the "price" might be—perhaps Kara must sacrifice some of her own light to power the Crystal?]`,
    );

    console.log(chalk.cyan("📝 Sample content created:"));
    console.log(`  • ${chapters.length} chapters`);
    console.log(`  • ${characters.length} character profiles`);
    console.log(`  • 1 world-building notes file`);
    console.log(`  • 1 scene draft`);
  }

  async showFeatures() {
    const features = `
${chalk.bold.green("🌟 GUI Features You'll Explore:")}

${chalk.bold("1. Dashboard Tab:")}
   • Real-time word count tracking
   • Progress visualization with goal percentage
   • Writing pace and daily averages
   • Quick project statistics

${chalk.bold("2. Files Tab:")}
   • Browse all chapters, scenes, characters, and notes
   • One-click file creation with + buttons
   • Word count display for each file
   • Easy navigation between content types

${chalk.bold("3. Statistics Tab:")}
   • Detailed project analytics
   • Chapter breakdown with reading times
   • Writing pattern analysis
   • Export-ready statistics

${chalk.bold("4. Settings Tab:")}
   • Project configuration (name, author, word goal)
   • Genre selection
   • Save settings functionality

${chalk.bold("5. Integrated Editor:")}
   • Full-featured text editing
   • Auto-save every 30 seconds
   • Real-time word count updates
   • Keyboard shortcuts

${chalk.bold("6. Additional Features:")}
   • Export project to HTML
   • Collapsible sidebar for focus mode
   • Responsive design
   • Dark theme for comfortable writing

${chalk.yellow("Starting GUI in 3 seconds...")}
`;

    console.log(
      boxen(features.trim(), {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "green",
      }),
    );

    // Wait a moment for user to read
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  async launchGUI() {
    console.log(chalk.cyan("🚀 Launching comprehensive GUI..."));

    try {
      // Check if electron is available
      require.resolve("electron");

      // Launch the GUI
      const electronPath = require("electron");
      const guiMainPath = path.join(__dirname, "gui", "main.js");

      const child = spawn(electronPath, ["--no-sandbox", guiMainPath], {
        stdio: "pipe",
        cwd: __dirname,
      });

      // Suppress most electron output
      child.stdout?.on("data", () => {});
      child.stderr?.on("data", (data) => {
        const output = data.toString();
        if (output.includes("ERROR") || output.includes("FATAL")) {
          console.error(chalk.red(output));
        }
      });

      child.on("error", (error) => {
        console.error(chalk.red("❌ Failed to start GUI:"), error.message);
        this.showManualInstructions();
        process.exit(1);
      });

      child.on("close", (code) => {
        console.log(
          chalk.cyan("\n👋 GUI closed. Demo project is ready for exploration!"),
        );
        this.showPostDemo();
        process.exit(code);
      });

      // Handle termination
      process.on("SIGINT", () => {
        child.kill("SIGINT");
      });

      process.on("SIGTERM", () => {
        child.kill("SIGTERM");
      });

      console.log(chalk.green("✅ GUI launched successfully!"));
      console.log(
        chalk.blue(
          "💡 The GUI is now running. Explore the features and close when done.",
        ),
      );
    } catch (error) {
      console.error(chalk.red("❌ Could not launch GUI:"), error.message);
      this.showManualInstructions();
    }
  }

  showManualInstructions() {
    const instructions = `
${chalk.bold.yellow("Manual Launch Instructions:")}

If the automatic GUI launch failed, you can start it manually:

${chalk.cyan("1. Install dependencies:")}
   npm install electron

${chalk.cyan("2. Launch GUI:")}
   npm run gui
   # or
   writers gui

${chalk.cyan("3. Open the demo project:")}
   • Click "Open Project"
   • Navigate to and select: ${this.demoProject}/

${chalk.yellow("The demo project contains sample chapters, characters, and notes for exploration.")}
`;

    console.log(
      boxen(instructions.trim(), {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "yellow",
      }),
    );
  }

  showPostDemo() {
    const postDemo = `
${chalk.bold.blue("🎉 Demo Complete!")}

${chalk.bold("What you experienced:")}
${chalk.green("•")} Complete project management interface
${chalk.green("•")} Real-time statistics and progress tracking
${chalk.green("•")} Integrated editor with auto-save
${chalk.green("•")} File organization and creation tools
${chalk.green("•")} Export functionality

${chalk.bold("Next steps:")}
${chalk.cyan("•")} Create your own project with: writers init
${chalk.cyan("•")} Launch GUI anytime with: writers gui
${chalk.cyan("•")} Use CLI commands alongside GUI interface
${chalk.cyan("•")} Explore advanced features in the documentation

${chalk.bold("Demo project location:")} ${this.demoProject}/
${chalk.gray("(You can delete this folder when done exploring)")}

${chalk.yellow("Happy writing! 📝")}
`;

    console.log(
      boxen(postDemo.trim(), {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "blue",
      }),
    );
  }
}

// Run the demo
if (require.main === module) {
  const demo = new GUIDemo();
  demo.run().catch((error) => {
    console.error(chalk.red("❌ Demo failed:"), error.message);
    process.exit(1);
  });
}

module.exports = GUIDemo;
