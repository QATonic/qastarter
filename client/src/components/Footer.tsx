import { Linkedin, Twitter, Youtube, Instagram, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import QAStarterLogo from './QAStarterLogo';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    {
      name: 'LinkedIn',
      testId: 'button-linkedin',
      icon: Linkedin,
      url: 'https://linkedin.com/in/SantoshKarad',
    },
    {
      name: 'Twitter/X',
      testId: 'button-twitter-x',
      icon: Twitter,
      url: 'https://twitter.com/SantoshKarad',
    },
    {
      name: 'YouTube',
      testId: 'button-youtube',
      icon: Youtube,
      url: 'https://youtube.com/@SantoshKarad',
    },
    {
      name: 'Instagram',
      testId: 'button-instagram',
      icon: Instagram,
      url: 'https://instagram.com/SantoshKarad',
    },
  ];

  return (
    <footer className="border-t bg-background/80 backdrop-blur mt-auto">
      <div className="container px-4 lg:px-8 py-4">
        {/* Compact Footer Content */}
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
          {/* Brand Section */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <QAStarterLogo className="h-6 w-6" />
              <span className="font-bold text-base bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                QAStarter
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground">
              <span>Made with</span>
              <Heart className="h-3 w-3 text-red-500" />
              <span>by QATonic Innovations</span>
            </div>
          </div>

          {/* Social Links */}
          <div className="flex items-center space-x-2">
            {socialLinks.map((social) => (
              <Button
                key={social.name}
                variant="ghost"
                size="icon"
                onClick={() => window.open(social.url, '_blank', 'noopener,noreferrer')}
                data-testid={social.testId}
                className="h-8 w-8"
                aria-label={`Visit ${social.name}`}
              >
                <social.icon className="h-4 w-4" />
                <span className="sr-only">{social.name}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-3 pt-3 border-t text-center">
          <p className="text-xs text-muted-foreground">
            © {currentYear} QAStarter by QATonic Innovations. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
