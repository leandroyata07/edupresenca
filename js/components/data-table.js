// =========================================================
// EduPresença – <data-table> Web Component
// Fixed: setColumns/setData queued if called before connectedCallback
// =========================================================
import { debounce, filterByText, sortBy } from '../utils.js';

class DataTable extends HTMLElement {
  static get observedAttributes() { return ['per-page']; }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._data = [];
    this._filtered = [];
    this._page = 1;
    this._perPage = 10;
    this._sortCol = null;
    this._sortDir = 'asc';
    this._query = '';
    this._columns = [];
    this._ready = false;
  }

  connectedCallback() {
    this._perPage = parseInt(this.getAttribute('per-page')) || 10;
    this._renderShell();
    this._ready = true;
    // If setColumns/setData were called before connectedCallback, render now
    this._renderTable();
  }

  attributeChangedCallback(name, _, val) {
    if (name === 'per-page') {
      this._perPage = parseInt(val) || 10;
      if (this._ready) this._applyFilters();
    }
  }

  setData(data) {
    this._data = Array.isArray(data) ? data : [];
    this._page = 1;
    if (this._ready) this._applyFilters();
  }

  setColumns(cols) {
    this._columns = Array.isArray(cols) ? cols : [];
    if (this._ready) this._renderTable();
  }

  _applyFilters() {
    this._filtered = filterByText(this._data, this._query);
    if (this._sortCol) {
      this._filtered = sortBy(this._filtered, this._sortCol, this._sortDir);
    }
    this._renderTable();
  }

  _renderShell() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; font-family: var(--font-sans,'Inter',sans-serif); }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .toolbar {
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px; padding: 14px 16px;
          border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.08));
          flex-wrap: wrap;
        }
        .search-wrap { position: relative; }
        .search-wrap svg {
          position: absolute; left: 10px; top: 50%;
          transform: translateY(-50%);
          color: var(--text-tertiary, #64748b); pointer-events: none;
        }
        .search-input {
          padding: 8px 10px 8px 34px; font-size: 13px; font-family: inherit;
          color: var(--text-primary, #f1f5f9);
          background: var(--bg-surface-2, #1a1a2e);
          border: 1.5px solid var(--border-color, rgba(255,255,255,0.08));
          border-radius: 8px; outline: none; min-width: 200px;
          transition: border-color 0.15s;
        }
        .search-input::placeholder { color: var(--text-tertiary, #64748b); }
        .search-input:focus { border-color: #6366f1; }

        .toolbar-right { display: flex; align-items: center; gap: 8px; }
        .count { font-size: 12px; color: var(--text-tertiary, #64748b); }

        .table-wrap { overflow-x: auto; }

        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        thead { background: var(--bg-surface-2, #1a1a2e); }
        th {
          padding: 10px 14px; text-align: left; font-weight: 600;
          font-size: 11px; letter-spacing: 0.05em; text-transform: uppercase;
          color: var(--text-secondary, #94a3b8); white-space: nowrap;
          border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.08));
          user-select: none;
        }
        th.sortable { cursor: pointer; }
        th.sortable:hover { color: var(--text-primary, #f1f5f9); }
        th.sort-asc::after  { content: ' ↑'; color: #818cf8; }
        th.sort-desc::after { content: ' ↓'; color: #818cf8; }

        tbody tr {
          border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.06));
          transition: background 0.12s;
        }
        tbody tr:last-child { border-bottom: none; }
        tbody tr:hover { background: rgba(255,255,255,0.025); cursor: pointer; }

        td { padding: 12px 14px; color: var(--text-primary, #f1f5f9); vertical-align: middle; }

        .empty-cell { text-align: center; padding: 56px 24px; color: var(--text-tertiary, #64748b); }
        .empty-cell svg { display: block; margin: 0 auto 12px; opacity: 0.35; }

        .pagination {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 16px; border-top: 1px solid var(--border-color, rgba(255,255,255,0.08));
          gap: 12px; flex-wrap: wrap;
        }
        .page-info { font-size: 12px; color: var(--text-secondary, #94a3b8); }
        .page-controls { display: flex; gap: 4px; }
        .page-btn {
          width: 30px; height: 30px; border-radius: 6px; font-size: 12px; font-weight: 600;
          background: transparent; color: var(--text-secondary, #94a3b8);
          border: 1px solid transparent; cursor: pointer; transition: all 0.12s;
          font-family: inherit;
        }
        .page-btn:hover { background: rgba(255,255,255,0.06); color: var(--text-primary, #f1f5f9); }
        .page-btn.active { background: #4f46e5; color: white; }
        .page-btn:disabled { opacity: 0.3; cursor: not-allowed; }

        /* Buttons rendered inside cells (action buttons via render fn live in Light DOM) */
        ::slotted(*) { display: flex; gap: 6px; }

        /* ── Responsive: card layout on small screens ── */
        @media (max-width: 640px) {
          .toolbar { flex-direction: column; align-items: stretch; }
          .search-input { width: 100%; min-width: 0; }

          .table-wrap { overflow-x: visible; }

          table, thead, tbody, tr, th, td { display: block; }
          thead tr { position: absolute; top: -9999px; left: -9999px; }

          tbody tr {
            background: var(--bg-surface-2, #1a1a2e);
            border: 1px solid var(--border-color, rgba(255,255,255,0.08));
            border-radius: 12px;
            margin-bottom: 10px;
            padding: 6px 4px;
          }
          tbody tr:last-child { border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.08)); }

          td {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            padding: 9px 14px;
            border-bottom: 1px solid rgba(255,255,255,0.04);
            font-size: 13px;
          }
          td:last-child { border-bottom: none; }

          td::before {
            content: attr(data-label);
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: var(--text-tertiary, #64748b);
            white-space: nowrap;
            flex-shrink: 0;
          }

          /* Hide purely action cells' labels if empty */
          td[data-label=""]::before { display: none; }
          td[data-label=""] { justify-content: flex-end; }

          .empty-cell { text-align: center; }
          .empty-cell::before { display: none; }
        }
      </style>

      <div class="toolbar">
        <div class="search-wrap">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input class="search-input" id="search-input" placeholder="Buscar..." type="search" />
        </div>
        <div class="toolbar-right">
          <span class="count" id="count-text"></span>
        </div>
      </div>

      <div class="table-wrap">
        <table id="table">
          <thead id="thead"></thead>
          <tbody id="tbody"></tbody>
        </table>
      </div>

      <div class="pagination" id="pagination"></div>
    `;

    this.shadowRoot.getElementById('search-input').addEventListener(
      'input',
      debounce((e) => {
        this._query = e.target.value;
        this._page = 1;
        this._applyFilters();
      }, 250)
    );
  }

  _renderTable() {
    if (!this._ready) return; // called before connectedCallback — skip
    this._renderHead();
    this._renderBody();
    this._renderPagination();
  }

  _renderHead() {
    const thead = this.shadowRoot.getElementById('thead');
    if (!thead || !this._columns.length) return;

    thead.innerHTML = `<tr>${this._columns.map(col => `
      <th class="${col.sortable !== false ? 'sortable' : ''} ${this._sortCol === col.key ? 'sort-' + this._sortDir : ''}"
          data-key="${col.key || ''}"
          style="${col.width ? 'width:' + col.width : ''}">
        ${col.label}
      </th>`).join('')}</tr>`;

    thead.querySelectorAll('th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const key = th.dataset.key;
        if (this._sortCol === key) {
          this._sortDir = this._sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          this._sortCol = key;
          this._sortDir = 'asc';
        }
        this._applyFilters();
      });
    });
  }

  _renderBody() {
    const tbody = this.shadowRoot.getElementById('tbody');
    const countEl = this.shadowRoot.getElementById('count-text');
    if (!tbody) return;

    const total = this._filtered.length;
    const start = (this._page - 1) * this._perPage;
    const page = this._filtered.slice(start, start + this._perPage);

    if (countEl) countEl.textContent = `${total} registro${total !== 1 ? 's' : ''}`;

    if (!page.length) {
      tbody.innerHTML = `
        <tr><td class="empty-cell" colspan="${this._columns.length || 1}">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <div>Nenhum registro encontrado.</div>
        </td></tr>`;
      return;
    }

    tbody.innerHTML = page.map(row => {
      const cells = this._columns.map(col => {
        const raw = row[col.key];
        const val = col.render ? col.render(raw, row) : (raw ?? '—');
        const lbl = (col.label || '').replace(/"/g, '&quot;');
        return `<td data-label="${lbl}">${val}</td>`;
      }).join('');
      return `<tr data-id="${row.id || ''}">${cells}</tr>`;
    }).join('');

    // Fire composed events so listeners outside Shadow DOM work correctly.
    // Native click events crossing Shadow boundary retarget e.target to the host,
    // so we intercept here and re-dispatch a custom 'action-click' with the dataset.
    tbody.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-edit], button[data-delete], button[data-action], button[data-boletim]');
      if (btn) {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('action-click', {
          detail: { ...btn.dataset },
          bubbles: true,
          composed: true,
        }));
        return;
      }
      // Row click (no button)
      const tr = e.target.closest('tr');
      if (!tr) return;
      const idx = [...tbody.querySelectorAll('tr')].indexOf(tr);
      if (idx >= 0 && page[idx]) {
        this.dispatchEvent(new CustomEvent('row-click', {
          detail: page[idx],
          bubbles: true,
          composed: true,
        }));
      }
    });
  }

  _renderPagination() {
    const pag = this.shadowRoot.getElementById('pagination');
    if (!pag) return;

    const total = this._filtered.length;
    const pages = Math.ceil(total / this._perPage);
    const start = (this._page - 1) * this._perPage + 1;
    const end = Math.min(this._page * this._perPage, total);

    if (pages <= 1) { pag.innerHTML = ''; return; }

    const pageNums = [];
    for (let p = 1; p <= pages; p++) {
      if (p === 1 || p === pages || (p >= this._page - 2 && p <= this._page + 2)) {
        pageNums.push(p);
      } else if (pageNums[pageNums.length - 1] !== '…') {
        pageNums.push('…');
      }
    }

    pag.innerHTML = `
      <span class="page-info">${start}–${end} de ${total}</span>
      <div class="page-controls">
        <button class="page-btn" id="prev-btn" ${this._page === 1 ? 'disabled' : ''} aria-label="Anterior">‹</button>
        ${pageNums.map(p =>
      p === '…'
        ? `<button class="page-btn" disabled>…</button>`
        : `<button class="page-btn ${p === this._page ? 'active' : ''}" data-page="${p}">${p}</button>`
    ).join('')}
        <button class="page-btn" id="next-btn" ${this._page === pages ? 'disabled' : ''} aria-label="Próxima">›</button>
      </div>`;

    // Use querySelector instead of getElementById (pag is a div, not document)
    pag.querySelectorAll('[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        this._page = parseInt(btn.dataset.page);
        this._renderTable();
      });
    });
    pag.querySelector('#prev-btn')?.addEventListener('click', () => {
      if (this._page > 1) { this._page--; this._renderTable(); }
    });
    pag.querySelector('#next-btn')?.addEventListener('click', () => {
      if (this._page < pages) { this._page++; this._renderTable(); }
    });
  }
}

customElements.define('data-table', DataTable);
