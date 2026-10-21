'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { useDatabaseReady } from '@/components/providers/database-provider';
import { profileService } from '@/lib/services/profile.service';
import { AppShell } from '@/components/layout/app-shell';
import { RoutineNotifier } from '@/components/shared/routine-notifier';

const emptySubscribe = () => () => {};
function useIsMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/attendance': 'Attendance',
  '/routine': 'Class Routine',
  '/planner': 'Daily Routine',
  '/exams': 'Exam Routine & Seat Plan',
  '/fees': 'Fees & Payments',
  '/gpa': 'CGPA Calculator',
  '/results': 'Results & Scholarship',
  '/subjects': 'Subjects & Syllabus',
  '/assignments': 'Assignments',
  '/notes': 'Notes',
  '/analytics': 'Analytics',
  '/lab-projects': 'Lab Projects',
  '/settings': 'Settings',
  '/admin': 'Admin Controls',
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading: authLoading, isGuest } = useAuth();
  const { isReady: dbReady } = useDatabaseReady();
  const [ready, setReady] = useState(false);
  const isMounted = useIsMounted();

  const isPublicHome = pathname === '/';
  const canAccess = isAuthenticated || isGuest;

  // Update document title for authenticated or guest app routes
  useEffect(() => {
    if (canAccess) {
      const pageTitle = ROUTE_TITLES[pathname] || 'Dashboard';
      document.title = `${pageTitle} | DCC CSE`;
    }
  }, [pathname, canAccess]);

  useEffect(() => {
    if (!isMounted || authLoading) return;

    if (!canAccess) {
      if (!isPublicHome) {
        router.replace('/login');
      }
      return;
    }

    // Guests cannot access admin controls
    if (isGuest && pathname === '/admin') {
      router.replace('/');
      return;
    }

    // Wait for database to be ready before accessing it
    if (!dbReady) return;

    profileService.exists().then((exists) => {
      if (!exists && !isGuest) {
        router.replace('/onboarding');
      } else {
        setReady(true);
      }
    });
  }, [router, authLoading, canAccess, isGuest, isMounted, dbReady, isPublicHome, pathname]);

  // During SSR / hydration or unauthenticated public homepage, render children directly
  if (!isMounted || (isPublicHome && !canAccess)) {
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

  return (
    <AppShell>
      <RoutineNotifier />
      {children}
    </AppShell>
  );
}
