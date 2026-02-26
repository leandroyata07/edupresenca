// =========================================================
// EduPresença v2 – Global Keyboard Shortcuts
// =========================================================
// Shortcuts:
//   N         → Open "Novo" form on the current page
//   F         → Focus the page filter/search input
//   Ctrl+S    → Save the currently open modal (globally)
//   ?         → Show this shortcuts reference
//   Ctrl+K    → Global search palette (handled by search.js)

const HINT_KEY = 'edu_shortcuts_shown';

function isTyping() {
    const el = document.activeElement;
    if (!el) return false;
    const tag = el.tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
    if (el.isContentEditable) return true;
    return false;
}

function isModalOpen() {
    // Check all modals in the document
    const modals = document.querySelectorAll('app-modal');
    for (const m of modals) {
        const host = m.shadowRoot;
        if (host) {
            const overlay = host.querySelector('.modal-overlay');
            if (overlay && !overlay.classList.contains('closing') && overlay.style.display !== 'none') {
                // Check if actually visible
                const dialog = host.querySelector('.modal-dialog');
                if (dialog) return m;
            }
        }
    }
    return null;
}

function getActiveModal() {
    const modals = document.querySelectorAll('app-modal');
    for (const m of modals) {
        const host = m.shadowRoot;
        if (host) {
            const overlay = host.querySelector('.modal-overlay');
            if (overlay && getComputedStyle(overlay).display !== 'none') return m;
        }
    }
    return null;
}

function showShortcutsHint() {
    window.toast?.show?.({
        type: 'info',
        title: 'Atalhos do teclado',
        message:
            '<kbd>N</kbd> Novo registro &nbsp;·&nbsp; ' +
            '<kbd>F</kbd> Focar pesquisa &nbsp;·&nbsp; ' +
            '<kbd>Ctrl+S</kbd> Salvar modal &nbsp;·&nbsp; ' +
            '<kbd>Ctrl+K</kbd> Busca global &nbsp;·&nbsp; ' +
            '<kbd>?</kbd> Atalhos',
        duration: 6000,
    });
}

function showFirstUseHint() {
    if (localStorage.getItem(HINT_KEY)) return;
    localStorage.setItem(HINT_KEY, '1');
    setTimeout(() => {
        window.toast?.show?.({
            type: 'info',
            title: 'Atalhos disponíveis!',
            message: 'Pressione <kbd>?</kbd> para ver todos os atalhos de teclado.',
            duration: 5000,
        });
    }, 2500);
}

export function initShortcuts() {
    document.addEventListener('keydown', (e) => {
        // ── Ctrl+S → save open modal ───────────────────
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            const m = getActiveModal();
            if (m) {
                e.preventDefault();
                m.shadowRoot?.getElementById('m-save')?.click();
            }
            return;
        }

        // Skip all further shortcuts if Ctrl/Alt/Meta held
        if (e.ctrlKey || e.altKey || e.metaKey) return;

        // Skip if typing in an input/textarea/select
        if (isTyping()) return;

        // Skip if a modal is open (modal has its own focus trap)
        if (getActiveModal()) return;

        switch (e.key) {
            case 'n':
            case 'N': {
                e.preventDefault();
                // Try common "new" button IDs in order of specificity
                const btn =
                    document.querySelector('#btn-novo-aluno') ||
                    document.querySelector('#btn-novo') ||
                    document.querySelector('[id^="btn-novo"]');
                btn?.click();
                break;
            }

            case 'f':
            case 'F': {
                e.preventDefault();
                const search =
                    document.querySelector('#filter-text') ||
                    document.querySelector('input[type="search"]');
                search?.focus();
                search?.select();
                break;
            }

            case '?': {
                e.preventDefault();
                showShortcutsHint();
                break;
            }
        }
    });

    showFirstUseHint();
}
