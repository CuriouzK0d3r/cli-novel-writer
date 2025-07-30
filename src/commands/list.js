const chalk = require("chalk");
const inquirer = require("inquirer");
const fs = require("fs-extra");
const path = require("path");
const projectManager = require("../utils/project");
const markdownUtils = require("../utils/markdown");

async function listCommand(options) {
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

    console.log(chalk.blue.bold("\n📁 Project Contents\n"));

    const typeFilter = options.type;

    if (typeFilter) {
      await showFilteredList(typeFilter);
    } else {
      await showCompleteList();
    }
  } catch (error) {
    console.error(chalk.red("❌ Error listing files:"), error.message);
  }
}

async function showCompleteList() {
  const categories = [
    { name: "chapters", icon: "📖", color: chalk.blue },
    { name: "scenes", icon: "🎬", color: chalk.green },
    { name: "characters", icon: "👤", color: chalk.yellow },
    { name: "notes", icon: "📝", color: chalk.magenta },
    { name: "shortstories", icon: "📚", color: chalk.cyan },
  ];

  let totalFiles = 0;
  let totalWords = 0;

  for (const category of categories) {
    const files = await projectManager.getFiles(category.name);

    if (files.length === 0) {
      console.log(
        `${category.icon} ${category.color.bold(category.name.toUpperCase())}`,
      );
      console.log(chalk.gray("   No files found\n"));
      continue;
    }

    console.log(
      `${category.icon} ${category.color.bold(category.name.toUpperCase())} (${files.length} files)`,
    );

    // Sort files by modification time (most recent first)
    const filesWithStats = await Promise.all(
      files.map(async (file) => {
        try {
          const stats = await fs.stat(file.path);
          const content = await fs.readFile(file.path, "utf8");
          const words = markdownUtils.countWords(content);

          return {
            ...file,
            modified: stats.mtime,
            words,
            size: stats.size,
          };
        } catch (error) {
          return {
            ...file,
            modified: new Date(0),
            words: 0,
            size: 0,
            error: true,
          };
        }
      }),
    );

    const sortedFiles = filesWithStats.sort((a, b) => b.modified - a.modified);

    for (const file of sortedFiles) {
      const modifiedDate = file.modified.toLocaleDateString();
      const readingTime = markdownUtils.estimateReadingTimeFromWords(
        file.words,
      );

      let statusIcon = "📄";
      if (file.error) {
        statusIcon = "❌";
      } else if (file.words === 0) {
        statusIcon = "📋";
      } else if (file.words > 3000) {
        statusIcon = "📚";
      }

      console.log(`   ${statusIcon} ${chalk.bold(file.name)}`);

      if (file.error) {
        console.log(chalk.red("       Error reading file"));
      } else {
        console.log(
          `       ${file.words} words • ${readingTime} • Modified: ${modifiedDate}`,
        );
      }

      totalFiles++;
      totalWords += file.words;
    }
    console.log("");
  }

  // Summary
  if (totalFiles > 0) {
    console.log(chalk.bold("📊 Summary:"));
    console.log(`   Total Files: ${chalk.cyan(totalFiles)}`);
    console.log(`   Total Words: ${chalk.cyan(totalWords.toLocaleString())}`);
    console.log(
      `   Avg Words per File: ${chalk.cyan(Math.round(totalWords / totalFiles))}`,
    );

    const totalReadingTime =
      markdownUtils.estimateReadingTimeFromWords(totalWords);
    console.log(`   Total Reading Time: ${chalk.cyan(totalReadingTime)}`);
  }

  // Quick actions
  console.log(chalk.bold("\n💡 Quick Actions:"));
  console.log(
    `   Create new content: ${chalk.yellow('writers new <type> "<name>"')}`,
  );
  console.log(`   Start writing: ${chalk.yellow("writers write <name>")}`);
  console.log(`   View statistics: ${chalk.yellow("writers stats")}`);
}

async function showFilteredList(typeFilter) {
  const typeMap = {
    chapter: "chapters",
    chapters: "chapters",
    scene: "scenes",
    scenes: "scenes",
    character: "characters",
    characters: "characters",
    note: "notes",
    notes: "notes",
    shortstory: "shortstories",
    shortstories: "shortstories",
  };

  const category = typeMap[typeFilter.toLowerCase()];

  if (!category) {
    console.log(chalk.red(`❌ Invalid type: ${typeFilter}`));
    console.log(
      chalk.yellow(
        "Valid types: chapters, scenes, characters, notes, shortstories",
      ),
    );
    return;
  }

  const files = await projectManager.getFiles(category);

  if (files.length === 0) {
    console.log(chalk.yellow(`No ${category} found.`));
    console.log(
      chalk.blue(
        `Create one with: ${chalk.yellow(`writers new ${category === "shortstories" ? "shortstory" : category.slice(0, -1)} "<n>"`)}`,
      ),
    );
    return;
  }

  const icon = {
    chapters: "📖",
    scenes: "🎬",
    characters: "👤",
    notes: "📝",
    shortstories: "📚",
  }[category];

  const color = {
    chapters: chalk.blue,
    scenes: chalk.green,
    characters: chalk.yellow,
    notes: chalk.magenta,
    shortstories: chalk.cyan,
  }[category];

  console.log(
    `${icon} ${color.bold(category.toUpperCase())} (${files.length} files)\n`,
  );

  // Get detailed file information
  const filesWithDetails = await Promise.all(
    files.map(async (file) => {
      try {
        const stats = await fs.stat(file.path);
        const content = await fs.readFile(file.path, "utf8");
        const words = markdownUtils.countWords(content);
        const { metadata } = markdownUtils.extractFrontMatter(content);
        const headings = markdownUtils.extractHeadings(content);

        return {
          ...file,
          modified: stats.mtime,
          created: stats.birthtime,
          words,
          size: stats.size,
          metadata,
          headings: headings.length,
        };
      } catch (error) {
        return {
          ...file,
          modified: new Date(0),
          created: new Date(0),
          words: 0,
          size: 0,
          metadata: {},
          headings: 0,
          error: true,
        };
      }
    }),
  );

  // Sort by modification time (most recent first)
  const sortedFiles = filesWithDetails.sort((a, b) => b.modified - a.modified);

  // Display in table format
  console.log(
    chalk.bold(
      sprintf(
        "%-25s %8s %12s %15s %10s",
        "Name",
        "Words",
        "Headings",
        "Modified",
        "Reading",
      ),
    ),
  );
  console.log(chalk.gray("─".repeat(80)));

  for (const file of sortedFiles) {
    if (file.error) {
      console.log(
        sprintf(
          "%-25s %s",
          truncateString(file.name, 24),
          chalk.red("Error reading file"),
        ),
      );
      continue;
    }

    const modifiedDate = file.modified.toLocaleDateString();
    const readingTime = markdownUtils.estimateReadingTimeFromWords(file.words);
    const wordColor = getWordCountColor(file.words);

    console.log(
      sprintf(
        "%-25s %s %12s %15s %10s",
        truncateString(file.name, 24),
        wordColor(sprintf("%8s", file.words.toLocaleString())),
        file.headings,
        modifiedDate,
        readingTime,
      ),
    );

    // Show metadata if available
    if (Object.keys(file.metadata).length > 0) {
      const metaItems = Object.entries(file.metadata)
        .slice(0, 3)
        .map(([key, value]) => `${key}: ${value}`)
        .join(" • ");

      if (metaItems) {
        console.log(chalk.gray(`   ${truncateString(metaItems, 70)}`));
      }
    }
  }

  console.log(chalk.gray("─".repeat(80)));

  // Category-specific statistics
  const totalWords = sortedFiles.reduce((sum, file) => sum + file.words, 0);
  const avgWords = Math.round(totalWords / sortedFiles.length);
  const totalReadingTime =
    markdownUtils.estimateReadingTimeFromWords(totalWords);

  console.log(
    sprintf(
      "%-25s %s %12s %15s %10s",
      chalk.bold("TOTAL"),
      chalk.bold(sprintf("%8s", totalWords.toLocaleString())),
      chalk.bold(sortedFiles.reduce((sum, file) => sum + file.headings, 0)),
      "",
      chalk.bold(totalReadingTime),
    ),
  );

  console.log(chalk.bold(`\n📊 ${category.toUpperCase()} STATISTICS:`));
  console.log(`   Total: ${chalk.cyan(sortedFiles.length)} files`);
  console.log(`   Total Words: ${chalk.cyan(totalWords.toLocaleString())}`);
  console.log(
    `   Average: ${chalk.cyan(avgWords)} words per ${category.slice(0, -1)}`,
  );

  if (category === "chapters") {
    // Chapter-specific insights
    const shortestChapter = sortedFiles.reduce(
      (min, file) => (file.words < min.words ? file : min),
      sortedFiles[0],
    );
    const longestChapter = sortedFiles.reduce(
      (max, file) => (file.words > max.words ? file : max),
      sortedFiles[0],
    );

    console.log(
      `   Shortest: ${chalk.yellow(shortestChapter.name)} (${shortestChapter.words} words)`,
    );
    console.log(
      `   Longest: ${chalk.green(longestChapter.name)} (${longestChapter.words} words)`,
    );
  }

  // Recent activity
  const recentFiles = sortedFiles.slice(0, 3);
  if (recentFiles.length > 0) {
    console.log(chalk.bold("\n⏰ Recently Modified:"));
    recentFiles.forEach((file) => {
      const timeAgo = getTimeAgo(file.modified);
      console.log(`   ${chalk.cyan("•")} ${file.name} (${timeAgo})`);
    });
  }

  // Interactive options
  if (sortedFiles.length > 0) {
    console.log(chalk.bold("\n🔧 Actions:"));

    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: `What would you like to do with these ${category}?`,
        choices: [
          {
            name: `Edit a ${category === "shortstories" ? "short story" : category.slice(0, -1)}`,
            value: "edit",
          },
          {
            name: `Create new ${category === "shortstories" ? "short story" : category.slice(0, -1)}`,
            value: "new",
          },
          { name: "Show detailed stats", value: "stats" },
          { name: "Export list", value: "export" },
          { name: "Nothing", value: "none" },
        ],
      },
    ]);

    await handleAction(action, category, sortedFiles);
  }
}

async function handleAction(action, category, files) {
  switch (action) {
    case "edit":
      const { fileToEdit } = await inquirer.prompt([
        {
          type: "list",
          name: "fileToEdit",
          message: "Select file to edit:",
          choices: files.map((f) => ({
            name: `${f.name} (${f.words} words)`,
            value: f.name,
          })),
        },
      ]);

      const writeCommand = require("./write");
      await writeCommand(fileToEdit);
      break;

    case "new":
      const newCommand = require("./new");
      await newCommand(
        category === "shortstories" ? "shortstory" : category.slice(0, -1),
      );
      break;

    case "stats":
      if (category === "chapters") {
        const statsCommand = require("./stats");
        await statsCommand({ detailed: true });
      } else {
        console.log(chalk.blue(`\nDetailed stats for ${category}:`));
        // Show additional stats specific to this category
        await showCategoryStats(category, files);
      }
      break;

    case "export":
      await exportFileList(category, files);
      break;

    case "none":
    default:
      console.log(chalk.gray("No action taken."));
      break;
  }
}

async function showCategoryStats(category, files) {
  const totalWords = files.reduce((sum, file) => sum + file.words, 0);

  console.log(`\n📈 ${category.toUpperCase()} ANALYSIS:`);

  // Word count distribution
  const ranges = {
    "Empty (0 words)": files.filter((f) => f.words === 0).length,
    "Short (1-500 words)": files.filter((f) => f.words > 0 && f.words <= 500)
      .length,
    "Medium (501-1500 words)": files.filter(
      (f) => f.words > 500 && f.words <= 1500,
    ).length,
    "Long (1501-3000 words)": files.filter(
      (f) => f.words > 1500 && f.words <= 3000,
    ).length,
    "Very Long (3000+ words)": files.filter((f) => f.words > 3000).length,
  };

  console.log("\nWord Count Distribution:");
  for (const [range, count] of Object.entries(ranges)) {
    if (count > 0) {
      const percentage = Math.round((count / files.length) * 100);
      const bar = "█".repeat(Math.max(1, Math.round(percentage / 5)));
      console.log(`  ${range}: ${chalk.blue(bar)} ${count} (${percentage}%)`);
    }
  }

  // Recent activity pattern
  const now = new Date();
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const recentActivity = {
    "Last 7 days": files.filter((f) => f.modified > lastWeek).length,
    "Last 30 days": files.filter((f) => f.modified > lastMonth).length,
    Older: files.filter((f) => f.modified <= lastMonth).length,
  };

  console.log("\nActivity Pattern:");
  for (const [period, count] of Object.entries(recentActivity)) {
    if (count > 0) {
      console.log(`  ${period}: ${chalk.cyan(count)} files`);
    }
  }
}

async function exportFileList(category, files) {
  const exportData = {
    category,
    exportDate: new Date().toISOString(),
    totalFiles: files.length,
    totalWords: files.reduce((sum, file) => sum + file.words, 0),
    files: files.map((file) => ({
      name: file.name,
      path: file.path,
      words: file.words,
      modified: file.modified,
      metadata: file.metadata,
    })),
  };

  const exportPath = `exports/${category}-list-${new Date().toISOString().split("T")[0]}.json`;
  await fs.ensureDir("exports");
  await fs.writeJson(exportPath, exportData, { spaces: 2 });

  console.log(chalk.green(`✅ Exported ${category} list to: ${exportPath}`));
}

function getWordCountColor(words) {
  if (words === 0) return chalk.gray;
  if (words < 500) return chalk.red;
  if (words < 1500) return chalk.yellow;
  if (words < 3000) return chalk.blue;
  return chalk.green;
}

function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffDays > 7) return date.toLocaleDateString();
  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffMinutes > 0)
    return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`;
  return "Just now";
}

function sprintf(format, ...args) {
  let i = 0;
  return format.replace(/%-?\d*s/g, () => {
    const arg = args[i++];
    return arg !== undefined ? String(arg) : "";
  });
}

function truncateString(str, maxLength) {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + "...";
}

module.exports = listCommand;
