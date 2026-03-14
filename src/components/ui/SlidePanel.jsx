import { useState, useEffect } from "react";
import { springs } from "../../tokens/springs";

export default function SlidePanel({ children, onClose, C, title }) {
  const [vis, setVis] = useState(false);

  useEffect(() => { setTimeout(() => setVis(true), 10); }, []);

  const close = () => { setVis(false); setTimeout(onClose, 380); };

  // Escape key closes panel
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={close}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: vis ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0)",
        backdropFilter: vis ? "blur(8px)" : "none",
        transition: `all 350ms ${springs.snap}`,
        display: "flex", alignItems: "stretch", justifyContent: "flex-end",
        overscrollBehavior: "none", touchAction: "none",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 440, maxWidth: "95vw",
          background: C.surface, borderLeft: `1px solid ${C.border}`,
          display: "flex", flexDirection: "column",
          transform: vis ? "translateX(0)" : "translateX(100%)",
          transition: `transform 380ms ${springs.bounce}`,
          boxShadow: "-24px 0 64px rgba(0,0,0,0.5)",
          overflowY: "auto", overflowX: "hidden",
          overscrollBehavior: "contain", touchAction: "pan-y",
        }}
      >
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "28px 28px 20px", borderBottom: `1px solid ${C.border}`, flexShrink: 0,
        }}>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: C.text }}>{title}</span>
          <button
            aria-label="Close panel"
            onClick={close}
            style={{
              background: C.surfaceAlt, border: "none", cursor: "pointer",
              borderRadius: 10, width: 32, height: 32,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: C.textSub, fontSize: 20, lineHeight: 1,
            }}
          >×</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>{children}</div>
      </div>
    </div>
  );
}
