import { getExerciseProgress, getVolumeStats, getStreakData, getInsightsData, getLoggedExercises } from '../services/stats-service.js';

export async function fetchExerciseProgress(req, res) {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'Exercise ID required' });

  const data = await getExerciseProgress(req.user.uid, id);
  res.json({ exerciseId: id, progress: data });
}

export async function fetchVolumeStats(req, res) {
  const period = req.query.period || 'week';
  const data = await getVolumeStats(req.user.uid, period);
  res.json({ period, data });
}

export async function fetchStreakData(req, res) {
  const data = await getStreakData(req.user.uid);
  res.json(data);
}

export async function fetchInsights(req, res) {
  const data = await getInsightsData(req.user.uid);
  res.json(data);
}

export async function fetchLoggedExercises(req, res) {
  const exercises = await getLoggedExercises(req.user.uid);
  res.json({ exercises });
}
