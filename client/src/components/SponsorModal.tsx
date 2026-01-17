import { useState } from 'react';
import { Heart, Copy, Check, CreditCard, Smartphone, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface SponsorModalProps {
  triggerClassName?: string;
}

export default function SponsorModal({ triggerClassName }: SponsorModalProps) {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const UPI_ID = 'qatonic@ybl';
  const BMAC_URL = 'https://buymeacoffee.com/santoshkarad';

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(UPI_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`gap-1.5 bg-gradient-to-r from-primary to-purple-600 hover:from-primary hover:to-purple-600 dark:from-primary dark:to-purple-600 text-white dark:text-white border-primary dark:border-primary font-medium ${triggerClassName}`}
          data-testid="button-sponsor"
        >
          <Heart className="h-4 w-4" />
          <span className="hidden sm:inline">Support</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-primary/5 to-purple-500/5 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Heart className="h-5 w-5 text-primary fill-primary" />
            Support This Project
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Your support helps keep QAStarter free and actively maintained!
          </p>
        </DialogHeader>

        {/* Payment Options */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-0 md:divide-x divide-border">
            {/* International Option */}
            <div className="md:pr-6 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                <CreditCard className="h-4 w-4" />
                International Users
              </div>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Support via Card or PayPal</p>
                <Button
                  className="w-full gap-2 bg-[#FFDD00] hover:bg-[#FFDD00]/90 text-black font-semibold shadow-sm"
                  onClick={() => window.open(BMAC_URL, '_blank', 'noopener,noreferrer')}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
                    <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
                    <line x1="6" x2="6" y1="2" y2="4" />
                    <line x1="10" x2="10" y1="2" y2="4" />
                    <line x1="14" x2="14" y1="2" y2="4" />
                  </svg>
                  Buy me a coffee
                </Button>
              </div>
            </div>

            {/* Indian Users Option */}
            <div className="md:pl-6 space-y-4 pt-4 md:pt-0 border-t md:border-t-0">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                <Smartphone className="h-4 w-4" />
                Indian Users
              </div>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Scan QR Code or Copy UPI ID</p>

                {/* UPI QR Code */}
                <div className="flex justify-center">
                  <img
                    src="/upi-qr.jpg"
                    alt="UPI QR Code for qatonic@ybl"
                    className="w-32 h-32 rounded-lg border"
                  />
                </div>

                {/* UPI ID Copy */}
                <div className="flex items-center justify-center gap-2">
                  <code className="text-sm bg-muted px-2 py-1 rounded font-mono">{UPI_ID}</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 gap-1"
                    onClick={handleCopyUPI}
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-green-500" />
                        <span className="text-xs text-green-500">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span className="text-xs">Copy</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-muted/30 border-t text-center">
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <Sparkles className="h-3 w-3" />
            Thank you for supporting open-source development!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
