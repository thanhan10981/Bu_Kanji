"use client";

import { useEffect } from "react";
import { api, ApiError, type AppUser } from "@/lib/api";
import { useAppStore } from "@/lib/store";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAppStore((state) => state.setUser);
  const setAuthStatus = useAppStore((state) => state.setAuthStatus);

  useEffect(() => {
    let mounted = true;
    const expired = () => setUser(null);
    window.addEventListener('auth-expired', expired);
    api.get<{ user: AppUser }>("/auth/me").then(({ user }) => {
      if (mounted) setUser(user);
    }).catch((cause) => {
      if (mounted) {
        setUser(null);
        if (!(cause instanceof ApiError && cause.status === 401)) setAuthStatus("error");
      }
    });
    return () => { mounted = false; window.removeEventListener('auth-expired', expired); };
  }, [setUser, setAuthStatus]);

  return <>{children}</>;
}
