// =========================================================
// EduPresença v2 – App Entry Point
// =========================================================
import { Router } from './router.js';
import { seedIfEmpty, auth, config, alunos, presencas } from './store.js';
import { renderLogin } from './pages/login.js';
import './components/sidebar.js';
import './components/header.js';
import './components/toast.js';
import './components/modal.js';
import './components/data-table.js';
import { initSearch } from './components/search.js';
import { initShortcuts } from './components/shortcuts.js';

// ── Theme Init (before render to avoid flash) ────────────
const savedTheme = localStorage.getItem('edu_theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

// ── PWA Install Banner ───────────────────────────────────
let deferredInstall = null;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstall = e;
    const dismissed = localStorage.getItem('edu_pwa_dismissed');
    if (!dismissed) {
        document.getElementById('pwa-banner')?.removeAttribute('hidden');
    }
});

document.getElementById('pwa-install-btn')?.addEventListener('click', async () => {
    if (!deferredInstall) return;
    deferredInstall.prompt();
    const { outcome } = await deferredInstall.userChoice;
    if (outcome === 'accepted') {
        const b = document.getElementById('pwa-banner'); if (b) b.style.display = 'none';
        window.toast?.success('Instalado!', 'EduPresença foi instalado no seu dispositivo.');
    }
    deferredInstall = null;
});

document.getElementById('pwa-dismiss-btn')?.addEventListener('click', () => {
    const banner = document.getElementById('pwa-banner');
    if (banner) banner.style.display = 'none';
    localStorage.setItem('edu_pwa_dismissed', '1');
});

// ── Routes ───────────────────────────────────────────────
const routes = [
    { path: '/', title: 'Dashboard', component: () => import('./pages/dashboard.js') },
    { path: '/alunos', title: 'Alunos', component: () => import('./pages/alunos.js') },
    { path: '/turmas', title: 'Turmas', component: () => import('./pages/turmas.js') },
    { path: '/cursos', title: 'Cursos', component: () => import('./pages/cursos.js') },
    { path: '/disciplinas', title: 'Disciplinas', component: () => import('./pages/disciplinas.js') },
    { path: '/unidades', title: 'Unidades', component: () => import('./pages/unidades.js') },
    { path: '/turnos', title: 'Turnos', component: () => import('./pages/turnos.js') },
    { path: '/presenca', title: 'Presença', component: () => import('./pages/presenca.js') },
    { path: '/notas', title: 'Notas', component: () => import('./pages/notas.js') },
    { path: '/relatorios', title: 'Relatórios', component: () => import('./pages/relatorios.js') },
    { path: '/configuracoes', title: 'Configurações', component: () => import('./pages/configuracoes.js') },
    { path: '/informacoes', title: 'Informações', component: () => import('./pages/informacoes.js') },
];

// ── Bootstrap ────────────────────────────────────────────
async function bootstrap() {
    await seedIfEmpty();

    if (!auth.currentUser()) {
        renderLogin((user) => {
            startApp(user);
        });
        return;
    }

    startApp(auth.currentUser());
}

function startApp(user) {
    const cfg = config.get();
    const anoEl = document.querySelector('app-sidebar')?.shadowRoot?.getElementById('ano-letivo-text');
    if (anoEl) anoEl.textContent = cfg.anoLetivo || new Date().getFullYear();

    document.querySelector('app-sidebar')?.setUser?.(user);
    document.querySelector('app-header')?.setUser?.(user);

    window.app = window.app || {};
    window.app.logout = () => {
        auth.logout();
        window.app.router?.destroy?.();
        document.getElementById('app-shell').style.display = 'none';
        renderLogin((newUser) => {
            startApp(newUser);
        });
    };

    const router = new Router(routes, document.getElementById('page-outlet'));
    window.app.router = router;
    router.init();

    // Atualiza badge de frequência na sidebar após cada navegação
    updateFreqBadge();
    router.onNavigate = updateFreqBadge;

    document.getElementById('page-loading')?.remove();

    // Busca global Ctrl+K
    initSearch();

    // Atalhos de teclado globais
    initShortcuts();

    console.log('%cEduPresença v2 (test)', 'color:#fbbf24;font-size:16px;font-weight:700;');
    console.log(`%cLogado como: ${user.nome} (${user.role})`, 'color:#94a3b8;');
}

// ── Frequência Badge ─────────────────────────────────────
function updateFreqBadge() {
    try {
        const allAlunos = alunos.getAll();
        const count = allAlunos.filter(a => {
            if ((a.situacao || 'ativo') === 'inativo') return false;
            const regs = presencas.getByAluno(a.id);
            if (regs.length < 3) return false;
            return (regs.filter(r => r.presente).length / regs.length) * 100 < 75;
        }).length;
        document.querySelector('app-sidebar')?.setBadge?.('/alunos', count);
    } catch (e) { /* silent */ }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
} else {
    bootstrap();
}
