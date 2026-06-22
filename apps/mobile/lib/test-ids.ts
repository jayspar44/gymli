// Single source of truth for E2E selector IDs.
// React Native forwards `testID` -> `data-testid` (web) and the native
// accessibility id (Android). Playwright uses getByTestId(value); Maestro
// uses `id: value`. Both reference the SAME string from this file.

export const TestIds = {
  // login
  LOGIN_EMAIL: 'login-email',
  LOGIN_PASSWORD: 'login-password',
  LOGIN_SUBMIT: 'login-submit',

  // log tab
  NEW_ROUTINE_BTN: 'new-routine-btn',

  // routine editor
  ROUTINE_NAME_INPUT: 'routine-name-input',
  ROUTINE_ADD_EXERCISE_BTN: 'routine-add-exercise-btn',
  ROUTINE_SAVE_BTN: 'routine-save-btn',

  // exercise picker
  EXERCISE_SEARCH_INPUT: 'exercise-search-input',

  // session
  SESSION_ADD_EXERCISE_BTN: 'session-add-exercise-btn',
  SESSION_HEADER_END_BTN: 'session-header-end-btn',
  SESSION_END_BTN: 'session-end-btn',
  ADD_SET_BTN: 'add-set-btn',

  // workout summary
  SUMMARY_VOLUME: 'summary-volume',
  SUMMARY_SETS: 'summary-sets',
  SUMMARY_DONE_BTN: 'summary-done-btn',

  // conversational log
  LOG_INPUT: 'log-input',
  LOG_SEND_BTN: 'log-send-btn',

  // progress
  PROGRESS_TAB: 'progress-tab',
  STREAK_CALENDAR: 'streak-calendar',
  WEEK_STATS_CARD: 'week-stats-card',
  EXERCISE_CHART: 'exercise-chart',

  // profile
  PROFILE_DISPLAY_NAME_INPUT: 'profile-display-name-input',
  PROFILE_SAVED_INDICATOR: 'profile-saved-indicator',
} as const;

// Per-item ID helpers (lists / loops).
export const exerciseResultId = (i: number) => `exercise-result-${i}`;
export const routineRowId = (name: string) => `routine-row-${name}`;
export const setRowWeightId = (i: number) => `set-row-weight-${i}`;
export const setRowRepsId = (setIndex: number, fieldIndex: number) =>
  `set-row-reps-${setIndex}-${fieldIndex}`;
export const setRowCompleteId = (i: number) => `set-row-complete-${i}`;
export const strengthChipId = (exerciseId: string) => `strength-chip-${exerciseId}`;
// SegmentedControl emits per-option `${testID}-${value}`.
export const progressTabId = (value: string) => `${TestIds.PROGRESS_TAB}-${value}`;
