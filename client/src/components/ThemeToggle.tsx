import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/components/theme-provider';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [isToggling, setIsToggling] = useState(false);
  const toggleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toggleTimeoutRef.current) {
        clearTimeout(toggleTimeoutRef.current);
      }
    };
  }, []);

  // Resolve the effective theme (system → actual)
  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  const handleToggle = () => {
    setIsToggling(true);
    if (toggleTimeoutRef.current) {
      clearTimeout(toggleTimeoutRef.current);
    }
    toggleTimeoutRef.current = setTimeout(() => {
      setTheme(isDark ? 'light' : 'dark');
      setIsToggling(false);
    }, 150);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      data-testid="button-theme-toggle"
      className="relative transition-all duration-300"
      disabled={isToggling}
    >
      <div className="relative w-4 h-4">
        <Sun
          aria-hidden="true"
          className={`absolute h-4 w-4 transition-all duration-300 ${
            isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
          }`}
        />
        <Moon
          aria-hidden="true"
          className={`absolute h-4 w-4 transition-all duration-300 ${
            isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
          }`}
        />
      </div>
    </Button>
  );
}
