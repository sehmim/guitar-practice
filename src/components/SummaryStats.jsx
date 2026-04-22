import { Clock, Target, Flame } from 'lucide-react';

export default function SummaryStats({ logbook }) {
  const total = logbook.reduce((s, e) => s + (e.durationMinutes || 0), 0);
  const avgAcc = logbook.length ? Math.round(logbook.reduce((s,e) => s + (e.accuracy||0), 0) / logbook.length) : 0;

  const days = [...new Set(logbook.map(e => e.date?.slice(0,10)))].sort().reverse();
  let streak = 0;
  if (days.length) {
    const today = new Date().toISOString().slice(0,10);
    let check = today;
    for (const d of days) {
      if (d === check) { streak++; const dt = new Date(check); dt.setDate(dt.getDate()-1); check = dt.toISOString().slice(0,10); }
      else if (d < check) break;
    }
  }

  return (
    <div className="grid grid-cols-3 gap-3 mb-4">
      {[
        [Clock, `${Math.round(total)}m`, 'Total Time'],
        [Target, `${avgAcc}%`, 'Avg Accuracy'],
        [Flame, streak, 'Day Streak'],
      ].map(([Icon, val, label]) => (
        <div key={label} className="bg-[#3C3C3C] border border-[#666666] rounded-xl p-3 text-center">
          <Icon size={16} className="text-[#FFB900] mx-auto mb-1"/>
          <div className="text-xl font-bold text-white">{val}</div>
          <div className="text-xs text-[#7A7A7A]">{label}</div>
        </div>
      ))}
    </div>
  );
}
