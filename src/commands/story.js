const chalk = require("chalk");
const inquirer = require("inquirer");
const fs = require("fs").promises;
const path = require("path");
const projectManager = require("../utils/project");

async function storyCommand(action, storyName, options = {}) {
  try {
    // Check if in a writers project
    if (!projectManager.isWritersProject()) {
      console.log(
        chalk.red('❌ Not a Writers project. Run "writers init" or "writers init-shortstory" to initialize.')
      );
      return;
    }

    const config = await projectManager.getConfig();

    switch (action) {
      case 'list':
        await listStories(options);
        break;
      case 'status':
        await storyStatus(storyName, options);
        break;
      case 'move':
        await moveStory(storyName, options);
        break;
      case 'copy':
        await copyStory(storyName, options);
        break;
      case 'archive':
        await archiveStory(storyName, options);
        break;
      case 'submit':
        await prepareForSubmission(storyName, options);
        break;
      case 'stats':
        await storyStats(storyName, options);
        break;
      case 'search':
        await searchStories(storyName, options);
        break;
      case 'tags':
        await manageStoryTags(storyName, options);
        break;
      case 'notes':
        await storyNotes(storyName, options);
        break;
      default:
        console.log(chalk.red(`❌ Unknown action: ${action}`));
        showHelp();
    }
  } catch (error) {
    console.error(chalk.red("❌ Error:"), error.message);
  }
}

async function listStories(options) {
  console.log(chalk.blue.bold("\n📚 Story Collection Overview\n"));

  const directories = await getStoryDirectories();
  const stories = [];

  for (const dir of directories) {
    try {
      const files = await fs.readdir(dir);
      const markdownFiles = files.filter(file => file.endsWith('.md'));

      for (const file of markdownFiles) {
        const filePath = path.join(dir, file);
        const stats = await fs.stat(filePath);
        const content = await fs.readFile(filePath, 'utf8');

        const storyInfo = await parseStoryMetadata(content, filePath);
        stories.push({
          ...storyInfo,
          directory: path.basename(dir),
          fileName: file,
          lastModified: stats.mtime,
          size: stats.size
        });
      }
    } catch (error) {
      // Directory might not exist, skip it
    }
  }

  if (stories.length === 0) {
    console.log(chalk.yellow("📝 No stories found. Create your first story with:"));
    console.log(chalk.cyan('   writers new shortstory "Your Story Title"'));
    return;
  }

  // Filter stories if requested
  let filteredStories = stories;
  if (options.status) {
    filteredStories = stories.filter(s => s.status === options.status);
  }
  if (options.genre) {
    filteredStories = stories.filter(s => s.genre === options.genre);
  }
  if (options.tag) {
    filteredStories = stories.filter(s => s.tags && s.tags.includes(options.tag));
  }

  // Sort stories
  const sortBy = options.sort || 'modified';
  filteredStories.sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.title.localeCompare(b.title);
      case 'length':
        return (b.wordCount || 0) - (a.wordCount || 0);
      case 'status':
        return (a.status || '').localeCompare(b.status || '');
      case 'modified':
      default:
        return b.lastModified - a.lastModified;
    }
  });

  // Display stories
  if (options.detailed) {
    await displayDetailedStoryList(filteredStories);
  } else {
    await displayCompactStoryList(filteredStories);
  }

  // Show summary
  console.log(chalk.gray(`\n📊 Total: ${filteredStories.length} stories`));
  if (filteredStories.length !== stories.length) {
    console.log(chalk.gray(`    (${stories.length} total in project)`));
  }
}

async function displayCompactStoryList(stories) {
  const statusColors = {
    'planning': chalk.yellow,
    'drafting': chalk.blue,
    'revising': chalk.orange,
    'complete': chalk.green,
    'submitted': chalk.purple,
    'published': chalk.cyan
  };

  stories.forEach(story => {
    const statusColor = statusColors[story.status] || chalk.gray;
    const wordCount = story.wordCount ? chalk.gray(`(${story.wordCount} words)`) : '';
    const directory = chalk.dim(`[${story.directory}]`);

    console.log(
      `${statusColor('●')} ${chalk.bold(story.title)} ${wordCount} ${directory}`
    );

    if (story.genre) {
      console.log(`  ${chalk.dim(story.genre)}`);
    }

    if (story.tags && story.tags.length > 0) {
      const tagString = story.tags.map(tag => chalk.cyan(`#${tag}`)).join(' ');
      console.log(`  ${tagString}`);
    }

    console.log('');
  });
}

async function displayDetailedStoryList(stories) {
  console.log(chalk.bold("┌─────────────────────────────────────────────────────────────────────────┐"));
  console.log(chalk.bold("│ Title                    │ Status    │ Genre      │ Words │ Modified   │"));
  console.log(chalk.bold("├─────────────────────────────────────────────────────────────────────────┤"));

  stories.forEach(story => {
    const title = (story.title || 'Untitled').substring(0, 23).padEnd(23);
    const status = (story.status || 'unknown').substring(0, 8).padEnd(8);
    const genre = (story.genre || '').substring(0, 9).padEnd(9);
    const words = String(story.wordCount || 0).padStart(5);
    const modified = story.lastModified.toLocaleDateString().padEnd(10);

    console.log(`│ ${title} │ ${status} │ ${genre} │ ${words} │ ${modified} │`);
  });

  console.log(chalk.bold("└─────────────────────────────────────────────────────────────────────────┘"));
}

async function storyStatus(storyName, options) {
  if (!storyName) {
    console.log(chalk.red("❌ Please specify a story name"));
    return;
  }

  const storyPath = await findStoryFile(storyName);
  if (!storyPath) {
    console.log(chalk.red(`❌ Story "${storyName}" not found`));
    return;
  }

  const content = await fs.readFile(storyPath, 'utf8');
  const metadata = await parseStoryMetadata(content, storyPath);
  const stats = await fs.stat(storyPath);

  console.log(chalk.blue.bold(`\n📖 Story Status: ${metadata.title}\n`));

  console.log(chalk.bold("Basic Information:"));
  console.log(`  Title: ${chalk.cyan(metadata.title)}`);
  console.log(`  Status: ${getStatusDisplay(metadata.status)}`);
  console.log(`  Genre: ${chalk.yellow(metadata.genre || 'Not specified')}`);
  console.log(`  Word Count: ${chalk.green(metadata.wordCount || 0)} words`);
  console.log(`  Target Length: ${chalk.gray(metadata.targetLength || 'Not specified')}`);

  if (metadata.tags && metadata.tags.length > 0) {
    const tagString = metadata.tags.map(tag => chalk.cyan(`#${tag}`)).join(' ');
    console.log(`  Tags: ${tagString}`);
  }

  console.log(chalk.bold("\nFile Information:"));
  console.log(`  Location: ${chalk.dim(storyPath)}`);
  console.log(`  Last Modified: ${chalk.gray(stats.mtime.toLocaleString())}`);
  console.log(`  File Size: ${chalk.gray(formatBytes(stats.size))}`);

  if (metadata.theme) {
    console.log(chalk.bold("\nStory Details:"));
    console.log(`  Theme: ${chalk.magenta(metadata.theme)}`);
  }

  if (metadata.submissionHistory && metadata.submissionHistory.length > 0) {
    console.log(chalk.bold("\nSubmission History:"));
    metadata.submissionHistory.forEach(submission => {
      const status = submission.status === 'accepted' ? chalk.green('✓') :
                    submission.status === 'rejected' ? chalk.red('✗') :
                    chalk.yellow('◦');
      console.log(`  ${status} ${submission.publication} (${submission.date})`);
    });
  }

  // Calculate reading time
  const readingTime = Math.ceil((metadata.wordCount || 0) / 200);
  console.log(chalk.bold("\nReading Information:"));
  console.log(`  Estimated Reading Time: ${chalk.cyan(readingTime)} minutes`);

  // Show progress if status indicates work in progress
  if (['planning', 'drafting', 'revising'].includes(metadata.status)) {
    console.log(chalk.bold("\nProgress Notes:"));
    if (metadata.status === 'planning') {
      console.log(chalk.yellow("  📋 Story is in planning phase"));
    } else if (metadata.status === 'drafting') {
      console.log(chalk.blue("  ✍️  Story is being drafted"));
    } else if (metadata.status === 'revising') {
      console.log(chalk.orange("  🔧 Story is being revised"));
    }
  }
}

async function moveStory(storyName, options) {
  if (!storyName || !options.to) {
    console.log(chalk.red("❌ Usage: writers story move <story-name> --to <destination>"));
    console.log(chalk.gray("   Example: writers story move my-story --to drafts"));
    return;
  }

  const storyPath = await findStoryFile(storyName);
  if (!storyPath) {
    console.log(chalk.red(`❌ Story "${storyName}" not found`));
    return;
  }

  const validDestinations = ['stories', 'drafts', 'submission-ready', 'archive', 'experiments'];
  if (!validDestinations.includes(options.to)) {
    console.log(chalk.red(`❌ Invalid destination. Valid options: ${validDestinations.join(', ')}`));
    return;
  }

  const fileName = path.basename(storyPath);
  const destDir = options.to;
  const destPath = path.join(destDir, fileName);

  // Create destination directory if it doesn't exist
  await fs.mkdir(destDir, { recursive: true });

  // Move the file
  await fs.rename(storyPath, destPath);

  console.log(chalk.green(`✅ Moved "${storyName}" to ${destDir}/`));
}

async function copyStory(storyName, options) {
  if (!storyName || !options.as) {
    console.log(chalk.red("❌ Usage: writers story copy <story-name> --as <new-name>"));
    return;
  }

  const storyPath = await findStoryFile(storyName);
  if (!storyPath) {
    console.log(chalk.red(`❌ Story "${storyName}" not found`));
    return;
  }

  const content = await fs.readFile(storyPath, 'utf8');
  const newFileName = `${options.as.toLowerCase().replace(/\s+/g, '-')}.md`;
  const destPath = path.join(path.dirname(storyPath), newFileName);

  // Update the title in the copied content
  const updatedContent = content.replace(/^# .+$/m, `# ${options.as}`);

  await fs.writeFile(destPath, updatedContent);

  console.log(chalk.green(`✅ Copied "${storyName}" as "${options.as}"`));
}

async function archiveStory(storyName, options) {
  if (!storyName) {
    console.log(chalk.red("❌ Please specify a story name"));
    return;
  }

  const storyPath = await findStoryFile(storyName);
  if (!storyPath) {
    console.log(chalk.red(`❌ Story "${storyName}" not found`));
    return;
  }

  const archiveDir = 'archive';
  await fs.mkdir(archiveDir, { recursive: true });

  const fileName = path.basename(storyPath);
  const archivePath = path.join(archiveDir, fileName);

  await fs.rename(storyPath, archivePath);

  console.log(chalk.green(`✅ Archived "${storyName}" to archive/`));
}

async function prepareForSubmission(storyName, options) {
  if (!storyName) {
    console.log(chalk.red("❌ Please specify a story name"));
    return;
  }

  const storyPath = await findStoryFile(storyName);
  if (!storyPath) {
    console.log(chalk.red(`❌ Story "${storyName}" not found`));
    return;
  }

  const submissionDir = 'submission-ready';
  await fs.mkdir(submissionDir, { recursive: true });

  const content = await fs.readFile(storyPath, 'utf8');
  const metadata = await parseStoryMetadata(content, storyPath);

  // Generate submission-ready version
  const submissionContent = await generateSubmissionFormat(content, metadata);

  const fileName = path.basename(storyPath);
  const submissionPath = path.join(submissionDir, fileName);

  await fs.writeFile(submissionPath, submissionContent);

  console.log(chalk.green(`✅ Prepared "${storyName}" for submission`));
  console.log(chalk.gray(`   Location: ${submissionPath}`));

  // Show submission checklist
  console.log(chalk.blue.bold("\n📋 Submission Checklist:"));
  console.log("  □ Proofread for grammar and spelling");
  console.log("  □ Check word count meets publication requirements");
  console.log("  □ Format according to submission guidelines");
  console.log("  □ Write compelling cover letter");
  console.log("  □ Research publication's recent stories");
  console.log("  □ Follow simultaneous submission policy");
}

async function storyStats(storyName, options) {
  if (storyName) {
    // Stats for specific story
    await storyStatus(storyName, options);
  } else {
    // Overall project stats
    console.log(chalk.blue.bold("\n📊 Project Statistics\n"));

    const directories = await getStoryDirectories();
    const stats = {
      total: 0,
      byStatus: {},
      byGenre: {},
      totalWords: 0,
      averageLength: 0
    };

    for (const dir of directories) {
      try {
        const files = await fs.readdir(dir);
        const markdownFiles = files.filter(file => file.endsWith('.md'));

        for (const file of markdownFiles) {
          const filePath = path.join(dir, file);
          const content = await fs.readFile(filePath, 'utf8');
          const metadata = await parseStoryMetadata(content, filePath);

          stats.total++;
          stats.totalWords += metadata.wordCount || 0;

          // Count by status
          const status = metadata.status || 'unknown';
          stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

          // Count by genre
          const genre = metadata.genre || 'unspecified';
          stats.byGenre[genre] = (stats.byGenre[genre] || 0) + 1;
        }
      } catch (error) {
        // Directory might not exist
      }
    }

    stats.averageLength = stats.total > 0 ? Math.round(stats.totalWords / stats.total) : 0;

    console.log(chalk.bold("Overview:"));
    console.log(`  Total Stories: ${chalk.cyan(stats.total)}`);
    console.log(`  Total Words: ${chalk.green(stats.totalWords.toLocaleString())}`);
    console.log(`  Average Length: ${chalk.yellow(stats.averageLength)} words`);

    if (Object.keys(stats.byStatus).length > 0) {
      console.log(chalk.bold("\nBy Status:"));
      Object.entries(stats.byStatus).forEach(([status, count]) => {
        console.log(`  ${getStatusDisplay(status)}: ${count}`);
      });
    }

    if (Object.keys(stats.byGenre).length > 0) {
      console.log(chalk.bold("\nBy Genre:"));
      Object.entries(stats.byGenre).forEach(([genre, count]) => {
        console.log(`  ${chalk.magenta(genre)}: ${count}`);
      });
    }
  }
}

async function searchStories(query, options) {
  if (!query) {
    console.log(chalk.red("❌ Please provide a search query"));
    return;
  }

  console.log(chalk.blue.bold(`\n🔍 Searching for: "${query}"\n`));

  const directories = await getStoryDirectories();
  const results = [];

  for (const dir of directories) {
    try {
      const files = await fs.readdir(dir);
      const markdownFiles = files.filter(file => file.endsWith('.md'));

      for (const file of markdownFiles) {
        const filePath = path.join(dir, file);
        const content = await fs.readFile(filePath, 'utf8');
        const metadata = await parseStoryMetadata(content, filePath);

        // Search in title, content, genre, and tags
        const searchText = [
          metadata.title,
          content,
          metadata.genre,
          metadata.tags ? metadata.tags.join(' ') : ''
        ].join(' ').toLowerCase();

        if (searchText.includes(query.toLowerCase())) {
          results.push({
            ...metadata,
            filePath,
            directory: path.basename(dir)
          });
        }
      }
    } catch (error) {
      // Directory might not exist
    }
  }

  if (results.length === 0) {
    console.log(chalk.yellow("No stories found matching your search."));
    return;
  }

  console.log(chalk.green(`Found ${results.length} matching stories:\n`));

  results.forEach(story => {
    console.log(`📖 ${chalk.bold(story.title)}`);
    console.log(`   ${chalk.dim(story.filePath)}`);
    console.log(`   ${chalk.yellow(story.genre || 'No genre')} • ${chalk.cyan(story.wordCount || 0)} words`);
    console.log('');
  });
}

async function manageStoryTags(storyName, options) {
  if (!storyName) {
    console.log(chalk.red("❌ Please specify a story name"));
    return;
  }

  const storyPath = await findStoryFile(storyName);
  if (!storyPath) {
    console.log(chalk.red(`❌ Story "${storyName}" not found`));
    return;
  }

  let content = await fs.readFile(storyPath, 'utf8');
  const metadata = await parseStoryMetadata(content, storyPath);

  if (options.add) {
    const tagsToAdd = options.add.split(',').map(tag => tag.trim());
    const currentTags = metadata.tags || [];
    const newTags = [...new Set([...currentTags, ...tagsToAdd])];

    content = updateStoryTags(content, newTags);
    await fs.writeFile(storyPath, content);

    console.log(chalk.green(`✅ Added tags: ${tagsToAdd.join(', ')}`));
  } else if (options.remove) {
    const tagsToRemove = options.remove.split(',').map(tag => tag.trim());
    const currentTags = metadata.tags || [];
    const newTags = currentTags.filter(tag => !tagsToRemove.includes(tag));

    content = updateStoryTags(content, newTags);
    await fs.writeFile(storyPath, content);

    console.log(chalk.green(`✅ Removed tags: ${tagsToRemove.join(', ')}`));
  } else {
    // List current tags
    if (metadata.tags && metadata.tags.length > 0) {
      console.log(chalk.blue.bold(`\n🏷️  Tags for "${metadata.title}":\n`));
      metadata.tags.forEach(tag => {
        console.log(`  ${chalk.cyan(`#${tag}`)}`);
      });
    } else {
      console.log(chalk.yellow(`No tags found for "${metadata.title}"`));
    }
  }
}

async function storyNotes(storyName, options) {
  if (!storyName) {
    console.log(chalk.red("❌ Please specify a story name"));
    return;
  }

  const noteFile = `notes/${storyName}-notes.md`;

  if (options.add) {
    const noteContent = `${new Date().toISOString()}: ${options.add}\n`;
    await fs.appendFile(noteFile, noteContent);
    console.log(chalk.green(`✅ Added note to ${noteFile}`));
  } else {
    try {
      const content = await fs.readFile(noteFile, 'utf8');
      console.log(chalk.blue.bold(`\n📝 Notes for "${storyName}":\n`));
      console.log(content);
    } catch (error) {
      console.log(chalk.yellow(`No notes found for "${storyName}"`));
      console.log(chalk.gray(`Create notes with: writers story notes ${storyName} --add "Your note"`));
    }
  }
}

// Helper functions

async function getStoryDirectories() {
  const possibleDirs = [
    'stories', 'shortstories', 'drafts', 'submission-ready',
    'archive', 'experiments', 'exercises'
  ];

  const existingDirs = [];
  for (const dir of possibleDirs) {
    try {
      await fs.access(dir);
      existingDirs.push(dir);
    } catch {
      // Directory doesn't exist
    }
  }

  return existingDirs;
}

async function findStoryFile(storyName) {
  const directories = await getStoryDirectories();
  const possibleNames = [
    `${storyName}.md`,
    `${storyName.toLowerCase().replace(/\s+/g, '-')}.md`
  ];

  for (const dir of directories) {
    for (const fileName of possibleNames) {
      const filePath = path.join(dir, fileName);
      try {
        await fs.access(filePath);
        return filePath;
      } catch {
        // File doesn't exist
      }
    }

    // Also try to find by title within files
    try {
      const files = await fs.readdir(dir);
      for (const file of files.filter(f => f.endsWith('.md'))) {
        const content = await fs.readFile(path.join(dir, file), 'utf8');
        const titleMatch = content.match(/^# (.+)$/m);
        if (titleMatch && titleMatch[1].toLowerCase().includes(storyName.toLowerCase())) {
          return path.join(dir, file);
        }
      }
    } catch {
      // Directory access error
    }
  }

  return null;
}

async function parseStoryMetadata(content, filePath) {
  const metadata = {
    title: 'Untitled',
    status: 'unknown',
    genre: null,
    wordCount: 0,
    targetLength: null,
    tags: [],
    theme: null,
    submissionHistory: []
  };

  // Extract title
  const titleMatch = content.match(/^# (.+)$/m);
  if (titleMatch) {
    metadata.title = titleMatch[1].trim();
  }

  // Extract metadata from frontmatter or structured sections
  const statusMatch = content.match(/^\*\*Status:\*\*\s*(.+)$/m) ||
                     content.match(/- \*\*Status:\*\*\s*(.+)$/m);
  if (statusMatch) {
    metadata.status = statusMatch[1].trim().toLowerCase();
  }

  const genreMatch = content.match(/^\*\*Genre:\*\*\s*(.+)$/m) ||
                    content.match(/- \*\*Genre:\*\*\s*(.+)$/m);
  if (genreMatch) {
    metadata.genre = genreMatch[1].trim();
  }

  const targetLengthMatch = content.match(/^\*\*Target Length:\*\*\s*(.+)$/m) ||
                           content.match(/- \*\*Target Length:\*\*\s*(.+)$/m);
  if (targetLengthMatch) {
    metadata.targetLength = targetLengthMatch[1].trim();
  }

  const themeMatch = content.match(/^\*\*Theme:\*\*\s*(.+)$/m) ||
                    content.match(/- \*\*Theme:\*\*\s*(.+)$/m);
  if (themeMatch) {
    metadata.theme = themeMatch[1].trim();
  }

  // Extract tags
  const tagMatches = content.match(/#(\w+)/g);
  if (tagMatches) {
    metadata.tags = tagMatches.map(tag => tag.substring(1));
  }

  // Count words (approximate)
  const textContent = content.replace(/^#.*$/gm, '') // Remove headers
                           .replace(/^\*.*$/gm, '')   // Remove list items
                           .replace(/^\s*$/gm, '')    // Remove empty lines
                           .trim();
  const words = textContent.split(/\s+/).filter(word => word.length > 0);
  metadata.wordCount = words.length;

  return metadata;
}

function getStatusDisplay(status) {
  const statusColors = {
    'planning': chalk.yellow('📋 Planning'),
    'drafting': chalk.blue('✍️  Drafting'),
    'revising': chalk.orange('🔧 Revising'),
    'complete': chalk.green('✅ Complete'),
    'submitted': chalk.purple('📤 Submitted'),
    'published': chalk.cyan('🎉 Published'),
    'archived': chalk.gray('📦 Archived')
  };

  return statusColors[status] || chalk.gray(`❓ ${status}`);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function generateSubmissionFormat(content, metadata) {
  // Create a clean submission format
  const lines = content.split('\n');
  const submissionLines = [];

  let inStoryContent = false;
  let inMetadataSection = false;

  for (const line of lines) {
    // Skip metadata sections
    if (line.match(/^## (Story Information|Characters|Plot Structure|Notes|Revision Notes)/)) {
      inMetadataSection = true;
      continue;
    }

    if (line.match(/^## Story Content/) || line.match(/^---\s*$/)) {
      inMetadataSection = false;
      inStoryContent = true;
      continue;
    }

    if (line.match(/^##/) && inStoryContent) {
      inMetadataSection = true;
      inStoryContent = false;
      continue;
    }

    // Include title and story content only
    if (line.startsWith('# ') || (inStoryContent && !inMetadataSection)) {
      submissionLines.push(line);
    }
  }

  return submissionLines.join('\n').trim();
}

function updateStoryTags(content, tags) {
  // This is a simplified implementation
  // In practice, you'd want more sophisticated metadata handling
  const tagLine = tags.length > 0 ? `Tags: ${tags.map(tag => `#${tag}`).join(' ')}` : '';

  // Try to find existing tag line and replace it
  if (content.includes('Tags:')) {
    content = content.replace(/Tags:.*$/m, tagLine);
  } else if (tagLine) {
    // Add tags after the title
    content = content.replace(/^(# .+)$/m, `$1\n\n${tagLine}`);
  }

  return content;
}

function showHelp() {
  console.log(chalk.blue.bold("\n📚 Story Management Commands\n"));

  console.log(chalk.bold("Available Actions:"));
  console.log("  list                    - List all stories");
  console.log("  status <story>          - Show detailed story information");
  console.log("  move <story> --to <dir> - Move story to different directory");
  console.log("  copy <story> --as <name>- Copy story with new name");
  console.log("  archive <story>         - Archive a story");
  console.log("  submit <story>          - Prepare story for submission");
  console.log("  stats [story]           - Show statistics");
  console.log("  search <query>          - Search stories");
  console.log("  tags <story>            - Manage story tags");
  console.log("  notes <story>           - Manage story notes");

  console.log(chalk.bold("\nOptions:"));
  console.log("  --status <status>       - Filter by status (list)");
  console.log("  --genre <genre>         - Filter by genre (list)");
  console.log("  --tag <tag>             - Filter by tag (list)");
  console.log("  --sort <field>          - Sort by field (list)");
  console.log("  --detailed              - Show detailed view (list)");
  console.log("  --add <tags>            - Add tags (tags)");
  console.log("  --remove <tags>         - Remove tags (tags)");
  console.log("  --add <note>            - Add note (notes)");

  console.log(chalk.bold("\nExamples:"));
  console.log(chalk.cyan("  writers story list --status drafting"));
  console.log(chalk.cyan("  writers story status my-story"));
  console.log(chalk.cyan("  writers story move my-story --to submission-ready"));
  console.log(chalk.cyan("  writers story tags my-story --add 'sci-fi,dystopian'"));
  console.log(chalk.cyan("  writers story search 'time travel'"));
}

module.exports = storyCommand;
