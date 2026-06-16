// =========================================================
// EduPresença v2 – Alunos Page (with filters: turma + situação)
// =========================================================
import { alunos, turmas, unidades, auth, addLog, KEYS, triggerCloudSync, isSyncUser } from '../store.js';
import { formatDate, escapeHtml, initRipple, getInitials, stringToHue, filterByText, debounce, formDraft, showConfirm, showSecureConfirm, calculateAge, compressImage } from '../utils.js';
import { openBoletim } from './boletim.js';

let modal;
let boletimModal;

export function render(outlet) {
  if (!document.getElementById('alunos-modal')) {
    modal = document.createElement('app-modal');
    modal.id = 'alunos-modal';
    document.body.appendChild(modal);
  } else {
    modal = document.getElementById('alunos-modal');
  }

  if (!document.getElementById('boletim-modal')) {
    boletimModal = document.createElement('app-modal');
    boletimModal.id = 'boletim-modal';
    document.body.appendChild(boletimModal);
  } else {
    boletimModal = document.getElementById('boletim-modal');
  }

  const allTurmas = turmas.getAll().sort((a, b) => a.nome.localeCompare(b.nome));
  const allUnidades = unidades.getAll().sort((a, b) => a.nome.localeCompare(b.nome));

  const me = auth.currentUser();
  const isProfessor = me && me.role === 'professor';
  let viewMode = isProfessor ? 'minhas' : 'todas';

  outlet.innerHTML = `
    <div class="stagger-children">
      <div class="page-header">
        <div class="page-header-left">
          <h1 class="page-title">Alunos</h1>
          <p class="page-subtitle">Gerencie os alunos cadastrados no sistema</p>
        </div>
        <div class="page-header-actions">
          ${auth.isGestor() ? `
            <button class="btn btn-secondary" id="btn-importar-csv" title="Importar alunos de arquivo .csv">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Importar CSV
            </button>
            <button class="btn btn-primary" id="btn-novo-aluno">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Novo Aluno
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
              placeholder="Buscar aluno por nome, e-mail ou CPF..."
              style="padding-left:34px;height:38px;font-size:13px"
              aria-label="Buscar aluno" />
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
                <label class="form-label" style="font-size:11.5px; font-weight:600; color:var(--text-secondary); margin-bottom:4px;">Turma</label>
                <select id="filter-turma" class="form-control" style="height:36px; font-size:12.5px;">
                  <option value="">Todas as turmas</option>
                  ${allTurmas.map(t => `<option value="${t.id}">${escapeHtml(t.nome)}</option>`).join('')}
                </select>
              </div>
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label" style="font-size:11.5px; font-weight:600; color:var(--text-secondary); margin-bottom:4px;">Situação</label>
                <select id="filter-situacao" class="form-control" style="height:36px; font-size:12.5px;">
                  <option value="">Todas as situações</option>
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label" style="font-size:11.5px; font-weight:600; color:var(--text-secondary); margin-bottom:4px;">Sexo</label>
                <select id="filter-sexo" class="form-control" style="height:36px; font-size:12.5px;">
                  <option value="">Todos os sexos</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label" style="font-size:11.5px; font-weight:600; color:var(--text-secondary); margin-bottom:4px;">Cor/Raça</label>
                <select id="filter-cor" class="form-control" style="height:36px; font-size:12.5px;">
                  <option value="">Todas as cores</option>
                  <option value="Branca">Branca</option>
                  <option value="Preta">Preta</option>
                  <option value="Parda">Parda</option>
                  <option value="Amarela">Amarela</option>
                  <option value="Indígena">Indígena</option>
                  <option value="Não declarado">Não declarado</option>
                </select>
              </div>
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label" style="font-size:11.5px; font-weight:600; color:var(--text-secondary); margin-bottom:4px;">UF</label>
                <select id="filter-uf" class="form-control" style="height:36px; font-size:12.5px;">
                  <option value="">Todas as UFs</option>
                  ${[...new Set(alunos.getAll().map(a => a.uf).filter(Boolean))].sort().map(uf => `<option value="${uf}">${uf}</option>`).join('')}
                </select>
              </div>
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label" style="font-size:11.5px; font-weight:600; color:var(--text-secondary); margin-bottom:4px;">Cidade</label>
                <select id="filter-cidade" class="form-control" style="height:36px; font-size:12.5px;">
                  <option value="">Todas as cidades</option>
                  ${[...new Set(alunos.getAll().map(a => a.cidade).filter(Boolean))].sort().map(c => `<option value="${c}">${c}</option>`).join('')}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state (shown when no alunos at all) -->
      <div id="alunos-empty-state" hidden>
        <div class="empty-state-page">
          <div class="esp-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <h3>Nenhum aluno cadastrado ainda.</h3>
          <p>Adicione os alunos ao sistema. Você precisará ter pelo menos uma turma cadastrada.</p>
          ${auth.isGestor() ? `
          <button class="btn btn-primary" id="btn-novo-aluno-es">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Cadastrar Aluno
          </button>
          ` : '<p>Consulte a secretaria para realizar novos cadastros.</p>'}
        </div>
      </div>

      <!-- Table -->
      <div class="table-container" id="table-wrapper">
        <data-table id="alunos-table" per-page="10"></data-table>
      </div>
    </div>
  `;

  const table = outlet.querySelector('#alunos-table');

  const columns = [
    {
      label: 'Aluno', key: 'nome',
      render: (val, row) => {
        const hue = stringToHue(val);
        const avatar = row.foto
          ? `<img src="${row.foto}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;flex-shrink:0" />`
          : `<div class="avatar avatar-sm" style="background:hsl(${hue},65%,45%);flex-shrink:0">${getInitials(val)}</div>`;
        
        let alertHtml = '';
        if (isProfessor) {
          const studentTurma = allTurmas.find(t => t.id === row.turmaId);
          const belongs = studentTurma && (me.cursos || []).includes(studentTurma.cursoId);
          if (!belongs) {
            alertHtml = `
              <span class="badge" style="margin-top: 4px; padding: 2px 6px; font-size: 10px; display: inline-flex; align-items: center; gap: 4px; border: 1px solid rgba(239, 68, 68, 0.15); background: rgba(239, 68, 68, 0.06); color: var(--danger-400);" title="Este aluno não está em suas turmas atribuídas.">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Sem Vínculo
              </span>`;
          }
        }

        return `
          <div style="display:flex;align-items:center;gap:10px">
            ${avatar}
            <div>
              <div style="font-weight:600;color:var(--text-primary);display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                ${escapeHtml(val)}
                ${alertHtml}
              </div>
              <div style="font-size:11px;color:var(--text-tertiary)">${escapeHtml(row.email || '—')}</div>
            </div>
          </div>`;
      }
    },
    {
      label: 'Turma', key: 'turmaId',
      render: (val) => {
        const t = allTurmas.find(t => t.id === val);
        return t ? `<span class="badge badge-primary">${escapeHtml(t.nome)}</span>` : '<span class="badge badge-neutral">—</span>';
      }
    },
    {
      label: 'Unidade', key: 'unidadeId',
      render: (val) => {
        const u = allUnidades.find(u => u.id === val);
        return u ? `<span style="font-size:12px;color:var(--text-secondary)">${escapeHtml(u.nome)}</span>` : '<span style="color:var(--text-tertiary)">—</span>';
      }
    },
    {
      label: 'Nasc. / Idade', key: 'dataNascimento',
      render: (val) => {
        if (!val) return '<span style="color:var(--text-tertiary)">—</span>';
        const age = calculateAge(val);
        return `<div>${formatDate(val)}</div>
                <div style="font-size:11px;color:var(--text-secondary)">${age !== null ? `${age} anos` : '—'}</div>`;
      }
    },
    {
      label: 'Perfil', key: 'sexo',
      render: (val, row) => {
        const s = row.sexo || 'Não informado';
        const c = row.cor || 'Não informado';
        return `<div>${escapeHtml(s)}</div>
                <div style="font-size:11px;color:var(--text-secondary)">${escapeHtml(c)}</div>`;
      }
    },
    {
      label: 'Situação', key: 'situacao',
      render: (val) => val === 'inativo'
        ? `<span class="badge badge-neutral badge-dot">Inativo</span>`
        : `<span class="badge badge-success badge-dot">Ativo</span>`
    },
    {
      label: 'Ações', key: 'id', sortable: false,
      render: (id) => {
        const isAdmin = auth.isAdmin();
        return `
        <div style="display:flex;gap:6px">
          <button class="btn btn-ghost btn-icon-sm" data-boletim="${id}" title="Ver Boletim" style="color:var(--accent-400,#818cf8)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          </button>
          ${auth.isGestor() ? `
          <button class="btn btn-ghost btn-icon-sm" data-edit="${id}" title="Editar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn btn-ghost btn-icon-sm" data-delete="${id}" title="Excluir" 
            style="color:${auth.isAdmin() ? 'var(--danger-400)' : 'var(--text-tertiary)'}; opacity:${auth.isAdmin() ? 1 : 0.5}"
            ${auth.isAdmin() ? '' : 'disabled'}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
          </button>
          ` : ''}
        </div>`;
      }
    },
  ];

  table.setColumns(columns);

  // ── Filter State ──────────────────────────────────────
  const filterState = { text: '', turmaId: '', situacao: '', sexo: '', cor: '', uf: '', cidade: '' };

  function getFilteredData() {
    let data = alunos.getAll().sort((a, b) => a.nome.localeCompare(b.nome));

    // Apply role-based and viewMode-based filtering for Meus Alunos
    if (isProfessor && viewMode === 'minhas') {
      const meusCursos = me.cursos || [];
      data = data.filter(a => {
        const t = allTurmas.find(turma => turma.id === a.turmaId);
        return t && meusCursos.includes(t.cursoId);
      });
    }

    if (filterState.text.trim()) data = filterByText(data, filterState.text);
    if (filterState.turmaId) data = data.filter(a => a.turmaId === filterState.turmaId);
    if (filterState.situacao) {
      data = data.filter(a => (a.situacao || 'ativo') === filterState.situacao);
    }
    if (filterState.sexo) {
      data = data.filter(a => (a.sexo || 'Não informado') === filterState.sexo);
    }
    if (filterState.cor) {
      data = data.filter(a => (a.cor || 'Não informado') === filterState.cor);
    }
    if (filterState.uf) {
      data = data.filter(a => (a.uf || '') === filterState.uf);
    }
    if (filterState.cidade) {
      data = data.filter(a => (a.cidade || '') === filterState.cidade);
    }
    return data;
  }

  function hasActiveFilters() {
    return filterState.text.trim() !== '' || filterState.turmaId !== '' || filterState.situacao !== '' || filterState.sexo !== '' || filterState.cor !== '' || filterState.uf !== '' || filterState.cidade !== '';
  }

  function updateChips() {
    const chipsEl = outlet.querySelector('#filter-chips');
    if (!chipsEl) return;
    const chips = [];
    if (filterState.text.trim()) chips.push({ key: '_text', label: `"${filterState.text.trim()}"` });
    if (filterState.turmaId) {
      const t = allTurmas.find(t => t.id === filterState.turmaId);
      chips.push({ key: 'turmaId', label: `Turma: ${t?.nome || filterState.turmaId}` });
    }
    if (filterState.situacao) {
      chips.push({ key: 'situacao', label: `Situação: ${filterState.situacao === 'ativo' ? 'Ativo' : 'Inativo'}` });
    }
    if (filterState.sexo) {
      chips.push({ key: 'sexo', label: `Sexo: ${filterState.sexo}` });
    }
    if (filterState.cor) {
      chips.push({ key: 'cor', label: `Cor/Raça: ${filterState.cor}` });
    }
    if (filterState.uf) {
      chips.push({ key: 'uf', label: `UF: ${filterState.uf}` });
    }
    if (filterState.cidade) {
      chips.push({ key: 'cidade', label: `Cidade: ${filterState.cidade}` });
    }
    chipsEl.innerHTML = chips.map(c => `
      <span class="filter-chip">
        ${escapeHtml(c.label)}
        <button data-clear-chip="${c.key}" title="Remover filtro" aria-label="Remover filtro ${escapeHtml(c.label)}">×</button>
      </span>`).join('');

    // Update active filters badge count (excluding text search)
    const selectCount = [
      filterState.turmaId, 
      filterState.situacao, 
      filterState.sexo, 
      filterState.cor, 
      filterState.uf, 
      filterState.cidade
    ].filter(Boolean).length;

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
        } else if (key === 'turmaId') {
          filterState.turmaId = '';
          const sel = outlet.querySelector('#filter-turma');
          if (sel) sel.value = '';
        } else if (key === 'situacao') {
          filterState.situacao = '';
          const sel = outlet.querySelector('#filter-situacao');
          if (sel) sel.value = '';
        } else if (key === 'sexo') {
          filterState.sexo = '';
          const sel = outlet.querySelector('#filter-sexo');
          if (sel) sel.value = '';
        } else if (key === 'cor') {
          filterState.cor = '';
          const sel = outlet.querySelector('#filter-cor');
          if (sel) sel.value = '';
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
    let filteredAlunos = alunos.getAll();
    if (selectedUf) {
      filteredAlunos = filteredAlunos.filter(a => a.uf === selectedUf);
    }
    
    const uniqueCities = [...new Set(filteredAlunos.map(a => a.cidade).filter(Boolean))].sort();
    
    citySel.innerHTML = '<option value="">Todas as cidades</option>' + 
      uniqueCities.map(c => `<option value="${escapeHtml(c)}" ${filterState.cidade === c ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('');
  }

  function refreshTable() {
    const allData = alunos.getAll();
    const emptyState = outlet.querySelector('#alunos-empty-state');
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

  // Events
  outlet.querySelector('#btn-novo-aluno')?.addEventListener('click', () => openForm(null));
  outlet.querySelector('#btn-novo-aluno-es')?.addEventListener('click', () => openForm(null));

  // ── CSV Import ────────────────────────────────────────
  const csvInput = document.createElement('input');
  csvInput.type = 'file';
  csvInput.accept = '.csv,text/csv';

  outlet.querySelector('#btn-importar-csv')?.addEventListener('click', () => csvInput.click());

  csvInput.addEventListener('change', async () => {
    const file = csvInput.files[0];
    if (!file) return;
    csvInput.value = '';

    const text = await file.text();
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      window.toast?.warning('CSV vazio', 'O arquivo não contém dados suficientes.');
      return;
    }

    // Detect header row
    const header = parseCsvLine(lines[0]).map(h => h.trim().toLowerCase().replace(/[\"']/g, ''));
    const dataLines = lines.slice(1);

    const nomeIdx       = header.findIndex(h => h.includes('nome'));
    if (nomeIdx === -1) {
      window.toast?.error('Formato inválido', 'Coluna "nome" não encontrada. Verifique o cabeçalho do CSV.');
      return;
    }
    const emailIdx      = header.findIndex(h => h.includes('email'));
    const turmaIdx      = header.findIndex(h => h.includes('turma'));
    const matriculaIdx  = header.findIndex(h => h.includes('matr'));
    const nascimentoIdx = header.findIndex(h => h.includes('nasc'));
    const telefoneIdx   = header.findIndex(h => h.includes('tel') || h.includes('fone'));
    const situacaoIdx   = header.findIndex(h => h.includes('situa'));
    const sexoIdx       = header.findIndex(h => h.includes('sexo') || h.includes('genero'));
    const corIdx        = header.findIndex(h => h.includes('cor') || h.includes('raça') || h.includes('raca'));

    const allTurmasData = turmas.getAll();
    let imported = 0, skipped = 0;

    dataLines.forEach(line => {
      const cols = parseCsvLine(line);
      const nome = cols[nomeIdx]?.replace(/["']/g, '').trim();
      if (!nome) { skipped++; return; }

      // Resolve turma by name or id
      let turmaId = '';
      if (turmaIdx >= 0) {
        const turmaNome = cols[turmaIdx]?.replace(/["']/g, '').trim() || '';
        const found = allTurmasData.find(t =>
          t.id === turmaNome ||
          t.nome.toLowerCase() === turmaNome.toLowerCase() ||
          t.nome.toLowerCase().includes(turmaNome.toLowerCase())
        );
        if (found) turmaId = found.id;
      }

      // Normalize situacao
      const situacaoRaw = (situacaoIdx >= 0 ? cols[situacaoIdx] : '').replace(/["']/g, '').trim().toLowerCase();
      const situacao = situacaoRaw === 'inativo' ? 'inativo' : 'ativo';

      // Normalize sex
      let sexo = sexoIdx >= 0 ? cols[sexoIdx]?.replace(/["']/g, '').trim() : '';
      if (sexo) {
        if (/^m/i.test(sexo)) sexo = 'Masculino';
        else if (/^f/i.test(sexo)) sexo = 'Feminino';
        else sexo = 'Outro';
      } else {
        sexo = 'Outro';
      }

      // Normalize color
      let cor = corIdx >= 0 ? cols[corIdx]?.replace(/["']/g, '').trim() : '';
      if (cor) {
        const lower = cor.toLowerCase();
        if (lower.includes('branc')) cor = 'Branca';
        else if (lower.includes('pret')) cor = 'Preta';
        else if (lower.includes('pard')) cor = 'Parda';
        else if (lower.includes('amar')) cor = 'Amarela';
        else if (lower.includes('indig') || lower.includes('indíg')) cor = 'Indígena';
        else cor = 'Não declarado';
      } else {
        cor = 'Não declarado';
      }

      alunos.create({
        nome,
        email:          emailIdx >= 0      ? cols[emailIdx]?.replace(/["']/g, '').trim()      || '' : '',
        matricula:      matriculaIdx >= 0  ? cols[matriculaIdx]?.replace(/["']/g, '').trim()  || '' : '',
        turmaId,
        dataNascimento: nascimentoIdx >= 0 ? cols[nascimentoIdx]?.replace(/["']/g, '').trim() || '' : '',
        telefone:       telefoneIdx >= 0   ? cols[telefoneIdx]?.replace(/["']/g, '').trim()   || '' : '',
        situacao,
        sexo,
        cor,
      });
      imported++;
    });

    if (imported > 0) {
      window.toast?.success(
        'Importação concluída!',
        `${imported} aluno(s) importado(s)${skipped ? `, ${skipped} linha(s) ignorada(s)` : ''}.`
      );
      refreshTable();
    } else {
      window.toast?.warning(
        'Nenhum aluno importado',
        `${skipped} linha(s) ignorada(s) por falta do campo nome.`
      );
    }
  });

  // CSV helper: parse one line respecting quoted fields
  function parseCsvLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if ((ch === ',' || ch === ';') && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current);
    return result;
  }

  outlet.querySelector('#filter-text')?.addEventListener('input', debounce((e) => {
    filterState.text = e.target.value;
    refreshTable();
  }, 300));

  outlet.querySelector('#filter-turma')?.addEventListener('change', (e) => {
    filterState.turmaId = e.target.value;
    refreshTable();
  });

  outlet.querySelector('#filter-situacao')?.addEventListener('change', (e) => {
    filterState.situacao = e.target.value;
    refreshTable();
  });

  outlet.querySelector('#filter-sexo')?.addEventListener('change', (e) => {
    filterState.sexo = e.target.value;
    refreshTable();
  });

  outlet.querySelector('#filter-cor')?.addEventListener('change', (e) => {
    filterState.cor = e.target.value;
    refreshTable();
  });

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
    filterState.turmaId = '';
    filterState.situacao = '';
    filterState.sexo = '';
    filterState.cor = '';
    filterState.uf = '';
    filterState.cidade = '';
    const ti = outlet.querySelector('#filter-text');
    if (ti) ti.value = '';
    const ts = outlet.querySelector('#filter-turma');
    if (ts) ts.value = '';
    const ss = outlet.querySelector('#filter-situacao');
    if (ss) ss.value = '';
    const sx = outlet.querySelector('#filter-sexo');
    if (sx) sx.value = '';
    const cr = outlet.querySelector('#filter-cor');
    if (cr) cr.value = '';
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
    const { edit, delete: del, boletim } = e.detail;
    if (boletim) openBoletim(boletim, boletimModal);
    if (edit) openForm(alunos.getById(edit));
    if (del) confirmDelete(del);
  });

  initRipple(outlet);

  // ── Photo picker helper ───────────────────────────────
  function buildPhotoField(currentFoto, nome, fieldId = 'a-foto') {
    const hue = stringToHue(nome || '');
    const current = currentFoto
      ? `<img src="${currentFoto}" style="width:72px;height:72px;border-radius:50%;object-fit:cover" />`
      : `<div style="width:72px;height:72px;border-radius:50%;background:hsl(${hue},65%,45%);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:#fff">${getInitials(nome || 'Aluno')}</div>`;

    return `
      <div class="form-group full-width" style="display:flex;align-items:center;gap:16px">
        <div id="${fieldId}-preview" style="flex-shrink:0">${current}</div>
        <div>
          <div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px">Foto do aluno (opcional)</div>
          <label class="btn btn-ghost btn-sm" style="cursor:pointer;display:inline-flex;align-items:center;gap:6px">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            Selecionar foto
            <input type="file" id="${fieldId}" accept="image/*" style="display:none" />
          </label>
          ${currentFoto ? `<button type="button" class="btn btn-ghost btn-sm" id="${fieldId}-remove" style="margin-left:6px;color:var(--danger-400)">Remover</button>` : ''}
        </div>
      </div>`;
  }

  // ── Open Form ─────────────────────────────────────────
  function openForm(aluno = null) {
    const isEdit = !!aluno;
    const formTurmas = turmas.getAll().sort((a, b) => a.nome.localeCompare(b.nome));
    const formUnidades = unidades.getAll().sort((a, b) => a.nome.localeCompare(b.nome));
    let fotoData = aluno?.foto || null;

    const globalCfg = (function() { try { return JSON.parse(localStorage.getItem('edu_config') || '{}'); } catch { return {}; } })();
    const defaultUf = aluno?.uf || globalCfg.uf || 'SP';

    const body = `
      <form id="aluno-form" novalidate autocomplete="off">
        ${buildPhotoField(fotoData, aluno?.nome || '')}
        <div class="form-grid">
          <div class="form-group full-width">
            <label class="form-label" for="a-nome">Nome completo <span class="required">*</span></label>
            <input class="form-control" id="a-nome" name="nome" type="text"
              placeholder="Nome completo do aluno"
              value="${escapeHtml(aluno?.nome || '')}" required minlength="3" />
          </div>
          <div class="form-group">
            <label class="form-label" for="a-email">E-mail</label>
            <input class="form-control" id="a-email" name="email" type="email"
              placeholder="email@exemplo.com" value="${escapeHtml(aluno?.email || '')}" />
          </div>
          <div class="form-group">
            <label class="form-label" for="a-telefone">Telefone</label>
            <input class="form-control" id="a-telefone" name="telefone" type="tel"
              placeholder="(11) 99999-9999" value="${escapeHtml(aluno?.telefone || '')}" />
          </div>
          <div class="form-group">
            <label class="form-label" for="a-nascimento">Data de Nascimento <span id="a-idade-calculada" style="font-size:11px;font-weight:600;color:var(--accent-400);margin-left:8px"></span></label>
            <input class="form-control" id="a-nascimento" name="dataNascimento" type="date"
              value="${aluno?.dataNascimento || ''}" />
          </div>
          <div class="form-group">
            <label class="form-label" for="a-sexo">Sexo <span class="required">*</span></label>
            <select class="form-control" id="a-sexo" name="sexo" required>
              <option value="">Selecione o sexo</option>
              <option value="Masculino" ${aluno?.sexo === 'Masculino' ? 'selected' : ''}>Masculino</option>
              <option value="Feminino" ${aluno?.sexo === 'Feminino' ? 'selected' : ''}>Feminino</option>
              <option value="Outro" ${aluno?.sexo === 'Outro' ? 'selected' : ''}>Outro</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="a-cor">Cor / Raça <span class="required">*</span></label>
            <select class="form-control" id="a-cor" name="cor" required>
              <option value="">Selecione a cor/raça</option>
              <option value="Branca" ${aluno?.cor === 'Branca' ? 'selected' : ''}>Branca</option>
              <option value="Preta" ${aluno?.cor === 'Preta' ? 'selected' : ''}>Preta</option>
              <option value="Parda" ${aluno?.cor === 'Parda' ? 'selected' : ''}>Parda</option>
              <option value="Amarela" ${aluno?.cor === 'Amarela' ? 'selected' : ''}>Amarela</option>
              <option value="Indígena" ${aluno?.cor === 'Indígena' ? 'selected' : ''}>Indígena</option>
              <option value="Não declarado" ${aluno?.cor === 'Não declarado' ? 'selected' : ''}>Não declarado</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="a-situacao">Situação</label>
            <select class="form-control" id="a-situacao" name="situacao">
              <option value="ativo"   ${aluno?.situacao !== 'inativo' ? 'selected' : ''}>Ativo</option>
              <option value="inativo" ${aluno?.situacao === 'inativo' ? 'selected' : ''}>Inativo</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="a-turma">Turma <span class="required">*</span></label>
            <select class="form-control" id="a-turma" name="turmaId" required>
              <option value="">Selecione a turma</option>
              ${formTurmas.map(t =>
      `<option value="${t.id}" ${aluno?.turmaId === t.id ? 'selected' : ''}>${escapeHtml(t.nome)}</option>`
    ).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="a-unidade">Unidade</label>
            <select class="form-control" id="a-unidade" name="unidadeId">
              <option value="">Selecione a unidade</option>
              ${formUnidades.map(u =>
      `<option value="${u.id}" ${aluno?.unidadeId === u.id ? 'selected' : ''}>${escapeHtml(u.nome)}</option>`
    ).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="a-cpf">CPF</label>
            <input class="form-control" id="a-cpf" name="cpf" type="text"
              placeholder="000.000.000-00" value="${escapeHtml(aluno?.cpf || '')}" maxlength="14" />
          </div>
          <div class="form-group">
            <label class="form-label" for="a-rg">RG</label>
            <input class="form-control" id="a-rg" name="rg" type="text"
              placeholder="00.000.000-0" value="${escapeHtml(aluno?.rg || '')}" maxlength="12" />
          </div>
          <div class="form-group">
            <label class="form-label" for="a-uf">Estado (UF)</label>
            <select class="form-control" id="a-uf" name="uf">
              ${['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => 
                `<option value="${uf}" ${uf === defaultUf ? 'selected' : ''}>${uf}</option>`
              ).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="a-cidade">Cidade</label>
            <select class="form-control" id="a-cidade" name="cidade">
              <option value="">Carregando...</option>
            </select>
          </div>
          <div class="form-group full-width">
            <label class="form-label" for="a-endereco">Logradouro (Rua, nº, bairro)</label>
            <input class="form-control" id="a-endereco" name="endereco" type="text"
              placeholder="Ex: Rua das Flores, 123 - Centro" value="${escapeHtml(aluno?.endereco || '')}" />
          </div>
        </div>
      </form>`;

    const footer = `
      <button class="btn btn-ghost" id="m-cancel">Cancelar</button>
      <button class="btn btn-primary" id="m-save">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        ${isEdit ? 'Salvar alterações' : 'Cadastrar aluno'}
      </button>`;

    modal.open({
      title: isEdit ? 'Editar Aluno' : 'Novo Aluno',
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
      body, footer, size: 'lg',
    });

    // ── Auto-save draft ───────────────────────────────
    const draftKey = isEdit ? `aluno-edit-${aluno.id}` : 'aluno-novo';
    const draftForm = modal.shadowRoot?.getElementById('aluno-form');
    if (draftForm) {
      if (!isEdit) formDraft.restore(draftKey, draftForm);
      draftForm.addEventListener('input', () => formDraft.save(draftKey, draftForm));
      draftForm.addEventListener('change', () => formDraft.save(draftKey, draftForm));
    }

    const bodyEl = modal.shadowRoot.getElementById('modal-body');
    const fileInput = bodyEl?.querySelector('#a-foto');
    const preview = bodyEl?.querySelector('#a-foto-preview');
    const removeBtn = bodyEl?.querySelector('#a-foto-remove');

    const nascimentoInput = bodyEl?.querySelector('#a-nascimento');
    const idadeCalculadaSpan = bodyEl?.querySelector('#a-idade-calculada');

    function updateAgeDisplay() {
      if (!idadeCalculadaSpan) return;
      const v = nascimentoInput?.value;
      if (v) {
        const age = calculateAge(v);
        idadeCalculadaSpan.textContent = age !== null ? `(${age} anos)` : '';
      } else {
        idadeCalculadaSpan.textContent = '';
      }
    }

    nascimentoInput?.addEventListener('input', updateAgeDisplay);
    nascimentoInput?.addEventListener('change', updateAgeDisplay);
    updateAgeDisplay();

    fileInput?.addEventListener('change', async () => {
      const file = fileInput.files[0];
      if (!file) return;
      try {
        fotoData = await compressImage(file, 200, 0.7);
        if (preview) preview.innerHTML = `<img src="${fotoData}" style="width:72px;height:72px;border-radius:50%;object-fit:cover" />`;
      } catch (err) {
        console.error('Erro ao processar imagem:', err);
      }
    });

    removeBtn?.addEventListener('click', () => {
      fotoData = null;
      const hue = stringToHue('');
      if (preview) preview.innerHTML = `<div style="width:72px;height:72px;border-radius:50%;background:hsl(${hue},65%,45%);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:#fff">?</div>`;
      removeBtn.style.display = 'none';
    });

    const cpfInput = bodyEl?.querySelector('#a-cpf');
    cpfInput?.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '').slice(0, 11);
      v = v.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      e.target.value = v;
    });

    const ufSelect = bodyEl?.querySelector('#a-uf');
    const citySelect = bodyEl?.querySelector('#a-cidade');

    async function loadStudentCities(uf, selectedCity) {
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
        loadStudentCities(ufSelect.value, '');
      });
      const initUf = ufSelect.value || 'SP';
      const initCity = aluno?.cidade || '';
      loadStudentCities(initUf, initCity);
    }

    modal.shadowRoot.getElementById('m-cancel')?.addEventListener('click', () => {
      formDraft.clear(draftKey);
      modal.close();
    });
    modal.shadowRoot.getElementById('m-save')?.addEventListener('click', async () => {
      const data = modal.getFormData('#aluno-form');
      if (!data.nome?.trim()) {
        window.toast?.error('Campo obrigatório', 'Informe o nome do aluno.'); return;
      }
      if (!data.turmaId) {
        window.toast?.error('Campo obrigatório', 'Selecione uma turma.'); return;
      }
      if (!data.sexo) {
        window.toast?.error('Campo obrigatório', 'Selecione o sexo do aluno.'); return;
      }
      if (!data.cor) {
        window.toast?.error('Campo obrigatório', 'Selecione a cor/raça do aluno.'); return;
      }
      const cleanCpf = data.cpf?.replace(/\D/g, '');
      if (cleanCpf) {
        const duplicate = alunos.getAll().find(a => 
          a.id !== aluno?.id && 
          a.cpf?.replace(/\D/g, '') === cleanCpf
        );
        if (duplicate) {
          const confirmed = await showConfirm(modal, {
            title: 'CPF Duplicado',
            message: `O CPF informado já está cadastrado para o aluno <strong>${escapeHtml(duplicate.nome)}</strong>.<br><br>Deseja prosseguir com o cadastro mesmo assim?`,
            icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--danger-400)" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
            confirmText: 'Sim, cadastrar',
            cancelText: 'Voltar e corrigir'
          });
          if (!confirmed) return;
        }
      }

      const saveBtn = bodyEl.querySelector('#m-save');
      const originalText = saveBtn ? saveBtn.innerHTML : '';
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="loading loading-spinner loading-sm"></span> Processando...';
      }

      try {
        const payload = { ...data, foto: fotoData };
        if (isEdit) {
          const confirmed = await showConfirm(modal, {
            title: 'Confirmar Edição',
            message: `Deseja salvar as alterações no cadastro de <strong>${escapeHtml(data.nome)}</strong>?`,
            icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
            confirmText: 'Salvar alterações'
          });
          if (!confirmed) {
            if (saveBtn) {
              saveBtn.disabled = false;
              saveBtn.innerHTML = originalText;
            }
            return;
          }

          alunos.update(aluno.id, payload);
          if (isSyncUser() && typeof firebase !== 'undefined' && firebase.firestore) {
            triggerCloudSync(KEYS.alunos, alunos.getAll());
          }
          addLog('UPDATE', 'Aluno', { id: aluno.id, nome: data.nome });
          window.toast?.success('Aluno atualizado!', `${data.nome} foi atualizado.`);
        } else {
          alunos.create(payload);
          if (isSyncUser() && typeof firebase !== 'undefined' && firebase.firestore) {
            triggerCloudSync(KEYS.alunos, alunos.getAll());
          }
          addLog('CREATE', 'Aluno', { nome: data.nome });
          window.toast?.success('Aluno cadastrado!', `${data.nome} foi adicionado.`);
        }
        formDraft.clear(draftKey);
        modal.close();
        refreshTable();
      } catch (err) {
        console.error('Erro ao salvar aluno:', err);
        window.toast?.error('Erro', 'Ocorreu um erro ao salvar o aluno. Tente novamente.');
      } finally {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.innerHTML = originalText;
        }
      }
    });
  }

  // ── Confirm Delete ────────────────────────────────────
  async function confirmDelete(id) {
    const aluno = alunos.getById(id);
    if (!aluno) return;
    
    const result = await showSecureConfirm(modal, {
      title: 'Excluir Aluno',
      message: `Você tem certeza que deseja excluir permanentemente o aluno <strong>${escapeHtml(aluno.nome)}</strong>? Esta ação não pode ser desfeita.`,
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>`,
      confirmText: 'Confirmar e Excluir',
      showReason: true
    });

    if (result) {
      alunos.delete(id);
      if (isSyncUser() && typeof firebase !== 'undefined' && firebase.firestore) {
        triggerCloudSync(KEYS.alunos, alunos.getAll());
      }
      addLog('DELETE', 'Aluno', { nome: aluno.nome, motivo: result.reason });
      window.toast?.success('Aluno excluído', `${aluno.nome} foi removido com sucesso.`);
      refreshTable();
    }
  }

  // Inject visual toggle for Professors
  if (isProfessor) {
    const headerActions = outlet.querySelector('.page-header-actions');
    if (headerActions) {
      const tabsHtml = `
        <div class="tabs tabs-boxed" style="background:var(--surface-3); padding:4px; margin-right:8px; display:inline-flex; border:1px solid var(--border-color, rgba(255,255,255,0.06)); border-radius:8px;">
          <a class="tab tab-active" id="tab-minhas" style="border-radius:6px; font-weight:600; padding:0 16px; height:36px; display:flex; align-items:center; cursor:pointer; color:var(--primary-500)">Meus Alunos</a>
          <a class="tab" id="tab-todas" style="border-radius:6px; font-weight:600; padding:0 16px; height:36px; display:flex; align-items:center; cursor:pointer; color:var(--text-secondary)">Consulta Geral</a>
        </div>
      `;
      headerActions.insertAdjacentHTML('afterbegin', tabsHtml);

      const tabMinhas = outlet.querySelector('#tab-minhas');
      const tabTodas = outlet.querySelector('#tab-todas');

      tabMinhas.addEventListener('click', () => {
        viewMode = 'minhas';
        tabMinhas.classList.add('tab-active');
        tabMinhas.style.color = 'var(--primary-500)';
        tabTodas.classList.remove('tab-active');
        tabTodas.style.color = 'var(--text-secondary)';
        refreshTable();
      });

      tabTodas.addEventListener('click', () => {
        viewMode = 'todas';
        tabTodas.classList.add('tab-active');
        tabTodas.style.color = 'var(--primary-500)';
        tabMinhas.classList.remove('tab-active');
        tabMinhas.style.color = 'var(--text-secondary)';
        refreshTable();
      });
    }
  }
}
