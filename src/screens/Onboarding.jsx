import { useState, useEffect } from "react";
import { darkColors, lightColors, accentOptions } from "../tokens/colors";
import { springs } from "../tokens/springs";
import GlobalStyles from "../components/ui/GlobalStyles";

const INCOME_TYPES = [
  { id: "salary",    label: "Salary",        icon: "💼", desc: "Regular employment pay" },
  { id: "freelance", label: "Freelance",      icon: "💻", desc: "Project-based work" },
  { id: "business",  label: "Business",       icon: "🏪", desc: "Running your own business" },
  { id: "hustle",    label: "Side Hustle",    icon: "⚡", desc: "Gigs, trading, reselling" },
  { id: "family",    label: "Family Support", icon: "🤝", desc: "From family or partner" },
  { id: "mixed",     label: "It varies",      icon: "🔀", desc: "Multiple or irregular sources" },
];

const CURRENCIES = ["GHS","USD","EUR","GBP","NGN","KES","ZAR","XOF","EGP","MAD"];

const ASSET_PRESETS = [
  { key: "bank",   label: "Bank Account",   icon: "🏦", type: "savings", desc: "Savings, current, or cheque account" },
  { key: "momo",   label: "Mobile Wallet",  icon: "📱", type: "cash",    desc: "MoMo, Vodafone Cash, Airtel Money, etc." },
  { key: "other",  label: "Other",          icon: "📦", type: "other",   desc: "Cash, crypto, or any other account" },
];

const DEBT_PRESETS = [
  { key: "loan",    label: "Bank / personal loan", icon: "📋", type: "loan" },
  { key: "credit",  label: "Credit card",          icon: "💳", type: "credit_card" },
  { key: "family",  label: "Family / friend debt", icon: "🤝", type: "other" },
];

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [incomeTypes, setIncomeTypes] = useState([]);
  const [currency, setCurrency] = useState("GHS");
  const [accent, setAccent] = useState(accentOptions[0]);
  const [theme, setTheme] = useState("dark");
  const [openingAssets, setOpeningAssets] = useState({});
  const [openingDebts,  setOpeningDebts]  = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const C = theme === "dark" ? darkColors : lightColors;
  const accentC = { ...C, accent: accent.value, accentSoft: accent.soft, accentGlow: accent.glow, accentDark: accent.dark };

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const toggleIncomeType = (id) => {
    setIncomeTypes(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // Build opening balance seed data for assets/liabilities tables
  const buildOpeningBalances = () => {
    const assets = ASSET_PRESETS
      .filter(p => parseFloat(openingAssets[p.key]) > 0)
      .map(p => ({ name: p.label, type: p.type, value: parseFloat(openingAssets[p.key]) }));
    const liabilities = DEBT_PRESETS
      .filter(p => parseFloat(openingDebts[p.key]) > 0)
      .map(p => ({ name: p.label, type: p.type, balance: parseFloat(openingDebts[p.key]) }));
    return { assets, liabilities };
  };

  const handleFinish = () => {
    onComplete({ name, incomeTypes, currency, accent, theme, openingBalances: buildOpeningBalances() });
  };

  const TOTAL_STEPS = 4;

  const slides = [
    // Step 0: Name + currency
    <div key="s0" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, gap: 32, animation: `slideUp 400ms ${springs.bounce}` }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 72, height: 72, background: `linear-gradient(135deg, ${accentC.accent}, ${accentC.accentDark || accentC.accent})`, borderRadius: 22, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", boxShadow: `0 12px 40px ${accentC.accentGlow}` }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <path d="M3 18C3 15 6 12 12 12C18 12 21 15 21 18" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M12 12C12 8 9 5 6 6" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
            <path d="M12 12C12 7 15 4 18 6" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
          </svg>
        </div>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 52, color: accentC.text, letterSpacing: "-2px", marginBottom: 12 }}>Hi, I'm Cove.</h1>
        <p style={{ fontSize: 18, color: accentC.textSub, lineHeight: 1.6 }}>Your personal money companion.</p>
      </div>
      <div style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", gap: 12 }}>
        <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="What's your name?"
          onKeyDown={e => e.key === "Enter" && name.trim() && setStep(1)}
          style={{ width: "100%", padding: "16px 20px", background: accentC.surfaceAlt, border: `1.5px solid ${accentC.border}`, borderRadius: 16, fontSize: 17, color: accentC.text, outline: "none", textAlign: "center" }}
          onFocus={e => e.target.style.borderColor = accentC.accent}
          onBlur={e => e.target.style.borderColor = accentC.border}
        />
        <select value={currency} onChange={e => setCurrency(e.target.value)}
          style={{ width: "100%", padding: "14px 20px", background: accentC.surfaceAlt, border: `1.5px solid ${accentC.border}`, borderRadius: 16, fontSize: 15, color: accentC.textSub, outline: "none", textAlign: "center" }}>
          {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <button disabled={!name.trim()} onClick={() => setStep(1)} style={{
        padding: "15px 48px", background: name.trim() ? accentC.accent : accentC.surfaceAlt,
        color: name.trim() ? "white" : accentC.textMuted, border: "none", borderRadius: 16,
        fontSize: 16, fontWeight: 700, cursor: name.trim() ? "pointer" : "not-allowed",
        boxShadow: name.trim() ? `0 8px 24px ${accentC.accentGlow}` : "none",
      }}>Continue →</button>
    </div>,

    // Step 1: How do you earn?
    <div key="s1" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", padding: isMobile ? "40px 24px" : "60px 40px", gap: 28, animation: `slideUp 400ms ${springs.bounce}`, maxWidth: 600, margin: "0 auto", width: "100%" }}>
      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: accentC.text, letterSpacing: "-0.5px", marginBottom: 8 }}>
          How do you earn money, {name}?
        </h2>
        <p style={{ fontSize: 14, color: accentC.textMuted }}>Pick all that apply. This helps us set up the right income categories.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr", gap: 12 }}>
        {INCOME_TYPES.map(type => {
          const selected = incomeTypes.includes(type.id);
          return (
            <button key={type.id} onClick={() => toggleIncomeType(type.id)} style={{
              padding: "18px 14px", borderRadius: 16, cursor: "pointer", textAlign: "center",
              border: `2px solid ${selected ? accentC.accent : accentC.border}`,
              background: selected ? accentC.accentSoft : accentC.surfaceAlt,
              transition: `all 200ms ${springs.snap}`,
              transform: selected ? "scale(1.03)" : "scale(1)",
            }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{type.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: selected ? accentC.accent : accentC.text, marginBottom: 4 }}>{type.label}</div>
              <div style={{ fontSize: 11, color: accentC.textMuted, lineHeight: 1.3 }}>{type.desc}</div>
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 10, maxWidth: 600, width: "100%", margin: "0 auto" }}>
        <button onClick={() => setStep(0)} style={{ padding: "14px 24px", background: "none", border: `1px solid ${accentC.border}`, borderRadius: 16, color: accentC.textSub, fontSize: 14, cursor: "pointer" }}>← Back</button>
        <button onClick={() => setStep(2)} style={{
          flex: 1, padding: "15px", background: accentC.accent, color: "white", border: "none", borderRadius: 16,
          fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: `0 8px 24px ${accentC.accentGlow}`,
        }}>{incomeTypes.length === 0 ? "Skip →" : "Continue →"}</button>
      </div>
    </div>,

    // Step 2: Personalize
    <div key="s2" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, gap: 32, animation: `slideUp 400ms ${springs.bounce}` }}>
      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, color: C.text, letterSpacing: "-1px", marginBottom: 8 }}>Make it yours.</h2>
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
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => setStep(1)} style={{ padding: "14px 24px", background: "none", border: `1px solid ${C.border}`, borderRadius: 16, color: C.textSub, fontSize: 14, cursor: "pointer" }}>← Back</button>
        <button onClick={() => setStep(3)} style={{
          padding: "15px 48px", background: accent.value, color: "white", border: "none", borderRadius: 16,
          fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: `0 8px 24px ${accent.glow}`,
        }}>Continue →</button>
      </div>
    </div>,

    // Step 3: Opening balances
    <div key="s3" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", padding: isMobile ? "40px 24px" : "60px 40px", gap: 24, animation: `slideUp 400ms ${springs.bounce}`, maxWidth: 560, margin: "0 auto", width: "100%" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🏦</div>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: accentC.text, letterSpacing: "-0.5px", marginBottom: 8 }}>
          Where's your money?
        </h2>
        <p style={{ fontSize: 14, color: accentC.textMuted, lineHeight: 1.6 }}>
          Add your current balances across your accounts. Cove uses this to track your net worth accurately from day one.
        </p>
      </div>

      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: accentC.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>My accounts</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {ASSET_PRESETS.map(p => {
            const val = parseFloat(openingAssets[p.key]) || 0;
            const filled = val > 0;
            return (
              <div key={p.key} style={{
                display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
                background: filled ? accentC.accentSoft : accentC.surfaceAlt,
                borderRadius: 16,
                border: `1.5px solid ${filled ? accentC.accent + "60" : accentC.border}`,
                transition: "all 200ms",
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                  background: filled ? accentC.accent + "20" : accentC.surface,
                  border: `1px solid ${filled ? accentC.accent + "40" : accentC.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                }}>{p.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: filled ? accentC.accent : accentC.text }}>{p.label}</div>
                  <div style={{ fontSize: 11, color: accentC.textMuted }}>{p.desc}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 13, color: accentC.textMuted, flexShrink: 0 }}>{currency}</span>
                  <input type="number" min="0" placeholder="0"
                    value={openingAssets[p.key] || ""}
                    onChange={e => setOpeningAssets(prev => ({ ...prev, [p.key]: e.target.value }))}
                    style={{ width: 110, padding: "8px 10px", background: accentC.surface, border: `1px solid ${accentC.border}`, borderRadius: 10, fontSize: 14, color: accentC.text, outline: "none", textAlign: "right" }}
                    onFocus={e => e.target.style.borderColor = accentC.accent}
                    onBlur={e => e.target.style.borderColor = accentC.border}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: accentC.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Money you owe</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {DEBT_PRESETS.map(p => (
            <div key={p.key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: accentC.surfaceAlt, borderRadius: 14, border: `1px solid ${openingDebts[p.key] ? "#FF375F40" : accentC.border}`, transition: "border-color 200ms" }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{p.icon}</span>
              <span style={{ flex: 1, fontSize: 14, color: accentC.text }}>{p.label}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 13, color: accentC.textMuted, flexShrink: 0 }}>{currency}</span>
                <input type="number" min="0" placeholder="0"
                  value={openingDebts[p.key] || ""}
                  onChange={e => setOpeningDebts(prev => ({ ...prev, [p.key]: e.target.value }))}
                  style={{ width: 110, padding: "8px 10px", background: accentC.surface, border: `1px solid ${accentC.border}`, borderRadius: 10, fontSize: 14, color: accentC.text, outline: "none", textAlign: "right" }}
                  onFocus={e => e.target.style.borderColor = "#FF375F"}
                  onBlur={e => e.target.style.borderColor = accentC.border}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => setStep(2)} style={{ padding: "14px 24px", background: "none", border: `1px solid ${accentC.border}`, borderRadius: 16, color: accentC.textSub, fontSize: 14, cursor: "pointer" }}>← Back</button>
        <button onClick={handleFinish} style={{
          flex: 1, padding: "15px", background: accentC.accent, color: "white", border: "none", borderRadius: 16,
          fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: `0 8px 24px ${accentC.accentGlow}`,
        }}>Enter Cove →</button>
      </div>
      <button onClick={handleFinish} style={{ background: "none", border: "none", fontSize: 13, color: accentC.textMuted, cursor: "pointer", padding: 4 }}>
        Skip — I'll add this later
      </button>
    </div>,
  ];

  return (
    <div style={{ background: C.background, minHeight: "100vh" }}>
      <GlobalStyles C={C} />
      {slides[step]}
      <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 8 }}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div key={i} style={{ width: i === step ? 24 : 8, height: 8, borderRadius: 99, background: i === step ? accent.value : C.border, transition: `all 300ms ${springs.bounce}` }} />
        ))}
      </div>
    </div>
  );
}