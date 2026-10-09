'use client';

import { useState, useEffect } from 'react';
import { cloudSyncService, type SyncStatus } from '@/lib/services/cloud-sync.service';
import { CloudCheck, RefreshCw, AlertCircle, Cloud } from 'lucide-react';

export function CloudSyncStatus({
  variant = 'compact',
  className = '',
}: {
  variant?: 'compact' | 'card';
  className?: string;
}) {
  const [status, setStatus] = useState<SyncStatus>(cloudSyncService.getStatus());
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(cloudSyncService.getLastSyncTime());

  useEffect(() => {
    const unsubscribe = cloudSyncService.subscribe((newStatus, time) => {
      setStatus(newStatus);
      if (time) setLastSyncTime(time);
    });
    return unsubscribe;
  }, []);

  const isSyncing = status === 'syncing';

  // ── Compact: subtle pill in the app header ──
  if (variant === 'compact') {
    return (
      <div
        title={
          isSyncing
            ? 'Saving changes...'
            : status === 'error'
            ? 'Sync paused — will retry automatically'
            : lastSyncTime
            ? `All changes saved · Last synced ${lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : 'All changes saved to cloud'
        }
        className={`inline-flex items-center h-7 px-2.5 rounded-full text-xs font-medium transition-all select-none ${
          isSyncing
            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
            : status === 'error'
            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
            : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25'
        } ${className}`}
      >
        {isSyncing ? (
          <>
            <RefreshCw className="h-3 w-3 mr-1.5 animate-spin" />
            <span>Saving...</span>
          </>
        ) : status === 'error' ? (
          <>
            <AlertCircle className="h-3 w-3 mr-1.5" />
            <span>Offline</span>
          </>
        ) : (
          <>
            <CloudCheck className="h-3 w-3 mr-1.5" />
            <span className="hidden xs:inline">Saved</span>
          </>
        )}
      </div>
    );
  }

  // ── Card: passive status display for sidebar & settings ──
  return (
    <div className={`rounded-xl border border-border/70 p-3 bg-muted/30 ${className}`}>
      <div className="flex items-center gap-2.5">
        {isSyncing ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500 shrink-0">
            <RefreshCw className="h-4 w-4 animate-spin" />
          </div>
        ) : status === 'error' ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/15 text-rose-500 shrink-0">
            <AlertCircle className="h-4 w-4" />
          </div>
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-500 shrink-0">
            <Cloud className="h-4 w-4" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-xs font-semibold leading-tight text-foreground">
            {isSyncing ? 'Saving changes...' : status === 'error' ? 'Sync paused' : 'All changes saved'}
          </p>
          <p className="text-[0.65rem] text-muted-foreground mt-0.5 truncate">
            {isSyncing
              ? 'Syncing to cloud...'
              : status === 'error'
              ? 'Will retry automatically when online'
              : lastSyncTime
              ? `Last synced ${lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · Auto-save on`
              : 'Auto-save enabled · Neon Cloud'}
          </p>
        </div>
      </div>
    </div>
  );
}
