// EduPresença v2 – Audit Logs Page (with dynamic advanced filters & Escape shortcut)
import { logs } from '../store.js';
import { formatDate, relativeTime, escapeHtml, exportToCSV, initRipple, debounce, filterByText } from '../utils.js';

export function render(outlet) {
  const getLogs = () => logs.getAll().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Extract unique values for filters
  const uniqueEntities = [...new Set(logs.getAll().map(l => l.entity).filter(Boolean))].sort();
  const uniqueRoles = [...new Set(logs.getAll().map(l => l.userRole).filter(Boolean))].sort();

  outlet.innerHTML = `
    <div class="stagger-children">
      <div class="page-header">
        <div class="page-header-left">
          <h1 class="page-title">Logs de Auditoria</h1>
          <p class="page-subtitle">Histórico completo de ações realizadas no sistema</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-secondary" id="btn-export-logs">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Exportar CSV
          </button>
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
              placeholder="Buscar por usuário ou detalhes..."
              style="padding-left:34px;height:38px;font-size:13px"
              aria-label="Buscar logs" />
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
                <label class="form-label" style="font-size:11.5px; font-weight:600; color:var(--text-secondary); margin-bottom:4px;">Ação</label>
                <select id="filter-action" class="form-control" style="height:36px; font-size:12.5px;">
                  <option value="">Todas as ações</option>
                  <option value="CREATE">Inclusão (CREATE)</option>
                  <option value="UPDATE">Edição (UPDATE)</option>
                  <option value="DELETE">Exclusão (DELETE)</option>
                  <option value="LOGIN">Autenticação (LOGIN)</option>
                </select>
              </div>
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label" style="font-size:11.5px; font-weight:600; color:var(--text-secondary); margin-bottom:4px;">Entidade</label>
                <select id="filter-entity" class="form-control" style="height:36px; font-size:12.5px;">
                  <option value="">Todas as entidades</option>
                  ${uniqueEntities.map(ent => `<option value="${ent}">${escapeHtml(ent)}</option>`).join('')}
                </select>
              </div>
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label" style="font-size:11.5px; font-weight:600; color:var(--text-secondary); margin-bottom:4px;">Perfil</label>
                <select id="filter-user-role" class="form-control" style="height:36px; font-size:12.5px;">
                  <option value="">Todos os perfis</option>
                  ${uniqueRoles.map(role => `<option value="${role}">${escapeHtml(role.toUpperCase())}</option>`).join('')}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="table-container">
        <data-table id="logs-table" per-page="15"></data-table>
      </div>
    </div>
  `;

  const table = outlet.querySelector('#logs-table');
  const columns = [
    { 
      label: 'Data/Hora', key: 'timestamp', 
      render: (val) => `
        <div>
          <div style="font-weight:600;color:var(--text-primary)">${formatDate(val, { hour: '2-digit', minute: '2-digit' })}</div>
          <div style="font-size:11px;color:var(--text-tertiary)">${relativeTime(val)}</div>
        </div>`
    },
    { 
      label: 'Usuário', key: 'userName',
      render: (val, row) => `
        <div style="display:flex;align-items:center;gap:8px">
          <div class="badge badge-neutral" style="font-size:10px;text-transform:uppercase;letter-spacing:0.05em">
            ${row.userRole || 'user'}
          </div>
          <span style="font-weight:500;color:var(--text-secondary)">${escapeHtml(val)}</span>
        </div>`
    },
    { 
      label: 'Ação', key: 'action',
      render: (val) => {
        const colors = { CREATE: '#34d399', UPDATE: '#fbbf24', DELETE: '#f87171', LOGIN: '#818cf8' };
        const labels = { CREATE: 'Inclusão', UPDATE: 'Edição', DELETE: 'Exclusão', LOGIN: 'Login' };
        const color = colors[val] || '#94a3b8';
        return `
          <span class="badge" style="background:rgba(0,0,0,0.2);color:${color};border:1px solid ${color}40">
            ${labels[val] || val}
          </span>`;
      }
    },
    { 
      label: 'Entidade', key: 'entity',
      render: (val) => `<span style="font-weight:600;color:var(--text-primary)">${escapeHtml(val || '—')}</span>`
    },
    { 
      label: 'Detalhes', key: 'details',
      render: (val) => {
        if (!val) return '<span style="color:var(--text-tertiary)">—</span>';
        const str = typeof val === 'string' ? val : JSON.stringify(val);
        return `
          <div style="font-size:12px;color:var(--text-tertiary);max-width:320px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${escapeHtml(str)}">
            ${escapeHtml(str)}
          </div>`;
      }
    }
  ];

  table.setColumns(columns);

  // ── Filter State ──────────────────────────────────────
  const filterState = { text: '', action: '', entity: '', userRole: '' };

  function getFilteredData() {
    let data = getLogs();
    if (filterState.text.trim()) {
      data = filterByText(data, filterState.text);
    }
    if (filterState.action) {
      data = data.filter(l => l.action === filterState.action);
    }
    if (filterState.entity) {
      data = data.filter(l => l.entity === filterState.entity);
    }
    if (filterState.userRole) {
      data = data.filter(l => l.userRole === filterState.userRole);
    }
    return data;
  }

  function hasActiveFilters() {
    return filterState.text.trim() !== '' || filterState.action !== '' || filterState.entity !== '' || filterState.userRole !== '';
  }

  function updateChips() {
    const chipsEl = outlet.querySelector('#filter-chips');
    if (!chipsEl) return;
    const chips = [];
    if (filterState.text.trim()) chips.push({ key: '_text', label: `"${filterState.text.trim()}"` });
    if (filterState.action) chips.push({ key: 'action', label: `Ação: ${filterState.action}` });
    if (filterState.entity) chips.push({ key: 'entity', label: `Entidade: ${filterState.entity}` });
    if (filterState.userRole) chips.push({ key: 'userRole', label: `Perfil: ${filterState.userRole.toUpperCase()}` });

    chipsEl.innerHTML = chips.map(c => `
      <span class="filter-chip">
        ${escapeHtml(c.label)}
        <button data-clear-chip="${c.key}" title="Remover filtro" aria-label="Remover filtro ${escapeHtml(c.label)}">×</button>
      </span>`).join('');

    // Update active filters badge count (excluding text search)
    const selectCount = [filterState.action, filterState.entity, filterState.userRole].filter(Boolean).length;
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
        } else if (key === 'action') {
          filterState.action = '';
          const sel = outlet.querySelector('#filter-action');
          if (sel) sel.value = '';
        } else if (key === 'entity') {
          filterState.entity = '';
          const sel = outlet.querySelector('#filter-entity');
          if (sel) sel.value = '';
        } else if (key === 'userRole') {
          filterState.userRole = '';
          const sel = outlet.querySelector('#filter-user-role');
          if (sel) sel.value = '';
        }
        refreshTable();
      });
    });
  }

  function refreshTable() {
    updateChips();
    table.setData(getFilteredData());
  }

  refreshTable();

  // ── Events ────────────────────────────────────────────
  outlet.querySelector('#filter-text')?.addEventListener('input', debounce((e) => {
    filterState.text = e.target.value;
    refreshTable();
  }, 300));

  outlet.querySelector('#filter-action')?.addEventListener('change', (e) => {
    filterState.action = e.target.value;
    refreshTable();
  });

  outlet.querySelector('#filter-entity')?.addEventListener('change', (e) => {
    filterState.entity = e.target.value;
    refreshTable();
  });

  outlet.querySelector('#filter-user-role')?.addEventListener('change', (e) => {
    filterState.userRole = e.target.value;
    refreshTable();
  });

  outlet.querySelector('#btn-limpar-filtros')?.addEventListener('click', () => {
    filterState.text = '';
    filterState.action = '';
    filterState.entity = '';
    filterState.userRole = '';
    const ti = outlet.querySelector('#filter-text');
    if (ti) ti.value = '';
    const ac = outlet.querySelector('#filter-action');
    if (ac) ac.value = '';
    const et = outlet.querySelector('#filter-entity');
    if (et) et.value = '';
    const ur = outlet.querySelector('#filter-user-role');
    if (ur) ur.value = '';
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

  // Export filtered logs!
  outlet.querySelector('#btn-export-logs').onclick = () => {
    const currentData = getFilteredData();
    exportToCSV(currentData, `edupresenca-logs-${new Date().toISOString().split('T')[0]}`, [
      { label: 'Data', key: 'timestamp' },
      { label: 'Usuário', key: 'userName' },
      { label: 'Perfil', key: 'userRole' },
      { label: 'Ação', key: 'action' },
      { label: 'Entidade', key: 'entity' },
      { label: 'Detalhes', key: 'details' }
    ]);
  };

  initRipple(outlet);
}
