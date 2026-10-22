const CACHE_NAME = 'dcc-cse-v4';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/sounds/common-hawk-cuckoo.mp3',
  '/sounds/common-hawk-cuckoo.mpeg',
];

// ── IndexedDB helpers for notification schedules ─────

const SCHEDULE_DB_NAME = 'dcc_notification_schedules';
const SCHEDULE_DB_VERSION = 1;
const SCHEDULE_STORE = 'schedules';
const NOTIFIED_STORE = 'notified';

function openScheduleDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(SCHEDULE_DB_NAME, SCHEDULE_DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(SCHEDULE_STORE)) {
        db.createObjectStore(SCHEDULE_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(NOTIFIED_STORE)) {
        db.createObjectStore(NOTIFIED_STORE, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getAllSchedules() {
  return openScheduleDB().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(SCHEDULE_STORE, 'readonly');
      const store = tx.objectStore(SCHEDULE_STORE);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  });
}

function wasNotified(key) {
  return openScheduleDB().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(NOTIFIED_STORE, 'readonly');
      const store = tx.objectStore(NOTIFIED_STORE);
      const request = store.get(key);
      request.onsuccess = () => resolve(!!request.result);
      request.onerror = () => reject(request.error);
    });
  });
}

function markNotified(key) {
  return openScheduleDB().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(NOTIFIED_STORE, 'readwrite');
      const store = tx.objectStore(NOTIFIED_STORE);
      const request = store.put({ key, timestamp: Date.now() });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  });
}

function cleanupOldNotified() {
  // Remove notified keys older than 24 hours
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  return openScheduleDB().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(NOTIFIED_STORE, 'readwrite');
      const store = tx.objectStore(NOTIFIED_STORE);
      const request = store.getAll();
      request.onsuccess = () => {
        const items = request.result || [];
        for (const item of items) {
          if (item.timestamp < cutoff) {
            store.delete(item.key);
          }
        }
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  });
}

// ── Background notification checker ──────────────────

async function checkScheduledNotifications() {
  try {
    const schedules = await getAllSchedules();
    if (!schedules || schedules.length === 0) return;

    const now = new Date();
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHours}:${currentMinutes}`;

    // Get today's info
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayDay = dayNames[now.getDay()];
    const todayDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    for (const schedule of schedules) {
      // Check if routine is active today
      if (!schedule.isActive) continue;

      let matchesDay = false;
      if (schedule.specificDate) {
        matchesDay = schedule.specificDate === todayDate;
      } else if (schedule.weekdays && Array.isArray(schedule.weekdays)) {
        matchesDay = schedule.weekdays.includes(todayDay);
      }
      if (!matchesDay) continue;

      // Check activities
      const activities = schedule.activities || [];
      for (const activity of activities) {
        if (!activity.notify) continue;
        if (activity.startTime !== currentTimeStr) continue;

        const notifKey = `sw_notif_${activity.id}_${todayDate}_${currentTimeStr}`;
        const alreadyNotified = await wasNotified(notifKey);
        if (alreadyNotified) continue;

        // Mark as notified first to prevent duplicates
        await markNotified(notifKey);

        // Show notification
        try {
          await self.registration.showNotification(`🔔 Time for ${activity.title}`, {
            body: `${activity.startTime} – ${activity.endTime} • Routine Priority Reminder`,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: `routine-${activity.id}-${currentTimeStr}`,
            data: { url: '/planner' },
            requireInteraction: true,
            vibrate: [200, 100, 200, 100, 200],
          });
        } catch (err) {
          console.warn('[SW] showNotification failed:', err);
        }
      }
    }

    // Cleanup old notified entries periodically (roughly every 100 checks)
    if (Math.random() < 0.01) {
      await cleanupOldNotified();
    }
  } catch (err) {
    console.warn('[SW] checkScheduledNotifications error:', err);
  }
}

// ── Self-waking interval in the service worker ───────
// Service workers can be killed by the browser, but the periodic sync
// and message-based approach keeps it alive during active use.

let checkInterval = null;

function startBackgroundChecker() {
  if (checkInterval) return;
  // Check every 30 seconds
  checkInterval = setInterval(() => {
    checkScheduledNotifications();
  }, 30000);
  // Also run immediately
  checkScheduledNotifications();
}

function stopBackgroundChecker() {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
}

// ── Install ──────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// ── Activate ─────────────────────────────────────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
  // Start checking notifications immediately on activate
  startBackgroundChecker();
});

// ── Fetch ────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Never cache auth API responses — always go to network
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({ error: 'Offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });
      })
    );
    return;
  }

  // Stale-while-revalidate for pages and assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch background update
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {/* Offline fallback */});
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // Cache successful GET responses for static assets
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        return caches.match('/');
      });
    })
  );
});

// ── Message handler ──────────────────────────────────
// The client sends schedule updates via postMessage

self.addEventListener('message', (event) => {
  const { type, data } = event.data || {};

  if (type === 'SYNC_SCHEDULES') {
    // Client is syncing notification schedules
    // Store them in the schedule DB
    openScheduleDB().then((db) => {
      const tx = db.transaction(SCHEDULE_STORE, 'readwrite');
      const store = tx.objectStore(SCHEDULE_STORE);
      // Clear existing and re-add all
      store.clear();
      const schedules = data || [];
      for (const schedule of schedules) {
        store.put(schedule);
      }
      tx.oncomplete = () => {
        // Ensure checker is running
        startBackgroundChecker();
      };
    }).catch((err) => {
      console.warn('[SW] Failed to sync schedules:', err);
    });
  }

  if (type === 'START_CHECKER') {
    startBackgroundChecker();
  }

  if (type === 'STOP_CHECKER') {
    stopBackgroundChecker();
  }

  if (type === 'KEEPALIVE') {
    // Keep the service worker alive — just acknowledge
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ status: 'alive' });
    }
  }
});

// ── Periodic Sync (where supported) ──────────────────

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-routine-notifications') {
    event.waitUntil(checkScheduledNotifications());
  }
});

// ── Notification Click ───────────────────────────────

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/planner';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/planner') && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
