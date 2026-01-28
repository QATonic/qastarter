import { useState } from 'react';
import { useLocation } from 'wouter';
import { Info, BarChart3, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ThemeToggle from './ThemeToggle';
import AboutModal from './AboutModal';
import TrendsModal from './TrendsModal';
import SponsorModal from './SponsorModal';
import QAStarterLogo from './QAStarterLogo';

interface HeaderProps {
  onLogoClick?: () => void;
}

export default function Header({ onLogoClick }: HeaderProps) {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [trendsOpen, setTrendsOpen] = useState(false);
  const [, setLocation] = useLocation();

  const handleLogoClick = () => {
    if (onLogoClick) {
      onLogoClick();
    }
    setLocation('/');
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 lg:px-8">
          {/* Logo Section */}
          <div className="flex items-center space-x-3">
            <button
              className="flex items-center space-x-2 cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md"
              onClick={handleLogoClick}
              data-testid="logo-link"
              aria-label="QAStarter - Go to home page"
            >
              <div className="transition-transform group-hover:scale-105">
                <QAStarterLogo className="h-10 w-auto" />
              </div>
              <span
                className="font-bold text-xl bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent group-hover:opacity-80 transition-opacity"
                data-testid="text-logo"
              >
                QAStarter
              </span>
            </button>
          </div>

          {/* Navigation Actions */}
          <nav className="flex items-center space-x-2" aria-label="Main navigation">
            {/* Docs Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation('/docs')}
              className="gap-1.5 bg-gradient-to-r from-primary to-purple-600 hover:from-primary hover:to-purple-600 dark:from-primary dark:to-purple-600 text-white dark:text-white border-primary dark:border-primary font-medium whitespace-nowrap"
              aria-label="View Documentation"
            >
              <BookOpen className="h-4 w-4" />
              <span className="hidden lg:inline">Docs</span>
            </Button>

            {/* GitHub Star Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://github.com/QATonic/qastarter', '_blank', 'noopener,noreferrer')}
              className="gap-1.5 bg-gradient-to-r from-primary to-purple-600 hover:from-primary hover:to-purple-600 dark:from-primary dark:to-purple-600 text-white dark:text-white border-primary dark:border-primary font-medium whitespace-nowrap"
              aria-label="Star on GitHub"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              <span className="hidden lg:inline">Star</span>
            </Button>

            {/* Trends Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTrendsOpen(true)}
              className="gap-1.5 flex bg-gradient-to-r from-primary to-purple-600 hover:from-primary hover:to-purple-600 dark:from-primary dark:to-purple-600 text-white dark:text-white border-primary dark:border-primary font-medium whitespace-nowrap"
              aria-label="View Global Trends"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden lg:inline">Trends</span>
            </Button>

            {/* Sponsor Button with Modal */}
            <SponsorModal />

            {/* About Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAboutOpen(true)}
              className="gap-1.5 bg-gradient-to-r from-primary to-purple-600 hover:from-primary hover:to-purple-600 dark:from-primary dark:to-purple-600 text-white dark:text-white border-primary dark:border-primary font-medium whitespace-nowrap"
              data-testid="button-about"
              aria-label="About QAStarter"
            >
              <Info className="h-4 w-4" />
              <span className="hidden lg:inline">About</span>
            </Button>

            {/* Theme Toggle */}
            <ThemeToggle />
          </nav>
        </div>
      </header>

      {/* About Modal */}
      <AboutModal open={aboutOpen} onOpenChange={setAboutOpen} />
      {/* Trends Modal */}
      <TrendsModal open={trendsOpen} onOpenChange={setTrendsOpen} />
    </>
  );
}
