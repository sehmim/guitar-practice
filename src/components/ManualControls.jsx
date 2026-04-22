export default function ManualControls({ state, dispatch }) {
  const { currentChordIndex, chordResults, roundState } = state;
  if (roundState !== 'playing') return null;
  const result = chordResults[currentChordIndex];
  if (result !== 'pending') return null;

  return (
    <div className="flex gap-3 justify-center">
      <button onClick={() => dispatch({ type: 'CHORD_RESULT', index: currentChordIndex, result: 'correct' })}
        className="flex items-center gap-1.5 px-5 py-2.5 bg-[#1A4A1A] hover:bg-[#005A00] text-[#66EE66] rounded-lg font-medium transition-colors">
        ✓ Got it
      </button>
      <button onClick={() => dispatch({ type: 'CHORD_RESULT', index: currentChordIndex, result: 'incorrect' })}
        className="flex items-center gap-1.5 px-5 py-2.5 bg-[#3A1A1A] hover:bg-[#5A1A1A] text-[#FF9999] rounded-lg font-medium transition-colors">
        ✗ Missed
      </button>
    </div>
  );
}
