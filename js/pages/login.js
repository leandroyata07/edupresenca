// =========================================================
// EduPresença – Login Page
// =========================================================
import { auth } from '../store.js';

export function renderLogin(onSuccess) {
  // Remove any existing app shell classes so login is full-screen
  document.getElementById('app-shell').style.display = 'none';
  document.querySelector('app-toast')?.remove();

  // Create or reuse login root
  let root = document.getElementById('login-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'login-root';
    document.body.appendChild(root);
  }

  root.innerHTML = `
    <div class="login-bg">
      <!-- Animated bg blobs -->
      <div class="login-blob login-blob-1"></div>
      <div class="login-blob login-blob-2"></div>
      <div class="login-blob login-blob-3"></div>

      <div class="login-card">
        <!-- Logo -->
        <div class="login-logo">
          <div class="login-logo-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
          </div>
          <div>
            <div class="login-logo-name">EduPresença</div>
            <div class="login-logo-sub">Sistema de Gestão Escolar</div>
          </div>
        </div>

        <!-- Form -->
        <h1 class="login-title" id="login-title-text">Bem-vindo</h1>
        <p class="login-desc" id="login-desc-text">Entre com suas credenciais para continuar</p>

        <div id="login-error" class="login-error" hidden></div>

        <form id="login-form" novalidate autocomplete="off">
          <div class="login-field">
            <label class="login-label">Usuário</label>
            <div class="login-input-wrap">
              <svg class="login-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
              <input class="login-input" id="login-username" name="username" type="text"
                placeholder="Digite seu usuário" autocomplete="username" required />
            </div>
          </div>

          <div class="login-field">
            <label class="login-label">Senha</label>
            <div class="login-input-wrap">
              <svg class="login-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input class="login-input" id="login-password" name="password" type="password"
                placeholder="••••••••" autocomplete="current-password" required />
              <button type="button" class="login-eye" id="toggle-pwd" aria-label="Mostrar senha">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" id="eye-icon">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>
          </div>

          <button type="submit" class="login-btn" id="login-submit">
            <span id="login-btn-text">Entrar</span>
            <div class="login-spinner" id="login-spinner" hidden></div>
          </button>
        </form>

        <p class="login-hint">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          Acesso padrão: <strong>admin</strong> / <strong>admin123</strong>
        </p>
      </div>

      <p class="login-footer">© ${new Date().getFullYear()} EduPresença · Todos os direitos reservados</p>
    </div>
  `;

  injectLoginStyles();

  // Handlers
  const form = root.querySelector('#login-form');
  const errorEl = root.querySelector('#login-error');
  const spinner = root.querySelector('#login-spinner');
  const btnText = root.querySelector('#login-btn-text');
  const toggleBtn = root.querySelector('#toggle-pwd');
  const pwdInput = root.querySelector('#login-password');

  toggleBtn.addEventListener('click', () => {
    const isText = pwdInput.type === 'text';
    pwdInput.type = isText ? 'password' : 'text';
    root.querySelector('#eye-icon').innerHTML = isText
      ? `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`
      : `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`;
  });

  // Determine greeting based on history
  const hasLoggedInBefore = localStorage.getItem('edu_has_logged_in');
  if (!hasLoggedInBefore) {
    root.querySelector('#login-title-text').textContent = 'Bem-vindo!';
    root.querySelector('#login-desc-text').textContent = 'Acesse o sistema com suas credenciais';
  } else {
    root.querySelector('#login-title-text').textContent = 'Bem-vindo de volta!';
    root.querySelector('#login-desc-text').textContent = 'Que bom ver você novamente';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = root.querySelector('#login-username').value.trim();
    const password = pwdInput.value;

    if (!username || !password) {
      showError('Preencha usuário e senha.');
      return;
    }

    // Show loading
    spinner.hidden = false;
    btnText.textContent = 'Entrando…';
    root.querySelector('#login-submit').disabled = true;
    errorEl.hidden = true;

    const user = await auth.login(username, password);

    spinner.hidden = true;
    root.querySelector('#login-submit').disabled = false;
    btnText.textContent = 'Entrar';

    if (user) {
      localStorage.setItem('edu_has_logged_in', 'true');
      root.style.animation = 'loginFadeOut 0.4s ease forwards';
      setTimeout(() => {
        root.remove();
        document.getElementById('app-shell').style.display = '';
        onSuccess(user);
      }, 400);
    } else {
      showError('Usuário ou senha incorretos.');
      pwdInput.value = '';
      pwdInput.focus();
    }
  });

  // Auto-focus
  setTimeout(() => root.querySelector('#login-username').focus(), 100);

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
    errorEl.style.animation = 'none';
    requestAnimationFrame(() => { errorEl.style.animation = 'shake 0.4s ease'; });
  }
}

function injectLoginStyles() {
  if (document.getElementById('login-styles')) return;
  const style = document.createElement('style');
  style.id = 'login-styles';
  style.textContent = `
    @keyframes loginFadeOut { to { opacity:0; transform:scale(0.97); } }
    @keyframes blobFloat { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(30px,-20px) scale(1.08)} }
    @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 75%{transform:translateX(8px)} }
    @keyframes loginIn { from{opacity:0;transform:translateY(24px) scale(0.97)} to{opacity:1;transform:none} }
    @keyframes spinnerAnim { to{transform:rotate(360deg)} }

    #login-root { position:fixed;inset:0;z-index:9999; }

    .login-bg {
      min-height:100vh; display:flex; flex-direction:column;
      align-items:center; justify-content:center; padding:20px;
      background: radial-gradient(ellipse at 20% 50%, rgba(79,70,229,0.15) 0%, transparent 60%),
                  radial-gradient(ellipse at 80% 20%, rgba(124,58,237,0.12) 0%, transparent 60%),
                  var(--bg-base, #0a0a1a);
      position:relative; overflow:hidden;
    }
    .login-blob {
      position:absolute; border-radius:50%; filter:blur(80px); opacity:0.35; pointer-events:none;
      animation: blobFloat 8s ease-in-out infinite;
    }
    .login-blob-1 { width:400px;height:400px;background:#4f46e5;top:-100px;left:-100px;animation-delay:0s; }
    .login-blob-2 { width:300px;height:300px;background:#7c3aed;bottom:-80px;right:-80px;animation-delay:3s; }
    .login-blob-3 { width:200px;height:200px;background:#0ea5e9;top:60%;left:40%;animation-delay:6s; }

    .login-card {
      background: rgba(255,255,255,0.04);
      backdrop-filter: blur(24px);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 24px;
      padding: 40px;
      width: 100%;
      max-width: 440px;
      box-shadow: 0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset;
      animation: loginIn 0.5s cubic-bezier(0.4,0,0.2,1) both;
      position: relative; z-index:1;
    }

    .login-logo {
      display:flex; align-items:center; gap:12px; margin-bottom:28px;
    }
    .login-logo-icon {
      width:48px;height:48px;border-radius:14px;
      background:linear-gradient(135deg,#4f46e5,#7c3aed);
      display:flex;align-items:center;justify-content:center;
      color:#fff; box-shadow:0 8px 24px rgba(99,102,241,0.4); flex-shrink:0;
    }
    .login-logo-name { font-size:18px;font-weight:800;color:#f1f5f9;font-family:'Plus Jakarta Sans',sans-serif; }
    .login-logo-sub  { font-size:12px;color:#64748b;margin-top:2px; }

    .login-title { font-size:24px;font-weight:700;color:#f1f5f9;font-family:'Plus Jakarta Sans',sans-serif;margin:0 0 6px; }
    .login-desc  { font-size:13px;color:#64748b;margin:0 0 24px; }

    .login-error {
      display:flex;align-items:center;gap:8px;
      background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);
      color:#fca5a5;font-size:13px;padding:10px 14px;border-radius:10px;margin-bottom:16px;
    }

    .login-field { margin-bottom:16px; }
    .login-label { display:block;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px; }
    .login-input-wrap { position:relative; }
    .login-input-icon { position:absolute;left:14px;top:50%;transform:translateY(-50%);color:#64748b;pointer-events:none; }
    .login-input {
      width:100%;padding:12px 44px 12px 42px;
      background:rgba(255,255,255,0.06);
      border:1.5px solid rgba(255,255,255,0.1);
      border-radius:12px;color:#f1f5f9;font-size:14px;
      font-family:inherit;outline:none;transition:all 0.2s;
    }
    .login-input:focus { border-color:#818cf8;background:rgba(99,102,241,0.1);box-shadow:0 0 0 3px rgba(99,102,241,0.2); }
    .login-input::placeholder { color:rgba(148,163,184,0.5); }
    .login-eye {
      position:absolute;right:12px;top:50%;transform:translateY(-50%);
      background:none;border:none;color:#64748b;cursor:pointer;padding:4px;
      display:flex;align-items:center;transition:color 0.15s;
    }
    .login-eye:hover { color:#f1f5f9; }

    .login-btn {
      width:100%;padding:13px;margin-top:8px;
      background:linear-gradient(135deg,#4f46e5,#7c3aed);
      border:none;border-radius:12px;color:#fff;font-size:15px;font-weight:700;
      cursor:pointer;transition:all 0.18s;font-family:inherit;
      display:flex;align-items:center;justify-content:center;gap:10px;
      box-shadow:0 8px 24px rgba(99,102,241,0.4);
    }
    .login-btn:hover:not(:disabled) { filter:brightness(1.1);box-shadow:0 12px 32px rgba(99,102,241,0.55); }
    .login-btn:active { transform:scale(0.98); }
    .login-btn:disabled { opacity:0.7;cursor:not-allowed; }

    .login-spinner {
      width:18px;height:18px;border:2px solid rgba(255,255,255,0.3);
      border-top-color:#fff;border-radius:50%;
      animation:spinnerAnim 0.7s linear infinite;
    }

    .login-hint {
      display:flex;align-items:center;gap:6px;justify-content:center;
      font-size:12px;color:#475569;margin:20px 0 0;line-height:1.5;
    }
    .login-hint strong { color:#94a3b8; }

    .login-footer { font-size:11px;color:#334155;margin-top:32px;text-align:center;position:relative;z-index:1; }

    @media(max-width:480px) { .login-card{padding:28px 20px;} }
  `;
  document.head.appendChild(style);
}
