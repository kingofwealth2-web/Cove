import { useState } from "react";
import { supabase } from "../lib/supabase";
import { springs } from "../tokens/springs";

export default function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("signin"); // signin | signup | forgot | forgot_sent
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const C = {
    background: "#0A0A0F", surface: "#141418", surfaceAlt: "#1C1C22",
    border: "rgba(255,255,255,0.07)", borderStrong: "rgba(255,255,255,0.14)",
    text: "#F0F0F8", textSub: "rgba(240,240,248,0.55)", textMuted: "rgba(240,240,248,0.3)",
    accent: "#6366F1", accentSoft: "rgba(99,102,241,0.12)", accentGlow: "rgba(99,102,241,0.35)",
    expense: "#FF375F", income: "#34C759",
  };

  const handleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      onAuth(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    setError(null);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      onAuth(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    if (!email) { setError("Enter your email address first."); return; }
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      setMode("forgot_sent");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key !== "Enter") return;
    if (mode === "signin") handleSignIn();
    else if (mode === "signup") handleSignUp();
    else if (mode === "forgot") handleForgot();
  };

  const inputStyle = {
    background: C.surfaceAlt, border: `1px solid ${C.border}`,
    borderRadius: 12, padding: "13px 16px", fontSize: 15,
    color: C.text, outline: "none", width: "100%",
    transition: "border-color 150ms ease",
    fontFamily: "inherit",
  };

  const Logo = () => (
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
  );

  return (
    <div style={{ minHeight: "100vh", background: C.background, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{
        width: "100%", maxWidth: 400,
        background: C.surface, borderRadius: 24, padding: 40,
        border: `1px solid ${C.borderStrong}`,
        boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        animation: `slideUp 400ms ${springs.bounce}`,
      }}>

        {/* ── Forgot sent confirmation ── */}
        {mode === "forgot_sent" && (
          <>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
              <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: C.text, letterSpacing: "-0.5px", marginBottom: 10 }}>Check your email</h1>
              <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>
                We sent a password reset link to <strong style={{ color: C.text }}>{email}</strong>. Click the link in the email to set a new password.
              </p>
            </div>
            <div style={{ fontSize: 12, color: C.textMuted, background: C.surfaceAlt, borderRadius: 12, padding: "12px 14px", marginBottom: 20, lineHeight: 1.6 }}>
              💡 Check your spam folder if you don't see it within a minute.
            </div>
            <button onClick={() => { setMode("signin"); setError(null); }} style={{
              width: "100%", padding: "13px", borderRadius: 14, border: `1px solid ${C.borderStrong}`,
              background: "transparent", color: C.textSub, fontSize: 14, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
            }}>← Back to sign in</button>
          </>
        )}

        {/* ── Forgot password ── */}
        {mode === "forgot" && (
          <>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <Logo />
              <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: C.text, letterSpacing: "-0.5px", marginBottom: 6 }}>Reset password</h1>
              <p style={{ fontSize: 14, color: C.textMuted }}>We'll send a reset link to your email.</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
              <input
                type="email" placeholder="Email address" value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = C.accent}
                onBlur={e => e.target.style.borderColor = C.border}
                autoFocus
              />
            </div>
            {error && (
              <div style={{ background: "rgba(255,55,95,0.12)", border: "1px solid rgba(255,55,95,0.3)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: C.expense, marginBottom: 16 }}>
                {error}
              </div>
            )}
            <button onClick={handleForgot} disabled={!email || loading} style={{
              width: "100%", padding: "14px", borderRadius: 14, border: "none",
              background: email ? C.accent : C.surfaceAlt,
              color: email ? "white" : C.textMuted,
              fontSize: 15, fontWeight: 700, cursor: email ? "pointer" : "not-allowed",
              boxShadow: email ? `0 8px 24px ${C.accentGlow}` : "none",
              transition: `all 200ms ${springs.snap}`,
              marginBottom: 16, fontFamily: "inherit",
            }}>
              {loading ? "Sending..." : "Send reset link"}
            </button>
            <div style={{ textAlign: "center" }}>
              <button onClick={() => { setMode("signin"); setError(null); }} style={{
                background: "none", border: "none", cursor: "pointer",
                color: C.textMuted, fontSize: 14, fontFamily: "inherit",
              }}>← Back to sign in</button>
            </div>
          </>
        )}

        {/* ── Sign in / Sign up ── */}
        {(mode === "signin" || mode === "signup") && (
          <>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <Logo />
              <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: C.text, letterSpacing: "-1px", marginBottom: 6 }}>Cove</h1>
              <p style={{ fontSize: 14, color: C.textMuted }}>
                {mode === "signup" ? "Create your account" : "Welcome back"}
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
              <input
                type="email" placeholder="Email address" value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = C.accent}
                onBlur={e => e.target.style.borderColor = C.border}
              />
              <input
                type="password" placeholder="Password" value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = C.accent}
                onBlur={e => e.target.style.borderColor = C.border}
              />
            </div>

            {/* Forgot password link — only on sign in */}
            {mode === "signin" && (
              <div style={{ textAlign: "right", marginTop: -8, marginBottom: 16 }}>
                <button onClick={() => { setMode("forgot"); setError(null); }} style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: C.accent, fontSize: 13, fontWeight: 500, fontFamily: "inherit",
                }}>Forgot password?</button>
              </div>
            )}

            {error && (
              <div style={{ background: "rgba(255,55,95,0.12)", border: "1px solid rgba(255,55,95,0.3)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: C.expense, marginBottom: 16 }}>
                {error}
              </div>
            )}

            <button
              onClick={mode === "signup" ? handleSignUp : handleSignIn}
              disabled={!email || !password || loading}
              style={{
                width: "100%", padding: "14px", borderRadius: 14, border: "none",
                background: email && password ? C.accent : C.surfaceAlt,
                color: email && password ? "white" : C.textMuted,
                fontSize: 15, fontWeight: 700, cursor: email && password ? "pointer" : "not-allowed",
                boxShadow: email && password ? `0 8px 24px ${C.accentGlow}` : "none",
                transition: `all 200ms ${springs.snap}`,
                marginBottom: 16, fontFamily: "inherit",
              }}>
              {loading ? "..." : mode === "signup" ? "Create Account" : "Sign In"}
            </button>

            <div style={{ textAlign: "center", fontSize: 14, color: C.textMuted }}>
              {mode === "signup" ? "Already have an account? " : "Don't have an account? "}
              <button onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setError(null); }} style={{
                background: "none", border: "none", cursor: "pointer",
                color: C.accent, fontWeight: 600, fontSize: 14, fontFamily: "inherit",
              }}>
                {mode === "signup" ? "Sign in" : "Sign up"}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
