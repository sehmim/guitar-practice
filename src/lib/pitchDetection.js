import { NOTES } from './musicTheory';

export const CHORD_INTERVALS = {
  Major: [0, 4, 7],
  minor: [0, 3, 7],
  dom7:  [0, 4, 7, 10],
  dim:   [0, 3, 6],
};

export function computeChroma(freqData, sampleRate, fftSize) {
  const chroma = new Float32Array(12).fill(0);
  const nyquist = sampleRate / 2;
  const binCount = fftSize / 2;
  for (let i = 1; i < binCount; i++) {
    const freq = (i / binCount) * nyquist;
    if (freq < 65 || freq > 2000) continue;
    const dB = freqData[i];
    if (dB < -70) continue;
    const linear = Math.pow(10, dB / 20);
    const midi = 12 * Math.log2(freq / 440) + 69;
    const pc = ((Math.round(midi) % 12) + 12) % 12;
    chroma[pc] += linear;
  }
  const max = Math.max(...chroma);
  if (max > 0) for (let i = 0; i < 12; i++) chroma[i] /= max;
  return chroma;
}

export function scoreChord(chroma, rootNote, quality) {
  const rootIdx = NOTES.indexOf(rootNote);
  if (rootIdx < 0) return 0;
  const intervals = CHORD_INTERVALS[quality] || CHORD_INTERVALS.Major;
  let score = 0;
  for (const interval of intervals) score += chroma[(rootIdx + interval) % 12];
  return score / intervals.length;
}

export function getRmsFromTimeDomain(buf) {
  let rms = 0;
  for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
  return Math.sqrt(rms / buf.length);
}

export function topChromaNote(chroma) {
  let max = 0, idx = 0;
  for (let i = 0; i < 12; i++) { if (chroma[i] > max) { max = chroma[i]; idx = i; } }
  return max > 0.1 ? NOTES[idx] : null;
}
