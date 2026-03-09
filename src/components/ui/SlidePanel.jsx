import { useState, useEffect } from "react";
import { springs } from "../../tokens/springs";

export default function SlidePanel({ children, onClose, C, title }) {
  const [vis, setVis] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    setTimeout(() => setVis(true), 10);
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const close = () => { setVis(false); setTimeout(onClose, 380); };

  return (
    <div onClick={close} style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: vis ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0)",
      backdropFilter: vis ? "blur(8px)" : "none",
      transition: `all 350ms ${springs.snap}`,
      display: "flex", alignItems: isMobile ? "flex-end" : "stretch", justifyContent: isMobile ? "center" : "flex-end",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: isMobile ? "100%" : 440,
        maxWidth: isMobile ? "100%" : "95vw",
        maxHeight: isMobile ? "92vh" : "100vh",
        background: C.surface,
        borderLeft: isMobile ? "none" : `1px solid ${C.border}`,
        borderTop: isMobile ? `1px solid ${C.border}` : "none",
        borderRadius: isMobile ? "20px 20px 0 0" : 0,
        display: "flex", flexDirection: "column",
        transform: vis
          ? "translateY(0) translateX(0)"
          : isMobile ? "translateY(100%)" : "translateX(100%)",
        transition: `transform 380ms ${springs.bounce}`,
        boxShadow: isMobile ? "0 -16px 48px rgba(0,0,0,0.4)" : "-24px 0 64px rgba(0,0,0,0.5)",
        overflowY: "auto",
      }}>
        {isMobile && (
          <div style={{ width: 36, height: 4, borderRadius: 2, background: C.border, margin: "12px auto 0" }} />
        )}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: isMobile ? "16px 20px 14px" : "28px 28px 20px",
          borderBottom: `1px solid ${C.border}`, flexShrink: 0,
        }}>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: C.text }}>{title}</span>
          <button onClick={close} style={{
            background: C.surfaceAlt, border: "none", cursor: "pointer", borderRadius: 10,
            width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
            color: C.textSub, fontSize: 20, lineHeight: 1,
          }}>×</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>{children}</div>
      </div>
    </div>
  );
}
