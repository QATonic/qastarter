import React, { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/Header';
import Wizard from './components/Wizard';
import About from './components/About';
import Footer from './components/Footer';

function App() {
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [wizardKey, setWizardKey] = useState(0);

  const handleResetWizard = () => {
    setWizardKey(prev => prev + 1);
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 transition-all duration-500 flex flex-col">
        <Header 
          onAboutClick={() => setIsAboutOpen(true)} 
          onLogoClick={handleResetWizard}
        />
        
        <main className="flex-1 relative">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/10 dark:bg-blue-500/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-400/10 dark:bg-indigo-500/5 rounded-full blur-3xl"></div>
          </div>
          
          <Wizard key={wizardKey} onReset={handleResetWizard} />
        </main>
        
        <Footer />
        
        <About
          isOpen={isAboutOpen}
          onClose={() => setIsAboutOpen(false)}
        />
      </div>
    </ThemeProvider>
  );
}

export default App;