import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark';

const THEME_KEY = 'app-financeiro-theme';

function applyTheme(theme: ThemeMode) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.setAttribute('data-theme', theme);
}

function resolveInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const stored = window.localStorage.getItem(THEME_KEY);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }

  return 'light';
}

interface UIStore {
  theme: ThemeMode;
  initialized: boolean;
  initTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

export const useUIStore = create<UIStore>((set, get) => ({
  theme: 'light',
  initialized: false,

  initTheme: () => {
    if (get().initialized) {
      applyTheme(get().theme);
      return;
    }

    const theme = resolveInitialTheme();
    applyTheme(theme);
    set({ theme, initialized: true });
  },

  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_KEY, theme);
    }

    applyTheme(theme);
    set({ theme, initialized: true });
  },

  toggleTheme: () => {
    const nextTheme: ThemeMode = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(nextTheme);
  },
}));
