import { db } from '@/lib/db/database';
import { generateId, getLocalDateString, parseLocalDate } from '@/lib/utils/formatters';
import { cloudSyncService } from '@/lib/services/cloud-sync.service';
import type {
  PersonalRoutine,
  RoutineActivity,
  DailyChecklistEntry,
  DayOfWeek,
  ActivityCategory,
} from '@/types/database';

// ── Category metadata ────────────────────────────────

export const ACTIVITY_CATEGORIES: { value: ActivityCategory; label: string; color: string; icon: string }[] = [
  { value: 'study', label: 'Study', color: '#6366f1', icon: '📚' },
  { value: 'work', label: 'Work', color: '#f59e0b', icon: '💼' },
  { value: 'class', label: 'Class', color: '#3b82f6', icon: '🏫' },
  { value: 'prayer', label: 'Prayer', color: '#8b5cf6', icon: '🤲' },
  { value: 'health', label: 'Health', color: '#10b981', icon: '💪' },
  { value: 'personal', label: 'Personal', color: '#ec4899', icon: '🏠' },
  { value: 'other', label: 'Other', color: '#6b7280', icon: '📌' },
];

export function getCategoryMeta(category: ActivityCategory) {
  return ACTIVITY_CATEGORIES.find((c) => c.value === category) || ACTIVITY_CATEGORIES[6];
}

// ── Routine CRUD ─────────────────────────────────────

export const personalRoutineService = {
  // ── Routines ────────────────────────────────────────

  async getAllRoutines(): Promise<PersonalRoutine[]> {
    return db().personalRoutines.toArray();
  },

  async getRoutine(id: string): Promise<PersonalRoutine | undefined> {
    return db().personalRoutines.get(id);
  },

  async createRoutine(data: {
    name: string;
    weekdays: DayOfWeek[];
    specificDate?: string;
  }): Promise<PersonalRoutine> {
    const now = new Date();
    const routine: PersonalRoutine = {
      id: generateId(),
      name: data.name,
      weekdays: data.weekdays,
      specificDate: data.specificDate,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    await db().personalRoutines.add(routine);
    cloudSyncService.scheduleUpload();
    return routine;
  },

  async updateRoutine(
    id: string,
    data: Partial<Pick<PersonalRoutine, 'name' | 'weekdays' | 'specificDate' | 'isActive'>>
  ): Promise<void> {
    await db().personalRoutines.update(id, { ...data, updatedAt: new Date() });
    cloudSyncService.scheduleUpload();
  },

  async deleteRoutine(id: string): Promise<void> {
    // Delete all activities and checklist entries for this routine
    await db().routineActivities.where('routineId').equals(id).delete();
    await db().dailyChecklist.where('routineId').equals(id).delete();
    await db().personalRoutines.delete(id);
    cloudSyncService.scheduleUpload();
  },

  // ── Activities ──────────────────────────────────────

  async getActivities(routineId: string): Promise<RoutineActivity[]> {
    return db().routineActivities
      .where('routineId')
      .equals(routineId)
      .sortBy('order');
  },

  async getAllActivities(): Promise<RoutineActivity[]> {
    return db().routineActivities.toArray();
  },

  async createActivity(
    routineId: string,
    data: {
      title: string;
      startTime: string;
      endTime: string;
      category: ActivityCategory;
      notes?: string;
      notify?: boolean;
    }
  ): Promise<RoutineActivity> {
    const now = new Date();
    const existing = await this.getActivities(routineId);
    const maxOrder = existing.length > 0 ? Math.max(...existing.map((a) => a.order)) : -1;

    const activity: RoutineActivity = {
      id: generateId(),
      routineId,
      title: data.title,
      startTime: data.startTime,
      endTime: data.endTime,
      category: data.category,
      notes: data.notes,
      notify: data.notify ?? false,
      order: maxOrder + 1,
      createdAt: now,
      updatedAt: now,
    };
    await db().routineActivities.add(activity);
    cloudSyncService.scheduleUpload();
    return activity;
  },

  async updateActivity(
    id: string,
    data: Partial<Pick<RoutineActivity, 'title' | 'startTime' | 'endTime' | 'category' | 'notes' | 'notify' | 'order'>>
  ): Promise<void> {
    await db().routineActivities.update(id, { ...data, updatedAt: new Date() });
    cloudSyncService.scheduleUpload();
  },

  async deleteActivity(id: string): Promise<void> {
    await db().dailyChecklist.where('activityId').equals(id).delete();
    await db().routineActivities.delete(id);
    cloudSyncService.scheduleUpload();
  },

  async reorderActivities(routineId: string, orderedIds: string[]): Promise<void> {
    const now = new Date();
    await db().transaction('rw', db().routineActivities, async () => {
      for (let i = 0; i < orderedIds.length; i++) {
        await db().routineActivities.update(orderedIds[i], { order: i, updatedAt: now });
      }
    });
    cloudSyncService.scheduleUpload();
  },

  // ── Overlap detection ───────────────────────────────

  checkOverlap(
    activities: RoutineActivity[],
    newStart: string,
    newEnd: string,
    excludeId?: string
  ): RoutineActivity | null {
    for (const a of activities) {
      if (excludeId && a.id === excludeId) continue;
      // Overlap: newStart < existingEnd && newEnd > existingStart
      if (newStart < a.endTime && newEnd > a.startTime) {
        return a;
      }
    }
    return null;
  },

  // ── Checklist ───────────────────────────────────────

  /**
   * Get routines active on a specific date.
   * Matches by weekday OR specific date.
   */
  async getRoutinesForDate(date: string): Promise<PersonalRoutine[]> {
    const dayOfWeek = parseLocalDate(date)
      .toLocaleDateString('en-US', { weekday: 'long' })
      .toLowerCase() as DayOfWeek;

    const allRoutines = await this.getAllRoutines();
    return allRoutines.filter((r) => {
      if (!r.isActive) return false;
      // Check specific date match
      if (r.specificDate === date) return true;
      // Check weekday match
      return r.weekdays.includes(dayOfWeek);
    });
  },

  /**
   * Get all activities scheduled for a given date, with their checklist status.
   */
  async getChecklistForDate(date: string): Promise<{
    activities: (RoutineActivity & { routineName: string; completed: boolean; completedAt?: Date; checklistId?: string })[];
    stats: { total: number; completed: number; remaining: number; percentage: number };
  }> {
    const routines = await this.getRoutinesForDate(date);
    if (routines.length === 0) {
      return { activities: [], stats: { total: 0, completed: 0, remaining: 0, percentage: 0 } };
    }

    // Get activities for all matching routines
    const allActivities: (RoutineActivity & { routineName: string })[] = [];
    for (const routine of routines) {
      const activities = await this.getActivities(routine.id);
      for (const a of activities) {
        allActivities.push({ ...a, routineName: routine.name });
      }
    }

    // Sort by start time
    allActivities.sort((a, b) => a.startTime.localeCompare(b.startTime));

    // Get existing checklist entries for this date
    const checklistEntries = await db().dailyChecklist
      .where('date')
      .equals(date)
      .toArray();
    const checkMap = new Map(checklistEntries.map((c) => [c.activityId, c]));

    const activities = allActivities.map((a) => {
      const entry = checkMap.get(a.id);
      return {
        ...a,
        completed: entry?.completed ?? false,
        completedAt: entry?.completedAt,
        checklistId: entry?.id,
      };
    });

    const total = activities.length;
    const completed = activities.filter((a) => a.completed).length;
    const remaining = total - completed;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { activities, stats: { total, completed, remaining, percentage } };
  },

  /**
   * Toggle an activity's completion for a specific date.
   */
  async toggleActivity(date: string, activityId: string, routineId: string): Promise<boolean> {
    const existing = await db().dailyChecklist
      .where('[date+activityId]')
      .equals([date, activityId])
      .first();

    if (existing) {
      const newCompleted = !existing.completed;
      await db().dailyChecklist.update(existing.id, {
        completed: newCompleted,
        completedAt: newCompleted ? new Date() : undefined,
      });
      cloudSyncService.scheduleUpload();
      return newCompleted;
    } else {
      // Create new entry as completed
      const entry: DailyChecklistEntry = {
        id: generateId(),
        date,
        activityId,
        routineId,
        completed: true,
        completedAt: new Date(),
        createdAt: new Date(),
      };
      await db().dailyChecklist.add(entry);
      cloudSyncService.scheduleUpload();
      return true;
    }
  },

  /**
   * Get weekly completion stats.
   */
  async getWeeklyStats(startDate: string, endDate: string): Promise<
    { date: string; dayLabel: string; total: number; completed: number; percentage: number }[]
  > {
    const stats: { date: string; dayLabel: string; total: number; completed: number; percentage: number }[] = [];
    const current = parseLocalDate(startDate);
    const end = parseLocalDate(endDate);

    while (current <= end) {
      const dateStr = getLocalDateString(current);
      const dayLabel = current.toLocaleDateString('en-US', { weekday: 'short' });
      const checklist = await this.getChecklistForDate(dateStr);
      stats.push({
        date: dateStr,
        dayLabel,
        ...checklist.stats,
      });
      current.setDate(current.getDate() + 1);
    }

    return stats;
  },
};
