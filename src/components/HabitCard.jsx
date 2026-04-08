import { useState } from 'react';

export default function HabitCard({ habit, completed, streak, bestStreak, onToggle, onDelete }) {
  const [pulse, setPulse] = useState(false);

  const handleToggle = () => {
    setPulse(true);
    setTimeout(() => setPulse(false), 320);
    onToggle(habit.id);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div
      className={[
        'group relative rounded-2xl border p-4 sm:p-5 cursor-pointer select-none',
        'transition-all duration-200',
        completed
          ? 'bg-accent-500/[0.08] border-accent-500/30 dark:bg-accent-500/[0.12] dark:border-accent-400/30'
          : 'surface hover:border-accent-400/50 dark:hover:border-accent-400/40 hover:-translate-y-px',
        pulse ? 'animate-pulseScale' : '',
      ].join(' ')}
      role="button"
      tabIndex={0}
      aria-pressed={completed}
      aria-label={`${habit.name}, ${completed ? 'completed today' : 'not completed today'}, current streak ${streak} days`}
      onClick={handleToggle}
      onKeyDown={handleKey}
    >
      <div className="flex items-center gap-4">
        <div
          className={[
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl',
            'transition-all duration-300',
            completed
              ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/25'
              : 'bg-neutral-100 dark:bg-neutral-800/80',
          ].join(' ')}
          aria-hidden="true"
        >
          {habit.emoji}
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-medium sm:text-base leading-tight">
            {habit.name}
          </div>
          <div className="mt-1.5 flex items-center gap-1.5">
            {streak > 0 ? (
              <span
                className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5 text-[11px] font-medium text-orange-600 dark:bg-orange-500/15 dark:text-orange-400 tabular"
                aria-label={`${streak} day streak`}
              >
                <span aria-hidden="true">🔥</span>
                {streak} day{streak === 1 ? '' : 's'}
              </span>
            ) : (
              <span className="text-[11px] text-muted">No streak yet</span>
            )}
            {bestStreak > streak && bestStreak > 0 && (
              <span className="text-[11px] text-muted tabular" title="Best streak">
                · best {bestStreak}
              </span>
            )}
          </div>
        </div>

        <div
          className={[
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2',
            'transition-all duration-200',
            completed
              ? 'border-accent-500 bg-accent-500 text-white'
              : 'border-neutral-300 dark:border-neutral-700 group-hover:border-accent-400',
          ].join(' ')}
          aria-hidden="true"
        >
          {completed && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path
                fillRule="evenodd"
                d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.42 0l-3.5-3.5a1 1 0 011.42-1.42L8.5 12.08l6.79-6.79a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(habit);
        }}
        className="absolute right-2.5 top-2.5 hidden rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-200/60 hover:text-red-500 group-hover:block dark:hover:bg-neutral-800"
        aria-label={`Delete habit ${habit.name}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path
            fillRule="evenodd"
            d="M8.75 1.5a.75.75 0 00-.75.75V3H4.25a.75.75 0 000 1.5h.31l.78 11.74A2.25 2.25 0 007.59 18.5h4.82a2.25 2.25 0 002.25-2.26l.78-11.74h.31a.75.75 0 000-1.5H12V2.25a.75.75 0 00-.75-.75h-2.5zM9.5 3v0h1V3h-1zm-2.42 3.25a.75.75 0 011.5-.06l.4 8a.75.75 0 11-1.5.07l-.4-8.01zm5.34 0a.75.75 0 011.5.06l-.4 8.01a.75.75 0 11-1.5-.07l.4-8z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}
