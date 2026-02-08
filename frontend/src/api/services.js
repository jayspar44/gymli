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
