import React from 'react';
import { Heart } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="footer-glass mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
          <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">
            © 2025 QAStarter
          </div>
          <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
            <span>Built with</span>
            <Heart className="text-red-500 animate-pulse" size={16} />
            <span>for QA Engineers</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;