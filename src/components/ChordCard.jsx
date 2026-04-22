import { useState, useEffect, useRef } from 'react';

export default function ChordCard({ chord, result, revealed, isCurrent, degree, displayMode, showVoicings, peekActive, currentBeat, tempoEnabled, onViewVoicings }) {
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

  const bgColor = result === 'correct' ? 'bg-[#1A3A1A] border-[#008000]'
    : result === 'incorrect' ? 'bg-[#3A1A1A] border-[#CC0000]'
    : isCurrent ? 'bg-[#505050] border-[#FFB900]'
    : 'bg-[#3C3C3C] border-[#666666]';

  return (
    <div
      onClick={canViewVoicing ? onViewVoicings : undefined}
      className={`relative border-2 rounded-xl p-3 flex flex-col items-center gap-1 w-full
        transition-all duration-150
        ${bgColor}
        ${isCurrent ? 'shadow-lg shadow-[#4A3000]/40' : ''}
        ${flash ? 'scale-105 shadow-xl shadow-[#FFB900]/50 border-[#FFD060]' : ''}
        ${canViewVoicing ? 'cursor-pointer active:scale-95' : ''}`}>
      {showDegree && (
        <span className="text-[10px] font-bold text-[#7A7A7A] uppercase tracking-wide">Deg {degree}</span>
      )}
      {showName ? (
        <span className={`text-2xl font-bold leading-tight transition-colors duration-75 ${flash ? 'text-[#FFD060]' : 'text-white'}`}>{chord.name}</span>
      ) : showDegree ? (
        <span className={`text-2xl font-bold leading-tight transition-colors duration-75 ${flash ? 'text-white' : 'text-[#FFB900]'}`}>{degree}</span>
      ) : (
        <span className="text-2xl font-bold leading-tight text-[#606060]">—</span>
      )}
      {isCurrent && result === 'pending' && (
        <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-[#FFC820] rounded-full animate-pulse"/>
      )}
      {result === 'correct' && <span className="text-[#00B800] text-sm">✓</span>}
      {result === 'incorrect' && <span className="text-[#FF4444] text-sm">✗</span>}
      {canViewVoicing && (
        <span className="text-[9px] text-[#666666] mt-0.5">tap</span>
      )}
    </div>
  );
}
