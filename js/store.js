// =========================================================
// EduPresença – Data Store (localStorage CRUD)
// =========================================================
import { uid, today } from './utils.js';

const KEYS = {
    unidades: 'edu_unidades',
    turnos: 'edu_turnos',
    cursos: 'edu_cursos',
    disciplinas: 'edu_disciplinas',
    turmas: 'edu_turmas',
    alunos: 'edu_alunos',
    presencas: 'edu_presencas',
    notas: 'edu_notas',
    config: 'edu_config',
};

// ── Generic CRUD ────────────────────────────────────────
function load(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch { return []; }
}

function save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function loadObj(key, def = {}) {
    try { return JSON.parse(localStorage.getItem(key)) || def; }
    catch { return def; }
}

function saveObj(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function createStore(key) {
    return {
        getAll: () => load(key),
        getById: (id) => load(key).find(item => item.id === id) || null,
        create: (data) => {
            const items = load(key);
            const item = { ...data, id: uid(), createdAt: new Date().toISOString() };
            items.push(item);
            save(key, items);
            return item;
        },
        update: (id, data) => {
            const items = load(key);
            const idx = items.findIndex(i => i.id === id);
            if (idx === -1) return null;
            items[idx] = { ...items[idx], ...data, updatedAt: new Date().toISOString() };
            save(key, items);
            return items[idx];
        },
        delete: (id) => {
            const items = load(key).filter(i => i.id !== id);
            save(key, items);
        },
        restore: (item) => {
            const items = load(key);
            if (!items.find(i => i.id === item.id)) {
                items.push(item);
                save(key, items);
            }
        },
        count: () => load(key).length,
    };
}

// ── Stores ──────────────────────────────────────────────
export const unidades = createStore(KEYS.unidades);
export const turnos = createStore(KEYS.turnos);
export const cursos = createStore(KEYS.cursos);
export const disciplinas = createStore(KEYS.disciplinas);
export const turmas = createStore(KEYS.turmas);
export const alunos = createStore(KEYS.alunos);

// ── Presença (special: keyed by turma+date) ────────────
export const presencas = {
    getAll: () => load(KEYS.presencas),
    getByTurmaData: (turmaId, data) =>
        load(KEYS.presencas).filter(p => p.turmaId === turmaId && p.data === data),
    save: (turmaId, data, registros) => {
        const all = load(KEYS.presencas).filter(
            p => !(p.turmaId === turmaId && p.data === data)
        );
        const now = new Date().toISOString();
        registros.forEach(r => {
            all.push({ id: uid(), turmaId, data, alunoId: r.alunoId, presente: r.presente, justificativa: r.justificativa || '', createdAt: now });
        });
        save(KEYS.presencas, all);
    },
    getHistorico: (turmaId) =>
        load(KEYS.presencas).filter(p => p.turmaId === turmaId),
    getByAluno: (alunoId) =>
        load(KEYS.presencas).filter(p => p.alunoId === alunoId),
    getStats: (turmaId) => {
        const all = load(KEYS.presencas).filter(p => p.turmaId === turmaId);
        const total = all.length;
        const presentes = all.filter(p => p.presente).length;
        return { total, presentes, ausentes: total - presentes };
    },
    getDates: (turmaId) => {
        const dates = new Set(
            load(KEYS.presencas).filter(p => p.turmaId === turmaId).map(p => p.data)
        );
        return [...dates].sort().reverse();
    },
};

// ── Notas (special: keyed by turma+disciplina+aluno) ───
export const notas = {
    getAll: () => load(KEYS.notas),
    getByTurmaDisciplina: (turmaId, disciplina) =>
        load(KEYS.notas).filter(n => n.turmaId === turmaId && n.disciplina === disciplina),
    getByAluno: (alunoId) =>
        load(KEYS.notas).filter(n => n.alunoId === alunoId),
    save: (turmaId, disciplina, periodo, registros) => {
        const all = load(KEYS.notas).filter(
            n => !(n.turmaId === turmaId && n.disciplina === disciplina && n.periodo === periodo)
        );
        const now = new Date().toISOString();
        registros.forEach(r => {
            all.push({
                id: uid(), turmaId, disciplina, periodo,
                alunoId: r.alunoId, nota: r.nota, createdAt: now
            });
        });
        save(KEYS.notas, all);
    },
    getDisciplinas: (turmaId) => {
        const all = load(KEYS.notas).filter(n => n.turmaId === turmaId);
        return [...new Set(all.map(n => n.disciplina))];
    },
};

// ── Config ─────────────────────────────────────────────
export const config = {
    get: () => loadObj(KEYS.config, { theme: 'dark', anoLetivo: new Date().getFullYear() }),
    set: (data) => saveObj(KEYS.config, { ...loadObj(KEYS.config), ...data }),
};

// ── Usuários ────────────────────────────────────────────
KEYS.usuarios = 'edu_usuarios';
export const usuarios = createStore(KEYS.usuarios);

// ── Auth ────────────────────────────────────────────────
const SESSION_KEY = 'edu_session';

async function hashPassword(password) {
    const enc = new TextEncoder().encode(password);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export const auth = {
    async login(username, password) {
        const hash = await hashPassword(password);
        const user = load(KEYS.usuarios).find(
            u => u.username.toLowerCase() === username.toLowerCase() && u.passwordHash === hash
        );
        if (user) {
            const session = { id: user.id, nome: user.nome, username: user.username, role: user.role, foto: user.foto || null };
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
            return session;
        }
        return null;
    },
    logout() {
        sessionStorage.removeItem(SESSION_KEY);
    },
    currentUser() {
        try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || null; }
        catch { return null; }
    },
    async changePassword(userId, newPassword) {
        const hash = await hashPassword(newPassword);
        usuarios.update(userId, { passwordHash: hash });
    },
    async createUser(data) {
        const hash = await hashPassword(data.password || 'senha123');
        return usuarios.create({ ...data, passwordHash: hash });
    },
    isAdmin() {
        return auth.currentUser()?.role === 'admin';
    },
};

// ── Seed Data (first load only) ─────────────────────────
export async function seedIfEmpty() {
    // Seed default admin user if none exists
    if (load(KEYS.usuarios).length === 0) {
        const hash = await hashPassword('admin123');
        usuarios.create({ nome: 'Administrador', username: 'admin', email: 'admin@edupresenca.app', role: 'admin', passwordHash: hash });
    }
    // No demo data — system starts clean
}
