export const templates = {
  ppl: {
    id: 'ppl',
    name: 'Push / Pull / Legs',
    description: 'Classic 6-day split hitting each muscle group twice per week.',
    daysPerWeek: 6,
    suitableFor: ['intermediate', 'advanced'],
    days: [
      {
        name: 'Push A',
        focus: 'Chest, Shoulders, Triceps',
        exercises: [
          { exerciseId: 'barbell-bench-press', sets: 4, reps: '6-8', progression: 'linear' },
          { exerciseId: 'dumbbell-shoulder-press', sets: 3, reps: '8-10', progression: 'linear' },
          { exerciseId: 'incline-barbell-bench-press', sets: 3, reps: '8-10', progression: 'linear' },
          { exerciseId: 'lateral-raise', sets: 3, reps: '12-15', progression: 'volume' },
          { exerciseId: 'tricep-pushdown', sets: 3, reps: '10-12', progression: 'volume' },
          { exerciseId: 'overhead-tricep-extension', sets: 3, reps: '10-12', progression: 'volume' },
        ],
      },
      {
        name: 'Pull A',
        focus: 'Back, Biceps',
        exercises: [
          { exerciseId: 'barbell-row', sets: 4, reps: '6-8', progression: 'linear' },
          { exerciseId: 'pull-up', sets: 3, reps: '6-10', progression: 'linear' },
          { exerciseId: 'seated-cable-row', sets: 3, reps: '10-12', progression: 'volume' },
          { exerciseId: 'face-pull', sets: 3, reps: '12-15', progression: 'volume' },
          { exerciseId: 'barbell-curl', sets: 3, reps: '8-10', progression: 'volume' },
          { exerciseId: 'hammer-curl', sets: 3, reps: '10-12', progression: 'volume' },
        ],
      },
      {
        name: 'Legs A',
        focus: 'Quads, Hamstrings, Glutes',
        exercises: [
          { exerciseId: 'barbell-back-squat', sets: 4, reps: '6-8', progression: 'linear' },
          { exerciseId: 'romanian-deadlift', sets: 3, reps: '8-10', progression: 'linear' },
          { exerciseId: 'leg-press', sets: 3, reps: '10-12', progression: 'volume' },
          { exerciseId: 'leg-curl', sets: 3, reps: '10-12', progression: 'volume' },
          { exerciseId: 'calf-raise', sets: 4, reps: '12-15', progression: 'volume' },
        ],
      },
      {
        name: 'Push B',
        focus: 'Chest, Shoulders, Triceps',
        exercises: [
          { exerciseId: 'dumbbell-bench-press', sets: 4, reps: '8-10', progression: 'linear' },
          { exerciseId: 'overhead-press', sets: 3, reps: '6-8', progression: 'linear' },
          { exerciseId: 'cable-fly', sets: 3, reps: '12-15', progression: 'volume' },
          { exerciseId: 'lateral-raise', sets: 4, reps: '12-15', progression: 'volume' },
          { exerciseId: 'skull-crusher', sets: 3, reps: '10-12', progression: 'volume' },
        ],
      },
      {
        name: 'Pull B',
        focus: 'Back, Biceps',
        exercises: [
          { exerciseId: 'conventional-deadlift', sets: 3, reps: '5', progression: 'linear' },
          { exerciseId: 'lat-pulldown', sets: 3, reps: '10-12', progression: 'volume' },
          { exerciseId: 'dumbbell-row', sets: 3, reps: '8-10', progression: 'linear' },
          { exerciseId: 'reverse-fly', sets: 3, reps: '12-15', progression: 'volume' },
          { exerciseId: 'dumbbell-curl', sets: 3, reps: '10-12', progression: 'volume' },
        ],
      },
      {
        name: 'Legs B',
        focus: 'Quads, Hamstrings, Glutes',
        exercises: [
          { exerciseId: 'front-squat', sets: 4, reps: '8-10', progression: 'linear' },
          { exerciseId: 'hip-thrust', sets: 3, reps: '8-10', progression: 'linear' },
          { exerciseId: 'bulgarian-split-squat', sets: 3, reps: '10-12', progression: 'volume' },
          { exerciseId: 'leg-extension', sets: 3, reps: '12-15', progression: 'volume' },
          { exerciseId: 'calf-raise', sets: 4, reps: '12-15', progression: 'volume' },
        ],
      },
    ],
  },

  upper_lower: {
    id: 'upper_lower',
    name: 'Upper / Lower',
    description: 'Balanced 4-day split. Great for intermediates wanting frequency and recovery.',
    daysPerWeek: 4,
    suitableFor: ['beginner', 'intermediate'],
    days: [
      {
        name: 'Upper A',
        focus: 'Chest, Back, Shoulders, Arms',
        exercises: [
          { exerciseId: 'barbell-bench-press', sets: 4, reps: '6-8', progression: 'linear' },
          { exerciseId: 'barbell-row', sets: 4, reps: '6-8', progression: 'linear' },
          { exerciseId: 'dumbbell-shoulder-press', sets: 3, reps: '8-10', progression: 'linear' },
          { exerciseId: 'lat-pulldown', sets: 3, reps: '10-12', progression: 'volume' },
          { exerciseId: 'lateral-raise', sets: 3, reps: '12-15', progression: 'volume' },
          { exerciseId: 'barbell-curl', sets: 2, reps: '10-12', progression: 'volume' },
          { exerciseId: 'tricep-pushdown', sets: 2, reps: '10-12', progression: 'volume' },
        ],
      },
      {
        name: 'Lower A',
        focus: 'Quads, Hamstrings, Glutes',
        exercises: [
          { exerciseId: 'barbell-back-squat', sets: 4, reps: '6-8', progression: 'linear' },
          { exerciseId: 'romanian-deadlift', sets: 3, reps: '8-10', progression: 'linear' },
          { exerciseId: 'leg-press', sets: 3, reps: '10-12', progression: 'volume' },
          { exerciseId: 'leg-curl', sets: 3, reps: '10-12', progression: 'volume' },
          { exerciseId: 'calf-raise', sets: 4, reps: '12-15', progression: 'volume' },
          { exerciseId: 'plank', sets: 3, reps: '30-60s', progression: 'volume' },
        ],
      },
      {
        name: 'Upper B',
        focus: 'Chest, Back, Shoulders, Arms',
        exercises: [
          { exerciseId: 'dumbbell-bench-press', sets: 4, reps: '8-10', progression: 'linear' },
          { exerciseId: 'pull-up', sets: 3, reps: '6-10', progression: 'linear' },
          { exerciseId: 'overhead-press', sets: 3, reps: '8-10', progression: 'linear' },
          { exerciseId: 'seated-cable-row', sets: 3, reps: '10-12', progression: 'volume' },
          { exerciseId: 'face-pull', sets: 3, reps: '12-15', progression: 'volume' },
          { exerciseId: 'hammer-curl', sets: 2, reps: '10-12', progression: 'volume' },
          { exerciseId: 'overhead-tricep-extension', sets: 2, reps: '10-12', progression: 'volume' },
        ],
      },
      {
        name: 'Lower B',
        focus: 'Quads, Hamstrings, Glutes',
        exercises: [
          { exerciseId: 'conventional-deadlift', sets: 3, reps: '5', progression: 'linear' },
          { exerciseId: 'front-squat', sets: 3, reps: '8-10', progression: 'linear' },
          { exerciseId: 'hip-thrust', sets: 3, reps: '10-12', progression: 'linear' },
          { exerciseId: 'bulgarian-split-squat', sets: 3, reps: '10-12', progression: 'volume' },
          { exerciseId: 'calf-raise', sets: 4, reps: '12-15', progression: 'volume' },
          { exerciseId: 'hanging-leg-raise', sets: 3, reps: '10-15', progression: 'volume' },
        ],
      },
    ],
  },

  full_body: {
    id: 'full_body',
    name: 'Full Body',
    description: 'Efficient 3-day program. Perfect for beginners or busy schedules.',
    daysPerWeek: 3,
    suitableFor: ['beginner', 'intermediate'],
    days: [
      {
        name: 'Day A',
        focus: 'Full Body - Squat Focus',
        exercises: [
          { exerciseId: 'barbell-back-squat', sets: 4, reps: '6-8', progression: 'linear' },
          { exerciseId: 'barbell-bench-press', sets: 3, reps: '8-10', progression: 'linear' },
          { exerciseId: 'barbell-row', sets: 3, reps: '8-10', progression: 'linear' },
          { exerciseId: 'lateral-raise', sets: 3, reps: '12-15', progression: 'volume' },
          { exerciseId: 'barbell-curl', sets: 2, reps: '10-12', progression: 'volume' },
          { exerciseId: 'plank', sets: 3, reps: '30-60s', progression: 'volume' },
        ],
      },
      {
        name: 'Day B',
        focus: 'Full Body - Bench Focus',
        exercises: [
          { exerciseId: 'dumbbell-bench-press', sets: 4, reps: '8-10', progression: 'linear' },
          { exerciseId: 'conventional-deadlift', sets: 3, reps: '5', progression: 'linear' },
          { exerciseId: 'pull-up', sets: 3, reps: '6-10', progression: 'linear' },
          { exerciseId: 'dumbbell-shoulder-press', sets: 3, reps: '10-12', progression: 'linear' },
          { exerciseId: 'tricep-pushdown', sets: 2, reps: '10-12', progression: 'volume' },
          { exerciseId: 'calf-raise', sets: 3, reps: '12-15', progression: 'volume' },
        ],
      },
      {
        name: 'Day C',
        focus: 'Full Body - Deadlift Focus',
        exercises: [
          { exerciseId: 'romanian-deadlift', sets: 4, reps: '8-10', progression: 'linear' },
          { exerciseId: 'overhead-press', sets: 3, reps: '8-10', progression: 'linear' },
          { exerciseId: 'lat-pulldown', sets: 3, reps: '10-12', progression: 'volume' },
          { exerciseId: 'goblet-squat', sets: 3, reps: '10-12', progression: 'volume' },
          { exerciseId: 'face-pull', sets: 3, reps: '12-15', progression: 'volume' },
          { exerciseId: 'hanging-leg-raise', sets: 3, reps: '10-15', progression: 'volume' },
        ],
      },
    ],
  },

  five_three_one: {
    id: 'five_three_one',
    name: '5/3/1',
    description: 'Wendler\'s proven strength program. Slow, steady gains with periodization.',
    daysPerWeek: 4,
    suitableFor: ['intermediate', 'advanced'],
    days: [
      {
        name: 'OHP Day',
        focus: 'Overhead Press + Accessories',
        exercises: [
          { exerciseId: 'overhead-press', sets: 3, reps: '5/3/1', progression: '531' },
          { exerciseId: 'dip', sets: 5, reps: '10', progression: 'volume' },
          { exerciseId: 'lateral-raise', sets: 3, reps: '12-15', progression: 'volume' },
          { exerciseId: 'tricep-pushdown', sets: 3, reps: '10-12', progression: 'volume' },
          { exerciseId: 'face-pull', sets: 3, reps: '15', progression: 'volume' },
        ],
      },
      {
        name: 'Deadlift Day',
        focus: 'Deadlift + Accessories',
        exercises: [
          { exerciseId: 'conventional-deadlift', sets: 3, reps: '5/3/1', progression: '531' },
          { exerciseId: 'barbell-row', sets: 5, reps: '10', progression: 'volume' },
          { exerciseId: 'leg-curl', sets: 3, reps: '10-12', progression: 'volume' },
          { exerciseId: 'hanging-leg-raise', sets: 3, reps: '10-15', progression: 'volume' },
          { exerciseId: 'dumbbell-curl', sets: 3, reps: '10-12', progression: 'volume' },
        ],
      },
      {
        name: 'Bench Day',
        focus: 'Bench Press + Accessories',
        exercises: [
          { exerciseId: 'barbell-bench-press', sets: 3, reps: '5/3/1', progression: '531' },
          { exerciseId: 'dumbbell-row', sets: 5, reps: '10', progression: 'volume' },
          { exerciseId: 'incline-barbell-bench-press', sets: 3, reps: '8-10', progression: 'linear' },
          { exerciseId: 'lateral-raise', sets: 3, reps: '12-15', progression: 'volume' },
          { exerciseId: 'overhead-tricep-extension', sets: 3, reps: '10-12', progression: 'volume' },
        ],
      },
      {
        name: 'Squat Day',
        focus: 'Squat + Accessories',
        exercises: [
          { exerciseId: 'barbell-back-squat', sets: 3, reps: '5/3/1', progression: '531' },
          { exerciseId: 'hip-thrust', sets: 5, reps: '10', progression: 'volume' },
          { exerciseId: 'leg-press', sets: 3, reps: '10-12', progression: 'volume' },
          { exerciseId: 'leg-extension', sets: 3, reps: '12-15', progression: 'volume' },
          { exerciseId: 'calf-raise', sets: 4, reps: '12-15', progression: 'volume' },
        ],
      },
    ],
  },

  bro_split: {
    id: 'bro_split',
    name: 'Bro Split',
    description: 'Classic 5-day bodybuilding split. One muscle group per day, max volume.',
    daysPerWeek: 5,
    suitableFor: ['intermediate', 'advanced'],
    days: [
      {
        name: 'Chest',
        focus: 'Chest',
        exercises: [
          { exerciseId: 'barbell-bench-press', sets: 4, reps: '6-8', progression: 'linear' },
          { exerciseId: 'incline-barbell-bench-press', sets: 4, reps: '8-10', progression: 'linear' },
          { exerciseId: 'dumbbell-bench-press', sets: 3, reps: '10-12', progression: 'volume' },
          { exerciseId: 'cable-fly', sets: 3, reps: '12-15', progression: 'volume' },
          { exerciseId: 'dumbbell-fly', sets: 3, reps: '12-15', progression: 'volume' },
        ],
      },
      {
        name: 'Back',
        focus: 'Back',
        exercises: [
          { exerciseId: 'conventional-deadlift', sets: 3, reps: '5', progression: 'linear' },
          { exerciseId: 'pull-up', sets: 4, reps: '6-10', progression: 'linear' },
          { exerciseId: 'barbell-row', sets: 4, reps: '8-10', progression: 'linear' },
          { exerciseId: 'seated-cable-row', sets: 3, reps: '10-12', progression: 'volume' },
          { exerciseId: 'lat-pulldown', sets: 3, reps: '10-12', progression: 'volume' },
        ],
      },
      {
        name: 'Shoulders',
        focus: 'Shoulders',
        exercises: [
          { exerciseId: 'overhead-press', sets: 4, reps: '6-8', progression: 'linear' },
          { exerciseId: 'dumbbell-shoulder-press', sets: 3, reps: '8-10', progression: 'linear' },
          { exerciseId: 'lateral-raise', sets: 4, reps: '12-15', progression: 'volume' },
          { exerciseId: 'front-raise', sets: 3, reps: '12-15', progression: 'volume' },
          { exerciseId: 'face-pull', sets: 3, reps: '15', progression: 'volume' },
          { exerciseId: 'reverse-fly', sets: 3, reps: '12-15', progression: 'volume' },
        ],
      },
      {
        name: 'Legs',
        focus: 'Legs',
        exercises: [
          { exerciseId: 'barbell-back-squat', sets: 4, reps: '6-8', progression: 'linear' },
          { exerciseId: 'romanian-deadlift', sets: 3, reps: '8-10', progression: 'linear' },
          { exerciseId: 'leg-press', sets: 3, reps: '10-12', progression: 'volume' },
          { exerciseId: 'leg-extension', sets: 3, reps: '12-15', progression: 'volume' },
          { exerciseId: 'leg-curl', sets: 3, reps: '10-12', progression: 'volume' },
          { exerciseId: 'calf-raise', sets: 4, reps: '15', progression: 'volume' },
        ],
      },
      {
        name: 'Arms',
        focus: 'Biceps, Triceps',
        exercises: [
          { exerciseId: 'barbell-curl', sets: 3, reps: '8-10', progression: 'volume' },
          { exerciseId: 'skull-crusher', sets: 3, reps: '8-10', progression: 'volume' },
          { exerciseId: 'hammer-curl', sets: 3, reps: '10-12', progression: 'volume' },
          { exerciseId: 'tricep-pushdown', sets: 3, reps: '10-12', progression: 'volume' },
          { exerciseId: 'dumbbell-curl', sets: 3, reps: '12-15', progression: 'volume' },
          { exerciseId: 'overhead-tricep-extension', sets: 3, reps: '12-15', progression: 'volume' },
        ],
      },
    ],
  },
};

export function getTemplate(id) {
  return templates[id] || null;
}

export function listTemplates() {
  return Object.values(templates).map(t => ({
    id: t.id,
    name: t.name,
    description: t.description,
    daysPerWeek: t.daysPerWeek,
    suitableFor: t.suitableFor,
    dayNames: t.days.map(d => d.name),
  }));
}

export function recommendTemplate(profile) {
  const level = profile?.experienceLevel || 'beginner';
  const availableDays = profile?.availableDays?.length || 3;

  if (level === 'beginner' || availableDays <= 3) return 'full_body';
  if (availableDays === 4) return 'upper_lower';
  if (availableDays === 5) return 'bro_split';
  if (availableDays >= 6) return 'ppl';
  return 'upper_lower';
}
