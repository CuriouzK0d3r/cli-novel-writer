const chalk = require("chalk");
const boxen = require("boxen");
const projectManager = require("../utils/project");
const markdownUtils = require("../utils/markdown");

async function statsCommand(options) {
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

    console.log(chalk.blue.bold("\n📊 Project Statistics\n"));

    const stats = await projectManager.getProjectStats();

    if (options.chapter) {
      await showChapterStats(options.chapter, stats);
    } else if (options.detailed) {
      await showDetailedStats(stats);
    } else {
      await showOverviewStats(stats);
    }
  } catch (error) {
    console.error(chalk.red("❌ Error getting statistics:"), error.message);
  }
}

async function showOverviewStats(stats) {
  const progress = Math.min(100, (stats.totalWords / stats.wordGoal) * 100);
  const wordsRemaining = Math.max(0, stats.wordGoal - stats.totalWords);

  // Calculate writing pace
  const startDate = new Date(stats.created);
  const daysSinceStart = Math.max(
    1,
    Math.ceil((new Date() - startDate) / (1000 * 60 * 60 * 24)),
  );
  const wordsPerDay = Math.round(stats.totalWords / daysSinceStart);

  // Estimate completion
  let estimatedCompletion = "N/A";
  if (wordsPerDay > 0 && wordsRemaining > 0) {
    const daysToComplete = Math.ceil(wordsRemaining / wordsPerDay);
    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + daysToComplete);
    estimatedCompletion = completionDate.toLocaleDateString();
  }

  const overview = `
${chalk.bold("📖 Project:")} ${chalk.cyan(stats.project)}
${chalk.bold("✍️  Author:")} ${chalk.cyan(stats.author)}
${chalk.bold("📅 Started:")} ${chalk.cyan(new Date(stats.created).toLocaleDateString())}

${chalk.bold("📊 Progress Overview")}
${generateProgressBar(progress, 30)}
${chalk.bold(`${stats.totalWords.toLocaleString()}`)} / ${stats.wordGoal.toLocaleString()} words (${chalk.bold(progress.toFixed(1) + "%")})

${chalk.bold("📈 Writing Statistics")}
${chalk.bold("Total Words:")} ${stats.totalWords.toLocaleString()}
${chalk.bold("Total Characters:")} ${stats.totalCharacters.toLocaleString()}
${chalk.bold("Words Remaining:")} ${wordsRemaining.toLocaleString()}
${chalk.bold("Daily Average:")} ${wordsPerDay} words/day
${chalk.bold("Est. Completion:")} ${estimatedCompletion}

${chalk.bold("📁 Content Summary")}
${chalk.bold("Chapters:")} ${stats.files.chapters}
${chalk.bold("Scenes:")} ${stats.files.scenes}
${chalk.bold("Characters:")} ${stats.files.characters}
${chalk.bold("Short Stories:")} ${stats.files.shortstories}
${chalk.bold("Notes:")} ${stats.files.notes}
`;

  console.log(
    boxen(overview.trim(), {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: "blue",
    }),
  );

  // Show recent chapters if any
  if (stats.chapters.length > 0) {
    console.log(chalk.bold("\n📚 Recent Chapters:"));
    const recentChapters = stats.chapters.slice(-3).reverse();

    for (const chapter of recentChapters) {
      const readingTime = markdownUtils.estimateReadingTimeFromWords(
        chapter.words,
      );
      console.log(`  ${chalk.cyan("•")} ${chalk.bold(chapter.name)}`);
      console.log(`    ${chapter.words} words • ${readingTime}`);
    }
  }

  // Writing tips based on progress
  console.log(chalk.bold("\n💡 Writing Insights:"));

  if (progress < 25) {
    console.log(
      chalk.green(
        "🌱 Great start! Keep building momentum with daily writing sessions.",
      ),
    );
  } else if (progress < 50) {
    console.log(
      chalk.blue(
        "🚀 You're making solid progress! Consider setting daily word goals.",
      ),
    );
  } else if (progress < 75) {
    console.log(
      chalk.yellow("⚡ Excellent progress! You're in the home stretch."),
    );
  } else if (progress < 100) {
    console.log(
      chalk.magenta("🎯 Almost there! Push through to the finish line."),
    );
  } else {
    console.log(
      chalk.rainbow("🎉 Congratulations! You've reached your word goal!"),
    );
  }

  if (wordsPerDay < 100) {
    console.log(
      chalk.gray("📝 Try to write a little each day to build consistency."),
    );
  } else if (wordsPerDay > 1000) {
    console.log(
      chalk.green("🔥 Impressive daily output! Keep up the great work."),
    );
  }
}

async function showDetailedStats(stats) {
  await showOverviewStats(stats);

  console.log(chalk.bold("\n📋 Detailed Chapter Breakdown:\n"));

  if (stats.chapters.length === 0) {
    console.log(
      chalk.gray('No chapters found. Create one with "writers new chapter"'),
    );
    return;
  }

  // Sort chapters by word count
  const sortedChapters = [...stats.chapters].sort((a, b) => b.words - a.words);

  // Create chapter table
  console.log(
    chalk.bold(
      sprintf(
        "%-25s %10s %15s %12s",
        "Chapter",
        "Words",
        "Characters",
        "Reading Time",
      ),
    ),
  );
  console.log(chalk.gray("─".repeat(70)));

  for (const chapter of sortedChapters) {
    const readingTime = markdownUtils.estimateReadingTimeFromWords(
      chapter.words,
    );
    const wordColor = getWordCountColor(chapter.words);

    console.log(
      sprintf(
        "%-25s %s %15s %12s",
        truncateString(chapter.name, 24),
        wordColor(sprintf("%10s", chapter.words.toLocaleString())),
        chapter.characters.toLocaleString(),
        readingTime,
      ),
    );
  }

  console.log(chalk.gray("─".repeat(70)));
  console.log(
    sprintf(
      "%-25s %s %15s",
      chalk.bold("TOTAL"),
      chalk.bold(sprintf("%10s", stats.totalWords.toLocaleString())),
      chalk.bold(stats.totalCharacters.toLocaleString()),
    ),
  );

  // Chapter length analysis
  console.log(chalk.bold("\n📐 Chapter Length Analysis:"));

  const averageWords = Math.round(stats.totalWords / stats.chapters.length);
  const shortestChapter = sortedChapters[sortedChapters.length - 1];
  const longestChapter = sortedChapters[0];

  console.log(`Average: ${chalk.cyan(averageWords)} words per chapter`);
  console.log(
    `Shortest: ${chalk.yellow(shortestChapter.name)} (${shortestChapter.words} words)`,
  );
  console.log(
    `Longest: ${chalk.green(longestChapter.name)} (${longestChapter.words} words)`,
  );

  // Length distribution
  const lengthRanges = {
    "Very Short (< 1000)": 0,
    "Short (1000-2000)": 0,
    "Medium (2000-4000)": 0,
    "Long (4000-6000)": 0,
    "Very Long (> 6000)": 0,
  };

  for (const chapter of stats.chapters) {
    if (chapter.words < 1000) lengthRanges["Very Short (< 1000)"]++;
    else if (chapter.words < 2000) lengthRanges["Short (1000-2000)"]++;
    else if (chapter.words < 4000) lengthRanges["Medium (2000-4000)"]++;
    else if (chapter.words < 6000) lengthRanges["Long (4000-6000)"]++;
    else lengthRanges["Very Long (> 6000)"]++;
  }

  console.log(chalk.bold("\n📊 Chapter Length Distribution:"));
  for (const [range, count] of Object.entries(lengthRanges)) {
    if (count > 0) {
      const bar = "█".repeat(
        Math.max(1, Math.round((count / stats.chapters.length) * 20)),
      );
      console.log(`${range}: ${chalk.blue(bar)} ${count}`);
    }
  }
}

async function showChapterStats(chapterName, stats) {
  const chapter = stats.chapters.find(
    (c) =>
      c.name.toLowerCase().includes(chapterName.toLowerCase()) ||
      projectManager.sanitizeFileName(c.name) === chapterName,
  );

  if (!chapter) {
    console.log(chalk.red(`❌ Chapter not found: ${chapterName}`));
    console.log(chalk.yellow("Available chapters:"));
    stats.chapters.forEach((c) => console.log(`  • ${c.name}`));
    return;
  }

  // Read chapter content for detailed analysis
  const content = await require("fs-extra").readFile(chapter.path, "utf8");
  const readingTime = markdownUtils.estimateReadingTime(content);
  const headings = markdownUtils.extractHeadings(content);
  const validation = markdownUtils.validateMarkdown(content);

  const chapterInfo = `
${chalk.bold("📖 Chapter:")} ${chalk.cyan(chapter.name)}
${chalk.bold("📄 File:")} ${chalk.gray(chapter.path)}

${chalk.bold("📊 Statistics")}
${chalk.bold("Words:")} ${chapter.words.toLocaleString()}
${chalk.bold("Characters:")} ${chapter.characters.toLocaleString()}
${chalk.bold("Reading Time:")} ${readingTime}

${chalk.bold("🏗️  Structure")}
${chalk.bold("Headings:")} ${headings.length}
${headings.length > 0 ? headings.map((h) => `${"  ".repeat(h.level)}${chalk.gray("#".repeat(h.level))} ${h.text}`).join("\n") : chalk.gray("  No headings found")}
`;

  console.log(
    boxen(chapterInfo.trim(), {
      padding: 1,
      margin: 1,
      borderStyle: "round",
      borderColor: "green",
    }),
  );

  // Validation results
  if (!validation.isValid || validation.warnings.length > 0) {
    console.log(chalk.bold("\n⚠️  Markdown Issues:"));

    if (validation.errors.length > 0) {
      console.log(chalk.red("Errors:"));
      validation.errors.forEach((error) =>
        console.log(`  ${chalk.red("•")} ${error}`),
      );
    }

    if (validation.warnings.length > 0) {
      console.log(chalk.yellow("Warnings:"));
      validation.warnings.forEach((warning) =>
        console.log(`  ${chalk.yellow("•")} ${warning}`),
      );
    }
  } else {
    console.log(chalk.green("\n✅ Markdown formatting looks good!"));
  }

  // Chapter comparison with project average
  const projectAverage = Math.round(stats.totalWords / stats.chapters.length);
  console.log(chalk.bold("\n📈 Comparison:"));

  if (chapter.words > projectAverage) {
    const difference = chapter.words - projectAverage;
    console.log(chalk.green(`📈 ${difference} words above project average`));
  } else if (chapter.words < projectAverage) {
    const difference = projectAverage - chapter.words;
    console.log(chalk.yellow(`📉 ${difference} words below project average`));
  } else {
    console.log(chalk.blue("📊 Exactly at project average"));
  }
}

function generateProgressBar(percentage, length = 20) {
  const filled = Math.round((percentage / 100) * length);
  const empty = length - filled;

  let bar = "";

  if (percentage === 0) {
    bar = chalk.gray("░".repeat(length));
  } else if (percentage === 100) {
    bar = chalk.green("█".repeat(length));
  } else {
    bar = chalk.green("█".repeat(filled)) + chalk.gray("░".repeat(empty));
  }

  return `[${bar}]`;
}

function getWordCountColor(words) {
  if (words < 500) return chalk.red;
  if (words < 1500) return chalk.yellow;
  if (words < 3000) return chalk.blue;
  return chalk.green;
}

function sprintf(format, ...args) {
  let i = 0;
  return format.replace(
    /%[-+#0 ]*\*?(?:\d+|\*)?(?:\.(?:\d+|\*))?[hlL]?[diouxXeEfFgGaAcspn%]/g,
    () => {
      return args[i++];
    },
  );
}

function truncateString(str, maxLength) {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + "...";
}

module.exports = statsCommand;
