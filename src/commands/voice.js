const chalk = require("chalk");
const path = require("path");
const fs = require("fs-extra");
const inquirer = require("inquirer");
const VoiceTranscriber = require("../voice/transcriber");

async function voiceCommand(action, target, options = {}) {
  const transcriber = new VoiceTranscriber();

  try {
    switch (action) {
      case "record":
        await handleRecord(transcriber, target, options);
        break;
      case "transcribe":
        await handleTranscribe(transcriber, target, options);
        break;
      case "live":
        await handleLiveTranscription(transcriber, target, options);
        break;
      case "batch":
        await handleBatchTranscription(transcriber, target, options);
        break;
      case "check":
        await handleSystemCheck(transcriber);
        break;
      default:
        await showVoiceMenu(transcriber, options);
        break;
    }
  } catch (error) {
    console.error(chalk.red("❌ Voice command failed:"), error.message);
    process.exit(1);
  } finally {
    transcriber.cleanup();
  }
}

async function showVoiceMenu(transcriber, options) {
  console.log(chalk.bold.cyan("\n🎤 Voice Transcription Menu\n"));

  const choices = [
    {
      name: "🔴 Record and transcribe to new file",
      value: "record_new",
    },
    {
      name: "📝 Record and append to existing file",
      value: "record_append",
    },
    {
      name: "🎯 Transcribe existing audio file",
      value: "transcribe_file",
    },
    {
      name: "🔄 Live transcription (continuous)",
      value: "live",
    },
    {
      name: "📁 Batch transcribe multiple files",
      value: "batch",
    },
    {
      name: "🔍 Check system compatibility",
      value: "check",
    },
    {
      name: "❌ Cancel",
      value: "cancel",
    },
  ];

  const { action } = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "What would you like to do?",
      choices,
    },
  ]);

  if (action === "cancel") {
    console.log(chalk.yellow("Voice transcription cancelled"));
    return;
  }

  switch (action) {
    case "record_new":
      await handleRecordToNew(transcriber, options);
      break;
    case "record_append":
      await handleRecordToExisting(transcriber, options);
      break;
    case "transcribe_file":
      await handleTranscribeFile(transcriber, options);
      break;
    case "live":
      await handleLiveTranscription(transcriber, null, options);
      break;
    case "batch":
      await handleBatchTranscription(transcriber, null, options);
      break;
    case "check":
      await handleSystemCheck(transcriber);
      break;
  }
}

async function handleRecord(transcriber, target, options) {
  // CLI guard: require string paths for target (avoid passing objects)
  const isStringTarget = typeof target === "string" && target.trim() !== "";
  if (target && !isStringTarget) {
    throw new Error(
      'Invalid target argument: expected a file path string. Please pass a string path for the output (for example "note.wav" to save audio or "note.md" to save the transcription).',
    );
  }

  // Determine whether the provided target looks like an audio file (use as audio output)
  const audioExtRegex = /\.(wav|mp3|m4a|flac|ogg|aac)$/i;
  const looksLikeAudio = isStringTarget && audioExtRegex.test(target);
  const audioOutputPath = looksLikeAudio ? target : null;

  // Markdown output (where the transcription text will be saved)
  const markdownOutput =
    isStringTarget && !looksLikeAudio
      ? target
      : `voice_note_${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.md`;

  console.log(
    chalk.blue(
      `🎤 Recording${audioOutputPath ? " audio to" : " voice note to"}: ${
        audioOutputPath || markdownOutput
      }`,
    ),
  );
  console.log(chalk.yellow("Press Ctrl+C to stop recording"));

  try {
    // If user provided an audio path (e.g., mynote.wav), record to that file,
    // otherwise let the transcriber create its own temporary audio file.
    const result = await transcriber.recordAndTranscribe(audioOutputPath, {
      keepAudio: options.keepAudio || false,
      maxDuration: options.maxDuration || 300,
    });

    if (result.text.trim()) {
      // Format the transcription
      const timestamp = new Date().toISOString();
      const content = formatTranscription(result.text, timestamp, options);

      // Write to file (markdown output)
      await fs.writeFile(markdownOutput, content, "utf8");

      console.log(chalk.green(`\n✅ Voice note saved to: ${outputFile}`));
      console.log(
        chalk.gray(`Word count: ${result.text.split(/\s+/).length} words`),
      );

      if (result.audioPath) {
        console.log(chalk.gray(`Audio saved to: ${result.audioPath}`));
      }

      // Preview the transcription
      if (options.preview !== false) {
        console.log(chalk.cyan("\n📝 Transcription preview:"));
        console.log(
          chalk.white(
            result.text.substring(0, 200) +
              (result.text.length > 200 ? "..." : ""),
          ),
        );
      }
    } else {
      console.log(chalk.yellow("⚠️  No speech detected in the recording"));
    }
  } catch (error) {
    console.error(chalk.red("❌ Recording failed:"), error.message);
    throw error;
  }
}

async function handleRecordToNew(transcriber, options) {
  const { filename } = await inquirer.prompt([
    {
      type: "input",
      name: "filename",
      message: "Enter filename for the transcription:",
      default: `voice_note_${new Date().toISOString().slice(0, 10)}.md`,
      validate: (input) => {
        if (!input.trim()) {
          return "Filename cannot be empty";
        }
        return true;
      },
    },
  ]);

  await handleRecord(transcriber, filename, { ...options, preview: true });
}

async function handleRecordToExisting(transcriber, options) {
  // Find existing markdown files
  const markdownFiles = await findMarkdownFiles(".");

  if (markdownFiles.length === 0) {
    console.log(
      chalk.yellow("No markdown files found. Creating new file instead."),
    );
    return await handleRecordToNew(transcriber, options);
  }

  const { targetFile } = await inquirer.prompt([
    {
      type: "list",
      name: "targetFile",
      message: "Select file to append transcription to:",
      choices: [
        ...markdownFiles.map((file) => ({ name: file, value: file })),
        { name: "➕ Create new file", value: "new" },
      ],
    },
  ]);

  if (targetFile === "new") {
    return await handleRecordToNew(transcriber, options);
  }

  console.log(chalk.blue(`🎤 Recording to append to: ${targetFile}`));
  console.log(chalk.yellow("Press Ctrl+C to stop recording"));

  try {
    const result = await transcriber.recordAndTranscribe(null, {
      keepAudio: options.keepAudio || false,
      maxDuration: options.maxDuration || 300,
    });

    if (result.text.trim()) {
      // Format the transcription
      const timestamp = new Date().toISOString();
      const content = formatTranscription(
        result.text,
        timestamp,
        options,
        true,
      );

      // Append to existing file
      await fs.appendFile(targetFile, "\n\n" + content, "utf8");

      console.log(chalk.green(`\n✅ Voice note appended to: ${targetFile}`));
      console.log(
        chalk.gray(`Word count: ${result.text.split(/\s+/).length} words`),
      );

      // Preview the transcription
      console.log(chalk.cyan("\n📝 Transcription preview:"));
      console.log(
        chalk.white(
          result.text.substring(0, 200) +
            (result.text.length > 200 ? "..." : ""),
        ),
      );
    } else {
      console.log(chalk.yellow("⚠️  No speech detected in the recording"));
    }
  } catch (error) {
    console.error(chalk.red("❌ Recording failed:"), error.message);
    throw error;
  }
}

async function handleTranscribe(transcriber, target, options) {
  const audioFile = target;

  if (!audioFile) {
    console.error(chalk.red("❌ Please specify an audio file to transcribe"));
    return;
  }

  if (!fs.existsSync(audioFile)) {
    console.error(chalk.red(`❌ Audio file not found: ${audioFile}`));
    return;
  }

  console.log(chalk.blue(`🎯 Transcribing: ${audioFile}`));

  try {
    const transcription = await transcriber.transcribeFile(audioFile);

    if (transcription.trim()) {
      const outputFile =
        options.output || audioFile.replace(/\.[^/.]+$/, "") + "_transcript.md";
      const timestamp = new Date().toISOString();
      const content = formatTranscription(transcription, timestamp, {
        ...options,
        sourceFile: audioFile,
      });

      await fs.writeFile(outputFile, content, "utf8");

      console.log(chalk.green(`\n✅ Transcription saved to: ${outputFile}`));
      console.log(
        chalk.gray(`Word count: ${transcription.split(/\s+/).length} words`),
      );

      // Preview the transcription
      if (options.preview !== false) {
        console.log(chalk.cyan("\n📝 Transcription preview:"));
        console.log(
          chalk.white(
            transcription.substring(0, 200) +
              (transcription.length > 200 ? "..." : ""),
          ),
        );
      }
    } else {
      console.log(chalk.yellow("⚠️  No speech detected in the audio file"));
    }
  } catch (error) {
    console.error(chalk.red("❌ Transcription failed:"), error.message);
    throw error;
  }
}

async function handleTranscribeFile(transcriber, options) {
  const { audioFile } = await inquirer.prompt([
    {
      type: "input",
      name: "audioFile",
      message: "Enter path to audio file:",
      validate: (input) => {
        if (!input.trim()) {
          return "Please enter a file path";
        }
        if (!fs.existsSync(input.trim())) {
          return "File not found";
        }
        return true;
      },
    },
  ]);

  await handleTranscribe(transcriber, audioFile, { ...options, preview: true });
}

async function handleLiveTranscription(transcriber, target, options) {
  console.log(chalk.bold.cyan("\n🔄 Live Transcription Mode"));
  console.log(
    chalk.yellow("This will continuously record and transcribe in chunks"),
  );
  console.log(chalk.gray("Press Ctrl+C to stop\n"));

  const outputFile =
    target ||
    `live_transcript_${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.md`;

  // Initialize the output file
  const header = `# Live Transcription Session\n\nStarted: ${new Date().toISOString()}\n\n---\n\n`;
  await fs.writeFile(outputFile, header, "utf8");

  let sessionRunning = true;
  let chunkCount = 0;

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    sessionRunning = false;
    console.log(chalk.yellow("\n🛑 Stopping live transcription..."));
  });

  while (sessionRunning) {
    try {
      chunkCount++;
      console.log(
        chalk.blue(`\n🎤 Recording chunk ${chunkCount}... (10 seconds)`),
      );

      const result = await transcriber.recordAndTranscribe(null, {
        keepAudio: false,
        maxDuration: 10, // 10-second chunks
        autoStop: true,
      });

      if (result.text.trim()) {
        const timestamp = new Date().toISOString();
        const chunkContent = `## Chunk ${chunkCount} - ${timestamp.slice(11, 19)}\n\n${result.text}\n\n---\n\n`;

        await fs.appendFile(outputFile, chunkContent, "utf8");
        console.log(
          chalk.green(`✅ Chunk ${chunkCount} transcribed and saved`),
        );
        console.log(chalk.gray(`Words: ${result.text.split(/\s+/).length}`));
      } else {
        console.log(chalk.gray(`No speech detected in chunk ${chunkCount}`));
      }

      // Small delay between chunks
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(
        chalk.red(`❌ Error in chunk ${chunkCount}:`),
        error.message,
      );

      if (error.message.includes("recording already in progress")) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        continue;
      }

      break;
    }
  }

  console.log(
    chalk.green(`\n✅ Live transcription session saved to: ${outputFile}`),
  );
  console.log(chalk.gray(`Total chunks: ${chunkCount}`));
}

async function handleBatchTranscription(transcriber, target, options) {
  let audioFiles = [];

  if (target) {
    // Single file or directory specified
    if (fs.lstatSync(target).isDirectory()) {
      audioFiles = await findAudioFiles(target);
    } else {
      audioFiles = [target];
    }
  } else {
    // Interactive selection
    const audioPattern = "**/*.{wav,mp3,m4a,flac,ogg}";
    audioFiles = await findAudioFiles(".", audioPattern);

    if (audioFiles.length === 0) {
      console.log(chalk.yellow("No audio files found in current directory"));
      return;
    }

    console.log(chalk.cyan(`\nFound ${audioFiles.length} audio files:`));
    audioFiles.forEach((file, index) => {
      console.log(chalk.gray(`  ${index + 1}. ${file}`));
    });

    const { proceed } = await inquirer.prompt([
      {
        type: "confirm",
        name: "proceed",
        message: "Transcribe all these files?",
        default: true,
      },
    ]);

    if (!proceed) {
      console.log(chalk.yellow("Batch transcription cancelled"));
      return;
    }
  }

  console.log(
    chalk.blue(
      `\n🎯 Starting batch transcription of ${audioFiles.length} files...\n`,
    ),
  );

  const results = await transcriber.batchTranscribe(audioFiles, options);

  // Create summary
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(chalk.green(`\n✅ Batch transcription complete!`));
  console.log(chalk.gray(`Successful: ${successful.length}`));
  console.log(chalk.gray(`Failed: ${failed.length}`));

  // Save individual transcriptions
  for (const result of successful) {
    const outputFile = result.file.replace(/\.[^/.]+$/, "") + "_transcript.md";
    const timestamp = new Date().toISOString();
    const content = formatTranscription(result.text, timestamp, {
      sourceFile: result.file,
    });

    await fs.writeFile(outputFile, content, "utf8");
    console.log(chalk.green(`  ✅ ${path.basename(outputFile)}`));
  }

  // Report failures
  if (failed.length > 0) {
    console.log(chalk.red("\n❌ Failed files:"));
    failed.forEach((result) => {
      console.log(chalk.red(`  • ${result.file}: ${result.error}`));
    });
  }
}

async function handleSystemCheck(transcriber) {
  console.log(chalk.bold.cyan("\n🔍 System Compatibility Check\n"));

  try {
    const check = await transcriber.checkSystemCompatibility();

    console.log(chalk.blue("Voice Transcription Dependencies:"));

    // Check Node.js version
    const nodeVersion = process.version;
    console.log(`  Node.js: ${nodeVersion} ${chalk.green("✓")}`);

    // Check platform
    console.log(`  Platform: ${process.platform} ${chalk.green("✓")}`);

    // Check Whisper model availability
    try {
      console.log("  Whisper Model: Testing...");
      await transcriber.initialize();
      console.log(`  Whisper Model: ${chalk.green("✓ Ready")}`);
    } catch (error) {
      console.log(
        `  Whisper Model: ${chalk.red("✗ Error - " + error.message)}`,
      );
    }

    // Check supported audio formats
    const formats = transcriber.getSupportedFormats();
    console.log(
      `  Supported formats: ${formats.join(", ")} ${chalk.green("✓")}`,
    );

    if (check.isReady) {
      console.log(chalk.green("\n✅ System is ready for voice transcription!"));
    } else {
      console.log(chalk.yellow("\n⚠️  System has some limitations:"));
      check.issues.forEach((issue) => {
        console.log(chalk.yellow(`  • ${issue}`));
      });
    }

    console.log(chalk.cyan("\n📋 Usage Tips:"));
    console.log('  • Use "writers voice record" for quick voice notes');
    console.log('  • Use "writers voice live" for continuous transcription');
    console.log("  • WAV files provide the best transcription accuracy");
    console.log("  • Speak clearly and avoid background noise");
  } catch (error) {
    console.error(chalk.red("❌ System check failed:"), error.message);
  }
}

function formatTranscription(text, timestamp, options = {}, isAppend = false) {
  const { sourceFile, includeTimestamp = true } = options;

  let content = "";

  if (!isAppend) {
    content += "# Voice Transcription\n\n";
  }

  if (includeTimestamp) {
    content += `**Transcribed:** ${new Date(timestamp).toLocaleString()}\n`;
  }

  if (sourceFile) {
    content += `**Source:** ${sourceFile}\n`;
  }

  content += "\n---\n\n";
  content += text.trim();

  return content;
}

async function findMarkdownFiles(directory) {
  const glob = require("util").promisify(require("glob"));
  try {
    return await glob("**/*.md", { cwd: directory });
  } catch (error) {
    return [];
  }
}

async function findAudioFiles(
  directory,
  pattern = "**/*.{wav,mp3,m4a,flac,ogg}",
) {
  const glob = require("util").promisify(require("glob"));
  try {
    return await glob(pattern, { cwd: directory });
  } catch (error) {
    return [];
  }
}

module.exports = voiceCommand;
