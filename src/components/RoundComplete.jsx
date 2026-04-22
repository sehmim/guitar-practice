import { useEffect } from 'react';
import { SkipForward, Square } from 'lucide-react';

export default function RoundComplete({ state, dispatch, onEndSession }) {
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
    <div className="bg-[#3C3C3C] border border-[#CC9900] rounded-xl p-6 text-center space-y-4">
      <h3 className="text-xl font-bold text-[#FFB900]">
        Round {completedRounds}{autoRounds ? ` / ${autoRoundsTarget}` : ''} Complete!
      </h3>
      <div className="flex justify-center gap-8">
        <div><div className="text-3xl font-bold text-white">{acc}%</div><div className="text-xs text-[#7A7A7A]">Accuracy</div></div>
        <div><div className="text-3xl font-bold text-white">{correctChords}/{totalChords}</div><div className="text-xs text-[#7A7A7A]">Chords</div></div>
      </div>
      {autoHasMore && (
        <p className="text-sm text-[#FFB900] animate-pulse">Next round starting…</p>
      )}
      <div className="flex gap-3 justify-center">
        {(!autoRounds || !autoHasMore) && (
          <button onClick={() => dispatch({ type: 'NEXT_ROUND' })}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-[#FFB900] hover:bg-[#FFC820] text-gray-950 font-bold rounded-lg transition-colors">
            <SkipForward size={16}/> Next Round
          </button>
        )}
        <button onClick={onEndSession}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-[#606060] hover:bg-[#6A6A6A] text-white rounded-lg transition-colors">
          <Square size={16}/> End Session
        </button>
      </div>
    </div>
  );
}
