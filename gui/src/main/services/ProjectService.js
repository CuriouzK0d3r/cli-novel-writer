const fs = require('fs-extra');
const path = require('path');
const { dialog } = require('electron');

class ProjectService {
  constructor() {
    this.currentProject = null;
    this.projectStructure = {
      chapters: 'chapters',
      characters: 'characters',
      notes: 'notes',
      research: 'research',
      exports: 'exports',
      backups: 'backups'
    };
  }

  /**
   * Create a new project
   */
  async createProject(projectData) {
    try {
      const { name, path: projectPath, description, author, genre } = projectData;

      // Validate project data
      if (!name || !projectPath) {
        throw new Error('Project name and path are required');
      }

      // Check if project directory already exists
      if (await fs.pathExists(projectPath)) {
        const isEmpty = (await fs.readdir(projectPath)).length === 0;
        if (!isEmpty) {
          throw new Error('Project directory already exists and is not empty');
        }
      }

      // Create project directory
      await fs.ensureDir(projectPath);

      // Create project structure
      await this.createProjectStructure(projectPath);

      // Create project metadata
      const projectMetadata = {
        name,
        description: description || '',
        author: author || '',
        genre: genre || '',
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        version: '1.0.0',
        structure: this.projectStructure,
        settings: {
          defaultChapterTemplate: 'chapter',
          wordGoal: 50000,
          enableBackups: true,
          backupInterval: 300000 // 5 minutes
        },
        statistics: {
          totalWords: 0,
          totalCharacters: 0,
          chaptersCount: 0,
          charactersCount: 0,
          notesCount: 0
        }
      };

      // Save project file
      const projectFilePath = path.join(projectPath, 'project.json');
      await fs.writeFile(projectFilePath, JSON.stringify(projectMetadata, null, 2));

      // Create initial files
      await this.createInitialFiles(projectPath);

      this.currentProject = {
        ...projectMetadata,
        path: projectPath,
        projectFile: projectFilePath
      };

      return this.currentProject;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }

  /**
   * Load an existing project
   */
  async loadProject(projectPath) {
    try {
      if (!await fs.pathExists(projectPath)) {
        throw new Error(`Project path does not exist: ${projectPath}`);
      }

      // Look for project file
      let projectFilePath = path.join(projectPath, 'project.json');

      // If project.json doesn't exist, check if this is a directory with writing files
      if (!await fs.pathExists(projectFilePath)) {
        // Try to auto-detect project structure
        const detectedProject = await this.detectProject(projectPath);
        if (detectedProject) {
          return detectedProject;
        }
        throw new Error('No valid project found in the specified directory');
      }

      // Load project metadata
      const projectData = await fs.readFile(projectFilePath, 'utf8');
      const projectMetadata = JSON.parse(projectData);

      // Update project structure if needed
      await this.migrateProjectStructure(projectPath, projectMetadata);

      // Update statistics
      const updatedStats = await this.calculateProjectStatistics(projectPath);
      projectMetadata.statistics = updatedStats;
      projectMetadata.modified = new Date().toISOString();

      // Save updated metadata
      await fs.writeFile(projectFilePath, JSON.stringify(projectMetadata, null, 2));

      this.currentProject = {
        ...projectMetadata,
        path: projectPath,
        projectFile: projectFilePath
      };

      return this.currentProject;
    } catch (error) {
      console.error('Error loading project:', error);
      throw error;
    }
  }

  /**
   * Save project metadata
   */
  async saveProject(projectData) {
    try {
      if (!this.currentProject) {
        throw new Error('No project currently loaded');
      }

      const updatedProject = {
        ...this.currentProject,
        ...projectData,
        modified: new Date().toISOString()
      };

      await fs.writeFile(
        this.currentProject.projectFile,
        JSON.stringify(updatedProject, null, 2)
      );

      this.currentProject = updatedProject;
      return this.currentProject;
    } catch (error) {
      console.error('Error saving project:', error);
      throw error;
    }
  }

  /**
   * Show open project dialog
   */
  async showOpenProjectDialog(parentWindow) {
    const options = {
      title: 'Open Project',
      properties: ['openDirectory'],
      buttonLabel: 'Open Project'
    };

    try {
      const result = await dialog.showOpenDialog(parentWindow, options);
      if (!result.canceled && result.filePaths.length > 0) {
        const projectPath = result.filePaths[0];
        const project = await this.loadProject(projectPath);
        return { success: true, project };
      }
      return { success: false, canceled: true };
    } catch (error) {
      console.error('Error opening project dialog:', error);
      throw error;
    }
  }

  /**
   * Create project directory structure
   */
  async createProjectStructure(projectPath) {
    const directories = [
      this.projectStructure.chapters,
      this.projectStructure.characters,
      this.projectStructure.notes,
      this.projectStructure.research,
      this.projectStructure.exports,
      this.projectStructure.backups
    ];

    for (const dir of directories) {
      await fs.ensureDir(path.join(projectPath, dir));
    }
  }

  /**
   * Create initial project files
   */
  async createInitialFiles(projectPath) {
    // Create README file
    const readmeContent = `# Project README

This is your writing project. Use this file to keep track of your progress, notes, and ideas.

## Project Structure

- **chapters/**: Your story chapters
- **characters/**: Character profiles and development
- **notes/**: General notes and ideas
- **research/**: Research materials and references
- **exports/**: Exported versions of your work
- **backups/**: Automatic backups

Happy writing!
`;

    await fs.writeFile(path.join(projectPath, 'README.md'), readmeContent);

    // Create initial chapter
    const chapterContent = `# Chapter 1

Start writing your story here...
`;

    const chaptersDir = path.join(projectPath, this.projectStructure.chapters);
    await fs.writeFile(path.join(chaptersDir, 'chapter-01.md'), chapterContent);

    // Create character template
    const characterTemplate = `# Character Name

## Basic Information
- **Age**:
- **Occupation**:
- **Location**:

## Physical Description


## Personality


## Background


## Role in Story


## Character Arc


## Notes

`;

    const charactersDir = path.join(projectPath, this.projectStructure.characters);
    await fs.writeFile(path.join(charactersDir, 'character-template.md'), characterTemplate);

    // Create notes template
    const notesContent = `# Project Notes

## Story Ideas


## Plot Points


## Research Notes


## Todo Items

- [ ]

## Random Thoughts

`;

    const notesDir = path.join(projectPath, this.projectStructure.notes);
    await fs.writeFile(path.join(notesDir, 'project-notes.md'), notesContent);
  }

  /**
   * Detect project structure in existing directory
   */
  async detectProject(projectPath) {
    try {
      const items = await fs.readdir(projectPath);
      const writingFiles = items.filter(item =>
        ['.md', '.txt', '.markdown'].includes(path.extname(item).toLowerCase())
      );

      if (writingFiles.length === 0) {
        return null;
      }

      // Create a detected project
      const projectName = path.basename(projectPath);
      const projectMetadata = {
        name: projectName,
        description: 'Auto-detected project',
        author: '',
        genre: '',
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        version: '1.0.0',
        autoDetected: true,
        structure: this.projectStructure,
        settings: {
          defaultChapterTemplate: 'chapter',
          wordGoal: 50000,
          enableBackups: true,
          backupInterval: 300000
        },
        statistics: await this.calculateProjectStatistics(projectPath)
      };

      return {
        ...projectMetadata,
        path: projectPath,
        projectFile: null
      };
    } catch (error) {
      console.error('Error detecting project:', error);
      return null;
    }
  }

  /**
   * Migrate project structure for older versions
   */
  async migrateProjectStructure(projectPath, projectMetadata) {
    // Check if structure property exists
    if (!projectMetadata.structure) {
      projectMetadata.structure = this.projectStructure;

      // Create missing directories
      await this.createProjectStructure(projectPath);
    }

    // Migrate from old structure if needed
    const oldDirs = ['ch', 'char', 'ref'];
    const newDirs = ['chapters', 'characters', 'research'];

    for (let i = 0; i < oldDirs.length; i++) {
      const oldDir = path.join(projectPath, oldDirs[i]);
      const newDir = path.join(projectPath, newDirs[i]);

      if (await fs.pathExists(oldDir) && !await fs.pathExists(newDir)) {
        await fs.move(oldDir, newDir);
      }
    }
  }

  /**
   * Calculate project statistics
   */
  async calculateProjectStatistics(projectPath) {
    const stats = {
      totalWords: 0,
      totalCharacters: 0,
      chaptersCount: 0,
      charactersCount: 0,
      notesCount: 0,
      filesCount: 0,
      lastModified: null
    };

    try {
      const files = await this.findAllWritingFiles(projectPath);
      stats.filesCount = files.length;

      for (const filePath of files) {
        try {
          const content = await fs.readFile(filePath, 'utf8');
          const fileStats = await fs.stat(filePath);

          // Count words and characters
          const words = content.split(/\s+/).filter(word => word.length > 0);
          stats.totalWords += words.length;
          stats.totalCharacters += content.length;

          // Update last modified
          if (!stats.lastModified || fileStats.mtime > new Date(stats.lastModified)) {
            stats.lastModified = fileStats.mtime.toISOString();
          }

          // Categorize files
          const relativePath = path.relative(projectPath, filePath);
          if (relativePath.includes('chapter')) {
            stats.chaptersCount++;
          } else if (relativePath.includes('character')) {
            stats.charactersCount++;
          } else if (relativePath.includes('note')) {
            stats.notesCount++;
          }
        } catch (error) {
          console.error(`Error processing file ${filePath}:`, error);
        }
      }
    } catch (error) {
      console.error('Error calculating project statistics:', error);
    }

    return stats;
  }

  /**
   * Find all writing files in project
   */
  async findAllWritingFiles(projectPath) {
    const writingExtensions = ['.md', '.txt', '.markdown', '.text'];
    const files = [];

    async function scanDirectory(currentPath) {
      try {
        const items = await fs.readdir(currentPath);

        for (const item of items) {
          const itemPath = path.join(currentPath, item);
          const stat = await fs.stat(itemPath);

          if (stat.isDirectory()) {
            // Skip hidden directories and backups
            if (!item.startsWith('.') && item !== 'backups' && item !== 'node_modules') {
              await scanDirectory(itemPath);
            }
          } else if (stat.isFile()) {
            const ext = path.extname(item).toLowerCase();
            if (writingExtensions.includes(ext)) {
              files.push(itemPath);
            }
          }
        }
      } catch (error) {
        console.error(`Error scanning directory ${currentPath}:`, error);
      }
    }

    await scanDirectory(projectPath);
    return files;
  }

  /**
   * Get project files organized by type
   */
  async getProjectFiles() {
    if (!this.currentProject) {
      throw new Error('No project currently loaded');
    }

    const projectPath = this.currentProject.path;
    const files = {
      chapters: [],
      characters: [],
      notes: [],
      research: [],
      other: []
    };

    try {
      const allFiles = await this.findAllWritingFiles(projectPath);

      for (const filePath of allFiles) {
        const relativePath = path.relative(projectPath, filePath);
        const stats = await fs.stat(filePath);

        const fileInfo = {
          path: filePath,
          relativePath,
          name: path.basename(filePath),
          size: stats.size,
          modified: stats.mtime,
          type: this.getFileType(relativePath)
        };

        // Categorize file
        if (relativePath.includes(this.projectStructure.chapters)) {
          files.chapters.push(fileInfo);
        } else if (relativePath.includes(this.projectStructure.characters)) {
          files.characters.push(fileInfo);
        } else if (relativePath.includes(this.projectStructure.notes)) {
          files.notes.push(fileInfo);
        } else if (relativePath.includes(this.projectStructure.research)) {
          files.research.push(fileInfo);
        } else {
          files.other.push(fileInfo);
        }
      }

      // Sort files by name
      for (const category of Object.keys(files)) {
        files[category].sort((a, b) => a.name.localeCompare(b.name));
      }

    } catch (error) {
      console.error('Error getting project files:', error);
      throw error;
    }

    return files;
  }

  /**
   * Create new file in project
   */
  async createProjectFile(category, fileName, content = '') {
    if (!this.currentProject) {
      throw new Error('No project currently loaded');
    }

    const projectPath = this.currentProject.path;
    const categoryDir = this.projectStructure[category];

    if (!categoryDir) {
      throw new Error(`Invalid category: ${category}`);
    }

    const filePath = path.join(projectPath, categoryDir, fileName);

    // Check if file already exists
    if (await fs.pathExists(filePath)) {
      throw new Error(`File already exists: ${fileName}`);
    }

    // Ensure directory exists
    await fs.ensureDir(path.dirname(filePath));

    // Create file with template content if provided
    if (!content) {
      content = this.getTemplateContent(category, fileName);
    }

    await fs.writeFile(filePath, content);

    return {
      path: filePath,
      name: fileName,
      category,
      created: new Date().toISOString()
    };
  }

  /**
   * Get template content for file type
   */
  getTemplateContent(category, fileName) {
    const title = path.basename(fileName, path.extname(fileName));

    switch (category) {
      case 'chapters':
        return `# ${title}\n\n`;

      case 'characters':
        return `# ${title}\n\n## Basic Information\n\n## Description\n\n## Background\n\n## Role in Story\n\n`;

      case 'notes':
        return `# ${title}\n\n`;

      case 'research':
        return `# ${title}\n\n## Sources\n\n## Notes\n\n`;

      default:
        return `# ${title}\n\n`;
    }
  }

  /**
   * Determine file type from path
   */
  getFileType(relativePath) {
    if (relativePath.includes('chapter')) return 'chapter';
    if (relativePath.includes('character')) return 'character';
    if (relativePath.includes('note')) return 'note';
    if (relativePath.includes('research')) return 'research';
    return 'other';
  }

  /**
   * Export project
   */
  async exportProject(exportOptions) {
    if (!this.currentProject) {
      throw new Error('No project currently loaded');
    }

    const { format, outputPath, includeMetadata, sections } = exportOptions;

    try {
      switch (format) {
        case 'markdown':
          return await this.exportAsMarkdown(outputPath, includeMetadata, sections);
        case 'text':
          return await this.exportAsText(outputPath, sections);
        case 'json':
          return await this.exportAsJSON(outputPath, includeMetadata);
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      console.error('Error exporting project:', error);
      throw error;
    }
  }

  /**
   * Export as markdown
   */
  async exportAsMarkdown(outputPath, includeMetadata, sections) {
    let content = '';

    if (includeMetadata) {
      content += `# ${this.currentProject.name}\n\n`;
      content += `**Author**: ${this.currentProject.author}\n`;
      content += `**Genre**: ${this.currentProject.genre}\n`;
      content += `**Description**: ${this.currentProject.description}\n\n`;
      content += '---\n\n';
    }

    const files = await this.getProjectFiles();

    for (const section of sections) {
      if (files[section] && files[section].length > 0) {
        content += `# ${section.charAt(0).toUpperCase() + section.slice(1)}\n\n`;

        for (const file of files[section]) {
          const fileContent = await fs.readFile(file.path, 'utf8');
          content += fileContent + '\n\n';
        }
      }
    }

    await fs.writeFile(outputPath, content);
    return { success: true, outputPath };
  }

  /**
   * Export as plain text
   */
  async exportAsText(outputPath, sections) {
    let content = '';
    const files = await this.getProjectFiles();

    for (const section of sections) {
      if (files[section] && files[section].length > 0) {
        for (const file of files[section]) {
          const fileContent = await fs.readFile(file.path, 'utf8');
          // Remove markdown formatting
          const plainText = fileContent
            .replace(/^#+ /gm, '')
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/`(.*?)`/g, '$1');

          content += plainText + '\n\n';
        }
      }
    }

    await fs.writeFile(outputPath, content);
    return { success: true, outputPath };
  }

  /**
   * Export as JSON
   */
  async exportAsJSON(outputPath, includeMetadata) {
    const exportData = {
      project: includeMetadata ? this.currentProject : { name: this.currentProject.name },
      files: await this.getProjectFiles(),
      exportedAt: new Date().toISOString()
    };

    await fs.writeFile(outputPath, JSON.stringify(exportData, null, 2));
    return { success: true, outputPath };
  }

  /**
   * Get current project
   */
  getCurrentProject() {
    return this.currentProject;
  }

  /**
   * Close current project
   */
  closeProject() {
    this.currentProject = null;
  }

  /**
   * Update project statistics
   */
  async updateProjectStatistics() {
    if (!this.currentProject) {
      return null;
    }

    const stats = await this.calculateProjectStatistics(this.currentProject.path);
    this.currentProject.statistics = stats;

    // Save updated metadata
    if (this.currentProject.projectFile) {
      await fs.writeFile(
        this.currentProject.projectFile,
        JSON.stringify(this.currentProject, null, 2)
      );
    }

    return stats;
  }
}

module.exports = ProjectService;
