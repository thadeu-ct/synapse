(() => {
  const THEME_KEY = 'synapse_theme';
  const NAV_SELECTOR = '[data-route]';

  initTheme();
  document.addEventListener('DOMContentLoaded', () => {
    bindThemeToggles();
    highlightNav();
  });

  function initTheme() {
    const stored = readThemePreference();
    const preferred = stored || (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    applyTheme(preferred);

    if (!stored && window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: light)');
      mq.addEventListener ? mq.addEventListener('change', handleMedia) : mq.addListener(handleMedia);
      function handleMedia(event) {
        applyTheme(event.matches ? 'light' : 'dark');
      }
    }

    window.__synapseSetTheme = (theme) => {
      const normalized = theme === 'light' ? 'light' : 'dark';
      applyTheme(normalized);
      try {
        localStorage.setItem(THEME_KEY, normalized);
      } catch (err) {
        console.warn('Não foi possível salvar tema.', err);
      }
    };
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  function readThemePreference() {
    try {
      const value = localStorage.getItem(THEME_KEY);
      if (value === 'light' || value === 'dark') return value;
    } catch {
      return null;
    }
    return null;
  }

  function bindThemeToggles() {
    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';
        window.__synapseSetTheme(next);
      });
    });
  }

  function highlightNav() {
    const currentPage = document.body?.dataset.page;
    document.querySelectorAll(NAV_SELECTOR).forEach((link) => {
      const isActive = link.dataset.route === currentPage;
      link.dataset.active = String(isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }
})();
