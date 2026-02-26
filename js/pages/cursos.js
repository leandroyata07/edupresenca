// EduPresença v2 – Cursos Page (with text filter)
import { buildCrudPage } from './crud.js';
import { cursos } from '../store.js';
import { escapeHtml } from '../utils.js';

export function render(outlet) {
    buildCrudPage(outlet, {
        title: 'Cursos',
        subtitle: 'Gerencie os cursos oferecidos pela instituição',
        store: cursos,
        modalTitle: 'Curso',
        emptyIcon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
        emptyStateMessage: 'Nenhum curso cadastrado ainda.',
        emptyStateCTA: 'Crie os cursos oferecidos pela instituição antes de cadastrar turmas e disciplinas.',
        searchPlaceholder: 'Buscar curso por nome ou descrição...',
        columns: [
            { label: 'Nome', key: 'nome', render: (v) => `<strong>${escapeHtml(v)}</strong>` },
            { label: 'Descrição', key: 'descricao', render: (v) => `<span style="color:var(--text-secondary);font-size:12px">${escapeHtml(v || '—')}</span>` },
            { label: 'Carga Horária', key: 'cargaHoraria', render: (v) => v ? `${v}h` : '—' },
            {
                label: 'Disciplinas', key: 'disciplinas', render: (v) => {
                    const discs = (v || '').split(',').map(s => s.trim()).filter(Boolean);
                    return discs.slice(0, 3).map(d => `<span class="badge badge-neutral" style="margin-right:4px">${escapeHtml(d)}</span>`).join('')
                        + (discs.length > 3 ? `<span class="badge badge-neutral">+${discs.length - 3}</span>` : '');
                }
            },
        ],
        formFields: [
            { name: 'nome', label: 'Nome do Curso', placeholder: 'Ex: Ensino Médio Regular', required: true },
            { name: 'cargaHoraria', label: 'Carga Horária (horas)', type: 'number', placeholder: '1000', min: 1 },
            { name: 'descricao', label: 'Descrição', type: 'textarea', full: true, placeholder: 'Descrição do curso...' },
            { name: 'disciplinas', label: 'Disciplinas (separadas por vírgula)', type: 'textarea', full: true, placeholder: 'Português, Matemática, Física...', help: 'Separe as disciplinas por vírgula.' },
        ],
    });
}
