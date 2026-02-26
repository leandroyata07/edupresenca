// =========================================================
// EduPresença – Notas Page
// =========================================================
import { turmas, alunos, notas, cursos, disciplinas } from '../store.js';
import { escapeHtml as eh, calcAverage, gradeSituation } from '../utils.js';

export function render(outlet) {
  const allTurmas = turmas.getAll().sort((a, b) => a.nome.localeCompare(b.nome));

  const periodos = ['1º Bimestre', '2º Bimestre', '3º Bimestre', '4º Bimestre'];

  outlet.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">Lançamento de Notas</h1>
        <p class="page-subtitle">Registre e consulte as notas por turma e disciplina</p>
      </div>
    </div>

    <!-- Filter -->
    <div class="card" style="margin-bottom:var(--space-6)">
      <div class="card-body" style="padding:var(--space-5)">
        <div class="form-grid" style="grid-template-columns:1fr 1fr 1fr auto;align-items:end">
          <div class="form-group">
            <label class="form-label" for="n-turma">Turma <span class="required">*</span></label>
            <select class="form-control" id="n-turma">
              <option value="">Selecione...</option>
              ${allTurmas.map(t => `<option value="${t.id}">${eh(t.nome)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="n-disciplina">Disciplina <span class="required">*</span></label>
            <select class="form-control" id="n-disciplina" disabled>
              <option value="">Selecione a turma antes</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="n-periodo">Período <span class="required">*</span></label>
            <select class="form-control" id="n-periodo">
              <option value="">Selecione...</option>
              ${periodos.map(p => `<option value="${p}">${p}</option>`).join('')}
            </select>
          </div>
          <button class="btn btn-primary" id="btn-carregar-notas">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Carregar
          </button>
        </div>
      </div>
    </div>

    <div id="notas-area"></div>
  `;

  const turmaEl = outlet.querySelector('#n-turma');
  const discEl = outlet.querySelector('#n-disciplina');
  const perEl = outlet.querySelector('#n-periodo');
  const notasEl = outlet.querySelector('#notas-area');

  // Update disciplines based on course
  turmaEl.addEventListener('change', () => {
    const turmaId = turmaEl.value;
    const turma = allTurmas.find(t => t.id === turmaId);
    if (!turma) { discEl.innerHTML = '<option value="">Selecione a turma antes</option>'; discEl.disabled = true; return; }

    const curso = cursos.getById(turma.cursoId);
    
    // Get disciplines from the new disciplinas store
    const storeDisciplinas = disciplinas.getAll()
      .filter(d => d.cursoId === turma.cursoId)
      .map(d => d.nome);
    
    // Also get disciplines from curso.disciplinas (legacy support)
    const cursoDisciplinas = (curso?.disciplinas || '').split(',').map(s => s.trim()).filter(Boolean);

    // Also load from existing notes for this turma
    const existingDiscs = notas.getDisciplinas(turmaId);
    
    // Merge all sources and remove duplicates
    const all = [...new Set([...storeDisciplinas, ...cursoDisciplinas, ...existingDiscs])].sort();

    discEl.disabled = false;
    discEl.innerHTML = `<option value="">Selecione...</option>` +
      all.map(d => `<option value="${d}">${d}</option>`).join('');
  });

  outlet.querySelector('#btn-carregar-notas').addEventListener('click', loadNotas);

  function loadNotas() {
    const turmaId = turmaEl.value;
    const disciplina = discEl.value;
    const periodo = perEl.value;

    if (!turmaId || !disciplina || !periodo) {
      window.toast?.warning('Atenção', 'Preencha todos os campos para carregar.');
      return;
    }

    const turmaAlunos = alunos.getAll()
      .filter(a => a.turmaId === turmaId && a.situacao !== 'inativo')
      .sort((a, b) => a.nome.localeCompare(b.nome));

    const savedNotas = notas.getByTurmaDisciplina(turmaId, disciplina)
      .filter(n => n.periodo === periodo);

    const notaMap = {};
    savedNotas.forEach(n => { notaMap[n.alunoId] = n.nota; });

    const turma = allTurmas.find(t => t.id === turmaId);

    notasEl.innerHTML = `
      <div class="card">
        <div class="card-header">
          <span class="card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            ${eh(turma?.nome)} – ${eh(disciplina)} – ${eh(periodo)}
          </span>
          <button class="btn btn-primary" id="btn-salvar-notas">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            Salvar notas
          </button>
        </div>

        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Aluno</th>
                <th style="width:120px;text-align:center">Nota (0–10)</th>
                <th style="width:100px;text-align:center">Média</th>
                <th style="width:130px">Situação</th>
              </tr>
            </thead>
            <tbody id="notas-tbody">
              ${turmaAlunos.length === 0
        ? `<tr><td colspan="4" style="text-align:center;padding:32px;color:var(--text-tertiary)">Nenhum aluno ativo nessa turma.</td></tr>`
        : turmaAlunos.map(a => {
          const nota = notaMap[a.id] ?? '';
          const sit = nota !== '' ? gradeSituation(nota) : null;
          return `
                    <tr data-aluno="${a.id}">
                      <td>
                        <span style="font-weight:600;color:var(--text-primary)">${eh(a.nome)}</span>
                      </td>
                      <td style="text-align:center">
                        <input class="form-control grade-input" type="number"
                          name="nota-${a.id}" value="${nota}" min="0" max="10" step="0.1"
                          placeholder="—" data-aluno-id="${a.id}" />
                      </td>
                      <td style="text-align:center">
                        <span class="grade-badge ${sit ? `grade-${sit}` : ''}" id="media-${a.id}">
                          ${nota !== '' ? Number(nota).toFixed(1) : '—'}
                        </span>
                      </td>
                      <td>
                        <span class="badge ${sit === 'approved' ? 'badge-success' : sit === 'recovery' ? 'badge-warning' : sit === 'failed' ? 'badge-danger' : 'badge-neutral'} badge-dot" id="sit-${a.id}">
                          ${sit === 'approved' ? 'Aprovado' : sit === 'recovery' ? 'Recuperação' : sit === 'failed' ? 'Reprovado' : 'Sem nota'}
                        </span>
                      </td>
                    </tr>`;
        }).join('')}
            </tbody>
          </table>
        </div>

        <!-- Turma summary -->
        <div class="card-footer" id="notas-summary" style="gap:24px;flex-wrap:wrap">
          <span style="font-size:13px;color:var(--text-secondary)">Calcule após preencher todas as notas.</span>
        </div>
      </div>
    `;

    // Live update badge on note change
    notasEl.querySelectorAll('input[data-aluno-id]').forEach(input => {
      input.addEventListener('input', () => {
        const alunoId = input.dataset.alunoId;
        const val = input.value;
        const sit = val !== '' ? gradeSituation(val) : null;

        const mediaEl = notasEl.querySelector(`#media-${alunoId}`);
        const sitEl = notasEl.querySelector(`#sit-${alunoId}`);

        if (mediaEl) {
          mediaEl.textContent = val !== '' ? Number(val).toFixed(1) : '—';
          mediaEl.className = `grade-badge ${sit ? `grade-${sit}` : ''}`;
        }
        if (sitEl) {
          sitEl.textContent = sit === 'approved' ? 'Aprovado' : sit === 'recovery' ? 'Recuperação' : sit === 'failed' ? 'Reprovado' : 'Sem nota';
          sitEl.className = `badge ${sit === 'approved' ? 'badge-success' : sit === 'recovery' ? 'badge-warning' : sit === 'failed' ? 'badge-danger' : 'badge-neutral'} badge-dot`;
        }
        updateNotasSummary();
      });
    });

    // Save
    notasEl.querySelector('#btn-salvar-notas')?.addEventListener('click', () => {
      const inputs = notasEl.querySelectorAll('input[data-aluno-id]');
      const regs = [];
      inputs.forEach(inp => {
        const val = inp.value;
        if (val !== '' && !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 10) {
          regs.push({ alunoId: inp.dataset.alunoId, nota: Number(val) });
        } else if (val !== '') {
          window.toast?.error('Nota inválida', `A nota de um aluno está fora do intervalo 0-10.`);
          return;
        }
      });
      notas.save(turmaId, disciplina, periodo, regs);
      window.toast?.success('Notas salvas!', `Notas de ${disciplina} – ${periodo} salvas com sucesso.`);
      updateNotasSummary();
    });

    updateNotasSummary();

    function updateNotasSummary() {
      const inputs = notasEl.querySelectorAll('input[data-aluno-id]');
      let approved = 0, recovery = 0, failed = 0, noGrade = 0;
      inputs.forEach(inp => {
        const val = inp.value;
        if (val === '' || isNaN(Number(val))) { noGrade++; return; }
        const sit = gradeSituation(val);
        if (sit === 'approved') approved++;
        else if (sit === 'recovery') recovery++;
        else failed++;
      });
      const sumEl = notasEl.querySelector('#notas-summary');
      if (sumEl) {
        sumEl.innerHTML = `
          <span class="badge badge-success badge-dot">${approved} Aprovados</span>
          <span class="badge badge-warning badge-dot">${recovery} Recuperação</span>
          <span class="badge badge-danger badge-dot">${failed} Reprovados</span>
          ${noGrade ? `<span class="badge badge-neutral badge-dot">${noGrade} Sem nota</span>` : ''}
        `;
      }
    }
  }
}
