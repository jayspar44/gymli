import client from './client';

// User profile
export const getProfile = () => client.get('/user/profile').then(r => r.data);
export const updateProfile = (data) => client.post('/user/profile', data).then(r => r.data);

// Plans
export const getTemplates = () => client.get('/plans/templates').then(r => r.data);
export const generatePlan = (templateId) => client.post('/plans/generate', { templateId }).then(r => r.data);
export const getActivePlan = () => client.get('/plans/active').then(r => r.data);
export const getPlan = (id) => client.get(`/plans/${id}`).then(r => r.data);
export const updatePlan = (id, data) => client.put(`/plans/${id}`, data).then(r => r.data);

// Exercises
export const searchExercises = (params) => client.get('/exercises', { params }).then(r => r.data);

// Workouts
export const getTodaysWorkout = () => client.get('/workouts/today').then(r => r.data);
export const logWorkout = (data) => client.post('/workouts', data).then(r => r.data);
export const getWorkouts = (params) => client.get('/workouts', { params }).then(r => r.data);
export const updateWorkout = (id, data) => client.put(`/workouts/${id}`, data).then(r => r.data);
export const deleteWorkout = (id) => client.delete(`/workouts/${id}`).then(r => r.data);
export const getPreviousPerformance = (exerciseIds) =>
  client.post('/workouts/previous', { exerciseIds }).then(r => r.data);

// Chat
export const sendChat = (message, context) => client.post('/chat', { message, context }).then(r => r.data);
export const getChatHistory = (limit) => client.get('/chat/history', { params: { limit } }).then(r => r.data);
export const clearChatHistory = () => client.delete('/chat/history').then(r => r.data);

// Coaching
export const getDailyTip = () => client.get('/coaching/tip').then(r => r.data);

// Stats
export const getExerciseProgress = (exerciseId) => client.get(`/stats/exercise/${exerciseId}`).then(r => r.data);
export const getVolumeStats = (period) => client.get('/stats/volume', { params: { period } }).then(r => r.data);
export const getStreakData = () => client.get('/stats/streak').then(r => r.data);
export const getInsights = () => client.get('/stats/insights').then(r => r.data);
export const getLoggedExercises = () => client.get('/stats/exercises').then(r => r.data);
