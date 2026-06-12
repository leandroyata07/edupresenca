// =========================================================
// EduPresença – Configurações Page
// =========================================================
import { auth, usuarios, config, addLog, getAnoLetivo, pushAllToCloud, syncFromCloud, triggerCloudSync, KEYS, isSyncUser } from '../store.js';
import { escapeHtml, getInitials, roleLabel, showConfirm, showSecureConfirm, compressImage } from '../utils.js';
import { render as renderLogs } from './logs.js';
import { render as renderInfo } from './informacoes.js';


function showLoadingOverlay(message = 'Gravando alterações na nuvem...') {
  const overlay = document.createElement('div');
  overlay.id = 'sync-loading-overlay';
  overlay.style = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(15, 23, 42, 0.7);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 20px;
    z-index: 99999;
    color: #fff;
    font-family: var(--font-sans, sans-serif);
    transition: opacity 0.2s ease;
  `;
  
  overlay.innerHTML = `
    <div style="position:relative; display:flex; align-items:center; justify-content:center; width:80px; height:80px;">
      <div style="position:absolute; width:100%; height:100%; border:4px solid rgba(255,255,255,0.08); border-top-color:#4f46e5; border-radius:50%; animation:spin 1s linear infinite;"></div>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2.5" style="animation: pulse 1.5s ease-in-out infinite;">
        <path d="M17.5 19A4.5 4.5 0 0 0 22 14.5c0-2.43-1.94-4.4-4.36-4.47A6.5 6.5 0 0 0 5 11.5 5 5 0 0 0 6.5 21"/>
        <polyline points="16 16 12 12 8 16"/>
        <line x1="12" y1="12" x2="12" y2="21"/>
      </svg>
    </div>
    <div style="display:flex; flex-direction:column; align-items:center; gap:6px; text-align:center; padding:0 24px;">
      <span style="font-size:16px; font-weight:700; color:#fff; letter-spacing:0.02em;">${escapeHtml(message)}</span>
      <span style="font-size:12.5px; color:rgba(255,255,255,0.5);">Isso pode levar alguns segundos dependendo da sua conexão e do tamanho da foto.</span>
    </div>
    <style>
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes pulse { 0%, 100% { opacity: 0.6; transform: scale(0.95); } 50% { opacity: 1; transform: scale(1.05); } }
    </style>
  `;
  
  document.body.appendChild(overlay);
  return {
    close: () => {
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 200);
    }
  };
}

let modal;

export function render(outlet) {
  if (!document.getElementById('cfg-modal')) {
    modal = document.createElement('app-modal');
    modal.id = 'cfg-modal';
    document.body.appendChild(modal);
  } else { modal = document.getElementById('cfg-modal'); }

  const user = auth.currentUser();

  outlet.innerHTML = `
    <div class="stagger-children">
      <div class="page-header">
        <div class="page-header-left">
          <h1 class="page-title">Configurações</h1>
          <p class="page-subtitle">Gerencie usuários, dados e preferências do sistema</p>
        </div>
      </div>

      <!-- Tabs -->
      <div class="cfg-tabs" id="cfg-tabs">
        <button class="cfg-tab active" data-tab="conta">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Minha Conta
        </button>
        ${auth.isGestor() ? `
        <button class="cfg-tab" data-tab="senha-pedidos">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Solicitações de Senha
        </button>
        ` : ''}
        ${auth.isAdmin() ? `
        <button class="cfg-tab" data-tab="usuarios">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Usuários
        </button>
        <button class="cfg-tab" data-tab="backup">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          Backup & Restauração
        </button>
        <button class="cfg-tab" data-tab="feriados">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Feriados
        </button>
        <button class="cfg-tab" data-tab="sistema">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
          Sistema
        </button>
        <button class="cfg-tab" data-tab="logs">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          Logs de Auditoria
        </button>
        ` : ''}
        <button class="cfg-tab" data-tab="informacoes">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          Informações
        </button>
      </div>

      <!-- Tab Panels -->
      <div id="cfg-panel"></div>
    </div>
  `;

  injectTabStyles(outlet);

  const tabs = outlet.querySelectorAll('.cfg-tab');
  const panel = outlet.querySelector('#cfg-panel');

  function activateTab(name) {
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === name));
    renderPanel(name, panel, user);
  }

  tabs.forEach(t => t.addEventListener('click', () => activateTab(t.dataset.tab)));
  const defaultTab = window.app?.configDefaultTab || 'conta';
  if (window.app) window.app.configDefaultTab = null;
  activateTab(defaultTab);
}

// ── Panel Renderer ────────────────────────────────────────
function renderPanel(tab, panel, user) {
  panel.innerHTML = '';
  if (tab === 'conta') renderConta(panel, user);
  if (tab === 'senha-pedidos') renderSenhaPedidos(panel);
  if (tab === 'usuarios') renderUsuarios(panel);
  if (tab === 'backup') renderBackup(panel);
  if (tab === 'feriados') renderFeriados(panel);
  if (tab === 'sistema') renderSistema(panel);
  if (tab === 'logs') renderLogs(panel);
  if (tab === 'informacoes') renderInfo(panel);
}

// ── Conta ─────────────────────────────────────────────────
function renderConta(panel, user) {
  let fotoData = user?.foto || null;
  const hue = (user?.nome || 'A').charCodeAt(0) * 15 % 360;
  const initials = getInitials(user?.nome || 'Admin');
  
  const getAvatarHtml = (imgData) => imgData
    ? `<img src="${imgData}" style="width:72px;height:72px;border-radius:50%;object-fit:cover" />`
    : `<div style="width:72px;height:72px;border-radius:50%;background:hsl(${hue},65%,45%);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:#fff">${initials}</div>`;

  panel.innerHTML = `
    <div class="cfg-grid">
      <!-- Profile Card -->
      <div class="card">
        <div class="card-header"><span class="card-title">Dados de Perfil</span></div>
        <div class="card-body">
          <form id="conta-form" novalidate>
            <!-- Photo Row -->
            <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px">
              <div id="c-foto-preview" style="flex-shrink:0;cursor:pointer">${getAvatarHtml(fotoData)}</div>
              <div>
                <div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px">Foto de perfil (opcional)</div>
                <div style="display:flex;gap:6px;align-items:center">
                  <label class="btn btn-ghost btn-sm" style="cursor:pointer;display:inline-flex;align-items:center;gap:6px">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    Alterar foto
                    <input type="file" id="c-foto" accept="image/*" style="display:none" />
                  </label>
                  <button type="button" class="btn btn-ghost btn-sm" id="c-foto-remove" style="color:var(--danger-400);${fotoData ? '' : 'display:none'}">Remover</button>
                </div>
              </div>
            </div>

            <div class="form-grid" style="--fg-cols:1; gap:16px">
              <div class="form-group">
                <label class="form-label">Nome completo <span class="required">*</span></label>
                <input class="form-control" name="nome" type="text" placeholder="Seu nome" value="${escapeHtml(user?.nome || '')}" required />
              </div>
              
              <div class="form-group">
                <label class="form-label">E-mail de Login (Institucional)</label>
                <div style="position:relative">
                  <input class="form-control" type="text" value="${escapeHtml(user?.email || '')}" disabled style="background:var(--bg-tertiary);color:var(--text-tertiary);padding-right:32px;cursor:not-allowed" />
                  <span style="position:absolute;right:12px;top:50%;transform:translateY(-50%);color:var(--text-tertiary)" title="E-mail de acesso não alterável">🔒</span>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">E-mail Pessoal / Alternativo</label>
                <input class="form-control" name="emailPessoal" type="email" placeholder="exemplo@gmail.com" value="${escapeHtml(user?.emailPessoal || '')}" />
              </div>

              <div class="form-group">
                <label class="form-label">Telefone / WhatsApp</label>
                <input class="form-control" id="c-telefone" name="telefone" type="text" placeholder="(99) 99999-9999" value="${escapeHtml(user?.telefone || '')}" />
              </div>

              <button type="submit" class="btn btn-primary" id="btn-save-conta" style="width:fit-content;margin-top:8px">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                Salvar Perfil
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Change password card -->
      <div class="card">
        <div class="card-header"><span class="card-title">Alterar Senha</span></div>
        <div class="card-body">
          <div class="form-grid" style="--fg-cols:1; gap:16px">
            <div class="form-group">
              <label class="form-label">Nova senha</label>
              <input class="form-control" id="cfg-new-pwd" type="password" placeholder="Mínimo 6 caracteres" />
            </div>
            <div class="form-group">
              <label class="form-label">Confirmar nova senha</label>
              <input class="form-control" id="cfg-confirm-pwd" type="password" placeholder="Repita a senha" />
            </div>
            <button class="btn btn-primary" id="btn-change-pwd" style="width:fit-content;margin-top:8px">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              Salvar nova senha
            </button>
          </div>
        </div>
      </div>
    </div>`;

  // Photo uploading behavior
  const fileInput = panel.querySelector('#c-foto');
  const previewEl = panel.querySelector('#c-foto-preview');
  const removeBtn = panel.querySelector('#c-foto-remove');

  previewEl?.addEventListener('click', () => {
    if (fotoData) {
      window.showAvatarLightbox?.(fotoData, user.nome);
    }
  });

  fileInput?.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;
    try {
      fotoData = await compressImage(file, 200, 0.7);
      if (previewEl) previewEl.innerHTML = getAvatarHtml(fotoData);
      if (removeBtn) removeBtn.style.display = 'inline-block';
    } catch (err) {
      console.error('Erro ao processar imagem:', err);
    }
  });

  removeBtn?.addEventListener('click', () => {
    fotoData = null;
    if (previewEl) previewEl.innerHTML = getAvatarHtml(null);
    if (removeBtn) removeBtn.style.display = 'none';
  });

  // Phone masking
  const phoneInput = panel.querySelector('#c-telefone');
  phoneInput?.addEventListener('input', (e) => {
    let x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
    e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
  });

  // Form saving handler
  const formEl = panel.querySelector('#conta-form');
  formEl?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(formEl));
    if (!data.nome?.trim()) {
      window.toast?.error('Campo obrigatório', 'Preencha o seu nome completo.');
      return;
    }

    const saveBtn = panel.querySelector('#btn-save-conta');
    const originalText = saveBtn ? saveBtn.innerHTML : '';
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span class="loading loading-spinner loading-sm"></span> Processando...';
    }

    try {
      // Update locally and trigger cloud sync
      usuarios.update(user.id, {
        nome: data.nome.trim(),
        emailPessoal: data.emailPessoal?.trim() || '',
        telefone: data.telefone?.trim() || '',
        foto: fotoData
      });

      if (isSyncUser() && typeof firebase !== 'undefined' && firebase.firestore) {
        triggerCloudSync(KEYS.usuarios, usuarios.getAll());
      }

      // Fetch the updated user record to obtain the converted Storage URL
      const latestUser = usuarios.getById(user.id) || user;

      // Update active session
      const me = auth.currentUser();
      const updatedUser = {
        ...me,
        nome: latestUser.nome,
        emailPessoal: latestUser.emailPessoal,
        telefone: latestUser.telefone,
        foto: latestUser.foto
      };
      sessionStorage.setItem('edu_session', JSON.stringify(updatedUser));
      
      // Update active UI elements
      document.querySelector('app-header')?.setUser?.(updatedUser);
      document.querySelector('app-sidebar')?.setUser?.(updatedUser);

      renderConta(panel, updatedUser);

      await showConfirm(modal, {
        title: 'Perfil Atualizado!',
        message: 'Seus dados pessoais e foto de perfil foram salvos e sincronizados com a nuvem com sucesso!',
        confirmText: 'Excelente',
        cancelText: '',
        type: 'success'
      });
    } catch (err) {
      console.error('Erro ao salvar conta:', err);
      window.toast?.error('Erro', 'Não foi possível salvar o perfil.');
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalText;
      }
    }
  });

  panel.querySelector('#btn-change-pwd').addEventListener('click', async () => {
    const p1 = panel.querySelector('#cfg-new-pwd').value;
    const p2 = panel.querySelector('#cfg-confirm-pwd').value;
    if (!p1 || p1.length < 6) { window.toast?.error('Senha inválida', 'Mínimo de 6 caracteres.'); return; }
    if (p1 !== p2) { window.toast?.error('Senhas diferentes', 'A confirmação não confere.'); return; }
    
    const confirmed = await showConfirm(modal, {
      title: 'Alterar Senha',
      message: 'Você tem certeza que deseja alterar sua senha de acesso?',
      confirmText: 'Alterar Senha'
    });
    if (!confirmed) return;

    await auth.changePassword(user.id, p1);
    addLog('UPDATE', 'Configuração', { acao: 'Alteração de senha própria' });
    panel.querySelector('#cfg-new-pwd').value = '';
    panel.querySelector('#cfg-confirm-pwd').value = '';
    window.toast?.success('Senha alterada!', 'Sua senha foi atualizada com sucesso.');
  });
}

// ── Usuários ──────────────────────────────────────────────
function renderUsuarios(panel) {
  function refresh() {
    const list = usuarios.getAll().sort((a, b) => a.nome.localeCompare(b.nome));
    panel.innerHTML = `
      <div id="cfg-tab-usuarios" class="cfg-content">
        <div class="page-header" style="margin-bottom:20px">
          <div>
            <h3 style="margin:0">Perfis de Acesso</h3>
            <p style="font-size:13px;color:var(--text-secondary);margin:4px 0 0">
              Gerencie os perfis dos profissionais que utilizam o sistema.
            </p>
          </div>
        </div>

        <div class="alert alert-info" style="margin-bottom:24px; font-size:13px; line-height:1.5">
          <strong>Informação:</strong> Os perfis listados abaixo são registros locais para identificação no sistema. O cadastro de novos profissionais pode ser realizado pelo botão abaixo.
        </div>
      
        <div class="card">
        <div class="card-header">
          <span class="card-title">Usuários do Sistema</span>
          <button class="btn btn-primary btn-sm" id="btn-novo-user">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Novo Usuário
          </button>
        </div>
        <div class="table-wrapper">
          <table>
            <thead><tr>
              <th>Nome</th><th>E-mail de Acesso</th><th>Contato / Tel</th><th>Perfil</th><th>Ações</th>
            </tr></thead>
            <tbody>
              ${list.length === 0 ? `<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--text-tertiary)">Nenhum usuário.</td></tr>` :
        list.map(u => {
          const hue = u.nome.charCodeAt(0) * 15 % 360;
          const initials = u.nome.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
          const avatarEl = u.foto
            ? `<img src="${u.foto}" style="width:32px;height:32px;border-radius:50%;object-fit:cover" />`
            : `<div style="width:32px;height:32px;border-radius:50%;background:hsl(${hue},65%,45%);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#fff;flex-shrink:0">${initials}</div>`;
          return `
                  <tr>
                    <td>
                      <div style="display:flex;align-items:center;gap:10px">
                        ${avatarEl}
                        <strong>${escapeHtml(u.nome)}</strong>
                      </div>
                    </td>
                    <td style="color:var(--text-secondary)">${escapeHtml(u.email || '—')}</td>
                    <td style="color:var(--text-secondary)">${escapeHtml(u.telefone || '—')}</td>
                    <td><span class="badge ${u.role === 'admin' ? 'badge-primary' : 'badge-neutral'} badge-dot">${roleLabel(u.role)}</span></td>
                    <td>
                      <div style="display:flex;gap:6px">
                        <button class="btn btn-ghost btn-sm" data-edit="${u.id}" title="Editar">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          Editar
                        </button>
                        ${(u.id !== 'admin-fixed-id' && u.username !== 'admin') ? `
                        <button class="btn btn-ghost btn-sm" data-del="${u.id}" style="color:var(--danger-400)" title="Excluir">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                          Excluir
                        </button>` : ''}
                      </div>
                    </td>
                  </tr>`;
        }).join('')}
            </tbody>
          </table>
        </div>
      </div>`;

    panel.querySelector('#btn-novo-user').addEventListener('click', () => openUserForm(null, refresh));
    panel.querySelectorAll('[data-edit]').forEach(btn =>
      btn.addEventListener('click', () => openUserForm(usuarios.getById(btn.dataset.edit), refresh)));
    panel.querySelectorAll('[data-del]').forEach(btn =>
      btn.addEventListener('click', () => confirmDeleteUser(btn.dataset.del, refresh)));
  }
  refresh();
}

function openUserForm(user, onSave) {
  const isEdit = !!user;
  let fotoData = user?.foto || null;
  const hue0 = (user?.nome || 'N').charCodeAt(0) * 15 % 360;
  const initials0 = user ? user.nome.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() : '?';

  const photoPreviewHtml = fotoData
    ? `<img src="${fotoData}" style="width:72px;height:72px;border-radius:50%;object-fit:cover" />`
    : `<div style="width:72px;height:72px;border-radius:50%;background:hsl(${hue0},65%,45%);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:#fff">${initials0}</div>`;

  const isPersonalEmail = user?.email && !user.email.endsWith('@edupresenca.com');
  const emailVal = user?.email ? (user.email.endsWith('@edupresenca.com') ? user.email.slice(0, -16) : user.email) : '';

  const body = `
    <form id="user-form" novalidate>
      <!-- Photo row -->
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px">
        <div id="u-foto-preview" style="flex-shrink:0">${photoPreviewHtml}</div>
        <div>
          <div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px">Foto de perfil (opcional)</div>
          <label class="btn btn-ghost btn-sm" style="cursor:pointer;display:inline-flex;align-items:center;gap:6px">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            Selecionar foto
            <input type="file" id="u-foto" accept="image/*" style="display:none" />
          </label>
          ${fotoData ? `<button type="button" class="btn btn-ghost btn-sm" id="u-foto-remove" style="margin-left:6px;color:var(--danger-400)">Remover</button>` : ''}
        </div>
      </div>
      <div class="form-grid">
        <div class="form-group full-width">
          <label class="form-label">Nome completo <span class="required">*</span></label>
          <input class="form-control" id="u-nome" name="nome" type="text" placeholder="Nome do usuário"
            value="${escapeHtml(user?.nome || '')}" required />
        </div>
        
        <div class="form-group full-width">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <label class="form-label" style="margin-bottom:0;">E-mail de Acesso <span class="required">*</span></label>
            <label style="display:inline-flex; align-items:center; gap:6px; font-size:12px; cursor:pointer; user-select:none; color:var(--text-secondary);">
              <input type="checkbox" id="u-is-personal" ${isPersonalEmail ? 'checked' : ''} style="cursor:pointer;" />
              E-mail pessoal / externo
            </label>
          </div>
          <div id="email-input-container" style="display:flex; align-items:stretch;">
            <input class="form-control" id="u-email" name="email" type="text" placeholder="aline.costa"
              value="${escapeHtml(emailVal)}" required style="border-top-right-radius:0; border-bottom-right-radius:0; flex:1;" />
            <span id="email-suffix" style="display:flex; align-items:center; padding:0 12px; background:var(--bg-tertiary); border:1px solid var(--border-color); border-left:none; border-top-right-radius:var(--border-radius); border-bottom-right-radius:var(--border-radius); font-size:13px; color:var(--text-secondary); white-space:nowrap; user-select:none;">@edupresenca.com</span>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Perfil <span class="required">*</span></label>
          <select class="form-control" id="u-role" name="role">
            <option value="admin"       ${user?.role === 'admin' ? 'selected' : ''}>Administrador</option>
            <option value="professor"   ${user?.role === 'professor' ? 'selected' : ''}>Professor</option>
            <option value="secretaria"  ${user?.role === 'secretaria' ? 'selected' : ''}>Secretário(a)</option>
            <option value="coordenador" ${user?.role === 'coordenador' ? 'selected' : ''}>Coordenador</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">E-mail Pessoal / Alternativo</label>
          <input class="form-control" id="u-email-pessoal" name="emailPessoal" type="email" placeholder="professor.pessoal@gmail.com"
            value="${escapeHtml(user?.emailPessoal || '')}" />
        </div>

        <div class="form-group">
          <label class="form-label">Telefone / WhatsApp</label>
          <input class="form-control" id="u-telefone" name="telefone" type="text" placeholder="(99) 99999-9999"
            value="${escapeHtml(user?.telefone || '')}" />
        </div>

        ${!isEdit ? `
        <div class="form-group full-width">
          <label class="form-label">Senha inicial</label>
          <input class="form-control" id="u-pwd" name="password" type="password" placeholder="Padrão: senha123" />
          <span class="form-help">Se vazio, usará <strong>senha123</strong></span>
        </div>` : ''}
      </div>
    </form>`;

  const footer = `
    <button class="btn btn-ghost" id="m-cancel">Cancelar</button>
    <button class="btn btn-primary" id="m-save">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      ${isEdit ? 'Salvar' : 'Criar usuário'}
    </button>`;

  modal.open({ title: isEdit ? 'Editar Usuário' : 'Novo Usuário', body, footer });

  // Photo picker
  const bodyEl = modal.shadowRoot.getElementById('modal-body');
  const fileInput = bodyEl?.querySelector('#u-foto');
  const preview = bodyEl?.querySelector('#u-foto-preview');
  const removeBtn = bodyEl?.querySelector('#u-foto-remove');

  fileInput?.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;
    try {
      fotoData = await compressImage(file, 200, 0.7);
      if (preview) preview.innerHTML = `<img src="${fotoData}" style="width:72px;height:72px;border-radius:50%;object-fit:cover" />`;
    } catch (err) {
      console.error('Erro ao processar imagem:', err);
    }
  });
  removeBtn?.addEventListener('click', () => {
    fotoData = null;
    const hue = (user?.nome || 'N').charCodeAt(0) * 15 % 360;
    const init = user ? user.nome.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() : '?';
    if (preview) preview.innerHTML = `<div style="width:72px;height:72px;border-radius:50%;background:hsl(${hue},65%,45%);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:#fff">${init}</div>`;
    if (removeBtn) removeBtn.style.display = 'none';
  });

  // Dynamic E-mail field suffix/placeholder management
  const isPersonalCheck = bodyEl?.querySelector('#u-is-personal');
  const emailInput = bodyEl?.querySelector('#u-email');
  const emailSuffix = bodyEl?.querySelector('#email-suffix');

  function updateEmailFieldUI() {
    if (isPersonalCheck?.checked) {
      if (emailSuffix) emailSuffix.style.display = 'none';
      if (emailInput) {
        emailInput.style.borderTopRightRadius = 'var(--border-radius)';
        emailInput.style.borderBottomRightRadius = 'var(--border-radius)';
        emailInput.placeholder = 'email@exemplo.com';
        if (user?.email && user.email.endsWith('@edupresenca.com') && emailInput.value === user.email.slice(0, -16)) {
          emailInput.value = user.email;
        }
      }
    } else {
      if (emailSuffix) emailSuffix.style.display = 'flex';
      if (emailInput) {
        emailInput.style.borderTopRightRadius = '0';
        emailInput.style.borderBottomRightRadius = '0';
        emailInput.placeholder = 'aline.costa';
        if (emailInput.value.endsWith('@edupresenca.com')) {
          emailInput.value = emailInput.value.slice(0, -16);
        }
      }
    }
  }

  isPersonalCheck?.addEventListener('change', updateEmailFieldUI);
  updateEmailFieldUI(); // Initial check

  // Phone masking
  const phoneInput = bodyEl?.querySelector('#u-telefone');
  phoneInput?.addEventListener('input', (e) => {
    let x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
    e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
  });

  modal.shadowRoot.getElementById('m-cancel')?.addEventListener('click', () => modal.close());
  modal.shadowRoot.getElementById('m-save')?.addEventListener('click', async (e) => {
    const saveBtn = e.currentTarget;
    const originalText = saveBtn.innerHTML;

    const data = modal.getFormData('#user-form');
    
    // Resolve email
    let finalEmail = data.email?.trim();
    if (!finalEmail) {
      window.toast?.error('Campo obrigatório', 'O e-mail de acesso é obrigatório.');
      return;
    }
    
    const isPersonal = modal.shadowRoot.getElementById('u-is-personal')?.checked;
    if (!isPersonal) {
      // Append corporate suffix if not already present
      if (!finalEmail.includes('@')) {
        finalEmail = `${finalEmail}@edupresenca.com`;
      }
    }
    
    // Validate final e-mail format
    if (!finalEmail.includes('@') || finalEmail.length < 5) {
      window.toast?.error('E-mail inválido', 'Digite um e-mail válido.');
      return;
    }
    
    // Auto-generate username from email prefix
    const generatedUsername = finalEmail.split('@')[0];
    
    if (!data.nome?.trim()) {
      window.toast?.error('Campos obrigatórios', 'Preencha o nome completo.');
      return;
    }
    
    const resolvedUserData = {
      nome: data.nome,
      username: generatedUsername,
      email: finalEmail,
      role: data.role,
      telefone: data.telefone || '',
      emailPessoal: data.emailPessoal || ''
    };

    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="loading loading-spinner loading-sm"></span> Processando...';

    try {
      if (isEdit) {
        // Security: Check if demoting the last admin
        const allUsers = usuarios.getAll();
        const adminCount = allUsers.filter(u => u.role === 'admin').length;
        const me = auth.currentUser();
        
        if (user.id === me.id && user.role === 'admin' && data.role !== 'admin' && adminCount <= 1) {
          window.toast?.error('Ação bloqueada', 'Você é o único administrador. Promova outro usuário a Admin antes de mudar seu perfil.');
          saveBtn.disabled = false;
          saveBtn.innerHTML = originalText;
          return;
        }

        const confirmed = await showConfirm(modal, {
          title: 'Confirmar Alteração',
          message: `Deseja salvar as alterações no perfil de <strong>${escapeHtml(data.nome)}</strong>?`,
          confirmText: 'Salvar alterações'
        });
        
        if (!confirmed) {
          saveBtn.disabled = false;
          saveBtn.innerHTML = originalText;
          return;
        }

        usuarios.update(user.id, { ...resolvedUserData, foto: fotoData });
        if (isSyncUser() && typeof firebase !== 'undefined' && firebase.firestore) {
          triggerCloudSync(KEYS.usuarios, usuarios.getAll());
        }
        addLog('UPDATE', 'Usuário', { id: user.id, nome: data.nome });
        
        // If editing yourself, update session
        if (me && (me.id === user.id || me.email === user.email || me.username === user.username)) {
          const updated = { ...me, ...resolvedUserData, foto: fotoData };
          sessionStorage.setItem('edu_session', JSON.stringify(updated));
          document.querySelector('app-header')?.setUser?.(updated);
          document.querySelector('app-sidebar')?.setUser?.(updated);

          const activeTabEl = document.querySelector('.cfg-tab.active');
          const panelEl = document.getElementById('cfg-panel');
          if (activeTabEl?.dataset?.tab === 'conta' && panelEl) {
            renderConta(panelEl, updated);
          }
        }
        
        modal.close();
        onSave();

        await showConfirm(modal, {
          title: 'Usuário Atualizado!',
          message: `Os dados do perfil de <strong>${escapeHtml(resolvedUserData.nome)}</strong> foram atualizados com sucesso!`,
          confirmText: 'Entendido',
          cancelText: '',
          type: 'success'
        });
      } else {
        await auth.createUser({ ...resolvedUserData, password: data.password || 'senha123', foto: fotoData });
        addLog('CREATE', 'Usuário', { nome: data.nome, role: data.role });
        
        modal.close();
        onSave();

        await showConfirm(modal, {
          title: 'Usuário Criado!',
          message: `O perfil de <strong>${escapeHtml(resolvedUserData.nome)}</strong> foi criado com sucesso!<br><br><strong>E-mail de acesso:</strong> ${escapeHtml(finalEmail)}<br><strong>Senha inicial:</strong> ${escapeHtml(data.password || 'senha123')}`,
          confirmText: 'Excelente, Entendido',
          cancelText: '',
          type: 'success'
        });
      }
    } catch (err) {
      console.error('Erro ao salvar usuário:', err);
      window.toast?.error('Erro', 'Falha ao processar a operação.');
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalText;
      }
    }
  });
}

async function confirmDeleteUser(id, onSave) {
  const u = usuarios.getById(id);
  const me = auth.currentUser();
  if (u?.id === me?.id) { window.toast?.error('Ação bloqueada', 'Você não pode excluir sua própria conta.'); return; }
  
  const result = await showSecureConfirm(modal, {
    title: 'Excluir Usuário',
    message: `Tem certeza que deseja excluir o usuário <strong>${escapeHtml(u?.nome)}</strong>? Esta ação é irreversível e exige sua senha.`,
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>`,
    confirmText: 'Excluir permanentemente'
  });

  if (result) {
    usuarios.delete(id);
    if (isSyncUser() && typeof firebase !== 'undefined' && firebase.firestore) {
      triggerCloudSync(KEYS.usuarios, usuarios.getAll());
    }
    addLog('DELETE', 'Usuário', { nome: u.nome });
    onSave();
    window.toast?.success('Excluído!', `${u.nome} foi removido.`);
  }
}

// ── Backup & Restauração ──────────────────────────────────
function renderBackup(panel) {
  // Compute stats
  const lastBackup = localStorage.getItem('edu_last_backup');
  const lastBackupStr = lastBackup
    ? new Date(lastBackup).toLocaleString('pt-BR')
    : 'Nunca realizado';
  const storageKeys = ['edu_alunos','edu_turmas','edu_presencas','edu_notas','edu_cursos','edu_unidades','edu_turnos','edu_disciplinas'];
  const counts = {};
  let totalBytes = 0;
  storageKeys.forEach(k => {
    const raw = localStorage.getItem(k) || '[]';
    totalBytes += raw.length;
    try { counts[k] = JSON.parse(raw).length; } catch { counts[k] = 0; }
  });
  const storagKB = (totalBytes / 1024).toFixed(1);
  const totalRecords = Object.values(counts).reduce((a,b)=>a+b,0);

  const user = auth.currentUser();
  const isSyncConfigured = isSyncUser();
  const isFirebaseLoaded = typeof firebase !== 'undefined' && firebase.firestore;
  const isSyncActive = isSyncConfigured && isFirebaseLoaded;

  panel.innerHTML = `
    <div class="cfg-grid">

      <!-- Stats banner -->
      <div class="card" style="grid-column:1/-1;background:linear-gradient(135deg,rgba(99,102,241,0.08),rgba(124,58,237,0.06));border-color:rgba(99,102,241,0.2)">
        <div class="card-body" style="display:flex;align-items:center;gap:28px;flex-wrap:wrap;padding:18px 24px">
          <div style="display:flex;flex-direction:column;gap:2px">
            <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-tertiary)">Último Backup</span>
            <strong id="last-backup-info" style="font-size:15px;color:var(--text-primary)">${lastBackupStr}</strong>
          </div>
          <div style="width:1px;height:36px;background:rgba(255,255,255,0.1)"></div>
          <div style="display:flex;flex-direction:column;gap:2px">
            <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-tertiary)">Total de Registros</span>
            <strong style="font-size:15px;color:var(--text-primary)">${totalRecords}</strong>
          </div>
          <div style="width:1px;height:36px;background:rgba(255,255,255,0.1)"></div>
          <div style="display:flex;flex-direction:column;gap:2px">
            <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-tertiary)">Armazenamento</span>
            <strong style="font-size:15px;color:var(--text-primary)">${storagKB} KB</strong>
          </div>
          <div style="width:1px;height:36px;background:rgba(255,255,255,0.1)"></div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;flex:1;justify-content:flex-end">
            ${storageKeys.map(k => {
              const label = {edu_alunos:'Alunos',edu_turmas:'Turmas',edu_presencas:'Presenças',edu_notas:'Notas',edu_cursos:'Cursos',edu_unidades:'Unidades',edu_turnos:'Turnos',edu_disciplinas:'Disciplinas'}[k] || k;
              return `<span style="font-size:12px;color:var(--text-secondary)"><strong>${counts[k]}</strong> ${label}</span>`;
            }).join('&ensp;·&ensp;')}
          </div>
        </div>
      </div>

      <!-- Firebase Cloud Sync Card -->
      <div class="card" style="${isSyncActive ? 'border-color: rgba(16,185,129,0.3); background: rgba(16,185,129,0.02); grid-column: 1/-1;' : (isSyncConfigured ? 'border-color: rgba(239,68,68,0.3); background: rgba(239,68,68,0.02); grid-column: 1/-1;' : 'grid-column: 1/-1;')}">
        <div class="card-header">
          <span class="card-title" style="display:flex;align-items:center;gap:8px">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="${isSyncActive ? 'color:#10b981;' : (isSyncConfigured ? 'color:var(--danger-400, #ef4444);' : 'color:var(--text-tertiary);')}"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            Sincronização Firebase Cloud
          </span>
        </div>
        <div class="card-body">
          ${isSyncConfigured ? (
            isFirebaseLoaded ? `
              <p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;line-height:1.6">
                O perfil <strong style="color:var(--text-primary)">${escapeHtml(user?.email || '')}</strong> está com a sincronização automática ativa! Qualquer alteração nos alunos, turmas ou chamadas é salva em tempo real na nuvem do Firebase. As fotos são salvas no Firebase Storage.
              </p>
              <div style="display:flex;align-items:center;gap:8px;color:#10b981;font-size:13px;font-weight:600;margin-top:12px;">
                <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#10b981;box-shadow:0 0 8px #10b981;"></span>
                Sincronização ativa e automática em segundo plano
              </div>
            ` : `
              <p style="font-size:13px;color:var(--danger-400, #ef4444);margin-bottom:8px;line-height:1.6;font-weight:600;">
                ⚠️ Conexão de Nuvem Inativa (Firebase Bloqueado)
              </p>
              <p style="font-size:12.5px;color:var(--text-secondary);line-height:1.5;margin-bottom:12px;max-width:800px;">
                O navegador (como o Helium Browser) ou uma extensão do seu navegador (como Adblock/uBlock) bloqueou o carregamento dos scripts do Google Firebase. 
                O sistema funcionará normalmente de forma local neste dispositivo, mas <strong>nenhum cadastro novo será salvo na nuvem</strong> e seus dados locais poderão ser substituídos quando você acessar em outro navegador funcional.
              </p>
              <div style="display:flex;align-items:center;gap:8px;color:var(--danger-400, #ef4444);font-size:13px;font-weight:600;margin-top:12px;">
                <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#ef4444;box-shadow:0 0 8px #ef4444;"></span>
                Sincronização bloqueada pelo navegador/adblocker
              </div>
            `
          ) : `
            <p style="font-size:13px;color:var(--text-tertiary);line-height:1.6">
              Sincronização em nuvem inativa para esta conta local. Faça login com o perfil de administrador em nuvem (<strong style="color:var(--text-secondary)">admin@leandroyata.com.br</strong>) para ativar o salvamento automático no Firebase.
            </p>
          `}
        </div>
      </div>

      <!-- Local backup -->
      <div class="card">
        <div class="card-header"><span class="card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
          Backup Local
        </span></div>
        <div class="card-body">
          <p style="font-size:13px;color:var(--text-secondary);margin-bottom:16px;line-height:1.6">
            Exporta todos os dados do sistema (alunos, turmas, presenças, notas) para um arquivo <strong>.json</strong> no seu computador.
          </p>
          <button class="btn btn-primary" id="btn-backup-local">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Baixar Backup (.json)
          </button>
        </div>
      </div>

      <!-- Restaurar -->
      <div class="card">
        <div class="card-header"><span class="card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          Restaurar Dados
        </span></div>
        <div class="card-body">
          <p style="font-size:13px;color:var(--text-secondary);margin-bottom:16px;line-height:1.6">
            Importa um arquivo de backup <strong>.json</strong> gerado pelo EduPresença. Os dados atuais serão <strong style="color:#f87171">substituídos</strong>.
          </p>
          <label class="btn btn-secondary" style="cursor:pointer">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Selecionar arquivo…
            <input type="file" id="restore-file" accept=".json" style="display:none" />
          </label>
          <span id="restore-filename" style="font-size:12px;color:var(--text-tertiary);margin-left:8px"></span>
        </div>
      </div>

      <!-- Google Drive -->
      <div class="card">
        <div class="card-header"><span class="card-title">
          <svg width="16" height="16" viewBox="0 0 87.3 78" fill="currentColor" style="color:#4285f4">
            <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H.1c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
            <path d="M43.65 25L29.9 1.2C28.55 2 27.4 3.1 26.6 4.5L1.3 48.4c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
            <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.85 11.2z" fill="#ea4335"/>
            <path d="M43.65 25L57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
            <path d="M59.8 52.9H27.5L13.75 76.7c1.35.8 2.9 1.25 4.5 1.25h50.8c1.6 0 3.15-.45 4.5-1.25z" fill="#2684fc"/>
            <path d="M73.4 26.5l-12.65-21.9c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25l16.15 27.9H87.2c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
          </svg>
          Google Drive
        </span></div>
        <div class="card-body">
          <div class="cfg-cloud-info">
            <p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;line-height:1.6">
              Salve e restaure backups diretamente no seu Google Drive. Requer autorização OAuth2.
            </p>
            <div class="form-group" style="margin-bottom:12px">
              <label class="form-label">Google OAuth2 Client ID</label>
              <input class="form-control" id="gdrive-client-id" type="text" placeholder="000000.apps.googleusercontent.com"
                value="${localStorage.getItem('edu_gdrive_client_id') || ''}" />
              <span class="form-help">Obtenha em <a href="https://console.cloud.google.com/" target="_blank" style="color:#818cf8">console.cloud.google.com</a> → APIs → Credenciais</span>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button class="btn btn-primary btn-sm" id="btn-gdrive-save">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Salvar no Drive
              </button>
              <button class="btn btn-ghost btn-sm" id="btn-gdrive-restore">Restaurar do Drive</button>
            </div>
          </div>
        </div>
      </div>

      <!-- OneDrive -->
      <div class="card">
        <div class="card-header"><span class="card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:#0078d4">
            <path d="M3 15a4 4 0 0 0 4 4h9a5 5 0 1 0-.1-9.999 5.002 5.002 0 0 0-9.78 2.096A4.001 4.001 0 0 0 3 15z" stroke="#0078d4" fill="rgba(0,120,212,0.15)"/>
          </svg>
          OneDrive
        </span></div>
        <div class="card-body">
          <p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;line-height:1.6">
            Salve e restaure backups no seu OneDrive / Microsoft 365.
          </p>
          <div class="form-group" style="margin-bottom:12px">
            <label class="form-label">Azure App Client ID</label>
            <input class="form-control" id="onedrive-client-id" type="text" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value="${localStorage.getItem('edu_onedrive_client_id') || ''}" />
            <span class="form-help">Obtenha em <a href="https://portal.azure.com/" target="_blank" style="color:#818cf8">portal.azure.com</a> → Azure AD → Registros de aplicativo</span>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn btn-primary btn-sm" id="btn-onedrive-save" style="background:linear-gradient(135deg,#0078d4,#106ebe)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Salvar no OneDrive
            </button>
            <button class="btn btn-ghost btn-sm" id="btn-onedrive-restore">Restaurar do OneDrive</button>
          </div>
        </div>
      </div>
    </div>`;

  // Local backup
  panel.querySelector('#btn-backup-local').addEventListener('click', doLocalBackup);

  // Restore from file
  panel.querySelector('#restore-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    panel.querySelector('#restore-filename').textContent = file.name;
    const reader = new FileReader();
    reader.onload = (ev) => {
      confirmRestore(ev.target.result);
    };
    reader.readAsText(file);
  });

  // Google Drive
  panel.querySelector('#btn-gdrive-save').addEventListener('click', () => {
    const clientId = panel.querySelector('#gdrive-client-id').value.trim();
    if (!clientId) { window.toast?.error('Client ID necessário', 'Configure o OAuth2 Client ID do Google.'); return; }
    localStorage.setItem('edu_gdrive_client_id', clientId);
    doGDriveBackup(clientId);
  });
  panel.querySelector('#btn-gdrive-restore').addEventListener('click', () => {
    const clientId = panel.querySelector('#gdrive-client-id').value.trim();
    if (!clientId) { window.toast?.error('Client ID necessário', 'Configure o OAuth2 Client ID do Google.'); return; }
    localStorage.setItem('edu_gdrive_client_id', clientId);
    doGDriveRestore(clientId);
  });

  // OneDrive
  panel.querySelector('#btn-onedrive-save').addEventListener('click', () => {
    const clientId = panel.querySelector('#onedrive-client-id').value.trim();
    if (!clientId) { window.toast?.error('Client ID necessário', 'Configure o Azure App Client ID.'); return; }
    localStorage.setItem('edu_onedrive_client_id', clientId);
    doOneDriveBackup(clientId);
  });
  panel.querySelector('#btn-onedrive-restore').addEventListener('click', () => {
    const clientId = panel.querySelector('#onedrive-client-id').value.trim();
    if (!clientId) { window.toast?.error('Client ID necessário', 'Configure o Azure App Client ID.'); return; }
    localStorage.setItem('edu_onedrive_client_id', clientId);
    doOneDriveRestore(clientId);
  });
}

// ── Sistema ───────────────────────────────────────────────
function renderSistema(panel) {
  const user = auth.currentUser();
  const isRealAdmin = user && user.role === 'admin' && user.email !== 'teste@edupresenca.com';
  const pkg = { version: '1.0.2', build: new Date().toLocaleDateString('pt-BR') };
  const cfg = (function() { try { return JSON.parse(localStorage.getItem('edu_config') || '{}'); } catch { return {}; } })();
  const pesos = Array.isArray(cfg.pesoBimestres) && cfg.pesoBimestres.length === 4 ? cfg.pesoBimestres : [1, 1, 1, 1];

  panel.innerHTML = `
    <div class="cfg-grid">

      <!-- Fórmula de Média -->
      <div class="card" style="grid-column:1/-1">
        <div class="card-header">
          <span class="card-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
            </svg>
            Fórmula de Média — Pesos por Bimestre
          </span>
        </div>
        <div class="card-body">
          <p style="font-size:12px;color:var(--text-tertiary);margin-bottom:16px">
            Defina o peso de cada bimestre no cálculo da média final. Valores maiores aumentam a influência do bimestre.
            Exemplo: dar mais peso ao 4º bimestre. Padrão: pesos iguais (1 cada).
          </p>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:14px;margin-bottom:16px">
            ${['1º Bimestre','2º Bimestre','3º Bimestre','4º Bimestre'].map((label, i) => `
            <div class="form-group" style="margin-bottom:0">
              <label class="form-label">${label}</label>
              <input class="form-control" type="number" id="peso-bim-${i}" min="0" max="10" step="0.5"
                value="${pesos[i]}" style="text-align:center;font-size:16px;font-weight:700" />
            </div>`).join('')}
          </div>
          <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
            <span style="font-size:12px;color:var(--text-tertiary)">Total: <strong id="peso-total">${pesos.reduce((a,b)=>a+b,0).toFixed(1)}</strong>
              <span style="font-size:11px;margin-left:6px">(&equiv; ${pesos.map(p => ((p / pesos.reduce((a,b)=>a+b,0.001))*100).toFixed(0)+'%').join(' / ')})</span>
            </span>
            <button class="btn btn-primary btn-sm" id="btn-salvar-pesos">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              Salvar pesos
            </button>
            <button class="btn btn-ghost btn-sm" id="btn-resetar-pesos">Restaurar padrão</button>
          </div>
        </div>
      </div>

      <!-- Tempo de Uso do Perfil de Teste -->
      ${isRealAdmin ? `
      <div class="card" style="grid-column:1/-1">
        <div class="card-header">
          <span class="card-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            Tempo de Uso do Perfil de Teste
          </span>
        </div>
        <div class="card-body">
          <p style="font-size:12px;color:var(--text-tertiary);margin-bottom:16px;line-height:1.5">
            Defina o tempo limite (em minutos) de duração para as sessões de demonstração da conta de teste (<code>teste@edupresenca.com</code>). 
            Após esse tempo, o sistema expirará a sessão automaticamente para fins de demonstração.
          </p>
          <div style="display:flex;align-items:flex-end;gap:14px;max-width:400px">
            <div class="form-group" style="margin-bottom:0;flex-grow:1">
              <label class="form-label">Duração do Teste (minutos)</label>
              <input class="form-control" type="number" id="trial-duration-input" min="1" max="1440" step="1"
                value="${cfg.trialDurationMinutes || 60}" style="font-size:15px;font-weight:600" />
            </div>
            <button class="btn btn-primary" id="btn-salvar-trial-duration" style="height:38px; cursor:pointer">
              Salvar tempo
            </button>
          </div>
        </div>
      </div>
      ` : ''}

      <!-- Tema do Sistema -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
              <path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z"/>
            </svg>
            Tema do Sistema
          </span>
        </div>
        <div class="card-body">
          <p style="font-size:12px;color:var(--text-tertiary);margin-bottom:16px">
            Selecione a aparência padrão do sistema. O tema selecionado também será aplicado na tela de login!
          </p>
          <div style="display:flex;flex-direction:column;gap:12px">
            <label style="display:flex;align-items:center;gap:8px;font-size:14px;color:var(--text-primary);cursor:pointer;user-select:none">
              <input type="radio" name="system-theme" value="light" style="cursor:pointer" />
              <span>☀️ Modo Claro</span>
            </label>
            <label style="display:flex;align-items:center;gap:8px;font-size:14px;color:var(--text-primary);cursor:pointer;user-select:none">
              <input type="radio" name="system-theme" value="dark" style="cursor:pointer" />
              <span>🌙 Modo Escuro</span>
            </label>
            <label style="display:flex;align-items:center;gap:8px;font-size:14px;color:var(--text-primary);cursor:pointer;user-select:none">
              <input type="radio" name="system-theme" value="edupresenca" style="cursor:pointer" />
              <span>🎓 EduPresença (Azul & Ouro)</span>
            </label>
          </div>
        </div>
      </div>

      <!-- App info -->
      <div class="card">
        <div class="card-header"><span class="card-title">Informações do Sistema</span></div>
        <div class="card-body">
          <div class="cfg-info-row"><span>Versão</span><strong>v${pkg.version}</strong></div>
          <div class="cfg-info-row"><span>Build</span><strong>${pkg.build}</strong></div>
          <div class="cfg-info-row"><span>Armazenamento</span><strong id="storage-used">calculando…</strong></div>
          <div class="cfg-info-row"><span>Registros</span><strong id="record-count">calculando…</strong></div>
        </div>
      </div>

      <!-- Danger zone -->
      <div class="card" style="border-color:rgba(239,68,68,0.25)">
        <div class="card-header" style="border-bottom-color:rgba(239,68,68,0.15)">
          <span class="card-title" style="color:var(--danger-400)">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Zona de Perigo
          </span>
        </div>
        <div class="card-body" style="display:flex;flex-direction:column;gap:14px">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap">
            <div>
              <div style="font-weight:600;font-size:14px;color:var(--text-primary)">Limpar Cache</div>
              <div style="font-size:12px;color:var(--text-tertiary);margin-top:2px">Remove arquivos em cache do Service Worker. Os dados são mantidos.</div>
            </div>
            <button class="btn btn-ghost btn-sm" id="btn-clear-cache" style="flex-shrink:0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/></svg>
              Limpar Cache
            </button>
          </div>
          <hr style="border-color:rgba(255,255,255,0.07)">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap">
            <div>
              <div style="font-weight:600;font-size:14px;color:#f87171">Apagar Todos os Dados</div>
              <div style="font-size:12px;color:var(--text-tertiary);margin-top:2px">Remove permanentemente todos os alunos, turmas, presenças, notas e configurações.</div>
            </div>
            <button class="btn btn-danger btn-sm" id="btn-delete-all" style="flex-shrink:0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
              Apagar Tudo
            </button>
          </div>
        </div>
      </div>
    </div>`;

  // ── Tema do Sistema ───────────────────────────────────
  const currentTheme = localStorage.getItem('edu_theme') || 'edupresenca';
  const radioButtons = panel.querySelectorAll('input[name="system-theme"]');
  radioButtons.forEach(btn => {
    if (btn.value === currentTheme) btn.checked = true;
    btn.addEventListener('change', (e) => {
      const selected = e.target.value;
      document.documentElement.setAttribute('data-theme', selected);
      localStorage.setItem('edu_theme', selected);
      
      // Update header icon
      const headerEl = document.querySelector('app-header');
      if (headerEl && headerEl.shadowRoot) {
        const themeBtn = headerEl.shadowRoot.getElementById('theme-btn');
        if (themeBtn && typeof headerEl._updateThemeIcon === 'function') {
          headerEl._updateThemeIcon(selected);
        }
      }
      
      window.toast?.success('Tema atualizado!', `Aparência alterada para o modo ${selected === 'light' ? 'claro' : selected === 'dark' ? 'escuro' : 'EduPresença'}.`);
    });
  });

  window.addEventListener('edu-theme-changed', (e) => {
    const nextTheme = e.detail;
    radioButtons.forEach(btn => {
      btn.checked = (btn.value === nextTheme);
    });
  });

  // ── Pesos de bimestre ─────────────────────────────────
  function updatePesoTotal() {
    const vals = [0,1,2,3].map(i => parseFloat(panel.querySelector(`#peso-bim-${i}`)?.value) || 0);
    const total = vals.reduce((a,b) => a+b, 0);
    const totalEl = panel.querySelector('#peso-total');
    if (totalEl) totalEl.textContent = total.toFixed(1);
    return vals;
  }
  [0,1,2,3].forEach(i => {
    panel.querySelector(`#peso-bim-${i}`)?.addEventListener('input', updatePesoTotal);
  });
  panel.querySelector('#btn-salvar-pesos')?.addEventListener('click', async () => {
    const confirmed = await showConfirm(modal, {
      title: 'Salvar Pesos',
      message: 'Deseja alterar a fórmula de cálculo de média do sistema?',
      confirmText: 'Salvar pesos'
    });
    if (!confirmed) return;

    const vals = updatePesoTotal();
    config.set({ pesoBimestres: vals });
    addLog('UPDATE', 'Configuração', { acao: 'Alteração de pesos de média', valores: vals });
    window.toast?.success('Pesos salvos!', `Novo cálculo: ${vals.map((p,i)=>['1º','2º','3º','4º'][i]+'='+p).join(', ')}.`);
  });
  panel.querySelector('#btn-resetar-pesos')?.addEventListener('click', async () => {
    const confirmed = await showConfirm(modal, {
      title: 'Restaurar Pesos',
      message: 'Deseja restaurar os pesos para o padrão (1.0 cada)?',
      confirmText: 'Restaurar'
    });
    if (!confirmed) return;

    [0,1,2,3].forEach(i => { const el = panel.querySelector(`#peso-bim-${i}`); if(el) el.value = 1; });
    updatePesoTotal();
    window.toast?.info('Pesos restaurados', 'Os pesos foram redefinidos para 1 cada (média simples). Clique em Salvar para aplicar.');
  });

  if (isRealAdmin) {
    panel.querySelector('#btn-salvar-trial-duration')?.addEventListener('click', async () => {
      const valInput = panel.querySelector('#trial-duration-input');
      const val = parseInt(valInput?.value, 10) || 60;
      
      if (val < 1) {
        window.toast?.error('Valor inválido', 'O tempo mínimo de teste é 1 minuto.');
        return;
      }

      const confirmed = await showConfirm(modal, {
        title: 'Salvar Tempo de Teste',
        message: `Deseja alterar a duração padrão do perfil de teste para <strong>${val} minutos</strong>?`,
        confirmText: 'Salvar'
      });
      if (!confirmed) return;

      config.set({ trialDurationMinutes: val });
      
      addLog('UPDATE', 'Configuração', { acao: 'Alteração de duração do perfil de teste', minutos: val });
      window.toast?.success('Configuração salva!', `A duração do perfil de teste foi atualizada para ${val} minutos.`);
    });
  }

  // Storage stats
  try {
    const total = JSON.stringify(localStorage).length;
    panel.querySelector('#storage-used').textContent = (total / 1024).toFixed(1) + ' KB';
    let count = 0;
    ['edu_alunos', 'edu_turmas', 'edu_cursos', 'edu_unidades', 'edu_turnos', 'edu_presencas', 'edu_notas']
      .forEach(k => { try { count += JSON.parse(localStorage.getItem(k) || '[]').length; } catch { } });
    panel.querySelector('#record-count').textContent = count + ' registros';
  } catch { }

  panel.querySelector('#btn-clear-cache').addEventListener('click', () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
    }
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).then(() => {
      window.toast?.success('Cache limpo!', 'O cache do Service Worker foi removido.');
    });
  });

  panel.querySelector('#btn-delete-all').addEventListener('click', async () => {
    const result = await showSecureConfirm(modal, {
      title: 'APAGAR TUDO',
      message: '<div class="alert-danger" style="margin-bottom:16px"><strong>ATENÇÃO!</strong> Esta ação removerá permanentemente todos os dados (alunos, turmas, presenças, notas, etc).</div> Para confirmar, você deve inserir sua senha pessoal.',
      confirmText: 'APAGAR TUDO PERMANENTEMENTE',
      type: 'danger'
    });

    if (result) {
      // Extra verification string as well since this is destructive
      const body2 = `
        <p style="margin-bottom:12px">Senha confirmada. Agora, digite <strong>APAGAR TUDO</strong> para confirmar a destruição final dos dados:</p>
        <input class="form-control" id="final-confirm" type="text" placeholder="APAGAR TUDO" />
      `;
      modal.open({
        title: 'Confirmação Final', size: 'sm', body: body2,
        footer: `<button class="btn btn-ghost" id="fc-cancel">Cancelar</button><button class="btn btn-danger" id="fc-ok">Destruir Dados</button>`
      });
      
      modal.shadowRoot.getElementById('fc-cancel').onclick = () => modal.close();
      modal.shadowRoot.getElementById('fc-ok').onclick = () => {
        const val = modal.shadowRoot.getElementById('final-confirm').value;
        if (val !== 'APAGAR TUDO') { window.toast?.error('Falha', 'Texto incorreto.'); return; }
        
        addLog('DELETE', 'Sistema', { acao: 'Limpeza total de dados' });
        const session = sessionStorage.getItem('edu_session');
        const theme = localStorage.getItem('edu_theme');
        localStorage.clear();
        if (theme) localStorage.setItem('edu_theme', theme);
        sessionStorage.clear();
        if (session) sessionStorage.setItem('edu_session', session);
        modal.close();
        window.toast?.success('Dados apagados!', 'Recarregando…');
        setTimeout(() => location.reload(), 1500);
      };
    }
  });
}

// ── Backup Helpers ────────────────────────────────────────
function getAllData() {
  const keys = ['edu_unidades', 'edu_turnos', 'edu_cursos', 'edu_turmas', 'edu_alunos', 'edu_presencas', 'edu_notas', 'edu_config', 'edu_usuarios'];
  const data = { _version: 1, _exported: new Date().toISOString() };
  keys.forEach(k => {
    try { data[k] = JSON.parse(localStorage.getItem(k) || 'null'); } catch { data[k] = null; }
  });
  return data;
}

function doLocalBackup() {
  const data = getAllData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `edupresenca-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click(); URL.revokeObjectURL(url);
  localStorage.setItem('edu_last_backup', new Date().toISOString());
  window.toast?.success('Backup baixado!', 'Arquivo JSON salvo no seu computador.');
  // Update stat UI if visible
  const el = document.getElementById('last-backup-info');
  if (el) el.textContent = 'Agora mesmo';
}

function confirmRestore(jsonText) {
  const user = auth.currentUser();
  if (user && user.email === 'teste@edupresenca.com') {
    window.toast?.warning('Ação não permitida', 'A restauração de backup está desabilitada para o perfil de testes de demonstração.');
    return;
  }

  let data;
  try { data = JSON.parse(jsonText); } catch { window.toast?.error('Arquivo inválido', 'O arquivo não é um JSON válido.'); return; }
  if (!data._version) { window.toast?.error('Formato incorreto', 'Este arquivo não é um backup do EduPresença.'); return; }

  const body = `
    <div class="alert-danger">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <div>Os dados atuais serão <strong>substituídos</strong> pelos dados do backup de <strong>${new Date(data._exported).toLocaleDateString('pt-BR')}</strong>.</div>
    </div>`;
  modal.open({
    title: 'Confirmar Restauração', size: 'sm', body,
    footer: `<button class="btn btn-ghost" id="dc">Cancelar</button><button class="btn btn-primary" id="dd">Restaurar</button>`
  });
  modal.shadowRoot.getElementById('dc')?.addEventListener('click', () => modal.close());
  modal.shadowRoot.getElementById('dd')?.addEventListener('click', async () => {
    modal.close();
    const loader = showLoadingOverlay('Restaurando backup e sincronizando com a nuvem...');
    
    Object.keys(data).filter(k => k.startsWith('edu_')).forEach(k => {
      if (data[k] !== null) localStorage.setItem(k, JSON.stringify(data[k]));
    });
    
    try {
      if (typeof pushAllToCloud !== 'undefined') {
        await pushAllToCloud();
      }
      window.toast?.success('Dados restaurados e sincronizados com a nuvem!', 'Recarregando…');
    } catch (err) {
      console.error('Erro ao sincronizar backup restaurado para nuvem:', err);
      window.toast?.success('Dados restaurados localmente!', 'Recarregando…');
    } finally {
      loader.close();
      setTimeout(() => location.reload(), 1500);
    }
  });
}

// ── Google Drive ──────────────────────────────────────────
async function doGDriveBackup(clientId) {
  window.toast?.info('Google Drive', 'Iniciando autorização…');
  const token = await getGoogleToken(clientId, 'https://www.googleapis.com/auth/drive.file');
  if (!token) return;
  const data = JSON.stringify(getAllData(), null, 2);
  const filename = `edupresenca-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify({ name: filename, mimeType: 'application/json' })], { type: 'application/json' }));
  form.append('file', new Blob([data], { type: 'application/json' }));
  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form
  });
  if (res.ok) window.toast?.success('Backup enviado!', `${filename} salvo no Google Drive.`);
  else window.toast?.error('Erro no Drive', 'Falha ao salvar o arquivo.');
}

async function doGDriveRestore(clientId) {
  window.toast?.info('Google Drive', 'Iniciando autorização…');
  const token = await getGoogleToken(clientId, 'https://www.googleapis.com/auth/drive.readonly');
  if (!token) return;
  const search = await fetch(`https://www.googleapis.com/drive/v3/files?q=name+contains+'edupresenca-backup'&orderBy=createdTime+desc&pageSize=5`, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(r => r.json());
  if (!search.files?.length) { window.toast?.error('Nenhum backup', 'Não encontrei backups do EduPresença no Drive.'); return; }
  const latest = search.files[0];
  const content = await fetch(`https://www.googleapis.com/drive/v3/files/${latest.id}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(r => r.text());
  confirmRestore(content);
}

async function getGoogleToken(clientId, scope) {
  return new Promise((resolve) => {
    try {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: clientId, scope, callback: (resp) => {
          if (resp.error) { window.toast?.error('Auth falhou', resp.error); resolve(null); }
          else resolve(resp.access_token);
        }
      });
      client.requestAccessToken();
    } catch {
      if (!document.getElementById('gsi-script')) {
        const s = document.createElement('script'); s.id = 'gsi-script';
        s.src = 'https://accounts.google.com/gsi/client';
        s.onload = () => getGoogleToken(clientId, scope).then(resolve);
        document.head.appendChild(s);
      } else resolve(null);
    }
  });
}

// ── OneDrive ──────────────────────────────────────────────
async function doOneDriveBackup(clientId) {
  const token = await getMsalToken(clientId);
  if (!token) return;
  const data = JSON.stringify(getAllData(), null, 2);
  const filename = `edupresenca-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const res = await fetch(`https://graph.microsoft.com/v1.0/me/drive/root:/${filename}:/content`, {
    method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: data
  });
  if (res.ok) window.toast?.success('Backup enviado!', `${filename} salvo no OneDrive.`);
  else window.toast?.error('Erro OneDrive', 'Falha ao salvar o arquivo.');
}

async function doOneDriveRestore(clientId) {
  const token = await getMsalToken(clientId);
  if (!token) return;
  const search = await fetch(`https://graph.microsoft.com/v1.0/me/drive/root/search(q='edupresenca-backup')`, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(r => r.json());
  const files = (search.value || []).filter(f => f.name.startsWith('edupresenca-backup'));
  if (!files.length) { window.toast?.error('Nenhum backup', 'Não encontrei backups no OneDrive.'); return; }
  files.sort((a, b) => new Date(b.lastModifiedDateTime) - new Date(a.lastModifiedDateTime));
  const content = await fetch(files[0]['@microsoft.graph.downloadUrl']).then(r => r.text());
  confirmRestore(content);
}

async function getMsalToken(clientId) {
  return new Promise(async (resolve) => {
    try {
      if (!window.msal) {
        const s = document.createElement('script');
        s.src = 'https://alcdn.msauth.net/browser/2.38.0/js/msal-browser.min.js';
        s.onload = () => getMsalToken(clientId).then(resolve);
        document.head.appendChild(s); return;
      }
      const app = new msal.PublicClientApplication({
        auth: { clientId, redirectUri: location.origin }
      });
      await app.initialize();
      const resp = await app.acquireTokenPopup({ scopes: ['Files.ReadWrite'] });
      resolve(resp.accessToken);
    } catch (e) {
      window.toast?.error('Auth OneDrive falhou', e.message || 'Verifique o Client ID.');
      resolve(null);
    }
  });
}


function injectTabStyles(outlet) {
  if (document.getElementById('cfg-tab-styles')) return;
  const s = document.createElement('style');
  s.id = 'cfg-tab-styles';
  s.textContent = `
    .cfg-tabs { display:flex;gap:4px;flex-wrap:wrap;margin-bottom:24px;
      background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);
      border-radius:12px;padding:4px; }
    .cfg-tab { display:flex;align-items:center;gap:7px;padding:9px 16px;border:none;
      background:transparent;color:var(--text-secondary);font-size:13px;font-weight:500;
      border-radius:9px;cursor:pointer;transition:all 0.15s;font-family:inherit; }
    .cfg-tab:hover { color:var(--text-primary);background:rgba(255,255,255,0.05); }
    .cfg-tab.active { background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;
      box-shadow:0 4px 12px rgba(99,102,241,0.35); }
    .cfg-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(380px,1fr));gap:20px; }
    .cfg-info-row { display:flex;align-items:center;justify-content:space-between;
      padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px; }
    .cfg-info-row:last-child{border:none;}
    .cfg-info-row span{color:var(--text-secondary);}
    .form-help a { color:#818cf8; }
    @media(max-width:960px){
      .cfg-tabs { display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:6px;padding:6px; }
      .cfg-tab { justify-content:flex-start;width:100%;padding:10px 14px;box-sizing:border-box; }
    }
    @media(max-width:640px){
      .cfg-grid { grid-template-columns:1fr; }
      .cfg-tabs { grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); }
      .cfg-tab { font-size:12.5px;padding:9px 12px; }
    }
    @media(max-width:400px){
      .cfg-tabs { grid-template-columns:1fr; }
    }
  `;
  document.head.appendChild(s);
}

function renderFeriados(panel) {
  const activeYear = getAnoLetivo();
  const storeKey = `edu_feriados_${activeYear}`;
  
  // Inject style block
  if (!document.getElementById('cal-styles')) {
    const style = document.createElement('style');
    style.id = 'cal-styles';
    style.textContent = `
      .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; text-align: center; }
      .cal-header { font-size: 11px; text-transform: uppercase; color: var(--text-tertiary); font-weight: 700; padding: 6px 0; }
      .cal-day { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 42px; border-radius: 8px; font-size: 13px; font-weight: 500; color: var(--text-primary); background: rgba(255,255,255,0.02); transition: all 0.15s; position: relative; }
      .cal-day:not(.empty):hover { background: rgba(255,255,255,0.07); cursor: pointer; }
      .cal-day.empty { background: transparent; cursor: default; }
      .cal-day.weekend { color: #f87171; }
      .cal-day.holiday-national { background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); color: #10b981; }
      .cal-day.holiday-state { background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.4); color: #f59e0b; }
      .cal-day.holiday-municipal { background: rgba(6, 182, 212, 0.15); border: 1px solid rgba(6, 182, 212, 0.4); color: #06b6d4; }
      .cal-day.holiday-local { background: rgba(129, 140, 248, 0.15); border: 1px solid rgba(129, 140, 248, 0.4); color: #818cf8; }
    `;
    document.head.appendChild(style);
  }

  function getFeriados() {
    return JSON.parse(localStorage.getItem(storeKey) || '[]');
  }
  
  function saveFeriados(list) {
    localStorage.setItem(storeKey, JSON.stringify(list));
  }

  function saveStructuralConfig(uf, city) {
    config.set({ uf, cidade: city });
  }
  
  function getMockLocalHolidays(uf, city) {
    const holidays = [];
    const ufNorm = uf.toUpperCase();
    const cityNorm = city.trim().toLowerCase();
    
    // Feriados Estaduais
    if (ufNorm === 'SP') {
      holidays.push({ date: `${activeYear}-07-09`, name: 'Revolução Constitucionalista', type: 'state' });
    } else if (ufNorm === 'RJ') {
      holidays.push({ date: `${activeYear}-04-23`, name: 'Dia de São Jorge', type: 'state' });
      holidays.push({ date: `${activeYear}-10-28`, name: 'Dia do Servidor Público Estadual', type: 'state' });
    } else if (ufNorm === 'MG') {
      holidays.push({ date: `${activeYear}-04-21`, name: 'Data Magna de Minas Gerais', type: 'state' });
    } else if (ufNorm === 'RS') {
      holidays.push({ date: `${activeYear}-09-20`, name: 'Revolução Farroupilha', type: 'state' });
    } else if (ufNorm === 'PE') {
      holidays.push({ date: `${activeYear}-03-06`, name: 'Data Magna de Pernambuco', type: 'state' });
    } else if (ufNorm === 'BA') {
      holidays.push({ date: `${activeYear}-07-02`, name: 'Independência da Bahia', type: 'state' });
    } else if (ufNorm === 'CE') {
      holidays.push({ date: `${activeYear}-03-25`, name: 'Data Magna do Ceará (Abolição da Escravidão)', type: 'state' });
    }
    
    // Feriados Municipais e Aniversários de Cidades
    if (cityNorm.includes('são paulo') || cityNorm.includes('sao paulo')) {
      holidays.push({ date: `${activeYear}-01-25`, name: 'Aniversário de São Paulo', type: 'municipal' });
      holidays.push({ date: `${activeYear}-11-20`, name: 'Dia da Consciência Negra', type: 'municipal' });
    } else if (cityNorm.includes('rio de janeiro')) {
      holidays.push({ date: `${activeYear}-01-20`, name: 'Dia de São Sebastião (Padroeiro)', type: 'municipal' });
      holidays.push({ date: `${activeYear}-11-20`, name: 'Dia da Consciência Negra', type: 'municipal' });
    } else if (cityNorm.includes('belo horizonte')) {
      holidays.push({ date: `${activeYear}-12-08`, name: 'Imaculada Conceição', type: 'municipal' });
      holidays.push({ date: `${activeYear}-08-15`, name: 'Nossa Senhora da Boa Viagem', type: 'municipal' });
    } else if (cityNorm.includes('porto alegre')) {
      holidays.push({ date: `${activeYear}-02-02`, name: 'Dia de Nossa Senhora dos Navegantes', type: 'municipal' });
    } else if (cityNorm.includes('salvador')) {
      holidays.push({ date: `${activeYear}-03-29`, name: 'Aniversário de Salvador', type: 'municipal' });
      holidays.push({ date: `${activeYear}-12-08`, name: 'Nossa Senhora da Conceição da Praia', type: 'municipal' });
    } else {
      holidays.push({ date: `${activeYear}-11-20`, name: 'Dia da Consciência Negra', type: 'municipal' });
      holidays.push({ date: `${activeYear}-12-08`, name: 'Dia da Padroeira Imaculada Conceição', type: 'municipal' });
    }
    
    return holidays;
  }

  // Load structural settings
  const cfg = (function() { try { return JSON.parse(localStorage.getItem('edu_config') || '{}'); } catch { return {}; } })();
  let activeUf = cfg.uf || 'SP';
  let activeCity = cfg.cidade || '';

  let currentMonth = new Date().getFullYear() === Number(activeYear) ? new Date().getMonth() : 4; // default to May (as in screenshot) or current month

  function renderMonthHolidaysList() {
    const list = getFeriados();
    const listEl = panel.querySelector('#feriados-list');
    if (!listEl) return;
    
    const monthStr = `${activeYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const monthHolidays = list.filter(h => h.date.startsWith(monthStr));
    
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    
    if (monthHolidays.length === 0) {
      listEl.innerHTML = `
        <div style="text-align:center;padding:32px 10px;color:var(--text-tertiary)">
          <div style="font-size:13px;font-weight:600">Nenhum feriado em ${monthNames[currentMonth]}</div>
        </div>
      `;
      return;
    }
    
    monthHolidays.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    listEl.innerHTML = monthHolidays.map(f => {
      let badgeColor = '#818cf8';
      let badgeLabel = 'LOC';
      if (f.type === 'national') { badgeColor = '#10b981'; badgeLabel = 'NAC'; }
      else if (f.type === 'state') { badgeColor = '#f59e0b'; badgeLabel = 'EST'; }
      else if (f.type === 'municipal') { badgeColor = '#06b6d4'; badgeLabel = 'MUN'; }
      
      const formattedDate = f.date.split('-').reverse().join('/');
      
      return `
        <div class="feriado-item" style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:10px;margin-bottom:8px">
          <div style="display:flex;align-items:center;gap:12px">
            <span style="font-size:9px;font-weight:700;padding:2px 5px;border-radius:5px;background:${badgeColor}20;color:${badgeColor};border:1px solid ${badgeColor}30">${badgeLabel}</span>
            <div>
              <div style="font-size:13px;font-weight:600;color:var(--text-primary)">${escapeHtml(f.name)}</div>
              <div style="font-size:10px;color:var(--text-tertiary);margin-top:2px">${formattedDate}</div>
            </div>
          </div>
          <button class="btn-delete-feriado btn-icon-sm" data-id="${f.id}" style="background:transparent;border:none;color:var(--text-tertiary);cursor:pointer;transition:all 0.15s">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      `;
    }).join('');
    
    // Bind delete events
    listEl.querySelectorAll('.btn-delete-feriado').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const currentList = getFeriados();
        const feriado = currentList.find(x => x.id === id);
        if (!feriado) return;
        
        const confirmed = await showConfirm(modal, {
          title: 'Excluir Feriado',
          message: `Deseja realmente remover o feriado <strong>${escapeHtml(feriado.name)}</strong>?`,
          confirmText: 'Excluir'
        });
        if (!confirmed) return;
        
        const newList = currentList.filter(x => x.id !== id);
        saveFeriados(newList);
        renderCalendar();
        window.toast?.info('Feriado excluído', 'A data foi removida com sucesso.');
      });
    });
  }

  function renderCalendar() {
    const gridEl = panel.querySelector('#calendar-grid');
    const titleEl = panel.querySelector('#calendar-title');
    if (!gridEl || !titleEl) return;
    
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    titleEl.textContent = `${monthNames[currentMonth]} de ${activeYear}`;
    
    // Clear grid and fill with headers
    gridEl.innerHTML = '';
    
    const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    daysOfWeek.forEach(d => {
      const h = document.createElement('div');
      h.className = 'cal-header';
      h.textContent = d;
      gridEl.appendChild(h);
    });
    
    const firstDay = new Date(activeYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(activeYear, currentMonth + 1, 0).getDate();
    
    // Render blank cells
    for (let i = 0; i < firstDay; i++) {
      const empty = document.createElement('div');
      empty.className = 'cal-day empty';
      gridEl.appendChild(empty);
    }
    
    const list = getFeriados();
    
    // Render day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const cell = document.createElement('div');
      cell.className = 'cal-day';
      
      const isSunday = (firstDay + day - 1) % 7 === 0;
      const isSaturday = (firstDay + day - 1) % 7 === 6;
      if (isSunday || isSaturday) cell.classList.add('weekend');
      
      const dateString = `${activeYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      cell.textContent = day;
      cell.dataset.date = dateString;
      
      // Highlight holidays
      const dayHoliday = list.find(h => h.date === dateString);
      if (dayHoliday) {
        cell.classList.add(`holiday-${dayHoliday.type}`);
        cell.title = dayHoliday.name;
        
        const badge = document.createElement('span');
        badge.style.fontSize = '8px';
        badge.style.marginTop = '2px';
        badge.style.fontWeight = '700';
        badge.style.textTransform = 'uppercase';
        badge.style.opacity = '0.9';
        badge.textContent = dayHoliday.type === 'national' ? 'NAC' : 
                           dayHoliday.type === 'state' ? 'EST' : 
                           dayHoliday.type === 'municipal' ? 'MUN' : 'LOC';
        cell.appendChild(badge);
      }
      
      gridEl.appendChild(cell);
    }
    
    renderMonthHolidaysList();
  }

  async function loadCitiesList(uf, selectedCity) {
    const citySelect = panel.querySelector('#city-select');
    if (!citySelect) return;
    
    citySelect.innerHTML = '<option value="">Carregando cidades...</option>';
    citySelect.disabled = true;
    
    try {
      const res = await fetch(`https://brasilapi.com.br/api/ibge/municipios/v1/${uf}?providers=dados-abertos-br,gov,wikipedia`);
      if (!res.ok) throw new Error('Falha ao baixar cidades');
      const data = await res.json();
      data.sort((a, b) => a.nome.localeCompare(b.nome));
      
      citySelect.innerHTML = '<option value="">Selecione o Município...</option>' + 
        data.map(c => `<option value="${escapeHtml(c.nome)}" ${c.nome.toUpperCase() === selectedCity.toUpperCase() ? 'selected' : ''}>${escapeHtml(c.nome)}</option>`).join('');
      citySelect.disabled = false;
    } catch (e) {
      citySelect.innerHTML = `
        <option value="">Cidades indisponíveis (servidor offline)</option>
        <option value="SÃO PAULO" ${selectedCity.toUpperCase() === 'SÃO PAULO' ? 'selected' : ''}>SÃO PAULO</option>
        <option value="RIO DE JANEIRO" ${selectedCity.toUpperCase() === 'RIO DE JANEIRO' ? 'selected' : ''}>RIO DE JANEIRO</option>
        <option value="BELO HORIZONTE" ${selectedCity.toUpperCase() === 'BELO HORIZONTE' ? 'selected' : ''}>BELO HORIZONTE</option>
        <option value="SALVADOR" ${selectedCity.toUpperCase() === 'SALVADOR' ? 'selected' : ''}>SALVADOR</option>
        <option value="PORTO ALEGRE" ${selectedCity.toUpperCase() === 'PORTO ALEGRE' ? 'selected' : ''}>PORTO ALEGRE</option>
      `;
      citySelect.disabled = false;
    }
  }

  const ufs = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
  
  panel.innerHTML = `
    <div class="cfg-grid">
      <!-- Importar Feriados -->
      <div class="card" style="grid-column: 1 / -1">
        <div class="card-header">
          <span class="card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Importar Feriados do Ano Letivo ${activeYear}
          </span>
        </div>
        <div class="card-body">
          <p style="font-size:13px;color:var(--text-secondary);margin-bottom:16px;line-height:1.6">
            Configure seu estado e município estrutural padrão para carregar os feriados oficiais da sua região e do país.
          </p>
          
          <div style="display:flex;gap:14px;flex-wrap:wrap;align-items:flex-end;margin-bottom:20px;border-bottom:1px solid rgba(255,255,255,0.06);padding-bottom:20px">
            <div class="form-group" style="margin-bottom:0;width:120px">
              <label class="form-label">Estado (UF)</label>
              <select class="form-control" id="uf-select" style="height:38px;font-size:14px">
                ${ufs.map(uf => `<option value="${uf}" ${uf === activeUf ? 'selected' : ''}>${uf}</option>`).join('')}
              </select>
            </div>
            
            <div class="form-group" style="margin-bottom:0;flex:1;min-width:200px">
              <label class="form-label">Município (Dados Estruturais)</label>
              <select class="form-control" id="city-select" style="height:38px;font-size:14px">
                <option value="">Carregando...</option>
              </select>
            </div>
          </div>

          <div style="display:flex;gap:14px;flex-wrap:wrap">
            <button class="btn btn-primary" id="btn-import-national" style="height:38px">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Importar Feriados Nacionais
            </button>
            
            <button class="btn btn-secondary" id="btn-import-local" style="height:38px">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Importar Estaduais & Municipais
            </button>
          </div>
        </div>
      </div>

      <!-- Calendário Mensal de Feriados -->
      <div class="card" style="grid-column: 1 / -1">
        <div class="card-header" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
          <span class="card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Calendário de Feriados
          </span>
          <div style="display:flex;align-items:center;gap:10px">
            <button class="btn btn-secondary btn-icon-sm" id="btn-prev-month" style="height:28px;width:28px">◀</button>
            <span style="font-weight:700;font-size:14px;color:var(--text-primary);min-width:140px;text-align:center" id="calendar-title"></span>
            <button class="btn btn-secondary btn-icon-sm" id="btn-next-month" style="height:28px;width:28px">▶</button>
          </div>
        </div>
        <div class="card-body">
          <div class="cal-grid" id="calendar-grid" style="margin-bottom:20px"></div>
        </div>
      </div>

      <!-- Cadastrar Feriado Local -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            Cadastrar Feriado Manual
          </span>
        </div>
        <div class="card-body">
          <div class="form-group">
            <label class="form-label">Data</label>
            <input class="form-control" type="date" id="feriado-date" min="${activeYear}-01-01" max="${activeYear}-12-31" style="font-size:14px;height:38px" />
          </div>
          
          <div class="form-group">
            <label class="form-label">Nome do Feriado</label>
            <input class="form-control" type="text" id="feriado-name" placeholder="Ex: Feriado Municipal / Escolar" style="font-size:14px;height:38px" />
          </div>
          
          <div class="form-group">
            <label class="form-label">Tipo</label>
            <select class="form-control" id="feriado-type" style="font-size:14px;height:38px">
              <option value="national">Nacional</option>
              <option value="state">Estadual</option>
              <option value="municipal">Municipal</option>
              <option value="local">Local/Escolar</option>
            </select>
          </div>
          
          <button class="btn btn-primary btn-full" id="btn-add-feriado" style="height:38px">
            Adicionar Feriado
          </button>
        </div>
      </div>

      <!-- Lista de Feriados do Mês Visualizado -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Feriados Deste Mês
          </span>
        </div>
        <div class="card-body" id="feriados-list" style="max-height:360px;overflow-y:auto;padding-right:4px">
          <!-- Rendered dynamically -->
        </div>
      </div>
    </div>
  `;

  // Bind city list and structural config actions
  const ufSelect = panel.querySelector('#uf-select');
  const citySelect = panel.querySelector('#city-select');

  loadCitiesList(activeUf, activeCity);

  ufSelect.addEventListener('change', () => {
    activeUf = ufSelect.value;
    activeCity = '';
    saveStructuralConfig(activeUf, activeCity);
    loadCitiesList(activeUf, activeCity);
  });

  citySelect.addEventListener('change', () => {
    activeCity = citySelect.value;
    saveStructuralConfig(activeUf, activeCity);
  });

  // Calendar prev/next binds
  panel.querySelector('#btn-prev-month').addEventListener('click', () => {
    if (currentMonth > 0) {
      currentMonth--;
      renderCalendar();
    } else {
      window.toast?.info('Mês limite', 'O calendário está limitado ao ano letivo ativo.');
    }
  });

  panel.querySelector('#btn-next-month').addEventListener('click', () => {
    if (currentMonth < 11) {
      currentMonth++;
      renderCalendar();
    } else {
      window.toast?.info('Mês limite', 'O calendário está limitado ao ano letivo ativo.');
    }
  });

  // Action Binds
  panel.querySelector('#btn-import-national').addEventListener('click', async () => {
    window.toast?.info('Importando…', 'Buscando feriados nacionais na BrasilAPI…');
    try {
      const res = await fetch(`https://brasilapi.com.br/api/feriados/v1/${activeYear}`);
      if (!res.ok) throw new Error('Falha ao consultar API');
      const data = await res.json();
      
      const currentList = getFeriados();
      let importedCount = 0;
      
      data.forEach(item => {
        if (!currentList.some(x => x.date === item.date)) {
          currentList.push({
            id: 'feriado_' + Math.random().toString(36).substr(2, 9),
            date: item.date,
            name: item.name,
            type: 'national'
          });
          importedCount++;
        }
      });
      
      saveFeriados(currentList);
      renderCalendar();
      if (importedCount > 0) {
        window.toast?.success('Importação concluída!', `${importedCount} feriados nacionais importados.`);
      } else {
        window.toast?.info('Nenhum feriado novo', 'Todos os feriados nacionais já estavam importados.');
      }
    } catch (e) {
      window.toast?.error('Erro na importação', 'Não foi possível baixar os feriados nacionais.');
    }
  });

  panel.querySelector('#btn-import-local').addEventListener('click', () => {
    if (!activeCity) {
      window.toast?.error('Cidade necessária', 'Por favor, selecione uma cidade estrutural primeiro.');
      return;
    }
    
    window.toast?.info('Importando…', `Buscando feriados regionais de ${activeCity} - ${activeUf}…`);
    
    const localHolidays = getMockLocalHolidays(activeUf, activeCity);
    const currentList = getFeriados();
    let importedCount = 0;
    
    localHolidays.forEach(item => {
      if (!currentList.some(x => x.date === item.date && x.name.toLowerCase() === item.name.toLowerCase())) {
        currentList.push({
          id: 'feriado_' + Math.random().toString(36).substr(2, 9),
          date: item.date,
          name: item.name,
          type: item.type
        });
        importedCount++;
      }
    });
    
    saveFeriados(currentList);
    renderCalendar();
    if (importedCount > 0) {
      window.toast?.success('Importação concluída!', `${importedCount} feriados locais de ${activeCity} - ${activeUf} importados.`);
    } else {
      window.toast?.info('Nenhum feriado novo', 'Os feriados para essa região já estavam cadastrados.');
    }
  });

  panel.querySelector('#btn-add-feriado').addEventListener('click', () => {
    const dateInput = panel.querySelector('#feriado-date').value;
    const nameInput = panel.querySelector('#feriado-name').value;
    const typeInput = panel.querySelector('#feriado-type').value;
    
    if (!dateInput || !nameInput.trim()) {
      window.toast?.error('Dados incompletos', 'Preencha a data e o nome do feriado.');
      return;
    }
    
    const currentList = getFeriados();
    
    if (currentList.some(x => x.date === dateInput && x.name.toLowerCase() === nameInput.trim().toLowerCase())) {
      window.toast?.error('Feriado duplicado', 'Esta data e nome já estão cadastrados.');
      return;
    }
    
    currentList.push({
      id: 'feriado_' + Math.random().toString(36).substr(2, 9),
      date: dateInput,
      name: nameInput.trim(),
      type: typeInput
    });
    
    saveFeriados(currentList);
    renderCalendar();
    window.toast?.success('Feriado adicionado!', `"${nameInput.trim()}" cadastrado.`);
    
    panel.querySelector('#feriado-date').value = '';
    panel.querySelector('#feriado-name').value = '';
  });

  renderCalendar();
}

// ── Solicitações de Senha ──────────────────────────────────
async function renderSenhaPedidos(panel) {
  panel.innerHTML = `
    <div style="display:flex; justify-content:center; padding: 40px;">
      <span class="spinner" style="width:32px; height:32px;"></span>
    </div>
  `;

  try {
    if (typeof firebase === 'undefined') {
      throw new Error('Firebase não carregado');
    }

    const snapshot = await firebase.firestore()
      .collection('edu_solicitacoes_senha')
      .where('status', '==', 'pendente')
      .orderBy('dataSolicitacao', 'desc')
      .get();

    const requests = [];
    snapshot.forEach(doc => {
      requests.push({ id: doc.id, ...doc.data() });
    });

    const allUsers = usuarios.getAll();

    if (requests.length === 0) {
      panel.innerHTML = `
        <div class="card" style="padding:40px; text-align:center;">
          <div style="width:64px; height:64px; background:rgba(34, 197, 94, 0.1); color:#22c55e; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 16px auto;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h3 style="color:#0B2B40; font-family:'Poppins', sans-serif; font-size:1.2rem; font-weight:700; margin-bottom:8px;">Tudo limpo por aqui!</h3>
          <p style="color:#64748b; font-size:0.92rem; margin:0; text-align: justify; max-width: 480px; margin: 0 auto; line-height: 1.6;">
            Não há nenhuma solicitação de redefinição de senha pendente na base de dados. Quando algum professor com e-mail institucional solicitar auxílio, ela aparecerá aqui instantaneamente.
          </p>
        </div>
      `;
      return;
    }

    panel.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:20px;">
        <!-- Alert Warning Card -->
        <div style="background:rgba(245, 158, 11, 0.08); border-left:4px solid #f59e0b; padding:16px; border-radius:12px; display:flex; gap:12px; align-items:flex-start;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" style="flex-shrink:0; margin-top:2px;">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div>
            <strong style="color:#78350f; font-size:0.95rem; display:block; margin-bottom:4px;">Atenção aos Acessos Institucionais</strong>
            <p style="margin:0; font-size:0.88rem; color:#92400e; line-height:1.5; text-align: justify;">
              Por restrições de segurança do Google Firebase, as contas com e-mail <strong>@edupresenca.com</strong> não suportam envio automático de links. Você deve redefinir a senha do usuário manualmente no seu <strong>Firebase Console</strong> e depois clicar em "Marcar como Resolvido" para arquivar a solicitação.
            </p>
          </div>
        </div>

        <!-- Requests Grid -->
        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap:16px;">
          ${requests.map(req => {
            const userObj = allUsers.find(u => u.email?.toLowerCase() === req.email?.toLowerCase());
            const nome = userObj?.nome || 'Usuário Não Identificado';
            const role = userObj?.role ? roleLabel(userObj.role) : 'Professor';
            const foto = userObj?.foto;
            const initials = getInitials(nome);
            const hue = nome.charCodeAt(0) * 15 % 360;
            const dateStr = req.dataSolicitacao 
              ? new Date(req.dataSolicitacao.seconds * 1000).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
              : 'Agora mesmo';

            const avatarHtml = foto
              ? `<img src="${foto}" style="width:48px;height:48px;border-radius:50%;object-fit:cover" />`
              : `<div style="width:48px;height:48px;border-radius:50%;background:hsl(${hue},65%,45%);display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;color:#fff">${initials}</div>`;

            return `
              <div class="card" style="padding:16px; display:flex; flex-direction:column; justify-content:between; gap:16px;" data-id="${req.id}">
                <div style="display:flex; gap:12px; align-items:center;">
                  <div style="flex-shrink:0;">${avatarHtml}</div>
                  <div style="flex:1; min-width:0;">
                    <div style="font-weight:700; font-size:0.95rem; color:#0B2B40; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(nome)}</div>
                    <div style="font-size:0.8rem; color:#64748b; margin-top:2px;">${role} · ${req.email}</div>
                  </div>
                </div>
                
                <div style="background:#f8fafc; border-radius:8px; padding:10px; font-size:0.82rem; color:#475569; display:flex; justify-content:space-between; align-items:center;">
                  <span>Solicitado em:</span>
                  <strong>${dateStr}</strong>
                </div>

                <div style="display:flex; gap:8px;">
                  <button class="btn btn-ghost btn-sm btn-ajuda-console" style="flex:1; gap:4px;" data-email="${req.email}">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    Instruções
                  </button>
                  <button class="btn btn-primary btn-sm btn-resolver-senha" style="flex:1; gap:4px;" data-id="${req.id}" data-email="${req.email}">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    Resolvido
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Guide box -->
        <div class="card" style="padding:20px; background:#fafafa;">
          <h4 style="margin-top:0; margin-bottom:12px; color:#0B2B40; font-family:'Poppins',sans-serif; font-size:0.95rem; font-weight:700;">📘 Guia Rápido: Como alterar a senha no Firebase Console</h4>
          <ol style="margin:0; padding-left:20px; font-size:0.85rem; color:#475569; line-height:1.6; text-align: justify;">
            <li style="margin-bottom:6px;">Acesse o <a href="https://console.firebase.google.com/" target="_blank" style="color:#1F6E8C; font-weight:600; text-decoration:underline;">Console do Firebase</a> e clique no seu projeto.</li>
            <li style="margin-bottom:6px;">No menu lateral esquerdo, clique em <strong>Authentication</strong>.</li>
            <li style="margin-bottom:6px;">Na aba <strong>Users</strong> (Usuários), localize o e-mail do professor desejado.</li>
            <li style="margin-bottom:6px;">Clique nos <strong>três pontinhos</strong> no canto direito da linha dele e escolha <strong>Alterar senha</strong>.</li>
            <li style="margin-bottom:6px;">Digite a senha nova padrão (ex: <code>senha123</code>) e clique em salvar.</li>
            <li>Volte aqui e clique em <strong>Resolvido</strong> para arquivar a solicitação!</li>
          </ol>
        </div>
      </div>
    `;

    // Bind event listeners
    panel.querySelectorAll('.btn-ajuda-console').forEach(btn => {
      btn.addEventListener('click', () => {
        const email = btn.dataset.email;
        let m = document.querySelector('app-modal');
        if (!m) {
          m = document.createElement('app-modal');
          document.body.appendChild(m);
        }
        m.open({
          title: 'Instruções de Redefinição',
          icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
          body: `
            <div style="font-family:var(--font-sans, sans-serif); line-height:1.6; color:#475569; font-size:13.5px; text-align: justify;">
              <p style="margin-bottom:12px;">Para restabelecer o acesso do e-mail <strong>${email}</strong>, execute estes passos rápidos:</p>
              <div style="padding:10px; background:#f8fafc; border-radius:10px; border-left:4px solid #1F6E8C; margin-bottom:16px;">
                <strong>Passo 1:</strong> Abra o Firebase Console e clique em seu projeto.<br>
                <strong>Passo 2:</strong> Vá em <strong>Authentication</strong> > <strong>Users</strong>.<br>
                <strong>Passo 3:</strong> Busque por <code>${email}</code>.<br>
                <strong>Passo 4:</strong> Clique nos três pontinhos, escolha <strong>Alterar senha</strong>, digite a nova senha e salve.
              </div>
              <p style="margin:0;">Comunique a nova senha provisória ao usuário e marque o chamado como resolvido aqui.</p>
            </div>
          `,
          footer: `<button class="btn btn-primary" id="m-help-ok" style="width:100%">Entendido</button>`
        });
        m.shadowRoot.getElementById('m-help-ok')?.addEventListener('click', () => m.close());
      });
    });

    panel.querySelectorAll('.btn-resolver-senha').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const email = btn.dataset.email;

        let m = document.querySelector('app-modal');
        if (!m) {
          m = document.createElement('app-modal');
          document.body.appendChild(m);
        }

        const confirmed = await showConfirm(m, {
          title: 'Marcar como Resolvido',
          message: `<span style="display:block; text-align:justify;">Confirmar que você já alterou a senha do e-mail <strong>${email}</strong> no Console do Firebase e deseja arquivar esta solicitação?</span>`,
          confirmText: 'Sim, Resolvido',
          cancelText: 'Cancelar',
          type: 'primary'
        });

        if (!confirmed) return;

        try {
          btn.disabled = true;
          btn.innerHTML = `<span class="spinner" style="width:12px;height:12px;"></span>`;
          
          await firebase.firestore().collection('edu_solicitacoes_senha').doc(id).update({
            status: 'resolvido'
          });

          window.toast?.success('Solicitação resolvida!', `O chamado de ${email} foi arquivado.`);
          
          // Re-render
          renderSenhaPedidos(panel);
          
          // Trigger sidebar updates
          window.app?.updatePasswordResetBadge?.();
        } catch (e) {
          console.error(e);
          window.toast?.error('Erro', 'Não foi possível atualizar a solicitação.');
          btn.disabled = false;
          btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Resolvido`;
        }
      });
    });

  } catch (err) {
    console.error('Erro renderSenhaPedidos:', err);
    panel.innerHTML = `
      <div class="card" style="padding:24px; text-align:center; color:#ef4444;">
        Erro ao carregar as solicitações de senha. Verifique sua conexão com a Internet.
      </div>
    `;
  }
}


