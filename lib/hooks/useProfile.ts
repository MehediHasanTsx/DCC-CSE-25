'use client';

import { useEffect, useState, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db/database';
import { hasActiveDb } from '@/lib/db/user-db';
import { profileService } from '@/lib/services/profile.service';
import type { Profile } from '@/types/database';

const PROFILE_ID = 'student-profile';

// Cross-instance notification set to trigger instant reload in all mounted useProfile hooks
const profileListeners = new Set<() => void>();

function notifyListeners() {
  profileListeners.forEach((fn) => {
    try {
      fn();
    } catch {
      // ignore
    }
  });
}

export function useProfile() {
  const [manualProfile, setManualProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Dexie live query watches for changes committed to the profile table
  const liveProfile = useLiveQuery(async () => {
    if (!hasActiveDb()) return null;
    try {
      const p = await db().profile.get(PROFILE_ID);
      return p ?? null;
    } catch {
      return null;
    }
  }, []);

  const load = useCallback(async () => {
    try {
      if (hasActiveDb()) {
        const p = await profileService.get();
        setManualProfile(p);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Listen to cross-component notifications and window events
  useEffect(() => {
    const handleUpdate = () => {
      void load();
    };

    profileListeners.add(handleUpdate);

    if (typeof window !== 'undefined') {
      window.addEventListener('dcc:profile-updated', handleUpdate);
    }

    return () => {
      profileListeners.delete(handleUpdate);
      if (typeof window !== 'undefined') {
        window.removeEventListener('dcc:profile-updated', handleUpdate);
      }
    };
  }, [load]);

  // Use live query value when available, fallback to manual state
  const profile = liveProfile !== undefined ? liveProfile : manualProfile;
  const isLoaded = liveProfile !== undefined || !loading;

  const createProfile = useCallback(async (data: Parameters<typeof profileService.create>[0]) => {
    const p = await profileService.create(data);
    setManualProfile(p);
    notifyListeners();
    return p;
  }, []);

  const updateProfile = useCallback(async (data: Parameters<typeof profileService.update>[0]) => {
    await profileService.update(data);
    await load();
    notifyListeners();
  }, [load]);

  const setCurrentSemester = useCallback(async (semester: number) => {
    await profileService.setCurrentSemester(semester);
    await load();
    notifyListeners();
  }, [load]);

  return {
    profile,
    loading: !isLoaded,
    hasProfile: !!profile,
    createProfile,
    updateProfile,
    setCurrentSemester,
    reload: load,
  };
}
