import { useEffect } from 'react';

export default function ConfirmDeleteModal({ habit, onCancel, onConfirm }) {
  useEffect(() => {
    if (!habit) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [habit, onCancel]);

  if (!habit) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-title"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="delete-title" className="text-lg font-semibold">
          Delete habit?
        </h2>
        <p className="mt-2 text-sm text-muted">
          This will remove <span className="font-medium text-neutral-800 dark:text-neutral-200">{habit.emoji} {habit.name}</span> and all of its completion history. This can't be undone.
        </p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(habit.id)}
            className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
