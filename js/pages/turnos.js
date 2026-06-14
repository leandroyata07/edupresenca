// EduPresença v2 – Turnos Page (with dynamic advanced filters & Escape shortcut)
import { auth, addLog, turnos } from '../store.js';
import { escapeHtml, initRipple, filterByText, debounce, formDraft, showConfirm, showSecureConfirm } from '../utils.js';

export function render(outlet) {
  const modalId = 'turnos-modal';
  let modal = document.getElementById(modalId);
  if (!modal) {
    modal = document.createElement('app-modal');
    modal.id = modalId;
    document.body.appendChild(modal);
  }

  outlet.innerHTML = `
    <div class="stagger-children">
      <div class="page-header">
        <div class="page-header-left">
          <h1 class="page-title">Turnos</h1>
          <p class="page-subtitle">Gerencie os turnos de funcionamento das aulas</p>
        </div>
        <div class="page-header-actions">
          ${auth.isGestor() ? `
          <button class="btn btn-primary" id="btn-novo-turno">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Novo
          </button>
          ` : ''}
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="filter-bar-container" style="margin-bottom: var(--space-4);">
        <div class="filter-bar" id="filter-bar" style="display: flex; align-items: center; gap: 10px; flex-wrap: nowrap; padding: 14px 0 10px;">
          <div style="position:relative;flex:1;min-width:200px;max-width:340px">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text-tertiary);pointer-events:none"
              aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="search" id="filter-text" class="form-control"
              placeholder="Buscar turno por nome..."
              style="padding-left:34px;height:38px;font-size:13px"
              aria-label="Buscar turno" />
          </div>

          <button class="btn btn-secondary" id="btn-toggle-filtros" style="height:38px; gap:6px; display:flex; align-items:center; white-space:nowrap; padding: 0 16px; cursor: pointer;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
            </svg>
            <span>Filtros</span>
            <span id="active-filters-count" class="badge badge-primary" style="display:none; margin-left:4px; padding:2px 6px; font-size:11px;">0</span>
          </button>

          <button class="btn btn-ghost btn-sm" id="btn-limpar-filtros" title="Limpar todos os filtros"
            style="white-space:nowrap; display:none;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
              aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            Limpar filtros
          </button>
          
          <div class="filter-chips" id="filter-chips" style="display: flex; gap: 6px; flex-wrap: wrap; flex: 1;"></div>
        </div>

        <!-- Collapsible Advanced Filters Drawer -->
        <div id="advanced-filters-drawer" style="max-height: 0; overflow: hidden; transition: max-height 0.25s ease-out, margin-top 0.25s ease-out; margin-top: 0;">
          <div class="card" style="padding: var(--space-4); border: 1px solid var(--border-color, rgba(255,255,255,0.08)); background: var(--surface-2); margin-bottom: 8px;">
            <div class="form-grid" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 0;">
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label" style="font-size:11.5px; font-weight:600; color:var(--text-secondary); margin-bottom:4px;">Período (Início)</label>
                <select id="filter-periodo" class="form-control" style="height:36px; font-size:12.5px;">
                  <option value="">Todos</option>
                  <option value="diurno">Diurno (Início antes das 13:00)</option>
                  <option value="vespertino">Vespertino (Início entre 13:00 e 18:00)</option>
                  <option value="noturno">Noturno (Início a partir das 18:00)</option>
                </select>
              </div>
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label" style="font-size:11.5px; font-weight:600; color:var(--text-secondary); margin-bottom:4px;">Duração</label>
                <select id="filter-duracao" class="form-control" style="height:36px; font-size:12.5px;">
                  <option value="">Todas</option>
                  <option value="curto">Turno Curto (&le; 5h)</option>
                  <option value="longo">Turno Longo (&gt; 5h)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div id="turnos-empty-state" hidden>
        <div class="empty-state-page">
          <div class="esp-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <h3>Nenhum turno cadastrado ainda.</h3>
          <p>Cadastre os turnos de funcionamento (Manhã, Tarde, Noite, etc.) antes de criar turmas.</p>
          ${auth.isGestor() ? `
          <button class="btn btn-primary" id="btn-novo-turno-es">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Cadastrar Turno
          </button>
          ` : '<p>Consulte a coordenação para realizar novos cadastros.</p>'}
        </div>
      </div>

      <!-- Table Wrapper -->
      <div class="table-container" id="table-wrapper">
        <data-table id="turnos-table" per-page="10"></data-table>
      </div>
    </div>
  `;

  const table = outlet.querySelector('#turnos-table');

  const columns = [
    {
      label: 'Nome', key: 'nome', render: (v) => {
        const colorMap = { manhã: 'warning', tarde: 'orange', noite: 'primary', integral: 'success' };
        const color = colorMap[v?.toLowerCase()] || 'neutral';
        return `<span class="badge badge-${color}">${escapeHtml(v)}</span>`;
      }
    },
    { label: 'Início', key: 'inicio', render: (v) => v || '—' },
    { label: 'Fim', key: 'fim', render: (v) => v || '—' },
    {
      label: 'Duração', key: 'inicio', sortable: false, render: (_, row) => {
        if (!row.inicio || !row.fim) return '—';
        const [h1, m1] = row.inicio.split(':').map(Number);
        const [h2, m2] = row.fim.split(':').map(Number);
        const mins = (h2 * 60 + m2) - (h1 * 60 + m1);
        if (mins <= 0) return '—';
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h}h${m ? m + 'min' : ''}`;
      }
    },
    {
      label: 'Períodos/Dia', key: 'maxPeriodos', sortable: false,
      render: (v) => v ? `<span class="badge badge-neutral">${v} aulas</span>` : `<span class="badge badge-neutral">6 aulas</span>`
    },
    {
      label: 'Ações', key: 'id', sortable: false,
      render: (id) => {
        const isAdmin = auth.isAdmin();
        const canEdit = auth.isGestor();
        return `
        <div style="display:flex;gap:6px">
          ${canEdit ? `
          <button class="btn btn-ghost btn-icon-sm" data-edit="${id}" title="Editar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          ` : ''}
          <button class="btn btn-ghost btn-icon-sm" data-delete="${id}" title="Excluir" 
            style="color:${isAdmin ? 'var(--danger-400)' : 'var(--text-tertiary)'}; opacity:${isAdmin ? 1 : 0.5}"
            ${isAdmin ? '' : 'disabled'}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          </button>
        </div>`;
      }
    }
  ];

  table.setColumns(columns);

  // ── Filter State ──────────────────────────────────────
  const filterState = { text: '', periodo: '', duracao: '' };

  function getFilteredData() {
    let data = turnos.getAll().sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
    if (filterState.text.trim()) {
      data = filterByText(data, filterState.text);
    }
    if (filterState.periodo) {
      data = data.filter(t => {
        if (!t.inicio) return false;
        const [hr] = t.inicio.split(':').map(Number);
        if (filterState.periodo === 'diurno') return hr < 13;
        if (filterState.periodo === 'vespertino') return hr >= 13 && hr < 18;
        if (filterState.periodo === 'noturno') return hr >= 18;
        return true;
      });
    }
    if (filterState.duracao) {
      data = data.filter(t => {
        if (!t.inicio || !t.fim) return false;
        const [h1, m1] = t.inicio.split(':').map(Number);
        const [h2, m2] = t.fim.split(':').map(Number);
        const mins = (h2 * 60 + m2) - (h1 * 60 + m1);
        if (filterState.duracao === 'curto') return mins <= 300; // <= 5h
        if (filterState.duracao === 'longo') return mins > 300; // > 5h
        return true;
      });
    }
    return data;
  }

  function hasActiveFilters() {
    return filterState.text.trim() !== '' || filterState.periodo !== '' || filterState.duracao !== '';
  }

  function updateChips() {
    const chipsEl = outlet.querySelector('#filter-chips');
    if (!chipsEl) return;
    const chips = [];
    if (filterState.text.trim()) chips.push({ key: '_text', label: `"${filterState.text.trim()}"` });
    if (filterState.periodo) {
      const labels = { diurno: 'Período: Diurno', vespertino: 'Período: Vespertino', noturno: 'Período: Noturno' };
      chips.push({ key: 'periodo', label: labels[filterState.periodo] });
    }
    if (filterState.duracao) {
      chips.push({ key: 'duracao', label: filterState.duracao === 'curto' ? 'Duração: ≤ 5h' : 'Duração: > 5h' });
    }

    chipsEl.innerHTML = chips.map(c => `
      <span class="filter-chip">
        ${escapeHtml(c.label)}
        <button data-clear-chip="${c.key}" title="Remover filtro" aria-label="Remover filtro ${escapeHtml(c.label)}">×</button>
      </span>`).join('');

    // Update active filters badge count (excluding text search)
    const selectCount = [filterState.periodo, filterState.duracao].filter(Boolean).length;
    const badge = outlet.querySelector('#active-filters-count');
    if (badge) {
      if (selectCount > 0) {
        badge.textContent = selectCount;
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    }

    const clearAllBtn = outlet.querySelector('#btn-limpar-filtros');
    if (clearAllBtn) {
      if (hasActiveFilters()) {
        clearAllBtn.style.display = 'inline-flex';
      } else {
        clearAllBtn.style.display = 'none';
      }
    }

    chipsEl.querySelectorAll('[data-clear-chip]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.clearChip;
        if (key === '_text') {
          filterState.text = '';
          const ti = outlet.querySelector('#filter-text');
          if (ti) ti.value = '';
        } else if (key === 'periodo') {
          filterState.periodo = '';
          const sel = outlet.querySelector('#filter-periodo');
          if (sel) sel.value = '';
        } else if (key === 'duracao') {
          filterState.duracao = '';
          const sel = outlet.querySelector('#filter-duracao');
          if (sel) sel.value = '';
        }
        refreshTable();
      });
    });
  }

  function refreshTable() {
    const allData = turnos.getAll();
    const emptyState = outlet.querySelector('#turnos-empty-state');
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

  refreshTable();

  // ── Events ────────────────────────────────────────────
  outlet.querySelector('#btn-novo-turno')?.addEventListener('click', () => openForm(null));
  outlet.querySelector('#btn-novo-turno-es')?.addEventListener('click', () => openForm(null));

  outlet.querySelector('#filter-text')?.addEventListener('input', debounce((e) => {
    filterState.text = e.target.value;
    refreshTable();
  }, 300));

  outlet.querySelector('#filter-periodo')?.addEventListener('change', (e) => {
    filterState.periodo = e.target.value;
    refreshTable();
  });

  outlet.querySelector('#filter-duracao')?.addEventListener('change', (e) => {
    filterState.duracao = e.target.value;
    refreshTable();
  });

  outlet.querySelector('#btn-limpar-filtros')?.addEventListener('click', () => {
    filterState.text = '';
    filterState.periodo = '';
    filterState.duracao = '';
    const ti = outlet.querySelector('#filter-text');
    if (ti) ti.value = '';
    const pe = outlet.querySelector('#filter-periodo');
    if (pe) pe.value = '';
    const du = outlet.querySelector('#filter-duracao');
    if (du) du.value = '';
    refreshTable();
  });

  // Toggle dynamic advanced filters drawer
  let drawerOpen = false;
  const toggleBtn = outlet.querySelector('#btn-toggle-filtros');
  const drawer = outlet.querySelector('#advanced-filters-drawer');
  
  function closeDrawer() {
    drawerOpen = false;
    if (drawer) {
      drawer.style.maxHeight = '0';
      drawer.style.marginTop = '0';
    }
    if (toggleBtn) {
      toggleBtn.classList.remove('btn-active');
      toggleBtn.style.background = '';
      toggleBtn.style.color = '';
      toggleBtn.style.borderColor = '';
    }
  }

  function openDrawer() {
    drawerOpen = true;
    if (drawer) {
      drawer.style.maxHeight = '200px';
      drawer.style.marginTop = '10px';
    }
    if (toggleBtn) {
      toggleBtn.classList.add('btn-active');
      toggleBtn.style.background = 'var(--primary-100, rgba(99,102,241,0.15))';
      toggleBtn.style.color = 'var(--primary-400, #818cf8)';
      toggleBtn.style.borderColor = 'var(--primary-300, rgba(99,102,241,0.3))';
    }
  }

  toggleBtn?.addEventListener('click', () => {
    if (drawerOpen) {
      closeDrawer();
    } else {
      openDrawer();
    }
  });

  const handleKeyDown = (e) => {
    if (!document.body.contains(drawer)) {
      document.removeEventListener('keydown', handleKeyDown);
      return;
    }
    if (e.key === 'Escape' && drawerOpen) {
      closeDrawer();
    }
  };
  document.addEventListener('keydown', handleKeyDown);

  table.addEventListener('action-click', (e) => {
    const { edit, delete: del } = e.detail;
    if (edit) openForm(turnos.getById(edit));
    if (del) confirmDelete(del);
  });

  initRipple(outlet);

  // ── Open Form ─────────────────────────────────────────
  function openForm(turno = null) {
    const isEdit = !!turno;

    const body = `
      <form id="turno-form" novalidate autocomplete="off">
        <div class="form-grid">
          <div class="form-group full-width">
            <label class="form-label" for="t-nome">Nome do Turno <span class="required">*</span></label>
            <input class="form-control" id="t-nome" name="nome" type="text"
              placeholder="Ex: Manhã, Tarde, Noite, Integral..."
              value="${escapeHtml(turno?.nome || '')}" required />
          </div>
          <div class="form-group">
            <label class="form-label" for="t-inicio">Horário de Início <span class="required">*</span></label>
            <input class="form-control" id="t-inicio" name="inicio" type="time"
              value="${turno?.inicio || ''}" required />
          </div>
          <div class="form-group">
            <label class="form-label" for="t-fim">Horário de Fim <span class="required">*</span></label>
            <input class="form-control" id="t-fim" name="fim" type="time"
              value="${turno?.fim || ''}" required />
          </div>
          <div class="form-group full-width">
            <label class="form-label" for="t-maxperiodos">Nº de Períodos/Aulas por Dia <span class="required">*</span></label>
            <input class="form-control" id="t-maxperiodos" name="maxPeriodos" type="number"
              min="1" max="12" placeholder="Ex: 4"
              value="${turno?.maxPeriodos || 6}" required style="max-width:120px;" />
            <span style="font-size:11px;color:var(--text-tertiary);margin-top:4px;display:block;">Quantas aulas por dia este turno comporta. O quadro de horários exibirá somente esse número de linhas para as turmas vinculadas a este turno.</span>
          </div>
        </div>
      </form>
    `;

    const footer = `
      <button class="btn btn-ghost" id="m-cancel">Cancelar</button>
      <button class="btn btn-primary" id="m-save">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        ${isEdit ? 'Salvar' : 'Cadastrar'}
      </button>
    `;

    modal.open({
      title: isEdit ? 'Editar Turno' : 'Novo Turno',
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
      body,
      footer
    });

    const bodyEl = modal.shadowRoot;
    const form = bodyEl?.querySelector('#turno-form');

    const draftKey = isEdit ? `turno-edit-${turno.id}` : 'turno-novo';
    if (form && !isEdit) formDraft.restore(draftKey, form);
    form?.addEventListener('input', () => formDraft.save(draftKey, form));
    form?.addEventListener('change', () => formDraft.save(draftKey, form));

    bodyEl?.querySelector('#m-cancel')?.addEventListener('click', () => {
      formDraft.clear(draftKey);
      modal.close();
    });

    bodyEl?.querySelector('#m-save')?.addEventListener('click', async () => {
      const data = modal.getFormData('#turno-form');
      
      if (!data.nome?.trim() || !data.inicio || !data.fim) {
        window.toast?.error('Campos obrigatórios', 'Por favor, preencha todos os campos obrigatórios.');
        return;
      }

      const maxPeriodos = parseInt(data.maxPeriodos, 10);
      if (isNaN(maxPeriodos) || maxPeriodos < 1 || maxPeriodos > 12) {
        window.toast?.error('Valor inválido', 'O número de períodos deve ser entre 1 e 12.');
        return;
      }

      const resolvedData = { ...data, maxPeriodos };

      if (isEdit) {
        const confirmed = await showConfirm(modal, {
          title: 'Confirmar Edição',
          message: `Deseja salvar as alterações no turno <strong>${escapeHtml(data.nome)}</strong>?`,
          confirmText: 'Salvar alterações'
        });
        if (!confirmed) return;

        turnos.update(turno.id, resolvedData);
        addLog('UPDATE', 'Turno', { id: turno.id, nome: data.nome });
        window.toast?.success('Turno atualizado!', '');
      } else {
        turnos.create(resolvedData);
        addLog('CREATE', 'Turno', { nome: data.nome });
        window.toast?.success('Turno cadastrado!', '');
      }

      formDraft.clear(draftKey);
      modal.close();
      refreshTable();
    });
  }

  // ── Exclusão ──────────────────────────────────────────
  async function confirmDelete(id) {
    const item = turnos.getById(id);
    if (!item) return;

    const result = await showSecureConfirm(modal, {
      title: 'Excluir Turno',
      message: `Você tem certeza que deseja excluir o turno <strong>${escapeHtml(item.nome)}</strong>? Esta ação exige sua senha pessoal.`,
      confirmText: 'Confirmar e Excluir'
    });

    if (result) {
      turnos.delete(id);
      addLog('DELETE', 'Turno', { id, nome: item.nome });
      window.toast?.success('Turno excluído!', '');
      refreshTable();
    }
  }
}
