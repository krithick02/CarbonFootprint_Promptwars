import { useState, lazy, Suspense } from 'react';
import { AppProvider, useApp } from './context/AppContext';

const Landing = lazy(() => import('./pages/Landing'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const MainApp = lazy(() => import('./pages/MainApp'));

function LoadingFallback() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d1117' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, border: '3px solid rgba(82,183,136,0.2)', borderTopColor: '#52B788', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: 'rgba(248,249,250,0.5)', fontSize: 14 }}>Loading EcoTrack…</p>
      </div>
    </div>
  );
}

function AppContent() {
  const { onboardingComplete } = useApp();
  const [view, setView] = useState('landing'); // 'landing' | 'onboarding'

  if (onboardingComplete) {
    return <MainApp />;
  }

  if (view === 'onboarding') {
    return <Onboarding onBack={() => setView('landing')} />;
  }

  return <Landing onStart={() => setView('onboarding')} />;
}

export default function App() {
  return (
    <AppProvider>
      <Suspense fallback={<LoadingFallback />}>
        <AppContent />
      </Suspense>
    </AppProvider>
  );
}
