
import React, { useState, lazy, Suspense } from 'react';
import { LandingPage } from './components/LandingPage';
import { AppMode } from './types';

// Lazy load ChatInterface for better initial load performance
const ChatInterface = lazy(() => import('./components/ChatInterface').then(module => ({ default: module.ChatInterface })));

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.LANDING);

  return (
    <div className="w-full min-h-screen bg-astra-black">
      {mode === AppMode.LANDING ? (
        <LandingPage onStart={() => setMode(AppMode.CHAT)} />
      ) : (
        <Suspense fallback={
          <div className="w-full min-h-screen bg-astra-black flex items-center justify-center">
            <div className="text-astra-blue font-orbitron text-xl animate-pulse">INITIALIZING ASTRA...</div>
          </div>
        }>
          <ChatInterface onBack={() => setMode(AppMode.LANDING)} />
        </Suspense>
      )}
    </div>
  );
};

export default App;
