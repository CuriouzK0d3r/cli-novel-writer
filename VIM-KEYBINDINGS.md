# Vim Keybindings in Writers CLI Editor

The Writers CLI GUI includes a powerful vim-style editor with two distinct modes: **Normal** and **Insert**. This provides familiar navigation and editing capabilities for vim users while maintaining accessibility for others.

## Overview

The editor starts in **Normal Mode** by default when vim keybindings are enabled. You can toggle vim mode on/off using the "Vim: ON/OFF" button in the editor toolbar.

### Visual Indicators

- **Normal Mode**: Red tinted background, cursor is hidden
- **Insert Mode**: Green tinted background, normal cursor
- **Status Display**: Shows current mode in the editor info bar
- **Help Text**: Quick reference visible when vim mode is active

## Mode Switching

| Key | Action |
|-----|--------|
| `Escape` | Switch to Normal mode (from any mode) |
| `i` | Enter Insert mode at current cursor position |
| `I` | Enter Insert mode at beginning of current line |
| `a` | Enter Insert mode after current cursor position |
| `A` | Enter Insert mode at end of current line |
| `o` | Open new line below current line and enter Insert mode |
| `O` | Open new line above current line and enter Insert mode |

## Normal Mode Navigation

### Basic Movement
| Key | Action |
|-----|--------|
| `h` or `←` | Move cursor left |
| `j` or `↓` | Move cursor down |
| `k` or `↑` | Move cursor up |
| `l` or `→` | Move cursor right |

### Line Navigation
| Key | Action |
|-----|--------|
| `0` | Move to beginning of current line |
| `$` | Move to end of current line |

### Word Navigation
| Key | Action |
|-----|--------|
| `w` | Move to beginning of next word |
| `b` | Move to beginning of previous word |

## Normal Mode Editing

### Character Deletion
| Key | Action |
|-----|--------|
| `x` | Delete character under cursor |
| `X` | Delete character before cursor |

### Undo (Limited Support)
| Key | Action |
|-----|--------|
| `u` | Undo (uses browser's native undo when Ctrl+Z is pressed) |

## Insert Mode

In Insert mode, the editor behaves like a normal text editor:

- All typed characters are inserted at the cursor position
- Arrow keys work for navigation
- Backspace, Delete, Enter work as expected
- All standard text editing shortcuts (Ctrl+C, Ctrl+V, etc.) work normally
- Press `Escape` to return to Normal mode

## Key Features

### Smart Navigation
- **Line-aware movement**: `j` and `k` remember your column position when moving between lines
- **Word boundaries**: `w` and `b` recognize word boundaries for efficient navigation
- **Line boundaries**: `0` and `$` provide quick line navigation

### Visual Mode Distinction
- **Background tinting**: Clear visual indication of current mode
- **Cursor behavior**: Hidden cursor in Normal mode, visible in Insert mode
- **Status updates**: Real-time mode display in editor status bar

### Seamless Integration
- **Auto-save compatibility**: Works with the 3-second auto-save feature
- **Word count updates**: Live statistics update as you edit
- **Standard shortcuts**: File operations (Ctrl+S) work in both modes

## Usage Tips

### For Vim Users
- The keybindings follow standard vim conventions
- Most common editing patterns work as expected
- Use `Escape` liberally to ensure you're in the right mode
- The visual indicators help confirm your current mode

### For New Users
- Start with the basics: `i` to edit, `Escape` to stop editing
- Use arrow keys if vim navigation feels unfamiliar
- The vim toggle button lets you disable the feature entirely
- Help text shows the most important keys

### Writing Workflow
1. **Open editor**: File opens in Normal mode
2. **Start writing**: Press `i` to enter Insert mode
3. **Navigate efficiently**: Use `Escape` then movement keys to jump around
4. **Quick edits**: `A` to append to line, `o` to create new line
5. **Continue writing**: Return to Insert mode to continue

## Advanced Tips

### Efficient Line Editing
- `A` - Jump to end of line and start typing
- `I` - Jump to beginning of line and start typing  
- `o` - Create new line below and start typing
- `O` - Create new line above and start typing

### Quick Navigation
- `0` followed by `w` to jump to first word of line
- `$` to jump to end of line for quick appending
- `w` repeatedly to skip through words quickly

### Mode Awareness
- Watch the background color to know your current mode
- Check the status indicator if you're unsure
- Red = Normal (navigation), Green = Insert (typing)

## Limitations

This implementation focuses on the most commonly used vim keybindings for writing and editing. Some advanced vim features are not included:

- **Not Supported**: Visual mode, complex commands, macros, registers
- **Limited**: Only basic movement and editing commands
- **Browser-dependent**: Some shortcuts may conflict with browser shortcuts

## Troubleshooting

### Keys Not Working
- Ensure vim mode is enabled (check the toggle button)
- Make sure you're in the correct mode (check background color)
- Some browser shortcuts may override vim keys

### Unexpected Behavior
- Press `Escape` to ensure you're in Normal mode
- Check the status indicator to confirm current mode
- Toggle vim mode off and on to reset if needed

### Performance
- Vim keybindings are processed in real-time
- No impact on auto-save or word counting features
- Works with all file types and content lengths

## Getting Help

- **Visual Cues**: Background colors and status text show current state
- **Help Text**: Key hints displayed in editor when vim mode is active
- **Toggle**: Use the vim toggle button to enable/disable as needed
- **Fallback**: All standard editing features work when vim mode is disabled

The vim keybindings in Writers CLI provide a powerful, familiar editing experience while maintaining the simplicity and accessibility needed for creative writing workflows.