import { useEffect, useMemo } from 'react';
import {
  addDays,
  fromISODate,
  computeStreak,
  computeBestStreak,
  computeCompletionRate,
  startOfWeek,
  weekCompletionCount,
} from '../hooks/useHabits.js';

const HEATMAP_DAYS = 90;
const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function intensityClass(done) {
  return done
    ? 'bg-accent-500 dark:bg-accent-500'
    : 'bg-neutral-200/70 dark:bg-neutral-800/70';
}

export default function HabitDetailDrawer({ habit, completions, notes, today, onClose, onToggle }) {
  useEffect(() => {
    if (!habit) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [habit, onClose]);

  // Build all derived data up front — hook order must be stable even when habit is null.
  const data = useMemo(() => {
    if (!habit) return null;
    const isWeekly = habit.target && habit.target.type === 'weekly';
    const streak = isWeekly ? null : computeStreak(habit.id, completions, today);
    const bestStreak = computeBestStreak(habit.id, completions);
    const rate = computeCompletionRate(habit, completions, today, 30);
    const ratePct = rate != null ? Math.round(rate * 100) : null;

    // Count all historical completions for this habit.
    let totalChecks = 0;
    for (const [, ids] of Object.entries(completions)) {
      if (ids.includes(habit.id)) totalChecks += 1;
    }

    // 90-day heatmap.
    const start = addDays(today, -(HEATMAP_DAYS - 1));
    const days = [];
    for (let i = 0; i < HEATMAP_DAYS; i++) {
      const date = addDays(start, i);
      const active = habit.createdAt <= date;
      const done = active && (completions[date] || []).includes(habit.id);
      days.push({ date, active, done });
    }
    // Columns aligned Mon..Sun.
    const firstDay = fromISODate(days[0].date).getDay(); // 0=Sun..6=Sat
    const offset = firstDay === 0 ? 6 : firstDay - 1; // monday start
    const padded = [...Array(offset).fill(null), ...days];
    const columns = [];
    for (let i = 0; i < padded.length; i += 7) {
      columns.push(padded.slice(i, i + 7));
    }

    // Weekday pattern: which days of the week does the user actually do this?
    const weekdayCounts = [0, 0, 0, 0, 0, 0, 0]; // Mon..Sun
    const weekdayPossible = [0, 0, 0, 0, 0, 0, 0];
    for (const d of days) {
      if (!d.active) continue;
      const wd = fromISODate(d.date).getDay();
      const idx = wd === 0 ? 6 : wd - 1;
      weekdayPossible[idx] += 1;
      if (d.done) weekdayCounts[idx] += 1;
    }

    // Weekly progress if weekly habit.
    const weekDone = weekCompletionCount(habit.id, completions, today);
    const weekStart = startOfWeek(today);

    // Days since creation.
    const createdDt = fromISODate(habit.createdAt);
    const todayDt = fromISODate(today);
    const daysSinceCreated = Math.max(
      1,
      Math.round((todayDt - createdDt) / (1000 * 60 * 60 * 24)) + 1
    );

    return {
      isWeekly,
      streak,
      bestStreak,
      ratePct,
      totalChecks,
      columns,
      weekdayCounts,
      weekdayPossible,
      weekDone,
      weekStart,
      daysSinceCreated,
    };
  }, [habit, completions, today]);

  if (!habit || !data) return null;

  const createdLabel = fromISODate(habit.createdAt).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="habit-detail-title"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-2xl border border-neutral-200 bg-white p-5 shadow-xl dark:border-neutral-800 dark:bg-neutral-900 sm:rounded-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-500/15 text-2xl"
              aria-hidden="true"
            >
              {habit.emoji}
            </div>
            <div className="min-w-0">
              <h2 id="habit-detail-title" className="truncate text-lg font-semibold">
                {habit.name}
              </h2>
              <div className="mt-0.5 text-[11px] text-muted">
                Since {createdLabel} · {data.daysSinceCreated} day{data.daysSinceCreated === 1 ? '' : 's'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:bg-neutral-100 dark:hover:bg-neutral-800"
            aria-label="Close habit details"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* Stat grid */}
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat
            label={data.isWeekly ? 'This week' : 'Current streak'}
            value={
              data.isWeekly
                ? `${data.weekDone}/${habit.target.count}`
                : `${data.streak}`
            }
            suffix={data.isWeekly ? '' : data.streak === 1 ? 'day' : 'days'}
          />
          <Stat
            label="Best streak"
            value={`${data.bestStreak}`}
            suffix={data.bestStreak === 1 ? 'day' : 'days'}
          />
          <Stat
            label="30-day rate"
            value={data.ratePct != null ? `${data.ratePct}` : '—'}
            suffix={data.ratePct != null ? '%' : ''}
          />
          <Stat
            label="Total check-ins"
            value={`${data.totalChecks}`}
            suffix=""
          />
        </div>

        {/* 90-day heatmap */}
        <div className="mt-6">
          <div className="mb-2 flex items-baseline justify-between">
            <div className="eyebrow">Last 90 days</div>
            <div className="text-[11px] text-muted">Tap a day to toggle</div>
          </div>
          <div className="flex items-start gap-[3px] overflow-x-auto pb-1 sm:gap-1">
            <div className="flex flex-col gap-[3px] pr-1 pt-px text-[9px] text-muted sm:gap-1">
              {WEEKDAY_LABELS.map((l, i) => (
                <div
                  key={i}
                  className="flex h-3 w-3 items-center justify-center sm:h-3.5 sm:w-3.5"
                  aria-hidden="true"
                >
                  {i % 2 === 0 ? l : ''}
                </div>
              ))}
            </div>
            {data.columns.map((col, ci) => (
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
                  if (!cell.active) {
                    return (
                      <div
                        key={ri}
                        className="h-3 w-3 rounded-[3px] bg-neutral-100 dark:bg-neutral-900 sm:h-3.5 sm:w-3.5"
                        aria-hidden="true"
                      />
                    );
                  }
                  const label = `${cell.date}: ${cell.done ? 'done' : 'not done'}`;
                  return (
                    <button
                      key={ri}
                      type="button"
                      onClick={() => onToggle(habit.id, cell.date)}
                      className={`h-3 w-3 rounded-[3px] transition-colors hover:ring-1 hover:ring-accent-400 sm:h-3.5 sm:w-3.5 ${intensityClass(cell.done)}`}
                      title={label}
                      aria-label={label}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Weekday pattern */}
        <div className="mt-6">
          <div className="eyebrow mb-2">Weekday pattern</div>
          <div className="flex items-end gap-2">
            {WEEKDAY_LABELS.map((l, i) => {
              const possible = data.weekdayPossible[i];
              const pct = possible > 0 ? data.weekdayCounts[i] / possible : 0;
              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <div className="flex h-16 w-full items-end overflow-hidden rounded-md bg-neutral-100 dark:bg-neutral-800/70">
                    <div
                      className="w-full bg-accent-500 transition-all"
                      style={{ height: `${Math.round(pct * 100)}%` }}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="text-[10px] text-muted">{l}</div>
                  <div className="text-[10px] tabular text-muted">
                    {possible > 0 ? `${Math.round(pct * 100)}%` : '—'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notes log */}
        {notes && notes[habit.id] && Object.keys(notes[habit.id]).length > 0 && (
          <div className="mt-6">
            <div className="eyebrow mb-2">Recent notes</div>
            <ul className="space-y-2">
              {Object.entries(notes[habit.id])
                .sort(([a], [b]) => b.localeCompare(a))
                .slice(0, 10)
                .map(([date, entry]) => (
                  <li
                    key={date}
                    className="flex items-start gap-2.5 rounded-xl bg-neutral-100/60 px-3 py-2.5 dark:bg-neutral-800/50"
                  >
                    {entry.mood && (
                      <span className="shrink-0 text-base leading-none mt-0.5">{entry.mood}</span>
                    )}
                    <div className="min-w-0 flex-1">
                      {entry.text && (
                        <div className="text-sm leading-snug">{entry.text}</div>
                      )}
                      <div className="mt-0.5 text-[11px] text-muted">
                        {new Date(date + 'T00:00:00').toLocaleDateString(undefined, {
                          weekday: 'short', month: 'short', day: 'numeric',
                        })}
                      </div>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, suffix }) {
  return (
    <div className="rounded-xl bg-neutral-100/60 p-3 dark:bg-neutral-800/50">
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-xl font-semibold tabular">{value}</span>
        {suffix && <span className="text-[11px] text-muted">{suffix}</span>}
      </div>
    </div>
  );
}
