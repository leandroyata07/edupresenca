// =========================================================
// EduPresença – SPA Router (History API)
// =========================================================

export class Router {
    constructor(routes, outlet) {
        this.routes = routes;
        this.outlet = outlet;
        this._currentCleanup = null;

        window.addEventListener('popstate', () => {
            if (window._formDirty) {
                // Restore forward state, then ask
                const confirmed = confirm('Há alterações não salvas. Deseja sair mesmo assim?');
                if (!confirmed) {
                    // Re-push current path so we stay here
                    history.pushState({}, '', location.pathname);
                    return;
                }
                window._formDirty = false;
                // Also clear any modal to avoid phantom dirty state
                document.querySelectorAll('app-modal').forEach(m => m.close?.());
            }
            this._navigate(location.pathname, false);
        });
        document.addEventListener('click', (e) => {
            const link = e.target.closest('[data-link]');
            if (link) {
                e.preventDefault();
                this.push(link.getAttribute('href') || link.dataset.href);
            }
        });
    }

    /** Resolve base URL (for GitHub Pages subdirectory) */
    get base() {
        const base = document.querySelector('base');
        return base ? base.getAttribute('href').replace(/\/$/, '') : '';
    }

    /** Push a new route */
    push(path) {
        if (window._formDirty) {
            const confirmed = confirm('Há alterações não salvas. Deseja sair mesmo assim?');
            if (!confirmed) return;
            window._formDirty = false;
            document.querySelectorAll('app-modal').forEach(m => m.close?.());
        }
        const fullPath = path.startsWith('http') ? path : this.base + path;
        if (location.pathname === fullPath) return;
        history.pushState({}, '', fullPath);
        this._navigate(path);
    }

    /** Replace current route */
    replace(path) {
        const fullPath = this.base + path;
        history.replaceState({}, '', fullPath);
        this._navigate(path);
    }

    /** Initial navigation */
    init() {
        let path = location.pathname.replace(this.base, '') || '/';
        if (!path.startsWith('/')) path = '/' + path;
        this._injectSkeletonStyles();
        this._navigate(path, false);
    }

    /** Internal navigation */
    async _navigate(rawPath, pushState = true) {
        // Clean up previous page
        if (typeof this._currentCleanup === 'function') {
            this._currentCleanup();
            this._currentCleanup = null;
        }

        // Normalize path
        let path = rawPath.replace(this.base, '') || '/';
        if (!path.startsWith('/')) path = '/' + path;

        // Show loading
        this._showLoading();

        // Find matching route
        const match = this._matchRoute(path);
        const route = match ? match.route : null;

        // Update sidebar active state
        document.querySelector('app-sidebar')?.setActive?.(path);

        // Animate out
        const outlet = document.getElementById('page-outlet');
        if (outlet) {
            outlet.style.opacity = '0';
            outlet.style.transform = 'translateY(8px)';
        }

        await new Promise(r => setTimeout(r, 80));

        // Show skeleton while module loads
        if (outlet) this._showSkeleton(outlet);

        try {
            if (!route) {
                this._render404(outlet);
                return;
            }

            const mod = await route.component();
            this._hideLoading();

            if (outlet) {
                outlet.style.transition = 'none';
                outlet.style.opacity = '0';
                outlet.style.transform = 'translateY(12px)';
                const cleanup = mod.render(outlet, match.params);
                this._currentCleanup = cleanup || null;
                // Clear any residual dirty state from previous page
                window._formDirty = false;
                // Update header title
                document.querySelector('app-header')?.setTitle?.(route.title);
                // Update page title
                document.title = `${route.title} – EduPresença`;
                await new Promise(r => setTimeout(r, 10));
                outlet.style.transition = 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.4,0,0.2,1)';
                outlet.style.opacity = '1';
                outlet.style.transform = 'translateY(0)';
                // Hook for external listeners (e.g. badge update)
                this.onNavigate?.();
            }
        } catch (err) {
            console.error('[Router] Error loading page:', err);
            this._hideLoading();
            if (outlet) {
                outlet.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <h3>Erro ao carregar página</h3>
            <p>${err.message}</p>
          </div>`;
            }
        }
    }

    _matchRoute(path) {
        for (const route of this.routes) {
            if (typeof route.path === 'string') {
                if (route.path === path) return { route, params: {} };
                // Parameterized: /alunos/:id
                const paramMatch = this._matchParam(route.path, path);
                if (paramMatch) return { route, params: paramMatch };
            } else if (route.path instanceof RegExp && route.path.test(path)) {
                return { route, params: {} };
            }
        }
        return null;
    }

    _matchParam(routePath, path) {
        const rParts = routePath.split('/');
        const pParts = path.split('/');
        if (rParts.length !== pParts.length) return null;
        const params = {};
        for (let i = 0; i < rParts.length; i++) {
            if (rParts[i].startsWith(':')) {
                params[rParts[i].slice(1)] = decodeURIComponent(pParts[i]);
            } else if (rParts[i] !== pParts[i]) {
                return null;
            }
        }
        return params;
    }

    _showLoading() {
        const el = document.getElementById('page-loading');
        if (el) el.style.display = 'block';
    }

    _hideLoading() {
        const el = document.getElementById('page-loading');
        if (el) el.style.display = 'none';
    }

    _showSkeleton(outlet) {
        outlet.style.opacity = '1';
        outlet.style.transform = 'none';
        outlet.innerHTML = `
            <div class="sk-page">
                <!-- Page header -->
                <div class="sk-header">
                    <div>
                        <div class="sk-shimmer" style="width:180px;height:28px;border-radius:8px;margin-bottom:8px"></div>
                        <div class="sk-shimmer" style="width:260px;height:16px;border-radius:6px"></div>
                    </div>
                    <div class="sk-shimmer" style="width:110px;height:36px;border-radius:8px"></div>
                </div>
                <!-- KPI row -->
                <div class="sk-kpi-row">
                    ${[1,2,3,4].map(() => `
                    <div class="sk-kpi-card">
                        <div class="sk-shimmer" style="width:40px;height:40px;border-radius:10px;margin-bottom:12px"></div>
                        <div class="sk-shimmer" style="width:60px;height:28px;border-radius:6px;margin-bottom:6px"></div>
                        <div class="sk-shimmer" style="width:80px;height:14px;border-radius:4px"></div>
                    </div>`).join('')}
                </div>
                <!-- Table card -->
                <div class="sk-card">
                    <div class="sk-card-header">
                        <div class="sk-shimmer" style="width:140px;height:18px;border-radius:6px"></div>
                        <div class="sk-shimmer" style="width:90px;height:30px;border-radius:7px"></div>
                    </div>
                    <div class="sk-card-body">
                        ${[1,2,3,4,5].map(() => `
                        <div class="sk-row">
                            <div class="sk-shimmer" style="width:36px;height:36px;border-radius:50%"></div>
                            <div style="flex:1">
                                <div class="sk-shimmer" style="width:60%;height:14px;border-radius:4px;margin-bottom:6px"></div>
                                <div class="sk-shimmer" style="width:40%;height:11px;border-radius:4px"></div>
                            </div>
                            <div class="sk-shimmer" style="width:70px;height:22px;border-radius:99px"></div>
                            <div class="sk-shimmer" style="width:52px;height:22px;border-radius:99px"></div>
                        </div>`).join('')}
                    </div>
                </div>
            </div>`;
    }

    _injectSkeletonStyles() {
        if (document.getElementById('sk-styles')) return;
        const style = document.createElement('style');
        style.id = 'sk-styles';
        style.textContent = `
            @keyframes sk-shimmer {
                0%   { background-position: -600px 0; }
                100% { background-position:  600px 0; }
            }
            .sk-shimmer {
                background: linear-gradient(90deg,
                    rgba(255,255,255,0.05) 25%,
                    rgba(255,255,255,0.10) 37%,
                    rgba(255,255,255,0.05) 63%);
                background-size: 1200px 100%;
                animation: sk-shimmer 1.4s infinite linear;
            }
            .sk-page    { display:flex; flex-direction:column; gap:24px; padding-bottom:24px; }
            .sk-header  { display:flex; align-items:center; justify-content:space-between; padding:4px 0 4px; }
            .sk-kpi-row { display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:14px; }
            .sk-kpi-card{ background:var(--surface-2); border:1px solid var(--border-color,rgba(255,255,255,0.08));
                          border-radius:14px; padding:20px 18px; }
            .sk-card    { background:var(--surface-2); border:1px solid var(--border-color,rgba(255,255,255,0.08));
                          border-radius:14px; overflow:hidden; }
            .sk-card-header { display:flex; align-items:center; justify-content:space-between;
                              padding:14px 20px; border-bottom:1px solid rgba(255,255,255,0.06); }
            .sk-card-body   { padding:0; }
            .sk-row { display:flex; align-items:center; gap:14px;
                      padding:14px 20px; border-bottom:1px solid rgba(255,255,255,0.04); }
            .sk-row:last-child { border-bottom:none; }
        `;
        document.head.appendChild(style);
    }

    _render404(outlet) {
        this._hideLoading();
        if (!outlet) return;
        outlet.style.opacity = '1';
        outlet.style.transform = 'none';
        outlet.innerHTML = `
      <div class="empty-state" style="margin-top: 4rem;">
        <div class="empty-state-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <h3>Página não encontrada</h3>
        <p>A rota <code>${location.pathname}</code> não existe.</p>
        <button class="btn btn-primary" onclick="app.router.push('/')">Voltar ao início</button>
      </div>`;
        document.title = 'Página não encontrada – EduPresença';
    }
}
