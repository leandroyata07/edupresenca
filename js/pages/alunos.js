// =========================================================
// EduPresença v2 – Alunos Page (with filters: turma + situação)
// =========================================================
import { alunos, turmas, unidades } from '../store.js';
import { formatDate, escapeHtml, initRipple, getInitials, stringToHue, filterByText, debounce, deleteWithUndo, formDraft } from '../utils.js';
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

  outlet.innerHTML = `
    <div class="stagger-children">
      <div class="page-header">
        <div class="page-header-left">
          <h1 class="page-title">Alunos</h1>
          <p class="page-subtitle">Gerencie os alunos cadastrados no sistema</p>
        </div>
        <div class="page-header-actions">
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
          <input type="search" id="filter-text" class="form-control"
            placeholder="Buscar aluno por nome, e-mail ou CPF..."
            style="padding-left:34px;height:38px;font-size:13px"
            aria-label="Buscar aluno" />
        </div>
        <select id="filter-turma" class="form-control" style="min-width:160px;height:38px;font-size:13px"
          aria-label="Filtrar por turma">
          <option value="">Todas as turmas</option>
          ${allTurmas.map(t => `<option value="${t.id}">${escapeHtml(t.nome)}</option>`).join('')}
        </select>
        <select id="filter-situacao" class="form-control" style="min-width:140px;height:38px;font-size:13px"
          aria-label="Filtrar por situação">
          <option value="">Todas as situações</option>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
        </select>
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
          <button class="btn btn-primary" id="btn-novo-aluno-es">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Cadastrar Aluno
          </button>
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
        return `
          <div style="display:flex;align-items:center;gap:10px">
            ${avatar}
            <div>
              <div style="font-weight:600;color:var(--text-primary)">${escapeHtml(val)}</div>
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
      label: 'Data Nasc.', key: 'dataNascimento',
      render: (val) => formatDate(val)
    },
    {
      label: 'Situação', key: 'situacao',
      render: (val) => val === 'inativo'
        ? `<span class="badge badge-neutral badge-dot">Inativo</span>`
        : `<span class="badge badge-success badge-dot">Ativo</span>`
    },
    {
      label: 'Ações', key: 'id', sortable: false,
      render: (id) => `
        <div style="display:flex;gap:6px">
          <button class="btn btn-ghost btn-icon-sm" data-boletim="${id}" title="Ver Boletim" style="color:var(--accent-400,#818cf8)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          </button>
          <button class="btn btn-ghost btn-icon-sm" data-edit="${id}" title="Editar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn btn-ghost btn-icon-sm" data-delete="${id}" title="Excluir" style="color:var(--danger-400)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
          </button>
        </div>`
    },
  ];

  table.setColumns(columns);

  // ── Filter State ──────────────────────────────────────
  const filterState = { text: '', turmaId: '', situacao: '' };

  function getFilteredData() {
    let data = alunos.getAll().sort((a, b) => a.nome.localeCompare(b.nome));
    if (filterState.text.trim()) data = filterByText(data, filterState.text);
    if (filterState.turmaId) data = data.filter(a => a.turmaId === filterState.turmaId);
    if (filterState.situacao) {
      data = data.filter(a => (a.situacao || 'ativo') === filterState.situacao);
    }
    return data;
  }

  function hasActiveFilters() {
    return filterState.text.trim() !== '' || filterState.turmaId !== '' || filterState.situacao !== '';
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
        }
        refreshTable();
      });
    });
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
  outlet.querySelector('#btn-novo-aluno').addEventListener('click', () => openForm(null));
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

      alunos.create({
        nome,
        email:          emailIdx >= 0      ? cols[emailIdx]?.replace(/["']/g, '').trim()      || '' : '',
        matricula:      matriculaIdx >= 0  ? cols[matriculaIdx]?.replace(/["']/g, '').trim()  || '' : '',
        turmaId,
        dataNascimento: nascimentoIdx >= 0 ? cols[nascimentoIdx]?.replace(/["']/g, '').trim() || '' : '',
        telefone:       telefoneIdx >= 0   ? cols[telefoneIdx]?.replace(/["']/g, '').trim()   || '' : '',
        situacao,
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

  outlet.querySelector('#btn-limpar-filtros')?.addEventListener('click', () => {
    filterState.text = '';
    filterState.turmaId = '';
    filterState.situacao = '';
    const ti = outlet.querySelector('#filter-text');
    if (ti) ti.value = '';
    const ts = outlet.querySelector('#filter-turma');
    if (ts) ts.value = '';
    const ss = outlet.querySelector('#filter-situacao');
    if (ss) ss.value = '';
    refreshTable();
  });

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
            <label class="form-label" for="a-nascimento">Data de Nascimento</label>
            <input class="form-control" id="a-nascimento" name="dataNascimento" type="date"
              value="${aluno?.dataNascimento || ''}" />
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
          <div class="form-group full-width">
            <label class="form-label" for="a-endereco">Endereço</label>
            <input class="form-control" id="a-endereco" name="endereco" type="text"
              placeholder="Rua, número, bairro, cidade" value="${escapeHtml(aluno?.endereco || '')}" />
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

    fileInput?.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        fotoData = ev.target.result;
        if (preview) preview.innerHTML = `<img src="${fotoData}" style="width:72px;height:72px;border-radius:50%;object-fit:cover" />`;
      };
      reader.readAsDataURL(file);
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

    modal.shadowRoot.getElementById('m-cancel')?.addEventListener('click', () => {
      formDraft.clear(draftKey);
      modal.close();
    });
    modal.shadowRoot.getElementById('m-save')?.addEventListener('click', () => {
      const data = modal.getFormData('#aluno-form');
      if (!data.nome?.trim()) {
        window.toast?.error('Campo obrigatório', 'Informe o nome do aluno.'); return;
      }
      if (!data.turmaId) {
        window.toast?.error('Campo obrigatório', 'Selecione uma turma.'); return;
      }
      const payload = { ...data, foto: fotoData };
      if (isEdit) {
        alunos.update(aluno.id, payload);
        window.toast?.success('Aluno atualizado!', `${data.nome} foi atualizado.`);
      } else {
        alunos.create(payload);
        window.toast?.success('Aluno cadastrado!', `${data.nome} foi adicionado.`);
      }
      formDraft.clear(draftKey);
      modal.close();
      refreshTable();
    });
  }

  // ── Confirm Delete ────────────────────────────────────
  function confirmDelete(id) {
    const aluno = alunos.getById(id);
    if (!aluno) return;
    deleteWithUndo(alunos, aluno, aluno.nome, refreshTable);
  }
}
