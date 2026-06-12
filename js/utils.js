// =========================================================
// EduPresença – Utility Functions
// =========================================================

/** Generate a unique ID */
export function uid() {
    if (crypto.randomUUID) return crypto.randomUUID();
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/** Format date to pt-BR */
export function formatDate(dateStr, opts = {}) {
    if (!dateStr) return '—';
    const date = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''));
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric', ...opts
    });
}

/** Format date to input value (YYYY-MM-DD) */
export function toInputDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
}

/** Today as YYYY-MM-DD */
export function today() {
    return new Date().toISOString().split('T')[0];
}

/** Format number with locale */
export function formatNumber(n) {
    return Number(n || 0).toLocaleString('pt-BR');
}

/** Format percentage */
export function formatPercent(n, total) {
    if (!total) return '0%';
    return ((n / total) * 100).toFixed(1) + '%';
}

/** Capitalize first letter */
export function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/** Get initials from name */
export function getInitials(name) {
    if (!name) return '?';
    return name.trim().split(/\s+/).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

/** Generate a hue from a string (for consistent avatar colors) */
export function stringToHue(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return Math.abs(hash) % 360;
}

/** Validate CPF (Brazilian) */
export function validateCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    let sum = 0, remainder;
    for (let i = 1; i <= 9; i++) sum += parseInt(cpf[i - 1]) * (11 - i);
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf[9])) return false;
    sum = 0;
    for (let i = 1; i <= 10; i++) sum += parseInt(cpf[i - 1]) * (12 - i);
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    return remainder === parseInt(cpf[10]);
}

/** Format CPF */
export function formatCPF(cpf) {
    return cpf.replace(/\D/g, '')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

/** Validate email */
export function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Validate phone */
export function validatePhone(phone) {
    return /^\(\d{2}\)\s?\d{4,5}-\d{4}$/.test(phone);
}

/** Format phone */
export function formatPhone(phone) {
    const d = phone.replace(/\D/g, '');
    if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return phone;
}

/** Debounce */
export function debounce(fn, ms = 300) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), ms);
    };
}

/** Sort array by key */
export function sortBy(arr, key, dir = 'asc') {
    return [...arr].sort((a, b) => {
        let av = a[key] ?? '', bv = b[key] ?? '';
        if (typeof av === 'string') av = av.toLowerCase();
        if (typeof bv === 'string') bv = bv.toLowerCase();
        if (av < bv) return dir === 'asc' ? -1 : 1;
        if (av > bv) return dir === 'asc' ? 1 : -1;
        return 0;
    });
}

/** Filter array by text (searches all string fields) */
export function filterByText(arr, text) {
    if (!text.trim()) return arr;
    const q = text.toLowerCase().trim();
    return arr.filter(item =>
        Object.values(item).some(v => String(v).toLowerCase().includes(q))
    );
}

/** Calculate grade situation */
export function gradeSituation(media) {
    const m = parseFloat(media);
    if (isNaN(m)) return null;
    if (m >= 7) return 'approved';
    if (m >= 5) return 'recovery';
    return 'failed';
}

export function gradeSituationLabel(situation) {
    const map = { approved: 'Aprovado', recovery: 'Recuperação', failed: 'Reprovado' };
    return map[situation] || '—';
}

/** Translate role to label */
export function roleLabel(role) {
    const map = { admin: 'Administrador', professor: 'Professor', secretaria: 'Secretário(a)', coordenador: 'Coordenador' };
    return map[role] || role;
}

/** Calculate average */
export function calcAverage(grades) {
    const valid = grades.filter(g => g !== null && g !== '' && !isNaN(Number(g)));
    if (!valid.length) return null;
    return (valid.reduce((s, g) => s + Number(g), 0) / valid.length).toFixed(1);
}

/** Export to CSV */
export function exportToCSV(data, filename, headers) {
    const rows = [headers.map(h => h.label)];
    data.forEach(row => {
        rows.push(headers.map(h => {
            const val = row[h.key] ?? '';
            return `"${String(val).replace(/"/g, '""')}"`;
        }));
    });
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

/** Ripple effect on button click */
export function addRipple(e) {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    ripple.style.left = `${e.clientX - rect.left - 10}px`;
    ripple.style.top = `${e.clientY - rect.top - 10}px`;
    btn.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
}

/** Add ripple to all buttons in element */
export function initRipple(container = document) {
    container.querySelectorAll('.btn:not([data-ripple])').forEach(btn => {
        btn.setAttribute('data-ripple', '');
        btn.addEventListener('click', addRipple);
    });
}

/** Escape HTML */
export function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Show a simple confirmation modal.
 */
export async function showConfirm(modal, { title, message, icon, confirmText = 'Sim, confirmar', cancelText = 'Cancelar', type = 'primary' }) {
    return new Promise((resolve) => {
        const body = `<p>${message}</p>`;
        const footer = `
            ${cancelText ? `<button class="btn btn-ghost" id="confirm-cancel">${cancelText}</button>` : ''}
            <button class="btn btn-${type}" id="confirm-ok">${confirmText}</button>
        `;
        modal.open({ title, icon, body, footer, size: 'sm' });

        let resolved = false;

        const onCancel = () => {
            if (resolved) return;
            resolved = true;
            modal.close();
            resolve(false);
        };

        const onConfirm = () => {
            if (resolved) return;
            resolved = true;
            modal.close();
            resolve(true);
        };

        const cancelBtn = modal.shadowRoot.getElementById('confirm-cancel');
        if (cancelBtn) cancelBtn.onclick = onCancel;
        modal.shadowRoot.getElementById('confirm-ok').onclick = onConfirm;

        const handleClose = () => {
            if (!resolved) {
                resolved = true;
                resolve(false);
            }
            modal.removeEventListener('modal-close', handleClose);
        };
        modal.addEventListener('modal-close', handleClose);
    });
}

/**
 * Show a secure confirmation modal with password verification.
 */
export async function showSecureConfirm(modal, { title, message, icon, confirmText = 'Confirmar Exclusão', type = 'danger', showReason = false }) {
    return new Promise((resolve) => {
        let reasonHtml = '';
        if (showReason) {
            reasonHtml = `
                <div class="form-group" style="margin-top:16px">
                    <label class="form-label">Motivo / Situação</label>
                    <select class="form-control" id="secure-reason">
                        <option value="Inativo">Inativo</option>
                        <option value="Evasão">Evasão</option>
                        <option value="Transferência">Transferência</option>
                        <option value="Expulsão">Expulsão</option>
                        <option value="Outro">Outro</option>
                    </select>
                </div>
            `;
        }

        const body = `
            <p>${message}</p>
            ${reasonHtml}
            <div class="form-group" style="margin-top:16px">
                <label class="form-label">Sua Senha Pessoal <span class="required">*</span></label>
                <input type="password" class="form-control" id="secure-password" placeholder="Digite sua senha para confirmar" />
            </div>
            <div id="secure-error" style="color:#f87171;font-size:12px;margin-top:8px;display:none">Senha incorreta.</div>
        `;
        const footer = `
            <button class="btn btn-ghost" id="secure-cancel">Cancelar</button>
            <button class="btn btn-${type}" id="secure-ok">${confirmText}</button>
        `;

        modal.open({ title, icon, body, footer, size: 'sm' });

        const btnOk = modal.shadowRoot.getElementById('secure-ok');
        const pwdInput = modal.shadowRoot.getElementById('secure-password');
        const errEl = modal.shadowRoot.getElementById('secure-error');

        let resolved = false;

        const onCancel = () => {
            if (resolved) return;
            resolved = true;
            modal.close();
            resolve(null);
        };

        modal.shadowRoot.getElementById('secure-cancel').onclick = onCancel;

        btnOk.onclick = async () => {
            const pwd = pwdInput.value;
            if (!pwd) {
                pwdInput.focus();
                return;
            }

            btnOk.disabled = true;
            btnOk.textContent = 'Verificando...';
            
            try {
                const { auth } = await import('./store.js');
                const isValid = await auth.verifyPassword(pwd);

                if (isValid) {
                    const reason = modal.shadowRoot.getElementById('secure-reason')?.value || null;
                    resolved = true;
                    modal.close();
                    resolve({ password: pwd, reason });
                } else {
                    throw new Error('Invalid');
                }
            } catch (err) {
                btnOk.disabled = false;
                btnOk.textContent = confirmText;
                errEl.style.display = 'block';
                pwdInput.value = '';
                pwdInput.focus();
            }
        };

        const handleClose = () => {
            if (!resolved) {
                resolved = true;
                resolve(null);
            }
            modal.removeEventListener('modal-close', handleClose);
        };
        modal.addEventListener('modal-close', handleClose);
    });
}

/** Get relative time */
export function relativeTime(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'agora';
    if (mins < 60) return `há ${mins} min`;
    if (hours < 24) return `há ${hours}h`;
    if (days === 1) return 'ontem';
    if (days < 7) return `há ${days} dias`;
    return formatDate(dateStr);
}

/**
 * Auto-save: persists form field values in localStorage.
 * Key should be unique per form (e.g. 'aluno-novo', 'turma-edit-123').
 * Marks window._formDirty = true when saving so the exit warning can trigger.
 */
export const formDraft = {
    save(key, formEl) {
        const data = {};
        formEl.querySelectorAll('[name]').forEach(el => {
            if (el.name) data[el.name] = el.value;
        });
        // Only mark dirty if at least one field has content
        const hasContent = Object.values(data).some(v => String(v).trim() !== '');
        if (hasContent) window._formDirty = true;
        localStorage.setItem('edu_draft_' + key, JSON.stringify(data));
    },

    restore(key, formEl) {
        try {
            const saved = JSON.parse(localStorage.getItem('edu_draft_' + key));
            if (!saved) return false;
            formEl.querySelectorAll('[name]').forEach(el => {
                if (el.name && saved[el.name] !== undefined) el.value = saved[el.name];
            });
            return true;
        } catch {
            return false;
        }
    },

    clear(key) {
        localStorage.removeItem('edu_draft_' + key);
        window._formDirty = false;
    },

    has(key) {
        return !!localStorage.getItem('edu_draft_' + key);
    },
};

/** Calculate age from date string */
export function calculateAge(birthDateStr) {
    if (!birthDateStr) return null;
    const today = new Date();
    const birthDate = new Date(birthDateStr + (birthDateStr.length === 10 ? 'T00:00:00' : ''));
    if (isNaN(birthDate.getTime())) return null;
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

/** Compress an image file to a maximum dimension and quality in client side */
export function compressImage(file, maxDimension = 200, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Downscale proportionally if larger than maxDimension
                if (width > height) {
                    if (width > maxDimension) {
                        height = Math.round((height * maxDimension) / width);
                        width = maxDimension;
                    }
                } else {
                    if (height > maxDimension) {
                        width = Math.round((width * maxDimension) / height);
                        height = maxDimension;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Export to WebP if supported, otherwise fall back to JPEG
                try {
                    const dataUrl = canvas.toDataURL('image/webp', quality);
                    resolve(dataUrl);
                } catch {
                    try {
                        const dataUrl = canvas.toDataURL('image/jpeg', quality);
                        resolve(dataUrl);
                    } catch (e) {
                        resolve(event.target.result); // Fallback to raw base64 if canvas export fails
                    }
                }
            };
            img.onerror = () => resolve(event.target.result); // Fallback on load error
            img.src = event.target.result;
        };
        reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
        reader.readAsDataURL(file);
    });
}

