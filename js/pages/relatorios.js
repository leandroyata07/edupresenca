// =========================================================
// EduPresença – Relatórios Page
// =========================================================
import { turmas, alunos, presencas, notas, cursos, unidades, disciplinas } from '../store.js';
import { formatPercent, escapeHtml as eh, formatDate } from '../utils.js';

export function render(outlet) {
  // Estado avançado dos relatórios
  window.relatoriosState = window.relatoriosState || {
    tipoRelatorio: 'geral', // 'geral', 'data', 'aluno', 'disciplina', 'turma'
    // Filtros do Geral
    showKpis: true,
    showFrequencia: true,
    showNotas: true,
    showBaixaFrequencia: true,
    // Filtros Específicos
    filtroData: new Date().toISOString().split('T')[0],
    filtroAlunoId: '',
    filtroDisciplina: '',
    filtroTurmaId: ''
  };
  const state = window.relatoriosState;

  const allTurmas = turmas.getAll();
  const allAlunos = alunos.getAll();
  const allCursos = cursos.getAll();
  const allUnidades = unidades.getAll();
  const allPresencas = presencas.getAll();
  const allNotas = notas.getAll();

  console.log('📊 Relatórios carregados:', {
    turmas: allTurmas.length,
    alunos: allAlunos.length,
    cursos: allCursos.length,
    presencas: allPresencas.length,
    notas: allNotas.length
  });

  // ── Estatísticas Globais ──
  const totalAlunos = allAlunos.filter(a => a.situacao !== 'inativo').length;
  const totalTurmas = allTurmas.length;
  const totalCursos = allCursos.length;
  const totalUnidades = allUnidades.length;

  // ── Relatório de Frequência por Turma ──
  const frequenciaPorTurma = allTurmas.map(turma => {
    const datas = presencas.getDates(turma.id);
    let totalRegistros = 0;
    let totalPresentes = 0;

    datas.forEach(data => {
      const registros = presencas.getByTurmaData(turma.id, data);
      totalRegistros += registros.length;
      totalPresentes += registros.filter(r => r.presente).length;
    });

    const percentual = totalRegistros > 0 ? ((totalPresentes / totalRegistros) * 100).toFixed(1) : '0.0';
    const curso = allCursos.find(c => c.id === turma.cursoId);
    const qtdAlunos = allAlunos.filter(a => a.turmaId === turma.id).length;

    return {
      turmaId: turma.id,
      turmaNome: turma.nome,
      cursoNome: curso?.nome || '—',
      qtdAlunos,
      qtdAulas: datas.length,
      totalPresentes,
      totalAusentes: totalRegistros - totalPresentes,
      percentual: parseFloat(percentual)
    };
  }).sort((a, b) => b.percentual - a.percentual);

  // ── Relatório de Notas por Disciplina ──
  const notasPorDisciplina = {};
  allNotas.forEach(nota => {
    const disc = nota.disciplina || 'Sem disciplina';
    if (!notasPorDisciplina[disc]) {
      notasPorDisciplina[disc] = [];
    }
    if (nota.nota !== undefined && nota.nota !== null && nota.nota !== '') {
      notasPorDisciplina[disc].push(parseFloat(nota.nota));
    }
  });

  const relatorioNotas = Object.entries(notasPorDisciplina).map(([disciplina, notas]) => {
    const media = notas.length > 0 ? (notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(1) : '0.0';
    const aprovados = notas.filter(n => n >= 7).length;
    const recuperacao = notas.filter(n => n >= 5 && n < 7).length;
    const reprovados = notas.filter(n => n < 5).length;

    return {
      disciplina,
      total: notas.length,
      media: parseFloat(media),
      aprovados,
      recuperacao,
      reprovados
    };
  }).sort((a, b) => b.media - a.media);

  // ── Alunos com Baixa Frequência (<75%) ──
  const alunosFrequenciaBaixa = allAlunos.filter(aluno => {
    const registros = presencas.getByAluno(aluno.id);
    if (registros.length < 3) return false;
    const percentual = (registros.filter(r => r.presente).length / registros.length) * 100;
    return percentual < 75;
  }).map(aluno => {
    const registros = presencas.getByAluno(aluno.id);
    const percentual = ((registros.filter(r => r.presente).length / registros.length) * 100).toFixed(1);
    const turma = allTurmas.find(t => t.id === aluno.turmaId);
    const ausencias = registros.filter(r => !r.presente).length;

    return {
      nome: aluno.nome,
      turma: turma?.nome || '—',
      percentual: parseFloat(percentual),
      ausencias
    };
  }).sort((a, b) => a.percentual - b.percentual);

  outlet.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">Relatórios Avançados</h1>
        <p class="page-subtitle">Visualize e exporte dados específicos da instituição</p>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-ghost btn-sm" id="btn-exportar-csv">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Exportar CSV
        </button>
        <button class="btn btn-primary btn-sm" id="btn-imprimir">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 6 2 18 2 18 9"/>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
            <rect x="6" y="14" width="12" height="8"/>
          </svg>
          Imprimir / PDF
        </button>
      </div>
    </div>

    <!-- Controles de Tipo e Filtro do Relatório -->
    <div class="card" style="margin-bottom: var(--space-6);">
      <div class="card-body" style="padding: var(--space-4) var(--space-6); display: flex; gap: var(--space-4); align-items: flex-end; flex-wrap: wrap;">
        
        <!-- Seletor de Tipo -->
        <div class="form-group" style="min-width: 200px;">
          <label class="form-label">Tipo de Relatório</label>
          <select class="form-control" id="select-tipo-relatorio">
            <option value="geral" ${state.tipoRelatorio === 'geral' ? 'selected' : ''}>Visão Geral (Painel)</option>
            <option value="data" ${state.tipoRelatorio === 'data' ? 'selected' : ''}>Presença por Data</option>
            <option value="aluno" ${state.tipoRelatorio === 'aluno' ? 'selected' : ''}>Desempenho por Aluno</option>
            <option value="disciplina" ${state.tipoRelatorio === 'disciplina' ? 'selected' : ''}>Notas por Disciplina (Detalhado)</option>
            <option value="turma" ${state.tipoRelatorio === 'turma' ? 'selected' : ''}>Frequência por Turma (Diário)</option>
          </select>
        </div>

        <!-- Filtros Condicionais -->
        ${renderFiltrosCondicionais(state, allAlunos, allTurmas, allNotas)}

      </div>
    </div>

    <!-- View Rendering Box -->
    <div id="relatorio-content-view">
      ${renderContent(state, allTurmas, allAlunos, allCursos, allUnidades, allPresencas, allNotas, totalAlunos, totalTurmas, totalCursos, totalUnidades, frequenciaPorTurma, relatorioNotas, alunosFrequenciaBaixa)}
    </div>
  `;

  // ── Event Listeners Principais ──

  // Mudar tipo de relatório
  outlet.querySelector('#select-tipo-relatorio')?.addEventListener('change', (e) => {
    window.relatoriosState.tipoRelatorio = e.target.value;
    render(outlet);
  });

  // Filtros de Data
  outlet.querySelector('#filtro-data-input')?.addEventListener('change', (e) => {
    window.relatoriosState.filtroData = e.target.value;
    render(outlet);
  });

  // Filtros de Seleção (Aluno, Turma, Disciplina)
  outlet.querySelectorAll('.filtro-select-dinamico').forEach(sel => {
    sel.addEventListener('change', (e) => {
      const id = e.target.id;
      if (id === 'select-aluno') window.relatoriosState.filtroAlunoId = e.target.value;
      if (id === 'select-turma') window.relatoriosState.filtroTurmaId = e.target.value;
      if (id === 'select-disciplina') window.relatoriosState.filtroDisciplina = e.target.value;
      render(outlet);
    });
  });

  // Filtros Checkbox do Geral
  outlet.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const id = e.target.id;
      if (id === 'filter-kpis') window.relatoriosState.showKpis = e.target.checked;
      if (id === 'filter-freq') window.relatoriosState.showFrequencia = e.target.checked;
      if (id === 'filter-notas') window.relatoriosState.showNotas = e.target.checked;
      if (id === 'filter-baixa') window.relatoriosState.showBaixaFrequencia = e.target.checked;

      // Re-renderiza a página para aplicar os filtros
      render(outlet);
    });
  });

  // Exportar CSV
  outlet.querySelector('#btn-exportar-csv')?.addEventListener('click', () => {
    const tableId = `export-table-${state.tipoRelatorio}`;
    exportarAgregadosCSV(state, allAlunos, allTurmas, allNotas, allPresencas, frequenciaPorTurma, relatorioNotas);
  });

  // Imprimir / PDF
  outlet.querySelector('#btn-imprimir')?.addEventListener('click', () => {
    exportarDinamicoPDF(state, totalAlunos, totalTurmas, totalCursos, totalUnidades, frequenciaPorTurma, relatorioNotas, alunosFrequenciaBaixa, allAlunos, allTurmas, allNotas, allPresencas);
  });
}

// ── Funções de Renderização dos Controles ─────────────────
function renderFiltrosCondicionais(state, alunos, turmas, notas) {
  if (state.tipoRelatorio === 'geral') {
    return `
      <div style="display: flex; gap: var(--space-4); margin-bottom: 8px; flex-wrap: wrap;">
        <label class="form-check">
          <input type="checkbox" id="filter-kpis" ${state.showKpis ? 'checked' : ''}>
          <span>KPIs</span>
        </label>
        <label class="form-check">
          <input type="checkbox" id="filter-freq" ${state.showFrequencia ? 'checked' : ''}>
          <span>Frequência</span>
        </label>
        <label class="form-check">
          <input type="checkbox" id="filter-notas" ${state.showNotas ? 'checked' : ''}>
          <span>Desempenho</span>
        </label>
        <label class="form-check">
          <input type="checkbox" id="filter-baixa" ${state.showBaixaFrequencia ? 'checked' : ''}>
          <span>Baixa Freq.</span>
        </label>
      </div>
    `;
  }

  if (state.tipoRelatorio === 'data') {
    return `
      <div class="form-group" style="min-width: 180px;">
        <label class="form-label">Data</label>
        <input type="date" class="form-control" id="filtro-data-input" value="${eh(state.filtroData)}">
      </div>
    `;
  }

  if (state.tipoRelatorio === 'aluno') {
    return `
      <div class="form-group" style="min-width: 250px;">
        <label class="form-label">Selecionar Aluno</label>
        <select class="form-control filtro-select-dinamico" id="select-aluno">
          <option value="">Selecione um aluno...</option>
          ${alunos.map(a => `<option value="${a.id}" ${state.filtroAlunoId == a.id ? 'selected' : ''}>${eh(a.nome)}</option>`).join('')}
        </select>
      </div>
    `;
  }

  if (state.tipoRelatorio === 'disciplina') {
    const dMap = new Set();
    notas.forEach(n => { if (n.disciplina) dMap.add(n.disciplina) });
    const discs = Array.from(dMap).sort();

    return `
      <div class="form-group" style="min-width: 200px;">
        <label class="form-label">Disciplina</label>
        <select class="form-control filtro-select-dinamico" id="select-disciplina">
          <option value="">Todas as Disciplinas</option>
          ${discs.map(d => `<option value="${eh(d)}" ${state.filtroDisciplina === d ? 'selected' : ''}>${eh(d)}</option>`).join('')}
        </select>
      </div>
    `;
  }

  if (state.tipoRelatorio === 'turma') {
    return `
      <div class="form-group" style="min-width: 250px;">
        <label class="form-label">Turma (Diário de Classe)</label>
        <select class="form-control filtro-select-dinamico" id="select-turma">
          <option value="">Selecione uma turma...</option>
          ${turmas.map(t => `<option value="${t.id}" ${state.filtroTurmaId == t.id ? 'selected' : ''}>${eh(t.nome)}</option>`).join('')}
        </select>
      </div>
    `;
  }
  return '';
}

// ── Funções de Renderização Condicional de Conteúdo ───────
function renderContent(state, allTurmas, allAlunos, allCursos, allUnidades, allPresencas, allNotas, totalAlunos, totalTurmas, totalCursos, totalUnidades, frequenciaPorTurma, relatorioNotas, alunosFrequenciaBaixa) {
  if (state.tipoRelatorio === 'geral') {
    return renderGeral(state, totalAlunos, totalTurmas, totalCursos, totalUnidades, frequenciaPorTurma, relatorioNotas, alunosFrequenciaBaixa);
  }
  if (state.tipoRelatorio === 'data') {
    return renderPorData(state, allPresencas, allAlunos, allTurmas);
  }
  if (state.tipoRelatorio === 'aluno') {
    return renderPorAluno(state, allAlunos, allTurmas, allPresencas, allNotas);
  }
  if (state.tipoRelatorio === 'disciplina') {
    return renderPorDisciplina(state, allNotas, allAlunos, allTurmas);
  }
  if (state.tipoRelatorio === 'turma') {
    return renderPorTurma(state, allTurmas, allAlunos, allPresencas);
  }
  return '<div class="empty-state"><p>Selecione um tipo de relatório.</p></div>';
}

function renderGeral(state, totalAlunos, totalTurmas, totalCursos, totalUnidades, frequenciaPorTurma, relatorioNotas, alunosFrequenciaBaixa) {
  return `
    ${state.showKpis ? `
    <div class="kpi-grid" style="margin-bottom: var(--space-6);">
      <div class="kpi-card"><div class="kpi-icon">■</div><div class="kpi-value">${totalAlunos}</div><div class="kpi-label">Alunos Ativos</div></div>
      <div class="kpi-card orange"><div class="kpi-icon">■</div><div class="kpi-value">${totalTurmas}</div><div class="kpi-label">Turmas</div></div>
      <div class="kpi-card green"><div class="kpi-icon">■</div><div class="kpi-value">${totalCursos}</div><div class="kpi-label">Cursos</div></div>
      <div class="kpi-card blue"><div class="kpi-icon">■</div><div class="kpi-value">${totalUnidades}</div><div class="kpi-label">Unidades</div></div>
    </div>` : ''}

    <div class="grid grid-2" style="gap: var(--space-6); margin-bottom: var(--space-6);">
      ${state.showFrequencia ? `
      <div class="card">
        <div class="card-header"><span class="card-title">Frequência por Turma</span></div>
        <div class="table-wrapper">
          <table>
            <thead><tr><th>Turma</th><th>Aulas</th><th>Frequência</th></tr></thead>
            <tbody>
              ${frequenciaPorTurma.map(i => `<tr><td><strong>${eh(i.turmaNome)}</strong></td><td>${i.qtdAulas}</td><td>${i.percentual}%</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>` : ''}

      ${state.showNotas ? `
      <div class="card">
        <div class="card-header"><span class="card-title">Desempenho por Disciplina</span></div>
        <div class="table-wrapper">
          <table>
            <thead><tr><th>Disciplina</th><th>Média</th><th>Aprovados</th><th>Reprovados</th></tr></thead>
            <tbody>
              ${relatorioNotas.map(i => `<tr><td><strong>${eh(i.disciplina)}</strong></td><td>${i.media}</td><td style="color:var(--secondary-500)">${i.aprovados}</td><td style="color:var(--danger-500)">${i.reprovados}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>` : ''}
    </div>

    ${state.showBaixaFrequencia ? `
      <div class="card">
        <div class="card-header"><span class="card-title" style="color:var(--danger-500)">Alunos Baixa Frequência (<75%)</span></div>
        <div class="table-wrapper">
          <table>
            <thead><tr><th>Aluno</th><th>Turma</th><th>Frequência</th><th>Ausências</th></tr></thead>
            <tbody>
              ${alunosFrequenciaBaixa.map(a => `<tr><td><strong>${eh(a.nome)}</strong></td><td>${eh(a.turma)}</td><td style="color:var(--danger-500)">${a.percentual}%</td><td>${a.ausencias} faltas</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>` : ''}
  `;
}

function renderPorData(state, allPresencas, allAlunos, allTurmas) {
  if (!state.filtroData) return '<div class="empty-state"><p>Escolha uma data.</p></div>';

  const registros = allPresencas.filter(p => p.data === state.filtroData);
  if (registros.length === 0) return '<div class="empty-state"><p>Nenhuma chamada registrada nesta data.</p></div>';

  return `
    <div class="card">
      <div class="card-header"><span class="card-title">Presença no dia ${formatDate(state.filtroData)}</span></div>
      <div class="table-wrapper">
        <table>
          <thead><tr><th>Aluno</th><th>Turma</th><th>Situação</th></tr></thead>
          <tbody>
            ${registros.map(r => {
    const aluno = allAlunos.find(a => a.id === r.alunoId);
    const turma = aluno ? allTurmas.find(t => t.id === aluno.turmaId) : null;
    const statusSpan = r.presente
      ? '<span style="color:var(--secondary-500); font-weight:700;">Presente</span>'
      : '<span style="color:var(--danger-500); font-weight:700;">Ausente</span>';
    return `<tr><td>${eh(aluno?.nome || '—')}</td><td>${eh(turma?.nome || '—')}</td><td>${statusSpan}</td></tr>`;
  }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderPorAluno(state, allAlunos, allTurmas, allPresencas, allNotas) {
  if (!state.filtroAlunoId) return '<div class="empty-state"><p>Selecione um aluno acima.</p></div>';

  const aluno = allAlunos.find(a => a.id === state.filtroAlunoId);
  const turma = allTurmas.find(t => t.id === aluno?.turmaId);
  const pList = allPresencas.filter(p => p.alunoId === aluno.id);
  const nList = allNotas.filter(n => n.alunoId === aluno.id);

  const presencasNum = pList.filter(p => p.presente).length;
  const faltasNum = pList.length - presencasNum;
  const percFreq = pList.length > 0 ? ((presencasNum / pList.length) * 100).toFixed(1) : 100;

  return `
    <div class="card" style="margin-bottom: 24px;">
      <div class="card-body">
        <h3 style="font-size:18px; margin-bottom: 8px;">${eh(aluno.nome)}</h3>
        <p style="color:var(--text-secondary); margin-bottom: 16px;">Turma: ${eh(turma?.nome || '—')} &nbsp;|&nbsp; RA: ${aluno.matricula || 'N/A'}</p>
        
        <div style="display:flex; gap:24px;">
          <div><strong>Aulas Registradas:</strong> ${pList.length}</div>
          <div><strong>Presenças:</strong> ${presencasNum}</div>
          <div><strong>Faltas:</strong> <span style="color:var(--danger-500)">${faltasNum}</span></div>
          <div><strong>Frequência Acumulada:</strong> <span style="font-weight:700; ${percFreq < 75 ? 'color:var(--danger-500)' : ''}">${percFreq}%</span></div>
        </div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-header"><span class="card-title">Boletim Consolidado</span></div>
      <div class="table-wrapper">
        <table>
          <thead><tr><th>Disciplina</th><th>Nota</th><th>Referência</th></tr></thead>
          <tbody>
            ${nList.length === 0 ? '<tr><td colspan="3" style="text-align:center;">Nenhuma nota lançada.</td></tr>' :
      nList.map(n => `<tr><td><strong>${eh(n.disciplina)}</strong></td><td>${n.nota}</td><td>${eh(n.referencia || '-')}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderPorDisciplina(state, allNotas, allAlunos, allTurmas) {
  let nList = allNotas;
  if (state.filtroDisciplina) nList = nList.filter(n => n.disciplina === state.filtroDisciplina);

  if (nList.length === 0) return '<div class="empty-state"><p>Nenhuma nota encontrada para o filtro selecionado.</p></div>';

  return `
    <div class="card">
      <div class="card-header"><span class="card-title">Notas: ${eh(state.filtroDisciplina || 'Todas as Disciplinas')}</span></div>
      <div class="table-wrapper">
        <table>
          <thead><tr><th>Aluno</th><th>Turma</th><th>Disciplina</th><th>Nota</th><th>Referência</th></tr></thead>
          <tbody>
            ${nList.map(n => {
    const aluno = allAlunos.find(a => a.id === n.alunoId);
    const turma = aluno ? allTurmas.find(t => t.id === aluno.turmaId) : null;
    return `<tr>
                <td>${eh(aluno?.nome || '—')}</td>
                <td>${eh(turma?.nome || '—')}</td>
                <td><strong>${eh(n.disciplina)}</strong></td>
                <td>${n.nota}</td>
                <td>${eh(n.referencia || '-')}</td>
              </tr>`;
  }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderPorTurma(state, allTurmas, allAlunos, allPresencas) {
  if (!state.filtroTurmaId) return '<div class="empty-state"><p>Selecione uma turma acima.</p></div>';

  const turma = allTurmas.find(t => t.id === state.filtroTurmaId);
  const alList = allAlunos.filter(a => a.turmaId === state.filtroTurmaId);
  const pList = allPresencas.filter(p => alList.some(a => a.id === p.alunoId));

  return `
    <div class="card">
      <div class="card-header">
        <span class="card-title">Diário Consolidado: ${eh(turma.nome)}</span>
      </div>
      <div class="table-wrapper">
        <table>
          <thead><tr><th>Aluno</th><th>Aulas</th><th>Faltas</th><th>Frequência</th></tr></thead>
          <tbody>
            ${alList.map(a => {
    const pAluno = pList.filter(p => p.alunoId === a.id);
    const presentes = pAluno.filter(p => p.presente).length;
    const freq = pAluno.length ? ((presentes / pAluno.length) * 100).toFixed(1) : 100;
    return `<tr>
                <td><strong>${eh(a.nome)}</strong></td>
                <td>${pAluno.length}</td>
                <td style="color:var(--danger-500)">${pAluno.length - presentes}</td>
                <td style="font-weight:700; ${freq < 75 ? 'color:var(--danger-500)' : ''}">${freq}%</td>
              </tr>`;
  }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ── Exportar PDF Dinâmico ────────────────────────────────
function exportarDinamicoPDF(state, totalAlunos, totalTurmas, totalCursos, totalUnidades, frequenciaPorTurma, relatorioNotas, alunosFrequenciaBaixa, allAlunos, allTurmas, allNotas, allPresencas) {
  const hoje = new Date().toLocaleDateString('pt-BR');
  const viewHtml = document.getElementById('relatorio-content-view').innerHTML;

  // Remover interatividades e simplificar SVG no print
  let cleanHtml = viewHtml
    .replace(/<button[^>]*>.*?<\/button>/g, '')
    .replace(/<svg[^>]*>.*?<\/svg>/g, '')
    .replace(/var\(--[a-zA-Z0-9-]+\)/g, '#333');

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<title>Relatórios — EduPresença</title>
<style>
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'Segoe UI',Arial,sans-serif; font-size:13px; color:#111; background:#fff; padding:32px 40px; }
  h1 { font-size:22px; font-weight:700; color:#1e1b4b; margin-bottom:4px; }
  .subtitle { font-size:12px; color:#6b7280; margin-bottom:24px; border-bottom:1px solid #ccc; padding-bottom:12px;}
  table { width:100%; border-collapse:collapse; margin-bottom:24px;}
  th { background:#f3f4f6; padding:8px 12px; text-align:left; font-size:11px; font-weight:600; border-bottom:2px solid #e5e7eb; }
  td { padding:8px 12px; border-bottom:1px solid #f3f4f6; }
  .card { margin-bottom: 24px; border: 1px solid #eee; border-radius: 8px; padding: 12px;}
  .card-header { font-weight: bold; margin-bottom: 8px; font-size: 16px;}
  .kpi-grid { display:flex; gap: 16px; margin-bottom: 24px;}
  .kpi-card { padding: 12px; border: 1px solid #ccc; border-radius: 8px; flex:1; text-align:center;}
  .kpi-value { font-size: 24px; font-weight: bold;}
  @media print { body { padding:0; } }
</style>
</head>
<body>
  <h1>EduPresença — Relatório Expandido</h1>
  <div class="subtitle">Gerado em ${hoje} | Filtro Ativo: ${state.tipoRelatorio.toUpperCase()}</div>

  ${cleanHtml}

  <div style="margin-top:32px; padding-top:12px; border-top:1px solid #eee; font-size:11px; color:#999; text-align:center;">Gerado automaticamente pelo sistema EduPresença.</div>
  <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 500); }<\/script>
</body>
</html>`;

  if (win) {
    win.document.write(html);
    win.document.close();
  } else {
    window.toast?.warning('Pop-up bloqueado', 'Permita pop-ups para gerar o PDF.');
  }
}

// ── Exportar CSV Dinâmico ──
function exportarAgregadosCSV(state, allAlunos, allTurmas, allNotas, allPresencas, freqTurma, notasDisc) {
  let csvContent = "";

  if (state.tipoRelatorio === 'geral') {
    if (state.showFrequencia) {
      csvContent += 'Turma,Alunos,Aulas,Frequência\n';
      freqTurma.forEach(i => csvContent += `${i.turmaNome},${i.qtdAlunos},${i.qtdAulas},${i.percentual}%\n`);
      csvContent += '\n';
    }
    if (state.showNotas) {
      csvContent += 'Disciplina,Media,Aprovados,Reprovados\n';
      notasDisc.forEach(i => csvContent += `${i.disciplina},${i.media},${i.aprovados},${i.reprovados}\n`);
    }
  }

  else if (state.tipoRelatorio === 'data' && state.filtroData) {
    csvContent += `Presencas (${state.filtroData})\n`;
    csvContent += 'Aluno,Turma,Situacao\n';
    allPresencas.filter(p => p.data === state.filtroData).forEach(p => {
      const a = allAlunos.find(x => x.id === p.alunoId);
      const t = a ? allTurmas.find(x => x.id === a.turmaId) : null;
      csvContent += `${a?.nome || '?'},${t?.nome || '?'},${p.presente ? 'Presente' : 'Ausente'}\n`;
    });
  }

  else if (state.tipoRelatorio === 'aluno' && state.filtroAlunoId) {
    const a = allAlunos.find(x => x.id === state.filtroAlunoId);
    csvContent += `Boletim de ${a?.nome}\nDisciplina,Nota\n`;
    allNotas.filter(n => n.alunoId === state.filtroAlunoId).forEach(n => {
      csvContent += `${n.disciplina},${n.nota}\n`;
    });
  }

  else if (state.tipoRelatorio === 'disciplina' && state.filtroDisciplina) {
    csvContent += `Notas - ${state.filtroDisciplina}\nAluno,Turma,Nota\n`;
    allNotas.filter(n => n.disciplina === state.filtroDisciplina).forEach(n => {
      const a = allAlunos.find(x => x.id === n.alunoId);
      const t = a ? allTurmas.find(x => x.id === a.turmaId) : null;
      csvContent += `${a?.nome || '?'},${t?.nome || '?'},${n.nota}\n`;
    });
  }

  else if (state.tipoRelatorio === 'turma' && state.filtroTurmaId) {
    csvContent += `Frequencia da Turma\nAluno,Presencas\n`;
    allAlunos.filter(a => a.turmaId === state.filtroTurmaId).forEach(a => {
      const p = allPresencas.filter(x => x.alunoId === a.id);
      const press = p.filter(x => x.presente).length;
      csvContent += `${a.nome},${press}/${p.length}\n`;
    });
  }

  if (!csvContent) {
    window.toast?.warning('Sem dados', 'Nenhum dado selecionado para exportar.');
    return;
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `relatorio-${state.tipoRelatorio}-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.toast?.success('Exportado!', 'Arquivo CSV baixado com sucesso.');
}
