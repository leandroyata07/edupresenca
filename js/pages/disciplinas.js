// EduPresença v2 – Disciplinas Page (with filters: text + curso)
import { buildCrudPage } from './crud.js';
import { disciplinas, cursos } from '../store.js';
import { escapeHtml } from '../utils.js';

export function render(outlet) {
    const allCursos = cursos.getAll().sort((a, b) => a.nome.localeCompare(b.nome));

    buildCrudPage(outlet, {
        title: 'Disciplinas',
        subtitle: 'Gerencie as disciplinas, configurações de avaliação e médias',
        store: disciplinas,
        modalTitle: 'Disciplina',
        emptyIcon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
        emptyStateMessage: 'Nenhuma disciplina cadastrada ainda.',
        emptyStateCTA: 'Cadastre as disciplinas vinculadas a cada curso. Elas são usadas no lançamento de notas.',
        searchPlaceholder: 'Buscar disciplina por nome ou código...',
        filterSelects: [
            {
                name: 'cursoId',
                label: 'Curso',
                options: allCursos.map(c => ({ value: c.id, label: c.nome })),
            },
        ],
        columns: [
            {
                label: 'Código',
                key: 'codigo',
                render: (v) => `<span class="badge badge-neutral">${escapeHtml(v || '—')}</span>`
            },
            {
                label: 'Nome',
                key: 'nome',
                render: (v) => `<strong>${escapeHtml(v)}</strong>`
            },
            {
                label: 'Curso',
                key: 'cursoId',
                render: (v) => {
                    const curso = cursos.getById(v);
                    return curso ? `<span style="color:var(--text-secondary);font-size:12px">${escapeHtml(curso.nome)}</span>` : '—';
                }
            },
            {
                label: 'Carga Horária',
                key: 'cargaHoraria',
                render: (v) => v ? `${v}h` : '—'
            },
            {
                label: 'Média',
                key: 'mediaAprovacao',
                render: (v) => v ? `<span class="badge badge-success">${v}</span>` : '—'
            },
        ],
        formFields: [
            {
                name: 'codigo',
                label: 'Código da Disciplina',
                placeholder: 'Ex: MAT01',
                required: true,
                help: 'Código único para identificar a disciplina'
            },
            {
                name: 'nome',
                label: 'Nome da Disciplina',
                placeholder: 'Ex: Matemática I',
                required: true
            },
            {
                name: 'cursoId',
                label: 'Curso',
                type: 'select',
                required: true,
                options: allCursos.map(c => ({ value: c.id, label: c.nome })),
                help: 'Curso ao qual esta disciplina pertence'
            },
            {
                name: 'cargaHoraria',
                label: 'Carga Horária (horas)',
                type: 'number',
                placeholder: '60',
                min: 1,
                required: true
            },
            {
                name: 'professor',
                label: 'Professor Responsável',
                placeholder: 'Nome do professor',
                help: 'Professor principal da disciplina (opcional)'
            },
            {
                name: 'descricao',
                label: 'Descrição',
                type: 'textarea',
                full: true,
                placeholder: 'Ementa e objetivos da disciplina...',
                rows: 3
            },
            {
                name: 'mediaAprovacao',
                label: 'Média para Aprovação',
                type: 'number',
                placeholder: '7.0',
                min: 0,
                max: 10,
                step: 0.5,
                required: true,
                help: 'Nota mínima para aprovação (0 a 10)'
            },
            {
                name: 'qtdAvaliacoes',
                label: 'Avaliações por Período',
                type: 'number',
                placeholder: '2',
                min: 1,
                max: 10,
                value: 2,
                help: 'Número de notas/avaliações por bimestre/trimestre'
            },
            {
                name: 'tipoCalculo',
                label: 'Tipo de Cálculo da Média',
                type: 'select',
                required: true,
                options: [
                    { value: 'simples', label: 'Média Simples (todas notas mesmo peso)' },
                    { value: 'ponderada', label: 'Média Ponderada (pesos diferentes)' },
                    { value: 'somaPontos', label: 'Soma de Pontos (acumula até limite)' }
                ],
                help: 'Como será calculada a média das avaliações'
            },
            {
                name: 'pesos',
                label: 'Pesos das Avaliações (separados por vírgula)',
                placeholder: 'Ex: 3,7 ou 1,1,2',
                full: true,
                help: 'Use apenas se escolheu Média Ponderada. Ex: "3,7" para 30% e 70%'
            },
            {
                name: 'permiteSeminarios',
                label: 'Permite Seminários/Trabalhos',
                type: 'select',
                options: [
                    { value: 'sim', label: 'Sim' },
                    { value: 'nao', label: 'Não' }
                ],
                help: 'Se a disciplina aceita notas de seminários ou trabalhos'
            },
            {
                name: 'pesoSeminarios',
                label: 'Peso dos Seminários na Média (%)',
                type: 'number',
                placeholder: '20',
                min: 0,
                max: 100,
                help: 'Percentual que seminários representam na média final'
            },
        ],
    });
}
