'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { personalRoutineService } from '@/lib/services/personal-routine.service';
import { settingsService } from '@/lib/services/settings.service';
import { playNotificationSound, isStandaloneApp } from '@/lib/utils/sound';
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

  useEffect(() => {
    // Only run in client browser
    if (typeof window === 'undefined') return;

    const checkRoutineAlerts = async () => {
      if (checkingRef.current) return;
      checkingRef.current = true;

      try {
        // 1. Check settings
        const settings = await settingsService.get();
        const enabled = settings?.routineNotificationsEnabled ?? true;
        if (!enabled) return;

        const sound = settings?.routineNotificationSound || 'common-hawk-cuckoo';

        // 2. Determine if device condition applies
        // If on mobile, prioritize when installed (standalone). Always allow if notification permission granted.
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        const standalone = isStandaloneApp();
        if (isMobile && !standalone) {
          // On mobile phones, only trigger if downloaded / installed as PWA (per user requirement)
          return;
        }

        // 3. Find today's active routines
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

        // 4. Check activities for active routines
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

              // Native System Notification (Service Worker or Notification API)
              if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                try {
                  if ('serviceWorker' in navigator) {
                    const reg = await navigator.serviceWorker.ready;
                    if (reg && reg.showNotification) {
                      await reg.showNotification(`Time for ${activity.title}`, {
                        body: `${activity.startTime} – ${activity.endTime} • Routine Priority Reminder`,
                        icon: '/icon-192.png',
                        badge: '/icon-192.png',
                        tag: `routine-${activity.id}-${currentTimeStr}`,
                        data: { url: '/planner' },
                      });
                    } else {
                      new Notification(`Time for ${activity.title}`, {
                        body: `${activity.startTime} – ${activity.endTime} • Routine Priority Reminder`,
                        icon: '/icon-192.png',
                      });
                    }
                  } else {
                    new Notification(`Time for ${activity.title}`, {
                      body: `${activity.startTime} – ${activity.endTime} • Routine Priority Reminder`,
                      icon: '/icon-192.png',
                    });
                  }
                } catch (e) {
                  console.warn('System notification failed:', e);
                }
              }

              // In-App Toast
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

    return () => clearInterval(interval);
  }, [router]);

  return null;
}
