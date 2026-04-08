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

export default function App() {
  const {
    state,
    today,
    todayCompletions,
    streaks,
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

  const encouragement = useMemo(() => {
    // Stable per-day so it doesn't flip on re-render.
    const idx = today.split('-').reduce((a, b) => a + Number(b), 0) % ENCOURAGEMENTS.length;
    return ENCOURAGEMENTS[idx];
  }, [today]);

  const hasHabits = habits.length > 0;

  return (
    <div className="min-h-screen">
      <header className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 sm:pt-12">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted">
              {formatPrettyDate(today)}
            </div>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
              {hasHabits ? (
                <>
                  <span className="tabular-nums">{doneCount}</span>{' '}
                  <span className="text-muted">of</span>{' '}
                  <span className="tabular-nums">{totalCount}</span>{' '}
                  <span className="text-muted">done today</span>
                </>
              ) : (
                <>Build a habit.</>
              )}
            </h1>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className="shrink-0 rounded-xl border border-neutral-200 p-2 text-sm hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800"
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
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* LEFT: daily check-in */}
          <section className="lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-medium uppercase tracking-wider text-muted">
                Today
              </h2>
              {hasHabits && !atLimit && (
                <button
                  type="button"
                  onClick={() => setAddOpen(true)}
                  className="rounded-lg bg-accent-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-600"
                >
                  + Add habit
                </button>
              )}
            </div>

            {!hasHabits ? (
              <div className="surface flex flex-col items-center rounded-2xl p-8 text-center">
                <div className="mb-3 text-4xl" aria-hidden="true">🌱</div>
                <h3 className="text-lg font-medium">Start small.</h3>
                <p className="mt-1 text-sm text-muted">
                  Pick one habit you'd like to do every day.
                </p>
                <button
                  type="button"
                  onClick={() => setAddOpen(true)}
                  className="mt-5 rounded-xl bg-accent-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-600"
                >
                  Add your first habit
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {habits.map((h) => (
                  <HabitCard
                    key={h.id}
                    habit={h}
                    completed={todayCompletions.includes(h.id)}
                    streak={streaks[h.id] || 0}
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
          <section className="space-y-4 lg:col-span-3">
            <WeeklySummary habits={habits} completions={completions} today={today} />

            <div className="surface rounded-2xl p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-muted">
                    Last 90 days
                  </div>
                  <div className="text-sm">Daily completion intensity</div>
                </div>
              </div>
              <Heatmap habits={habits} completions={completions} today={today} />
            </div>

            <div className="surface rounded-2xl p-4 sm:p-5">
              <div className="mb-3">
                <div className="text-xs font-medium uppercase tracking-wide text-muted">
                  60-day trend
                </div>
                <div className="text-sm">7-day rolling average</div>
              </div>
              <TrendChart
                habits={habits}
                completions={completions}
                today={today}
                theme={settings.theme}
              />
            </div>

            {hasHabits && (
              <div className="surface rounded-2xl p-4 sm:p-5">
                <div className="mb-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-muted">
                    Last 30 days per habit
                  </div>
                </div>
                <ul className="space-y-2.5">
                  {habits.map((h) => (
                    <li key={h.id} className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
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
