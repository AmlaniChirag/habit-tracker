import { useMemo } from 'react';
import { addDays, fromISODate, toISODate } from '../hooks/useHabits.js';

const DAYS = 90;

function intensityClass(pct) {
  if (pct <= 0) return 'bg-neutral-200/70 dark:bg-neutral-800/70';
  if (pct < 0.5) return 'bg-accent-500/30 dark:bg-accent-500/30';
  if (pct < 1) return 'bg-accent-500/60 dark:bg-accent-500/60';
  return 'bg-accent-500 dark:bg-accent-500';
}

export default function Heatmap({ habits, completions, today }) {
  const days = useMemo(() => {
    const start = addDays(today, -(DAYS - 1));
    const out = [];
    for (let i = 0; i < DAYS; i++) {
      const date = addDays(start, i);
      const activeHabits = habits.filter((h) => h.createdAt <= date);
      const total = activeHabits.length;
      const done = total > 0
        ? (completions[date] || []).filter((id) => activeHabits.some((h) => h.id === id)).length
        : 0;
      const pct = total > 0 ? done / total : 0;
      out.push({ date, pct, done, total });
    }
    return out;
  }, [habits, completions, today]);

  // Group by week-aligned columns. Pad start so weeks line up Sun-Sat.
  const startDay = fromISODate(days[0].date).getDay();
  const padded = [...Array(startDay).fill(null), ...days];
  const columns = [];
  for (let i = 0; i < padded.length; i += 7) {
    columns.push(padded.slice(i, i + 7));
  }

  return (
    <div>
      <div className="flex items-start gap-[3px] overflow-x-auto pb-1 sm:gap-1">
        {columns.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-[3px] sm:gap-1">
            {Array.from({ length: 7 }).map((_, ri) => {
              const cell = col[ri];
              if (!cell) {
                return (
                  <div
                    key={ri}
                    className="h-3 w-3 rounded-[3px] opacity-0 sm:h-3.5 sm:w-3.5"
                    aria-hidden="true"
                  />
                );
              }
              const label =
                cell.total > 0
                  ? `${cell.date}: ${cell.done}/${cell.total} habits (${Math.round(cell.pct * 100)}%)`
                  : `${cell.date}: no habits yet`;
              return (
                <div
                  key={ri}
                  className={`h-3 w-3 rounded-[3px] transition-colors sm:h-3.5 sm:w-3.5 ${intensityClass(cell.pct)}`}
                  title={label}
                  aria-label={label}
                  role="img"
                />
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-1.5 text-[11px] text-muted">
        <span>Less</span>
        <span className="h-3 w-3 rounded-[3px] bg-neutral-200/70 dark:bg-neutral-800/70" aria-hidden="true" />
        <span className="h-3 w-3 rounded-[3px] bg-accent-500/30" aria-hidden="true" />
        <span className="h-3 w-3 rounded-[3px] bg-accent-500/60" aria-hidden="true" />
        <span className="h-3 w-3 rounded-[3px] bg-accent-500" aria-hidden="true" />
        <span>More</span>
      </div>
    </div>
  );
}
