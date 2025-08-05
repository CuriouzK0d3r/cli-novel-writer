use crossterm::event::{KeyCode, KeyEvent, KeyModifiers};

#[derive(Debug, Clone)]
pub enum InputAction {
    None,
    Quit,
    Save,
    Undo,
    Redo,
    Cut,
    Copy,
    Paste,
    SelectAll,
    Find,
    Replace,
    GoToLine,
    ToggleTypewriter,
    ToggleDistractionFree,
    SwitchMode,
    MoveCursor(CursorMovement),
    InsertChar(char),
    InsertNewline,
    InsertTab,
    Backspace,
    Delete,
    DeleteLine,
    PageUp,
    PageDown,
}

#[derive(Debug, Clone)]
pub enum CursorMovement {
    Left,
    Right,
    Up,
    Down,
    LineStart,
    LineEnd,
    DocumentStart,
    DocumentEnd,
    WordLeft,
    WordRight,
}

pub struct InputHandler {
    last_key: Option<KeyEvent>,
    last_key_time: std::time::Instant,
    dd_timeout: std::time::Duration,
}

impl InputHandler {
    pub fn new() -> Self {
        Self {
            last_key: None,
            last_key_time: std::time::Instant::now(),
            dd_timeout: std::time::Duration::from_millis(500),
        }
    }

    pub fn process_key(&mut self, key_event: KeyEvent, is_insert_mode: bool) -> InputAction {
        let now = std::time::Instant::now();
        let is_double_key = self.is_double_key_sequence(&key_event, now);

        let action = if is_insert_mode {
            self.process_insert_mode_key(key_event)
        } else {
            self.process_navigation_mode_key(key_event, is_double_key)
        };

        self.last_key = Some(key_event);
        self.last_key_time = now;

        action
    }

    fn is_double_key_sequence(&self, key_event: &KeyEvent, now: std::time::Instant) -> bool {
        if let Some(last_key) = &self.last_key {
            now.duration_since(self.last_key_time) < self.dd_timeout
                && last_key.code == key_event.code
                && last_key.modifiers == key_event.modifiers
        } else {
            false
        }
    }

    fn process_navigation_mode_key(&self, key_event: KeyEvent, is_double_key: bool) -> InputAction {
        match key_event.code {
            // Quit
            KeyCode::Char('q') if key_event.modifiers.contains(KeyModifiers::CONTROL) => {
                InputAction::Quit
            }

            // Save
            KeyCode::Char('s') if key_event.modifiers.contains(KeyModifiers::CONTROL) => {
                InputAction::Save
            }

            // Undo/Redo
            KeyCode::Char('z') if key_event.modifiers.contains(KeyModifiers::CONTROL) => {
                InputAction::Undo
            }
            KeyCode::Char('y') if key_event.modifiers.contains(KeyModifiers::CONTROL) => {
                InputAction::Redo
            }

            // Copy/Cut/Paste
            KeyCode::Char('c') if key_event.modifiers.contains(KeyModifiers::CONTROL) => {
                InputAction::Copy
            }
            KeyCode::Char('x') if key_event.modifiers.contains(KeyModifiers::CONTROL) => {
                InputAction::Cut
            }
            KeyCode::Char('v') if key_event.modifiers.contains(KeyModifiers::CONTROL) => {
                InputAction::Paste
            }
            KeyCode::Char('a') if key_event.modifiers.contains(KeyModifiers::CONTROL) => {
                InputAction::SelectAll
            }

            // Search and navigation
            KeyCode::Char('/') => InputAction::Find,
            KeyCode::Char('g') if key_event.modifiers.contains(KeyModifiers::CONTROL) => {
                InputAction::GoToLine
            }

            // Toggle modes
            KeyCode::Char('t') if key_event.modifiers.contains(KeyModifiers::CONTROL) => {
                InputAction::ToggleTypewriter
            }
            KeyCode::F(3) => InputAction::ToggleDistractionFree,

            // Mode switching
            KeyCode::Char('i') => InputAction::SwitchMode,
            KeyCode::Char('a') => {
                // Move cursor right then switch to insert mode
                InputAction::SwitchMode
            }
            KeyCode::Char('o') => {
                // Move to end of line, insert newline, then switch to insert mode
                InputAction::SwitchMode
            }

            // Cursor movement (hjkl + arrow keys)
            KeyCode::Char('h') | KeyCode::Left => InputAction::MoveCursor(CursorMovement::Left),
            KeyCode::Char('j') | KeyCode::Down => InputAction::MoveCursor(CursorMovement::Down),
            KeyCode::Char('k') | KeyCode::Up => InputAction::MoveCursor(CursorMovement::Up),
            KeyCode::Char('l') | KeyCode::Right => InputAction::MoveCursor(CursorMovement::Right),

            // WASD navigation (using Shift+WASD to avoid conflicts)
            KeyCode::Char('A') => InputAction::MoveCursor(CursorMovement::Left),
            KeyCode::Char('S') => InputAction::MoveCursor(CursorMovement::Down),
            KeyCode::Char('W') => InputAction::MoveCursor(CursorMovement::Up),
            KeyCode::Char('D') => InputAction::MoveCursor(CursorMovement::Right),

            KeyCode::Char('0') => InputAction::MoveCursor(CursorMovement::LineStart),
            KeyCode::Char('$') => InputAction::MoveCursor(CursorMovement::LineEnd),

            KeyCode::Char('w') => InputAction::MoveCursor(CursorMovement::WordRight),
            KeyCode::Char('b') => InputAction::MoveCursor(CursorMovement::WordLeft),

            KeyCode::Home => InputAction::MoveCursor(CursorMovement::DocumentStart),
            KeyCode::End => InputAction::MoveCursor(CursorMovement::DocumentEnd),

            // Page navigation
            KeyCode::PageUp => InputAction::PageUp,
            KeyCode::PageDown => InputAction::PageDown,

            // Delete operations
            KeyCode::Char('d') if is_double_key => InputAction::DeleteLine,
            KeyCode::Delete => InputAction::Delete,

            _ => InputAction::None,
        }
    }

    fn process_insert_mode_key(&self, key_event: KeyEvent) -> InputAction {
        match key_event.code {
            // Exit insert mode
            KeyCode::Esc => InputAction::SwitchMode,

            // Save/Quit (available in insert mode too)
            KeyCode::Char('s') if key_event.modifiers.contains(KeyModifiers::CONTROL) => {
                InputAction::Save
            }
            KeyCode::Char('q') if key_event.modifiers.contains(KeyModifiers::CONTROL) => {
                InputAction::Quit
            }

            // Undo/Redo (available in insert mode too)
            KeyCode::Char('z') if key_event.modifiers.contains(KeyModifiers::CONTROL) => {
                InputAction::Undo
            }
            KeyCode::Char('y') if key_event.modifiers.contains(KeyModifiers::CONTROL) => {
                InputAction::Redo
            }

            // Text insertion
            KeyCode::Char(c) => InputAction::InsertChar(c),
            KeyCode::Enter => InputAction::InsertNewline,
            KeyCode::Tab => InputAction::InsertTab,

            // Deletion
            KeyCode::Backspace => InputAction::Backspace,
            KeyCode::Delete => InputAction::Delete,

            // Cursor movement (allowed in insert mode)
            KeyCode::Left => InputAction::MoveCursor(CursorMovement::Left),
            KeyCode::Right => InputAction::MoveCursor(CursorMovement::Right),
            KeyCode::Up => InputAction::MoveCursor(CursorMovement::Up),
            KeyCode::Down => InputAction::MoveCursor(CursorMovement::Down),

            KeyCode::Home => InputAction::MoveCursor(CursorMovement::LineStart),
            KeyCode::End => InputAction::MoveCursor(CursorMovement::LineEnd),

            KeyCode::PageUp => InputAction::PageUp,
            KeyCode::PageDown => InputAction::PageDown,

            _ => InputAction::None,
        }
    }

    pub fn reset_key_sequence(&mut self) {
        self.last_key = None;
        self.last_key_time = std::time::Instant::now();
    }
}

impl Default for InputHandler {
    fn default() -> Self {
        Self::new()
    }
}
