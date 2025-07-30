# Modal Editor Fix Test

This file is for testing the double character insertion fix.

## Test Instructions

1. Run the editor with this file
2. Start in Navigation mode (should show "NAV" in status bar)
3. Try typing characters - they should NOT appear (navigation mode prevents editing)
4. Press 'i' to enter Insert mode (should show "INS" in status bar)
5. Type some characters - they should appear ONCE, not twice
6. Press Escape to return to Navigation mode
7. Try navigation with w/a/s/d or h/j/k/l keys

## Test Cases

Type these characters in Insert mode and verify they appear only once:

- w (should not cause double 'w')
- a (should not cause double 'a') 
- s (should not cause double 's')
- d (should not cause double 'd')
- h (should not cause double 'h')
- j (should not cause double 'j')
- k (should not cause double 'k')
- l (should not cause double 'l')
- i (should not cause double 'i')

## Navigation Test

In Navigation mode:
- w/k should move up
- a/h should move left  
- s/j should move down
- d/l should move right

## Expected Behavior

✅ Characters appear once in Insert mode
✅ No characters inserted in Navigation mode
✅ Mode switching works with 'i' and Escape
✅ Status bar shows current mode (NAV/INS)
✅ Navigation keys work in Navigation mode