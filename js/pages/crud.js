// =========================================================
// EduPresença v2 – Generic CRUD page helper (enhanced)
// Adds: filter bar (text search + select filters), empty state CTA
// =========================================================
import { escapeHtml, initRipple, filterByText, debounce, deleteWithUndo, formDraft } from '../utils.js';

/**
 * Build a generic CRUD page with filter bar and enhanced empty state.
 *
 * Config additions over v1:
 *   searchPlaceholder  {string}  - placeholder for text search input
 *   filterSelects      {Array}   - select filter definitions:
 *                                  [{ name, label, options: [{value, label}] }]
 *   emptyStateMessage  {string}  - heading shown when store is empty
 *   emptyStateCTA      {string}  - description shown when store is empty
 */
export function buildCrudPage(outlet, config) {
  const {
    title, subtitle, store, columns, formFields, modalTitle, emptyIcon,
    searchPlaceholder = `Buscar ${modalTitle?.toLowerCase() || 'registro'}...`,
    filterSelects = [],
    emptyStateMessage = `Nenhum(a) ${modalTitle} cadastrado(a) ainda.`,
    emptyStateCTA = `Clique em "Novo" para cadastrar o primeiro(a) ${modalTitle}.`,
  } = config;

  const modalId = 'crud-modal-' + title.replace(/\s+/g, '-').toLowerCase();
  let modal = document.getElementById(modalId);
  if (!modal) {
    modal = document.createElement('app-modal');
    modal.id = modalId;
    document.body.appendChild(modal);
  }

  // Build filter selects HTML
  const filterSelectsHtml = filterSelects.map(f => `
    <select class="form-control filter-select" id="fsel-${f.name}" data-filter-key="${f.name}"
      style="min-width:150px;height:38px;font-size:13px" aria-label="Filtrar por ${f.label}">
      <option value="">Todos (${escapeHtml(f.label)})</option>
      ${(f.options || []).map(o =>
    `<option value="${escapeHtml(String(o.value))}">${escapeHtml(o.label)}</option>`
  ).join('')}
    </select>`).join('');

  outlet.innerHTML = `
    <div class="stagger-children">
      <div class="page-header">
        <div class="page-header-left">
          <h1 class="page-title">${title}</h1>
          <p class="page-subtitle">${subtitle}</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-primary" id="btn-novo">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Novo
          </button>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="filter-bar" id="filter-bar">
        <div style="position:relative;flex:1;min-width:200px;max-width:340px">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text-tertiary);pointer-events:none"
            aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="search" id="filter-text" class="form-control filter-search"
            placeholder="${escapeHtml(searchPlaceholder)}"
            style="padding-left:34px;height:38px;font-size:13px"
            aria-label="${escapeHtml(searchPlaceholder)}" />
        </div>
        ${filterSelectsHtml}
        <button class="btn btn-ghost btn-sm" id="btn-limpar-filtros" title="Limpar todos os filtros"
          style="white-space:nowrap">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
            aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
          Limpar filtros
        </button>
        <div class="filter-chips" id="filter-chips"></div>
      </div>

      <!-- Enhanced empty state (shown when store has no records) -->
      <div id="crud-empty-state" hidden>
        <div class="empty-state-page">
          <div class="esp-icon">
            ${emptyIcon || `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>`}
          </div>
          <h3>${escapeHtml(emptyStateMessage)}</h3>
          <p>${escapeHtml(emptyStateCTA)}</p>
          <button class="btn btn-primary" id="btn-novo-es">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Cadastrar ${modalTitle}
          </button>
        </div>
      </div>

      <!-- Table (shown when store has records) -->
      <div class="table-container" id="table-wrapper">
        <data-table id="crud-table" per-page="10"></data-table>
      </div>
    </div>
  `;

  const table = outlet.querySelector('#crud-table');

  const actionColumn = {
    label: 'Ações', key: 'id', sortable: false,
    render: (id) => `
      <div style="display:flex;gap:6px">
        <button class="btn btn-ghost btn-icon-sm" data-edit="${id}" title="Editar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="btn btn-ghost btn-icon-sm" data-delete="${id}" title="Excluir" style="color:var(--danger-400)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
        </button>
      </div>`
  };

  table.setColumns([...columns, actionColumn]);

  // ── Filter State ──────────────────────────────────────
  const filterState = { text: '', selects: {} };
  filterSelects.forEach(f => { filterState.selects[f.name] = ''; });

  function getFilteredData() {
    let data = [...store.getAll()].sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
    if (filterState.text.trim()) {
      data = filterByText(data, filterState.text);
    }
    for (const [key, val] of Object.entries(filterState.selects)) {
      if (val) data = data.filter(item => String(item[key] ?? '') === val);
    }
    return data;
  }

  function hasActiveFilters() {
    return filterState.text.trim() !== '' ||
      Object.values(filterState.selects).some(v => v !== '');
  }

  function updateChips() {
    const chipsEl = outlet.querySelector('#filter-chips');
    if (!chipsEl) return;
    const chips = [];
    if (filterState.text.trim()) {
      chips.push({ label: `"${filterState.text.trim()}"`, key: '_text' });
    }
    filterSelects.forEach(f => {
      const val = filterState.selects[f.name];
      if (val) {
        const opt = f.options?.find(o => String(o.value) === val);
        chips.push({ label: `${f.label}: ${opt?.label || val}`, key: f.name });
      }
    });
    chipsEl.innerHTML = chips.map(c => `
      <span class="filter-chip">
        ${escapeHtml(c.label)}
        <button data-clear-chip="${c.key}" title="Remover filtro" aria-label="Remover filtro ${escapeHtml(c.label)}">×</button>
      </span>`).join('');

    chipsEl.querySelectorAll('[data-clear-chip]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.clearChip;
        if (key === '_text') {
          filterState.text = '';
          const textInput = outlet.querySelector('#filter-text');
          if (textInput) textInput.value = '';
        } else {
          filterState.selects[key] = '';
          const sel = outlet.querySelector(`#fsel-${key}`);
          if (sel) sel.value = '';
        }
        refresh();
      });
    });
  }

  function refresh() {
    const allData = store.getAll();
    const emptyState = outlet.querySelector('#crud-empty-state');
    const tableWrapper = outlet.querySelector('#table-wrapper');

    updateChips();

    if (allData.length === 0 && !hasActiveFilters()) {
      emptyState?.removeAttribute('hidden');
      if (tableWrapper) tableWrapper.style.display = 'none';
    } else {
      emptyState?.setAttribute('hidden', '');
      if (tableWrapper) tableWrapper.style.display = '';
      table.setData(getFilteredData());
    }
  }

  // Initial render
  refresh();

  // ── Event Listeners ───────────────────────────────────
  outlet.querySelector('#btn-novo').addEventListener('click', () => openForm());

  // Empty-state CTA button
  outlet.querySelector('#btn-novo-es')?.addEventListener('click', () => openForm());

  // Text filter (debounced)
  const textInput = outlet.querySelector('#filter-text');
  textInput?.addEventListener('input', debounce((e) => {
    filterState.text = e.target.value;
    refresh();
  }, 300));

  // Select filters
  filterSelects.forEach(f => {
    const sel = outlet.querySelector(`#fsel-${f.name}`);
    sel?.addEventListener('change', (e) => {
      filterState.selects[f.name] = e.target.value;
      refresh();
    });
  });

  // Clear all filters
  outlet.querySelector('#btn-limpar-filtros')?.addEventListener('click', () => {
    filterState.text = '';
    filterSelects.forEach(f => { filterState.selects[f.name] = ''; });
    const textInput = outlet.querySelector('#filter-text');
    if (textInput) textInput.value = '';
    filterSelects.forEach(f => {
      const sel = outlet.querySelector(`#fsel-${f.name}`);
      if (sel) sel.value = '';
    });
    refresh();
  });

  // Table action events
  table.addEventListener('action-click', (e) => {
    const { edit, delete: del } = e.detail;
    if (edit) openForm(store.getById(edit));
    if (del) confirmDel(del);
  });

  initRipple(outlet);

  // ── Form ──────────────────────────────────────────────
  function openForm(item = null) {
    const isEdit = !!item;

    const body = `
      <form id="crud-form" novalidate autocomplete="off">
        <div class="form-grid">
          ${formFields.map(f => {
      const val = String(item?.[f.name] ?? '');
      if (f.type === 'textarea') return `
              <div class="form-group full-width">
                <label class="form-label" for="f-${f.name}">${f.label}${f.required ? ' <span class="required">*</span>' : ''}</label>
                <textarea class="form-control" id="f-${f.name}" name="${f.name}" rows="3"
                  placeholder="${f.placeholder || ''}" ${f.required ? 'required' : ''}>${escapeHtml(val)}</textarea>
                ${f.help ? `<span class="form-help">${f.help}</span>` : ''}
              </div>`;
      if (f.type === 'select') return `
              <div class="form-group${f.full ? ' full-width' : ''}">
                <label class="form-label" for="f-${f.name}">${f.label}${f.required ? ' <span class="required">*</span>' : ''}</label>
                <select class="form-control" id="f-${f.name}" name="${f.name}" ${f.required ? 'required' : ''}>
                  <option value="">Selecione...</option>
                  ${(f.options || []).map(o =>
        `<option value="${o.value}" ${val === String(o.value) ? 'selected' : ''}>${escapeHtml(o.label)}</option>`
      ).join('')}
                </select>
              </div>`;
      return `
              <div class="form-group${f.full ? ' full-width' : ''}">
                <label class="form-label" for="f-${f.name}">${f.label}${f.required ? ' <span class="required">*</span>' : ''}</label>
                <input class="form-control" id="f-${f.name}" name="${f.name}" type="${f.type || 'text'}"
                  placeholder="${f.placeholder || ''}" value="${escapeHtml(val)}"
                  ${f.required ? 'required' : ''}
                  ${f.min !== undefined ? `min="${f.min}"` : ''}
                  ${f.max !== undefined ? `max="${f.max}"` : ''}
                  ${f.step !== undefined ? `step="${f.step}"` : ''} />
                ${f.help ? `<span class="form-help">${f.help}</span>` : ''}
              </div>`;
    }).join('')}
        </div>
      </form>`;

    const footer = `
      <button class="btn btn-ghost" id="m-cancel">Cancelar</button>
      <button class="btn btn-primary" id="m-save">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        ${isEdit ? 'Salvar' : 'Cadastrar'}
      </button>`;

    modal.open({
      title: isEdit ? `Editar ${modalTitle}` : `Novo(a) ${modalTitle}`,
      icon: emptyIcon,
      body,
      footer,
    });

    // ── Auto-save draft ───────────────────────────────
    const draftKey = isEdit ? `${modalTitle}-edit-${item.id}` : `${modalTitle}-novo`;
    const form = modal.shadowRoot?.getElementById('crud-form');
    if (form) {
      if (!isEdit) formDraft.restore(draftKey, form);
      form.addEventListener('input', () => formDraft.save(draftKey, form));
      form.addEventListener('change', () => formDraft.save(draftKey, form));
    }

    modal.shadowRoot.getElementById('m-cancel')?.addEventListener('click', () => {
      formDraft.clear(draftKey);
      modal.close();
    });
    modal.shadowRoot.getElementById('m-save')?.addEventListener('click', () => {
      const data = modal.getFormData('#crud-form');
      const required = formFields.filter(f => f.required);
      for (const f of required) {
        if (!String(data[f.name] ?? '').trim()) {
          window.toast?.error?.('Campo obrigatório', `Preencha o campo "${f.label}".`);
          return;
        }
      }
      if (isEdit) {
        store.update(item.id, data);
        window.toast?.success(`${modalTitle} atualizado!`, '');
      } else {
        store.create(data);
        window.toast?.success(`${modalTitle} cadastrado!`, '');
      }
      formDraft.clear(draftKey);
      modal.close();
      refresh();
    });
  }

  // ── Delete ────────────────────────────────────────────
  function confirmDel(id) {
    const item = store.getById(id);
    if (!item) return;
    deleteWithUndo(store, item, item.nome || item.id, refresh);
  }
}
