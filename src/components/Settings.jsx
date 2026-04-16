import { useRef, useState } from 'react';
import { FREEZE_TOKENS_PER_MONTH } from '../hooks/useHabits.js';

export default function Settings({
  theme,
  onToggleTheme,
  onExport,
  onImport,
  user,
  onSignOut,
  reminderTime,
  onReminderChange,
  onReminderDisable,
  notificationsSupported,
  permissionDenied,
  freezeTokens,
}) {
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

  const handleReminderToggle = async () => {
    if (reminderTime) {
      onReminderDisable();
    } else {
      const ok = await onReminderChange('21:00');
      if (!ok) {
        setStatus({ kind: 'err', text: 'Notification permission denied.' });
        setTimeout(() => setStatus(null), 4000);
      }
    }
  };

  const handleTimeChange = async (e) => {
    const ok = await onReminderChange(e.target.value);
    if (!ok) {
      setStatus({ kind: 'err', text: 'Notification permission denied.' });
      setTimeout(() => setStatus(null), 4000);
    }
  };

  return (
    <div className="surface rounded-2xl p-5 sm:p-6">
      <div className="eyebrow">Settings</div>

      {user && (
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {user.photoURL && (
              <img
                src={user.photoURL}
                alt=""
                className="h-8 w-8 rounded-full"
                referrerPolicy="no-referrer"
              />
            )}
            <div>
              <div className="text-sm font-medium">{user.displayName}</div>
              <div className="text-[11px] text-muted">{user.email}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="rounded-xl border border-neutral-200 px-3 py-1.5 text-xs font-medium text-muted hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-800"
          >
            Sign out
          </button>
        </div>
      )}

      {/* Daily Reminder */}
      {notificationsSupported && (
        <div className={`${user ? 'mt-4 border-t border-neutral-200 pt-4 dark:border-neutral-800' : 'mt-3'}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Daily reminder</div>
              <div className="text-xs text-muted">
                {reminderTime
                  ? `Notify at ${reminderTime}`
                  : permissionDenied
                  ? 'Notifications blocked by browser'
                  : 'Get reminded to complete your habits'}
              </div>
            </div>
            <button
              type="button"
              onClick={handleReminderToggle}
              disabled={permissionDenied && !reminderTime}
              className={[
                'relative h-7 w-12 rounded-full transition-colors duration-200',
                reminderTime
                  ? 'bg-accent-500'
                  : 'bg-neutral-300 dark:bg-neutral-700',
                permissionDenied && !reminderTime ? 'opacity-50 cursor-not-allowed' : '',
              ].join(' ')}
              aria-label={reminderTime ? 'Disable daily reminder' : 'Enable daily reminder'}
            >
              <span
                className={[
                  'absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200',
                  reminderTime ? 'translate-x-5' : 'translate-x-0.5',
                ].join(' ')}
              />
            </button>
          </div>
          {reminderTime && (
            <div className="mt-2">
              <input
                type="time"
                value={reminderTime}
                onChange={handleTimeChange}
                className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-sm dark:border-neutral-800 dark:bg-neutral-950"
              />
            </div>
          )}
        </div>
      )}

      {/* Streak Freeze Tokens */}
      <div className={`mt-4 border-t border-neutral-200 pt-4 dark:border-neutral-800`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Streak freezes</div>
            <div className="text-xs text-muted">
              Auto-used when you miss a day. Resets monthly.
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: FREEZE_TOKENS_PER_MONTH }, (_, i) => (
              <div
                key={i}
                className={[
                  'flex h-8 w-8 items-center justify-center rounded-lg text-lg',
                  i < freezeTokens
                    ? 'bg-sky-500/15 text-sky-500'
                    : 'bg-neutral-200/60 text-neutral-400 dark:bg-neutral-800/60 dark:text-neutral-600',
                ].join(' ')}
                aria-label={i < freezeTokens ? 'Freeze token available' : 'Freeze token used'}
              >
                {i < freezeTokens ? '🧊' : '  '}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={`mt-4 border-t border-neutral-200 pt-4 dark:border-neutral-800 flex items-center justify-between`}>
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
          {theme === 'dark' ? 'Light' : 'Dark'}
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
