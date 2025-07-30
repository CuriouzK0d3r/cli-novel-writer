# Editor Themes System

The Writers CLI Editor features a powerful theming system that allows you to customize the visual appearance of your writing environment. The system provides beautiful, carefully crafted themes designed specifically for long-form writing.

## Available Themes

### Dark Theme (Default) 🌙
A modern dark theme perfect for writing in low-light environments:
- Deep dark background (`#1e1e1e`) with warm white text
- Professional blue accents and status bars
- Syntax highlighting optimized for markdown
- Elegant dimming effects for typewriter mode
- High contrast for excellent readability

### Light Theme ☀️
A clean, minimal light theme for bright environments:
- Pure white background with dark, readable text
- Subtle borders and professional blue accents
- Optimized color palette for daylight writing
- Clear syntax highlighting with warm colors

### Base Theme 🎨
A simple, classic theme:
- Basic black and white color scheme
- Minimal styling for distraction-free writing
- No syntax highlighting (plain text appearance)

## Using Themes

### Quick Theme Switching
- Press **F2** at any time to cycle through available themes
- The current theme name will be displayed briefly when switching
- Theme changes are applied instantly without restarting

### Programmatic Usage
```javascript
const { ThemeManager } = require('./themes');

// Create a theme manager
const themeManager = new ThemeManager();

// Switch themes
themeManager.setTheme('dark');
themeManager.setTheme('light');

// Get available themes
const themes = themeManager.getAvailableThemes();

// Cycle through themes
const nextTheme = themeManager.nextTheme();
```

## Theme Features

### Syntax Highlighting
All themes include markdown syntax highlighting for:
- **Headers** (`# ## ###`) - Bold and colored
- **Emphasis** (`*italic*` and `**bold**`) - Styled text
- **Links** (`[text](url)`) - Underlined and colored
- **Code** (`` `inline` `` and code blocks) - Monospace and highlighted
- **Lists** (`- * +` and `1. 2.`) - Colored markers
- **Quotes** (`> text`) - Styled blockquotes

### UI Components
Each theme customizes:
- **Editor area** - Background, text color, and borders
- **Status bar** - Mode, file info, and position display
- **Info bar** - Messages and notifications
- **Help bar** - Keyboard shortcuts
- **Cursor** - Different styles for insert vs navigation mode
- **Text selection** - Highlighted selected text
- **Typewriter mode** - Dimmed non-focus lines

### Professional Elements
- **Modal status indicators** - Clear INSERT/NORMAL mode display
- **File state indicators** - Modified file markers (●)
- **Word count integration** - Real-time statistics
- **Position tracking** - Line and column numbers
- **Theme identification** - Welcome messages and branding

## Theme Architecture

### Base Theme Class
All themes extend the `BaseTheme` class which provides:
- Color palette management
- Style configuration
- Text formatting methods
- Cursor styling
- Validation system

### Theme Manager
The `ThemeManager` handles:
- Theme registration and loading
- Theme switching and cycling
- Component style application
- Dialog theming
- State management

### File Structure
```
themes/
├── index.js          # Main exports and convenience functions
├── base-theme.js     # Base theme class
├── dark-theme.js     # Modern dark theme
├── light-theme.js    # Clean light theme
├── theme-manager.js  # Theme management system
└── README.md         # This documentation
```

## Creating Custom Themes

To create a new theme:

1. **Extend BaseTheme**:
```javascript
const BaseTheme = require('./base-theme');

class MyTheme extends BaseTheme {
  constructor() {
    super();
    this.name = 'mytheme';
    this.displayName = 'My Custom Theme';
    this.isDark = true; // or false
  }
}
```

2. **Define Colors**:
```javascript
getColors() {
  return {
    background: '#your-bg-color',
    foreground: '#your-text-color',
    border: '#your-border-color',
    // ... other colors
  };
}
```

3. **Register Theme**:
```javascript
const themeManager = new ThemeManager();
themeManager.registerTheme(new MyTheme());
```

### Color Requirements
Each theme must define these essential colors:
- `background` - Main editor background
- `foreground` - Primary text color
- `border` - UI element borders
- `borderFocus` - Focused element borders
- `statusBg/statusFg` - Status bar colors
- `selectionBg/selectionFg` - Text selection colors

## Design Philosophy

The theme system is designed around these principles:

### Writing-Focused
- Colors and contrast optimized for long reading/writing sessions
- Minimal distractions and clean interfaces
- Professional appearance suitable for serious writing work

### Accessibility
- High contrast ratios for better readability
- Clear visual hierarchy and element separation
- Support for different lighting environments

### Consistency
- Unified color schemes across all UI elements
- Predictable behavior and styling
- Professional and polished appearance

### Performance
- Efficient theme switching with no editor restart
- Minimal overhead for syntax highlighting
- Smooth transitions and responsive updates

## Integration

The theme system is fully integrated with:
- **Buffer Editor** - Main editing interface
- **Dialog System** - All popup dialogs use theme colors
- **Status System** - Status and info bars
- **Selection System** - Text selection highlighting
- **Search System** - Find/replace result highlighting
- **Typewriter Mode** - Dimming and focus effects

## Keyboard Shortcuts

- **F2** - Cycle to next theme
- **F1** - Show help (includes theme information)

The theme system enhances the Writers CLI Editor with beautiful, professional themes that make writing a pleasure in any environment.