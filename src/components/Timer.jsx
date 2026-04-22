import { useState, useEffect } from 'react';

export default function Timer({ startTime, pausedElapsed = 0, paused = false }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startTime) return;
    const calc = () => Math.max(0, Math.floor(((Date.now() - startTime) - pausedElapsed) / 1000));
    if (paused) { setElapsed(calc()); return; }
    setElapsed(calc());
    const id = setInterval(() => setElapsed(calc()), 1000);
    return () => clearInterval(id);
  }, [startTime, pausedElapsed, paused]);
  const m = String(Math.floor(elapsed/60)).padStart(2,'0');
  const s = String(elapsed%60).padStart(2,'0');
  return <span className="text-[#A3A3A3] text-sm font-mono">{m}:{s}</span>;
}
