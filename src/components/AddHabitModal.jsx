import { useEffect, useRef, useState } from 'react';
import { MAX_NAME_LENGTH, DEFAULT_EMOJI } from '../hooks/useHabits.js';

const EMOJI_OPTIONS = [
  '✅', '🧘', '🏃', '💧', '📚', '🛏️', '🥗', '💪', '✍️', '🎨',
  '🎸', '🧠', '☀️', '🌱', '💻', '🙏', '🍎', '🚶', '🧹', '💤',
];

export default function AddHabitModal({ open, onClose, onAdd }) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(DEFAULT_EMOJI);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setName('');
      setEmoji(DEFAULT_EMOJI);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

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
    onAdd(trimmed, emoji);
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
        className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="add-habit-title" className="text-lg font-semibold">
          New habit
        </h2>
        <p className="mt-1 text-sm text-muted">Pick a name and an emoji.</p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
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
              Add habit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
