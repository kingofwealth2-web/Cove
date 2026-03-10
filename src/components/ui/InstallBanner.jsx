import { useEffect, useState } from "react";
import { springs } from "../../tokens/springs";

export default function InstallBanner({ onInstall, onDismiss, C }) {
  const [visible, setVisible] = useState(false);

  // Slight delay so it doesn't pop instantly on load
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      position: "fixed",
      bottom: 24,
      left: "50%",
      transform: visible ? "translateX(-50%) translateY(0)" : "translateX(-50%) translateY(120px)",
      transition: `transform 500ms ${springs.bounce}`,
      zIndex: 9998,
      width: "calc(100% - 32px)",
      maxWidth: 420,
      background: C.surface,
      border: `1px solid ${C.borderStrong}`,
      borderRadius: 18,
      padding: "16px 18px",
      display: "flex",
      alignItems: "center",
      gap: 14,
      boxShadow: C.shadowLg,
    }}>
      {/* Icon */}
      <div style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        background: C.accentSoft,
        border: `1px solid ${C.accentGlow}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontSize: 22,
      }}>
        📲
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 2 }}>
          Add Cove to Home Screen
        </div>
        <div style={{ fontSize: 12, color: C.textSub, lineHeight: 1.4 }}>
          Get instant access — works offline too
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
        <button
          onClick={onInstall}
          style={{
            background: C.accent,
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "7px 14px",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Install
        </button>
        <button
          onClick={onDismiss}
          style={{
            background: "transparent",
            color: C.textMuted,
            border: "none",
            borderRadius: 10,
            padding: "4px 14px",
            fontSize: 12,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Not now
        </button>
      </div>
    </div>
  );
}