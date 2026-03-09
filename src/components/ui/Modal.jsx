import { useState, useEffect } from "react";
import { springs } from "../../tokens/springs";

export default function Modal({ children, onClose, C, width = 480 }) {
  const [vis, setVis] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    setTimeout(() => setVis(true), 10);
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const close = () => { setVis(false); setTimeout(onClose, 350); };

  return (
    <div onClick={close} style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: vis ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0)",
      backdropFilter: vis ? "blur(8px)" : "none",
      transition: `all 350ms ${springs.snap}`,
      display: "flex",
      alignItems: isMobile ? "flex-end" : "center",
      justifyContent: "center",
      padding: isMobile ? 0 : 16,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: isMobile ? "100%" : width,
        maxWidth: "100%",
        maxHeight: isMobile ? "90vh" : "90vh",
        overflowY: "auto",
        background: C.surface,
        borderRadius: isMobile ? "20px 20px 0 0" : 24,
        border: `1px solid ${C.borderStrong}`,
        boxShadow: C.shadowLg,
        transform: vis
          ? "scale(1) translateY(0)"
          : isMobile ? "translateY(100%)" : "scale(0.95) translateY(20px)",
        opacity: isMobile ? 1 : (vis ? 1 : 0),
        transition: `all 380ms ${springs.bounce}`,
      }}>
        {isMobile && (
          <div style={{ width: 36, height: 4, borderRadius: 2, background: C.border, margin: "12px auto 4px" }} />
        )}
        {children}
      </div>
    </div>
  );
}
