(function initThemeSystem() {
  const STORAGE_KEY = 'app-theme';
  const root = document.documentElement;

  function readStoredTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  function writeStoredTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Ignora ambientes sem acesso ao storage
    }
  }

  function getPreferredTheme() {
    const stored = readStoredTheme();
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.setAttribute('content', theme === 'dark' ? '#0a1322' : '#f5f7fb');
    }
  }

  function getCurrentTheme() {
    return root.getAttribute('data-theme') || getPreferredTheme();
  }

  function getNextTheme(currentTheme) {
    return currentTheme === 'dark' ? 'light' : 'dark';
  }

  function labelByTheme(theme) {
    return theme === 'dark' ? 'Escuro' : 'Claro';
  }

  function iconByTheme(theme) {
    return theme === 'dark' ? 'moon' : 'sun';
  }

  function updateToggleButtons(theme) {
    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
      const label = labelByTheme(theme);
      const nextTheme = getNextTheme(theme);
      const nextLabel = labelByTheme(nextTheme).toLowerCase();

      button.setAttribute('aria-label', `Tema ${label}. Toque para usar modo ${nextLabel}`);
      button.setAttribute('title', `Tema: ${label}`);

      const labelElement = button.querySelector('[data-theme-label]');
      if (labelElement) {
        labelElement.textContent = label;
      }

      button.setAttribute('data-theme-icon', iconByTheme(theme));
      button.setAttribute('data-theme-current', theme);
    });
  }

  function toggleTheme() {
    const current = getCurrentTheme();
    const next = getNextTheme(current);
    writeStoredTheme(next);
    applyTheme(next);
    updateToggleButtons(next);
  }

  function bindToggleButtons() {
    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
      if (button.dataset.themeBound === 'true') {
        return;
      }

      button.dataset.themeBound = 'true';
      button.addEventListener('click', toggleTheme);
    });

    updateToggleButtons(getCurrentTheme());
  }

  applyTheme(getPreferredTheme());

  document.addEventListener('DOMContentLoaded', bindToggleButtons);

  const media = window.matchMedia('(prefers-color-scheme: dark)');
  if (typeof media.addEventListener === 'function') {
    media.addEventListener('change', () => {
      if (readStoredTheme()) {
        return;
      }

      const theme = getPreferredTheme();
      applyTheme(theme);
      updateToggleButtons(theme);
    });
  }
})();
