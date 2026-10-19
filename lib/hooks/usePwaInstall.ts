'use client';

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const PWA_INSTALLED_STORAGE_KEY = 'dcc_cse_pwa_installed';

// Global reference so prompt isn't lost during page route changes
let _globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
const _promptListeners = new Set<(prompt: BeforeInstallPromptEvent | null) => void>();

function notifyPromptListeners() {
  _promptListeners.forEach((listener) => listener(_globalDeferredPrompt));
}

function getStoredInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(PWA_INSTALLED_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    _globalDeferredPrompt = e as BeforeInstallPromptEvent;
    notifyPromptListeners();
  });

  window.addEventListener('appinstalled', () => {
    _globalDeferredPrompt = null;
    try {
      localStorage.setItem(PWA_INSTALLED_STORAGE_KEY, 'true');
    } catch {
      // Ignore
    }
    notifyPromptListeners();
  });
}

const emptySubscribe = () => () => {};

function getIsIOS() {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
}

function getIsStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: window-controls-overlay)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

function subscribeStandalone(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  const media = window.matchMedia('(display-mode: standalone)');
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    () => _globalDeferredPrompt
  );
  const [hasInstalledEventFired, setHasInstalledEventFired] = useState<boolean>(
    () => getStoredInstalled()
  );

  const isIOS = useSyncExternalStore(emptySubscribe, getIsIOS, () => false);
  const isStandalone = useSyncExternalStore(subscribeStandalone, getIsStandalone, () => false);
  const isInstalled = hasInstalledEventFired || isStandalone;

  useEffect(() => {
    // If browser supports getInstalledRelatedApps (Chrome 80+), check if PWA is already installed
    if (typeof navigator !== 'undefined' && 'getInstalledRelatedApps' in navigator) {
      (navigator as unknown as { getInstalledRelatedApps: () => Promise<unknown[]> })
        .getInstalledRelatedApps()
        .then((apps) => {
          if (apps && apps.length > 0) {
            try {
              localStorage.setItem(PWA_INSTALLED_STORAGE_KEY, 'true');
            } catch {
              // Ignore
            }
            setHasInstalledEventFired(true);
          }
        })
        .catch(() => {});
    }

    const handlePromptUpdate = (prompt: BeforeInstallPromptEvent | null) => {
      setDeferredPrompt(prompt);
      if (!prompt && isStandalone) {
        setHasInstalledEventFired(true);
      }
    };

    _promptListeners.add(handlePromptUpdate);

    const handleAppInstalled = () => {
      setHasInstalledEventFired(true);
      try {
        localStorage.setItem(PWA_INSTALLED_STORAGE_KEY, 'true');
      } catch {
        // Ignore
      }
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      _promptListeners.delete(handlePromptUpdate);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isStandalone]);

  const markAsInstalled = useCallback(() => {
    try {
      localStorage.setItem(PWA_INSTALLED_STORAGE_KEY, 'true');
    } catch {
      // Ignore
    }
    setHasInstalledEventFired(true);
    _globalDeferredPrompt = null;
    setDeferredPrompt(null);
  }, []);

  const promptInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | 'ios' | 'instructions'> => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          markAsInstalled();
          return 'accepted';
        }
        return 'dismissed';
      } catch (err) {
        console.warn('PWA install prompt error:', err);
      }
    }

    if (isIOS) {
      return 'ios';
    }

    return 'instructions';
  }, [deferredPrompt, isIOS, markAsInstalled]);

  const canInstall = !isInstalled && !isStandalone;

  return {
    canInstall,
    isInstalled,
    isStandalone,
    isIOS,
    promptInstall,
    markAsInstalled,
    hasNativePrompt: !!deferredPrompt,
  };
}
