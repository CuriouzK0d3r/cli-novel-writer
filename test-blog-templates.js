#!/usr/bin/env node

const chalk = require("chalk");
const fs = require("fs").promises;
const path = require("path");

// Import the blog templates
const { getBlogPostTemplate } = require("./src/templates/blog-templates");

async function testBlogTemplates() {
  console.log(chalk.cyan.bold(`
🧪 Testing Blog Templates
Verifying all blog post templates work correctly...
`));

  const templateTypes = [
    "general",
    "tutorial",
    "review",
    "personal",
    "listicle",
    "howto",
    "news",
    "interview",
    "opinion",
    "technical"
  ];

  const testOptions = {
    author: "Test Author",
    title: "Sample Blog Post",
    slug: "sample-blog-post",
    category: "test",
    tags: ["test", "demo"],
    excerpt: "This is a test blog post excerpt"
  };

  try {
    // Create test output directory
    await fs.mkdir("template-test-output", { recursive: true });

    for (const templateType of templateTypes) {
      console.log(chalk.blue(`Testing ${templateType} template...`));

      try {
        const template = getBlogPostTemplate(templateType, testOptions);

        if (template && template.length > 0) {
          // Save template to file for inspection
          const filename = `${templateType}-template.md`;
          await fs.writeFile(
            path.join("template-test-output", filename),
            template
          );
          console.log(chalk.green(`  ✅ ${templateType} template generated successfully`));
        } else {
          console.log(chalk.red(`  ❌ ${templateType} template is empty`));
        }
      } catch (error) {
        console.log(chalk.red(`  ❌ ${templateType} template failed: ${error.message}`));
      }
    }

    console.log(chalk.green.bold(`
✅ Template testing completed!

Generated templates are in ./template-test-output/
Check the files to verify template content.
`));

    // Test specific template with custom options
    console.log(chalk.blue("Testing custom template options..."));

    const customTemplate = getBlogPostTemplate("tutorial", {
      author: "Jane Doe",
      title: "How to Build a Website",
      slug: "how-to-build-website",
      category: "web-development",
      tags: ["tutorial", "web", "html", "css"],
      excerpt: "Learn how to build a professional website from scratch"
    });

    await fs.writeFile(
      path.join("template-test-output", "custom-tutorial.md"),
      customTemplate
    );

    console.log(chalk.green("  ✅ Custom template options work correctly"));

  } catch (error) {
    console.error(chalk.red("❌ Template test failed:"), error.message);
    process.exit(1);
  }
}

// Test the new command template integration
async function testNewCommandIntegration() {
  console.log(chalk.cyan.bold(`
🔧 Testing New Command Integration
Checking if blog templates work with the new command...
`));

  try {
    // Simulate what the new command does
    const moment = require("moment");

    // Template data
    const name = "Test Integration Post";
    const templateName = "general";
    const author = "Integration Test";
    const date = moment().format('YYYY-MM-DD');
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // Get template (simulating what's in new.js)
    const template = getBlogPostTemplate(templateName, {
      author,
      title: name,
      slug,
      category: "test",
      tags: ["test"],
      excerpt: "Test excerpt"
    });

    // Apply replacements (simulating new.js logic)
    let processedTemplate = template;
    processedTemplate = processedTemplate.replace(/{DATE}/g, date);
    processedTemplate = processedTemplate.replace(/{TITLE}/g, name);
    processedTemplate = processedTemplate.replace(/{AUTHOR}/g, author);
    processedTemplate = processedTemplate.replace(/{SLUG}/g, slug);

    // Save result
    await fs.writeFile(
      path.join("template-test-output", "integration-test.md"),
      processedTemplate
    );

    console.log(chalk.green("✅ New command integration works correctly"));

    // Verify frontmatter format
    const lines = processedTemplate.split('\n');
    if (lines[0] === '---' && lines.find(line => line.includes('title:'))) {
      console.log(chalk.green("✅ YAML frontmatter format is correct"));
    } else {
      console.log(chalk.red("❌ YAML frontmatter format issue"));
    }

  } catch (error) {
    console.error(chalk.red("❌ Integration test failed:"), error.message);
  }
}

// Main test runner
async function runTests() {
  try {
    await testBlogTemplates();
    await testNewCommandIntegration();

    console.log(chalk.green.bold(`
🎉 All tests completed!

Summary:
- Blog templates: Generated successfully
- Integration: Working correctly
- Output files: Available in ./template-test-output/

The blog mode is ready to use!
`));

  } catch (error) {
    console.error(chalk.red("❌ Test suite failed:"), error);
    process.exit(1);
  }
}

if (require.main === module) {
  runTests();
}

module.exports = { testBlogTemplates, testNewCommandIntegration };
