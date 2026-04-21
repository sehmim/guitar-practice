import { useState, useReducer, useRef, useEffect, useCallback } from "react";
import { Guitar, BookOpen, Mic, MicOff, Play, Pause, Square, SkipForward, Eye, EyeOff, ChevronRight, Star, Trash2, Clock, Target, Flame, Volume2 } from "lucide-react";

// localStorage adapter (replaces storage from Claude artifact environment)
const storage = {
  async set(key, value) { localStorage.setItem(key, JSON.stringify(value)); },
  async get(key) {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : null;
  },
  async list() {
    return Object.keys(localStorage).filter(k => k.startsWith("session_"));
  },
  async delete(key) { localStorage.removeItem(key); },
};

// ─── Music Theory ────────────────────────────────────────────────────────────

const NOTES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const MAJOR_QUALITIES = ['Major','minor','minor','Major','dom7','minor','dim','Major'];
const MINOR_QUALITIES = ['minor','dim','Major','minor','minor','Major','dom7','minor'];

function noteIndex(note) { return NOTES.indexOf(note); }

const MAJOR_INTERVALS = [0,2,4,5,7,9,11,12];
const MINOR_INTERVALS = [0,2,3,5,7,8,10,12];

function getChordAtDegree(key, scaleType, degree) {
  const deg = degree === 8 ? 1 : degree;
  const intervals = scaleType === 'Major' ? MAJOR_INTERVALS : MINOR_INTERVALS;
  const idx = (noteIndex(key) + intervals[deg-1]) % 12;
  const root = NOTES[idx];
  const quality = scaleType === 'Major' ? MAJOR_QUALITIES[deg-1] : MINOR_QUALITIES[deg-1];
  let name;
  if (quality === 'Major') name = root;
  else if (quality === 'minor') name = root + 'm';
  else if (quality === 'dom7') name = root + '7';
  else name = root + 'dim';
  return { root, quality, name, degree };
}

function generateSequence(length) {
  const seq = [];
  for (let i = 0; i < length; i++) {
    let next;
    do { next = Math.floor(Math.random() * 7) + 1; } while (next === seq[seq.length - 1]);
    seq.push(next);
  }
  return seq;
}

function frequencyToNote(freq) {
  if (!freq || freq < 20) return null;
  const A4 = 440;
  const semitones = 12 * Math.log2(freq / A4);
  const midiNote = Math.round(semitones) + 69;
  const note = NOTES[((midiNote % 12) + 12) % 12];
  const octave = Math.floor(midiNote / 12) - 1;
  const cents = Math.round((semitones - Math.round(semitones)) * 100);
  return { note, octave, cents };
}

function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function resolveKey(k) { return k === 'Random' ? pickRandom(NOTES) : k; }
function resolveScale(s) { return s === 'Random' ? pickRandom(['Major','Minor']) : s; }

// ─── Voicing Templates ───────────────────────────────────────────────────────

// Root fret on each string (standard tuning)
const ROOT_FRETS = {
  6: { C:8,  'C#':9,  D:10, 'D#':11, E:0,  F:1,  'F#':2,  G:3,  'G#':4,  A:5,  'A#':6,  B:7  },
  5: { C:3,  'C#':4,  D:5,  'D#':6,  E:7,  F:8,  'F#':9,  G:10, 'G#':11, A:0,  'A#':1,  B:2  },
  4: { C:10, 'C#':11, D:0,  'D#':1,  E:2,  F:3,  'F#':4,  G:5,  'G#':6,  A:7,  'A#':8,  B:9  },
};

// offsets: strings 6→1, relative to root fret. -1=muted, barre=offset from root for barre fret (null=none)
const VOICING_TEMPLATES = {
  Major: {
    E: { offsets:[0,2,2,1,0,0], barre:0, rootString:6 },
    A: { offsets:[-1,0,2,2,2,0], barre:2, rootString:5 },
    D: { offsets:[-1,-1,0,2,3,2], barre:null, rootString:4 },
  },
  minor: {
    E: { offsets:[0,2,2,0,0,0], barre:0, rootString:6 },
    A: { offsets:[-1,0,2,2,1,0], barre:null, rootString:5 },
    D: { offsets:[-1,-1,0,2,3,1], barre:null, rootString:4 },
  },
  dom7: {
    E: { offsets:[0,2,0,1,0,0], barre:0, rootString:6 },
    A: { offsets:[-1,0,2,0,2,0], barre:null, rootString:5 },
    D: { offsets:[-1,-1,0,2,1,2], barre:null, rootString:4 },
  },
  dim: {
    E: { offsets:[0,1,2,0,2,-1], barre:null, rootString:6 },
    A: { offsets:[-1,0,1,2,1,-1], barre:null, rootString:5 },
    D: { offsets:[-1,-1,0,1,0,1], barre:null, rootString:4 },
  },
};

function getVoicings(root, quality) {
  const tmpl = VOICING_TEMPLATES[quality];
  if (!tmpl) return [];
  return ['E','A','D'].map(shape => {
    const t = tmpl[shape];
    const rootFret = ROOT_FRETS[t.rootString][root];
    const frets = t.offsets.map(o => o === -1 ? -1 : rootFret + o);
    const baseFret = rootFret;
    const barreFret = t.barre !== null ? rootFret + t.barre : null;
    return { shape, frets, baseFret, barreFret, rootString: t.rootString };
  });
}

// ─── SVG Voicing Diagram ─────────────────────────────────────────────────────

function ChordVoicingDiagram({ voicing }) {
  const { frets, baseFret, barreFret, rootString } = voicing;
  const W = 90, H = 110;
  const LEFT = 18, TOP = 22;
  const strGap = 11, fretGap = 16, numFrets = 5;
  const strings = 6;

  const validFrets = frets.filter(f => f >= 0);
  if (validFrets.length === 0) return null;

  const minF = Math.min(...validFrets);
  const displayBase = minF === 0 ? 0 : minF;
  const showNut = displayBase === 0;

  return (
    <svg width={W} height={H} className="flex-shrink-0">
      {/* Fret position label */}
      {displayBase > 0 && (
        <text x={W - 4} y={TOP + fretGap * 0.5 + 4} textAnchor="end" fontSize={9} fill="#9ca3af">{displayBase}fr</text>
      )}

      {/* Nut */}
      {showNut && (
        <rect x={LEFT} y={TOP - 3} width={(strings-1)*strGap} height={4} fill="#e5e7eb" rx={1}/>
      )}

      {/* Fret lines */}
      {Array.from({length: numFrets+1}, (_,i) => (
        <line key={i} x1={LEFT} y1={TOP + i*fretGap} x2={LEFT+(strings-1)*strGap} y2={TOP+i*fretGap}
          stroke="#374151" strokeWidth={i===0 && !showNut ? 1 : 0.5}/>
      ))}

      {/* String lines */}
      {Array.from({length: strings}, (_,i) => (
        <line key={i} x1={LEFT+i*strGap} y1={TOP} x2={LEFT+i*strGap} y2={TOP+numFrets*fretGap}
          stroke="#4b5563" strokeWidth={0.5}/>
      ))}

      {/* Barre */}
      {barreFret !== null && (() => {
        const bY = TOP + (barreFret - displayBase - 0.5) * fretGap;
        return (
          <rect x={LEFT} y={bY - 5} width={(strings-1)*strGap} height={10}
            fill="#6b7280" rx={5} opacity={0.8}/>
        );
      })()}

      {/* X / O above strings */}
      {frets.map((f, i) => {
        const x = LEFT + (5-i) * strGap;
        if (f === -1) return <text key={i} x={x} y={TOP-6} textAnchor="middle" fontSize={9} fill="#ef4444">×</text>;
        if (f === 0) return <text key={i} x={x} y={TOP-6} textAnchor="middle" fontSize={9} fill="#9ca3af">○</text>;
        return null;
      })}

      {/* Finger dots */}
      {frets.map((f, i) => {
        if (f <= 0) return null;
        const relF = f - displayBase;
        if (relF < 1 || relF > numFrets) return null;
        const x = LEFT + (5-i) * strGap;
        const y = TOP + (relF - 0.5) * fretGap;
        const isRoot = (6-i) === rootString;
        return (
          <circle key={i} cx={x} cy={y} r={5}
            fill={isRoot ? '#f59e0b' : '#9ca3af'}/>
        );
      })}
    </svg>
  );
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

const initialState = {
  view: 'practice',
  key: 'C',
  scaleType: 'Major',
  sequenceLength: 4,
  displayMode: 'numbers_only',
  showVoicings: true,
  tempoEnabled: true,
  bpm: 80,
  timeSignature: '4/4',
  beatsPerChord: 4,
  autoRounds: true,
  autoRoundsTarget: 10,

  sessionActive: false,
  sessionPaused: false,
  pausedElapsed: 0,
  pausedAt: null,
  sessionKey: 'C',
  sessionScale: 'Major',
  sequence: [],
  chords: [],
  currentChordIndex: 0,
  chordResults: [],
  revealedChords: [],
  roundsCompleted: 0,
  totalChords: 0,
  correctChords: 0,
  sessionStartTime: null,
  roundState: 'config',

  micActive: false,
  manualMode: false,
  detectedNote: null,
  detectedFreq: null,
  peekActive: false,

  currentBeat: -1,
  countingIn: false,

  logbook: [],
  storageError: null,
};

function buildRound(state, key, scale) {
  const seq = generateSequence(state.sequenceLength);
  const chords = seq.map(d => getChordAtDegree(key, scale, d));
  return {
    sequence: seq,
    chords,
    currentChordIndex: 0,
    chordResults: Array(seq.length).fill('pending'),
    revealedChords: Array(seq.length).fill(false),
  };
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_VIEW': return { ...state, view: action.view };
    case 'SET_CONFIG': return { ...state, [action.key]: action.value };

    case 'START_SESSION': {
      const key = resolveKey(state.key);
      const scale = resolveScale(state.scaleType);
      const round = buildRound(state, key, scale);
      return {
        ...state,
        sessionActive: true,
        sessionKey: key,
        sessionScale: scale,
        ...round,
        roundsCompleted: 0,
        totalChords: 0,
        correctChords: 0,
        sessionStartTime: Date.now(),
        roundState: state.tempoEnabled ? 'countdown' : 'playing',
        currentBeat: -1,
        countingIn: state.tempoEnabled,
      };
    }

    case 'NEXT_ROUND': {
      const key = state.key === 'Random' ? resolveKey('Random') : state.sessionKey;
      const scale = state.scaleType === 'Random' ? resolveScale('Random') : state.sessionScale;
      const round = buildRound(state, key, scale);
      return {
        ...state,
        sessionKey: key,
        sessionScale: scale,
        ...round,
        roundsCompleted: state.roundsCompleted + 1,
        roundState: state.tempoEnabled ? 'countdown' : 'playing',
        currentBeat: -1,
        countingIn: state.tempoEnabled,
      };
    }

    case 'CHORD_RESULT': {
      // Only marks visual state — does NOT advance index.
      // Tempo: ADVANCE_CHORD advances at bar end. Free-time: correct advances immediately.
      const { index, result } = action;
      if (state.chordResults[index] !== 'pending') return state;
      const newResults = [...state.chordResults];
      const newRevealed = [...state.revealedChords];
      newResults[index] = result;
      newRevealed[index] = true;

      if (state.tempoEnabled) {
        // Hold position — ADVANCE_CHORD fires after full bar
        return { ...state, chordResults: newResults, revealedChords: newRevealed, detectedNote: null };
      } else {
        // Free-time: correct → advance, incorrect → stay (user retries)
        const isLast = index === state.chords.length - 1;
        const advance = result === 'correct';
        return {
          ...state,
          chordResults: newResults,
          revealedChords: newRevealed,
          currentChordIndex: advance && !isLast ? index + 1 : index,
          totalChords: state.totalChords + 1,
          correctChords: state.correctChords + (result === 'correct' ? 1 : 0),
          roundState: advance && isLast ? 'round_complete' : state.roundState,
          detectedNote: null,
        };
      }
    }

    case 'ADVANCE_CHORD': {
      // Fires at end of each bar. Always advances chord; counts result.
      const idx = action.index;
      if (idx >= state.chords.length || state.currentChordIndex !== idx) return state;
      const newResults = [...state.chordResults];
      const newRevealed = [...state.revealedChords];
      if (newResults[idx] === 'pending') {
        newResults[idx] = 'incorrect';
        newRevealed[idx] = true;
      }
      const wasCorrect = newResults[idx] === 'correct';
      const isLast = idx === state.chords.length - 1;
      return {
        ...state,
        chordResults: newResults,
        revealedChords: newRevealed,
        totalChords: state.totalChords + 1,
        correctChords: state.correctChords + (wasCorrect ? 1 : 0),
        currentChordIndex: isLast ? idx : idx + 1,
        roundState: isLast ? 'round_complete' : state.roundState,
        detectedNote: null,
      };
    }

    case 'SET_BEAT': return { ...state, currentBeat: action.beat };
    case 'END_COUNTDOWN': return { ...state, countingIn: false, roundState: 'playing' };

    case 'SET_MIC': return { ...state, micActive: action.active };
    case 'SET_MANUAL_MODE': return { ...state, manualMode: action.value };
    case 'SET_DETECTED': return { ...state, detectedNote: action.note, detectedFreq: action.freq };
    case 'SET_PEEK': return { ...state, peekActive: action.value };

    case 'PAUSE_SESSION': return {
      ...state,
      sessionPaused: true,
      pausedAt: Date.now(),
    };

    case 'RESUME_SESSION': return {
      ...state,
      sessionPaused: false,
      pausedElapsed: state.pausedElapsed + (state.pausedAt ? Date.now() - state.pausedAt : 0),
      pausedAt: null,
    };

    case 'END_SESSION': return {
      ...state,
      sessionActive: false,
      sessionPaused: false,
      pausedElapsed: 0,
      pausedAt: null,
      roundState: 'config',
      currentBeat: -1,
      micActive: false,
      detectedNote: null,
    };

    case 'SET_LOGBOOK': return { ...state, logbook: action.entries };
    case 'ADD_LOG_ENTRY': return { ...state, logbook: [action.entry, ...state.logbook] };
    case 'REMOVE_LOG_ENTRY': return { ...state, logbook: state.logbook.filter(e => e.id !== action.id) };
    case 'SET_STORAGE_ERROR': return { ...state, storageError: action.msg };

    default: return state;
  }
}

// ─── Chroma-Based Chord Detection ────────────────────────────────────────────

const CHORD_INTERVALS = {
  Major: [0, 4, 7],
  minor: [0, 3, 7],
  dom7:  [0, 4, 7, 10],
  dim:   [0, 3, 6],
};

function computeChroma(freqData, sampleRate, fftSize) {
  const chroma = new Float32Array(12).fill(0);
  const nyquist = sampleRate / 2;
  const binCount = fftSize / 2;
  for (let i = 1; i < binCount; i++) {
    const freq = (i / binCount) * nyquist;
    if (freq < 65 || freq > 2000) continue;
    const dB = freqData[i];
    if (dB < -70) continue;
    const linear = Math.pow(10, dB / 20);
    const midi = 12 * Math.log2(freq / 440) + 69;
    const pc = ((Math.round(midi) % 12) + 12) % 12;
    chroma[pc] += linear;
  }
  const max = Math.max(...chroma);
  if (max > 0) for (let i = 0; i < 12; i++) chroma[i] /= max;
  return chroma;
}

function scoreChord(chroma, rootNote, quality) {
  const rootIdx = NOTES.indexOf(rootNote);
  if (rootIdx < 0) return 0;
  const intervals = CHORD_INTERVALS[quality] || CHORD_INTERVALS.Major;
  let score = 0;
  for (const interval of intervals) score += chroma[(rootIdx + interval) % 12];
  return score / intervals.length;
}

function getRmsFromTimeDomain(buf) {
  let rms = 0;
  for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
  return Math.sqrt(rms / buf.length);
}

function topChromaNote(chroma) {
  let max = 0, idx = 0;
  for (let i = 0; i < 12; i++) { if (chroma[i] > max) { max = chroma[i]; idx = i; } }
  return max > 0.1 ? NOTES[idx] : null;
}

// ─── Components ──────────────────────────────────────────────────────────────

function Header({ view, dispatch }) {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900">
      <div className="flex items-center gap-2">
        <Guitar size={22} className="text-amber-400"/>
        <span className="font-bold text-lg tracking-wide text-white">FretBoard</span>
      </div>
      <nav className="flex gap-1">
        {[['practice','Practice',Guitar],['logbook','Logbook',BookOpen]].map(([v,label,Icon]) => (
          <button key={v} onClick={() => dispatch({type:'SET_VIEW', view:v})}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors
              ${view===v ? 'bg-amber-500 text-gray-950' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
            <Icon size={14}/>{label}
          </button>
        ))}
      </nav>
    </header>
  );
}

function ConfigPanel({ state, dispatch }) {
  const { key, scaleType, sequenceLength, displayMode, showVoicings, tempoEnabled, bpm, timeSignature, beatsPerChord, autoRounds, autoRoundsTarget } = state;
  const set = (k, v) => dispatch({ type: 'SET_CONFIG', key: k, value: v });

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 space-y-4">
      <h2 className="text-amber-400 font-semibold text-sm uppercase tracking-widest">Setup</h2>

      <div className="grid grid-cols-2 gap-3">
        {/* Key */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Key</label>
          <select value={key} onChange={e => set('key', e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white text-sm">
            <option value="Random">Random</option>
            {NOTES.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        {/* Scale */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Scale</label>
          <select value={scaleType} onChange={e => set('scaleType', e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white text-sm">
            {['Major','Minor','Random'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Sequence length */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Chords ({sequenceLength})</label>
          <input type="range" min={1} max={8} value={sequenceLength}
            onChange={e => set('sequenceLength', Number(e.target.value))}
            className="w-full accent-amber-500"/>
        </div>

        {/* Display mode */}
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Display</label>
          <select value={displayMode} onChange={e => set('displayMode', e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white text-sm">
            <option value="full">Full</option>
            <option value="numbers_only">Numbers Only</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>
      </div>

      {/* Voicings toggle */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={showVoicings} onChange={e => set('showVoicings', e.target.checked)}
          className="accent-amber-500"/>
        <span className="text-sm text-gray-300">Show Voicing Diagrams</span>
      </label>

      {/* Auto rounds */}
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={autoRounds} onChange={e => set('autoRounds', e.target.checked)}
            className="accent-amber-500"/>
          <span className="text-sm text-gray-300">Auto-advance rounds</span>
        </label>
        {autoRounds && (
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-xs text-gray-500">Rounds:</span>
            <input type="number" min={1} max={50} value={autoRoundsTarget}
              onChange={e => set('autoRoundsTarget', Math.max(1, Number(e.target.value)))}
              className="w-14 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm"/>
          </div>
        )}
      </div>

      {/* Tempo */}
      <div className="border border-gray-700 rounded-lg p-3 space-y-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={tempoEnabled} onChange={e => set('tempoEnabled', e.target.checked)}
            className="accent-amber-500"/>
          <span className="text-sm text-gray-300 font-medium">Tempo Mode</span>
        </label>
        {tempoEnabled && (
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">BPM</label>
              <input type="number" min={40} max={240} value={bpm}
                onChange={e => set('bpm', Math.max(40, Math.min(240, Number(e.target.value))))}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white text-sm"/>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Time Sig</label>
              <select value={timeSignature} onChange={e => set('timeSignature', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white text-sm">
                {['4/4','3/4','6/8'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Beats/Chord</label>
              <input type="number" min={1} max={8} value={beatsPerChord}
                onChange={e => set('beatsPerChord', Math.max(1, Math.min(8, Number(e.target.value))))}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white text-sm"/>
            </div>
          </div>
        )}
        {tempoEnabled && bpm >= 160 && beatsPerChord === 1 && (
          <p className="text-xs text-amber-400">Warning: extremely fast — {(60/bpm).toFixed(2)}s per chord</p>
        )}
      </div>

      <button onClick={() => dispatch({ type: 'START_SESSION' })}
        className="w-full bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors">
        <Play size={18}/> Start Practice
      </button>
    </div>
  );
}

function BeatIndicator({ currentBeat, beatsPerChord, countingIn }) {
  return (
    <div className="flex items-center gap-2">
      {countingIn && <span className="text-xs text-amber-400 animate-pulse">Count-in…</span>}
      <div className="flex gap-1.5">
        {Array.from({ length: beatsPerChord }, (_, i) => (
          <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all duration-75
            ${i === currentBeat % beatsPerChord
              ? (currentBeat % beatsPerChord === 0 ? 'bg-amber-400 scale-125' : 'bg-gray-300 scale-110')
              : 'bg-gray-700'}`}/>
        ))}
      </div>
    </div>
  );
}

function Timer({ startTime, pausedElapsed = 0, paused = false }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startTime) return;
    const calc = () => Math.max(0, Math.floor(((Date.now() - startTime) - pausedElapsed) / 1000));
    if (paused) { setElapsed(calc()); return; }
    setElapsed(calc());
    const id = setInterval(() => setElapsed(calc()), 1000);
    return () => clearInterval(id);
  }, [startTime, pausedElapsed, paused]);
  const m = String(Math.floor(elapsed/60)).padStart(2,'0');
  const s = String(elapsed%60).padStart(2,'0');
  return <span className="text-gray-400 text-sm font-mono">{m}:{s}</span>;
}

function ChordCard({ chord, result, revealed, isCurrent, degree, displayMode, showVoicings, peekActive, currentBeat, tempoEnabled, onViewVoicings }) {
  const [flash, setFlash] = useState(false);
  const prevBeat = useRef(-1);

  useEffect(() => {
    if (isCurrent && tempoEnabled && result === 'pending' && currentBeat !== prevBeat.current) {
      prevBeat.current = currentBeat;
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 120);
      return () => clearTimeout(t);
    }
  }, [currentBeat, isCurrent, tempoEnabled, result]);

  const showName = displayMode === 'full' || peekActive || revealed;
  const showDegree = displayMode !== 'hidden' || peekActive || revealed;
  const canViewVoicing = showVoicings && showName;

  const bgColor = result === 'correct' ? 'bg-green-900 border-green-600'
    : result === 'incorrect' ? 'bg-red-900 border-red-700'
    : isCurrent ? 'bg-gray-800 border-amber-500'
    : 'bg-gray-900 border-gray-700';

  return (
    <div
      onClick={canViewVoicing ? onViewVoicings : undefined}
      className={`relative border-2 rounded-xl p-3 flex flex-col items-center gap-1 w-full
        transition-all duration-150
        ${bgColor}
        ${isCurrent ? 'shadow-lg shadow-amber-900/40' : ''}
        ${flash ? 'scale-105 shadow-xl shadow-amber-500/50 border-amber-300' : ''}
        ${canViewVoicing ? 'cursor-pointer active:scale-95' : ''}`}>
      {showDegree && (
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Deg {degree}</span>
      )}
      {showName ? (
        <span className={`text-2xl font-bold leading-tight transition-colors duration-75 ${flash ? 'text-amber-200' : 'text-white'}`}>{chord.name}</span>
      ) : showDegree ? (
        <span className={`text-2xl font-bold leading-tight transition-colors duration-75 ${flash ? 'text-white' : 'text-amber-400'}`}>{degree}</span>
      ) : (
        <span className="text-2xl font-bold leading-tight text-gray-700">—</span>
      )}
      {isCurrent && result === 'pending' && (
        <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-amber-400 rounded-full animate-pulse"/>
      )}
      {result === 'correct' && <span className="text-green-400 text-sm">✓</span>}
      {result === 'incorrect' && <span className="text-red-400 text-sm">✗</span>}
      {canViewVoicing && (
        <span className="text-[9px] text-gray-600 mt-0.5">tap</span>
      )}
    </div>
  );
}

function VoicingPopup({ chord, onClose }) {
  const voicings = getVoicings(chord.root, chord.quality);
  return (
    <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50"
      onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-t-2xl sm:rounded-2xl p-5 w-full max-w-sm"
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-white text-lg">{chord.name} voicings</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
        </div>
        <div className="flex gap-4 justify-center flex-wrap">
          {voicings.map((v, i) => (
            <div key={i} className="bg-gray-800 rounded-xl p-3 flex flex-col items-center gap-1">
              <span className="text-xs text-gray-400 font-medium">{v.shape} shape</span>
              <ChordVoicingDiagram voicing={v}/>
            </div>
          ))}
        </div>
        <button onClick={onClose}
          className="mt-4 w-full py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm font-medium transition-colors">
          Close
        </button>
      </div>
    </div>
  );
}

function FrequencyVisualizer({ analyserRef }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    let raf;
    function draw() {
      const canvas = canvasRef.current;
      const analyser = analyserRef.current;
      if (!canvas || !analyser) { raf = requestAnimationFrame(draw); return; }
      const ctx = canvas.getContext('2d');
      const buf = new Float32Array(analyser.fftSize);
      analyser.getFloatTimeDomainData(buf);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const step = canvas.width / buf.length;
      buf.forEach((v, i) => {
        const x = i * step;
        const y = (1 - (v + 1) / 2) * canvas.height;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(raf);
  }, [analyserRef]);
  return <canvas ref={canvasRef} width={240} height={48} className="rounded border border-gray-700 w-full max-w-xs"/>;
}

function AudioDetector({ state, dispatch, analyserRef }) {
  const { micActive, manualMode, detectedNote, detectedFreq } = state;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
          <Volume2 size={14} className="text-amber-400"/> Audio
        </span>
        <div className="flex items-center gap-2">
          {detectedNote && (
            <span className="text-sm font-mono text-amber-300">{detectedNote}</span>
          )}
          <span className={`text-xs px-2 py-0.5 rounded ${micActive ? 'bg-green-900 text-green-300' : 'bg-gray-800 text-gray-500'}`}>
            {micActive ? 'Listening' : 'Off'}
          </span>
        </div>
      </div>
      {manualMode && (
        <p className="text-xs text-amber-400">Manual mode — mic unavailable</p>
      )}
      {micActive && analyserRef.current && (
        <FrequencyVisualizer analyserRef={analyserRef}/>
      )}
    </div>
  );
}

function ManualControls({ state, dispatch }) {
  const { currentChordIndex, chordResults, chords, roundState } = state;
  if (roundState !== 'playing') return null;
  const result = chordResults[currentChordIndex];
  if (result !== 'pending') return null;

  return (
    <div className="flex gap-3 justify-center">
      <button onClick={() => dispatch({ type: 'CHORD_RESULT', index: currentChordIndex, result: 'correct' })}
        className="flex items-center gap-1.5 px-5 py-2.5 bg-green-800 hover:bg-green-700 text-green-200 rounded-lg font-medium transition-colors">
        ✓ Got it
      </button>
      <button onClick={() => dispatch({ type: 'CHORD_RESULT', index: currentChordIndex, result: 'incorrect' })}
        className="flex items-center gap-1.5 px-5 py-2.5 bg-red-900 hover:bg-red-800 text-red-200 rounded-lg font-medium transition-colors">
        ✗ Missed
      </button>
    </div>
  );
}

function RoundComplete({ state, dispatch, onEndSession }) {
  const { roundsCompleted, totalChords, correctChords, autoRounds, autoRoundsTarget } = state;
  const acc = totalChords ? Math.round((correctChords / totalChords) * 100) : 0;
  const completedRounds = roundsCompleted + 1;
  const autoHasMore = autoRounds && completedRounds < autoRoundsTarget;

  useEffect(() => {
    if (!autoHasMore) return;
    const t = setTimeout(() => dispatch({ type: 'NEXT_ROUND' }), 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="bg-gray-900 border border-amber-700 rounded-xl p-6 text-center space-y-4">
      <h3 className="text-xl font-bold text-amber-400">
        Round {completedRounds}{autoRounds ? ` / ${autoRoundsTarget}` : ''} Complete!
      </h3>
      <div className="flex justify-center gap-8">
        <div><div className="text-3xl font-bold text-white">{acc}%</div><div className="text-xs text-gray-500">Accuracy</div></div>
        <div><div className="text-3xl font-bold text-white">{correctChords}/{totalChords}</div><div className="text-xs text-gray-500">Chords</div></div>
      </div>
      {autoHasMore && (
        <p className="text-sm text-amber-400 animate-pulse">Next round starting…</p>
      )}
      <div className="flex gap-3 justify-center">
        {(!autoRounds || !autoHasMore) && (
          <button onClick={() => dispatch({ type: 'NEXT_ROUND' })}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold rounded-lg transition-colors">
            <SkipForward size={16}/> Next Round
          </button>
        )}
        <button onClick={onEndSession}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
          <Square size={16}/> End Session
        </button>
      </div>
    </div>
  );
}

function EffectivenessModal({ onSave }) {
  const [rating, setRating] = useState(3);
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-sm w-full space-y-4">
        <h3 className="text-lg font-bold text-white">Rate this session</h3>
        <div className="flex gap-2 justify-center">
          {[1,2,3,4,5].map(n => (
            <button key={n} onClick={() => setRating(n)}>
              <Star size={28} fill={n <= rating ? '#f59e0b' : 'none'} className={n <= rating ? 'text-amber-400' : 'text-gray-600'}/>
            </button>
          ))}
        </div>
        <button onClick={() => onSave(rating)}
          className="w-full bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold py-2.5 rounded-lg transition-colors">
          Save Session
        </button>
      </div>
    </div>
  );
}

function SummaryStats({ logbook }) {
  const total = logbook.reduce((s, e) => s + (e.durationMinutes || 0), 0);
  const avgAcc = logbook.length ? Math.round(logbook.reduce((s,e) => s + (e.accuracy||0), 0) / logbook.length) : 0;

  // streak: consecutive calendar days
  const days = [...new Set(logbook.map(e => e.date?.slice(0,10)))].sort().reverse();
  let streak = 0;
  if (days.length) {
    const today = new Date().toISOString().slice(0,10);
    let check = today;
    for (const d of days) {
      if (d === check) { streak++; const dt = new Date(check); dt.setDate(dt.getDate()-1); check = dt.toISOString().slice(0,10); }
      else if (d < check) break;
    }
  }

  return (
    <div className="grid grid-cols-3 gap-3 mb-4">
      {[
        [Clock, `${Math.round(total)}m`, 'Total Time'],
        [Target, `${avgAcc}%`, 'Avg Accuracy'],
        [Flame, streak, 'Day Streak'],
      ].map(([Icon, val, label]) => (
        <div key={label} className="bg-gray-900 border border-gray-700 rounded-xl p-3 text-center">
          <Icon size={16} className="text-amber-400 mx-auto mb-1"/>
          <div className="text-xl font-bold text-white">{val}</div>
          <div className="text-xs text-gray-500">{label}</div>
        </div>
      ))}
    </div>
  );
}

function LogbookView({ logbook, dispatch }) {
  const handleDelete = async (id) => {
    try {
      await storage.delete(id);
      dispatch({ type: 'REMOVE_LOG_ENTRY', id });
    } catch {
      dispatch({ type: 'SET_STORAGE_ERROR', msg: 'Failed to delete entry' });
    }
  };

  if (logbook.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <Guitar size={48} className="mx-auto mb-3 text-gray-700"/>
        <p className="text-lg font-medium text-gray-400">No sessions yet</p>
        <p className="text-sm mt-1">Complete your first practice session to see it here.</p>
      </div>
    );
  }

  return (
    <div>
      <SummaryStats logbook={logbook}/>
      <div className="space-y-2">
        {logbook.map(entry => (
          <div key={entry.id} className="bg-gray-900 border border-gray-700 rounded-xl p-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-white">{entry.sessionKey} {entry.sessionScale}</span>
                <span className="text-xs bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">{entry.displayMode}</span>
                {entry.tempoEnabled && <span className="text-xs text-amber-400">{entry.bpm} BPM</span>}
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-400 flex-wrap">
                <span>{entry.date?.slice(0,10)}</span>
                <span>{Math.round(entry.durationMinutes)}m</span>
                <span>{entry.accuracy}% acc</span>
                <span>{entry.roundsCompleted} rounds</span>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {Array.from({length:5}, (_,i) => (
                <Star key={i} size={12} fill={i < entry.effectivenessRating ? '#f59e0b' : 'none'}
                  className={i < entry.effectivenessRating ? 'text-amber-400' : 'text-gray-700'}/>
              ))}
            </div>
            <button onClick={() => handleDelete(entry.id)}
              className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0">
              <Trash2 size={16}/>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [showEffectivenessModal, setShowEffectivenessModal] = useState(false);
  const [voicingPopupChord, setVoicingPopupChord] = useState(null);

  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const detectionRafRef = useRef(null);
  const metronomeRef = useRef(null);
  const nextClickTimeRef = useRef(0);
  const beatCountRef = useRef(0);
  const chordBeatCountRef = useRef(0);
  const countingInRef = useRef(false);
  const stableNoteRef = useRef(null);
  const stableCountRef = useRef(0);
  const currentChordIndexRef = useRef(0);

  // Load logbook on mount
  useEffect(() => {
    async function load() {
      try {
        const keys = await storage.list();
        const entries = (await Promise.all(keys.map(k => storage.get(k)))).filter(Boolean);
        entries.sort((a,b) => b.date?.localeCompare(a.date));
        dispatch({ type: 'SET_LOGBOOK', entries });
      } catch {
        // no entries yet
      }
    }
    load();
  }, []);

  // Mic setup
  const startMic = useCallback(async () => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') await ctx.resume();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 8192;
      source.connect(analyser);
      analyserRef.current = analyser;
      sourceRef.current = source;
      dispatch({ type: 'SET_MIC', active: true });
    } catch {
      dispatch({ type: 'SET_MANUAL_MODE', value: true });
    }
  }, []);

  const stopMic = useCallback(() => {
    if (sourceRef.current) { sourceRef.current.disconnect(); sourceRef.current = null; }
    analyserRef.current = null;
    cancelAnimationFrame(detectionRafRef.current);
    dispatch({ type: 'SET_MIC', active: false });
  }, []);

  // Keep refs in sync with state for use in RAF/interval callbacks
  const stateRef = useRef(state);
  stateRef.current = state;
  currentChordIndexRef.current = state.currentChordIndex;

  useEffect(() => {
    if (!state.micActive || state.roundState !== 'playing' || state.sessionPaused) {
      cancelAnimationFrame(detectionRafRef.current);
      return;
    }
    const timeBuf = new Float32Array(2048);
    const freqBuf = new Float32Array(4096); // fftSize/2 bins for 8192 fftSize
    let prevBeat = -1;
    const SCORE_THRESHOLD = 0.35;
    function loop() {
      detectionRafRef.current = requestAnimationFrame(loop);
      const analyser = analyserRef.current;
      if (!analyser) return;

      // RMS gate — skip silent frames
      analyser.getFloatTimeDomainData(timeBuf);
      if (getRmsFromTimeDomain(timeBuf) < 0.01) {
        stableNoteRef.current = null;
        return;
      }

      // Chroma from FFT
      analyser.getFloatFrequencyData(freqBuf);
      const sampleRate = audioCtxRef.current?.sampleRate || 44100;
      const chroma = computeChroma(freqBuf, sampleRate, analyser.fftSize);
      const topNote = topChromaNote(chroma);
      stableNoteRef.current = topNote;
      if (topNote) dispatch({ type: 'SET_DETECTED', note: topNote, freq: null });

      const s = stateRef.current;
      if (s.roundState !== 'playing') return;

      if (s.tempoEnabled) {
        // Beat-locked: sample chroma on each beat change
        const beat = s.currentBeat;
        if (beat !== prevBeat && beat >= 0) {
          prevBeat = beat;
          if (s.chordResults[s.currentChordIndex] === 'pending') {
            const expected = s.chords[s.currentChordIndex];
            if (expected) {
              const sc = scoreChord(chroma, expected.root, expected.quality);
              if (sc >= SCORE_THRESHOLD) {
                dispatch({ type: 'CHORD_RESULT', index: s.currentChordIndex, result: 'correct' });
              }
            }
          }
        }
      } else {
        // Free-time: stability across 5 frames, then score
        const prevNote = stableNoteRef.current;
        stableCountRef.current = topNote === prevNote ? stableCountRef.current + 1 : 1;
        if (stableCountRef.current >= 5 && s.chordResults[s.currentChordIndex] === 'pending') {
          const expected = s.chords[s.currentChordIndex];
          if (expected) {
            const sc = scoreChord(chroma, expected.root, expected.quality);
            if (sc >= SCORE_THRESHOLD) {
              dispatch({ type: 'CHORD_RESULT', index: s.currentChordIndex, result: 'correct' });
              stableCountRef.current = 0;
            }
          }
        }
      }
    }
    loop();
    return () => cancelAnimationFrame(detectionRafRef.current);
  }, [state.micActive, state.roundState, state.sessionPaused]);

  // Metronome
  const scheduleClick = useCallback((time, isDownbeat) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = isDownbeat ? 1000 : 800;
    gain.gain.setValueAtTime(0.15, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
    osc.start(time); osc.stop(time + 0.08);
  }, []);

  useEffect(() => {
    if (!state.tempoEnabled || !state.sessionActive || state.sessionPaused ||
        state.roundState === 'config' || state.roundState === 'session_end' || state.roundState === 'round_complete') {
      clearInterval(metronomeRef.current);
      return;
    }

    // Create AudioContext here if missing — metronome effect runs before session-start effect
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    const ctx = audioCtxRef.current;

    // Resume in case browser started it suspended (autoplay policy)
    ctx.resume().catch(() => {});

    const beatsPerBar = parseInt(state.timeSignature.split('/')[0]);
    const secondsPerBeat = 60 / state.bpm;
    nextClickTimeRef.current = 0; // 0 = uninitialized; set on first tick once ctx is running
    beatCountRef.current = 0;
    chordBeatCountRef.current = 0;
    countingInRef.current = state.roundState === 'countdown';

    const totalCountInBeats = beatsPerBar;

    metronomeRef.current = setInterval(() => {
      const ctx2 = audioCtxRef.current;
      if (!ctx2 || ctx2.state === 'suspended') return;

      // Lazy-init or catch up if ctx was suspended when we started
      if (nextClickTimeRef.current < ctx2.currentTime) {
        nextClickTimeRef.current = ctx2.currentTime + 0.05;
      }

      while (nextClickTimeRef.current < ctx2.currentTime + 0.1) {
        const beat = beatCountRef.current;
        const isDownbeat = beat % beatsPerBar === 0;
        scheduleClick(nextClickTimeRef.current, isDownbeat);

        // Visual beat update — RAF loop reads currentBeat change to do capture
        const t = nextClickTimeRef.current - ctx2.currentTime;
        setTimeout(() => dispatch({ type: 'SET_BEAT', beat: beat % beatsPerBar }), Math.max(0, t * 1000));

        if (countingInRef.current) {
          if (beat >= totalCountInBeats - 1) {
            countingInRef.current = false;
            const t2 = nextClickTimeRef.current - ctx2.currentTime + secondsPerBeat;
            setTimeout(() => dispatch({ type: 'END_COUNTDOWN' }), Math.max(0, t2 * 1000));
          }
        } else {
          chordBeatCountRef.current++;
          if (chordBeatCountRef.current >= state.beatsPerChord) {
            chordBeatCountRef.current = 0;
            const chordIdx = currentChordIndexRef.current;
            // Fire ADVANCE_CHORD one beat AFTER the last beat (= downbeat of next bar)
            const t3 = nextClickTimeRef.current + secondsPerBeat - ctx2.currentTime;
            setTimeout(() => dispatch({ type: 'ADVANCE_CHORD', index: chordIdx }), Math.max(0, t3 * 1000));
          }
        }

        beatCountRef.current++;
        nextClickTimeRef.current += secondsPerBeat;
      }
    }, 25);

    return () => clearInterval(metronomeRef.current);
  }, [state.tempoEnabled, state.sessionActive, state.sessionPaused, state.roundState, state.bpm, state.timeSignature, state.beatsPerChord, scheduleClick]);

  // Start mic / AudioContext when session starts
  useEffect(() => {
    if (state.sessionActive) {
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      if (!state.micActive && !state.manualMode) startMic();
    } else {
      stopMic();
      clearInterval(metronomeRef.current);
    }
  }, [state.sessionActive]);

  const handleEndSession = () => {
    setShowEffectivenessModal(true);
  };

  const handleSaveSession = async (rating) => {
    setShowEffectivenessModal(false);
    const elapsed = state.sessionStartTime ? (Date.now() - state.sessionStartTime) / 60000 : 0;
    const acc = state.totalChords ? Math.round((state.correctChords / state.totalChords) * 100) : 0;
    const entry = {
      id: `session_${Date.now()}`,
      date: new Date().toISOString(),
      durationMinutes: parseFloat(elapsed.toFixed(2)),
      sessionKey: state.sessionKey,
      sessionScale: state.sessionScale,
      displayMode: state.displayMode,
      randomKey: state.key === 'Random',
      tempoEnabled: state.tempoEnabled,
      bpm: state.tempoEnabled ? state.bpm : null,
      beatsPerChord: state.tempoEnabled ? state.beatsPerChord : null,
      roundsCompleted: state.roundsCompleted,
      totalChords: state.totalChords,
      correctChords: state.correctChords,
      accuracy: acc,
      effectivenessRating: rating,
    };
    try {
      await storage.set(entry.id, entry);
      dispatch({ type: 'ADD_LOG_ENTRY', entry });
    } catch {
      dispatch({ type: 'SET_STORAGE_ERROR', msg: 'Failed to save session' });
    }
    dispatch({ type: 'END_SESSION' });
  };

  const { sessionActive, sessionKey, sessionScale, chords, chordResults, revealedChords,
    currentChordIndex, roundState, displayMode, showVoicings, peekActive,
    tempoEnabled, beatsPerChord, currentBeat, countingIn, manualMode, view, storageError,
    sessionPaused, pausedElapsed } = state;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Header view={view} dispatch={dispatch}/>

      {storageError && (
        <div className="bg-red-900/50 border-b border-red-700 px-4 py-2 text-sm text-red-300 flex justify-between">
          <span>{storageError}</span>
          <button onClick={() => dispatch({ type: 'SET_STORAGE_ERROR', msg: null })} className="text-red-400 hover:text-white">×</button>
        </div>
      )}

      <main className={`max-w-2xl mx-auto px-4 py-6 space-y-4 ${sessionActive ? 'pb-24' : ''}`}>
        {view === 'logbook' ? (
          <LogbookView logbook={state.logbook} dispatch={dispatch}/>
        ) : (
          <>
            {!sessionActive ? (
              <ConfigPanel state={state} dispatch={dispatch}/>
            ) : (
              <>
                {/* Session header */}
                <div className="flex items-center justify-between bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div>
                      <span className="font-bold text-xl text-amber-400">{sessionKey}</span>
                      <span className="text-gray-400 ml-2">{sessionScale}</span>
                    </div>
                    {tempoEnabled && !sessionPaused && (
                      <BeatIndicator currentBeat={currentBeat} beatsPerChord={beatsPerChord} countingIn={countingIn}/>
                    )}
                  </div>
                  <Timer startTime={state.sessionStartTime} pausedElapsed={pausedElapsed} paused={sessionPaused}/>
                </div>

                {/* Paused overlay */}
                {sessionPaused && (
                  <div className="bg-gray-900 border border-amber-700/50 rounded-xl p-8 text-center space-y-3">
                    <Pause size={36} className="mx-auto text-amber-400"/>
                    <p className="text-lg font-bold text-white">Session Paused</p>
                    <button onClick={() => dispatch({ type: 'RESUME_SESSION' })}
                      className="flex items-center gap-2 mx-auto px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold rounded-lg transition-colors">
                      <Play size={16}/> Resume
                    </button>
                  </div>
                )}

                {/* Chord grid — 3 cols mobile, 4 cols sm+ */}
                {(roundState === 'playing' || roundState === 'round_complete' || roundState === 'countdown') && !sessionPaused && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {chords.map((chord, i) => (
                      <ChordCard key={i}
                        chord={chord}
                        result={chordResults[i]}
                        revealed={revealedChords[i]}
                        isCurrent={i === currentChordIndex && roundState === 'playing'}
                        degree={state.sequence[i]}
                        displayMode={displayMode}
                        showVoicings={showVoicings}
                        peekActive={peekActive}
                        currentBeat={currentBeat}
                        tempoEnabled={tempoEnabled}
                        onViewVoicings={() => setVoicingPopupChord(chord)}/>
                    ))}
                  </div>
                )}

                {/* Quick peek */}
                {(displayMode === 'numbers_only' || displayMode === 'hidden') && roundState === 'playing' && !sessionPaused && (
                  <div className="flex justify-center">
                    <button
                      onMouseDown={() => dispatch({ type: 'SET_PEEK', value: true })}
                      onMouseUp={() => dispatch({ type: 'SET_PEEK', value: false })}
                      onTouchStart={() => dispatch({ type: 'SET_PEEK', value: true })}
                      onTouchEnd={() => dispatch({ type: 'SET_PEEK', value: false })}
                      className="flex items-center gap-1.5 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm select-none">
                      <Eye size={14}/> Hold to Peek
                    </button>
                  </div>
                )}

                {/* Audio */}
                {roundState === 'playing' && !sessionPaused && (
                  <AudioDetector state={state} dispatch={dispatch} analyserRef={analyserRef}/>
                )}

                {/* Manual controls */}
                {(manualMode || !state.micActive) && roundState === 'playing' && !sessionPaused && (
                  <ManualControls state={state} dispatch={dispatch}/>
                )}

                {/* Round complete */}
                {roundState === 'round_complete' && (
                  <RoundComplete state={state} dispatch={dispatch} onEndSession={handleEndSession}/>
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* Fixed bottom session controls */}
      {sessionActive && roundState === 'playing' && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-gray-950/95 backdrop-blur border-t border-gray-800 px-4 py-3 flex items-center justify-between gap-3">
          {sessionPaused ? (
            <button onClick={() => dispatch({ type: 'RESUME_SESSION' })}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold rounded-lg text-sm transition-colors">
              <Play size={15}/> Resume
            </button>
          ) : (
            <button onClick={() => dispatch({ type: 'PAUSE_SESSION' })}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors">
              <Pause size={15}/> Pause
            </button>
          )}
          <button onClick={handleEndSession}
            className="flex items-center gap-2 px-4 py-2 bg-red-900/80 hover:bg-red-800 text-red-200 rounded-lg text-sm font-medium transition-colors">
            <Square size={14}/> End Session
          </button>
        </div>
      )}

      {showEffectivenessModal && <EffectivenessModal onSave={handleSaveSession}/>}
      {voicingPopupChord && <VoicingPopup chord={voicingPopupChord} onClose={() => setVoicingPopupChord(null)}/>}
    </div>
  );
}
