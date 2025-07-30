# Writers CLI - GUI Testing Guide

This guide will help you test the comprehensive GUI features that have been implemented for the Writers CLI application.

## 🚀 Quick Start Testing

### 1. Launch the GUI
```bash
# From the cli-novel-writer directory
npm run gui

# Or using the CLI command
node bin/writers.js gui

# Or run the interactive demo
npm run demo-gui
```

### 2. Test Project Creation
1. Click **"New Project"** button
2. Fill in project details:
   - Name: "My Test Novel"
   - Author: "Your Name"
   - Word Goal: 75000
   - Genre: Fantasy
3. Click **"Create"**
4. Verify the project loads with dashboard showing stats

### 3. Test File Management
1. Go to **Files** tab in sidebar
2. Test creating each content type:
   - Click **+** next to "Chapters" → Create "Chapter 1"
   - Click **+** next to "Characters" → Create "Main Character"
   - Click **+** next to "Scenes" → Create "Opening Scene"
   - Click **+** next to "Notes" → Create "Plot Ideas"

### 4. Test Editor Integration
1. Click on any created file in the Files tab
2. Verify the editor opens with template content
3. Edit the content and verify auto-save works
4. Check that word counts update in real-time

## 📋 Comprehensive Feature Testing

### Dashboard Tab Testing
- **Word Count Display**: Verify total words update when editing files
- **Progress Bar**: Check percentage calculation against word goal
- **Chapter Count**: Ensure count updates when adding/removing chapters
- **Daily Average**: Verify calculation (may show 0 for new projects)

### Files Tab Testing
- **Chapter Management**:
  - Create new chapters with different names
  - Verify word counts appear next to file names
  - Test clicking to open files in editor
  
- **Character Profiles**:
  - Create character profiles
  - Verify template includes all character fields
  - Test editing and saving character information
  
- **Scene Management**:
  - Create individual scenes
  - Verify scene template structure
  - Test organizing scenes separately from chapters
  
- **Notes System**:
  - Create various types of notes
  - Test free-form note taking
  - Verify notes don't count toward main word goal

- **Short Stories**:
  - Create standalone short stories
  - Verify separate tracking from main novel

### Statistics Tab Testing
- **Detailed Statistics**: Check comprehensive project analytics
- **Chapter Breakdown**: Verify individual chapter statistics
- **Reading Time Estimates**: Test calculation accuracy
- **Progress Tracking**: Verify goal completion percentages

### Settings Tab Testing
- **Project Configuration**:
  - Change project name and verify updates
  - Modify author information
  - Adjust word goal and check progress recalculation
  - Change genre selection
  
- **Settings Persistence**:
  - Save settings and restart GUI
  - Verify changes are maintained

### Editor Testing
- **Text Editing**:
  - Type content and verify real-time word counting
  - Test auto-save functionality (wait 30+ seconds)
  - Verify unsaved changes warning when switching files
  
- **File Navigation**:
  - Switch between different files
  - Verify content preservation
  - Test file status indicators

### Export Testing
- **HTML Export**:
  - Click "Export" button in main header
  - Choose save location
  - Verify HTML file contains all chapters
  - Check formatting and structure

## 🔧 Technical Testing

### Error Handling
- **Invalid Input**: Try creating files with empty names
- **Duplicate Names**: Attempt to create files with existing names
- **File Permissions**: Test in read-only directories
- **Missing Dependencies**: Test with/without electron

### Performance Testing
- **Large Projects**: Test with 50+ chapters
- **File Size**: Test with very long chapters (10,000+ words)
- **Real-time Updates**: Verify responsiveness with multiple files open
- **Memory Usage**: Monitor during extended editing sessions

### UI Responsiveness
- **Sidebar Collapse**: Test collapse/expand functionality
- **Tab Switching**: Verify smooth transitions between tabs
- **Modal Dialogs**: Test all modal interactions
- **Keyboard Shortcuts**: Test Ctrl+N, Ctrl+S, Ctrl+O, etc.

## 🐛 Known Issues to Verify Fixed

### File Type Mapping
- **Issue**: "Unknown file type: chapter" error
- **Test**: Create new chapter and verify no error occurs
- **Expected**: File creates successfully with proper template

### Auto-save Functionality
- **Test**: Edit file, wait 30 seconds, check for save confirmation
- **Expected**: File saves automatically without user intervention

### Statistics Updates
- **Test**: Add content to chapters and verify dashboard updates
- **Expected**: Word counts and progress bars update in real-time

## 📊 Test Scenarios

### Scenario 1: New User Workflow
1. Launch GUI (should show welcome screen)
2. Create new project with custom settings
3. Create first chapter and start writing
4. Add character profile
5. Check progress in dashboard
6. Export project to HTML

### Scenario 2: Existing Project Workflow
1. Open existing Writers CLI project
2. Browse existing content in Files tab
3. Edit existing chapter
4. Add new content (scene, character)
5. Review statistics
6. Modify project settings

### Scenario 3: Heavy Usage Testing
1. Create project with 20+ chapters
2. Add substantial content to each chapter
3. Create multiple characters and scenes
4. Test GUI responsiveness
5. Verify statistics accuracy
6. Test export with large project

## ✅ Test Checklist

### Core Functionality
- [ ] GUI launches without errors
- [ ] New project creation works
- [ ] Existing project opening works
- [ ] File creation for all types (chapter, scene, character, note, story)
- [ ] File editing and saving
- [ ] Auto-save functionality
- [ ] Real-time word count updates

### Interface Features
- [ ] Sidebar navigation works
- [ ] Tab switching functions properly
- [ ] Modal dialogs open/close correctly
- [ ] Keyboard shortcuts respond
- [ ] Sidebar collapse/expand
- [ ] File list updates automatically

### Data Management
- [ ] Project settings save/load correctly
- [ ] File changes persist between sessions
- [ ] Statistics calculate accurately
- [ ] Export generates correct output
- [ ] Project structure maintained

### Error Handling
- [ ] Invalid inputs show appropriate errors
- [ ] File conflicts handled gracefully
- [ ] Missing files don't crash application
- [ ] Network/permission errors display properly

## 🔍 Debugging Tips

### Enable Debug Mode
```bash
# Show electron console output
writers gui --debug
```

### Check File Structure
Verify the project directory contains:
```
project/
├── writers.config.json
├── chapters/
├── scenes/
├── characters/
├── notes/
├── shortstories/
└── exports/
```

### Console Inspection
- Open Developer Tools (Ctrl+Shift+I)
- Check Console tab for JavaScript errors
- Monitor Network tab for IPC communication

### Log Files
Check terminal output for:
- Electron startup messages
- IPC communication errors
- File system operation failures

## 📞 Reporting Issues

When reporting GUI issues, include:
1. **Steps to reproduce** the problem
2. **Expected behavior** vs actual behavior
3. **Error messages** (if any)
4. **Operating system** and Node.js version
5. **Project structure** and sample files (if relevant)

## 🎯 Success Criteria

The GUI should provide:
- **Complete CLI Parity**: All CLI functions available in GUI
- **Intuitive Interface**: Easy navigation and file management
- **Real-time Updates**: Immediate feedback on changes
- **Reliable Performance**: Stable operation with large projects
- **Professional Appearance**: Clean, modern interface design

This comprehensive GUI transforms Writers CLI from a command-line tool into a full-featured writing application suitable for both technical and non-technical users.