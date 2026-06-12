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
    this._setupNotifications();
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
      avatar.onclick = () => {
        showAvatarLightbox(user.foto, user.nome);
      };
    } else {
      avatar.textContent = initials;
      avatar.style.background = `linear-gradient(135deg, hsl(${hue},65%,45%), hsl(${hue + 30},65%,35%))`;
      avatar.onclick = null;
    }
    avatar.title = user.nome;
  }

  _setupTheme() {
    const themeBtn = this.shadowRoot.getElementById('theme-btn');
    const root = document.documentElement;
    const saved = localStorage.getItem('edu_theme') || 'light';
    root.setAttribute('data-theme', saved);
    this._updateThemeIcon(saved);

    themeBtn?.addEventListener('click', () => {
      const current = root.getAttribute('data-theme') || 'edupresenca';
      let next = 'dark';
      if (current === 'dark') {
        next = 'edupresenca';
      } else if (current === 'edupresenca') {
        next = 'light';
      } else {
        next = 'dark';
      }
      root.setAttribute('data-theme', next);
      localStorage.setItem('edu_theme', next);
      this._updateThemeIcon(next);
      window.dispatchEvent(new CustomEvent('edu-theme-changed', { detail: next }));
    });
  }

  _updateThemeIcon(theme) {
    const btn = this.shadowRoot.getElementById('theme-btn');
    if (!btn) return;
    if (theme === 'light') {
      btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
      btn.title = 'Alternar Tema (Modo Escuro)';
    } else if (theme === 'dark') {
      btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #FFD966;"><path d="M22 10v6M2 10l10-5 10 5-10 5-10-5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`;
      btn.title = 'Alternar Tema (EduPresença)';
    } else { // edupresenca
      btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
      btn.title = 'Alternar Tema (Modo Claro)';
    }
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
          cursor: pointer;
          transition: all 0.15s ease;
          padding: 6px 10px;
          border-radius: 8px;
        }
        .header-date:hover {
          color: var(--text-primary, #f1f5f9);
          background: var(--bg-hover, rgba(255,255,255,0.04));
        }
        @media (max-width: 640px) { .header-date { display: none; } }

        /* Avatar */
        .avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          color: white;
          cursor: pointer;
          flex-shrink: 0;
          transition: transform 0.15s ease;
          border: 2px solid rgba(99,102,241,0.3);
        }
        .avatar:hover { transform: scale(1.05); }

        /* Badge de Notificação */
        .notification-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          background: #ef4444;
          color: #ffffff;
          font-size: 10px;
          font-weight: 700;
          height: 16px;
          min-width: 16px;
          padding: 0 4px;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1.5px solid var(--header-bg, #0a0a14);
          pointer-events: none;
        }

        /* Dropdown Popover */
        .notification-dropdown {
          position: absolute;
          top: calc(100% + 12px);
          right: -80px;
          width: 360px;
          max-height: 480px;
          background: var(--bg-surface, #12121f);
          border: 1px solid var(--border-color, rgba(255,255,255,0.08));
          border-radius: 16px;
          box-shadow: 0 16px 48px rgba(0,0,0,0.4);
          display: flex;
          flex-direction: column;
          z-index: 1000;
          opacity: 0;
          transform: translateY(-10px) scale(0.95);
          pointer-events: none;
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
        }

        .notification-dropdown.open {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: all;
        }

        @media (max-width: 480px) {
          .notification-dropdown {
            width: 290px;
            right: -60px;
          }
        }

        /* Header do Dropdown */
        .dropdown-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.08));
        }

        .dropdown-header h3 {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary, #f1f5f9);
          margin: 0;
        }

        .clear-btn {
          background: none;
          border: none;
          color: var(--text-secondary, #94a3b8);
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: color 0.15s ease;
          padding: 4px 8px;
          border-radius: 6px;
        }
        .clear-btn:hover {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.08);
        }

        /* Corpo do Dropdown */
        .dropdown-body {
          flex: 1;
          overflow-y: auto;
          max-height: 400px;
        }

        /* Item de Notificação */
        .notification-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.04));
          transition: background 0.15s ease;
          cursor: default;
        }
        .notification-item:hover {
          background: var(--bg-hover, rgba(255,255,255,0.02));
        }

        .notification-item.unread {
          background: rgba(99, 102, 241, 0.03);
          border-left: 3px solid var(--primary-color, #6366f1);
          padding-left: 13px; /* Compensate border */
        }

        /* Ícones por tipo */
        .item-icon {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .notification-item.success .item-icon { background: rgba(16,185,129,0.12); color: #34d399; }
        .notification-item.error .item-icon   { background: rgba(239,68,68,0.12);  color: #f87171; }
        .notification-item.warning .item-icon { background: rgba(245,158,11,0.12); color: #fbbf24; }
        .notification-item.info .item-icon    { background: rgba(14,165,233,0.12); color: #38bdf8; }

        .item-content {
          flex: 1;
          min-width: 0;
        }

        .item-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary, #f1f5f9);
          line-height: 1.3;
        }

        .item-message {
          font-size: 12px;
          color: var(--text-secondary, #94a3b8);
          margin-top: 2px;
          line-height: 1.4;
          word-break: break-word;
        }

        .item-time {
          font-size: 10px;
          color: var(--text-tertiary, #64748b);
          margin-top: 4px;
          display: block;
        }

        /* Estado Vazio */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          color: var(--text-tertiary, #64748b);
          gap: 12px;
          text-align: center;
        }

        .empty-state svg {
          color: var(--text-tertiary, #64748b);
          opacity: 0.6;
        }

        .empty-state span {
          font-size: 13px;
          font-weight: 500;
        }

        /* Scrollbar customizada para o corpo do dropdown */
        .dropdown-body::-webkit-scrollbar {
          width: 6px;
        }
        .dropdown-body::-webkit-scrollbar-track {
          background: transparent;
        }
        .dropdown-body::-webkit-scrollbar-thumb {
          background: var(--border-color, rgba(255,255,255,0.08));
          border-radius: 3px;
        }
        .dropdown-body::-webkit-scrollbar-thumb:hover {
          background: var(--text-tertiary, #64748b);
        }
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

        <!-- Central de Notificações -->
        <div class="notification-container" style="position: relative; display: flex; align-items: center;">
          <button class="header-btn" id="notification-btn" title="Notificações" aria-label="Notificações" style="position: relative;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <span class="notification-badge" id="notification-badge" style="display: none;">0</span>
          </button>

          <!-- Dropdown/Popover de Notificações -->
          <div class="notification-dropdown" id="notification-dropdown">
            <div class="dropdown-header">
              <h3>Notificações</h3>
              <button id="clear-all-notifications" class="clear-btn">Limpar tudo</button>
            </div>
            <div class="dropdown-body" id="notification-list">
              <!-- Rendered via JS -->
            </div>
          </div>
        </div>

        <!-- Divider -->
        <div class="divider"></div>

        <!-- Avatar -->
        <div class="avatar" id="header-avatar" role="img" aria-label="Usuário" title="Usuário"></div>

        <!-- Settings Gear Button -->
        <button class="header-btn" id="header-settings-btn" title="Configurações do Sistema" aria-label="Configurações do Sistema">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </div>
    `;

    // Date
    const dateEl = this.shadowRoot.getElementById('header-date-text');
    if (dateEl) {
      dateEl.textContent = new Date().toLocaleDateString('pt-BR', {
        weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
      });
    }

    // Date click navigation to holidays/calendar
    const dateElWrap = this.shadowRoot.querySelector('.header-date');
    dateElWrap?.addEventListener('click', () => {
      window.app = window.app || {};
      window.app.configDefaultTab = 'feriados';
      window.app?.router?.push('/configuracoes');
    });

    // Settings button click navigation
    const settingsBtn = this.shadowRoot.getElementById('header-settings-btn');
    settingsBtn?.addEventListener('click', () => {
      window.app = window.app || {};
      window.app?.router?.push('/configuracoes');
    });

    // Mobile menu toggle
    const menuBtn = this.shadowRoot.getElementById('menu-btn');
    menuBtn?.addEventListener('click', () => {
      const sidebar = document.querySelector('app-sidebar');
      const isOpen = sidebar?.classList.contains('open');
      if (isOpen) sidebar.close?.();
      else sidebar.open?.();
    });
  }

  _setupNotifications() {
    const btn = this.shadowRoot.getElementById('notification-btn');
    const dropdown = this.shadowRoot.getElementById('notification-dropdown');
    const clearBtn = this.shadowRoot.getElementById('clear-all-notifications');

    if (!btn || !dropdown) return;

    // Toggle dropdown
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdown.classList.contains('open');
      if (isOpen) {
        this._closeNotifications();
      } else {
        this._openNotifications();
      }
    });

    // Clear all
    clearBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      try {
        localStorage.setItem('edu_notifications_list', JSON.stringify([]));
        this._updateNotifications();
      } catch (err) {
        console.error(err);
      }
    });

    // Event listener for updates
    this._onNotificationAdded = () => this._updateNotifications();
    window.addEventListener('edu-notification-added', this._onNotificationAdded);

    // Initial update
    this._updateNotifications();

    // Close on click outside
    this._onClickOutside = (e) => {
      const path = e.composedPath();
      if (!path.includes(btn) && !path.includes(dropdown)) {
        this._closeNotifications();
      }
    };
    document.addEventListener('click', this._onClickOutside);

    // Close on Escape
    this._onKeyDown = (e) => {
      if (e.key === 'Escape') {
        this._closeNotifications();
      }
    };
    document.addEventListener('keydown', this._onKeyDown);
  }

  _openNotifications() {
    const dropdown = this.shadowRoot.getElementById('notification-dropdown');
    if (!dropdown) return;
    dropdown.classList.add('open');
    this._markAllAsRead();
  }

  _closeNotifications() {
    const dropdown = this.shadowRoot.getElementById('notification-dropdown');
    if (!dropdown) return;
    dropdown.classList.remove('open');
  }

  _markAllAsRead() {
    try {
      const listStr = localStorage.getItem('edu_notifications_list');
      if (!listStr) return;
      const list = JSON.parse(listStr);
      let updated = false;
      list.forEach(n => {
        if (!n.read) {
          n.read = true;
          updated = true;
        }
      });
      if (updated) {
        localStorage.setItem('edu_notifications_list', JSON.stringify(list));
        this._updateNotifications();
      }
    } catch (e) {
      console.error('Erro ao marcar notificações como lidas:', e);
    }
  }

  _timeAgo(timestampStr) {
    try {
      const date = new Date(timestampStr);
      const now = new Date();
      const seconds = Math.floor((now - date) / 1000);
      
      if (seconds < 0) return 'agora mesmo';
      if (seconds < 60) return 'há alguns segundos';
      
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) {
        return minutes === 1 ? 'há 1 minuto' : `há ${minutes} minutos`;
      }
      
      const hours = Math.floor(minutes / 60);
      if (hours < 24) {
        return hours === 1 ? 'há 1 hora' : `há ${hours} horas`;
      }
      
      const days = Math.floor(hours / 24);
      if (days < 7) {
        return days === 1 ? 'ontem' : `há ${days} dias`;
      }
      
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    } catch (e) {
      return '';
    }
  }

  _updateNotifications() {
    try {
      const badge = this.shadowRoot.getElementById('notification-badge');
      const listEl = this.shadowRoot.getElementById('notification-list');
      if (!badge || !listEl) return;

      const listStr = localStorage.getItem('edu_notifications_list');
      const list = listStr ? JSON.parse(listStr) : [];

      // Unread count
      const unreadCount = list.filter(n => !n.read).length;
      if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }

      // Render list
      if (list.length === 0) {
        listEl.innerHTML = `
          <div class="empty-state">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <span>Nenhuma notificação por enquanto</span>
          </div>
        `;
      } else {
        const icons = {
          success: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
          error: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
          warning: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
          info: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
        };

        listEl.innerHTML = list.map(n => {
          const itemClass = `notification-item ${n.type} ${n.read ? '' : 'unread'}`;
          const iconMarkup = icons[n.type] || icons.info;
          return `
            <div class="${itemClass}">
              <div class="item-icon">${iconMarkup}</div>
              <div class="item-content">
                ${n.title ? `<div class="item-title">${n.title}</div>` : ''}
                ${n.message ? `<div class="item-message">${n.message}</div>` : ''}
                <span class="item-time">${this._timeAgo(n.timestamp)}</span>
              </div>
            </div>
          `;
        }).join('');
      }
    } catch (e) {
      console.error('Erro ao atualizar notificações no cabeçalho:', e);
    }
  }

  disconnectedCallback() {
    if (this._onNotificationAdded) {
      window.removeEventListener('edu-notification-added', this._onNotificationAdded);
    }
    if (this._onClickOutside) {
      document.removeEventListener('click', this._onClickOutside);
    }
    if (this._onKeyDown) {
      document.removeEventListener('keydown', this._onKeyDown);
    }
  }
}

customElements.define('app-header', AppHeader);

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
