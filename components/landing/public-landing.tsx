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
  ListChecks,
} from 'lucide-react';

export function DccCse25Landing() {
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
              <span className="text-lg font-bold tracking-tight block leading-none">DCC CSE</span>
              <span className="text-[10px] text-muted-foreground font-medium">Dhaka City College</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#routines" className="hover:text-foreground transition-colors">Routines</a>
            <a href="#resources" className="hover:text-foreground transition-colors">Notes & Resources</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-2.5">
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
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary mb-6 animate-fade-in">
            <span className="flex h-1.5 w-1.5 rounded-full bg-primary" />
            Dhaka City College • Department of Computer Science & Engineering
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15] mb-6">
            DCC CSE
            <span className="block text-xl sm:text-3xl lg:text-4xl font-semibold text-muted-foreground mt-2">
              Dhaka City College Science & Engineering Student Portal
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed mb-8">
            The dedicated academic dashboard and routine planner built for all students of
            Dhaka City College Department of Computer Science & Engineering.
            Track daily class schedules, National University CGPA, attendance thresholds,
            exam seat plans, and semester resources with offline-first cloud sync.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 mb-12">
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto gap-2 text-base font-semibold px-7 shadow-md">
                Open Student Dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/register" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-base font-medium px-6">
                Create Free Account
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto pt-4 border-t border-border/40">
            <div className="p-3 rounded-lg bg-muted/40 border border-border/40 text-center">
              <p className="text-sm font-semibold">Offline PWA</p>
              <p className="text-xs text-muted-foreground">Works without internet</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/40 border border-border/40 text-center">
              <p className="text-sm font-semibold">NU CGPA Scale</p>
              <p className="text-xs text-muted-foreground">4.00 Grade calculation</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/40 border border-border/40 text-center">
              <p className="text-sm font-semibold">All Semesters</p>
              <p className="text-xs text-muted-foreground">Class & Lab Routines</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/40 border border-border/40 text-center">
              <p className="text-sm font-semibold">Seat Plan Search</p>
              <p className="text-xs text-muted-foreground">Instant roll lookup</p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Academic Features */}
      <section id="features" className="py-16 md:py-24 border-b border-border/40 bg-muted/20">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
              Comprehensive Academic Management for DCC CSE Students
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
              Everything Dhaka City College Computer Science & Engineering students need to manage coursework, exams, and attendance in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-border/60 hover:border-primary/40 transition-colors shadow-sm">
              <CardHeader className="pb-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
                  <Calendar className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">Class Routine & Routine Planner</CardTitle>
                <CardDescription>
                  Semester class schedules for Section A and Section B, lab group rotations, and personal daily task checklists.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/60 hover:border-primary/40 transition-colors shadow-sm">
              <CardHeader className="pb-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
                  <CheckSquare className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">Attendance Tracker</CardTitle>
                <CardDescription>
                  Real-time percentage calculations configured to National University attendance criteria (75% collegiate, 60% non-collegiate minimums).
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/60 hover:border-primary/40 transition-colors shadow-sm">
              <CardHeader className="pb-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">CGPA & SGPA Calculator</CardTitle>
                <CardDescription>
                  Official National University 4.00 grading scale calculator. Compute credit-weighted semester GPAs, target forecasts, and scholarship rankings.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/60 hover:border-primary/40 transition-colors shadow-sm">
              <CardHeader className="pb-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">Exam Routines & Seat Plans</CardTitle>
                <CardDescription>
                  Midterm and semester final timetables with room allotments. Quick roll search to locate your exam room and bench allocation.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card id="resources" className="border-border/60 hover:border-primary/40 transition-colors shadow-sm">
              <CardHeader className="pb-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
                  <StickyNote className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">DCC CSE Notes & Resources</CardTitle>
                <CardDescription>
                  Lecture notes, subject syllabi, assignments, and study materials curated for Dhaka City College CSE coursework.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/60 hover:border-primary/40 transition-colors shadow-sm">
              <CardHeader className="pb-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
                  <FlaskConical className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">Lab Projects & Fees</CardTitle>
                <CardDescription>
                  Collaborative repository for CSE lab programming assignments, semester fee installment records, and payment tracking.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Routine Showcase & Practical Information */}
      <section id="routines" className="py-16 md:py-20 border-b border-border/40">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider mb-3">
                <ListChecks className="h-4 w-4" /> Academic Routine Planner
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
                Stay Organized for Every Dhaka City College CSE Class
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-6">
                Never miss a lecture or practical session. The DCC CSE routine planner automatically loads your section&apos;s schedule (Sunday through Thursday), lab groups, and teachers, alongside your personalized study habit checklist.
              </p>
              <ul className="space-y-3 text-sm text-muted-foreground mb-8">
                <li className="flex items-start gap-2.5">
                  <div className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">✓</div>
                  <span>Pre-configured class schedules with room numbers & teacher assignments</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">✓</div>
                  <span>Instant roll-based seat plan locator for semester exams</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">✓</div>
                  <span>Cloud synchronization across mobile phone and desktop browsers</span>
                </li>
              </ul>
              <Link href="/login">
                <Button className="gap-2">
                  View Class Routine <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-sm">DCC CSE • Academic Schedule</span>
                </div>
                <Badge variant="secondary" className="text-xs">Sections A & B</Badge>
              </div>
              <div className="space-y-2.5 text-xs text-muted-foreground">
                <div className="p-3 rounded-lg bg-muted/40 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-foreground">Computer Algorithms & Lab</p>
                    <p>CSE-311 • Section A & B</p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">4 Credits</Badge>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-foreground">Microprocessor & Assembly</p>
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

      {/* Technical Highlights & PWA */}
      <section className="py-16 md:py-20 border-b border-border/40 bg-muted/20">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
            Built with Modern Web Technologies
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto mb-12">
            Engineered as a Progressive Web App (PWA) with client-side persistence and secure synchronization.
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
              <h3 className="font-semibold text-base mb-1">Local-First & Cloud Sync</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                IndexedDB ensures all your data is instantly accessible offline. Automatically syncs to cloud storage when online.
              </p>
            </div>
            <div className="p-5 rounded-xl border border-border bg-card">
              <ShieldCheck className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-semibold text-base mb-1">Privacy & Data Control</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your academic data remains private to your account. Export and import complete JSON backups anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions (FAQ) */}
      <section id="faq" className="py-16 md:py-20 border-b border-border/40">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
              Frequently Asked Questions about DCC CSE
            </h2>
            <p className="text-muted-foreground text-sm">
              Answers regarding Dhaka City College Science and Engineering resources and student portal usage.
            </p>
          </div>

          <div className="space-y-4">
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">What is DCC CSE?</CardTitle>
                <CardDescription className="text-sm text-muted-foreground leading-relaxed pt-1">
                  DCC CSE is an academic management web application and utility portal built for students across all batches and semesters of Dhaka City College Department of Computer Science & Engineering. It centralizes class routines, attendance tracking, CGPA calculations, exam seat plans, and study notes.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Who can use this portal?</CardTitle>
                <CardDescription className="text-sm text-muted-foreground leading-relaxed pt-1">
                  The portal is designed for all Dhaka City College Computer Science & Engineering students across any semester (Semester 1 through 8). Any DCC CSE student can create a free account to manage their coursework.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Where can I find DCC CSE notes and student resources?</CardTitle>
                <CardDescription className="text-sm text-muted-foreground leading-relaxed pt-1">
                  After logging in to the portal, the Notes and Lab Projects modules offer organized study materials, course outlines, lecture notes, and lab project guides specifically prepared for Dhaka City College CSE coursework.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">How does the National University CGPA calculator work?</CardTitle>
                <CardDescription className="text-sm text-muted-foreground leading-relaxed pt-1">
                  The calculator uses the official National University Bangladesh 4.00 grading scale. You can enter course credits and earned letter grades to compute exact semester SGPA and cumulative CGPA across all completed semesters.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Who developed DCC CSE?</CardTitle>
                <CardDescription className="text-sm text-muted-foreground leading-relaxed pt-1">
                  DCC CSE was developed by Mehedi Hasan, a student of DCC CSE Batch 25, as an open-source academic companion to help all Dhaka City College CSE students organize their daily academic lives.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action Footer Section */}
      <section className="py-14 md:py-18 bg-primary/5">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
            Ready to Manage Your Academic Journey?
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto mb-8">
            Access your Dhaka City College CSE routine, track attendance, and plan your study schedule today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto px-8">
                Create Account
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto px-8">
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
                <span className="font-bold text-sm tracking-tight">DCC CSE</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Dhaka City College Science & Engineering • Student Academic Portal
              </p>
            </div>

            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link>
              <Link href="/register" className="hover:text-foreground transition-colors">Register</Link>
              <Link href="/disclaimer" className="hover:text-foreground transition-colors">Disclaimer & Terms</Link>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-border/40 text-center text-xs text-muted-foreground/80 space-y-1">
            <p>
              Built with ❤️ by{' '}
              <a
                href="https://api.whatsapp.com/send/?phone=8801521743944"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                Mehedi Hasan
              </a>{' '}
              (Batch 25) for all Dhaka City College CSE students.
            </p>
            <p className="text-[11px] text-muted-foreground/60">
              DCC CSE is an independent open-source student academic resource companion. Not affiliated with Dhaka City College or National University.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
