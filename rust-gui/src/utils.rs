use anyhow::{anyhow, Result};
use regex::Regex;
use std::collections::HashSet;
use std::time::Duration;

/// Count words in a text string
pub fn count_words(text: &str) -> usize {
    if text.trim().is_empty() {
        return 0;
    }

    // Remove markdown formatting and count actual words
    let cleaned_text = clean_markdown(text);

    // Split by whitespace and filter out empty strings
    cleaned_text
        .split_whitespace()
        .filter(|word| !word.is_empty())
        .count()
}

/// Count characters in text (excluding whitespace)
pub fn count_characters(text: &str) -> usize {
    text.chars().filter(|c| !c.is_whitespace()).count()
}

/// Count paragraphs in text
pub fn count_paragraphs(text: &str) -> usize {
    if text.trim().is_empty() {
        return 0;
    }

    text.split("\n\n")
        .filter(|para| !para.trim().is_empty())
        .count()
}

/// Estimate reading time in minutes
pub fn estimate_reading_time(text: &str) -> Duration {
    let word_count = count_words(text);

    // Average reading speed: 200-250 words per minute
    // We'll use 225 as a middle ground
    let words_per_minute = 225.0;
    let minutes = (word_count as f64 / words_per_minute).ceil() as u64;

    Duration::from_secs(minutes * 60)
}

/// Clean markdown formatting from text
pub fn clean_markdown(text: &str) -> String {
    let mut cleaned = text.to_string();

    // Remove markdown headers
    let header_re = Regex::new(r"^#+\s*").unwrap();
    cleaned = header_re.replace_all(&cleaned, "").to_string();

    // Remove markdown emphasis
    let emphasis_re = Regex::new(r"[*_]{1,2}([^*_]+)[*_]{1,2}").unwrap();
    cleaned = emphasis_re.replace_all(&cleaned, "$1").to_string();

    // Remove markdown links
    let link_re = Regex::new(r"\[([^\]]+)\]\([^)]+\)").unwrap();
    cleaned = link_re.replace_all(&cleaned, "$1").to_string();

    // Remove markdown code blocks
    let code_block_re = Regex::new(r"```[^`]*```").unwrap();
    cleaned = code_block_re.replace_all(&cleaned, "").to_string();

    // Remove inline code
    let inline_code_re = Regex::new(r"`([^`]+)`").unwrap();
    cleaned = inline_code_re.replace_all(&cleaned, "$1").to_string();

    // Remove markdown lists
    let list_re = Regex::new(r"^[-*+]\s+").unwrap();
    cleaned = list_re.replace_all(&cleaned, "").to_string();

    // Remove numbered lists
    let numbered_list_re = Regex::new(r"^\d+\.\s+").unwrap();
    cleaned = numbered_list_re.replace_all(&cleaned, "").to_string();

    // Remove blockquotes
    let blockquote_re = Regex::new(r"^>\s*").unwrap();
    cleaned = blockquote_re.replace_all(&cleaned, "").to_string();

    // Remove horizontal rules
    let hr_re = Regex::new(r"^---+$").unwrap();
    cleaned = hr_re.replace_all(&cleaned, "").to_string();

    cleaned
}

/// Basic spell check functionality
pub fn spell_check(text: &str, language: Option<&str>) -> Result<Vec<String>> {
    let _language = language.unwrap_or("en_US");

    // This is a simplified spell checker
    // In a real implementation, you would integrate with a proper spell checking library
    // like hunspell or aspell

    let mut errors = Vec::new();
    let words = extract_words(text);
    let dictionary = get_basic_dictionary();

    for word in words {
        let word_lower = word.to_lowercase();
        if !dictionary.contains(&word_lower) && !is_proper_noun(&word) {
            errors.push(word);
        }
    }

    Ok(errors)
}

/// Extract words from text for spell checking
fn extract_words(text: &str) -> Vec<String> {
    let word_re = Regex::new(r"\b[a-zA-Z]+\b").unwrap();
    word_re
        .find_iter(text)
        .map(|m| m.as_str().to_string())
        .collect()
}

/// Check if a word is likely a proper noun
fn is_proper_noun(word: &str) -> bool {
    if word.is_empty() {
        return false;
    }

    // Check if first character is uppercase
    word.chars().next().unwrap().is_uppercase()
}

/// Get a basic dictionary for spell checking
/// In a real implementation, this would load from a proper dictionary file
fn get_basic_dictionary() -> HashSet<String> {
    let common_words = vec![
        "the",
        "be",
        "to",
        "of",
        "and",
        "a",
        "in",
        "that",
        "have",
        "i",
        "it",
        "for",
        "not",
        "on",
        "with",
        "he",
        "as",
        "you",
        "do",
        "at",
        "this",
        "but",
        "his",
        "by",
        "from",
        "they",
        "she",
        "or",
        "an",
        "will",
        "my",
        "one",
        "all",
        "would",
        "there",
        "their",
        "what",
        "so",
        "up",
        "out",
        "if",
        "about",
        "who",
        "get",
        "which",
        "go",
        "when",
        "make",
        "can",
        "like",
        "time",
        "no",
        "just",
        "him",
        "know",
        "take",
        "people",
        "into",
        "year",
        "your",
        "good",
        "some",
        "could",
        "them",
        "see",
        "other",
        "than",
        "then",
        "now",
        "look",
        "only",
        "come",
        "its",
        "over",
        "think",
        "also",
        "back",
        "after",
        "use",
        "two",
        "how",
        "our",
        "work",
        "first",
        "well",
        "way",
        "even",
        "new",
        "want",
        "because",
        "any",
        "these",
        "give",
        "day",
        "most",
        "us",
        "is",
        "was",
        "are",
        "been",
        "has",
        "had",
        "were",
        "said",
        "each",
        "which",
        "she",
        "do",
        "how",
        "their",
        "if",
        "will",
        "up",
        "other",
        "about",
        "out",
        "many",
        "then",
        "them",
        "these",
        "so",
        "some",
        "her",
        "would",
        "make",
        "like",
        "into",
        "him",
        "time",
        "has",
        "two",
        "more",
        "very",
        "what",
        "know",
        "just",
        "first",
        "get",
        "over",
        "think",
        "where",
        "much",
        "go",
        "well",
        "were",
        "been",
        "have",
        "had",
        "has",
        "say",
        "each",
        "which",
        "their",
        "said",
        "she",
        "use",
        "how",
        "many",
        "oil",
        "sit",
        "its",
        "now",
        "find",
        "long",
        "down",
        "day",
        "did",
        "get",
        "come",
        "made",
        "may",
        "part",
        "write",
        "story",
        "novel",
        "chapter",
        "character",
        "plot",
        "scene",
        "dialogue",
        "narrative",
        "fiction",
        "author",
        "book",
        "page",
        "word",
        "sentence",
        "paragraph",
        "manuscript",
        "draft",
        "edit",
        "revision",
        "protagonist",
        "antagonist",
        "conflict",
        "climax",
        "resolution",
        "setting",
        "theme",
        "genre",
        "fantasy",
        "romance",
        "mystery",
        "thriller",
        "horror",
        "comedy",
        "drama",
        "adventure",
        "science",
        "historical",
        "contemporary",
    ];

    common_words.into_iter().map(|s| s.to_string()).collect()
}

/// Format duration as human-readable string
pub fn format_duration(duration: Duration) -> String {
    let total_seconds = duration.as_secs();
    let hours = total_seconds / 3600;
    let minutes = (total_seconds % 3600) / 60;
    let seconds = total_seconds % 60;

    if hours > 0 {
        format!("{}h {}m {}s", hours, minutes, seconds)
    } else if minutes > 0 {
        format!("{}m {}s", minutes, seconds)
    } else {
        format!("{}s", seconds)
    }
}

/// Format word count with appropriate units
pub fn format_word_count(count: usize) -> String {
    if count >= 1_000_000 {
        format!("{:.1}M words", count as f64 / 1_000_000.0)
    } else if count >= 1_000 {
        format!("{:.1}K words", count as f64 / 1_000.0)
    } else {
        format!("{} words", count)
    }
}

/// Sanitize filename for cross-platform compatibility
pub fn sanitize_filename(name: &str) -> String {
    let invalid_chars = ['<', '>', ':', '"', '/', '\\', '|', '?', '*'];
    let mut sanitized = String::new();

    for ch in name.chars() {
        if invalid_chars.contains(&ch) {
            sanitized.push('_');
        } else if ch.is_control() {
            sanitized.push('_');
        } else {
            sanitized.push(ch);
        }
    }

    // Trim leading/trailing whitespace and dots
    sanitized = sanitized
        .trim_matches(|c: char| c.is_whitespace() || c == '.')
        .to_string();

    // Ensure filename is not empty
    if sanitized.is_empty() {
        sanitized = "untitled".to_string();
    }

    // Limit length to 255 characters (common filesystem limit)
    if sanitized.len() > 255 {
        sanitized.truncate(252);
        sanitized.push_str("...");
    }

    sanitized
}

/// Calculate text statistics
#[derive(Debug, Clone)]
pub struct TextStats {
    pub word_count: usize,
    pub character_count: usize,
    pub character_count_no_spaces: usize,
    pub paragraph_count: usize,
    pub sentence_count: usize,
    pub reading_time: Duration,
    pub average_words_per_sentence: f64,
    pub average_words_per_paragraph: f64,
}

pub fn calculate_text_stats(text: &str) -> TextStats {
    let word_count = count_words(text);
    let character_count = text.len();
    let character_count_no_spaces = count_characters(text);
    let paragraph_count = count_paragraphs(text);
    let sentence_count = count_sentences(text);
    let reading_time = estimate_reading_time(text);

    let average_words_per_sentence = if sentence_count > 0 {
        word_count as f64 / sentence_count as f64
    } else {
        0.0
    };

    let average_words_per_paragraph = if paragraph_count > 0 {
        word_count as f64 / paragraph_count as f64
    } else {
        0.0
    };

    TextStats {
        word_count,
        character_count,
        character_count_no_spaces,
        paragraph_count,
        sentence_count,
        reading_time,
        average_words_per_sentence,
        average_words_per_paragraph,
    }
}

/// Count sentences in text
pub fn count_sentences(text: &str) -> usize {
    if text.trim().is_empty() {
        return 0;
    }

    // Simple sentence detection based on punctuation
    let sentence_endings = ['.', '!', '?'];
    let mut count = 0;
    let mut last_was_ending = false;

    for ch in text.chars() {
        if sentence_endings.contains(&ch) {
            if !last_was_ending {
                count += 1;
            }
            last_was_ending = true;
        } else if !ch.is_whitespace() {
            last_was_ending = false;
        }
    }

    // If text doesn't end with punctuation but has content, count as one sentence
    if !last_was_ending && !text.trim().is_empty() {
        count += 1;
    }

    count
}

/// Generate a random filename with timestamp
pub fn generate_filename(prefix: &str, extension: &str) -> String {
    let timestamp = chrono::Utc::now().format("%Y%m%d_%H%M%S");
    format!("{}_{}.{}", prefix, timestamp, extension)
}

/// Check if a path is safe (within project boundaries)
pub fn is_safe_path(path: &std::path::Path, project_root: &std::path::Path) -> bool {
    match path.canonicalize() {
        Ok(canonical_path) => match project_root.canonicalize() {
            Ok(canonical_root) => canonical_path.starts_with(canonical_root),
            Err(_) => false,
        },
        Err(_) => false,
    }
}

/// Convert markdown to plain text
pub fn markdown_to_plain_text(markdown: &str) -> String {
    clean_markdown(markdown)
}

/// Escape HTML entities in text
pub fn escape_html(text: &str) -> String {
    text.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&#x27;")
}

/// Convert plain text to basic markdown
pub fn text_to_markdown(text: &str) -> String {
    // Simple conversion - just preserve line breaks
    text.lines()
        .map(|line| {
            if line.trim().is_empty() {
                String::new()
            } else {
                line.to_string()
            }
        })
        .collect::<Vec<String>>()
        .join("\n\n")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_count_words() {
        assert_eq!(count_words(""), 0);
        assert_eq!(count_words("   "), 0);
        assert_eq!(count_words("hello world"), 2);
        assert_eq!(count_words("hello,  world!"), 2);
        assert_eq!(count_words("# Title\n\nSome **bold** text."), 4);
    }

    #[test]
    fn test_clean_markdown() {
        let markdown = "# Title\n\nSome **bold** text with `code`.";
        let cleaned = clean_markdown(markdown);
        assert_eq!(cleaned, " Title\n\nSome bold text with code.");
    }

    #[test]
    fn test_count_sentences() {
        assert_eq!(count_sentences(""), 0);
        assert_eq!(count_sentences("Hello world."), 1);
        assert_eq!(count_sentences("Hello world. How are you?"), 2);
        assert_eq!(count_sentences("Hello world! Are you okay? Yes."), 3);
    }

    #[test]
    fn test_sanitize_filename() {
        assert_eq!(sanitize_filename("hello world"), "hello world");
        assert_eq!(sanitize_filename("hello/world"), "hello_world");
        assert_eq!(sanitize_filename("hello<>world"), "hello__world");
        assert_eq!(sanitize_filename(""), "untitled");
    }
}
