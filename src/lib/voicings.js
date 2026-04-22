const ROOT_FRETS = {
  6: { C:8,  'C#':9,  D:10, 'D#':11, E:0,  F:1,  'F#':2,  G:3,  'G#':4,  A:5,  'A#':6,  B:7  },
  5: { C:3,  'C#':4,  D:5,  'D#':6,  E:7,  F:8,  'F#':9,  G:10, 'G#':11, A:0,  'A#':1,  B:2  },
  4: { C:10, 'C#':11, D:0,  'D#':1,  E:2,  F:3,  'F#':4,  G:5,  'G#':6,  A:7,  'A#':8,  B:9  },
};

// offsets: strings 6→1, relative to root fret. -1=muted, barre=offset from root for barre fret (null=none)
const VOICING_TEMPLATES = {
  Major: {
    E: { offsets:[0,2,2,1,0,0], barre:0, rootString:6 },
    A: { offsets:[-1,0,2,2,2,0], barre:2, rootString:5 },
    D: { offsets:[-1,-1,0,2,3,2], barre:null, rootString:4 },
  },
  minor: {
    E: { offsets:[0,2,2,0,0,0], barre:0, rootString:6 },
    A: { offsets:[-1,0,2,2,1,0], barre:null, rootString:5 },
    D: { offsets:[-1,-1,0,2,3,1], barre:null, rootString:4 },
  },
  dom7: {
    E: { offsets:[0,2,0,1,0,0], barre:0, rootString:6 },
    A: { offsets:[-1,0,2,0,2,0], barre:null, rootString:5 },
    D: { offsets:[-1,-1,0,2,1,2], barre:null, rootString:4 },
  },
  dim: {
    E: { offsets:[0,1,2,0,2,-1], barre:null, rootString:6 },
    A: { offsets:[-1,0,1,2,1,-1], barre:null, rootString:5 },
    D: { offsets:[-1,-1,0,1,0,1], barre:null, rootString:4 },
  },
};

export function getVoicings(root, quality) {
  const tmpl = VOICING_TEMPLATES[quality];
  if (!tmpl) return [];
  return ['E','A','D'].map(shape => {
    const t = tmpl[shape];
    const rootFret = ROOT_FRETS[t.rootString][root];
    const frets = t.offsets.map(o => o === -1 ? -1 : rootFret + o);
    const baseFret = rootFret;
    const barreFret = t.barre !== null ? rootFret + t.barre : null;
    return { shape, frets, baseFret, barreFret, rootString: t.rootString };
  });
}
