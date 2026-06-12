// EduPresença v2 – Unidades Page (with dynamic filters & BrasilAPI address fields)
import { auth, addLog, unidades } from '../store.js';
import { escapeHtml, initRipple, filterByText, debounce, formDraft, showConfirm, showSecureConfirm } from '../utils.js';

const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

export function render(outlet) {
  const modalId = 'unidades-modal';
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
          <h1 class="page-title">Unidades Educacionais</h1>
          <p class="page-subtitle">Escolas e centros de ensino cadastrados no sistema</p>
        </div>
        <div class="page-header-actions">
          ${auth.isGestor() ? `
          <button class="btn btn-primary" id="btn-nova-unidade">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nova
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
              placeholder="Buscar por nome, diretor ou endereço..."
              style="padding-left:34px;height:38px;font-size:13px"
              aria-label="Buscar unidade" />
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
                <label class="form-label" style="font-size:11.5px; font-weight:600; color:var(--text-secondary); margin-bottom:4px;">UF</label>
                <select id="filter-uf" class="form-control" style="height:36px; font-size:12.5px;">
                  <option value="">Todas as UFs</option>
                  ${[...new Set(unidades.getAll().map(u => u.uf).filter(Boolean))].sort().map(uf => `<option value="${uf}">${uf}</option>`).join('')}
                </select>
              </div>
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label" style="font-size:11.5px; font-weight:600; color:var(--text-secondary); margin-bottom:4px;">Cidade</label>
                <select id="filter-cidade" class="form-control" style="height:36px; font-size:12.5px;">
                  <option value="">Todas as cidades</option>
                  ${[...new Set(unidades.getAll().map(u => u.cidade).filter(Boolean))].sort().map(c => `<option value="${c}">${c}</option>`).join('')}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state (shown when no units at all) -->
      <div id="unidades-empty-state" hidden>
        <div class="empty-state-page">
          <div class="esp-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h3>Nenhuma unidade educacional cadastrada.</h3>
          <p>Cadastre as escolas ou centros de ensino da sua rede. As unidades são necessárias para criar turmas.</p>
          ${auth.isGestor() ? `
          <button class="btn btn-primary" id="btn-nova-unidade-es">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Cadastrar Unidade
          </button>
          ` : '<p>Consulte a coordenação para realizar novos cadastros.</p>'}
        </div>
      </div>

      <!-- Table Wrapper -->
      <div class="table-container" id="table-wrapper">
        <data-table id="unidades-table" per-page="10"></data-table>
      </div>
    </div>
  `;

  const table = outlet.querySelector('#unidades-table');

  const columns = [
    { label: 'Nome', key: 'nome', render: (v) => `<strong>${escapeHtml(v)}</strong>` },
    { label: 'Diretor(a)', key: 'diretor', render: (v) => escapeHtml(v || '—') },
    { 
      label: 'Endereço', 
      key: 'endereco', 
      render: (v, u) => {
        if (u.rua) {
          return `<span style="color:var(--text-secondary);font-size:12px">${escapeHtml(`${u.rua}, ${u.numero || 'S/N'}${u.bairro ? ` - ${u.bairro}` : ''}, ${u.cidade || ''} - ${u.uf || ''}${u.cep ? ` (CEP ${u.cep})` : ''}`)}</span>`;
        }
        return `<span style="color:var(--text-secondary);font-size:12px">${escapeHtml(v || '—')}</span>`;
      } 
    },
    { label: 'Telefone', key: 'telefone', render: (v) => escapeHtml(v || '—') },
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
  const filterState = { text: '', uf: '', cidade: '' };

  function getFilteredData() {
    let data = unidades.getAll().sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
    if (filterState.text.trim()) {
      data = filterByText(data, filterState.text);
    }
    if (filterState.uf) {
      data = data.filter(u => u.uf === filterState.uf);
    }
    if (filterState.cidade) {
      data = data.filter(u => u.cidade === filterState.cidade);
    }
    return data;
  }

  function hasActiveFilters() {
    return filterState.text.trim() !== '' || filterState.uf !== '' || filterState.cidade !== '';
  }

  function updateChips() {
    const chipsEl = outlet.querySelector('#filter-chips');
    if (!chipsEl) return;
    const chips = [];
    if (filterState.text.trim()) chips.push({ key: '_text', label: `"${filterState.text.trim()}"` });
    if (filterState.uf) chips.push({ key: 'uf', label: `UF: ${filterState.uf}` });
    if (filterState.cidade) chips.push({ key: 'cidade', label: `Cidade: ${filterState.cidade}` });

    chipsEl.innerHTML = chips.map(c => `
      <span class="filter-chip">
        ${escapeHtml(c.label)}
        <button data-clear-chip="${c.key}" title="Remover filtro" aria-label="Remover filtro ${escapeHtml(c.label)}">×</button>
      </span>`).join('');

    // Update active filters badge count (excluding text search)
    const selectCount = [filterState.uf, filterState.cidade].filter(Boolean).length;
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
        } else if (key === 'uf') {
          filterState.uf = '';
          const sel = outlet.querySelector('#filter-uf');
          if (sel) sel.value = '';
        } else if (key === 'cidade') {
          filterState.cidade = '';
          const sel = outlet.querySelector('#filter-cidade');
          if (sel) sel.value = '';
        }
        refreshTable();
      });
    });
  }

  function updateFilterCityOptions() {
    const citySel = outlet.querySelector('#filter-cidade');
    if (!citySel) return;
    
    const selectedUf = filterState.uf;
    let filteredUnits = unidades.getAll();
    if (selectedUf) {
      filteredUnits = filteredUnits.filter(u => u.uf === selectedUf);
    }
    
    const uniqueCities = [...new Set(filteredUnits.map(u => u.cidade).filter(Boolean))].sort();
    citySel.innerHTML = '<option value="">Todas as cidades</option>' + 
      uniqueCities.map(c => `<option value="${escapeHtml(c)}" ${filterState.cidade === c ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('');
  }

  function refreshTable() {
    const allData = unidades.getAll();
    const emptyState = outlet.querySelector('#unidades-empty-state');
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
  outlet.querySelector('#btn-nova-unidade')?.addEventListener('click', () => openForm(null));
  outlet.querySelector('#btn-nova-unidade-es')?.addEventListener('click', () => openForm(null));

  outlet.querySelector('#filter-text')?.addEventListener('input', debounce((e) => {
    filterState.text = e.target.value;
    refreshTable();
  }, 300));

  outlet.querySelector('#filter-uf')?.addEventListener('change', (e) => {
    filterState.uf = e.target.value;
    filterState.cidade = '';
    const citySel = outlet.querySelector('#filter-cidade');
    if (citySel) citySel.value = '';
    updateFilterCityOptions();
    refreshTable();
  });

  outlet.querySelector('#filter-cidade')?.addEventListener('change', (e) => {
    filterState.cidade = e.target.value;
    refreshTable();
  });

  outlet.querySelector('#btn-limpar-filtros')?.addEventListener('click', () => {
    filterState.text = '';
    filterState.uf = '';
    filterState.cidade = '';
    const ti = outlet.querySelector('#filter-text');
    if (ti) ti.value = '';
    const ufS = outlet.querySelector('#filter-uf');
    if (ufS) ufS.value = '';
    const ciS = outlet.querySelector('#filter-cidade');
    if (ciS) ciS.value = '';
    updateFilterCityOptions();
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
    if (edit) openForm(unidades.getById(edit));
    if (del) confirmDelete(del);
  });

  initRipple(outlet);

  // ── Open Form ─────────────────────────────────────────
  function openForm(unidade = null) {
    const isEdit = !!unidade;
    const globalCfg = (function() { try { return JSON.parse(localStorage.getItem('edu_config') || '{}'); } catch { return {}; } })();
    const defaultUf = unidade?.uf || globalCfg.uf || '';

    const body = `
      <form id="unidade-form" novalidate autocomplete="off">
        <div class="form-grid">
          <div class="form-group full-width">
            <label class="form-label" for="u-nome">Nome da Unidade <span class="required">*</span></label>
            <input class="form-control" id="u-nome" name="nome" type="text"
              placeholder="Ex: Escola Estadual Prof. João Silva"
              value="${escapeHtml(unidade?.nome || '')}" required />
          </div>
          <div class="form-group">
            <label class="form-label" for="u-diretor">Diretor(a) <span class="required">*</span></label>
            <input class="form-control" id="u-diretor" name="diretor" type="text"
              placeholder="Nome do diretor(a)" value="${escapeHtml(unidade?.diretor || '')}" required />
          </div>
          <div class="form-group">
            <label class="form-label" for="u-telefone">Telefone</label>
            <input class="form-control" id="u-telefone" name="telefone" type="tel"
              placeholder="(11) 3456-7890" value="${escapeHtml(unidade?.telefone || '')}" />
          </div>

          <!-- Endereço Estruturado com API -->
          <div class="form-group">
            <label class="form-label" for="u-cep">CEP</label>
            <input class="form-control" id="u-cep" name="cep" type="text" maxlength="9"
              placeholder="00000-000" value="${escapeHtml(unidade?.cep || '')}" />
          </div>
          <div class="form-group">
            <label class="form-label" for="u-uf">Estado (UF) <span class="required">*</span></label>
            <select class="form-control" id="u-uf" name="uf" required>
              <option value="">Selecione o estado</option>
              ${UFS.map(uf => `<option value="${uf}" ${defaultUf === uf ? 'selected' : ''}>${uf}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="u-cidade">Cidade <span class="required">*</span></label>
            <select class="form-control" id="u-cidade" name="cidade" required disabled>
              <option value="">Selecione a cidade</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="u-bairro">Bairro</label>
            <input class="form-control" id="u-bairro" name="bairro" type="text"
              placeholder="Bairro" value="${escapeHtml(unidade?.bairro || '')}" />
          </div>
          <div class="form-group" style="grid-column: span 2;">
            <label class="form-label" for="u-rua">Rua/Logradouro</label>
            <input class="form-control" id="u-rua" name="rua" type="text"
              placeholder="Rua, avenida, etc." value="${escapeHtml(unidade?.rua || '')}" />
          </div>
          <div class="form-group">
            <label class="form-label" for="u-numero">Número</label>
            <input class="form-control" id="u-numero" name="numero" type="text"
              placeholder="Número / S/N" value="${escapeHtml(unidade?.numero || '')}" />
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
      title: isEdit ? 'Editar Unidade' : 'Nova Unidade',
      body,
      footer
    });

    const bodyEl = modal.shadowRoot;
    const form = bodyEl?.querySelector('#unidade-form');

    // Auto-save drafts
    const draftKey = isEdit ? `unidade-edit-${unidade.id}` : 'unidade-novo';
    if (form && !isEdit) formDraft.restore(draftKey, form);
    form?.addEventListener('input', () => formDraft.save(draftKey, form));
    form?.addEventListener('change', () => formDraft.save(draftKey, form));

    const ufSelect = bodyEl?.querySelector('#u-uf');
    const citySelect = bodyEl?.querySelector('#u-cidade');
    const cepInput = bodyEl?.querySelector('#u-cep');

    // CEP input formatting
    cepInput?.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '').slice(0, 8);
      if (v.length > 5) v = v.replace(/^(\d{5})(\d)/, '$1-$2');
      e.target.value = v;
    });

    async function loadCities(uf, selectedCity) {
      if (!citySelect) return;
      citySelect.innerHTML = '<option value="">Carregando...</option>';
      citySelect.disabled = true;
      try {
        const res = await fetch(`https://brasilapi.com.br/api/ibge/municipios/v1/${uf}?providers=dados-abertos-br,gov,wikipedia`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        data.sort((a, b) => a.nome.localeCompare(b.nome));
        citySelect.innerHTML = '<option value="">Selecione a cidade</option>' + 
          data.map(c => `<option value="${escapeHtml(c.nome)}" ${c.nome.toUpperCase() === selectedCity.toUpperCase() ? 'selected' : ''}>${escapeHtml(c.nome)}</option>`).join('');
        citySelect.disabled = false;
      } catch (e) {
        citySelect.innerHTML = `
          <option value="">Cidades indisponíveis</option>
          <option value="SÃO PAULO" ${selectedCity.toUpperCase() === 'SÃO PAULO' ? 'selected' : ''}>SÃO PAULO</option>
          <option value="RIO DE JANEIRO" ${selectedCity.toUpperCase() === 'RIO DE JANEIRO' ? 'selected' : ''}>RIO DE JANEIRO</option>
        `;
        citySelect.disabled = false;
      }
    }

    if (ufSelect) {
      ufSelect.addEventListener('change', () => {
        loadCities(ufSelect.value, '');
      });
      // Initial load
      if (ufSelect.value) {
        loadCities(ufSelect.value, unidade?.cidade || '');
      }
    }

    bodyEl?.querySelector('#m-cancel')?.addEventListener('click', () => {
      formDraft.clear(draftKey);
      modal.close();
    });

    bodyEl?.querySelector('#m-save')?.addEventListener('click', async () => {
      const data = modal.getFormData('#unidade-form');
      
      // Fields validation
      if (!data.nome?.trim() || !data.diretor?.trim() || !data.uf || !data.cidade) {
        window.toast?.error('Campos obrigatórios', 'Por favor, preencha o Nome, Diretor, Estado e Cidade.');
        return;
      }

      if (isEdit) {
        const confirmed = await showConfirm(modal, {
          title: 'Confirmar Edição',
          message: `Deseja salvar as alterações em <strong>${escapeHtml(data.nome)}</strong>?`,
          confirmText: 'Salvar alterações'
        });
        if (!confirmed) return;

        unidades.update(unidade.id, data);
        addLog('UPDATE', 'Unidade', { id: unidade.id, nome: data.nome });
        window.toast?.success('Unidade atualizada!', '');
      } else {
        unidades.create(data);
        addLog('CREATE', 'Unidade', { nome: data.nome });
        window.toast?.success('Unidade cadastrada!', '');
      }

      formDraft.clear(draftKey);
      modal.close();
      refreshTable();
    });
  }

  // ── Exclusão ──────────────────────────────────────────
  async function confirmDelete(id) {
    const item = unidades.getById(id);
    if (!item) return;

    const result = await showSecureConfirm(modal, {
      title: 'Excluir Unidade',
      message: `Você tem certeza que deseja excluir a unidade <strong>${escapeHtml(item.nome)}</strong>? Esta ação exige sua senha pessoal.`,
      confirmText: 'Confirmar e Excluir'
    });

    if (result) {
      unidades.delete(id);
      addLog('DELETE', 'Unidade', { id, nome: item.nome });
      window.toast?.success('Unidade excluída!', '');
      refreshTable();
    }
  }
}
