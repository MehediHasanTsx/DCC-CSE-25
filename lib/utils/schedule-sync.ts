/**
 * Notification Schedule Sync
 * 
 * Syncs routine notification schedules from the app's Dexie database
 * to a separate IndexedDB store that the service worker can read
 * independently when the app is backgrounded or closed.
 */

import { db } from '@/lib/db/database';
import { hasActiveDb } from '@/lib/db/user-db';
import { settingsService } from '@/lib/services/settings.service';

const SCHEDULE_DB_NAME = 'dcc_notification_schedules';
const SCHEDULE_DB_VERSION = 1;
const SCHEDULE_STORE = 'schedules';

type DayOfWeek = 'saturday' | 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';

interface ScheduleActivity {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  notify: boolean;
}

interface NotificationSchedule {
  id: string;
  name: string;
  weekdays: DayOfWeek[];
  specificDate?: string;
  isActive: boolean;
  activities: ScheduleActivity[];
}

/**
 * Open the notification schedule IndexedDB (same DB the SW uses)
 */
function openScheduleDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(SCHEDULE_DB_NAME, SCHEDULE_DB_VERSION);
    request.onupgradeneeded = (event) => {
      const idb = (event.target as IDBOpenDBRequest).result;
      if (!idb.objectStoreNames.contains(SCHEDULE_STORE)) {
        idb.createObjectStore(SCHEDULE_STORE, { keyPath: 'id' });
      }
      if (!idb.objectStoreNames.contains('notified')) {
        idb.createObjectStore('notified', { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Build notification schedules from the app database
 */
async function buildSchedules(): Promise<NotificationSchedule[]> {
  if (!hasActiveDb()) return [];

  try {
    // Check if notifications are enabled
    const settings = await settingsService.get();
    const enabled = settings?.routineNotificationsEnabled ?? true;
    if (!enabled) return [];

    const routines = await db().personalRoutines.toArray();
    const schedules: NotificationSchedule[] = [];

    for (const routine of routines) {
      if (!routine.isActive) continue;

      const activities = await db().routineActivities
        .where('routineId')
        .equals(routine.id)
        .toArray();

      // Only include routines that have at least one notify activity
      const notifyActivities = activities.filter((a) => a.notify);
      if (notifyActivities.length === 0) continue;

      schedules.push({
        id: routine.id,
        name: routine.name,
        weekdays: routine.weekdays,
        specificDate: routine.specificDate,
        isActive: routine.isActive,
        activities: notifyActivities.map((a) => ({
          id: a.id,
          title: a.title,
          startTime: a.startTime,
          endTime: a.endTime,
          notify: !!a.notify,
        })),
      });
    }

    return schedules;
  } catch (err) {
    console.warn('[ScheduleSync] Failed to build schedules:', err);
    return [];
  }
}

/**
 * Sync schedules to both IndexedDB (for SW direct access) and via postMessage
 */
export async function syncNotificationSchedules(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;

  try {
    const schedules = await buildSchedules();

    // 1. Write directly to the schedule IndexedDB (SW can read this)
    try {
      const idb = await openScheduleDB();
      const tx = idb.transaction(SCHEDULE_STORE, 'readwrite');
      const store = tx.objectStore(SCHEDULE_STORE);
      store.clear();
      for (const schedule of schedules) {
        store.put(schedule);
      }
    } catch (err) {
      console.warn('[ScheduleSync] IDB write failed:', err);
    }

    // 2. Also send via postMessage to actively running SW
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg.active) {
        reg.active.postMessage({
          type: 'SYNC_SCHEDULES',
          data: schedules,
        });
      }
    } catch (err) {
      console.warn('[ScheduleSync] postMessage failed:', err);
    }

    // 3. Register periodic sync if supported (for when app is fully closed)
    try {
      const reg = await navigator.serviceWorker.ready;
      if ('periodicSync' in reg) {
        await (reg as unknown as { periodicSync: { register: (tag: string, options: { minInterval: number }) => Promise<void> } })
          .periodicSync.register('check-routine-notifications', {
            minInterval: 60 * 1000, // Check every minute minimum
          });
      }
    } catch {
      // Periodic sync not supported or permission denied — that's ok
    }
  } catch (err) {
    console.warn('[ScheduleSync] sync failed:', err);
  }
}

/**
 * Send a keepalive ping to the service worker to prevent it from being killed
 * This should be called periodically from the app while it's open.
 */
export function sendKeepalive(): void {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker.ready.then((reg) => {
    if (reg.active) {
      const channel = new MessageChannel();
      reg.active.postMessage({ type: 'KEEPALIVE' }, [channel.port2]);
    }
  }).catch(() => {});
}
