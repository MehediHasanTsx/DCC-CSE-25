'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { personalRoutineService } from '@/lib/services/personal-routine.service';
import { settingsService } from '@/lib/services/settings.service';
import { playNotificationSound } from '@/lib/utils/sound';
import { syncNotificationSchedules, sendKeepalive } from '@/lib/utils/schedule-sync';
import { isNativeAppSync, setupNotificationListeners } from '@/lib/utils/capacitor-notifications';
import { getLocalDateString } from '@/lib/utils/formatters';
import { toast } from 'sonner';
import type { DayOfWeek } from '@/types/database';

const DAY_NAMES: DayOfWeek[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

export function RoutineNotifier() {
  const router = useRouter();
  const checkingRef = useRef(false);
  const syncedRef = useRef(false);

  // Sync schedules to native/SW on mount and periodically
  const syncSchedules = useCallback(async () => {
    try {
      await syncNotificationSchedules();
      syncedRef.current = true;
    } catch (err) {
      console.warn('Schedule sync failed:', err);
    }
  }, []);

  useEffect(() => {
    // Only run in client browser
    if (typeof window === 'undefined') return;

    const isNative = isNativeAppSync();

    // On native Capacitor, set up tap-to-open listener
    if (isNative) {
      void setupNotificationListeners();
    }

    // Initial sync of schedules
    void syncSchedules();

    // Re-sync schedules every 5 minutes to pick up changes
    const syncInterval = setInterval(() => {
      void syncSchedules();
    }, 5 * 60 * 1000);

    // Keepalive ping every 25 seconds — only needed for web/PWA, not native
    let keepaliveInterval: ReturnType<typeof setInterval> | null = null;
    if (!isNative) {
      keepaliveInterval = setInterval(() => {
        sendKeepalive();
      }, 25000);
    }

    // Re-sync when page becomes visible again (user returns to tab/app)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void syncSchedules();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // ── In-app foreground checker (toast + sound) ─────
    // This runs in both native and web to provide in-app toasts and sound
    // when the user has the app in the foreground.
    const checkRoutineAlerts = async () => {
      if (checkingRef.current) return;
      checkingRef.current = true;

      try {
        // 1. Check settings
        const settings = await settingsService.get();
        const enabled = settings?.routineNotificationsEnabled ?? true;
        if (!enabled) return;

        const sound = settings?.routineNotificationSound || 'common-hawk-cuckoo';

        // 2. Find today's active routines
        const now = new Date();
        const todayStr = getLocalDateString(now);
        const dayName = DAY_NAMES[now.getDay()];
        const currentHours = String(now.getHours()).padStart(2, '0');
        const currentMinutes = String(now.getMinutes()).padStart(2, '0');
        const currentTimeStr = `${currentHours}:${currentMinutes}`;

        const routines = await personalRoutineService.getAllRoutines();
        const activeRoutines = routines.filter((r) => {
          if (!r.isActive) return false;
          if (r.specificDate) return r.specificDate === todayStr;
          return r.weekdays.includes(dayName);
        });

        if (activeRoutines.length === 0) return;

        // 3. Check activities for active routines
        for (const routine of activeRoutines) {
          const activities = await personalRoutineService.getActivities(routine.id);

          for (const activity of activities) {
            // Only notify for priority items with notify === true
            if (!activity.notify) continue;

            // Check if startTime matches current time
            if (activity.startTime === currentTimeStr) {
              const notificationKey = `dcc_routine_notified_${activity.id}_${todayStr}_${currentTimeStr}`;
              if (sessionStorage.getItem(notificationKey)) {
                // Already notified for this minute today
                continue;
              }

              // Mark as notified immediately
              sessionStorage.setItem(notificationKey, 'true');

              // Play notification sound (Common Hawk-Cuckoo by default)
              void playNotificationSound(sound);

              // In-App Toast (native notifications are handled by the OS independently)
              toast(`🔔 Time for ${activity.title}`, {
                description: `${activity.startTime} – ${activity.endTime} • Routine Priority Alert`,
                duration: 7000,
                action: {
                  label: 'View Routine',
                  onClick: () => router.push('/planner'),
                },
              });
            }
          }
        }
      } catch (err) {
        console.warn('Routine notifier check error:', err);
      } finally {
        checkingRef.current = false;
      }
    };

    // Run initial check
    void checkRoutineAlerts();

    // Check every 15 seconds so we never miss the minute change
    const interval = setInterval(checkRoutineAlerts, 15000);

    return () => {
      clearInterval(interval);
      clearInterval(syncInterval);
      if (keepaliveInterval) clearInterval(keepaliveInterval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [router, syncSchedules]);

  return null;
}
