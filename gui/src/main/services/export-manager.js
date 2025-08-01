const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');

class ExportManager {
  constructor() {
    this.supportedFormats = {
      pdf: {
        name: 'PDF',
        extension: '.pdf',
        description: 'Portable Document Format',
        options: ['pageSize', 'margins', 'fonts', 'includeMetadata']
      },
      epub: {
        name: 'EPUB',
        extension: '.epub',
        description: 'Electronic Publication',
        options: ['includeImages', 'metadata', 'css', 'coverImage']
      },
      html: {
        name: 'HTML',
        extension: '.html',
        description: 'Web Page',
        options: ['includeCSS', 'singleFile', 'theme', 'includeImages']
      },
      docx: {
        name: 'Word Document',
        extension: '.docx',
        description: 'Microsoft Word Document',
        options: ['includeImages', 'styles', 'metadata']
      },
      txt: {
        name: 'Plain Text',
        extension: '.txt',
        description: 'Plain Text File',
        options: ['encoding', 'lineEndings']
      },
      rtf: {
        name: 'Rich Text Format',
        extension: '.rtf',
        description: 'Rich Text Format',
        options: ['includeFormatting']
      },
      markdown: {
        name: 'Markdown',
        extension: '.md',
        description: 'Markdown Document',
        options: ['includeYAMLHeader', 'includeImages']
      }
    };

    this.templates = {
      manuscript: {
        name: 'Standard Manuscript',
        description: 'Industry standard manuscript formatting',
        pageSize: 'letter',
        margins: { top: 1, bottom: 1, left: 1.25, right: 1.25 },
        font: 'Times New Roman',
        fontSize: 12,
        lineSpacing: 2,
        indent: 0.5,
        includePageNumbers: true,
        includeWordCount: true
      },
      novel: {
        name: 'Novel Format',
        description: 'Standard novel book formatting',
        pageSize: 'A5',
        margins: { top: 0.75, bottom: 0.75, left: 0.75, right: 0.75 },
        font: 'Georgia',
        fontSize: 11,
        lineSpacing: 1.2,
        indent: 0.3,
        includePageNumbers: true,
        includeChapterHeaders: true
      },
      ebook: {
        name: 'E-book Format',
        description: 'Optimized for digital reading',
        font: 'Source Serif Pro',
        fontSize: 14,
        lineSpacing: 1.4,
        margins: { top: 1, bottom: 1, left: 1, right: 1 },
        includeTableOfContents: true,
        includeMetadata: true
      },
      screenplay: {
        name: 'Screenplay',
        description: 'Industry standard screenplay format',
        pageSize: 'letter',
        margins: { top: 1, bottom: 1, left: 1.5, right: 1 },
        font: 'Courier New',
        fontSize: 12,
        lineSpacing: 1,
        includePageNumbers: true,
        sceneNumbering: true
      }
    };
  }

  // Main export function
  async exportProject(projectPath, projectData, format, options = {}) {
    try {
      const formatInfo = this.supportedFormats[format];
      if (!formatInfo) {
        throw new Error(`Unsupported export format: ${format}`);
      }

      // Prepare export data
      const exportData = await this.prepareExportData(projectPath, projectData, options);

      // Choose export method based on format
      let result;
      switch (format) {
        case 'pdf':
          result = await this.exportToPDF(exportData, options);
          break;
        case 'epub':
          result = await this.exportToEPUB(exportData, options);
          break;
        case 'html':
          result = await this.exportToHTML(exportData, options);
          break;
        case 'docx':
          result = await this.exportToDocx(exportData, options);
          break;
        case 'txt':
          result = await this.exportToText(exportData, options);
          break;
        case 'rtf':
          result = await this.exportToRTF(exportData, options);
          break;
        case 'markdown':
          result = await this.exportToMarkdown(exportData, options);
          break;
        default:
          throw new Error(`Export handler not implemented for format: ${format}`);
      }

      return {
        success: true,
        outputPath: result.outputPath,
        format,
        stats: result.stats || {}
      };

    } catch (error) {
      console.error('Export error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Prepare data for export
  async prepareExportData(projectPath, projectData, options) {
    const exportData = {
      project: projectData,
      content: [],
      metadata: {
        title: projectData.title || 'Untitled',
        author: projectData.author || 'Unknown Author',
        exportDate: new Date().toISOString(),
        wordCount: 0,
        chapterCount: 0
      },
      options
    };

    // Collect content based on export scope
    if (options.exportScope === 'current' && options.currentFile) {
      // Export only current file
      const content = await this.loadFileContent(path.join(projectPath, options.currentFile));
      exportData.content.push({
        title: path.basename(options.currentFile, path.extname(options.currentFile)),
        content,
        type: 'chapter'
      });
    } else if (options.chapters && options.chapters.length > 0) {
      // Export specific chapters
      for (const chapterFile of options.chapters) {
        const content = await this.loadFileContent(path.join(projectPath, chapterFile));
        exportData.content.push({
          title: this.extractTitle(content) || path.basename(chapterFile, path.extname(chapterFile)),
          content,
          type: 'chapter'
        });
      }
    } else {
      // Export entire project
      const chaptersDir = path.join(projectPath, 'chapters');
      if (await fs.pathExists(chaptersDir)) {
        const files = await fs.readdir(chaptersDir);
        const chapterFiles = files
          .filter(file => file.endsWith('.md') || file.endsWith('.txt'))
          .sort();

        for (const file of chapterFiles) {
          const content = await this.loadFileContent(path.join(chaptersDir, file));
          exportData.content.push({
            title: this.extractTitle(content) || path.basename(file, path.extname(file)),
            content,
            type: 'chapter',
            filename: file
          });
        }
      }
    }

    // Calculate statistics
    exportData.metadata.chapterCount = exportData.content.length;
    exportData.metadata.wordCount = exportData.content.reduce((total, chapter) => {
      return total + this.countWords(chapter.content);
    }, 0);

    return exportData;
  }

  // Export to PDF
  async exportToPDF(exportData, options) {
    const template = this.templates[options.template] || this.templates.manuscript;
    const outputPath = options.outputPath || this.generateOutputPath(exportData, 'pdf');

    // Create HTML for PDF conversion
    const htmlContent = this.generateHTMLForPDF(exportData, template, options);
    const tempHtmlPath = path.join(path.dirname(outputPath), 'temp-export.html');

    await fs.writeFile(tempHtmlPath, htmlContent);

    try {
      // Use puppeteer or wkhtmltopdf for PDF generation
      await this.convertHTMLToPDF(tempHtmlPath, outputPath, template);

      // Clean up temp file
      await fs.remove(tempHtmlPath);

      return {
        outputPath,
        stats: {
          pages: await this.estimatePageCount(exportData, template),
          wordCount: exportData.metadata.wordCount
        }
      };
    } catch (error) {
      await fs.remove(tempHtmlPath);
      throw error;
    }
  }

  // Export to EPUB
  async exportToEPUB(exportData, options) {
    const outputPath = options.outputPath || this.generateOutputPath(exportData, 'epub');

    // Create EPUB structure
    const epubDir = path.join(path.dirname(outputPath), 'epub-temp');
    await fs.ensureDir(epubDir);

    try {
      // Create EPUB structure
      await this.createEPUBStructure(epubDir, exportData, options);

      // Package EPUB
      await this.packageEPUB(epubDir, outputPath);

      // Clean up
      await fs.remove(epubDir);

      return {
        outputPath,
        stats: {
          chapters: exportData.content.length,
          wordCount: exportData.metadata.wordCount
        }
      };
    } catch (error) {
      await fs.remove(epubDir);
      throw error;
    }
  }

  // Export to HTML
  async exportToHTML(exportData, options) {
    const outputPath = options.outputPath || this.generateOutputPath(exportData, 'html');

    if (options.singleFile) {
      // Single HTML file
      const htmlContent = this.generateCompleteHTML(exportData, options);
      await fs.writeFile(outputPath, htmlContent);
    } else {
      // Multi-file HTML with index
      const outputDir = path.join(path.dirname(outputPath), path.basename(outputPath, '.html'));
      await fs.ensureDir(outputDir);
      await this.generateMultiFileHTML(exportData, outputDir, options);
    }

    return {
      outputPath: options.singleFile ? outputPath : path.join(path.dirname(outputPath), path.basename(outputPath, '.html')),
      stats: {
        files: options.singleFile ? 1 : exportData.content.length + 1,
        wordCount: exportData.metadata.wordCount
      }
    };
  }

  // Export to DOCX
  async exportToDocx(exportData, options) {
    const outputPath = options.outputPath || this.generateOutputPath(exportData, 'docx');

    // Use docx library or convert via pandoc
    const content = this.prepareDocxContent(exportData, options);

    try {
      // Try using pandoc first
      await this.convertToDocxViaPandoc(content, outputPath, options);
    } catch (pandocError) {
      // Fallback to basic docx generation
      await this.generateBasicDocx(content, outputPath, options);
    }

    return {
      outputPath,
      stats: {
        wordCount: exportData.metadata.wordCount,
        pages: Math.ceil(exportData.metadata.wordCount / 250) // Estimate
      }
    };
  }

  // Export to plain text
  async exportToText(exportData, options) {
    const outputPath = options.outputPath || this.generateOutputPath(exportData, 'txt');

    let content = '';

    // Add title page if requested
    if (options.includeTitlePage !== false) {
      content += `${exportData.metadata.title}\n`;
      content += `by ${exportData.metadata.author}\n\n`;
      content += '═'.repeat(50) + '\n\n';
    }

    // Add table of contents if requested
    if (options.includeTableOfContents) {
      content += 'TABLE OF CONTENTS\n\n';
      exportData.content.forEach((chapter, index) => {
        content += `${index + 1}. ${chapter.title}\n`;
      });
      content += '\n' + '═'.repeat(50) + '\n\n';
    }

    // Add chapters
    exportData.content.forEach((chapter, index) => {
      if (index > 0) content += '\n\n';

      content += `Chapter ${index + 1}: ${chapter.title}\n`;
      content += '─'.repeat(chapter.title.length + 12) + '\n\n';
      content += this.convertMarkdownToText(chapter.content);
    });

    // Handle line endings
    if (options.lineEndings === 'crlf') {
      content = content.replace(/\n/g, '\r\n');
    }

    await fs.writeFile(outputPath, content, { encoding: options.encoding || 'utf8' });

    return {
      outputPath,
      stats: {
        wordCount: exportData.metadata.wordCount,
        characters: content.length
      }
    };
  }

  // Export to RTF
  async exportToRTF(exportData, options) {
    const outputPath = options.outputPath || this.generateOutputPath(exportData, 'rtf');

    let rtfContent = this.generateRTFHeader(options);

    exportData.content.forEach((chapter, index) => {
      rtfContent += this.generateRTFChapter(chapter, index + 1, options);
    });

    rtfContent += '}'; // Close RTF document

    await fs.writeFile(outputPath, rtfContent);

    return {
      outputPath,
      stats: {
        wordCount: exportData.metadata.wordCount
      }
    };
  }

  // Export to Markdown
  async exportToMarkdown(exportData, options) {
    const outputPath = options.outputPath || this.generateOutputPath(exportData, 'md');

    let content = '';

    // Add YAML frontmatter if requested
    if (options.includeYAMLHeader) {
      content += '---\n';
      content += `title: "${exportData.metadata.title}"\n`;
      content += `author: "${exportData.metadata.author}"\n`;
      content += `date: "${new Date().toISOString().split('T')[0]}"\n`;
      content += `wordcount: ${exportData.metadata.wordCount}\n`;
      content += '---\n\n';
    }

    // Add title
    content += `# ${exportData.metadata.title}\n\n`;
    content += `*by ${exportData.metadata.author}*\n\n`;

    // Add chapters
    exportData.content.forEach((chapter, index) => {
      if (index > 0) content += '\n\n---\n\n';

      content += `## Chapter ${index + 1}: ${chapter.title}\n\n`;
      content += chapter.content;
    });

    await fs.writeFile(outputPath, content);

    return {
      outputPath,
      stats: {
        wordCount: exportData.metadata.wordCount,
        chapters: exportData.content.length
      }
    };
  }

  // Helper methods
  async loadFileContent(filePath) {
    try {
      return await fs.readFile(filePath, 'utf8');
    } catch (error) {
      console.warn(`Could not load file: ${filePath}`);
      return '';
    }
  }

  extractTitle(content) {
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('# ')) {
        return trimmed.substring(2).trim();
      }
    }
    return null;
  }

  countWords(text) {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  generateOutputPath(exportData, extension) {
    const { app } = require('electron');
    const fileName = `${exportData.metadata.title.replace(/[^a-zA-Z0-9]/g, '_')}.${extension}`;
    return path.join(app.getPath('documents'), 'Writers CLI Exports', fileName);
  }

  convertMarkdownToText(markdown) {
    return markdown
      .replace(/^#+\s*/gm, '') // Remove headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/`(.*?)`/g, '$1') // Remove code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1') // Remove images
      .trim();
  }

  generateHTMLForPDF(exportData, template, options) {
    const css = this.generatePDFCSS(template);

    let html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${exportData.metadata.title}</title>
    <style>${css}</style>
</head>
<body>`;

    // Title page
    if (options.includeTitlePage !== false) {
      html += `
        <div class="title-page">
            <h1>${exportData.metadata.title}</h1>
            <h2>by ${exportData.metadata.author}</h2>
        </div>
        <div class="page-break"></div>`;
    }

    // Table of contents
    if (options.includeTableOfContents) {
      html += '<div class="toc"><h2>Table of Contents</h2><ul>';
      exportData.content.forEach((chapter, index) => {
        html += `<li><a href="#chapter-${index + 1}">${chapter.title}</a></li>`;
      });
      html += '</ul></div><div class="page-break"></div>';
    }

    // Chapters
    exportData.content.forEach((chapter, index) => {
      html += `
        <div class="chapter" id="chapter-${index + 1}">
            <h1>Chapter ${index + 1}: ${chapter.title}</h1>
            ${this.convertMarkdownToHTML(chapter.content)}
        </div>`;

      if (index < exportData.content.length - 1) {
        html += '<div class="page-break"></div>';
      }
    });

    html += '</body></html>';
    return html;
  }

  generatePDFCSS(template) {
    return `
      @page {
        size: ${template.pageSize};
        margin: ${template.margins.top}in ${template.margins.right}in ${template.margins.bottom}in ${template.margins.left}in;
      }

      body {
        font-family: "${template.font}", serif;
        font-size: ${template.fontSize}pt;
        line-height: ${template.lineSpacing};
        color: #000;
      }

      .title-page {
        text-align: center;
        margin-top: 2in;
      }

      .title-page h1 {
        font-size: 24pt;
        margin-bottom: 1in;
      }

      .title-page h2 {
        font-size: 18pt;
        font-weight: normal;
      }

      .chapter {
        page-break-before: always;
      }

      .chapter h1 {
        font-size: 16pt;
        text-align: center;
        margin-bottom: 1in;
      }

      p {
        text-indent: ${template.indent}in;
        margin: 0;
        margin-bottom: 12pt;
      }

      .page-break {
        page-break-after: always;
      }

      .toc ul {
        list-style: none;
        padding: 0;
      }

      .toc li {
        margin-bottom: 6pt;
      }
    `;
  }

  convertMarkdownToHTML(markdown) {
    return markdown
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(.+)$/gm, '<p>$1</p>')
      .replace(/<p><\/p>/g, '');
  }

  async convertHTMLToPDF(htmlPath, outputPath, template) {
    // Try using puppeteer if available
    try {
      const puppeteer = require('puppeteer');
      const browser = await puppeteer.launch();
      const page = await browser.newPage();

      await page.goto(`file://${htmlPath}`);
      await page.pdf({
        path: outputPath,
        format: template.pageSize.toUpperCase(),
        margin: {
          top: `${template.margins.top}in`,
          right: `${template.margins.right}in`,
          bottom: `${template.margins.bottom}in`,
          left: `${template.margins.left}in`
        },
        printBackground: true
      });

      await browser.close();
      return;
    } catch (error) {
      console.log('Puppeteer not available, trying wkhtmltopdf...');
    }

    // Fallback to wkhtmltopdf
    return new Promise((resolve, reject) => {
      const wkhtmltopdf = spawn('wkhtmltopdf', [
        '--page-size', template.pageSize,
        '--margin-top', `${template.margins.top}in`,
        '--margin-right', `${template.margins.right}in`,
        '--margin-bottom', `${template.margins.bottom}in`,
        '--margin-left', `${template.margins.left}in`,
        htmlPath,
        outputPath
      ]);

      wkhtmltopdf.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`wkhtmltopdf failed with code ${code}`));
        }
      });

      wkhtmltopdf.on('error', (error) => {
        reject(new Error(`Failed to start wkhtmltopdf: ${error.message}`));
      });
    });
  }

  async createEPUBStructure(epubDir, exportData, options) {
    // Create directory structure
    await fs.ensureDir(path.join(epubDir, 'META-INF'));
    await fs.ensureDir(path.join(epubDir, 'OEBPS'));

    // Create mimetype
    await fs.writeFile(path.join(epubDir, 'mimetype'), 'application/epub+zip');

    // Create container.xml
    const containerXml = `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
    await fs.writeFile(path.join(epubDir, 'META-INF', 'container.xml'), containerXml);

    // Create content.opf
    const contentOpf = this.generateContentOPF(exportData, options);
    await fs.writeFile(path.join(epubDir, 'OEBPS', 'content.opf'), contentOpf);

    // Create toc.ncx
    const tocNcx = this.generateTocNCX(exportData);
    await fs.writeFile(path.join(epubDir, 'OEBPS', 'toc.ncx'), tocNcx);

    // Create chapter files
    for (let i = 0; i < exportData.content.length; i++) {
      const chapter = exportData.content[i];
      const chapterHtml = this.generateChapterHTML(chapter, i + 1);
      await fs.writeFile(path.join(epubDir, 'OEBPS', `chapter${i + 1}.xhtml`), chapterHtml);
    }

    // Create CSS file
    const css = this.generateEPUBCSS(options);
    await fs.writeFile(path.join(epubDir, 'OEBPS', 'styles.css'), css);
  }

  generateContentOPF(exportData, options) {
    const uuid = `urn:uuid:${require('crypto').randomUUID()}`;

    let manifest = '';
    let spine = '';

    exportData.content.forEach((chapter, index) => {
      const id = `chapter${index + 1}`;
      manifest += `    <item id="${id}" href="${id}.xhtml" media-type="application/xhtml+xml"/>\n`;
      spine += `    <itemref idref="${id}"/>\n`;
    });

    return `<?xml version="1.0"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:identifier id="BookId">${uuid}</dc:identifier>
    <dc:title>${exportData.metadata.title}</dc:title>
    <dc:creator>${exportData.metadata.author}</dc:creator>
    <dc:language>en</dc:language>
    <dc:date>${new Date().toISOString().split('T')[0]}</dc:date>
    <meta name="cover" content="cover"/>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="css" href="styles.css" media-type="text/css"/>
${manifest}  </manifest>
  <spine toc="ncx">
${spine}  </spine>
</package>`;
  }

  generateTocNCX(exportData) {
    const uuid = require('crypto').randomUUID();

    let navPoints = '';
    exportData.content.forEach((chapter, index) => {
      navPoints += `
    <navPoint id="navpoint-${index + 1}" playOrder="${index + 1}">
      <navLabel>
        <text>${chapter.title}</text>
      </navLabel>
      <content src="chapter${index + 1}.xhtml"/>
    </navPoint>`;
    });

    return `<?xml version="1.0"?>
<!DOCTYPE ncx PUBLIC "-//NISO//DTD ncx 2005-1//EN" "http://www.daisy.org/z3986/2005/ncx-2005-1.dtd">
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="urn:uuid:${uuid}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle>
    <text>${exportData.metadata.title}</text>
  </docTitle>
  <navMap>${navPoints}
  </navMap>
</ncx>`;
  }

  generateChapterHTML(chapter, chapterNumber) {
    return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${chapter.title}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <h1>Chapter ${chapterNumber}: ${chapter.title}</h1>
  ${this.convertMarkdownToHTML(chapter.content)}
</body>
</html>`;
  }

  generateEPUBCSS(options) {
    return `
body {
  font-family: Georgia, serif;
  font-size: 1em;
  line-height: 1.4;
  margin: 1em;
}

h1 {
  font-size: 1.5em;
  text-align: center;
  margin: 2em 0 1em 0;
  page-break-before: always;
}

h2 {
  font-size: 1.3em;
  margin: 1.5em 0 0.5em 0;
}

h3 {
  font-size: 1.1em;
  margin: 1em 0 0.5em 0;
}

p {
  margin: 0;
  text-indent: 1em;
  margin-bottom: 0.5em;
}

p.no-indent {
  text-indent: 0;
}

.scene-break {
  text-align: center;
  margin: 2em 0;
  font-size: 1.2em;
}
`;
  }

  async packageEPUB(epubDir, outputPath) {
    // Use a zip library to package the EPUB
    const archiver = require('archiver');
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { store: true });

    return new Promise((resolve, reject) => {
      output.on('close', resolve);
      archive.on('error', reject);

      archive.pipe(output);

      // Add mimetype first (uncompressed)
      archive.file(path.join(epubDir, 'mimetype'), { name: 'mimetype', store: true });

      // Add other files
      archive.directory(path.join(epubDir, 'META-INF'), 'META-INF');
      archive.directory(path.join(epubDir, 'OEBPS'), 'OEBPS');

      archive.finalize();
    });
  }

  generateRTFHeader(options) {
    return `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}} \\f0\\fs24 `;
  }

  generateRTFChapter(chapter, chapterNumber, options) {
    const content = chapter.content
      .replace(/\*\*(.*?)\*\*/g, '{\\b $1}') // Bold
      .replace(/\*(.*?)\*/g, '{\\i $1}') // Italic
      .replace(/\n\n/g, '\\par\\par ') // Paragraphs
      .replace(/\n/g, ' '); // Line breaks

    return `\\pard\\sa200\\sl276\\slmult1\\qc\\f0\\fs28\\b Chapter ${chapterNumber}: ${chapter.title}\\b0\\par
\\pard\\sa200\\sl276\\slmult1\\f0\\fs24 ${content}\\par\\page `;
  }

  estimatePageCount(exportData, template) {
    const wordsPerPage = template.pageSize === 'letter' ? 250 : 300;
    return Math.ceil(exportData.metadata.wordCount / wordsPerPage);
  }

  // Get export templates
  getTemplates() {
    return this.templates;
  }

  // Get supported formats
  getSupportedFormats() {
    return this.supportedFormats;
  }
}

module.exports = new ExportManager();
