// =========================================================
// EduPresença – Configurações Page
// =========================================================
import { auth, usuarios, config } from '../store.js';
import { escapeHtml } from '../utils.js';

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
        ${user?.role === 'admin' ? `
        <button class="cfg-tab" data-tab="usuarios">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Usuários
        </button>` : ''}
        <button class="cfg-tab" data-tab="backup">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          Backup & Restauração
        </button>
        <button class="cfg-tab" data-tab="sistema">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
          Sistema
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
  activateTab('conta');
}

// ── Panel Renderer ────────────────────────────────────────
function renderPanel(tab, panel, user) {
  panel.innerHTML = '';
  if (tab === 'conta') renderConta(panel, user);
  if (tab === 'usuarios') renderUsuarios(panel);
  if (tab === 'backup') renderBackup(panel);
  if (tab === 'sistema') renderSistema(panel);
}

// ── Conta ─────────────────────────────────────────────────
function renderConta(panel, user) {
  const hue = (user?.nome || 'A').charCodeAt(0) * 15 % 360;
  panel.innerHTML = `
    <div class="cfg-grid">
      <!-- Profile card -->
      <div class="card">
        <div class="card-header"><span class="card-title">Perfil</span></div>
        <div class="card-body" style="display:flex;align-items:center;gap:20px;flex-wrap:wrap">
          <div class="avatar" style="width:64px;height:64px;font-size:22px;background:hsl(${hue},65%,45%);flex-shrink:0">
            ${getInitials(user?.nome || 'Admin')}
          </div>
          <div>
            <div style="font-size:20px;font-weight:700;color:var(--text-primary)">${escapeHtml(user?.nome || '')}</div>
            <div style="font-size:13px;color:var(--text-tertiary);margin-top:2px">@${escapeHtml(user?.username || '')}</div>
            <span class="badge ${user?.role === 'admin' ? 'badge-primary' : 'badge-neutral'} badge-dot" style="margin-top:8px">
              ${roleLabel(user?.role)}
            </span>
          </div>
        </div>
      </div>

      <!-- Change password card -->
      <div class="card">
        <div class="card-header"><span class="card-title">Alterar Senha</span></div>
        <div class="card-body">
          <div class="form-grid" style="--fg-cols:1">
            <div class="form-group">
              <label class="form-label">Nova senha</label>
              <input class="form-control" id="cfg-new-pwd" type="password" placeholder="Mínimo 6 caracteres" />
            </div>
            <div class="form-group">
              <label class="form-label">Confirmar nova senha</label>
              <input class="form-control" id="cfg-confirm-pwd" type="password" placeholder="Repita a senha" />
            </div>
            <button class="btn btn-primary" id="btn-change-pwd" style="width:fit-content">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              Salvar nova senha
            </button>
          </div>
        </div>
      </div>
    </div>`;

  panel.querySelector('#btn-change-pwd').addEventListener('click', async () => {
    const p1 = panel.querySelector('#cfg-new-pwd').value;
    const p2 = panel.querySelector('#cfg-confirm-pwd').value;
    if (!p1 || p1.length < 6) { window.toast?.error('Senha inválida', 'Mínimo de 6 caracteres.'); return; }
    if (p1 !== p2) { window.toast?.error('Senhas diferentes', 'A confirmação não confere.'); return; }
    await auth.changePassword(user.id, p1);
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
              <th>Nome</th><th>Usuário</th><th>E-mail</th><th>Perfil</th><th>Ações</th>
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
                    <td style="color:var(--text-secondary)">@${escapeHtml(u.username)}</td>
                    <td style="color:var(--text-secondary)">${escapeHtml(u.email || '—')}</td>
                    <td><span class="badge ${u.role === 'admin' ? 'badge-primary' : 'badge-neutral'} badge-dot">${roleLabel(u.role)}</span></td>
                    <td>
                      <div style="display:flex;gap:6px">
                        <button class="btn btn-ghost btn-sm" data-edit="${u.id}" title="Editar">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          Editar
                        </button>
                        <button class="btn btn-ghost btn-sm" data-del="${u.id}" style="color:var(--danger-400)" title="Excluir">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                          Excluir
                        </button>
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
        <div class="form-group">
          <label class="form-label">Usuário (login) <span class="required">*</span></label>
          <input class="form-control" id="u-username" name="username" type="text" placeholder="login.usuario"
            value="${escapeHtml(user?.username || '')}" required />
        </div>
        <div class="form-group">
          <label class="form-label">Perfil <span class="required">*</span></label>
          <select class="form-control" id="u-role" name="role">
            <option value="admin"       ${user?.role === 'admin' ? 'selected' : ''}>Administrador</option>
            <option value="professor"   ${user?.role === 'professor' ? 'selected' : ''}>Professor</option>
            <option value="secretaria"  ${user?.role === 'secretaria' ? 'selected' : ''}>Secretaria</option>
            <option value="coordenador" ${user?.role === 'coordenador' ? 'selected' : ''}>Coordenador</option>
          </select>
        </div>
        <div class="form-group full-width">
          <label class="form-label">E-mail</label>
          <input class="form-control" id="u-email" name="email" type="email" placeholder="email@escola.com"
            value="${escapeHtml(user?.email || '')}" />
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

  fileInput?.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      fotoData = ev.target.result;
      if (preview) preview.innerHTML = `<img src="${fotoData}" style="width:72px;height:72px;border-radius:50%;object-fit:cover" />`;
    };
    reader.readAsDataURL(file);
  });
  removeBtn?.addEventListener('click', () => {
    fotoData = null;
    const hue = (user?.nome || 'N').charCodeAt(0) * 15 % 360;
    const init = user ? user.nome.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() : '?';
    if (preview) preview.innerHTML = `<div style="width:72px;height:72px;border-radius:50%;background:hsl(${hue},65%,45%);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:#fff">${init}</div>`;
    if (removeBtn) removeBtn.style.display = 'none';
  });

  modal.shadowRoot.getElementById('m-cancel')?.addEventListener('click', () => modal.close());
  modal.shadowRoot.getElementById('m-save')?.addEventListener('click', async () => {
    const data = modal.getFormData('#user-form');
    if (!data.nome?.trim() || !data.username?.trim()) {
      window.toast?.error('Campos obrigatórios', 'Preencha nome e usuário.'); return;
    }
    if (isEdit) {
      usuarios.update(user.id, { nome: data.nome, username: data.username, email: data.email, role: data.role, foto: fotoData });
      // If editing yourself, update session
      const me = auth.currentUser();
      if (me?.id === user.id) {
        const updated = { ...me, nome: data.nome, username: data.username, role: data.role, foto: fotoData };
        sessionStorage.setItem('edu_session', JSON.stringify(updated));
        document.querySelector('app-header')?.setUser?.(updated);
        document.querySelector('app-sidebar')?.setUser?.(updated);
      }
      window.toast?.success('Usuário atualizado!', '');
    } else {
      await auth.createUser({ nome: data.nome, username: data.username, email: data.email, role: data.role, password: data.password || 'senha123', foto: fotoData });
      window.toast?.success('Usuário criado!', `Login: ${data.username} · Senha: ${data.password || 'senha123'}`);
    }
    modal.close(); onSave();
  });
}

function confirmDeleteUser(id, onSave) {
  const u = usuarios.getById(id);
  const me = auth.currentUser();
  if (u?.id === me?.id) { window.toast?.error('Ação bloqueada', 'Você não pode excluir sua própria conta.'); return; }
  const body = `
    <div class="alert-danger">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <div>Esta ação é irreversível.</div>
    </div>
    <p style="margin-top:16px;font-size:14px;color:#94a3b8">Excluir o usuário <strong>${escapeHtml(u?.nome)}</strong>?</p>`;
  modal.open({
    title: 'Confirmar Exclusão', size: 'sm', body,
    footer: `<button class="btn btn-ghost" id="dc">Cancelar</button><button class="btn btn-danger" id="dd">Excluir</button>`
  });
  modal.shadowRoot.getElementById('dc')?.addEventListener('click', () => modal.close());
  modal.shadowRoot.getElementById('dd')?.addEventListener('click', () => {
    usuarios.delete(id); modal.close(); onSave();
    window.toast?.success('Excluído!', `${u.nome} foi removido.`);
  });
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
          <label class="btn btn-ghost" style="cursor:pointer">
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
  const pkg = { version: '1.0.0', build: new Date().toLocaleDateString('pt-BR') };
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
  panel.querySelector('#btn-salvar-pesos')?.addEventListener('click', () => {
    const vals = updatePesoTotal();
    const cfg = (function() { try { return JSON.parse(localStorage.getItem('edu_config') || '{}'); } catch { return {}; } })();
    cfg.pesoBimestres = vals;
    localStorage.setItem('edu_config', JSON.stringify(cfg));
    window.toast?.success('Pesos salvos!', `Novo cálculo: ${vals.map((p,i)=>['1º','2º','3º','4º'][i]+'='+p).join(', ')}.`);
  });
  panel.querySelector('#btn-resetar-pesos')?.addEventListener('click', () => {
    [0,1,2,3].forEach(i => { const el = panel.querySelector(`#peso-bim-${i}`); if(el) el.value = 1; });
    updatePesoTotal();
    window.toast?.info('Pesos restaurados', 'Os pesos foram redefinidos para 1 cada (média simples). Clique em Salvar para aplicar.');
  });

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

  panel.querySelector('#btn-delete-all').addEventListener('click', () => {
    const body = `
      <div class="alert-danger">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <div><strong>Atenção!</strong> Esta ação removerá permanentemente todos os dados incluindo alunos, turmas, presenças, notas e usuários.</div>
      </div>
      <p style="margin-top:16px;font-size:14px;color:#94a3b8">Digite <strong>APAGAR TUDO</strong> para confirmar:</p>
      <input class="form-control" id="confirm-input" type="text" placeholder="APAGAR TUDO" style="margin-top:12px"/>`;
    modal.open({
      title: 'Apagar Todos os Dados', size: 'sm', body,
      footer: `<button class="btn btn-ghost" id="dc">Cancelar</button><button class="btn btn-danger" id="dd">Apagar permanentemente</button>`
    });
    modal.shadowRoot.getElementById('dc')?.addEventListener('click', () => modal.close());
    modal.shadowRoot.getElementById('dd')?.addEventListener('click', () => {
      const val = modal.shadowRoot.getElementById('modal-body').querySelector('#confirm-input').value;
      if (val !== 'APAGAR TUDO') { window.toast?.error('Confirmação incorreta', 'Digite APAGAR TUDO exatamente.'); return; }
      // Keep session and theme
      const session = sessionStorage.getItem('edu_session');
      const theme = localStorage.getItem('edu_theme');
      localStorage.clear();
      if (theme) localStorage.setItem('edu_theme', theme);
      sessionStorage.clear();
      if (session) sessionStorage.setItem('edu_session', session);
      modal.close();
      window.toast?.success('Dados apagados!', 'Recarregando…');
      setTimeout(() => location.reload(), 1500);
    });
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
  modal.shadowRoot.getElementById('dd')?.addEventListener('click', () => {
    Object.keys(data).filter(k => k.startsWith('edu_')).forEach(k => {
      if (data[k] !== null) localStorage.setItem(k, JSON.stringify(data[k]));
    });
    modal.close();
    window.toast?.success('Dados restaurados!', 'Recarregando…');
    setTimeout(() => location.reload(), 1500);
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

// ── Helpers ───────────────────────────────────────────────
function getInitials(name) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}
function roleLabel(role) {
  return { admin: 'Administrador', professor: 'Professor', secretaria: 'Secretaria', coordenador: 'Coordenador' }[role] || role;
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
    @media(max-width:640px){.cfg-grid{grid-template-columns:1fr;}}
  `;
  document.head.appendChild(s);
}
