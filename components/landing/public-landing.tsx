'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  GraduationCap,
  Calendar,
  CheckSquare,
  BarChart3,
  StickyNote,
  FlaskConical,
  Cloud,
  Smartphone,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  ListChecks,
} from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';

export function DccCse25Landing() {
  const { enterGuestMode } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight block leading-none">DCC CSE 25</span>
              <span className="text-[10px] text-muted-foreground font-medium">Dhaka City College</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#routines" className="hover:text-foreground transition-colors">Routine Planner</a>
            <a href="#technology" className="hover:text-foreground transition-colors">Technology</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={enterGuestMode}
              className="hidden sm:inline-flex text-xs font-semibold gap-1.5 border-primary/30 text-primary hover:bg-primary/10 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" /> Continue as Guest
            </Button>
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-sm font-medium">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="text-sm font-medium gap-1.5 shadow-sm">
                Get Started <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28 border-b border-border/40">
        <div className="absolute inset-0 bg-linear-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center relative">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary mb-6 animate-fade-in">
            <span className="flex h-1.5 w-1.5 rounded-full bg-primary" />
            Dhaka City College · Computer Science &amp; Engineering (Batch 25)
          </div>

          {/* Main H1 */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15] mb-4">
            DCC CSE 25
            <span className="block text-xl sm:text-3xl lg:text-4xl font-semibold text-muted-foreground mt-2">
              Student Academic Dashboard | Dhaka City College
            </span>
          </h1>

          {/* Hero Description */}
          <p className="mx-auto max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed mb-8">
            Manage your DCC CSE academic life in one place. Track attendance, calculate GPA and CGPA, view exam routines and results, manage fees, and organize your study plans.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 mb-12">
            <Button
              size="lg"
              onClick={enterGuestMode}
              className="w-full sm:w-auto gap-2 text-base font-semibold px-7 shadow-md cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Sparkles className="h-4 w-4" /> Continue as Guest (Instant Demo)
            </Button>
            <Link href="/login" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-base font-medium px-6 gap-2">
                Open Student Dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/register" className="w-full sm:w-auto">
              <Button variant="ghost" size="lg" className="w-full sm:w-auto text-base font-medium px-6">
                Create Free Account
              </Button>
            </Link>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto pt-4 border-t border-border/40">
            <div className="p-3 rounded-lg bg-muted/40 border border-border/40 text-center">
              <p className="text-sm font-semibold">Offline PWA</p>
              <p className="text-xs text-muted-foreground">Saved data works offline</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/40 border border-border/40 text-center">
              <p className="text-sm font-semibold">NU CGPA Scale</p>
              <p className="text-xs text-muted-foreground">4.00 Grade calculation</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/40 border border-border/40 text-center">
              <p className="text-sm font-semibold">All 8 Semesters</p>
              <p className="text-xs text-muted-foreground">Class &amp; lab routines</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/40 border border-border/40 text-center">
              <p className="text-sm font-semibold">Seat Plan Search</p>
              <p className="text-xs text-muted-foreground">Instant roll lookup</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section id="features" className="py-16 md:py-24 border-b border-border/40 bg-muted/20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
              Everything DCC CSE Students Need to Stay Organized
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Keep your academic information, schedules, and study resources organized in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <Card className="border-border/60 hover:border-primary/40 transition-colors shadow-sm">
              <CardHeader className="pb-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
                  <Calendar className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">Class Routine &amp; Daily Planner</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  View class schedules, plan weekly activities, and manage daily study checklists.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 2 */}
            <Card className="border-border/60 hover:border-primary/40 transition-colors shadow-sm">
              <CardHeader className="pb-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
                  <CheckSquare className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">Attendance Tracker</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  Record attended classes, monitor attendance percentages, and track remaining classes.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 3 */}
            <Card className="border-border/60 hover:border-primary/40 transition-colors shadow-sm">
              <CardHeader className="pb-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">NU GPA &amp; CGPA Calculator</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  Calculate semester GPA and cumulative CGPA using the applicable National University grading scale.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 4 */}
            <Card className="border-border/60 hover:border-primary/40 transition-colors shadow-sm">
              <CardHeader className="pb-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">Exam Routine &amp; Seat Plans</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  Organize exam dates, check schedules, and find available exam seat plan information.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 5 */}
            <Card id="resources" className="border-border/60 hover:border-primary/40 transition-colors shadow-sm">
              <CardHeader className="pb-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
                  <StickyNote className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">CSE Notes &amp; Study Resources</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  Keep lecture notes, assignments, and subject-wise learning materials accessible.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 6 */}
            <Card className="border-border/60 hover:border-primary/40 transition-colors shadow-sm">
              <CardHeader className="pb-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
                  <FlaskConical className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">Lab Projects &amp; Academic Records</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  Organize programming lab projects, academic records, and semester fee information.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Routine Planner Section */}
      <section id="routines" className="py-16 md:py-20 border-b border-border/40">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider mb-3">
                <ListChecks className="h-4 w-4" /> Routine Planner
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
                Plan Your Classes, Study Time, and Daily Routine
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-6">
                Stay on top of your CSE classes and personal goals with an academic routine planner. Review class schedules, create daily plans, build weekly activity routines, and check off completed tasks to develop consistent study habits.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button onClick={enterGuestMode} className="gap-2 cursor-pointer">
                  <Sparkles className="h-4 w-4" /> Try Routine Planner as Guest
                </Button>
                <Link href="/login">
                  <Button variant="outline" className="gap-2">
                    View Class Routine <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-sm">DCC CSE • Class Schedule</span>
                </div>
                <Badge variant="secondary" className="text-xs">Sections A &amp; B</Badge>
              </div>
              <div className="space-y-2.5 text-xs text-muted-foreground">
                <div className="p-3 rounded-lg bg-muted/40 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-foreground">Computer Algorithms &amp; Lab</p>
                    <p>CSE-311 • Section A &amp; B</p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">4 Credits</Badge>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-foreground">Microprocessor &amp; Assembly</p>
                    <p>CSE-312 • Hardware Lab</p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">4 Credits</Badge>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-foreground">Database Management Systems</p>
                    <p>CSE-313 • Software Lab</p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">4 Credits</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section id="technology" className="py-16 md:py-20 border-b border-border/40 bg-muted/20">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
            Access Your Academic Dashboard Across Your Devices
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto mb-12">
            Use a Progressive Web App experience designed to keep your academic information accessible. With supported offline features and local data storage, you can manage eligible records even when your internet connection is unavailable. Supported synchronization helps keep your data consistent across devices.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="p-5 rounded-xl border border-border bg-card">
              <Smartphone className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-semibold text-base mb-1">Installable Mobile PWA</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Add to your phone&apos;s home screen for quick launch without app store downloads. Responsive across all screen sizes.
              </p>
            </div>
            <div className="p-5 rounded-xl border border-border bg-card">
              <Cloud className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-semibold text-base mb-1">Local-First Storage</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Browser IndexedDB keeps your saved routines, marks, and notes accessible offline. Data syncs when an internet connection is available.
              </p>
            </div>
            <div className="p-5 rounded-xl border border-border bg-card">
              <ShieldCheck className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-semibold text-base mb-1">Privacy &amp; Data Control</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your academic data remains private to your account. No institutional records are scraped, and data is never sold.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 md:py-20 border-b border-border/40">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground text-sm">
              Answers regarding Dhaka City College CSE resources and dashboard usage.
            </p>
          </div>

          <div className="space-y-4">
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">What is the DCC CSE Student Dashboard?</CardTitle>
                <CardDescription className="text-sm text-muted-foreground leading-relaxed pt-1">
                  The DCC CSE Student Dashboard is an academic management platform designed for Computer Science and Engineering students at Dhaka City College. It brings together class routines, attendance tracking, GPA and CGPA calculations, exam information, study resources, and academic planning tools.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Who can use the DCC CSE dashboard?</CardTitle>
                <CardDescription className="text-sm text-muted-foreground leading-relaxed pt-1">
                  The platform is designed primarily for Dhaka City College CSE students. Students can create an account to access the academic tools and features available to them.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Can I calculate my National University GPA and CGPA?</CardTitle>
                <CardDescription className="text-sm text-muted-foreground leading-relaxed pt-1">
                  The dashboard includes GPA and CGPA calculation tools based on the applicable National University grading scale. Enter your relevant academic results to calculate your semester GPA and cumulative CGPA.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Can I track attendance and class routines?</CardTitle>
                <CardDescription className="text-sm text-muted-foreground leading-relaxed pt-1">
                  Yes. The attendance tracker helps you record classes and monitor attendance, while the class routine section helps you review your schedule and organize your academic activities.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Does the dashboard support offline use?</CardTitle>
                <CardDescription className="text-sm text-muted-foreground leading-relaxed pt-1">
                  Yes. Once you have logged in on your device (or when using Guest Mode), your academic records—such as class routines, attendance, exam schedules, CGPA data, and personal notes—are saved locally in browser IndexedDB. You can open and use your saved dashboard even without an active internet connection. Any changes you make will automatically synchronize with cloud storage when you are back online.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Can I access or log in while offline?</CardTitle>
                <CardDescription className="text-sm text-muted-foreground leading-relaxed pt-1">
                  If you have previously signed in on that device, your session and saved data remain available offline, and you can log straight into your saved offline profile. For initial account creation or the very first sign-in on a new device, an internet connection is needed to download your data, or you can explore offline immediately using Guest Mode.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Where can I find DCC CSE notes, assignments, and lab resources?</CardTitle>
                <CardDescription className="text-sm text-muted-foreground leading-relaxed pt-1">
                  Sign in to access the notes and resources available through the dashboard, including relevant study materials, assignments, and lab project resources.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="py-16 md:py-20 bg-primary/5">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
            Make Your CSE Student Life More Organized
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto mb-8">
            Spend less time managing scattered academic information and more time focusing on your studies. Create your account to organize your class routine, attendance, results, and study plans with DCC CSE.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              onClick={enterGuestMode}
              className="w-full sm:w-auto px-8 gap-2 cursor-pointer font-semibold"
            >
              <Sparkles className="h-4 w-4" /> Continue as Guest
            </Button>
            <Link href="/register" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto px-8">
                Get Started →
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button variant="ghost" size="lg" className="w-full sm:w-auto px-8">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border/60 bg-card py-10">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                <GraduationCap className="h-4 w-4 text-primary" />
                <span className="font-bold text-sm tracking-tight">DCC CSE Student Dashboard</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Dhaka City College Science &amp; Engineering • Student Academic Portal
              </p>
            </div>

            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <button onClick={enterGuestMode} className="hover:text-foreground transition-colors cursor-pointer">
                Guest Mode
              </button>
              <Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link>
              <Link href="/register" className="hover:text-foreground transition-colors">Register</Link>
              <Link href="/disclaimer" className="hover:text-foreground transition-colors">Disclaimer &amp; Terms</Link>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-border/40 text-center text-xs text-muted-foreground/60 space-y-1">
            <p className="text-[11px]">
              DCC CSE 25 is an independent open-source student academic resource companion. Not affiliated with Dhaka City College or National University.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
