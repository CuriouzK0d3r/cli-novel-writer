#!/usr/bin/env node

/**
 * Voice Transcription Quick Start Demo
 *
 * This script demonstrates the key voice transcription features
 * available in Writers CLI and helps users get started quickly.
 */

const chalk = require("chalk");
const inquirer = require("inquirer");
const VoiceTranscriber = require("./src/voice/transcriber");
const { checkSystemCompatibility } = require("./src/voice/audio-utils");
const fs = require("fs").promises;
const path = require("path");

console.log(
  chalk.bold.blue("🎤 Writers CLI - Voice Transcription Quick Start\n"),
);

const DEMO_OPTIONS = [
  {
    name: "System Check",
    value: "check",
    description: "Verify your system is compatible with voice transcription",
  },
  {
    name: "Record & Transcribe",
    value: "record",
    description: "Record audio from your microphone and transcribe it",
  },
  {
    name: "Transcribe Audio File",
    value: "file",
    description: "Upload an existing audio file for transcription",
  },
  {
    name: "GUI Demo",
    value: "gui",
    description: "Launch the graphical voice transcription interface",
  },
  {
    name: "View Documentation",
    value: "docs",
    description: "Display voice transcription documentation and tips",
  },
];

async function main() {
  try {
    console.log(chalk.green("Welcome to the Voice Transcription Quick Start!"));
    console.log(
      chalk.gray("This demo will help you explore the voice features.\n"),
    );

    // Show menu
    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "What would you like to do?",
        choices: DEMO_OPTIONS.map((option) => ({
          name: `${chalk.bold(option.name)} - ${chalk.gray(option.description)}`,
          value: option.value,
        })),
      },
    ]);

    switch (action) {
      case "check":
        await runSystemCheck();
        break;
      case "record":
        await runRecordDemo();
        break;
      case "file":
        await runFileDemo();
        break;
      case "gui":
        await runGUIDemo();
        break;
      case "docs":
        await showDocumentation();
        break;
    }
  } catch (error) {
    console.error(chalk.red("\n❌ Error:"), error.message);
    process.exit(1);
  }
}

async function runSystemCheck() {
  console.log(chalk.blue("\n🔍 Checking System Compatibility...\n"));

  try {
    const compatibility = await checkSystemCompatibility();

    console.log(chalk.green("✅ System Check Results:"));
    console.log(`   Node.js: ${process.version}`);
    console.log(`   Platform: ${process.platform}`);
    console.log(`   Architecture: ${process.arch}\n`);

    // Test Whisper model loading
    console.log(chalk.blue("🤖 Testing Whisper model..."));
    const transcriber = new VoiceTranscriber();
    await transcriber.initialize();
    console.log(chalk.green("✅ Whisper model loaded successfully!\n"));

    console.log(
      chalk.green("🎉 Your system is ready for voice transcription!"),
    );
    console.log(chalk.gray("\nNext steps:"));
    console.log(
      chalk.gray('• Try "Record & Transcribe" to test with your microphone'),
    );
    console.log(
      chalk.gray('• Use "GUI Demo" to explore the graphical interface'),
    );
    console.log(chalk.gray("• Run `writers voice --help` for CLI commands"));
  } catch (error) {
    console.error(chalk.red("\n❌ System check failed:"), error.message);
    console.log(chalk.yellow("\nTroubleshooting:"));
    console.log(chalk.yellow("• Ensure Node.js 14+ is installed"));
    console.log(chalk.yellow("• Check internet connection for model download"));
    console.log(chalk.yellow("• Verify microphone permissions"));
  }
}

async function runRecordDemo() {
  console.log(chalk.blue("\n🎙️  Voice Recording Demo\n"));

  try {
    const transcriber = new VoiceTranscriber();
    await transcriber.initialize();

    console.log(chalk.green("✅ Voice transcription system ready!"));
    console.log(
      chalk.gray("This will record 10 seconds of audio and transcribe it.\n"),
    );

    const { confirm } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: "Start recording now?",
        default: true,
      },
    ]);

    if (!confirm) {
      console.log(chalk.yellow("Recording cancelled."));
      return;
    }

    console.log(chalk.blue("\n🎙️  Recording... (10 seconds)"));
    console.log(chalk.gray("Speak clearly into your microphone!"));

    const audioFile = `demo_recording_${Date.now()}.wav`;
    const result = await transcriber.recordAndTranscribe({
      duration: 10,
      outputFile: audioFile,
      preview: false,
    });

    console.log(chalk.green("\n✅ Recording complete!"));
    console.log(chalk.blue("\n📝 Transcription:"));
    console.log(chalk.white(`"${result.text}"`));
    console.log(
      chalk.gray(`\nConfidence: ${Math.round(result.confidence * 100)}%`),
    );
    console.log(chalk.gray(`Duration: ${result.duration}s`));
    console.log(chalk.gray(`Words: ${result.wordCount}`));

    // Offer to save
    const { save } = await inquirer.prompt([
      {
        type: "confirm",
        name: "save",
        message: "Save transcription to a file?",
        default: true,
      },
    ]);

    if (save) {
      const outputFile = `demo_transcription_${Date.now()}.md`;
      const content = `# Voice Transcription Demo\n\n**Date:** ${new Date().toLocaleString()}\n**Duration:** ${result.duration}s\n**Words:** ${result.wordCount}\n\n## Transcription\n\n${result.text}\n`;

      await fs.writeFile(outputFile, content);
      console.log(chalk.green(`\n💾 Saved to: ${outputFile}`));
    }

    // Clean up audio file unless user wants to keep it
    const { keepAudio } = await inquirer.prompt([
      {
        type: "confirm",
        name: "keepAudio",
        message: "Keep the audio file?",
        default: false,
      },
    ]);

    if (!keepAudio) {
      try {
        await fs.unlink(audioFile);
        console.log(chalk.gray("Audio file cleaned up."));
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  } catch (error) {
    console.error(chalk.red("\n❌ Recording failed:"), error.message);
    console.log(chalk.yellow("\nTips:"));
    console.log(chalk.yellow("• Check microphone permissions"));
    console.log(chalk.yellow("• Ensure microphone is connected"));
    console.log(chalk.yellow("• Try speaking closer to the microphone"));
  }
}

async function runFileDemo() {
  console.log(chalk.blue("\n📁 Audio File Transcription Demo\n"));

  try {
    const transcriber = new VoiceTranscriber();
    await transcriber.initialize();

    console.log(chalk.green("✅ Voice transcription system ready!"));
    console.log(
      chalk.gray("Supported formats: WAV, MP3, M4A, FLAC, OGG, WebM\n"),
    );

    const { filePath } = await inquirer.prompt([
      {
        type: "input",
        name: "filePath",
        message: "Enter the path to your audio file:",
        validate: async (input) => {
          if (!input) return "Please enter a file path";

          try {
            await fs.access(input);
            return true;
          } catch (error) {
            return "File not found. Please check the path.";
          }
        },
      },
    ]);

    console.log(chalk.blue("\n🔄 Transcribing audio file..."));
    console.log(chalk.gray("This may take a moment depending on file size."));

    const result = await transcriber.transcribeFile(filePath, {
      progress: (percent) => {
        process.stdout.write(
          `\r${chalk.blue("Progress:")} ${Math.round(percent)}%`,
        );
      },
    });

    console.log(chalk.green("\n\n✅ Transcription complete!"));
    console.log(chalk.blue("\n📝 Transcription:"));
    console.log(chalk.white(`"${result.text}"`));
    console.log(chalk.gray(`\nFile: ${path.basename(filePath)}`));
    console.log(chalk.gray(`Duration: ~${result.duration}s`));
    console.log(chalk.gray(`Words: ${result.wordCount}`));

    // Offer to save
    const { save } = await inquirer.prompt([
      {
        type: "confirm",
        name: "save",
        message: "Save transcription to a markdown file?",
        default: true,
      },
    ]);

    if (save) {
      const baseName = path.basename(filePath, path.extname(filePath));
      const outputFile = `${baseName}_transcription.md`;
      const content = `# Transcription: ${path.basename(filePath)}\n\n**Date:** ${new Date().toLocaleString()}\n**Source:** ${filePath}\n**Duration:** ~${result.duration}s\n**Words:** ${result.wordCount}\n\n## Transcription\n\n${result.text}\n`;

      await fs.writeFile(outputFile, content);
      console.log(chalk.green(`\n💾 Saved to: ${outputFile}`));
    }
  } catch (error) {
    console.error(chalk.red("\n❌ Transcription failed:"), error.message);
    console.log(chalk.yellow("\nTips:"));
    console.log(chalk.yellow("• Ensure the file is a supported audio format"));
    console.log(chalk.yellow("• Check that the file is not corrupted"));
    console.log(chalk.yellow("• Try with a shorter audio file first"));
  }
}

async function runGUIDemo() {
  console.log(chalk.blue("\n💻 GUI Interface Demo\n"));

  console.log(chalk.green("The GUI interface provides:"));
  console.log(chalk.gray("• Visual audio recording controls"));
  console.log(chalk.gray("• Real-time audio visualization"));
  console.log(chalk.gray("• Drag-and-drop file upload"));
  console.log(chalk.gray("• Live transcription editing"));
  console.log(chalk.gray("• Export and save options\n"));

  const { launch } = await inquirer.prompt([
    {
      type: "confirm",
      name: "launch",
      message: "Launch the GUI interface now?",
      default: true,
    },
  ]);

  if (launch) {
    console.log(chalk.blue("\n🚀 Launching GUI..."));

    try {
      const { spawn } = require("child_process");
      const guiProcess = spawn(
        "node",
        ["gui-enhanced-launcher.js", "--enable-voice"],
        {
          stdio: "inherit",
          cwd: __dirname,
        },
      );

      console.log(chalk.green("✅ GUI launched successfully!"));
      console.log(
        chalk.gray("• Use the Voice Transcription tab for voice features"),
      );
      console.log(chalk.gray("• Close the GUI window to return to this demo"));

      guiProcess.on("close", (code) => {
        console.log(chalk.blue("\n👋 GUI closed."));
      });
    } catch (error) {
      console.error(chalk.red("❌ Failed to launch GUI:"), error.message);
      console.log(
        chalk.yellow(
          "Try running: node gui-enhanced-launcher.js --enable-voice",
        ),
      );
    }
  }
}

async function showDocumentation() {
  console.log(chalk.blue("\n📚 Voice Transcription Documentation\n"));

  const docs = `
${chalk.bold.green("🎯 Quick Start Commands")}

${chalk.bold("CLI Commands:")}
  writers voice                    # Interactive menu
  writers voice check              # System compatibility check
  writers voice record [file]     # Record and transcribe
  writers voice transcribe <file> # Transcribe audio file
  writers voice live              # Real-time transcription
  writers voice batch [dir]       # Batch process files

${chalk.bold("GUI Interface:")}
  node gui-enhanced-launcher.js --enable-voice

${chalk.bold.green("🎙️  Recording Tips")}

${chalk.bold("For Best Results:")}
• Use a quiet environment
• Speak clearly and at normal pace
• Stay 6-12 inches from microphone
• Avoid background noise
• Use headphones to prevent feedback

${chalk.bold("Audio Quality:")}
• WAV format recommended (best quality)
• 16kHz or higher sample rate
• Mono or stereo recording supported
• Maximum duration: 5 minutes per file

${chalk.bold.green("🔧 Configuration")}

${chalk.bold("Settings File:")} .writers-enhanced.json
{
  "voice": {
    "maxDuration": 300,
    "keepAudio": false,
    "autoSave": true,
    "outputFormat": "markdown",
    "modelSize": "base"
  }
}

${chalk.bold.green("🚀 Performance")}

${chalk.bold("Model Options:")}
• tiny.en - Fast, English only (39MB)
• base.en - Better accuracy (74MB)
• small.en - High accuracy (244MB)

${chalk.bold("Processing Speed:")}
• ~2x real-time (2min audio = 1min processing)
• First run downloads model (one-time)
• Subsequent runs use cached model

${chalk.bold.green("🛠️  Troubleshooting")}

${chalk.bold("Common Issues:")}
• Model download fails → Check internet connection
• Microphone not working → Check permissions
• Poor transcription → Improve audio quality
• Out of memory → Use smaller model size

${chalk.bold("System Requirements:")}
• Node.js 14.0+
• 2GB RAM minimum
• 1GB disk space
• Internet for initial model download

${chalk.bold.green("📁 File Formats")}

${chalk.bold("Supported Formats:")}
• WAV - Uncompressed, best quality
• MP3 - Compressed, widely compatible
• M4A - Apple/AAC format
• FLAC - Lossless compression
• OGG - Open source format
• WebM - Web media format (browser recordings)

${chalk.bold("Output Formats:")}
• Markdown (.md)
• Plain text (.txt)
• JSON (.json) - with metadata

${chalk.bold.green("🔗 Integration")}

${chalk.bold("With Writers CLI:")}
• Transcriptions integrate with projects
• Auto-append to existing chapters
• Compatible with all export formats
• Works with writing templates

${chalk.bold("Workflow Examples:")}
• Record ideas → Auto-transcribe → Edit in GUI
• Interview transcription → Format → Export
• Voice notes → Append to journal → Sync

${chalk.bold.green("📞 Support")}

${chalk.bold("Getting Help:")}
• Run: writers voice --help
• Check: VOICE_TRANSCRIPTION.md
• Demo: node voice-quickstart.js
• Issues: GitHub repository

For more detailed information, see VOICE_TRANSCRIPTION.md
`;

  console.log(docs);

  const { action } = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "What would you like to do next?",
      choices: [
        { name: "Try a demo", value: "demo" },
        { name: "Read full documentation", value: "docs" },
        { name: "Exit", value: "exit" },
      ],
    },
  ]);

  if (action === "demo") {
    console.log("\n" + "=".repeat(50) + "\n");
    await main();
  } else if (action === "docs") {
    console.log(chalk.blue("\n📖 Opening documentation..."));
    try {
      const { spawn } = require("child_process");
      spawn("open", ["VOICE_TRANSCRIPTION.md"], { stdio: "ignore" });
    } catch (error) {
      console.log(chalk.yellow("Please open VOICE_TRANSCRIPTION.md manually"));
    }
  }
}

// Handle graceful exit
process.on("SIGINT", () => {
  console.log(chalk.yellow("\n\n👋 Thanks for trying voice transcription!"));
  process.exit(0);
});

// Start the demo
if (require.main === module) {
  main()
    .then(() => {
      console.log(chalk.blue("\n🎉 Demo complete! Happy writing!"));
    })
    .catch((error) => {
      console.error(chalk.red("\n❌ Demo error:"), error.message);
      process.exit(1);
    });
}

module.exports = { main };
