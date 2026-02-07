import client from './client';

// User profile
export const getProfile = () => client.get('/user/profile').then(r => r.data);
export const updateProfile = (data) => client.post('/user/profile', data).then(r => r.data);
