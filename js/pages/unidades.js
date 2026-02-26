// EduPresença v2 – Unidades Page (with text filter)
import { buildCrudPage } from './crud.js';
import { unidades } from '../store.js';
import { escapeHtml } from '../utils.js';

export function render(outlet) {
    buildCrudPage(outlet, {
        title: 'Unidades Educacionais',
        subtitle: 'Escolas e centros de ensino cadastrados no sistema',
        store: unidades,
        modalTitle: 'Unidade',
        emptyIcon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`,
        emptyStateMessage: 'Nenhuma unidade educacional cadastrada.',
        emptyStateCTA: 'Cadastre as escolas ou centros de ensino da sua rede. As unidades são necessárias para criar turmas.',
        searchPlaceholder: 'Buscar por nome, diretor ou endereço...',
        columns: [
            { label: 'Nome', key: 'nome', render: (v) => `<strong>${escapeHtml(v)}</strong>` },
            { label: 'Diretor(a)', key: 'diretor', render: (v) => escapeHtml(v || '—') },
            { label: 'Endereço', key: 'endereco', render: (v) => `<span style="color:var(--text-secondary);font-size:12px">${escapeHtml(v || '—')}</span>` },
            { label: 'Telefone', key: 'telefone', render: (v) => escapeHtml(v || '—') },
        ],
        formFields: [
            { name: 'nome', label: 'Nome da Unidade', placeholder: 'Ex: Escola Estadual Prof. João Silva', required: true, full: true },
            { name: 'diretor', label: 'Diretor(a)', placeholder: 'Nome do diretor(a)', required: true },
            { name: 'telefone', label: 'Telefone', type: 'tel', placeholder: '(11) 3456-7890' },
            { name: 'endereco', label: 'Endereço completo', type: 'textarea', full: true, placeholder: 'Rua, número, bairro, cidade, CEP...' },
        ],
    });
}
