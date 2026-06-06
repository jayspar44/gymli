import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { verifyToken } from '../controllers/auth-controller.js';
import { getUserProfile, upsertUserProfile } from '../controllers/user-controller.js';
import { listExercises } from '../controllers/exercise-controller.js';
import { listRoutines, createRoutine, getRoutine, updateRoutine, deleteRoutine } from '../controllers/routine-controller.js';
import { createWorkout, listWorkouts, fetchTodaysWorkout, modifyWorkout, removeWorkout, fetchPreviousPerformance } from '../controllers/workout-controller.js';
import { chat, fetchChatHistory, deleteChatHistory } from '../controllers/chat-controller.js';
import { parseLogEntry } from '../controllers/log-controller.js';
import { fetchDailyTip } from '../controllers/coaching-controller.js';
import { fetchExerciseProgress, fetchVolumeStats, fetchStreakData, fetchInsights, fetchLoggedExercises } from '../controllers/stats-controller.js';

const router = Router();

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many messages — even Gymli needs a breath between battles.' },
});

// All routes below require authentication
router.use(verifyToken);

// User routes
router.get('/user/profile', getUserProfile);
router.post('/user/profile', upsertUserProfile);

// Exercise routes
router.get('/exercises', listExercises);

// Routine routes
router.get('/routines', listRoutines);
router.post('/routines', createRoutine);
router.get('/routines/:id', getRoutine);
router.put('/routines/:id', updateRoutine);
router.delete('/routines/:id', deleteRoutine);

// Workout routes
router.get('/workouts/today', fetchTodaysWorkout);
router.get('/workouts', listWorkouts);
router.post('/workouts', createWorkout);
router.put('/workouts/:id', modifyWorkout);
router.delete('/workouts/:id', removeWorkout);
router.post('/workouts/previous', fetchPreviousPerformance);

// Log parse routes
router.post('/log/parse', chatLimiter, parseLogEntry);

// Stats routes
router.get('/stats/exercises', fetchLoggedExercises);
router.get('/stats/exercise/:id', fetchExerciseProgress);
router.get('/stats/volume', fetchVolumeStats);
router.get('/stats/streak', fetchStreakData);
router.get('/stats/insights', fetchInsights);

// Chat routes
router.post('/chat', chatLimiter, chat);
router.get('/chat/history', fetchChatHistory);
router.delete('/chat/history', deleteChatHistory);

// Coaching routes
router.get('/coaching/tip', fetchDailyTip);

export default router;
