use anyhow::Result;
use crossterm::terminal;
use std::io;

pub struct Screen {
    width: usize,
    height: usize,
}

impl Screen {
    pub fn new() -> Self {
        Self {
            width: 80,
            height: 24,
        }
    }

    pub fn initialize(&mut self) -> Result<()> {
        let (width, height) = terminal::size()?;
        self.width = width as usize;
        self.height = height as usize;
        Ok(())
    }

    pub fn get_width(&self) -> usize {
        self.width
    }

    pub fn get_height(&self) -> usize {
        self.height
    }

    pub fn get_editor_width(&self) -> usize {
        self.width
    }

    pub fn get_editor_height(&self) -> usize {
        // Reserve space for status bar (2 lines) and help line (1 line)
        self.height.saturating_sub(3)
    }

    pub fn clear(&self) -> Result<()> {
        use crossterm::{execute, terminal::Clear, terminal::ClearType};
        execute!(io::stdout(), Clear(ClearType::All))?;
        Ok(())
    }

    pub fn refresh(&mut self) -> Result<()> {
        let (width, height) = terminal::size()?;
        self.width = width as usize;
        self.height = height as usize;
        Ok(())
    }

    pub fn is_position_valid(&self, row: usize, col: usize) -> bool {
        row < self.height && col < self.width
    }

    pub fn get_center_row(&self) -> usize {
        self.get_editor_height() / 2
    }

    pub fn get_center_col(&self) -> usize {
        self.width / 2
    }
}

impl Default for Screen {
    fn default() -> Self {
        Self::new()
    }
}
