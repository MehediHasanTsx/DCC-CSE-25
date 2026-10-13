'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { SemesterSwitcher } from '@/components/shared/semester-switcher';
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
} from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { useProfile } from '@/lib/hooks/useProfile';
import { CloudSyncStatus } from '@/components/shared/cloud-sync-status';
import { getGravatarUrl } from '@/lib/utils/formatters';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface SidebarProps {
  onNavigate?: () => void;
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

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { isAdmin, user } = useAuth();
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
    : user?.username?.slice(0, 2).toUpperCase() || '??';

  // Determine avatar source: custom upload > Gravatar > default
  const avatarSrc = profile?.profilePicture || avatarUrl || '/default-avatar.jpg';

  return (
    <div className="flex h-full w-full flex-col border-r border-border bg-sidebar overflow-hidden">
      {/* Profile Header */}
      <div className="shrink-0 px-4 py-3.5">
        <Link
          href="/"
          className="flex items-center gap-3 group"
          onClick={onNavigate}
        >
          <Avatar className="h-9 w-9 border border-border ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all">
            <AvatarImage src={avatarSrc} alt={profile?.fullName || 'User'} />
            <AvatarFallback className="text-[11px] font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate leading-tight text-sidebar-foreground">
              {profile?.fullName || user?.username || 'Student'}
            </p>
            <p className="text-[0.65rem] text-muted-foreground leading-tight truncate">
              DCC CSE
            </p>
          </div>
        </Link>
      </div>

      <Separator className="shrink-0" />

      {/* Semester Switcher */}
      <div className="shrink-0 px-3 py-3">
        <SemesterSwitcher />
      </div>

      <Separator className="shrink-0" />

      {/* Scrollable Navigation & Actions */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="flex min-h-full flex-col justify-between p-3">
          <nav>
            {isAdmin && (
              <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 p-1.5">
                <p className="mb-1 px-2 text-[0.65rem] font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
                  <ShieldCheck className="h-3 w-3" />
                  Admin Controls
                </p>
                <Link
                  href="/admin"
                  onClick={onNavigate}
                  className={cn(
                    'flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors',
                    pathname.startsWith('/admin')
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-foreground/80 hover:bg-primary/10 hover:text-foreground'
                  )}
                >
                  <span>Main Data Editor</span>
                  <span className="rounded bg-primary/20 px-1 py-0.5 text-[9px] uppercase tracking-wider text-primary dark:text-primary-foreground">
                    Admin
                  </span>
                </Link>
              </div>
            )}
            {NAV_SECTIONS.map((section) => (
              <div key={section.label} className="mb-4">
                <p className="mb-1 px-3 text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
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
                            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                            isActive
                              ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                              : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                          )}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          {/* Bottom Section: Cloud Sync, Settings, Developer Credit */}
          <div className="pt-2 pb-8 space-y-3">
            <Separator className="my-2" />

            {/* Cloud Sync Status */}
            <div>
              <CloudSyncStatus variant="card" />
            </div>

            {/* Settings */}
            <div>
              <Link
                href="/settings"
                onClick={onNavigate}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                  pathname.startsWith('/settings')
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                    : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <Settings className="h-4 w-4 shrink-0" />
                <span>Settings</span>
              </Link>
            </div>

            {/* Developer Credit */}
            <div className="px-3 pt-1">
              <p className="text-[0.6rem] text-muted-foreground/60 text-center">
                Built by{' '}
                <a
                  href="https://api.whatsapp.com/send/?phone=8801521743944&text&type=phone_number&app_absent=0"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-muted-foreground transition-colors"
                >
                  Mehedi Hasan
                </a>
              </p>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
