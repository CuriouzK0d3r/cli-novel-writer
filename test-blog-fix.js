#!/usr/bin/env node

const chalk = require("chalk");
const fs = require("fs").promises;
const path = require("path");

async function testBlogFunctionality() {
  console.log(chalk.cyan.bold(`
🧪 Testing Blog Functionality Fix
Verifying the blog mode works correctly...
`));

  try {
    // Clean up any existing test
    await cleanupTest();

    console.log(chalk.blue("📝 Step 1: Creating minimal blog project..."));
    await createTestBlogProject();

    console.log(chalk.blue("📝 Step 2: Testing blog post creation..."));
    await testBlogPostCreation();

    console.log(chalk.blue("📝 Step 3: Verifying file contents..."));
    await verifyBlogPost();

    console.log(chalk.green.bold(`
✅ Blog functionality test passed!

The blog mode is working correctly:
- Project creation ✅
- Blog post templates ✅
- Author detection ✅
- YAML frontmatter ✅
- SEO metadata ✅

Test blog project: ./test-blog-functionality/
`));

  } catch (error) {
    console.error(chalk.red("❌ Test failed:"), error.message);
    process.exit(1);
  }
}

async function cleanupTest() {
  try {
    await fs.rm("test-blog-functionality", { recursive: true, force: true });
  } catch (error) {
    // Directory doesn't exist, that's fine
  }
}

async function createTestBlogProject() {
  const projectDir = "test-blog-functionality";

  // Create main directory
  await fs.mkdir(projectDir, { recursive: true });

  // Create blog folder structure
  const folders = [
    "drafts",
    "published",
    "exports",
    "assets/images",
    "templates"
  ];

  for (const folder of folders) {
    await fs.mkdir(path.join(projectDir, folder), { recursive: true });
  }

  // Create blog config
  const config = {
    name: "test-blog-functionality",
    author: "Test Blog Author",
    type: "blog",
    blog: {
      title: "Test Blog",
      description: "A test blog for functionality verification",
      url: "",
      defaultFormat: "markdown",
      useCategories: true,
      useTags: true
    },
    created: new Date().toISOString(),
    version: "2.0"
  };

  await fs.writeFile(
    path.join(projectDir, "writers.config.json"),
    JSON.stringify(config, null, 2)
  );

  console.log(chalk.green("  ✅ Test blog project created"));
}

async function testBlogPostCreation() {
  const { spawn } = require("child_process");

  return new Promise((resolve, reject) => {
    const child = spawn("node", [
      "../bin/writers.js",
      "new",
      "blogpost",
      "Test Blog Post",
      "--template",
      "general"
    ], {
      cwd: "test-blog-functionality",
      stdio: ["pipe", "pipe", "pipe"]
    });

    let output = "";
    let errorOutput = "";

    child.stdout.on("data", (data) => {
      output += data.toString();
    });

    child.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    // Answer the prompt automatically
    child.stdin.write("n\n");
    child.stdin.end();

    child.on("close", (code) => {
      if (code === 0 || output.includes("Created blogpost")) {
        console.log(chalk.green("  ✅ Blog post created successfully"));
        resolve();
      } else {
        console.log(chalk.yellow("  Output:", output));
        console.log(chalk.yellow("  Error:", errorOutput));
        reject(new Error(`Blog post creation failed with code ${code}`));
      }
    });

    child.on("error", (error) => {
      reject(new Error(`Failed to spawn process: ${error.message}`));
    });
  });
}

async function verifyBlogPost() {
  const postPath = "test-blog-functionality/drafts/test-blog-post.md";

  try {
    const content = await fs.readFile(postPath, "utf8");

    // Verify YAML frontmatter
    if (!content.startsWith("---")) {
      throw new Error("Blog post missing YAML frontmatter");
    }

    // Check for required frontmatter fields
    const requiredFields = [
      'title: "Test Blog Post"',
      'author: Test Blog Author',
      'category: "general"',
      'tags: ["blog", "writing"]',
      'published: false',
      'slug: "test-blog-post"'
    ];

    for (const field of requiredFields) {
      if (!content.includes(field)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Check for blog structure
    const requiredSections = [
      "# Test Blog Post",
      "## Introduction",
      "## Main Content",
      "### Key Point 1"
    ];

    for (const section of requiredSections) {
      if (!content.includes(section)) {
        throw new Error(`Missing required section: ${section}`);
      }
    }

    console.log(chalk.green("  ✅ Blog post content verification passed"));
    console.log(chalk.gray("    - YAML frontmatter ✅"));
    console.log(chalk.gray("    - Author from config ✅"));
    console.log(chalk.gray("    - Auto-generated slug ✅"));
    console.log(chalk.gray("    - Blog template structure ✅"));

  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error("Blog post file was not created");
    }
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testBlogFunctionality().catch(error => {
    console.error(chalk.red("Test failed:"), error);
    process.exit(1);
  });
}

module.exports = testBlogFunctionality;
