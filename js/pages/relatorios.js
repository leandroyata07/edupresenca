// =========================================================
// EduPresença – Relatórios Page
// =========================================================
import { turmas, alunos, presencas, notas, cursos, unidades, disciplinas } from '../store.js';
import { formatPercent, escapeHtml as eh, formatDate } from '../utils.js';

export function render(outlet) {
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
        <h1 class="page-title">Relatórios</h1>
        <p class="page-subtitle">Visualize estatísticas e indicadores do sistema</p>
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
          Imprimir
        </button>
      </div>
    </div>

    <!-- KPIs -->
    <div class="kpi-grid" style="margin-bottom: var(--space-6);">
      <div class="kpi-card">
        <div class="kpi-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <div class="kpi-value">${totalAlunos}</div>
        <div class="kpi-label">Alunos Ativos</div>
      </div>

      <div class="kpi-card orange">
        <div class="kpi-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          </svg>
        </div>
        <div class="kpi-value">${totalTurmas}</div>
        <div class="kpi-label">Turmas</div>
      </div>

      <div class="kpi-card green">
        <div class="kpi-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
          </svg>
        </div>
        <div class="kpi-value">${totalCursos}</div>
        <div class="kpi-label">Cursos</div>
      </div>

      <div class="kpi-card blue">
        <div class="kpi-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <div class="kpi-value">${totalUnidades}</div>
        <div class="kpi-label">Unidades</div>
      </div>
    </div>

    <!-- Relatórios em Grid -->
    <div class="grid grid-2" style="gap: var(--space-6); margin-bottom: var(--space-6);">
      
      <!-- Frequência por Turma -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 11 12 14 22 4"/>
            </svg>
            Frequência por Turma
          </span>
        </div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Turma</th>
                <th>Alunos</th>
                <th>Aulas</th>
                <th>Frequência</th>
              </tr>
            </thead>
            <tbody>
              ${frequenciaPorTurma.length > 0 ? frequenciaPorTurma.map(item => {
                const corBarra = item.percentual >= 75 ? 'var(--secondary-500)' : 'var(--danger-500)';
                const corTexto = item.percentual >= 75 ? 'var(--secondary-400)' : 'var(--danger-400)';
                return `
                  <tr>
                    <td>
                      <strong>${eh(item.turmaNome)}</strong><br/>
                      <span style="font-size: 11px; color: var(--text-tertiary);">${eh(item.cursoNome)}</span>
                    </td>
                    <td>${item.qtdAlunos}</td>
                    <td>${item.qtdAulas}</td>
                    <td>
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <div class="progress-bar-container" style="width: 70px;">
                          <div class="progress-bar-fill" style="width: ${item.percentual}%; background: ${corBarra};"></div>
                        </div>
                        <span style="font-size: 12px; font-weight: 700; color: ${corTexto};">${item.percentual}%</span>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('') : `
                <tr>
                  <td colspan="4" style="text-align: center; padding: 32px; color: var(--text-tertiary);">
                    Nenhum dado de presença disponível.
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Notas por Disciplina -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            Desempenho por Disciplina
          </span>
        </div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Disciplina</th>
                <th>Média</th>
                <th>Aprovados</th>
                <th>Recuperação</th>
                <th>Reprovados</th>
              </tr>
            </thead>
            <tbody>
              ${relatorioNotas.length > 0 ? relatorioNotas.map(item => {
                const badgeClass = item.media >= 7 ? 'grade-approved' : item.media >= 5 ? 'grade-recovery' : 'grade-failed';
                return `
                  <tr>
                    <td><strong>${eh(item.disciplina)}</strong></td>
                    <td>
                      <span class="grade-badge ${badgeClass}">
                        ${item.media.toFixed(1)}
                      </span>
                    </td>
                    <td style="color: var(--secondary-400);">${item.aprovados}</td>
                    <td style="color: var(--warning-400);">${item.recuperacao}</td>
                    <td style="color: var(--danger-400);">${item.reprovados}</td>
                  </tr>
                `;
              }).join('') : `
                <tr>
                  <td colspan="5" style="text-align: center; padding: 32px; color: var(--text-tertiary);">
                    Nenhuma nota lançada ainda.
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Alunos com Baixa Frequência -->
    ${alunosFrequenciaBaixa.length > 0 ? `
      <div class="card">
        <div class="card-header">
          <span class="card-title" style="color: var(--danger-400);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            Alunos com Baixa Frequência (&lt;75%)
          </span>
          <span class="badge badge-danger">${alunosFrequenciaBaixa.length} alunos</span>
        </div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Aluno</th>
                <th>Turma</th>
                <th>Frequência</th>
                <th>Ausências</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${alunosFrequenciaBaixa.map(aluno => `
                <tr>
                  <td><strong>${eh(aluno.nome)}</strong></td>
                  <td>${eh(aluno.turma)}</td>
                  <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <div class="progress-bar-container" style="width: 70px;">
                        <div class="progress-bar-fill" style="width: ${aluno.percentual}%; background: var(--danger-500);"></div>
                      </div>
                      <span style="font-size: 12px; font-weight: 700; color: var(--danger-400);">${aluno.percentual}%</span>
                    </div>
                  </td>
                  <td style="color: var(--danger-400);">${aluno.ausencias} faltas</td>
                  <td><span class="badge badge-danger badge-dot">Crítico</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    ` : ''}
  `;

  // ── Event Listeners ──
  
  // Exportar CSV
  outlet.querySelector('#btn-exportar-csv')?.addEventListener('click', () => {
    exportarCSV(frequenciaPorTurma);
  });

  // Imprimir / PDF
  outlet.querySelector('#btn-imprimir')?.addEventListener('click', () => {
    exportarPDF(frequenciaPorTurma, relatorioNotas, alunosFrequenciaBaixa, totalAlunos, totalTurmas, totalCursos, totalUnidades);
  });
}

// ── Exportar PDF ─────────────────────────────────────────
function exportarPDF(frequenciaPorTurma, relatorioNotas, alunosFrequenciaBaixa, totalAlunos, totalTurmas, totalCursos, totalUnidades) {
  const hoje = new Date().toLocaleDateString('pt-BR');

  const freqRows = frequenciaPorTurma.map(item => {
    const cor = item.percentual >= 75 ? '#166534' : '#991b1b';
    return `<tr>
      <td><strong>${item.turmaNome}</strong><br/><small style="color:#6b7280">${item.cursoNome}</small></td>
      <td style="text-align:center">${item.qtdAlunos}</td>
      <td style="text-align:center">${item.qtdAulas}</td>
      <td style="text-align:center">
        <div style="display:flex;align-items:center;gap:8px;justify-content:center">
          <div style="width:80px;height:8px;background:#e5e7eb;border-radius:4px">
            <div style="width:${Math.min(item.percentual,100)}%;height:8px;background:${item.percentual>=75?'#16a34a':'#dc2626'};border-radius:4px"></div>
          </div>
          <span style="font-weight:700;color:${cor}">${item.percentual}%</span>
        </div>
      </td>
    </tr>`;
  }).join('');

  const notaRows = relatorioNotas.map(item => {
    const cor = item.media >= 7 ? '#166534' : item.media >= 5 ? '#92400e' : '#991b1b';
    return `<tr>
      <td><strong>${item.disciplina}</strong></td>
      <td style="text-align:center;font-weight:700;color:${cor}">${item.media.toFixed(1)}</td>
      <td style="text-align:center;color:#166534">${item.aprovados}</td>
      <td style="text-align:center;color:#b45309">${item.recuperacao}</td>
      <td style="text-align:center;color:#991b1b">${item.reprovados}</td>
    </tr>`;
  }).join('');

  const baixaRows = alunosFrequenciaBaixa.map(a => `<tr>
    <td><strong>${a.nome}</strong></td>
    <td>${a.turma}</td>
    <td style="text-align:center;font-weight:700;color:#991b1b">${a.percentual}%</td>
    <td style="text-align:center;color:#991b1b">${a.ausencias} faltas</td>
  </tr>`).join('');

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<title>Relatórios — EduPresença</title>
<style>
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'Segoe UI',Arial,sans-serif; font-size:13px; color:#111; background:#fff; padding:32px 40px; }
  h1 { font-size:22px; font-weight:700; color:#1e1b4b; margin-bottom:4px; }
  .subtitle { font-size:12px; color:#6b7280; margin-bottom:24px; }
  .kpi-row { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:24px; }
  .kpi { text-align:center; background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; padding:14px; }
  .kpi-val { font-size:28px; font-weight:700; color:#1e1b4b; }
  .kpi-lbl { font-size:11px; text-transform:uppercase; color:#6b7280; margin-top:4px; }
  .section { margin-bottom:28px; }
  .section-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.07em;
    color:#6b7280; margin-bottom:10px; padding-bottom:6px; border-bottom:2px solid #e5e7eb; }
  table { width:100%; border-collapse:collapse; }
  th { background:#f3f4f6; padding:8px 12px; text-align:left; font-size:11px; font-weight:600;
    text-transform:uppercase; letter-spacing:0.05em; color:#4b5563; border-bottom:2px solid #e5e7eb; }
  td { padding:8px 12px; border-bottom:1px solid #f3f4f6; }
  tr:last-child td { border-bottom:none; }
  .footer { margin-top:32px; padding-top:12px; border-top:1px solid #e5e7eb;
    font-size:11px; color:#9ca3af; text-align:center; }
  @media print { body { padding:16px; } @page { margin:10mm; } }
</style>
</head>
<body>
  <h1>Relatórios — EduPresença</h1>
  <div class="subtitle">Gerado em ${hoje}</div>

  <div class="kpi-row">
    <div class="kpi"><div class="kpi-val">${totalAlunos}</div><div class="kpi-lbl">Alunos Ativos</div></div>
    <div class="kpi"><div class="kpi-val">${totalTurmas}</div><div class="kpi-lbl">Turmas</div></div>
    <div class="kpi"><div class="kpi-val">${totalCursos}</div><div class="kpi-lbl">Cursos</div></div>
    <div class="kpi"><div class="kpi-val">${totalUnidades}</div><div class="kpi-lbl">Unidades</div></div>
  </div>

  <div class="section">
    <div class="section-title">Frequência por Turma</div>
    <table>
      <thead><tr><th>Turma / Curso</th><th>Alunos</th><th>Aulas</th><th>Frequência</th></tr></thead>
      <tbody>${freqRows || '<tr><td colspan="4" style="text-align:center;color:#9ca3af;padding:20px">Sem dados.</td></tr>'}</tbody>
    </table>
  </div>

  ${relatorioNotas.length > 0 ? `
  <div class="section">
    <div class="section-title">Desempenho por Disciplina</div>
    <table>
      <thead><tr><th>Disciplina</th><th>Média</th><th>Aprovados</th><th>Recuperação</th><th>Reprovados</th></tr></thead>
      <tbody>${notaRows}</tbody>
    </table>
  </div>` : ''}

  ${alunosFrequenciaBaixa.length > 0 ? `
  <div class="section">
    <div class="section-title" style="color:#991b1b">Alunos com Baixa Frequência (&lt;75%)</div>
    <table>
      <thead><tr><th>Aluno</th><th>Turma</th><th>Frequência</th><th>Ausências</th></tr></thead>
      <tbody>${baixaRows}</tbody>
    </table>
  </div>` : ''}

  <div class="footer">EduPresença — Relatório gerado automaticamente em ${hoje}</div>
  <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 500); }<\/script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=900,height=750');
  if (win) {
    win.document.write(html);
    win.document.close();
  } else {
    window.toast?.warning('Pop-up bloqueado', 'Permita pop-ups para gerar o PDF.');
  }
}

// ── Função para Exportar CSV ──
function exportarCSV(dados) {
  if (dados.length === 0) {
    window.toast?.warning('Sem dados', 'Não há dados para exportar.');
    return;
  }

  const headers = ['Turma', 'Curso', 'Alunos', 'Aulas', 'Presentes', 'Ausentes', 'Frequência (%)'];
  const linhas = dados.map(item => [
    item.turmaNome,
    item.cursoNome,
    item.qtdAlunos,
    item.qtdAulas,
    item.totalPresentes,
    item.totalAusentes,
    item.percentual
  ]);

  let csvContent = headers.join(',') + '\n';
  linhas.forEach(linha => {
    csvContent += linha.join(',') + '\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `relatorio-frequencia-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.toast?.success('Exportado!', 'Arquivo CSV baixado com sucesso.');
}
