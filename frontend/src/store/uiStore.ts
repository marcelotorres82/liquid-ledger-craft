import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark';

const THEME_KEY = 'app-financeiro-theme';
const PRIVACY_KEY = 'app-financeiro-privacy';

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
  privacyMode: boolean;
  togglePrivacy: () => void;
}

export const useUIStore = create<UIStore>((set, get) => ({
  theme: 'light',
  initialized: false,
  privacyMode: typeof window !== 'undefined' && window.sessionStorage.getItem(PRIVACY_KEY) === '1',

  initTheme: () => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('privacy-mode', get().privacyMode);
    }
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
  togglePrivacy: () => {
    const next = !get().privacyMode;
    if (typeof window !== 'undefined') window.sessionStorage.setItem(PRIVACY_KEY, next ? '1' : '0');
    if (typeof document !== 'undefined') document.documentElement.classList.toggle('privacy-mode', next);
    set({ privacyMode: next });
  },
}));
