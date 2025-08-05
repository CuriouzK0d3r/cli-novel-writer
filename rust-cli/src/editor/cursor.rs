use super::buffer::TextBuffer;

#[derive(Debug, Clone)]
pub struct Cursor {
    pub row: usize,
    pub col: usize,
    pub preferred_col: usize, // For vertical movement
}

impl Cursor {
    pub fn new() -> Self {
        Self {
            row: 0,
            col: 0,
            preferred_col: 0,
        }
    }

    pub fn move_left(&mut self) {
        if self.col > 0 {
            self.col -= 1;
            self.preferred_col = self.col;
        }
    }

    pub fn move_right(&mut self, buffer: &TextBuffer) {
        let line_len = buffer.get_line_length(self.row);
        if self.col < line_len {
            self.col += 1;
            self.preferred_col = self.col;
        }
    }

    pub fn move_up(&mut self) {
        if self.row > 0 {
            self.row -= 1;
            self.col = self.preferred_col;
        }
    }

    pub fn move_down(&mut self, buffer: &TextBuffer) {
        if self.row < buffer.line_count().saturating_sub(1) {
            self.row += 1;
            self.col = self.preferred_col;

            // Adjust column if it's beyond the line length
            let line_len = buffer.get_line_length(self.row);
            if self.col > line_len {
                self.col = line_len;
            }
        }
    }

    pub fn move_to_start_of_line(&mut self) {
        self.col = 0;
        self.preferred_col = 0;
    }

    pub fn move_to_end_of_line(&mut self, buffer: &TextBuffer) {
        self.col = buffer.get_line_length(self.row);
        self.preferred_col = self.col;
    }

    pub fn move_to_start_of_document(&mut self) {
        self.row = 0;
        self.col = 0;
        self.preferred_col = 0;
    }

    pub fn move_to_end_of_document(&mut self, buffer: &TextBuffer) {
        if buffer.line_count() > 0 {
            self.row = buffer.line_count() - 1;
            self.col = buffer.get_line_length(self.row);
            self.preferred_col = self.col;
        }
    }

    pub fn move_to_position(&mut self, row: usize, col: usize, buffer: &TextBuffer) {
        self.row = row.min(buffer.line_count().saturating_sub(1));
        let line_len = buffer.get_line_length(self.row);
        self.col = col.min(line_len);
        self.preferred_col = self.col;
    }

    pub fn move_word_left(&mut self, buffer: &TextBuffer) {
        let line = buffer.get_line(self.row);

        if self.col == 0 {
            // Move to end of previous line
            if self.row > 0 {
                self.row -= 1;
                self.col = buffer.get_line_length(self.row);
                self.preferred_col = self.col;
            }
            return;
        }

        let chars: Vec<char> = line.chars().collect();
        let mut pos = self.col.saturating_sub(1);

        // Skip whitespace
        while pos > 0 && chars[pos].is_whitespace() {
            pos -= 1;
        }

        // Skip word characters
        while pos > 0 && !chars[pos].is_whitespace() {
            pos -= 1;
        }

        // If we stopped on whitespace, move one position right
        if pos > 0 && chars[pos].is_whitespace() {
            pos += 1;
        }

        self.col = pos;
        self.preferred_col = self.col;
    }

    pub fn move_word_right(&mut self, buffer: &TextBuffer) {
        let line = buffer.get_line(self.row);
        let line_len = line.len();

        if self.col >= line_len {
            // Move to start of next line
            if self.row < buffer.line_count().saturating_sub(1) {
                self.row += 1;
                self.col = 0;
                self.preferred_col = 0;
            }
            return;
        }

        let chars: Vec<char> = line.chars().collect();
        let mut pos = self.col;

        // Skip current word
        while pos < chars.len() && !chars[pos].is_whitespace() {
            pos += 1;
        }

        // Skip whitespace
        while pos < chars.len() && chars[pos].is_whitespace() {
            pos += 1;
        }

        self.col = pos.min(line_len);
        self.preferred_col = self.col;
    }

    pub fn is_at_line_start(&self) -> bool {
        self.col == 0
    }

    pub fn is_at_line_end(&self, buffer: &TextBuffer) -> bool {
        self.col >= buffer.get_line_length(self.row)
    }

    pub fn is_at_document_start(&self) -> bool {
        self.row == 0 && self.col == 0
    }

    pub fn is_at_document_end(&self, buffer: &TextBuffer) -> bool {
        self.row == buffer.line_count().saturating_sub(1)
            && self.col >= buffer.get_line_length(self.row)
    }

    pub fn clamp_to_buffer(&mut self, buffer: &TextBuffer) {
        if buffer.line_count() == 0 {
            self.row = 0;
            self.col = 0;
            self.preferred_col = 0;
            return;
        }

        // Clamp row
        self.row = self.row.min(buffer.line_count().saturating_sub(1));

        // Clamp column
        let line_len = buffer.get_line_length(self.row);
        self.col = self.col.min(line_len);
        self.preferred_col = self.col;
    }
}

impl Default for Cursor {
    fn default() -> Self {
        Self::new()
    }
}
