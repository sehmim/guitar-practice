export const NOTES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

const MAJOR_QUALITIES = ['Major','minor','minor','Major','dom7','minor','dim','Major'];
const MINOR_QUALITIES = ['minor','dim','Major','minor','minor','Major','dom7','minor'];

function noteIndex(note) { return NOTES.indexOf(note); }

const MAJOR_INTERVALS = [0,2,4,5,7,9,11,12];
const MINOR_INTERVALS = [0,2,3,5,7,8,10,12];

export function getChordAtDegree(key, scaleType, degree) {
  const deg = degree === 8 ? 1 : degree;
  const intervals = scaleType === 'Major' ? MAJOR_INTERVALS : MINOR_INTERVALS;
  const idx = (noteIndex(key) + intervals[deg-1]) % 12;
  const root = NOTES[idx];
  const quality = scaleType === 'Major' ? MAJOR_QUALITIES[deg-1] : MINOR_QUALITIES[deg-1];
  let name;
  if (quality === 'Major') name = root;
  else if (quality === 'minor') name = root + 'm';
  else if (quality === 'dom7') name = root + '7';
  else name = root + 'dim';
  return { root, quality, name, degree };
}

export function generateSequence(length) {
  const seq = [];
  for (let i = 0; i < length; i++) {
    let next;
    do { next = Math.floor(Math.random() * 7) + 1; } while (next === seq[seq.length - 1]);
    seq.push(next);
  }
  return seq;
}

export function frequencyToNote(freq) {
  if (!freq || freq < 20) return null;
  const A4 = 440;
  const semitones = 12 * Math.log2(freq / A4);
  const midiNote = Math.round(semitones) + 69;
  const note = NOTES[((midiNote % 12) + 12) % 12];
  const octave = Math.floor(midiNote / 12) - 1;
  const cents = Math.round((semitones - Math.round(semitones)) * 100);
  return { note, octave, cents };
}

export function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
export function resolveKey(k) { return k === 'Random' ? pickRandom(NOTES) : k; }
export function resolveScale(s) { return s === 'Random' ? pickRandom(['Major','Minor']) : s; }
