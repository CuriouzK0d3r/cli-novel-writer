# Pomodoro Timer Feature

The Writers CLI editor now includes a built-in Pomodoro timer to help you maintain focused writing sessions and improve productivity.

## What is the Pomodoro Technique?

The Pomodoro Technique is a time management method that uses a timer to break down work into intervals, traditionally 25 minutes in length, separated by short breaks. This technique helps:

- **Maintain focus** - Dedicated work periods with clear boundaries
- **Prevent burnout** - Regular breaks to rest and recharge
- **Track progress** - Count completed sessions to measure productivity
- **Build consistency** - Establish a sustainable writing routine

## How to Use

### Quick Start

1. **Open any story**: `writers write your-story`
2. **Start timer**: Press `F3` to begin your first Pomodoro session
3. **Write focused**: The timer shows in your status bar - just write!
4. **Take breaks**: When the session ends, you'll get a notification for break time
5. **Repeat**: The timer automatically cycles between work and break periods

### Timer Controls

| Key        | Action                         |
| ---------- | ------------------------------ |
| `F3`       | Start/Pause timer              |
| `F4`       | Show timer status and settings |
| `Shift+F3` | Reset timer and session count  |

### Status Bar Display

When the timer is active, you'll see it in your status bar:

```
INSERT | 📝 my-story.md | Ln 45, Col 12 | 543 words | 🍅 23:45 ▶️ (2)
                                                    │   │    │  │
                                                    │   │    │  └─ Completed Pomodoros
                                                    │   │    └─ Status (▶️ running, ⏸️ paused, ⏹️ stopped)
                                                    │   └─ Time remaining
                                                    └─ Phase icon (🍅 work, ☕ break)
```

## Timer Phases

### Work Session (🍅)

- **Duration**: 25 minutes (default)
- **Purpose**: Focused writing time
- **Goal**: Write without distractions or interruptions

### Short Break (☕)

- **Duration**: 5 minutes (default)
- **Purpose**: Quick rest between work sessions
- **Suggestions**: Stretch, hydrate, brief walk

### Long Break (☕)

- **Duration**: 15 minutes (default)
- **Purpose**: Extended rest after every 4 Pomodoros
- **Suggestions**: Longer break, meal, exercise

## Automatic Features

### Smart Notifications

- **Session complete**: "🎉 Focus session complete! Time for a break."
- **Break over**: "✍️ Break over! Time to focus."
- **Pomodoro milestone**: "🍅 Pomodoro #4 completed! Great work!"

### Auto-Progression

- Timer automatically transitions between work and break phases
- No need to manually start each phase
- 2-second pause between phases to acknowledge the transition

### Session Tracking

- Counts completed Pomodoros during your writing session
- Shows progress in status bar
- Resets when you restart the editor (daily fresh start)

## Detailed Status (F4)

Press `F4` to see comprehensive timer information:

```
🍅 POMODORO TIMER

Current Status:
  Phase: Focus
  Time: 23:45
  Status: Running
  Completed: 2 Pomodoros

Configuration:
  Work Duration: 25 minutes
  Short Break: 5 minutes
  Long Break: 15 minutes
  Long Break Every: 4 Pomodoros

Controls:
  F3        Start/Pause timer
  Shift+F3  Reset timer
  F4        Show this dialog

Current Phase Progress: ████████████████░░░░ 80%
```

## Writing Tips with Pomodoro

### Before Starting

1. **Plan your session** - Know what you want to write
2. **Eliminate distractions** - Close other apps, silence notifications
3. **Set a specific goal** - "Write 500 words" or "Complete this scene"

### During Work Sessions

- **Stay focused** - Resist the urge to check email/social media
- **Keep writing** - Don't edit heavily, just get words down
- **Use the status bar** - Glance at remaining time for motivation
- **Note ideas quickly** - Use `Ctrl+T` to toggle to notes for quick thoughts

### During Breaks

- **Step away** from the computer
- **Move your body** - Stretch, walk, do jumping jacks
- **Rest your eyes** - Look at something distant
- **Hydrate** - Keep water nearby

### Session Planning

- **Start small** - Begin with 1-2 Pomodoros if you're new
- **Build gradually** - Work up to longer writing sessions
- **Track patterns** - Notice when you're most productive
- **Adjust timing** - Some writers prefer 45-minute sessions

## Integration with Other Features

### Notes Toggle (Ctrl+T)

- Quickly switch to notes during work sessions
- Capture ideas without losing focus
- Timer continues running in notes

### Word Count Tracking

- Timer pairs with word count in status bar
- Track words written per Pomodoro
- Measure productivity over time

### Distraction-Free Mode (F11)

- Perfect combination with Pomodoro timer
- Hide all UI except essential timer information
- Maximum focus during work sessions

### Typewriter Mode (F9)

- Enhanced focus with dimmed lines
- Combines well with timed writing sessions
- Keeps attention on current sentence

## Benefits for Writers

### Productivity

- **Consistent output** - Regular writing sessions add up
- **Reduced procrastination** - 25 minutes feels manageable
- **Clear progress tracking** - See how much you accomplish

### Quality

- **Sustained focus** - Deep work periods improve writing quality
- **Regular breaks** - Prevents mental fatigue and writer's block
- **Fresh perspective** - Breaks help you return with new ideas

### Health

- **Eye rest** - Regular breaks reduce eye strain
- **Physical movement** - Prevents repetitive stress injuries
- **Mental wellness** - Balanced work/rest reduces stress

### Habit Building

- **Routine establishment** - Consistent timing builds writing habits
- **Progress visibility** - Completed Pomodoros provide motivation
- **Sustainable pace** - Prevents burnout from long writing marathons

## Customization

While the current implementation uses standard Pomodoro timing (25/5/15 minutes), the timer is designed to be configurable. Future updates may include:

- Custom work/break durations
- Different timing profiles (e.g., 45/10/20 for deep work)
- Daily/weekly Pomodoro tracking
- Integration with writing goals
- Sound notifications (optional)

## Best Practices

### Getting Started

1. **Try it once** - Start with a single Pomodoro to get familiar
2. **Use with existing workflow** - Don't change everything at once
3. **Track what works** - Notice which times of day are most productive

### Advanced Usage

- **Batch similar tasks** - Use Pomodoros for editing vs. drafting
- **Plan daily goals** - "I want to complete 4 Pomodoros today"
- **Combine with word goals** - "500 words per Pomodoro"
- **Review progress** - Check Pomodoro count at end of sessions

### Troubleshooting

- **Interruptions**: Pause timer, handle interruption, resume when ready
- **Can't focus**: Try shorter sessions or check if you need a longer break
- **Too rigid**: It's okay to adjust - the timer serves you, not the other way around

---

The Pomodoro timer transforms your writing sessions from endless, overwhelming stretches into manageable, productive intervals. Start with one Pomodoro and build from there! 🍅✍️
