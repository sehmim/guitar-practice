# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Single-file React guitar chord practice app. Full spec in `PLAN.md`.

## Stack

- Single `.jsx` file (artifact-style)
- Tailwind utility classes only; inline `<style>` blocks OK for keyframes
- `useState` + `useReducer` for state
- `window.storage.get/set/list/delete` for persistence — NOT `localStorage`
- Web Audio API for mic input + metronome (no external audio libs)
- `lucide-react` for icons, `recharts` for charts
- No external API calls — all client-side

## Architecture

```
App
├── PracticeView
│   ├── ConfigPanel
│   ├── SequenceDisplay → ChordVoicingDiagram (inline SVG)
│   ├── AudioDetector
│   ├── Metronome
│   ├── Timer
│   └── RoundComplete
├── LogbookView
│   ├── SummaryStats
│   └── SessionList
└── Music Theory Utils (pure functions)
    ├── getScaleNotes(key, scaleType)
    ├── getChordAtDegree(key, scaleType, degree) → { root, quality, name }
    ├── getVoicings(root, quality) → up to 3 voicings
    ├── frequencyToNote(freq) → { note, octave, cents }
    └── generateSequence(length) → number[]
```

## Key Decisions

**Pitch detection**: Autocorrelation-based (YIN or similar) on `AnalyserNode` buffer. MVP = root note detection only. Match detected root against expected chord root.

**Metronome timing**: `AudioContext.currentTime` scheduling — NOT `setInterval`. Lookahead ~100ms, check interval ~25ms. Keep mic and metronome on same `AudioContext`.

**Display modes**: full → numbers-only → hidden. After playing a chord in non-full mode, reveal chord name as feedback.

**Voicing templates**: Hard-coded CAGED shapes (E/A/D root strings) stored as relative-fret templates, transposed by root fret. Cover Major, minor, dom7, diminished.

**Scale harmonization**:
- Major: 1=Maj, 2=min, 3=min, 4=Maj, 5=Dom7, 6=min, 7=dim, 8=Maj
- Minor: 1=min, 2=dim, 3=Maj, 4=min, 5=min, 6=Maj, 7=Dom7, 8=min

## UI

Dark theme, musical/pedalboard aesthetic. Large chord names (readable from arm's length). Mobile-responsive. Green/red flash on correct/incorrect detection.

## Out of Scope

No auth, no backing tracks, no music notation, no server.
