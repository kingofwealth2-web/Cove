import { useState, useEffect } from "react";
import { springs } from "../../tokens/springs";

export default function Modal({ children, onClose, C, width = 480 }) {
  const [vis, setVis] = useState(false);

  useEffect(() => { setTimeout(() => setVis(true), 10); }, []);

  const close = () => { setVis(false); setTimeout(onClose, 350); };

  // Escape key closes modal
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
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width, maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto",
          background: C.surface, borderRadius: 24,
          border: `1px solid ${C.borderStrong}`,
          boxShadow: C.shadowLg,
          transform: vis ? "scale(1) translateY(0)" : "scale(0.95) translateY(20px)",
          opacity: vis ? 1 : 0,
          transition: `all 380ms ${springs.bounce}`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
