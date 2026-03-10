import { useState, useEffect } from "react";

// ─── CRITICAL: This must run before React mounts ───────────────────────────
// Place this script tag in your index.html <head> BEFORE any other scripts:
//
//   <script>
//     window.__pwaPrompt = null;
//     window.addEventListener('beforeinstallprompt', function(e) {
//       e.preventDefault();
//       window.__pwaPrompt = e;
//     });
//   </script>
//
// Without this, the event fires before React is ready and is lost forever.
// ───────────────────────────────────────────────────────────────────────────

export function usePWAInstall() {
  const [prompt, setPrompt] = useState(() => window.__pwaPrompt || null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(
    () => sessionStorage.getItem("cove-install-dismissed") === "true"
  );

  useEffect(() => {
    // Already running as installed PWA — no banner needed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Pick up the event if it already fired before React mounted
    if (window.__pwaPrompt && !prompt) {
      setPrompt(window.__pwaPrompt);
    }

    // Also listen for future firings (e.g. after dismiss + revisit)
    const handler = (e) => {
      e.preventDefault();
      window.__pwaPrompt = e;
      setPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    const onInstalled = () => {
      setIsInstalled(true);
      setPrompt(null);
      window.__pwaPrompt = null;
    };
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") {
      setPrompt(null);
      setIsInstalled(true);
      window.__pwaPrompt = null;
    }
  };

  const dismiss = () => {
    sessionStorage.setItem("cove-install-dismissed", "true");
    setIsDismissed(true);
  };

  const showBanner = !!prompt && !isInstalled && !isDismissed;

  return { showBanner, install, dismiss };
}