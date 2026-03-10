import { useState, useEffect } from "react";

export function usePWAInstall() {
  const [prompt, setPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(
    () => sessionStorage.getItem("cove-install-dismissed") === "true"
  );

  useEffect(() => {
    // Already installed as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setPrompt(null);
    });

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") {
      setPrompt(null);
      setIsInstalled(true);
    }
  };

  const dismiss = () => {
    sessionStorage.setItem("cove-install-dismissed", "true");
    setIsDismissed(true);
  };

  const showBanner = !!prompt && !isInstalled && !isDismissed;

  return { showBanner, install, dismiss };
}