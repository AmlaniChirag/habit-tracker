import { useMemo } from 'react';
import { addDays } from '../hooks/useHabits.js';

const DAYS = 30;

export default function Sparkline({ habit, completions, today }) {
  const cells = useMemo(() => {
    const start = addDays(today, -(DAYS - 1));
    const out = [];
    for (let i = 0; i < DAYS; i++) {
      const date = addDays(start, i);
      const exists = habit.createdAt <= date;
      const completed = exists && (completions[date] || []).includes(habit.id);
      out.push({ date, exists, completed });
    }
    return out;
  }, [habit, completions, today]);

  return (
    <div className="flex items-center gap-[3px]" role="img" aria-label={`Last ${DAYS} days for ${habit.name}`}>
      {cells.map((c) => {
        let cls = 'border border-neutral-300 dark:border-neutral-700';
        if (!c.exists) {
          cls = 'bg-neutral-200/60 dark:bg-neutral-800/60';
        } else if (c.completed) {
          cls = 'bg-accent-500';
        }
        const label = !c.exists
          ? `${c.date}: not yet tracked`
          : c.completed
          ? `${c.date}: completed`
          : `${c.date}: missed`;
        return (
          <div
            key={c.date}
            className={`h-3 w-2 rounded-sm transition-colors ${cls}`}
            title={label}
            aria-label={label}
          />
        );
      })}
    </div>
  );
}
