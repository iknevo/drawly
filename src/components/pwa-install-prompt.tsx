"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { DownloadIcon } from "lucide-react";

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [hidden, setHidden] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  const isBrowser = typeof window !== "undefined";

  useEffect(() => {
    if (!isBrowser) return;

    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [isBrowser]);

  useEffect(() => {
    if (!isBrowser) return;

    const checkInstalled = () => {
      setIsInstalled(window.matchMedia("(display-mode: standalone)").matches);
    };
    checkInstalled();

    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    mediaQuery.addEventListener("change", checkInstalled);
    return () => mediaQuery.removeEventListener("change", checkInstalled);
  }, [isBrowser]);

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setHidden(true);
    }
    setDeferredPrompt(null);
  };

  useEffect(() => {
    if (!isBrowser) return;

    const handler = () => {
      setHidden(true);
    };
    window.addEventListener("appinstalled", handler);
    return () => window.removeEventListener("appinstalled", handler);
  }, [isBrowser]);

  if (hidden || isInstalled) return null;
  if (!isBrowser || (!deferredPrompt && !isInstalled)) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex items-center gap-3 rounded-xl bg-card p-4 shadow-lg border border-border">
      <DownloadIcon className="size-5" />
      <div className="flex-1">
        <h3 className="text-sm font-medium">Install Drawly</h3>
        <p className="text-xs text-muted-foreground">
          Add Drawly to your home screen for quick access.
        </p>
      </div>
      <Button size="sm" onClick={install}>
        Install
      </Button>
    </div>
  );
}
