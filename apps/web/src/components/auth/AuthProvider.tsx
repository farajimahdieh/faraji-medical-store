"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getMe, logout as apiLogout, type PublicUser } from "@/lib/api";

export type AuthStatus = "loading" | "anonymous" | "authenticated";

interface AuthContextValue {
  status: AuthStatus;
  user: PublicUser | null;
  /** Re-fetch from the server -- call after login/signup/profile-save so the
   * Header (and anything else reading this) picks up the change without a
   * full page reload. */
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<PublicUser | null>(null);

  // Mount fetch: setState only happens inside the promise handlers, never
  // synchronously in the effect body itself.
  useEffect(() => {
    getMe()
      .then(({ user }) => {
        setUser(user);
        setStatus("authenticated");
      })
      .catch(() => {
        setUser(null);
        setStatus("anonymous");
      });
  }, []);

  const refresh = useCallback(async () => {
    try {
      const { user } = await getMe();
      setUser(user);
      setStatus("authenticated");
    } catch {
      setUser(null);
      setStatus("anonymous");
    }
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    setStatus("anonymous");
  }, []);

  return (
    <AuthContext.Provider value={{ status, user, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
