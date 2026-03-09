import { useState, useEffect } from "react";
import { darkColors, lightColors, accentOptions } from "../tokens/colors";
import { springs } from "../tokens/springs";
import GlobalStyles from "../components/ui/GlobalStyles";

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [income, setIncome] = useState("");
  const [currency, setCurrency] = useState("GHS");
  const [accent, setAccent] = useState(accentOptions[0]);
  const [theme, setTheme] = useState("dark");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const C = theme === "dark" ? darkColors : lightColors;
  const accentC = { ...C, accent: accent.value, accentSoft: accent.soft, accentGlow: accent.glow };

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const numpadKeys = ["1","2","3","4","5","6","7","8","9",".","0","⌫"];
  const handleIncome = (k) => {
    if (k === "⌫") setIncome(v => v.slice(0,-1));
    else if (k === "." && income.includes(".")) return;
    else setIncome(v => v + k);
  };

  const suggestedBudgets = {
    "Food": 0.20, "Transport": 0.10, "Rent/Housing": 0.30,
    "Utilities": 0.06, "Education": 0.05, "Savings": 0.12,
    "Fun": 0.08, "Health": 0.07,
  };
  const inc = parseFloat(income) || 0;

  const slides = [
    <div key="s0" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, gap: 32, animation: `slideUp 400ms ${springs.bounce}` }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 72, height: 72, background: `linear-gradient(135deg, ${accentC.accent}, #818CF8)`, borderRadius: 22, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", boxShadow: `0 12px 40px ${accentC.accentGlow}` }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none"><path d="M3 18C3 15 6 12 12 12C18 12 21 15 21 18" stroke="white" strokeWidth="2.5" strokeLinecap="round"/><path d="M12 12C12 8 9 5 6 6" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7"/><path d="M12 12C12 7 15 4 18 6" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7"/></svg>
        </div>
        <h1 style={{ fontFamily: "\'DM Serif Display\', serif", fontSize: 52, color: accentC.text, letterSpacing: "-2px", marginBottom: 12 }}>Hi, I'm Cove.</h1>
        <p style={{ fontSize: 18, color: accentC.textSub, lineHeight: 1.6 }}>Your personal money companion.</p>
      </div>
      <div style={{ width: "100%", maxWidth: 360 }}>
        <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="What's your name?"
          onKeyDown={e => e.key === "Enter" && name.trim() && setStep(1)}
          style={{ width: "100%", padding: "16px 20px", background: accentC.surfaceAlt, border: `1.5px solid ${accentC.border}`, borderRadius: 16, fontSize: 17, color: accentC.text, outline: "none", textAlign: "center" }}
          onFocus={e => e.target.style.borderColor = accentC.accent}
          onBlur={e => e.target.style.borderColor = accentC.border}
        />
      </div>
      <button disabled={!name.trim()} onClick={() => setStep(1)} style={{
        padding: "15px 48px", background: name.trim() ? accentC.accent : accentC.surfaceAlt,
        color: name.trim() ? "white" : accentC.textMuted, border: "none", borderRadius: 16,
        fontSize: 16, fontWeight: 700, cursor: name.trim() ? "pointer" : "not-allowed",
        boxShadow: name.trim() ? `0 8px 24px ${accentC.accentGlow}` : "none",
      }}>Continue →</button>
    </div>,

    <div key="s1" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", padding: 40, gap: 24, animation: `slideUp 400ms ${springs.bounce}` }}>
      <div style={{ textAlign: "center", paddingTop: 40 }}>
        <h2 style={{ fontFamily: "\'DM Serif Display\', serif", fontSize: 30, color: accentC.text, letterSpacing: "-0.5px", marginBottom: 8 }}>How much do you earn each month, {name}?</h2>
        <p style={{ fontSize: 14, color: accentC.textMuted }}>This is just to help you budget. We never share it.</p>
      </div>
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <select value={currency} onChange={e => setCurrency(e.target.value)} style={{ background: accentC.surfaceAlt, border: `1px solid ${accentC.border}`, borderRadius: 10, padding: "6px 12px", color: accentC.textSub, fontSize: 13, outline: "none", marginBottom: 12 }}>
          <option>GHS</option><option>USD</option><option>EUR</option><option>GBP</option><option>NGN</option>
        </select>
        {isMobile ? (
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 64, color: income ? accentC.text : accentC.textMuted, letterSpacing: "-2px", lineHeight: 1 }}>
            {income ? `${currency} ${income}` : `${currency} 0`}
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, background: accentC.surfaceAlt, borderRadius: 16, padding: "16px 24px", maxWidth: 360, margin: "0 auto", border: `1px solid ${accentC.border}` }}>
            <span style={{ fontSize: 20, fontWeight: 600, color: accentC.textMuted }}>{currency}</span>
            <input
              autoFocus type="number" min="0" step="0.01" placeholder="0.00"
              value={income} onChange={e => setIncome(e.target.value)}
              onKeyDown={e => e.key === "Enter" && income && setStep(2)}
              style={{ background: "none", border: "none", outline: "none", fontSize: 40, fontFamily: "'DM Serif Display', serif", color: accentC.text, letterSpacing: "-1px", width: 200, textAlign: "center" }}
            />
          </div>
        )}
      </div>
      {isMobile && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, maxWidth: 360, margin: "0 auto", width: "100%" }}>
          {numpadKeys.map(k => (
            <button key={k} onClick={() => handleIncome(k)} style={{ padding: "18px", borderRadius: 16, border: "none", background: accentC.surfaceAlt, color: accentC.text, fontSize: 20, fontWeight: 600, cursor: "pointer" }}
            onMouseDown={e => e.currentTarget.style.transform = "scale(0.93)"}
            onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
            >{k}</button>
          ))}
        </div>
      )}
      <button disabled={!income} onClick={() => setStep(2)} style={{
        padding: "15px", background: income ? accentC.accent : accentC.surfaceAlt,
        color: income ? "white" : accentC.textMuted, border: "none", borderRadius: 16,
        fontSize: 16, fontWeight: 700, cursor: income ? "pointer" : "not-allowed",
        maxWidth: 360, width: "100%", margin: "0 auto",
        boxShadow: income ? `0 8px 24px ${accentC.accentGlow}` : "none",
      }}>Continue →</button>
    </div>,

    <div key="s2" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", padding: 40, gap: 24, animation: `slideUp 400ms ${springs.bounce}` }}>
      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontFamily: "\'DM Serif Display\', serif", fontSize: 30, color: accentC.text, letterSpacing: "-0.5px", marginBottom: 8 }}>Let's set up your budget.</h2>
        <p style={{ fontSize: 14, color: accentC.textMuted }}>Adjust the suggested amounts to match your life.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, maxWidth: 600, margin: "0 auto", width: "100%" }}>
        {Object.entries(suggestedBudgets).map(([cat, pct]) => {
          const suggested = Math.round(inc * pct);
          return (
            <div key={cat} style={{ background: accentC.surface, borderRadius: 16, padding: "16px", border: `1px solid ${accentC.border}` }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: accentC.text, marginBottom: 8 }}>{cat}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: accentC.textMuted }}>{currency}</span>
                <input defaultValue={suggested} style={{ flex: 1, background: accentC.surfaceAlt, border: `1px solid ${accentC.border}`, borderRadius: 8, padding: "6px 10px", fontSize: 14, color: accentC.text, outline: "none", width: "100%" }} />
              </div>
            </div>
          );
        })}
      </div>
      <button onClick={() => setStep(3)} style={{
        padding: "15px", background: accentC.accent, color: "white", border: "none", borderRadius: 16,
        fontSize: 16, fontWeight: 700, cursor: "pointer", maxWidth: 600, width: "100%", margin: "0 auto",
        boxShadow: `0 8px 24px ${accentC.accentGlow}`,
      }}>Looks good →</button>
    </div>,

    <div key="s3" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, gap: 32, animation: `slideUp 400ms ${springs.bounce}` }}>
      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontFamily: "\'DM Serif Display\', serif", fontSize: 36, color: C.text, letterSpacing: "-1px", marginBottom: 8 }}>Make it yours.</h2>
        <p style={{ fontSize: 15, color: C.textSub }}>Pick a color. Choose your vibe.</p>
      </div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
        {accentOptions.map(a => (
          <button key={a.name} onClick={() => setAccent(a)} style={{
            width: accent.value === a.value ? 52 : 44, height: accent.value === a.value ? 52 : 44,
            borderRadius: "50%", border: accent.value === a.value ? "3px solid white" : "none",
            background: a.value, cursor: "pointer",
            boxShadow: accent.value === a.value ? `0 0 20px ${a.glow}` : "none",
            transition: `all 300ms ${springs.bounce}`,
          }} />
        ))}
      </div>
      <div style={{ display: "flex", background: C.surfaceAlt, borderRadius: 14, padding: 4, gap: 4 }}>
        {["dark","light"].map(t => (
          <button key={t} onClick={() => setTheme(t)} style={{
            padding: "10px 24px", borderRadius: 10, border: "none", cursor: "pointer",
            background: theme === t ? C.surface : "transparent",
            color: theme === t ? C.text : C.textMuted, fontSize: 14, fontWeight: 600,
            boxShadow: theme === t ? C.shadow : "none",
          }}>{t === "dark" ? "🌙 Dark" : "☀️ Light"}</button>
        ))}
      </div>
      <button onClick={() => onComplete({ name, income: parseFloat(income) || 4200, currency, accent, theme })} style={{
        padding: "15px 48px", background: accent.value, color: "white", border: "none", borderRadius: 16,
        fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: `0 8px 24px ${accent.glow}`,
      }}>Enter Cove →</button>
    </div>,
  ];

  return (
    <div style={{ background: C.background, minHeight: "100vh" }}>
      <GlobalStyles C={C} />
      {slides[step]}
      <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 8 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ width: i === step ? 24 : 8, height: 8, borderRadius: 99, background: i === step ? accent.value : C.border, transition: `all 300ms ${springs.bounce}` }} />
        ))}
      </div>
    </div>
  );
}
