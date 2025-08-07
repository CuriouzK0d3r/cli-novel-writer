class SmartWritingTools {
  constructor() {
    this.suggestions = new Map();
    this.grammarRules = this.loadGrammarRules();
    this.styleRules = this.loadStyleRules();
  }

  loadGrammarRules() {
    return [
      { pattern: /\b(it's)\b/gi, suggestion: "its", type: "possession" },
      { pattern: /\b(your)\b(?=\s+(a|an|the))/gi, suggestion: "you're", type: "contraction" },
      { pattern: /\b(there)\b(?=\s+(a|an|the))/gi, suggestion: "their", type: "possession" },
      { pattern: /\b(affect)\b(?=\s+(on|upon))/gi, suggestion: "effect", type: "noun" },
      { pattern: /\b(loose)\b(?=\s+(weight|something))/gi, suggestion: "lose", type: "verb" }
    ];
  }

  loadStyleRules() {
    return [
      { pattern: /\b(very)\s+(\w+)/gi, suggestion: "Consider a stronger word", type: "style" },
      { pattern: /\b(really)\s+(\w+)/gi, suggestion: "Consider removing or using a stronger word", type: "style" },
      { pattern: /\b(just)\b/gi, suggestion: "Often unnecessary", type: "style" },
      { pattern: /\b(that)\b(?=\s+\w+ed)/gi, suggestion: "Often can be removed", type: "style" }
    ];
  }

  analyzeText(text) {
    const issues = [];

    // Grammar check
    this.grammarRules.forEach(rule => {
      const matches = [...text.matchAll(rule.pattern)];
      matches.forEach(match => {
        issues.push({
          type: 'grammar',
          position: match.index,
          length: match[0].length,
          text: match[0],
          suggestion: rule.suggestion,
          rule: rule.type
        });
      });
    });

    // Style check
    this.styleRules.forEach(rule => {
      const matches = [...text.matchAll(rule.pattern)];
      matches.forEach(match => {
        issues.push({
          type: 'style',
          position: match.index,
          length: match[0].length,
          text: match[0],
          suggestion: rule.suggestion,
          rule: rule.type
        });
      });
    });

    return issues;
  }

  getReadabilityScore(text) {
    const sentences = text.split(/[.!?]+/).length - 1;
    const words = text.split(/\s+/).length;
    const syllables = this.countSyllables(text);

    // Flesch Reading Ease Score
    const score = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words));

    return {
      score: Math.max(0, Math.min(100, score)),
      level: this.getReadabilityLevel(score),
      sentences,
      words,
      syllables
    };
  }

  countSyllables(text) {
    return text.toLowerCase()
      .replace(/[^a-z]/g, '')
      .replace(/[aeiouy]+/g, 'a')
      .replace(/a$/, '')
      .length || 1;
  }

  getReadabilityLevel(score) {
    if (score >= 90) return 'Very Easy';
    if (score >= 80) return 'Easy';
    if (score >= 70) return 'Fairly Easy';
    if (score >= 60) return 'Standard';
    if (score >= 50) return 'Fairly Difficult';
    if (score >= 30) return 'Difficult';
    return 'Very Difficult';
  }
}

module.exports = SmartWritingTools;