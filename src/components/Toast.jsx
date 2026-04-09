import { useEffect, useState } from 'react';

/**
 * Minimal toast: a single message with an optional action button.
 * Auto-dismisses after `duration` ms (default 5000).
 */
export default function Toast({ toast, onDismiss }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!toast) return;
    setLeaving(false);
    const duration = toast.duration ?? 5000;
    const leaveAt = setTimeout(() => setLeaving(true), duration - 200);
    const dismissAt = setTimeout(() => onDismiss(toast.id), duration);
    return () => {
      clearTimeout(leaveAt);
      clearTimeout(dismissAt);
    };
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 sm:bottom-6"
      role="status"
      aria-live="polite"
    >
      <div
        className={[
          'pointer-events-auto flex max-w-md items-center gap-3 rounded-full border px-4 py-2.5 shadow-lg',
          'border-neutral-200 bg-white/95 backdrop-blur-md',
          'dark:border-neutral-800 dark:bg-neutral-900/95',
          'transition-all duration-200 ease-out',
          leaving ? 'translate-y-2 opacity-0' : 'translate-y-0 opacity-100',
        ].join(' ')}
      >
        <span className="text-sm">{toast.message}</span>
        {toast.action && (
          <button
            type="button"
            onClick={() => {
              toast.action.onClick();
              onDismiss(toast.id);
            }}
            className="rounded-full bg-accent-500 px-3 py-1 text-xs font-medium text-white hover:bg-accent-600"
          >
            {toast.action.label}
          </button>
        )}
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="rounded-full p-0.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
          aria-label="Dismiss notification"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path
              fillRule="evenodd"
              d="M4.28 3.22a.75.75 0 00-1.06 1.06L8.94 10l-5.72 5.72a.75.75 0 101.06 1.06L10 11.06l5.72 5.72a.75.75 0 101.06-1.06L11.06 10l5.72-5.72a.75.75 0 00-1.06-1.06L10 8.94 4.28 3.22z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
