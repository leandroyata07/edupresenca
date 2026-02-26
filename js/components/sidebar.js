// =========================================================
// EduPresença – <app-sidebar> Web Component
// =========================================================

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: dashboardIcon() },
  { path: '/alunos', label: 'Alunos', icon: alunosIcon() },
  { path: '/turmas', label: 'Turmas', icon: turmasIcon() },
  { path: '/cursos', label: 'Cursos', icon: cursosIcon() },
  { path: '/disciplinas', label: 'Disciplinas', icon: disciplinasIcon() },
  { path: '/unidades', label: 'Unidades', icon: unidadesIcon() },
  { path: '/turnos', label: 'Turnos', icon: turnosIcon() },
  { path: '/presenca', label: 'Presença', icon: presencaIcon() },
  { path: '/notas', label: 'Notas', icon: notasIcon() },
  { path: '/relatorios', label: 'Relatórios', icon: relatoriosIcon() },
  { path: '/configuracoes', label: 'Configurações', icon: configIcon(), separator: true },
  { path: '/informacoes', label: 'Informações', icon: infoIcon() },
];

class AppSidebar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._active = '/';
  }

  connectedCallback() {
    this.render();
    this._setupOverlayClose();
  }

  setActive(path) {
    this._active = path;
    const links = this.shadowRoot.querySelectorAll('.nav-link');
    links.forEach(link => {
      const href = link.dataset.href;
      const isActive = href === '/'
        ? path === '/'
        : path === href || path.startsWith(href + '/');
      link.classList.toggle('active', isActive);
    });
  }

  setBadge(path, count) {
    const link = this.shadowRoot.querySelector(`[data-href="${path}"]`);
    if (!link) return;
    let badge = link.querySelector('.nav-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'nav-badge';
      link.appendChild(badge);
    }
    if (count && count > 0) {
      badge.textContent = count > 99 ? '99+' : String(count);
      badge.hidden = false;
    } else {
      badge.hidden = true;
    }
  }

  setUser(user) {
    this._user = user;
    const widget = this.shadowRoot.getElementById('user-widget');
    if (!widget || !user) return;
    const hue = (user.nome || 'A').charCodeAt(0) * 15 % 360;
    const initials = user.nome.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
    const roleLabels = { admin: 'Administrador', professor: 'Professor', secretaria: 'Secretaria', coordenador: 'Coordenador' };
    widget.innerHTML = `
          <div class="user-avatar" style="background:hsl(${hue},65%,45%)">${initials}</div>
          <div class="user-info">
            <div class="user-name">${user.nome}</div>
            <div class="user-role">${roleLabels[user.role] || user.role}</div>
          </div>
          <button class="logout-btn" id="logout-btn" title="Sair">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>`;
    this.shadowRoot.getElementById('logout-btn')?.addEventListener('click', () => {
      window.app?.logout?.();
    });
  }

  _setupOverlayClose() {
    const overlay = document.getElementById('sidebar-overlay');
    overlay?.addEventListener('click', () => this.close());
  }

  close() {
    this.classList.remove('open');
    document.getElementById('sidebar-overlay')?.classList.remove('active');
    document.body.style.overflow = '';
  }

  open() {
    this.classList.add('open');
    document.getElementById('sidebar-overlay')?.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: flex;
          flex-direction: column;
          width: var(--sidebar-width, 260px);
          height: 100vh;
          background: var(--sidebar-bg, #0d0d1a);
          border-right: 1px solid var(--sidebar-border, rgba(255,255,255,0.06));
          overflow: hidden;
          font-family: var(--font-sans, 'Inter', sans-serif);
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .sidebar-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 20px 20px;
          border-bottom: 1px solid var(--sidebar-border, rgba(255,255,255,0.06));
          flex-shrink: 0;
        }
        .brand-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(79,70,229,0.4);
        }
        .brand-text { flex: 1; min-width: 0; }
        .brand-name {
          font-family: var(--font-display, 'Plus Jakarta Sans', sans-serif);
          font-size: 16px;
          font-weight: 800;
          color: var(--text-primary, #f1f5f9);
          line-height: 1.2;
        }
        .brand-subtitle {
          font-size: 11px;
          color: var(--text-tertiary, #64748b);
          margin-top: 1px;
        }

        .sidebar-nav {
          flex: 1;
          overflow-y: auto;
          padding: 12px 12px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .sidebar-nav::-webkit-scrollbar { width: 4px; }
        .sidebar-nav::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.08);
          border-radius: 9999px;
        }

        .nav-section-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-tertiary, #64748b);
          padding: 12px 8px 6px;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.15s ease;
          text-decoration: none;
          color: var(--text-secondary, #94a3b8);
          font-size: 13.5px;
          font-weight: 500;
          border: none;
          background: none;
          width: 100%;
          font-family: inherit;
        }
        .nav-link:hover {
          background: rgba(255,255,255,0.06);
          color: var(--text-primary, #f1f5f9);
        }
        .nav-link.active {
          background: rgba(99,102,241,0.18);
          color: #818cf8;
          font-weight: 600;
        }
        .nav-link.active .nav-icon { color: #818cf8; }

        .nav-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.04);
          color: var(--text-tertiary, #64748b);
          flex-shrink: 0;
          transition: all 0.15s ease;
        }
        .nav-link:hover .nav-icon { background: rgba(99,102,241,0.12); color: #818cf8; }
        .nav-link.active .nav-icon { background: rgba(99,102,241,0.2); }

        .nav-label { flex: 1; }

        .sidebar-footer {
          padding: 16px;
          border-top: 1px solid var(--sidebar-border, rgba(255,255,255,0.06));
          flex-shrink: 0;
        }
        .ano-letivo-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 10px;
          background: rgba(99,102,241,0.1);
          border: 1px solid rgba(99,102,241,0.2);
        }
        .ano-letivo-badge span:first-child {
          font-size: 11px;
          color: var(--text-tertiary, #64748b);
        }
        .ano-letivo-badge strong {
          font-size: 13px;
          color: #818cf8;
        }
        .version {
          font-size: 10px;
          color: var(--text-tertiary, #64748b);
          margin-top: 10px;
          text-align: center;
        }
        .nav-separator { height:1px;background:rgba(255,255,255,0.06);margin:8px 4px; }
        .nav-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          border-radius: 99px;
          background: #ef4444;
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          line-height: 1;
          margin-left: auto;
          flex-shrink: 0;
        }
        .user-widget {
          display:flex;align-items:center;gap:10px;
          padding:10px 12px;border-radius:10px;
          background:rgba(255,255,255,0.04);
          border:1px solid rgba(255,255,255,0.08);
          margin-bottom:10px;
          min-height:52px;
        }
        .user-avatar {
          width:36px;height:36px;border-radius:10px;
          display:flex;align-items:center;justify-content:center;
          font-size:13px;font-weight:700;color:#fff;flex-shrink:0;
        }
        .user-info { flex:1;min-width:0; }
        .user-name  { font-size:13px;font-weight:600;color:var(--text-primary,#f1f5f9);white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
        .user-role  { font-size:11px;color:var(--text-tertiary,#64748b);margin-top:1px; }
        .logout-btn {
          background:none;border:none;color:var(--text-tertiary,#64748b);
          cursor:pointer;padding:6px;border-radius:6px;flex-shrink:0;
          display:flex;align-items:center;transition:all 0.15s;
        }
        .logout-btn:hover { color:#f87171;background:rgba(239,68,68,0.1); }
      </style>

      <!-- Brand -->
      <div class="sidebar-header">
        <div class="brand-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
          </svg>
        </div>
        <div class="brand-text">
          <div class="brand-name">EduPresença</div>
          <div class="brand-subtitle">Gestão Escolar</div>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav" role="navigation" aria-label="Menu principal">
        <div class="nav-section-label">Menu</div>
        ${NAV_ITEMS.map(item => `
          ${item.separator ? '<div class="nav-separator"></div>' : ''}
          <button class="nav-link${this._active === item.path ? ' active' : ''}"
            data-href="${item.path}"
            data-link
            aria-label="${item.label}"
            role="link"
            aria-current="${this._active === item.path ? 'page' : 'false'}">
            <span class="nav-icon" aria-hidden="true">${item.icon}</span>
            <span class="nav-label">${item.label}</span>
          </button>
        `).join('')}
      </nav>

      <!-- Footer -->
      <div class="sidebar-footer">
        <!-- User widget -->
        <div class="user-widget" id="user-widget"></div>
        <div class="ano-letivo-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span>Ano Letivo</span>
          <strong id="ano-letivo-text">2025</strong>
        </div>
        <div class="version">v1.0.0 — EduPresença PWA</div>
      </div>
    `;

    // Handle nav link clicks via event delegation
    this.shadowRoot.addEventListener('click', (e) => {
      const link = e.target.closest('[data-link]');
      if (link) {
        e.preventDefault();
        const href = link.dataset.href;
        window.app?.router?.push(href);
        // Close on mobile
        if (window.innerWidth <= 900) this.close();
      }
    });
  }
}

customElements.define('app-sidebar', AppSidebar);

// ── SVG Icons ──────────────────────────────────────────
function dashboardIcon() { return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`; }
function alunosIcon() { return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`; }
function turmasIcon() { return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`; }
function cursosIcon() { return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`; }
function disciplinasIcon() { return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="10" y1="10" x2="16" y2="10"/><line x1="10" y1="14" x2="16" y2="14"/></svg>`; }
function unidadesIcon() { return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`; }
function turnosIcon() { return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`; }
function presencaIcon() { return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`; }
function notasIcon() { return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`; }
function relatoriosIcon() { return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`; }
function configIcon() { return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>`; }
function infoIcon() { return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`; }
