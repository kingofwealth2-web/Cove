import { useState, useEffect, useRef } from "react";
import { springs } from "../tokens/springs";
import { hashPin } from "../lib/pinUtils";
import { verifyBiometric } from "../lib/biometricUtils";

const FingerprintIcon = ({ size = 40, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 3.4"/>
    <path d="M14 13.12c0 2.38 0 6.38-1 8.88"/>
    <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/>
    <path d="M2 12a10 10 0 0 1 18-6"/>
    <path d="M2 17.5a14.5 14.5 0 0 0 4.08 3.71"/>
    <path d="M6 10a6 6 0 0 1 11.5-2.69"/>
    <path d="M6.18 17.09c.33.21.67.4 1.03.56"/>
    <path d="M6.52 13a9.5 9.5 0 0 0 .13 1.4"/>
    <path d="M8.65 22c3.23-1.2 4.35-3.7 4.35-8"/>
    <path d="M9 6.8a6 6 0 0 1 9 5.2v2"/>
  </svg>
);

export default function PinScreen({ onUnlock, pinHash, biometricCredentials, C }) {
  const hasBio = Array.isArray(biometricCredentials) && biometricCredentials.length > 0;
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);
  const [bioState, setBioState] = useState("idle");
  const [showPin, setShowPin] = useState(!hasBio);
  const bioTriggered = useRef(false);

  useEffect(() => {
    if (hasBio && !bioTriggered.current) {
      bioTriggered.current = true;
      setTimeout(() => triggerBiometric(), 400);
    }
  }, [hasBio]);

  const triggerBiometric = async () => {
    if (!hasBio) return;
    setBioState("prompting");
    try {
      await verifyBiometric(biometricCredentials);
      onUnlock();
    } catch {
      setBioState("failed");
      setShowPin(true);
    }
  };

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
      minHeight: "100vh", background: C.background,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      zIndex: 9999, gap: 36, padding: "40px 24px",
      overflowY: "auto",
    }}>
      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
        @keyframes bioBreath {
          0%,100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.08); opacity: 1; }
        }
      `}</style>

      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 32, fontFamily: "'DM Serif Display', serif", color: C.text, marginBottom: 8 }}>🔒 Cove</div>
        <div style={{ fontSize: 15, color: C.textMuted }}>
          {bioState === "prompting" ? "Waiting for biometric..." : "Enter your PIN to continue"}
        </div>
      </div>

      {/* Biometric button -- shown when credential exists */}
      {hasBio && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <button
            onClick={triggerBiometric}
            disabled={bioState === "prompting"}
            style={{
              width: 80, height: 80, borderRadius: "50%", border: "none", cursor: "pointer",
              background: bioState === "prompting" ? C.accentSoft : C.surface,
              color: bioState === "failed" ? C.textMuted : C.accent,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: bioState === "prompting" ? `0 0 0 3px ${C.accent}40` : C.shadow,
              animation: bioState === "prompting" ? `bioBreath 1.4s ${springs.smooth} infinite` : "none",
              transition: `all 250ms ${springs.snap}`,
            }}
          >
            <FingerprintIcon size={38} color={bioState === "failed" ? C.textMuted : C.accent} />
          </button>
          <div style={{ fontSize: 12, color: bioState === "failed" ? C.textMuted : C.accent, fontWeight: 500 }}>
            {bioState === "failed" ? "Biometric unavailable -- use PIN" : bioState === "prompting" ? "Checking..." : "Tap to use biometrics"}
          </div>
          {bioState !== "prompting" && (
            <button onClick={() => setShowPin(s => !s)} style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 12, color: C.textMuted, padding: "4px 8px",
              textDecoration: "underline", textDecorationStyle: "dotted",
            }}>
              {showPin ? "Hide PIN" : "Use PIN instead"}
            </button>
          )}
        </div>
      )}

      {(showPin || !hasBio) && (
        <>
          <div style={{ display: "flex", gap: 16, animation: error ? `shake 400ms ${springs.snap}` : "none" }}>
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
        </>
      )}
    </div>
  );
}
