import { useState } from "react";
import { useLocation } from "wouter";
import { Info, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "./ThemeToggle";
import AboutModal from "./AboutModal";
import TrendsModal from "./TrendsModal";
import SponsorModal from "./SponsorModal";
import QAStarterLogo from "./QAStarterLogo";

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
            {/* Trends Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTrendsOpen(true)}
              className="gap-1.5 flex bg-gradient-to-r from-primary to-purple-600 hover:from-primary hover:to-purple-600 dark:from-primary dark:to-purple-600 text-white dark:text-white border-primary dark:border-primary font-medium"
              aria-label="View Global Trends"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Trends</span>
            </Button>

            {/* About Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAboutOpen(true)}
              className="gap-1.5 bg-gradient-to-r from-primary to-purple-600 hover:from-primary hover:to-purple-600 dark:from-primary dark:to-purple-600 text-white dark:text-white border-primary dark:border-primary font-medium"
              data-testid="button-about"
              aria-label="About QAStarter"
            >
              <Info className="h-4 w-4" />
              <span className="hidden sm:inline">About</span>
            </Button>

            {/* Sponsor Button with Modal */}
            <SponsorModal />

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