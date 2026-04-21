# Guitar Practice App — Claude Code Plan Mode Prompt

## Context

Build a single-page React web app (`.jsx` artifact or standalone) that helps me practice guitar chord progressions by ear. The app listens to me play chords via the Web Audio API + pitch detection, validates what I play against a generated sequence, and logs my practice sessions.

---

## Core Requirements

### 1. Interval / Chord Sequence Generator

- User selects a **key** (C, C#, D, D#, E, F, F#, G, G#, A, A#, B) **or "Random"**. When set to Random, the app picks a new random key for each round. The selected/generated key is always shown so the user knows what they're playing in.
- User also selects a **scale type** (Major, Minor, or "Random" to alternate).
- User sets how many numbers to generate (default: 4, range: 1–8).
- App generates a random sequence of scale degree numbers (1–8).
- **Display modes** — the sequence display has a **3-way visibility toggle**:
  1. **Full**: show both scale degree numbers AND resolved chord names (e.g., `4 → F Major`). Use this when learning.
  2. **Numbers only**: show only the degree numbers (e.g., `1 4 5 1`). Chord names are hidden. This is the main practice mode — the goal is to internalize which chord each number maps to in any key, so hiding the answer forces recall.
  3. **Hidden**: show nothing except the current chord position indicator (dot or index). Full blind practice — the user must know the entire sequence from memory after seeing it briefly.
- When in "Numbers only" or "Hidden" mode, **after** the user plays a chord (correct or incorrect), reveal that chord's name as feedback so they can learn from mistakes.
- A quick-peek button (hold to reveal, release to hide) lets the user glance at the full names without permanently switching modes.
- The harmonized scale reference:

**Major scale chord qualities:**
| Degree | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|--------|---|---|---|---|---|---|---|---|
| Quality | Major | minor | minor | Major | Dominant 7 | minor | diminished | Major (octave) |

**Minor scale chord qualities:**
| Degree | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|--------|---|---|---|---|---|---|---|---|
| Quality | minor | diminished | Major | minor | minor | Major | Dominant 7 | minor (octave) |

- Example: Key of C Major, sequence `1 4 5 1` → display **C Major → F Major → G7 → C Major**
- Example: Key of A Minor, sequence `1 3 6 5` → display **Am → C Major → F Major → Em**

### 2. Chord Voicing Diagrams

- Each chord card in the sequence can optionally show a **fretboard voicing diagram** — a mini SVG neck grid showing finger positions.
- **Toggle**: a "Show Voicings" toggle in the config panel (or per-chord tap-to-reveal, respecting the display mode — hidden modes hide voicings too, revealed on play like chord names).
- **Scope — only CAGED barre chord shapes with roots on the E, A, and D strings:**
  - **E-string root** voicings (6th string barre shapes)
  - **A-string root** voicings (5th string barre shapes)
  - **D-string root** voicings (4th string root shapes)
- For each chord in the sequence, show **up to 3 voicing options** (one per root string), so the user can see different positions up the neck.
- **Chord qualities to cover** (matching the harmonized scale types):
  - Major (E-root, A-root, D-root shapes)
  - minor (E-root, A-root, D-root shapes)
  - Dominant 7 (E-root, A-root, D-root shapes)
  - diminished (E-root, A-root, D-root shapes)
- **Diagram rendering**: render as inline SVG — a 6-string × 4-or-5-fret grid with:
  - Filled dots for fretted notes, with the **root note dot highlighted** in a distinct color.
  - A barre indicator (thick line or arc) across strings where applicable.
  - Fret number label on the side so the user knows position (e.g., "5fr").
  - "X" above muted strings, "O" above open strings.
- **Voicing data**: hard-code a lookup table of shapes. Each shape is defined as a template (relative to root fret) so it transposes to any key by shifting the fret number. For example, the E-shape Major barre at fret N = `[N, N+2, N+2, N+1, N, N]` across strings 6→1. Store these as:
  ```
  VOICING_TEMPLATES = {
    "Major": {
      "E": { strings: [0, 2, 2, 1, 0, 0], barre: [1,6], baseFret: "root" },
      "A": { strings: [-1, 0, 2, 2, 2, 0], barre: [2,5], baseFret: "root" },
      "D": { strings: [-1, -1, 0, 2, 3, 2], barre: null, baseFret: "root" }
    },
    "minor": { ... },
    "dom7": { ... },
    "dim": { ... }
  }
  ```
  Then to render "F Major, E-root": root F is fret 1 on the 6th string → apply template offset by 1.
- Keep diagrams compact — they sit alongside or below the chord name on each card, not in a separate view.

### 3. Audio Listening & Chord Detection

This is the hardest part. Plan the approach carefully.

**Preferred approach — pitch detection via Web Audio API:**
- Use `navigator.mediaDevices.getUserMedia({ audio: true })` to capture mic input.
- Connect to an `AnalyserNode` to get frequency data.
- Implement **autocorrelation-based pitch detection** (YIN algorithm or similar) on the raw audio buffer to find the fundamental frequency.
- Map detected frequency → nearest note name (A4 = 440Hz, equal temperament).
- For **chord detection**: either (a) detect the root note only and match against the expected chord root, or (b) use spectral analysis to identify multiple simultaneous pitches and infer chord quality (Major/minor/dim/7). Start with option (a) — root detection — as MVP, since full chord recognition from a single mic is very hard.
- Show a real-time tuner/frequency display so I can see what the app is hearing.

**Detection flow per chord in the sequence:**
1. Highlight the current expected chord.
2. Listen for a stable pitch that holds for ~0.5s.
3. Compare detected root note to the expected chord's root.
4. If correct → mark green ✓, advance to next chord.
5. If wrong → mark red ✗, allow retry (don't auto-advance).
6. When all chords in the sequence are validated → show "Round Complete" with accuracy stats.

**Fallback — manual mode:**
- If mic access is denied or detection is unreliable, provide manual "✓ Got it / ✗ Missed it" buttons per chord so the app is still usable.

### 3. Tempo / Metronome Mode

- User sets a **BPM** (beats per minute) via a number input or tap-tempo button (range: 40–240, default: 80).
- User selects a **time signature** — default 4/4, also support 3/4 and 6/8.
- User picks **beats per chord** — how many beats they get before they must move to the next chord in the sequence (default: 4, range: 1–8). This means at 80 BPM with 4 beats per chord, you have 3 seconds per chord change.
- When tempo mode is **enabled**:
  - A metronome click plays using the Web Audio API (`OscillatorNode` → short sine/square beep, ~80ms duration). Beat 1 of each measure gets a higher pitch (e.g., 1000Hz) vs other beats (800Hz) for accent.
  - A visual beat indicator pulses or flashes on each beat (think a row of dots or a bouncing ball).
  - After the allotted beats-per-chord expire, the app **auto-advances** to the next chord regardless of whether detection confirmed it — and marks it as missed if not yet validated. This adds time pressure.
  - The chord detection window is still active — if the correct root is detected at any point during the allotted beats, mark it correct immediately and hold green until the next chord advances.
  - A **count-in** of 1 bar plays before the first chord so the user can get ready.
- When tempo mode is **disabled** (free time):
  - No metronome, no auto-advance. Detection flow works as described in section 2 — user plays at their own pace and the app waits for a correct pitch.
- Tempo setting is saved per session in the logbook entry.

**Metronome audio implementation notes:**
- Use `AudioContext.currentTime` for sample-accurate scheduling — do NOT use `setInterval` for click timing (it drifts). Schedule clicks ahead in a lookahead buffer (~25ms check interval, ~100ms schedule-ahead window).
- Keep the metronome and the mic input on the **same `AudioContext`** to avoid conflicts.
- The metronome click should be quiet enough not to confuse the pitch detector — use a short, sharp transient (sine wave, fast envelope) rather than a sustained tone.

### 4. Practice Session Flow

- **Start Practice** → select key, scale, sequence length, tempo mode (on/off + BPM + beats per chord) → generate first sequence.
- Each validated sequence = 1 "round."
- After completing a round, auto-generate a new sequence. If key or scale is set to Random, pick a fresh random value for the new round. Display a brief "Next: [Key] [Scale]" interstitial so the user can orient before the count-in.
- Running timer shows elapsed practice time.
- **End Practice** → stop timer, prompt for self-rated effectiveness (1–5 stars or slider), save to logbook.

### 4. Practice Logbook

- Persistent storage (use the artifact `window.storage` API for cross-session persistence).
- Each entry stores:
  - `date` (ISO string)
  - `durationMinutes` (number, from timer)
  - `key` (string — the actual key played, even if Random was selected)
  - `scale` (string: "Major" | "Minor")
  - `displayMode` (string: "full" | "numbers_only" | "hidden")
  - `randomKey` (boolean — whether Random key mode was on)
  - `tempoEnabled` (boolean)
  - `bpm` (number | null — null if tempo disabled)
  - `beatsPerChord` (number | null)
  - `roundsCompleted` (number)
  - `totalChords` (number)
  - `correctChords` (number)
  - `accuracy` (percentage)
  - `effectivenessRating` (1–5)
- Logbook view:
  - List of past sessions, most recent first.
  - Summary stats at top: total practice time, average accuracy, streak (consecutive days practiced).
  - Ability to delete individual entries.

---

## Technical Constraints & Stack

- **Single `.jsx` file** for artifact rendering (React functional component with hooks).
- **Styling**: Tailwind utility classes only (no custom CSS files — inline `<style>` blocks are fine for animations/keyframes if needed).
- **State management**: `useState` + `useReducer` for complex state (session, logbook).
- **Storage**: `window.storage.get/set/list/delete` — NOT localStorage (it's blocked in artifacts).
- **Audio**: Web Audio API is available in browser. No external audio libraries — implement pitch detection from scratch using `AnalyserNode` + autocorrelation.
- **No external API calls** for audio recognition — everything runs client-side.
- **Available libraries**: `lucide-react` for icons, `recharts` for any progress charts.

---

## UI/UX Direction

- **Dark theme** — easy on the eyes during practice sessions (likely in a dim room).
- Musical / instrument aesthetic — think pedalboard or amp-head inspired UI, not generic dashboard.
- Large, readable chord names (you're looking at this from a few feet away while holding a guitar).
- Clear visual feedback: green/red flash on correct/incorrect detection.
- Real-time frequency visualizer (waveform or simple bar) so I can see the mic is picking me up.
- Mobile-responsive — I might use this on my phone propped up on a music stand.

---

## Architecture Guidance

Structure the component roughly as:

```
App
├── Header (app title, nav between Practice / Logbook)
├── PracticeView
│   ├── ConfigPanel (key selector w/ Random option, scale selector w/ Random option, sequence length, display mode toggle, tempo toggle + BPM + beats-per-chord)
│   ├── SequenceDisplay (shows chord cards, highlights current)
│   │   └── ChordVoicingDiagram (inline SVG fretboard, up to 3 per chord)
│   ├── AudioDetector (mic controls, frequency display, detection logic)
│   ├── Metronome (click scheduler, beat indicator, count-in logic)
│   ├── Timer (elapsed time display)
│   └── RoundComplete (accuracy summary, next round / end buttons)
├── LogbookView
│   ├── SummaryStats (total time, avg accuracy, streak)
│   └── SessionList (scrollable list of past sessions)
└── Music Theory Utils (pure functions, no UI)
    ├── getScaleNotes(key, scaleType) → note names
    ├── getChordAtDegree(key, scaleType, degree) → { root, quality, name }
    ├── getVoicings(root, quality) → [ { rootString, frets[], barre, fretNumber } ] (up to 3)
    ├── frequencyToNote(freq) → { note, octave, cents }
    └── generateSequence(length) → number[]
```

---

## Edge Cases to Handle

- Mic permission denied → fall back to manual mode gracefully.
- Background noise → require a minimum amplitude threshold before attempting pitch detection.
- Chord detection ambiguity → show "detected: [note]" so user can see what the app heard and self-correct.
- Sequence of `8` → treat as octave of root (same chord quality as degree 1).
- First load with no logbook data → show empty state with encouraging message.
- Storage errors → catch and show inline error, don't crash.
- Metronome click bleeding into mic → keep click short (~80ms) and use amplitude gating so the detector ignores transients that match the click's frequency profile.
- Tempo mode at very high BPM with 1 beat per chord → warn user this is extremely fast, but allow it.

---

## What NOT to Build (Keep Scope Tight)

- No user accounts or auth.
- No backing tracks (future feature).
- No music notation rendering.
- No server or database — everything is client-side + `window.storage`.