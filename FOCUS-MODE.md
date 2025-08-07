# Focus Mode Documentation

Focus mode is a distraction-free writing feature in the Writers CLI GUI that provides a fullscreen, minimalist environment for concentrated writing sessions. It eliminates visual clutter and keeps you focused on your words.

## What is Focus Mode?

Focus mode transforms the entire application window into a clean, fullscreen writing space with:
- Minimal interface elements
- Enhanced text padding and spacing
- Larger, more comfortable font size
- Real-time statistics without distraction
- Independent typewriter mode support
- Auto-save functionality

## Benefits

- **Eliminate Distractions**: Hide sidebars, toolbars, and other UI elements
- **Enhanced Comfort**: Larger fonts and better spacing for extended writing sessions
- **Improved Focus**: Keep your attention solely on the content you're creating
- **Seamless Experience**: Auto-save ensures you never lose your work
- **Flexible Environment**: Choose your preferred writing setup with optional typewriter mode

## How to Access Focus Mode

### Method 1: Toolbar Button
1. Open any file in the Writers CLI GUI editor
2. Click the "Focus Mode" button in the editor toolbar
3. The application will switch to fullscreen focus mode

### Method 2: Keyboard Shortcuts
- **F11**: Toggle focus mode on/off
- **Ctrl+Shift+F**: Alternative focus mode toggle
- **Escape**: Exit focus mode (when in focus mode)

### Prerequisites
- You must have a file open in the editor
- Focus mode is only available when editing content

## Focus Mode Interface

### Header Elements

**Left Side:**
- **Focus Mode Title**: Shows "✨ Focus Mode" with current file name
- **Keyboard Shortcuts**: Quick reference for F11/Esc to exit, Ctrl+S to save

**Right Side:**
- **Statistics**: Real-time word and character count
- **Typewriter Toggle**: Independent typewriter mode for focus sessions
- **Save Button**: Manual save trigger
- **Exit Button**: Return to normal editor view

### Writing Area

- **Enhanced Padding**: 64px horizontal padding for comfortable margins
- **Larger Font**: 18px font size (vs 14px in normal mode)
- **Improved Line Height**: 2.0 line spacing for better readability
- **Maximum Width**: 900px maximum width, centered for optimal reading
- **Subtle Focus Ring**: Visual feedback when typing

## Features

### Auto-Save
- **Automatic Saving**: Content saves automatically every 2 seconds of inactivity
- **Manual Save**: Use Ctrl+S for immediate save
- **Background Sync**: Changes sync with the main editor seamlessly
- **No Data Loss**: Auto-save ensures your work is always preserved

### Real-Time Statistics
- **Word Count**: Live word counting as you type
- **Character Count**: Total character count including spaces
- **Unobtrusive Display**: Stats shown in header without interrupting flow
- **Accurate Counting**: Smart word detection handles various text formats

### Typewriter Mode Integration
- **Independent Toggle**: Separate typewriter control within focus mode
- **Enhanced Centering**: Adjusted padding (35vh top, 70vh bottom) for focus mode
- **Smooth Scrolling**: Optimized scroll behavior for fullscreen environment
- **Visual Consistency**: Same centering behavior as regular editor

### Visual Design
- **Clean Aesthetics**: Minimal, distraction-free interface
- **Theme Support**: Works with all GUI themes (light, dark, sepia, etc.)
- **Smooth Animations**: Gentle fade-in effects when entering focus mode
- **Enhanced Scrollbars**: Custom scrollbar styling for better visual integration

## Keyboard Shortcuts

### Focus Mode Specific
- **F11** or **Ctrl+Shift+F**: Enter/exit focus mode
- **Escape**: Exit focus mode
- **Ctrl+S**: Manual save

### While in Focus Mode
- **All standard text editing shortcuts work**
- **Typewriter mode shortcuts** (if typewriter is enabled)
- **Standard clipboard operations** (Ctrl+C, Ctrl+V, Ctrl+X)

## Usage Scenarios

### Ideal For
- **First Drafts**: Concentrate on getting ideas down without distractions
- **Creative Writing**: Immersive environment for fiction and creative content
- **Long-Form Content**: Novels, articles, essays, and lengthy documents
- **Editing Sessions**: Focus on line-by-line editing and refinement
- **Timed Writing**: Pomodoro sessions or writing sprints

### Best Practices
1. **Prepare Your Session**: Have your outline or notes ready before entering focus mode
2. **Set Goals**: Define what you want to accomplish in the session
3. **Use Typewriter Mode**: Enable typewriter centering for even better focus
4. **Trust Auto-Save**: Don't worry about saving - it happens automatically
5. **Take Breaks**: Exit focus mode periodically to review overall document structure

## Technical Details

### Performance
- **Lightweight**: Minimal resource usage compared to full GUI
- **Optimized Scrolling**: Efficient scroll handling for long documents
- **Memory Efficient**: Reduced DOM elements improve performance
- **Battery Friendly**: Lower CPU usage during extended writing sessions

### Compatibility
- **All Themes**: Works with light, dark, sepia, high contrast, and custom themes
- **Vim Mode**: Fully compatible with vim keybindings
- **Auto-Save**: Integrates with existing auto-save functionality
- **Cross-Platform**: Works on Windows, macOS, and Linux

### Data Handling
- **Real-Time Sync**: Changes immediately reflected in main editor
- **Consistent State**: Content stays synchronized between views
- **Safe Exit**: Content is automatically saved when exiting focus mode
- **No Data Loss**: Multiple safety mechanisms prevent content loss

## Customization

### Visual Adjustments
Currently, focus mode uses these settings:
- **Font Size**: 18px (125% larger than normal)
- **Line Height**: 2.0 (enhanced readability)
- **Max Width**: 900px (optimal line length)
- **Padding**: 64px horizontal, 35vh/70vh vertical (typewriter mode)

### Future Customization Options
Planned enhancements include:
- **Adjustable Font Size**: User-configurable text size
- **Custom Padding**: Adjustable margins and spacing
- **Background Options**: Subtle textures or colors
- **Focus Themes**: Specialized color schemes for focus mode

## Troubleshooting

### Common Issues

**Focus Mode Won't Activate**
- Ensure you have a file open in the editor
- Try using the keyboard shortcut (F11) instead of the button
- Check if another modal is currently open

**Auto-Save Not Working**
- Auto-save activates after 2 seconds of no typing
- Manual save with Ctrl+S always works
- Check file permissions if saves are failing

**Statistics Not Updating**
- Statistics update in real-time as you type
- Try clicking in the text area to ensure focus
- Refresh the application if numbers seem stuck

**Typewriter Mode Issues in Focus**
- Typewriter has independent toggle in focus mode
- Scroll behavior is optimized for larger focus mode padding
- Try toggling typewriter off and on if centering seems off

**Exit Issues**
- Multiple exit methods: F11, Escape, or Exit button
- Content is automatically saved on exit
- Try Escape key if other methods don't respond

### Performance Tips
- **Close Other Applications**: Maximize system resources for writing
- **Use Full Screen**: Better immersion with OS fullscreen (F11 in browser)
- **Disable Notifications**: Minimize interruptions during focus sessions
- **Regular Breaks**: Exit focus mode occasionally to prevent system sluggishness

## Integration with Other Features

### Vim Mode Compatibility
- **Full Support**: All vim keybindings work in focus mode
- **Mode Indicators**: Visual vim mode feedback maintained
- **Navigation**: Standard vim navigation (hjkl, w, b, etc.)
- **Editing Commands**: Insert, append, and other vim commands function normally

### Project Integration
- **File Context**: Focus mode shows current file name in header
- **Project Continuity**: Return to same project state when exiting
- **Statistics Integration**: Word counts contribute to overall project stats
- **Backup System**: Focus mode content included in project backups

### Theme System
- **Automatic Adaptation**: Focus mode inherits current theme settings
- **Enhanced Readability**: Optimized contrast and spacing for each theme
- **Smooth Transitions**: Theme changes apply immediately in focus mode
- **Consistent Experience**: Visual harmony with overall application design

## Future Enhancements

### Planned Features
- **Focus Timers**: Built-in pomodoro or custom timers
- **Writing Goals**: Session-specific word or time targets
- **Ambient Sounds**: Optional background sounds or music
- **Custom Backgrounds**: Subtle textures or patterns
- **Multiple Focus Modes**: Different layouts for different writing types
- **Session Statistics**: Track focus mode usage and productivity

### User Requests
- **Split Focus Mode**: Side-by-side notes and writing areas
- **Outline Integration**: Collapsible outline panel in focus mode
- **Research Panel**: Quick access to research notes without leaving focus
- **Collaboration**: Real-time collaborative focus sessions
- **Export from Focus**: Direct export without returning to main interface

## Best Practices for Focus Mode

### Before Starting
1. **Clear Your Space**: Minimize physical and digital distractions
2. **Set Intentions**: Know what you want to accomplish
3. **Gather Resources**: Have any reference materials ready
4. **Choose Your Setup**: Decide if you want typewriter mode enabled

### During Writing
1. **Trust the Process**: Let ideas flow without heavy editing
2. **Use Statistics**: Keep an eye on progress without obsessing
3. **Stay in Mode**: Resist urge to switch back to check other features
4. **Take Breaks**: Step away periodically to maintain perspective

### After Sessions
1. **Review Progress**: Check what you accomplished
2. **Light Editing**: Make quick corrections before exiting
3. **Plan Next Session**: Note where to continue next time
4. **Save Manually**: Use Ctrl+S for peace of mind before exiting

---

Focus mode is designed to help you enter a state of flow where words come naturally and distractions fade away. By providing a clean, comfortable writing environment with just the right amount of useful information, it enables you to concentrate on what matters most: your writing.

For additional help or feature requests, please refer to the main Writers CLI documentation or submit feedback through the project repository.