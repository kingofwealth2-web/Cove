import { useState, useEffect } from "react";
import { springs } from "../../tokens/springs";

/**
 * Android/Chrome PWA install prompt banner.
 * Listens for the `beforeinstallprompt` event (captured on window.__pwaPrompt
 * by main.jsx / sw.js) and surfaces an install CTA.
 */
export default function InstallBanner({ C }) {
  const [installable, setInstallable] = useState(!!window.__pwaPrompt);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const check = () => setInstallable(!!window.__pwaPrompt);
    window.addEventListener("beforeinstallprompt", check);
    return () => window.removeEventListener("beforeinstallprompt", check);
  }, []);

  const handleInstall = async () => {
    if (!window.__pwaPrompt) return;
    window.__pwaPrompt.prompt();
    const { outcome } = await window.__pwaPrompt.userChoice;
    if (outcome === "accepted") window.__pwaPrompt = null;
    setInstallable(false);
  };

  if (!installable || dismissed) return null;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      background: `linear-gradient(135deg, ${C.accent}22, ${C.accent}08)`,
      border: `1px solid ${C.accent}40`, borderRadius: 16, padding: "14px 18px",
      animation: `slideUp 300ms ${springs.bounce}`,
    }}>
      <span style={{ fontSize: 24 }}>📲</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Install Cove</div>
        <div style={{ fontSize: 12, color: C.textMuted }}>Add to your home screen for the best experience</div>
      </div>
      <button
        onClick={handleInstall}
        style={{
          padding: "8px 16px", borderRadius: 10, border: "none",
          background: C.accent, color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer",
          transition: `all 200ms ${springs.snap}`,
        }}
        onMouseEnter={e => e.currentTarget.style.filter = "brightness(1.1)"}
        onMouseLeave={e => e.currentTarget.style.filter = ""}
      >Install</button>
      <button
        aria-label="Dismiss install prompt"
        onClick={() => setDismissed(true)}
        style={{
          background: "none", border: "none", color: C.textMuted,
          cursor: "pointer", fontSize: 18, padding: "0 4px",
        }}
      >✕</button>
    </div>
  );
}
