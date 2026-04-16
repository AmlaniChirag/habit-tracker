import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useHabits, { HABIT_LIMIT, addDays, fromISODate } from './hooks/useHabits.js';
import useAuth from './hooks/useAuth.js';
import useFirestoreSync from './hooks/useFirestoreSync.js';
import useReminder from './hooks/useReminder.js';
import HabitCard from './components/HabitCard.jsx';
import AddHabitModal from './components/AddHabitModal.jsx';
import ConfirmDeleteModal from './components/ConfirmDeleteModal.jsx';
import PastDaysModal from './components/PastDaysModal.jsx';
import HabitDetailDrawer from './components/HabitDetailDrawer.jsx';
import Heatmap from './components/Heatmap.jsx';
import Sparkline from './components/Sparkline.jsx';
import TrendChart from './components/TrendChart.jsx';
import WeeklySummary from './components/WeeklySummary.jsx';
import Settings from './components/Settings.jsx';
import ProgressRing from './components/ProgressRing.jsx';
import Toast from './components/Toast.jsx';
import ShortcutsOverlay from './components/ShortcutsOverlay.jsx';

const ENCOURAGEMENTS = [
  'Pick one to start the day.',
  'A small win counts.',
  "What's one thing you can do now?",
  'Tiny steps, big change.',
];

const STREAK_MILESTONES = [7, 14, 30, 60, 100, 365];

const SECTION_ORDER = ['morning', 'afternoon', 'evening', 'anytime'];
const SECTION_LABELS = {
  morning: { label: 'Morning', icon: '🌅' },
  afternoon: { label: 'Afternoon', icon: '☀️' },
  evening: { label: 'Evening', icon: '🌙' },
  anytime: { label: 'Anytime', icon: '∞' },
};

function formatPrettyDate(iso) {
  const dt = fromISODate(iso);
  return dt.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function SectionHeader({ eyebrow, title, action }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        {title && <div className="mt-0.5 text-sm text-neutral-700 dark:text-neutral-300">{title}</div>}
      </div>
      {action}
    </div>
  );
}

export default function App() {
  const {
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
    deleteHabit,
    restoreHabit,
    reorderHabit,
    toggleCompletion,
    toggleTheme,
    setReminderTime,
    exportData,
    importData,
    replaceState,
  } = useHabits();

  const { user, loading: authLoading, signIn, logOut } = useAuth();
  useFirestoreSync(state, user, replaceState);

  const [addOpen, setAddOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [pastDaysOpen, setPastDaysOpen] = useState(false);
  const [detailHabit, setDetailHabit] = useState(null);
  const [toast, setToast] = useState(null);
  const toastIdRef = useRef(0);

  const { habits, completions, settings } = state;

  const habitsLeftCount = habits.length - todayCompletions.filter((id) => habits.some((h) => h.id === id)).length;
  const {
    requestPermissionAndSetTime,
    disableReminder,
    notificationsSupported,
    permissionDenied,
  } = useReminder(settings.reminderTime, habitsLeftCount, setReminderTime);

  const yesterday = useMemo(() => addDays(today, -1), [today]);
  const yesterdayCompletions = completions[yesterday] || [];

  const doneCount = todayCompletions.filter((id) =>
    habits.some((h) => h.id === id)
  ).length;
  const totalCount = habits.length;
  const atLimit = habits.length >= HABIT_LIMIT;
  const progressValue = totalCount > 0 ? doneCount / totalCount : 0;
  const isPerfectDay = totalCount > 0 && doneCount === totalCount;

  const encouragement = useMemo(() => {
    const idx = today.split('-').reduce((a, b) => a + Number(b), 0) % ENCOURAGEMENTS.length;
    return ENCOURAGEMENTS[idx];
  }, [today]);

  const hasHabits = habits.length > 0;

  // Group habits by time-of-day, preserving relative order within each group.
  const grouped = useMemo(() => {
    const buckets = { morning: [], afternoon: [], evening: [], anytime: [] };
    for (const h of habits) {
      const tod = SECTION_ORDER.includes(h.timeOfDay) ? h.timeOfDay : 'anytime';
      buckets[tod].push(h);
    }
    return SECTION_ORDER.map((key) => ({ key, habits: buckets[key] })).filter(
      (g) => g.habits.length > 0
    );
  }, [habits]);

  // Flat list in visual (grouped) order — drives keyboard hotkeys 1-9.
  const visualOrderHabits = useMemo(
    () => grouped.flatMap((g) => g.habits),
    [grouped]
  );

  // Only show section headers when at least one non-anytime group exists.
  const hasNonAnytime = grouped.some((g) => g.key !== 'anytime');

  // Keep the open detail drawer fresh if the underlying habit is edited or deleted.
  const liveDetailHabit = useMemo(() => {
    if (!detailHabit) return null;
    return habits.find((h) => h.id === detailHabit.id) || null;
  }, [detailHabit, habits]);

  // If the focused habit disappears (e.g. deleted), dismiss the drawer.
  useEffect(() => {
    if (detailHabit && !liveDetailHabit) setDetailHabit(null);
  }, [detailHabit, liveDetailHabit]);

  // "Missed yesterday and not done today" — daily habits only, that existed yesterday.
  const needsAttentionMap = useMemo(() => {
    const out = {};
    for (const h of habits) {
      if (h.target && h.target.type === 'weekly') continue;
      if (h.createdAt > yesterday) continue;
      const missedYesterday = !yesterdayCompletions.includes(h.id);
      const notDoneToday = !todayCompletions.includes(h.id);
      out[h.id] = missedYesterday && notDoneToday;
    }
    return out;
  }, [habits, yesterday, yesterdayCompletions, todayCompletions]);

  // Was yesterday frozen (streak freeze auto-used)?
  const yesterdayFrozen = !!(state.freezes && state.freezes[yesterday]);

  const memberSince = useMemo(() => {
    if (habits.length === 0) return null;
    const earliest = habits.reduce((min, h) => (h.createdAt < min ? h.createdAt : min), habits[0].createdAt);
    const dt = fromISODate(earliest);
    return dt.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  }, [habits]);

  // --- Toasts --------------------------------------------------------------
  const showToast = useCallback((message, options = {}) => {
    toastIdRef.current += 1;
    setToast({
      id: toastIdRef.current,
      message,
      action: options.action,
      duration: options.duration,
    });
  }, []);

  const dismissToast = useCallback((id) => {
    setToast((curr) => (curr && curr.id === id ? null : curr));
  }, []);

  // --- Streak freeze notification ------------------------------------------
  const prevFreezeCountRef = useRef(null);
  useEffect(() => {
    const freezeCount = state.freezes ? Object.keys(state.freezes).length : 0;
    if (prevFreezeCountRef.current === null) {
      prevFreezeCountRef.current = freezeCount;
      return;
    }
    if (freezeCount > prevFreezeCountRef.current) {
      showToast('🧊 Streak freeze used — your streaks are safe!', { duration: 5000 });
    }
    prevFreezeCountRef.current = freezeCount;
  }, [state.freezes, showToast]);

  // --- Milestone detection -------------------------------------------------
  const prevStreaksRef = useRef(null);
  useEffect(() => {
    if (prevStreaksRef.current === null) {
      prevStreaksRef.current = { ...streaks };
      return;
    }
    const prev = prevStreaksRef.current;
    for (const h of habits) {
      const before = prev[h.id] ?? 0;
      const after = streaks[h.id] || 0;
      if (after > before && STREAK_MILESTONES.includes(after)) {
        showToast(`🎉 ${after}-day streak on ${h.emoji} ${h.name}!`, { duration: 6000 });
      }
    }
    prevStreaksRef.current = { ...streaks };
  }, [streaks, habits, showToast]);

  const prevPerfectRef = useRef(null);
  useEffect(() => {
    if (prevPerfectRef.current === null) {
      prevPerfectRef.current = isPerfectDay;
      return;
    }
    if (isPerfectDay && !prevPerfectRef.current) {
      showToast('✨ Perfect day — all habits done!', { duration: 5000 });
    }
    prevPerfectRef.current = isPerfectDay;
  }, [isPerfectDay, showToast]);

  // --- Actions -------------------------------------------------------------
  const handleDelete = useCallback(
    (id) => {
      const snapshot = deleteHabit(id);
      if (!snapshot) return;
      showToast(`Deleted ${snapshot.habit.emoji} ${snapshot.habit.name}`, {
        action: {
          label: 'Undo',
          onClick: () => restoreHabit(snapshot),
        },
        duration: 6000,
      });
    },
    [deleteHabit, restoreHabit, showToast]
  );

  const handleToggleYesterday = useCallback(
    (id) => {
      toggleCompletion(id, yesterday);
      const habit = habits.find((h) => h.id === id);
      if (habit) {
        const wasCompleted = yesterdayCompletions.includes(id);
        showToast(
          wasCompleted
            ? `Removed yesterday's ${habit.name}`
            : `Marked ${habit.name} done for yesterday`,
          { duration: 3500 }
        );
      }
    },
    [toggleCompletion, yesterday, yesterdayCompletions, habits, showToast]
  );

  // --- Keyboard shortcuts --------------------------------------------------
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      // Ignore when typing in a form field.
      if (
        t instanceof HTMLInputElement ||
        t instanceof HTMLTextAreaElement ||
        t instanceof HTMLSelectElement ||
        (t && t.isContentEditable)
      ) {
        return;
      }
      // Ignore when a modal is open (except ? to show help).
      const modalOpen =
        addOpen ||
        editingHabit ||
        deleteTarget ||
        shortcutsOpen ||
        pastDaysOpen ||
        detailHabit;

      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        setShortcutsOpen((v) => !v);
        return;
      }

      if (modalOpen) return;

      if (e.key >= '1' && e.key <= '9') {
        const idx = parseInt(e.key, 10) - 1;
        if (visualOrderHabits[idx]) {
          e.preventDefault();
          toggleCompletion(visualOrderHabits[idx].id);
        }
        return;
      }

      if (e.key === 'n' || e.key === 'N') {
        if (!atLimit) {
          e.preventDefault();
          setAddOpen(true);
        }
        return;
      }

      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        toggleTheme();
        return;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    visualOrderHabits,
    addOpen,
    editingHabit,
    deleteTarget,
    shortcutsOpen,
    pastDaysOpen,
    detailHabit,
    atLimit,
    toggleCompletion,
    toggleTheme,
  ]);

  // --- Auth gates -----------------------------------------------------------
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
          <div className="mt-4 text-sm text-muted">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-accent-500/15 text-4xl">
            ✅
          </div>
          <h1 className="mt-6 text-2xl font-semibold">Habit Tracker</h1>
          <p className="mt-2 text-sm text-muted leading-relaxed">
            Build streaks. Stay consistent.<br />
            Your data syncs across all your devices.
          </p>
          <button
            type="button"
            onClick={signIn}
            className="mt-8 inline-flex w-full items-center justify-center gap-3 rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-medium shadow-sm hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-750"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>
          <p className="mt-4 text-[11px] text-muted">
            Free &middot; No ads &middot; Your data stays yours
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 sm:pt-14">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 sm:gap-5">
            {hasHabits && (
              <div className="relative hidden sm:block">
                <ProgressRing value={progressValue} size={80} stroke={5} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold tabular leading-none">{Math.round(progressValue * 100)}</span>
                  <span className="text-xs font-semibold text-muted">%</span>
                </div>
              </div>
            )}
            <div>
              <div className="eyebrow">{formatPrettyDate(today)}</div>
              <h1 className="mt-1 text-[28px] font-semibold leading-tight sm:text-[34px]">
                {hasHabits ? (
                  <>
                    <span className="tabular">{doneCount}</span>
                    <span className="text-muted"> of </span>
                    <span className="tabular">{totalCount}</span>
                    <span className="text-muted"> done</span>
                    {isPerfectDay && (
                      <span className="ml-2 inline-block animate-pulseScale" aria-label="Perfect day">✨</span>
                    )}
                  </>
                ) : (
                  <>Build a habit.</>
                )}
              </h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setShortcutsOpen(true)}
              className="hidden rounded-xl border border-neutral-200/80 bg-white/60 px-2.5 py-2 text-xs font-medium text-muted hover:bg-neutral-100 sm:inline-flex dark:border-neutral-800 dark:bg-neutral-900/60 dark:hover:bg-neutral-800"
              aria-label="Show keyboard shortcuts"
              title="Keyboard shortcuts"
            >
              <kbd className="font-mono">?</kbd>
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-xl border border-neutral-200/80 bg-white/60 p-2 text-sm hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900/60 dark:hover:bg-neutral-800"
              aria-label={`Switch to ${settings.theme === 'dark' ? 'light' : 'dark'} theme`}
            >
              {settings.theme === 'dark' ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                  <path d="M10 2a.75.75 0 01.75.75V4a.75.75 0 01-1.5 0V2.75A.75.75 0 0110 2zM10 15a.75.75 0 01.75.75V17a.75.75 0 01-1.5 0v-1.25A.75.75 0 0110 15zM4.5 10a.75.75 0 01-.75.75H2.5a.75.75 0 010-1.5h1.25A.75.75 0 014.5 10zM18 10a.75.75 0 01-.75.75H16a.75.75 0 010-1.5h1.25A.75.75 0 0118 10zM5.05 5.05a.75.75 0 011.06 0l.88.88a.75.75 0 01-1.06 1.06l-.88-.88a.75.75 0 010-1.06zM13.01 13.01a.75.75 0 011.06 0l.88.88a.75.75 0 11-1.06 1.06l-.88-.88a.75.75 0 010-1.06zM5.05 14.95a.75.75 0 010-1.06l.88-.88a.75.75 0 011.06 1.06l-.88.88a.75.75 0 01-1.06 0zM13.01 6.99a.75.75 0 010-1.06l.88-.88a.75.75 0 111.06 1.06l-.88.88a.75.75 0 01-1.06 0zM10 6a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                  <path d="M7.455 2.004a.75.75 0 01.26.77 7 7 0 009.958 7.967.75.75 0 011.067.853A8.5 8.5 0 116.647 1.921a.75.75 0 01.808.083z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile: big progress number + progress bar */}
        {hasHabits && (
          <div className="mt-5 sm:hidden">
            <div className="flex items-end justify-center gap-1">
              <span className="text-6xl font-bold tabular leading-none tracking-tight">
                {Math.round(progressValue * 100)}
              </span>
              <span className="mb-1 text-2xl font-semibold text-muted">%</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
              <div
                className="h-full rounded-full bg-accent-500 transition-all duration-500 ease-out"
                style={{ width: `${progressValue * 100}%` }}
                aria-hidden="true"
              />
            </div>
            {isPerfectDay && (
              <div className="mt-2 text-center text-sm font-medium text-accent-500">
                Perfect day!
              </div>
            )}
          </div>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-5 lg:gap-6">
          {/* LEFT: daily check-in */}
          <section className="lg:col-span-2">
            <SectionHeader
              eyebrow="Today"
              action={
                hasHabits ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPastDaysOpen(true)}
                      className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white/60 px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900/60 dark:hover:bg-neutral-800"
                      aria-label="Catch up on past days"
                      title="Catch up on past days"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .2.08.39.22.53l3 3a.75.75 0 101.06-1.06l-2.78-2.78V5z" clipRule="evenodd" />
                      </svg>
                      Catch up
                    </button>
                    {!atLimit && (
                      <button
                        type="button"
                        onClick={() => setAddOpen(true)}
                        className="rounded-lg bg-accent-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm shadow-accent-500/20 hover:bg-accent-600"
                      >
                        + Add habit
                      </button>
                    )}
                  </div>
                ) : null
              }
            />

            {!hasHabits ? (
              <div className="surface flex flex-col items-center rounded-2xl p-10 text-center">
                <div className="mb-4 text-5xl" aria-hidden="true">🌱</div>
                <h3 className="text-lg font-semibold">Start small.</h3>
                <p className="mt-1.5 max-w-xs text-sm text-muted">
                  Pick one habit you'd like to do every day. You can add more later.
                </p>
                <button
                  type="button"
                  onClick={() => setAddOpen(true)}
                  className="mt-6 rounded-xl bg-accent-500 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-accent-500/20 hover:bg-accent-600"
                >
                  Add your first habit
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {(() => {
                  let globalIdx = -1;
                  return grouped.map((group) => (
                    <div key={group.key} className="space-y-2.5">
                      {hasNonAnytime && (
                        <div className="flex items-center gap-2 px-1 pt-1">
                          <span className="text-sm" aria-hidden="true">
                            {SECTION_LABELS[group.key].icon}
                          </span>
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                            {SECTION_LABELS[group.key].label}
                          </span>
                          <span className="text-[11px] text-muted tabular">
                            · {group.habits.filter((h) => todayCompletions.includes(h.id)).length}/
                            {group.habits.length}
                          </span>
                        </div>
                      )}
                      {group.habits.map((h, localIdx) => {
                        globalIdx += 1;
                        return (
                          <HabitCard
                            key={h.id}
                            habit={h}
                            index={globalIdx}
                            completed={todayCompletions.includes(h.id)}
                            completedYesterday={yesterdayCompletions.includes(h.id)}
                            canMoveUp={localIdx > 0}
                            canMoveDown={localIdx < group.habits.length - 1}
                            streak={streaks[h.id] || 0}
                            bestStreak={bestStreaks[h.id] || 0}
                            completionRate={completionRates[h.id]}
                            weekProgress={weekProgress[h.id]}
                            needsAttention={!!needsAttentionMap[h.id]}
                            frozen={yesterdayFrozen && !yesterdayCompletions.includes(h.id)}
                            onToggle={(id) => toggleCompletion(id)}
                            onToggleYesterday={handleToggleYesterday}
                            onEdit={setEditingHabit}
                            onDelete={(habit) => setDeleteTarget(habit)}
                            onMove={reorderHabit}
                            onOpenDetail={setDetailHabit}
                          />
                        );
                      })}
                    </div>
                  ));
                })()}

                {doneCount === 0 && (
                  <div className="rounded-xl border border-dashed border-neutral-300 px-4 py-3 text-center text-xs text-muted dark:border-neutral-700">
                    {encouragement}
                  </div>
                )}

                {atLimit && (
                  <div className="rounded-xl border border-dashed border-neutral-300 px-4 py-3 text-center text-xs text-muted dark:border-neutral-700">
                    You've hit the {HABIT_LIMIT}-habit limit. Focus is a feature.
                  </div>
                )}
              </div>
            )}
          </section>

          {/* RIGHT: dashboard */}
          <section className="space-y-5 lg:col-span-3">
            <WeeklySummary habits={habits} completions={completions} today={today} />

            <div className="surface rounded-2xl p-5 sm:p-6">
              <SectionHeader eyebrow="Last 90 days" title="Daily completion intensity" />
              <Heatmap habits={habits} completions={completions} today={today} />
            </div>

            <div className="surface rounded-2xl p-5 sm:p-6">
              <SectionHeader eyebrow="60-day trend" title="7-day rolling average" />
              <TrendChart
                habits={habits}
                completions={completions}
                today={today}
                theme={settings.theme}
              />
            </div>

            {hasHabits && (
              <div className="surface rounded-2xl p-5 sm:p-6">
                <SectionHeader eyebrow="Per habit" title="Last 30 days" />
                <ul className="space-y-3">
                  {habits.map((h) => (
                    <li key={h.id} className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="text-base" aria-hidden="true">{h.emoji}</span>
                        <span className="truncate text-sm">{h.name}</span>
                      </div>
                      <Sparkline habit={h} completions={completions} today={today} />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Settings
              theme={settings.theme}
              onToggleTheme={toggleTheme}
              onExport={exportData}
              onImport={importData}
              user={user}
              onSignOut={logOut}
              reminderTime={settings.reminderTime}
              onReminderChange={requestPermissionAndSetTime}
              onReminderDisable={disableReminder}
              notificationsSupported={notificationsSupported}
              permissionDenied={permissionDenied}
              freezeTokens={currentMonthFreezeTokens}
            />
          </section>
        </div>

        {/* Footer stats */}
        {hasHabits && (
          <footer className="mt-10 border-t border-neutral-200/70 pt-6 text-center text-[11px] text-muted dark:border-neutral-800/70">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
              <span>
                <span className="tabular font-medium text-neutral-700 dark:text-neutral-300">
                  {habits.length}
                </span>{' '}
                habit{habits.length === 1 ? '' : 's'}
              </span>
              <span className="opacity-40">·</span>
              <span>
                <span className="tabular font-medium text-neutral-700 dark:text-neutral-300">
                  {totalCheckIns}
                </span>{' '}
                check-in{totalCheckIns === 1 ? '' : 's'}
              </span>
              {memberSince && (
                <>
                  <span className="opacity-40">·</span>
                  <span>since {memberSince}</span>
                </>
              )}
              <span className="opacity-40">·</span>
              <button
                type="button"
                onClick={() => setShortcutsOpen(true)}
                className="underline-offset-2 hover:underline"
              >
                keyboard shortcuts
              </button>
            </div>
          </footer>
        )}
      </main>

      <AddHabitModal
        open={addOpen || !!editingHabit}
        editing={editingHabit}
        onClose={() => {
          setAddOpen(false);
          setEditingHabit(null);
        }}
        onAdd={addHabit}
        onUpdate={updateHabit}
        existingNames={habits.map((h) => h.name)}
      />

      <ConfirmDeleteModal
        habit={deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={(id) => {
          setDeleteTarget(null);
          handleDelete(id);
        }}
      />

      <ShortcutsOverlay open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      <PastDaysModal
        open={pastDaysOpen}
        onClose={() => setPastDaysOpen(false)}
        habits={habits}
        completions={completions}
        today={today}
        onToggle={(id, date) => toggleCompletion(id, date)}
      />

      <HabitDetailDrawer
        habit={liveDetailHabit}
        completions={completions}
        today={today}
        onClose={() => setDetailHabit(null)}
        onToggle={(id, date) => toggleCompletion(id, date)}
      />

      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}
