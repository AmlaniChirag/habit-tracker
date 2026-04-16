import { useCallback, useEffect, useRef } from 'react';

/**
 * Manages daily reminder notifications via Service Worker.
 * @param {string|null} reminderTime - 'HH:MM' or null if disabled
 * @param {number} habitsLeft - count of incomplete habits for today
 * @param {function} onTimeChange - callback to persist new time to state
 */
export default function useReminder(reminderTime, habitsLeft, onTimeChange) {
  const swRef = useRef(null);

  // Register the service worker once.
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      swRef.current = reg;
    });
  }, []);

  // Whenever reminderTime or habitsLeft changes, re-schedule.
  useEffect(() => {
    if (!swRef.current || !swRef.current.active) return;
    if (reminderTime) {
      swRef.current.active.postMessage({
        type: 'SCHEDULE_REMINDER',
        payload: { time: reminderTime, habitsLeft },
      });
    } else {
      swRef.current.active.postMessage({ type: 'CANCEL_REMINDER' });
    }
  }, [reminderTime, habitsLeft]);

  const requestPermissionAndSetTime = useCallback(
    async (time) => {
      if (!('Notification' in window)) return false;
      if (Notification.permission === 'denied') return false;
      if (Notification.permission !== 'granted') {
        const result = await Notification.requestPermission();
        if (result !== 'granted') return false;
      }
      onTimeChange(time);
      return true;
    },
    [onTimeChange]
  );

  const disableReminder = useCallback(() => {
    onTimeChange(null);
    if (swRef.current && swRef.current.active) {
      swRef.current.active.postMessage({ type: 'CANCEL_REMINDER' });
    }
  }, [onTimeChange]);

  return {
    requestPermissionAndSetTime,
    disableReminder,
    notificationsSupported: typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator,
    permissionDenied: typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'denied',
  };
}
