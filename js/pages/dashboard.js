// =========================================================
// EduPresença v2 – Dashboard Page (with "Primeiros Passos")
// =========================================================
import { alunos, turmas, cursos, disciplinas, unidades, turnos, presencas, notas } from '../store.js';
import { formatDate, today, formatPercent, escapeHtml } from '../utils.js';

export function render(outlet) {
    const allAlunos = alunos.getAll();
    const allTurmas = turmas.getAll();
    const allCursos = cursos.getAll();
    const allDisciplinas = disciplinas.getAll();
    const allUnidades = unidades.getAll();
    const allTurnos = turnos.getAll();
    const todayStr = today();

    // ── "Primeiros Passos" – detect missing essential data ──
    const setupSteps = [
        { path: '/unidades', label: 'Unidades', done: allUnidades.length > 0, num: 1 },
        { path: '/turnos', label: 'Turnos', done: allTurnos.length > 0, num: 2 },
        { path: '/cursos', label: 'Cursos', done: allCursos.length > 0, num: 3 },
        { path: '/disciplinas', label: 'Disciplinas', done: allDisciplinas.length > 0, num: 4 },
        { path: '/turmas', label: 'Turmas', done: allTurmas.length > 0, num: 5 },
        { path: '/alunos', label: 'Alunos', done: allAlunos.length > 0, num: 6 },
    ];
    const showGettingStarted = setupSteps.some(s => !s.done);

    // Compute presence today across all turmas
    let totalPresentes = 0, totalAlunos = 0;
    allTurmas.forEach(t => {
        const registros = presencas.getByTurmaData(t.id, todayStr);
        totalPresentes += registros.filter(r => r.presente).length;
        totalAlunos += registros.length;
    });
    const freqHoje = totalAlunos ? ((totalPresentes / totalAlunos) * 100).toFixed(1) : '—';

    // Recent turmas (last 5)
    const recentTurmas = [...allTurmas].reverse().slice(0, 5);

    // ── Alunos em Risco (freq < 75%) ─────────────────────
    const alunosEmRisco = allAlunos.filter(a => {
        if ((a.situacao || 'ativo') === 'inativo') return false;
        const regs = presencas.getByAluno(a.id);
        if (regs.length < 3) return false;
        return (regs.filter(r => r.presente).length / regs.length) * 100 < 75;
    }).map(a => {
        const regs = presencas.getByAluno(a.id);
        const pct = ((regs.filter(r => r.presente).length / regs.length) * 100).toFixed(1);
        const turma = allTurmas.find(t => t.id === a.turmaId);
        return { ...a, freqPct: parseFloat(pct), turmaNome: turma?.nome || '—' };
    }).sort((a, b) => a.freqPct - b.freqPct).slice(0, 5);

    // Chart data: presença dos últimos 7 dias (workdays)

    // ── Ranking de Turmas por frequência ──────────────────────────
    const rankingTurmas = allTurmas.map(t => {
        const datas = presencas.getDates(t.id);
        let total = 0, pres = 0;
        datas.forEach(d => {
            const regs = presencas.getByTurmaData(t.id, d);
            total += regs.length;
            pres += regs.filter(r => r.presente).length;
        });
        const freq = total > 0 ? Math.round((pres / total) * 100) : null;
        const curso = allCursos.find(c => c.id === t.cursoId);
        return { id: t.id, nome: t.nome, cursoNome: curso?.nome || '—', freq, totalAulas: datas.length };
    }).filter(t => t.freq !== null).sort((a, b) => b.freq - a.freq);

    // Chart data: presença dos últimos 7 dias (workdays)
    const chartDays = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        if (d.getDay() !== 0 && d.getDay() !== 6) {
            const dateStr = d.toISOString().split('T')[0];
            let p = 0, t = 0;
            allTurmas.forEach(turma => {
                const regs = presencas.getByTurmaData(turma.id, dateStr);
                p += regs.filter(r => r.presente).length;
                t += regs.length;
            });
            chartDays.push({ date: dateStr, label: d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }), pct: t ? Math.round((p / t) * 100) : 0 });
        }
    }

    const maxPct = Math.max(...chartDays.map(d => d.pct), 1);

    outlet.innerHTML = `
    <div class="stagger-children">
      <!-- Page header -->
      <div class="page-header">
        <div class="page-header-left">
          <h1 class="page-title">
            Dashboard
            <span style="font-size:12px;font-weight:600;padding:2px 8px;border-radius:4px;background:rgba(245,158,11,0.18);color:#fbbf24;border:1px solid rgba(245,158,11,0.3);vertical-align:middle;margin-left:8px">v2</span>
          </h1>
          <p class="page-subtitle">Visão geral do sistema — ${formatDate(todayStr)}</p>
        </div>
      </div>

      ${showGettingStarted ? `
      <!-- Primeiros Passos -->
      <div class="getting-started">
        <div class="getting-started-header">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          <h3>Primeiros passos</h3>
          <span>Configure o sistema para começar a usar o EduPresença</span>
        </div>
        <div class="getting-started-steps">
          ${setupSteps.map(s => `
            <button class="gs-step${s.done ? ' done' : ''}" onclick="app.router.push('${s.path}')" title="${s.done ? s.label + ' ✓' : 'Ir para ' + s.label}">
              ${!s.done ? `<span class="gs-step-num">${s.num}</span>` : ''}
              ${s.label}
            </button>
          `).join('')}
        </div>
      </div>
      ` : ''}

      <!-- KPI Cards -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div class="kpi-value">${allAlunos.length}</div>
          <div class="kpi-label">Total de Alunos</div>
          <div class="kpi-trend up">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            ${allAlunos.filter(a => a.situacao !== 'inativo').length} ativos
          </div>
        </div>

        <div class="kpi-card green">
          <div class="kpi-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 11 12 14 22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
          </div>
          <div class="kpi-value">${freqHoje}${freqHoje !== '—' ? '%' : ''}</div>
          <div class="kpi-label">Frequência Hoje</div>
          <div class="kpi-trend ${Number(freqHoje) >= 75 ? 'up' : 'down'}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            ${totalPresentes} presentes de ${totalAlunos}
          </div>
        </div>

        <div class="kpi-card orange">
          <div class="kpi-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div class="kpi-value">${allTurmas.length}</div>
          <div class="kpi-label">Turmas Ativas</div>
          <div class="kpi-trend up">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            ${allCursos.length} cursos
          </div>
        </div>

        <div class="kpi-card blue">
          <div class="kpi-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          </div>
          <div class="kpi-value">${allDisciplinas.length}</div>
          <div class="kpi-label">Disciplinas Cadastradas</div>
          <div class="kpi-trend up">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            ${allCursos.length} cursos, ${allUnidades.length} unidades
          </div>
        </div>
      </div>

      ${alunosEmRisco.length > 0 ? `
      <!-- Alunos em Risco -->
      <div class="card" style="border-color:rgba(239,68,68,0.25);margin-bottom:var(--space-6)">
        <div class="card-header">
          <span class="card-title" style="color:#f87171">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            Alunos em Risco de Reprovação
          </span>
          <span class="badge" style="background:rgba(239,68,68,0.15);color:#f87171;border:1px solid rgba(239,68,68,0.25)">
            ${alunosEmRisco.length} com freq. &lt;75%
          </span>
        </div>
        <div class="card-body" style="padding:0">
          ${alunosEmRisco.map(a => `
            <div class="detail-row" style="padding:12px 20px;display:flex;align-items:center;gap:14px">
              <div style="flex:1;min-width:0">
                <div style="font-weight:600;font-size:13px;color:var(--text-primary)">${escapeHtml(a.nome)}</div>
                <div style="font-size:11px;color:var(--text-tertiary)">${escapeHtml(a.turmaNome)}</div>
              </div>
              <div style="text-align:right;flex-shrink:0">
                <div style="font-size:15px;font-weight:700;color:#f87171">${a.freqPct}%</div>
                <div style="font-size:10px;color:var(--text-tertiary)">frequência</div>
              </div>
              <div style="width:64px;flex-shrink:0">
                <div style="background:rgba(255,255,255,0.07);border-radius:99px;height:6px;overflow:hidden">
                  <div style="height:100%;border-radius:99px;width:${a.freqPct}%;background:${a.freqPct >= 60 ? '#fbbf24' : '#ef4444'}"></div>
                </div>
              </div>
            </div>
          `).join('')}
          <div style="padding:10px 20px;border-top:1px solid rgba(255,255,255,0.06)">
            <button class="btn btn-ghost btn-sm" onclick="app.router.push('/relatorios')" style="color:#f87171;font-size:12px">
              Ver relatório completo →
            </button>
          </div>
        </div>
      </div>
      ` : ''}

      <!-- Charts & Tables row -->
      <div class="content-grid">
        <!-- Attendance Chart -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              Frequência Semanal
            </span>
            <span class="badge badge-success badge-dot">Últimos 5 dias úteis</span>
          </div>
          <div class="card-body">
            ${chartDays.length ? `
            <div class="bar-chart">
              ${chartDays.map((d, i) => `
                <div class="bar-chart-col">
                  <div class="bar-chart-bar${i % 3 === 1 ? ' second' : i % 3 === 2 ? ' third' : ''}"
                       style="height: ${(d.pct / maxPct) * 100}%"
                       title="${d.label}: ${d.pct}%"></div>
                  <div class="bar-chart-label">${d.label.replace('.', '')}</div>
                </div>
              `).join('')}
            </div>
            <div style="margin-top:12px; display:flex; gap:12px; flex-wrap:wrap;">
              ${chartDays.map(d => `
                <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text-secondary)">
                  <strong style="color:var(--text-primary)">${d.pct}%</strong>
                  <span>${d.label}</span>
                </div>
              `).join('')}
            </div>` : `<p style="color:var(--text-tertiary);font-size:13px">Nenhum registro de presença ainda.</p>`}
          </div>
        </div>

        <!-- Recent Turmas -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
              Turmas
            </span>
            <button class="btn btn-ghost btn-sm" onclick="app.router.push('/turmas')">Ver todas</button>
          </div>
          <div class="card-body" style="padding:0">
            ${recentTurmas.length ? recentTurmas.map(t => {
        const turmaAlunos = allAlunos.filter(a => a.turmaId === t.id);
        const curso = cursos.getById(t.cursoId);
        const turno = turnos.getById(t.turnoId);
        const stats = presencas.getStats(t.id);
        const freq = stats.total ? Math.round((stats.presentes / stats.total) * 100) : 0;
        return `
                <div class="detail-row" style="padding:14px 20px; cursor:pointer;" onclick="app.router.push('/turmas')">
                  <div>
                    <div style="font-weight:600;color:var(--text-primary);font-size:13px">${t.nome}</div>
                    <div style="font-size:11px;color:var(--text-tertiary);margin-top:2px">${curso?.nome || '—'} · ${turno?.nome || '—'}</div>
                  </div>
                  <div style="text-align:right">
                    <div style="font-size:13px;font-weight:600;color:${freq >= 75 ? 'var(--secondary-400)' : 'var(--danger-400)'}">${freq}%</div>
                    <div style="font-size:11px;color:var(--text-tertiary)">${turmaAlunos.length} alunos</div>
                  </div>
                </div>
              `;
    }).join('') : `<div class="empty-state" style="padding:32px">
              <p>Nenhuma turma cadastrada.</p>
              <button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="app.router.push('/turmas')">Criar turma</button>
            </div>`}
          </div>
        </div>
      </div>

      <!-- Ranking de Turmas -->
      ${rankingTurmas.length > 0 ? `
      <div class="card" style="margin-top:var(--space-6)">
        <div class="card-header">
          <span class="card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
              <polyline points="17 6 23 6 23 12"/>
            </svg>
            Ranking de Turmas por Frequência
          </span>
          <button class="btn btn-ghost btn-sm" onclick="app.router.push('/relatorios')">Ver relatórios</button>
        </div>
        <div class="card-body" style="padding:0">
          ${rankingTurmas.map((t, idx) => {
              const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx+1}º`;
              const corFreq = t.freq >= 75 ? 'var(--secondary-400)' : t.freq >= 60 ? 'var(--warning-400)' : 'var(--danger-400)';
              const corBar  = t.freq >= 75 ? 'var(--secondary-500)' : t.freq >= 60 ? '#f59e0b' : 'var(--danger-500)';
              return `
              <div style="display:flex;align-items:center;gap:14px;padding:12px 20px;border-bottom:1px solid rgba(255,255,255,0.05)">
                <span style="font-size:${idx < 3 ? '18' : '13'}px;width:28px;text-align:center;flex-shrink:0">${medal}</span>
                <div style="flex:1;min-width:0">
                  <div style="font-weight:600;font-size:13px;color:var(--text-primary)">${escapeHtml(t.nome)}</div>
                  <div style="font-size:11px;color:var(--text-tertiary);margin-top:2px">${escapeHtml(t.cursoNome)} &middot; ${t.totalAulas} aulas</div>
                </div>
                <div style="display:flex;align-items:center;gap:10px;flex-shrink:0">
                  <div style="width:90px;height:8px;background:rgba(255,255,255,0.07);border-radius:99px;overflow:hidden">
                    <div style="width:${t.freq}%;height:8px;background:${corBar};border-radius:99px;transition:width 0.5s"></div>
                  </div>
                  <span style="font-size:13px;font-weight:700;color:${corFreq};min-width:38px;text-align:right">${t.freq}%</span>
                </div>
              </div>`;
          }).join('')}
        </div>
      </div>
      ` : ''}

      <!-- Quick Actions -->
      <div class="card" style="margin-top: var(--space-6);">
        <div class="card-header">
          <span class="card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            Ações Rápidas
          </span>
        </div>
        <div class="card-body" style="padding: var(--space-5)">

          <!-- Presença por turma -->
          <div style="margin-bottom:18px">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--text-tertiary);margin-bottom:10px">
              Registrar Presença Hoje — ${formatDate(todayStr)}
            </div>
            ${allTurmas.length > 0 ? `
            <div style="display:flex;flex-wrap:wrap;gap:8px">
              ${allTurmas.map(t => {
                  const jaRegistrada = presencas.getByTurmaData(t.id, todayStr).length > 0;
                  return `<button class="btn btn-secondary btn-sm" style="gap:6px;${jaRegistrada ? 'border-color:rgba(34,197,94,0.35);color:#4ade80' : ''}"
                    onclick="sessionStorage.setItem('edu_quick_presenca','${t.id}');app.router.push('/presenca')">
                    ${jaRegistrada ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>` : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`}
                    ${escapeHtml(t.nome)}
                  </button>`;
              }).join('')}
            </div>` : `<p style="font-size:12px;color:var(--text-tertiary)">Nenhuma turma cadastrada ainda. <button class="btn btn-ghost btn-sm" onclick="app.router.push('/turmas')">Criar turma →</button></p>`}
          </div>

          <!-- Outros atalhos -->
          <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:14px">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--text-tertiary);margin-bottom:10px">
              Outros atalhos
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:8px">
              <button class="btn btn-secondary btn-sm" style="gap:8px" onclick="app.router.push('/notas')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                Lançar Notas
              </button>
              <button class="btn btn-secondary btn-sm" style="gap:8px" onclick="app.router.push('/alunos')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                Novo Aluno
              </button>
              <button class="btn btn-secondary btn-sm" style="gap:8px" onclick="app.router.push('/relatorios')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                Ver Relatórios
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
