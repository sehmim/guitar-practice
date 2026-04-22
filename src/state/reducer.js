import { generateSequence, getChordAtDegree, resolveKey, resolveScale } from '../lib/musicTheory';

export const initialState = {
  view: 'practice',
  key: 'C',
  scaleType: 'Major',
  sequenceLength: 4,
  displayMode: 'numbers_only',
  showVoicings: true,
  tempoEnabled: true,
  metronomeAudible: true,
  bpm: 80,
  timeSignature: '4/4',
  beatsPerChord: 4,
  autoRounds: true,
  autoRoundsTarget: 10,

  customSequence: null,
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

export function buildRound(state, key, scale) {
  const seq = state.customSequence || generateSequence(state.sequenceLength);
  const chords = seq.map(d => getChordAtDegree(key, scale, d));
  return {
    sequence: seq,
    chords,
    currentChordIndex: 0,
    chordResults: Array(seq.length).fill('pending'),
    revealedChords: Array(seq.length).fill(false),
  };
}

export function reducer(state, action) {
  switch (action.type) {
    case 'SET_VIEW': return { ...state, view: action.view };
    case 'SET_CONFIG': return { ...state, [action.key]: action.value };
    case 'TOGGLE_METRONOME': return { ...state, metronomeAudible: !state.metronomeAudible };
    case 'SET_CUSTOM_SEQUENCE': return { ...state, customSequence: action.sequence, scaleType: action.scaleType || state.scaleType };

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
      const { index, result } = action;
      if (state.chordResults[index] !== 'pending') return state;
      const newResults = [...state.chordResults];
      const newRevealed = [...state.revealedChords];
      newResults[index] = result;
      newRevealed[index] = true;

      if (state.tempoEnabled) {
        return { ...state, chordResults: newResults, revealedChords: newRevealed, detectedNote: null };
      } else {
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
      customSequence: null,
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
