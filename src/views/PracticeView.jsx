import { useState } from 'react';
import { Play, Pause, Eye, Square, Volume2, VolumeX } from 'lucide-react';
import { NOTES } from '../lib/musicTheory';
import storage from '../lib/storage';
import BeatIndicator from '../components/BeatIndicator';
import Timer from '../components/Timer';
import ChordCard from '../components/ChordCard';
import VoicingPopup from '../components/VoicingPopup';
import AudioDetector from '../components/AudioDetector';
import ManualControls from '../components/ManualControls';
import RoundComplete from '../components/RoundComplete';
import EffectivenessModal from '../components/EffectivenessModal';

function ConfigPanel({ state, dispatch }) {
  const { key, scaleType, sequenceLength, displayMode, showVoicings, bpm, timeSignature, beatsPerChord, autoRounds, autoRoundsTarget } = state;
  const set = (k, v) => dispatch({ type: 'SET_CONFIG', key: k, value: v });

  return (
    <div className="bg-[#3C3C3C] border border-[#666666] rounded-xl p-5 space-y-4">
      <h2 className="text-[#FFB900] font-semibold text-sm uppercase tracking-widest">Setup</h2>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-[#7A7A7A] mb-1 block">Key</label>
          <select value={key} onChange={e => set('key', e.target.value)}
            className="w-full bg-[#505050] border border-[#666666] rounded px-2 py-1.5 text-white text-sm">
            <option value="Random">Random</option>
            {NOTES.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs text-[#7A7A7A] mb-1 block">Scale</label>
          <select value={scaleType} onChange={e => set('scaleType', e.target.value)}
            className="w-full bg-[#505050] border border-[#666666] rounded px-2 py-1.5 text-white text-sm">
            {['Major','Minor','Random'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs text-[#7A7A7A] mb-1 block">Chords ({sequenceLength})</label>
          <input type="range" min={1} max={8} value={sequenceLength}
            onChange={e => set('sequenceLength', Number(e.target.value))}
            className="w-full accent-[#FFB900]"/>
        </div>

        <div>
          <label className="text-xs text-[#7A7A7A] mb-1 block">Display</label>
          <select value={displayMode} onChange={e => set('displayMode', e.target.value)}
            className="w-full bg-[#505050] border border-[#666666] rounded px-2 py-1.5 text-white text-sm">
            <option value="full">Full</option>
            <option value="numbers_only">Numbers Only</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={showVoicings} onChange={e => set('showVoicings', e.target.checked)}
          className="accent-[#FFB900]"/>
        <span className="text-sm text-[#D4D4D4]">Show Voicing Diagrams</span>
      </label>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={autoRounds} onChange={e => set('autoRounds', e.target.checked)}
            className="accent-[#FFB900]"/>
          <span className="text-sm text-[#D4D4D4]">Auto-advance rounds</span>
        </label>
        {autoRounds && (
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-xs text-[#7A7A7A]">Rounds:</span>
            <input type="number" min={1} max={50} value={autoRoundsTarget}
              onChange={e => set('autoRoundsTarget', Math.max(1, Number(e.target.value)))}
              className="w-14 bg-[#505050] border border-[#666666] rounded px-2 py-1 text-white text-sm"/>
          </div>
        )}
      </div>

      <div className="border border-[#666666] rounded-lg p-3 space-y-3">
        <p className="text-sm text-[#D4D4D4] font-medium flex items-center gap-2">
          <Volume2 size={14} className="text-[#FFB900]"/> Tempo
        </p>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-xs text-[#7A7A7A] mb-1 block">BPM</label>
            <input type="number" min={40} max={240} value={bpm}
              onChange={e => set('bpm', Math.max(40, Math.min(240, Number(e.target.value))))}
              className="w-full bg-[#505050] border border-[#666666] rounded px-2 py-1.5 text-white text-sm"/>
          </div>
          <div>
            <label className="text-xs text-[#7A7A7A] mb-1 block">Time Sig</label>
            <select value={timeSignature} onChange={e => set('timeSignature', e.target.value)}
              className="w-full bg-[#505050] border border-[#666666] rounded px-2 py-1.5 text-white text-sm">
              {['4/4','3/4','6/8'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-[#7A7A7A] mb-1 block">Beats/Chord</label>
            <input type="number" min={1} max={8} value={beatsPerChord}
              onChange={e => set('beatsPerChord', Math.max(1, Math.min(8, Number(e.target.value))))}
              className="w-full bg-[#505050] border border-[#666666] rounded px-2 py-1.5 text-white text-sm"/>
          </div>
        </div>
        {bpm >= 160 && beatsPerChord === 1 && (
          <p className="text-xs text-[#FFB900]">Warning: extremely fast — {(60/bpm).toFixed(2)}s per chord</p>
        )}
      </div>

      <button onClick={() => dispatch({ type: 'START_SESSION' })}
        className="w-full bg-[#FFB900] hover:bg-[#FFC820] text-gray-950 font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors">
        <Play size={18}/> Start Practice
      </button>
    </div>
  );
}

export default function PracticeView({ state, dispatch, analyserRef }) {
  const [voicingPopupChord, setVoicingPopupChord] = useState(null);
  const [showEffectivenessModal, setShowEffectivenessModal] = useState(false);

  const {
    sessionActive, sessionKey, sessionScale, chords, chordResults, revealedChords,
    currentChordIndex, roundState, displayMode, showVoicings, peekActive,
    tempoEnabled, beatsPerChord, currentBeat, countingIn, manualMode,
    sessionPaused, pausedElapsed, metronomeAudible,
  } = state;

  const handleEndSession = () => setShowEffectivenessModal(true);

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

  return (
    <>
      {!sessionActive ? (
        <ConfigPanel state={state} dispatch={dispatch}/>
      ) : (
        <>
          {/* Session header */}
          <div className="flex items-center justify-between bg-[#3C3C3C] border border-[#666666] rounded-xl px-4 py-3 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div>
                <span className="font-bold text-xl text-[#FFB900]">{sessionKey}</span>
                <span className="text-[#A3A3A3] ml-2">{sessionScale}</span>
              </div>
              {tempoEnabled && !sessionPaused && (
                <BeatIndicator currentBeat={currentBeat} beatsPerChord={beatsPerChord} countingIn={countingIn}/>
              )}
            </div>
            <Timer startTime={state.sessionStartTime} pausedElapsed={pausedElapsed} paused={sessionPaused}/>
          </div>

          {/* Paused overlay */}
          {sessionPaused && (
            <div className="bg-[#3C3C3C] border border-[#CC9900]/50 rounded-xl p-8 text-center space-y-3">
              <Pause size={36} className="mx-auto text-[#FFB900]"/>
              <p className="text-lg font-bold text-white">Session Paused</p>
              <button onClick={() => dispatch({ type: 'RESUME_SESSION' })}
                className="flex items-center gap-2 mx-auto px-6 py-2.5 bg-[#FFB900] hover:bg-[#FFC820] text-gray-950 font-bold rounded-lg transition-colors">
                <Play size={16}/> Resume
              </button>
            </div>
          )}

          {/* Chord grid */}
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
                className="flex items-center gap-1.5 px-4 py-2 bg-[#505050] hover:bg-[#606060] text-[#D4D4D4] rounded-lg text-sm select-none">
                <Eye size={14}/> Hold to Peek
              </button>
            </div>
          )}

          {/* Audio detector */}
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

      {/* Fixed bottom session controls */}
      {sessionActive && roundState === 'playing' && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#1E1E1E]/95 backdrop-blur border-t border-[#555555] px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {sessionPaused ? (
              <button onClick={() => dispatch({ type: 'RESUME_SESSION' })}
                className="flex items-center gap-2 px-4 py-2 bg-[#FFB900] hover:bg-[#FFC820] text-gray-950 font-bold rounded-lg text-sm transition-colors">
                <Play size={15}/> Resume
              </button>
            ) : (
              <button onClick={() => dispatch({ type: 'PAUSE_SESSION' })}
                className="flex items-center gap-2 px-4 py-2 bg-[#505050] hover:bg-[#606060] text-white rounded-lg text-sm transition-colors">
                <Pause size={15}/> Pause
              </button>
            )}
            <button onClick={() => dispatch({ type: 'TOGGLE_METRONOME' })}
              title={metronomeAudible ? 'Mute metronome' : 'Unmute metronome'}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors
                ${metronomeAudible
                  ? 'bg-[#505050] hover:bg-[#606060] text-[#A3A3A3]'
                  : 'bg-[#3C3C3C] border border-[#CC9900] text-[#FFB900]'}`}>
              {metronomeAudible ? <Volume2 size={15}/> : <VolumeX size={15}/>}
            </button>
          </div>
          <button onClick={handleEndSession}
            className="flex items-center gap-2 px-4 py-2 bg-[#3A1A1A]/80 hover:bg-[#5A1A1A] text-[#FF9999] rounded-lg text-sm font-medium transition-colors">
            <Square size={14}/> End Session
          </button>
        </div>
      )}

      {showEffectivenessModal && <EffectivenessModal onSave={handleSaveSession}/>}
      {voicingPopupChord && <VoicingPopup chord={voicingPopupChord} onClose={() => setVoicingPopupChord(null)}/>}
    </>
  );
}
