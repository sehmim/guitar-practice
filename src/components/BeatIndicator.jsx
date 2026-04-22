export default function BeatIndicator({ currentBeat, beatsPerChord, countingIn }) {
  return (
    <div className="flex items-center gap-2">
      {countingIn && <span className="text-xs text-[#FFB900] animate-pulse">Count-in…</span>}
      <div className="flex gap-1.5">
        {Array.from({ length: beatsPerChord }, (_, i) => (
          <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all duration-75
            ${i === currentBeat % beatsPerChord
              ? (currentBeat % beatsPerChord === 0 ? 'bg-[#FFC820] scale-125' : 'bg-[#D4D4D4] scale-110')
              : 'bg-[#606060]'}`}/>
        ))}
      </div>
    </div>
  );
}
