// =========================================================
// EduPresença – <app-modal> Web Component
// =========================================================

class AppModal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.isOpen = false;
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: none; }
        :host(.open) { display: block; }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── Backdrop ── */
        .backdrop {
          position: fixed; inset: 0;
          background: rgba(15, 23, 42, 0.35);
          backdrop-filter: blur(8px);
          z-index: 400;
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }

        /* ── Modal shell ── */
        .modal {
          background: var(--bg-surface, #ffffff);
          border: 1px solid var(--border-color, rgba(0,0,0,0.06));
          border-radius: 20px;
          width: 100%;
          max-width: var(--modal-max-width, 580px);
          max-height: 90vh;
          display: flex; flex-direction: column;
          box-shadow: var(--shadow-lg);
          animation: modalIn 0.28s cubic-bezier(0.4,0,0.2,1);
          font-family: var(--font-sans, 'Inter', sans-serif);
          overflow: hidden;
          color: var(--text-primary, #0f172a);
          font-size: 14px;
        }
        .modal.sm { max-width: 420px; }
        .modal.lg { max-width: 760px; }
        .modal.xl { max-width: 960px; }
        @keyframes modalIn {
          from { opacity:0; transform: scale(0.92) translateY(-16px); }
          to   { opacity:1; transform: scale(1) translateY(0); }
        }
        .modal.out { animation: modalOut 0.2s ease forwards; }
        @keyframes modalOut {
          from { opacity:1; transform: scale(1); }
          to   { opacity:0; transform: scale(0.95) translateY(8px); }
        }
        .modal.shake {
          animation: modalShake 0.35s ease;
        }
        @keyframes modalShake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-5px); }
          40%, 80% { transform: translateX(5px); }
        }

        /* ── Header ── */
        .modal-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border-color, rgba(0,0,0,0.06));
          flex-shrink: 0; gap: 12px;
        }
        .modal-title {
          font-family: var(--font-display,'Plus Jakarta Sans',sans-serif);
          font-size: 17px; font-weight: 700;
          color: var(--text-primary, #0f172a);
          display: flex; align-items: center; gap: 10px;
        }
        .modal-title-icon {
          width: 36px; height: 36px; border-radius: 10px;
          background: rgba(37, 99, 235, 0.1);
          display: flex; align-items: center; justify-content: center;
          color: var(--primary-500, #3b82f6); flex-shrink: 0;
        }
        .modal-close {
          width: 32px; height: 32px; border: none;
          background: var(--bg-surface-2, #f1f5f9); border-radius: 8px;
          cursor: pointer; color: var(--text-secondary,#475569);
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s; flex-shrink: 0;
        }
        .modal-close:hover { background: var(--bg-surface-3, #e2e8f0); color: var(--text-primary, #0f172a); }

        /* ── Body ── */
        .modal-body {
          flex: 1; overflow-y: auto; padding: 24px;
          scrollbar-width: thin;
          scrollbar-color: var(--neutral-300, #cbd5e1) transparent;
        }
        .modal-body::-webkit-scrollbar { width: 5px; }
        .modal-body::-webkit-scrollbar-thumb { background: var(--neutral-300, #cbd5e1); border-radius: 9999px; }

        /* ── Footer ── */
        .modal-footer {
          display: flex; align-items: center; justify-content: flex-end;
          gap: 10px; padding: 16px 24px;
          border-top: 1px solid var(--border-color, rgba(0,0,0,0.06));
          background: var(--bg-surface-2, #f1f5f9); flex-shrink: 0; flex-wrap: wrap;
        }

        /* =========================================================
           FORM STYLES — injected here because Shadow DOM isolates CSS
           ========================================================= */
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group.full-width { grid-column: 1 / -1; }
        .full-width { grid-column: 1 / -1; }

        .form-label {
          font-size: 11px; font-weight: 600;
          color: var(--text-secondary, #475569);
          letter-spacing: 0.04em; text-transform: uppercase;
        }
        .required { color: var(--danger-500, #ef4444); }

        .form-control {
          width: 100%; padding: 10px 14px;
          background: var(--bg-surface-2, #f1f5f9);
          border: 1.5px solid var(--border-color, rgba(0,0,0,0.06));
          border-radius: 10px;
          color: var(--text-primary, #0f172a);
          font-size: 14px; font-family: inherit;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
          appearance: none; -webkit-appearance: none;
          outline: none;
        }
        .form-control:focus {
          border-color: var(--primary-500, #3b82f6);
          background: var(--bg-surface, #ffffff);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }
        .form-control::placeholder { color: var(--text-tertiary, #94a3b8); }
        select.form-control {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23475569' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 36px; cursor: pointer;
        }
        select.form-control option { background: var(--bg-surface, #ffffff); color: var(--text-primary, #0f172a); }
        textarea.form-control { resize: vertical; min-height: 80px; }
        input[type=date].form-control,
        input[type=time].form-control { cursor: pointer; }
        input[type=number].form-control { -moz-appearance: textfield; }
        input[type=number].form-control::-webkit-outer-spin-button,
        input[type=number].form-control::-webkit-inner-spin-button { -webkit-appearance: none; }
        .form-help { font-size: 11px; color: var(--text-tertiary, #94a3b8); margin-top: 2px; }

        /* ── Alert box ── */
        .alert-danger {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 12px 16px; border-radius: 10px;
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.2);
          color: var(--danger-600, #dc2626); font-size: 13px; line-height: 1.5;
        }

        /* ── Buttons inside modals ── */
        .btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 9px 18px; border-radius: 10px;
          font-size: 13px; font-weight: 600;
          cursor: pointer; border: none; transition: all 0.18s; white-space: nowrap;
          font-family: inherit; text-decoration: none; position: relative; overflow: hidden;
        }
        .btn:active { transform: scale(0.97); }
        .btn-primary {
          background: var(--gradient-primary);
          color: #fff; box-shadow: 0 2px 8px rgba(37, 99, 235, 0.2);
        }
        .btn-primary:hover { box-shadow: 0 4px 16px rgba(37, 99, 235, 0.35); filter: brightness(1.05); }
        .btn-ghost {
          background: var(--bg-surface-2, #f1f5f9);
          color: var(--text-secondary,#475569);
          border: 1.5px solid var(--border-color, rgba(0,0,0,0.06));
        }
        .btn-ghost:hover { background: var(--bg-surface-3, #e2e8f0); color: var(--text-primary, #0f172a); }
        .btn-danger {
          background: linear-gradient(135deg,#dc2626,#b91c1c);
          color: #fff; box-shadow: 0 2px 8px rgba(220,38,38,0.2);
        }
        .btn-danger:hover { filter: brightness(1.05); }
        .btn-sm { padding: 7px 14px; font-size: 12px; border-radius: 8px; }

        /* ── Paragraph helper ── */
        p { margin: 0; line-height: 1.6; }
        strong { color: var(--text-primary,#0f172a); font-weight: 700; }

        /* ── Responsive ── */
        @media (max-width: 520px) {
          .form-grid { grid-template-columns: 1fr; }
          .modal { border-radius: 16px; }
        }
      </style>

      <div class="backdrop" id="backdrop">
        <div class="modal" id="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title-text">
          <div class="modal-header">
            <div class="modal-title">
              <div class="modal-title-icon" id="modal-icon">
                <svg width="18" height="18" viewBox="0 0 512 512" fill="none" stroke="currentColor" stroke-width="24" stroke-linecap="round" stroke-linejoin="round">
                  <polygon points="256,120 400,185 256,250 112,185" />
                  <rect x="184" y="286" width="144" height="78" rx="10" />
                  <polyline points="210,328 246,364 302,295" />
                  <line x1="400" y1="185" x2="400" y2="240" />
                  <circle cx="400" cy="252" r="16" fill="currentColor" />
                </svg>
              </div>
              <span id="modal-title-text">Modal</span>
            </div>
            <button class="modal-close" id="modal-close-btn" aria-label="Fechar modal">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body" id="modal-body"></div>
          <div class="modal-footer" id="modal-footer"></div>
        </div>
      </div>
    `;

    this.shadowRoot.getElementById('backdrop').addEventListener('click', (e) => {
      if (e.target.id === 'backdrop') {
        const hasForm = this.shadowRoot.getElementById('modal-body').querySelector('form');
        if (hasForm) {
          const modalEl = this.shadowRoot.getElementById('modal');
          modalEl.classList.remove('shake');
          void modalEl.offsetWidth; // Trigger reflow to restart animation
          modalEl.classList.add('shake');
          modalEl.addEventListener('animationend', () => modalEl.classList.remove('shake'), { once: true });
          return;
        }
        this.close();
      }
    });
    this.shadowRoot.getElementById('modal-close-btn').addEventListener('click', () => this.close());
    this._keyHandler = (e) => { if (e.key === 'Escape' && this.isOpen) this.close(); };
    document.addEventListener('keydown', this._keyHandler);
  }

  disconnectedCallback() {
    document.removeEventListener('keydown', this._keyHandler);
  }

  /**
   * Open the modal.
   * NOTE: body HTML is inserted into Shadow DOM, so only Shadow DOM styles apply.
   * Buttons in footer are also in Shadow DOM — use this.shadowRoot.querySelector to get them.
   */
  open({ title = '', icon = '', body = '', footer = '', size = '' } = {}) {
    this.isOpen = true;
    this.classList.add('open');
    document.body.style.overflow = 'hidden';

    const titleEl = this.shadowRoot.getElementById('modal-title-text');
    const iconEl = this.shadowRoot.getElementById('modal-icon');
    const bodyEl = this.shadowRoot.getElementById('modal-body');
    const footerEl = this.shadowRoot.getElementById('modal-footer');
    const modalEl = this.shadowRoot.getElementById('modal');

    titleEl.textContent = title || 'Modal';
    if (icon) {
      iconEl.innerHTML = icon;
    } else {
      iconEl.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 512 512" fill="none" stroke="currentColor" stroke-width="24" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="256,120 400,185 256,250 112,185" />
          <rect x="184" y="286" width="144" height="78" rx="10" />
          <polyline points="210,328 246,364 302,295" />
          <line x1="400" y1="185" x2="400" y2="240" />
          <circle cx="400" cy="252" r="16" fill="currentColor" />
        </svg>
      `;
    }
    bodyEl.innerHTML = body;
    footerEl.innerHTML = footer;

    modalEl.className = 'modal' + (size ? ` ${size}` : '');
    modalEl.classList.remove('out');

    setTimeout(() => {
      const first = bodyEl.querySelector('input,select,textarea,button,[tabindex]');
      first?.focus();
    }, 120);

    this.dispatchEvent(new CustomEvent('modal-open', { bubbles: true }));
    return this;
  }

  /** Shortcut to query inside modal body (Shadow DOM) */
  find(selector) {
    return this.shadowRoot.getElementById('modal-body').querySelector(selector);
  }

  /** Get FormData from a form inside the modal body */
  getFormData(formSelector = 'form') {
    const form = this.shadowRoot.getElementById('modal-body').querySelector(formSelector);
    return form ? Object.fromEntries(new FormData(form)) : {};
  }

  close() {
    const modal = this.shadowRoot.getElementById('modal');
    if (!modal) return;
    modal.classList.add('out');
    modal.addEventListener('animationend', () => {
      this.isOpen = false;
      this.classList.remove('open');
      document.body.style.overflow = '';
      this.dispatchEvent(new CustomEvent('modal-close', { bubbles: true }));
    }, { once: true });
  }
}

customElements.define('app-modal', AppModal);
