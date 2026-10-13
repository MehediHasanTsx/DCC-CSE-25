'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { useDatabaseReady } from '@/components/providers/database-provider';
import { profileService } from '@/lib/services/profile.service';
import { AppShell } from '@/components/layout/app-shell';

const emptySubscribe = () => () => {};
function useIsMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isReady: dbReady } = useDatabaseReady();
  const [ready, setReady] = useState(false);
  const isMounted = useIsMounted();

  useEffect(() => {
    if (!isMounted || authLoading) return;

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    // Wait for database to be ready before accessing it
    if (!dbReady) return;

    profileService.exists().then((exists) => {
      if (!exists) {
        router.replace('/onboarding');
      } else {
        setReady(true);
      }
    });
  }, [router, authLoading, isAuthenticated, isMounted, dbReady]);

  // During SSR / hydration, render children to avoid mismatch
  if (!isMounted) {
    return <>{children}</>;
  }

  if (authLoading || !dbReady || !ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-2 w-2 rounded-full bg-primary/60"
                style={{
                  animation: `appBounce 1.4s ease-in-out ${i * 0.16}s infinite`,
                }}
              />
            ))}
          </div>
          <style>{`
            @keyframes appBounce {
              0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
              40% { transform: scale(1.2); opacity: 1; }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
