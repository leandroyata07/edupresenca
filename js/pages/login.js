// =========================================================
// EduPresença – Login Page (Based on modelo.html design)
// =========================================================
import { auth } from '../store.js';

export function renderLogin(onSuccess) {
  // Set the current saved theme on documentElement so that CSS variables are correctly populated
  const savedTheme = localStorage.getItem('edu_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);

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
    <div class="split-screen">
      <!-- Theme Toggle Button -->
      <button class="theme-toggle-login" id="theme-btn" aria-label="Alternar tema">
        <!-- Icon injected by JS -->
      </button>

      <!-- LADO ESQUERDO: informações institucionais atrativas -->
      <div class="info-side">
        <div class="info-container">
          <div class="logo-area">
            <svg width="42" height="42" viewBox="0 0 512 512" fill="none" style="filter: drop-shadow(0 2px 8px rgba(0,0,0,0.25)); flex-shrink:0;">
              <defs>
                <linearGradient id="login-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#FFD966"/>
                  <stop offset="100%" stop-color="#f59e0b"/>
                </linearGradient>
              </defs>
              <polygon points="256,120 400,185 256,250 112,185" fill="url(#login-grad)"/>
              <polygon points="256,120 400,185 256,250 112,185" fill="none" stroke="#FFD966" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
              <rect x="184" y="286" width="144" height="78" rx="10" fill="url(#login-grad)"/>
              <polyline points="210,328 246,364 302,295" fill="none" stroke="#0d0d1a" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>
              <line x1="400" y1="185" x2="400" y2="240" stroke="#FFD966" stroke-width="8" stroke-linecap="round"/>
              <circle cx="400" cy="252" r="16" fill="#FFD966"/>
            </svg>
            <h1>EduPresença</h1>
          </div>
          
          <div class="tagline">
            <svg width="18" height="18" viewBox="0 0 512 512" fill="none" style="margin-right: 8px; flex-shrink:0;">
              <polygon points="256,120 400,185 256,250 112,185" fill="#FFD966"/>
              <rect x="184" y="286" width="144" height="78" rx="10" fill="#FFD966"/>
              <polyline points="210,328 246,364 302,295" fill="none" stroke="#0d0d1a" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>
              <line x1="400" y1="185" x2="400" y2="240" stroke="#FFD966" stroke-width="8" stroke-linecap="round"/>
              <circle cx="400" cy="252" r="16" fill="#FFD966"/>
            </svg> 
            Sistema completo para gestão de notas, boletim e frequência escolar
          </div>

          <div class="features-grid">
            <div class="feature-item">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFD966" stroke-width="2.5" style="flex-shrink:0;">
                <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
              <div class="feature-text">
                <h3>Notas e Desempenho</h3>
                <p>Lançamento rápido, médias automáticas e análise de evolução acadêmica.</p>
              </div>
            </div>
            
            <div class="feature-item">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFD966" stroke-width="2.5" style="flex-shrink:0;">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
              <div class="feature-text">
                <h3>Boletim Digital</h3>
                <p>Acesso instantâneo para alunos, pais e responsáveis, com gráficos interativos.</p>
              </div>
            </div>
            
            <div class="feature-item">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFD966" stroke-width="2.5" style="flex-shrink:0;">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <div class="feature-text">
                <h3>Controle de Presença</h3>
                <p>Marque faltas, visualize percentuais e gere relatórios por turma.</p>
              </div>
            </div>
            
            <div class="feature-item">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFD966" stroke-width="2.5" style="flex-shrink:0;">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <div class="feature-text">
                <h3>Comunicação Eficiente</h3>
                <p>Mural de avisos, recados automáticos e integração com app dos pais.</p>
              </div>
            </div>
          </div>

          <div class="depoimento">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFD966" stroke-width="2.5" style="margin-right: 6px; display: inline-block; vertical-align: middle; flex-shrink:0;">
              <path d="M3 21c3 0 7-1 7-8V5H3v8h4c0 5-4 8-4 8zm11 0c3 0 7-1 7-8V5h-7v8h4c0 5-4 8-4 8z"/>
            </svg>
            <p>"Reduza em até 70% o tempo gasto com boletins manuais. Pais amam a transparência!"</p>
          </div>

          <div class="info-footer-badges">
            <span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFD966" stroke-width="2.5" style="vertical-align: middle; margin-right: 4px; display: inline-block;">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Dados seguros
            </span>
            <span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFD966" stroke-width="2.5" style="vertical-align: middle; margin-right: 4px; display: inline-block;">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
              </svg>
              Sincronização em nuvem
            </span>
            <span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFD966" stroke-width="2.5" style="vertical-align: middle; margin-right: 4px; display: inline-block;">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Simples e Prático
            </span>
          </div>
        </div>
      </div>

      <!-- LADO DIREITO: FORMULÁRIO DE LOGIN -->
      <div class="login-side">
        <div class="login-form-blob"></div>
        
        <div class="login-card-container">
          <div class="login-card">
            <div class="login-brand">
              <svg width="130" height="130" viewBox="0 0 512 512" fill="none" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));">
                <defs>
                  <linearGradient id="login-card-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#818cf8"/>
                    <stop offset="100%" stop-color="#c084fc"/>
                  </linearGradient>
                </defs>
                <polygon points="256,120 400,185 256,250 112,185" fill="url(#login-card-logo-grad)"/>
                <polygon points="256,120 400,185 256,250 112,185" fill="none" stroke="white" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
                <rect x="184" y="286" width="144" height="78" rx="10" fill="url(#login-card-logo-grad)"/>
                <polyline points="210,328 246,364 302,295" fill="none" stroke="white" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>
                <line x1="400" y1="185" x2="400" y2="240" stroke="white" stroke-width="8" stroke-linecap="round"/>
                <circle cx="400" cy="252" r="16" fill="white"/>
              </svg>
              <span>EduPresença</span>
            </div>
            <div class="login-header">
              <h2 id="login-title-text">Acessar plataforma</h2>
              <p id="login-desc-text">Entre com suas credenciais para continuar</p>
            </div>

            <div id="login-error" class="login-error" hidden></div>

            ${typeof firebase === 'undefined' ? `
             <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 8px; padding: 12px; margin-bottom: 16px; font-size: 12px; color: var(--text-secondary); line-height: 1.5; text-align: justify; display: flex; flex-direction: column; gap: 4px;">
               <strong style="color: #d97706; display: flex; align-items: center; gap: 6px; font-size: 13px;">⚠️ Modo Offline (Firebase Bloqueado)</strong>
               <span>O carregamento da nuvem foi bloqueado pelo seu navegador (ex: Helium Browser, Adblock ou restrições de privacidade). O sistema funcionará localmente neste dispositivo, mas <strong>nenhum dado será enviado à nuvem ou sincronizado</strong>.</span>
             </div>
             ` : ''}

            <form id="login-form" novalidate autocomplete="off">
              <div class="input-group">
                <input type="email" id="login-username" placeholder=" " autocomplete="username" required>
                <label for="login-username">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 4px; display: inline-block;">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                  </svg>
                  E-mail ou usuário
                </label>
              </div>
              
              <div class="input-group">
                <input type="password" id="login-password" placeholder=" " autocomplete="current-password" required style="width: 100%; padding-right: 44px;">
                <label for="login-password">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 4px; display: inline-block;">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  Senha
                </label>
                <button type="button" class="login-eye" id="toggle-pwd" aria-label="Mostrar senha">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" id="eye-icon">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
              </div>
              
              <div class="options">
                <label>
                  <input type="checkbox" id="rememberCheck"> Lembrar-me
                </label>
                <a href="#" id="forgotPasswordLink">Esqueceu a senha?</a>
              </div>
              
              <button type="submit" id="login-submit">
                <span id="login-btn-text">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align: middle; margin-right: 6px; display: inline-block;">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>
                  </svg>
                  Entrar
                </span>
                <div class="login-spinner" id="login-spinner" hidden></div>
              </button>
              
              <div class="signup-link">
                Não tem uma conta? <a href="#" id="signupLink">Solicitar acesso</a>
              </div>
            </form>
          </div>
          
          <p class="login-footer">© ${new Date().getFullYear()} EduPresença · Todos os direitos reservados</p>
        </div>
      </div>
    </div>
  `;

  injectLoginStyles();

  // Theme Toggle Logic
  const themeBtn = root.querySelector('#theme-btn');
  const updateThemeIcon = (theme) => {
    if (!themeBtn) return;
    if (theme === 'light') {
      themeBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
      themeBtn.title = 'Alternar Tema (Modo Escuro)';
    } else if (theme === 'dark') {
      themeBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #FFD966;"><path d="M22 10v6M2 10l10-5 10 5-10 5-10-5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`;
      themeBtn.title = 'Alternar Tema (EduPresença)';
    } else { // edupresenca
      themeBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
      themeBtn.title = 'Alternar Tema (Modo Claro)';
    }
  };

  updateThemeIcon(savedTheme);

  themeBtn?.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    let next = 'dark';
    if (current === 'dark') {
      next = 'edupresenca';
    } else if (current === 'edupresenca') {
      next = 'light';
    } else {
      next = 'dark';
    }
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('edu_theme', next);
    updateThemeIcon(next);
  });

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
    const email = root.querySelector('#login-username').value.trim();
    const password = pwdInput.value;

    if (!email || !password) {
      showError('Preencha e-mail e senha.');
      return;
    }

    // Show loading
    spinner.hidden = false;
    btnText.style.display = 'none';
    root.querySelector('#login-submit').disabled = true;
    errorEl.hidden = true;

    try {
      const user = await auth.login(email, password);

      if (user) {
        localStorage.setItem('edu_has_logged_in', 'true');
        root.style.animation = 'loginFadeOut 0.4s ease forwards';
        setTimeout(() => {
          root.remove();
          document.getElementById('app-shell').style.display = '';
          onSuccess(user);
        }, 400);
      }
    } catch (err) {
      spinner.hidden = true;
      btnText.style.display = 'inline-block';
      root.querySelector('#login-submit').disabled = false;
      console.error('Autenticação detalhada:', err);

      let msg = 'E-mail ou senha incorretos.';
      if (typeof firebase === 'undefined') {
        msg = 'Erro de sistema: O Firebase não foi carregado corretamente. Verifique sua conexão com a Internet.';
      } else if (err.code) {
        if (err.code === 'auth/invalid-email') msg = 'E-mail inválido.';
        if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') msg = 'Credenciais incorretas.';
        if (err.code === 'auth/too-many-requests') msg = 'Muitas tentativas. Tente novamente mais tarde.';
        if (err.code === 'auth/network-request-failed') msg = 'Erro de rede: Sem conexão com os servidores do Firebase.';
      } else {
        msg = 'Erro ao conectar: ' + (err.message || 'Erro de rede desconhecido.');
      }

      showError(msg);
      pwdInput.value = '';
      pwdInput.focus();
    }
  });

  // Click handlers for links
  root.querySelector('#forgotPasswordLink').addEventListener('click', (e) => {
    e.preventDefault();

    const modalOverlay = document.createElement('div');
    modalOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(11, 43, 64, 0.4);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      opacity: 0;
      transition: opacity 0.3s cubic-bezier(0.25, 1, 0.5, 1);
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: #ffffff;
      padding: 2.5rem 2rem;
      border-radius: 24px;
      max-width: 480px;
      width: 90%;
      box-shadow: 0 30px 60px rgba(0, 0, 0, 0.25);
      border: 1px solid rgba(255, 255, 255, 0.1);
      transform: translateY(30px);
      transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);
      position: relative;
    `;

    modalContent.innerHTML = `
      <button id="close-recovery-btn" style="
        position: absolute;
        top: 20px;
        right: 20px;
        background: #f1f5f9;
        border: none;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #475569;
        font-weight: bold;
        font-size: 14px;
        transition: all 0.2s;
      ">✕</button>
      <h3 style="
        font-family: 'Poppins', sans-serif;
        color: #0B2B40;
        font-size: 1.4rem;
        font-weight: 700;
        margin-top: 0;
        margin-bottom: 1.2rem;
      ">Recuperação de Senha</h3>
      
      <div id="recovery-body">
        <p style="margin-bottom: 16px; color: #475569; line-height: 1.5; font-size: 0.95rem; text-align: justify;">
          Insira o seu e-mail de acesso cadastrado para redefinir sua senha:
        </p>
        <div style="margin-bottom: 16px; position: relative;">
          <input type="email" id="recovery-email-input" placeholder="Ex: aline@edupresenca.com ou aline@gmail.com" style="
            width: 100%;
            padding: 12px 16px;
            border-radius: 12px;
            border: 1px solid #cbd5e1;
            font-size: 0.95rem;
            outline: none;
            box-sizing: border-box;
            transition: all 0.2s;
          " />
          <div id="recovery-error-msg" style="color: #ef4444; font-size: 0.85rem; margin-top: 6px; display: none;"></div>
        </div>
        
        <button id="submit-recovery-btn" style="
          width: 100%;
          background: linear-gradient(135deg, #1F6E8C 0%, #0E4F64 100%);
          color: #ffffff;
          border: none;
          padding: 0.9rem;
          border-radius: 40px;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          box-shadow: 0 6px 14px rgba(31, 110, 140, 0.25);
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        ">
          <span id="recovery-btn-text">Enviar Instruções</span>
          <span id="recovery-spinner" style="
            display: none;
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top-color: #fff;
            animation: spin 0.8s linear infinite;
          "></span>
        </button>
        
        <div style="margin-top: 18px; font-size: 0.82rem; color: #64748b; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 14px; text-align: justify;">
          <strong>Como funciona a redefinição?</strong><br>
          • <strong>Contas @edupresenca.com:</strong> São institucionais e virtuais. Você enviará uma solicitação de redefinição imediata para o painel dos administradores e coordenadores da escola.<br>
          • <strong>E-mails pessoais (Gmail, Hotmail, etc.):</strong> Enviaremos um link oficial de redefinição de senha para sua caixa de entrada pessoal.
        </div>
      </div>
    `;

    // Add spinner style animation
    if (!document.getElementById('spin-anim')) {
      const style = document.createElement('style');
      style.id = 'spin-anim';
      style.textContent = `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }

    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    setTimeout(() => {
      modalOverlay.style.opacity = '1';
      modalContent.style.transform = 'translateY(0)';
    }, 10);

    const closeModal = () => {
      modalOverlay.style.opacity = '0';
      modalContent.style.transform = 'translateY(30px)';
      setTimeout(() => modalOverlay.remove(), 300);
    };

    modalOverlay.querySelector('#close-recovery-btn').addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });

    const emailInput = modalOverlay.querySelector('#recovery-email-input');
    const errorMsg = modalOverlay.querySelector('#recovery-error-msg');
    const submitBtn = modalOverlay.querySelector('#submit-recovery-btn');
    const btnText = modalOverlay.querySelector('#recovery-btn-text');
    const spinner = modalOverlay.querySelector('#recovery-spinner');

    // Handle input focus borders
    emailInput.addEventListener('focus', () => emailInput.style.borderColor = '#1F6E8C');
    emailInput.addEventListener('blur', () => emailInput.style.borderColor = '#cbd5e1');

    submitBtn.addEventListener('click', async () => {
      const email = emailInput.value.trim();
      errorMsg.style.display = 'none';

      if (!email) {
        errorMsg.textContent = 'Por favor, informe seu e-mail.';
        errorMsg.style.display = 'block';
        return;
      }

      // Check if it has corporate suffix
      if (email.toLowerCase().endsWith('@edupresenca.com')) {
        submitBtn.disabled = true;
        btnText.textContent = 'Enviando chamado...';
        spinner.style.display = 'inline-block';

        try {
          if (typeof firebase === 'undefined') {
            throw new Error('O Firebase não foi inicializado corretamente.');
          }

          // Register request in Firestore collection
          await firebase.firestore().collection('edu_solicitacoes_senha').add({
            email: email.toLowerCase(),
            dataSolicitacao: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'pendente'
          });

          modalOverlay.querySelector('#recovery-body').innerHTML = `
            <div style="text-align: center; padding: 10px 0;">
              <div style="
                width: 56px;
                height: 56px;
                background: rgba(30, 110, 140, 0.12);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 16px auto;
                color: #1F6E8C;
              ">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
              </div>
              <strong style="color: #0B2B40; font-size: 1.1rem; display: block; margin-bottom: 8px;">Solicitação Enviada!</strong>
              <p style="margin: 0 0 24px 0; font-size: 0.92rem; color: #475569; line-height: 1.6; text-align: justify;">
                A sua solicitação de redefinição de senha foi registrada com sucesso na nuvem de dados escolar.<br><br>
                Os coordenadores e administradores da escola foram notificados imediatamente em seus painéis de acesso para realizar a redefinição de sua senha de acesso institucional.
              </p>
              <button id="close-recovery-btn-success" style="
                width: 100%;
                background: linear-gradient(135deg, #1F6E8C 0%, #0E4F64 100%);
                color: #ffffff;
                border: none;
                padding: 0.9rem;
                border-radius: 40px;
                font-weight: 600;
                font-size: 0.95rem;
                cursor: pointer;
                transition: all 0.2s;
              ">Voltar ao Login</button>
            </div>
          `;
          modalOverlay.querySelector('#close-recovery-btn-success').addEventListener('click', closeModal);
        } catch (err) {
          submitBtn.disabled = false;
          btnText.textContent = 'Enviar Instruções';
          spinner.style.display = 'none';
          console.error('Erro ao enviar solicitação Firestore:', err);
          errorMsg.textContent = 'Erro ao enviar chamada. Verifique sua conexão com a Internet.';
          errorMsg.style.display = 'block';
        }
        return;
      }

      // If it's a personal email, trigger Firebase Auth reset
      submitBtn.disabled = true;
      btnText.textContent = 'Enviando...';
      spinner.style.display = 'inline-block';

      try {
        if (typeof firebase === 'undefined') {
          throw new Error('O Firebase não foi inicializado corretamente.');
        }

        await firebase.auth().sendPasswordResetEmail(email);

        modalOverlay.querySelector('#recovery-body').innerHTML = `
          <div style="text-align: center; padding: 10px 0;">
            <div style="
              width: 56px;
              height: 56px;
              background: rgba(34, 197, 94, 0.12);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 16px auto;
              color: #22c55e;
            ">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <strong style="color: #0B2B40; font-size: 1.1rem; display: block; margin-bottom: 8px;">Link enviado com sucesso!</strong>
            <p style="margin: 0 0 24px 0; font-size: 0.92rem; color: #475569; line-height: 1.6; text-align: justify;">
              Enviamos um e-mail com instruções e link de redefinição de senha para <strong>${email}</strong>.<br><br>
              Por favor, verifique a sua <strong>caixa de entrada</strong> e a sua pasta de <strong>spam/lixo eletrônico</strong>.
            </p>
            <button id="close-recovery-btn-success" style="
              width: 100%;
              background: linear-gradient(135deg, #1F6E8C 0%, #0E4F64 100%);
              color: #ffffff;
              border: none;
              padding: 0.9rem;
              border-radius: 40px;
              font-weight: 600;
              font-size: 0.95rem;
              cursor: pointer;
              transition: all 0.2s;
            ">Voltar ao Login</button>
          </div>
        `;
        modalOverlay.querySelector('#close-recovery-btn-success').addEventListener('click', closeModal);
      } catch (err) {
        submitBtn.disabled = false;
        btnText.textContent = 'Enviar Instruções';
        spinner.style.display = 'none';
        console.error('Erro de recuperação de senha:', err);

        let msg = 'Ocorreu um erro ao solicitar o envio do link. Verifique o e-mail digitado.';
        if (err.code === 'auth/user-not-found') {
          msg = 'Este e-mail não está cadastrado em nossa base.';
        } else if (err.code === 'auth/invalid-email') {
          msg = 'Formato de e-mail inválido.';
        } else if (err.code === 'auth/network-request-failed') {
          msg = 'Sem conexão com a Internet.';
        }

        errorMsg.textContent = msg;
        errorMsg.style.display = 'block';
      }
    });
  });

  root.querySelector('#signupLink').addEventListener('click', (e) => {
    e.preventDefault();
    showLoginModal(
      'Solicitação de Acesso',
      `<p style="margin-bottom: 12px;">O <strong>EduPresença</strong> é um sistema restrito para instituições de ensino cadastradas.</p>
       <p style="margin-bottom: 12px; padding: 10px; background: #f8fafc; border-radius: 10px; border-left: 4px solid #1F6E8C;">
         <strong>Deseja implantar o sistema na sua escola?</strong><br>
         Fale com o nosso time comercial pelo e-mail 
         <a href="mailto:leandroyata07@hotmail.com" style="color: #1F6E8C; font-weight: 600; text-decoration: none; border-bottom: 1px dashed #1F6E8C;">leandroyata07@hotmail.com</a> 
         para agendar uma demonstração gratuita!
       </p>
       <p style="margin-bottom: 0;">
         <strong>Se você é Professor ou Funcionário:</strong><br>
         As suas credenciais de acesso são liberadas pelo administrador escolar. Se ainda não possui cadastro, procure a <strong>secretaria da sua escola</strong>.
       </p>`
    );
  });

  // Auto-focus
  setTimeout(() => root.querySelector('#login-username').focus(), 100);

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
    errorEl.style.borderColor = 'rgba(239, 68, 68, 0.25)';
    errorEl.style.background = 'rgba(239, 68, 68, 0.08)';
    errorEl.style.color = '#b91c1c';
    errorEl.style.animation = 'none';
    requestAnimationFrame(() => { errorEl.style.animation = 'shake 0.4s ease'; });
  }

  function showInfo(msg) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
    errorEl.style.borderColor = 'rgba(59, 130, 246, 0.25)';
    errorEl.style.background = 'rgba(59, 130, 246, 0.08)';
    errorEl.style.color = '#1e3a8a';
    errorEl.style.animation = 'none';
  }

  function showLoginModal(title, contentHtml) {
    const modalOverlay = document.createElement('div');
    modalOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(11, 43, 64, 0.4);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      opacity: 0;
      transition: opacity 0.3s cubic-bezier(0.25, 1, 0.5, 1);
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
      background: #ffffff;
      padding: 2.5rem 2rem;
      border-radius: 24px;
      max-width: 480px;
      width: 90%;
      box-shadow: 0 30px 60px rgba(0, 0, 0, 0.25);
      border: 1px solid rgba(255, 255, 255, 0.1);
      transform: translateY(30px);
      transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);
      position: relative;
    `;

    modalContent.innerHTML = `
      <button id="close-modal-btn" style="
        position: absolute;
        top: 20px;
        right: 20px;
        background: #f1f5f9;
        border: none;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #475569;
        font-weight: bold;
        font-size: 14px;
        transition: all 0.2s;
      ">✕</button>
      <h3 style="
        font-family: 'Poppins', sans-serif;
        color: #0B2B40;
        font-size: 1.4rem;
        font-weight: 700;
        margin-top: 0;
        margin-bottom: 1.2rem;
      ">${title}</h3>
      <div style="
        color: #475569;
        font-size: 0.95rem;
        line-height: 1.6;
        margin-bottom: 1.8rem;
        text-align: justify;
      ">${contentHtml}</div>
      <button id="confirm-modal-btn" style="
        width: 100%;
        background: linear-gradient(135deg, #1F6E8C 0%, #0E4F64 100%);
        color: #ffffff;
        border: none;
        padding: 0.9rem;
        border-radius: 40px;
        font-weight: 600;
        font-size: 0.95rem;
        cursor: pointer;
        box-shadow: 0 6px 14px rgba(31, 110, 140, 0.25);
        transition: all 0.2s;
      ">Entendido</button>
    `;

    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    setTimeout(() => {
      modalOverlay.style.opacity = '1';
      modalContent.style.transform = 'translateY(0)';
    }, 10);

    const closeModal = () => {
      modalOverlay.style.opacity = '0';
      modalContent.style.transform = 'translateY(30px)';
      setTimeout(() => {
        modalOverlay.remove();
      }, 300);
    };

    modalOverlay.querySelector('#close-modal-btn').addEventListener('click', closeModal);
    modalOverlay.querySelector('#confirm-modal-btn').addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });

    const closeBtn = modalOverlay.querySelector('#close-modal-btn');
    closeBtn.addEventListener('mouseenter', () => closeBtn.style.background = '#e2e8f0');
    closeBtn.addEventListener('mouseleave', () => closeBtn.style.background = '#f1f5f9');

    const confirmBtn = modalOverlay.querySelector('#confirm-modal-btn');
    confirmBtn.addEventListener('mouseenter', () => confirmBtn.style.filter = 'brightness(1.1)');
    confirmBtn.addEventListener('mouseleave', () => confirmBtn.style.filter = 'none');
  }
}

function injectLoginStyles() {
  if (document.getElementById('login-styles')) return;
  const style = document.createElement('style');
  style.id = 'login-styles';
  style.textContent = `
    @keyframes loginFadeOut { to { opacity:0; transform:scale(0.98); } }
    @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 75%{transform:translateX(8px)} }
    @keyframes loginIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
    @keyframes spinnerAnim { to{transform:rotate(360deg)} }

    #login-root { position:fixed;inset:0;z-index:9999; }

    .theme-toggle-login {
        position: absolute;
        top: 24px;
        right: 24px;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: var(--bg-surface, #ffffff);
        border: 1px solid var(--border-color, rgba(0,0,0,0.1));
        color: var(--text-primary, #1e293b);
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0,0,0,0.08));
    }
    .theme-toggle-login:hover {
        background: var(--bg-surface-2, #f1f5f9);
        transform: scale(1.05);
    }
    .theme-toggle-login svg {
        transition: transform 0.2s ease;
    }
    .theme-toggle-login:active svg {
        transform: scale(0.9);
    }

    .split-screen {
        display: grid;
        grid-template-columns: 1fr 1fr;
        min-height: 100vh;
        width: 100%;
        font-family: var(--font-sans, 'Inter', sans-serif);
        background: var(--login-bg-gradient, linear-gradient(135deg, #eff6ff 0%, #f8fafc 50%));
        position: relative;
        overflow: hidden;
    }

    .split-screen::before {
        content: "";
        position: absolute;
        top: 20%;
        left: 5%;
        width: 280px;
        height: 280px;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 50%;
        pointer-events: none;
        z-index: 1;
    }
    .split-screen::after {
        content: "";
        position: absolute;
        bottom: 10%;
        left: 42%;
        width: 340px;
        height: 340px;
        background: rgba(255, 255, 255, 0.02);
        border-radius: 50%;
        pointer-events: none;
        z-index: 1;
    }

    /* ========= LADO ESQUERDO - INFORMAÇÕES ========= */
    .info-side {
        background: transparent;
        color: #ffffff;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 3rem 2.5rem;
        position: relative;
        overflow-y: auto;
        z-index: 2;
    }

    .info-container {
        max-width: 500px;
        width: 100%;
        z-index: 2;
    }

    .logo-area {
        margin-bottom: 2rem;
        display: flex;
        align-items: center;
        gap: 12px;
        opacity: 0;
        animation: loginIn 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        animation-delay: 0.05s;
    }
    .logo-area h1 {
        font-family: var(--font-display, 'Poppins', sans-serif);
        font-size: 2.4rem;
        font-weight: 700;
        letter-spacing: -0.5px;
        background: linear-gradient(120deg, #FFFFFF, #93c5fd);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin: 0;
    }

    .tagline {
        font-size: 1.15rem;
        font-weight: 500;
        margin-bottom: 2rem;
        border-left: 4px solid var(--primary-400, #60a5fa);
        padding-left: 1rem;
        color: rgba(255, 255, 255, 0.9);
        display: flex;
        align-items: center;
        line-height: 1.4;
        opacity: 0;
        animation: loginIn 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        animation-delay: 0.15s;
    }

    .features-grid {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        margin: 2rem 0;
    }

    .feature-item {
        display: flex;
        align-items: center;
        gap: 1.2rem;
        background: rgba(255, 255, 255, 0.04);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        padding: 0.9rem 1.2rem;
        border-radius: 20px;
        transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        border: 1px solid rgba(255, 255, 255, 0.08);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        animation: loginIn 0.8s cubic-bezier(0.25, 1, 0.5, 1) backwards;
    }
    .feature-item:nth-child(1) { animation-delay: 0.25s; }
    .feature-item:nth-child(2) { animation-delay: 0.35s; }
    .feature-item:nth-child(3) { animation-delay: 0.45s; }
    .feature-item:nth-child(4) { animation-delay: 0.55s; }

    .feature-item:hover {
        background: rgba(255, 255, 255, 0.08);
        transform: translateX(6px) translateY(-1px);
        border-color: rgba(255, 255, 255, 0.15);
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
    }
    .feature-text h3 {
        font-size: 1.05rem;
        font-weight: 600;
        margin-bottom: 4px;
        color: #ffffff;
    }
    .feature-text p {
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.7);
        line-height: 1.4;
        margin: 0;
    }

    .depoimento {
        background: rgba(0, 0, 0, 0.2);
        padding: 1.2rem 1.5rem;
        border-radius: 20px;
        margin-top: 1rem;
        border-left: 3px solid var(--primary-400, #60a5fa);
        opacity: 0;
        animation: loginIn 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        animation-delay: 0.65s;
    }
    .depoimento p {
        font-style: italic;
        font-weight: 500;
        margin-bottom: 6px;
        font-size: 0.95rem;
        line-height: 1.4;
        color: rgba(255, 255, 255, 0.95);
    }
    .depoimento span {
        font-size: 0.8rem;
        display: block;
        color: var(--primary-300, #93c5fd);
    }

    .info-footer-badges {
        margin-top: 1.5rem;
        font-size: 0.78rem;
        display: flex;
        gap: 1.2rem;
        justify-content: flex-start;
        flex-wrap: wrap;
        opacity: 0;
        animation: loginIn 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        animation-delay: 0.75s;
        color: rgba(255, 255, 255, 0.6);
    }

    /* ========= LADO DIREITO - LOGIN ========= */
    .login-side {
        background: transparent;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 2rem;
        position: relative;
        z-index: 2;
    }

    .login-form-blob {
      position: absolute;
      width: 450px;
      height: 450px;
      background: radial-gradient(circle, var(--bg-active, rgba(37, 99, 235, 0.05)) 0%, transparent 70%);
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      filter: blur(50px);
    }

    .login-card-container {
      display: flex;
      flex-direction: column;
      width: 100%;
      max-width: 440px;
      z-index: 2;
    }

    .login-card {
        background: var(--login-card-bg, #ffffff);
        border-radius: 2rem;
        box-shadow: var(--shadow-lg);
        border: 1px solid var(--login-card-border, rgba(0, 0, 0, 0.06));
        padding: 2.8rem 2.2rem;
        width: 100%;
        animation: loginIn 0.6s ease-out;
    }

    .login-brand {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100px;
        margin-bottom: 24px;
    }
    .login-brand svg {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        opacity: 0.15;
        z-index: 1;
        pointer-events: none;
    }
    .login-brand span {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 2.2rem;
        font-weight: 800;
        color: var(--primary-600, #2563eb);
        letter-spacing: -0.5px;
        z-index: 2;
    }

    .login-header {
        text-align: center;
        margin-bottom: 2rem;
    }
    .login-header h2 {
        font-family: var(--font-display, 'Poppins', sans-serif);
        font-size: 1.7rem;
        font-weight: 700;
        color: var(--text-primary, #0f172a);
        margin-bottom: 8px;
    }
    .login-header p {
        color: var(--text-secondary, #475569);
        font-size: 0.9rem;
        margin: 0;
    }

    .login-error {
      display: flex; align-items: center; gap: 8px;
      background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2);
      color: var(--danger-600, #dc2626); font-size: 12.5px; padding: 10px 14px; border-radius: 12px; margin-bottom: 18px;
      line-height: 1.4; transition: all 0.2s;
    }
    .login-error[hidden] {
      display: none !important;
    }

    .input-group {
        margin-bottom: 1.8rem;
        position: relative;
    }
    .input-group label {
        position: absolute;
        left: 14px;
        top: 50%;
        transform: translateY(-50%);
        font-weight: 500;
        font-size: 0.95rem;
        color: var(--text-secondary, #475569);
        display: flex;
        align-items: center;
        gap: 6px;
        pointer-events: none;
        transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
        transform-origin: left top;
    }
    .input-group input {
        width: 100%;
        padding: 1.35rem 1rem 0.65rem;
        border: 1.5px solid var(--border-strong, #cbd5e1);
        border-radius: 14px;
        font-size: 0.95rem;
        font-family: inherit;
        transition: all 0.2s ease;
        background-color: var(--bg-surface, #ffffff);
        outline: none;
        color: var(--text-primary, #0f172a);
    }
    .input-group input:focus {
        border-color: var(--primary-500, #3b82f6);
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
    }
    
    /* Efeito de Label Flutuante */
    .input-group input:focus ~ label,
    .input-group input:not(:placeholder-shown) ~ label {
        top: 6px;
        transform: translateY(0) scale(0.78);
        color: var(--primary-500, #3b82f6);
        font-weight: 600;
    }

    .login-eye {
      position: absolute; 
      right: 14px; 
      top: 50%; 
      transform: translateY(-50%);
      background: none; 
      border: none; 
      color: var(--text-tertiary, #94a3b8); 
      cursor: pointer; 
      padding: 4px;
      display: flex; 
      align-items: center; 
      transition: color 0.15s;
      z-index: 5;
    }
    .login-eye:hover { color: var(--text-secondary, #475569); }

    .options {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 0.5rem 0 1.8rem;
        font-size: 0.85rem;
    }
    .options label {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--text-secondary, #475569);
        cursor: pointer;
    }
    .options a {
        color: var(--primary-600, #2563eb);
        text-decoration: none;
        font-weight: 600;
        transition: 0.2s;
    }
    .options a:hover {
        color: var(--primary-700, #1d4ed8);
        text-decoration: underline;
    }

    .login-spinner {
      width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff; border-radius: 50%;
      animation: spinnerAnim 0.7s linear infinite;
      display: inline-block;
    }

    button[type="submit"] {
        width: 100%;
        background: var(--gradient-primary);
        border: none;
        padding: 0.9rem;
        border-radius: 40px;
        font-weight: 700;
        font-size: 1rem;
        font-family: inherit;
        color: white;
        cursor: pointer;
        transition: 0.2s;
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
        margin-bottom: 1.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
    }
    button[type="submit"]:hover:not(:disabled) {
        filter: brightness(1.05);
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(37, 99, 235, 0.3);
    }
    button[type="submit"]:active {
        transform: translateY(1px);
    }
    button[type="submit"]:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

    .signup-link {
        text-align: center;
        font-size: 0.85rem;
        color: var(--text-secondary, #475569);
    }
    .signup-link a {
        color: var(--primary-600, #2563eb);
        font-weight: 600;
        text-decoration: none;
    }
    .signup-link a:hover {
        color: var(--primary-700, #1d4ed8);
        text-decoration: underline;
    }

    .login-footer {
      font-size: 11px;
      color: var(--text-secondary, #475569);
      margin-top: 2rem;
      text-align: center;
      width: 100%;
    }

    /* RESPONSIVIDADE: empilhar colunas verticalmente em telas menores */
    @media (max-width: 880px) {
        .split-screen {
            grid-template-columns: 1fr;
            grid-auto-rows: auto;
        }
        .info-side {
            display: none;
        }
        .login-side {
            background: var(--login-bg-gradient);
            padding: 1.5rem 1rem;
            min-height: 100vh;
        }
        .login-card {
            border-radius: 1.5rem;
            padding: 2.2rem 1.5rem;
            box-shadow: var(--shadow-md);
            border: 1px solid var(--border-color);
        }
    }
  `;
  document.head.appendChild(style);
}
