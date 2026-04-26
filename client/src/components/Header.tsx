import React, { useState, Suspense } from 'react';
import { useLocation } from 'wouter';
import { Info, BarChart3, BookOpen, Menu, Github, Sparkles, LifeBuoy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import ThemeToggle from './ThemeToggle';
import AboutModal from './AboutModal';
const TrendsModal = React.lazy(() => import('./TrendsModal'));
import SponsorModal from './SponsorModal';
import QAStarterLogo from './QAStarterLogo';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onLogoClick?: () => void;
}

export default function Header({ onLogoClick }: HeaderProps) {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [trendsOpen, setTrendsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location, setLocation] = useLocation();

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

  const isActive = (path: string) => location === path;

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
                className="font-bold text-lg md:text-xl bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent group-hover:opacity-80 transition-opacity whitespace-nowrap"
                data-testid="text-logo"
              >
                QAStarter
              </span>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-2" aria-label="Main navigation">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/mcp')}
              className={cn(
                'gap-1.5 font-medium whitespace-nowrap transition-colors relative',
                isActive('/mcp')
                  ? 'text-foreground bg-accent'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-current={isActive('/mcp') ? 'page' : undefined}
              data-testid="nav-mcp"
            >
              <Sparkles className="h-4 w-4" />
              <span>MCP</span>
              {/* "NEW" pip — discovery cue; the button itself matches the other nav items */}
              <span
                aria-hidden="true"
                className="ml-0.5 inline-block rounded-full bg-emerald-500 text-[9px] font-bold tracking-wide text-white px-1.5 py-px leading-none"
              >
                NEW
              </span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/docs')}
              className={cn(
                'gap-1.5 font-medium whitespace-nowrap transition-colors',
                isActive('/docs')
                  ? 'text-foreground bg-accent'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-current={isActive('/docs') ? 'page' : undefined}
            >
              <BookOpen className="h-4 w-4" />
              <span>Docs</span>
            </Button>

            <a
              href="https://github.com/QATonic/qastarter"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Star QAStarter on GitHub"
              className={cn(
                'inline-flex items-center justify-center gap-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors',
                'text-muted-foreground hover:text-foreground hover:bg-accent',
                'h-9 px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
              )}
            >
              <Github className="h-4 w-4" aria-hidden="true" />
              <span>Star</span>
            </a>

            <a
              href="https://github.com/QATonic/qastarter/issues"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Get help — open a GitHub issue"
              className={cn(
                'inline-flex items-center justify-center gap-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors',
                'text-muted-foreground hover:text-foreground hover:bg-accent',
                'h-9 px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
              )}
              data-testid="nav-support"
            >
              <LifeBuoy className="h-4 w-4" aria-hidden="true" />
              <span>Support</span>
            </a>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTrendsOpen(true)}
              className="gap-1.5 text-muted-foreground hover:text-foreground font-medium whitespace-nowrap transition-colors"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Trends</span>
            </Button>

            <SponsorModal />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAboutOpen(true)}
              className="gap-1.5 text-muted-foreground hover:text-foreground font-medium whitespace-nowrap transition-colors"
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
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Toggle navigation menu">
                  <Menu className="h-6 w-6" aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle className="text-left flex items-center gap-2">
                    <QAStarterLogo className="h-6 w-6" />
                    QAStarter
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-4 mt-8" aria-label="Mobile navigation">
                  <Button
                    variant="ghost"
                    onClick={() => handleNavClick(() => setLocation('/mcp'))}
                    className={cn(
                      'justify-start gap-3 h-12 text-lg font-medium',
                      isActive('/mcp') && 'bg-accent text-foreground'
                    )}
                    aria-current={isActive('/mcp') ? 'page' : undefined}
                  >
                    <Sparkles className="h-5 w-5" />
                    MCP
                    <span
                      aria-hidden="true"
                      className="ml-1 inline-block rounded-full bg-emerald-500 text-[10px] font-bold tracking-wide text-white px-2 py-0.5 leading-none"
                    >
                      NEW
                    </span>
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => handleNavClick(() => setLocation('/docs'))}
                    className={cn(
                      'justify-start gap-3 h-12 text-lg font-medium',
                      isActive('/docs') && 'bg-accent text-foreground'
                    )}
                    aria-current={isActive('/docs') ? 'page' : undefined}
                  >
                    <BookOpen className="h-5 w-5" />
                    Documentation
                  </Button>

                  <a
                    href="https://github.com/QATonic/qastarter"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 h-12 px-4 text-lg font-medium rounded-md hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Github className="h-5 w-5" />
                    Star on GitHub
                  </a>

                  <a
                    href="https://github.com/QATonic/qastarter/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 h-12 px-4 text-lg font-medium rounded-md hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LifeBuoy className="h-5 w-5" />
                    Support
                  </a>

                  <Button
                    variant="ghost"
                    onClick={() => handleNavClick(() => setTrendsOpen(true))}
                    className="justify-start gap-3 h-12 text-lg font-medium"
                  >
                    <BarChart3 className="h-5 w-5" />
                    Global Trends
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
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* About Modal */}
      <AboutModal open={aboutOpen} onOpenChange={setAboutOpen} />
      {/* Trends Modal */}
      <Suspense fallback={null}>
        <TrendsModal open={trendsOpen} onOpenChange={setTrendsOpen} />
      </Suspense>
    </>
  );
}
