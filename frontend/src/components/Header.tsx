import React from 'react';
import { Coffee, Sun, Moon, Info, Sparkles } from 'lucide-react';
import { useThemeContext } from '../hooks/useThemeContext';

interface HeaderProps {
  onAboutClick: () => void;
  onLogoClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onAboutClick, onLogoClick }) => {
  const { theme, toggleTheme } = useThemeContext();

  const handleCoffeeClick = () => {
    window.open('https://buymeacoffee.com/qastarter', '_blank');
  };

  return (
    <header className="header-glass sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-4">
            <button 
              onClick={onLogoClick}
              className="flex items-center space-x-4 hover:opacity-90 transition-all duration-200 cursor-pointer group"
            >
              <div className="relative">
                <div className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200 group-hover:scale-105">
                  <span className="text-white font-bold text-xl">Q</span>
                  <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-400 animate-pulse" />
                </div>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-2xl font-bold text-gradient">QAStarter</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Your Testing Foundation, Pre-Built</p>
              </div>
            </button>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onAboutClick}
              className="flex items-center space-x-2 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="About QAStarter"
            >
              <Info size={18} />
              <span className="hidden sm:inline font-medium">About</span>
            </button>
            
            <button
              onClick={handleCoffeeClick}
              className="flex items-center space-x-2 gradient-accent text-white px-4 py-2 rounded-xl transition-all duration-200 text-sm font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              aria-label="Buy me a Coffee"
            >
              <Coffee size={16} />
              <span className="hidden sm:inline">Buy me a Coffee</span>
            </button>
            
            <button
              onClick={toggleTheme}
              className="p-3 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 hover:scale-105"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;