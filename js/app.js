// =========================================================
// EduPresença v2 – App Entry Point
// =========================================================
import { Router } from './router.js';
import { seedIfEmpty, auth, config, alunos, presencas, turmas, isSyncUser, forceSync } from './store.js';
import { renderLogin } from './pages/login.js';
import './components/sidebar.js';
import './components/header.js';
import './components/toast.js';
import './components/modal.js';
import './components/data-table.js';
import { initSearch } from './components/search.js';
import { initShortcuts } from './components/shortcuts.js';
import { initTrial, cleanupTrial } from './trial.js';

// ── Theme Init (before render to avoid flash) ────────────
const savedTheme = localStorage.getItem('edu_theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);

// ── PWA Service Worker Registration ──────────────────────
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then((reg) => {
                console.log('[PWA] Service Worker registrado com sucesso no escopo:', reg.scope);
                
                // Track PWA Updates to avoid caching issues during development and production releases
                reg.addEventListener('updatefound', () => {
                    const newWorker = reg.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                // New version fully downloaded and activated, notify user
                                setTimeout(() => {
                                    if (window.toast) {
                                        window.toast.showWithAction({
                                            type: 'info',
                                            title: 'Nova versão disponível!',
                                            message: 'Clique abaixo para carregar as últimas atualizações.',
                                            duration: 20000,
                                            actionLabel: 'Atualizar Agora',
                                            onAction: () => {
                                                location.reload();
                                            }
                                        });
                                    }
                                }, 1000);
                            }
                        });
                    }
                });
            })
            .catch((err) => {
                console.error('[PWA] Falha ao registrar Service Worker:', err);
            });
    });
}

// ── PWA Install Modal & Banner ───────────────────────────
window.deferredInstall = null;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.deferredInstall = e;
    const dismissed = localStorage.getItem('edu_pwa_dismissed');
    if (!dismissed) {
        document.getElementById('pwa-banner')?.removeAttribute('hidden');
    }
});

// Premium Custom Installation Modal
window.showInstallPwaModal = function(deferred, onAccepted) {
    let modal = document.getElementById('pwa-modal');
    if (!modal) {
        modal = document.createElement('app-modal');
        modal.id = 'pwa-modal';
        document.body.appendChild(modal);
    }

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    let body = '';
    let footer = '';

    if (isStandalone) {
        // App is already installed and running in standalone mode!
        body = `
          <div style="font-family:var(--font-sans, sans-serif); display:flex; flex-direction:column; gap:16px; padding:10px 4px; color:var(--text-primary); text-align:center; align-items:center;">
            <div style="width:72px; height:72px; border-radius:18px; background:linear-gradient(135deg,#10b981,#059669); display:flex; align-items:center; justify-content:center; box-shadow:0 8px 32px rgba(16,185,129,0.3); border:2px solid rgba(255,255,255,0.1); margin-bottom:8px;">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div>
              <h3 style="margin:0; font-size:20px; font-weight:800; color:var(--text-primary);">EduPresença v1.0.2</h3>
              <span class="badge badge-success" style="font-size:10px; margin-top:6px; display:inline-block; font-weight:700;">Aplicativo Instalado</span>
            </div>
            <p style="font-size:14px; line-height:1.6; color:var(--text-secondary); margin:0; max-width:320px;">
              Parabéns! Você já está utilizando o <strong>EduPresença</strong> em modo aplicativo otimizado diretamente no seu dispositivo.
            </p>
          </div>
        `;
        footer = `<button class="btn btn-primary" id="m-pwa-ok" style="width:100%;">Excelente</button>`;
    } else if (isIOS) {
        // iOS Safari Instructions
        body = `
          <div style="font-family:var(--font-sans, sans-serif); display:flex; flex-direction:column; gap:16px; padding:10px 4px; color:var(--text-primary);">
            <div style="display:flex; align-items:center; gap:16px;">
              <div style="width:56px; height:56px; border-radius:14px; background:linear-gradient(135deg,#4f46e5,#7c3aed); display:flex; align-items:center; justify-content:center; box-shadow:0 8px 24px rgba(99,102,241,0.35);">
                <svg width="28" height="28" viewBox="0 0 512 512" fill="none">
                  <polygon points="256,120 400,185 256,250 112,185" fill="white"/>
                  <polygon points="256,120 400,185 256,250 112,185" fill="none" stroke="white" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
                  <rect x="184" y="286" width="144" height="78" rx="10" fill="white"/>
                  <polyline points="210,328 246,364 302,295" fill="none" stroke="#4f46e5" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>
                  <line x1="400" y1="185" x2="400" y2="240" stroke="white" stroke-width="8" stroke-linecap="round"/>
                  <circle cx="400" cy="252" r="16" fill="white"/>
                </svg>
              </div>
              <div>
                <h3 style="margin:0; font-size:18px; font-weight:700; color:var(--text-primary);">EduPresença v1.0.2</h3>
                <span class="badge badge-success" style="font-size:10px; margin-top:4px; display:inline-block; font-weight:700;">Suporte a iOS</span>
              </div>
            </div>
            <p style="font-size:13.5px; line-height:1.6; color:var(--text-secondary); margin:0;">
              Para instalar este aplicativo no seu iPhone ou iPad e ter acesso rápido diretamente da tela inicial:
            </p>
            <ol style="margin:0; padding-left:20px; display:flex; flex-direction:column; gap:10px; font-size:13.5px; line-height:1.5; color:var(--text-secondary);">
              <li>Toque no botão de <strong>Compartilhar</strong> <span style="display:inline-flex; align-items:center; justify-content:center; width:24px; height:24px; background:rgba(255,255,255,0.08); border-radius:6px; vertical-align:middle; margin:0 2px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/></svg></span> (na barra do Safari).</li>
              <li>Role o menu de compartilhamento para baixo.</li>
              <li>Toque na opção <strong>Adicionar à Tela de Início</strong> <span style="display:inline-flex; align-items:center; justify-content:center; width:24px; height:24px; background:rgba(255,255,255,0.08); border-radius:6px; vertical-align:middle; margin:0 2px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg></span>.</li>
              <li>Confirme tocando em <strong>Adicionar</strong> no canto superior direito.</li>
            </ol>
          </div>
        `;
        footer = `<button class="btn btn-primary" id="m-pwa-ok" style="width:100%;">Entendido</button>`;
    } else if (deferred) {
        // Native prompt supported and prompt ready
        body = `
          <div style="font-family:var(--font-sans, sans-serif); display:flex; flex-direction:column; gap:16px; padding:10px 4px; color:var(--text-primary);">
            <div style="display:flex; align-items:center; gap:16px;">
              <div style="width:64px; height:64px; border-radius:16px; background:linear-gradient(135deg,#4f46e5,#7c3aed); display:flex; align-items:center; justify-content:center; box-shadow:0 8px 32px rgba(99,102,241,0.45); border:2px solid rgba(255,255,255,0.1);">
                <svg width="32" height="32" viewBox="0 0 512 512" fill="none">
                  <polygon points="256,120 400,185 256,250 112,185" fill="white"/>
                  <polygon points="256,120 400,185 256,250 112,185" fill="none" stroke="white" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
                  <rect x="184" y="286" width="144" height="78" rx="10" fill="white"/>
                  <polyline points="210,328 246,364 302,295" fill="none" stroke="#4f46e5" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>
                  <line x1="400" y1="185" x2="400" y2="240" stroke="white" stroke-width="8" stroke-linecap="round"/>
                  <circle cx="400" cy="252" r="16" fill="white"/>
                </svg>
              </div>
              <div>
                <h3 style="margin:0; font-size:20px; font-weight:800; color:var(--text-primary);">EduPresença v1.0.2</h3>
                <span class="badge badge-success" style="font-size:10px; margin-top:4px; display:inline-block; font-weight:700;">Instalação Disponível</span>
              </div>
            </div>
            <p style="font-size:14px; line-height:1.6; color:var(--text-secondary); margin:0;">
              Instale o EduPresença para ter uma experiência de aplicativo nativo com melhor desempenho e facilidade de acesso.
            </p>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:4px;">
              <div class="card" style="padding:12px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:10px;">
                <h4 style="margin:0 0 4px 0; font-size:12.5px; font-weight:700; color:var(--text-primary);">Acesso Rápido</h4>
                <p style="margin:0; font-size:11.5px; color:var(--text-tertiary); line-height:1.4;">Ícone direto na sua Área de Trabalho ou gaveta de aplicativos.</p>
              </div>
              <div class="card" style="padding:12px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:10px;">
                <h4 style="margin:0 0 4px 0; font-size:12.5px; font-weight:700; color:var(--text-primary);">Suporte Offline</h4>
                <p style="margin:0; font-size:11.5px; color:var(--text-tertiary); line-height:1.4;">Carrega instantaneamente mesmo sem conexão com a internet.</p>
              </div>
            </div>
          </div>
        `;
        footer = `
          <button class="btn btn-ghost" id="m-pwa-cancel">Depois</button>
          <button class="btn btn-primary" id="m-pwa-install" style="gap:6px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Instalar Agora
          </button>
        `;
    } else {
        // Desktop Firefox / Unsupported browsers / Incognito
        const currentUrl = window.location.href;
        body = `
          <div style="font-family:var(--font-sans, sans-serif); display:flex; flex-direction:column; gap:16px; padding:10px 4px; color:var(--text-primary);">
            <div style="display:flex; align-items:center; gap:16px;">
              <div style="width:56px; height:56px; border-radius:14px; background:linear-gradient(135deg,#f59e0b,#ef4444); display:flex; align-items:center; justify-content:center; box-shadow:0 8px 24px rgba(245,158,11,0.25);">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <div>
                <h3 style="margin:0; font-size:18px; font-weight:700; color:var(--text-primary);">Instalação no Navegador</h3>
                <span class="badge badge-neutral" style="font-size:10px; margin-top:4px; display:inline-block; font-weight:700;">Navegador Incompatível</span>
              </div>
            </div>
            <p style="font-size:13.5px; line-height:1.6; color:var(--text-secondary); margin:0; text-align:justify;">
              O seu navegador atual não possui suporte nativo para instalação direta de aplicativos de computador.
            </p>
            <p style="font-size:13.5px; line-height:1.6; color:var(--text-secondary); margin:0; text-align:justify;">
              Para utilizar o <strong>EduPresença</strong> em modo aplicativo de alta performance na sua área de trabalho (com suporte offline completo), recomendamos abrir este endereço no <strong>Google Chrome</strong> ou <strong>Microsoft Edge</strong>.
            </p>
            <div style="display:flex; flex-direction:column; gap:8px; margin-top:4px;">
              <label style="font-size:11px; font-weight:600; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.05em;">Link do Sistema</label>
              <div style="display:flex; gap:8px;">
                <input type="text" id="pwa-copy-url-input" value="${currentUrl}" readonly style="flex:1; height:38px; padding:0 12px; border-radius:8px; border:1px solid var(--border-color, rgba(255,255,255,0.08)); background:rgba(255,255,255,0.02); color:var(--text-secondary); font-size:12.5px;" />
                <button class="btn btn-secondary" id="btn-copy-pwa-link" style="height:38px; padding:0 14px; gap:6px; display:flex; align-items:center; cursor:pointer;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  <span>Copiar</span>
                </button>
              </div>
            </div>
          </div>
        `;
        footer = `<button class="btn btn-primary" id="m-pwa-ok" style="width:100%;">Entendido</button>`;
    }

    modal.open({
      title: 'Instalar Aplicativo',
      icon: `<svg width="20" height="20" viewBox="0 0 512 512" fill="none">
        <defs>
          <linearGradient id="sb-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#818cf8"/>
            <stop offset="100%" stop-color="#c084fc"/>
          </linearGradient>
        </defs>
        <polygon points="256,120 400,185 256,250 112,185" fill="url(#sb-grad)"/>
        <polygon points="256,120 400,185 256,250 112,185" fill="none" stroke="white" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
        <rect x="184" y="286" width="144" height="78" rx="10" fill="url(#sb-grad)"/>
        <polyline points="210,328 246,364 302,295" fill="none" stroke="white" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="400" y1="185" x2="400" y2="240" stroke="white" stroke-width="8" stroke-linecap="round"/>
        <circle cx="400" cy="252" r="16" fill="white"/>
      </svg>`,
      body,
      footer
    });

    const shadow = modal.shadowRoot;
    
    shadow?.getElementById('m-pwa-ok')?.addEventListener('click', () => modal.close());
    shadow?.getElementById('m-pwa-cancel')?.addEventListener('click', () => modal.close());
    
    shadow?.getElementById('btn-copy-pwa-link')?.addEventListener('click', () => {
      const input = shadow.getElementById('pwa-copy-url-input');
      if (input) {
        navigator.clipboard.writeText(input.value).then(() => {
          window.toast?.success('Link Copiado!', 'O endereço foi copiado para a área de transferência.');
        }).catch(() => {
          window.toast?.error('Erro', 'Não foi possível copiar o link.');
        });
      }
    });

    shadow?.getElementById('m-pwa-install')?.addEventListener('click', async () => {
      modal.close();
      if (deferred) {
        deferred.prompt();
        const { outcome } = await deferred.userChoice;
        if (outcome === 'accepted') {
          onAccepted?.();
        }
      }
    });
};

document.getElementById('pwa-install-btn')?.addEventListener('click', () => {
    window.showInstallPwaModal(window.deferredInstall, () => {
        const b = document.getElementById('pwa-banner');
        if (b) b.style.display = 'none';
        window.toast?.success('Instalado!', 'EduPresença foi instalado no seu dispositivo.');
        window.deferredInstall = null;
    });
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
    { path: '/professores', title: 'Professores', component: () => import('./pages/professores.js') },
    { path: '/turmas', title: 'Turmas', component: () => import('./pages/turmas.js') },
    { path: '/cursos', title: 'Cursos', component: () => import('./pages/cursos.js') },
    { path: '/disciplinas', title: 'Disciplinas', component: () => import('./pages/disciplinas.js') },
    { path: '/unidades', title: 'Unidades', component: () => import('./pages/unidades.js') },
    { path: '/turnos', title: 'Turnos', component: () => import('./pages/turnos.js') },
    { path: '/presenca', title: 'Presença', component: () => import('./pages/presenca.js') },
    { path: '/notas', title: 'Notas', component: () => import('./pages/notas.js') },
    { path: '/relatorios', title: 'Relatórios', component: () => import('./pages/relatorios.js') },
    { path: '/horarios', title: 'Quadro de Horários', component: () => import('./pages/horarios.js') },
    { path: '/logs', title: 'Logs de Auditoria', adminOnly: true, component: () => import('./pages/logs.js') },
    { path: '/configuracoes', title: 'Configurações', component: () => import('./pages/configuracoes.js') },
    { path: '/informacoes', title: 'Informações', component: () => import('./pages/informacoes.js') },
];

// ── Bootstrap ────────────────────────────────────────────
async function bootstrap() {
    await seedIfEmpty();

    if (!auth.currentUser()) {
        // Reset URL path to base / so that the next login starts at Dashboard
        const base = location.pathname.includes('/edupresenca') ? '/edupresenca' : '';
        history.replaceState({}, '', base + '/');

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
    initTrial(user);

    // Alert user if cloud sync is configured but Firebase is blocked/unavailable
    // Usa sessionStorage para evitar spam de notificações ao recarregar a página
    if (isSyncUser()) {
        const warnShown = sessionStorage.getItem('edu_cloud_warn_shown');
        if (!warnShown) {
            setTimeout(() => {
                if (typeof firebase === 'undefined' || !firebase.firestore) {
                    sessionStorage.setItem('edu_cloud_warn_shown', '1');
                    window.toast?.warning(
                        'Nuvem Offline / Bloqueada',
                        'O Firebase foi bloqueado pelo seu navegador (ex: Helium/Adblocker). As alterações serão salvas APENAS localmente neste dispositivo e NÃO serão sincronizadas.'
                    );
                }
            }, 10000); // 10 segundos para evitar falsos-positivos em conexões lentas
        }
    }

    window.app = window.app || {};
    window.app.logout = async () => {
        await auth.logout();
        try {
            cleanupTrial();
        } catch (e) {}
        window.app.router?.destroy?.();
        document.getElementById('app-shell').style.display = 'none';

        // Reset URL to base / so that the next login starts at Dashboard
        const base = location.pathname.includes('/edupresenca') ? '/edupresenca' : '';
        history.replaceState({}, '', base + '/');

        renderLogin((newUser) => {
            startApp(newUser);
        });
    };

    const router = new Router(routes, document.getElementById('page-outlet'));
    window.app.router = router;
    router.init();

    // Atualiza badges na sidebar após cada navegação
    window.app.updateFreqBadge = updateFreqBadge;
    window.app.updatePasswordResetBadge = updatePasswordResetBadge;
    updateFreqBadge();
    updatePasswordResetBadge();
    
    router.onNavigate = () => {
        updateFreqBadge();
        updatePasswordResetBadge();
    };

    document.getElementById('page-loading')?.remove();

    // Sincronização forçada em segundo plano: garante que dados de outros dispositivos
    // aparecem após F5, Forçar Atualização ou qualquer acesso ao sistema
    if (isSyncUser()) {
        setTimeout(async () => {
            try {
                await forceSync();
                // Re-renderiza a página atual para refletir os dados recém-baixados
                const currentPath = location.pathname.replace(
                    location.pathname.includes('/edupresenca') ? '/edupresenca' : '',
                    ''
                ) || '/';
                window.app?.router?.replace?.(currentPath);
            } catch (e) {
                console.warn('[Startup Sync] Falha na sincronização em segundo plano:', e);
            }
        }, 1000); // 1 segundo de atraso para a UI estabilizar primeiro
    }

    // Busca global Ctrl+K
    initSearch();

    // Atalhos de teclado globais
    initShortcuts();

    console.log('%cEduPresença 1.0.2', 'color:#fbbf24;font-size:16px;font-weight:700;');
}

// ── Frequência Badge ─────────────────────────────────────
function updateFreqBadge() {
    try {
        const me = auth.currentUser();
        const isProfessor = me && me.role === 'professor';
        const minhasDisciplinas = isProfessor ? (me.disciplinas || []) : null;
        
        let allAlunosList = alunos.getAll();
        if (isProfessor) {
            const meusCursos = me.cursos || [];
            allAlunosList = allAlunosList.filter(a => {
                const t = turmas.getById(a.turmaId);
                return t && meusCursos.includes(t.cursoId);
            });
        }

        const count = allAlunosList.filter(a => {
            if ((a.situacao || 'ativo') === 'inativo') return false;
            const regs = presencas.getByAluno(a.id, minhasDisciplinas);
            if (regs.length < 3) return false;
            return (regs.filter(r => r.presente).length / regs.length) * 100 < 75;
        }).length;
        document.querySelector('app-sidebar')?.setBadge?.('/alunos', count);
    } catch (e) { /* silent */ }
}

// ── Solicitações de Senha Badge ──────────────────────────
async function updatePasswordResetBadge() {
    try {
        const currentUser = auth.currentUser();
        if (!currentUser || !auth.isGestor()) {
            document.querySelector('app-sidebar')?.setBadge?.('/configuracoes', 0);
            return;
        }

        if (typeof firebase === 'undefined') return;

        // Listen or query pending password reset requests
        const snapshot = await firebase.firestore()
            .collection('edu_solicitacoes_senha')
            .where('status', '==', 'pendente')
            .get();

        const count = snapshot.size;
        document.querySelector('app-sidebar')?.setBadge?.('/configuracoes', count, 'Solicitações de redefinição de senha pendentes');
    } catch (e) { /* silent */ }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
} else {
    bootstrap();
}
