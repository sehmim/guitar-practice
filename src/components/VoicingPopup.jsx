import ChordVoicingDiagram from './ChordVoicingDiagram';
import { getVoicings } from '../lib/voicings';

export default function VoicingPopup({ chord, onClose }) {
  const voicings = getVoicings(chord.root, chord.quality);
  return (
    <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50"
      onClick={onClose}>
      <div className="bg-[#3C3C3C] border border-[#666666] rounded-t-2xl sm:rounded-2xl p-5 w-full max-w-sm"
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-white text-lg">{chord.name} voicings</h3>
          <button onClick={onClose} className="text-[#A3A3A3] hover:text-white text-xl leading-none">✕</button>
        </div>
        <div className="flex gap-4 justify-center flex-wrap">
          {voicings.map((v, i) => (
            <div key={i} className="bg-[#505050] rounded-xl p-3 flex flex-col items-center gap-1">
              <span className="text-xs text-[#A3A3A3] font-medium">{v.shape} shape</span>
              <ChordVoicingDiagram voicing={v}/>
            </div>
          ))}
        </div>
        <button onClick={onClose}
          className="mt-4 w-full py-2.5 bg-[#505050] hover:bg-[#606060] text-[#D4D4D4] rounded-xl text-sm font-medium transition-colors">
          Close
        </button>
      </div>
    </div>
  );
}
