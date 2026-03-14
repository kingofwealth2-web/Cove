import { useEffect } from "react";
import { springs } from "../../tokens/springs";

export default function Toast({ message, onDone, C }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed", bottom: 32, right: 32, zIndex: 9999,
        // Use C for theme awareness, with dark fallback if C not provided
        background: C ? C.surface : "#1C1C22",
        color: C ? C.text : "#F0F0F8",
        borderRadius: 14,
        padding: "14px 20px", fontSize: 14, fontWeight: 500,
        boxShadow: C ? C.shadowLg : "0 8px 32px rgba(0,0,0,0.5)",
        border: `1px solid ${C ? C.borderStrong : "rgba(255,255,255,0.1)"}`,
        animation: `toastIn 400ms ${springs.bounce} both`,
        maxWidth: 320,
      }}
    >
      {message}
    </div>
  );
}
