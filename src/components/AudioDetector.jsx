import { Volume2 } from 'lucide-react';
import FrequencyVisualizer from './FrequencyVisualizer';

export default function AudioDetector({ state, dispatch, analyserRef }) {
  const { micActive, manualMode, detectedNote } = state;
  return (
    <div className="bg-[#3C3C3C] border border-[#666666] rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#D4D4D4] flex items-center gap-1.5">
          <Volume2 size={14} className="text-[#FFB900]"/> Audio
        </span>
        <div className="flex items-center gap-2">
          {detectedNote && (
            <span className="text-sm font-mono text-[#FFC840]">{detectedNote}</span>
          )}
          <span className={`text-xs px-2 py-0.5 rounded ${micActive ? 'bg-[#1A3A1A] text-[#00CC00]' : 'bg-[#505050] text-[#7A7A7A]'}`}>
            {micActive ? 'Listening' : 'Off'}
          </span>
        </div>
      </div>
      {manualMode && (
        <p className="text-xs text-[#FFB900]">Manual mode — mic unavailable</p>
      )}
      {micActive && analyserRef.current && (
        <FrequencyVisualizer analyserRef={analyserRef}/>
      )}
    </div>
  );
}
