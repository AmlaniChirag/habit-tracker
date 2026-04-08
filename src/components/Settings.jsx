import { useRef, useState } from 'react';

export default function Settings({ theme, onToggleTheme, onExport, onImport }) {
  const fileRef = useRef(null);
  const [status, setStatus] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await onImport(file);
      setStatus({ kind: 'ok', text: 'Data imported successfully.' });
    } catch (err) {
      setStatus({ kind: 'err', text: err.message || 'Import failed.' });
    } finally {
      e.target.value = '';
      setTimeout(() => setStatus(null), 4000);
    }
  };

  return (
    <div className="surface rounded-2xl p-4 sm:p-5">
      <div className="text-xs font-medium uppercase tracking-wide text-muted">Settings</div>

      <div className="mt-3 flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">Theme</div>
          <div className="text-xs text-muted">Currently {theme}</div>
        </div>
        <button
          type="button"
          onClick={onToggleTheme}
          className="rounded-xl border border-neutral-200 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        >
          {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
        </button>
      </div>

      <div className="mt-4 border-t border-neutral-200 pt-4 dark:border-neutral-800">
        <div className="text-sm font-medium">Backup</div>
        <div className="text-xs text-muted">Export or restore your data as JSON.</div>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onExport}
            className="rounded-xl border border-neutral-200 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800"
          >
            Export JSON
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-xl border border-neutral-200 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800"
          >
            Import JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            onChange={handleFile}
            className="hidden"
            aria-hidden="true"
          />
        </div>
        {status && (
          <div
            role="status"
            className={`mt-2 text-xs ${
              status.kind === 'ok' ? 'text-emerald-500' : 'text-red-500'
            }`}
          >
            {status.text}
          </div>
        )}
      </div>
    </div>
  );
}
