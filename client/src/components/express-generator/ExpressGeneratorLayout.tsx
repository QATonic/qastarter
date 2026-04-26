import ConfigPanel from './ConfigPanel';
import PreviewPanel from './PreviewPanel';
import GenerateBar from './GenerateBar';
import PresetsRow from './PresetsRow';
import RecentStacks from './RecentStacks';
import { TooltipProvider } from '@/components/ui/tooltip';

interface ExpressGeneratorLayoutProps {
  onGenerate: () => void;
  isGenerating: boolean;
}

export default function ExpressGeneratorLayout({
  onGenerate,
  isGenerating,
}: ExpressGeneratorLayoutProps) {
  return (
    <TooltipProvider delayDuration={250}>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        <PresetsRow />
        <RecentStacks />
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Config Panel -- left column on desktop, full width on mobile */}
          <div className="flex-1 lg:w-[55%] lg:flex-none overflow-y-auto border-r border-border/50">
            <ConfigPanel />
          </div>

          {/* Preview Panel -- hidden on mobile, right column on desktop */}
          <div className="hidden lg:flex lg:w-[45%] lg:flex-none overflow-y-auto">
            <PreviewPanel />
          </div>
        </div>
        <GenerateBar onGenerate={onGenerate} isGenerating={isGenerating} />
      </div>
    </TooltipProvider>
  );
}
