'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef, useSyncExternalStore } from 'react';
import { authClient, type AuthUser } from '@/lib/auth/client';

let _guestListeners: Array<() => void> = [];
function notifyGuest() {
  for (const listener of _guestListeners) listener();
}
function subscribeGuest(listener: () => void) {
  _guestListeners.push(listener);
  return () => {
    _guestListeners = _guestListeners.filter((l) => l !== listener);
  };
}
function getGuestSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem('dcc_cse_guest_mode') === 'true';
  } catch {
    return false;
  }
}
function getGuestServerSnapshot(): boolean {
  return false;
}

const CACHED_USER_STORAGE_KEY = 'dcc_cse_last_auth_user';

export function getStoredAuthUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CACHED_USER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function saveStoredAuthUser(user: AuthUser): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHED_USER_STORAGE_KEY, JSON.stringify(user));
  } catch {
    // localStorage full or unavailable
  }
}

export function clearStoredAuthUser(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(CACHED_USER_STORAGE_KEY);
  } catch {
    // localStorage unavailable
  }
}

interface AuthContextValue {
  user: AuthUser | null;
  cachedUser: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isGuest: boolean;
  isOffline: boolean;
  enterGuestMode: () => void;
  exitGuestMode: () => void;
  login: (data: { username: string; password: string }) => Promise<{ error?: string; isOffline?: boolean }>;
  loginOffline: (userToLogin?: AuthUser) => boolean;
  register: (data: {
    username: string;
    email: string;
    mobile: string;
    password: string;
    confirmPassword: string;
  }) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  cachedUser: null,
  isLoading: true,
  isAuthenticated: false,
  isAdmin: false,
  isGuest: false,
  isOffline: false,
  enterGuestMode: () => {},
  exitGuestMode: () => {},
  login: async () => ({}),
  loginOffline: () => false,
  register: async () => ({}),
  logout: async () => {},
  refreshUser: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [cachedUser, setCachedUser] = useState<AuthUser | null>(() => getStoredAuthUser());
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return getStoredAuthUser();
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState<boolean>(
    () => typeof navigator !== 'undefined' && !navigator.onLine
  );
  const isGuest = useSyncExternalStore(subscribeGuest, getGuestSnapshot, getGuestServerSnapshot);
  const mountedRef = useRef(true);

  // Monitor online / offline network state
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const enterGuestMode = useCallback(() => {
    try {
      sessionStorage.setItem('dcc_cse_guest_mode', 'true');
    } catch {
      // sessionStorage unavailable
    }
    notifyGuest();
  }, []);

  const exitGuestMode = useCallback(() => {
    try {
      sessionStorage.removeItem('dcc_cse_guest_mode');
    } catch {
      // sessionStorage unavailable
    }
    notifyGuest();
  }, []);

  // Fetch user from session — called on mount and after login/register
  const refreshUser = useCallback(async () => {
    try {
      const result = await authClient.getMe();
      if (mountedRef.current) {
        if (result.user) {
          saveStoredAuthUser(result.user);
          setCachedUser(result.user);
          setUser(result.user);
          exitGuestMode();
        } else {
          // If network failed or user is offline, keep cached session if present
          const offlineNow = typeof navigator !== 'undefined' && !navigator.onLine;
          const isNetworkFailure =
            result.error === 'Offline' ||
            result.error?.toLowerCase().includes('network') ||
            result.error?.toLowerCase().includes('fetch');

          const stored = getStoredAuthUser();
          setCachedUser(stored);

          if ((offlineNow || isNetworkFailure) && stored) {
            setUser(stored);
            exitGuestMode();
          } else {
            setUser(null);
          }
        }
      }
    } catch {
      if (mountedRef.current) {
        const stored = getStoredAuthUser();
        setCachedUser(stored);
        if (stored) {
          setUser(stored);
          exitGuestMode();
        } else {
          setUser(null);
        }
      }
    }
  }, [exitGuestMode]);

  // Check session on mount
  useEffect(() => {
    mountedRef.current = true;
    const stored = getStoredAuthUser();

    authClient
      .getMe()
      .then((result) => {
        if (mountedRef.current) {
          if (result.user) {
            saveStoredAuthUser(result.user);
            setCachedUser(result.user);
            setUser(result.user);
            exitGuestMode();
          } else {
            const offlineNow = typeof navigator !== 'undefined' && !navigator.onLine;
            const isNetworkFailure =
              result.error === 'Offline' ||
              result.error?.toLowerCase().includes('network') ||
              result.error?.toLowerCase().includes('fetch');

            if ((offlineNow || isNetworkFailure) && stored) {
              // Maintain offline session
              setUser(stored);
              exitGuestMode();
            } else {
              setUser(null);
            }
          }
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (mountedRef.current) {
          if (stored) {
            setUser(stored);
            exitGuestMode();
          } else {
            setUser(null);
          }
          setIsLoading(false);
        }
      });

    return () => {
      mountedRef.current = false;
    };
  }, [exitGuestMode]);

  const loginOffline = useCallback(
    (userToLogin?: AuthUser): boolean => {
      const targetUser = userToLogin || cachedUser || getStoredAuthUser();
      if (!targetUser) return false;
      exitGuestMode();
      setUser(targetUser);
      return true;
    },
    [cachedUser, exitGuestMode]
  );

  const login = useCallback(
    async (data: { username: string; password: string }) => {
      const offlineNow = typeof navigator !== 'undefined' && !navigator.onLine;
      const stored = cachedUser || getStoredAuthUser();

      // If currently offline, verify if the account is saved on this device
      if (offlineNow) {
        if (
          stored &&
          (stored.username.toLowerCase() === data.username.toLowerCase() ||
            stored.mobile === data.username ||
            (stored.email && stored.email.toLowerCase() === data.username.toLowerCase()))
        ) {
          exitGuestMode();
          setUser(stored);
          return { isOffline: true };
        }
        return {
          error:
            'You are offline. Only previously signed-in accounts on this device can be accessed offline. You can also click "Continue as Guest".',
        };
      }

      try {
        const result = await authClient.login(data);
        if (result.error) {
          // If login failed due to network unavailability midway
          if (
            result.error.toLowerCase().includes('network') ||
            result.error === 'Offline'
          ) {
            if (
              stored &&
              (stored.username.toLowerCase() === data.username.toLowerCase() ||
                stored.mobile === data.username ||
                (stored.email && stored.email.toLowerCase() === data.username.toLowerCase()))
            ) {
              exitGuestMode();
              setUser(stored);
              return { isOffline: true };
            }
          }
          return { error: result.error };
        }
        if (result.user) {
          saveStoredAuthUser(result.user);
          setCachedUser(result.user);
          setUser(result.user);
        }
        exitGuestMode();
        return {};
      } catch {
        if (
          stored &&
          (stored.username.toLowerCase() === data.username.toLowerCase() ||
            stored.mobile === data.username ||
            (stored.email && stored.email.toLowerCase() === data.username.toLowerCase()))
        ) {
          exitGuestMode();
          setUser(stored);
          return { isOffline: true };
        }
        return { error: 'Network error. Please check your internet connection or continue as Guest.' };
      }
    },
    [cachedUser, exitGuestMode]
  );

  const register = useCallback(
    async (data: {
      username: string;
      email: string;
      mobile: string;
      password: string;
      confirmPassword: string;
    }) => {
      const result = await authClient.register(data);
      if (result.error) {
        return { error: result.error };
      }
      if (result.user) {
        saveStoredAuthUser(result.user);
        setCachedUser(result.user);
        setUser(result.user);
      }
      exitGuestMode();
      return {};
    },
    [exitGuestMode]
  );

  const logout = useCallback(async () => {
    exitGuestMode();
    clearStoredAuthUser();
    setCachedUser(null);
    try {
      await authClient.logout();
    } catch {
      // Offline logout
    }
    setUser(null);
  }, [exitGuestMode]);

  return (
    <AuthContext
      value={{
        user,
        cachedUser,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isGuest,
        isOffline,
        enterGuestMode,
        exitGuestMode,
        login,
        loginOffline,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext>
  );
}
