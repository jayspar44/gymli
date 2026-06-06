const N = (v) => Number(v) || 0;

export function setVolume(kind, s) {
  switch (kind) {
    case 'bodyweight': return N(s.addedWeight) * N(s.reps);
    case 'assisted': return N(s.reps);
    case 'timed': return N(s.seconds);
    case 'distance': return N(s.distance);
    case 'weighted':
    default: return N(s.weight) * N(s.reps);
  }
}

export function setScore(kind, s) {
  switch (kind) {
    case 'bodyweight': return N(s.addedWeight);
    case 'assisted': return -N(s.assistWeight);
    case 'timed': return N(s.seconds);
    case 'distance': return N(s.distance);
    case 'weighted':
    default: return N(s.weight);
  }
}

export function exerciseRollup(kind, sets = []) {
  const done = sets.filter(s => s.completed);
  const volume = done.reduce((sum, s) => sum + setVolume(kind, s), 0);
  let best = null;
  for (const s of done) {
    const score = setScore(kind, s);
    if (best === null || score > best.score) best = { score, set: s };
  }
  return { volume, best: best || { score: 0, set: null }, hasData: done.length > 0 };
}
