import { Guitar, Trash2, Star } from 'lucide-react';
import storage from '../lib/storage';
import SummaryStats from '../components/SummaryStats';

export default function LogbookView({ logbook, dispatch }) {
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
      <div className="text-center py-16 text-[#7A7A7A]">
        <Guitar size={48} className="mx-auto mb-3 text-[#606060]"/>
        <p className="text-lg font-medium text-[#A3A3A3]">No sessions yet</p>
        <p className="text-sm mt-1">Complete your first practice session to see it here.</p>
      </div>
    );
  }

  return (
    <div>
      <SummaryStats logbook={logbook}/>
      <div className="space-y-2">
        {logbook.map(entry => (
          <div key={entry.id} className="bg-[#3C3C3C] border border-[#666666] rounded-xl p-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-white">{entry.sessionKey} {entry.sessionScale}</span>
                <span className="text-xs bg-[#505050] text-[#A3A3A3] px-1.5 py-0.5 rounded">{entry.displayMode}</span>
                {entry.tempoEnabled && <span className="text-xs text-[#FFB900]">{entry.bpm} BPM</span>}
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-[#A3A3A3] flex-wrap">
                <span>{entry.date?.slice(0,10)}</span>
                <span>{Math.round(entry.durationMinutes)}m</span>
                <span>{entry.accuracy}% acc</span>
                <span>{entry.roundsCompleted} rounds</span>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {Array.from({length:5}, (_,i) => (
                <Star key={i} size={12} fill={i < entry.effectivenessRating ? '#FFB900' : 'none'}
                  className={i < entry.effectivenessRating ? 'text-[#FFB900]' : 'text-[#606060]'}/>
              ))}
            </div>
            <button onClick={() => handleDelete(entry.id)}
              className="text-[#666666] hover:text-[#FF4444] transition-colors flex-shrink-0">
              <Trash2 size={16}/>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
