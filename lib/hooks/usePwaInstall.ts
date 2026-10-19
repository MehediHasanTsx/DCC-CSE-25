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

// Global reference so prompt isn't lost during page route changes
let _globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
const _promptListeners = new Set<(prompt: BeforeInstallPromptEvent | null) => void>();

function notifyPromptListeners() {
  _promptListeners.forEach((listener) => listener(_globalDeferredPrompt));
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    _globalDeferredPrompt = e as BeforeInstallPromptEvent;
    notifyPromptListeners();
  });

  window.addEventListener('appinstalled', () => {
    _globalDeferredPrompt = null;
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
  const [hasInstalledEventFired, setHasInstalledEventFired] = useState<boolean>(false);

  const isIOS = useSyncExternalStore(emptySubscribe, getIsIOS, () => false);
  const isStandalone = useSyncExternalStore(subscribeStandalone, getIsStandalone, () => false);
  const isInstalled = hasInstalledEventFired || isStandalone;

  useEffect(() => {
    const handlePromptUpdate = (prompt: BeforeInstallPromptEvent | null) => {
      setDeferredPrompt(prompt);
      if (!prompt && isStandalone) {
        setHasInstalledEventFired(true);
      }
    };

    _promptListeners.add(handlePromptUpdate);

    const handleAppInstalled = () => {
      setHasInstalledEventFired(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      _promptListeners.delete(handlePromptUpdate);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isStandalone]);

  const promptInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | 'ios' | 'instructions'> => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setHasInstalledEventFired(true);
          _globalDeferredPrompt = null;
          setDeferredPrompt(null);
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
  }, [deferredPrompt, isIOS]);

  const canInstall = !isInstalled && !isStandalone;

  return {
    canInstall,
    isInstalled,
    isStandalone,
    isIOS,
    promptInstall,
    hasNativePrompt: !!deferredPrompt,
  };
}
