# Typewriter Mode Quick Start Guide

## What is Typewriter Mode?

Typewriter mode keeps your cursor at a consistent position on the screen (about 2/3 down) while you write, automatically scrolling the text above as you add new lines. This creates a focused writing experience similar to using a physical typewriter.

## How to Enable

1. **Open any file in the Writers CLI editor:**
   ```bash
   writers edit your-file
   # or
   writers write your-chapter
   ```

2. **Press F9 to toggle typewriter mode ON**
   - You'll see "TYPEWRITER" appear in the status bar
   - Your cursor will be repositioned to the target line

3. **Enter insert mode and start writing:**
   - Press `i` to enter insert mode
   - Start typing - your cursor stays in the same screen position
   - Text above scrolls up automatically as you add new lines

## Quick Test

Try this 30-second test:

1. Run: `npm run test-typewriter`
2. Press F9 (typewriter mode ON)
3. Press `i` (insert mode)
4. Go to the end of the file
5. Type several lines and press Enter between each
6. Notice how your cursor stays centered while text scrolls up
7. Press F9 again (typewriter mode OFF) and see the difference
8. Press Ctrl+X to exit

## Key Commands

| Key | Action |
|-----|--------|
| `F9` | Toggle typewriter mode ON/OFF |
| `i` | Enter insert mode (for typing) |
| `Escape` | Return to navigation mode |
| `F11` | Toggle distraction-free mode |
| `Ctrl+X` | Exit editor |

## Perfect For

- **Long writing sessions** - Reduces neck strain
- **First drafts** - Stay focused on current content
- **Flow writing** - Minimal interruptions
- **Touch typing** - Consistent cursor position

## Tips

1. **Combine with distraction-free mode** (F11) for ultimate focus
2. **Works best when typing forward** - doesn't interfere with editing
3. **Setting is saved per project** - no need to re-enable each time
4. **Use with any file type** - chapters, scenes, notes, etc.

## Troubleshooting

**Cursor doesn't stay centered?**
- Make sure you're in insert mode (`i`)
- Typewriter mode only activates when adding new content
- Manual cursor movement temporarily overrides positioning

**Setting not saving?**
- Ensure you're in a Writers CLI project directory
- Check that `writers.config.json` exists and is writable

---

**Ready to try it?** Run `npm run test-typewriter` and experience focused writing!