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
  const KOFI_URL = 'https://ko-fi.com/SantoshKarad';

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
                  className="w-full gap-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-semibold"
                  onClick={() => window.open(KOFI_URL, '_blank', 'noopener,noreferrer')}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-.963 1.904.82 1.832 3.011.723 4.311z" />
                  </svg>
                  Support on Ko-fi
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
