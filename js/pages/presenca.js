// =========================================================
// EduPresença – Presença Page
// =========================================================
import { turmas, alunos, presencas, turnos, cursos } from '../store.js';
import { formatDate, today, escapeHtml, getInitials, stringToHue } from '../utils.js';

export function render(outlet) {
    let selectedTurma = null;
    let selectedDate = today();
    let registros = {};   // { alunoId: boolean }

    const allTurmas = turmas.getAll().sort((a, b) => a.nome.localeCompare(b.nome));

    outlet.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">Registro de Presença</h1>
        <p class="page-subtitle">Marque a presença dos alunos por turma e data</p>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="card" style="margin-bottom:var(--space-6)">
      <div class="card-body" style="padding:var(--space-5)">
        <div class="form-grid" style="grid-template-columns:1fr 1fr auto;align-items:end">
          <div class="form-group">
            <label class="form-label" for="sel-turma">Turma <span class="required">*</span></label>
            <select class="form-control" id="sel-turma">
              <option value="">Selecione a turma...</option>
              ${allTurmas.map(t => `<option value="${t.id}">${escapeHtml(t.nome)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="sel-data">Data <span class="required">*</span></label>
            <input class="form-control" id="sel-data" type="date" value="${selectedDate}" max="${today()}" />
          </div>
          <button class="btn btn-primary" id="btn-carregar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Carregar
          </button>
        </div>
      </div>
    </div>

    <!-- Attendance Area -->
    <div id="attendance-area"></div>

    <!-- Calendar -->
    <div id="calendario-area" style="margin-top:var(--space-6)"></div>

    <!-- History -->
    <div id="historico-area" style="margin-top:var(--space-6)"></div>
  `;

    const turmaEl = outlet.querySelector('#sel-turma');
    const dataEl = outlet.querySelector('#sel-data');
    const btnEl = outlet.querySelector('#btn-carregar');
    const areaEl = outlet.querySelector('#attendance-area');
    const histEl = outlet.querySelector('#historico-area');
    const calAreaEl = outlet.querySelector('#calendario-area');

    // Calendar state
    let calYear  = new Date().getFullYear();
    let calMonth = new Date().getMonth(); // 0-based

    btnEl.addEventListener('click', loadAttendance);

    // Show calendar when turma is selected
    turmaEl.addEventListener('change', () => {
        if (turmaEl.value) renderCalendar(turmaEl.value, calYear, calMonth);
        else calAreaEl.innerHTML = '';
    });

    // Pré-seleção via ação rápida do dashboard
    const quickTurma = sessionStorage.getItem('edu_quick_presenca');
    if (quickTurma) {
        sessionStorage.removeItem('edu_quick_presenca');
        if (turmaEl) turmaEl.value = quickTurma;
        selectedTurma = quickTurma;        renderCalendar(quickTurma, calYear, calMonth);        loadAttendance();
    }

    function loadAttendance() {
        const turmaId = turmaEl.value;
        const data = dataEl.value;
        if (!turmaId || !data) {
            window.toast?.warning('Atenção', 'Selecione turma e data para continuar.');
            return;
        }
        selectedTurma = turmaId;
        selectedDate = data;

        const turmaAlunos = alunos.getAll()
            .filter(a => a.turmaId === turmaId && a.situacao !== 'inativo')
            .sort((a, b) => a.nome.localeCompare(b.nome));

        const savedRegistros = presencas.getByTurmaData(turmaId, data);
        registros = {};
        savedRegistros.forEach(r => { registros[r.alunoId] = { presente: r.presente, justificativa: r.justificativa || '' }; });

        // Default unset to null
        turmaAlunos.forEach(a => {
            if (!(a.id in registros)) registros[a.id] = { presente: null, justificativa: '' };
        });

        const turma = allTurmas.find(t => t.id === turmaId);

        areaEl.innerHTML = `
      <div class="card">
        <div class="card-header">
          <span class="card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            ${escapeHtml(turma?.nome || '—')} – ${formatDate(data)}
          </span>
          <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
            <span id="presence-summary" class="badge badge-success">0 presentes</span>
            <button class="btn btn-secondary btn-sm" id="btn-marcar-todos">✓ Todos presentes</button>
            <button class="btn btn-secondary btn-sm" id="btn-limpar">✗ Todos ausentes</button>
            <button class="btn btn-ghost btn-sm" id="btn-chamada" title="Lista de chamada imprimível">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              Lista de Chamada
            </button>
            <button class="btn btn-primary" id="btn-salvar">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              Salvar presença
            </button>
          </div>
        </div>

        <div class="card-body" style="padding:0">
          ${turmaAlunos.length === 0
                ? `<div class="empty-state"><p>Nenhum aluno ativo nessa turma.</p></div>`
                : `<div id="alunos-list">
                ${turmaAlunos.map(a => {
                    const hue = stringToHue(a.nome);
                    const rec = registros[a.id];
                    const status = rec?.presente;
                    return `
                    <div class="detail-row" style="padding:14px 20px;display:flex;align-items:center;gap:16px" data-aluno="${a.id}">
                      <div class="avatar avatar-sm" style="background:hsl(${hue},65%,45%)">${getInitials(a.nome)}</div>
                      <div style="flex:1;min-width:0">
                        <div style="font-weight:600;font-size:13px;color:var(--text-primary)">${escapeHtml(a.nome)}</div>
                        <div style="font-size:11px;color:var(--text-tertiary)">${escapeHtml(a.email || '—')}</div>
                      </div>
                      <div class="attendance-toggle" style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
                        <button class="toggle-btn ${status === true ? 'present' : status === false ? 'absent' : 'toggle-unset'}"
                          data-aluno-id="${a.id}" data-state="${status === true ? 'present' : status === false ? 'absent' : 'unset'}">
                          ${status === true ? '✓ Presente' : status === false ? '✗ Ausente' : '• Indefinido'}
                        </button>
                        <div class="just-wrap" style="display:${status === false ? 'flex' : 'none'};align-items:center;gap:5px">
                          <input type="text" class="form-control just-field"
                            style="height:26px;font-size:11.5px;width:190px;padding:2px 8px"
                            placeholder="Justificativa (opcional)..."
                            value="${escapeHtml(rec?.justificativa || '')}"
                            data-aluno-id="${a.id}" />
                        </div>
                      </div>
                    </div>`;
                }).join('')}
              </div>`
            }
        </div>
      </div>
    `;

        updateSummary();

        // Toggle buttons
        areaEl.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const alunoId = btn.dataset.alunoId;
                const rec = registros[alunoId];
                const current = rec?.presente;
                const next = current !== true;
                registros[alunoId] = { presente: next, justificativa: next ? '' : (rec?.justificativa || '') };
                btn.className = `toggle-btn ${next ? 'present' : 'absent'}`;
                btn.textContent = next ? '✓ Presente' : '✗ Ausente';
                const justEl = btn.closest('[data-aluno]')?.querySelector('.just-wrap');
                if (justEl) justEl.style.display = next ? 'none' : 'flex';
                updateSummary();
            });
        });

        // Justificativa inputs
        areaEl.querySelectorAll('.just-field').forEach(input => {
            input.addEventListener('input', () => {
                const alunoId = input.dataset.alunoId;
                if (registros[alunoId]) registros[alunoId].justificativa = input.value;
            });
        });

        // Mark all present
        areaEl.querySelector('#btn-marcar-todos')?.addEventListener('click', () => {
            turmaAlunos.forEach(a => { registros[a.id] = { presente: true, justificativa: '' }; });
            areaEl.querySelectorAll('.toggle-btn').forEach(btn => {
                btn.className = 'toggle-btn present';
                btn.textContent = '✓ Presente';
            });
            areaEl.querySelectorAll('.just-wrap').forEach(el => el.style.display = 'none');
            updateSummary();
        });

        // Clear all
        areaEl.querySelector('#btn-limpar')?.addEventListener('click', () => {
            turmaAlunos.forEach(a => { registros[a.id] = { presente: false, justificativa: '' }; });
            areaEl.querySelectorAll('.toggle-btn').forEach(btn => {
                btn.className = 'toggle-btn absent';
                btn.textContent = '✗ Ausente';
            });
            areaEl.querySelectorAll('.just-wrap').forEach(el => el.style.display = 'flex');
            updateSummary();
        });

        // Lista de chamada imprimível
        areaEl.querySelector('#btn-chamada')?.addEventListener('click', () => {
            openChamadaList(turmaId);
        });

        // Save
        areaEl.querySelector('#btn-salvar')?.addEventListener('click', () => {
            const regs = turmaAlunos.map(a => ({
                alunoId: a.id,
                presente: registros[a.id]?.presente === true,
                justificativa: registros[a.id]?.justificativa || '',
            }));
            presencas.save(turmaId, data, regs);
            window.toast?.success('Presença salva!', `Registros de ${formatDate(data)} salvos com sucesso.`);
            renderCalendar(turmaId, calYear, calMonth);
            loadHistorico(turmaId);
        });

        loadHistorico(turmaId);
    }

    function updateSummary() {
        const entries = Object.values(registros);
        const presentes = entries.filter(v => v?.presente === true).length;
        const ausentes = entries.filter(v => v?.presente === false).length;
        const total = entries.length;
        const el = areaEl.querySelector('#presence-summary');
        if (el) {
            el.textContent = `${presentes} presentes, ${ausentes} ausentes`;
            el.className = `badge ${presentes / total >= 0.75 ? 'badge-success' : 'badge-warning'}`;
        }
    }

    // ── Calendário de Presenças ──────────────────────────
    function renderCalendar(turmaId, year, month) {
        calYear  = year;
        calMonth = month;

        const now     = new Date();
        const todayStr = today();
        const firstDay = new Date(year, month, 1);
        const lastDay  = new Date(year, month + 1, 0);
        const monthName = firstDay.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

        // Collect presence data for this turma in the month
        const allDates = presencas.getDates(turmaId);
        const dataMap  = {}; // 'YYYY-MM-DD' -> { pct, has }
        allDates.forEach(d => {
            const [y, m] = d.split('-').map(Number);
            if (y === year && m - 1 === month) {
                const regs = presencas.getByTurmaData(turmaId, d);
                const pres = regs.filter(r => r.presente).length;
                const tot  = regs.length;
                dataMap[d] = { pct: tot ? Math.round((pres / tot) * 100) : 0, has: true };
            }
        });

        // Day of week of first day (0=Sun, adjust to Mon start)
        let startDow = firstDay.getDay(); // 0=Sun
        const offset = (startDow + 6) % 7; // Mon=0, Tue=1, ... Sun=6

        const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
        let cells = '';

        // Blank cells before first day
        for (let i = 0; i < offset; i++) {
            cells += `<div class="cal-cell cal-blank"></div>`;
        }

        for (let d = 1; d <= lastDay.getDate(); d++) {
            const mm    = String(month + 1).padStart(2, '0');
            const dd    = String(d).padStart(2, '0');
            const dstr  = `${year}-${mm}-${dd}`;
            const isToday   = dstr === todayStr;
            const isSelected = dstr === dataEl.value;
            const rec       = dataMap[dstr];
            const isFuture  = dstr > todayStr;

            let cellClass = 'cal-cell';
            let dotHtml   = '';

            if (rec?.has) {
                cellClass += rec.pct >= 75 ? ' cal-green' : ' cal-red';
                dotHtml    = `<span class="cal-pct">${rec.pct}%</span>`;
            } else if (isFuture) {
                cellClass += ' cal-future';
            }

            if (isToday)    cellClass += ' cal-today';
            if (isSelected) cellClass += ' cal-selected';

            cells += `<div class="${cellClass}" data-date="${dstr}" title="${formatDate(dstr)}">
                <span class="cal-num">${d}</span>
                ${dotHtml}
            </div>`;
        }

        calAreaEl.innerHTML = `
        <style>
          .cal-wrap{background:var(--surface-2);border:1px solid var(--border-color,rgba(255,255,255,0.08));border-radius:14px;overflow:hidden}
          .cal-header{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid var(--border-color,rgba(255,255,255,0.07))}
          .cal-title{font-size:14px;font-weight:600;color:var(--text-primary);text-transform:capitalize}
          .cal-nav{display:flex;gap:6px}
          .cal-btn{background:var(--surface-3,rgba(255,255,255,0.06));border:1px solid var(--border-color,rgba(255,255,255,0.09));color:var(--text-secondary);border-radius:7px;padding:5px 10px;cursor:pointer;font-size:13px;transition:background 0.15s}
          .cal-btn:hover{background:rgba(255,255,255,0.12)}
          .cal-grid-head{display:grid;grid-template-columns:repeat(7,1fr);background:rgba(255,255,255,0.03);padding:6px 12px 2px}
          .cal-dow{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-tertiary);text-align:center;padding:4px 0}
          .cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;padding:10px 12px 12px}
          .cal-cell{min-height:48px;border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;cursor:pointer;transition:background 0.12s,transform 0.1s;border:2px solid transparent;position:relative}
          .cal-cell:hover:not(.cal-blank):not(.cal-future){background:rgba(255,255,255,0.09);transform:scale(1.04)}
          .cal-blank{cursor:default;pointer-events:none}
          .cal-future{opacity:.35;cursor:default;pointer-events:none}
          .cal-num{font-size:12.5px;font-weight:600;color:var(--text-secondary)}
          .cal-pct{font-size:9.5px;font-weight:700;letter-spacing:0.03em}
          .cal-green{background:rgba(34,197,94,.13)}.cal-green .cal-pct{color:#4ade80}.cal-green .cal-num{color:#4ade80}
          .cal-red{background:rgba(239,68,68,.13)}.cal-red .cal-pct{color:#f87171}.cal-red .cal-num{color:#f87171}
          .cal-today{border-color:rgba(99,102,241,.6)!important;box-shadow:0 0 0 1px rgba(99,102,241,.25)}
          .cal-today .cal-num{color:var(--primary-400,#818cf8)!important}
          .cal-selected{border-color:var(--primary-500,#6366f1)!important;background:rgba(99,102,241,.18)!important}
          .cal-legend{display:flex;gap:14px;padding:8px 18px 12px;flex-wrap:wrap}
          .cal-legend-item{display:flex;align-items:center;gap:5px;font-size:11px;color:var(--text-tertiary)}
          .cal-legend-dot{width:10px;height:10px;border-radius:3px}
        </style>
        <div class="cal-wrap">
          <div class="cal-header">
            <div>
              <div class="cal-title">${monthName}</div>
              <div style="font-size:11px;color:var(--text-tertiary);margin-top:2px">Clique em um dia para carregar a presença</div>
            </div>
            <div class="cal-nav">
              <button class="cal-btn" id="cal-prev">‹</button>
              <button class="cal-btn" id="cal-today-btn">Hoje</button>
              <button class="cal-btn" id="cal-next">›</button>
            </div>
          </div>
          <div class="cal-grid-head">${days.map(d => `<div class="cal-dow">${d}</div>`).join('')}</div>
          <div class="cal-grid" id="cal-cells">${cells}</div>
          <div class="cal-legend">
            <span class="cal-legend-item"><span class="cal-legend-dot" style="background:rgba(34,197,94,.35)"></span>Frequência ≥75%</span>
            <span class="cal-legend-item"><span class="cal-legend-dot" style="background:rgba(239,68,68,.35)"></span>Frequência &lt;75%</span>
            <span class="cal-legend-item"><span class="cal-legend-dot" style="background:transparent;border:2px solid rgba(99,102,241,.6)"></span>Hoje</span>
            <span class="cal-legend-item"><span class="cal-legend-dot" style="background:rgba(99,102,241,.25);border:2px solid #6366f1"></span>Selecionado</span>
          </div>
        </div>`;

        calAreaEl.querySelector('#cal-prev').addEventListener('click', () => {
            let m = calMonth - 1, y = calYear;
            if (m < 0) { m = 11; y--; }
            renderCalendar(turmaId, y, m);
        });
        calAreaEl.querySelector('#cal-next').addEventListener('click', () => {
            let m = calMonth + 1, y = calYear;
            if (m > 11) { m = 0; y++; }
            renderCalendar(turmaId, y, m);
        });
        calAreaEl.querySelector('#cal-today-btn').addEventListener('click', () => {
            renderCalendar(turmaId, new Date().getFullYear(), new Date().getMonth());
        });
        calAreaEl.querySelectorAll('.cal-cell[data-date]').forEach(cell => {
            cell.addEventListener('click', () => {
                const d = cell.dataset.date;
                if (dataEl) dataEl.value = d;
                if (turmaEl && !turmaEl.value) turmaEl.value = turmaId;
                loadAttendance();
                renderCalendar(turmaId, calYear, calMonth);
            });
        });
    }

    // ── Lista de Chamada Imprimível ───────────────────────
    function openChamadaList(turmaId) {
        const turma = allTurmas.find(t => t.id === turmaId);
        if (!turma) return;

        const turmaAlunos = alunos.getAll()
            .filter(a => a.turmaId === turmaId && a.situacao !== 'inativo')
            .sort((a, b) => a.nome.localeCompare(b.nome));

        if (!turmaAlunos.length) {
            window.toast?.warning('Turma vazia', 'Nenhum aluno ativo nesta turma.');
            return;
        }

        // Get last 20 dates (sorted ascending) + add future blank columns
        const allDates = presencas.getDates(turmaId).slice(0, 20).reverse(); // getDates returns desc

        // Build index: { alunoId: { 'YYYY-MM-DD': true/false } }
        const attendanceIdx = {};
        turmaAlunos.forEach(a => { attendanceIdx[a.id] = {}; });
        allDates.forEach(d => {
            const regs = presencas.getByTurmaData(turmaId, d);
            regs.forEach(r => {
                if (attendanceIdx[r.alunoId]) {
                    attendanceIdx[r.alunoId][d] = r.presente;
                }
            });
        });

        const dateHeaders = allDates.map(d => {
            const [, m, dd] = d.split('-');
            return `<th style="min-width:44px;padding:6px 4px;text-align:center;font-size:11px;border:1px solid #d1d5db;background:#f9fafb;white-space:nowrap">${dd}/${m}</th>`;
        }).join('');

        const rows = turmaAlunos.map((a, idx) => {
            const cells = allDates.map(d => {
                const val = attendanceIdx[a.id][d];
                if (val === undefined) return `<td style="border:1px solid #d1d5db;min-width:44px;text-align:center"></td>`;
                const color = val ? '#166534' : '#991b1b';
                const bg = val ? '#dcfce7' : '#fee2e2';
                return `<td style="border:1px solid #d1d5db;min-width:44px;text-align:center;background:${bg};color:${color};font-weight:700;font-size:12px">${val ? 'P' : 'F'}</td>`;
            }).join('');
            const rowBg = idx % 2 === 0 ? '#ffffff' : '#f9fafb';
            // Count attendance
            const datesWithRecord = allDates.filter(d => attendanceIdx[a.id][d] !== undefined);
            const present = datesWithRecord.filter(d => attendanceIdx[a.id][d] === true).length;
            const total = datesWithRecord.length;
            const pct = total > 0 ? ((present / total) * 100).toFixed(0) + '%' : '—';
            const pctColor = total === 0 ? '#6b7280' : (present / total) >= 0.75 ? '#166534' : '#991b1b';
            return `<tr style="background:${rowBg}">
              <td style="border:1px solid #d1d5db;padding:6px 10px;font-size:12px">${idx + 1}. ${escapeHtml(a.nome)}</td>
              ${cells}
              <td style="border:1px solid #d1d5db;padding:6px 8px;text-align:center;font-weight:700;font-size:12px;color:${pctColor}">${pct}</td>
            </tr>`;
        }).join('');

        const html = `<!DOCTYPE html>
<html lang="pt-BR"><head>
<meta charset="UTF-8"><title>Lista de Chamada — ${escapeHtml(turma.nome)}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;font-size:12px;color:#111;background:#fff;padding:24px 32px}
  h1{font-size:18px;font-weight:700;color:#1e1b4b;margin-bottom:2px}
  .sub{font-size:11px;color:#6b7280;margin-bottom:18px}
  table{width:100%;border-collapse:collapse}
  .legend{display:flex;gap:16px;margin-top:14px;font-size:11px;color:#6b7280}
  .leg-box{display:inline-block;width:12px;height:12px;border-radius:2px;vertical-align:middle;margin-right:3px}
  @media print{body{padding:14px}@page{margin:10mm}}
</style>
</head><body>
  <h1>Lista de Chamada — ${escapeHtml(turma.nome)}</h1>
  <div class="sub">EduPresença &nbsp;·&nbsp; Gerado em ${new Date().toLocaleString('pt-BR')} &nbsp;·&nbsp; ${turmaAlunos.length} aluno${turmaAlunos.length !== 1 ? 's' : ''} &nbsp;·&nbsp; ${allDates.length} data${allDates.length !== 1 ? 's' : ''} registrada${allDates.length !== 1 ? 's' : ''}</div>
  <table>
    <thead>
      <tr>
        <th style="width:220px;padding:7px 10px;text-align:left;border:1px solid #d1d5db;background:#f3f4f6;font-size:11px">Aluno</th>
        ${dateHeaders}
        <th style="min-width:52px;padding:6px 4px;text-align:center;font-size:11px;border:1px solid #d1d5db;background:#f3f4f6">Freq.</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="legend">
    <span><span class="leg-box" style="background:#dcfce7;border:1px solid #bbf7d0"></span><strong style="color:#166534">P</strong> = Presente</span>
    <span><span class="leg-box" style="background:#fee2e2;border:1px solid #fecaca"></span><strong style="color:#991b1b">F</strong> = Falta</span>
    <span>Célula vazia = não registrado</span>
    <span><strong>Freq.</strong> = % de presenças sobre aulas registradas</span>
  </div>
  <script>window.onload=()=>{window.print();setTimeout(()=>window.close(),600)}<\/script>
</body></html>`;

        const win = window.open('', '_blank', 'width=900,height=720');
        if (win) { win.document.write(html); win.document.close(); }
        else window.toast?.warning('Pop-up bloqueado', 'Permita pop-ups para imprimir a lista.');
    }

    function loadHistorico(turmaId) {
        const dates = presencas.getDates(turmaId);
        if (!dates.length) { histEl.innerHTML = ''; return; }

        const allAlunosTurma = alunos.getAll().filter(a => a.turmaId === turmaId);

        histEl.innerHTML = `
      <div class="card">
        <div class="card-header">
          <span class="card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Histórico de Presenças
          </span>
        </div>
        <div class="card-body" style="padding:0">
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Presentes</th>
                  <th>Ausentes</th>
                  <th>Frequência</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${dates.slice(0, 15).map(d => {
            const regs = presencas.getByTurmaData(turmaId, d);
            const p = regs.filter(r => r.presente).length;
            const a = regs.filter(r => !r.presente).length;
            const tot = regs.length;
            const pct = tot ? Math.round((p / tot) * 100) : 0;
            return `<tr>
                    <td><strong>${formatDate(d)}</strong></td>
                    <td style="color:var(--secondary-400)">${p}</td>
                    <td style="color:var(--danger-400)">${a}</td>
                    <td>
                      <div style="display:flex;align-items:center;gap:8px">
                        <div class="progress-bar-container" style="width:80px">
                          <div class="progress-bar-fill" style="width:${pct}%;background:${pct >= 75 ? 'var(--secondary-500)' : 'var(--danger-500)'}"></div>
                        </div>
                        <span style="font-size:12px;font-weight:600">${pct}%</span>
                      </div>
                    </td>
                    <td><span class="badge ${pct >= 75 ? 'badge-success' : 'badge-danger'} badge-dot">${pct >= 75 ? 'Normal' : 'Baixa'}</span></td>
                  </tr>`;
        }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>`;
    }
}
