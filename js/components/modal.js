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
          background: rgba(0,0,0,0.75);
          backdrop-filter: blur(8px);
          z-index: 400;
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }

        /* ── Modal shell ── */
        .modal {
          background: var(--bg-surface, #12121f);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          width: 100%;
          max-width: var(--modal-max-width, 580px);
          max-height: 90vh;
          display: flex; flex-direction: column;
          box-shadow: 0 24px 80px rgba(0,0,0,0.7);
          animation: modalIn 0.28s cubic-bezier(0.4,0,0.2,1);
          font-family: var(--font-sans, 'Inter', sans-serif);
          overflow: hidden;
          color: var(--text-primary, #f1f5f9);
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

        /* ── Header ── */
        .modal-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          flex-shrink: 0; gap: 12px;
        }
        .modal-title {
          font-family: var(--font-display,'Plus Jakarta Sans',sans-serif);
          font-size: 17px; font-weight: 700;
          color: var(--text-primary, #f1f5f9);
          display: flex; align-items: center; gap: 10px;
        }
        .modal-title-icon {
          width: 36px; height: 36px; border-radius: 10px;
          background: rgba(99,102,241,0.15);
          display: flex; align-items: center; justify-content: center;
          color: #818cf8; flex-shrink: 0;
        }
        .modal-close {
          width: 32px; height: 32px; border: none;
          background: rgba(255,255,255,0.05); border-radius: 8px;
          cursor: pointer; color: var(--text-secondary,#94a3b8);
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s; flex-shrink: 0;
        }
        .modal-close:hover { background: rgba(255,255,255,0.1); color: #f1f5f9; }

        /* ── Body ── */
        .modal-body {
          flex: 1; overflow-y: auto; padding: 24px;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.1) transparent;
        }
        .modal-body::-webkit-scrollbar { width: 5px; }
        .modal-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 9999px; }

        /* ── Footer ── */
        .modal-footer {
          display: flex; align-items: center; justify-content: flex-end;
          gap: 10px; padding: 16px 24px;
          border-top: 1px solid rgba(255,255,255,0.07);
          background: rgba(0,0,0,0.2); flex-shrink: 0; flex-wrap: wrap;
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
          font-size: 12px; font-weight: 600;
          color: var(--text-secondary, #94a3b8);
          letter-spacing: 0.04em; text-transform: uppercase;
        }
        .required { color: #f87171; }

        .form-control {
          width: 100%; padding: 10px 14px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px;
          color: var(--text-primary, #f1f5f9);
          font-size: 14px; font-family: inherit;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
          appearance: none; -webkit-appearance: none;
          outline: none;
        }
        .form-control:focus {
          border-color: #818cf8;
          background: rgba(99,102,241,0.08);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.2);
        }
        .form-control::placeholder { color: rgba(148,163,184,0.5); }
        select.form-control {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 12px center;
          padding-right: 36px; cursor: pointer;
        }
        select.form-control option { background: #1e1b4b; color: #f1f5f9; }
        textarea.form-control { resize: vertical; min-height: 80px; }
        input[type=date].form-control,
        input[type=time].form-control { cursor: pointer; }
        input[type=number].form-control { -moz-appearance: textfield; }
        input[type=number].form-control::-webkit-outer-spin-button,
        input[type=number].form-control::-webkit-inner-spin-button { -webkit-appearance: none; }
        .form-help { font-size: 11px; color: rgba(148,163,184,0.7); margin-top: 2px; }

        /* ── Alert box ── */
        .alert-danger {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 12px 16px; border-radius: 10px;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.3);
          color: #fca5a5; font-size: 13px; line-height: 1.5;
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
          background: linear-gradient(135deg,#4f46e5,#7c3aed);
          color: #fff; box-shadow: 0 4px 16px rgba(99,102,241,0.35);
        }
        .btn-primary:hover { box-shadow: 0 6px 20px rgba(99,102,241,0.5); filter: brightness(1.1); }
        .btn-ghost {
          background: rgba(255,255,255,0.05);
          color: var(--text-secondary,#94a3b8);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .btn-ghost:hover { background: rgba(255,255,255,0.09); color: #f1f5f9; }
        .btn-danger {
          background: linear-gradient(135deg,#dc2626,#b91c1c);
          color: #fff; box-shadow: 0 4px 16px rgba(220,38,38,0.3);
        }
        .btn-danger:hover { filter: brightness(1.1); }
        .btn-sm { padding: 7px 14px; font-size: 12px; border-radius: 8px; }

        /* ── Paragraph helper ── */
        p { margin: 0; line-height: 1.6; }
        strong { color: var(--text-primary,#f1f5f9); font-weight: 700; }

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
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>
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
      if (e.target.id === 'backdrop') this.close();
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
    if (icon) iconEl.innerHTML = icon;
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
