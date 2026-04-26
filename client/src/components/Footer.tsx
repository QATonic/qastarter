import { Linkedin, Twitter, Youtube, Instagram, Heart, BookOpen, Code, Zap } from 'lucide-react';
import QAStarterLogo from './QAStarterLogo';
import { Link } from 'wouter';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    {
      name: 'LinkedIn',
      testId: 'button-linkedin',
      icon: Linkedin,
      url: 'https://www.linkedin.com/company/qatonic',
    },
    {
      name: 'Twitter/X',
      testId: 'button-twitter-x',
      icon: Twitter,
      url: 'https://x.com/qatonicinnovate',
    },
    {
      name: 'YouTube',
      testId: 'button-youtube',
      icon: Youtube,
      url: 'https://www.youtube.com/@qatonicinnovations',
    },
    {
      name: 'Instagram',
      testId: 'button-instagram',
      icon: Instagram,
      url: 'https://www.instagram.com/qatonic/',
    },
  ];

  return (
    <footer className="border-t bg-background/80 backdrop-blur mt-auto">
      <div className="container px-4 lg:px-8 py-4">
        {/* Footer Content */}
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
          {/* Brand Section */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <QAStarterLogo className="h-6 w-6" />
              <span className="font-bold text-base bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
                QAStarter
              </span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span className="hidden sm:inline">Made with</span>
              <Heart className="h-3 w-3 text-red-500" />
              <span className="hidden sm:inline">by QATonic Innovations</span>
            </div>
          </div>

          {/* Page Links + Social Links */}
          <div className="flex items-center gap-4">
            {/* Internal page links */}
            <nav
              className="hidden sm:flex items-center gap-3 text-sm text-muted-foreground"
              aria-label="Footer navigation"
            >
              <Link
                href="/express"
                className="hover:text-foreground transition-colors flex items-center gap-1"
              >
                <Zap className="h-3.5 w-3.5" />
                Generator
              </Link>
              <Link
                href="/docs"
                className="hover:text-foreground transition-colors flex items-center gap-1"
              >
                <BookOpen className="h-3.5 w-3.5" />
                Docs
              </Link>
              <Link
                href="/api-docs"
                className="hover:text-foreground transition-colors flex items-center gap-1"
              >
                <Code className="h-3.5 w-3.5" />
                API
              </Link>
                        </nav>

            {/* Separator */}
            <div className="hidden sm:block h-4 w-px bg-border" />

            {/* Social Links - proper <a> tags */}
            <div className="flex items-center space-x-1">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid={social.testId}
                  className="inline-flex items-center justify-center h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`Visit ${social.name}`}
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-3 pt-3 border-t text-center">
          <p className="text-xs text-muted-foreground">
            &copy; {currentYear} QAStarter by QATonic Innovations. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
