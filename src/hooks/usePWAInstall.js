import { useState, useEffect } from "react";

/**
 * Tracks the PWA `beforeinstallprompt` event captured on window.__pwaPrompt.
 * Returns { installable, triggerInstall }.
 * Used by Dashboard / InstallBanner to know whether to show the install CTA.
 */
export function usePWAInstall() {
  const [installable, setInstallable] = useState(!!window.__pwaPrompt);

  useEffect(() => {
    const check = () => setInstallable(!!window.__pwaPrompt);
    window.addEventListener("beforeinstallprompt", check);
    return () => window.removeEventListener("beforeinstallprompt", check);
  }, []);

  const triggerInstall = async () => {
    if (!window.__pwaPrompt) return false;
    window.__pwaPrompt.prompt();
    const { outcome } = await window.__pwaPrompt.userChoice;
    if (outcome === "accepted") window.__pwaPrompt = null;
    setInstallable(false);
    return outcome === "accepted";
  };

  return { installable, triggerInstall };
}
