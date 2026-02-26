// =========================================================
// EduPresença – Global Search Palette (Ctrl+K)
// =========================================================
import { alunos, turmas } from '../store.js';
import { escapeHtml } from '../utils.js';

const PAGES = [
    { path: '/',              label: 'Dashboard',     subtitle: 'Visão geral do sistema',    icon: 'home' },
    { path: '/alunos',        label: 'Alunos',         subtitle: 'Gerenciar alunos',          icon: 'users' },
    { path: '/turmas',        label: 'Turmas',          subtitle: 'Gerenciar turmas',          icon: 'layers' },
    { path: '/cursos',        label: 'Cursos',          subtitle: 'Gerenciar cursos',          icon: 'book' },
    { path: '/disciplinas',   label: 'Disciplinas',     subtitle: 'Gerenciar disciplinas',     icon: 'bookmark' },
    { path: '/unidades',      label: 'Unidades',        subtitle: 'Gerenciar unidades',        icon: 'building' },
    { path: '/turnos',        label: 'Turnos',          subtitle: 'Gerenciar turnos',          icon: 'clock' },
    { path: '/presenca',      label: 'Presença',        subtitle: 'Registrar presença',        icon: 'check' },
    { path: '/notas',         label: 'Notas',           subtitle: 'Lançar notas',              icon: 'edit' },
    { path: '/relatorios',    label: 'Relatórios',      subtitle: 'Visualizar relatórios',     icon: 'chart' },
    { path: '/configuracoes', label: 'Configurações',   subtitle: 'Configurar o sistema',     icon: 'settings' },
    { path: '/informacoes',   label: 'Informações',     subtitle: 'Sobre o EduPresença',       icon: 'info' },
];

const ICONS = {
    home:     `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    users:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    layers:   `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`,
    book:     `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
    bookmark: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`,
    building: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
    clock:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    check:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
    edit:     `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
    chart:    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>`,
    settings: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
    info:     `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    person:   `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
};

export function initSearch() {
    // ── Styles ────────────────────────────────────────────
    const style = document.createElement('style');
    style.textContent = `
        #search-palette {
            display: none;
            position: fixed;
            inset: 0;
            z-index: 9999;
            align-items: flex-start;
            justify-content: center;
            padding-top: 12vh;
        }
        #search-palette.open { display: flex; }
        .sp-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.55);
            backdrop-filter: blur(3px);
        }
        .sp-dialog {
            position: relative;
            z-index: 1;
            width: min(600px, 90vw);
            background: var(--surface-2, #1e293b);
            border: 1px solid var(--border-color, rgba(255,255,255,0.1));
            border-radius: 16px;
            box-shadow: 0 24px 80px rgba(0,0,0,0.5);
            overflow: hidden;
            animation: sp-in .15s ease;
        }
        @keyframes sp-in {
            from { opacity:0; transform: translateY(-12px) scale(0.97); }
            to   { opacity:1; transform: translateY(0) scale(1); }
        }
        .sp-input-wrap {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 14px 18px;
            border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.08));
        }
        .sp-input-wrap > svg { color: var(--text-tertiary, #64748b); flex-shrink: 0; }
        .sp-input {
            flex: 1;
            background: none;
            border: none;
            outline: none;
            color: var(--text-primary, #f1f5f9);
            font-size: 15px;
            font-family: inherit;
        }
        .sp-input::placeholder { color: var(--text-tertiary, #64748b); }
        .sp-kbd {
            font-size: 11px;
            color: var(--text-tertiary);
            background: var(--surface-3, rgba(255,255,255,0.06));
            border: 1px solid var(--border-color, rgba(255,255,255,0.1));
            border-radius: 5px;
            padding: 2px 7px;
            font-family: inherit;
            flex-shrink: 0;
        }
        .sp-results { max-height: 360px; overflow-y: auto; padding: 6px 0; }
        .sp-section-label {
            font-size: 10.5px;
            font-weight: 700;
            letter-spacing: 0.07em;
            text-transform: uppercase;
            color: var(--text-tertiary, #64748b);
            padding: 8px 18px 4px;
        }
        .sp-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 9px 18px;
            cursor: pointer;
            transition: background 0.1s;
            border: none;
            background: none;
            width: 100%;
            text-align: left;
        }
        .sp-item:hover, .sp-item.active {
            background: var(--surface-3, rgba(255,255,255,0.07));
        }
        .sp-item-icon {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            background: var(--surface-3, rgba(255,255,255,0.06));
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            color: var(--text-secondary, #94a3b8);
        }
        .sp-item-icon.page     { color: var(--primary-400, #60a5fa); }
        .sp-item-icon.aluno    { color: var(--secondary-400, #34d399); }
        .sp-item-icon.turma    { color: var(--warning-400, #fbbf24); }
        .sp-item-label { font-size: 13.5px; font-weight: 500; color: var(--text-primary, #f1f5f9); }
        .sp-item-sub   { font-size: 11.5px; color: var(--text-tertiary, #64748b); margin-top: 1px; }
        .sp-item-enter {
            margin-left: auto;
            font-size: 10px;
            color: var(--text-tertiary);
            background: var(--surface-3, rgba(255,255,255,0.06));
            border: 1px solid var(--border-color, rgba(255,255,255,0.08));
            border-radius: 4px;
            padding: 2px 6px;
            flex-shrink: 0;
            opacity: 0;
            transition: opacity .1s;
            font-family: inherit;
        }
        .sp-item.active .sp-item-enter { opacity: 1; }
        .sp-empty {
            padding: 32px;
            text-align: center;
            color: var(--text-tertiary);
            font-size: 13px;
        }
        .sp-footer {
            display: flex;
            gap: 16px;
            padding: 9px 18px;
            border-top: 1px solid var(--border-color, rgba(255,255,255,0.08));
            font-size: 11px;
            color: var(--text-tertiary);
        }
        .sp-footer span { display: flex; align-items: center; gap: 4px; }
    `;
    document.head.appendChild(style);

    // ── DOM ───────────────────────────────────────────────
    const overlay = document.createElement('div');
    overlay.id = 'search-palette';
    overlay.innerHTML = `
        <div class="sp-backdrop"></div>
        <div class="sp-dialog">
            <div class="sp-input-wrap">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input type="text" class="sp-input" id="sp-input"
                    placeholder="Buscar páginas, alunos, turmas..." autocomplete="off" spellcheck="false" />
                <span class="sp-kbd">Esc</span>
            </div>
            <div class="sp-results" id="sp-results"></div>
            <div class="sp-footer">
                <span>↑↓ navegar</span>
                <span>↵ abrir</span>
                <span><kbd class="sp-kbd" style="font-size:10px">Ctrl K</kbd> fechar</span>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    const input    = overlay.querySelector('#sp-input');
    const resultsEl = overlay.querySelector('#sp-results');
    let activeIdx = 0;
    let currentItems = [];

    // ── Index ─────────────────────────────────────────────
    function buildIndex() {
        const items = [];
        PAGES.forEach(p => items.push({ type: 'page', ...p }));
        try {
            alunos.getAll().forEach(a => items.push({
                type: 'aluno',
                label: a.nome,
                subtitle: a.email || a.matricula || 'Aluno',
                path: '/alunos',
                icon: 'person',
            }));
            turmas.getAll().forEach(t => items.push({
                type: 'turma',
                label: t.nome,
                subtitle: 'Turma',
                path: '/turmas',
                icon: 'layers',
            }));
        } catch (e) { /* silent */ }
        return items;
    }

    function searchIndex(query) {
        const index = buildIndex();
        if (!query.trim()) return index.filter(i => i.type === 'page');
        const q = query.toLowerCase();
        return index.filter(i =>
            i.label.toLowerCase().includes(q) ||
            (i.subtitle && i.subtitle.toLowerCase().includes(q))
        ).slice(0, 14);
    }

    // ── Render ────────────────────────────────────────────
    function renderResults(query) {
        currentItems = searchIndex(query);
        activeIdx = 0;

        if (currentItems.length === 0) {
            resultsEl.innerHTML = `<div class="sp-empty">Nenhum resultado para "<strong>${escapeHtml(query)}</strong>"</div>`;
            return;
        }

        const pages    = currentItems.filter(i => i.type === 'page');
        const alunoArr = currentItems.filter(i => i.type === 'aluno');
        const turmaArr = currentItems.filter(i => i.type === 'turma');

        let html = '';
        let flatIdx = 0;

        function renderGroup(label, items) {
            if (!items.length) return;
            html += `<div class="sp-section-label">${label}</div>`;
            items.forEach(item => {
                html += `
                <button class="sp-item" data-idx="${flatIdx}" data-path="${item.path}">
                    <span class="sp-item-icon ${item.type}">${ICONS[item.icon] || ICONS.info}</span>
                    <span>
                        <div class="sp-item-label">${escapeHtml(item.label)}</div>
                        <div class="sp-item-sub">${escapeHtml(item.subtitle || '')}</div>
                    </span>
                    <span class="sp-item-enter">↵</span>
                </button>`;
                flatIdx++;
            });
        }

        if (!query.trim()) {
            renderGroup('Navegar para', pages);
        } else {
            renderGroup('Páginas', pages);
            renderGroup('Alunos', alunoArr);
            renderGroup('Turmas', turmaArr);
        }

        resultsEl.innerHTML = html;
        setActive(0);

        resultsEl.querySelectorAll('.sp-item').forEach(btn => {
            btn.addEventListener('mouseenter', () => setActive(parseInt(btn.dataset.idx)));
            btn.addEventListener('click', () => activateItem(parseInt(btn.dataset.idx)));
        });
    }

    function setActive(idx) {
        activeIdx = Math.max(0, Math.min(idx, currentItems.length - 1));
        resultsEl.querySelectorAll('.sp-item').forEach((btn, i) => {
            btn.classList.toggle('active', i === activeIdx);
            if (i === activeIdx) btn.scrollIntoView({ block: 'nearest' });
        });
    }

    function activateItem(idx) {
        const item = currentItems[idx];
        if (!item) return;
        closePalette();
        window.app?.router?.push(item.path);
    }

    // ── Open / Close ──────────────────────────────────────
    function openPalette() {
        overlay.classList.add('open');
        input.value = '';
        renderResults('');
        setTimeout(() => input.focus(), 40);
    }

    function closePalette() {
        overlay.classList.remove('open');
        input.value = '';
    }

    // ── Keyboard ──────────────────────────────────────────
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            overlay.classList.contains('open') ? closePalette() : openPalette();
            return;
        }
        if (!overlay.classList.contains('open')) return;
        if (e.key === 'Escape')    { closePalette(); return; }
        if (e.key === 'ArrowDown') { e.preventDefault(); setActive(activeIdx + 1); }
        if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(activeIdx - 1); }
        if (e.key === 'Enter')     { e.preventDefault(); activateItem(activeIdx); }
    });

    overlay.querySelector('.sp-backdrop').addEventListener('click', closePalette);
    input.addEventListener('input', () => renderResults(input.value));

    // ── Expose opener globally (for header button, etc.) ──
    window.openSearch = openPalette;
}
