'use client';

import { useEffect, useState, useMemo } from 'react';
import { personalRoutineService, getCategoryMeta, ACTIVITY_CATEGORIES } from '@/lib/services/personal-routine.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ListChecks,
  CalendarDays,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  LayoutGrid,
} from 'lucide-react';
import { formatTime, getLocalDateString, parseLocalDate } from '@/lib/utils/formatters';
import { toast } from 'sonner';
import type {
  PersonalRoutine,
  RoutineActivity,
  DayOfWeek,
  ActivityCategory,
} from '@/types/database';

const WEEKDAYS: { value: DayOfWeek; label: string; short: string }[] = [
  { value: 'saturday', label: 'Saturday', short: 'Sat' },
  { value: 'sunday', label: 'Sunday', short: 'Sun' },
  { value: 'monday', label: 'Monday', short: 'Mon' },
  { value: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { value: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { value: 'thursday', label: 'Thursday', short: 'Thu' },
  { value: 'friday', label: 'Friday', short: 'Fri' },
];

function getDateString(d: Date): string {
  return getLocalDateString(d);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function getWeekStart(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayIdx = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  // Move to Saturday (start of Bangladeshi week: Sat=0, Sun=-1, Mon=-2, Tue=-3, Wed=-4, Thu=-5, Fri=-6)
  const satOffset = dayIdx === 6 ? 0 : -(dayIdx + 1);
  d.setDate(d.getDate() + satOffset);
  return d;
}

export default function PlannerPage() {
  const [activeTab, setActiveTab] = useState('today');
  const [routines, setRoutines] = useState<PersonalRoutine[]>([]);
  const [allActivities, setAllActivities] = useState<RoutineActivity[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => getDateString(new Date()));
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));

  // Dialog states
  const [routineDialogOpen, setRoutineDialogOpen] = useState(false);
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<PersonalRoutine | null>(null);
  const [editingActivity, setEditingActivity] = useState<RoutineActivity | null>(null);
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'routine' | 'activity'; id: string; name: string } | null>(null);

  // Checklist state
  const [checklistData, setChecklistData] = useState<{
    activities: (RoutineActivity & { routineName: string; completed: boolean; completedAt?: Date; checklistId?: string })[];
    stats: { total: number; completed: number; remaining: number; percentage: number };
  }>({ activities: [], stats: { total: 0, completed: 0, remaining: 0, percentage: 0 } });

  // Weekly stats
  const [weeklyStats, setWeeklyStats] = useState<
    { date: string; dayLabel: string; total: number; completed: number; percentage: number }[]
  >([]);

  const loadRoutines = async () => {
    const r = await personalRoutineService.getAllRoutines();
    setRoutines(r);
    const a = await personalRoutineService.getAllActivities();
    setAllActivities(a);
  };

  const loadChecklist = async () => {
    const data = await personalRoutineService.getChecklistForDate(selectedDate);
    setChecklistData(data);
  };

  const loadWeeklyStats = async () => {
    const startStr = getDateString(weekStart);
    const endStr = getDateString(addDays(weekStart, 6));
    const stats = await personalRoutineService.getWeeklyStats(startStr, endStr);
    setWeeklyStats(stats);
  };

  useEffect(() => {
    let active = true;
    void (async () => {
      const [r, a] = await Promise.all([
        personalRoutineService.getAllRoutines(),
        personalRoutineService.getAllActivities(),
      ]);
      if (active) {
        setRoutines(r);
        setAllActivities(a);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      const data = await personalRoutineService.getChecklistForDate(selectedDate);
      if (active) {
        setChecklistData(data);
      }
    })();
    return () => {
      active = false;
    };
  }, [selectedDate]);

  useEffect(() => {
    if (activeTab !== 'weekly') return;
    let active = true;
    void (async () => {
      const startStr = getDateString(weekStart);
      const endStr = getDateString(addDays(weekStart, 6));
      const stats = await personalRoutineService.getWeeklyStats(startStr, endStr);
      if (active) {
        setWeeklyStats(stats);
      }
    })();
    return () => {
      active = false;
    };
  }, [activeTab, weekStart]);

  const handleToggleActivity = async (activityId: string, routineId: string) => {
    await personalRoutineService.toggleActivity(selectedDate, activityId, routineId);
    await loadChecklist();
    if (activeTab === 'weekly') await loadWeeklyStats();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'routine') {
      await personalRoutineService.deleteRoutine(deleteTarget.id);
      toast.success('Routine deleted.');
    } else {
      await personalRoutineService.deleteActivity(deleteTarget.id);
      toast.success('Activity deleted.');
    }
    setDeleteTarget(null);
    await loadRoutines();
    await loadChecklist();
  };

  // Navigate dates
  const goToDate = (direction: number) => {
    const d = parseLocalDate(selectedDate);
    d.setDate(d.getDate() + direction);
    setSelectedDate(getDateString(d));
  };

  const goToToday = () => {
    setSelectedDate(getDateString(new Date()));
    setWeekStart(getWeekStart(new Date()));
  };

  const isToday = selectedDate === getDateString(new Date());

  const selectedDateLabel = parseLocalDate(selectedDate).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Activities grouped by routine for the manage tab
  const routineActivitiesMap = useMemo(() => {
    const map = new Map<string, RoutineActivity[]>();
    for (const a of allActivities) {
      const arr = map.get(a.routineId) || [];
      arr.push(a);
      map.set(a.routineId, arr);
    }
    // Sort by order within each routine
    for (const [, arr] of map) {
      arr.sort((a, b) => a.order - b.order);
    }
    return map;
  }, [allActivities]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ListChecks className="h-6 w-6 text-primary" />
          Routine Planner
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Plan your daily activities and track completion
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="today" className="gap-1.5 text-xs sm:text-sm">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Today&apos;s</span> Checklist
          </TabsTrigger>
          <TabsTrigger value="weekly" className="gap-1.5 text-xs sm:text-sm">
            <CalendarDays className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Weekly</span> Planner
          </TabsTrigger>
          <TabsTrigger value="manage" className="gap-1.5 text-xs sm:text-sm">
            <LayoutGrid className="h-3.5 w-3.5" />
            Manage <span className="hidden sm:inline">Routines</span>
          </TabsTrigger>
        </TabsList>

        {/* ── TODAY'S CHECKLIST ────────────────── */}
        <TabsContent value="today" className="space-y-4">
          {/* Date Navigation */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => goToDate(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center">
              <p className="text-sm font-semibold">{selectedDateLabel}</p>
              {!isToday && (
                <Button variant="link" size="sm" className="text-xs h-5 px-0" onClick={goToToday}>
                  Go to Today
                </Button>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={() => goToDate(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress */}
          {checklistData.stats.total > 0 && (
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Daily Progress</p>
                  <p className="text-sm font-bold text-primary">
                    {checklistData.stats.percentage}%
                  </p>
                </div>
                <Progress value={checklistData.stats.percentage} className="h-2" />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>{checklistData.stats.completed} completed</span>
                  <span>{checklistData.stats.remaining} remaining</span>
                  <span>{checklistData.stats.total} total</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Activity List */}
          {checklistData.activities.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CalendarDays className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No activities scheduled</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  {routines.length === 0
                    ? 'Create a routine to get started'
                    : 'No routine is assigned to this day'}
                </p>
                {routines.length === 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => { setEditingRoutine(null); setRoutineDialogOpen(true); }}
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> Create Routine
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {checklistData.activities.map((activity) => {
                const cat = getCategoryMeta(activity.category);
                const now = new Date();
                const actEndParts = activity.endTime.split(':');
                const actEnd = new Date(selectedDate + 'T00:00:00');
                actEnd.setHours(parseInt(actEndParts[0]), parseInt(actEndParts[1]));
                const isPast = !activity.completed && actEnd < now && isToday;

                return (
                  <Card
                    key={activity.id}
                    className={`transition-all cursor-pointer group ${
                      activity.completed
                        ? 'bg-muted/30 border-muted'
                        : isPast
                        ? 'border-rose-500/30 bg-rose-500/5'
                        : 'hover:border-primary/30'
                    }`}
                    onClick={() => handleToggleActivity(activity.id, activity.routineId)}
                  >
                    <CardContent className="py-3 px-4 flex items-start gap-3">
                      <div className="pt-0.5">
                        {activity.completed ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        ) : isPast ? (
                          <AlertCircle className="h-5 w-5 text-rose-400" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium ${activity.completed ? 'line-through text-muted-foreground' : ''}`}>
                            {activity.title}
                          </p>
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0"
                            style={{ borderColor: cat.color + '40', color: cat.color }}
                          >
                            {cat.icon} {cat.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(activity.startTime)} – {formatTime(activity.endTime)}
                          </p>
                          <span className="text-[10px] text-muted-foreground/50">·</span>
                          <p className="text-[10px] text-muted-foreground/60">{activity.routineName}</p>
                        </div>
                        {activity.notes && (
                          <p className="text-[11px] text-muted-foreground/70 mt-1 italic">{activity.notes}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── WEEKLY PLANNER ──────────────────── */}
        <TabsContent value="weekly" className="space-y-4">
          {/* Week Navigation */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setWeekStart(addDays(weekStart, -7))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center">
              <p className="text-sm font-semibold">
                {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
                {addDays(weekStart, 6).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
              <Button variant="link" size="sm" className="text-xs h-5 px-0" onClick={goToToday}>
                This Week
              </Button>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setWeekStart(addDays(weekStart, 7))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Weekly Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {weeklyStats.map((day) => {
              const isSelected = day.date === selectedDate;
              const isTodayDate = day.date === getDateString(new Date());
              const dayDate = parseLocalDate(day.date);
              return (
                <button
                  key={day.date}
                  onClick={() => { setSelectedDate(day.date); setActiveTab('today'); }}
                  className={`rounded-lg p-2 text-center transition-all border ${
                    isSelected
                      ? 'border-primary bg-primary/10'
                      : isTodayDate
                      ? 'border-primary/40 bg-primary/5'
                      : 'border-border hover:border-primary/30 hover:bg-muted/50'
                  }`}
                >
                  <p className="text-[10px] font-medium text-muted-foreground">{day.dayLabel}</p>
                  <p className={`text-sm font-bold ${isTodayDate ? 'text-primary' : ''}`}>
                    {dayDate.getDate()}
                  </p>
                  {day.total > 0 ? (
                    <div className="mt-1">
                      <div className="h-1 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            day.percentage === 100
                              ? 'bg-emerald-500'
                              : day.percentage > 0
                              ? 'bg-primary'
                              : 'bg-transparent'
                          }`}
                          style={{ width: `${day.percentage}%` }}
                        />
                      </div>
                      <p className="text-[9px] text-muted-foreground mt-0.5">
                        {day.completed}/{day.total}
                      </p>
                    </div>
                  ) : (
                    <p className="text-[9px] text-muted-foreground/40 mt-1">—</p>
                  )}
                </button>
              );
            })}
          </div>

          {/* Routines assigned per day overview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Routine Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              {routines.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No routines created yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {routines.filter((r) => r.isActive).map((routine) => (
                    <div key={routine.id} className="rounded-lg border border-border p-3">
                      <p className="text-sm font-medium">{routine.name}</p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {WEEKDAYS.map((day) => (
                          <Badge
                            key={day.value}
                            variant={routine.weekdays.includes(day.value) ? 'default' : 'outline'}
                            className={`text-[10px] px-1.5 py-0 ${
                              routine.weekdays.includes(day.value) ? '' : 'opacity-30'
                            }`}
                          >
                            {day.short}
                          </Badge>
                        ))}
                      </div>
                      {routine.specificDate && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          One-time: {new Date(routine.specificDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── MANAGE ROUTINES ─────────────────── */}
        <TabsContent value="manage" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Your Routines ({routines.length})</p>
            <Button
              size="sm"
              onClick={() => { setEditingRoutine(null); setRoutineDialogOpen(true); }}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" /> New Routine
            </Button>
          </div>

          {routines.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <LayoutGrid className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No routines yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Create your first routine to start planning your day
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {routines.map((routine) => {
                const activities = routineActivitiesMap.get(routine.id) || [];
                return (
                  <Card key={routine.id} className={!routine.isActive ? 'opacity-50' : ''}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-sm">{routine.name}</CardTitle>
                          {!routine.isActive && (
                            <Badge variant="outline" className="text-[10px]">Inactive</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => { setEditingRoutine(routine); setRoutineDialogOpen(true); }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => setDeleteTarget({ type: 'routine', id: routine.id, name: routine.name })}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {routine.weekdays.map((d) => {
                          const day = WEEKDAYS.find((w) => w.value === d);
                          return (
                            <Badge key={d} variant="secondary" className="text-[10px] px-1.5 py-0">
                              {day?.short || d}
                            </Badge>
                          );
                        })}
                        {routine.specificDate && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            📅 {new Date(routine.specificDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {activities.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-3">
                          No activities yet
                        </p>
                      ) : (
                        activities.map((a) => {
                          const cat = getCategoryMeta(a.category);
                          return (
                            <div
                              key={a.id}
                              className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2"
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className="text-sm">{cat.icon}</span>
                                <div className="min-w-0">
                                  <p className="text-xs font-medium truncate">{a.title}</p>
                                  <p className="text-[10px] text-muted-foreground">
                                    {formatTime(a.startTime)} – {formatTime(a.endTime)}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => {
                                    setSelectedRoutineId(routine.id);
                                    setEditingActivity(a);
                                    setActivityDialogOpen(true);
                                  }}
                                >
                                  <Pencil className="h-2.5 w-2.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-destructive"
                                  onClick={() => setDeleteTarget({ type: 'activity', id: a.id, name: a.title })}
                                >
                                  <Trash2 className="h-2.5 w-2.5" />
                                </Button>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs h-8"
                        onClick={() => {
                          setSelectedRoutineId(routine.id);
                          setEditingActivity(null);
                          setActivityDialogOpen(true);
                        }}
                      >
                        <Plus className="mr-1.5 h-3 w-3" /> Add Activity
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── ROUTINE DIALOG ─────────────────── */}
      <Dialog open={routineDialogOpen} onOpenChange={setRoutineDialogOpen}>
        <DialogContent className="max-w-md">
          <RoutineForm
            routine={editingRoutine}
            existingRoutines={routines}
            onSubmit={async (data) => {
              if (editingRoutine) {
                await personalRoutineService.updateRoutine(editingRoutine.id, data);
                toast.success('Routine updated.');
              } else {
                await personalRoutineService.createRoutine(data);
                toast.success('Routine created.');
              }
              setRoutineDialogOpen(false);
              setEditingRoutine(null);
              await loadRoutines();
              await loadChecklist();
            }}
            onCancel={() => { setRoutineDialogOpen(false); setEditingRoutine(null); }}
          />
        </DialogContent>
      </Dialog>

      {/* ── ACTIVITY DIALOG ────────────────── */}
      <Dialog open={activityDialogOpen} onOpenChange={setActivityDialogOpen}>
        <DialogContent className="max-w-md">
          <ActivityForm
            activity={editingActivity}
            existingActivities={selectedRoutineId ? (routineActivitiesMap.get(selectedRoutineId) || []) : []}
            onSubmit={async (data) => {
              if (!selectedRoutineId) return;
              if (editingActivity) {
                await personalRoutineService.updateActivity(editingActivity.id, data);
                toast.success('Activity updated.');
              } else {
                await personalRoutineService.createActivity(selectedRoutineId, data);
                toast.success('Activity added.');
              }
              setActivityDialogOpen(false);
              setEditingActivity(null);
              setSelectedRoutineId(null);
              await loadRoutines();
              await loadChecklist();
            }}
            onCancel={() => { setActivityDialogOpen(false); setEditingActivity(null); setSelectedRoutineId(null); }}
          />
        </DialogContent>
      </Dialog>

      {/* ── DELETE CONFIRM ─────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.type === 'routine' ? 'routine' : 'activity'}?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === 'routine'
                ? `This will delete "${deleteTarget?.name}" and all its activities and completion history. This cannot be undone.`
                : `This will delete "${deleteTarget?.name}" and its completion history.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── ROUTINE FORM ─────────────────────────────────────

function RoutineForm({
  routine,
  existingRoutines,
  onSubmit,
  onCancel,
}: {
  routine: PersonalRoutine | null;
  existingRoutines: PersonalRoutine[];
  onSubmit: (data: { name: string; weekdays: DayOfWeek[]; specificDate?: string; isActive?: boolean }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(routine?.name || '');
  const [weekdays, setWeekdays] = useState<DayOfWeek[]>(routine?.weekdays || []);
  const [specificDate, setSpecificDate] = useState(routine?.specificDate || '');
  const [isActive, setIsActive] = useState(routine?.isActive ?? true);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    if (weekdays.length === 0 && !specificDate) {
      setError('Select at least one weekday or a specific date');
      return;
    }

    // Check for duplicate names
    const duplicate = existingRoutines.find(
      (r) => r.name.toLowerCase() === name.trim().toLowerCase() && r.id !== routine?.id
    );
    if (duplicate) {
      setError('A routine with this name already exists');
      return;
    }

    onSubmit({
      name: name.trim(),
      weekdays,
      specificDate: specificDate || undefined,
      isActive,
    });
  };

  const toggleWeekday = (day: DayOfWeek) => {
    setWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
    setError('');
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{routine ? 'Edit Routine' : 'Create Routine'}</DialogTitle>
        <DialogDescription>
          {routine ? 'Update your routine settings' : 'Create a new routine schedule'}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <div className="space-y-2">
          <Label>Routine Name</Label>
          <Input
            placeholder="e.g. Class + Office, Weekend"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(''); }}
          />
        </div>

        <div className="space-y-2">
          <Label>Active Days</Label>
          <div className="flex flex-wrap gap-1.5">
            {WEEKDAYS.map((day) => (
              <Button
                key={day.value}
                type="button"
                variant={weekdays.includes(day.value) ? 'default' : 'outline'}
                size="sm"
                className="text-xs h-8 px-3"
                onClick={() => toggleWeekday(day.value)}
              >
                {day.short}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Specific Date (optional)</Label>
          <Input
            type="date"
            value={specificDate}
            onChange={(e) => { setSpecificDate(e.target.value); setError(''); }}
          />
          <p className="text-[10px] text-muted-foreground">
            For one-time routines on a specific date
          </p>
        </div>

        {routine && (
          <div className="flex items-center gap-2">
            <Checkbox
              id="routine-active"
              checked={isActive}
              onCheckedChange={(checked) => setIsActive(!!checked)}
            />
            <Label htmlFor="routine-active" className="text-sm cursor-pointer">Active</Label>
          </div>
        )}

        {error && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> {error}
          </p>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit}>{routine ? 'Update' : 'Create'}</Button>
      </DialogFooter>
    </>
  );
}

// ── ACTIVITY FORM ────────────────────────────────────

function ActivityForm({
  activity,
  existingActivities,
  onSubmit,
  onCancel,
}: {
  activity: RoutineActivity | null;
  existingActivities: RoutineActivity[];
  onSubmit: (data: { title: string; startTime: string; endTime: string; category: ActivityCategory; notes?: string }) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(activity?.title || '');
  const [startTime, setStartTime] = useState(activity?.startTime || '08:00');
  const [endTime, setEndTime] = useState(activity?.endTime || '09:00');
  const [category, setCategory] = useState<ActivityCategory>(activity?.category || 'study');
  const [notes, setNotes] = useState(activity?.notes || '');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (startTime >= endTime) {
      setError('End time must be after start time');
      return;
    }

    // Check for overlap
    const overlap = personalRoutineService.checkOverlap(
      existingActivities,
      startTime,
      endTime,
      activity?.id
    );
    if (overlap) {
      setError(`Overlaps with "${overlap.title}" (${formatTime(overlap.startTime)} – ${formatTime(overlap.endTime)})`);
      return;
    }

    onSubmit({
      title: title.trim(),
      startTime,
      endTime,
      category,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{activity ? 'Edit Activity' : 'Add Activity'}</DialogTitle>
        <DialogDescription>
          {activity ? 'Update activity details' : 'Add a new activity to this routine'}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input
            placeholder="e.g. Morning Study, Gym"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setError(''); }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Start Time</Label>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => { setStartTime(e.target.value); setError(''); }}
            />
          </div>
          <div className="space-y-2">
            <Label>End Time</Label>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => { setEndTime(e.target.value); setError(''); }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as ActivityCategory)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ACTIVITY_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Notes (optional)</Label>
          <Textarea
            placeholder="Any additional notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />
        </div>

        {error && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> {error}
          </p>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit}>{activity ? 'Update' : 'Add'}</Button>
      </DialogFooter>
    </>
  );
}
