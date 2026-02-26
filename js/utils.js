// =========================================================
// EduPresença – Utility Functions
// =========================================================

/** Generate a unique ID */
export function uid() {
    return crypto.randomUUID();
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
 * Delete an item and show an undo toast for 5s.
 * If undo is clicked the item is restored and onRefresh() is called.
 */
export function deleteWithUndo(store, item, displayName, onRefresh) {
    store.delete(item.id);
    onRefresh();
    window.toast?.showWithAction({
        type: 'warning',
        title: 'Registro excluído',
        message: `"${displayName}" foi removido.`,
        duration: 5500,
        actionLabel: '↩ Desfazer',
        onAction: () => {
            store.restore(item);
            onRefresh();
            window.toast?.success('Restaurado!', `"${displayName}" foi recuperado.`);
        },
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
