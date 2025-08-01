use chrono::{DateTime, Duration, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use crate::commands::WritingStats;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WritingSession {
    pub project_id: String,
    pub start_time: DateTime<Utc>,
    pub end_time: Option<DateTime<Utc>>,
    pub initial_word_count: usize,
    pub current_word_count: usize,
    pub target_words: Option<usize>,
    pub breaks_taken: usize,
    pub paused_duration: Duration,
    pub goals: Vec<WritingGoal>,
    pub milestones: Vec<WritingMilestone>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WritingGoal {
    pub id: String,
    pub title: String,
    pub target_words: usize,
    pub target_date: Option<DateTime<Utc>>,
    pub current_progress: usize,
    pub completed: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WritingMilestone {
    pub timestamp: DateTime<Utc>,
    pub word_count: usize,
    pub milestone_type: MilestoneType,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MilestoneType {
    WordCountTarget,
    TimeTarget,
    ChapterComplete,
    SessionComplete,
    GoalAchieved,
    PersonalBest,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PomodoroTimer {
    pub work_duration: Duration,
    pub break_duration: Duration,
    pub long_break_duration: Duration,
    pub sessions_until_long_break: usize,
    pub current_session: usize,
    pub start_time: Option<DateTime<Utc>>,
    pub is_break: bool,
    pub is_paused: bool,
    pub total_sessions_completed: usize,
}

impl WritingSession {
    pub fn new(project_id: String) -> Self {
        Self {
            project_id,
            start_time: Utc::now(),
            end_time: None,
            initial_word_count: 0,
            current_word_count: 0,
            target_words: None,
            breaks_taken: 0,
            paused_duration: Duration::zero(),
            goals: Vec::new(),
            milestones: Vec::new(),
        }
    }

    pub fn with_initial_word_count(mut self, word_count: usize) -> Self {
        self.initial_word_count = word_count;
        self.current_word_count = word_count;
        self
    }

    pub fn with_target_words(mut self, target: usize) -> Self {
        self.target_words = Some(target);
        self
    }

    pub fn update_word_count(&mut self, new_count: usize) {
        self.current_word_count = new_count;

        // Check for milestones
        self.check_milestones();
    }

    pub fn add_goal(&mut self, goal: WritingGoal) {
        self.goals.push(goal);
    }

    pub fn complete_goal(&mut self, goal_id: &str) -> Option<&mut WritingGoal> {
        if let Some(goal) = self.goals.iter_mut().find(|g| g.id == goal_id) {
            goal.completed = true;

            // Add milestone
            let milestone = WritingMilestone {
                timestamp: Utc::now(),
                word_count: self.current_word_count,
                milestone_type: MilestoneType::GoalAchieved,
                description: format!("Completed goal: {}", goal.title),
            };
            self.milestones.push(milestone);

            Some(goal)
        } else {
            None
        }
    }

    pub fn take_break(&mut self) {
        self.breaks_taken += 1;

        let milestone = WritingMilestone {
            timestamp: Utc::now(),
            word_count: self.current_word_count,
            milestone_type: MilestoneType::SessionComplete,
            description: format!("Break #{} taken", self.breaks_taken),
        };
        self.milestones.push(milestone);
    }

    pub fn end_session(&mut self) {
        self.end_time = Some(Utc::now());

        let milestone = WritingMilestone {
            timestamp: Utc::now(),
            word_count: self.current_word_count,
            milestone_type: MilestoneType::SessionComplete,
            description: format!("Session completed - {} words written", self.words_written()),
        };
        self.milestones.push(milestone);
    }

    pub fn words_written(&self) -> usize {
        if self.current_word_count >= self.initial_word_count {
            self.current_word_count - self.initial_word_count
        } else {
            0
        }
    }

    pub fn session_duration(&self) -> Duration {
        let end_time = self.end_time.unwrap_or_else(Utc::now);
        end_time.signed_duration_since(self.start_time) - self.paused_duration
    }

    pub fn words_per_minute(&self) -> f64 {
        let duration_minutes = self.session_duration().num_minutes() as f64;
        if duration_minutes > 0.0 {
            self.words_written() as f64 / duration_minutes
        } else {
            0.0
        }
    }

    pub fn progress_percentage(&self) -> Option<f64> {
        self.target_words.map(|target| {
            if target > 0 {
                (self.words_written() as f64 / target as f64 * 100.0).min(100.0)
            } else {
                0.0
            }
        })
    }

    pub fn get_stats(&self) -> WritingStats {
        let duration = self.session_duration();
        let words_written = self.words_written();

        WritingStats {
            session_duration: std::time::Duration::from_secs(duration.num_seconds() as u64),
            words_written,
            total_words: self.current_word_count,
            pages: (self.current_word_count as f64 / 250.0).ceil() as usize, // ~250 words per page
            characters: self.current_word_count * 5, // Estimate ~5 chars per word
            paragraphs: self.current_word_count / 10, // Estimate ~10 words per paragraph
            reading_time: std::time::Duration::from_secs(
                (self.current_word_count as f64 / 225.0 * 60.0) as u64, // ~225 WPM reading speed
            ),
        }
    }

    fn check_milestones(&mut self) {
        let words_written = self.words_written();

        // Check word count milestones (every 100, 500, 1000 words)
        let milestones = [100, 250, 500, 750, 1000, 1500, 2000, 2500, 3000, 5000];

        for &milestone_count in &milestones {
            if words_written >= milestone_count
                && !self.milestones.iter().any(|m| {
                    matches!(m.milestone_type, MilestoneType::WordCountTarget)
                        && m.description.contains(&milestone_count.to_string())
                })
            {
                let milestone = WritingMilestone {
                    timestamp: Utc::now(),
                    word_count: self.current_word_count,
                    milestone_type: MilestoneType::WordCountTarget,
                    description: format!("{} words written this session!", milestone_count),
                };
                self.milestones.push(milestone);
            }
        }

        // Check target progress milestones
        if let Some(target) = self.target_words {
            let progress_milestones = [25, 50, 75, 100];

            for &percentage in &progress_milestones {
                let target_words = (target as f64 * percentage as f64 / 100.0) as usize;

                if words_written >= target_words
                    && !self.milestones.iter().any(|m| {
                        m.description
                            .contains(&format!("{}% of target", percentage))
                    })
                {
                    let milestone = WritingMilestone {
                        timestamp: Utc::now(),
                        word_count: self.current_word_count,
                        milestone_type: MilestoneType::WordCountTarget,
                        description: format!(
                            "{}% of target reached! ({}/{})",
                            percentage, words_written, target
                        ),
                    };
                    self.milestones.push(milestone);
                }
            }
        }
    }
}

impl WritingGoal {
    pub fn new(title: String, target_words: usize) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            title,
            target_words,
            target_date: None,
            current_progress: 0,
            completed: false,
            created_at: Utc::now(),
        }
    }

    pub fn with_deadline(mut self, deadline: DateTime<Utc>) -> Self {
        self.target_date = Some(deadline);
        self
    }

    pub fn update_progress(&mut self, current_words: usize) {
        self.current_progress = current_words;
        if current_words >= self.target_words {
            self.completed = true;
        }
    }

    pub fn progress_percentage(&self) -> f64 {
        if self.target_words > 0 {
            (self.current_progress as f64 / self.target_words as f64 * 100.0).min(100.0)
        } else {
            0.0
        }
    }

    pub fn is_overdue(&self) -> bool {
        if let Some(deadline) = self.target_date {
            !self.completed && Utc::now() > deadline
        } else {
            false
        }
    }

    pub fn days_remaining(&self) -> Option<i64> {
        self.target_date
            .map(|deadline| deadline.signed_duration_since(Utc::now()).num_days())
    }
}

impl PomodoroTimer {
    pub fn new() -> Self {
        Self {
            work_duration: Duration::minutes(25),
            break_duration: Duration::minutes(5),
            long_break_duration: Duration::minutes(15),
            sessions_until_long_break: 4,
            current_session: 0,
            start_time: None,
            is_break: false,
            is_paused: false,
            total_sessions_completed: 0,
        }
    }

    pub fn custom(
        work_minutes: i64,
        break_minutes: i64,
        long_break_minutes: i64,
        sessions_until_long_break: usize,
    ) -> Self {
        Self {
            work_duration: Duration::minutes(work_minutes),
            break_duration: Duration::minutes(break_minutes),
            long_break_duration: Duration::minutes(long_break_minutes),
            sessions_until_long_break,
            current_session: 0,
            start_time: None,
            is_break: false,
            is_paused: false,
            total_sessions_completed: 0,
        }
    }

    pub fn start(&mut self) {
        self.start_time = Some(Utc::now());
        self.is_paused = false;
    }

    pub fn pause(&mut self) {
        self.is_paused = true;
    }

    pub fn resume(&mut self) {
        self.is_paused = false;
    }

    pub fn stop(&mut self) {
        self.start_time = None;
        self.is_paused = false;
    }

    pub fn complete_session(&mut self) {
        if !self.is_break {
            self.total_sessions_completed += 1;
            self.current_session += 1;

            // Switch to break
            self.is_break = true;
            self.start_time = Some(Utc::now());
        } else {
            // Break completed, switch back to work
            self.is_break = false;
            self.start_time = Some(Utc::now());

            // Reset session counter for long breaks
            if self.current_session >= self.sessions_until_long_break {
                self.current_session = 0;
            }
        }
    }

    pub fn reset(&mut self) {
        self.current_session = 0;
        self.start_time = None;
        self.is_break = false;
        self.is_paused = false;
    }

    pub fn is_running(&self) -> bool {
        self.start_time.is_some() && !self.is_paused
    }

    pub fn time_remaining(&self) -> Option<Duration> {
        if let Some(start) = self.start_time {
            if !self.is_paused {
                let elapsed = Utc::now().signed_duration_since(start);
                let duration = if self.is_break {
                    if self.current_session == 0 {
                        self.long_break_duration
                    } else {
                        self.break_duration
                    }
                } else {
                    self.work_duration
                };

                let remaining = duration - elapsed;
                if remaining > Duration::zero() {
                    Some(remaining)
                } else {
                    Some(Duration::zero())
                }
            } else {
                None
            }
        } else {
            None
        }
    }

    pub fn is_complete(&self) -> bool {
        if let Some(remaining) = self.time_remaining() {
            remaining <= Duration::zero()
        } else {
            false
        }
    }

    pub fn current_phase(&self) -> PomodoroPhase {
        if self.is_break {
            if self.current_session == 0 {
                PomodoroPhase::LongBreak
            } else {
                PomodoroPhase::ShortBreak
            }
        } else {
            PomodoroPhase::Work
        }
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum PomodoroPhase {
    Work,
    ShortBreak,
    LongBreak,
}

impl Default for PomodoroTimer {
    fn default() -> Self {
        Self::new()
    }
}

// Daily writing statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DailyStats {
    pub date: chrono::NaiveDate,
    pub words_written: usize,
    pub time_spent: Duration,
    pub sessions_completed: usize,
    pub goals_achieved: usize,
    pub projects_worked_on: Vec<String>,
}

impl DailyStats {
    pub fn new(date: chrono::NaiveDate) -> Self {
        Self {
            date,
            words_written: 0,
            time_spent: Duration::zero(),
            sessions_completed: 0,
            goals_achieved: 0,
            projects_worked_on: Vec::new(),
        }
    }

    pub fn add_session(&mut self, session: &WritingSession) {
        self.words_written += session.words_written();
        self.time_spent = self.time_spent + session.session_duration();
        self.sessions_completed += 1;

        if !self.projects_worked_on.contains(&session.project_id) {
            self.projects_worked_on.push(session.project_id.clone());
        }

        self.goals_achieved += session.goals.iter().filter(|g| g.completed).count();
    }
}

// Writing streak tracker
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WritingStreak {
    pub current_streak: usize,
    pub longest_streak: usize,
    pub last_write_date: Option<chrono::NaiveDate>,
    pub total_writing_days: usize,
    pub streak_start_date: Option<chrono::NaiveDate>,
}

impl WritingStreak {
    pub fn new() -> Self {
        Self {
            current_streak: 0,
            longest_streak: 0,
            last_write_date: None,
            total_writing_days: 0,
            streak_start_date: None,
        }
    }

    pub fn record_writing_day(&mut self, date: chrono::NaiveDate) {
        let today = chrono::Utc::now().date_naive();

        if let Some(last_date) = self.last_write_date {
            let days_diff = date.signed_duration_since(last_date).num_days();

            if days_diff == 1 {
                // Consecutive day
                self.current_streak += 1;
                if self.streak_start_date.is_none() {
                    self.streak_start_date = Some(last_date);
                }
            } else if days_diff > 1 {
                // Streak broken
                if self.current_streak > self.longest_streak {
                    self.longest_streak = self.current_streak;
                }
                self.current_streak = 1;
                self.streak_start_date = Some(date);
            }
            // days_diff == 0 means same day, no change needed
        } else {
            // First writing day
            self.current_streak = 1;
            self.streak_start_date = Some(date);
        }

        self.last_write_date = Some(date);
        self.total_writing_days += 1;

        // Update longest streak if current is longer
        if self.current_streak > self.longest_streak {
            self.longest_streak = self.current_streak;
        }
    }

    pub fn check_streak_status(&mut self) {
        let today = chrono::Utc::now().date_naive();

        if let Some(last_date) = self.last_write_date {
            let days_since = today.signed_duration_since(last_date).num_days();

            if days_since > 1 {
                // Streak is broken
                if self.current_streak > self.longest_streak {
                    self.longest_streak = self.current_streak;
                }
                self.current_streak = 0;
                self.streak_start_date = None;
            }
        }
    }

    pub fn is_active(&self) -> bool {
        self.current_streak > 0
    }

    pub fn streak_duration(&self) -> Option<Duration> {
        if let Some(start_date) = self.streak_start_date {
            let today = chrono::Utc::now().date_naive();
            Some(Duration::days(
                today.signed_duration_since(start_date).num_days(),
            ))
        } else {
            None
        }
    }
}

impl Default for WritingStreak {
    fn default() -> Self {
        Self::new()
    }
}
