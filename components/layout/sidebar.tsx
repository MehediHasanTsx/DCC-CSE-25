'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { SemesterSwitcher } from '@/components/shared/semester-switcher';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import {
  LayoutDashboard,
  BookOpen,
  CheckSquare,
  BarChart3,
  DollarSign,
  Calendar,
  ClipboardList,
  GraduationCap,
  StickyNote,
  TrendingUp,
  Settings,
  FlaskConical,
  ShieldCheck,
  Award,
  ListChecks,
  Sparkles,
  Sun,
  Moon,
  ChevronRight,
  X,
} from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { useProfile } from '@/lib/hooks/useProfile';
import { getGravatarUrl } from '@/lib/utils/formatters';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface SidebarProps {
  onNavigate?: () => void;
  onClose?: () => void;
}

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Academics',
    items: [
      { label: 'Subjects', href: '/subjects', icon: BookOpen },
      { label: 'Attendance', href: '/attendance', icon: CheckSquare },
      { label: 'GPA / CGPA', href: '/gpa', icon: BarChart3 },
      { label: 'Results & Scholarship', href: '/results', icon: Award },
      { label: 'Routine', href: '/routine', icon: Calendar },
    ],
  },
  {
    label: 'Tracking',
    items: [
      { label: 'Assignments', href: '/assignments', icon: ClipboardList },
      { label: 'Exam Routine', href: '/exams', icon: GraduationCap },
      { label: 'Fees', href: '/fees', icon: DollarSign },
    ],
  },
  {
    label: 'Tools',
    items: [
      { label: 'Routine Planner', href: '/planner', icon: ListChecks },
      { label: 'Notes', href: '/notes', icon: StickyNote },
      { label: 'Analytics', href: '/analytics', icon: TrendingUp },
      { label: 'Lab Projects', href: '/lab-projects', icon: FlaskConical },
    ],
  },
];

export function Sidebar({ onNavigate, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { isAdmin, user, isGuest } = useAuth();
  const { profile } = useProfile();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Generate Gravatar URL from email
  useEffect(() => {
    const email = user?.email || profile?.email;
    if (email) {
      getGravatarUrl(email, 80).then(setAvatarUrl);
    }
  }, [user?.email, profile?.email]);

  const initials = profile?.fullName
    ? profile.fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.username?.slice(0, 2).toUpperCase() || 'MH';

  // Determine avatar source: custom upload > Gravatar > default
  const avatarSrc = profile?.profilePicture || avatarUrl || '/default-avatar.jpg';

  const displayName = profile?.fullName || user?.username || (isGuest ? 'Guest Student' : 'Mehedi Hasan');

  return (
    <div className="flex h-full w-full flex-col border-r border-border bg-sidebar overflow-hidden select-none">
      {/* ── Top Brand Logo Header ── */}
      <div className="shrink-0 px-4 pt-4 pb-3 flex items-center justify-between gap-2.5">
        <Link
          href="/"
          className="flex items-center gap-2.5 min-w-0 flex-1 group cursor-pointer"
          onClick={onNavigate}
          title="Go to Dashboard"
        >
          <div className="flex h-9 w-9 lg:h-10 lg:w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-semibold shadow-xs shrink-0 group-hover:scale-105 transition-transform">
            <GraduationCap className="h-5 w-5 lg:h-5.5 lg:w-5.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm lg:text-base font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors leading-tight">
              DCC CSE
            </p>
            <p className="text-[11px] lg:text-xs text-muted-foreground leading-tight truncate mt-0.5">
              Academic Dashboard
            </p>
          </div>
        </Link>

        {/* Theme Toggle & Mobile Close Buttons (side-by-side, no overlap) */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 lg:h-8.5 lg:w-8.5 rounded-lg shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all cursor-pointer"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Toggle Light / Dark Mode"
            aria-label="Toggle theme"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all cursor-pointer lg:hidden"
              onClick={onClose}
              title="Close Menu"
              aria-label="Close navigation menu"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Semester Switcher Dropdown */}
      <div className="shrink-0 px-3 pb-3">
        <SemesterSwitcher />
      </div>

      <Separator className="shrink-0" />

      {/* ── Scrollable Navigation ── */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-3 space-y-4">
          {/* Admin Controls (if admin) */}
          {isAdmin && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-2">
              <p className="mb-1 px-2 text-[0.68rem] lg:text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" />
                Admin Controls
              </p>
              <Link
                href="/admin"
                onClick={onNavigate}
                className={cn(
                  'flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs lg:text-sm font-semibold transition-colors',
                  pathname.startsWith('/admin')
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-foreground/80 hover:bg-primary/10 hover:text-foreground'
                )}
              >
                <span>Main Data Editor</span>
                <span className="rounded bg-primary/20 px-1 py-0.5 text-[9px] lg:text-[10px] uppercase tracking-wider text-primary dark:text-primary-foreground font-semibold">
                  Admin
                </span>
              </Link>
            </div>
          )}

          {/* Navigation Groups */}
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="space-y-1">
              <p className="px-3 text-[0.68rem] lg:text-xs font-semibold uppercase tracking-wider text-muted-foreground/75">
                {section.label}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive =
                    item.href === '/'
                      ? pathname === '/'
                      : pathname.startsWith(item.href);

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        className={cn(
                          'relative flex items-center gap-3 rounded-xl px-3 py-2 text-xs lg:text-sm font-medium transition-all group',
                          isActive
                            ? 'bg-primary/10 text-primary font-semibold shadow-2xs dark:bg-primary dark:text-white dark:shadow-md dark:shadow-primary/25'
                            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                        )}
                      >
                        <item.icon className={cn(
                          'h-4 w-4 lg:h-4.5 lg:w-4.5 shrink-0 transition-transform group-hover:scale-105',
                          isActive ? 'text-primary dark:text-white' : 'text-muted-foreground'
                        )} />
                        <span className="truncate">{item.label}</span>
                        {isActive && (
                          <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-60 dark:opacity-80" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {/* Guest CTA (inside scroll area if present) */}
          {isGuest && (
            <div className="rounded-xl border border-primary/25 bg-linear-to-b from-primary/10 to-primary/5 p-3 space-y-2 shadow-xs">
              <div className="flex items-center gap-1.5 font-semibold text-xs lg:text-sm text-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Save Academic Records</span>
              </div>
              <p className="text-xs lg:text-sm text-muted-foreground leading-relaxed">
                Log in to keep your attendance, routines, and CGPA synced across all devices.
              </p>
              <div className="flex gap-1.5 pt-0.5">
                <Link href="/login" onClick={onNavigate} className="flex-1">
                  <Button size="sm" variant="default" className="w-full text-xs lg:text-sm h-7 lg:h-8 font-medium">
                    Log In
                  </Button>
                </Link>
                <Link href="/register" onClick={onNavigate} className="flex-1">
                  <Button size="sm" variant="outline" className="w-full text-xs lg:text-sm h-7 lg:h-8 font-medium">
                    Sign Up
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* ── Fixed Bottom Panel: Profile with Settings ── */}
      <div className="shrink-0 border-t border-border bg-sidebar/95 backdrop-blur-xs p-3 space-y-2">
        {/* Profile Card with Settings Link */}
        <div className={cn(
          'flex items-center justify-between gap-2.5 p-2 rounded-xl border transition-all',
          pathname.startsWith('/settings')
            ? 'border-primary/40 bg-primary/5'
            : 'border-border/70 bg-card/60 hover:bg-muted/40 hover:border-border'
        )}>
          <Link
            href="/settings"
            onClick={onNavigate}
            className="flex items-center gap-2.5 min-w-0 flex-1 group cursor-pointer"
            title="View Profile & Settings"
          >
            <Avatar className="h-9 w-9 border border-border/80 ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all shrink-0">
              <AvatarImage src={avatarSrc} alt={displayName} />
              <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-xs lg:text-sm font-semibold truncate leading-tight text-foreground group-hover:text-primary transition-colors">
                {displayName}
              </p>
              <p className="text-[11px] text-muted-foreground leading-tight truncate mt-0.5">
                {isGuest
                  ? 'Guest Student'
                  : profile?.rollNumber
                  ? `Roll: ${profile.rollNumber}`
                  : profile?.studentId
                  ? `Roll: ${profile.studentId}`
                  : 'Student'}
              </p>
            </div>
          </Link>

          <Link
            href="/settings"
            onClick={onNavigate}
            title="Open Settings"
            className={cn(
              'p-2 rounded-lg transition-all shrink-0 cursor-pointer',
              pathname.startsWith('/settings')
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <Settings className={cn(
              'h-4 w-4 lg:h-4.5 lg:w-4.5 transition-transform hover:rotate-45',
              pathname.startsWith('/settings') ? 'text-primary-foreground' : 'text-muted-foreground'
            )} />
          </Link>
        </div>

        {/* Developer Credit & Disclaimer */}
        <div className="px-2 pt-0.5 space-y-0.5">
          <p className="text-[0.68rem] text-muted-foreground/70 text-center">
            Built by{' '}
            <a
              href="https://api.whatsapp.com/send/?phone=8801521743944"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground transition-colors font-medium"
            >
              Mehedi Hasan
            </a>{' '}
            (Batch 25)
          </p>
          <p className="text-[0.62rem] text-muted-foreground/50 text-center">
            Independent Project • <Link href="/disclaimer" onClick={onNavigate} className="hover:underline">Disclaimer</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
