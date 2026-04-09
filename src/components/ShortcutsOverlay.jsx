import { useEffect } from 'react';

const SHORTCUTS = [
  { keys: ['1', '–', '9'], desc: 'Toggle a habit by its position' },
  { keys: ['N'], desc: 'New habit' },
  { keys: ['T'], desc: 'Toggle theme' },
  { keys: ['Y'], desc: 'Jump to yesterday mode' },
  { keys: ['?'], desc: 'Show this menu' },
  { keys: ['Esc'], desc: 'Close any open dialog' },
];

function Kbd({ children }) {
  return (
    <kbd className="inline-flex min-w-[1.75rem] items-center justify-center rounded-md border border-neutral-200 bg-neutral-100 px-1.5 py-0.5 font-mono text-[11px] font-medium text-neutral-700 shadow-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
      {children}
    </kbd>
  );
}

export default function ShortcutsOverlay({ open, onClose }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="shortcuts-title" className="text-lg font-semibold">
          Keyboard shortcuts
        </h2>
        <ul className="mt-4 space-y-2.5">
          {SHORTCUTS.map((s) => (
            <li key={s.desc} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-neutral-700 dark:text-neutral-300">{s.desc}</span>
              <span className="flex items-center gap-1">
                {s.keys.map((k, i) =>
                  k === '–' ? (
                    <span key={i} className="text-xs text-muted">
                      –
                    </span>
                  ) : (
                    <Kbd key={i}>{k}</Kbd>
                  )
                )}
              </span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
