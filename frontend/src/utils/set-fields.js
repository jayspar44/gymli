const CONFIG = {
  weighted: [{ key: 'weight', label: 'Weight' }, { key: 'reps', label: 'Reps' }],
  bodyweight: [{ key: 'addedWeight', label: '+kg/lb' }, { key: 'reps', label: 'Reps' }],
  assisted: [{ key: 'assistWeight', label: 'Assist' }, { key: 'reps', label: 'Reps' }],
  timed: [{ key: 'seconds', label: 'Seconds' }],
  distance: [{ key: 'distance', label: 'Distance' }, { key: 'seconds', label: 'Time (s)' }],
};

export function fieldsForKind(kind) {
  return CONFIG[kind] || CONFIG.weighted;
}

export function emptySet(kind) {
  const s = { completed: false };
  for (const f of fieldsForKind(kind)) s[f.key] = '';
  return s;
}
