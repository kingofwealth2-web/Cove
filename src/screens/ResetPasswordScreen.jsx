import { useState } from "react";
import { supabase } from "../lib/supabase";
import { springs } from "../tokens/springs";

export default function ResetPasswordScreen({ onDone }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const C = {
    background: "#0A0A0F", surface: "#141418", surfaceAlt: "#1C1C22",
    border: "rgba(255,255,255,0.07)", borderStrong: "rgba(255,255,255,0.14)",
    text: "#F0F0F8", textSub: "rgba(240,240,248,0.55)", textMuted: "rgba(240,240,248,0.3)",
    accent: "#6366F1", accentSoft: "rgba(99,102,241,0.12)", accentGlow: "rgba(99,102,241,0.35)",
    expense: "#FF375F", income: "#34C759",
  };

  const inputStyle = {
    background: C.surfaceAlt, border: `1px solid ${C.border}`,
    borderRadius: 12, padding: "13px 16px", fontSize: 15,
    color: C.text, outline: "none", width: "100%",
    transition: "border-color 150ms ease", fontFamily: "inherit",
  };

  const handleReset = async () => {
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords don't match."); return; }
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => onDone(), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const canSave = password.length >= 6 && confirm.length >= 1;

  return (
    <div style={{ minHeight: "100vh", background: C.background, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{
        width: "100%", maxWidth: 400,
        background: C.surface, borderRadius: 24, padding: 40,
        border: `1px solid ${C.borderStrong}`,
        boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        animation: `slideUp 400ms ${springs.bounce}`,
      }}>
        {success ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: C.text, marginBottom: 8 }}>Password updated</h2>
            <p style={{ fontSize: 14, color: C.textMuted }}>Signing you in now...</p>
          </div>
        ) : (
          <>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div style={{
                width: 52, height: 52,
                background: `linear-gradient(135deg, ${C.accent}, #818CF8)`,
                borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px", boxShadow: `0 8px 24px ${C.accentGlow}`,
              }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <path d="M3 18C3 15 6 12 12 12C18 12 21 15 21 18" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                  <path d="M12 12C12 8 9 5 6 6" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
                  <path d="M12 12C12 7 15 4 18 6" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
                </svg>
              </div>
              <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: C.text, letterSpacing: "-0.5px", marginBottom: 6 }}>New password</h1>
              <p style={{ fontSize: 14, color: C.textMuted }}>Choose a strong password for your Cove account.</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
              <input
                type="password" placeholder="New password" value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && canSave && handleReset()}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = C.accent}
                onBlur={e => e.target.style.borderColor = C.border}
                autoFocus
              />
              <input
                type="password" placeholder="Confirm new password" value={confirm}
                onChange={e => setConfirm(e.target.value)}
                onKeyDown={e => e.key === "Enter" && canSave && handleReset()}
                style={{
                  ...inputStyle,
                  borderColor: confirm && password !== confirm ? C.expense : C.border,
                }}
                onFocus={e => e.target.style.borderColor = password !== confirm ? C.expense : C.accent}
                onBlur={e => e.target.style.borderColor = confirm && password !== confirm ? C.expense : C.border}
              />
              {confirm && password !== confirm && (
                <div style={{ fontSize: 12, color: C.expense, marginTop: -4 }}>Passwords don't match</div>
              )}
            </div>

            {error && (
              <div style={{ background: "rgba(255,55,95,0.12)", border: "1px solid rgba(255,55,95,0.3)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: C.expense, marginBottom: 16 }}>
                {error}
              </div>
            )}

            <button
              onClick={handleReset}
              disabled={!canSave || loading}
              style={{
                width: "100%", padding: "14px", borderRadius: 14, border: "none",
                background: canSave ? C.accent : C.surfaceAlt,
                color: canSave ? "white" : C.textMuted,
                fontSize: 15, fontWeight: 700, cursor: canSave ? "pointer" : "not-allowed",
                boxShadow: canSave ? `0 8px 24px ${C.accentGlow}` : "none",
                transition: `all 200ms ${springs.snap}`,
                fontFamily: "inherit",
              }}>
              {loading ? "Updating..." : "Set new password"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
