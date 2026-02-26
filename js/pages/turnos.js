// EduPresença v2 – Turnos Page (with text filter)
import { buildCrudPage } from './crud.js';
import { turnos } from '../store.js';
import { escapeHtml } from '../utils.js';

export function render(outlet) {
    buildCrudPage(outlet, {
        title: 'Turnos',
        subtitle: 'Gerencie os turnos de funcionamento das aulas',
        store: turnos,
        modalTitle: 'Turno',
        emptyIcon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
        emptyStateMessage: 'Nenhum turno cadastrado ainda.',
        emptyStateCTA: 'Cadastre os turnos de funcionamento (Manhã, Tarde, Noite, etc.) antes de criar turmas.',
        searchPlaceholder: 'Buscar turno por nome...',
        columns: [
            {
                label: 'Nome', key: 'nome', render: (v) => {
                    const colorMap = { manhã: 'warning', tarde: 'orange', noite: 'primary' };
                    const color = colorMap[v?.toLowerCase()] || 'neutral';
                    return `<span class="badge badge-${color}">${escapeHtml(v)}</span>`;
                }
            },
            { label: 'Início', key: 'inicio', render: (v) => v || '—' },
            { label: 'Fim', key: 'fim', render: (v) => v || '—' },
            {
                label: 'Duração', key: 'inicio', sortable: false, render: (_, row) => {
                    if (!row.inicio || !row.fim) return '—';
                    const [h1, m1] = row.inicio.split(':').map(Number);
                    const [h2, m2] = row.fim.split(':').map(Number);
                    const mins = (h2 * 60 + m2) - (h1 * 60 + m1);
                    if (mins <= 0) return '—';
                    const h = Math.floor(mins / 60);
                    const m = mins % 60;
                    return `${h}h${m ? m + 'min' : ''}`;
                }
            },
        ],
        formFields: [
            { name: 'nome', label: 'Nome do Turno', placeholder: 'Ex: Manhã', required: true, help: 'Ex: Manhã, Tarde, Noite, Integral...' },
            { name: 'inicio', label: 'Horário de Início', type: 'time', required: true },
            { name: 'fim', label: 'Horário de Fim', type: 'time', required: true },
        ],
    });
}
