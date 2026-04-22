import { Guitar, BookOpen, Music } from 'lucide-react';

export default function Header({ view, dispatch }) {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-[#555555] bg-[#3C3C3C]">
      <div className="flex items-center gap-2">
        <Guitar size={22} className="text-[#FFB900]"/>
        <span className="font-bold text-lg tracking-wide text-white">FretBoard</span>
      </div>
      <nav className="flex gap-1">
        {[['practice','Practice',Guitar],['progressions','Progressions',Music],['logbook','Logbook',BookOpen]].map(([v,label,Icon]) => (
          <button key={v} onClick={() => dispatch({type:'SET_VIEW', view:v})}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-sm font-medium transition-colors
              ${view===v ? 'bg-[#FFB900] text-gray-950' : 'text-[#A3A3A3] hover:text-white hover:bg-[#505050]'}`}>
            <Icon size={14}/><span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </nav>
    </header>
  );
}
