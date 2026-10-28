/**
 * Capacitor Native Local Notifications
 *
 * Uses @capacitor/local-notifications to schedule notifications through
 * the Android AlarmManager. Unlike the web Service Worker approach,
 * these notifications fire reliably even when the app is completely
 * closed / swiped away from recent apps.
 *
 * This module is only active when running inside a Capacitor native shell.
 */

import type { DayOfWeek } from '@/types/database';

// ── Dynamic imports (tree-shaken on web) ─────────────

let _Capacitor: typeof import('@capacitor/core').Capacitor | null = null;
let _LocalNotifications: typeof import('@capacitor/local-notifications').LocalNotifications | null = null;

async function loadCapacitor() {
  if (_Capacitor) return { Capacitor: _Capacitor, LocalNotifications: _LocalNotifications! };
  try {
    const core = await import('@capacitor/core');
    const ln = await import('@capacitor/local-notifications');
    _Capacitor = core.Capacitor;
    _LocalNotifications = ln.LocalNotifications;
    return { Capacitor: _Capacitor, LocalNotifications: _LocalNotifications };
  } catch {
    return null;
  }
}

// ── Platform detection ───────────────────────────────

/**
 * Returns true when the code is running inside a Capacitor native shell
 * (i.e. the Android APK), NOT in a regular browser or PWA.
 */
export async function isNativeApp(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const cap = await loadCapacitor();
  return cap?.Capacitor?.isNativePlatform() ?? false;
}

/**
 * Synchronous check – uses the window.Capacitor global that the native
 * shell injects before any JS runs.  Falls back to false.
 */
export function isNativeAppSync(): boolean {
  if (typeof window === 'undefined') return false;
  // Capacitor native shell injects this global
  const win = window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } };
  return win.Capacitor?.isNativePlatform?.() ?? false;
}

// ── Permission helpers ───────────────────────────────

export async function requestNativeNotificationPermission(): Promise<'granted' | 'denied'> {
  const cap = await loadCapacitor();
  if (!cap) return 'denied';
  const { LocalNotifications } = cap;

  const check = await LocalNotifications.checkPermissions();
  if (check.display === 'granted') return 'granted';

  const result = await LocalNotifications.requestPermissions();
  return result.display === 'granted' ? 'granted' : 'denied';
}

export async function checkNativeNotificationPermission(): Promise<'granted' | 'denied' | 'prompt'> {
  const cap = await loadCapacitor();
  if (!cap) return 'denied';
  const { LocalNotifications } = cap;

  const check = await LocalNotifications.checkPermissions();
  if (check.display === 'granted') return 'granted';
  if (check.display === 'denied') return 'denied';
  return 'prompt';
}

// ── Notification ID generation ───────────────────────
// Capacitor requires numeric IDs. We hash the string ID to a 32-bit int.

function hashStringToInt(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32-bit integer
  }
  // Ensure positive and within safe range for Android notification IDs
  return Math.abs(hash) % 2_000_000_000;
}

// ── Day-of-week mapping ──────────────────────────────
// Capacitor uses 1 = Sunday … 7 = Saturday
const DAY_TO_NUM: Record<DayOfWeek, number> = {
  sunday: 1,
  monday: 2,
  tuesday: 3,
  wednesday: 4,
  thursday: 5,
  friday: 6,
  saturday: 7,
};

// ── Schedule interface ───────────────────────────────

interface ScheduleActivity {
  id: string;
  title: string;
  startTime: string; // "HH:MM"
  endTime: string;
  notify: boolean;
}

interface NotificationSchedule {
  id: string;
  name: string;
  weekdays: DayOfWeek[];
  specificDate?: string; // "YYYY-MM-DD"
  isActive: boolean;
  activities: ScheduleActivity[];
}

// ── Core scheduling ──────────────────────────────────

/**
 * Cancel ALL previously scheduled native notifications and re-schedule
 * from the current set of routines.  This is the main entry point called
 * by schedule-sync.ts whenever routines change.
 */
export async function scheduleNativeNotifications(
  schedules: NotificationSchedule[],
): Promise<void> {
  const cap = await loadCapacitor();
  if (!cap) return;
  const { LocalNotifications } = cap;

  // 1. Check permission first
  const perm = await LocalNotifications.checkPermissions();
  if (perm.display !== 'granted') {
    console.warn('[NativeNotif] Permission not granted, skipping schedule');
    return;
  }

  // 2. Cancel all existing scheduled notifications
  try {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({
        notifications: pending.notifications.map((n) => ({ id: n.id })),
      });
    }
  } catch (err) {
    console.warn('[NativeNotif] Failed to cancel pending:', err);
  }

  // 3. Build new notification list
  const notifications: Array<{
    id: number;
    title: string;
    body: string;
    schedule: Record<string, unknown>;
    sound: string | undefined;
    smallIcon: string | undefined;
    iconColor: string | undefined;
    extra: Record<string, string>;
  }> = [];

  for (const routine of schedules) {
    if (!routine.isActive) continue;

    for (const activity of routine.activities) {
      if (!activity.notify) continue;

      const [hourStr, minStr] = activity.startTime.split(':');
      const hour = parseInt(hourStr, 10);
      const minute = parseInt(minStr, 10);
      if (isNaN(hour) || isNaN(minute)) continue;

      if (routine.specificDate) {
        // ── One-time notification for a specific date ──
        const [year, month, day] = routine.specificDate.split('-').map(Number);
        const scheduledDate = new Date(year, month - 1, day, hour, minute, 0);

        // Skip if already in the past
        if (scheduledDate.getTime() <= Date.now()) continue;

        const notifId = hashStringToInt(`${activity.id}_${routine.specificDate}`);

        notifications.push({
          id: notifId,
          title: `🔔 Time for ${activity.title}`,
          body: `${activity.startTime} – ${activity.endTime} • ${routine.name}`,
          schedule: {
            at: scheduledDate,
            allowWhileIdle: true,
          },
          sound: undefined,
          smallIcon: 'ic_stat_notification',
          iconColor: '#f59e0b',
          extra: { url: '/planner', routineId: routine.id, activityId: activity.id },
        });
      } else if (routine.weekdays && routine.weekdays.length > 0) {
        // ── Recurring notification for specific weekdays ──
        for (const day of routine.weekdays) {
          const weekdayNum = DAY_TO_NUM[day];
          if (!weekdayNum) continue;

          const notifId = hashStringToInt(`${activity.id}_${day}`);

          notifications.push({
            id: notifId,
            title: `🔔 Time for ${activity.title}`,
            body: `${activity.startTime} – ${activity.endTime} • ${routine.name}`,
            schedule: {
              on: {
                weekday: weekdayNum,
                hour,
                minute,
              },
              allowWhileIdle: true,
              // Recurring: this will repeat every week on this day
            },
            sound: undefined,
            smallIcon: 'ic_stat_notification',
            iconColor: '#f59e0b',
            extra: { url: '/planner', routineId: routine.id, activityId: activity.id },
          });
        }
      }
    }
  }

  // 4. Schedule all notifications
  if (notifications.length > 0) {
    try {
      await LocalNotifications.schedule({ notifications: notifications as never });
      console.log(`[NativeNotif] Scheduled ${notifications.length} notifications`);
    } catch (err) {
      console.warn('[NativeNotif] Failed to schedule:', err);
    }
  }
}

/**
 * Schedule a single test notification that fires in 3 seconds
 */
export async function scheduleTestNotification(): Promise<boolean> {
  const cap = await loadCapacitor();
  if (!cap) return false;
  const { LocalNotifications } = cap;

  const perm = await LocalNotifications.checkPermissions();
  if (perm.display !== 'granted') return false;

  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: 999999,
          title: '🔔 DCC CSE Routine Alert (Test)',
          body: 'Time for Office Work (09:00 – 17:00) • Priority Routine Reminder',
          schedule: { at: new Date(Date.now() + 3000), allowWhileIdle: true },
          smallIcon: 'ic_stat_notification',
          iconColor: '#f59e0b',
          extra: { url: '/planner' },
        } as never,
      ],
    });
    return true;
  } catch (err) {
    console.warn('[NativeNotif] Test notification failed:', err);
    return false;
  }
}

/**
 * Cancel all scheduled native notifications
 */
export async function cancelAllNativeNotifications(): Promise<void> {
  const cap = await loadCapacitor();
  if (!cap) return;
  const { LocalNotifications } = cap;

  try {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({
        notifications: pending.notifications.map((n) => ({ id: n.id })),
      });
    }
  } catch (err) {
    console.warn('[NativeNotif] Failed to cancel all:', err);
  }
}

/**
 * Set up the notification action listener (tap → open /planner)
 */
export async function setupNotificationListeners(): Promise<void> {
  const cap = await loadCapacitor();
  if (!cap) return;
  const { LocalNotifications } = cap;

  LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
    const url = action.notification.extra?.url || '/planner';
    // Navigate within the Capacitor WebView
    if (typeof window !== 'undefined') {
      window.location.href = url;
    }
  });
}

