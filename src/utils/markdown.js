const fs = require("fs-extra");
const { marked } = require("marked");
const chalk = require("chalk");

class MarkdownUtils {
  constructor() {
    this.renderer = new marked.Renderer();
    this.setupRenderer();
  }

  /**
   * Setup custom markdown renderer
   */
  setupRenderer() {
    // Custom heading renderer for better CLI output
    this.renderer.heading = (text, level) => {
      const colors = [
        chalk.red.bold, // H1
        chalk.blue.bold, // H2
        chalk.green.bold, // H3
        chalk.yellow.bold, // H4
        chalk.magenta.bold, // H5
        chalk.cyan.bold, // H6
      ];

      const color = colors[level - 1] || chalk.white.bold;
      const prefix = "#".repeat(level);
      return `\n${color(`${prefix} ${text}`)}\n`;
    };

    // Custom paragraph renderer
    this.renderer.paragraph = (text) => {
      return `${text}\n\n`;
    };

    // Custom list renderer
    this.renderer.list = (body, ordered) => {
      return `${body}\n`;
    };

    // Custom list item renderer
    this.renderer.listitem = (text) => {
      return `  • ${text}\n`;
    };

    // Custom code block renderer
    this.renderer.code = (code, language) => {
      return `\n${chalk.gray("```" + (language || ""))}\n${chalk.white(code)}\n${chalk.gray("```")}\n\n`;
    };

    // Custom inline code renderer
    this.renderer.codespan = (code) => {
      return chalk.bgGray.white(` ${code} `);
    };

    // Custom emphasis renderers
    this.renderer.strong = (text) => {
      return chalk.bold(text);
    };

    this.renderer.em = (text) => {
      return chalk.italic(text);
    };

    // Custom blockquote renderer
    this.renderer.blockquote = (quote) => {
      return `\n${chalk.gray("│")} ${quote.trim()}\n\n`;
    };

    // Custom horizontal rule renderer
    this.renderer.hr = () => {
      return `\n${chalk.gray("─".repeat(60))}\n\n`;
    };
  }

  /**
   * Render markdown to console-friendly format
   */
  renderToConsole(markdown) {
    marked.setOptions({
      renderer: this.renderer,
      breaks: true,
      gfm: true,
    });

    return marked(markdown);
  }

  /**
   * Render markdown to HTML
   */
  renderToHtml(markdown, options = {}) {
    const defaultOptions = {
      breaks: true,
      gfm: true,
      highlight: options.highlight,
      sanitize: false,
    };

    marked.setOptions(defaultOptions);
    return marked(markdown);
  }

  /**
   * Extract metadata from markdown front matter
   */
  extractFrontMatter(content) {
    const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = content.match(frontMatterRegex);

    if (!match) {
      return {
        metadata: {},
        content: content,
      };
    }

    const metadata = {};
    const frontMatter = match[1];
    const mainContent = match[2];

    // Parse YAML-like front matter
    const lines = frontMatter.split("\n");
    for (const line of lines) {
      const colonIndex = line.indexOf(":");
      if (colonIndex > -1) {
        const key = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim();
        metadata[key] = value.replace(/^["']|["']$/g, ""); // Remove quotes
      }
    }

    return {
      metadata,
      content: mainContent,
    };
  }

  /**
   * Add front matter to markdown content
   */
  addFrontMatter(content, metadata) {
    const frontMatter = Object.entries(metadata)
      .map(([key, value]) => `${key}: ${value}`)
      .join("\n");

    return `---\n${frontMatter}\n---\n\n${content}`;
  }

  /**
   * Extract headings from markdown
   */
  extractHeadings(content) {
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const headings = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      headings.push({
        level: match[1].length,
        text: match[2].trim(),
        anchor: this.generateAnchor(match[2].trim()),
      });
    }

    return headings;
  }

  /**
   * Generate URL-safe anchor from heading text
   */
  generateAnchor(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim("-");
  }

  /**
   * Create table of contents from headings
   */
  generateTableOfContents(content, maxLevel = 3) {
    const headings = this.extractHeadings(content);
    const filteredHeadings = headings.filter((h) => h.level <= maxLevel);

    if (filteredHeadings.length === 0) {
      return "";
    }

    let toc = "## Table of Contents\n\n";

    for (const heading of filteredHeadings) {
      const indent = "  ".repeat(heading.level - 1);
      toc += `${indent}- [${heading.text}](#${heading.anchor})\n`;
    }

    return toc + "\n";
  }

  /**
   * Split content into chapters based on H1 headings
   */
  splitIntoChapters(content) {
    const chapters = [];
    const h1Regex = /^# (.+)$/gm;
    let lastIndex = 0;
    let match;
    let chapterNumber = 1;

    while ((match = h1Regex.exec(content)) !== null) {
      if (lastIndex > 0) {
        // Add previous chapter
        const chapterContent = content.substring(lastIndex, match.index).trim();
        if (chapterContent) {
          chapters.push({
            number: chapterNumber - 1,
            title:
              chapters[chapters.length - 1]?.title ||
              `Chapter ${chapterNumber - 1}`,
            content: chapterContent,
          });
        }
      }

      lastIndex = match.index;
      chapterNumber++;
    }

    // Add final chapter
    if (lastIndex < content.length) {
      const finalContent = content.substring(lastIndex).trim();
      if (finalContent) {
        const titleMatch = finalContent.match(/^# (.+)$/m);
        chapters.push({
          number: chapterNumber - 1,
          title: titleMatch ? titleMatch[1] : `Chapter ${chapterNumber - 1}`,
          content: finalContent,
        });
      }
    }

    return chapters;
  }

  /**
   * Count words in markdown content (excluding formatting)
   */
  countWords(content) {
    // Remove front matter
    const { content: mainContent } = this.extractFrontMatter(content);

    // Remove markdown formatting
    const cleanText = mainContent
      .replace(/^#{1,6}\s+.*/gm, "") // Remove headers
      .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold
      .replace(/\*(.*?)\*/g, "$1") // Remove italic
      .replace(/~~(.*?)~~/g, "$1") // Remove strikethrough
      .replace(/`(.*?)`/g, "$1") // Remove inline code
      .replace(/```[\s\S]*?```/g, "") // Remove code blocks
      .replace(/\[(.*?)\]\(.*?\)/g, "$1") // Remove links, keep text
      .replace(/!\[.*?\]\(.*?\)/g, "") // Remove images
      .replace(/^\s*[-*+]\s+/gm, "") // Remove list markers
      .replace(/^\s*\d+\.\s+/gm, "") // Remove numbered lists
      .replace(/^\s*>/gm, "") // Remove blockquotes
      .replace(/---+/g, "") // Remove horizontal rules
      .replace(/\|.*?\|/g, "") // Remove table content
      .trim();

    if (!cleanText) return 0;

    return cleanText.split(/\s+/).filter((word) => word.length > 0).length;
  }

  /**
   * Estimate reading time
   */
  estimateReadingTime(content, wordsPerMinute = 200) {
    const wordCount = this.countWords(content);
    const minutes = Math.ceil(wordCount / wordsPerMinute);

    if (minutes < 1) return "Less than 1 minute";
    if (minutes === 1) return "1 minute";
    if (minutes < 60) return `${minutes} minutes`;

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours === 1 && remainingMinutes === 0) return "1 hour";
    if (remainingMinutes === 0) return `${hours} hours`;

    return `${hours}h ${remainingMinutes}m`;
  }

  /**
   * Estimate reading time from word count
   */
  estimateReadingTimeFromWords(wordCount, wordsPerMinute = 200) {
    const minutes = Math.ceil(wordCount / wordsPerMinute);

    if (minutes < 1) return "Less than 1 minute";
    if (minutes === 1) return "1 minute";
    if (minutes < 60) return `${minutes} minutes`;

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours === 1 && remainingMinutes === 0) return "1 hour";
    if (remainingMinutes === 0) return `${hours} hours`;

    return `${hours}h ${remainingMinutes}m`;
  }

  /**
   * Format content for different output types
   */
  async formatContent(content, format = "console") {
    switch (format.toLowerCase()) {
      case "console":
      case "terminal":
        return this.renderToConsole(content);

      case "html":
        return this.renderToHtml(content);

      case "plain":
      case "text":
        return this.stripMarkdown(content);

      default:
        return content;
    }
  }

  /**
   * Strip all markdown formatting
   */
  stripMarkdown(content) {
    const { content: mainContent } = this.extractFrontMatter(content);

    return mainContent
      .replace(/^#{1,6}\s+/gm, "") // Remove header markers
      .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold
      .replace(/\*(.*?)\*/g, "$1") // Remove italic
      .replace(/~~(.*?)~~/g, "$1") // Remove strikethrough
      .replace(/`(.*?)`/g, "$1") // Remove inline code
      .replace(/```[\s\S]*?```/g, "") // Remove code blocks
      .replace(/\[(.*?)\]\(.*?\)/g, "$1") // Remove links, keep text
      .replace(/!\[.*?\]\(.*?\)/g, "") // Remove images
      .replace(/^\s*[-*+]\s+/gm, "") // Remove list markers
      .replace(/^\s*\d+\.\s+/gm, "") // Remove numbered lists
      .replace(/^\s*>/gm, "") // Remove blockquotes
      .replace(/---+/g, "") // Remove horizontal rules
      .replace(/\|.*?\|/g, "") // Remove table content
      .replace(/\n{3,}/g, "\n\n") // Normalize line breaks
      .trim();
  }

  /**
   * Validate markdown syntax
   */
  validateMarkdown(content) {
    const errors = [];
    const warnings = [];

    // Check for unmatched emphasis markers
    const boldMatches = (content.match(/\*\*/g) || []).length;
    if (boldMatches % 2 !== 0) {
      errors.push("Unmatched bold (**) markers detected");
    }

    const italicMatches = (content.match(/(?<!\*)\*(?!\*)/g) || []).length;
    if (italicMatches % 2 !== 0) {
      warnings.push("Potentially unmatched italic (*) markers detected");
    }

    // Check for unmatched code markers
    const codeMatches = (content.match(/`/g) || []).length;
    if (codeMatches % 2 !== 0) {
      errors.push("Unmatched code (`) markers detected");
    }

    // Check for malformed links
    const linkRegex = /\[([^\]]*)\]\(([^)]*)\)/g;
    let linkMatch;
    while ((linkMatch = linkRegex.exec(content)) !== null) {
      if (!linkMatch[1].trim()) {
        warnings.push(`Empty link text at position ${linkMatch.index}`);
      }
      if (!linkMatch[2].trim()) {
        warnings.push(`Empty link URL at position ${linkMatch.index}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

module.exports = new MarkdownUtils();
