// EduPresença v2 – Turmas Page (with filters)
import { buildCrudPage } from './crud.js';
import { turmas, cursos, unidades, turnos, alunos } from '../store.js';
import { escapeHtml } from '../utils.js';

export function render(outlet) {
    const allCursos = cursos.getAll().sort((a, b) => a.nome.localeCompare(b.nome));
    const allUnidades = unidades.getAll().sort((a, b) => a.nome.localeCompare(b.nome));
    const allTurnos = turnos.getAll().sort((a, b) => a.nome.localeCompare(b.nome));

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 6 }, (_, i) => currentYear - 1 + i);

    buildCrudPage(outlet, {
        title: 'Turmas',
        subtitle: 'Gerencie as turmas e suas alocações de alunos',
        store: turmas,
        modalTitle: 'Turma',
        emptyIcon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
        emptyStateMessage: 'Nenhuma turma cadastrada ainda.',
        emptyStateCTA: 'Comece criando a primeira turma. Você precisará ter Cursos, Unidades e Turnos cadastrados primeiro.',
        searchPlaceholder: 'Buscar turma por nome ou ano...',
        filterSelects: [
            {
                name: 'cursoId',
                label: 'Curso',
                options: allCursos.map(c => ({ value: c.id, label: c.nome })),
            },
            {
                name: 'unidadeId',
                label: 'Unidade',
                options: allUnidades.map(u => ({ value: u.id, label: u.nome.split(' ').slice(0, 3).join(' ') })),
            },
            {
                name: 'turnoId',
                label: 'Turno',
                options: allTurnos.map(t => ({ value: t.id, label: t.nome })),
            },
            {
                name: 'anoLetivo',
                label: 'Ano Letivo',
                options: years.map(y => ({ value: String(y), label: String(y) })),
            },
        ],
        columns: [
            { label: 'Turma', key: 'nome', render: (v) => `<strong>${escapeHtml(v)}</strong>` },
            { label: 'Curso', key: 'cursoId', render: (v) => { const c = allCursos.find(c => c.id === v); return c ? `<span class="badge badge-primary">${escapeHtml(c.nome)}</span>` : '—'; } },
            { label: 'Unidade', key: 'unidadeId', render: (v) => { const u = allUnidades.find(u => u.id === v); return escapeHtml(u?.nome?.split(' ').slice(0, 3).join(' ') || '—'); } },
            { label: 'Turno', key: 'turnoId', render: (v) => { const t = allTurnos.find(t => t.id === v); return t ? `<span class="badge badge-info">${escapeHtml(t.nome)}</span>` : '—'; } },
            {
                label: 'Alunos', key: 'id', render: (id) => {
                    const count = alunos.getAll().filter(a => a.turmaId === id).length;
                    const turma = turmas.getById(id);
                    const cap = turma?.capacidade || 0;
                    const pct = cap ? Math.round((count / cap) * 100) : 0;
                    return `<span style="color:${pct > 90 ? 'var(--danger-400)' : 'var(--text-primary)'}"><strong>${count}</strong>${cap ? `/${cap}` : ''}</span>`;
                }
            },
            { label: 'Ano', key: 'anoLetivo' },
        ],
        formFields: [
            { name: 'nome', label: 'Nome da Turma', placeholder: 'Ex: 9º Ano A', required: true },
            { name: 'anoLetivo', label: 'Ano Letivo', type: 'number', placeholder: String(currentYear), required: true, min: 2000, max: 2100 },
            { name: 'cursoId', label: 'Curso', type: 'select', required: true, options: allCursos.map(c => ({ value: c.id, label: c.nome })) },
            { name: 'unidadeId', label: 'Unidade', type: 'select', required: true, options: allUnidades.map(u => ({ value: u.id, label: u.nome })) },
            { name: 'turnoId', label: 'Turno', type: 'select', required: true, options: allTurnos.map(t => ({ value: t.id, label: `${t.nome} (${t.inicio}–${t.fim})` })) },
            { name: 'capacidade', label: 'Capacidade (vagas)', type: 'number', placeholder: '40', min: 1, max: 100 },
        ],
    });
}
