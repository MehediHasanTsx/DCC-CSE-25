'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Sparkles, Volume2, X, Moon, CheckCircle2 } from 'lucide-react';
import { requestNotificationPermission } from '@/lib/utils/sound';
import { syncNotificationSchedules } from '@/lib/utils/schedule-sync';
import { toast } from 'sonner';

const PROMPT_DISMISSED_KEY = 'dcc_notif_prompt_dismissed_until';
const LAST_APP_VERSION_KEY = 'dcc_app_version_seen';
const CURRENT_APP_VERSION = '1.3.0'; // Incremented on updates to re-prompt if needed

const emptySubscribe = () => () => {};

function getSnapshot(): 'updated' | 'standalone' | 'none' {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'none';
  if (Notification.permission !== 'default') return 'none';

  const dismissedUntil = localStorage.getItem(PROMPT_DISMISSED_KEY);
  if (dismissedUntil && Date.now() < parseInt(dismissedUntil, 10)) {
    return 'none';
  }

  const lastVersion = localStorage.getItem(LAST_APP_VERSION_KEY);
  if (lastVersion && lastVersion !== CURRENT_APP_VERSION) {
    try {
      localStorage.setItem(LAST_APP_VERSION_KEY, CURRENT_APP_VERSION);
    } catch {
      // Ignore
    }
    return 'updated';
  }
  try {
    localStorage.setItem(LAST_APP_VERSION_KEY, CURRENT_APP_VERSION);
  } catch {
    // Ignore
  }

  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;

  if (isStandalone) {
    return 'standalone';
  }

  return 'none';
}

function getServerSnapshot(): 'updated' | 'standalone' | 'none' {
  return 'none';
}

export function NotificationPermissionPrompt() {
  const initialReason = useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot);
  const [eventReason, setEventReason] = useState<'installed' | 'updated' | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    // Listen for PWA installation event
    const handleAppInstalled = () => {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        setEventReason('installed');
      }
    };

    // Listen for Service Worker updates
    const handleControllerChange = () => {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        setEventReason('updated');
      }
    };

    window.addEventListener('appinstalled', handleAppInstalled);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    }

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      }
    };
  }, []);

  const handleAllowNotifications = async () => {
    setRequesting(true);
    try {
      const permission = await requestNotificationPermission();
      if (permission === 'granted') {
        toast.success('Routine notifications enabled!', {
          description: 'You will receive alarms and alerts even when the app is minimized or closed.',
          icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
        });
        // Immediately sync schedules to service worker
        await syncNotificationSchedules();
        setDismissed(true);
      } else if (permission === 'denied') {
        toast.error('Permission not granted', {
          description: 'Notifications are blocked. You can enable them later in your browser or device settings.',
        });
        setDismissed(true);
      }
    } catch (err) {
      console.warn('Notification permission error:', err);
    } finally {
      setRequesting(false);
    }
  };

  const handleDismiss = () => {
    // Dismiss for 3 days
    const threeDays = Date.now() + 3 * 24 * 60 * 60 * 1000;
    try {
      localStorage.setItem(PROMPT_DISMISSED_KEY, threeDays.toString());
    } catch {
      // Ignore
    }
    setDismissed(true);
  };

  const activeReason = eventReason ?? (initialReason !== 'none' ? initialReason : null);
  const showPrompt = !dismissed && activeReason !== null;

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-lg animate-in fade-in slide-in-from-bottom-5 duration-300 md:bottom-6">
      <Card className="border-amber-500/30 bg-card/95 backdrop-blur-md shadow-2xl dark:border-amber-500/20 dark:bg-card/95">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                <Bell className="h-5 w-5 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold tracking-tight text-foreground sm:text-base">
                    Enable Routine Notifications
                  </h3>
                  <Badge variant="secondary" className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-300 border-none font-medium">
                    {activeReason === 'installed' ? 'App Installed' : activeReason === 'updated' ? 'New Update' : 'Recommended'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Allow notifications so your class and study routine alarms can ring properly.
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-muted-foreground/60 hover:text-foreground p-1 transition-colors rounded-md"
              aria-label="Dismiss notification prompt"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="my-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 rounded-md bg-muted/40 p-2">
              <Moon className="h-3.5 w-3.5 text-blue-500 shrink-0" />
              <span>Works in sleep & closed mode</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-md bg-muted/40 p-2">
              <Volume2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <span>Plays Hawk-Cuckoo chime</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-xs text-muted-foreground h-8 px-3"
            >
              Maybe Later
            </Button>
            <Button
              size="sm"
              onClick={handleAllowNotifications}
              disabled={requesting}
              className="bg-amber-500 hover:bg-amber-600 text-white font-medium text-xs h-8 px-3.5 shadow-sm"
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              {requesting ? 'Enabling...' : 'Allow Notifications'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
