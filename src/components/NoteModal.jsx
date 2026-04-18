import { useEffect, useRef, useState } from 'react';

const MOODS = ['😔', '😐', '🙂', '😊', '🔥'];
const MAX_NOTE = 280;

export default function NoteModal({ habit, date, existingNote, onSave, onClose }) {
  const [mood, setMood] = useState(existingNote?.mood || '');
  const [text, setText] = useState(existingNote?.text || '');
  const textRef = useRef(null);

  useEffect(() => {
    if (habit) setTimeout(() => textRef.current?.focus(), 80);
  }, [habit]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!habit) return null;

  const handleSave = () => {
    onSave(habit.id, date, text.trim(), mood);
    onClose();
  };

  const handleSkip = () => {
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
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-500/15 text-xl">
            {habit.emoji}
          </div>
          <div>
            <div className="text-sm font-semibold">{habit.name}</div>
            <div className="text-[11px] text-muted">Add a quick note?</div>
          </div>
        </div>

        {/* Mood picker */}
        <div className="mt-4">
          <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted">How'd it feel?</div>
          <div className="flex gap-2">
            {MOODS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMood(mood === m ? '' : m)}
                className={[
                  'flex h-10 flex-1 items-center justify-center rounded-xl text-xl transition-all',
                  mood === m
                    ? 'bg-accent-500 ring-2 ring-accent-400 ring-offset-1 dark:ring-offset-neutral-900'
                    : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700',
                ].join(' ')}
                aria-label={`Mood: ${m}`}
                aria-pressed={mood === m}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Text input */}
        <div className="mt-3">
          <textarea
            ref={textRef}
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_NOTE))}
            placeholder="Optional note…"
            rows={2}
            className="w-full resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm placeholder:text-neutral-400 focus:border-accent-500 focus:bg-white focus:outline-none dark:border-neutral-800 dark:bg-neutral-950 dark:placeholder:text-neutral-600"
          />
          {text.length > 0 && (
            <div className="mt-1 text-right text-[11px] text-muted">{text.length}/{MAX_NOTE}</div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={handleSkip}
            className="flex-1 rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-muted hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800"
          >
            Skip
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!mood && !text.trim()}
            className="flex-1 rounded-xl bg-accent-500 px-4 py-2 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Save note
          </button>
        </div>
      </div>
    </div>
  );
}
