import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const STORAGE_KEY = 'habit-tracker-data';
export const HABIT_LIMIT = 10;
export const DEFAULT_EMOJI = '✅';
export const MAX_NAME_LENGTH = 30;
export const TIME_OF_DAY_OPTIONS = ['morning', 'afternoon', 'evening', 'anytime'];

export const FREEZE_TOKENS_PER_MONTH = 2;

export const EMPTY_STATE = Object.freeze({
  habits: [],
  completions: {},
  freezes: {},          // { 'YYYY-MM-DD': true }
  freezeTokens: {},     // { 'YYYY-MM': remaining }
  notes: {},            // { habitId: { 'YYYY-MM-DD': { text, mood } } }
  pauses: {},           // { habitId: { from: ISO, to: ISO|null } }
  settings: { theme: 'dark', reminderTime: null },
});

/**
 * ISO YYYY-MM-DD in the user's local timezone for the given Date (defaults to now).
 */
export function toISODate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Construct a Date for an ISO YYYY-MM-DD interpreted in the local timezone.
 */
export function fromISODate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Returns ISO date offset by `days` from the given ISO date.
 */
export function addDays(iso, days) {
  const dt = fromISODate(iso);
  dt.setDate(dt.getDate() + days);
  return toISODate(dt);
}

/**
 * Crypto-backed UUID with a fallback for older browsers.
 */
function uuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/**
 * Validate the shape of imported / loaded data. Returns a normalized state
 * or null if invalid.
 */
function validateState(data) {
  if (!data || typeof data !== 'object') return null;
  const habits = Array.isArray(data.habits) ? data.habits : null;
  const completions =
    data.completions && typeof data.completions === 'object' && !Array.isArray(data.completions)
      ? data.completions
      : null;
  if (!habits || !completions) return null;

  const cleanHabits = [];
  for (const h of habits) {
    if (!h || typeof h !== 'object') continue;
    if (typeof h.id !== 'string' || typeof h.name !== 'string') continue;
    cleanHabits.push({
      id: h.id,
      name: h.name.slice(0, MAX_NAME_LENGTH),
      emoji: typeof h.emoji === 'string' && h.emoji ? h.emoji : DEFAULT_EMOJI,
      createdAt: typeof h.createdAt === 'string' ? h.createdAt : toISODate(),
      timeOfDay: TIME_OF_DAY_OPTIONS.includes(h.timeOfDay) ? h.timeOfDay : 'anytime',
      target:
        h.target &&
        h.target.type === 'weekly' &&
        Number.isInteger(h.target.count) &&
        h.target.count >= 1 &&
        h.target.count <= 7
          ? { type: 'weekly', count: h.target.count }
          : { type: 'daily' },
    });
  }

  const cleanCompletions = {};
  for (const [date, ids] of Object.entries(completions)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    if (!Array.isArray(ids)) continue;
    cleanCompletions[date] = ids.filter((id) => typeof id === 'string');
  }

  // Validate freezes map
  const cleanFreezes = {};
  if (data.freezes && typeof data.freezes === 'object' && !Array.isArray(data.freezes)) {
    for (const [date, val] of Object.entries(data.freezes)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(date) && val === true) {
        cleanFreezes[date] = true;
      }
    }
  }

  // Validate freeze tokens map
  const cleanFreezeTokens = {};
  if (data.freezeTokens && typeof data.freezeTokens === 'object' && !Array.isArray(data.freezeTokens)) {
    for (const [month, count] of Object.entries(data.freezeTokens)) {
      if (/^\d{4}-\d{2}$/.test(month) && typeof count === 'number') {
        cleanFreezeTokens[month] = Math.max(0, Math.min(FREEZE_TOKENS_PER_MONTH, count));
      }
    }
  }

  const theme =
    data.settings && (data.settings.theme === 'light' || data.settings.theme === 'dark')
      ? data.settings.theme
      : 'dark';

  const reminderTime =
    data.settings &&
    typeof data.settings.reminderTime === 'string' &&
    /^\d{2}:\d{2}$/.test(data.settings.reminderTime)
      ? data.settings.reminderTime
      : null;

  // Validate notes
  const cleanNotes = {};
  if (data.notes && typeof data.notes === 'object' && !Array.isArray(data.notes)) {
    for (const [habitId, dateMap] of Object.entries(data.notes)) {
      if (typeof habitId !== 'string') continue;
      if (!dateMap || typeof dateMap !== 'object') continue;
      cleanNotes[habitId] = {};
      for (const [date, entry] of Object.entries(dateMap)) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
        if (!entry || typeof entry !== 'object') continue;
        cleanNotes[habitId][date] = {
          text: typeof entry.text === 'string' ? entry.text.slice(0, 280) : '',
          mood: typeof entry.mood === 'string' ? entry.mood : '',
        };
      }
    }
  }

  // Validate pauses
  const cleanPauses = {};
  if (data.pauses && typeof data.pauses === 'object' && !Array.isArray(data.pauses)) {
    for (const [habitId, pause] of Object.entries(data.pauses)) {
      if (typeof habitId !== 'string') continue;
      if (!pause || typeof pause !== 'object') continue;
      if (typeof pause.from !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(pause.from)) continue;
      const to = pause.to === null ? null
        : (typeof pause.to === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(pause.to)) ? pause.to : null;
      cleanPauses[habitId] = { from: pause.from, to };
    }
  }

  return {
    habits: cleanHabits,
    completions: cleanCompletions,
    freezes: cleanFreezes,
    freezeTokens: cleanFreezeTokens,
    notes: cleanNotes,
    pauses: cleanPauses,
    settings: { theme, reminderTime },
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY_STATE, settings: { ...EMPTY_STATE.settings } };
    const parsed = JSON.parse(raw);
    const validated = validateState(parsed);
    if (!validated) return { ...EMPTY_STATE, settings: { ...EMPTY_STATE.settings } };
    return validated;
  } catch (err) {
    console.warn('Failed to load habit data from localStorage:', err);
    return { ...EMPTY_STATE, settings: { ...EMPTY_STATE.settings } };
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('Failed to save habit data to localStorage:', err);
  }
}

/**
 * Compute current streak (consecutive days ending today/yesterday) for a habit.
 * If the habit was not completed today, the streak still counts back from
 * yesterday so the user doesn't lose their streak partway through the day.
 */
/**
 * Returns true if a habit is paused on the given date.
 */
export function isHabitPaused(habitId, date, pauses) {
  if (!pauses || !pauses[habitId]) return false;
  const p = pauses[habitId];
  if (date < p.from) return false;
  if (p.to !== null && date > p.to) return false;
  return true;
}

export function computeStreak(habitId, completions, today, freezes = {}, pauses = {}) {
  let streak = 0;
  let cursor = today;
  // If today not completed and not paused, allow streak to start from yesterday.
  const todayDone = completions[today] && completions[today].includes(habitId);
  const todayPaused = isHabitPaused(habitId, today, pauses);
  if (!todayDone && !todayPaused) {
    cursor = addDays(today, -1);
  }
  while (true) {
    const completed = completions[cursor] && completions[cursor].includes(habitId);
    const frozen = freezes[cursor] === true;
    const paused = isHabitPaused(habitId, cursor, pauses);
    if (completed) {
      streak += 1;
    } else if ((frozen || paused) && streak > 0) {
      // Freeze/pause preserves streak without incrementing
    } else {
      break;
    }
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/**
 * ISO date for the Monday of the week containing the given ISO date.
 */
export function startOfWeek(iso) {
  const dt = fromISODate(iso);
  const day = dt.getDay(); // 0=Sun..6=Sat
  const offset = day === 0 ? -6 : 1 - day; // shift to Monday
  dt.setDate(dt.getDate() + offset);
  return toISODate(dt);
}

/**
 * Number of days in the week containing `anyIsoInWeek` where `habitId`
 * was completed.
 */
export function weekCompletionCount(habitId, completions, anyIsoInWeek) {
  const start = startOfWeek(anyIsoInWeek);
  let count = 0;
  for (let i = 0; i < 7; i++) {
    const d = addDays(start, i);
    if ((completions[d] || []).includes(habitId)) count += 1;
  }
  return count;
}

/**
 * 0..1 completion rate for a habit across the last `windowDays` days.
 * Days before the habit was created don't count toward the denominator.
 * Returns null if the habit has no qualifying days yet.
 */
export function computeCompletionRate(habit, completions, today, windowDays = 30) {
  const start = addDays(today, -(windowDays - 1));
  let possible = 0;
  let done = 0;
  for (let i = 0; i < windowDays; i++) {
    const d = addDays(start, i);
    if (habit.createdAt > d) continue;
    possible += 1;
    if ((completions[d] || []).includes(habit.id)) done += 1;
  }
  if (possible === 0) return null;
  return done / possible;
}

/**
 * Consecutive weeks (ending with the current week) where the habit met its
 * weekly target. If the current week's target isn't yet met, it doesn't
 * count but the streak still includes prior weeks.
 */
export function computeWeeklyGoalStreak(habit, completions, today) {
  let streak = 0;
  const currentWeek = startOfWeek(today);
  const currCount = weekCompletionCount(habit.id, completions, currentWeek);
  if (currCount >= habit.target.count) {
    streak = 1;
  }
  let weekIso = addDays(currentWeek, -7);
  const createdWeek = startOfWeek(habit.createdAt);
  while (weekIso >= createdWeek) {
    const count = weekCompletionCount(habit.id, completions, weekIso);
    if (count >= habit.target.count) {
      streak += 1;
      weekIso = addDays(weekIso, -7);
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Longest consecutive-day run for a habit across all recorded history.
 */
export function computeBestStreak(habitId, completions) {
  const dates = Object.keys(completions)
    .filter((d) => completions[d].includes(habitId))
    .sort();
  if (dates.length === 0) return 0;
  let best = 1;
  let run = 1;
  for (let i = 1; i < dates.length; i++) {
    if (addDays(dates[i - 1], 1) === dates[i]) {
      run += 1;
      if (run > best) best = run;
    } else {
      run = 1;
    }
  }
  return best;
}

export default function useHabits() {
  const [state, setState] = useState(loadState);
  const [today, setToday] = useState(() => toISODate());
  const isFirstRender = useRef(true);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Persist on every change.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      // Still write to normalize the stored shape.
      saveState(state);
      return;
    }
    saveState(state);
  }, [state]);

  // Apply theme to <html>.
  useEffect(() => {
    const root = document.documentElement;
    if (state.settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [state.settings.theme]);

  // Recompute "today" when tab regains visibility or window focuses.
  useEffect(() => {
    const refresh = () => {
      const next = toISODate();
      setToday((prev) => (prev === next ? prev : next));
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', refresh);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  const addHabit = useCallback((name, emoji, options = {}) => {
    setState((prev) => {
      if (prev.habits.length >= HABIT_LIMIT) return prev;
      const trimmed = name.trim().slice(0, MAX_NAME_LENGTH);
      if (!trimmed) return prev;
      const timeOfDay = TIME_OF_DAY_OPTIONS.includes(options.timeOfDay)
        ? options.timeOfDay
        : 'anytime';
      let target = { type: 'daily' };
      if (
        options.target &&
        options.target.type === 'weekly' &&
        Number.isInteger(options.target.count) &&
        options.target.count >= 1 &&
        options.target.count <= 7
      ) {
        target = { type: 'weekly', count: options.target.count };
      }
      const newHabit = {
        id: uuid(),
        name: trimmed,
        emoji: emoji && emoji.trim() ? emoji.trim() : DEFAULT_EMOJI,
        createdAt: toISODate(),
        timeOfDay,
        target,
      };
      return { ...prev, habits: [...prev.habits, newHabit] };
    });
  }, []);

  /**
   * Patch an existing habit in place. Only known fields are applied and
   * values are validated the same way as `addHabit`.
   */
  const updateHabit = useCallback((id, updates) => {
    setState((prev) => {
      const habits = prev.habits.map((h) => {
        if (h.id !== id) return h;
        const next = { ...h };
        if (typeof updates.name === 'string') {
          const trimmed = updates.name.trim().slice(0, MAX_NAME_LENGTH);
          if (trimmed) next.name = trimmed;
        }
        if (typeof updates.emoji === 'string' && updates.emoji.trim()) {
          next.emoji = updates.emoji.trim();
        }
        if (TIME_OF_DAY_OPTIONS.includes(updates.timeOfDay)) {
          next.timeOfDay = updates.timeOfDay;
        }
        if (updates.target) {
          if (updates.target.type === 'daily') {
            next.target = { type: 'daily' };
          } else if (
            updates.target.type === 'weekly' &&
            Number.isInteger(updates.target.count) &&
            updates.target.count >= 1 &&
            updates.target.count <= 7
          ) {
            next.target = { type: 'weekly', count: updates.target.count };
          }
        }
        return next;
      });
      return { ...prev, habits };
    });
  }, []);

  /**
   * Deletes a habit and its completion history. Returns a snapshot object
   * the caller can pass back to `restoreHabit` to undo within a grace period.
   */
  const deleteHabit = useCallback((id) => {
    const prev = stateRef.current;
    const habit = prev.habits.find((h) => h.id === id);
    if (!habit) return null;
    const index = prev.habits.findIndex((h) => h.id === id);
    const dates = [];
    for (const [date, ids] of Object.entries(prev.completions)) {
      if (ids.includes(id)) dates.push(date);
    }
    const habits = prev.habits.filter((h) => h.id !== id);
    const completions = {};
    for (const [date, ids] of Object.entries(prev.completions)) {
      const filtered = ids.filter((cid) => cid !== id);
      if (filtered.length > 0) completions[date] = filtered;
    }
    setState({ ...prev, habits, completions });
    return { habit, index, dates };
  }, []);

  /**
   * Restore a previously-deleted habit from a snapshot returned by `deleteHabit`.
   */
  const restoreHabit = useCallback((snapshot) => {
    if (!snapshot || !snapshot.habit) return;
    setState((prev) => {
      // Ignore if the user already re-added something with the same id.
      if (prev.habits.some((h) => h.id === snapshot.habit.id)) return prev;
      if (prev.habits.length >= HABIT_LIMIT) return prev;
      const habits = [...prev.habits];
      const insertAt = Math.min(snapshot.index, habits.length);
      habits.splice(insertAt, 0, snapshot.habit);
      const completions = { ...prev.completions };
      for (const date of snapshot.dates) {
        const existing = completions[date] || [];
        if (!existing.includes(snapshot.habit.id)) {
          completions[date] = [...existing, snapshot.habit.id];
        }
      }
      return { ...prev, habits, completions };
    });
  }, []);

  /**
   * Move a habit up (delta = -1) or down (delta = +1) among its neighbors
   * in the same time-of-day group. Swaps with the nearest same-group
   * neighbor even if other groups are interleaved in the flat array.
   */
  const reorderHabit = useCallback((id, delta) => {
    setState((prev) => {
      const idx = prev.habits.findIndex((h) => h.id === id);
      if (idx === -1) return prev;
      const currTod = prev.habits[idx].timeOfDay || 'anytime';
      let targetIdx = -1;
      if (delta < 0) {
        for (let i = idx - 1; i >= 0; i--) {
          if ((prev.habits[i].timeOfDay || 'anytime') === currTod) {
            targetIdx = i;
            break;
          }
        }
      } else {
        for (let i = idx + 1; i < prev.habits.length; i++) {
          if ((prev.habits[i].timeOfDay || 'anytime') === currTod) {
            targetIdx = i;
            break;
          }
        }
      }
      if (targetIdx === -1) return prev;
      const habits = [...prev.habits];
      [habits[idx], habits[targetIdx]] = [habits[targetIdx], habits[idx]];
      return { ...prev, habits };
    });
  }, []);

  const toggleCompletion = useCallback((id, date) => {
    setState((prev) => {
      const targetDate = date || toISODate();
      const list = prev.completions[targetDate] || [];
      const next = { ...prev.completions };
      if (list.includes(id)) {
        const filtered = list.filter((cid) => cid !== id);
        if (filtered.length > 0) {
          next[targetDate] = filtered;
        } else {
          delete next[targetDate];
        }
      } else {
        next[targetDate] = [...list, id];
      }
      return { ...prev, completions: next };
    });
  }, []);

  const setTheme = useCallback((theme) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, theme: theme === 'light' ? 'light' : 'dark' },
    }));
  }, []);

  const toggleTheme = useCallback(() => {
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        theme: prev.settings.theme === 'dark' ? 'light' : 'dark',
      },
    }));
  }, []);

  const exportData = useCallback(() => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `habit-tracker-${toISODate()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [state]);

  const importData = useCallback((file) => {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('No file provided'));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result);
          const validated = validateState(parsed);
          if (!validated) {
            reject(new Error('Invalid file format'));
            return;
          }
          setState(validated);
          resolve(validated);
        } catch (err) {
          reject(new Error('Failed to parse JSON'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }, []);

  const setNote = useCallback((habitId, date, text, mood) => {
    setState((prev) => {
      const habitNotes = prev.notes?.[habitId] || {};
      if (!text && !mood) {
        // Remove note if both empty
        const { [date]: _removed, ...rest } = habitNotes;
        const notes = { ...prev.notes, [habitId]: rest };
        return { ...prev, notes };
      }
      const notes = {
        ...prev.notes,
        [habitId]: {
          ...habitNotes,
          [date]: { text: (text || '').slice(0, 280), mood: mood || '' },
        },
      };
      return { ...prev, notes };
    });
  }, []);

  const pauseHabit = useCallback((id, from, to) => {
    setState((prev) => ({
      ...prev,
      pauses: { ...prev.pauses, [id]: { from, to: to || null } },
    }));
  }, []);

  const resumeHabit = useCallback((id) => {
    setState((prev) => {
      const { [id]: _removed, ...rest } = prev.pauses || {};
      return { ...prev, pauses: rest };
    });
  }, []);

  const setReminderTime = useCallback((time) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, reminderTime: time },
    }));
  }, []);

  // --- Streak freeze auto-use ---
  // On each "today" change (i.e. new day), check if yesterday was missed entirely
  // and auto-consume a freeze token if available.
  useEffect(() => {
    if (isFirstRender.current) return;
    const st = stateRef.current;
    if (st.habits.length === 0) return;
    const yest = addDays(today, -1);
    const yestCompletions = st.completions[yest] || [];
    // Only auto-freeze if at least one daily habit existed yesterday and none were completed
    const dailyHabitsYesterday = st.habits.filter(
      (h) => (!h.target || h.target.type === 'daily') && h.createdAt <= yest
    );
    if (dailyHabitsYesterday.length === 0) return;
    const anyDoneYesterday = dailyHabitsYesterday.some((h) => yestCompletions.includes(h.id));
    if (anyDoneYesterday) return;
    // Already frozen?
    if (st.freezes && st.freezes[yest]) return;
    // Check token availability for that month
    const month = yest.slice(0, 7); // 'YYYY-MM'
    const tokens = st.freezeTokens && st.freezeTokens[month] != null
      ? st.freezeTokens[month]
      : FREEZE_TOKENS_PER_MONTH;
    if (tokens <= 0) return;
    // Auto-use a freeze
    setState((prev) => ({
      ...prev,
      freezes: { ...prev.freezes, [yest]: true },
      freezeTokens: { ...prev.freezeTokens, [month]: tokens - 1 },
    }));
  }, [today]);

  const todayCompletions = useMemo(
    () => state.completions[today] || [],
    [state.completions, today]
  );

  const streaks = useMemo(() => {
    const out = {};
    for (const h of state.habits) {
      if (h.target && h.target.type === 'weekly') {
        out[h.id] = computeWeeklyGoalStreak(h, state.completions, today);
      } else {
        out[h.id] = computeStreak(h.id, state.completions, today, state.freezes, state.pauses);
      }
    }
    return out;
  }, [state.habits, state.completions, state.freezes, today]);

  const bestStreaks = useMemo(() => {
    const out = {};
    for (const h of state.habits) {
      out[h.id] = computeBestStreak(h.id, state.completions);
    }
    return out;
  }, [state.habits, state.completions]);

  const completionRates = useMemo(() => {
    const out = {};
    for (const h of state.habits) {
      out[h.id] = computeCompletionRate(h, state.completions, today, 30);
    }
    return out;
  }, [state.habits, state.completions, today]);

  const weekProgress = useMemo(() => {
    const out = {};
    for (const h of state.habits) {
      if (h.target && h.target.type === 'weekly') {
        out[h.id] = {
          done: weekCompletionCount(h.id, state.completions, today),
          goal: h.target.count,
        };
      }
    }
    return out;
  }, [state.habits, state.completions, today]);

  const totalCheckIns = useMemo(() => {
    let total = 0;
    for (const ids of Object.values(state.completions)) total += ids.length;
    return total;
  }, [state.completions]);

  const currentMonthFreezeTokens = useMemo(() => {
    const month = today.slice(0, 7);
    if (state.freezeTokens && state.freezeTokens[month] != null) {
      return state.freezeTokens[month];
    }
    return FREEZE_TOKENS_PER_MONTH;
  }, [state.freezeTokens, today]);

  /**
   * Replace the entire state (used by Firestore sync on login).
   * Validates the incoming data to ensure shape safety.
   */
  const replaceState = useCallback((data) => {
    const validated = validateState(data);
    if (validated) setState(validated);
  }, []);

  return {
    state,
    today,
    todayCompletions,
    streaks,
    bestStreaks,
    completionRates,
    weekProgress,
    totalCheckIns,
    currentMonthFreezeTokens,
    addHabit,
    updateHabit,
    replaceState,
    deleteHabit,
    restoreHabit,
    reorderHabit,
    toggleCompletion,
    setTheme,
    toggleTheme,
    setReminderTime,
    setNote,
    pauseHabit,
    resumeHabit,
    exportData,
    importData,
  };
}
