const fs = require('fs-extra');
const path = require('path');

class StatsService {
  constructor() {
    this.wordCountCache = new Map();
    this.statsCache = new Map();
    this.cacheTimeout = 30000; // 30 seconds
  }

  /**
   * Get word count from text
   */
  getWordCount(text) {
    if (!text || typeof text !== 'string') {
      return {
        words: 0,
        characters: 0,
        charactersNoSpaces: 0,
        sentences: 0,
        paragraphs: 0,
        pages: 0,
        readingTime: 0
      };
    }

    // Cache key based on text hash
    const textHash = this.hashString(text);
    const cached = this.wordCountCache.get(textHash);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.stats;
    }

    const stats = this.calculateWordCount(text);

    // Cache the results
    this.wordCountCache.set(textHash, {
      stats,
      timestamp: Date.now()
    });

    // Clean old cache entries
    this.cleanCache(this.wordCountCache);

    return stats;
  }

  /**
   * Calculate detailed word count statistics
   */
  calculateWordCount(text) {
    const lines = text.split('\n');

    // Count words (split by whitespace, filter empty strings)
    const words = text
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0);

    // Count characters
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, '').length;

    // Count sentences (basic sentence ending detection)
    const sentences = text
      .split(/[.!?]+/)
      .filter(sentence => sentence.trim().length > 0);

    // Count paragraphs (non-empty lines)
    const paragraphs = lines
      .filter(line => line.trim().length > 0);

    // Estimate pages (250 words per page standard)
    const pages = Math.ceil(words.length / 250);

    // Estimate reading time (200 words per minute average)
    const readingTimeMinutes = Math.ceil(words.length / 200);

    return {
      words: words.length,
      characters,
      charactersNoSpaces,
      sentences: sentences.length,
      paragraphs: paragraphs.length,
      pages,
      readingTime: readingTimeMinutes,
      lines: lines.length,
      averageWordsPerSentence: sentences.length > 0 ? Math.round(words.length / sentences.length) : 0,
      averageWordsPerParagraph: paragraphs.length > 0 ? Math.round(words.length / paragraphs.length) : 0
    };
  }

  /**
   * Get statistics for a file
   */
  async getFileStats(filePath) {
    try {
      if (!await fs.pathExists(filePath)) {
        throw new Error(`File does not exist: ${filePath}`);
      }

      const stat = await fs.stat(filePath);

      // Check cache first
      const cacheKey = `${filePath}:${stat.mtime.getTime()}`;
      const cached = this.statsCache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.stats;
      }

      const content = await fs.readFile(filePath, 'utf8');
      const wordStats = this.getWordCount(content);

      const fileStats = {
        ...wordStats,
        filePath,
        fileName: path.basename(filePath),
        fileSize: stat.size,
        created: stat.birthtime || stat.ctime,
        modified: stat.mtime,
        extension: path.extname(filePath).toLowerCase()
      };

      // Cache the results
      this.statsCache.set(cacheKey, {
        stats: fileStats,
        timestamp: Date.now()
      });

      // Clean old cache entries
      this.cleanCache(this.statsCache);

      return fileStats;
    } catch (error) {
      console.error('Error getting file stats:', error);
      throw error;
    }
  }

  /**
   * Get statistics for an entire project
   */
  async getProjectStats(projectPath) {
    try {
      if (!await fs.pathExists(projectPath)) {
        throw new Error(`Project path does not exist: ${projectPath}`);
      }

      const files = await this.findWritingFiles(projectPath);
      const fileStats = [];
      let totalStats = {
        words: 0,
        characters: 0,
        charactersNoSpaces: 0,
        sentences: 0,
        paragraphs: 0,
        pages: 0,
        readingTime: 0,
        files: 0,
        totalSize: 0
      };

      for (const filePath of files) {
        try {
          const stats = await this.getFileStats(filePath);
          fileStats.push(stats);

          totalStats.words += stats.words;
          totalStats.characters += stats.characters;
          totalStats.charactersNoSpaces += stats.charactersNoSpaces;
          totalStats.sentences += stats.sentences;
          totalStats.paragraphs += stats.paragraphs;
          totalStats.pages += stats.pages;
          totalStats.readingTime += stats.readingTime;
          totalStats.totalSize += stats.fileSize;
          totalStats.files++;
        } catch (error) {
          console.error(`Error processing file ${filePath}:`, error);
        }
      }

      const projectStats = {
        projectPath,
        projectName: path.basename(projectPath),
        totalStats,
        fileStats,
        averageWordsPerFile: totalStats.files > 0 ? Math.round(totalStats.words / totalStats.files) : 0,
        largestFile: this.findLargestFile(fileStats),
        oldestFile: this.findOldestFile(fileStats),
        newestFile: this.findNewestFile(fileStats),
        generatedAt: new Date().toISOString()
      };

      return projectStats;
    } catch (error) {
      console.error('Error getting project stats:', error);
      throw error;
    }
  }

  /**
   * Find writing files in a directory
   */
  async findWritingFiles(dirPath) {
    const writingExtensions = ['.txt', '.md', '.markdown', '.text'];
    const files = [];

    async function scanDirectory(currentPath) {
      try {
        const items = await fs.readdir(currentPath);

        for (const item of items) {
          const itemPath = path.join(currentPath, item);
          const stat = await fs.stat(itemPath);

          if (stat.isDirectory()) {
            // Skip hidden directories and common non-writing directories
            if (!item.startsWith('.') && !['node_modules', 'dist', 'build'].includes(item)) {
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

    await scanDirectory(dirPath);
    return files;
  }

  /**
   * Calculate reading time with different reading speeds
   */
  getReadingTimeEstimates(wordCount) {
    const speeds = {
      slow: 150,      // words per minute
      average: 200,   // words per minute
      fast: 250,      // words per minute
      veryFast: 300   // words per minute
    };

    const estimates = {};

    for (const [speed, wpm] of Object.entries(speeds)) {
      const minutes = Math.ceil(wordCount / wpm);
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;

      estimates[speed] = {
        totalMinutes: minutes,
        hours,
        minutes: remainingMinutes,
        formatted: hours > 0 ? `${hours}h ${remainingMinutes}m` : `${minutes}m`
      };
    }

    return estimates;
  }

  /**
   * Get writing progress for goals
   */
  getWritingProgress(currentCount, goal, type = 'words') {
    if (!goal || goal <= 0) {
      return {
        current: currentCount,
        goal: 0,
        percentage: 0,
        remaining: 0,
        completed: false
      };
    }

    const percentage = Math.min(100, Math.round((currentCount / goal) * 100));
    const remaining = Math.max(0, goal - currentCount);
    const completed = currentCount >= goal;

    return {
      current: currentCount,
      goal,
      percentage,
      remaining,
      completed,
      type
    };
  }

  /**
   * Get session statistics
   */
  getSessionStats(startTime, currentText, initialWordCount = 0) {
    const currentStats = this.getWordCount(currentText);
    const sessionDuration = Date.now() - startTime;
    const sessionHours = sessionDuration / (1000 * 60 * 60);
    const wordsWritten = currentStats.words - initialWordCount;

    return {
      sessionDuration: sessionDuration,
      sessionHours: Math.round(sessionHours * 100) / 100,
      wordsWritten: Math.max(0, wordsWritten),
      wordsPerHour: sessionHours > 0 ? Math.round(wordsWritten / sessionHours) : 0,
      startTime: new Date(startTime),
      currentStats
    };
  }

  /**
   * Find largest file by word count
   */
  findLargestFile(fileStats) {
    if (!fileStats || fileStats.length === 0) return null;

    return fileStats.reduce((largest, current) =>
      current.words > largest.words ? current : largest
    );
  }

  /**
   * Find oldest file
   */
  findOldestFile(fileStats) {
    if (!fileStats || fileStats.length === 0) return null;

    return fileStats.reduce((oldest, current) =>
      current.created < oldest.created ? current : oldest
    );
  }

  /**
   * Find newest file
   */
  findNewestFile(fileStats) {
    if (!fileStats || fileStats.length === 0) return null;

    return fileStats.reduce((newest, current) =>
      current.created > newest.created ? current : newest
    );
  }

  /**
   * Hash string for caching
   */
  hashString(str) {
    let hash = 0;
    if (str.length === 0) return hash;

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    return hash.toString();
  }

  /**
   * Clean old cache entries
   */
  cleanCache(cache) {
    const now = Date.now();
    const toDelete = [];

    for (const [key, value] of cache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        toDelete.push(key);
      }
    }

    toDelete.forEach(key => cache.delete(key));
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.wordCountCache.clear();
    this.statsCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      wordCountCacheSize: this.wordCountCache.size,
      statsCacheSize: this.statsCache.size,
      cacheTimeout: this.cacheTimeout
    };
  }
}

module.exports = StatsService;
