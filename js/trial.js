// =========================================================
// EduPresença – Trial Mode Manager
// =========================================================
import { auth, config } from './store.js';

const DEMO_EMAIL = 'teste@edupresenca.com';

let trialInterval = null;

export function isTrialActive() {
    const endTime = localStorage.getItem('edu_trial_end');
    if (!endTime) return false;
    return (parseInt(endTime, 10) - Date.now()) > 0;
}

export function initTrial(user) {
    const cfg = config.get();
    const durationMinutes = cfg.trialDurationMinutes || 60; // Padrão: 60 minutos
    const TRIAL_DURATION_MS = durationMinutes * 60 * 1000;

    // If it's the demo user, ensure trial is started/renewed
    if (user && user.email === DEMO_EMAIL) {
        const currentEnd = localStorage.getItem('edu_trial_end');
        if (currentEnd) {
            const remaining = parseInt(currentEnd, 10) - Date.now();
            if (remaining <= 0) {
                // O tempo expirou enquanto a aba estava fechada ou deslogado!
                // Limpa todos os dados da degustação anterior antes de criar a nova
                localStorage.clear();
                sessionStorage.clear();
                try {
                    firebase.auth().signOut();
                } catch (e) {}
                window.location.reload();
                return;
            }
        }

        if (!currentEnd) {
            const endTime = Date.now() + TRIAL_DURATION_MS;
            localStorage.setItem('edu_trial_end', endTime);
        }
    }

    // If trial is active (for demo user OR local user created during demo)
    if (isTrialActive() && (user?.email === DEMO_EMAIL || !user?.email)) {
        renderTrialBanner();
        startCountdown();
    } else {
        removeTrialBanner();
    }
}

function renderTrialBanner() {
    if (document.getElementById('trial-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'trial-banner';
    banner.innerHTML = `
        <div class="trial-content">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span><strong>Versão de Demonstração:</strong> Seu acesso expira em <span id="trial-timer">--:--</span></span>
        </div>
    `;

    injectTrialStyles();
    document.body.appendChild(banner);
}

export function cleanupTrial() {
    removeTrialBanner();
}

function removeTrialBanner() {
    document.getElementById('trial-banner')?.remove();
    if (trialInterval) {
        clearInterval(trialInterval);
        trialInterval = null;
    }
}

function startCountdown() {
    if (trialInterval) clearInterval(trialInterval);

    const timerEl = document.getElementById('trial-timer');
    const endTime = parseInt(localStorage.getItem('edu_trial_end'), 10);
    
    trialInterval = setInterval(() => {
        const remaining = endTime - Date.now();

        if (remaining <= 0) {
            clearInterval(trialInterval);
            endTrial();
            return;
        }

        if (timerEl) {
            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);
            timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            if (minutes < 5) {
                document.getElementById('trial-banner')?.classList.add('trial-warning');
            }
        }
    }, 1000);
}

function endTrial() {
    const modal = document.createElement('app-modal');
    document.body.appendChild(modal);

    const performClearAndReload = () => {
        localStorage.clear();
        sessionStorage.clear();
        try {
            firebase.auth().signOut();
        } catch (e) {}
        window.location.reload();
    };

    modal.open({
        title: 'Sessão Expirada',
        icon: `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
        `,
        body: `
            <div style="text-align: center; padding: 10px 0;">
                <div style="font-size: 54px; margin-bottom: 16px; filter: drop-shadow(0 8px 24px rgba(239,68,68,0.2));">🔒</div>
                <h3 style="font-size: 18px; font-weight: 700; color: var(--text-primary); margin-bottom: 12px; font-family:'Plus Jakarta Sans',sans-serif;">Seu Tempo Expirou!</h3>
                <p style="color: var(--text-secondary); line-height: 1.6; font-size: 13.5px; margin-bottom: 10px;">
                    O período de degustação da conta de testes chegou ao fim.
                </p>
                <p style="color: var(--text-tertiary); line-height: 1.6; font-size: 12.5px;">
                    Para garantir a segurança e a limpeza do ambiente de testes, todos os dados criados nesta sessão foram eliminados da memória.
                </p>
            </div>
        `,
        footer: `
            <button class="btn btn-primary" id="btn-end-trial-ok" style="width: 100%; justify-content: center; height: 42px; font-size: 14px; cursor: pointer;">
                Entendido, Sair do Sistema
            </button>
        `,
        size: 'sm'
    });

    // Hide close button in shadow DOM to prevent bypassing the popup
    const closeBtn = modal.shadowRoot.getElementById('modal-close-btn');
    if (closeBtn) closeBtn.style.display = 'none';

    // If they click the button or bypass via backdrop/escape, perform clearance
    modal.addEventListener('modal-close', performClearAndReload);
    const okBtn = modal.shadowRoot.getElementById('btn-end-trial-ok');
    if (okBtn) {
        okBtn.onclick = () => {
            modal.close();
        };
    }
}

function injectTrialStyles() {
    if (document.getElementById('trial-styles')) return;
    const style = document.createElement('style');
    style.id = 'trial-styles';
    style.textContent = `
        #trial-banner {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 36px;
            background: #fbbf24;
            color: #451a03;
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 13px;
            font-weight: 500;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            animation: slideDown 0.4s ease;
        }
        #trial-banner.trial-warning {
            background: #ef4444;
            color: #fff;
            animation: pulseTrial 2s infinite;
        }
        .trial-content { display: flex; align-items: center; gap: 8px; }
        #trial-timer { font-family: monospace; font-weight: 700; font-size: 14px; background: rgba(0,0,0,0.1); padding: 2px 6px; border-radius: 4px; }
        
        @keyframes slideDown { from{transform:translateY(-100%)} to{transform:none} }
        @keyframes pulseTrial { 0%,100%{opacity:1} 50%{opacity:0.8} }

        /* Adjust app shell to push down when banner is present */
        body:has(#trial-banner) .app-shell { margin-top: 36px; height: calc(100vh - 36px); }
        body:has(#trial-banner) app-sidebar { top: 36px; height: calc(100vh - 36px); }
    `;
    document.head.appendChild(style);
}
