// =========================================================
// EduPresença — Quadro de Horários
// =========================================================
import { horarios, turmas, cursos, disciplinas, usuarios, auth, addLog, KEYS, triggerCloudSync, isSyncUser } from '../store.js';
import { escapeHtml as eh, getInitials, stringToHue, showConfirm, initRipple } from '../utils.js';

const DIAS_SEMANA = [
    { value: 1, label: 'Segunda-feira', short: 'Seg' },
    { value: 2, label: 'Terça-feira', short: 'Ter' },
    { value: 3, label: 'Quarta-feira', short: 'Qua' },
    { value: 4, label: 'Quinta-feira', short: 'Qui' },
    { value: 5, label: 'Sexta-feira', short: 'Sex' },
    { value: 6, label: 'Sábado', short: 'Sáb' }
];

const PERIODOS_MAX = 6; // Permite até 6 períodos por turno

export function render(outlet) {
    const me = auth.currentUser();
    const isGestor = auth.isGestor();
    const isProfessor = me && me.role === 'professor';

    // State
    let activeTab = isProfessor ? 'professor' : 'turma'; // 'turma' | 'professor'
    let selectedTurmaId = '';
    let selectedProfessorId = isProfessor ? me.id : '';

    // Autoselect first class if available
    const allTurmas = turmas.getAll().sort((a, b) => a.nome.localeCompare(b.nome));
    if (allTurmas.length > 0) {
        selectedTurmaId = allTurmas[0].id;
    }

    const allProfs = usuarios.getAll()
        .filter(u => u.role === 'professor')
        .sort((a, b) => a.nome.localeCompare(b.nome));
        
    if (!isProfessor && allProfs.length > 0) {
        selectedProfessorId = allProfs[0].id;
    }

    // Modal creation
    let modal;
    if (!document.getElementById('horarios-modal')) {
        modal = document.createElement('app-modal');
        modal.id = 'horarios-modal';
        document.body.appendChild(modal);
    } else {
        modal = document.getElementById('horarios-modal');
    }

    function initPage() {
        outlet.innerHTML = `
            <style>
                .hor-container {
                    font-family: var(--font-sans, 'Inter', sans-serif);
                    color: var(--text-primary);
                }
                
                /* Tabs Navigation */
                .hor-tabs {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 24px;
                    border-bottom: 1px solid var(--border-color);
                    padding-bottom: 8px;
                }
                .hor-tab {
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    color: var(--text-secondary);
                    transition: all 0.2s ease;
                    border: none;
                    background: transparent;
                }
                .hor-tab:hover {
                    color: var(--text-primary);
                    background: var(--bg-hover, rgba(255,255,255,0.02));
                }
                .hor-tab.active {
                    color: var(--primary-500, #8b5cf6);
                    background: var(--primary-50, rgba(139, 92, 246, 0.08));
                }

                /* Control Panel */
                .hor-controls {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 16px;
                    margin-bottom: 20px;
                    flex-wrap: wrap;
                }
                .hor-select-group {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .hor-select {
                    height: 38px;
                    font-size: 13.5px;
                    font-weight: 600;
                    border-radius: 10px;
                    border: 1px solid var(--border-color);
                    background: var(--surface-2);
                    color: var(--text-primary);
                    padding: 0 12px;
                    cursor: pointer;
                    min-width: 220px;
                }

                /* Visual Schedule Grid */
                .hor-grid-card {
                    background: var(--surface-2);
                    border: 1px solid var(--border-color);
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.05);
                }
                .hor-grid-table {
                    width: 100%;
                    border-collapse: collapse;
                    table-layout: fixed;
                }
                .hor-grid-th {
                    background: var(--surface-3);
                    border-bottom: 1px solid var(--border-color);
                    border-right: 1px solid var(--border-color);
                    padding: 12px 10px;
                    font-size: 11.5px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: var(--text-tertiary);
                    text-align: center;
                }
                .hor-grid-th:first-child {
                    width: 110px;
                }
                .hor-grid-th:last-child {
                    border-right: none;
                }
                
                .hor-grid-td {
                    border-bottom: 1px solid var(--border-color);
                    border-right: 1px solid var(--border-color);
                    height: 100px;
                    padding: 6px;
                    vertical-align: top;
                    position: relative;
                    transition: background 0.15s ease;
                }
                .hor-grid-td:last-child {
                    border-right: none;
                }
                .hor-grid-tr:last-child .hor-grid-td {
                    border-bottom: none;
                }

                /* Period labels */
                .hor-period-cell {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    font-weight: 700;
                    color: var(--text-secondary);
                    text-align: center;
                    background: rgba(255,255,255,0.01);
                }
                .hor-period-num {
                    font-size: 18px;
                    color: var(--primary-500, #8b5cf6);
                }
                .hor-period-lbl {
                    font-size: 10px;
                    text-transform: uppercase;
                    letter-spacing: 0.04em;
                    color: var(--text-tertiary);
                    margin-top: 2px;
                }

                /* Lesson Cards inside grid */
                .hor-cell-card {
                    background: var(--surface-1);
                    border: 1px solid var(--border-color);
                    border-left: 4px solid var(--cell-border-color, #8b5cf6);
                    border-radius: 10px;
                    padding: 8px 10px;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.02);
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .hor-cell-card:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 6px 16px rgba(0,0,0,0.08);
                }
                .hor-cell-discipline {
                    font-size: 12px;
                    font-weight: 700;
                    color: var(--text-primary);
                    line-height: 1.3;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .hor-cell-teacher {
                    font-size: 11px;
                    color: var(--text-secondary);
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    margin-top: 4px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .hor-cell-avatar {
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: #8b5cf6;
                    color: #fff;
                    font-size: 9px;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .hor-cell-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: auto;
                    padding-top: 4px;
                    border-top: 1px dashed rgba(255,255,255,0.03);
                }
                .hor-cell-time {
                    font-size: 9.5px;
                    color: var(--text-tertiary);
                    font-weight: 600;
                }
                
                /* Badges for rooms */
                .hor-badge-sala {
                    background: var(--primary-50, rgba(139, 92, 246, 0.08));
                    color: var(--primary-500, #8b5cf6);
                    font-size: 9.5px;
                    font-weight: 700;
                    padding: 1.5px 6px;
                    border-radius: 5px;
                    border: 1px solid var(--primary-100, rgba(139, 92, 246, 0.15));
                    max-width: 80px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                /* Cell hover interactions for gestores */
                .hor-grid-td.editable {
                    cursor: pointer;
                }
                .hor-grid-td.editable:hover {
                    background: var(--bg-hover, rgba(255,255,255,0.015));
                }
                .hor-cell-empty-trigger {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    border: 1.5px dashed var(--border-color);
                    border-radius: 10px;
                    color: var(--text-tertiary);
                    font-size: 11px;
                    font-weight: 600;
                    gap: 4px;
                    transition: all 0.2s;
                    opacity: 0;
                }
                .hor-grid-td:hover .hor-cell-empty-trigger {
                    opacity: 1;
                    border-color: var(--primary-400, #a78bfa);
                    color: var(--primary-400, #a78bfa);
                    background: var(--primary-50, rgba(139, 92, 246, 0.02));
                }
                
                /* Mobile Layout Adaptation */
                @media (max-width: 860px) {
                    .hor-grid-card {
                        border: none;
                        background: transparent;
                        box-shadow: none;
                    }
                    .hor-grid-table, .hor-grid-table tbody, .hor-grid-tr {
                        display: block;
                        width: 100%;
                    }
                    .hor-grid-table thead {
                        display: none; /* Hide header columns */
                    }
                    .hor-grid-tr {
                        margin-bottom: 24px;
                        background: var(--surface-2);
                        border: 1px solid var(--border-color);
                        border-radius: 14px;
                        padding: 12px;
                    }
                    .hor-grid-td {
                        display: flex;
                        width: 100% !important;
                        height: auto;
                        border: none;
                        border-bottom: 1px dashed var(--border-color);
                        padding: 10px 4px;
                        align-items: center;
                    }
                    .hor-grid-td:first-child {
                        background: var(--surface-3);
                        border-radius: 8px;
                        padding: 6px 12px;
                        justify-content: center;
                        margin-bottom: 8px;
                        border-bottom: none;
                    }
                    .hor-grid-td:last-child {
                        border-bottom: none;
                    }
                    .hor-grid-td::before {
                        content: attr(data-day);
                        font-size: 11px;
                        font-weight: 700;
                        text-transform: uppercase;
                        color: var(--text-tertiary);
                        width: 90px;
                        flex-shrink: 0;
                    }
                    .hor-grid-td:first-child::before {
                        content: none;
                    }
                    .hor-cell-card {
                        flex: 1;
                        height: 62px;
                        flex-direction: row;
                        align-items: center;
                        padding: 6px 12px;
                    }
                    .hor-cell-empty-trigger {
                        flex: 1;
                        height: 38px;
                        opacity: 0.65;
                    }
                    .hor-cell-footer {
                        border-top: none;
                        margin-top: 0;
                        padding-top: 0;
                        flex-direction: column;
                        align-items: flex-end;
                        gap: 4px;
                    }
                }
            </style>

            <div class="hor-container stagger-children">
                <!-- Header -->
                <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:16px;">
                    <div class="page-header-left">
                        <h1 class="page-title" style="display:flex;align-items:center;gap:10px;">
                            <span style="display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:12px;background:rgba(168,85,247,0.15);color:#a855f7;">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                            </span>
                            Quadro de Horários
                        </h1>
                        <p class="page-subtitle">Organização e consulta de aulas, salas e docentes</p>
                    </div>
                </div>

                <!-- Navigation Tabs -->
                <div class="hor-tabs">
                    <button class="hor-tab ${activeTab === 'turma' ? 'active' : ''}" id="tab-turma" role="tab">Grade por Turma</button>
                    <button class="hor-tab ${activeTab === 'professor' ? 'active' : ''}" id="tab-professor" role="tab">Grade por Professor</button>
                </div>

                <!-- Controls Panel -->
                <div class="hor-controls">
                    <!-- Dynamic select based on tab selection -->
                    <div class="hor-select-group" id="controls-selection">
                        <!-- Filled by JS -->
                    </div>

                    <!-- Print Button -->
                    <button class="btn btn-secondary" id="btn-imprimir-grade" style="gap:6px; display:inline-flex; align-items:center; cursor:pointer; height:38px;">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="6 9 6 2 18 2 18 9"/>
                            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                            <rect x="6" y="14" width="12" height="8"/>
                        </svg>
                        Imprimir / PDF
                    </button>
                </div>

                <!-- Main Schedule View Grid Container -->
                <div id="grid-view-container"></div>
            </div>
        `;

        // Attach tab triggers
        const btnTabTurma = outlet.querySelector('#tab-turma');
        const btnTabProfessor = outlet.querySelector('#tab-professor');

        btnTabTurma.addEventListener('click', () => {
            activeTab = 'turma';
            btnTabTurma.classList.add('active');
            btnTabProfessor.classList.remove('active');
            renderControls();
            renderGridView();
        });

        btnTabProfessor.addEventListener('click', () => {
            activeTab = 'professor';
            btnTabProfessor.classList.add('active');
            btnTabTurma.classList.remove('active');
            renderControls();
            renderGridView();
        });

        // Print trigger
        outlet.querySelector('#btn-imprimir-grade')?.addEventListener('click', () => {
            printSchedule();
        });

        renderControls();
        renderGridView();
        initRipple(outlet);
    }

    function renderControls() {
        const controlsContainer = outlet.querySelector('#controls-selection');
        if (!controlsContainer) return;

        if (activeTab === 'turma') {
            if (allTurmas.length === 0) {
                controlsContainer.innerHTML = `<span style="font-size:13px; color:var(--text-tertiary)">Nenhuma turma cadastrada</span>`;
                return;
            }
            controlsContainer.innerHTML = `
                <label class="form-label" style="margin-bottom:0; font-size:12px; font-weight:700; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.04em;">Filtrar Turma:</label>
                <select class="hor-select" id="select-turma-filter">
                    ${allTurmas.map(t => `<option value="${t.id}" ${t.id === selectedTurmaId ? 'selected' : ''}>${eh(t.nome)}</option>`).join('')}
                </select>
            `;

            controlsContainer.querySelector('#select-turma-filter')?.addEventListener('change', (e) => {
                selectedTurmaId = e.target.value;
                renderGridView();
            });
        } else {
            // Tab is 'professor'
            if (isProfessor) {
                // Teachers see only their name as text label, select is disabled or hidden
                controlsContainer.innerHTML = `
                    <span style="font-size:14px; font-weight:700; color:var(--text-primary);">
                        Quadro Pessoal: <strong>${eh(me.nome)}</strong>
                    </span>
                `;
                selectedProfessorId = me.id;
            } else {
                // Admins see a dropdown of all teachers
                if (allProfs.length === 0) {
                    controlsContainer.innerHTML = `<span style="font-size:13px; color:var(--text-tertiary)">Nenhum professor cadastrado</span>`;
                    return;
                }
                controlsContainer.innerHTML = `
                    <label class="form-label" style="margin-bottom:0; font-size:12px; font-weight:700; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.04em;">Filtrar Docente:</label>
                    <select class="hor-select" id="select-prof-filter">
                        ${allProfs.map(p => `<option value="${p.id}" ${p.id === selectedProfessorId ? 'selected' : ''}>${eh(p.nome)}</option>`).join('')}
                    </select>
                `;

                controlsContainer.querySelector('#select-prof-filter')?.addEventListener('change', (e) => {
                    selectedProfessorId = e.target.value;
                    renderGridView();
                });
            }
        }
    }

    function renderGridView() {
        const gridContainer = outlet.querySelector('#grid-view-container');
        if (!gridContainer) return;

        if (activeTab === 'turma') {
            if (!selectedTurmaId) {
                gridContainer.innerHTML = `
                    <div style="padding:40px; text-align:center; color:var(--text-tertiary)">
                        Nenhuma turma selecionada ou cadastrada ainda.
                    </div>
                `;
                return;
            }
            renderTurmaGrid(gridContainer);
        } else {
            if (!selectedProfessorId) {
                gridContainer.innerHTML = `
                    <div style="padding:40px; text-align:center; color:var(--text-tertiary)">
                        Nenhum docente selecionado ou cadastrado ainda.
                    </div>
                `;
                return;
            }
            renderProfessorGrid(gridContainer);
        }
    }

    // Grid rendering: Class Specific (Interactive for admins)
    function renderTurmaGrid(container) {
        const turma = turmas.getById(selectedTurmaId);
        const scheds = horarios.getAll().filter(h => h.turmaId === selectedTurmaId);

        let rowsHtml = '';
        for (let p = 1; p <= PERIODOS_MAX; p++) {
            let cellsHtml = `
                <td class="hor-grid-td">
                    <div class="hor-period-cell">
                        <span class="hor-period-num">${p}º</span>
                        <span class="hor-period-lbl">Aula</span>
                    </div>
                </td>
            `;

            for (let d = 1; d <= 6; d++) {
                const cellSched = scheds.find(h => Number(h.diaSemana) === d && Number(h.periodo) === p);
                const dayLabel = DIAS_SEMANA.find(day => day.value === d)?.label || '';
                
                if (cellSched) {
                    const disc = disciplinas.getById(cellSched.disciplinaId);
                    const prof = usuarios.getById(cellSched.professorId);
                    const hue = stringToHue(prof?.nome || '?');
                    const initials = getInitials(prof?.nome || '?');

                    const avatarHtml = prof?.foto 
                        ? `<img src="${prof.foto}" class="hor-cell-avatar" style="object-fit:cover;" />`
                        : `<div class="hor-cell-avatar" style="background:hsl(${hue},60%,42%)">${initials}</div>`;

                    cellsHtml += `
                        <td class="hor-grid-td ${isGestor ? 'editable' : ''}" data-day="${dayLabel}" data-day-val="${d}" data-period="${p}" data-sched-id="${cellSched.id}">
                            <div class="hor-cell-card" style="--cell-border-color: hsl(${stringToHue(disc?.nome || 'disc')},65%,45%)">
                                <div class="hor-cell-discipline" title="${eh(disc?.nome || '—')}">${eh(disc?.nome || '—')}</div>
                                <div class="hor-cell-teacher" title="${eh(prof?.nome || '—')}">
                                    ${avatarHtml}
                                    <span>${eh(prof?.nome || '—')}</span>
                                </div>
                                <div class="hor-cell-footer">
                                    <span class="hor-cell-time">${cellSched.horarioInicio || '—'}–${cellSched.horarioFim || '—'}</span>
                                    <span class="hor-badge-sala" title="${eh(cellSched.sala || '—')}">${eh(cellSched.sala || '—')}</span>
                                </div>
                            </div>
                        </td>
                    `;
                } else {
                    cellsHtml += `
                        <td class="hor-grid-td ${isGestor ? 'editable' : ''}" data-day="${dayLabel}" data-day-val="${d}" data-period="${p}" data-sched-id="">
                            ${isGestor ? `
                                <div class="hor-cell-empty-trigger">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                    <span>Agendar</span>
                                </div>
                            ` : `
                                <div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-tertiary);font-size:11px;font-style:italic">Vago</div>
                            `}
                        </td>
                    `;
                }
            }

            rowsHtml += `<tr class="hor-grid-tr">${cellsHtml}</tr>`;
        }

        container.innerHTML = `
            <div class="hor-grid-card">
                <div style="overflow-x: auto;">
                    <table class="hor-grid-table">
                        <thead>
                            <tr>
                                <th class="hor-grid-th">Horário</th>
                                ${DIAS_SEMANA.map(d => `<th class="hor-grid-th">${d.label}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        // Handle cell clicks for managers
        if (isGestor) {
            container.querySelectorAll('.hor-grid-td.editable').forEach(td => {
                td.addEventListener('click', (e) => {
                    // Ignore clicks on inner components if they are not the main cell container
                    const dayVal = td.dataset.dayVal;
                    const period = td.dataset.period;
                    const schedId = td.dataset.schedId;

                    if (dayVal && period) {
                        openScheduleForm(schedId, Number(dayVal), Number(period));
                    }
                });
            });
        }
    }

    // Grid rendering: Teacher Specific (Read-only list/grid)
    function renderProfessorGrid(container) {
        const prof = usuarios.getById(selectedProfessorId);
        const scheds = horarios.getAll().filter(h => h.professorId === selectedProfessorId);

        let rowsHtml = '';
        for (let p = 1; p <= PERIODOS_MAX; p++) {
            let cellsHtml = `
                <td class="hor-grid-td">
                    <div class="hor-period-cell">
                        <span class="hor-period-num">${p}º</span>
                        <span class="hor-period-lbl">Aula</span>
                    </div>
                </td>
            `;

            for (let d = 1; d <= 6; d++) {
                const cellSched = scheds.find(h => Number(h.diaSemana) === d && Number(h.periodo) === p);
                const dayLabel = DIAS_SEMANA.find(day => day.value === d)?.label || '';

                if (cellSched) {
                    const disc = disciplinas.getById(cellSched.disciplinaId);
                    const turma = turmas.getById(cellSched.turmaId);

                    cellsHtml += `
                        <td class="hor-grid-td" data-day="${dayLabel}">
                            <div class="hor-cell-card" style="--cell-border-color: var(--primary-500, #8b5cf6)">
                                <div class="hor-cell-discipline" title="${eh(disc?.nome || '—')}">${eh(disc?.nome || '—')}</div>
                                <div class="hor-cell-teacher" title="${eh(turma?.nome || '—')}">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--text-tertiary)"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                                    <strong style="color:var(--text-primary)">${eh(turma?.nome || '—')}</strong>
                                </div>
                                <div class="hor-cell-footer">
                                    <span class="hor-cell-time">${cellSched.horarioInicio || '—'}–${cellSched.horarioFim || '—'}</span>
                                    <span class="hor-badge-sala" title="${eh(cellSched.sala || '—')}" style="background:var(--danger-50, rgba(239,68,68,0.05)); color:var(--danger-500, #ef4444); border-color:var(--danger-100, rgba(239,68,68,0.15))">
                                        🚪 ${eh(cellSched.sala || '—')}
                                    </span>
                                </div>
                            </div>
                        </td>
                    `;
                } else {
                    cellsHtml += `
                        <td class="hor-grid-td" data-day="${dayLabel}">
                            <div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-tertiary);font-size:11px;font-style:italic">Livre</div>
                        </td>
                    `;
                }
            }

            rowsHtml += `<tr class="hor-grid-tr">${cellsHtml}</tr>`;
        }

        container.innerHTML = `
            <div class="hor-grid-card">
                <div style="overflow-x: auto;">
                    <table class="hor-grid-table">
                        <thead>
                            <tr>
                                <th class="hor-grid-th">Horário</th>
                                ${DIAS_SEMANA.map(d => `<th class="hor-grid-th">${d.label}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    // Modal forms: Admin Add/Edit schedule slot
    function openScheduleForm(schedId, dayVal, periodNum) {
        const sched = schedId ? horarios.getById(schedId) : null;
        const isEdit = !!sched;

        const currentTurma = turmas.getById(selectedTurmaId);
        const dayObj = DIAS_SEMANA.find(d => d.value === dayVal);

        // Fetch valid disciplines for the course of this class
        let validDisciplines = [];
        if (currentTurma) {
            validDisciplines = disciplinas.getAll()
                .filter(d => d.cursoId === currentTurma.cursoId)
                .sort((a,b) => a.nome.localeCompare(b.nome));
        }

        // Fetch all teachers, separate specialists from non-specialists based on current discipline
        const listTeachers = usuarios.getAll()
            .filter(u => u.role === 'professor')
            .sort((a,b) => a.nome.localeCompare(b.nome));

        // Helper to build teacher options grouped by specialty
        function buildTeacherOptions(discId, selectedProfId) {
            const specialists = listTeachers.filter(p => Array.isArray(p.disciplinas) && p.disciplinas.includes(discId));
            const others = listTeachers.filter(p => !(Array.isArray(p.disciplinas) && p.disciplinas.includes(discId)));

            let html = `<option value="">Selecione o Professor...</option>`;
            if (specialists.length > 0) {
                html += `<optgroup label="✅ Especialistas nesta disciplina">`;
                specialists.forEach(p => {
                    html += `<option value="${p.id}" ${selectedProfId === p.id ? 'selected' : ''}>${eh(p.nome)}</option>`;
                });
                html += `</optgroup>`;
            }
            if (others.length > 0) {
                html += `<optgroup label="⚠️ Outros professores (não vinculados)">`;
                others.forEach(p => {
                    html += `<option value="${p.id}" ${selectedProfId === p.id ? 'selected' : ''}>${eh(p.nome)}</option>`;
                });
                html += `</optgroup>`;
            }
            return html;
        }

        const initialDiscId = sched?.disciplinaId || '';
        const initialProfId = sched?.professorId || '';
        const initialIsSpecialist = initialDiscId && initialProfId
            ? listTeachers.find(p => p.id === initialProfId && Array.isArray(p.disciplinas) && p.disciplinas.includes(initialDiscId))
            : true; // no selection = no warning

        const body = `
            <form id="horario-form" novalidate autocomplete="off" style="display:flex; flex-direction:column; gap:16px;">
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; background:var(--surface-3); padding:10px 14px; border-radius:10px; font-size:12.5px; border:1px solid var(--border-color)">
                    <div><strong>Turma:</strong> ${eh(currentTurma?.nome || '—')}</div>
                    <div><strong>Dia:</strong> ${eh(dayObj?.label || '—')}</div>
                    <div><strong>Período:</strong> ${periodNum}ª Aula</div>
                </div>

                <div class="form-group">
                    <label class="form-label" for="h-disciplina">Disciplina <span class="required">*</span></label>
                    <select class="form-control" id="h-disciplina" name="disciplinaId" required style="height:42px;">
                        <option value="">Selecione a Disciplina...</option>
                        ${validDisciplines.map(d => `<option value="${d.id}" ${sched?.disciplinaId === d.id ? 'selected' : ''}>${eh(d.nome)} (${d.codigo || 'S/C'})</option>`).join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label" for="h-professor">Professor Docente <span class="required">*</span></label>
                    <select class="form-control" id="h-professor" name="professorId" required style="height:42px;">
                        ${initialDiscId ? buildTeacherOptions(initialDiscId, initialProfId) : `<option value="">Selecione a disciplina primeiro</option>${listTeachers.map(p => `<option value="${p.id}" ${initialProfId === p.id ? 'selected' : ''}>${eh(p.nome)}</option>`).join('')}`}
                    </select>
                    <span class="form-help" style="font-size:10px;">Professores <strong>especialistas</strong> estão vinculados à disciplina no perfil deles.</span>
                </div>

                <div id="warn-non-specialist" style="display:${initialDiscId && initialProfId && !initialIsSpecialist ? 'flex' : 'none'}; align-items:flex-start; gap:10px; padding:10px 14px; background:rgba(251,191,36,0.1); border:1px solid rgba(251,191,36,0.4); border-radius:10px; font-size:12px; color:var(--text-primary);">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" style="flex-shrink:0;margin-top:1px"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    <div><strong>Atenção:</strong> O professor selecionado <strong>não está vinculado</strong> a esta disciplina no seu perfil. Isso pode impedir que ele visualize a disciplina na chamada e no lançamento de notas. Vincule a disciplina ao professor em <em>Professores → Editar Perfil</em>, ou confirme que esta é uma substituição temporária.</div>
                </div>

                <div class="form-grid" style="grid-template-columns:1fr 1fr; gap:12px;">
                    <div class="form-group">
                        <label class="form-label" for="h-sala">Sala de Aula / Local <span class="required">*</span></label>
                        <input class="form-control" id="h-sala" name="sala" type="text" placeholder="Ex: Sala 102, Lab B..." value="${eh(sched?.sala || '')}" required style="height:38px;" />
                    </div>
                    <div class="form-group" style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
                        <div>
                            <label class="form-label" for="h-inicio" style="font-size:11px;">Hora Início</label>
                            <input class="form-control" id="h-inicio" name="horarioInicio" type="time" value="${sched?.horarioInicio || ''}" style="height:38px; padding:0 8px;" />
                        </div>
                        <div>
                            <label class="form-label" for="h-fim" style="font-size:11px;">Hora Fim</label>
                            <input class="form-control" id="h-fim" name="horarioFim" type="time" value="${sched?.horarioFim || ''}" style="height:38px; padding:0 8px;" />
                        </div>
                    </div>
                </div>
            </form>
        `;

        const footer = `
            ${isEdit ? `<button class="btn btn-ghost" id="m-delete-sched" style="color:var(--danger-500); margin-right:auto;">Remover Horário</button>` : ''}
            <button class="btn btn-ghost" id="m-cancel-sched">Cancelar</button>
            <button class="btn btn-primary" id="m-save-sched" style="background:#a855f7; border-color:#a855f7;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Salvar Horário
            </button>
        `;

        modal.open({
            title: isEdit ? 'Editar Atribuição de Horário' : 'Agendar Novo Horário',
            icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
            body,
            footer,
            size: 'md'
        });

        const mShadow = modal.shadowRoot;

        // Auto filter teachers based on selected discipline (Enhancement)
        const selectDisc = mShadow.getElementById('h-disciplina');
        const selectProf = mShadow.getElementById('h-professor');
        
        const warnEl = mShadow.getElementById('warn-non-specialist');

        function updateNonSpecialistWarning() {
            const discId = selectDisc.value;
            const profId = selectProf.value;
            if (!discId || !profId) {
                if (warnEl) warnEl.style.display = 'none';
                return;
            }
            const selectedProf = listTeachers.find(p => p.id === profId);
            const isSpecialist = selectedProf && Array.isArray(selectedProf.disciplinas) && selectedProf.disciplinas.includes(discId);
            if (warnEl) warnEl.style.display = isSpecialist ? 'none' : 'flex';
        }

        selectDisc?.addEventListener('change', () => {
            const discId = selectDisc.value;

            // Rebuild teacher select with optgroups based on new discipline
            if (discId) {
                const currentProf = selectProf.value;
                selectProf.innerHTML = buildTeacherOptions(discId, currentProf);
                // Restore previous selection if possible
                if (currentProf) selectProf.value = currentProf;
            } else {
                selectProf.innerHTML = `<option value="">Selecione a disciplina primeiro</option>` +
                    listTeachers.map(p => `<option value="${p.id}">${eh(p.nome)}</option>`).join('');
            }

            updateNonSpecialistWarning();
        });

        selectProf?.addEventListener('change', () => {
            updateNonSpecialistWarning();
        });

        // Cancel hook
        mShadow.getElementById('m-cancel-sched')?.addEventListener('click', () => modal.close());

        // Delete hook
        mShadow.getElementById('m-delete-sched')?.addEventListener('click', async () => {
            const confirmed = await showConfirm(modal, {
                title: 'Remover Horário',
                message: `Deseja realmente desvincular e remover a aula deste período?`,
                confirmText: 'Remover',
                type: 'danger'
            });
            if (!confirmed) return;

            horarios.delete(schedId);
            if (isSyncUser() && typeof firebase !== 'undefined' && firebase.firestore) {
                triggerCloudSync(KEYS.horarios, horarios.getAll());
            }

            addLog('DELETE', 'Horário', { turma: currentTurma?.nome, dia: dayObj?.label, periodo: periodNum });
            window.toast?.success('Horário liberado!', 'A aula foi removida com sucesso.');
            modal.close();
            renderGridView();
        });

        // Save hook
        mShadow.getElementById('m-save-sched')?.addEventListener('click', async () => {
            const data = modal.getFormData('#horario-form');

            if (!data.disciplinaId || !data.professorId || !data.sala?.trim()) {
                window.toast?.error('Campos obrigatórios', 'Por favor, preencha a disciplina, o professor e a sala.');
                return;
            }

            // Helper: check if two time intervals overlap (strings "HH:MM")
            function timesOverlap(s1, e1, s2, e2) {
                // If any time is missing, skip the time overlap check (allow by period only)
                if (!s1 || !e1 || !s2 || !e2) return false;
                // Convert "HH:MM" to minutes for easy comparison
                const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
                return toMin(s1) < toMin(e2) && toMin(s2) < toMin(e1);
            }

            const newStart = data.horarioInicio || '';
            const newEnd   = data.horarioFim   || '';

            // Conflict Check 1: Professor availability (same period OR overlapping time on same day)
            const conflictProf = horarios.getAll().find(h =>
                h.id !== schedId &&
                h.professorId === data.professorId &&
                Number(h.diaSemana) === dayVal &&
                (
                    Number(h.periodo) === periodNum ||
                    timesOverlap(newStart, newEnd, h.horarioInicio, h.horarioFim)
                )
            );
            if (conflictProf) {
                const otherTurma = turmas.getById(conflictProf.turmaId);
                const timeInfo = conflictProf.horarioInicio ? ` (${conflictProf.horarioInicio}–${conflictProf.horarioFim})` : '';
                window.toast?.error('Conflito de Professor', `O professor selecionado já tem aula na turma "${otherTurma?.nome || 'Outra'}" — Sala ${conflictProf.sala}${timeInfo} — neste dia. Os horários se sobrepõem.`);
                return;
            }

            // Normalize room name for robust comparison (collapse spaces, lowercase, remove accents)
            function normalizeRoom(s) {
                return s.trim().toLowerCase()
                    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                    .replace(/\s+/g, ' ');
            }

            // Conflict Check 2: Sala availability (same period OR overlapping time on same day)
            const conflictSala = horarios.getAll().find(h =>
                h.id !== schedId &&
                normalizeRoom(h.sala || '') === normalizeRoom(data.sala) &&
                Number(h.diaSemana) === dayVal &&
                (
                    Number(h.periodo) === periodNum ||
                    timesOverlap(newStart, newEnd, h.horarioInicio, h.horarioFim)
                )
            );
            if (conflictSala) {
                const otherTurma = turmas.getById(conflictSala.turmaId);
                const timeInfo = conflictSala.horarioInicio ? ` (${conflictSala.horarioInicio}–${conflictSala.horarioFim})` : '';
                window.toast?.error('Conflito de Sala', `A sala "${data.sala}" já está ocupada pela turma "${otherTurma?.nome || 'Outra'}"${timeInfo} neste dia. Os horários se sobrepõem.`);
                return;
            }

            // Conflict Check 3: Same turma, same day, same period OR overlapping time
            const conflictTurma = horarios.getAll().find(h =>
                h.id !== schedId &&
                h.turmaId === selectedTurmaId &&
                Number(h.diaSemana) === dayVal &&
                (
                    Number(h.periodo) === periodNum ||
                    timesOverlap(newStart, newEnd, h.horarioInicio, h.horarioFim)
                )
            );
            if (conflictTurma) {
                const conflictDisc = disciplinas.getById(conflictTurma.disciplinaId);
                const timeInfo = conflictTurma.horarioInicio ? ` (${conflictTurma.horarioInicio}–${conflictTurma.horarioFim})` : '';
                window.toast?.error('Conflito de Turma', `Esta turma já possui "${conflictDisc?.nome || 'uma disciplina'}"${timeInfo} cadastrada neste dia com horário sobreposto.`);
                return;
            }

            // Specialist Warning: selected teacher is not assigned to this discipline
            const selectedProfObj = listTeachers.find(p => p.id === data.professorId);
            const isSpecialist = selectedProfObj && Array.isArray(selectedProfObj.disciplinas) && selectedProfObj.disciplinas.includes(data.disciplinaId);
            if (!isSpecialist) {
                const discObj = disciplinas.getById(data.disciplinaId);
                const confirmed = await showConfirm(modal, {
                    title: 'Professor Não Vinculado',
                    message: `O professor <strong>${eh(selectedProfObj?.nome || '—')}</strong> não está vinculado à disciplina <strong>${eh(discObj?.nome || '—')}</strong>.<br/><br/>Isso pode impedir que ele visualize esta disciplina na <strong>chamada</strong> e no <strong>lançamento de notas</strong>.<br/><br/><small style="color:var(--text-secondary)">Deseja prosseguir mesmo assim? (Ex: substituição temporária)</small>`,
                    confirmText: 'Sim, Prosseguir',
                    cancelText: 'Cancelar',
                    type: 'warning'
                });
                if (!confirmed) return;
            }

            const resolvedEntry = {
                turmaId: selectedTurmaId,
                diaSemana: dayVal,
                periodo: periodNum,
                disciplinaId: data.disciplinaId,
                professorId: data.professorId,
                sala: data.sala.trim(),
                horarioInicio: data.horarioInicio || '',
                horarioFim: data.horarioFim || ''
            };

            if (isEdit) {
                horarios.update(schedId, resolvedEntry);
                addLog('UPDATE', 'Horário', { turma: currentTurma?.nome, dia: dayObj?.label, periodo: periodNum });
            } else {
                horarios.create(resolvedEntry);
                addLog('CREATE', 'Horário', { turma: currentTurma?.nome, dia: dayObj?.label, periodo: periodNum });
            }

            if (isSyncUser() && typeof firebase !== 'undefined' && firebase.firestore) {
                triggerCloudSync(KEYS.horarios, horarios.getAll());
            }

            window.toast?.success('Quadro atualizado!', 'O horário foi salvo com sucesso.');
            modal.close();
            renderGridView();
        });
    }

    // Print schedules template
    function printSchedule() {
        const isTurmaTab = activeTab === 'turma';
        let title = '';
        let headerSub = '';
        let matrix = [];

        if (isTurmaTab) {
            const turma = turmas.getById(selectedTurmaId);
            const curso = turma ? cursos.getById(turma.cursoId) : null;
            title = `Quadro de Horários — Turma: ${turma?.nome || 'Sem Nome'}`;
            headerSub = `Curso: ${curso?.nome || 'Geral'}  |  Ano Letivo: ${auth.currentUser() ? auth.currentUser().anoLetivo || new Date().getFullYear() : new Date().getFullYear()}`;

            const scheds = horarios.getAll().filter(h => h.turmaId === selectedTurmaId);
            for (let p = 1; p <= PERIODOS_MAX; p++) {
                const row = { periodo: `${p}º Horário`, days: [] };
                for (let d = 1; d <= 6; d++) {
                    const h = scheds.find(s => Number(s.diaSemana) === d && Number(s.periodo) === p);
                    if (h) {
                        const disc = disciplinas.getById(h.disciplinaId);
                        const prof = usuarios.getById(h.professorId);
                        row.days.push(`<strong>${eh(disc?.nome || '—')}</strong><br><span style="font-size:11px;color:#4b5563">${eh(prof?.nome || '—')}</span><br><span style="font-size:10px;background:#f3f4f6;padding:1px 5px;border-radius:4px;font-weight:bold">${eh(h.sala || '—')}</span>`);
                    } else {
                        row.days.push('<span style="color:#9ca3af;font-style:italic">Vago</span>');
                    }
                }
                matrix.push(row);
            }
        } else {
            const prof = usuarios.getById(selectedProfessorId);
            title = `Grade de Aulas — Docente: ${prof?.nome || 'Sem Nome'}`;
            headerSub = `E-mail: ${prof?.email || '—'}  |  Ano Letivo: ${new Date().getFullYear()}`;

            const scheds = horarios.getAll().filter(h => h.professorId === selectedProfessorId);
            for (let p = 1; p <= PERIODOS_MAX; p++) {
                const row = { periodo: `${p}º Horário`, days: [] };
                for (let d = 1; d <= 6; d++) {
                    const h = scheds.find(s => Number(s.diaSemana) === d && Number(s.periodo) === p);
                    if (h) {
                        const disc = disciplinas.getById(h.disciplinaId);
                        const turma = turmas.getById(h.turmaId);
                        row.days.push(`<strong>${eh(disc?.nome || '—')}</strong><br><span style="font-size:11px;color:#4b5563">Turma: ${eh(turma?.nome || '—')}</span><br><span style="font-size:10px;background:#fee2e2;color:#991b1b;padding:1px 5px;border-radius:4px;font-weight:bold">🚪 ${eh(h.sala || '—')}</span>`);
                    } else {
                        row.days.push('<span style="color:#9ca3af;font-style:italic">Livre</span>');
                    }
                }
                matrix.push(row);
            }
        }

        const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<title>${title}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #111; padding: 30px; }
  h1 { font-size: 20px; font-weight: 700; color: #1e1b4b; margin-bottom: 4px; }
  .subtitle { font-size: 12px; color: #6b7280; margin-bottom: 24px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  th { background: #f3f4f6; padding: 10px; text-align: center; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #4b5563; border: 1px solid #d1d5db; }
  td { padding: 12px 10px; text-align: center; border: 1px solid #d1d5db; height: 90px; vertical-align: top; }
  td:first-child, th:first-child { width: 100px; font-weight: bold; background: #fafafa; vertical-align: middle; }
  @media print { body { padding: 10px; } @page { margin: 10mm; } }
</style>
</head>
<body>
  <h1>${title}</h1>
  <div class="subtitle">${headerSub} — Emitido pelo EduPresença em ${new Date().toLocaleDateString('pt-BR')}</div>
  
  <table>
    <thead>
      <tr>
        <th>Horário</th>
        ${DIAS_SEMANA.map(d => `<th>${d.label}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${matrix.map(row => `
        <tr>
          <td>${row.periodo}</td>
          ${row.days.map(d => `<td>${d}</td>`).join('')}
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 500); }<\/script>
</body>
</html>`;

        const win = window.open('', '_blank', 'width=950,height=750');
        if (win) {
            win.document.write(html);
            win.document.close();
        } else {
            window.toast?.warning('Pop-up bloqueado', 'Por favor, autorize pop-ups para gerar a impressão.');
        }
    }

    // Run Initializer
    initPage();
}
