'use client';

import { useEffect } from 'react';
import { syncNotificationSchedules } from '@/lib/utils/schedule-sync';

export function SwRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // Register the service worker
    navigator.serviceWorker
      .register('/sw.js')
      .then(async (registration) => {
        // Wait for the SW to become active, then sync schedules
        if (registration.active) {
          // SW already active, sync immediately
          await syncNotificationSchedules();
        } else {
          // Wait for activation
          const sw = registration.installing || registration.waiting;
          if (sw) {
            sw.addEventListener('statechange', async () => {
              if (sw.state === 'activated') {
                await syncNotificationSchedules();
              }
            });
          }
        }

        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // Check for SW updates every hour
      })
      .catch((err) => {
        console.error('Service worker registration failed:', err);
      });

    // Listen for messages from the service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'SCHEDULE_CHECK_COMPLETE') {
        // SW completed a background check — we could update UI if needed
      }
    });
  }, []);

  return null;
}
