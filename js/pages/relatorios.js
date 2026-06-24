// =========================================================
// EduPresença – Relatórios Page
// =========================================================
import { turmas, alunos, presencas, notas, cursos, unidades, disciplinas, turnos, auth } from '../store.js';
import { formatPercent, escapeHtml as eh, formatDate, calculateAge } from '../utils.js';

export function render(outlet) {
  // Estado avançado dos relatórios
  window.relatoriosState = window.relatoriosState || {
    tipoRelatorio: 'geral', // 'geral', 'data', 'aluno', 'disciplina', 'turma', 'censo'
    // Filtros do Geral
    showKpis: true,
    showFrequencia: true,
    showNotas: true,
    showBaixaFrequencia: true,
    // Filtros Específicos
    filtroData: new Date().toISOString().split('T')[0],
    filtroDataFim: new Date().toISOString().split('T')[0],
    filtroAlunoId: '',
    filtroDisciplina: '',
    filtroTurmaId: '',
    filtroUnidadeId: '',
    filtroCursoId: '',
    filtroTurnoId: '',
    filtroUf: '',
    filtroCidade: ''
  };
  const state = window.relatoriosState;

  const me = auth.currentUser();
  const isProfessor = me && me.role === 'professor';

  let allTurmas = turmas.getAll();
  let allAlunos = alunos.getAll();
  let allCursos = cursos.getAll();
  let allUnidades = unidades.getAll();
  let allPresencas = presencas.getAll();
  let allNotas = notas.getAll();

  if (isProfessor) {
    const meusCursos = me.cursos || [];

    allTurmas = allTurmas.filter(t => meusCursos.includes(t.cursoId));
    allAlunos = allAlunos.filter(a => {
      const t = turmas.getAll().find(turma => turma.id === a.turmaId);
      return t && meusCursos.includes(t.cursoId);
    });
    allCursos = allCursos.filter(c => meusCursos.includes(c.id));

    allPresencas = allPresencas.filter(p => {
      const t = turmas.getAll().find(turma => turma.id === p.turmaId);
      return t && meusCursos.includes(t.cursoId);
    });

    allNotas = allNotas.filter(n => {
      const t = turmas.getAll().find(turma => turma.id === n.turmaId);
      return t && meusCursos.includes(t.cursoId);
    });
  }

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
    let totalRegistros = 0;
    let totalPresentes = 0;
    let totalAulas = 0;

    if (isProfessor) {
      const minhasDisciplinas = me.disciplinas || [];
      minhasDisciplinas.forEach(discId => {
        const datas = presencas.getDates(turma.id, discId);
        totalAulas += datas.length;
        datas.forEach(data => {
          const registros = presencas.getByTurmaData(turma.id, data, discId);
          totalRegistros += registros.length;
          totalPresentes += registros.filter(r => r.presente).length;
        });
      });
    } else {
      const datas = presencas.getDates(turma.id);
      totalAulas = datas.length;
      datas.forEach(data => {
        const registros = presencas.getByTurmaData(turma.id, data);
        totalRegistros += registros.length;
        totalPresentes += registros.filter(r => r.presente).length;
      });
    }

    const percentual = totalRegistros > 0 ? parseFloat(((totalPresentes / totalRegistros) * 100).toFixed(1)) : null;
    const curso = allCursos.find(c => c.id === turma.cursoId);
    const qtdAlunos = allAlunos.filter(a => a.turmaId === turma.id).length;

    return {
      turmaId: turma.id,
      turmaNome: turma.nome,
      cursoNome: curso?.nome || '—',
      qtdAlunos,
      qtdAulas: totalAulas,
      totalPresentes,
      totalAusentes: totalRegistros > 0 ? totalRegistros - totalPresentes : 0,
      percentual: percentual
    };
  }).sort((a, b) => {
    if (a.percentual === null && b.percentual === null) return 0;
    if (a.percentual === null) return 1;
    if (b.percentual === null) return -1;
    return b.percentual - a.percentual;
  });

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
    const minhasDisciplinas = isProfessor ? (me.disciplinas || []) : null;
    const registros = presencas.getByAluno(aluno.id, minhasDisciplinas);
    if (registros.length < 3) return false;
    const percentual = (registros.filter(r => r.presente).length / registros.length) * 100;
    return percentual < 75;
  }).map(aluno => {
    const minhasDisciplinas = isProfessor ? (me.disciplinas || []) : null;
    const registros = presencas.getByAluno(aluno.id, minhasDisciplinas);
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
      <div class="card-body" style="padding: var(--space-4) var(--space-6); display: flex; gap: 8px; align-items: flex-end; flex-wrap: wrap;">
        
        <!-- Seletor de Tipo -->
        <div class="form-group" style="flex: 1; min-width: 200px;">
          <label class="form-label">Tipo de Relatório</label>
          <select class="form-control" id="select-tipo-relatorio">
            <option value="geral" ${state.tipoRelatorio === 'geral' ? 'selected' : ''}>Visão Geral (Painel)</option>
            <option value="data" ${state.tipoRelatorio === 'data' ? 'selected' : ''}>Presença por Data</option>
            <option value="aluno" ${state.tipoRelatorio === 'aluno' ? 'selected' : ''}>Desempenho por Aluno</option>
            <option value="disciplina" ${state.tipoRelatorio === 'disciplina' ? 'selected' : ''}>Notas por Disciplina (Detalhado)</option>
            <option value="turma" ${state.tipoRelatorio === 'turma' ? 'selected' : ''}>Frequência por Turma (Diário)</option>
            <option value="censo" ${state.tipoRelatorio === 'censo' ? 'selected' : ''}>Censo Demográfico (Estatísticas)</option>
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

  // Helper para atualizar apenas a tabela sem recriar os filtros (evita perder o foco)
  const updateContentView = () => {
    const view = outlet.querySelector('#relatorio-content-view');
    if (view) {
      view.innerHTML = renderContent(window.relatoriosState, allTurmas, allAlunos, allCursos, allUnidades, allPresencas, allNotas, totalAlunos, totalTurmas, totalCursos, totalUnidades, frequenciaPorTurma, relatorioNotas, alunosFrequenciaBaixa);
    }
  };

  // Filtros de Data
  outlet.querySelector('#filtro-data-input')?.addEventListener('change', (e) => {
    window.relatoriosState.filtroData = e.target.value;
    updateContentView();
  });
  outlet.querySelector('#filtro-data-fim')?.addEventListener('change', (e) => {
    window.relatoriosState.filtroDataFim = e.target.value;
    updateContentView();
  });

  // Filtros de Seleção (Aluno, Turma, Disciplina, Unidade, Turno, Estado, Cidade)
  outlet.querySelectorAll('.filtro-select-dinamico').forEach(sel => {
    sel.addEventListener('change', (e) => {
      const id = e.target.id;
      if (id === 'select-aluno') window.relatoriosState.filtroAlunoId = e.target.value;
      if (id === 'select-turma') window.relatoriosState.filtroTurmaId = e.target.value;
      if (id === 'select-disciplina') window.relatoriosState.filtroDisciplina = e.target.value;
      if (id === 'select-unidade') window.relatoriosState.filtroUnidadeId = e.target.value;
      if (id === 'select-curso') window.relatoriosState.filtroCursoId = e.target.value;
      if (id === 'select-turno') window.relatoriosState.filtroTurnoId = e.target.value;
      if (id === 'select-uf') {
        window.relatoriosState.filtroUf = e.target.value;
        window.relatoriosState.filtroCidade = '';
      }
      if (id === 'select-cidade') window.relatoriosState.filtroCidade = e.target.value;
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
      <div class="form-group" style="flex: 1; min-width: 150px;">
        <label class="form-label">Data Início (De)</label>
        <input type="date" class="form-control" id="filtro-data-input" value="${eh(state.filtroData)}">
      </div>
      <div class="form-group" style="flex: 1; min-width: 150px;">
        <label class="form-label">Data Fim (Até)</label>
        <input type="date" class="form-control" id="filtro-data-fim" value="${eh(state.filtroDataFim)}">
      </div>
    `;
  }

  if (state.tipoRelatorio === 'aluno') {
    const allUnidades = unidades.getAll().sort((a, b) => a.nome.localeCompare(b.nome));
    const allCursos = cursos.getAll().sort((a, b) => a.nome.localeCompare(b.nome));
    const allTurnos = turnos.getAll().sort((a, b) => a.nome.localeCompare(b.nome));

    let filteredAlunos = alunos;
    if (state.filtroUnidadeId) filteredAlunos = filteredAlunos.filter(a => a.unidadeId === state.filtroUnidadeId);
    if (state.filtroTurmaId) filteredAlunos = filteredAlunos.filter(a => a.turmaId === state.filtroTurmaId);
    if (state.filtroCursoId) filteredAlunos = filteredAlunos.filter(a => {
      const t = turmas.find(x => x.id === a.turmaId);
      return t && t.cursoId === state.filtroCursoId;
    });
    if (state.filtroTurnoId) filteredAlunos = filteredAlunos.filter(a => {
      const t = turmas.find(x => x.id === a.turmaId);
      return t && t.turnoId === state.filtroTurnoId;
    });

    let filteredTurmas = turmas;
    if (state.filtroUnidadeId) filteredTurmas = filteredTurmas.filter(t => t.unidadeId === state.filtroUnidadeId);
    if (state.filtroCursoId) filteredTurmas = filteredTurmas.filter(t => t.cursoId === state.filtroCursoId);
    if (state.filtroTurnoId) filteredTurmas = filteredTurmas.filter(t => t.turnoId === state.filtroTurnoId);

    return `
      <div class="form-group" style="flex: 1; min-width: 140px;">
        <label class="form-label">Unidade</label>
        <select class="form-control filtro-select-dinamico" id="select-unidade">
          <option value="">Todas</option>
          ${allUnidades.map(u => `<option value="${u.id}" ${state.filtroUnidadeId === u.id ? 'selected' : ''}>${eh(u.nome)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group" style="flex: 1; min-width: 140px;">
        <label class="form-label">Curso</label>
        <select class="form-control filtro-select-dinamico" id="select-curso">
          <option value="">Todos</option>
          ${allCursos.map(c => `<option value="${c.id}" ${state.filtroCursoId === c.id ? 'selected' : ''}>${eh(c.nome)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group" style="flex: 1; min-width: 140px;">
        <label class="form-label">Turno</label>
        <select class="form-control filtro-select-dinamico" id="select-turno">
          <option value="">Todos</option>
          ${allTurnos.map(t => `<option value="${t.id}" ${state.filtroTurnoId === t.id ? 'selected' : ''}>${eh(t.nome)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group" style="flex: 1; min-width: 140px;">
        <label class="form-label">Turma</label>
        <select class="form-control filtro-select-dinamico" id="select-turma">
          <option value="">Todas</option>
          ${filteredTurmas.map(t => `<option value="${t.id}" ${state.filtroTurmaId == t.id ? 'selected' : ''}>${eh(t.nome)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group" style="flex: 1; min-width: 250px;">
        <label class="form-label">Selecionar Aluno</label>
        <select class="form-control filtro-select-dinamico" id="select-aluno">
          <option value="">Selecione um aluno...</option>
          ${filteredAlunos.map(a => `<option value="${a.id}" ${state.filtroAlunoId == a.id ? 'selected' : ''}>${eh(a.nome)}</option>`).join('')}
        </select>
      </div>
    `;
  }

  if (state.tipoRelatorio === 'disciplina') {
    const allUnidades = unidades.getAll().sort((a, b) => a.nome.localeCompare(b.nome));
    const allCursos = cursos.getAll().sort((a, b) => a.nome.localeCompare(b.nome));
    const allTurnos = turnos.getAll().sort((a, b) => a.nome.localeCompare(b.nome));

    const dMap = new Set();
    notas.forEach(n => { if (n.disciplina) dMap.add(n.disciplina) });
    const discs = Array.from(dMap).sort();

    let filteredTurmas = turmas;
    if (state.filtroUnidadeId) filteredTurmas = filteredTurmas.filter(t => t.unidadeId === state.filtroUnidadeId);
    if (state.filtroCursoId) filteredTurmas = filteredTurmas.filter(t => t.cursoId === state.filtroCursoId);
    if (state.filtroTurnoId) filteredTurmas = filteredTurmas.filter(t => t.turnoId === state.filtroTurnoId);

    return `
      <div class="form-group" style="flex: 1; min-width: 140px;">
        <label class="form-label">Unidade</label>
        <select class="form-control filtro-select-dinamico" id="select-unidade">
          <option value="">Todas</option>
          ${allUnidades.map(u => `<option value="${u.id}" ${state.filtroUnidadeId === u.id ? 'selected' : ''}>${eh(u.nome)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group" style="flex: 1; min-width: 140px;">
        <label class="form-label">Curso</label>
        <select class="form-control filtro-select-dinamico" id="select-curso">
          <option value="">Todos</option>
          ${allCursos.map(c => `<option value="${c.id}" ${state.filtroCursoId === c.id ? 'selected' : ''}>${eh(c.nome)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group" style="flex: 1; min-width: 140px;">
        <label class="form-label">Turno</label>
        <select class="form-control filtro-select-dinamico" id="select-turno">
          <option value="">Todos</option>
          ${allTurnos.map(t => `<option value="${t.id}" ${state.filtroTurnoId === t.id ? 'selected' : ''}>${eh(t.nome)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group" style="flex: 1; min-width: 140px;">
        <label class="form-label">Turma</label>
        <select class="form-control filtro-select-dinamico" id="select-turma">
          <option value="">Todas</option>
          ${filteredTurmas.map(t => `<option value="${t.id}" ${state.filtroTurmaId == t.id ? 'selected' : ''}>${eh(t.nome)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group" style="flex: 1; min-width: 200px;">
        <label class="form-label">Disciplina</label>
        <select class="form-control filtro-select-dinamico" id="select-disciplina">
          <option value="">Todas as Disciplinas</option>
          ${discs.map(d => `<option value="${eh(d)}" ${state.filtroDisciplina === d ? 'selected' : ''}>${eh(d)}</option>`).join('')}
        </select>
      </div>
    `;
  }

  if (state.tipoRelatorio === 'turma') {
    const allUnidades = unidades.getAll().sort((a, b) => a.nome.localeCompare(b.nome));
    const allCursos = cursos.getAll().sort((a, b) => a.nome.localeCompare(b.nome));
    const allTurnos = turnos.getAll().sort((a, b) => a.nome.localeCompare(b.nome));

    let filteredTurmas = turmas;
    if (state.filtroUnidadeId) filteredTurmas = filteredTurmas.filter(t => t.unidadeId === state.filtroUnidadeId);
    if (state.filtroCursoId) filteredTurmas = filteredTurmas.filter(t => t.cursoId === state.filtroCursoId);
    if (state.filtroTurnoId) filteredTurmas = filteredTurmas.filter(t => t.turnoId === state.filtroTurnoId);

    return `
      <div class="form-group" style="flex: 1; min-width: 140px;">
        <label class="form-label">Unidade</label>
        <select class="form-control filtro-select-dinamico" id="select-unidade">
          <option value="">Todas</option>
          ${allUnidades.map(u => `<option value="${u.id}" ${state.filtroUnidadeId === u.id ? 'selected' : ''}>${eh(u.nome)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group" style="flex: 1; min-width: 140px;">
        <label class="form-label">Curso</label>
        <select class="form-control filtro-select-dinamico" id="select-curso">
          <option value="">Todos</option>
          ${allCursos.map(c => `<option value="${c.id}" ${state.filtroCursoId === c.id ? 'selected' : ''}>${eh(c.nome)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group" style="flex: 1; min-width: 140px;">
        <label class="form-label">Turno</label>
        <select class="form-control filtro-select-dinamico" id="select-turno">
          <option value="">Todos</option>
          ${allTurnos.map(t => `<option value="${t.id}" ${state.filtroTurnoId === t.id ? 'selected' : ''}>${eh(t.nome)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group" style="flex: 1; min-width: 250px;">
        <label class="form-label">Turma (Diário de Classe)</label>
        <select class="form-control filtro-select-dinamico" id="select-turma">
          <option value="">Selecione uma turma...</option>
          ${filteredTurmas.map(t => `<option value="${t.id}" ${state.filtroTurmaId == t.id ? 'selected' : ''}>${eh(t.nome)}</option>`).join('')}
        </select>
      </div>
    `;
  }

  if (state.tipoRelatorio === 'censo') {
    const allUnidades = unidades.getAll().sort((a, b) => a.nome.localeCompare(b.nome));
    const allTurnos = turnos.getAll().sort((a, b) => a.nome.localeCompare(b.nome));
    const ufsList = [...new Set(alunos.map(a => a.uf).filter(Boolean))].sort();
    
    let cidadesList = [];
    if (state.filtroUf) {
      cidadesList = [...new Set(alunos.filter(a => a.uf === state.filtroUf).map(a => a.cidade).filter(Boolean))].sort();
    } else {
      cidadesList = [...new Set(alunos.map(a => a.cidade).filter(Boolean))].sort();
    }

    return `
      <div class="form-group" style="flex: 1; min-width: 160px;">
        <label class="form-label">Unidade</label>
        <select class="form-control filtro-select-dinamico" id="select-unidade">
          <option value="">Todas as unidades</option>
          ${allUnidades.map(u => `<option value="${u.id}" ${state.filtroUnidadeId === u.id ? 'selected' : ''}>${eh(u.nome)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group" style="flex: 1; min-width: 160px;">
        <label class="form-label">Turma</label>
        <select class="form-control filtro-select-dinamico" id="select-turma">
          <option value="">Todas as turmas</option>
          ${turmas.map(t => `<option value="${t.id}" ${state.filtroTurmaId == t.id ? 'selected' : ''}>${eh(t.nome)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group" style="flex: 1; min-width: 140px;">
        <label class="form-label">Turno</label>
        <select class="form-control filtro-select-dinamico" id="select-turno">
          <option value="">Todos os turnos</option>
          ${allTurnos.map(t => `<option value="${t.id}" ${state.filtroTurnoId === t.id ? 'selected' : ''}>${eh(t.nome)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group" style="flex: 1; min-width: 120px;">
        <label class="form-label">Estado (UF)</label>
        <select class="form-control filtro-select-dinamico" id="select-uf">
          <option value="">Todos</option>
          ${ufsList.map(uf => `<option value="${uf}" ${state.filtroUf === uf ? 'selected' : ''}>${uf}</option>`).join('')}
        </select>
      </div>
      <div class="form-group" style="flex: 1; min-width: 160px;">
        <label class="form-label">Cidade</label>
        <select class="form-control filtro-select-dinamico" id="select-cidade">
          <option value="">Todas</option>
          ${cidadesList.map(c => `<option value="${eh(c)}" ${state.filtroCidade === c ? 'selected' : ''}>${eh(c)}</option>`).join('')}
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
    return renderPorAluno(state, allAlunos, allTurmas, allPresencas, allNotas, allCursos, allUnidades);
  }
  if (state.tipoRelatorio === 'disciplina') {
    return renderPorDisciplina(state, allNotas, allAlunos, allTurmas);
  }
  if (state.tipoRelatorio === 'turma') {
    return renderPorTurma(state, allTurmas, allAlunos, allPresencas);
  }
  if (state.tipoRelatorio === 'censo') {
    return renderCenso(state, allAlunos, allTurmas);
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
              ${frequenciaPorTurma.map(i => `<tr><td><strong>${eh(i.turmaNome)}</strong></td><td>${i.qtdAulas}</td><td>${i.percentual !== null ? `${i.percentual}%` : '—'}</td></tr>`).join('')}
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
  if (!state.filtroData || !state.filtroDataFim) return '<div class="empty-state"><p>Escolha um período válido (Data Início e Data Fim).</p></div>';

  if (state.filtroData > state.filtroDataFim) {
    return '<div class="empty-state"><p>A Data Início não pode ser maior que a Data Fim.</p></div>';
  }

  const registros = allPresencas.filter(p => p.data >= state.filtroData && p.data <= state.filtroDataFim);
  if (registros.length === 0) return '<div class="empty-state"><p>Nenhuma chamada registrada neste período.</p></div>';

  // Ordenar registros por data (decrescente)
  registros.sort((a, b) => new Date(b.data) - new Date(a.data));

  return `
    <div class="card">
      <div class="card-header"><span class="card-title">Presenças: ${formatDate(state.filtroData)} a ${formatDate(state.filtroDataFim)}</span></div>
      <div class="table-wrapper">
        <table>
          <thead><tr><th>Data</th><th>Aluno</th><th>Turma</th><th>Situação</th></tr></thead>
          <tbody>
            ${registros.map(r => {
    const aluno = allAlunos.find(a => a.id === r.alunoId);
    const turma = aluno ? allTurmas.find(t => t.id === aluno.turmaId) : null;
    const statusSpan = r.presente
      ? '<span style="color:var(--secondary-500); font-weight:700;">Presente</span>'
      : '<span style="color:var(--danger-500); font-weight:700;">Ausente</span>';
    return `<tr><td>${formatDate(r.data)}</td><td>${eh(aluno?.nome || '—')}</td><td>${eh(turma?.nome || '—')}</td><td>${statusSpan}</td></tr>`;
  }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderPorAluno(state, allAlunos, allTurmas, allPresencas, allNotas, allCursos, allUnidades) {
  if (!state.filtroAlunoId) return '<div class="empty-state"><p>Selecione um aluno acima.</p></div>';

  const aluno = allAlunos.find(a => a.id === state.filtroAlunoId);
  const turma = allTurmas.find(t => t.id === aluno?.turmaId);
  const pList = allPresencas.filter(p => p.alunoId === aluno.id);
  const nList = allNotas.filter(n => n.alunoId === aluno.id);

  const cursoObj = allCursos.find(c => c.id === turma?.cursoId);
  const unidadeObj = allUnidades.find(u => u.id === aluno.unidadeId);

  const presencasNum = pList.filter(p => p.presente).length;
  const faltasNum = pList.length - presencasNum;
  const percFreq = pList.length > 0 ? ((presencasNum / pList.length) * 100).toFixed(1) : 100;

  const discMap = {};
  nList.forEach(n => {
    if (!discMap[n.disciplina]) discMap[n.disciplina] = {1: '-', 2: '-', 3: '-', 4: '-'};
    
    let mod = 1;
    if (n.modulo) {
        mod = parseInt(n.modulo, 10);
    } else {
        // Fallback para notas antigas sem o carimbo do módulo
        let ref = String(n.referencia || n.periodo || '').toUpperCase().trim();
        if (ref.includes('4') || ref.includes('IV')) mod = 4;
        else if (ref.includes('3') || ref.includes('III')) mod = 3;
        else if (ref.includes('2') || ref.includes('II')) mod = 2;
        else if (ref.includes('1') || ref.includes('I')) mod = 1;
    }
    
    // Se a nota for maior que 10 e não houver ponto, formatar para exibição caso necessário, mas vamos confiar no que foi digitado
    if (mod >= 1 && mod <= 4) {
        discMap[n.disciplina][mod] = n.nota;
    }
  });

  const discs = Object.keys(discMap).sort((a, b) => a.localeCompare(b));

  return `
    <div style="background: #fff; padding: 24px; color: #000; border: 1px solid #ccc; max-width: 900px; margin: 0 auto; overflow-x: auto; margin-bottom: 24px; font-family: 'Times New Roman', Times, serif;">
      
      <!-- Cabeçalho Oficial -->
      <div style="text-align: center; margin-bottom: 15px;">
        <h2 style="font-size:14px; text-transform:uppercase; margin:2px 0;">República Federativa do Brasil</h2>
        <h2 style="font-size:14px; text-transform:uppercase; margin:2px 0;">Secretaria da Educação do Estado da Bahia</h2>
        <h1 style="font-size:18px; margin:10px 0; font-weight:bold;">HISTÓRICO ESCOLAR</h1>
        <h3 style="font-size:14px; margin:2px 0; font-weight:normal;">EDUCAÇÃO PROFISSIONAL TÉCNICA DE NÍVEL MÉDIO</h3>
      </div>
      
      <!-- Dados Institucionais e do Aluno -->
      <table style="width:100%; border-collapse:collapse; font-size:12px; margin-bottom:8px;">
        <tr>
          <td colspan="3" style="border:1px solid #000; padding:4px;">Estabelecimento: <strong>${eh(unidadeObj?.nome || '—')}</strong></td>
          <td style="border:1px solid #000; padding:4px;">Código: <strong>${eh(unidadeObj?.id?.substring(0,6) || '—')}</strong></td>
        </tr>
        <tr>
          <td colspan="4" style="border:1px solid #000; padding:4px;">Endereço: <strong>${eh(unidadeObj?.endereco || '—')}</strong></td>
        </tr>
        <tr>
          <td colspan="4" style="border:1px solid #000; padding:4px;">Nome do Aluno: <strong>${eh(aluno.nome)}</strong></td>
        </tr>
        <tr>
          <td style="border:1px solid #000; padding:4px;">Data de Nascimento: <strong>${aluno.dataNascimento ? formatDate(aluno.dataNascimento) : '—'}</strong></td>
          <td style="border:1px solid #000; padding:4px;">Matrícula: <strong>${eh(aluno.matricula || '—')}</strong></td>
          <td colspan="2" style="border:1px solid #000; padding:4px;">Nacionalidade: <strong>Brasileira</strong></td>
        </tr>
        <tr>
          <td colspan="4" style="border:1px solid #000; padding:4px;">Habilitação/Curso: <strong>${eh(cursoObj?.nome || '—')}</strong></td>
        </tr>
      </table>

      <!-- Tabela de Componentes Curriculares -->
      <table style="width:100%; border-collapse:collapse; font-size:12px; border:1px solid #000; text-align:center;">
        <thead>
          <tr>
            <th rowspan="2" style="border:1px solid #000; padding:4px; width:40%;">COMPONENTES CURRICULARES</th>
            <th colspan="2" style="border:1px solid #000; padding:4px;">Módulo I</th>
            <th colspan="2" style="border:1px solid #000; padding:4px;">Módulo II</th>
            <th colspan="2" style="border:1px solid #000; padding:4px;">Módulo III</th>
            <th colspan="2" style="border:1px solid #000; padding:4px;">Módulo IV</th>
          </tr>
          <tr>
            <th style="border:1px solid #000; padding:4px; font-size:10px;">NOTA</th>
            <th style="border:1px solid #000; padding:4px; font-size:10px;">C. HOR</th>
            <th style="border:1px solid #000; padding:4px; font-size:10px;">NOTA</th>
            <th style="border:1px solid #000; padding:4px; font-size:10px;">C. HOR</th>
            <th style="border:1px solid #000; padding:4px; font-size:10px;">NOTA</th>
            <th style="border:1px solid #000; padding:4px; font-size:10px;">C. HOR</th>
            <th style="border:1px solid #000; padding:4px; font-size:10px;">NOTA</th>
            <th style="border:1px solid #000; padding:4px; font-size:10px;">C. HOR</th>
          </tr>
        </thead>
        <tbody>
          ${discs.length === 0 ? '<tr><td colspan="9" style="border:1px solid #000; padding:8px;">Nenhum componente curricular registrado.</td></tr>' : 
            discs.map(d => `
            <tr>
              <td style="border:1px solid #000; padding:4px; text-align:left;">${eh(d)}</td>
              <td style="border:1px solid #000; padding:4px;">${discMap[d][1]}</td>
              <td style="border:1px solid #000; padding:4px;">-</td>
              <td style="border:1px solid #000; padding:4px;">${discMap[d][2]}</td>
              <td style="border:1px solid #000; padding:4px;">-</td>
              <td style="border:1px solid #000; padding:4px;">${discMap[d][3]}</td>
              <td style="border:1px solid #000; padding:4px;">-</td>
              <td style="border:1px solid #000; padding:4px;">${discMap[d][4]}</td>
              <td style="border:1px solid #000; padding:4px;">-</td>
            </tr>`).join('')
          }
        </tbody>
      </table>
      
      <!-- Frequência e Observações -->
      <div style="margin-top: 15px; font-size: 12px; line-height:1.5;">
        <p style="margin: 0;"><strong>Aulas Registradas:</strong> ${pList.length} &nbsp;|&nbsp; <strong>Presenças:</strong> ${presencasNum} &nbsp;|&nbsp; <strong>Faltas:</strong> ${faltasNum}</p>
        <p style="margin: 0;"><strong>Frequência Acumulada:</strong> ${percFreq}%</p>
        <p style="margin: 5px 0 0 0;"><strong>Observações:</strong> O rendimento e a frequência do aluno estão em conformidade com o regimento escolar. Documento emitido digitalmente pelo sistema EduPresença.</p>
      </div>

    </div>
  `;
}

function renderPorDisciplina(state, allNotas, allAlunos, allTurmas) {
  let nList = allNotas;
  if (state.filtroDisciplina) nList = nList.filter(n => n.disciplina === state.filtroDisciplina);

  // Apply cascade filters
  nList = nList.filter(n => {
    const aluno = allAlunos.find(a => a.id === n.alunoId);
    if (!aluno) return false;
    const turma = allTurmas.find(t => t.id === aluno.turmaId);
    
    if (state.filtroUnidadeId && aluno.unidadeId !== state.filtroUnidadeId) return false;
    if (state.filtroTurmaId && aluno.turmaId !== state.filtroTurmaId) return false;
    if (state.filtroCursoId && (!turma || turma.cursoId !== state.filtroCursoId)) return false;
    if (state.filtroTurnoId && (!turma || turma.turnoId !== state.filtroTurnoId)) return false;
    
    return true;
  });

  if (nList.length === 0) return '<div class="empty-state"><p>Nenhuma nota encontrada para os filtros selecionados.</p></div>';

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

  // Obter datas únicas das chamadas registradas para esta turma
  const uniqueDates = [...new Set(pList.map(p => p.data))].sort();
  const datesHtml = uniqueDates.length > 0
    ? `<div style="font-size:12px; color:var(--text-secondary, #94a3b8); margin-top:8px; display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
         <strong>Datas das Chamadas:</strong> 
         ${uniqueDates.map(d => `<span style="background:var(--surface-3, #f1f5f9); border:1px solid var(--border-color, #e2e8f0); color:var(--text-secondary, #94a3b8); padding:2px 8px; border-radius:4px; font-weight:600; font-size:11px;">${formatDate(d)}</span>`).join(' ')}
       </div>`
    : `<div style="font-size:12px; color:var(--text-tertiary, #cbd5e1); margin-top:8px;">Nenhuma chamada registrada para esta turma.</div>`;

  return `
    <div class="card">
      <div class="card-header" style="display:flex; flex-direction:column; align-items:flex-start; gap:4px;">
        <span class="card-title">Diário Consolidado: ${eh(turma.nome)}</span>
        ${datesHtml}
      </div>
      <div class="table-wrapper">
        <table>
          <thead><tr><th>Aluno</th><th>Aulas</th><th>Faltas</th><th>Frequência</th></tr></thead>
          <tbody>
            ${alList.map(a => {
    const pAluno = pList.filter(p => p.alunoId === a.id);
    const hasCalls = pAluno.length > 0;
    const presentes = pAluno.filter(p => p.presente).length;
    const freq = hasCalls ? ((presentes / pAluno.length) * 100).toFixed(1) : null;
    
    const freqDisplay = hasCalls ? `${freq}%` : '—';
    const faltasDisplay = hasCalls ? (pAluno.length - presentes) : '—';
    const freqStyle = (hasCalls && parseFloat(freq) < 75) ? 'color:var(--danger-500)' : '';

    return `<tr>
                <td><strong>${eh(a.nome)}</strong></td>
                <td>${pAluno.length}</td>
                <td style="color:var(--danger-500)">${faltasDisplay}</td>
                <td style="font-weight:700; ${freqStyle}">${freqDisplay}</td>
              </tr>`;
  }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderCenso(state, allAlunos, allTurmas) {
  let filtered = allAlunos.filter(a => a.situacao !== 'inativo');

  // Filter by Unidade
  if (state.filtroUnidadeId) {
    filtered = filtered.filter(a => a.unidadeId === state.filtroUnidadeId);
  }

  // Filter by Turma
  if (state.filtroTurmaId) {
    filtered = filtered.filter(a => a.turmaId === state.filtroTurmaId);
  }

  // Filter by Turno
  if (state.filtroTurnoId) {
    filtered = filtered.filter(a => {
      const t = allTurmas.find(x => x.id === a.turmaId);
      return t && t.turnoId === state.filtroTurnoId;
    });
  }

  // Filter by UF
  if (state.filtroUf) {
    filtered = filtered.filter(a => a.uf === state.filtroUf);
  }

  // Filter by Cidade
  if (state.filtroCidade) {
    filtered = filtered.filter(a => a.cidade === state.filtroCidade);
  }

  const total = filtered.length;

  // ── Gênero / Sexo ──
  const sexoCounts = { Masculino: 0, Feminino: 0, Outro: 0 };
  filtered.forEach(a => {
    const s = a.sexo || 'Outro';
    if (sexoCounts[s] !== undefined) {
      sexoCounts[s]++;
    } else {
      sexoCounts['Outro']++;
    }
  });

  // ── Cor / Raça (IBGE) com Sexo ──
  const corCounts = {
    'Branca': { total: 0, m: 0, f: 0, o: 0 },
    'Preta': { total: 0, m: 0, f: 0, o: 0 },
    'Parda': { total: 0, m: 0, f: 0, o: 0 },
    'Amarela': { total: 0, m: 0, f: 0, o: 0 },
    'Indígena': { total: 0, m: 0, f: 0, o: 0 },
    'Não declarado': { total: 0, m: 0, f: 0, o: 0 }
  };
  filtered.forEach(a => {
    let c = a.cor || 'Não declarado';
    if (corCounts[c] === undefined) c = 'Não declarado';
    
    const s = a.sexo || 'Outro';
    
    corCounts[c].total++;
    if (s === 'Masculino') corCounts[c].m++;
    else if (s === 'Feminino') corCounts[c].f++;
    else corCounts[c].o++;
  });

  // ── Faixa Etária e Média ──
  let ageSum = 0;
  let ageCount = 0;
  const faixas = {
    'Infantil (0–5 anos)': 0,
    'Fundamental I (6–11 anos)': 0,
    'Fundamental II (12–14 anos)': 0,
    'Ensino Médio (15–17 anos)': 0,
    'EJA / Superior (18+ anos)': 0,
    'Não informado': 0
  };

  filtered.forEach(a => {
    if (a.dataNascimento) {
      const age = calculateAge(a.dataNascimento);
      if (age !== null && age !== undefined && age !== '') {
        ageSum += age;
        ageCount++;

        if (age <= 5) faixas['Infantil (0–5 anos)']++;
        else if (age <= 11) faixas['Fundamental I (6–11 anos)']++;
        else if (age <= 14) faixas['Fundamental II (12–14 anos)']++;
        else if (age <= 17) faixas['Ensino Médio (15–17 anos)']++;
        else faixas['EJA / Superior (18+ anos)']++;
      } else {
        faixas['Não informado']++;
      }
    } else {
      faixas['Não informado']++;
    }
  });

  const mediaIdade = ageCount > 0 ? (ageSum / ageCount).toFixed(1) : '—';

  // ── Distribuição por Localização (UF e Cidade) ──
  const ufCounts = {};
  const cidadeCounts = {};
  
  filtered.forEach(a => {
    const uf = a.uf || 'Não informado';
    ufCounts[uf] = (ufCounts[uf] || 0) + 1;
    
    const cid = a.cidade || 'Não informado';
    cidadeCounts[cid] = (cidadeCounts[cid] || 0) + 1;
  });

  return `
    <div class="kpi-grid" style="margin-bottom: var(--space-6);">
      <div class="kpi-card" style="border: 1px solid var(--border-color); background: var(--bg-secondary); border-radius: var(--radius-lg); padding: var(--space-4) var(--space-6); text-align: center;">
        <div class="kpi-icon" style="font-size: 24px; margin-bottom: var(--space-2);">👤</div>
        <div class="kpi-value" style="font-size: 28px; font-weight: 700; color: var(--text-primary);">${total}</div>
        <div class="kpi-label" style="font-size: 12px; color: var(--text-secondary);">Alunos no Censo</div>
      </div>
      <div class="kpi-card green" style="border: 1px solid var(--border-color); background: var(--bg-secondary); border-radius: var(--radius-lg); padding: var(--space-4) var(--space-6); text-align: center;">
        <div class="kpi-icon" style="font-size: 24px; margin-bottom: var(--space-2);">🎂</div>
        <div class="kpi-value" style="font-size: 28px; font-weight: 700; color: var(--text-primary);">${mediaIdade}</div>
        <div class="kpi-label" style="font-size: 12px; color: var(--text-secondary);">Média de Idade (Anos)</div>
      </div>
    </div>

    <div class="grid grid-2" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: var(--space-6); margin-bottom: var(--space-6);">
      <!-- Card Sexo -->
      <div class="card" style="border: 1px solid var(--border-color); background: var(--bg-secondary); border-radius: var(--radius-lg); overflow: hidden;">
        <div class="card-header" style="padding: var(--space-4) var(--space-6); border-bottom: 1px solid var(--border-color); font-weight: 600; color: var(--text-primary); font-size: 15px;">
          Distribuição por Gênero / Sexo
        </div>
        <div class="card-body" style="padding: var(--space-6);">
          ${Object.entries(sexoCounts).map(([label, count]) => {
            const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
            let barColor = 'var(--primary-400)';
            if (label === 'Feminino') barColor = 'var(--accent-400,#818cf8)';
            if (label === 'Outro') barColor = 'var(--neutral-400)';
            return `
              <div style="margin-bottom: var(--space-4);">
                <div style="display:flex; justify-content: space-between; margin-bottom: 4px; font-size: 13px; font-weight: 600;">
                  <span>${label}</span>
                  <span style="color:var(--text-secondary); font-size:12px;">${count} aluno(s) (${pct}%)</span>
                </div>
                <div style="height:8px; background:var(--bg-tertiary,#e2e8f0); border-radius:4px; overflow:hidden;">
                  <div style="width:${pct}%; height:100%; background:${barColor}; border-radius:4px; transition:width 0.6s ease;"></div>
                </div>
              </div>`;
          }).join('')}
        </div>
      </div>

      <!-- Card Cor / Raça -->
      <div class="card" style="border: 1px solid var(--border-color); background: var(--bg-secondary); border-radius: var(--radius-lg); overflow: hidden;">
        <div class="card-header" style="padding: var(--space-4) var(--space-6); border-bottom: 1px solid var(--border-color); font-weight: 600; color: var(--text-primary); font-size: 15px;">
          Distribuição por Cor ou Raça (IBGE)
        </div>
        <div class="card-body" style="padding: var(--space-6);">
          ${Object.entries(corCounts).map(([label, data]) => {
            const count = data.total;
            const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
            let barColor = 'var(--primary-400)';
            if (label === 'Preta') barColor = '#4b5563';
            if (label === 'Parda') barColor = '#d97706';
            if (label === 'Amarela') barColor = '#eab308';
            if (label === 'Indígena') barColor = '#10b981';
            if (label === 'Não declarado') barColor = 'var(--neutral-400)';

            let breakdownText = '';
            if (count > 0) {
              const parts = [];
              if (data.f > 0) parts.push(`${data.f} feminino`);
              if (data.m > 0) parts.push(`${data.m} masculino`);
              if (data.o > 0) parts.push(`${data.o} outro`);
              breakdownText = ` = ${parts.join(', ')}`;
            }

            return `
              <div style="margin-bottom: var(--space-4);">
                <div style="display:flex; justify-content: space-between; margin-bottom: 4px; font-size: 13px; font-weight: 600;">
                  <span>${label}</span>
                  <span style="color:var(--text-secondary); font-size:12px;">${count} aluno(s)<span style="font-weight:normal; font-size:11px">${breakdownText}</span> &nbsp;|&nbsp; ${pct}%</span>
                </div>
                <div style="height:8px; background:var(--bg-tertiary,#e2e8f0); border-radius:4px; overflow:hidden;">
                  <div style="width:${pct}%; height:100%; background:${barColor}; border-radius:4px; transition:width 0.6s ease;"></div>
                </div>
              </div>`;
          }).join('')}
        </div>
      </div>
    </div>

    <div class="grid grid-2" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: var(--space-6); margin-bottom: var(--space-6);">
      <!-- Card UF -->
      <div class="card" style="border: 1px solid var(--border-color); background: var(--bg-secondary); border-radius: var(--radius-lg); overflow: hidden;">
        <div class="card-header" style="padding: var(--space-4) var(--space-6); border-bottom: 1px solid var(--border-color); font-weight: 600; color: var(--text-primary); font-size: 15px;">
          Distribuição Geográfica por Estado (UF)
        </div>
        <div class="card-body" style="padding: var(--space-6); max-height: 280px; overflow-y: auto;">
          ${Object.entries(ufCounts).sort((a, b) => b[1] - a[1]).map(([label, count]) => {
            const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
            return `
              <div style="margin-bottom: var(--space-4);">
                <div style="display:flex; justify-content: space-between; margin-bottom: 4px; font-size: 13px; font-weight: 600;">
                  <span>${label}</span>
                  <span style="color:var(--text-secondary); font-size:12px;">${count} aluno(s) (${pct}%)</span>
                </div>
                <div style="height:8px; background:var(--bg-tertiary,#e2e8f0); border-radius:4px; overflow:hidden;">
                  <div style="width:${pct}%; height:100%; background:var(--accent-400,#818cf8); border-radius:4px; transition:width 0.6s ease;"></div>
                </div>
              </div>`;
          }).join('')}
        </div>
      </div>

      <!-- Card Cidade -->
      <div class="card" style="border: 1px solid var(--border-color); background: var(--bg-secondary); border-radius: var(--radius-lg); overflow: hidden;">
        <div class="card-header" style="padding: var(--space-4) var(--space-6); border-bottom: 1px solid var(--border-color); font-weight: 600; color: var(--text-primary); font-size: 15px;">
          Distribuição Geográfica por Município
        </div>
        <div class="card-body" style="padding: var(--space-6); max-height: 280px; overflow-y: auto;">
          ${Object.entries(cidadeCounts).sort((a, b) => b[1] - a[1]).map(([label, count]) => {
            const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
            return `
              <div style="margin-bottom: var(--space-4);">
                <div style="display:flex; justify-content: space-between; margin-bottom: 4px; font-size: 13px; font-weight: 600;">
                  <span>${label}</span>
                  <span style="color:var(--text-secondary); font-size:12px;">${count} aluno(s) (${pct}%)</span>
                </div>
                <div style="height:8px; background:var(--bg-tertiary,#e2e8f0); border-radius:4px; overflow:hidden;">
                  <div style="width:${pct}%; height:100%; background:var(--secondary-400,#10b981); border-radius:4px; transition:width 0.6s ease;"></div>
                </div>
              </div>`;
          }).join('')}
        </div>
      </div>
    </div>

    <!-- Faixas Etárias -->
    <div class="card" style="border: 1px solid var(--border-color); background: var(--bg-secondary); border-radius: var(--radius-lg); overflow: hidden; margin-bottom: var(--space-6);">
      <div class="card-header" style="padding: var(--space-4) var(--space-6); border-bottom: 1px solid var(--border-color); font-weight: 600; color: var(--text-primary); font-size: 15px;">
        Distribuição por Faixa Etária
      </div>
      <div class="card-body" style="padding: var(--space-6);">
        ${Object.entries(faixas).map(([label, count]) => {
          const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
          return `
            <div style="margin-bottom: var(--space-4);">
              <div style="display:flex; justify-content: space-between; margin-bottom: 4px; font-size: 13px; font-weight: 600;">
                <span>${label}</span>
                <span style="color:var(--text-secondary); font-size:12px;">${count} aluno(s) (${pct}%)</span>
              </div>
              <div style="height:8px; background:var(--bg-tertiary,#e2e8f0); border-radius:4px; overflow:hidden;">
                <div style="width:${pct}%; height:100%; background:var(--secondary-400,#10b981); border-radius:4px; transition:width 0.6s ease;"></div>
              </div>
            </div>`;
        }).join('')}
      </div>
    </div>
  `;
}

// ── Exportar PDF Dinâmico ────────────────────────────────
function exportarDinamicoPDF(state, totalAlunos, totalTurmas, totalCursos, totalUnidades, frequenciaPorTurma, relatorioNotas, alunosFrequenciaBaixa, allAlunos, allTurmas, allNotas, allPresencas) {
  const win = window.open('', '_blank');
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
      freqTurma.forEach(i => csvContent += `${i.turmaNome},${i.qtdAlunos},${i.qtdAulas},${i.percentual !== null ? i.percentual + '%' : '—'}\n`);
      csvContent += '\n';
    }
    if (state.showNotas) {
      csvContent += 'Disciplina,Media,Aprovados,Reprovados\n';
      notasDisc.forEach(i => csvContent += `${i.disciplina},${i.media},${i.aprovados},${i.reprovados}\n`);
    }
  }

  else if (state.tipoRelatorio === 'data' && state.filtroData && state.filtroDataFim) {
    csvContent += `Presencas (${state.filtroData} a ${state.filtroDataFim})\n`;
    csvContent += 'Data,Aluno,Turma,Situacao\n';
    
    const registros = allPresencas.filter(p => p.data >= state.filtroData && p.data <= state.filtroDataFim);
    registros.sort((a, b) => new Date(b.data) - new Date(a.data));
    
    registros.forEach(p => {
      const a = allAlunos.find(x => x.id === p.alunoId);
      const t = a ? allTurmas.find(x => x.id === a.turmaId) : null;
      csvContent += `${formatDate(p.data)},${a?.nome || '?'},${t?.nome || '?'},${p.presente ? 'Presente' : 'Ausente'}\n`;
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

  else if (state.tipoRelatorio === 'censo') {
    let filtered = allAlunos.filter(a => a.situacao !== 'inativo');
    if (state.filtroUnidadeId) {
      filtered = filtered.filter(a => a.unidadeId === state.filtroUnidadeId);
    }
    if (state.filtroTurmaId) {
      filtered = filtered.filter(a => a.turmaId === state.filtroTurmaId);
    }
    if (state.filtroTurnoId) {
      filtered = filtered.filter(a => {
        const t = allTurmas.find(x => x.id === a.turmaId);
        return t && t.turnoId === state.filtroTurnoId;
      });
    }
    if (state.filtroUf) {
      filtered = filtered.filter(a => a.uf === state.filtroUf);
    }
    if (state.filtroCidade) {
      filtered = filtered.filter(a => a.cidade === state.filtroCidade);
    }

    csvContent += "Censo Demografico - Estatisticas\n\n";

    // Gênero / Sexo
    const sexoCounts = { Masculino: 0, Feminino: 0, Outro: 0 };
    filtered.forEach(a => {
      const s = a.sexo || 'Outro';
      if (sexoCounts[s] !== undefined) sexoCounts[s]++;
      else sexoCounts['Outro']++;
    });
    csvContent += "Genero / Sexo,Qtd,%\n";
    Object.entries(sexoCounts).forEach(([label, count]) => {
      const pct = filtered.length > 0 ? ((count / filtered.length) * 100).toFixed(1) : '0.0';
      csvContent += `${label},${count},${pct}%\n`;
    });

    csvContent += "\n";

    // Cor / Raça
    const corCounts = { 
      'Branca': { total: 0, m: 0, f: 0, o: 0 },
      'Preta': { total: 0, m: 0, f: 0, o: 0 },
      'Parda': { total: 0, m: 0, f: 0, o: 0 },
      'Amarela': { total: 0, m: 0, f: 0, o: 0 },
      'Indígena': { total: 0, m: 0, f: 0, o: 0 },
      'Não declarado': { total: 0, m: 0, f: 0, o: 0 }
    };
    filtered.forEach(a => {
      let c = a.cor || 'Não declarado';
      if (corCounts[c] === undefined) c = 'Não declarado';
      const s = a.sexo || 'Outro';
      
      corCounts[c].total++;
      if (s === 'Masculino') corCounts[c].m++;
      else if (s === 'Feminino') corCounts[c].f++;
      else corCounts[c].o++;
    });
    csvContent += "Cor ou Raca (IBGE),Total,Feminino,Masculino,Outro,%\n";
    Object.entries(corCounts).forEach(([label, data]) => {
      const pct = filtered.length > 0 ? ((data.total / filtered.length) * 100).toFixed(1) : '0.0';
      csvContent += `${label},${data.total},${data.f},${data.m},${data.o},${pct}%\n`;
    });

    csvContent += "\n";

    // Faixa Etária
    const faixas = { 'Infantil (0-5 anos)': 0, 'Fundamental I (6-11 anos)': 0, 'Fundamental II (12-14 anos)': 0, 'Ensino Medio (15-17 anos)': 0, 'EJA / Superior (18+ anos)': 0, 'Não informado': 0 };
    let ageSum = 0, ageCount = 0;
    filtered.forEach(a => {
      if (a.dataNascimento) {
        const age = calculateAge(a.dataNascimento);
        if (age !== null && age !== undefined && age !== '') {
          ageSum += age;
          ageCount++;
          if (age <= 5) faixas['Infantil (0-5 anos)']++;
          else if (age <= 11) faixas['Fundamental I (6-11 anos)']++;
          else if (age <= 14) faixas['Fundamental II (12-14 anos)']++;
          else if (age <= 17) faixas['Ensino Medio (15-17 anos)']++;
          else faixas['EJA / Superior (18+ anos)']++;
        } else faixas['Não informado']++;
      } else faixas['Não informado']++;
    });
    csvContent += "Faixa Etaria,Qtd,%\n";
    Object.entries(faixas).forEach(([label, count]) => {
      const pct = filtered.length > 0 ? ((count / filtered.length) * 100).toFixed(1) : '0.0';
      csvContent += `${label},${count},${pct}%\n`;
    });

    const mediaIdade = ageCount > 0 ? (ageSum / ageCount).toFixed(1) : '—';
    csvContent += `\nMedia de Idade (Anos),${mediaIdade}\n\n`;

    // Distribuição Geográfica (UF)
    const ufCounts = {};
    const cidadeCounts = {};
    filtered.forEach(a => {
      const uf = a.uf || 'Não informado';
      ufCounts[uf] = (ufCounts[uf] || 0) + 1;
      const cid = a.cidade || 'Não informado';
      cidadeCounts[cid] = (cidadeCounts[cid] || 0) + 1;
    });

    csvContent += "Distribuição Geográfica por Estado (UF),Qtd,%\n";
    Object.entries(ufCounts).sort((a,b)=>b[1]-a[1]).forEach(([label, count]) => {
      const pct = filtered.length > 0 ? ((count / filtered.length) * 100).toFixed(1) : '0.0';
      csvContent += `${label},${count},${pct}%\n`;
    });

    csvContent += "\nDistribuição Geográfica por Município,Qtd,%\n";
    Object.entries(cidadeCounts).sort((a,b)=>b[1]-a[1]).forEach(([label, count]) => {
      const pct = filtered.length > 0 ? ((count / filtered.length) * 100).toFixed(1) : '0.0';
      csvContent += `${label},${count},${pct}%\n`;
    });
  }

  if (!csvContent) {
    window.toast?.warning('Sem dados', 'Nenhum dado selecionado para exportar.');
    return;
  }

  // Add BOM for Excel UTF-8
  const blob = new Blob(["\ufeff", csvContent], { type: 'text/csv;charset=utf-8;' });
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
