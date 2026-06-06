export function validateId(id, catalog) {
  return catalog.find(e => e.id === id) || null;
}

function norm(s) { return String(s || '').toLowerCase().trim(); }

export function fuzzyResolve(query, catalog) {
  const q = norm(query);
  if (!q) return { match: null, ambiguous: false, candidates: [] };

  // Collect all matches: exact (name/alias equality) and partial (substring)
  const exactSet = new Set();
  const partialSet = new Set();

  for (const e of catalog) {
    const nameNorm = norm(e.name);
    const aliases = (e.aliases || []).map(norm);

    if (nameNorm === q || aliases.some(a => a === q)) {
      exactSet.add(e);
    } else if (nameNorm.includes(q) || aliases.some(a => a.includes(q))) {
      partialSet.add(e);
    }
  }

  // Build unified candidate pool: exact matches first, then partial
  const allCandidates = [...exactSet, ...partialSet];

  if (allCandidates.length === 0) return { match: null, ambiguous: false, candidates: [] };
  if (allCandidates.length === 1) return { match: allCandidates[0], ambiguous: false, candidates: allCandidates };

  // A single exact match wins only if no other exercises partially match
  if (exactSet.size === 1 && partialSet.size === 0) {
    const match = [...exactSet][0];
    return { match, ambiguous: false, candidates: [match] };
  }

  return { match: null, ambiguous: true, candidates: allCandidates.slice(0, 5) };
}

export function resolveExercise({ exerciseId, query }, catalog) {
  const valid = exerciseId ? validateId(exerciseId, catalog) : null;
  if (valid) {
    return { exerciseId: valid.id, name: valid.name, kind: valid.kind, ambiguous: false, candidates: [], method: 'catalog' };
  }
  const f = fuzzyResolve(query, catalog);
  if (f.match) {
    return { exerciseId: f.match.id, name: f.match.name, kind: f.match.kind, ambiguous: false, candidates: [], method: 'fuzzy' };
  }
  return {
    exerciseId: null, name: null, kind: null,
    ambiguous: f.ambiguous, method: 'fuzzy',
    candidates: f.candidates.map(c => ({ label: c.name, exerciseId: c.id })),
  };
}
