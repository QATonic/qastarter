import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Clock, Trash2 } from "lucide-react";

interface ResumeDialogProps {
  open: boolean;
  onResume: () => void;
  onStartFresh: () => void;
  timestamp: number;
}

export function ResumeDialog({ open, onResume, onStartFresh, timestamp }: ResumeDialogProps) {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent data-testid="dialog-resume">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Resume Previous Configuration?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              We found a saved configuration from <strong>{formatDate(timestamp)}</strong>.
            </p>
            <p>
              Would you like to resume where you left off, or start with a fresh configuration?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={onStartFresh}
            data-testid="button-start-fresh"
            className="gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Start Fresh
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onResume}
            data-testid="button-resume"
          >
            Resume
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
