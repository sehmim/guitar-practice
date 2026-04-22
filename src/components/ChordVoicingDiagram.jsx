export default function ChordVoicingDiagram({ voicing }) {
  const { frets, baseFret, barreFret, rootString } = voicing;
  const W = 90, H = 110;
  const LEFT = 18, TOP = 22;
  const strGap = 11, fretGap = 16, numFrets = 5;
  const strings = 6;

  const validFrets = frets.filter(f => f >= 0);
  if (validFrets.length === 0) return null;

  const minF = Math.min(...validFrets);
  const displayBase = minF === 0 ? 0 : minF;
  const showNut = displayBase === 0;

  return (
    <svg width={W} height={H} className="flex-shrink-0">
      {displayBase > 0 && (
        <text x={W - 4} y={TOP + fretGap * 0.5 + 4} textAnchor="end" fontSize={9} fill="#A3A3A3">{displayBase}fr</text>
      )}

      {showNut && (
        <rect x={LEFT} y={TOP - 3} width={(strings-1)*strGap} height={4} fill="#D4D4D4" rx={1}/>
      )}

      {Array.from({length: numFrets+1}, (_,i) => (
        <line key={i} x1={LEFT} y1={TOP + i*fretGap} x2={LEFT+(strings-1)*strGap} y2={TOP+i*fretGap}
          stroke="#555555" strokeWidth={i===0 && !showNut ? 1 : 0.5}/>
      ))}

      {Array.from({length: strings}, (_,i) => (
        <line key={i} x1={LEFT+i*strGap} y1={TOP} x2={LEFT+i*strGap} y2={TOP+numFrets*fretGap}
          stroke="#666666" strokeWidth={0.5}/>
      ))}

      {barreFret !== null && (() => {
        const bY = TOP + (barreFret - displayBase - 0.5) * fretGap;
        return (
          <rect x={LEFT} y={bY - 5} width={(strings-1)*strGap} height={10}
            fill="#808080" rx={5} opacity={0.8}/>
        );
      })()}

      {frets.map((f, i) => {
        const x = LEFT + (5-i) * strGap;
        if (f === -1) return <text key={i} x={x} y={TOP-6} textAnchor="middle" fontSize={9} fill="#FF4444">×</text>;
        if (f === 0) return <text key={i} x={x} y={TOP-6} textAnchor="middle" fontSize={9} fill="#A3A3A3">○</text>;
        return null;
      })}

      {frets.map((f, i) => {
        if (f <= 0) return null;
        const relF = f - displayBase;
        if (relF < 1 || relF > numFrets) return null;
        const x = LEFT + (5-i) * strGap;
        const y = TOP + (relF - 0.5) * fretGap;
        const isRoot = (6-i) === rootString;
        return (
          <circle key={i} cx={x} cy={y} r={5}
            fill={isRoot ? '#FFB900' : '#A3A3A3'}/>
        );
      })}
    </svg>
  );
}
