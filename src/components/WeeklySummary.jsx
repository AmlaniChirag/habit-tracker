import { useMemo } from 'react';
import { addDays, fromISODate } from '../hooks/useHabits.js';

/**
 * Sums check-ins (completions where habit existed) and possible check-ins
 * (active-habit-days) over a 7-day window ending at endIso (inclusive).
 */
function weekStats(habits, completions, endIso) {
  let done = 0;
  let possible = 0;
  for (let i = 0; i < 7; i++) {
    const date = addDays(endIso, -i);
    const active = habits.filter((h) => h.createdAt <= date);
    possible += active.length;
    const dayCompletions = completions[date] || [];
    done += dayCompletions.filter((id) => active.some((h) => h.id === id)).length;
  }
  return { done, possible };
}

export default function WeeklySummary({ habits, completions, today }) {
  const { thisWeek, lastWeek, delta } = useMemo(() => {
    const tw = weekStats(habits, completions, today);
    const lw = weekStats(habits, completions, addDays(today, -7));
    const twPct = tw.possible > 0 ? tw.done / tw.possible : 0;
    const lwPct = lw.possible > 0 ? lw.done / lw.possible : 0;
    return {
      thisWeek: { ...tw, pct: twPct },
      lastWeek: { ...lw, pct: lwPct },
      delta: twPct - lwPct,
    };
  }, [habits, completions, today]);

  const pctRound = Math.round(thisWeek.pct * 100);
  const deltaRound = Math.round(delta * 100);
  const arrow = delta > 0.005 ? '▲' : delta < -0.005 ? '▼' : '–';
  const arrowColor =
    delta > 0.005 ? 'text-emerald-500' : delta < -0.005 ? 'text-red-500' : 'text-muted';

  return (
    <div className="surface rounded-2xl p-4 sm:p-5">
      <div className="text-xs font-medium uppercase tracking-wide text-muted">This week</div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-semibold tabular-nums">
          {thisWeek.done}
          <span className="text-muted">/{thisWeek.possible || 0}</span>
        </span>
        <span className="text-sm text-muted">check-ins</span>
      </div>
      <div className="mt-1 flex items-center gap-2 text-sm">
        <span className="font-medium">{pctRound}%</span>
        <span className={`flex items-center gap-1 ${arrowColor}`}>
          <span aria-hidden="true">{arrow}</span>
          <span className="tabular-nums">
            {Math.abs(deltaRound)}% vs last week
          </span>
        </span>
      </div>
    </div>
  );
}
