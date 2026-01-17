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
                  <svg className="h-5 w-5" viewBox="0 0 884 1279" fill="currentColor">
                    <path d="M791.109 297.518L790.231 297.002L788.201 296.383C789.018 297.072 790.04 297.472 791.109 297.518Z" />
                    <path d="M803.896 388.891L802.916 389.166L803.896 388.891Z" />
                    <path d="M791.484 297.377C791.359 297.361 791.237 297.332 791.118 297.29C791.111 297.371 791.111 297.453 791.118 297.534C791.252 297.516 791.379 297.466 791.484 297.377Z" />
                    <path d="M791.113 297.529H791.244V297.447L791.113 297.529Z" />
                    <path d="M803.111 388.726L804.591 387.883L805.142 387.573L805.641 387.04C804.702 387.444 803.846 388.016 803.111 388.726Z" />
                    <path d="M793.669 299.515L792.223 298.138L791.243 297.605C791.77 298.535 792.641 299.221 793.669 299.515Z" />
                    <path d="M430.019 1186.18C428.864 1186.68 427.852 1187.46 427.076 1188.45L430.019 1186.18Z" />
                    <path d="M879.19 341.849C874.868 339.167 869.416 339.167 865.094 341.849L757.754 405.341C752.166 408.629 749.049 414.822 749.971 421.163C751.204 429.605 751.498 438.154 750.846 446.653C750.846 447.399 750.846 448.146 750.565 448.893C750.565 449.639 750.284 450.386 750.284 451.132C748.847 469.284 743.527 486.87 734.69 502.621C724.733 520.013 711.023 535.012 694.603 546.596L642.76 583.396L586.47 582.9C564.821 582.9 544.271 592.2 530.045 608.591L466.96 679.012C457.089 690.09 442.209 695.297 427.646 693.115C414.39 691.115 402.624 683.272 395.782 671.711L321.341 540.082L206.507 406.418C204.67 404.267 202.487 402.441 200.051 401.01L104.016 345.061C98.6405 341.884 91.9746 341.884 86.5994 345.061C81.2242 348.238 78 354.094 78 360.448V747.682C78 754.036 81.2242 759.892 86.5994 763.069L235.09 849.098L361.126 1041.96C370.972 1057.55 385.833 1069.3 403.268 1075.28C420.702 1081.26 439.615 1081.11 456.946 1074.86C474.277 1068.6 488.936 1056.63 498.515 1040.88L498.798 1040.42L515.932 1011.4L517.647 1008.42L588.09 874.553C591.586 867.983 596.51 862.269 602.514 857.797L663.119 813.03C708.073 777.947 741.634 730.741 759.815 677.124L760.196 675.989C760.196 675.44 760.481 674.89 760.481 674.341L762.765 666.423L765.049 656.999L765.569 654.91L766.37 651.259L766.89 648.804L767.975 644.099C768.495 641.644 768.788 640.016 769.024 637.561L771.308 626.462L772.867 616.844C773.387 613.463 773.727 610.538 774.247 607.269C774.767 604.001 774.767 601.546 775.107 598.165L775.74 593.234L776.6 585.316C776.6 582.861 776.6 580.406 777.12 577.951C777.12 575.496 777.12 573.041 777.4 570.586L778.021 561.888C778.021 559.433 778.021 556.978 778.301 554.523V550.008C778.762 543.29 778.762 536.549 778.301 529.832V518.733C778.301 515.352 778.301 512.427 778.021 509.393C778.021 506.938 777.74 504.483 777.74 502.028C777.74 499.573 777.459 497.118 777.459 494.663L776.878 486.746C776.878 484.291 776.598 482.015 776.418 479.56C776.418 477.105 776.137 474.765 775.857 472.31L775.177 464.393L774.597 458.016L773.787 449.639L772.977 442.468L771.922 432.05V431.328C771.365 426.795 770.568 422.292 769.534 417.837C768.14 411.387 771.214 404.812 776.822 401.572L879.19 340.327C884.564 337.149 887.79 331.293 887.79 324.939C887.79 318.585 884.564 312.729 879.19 309.551C873.815 306.374 867.149 306.374 861.774 309.551L857.069 312.346L852.645 314.942C852.284 315.181 851.939 315.442 851.614 315.723L849.049 317.28L845.195 319.789C844.295 320.374 843.452 321.041 842.677 321.781L841.195 322.893L821.673 335.155L814.255 339.808L805.131 345.51L796.8 350.442L793.927 352.225L792.384 353.168L791.629 353.615L790.874 354.062L789.611 354.835L788.348 355.608L787.085 356.381L785.793 357.166L774.666 363.842L771.624 365.706L770.311 366.49L769.023 367.235L765.169 369.54L760.419 372.371L755.695 375.14L753.638 376.34C748.539 379.404 750.452 380.03 755.551 376.966L758.576 375.14L763.326 372.371L768.05 369.602L768.628 369.241L771.67 367.377L772.983 366.593L774.271 365.809L785.398 359.133L786.69 358.349L787.953 357.576L789.216 356.803L790.505 356.019L791.768 355.246L792.523 354.799L793.278 354.352L794.821 353.409L797.694 351.626L806.025 346.694L815.149 340.992L822.567 336.339L842.089 324.077L843.571 322.966C844.346 322.226 845.189 321.558 846.089 320.973L849.943 318.464L852.508 316.907C852.833 316.627 853.178 316.365 853.539 316.126L857.963 313.53L862.668 310.735C868.043 307.558 874.709 307.558 880.084 310.735C885.458 313.912 888.684 319.768 888.684 326.122C888.684 332.476 885.458 338.332 880.084 341.51L879.19 341.849Z" />
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
