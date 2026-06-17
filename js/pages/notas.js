// =========================================================
// EduPresença – Notas Page
// =========================================================
import { turmas, alunos, notas, cursos, disciplinas, addLog, auth } from '../store.js';
import { escapeHtml as eh, calcAverage, gradeSituation, showConfirm } from '../utils.js';

export function render(outlet) {
  let allTurmas = turmas.getAll().sort((a, b) => a.nome.localeCompare(b.nome));
  const me = auth.currentUser();
  const isProfessor = me && me.role === 'professor';
  if (isProfessor) {
      const meusCursos = me.cursos || [];
      allTurmas = allTurmas.filter(t => meusCursos.includes(t.cursoId));
  }
  let modal;
  if (!document.getElementById('notas-modal')) {
    modal = document.createElement('app-modal');
    modal.id = 'notas-modal';
    document.body.appendChild(modal);
  } else {
    modal = document.getElementById('notas-modal');
  }

  const periodos = [
    '1º Bimestre', '2º Bimestre', '3º Bimestre', '4º Bimestre',
    '1º Semestre', '2º Semestre'
  ];

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
        <div class="filter-grid">
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

    const me = auth.getUser();
    const isProfessor = me && me.role === 'professor';

    discEl.disabled = false;
    discEl.innerHTML = `<option value="">Selecione...</option>` +
      all.map(d => {
        const discDetail = disciplinas.getAll().find(item => item.nome === d && item.cursoId === turma.cursoId);
        if (isProfessor && discDetail) {
          const isAssigned = Array.isArray(me.disciplinas) && me.disciplinas.includes(discDetail.id);
          if (!isAssigned) {
            return `<option value="${eh(d)}" disabled>🔒 ${eh(d)} (Não atribuído a você)</option>`;
          }
        }
        return `<option value="${eh(d)}">${eh(d)}</option>`;
      }).join('');
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

    const turma = allTurmas.find(t => t.id === turmaId);

    // Enforce teacher validation on load
    const me = auth.getUser();
    if (me && me.role === 'professor') {
      const discDetail = disciplinas.getAll().find(item => item.nome === disciplina && item.cursoId === turma?.cursoId);
      const isAssigned = discDetail && Array.isArray(me.disciplinas) && me.disciplinas.includes(discDetail.id);
      if (!isAssigned) {
        window.toast?.error('Acesso Negado', `Você não tem atribuição para lançar notas nesta disciplina.`);
        notasEl.innerHTML = '';
        return;
      }
    }

    const turmaAlunos = alunos.getAll()
      .filter(a => a.turmaId === turmaId && a.situacao !== 'inativo')
      .sort((a, b) => a.nome.localeCompare(b.nome));

    const savedNotas = notas.getByTurmaDisciplina(turmaId, disciplina)
      .filter(n => n.periodo === periodo);

    const notaMap = {};
    savedNotas.forEach(n => { 
        notaMap[n.alunoId] = { nota: n.nota, parciais: n.parciais || [] }; 
    });

    // const turma already defined above
    
    // Get discipline details for qtdAvaliacoes
    const discObj = disciplinas.getAll().find(d => d.nome === disciplina && d.cursoId === turma?.cursoId);
    const qtdAval = Number(discObj?.qtdAvaliacoes || 1);

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
          ${isProfessor ? `
          <div style="display:flex;gap:8px">
            <button class="btn btn-ghost" id="btn-limpar-notas" title="Limpar todos os campos desta tabela">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              Limpar
            </button>
            <button class="btn btn-primary" id="btn-salvar-notas">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              Salvar notas
            </button>
          </div>
          ` : ''}
        </div>

        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Aluno</th>
                ${Array.from({ length: qtdAval }).map((_, i) => `
                  <th style="width:100px;text-align:center">${qtdAval > 1 ? `Unid. ${i + 1}` : 'Nota (0-10)'}</th>
                `).join('')}
                <th style="width:100px;text-align:center">${qtdAval > 1 ? 'Média' : 'Final'}</th>
                <th style="width:130px">Situação</th>
              </tr>
            </thead>
            <tbody id="notas-tbody">
              ${turmaAlunos.length === 0
        ? `<tr><td colspan="${qtdAval + 3}" style="text-align:center;padding:32px;color:var(--text-tertiary)">Nenhum aluno ativo nessa turma.</td></tr>`
        : turmaAlunos.map(a => {
          const data = notaMap[a.id] || { nota: '', parciais: [] };
          const parciais = data.parciais;
          const notaFinal = data.nota;
          const sit = notaFinal !== '' ? gradeSituation(notaFinal) : null;
          
          return `
                    <tr data-aluno="${a.id}">
                      <td>
                        <span style="font-weight:600;color:var(--text-primary)">${eh(a.nome)}</span>
                      </td>
                      ${Array.from({ length: qtdAval }).map((_, i) => `
                        <td style="text-align:center">
                          <input class="form-control grade-input partial-input" type="number"
                            value="${parciais[i] ?? (qtdAval === 1 ? notaFinal : '')}" min="0" max="10" step="0.1"
                            placeholder="—" data-aluno-id="${a.id}" data-idx="${i}" 
                            style="width:80px;margin:0 auto;text-align:center;${isProfessor ? '' : 'cursor:not-allowed; opacity:0.6; background:var(--bg-surface-2);'}"
                            ${isProfessor ? '' : 'disabled'}/>
                        </td>
                      `).join('')}
                      <td style="text-align:center">
                        <span class="grade-badge ${sit ? `grade-${sit}` : ''}" id="media-${a.id}">
                          ${notaFinal !== '' ? Number(notaFinal).toFixed(1) : '—'}
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
          <span style="font-size:13px;color:var(--text-secondary)">
            ${qtdAval > 1 ? 'Preencha as unidades para calcular a média automaticamente.' : 'Digite a nota final do período.'}
          </span>
        </div>
      </div>
    `;

    // Live update logic
    notasEl.querySelectorAll('.partial-input').forEach(input => {
      input.addEventListener('input', () => {
        const alunoId = input.dataset.alunoId;
        const row = input.closest('tr');
        const inputs = row.querySelectorAll('.partial-input');
        
        let sum = 0, count = 0;
        inputs.forEach(inp => {
          if (inp.value !== '') {
            sum += Number(inp.value);
            count++;
          }
        });

        const finalVal = count > 0 ? (sum / count) : '';
        const sit = finalVal !== '' ? gradeSituation(finalVal) : null;

        const mediaEl = row.querySelector(`#media-${alunoId}`);
        const sitEl = row.querySelector(`#sit-${alunoId}`);

        if (mediaEl) {
          mediaEl.textContent = finalVal !== '' ? Number(finalVal).toFixed(1) : '—';
          mediaEl.className = `grade-badge ${sit ? `grade-${sit}` : ''}`;
        }
        if (sitEl) {
          sitEl.textContent = sit === 'approved' ? 'Aprovado' : sit === 'recovery' ? 'Recuperação' : sit === 'failed' ? 'Reprovado' : 'Sem nota';
          sitEl.className = `badge ${sit === 'approved' ? 'badge-success' : sit === 'recovery' ? 'badge-warning' : sit === 'failed' ? 'badge-danger' : 'badge-neutral'} badge-dot`;
        }
        updateNotasSummary();
      });
    });

    // Clear all grades for this period
    notasEl.querySelector('#btn-limpar-notas')?.addEventListener('click', async () => {
      const confirmed = await showConfirm(modal, {
        title: 'Excluir Notas',
        message: `Deseja realmente <strong>excluir permanentemente</strong> todas as notas lançadas para <strong>${eh(disciplina)}</strong> no <strong>${eh(periodo)}</strong>? Esta ação não pode ser desfeita.`,
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
        confirmText: 'Sim, Excluir Tudo',
        type: 'danger'
      });
      if (!confirmed) return;

      notas.save(turmaId, disciplina, periodo, []); // Save empty array to wipe
      addLog('DELETE', 'Notas', { turma: turma?.nome, disciplina, periodo });
      window.toast?.success('Notas removidas', 'Todos os registros deste período foram excluídos.');
      loadNotas(); // Reload UI
    });

    // Save
    notasEl.querySelector('#btn-salvar-notas')?.addEventListener('click', async () => {
      const confirmed = await showConfirm(modal, {
        title: 'Salvar Notas',
        message: `Deseja confirmar o lançamento de notas para a disciplina <strong>${eh(disciplina)}</strong> no <strong>${eh(periodo)}</strong>?`,
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`,
        confirmText: 'Salvar e Confirmar'
      });
      if (!confirmed) return;

      const rows = notasEl.querySelectorAll('tbody tr[data-aluno]');
      const regs = [];
      
      let hasError = false;
      rows.forEach(row => {
        if (hasError) return;
        const alunoId = row.dataset.aluno;
        const inputs = row.querySelectorAll('.partial-input');
        const parciais = [];
        
        let sum = 0, count = 0;
        inputs.forEach(inp => {
          const val = inp.value;
          if (val !== '') {
            const n = Number(val);
            if (isNaN(n) || n < 0 || n > 10) {
              window.toast?.error('Erro', 'As notas devem estar entre 0 e 10.');
              hasError = true;
              return;
            }
            parciais.push(n);
            sum += n;
            count++;
          }
        });

        if (count > 0) {
          regs.push({ 
            alunoId, 
            nota: (sum / count), 
            parciais 
          });
        }
      });

      if (hasError) return;

      notas.save(turmaId, disciplina, periodo, regs);
      addLog('UPDATE', 'Notas', { turma: turma?.nome, disciplina, periodo });
      window.toast?.success('Notas salvas!', `Notas de ${disciplina} – ${periodo} salvas com sucesso.`);
      updateNotasSummary();
    });

    updateNotasSummary();

    function updateNotasSummary() {
      const badges = notasEl.querySelectorAll('.grade-badge');
      let approved = 0, recovery = 0, failed = 0, noGrade = 0;
      
      badges.forEach(badge => {
        const val = badge.textContent.trim();
        if (val === '—') { noGrade++; return; }
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
