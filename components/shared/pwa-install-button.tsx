'use client';

import { useState } from 'react';
import { usePwaInstall } from '@/lib/hooks/usePwaInstall';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Download,
  Share2,
  PlusSquare,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

interface PwaInstallButtonProps {
  variant?: 'hero' | 'header' | 'sidebar' | 'banner';
  className?: string;
  showIfInstalled?: boolean;
}

export function PwaInstallButton({
  variant = 'header',
  className = '',
  showIfInstalled = false,
}: PwaInstallButtonProps) {
  const { isInstalled, isStandalone, isIOS, promptInstall, hasNativePrompt, markAsInstalled } =
    usePwaInstall();
  const [showGuide, setShowGuide] = useState(false);

  // If already installed or running as standalone, don't show install button unless explicitly requested
  if ((isStandalone || isInstalled) && !showIfInstalled) {
    return null;
  }

  // On sidebar bottom panel: do not show if on desktop/Chromium without a native install prompt
  // (In Chrome, once the app is installed, Chrome never fires beforeinstallprompt, so hasNativePrompt is false)
  if (variant === 'sidebar' && !isIOS && !hasNativePrompt && !showIfInstalled) {
    return null;
  }

  const handleClick = async () => {
    const outcome = await promptInstall();
    if (outcome === 'accepted') {
      toast.success('DCC CSE installed to your device!');
    } else if (outcome === 'ios' || outcome === 'instructions') {
      setShowGuide(true);
    }
  };

  return (
    <>
      {variant === 'hero' && (
        <Button
          size="lg"
          onClick={handleClick}
          className={`w-full sm:w-auto h-12 rounded-xl gap-2 text-sm sm:text-base font-semibold px-6 shadow-md cursor-pointer bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-0 transition-all active:scale-98 ${className}`}
        >
          <Download className="h-4 w-4 shrink-0" />
          Install App (Offline)
        </Button>
      )}

      {variant === 'header' && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleClick}
          className={`h-9 px-3 text-xs font-semibold gap-1.5 rounded-lg border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors cursor-pointer ${className}`}
        >
          <Download className="h-3.5 w-3.5" />
          <span>Install App</span>
        </Button>
      )}

      {variant === 'sidebar' && (
        <button
          type="button"
          onClick={handleClick}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors border border-emerald-500/20 cursor-pointer ${className}`}
        >
          <Download className="h-4 w-4 shrink-0" />
          <div className="flex flex-col text-left">
            <span className="font-semibold leading-tight">Install App</span>
            <span className="text-[10px] text-muted-foreground">Add to home screen</span>
          </div>
        </button>
      )}

      {variant === 'banner' && (
        <div
          className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-foreground ${className}`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Install DCC CSE on your device</p>
              <p className="text-xs text-muted-foreground">
                Fast loading, offline class routine &amp; GPA calculator on your home screen.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleClick}
            className="w-full sm:w-auto text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" /> Install Now
          </Button>
        </div>
      )}

      {/* Installation Guide Dialog for iOS and Desktop Manual fallback */}
      <Dialog open={showGuide} onOpenChange={setShowGuide}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Smartphone className="h-5 w-5 text-primary" />
              Install DCC CSE 25
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Install this app directly to your home screen or desktop for instant offline access.
            </DialogDescription>
          </DialogHeader>

          {isIOS ? (
            <div className="space-y-4 py-2 text-sm">
              <div className="rounded-xl border border-border/80 bg-muted/40 p-3.5 space-y-3">
                <p className="font-semibold text-xs uppercase tracking-wider text-primary">
                  iOS / Safari Instructions:
                </p>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                    1
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Tap the <strong className="text-foreground inline-flex items-center gap-1"><Share2 className="h-3.5 w-3.5 inline" /> Share</strong> button in Safari&apos;s bottom navigation bar.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                    2
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Scroll down and tap <strong className="text-foreground inline-flex items-center gap-1"><PlusSquare className="h-3.5 w-3.5 inline" /> Add to Home Screen</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                    3
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Tap <strong className="text-foreground">Add</strong> in the top-right corner.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-2 text-sm">
              <div className="rounded-xl border border-border/80 bg-muted/40 p-3.5 space-y-3">
                <p className="font-semibold text-xs uppercase tracking-wider text-primary">
                  Chrome / Edge / Android Instructions:
                </p>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                    1
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Tap the <strong className="text-foreground">⋮ (Menu)</strong> icon in your browser toolbar (or the install icon <Download className="h-3.5 w-3.5 inline text-primary" /> in the address bar).
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                    2
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Select <strong className="text-foreground">Install App</strong> or <strong className="text-foreground">Add to Home screen</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                    3
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Confirm by clicking <strong className="text-foreground">Install</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                markAsInstalled();
                setShowGuide(false);
                toast.success('Install button hidden');
              }}
              className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Already downloaded? Hide button
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowGuide(false)}
              className="text-xs cursor-pointer"
            >
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
