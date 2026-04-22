import { useState } from 'react';
import { Star } from 'lucide-react';

export default function EffectivenessModal({ onSave }) {
  const [rating, setRating] = useState(3);
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#3C3C3C] border border-[#666666] rounded-xl p-6 max-w-sm w-full space-y-4">
        <h3 className="text-lg font-bold text-white">Rate this session</h3>
        <div className="flex gap-2 justify-center">
          {[1,2,3,4,5].map(n => (
            <button key={n} onClick={() => setRating(n)}>
              <Star size={28} fill={n <= rating ? '#FFB900' : 'none'} className={n <= rating ? 'text-[#FFB900]' : 'text-[#666666]'}/>
            </button>
          ))}
        </div>
        <button onClick={() => onSave(rating)}
          className="w-full bg-[#FFB900] hover:bg-[#FFC820] text-gray-950 font-bold py-2.5 rounded-lg transition-colors">
          Save Session
        </button>
      </div>
    </div>
  );
}
