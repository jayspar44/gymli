import {
  logWorkout,
  getWorkouts,
  getTodaysWorkout,
  updateWorkout,
  deleteWorkout,
} from '../services/workout-service.js';
import { getPreviousPerformance } from '../services/performance-service.js';

export async function createWorkout(req, res) {
  try {
    const workout = await logWorkout(req.user.uid, req.body);
    res.json(workout);
  } catch (error) {
    req.log.error(error, 'Failed to log workout');
    res.status(500).json({ error: 'Failed to log workout' });
  }
}

export async function listWorkouts(req, res) {
  try {
    const { limit, startAfterDate } = req.query;
    const workouts = await getWorkouts(req.user.uid, {
      limit: limit ? Number(limit) : 20,
      startAfterDate,
    });
    res.json(workouts);
  } catch (error) {
    req.log.error(error, 'Failed to list workouts');
    res.status(500).json({ error: 'Failed to list workouts' });
  }
}

export async function fetchTodaysWorkout(req, res) {
  try {
    const today = await getTodaysWorkout(req.user.uid);
    res.json(today);
  } catch (error) {
    req.log.error(error, 'Failed to get today\'s workout');
    res.status(500).json({ error: 'Failed to get today\'s workout' });
  }
}

export async function modifyWorkout(req, res) {
  try {
    const workout = await updateWorkout(req.user.uid, req.params.id, req.body);
    res.json(workout);
  } catch (error) {
    req.log.error(error, 'Failed to update workout');
    res.status(500).json({ error: 'Failed to update workout' });
  }
}

export async function removeWorkout(req, res) {
  try {
    await deleteWorkout(req.user.uid, req.params.id);
    res.json({ deleted: true });
  } catch (error) {
    req.log.error(error, 'Failed to delete workout');
    res.status(500).json({ error: 'Failed to delete workout' });
  }
}

export async function fetchPreviousPerformance(req, res) {
  try {
    const { exerciseIds } = req.body;
    if (!exerciseIds?.length) return res.json({});
    const result = await getPreviousPerformance(req.user.uid, exerciseIds);
    res.json(result);
  } catch (error) {
    req.log.error(error, 'Failed to fetch previous performance');
    res.status(500).json({ error: 'Failed to fetch previous performance' });
  }
}
