import { useEffect, useState } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import FloatingTabBar from '@/components/FloatingTabBar';
import Dashboard from '@/pages/Dashboard';
import Income from '@/pages/Income';
import Expenses from '@/pages/Expenses';
import Savings from '@/pages/Savings';
import Analytics from '@/pages/Analytics';
import NotFound from '@/pages/NotFound';
import { checkAuth, logoutRequest } from '@/services/api';
import { useFinanceStore } from '@/store/financeStore';
import { useUIStore } from '@/store/uiStore';

const AUTH_REDIRECT_GUARD = 'app-auth-redirect-attempted';

const App = () => {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const setUser = useFinanceStore((state) => state.setUser);
  const user = useFinanceStore((state) => state.user);
  const initialize = useFinanceStore((state) => state.initialize);
  const initTheme = useUIStore((state) => state.initTheme);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  useEffect(() => {
    let active = true;

    const run = async () => {
      try {
        const authenticatedUser = await checkAuth();
        if (!active) return;
        if (typeof window !== 'undefined') {
          window.sessionStorage.removeItem(AUTH_REDIRECT_GUARD);
        }
        setUser(authenticatedUser);
      } catch (_error) {
        if (!active) return;

        const alreadyRedirected =
          typeof window !== 'undefined' && window.sessionStorage.getItem(AUTH_REDIRECT_GUARD) === '1';

        if (!alreadyRedirected && typeof window !== 'undefined') {
          localStorage.removeItem('user');
          localStorage.removeItem('app_user');
          localStorage.removeItem('app_token');
          window.sessionStorage.setItem(AUTH_REDIRECT_GUARD, '1');
          window.location.replace('/index.html');
          return;
        }

        setUser(null);
        setCheckingAuth(false);
        return;
      }

      if (active) {
        setCheckingAuth(false);
      }
    };

    run();

    return () => {
      active = false;
    };
  }, [setUser]);

  useEffect(() => {
    if (!user) return;
    initialize();
  }, [user, initialize]);

  const handleLogout = async () => {
    try {
      await logoutRequest();
    } catch (_error) {
      // Ignore logout API errors and force return to login.
    } finally {
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(AUTH_REDIRECT_GUARD);
      }
      localStorage.removeItem('user');
      localStorage.removeItem('app_user');
      localStorage.removeItem('app_token');
      window.location.replace('/index.html');
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="glass rounded-3xl px-6 py-5 text-center">
          <p className="text-subhead text-muted-foreground">Carregando interface...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
        <div className="glass-card max-w-sm w-full text-center">
          <h1 className="text-title-3 text-foreground mb-2">Sessão expirada</h1>
          <p className="text-subhead text-muted-foreground mb-4">
            Sua autenticação não foi validada. Faça login novamente para continuar.
          </p>
          <button
            type="button"
            onClick={() => window.location.replace('/index.html')}
            className="w-full rounded-2xl py-3 bg-foreground text-background text-subhead font-semibold tap-highlight-none"
          >
            Ir para login
          </button>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <div className="relative min-h-screen bg-background">
        <div className="relative">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Dashboard onLogout={handleLogout} />} />
              <Route path="/income" element={<Income onLogout={handleLogout} />} />
              <Route path="/expenses" element={<Expenses onLogout={handleLogout} />} />
              <Route path="/savings" element={<Savings onLogout={handleLogout} />} />
              <Route path="/analytics" element={<Analytics onLogout={handleLogout} />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AnimatePresence>
        </div>

        <FloatingTabBar />
      </div>
    </HashRouter>
  );
};

export default App;
