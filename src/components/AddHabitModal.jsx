import { useEffect, useRef, useState } from 'react';
import { MAX_NAME_LENGTH, DEFAULT_EMOJI, TIME_OF_DAY_OPTIONS } from '../hooks/useHabits.js';

const EMOJI_OPTIONS = [
  '✅', '🧘', '🏃', '💧', '📚', '🛏️', '🥗', '💪', '✍️', '🎨',
  '🎸', '🧠', '☀️', '🌱', '💻', '🙏', '🍎', '🚶', '🧹', '💤',
];

const TIME_LABELS = {
  morning: { label: 'Morning', icon: '🌅' },
  afternoon: { label: 'Afternoon', icon: '☀️' },
  evening: { label: 'Evening', icon: '🌙' },
  anytime: { label: 'Anytime', icon: '∞' },
};

export default function AddHabitModal({ open, onClose, onAdd, onUpdate, editing }) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(DEFAULT_EMOJI);
  const [timeOfDay, setTimeOfDay] = useState('anytime');
  const [targetType, setTargetType] = useState('daily');
  const [weeklyCount, setWeeklyCount] = useState(3);
  const inputRef = useRef(null);

  const isEdit = !!editing;

  useEffect(() => {
    if (open) {
      if (editing) {
        setName(editing.name || '');
        setEmoji(editing.emoji || DEFAULT_EMOJI);
        setTimeOfDay(editing.timeOfDay || 'anytime');
        if (editing.target?.type === 'weekly') {
          setTargetType('weekly');
          setWeeklyCount(editing.target.count || 3);
        } else {
          setTargetType('daily');
          setWeeklyCount(3);
        }
      } else {
        setName('');
        setEmoji(DEFAULT_EMOJI);
        setTimeOfDay('anytime');
        setTargetType('daily');
        setWeeklyCount(3);
      }
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, editing]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const target =
      targetType === 'weekly' ? { type: 'weekly', count: weeklyCount } : { type: 'daily' };
    if (isEdit && onUpdate) {
      onUpdate(editing.id, { name: trimmed, emoji, timeOfDay, target });
    } else {
      onAdd(trimmed, emoji, { timeOfDay, target });
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-habit-title"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="add-habit-title" className="text-lg font-semibold">
          {isEdit ? 'Edit habit' : 'New habit'}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {isEdit ? 'Update name, emoji, time, or goal.' : 'Pick a name, an emoji, and when it happens.'}
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          <div>
            <label htmlFor="habit-name" className="mb-1.5 block text-xs font-medium text-muted">
              Name
            </label>
            <input
              id="habit-name"
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, MAX_NAME_LENGTH))}
              maxLength={MAX_NAME_LENGTH}
              placeholder="e.g. Meditate"
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm placeholder:text-neutral-400 focus:border-accent-500 focus:bg-white dark:border-neutral-800 dark:bg-neutral-950 dark:placeholder:text-neutral-600 dark:focus:bg-neutral-950"
            />
            <div className="mt-1 text-right text-[11px] text-muted">
              {name.length}/{MAX_NAME_LENGTH}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">Emoji</label>
            <div className="grid grid-cols-10 gap-1.5">
              {EMOJI_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setEmoji(opt)}
                  aria-label={`Choose emoji ${opt}`}
                  aria-pressed={emoji === opt}
                  className={[
                    'flex h-9 items-center justify-center rounded-lg text-lg',
                    emoji === opt
                      ? 'bg-accent-500 text-white'
                      : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700',
                  ].join(' ')}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">When</label>
            <div className="grid grid-cols-4 gap-1.5">
              {TIME_OF_DAY_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setTimeOfDay(opt)}
                  aria-pressed={timeOfDay === opt}
                  className={[
                    'flex flex-col items-center gap-0.5 rounded-lg px-1 py-2 text-[11px] font-medium',
                    timeOfDay === opt
                      ? 'bg-accent-500 text-white'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700',
                  ].join(' ')}
                >
                  <span className="text-base" aria-hidden="true">{TIME_LABELS[opt].icon}</span>
                  {TIME_LABELS[opt].label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted">Goal</label>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setTargetType('daily')}
                aria-pressed={targetType === 'daily'}
                className={[
                  'flex-1 rounded-lg px-3 py-2 text-xs font-medium',
                  targetType === 'daily'
                    ? 'bg-accent-500 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700',
                ].join(' ')}
              >
                Daily
              </button>
              <button
                type="button"
                onClick={() => setTargetType('weekly')}
                aria-pressed={targetType === 'weekly'}
                className={[
                  'flex-1 rounded-lg px-3 py-2 text-xs font-medium',
                  targetType === 'weekly'
                    ? 'bg-accent-500 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700',
                ].join(' ')}
              >
                X / week
              </button>
            </div>
            {targetType === 'weekly' && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-muted">Times per week:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setWeeklyCount(n)}
                      aria-pressed={weeklyCount === n}
                      className={[
                        'h-7 w-7 rounded-md text-xs font-semibold tabular',
                        weeklyCount === n
                          ? 'bg-accent-500 text-white'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700',
                      ].join(' ')}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 rounded-xl bg-accent-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isEdit ? 'Save' : 'Add habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
