"use client";

import { useEffect } from "react";
import { api, type AppUser } from "@/lib/api";
import { useAppStore } from "@/lib/store";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAppStore((state) => state.setUser);

  useEffect(() => {
    let mounted = true;
    api.get<{ user: AppUser }>("/auth/me").then(({ user }) => {
      if (mounted) setUser(user);
    }).catch(() => {
      if (mounted) setUser(null);
    });
    return () => { mounted = false; };
  }, [setUser]);

  return <>{children}</>;
}