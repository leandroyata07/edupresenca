// =========================================================
// EduPresença – Professores Page
// =========================================================
import { usuarios, cursos, disciplinas, addLog, auth, KEYS, triggerCloudSync, isSyncUser } from '../store.js';
import { escapeHtml as eh, getInitials, stringToHue, showConfirm, formatPhone, compressImage } from '../utils.js';

export function render(outlet) {
  const me = auth.getUser();
  const isGestor = auth.isGestor();

  let modal;
  if (!document.getElementById('prof-modal')) {
    modal = document.createElement('app-modal');
    modal.id = 'prof-modal';
    document.body.appendChild(modal);
  } else {
    modal = document.getElementById('prof-modal');
  }

  // State
  let searchQuery = '';
  let selectedCursoId = '';
  let selectedDisciplinaId = '';

  function refreshList() {
    const searchInput = outlet.querySelector('#prof-search');
    const cursoFilter = outlet.querySelector('#prof-filter-curso');
    const discFilter = outlet.querySelector('#prof-filter-disc');

    searchQuery = searchInput?.value || '';
    selectedCursoId = cursoFilter?.value || '';
    selectedDisciplinaId = discFilter?.value || '';

    let proflist = usuarios.getAll()
      .filter(u => u.role === 'professor')
      .sort((a, b) => a.nome.localeCompare(b.nome));

    // Apply Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      proflist = proflist.filter(p => 
        p.nome.toLowerCase().includes(q) || 
        p.email.toLowerCase().includes(q) ||
        (p.telefone && p.telefone.includes(q))
      );
    }

    // Apply Course Filter
    if (selectedCursoId) {
      proflist = proflist.filter(p => Array.isArray(p.cursos) && p.cursos.includes(selectedCursoId));
    }

    // Apply Discipline Filter
    if (selectedDisciplinaId) {
      proflist = proflist.filter(p => Array.isArray(p.disciplinas) && p.disciplinas.includes(selectedDisciplinaId));
    }

    renderGrid(proflist);
  }

  // Initial markup structure
  outlet.innerHTML = `
    <div class="stagger-children">
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;flex-wrap:wrap;gap:16px;">
        <div class="page-header-left">
          <h1 class="page-title" style="display:flex;align-items:center;gap:10px;">
            <span style="display:flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:12px;background:rgba(2,132,199,0.15);color:#0284c7;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20M4 19.5V3.5A2.5 2.5 0 0 1 6.5 1H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5z"/></svg>
            </span>
            Professores
          </h1>
          <p class="page-subtitle">Gestão do corpo docente, atribuições de cursos e disciplinas vinculadas</p>
        </div>
        ${isGestor ? `
          <button class="btn btn-primary" id="btn-novo-prof" style="background:#0284c7;border-color:#0284c7;display:inline-flex;align-items:center;gap:8px;font-weight:600;box-shadow:0 4px 12px rgba(2,132,199,0.25);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Adicionar Professor
          </button>
        ` : ''}
      </div>

      <!-- Search and Filter Panel -->
      <div class="card" style="margin-bottom:24px;border:1px solid var(--border-color);background:var(--surface-1);">
        <div class="card-body" style="padding:16px;">
          <div class="form-grid" style="grid-template-columns:2fr 1fr 1fr;gap:16px;align-items:end;">
            <div class="form-group">
              <label class="form-label" style="font-size:11.5px;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-secondary);font-weight:700;">Pesquisar Professor</label>
              <div style="position:relative;display:flex;align-items:center;">
                <span style="position:absolute;left:12px;color:var(--text-tertiary);display:flex;">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </span>
                <input class="form-control" id="prof-search" type="text" placeholder="Buscar por nome, e-mail ou telefone..." style="padding-left:36px;height:38px;font-size:13px;border-radius:10px;" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label" style="font-size:11.5px;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-secondary);font-weight:700;">Filtrar por Curso</label>
              <select class="form-control" id="prof-filter-curso" style="height:38px;font-size:13px;border-radius:10px;">
                <option value="">Todos os Cursos</option>
                ${cursos.getAll().sort((a,b)=>a.nome.localeCompare(b.nome)).map(c => `<option value="${c.id}">${eh(c.nome)}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" style="font-size:11.5px;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-secondary);font-weight:700;">Filtrar por Disciplina</label>
              <select class="form-control" id="prof-filter-disc" style="height:38px;font-size:13px;border-radius:10px;">
                <option value="">Todas as Disciplinas</option>
                ${disciplinas.getAll().sort((a,b)=>a.nome.localeCompare(b.nome)).map(d => `<option value="${d.id}">${eh(d.nome)}</option>`).join('')}
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Grid Area -->
      <div id="professores-grid-container"></div>
    </div>
  `;

  // Attach search triggers
  const sInput = outlet.querySelector('#prof-search');
  const cFilter = outlet.querySelector('#prof-filter-curso');
  const dFilter = outlet.querySelector('#prof-filter-disc');

  sInput?.addEventListener('input', refreshList);
  cFilter?.addEventListener('change', refreshList);
  dFilter?.addEventListener('change', refreshList);

  if (isGestor) {
    outlet.querySelector('#btn-novo-prof')?.addEventListener('click', () => openTeacherForm(null));
  }

  // Load initial list
  refreshList();

  function renderGrid(list) {
    const container = outlet.querySelector('#professores-grid-container');
    if (!container) return;

    if (list.length === 0) {
      container.innerHTML = `
        <div class="card" style="padding:56px 32px;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(255,255,255,0.01);border:1px dashed var(--border-color);border-radius:18px;">
          <div style="width:64px;height:64px;border-radius:16px;background:rgba(2,132,199,0.08);color:#0284c7;display:flex;align-items:center;justify-content:center;margin-bottom:16px;box-shadow:0 8px 24px rgba(2,132,199,0.08)">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <h3 style="font-size:16px;font-weight:700;color:var(--text-primary);margin-bottom:6px">Nenhum professor encontrado</h3>
          <p style="font-size:13px;color:var(--text-secondary);max-width:320px;line-height:1.5;margin:0">Experimente ajustar os filtros ou pesquisar com outros termos de busca.</p>
        </div>
      `;
      return;
    }

    const allStoreCursos = cursos.getAll();
    const allStoreDiscs = disciplinas.getAll();

    container.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(360px, 1fr));gap:20px;">
        ${list.map(p => {
          const hue = stringToHue(p.nome);
          const initials = getInitials(p.nome);
          const assignedCursos = (p.cursos || []).map(cid => allStoreCursos.find(c => c.id === cid)).filter(Boolean);
          const assignedDiscs = (p.disciplinas || []).map(did => allStoreDiscs.find(d => d.id === did)).filter(Boolean);

          return `
            <div class="card" style="display:flex;flex-direction:column;justify-content:space-between;border:1px solid var(--border-color);border-radius:16px;overflow:hidden;transition:transform 0.2s, box-shadow 0.2s;background:var(--surface-2);" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 24px rgba(0,0,0,0.12)';" onmouseout="this.style.transform='none';this.style.boxShadow='none';">
              <div class="card-body" style="padding:20px;">
                
                <!-- Avatar & Header Row -->
                <div style="display:flex;gap:14px;align-items:flex-start;margin-bottom:16px;">
                  <div style="flex-shrink:0;">
                    ${p.foto 
                      ? `<img src="${p.foto}" style="width:48px;height:48px;border-radius:50%;object-fit:cover;border:2px solid rgba(2,132,199,0.3);" />`
                      : `<div style="width:48px;height:48px;border-radius:50%;background:hsl(${hue},60%,42%);display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;color:#fff;border:2px solid rgba(255,255,255,0.05);">${initials}</div>`
                    }
                  </div>
                  <div style="min-width:0;flex:1;">
                    <h3 style="font-size:15px;font-weight:700;color:var(--text-primary);margin:0 0 2px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${eh(p.nome)}">${eh(p.nome)}</h3>
                    <div style="display:flex;flex-direction:column;gap:3px;margin-top:4px;">
                      <a href="mailto:${eh(p.email)}" style="font-size:12px;color:var(--text-secondary);text-decoration:none;display:inline-flex;align-items:center;gap:5px;word-break:break-all;">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                        ${eh(p.email)}
                      </a>
                      ${p.telefone 
                        ? `<a href="https://wa.me/${p.telefone.replace(/\D/g,'')}" target="_blank" style="font-size:12px;color:#22c55e;text-decoration:none;display:inline-flex;align-items:center;gap:5px;font-weight:500;">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.37 5.378 0 12.01 0a11.948 11.948 0 0 1 8.49 3.518 11.857 11.857 0 0 1 3.5 8.49c-.003 6.634-5.378 12.006-12.01 12.006a11.961 11.961 0 0 1-5.733-1.46L0 24zm6.59-4.846c1.666.988 3.546 1.509 5.405 1.51h.005c5.446 0 9.877-4.428 9.879-9.873.001-2.639-1.026-5.12-2.892-6.988A9.829 9.829 0 0 0 12.01 1.001C6.564 1.001 2.133 5.43 2.13 10.874a9.833 9.833 0 0 0 1.482 5.06l-.973 3.559 3.65-.957c1.558.85 3.327 1.298 5.093 1.299h.01zm10.748-7.39c-.31-.155-1.838-.906-2.122-1.01-.284-.103-.49-.155-.696.155-.206.31-.798.981-.977 1.187-.18.206-.36.232-.67.077-.31-.155-1.31-.483-2.497-1.542-.924-.824-1.548-1.842-1.73-2.152-.18-.31-.019-.477.136-.631.14-.139.31-.36.465-.542.155-.181.206-.31.31-.516.103-.206.052-.387-.026-.542-.077-.155-.696-1.678-.954-2.297-.25-.602-.505-.52-.696-.53-.18-.01-.387-.01-.593-.01-.206 0-.542.077-.825.387-.284.31-1.083 1.058-1.083 2.58 0 1.523 1.11 2.993 1.265 3.199.155.206 2.183 3.333 5.289 4.672.738.318 1.314.509 1.763.652.742.236 1.417.203 1.951.123.595-.089 1.838-.75 2.097-1.439.258-.688.258-1.278.18-1.402-.078-.124-.284-.206-.593-.36z"/></svg>
                            ${eh(p.telefone)}
                          </a>` 
                        : ''
                      }
                    </div>
                  </div>
                </div>

                <!-- Cursos Badge list -->
                <div style="margin-bottom:12px;">
                  <div style="font-size:10.5px;text-transform:uppercase;color:var(--text-tertiary);letter-spacing:0.04em;font-weight:700;margin-bottom:6px;">Cursos Ativos</div>
                  <div style="display:flex;flex-wrap:wrap;gap:5px;">
                    ${assignedCursos.length === 0 
                      ? `<span style="font-size:11.5px;color:var(--text-tertiary);font-style:italic;">Nenhum curso atrelado</span>`
                      : assignedCursos.map(c => `
                          <span style="font-size:11px;font-weight:600;padding:3px 8px;border-radius:6px;background:rgba(2,132,199,0.08);color:#0284c7;border:1px solid rgba(2,132,199,0.15);">${eh(c.nome)}</span>
                        `).join('')
                    }
                  </div>
                </div>

                <!-- Disciplinas pill tags -->
                <div>
                  <div style="font-size:10.5px;text-transform:uppercase;color:var(--text-tertiary);letter-spacing:0.04em;font-weight:700;margin-bottom:6px;">Disciplinas Atribuídas</div>
                  <div style="display:flex;flex-wrap:wrap;gap:5px;">
                    ${assignedDiscs.length === 0 
                      ? `<span style="font-size:11.5px;color:var(--text-tertiary);font-style:italic;">Nenhuma disciplina atrelada</span>`
                      : assignedDiscs.map(d => `
                          <span style="font-size:10.5px;font-weight:500;padding:2px 7px;border-radius:5px;background:var(--surface-3);color:var(--text-secondary);border:1px solid var(--border-color);">${eh(d.nome)}</span>
                        `).join('')
                    }
                  </div>
                </div>

              </div>

              <!-- Actions bar -->
              ${isGestor ? `
                <div style="display:flex;border-top:1px solid var(--border-color);background:rgba(255,255,255,0.015);padding:10px 16px;justify-content:flex-end;gap:12px;">
                  <button class="btn btn-ghost btn-sm btn-edit-prof" data-id="${p.id}" style="display:inline-flex;align-items:center;gap:6px;color:#0284c7;font-size:12px;font-weight:600;padding:4px 10px;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    Editar Atribuições
                  </button>
                  <button class="btn btn-ghost btn-sm btn-delete-prof" data-id="${p.id}" style="display:inline-flex;align-items:center;gap:6px;color:var(--danger-400);font-size:12px;font-weight:600;padding:4px 10px;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    Excluir
                  </button>
                </div>
              ` : ''}

            </div>
          `;
        }).join('')}
      </div>
    `;

    // Hook buttons
    if (isGestor) {
      container.querySelectorAll('.btn-edit-prof').forEach(btn => {
        btn.addEventListener('click', () => {
          const prof = usuarios.getById(btn.dataset.id);
          if (prof) openTeacherForm(prof);
        });
      });

      container.querySelectorAll('.btn-delete-prof').forEach(btn => {
        btn.addEventListener('click', () => deleteTeacher(btn.dataset.id));
      });
    }
  }

  // Delete flow
  async function deleteTeacher(id) {
    const prof = usuarios.getById(id);
    if (!prof) return;

    const confirmed = await showConfirm(modal, {
      title: 'Excluir Professor',
      message: `Deseja realmente <strong>excluir permanentemente</strong> a conta e todas as atribuições acadêmicas do professor <strong>${eh(prof.nome)}</strong>? Esta ação é irreversível.`,
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
      confirmText: 'Sim, Excluir Tudo',
      type: 'danger'
    });
    if (!confirmed) return;

    usuarios.delete(id);
    if (isSyncUser() && typeof firebase !== 'undefined' && firebase.firestore) {
      triggerCloudSync(KEYS.usuarios, usuarios.getAll());
    }

    addLog('DELETE', 'Professor', { nome: prof.nome, email: prof.email });
    window.toast?.success('Docente excluído!', 'A conta do professor e suas atribuições foram excluídas do sistema.');
    refreshList();
  }

  // Add/Edit Modal Form
  function openTeacherForm(teacher) {
    const isEdit = !!teacher;
    let fotoData = teacher?.foto || null;
    const initials = teacher ? getInitials(teacher.nome) : '?';
    const hue = teacher ? stringToHue(teacher.nome) : 180;

    const photoPreviewHtml = fotoData
      ? `<img src="${fotoData}" style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:2px solid rgba(2,132,199,0.3);" />`
      : `<div style="width:72px;height:72px;border-radius:50%;background:hsl(${hue},60%,42%);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:#fff">${initials}</div>`;

    const isPersonalEmail = teacher?.email && !teacher.email.endsWith('@edupresenca.com');
    const emailVal = teacher?.email ? (teacher.email.endsWith('@edupresenca.com') ? teacher.email.slice(0, -16) : teacher.email) : '';

    const allStoreCursos = cursos.getAll().sort((a,b)=>a.nome.localeCompare(b.nome));
    const allStoreDiscs = disciplinas.getAll().sort((a,b)=>a.nome.localeCompare(b.nome));

    const selectedCursos = teacher?.cursos || [];
    const selectedDiscs = teacher?.disciplinas || [];

    const body = `
      <form id="prof-form" novalidate style="display:grid;grid-template-columns:1.2fr 1.8fr;gap:24px;max-height:70vh;overflow-y:auto;padding-right:8px;">
        
        <!-- Column 1: Profile & Access Details -->
        <div style="border-right:1px solid var(--border-color);padding-right:20px;">
          <h3 style="font-size:13px;text-transform:uppercase;color:var(--text-tertiary);letter-spacing:0.04em;font-weight:700;margin-bottom:14px;border-bottom:1px solid var(--border-color);padding-bottom:6px;">Acesso e Perfil</h3>
          
          <!-- Photo row -->
          <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px;">
            <div id="p-foto-preview" style="flex-shrink:0;">${photoPreviewHtml}</div>
            <div>
              <div style="font-size:11.5px;color:var(--text-secondary);margin-bottom:6px;">Foto de Perfil</div>
              <label class="btn btn-ghost btn-sm" style="cursor:pointer;display:inline-flex;align-items:center;gap:6px;font-size:11.5px;padding:4px 8px;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                Upload
                <input type="file" id="p-foto" accept="image/*" style="display:none" />
              </label>
              ${fotoData ? `<button type="button" class="btn btn-ghost btn-sm" id="p-foto-remove" style="margin-left:4px;color:var(--danger-400);font-size:11px;padding:4px 8px;">Remover</button>` : ''}
            </div>
          </div>

          <div style="display:flex;flex-direction:column;gap:14px;">
            <div class="form-group">
              <label class="form-label" style="font-size:12px;margin-bottom:4px;">Nome Completo <span class="required">*</span></label>
              <input class="form-control" name="nome" type="text" placeholder="Ex: Dr. Roberto Silva" value="${eh(teacher?.nome || '')}" required style="font-size:12.5px;height:34px;" />
            </div>

            <div class="form-group">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <label class="form-label" style="margin-bottom:0;font-size:12px;">E-mail de Acesso <span class="required">*</span></label>
                <label style="display:inline-flex; align-items:center; gap:4px; font-size:10.5px; cursor:pointer; user-select:none; color:var(--text-secondary);">
                  <input type="checkbox" id="p-is-personal" ${isPersonalEmail ? 'checked' : ''} style="cursor:pointer;" />
                  Externo
                </label>
              </div>
              <div id="email-container" style="display:flex; align-items:stretch;">
                <input class="form-control" id="p-email" name="email" type="text" placeholder="roberto.silva" value="${eh(emailVal)}" required style="border-top-right-radius:0; border-bottom-right-radius:0; flex:1; font-size:12.5px; height:34px;" />
                <span id="p-email-suffix" style="display:flex; align-items:center; padding:0 8px; background:var(--bg-tertiary); border:1px solid var(--border-color); border-left:none; border-top-right-radius:var(--border-radius); border-bottom-right-radius:var(--border-radius); font-size:11.5px; color:var(--text-secondary); white-space:nowrap; user-select:none;">@edupresenca.com</span>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size:12px;margin-bottom:4px;">Telefone / WhatsApp</label>
              <input class="form-control" id="p-telefone" name="telefone" type="text" placeholder="(99) 99999-9999" value="${eh(teacher?.telefone || '')}" style="font-size:12.5px;height:34px;" />
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size:12px;margin-bottom:4px;">E-mail Pessoal / Alternativo</label>
              <input class="form-control" name="emailPessoal" type="email" placeholder="pessoal@gmail.com" value="${eh(teacher?.emailPessoal || '')}" style="font-size:12.5px;height:34px;" />
            </div>

            ${!isEdit ? `
              <div class="form-group">
                <label class="form-label" style="font-size:12px;margin-bottom:4px;">Senha Inicial</label>
                <input class="form-control" name="password" type="password" placeholder="Senha inicial (Padrão: senha123)" style="font-size:12.5px;height:34px;" />
                <span class="form-help" style="font-size:10px;">Se em branco, usará <strong>senha123</strong></span>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Column 2: Courses and Disciplines (Assignments) -->
        <div>
          <h3 style="font-size:13px;text-transform:uppercase;color:var(--text-tertiary);letter-spacing:0.04em;font-weight:700;margin-bottom:14px;border-bottom:1px solid var(--border-color);padding-bottom:6px;">Atribuições Acadêmicas</h3>
          
          <!-- Courses Multi-Checklist -->
          <div style="margin-bottom:20px;">
            <label class="form-label" style="font-weight:700;color:var(--text-primary);font-size:12px;margin-bottom:8px;display:block;">1. Selecione os Cursos Ministrados</label>
            <div style="display:grid;grid-template-columns:repeat(2, 1fr);gap:10px;background:var(--surface-3);padding:12px;border-radius:10px;border:1px solid var(--border-color);">
              ${allStoreCursos.map(c => {
                const checked = selectedCursos.includes(c.id) ? 'checked' : '';
                return `
                  <label style="display:inline-flex;align-items:center;gap:8px;font-size:12px;cursor:pointer;user-select:none;color:var(--text-secondary);">
                    <input type="checkbox" class="chk-curso" data-id="${c.id}" ${checked} style="cursor:pointer;" />
                    ${eh(c.nome)}
                  </label>
                `;
              }).join('')}
              ${allStoreCursos.length === 0 ? `<div style="font-size:12px;color:var(--text-tertiary);grid-column:span 2;font-style:italic;">Nenhum curso cadastrado no sistema.</div>` : ''}
            </div>
          </div>

          <!-- Disciplines checklist grouped by course -->
          <div>
            <label class="form-label" style="font-weight:700;color:var(--text-primary);font-size:12px;margin-bottom:6px;display:block;">2. Selecione as Disciplinas Atribuídas</label>
            <p style="font-size:11px;color:var(--text-tertiary);margin:0 0 10px 0;">Marque as disciplinas de responsabilidade deste professor. Elas estão agrupadas por curso.</p>
            
            <div id="disciplinas-grouped-container" style="display:flex;flex-direction:column;gap:14px;padding-right:4px;">
              ${allStoreCursos.map(c => {
                const courseDiscs = allStoreDiscs.filter(d => d.cursoId === c.id);
                if (courseDiscs.length === 0) return '';
                
                const isCourseSelected = selectedCursos.includes(c.id);

                return `
                  <div class="disc-group-card" data-curso-id="${c.id}" style="border:1px solid var(--border-color);border-radius:10px;background:var(--surface-1);overflow:hidden;display:${isCourseSelected ? 'block' : 'none'};">
                    <!-- Course Header -->
                    <div style="background:var(--surface-3);padding:8px 12px;font-size:11.5px;font-weight:700;color:var(--text-primary);border-bottom:1px solid var(--border-color);display:flex;justify-content:space-between;align-items:center;">
                      <span>Curso: ${eh(c.nome)}</span>
                      <span class="badge-status" style="font-size:10px;font-weight:600;padding:2px 6px;border-radius:4px;background:#059669;color:#fff;">
                        Ativo
                      </span>
                    </div>
                    <!-- Disciplines list -->
                    <div style="padding:10px 10px 10px 12px;display:flex;flex-direction:column;gap:8px;max-height:115px;overflow-y:auto;overscroll-behavior:contain;padding-right:4px;">
                      ${courseDiscs.map(d => {
                        const checked = selectedDiscs.includes(d.id) ? 'checked' : '';
                        const disabled = isCourseSelected ? '' : 'disabled';
                        return `
                          <label style="display:inline-flex;align-items:center;gap:8px;font-size:11.5px;cursor:${isCourseSelected ? 'pointer' : 'default'};user-select:none;color:${isCourseSelected ? 'var(--text-secondary)' : 'var(--text-tertiary)'};">
                            <input type="checkbox" class="chk-disciplina" data-id="${d.id}" data-curso-id="${c.id}" ${checked} ${disabled} style="cursor:${isCourseSelected ? 'pointer' : 'default'};" />
                            <span>${eh(d.nome)} <small style="color:var(--text-tertiary);font-size:9.5px;margin-left:4px;">(${d.cargaHoraria}h)</small></span>
                          </label>
                        `;
                      }).join('')}
                    </div>
                  </div>
                `;
              }).join('')}
              
              ${allStoreCursos.length === 0 || allStoreDiscs.length === 0 ? `<div style="font-size:12px;color:var(--text-tertiary);padding:16px;background:var(--surface-1);border:1px solid var(--border-color);border-radius:10px;text-align:center;font-style:italic;">Cadastre cursos e disciplinas para realizar atribuições acadêmicas.</div>` : ''}
            </div>
          </div>

        </div>

      </form>
    `;

    const footer = `
      <button class="btn btn-ghost" id="m-cancel">Cancelar</button>
      <button class="btn btn-primary" id="m-save" style="background:#0284c7;border-color:#0284c7;display:inline-flex;align-items:center;gap:6px;font-weight:600;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        ${isEdit ? 'Salvar Alterações' : 'Criar Docente'}
      </button>
    `;

    modal.open({ title: isEdit ? 'Editar Professor e Atribuições' : 'Adicionar Novo Professor', body, footer, size: 'lg' });

    const bodyEl = modal.shadowRoot.getElementById('modal-body');

    // Dynamic checkboxes logic - show/hide course cards based on selection
    const chkCursos = bodyEl.querySelectorAll('.chk-curso');
    chkCursos.forEach(chk => {
      chk.addEventListener('change', () => {
        const cursoId = chk.dataset.id;
        const isChecked = chk.checked;
        const groupCard = bodyEl.querySelector(`.disc-group-card[data-curso-id="${cursoId}"]`);
        
        if (groupCard) {
          groupCard.style.display = isChecked ? 'block' : 'none';

          const chkDiscs = groupCard.querySelectorAll('.chk-disciplina');
          chkDiscs.forEach(cd => {
            cd.disabled = !isChecked;
            if (!isChecked) {
              cd.checked = false; // wipe assignments of unchecked courses instantly
            }
          });
        }
      });
    });

    // Profile photo picker
    const fileInput = bodyEl.querySelector('#p-foto');
    const preview = bodyEl.querySelector('#p-foto-preview');
    const removeBtn = bodyEl.querySelector('#p-foto-remove');

    fileInput?.addEventListener('change', async () => {
      const file = fileInput.files[0];
      if (!file) return;
      try {
        fotoData = await compressImage(file, 200, 0.7);
        if (preview) preview.innerHTML = `<img src="${fotoData}" style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:2px solid rgba(2,132,199,0.3);" />`;
      } catch (err) {
        console.error('Erro ao processar imagem:', err);
      }
    });

    removeBtn?.addEventListener('click', () => {
      fotoData = null;
      if (preview) preview.innerHTML = `<div style="width:72px;height:72px;border-radius:50%;background:hsl(${hue},60%,42%);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:#fff">${initials}</div>`;
      if (removeBtn) removeBtn.style.display = 'none';
    });

    // Email UI toggling
    const isPersonalCheck = bodyEl.querySelector('#p-is-personal');
    const emailInput = bodyEl.querySelector('#p-email');
    const emailSuffix = bodyEl.querySelector('#p-email-suffix');

    function updateEmailUI() {
      if (isPersonalCheck?.checked) {
        if (emailSuffix) emailSuffix.style.display = 'none';
        if (emailInput) {
          emailInput.style.borderTopRightRadius = 'var(--border-radius)';
          emailInput.style.borderBottomRightRadius = 'var(--border-radius)';
          emailInput.placeholder = 'email@exemplo.com';
          if (teacher?.email && teacher.email.endsWith('@edupresenca.com') && emailInput.value === teacher.email.slice(0, -16)) {
            emailInput.value = teacher.email;
          }
        }
      } else {
        if (emailSuffix) emailSuffix.style.display = 'flex';
        if (emailInput) {
          emailInput.style.borderTopRightRadius = '0';
          emailInput.style.borderBottomRightRadius = '0';
          emailInput.placeholder = 'roberto.silva';
          if (emailInput.value.endsWith('@edupresenca.com')) {
            emailInput.value = emailInput.value.slice(0, -16);
          }
        }
      }
    }

    isPersonalCheck?.addEventListener('change', updateEmailUI);
    updateEmailUI();

    // Phone masking
    const phoneInput = bodyEl.querySelector('#p-telefone');
    phoneInput?.addEventListener('input', (e) => {
      let x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
      e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
    });

    // Modal buttons hook
    modal.shadowRoot.getElementById('m-cancel')?.addEventListener('click', () => modal.close());
    modal.shadowRoot.getElementById('m-save')?.addEventListener('click', async (e) => {
      const saveBtn = e.currentTarget;
      const originalText = saveBtn.innerHTML;
      
      const data = modal.getFormData('#prof-form');

      if (!data.nome?.trim()) {
        window.toast?.error('Nome obrigatório', 'Preencha o nome completo do professor.');
        return;
      }

      // Email parsing
      let finalEmail = data.email?.trim();
      if (!finalEmail) {
        window.toast?.error('E-mail obrigatório', 'O e-mail de acesso é obrigatório.');
        return;
      }
      
      const isPersonal = isPersonalCheck?.checked;
      if (!isPersonal && !finalEmail.includes('@')) {
        finalEmail = `${finalEmail}@edupresenca.com`;
      }

      if (!finalEmail.includes('@') || finalEmail.length < 5) {
        window.toast?.error('E-mail inválido', 'Digite um e-mail válido.');
        return;
      }

      // Generate username
      const generatedUsername = finalEmail.split('@')[0];

      // Security checklist check: get all selected courses & disciplines
      const selectedCursoIds = [];
      bodyEl.querySelectorAll('.chk-curso:checked').forEach(c => selectedCursoIds.push(c.dataset.id));

      const selectedDiscIds = [];
      bodyEl.querySelectorAll('.chk-disciplina:checked').forEach(d => selectedDiscIds.push(d.dataset.id));

      const resolvedData = {
        nome: data.nome,
        username: generatedUsername,
        email: finalEmail,
        role: 'professor',
        telefone: data.telefone || '',
        emailPessoal: data.emailPessoal || '',
        cursos: selectedCursoIds,
        disciplinas: selectedDiscIds
      };

      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span class="loading loading-spinner loading-sm"></span> Processando...';

      try {
        if (isEdit) {
          const confirmed = await showConfirm(modal, {
            title: 'Confirmar Alterações',
            message: `Deseja salvar as alterações e novas atribuições do professor <strong>${eh(data.nome)}</strong>?`,
            confirmText: 'Salvar alterações'
          });
          
          if (!confirmed) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalText;
            return;
          }

          usuarios.update(teacher.id, { ...resolvedData, foto: fotoData });
          if (isSyncUser() && typeof firebase !== 'undefined' && firebase.firestore) {
            triggerCloudSync(KEYS.usuarios, usuarios.getAll());
          }

          addLog('UPDATE', 'Professor', { nome: data.nome, email: finalEmail });
          window.toast?.success('Professor atualizado!', 'As informações e atribuições acadêmicas foram salvas.');
        } else {
          await auth.createUser({ ...resolvedData, password: data.password || 'senha123', foto: fotoData });
          addLog('CREATE', 'Professor', { nome: data.nome, email: finalEmail });
          window.toast?.success('Professor criado!', `Acesso: ${finalEmail} · Senha: ${data.password || 'senha123'}`);
        }

        modal.close();
        refreshList();
      } catch (err) {
        console.error('Erro ao salvar professor:', err);
        window.toast?.error('Erro', 'Ocorreu um erro ao salvar o professor. Tente novamente.');
      } finally {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.innerHTML = originalText;
        }
      }
    });
  }
}
