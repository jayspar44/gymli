import { searchExercises } from '../services/exercise-service.js';

export async function listExercises(req, res) {
  try {
    const { q, category, muscleGroup, equipment } = req.query;
    const exercises = await searchExercises({ q, category, muscleGroup, equipment });
    res.json(exercises);
  } catch (error) {
    req.log.error(error, 'Failed to list exercises');
    res.status(500).json({ error: 'Failed to fetch exercises' });
  }
}
