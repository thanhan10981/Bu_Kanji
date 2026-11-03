import { create } from "zustand";
import { persist } from "zustand/middleware";
import { queryClient } from "@/lib/queryClient";
import type { AppUser } from "@/lib/api";

export type Language = "vi" | "en" | "th" | "id";
export type ThemeMode = "light" | "dark";
export type AccentColor = "blue" | "green" | "purple" | "orange" | "red" | "pink";
export type FontKanji = "Zen Maru Gothic" | "Noto Sans JP" | "UD Digi Kyokasho" | "Comfortaa" | "Itim" | "OS Default";

export interface UserProfile { id: string; name: string; email: string; avatar_url: string | null; }

interface AppState {
  settingsOpen: boolean;
  activePage: string;
  loginModalOpen: boolean;
  language: Language;
  theme: ThemeMode;
  soundEnabled: boolean;
  accentColor: AccentColor;
  fontKanji: FontKanji;
  user: AppUser | null;
  userProfile: UserProfile | null;
  isLoggedIn: boolean;
  authStatus: "loading" | "ready" | "error";
  setAuthStatus: (status: "loading" | "ready" | "error") => void;
  setSettingsOpen: (open: boolean) => void;
  setActivePage: (page: string) => void;
  setLoginModalOpen: (open: boolean) => void;
  setLanguage: (lang: Language) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleSound: () => void;
  setAccentColor: (color: AccentColor) => void;
  setFontKanji: (font: FontKanji) => void;
  setUser: (user: AppUser | null) => void;
  setLoggedIn: (value: boolean) => void;
}

export const useAppStore = create<AppState>()(persist((set) => ({
  settingsOpen: false, activePage: "/kanji", loginModalOpen: false,
  language: "vi", theme: "light", soundEnabled: true, accentColor: "blue", fontKanji: "Noto Sans JP",
  user: null, userProfile: null, isLoggedIn: false,
  authStatus: "loading",
  setAuthStatus: (authStatus) => set({ authStatus }),
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
  setActivePage: (activePage) => set({ activePage }),
  setLoginModalOpen: (loginModalOpen) => set({ loginModalOpen }),
  setLanguage: (language) => set({ language }), setTheme: (theme) => set({ theme }),
  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
  setAccentColor: (accentColor) => set({ accentColor }), setFontKanji: (fontKanji) => set({ fontKanji }),
  setUser: (user) => {
    void queryClient.cancelQueries({ queryKey: ["vocabulary"] });
    queryClient.removeQueries({ queryKey: ["vocabulary"] });
    set({
    user,
    authStatus: "ready",
    isLoggedIn: Boolean(user),
    userProfile: user ? { id: user.id, name: user.displayName, email: user.email, avatar_url: user.avatarUrl } : null,
    });
  },
  setLoggedIn: (isLoggedIn) => set({ isLoggedIn }),
}), {
  name: "nhai-kanji-prefs",
  partialize: (state) => ({ language: state.language, theme: state.theme, soundEnabled: state.soundEnabled, accentColor: state.accentColor, fontKanji: state.fontKanji }),
}));
