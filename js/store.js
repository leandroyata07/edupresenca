// =========================================================
// EduPresença – Data Store (localStorage CRUD)
// =========================================================
import { uid, today } from './utils.js';

export const KEYS = {
    unidades: 'edu_unidades',
    turnos: 'edu_turnos',
    cursos: 'edu_cursos',
    disciplinas: 'edu_disciplinas',
    turmas: 'edu_turmas',
    alunos: 'edu_alunos',
    presencas: 'edu_presencas',
    notas: 'edu_notas',
    config: 'edu_config',
    logs: 'edu_logs',
    usuarios: 'edu_usuarios',
    horarios: 'edu_horarios',
};

export function getAnoLetivo() {
    return localStorage.getItem('edu_ano_letivo') || String(new Date().getFullYear());
}

export function setAnoLetivo(year) {
    localStorage.setItem('edu_ano_letivo', String(year));
}

// ── Automatic Year Transition ───────────────────────────
function checkAutomaticYearTransition() {
    try {
        const currentCalendarYear = new Date().getFullYear();
        const lastKnownYearStr = localStorage.getItem('edu_last_known_calendar_year');
        
        if (lastKnownYearStr) {
            const lastKnownYear = parseInt(lastKnownYearStr, 10);
            if (currentCalendarYear > lastKnownYear) {
                // A virada de ano ocorreu! Altera automaticamente o ano letivo ativo
                localStorage.setItem('edu_ano_letivo', String(currentCalendarYear));
            }
        }
        // Atualiza sempre o último ano calendário conhecido
        localStorage.setItem('edu_last_known_calendar_year', String(currentCalendarYear));
    } catch (e) {
        console.error('Erro na checagem de transição de ano:', e);
    }
}
checkAutomaticYearTransition();

function getStoreKey(baseKey) {
    const segregated = ['edu_turmas', 'edu_alunos', 'edu_presencas', 'edu_notas', 'edu_horarios'];
    if (segregated.includes(baseKey)) {
        return `${baseKey}_${getAnoLetivo()}`;
    }
    return baseKey;
}

// ── Firebase Cloud Sync Integration ──────────────────────
export function isSyncUser() {
    try {
        const session = JSON.parse(sessionStorage.getItem('edu_session')) || null;
        return session && session.email !== 'teste@edupresenca.com' && (session.email === 'admin@leandroyata.com.br' || session.isCloudSession === true);
    } catch {
        return false;
    }
}

async function uploadBase64ToStorage(base64Str, path) {
    if (!base64Str || !base64Str.startsWith('data:')) return base64Str;
    try {
        if (typeof firebase === 'undefined' || !firebase.storage) return base64Str;
        
        const mimeType = base64Str.split(';')[0].split(':')[1];
        const rawData = base64Str.split(',')[1];
        
        const byteCharacters = atob(rawData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });
        
        const ref = firebase.storage().ref().child(path);
        
        // Timeout aumentado para 15 segundos para redes lentas
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout no Firebase Storage')), 15000)
        );
        
        const snapshot = await Promise.race([ref.put(blob), timeoutPromise]);
        const downloadUrl = await snapshot.ref.getDownloadURL();
        return downloadUrl;
    } catch (e) {
        console.error('Erro no upload da imagem para o Firebase Storage:', e);
        return base64Str; // Return base64 to indicate failure
    }
}

// Queue for serializing syncs to prevent race conditions with Firebase Storage
const syncQueue = {};

// ── Pending Sync Retry Queue (B2+B3 implementation) ─────────────────────────
// Stores failed Firestore syncs for automatic retry every 30 seconds.
// Dispatches 'sync-status' events so the header can show/hide the indicator.
const pendingSyncQueue = new Map(); // key → { key, data, isObj }
let syncRetryTimer = null;

function dispatchSyncStatus() {
    const count = pendingSyncQueue.size;
    document.dispatchEvent(new CustomEvent('sync-status', { detail: { pending: count } }));
}

function scheduleSyncRetry() {
    if (syncRetryTimer) return; // already scheduled
    syncRetryTimer = setInterval(async () => {
        if (pendingSyncQueue.size === 0) {
            clearInterval(syncRetryTimer);
            syncRetryTimer = null;
            return;
        }
        if (typeof firebase === 'undefined' || !firebase.firestore) return;
        console.log(`[SyncRetry] Tentando reenviar ${pendingSyncQueue.size} item(s) pendente(s)...`);
        const entries = [...pendingSyncQueue.entries()];
        for (const [key, item] of entries) {
            try {
                const db = firebase.firestore();
                const finalKey = getStoreKey(key);
                const setTask = db.collection('edupresenca_sync')
                    .doc('admin@leandroyata.com.br')
                    .collection('tabelas')
                    .doc(finalKey)
                    .set(item.isObj ? item.data : { items: item.data });
                const timeout = new Promise((_, r) => setTimeout(() => r(new Error('Timeout')), 10000));
                await Promise.race([setTask, timeout]);
                pendingSyncQueue.delete(key);
                console.log(`[SyncRetry] Reenvio OK: ${finalKey}`);
            } catch (e) {
                console.warn(`[SyncRetry] Falhou novamente: ${key}`, e.message);
            }
        }
        dispatchSyncStatus();
        if (pendingSyncQueue.size === 0) {
            clearInterval(syncRetryTimer);
            syncRetryTimer = null;
            // Notify header: all synced
            if (window.toast) window.toast.success('Sincronizado ✅', 'Todas as alterações foram enviadas para a nuvem.');
        }
    }, 30000);
}

export async function awaitPendingSyncs() {
    const promises = Object.values(syncQueue);
    if (promises.length > 0) {
        console.log('Aguardando a conclusão de todas as sincronizações pendentes na nuvem...');
        await Promise.all(promises);
    }
}

export async function triggerCloudSync(key, data, isObj = false) {
    if (!isSyncUser()) return;
    if (typeof firebase === 'undefined' || !firebase.firestore) return;

    // Serialize sync operations for the same key
    if (!syncQueue[key]) {
        syncQueue[key] = Promise.resolve();
    }

    const syncTask = async () => {
        try {
            const db = firebase.firestore();
            const syncData = JSON.parse(JSON.stringify(data)); // Deep copy to avoid mutating active UI data
            const finalKey = getStoreKey(key);

            // Upload base64 images to Storage before saving to Firestore
            if (Array.isArray(syncData)) {
                for (const item of syncData) {
                    if (item.foto && item.foto.startsWith('data:image')) {
                        const uniquePath = `fotos/${key}/${item.id || uid()}.webp`;
                        item.foto = await uploadBase64ToStorage(item.foto, uniquePath);
                        if (item.foto.startsWith('data:image')) {
                            // Upload failed. Prevent sending base64 to Firestore to avoid 1MB limit!
                            delete item.foto;
                            if (window.toast) window.toast.error('Erro na Imagem', 'A foto não pôde ser sincronizada.');
                        } else {
                            updateLocalFotoUrl(key, item.id, item.foto);
                        }
                    }
                }
            } else if (syncData && typeof syncData === 'object') {
                if (syncData.foto && syncData.foto.startsWith('data:image')) {
                    const uniquePath = `fotos/${key}/${syncData.id || uid()}.webp`;
                    syncData.foto = await uploadBase64ToStorage(syncData.foto, uniquePath);
                    if (syncData.foto.startsWith('data:image')) {
                        delete syncData.foto;
                        if (window.toast) window.toast.error('Erro na Imagem', 'A foto de perfil não pôde ser salva.');
                    } else {
                        updateLocalFotoUrl(key, syncData.id, syncData.foto);
                    }
                }
            }

            // Write to Firestore with Timeout (10 seconds)
            const setTask = db.collection('edupresenca_sync')
                .doc('admin@leandroyata.com.br')
                .collection('tabelas')
                .doc(finalKey)
                .set(isObj ? syncData : { items: syncData });
            
            const setTimeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout no Firebase Firestore')), 10000));
            await Promise.race([setTask, setTimeoutPromise]);

            console.log(`Cloud Sync OK: ${finalKey}`);

            // If this key was in the retry queue, remove it
            if (pendingSyncQueue.has(key)) {
                pendingSyncQueue.delete(key);
                dispatchSyncStatus();
                if (pendingSyncQueue.size === 0) {
                    clearInterval(syncRetryTimer);
                    syncRetryTimer = null;
                    if (window.toast) window.toast.success('Sincronizado ✅', 'Todas as alterações foram enviadas para a nuvem.');
                }
            }
        } catch (e) {
            console.error(`Erro na sincronização em nuvem da tabela ${key}:`, e);
            // Permission errors are always shown
            if (e.code === 'permission-denied' && key !== KEYS.logs) {
                window.toast?.error('Permissão Negada', 'Você não tem permissão para salvar alterações na nuvem.');
                return;
            }
            // Network/timeout errors: add to retry queue and signal header
            const isNetworkError = !e.code || e.message?.includes('Timeout') || e.code === 'unavailable' || e.code === 'deadline-exceeded';
            if (isNetworkError) {
                // Store the original (pre-image-upload) data snapshot for retry
                pendingSyncQueue.set(key, { key, data: JSON.parse(JSON.stringify(data)), isObj });
                dispatchSyncStatus();
                scheduleSyncRetry();
            }
        }
    };

    // Chain the task to the queue for this key
    syncQueue[key] = syncQueue[key].then(syncTask).catch(syncTask);
    
    // We do NOT await the queue here, we just let it run in the background. 
    // This prevents UI freezing if the caller (e.g. configuracoes.js) awaits triggerCloudSync.
    return syncQueue[key];
}

function updateLocalFotoUrl(key, id, remoteUrl) {
    const finalKey = getStoreKey(key);
    try {
        const items = JSON.parse(localStorage.getItem(finalKey));
        if (Array.isArray(items)) {
            const idx = items.findIndex(i => i.id === id);
            if (idx !== -1) {
                items[idx].foto = remoteUrl;
                localStorage.setItem(finalKey, JSON.stringify(items));
            }
        } else if (items && typeof items === 'object' && items.id === id) {
            items.foto = remoteUrl;
            localStorage.setItem(finalKey, JSON.stringify(items));
        }
        
        // Ensure active session is updated if the logged user changed their own photo
        if (key === KEYS.usuarios) {
            const session = JSON.parse(sessionStorage.getItem(SESSION_KEY));
            if (session && (session.id === id || session.email === id)) {
                session.foto = remoteUrl;
                sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
                document.querySelector('app-header')?.setUser?.(session);
                document.querySelector('app-sidebar')?.setUser?.(session);
            }
        }
    } catch (e) {
        console.error('Erro ao atualizar URL local da foto:', e);
    }
}

export async function syncFromCloud(showErrorToast = false) {
    if (!isSyncUser()) return;
    if (typeof firebase === 'undefined' || !firebase.firestore) return;
    
    try {
        console.log('Iniciando sincronização a partir do Firebase Firestore...');
        const db = firebase.firestore();
        const tablesSnapshot = await db.collection('edupresenca_sync')
            .doc('admin@leandroyata.com.br')
            .collection('tabelas')
            .get();
            
        const downloadedKeys = new Set();
        tablesSnapshot.forEach(doc => {
            const finalKey = doc.id;
            const data = doc.data();
            downloadedKeys.add(finalKey);
            
            if (data && data.items) {
                const localStr = localStorage.getItem(finalKey);
                if (localStr) {
                    try {
                        const localItems = JSON.parse(localStr);
                        if (Array.isArray(localItems) && localItems.length > 0 && Array.isArray(data.items) && data.items.length === 0) {
                            console.warn(`[Sync] Tabela local ${finalKey} tem ${localItems.length} itens, mas nuvem está vazia. Preservando local.`);
                            // Trigger upload of local data to restore the cloud
                            let baseKey = finalKey;
                            for (const k of Object.values(KEYS)) {
                                if (finalKey.startsWith(k)) {
                                    baseKey = k;
                                    break;
                                }
                            }
                            triggerCloudSync(baseKey, localItems, false);
                            return; // Do not overwrite local storage
                        }
                    } catch (err) {
                        console.error(`Erro ao analisar dados locais para segurança de sync em ${finalKey}:`, err);
                    }
                }
                localStorage.setItem(finalKey, JSON.stringify(data.items));
            } else if (data) {
                localStorage.setItem(finalKey, JSON.stringify(data));
            }
        });

        // Se baixamos dados com sucesso, resetamos apenas as tabelas dinâmicas de presenças e notas do ano letivo ativo que não existam mais no Firebase
        if (!tablesSnapshot.empty) {
            const keysToReset = [KEYS.presencas, KEYS.notas];
            for (const key of keysToReset) {
                const finalKey = getStoreKey(key);
                if (!downloadedKeys.has(finalKey)) {
                    localStorage.setItem(finalKey, '[]');
                }
            }
        }
        console.log('Sincronização com o Firebase concluída com sucesso!');
    } catch (e) {
        console.error('Erro na sincronização de download do Firebase:', e);
        if (showErrorToast) {
            if (e.code === 'permission-denied') {
                window.toast?.error(
                    'Erro de Permissão (Firestore)',
                    'O seu usuário não tem permissão para ler os dados do banco de dados na nuvem. Verifique se as Regras de Segurança do seu Firebase Firestore estão configuradas para permitir acesso a usuários autenticados.'
                );
            } else {
                window.toast?.error(
                    'Falha no Download',
                    e.message || 'Não foi possível baixar os dados de sincronização da nuvem.'
                );
            }
        }
    }
}

export async function pushAllToCloud() {
    if (!isSyncUser()) return;
    if (typeof firebase === 'undefined' || !firebase.firestore) return;
    
    console.log('Iniciando upload total de banco de dados para o Firebase...');
    for (const key of Object.values(KEYS)) {
        const finalKey = getStoreKey(key);
        try {
            const dataStr = localStorage.getItem(finalKey);
            if (dataStr) {
                const data = JSON.parse(dataStr);
                await triggerCloudSync(key, data, key === KEYS.config);
            }
        } catch (e) {
            console.error(`Erro ao enviar tabela ${key} para nuvem:`, e);
        }
    }
    console.log('Upload total do banco de dados concluído!');
}

function load(key) {
    const finalKey = getStoreKey(key);
    try { return JSON.parse(localStorage.getItem(finalKey)) || []; }
    catch { return []; }
}

function save(key, data) {
    const finalKey = getStoreKey(key);
    localStorage.setItem(finalKey, JSON.stringify(data));
    triggerCloudSync(key, data, false);
}

function loadObj(key, def = {}) {
    const finalKey = getStoreKey(key);
    try { return JSON.parse(localStorage.getItem(finalKey)) || def; }
    catch { return def; }
}

function saveObj(key, data) {
    const finalKey = getStoreKey(key);
    localStorage.setItem(finalKey, JSON.stringify(data));
    triggerCloudSync(key, data, true);
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
export const horarios = createStore(KEYS.horarios);

// ── Presença (special: keyed by turma+date+disciplina) ────────────
export const presencas = {
    getAll: () => load(KEYS.presencas),
    getByTurmaData: (turmaId, data, disciplinaId = null) =>
        load(KEYS.presencas).filter(p => 
            p.turmaId === turmaId && 
            p.data === data && 
            (!disciplinaId || p.disciplinaId === disciplinaId)
        ),
    save: (turmaId, data, registros, disciplinaId = null) => {
        const all = load(KEYS.presencas).filter(p => 
            !(p.turmaId === turmaId && p.data === data && p.disciplinaId === disciplinaId)
        );
        const now = new Date().toISOString();
        registros.forEach(r => {
            all.push({ 
                id: uid(), 
                turmaId, 
                data, 
                disciplinaId, 
                alunoId: r.alunoId, 
                presente: r.presente, 
                justificativa: r.justificativa || '', 
                createdAt: now 
            });
        });
        save(KEYS.presencas, all);
    },
    delete: (turmaId, data, disciplinaId = null) => {
        const all = load(KEYS.presencas).filter(p => 
            !(p.turmaId === turmaId && p.data === data && p.disciplinaId === disciplinaId)
        );
        save(KEYS.presencas, all);
    },
    getHistorico: (turmaId, disciplinaId = null) =>
        load(KEYS.presencas).filter(p => 
            p.turmaId === turmaId && 
            (!disciplinaId || p.disciplinaId === disciplinaId)
        ),
    getByAluno: (alunoId, disciplinaIds = null) => {
        let list = load(KEYS.presencas).filter(p => p.alunoId === alunoId);
        if (disciplinaIds) {
            const arr = Array.isArray(disciplinaIds) ? disciplinaIds : [disciplinaIds];
            list = list.filter(p => arr.includes(p.disciplinaId));
        }
        return list;
    },
    getStats: (turmaId, disciplinaId = null) => {
        const all = load(KEYS.presencas).filter(p => 
            p.turmaId === turmaId && 
            (!disciplinaId || p.disciplinaId === disciplinaId)
        );
        const total = all.length;
        const presentes = all.filter(p => p.presente).length;
        return { total, presentes, ausentes: total - presentes };
    },
    getDates: (turmaId, disciplinaId = null) => {
        const dates = new Set(
            load(KEYS.presencas)
                .filter(p => p.turmaId === turmaId && (!disciplinaId || p.disciplinaId === disciplinaId))
                .map(p => p.data)
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
                alunoId: r.alunoId, 
                nota: r.nota, 
                parciais: r.parciais || [],
                createdAt: now
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
    get: () => loadObj(KEYS.config, { theme: 'light', anoLetivo: new Date().getFullYear() }),
    set: (data) => saveObj(KEYS.config, { ...loadObj(KEYS.config), ...data }),
};

// ── Usuários ────────────────────────────────────────────
export const usuarios = createStore(KEYS.usuarios);

// ── Logs ───────────────────────────────────────────────
export const logs = createStore(KEYS.logs);

export function addLog(action, entity, details = {}) {
    const user = auth.currentUser();
    const items = logs.getAll();
    items.push({
        id: uid(),
        createdAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        userId: user?.id || 'system',
        userName: user?.nome || 'Sistema',
        userRole: user?.role || 'system',
        action, // CREATE, UPDATE, DELETE
        entity,
        details
    });
    // Limita o histórico de logs local a 200 itens para não estourar a memória e o limite de 1MB do Firestore
    if (items.length > 200) {
        items.splice(0, items.length - 200);
    }
    save(KEYS.logs, items);
}

// ── Auth (Firebase Integration) ────────────────────────
const SESSION_KEY = 'edu_session';

async function hashPassword(password) {
    if (!crypto.subtle) {
        console.warn('Crypto subtle not available. Using insecure fallback.');
        // Simple fallback for local demonstration/file access
        return btoa(password).split('').reverse().join('');
    }
    const enc = new TextEncoder().encode(password);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function registerUserInFirebase(email, password) {
    if (typeof firebase === 'undefined' || !firebase.auth) return;
    let tempApp = null;
    try {
        const currentApp = firebase.app();
        const config = currentApp.options;
        const appName = "TempRegistrationApp_" + Date.now();
        tempApp = firebase.initializeApp(config, appName);
        const tempAuth = tempApp.auth();
        // Disable persistence entirely for background registration to prevent primary Admin session disruption
        await tempAuth.setPersistence(firebase.auth.Auth.Persistence.NONE);
        await tempAuth.createUserWithEmailAndPassword(email, password);
        console.log(`Usuário ${email} registrado com sucesso no Firebase Auth!`);
    } catch (e) {
        if (e.code === 'auth/email-already-in-use') {
            console.warn('E-mail já está cadastrado no Firebase Auth, pulando.');
        } else {
            console.error('Erro no registro em background no Firebase Auth:', e);
            throw e;
        }
    } finally {
        if (tempApp) {
            try {
                await tempApp.delete();
            } catch (delErr) {
                console.error('Erro ao deletar app temporário do Firebase:', delErr);
            }
        }
    }
}

export const auth = {
    async login(email, password) {
        try {
            let loginEmail = email.trim().toLowerCase();
            if (loginEmail === 'admin') {
                loginEmail = 'admin@leandroyata.com.br';
            }

            // 1. Try Firebase first (Primary)
            if (typeof firebase !== 'undefined') {
                // Configure Firebase Auth Persistence to SESSION so closing tab/browser logs out instantly
                try {
                    await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION);
                } catch (persistErr) {
                    console.warn('Falha ao configurar persistência de sessão:', persistErr);
                }

                const userCredential = await firebase.auth().signInWithEmailAndPassword(loginEmail, password);
                const user = userCredential.user;
                
                // Temporarily set a minimal session so isSyncUser() passes during syncFromCloud
                const tempSession = { email: user.email, isCloudSession: true };
                sessionStorage.setItem(SESSION_KEY, JSON.stringify(tempSession));

                // Fetch the sync database first to hydrate local users on new device
                try {
                    await syncFromCloud();
                } catch (syncErr) {
                    console.error('Erro na sincronização pré-login:', syncErr);
                }

                // Look up the user record in our newly hydrated database to resolve custom role/details
                const localUsers = load('edu_usuarios') || [];
                const localUser = localUsers.find(u => u.email === user.email || u.username === user.email.split('@')[0]);

                const session = { 
                    id: localUser ? localUser.id : user.uid, 
                    nome: localUser ? localUser.nome : (user.displayName || user.email.split('@')[0]), 
                    username: localUser ? localUser.username : user.email.split('@')[0], 
                    email: user.email,
                    role: localUser ? localUser.role : ((user.email === 'admin@leandroyata.com.br' || user.email === 'teste@edupresenca.com') ? 'admin' : 'professor'), 
                    foto: localUser ? localUser.foto : (user.photoURL || null),
                    cursos: localUser ? (localUser.cursos || []) : [],
                    disciplinas: localUser ? (localUser.disciplinas || []) : [],
                    isCloudSession: true
                };
                sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
                return session;
            } else {
                throw new Error('Firebase não carregado');
            }
        } catch (error) {
            // 2. If Firebase fails or isn't loaded, check local accounts fallback
            const loginEmail = email.trim().toLowerCase();
            const hash = await hashPassword(password);
            const localUser = load('edu_usuarios').find(
                u => (u.username?.toLowerCase() === loginEmail || u.email?.toLowerCase() === loginEmail) && u.passwordHash === hash
            );
            if (localUser) {
                const session = { 
                    id: localUser.id, 
                    nome: localUser.nome, 
                    username: localUser.username, 
                    email: localUser.email,
                    role: localUser.role, 
                    foto: localUser.foto || null,
                    cursos: localUser.cursos || [],
                    disciplinas: localUser.disciplinas || [],
                    isCloudSession: true // Enable cloud features if they are authorized
                };
                sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
                return session;
            }
            console.error('Login Error:', error);
            throw error;
        }
    },
    async logout() {
        try {
            await awaitPendingSyncs();
        } catch (e) {
            console.error('Erro ao aguardar sincronizações pendentes antes do logout:', e);
        }

        if (typeof firebase !== 'undefined') {
            try {
                firebase.auth().signOut();
            } catch (e) {}
        }
        sessionStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem('edu_trial_start');
        try {
            document.getElementById('trial-banner')?.remove();
        } catch (e) {}
    },
    currentUser() {
        try {
            const session = JSON.parse(sessionStorage.getItem(SESSION_KEY)) || null;
            if (session) {
                const localUsers = load('edu_usuarios') || [];
                const localUser = localUsers.find(u => u.id === session.id || u.email === session.email || u.username === session.username);
                if (localUser) {
                    session.foto = localUser.foto || null;
                    session.nome = localUser.nome || session.nome;
                    session.role = localUser.role || session.role;
                    session.cursos = localUser.cursos || [];
                    session.disciplinas = localUser.disciplinas || [];
                } else {
                    session.cursos = session.cursos || [];
                    session.disciplinas = session.disciplinas || [];
                }
            }
            return session;
        }
        catch { return null; }
    },
    async changePassword(userId, newPassword) {
        // 1. Try updating in Firebase if authenticated with Firebase and firebase is available
        if (typeof firebase !== 'undefined') {
            try {
                const user = firebase.auth().currentUser;
                if (user) {
                    await user.updatePassword(newPassword);
                }
            } catch (e) {
                console.warn('Firebase auth password update skipped or failed:', e);
            }
        }

        // 2. Also update locally in the local usuarios store
        const localUser = load(KEYS.usuarios).find(u => u.id === userId);
        if (localUser) {
            const hash = await hashPassword(newPassword);
            usuarios.update(userId, { passwordHash: hash });
        }
    },
    async verifyPassword(password) {
        const user = this.currentUser();
        if (!user) return false;

        // 1. Try Firebase re-auth if Firebase user and firebase is available
        if (typeof firebase !== 'undefined') {
            try {
                const fbUser = firebase.auth().currentUser;
                if (fbUser && fbUser.email === user.email) {
                    const credential = firebase.auth.EmailAuthProvider.credential(fbUser.email, password);
                    await fbUser.reauthenticateWithCredential(credential);
                    return true;
                }
            } catch (e) {
                console.warn('Firebase re-auth failed:', e);
            }
        }

        // 2. Try Local/Trial check
        const hash = await hashPassword(password);
        const localUser = load(KEYS.usuarios).find(u => u.email === user.email || u.username === user.username);
        return localUser && localUser.passwordHash === hash;
    },
    getUser() {
        return this.currentUser();
    },
    isAdmin() {
        return this.getUser()?.role === 'admin';
    },
    isGestor() {
        const role = this.getUser()?.role;
        return ['admin', 'diretor', 'coordenador', 'secretaria'].includes(role);
    },
    isProfessor() {
        return this.getUser()?.role === 'professor';
    },
    async createUser(userData) {
        const { password, ...rest } = userData;
        const hash = await hashPassword(password || 'senha123');

        // Determine sync email
        let email = userData.email?.trim();
        if (!email) {
            email = `${userData.username.trim().toLowerCase()}@edupresenca.com`;
        }

        const newUser = usuarios.create({ ...rest, email, passwordHash: hash });
        
        // 1. Sync the user profile data to Firestore in the background (non-blocking)
        if (isSyncUser() && typeof firebase !== 'undefined' && firebase.firestore) {
            triggerCloudSync(KEYS.usuarios, load(KEYS.usuarios)).catch(syncErr => {
                console.error('Erro ao sincronizar novo usuário com o Firestore:', syncErr);
            });
        }

        // 2. Register in Firebase Auth in the background afterwards (non-blocking)
        if (isSyncUser() && typeof firebase !== 'undefined') {
            registerUserInFirebase(email, password || 'senha123').catch(err => {
                console.error('Falha ao registrar no Firebase Auth, salvando apenas local:', err);
            });
        }
        return newUser;
    }
};

// ── Seed Data ────────────────────────────────────────────
export async function seedIfEmpty() {
    // Cria o perfil de administrador padrão se não existir
    if (load(KEYS.usuarios).length === 0) {
        const hash = await hashPassword('admin123');
        usuarios.create({ 
            id: 'admin-fixed-id', // ID fixo para proteção
            nome: 'Administrador', 
            username: 'admin', 
            email: 'admin@leandroyata.com.br', 
            role: 'admin', 
            passwordHash: hash 
        });
    }
}



// ── Background Cloud Sync Bootstrap ──────────────────────
try {
    if (isSyncUser() && typeof firebase !== 'undefined' && firebase.auth) {
        let firstAuthResolve = true;
        firebase.auth().onAuthStateChanged((user) => {
            if (user && firstAuthResolve) {
                firstAuthResolve = false; // Garante que roda apenas uma vez no carregamento inicial
                console.log('[Firebase] Usuário autenticado resolvido. Iniciando sincronização em segundo plano...');
                syncFromCloud().catch(err => console.error('Erro na sincronização em segundo plano:', err));
            }
        });
    }
} catch (e) {
    console.error('Erro ao iniciar sincronização automática:', e);
}
