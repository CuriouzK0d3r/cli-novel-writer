const chalk = require("chalk");
const inquirer = require("inquirer");
const fs = require("fs-extra");
const path = require("path");
const { marked } = require("marked");
const projectManager = require("../utils/project");
const markdownUtils = require("../utils/markdown");

async function exportCommand(format, options) {
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

    console.log(
      chalk.blue.bold(`\n📤 Exporting to ${format.toUpperCase()}...\n`),
    );

    const config = await projectManager.getConfig();

    // Validate format
    const supportedFormats = ["html", "markdown", "text", "json"];
    if (!supportedFormats.includes(format.toLowerCase())) {
      console.log(chalk.red(`❌ Unsupported format: ${format}`));
      console.log(
        chalk.yellow(`Supported formats: ${supportedFormats.join(", ")}`),
      );
      return;
    }

    // Get export options
    const exportOptions = await getExportOptions(format, options);

    // Collect content to export
    const content = await collectContent(exportOptions);

    if (content.chapters.length === 0 && content.scenes.length === 0) {
      console.log(chalk.yellow("⚠️  No content found to export."));
      console.log(
        chalk.blue('Create content with: writers new chapter "Your Chapter"'),
      );
      return;
    }

    // Generate export
    const exportData = await generateExport(
      content,
      format,
      exportOptions,
      config,
    );

    // Save export
    const outputPath = await saveExport(exportData, format, exportOptions);

    console.log(chalk.green(`✅ Export completed successfully!`));
    console.log(chalk.cyan(`📁 Output: ${outputPath}`));

    // Show export statistics
    showExportStats(content, exportData);
  } catch (error) {
    console.error(chalk.red("❌ Error during export:"), error.message);
  }
}

async function getExportOptions(format, options) {
  const questions = [];

  // Specific chapters
  if (!options.chapters) {
    const chapters = await projectManager.getFiles("chapters");
    if (chapters.length > 0) {
      questions.push({
        type: "checkbox",
        name: "selectedChapters",
        message: "Select chapters to export (or none for all):",
        choices: chapters.map((c) => ({ name: c.name, value: c.name })),
        validate: (answer) => {
          // Allow empty selection (export all)
          return true;
        },
      });
    }
  }

  // Include scenes
  const scenes = await projectManager.getFiles("scenes");
  if (scenes.length > 0) {
    questions.push({
      type: "confirm",
      name: "includeScenes",
      message: "Include scenes in export?",
      default: false,
    });
  }

  // Include characters
  const characters = await projectManager.getFiles("characters");
  if (characters.length > 0) {
    questions.push({
      type: "confirm",
      name: "includeCharacters",
      message: "Include character profiles?",
      default: false,
    });
  }

  // Include notes
  const notes = await projectManager.getFiles("notes");
  if (notes.length > 0) {
    questions.push({
      type: "confirm",
      name: "includeNotes",
      message: "Include notes and research?",
      default: false,
    });
  }

  // Table of contents
  if (format === "html" || format === "markdown") {
    questions.push({
      type: "confirm",
      name: "includeTableOfContents",
      message: "Include table of contents?",
      default: true,
    });
  }

  // Title page
  questions.push({
    type: "confirm",
    name: "includeTitlePage",
    message: "Include title page?",
    default: true,
  });

  // Output filename
  if (!options.output) {
    questions.push({
      type: "input",
      name: "outputFilename",
      message: "Output filename (without extension):",
      default: "novel-export",
      validate: (input) => {
        if (input.trim().length === 0) {
          return "Filename cannot be empty";
        }
        return true;
      },
    });
  }

  const answers = await inquirer.prompt(questions);

  return {
    selectedChapters: options.chapters
      ? options.chapters.split(",")
      : answers.selectedChapters || [],
    includeScenes: answers.includeScenes || false,
    includeCharacters: answers.includeCharacters || false,
    includeNotes: answers.includeNotes || false,
    includeTableOfContents: answers.includeTableOfContents || false,
    includeTitlePage: answers.includeTitlePage || false,
    outputFilename: options.output || answers.outputFilename,
  };
}

async function collectContent(exportOptions) {
  const content = {
    chapters: [],
    scenes: [],
    characters: [],
    notes: [],
  };

  // Collect chapters
  const allChapters = await projectManager.getFiles("chapters");
  const chaptersToExport =
    exportOptions.selectedChapters.length > 0
      ? allChapters.filter((c) =>
          exportOptions.selectedChapters.includes(c.name),
        )
      : allChapters;

  for (const chapter of chaptersToExport) {
    try {
      const fileContent = await fs.readFile(chapter.path, "utf8");
      const { metadata, content: mainContent } =
        markdownUtils.extractFrontMatter(fileContent);

      content.chapters.push({
        name: chapter.name,
        path: chapter.path,
        content: mainContent,
        metadata,
        words: markdownUtils.countWords(fileContent),
      });
    } catch (error) {
      console.warn(chalk.yellow(`⚠️  Could not read chapter: ${chapter.name}`));
    }
  }

  // Collect scenes if requested
  if (exportOptions.includeScenes) {
    const scenes = await projectManager.getFiles("scenes");
    for (const scene of scenes) {
      try {
        const fileContent = await fs.readFile(scene.path, "utf8");
        const { metadata, content: mainContent } =
          markdownUtils.extractFrontMatter(fileContent);

        content.scenes.push({
          name: scene.name,
          path: scene.path,
          content: mainContent,
          metadata,
          words: markdownUtils.countWords(fileContent),
        });
      } catch (error) {
        console.warn(chalk.yellow(`⚠️  Could not read scene: ${scene.name}`));
      }
    }
  }

  // Collect characters if requested
  if (exportOptions.includeCharacters) {
    const characters = await projectManager.getFiles("characters");
    for (const character of characters) {
      try {
        const fileContent = await fs.readFile(character.path, "utf8");
        const { metadata, content: mainContent } =
          markdownUtils.extractFrontMatter(fileContent);

        content.characters.push({
          name: character.name,
          path: character.path,
          content: mainContent,
          metadata,
        });
      } catch (error) {
        console.warn(
          chalk.yellow(`⚠️  Could not read character: ${character.name}`),
        );
      }
    }
  }

  // Collect notes if requested
  if (exportOptions.includeNotes) {
    const notes = await projectManager.getFiles("notes");
    for (const note of notes) {
      try {
        const fileContent = await fs.readFile(note.path, "utf8");
        const { metadata, content: mainContent } =
          markdownUtils.extractFrontMatter(fileContent);

        content.notes.push({
          name: note.name,
          path: note.path,
          content: mainContent,
          metadata,
        });
      } catch (error) {
        console.warn(chalk.yellow(`⚠️  Could not read note: ${note.name}`));
      }
    }
  }

  return content;
}

async function generateExport(content, format, exportOptions, config) {
  switch (format.toLowerCase()) {
    case "html":
      return generateHtmlExport(content, exportOptions, config);
    case "markdown":
      return generateMarkdownExport(content, exportOptions, config);
    case "text":
      return generateTextExport(content, exportOptions, config);
    case "json":
      return generateJsonExport(content, exportOptions, config);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

function generateHtmlExport(content, exportOptions, config) {
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.name}</title>
    <style>
        body {
            font-family: 'Georgia', 'Times New Roman', serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        .title-page {
            text-align: center;
            padding: 100px 0;
            border-bottom: 2px solid #ddd;
            margin-bottom: 50px;
        }
        .title {
            font-size: 2.5em;
            margin-bottom: 20px;
            font-weight: normal;
        }
        .author {
            font-size: 1.2em;
            color: #666;
        }
        .toc {
            margin-bottom: 50px;
            padding: 20px;
            background: #f9f9f9;
            border-left: 4px solid #007acc;
        }
        .toc h2 {
            margin-top: 0;
        }
        .toc ul {
            list-style: none;
            padding-left: 0;
        }
        .toc li {
            margin: 10px 0;
        }
        .toc a {
            color: #007acc;
            text-decoration: none;
        }
        .toc a:hover {
            text-decoration: underline;
        }
        .chapter {
            margin-bottom: 50px;
            page-break-before: always;
        }
        .chapter-title {
            font-size: 2em;
            margin-bottom: 30px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 10px;
        }
        .section {
            margin-bottom: 40px;
        }
        .section-title {
            font-size: 1.5em;
            margin-bottom: 20px;
            color: #007acc;
        }
        blockquote {
            border-left: 4px solid #ddd;
            padding-left: 20px;
            margin: 20px 0;
            font-style: italic;
        }
        @media print {
            body { font-size: 12pt; }
            .chapter { page-break-before: always; }
        }
    </style>
</head>
<body>`;

  // Title page
  if (exportOptions.includeTitlePage) {
    html += `
    <div class="title-page">
        <h1 class="title">${config.name}</h1>
        <p class="author">by ${config.author}</p>
        <p class="export-date">Exported on ${new Date().toLocaleDateString()}</p>
    </div>`;
  }

  // Table of contents
  if (exportOptions.includeTableOfContents) {
    html += `
    <div class="toc">
        <h2>Table of Contents</h2>
        <ul>`;

    content.chapters.forEach((chapter, index) => {
      const anchor = markdownUtils.generateAnchor(chapter.name);
      html += `<li><a href="#${anchor}">${chapter.name}</a></li>`;
    });

    if (content.scenes.length > 0) {
      html += `<li><a href="#scenes">Scenes</a></li>`;
    }
    if (content.characters.length > 0) {
      html += `<li><a href="#characters">Characters</a></li>`;
    }
    if (content.notes.length > 0) {
      html += `<li><a href="#notes">Notes</a></li>`;
    }

    html += `
        </ul>
    </div>`;
  }

  // Chapters
  content.chapters.forEach((chapter) => {
    const anchor = markdownUtils.generateAnchor(chapter.name);
    html += `
    <div class="chapter" id="${anchor}">
        <h1 class="chapter-title">${chapter.name}</h1>
        ${markdownUtils.renderToHtml(chapter.content)}
    </div>`;
  });

  // Scenes
  if (content.scenes.length > 0) {
    html += `
    <div class="section" id="scenes">
        <h1 class="section-title">Scenes</h1>`;

    content.scenes.forEach((scene) => {
      html += `
        <div class="chapter">
            <h2 class="chapter-title">${scene.name}</h2>
            ${markdownUtils.renderToHtml(scene.content)}
        </div>`;
    });

    html += `</div>`;
  }

  // Characters
  if (content.characters.length > 0) {
    html += `
    <div class="section" id="characters">
        <h1 class="section-title">Characters</h1>`;

    content.characters.forEach((character) => {
      html += `
        <div class="chapter">
            <h2 class="chapter-title">${character.name}</h2>
            ${markdownUtils.renderToHtml(character.content)}
        </div>`;
    });

    html += `</div>`;
  }

  // Notes
  if (content.notes.length > 0) {
    html += `
    <div class="section" id="notes">
        <h1 class="section-title">Notes</h1>`;

    content.notes.forEach((note) => {
      html += `
        <div class="chapter">
            <h2 class="chapter-title">${note.name}</h2>
            ${markdownUtils.renderToHtml(note.content)}
        </div>`;
    });

    html += `</div>`;
  }

  html += `
</body>
</html>`;

  return html;
}

function generateMarkdownExport(content, exportOptions, config) {
  let markdown = "";

  // Title page
  if (exportOptions.includeTitlePage) {
    markdown += `# ${config.name}

**Author:** ${config.author}
**Exported:** ${new Date().toLocaleDateString()}

---

`;
  }

  // Table of contents
  if (exportOptions.includeTableOfContents) {
    markdown += `## Table of Contents

`;

    content.chapters.forEach((chapter) => {
      const anchor = markdownUtils.generateAnchor(chapter.name);
      markdown += `- [${chapter.name}](#${anchor})\n`;
    });

    if (content.scenes.length > 0) {
      markdown += `- [Scenes](#scenes)\n`;
    }
    if (content.characters.length > 0) {
      markdown += `- [Characters](#characters)\n`;
    }
    if (content.notes.length > 0) {
      markdown += `- [Notes](#notes)\n`;
    }

    markdown += "\n---\n\n";
  }

  // Chapters
  content.chapters.forEach((chapter) => {
    markdown += `# ${chapter.name}\n\n`;
    markdown += chapter.content + "\n\n";
    markdown += "---\n\n";
  });

  // Scenes
  if (content.scenes.length > 0) {
    markdown += `# Scenes\n\n`;
    content.scenes.forEach((scene) => {
      markdown += `## ${scene.name}\n\n`;
      markdown += scene.content + "\n\n";
    });
    markdown += "---\n\n";
  }

  // Characters
  if (content.characters.length > 0) {
    markdown += `# Characters\n\n`;
    content.characters.forEach((character) => {
      markdown += `## ${character.name}\n\n`;
      markdown += character.content + "\n\n";
    });
    markdown += "---\n\n";
  }

  // Notes
  if (content.notes.length > 0) {
    markdown += `# Notes\n\n`;
    content.notes.forEach((note) => {
      markdown += `## ${note.name}\n\n`;
      markdown += note.content + "\n\n";
    });
  }

  return markdown;
}

function generateTextExport(content, exportOptions, config) {
  let text = "";

  // Title page
  if (exportOptions.includeTitlePage) {
    text += `${config.name.toUpperCase()}\n`;
    text += `${"=".repeat(config.name.length)}\n\n`;
    text += `Author: ${config.author}\n`;
    text += `Exported: ${new Date().toLocaleDateString()}\n\n`;
    text += `${"-".repeat(60)}\n\n`;
  }

  // Chapters
  content.chapters.forEach((chapter) => {
    text += `${chapter.name.toUpperCase()}\n`;
    text += `${"=".repeat(chapter.name.length)}\n\n`;
    text += markdownUtils.stripMarkdown(chapter.content) + "\n\n";
    text += `${"-".repeat(60)}\n\n`;
  });

  // Scenes
  if (content.scenes.length > 0) {
    text += `SCENES\n`;
    text += `${"=".repeat(6)}\n\n`;
    content.scenes.forEach((scene) => {
      text += `${scene.name}\n`;
      text += `${"-".repeat(scene.name.length)}\n\n`;
      text += markdownUtils.stripMarkdown(scene.content) + "\n\n";
    });
    text += `${"-".repeat(60)}\n\n`;
  }

  // Characters
  if (content.characters.length > 0) {
    text += `CHARACTERS\n`;
    text += `${"=".repeat(10)}\n\n`;
    content.characters.forEach((character) => {
      text += `${character.name}\n`;
      text += `${"-".repeat(character.name.length)}\n\n`;
      text += markdownUtils.stripMarkdown(character.content) + "\n\n";
    });
    text += `${"-".repeat(60)}\n\n`;
  }

  // Notes
  if (content.notes.length > 0) {
    text += `NOTES\n`;
    text += `${"=".repeat(5)}\n\n`;
    content.notes.forEach((note) => {
      text += `${note.name}\n`;
      text += `${"-".repeat(note.name.length)}\n\n`;
      text += markdownUtils.stripMarkdown(note.content) + "\n\n";
    });
  }

  return text;
}

function generateJsonExport(content, exportOptions, config) {
  const exportData = {
    metadata: {
      title: config.name,
      author: config.author,
      exported: new Date().toISOString(),
      wordGoal: config.wordGoal,
      exportOptions: exportOptions,
    },
    statistics: {
      totalChapters: content.chapters.length,
      totalScenes: content.scenes.length,
      totalCharacters: content.characters.length,
      totalNotes: content.notes.length,
      totalWords:
        content.chapters.reduce((sum, c) => sum + c.words, 0) +
        content.scenes.reduce((sum, s) => sum + s.words, 0),
    },
    content: {
      chapters: content.chapters.map((chapter) => ({
        name: chapter.name,
        content: chapter.content,
        metadata: chapter.metadata,
        words: chapter.words,
      })),
      scenes: content.scenes.map((scene) => ({
        name: scene.name,
        content: scene.content,
        metadata: scene.metadata,
        words: scene.words,
      })),
      characters: content.characters.map((character) => ({
        name: character.name,
        content: character.content,
        metadata: character.metadata,
      })),
      notes: content.notes.map((note) => ({
        name: note.name,
        content: note.content,
        metadata: note.metadata,
      })),
    },
  };

  return JSON.stringify(exportData, null, 2);
}

async function saveExport(exportData, format, exportOptions) {
  await fs.ensureDir("exports");

  const timestamp = new Date().toISOString().split("T")[0];
  const extension = format === "text" ? "txt" : format;
  const filename = `${exportOptions.outputFilename}-${timestamp}.${extension}`;
  const outputPath = path.join("exports", filename);

  await fs.writeFile(outputPath, exportData, "utf8");

  return outputPath;
}

function showExportStats(content, exportData) {
  console.log(chalk.bold("\n📊 Export Statistics:"));

  const totalChapters = content.chapters.length;
  const totalScenes = content.scenes.length;
  const totalCharacters = content.characters.length;
  const totalNotes = content.notes.length;

  const totalWords =
    content.chapters.reduce((sum, c) => sum + c.words, 0) +
    content.scenes.reduce((sum, s) => sum + s.words, 0);

  const fileSize = Buffer.byteLength(exportData, "utf8");
  const fileSizeKB = Math.round(fileSize / 1024);

  console.log(`   Chapters: ${chalk.cyan(totalChapters)}`);
  if (totalScenes > 0) console.log(`   Scenes: ${chalk.cyan(totalScenes)}`);
  if (totalCharacters > 0)
    console.log(`   Characters: ${chalk.cyan(totalCharacters)}`);
  if (totalNotes > 0) console.log(`   Notes: ${chalk.cyan(totalNotes)}`);

  console.log(`   Total Words: ${chalk.cyan(totalWords.toLocaleString())}`);
  console.log(`   File Size: ${chalk.cyan(fileSizeKB)}KB`);

  const readingTime = markdownUtils.estimateReadingTimeFromWords(totalWords);
  console.log(`   Reading Time: ${chalk.cyan(readingTime)}`);

  console.log(chalk.bold("\n💡 Tips:"));
  console.log("   • Use HTML export for sharing or web publishing");
  console.log("   • Use Markdown export for further editing");
  console.log("   • Use Text export for word processors");
  console.log("   • Use JSON export for data analysis or backup");
}

module.exports = exportCommand;
