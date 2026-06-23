import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@supabase/supabase-js";

export type Language = "vi" | "en" | "th" | "id";
export type ThemeMode = "light" | "dark";
export type AccentColor = "blue" | "green" | "purple" | "orange" | "red" | "pink";
export type FontKanji =
  | "Zen Maru Gothic"
  | "Noto Sans JP"
  | "UD Digi Kyokasho"
  | "Comfortaa"
  | "Itim"
  | "OS Default";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
}

interface AppState {
  // UI State
  settingsOpen: boolean;
  activePage: string;
  loginModalOpen: boolean;

  // Preferences
  language: Language;
  theme: ThemeMode;
  soundEnabled: boolean;
  accentColor: AccentColor;
  fontKanji: FontKanji;

  // Auth (Supabase)
  user: User | null;
  userProfile: UserProfile | null;
  isLoggedIn: boolean; // computed shorthand

  // Actions
  setSettingsOpen: (open: boolean) => void;
  setActivePage: (page: string) => void;
  setLoginModalOpen: (open: boolean) => void;
  setLanguage: (lang: Language) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleSound: () => void;
  setAccentColor: (color: AccentColor) => void;
  setFontKanji: (font: FontKanji) => void;
  setUser: (user: User | null) => void;
  setLoggedIn: (v: boolean) => void; // kept for backward-compat
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      settingsOpen: false,
      activePage: "/kanji",
      loginModalOpen: false,
      language: "vi",
      theme: "light",
      soundEnabled: true,
      accentColor: "blue",
      fontKanji: "Noto Sans JP",
      user: null,
      userProfile: null,
      isLoggedIn: false,

      setSettingsOpen: (open) => set({ settingsOpen: open }),
      setActivePage: (page) => set({ activePage: page }),
      setLoginModalOpen: (open) => set({ loginModalOpen: open }),
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
      setAccentColor: (accentColor) => set({ accentColor }),
      setFontKanji: (fontKanji) => set({ fontKanji }),
      setUser: (user) => {
        const profile: UserProfile | null = user
          ? {
              id: user.id,
              name:
                user.user_metadata?.full_name ||
                user.user_metadata?.name ||
                user.email?.split("@")[0] ||
                "Người dùng",
              email: user.email ?? "",
              avatar_url: user.user_metadata?.avatar_url ?? null,
            }
          : null;
        set({ user, userProfile: profile, isLoggedIn: !!user });
      },
      setLoggedIn: (isLoggedIn) => set({ isLoggedIn }),
    }),
    {
      name: "nhai-kanji-prefs",
      partialize: (s) => ({
        language: s.language,
        theme: s.theme,
        soundEnabled: s.soundEnabled,
        accentColor: s.accentColor,
        fontKanji: s.fontKanji,
      }),
    }
  )
);
