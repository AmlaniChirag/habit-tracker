import { useMemo, useState } from 'react';
import useHabits, { HABIT_LIMIT, fromISODate } from './hooks/useHabits.js';
import HabitCard from './components/HabitCard.jsx';
import AddHabitModal from './components/AddHabitModal.jsx';
import ConfirmDeleteModal from './components/ConfirmDeleteModal.jsx';
import Heatmap from './components/Heatmap.jsx';
import Sparkline from './components/Sparkline.jsx';
import TrendChart from './components/TrendChart.jsx';
import WeeklySummary from './components/WeeklySummary.jsx';
import Settings from './components/Settings.jsx';
import ProgressRing from './components/ProgressRing.jsx';

const ENCOURAGEMENTS = [
  'Pick one to start the day.',
  'A small win counts.',
  "What's one thing you can do now?",
  'Tiny steps, big change.',
];

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
    totalCheckIns,
    addHabit,
    deleteHabit,
    toggleCompletion,
    toggleTheme,
    exportData,
    importData,
  } = useHabits();

  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { habits, completions, settings } = state;

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

  const memberSince = useMemo(() => {
    if (habits.length === 0) return null;
    const earliest = habits.reduce((min, h) => (h.createdAt < min ? h.createdAt : min), habits[0].createdAt);
    const dt = fromISODate(earliest);
    return dt.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  }, [habits]);

  return (
    <div className="min-h-screen">
      <header className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 sm:pt-14">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 sm:gap-5">
            {hasHabits && (
              <div className="relative hidden sm:block">
                <ProgressRing value={progressValue} size={64} stroke={5} />
                <div className="absolute inset-0 flex items-center justify-center text-[13px] font-semibold tabular">
                  {Math.round(progressValue * 100)}%
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
          <button
            type="button"
            onClick={toggleTheme}
            className="shrink-0 rounded-xl border border-neutral-200/80 bg-white/60 p-2 text-sm hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900/60 dark:hover:bg-neutral-800"
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

        {/* Mobile progress bar */}
        {hasHabits && (
          <div className="mt-5 sm:hidden">
            <div className="h-1.5 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
              <div
                className="h-full rounded-full bg-accent-500 transition-all duration-500 ease-out"
                style={{ width: `${progressValue * 100}%` }}
                aria-hidden="true"
              />
            </div>
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
                hasHabits && !atLimit ? (
                  <button
                    type="button"
                    onClick={() => setAddOpen(true)}
                    className="rounded-lg bg-accent-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm shadow-accent-500/20 hover:bg-accent-600"
                  >
                    + Add habit
                  </button>
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
              <div className="space-y-2.5">
                {habits.map((h) => (
                  <HabitCard
                    key={h.id}
                    habit={h}
                    completed={todayCompletions.includes(h.id)}
                    streak={streaks[h.id] || 0}
                    bestStreak={bestStreaks[h.id] || 0}
                    onToggle={(id) => toggleCompletion(id)}
                    onDelete={(habit) => setDeleteTarget(habit)}
                  />
                ))}

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
            </div>
          </footer>
        )}
      </main>

      <AddHabitModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={addHabit}
      />

      <ConfirmDeleteModal
        habit={deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={(id) => {
          deleteHabit(id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
