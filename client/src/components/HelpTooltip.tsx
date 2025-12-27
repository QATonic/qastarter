import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface HelpTooltipProps {
  content: string | React.ReactNode;
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
  iconSize?: "sm" | "md" | "lg";
}

export default function HelpTooltip({
  content,
  className,
  side = "right",
  iconSize = "sm",
}: HelpTooltipProps) {
  const [open, setOpen] = useState(false);

  const sizeClasses = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        type="button"
        className={cn(
          "inline-flex items-center justify-center ml-1 p-1 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-full",
          open && "text-foreground bg-accent",
          className
        )}
        aria-label="Show help information"
        aria-expanded={open}
        data-testid="help-tooltip-trigger"
      >
        <HelpCircle className={cn(sizeClasses[iconSize])} aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent
        side={side}
        align="start"
        className="max-w-[calc(100vw-2rem)] w-80 text-sm"
        data-testid="help-tooltip-content"
        onInteractOutside={() => setOpen(false)}
      >
        {content}
      </PopoverContent>
    </Popover>
  );
}
