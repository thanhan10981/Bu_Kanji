import { create } from "zustand";
import { persist } from "zustand/middleware";

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

interface AppState {
  // UI State
  settingsOpen: boolean;
  activePage: string;

  // Preferences
  language: Language;
  theme: ThemeMode;
  soundEnabled: boolean;
  accentColor: AccentColor;
  fontKanji: FontKanji;

  // Auth (mock)
  isLoggedIn: boolean;

  // Actions
  setSettingsOpen: (open: boolean) => void;
  setActivePage: (page: string) => void;
  setLanguage: (lang: Language) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleSound: () => void;
  setAccentColor: (color: AccentColor) => void;
  setFontKanji: (font: FontKanji) => void;
  setLoggedIn: (v: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      settingsOpen: false,
      activePage: "/kanji",
      language: "vi",
      theme: "light",
      soundEnabled: true,
      accentColor: "blue",
      fontKanji: "Noto Sans JP",
      isLoggedIn: false,

      setSettingsOpen: (open) => set({ settingsOpen: open }),
      setActivePage: (page) => set({ activePage: page }),
      setLanguage: (language) => set({ language }),
      setTheme: (theme) => set({ theme }),
      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
      setAccentColor: (accentColor) => set({ accentColor }),
      setFontKanji: (fontKanji) => set({ fontKanji }),
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
