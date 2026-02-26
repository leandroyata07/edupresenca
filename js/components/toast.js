// =========================================================
// EduPresença – <app-toast> Web Component
// =========================================================

class AppToast extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._toasts = [];
    }

    connectedCallback() {
        this.shadowRoot.innerHTML = `
      <style>
        :host {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 10px;
          pointer-events: none;
          font-family: var(--font-sans, 'Inter', sans-serif);
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .toast {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 14px 16px;
          background: var(--bg-surface, #12121f);
          border: 1px solid var(--border-color, rgba(255,255,255,0.08));
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
          min-width: 300px;
          max-width: 400px;
          pointer-events: all;
          animation: toastIn 0.35s cubic-bezier(0.4,0,0.2,1) forwards;
          overflow: hidden;
          position: relative;
        }
        .toast.out { animation: toastOut 0.3s ease forwards; }

        @keyframes toastIn {
          from { opacity: 0; transform: translateX(calc(100% + 24px)); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes toastOut {
          from { opacity: 1; transform: translateX(0); max-height: 200px; margin-top: 0; }
          to   { opacity: 0; transform: translateX(calc(100% + 24px)); max-height: 0; padding: 0; margin: 0; }
        }

        .toast-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .toast.success .toast-icon { background: rgba(16,185,129,0.15); color: #34d399; }
        .toast.error .toast-icon   { background: rgba(239,68,68,0.15);  color: #f87171; }
        .toast.warning .toast-icon { background: rgba(245,158,11,0.15); color: #fbbf24; }
        .toast.info .toast-icon    { background: rgba(14,165,233,0.15); color: #38bdf8; }

        .toast-content { flex: 1; min-width: 0; padding-top: 2px; }
        .toast-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary, #f1f5f9);
          line-height: 1.3;
        }
        .toast-message {
          font-size: 12px;
          color: var(--text-secondary, #94a3b8);
          margin-top: 2px;
          line-height: 1.4;
        }

        .toast-close {
          width: 24px;
          height: 24px;
          border: none;
          background: none;
          cursor: pointer;
          color: var(--text-tertiary, #64748b);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          flex-shrink: 0;
          transition: all 0.15s ease;
        }
        .toast-close:hover { background: rgba(255,255,255,0.06); color: var(--text-primary, #f1f5f9); }

        .toast-action {
          display: inline-flex;
          align-items: center;
          margin-top: 7px;
          padding: 4px 12px;
          border-radius: 6px;
          border: 1px solid rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.07);
          color: var(--text-primary, #f1f5f9);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.15s;
        }
        .toast-action:hover { background: rgba(255,255,255,0.14); }

        .toast-progress {
          position: absolute;
          bottom: 0; left: 0;
          height: 3px;
          background: currentColor;
          opacity: 0.3;
          border-radius: 0 0 0 12px;
          animation: progress linear forwards;
        }
        .toast.success { color: #34d399; }
        .toast.error   { color: #f87171; }
        .toast.warning { color: #fbbf24; }
        .toast.info    { color: #38bdf8; }

        @keyframes progress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      </style>
      <div id="container"></div>
    `;

        // Make globally accessible
        window.toast = this;
    }

    show({ type = 'info', title, message, duration = 4000 }) {
        const container = this.shadowRoot.getElementById('container');
        const id = Math.random().toString(36).slice(2);

        const icons = {
            success: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
            error: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
            warning: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
            info: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
        };

        const el = document.createElement('div');
        el.className = `toast ${type}`;
        el.id = `toast-${id}`;
        el.innerHTML = `
      <div class="toast-icon">${icons[type] || icons.info}</div>
      <div class="toast-content">
        ${title ? `<div class="toast-title">${title}</div>` : ''}
        ${message ? `<div class="toast-message">${message}</div>` : ''}
      </div>
      <button class="toast-close" aria-label="Fechar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
      <div class="toast-progress" style="animation-duration: ${duration}ms"></div>
    `;

        el.querySelector('.toast-close').addEventListener('click', () => this._remove(id));
        container.appendChild(el);

        const timer = setTimeout(() => this._remove(id), duration);
        this._toasts.push({ id, el, timer });

        return id;
    }

    success(title, message) { return this.show({ type: 'success', title, message }); }
    error(title, message) { return this.show({ type: 'error', title, message }); }
    warning(title, message) { return this.show({ type: 'warning', title, message }); }
    info(title, message) { return this.show({ type: 'info', title, message }); }

    /** Show toast with an action button (e.g. "Desfazer") */
    showWithAction({ type = 'warning', title, message, duration = 5000, actionLabel = 'Desfazer', onAction }) {
        const container = this.shadowRoot.getElementById('container');
        const id = Math.random().toString(36).slice(2);

        const icons = {
            success: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`,
            error: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
            warning: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
            info: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
        };

        const el = document.createElement('div');
        el.className = `toast ${type}`;
        el.id = `toast-${id}`;
        el.innerHTML = `
      <div class="toast-icon">${icons[type] || icons.info}</div>
      <div class="toast-content">
        ${title ? `<div class="toast-title">${title}</div>` : ''}
        ${message ? `<div class="toast-message">${message}</div>` : ''}
        <button class="toast-action" id="toast-action-${id}">${actionLabel}</button>
      </div>
      <button class="toast-close" aria-label="Fechar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
      <div class="toast-progress" style="animation-duration: ${duration}ms"></div>
    `;

        el.querySelector('.toast-close').addEventListener('click', () => this._remove(id));
        el.querySelector(`#toast-action-${id}`).addEventListener('click', () => {
            onAction?.();
            this._remove(id);
        });
        container.appendChild(el);

        const timer = setTimeout(() => this._remove(id), duration);
        this._toasts.push({ id, el, timer });
        return id;
    }

    /** Dismiss a toast by its id before it auto-closes */
    dismiss(id) { if (id) this._remove(id); }

    _remove(id) {
        const entry = this._toasts.find(t => t.id === id);
        if (!entry) return;
        clearTimeout(entry.timer);
        entry.el.classList.add('out');
        entry.el.addEventListener('animationend', () => entry.el.remove(), { once: true });
        this._toasts = this._toasts.filter(t => t.id !== id);
    }
}

customElements.define('app-toast', AppToast);
