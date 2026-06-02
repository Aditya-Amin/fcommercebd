"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import {
  getCurrentUser,
  loginAccount,
  logoutAccount,
  registerAccount,
  TOKEN_KEY,
  USER_KEY
} from "@/lib/api/auth";
import type {
  AuthUser,
  LoginPayload,
  RegisterPayload
} from "@/lib/types/auth";

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isReady: boolean;
  register: (payload: RegisterPayload) => Promise<{ token: string; user: AuthUser }>;
  login: (payload: LoginPayload) => Promise<{ token: string; user: AuthUser }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<AuthUser | null>;
  updateUser: (patch: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthState | null>(null);

function persistUser(user: AuthUser | null): void {
  if (typeof window === "undefined") return;
  if (user) window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  else window.localStorage.removeItem(USER_KEY);
}

function persistToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  // On mount: hydrate from localStorage immediately for fast first paint, then
  // re-validate against /api/me so server-side state is the source of truth.
  useEffect(() => {
    let cancelled = false;

    try {
      const raw = window.localStorage.getItem(USER_KEY);
      if (raw) setUser(JSON.parse(raw) as AuthUser);
    } catch {
      /* ignore corrupt cache */
    }

    const hasToken = !!window.localStorage.getItem(TOKEN_KEY);
    if (!hasToken) {
      setIsReady(true);
      return;
    }

    getCurrentUser()
      .then((fresh) => {
        if (cancelled) return;
        if (fresh) {
          setUser(fresh);
          persistUser(fresh);
        } else {
          // 401 → token invalid; clear local state.
          persistToken(null);
          persistUser(null);
          setUser(null);
        }
      })
      .catch(() => {
        /* network error — keep cached user as a best-effort */
      })
      .finally(() => {
        if (!cancelled) setIsReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const res = await registerAccount(payload);
    persistToken(res.token);
    persistUser(res.user);
    setUser(res.user);
    return res;
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const res = await loginAccount(payload);
    persistToken(res.token);
    persistUser(res.user);
    setUser(res.user);
    return res;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutAccount();
    } finally {
      persistToken(null);
      persistUser(null);
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const fresh = await getCurrentUser();
    if (fresh) {
      setUser(fresh);
      persistUser(fresh);
    }
    return fresh;
  }, []);

  const updateUser = useCallback(
    (patch: Partial<AuthUser>) => {
      setUser((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...patch };
        persistUser(next);
        return next;
      });
    },
    []
  );

  const value = useMemo<AuthState>(
    () => ({
      user,
      isAuthenticated: !!user,
      isReady,
      register,
      login,
      logout,
      refreshUser,
      updateUser
    }),
    [user, isReady, register, login, logout, refreshUser, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
