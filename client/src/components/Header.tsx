import { useState } from 'react';
import { useLocation } from 'wouter';
import { Info, BarChart3, BookOpen, Menu, Github, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [, setLocation] = useLocation();

  const handleLogoClick = () => {
    if (onLogoClick) {
      onLogoClick();
    }
    setLocation('/');
    setMobileMenuOpen(false);
  };

  const handleNavClick = (action: () => void) => {
    action();
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 lg:px-8">
          {/* Logo Section */}
          <div className="flex items-center gap-2">
            <button
              className="flex items-center space-x-2 cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md"
              onClick={handleLogoClick}
              data-testid="logo-link"
              aria-label="QAStarter - Go to home page"
            >
              <div className="transition-transform group-hover:scale-105">
                <QAStarterLogo className="h-8 w-8 md:h-10 md:w-auto" />
              </div>
              <span
                className="font-bold text-lg md:text-xl bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent group-hover:opacity-80 transition-opacity whitespace-nowrap"
                data-testid="text-logo"
              >
                QAStarter
              </span>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-2" aria-label="Main navigation">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation('/docs')}
              className="gap-1.5 bg-gradient-to-r from-primary to-purple-600 hover:from-primary hover:to-purple-600 dark:from-primary dark:to-purple-600 text-white dark:text-white border-primary dark:border-primary font-medium whitespace-nowrap"
            >
              <BookOpen className="h-4 w-4" />
              <span>Docs</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://github.com/QATonic/qastarter', '_blank', 'noopener,noreferrer')}
              className="gap-1.5 bg-gradient-to-r from-primary to-purple-600 hover:from-primary hover:to-purple-600 dark:from-primary dark:to-purple-600 text-white dark:text-white border-primary dark:border-primary font-medium whitespace-nowrap"
            >
              <Github className="h-4 w-4" />
              <span>Star</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setTrendsOpen(true)}
              className="gap-1.5 bg-gradient-to-r from-primary to-purple-600 hover:from-primary hover:to-purple-600 dark:from-primary dark:to-purple-600 text-white dark:text-white border-primary dark:border-primary font-medium whitespace-nowrap"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Trends</span>
            </Button>

            <SponsorModal />

            <Button
              variant="outline"
              size="sm"
              onClick={() => setAboutOpen(true)}
              className="gap-1.5 bg-gradient-to-r from-primary to-purple-600 hover:from-primary hover:to-purple-600 dark:from-primary dark:to-purple-600 text-white dark:text-white border-primary dark:border-primary font-medium whitespace-nowrap"
              data-testid="button-about"
            >
              <Info className="h-4 w-4" />
              <span>About</span>
            </Button>

            <ThemeToggle />
          </nav>

          {/* Mobile Navigation Interface */}
          <div className="flex items-center gap-2 lg:hidden">
            <ThemeToggle />
            
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle className="text-left flex items-center gap-2">
                    <QAStarterLogo className="h-6 w-6" />
                    QAStarter
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-8">
                  <Button
                    variant="ghost"
                    onClick={() => handleNavClick(() => setLocation('/docs'))}
                    className="justify-start gap-3 h-12 text-lg font-medium"
                  >
                    <BookOpen className="h-5 w-5" />
                    Documentation
                  </Button>
                  
                  <Button
                    variant="ghost"
                    onClick={() => handleNavClick(() => window.open('https://github.com/QATonic/qastarter', '_blank', 'noopener,noreferrer'))}
                    className="justify-start gap-3 h-12 text-lg font-medium"
                  >
                    <Github className="h-5 w-5" />
                    Star on GitHub
                  </Button>
                  
                  <Button
                    variant="ghost"
                    onClick={() => handleNavClick(() => setTrendsOpen(true))}
                    className="justify-start gap-3 h-12 text-lg font-medium"
                  >
                    <BarChart3 className="h-5 w-5" />
                    Global Trends
                  </Button>
                  
                  <Button
                    variant="ghost"
                    onClick={() => {
                        // SponsorModal inside mobile menu needs special handling or just trigger it
                        // For simplicity, we can just show a button that acts like the trigger
                    }}
                    className="justify-start gap-3 h-12 text-lg font-medium hidden" // Sponsor is tricky to trigger programmatically if it's a dialog trigger. Let's re-use the component.
                  >
                  </Button>
                  
                   {/* We render SponsorModal directly but styled for mobile list */}
                   <div className="w-full">
                     <SponsorModal mobileView />
                   </div>

                  <Button
                    variant="ghost"
                    onClick={() => handleNavClick(() => setAboutOpen(true))}
                    className="justify-start gap-3 h-12 text-lg font-medium"
                  >
                    <Info className="h-5 w-5" />
                    About Project
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
             {/* Show Hamburger on Tablet/Mobile */}
             <Button 
                variant="ghost" 
                size="icon" 
                className="hidden md:flex lg:hidden" 
                onClick={() => setMobileMenuOpen(true)}
            >
                <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </header>

      {/* About Modal */}
      <AboutModal open={aboutOpen} onOpenChange={setAboutOpen} />
      {/* Trends Modal */}
      <TrendsModal open={trendsOpen} onOpenChange={setTrendsOpen} />
    </>
  );
}
