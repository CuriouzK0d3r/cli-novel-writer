use anyhow::Result;
use crossterm::{
    cursor::{MoveTo, SetCursorStyle},
    event::{self, Event, KeyCode, KeyEvent, KeyModifiers},
    execute,
    style::{Color, Print, ResetColor, SetBackgroundColor, SetForegroundColor},
    terminal::{self, Clear, ClearType, EnterAlternateScreen, LeaveAlternateScreen},
    tty::IsTty,
};
use std::io::{self, Write};
use std::path::Path;
use tokio::fs;

use super::buffer::TextBuffer;
use super::cursor::Cursor;
use super::input::InputHandler;
use super::screen::Screen;

#[derive(Debug, Clone, PartialEq)]
pub enum EditorMode {
    Navigation,
    Insert,
}

pub struct WritersEditor {
    buffer: TextBuffer,
    cursor: Cursor,
    screen: Screen,
    input_handler: InputHandler,
    mode: EditorMode,
    should_quit: bool,
    status_message: String,
    search_term: String,
    is_dirty: bool,
    typewriter_mode: bool,
    distraction_free: bool,
    show_line_numbers: bool,
    last_key: Option<KeyEvent>,
    last_key_time: std::time::Instant,
}

impl WritersEditor {
    pub fn new() -> Self {
        Self {
            buffer: TextBuffer::new(),
            cursor: Cursor::new(),
            screen: Screen::new(),
            input_handler: InputHandler::new(),
            mode: EditorMode::Navigation,
            should_quit: false,
            status_message: "Ready".to_string(),
            search_term: String::new(),
            is_dirty: false,
            typewriter_mode: false,
            distraction_free: false,
            show_line_numbers: true,
            last_key: None,
            last_key_time: std::time::Instant::now(),
        }
    }

    pub async fn launch(&mut self, file_path: Option<String>) -> Result<()> {
        self.setup_terminal()?;

        if let Some(path) = file_path {
            self.open_file(&path).await?;
        }

        self.run().await?;
        self.cleanup_terminal()?;

        Ok(())
    }

    fn setup_terminal(&mut self) -> Result<()> {
        // Check if we're running in a real terminal
        if !io::stdin().is_tty() {
            return Err(anyhow::anyhow!(
                "Editor requires a terminal (TTY). Cannot run with piped input."
            ));
        }

        terminal::enable_raw_mode()
            .map_err(|e| anyhow::anyhow!("Failed to enable raw mode: {}", e))?;
        execute!(
            io::stdout(),
            EnterAlternateScreen,
            SetCursorStyle::BlinkingBlock
        )
        .map_err(|e| anyhow::anyhow!("Failed to setup terminal: {}", e))?;
        self.screen.initialize()?;
        Ok(())
    }

    fn cleanup_terminal(&self) -> Result<()> {
        let _ = execute!(io::stdout(), LeaveAlternateScreen);
        let _ = terminal::disable_raw_mode();
        Ok(())
    }

    async fn run(&mut self) -> Result<()> {
        loop {
            self.render()?;

            if self.should_quit {
                break;
            }

            if event::poll(std::time::Duration::from_millis(100))
                .map_err(|e| anyhow::anyhow!("Failed to poll events: {}", e))?
            {
                match event::read().map_err(|e| anyhow::anyhow!("Failed to read event: {}", e))? {
                    Event::Key(key_event) => {
                        self.handle_key_event(key_event).await?;
                    }
                    Event::Resize(_, _) => {
                        self.screen.initialize()?;
                    }
                    _ => {}
                }
            }
        }
        Ok(())
    }

    async fn handle_key_event(&mut self, key_event: KeyEvent) -> Result<()> {
        // Handle double-key sequences like 'dd' for delete line
        let now = std::time::Instant::now();
        let is_double_key = if let Some(last_key) = self.last_key {
            now.duration_since(self.last_key_time).as_millis() < 500
                && last_key.code == key_event.code
        } else {
            false
        };

        match self.mode {
            EditorMode::Navigation => {
                self.handle_navigation_key(key_event, is_double_key).await?;
            }
            EditorMode::Insert => {
                self.handle_insert_key(key_event).await?;
            }
        }

        self.last_key = Some(key_event);
        self.last_key_time = now;
        Ok(())
    }

    async fn handle_navigation_key(
        &mut self,
        key_event: KeyEvent,
        is_double_key: bool,
    ) -> Result<()> {
        match key_event.code {
            KeyCode::Char('q') if key_event.modifiers.contains(KeyModifiers::CONTROL) => {
                if self.is_dirty {
                    self.status_message = "File has unsaved changes. Press Ctrl+Q again to quit without saving, or Ctrl+S to save first".to_string();
                    if is_double_key {
                        self.should_quit = true;
                    }
                } else {
                    self.should_quit = true;
                }
            }
            KeyCode::Char('s') if key_event.modifiers.contains(KeyModifiers::CONTROL) => {
                self.save_file().await?;
            }
            KeyCode::Char('z') if key_event.modifiers.contains(KeyModifiers::CONTROL) => {
                self.undo();
            }
            KeyCode::Char('y') if key_event.modifiers.contains(KeyModifiers::CONTROL) => {
                self.redo();
            }
            KeyCode::Char('t') if key_event.modifiers.contains(KeyModifiers::CONTROL) => {
                self.toggle_typewriter_mode();
            }
            KeyCode::F(3) => {
                self.toggle_distraction_free();
            }
            KeyCode::Char('/') => {
                self.enter_search_mode().await?;
            }
            KeyCode::Char('i') => {
                self.mode = EditorMode::Insert;
                self.status_message = "-- INSERT --".to_string();
            }
            KeyCode::Char('a') => {
                self.cursor.move_right(&self.buffer);
                self.mode = EditorMode::Insert;
                self.status_message = "-- INSERT --".to_string();
            }
            KeyCode::Char('o') => {
                self.cursor.move_to_end_of_line(&self.buffer);
                self.insert_newline();
                self.mode = EditorMode::Insert;
                self.status_message = "-- INSERT --".to_string();
            }
            KeyCode::Char('0') => {
                self.cursor.move_to_start_of_line();
            }
            KeyCode::Char('$') => {
                self.cursor.move_to_end_of_line(&self.buffer);
            }
            KeyCode::Char('d') if is_double_key => {
                self.delete_line();
            }
            KeyCode::Char('h') | KeyCode::Left => {
                self.cursor.move_left();
            }
            KeyCode::Char('j') | KeyCode::Char('s') | KeyCode::Down => {
                self.cursor.move_down(&self.buffer);
            }
            KeyCode::Char('k') | KeyCode::Char('w') | KeyCode::Up => {
                self.cursor.move_up();
            }
            KeyCode::Char('l') | KeyCode::Right => {
                self.cursor.move_right(&self.buffer);
            }
            // WASD navigation (using Shift+WASD to avoid conflicts)
            KeyCode::Char('A') => {
                self.cursor.move_left();
            }
            KeyCode::Char('S') => {
                self.cursor.move_down(&self.buffer);
            }
            KeyCode::Char('W') => {
                self.cursor.move_up();
            }
            KeyCode::Char('D') => {
                self.cursor.move_right(&self.buffer);
            }
            KeyCode::PageUp => {
                self.page_up();
            }
            KeyCode::PageDown => {
                self.page_down();
            }
            _ => {}
        }
        Ok(())
    }

    async fn handle_insert_key(&mut self, key_event: KeyEvent) -> Result<()> {
        match key_event.code {
            KeyCode::Esc => {
                self.mode = EditorMode::Navigation;
                self.status_message = "Ready".to_string();
            }
            KeyCode::Char('s') if key_event.modifiers.contains(KeyModifiers::CONTROL) => {
                self.save_file().await?;
            }
            KeyCode::Char('q') if key_event.modifiers.contains(KeyModifiers::CONTROL) => {
                if self.is_dirty {
                    self.status_message =
                        "File has unsaved changes. Save first with Ctrl+S".to_string();
                } else {
                    self.should_quit = true;
                }
            }
            KeyCode::Char(c) => {
                self.insert_char(c);
            }
            KeyCode::Enter => {
                self.insert_newline();
            }
            KeyCode::Backspace => {
                self.backspace();
            }
            KeyCode::Delete => {
                self.delete_char();
            }
            KeyCode::Tab => {
                self.insert_tab();
            }
            KeyCode::Left => {
                self.cursor.move_left();
            }
            KeyCode::Right => {
                self.cursor.move_right(&self.buffer);
            }
            KeyCode::Up => {
                self.cursor.move_up();
            }
            KeyCode::Down => {
                self.cursor.move_down(&self.buffer);
            }
            _ => {}
        }
        Ok(())
    }

    async fn open_file(&mut self, path: &str) -> Result<()> {
        if Path::new(path).exists() {
            let content = fs::read_to_string(path).await?;
            self.buffer.load_from_string(&content);
            self.buffer.set_file_path(Some(path.to_string()));
            self.status_message = format!("Opened: {}", path);
        } else {
            self.buffer.set_file_path(Some(path.to_string()));
            self.status_message = format!("New file: {}", path);
        }
        self.is_dirty = false;
        Ok(())
    }

    async fn save_file(&mut self) -> Result<()> {
        if let Some(path) = self.buffer.get_file_path() {
            let content = self.buffer.to_string();
            fs::write(&path, content).await?;
            self.is_dirty = false;
            self.status_message = format!("Saved: {}", path);
        } else {
            self.status_message = "No file path set".to_string();
        }
        Ok(())
    }

    fn insert_char(&mut self, c: char) {
        self.buffer.insert_char(self.cursor.row, self.cursor.col, c);
        self.cursor.move_right(&self.buffer);
        self.mark_dirty();
    }

    fn insert_newline(&mut self) {
        self.buffer.insert_newline(self.cursor.row, self.cursor.col);
        self.cursor.move_down(&self.buffer);
        self.cursor.col = 0;
        self.mark_dirty();
    }

    fn backspace(&mut self) {
        if self.cursor.col > 0 {
            self.cursor.move_left();
            self.buffer.delete_char(self.cursor.row, self.cursor.col);
        } else if self.cursor.row > 0 {
            let line_len = self.buffer.get_line_length(self.cursor.row - 1);
            self.buffer.join_lines(self.cursor.row - 1);
            self.cursor.move_up();
            self.cursor.col = line_len;
        }
        self.mark_dirty();
    }

    fn delete_char(&mut self) {
        self.buffer.delete_char(self.cursor.row, self.cursor.col);
        self.mark_dirty();
    }

    fn delete_line(&mut self) {
        self.buffer.delete_line(self.cursor.row);
        if self.cursor.row >= self.buffer.line_count() && self.buffer.line_count() > 0 {
            self.cursor.row = self.buffer.line_count() - 1;
        }
        self.cursor.col = 0;
        self.mark_dirty();
    }

    fn insert_tab(&mut self) {
        for _ in 0..4 {
            self.insert_char(' ');
        }
    }

    fn undo(&mut self) {
        if self.buffer.undo() {
            self.status_message = "Undo".to_string();
            self.is_dirty = true;
        }
    }

    fn redo(&mut self) {
        if self.buffer.redo() {
            self.status_message = "Redo".to_string();
            self.is_dirty = true;
        }
    }

    fn page_up(&mut self) {
        let page_size = self.screen.get_editor_height().saturating_sub(1);
        for _ in 0..page_size {
            self.cursor.move_up();
        }
    }

    fn page_down(&mut self) {
        let page_size = self.screen.get_editor_height().saturating_sub(1);
        for _ in 0..page_size {
            self.cursor.move_down(&self.buffer);
        }
    }

    fn toggle_typewriter_mode(&mut self) {
        self.typewriter_mode = !self.typewriter_mode;
        self.status_message = if self.typewriter_mode {
            "Typewriter mode: ON".to_string()
        } else {
            "Typewriter mode: OFF".to_string()
        };
    }

    fn toggle_distraction_free(&mut self) {
        self.distraction_free = !self.distraction_free;
        self.status_message = if self.distraction_free {
            "Distraction-free mode: ON".to_string()
        } else {
            "Distraction-free mode: OFF".to_string()
        };
    }

    async fn enter_search_mode(&mut self) -> Result<()> {
        self.status_message = "Search: ".to_string();
        // TODO: Implement search input
        Ok(())
    }

    fn mark_dirty(&mut self) {
        self.is_dirty = true;
    }

    fn render(&mut self) -> Result<()> {
        self.screen.clear()?;

        let editor_height = self.screen.get_editor_height();
        let editor_width = self.screen.get_editor_width();

        // Calculate scroll offset
        let scroll_y = if self.typewriter_mode {
            let center_line = editor_height / 2;
            if self.cursor.row >= center_line {
                self.cursor.row - center_line
            } else {
                0
            }
        } else {
            if self.cursor.row >= editor_height {
                self.cursor.row - editor_height + 1
            } else {
                0
            }
        };

        // Render buffer content
        for screen_row in 0..editor_height {
            let buffer_row = screen_row + scroll_y;

            execute!(io::stdout(), MoveTo(0, screen_row as u16))?;

            if buffer_row < self.buffer.line_count() {
                let line = self.buffer.get_line(buffer_row);
                let line_number_width = if self.show_line_numbers && !self.distraction_free {
                    5
                } else {
                    0
                };

                // Render line number
                if self.show_line_numbers && !self.distraction_free {
                    execute!(
                        io::stdout(),
                        SetForegroundColor(Color::DarkGrey),
                        Print(format!("{:4} ", buffer_row + 1)),
                        ResetColor
                    )?;
                }

                // Render line content
                let display_line = if line.len() > editor_width - line_number_width {
                    &line[..editor_width - line_number_width]
                } else {
                    line
                };

                execute!(io::stdout(), Print(display_line))?;

                // Clear rest of line
                execute!(io::stdout(), Clear(ClearType::UntilNewLine))?;
            } else {
                // Empty line indicator
                if !self.distraction_free {
                    execute!(
                        io::stdout(),
                        SetForegroundColor(Color::DarkBlue),
                        Print("~"),
                        ResetColor,
                        Clear(ClearType::UntilNewLine)
                    )?;
                } else {
                    execute!(io::stdout(), Clear(ClearType::UntilNewLine))?;
                }
            }
        }

        // Render status bar
        if !self.distraction_free {
            self.render_status_bar()?;
        }

        // Position cursor
        let line_number_width = if self.show_line_numbers && !self.distraction_free {
            5
        } else {
            0
        };
        let cursor_screen_row = if self.cursor.row >= scroll_y {
            self.cursor.row - scroll_y
        } else {
            0
        };

        execute!(
            io::stdout(),
            MoveTo(
                (self.cursor.col + line_number_width) as u16,
                cursor_screen_row as u16
            )
        )?;

        io::stdout().flush()?;
        Ok(())
    }

    fn render_status_bar(&self) -> Result<()> {
        let height = self.screen.get_height();
        let width = self.screen.get_width();

        // Status line
        execute!(io::stdout(), MoveTo(0, (height - 2) as u16))?;
        execute!(
            io::stdout(),
            SetBackgroundColor(Color::DarkGrey),
            SetForegroundColor(Color::White)
        )?;

        let mode_str = match self.mode {
            EditorMode::Navigation => "NORMAL",
            EditorMode::Insert => "INSERT",
        };

        let file_name = self
            .buffer
            .get_file_path()
            .map(|p| {
                Path::new(&p)
                    .file_name()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .to_string()
            })
            .unwrap_or_else(|| "[No Name]".to_string());

        let dirty_indicator = if self.is_dirty { " [+]" } else { "" };
        let line_info = format!("{}:{}", self.cursor.row + 1, self.cursor.col + 1);

        let status = format!(
            " {} | {}{} | {} ",
            mode_str, file_name, dirty_indicator, line_info
        );

        execute!(io::stdout(), Print(&status))?;

        // Fill rest of status line
        let padding = width.saturating_sub(status.len());
        if padding > 0 {
            execute!(io::stdout(), Print(" ".repeat(padding)))?;
        }

        execute!(io::stdout(), ResetColor)?;

        // Message line
        execute!(io::stdout(), MoveTo(0, (height - 1) as u16))?;
        execute!(io::stdout(), Print(&self.status_message))?;
        execute!(io::stdout(), Clear(ClearType::UntilNewLine))?;

        Ok(())
    }
}

impl Default for WritersEditor {
    fn default() -> Self {
        Self::new()
    }
}
