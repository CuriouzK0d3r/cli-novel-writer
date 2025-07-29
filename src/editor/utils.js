const chalk = require('chalk');

class EditorUtils {
  constructor() {
    this.markdownTokens = {
      header: /^(#+)\s+(.+)$/gm,
      bold: /\*\*(.*?)\*\*/g,
      italic: /\*(.*?)\*/g,
      code: /`(.*?)`/g,
      link: /\[([^\]]+)\]\(([^)]+)\)/g,
      blockquote: /^>\s+(.+)$/gm,
      list: /^[\s]*[-*+]\s+(.+)$/gm,
      numberedList: /^[\s]*\d+\.\s+(.+)$/gm,
      hr: /^---+$/gm
    };

    this.writingMetrics = {
      wordsPerMinute: 200,
      sentencesPerParagraph: 4,
      wordsPerSentence: 20
    };
  }

  /**
   * Apply basic syntax highlighting to markdown text
   */
  highlightMarkdown(text, useColors = true) {
    if (!useColors) return text;

    let highlighted = text;

    // Headers
    highlighted = highlighted.replace(this.markdownTokens.header, (match, hashes, content) => {
      const level = hashes.length;
      const colors = [chalk.red, chalk.blue, chalk.green, chalk.yellow, chalk.magenta, chalk.cyan];
      const color = colors[level - 1] || chalk.white;
      return color.bold(`${hashes} ${content}`);
    });

    // Bold text
    highlighted = highlighted.replace(this.markdownTokens.bold, (match, content) => {
      return chalk.bold(content);
    });

    // Italic text
    highlighted = highlighted.replace(this.markdownTokens.italic, (match, content) => {
      return chalk.italic(content);
    });

    // Inline code
    highlighted = highlighted.replace(this.markdownTokens.code, (match, content) => {
      return chalk.bgGray.white(` ${content} `);
    });

    // Links
    highlighted = highlighted.replace(this.markdownTokens.link, (match, text, url) => {
      return chalk.blue.underline(text);
    });

    // Blockquotes
    highlighted = highlighted.replace(this.markdownTokens.blockquote, (match, content) => {
      return chalk.gray(`> ${content}`);
    });

    // Lists
    highlighted = highlighted.replace(this.markdownTokens.list, (match, content) => {
      return chalk.cyan(`• ${content}`);
    });

    // Numbered lists
    highlighted = highlighted.replace(this.markdownTokens.numberedList, (match, content) => {
      return chalk.cyan(`${match.match(/\d+/)[0]}. ${content}`);
    });

    return highlighted;
  }

  /**
   * Calculate readability metrics
   */
  calculateReadability(text) {
    const words = this.countWords(text);
    const sentences = this.countSentences(text);
    const paragraphs = this.countParagraphs(text);
    const syllables = this.estimateSyllables(text);

    // Flesch Reading Ease Score
    const fleschScore = words > 0 && sentences > 0 ?
      206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words)) : 0;

    // Flesch-Kincaid Grade Level
    const gradeLevel = words > 0 && sentences > 0 ?
      (0.39 * (words / sentences)) + (11.8 * (syllables / words)) - 15.59 : 0;

    return {
      words,
      sentences,
      paragraphs,
      syllables,
      avgWordsPerSentence: sentences > 0 ? Math.round(words / sentences) : 0,
      avgSentencesPerParagraph: paragraphs > 0 ? Math.round(sentences / paragraphs) : 0,
      fleschScore: Math.round(fleschScore * 10) / 10,
      gradeLevel: Math.round(gradeLevel * 10) / 10,
      readabilityLevel: this.getReadabilityLevel(fleschScore)
    };
  }

  /**
   * Count words (excluding markdown formatting)
   */
  countWords(text) {
    const cleanText = text
      .replace(/^#+\s+/gm, '') // Remove headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/`(.*?)`/g, '$1') // Remove code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
      .replace(/!\[[^\]]*\]\([^)]+\)/g, '') // Remove images
      .replace(/^[\s]*[-*+]\s+/gm, '') // Remove list markers
      .replace(/^[\s]*\d+\.\s+/gm, '') // Remove numbered lists
      .replace(/^>\s+/gm, '') // Remove blockquotes
      .replace(/---+/g, '') // Remove hr
      .trim();

    if (!cleanText) return 0;
    return cleanText.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Count sentences
   */
  countSentences(text) {
    const cleanText = this.stripMarkdown(text);
    const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    return sentences.length;
  }

  /**
   * Count paragraphs
   */
  countParagraphs(text) {
    const cleanText = this.stripMarkdown(text);
    const paragraphs = cleanText.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    return paragraphs.length;
  }

  /**
   * Estimate syllables in text
   */
  estimateSyllables(text) {
    const words = this.stripMarkdown(text).toLowerCase().split(/\s+/);
    let totalSyllables = 0;

    for (const word of words) {
      if (word.length === 0) continue;

      // Count vowel groups
      const vowelMatches = word.match(/[aeiouy]+/g);
      let syllables = vowelMatches ? vowelMatches.length : 1;

      // Adjust for silent e
      if (word.endsWith('e') && syllables > 1) {
        syllables--;
      }

      // Minimum one syllable per word
      syllables = Math.max(1, syllables);
      totalSyllables += syllables;
    }

    return totalSyllables;
  }

  /**
   * Strip markdown formatting
   */
  stripMarkdown(text) {
    return text
      .replace(/^#+\s+/gm, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/~~(.*?)~~/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
      .replace(/^[\s]*[-*+]\s+/gm, '')
      .replace(/^[\s]*\d+\.\s+/gm, '')
      .replace(/^>\s+/gm, '')
      .replace(/---+/g, '')
      .trim();
  }

  /**
   * Get readability level description
   */
  getReadabilityLevel(fleschScore) {
    if (fleschScore >= 90) return 'Very Easy';
    if (fleschScore >= 80) return 'Easy';
    if (fleschScore >= 70) return 'Fairly Easy';
    if (fleschScore >= 60) return 'Standard';
    if (fleschScore >= 50) return 'Fairly Difficult';
    if (fleschScore >= 30) return 'Difficult';
    return 'Very Difficult';
  }

  /**
   * Generate writing suggestions
   */
  generateWritingSuggestions(text) {
    const metrics = this.calculateReadability(text);
    const suggestions = [];

    // Sentence length suggestions
    if (metrics.avgWordsPerSentence > 25) {
      suggestions.push({
        type: 'sentence_length',
        message: 'Consider breaking up long sentences for better readability',
        severity: 'warning'
      });
    }

    // Paragraph length suggestions
    if (metrics.avgSentencesPerParagraph > 6) {
      suggestions.push({
        type: 'paragraph_length',
        message: 'Consider breaking up long paragraphs',
        severity: 'info'
      });
    }

    // Readability suggestions
    if (metrics.fleschScore < 50) {
      suggestions.push({
        type: 'readability',
        message: 'Text may be difficult to read. Consider simpler words and shorter sentences',
        severity: 'warning'
      });
    }

    // Word count milestones
    if (metrics.words > 0) {
      const milestones = [250, 500, 1000, 2500, 5000, 10000];
      for (const milestone of milestones) {
        if (metrics.words >= milestone - 50 && metrics.words <= milestone + 50) {
          suggestions.push({
            type: 'milestone',
            message: `Great job! You've reached approximately ${milestone} words!`,
            severity: 'success'
          });
          break;
        }
      }
    }

    return suggestions;
  }

  /**
   * Estimate typing time for given word count
   */
  estimateTypingTime(words, wpm = 40) {
    const minutes = Math.ceil(words / wpm);
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }

  /**
   * Get writing session statistics
   */
  getSessionStats(startTime, startWords, currentWords) {
    const sessionTime = Date.now() - startTime;
    const sessionMinutes = sessionTime / (1000 * 60);
    const wordsWritten = Math.max(0, currentWords - startWords);
    const wpm = sessionMinutes > 0 ? Math.round(wordsWritten / sessionMinutes) : 0;

    return {
      sessionTime: this.formatDuration(sessionTime),
      wordsWritten,
      wordsPerMinute: wpm,
      efficiency: this.getEfficiencyRating(wpm)
    };
  }

  /**
   * Format duration in milliseconds to readable string
   */
  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Get efficiency rating based on WPM
   */
  getEfficiencyRating(wpm) {
    if (wpm >= 60) return 'Excellent';
    if (wpm >= 40) return 'Good';
    if (wpm >= 25) return 'Average';
    if (wpm >= 15) return 'Below Average';
    return 'Slow';
  }

  /**
   * Find and highlight common writing issues
   */
  findWritingIssues(text) {
    const issues = [];

    // Repeated words
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const wordCounts = {};
    for (const word of words) {
      if (word.length > 3) { // Only check words longer than 3 characters
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      }
    }

    const overusedWords = Object.entries(wordCounts)
      .filter(([word, count]) => count > 5 && !this.isCommonWord(word))
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    if (overusedWords.length > 0) {
      issues.push({
        type: 'overused_words',
        message: `Frequently used words: ${overusedWords.map(([word, count]) => `${word} (${count}x)`).join(', ')}`,
        severity: 'info'
      });
    }

    // Double spaces
    if (text.includes('  ')) {
      issues.push({
        type: 'formatting',
        message: 'Found double spaces - consider cleaning up',
        severity: 'info'
      });
    }

    // Very long paragraphs (more than 5 sentences)
    const paragraphs = text.split(/\n\s*\n/);
    for (let i = 0; i < paragraphs.length; i++) {
      const sentences = paragraphs[i].split(/[.!?]+/).filter(s => s.trim().length > 0);
      if (sentences.length > 8) {
        issues.push({
          type: 'paragraph_length',
          message: `Paragraph ${i + 1} is very long (${sentences.length} sentences)`,
          severity: 'warning'
        });
      }
    }

    return issues;
  }

  /**
   * Check if word is commonly used and shouldn't be flagged
   */
  isCommonWord(word) {
    const commonWords = [
      'the', 'and', 'that', 'have', 'for', 'not', 'with', 'you', 'this', 'but',
      'his', 'from', 'they', 'she', 'her', 'been', 'than', 'its', 'who', 'oil',
      'sit', 'now', 'find', 'long', 'down', 'day', 'did', 'get', 'has', 'him',
      'may', 'new', 'now', 'old', 'put', 'say', 'she', 'too', 'two', 'use',
      'was', 'way', 'what', 'when', 'where', 'will', 'would', 'could', 'should'
    ];
    return commonWords.includes(word.toLowerCase());
  }

  /**
   * Generate daily writing goals
   */
  generateDailyGoals(currentWordCount, targetWordCount, daysRemaining) {
    const remainingWords = Math.max(0, targetWordCount - currentWordCount);
    const wordsPerDay = daysRemaining > 0 ? Math.ceil(remainingWords / daysRemaining) : remainingWords;

    return {
      remainingWords,
      wordsPerDay,
      estimatedTimePerDay: this.estimateTypingTime(wordsPerDay),
      difficulty: this.getDifficultyLevel(wordsPerDay),
      suggestions: this.getGoalSuggestions(wordsPerDay)
    };
  }

  /**
   * Get difficulty level for daily word goal
   */
  getDifficultyLevel(wordsPerDay) {
    if (wordsPerDay < 250) return 'Easy';
    if (wordsPerDay < 500) return 'Moderate';
    if (wordsPerDay < 1000) return 'Challenging';
    if (wordsPerDay < 2000) return 'Difficult';
    return 'Very Difficult';
  }

  /**
   * Get suggestions for achieving daily word goals
   */
  getGoalSuggestions(wordsPerDay) {
    const suggestions = [];

    if (wordsPerDay > 1000) {
      suggestions.push('Consider breaking writing into multiple sessions');
      suggestions.push('Use writing sprints (25-minute focused sessions)');
    }

    if (wordsPerDay > 500) {
      suggestions.push('Outline your writing beforehand to maintain flow');
      suggestions.push('Eliminate distractions during writing time');
    }

    suggestions.push('Set a specific time each day for writing');
    suggestions.push('Track your progress to stay motivated');

    return suggestions;
  }

  /**
   * Analyze chapter structure
   */
  analyzeChapterStructure(text) {
    const headings = [];
    const headingRegex = /^(#+)\s+(.+)$/gm;
    let match;

    while ((match = headingRegex.exec(text)) !== null) {
      headings.push({
        level: match[1].length,
        text: match[2],
        position: match.index
      });
    }

    const sections = [];
    for (let i = 0; i < headings.length; i++) {
      const start = headings[i].position;
      const end = i < headings.length - 1 ? headings[i + 1].position : text.length;
      const sectionText = text.substring(start, end);

      sections.push({
        heading: headings[i],
        wordCount: this.countWords(sectionText),
        length: 'short' // You could categorize based on word count
      });
    }

    return {
      headings,
      sections,
      totalSections: sections.length,
      avgWordsPerSection: sections.length > 0 ? Math.round(sections.reduce((sum, s) => sum + s.wordCount, 0) / sections.length) : 0
    };
  }
}

module.exports = new EditorUtils();
