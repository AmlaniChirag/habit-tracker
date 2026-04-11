import { useEffect, useMemo } from 'react';
import { addDays, fromISODate } from '../hooks/useHabits.js';

const WINDOW_DAYS = 14;

function rowLabel(iso, todayIso) {
  if (iso === todayIso) return 'Today';
  if (iso === addDays(todayIso, -1)) return 'Yesterday';
  const dt = fromISODate(iso);
  return dt.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function PastDaysModal({
  open,
  onClose,
  habits,
  completions,
  today,
  onToggle,
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const days = useMemo(() => {
    const out = [];
    for (let i = 0; i < WINDOW_DAYS; i++) {
      out.push(addDays(today, -i));
    }
    return out;
  }, [today]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="past-days-title"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-5 shadow-xl dark:border-neutral-800 dark:bg-neutral-900 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="past-days-title" className="text-lg font-semibold">
              Catch up
            </h2>
            <p className="mt-1 text-xs text-muted">
              Tap a habit to toggle it for that day. Life happens.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:bg-neutral-100 dark:hover:bg-neutral-800"
            aria-label="Close catch up"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {habits.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 px-4 py-10 text-center text-sm text-muted dark:border-neutral-700">
            Add a habit first.
          </div>
        ) : (
          <ul className="space-y-3">
            {days.map((iso) => {
              const activeHabits = habits.filter((h) => h.createdAt <= iso);
              const completed = completions[iso] || [];
              const doneCount = activeHabits.filter((h) => completed.includes(h.id)).length;
              const allDone = activeHabits.length > 0 && doneCount === activeHabits.length;
              return (
                <li key={iso}>
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <div className="text-[13px] font-medium">
                      {rowLabel(iso, today)}
                    </div>
                    <div
                      className={[
                        'text-[11px] tabular',
                        allDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted',
                      ].join(' ')}
                    >
                      {activeHabits.length > 0
                        ? `${doneCount}/${activeHabits.length}${allDone ? ' ✨' : ''}`
                        : '—'}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {activeHabits.length === 0 ? (
                      <span className="text-[11px] text-muted">No habits on this day.</span>
                    ) : (
                      activeHabits.map((h) => {
                        const isDone = completed.includes(h.id);
                        return (
                          <button
                            key={h.id}
                            type="button"
                            onClick={() => onToggle(h.id, iso)}
                            aria-pressed={isDone}
                            className={[
                              'inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-medium transition-colors',
                              isDone
                                ? 'border-accent-500/40 bg-accent-500/15 text-accent-700 dark:text-accent-300'
                                : 'border-neutral-200 bg-neutral-50 text-neutral-600 hover:border-accent-400/50 hover:text-accent-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:text-accent-400',
                            ].join(' ')}
                            title={`${isDone ? 'Unmark' : 'Mark'} ${h.name} for ${rowLabel(iso, today)}`}
                          >
                            <span aria-hidden="true">{h.emoji}</span>
                            <span className="max-w-[7ch] truncate">{h.name}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
