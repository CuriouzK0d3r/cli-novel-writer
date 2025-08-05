use std::collections::VecDeque;

#[derive(Debug, Clone)]
pub struct BufferState {
    lines: Vec<String>,
    cursor_row: usize,
    cursor_col: usize,
}

pub struct TextBuffer {
    lines: Vec<String>,
    file_path: Option<String>,
    undo_stack: VecDeque<BufferState>,
    redo_stack: VecDeque<BufferState>,
    max_undo_levels: usize,
}

impl TextBuffer {
    pub fn new() -> Self {
        Self {
            lines: vec![String::new()],
            file_path: None,
            undo_stack: VecDeque::new(),
            redo_stack: VecDeque::new(),
            max_undo_levels: 100,
        }
    }

    pub fn load_from_string(&mut self, content: &str) {
        if content.is_empty() {
            self.lines = vec![String::new()];
        } else {
            self.lines = content.lines().map(|line| line.to_string()).collect();
            if self.lines.is_empty() {
                self.lines.push(String::new());
            }
        }
    }

    pub fn to_string(&self) -> String {
        self.lines.join("\n")
    }

    pub fn get_file_path(&self) -> Option<String> {
        self.file_path.clone()
    }

    pub fn set_file_path(&mut self, path: Option<String>) {
        self.file_path = path;
    }

    pub fn line_count(&self) -> usize {
        self.lines.len()
    }

    pub fn get_line(&self, row: usize) -> &str {
        self.lines.get(row).map(|s| s.as_str()).unwrap_or("")
    }

    pub fn get_line_length(&self, row: usize) -> usize {
        self.lines.get(row).map(|s| s.len()).unwrap_or(0)
    }

    pub fn insert_char(&mut self, row: usize, col: usize, ch: char) {
        self.save_state(row, col);

        if row >= self.lines.len() {
            // Extend lines if necessary
            while self.lines.len() <= row {
                self.lines.push(String::new());
            }
        }

        let line = &mut self.lines[row];
        let col = col.min(line.len());
        line.insert(col, ch);
    }

    pub fn delete_char(&mut self, row: usize, col: usize) {
        if row >= self.lines.len() {
            return;
        }

        self.save_state(row, col);

        let line = &mut self.lines[row];
        if col < line.len() {
            line.remove(col);
        }
    }

    pub fn insert_newline(&mut self, row: usize, col: usize) {
        self.save_state(row, col);

        if row >= self.lines.len() {
            self.lines.push(String::new());
            return;
        }

        let col = col.min(self.lines[row].len());

        let line = self.lines[row].clone();
        let (left, right) = line.split_at(col);
        self.lines[row] = left.to_string();
        self.lines.insert(row + 1, right.to_string());
    }

    pub fn delete_line(&mut self, row: usize) {
        if row >= self.lines.len() {
            return;
        }

        self.save_state(row, 0);

        self.lines.remove(row);

        // Ensure we always have at least one line
        if self.lines.is_empty() {
            self.lines.push(String::new());
        }
    }

    pub fn join_lines(&mut self, row: usize) {
        if row >= self.lines.len().saturating_sub(1) {
            return;
        }

        self.save_state(row, 0);

        let next_line = self.lines.remove(row + 1);
        self.lines[row].push_str(&next_line);
    }

    fn save_state(&mut self, cursor_row: usize, cursor_col: usize) {
        let state = BufferState {
            lines: self.lines.clone(),
            cursor_row,
            cursor_col,
        };

        self.undo_stack.push_back(state);

        // Limit undo stack size
        if self.undo_stack.len() > self.max_undo_levels {
            self.undo_stack.pop_front();
        }

        // Clear redo stack when new changes are made
        self.redo_stack.clear();
    }

    pub fn undo(&mut self) -> bool {
        if let Some(state) = self.undo_stack.pop_back() {
            let current_state = BufferState {
                lines: self.lines.clone(),
                cursor_row: 0, // These will be updated by the caller
                cursor_col: 0,
            };

            self.redo_stack.push_back(current_state);
            self.lines = state.lines;
            true
        } else {
            false
        }
    }

    pub fn redo(&mut self) -> bool {
        if let Some(state) = self.redo_stack.pop_back() {
            let current_state = BufferState {
                lines: self.lines.clone(),
                cursor_row: 0, // These will be updated by the caller
                cursor_col: 0,
            };

            self.undo_stack.push_back(current_state);
            self.lines = state.lines;
            true
        } else {
            false
        }
    }

    pub fn is_empty(&self) -> bool {
        self.lines.len() == 1 && self.lines[0].is_empty()
    }

    pub fn word_count(&self) -> usize {
        self.lines
            .iter()
            .map(|line| line.split_whitespace().count())
            .sum()
    }

    pub fn char_count(&self) -> usize {
        self.lines.iter().map(|line| line.chars().count()).sum()
    }

    pub fn find_text(&self, search_term: &str) -> Vec<(usize, usize)> {
        let mut results = Vec::new();

        for (row, line) in self.lines.iter().enumerate() {
            let mut start = 0;
            while let Some(pos) = line[start..].find(search_term) {
                results.push((row, start + pos));
                start += pos + 1;
            }
        }

        results
    }

    pub fn replace_text(&mut self, search_term: &str, replace_term: &str) -> usize {
        let mut replacements = 0;

        for line in &mut self.lines {
            let new_line = line.replace(search_term, replace_term);
            if new_line != *line {
                *line = new_line;
                replacements += 1;
            }
        }

        replacements
    }
}

impl Default for TextBuffer {
    fn default() -> Self {
        Self::new()
    }
}
