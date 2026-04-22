import { useState } from 'react';
import { Play } from 'lucide-react';
import { PROGRESSIONS, degLabel } from '../lib/progressionsData';
import { getChordAtDegree } from '../lib/musicTheory';

export default function ProgressionsView({ state, dispatch }) {
  const [activeScale, setActiveScale] = useState('Major');
  const [activeGenre, setActiveGenre] = useState('All');
  const previewKey = (state.key === 'Random' ? 'C' : state.key);

  const groups = PROGRESSIONS[activeScale] || PROGRESSIONS.Major;
  const genres = ['All', ...groups.map(g => g.genre)];
  const filtered = activeGenre === 'All' ? groups : groups.filter(g => g.genre === activeGenre);

  const handlePractice = (degrees, scaleType) => {
    dispatch({ type: 'SET_CUSTOM_SEQUENCE', sequence: degrees, scaleType });
    dispatch({ type: 'START_SESSION' });
    dispatch({ type: 'SET_VIEW', view: 'practice' });
  };

  return (
    <div className="space-y-4">
      {/* Scale toggle */}
      <div className="flex gap-2">
        {['Major','Minor'].map(s => (
          <button key={s} onClick={() => { setActiveScale(s); setActiveGenre('All'); }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${activeScale === s ? 'bg-[#FFB900] text-gray-950' : 'bg-[#505050] text-[#A3A3A3] hover:text-white'}`}>
            {s}
          </button>
        ))}
        <span className="ml-auto text-xs text-[#7A7A7A] self-center">Preview key: <span className="text-[#FFB900] font-mono">{previewKey}</span></span>
      </div>

      {/* Genre filter */}
      <div className="flex gap-1.5 flex-wrap">
        {genres.map(g => (
          <button key={g} onClick={() => setActiveGenre(g)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
              ${activeGenre === g ? 'bg-[#6A6A6A] text-white' : 'bg-[#505050] text-[#7A7A7A] hover:text-[#D4D4D4]'}`}>
            {g}
          </button>
        ))}
      </div>

      {/* Progression cards */}
      {filtered.map(group => (
        <div key={group.genre} className="space-y-2">
          <h3 className="text-xs font-bold text-[#FFB900] uppercase tracking-widest px-1">{group.genre}</h3>
          <div className="space-y-2">
            {group.items.map((prog, idx) => {
              const chordNames = prog.degrees.map(d => getChordAtDegree(previewKey, activeScale, d).name);
              const romans = prog.degrees.map(d => degLabel(d, activeScale));
              return (
                <div key={idx} className="bg-[#3C3C3C] border border-[#666666] rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-white text-sm">{prog.name}</p>
                      <p className="text-xs text-[#7A7A7A] mt-0.5 truncate">{prog.songs.join(' · ')}</p>
                    </div>
                    <button
                      onClick={() => handlePractice(prog.degrees, activeScale)}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[#FFB900] hover:bg-[#FFC820] text-gray-950 font-bold rounded-lg text-xs transition-colors">
                      <Play size={11}/> Practice
                    </button>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {prog.degrees.map((d, i) => (
                      <div key={i} className="flex flex-col items-center bg-[#505050] rounded-lg px-2.5 py-1.5 min-w-[36px]">
                        <span className="text-[10px] text-[#7A7A7A] font-mono leading-tight">{romans[i]}</span>
                        <span className="text-sm font-bold text-white leading-tight">{chordNames[i]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
