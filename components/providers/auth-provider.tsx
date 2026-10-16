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

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isGuest: boolean;
  enterGuestMode: () => void;
  exitGuestMode: () => void;
  login: (data: { username: string; password: string }) => Promise<{ error?: string }>;
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
  isLoading: true,
  isAuthenticated: false,
  isAdmin: false,
  isGuest: false,
  enterGuestMode: () => {},
  exitGuestMode: () => {},
  login: async () => ({}),
  register: async () => ({}),
  logout: async () => {},
  refreshUser: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isGuest = useSyncExternalStore(subscribeGuest, getGuestSnapshot, getGuestServerSnapshot);
  const mountedRef = useRef(true);

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
        setUser(result.user ?? null);
        if (result.user) {
          exitGuestMode();
        }
      }
    } catch {
      if (mountedRef.current) setUser(null);
    }
  }, [exitGuestMode]);

  // Check session on mount
  useEffect(() => {
    mountedRef.current = true;

    authClient.getMe().then((result) => {
      if (mountedRef.current) {
        setUser(result.user ?? null);
        if (result.user) {
          exitGuestMode();
        }
        setIsLoading(false);
      }
    }).catch(() => {
      if (mountedRef.current) {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => { mountedRef.current = false; };
  }, [exitGuestMode]);

  const login = useCallback(async (data: { username: string; password: string }) => {
    const result = await authClient.login(data);
    if (result.error) {
      return { error: result.error };
    }
    exitGuestMode();
    setUser(result.user ?? null);
    return {};
  }, [exitGuestMode]);

  const register = useCallback(async (data: {
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
    exitGuestMode();
    setUser(result.user ?? null);
    return {};
  }, [exitGuestMode]);

  const logout = useCallback(async () => {
    exitGuestMode();
    await authClient.logout();
    setUser(null);
  }, [exitGuestMode]);

  return (
    <AuthContext
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isGuest,
        enterGuestMode,
        exitGuestMode,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext>
  );
}
