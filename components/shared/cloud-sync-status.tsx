'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cloudSyncService, type SyncStatus } from '@/lib/services/cloud-sync.service';
import { Cloud, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export function CloudSyncStatus({
  className = '',
}: {
  variant?: 'compact' | 'card' | 'modern';
  className?: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<SyncStatus>(cloudSyncService.getStatus());
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(cloudSyncService.getLastSyncTime());
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  useEffect(() => {
    const unsubscribe = cloudSyncService.subscribe((newStatus, time) => {
      setStatus(newStatus);
      if (time) setLastSyncTime(time);
    });
    return unsubscribe;
  }, []);

  const isSyncing = status === 'syncing' || isManualSyncing;

  const handleManualSync = async () => {
    if (isSyncing) return;
    try {
      setIsManualSyncing(true);
      const res = await cloudSyncService.smartSync();
      if (res.success) {
        toast.success(res.message || 'All records synced with cloud.');
      } else {
        if (res.message?.includes('Session expired')) {
          toast.error(res.message, {
            duration: 8000,
            action: {
              label: 'Log In',
              onClick: () => { router.push('/login'); },
            },
          });
        } else {
          toast.error(res.message || 'Sync failed. Will retry automatically.');
        }
      }
    } catch {
      toast.error('Sync error. Please check your internet connection.');
    } finally {
      setIsManualSyncing(false);
    }
  };

  const isBrowserOnline = typeof navigator === 'undefined' ? true : navigator.onLine;

  const tooltipText = isSyncing
    ? 'Syncing changes to cloud...'
    : status === 'error'
    ? isBrowserOnline
      ? 'Sync error or session expired. Click to retry sync or re-login.'
      : 'Offline — changes saved locally. Will retry when connected.'
    : lastSyncTime
    ? `All changes saved to cloud · Last synced ${lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · Click to sync now`
    : 'All changes saved to cloud · Click to sync now';

  return (
    <button
      type="button"
      onClick={handleManualSync}
      disabled={isSyncing}
      title={tooltipText}
      aria-label="Cloud sync status"
      className={`group relative inline-flex items-center gap-2 h-8.5 px-2.5 sm:px-3 rounded-xl border border-border/70 bg-card/80 hover:bg-muted/70 hover:border-primary/30 transition-all duration-200 text-xs font-semibold select-none shadow-2xs active:scale-95 cursor-pointer ${
        isSyncing
          ? 'border-sky-500/30 bg-sky-500/5 text-sky-600 dark:text-sky-400'
          : status === 'error'
          ? 'border-rose-500/30 bg-rose-500/5 text-rose-600 dark:text-rose-400'
          : 'text-foreground'
      } ${className}`}
    >
      {/* Icon with glowing status dot */}
      <span className="relative flex items-center justify-center shrink-0">
        {isSyncing ? (
          <RefreshCw className="h-3.5 w-3.5 animate-spin text-sky-500" />
        ) : status === 'error' ? (
          <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
        ) : (
          <Cloud className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
        )}

        {/* Live glowing micro-badge */}
        <span className="absolute -top-1 -right-1 flex h-2 w-2">
          {isSyncing ? (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
          ) : status === 'error' ? (
            <span className="inline-flex rounded-full h-2 w-2 bg-rose-500" />
          ) : (
            <span className="inline-flex rounded-full h-2 w-2 bg-emerald-500 ring-2 ring-card shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isSyncing ? 'bg-sky-500' : status === 'error' ? 'bg-rose-500' : 'bg-emerald-500'
            }`}
          />
        </span>
      </span>

      {/* Modern Label */}
      <span className="text-[11px] sm:text-xs font-medium tracking-tight">
        {isSyncing ? (
          <span className="text-sky-600 dark:text-sky-400 font-semibold">Syncing</span>
        ) : status === 'error' ? (
          <span className="text-rose-600 dark:text-rose-400 font-semibold">
            {isBrowserOnline ? 'Sync Error' : 'Offline'}
          </span>
        ) : (
          <span className="text-muted-foreground group-hover:text-foreground transition-colors">
            Synced
          </span>
        )}
      </span>
    </button>
  );
}
