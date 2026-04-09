import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const STORAGE_KEY = 'habit-tracker-data';
export const HABIT_LIMIT = 10;
export const DEFAULT_EMOJI = '✅';
export const MAX_NAME_LENGTH = 30;

export const EMPTY_STATE = Object.freeze({
  habits: [],
  completions: {},
  settings: { theme: 'dark' },
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
    });
  }

  const cleanCompletions = {};
  for (const [date, ids] of Object.entries(completions)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    if (!Array.isArray(ids)) continue;
    cleanCompletions[date] = ids.filter((id) => typeof id === 'string');
  }

  const theme =
    data.settings && (data.settings.theme === 'light' || data.settings.theme === 'dark')
      ? data.settings.theme
      : 'dark';

  return {
    habits: cleanHabits,
    completions: cleanCompletions,
    settings: { theme },
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
export function computeStreak(habitId, completions, today) {
  let streak = 0;
  let cursor = today;
  // If today not completed, allow streak to start from yesterday.
  if (!(completions[today] && completions[today].includes(habitId))) {
    cursor = addDays(today, -1);
  }
  while (completions[cursor] && completions[cursor].includes(habitId)) {
    streak += 1;
    cursor = addDays(cursor, -1);
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

  const addHabit = useCallback((name, emoji) => {
    setState((prev) => {
      if (prev.habits.length >= HABIT_LIMIT) return prev;
      const trimmed = name.trim().slice(0, MAX_NAME_LENGTH);
      if (!trimmed) return prev;
      const newHabit = {
        id: uuid(),
        name: trimmed,
        emoji: emoji && emoji.trim() ? emoji.trim() : DEFAULT_EMOJI,
        createdAt: toISODate(),
      };
      return { ...prev, habits: [...prev.habits, newHabit] };
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
   * Move a habit up (delta = -1) or down (delta = +1) in the ordering.
   */
  const reorderHabit = useCallback((id, delta) => {
    setState((prev) => {
      const idx = prev.habits.findIndex((h) => h.id === id);
      if (idx === -1) return prev;
      const target = idx + delta;
      if (target < 0 || target >= prev.habits.length) return prev;
      const habits = [...prev.habits];
      const [moved] = habits.splice(idx, 1);
      habits.splice(target, 0, moved);
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

  const todayCompletions = useMemo(
    () => state.completions[today] || [],
    [state.completions, today]
  );

  const streaks = useMemo(() => {
    const out = {};
    for (const h of state.habits) {
      out[h.id] = computeStreak(h.id, state.completions, today);
    }
    return out;
  }, [state.habits, state.completions, today]);

  const bestStreaks = useMemo(() => {
    const out = {};
    for (const h of state.habits) {
      out[h.id] = computeBestStreak(h.id, state.completions);
    }
    return out;
  }, [state.habits, state.completions]);

  const totalCheckIns = useMemo(() => {
    let total = 0;
    for (const ids of Object.values(state.completions)) total += ids.length;
    return total;
  }, [state.completions]);

  return {
    state,
    today,
    todayCompletions,
    streaks,
    bestStreaks,
    totalCheckIns,
    addHabit,
    deleteHabit,
    restoreHabit,
    reorderHabit,
    toggleCompletion,
    setTheme,
    toggleTheme,
    exportData,
    importData,
  };
}
