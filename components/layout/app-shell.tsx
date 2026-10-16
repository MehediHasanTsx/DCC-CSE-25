'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Sidebar } from './sidebar';
import { useCloudSync } from '@/lib/hooks/useCloudSync';
import { useAuth } from '@/components/providers/auth-provider';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import {
  Menu,
  LogIn,
  Sparkles,
  LayoutDashboard,
  Calendar,
  CheckSquare,
  ListChecks,
  MoreHorizontal,
  Sun,
  Moon,
  GraduationCap,
} from 'lucide-react';
import { CloudSyncStatus } from '@/components/shared/cloud-sync-status';
import { AskAdminWidget } from '@/components/shared/ask-admin-widget';

const MOBILE_NAV_ITEMS = [
  { label: 'Home', href: '/', icon: LayoutDashboard },
  { label: 'Routine', href: '/routine', icon: Calendar },
  { label: 'Attendance', href: '/attendance', icon: CheckSquare },
  { label: 'Planner', href: '/planner', icon: ListChecks },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { isGuest, exitGuestMode } = useAuth();

  // Auto-sync all data to cloud whenever IndexedDB changes (disabled automatically for guests)
  useCloudSync();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar (hidden on mobile/tablet) */}
      <aside className="hidden lg:flex lg:w-72 lg:shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile Drawer / Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent showCloseButton={false} side="left" className="w-72 max-w-[85vw] p-0 h-dvh max-h-dvh flex flex-col overflow-hidden">
          <SheetTitle className="sr-only">Navigation menu</SheetTitle>
          <Sidebar onNavigate={() => setMobileOpen(false)} onClose={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Mobile Top Header (Screens < lg only) */}
        <header className="flex h-14 items-center justify-between border-b border-border/70 bg-card/70 backdrop-blur-md px-4 lg:hidden shrink-0 z-30">
          <div className="flex items-center gap-2.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              className="h-9 w-9"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold text-xs">
                <GraduationCap className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold tracking-tight">
                DCC CSE
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isGuest ? (
              <Link href="/login">
                <Button size="sm" variant="default" className="h-8 text-xs px-3 font-semibold gap-1 rounded-xl">
                  <LogIn className="h-3.5 w-3.5" /> Sign In
                </Button>
              </Link>
            ) : (
              <CloudSyncStatus />
            )}
          </div>
        </header>

        {/* Desktop Top-Right Floating Cloud Sync (No full-width bar, no heading, no theme toggle) */}
        {!isGuest && (
          <div className="hidden lg:block fixed top-4 right-6 z-30">
            <CloudSyncStatus />
          </div>
        )}

        {/* Guest Mode Notification Banner */}
        {isGuest && (
          <div className="bg-amber-500/10 border-b border-amber-500/25 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-900 dark:text-amber-200 shrink-0 z-20">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <span className="leading-tight">
                <strong>Guest Mode:</strong> You&apos;re exploring demo data in temporary memory.
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

        {/* Scrollable Page Content (with bottom padding for mobile bar) */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-8">
          {children}
        </main>

        {/* Floating Ask Admin WhatsApp Bot Widget (Bottom-right) */}
        <AskAdminWidget />

        {/* Mobile Bottom Navigation Bar (Screens < lg) */}
        <nav
          aria-label="Mobile navigation"
          className="fixed bottom-0 inset-x-0 h-16 border-t border-border/80 bg-card/95 backdrop-blur-md px-2 flex items-center justify-around lg:hidden z-40 safe-area-bottom shadow-lg"
        >
          {MOBILE_NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-colors',
                  isActive
                    ? 'text-primary font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <div className={cn(
                  'p-1 rounded-full transition-all',
                  isActive && 'bg-primary/10'
                )}>
                  <item.icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
              </Link>
            );
          })}

          {/* More Menu Trigger */}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <div className="p-1 rounded-full">
              <MoreHorizontal className="h-5 w-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">More</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
