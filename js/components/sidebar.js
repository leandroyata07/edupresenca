// =========================================================
// EduPresença – <app-sidebar> Web Component
// =========================================================
import { getAnoLetivo, setAnoLetivo, forceSync, isSyncUser } from '../store.js';
import { showConfirm } from '../utils.js';

const NAV_ITEMS = [
  { 
    path: '/', 
    label: 'Dashboard', 
    icon: dashboardIcon(), 
    color: '#2563eb', 
    bg: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', 
    shadow: 'rgba(37, 99, 235, 0.4)' 
  },
  { 
    path: '/alunos', 
    label: 'Alunos', 
    icon: alunosIcon(), 
    color: '#059669', 
    bg: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', 
    shadow: 'rgba(5, 150, 105, 0.4)' 
  },
  { 
    path: '/professores', 
    label: 'Professores', 
    icon: professoresIcon(), 
    color: '#0284c7', 
    bg: 'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)', 
    shadow: 'rgba(2, 132, 199, 0.4)' 
  },
  { 
    path: '/turmas', 
    label: 'Turmas', 
    icon: turmasIcon(), 
    color: '#ea580c', 
    bg: 'linear-gradient(135deg, #f97316 0%, #c2410c 100%)', 
    shadow: 'rgba(234, 88, 12, 0.4)' 
  },
  { 
    path: '/cursos', 
    label: 'Cursos', 
    icon: cursosIcon(), 
    color: '#7c3aed', 
    bg: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', 
    shadow: 'rgba(139, 92, 246, 0.4)' 
  },
  { 
    path: '/disciplinas', 
    label: 'Disciplinas', 
    icon: disciplinasIcon(), 
    color: '#ec4899', 
    bg: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)', 
    shadow: 'rgba(236, 72, 153, 0.4)' 
  },
  { 
    path: '/unidades', 
    label: 'Unidades', 
    icon: unidadesIcon(), 
    color: '#14b8a6', 
    bg: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)', 
    shadow: 'rgba(20, 184, 166, 0.4)' 
  },
  { 
    path: '/turnos', 
    label: 'Turnos', 
    icon: turnosIcon(), 
    color: '#06b6d4', 
    bg: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', 
    shadow: 'rgba(6, 182, 212, 0.4)' 
  },
  { 
    path: '/presenca', 
    label: 'Presença', 
    icon: presencaIcon(), 
    color: '#f43f5e', 
    bg: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)', 
    shadow: 'rgba(244, 63, 94, 0.4)' 
  },
  { 
    path: '/notas', 
    label: 'Notas', 
    icon: notasIcon(), 
    color: '#eab308', 
    bg: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)', 
    shadow: 'rgba(234, 179, 8, 0.4)' 
  },
  { 
    path: '/relatorios', 
    label: 'Relatórios', 
    icon: relatoriosIcon(), 
    color: '#6366f1', 
    bg: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', 
    shadow: 'rgba(99, 102, 241, 0.4)' 
  },
  {
    path: '/horarios',
    label: 'Quadro de Horários',
    icon: horariosIcon(),
    color: '#a855f7',
    bg: 'linear-gradient(135deg, #c084fc 0%, #8b5cf6 100%)',
    shadow: 'rgba(139, 92, 246, 0.4)'
  }
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

  setBadge(path, count, customTitle) {
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
      badge.title = customTitle || (path === '/alunos' ? 'Alunos com frequência abaixo de 75%' : 'Itens pendentes');
      badge.hidden = false;
    } else {
      badge.hidden = true;
    }
  }

  setUser(user) {
    this._user = user;
    this.render();
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
    let userWidgetHtml = '';
    if (this._user) {
      const user = this._user;
      const hue = (user.nome || 'A').charCodeAt(0) * 15 % 360;
      const initials = user.nome.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
      const roleLabels = { admin: 'Administrador', professor: 'Professor', secretaria: 'Secretário(a)', coordenador: 'Coordenador' };
      const avatarHtml = user.foto
        ? `<img src="${user.foto}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;display:block" alt="${initials}" />`
        : initials;
      const avatarStyle = user.foto ? 'background:transparent' : `background:hsl(${hue},65%,45%)`;
      userWidgetHtml = `
          <div class="user-avatar" style="${avatarStyle}">${avatarHtml}</div>
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
    }

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: flex;
          flex-direction: column;
          width: var(--sidebar-width, 260px);
          height: 100vh;
          height: 100dvh;
          background: var(--sidebar-bg, #ffffff);
          border-right: 1px solid var(--sidebar-border, rgba(0, 0, 0, 0.06));
          overflow: hidden;
          font-family: var(--font-sans, 'Inter', sans-serif);
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .sidebar-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          border-bottom: 1px solid var(--sidebar-border, rgba(0, 0, 0, 0.06));
          flex-shrink: 0;
        }
        .brand-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: var(--gradient-primary, linear-gradient(135deg, #3b82f6 0%, #2563eb 100%));
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
        }
        .brand-text { flex: 1; min-width: 0; }
        .brand-name {
          font-family: var(--font-display, 'Plus Jakarta Sans', sans-serif);
          font-size: 16px;
          font-weight: 800;
          color: var(--text-primary, #0f172a);
          line-height: 1.2;
        }
        .brand-subtitle {
          font-size: 11px;
          color: var(--text-tertiary, #94a3b8);
          margin-top: 1px;
        }

        .sidebar-nav {
          flex: 1;
          overflow-y: auto;
          padding: 12px 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .sidebar-nav::-webkit-scrollbar { width: 4px; }
        .sidebar-nav::-webkit-scrollbar-thumb {
          background: var(--border-strong, rgba(0,0,0,0.08));
          border-radius: 9999px;
        }

        .nav-section-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-tertiary, #94a3b8);
          padding: 8px 12px 4px;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          text-decoration: none;
          color: var(--text-secondary, #475569);
          font-size: 13px;
          font-weight: 500;
          border: none;
          background: transparent;
          width: 100%;
          font-family: inherit;
          position: relative;
          transform: scale(0.98);
        }
        .nav-link:hover {
          color: var(--text-primary, #0f172a);
          background: var(--bg-hover, rgba(0, 0, 0, 0.03));
          transform: scale(1);
        }
        .nav-link.active {
          color: #ffffff;
          background: var(--nav-bg);
          box-shadow: 0 4px 12px var(--nav-shadow);
          font-weight: 600;
          transform: scale(1);
          opacity: 1;
        }
        
        .nav-icon {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-surface-2, #f1f5f9);
          color: var(--text-secondary, #475569);
          flex-shrink: 0;
          transition: all 0.2s ease;
        }
        /* Use the distinct brand color for inactive icons in all themes */
        .nav-link:not(.active) .nav-icon {
          color: var(--nav-theme-color);
        }
        .nav-icon svg {
          width: 16px;
          height: 16px;
          stroke: currentColor;
          stroke-width: 2.2px;
          transition: transform 0.2s ease;
        }
        .nav-link:hover .nav-icon {
          transform: scale(1.05);
        }
        .nav-link.active .nav-icon {
          background: rgba(255, 255, 255, 0.2);
          color: #ffffff;
        }
        .nav-link.active .nav-icon svg {
          stroke: #ffffff;
        }

        .nav-label { flex: 1; margin-right: 12px; }

        .sidebar-footer {
          padding: 12px;
          border-top: 1px solid var(--sidebar-border, rgba(0, 0, 0, 0.06));
          flex-shrink: 0;
        }
        .ano-letivo-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          border-radius: 10px;
          background: var(--primary-50, rgba(37,99,235,0.05));
          border: 1px solid var(--primary-100, rgba(37,99,235,0.12));
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          user-select: none;
          color: var(--primary-600, #2563eb);
        }
        .ano-letivo-badge:hover {
          background: var(--primary-100, rgba(37,99,235,0.12));
          border-color: var(--primary-200, rgba(37,99,235,0.25));
          box-shadow: 0 4px 12px rgba(37,99,235,0.08);
          transform: translateY(-1px);
        }
        .ano-letivo-badge:active {
          transform: translateY(0);
        }
        .ano-letivo-badge span:first-child {
          font-size: 11px;
          color: var(--text-secondary, #475569);
        }
        .ano-letivo-badge strong {
          font-size: 13px;
          color: var(--primary-600, #2563eb);
        }
        .version {
          font-size: 10px;
          color: var(--text-tertiary, #94a3b8);
          margin-top: 10px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        .update-link {
          background: none;
          border: none;
          color: var(--primary-500, #3b82f6);
          font-size: 10.5px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 6px;
          transition: all 0.15s ease;
          font-family: inherit;
        }
        .update-link:hover {
          background: var(--primary-50, rgba(37,99,235,0.05));
          color: var(--primary-600, #2563eb);
        }
        .nav-separator { height:1px;background:var(--border-color, rgba(0,0,0,0.06));margin:8px 4px; }
        .nav-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          border-radius: 99px;
          background: var(--nav-theme-color);
          color: #ffffff;
          font-size: 10px;
          font-weight: 800;
          line-height: 1;
          margin-left: auto;
          margin-right: 12px;
          flex-shrink: 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .nav-badge[hidden] {
          display: none;
        }
        .user-widget {
          display:flex;align-items:center;gap:10px;
          padding:8px 10px;border-radius:12px;
          background:var(--bg-surface-2, #f1f5f9);
          border:1px solid var(--border-color, rgba(0,0,0,0.06));
          margin-bottom:10px;
          min-height:48px;
        }
        .user-avatar {
          width:36px;height:36px;border-radius:10px;
          display:flex;align-items:center;justify-content:center;
          font-size:13px;font-weight:700;color:#fff;flex-shrink:0;
          transition: transform 0.15s ease;
        }
        .user-avatar:hover {
          transform: scale(1.05);
        }
        .user-info { flex:1;min-width:0; }
        .user-name  { font-size:13px;font-weight:600;color:var(--text-primary,#0f172a);white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
        .user-role  { font-size:11px;color:var(--text-tertiary,#94a3b8);margin-top:1px; }
        .logout-btn {
          background:none;border:none;color:var(--text-tertiary,#94a3b8);
          cursor:pointer;padding:6px;border-radius:6px;flex-shrink:0;
          display:flex;align-items:center;transition:all 0.15s;
        }
        .logout-btn:hover { color:var(--danger-500, #ef4444);background:rgba(239,68,68,0.05); }
      </style>

      <!-- Brand -->
      <div class="sidebar-header">
        <div class="brand-icon">
          <svg width="20" height="20" viewBox="0 0 512 512" fill="none">
            <defs>
              <linearGradient id="sb-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#818cf8"/>
                <stop offset="100%" stop-color="#c084fc"/>
              </linearGradient>
            </defs>
            <polygon points="256,120 400,185 256,250 112,185" fill="url(#sb-grad)"/>
            <polygon points="256,120 400,185 256,250 112,185" fill="none" stroke="white" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
            <rect x="184" y="286" width="144" height="78" rx="10" fill="url(#sb-grad)"/>
            <polyline points="210,328 246,364 302,295" fill="none" stroke="white" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>
            <line x1="400" y1="185" x2="400" y2="240" stroke="white" stroke-width="8" stroke-linecap="round"/>
            <circle cx="400" cy="252" r="16" fill="white"/>
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
        ${NAV_ITEMS.filter(item => {
          if (this._user?.role === 'admin') return true;
          // Items hidden for Teachers
          if (this._user?.role === 'professor') {
            const hiddenForTeachers = ['/unidades', '/turnos', '/cursos', '/logs'];
            if (hiddenForTeachers.includes(item.path)) return false;
          }
          // Logs is admin-only for everyone else
          if (item.path === '/logs') return false;
          return true;
        }).map(item => {
          let label = item.label;
          if (item.path === '/configuracoes' && this._user?.role !== 'admin') {
            label = 'Meu Perfil';
          }
          return `
            ${item.separator ? '<div class="nav-separator"></div>' : ''}
            <button class="nav-link${this._active === item.path ? ' active' : ''}"
              style="--nav-bg: ${item.bg}; --nav-theme-color: ${item.color}; --nav-shadow: ${item.shadow};"
              data-href="${item.path}"
              data-link
              aria-label="${label}"
              role="link"
              aria-current="${this._active === item.path ? 'page' : 'false'}">
              <span class="nav-icon" aria-hidden="true">${item.icon}</span>
              <span class="nav-label">${label}</span>
            </button>
          `;
        }).join('')}
      </nav>

      <!-- Footer -->
      <div class="sidebar-footer">
        <!-- User widget -->
        <div class="user-widget" id="user-widget">${userWidgetHtml}</div>
        <div class="ano-letivo-badge" id="btn-ano-letivo" title="Clique para alterar o Ano Letivo ativo">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span>Ano Letivo</span>
          <strong id="ano-letivo-text">${getAnoLetivo()}</strong>
        </div>
        <div class="version">
          <div>v1.0.2 — EduPresença PWA</div>
          <button id="btn-instalar-app" class="update-link" title="Instalar EduPresença no dispositivo" style="color: var(--primary-400, #818cf8);">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Instalar Aplicativo
          </button>
          <button id="btn-atualizar-app" class="update-link" title="Clique para limpar o cache e atualizar o sistema">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
            Forçar Atualização
          </button>
        </div>
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

    this.shadowRoot.getElementById('logout-btn')?.addEventListener('click', () => {
      window.app?.logout?.();
    });

    this.shadowRoot.getElementById('btn-instalar-app')?.addEventListener('click', () => {
      window.showInstallPwaModal?.(window.deferredInstall, () => {
        window.toast?.success('Instalado!', 'EduPresença foi instalado no seu dispositivo.');
        const b = document.getElementById('pwa-banner');
        if (b) b.style.display = 'none';
        window.deferredInstall = null;
      });
    });

    this.shadowRoot.getElementById('btn-ano-letivo')?.addEventListener('click', () => {
      let modal = document.querySelector('app-modal');
      if (!modal) {
        modal = document.createElement('app-modal');
        document.body.appendChild(modal);
      }
      const activeYear = getAnoLetivo();
      
      // Generate years dynamically from 2020 to Math.max(2025, currentYear + 1)
      const currentYear = new Date().getFullYear();
      const maxYear = Math.max(2025, currentYear + 1);
      const anos = [];
      for (let y = 2020; y <= maxYear; y++) {
          anos.push(String(y));
      }
      anos.reverse(); // Newest years on top

      const body = `
        <div style="display:flex; flex-direction:column; gap:16px; padding:8px 4px; font-family:var(--font-sans, 'Inter', sans-serif);">
          <p style="font-size:13.5px; color:var(--text-secondary, #94a3b8); margin:0; line-height:1.6;">
            Selecione o ano letivo desejado abaixo. Os dados de <strong>Turmas, Alunos, Chamadas e Notas</strong> serão carregados especificamente para a opção escolhida.
          </p>
          
          <div class="form-group" style="margin-top:4px;">
            <label class="form-label" style="font-size:11px; font-weight:600; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.05em; margin-bottom:8px; display:block;">Selecionar Ano Letivo</label>
            <select class="form-control" id="select-year-dropdown" style="height:44px; font-size:15px; font-weight:600; cursor:pointer;">
              ${anos.map(y => {
                const isActive = y === activeYear;
                return `
                  <option value="${y}" ${isActive ? 'selected' : ''}>
                    Ano Letivo ${y} ${isActive ? ' (Ano Ativo)' : ''}
                  </option>
                `;
              }).join('')}
            </select>
          </div>
        </div>
      `;

      const footer = `
        <button class="btn btn-ghost" id="m-year-cancel" style="cursor:pointer;">Cancelar</button>
        <button class="btn btn-primary" id="m-year-confirm" style="cursor:pointer;">Confirmar Alteração</button>
      `;

      modal.open({
        title: 'Selecionar Ano Letivo',
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
        body,
        footer,
        size: 'sm'
      });

      const modalShadow = modal.shadowRoot;
      
      modalShadow.getElementById('m-year-cancel')?.addEventListener('click', () => {
        modal.close();
      });

      modalShadow.getElementById('m-year-confirm')?.addEventListener('click', () => {
        const selectedYear = modalShadow.getElementById('select-year-dropdown').value;
        if (selectedYear === activeYear) {
          modal.close();
          return;
        }
        
        modal.close();
        window.toast?.info('Alterando ano...', `Carregando dados do Ano Letivo ${selectedYear}`);
        setTimeout(() => {
          setAnoLetivo(selectedYear);
          window.location.reload();
        }, 800);
      });
    });

    this.shadowRoot.getElementById('btn-atualizar-app')?.addEventListener('click', async () => {
      let modal = document.querySelector('app-modal');
      if (!modal) {
        modal = document.createElement('app-modal');
        document.body.appendChild(modal);
      }
      const confirmed = await showConfirm(modal, {
        title: 'Atualizar Sistema',
        message: '<span style="display:block; text-align:justify;">Deseja forçar a atualização do sistema? Isso baixará os dados mais recentes da nuvem, limpará o cache local e recarregará a página.</span>',
        confirmText: 'Sim, atualizar',
        cancelText: 'Cancelar',
        type: 'primary'
      });
      if (!confirmed) return;

      try {
        // 1. Se usuário tem sync ativo, baixa dados frescos da nuvem ANTES de recarregar
        if (isSyncUser() && typeof firebase !== 'undefined' && firebase.firestore) {
          window.toast?.info('Sincronizando...', 'Baixando dados atualizados da nuvem. Aguarde.');
          try {
            await forceSync();
            window.toast?.success('Dados atualizados!', 'Sincronização concluída. Recarregando...');
          } catch (syncErr) {
            console.warn('Falha na sincronização antes do reload:', syncErr);
            window.toast?.warning('Atenção', 'Não foi possível sincronizar com a nuvem, mas o sistema será atualizado mesmo assim.');
          }
          // Aguarda o toast ser visível antes de recarregar
          await new Promise(resolve => setTimeout(resolve, 1500));
        }

        // 2. Limpa o cache do Service Worker
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const registration of registrations) {
            await registration.unregister();
          }
        }
        if ('caches' in window) {
          const keys = await caches.keys();
          for (const key of keys) {
            await caches.delete(key);
          }
        }
        window.location.reload(true);
      } catch (err) {
        console.error('Erro ao atualizar:', err);
        window.location.reload();
      }
    });

    if (this._user && this._user.foto) {
      const avatar = this.shadowRoot.querySelector('.user-avatar');
      avatar?.addEventListener('click', () => {
        showAvatarLightbox(this._user.foto, this._user.nome);
      });
      if (avatar) avatar.style.cursor = 'pointer';
    }
  }
}

customElements.define('app-sidebar', AppSidebar);

// ── SVG Icons ──────────────────────────────────────────
function dashboardIcon() { return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`; }
function alunosIcon() { return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`; }
function professoresIcon() { return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><circle cx="12" cy="8" r="3"/><path d="M12 11c-2 0-3 1-3 3v1h6v-1c0-2-1-3-3-3z"/></svg>`; }
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
function logsIcon() { return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.7 8.38 8.38 0 0 1 3.8.9"/><polyline points="7 11 9 13 13 9"/><polyline points="16 5 16 11 22 11"/></svg>`; }
function horariosIcon() { return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`; }

function showAvatarLightbox(photoUrl, userName) {
  if (!photoUrl) return;
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(10, 10, 20, 0.75);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 999999;
    opacity: 0;
    transition: opacity 0.3s ease;
    cursor: zoom-out;
  `;
  
  const container = document.createElement('div');
  container.style.cssText = `
    position: relative;
    max-width: 512px;
    width: 90%;
    aspect-ratio: 1/1;
    border-radius: 24px;
    box-shadow: 0 30px 60px rgba(0,0,0,0.4);
    border: 1px solid rgba(255,255,255,0.1);
    background: #12121f;
    overflow: hidden;
    transform: scale(0.9);
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  `;
  
  container.innerHTML = `
    <img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover;display:block" alt="${userName}" />
    <div style="
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%);
      padding: 20px;
      color: #ffffff;
      font-family: 'Plus Jakarta Sans', sans-serif;
      text-align: center;
    ">
      <div style="font-weight: 700; font-size: 1.1rem;">${userName}</div>
      <div style="font-size: 0.8rem; color: rgba(255,255,255,0.6); margin-top: 4px;">Foto de Perfil</div>
    </div>
    <button style="
      position: absolute;
      top: 16px;
      right: 16px;
      background: rgba(255,255,255,0.15);
      backdrop-filter: blur(4px);
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
      color: #ffffff;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    ">✕</button>
  `;
  
  overlay.appendChild(container);
  document.body.appendChild(overlay);
  
  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
    container.style.transform = 'scale(1)';
  });
  
  const handleEsc = (e) => {
    if (e.key === 'Escape') {
      close();
    }
  };
  document.addEventListener('keydown', handleEsc);
  
  const close = () => {
    overlay.style.opacity = '0';
    container.style.transform = 'scale(0.9)';
    document.removeEventListener('keydown', handleEsc);
    setTimeout(() => overlay.remove(), 300);
  };
  
  overlay.addEventListener('click', close);
  container.querySelector('button').addEventListener('click', (e) => {
    e.stopPropagation();
    close();
  });
}

window.showAvatarLightbox = showAvatarLightbox;
