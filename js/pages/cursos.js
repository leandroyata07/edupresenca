// EduPresença v2 – Cursos Page (with dynamic advanced filters & Escape shortcut)
import { auth, addLog, cursos } from '../store.js';
import { escapeHtml, initRipple, filterByText, debounce, formDraft, showConfirm, showSecureConfirm } from '../utils.js';

export function render(outlet) {
  const modalId = 'cursos-modal';
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
          <h1 class="page-title">Cursos</h1>
          <p class="page-subtitle">Gerencie os cursos oferecidos pela instituição</p>
        </div>
        <div class="page-header-actions">
          ${auth.isGestor() ? `
          <button class="btn btn-primary" id="btn-novo-curso">
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
              placeholder="Buscar curso por nome ou descrição..."
              style="padding-left:34px;height:38px;font-size:13px"
              aria-label="Buscar curso" />
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
                <label class="form-label" style="font-size:11.5px; font-weight:600; color:var(--text-secondary); margin-bottom:4px;">Carga Horária</label>
                <select id="filter-carga" class="form-control" style="height:36px; font-size:12.5px;">
                  <option value="">Todas</option>
                  <option value="curta">Curta duração (&lt; 200h)</option>
                  <option value="media">Média duração (200h - 1000h)</option>
                  <option value="longa">Longa duração (&gt; 1000h)</option>
                </select>
              </div>
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label" style="font-size:11.5px; font-weight:600; color:var(--text-secondary); margin-bottom:4px;">Disciplinas</label>
                <select id="filter-has-disciplinas" class="form-control" style="height:36px; font-size:12.5px;">
                  <option value="">Todas</option>
                  <option value="sim">Com disciplinas cadastradas</option>
                  <option value="nao">Sem disciplinas cadastradas</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div id="cursos-empty-state" hidden>
        <div class="empty-state-page">
          <div class="esp-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
          </div>
          <h3>Nenhum curso cadastrado ainda.</h3>
          <p>Crie os cursos oferecidos pela instituição antes de cadastrar turmas e disciplinas.</p>
          ${auth.isGestor() ? `
          <button class="btn btn-primary" id="btn-novo-curso-es">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Cadastrar Curso
          </button>
          ` : '<p>Consulte a coordenação para realizar novos cadastros.</p>'}
        </div>
      </div>

      <!-- Table Wrapper -->
      <div class="table-container" id="table-wrapper">
        <data-table id="cursos-table" per-page="10"></data-table>
      </div>
    </div>
  `;

  const table = outlet.querySelector('#cursos-table');

  const columns = [
    { label: 'Nome', key: 'nome', render: (v) => `<strong>${escapeHtml(v)}</strong>` },
    { label: 'Descrição', key: 'descricao', render: (v) => `<span style="color:var(--text-secondary);font-size:12px">${escapeHtml(v || '—')}</span>` },
    { label: 'Carga Horária', key: 'cargaHoraria', render: (v) => v ? `${v}h` : '—' },
    {
      label: 'Disciplinas', key: 'disciplinas', render: (v) => {
        const discs = (v || '').split(',').map(s => s.trim()).filter(Boolean);
        return discs.slice(0, 3).map(d => `<span class="badge badge-neutral" style="margin-right:4px">${escapeHtml(d)}</span>`).join('')
          + (discs.length > 3 ? `<span class="badge badge-neutral">+${discs.length - 3}</span>` : '');
      }
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
  const filterState = { text: '', carga: '', hasDisciplinas: '' };

  function getFilteredData() {
    let data = cursos.getAll().sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
    if (filterState.text.trim()) {
      data = filterByText(data, filterState.text);
    }
    if (filterState.carga) {
      data = data.filter(c => {
        const hrs = parseInt(c.cargaHoraria) || 0;
        if (filterState.carga === 'curta') return hrs < 200;
        if (filterState.carga === 'media') return hrs >= 200 && hrs <= 1000;
        if (filterState.carga === 'longa') return hrs > 1000;
        return true;
      });
    }
    if (filterState.hasDisciplinas) {
      data = data.filter(c => {
        const discs = (c.disciplinas || '').split(',').map(s => s.trim()).filter(Boolean);
        const has = discs.length > 0;
        return filterState.hasDisciplinas === 'sim' ? has : !has;
      });
    }
    return data;
  }

  function hasActiveFilters() {
    return filterState.text.trim() !== '' || filterState.carga !== '' || filterState.hasDisciplinas !== '';
  }

  function updateChips() {
    const chipsEl = outlet.querySelector('#filter-chips');
    if (!chipsEl) return;
    const chips = [];
    if (filterState.text.trim()) chips.push({ key: '_text', label: `"${filterState.text.trim()}"` });
    if (filterState.carga) {
      const labels = { curta: 'Carga: < 200h', media: 'Carga: 200h-1000h', longa: 'Carga: > 1000h' };
      chips.push({ key: 'carga', label: labels[filterState.carga] });
    }
    if (filterState.hasDisciplinas) {
      chips.push({ key: 'hasDisciplinas', label: filterState.hasDisciplinas === 'sim' ? 'Com disciplinas' : 'Sem disciplinas' });
    }

    chipsEl.innerHTML = chips.map(c => `
      <span class="filter-chip">
        ${escapeHtml(c.label)}
        <button data-clear-chip="${c.key}" title="Remover filtro" aria-label="Remover filtro ${escapeHtml(c.label)}">×</button>
      </span>`).join('');

    // Update active filters badge count (excluding text search)
    const selectCount = [filterState.carga, filterState.hasDisciplinas].filter(Boolean).length;
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
        } else if (key === 'carga') {
          filterState.carga = '';
          const sel = outlet.querySelector('#filter-carga');
          if (sel) sel.value = '';
        } else if (key === 'hasDisciplinas') {
          filterState.hasDisciplinas = '';
          const sel = outlet.querySelector('#filter-has-disciplinas');
          if (sel) sel.value = '';
        }
        refreshTable();
      });
    });
  }

  function refreshTable() {
    const allData = cursos.getAll();
    const emptyState = outlet.querySelector('#cursos-empty-state');
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
  outlet.querySelector('#btn-novo-curso')?.addEventListener('click', () => openForm(null));
  outlet.querySelector('#btn-novo-curso-es')?.addEventListener('click', () => openForm(null));

  outlet.querySelector('#filter-text')?.addEventListener('input', debounce((e) => {
    filterState.text = e.target.value;
    refreshTable();
  }, 300));

  outlet.querySelector('#filter-carga')?.addEventListener('change', (e) => {
    filterState.carga = e.target.value;
    refreshTable();
  });

  outlet.querySelector('#filter-has-disciplinas')?.addEventListener('change', (e) => {
    filterState.hasDisciplinas = e.target.value;
    refreshTable();
  });

  outlet.querySelector('#btn-limpar-filtros')?.addEventListener('click', () => {
    filterState.text = '';
    filterState.carga = '';
    filterState.hasDisciplinas = '';
    const ti = outlet.querySelector('#filter-text');
    if (ti) ti.value = '';
    const cg = outlet.querySelector('#filter-carga');
    if (cg) cg.value = '';
    const hd = outlet.querySelector('#filter-has-disciplinas');
    if (hd) hd.value = '';
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
    if (edit) openForm(cursos.getById(edit));
    if (del) confirmDelete(del);
  });

  initRipple(outlet);

  // ── Open Form ─────────────────────────────────────────
  function openForm(curso = null) {
    const isEdit = !!curso;

    const body = `
      <form id="curso-form" novalidate autocomplete="off">
        <div class="form-grid">
          <div class="form-group full-width">
            <label class="form-label" for="c-nome">Nome do Curso <span class="required">*</span></label>
            <input class="form-control" id="c-nome" name="nome" type="text"
              placeholder="Ex: Ensino Médio Regular"
              value="${escapeHtml(curso?.nome || '')}" required />
          </div>
          <div class="form-group">
            <label class="form-label" for="c-carga">Carga Horária (horas)</label>
            <input class="form-control" id="c-carga" name="cargaHoraria" type="number" min="1"
              placeholder="Ex: 1000" value="${escapeHtml(curso?.cargaHoraria || '')}" />
          </div>
          <div class="form-group full-width">
            <label class="form-label" for="c-desc">Descrição</label>
            <textarea class="form-control" id="c-desc" name="descricao" rows="2"
              placeholder="Resumo sobre a ementa do curso...">${escapeHtml(curso?.descricao || '')}</textarea>
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
      title: isEdit ? 'Editar Curso' : 'Novo Curso',
      body,
      footer
    });

    const bodyEl = modal.shadowRoot;
    const form = bodyEl?.querySelector('#curso-form');

    const draftKey = isEdit ? `curso-edit-${curso.id}` : 'curso-novo';
    if (form && !isEdit) formDraft.restore(draftKey, form);
    form?.addEventListener('input', () => formDraft.save(draftKey, form));
    form?.addEventListener('change', () => formDraft.save(draftKey, form));

    bodyEl?.querySelector('#m-cancel')?.addEventListener('click', () => {
      formDraft.clear(draftKey);
      modal.close();
    });

    bodyEl?.querySelector('#m-save')?.addEventListener('click', async () => {
      const data = modal.getFormData('#curso-form');
      
      if (!data.nome?.trim()) {
        window.toast?.error('Campo obrigatório', 'Por favor, preencha o Nome do Curso.');
        return;
      }

      if (isEdit) {
        const confirmed = await showConfirm(modal, {
          title: 'Confirmar Edição',
          message: `Deseja salvar as alterações no curso <strong>${escapeHtml(data.nome)}</strong>?`,
          confirmText: 'Salvar alterações'
        });
        if (!confirmed) return;

        cursos.update(curso.id, data);
        addLog('UPDATE', 'Curso', { id: curso.id, nome: data.nome });
        window.toast?.success('Curso atualizado!', '');
      } else {
        cursos.create(data);
        addLog('CREATE', 'Curso', { nome: data.nome });
        window.toast?.success('Curso cadastrado!', '');
      }

      formDraft.clear(draftKey);
      modal.close();
      refreshTable();
    });
  }

  // ── Exclusão ──────────────────────────────────────────
  async function confirmDelete(id) {
    const item = cursos.getById(id);
    if (!item) return;

    const result = await showSecureConfirm(modal, {
      title: 'Excluir Curso',
      message: `Você tem certeza que deseja excluir o curso <strong>${escapeHtml(item.nome)}</strong>? Esta ação exige sua senha pessoal.`,
      confirmText: 'Confirmar e Excluir'
    });

    if (result) {
      cursos.delete(id);
      addLog('DELETE', 'Curso', { id, nome: item.nome });
      window.toast?.success('Curso excluído!', '');
      refreshTable();
    }
  }
}
