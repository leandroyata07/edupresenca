// =========================================================
// EduPresença – Boletim do Aluno
// =========================================================
import { alunos, turmas, cursos, unidades, presencas, notas, disciplinas, config } from '../store.js';
import { escapeHtml, getInitials, stringToHue, formatDate, calcAverage, gradeSituation, gradeSituationLabel } from '../utils.js';

const PERIODOS = ['1º Bimestre', '2º Bimestre', '3º Bimestre', '4º Bimestre'];

/**
 * Abre o boletim de um aluno em um modal existente.
 * @param {string} alunoId
 * @param {HTMLElement} modalEl – instância de <app-modal>
 */
export function openBoletim(alunoId, modalEl) {
    const aluno = alunos.getById(alunoId);
    if (!aluno) {
        window.toast?.error('Erro', 'Aluno não encontrado.');
        return;
    }

    const turma = turmas.getById(aluno.turmaId);
    const curso = turma ? cursos.getById(turma.cursoId) : null;
    const unidade = aluno.unidadeId ? unidades.getById(aluno.unidadeId) : null;
    const cfg = config.get();
    const hue = stringToHue(aluno.nome);

    // ── Frequência ──────────────────────────────────────
    const freqRegistros = presencas.getByAluno(aluno.id);
    const totalAulas = freqRegistros.length;
    const totalPresentes = freqRegistros.filter(r => r.presente).length;
    const totalAusentes = totalAulas - totalPresentes;
    const freqPct = totalAulas > 0 ? ((totalPresentes / totalAulas) * 100) : null;
    const freqStatus = freqPct === null ? 'sem-dados'
        : freqPct >= 75 ? 'regular' : 'irregular';

    // Frequência por turma (apenas turma atual)
    const freqTurmaRegs = turma ? presencas.getAll().filter(p => p.alunoId === aluno.id && p.turmaId === turma.id) : [];
    const freqTurmaTotal = freqTurmaRegs.length;
    const freqTurmaPresentes = freqTurmaRegs.filter(r => r.presente).length;
    const freqTurmaPct = freqTurmaTotal > 0 ? ((freqTurmaPresentes / freqTurmaTotal) * 100) : null;

    // ── Notas ────────────────────────────────────────────
    // Coletar todas as disciplinas disponíveis para a turma do aluno
    let discNomes = [];
    if (turma) {
        // De notas já lançadas para essa turma
        const discFromNotas = notas.getDisciplinas(aluno.turmaId);
        // Do cadastro de disciplinas vinculadas ao curso
        const discFromStore = disciplinas.getAll()
            .filter(d => d.cursoId === turma.cursoId)
            .map(d => d.nome);
        // Do campo disciplinas do curso (legado)
        const discFromCurso = (curso?.disciplinas || '').split(',').map(s => s.trim()).filter(Boolean);
        discNomes = [...new Set([...discFromStore, ...discFromCurso, ...discFromNotas])].sort();
    }

    // Pegar notas do aluno agrupadas por disciplina e período
    const alunoNotas = notas.getAll().filter(n => n.alunoId === aluno.id && n.turmaId === aluno.turmaId);

    // Índice: { disciplina: { periodo: nota } }
    const notasIndex = {};
    alunoNotas.forEach(n => {
        if (!notasIndex[n.disciplina]) notasIndex[n.disciplina] = {};
        notasIndex[n.disciplina][n.periodo] = n.nota;
    });

    // Também incluir disciplinas que têm notas mas não estão no curso
    const discComNotas = Object.keys(notasIndex);
    discNomes = [...new Set([...discNomes, ...discComNotas])].sort();

    // Pesos configuráveis por bimestre (padrão: iguais)
    const pesos = (() => {
        const raw = cfg.pesoBimestres;
        if (Array.isArray(raw) && raw.length === 4 && raw.every(n => typeof n === 'number' && n >= 0)) return raw;
        return [1, 1, 1, 1];
    })();

    // Calcular média e situação por disciplina
    const discLinhas = discNomes.map(disc => {
        const periodoNotas = PERIODOS.map(p => {
            const val = notasIndex[disc]?.[p];
            return (val !== undefined && val !== '' && val !== null) ? Number(val) : null;
        });
        // Weighted average
        let wSum = 0, wTotal = 0;
        periodoNotas.forEach((n, idx) => {
            if (n !== null) { wSum += n * pesos[idx]; wTotal += pesos[idx]; }
        });
        const media = wTotal > 0 ? wSum / wTotal : null;
        const situacao = media !== null ? gradeSituation(media) : null;
        return { disc, periodoNotas, media, situacao, hasAnyNota: wTotal > 0 };
    });

    // Situação geral do aluno
    const discComNota = discLinhas.filter(d => d.hasAnyNota);
    let situacaoGeral = null;
    if (discComNota.length > 0) {
        const temReprovado = discComNota.some(d => d.situacao === 'failed');
        const temRecuperacao = discComNota.some(d => d.situacao === 'recovery');
        situacaoGeral = temReprovado ? 'failed' : temRecuperacao ? 'recovery' : 'approved';
    }

    // ── Renderização ─────────────────────────────────────
    const avatar = aluno.foto
        ? `<img src="${escapeHtml(aluno.foto)}" class="bol-avatar-img" />`
        : `<div class="bol-avatar-initials" style="background:hsl(${hue},60%,42%)">${getInitials(aluno.nome)}</div>`;

    const freqBarWidth = freqPct !== null ? Math.min(100, freqPct).toFixed(1) : 0;
    const freqBarClass = freqStatus === 'regular' ? 'bar-green' : freqStatus === 'irregular' ? 'bar-red' : 'bar-gray';

    const freqBadge = freqStatus === 'regular'
        ? `<span class="bol-badge bol-badge-green">✓ Regular (≥75%)</span>`
        : freqStatus === 'irregular'
        ? `<span class="bol-badge bol-badge-red">⚠ Irregular (&lt;75%)</span>`
        : `<span class="bol-badge bol-badge-gray">Sem registros</span>`;

    const situacaoBadge = situacaoGeral === 'approved'
        ? `<span class="bol-badge bol-badge-green" style="font-size:14px;padding:6px 16px">✓ Aprovado</span>`
        : situacaoGeral === 'recovery'
        ? `<span class="bol-badge bol-badge-yellow" style="font-size:14px;padding:6px 16px">⟳ Em Recuperação</span>`
        : situacaoGeral === 'failed'
        ? `<span class="bol-badge bol-badge-red" style="font-size:14px;padding:6px 16px">✗ Reprovado</span>`
        : `<span class="bol-badge bol-badge-gray" style="font-size:14px;padding:6px 16px">— Sem dados</span>`;

    function notaCell(val) {
        if (val === null) return `<td class="bol-td bol-nota-vazia">—</td>`;
        const cls = val >= 7 ? 'bol-nota-ok' : val >= 5 ? 'bol-nota-rec' : 'bol-nota-fail';
        return `<td class="bol-td ${cls}">${val.toFixed(1)}</td>`;
    }

    function mediaCell(media, situacao) {
        if (media === null) return `<td class="bol-td bol-nota-vazia" style="font-weight:600">—</td>`;
        const cls = situacao === 'approved' ? 'bol-nota-ok' : situacao === 'recovery' ? 'bol-nota-rec' : 'bol-nota-fail';
        return `<td class="bol-td ${cls}" style="font-weight:700">${Number(media).toFixed(1)}</td>`;
    }

    function situacaoCell(situacao) {
        if (!situacao) return `<td class="bol-td bol-nota-vazia">—</td>`;
        const map = {
            approved: `<span class="bol-badge bol-badge-green">Aprovado</span>`,
            recovery: `<span class="bol-badge bol-badge-yellow">Recuperação</span>`,
            failed:   `<span class="bol-badge bol-badge-red">Reprovado</span>`,
        };
        return `<td class="bol-td">${map[situacao] || '—'}</td>`;
    }

    const notasRows = discLinhas.length > 0
        ? discLinhas.map(d => `
            <tr class="bol-tr">
              <td class="bol-td bol-td-disc">${escapeHtml(d.disc)}</td>
              ${d.periodoNotas.map(n => notaCell(n)).join('')}
              ${mediaCell(d.media, d.situacao)}
              ${situacaoCell(d.situacao)}
            </tr>`).join('')
        : `<tr><td colspan="7" class="bol-empty-row">Nenhuma nota lançada para este aluno.</td></tr>`;

    const body = `
      <style>
        .bol-root { font-family: var(--font-sans,'Inter',sans-serif); color: var(--text-primary,#f1f5f9); }

        /* ── Header do aluno ── */
        .bol-header {
          display: flex; align-items: center; gap: 20px;
          background: rgba(99,102,241,0.08);
          border: 1px solid rgba(99,102,241,0.18);
          border-radius: 14px;
          padding: 20px 24px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .bol-avatar-img, .bol-avatar-initials {
          width: 64px; height: 64px; border-radius: 50%; flex-shrink: 0;
        }
        .bol-avatar-img { object-fit: cover; }
        .bol-avatar-initials {
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; font-weight: 700; color: #fff;
        }
        .bol-info { flex: 1; min-width: 0; }
        .bol-nome {
          font-size: 20px; font-weight: 700; color: var(--text-primary,#f1f5f9);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .bol-meta {
          display: flex; flex-wrap: wrap; gap: 16px; margin-top: 8px;
        }
        .bol-meta-item {
          font-size: 12px; color: var(--text-tertiary,#64748b);
          display: flex; align-items: center; gap: 5px;
        }
        .bol-meta-item strong { color: var(--text-secondary,#94a3b8); font-weight: 500; }
        .bol-situacao-badge { margin-left: auto; flex-shrink: 0; align-self: flex-start; }
        .bol-anoletivo {
          font-size: 11px; color: var(--text-tertiary,#64748b);
          margin-top: 6px;
        }

        /* ── Seção ── */
        .bol-section { margin-bottom: 24px; }
        .bol-section-title {
          font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; color: var(--text-tertiary,#64748b);
          margin-bottom: 12px; display: flex; align-items: center; gap: 8px;
        }
        .bol-section-title::after {
          content: ''; flex: 1; height: 1px;
          background: rgba(255,255,255,0.07);
        }

        /* ── Frequência ── */
        .bol-freq-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
          gap: 12px; margin-bottom: 16px;
        }
        .bol-freq-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px; padding: 14px 16px;
          text-align: center;
        }
        .bol-freq-val {
          font-size: 26px; font-weight: 700;
          color: var(--text-primary,#f1f5f9); line-height: 1;
        }
        .bol-freq-label {
          font-size: 11px; color: var(--text-tertiary,#64748b);
          margin-top: 4px; text-transform: uppercase; letter-spacing: 0.05em;
        }
        .bol-progress-wrap {
          background: rgba(255,255,255,0.06); border-radius: 99px;
          height: 10px; overflow: hidden; margin-bottom: 10px;
        }
        .bol-progress-bar {
          height: 100%; border-radius: 99px;
          transition: width 0.6s cubic-bezier(0.4,0,0.2,1);
        }
        .bar-green { background: linear-gradient(90deg,#22c55e,#4ade80); }
        .bar-red   { background: linear-gradient(90deg,#ef4444,#f87171); }
        .bar-gray  { background: rgba(255,255,255,0.15); }
        .bol-freq-bottom {
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 8px;
        }
        .bol-freq-pct-label { font-size: 13px; color: var(--text-secondary,#94a3b8); }

        /* ── Notas ── */
        .bol-table-wrap {
          overflow-x: auto;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.07);
        }
        .bol-table {
          width: 100%; border-collapse: collapse;
          font-size: 13px;
        }
        .bol-th {
          background: rgba(255,255,255,0.04);
          padding: 10px 14px;
          text-align: center;
          font-size: 11px; font-weight: 600;
          letter-spacing: 0.06em; text-transform: uppercase;
          color: var(--text-tertiary,#64748b);
          border-bottom: 1px solid rgba(255,255,255,0.07);
          white-space: nowrap;
        }
        .bol-th-disc { text-align: left; }
        .bol-tr:not(:last-child) td {
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .bol-tr:hover td { background: rgba(255,255,255,0.025); }
        .bol-td {
          padding: 10px 14px; text-align: center;
          color: var(--text-primary,#f1f5f9);
        }
        .bol-td-disc { text-align: left; font-weight: 500; white-space: nowrap; }
        .bol-nota-ok   { color: #4ade80; }
        .bol-nota-rec  { color: #fbbf24; }
        .bol-nota-fail { color: #f87171; }
        .bol-nota-vazia { color: var(--text-tertiary,#64748b); }
        .bol-empty-row {
          text-align: center; color: var(--text-tertiary,#64748b);
          padding: 32px 16px; font-style: italic;
        }

        /* ── Situação Geral ── */
        .bol-geral {
          display: flex; align-items: center; justify-content: space-between;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px; padding: 18px 22px; flex-wrap: wrap; gap: 12px;
        }
        .bol-geral-label {
          font-size: 14px; font-weight: 500; color: var(--text-secondary,#94a3b8);
        }

        /* ── Badges ── */
        .bol-badge {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 3px 10px; border-radius: 99px;
          font-size: 11px; font-weight: 600; white-space: nowrap;
        }
        .bol-badge-green  { background: rgba(34,197,94,0.15); color: #4ade80; border: 1px solid rgba(34,197,94,0.25); }
        .bol-badge-red    { background: rgba(239,68,68,0.15);  color: #f87171; border: 1px solid rgba(239,68,68,0.25); }
        .bol-badge-yellow { background: rgba(245,158,11,0.15); color: #fbbf24; border: 1px solid rgba(245,158,11,0.25); }
        .bol-badge-gray   { background: rgba(148,163,184,0.1); color: #94a3b8; border: 1px solid rgba(148,163,184,0.15); }

        @media (max-width:520px) {
          .bol-header { gap: 14px; padding: 14px 16px; }
          .bol-freq-val { font-size: 20px; }
        }
      </style>

      <div class="bol-root" id="boletim-content">
        <!-- Header do aluno -->
        <div class="bol-header">
          ${avatar}
          <div class="bol-info">
            <div class="bol-nome">${escapeHtml(aluno.nome)}</div>
            <div class="bol-meta">
              ${turma ? `<span class="bol-meta-item"><strong>Turma:</strong> ${escapeHtml(turma.nome)}</span>` : ''}
              ${curso ? `<span class="bol-meta-item"><strong>Curso:</strong> ${escapeHtml(curso.nome)}</span>` : ''}
              ${unidade ? `<span class="bol-meta-item"><strong>Unidade:</strong> ${escapeHtml(unidade.nome)}</span>` : ''}
              ${aluno.dataNascimento ? `<span class="bol-meta-item"><strong>Nasc.:</strong> ${formatDate(aluno.dataNascimento)}</span>` : ''}
              ${aluno.cpf ? `<span class="bol-meta-item"><strong>CPF:</strong> ${escapeHtml(aluno.cpf)}</span>` : ''}
              ${aluno.email ? `<span class="bol-meta-item"><strong>E-mail:</strong> ${escapeHtml(aluno.email)}</span>` : ''}
            </div>
            <div class="bol-anoletivo">Ano Letivo: ${cfg.anoLetivo || new Date().getFullYear()}</div>
          </div>
          <div class="bol-situacao-badge">
            ${(aluno.situacao || 'ativo') === 'ativo'
              ? `<span class="bol-badge bol-badge-green">● Ativo</span>`
              : `<span class="bol-badge bol-badge-gray">● Inativo</span>`
            }
          </div>
        </div>

        <!-- Frequência -->
        <div class="bol-section">
          <div class="bol-section-title">Frequência</div>

          <div class="bol-freq-grid">
            <div class="bol-freq-card">
              <div class="bol-freq-val">${totalAulas}</div>
              <div class="bol-freq-label">Aulas Reg.</div>
            </div>
            <div class="bol-freq-card">
              <div class="bol-freq-val" style="color:#4ade80">${totalPresentes}</div>
              <div class="bol-freq-label">Presenças</div>
            </div>
            <div class="bol-freq-card">
              <div class="bol-freq-val" style="color:#f87171">${totalAusentes}</div>
              <div class="bol-freq-label">Ausências</div>
            </div>
            <div class="bol-freq-card">
              <div class="bol-freq-val" style="color:${freqPct === null ? '#64748b' : freqPct >= 75 ? '#4ade80' : '#f87171'}">
                ${freqPct !== null ? freqPct.toFixed(1) + '%' : '—'}
              </div>
              <div class="bol-freq-label">Frequência</div>
            </div>
            ${freqTurmaTotal > 0 && freqTurmaTotal !== totalAulas ? `
            <div class="bol-freq-card">
              <div class="bol-freq-val" style="color:${freqTurmaPct >= 75 ? '#4ade80' : '#f87171'}">
                ${freqTurmaPct !== null ? freqTurmaPct.toFixed(1) + '%' : '—'}
              </div>
              <div class="bol-freq-label">Freq. Turma</div>
            </div>` : ''}
          </div>

          <div class="bol-progress-wrap">
            <div class="bol-progress-bar ${freqBarClass}" style="width:${freqBarWidth}%"></div>
          </div>
          <div class="bol-freq-bottom">
            <span class="bol-freq-pct-label">
              Mínimo exigido: <strong>75%</strong>
              ${freqPct !== null ? `&nbsp;|&nbsp; Faltam ainda: <strong>${Math.max(0, 75 - freqPct).toFixed(1)}%</strong>` : ''}
            </span>
            ${freqBadge}
          </div>
        </div>

        <!-- Notas por Disciplina -->
        <div class="bol-section">
          <div class="bol-section-title">Notas por Disciplina</div>
          <div class="bol-table-wrap">
            <table class="bol-table">
              <thead>
                <tr>
                  <th class="bol-th bol-th-disc">Disciplina</th>
                  ${PERIODOS.map(p => `<th class="bol-th">${p.replace('º Bimestre', 'º Bim')}</th>`).join('')}
                  <th class="bol-th">Média</th>
                  <th class="bol-th">Situação</th>
                </tr>
              </thead>
              <tbody>${notasRows}</tbody>
            </table>
          </div>
          <div style="margin-top:8px;font-size:11px;color:var(--text-tertiary,#64748b);display:flex;gap:16px;flex-wrap:wrap">
            <span style="color:#4ade80">■</span> Aprovado (≥7.0)
            &nbsp;<span style="color:#fbbf24">■</span> Recuperação (5.0–6.9)
            &nbsp;<span style="color:#f87171">■</span> Reprovado (&lt;5.0)
            ${pesos.some((p,i) => p !== pesos[0]) ? `&nbsp;| Pesos: ${pesos.map((p,i)=>PERIODOS[i].replace('º Bimestre','ºBim')+`=`+p).join(', ')}` : ''}
          </div>
        </div>

        <!-- Evolução das Notas (gráfico SVG) -->
        ${discLinhas.some(d => d.hasAnyNota) ? (() => {
          const CHART_W = 560;
          const CHART_H = 160;
          const PAD = { top: 18, right: 24, bottom: 32, left: 36 };
          const innerW = CHART_W - PAD.left - PAD.right;
          const innerH = CHART_H - PAD.top - PAD.bottom;

          const COLORS = ['#818cf8','#34d399','#fbbf24','#f87171','#a78bfa','#38bdf8','#fb7185','#4ade80'];
          const xStep = innerW / 3; // 4 points, 3 gaps

          function toY(val) {
            return PAD.top + innerH - (val / 10) * innerH;
          }
          function toX(idx) {
            return PAD.left + idx * xStep;
          }

          // Y grid lines at 0, 5, 7, 10
          const gridLines = [0, 5, 7, 10].map(v => {
            const y = toY(v);
            const color = v === 7 ? 'rgba(99,102,241,0.35)' : 'rgba(255,255,255,0.07)';
            return `<line x1="${PAD.left}" y1="${y}" x2="${PAD.left + innerW}" y2="${y}" stroke="${color}" stroke-width="1" stroke-dasharray="${v === 7 ? '4,3' : '0'}"/>
                    <text x="${PAD.left - 5}" y="${y + 4}" text-anchor="end" font-size="9" fill="#64748b">${v}</text>`;
          }).join('');

          // X axis labels
          const xLabels = PERIODOS.map((p, i) =>
            `<text x="${toX(i)}" y="${CHART_H - 6}" text-anchor="middle" font-size="9" fill="#64748b">${p.replace('º Bimestre', 'ºB')}</text>`
          ).join('');

          // Lines + dots per discipline (skip if no notes at all)
          const lines = discLinhas.filter(d => d.hasAnyNota).slice(0, 8).map((d, di) => {
            const color = COLORS[di % COLORS.length];
            const validPoints = d.periodoNotas.map((n, i) => n !== null ? { x: toX(i), y: toY(n), n } : null).filter(Boolean);
            if (validPoints.length < 1) return '';
            // Draw line only between consecutive non-null points
            let path = '';
            let prev = null;
            d.periodoNotas.forEach((n, i) => {
              if (n !== null) {
                const x = toX(i), y = toY(n);
                if (prev !== null) path += ` M${prev.x},${prev.y} L${x},${y}`;
                prev = { x, y };
              } else { prev = null; }
            });
            const dots = validPoints.map(p =>
              `<circle cx="${p.x}" cy="${p.y}" r="4.5" fill="${color}" stroke="rgba(0,0,0,0.3)" stroke-width="1.5"/>
               <title>${escapeHtml(d.disc)}: ${p.n.toFixed(1)}</title>`
            ).join('');
            return `<g>
              <path d="${path}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" opacity="0.85"/>
              ${dots}
            </g>`;
          }).join('');

          // Legend
          const legend = discLinhas.filter(d => d.hasAnyNota).slice(0, 8).map((d, di) =>
            `<span style="display:inline-flex;align-items:center;gap:5px;font-size:11px;color:var(--text-secondary,#94a3b8);white-space:nowrap">
              <span style="width:10px;height:10px;border-radius:50%;background:${COLORS[di % COLORS.length]};flex-shrink:0"></span>
              ${escapeHtml(d.disc)}
            </span>`
          ).join('');

          return `
        <div class="bol-section">
          <div class="bol-section-title">Evolução das Notas</div>
          <div style="overflow-x:auto;border-radius:10px;border:1px solid rgba(255,255,255,0.07);padding:12px 8px 4px">
            <svg viewBox="0 0 ${CHART_W} ${CHART_H}" width="100%" preserveAspectRatio="xMidYMid meet"
                 style="display:block;min-width:280px;max-width:100%">
              ${gridLines}
              ${xLabels}
              <line x1="${PAD.left}" y1="${PAD.top}" x2="${PAD.left}" y2="${PAD.top + innerH}" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
              ${lines}
            </svg>
            <div style="display:flex;flex-wrap:wrap;gap:10px 18px;padding:6px 8px 4px">${legend}</div>
          </div>
        </div>`;
        })() : ''}

        <!-- Situação Geral -->
        <div class="bol-section">
          <div class="bol-section-title">Situação Geral</div>
          <div class="bol-geral">
            <span class="bol-geral-label">
              ${discComNota.length > 0
                ? `Calculado com base em ${discComNota.length} disciplina${discComNota.length > 1 ? 's' : ''}`
                : 'Nenhuma nota lançada ainda'}
            </span>
            ${situacaoBadge}
          </div>
        </div>
      </div>
    `;

    const footer = `
      <button class="btn btn-ghost" id="bol-fechar">Fechar</button>
      <button class="btn btn-ghost btn-sm" id="bol-imprimir" title="Imprimir / Salvar PDF">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 6 2 18 2 18 9"/>
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
          <rect x="6" y="14" width="12" height="8"/>
        </svg>
        Imprimir / PDF
      </button>
    `;

    modalEl.open({
        title: `Boletim – ${aluno.nome}`,
        icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>`,
        body,
        footer,
        size: 'xl',
    });

    const sr = modalEl.shadowRoot;
    sr.getElementById('bol-fechar')?.addEventListener('click', () => modalEl.close());

    sr.getElementById('bol-imprimir')?.addEventListener('click', () => _printBoletim(aluno, turma, curso, unidade, cfg, freqPct, totalAulas, totalPresentes, totalAusentes, freqStatus, discLinhas, situacaoGeral, discComNota));
}

// ── Impressão/PDF ─────────────────────────────────────────
function _printBoletim(aluno, turma, curso, unidade, cfg, freqPct, totalAulas, totalPresentes, totalAusentes, freqStatus, discLinhas, situacaoGeral, discComNota) {
    const hue = stringToHue(aluno.nome);

    const freqColor = freqStatus === 'regular' ? '#22c55e' : freqStatus === 'irregular' ? '#ef4444' : '#94a3b8';
    const freqLabel = freqStatus === 'regular' ? 'Regular (≥75%)' : freqStatus === 'irregular' ? 'Irregular (<75%)' : 'Sem registros';

    const sitLabel = situacaoGeral === 'approved' ? '✓ Aprovado'
        : situacaoGeral === 'recovery' ? '⟳ Em Recuperação'
        : situacaoGeral === 'failed' ? '✗ Reprovado'
        : '— Sem dados';
    const sitColor = situacaoGeral === 'approved' ? '#22c55e'
        : situacaoGeral === 'recovery' ? '#d97706'
        : situacaoGeral === 'failed' ? '#ef4444' : '#94a3b8';

    function notaStr(val) {
        return val !== null ? val.toFixed(1) : '—';
    }
    function situacaoStr(s) {
        return s === 'approved' ? 'Aprovado' : s === 'recovery' ? 'Recuperação' : s === 'failed' ? 'Reprovado' : '—';
    }
    function situacaoColor(s) {
        return s === 'approved' ? '#15803d' : s === 'recovery' ? '#92400e' : s === 'failed' ? '#991b1b' : '#555';
    }

    const notasRows = discLinhas.map(d => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-weight:500">${escapeHtml(d.disc)}</td>
        ${d.periodoNotas.map(n => `<td style="padding:8px 12px;text-align:center;border-bottom:1px solid #e5e7eb">${notaStr(n)}</td>`).join('')}
        <td style="padding:8px 12px;text-align:center;border-bottom:1px solid #e5e7eb;font-weight:700">${d.media !== null ? Number(d.media).toFixed(1) : '—'}</td>
        <td style="padding:8px 12px;text-align:center;border-bottom:1px solid #e5e7eb">
          <span style="background:${situacaoColor(d.situacao)}1a;color:${situacaoColor(d.situacao)};padding:2px 8px;border-radius:99px;font-size:11px;font-weight:600">
            ${situacaoStr(d.situacao)}
          </span>
        </td>
      </tr>`).join('');

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<title>Boletim – ${escapeHtml(aluno.nome)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #111; background: #fff; padding: 32px 40px; }
  h1 { font-size: 22px; font-weight: 700; color: #1e1b4b; margin-bottom: 4px; }
  .subtitle { font-size: 12px; color: #6b7280; margin-bottom: 24px; }
  .card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px 20px; margin-bottom: 20px; }
  .card-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #6b7280; margin-bottom: 12px; }
  .header-row { display: flex; align-items: center; gap: 16px; }
  .avatar { width: 56px; height: 56px; border-radius: 50%; background: hsl(${hue},55%,42%); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; flex-shrink: 0; }
  .meta-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px 24px; }
  .meta-item { font-size: 12px; color: #374151; }
  .meta-item strong { color: #111827; }
  .freq-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 14px; }
  .freq-card { text-align: center; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; }
  .freq-val { font-size: 22px; font-weight: 700; }
  .freq-lbl { font-size: 10px; text-transform: uppercase; color: #6b7280; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #f3f4f6; padding: 8px 12px; text-align: center; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #4b5563; border-bottom: 2px solid #e5e7eb; }
  th:first-child { text-align: left; }
  .geral { display: flex; align-items: center; justify-content: space-between; }
  .badge-geral { font-size: 13px; font-weight: 700; padding: 5px 16px; border-radius: 99px; }
  @media print { body { padding: 20px; } @page { margin: 12mm; } }
</style>
</head>
<body>
  <h1>Boletim Escolar</h1>
  <div class="subtitle">EduPresença — Ano Letivo ${cfg.anoLetivo || new Date().getFullYear()} — Emitido em ${new Date().toLocaleDateString('pt-BR')}</div>

  <div class="card">
    <div class="card-title">Dados do Aluno</div>
    <div class="header-row">
      <div class="avatar">${getInitials(aluno.nome)}</div>
      <div style="flex:1">
        <div style="font-size:18px;font-weight:700;margin-bottom:8px">${escapeHtml(aluno.nome)}</div>
        <div class="meta-grid">
          ${turma ? `<div class="meta-item"><strong>Turma:</strong> ${escapeHtml(turma.nome)}</div>` : ''}
          ${curso ? `<div class="meta-item"><strong>Curso:</strong> ${escapeHtml(curso.nome)}</div>` : ''}
          ${unidade ? `<div class="meta-item"><strong>Unidade:</strong> ${escapeHtml(unidade.nome)}</div>` : ''}
          ${aluno.dataNascimento ? `<div class="meta-item"><strong>Nasc.:</strong> ${formatDate(aluno.dataNascimento)}</div>` : ''}
          ${aluno.cpf ? `<div class="meta-item"><strong>CPF:</strong> ${escapeHtml(aluno.cpf)}</div>` : ''}
          ${aluno.email ? `<div class="meta-item"><strong>E-mail:</strong> ${escapeHtml(aluno.email)}</div>` : ''}
        </div>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-title">Frequência</div>
    <div class="freq-grid">
      <div class="freq-card"><div class="freq-val">${totalAulas}</div><div class="freq-lbl">Aulas Reg.</div></div>
      <div class="freq-card"><div class="freq-val" style="color:#16a34a">${totalPresentes}</div><div class="freq-lbl">Presenças</div></div>
      <div class="freq-card"><div class="freq-val" style="color:#dc2626">${totalAusentes}</div><div class="freq-lbl">Ausências</div></div>
      <div class="freq-card"><div class="freq-val" style="color:${freqColor}">${freqPct !== null ? freqPct.toFixed(1) + '%' : '—'}</div><div class="freq-lbl">Frequência</div></div>
    </div>
    <div style="color:${freqColor};font-weight:600;font-size:12px">Status: ${freqLabel}</div>
  </div>

  <div class="card">
    <div class="card-title">Notas por Disciplina</div>
    <table>
      <thead>
        <tr>
          <th style="text-align:left">Disciplina</th>
          ${PERIODOS.map(p => `<th>${p.replace('º Bimestre', 'º Bim')}</th>`).join('')}
          <th>Média</th>
          <th>Situação</th>
        </tr>
      </thead>
      <tbody>
        ${discLinhas.length > 0 ? notasRows : `<tr><td colspan="7" style="text-align:center;color:#9ca3af;padding:20px">Nenhuma nota lançada.</td></tr>`}
      </tbody>
    </table>
  </div>

  <div class="card">
    <div class="card-title">Situação Geral</div>
    <div class="geral">
      <span style="color:#4b5563">${discComNota.length > 0 ? `${discComNota.length} disciplina${discComNota.length > 1 ? 's' : ''} avaliada${discComNota.length > 1 ? 's' : ''}` : 'Sem dados suficientes'}</span>
      <span class="badge-geral" style="background:${sitColor}18;color:${sitColor};border:1px solid ${sitColor}40">${sitLabel}</span>
    </div>
  </div>

  <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 500); }<\/script>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=800,height=700');
    if (win) {
        win.document.write(html);
        win.document.close();
    } else {
        window.toast?.warning('Pop-up bloqueado', 'Permita pop-ups para imprimir o boletim.');
    }
}
