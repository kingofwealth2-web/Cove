import { useState } from "react";
import { springs } from "../tokens/springs";
import { hashPin } from "../lib/pinUtils";

export default function PinScreen({ onUnlock, pinHash, C }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);

  const handleKey = (val) => {
    if (pin.length >= 4 || checking) return;
    const next = pin + val;
    setPin(next);
    if (next.length === 4) {
      setChecking(true);
      setTimeout(async () => {
        const hashed = await hashPin(next);
        if (hashed === pinHash) {
          onUnlock();
        } else {
          setError(true);
          setPin("");
          setChecking(false);
          setTimeout(() => setError(false), 600);
        }
      }, 100);
    }
  };

  const handleDelete = () => {
    if (!checking) setPin(p => p.slice(0, -1));
  };

  const keys = ["1","2","3","4","5","6","7","8","9","","0","⌫"];

  return (
    <div style={{
      position: "fixed", inset: 0, background: C.background,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      zIndex: 9999, gap: 40,
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 32, fontFamily: "'DM Serif Display', serif", color: C.text, marginBottom: 8 }}>🔒 Cove</div>
        <div style={{ fontSize: 15, color: C.textMuted }}>Enter your PIN to continue</div>
      </div>

      <div style={{ display: "flex", gap: 16, animation: error ? `shake 400ms ${springs.snap}` : "none" }}>
        <style>{`
          @keyframes shake {
            0%,100% { transform: translateX(0); }
            20% { transform: translateX(-8px); }
            40% { transform: translateX(8px); }
            60% { transform: translateX(-6px); }
            80% { transform: translateX(6px); }
          }
        `}</style>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            width: 16, height: 16, borderRadius: "50%",
            background: i < pin.length ? (error ? C.expense : C.accent) : C.surfaceAlt,
            border: `2px solid ${i < pin.length ? (error ? C.expense : C.accent) : C.border}`,
            transition: `all 150ms ${springs.snap}`,
          }} />
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 72px)", gap: 14 }}>
        {keys.map((key, i) => (
          <button key={i} onClick={() => key === "⌫" ? handleDelete() : key ? handleKey(key) : null}
            disabled={!key || checking}
            style={{
              width: 72, height: 72, borderRadius: "50%", border: "none",
              cursor: key ? "pointer" : "default",
              background: key ? C.surface : "transparent",
              color: key === "⌫" ? C.textMuted : C.text,
              fontSize: key === "⌫" ? 20 : 24,
              fontFamily: "'DM Serif Display', serif",
              boxShadow: key ? C.shadow : "none",
              transition: `all 120ms ${springs.snap}`,
              opacity: key ? 1 : 0,
            }}
            onMouseDown={e => { if (key) e.currentTarget.style.transform = "scale(0.92)"; }}
            onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
          >{key}</button>
        ))}
      </div>

      {error && <div style={{ fontSize: 13, color: C.expense, fontWeight: 500 }}>Incorrect PIN. Try again.</div>}
    </div>
  );
}