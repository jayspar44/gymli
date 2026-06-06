export interface Routine { id: string; name: string; exercises?: unknown[] }
export interface TodayData {
  alreadyLoggedToday?: boolean;
  existingWorkout?: { exercises?: unknown[] };
}
export interface StreakData { currentStreak?: number }
export interface DailyTip { tip: string | null }
