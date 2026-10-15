'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
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

import { Separator } from '@/components/ui/separator';
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
  XCircle,
  ListChecks,
  Clock,
  Circle,
  Plus,
} from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { DccCse25Landing } from '@/components/landing/public-landing';
import { toast } from 'sonner';
import type { Assignment, ExamRoutineItem, RoutineSlot, Subject, DayOfWeek, AttendanceStatus, RoutineActivity } from '@/types/database';

export default function DashboardPage() {
  const { isAuthenticated, isLoading } = useAuth();

  // For unauthenticated visitors and crawlers (including SSR), render the SEO-rich public landing page
  if (!isAuthenticated && !isLoading) {
    return <DccCse25Landing />;
  }

  if (!isAuthenticated) {
    return <DccCse25Landing />;
  }

  return <StudentDashboardContent />;
}

function StudentDashboardContent() {
  const { profile } = useProfile();
  const semesterId = profile ? `semester-${profile.currentSemester}` : undefined;
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
        // Only show exams whose date is today or in the future, sorted by date
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

  if (!profile) return null;

  const greeting = getGreeting(profile.fullName);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{greeting}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Semester {profile.currentSemester} · {profile.department}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Attendance"
          value={`${overallStats.percentage}%`}
          subtitle={`${overallStats.attended}/${overallStats.totalConducted} classes`}
          icon={CheckSquare}
          href="/attendance"
          color={overallStats.percentage >= 75 ? 'text-green-500' : 'text-red-500'}
        />
        <StatsCard
          title="Semester GPA"
          value={semesterGpa.toFixed(2)}
          subtitle={`Semester ${profile.currentSemester}`}
          icon={BarChart3}
          href="/gpa"
        />
        <StatsCard
          title="CGPA"
          value={cgpa ? cgpa.cgpa.toFixed(2) : '0.00'}
          subtitle={`${cgpa?.totalCredits || 0} credits`}
          icon={TrendingUp}
          href="/gpa"
        />
        <StatsCard
          title="Pending Fees"
          value={feeSummary ? formatCurrency(feeSummary.remaining) : '৳0'}
          subtitle={feeSummary?.remaining === 0 ? 'All clear!' : 'Balance due'}
          icon={DollarSign}
          href="/fees"
          color={feeSummary && feeSummary.remaining > 0 ? 'text-amber-500' : undefined}
        />
      </div>

      {/* Attendance Target Alert */}
      {!targetInfo.isAboveTarget && overallStats.totalConducted > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex items-center gap-3 py-3">
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-400">
              {targetInfo.message}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Classes */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="text-base">Today&apos;s Classes</CardTitle>
              <div className="flex items-center gap-1.5">
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
                    className="text-xs h-7 gap-1 border-emerald-500/40 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
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
                    <Check className="h-3 w-3" />
                    Mark All Present
                  </Button>
                )}
                <Link href="/routine">
                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                    View All <ArrowRight className="ml-1 h-3 w-3" />
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
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${
                    todayClassFilter === 'all'
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-muted/50 text-muted-foreground border-border/60 hover:bg-muted hover:text-foreground'
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
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${
                        todayClassFilter === g
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'bg-muted/50 text-muted-foreground border-border/60 hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      {isTheory ? 'Theory' : `Group ${g}`} ({count})
                    </button>
                  );
                })}
              </div>
            )}
          </CardHeader>
          <CardContent>
            {filteredTodayClasses.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                {todayClasses.length === 0 ? 'No classes scheduled for today.' : 'No classes match this filter.'}
              </p>
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
                      toast.success(
                        `${slot.subject?.name || 'Class'} marked as ${status === 'present' ? 'Present' : 'Absent'}`
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
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/20"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex flex-col items-center text-xs text-muted-foreground min-w-15">
                          <span className="font-semibold text-foreground">{formatTime(slot.startTime)}</span>
                          <span>–</span>
                          <span>{formatTime(slot.endTime)}</span>
                        </div>
                        <Separator orientation="vertical" className="h-10 hidden sm:block" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">
                            {slot.subject?.name || 'Unknown Subject'}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                            {slot.group && slot.group !== 'All' && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4.5 font-semibold">
                                Group {slot.group}
                              </Badge>
                            )}
                            {slot.room && <span>Room: {slot.room}</span>}
                            {slot.teacher && <span>· {slot.teacher}</span>}
                            {slot.section && <span>· Sec {slot.section}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Fast 1-Click Attendance Buttons */}
                      <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                        {att ? (
                          <div className="flex items-center gap-1.5">
                            <Badge
                              variant={att.status === 'present' ? 'default' : 'destructive'}
                              className={`text-xs gap-1 py-1 px-2.5 font-medium ${
                                att.status === 'present'
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  : 'bg-rose-600 hover:bg-rose-700 text-white'
                              }`}
                            >
                              {att.status === 'present' ? (
                                <CheckCircle2 className="h-3 w-3" />
                              ) : (
                                <XCircle className="h-3 w-3" />
                              )}
                              {att.status === 'present' ? 'Present' : 'Absent'}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isMarking}
                              className="h-7 text-[11px] px-1.5 text-muted-foreground hover:text-foreground"
                              onClick={() =>
                                handleMark(att.status === 'present' ? 'absent' : 'present')
                              }
                              title="Toggle between Present and Absent"
                            >
                              Change
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isMarking}
                              className="h-8 px-2.5 text-xs gap-1 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
                              onClick={() => handleMark('present')}
                            >
                              <Check className="h-3.5 w-3.5" />
                              Present
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isMarking}
                              className="h-8 px-2.5 text-xs gap-1 border-rose-500/40 text-rose-700 dark:text-rose-400 hover:bg-rose-500/10"
                              onClick={() => handleMark('absent')}
                            >
                              <X className="h-3.5 w-3.5" />
                              Absent
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Checklist */}
        <TodayChecklistCard
          checklist={todayChecklist}
          onToggle={handleToggleChecklist}
          togglingId={togglingActivityId}
        />

        {/* Upcoming Assignments */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Upcoming Assignments</CardTitle>
              <Link href="/assignments">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingAssignments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No upcoming assignments.
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingAssignments.map((a) => {
                  const subject = subjects.find((s) => s.id === a.subjectId);
                  return (
                    <div key={a.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{a.title}</p>
                        <p className="text-xs text-muted-foreground">{subject?.name}</p>
                      </div>
                      <Badge variant={a.priority === 'high' ? 'destructive' : 'secondary'} className="ml-2 text-xs">
                        {formatDate(a.deadline, { month: 'short', day: 'numeric' })}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Exams */}
        <ExamCountdownCard exams={upcomingExams} />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => setQuickAttendanceOpen(true)}
              className="h-auto w-full flex-col gap-1.5 py-3 text-xs"
            >
              <CheckSquare className="h-4 w-4 text-emerald-500" />
              Mark Attendance
            </Button>
            <QuickAction href="/planner" icon={ListChecks} label="Routine Planner" />
            <QuickAction href="/subjects" icon={BookOpen} label="Add Subject" />
            <QuickAction href="/assignments" icon={ClipboardList} label="Add Assignment" />
            <QuickAction href="/exams" icon={GraduationCap} label="Exam Routine" />
            <QuickAction href="/fees" icon={DollarSign} label="Add Payment" />
            <QuickAction href="/results" icon={BarChart3} label="Results & Scholarship" />
          </div>
        </CardContent>
      </Card>

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
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-8 gap-1.5 border-emerald-500/40 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
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
                            className={`h-7 px-2 text-xs gap-1 ${
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
                            variant={att?.status === 'absent' ? 'default' : 'outline'}
                            className={`h-7 px-2 text-xs gap-1 ${
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

function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  href,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color?: string;
}) {
  return (
    <Link href={href}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className={`text-2xl font-bold ${color || ''}`}>{value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link href={href} className="w-full">
      <Button variant="outline" className="h-auto w-full flex-col gap-1.5 py-3 text-xs">
        <Icon className="h-4 w-4" />
        {label}
      </Button>
    </Link>
  );
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

function ExamCountdownCard({ exams }: { exams: ExamRoutineItem[] }) {
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
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Upcoming Exams</CardTitle>
          <Link href="/exams">
            <Button variant="ghost" size="sm">
              View All <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {activeExams.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No upcoming exams.
          </p>
        ) : (
          <div className="space-y-3">
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
                <div key={e.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{e.courseName}</p>
                    <p className="text-xs text-muted-foreground">
                      {examTypeLabel} · {e.courseCode} · {formatDate(e.date)}{e.time ? ` (${e.time})` : ''}
                    </p>
                  </div>
                  <Badge variant={isUrgent ? 'destructive' : 'secondary'} className="ml-2 text-xs shrink-0">
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
}: {
  checklist: {
    activities: (RoutineActivity & { routineName: string; completed: boolean; completedAt?: Date; checklistId?: string })[];
    stats: { total: number; completed: number; remaining: number; percentage: number };
  };
  onToggle: (activityId: string, routineId: string) => void;
  togglingId: string | null;
}) {
  const todayStr = getLocalDateString();
  const now = new Date();

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-primary" />
              Today&apos;s Checklist
            </CardTitle>
            {checklist.stats.total > 0 && (
              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                {checklist.stats.completed}/{checklist.stats.total}
              </Badge>
            )}
          </div>
          <Link href="/planner">
            <Button variant="ghost" size="sm" className="h-7 text-xs">
              Planner <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </div>

        {checklist.stats.total > 0 && (
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{checklist.stats.percentage}% completed</span>
              <span>{checklist.stats.remaining} remaining</span>
            </div>
            <Progress value={checklist.stats.percentage} className="h-2" />
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1">
        {checklist.activities.length === 0 ? (
          <div className="py-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground">No routine activities scheduled for today.</p>
            <p className="text-xs text-muted-foreground/70">
              Create a routine in the planner to schedule your daily habits and tasks.
            </p>
            <div className="pt-2">
              <Link href="/planner">
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
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
                  className={`flex items-start gap-3 p-2.5 rounded-lg border transition-all cursor-pointer ${
                    activity.completed
                      ? 'bg-muted/30 border-muted opacity-80'
                      : isPast
                      ? 'border-rose-500/30 bg-rose-500/5 hover:border-rose-500/50'
                      : 'border-border hover:border-primary/40 hover:bg-muted/20'
                  }`}
                >
                  <button
                    type="button"
                    disabled={isToggling}
                    className="mt-0.5 shrink-0 transition-transform active:scale-90"
                    aria-label={`Toggle ${activity.title}`}
                  >
                    {activity.completed ? (
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                    ) : isPast ? (
                      <AlertCircle className="h-4.5 w-4.5 text-rose-400" />
                    ) : (
                      <Circle className="h-4.5 w-4.5 text-muted-foreground/40 hover:text-primary transition-colors" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p
                        className={`text-sm font-medium leading-snug truncate ${
                          activity.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                        }`}
                      >
                        {activity.title}
                      </p>
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 h-4 font-normal"
                        style={{ borderColor: cat.color + '40', color: cat.color }}
                      >
                        {cat.icon} {cat.label}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
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
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground">
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

