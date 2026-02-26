// =========================================================
// EduPresença – <app-header> Web Component
// =========================================================

class AppHeader extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._title = 'Dashboard';
  }

  connectedCallback() {
    this.render();
    this._setupTheme();
  }

  setTitle(title) {
    this._title = title;
    const el = this.shadowRoot.getElementById('page-title');
    if (el) el.textContent = title;
  }

  setUser(user) {
    const avatar = this.shadowRoot.getElementById('header-avatar');
    if (!avatar || !user) return;
    const initials = user.nome.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
    const hue = (user.nome || 'A').charCodeAt(0) * 15 % 360;
    if (user.foto) {
      avatar.innerHTML = `<img src="${user.foto}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block" alt="${initials}" />`;
      avatar.style.background = 'transparent';
    } else {
      avatar.textContent = initials;
      avatar.style.background = `linear-gradient(135deg, hsl(${hue},65%,45%), hsl(${hue + 30},65%,35%))`;
    }
    avatar.title = user.nome;
  }

  _setupTheme() {
    const themeBtn = this.shadowRoot.getElementById('theme-btn');
    const root = document.documentElement;
    const saved = localStorage.getItem('edu_theme') || 'dark';
    root.setAttribute('data-theme', saved);
    this._updateThemeIcon(saved);

    themeBtn?.addEventListener('click', () => {
      const current = root.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('edu_theme', next);
      this._updateThemeIcon(next);
    });
  }

  _updateThemeIcon(theme) {
    const btn = this.shadowRoot.getElementById('theme-btn');
    if (!btn) return;
    btn.innerHTML = theme === 'dark'
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
    btn.title = theme === 'dark' ? 'Modo claro' : 'Modo escuro';
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: flex;
          align-items: center;
          height: var(--header-height, 64px);
          padding: 0 24px;
          background: var(--header-bg, rgba(10,10,20,0.85));
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.08));
          gap: 16px;
          font-family: var(--font-sans, 'Inter', sans-serif);
          box-shadow: 0 1px 0 rgba(255,255,255,0.04);
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }

        /* Hamburger (mobile) */
        .menu-btn {
          display: none;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: none;
          border: none;
          color: var(--text-secondary, #94a3b8);
          cursor: pointer;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }
        .menu-btn:hover { background: var(--bg-hover, rgba(255,255,255,0.04)); color: var(--text-primary, #f1f5f9); }
        @media (max-width: 900px) { .menu-btn { display: flex; } }

        /* Page title */
        .page-title {
          font-family: var(--font-display, 'Plus Jakarta Sans', sans-serif);
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary, #f1f5f9);
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .header-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: none;
          border: none;
          color: var(--text-secondary, #94a3b8);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .header-btn:hover { background: var(--bg-hover, rgba(255,255,255,0.04)); color: var(--text-primary, #f1f5f9); }

        .divider { width: 1px; height: 24px; background: var(--border-color, rgba(255,255,255,0.08)); }

        /* Date display */
        .header-date {
          font-size: 12px;
          color: var(--text-tertiary, #64748b);
          display: flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        }
        @media (max-width: 640px) { .header-date { display: none; } }

        /* Avatar */
        .avatar {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          color: white;
          cursor: pointer;
          flex-shrink: 0;
          transition: transform 0.15s ease;
          border: 2px solid rgba(99,102,241,0.3);
        }
        .avatar:hover { transform: scale(1.05); }
      </style>

      <button class="menu-btn" id="menu-btn" aria-label="Abrir menu" aria-expanded="false">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      <span class="page-title" id="page-title">${this._title}</span>

      <div class="header-actions">
        <!-- Date -->
        <div class="header-date">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span id="header-date-text"></span>
        </div>

        <div class="divider"></div>

        <!-- Theme Toggle -->
        <button class="header-btn" id="theme-btn" title="Alternar tema" aria-label="Alternar tema">
          <!-- Icon injected by JS -->
        </button>

        <!-- Divider -->
        <div class="divider"></div>

        <!-- Avatar -->
        <div class="avatar" id="header-avatar" role="img" aria-label="Usuário" title="Usuário"></div>
      </div>
    `;

    // Date
    const dateEl = this.shadowRoot.getElementById('header-date-text');
    if (dateEl) {
      dateEl.textContent = new Date().toLocaleDateString('pt-BR', {
        weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
      });
    }

    // Mobile menu toggle
    const menuBtn = this.shadowRoot.getElementById('menu-btn');
    menuBtn?.addEventListener('click', () => {
      const sidebar = document.querySelector('app-sidebar');
      const isOpen = sidebar?.classList.contains('open');
      if (isOpen) sidebar.close?.();
      else sidebar.open?.();
    });
  }
}

customElements.define('app-header', AppHeader);
