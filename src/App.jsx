import { useReducer, useRef, useEffect, useCallback } from "react";
import { reducer, initialState } from "./state/reducer";
import { computeChroma, scoreChord, getRmsFromTimeDomain, topChromaNote } from "./lib/pitchDetection";
import storage from "./lib/storage";
import Header from "./components/Header";
import PracticeView from "./views/PracticeView";
import ProgressionsView from "./views/ProgressionsView";
import LogbookView from "./views/LogbookView";

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const detectionRafRef = useRef(null);
  const metronomeRef = useRef(null);
  const metronomeAudibleRef = useRef(true);
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

  // Keep refs in sync with state for use in RAF/interval callbacks
  const stateRef = useRef(state);
  stateRef.current = state;
  currentChordIndexRef.current = state.currentChordIndex;
  metronomeAudibleRef.current = state.metronomeAudible;

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

  // Pitch detection loop
  useEffect(() => {
    if (!state.micActive || state.roundState !== 'playing' || state.sessionPaused) {
      cancelAnimationFrame(detectionRafRef.current);
      return;
    }
    const timeBuf = new Float32Array(2048);
    const freqBuf = new Float32Array(4096);
    let prevBeat = -1;
    const SCORE_THRESHOLD = 0.35;

    function loop() {
      detectionRafRef.current = requestAnimationFrame(loop);
      const analyser = analyserRef.current;
      if (!analyser) return;

      analyser.getFloatTimeDomainData(timeBuf);
      if (getRmsFromTimeDomain(timeBuf) < 0.01) {
        stableNoteRef.current = null;
        return;
      }

      analyser.getFloatFrequencyData(freqBuf);
      const sampleRate = audioCtxRef.current?.sampleRate || 44100;
      const chroma = computeChroma(freqBuf, sampleRate, analyser.fftSize);
      const topNote = topChromaNote(chroma);
      stableNoteRef.current = topNote;
      if (topNote) dispatch({ type: 'SET_DETECTED', note: topNote, freq: null });

      const s = stateRef.current;
      if (s.roundState !== 'playing') return;

      if (s.tempoEnabled) {
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
    if (!ctx || !metronomeAudibleRef.current) return;
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

    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    const ctx = audioCtxRef.current;
    ctx.resume().catch(() => {});

    const beatsPerBar = parseInt(state.timeSignature.split('/')[0]);
    const secondsPerBeat = 60 / state.bpm;
    nextClickTimeRef.current = 0;
    beatCountRef.current = 0;
    chordBeatCountRef.current = 0;
    countingInRef.current = state.roundState === 'countdown';

    const totalCountInBeats = beatsPerBar;

    metronomeRef.current = setInterval(() => {
      const ctx2 = audioCtxRef.current;
      if (!ctx2 || ctx2.state === 'suspended') return;

      if (nextClickTimeRef.current < ctx2.currentTime) {
        nextClickTimeRef.current = ctx2.currentTime + 0.05;
      }

      while (nextClickTimeRef.current < ctx2.currentTime + 0.1) {
        const beat = beatCountRef.current;
        const isDownbeat = beat % beatsPerBar === 0;
        scheduleClick(nextClickTimeRef.current, isDownbeat);

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

  const { view, storageError, logbook, sessionActive } = state;

  return (
    <div className="min-h-screen bg-[#1E1E1E] text-white">
      <Header view={view} dispatch={dispatch}/>

      {storageError && (
        <div className="bg-[#3A1A1A]/50 border-b border-[#CC0000] px-4 py-2 text-sm text-[#FF7777] flex justify-between">
          <span>{storageError}</span>
          <button onClick={() => dispatch({ type: 'SET_STORAGE_ERROR', msg: null })} className="text-[#FF4444] hover:text-white">×</button>
        </div>
      )}

      <main className={`max-w-2xl mx-auto px-4 py-6 space-y-4 ${sessionActive ? 'pb-24' : ''}`}>
        {view === 'logbook' ? (
          <LogbookView logbook={logbook} dispatch={dispatch}/>
        ) : view === 'progressions' ? (
          <ProgressionsView state={state} dispatch={dispatch}/>
        ) : (
          <PracticeView state={state} dispatch={dispatch} analyserRef={analyserRef}/>
        )}
      </main>
    </div>
  );
}
