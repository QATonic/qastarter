/**
 * GitHub Push Dialog
 *
 * A modal dialog that collects GitHub credentials and repository details,
 * then pushes the generated project to a new GitHub repository.
 */

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Github,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Eye,
  EyeOff,
  Lock,
  Globe,
} from 'lucide-react';
import { WizardConfig } from '@/components/wizard-steps/types';

interface GitHubPushDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: WizardConfig;
}

type PushState = 'idle' | 'pushing' | 'success' | 'error';

interface PushResult {
  repoUrl: string;
  cloneUrl: string;
  fullName: string;
  filesCount: number;
  defaultBranch: string;
}

export default function GitHubPushDialog({
  open,
  onOpenChange,
  config,
}: GitHubPushDialogProps) {
  const [token, setToken] = useState('');
  const [repoName, setRepoName] = useState(config.projectName || 'my-qa-project');
  const [isPrivate, setIsPrivate] = useState(false);
  const [description, setDescription] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [pushState, setPushState] = useState<PushState>('idle');
  const [pushResult, setPushResult] = useState<PushResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const isValidRepoName = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(repoName) && repoName.length > 0 && repoName.length <= 100;
  const canPush = token.length > 0 && isValidRepoName && pushState !== 'pushing';

  const handlePush = useCallback(async () => {
    if (!canPush) return;

    setPushState('pushing');
    setErrorMessage('');

    try {
      const response = await fetch('/api/v1/push-to-github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          githubToken: token,
          repoName,
          isPrivate,
          description: description || undefined,
          projectConfig: config,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const msg =
          data.error?.message ||
          data.message ||
          'Failed to push to GitHub. Please check your token and try again.';
        setErrorMessage(msg);
        setPushState('error');
        return;
      }

      setPushResult(data.data);
      setPushState('success');
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Network error. Please check your connection.';
      setErrorMessage(msg);
      setPushState('error');
    }
  }, [canPush, token, repoName, isPrivate, description, config]);

  const handleCopyCloneUrl = async () => {
    if (!pushResult) return;
    try {
      await navigator.clipboard.writeText(`git clone ${pushResult.cloneUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: ignore
    }
  };

  const handleClose = (openState: boolean) => {
    if (pushState === 'pushing') return; // Don't close while pushing
    onOpenChange(openState);
    // Reset all state when closing
    if (!openState) {
      setTimeout(() => {
        setPushState('idle');
        setPushResult(null);
        setErrorMessage('');
        setToken('');
        setRepoName(config.projectName || 'my-qa-project');
        setIsPrivate(false);
        setDescription('');
        setShowToken(false);
        setCopied(false);
      }, 200);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="w-5 h-5" />
            Push to GitHub
          </DialogTitle>
          <DialogDescription>
            Create a new GitHub repository and push your generated project.
          </DialogDescription>
        </DialogHeader>

        {pushState === 'success' && pushResult ? (
          /* Success state */
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                  Repository Created!
                </p>
                <p className="text-sm text-emerald-600 dark:text-emerald-500 truncate">
                  {pushResult.filesCount} files pushed to {pushResult.fullName}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm font-mono bg-muted px-3 py-2 rounded-md border truncate">
                  git clone {pushResult.cloneUrl}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={handleCopyCloneUrl}
                >
                  {copied ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>

              <Button
                className="w-full gap-2"
                onClick={() => window.open(pushResult.repoUrl, '_blank', 'noopener')}
              >
                <ExternalLink className="w-4 h-4" />
                Open Repository on GitHub
              </Button>
            </div>
          </div>
        ) : (
          /* Form state */
          <div className="space-y-4 py-2">
            {/* Error banner */}
            {pushState === 'error' && errorMessage && (
              <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800 text-sm">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-red-700 dark:text-red-400">{errorMessage}</p>
              </div>
            )}

            {/* Token input */}
            <div className="space-y-2">
              <Label htmlFor="github-token" className="text-sm font-medium">
                Personal Access Token
              </Label>
              <div className="relative">
                <Input
                  id="github-token"
                  type={showToken ? 'text' : 'password'}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="pr-10 font-mono text-sm"
                  disabled={pushState === 'pushing'}
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showToken ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Needs <code className="text-xs">repo</code> scope.{' '}
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo&description=QAStarter"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Create one here
                </a>
              </p>
            </div>

            {/* Repo name */}
            <div className="space-y-2">
              <Label htmlFor="repo-name" className="text-sm font-medium">
                Repository Name
              </Label>
              <Input
                id="repo-name"
                type="text"
                placeholder="my-qa-project"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                maxLength={100}
                className={
                  repoName && !isValidRepoName
                    ? 'border-red-400 focus-visible:ring-red-400'
                    : ''
                }
                disabled={pushState === 'pushing'}
              />
              {repoName && !isValidRepoName && (
                <p className="text-xs text-red-500">
                  Must start with a letter or number. Only letters, numbers, hyphens, underscores, and dots allowed (max 100 chars).
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="repo-description" className="text-sm font-medium">
                Description <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="repo-description"
                type="text"
                placeholder="QA automation project for..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={pushState === 'pushing'}
                maxLength={500}
              />
            </div>

            {/* Visibility toggle */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                {isPrivate ? (
                  <Lock className="w-4 h-4 text-amber-500" />
                ) : (
                  <Globe className="w-4 h-4 text-blue-500" />
                )}
                <Label htmlFor="repo-visibility" className="text-sm cursor-pointer">
                  {isPrivate ? 'Private repository' : 'Public repository'}
                </Label>
              </div>
              <Switch
                id="repo-visibility"
                checked={isPrivate}
                onCheckedChange={setIsPrivate}
                disabled={pushState === 'pushing'}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          {pushState === 'success' ? (
            <Button variant="outline" onClick={() => handleClose(false)}>
              Close
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => handleClose(false)}
                disabled={pushState === 'pushing'}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePush}
                disabled={!canPush}
                className="gap-2"
              >
                {pushState === 'pushing' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Pushing...
                  </>
                ) : (
                  <>
                    <Github className="w-4 h-4" />
                    Push to GitHub
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
