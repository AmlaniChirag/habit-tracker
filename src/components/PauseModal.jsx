import { useEffect, useState } from 'react';
import { addDays, toISODate, fromISODate, isHabitPaused } from '../hooks/useHabits.js';

const PRESETS = [
  { label: '3 days', days: 3 },
  { label: '1 week', days: 7 },
  { label: '2 weeks', days: 14 },
  { label: 'Indefinitely', days: null },
];

function formatDate(iso) {
  return fromISODate(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function PauseModal({ habit, pauses, today, onPause, onResume, onClose }) {
  const [preset, setPreset] = useState(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!habit) return null;

  const activePause = pauses?.[habit.id];
  const isPaused = activePause && isHabitPaused(habit.id, today, pauses);

  const handlePause = () => {
    if (preset === null) return;
    const from = today;
    const to = preset.days !== null ? addDays(today, preset.days - 1) : null;
    onPause(habit.id, from, to);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-t-2xl border border-neutral-200 bg-white p-5 shadow-xl dark:border-neutral-800 dark:bg-neutral-900 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 text-xl dark:bg-neutral-800">
              {habit.emoji}
            </div>
            <div>
              <div className="text-sm font-semibold">{habit.name}</div>
              <div className="text-[11px] text-muted">
                {isPaused ? 'Currently paused' : 'Pause this habit'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:bg-neutral-100 dark:hover:bg-neutral-800"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {isPaused ? (
          /* Active pause — show info + resume */
          <div className="mt-4">
            <div className="rounded-xl bg-sky-500/10 px-4 py-3 text-sm text-sky-700 dark:text-sky-300">
              <span className="font-medium">Paused</span> from {formatDate(activePause.from)}
              {activePause.to
                ? ` until ${formatDate(activePause.to)}`
                : ' indefinitely'}
              . Streaks won't break.
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-muted hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800"
              >
                Keep paused
              </button>
              <button
                type="button"
                onClick={() => { onResume(habit.id); onClose(); }}
                className="flex-1 rounded-xl bg-accent-500 px-4 py-2 text-sm font-medium text-white hover:bg-accent-600"
              >
                Resume now
              </button>
            </div>
          </div>
        ) : (
          /* Pause picker */
          <div className="mt-4">
            <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted">
              Pause for how long?
            </div>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setPreset(p)}
                  aria-pressed={preset?.label === p.label}
                  className={[
                    'rounded-xl border px-4 py-2.5 text-sm font-medium transition-all',
                    preset?.label === p.label
                      ? 'border-accent-500 bg-accent-500/10 text-accent-600 dark:text-accent-400'
                      : 'border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300',
                  ].join(' ')}
                >
                  {p.label}
                  {p.days !== null && (
                    <div className="mt-0.5 text-[11px] text-muted font-normal">
                      Until {formatDate(addDays(today, p.days - 1))}
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="mt-3 text-[11px] text-muted">
              Streaks won't break during a pause. The habit is still yours.
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-muted hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePause}
                disabled={!preset}
                className="flex-1 rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ⏸ Pause habit
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
