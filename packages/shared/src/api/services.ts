import type { AxiosInstance } from 'axios';

export function createServices(client: AxiosInstance) {
  const get = <T>(url: string, config?: any) => client.get<T>(url, config).then(r => r.data);
  const post = <T>(url: string, body?: any) => client.post<T>(url, body).then(r => r.data);
  const put = <T>(url: string, body?: any) => client.put<T>(url, body).then(r => r.data);
  const del = <T>(url: string) => client.delete<T>(url).then(r => r.data);

  return {
    // User profile
    getProfile: () => get('/user/profile'),
    updateProfile: (data: any) => post('/user/profile', data),
    // Routines
    getRoutines: () => get('/routines'),
    createRoutine: (data: any) => post('/routines', data),
    getRoutine: (id: string) => get(`/routines/${id}`),
    updateRoutine: (id: string, data: any) => put(`/routines/${id}`, data),
    deleteRoutine: (id: string) => del(`/routines/${id}`),
    // Exercises
    searchExercises: (params: any) => get('/exercises', { params }),
    // Workouts
    getTodaysWorkout: () => get('/workouts/today'),
    logWorkout: (data: any) => post('/workouts', data),
    getWorkouts: (params: any) => get('/workouts', { params }),
    updateWorkout: (id: string, data: any) => put(`/workouts/${id}`, data),
    deleteWorkout: (id: string) => del(`/workouts/${id}`),
    getPreviousPerformance: (exerciseIds: string[]) => post('/workouts/previous', { exerciseIds }),
    // Chat
    sendChat: (message: string, context: any) => post('/chat', { message, context }),
    getChatHistory: (limit?: number) => get('/chat/history', { params: { limit } }),
    clearChatHistory: () => del('/chat/history'),
    // Conversational logging
    parseLog: (payload: any) => post('/log/parse', payload),
    // Coaching
    getDailyTip: () => get('/coaching/tip'),
    // Stats
    getExerciseProgress: (exerciseId: string) => get(`/stats/exercise/${exerciseId}`),
    getVolumeStats: (period: string) => get('/stats/volume', { params: { period } }),
    getStreakData: () => get('/stats/streak'),
    getInsights: () => get('/stats/insights'),
    getLoggedExercises: () => get('/stats/exercises'),
  };
}

export type Services = ReturnType<typeof createServices>;
