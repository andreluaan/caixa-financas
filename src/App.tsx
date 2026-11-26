import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { isConfigured, supabase } from './lib/supabase';
import { StoreProvider, useStore } from './lib/store';
import { isDemo } from './lib/demo';
import { backgrounds, useAppearance, type Appearance } from './lib/appearance';
import { Backdrop, Icon, MemoryMark, useGlassLight, useLiquidNav, type IconName } from './components/ui';
import { Login } from './pages/Login';
import { Overview } from './pages/Overview';
import { Transactions } from './pages/Transactions';
import { Budgets } from './pages/Budgets';
import { Goals } from './pages/Goals';
import { Accounts } from './pages/Accounts';
import { Import } from './pages/Import';

export type Route = 'overview' | 'transactions' | 'import' | 'budgets' | 'goals' | 'accounts';

const routes: { id: Route; label: string; short: string; icon: IconName; group: string }[] = [
  { id: 'overview', label: 'Visão geral', short: 'Início', icon: 'home', group: 'Geral' },
  { id: 'transactions', label: 'Transações', short: 'Transações', icon: 'list', group: 'Geral' },
  { id: 'import', label: 'Importar extrato', short: 'Importar', icon: 'upload', group: 'Geral' },
  { id: 'budgets', label: 'Orçamentos', short: 'Orçamento', icon: 'pie', group: 'Planejar' },
  { id: 'goals', label: 'Metas', short: 'Metas', icon: 'target', group: 'Planejar' },
  { id: 'accounts', label: 'Contas e cartões', short: 'Contas', icon: 'card', group: 'Planejar' },
];

function readRoute(): Route {
  const hash = window.location.hash.replace('#/', '') as Route;
  return routes.some((r) => r.id === hash) ? hash : 'overview';
}

function useRoute() {
  const [route, setRoute] = useState<Route>(readRoute);
  useEffect(() => {
    const onChange = () => setRoute(readRoute());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  const go = (r: Route) => {
    window.location.hash = `#/${r}`;
    window.scrollTo({ top: 0 });
  };
  return [route, go] as const;
}

function AppearanceButtons({ look }: { look: Appearance }) {
  const nextBg = backgrounds[(backgrounds.findIndex((b) => b.id === look.background) + 1) % backgrounds.length];
  return (
    <>
      <button
        type="button"
        className="icon-btn"
        aria-label={look.theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}
        title={look.theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
        onClick={(e) => look.toggleTheme(e.clientX || undefined, e.clientY || undefined)}
      >
        <Icon name={look.theme === 'dark' ? 'sun' : 'moon'} size={16} />
      </button>
      <button type="button" className="icon-btn" aria-label={`Trocar fundo para ${nextBg.label}`} title={`Fundo: ${nextBg.label}`} onClick={look.nextBackground}>
        <Icon name="layers" size={16} />
      </button>
    </>
  );
}

function TabBar({ route, go }: { route: Route; go: (r: Route) => void }) {
  const bar = useRef<HTMLElement>(null);
  useLiquidNav(bar, route, (key) => go(key as Route), 'x');
  return (
    <nav ref={bar} className="glass tabbar" aria-label="Seções">
      <span className="nav-pill" aria-hidden="true" />
      {routes.map((r) => (
        <a key={r.id} data-key={r.id} className="tab" href={`#/${r.id}`} aria-current={route === r.id ? 'page' : undefined}>
          <Icon name={r.icon} size={20} />
          <span>{r.short}</span>
        </a>
      ))}
    </nav>
  );
}

function Shell({ session, look }: { session: Session; look: Appearance }) {
  const [route, go] = useRoute();
  const { loading, error, clearError } = useStore();
  const groups = [...new Set(routes.map((r) => r.group))];
  const page = useRef<HTMLDivElement>(null);
  const nav = useRef<HTMLElement>(null);
  useGlassLight();
  useLiquidNav(nav, route, (key) => go(key as Route), 'y');

  useLayoutEffect(() => {
    page.current?.querySelectorAll<HTMLElement>('.glass').forEach((el, i) => el.style.setProperty('--i', String(i)));
  }, [route, loading]);

  return (
    <div className="shell">
      <aside className="glass sidebar">
        <div className="brand">
          <MemoryMark />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 15, fontWeight: 500 }}>Caixa</span>
            <span className="mono" style={{ fontSize: 10 }}>andreluaan.dev</span>
          </div>
        </div>
        <nav ref={nav} className="nav" aria-label="Principal">
          <span className="nav-pill" aria-hidden="true" />
          {groups.map((group) => (
            <div key={group} className="nav-group">
              <span className="mono nav-label">{group}</span>
              {routes.filter((r) => r.group === group).map((r) => (
                <a key={r.id} data-key={r.id} className="nav-item" href={`#/${r.id}`} aria-current={route === r.id ? 'page' : undefined}>
                  <Icon name={r.icon} />
                  {r.label}
                </a>
              ))}
            </div>
          ))}
        </nav>
        <div className="user-row">
          <div className="avatar" style={{ background: 'var(--ink)', color: 'var(--on-ink)', width: 32, height: 32, fontSize: 12 }} aria-hidden="true">
            {(session.user.email ?? '?').charAt(0).toUpperCase()}
          </div>
          <span className="muted" style={{ fontSize: 12, flexGrow: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{session.user.email}</span>
          <AppearanceButtons look={look} />
          <button type="button" className="icon-btn" aria-label="Sair" disabled={isDemo} onClick={() => void supabase.auth.signOut()}>
            <Icon name="logout" size={16} />
          </button>
        </div>
      </aside>

      <div className="content">
        {loading ? (
          <div className="glass panel"><span className="muted">Carregando…</span></div>
        ) : (
          <div key={route} ref={page} className="page">
            {route === 'overview' && <Overview go={go} />}
            {route === 'transactions' && <Transactions />}
            {route === 'import' && <Import />}
            {route === 'budgets' && <Budgets />}
            {route === 'goals' && <Goals />}
            {route === 'accounts' && <Accounts />}
          </div>
        )}
      </div>

      <TabBar route={route} go={go} />

      {error && (
        <div className="glass toast error" role="alert">
          <span>{error}</span>
          <button type="button" className="icon-btn" aria-label="Fechar aviso" onClick={clearError}>
            <Icon name="close" size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

function NotConfigured() {
  return (
    <div className="auth">
      <div className="glass">
        <MemoryMark />
        <h1 className="hero-title" style={{ fontSize: 30 }}>Falta conectar o Supabase<span className="dot">.</span></h1>
        <p className="muted" style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
          Copie <code>.env.example</code> para <code>.env</code>, preencha <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> e
          reinicie o servidor. O passo a passo está no README.
        </p>
      </div>
    </div>
  );
}

const demoSession = { user: { id: 'demo', email: 'demo@caixa.local' } } as Session;

export function App() {
  const [session, setSession] = useState<Session | null>(isDemo ? demoSession : null);
  const [ready, setReady] = useState(isDemo);
  const look = useAppearance();

  useEffect(() => {
    if (isDemo || !isConfigured) return;
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <>
      <Backdrop variant={look.background} />
      {!isConfigured && !isDemo ? (
        <NotConfigured />
      ) : !ready ? null : session ? (
        <StoreProvider key={session.user.id}>
          <Shell session={session} look={look} />
        </StoreProvider>
      ) : (
        <Login />
      )}
      {(!session || !isConfigured) && !isDemo && (
        <div className="glass appearance-float">
          <AppearanceButtons look={look} />
        </div>
      )}
    </>
  );
}
