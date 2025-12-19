
import React, { useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { ChatInterface } from './components/ChatInterface';
import { AppMode } from './types';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.LANDING);

  return (
    <div className="w-full min-h-screen bg-astra-black">
      {mode === AppMode.LANDING ? (
        <LandingPage onStart={() => setMode(AppMode.CHAT)} />
      ) : (
        <ChatInterface onBack={() => setMode(AppMode.LANDING)} />
      )}
    </div>
  );
};

export default App;
