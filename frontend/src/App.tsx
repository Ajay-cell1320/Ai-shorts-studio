import React, { useState } from 'react';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import AuthModal from './components/AuthModal';

export default function App() {
  const [view, setView] = useState<'landing' | 'dashboard'>('landing');
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState<any>(() => {
    const saved = localStorage.getItem('studio_user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleOpenDashboard = () => {
    if (!user) {
      setShowAuth(true);
    } else {
      setView('dashboard');
    }
  };

  return (
    <>
      {view === 'dashboard' ? (
        <DashboardPage onBackToLanding={() => setView('landing')} />
      ) : (
        <LandingPage onOpenDashboard={handleOpenDashboard} />
      )}
      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onSuccess={(u) => {
            setUser(u);
            setShowAuth(false);
            setView('dashboard');
          }}
        />
      )}
    </>
  );
}
