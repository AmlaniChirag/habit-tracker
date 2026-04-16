// Habit Tracker Service Worker — handles daily reminder notifications.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// Listen for messages from the app to schedule/cancel reminders.
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};
  if (type === 'SCHEDULE_REMINDER') {
    scheduleReminder(payload.time, payload.habitsLeft);
  } else if (type === 'CANCEL_REMINDER') {
    // Clear any pending timeout (best-effort; timers don't survive SW shutdown).
    if (self._reminderTimeout) {
      clearTimeout(self._reminderTimeout);
      self._reminderTimeout = null;
    }
  }
});

function scheduleReminder(timeStr, habitsLeft) {
  if (!timeStr) return;
  const [h, m] = timeStr.split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(h, m, 0, 0);
  // If the time has already passed today, schedule for tomorrow.
  if (target <= now) target.setDate(target.getDate() + 1);
  const delay = target - now;

  if (self._reminderTimeout) clearTimeout(self._reminderTimeout);
  self._reminderTimeout = setTimeout(() => {
    showReminderNotification(habitsLeft);
  }, delay);
}

function showReminderNotification(habitsLeft) {
  const count = habitsLeft || 0;
  const body = count > 0
    ? `You have ${count} habit${count === 1 ? '' : 's'} left today.`
    : 'All habits done today! Keep it up.';
  self.registration.showNotification('Habit Tracker', {
    body,
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: 'daily-reminder',
    renotify: true,
  });
}

// Clicking the notification opens/focuses the app.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow('/');
    })
  );
});
