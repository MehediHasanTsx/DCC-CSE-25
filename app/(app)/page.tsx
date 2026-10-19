'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useProfile } from '@/lib/hooks/useProfile';
import { useAttendance } from '@/lib/hooks/useAttendance';
import { useSubjects } from '@/lib/hooks/useSubjects';
import { gpaService, type CgpaResult } from '@/lib/services/gpa.service';
import { assignmentService } from '@/lib/services/assignment.service';
import { examRoutineService } from '@/lib/services/exam-routine.service';
import { mainDataService } from '@/lib/services/main-data.service';
import { feeService, type FeeSummary } from '@/lib/services/fee.service';
import { routineService } from '@/lib/services/routine.service';
import { personalRoutineService, getCategoryMeta } from '@/lib/services/personal-routine.service';
import { formatCurrency, formatDate, formatTime, getCurrentDay, getLocalDateString } from '@/lib/utils/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CountUp } from '@/components/ui/count-up';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CheckSquare,
  BarChart3,
  BookOpen,
  DollarSign,
  ClipboardList,
  GraduationCap,
  TrendingUp,
  ArrowRight,
  AlertCircle,
  Check,
  X,
  CheckCircle2,
  ListChecks,
  Clock,
  Circle,
  Plus,
  Calendar,
  Sparkles,
  ChevronRight,
  Target,
  CalendarOff,
} from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { DccCse25Landing } from '@/components/landing/public-landing';
import { toast } from 'sonner';
import type { Assignment, ExamRoutineItem, RoutineSlot, Subject, DayOfWeek, AttendanceStatus, RoutineActivity } from '@/types/database';

export default function DashboardPage() {
  const { isAuthenticated, isGuest, isLoading } = useAuth();

  // For unauthenticated visitors and crawlers (including SSR), render the SEO-rich public landing page
  if (!isAuthenticated && !isGuest && !isLoading) {
    return <DccCse25Landing />;
  }

  if (!isAuthenticated && !isGuest) {
    return <DccCse25Landing />;
  }

  return <StudentDashboardContent />;
}

function StudentDashboardContent() {
  const { profile } = useProfile();
  const { user, isGuest } = useAuth();
  const semesterId = profile ? `semester-${profile.currentSemester}` : 'semester-1';
  const { overallStats, targetInfo, records, markAttendance, bulkMark } = useAttendance(semesterId);
  const { subjects } = useSubjects(semesterId);

  const [cgpa, setCgpa] = useState<CgpaResult | null>(null);
  const [semesterGpa, setSemesterGpa] = useState<number>(0);
  const [upcomingAssignments, setUpcomingAssignments] = useState<Assignment[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<ExamRoutineItem[]>([]);
  const [todayClasses, setTodayClasses] = useState<(RoutineSlot & { subject?: Subject })[]>([]);
  const [todayChecklist, setTodayChecklist] = useState<{
    activities: (RoutineActivity & { routineName: string; completed: boolean; completedAt?: Date; checklistId?: string })[];
    stats: { total: number; completed: number; remaining: number; percentage: number };
  }>({ activities: [], stats: { total: 0, completed: 0, remaining: 0, percentage: 0 } });
  const [togglingActivityId, setTogglingActivityId] = useState<string | null>(null);
  const [feeSummary, setFeeSummary] = useState<FeeSummary | null>(null);
  const [quickAttendanceOpen, setQuickAttendanceOpen] = useState(false);
  const [markingSubjectId, setMarkingSubjectId] = useState<string | null>(null);
  const [todayClassFilter, setTodayClassFilter] = useState<string>('all');

  // Derive unique group values from today's classes for filter pills
  const todayGroupOptions = useMemo(() => {
    const groups = new Set<string>();
    todayClasses.forEach((slot) => {
      groups.add(slot.group || 'All');
    });
    return Array.from(groups).sort();
  }, [todayClasses]);

  // Filtered today classes based on selected group filter
  const filteredTodayClasses = useMemo(() => {
    if (todayClassFilter === 'all') return todayClasses;
    return todayClasses.filter((slot) => {
      const slotGroup = slot.group || 'All';
      if (todayClassFilter === 'All') return slotGroup === 'All';
      // Show both the selected group AND theory classes (group 'All')
      return slotGroup === todayClassFilter || slotGroup === 'All';
    });
  }, [todayClasses, todayClassFilter]);

  useEffect(() => {
    if (!semesterId) return;

    const loadDashboardData = async () => {
      try {
        // Sync published assignments and official exam routines from cloud
        try {
          await Promise.allSettled([
            mainDataService.syncAssignmentsWithMain(semesterId),
            mainDataService.syncExamRoutinesWithMain(semesterId),
          ]);
        } catch {
          // Continue with local data if offline or cloud unavailable
        }

        const todayStr = getLocalDateString();

        const [cgpaResult, assignments, allExamRoutines, fees, payments, routine, checklist] = await Promise.all([
          gpaService.calculateCgpa(),
          assignmentService.getUpcoming(semesterId),
          examRoutineService.getExamRoutines(semesterId),
          feeService.getBySemester(semesterId),
          feeService.getPaymentsBySemester(semesterId),
          routineService.getBySemester(semesterId),
          personalRoutineService.getChecklistForDate(todayStr),
        ]);

        setCgpa(cgpaResult);

        const semGpa = cgpaResult.semesterGpas.find((s) => s.semesterId === semesterId);
        setSemesterGpa(semGpa?.gpa || 0);

        setUpcomingAssignments(assignments.slice(0, 3));

        // Auto-derive upcoming exams from exam routine data
        const upcomingFromRoutine = allExamRoutines
          .filter((r) => r.date >= todayStr)
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(0, 3);
        setUpcomingExams(upcomingFromRoutine);

        setFeeSummary(feeService.calculateSummary(fees, payments));
        setTodayChecklist(checklist);

        // Today's classes
        const today = getCurrentDay() as DayOfWeek;
        const todayRoutine = routine
          .filter((r) => r.dayOfWeek === today)
          .sort((a, b) => a.startTime.localeCompare(b.startTime));

        setTodayClasses(todayRoutine.map((r) => ({
          ...r,
          subject: subjects.find((s) => s.id === r.subjectId),
        })));
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      }
    };

    loadDashboardData();
  }, [semesterId, subjects]);

  const handleToggleChecklist = async (activityId: string, routineId: string) => {
    try {
      setTogglingActivityId(activityId);
      const todayStr = getLocalDateString();
      await personalRoutineService.toggleActivity(todayStr, activityId, routineId);
      const updated = await personalRoutineService.getChecklistForDate(todayStr);
      setTodayChecklist(updated);
    } catch {
      toast.error('Failed to update activity.');
    } finally {
      setTogglingActivityId(null);
    }
  };

  const studentName = profile?.fullName || user?.username || (isGuest ? 'Guest Student' : 'Student');
  const currentSemester = profile?.currentSemester || 1;
  const department = profile?.department || 'Dhaka City College · CSE';
  const greeting = getGreeting(studentName);
  const sessionLabel = profile?.session
    ? profile.session.toLowerCase().includes('session')
      ? profile.session
      : `Academic Session ${profile.session}`
    : 'Academic Session 2022–2023';

  const todayFormattedDate = formatDate(getLocalDateString(), {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* ── Welcome Hero Banner ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1 animate-slide-fade-down">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] lg:text-xs font-semibold bg-primary/10 text-primary mb-1.5">
            <Sparkles className="h-3 w-3" />
            <span>{sessionLabel} · Semester {currentSemester}</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-[1.75rem] font-semibold tracking-tight text-foreground">
            {greeting} <span className="inline-block animate-pulse">👋</span>
          </h1>
          <p className="text-xs sm:text-sm lg:text-base text-muted-foreground mt-1 flex items-center gap-2">
            <span>{department}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground/70" />
              {todayFormattedDate}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setQuickAttendanceOpen(true)}
            className="h-9 lg:h-10 px-3.5 lg:px-4 text-xs lg:text-sm font-semibold rounded-xl bg-primary text-primary-foreground shadow-xs hover:opacity-95 gap-1.5 cursor-pointer"
          >
            <CheckSquare className="h-4 w-4" />
            Quick Attendance
          </Button>
          <Link href="/planner">
            <Button
              variant="outline"
              size="sm"
              className="h-9 lg:h-10 px-3 lg:px-4 text-xs lg:text-sm font-medium rounded-xl border-border hover:bg-muted/50 gap-1.5 cursor-pointer"
            >
              <ListChecks className="h-4 w-4 text-muted-foreground" />
              Daily Routine
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Top 4 Signature Pastel Stat Cards ── */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4 items-stretch">
        <HeroStatCard
          className="stagger-1"
          variant="purple"
          title="Attendance Rate"
          value={`${overallStats.percentage}%`}
          subtitle={`${overallStats.attended} of ${overallStats.totalConducted} classes`}
          icon={CheckSquare}
          href="/attendance"
          actionText="View attendance"
        />
        <HeroStatCard
          className="stagger-2"
          variant="orange"
          title="Target Shortfall"
          value={
            targetInfo.isAboveTarget || targetInfo.classesNeededToReachTarget === 0
              ? '0'
              : `${targetInfo.classesNeededToReachTarget}`
          }
          subtitle={
            targetInfo.isAboveTarget
              ? 'Safe above 75%'
              : targetInfo.classesCanMiss > 0
              ? `Can miss ${targetInfo.classesCanMiss} class`
              : `${targetInfo.classesNeededToReachTarget} needed for 75%`
          }
          icon={Target}
          href="/attendance"
          actionText="Target details"
        />
        <HeroStatCard
          className="stagger-3"
          variant="green"
          title="Semester GPA"
          value={semesterGpa > 0 ? semesterGpa.toFixed(2) : '3.75'}
          subtitle={`Semester ${currentSemester} performance`}
          icon={TrendingUp}
          href="/gpa"
          actionText="Calculate GPA"
        />
        <HeroStatCard
          className="stagger-4"
          variant="blue"
          title="Cumulative CGPA"
          value={cgpa && cgpa.cgpa > 0 ? cgpa.cgpa.toFixed(2) : '3.80'}
          subtitle={`${cgpa?.totalCredits || 64} total credits`}
          icon={GraduationCap}
          href="/gpa"
          actionText="Transcript view"
        />
      </div>

      {/* Attendance Target Alert */}
      {!targetInfo.isAboveTarget && overallStats.totalConducted > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5 rounded-xl shadow-xs">
          <CardContent className="flex items-center gap-3 py-3">
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
              {targetInfo.message}
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── Today's Agenda: Schedule & Routine Checklist ── */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Today's Classes Card */}
        <Card className="rounded-xl border-border/80 shadow-xs overflow-hidden flex flex-col animate-slide-fade-up stagger-3">
          <CardHeader className="pb-3 border-b border-border/40">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <CardTitle className="text-base sm:text-lg lg:text-xl font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 lg:h-5 lg:w-5 text-primary" />
                  Today&apos;s Schedule
                </CardTitle>
                <p className="text-xs lg:text-sm text-muted-foreground mt-0.5">
                  {filteredTodayClasses.length} classes scheduled for today
                </p>
              </div>

              <div className="flex items-center gap-2">
                {filteredTodayClasses.some(
                  (slot) =>
                    !records.some(
                      (r) =>
                        r.subjectId === slot.subjectId &&
                        r.date === getLocalDateString()
                    )
                ) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs lg:text-sm h-7 sm:h-8 lg:h-9 gap-1.5 rounded-lg border-emerald-500/40 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-medium cursor-pointer"
                    onClick={async () => {
                      const todayIso = getLocalDateString();
                      const unmarked = filteredTodayClasses
                        .filter(
                          (slot) =>
                            !records.some(
                              (r) => r.subjectId === slot.subjectId && r.date === todayIso
                            )
                        )
                        .map((slot) => ({ subjectId: slot.subjectId, status: 'present' as AttendanceStatus }));

                      if (unmarked.length > 0) {
                        try {
                          await bulkMark(todayIso, unmarked);
                          toast.success(`Marked all ${unmarked.length} classes as Present!`);
                        } catch {
                          toast.error('Failed to mark all classes.');
                        }
                      }
                    }}
                  >
                    <Check className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                    Mark All Present
                  </Button>
                )}
                <Link href="/routine">
                  <Button variant="ghost" size="sm" className="h-7 sm:h-8 lg:h-9 text-xs lg:text-sm rounded-lg font-medium cursor-pointer">
                    Class Routine <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Section / Group Filter Pills */}
            {todayGroupOptions.length > 1 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-2">
                <button
                  type="button"
                  onClick={() => setTodayClassFilter('all')}
                  className={`px-3 py-1 lg:px-3.5 lg:py-1.5 rounded-full text-xs lg:text-sm font-medium transition-all cursor-pointer ${
                    todayClassFilter === 'all'
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  All ({todayClasses.length})
                </button>
                {todayGroupOptions.map((g) => {
                  const count = todayClasses.filter((s) => (s.group || 'All') === g).length;
                  const isTheory = g === 'All';
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setTodayClassFilter(g)}
                      className={`px-3 py-1 lg:px-3.5 lg:py-1.5 rounded-full text-xs lg:text-sm font-medium transition-all cursor-pointer ${
                        todayClassFilter === g
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      {isTheory ? 'Theory' : `Group ${g}`} ({count})
                    </button>
                  );
                })}
              </div>
            )}
          </CardHeader>

          <CardContent className="pt-4 flex-1">
            {filteredTodayClasses.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <Clock className="h-8 w-8 lg:h-10 lg:w-10 text-muted-foreground/40 mx-auto" />
                <p className="text-sm lg:text-base font-medium text-muted-foreground">
                  {todayClasses.length === 0 ? 'No classes scheduled for today.' : 'No classes match this filter.'}
                </p>
                <p className="text-xs lg:text-sm text-muted-foreground">
                  Enjoy your day off or review your study plan!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTodayClasses.map((slot) => {
                  const todayIso = getLocalDateString();
                  const att = records.find(
                    (r) => r.subjectId === slot.subjectId && r.date === todayIso
                  );
                  const isMarking = markingSubjectId === slot.subjectId;

                  const handleMark = async (status: AttendanceStatus) => {
                    try {
                      setMarkingSubjectId(slot.subjectId);
                      await markAttendance(slot.subjectId, todayIso, status);
                      const statusLabel =
                        status === 'present'
                          ? 'Present'
                          : status === 'late'
                          ? 'Late'
                          : status === 'absent'
                          ? 'Absent'
                          : 'No Class';
                      toast.success(
                        `${slot.subject?.name || 'Class'} marked as ${statusLabel}`
                      );
                    } catch {
                      toast.error('Failed to mark attendance.');
                    } finally {
                      setMarkingSubjectId(null);
                    }
                  };

                  return (
                    <div
                      key={slot.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 rounded-xl border border-border/70 p-3.5 lg:p-4 transition-all duration-150 hover:bg-muted/20 hover:border-primary/30"
                    >
                      <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                        {/* Time badge */}
                        <div className="flex flex-col items-center justify-center text-xs lg:text-sm font-medium bg-muted/60 dark:bg-muted/30 px-2.5 py-1.5 lg:px-3 lg:py-2 rounded-lg min-w-19 lg:min-w-22 shrink-0">
                          <span className="font-bold text-foreground">{formatTime(slot.startTime)}</span>
                          <span className="text-[10px] lg:text-xs text-muted-foreground">{formatTime(slot.endTime)}</span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm sm:text-base font-bold text-foreground leading-snug wrap-break-word">
                            {slot.subject?.name || 'Unknown Subject'}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap mt-1">
                            {slot.subject?.code && (
                              <span className="font-mono text-[11px] font-semibold text-primary/90">
                                {slot.subject.code}
                              </span>
                            )}
                            {slot.group && slot.group !== 'All' && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4.5 font-semibold">
                                Group {slot.group}
                              </Badge>
                            )}
                            {slot.room && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-muted/50 text-[11px]">
                                Room {slot.room}
                              </span>
                            )}
                            {slot.teacher && (
                              <span className="text-[11px] text-muted-foreground">· {slot.teacher}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Fast 1-Click Attendance Buttons (2x2 Grid) */}
                      <div className="grid grid-cols-2 gap-1.5 shrink-0 self-stretch sm:self-center w-full sm:w-auto">
                        <Button
                          size="sm"
                          variant={att?.status === 'present' ? 'default' : 'outline'}
                          disabled={isMarking}
                          className={`h-7.5 sm:h-8 px-2.5 text-xs font-semibold gap-1.5 rounded-lg cursor-pointer transition-all ${
                            att?.status === 'present'
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs border-transparent'
                              : 'border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10'
                          }`}
                          onClick={() => handleMark('present')}
                          title="Mark Present"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Present</span>
                        </Button>

                        <Button
                          size="sm"
                          variant={att?.status === 'late' ? 'default' : 'outline'}
                          disabled={isMarking}
                          className={`h-7.5 sm:h-8 px-2.5 text-xs font-semibold gap-1.5 rounded-lg cursor-pointer transition-all ${
                            att?.status === 'late'
                              ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs border-transparent'
                              : 'border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10'
                          }`}
                          onClick={() => handleMark('late')}
                          title="Mark Late"
                        >
                          <Clock className="h-3.5 w-3.5" />
                          <span>Late</span>
                        </Button>

                        <Button
                          size="sm"
                          variant={att?.status === 'absent' ? 'default' : 'outline'}
                          disabled={isMarking}
                          className={`h-7.5 sm:h-8 px-2.5 text-xs font-semibold gap-1.5 rounded-lg cursor-pointer transition-all ${
                            att?.status === 'absent'
                              ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs border-transparent'
                              : 'border-rose-500/40 text-rose-700 dark:text-rose-400 hover:bg-rose-500/10'
                          }`}
                          onClick={() => handleMark('absent')}
                          title="Mark Absent"
                        >
                          <X className="h-3.5 w-3.5" />
                          <span>Absent</span>
                        </Button>

                        <Button
                          size="sm"
                          variant={att?.status === 'noClass' ? 'default' : 'outline'}
                          disabled={isMarking}
                          className={`h-7.5 sm:h-8 px-2.5 text-xs font-semibold gap-1.5 rounded-lg cursor-pointer transition-all ${
                            att?.status === 'noClass'
                              ? 'bg-slate-600 hover:bg-slate-700 dark:bg-slate-700 text-white shadow-xs border-transparent'
                              : 'border-slate-400/40 text-slate-700 dark:text-slate-300 hover:bg-slate-500/10'
                          }`}
                          onClick={() => handleMark('noClass')}
                          title="Mark No Class"
                        >
                          <CalendarOff className="h-3.5 w-3.5" />
                          <span>No Class</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Checklist Card */}
        <TodayChecklistCard
          className="animate-slide-fade-up stagger-4"
          checklist={todayChecklist}
          onToggle={handleToggleChecklist}
          togglingId={togglingActivityId}
        />
      </div>

      {/* ── Quick Navigation Shortcuts ── */}
      <Card className="rounded-xl border-border/80 shadow-xs animate-slide-fade-up stagger-5">
        <CardHeader className="py-2.5 lg:py-3 px-4 border-b border-border/40">
          <CardTitle className="text-xs lg:text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-primary" />
            Quick Navigation
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            <QuickAction
              onClick={() => setQuickAttendanceOpen(true)}
              icon={CheckSquare}
              label="Attendance"
              iconColor="text-emerald-500"
            />
            <QuickAction href="/planner" icon={ListChecks} label="Daily Routine" />
            <QuickAction href="/subjects" icon={BookOpen} label="Subjects" />
            <QuickAction href="/assignments" icon={ClipboardList} label="Assignments" />
            <QuickAction href="/exams" icon={GraduationCap} label="Exams" />
            <QuickAction href="/fees" icon={DollarSign} label="Fees" />
            <QuickAction href="/results" icon={BarChart3} label="Results" />
          </div>
        </CardContent>
      </Card>

      {/* ── Academic Tracking & Deadlines (Balanced 3-column row) ── */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {/* Card 1: Upcoming Exams */}
        <ExamCountdownCard exams={upcomingExams} className="animate-slide-fade-up stagger-6" />

        {/* Card 2: Upcoming Assignments */}
        <Card className="rounded-xl border-border/80 shadow-xs flex flex-col animate-slide-fade-up stagger-7">
          <CardHeader className="pb-3 border-b border-border/40">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base sm:text-lg lg:text-xl font-semibold flex items-center gap-2">
                <ClipboardList className="h-4 w-4 lg:h-5 lg:w-5 text-primary" />
                Assignments
              </CardTitle>
              <Link href="/assignments">
                <Button variant="ghost" size="sm" className="h-7 lg:h-8 text-xs lg:text-sm font-medium cursor-pointer">
                  View All <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-3 flex-1">
            {upcomingAssignments.length === 0 ? (
              <div className="py-8 text-center space-y-1">
                <p className="text-sm lg:text-base text-muted-foreground">
                  No upcoming assignments.
                </p>
                <p className="text-xs lg:text-sm text-muted-foreground">
                  All assignments completed or none published yet.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {upcomingAssignments.map((a) => {
                  const subject = subjects.find((s) => s.id === a.subjectId);
                  return (
                    <div
                      key={a.id}
                      className="flex items-center justify-between rounded-xl border border-border/70 p-3 lg:p-3.5 hover:bg-muted/20 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm sm:text-base font-semibold truncate">{a.title}</p>
                        <p className="text-xs lg:text-sm text-muted-foreground">{subject?.name}</p>
                      </div>
                      <Badge
                        variant={a.priority === 'high' ? 'destructive' : 'secondary'}
                        className="ml-2 text-[11px] lg:text-xs shrink-0 font-medium"
                      >
                        {formatDate(a.deadline, { month: 'short', day: 'numeric' })}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 3: Tuition & Fees Summary */}
        <Card className="rounded-xl border-border/80 shadow-xs flex flex-col animate-slide-fade-up stagger-8">
          <CardHeader className="pb-3 border-b border-border/40">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base sm:text-lg lg:text-xl font-semibold flex items-center gap-2">
                <DollarSign className="h-4 w-4 lg:h-5 lg:w-5 text-primary" />
                Tuition & Fees
              </CardTitle>
              <Link href="/fees">
                <Button variant="ghost" size="sm" className="h-7 lg:h-8 text-xs lg:text-sm font-medium cursor-pointer">
                  Fee Records <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-4 flex-1 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm text-muted-foreground font-medium">Remaining Due</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-semibold text-foreground tracking-tight">
                    <CountUp value={feeSummary ? formatCurrency(feeSummary.remaining) : '৳0'} />
                  </p>
                </div>
                <Badge
                  variant={feeSummary && feeSummary.remaining > 0 ? 'destructive' : 'default'}
                  className={cn(
                    'text-xs lg:text-sm font-semibold px-2.5 py-1 rounded-lg',
                    feeSummary && feeSummary.remaining === 0 ? 'bg-emerald-600 text-white' : ''
                  )}
                >
                  {feeSummary && feeSummary.remaining > 0 ? 'Payment Due' : 'All Cleared'}
                </Badge>
              </div>

              {feeSummary && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs lg:text-sm text-muted-foreground">
                    <span>Paid: {formatCurrency(feeSummary.totalPaid)}</span>
                    <span>Total: {formatCurrency(feeSummary.totalFees)}</span>
                  </div>
                  <Progress
                    value={feeSummary.totalFees > 0 ? (feeSummary.totalPaid / feeSummary.totalFees) * 100 : 100}
                    className="h-2 lg:h-2.5 rounded-full"
                  />
                </div>
              )}
            </div>

            <div className="pt-2">
              <Link href="/fees" className="w-full block">
                <Button
                  variant={feeSummary && feeSummary.remaining > 0 ? 'default' : 'outline'}
                  size="sm"
                  className="w-full h-8 lg:h-9 text-xs lg:text-sm font-semibold rounded-xl cursor-pointer"
                >
                  {feeSummary && feeSummary.remaining > 0 ? 'Pay Online / View Details' : 'View Fee History'}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Attendance Dialog */}
      <Dialog open={quickAttendanceOpen} onOpenChange={setQuickAttendanceOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-emerald-500" />
              Quick Attendance
            </DialogTitle>
            <DialogDescription>
              Mark attendance for today&apos;s classes (
              {formatDate(getLocalDateString(), {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
              ).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {todayClasses.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                No classes scheduled for today on your routine.
              </p>
            ) : (
              <>
                <div className="flex items-center justify-end gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-8 gap-1.5 border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 cursor-pointer"
                    onClick={async () => {
                      const todayIso = getLocalDateString();
                      const recordsToMark = todayClasses.map((s) => ({
                        subjectId: s.subjectId,
                        status: 'noClass' as AttendanceStatus,
                      }));
                      try {
                        await bulkMark(todayIso, recordsToMark);
                        toast.success('Marked all classes as No Class!');
                      } catch {
                        toast.error('Failed to mark attendance.');
                      }
                    }}
                  >
                    <CalendarOff className="h-3.5 w-3.5" />
                    All No Class
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-8 gap-1.5 border-emerald-500/40 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 cursor-pointer"
                    onClick={async () => {
                      const todayIso = getLocalDateString();
                      const recordsToMark = todayClasses.map((s) => ({
                        subjectId: s.subjectId,
                        status: 'present' as AttendanceStatus,
                      }));
                      try {
                        await bulkMark(todayIso, recordsToMark);
                        toast.success('Marked all classes as Present!');
                      } catch {
                        toast.error('Failed to mark attendance.');
                      }
                    }}
                  >
                    <Check className="h-3.5 w-3.5" />
                    Mark All as Present
                  </Button>
                </div>

                <div className="space-y-2 max-h-75 overflow-y-auto pr-1">
                  {todayClasses.map((slot) => {
                    const todayIso = getLocalDateString();
                    const att = records.find(
                      (r) => r.subjectId === slot.subjectId && r.date === todayIso
                    );

                    return (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/20"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold truncate">
                            {slot.subject?.name || 'Class'}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                            {slot.room ? ` · Room ${slot.room}` : ''}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            size="sm"
                            variant={att?.status === 'present' ? 'default' : 'outline'}
                            className={`h-7 px-2 text-xs gap-1 cursor-pointer ${
                              att?.status === 'present'
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                            }`}
                            onClick={async () => {
                              try {
                                await markAttendance(slot.subjectId, todayIso, 'present');
                                toast.success(`${slot.subject?.name} marked Present.`);
                              } catch {
                                toast.error('Failed to mark.');
                              }
                            }}
                          >
                            <Check className="h-3 w-3" />
                            Present
                          </Button>

                          <Button
                            size="sm"
                            variant={att?.status === 'late' ? 'default' : 'outline'}
                            className={`h-7 px-2 text-xs gap-1 cursor-pointer ${
                              att?.status === 'late'
                                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                : 'border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                            }`}
                            onClick={async () => {
                              try {
                                await markAttendance(slot.subjectId, todayIso, 'late');
                                toast.success(`${slot.subject?.name} marked Late.`);
                              } catch {
                                toast.error('Failed to mark.');
                              }
                            }}
                          >
                            <Clock className="h-3 w-3" />
                            Late
                          </Button>

                          <Button
                            size="sm"
                            variant={att?.status === 'absent' ? 'default' : 'outline'}
                            className={`h-7 px-2 text-xs gap-1 cursor-pointer ${
                              att?.status === 'absent'
                                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                : 'border-rose-500/30 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                            }`}
                            onClick={async () => {
                              try {
                                await markAttendance(slot.subjectId, todayIso, 'absent');
                                toast.success(`${slot.subject?.name} marked Absent.`);
                              } catch {
                                toast.error('Failed to mark.');
                              }
                            }}
                          >
                            <X className="h-3 w-3" />
                            Absent
                          </Button>

                          <Button
                            size="sm"
                            variant={att?.status === 'noClass' ? 'default' : 'outline'}
                            className={`h-7 px-2 text-xs gap-1 cursor-pointer ${
                              att?.status === 'noClass'
                                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                : 'border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                            }`}
                            onClick={async () => {
                              try {
                                await markAttendance(slot.subjectId, todayIso, 'noClass');
                                toast.success(`${slot.subject?.name} marked No Class.`);
                              } catch {
                                toast.error('Failed to mark.');
                              }
                            }}
                          >
                            <CalendarOff className="h-3 w-3" />
                            No Class
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-border">
            <Link href="/attendance" className="w-full sm:w-auto">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => setQuickAttendanceOpen(false)}
              >
                Go to Full Attendance Page →
              </Button>
            </Link>
            <Button
              size="sm"
              className="w-full sm:w-auto text-xs"
              onClick={() => setQuickAttendanceOpen(false)}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Helper Components ─────────────────────────────────

function HeroStatCard({
  variant,
  title,
  value,
  subtitle,
  icon: Icon,
  href,
  actionText,
  className = '',
}: {
  variant: 'purple' | 'orange' | 'green' | 'blue';
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  actionText?: string;
  className?: string;
}) {
  const styles = {
    purple: {
      cardClass: 'card-pastel-purple text-purple-950 dark:text-purple-100',
      iconBg: 'bg-purple-500/15 text-purple-700 dark:bg-purple-400/20 dark:text-purple-300',
    },
    orange: {
      cardClass: 'card-pastel-orange text-amber-950 dark:text-amber-100',
      iconBg: 'bg-amber-500/15 text-amber-700 dark:bg-amber-400/20 dark:text-amber-300',
    },
    green: {
      cardClass: 'card-pastel-green text-emerald-950 dark:text-emerald-100',
      iconBg: 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-300',
    },
    blue: {
      cardClass: 'card-pastel-blue text-blue-950 dark:text-blue-100',
      iconBg: 'bg-blue-500/15 text-blue-700 dark:bg-blue-400/20 dark:text-blue-300',
    },
  }[variant];

  return (
    <Link href={href} className={cn("group flex flex-col h-full animate-slide-fade-up", className)}>
      <div
        className={cn(
          "relative overflow-hidden rounded-xl p-3.5 sm:p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border flex flex-col justify-between flex-1 h-full",
          styles.cardClass
        )}
      >
        <div className="flex items-start justify-between gap-2 flex-1">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] sm:text-xs lg:text-sm font-semibold uppercase tracking-wider text-muted-foreground/85 min-h-8 sm:min-h-0 flex items-center leading-tight">
              {title}
            </p>
            <p className="mt-1 sm:mt-1.5 text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-foreground truncate">
              <CountUp value={value} />
            </p>
          </div>
          <div
            className={cn(
              "w-9 h-9 sm:w-11 sm:h-11 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs",
              styles.iconBg
            )}
          >
            <Icon className="h-4.5 w-4.5 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
          </div>
        </div>

        <div className="mt-3 sm:mt-4 pt-2 sm:pt-2.5 border-t border-black/5 dark:border-white/10 flex items-center justify-between gap-1 text-xs lg:text-sm shrink-0">
          <span className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground truncate min-w-0 flex-1">
            {subtitle}
          </span>
          <span className="inline-flex items-center gap-0.5 text-[10px] sm:text-xs lg:text-sm font-semibold text-primary group-hover:underline shrink-0">
            {actionText || 'View'}
            <ChevronRight className="h-3 w-3 lg:h-3.5 lg:w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function QuickAction({
  href,
  onClick,
  icon: Icon,
  label,
  iconColor,
}: {
  href?: string;
  onClick?: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  iconColor?: string;
}) {
  const content = (
    <Button
      variant="outline"
      type="button"
      onClick={onClick}
      className="h-auto w-full flex-col gap-1.5 py-2.5 lg:py-3 px-2 lg:px-2.5 text-xs lg:text-sm rounded-xl border-border/70 hover:bg-muted/40 hover:border-primary/40 transition-all active:scale-95 shadow-2xs cursor-pointer"
    >
      <Icon className={`h-4 w-4 lg:h-5 lg:w-5 ${iconColor || 'text-primary'}`} />
      <span className="truncate max-w-full font-medium">{label}</span>
    </Button>
  );

  if (href) {
    return (
      <Link href={href} className="w-full">
        {content}
      </Link>
    );
  }

  return <div className="w-full">{content}</div>;
}

function getGreeting(name: string): string {
  const hour = new Date().getHours();
  const firstName = name.split(' ')[0];
  if (hour < 12) return `Good morning, ${firstName}`;
  if (hour < 17) return `Good afternoon, ${firstName}`;
  return `Good evening, ${firstName}`;
}

/**
 * Parse an exam time string like "12:30 pm – 2:30 pm" and return the end time as a Date on the exam date.
 * Returns null if the time string can't be parsed.
 */
function parseExamEndTime(dateStr: string, timeStr?: string): Date | null {
  if (!timeStr) return null;
  try {
    // Try to extract the end time portion (after – or -)
    const parts = timeStr.split(/[–\-]/);
    const endPart = (parts.length > 1 ? parts[1] : parts[0]).trim();
    // Parse "2:30 pm" or "14:30" formats
    const match = endPart.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
    if (!match) return null;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = match[3]?.toLowerCase();
    if (period === 'pm' && hours !== 12) hours += 12;
    if (period === 'am' && hours === 12) hours = 0;
    const d = new Date(dateStr + 'T00:00:00');
    d.setHours(hours, minutes, 0, 0);
    return d;
  } catch {
    return null;
  }
}

function ExamCountdownCard({ exams, className = '' }: { exams: ExamRoutineItem[]; className?: string }) {
  const [now, setNow] = useState(() => new Date());

  // Auto-update every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  // Filter out exams whose time has already passed
  const activeExams = exams.filter((e) => {
    const endTime = parseExamEndTime(e.date, e.time);
    if (endTime) return endTime.getTime() > now.getTime();
    // If no time info, keep if date is today or future
    return new Date(e.date + 'T23:59:59').getTime() > now.getTime();
  });

  return (
    <Card className={cn("rounded-xl border-border/80 shadow-xs overflow-hidden flex flex-col", className)}>
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg lg:text-xl font-semibold flex items-center gap-2">
            <GraduationCap className="h-4 w-4 lg:h-5 lg:w-5 text-primary" />
            Upcoming Exams
          </CardTitle>
          <Link href="/exams">
            <Button variant="ghost" size="sm" className="h-7 lg:h-8 text-xs lg:text-sm font-medium cursor-pointer">
              View All <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-3 flex-1">
        {activeExams.length === 0 ? (
          <div className="py-8 text-center space-y-1">
            <p className="text-sm lg:text-base text-muted-foreground">
              No upcoming exams.
            </p>
            <p className="text-xs lg:text-sm text-muted-foreground">
              No exam routine published yet.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {activeExams.map((e) => {
              // Calculate time remaining
              const examDate = new Date(e.date + 'T00:00:00');
              const examStart = e.time
                ? (() => {
                    const match = e.time.trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)?/i);
                    if (match) {
                      let h = parseInt(match[1], 10);
                      const m = parseInt(match[2], 10);
                      const p = match[3]?.toLowerCase();
                      if (p === 'pm' && h !== 12) h += 12;
                      if (p === 'am' && h === 12) h = 0;
                      const d = new Date(examDate);
                      d.setHours(h, m, 0, 0);
                      return d;
                    }
                    return examDate;
                  })()
                : examDate;

              const diffMs = examStart.getTime() - now.getTime();
              const diffHours = diffMs / (1000 * 60 * 60);
              const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

              let countdownLabel: string;
              let isUrgent = false;
              if (diffMs <= 0) {
                countdownLabel = 'Now';
                isUrgent = true;
              } else if (diffHours < 24) {
                const h = Math.floor(diffHours);
                const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                countdownLabel = h > 0 ? `${h}h ${m}m` : `${m}m`;
                isUrgent = true;
              } else {
                countdownLabel = `${diffDays}d left`;
                isUrgent = diffDays <= 3;
              }

              const examTypeLabel = e.examType === 'in_course' ? 'In-Course' : e.examType === 'semester_final' ? 'Semester Final' : 'NU Final';

              return (
                <div
                  key={e.id}
                  className="flex items-center justify-between rounded-xl border border-border/70 p-3 lg:p-3.5 hover:bg-muted/20 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm sm:text-base font-semibold truncate">{e.courseName}</p>
                    <p className="text-xs lg:text-sm text-muted-foreground mt-0.5">
                      {examTypeLabel} · {e.courseCode} · {formatDate(e.date)}{e.time ? ` (${e.time})` : ''}
                    </p>
                  </div>
                  <Badge variant={isUrgent ? 'destructive' : 'secondary'} className="ml-2 text-xs lg:text-sm font-semibold shrink-0">
                    {countdownLabel}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TodayChecklistCard({
  checklist,
  onToggle,
  togglingId,
  className = '',
}: {
  checklist: {
    activities: (RoutineActivity & { routineName: string; completed: boolean; completedAt?: Date; checklistId?: string })[];
    stats: { total: number; completed: number; remaining: number; percentage: number };
  };
  onToggle: (activityId: string, routineId: string) => void;
  togglingId: string | null;
  className?: string;
}) {
  const todayStr = getLocalDateString();
  const now = new Date();

  return (
    <Card className={cn("rounded-xl border-border/80 shadow-xs flex flex-col overflow-hidden", className)}>
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base sm:text-lg lg:text-xl font-semibold flex items-center gap-2">
              <ListChecks className="h-4 w-4 lg:h-5 lg:w-5 text-primary" />
              Today&apos;s Checklist
            </CardTitle>
            {checklist.stats.total > 0 && (
              <Badge variant="secondary" className="text-xs lg:text-sm px-2 py-0.5 font-semibold">
                {checklist.stats.completed}/{checklist.stats.total}
              </Badge>
            )}
          </div>
          <Link href="/planner">
            <Button variant="ghost" size="sm" className="h-7 lg:h-8 text-xs lg:text-sm font-medium cursor-pointer">
              Daily Routine <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {checklist.stats.total > 0 && (
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs lg:text-sm text-muted-foreground font-medium">
              <span>{checklist.stats.percentage}% completed</span>
              <span>{checklist.stats.remaining} remaining</span>
            </div>
            <Progress value={checklist.stats.percentage} className="h-2 lg:h-2.5 rounded-full" />
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 pt-3">
        {checklist.activities.length === 0 ? (
          <div className="py-6 text-center space-y-2">
            <p className="text-sm lg:text-base font-medium text-muted-foreground">No routine activities scheduled for today.</p>
            <p className="text-xs lg:text-sm text-muted-foreground">
              Create a routine in the planner to schedule your daily habits and tasks.
            </p>
            <div className="pt-2">
              <Link href="/planner">
                <Button variant="outline" size="sm" className="h-8 lg:h-9 text-xs lg:text-sm gap-1.5 rounded-xl cursor-pointer">
                  <Plus className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                  Set Up Routine
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {checklist.activities.slice(0, 6).map((activity) => {
              const cat = getCategoryMeta(activity.category);
              const actEndParts = activity.endTime.split(':');
              const actEnd = new Date(todayStr + 'T00:00:00');
              actEnd.setHours(parseInt(actEndParts[0], 10), parseInt(actEndParts[1], 10));
              const isPast = !activity.completed && actEnd < now;
              const isToggling = togglingId === activity.id;

              return (
                <div
                  key={activity.id}
                  onClick={() => !isToggling && onToggle(activity.id, activity.routineId)}
                  className={`flex items-start gap-3 p-2.5 lg:p-3 rounded-xl border transition-all duration-150 cursor-pointer ${
                    activity.completed
                      ? 'bg-muted/30 border-muted/50 opacity-80'
                      : isPast
                      ? 'border-rose-500/30 bg-rose-500/5 hover:border-rose-500/50'
                      : 'border-border/70 hover:border-primary/40 hover:bg-muted/20'
                  }`}
                >
                  <button
                    type="button"
                    disabled={isToggling}
                    className="mt-0.5 shrink-0 transition-transform active:scale-90"
                    aria-label={`Toggle ${activity.title}`}
                  >
                    {activity.completed ? (
                      <CheckCircle2 className="h-4.5 w-4.5 lg:h-5 lg:w-5 text-emerald-500" />
                    ) : isPast ? (
                      <AlertCircle className="h-4.5 w-4.5 lg:h-5 lg:w-5 text-rose-400" />
                    ) : (
                      <Circle className="h-4.5 w-4.5 lg:h-5 lg:w-5 text-muted-foreground/40 hover:text-primary transition-colors" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p
                        className={`text-sm sm:text-base font-semibold leading-snug truncate ${
                          activity.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                        }`}
                      >
                        {activity.title}
                      </p>
                      <Badge
                        variant="outline"
                        className="text-[10px] lg:text-xs px-1.5 py-0 h-4 lg:h-5 font-normal"
                        style={{ borderColor: cat.color + '40', color: cat.color }}
                      >
                        {cat.icon} {cat.label}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] lg:text-xs text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 lg:h-3.5 lg:w-3.5" />
                        {formatTime(activity.startTime)} – {formatTime(activity.endTime)}
                      </span>
                      <span>·</span>
                      <span className="truncate">{activity.routineName}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {checklist.activities.length > 6 && (
              <div className="pt-1 text-center">
                <Link href="/planner">
                  <Button variant="ghost" size="sm" className="h-7 lg:h-8 text-xs lg:text-sm text-muted-foreground cursor-pointer">
                    +{checklist.activities.length - 6} more in Planner →
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

