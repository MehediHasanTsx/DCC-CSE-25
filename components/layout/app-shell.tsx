'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sidebar } from './sidebar';
import { useCloudSync } from '@/lib/hooks/useCloudSync';
import { useAuth } from '@/components/providers/auth-provider';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, LogIn, Sparkles } from 'lucide-react';
import { CloudSyncStatus } from '@/components/shared/cloud-sync-status';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isGuest, exitGuestMode } = useAuth();

  // Auto-sync all data to cloud whenever IndexedDB changes (disabled automatically for guests)
  useCloudSync();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-72 lg:shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 max-w-[85vw] p-0 h-dvh max-h-dvh flex flex-col overflow-hidden">
          <SheetTitle className="sr-only">Navigation menu</SheetTitle>
          <Sidebar onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header with Sync Status or Guest Indicator */}
        <header className="flex h-14 items-center justify-between border-b border-border px-4 lg:hidden">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <span className="text-sm font-semibold">
              DCC CSE
            </span>
          </div>
          {isGuest ? (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button size="sm" variant="default" className="h-8 text-xs gap-1.5 font-medium">
                  <LogIn className="h-3.5 w-3.5" /> Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <CloudSyncStatus variant="compact" />
          )}
        </header>

        {/* Guest Mode Notification Banner */}
        {isGuest && (
          <div className="bg-amber-500/10 border-b border-amber-500/25 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span>
                <strong>Guest Mode:</strong> You&apos;re exploring temporary demo data. Your changes won&apos;t be saved permanently.
              </span>
            </div>
            <div className="flex items-center gap-3 font-medium">
              <Link href="/login" className="text-primary hover:underline font-semibold flex items-center gap-1">
                <LogIn className="h-3 w-3" /> Sign In
              </Link>
              <span>•</span>
              <Link href="/register" className="text-primary hover:underline font-semibold flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Create Account
              </Link>
              <span>•</span>
              <button
                type="button"
                onClick={exitGuestMode}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Exit Demo
              </button>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
