'use client';

import { createContext, useContext, useEffect, useState, useRef, useSyncExternalStore } from 'react';
import { useAuth } from './auth-provider';
import { setActiveUser, clearActiveUser, GUEST_USER_ID } from '@/lib/db/user-db';
import { seedDatabase } from '@/lib/db/seed';
import { cloudSyncService } from '@/lib/services/cloud-sync.service';
import { profileService } from '@/lib/services/profile.service';

interface DatabaseContextValue {
  isReady: boolean;
  error: Error | null;
}

const DatabaseContext = createContext<DatabaseContextValue>({
  isReady: false,
  error: null,
});

export function useDatabaseReady() {
  return useContext(DatabaseContext);
}

// React 19 approved way to detect client mount without setState-in-effect
const emptySubscribe = () => () => {};
function useIsMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,   // client
    () => false,   // server
  );
}

/**
 * On login, restore all data from the server if the local database is empty.
 * This handles the "new device" case — downloads everything from cloud.
 */
async function restoreFromCloud(): Promise<void> {
  // Check if local data already exists (profile is a good indicator)
  const hasLocalProfile = await profileService.exists();
  if (hasLocalProfile) return; // Already have data locally

  // Try downloading everything from cloud
  const restored = await cloudSyncService.downloadFromServer();

  if (!restored) {
    // No cloud data either — try fetching just the profile from /api/profile
    // (for users who created their account before cloud sync existed)
    try {
      const res = await fetch('/api/profile', { credentials: 'include' });
      if (!res.ok) return;

      const { profile } = await res.json();
      if (!profile) return; // No server profile — user needs onboarding

      await profileService.create({
        fullName: profile.fullName,
        university: profile.university,
        department: profile.department,
        studentId: profile.studentId,
        rollNumber: profile.rollNumber,
        registrationNumber: profile.registrationNumber,
        batch: profile.batch,
        session: profile.session,
        phoneNumber: profile.phoneNumber,
        email: profile.email || undefined,
        bloodGroup: profile.bloodGroup || undefined,
        emergencyContact: profile.emergencyContact || undefined,
        currentSemester: profile.currentSemester,
      });

      console.log('✅ Profile restored from server (legacy)');
    } catch (err) {
      console.warn('Could not sync profile from server:', err);
    }
  }
}

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading, isGuest } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isMounted = useIsMounted();
  const prevUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isMounted || authLoading) return;

    const activeSessionId = user?.id ?? (isGuest ? GUEST_USER_ID : null);

    if (activeSessionId === prevUserIdRef.current && isReady) return;
    prevUserIdRef.current = activeSessionId;

    let cancelled = false;

    if (!activeSessionId) {
      clearActiveUser();
      cloudSyncService.cancelPendingUpload();
      setTimeout(() => { if (!cancelled) setIsReady(true); }, 0);
      return () => { cancelled = true; };
    }

    setTimeout(() => { if (!cancelled) setIsReady(false); }, 0);

    // Guest Mode Session
    if (activeSessionId === GUEST_USER_ID) {
      setActiveUser(GUEST_USER_ID);
      seedDatabase()
        .then(async () => {
          if (cancelled) return;
          const hasProfile = await profileService.exists();
          if (!hasProfile) {
            await profileService.create({
              fullName: 'Guest Student',
              university: 'Dhaka City College',
              department: 'Computer Science & Engineering',
              studentId: 'CSE-DEMO',
              rollNumber: '0000',
              registrationNumber: '0000000000',
              batch: '25',
              session: '2021-22',
              phoneNumber: '01700000000',
              currentSemester: 5,
            });
          }
          if (!cancelled) {
            setIsReady(true);
            setError(null);
          }
        })
        .catch((err) => {
          console.error('Guest database initialization failed:', err);
          if (!cancelled) {
            setError(err instanceof Error ? err : new Error(String(err)));
          }
        });
      return () => { cancelled = true; };
    }

    // Authenticated User Session
    setActiveUser(activeSessionId);
    seedDatabase()
      .then(async () => {
        if (cancelled) return;
        // After seeding, restore all data from cloud if local is empty
        await restoreFromCloud();
        try {
          await cloudSyncService.smartSync();
        } catch (syncErr) {
          console.warn('Initial cloud sync check:', syncErr);
        }
        if (!cancelled) {
          setIsReady(true);
          setError(null);
        }
      })
      .catch((err) => {
        console.error('Database initialization failed:', err);
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      });

    return () => { cancelled = true; };
  }, [user, authLoading, isGuest, isMounted]); // eslint-disable-line react-hooks/exhaustive-deps

  // During SSR, render children directly to avoid hydration mismatch
  if (!isMounted) {
    return <>{children}</>;
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="mx-4 max-w-md rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <h2 className="mb-2 text-lg font-semibold text-destructive">Database Error</h2>
          <p className="text-sm text-muted-foreground">
            Failed to initialize the local database. Please try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-background relative overflow-hidden">
        {/* Subtle animated background gradient */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
          style={{
            background: 'radial-gradient(ellipse at 30% 20%, hsl(var(--primary)) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, hsl(var(--primary)) 0%, transparent 50%)',
            animation: 'pulse 4s ease-in-out infinite',
          }}
        />
        <div className="flex flex-col items-center gap-6 relative z-10">
          {/* Logo */}
          <div className="relative">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 shadow-lg"
              style={{ animation: 'pulse 2s ease-in-out infinite' }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary"
              >
                <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
                <path d="M22 10v6" />
                <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
              </svg>
            </div>
            {/* Shimmer ring */}
            <div
              className="absolute -inset-1 rounded-2xl border border-primary/10"
              style={{
                animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
                opacity: 0.4,
              }}
            />
          </div>

          {/* Brand */}
          <div className="text-center space-y-1">
            <h2 className="text-lg font-bold tracking-tight text-foreground">DCC CSE</h2>
            <p className="text-xs text-muted-foreground font-medium tracking-wide">Student Dashboard</p>
          </div>

          {/* Animated dots */}
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-primary/60"
                style={{
                  animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite`,
                }}
              />
            ))}
          </div>

          <p className="text-[11px] text-muted-foreground/60">Preparing your workspace…</p>
        </div>

        {/* Inline keyframes */}
        <style>{`
          @keyframes bounce {
            0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
            40% { transform: scale(1.2); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <DatabaseContext value={{ isReady, error }}>
      {children}
    </DatabaseContext>
  );
}
