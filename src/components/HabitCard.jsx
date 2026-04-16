import { useRef, useState } from 'react';

const SWIPE_THRESHOLD = 60;

export default function HabitCard({
  habit,
  index,
  completed,
  completedYesterday,
  canMoveUp,
  canMoveDown,
  streak,
  bestStreak,
  completionRate,
  weekProgress,
  needsAttention,
  frozen,
  onToggle,
  onToggleYesterday,
  onEdit,
  onDelete,
  onMove,
  onOpenDetail,
}) {
  const [pulse, setPulse] = useState(false);
  const isWeekly = !!weekProgress;

  // --- Swipe state ---
  const touchStartRef = useRef(null);
  const [swipeX, setSwipeX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [revealActions, setRevealActions] = useState(false);

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    setSwiping(true);
  };

  const handleTouchMove = (e) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    // If vertical scroll is dominant, bail out
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dx) < 10) {
      touchStartRef.current = null;
      setSwipeX(0);
      setSwiping(false);
      return;
    }
    // Clamp: allow right (positive) up to 100px, left (negative) up to -100px
    const clamped = Math.max(-100, Math.min(100, dx));
    setSwipeX(clamped);
  };

  const handleTouchEnd = () => {
    if (!touchStartRef.current) {
      setSwipeX(0);
      setSwiping(false);
      return;
    }
    if (swipeX > SWIPE_THRESHOLD) {
      // Swipe right → toggle completion
      handleToggle();
      setRevealActions(false);
    } else if (swipeX < -SWIPE_THRESHOLD) {
      // Swipe left → reveal edit/delete
      setRevealActions(true);
    } else {
      setRevealActions(false);
    }
    setSwipeX(0);
    setSwiping(false);
    touchStartRef.current = null;
  };

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

  const stopAnd = (fn) => (e) => {
    e.stopPropagation();
    fn();
  };

  const ratePct = completionRate != null ? Math.round(completionRate * 100) : null;

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Swipe-left revealed actions (behind the card) */}
      <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onEdit(habit); setRevealActions(false); }}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-500 text-white shadow-sm"
          aria-label={`Edit ${habit.name}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(habit); setRevealActions(false); }}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500 text-white shadow-sm"
          aria-label={`Delete ${habit.name}`}
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

      {/* Swipe-right indicator (behind the card, left side) */}
      {swipeX > 20 && (
        <div className="absolute inset-y-0 left-0 flex items-center pl-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-500 text-white">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path fillRule="evenodd" d="M16.704 5.29a1 1 0 010 1.42l-7.5 7.5a1 1 0 01-1.42 0l-3.5-3.5a1 1 0 011.42-1.42L8.5 12.08l6.79-6.79a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}

      {/* Main card content — translates on swipe */}
      <div
        className={[
          'group relative rounded-2xl border p-4 sm:p-5 cursor-pointer select-none',
          'transition-all',
          swiping ? 'duration-0' : 'duration-200',
          completed
            ? 'bg-accent-500/[0.08] border-accent-500/30 dark:bg-accent-500/[0.12] dark:border-accent-400/30'
            : needsAttention
            ? 'surface !border-amber-500/50 dark:!border-amber-400/40 hover:-translate-y-px'
            : 'surface hover:border-accent-400/50 dark:hover:border-accent-400/40 hover:-translate-y-px',
          pulse ? 'animate-pulseScale' : '',
        ].join(' ')}
        style={{
          transform: revealActions
            ? 'translateX(-92px)'
            : swipeX !== 0
            ? `translateX(${swipeX}px)`
            : undefined,
          transition: swiping ? 'none' : undefined,
        }}
        role="button"
        tabIndex={0}
        aria-pressed={completed}
        aria-label={`${habit.name}, ${completed ? 'completed today' : 'not completed today'}, current streak ${streak}`}
        onClick={() => {
          if (revealActions) {
            setRevealActions(false);
            return;
          }
          handleToggle();
        }}
        onKeyDown={handleKey}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={stopAnd(() => onOpenDetail && onOpenDetail(habit))}
            aria-label={`Open details for ${habit.name}`}
            className={[
              'relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl',
              'transition-all duration-300',
              'focus:outline-none focus:ring-2 focus:ring-accent-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-neutral-900',
              completed
                ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/25 hover:brightness-110'
                : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800/80 dark:hover:bg-neutral-700',
            ].join(' ')}
          >
            {habit.emoji}
            {typeof index === 'number' && index < 9 && (
              <span
                className={[
                  'absolute -left-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full border text-[9px] font-semibold tabular sm:flex',
                  completed
                    ? 'border-accent-400 bg-accent-600 text-white'
                    : 'border-neutral-300 bg-white text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400',
                ].join(' ')}
                title={`Press ${index + 1} to toggle`}
              >
                {index + 1}
              </span>
            )}
          </button>

          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-medium sm:text-base leading-tight">
              {habit.name}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              {streak > 0 ? (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5 text-[11px] font-medium text-orange-600 dark:bg-orange-500/15 dark:text-orange-400 tabular"
                  aria-label={
                    isWeekly
                      ? `${streak} week streak`
                      : `${streak} day streak`
                  }
                >
                  <span aria-hidden="true">🔥</span>
                  {streak} {isWeekly ? `wk${streak === 1 ? '' : 's'}` : `day${streak === 1 ? '' : 's'}`}
                </span>
              ) : (
                <span className="text-[11px] text-muted">No streak yet</span>
              )}

              {frozen && (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2 py-0.5 text-[11px] font-medium text-sky-600 dark:text-sky-400"
                  title="Streak freeze used yesterday"
                >
                  🧊 Frozen
                </span>
              )}

              {isWeekly ? (
                <span
                  className={[
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium tabular',
                    weekProgress.done >= weekProgress.goal
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-neutral-200/60 text-neutral-700 dark:bg-neutral-800/60 dark:text-neutral-300',
                  ].join(' ')}
                  title="This week's progress"
                >
                  {weekProgress.done}/{weekProgress.goal} this week
                </span>
              ) : (
                ratePct != null && (
                  <span
                    className="text-[11px] text-muted tabular"
                    title="Completion rate over the last 30 days"
                  >
                    · 30d {ratePct}%
                  </span>
                )
              )}

              {!isWeekly && bestStreak > streak && bestStreak > 0 && (
                <span className="text-[11px] text-muted tabular" title="Best streak">
                  · best {bestStreak}
                </span>
              )}

              {needsAttention && (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400"
                  title="Don't miss twice"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  Missed yesterday
                </span>
              )}

              {!completedYesterday && (
                <button
                  type="button"
                  onClick={stopAnd(() => onToggleYesterday(habit.id))}
                  className="rounded-full border border-dashed border-neutral-300 px-2 py-0.5 text-[11px] text-muted hover:border-accent-400 hover:text-accent-600 dark:border-neutral-700 dark:hover:text-accent-400"
                  aria-label={`Mark ${habit.name} done for yesterday`}
                >
                  + yesterday
                </button>
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

        {/* Hover controls (desktop only): reorder on left, edit + delete on right */}
        <div className="absolute left-2 top-2 hidden flex-col gap-0.5 group-hover:sm:flex">
          <button
            type="button"
            onClick={stopAnd(() => onMove(habit.id, -1))}
            disabled={!canMoveUp}
            className="rounded-md p-0.5 text-neutral-400 hover:bg-neutral-200/60 hover:text-neutral-700 disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
            aria-label="Move habit up"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
              <path fillRule="evenodd" d="M10 15a.75.75 0 01-.75-.75V7.56L6.3 10.53a.75.75 0 11-1.06-1.06l4.25-4.25a.75.75 0 011.06 0l4.25 4.25a.75.75 0 11-1.06 1.06L10.75 7.56v6.69A.75.75 0 0110 15z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            type="button"
            onClick={stopAnd(() => onMove(habit.id, 1))}
            disabled={!canMoveDown}
            className="rounded-md p-0.5 text-neutral-400 hover:bg-neutral-200/60 hover:text-neutral-700 disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
            aria-label="Move habit down"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
              <path fillRule="evenodd" d="M10 5a.75.75 0 01.75.75v6.69l2.95-2.97a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0l-4.25-4.25a.75.75 0 111.06-1.06l2.95 2.97V5.75A.75.75 0 0110 5z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="absolute right-2 top-2 hidden gap-0.5 group-hover:sm:flex">
          <button
            type="button"
            onClick={stopAnd(() => onEdit(habit))}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-200/60 hover:text-accent-600 dark:hover:bg-neutral-800 dark:hover:text-accent-400"
            aria-label={`Edit habit ${habit.name}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={stopAnd(() => onDelete(habit))}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-200/60 hover:text-red-500 dark:hover:bg-neutral-800"
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
      </div>
    </div>
  );
}
