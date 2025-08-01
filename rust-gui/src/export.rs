use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use tempfile::TempDir;
use walkdir::WalkDir;

use crate::commands::ExportOptions;
use crate::utils;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportMetadata {
    pub title: String,
    pub author: Option<String>,
    pub description: Option<String>,
    pub genre: Option<String>,
    pub language: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub word_count: usize,
    pub chapter_count: usize,
}

pub struct ExportManager {
    temp_dir: Option<TempDir>,
}

impl ExportManager {
    pub fn new() -> Self {
        Self { temp_dir: None }
    }

    pub fn export_to_pdf(
        &self,
        project_path: &str,
        output_path: &str,
        options: &ExportOptions,
    ) -> Result<()> {
        let project_path = Path::new(project_path);
        let output_path = Path::new(output_path);

        // Ensure output directory exists
        if let Some(parent) = output_path.parent() {
            fs::create_dir_all(parent)?;
        }

        // Generate HTML first
        let html_content = self.generate_html_content(project_path, options)?;

        // Use a library like wkhtmltopdf or headless chrome for PDF generation
        // For now, we'll use a simple approach with pandoc if available
        if self.is_pandoc_available() {
            self.convert_html_to_pdf_with_pandoc(&html_content, output_path, options)?;
        } else {
            // Fallback: save as HTML with print styles
            let styled_html = self.add_pdf_styles(&html_content, options)?;
            fs::write(output_path.with_extension("html"), styled_html)?;

            return Err(anyhow!(
                "PDF export requires pandoc or wkhtmltopdf. HTML version saved instead."
            ));
        }

        Ok(())
    }

    pub fn export_to_epub(
        &self,
        project_path: &str,
        output_path: &str,
        options: &ExportOptions,
    ) -> Result<()> {
        let project_path = Path::new(project_path);
        let output_path = Path::new(output_path);

        // Ensure output directory exists
        if let Some(parent) = output_path.parent() {
            fs::create_dir_all(parent)?;
        }

        // Create temporary EPUB structure
        let temp_dir = tempfile::tempdir()?;
        let epub_dir = temp_dir.path();

        self.create_epub_structure(project_path, epub_dir, options)?;

        // Package EPUB (requires zip)
        self.package_epub(epub_dir, output_path)?;

        Ok(())
    }

    pub fn export_to_docx(
        &self,
        project_path: &str,
        output_path: &str,
        options: &ExportOptions,
    ) -> Result<()> {
        let project_path = Path::new(project_path);
        let output_path = Path::new(output_path);

        // Ensure output directory exists
        if let Some(parent) = output_path.parent() {
            fs::create_dir_all(parent)?;
        }

        // Generate markdown content
        let markdown_content = self.collect_markdown_content(project_path)?;

        // Use pandoc for DOCX conversion if available
        if self.is_pandoc_available() {
            self.convert_markdown_to_docx_with_pandoc(&markdown_content, output_path, options)?;
        } else {
            // Fallback: save as rich text format
            let rtf_content = self.convert_markdown_to_rtf(&markdown_content)?;
            fs::write(output_path.with_extension("rtf"), rtf_content)?;

            return Err(anyhow!(
                "DOCX export requires pandoc. RTF version saved instead."
            ));
        }

        Ok(())
    }

    pub fn export_to_html(
        &self,
        project_path: &str,
        output_path: &str,
        options: &ExportOptions,
    ) -> Result<()> {
        let project_path = Path::new(project_path);
        let output_path = Path::new(output_path);

        // Ensure output directory exists
        if let Some(parent) = output_path.parent() {
            fs::create_dir_all(parent)?;
        }

        let html_content = self.generate_html_content(project_path, options)?;
        fs::write(output_path, html_content)?;

        Ok(())
    }

    fn generate_html_content(
        &self,
        project_path: &Path,
        options: &ExportOptions,
    ) -> Result<String> {
        let metadata = self.extract_project_metadata(project_path)?;
        let chapters = self.collect_chapters(project_path)?;

        let mut html = String::new();

        // HTML header
        html.push_str("<!DOCTYPE html>\n");
        html.push_str("<html lang=\"en\">\n");
        html.push_str("<head>\n");
        html.push_str("    <meta charset=\"UTF-8\">\n");
        html.push_str(
            "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n",
        );
        html.push_str(&format!(
            "    <title>{}</title>\n",
            utils::escape_html(&metadata.title)
        ));

        // Add styles
        if let Some(custom_styles) = &options.custom_styles {
            html.push_str(&format!("    <style>\n{}\n    </style>\n", custom_styles));
        } else {
            html.push_str(&self.get_default_html_styles(options)?);
        }

        html.push_str("</head>\n");
        html.push_str("<body>\n");

        // Title page
        if options.include_metadata {
            html.push_str(&self.generate_title_page(&metadata)?);
        }

        // Table of contents
        html.push_str(&self.generate_table_of_contents(&chapters)?);

        // Content
        for (index, chapter) in chapters.iter().enumerate() {
            html.push_str(&format!(
                "<div class=\"chapter\" id=\"chapter-{}\">\n",
                index + 1
            ));

            let chapter_html = self.markdown_to_html(&chapter.content)?;
            html.push_str(&chapter_html);

            html.push_str("</div>\n");

            // Page break after each chapter
            html.push_str("<div class=\"page-break\"></div>\n");
        }

        html.push_str("</body>\n");
        html.push_str("</html>");

        Ok(html)
    }

    fn collect_chapters(&self, project_path: &Path) -> Result<Vec<ChapterContent>> {
        let chapters_dir = project_path.join("chapters");
        let mut chapters = Vec::new();

        if !chapters_dir.exists() {
            return Ok(chapters);
        }

        // Collect all markdown files in chapters directory
        let mut chapter_files = Vec::new();
        for entry in WalkDir::new(&chapters_dir)
            .max_depth(1)
            .into_iter()
            .filter_map(|e| e.ok())
        {
            if entry.file_type().is_file() {
                if let Some(extension) = entry.path().extension() {
                    if extension == "md" || extension == "txt" {
                        chapter_files.push(entry.path().to_path_buf());
                    }
                }
            }
        }

        // Sort files by name
        chapter_files.sort();

        // Read chapter content
        for file_path in chapter_files {
            let content = fs::read_to_string(&file_path)?;
            let (metadata, body) = self.parse_chapter_frontmatter(&content);

            let title = metadata
                .get("title")
                .and_then(|v| v.as_str())
                .unwrap_or_else(|| {
                    file_path
                        .file_stem()
                        .unwrap()
                        .to_str()
                        .unwrap_or("Untitled")
                })
                .to_string();

            let order = metadata
                .get("order")
                .and_then(|v| v.as_u64())
                .unwrap_or(chapters.len() as u64 + 1) as usize;

            chapters.push(ChapterContent {
                title,
                content: body,
                order,
                file_path: file_path.clone(),
            });
        }

        // Sort by order
        chapters.sort_by_key(|c| c.order);

        Ok(chapters)
    }

    fn collect_markdown_content(&self, project_path: &Path) -> Result<String> {
        let chapters = self.collect_chapters(project_path)?;
        let mut content = String::new();

        for chapter in chapters {
            content.push_str(&format!("# {}\n\n", chapter.title));
            content.push_str(&chapter.content);
            content.push_str("\n\n");
        }

        Ok(content)
    }

    fn extract_project_metadata(&self, project_path: &Path) -> Result<ExportMetadata> {
        let config_path = project_path.join("writers-project.json");

        let metadata = if config_path.exists() {
            let config_content = fs::read_to_string(&config_path)?;
            let config: serde_json::Value = serde_json::from_str(&config_content)?;

            ExportMetadata {
                title: config
                    .get("name")
                    .and_then(|v| v.as_str())
                    .unwrap_or("Untitled")
                    .to_string(),
                author: config
                    .get("author")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string()),
                description: config
                    .get("description")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string()),
                genre: config
                    .get("genre")
                    .and_then(|v| v.as_str())
                    .map(|s| s.to_string()),
                language: "en".to_string(),
                created_at: chrono::Utc::now(),
                word_count: 0,
                chapter_count: 0,
            }
        } else {
            ExportMetadata {
                title: project_path
                    .file_name()
                    .unwrap_or_default()
                    .to_str()
                    .unwrap_or("Untitled")
                    .to_string(),
                author: None,
                description: None,
                genre: None,
                language: "en".to_string(),
                created_at: chrono::Utc::now(),
                word_count: 0,
                chapter_count: 0,
            }
        };

        Ok(metadata)
    }

    fn parse_chapter_frontmatter(
        &self,
        content: &str,
    ) -> (std::collections::HashMap<String, serde_json::Value>, String) {
        let mut metadata = std::collections::HashMap::new();
        let mut content_body = content.to_string();

        if content.starts_with("---\n") {
            if let Some(end_pos) = content[4..].find("\n---\n") {
                let frontmatter = &content[4..end_pos + 4];
                content_body = content[end_pos + 8..].to_string();

                // Parse YAML-like frontmatter
                for line in frontmatter.lines() {
                    if let Some(colon_pos) = line.find(':') {
                        let key = line[..colon_pos].trim();
                        let value = line[colon_pos + 1..].trim();

                        let parsed_value = if let Ok(num) = value.parse::<i64>() {
                            serde_json::Value::Number(serde_json::Number::from(num))
                        } else if let Ok(boolean) = value.parse::<bool>() {
                            serde_json::Value::Bool(boolean)
                        } else {
                            serde_json::Value::String(value.trim_matches('"').to_string())
                        };

                        metadata.insert(key.to_string(), parsed_value);
                    }
                }
            }
        }

        (metadata, content_body)
    }

    fn markdown_to_html(&self, markdown: &str) -> Result<String> {
        // Use pulldown-cmark to convert markdown to HTML
        use pulldown_cmark::{html, Parser};

        let parser = Parser::new(markdown);
        let mut html_output = String::new();
        html::push_html(&mut html_output, parser);

        Ok(html_output)
    }

    fn generate_title_page(&self, metadata: &ExportMetadata) -> Result<String> {
        let mut html = String::new();

        html.push_str("<div class=\"title-page\">\n");
        html.push_str(&format!(
            "    <h1 class=\"title\">{}</h1>\n",
            utils::escape_html(&metadata.title)
        ));

        if let Some(author) = &metadata.author {
            html.push_str(&format!(
                "    <p class=\"author\">by {}</p>\n",
                utils::escape_html(author)
            ));
        }

        if let Some(description) = &metadata.description {
            html.push_str(&format!(
                "    <p class=\"description\">{}</p>\n",
                utils::escape_html(description)
            ));
        }

        html.push_str("</div>\n");
        html.push_str("<div class=\"page-break\"></div>\n");

        Ok(html)
    }

    fn generate_table_of_contents(&self, chapters: &[ChapterContent]) -> Result<String> {
        let mut html = String::new();

        html.push_str("<div class=\"table-of-contents\">\n");
        html.push_str("    <h2>Table of Contents</h2>\n");
        html.push_str("    <ul>\n");

        for (index, chapter) in chapters.iter().enumerate() {
            html.push_str(&format!(
                "        <li><a href=\"#chapter-{}\">{}</a></li>\n",
                index + 1,
                utils::escape_html(&chapter.title)
            ));
        }

        html.push_str("    </ul>\n");
        html.push_str("</div>\n");
        html.push_str("<div class=\"page-break\"></div>\n");

        Ok(html)
    }

    fn get_default_html_styles(&self, options: &ExportOptions) -> Result<String> {
        let font_family = options.font_family.as_deref().unwrap_or("Georgia, serif");
        let font_size = options.font_size.unwrap_or(12);

        let styles = format!(
            r#"
    <style>
        body {{
            font-family: {font_family};
            font-size: {font_size}pt;
            line-height: 1.6;
            margin: 0;
            padding: 2cm;
            color: #333;
        }}

        .title-page {{
            text-align: center;
            margin-top: 30vh;
        }}

        .title {{
            font-size: 2.5em;
            margin-bottom: 0.5em;
            font-weight: bold;
        }}

        .author {{
            font-size: 1.2em;
            margin-bottom: 2em;
            font-style: italic;
        }}

        .description {{
            font-size: 1em;
            max-width: 600px;
            margin: 0 auto;
            line-height: 1.8;
        }}

        .table-of-contents {{
            margin: 2em 0;
        }}

        .table-of-contents h2 {{
            border-bottom: 2px solid #333;
            padding-bottom: 0.5em;
        }}

        .table-of-contents ul {{
            list-style-type: none;
            padding: 0;
        }}

        .table-of-contents li {{
            margin: 0.8em 0;
            font-size: 1.1em;
        }}

        .table-of-contents a {{
            text-decoration: none;
            color: #333;
            border-bottom: 1px dotted #666;
        }}

        .chapter {{
            margin: 2em 0;
        }}

        .chapter h1 {{
            font-size: 1.8em;
            margin-bottom: 1em;
            border-bottom: 1px solid #ddd;
            padding-bottom: 0.5em;
        }}

        .chapter h2 {{
            font-size: 1.4em;
            margin-top: 1.5em;
            margin-bottom: 0.8em;
        }}

        .chapter p {{
            text-align: justify;
            margin-bottom: 1em;
            text-indent: 1.5em;
        }}

        .chapter p:first-of-type {{
            text-indent: 0;
        }}

        .page-break {{
            page-break-after: always;
        }}

        @media print {{
            body {{
                margin: 0;
                padding: 1cm;
            }}

            .page-break {{
                page-break-after: always;
            }}
        }}
    </style>
"#
        );

        Ok(styles)
    }

    fn add_pdf_styles(&self, html_content: &str, options: &ExportOptions) -> Result<String> {
        let page_size = options.page_size.as_deref().unwrap_or("A4");

        let pdf_styles = format!(
            r#"
    <style>
        @page {{
            size: {page_size};
            margin: 2cm;
        }}

        @media print {{
            body {{
                margin: 0;
                padding: 0;
            }}
        }}
    </style>
"#
        );

        // Insert PDF styles before closing head tag
        let styled_html = html_content.replace("</head>", &format!("{}</head>", pdf_styles));
        Ok(styled_html)
    }

    fn create_epub_structure(
        &self,
        project_path: &Path,
        epub_dir: &Path,
        options: &ExportOptions,
    ) -> Result<()> {
        // Create EPUB directory structure
        fs::create_dir_all(epub_dir.join("META-INF"))?;
        fs::create_dir_all(epub_dir.join("OEBPS"))?;

        // Create mimetype file
        fs::write(epub_dir.join("mimetype"), "application/epub+zip")?;

        // Create container.xml
        let container_xml = r#"<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
    <rootfiles>
        <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
    </rootfiles>
</container>"#;
        fs::write(
            epub_dir.join("META-INF").join("container.xml"),
            container_xml,
        )?;

        let metadata = self.extract_project_metadata(project_path)?;
        let chapters = self.collect_chapters(project_path)?;

        // Create content.opf
        let content_opf = self.generate_epub_opf(&metadata, &chapters)?;
        fs::write(epub_dir.join("OEBPS").join("content.opf"), content_opf)?;

        // Create toc.ncx
        let toc_ncx = self.generate_epub_toc(&metadata, &chapters)?;
        fs::write(epub_dir.join("OEBPS").join("toc.ncx"), toc_ncx)?;

        // Create chapter files
        for (index, chapter) in chapters.iter().enumerate() {
            let chapter_html = self.generate_epub_chapter(chapter)?;
            fs::write(
                epub_dir
                    .join("OEBPS")
                    .join(format!("chapter{}.xhtml", index + 1)),
                chapter_html,
            )?;
        }

        Ok(())
    }

    fn generate_epub_opf(
        &self,
        metadata: &ExportMetadata,
        chapters: &[ChapterContent],
    ) -> Result<String> {
        let mut opf = String::new();

        opf.push_str(
            r#"<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="2.0">
    <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
"#,
        );

        opf.push_str(&format!(
            "        <dc:title>{}</dc:title>\n",
            utils::escape_html(&metadata.title)
        ));

        if let Some(author) = &metadata.author {
            opf.push_str(&format!(
                "        <dc:creator>{}</dc:creator>\n",
                utils::escape_html(author)
            ));
        }

        opf.push_str(&format!(
            "        <dc:language>{}</dc:language>\n",
            metadata.language
        ));
        opf.push_str("        <dc:identifier id=\"BookId\">urn:uuid:12345</dc:identifier>\n");

        opf.push_str("    </metadata>\n");
        opf.push_str("    <manifest>\n");
        opf.push_str(
            "        <item id=\"ncx\" href=\"toc.ncx\" media-type=\"application/x-dtbncx+xml\"/>\n",
        );

        for i in 1..=chapters.len() {
            opf.push_str(&format!(
                "        <item id=\"chapter{}\" href=\"chapter{}.xhtml\" media-type=\"application/xhtml+xml\"/>\n",
                i, i
            ));
        }

        opf.push_str("    </manifest>\n");
        opf.push_str("    <spine toc=\"ncx\">\n");

        for i in 1..=chapters.len() {
            opf.push_str(&format!("        <itemref idref=\"chapter{}\"/>\n", i));
        }

        opf.push_str("    </spine>\n");
        opf.push_str("</package>");

        Ok(opf)
    }

    fn generate_epub_toc(
        &self,
        metadata: &ExportMetadata,
        chapters: &[ChapterContent],
    ) -> Result<String> {
        let mut toc = String::new();

        toc.push_str(
            r#"<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE ncx PUBLIC "-//NISO//DTD ncx 2005-1//EN" "http://www.daisy.org/z3986/2005/ncx-2005-1.dtd">
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
    <head>
        <meta name="dtb:uid" content="urn:uuid:12345"/>
        <meta name="dtb:depth" content="1"/>
        <meta name="dtb:totalPageCount" content="0"/>
        <meta name="dtb:maxPageNumber" content="0"/>
    </head>
"#,
        );

        toc.push_str(&format!(
            "    <docTitle><text>{}</text></docTitle>\n",
            utils::escape_html(&metadata.title)
        ));
        toc.push_str("    <navMap>\n");

        for (index, chapter) in chapters.iter().enumerate() {
            toc.push_str(&format!(
                "        <navPoint id=\"chapter{}\" playOrder=\"{}\">\n",
                index + 1,
                index + 1
            ));
            toc.push_str(&format!(
                "            <navLabel><text>{}</text></navLabel>\n",
                utils::escape_html(&chapter.title)
            ));
            toc.push_str(&format!(
                "            <content src=\"chapter{}.xhtml\"/>\n",
                index + 1
            ));
            toc.push_str("        </navPoint>\n");
        }

        toc.push_str("    </navMap>\n");
        toc.push_str("</ncx>");

        Ok(toc)
    }

    fn generate_epub_chapter(&self, chapter: &ChapterContent) -> Result<String> {
        let mut html = String::new();

        html.push_str(
            r#"<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <title>"#,
        );
        html.push_str(&utils::escape_html(&chapter.title));
        html.push_str(
            r#"</title>
    <style>
        body { font-family: serif; margin: 1em; }
        h1 { font-size: 1.5em; margin-bottom: 1em; }
        p { text-align: justify; margin-bottom: 1em; }
    </style>
</head>
<body>
"#,
        );

        let content_html = self.markdown_to_html(&chapter.content)?;
        html.push_str(&content_html);

        html.push_str("</body>\n</html>");

        Ok(html)
    }

    fn package_epub(&self, epub_dir: &Path, output_path: &Path) -> Result<()> {
        use std::io::{Seek, Write};

        let file = fs::File::create(output_path)?;
        let mut archive = zip::ZipWriter::new(file);

        let options =
            zip::write::FileOptions::default().compression_method(zip::CompressionMethod::Stored);

        // Add mimetype first (uncompressed)
        archive.start_file("mimetype", options)?;
        archive.write_all(b"application/epub+zip")?;

        // Add other files
        for entry in WalkDir::new(epub_dir).into_iter().filter_map(|e| e.ok()) {
            let path = entry.path();
            if path.is_file() && path != epub_dir.join("mimetype") {
                let relative_path = path.strip_prefix(epub_dir)?;
                let relative_path_str = relative_path.to_str().unwrap_or_default();

                archive.start_file(relative_path_str, zip::write::FileOptions::default())?;
                let content = fs::read(path)?;
                archive.write_all(&content)?;
            }
        }

        archive.finish()?;
        Ok(())
    }

    fn convert_markdown_to_rtf(&self, markdown: &str) -> Result<String> {
        // Simple RTF conversion (basic formatting only)
        let mut rtf = String::new();

        rtf.push_str(
            r#"{\rtf1\ansi\deff0 {\fonttbl {\f0 Times New Roman;}}
\f0\fs24 "#,
        );

        // Convert basic markdown to RTF
        let html = self.markdown_to_html(markdown)?;
        let plain_text = html
            .replace("<h1>", r"\b ")
            .replace("</h1>", r"\b0\par ")
            .replace("<h2>", r"\b ")
            .replace("</h2>", r"\b0\par ")
            .replace("<p>", "")
            .replace("</p>", r"\par ")
            .replace("<strong>", r"\b ")
            .replace("</strong>", r"\b0 ")
            .replace("<em>", r"\i ")
            .replace("</em>", r"\i0 ");

        rtf.push_str(&plain_text);
        rtf.push_str("}");

        Ok(rtf)
    }

    fn is_pandoc_available(&self) -> bool {
        Command::new("pandoc").arg("--version").output().is_ok()
    }

    fn convert_html_to_pdf_with_pandoc(
        &self,
        html_content: &str,
        output_path: &Path,
        _options: &ExportOptions,
    ) -> Result<()> {
        let temp_dir = tempfile::tempdir()?;
        let temp_html = temp_dir.path().join("temp.html");
        fs::write(&temp_html, html_content)?;

        let output = Command::new("pandoc")
            .arg(temp_html.to_str().unwrap())
            .arg("-o")
            .arg(output_path.to_str().unwrap())
            .arg("--pdf-engine=wkhtmltopdf")
            .output()?;

        if !output.status.success() {
            return Err(anyhow!(
                "Pandoc PDF conversion failed: {}",
                String::from_utf8_lossy(&output.stderr)
            ));
        }

        Ok(())
    }

    fn convert_markdown_to_docx_with_pandoc(
        &self,
        markdown_content: &str,
        output_path: &Path,
        _options: &ExportOptions,
    ) -> Result<()> {
        let temp_dir = tempfile::tempdir()?;
        let temp_md = temp_dir.path().join("temp.md");
        fs::write(&temp_md, markdown_content)?;

        let output = Command::new("pandoc")
            .arg(temp_md.to_str().unwrap())
            .arg("-o")
            .arg(output_path.to_str().unwrap())
            .output()?;

        if !output.status.success() {
            return Err(anyhow!(
                "Pandoc DOCX conversion failed: {}",
                String::from_utf8_lossy(&output.stderr)
            ));
        }

        Ok(())
    }
}

#[derive(Debug, Clone)]
struct ChapterContent {
    title: String,
    content: String,
    order: usize,
    file_path: PathBuf,
}

impl Default for ExportManager {
    fn default() -> Self {
        Self::new()
    }
}
