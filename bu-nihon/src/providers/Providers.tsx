"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAppStore } from "@/lib/store";
import { useEffect } from "react";
import { AuthProvider } from "./AuthProvider";

function ThemeApplier({ children }: { children: React.ReactNode }) {
  const theme = useAppStore((s) => s.theme);
  const accentColor = useAppStore((s) => s.accentColor);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    root.setAttribute("data-accent", accentColor);
  }, [theme, accentColor]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeApplier>{children}</ThemeApplier>
      </AuthProvider>
    </QueryClientProvider>
  );
}
