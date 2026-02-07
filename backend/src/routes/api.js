import { Router } from 'express';
import { verifyToken } from '../controllers/auth-controller.js';
import { getUserProfile, upsertUserProfile } from '../controllers/user-controller.js';
import { listExercises } from '../controllers/exercise-controller.js';
import { createPlan, fetchActivePlan, fetchPlan, modifyPlan, fetchTemplates } from '../controllers/plan-controller.js';

const router = Router();

// All routes below require authentication
router.use(verifyToken);

// User routes
router.get('/user/profile', getUserProfile);
router.post('/user/profile', upsertUserProfile);

// Exercise routes
router.get('/exercises', listExercises);

// Plan routes
router.get('/plans/templates', fetchTemplates);
router.post('/plans/generate', createPlan);
router.get('/plans/active', fetchActivePlan);
router.get('/plans/:id', fetchPlan);
router.put('/plans/:id', modifyPlan);

// Workout routes (Task 11)
// router.post('/workouts', ...);
// router.put('/workouts/:id', ...);
// router.delete('/workouts/:id', ...);
// router.get('/workouts', ...);
// router.get('/workouts/today', ...);

// Stats routes (Task 16)
// router.get('/stats/exercise/:id', ...);
// router.get('/stats/volume', ...);
// router.get('/stats/streak', ...);
// router.get('/stats/insights', ...);

// Chat routes (Task 14)
// router.post('/chat', ...);
// router.get('/chat/history', ...);
// router.delete('/chat/history', ...);

export default router;
