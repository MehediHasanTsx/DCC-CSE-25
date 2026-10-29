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
  BellRing,
  CheckCircle2,
  Laptop,
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

  // If running as standalone app, don't show install button unless explicitly requested
  if ((isStandalone || isInstalled) && !showIfInstalled) {
    return null;
  }

  // On sidebar bottom panel: do not show if on desktop without install prompt
  if (variant === 'sidebar' && !isIOS && !hasNativePrompt && !showIfInstalled) {
    return null;
  }

  const handleClick = async () => {
    // Show the installation & download dialog so user can choose APK or PWA
    if (!hasNativePrompt || isIOS) {
      setShowGuide(true);
      return;
    }

    const outcome = await promptInstall();
    if (outcome === 'accepted') {
      toast.success('DCC CSE installed to your device!');
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      {variant === 'hero' && (
        <Button
          size="lg"
          onClick={() => setShowGuide(true)}
          className={`w-full sm:w-auto h-12 rounded-xl gap-2 text-sm sm:text-base font-semibold px-6 shadow-md cursor-pointer bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-0 transition-all active:scale-98 ${className}`}
        >
          <Download className="h-4 w-4 shrink-0" />
          Install App / APK
        </Button>
      )}

      {variant === 'header' && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowGuide(true)}
          className={`h-9 px-3 text-xs font-semibold gap-1.5 rounded-lg border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors cursor-pointer ${className}`}
        >
          <Download className="h-3.5 w-3.5" />
          <span>Install App</span>
        </Button>
      )}

      {variant === 'sidebar' && (
        <button
          type="button"
          onClick={() => setShowGuide(true)}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors border border-emerald-500/20 cursor-pointer ${className}`}
        >
          <Download className="h-4 w-4 shrink-0" />
          <div className="flex flex-col text-left">
            <span className="font-semibold leading-tight">Install App</span>
            <span className="text-[10px] text-muted-foreground">Download APK or add to home</span>
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
                Get routine alarms, notifications, offline class routine &amp; GPA calculator.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => setShowGuide(true)}
            className="w-full sm:w-auto text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" /> Install / Download
          </Button>
        </div>
      )}

      {/* Installation Guide & APK Download Dialog */}
      <Dialog open={showGuide} onOpenChange={setShowGuide}>
        <DialogContent className="max-w-md p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Smartphone className="h-5 w-5 text-primary" />
              Get DCC CSE 25 App
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Choose how you want to use the app on your mobile or desktop device.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-1 text-sm">
            {/* Option 1: Android APK Download (Android Mobile Only) */}
            <div className="rounded-xl border-2 border-emerald-500/40 bg-emerald-500/5 p-4 space-y-3 relative overflow-hidden">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-semibold text-sm">Android App (.APK)</p>
                      <span className="text-[10px] font-medium bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                        Android Mobile Only
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Direct APK install for Android smartphones &amp; tablets (not for PC/laptop)
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5 text-foreground font-medium text-[11px]">
                  <BellRing className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <span>Class alarms &amp; notifications ring even when app is closed</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>Full offline routine, GPA calculator &amp; syllabus support</span>
                </div>
              </div>

              <a
                href="/downloads/dcc-cse-25.apk"
                download="dcc-cse-25.apk"
                onClick={() => {
                  toast.success('Downloading DCC CSE Android APK...', {
                    description: 'Check your notification bar or downloads folder to install it on your Android phone.',
                  });
                }}
                className="w-full flex items-center justify-center gap-2 h-10 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer"
              >
                <Download className="h-4 w-4" /> Download Android APK (4.9 MB)
              </a>
            </div>

            {/* Option 2: Add to Home Screen (Desktop, Laptop & iOS) */}
            <div className="rounded-xl border border-sky-500/40 bg-sky-500/5 p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-600 text-white shadow-xs">
                    <Laptop className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-semibold text-sm">Add to Home Screen (Web PWA)</p>
                      <span className="text-[10px] font-medium bg-sky-600 text-white px-2 py-0.5 rounded-full">
                        Desktop, Laptop &amp; iOS
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      For Desktop, Laptop (Windows/Mac/Linux) &amp; iPhone users. No APK download needed!
                    </p>
                  </div>
                </div>
              </div>

              {isIOS ? (
                <div className="space-y-1.5 text-xs text-muted-foreground bg-background/60 p-2.5 rounded-lg border border-border/60">
                  <p className="font-medium text-foreground text-[11px]">On iPhone / iPad (Safari):</p>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-foreground">1.</span>
                    <span>Tap the <Share2 className="h-3.5 w-3.5 inline mx-0.5 text-primary" /> Share button in Safari.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-foreground">2.</span>
                    <span>Scroll down and select <PlusSquare className="h-3.5 w-3.5 inline mx-0.5 text-primary" /> <strong>Add to Home Screen</strong>.</span>
                  </div>
                </div>
              ) : hasNativePrompt ? (
                <div className="pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClick}
                    className="w-full h-9 text-xs font-semibold gap-1.5 border-sky-500/40 hover:bg-sky-500/10 text-sky-600 dark:text-sky-400 cursor-pointer"
                  >
                    <PlusSquare className="h-3.5 w-3.5" /> Install App to Desktop / Laptop
                  </Button>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground bg-background/60 p-2.5 rounded-lg border border-border/60 space-y-1">
                  <p className="font-medium text-foreground text-[11px]">How to install on Desktop / Laptop:</p>
                  <p className="leading-relaxed">
                    In Chrome or Edge browser, look at the right side of the address bar and click the <strong>Install</strong> icon (or click <strong>⋮ Menu &rarr; Install DCC CSE</strong> / <strong>Add to Home screen</strong>).
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                markAsInstalled();
                setShowGuide(false);
                toast.success('Install prompt hidden');
              }}
              className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Don&apos;t show again
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowGuide(false)}
              className="text-xs cursor-pointer"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
