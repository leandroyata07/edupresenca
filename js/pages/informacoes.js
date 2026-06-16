// =========================================================
// EduPresença – Informações Page
// =========================================================

export function render(outlet) {
    outlet.innerHTML = `
    <div class="stagger-children">
      <div class="page-header">
        <div class="page-header-left">
          <h1 class="page-title">Informações</h1>
          <p class="page-subtitle">Manual, apresentação do sistema e dados do desenvolvedor</p>
        </div>
      </div>

      <!-- Tabs -->
      <div class="info-tabs" id="info-tabs">
        <button class="info-tab active" data-tab="apresentacao">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
          Apresentação
        </button>
        <button class="info-tab" data-tab="manual">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          Manual
        </button>
        <button class="info-tab" data-tab="sistema">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
          Sistema
        </button>
        <button class="info-tab" data-tab="desenvolvedor">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Desenvolvedor
        </button>
      </div>

      <div id="info-panel"></div>
    </div>`;

    injectStyles();

    const tabs = outlet.querySelectorAll('.info-tab');
    const panel = outlet.querySelector('#info-panel');

    function activate(name) {
        tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === name));
        renderPanel(name, panel);
    }

    tabs.forEach(t => t.addEventListener('click', () => activate(t.dataset.tab)));
    activate('apresentacao');
}

// ── Panels ────────────────────────────────────────────────
function renderPanel(tab, panel) {
    const fn = { apresentacao, manual, sistema, desenvolvedor };
    panel.innerHTML = '';
    fn[tab]?.(panel);
}

// ── Apresentação ──────────────────────────────────────────
function apresentacao(panel) {
    panel.innerHTML = `
    <div class="info-hero">
      <div class="info-hero-icon">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
        </svg>
      </div>
      <div>
        <h2 class="info-hero-title">EduPresença</h2>
        <p class="info-hero-sub">Sistema de Gestão Escolar — PWA</p>
      </div>
    </div>

    <div class="info-grid">
      <div class="card">
        <div class="card-header"><span class="card-title">O que é o EduPresença?</span></div>
        <div class="card-body info-text">
          <p>O <strong>EduPresença</strong> é um sistema de gestão escolar completo desenvolvido como <strong>Progressive Web App (PWA)</strong>,
          funcionando diretamente no navegador sem necessidade de instalação — e pode ser instalado no dispositivo para uso offline.</p>
          <p>Foi criado para centralizar as principais atividades administrativas e pedagógicas de instituições de ensino,
          proporcionando uma experiência moderna, rápida e intuitiva.</p>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><span class="card-title">Principais Funcionalidades</span></div>
        <div class="card-body">
          <ul class="info-feature-list">
            ${[
            ['Alunos', 'Cadastro completo com foto, CPF, RG, endereço e vínculo de unidade'],
            ['Turmas & Cursos', 'Organização pedagógica por turma, curso, turno e unidade'],
            ['Presença', 'Registro de frequência por turma e data com visão calendário'],
            ['Notas', 'Lançamento de notas por disciplina e período com cálculo automático'],
            ['Relatórios', 'Exportação em PDF e CSV de frequência e desempenho'],
            ['Usuários', 'Sistema de autenticação com perfis (Admin, Professor, Secretaria, Coordenador)'],
            ['Backup', 'Exportação/importação local de todos os dados em JSON'],
        ].map(([t, d]) => `
              <li>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span><strong>${t}</strong> — ${d}</span>
              </li>`).join('')}
          </ul>
        </div>
      </div>
    </div>`;
}

// ── Manual ────────────────────────────────────────────────
function manual(panel) {
    const sections = [
        {
            icon: `<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>`,
            title: '1. Primeiros Passos',
            steps: [
                'Acesse o sistema e faça login com <strong>admin / admin123</strong>.',
                'Vá em <strong>Configurações → Minha Conta</strong> para alterar a senha padrão.',
                'Cadastre as <strong>Unidades</strong> (escolas) antes de criar turmas.',
                'Cadastre <strong>Turnos</strong> (Manhã, Tarde, Noite) e <strong>Cursos</strong>.',
                'Crie as <strong>Turmas</strong> vinculando curso e turno.',
                'Cadastre os <strong>Alunos</strong> vinculando-os às turmas.',
            ]
        },
        {
            icon: `<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>`,
            title: '2. Registrando Presença',
            steps: [
                'Acesse o menu <strong>Presença</strong>.',
                'Selecione a turma e a data.',
                'Marque os alunos presentes ou ausentes.',
                'Salve o registro — os dados ficam salvos localmente.',
            ]
        },
        {
            icon: `<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>`,
            title: '3. Lançando Notas',
            steps: [
                'Acesse o menu <strong>Notas</strong>.',
                'Selecione a turma, disciplina e período.',
                'Insira as notas de cada aluno.',
                'A situação (Aprovado / Recuperação / Reprovado) é calculada automaticamente.',
            ]
        },
        {
            icon: `<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>`,
            title: '4. Relatórios e Exportação',
            steps: [
                'Acesse o menu <strong>Relatórios</strong>.',
                'Visualize frequência por turma e desempenho por disciplina.',
                'Exporte em <strong>PDF</strong> (formatado com cabeçalho) ou <strong>CSV</strong> para planilhas.',
                'Alunos com frequência abaixo de 75% aparecem em destaque.',
            ]
        },
        {
            icon: `<polyline points="21 15 21 21 15 21"/><path d="M21 21l-6-6"/><polyline points="3 9 3 3 9 3"/><path d="M3 3l6 6"/>`,
            title: '5. Backup dos Dados',
            steps: [
                'Acesse <strong>Configurações → Backup & Restauração</strong>.',
                'Clique em <strong>Baixar Backup (.json)</strong> para salvar todos os dados no computador.',
                'Para restaurar, clique em <strong>Selecionar arquivo…</strong> e escolha um backup anterior.',
                '<strong>Atenção:</strong> a restauração substitui todos os dados atuais.',
            ]
        },
    ];

    panel.innerHTML = `
    <div class="info-manual">
      ${sections.map(s => `
        <div class="card info-manual-card">
          <div class="info-manual-header">
            <div class="info-manual-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${s.icon}</svg>
            </div>
            <h3 class="info-manual-title">${s.title}</h3>
          </div>
          <ol class="info-steps">
            ${s.steps.map(step => `<li>${step}</li>`).join('')}
          </ol>
        </div>`).join('')}
    </div>`;
}

// ── Sistema ───────────────────────────────────────────────
function sistema(panel) {
    panel.innerHTML = `
    <div class="info-grid">
      <div class="card">
        <div class="card-header"><span class="card-title">Informações Técnicas</span></div>
        <div class="card-body">
          ${[
            ['Nome', 'EduPresença'],
            ['Versão', '1.0.2'],
            ['Tipo', 'Progressive Web App (PWA)'],
            ['Linguagem', 'JavaScript ES2022+ (Vanilla)'],
            ['Armazenamento', 'localStorage (100% local, sem servidor)'],
            ['Autenticação', 'SHA-256 via Web Crypto API'],
            ['Exportação PDF', 'jsPDF + jsPDF-AutoTable'],
            ['Service Worker', 'Cache-first strategy'],
            ['Compatibilidade', 'Chrome 90+, Edge 90+, Firefox 90+, Safari 15+'],
        ].map(([k, v]) => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px">
              <span style="color:var(--text-secondary)">${k}</span>
              <strong style="color:var(--text-primary)">${v}</strong>
            </div>`).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-header"><span class="card-title">Tecnologias Utilizadas</span></div>
        <div class="card-body">
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            ${['HTML5', 'CSS3 Custom Properties', 'JavaScript Modules', 'Web Components', 'Shadow DOM', 'Service Workers', 'Cache API', 'Web Crypto API', 'localStorage', 'sessionStorage', 'FileReader API', 'jsPDF', 'PWA Manifest'].map(t =>
            `<span class="badge badge-primary">${t}</span>`
        ).join('')}
          </div>
        </div>
      </div>
    </div>`;
}

// ── Desenvolvedor ─────────────────────────────────────────
function desenvolvedor(panel) {
    panel.innerHTML = `
    <div class="info-dev-wrap">
      <div class="info-dev-card">
        <!-- Avatar -->
        <img src="ly.png" class="info-dev-avatar" id="dev-photo" alt="Leandro Oliveira Lima" style="cursor:zoom-in" />
        
        <div class="info-dev-header">
            <span class="info-dev-tag">Desenvolvido por</span>
            <h2 class="info-dev-name">Leandro Oliveira Lima</h2>
        </div>

        <!-- Social Icons Row -->
        <div class="info-dev-social">
          <a href="mailto:leandroyata@hotmail.com" class="social-btn email" title="E-mail">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </a>

          <a href="https://wa.me/5575991902534" target="_blank" class="social-btn whatsapp" title="WhatsApp" rel="noopener">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
          </a>

          <a href="https://www.instagram.com/leandroyata07_" target="_blank" class="social-btn instagram" title="Instagram" rel="noopener">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
          </a>

          <a href="https://www.linkedin.com/in/leandro-oliveira-lima-27140149/" target="_blank" class="social-btn linkedin" title="LinkedIn" rel="noopener">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          </a>

          <a href="https://www.leandroyata.com.br" target="_blank" class="social-btn website" title="Site" rel="noopener">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          </a>
        </div>

        <div class="info-dev-divider"></div>

        <div class="info-dev-footer">
          <p>© 2026 EDUPRESENÇA.</p>
          <p>TODOS OS DIREITOS RESERVADOS.</p>
          <p>VERSÃO 1.0.2 PREMIUM EDITION</p>
        </div>
      </div>
    </div>`;

    // Zoom effect
    panel.querySelector('#dev-photo')?.addEventListener('click', (e) => {
        const overlay = document.createElement('div');
        overlay.id = 'photo-zoom-overlay';
        overlay.innerHTML = `
            <div class="zoom-backdrop"></div>
            <img src="${e.target.src}" class="zoom-img" />
            <button class="zoom-close">×</button>
        `;
        document.body.appendChild(overlay);

        const close = () => {
            overlay.classList.add('closing');
            overlay.addEventListener('animationend', () => overlay.remove(), { once: true });
        };
        overlay.addEventListener('click', close);
        document.addEventListener('keydown', (ek) => { if (ek.key === 'Escape') close(); }, { once: true });
    });
}

// ── Injected Styles ───────────────────────────────────────
function injectStyles() {
    if (document.getElementById('info-styles')) return;
    const s = document.createElement('style');
    s.id = 'info-styles';
    s.textContent = `
    /* Tabs */
    .info-tabs { display:flex;gap:4px;flex-wrap:wrap;margin-bottom:24px;
      background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);
      border-radius:12px;padding:4px; }
    .info-tab { display:flex;align-items:center;gap:7px;padding:9px 16px;border:none;
      background:transparent;color:var(--text-secondary);font-size:13px;font-weight:500;
      border-radius:9px;cursor:pointer;transition:all 0.15s;font-family:inherit; }
    .info-tab:hover { color:var(--text-primary);background:rgba(255,255,255,0.05); }
    .info-tab.active { background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;
      box-shadow:0 4px 12px rgba(99,102,241,0.35); }

    /* Grid */
    .info-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(380px,1fr));gap:20px; }
    @media(max-width:640px){.info-grid{grid-template-columns:1fr;}}

    /* Hero */
    .info-hero { display:flex;align-items:center;gap:20px;margin-bottom:24px;
      background:linear-gradient(135deg,rgba(79,70,229,0.15),rgba(124,58,237,0.1));
      border:1px solid rgba(99,102,241,0.2);border-radius:16px;padding:24px 28px; }
    .info-hero-icon { width:72px;height:72px;border-radius:20px;flex-shrink:0;
      background:linear-gradient(135deg,#4f46e5,#7c3aed);
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 8px 32px rgba(99,102,241,0.4); }
    .info-hero-title { font-size:28px;font-weight:800;color:var(--text-primary);
      font-family:var(--font-display,'Plus Jakarta Sans',sans-serif);margin:0 0 4px; }
    .info-hero-sub { font-size:14px;color:var(--text-tertiary);margin:0; }

    /* Text */
    .info-text p { font-size:14px;color:var(--text-secondary);line-height:1.7;margin:0 0 12px; }
    .info-text p:last-child{margin:0;}

    /* Feature list */
    .info-feature-list { list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:10px; }
    .info-feature-list li { display:flex;align-items:flex-start;gap:10px;font-size:13px;color:var(--text-secondary); }
    .info-feature-list li svg { color:#818cf8;flex-shrink:0;margin-top:2px; }

    /* Manual */
    .info-manual { display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:16px; }
    @media(max-width:640px){.info-manual{grid-template-columns:1fr;}}
    .info-manual-card { padding:0!important; }
    .info-manual-card .card-body { padding:20px 24px; }
    .info-manual-header { display:flex;align-items:center;gap:12px;padding:18px 24px 0; }
    .info-manual-icon { width:36px;height:36px;border-radius:10px;
      background:rgba(99,102,241,0.15);color:#818cf8;
      display:flex;align-items:center;justify-content:center;flex-shrink:0; }
    .info-manual-title { font-size:15px;font-weight:700;color:var(--text-primary);margin:0; }
    .info-steps { padding-left:20px;margin:16px 0 0;display:flex;flex-direction:column;gap:8px; }
    .info-steps li { font-size:13px;color:var(--text-secondary);line-height:1.6; }

    /* Developer card */
    .info-dev-wrap { display:flex;justify-content:center;padding:8px 0; }
    .info-dev-card { 
      background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);
      border-radius:24px;padding:40px 32px;width:100%;max-width:520px;text-align:center; }
    .info-dev-avatar { 
      width:88px;height:88px;border-radius:50%;margin:0 auto 16px;
      background:linear-gradient(135deg,#4f46e5,#7c3aed);
      display:block;object-fit:cover;
      box-shadow:0 12px 40px rgba(99,102,241,0.45);
      border:3px solid rgba(99,102,241,0.3); }
    .info-dev-name { font-size:26px;font-weight:800;color:var(--text-primary);margin:0;
      font-family:var(--font-display,'Plus Jakarta Sans',sans-serif); }
    .info-dev-header { margin-bottom: 28px; }
    .info-dev-tag { display:block; font-size:11px; font-weight:800; color:#60a5fa; text-transform:uppercase; letter-spacing:0.12em; margin-bottom:4px; }
    
    .info-dev-social { display:flex; justify-content:center; gap:14px; margin-bottom:32px; }
    .social-btn { width:52px; height:52px; border-radius:14px; display:flex; align-items:center; justify-content:center;
                  color:#fff; text-decoration:none; transition:all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
    .social-btn:hover { transform:translateY(-4px) scale(1.05); box-shadow:0 8px 20px rgba(0,0,0,0.3); }
    
    .social-btn.email { background:#2563eb; }
    .social-btn.whatsapp { background:#15803d; }
    .social-btn.instagram { background:linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); }
    .social-btn.linkedin { background:#0a66c2; }
    .social-btn.website { background:#334155; }

    .info-dev-divider { height:1px; background:rgba(255,255,255,0.06); width:100%; margin-bottom:24px; }
    .info-dev-footer { font-size:11px; color:var(--text-tertiary); line-height:1.8; text-align:center; font-weight:700; letter-spacing:0.02em; }
    .info-dev-footer p { margin:0; }

    /* Zoom Overlay */
    #photo-zoom-overlay { position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;animation:zoom-fade-in 0.25s ease; }
    .zoom-backdrop { position:fixed;inset:0;background:rgba(0,0,0,0.85);backdrop-filter:blur(10px); }
    .zoom-img { position:relative;z-index:1;max-width:90vw;max-height:90vh;border-radius:16px;box-shadow:0 32px 100px rgba(0,0,0,0.8);animation:zoom-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);border:4px solid rgba(255,255,255,0.1); }
    .zoom-close { position:fixed;top:20px;right:20px;width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,0.1);border:none;color:#fff;font-size:24px;cursor:pointer;z-index:2;display:flex;align-items:center;justify-content:center;transition:all 0.2s; }
    .zoom-close:hover { background:rgba(255,255,255,0.2);transform:rotate(90deg); }
    #photo-zoom-overlay.closing { animation:zoom-fade-out 0.2s ease forwards; }
    #photo-zoom-overlay.closing .zoom-img { animation:zoom-out 0.2s ease forwards; }

    @keyframes zoom-fade-in { from{opacity:0} to{opacity:1} }
    @keyframes zoom-fade-out { from{opacity:1} to{opacity:0} }
    @keyframes zoom-in { from{opacity:0;transform:scale(0.8)} to{opacity:1;transform:scale(1)} }
    @keyframes zoom-out { from{opacity:1;transform:scale(1)} to{opacity:0;transform:scale(0.9)} }
  `;
    document.head.appendChild(s);
}
