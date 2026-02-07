import 'dotenv/config';
import admin from 'firebase-admin';

let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
}

admin.initializeApp({
  credential: serviceAccount
    ? admin.credential.cert(serviceAccount)
    : admin.credential.applicationDefault(),
});

const db = admin.firestore();

const exercises = [
  // === COMPOUND LIFTS ===
  {
    name: 'Barbell Bench Press',
    category: 'strength',
    muscleGroups: { primary: ['chest'], secondary: ['triceps', 'front delts'] },
    equipment: 'barbell',
    instructions: 'Lie on bench, grip bar shoulder-width, lower to chest, press up.',
  },
  {
    name: 'Incline Barbell Bench Press',
    category: 'strength',
    muscleGroups: { primary: ['upper chest'], secondary: ['triceps', 'front delts'] },
    equipment: 'barbell',
    instructions: 'Set bench to 30-45 degrees. Press bar from upper chest.',
  },
  {
    name: 'Dumbbell Bench Press',
    category: 'strength',
    muscleGroups: { primary: ['chest'], secondary: ['triceps', 'front delts'] },
    equipment: 'dumbbell',
    instructions: 'Lie on bench, press dumbbells from chest level.',
  },
  {
    name: 'Barbell Back Squat',
    category: 'strength',
    muscleGroups: { primary: ['quads', 'glutes'], secondary: ['hamstrings', 'core'] },
    equipment: 'barbell',
    instructions: 'Bar on upper back, squat to parallel or below, drive up.',
  },
  {
    name: 'Front Squat',
    category: 'strength',
    muscleGroups: { primary: ['quads'], secondary: ['glutes', 'core'] },
    equipment: 'barbell',
    instructions: 'Bar on front delts, elbows high, squat to depth.',
  },
  {
    name: 'Goblet Squat',
    category: 'strength',
    muscleGroups: { primary: ['quads', 'glutes'], secondary: ['core'] },
    equipment: 'dumbbell',
    instructions: 'Hold dumbbell at chest, squat to depth.',
  },
  {
    name: 'Conventional Deadlift',
    category: 'strength',
    muscleGroups: { primary: ['hamstrings', 'glutes', 'back'], secondary: ['core', 'traps'] },
    equipment: 'barbell',
    instructions: 'Hip-width stance, grip bar, drive through floor, lockout.',
  },
  {
    name: 'Romanian Deadlift',
    category: 'strength',
    muscleGroups: { primary: ['hamstrings', 'glutes'], secondary: ['lower back'] },
    equipment: 'barbell',
    instructions: 'Slight knee bend, hinge at hips, lower bar along legs.',
  },
  {
    name: 'Overhead Press',
    category: 'strength',
    muscleGroups: { primary: ['front delts', 'side delts'], secondary: ['triceps', 'core'] },
    equipment: 'barbell',
    instructions: 'Press bar from shoulders to overhead lockout.',
  },
  {
    name: 'Dumbbell Shoulder Press',
    category: 'strength',
    muscleGroups: { primary: ['front delts', 'side delts'], secondary: ['triceps'] },
    equipment: 'dumbbell',
    instructions: 'Press dumbbells from shoulder height to overhead.',
  },
  {
    name: 'Barbell Row',
    category: 'strength',
    muscleGroups: { primary: ['back', 'lats'], secondary: ['biceps', 'rear delts'] },
    equipment: 'barbell',
    instructions: 'Hinge forward, row bar to lower chest/upper abdomen.',
  },
  {
    name: 'Pull-Up',
    category: 'strength',
    muscleGroups: { primary: ['lats', 'back'], secondary: ['biceps', 'core'] },
    equipment: 'bodyweight',
    instructions: 'Hang from bar, pull chin above bar, lower with control.',
  },
  {
    name: 'Chin-Up',
    category: 'strength',
    muscleGroups: { primary: ['lats', 'biceps'], secondary: ['back', 'core'] },
    equipment: 'bodyweight',
    instructions: 'Supinated grip, pull chin above bar.',
  },
  {
    name: 'Lat Pulldown',
    category: 'strength',
    muscleGroups: { primary: ['lats'], secondary: ['biceps', 'rear delts'] },
    equipment: 'cable',
    instructions: 'Pull bar to upper chest, squeeze lats, control the return.',
  },
  {
    name: 'Dip',
    category: 'strength',
    muscleGroups: { primary: ['chest', 'triceps'], secondary: ['front delts'] },
    equipment: 'bodyweight',
    instructions: 'Lower body between parallel bars, press back up.',
  },

  // === ISOLATION - ARMS ===
  {
    name: 'Barbell Curl',
    category: 'strength',
    muscleGroups: { primary: ['biceps'], secondary: ['forearms'] },
    equipment: 'barbell',
    instructions: 'Curl bar from thighs to shoulders, lower with control.',
  },
  {
    name: 'Dumbbell Curl',
    category: 'strength',
    muscleGroups: { primary: ['biceps'], secondary: ['forearms'] },
    equipment: 'dumbbell',
    instructions: 'Curl dumbbells alternating or together.',
  },
  {
    name: 'Hammer Curl',
    category: 'strength',
    muscleGroups: { primary: ['biceps', 'brachialis'], secondary: ['forearms'] },
    equipment: 'dumbbell',
    instructions: 'Neutral grip curl, thumbs pointing up throughout.',
  },
  {
    name: 'Tricep Pushdown',
    category: 'strength',
    muscleGroups: { primary: ['triceps'], secondary: [] },
    equipment: 'cable',
    instructions: 'Push cable attachment down, lock elbows at sides.',
  },
  {
    name: 'Overhead Tricep Extension',
    category: 'strength',
    muscleGroups: { primary: ['triceps'], secondary: [] },
    equipment: 'dumbbell',
    instructions: 'Hold dumbbell overhead, lower behind head, extend.',
  },
  {
    name: 'Skull Crusher',
    category: 'strength',
    muscleGroups: { primary: ['triceps'], secondary: [] },
    equipment: 'barbell',
    instructions: 'Lie on bench, lower bar to forehead, extend arms.',
  },

  // === ISOLATION - SHOULDERS ===
  {
    name: 'Lateral Raise',
    category: 'strength',
    muscleGroups: { primary: ['side delts'], secondary: [] },
    equipment: 'dumbbell',
    instructions: 'Raise dumbbells to sides until shoulder height.',
  },
  {
    name: 'Front Raise',
    category: 'strength',
    muscleGroups: { primary: ['front delts'], secondary: [] },
    equipment: 'dumbbell',
    instructions: 'Raise dumbbells to front until shoulder height.',
  },
  {
    name: 'Face Pull',
    category: 'strength',
    muscleGroups: { primary: ['rear delts', 'upper back'], secondary: ['rotator cuff'] },
    equipment: 'cable',
    instructions: 'Pull rope to face, externally rotate at end.',
  },
  {
    name: 'Reverse Fly',
    category: 'strength',
    muscleGroups: { primary: ['rear delts'], secondary: ['upper back'] },
    equipment: 'dumbbell',
    instructions: 'Bent over, raise dumbbells to sides.',
  },

  // === ISOLATION - CHEST ===
  {
    name: 'Cable Fly',
    category: 'strength',
    muscleGroups: { primary: ['chest'], secondary: ['front delts'] },
    equipment: 'cable',
    instructions: 'Bring cable handles together in front of chest.',
  },
  {
    name: 'Dumbbell Fly',
    category: 'strength',
    muscleGroups: { primary: ['chest'], secondary: ['front delts'] },
    equipment: 'dumbbell',
    instructions: 'Lie on bench, lower dumbbells in arc, squeeze together.',
  },
  {
    name: 'Push-Up',
    category: 'strength',
    muscleGroups: { primary: ['chest'], secondary: ['triceps', 'front delts', 'core'] },
    equipment: 'bodyweight',
    instructions: 'Hands shoulder-width, lower chest to floor, push up.',
  },

  // === ISOLATION - BACK ===
  {
    name: 'Seated Cable Row',
    category: 'strength',
    muscleGroups: { primary: ['back', 'lats'], secondary: ['biceps'] },
    equipment: 'cable',
    instructions: 'Pull handle to abdomen, squeeze shoulder blades.',
  },
  {
    name: 'Dumbbell Row',
    category: 'strength',
    muscleGroups: { primary: ['back', 'lats'], secondary: ['biceps'] },
    equipment: 'dumbbell',
    instructions: 'One arm on bench, row dumbbell to hip.',
  },
  {
    name: 'T-Bar Row',
    category: 'strength',
    muscleGroups: { primary: ['back'], secondary: ['biceps', 'rear delts'] },
    equipment: 'barbell',
    instructions: 'Straddle bar, row to chest with V-grip.',
  },

  // === LEGS ===
  {
    name: 'Leg Press',
    category: 'strength',
    muscleGroups: { primary: ['quads', 'glutes'], secondary: ['hamstrings'] },
    equipment: 'machine',
    instructions: 'Press platform away, do not lock knees.',
  },
  {
    name: 'Leg Extension',
    category: 'strength',
    muscleGroups: { primary: ['quads'], secondary: [] },
    equipment: 'machine',
    instructions: 'Extend legs against pad, squeeze at top.',
  },
  {
    name: 'Leg Curl',
    category: 'strength',
    muscleGroups: { primary: ['hamstrings'], secondary: [] },
    equipment: 'machine',
    instructions: 'Curl pad toward glutes, control the negative.',
  },
  {
    name: 'Bulgarian Split Squat',
    category: 'strength',
    muscleGroups: { primary: ['quads', 'glutes'], secondary: ['hamstrings', 'core'] },
    equipment: 'dumbbell',
    instructions: 'Rear foot elevated, lunge down on front leg.',
  },
  {
    name: 'Lunges',
    category: 'strength',
    muscleGroups: { primary: ['quads', 'glutes'], secondary: ['hamstrings'] },
    equipment: 'dumbbell',
    instructions: 'Step forward, lower back knee toward ground.',
  },
  {
    name: 'Hip Thrust',
    category: 'strength',
    muscleGroups: { primary: ['glutes'], secondary: ['hamstrings'] },
    equipment: 'barbell',
    instructions: 'Upper back on bench, drive hips up with bar on lap.',
  },
  {
    name: 'Calf Raise',
    category: 'strength',
    muscleGroups: { primary: ['calves'], secondary: [] },
    equipment: 'machine',
    instructions: 'Rise onto toes, pause at top, lower with control.',
  },

  // === CORE ===
  {
    name: 'Plank',
    category: 'strength',
    muscleGroups: { primary: ['core'], secondary: ['shoulders'] },
    equipment: 'bodyweight',
    instructions: 'Hold push-up position on forearms, keep body straight.',
  },
  {
    name: 'Hanging Leg Raise',
    category: 'strength',
    muscleGroups: { primary: ['core', 'hip flexors'], secondary: [] },
    equipment: 'bodyweight',
    instructions: 'Hang from bar, raise legs to parallel or higher.',
  },
  {
    name: 'Cable Crunch',
    category: 'strength',
    muscleGroups: { primary: ['core'], secondary: [] },
    equipment: 'cable',
    instructions: 'Kneel at cable, crunch down against resistance.',
  },
  {
    name: 'Ab Wheel Rollout',
    category: 'strength',
    muscleGroups: { primary: ['core'], secondary: ['shoulders', 'lats'] },
    equipment: 'bodyweight',
    instructions: 'Roll wheel out from kneeling, extend fully, roll back.',
  },

  // === CARDIO ===
  {
    name: 'Running',
    category: 'cardio',
    muscleGroups: { primary: ['legs', 'cardiovascular'], secondary: ['core'] },
    equipment: 'none',
    instructions: 'Steady state or interval running.',
  },
  {
    name: 'Cycling',
    category: 'cardio',
    muscleGroups: { primary: ['quads', 'cardiovascular'], secondary: ['hamstrings', 'calves'] },
    equipment: 'machine',
    instructions: 'Stationary or outdoor cycling.',
  },
  {
    name: 'Rowing Machine',
    category: 'cardio',
    muscleGroups: { primary: ['back', 'cardiovascular'], secondary: ['legs', 'biceps'] },
    equipment: 'machine',
    instructions: 'Drive with legs, pull handle to chest, return.',
  },
  {
    name: 'Elliptical',
    category: 'cardio',
    muscleGroups: { primary: ['legs', 'cardiovascular'], secondary: ['arms'] },
    equipment: 'machine',
    instructions: 'Smooth elliptical motion with arm handles.',
  },
  {
    name: 'Jump Rope',
    category: 'cardio',
    muscleGroups: { primary: ['calves', 'cardiovascular'], secondary: ['shoulders', 'core'] },
    equipment: 'none',
    instructions: 'Jump with both feet, keep rope turning smoothly.',
  },
  {
    name: 'Stair Climber',
    category: 'cardio',
    muscleGroups: { primary: ['quads', 'glutes', 'cardiovascular'], secondary: ['calves'] },
    equipment: 'machine',
    instructions: 'Climb stairs at steady pace without leaning on handles.',
  },

  // === OLYMPIC / POWER ===
  {
    name: 'Power Clean',
    category: 'strength',
    muscleGroups: { primary: ['hamstrings', 'glutes', 'traps'], secondary: ['quads', 'core', 'shoulders'] },
    equipment: 'barbell',
    instructions: 'Explosive pull from floor to rack position on shoulders.',
  },
  {
    name: 'Sumo Deadlift',
    category: 'strength',
    muscleGroups: { primary: ['glutes', 'quads'], secondary: ['hamstrings', 'back'] },
    equipment: 'barbell',
    instructions: 'Wide stance, grip inside knees, pull to lockout.',
  },
  {
    name: 'Rack Pull',
    category: 'strength',
    muscleGroups: { primary: ['back', 'traps'], secondary: ['glutes', 'hamstrings'] },
    equipment: 'barbell',
    instructions: 'Deadlift from elevated pins, focus on lockout.',
  },

  // === ADDITIONAL ===
  {
    name: 'Shrug',
    category: 'strength',
    muscleGroups: { primary: ['traps'], secondary: [] },
    equipment: 'barbell',
    instructions: 'Shrug shoulders up toward ears, pause, lower.',
  },
  {
    name: 'Farmer Walk',
    category: 'strength',
    muscleGroups: { primary: ['grip', 'traps', 'core'], secondary: ['legs'] },
    equipment: 'dumbbell',
    instructions: 'Hold heavy dumbbells, walk for distance or time.',
  },
  {
    name: 'Chest Supported Row',
    category: 'strength',
    muscleGroups: { primary: ['back'], secondary: ['biceps', 'rear delts'] },
    equipment: 'dumbbell',
    instructions: 'Lie face down on incline bench, row dumbbells.',
  },
];

async function seed() {
  console.log(`Seeding ${exercises.length} exercises...`);

  const batch = db.batch();

  for (const exercise of exercises) {
    const id = exercise.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const ref = db.collection('exercises').doc(id);
    batch.set(ref, {
      ...exercise,
      createdAt: new Date().toISOString(),
    });
  }

  await batch.commit();
  console.log('Done! Seeded exercises to Firestore.');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
