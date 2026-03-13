import { useState, useEffect } from "react";
import { springs } from "../tokens/springs";

const C = {
  bg: "#07070D",
  surface: "#0F0F18",
  surfaceAlt: "#16161F",
  border: "rgba(255,255,255,0.06)",
  borderStrong: "rgba(255,255,255,0.12)",
  text: "#F0F0F8",
  textSub: "rgba(240,240,248,0.5)",
  textMuted: "rgba(240,240,248,0.28)",
  accent: "#6366F1",
  accentGlow: "rgba(99,102,241,0.4)",
  accentSoft: "rgba(99,102,241,0.1)",
  income: "#34C759",
  expense: "#FF375F",
};

const FEATURES = [
  {
    icon: "✦",
    title: "Safe-to-spend",
    desc: "Know exactly how much you can spend right now. Income minus expenses — no guesswork.",
  },
  {
    icon: "📊",
    title: "Budget categories",
    desc: "Set limits per category. Cove tells you when you're approaching the edge before you cross it.",
  },
  {
    icon: "🏦",
    title: "Net worth tracking",
    desc: "Bank, mobile wallet, assets, debts — all in one place. Watch your wealth grow over time.",
  },
  {
    icon: "📱",
    title: "Built for mobile",
    desc: "Works offline, installs like an app, and feels native on your phone.",
  },
  {
    icon: "🔒",
    title: "Private by default",
    desc: "PIN lock, biometric access, and end-to-end data isolation. Your money data is yours alone.",
  },
  {
    icon: "✦",
    title: "Ask Cove AI",
    desc: "Chat with your finances. Ask anything — Cove answers with your real numbers, not generic advice.",
    accent: true,
  },
];

const STATS = [
  { value: "100%", label: "Your data" },
  { value: "0s", label: "Ads" },
  { value: "∞", label: "Transactions" },
];

function CoveLogo({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 18C3 15 6 12 12 12C18 12 21 15 21 18" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M12 12C12 8 9 5 6 6" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
      <path d="M12 12C12 7 15 4 18 6" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7"/>
    </svg>
  );
}

// Animated number ticker for the mock safe-to-spend
function MockDashboard() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      background: C.surface,
      borderRadius: 28,
      border: `1px solid ${C.borderStrong}`,
      padding: "28px 24px",
      boxShadow: `0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)`,
      maxWidth: 340,
      margin: "0 auto",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(24px)",
      transition: `all 700ms ${springs.bounce}`,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg, ${C.accent}, #818CF8)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 16px ${C.accentGlow}` }}>
            <CoveLogo size={16} />
          </div>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: C.text }}>Cove</span>
        </div>
        <div style={{ fontSize: 11, color: C.textMuted, background: C.surfaceAlt, padding: "4px 10px", borderRadius: 99, border: `1px solid ${C.border}` }}>March 2025</div>
      </div>

      {/* Safe to spend */}
      <div style={{ background: `linear-gradient(135deg, ${C.accent}, #818CF8)`, borderRadius: 20, padding: "24px 22px", marginBottom: 16, boxShadow: `0 16px 40px ${C.accentGlow}` }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Safe to spend</div>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 44, color: "white", letterSpacing: "-1.5px", lineHeight: 1 }}>GHS 2,340</div>
        <div style={{ marginTop: 16, height: 5, background: "rgba(255,255,255,0.2)", borderRadius: 99, overflow: "hidden" }}>
          <div style={{ height: "100%", width: "62%", background: "rgba(255,255,255,0.7)", borderRadius: 99, transition: `width 1s ${springs.smooth}` }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>62% of month left</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>38% spent</span>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[
          { label: "Total In", value: "GHS 4,200", color: C.income },
          { label: "Total Out", value: "GHS 1,860", color: C.expense },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, background: C.surfaceAlt, borderRadius: 14, padding: "12px 14px", border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Recent transactions */}
      <div style={{ background: C.surfaceAlt, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden" }}>
        {[
          { icon: "🛒", name: "Groceries", cat: "Food", amount: "-GHS 85", color: C.expense },
          { icon: "💼", name: "Salary", cat: "Income", amount: "+GHS 3,500", color: C.income },
          { icon: "📱", name: "Airtime", cat: "Utilities", amount: "-GHS 20", color: C.expense },
        ].map((tx, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", borderBottom: i < 2 ? `1px solid ${C.border}` : "none" }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: C.surface, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{tx.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{tx.name}</div>
              <div style={{ fontSize: 10, color: C.textMuted }}>{tx.cat}</div>
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 700, color: tx.color, flexShrink: 0 }}>{tx.amount}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LandingScreen({ onEnter }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [headerVisible, setHeaderVisible] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  useEffect(() => {
    const t1 = setTimeout(() => setHeaderVisible(true), 100);
    const t2 = setTimeout(() => setHeroVisible(true), 250);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", overflowX: "hidden", color: C.text, fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* Noise grain overlay */
        .grain::after {
          content: "";
          position: fixed;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 1;
          opacity: 0.4;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .cta-btn:hover {
          filter: brightness(1.1);
          transform: translateY(-2px) !important;
          box-shadow: 0 20px 60px rgba(99,102,241,0.5) !important;
        }
        .cta-btn:active {
          transform: translateY(0px) !important;
        }
        .feature-card:hover {
          border-color: rgba(99,102,241,0.3) !important;
          transform: translateY(-4px);
        }
      `}</style>

      {/* Ambient background glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{
          position: "absolute", top: "-20%", left: "50%", transform: "translateX(-50%)",
          width: 800, height: 800, borderRadius: "50%",
          background: `radial-gradient(circle, ${C.accentGlow} 0%, transparent 70%)`,
          animation: "pulse-glow 4s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute", bottom: "10%", right: "-10%",
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(52,199,89,0.08) 0%, transparent 70%)",
        }} />
      </div>

      <div style={{ position: "relative", zIndex: 2 }}>

        {/* Nav */}
        <nav style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: isMobile ? "20px 24px" : "24px 52px",
          borderBottom: `1px solid ${C.border}`,
          backdropFilter: "blur(20px)",
          background: "rgba(7,7,13,0.8)",
          position: "sticky", top: 0, zIndex: 100,
          opacity: headerVisible ? 1 : 0,
          transform: headerVisible ? "translateY(0)" : "translateY(-10px)",
          transition: `all 500ms ${springs.smooth}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg, ${C.accent}, #818CF8)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 16px ${C.accentGlow}` }}>
              <CoveLogo size={18} />
            </div>
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: C.text, letterSpacing: "-0.5px" }}>Cove</span>
          </div>
          <button onClick={onEnter} style={{
            padding: "9px 22px", background: "transparent",
            border: `1px solid ${C.borderStrong}`, borderRadius: 12,
            color: C.text, fontSize: 14, fontWeight: 600, cursor: "pointer",
            transition: `all 200ms ${springs.snap}`,
            fontFamily: "'DM Sans', sans-serif",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = C.accentSoft; e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = "#818CF8"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = C.borderStrong; e.currentTarget.style.color = C.text; }}
          >Sign in</button>
        </nav>

        {/* Hero */}
        <section style={{
          padding: isMobile ? "64px 24px 48px" : "100px 52px 80px",
          maxWidth: 1100, margin: "0 auto",
          display: "flex", flexDirection: isMobile ? "column" : "row",
          alignItems: "center", gap: isMobile ? 52 : 80,
        }}>
          {/* Left — copy */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: C.accentSoft, border: `1px solid rgba(99,102,241,0.25)`,
              borderRadius: 99, padding: "6px 14px", marginBottom: 28,
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? "translateY(0)" : "translateY(10px)",
              transition: `all 500ms ${springs.bounce}`,
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: C.accent, letterSpacing: "0.06em", textTransform: "uppercase" }}>Personal finance, reimagined</span>
            </div>

            <h1 style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: isMobile ? 48 : 68,
              lineHeight: 1.05, letterSpacing: "-2px",
              color: C.text, marginBottom: 24,
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? "translateY(0)" : "translateY(16px)",
              transition: `all 600ms ${springs.bounce} 80ms`,
            }}>
              Know exactly<br />
              <em style={{ color: C.accent }}>where you stand.</em>
            </h1>

            <p style={{
              fontSize: isMobile ? 16 : 18, color: C.textSub, lineHeight: 1.7,
              maxWidth: 460, marginBottom: 40,
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? "translateY(0)" : "translateY(16px)",
              transition: `all 600ms ${springs.bounce} 160ms`,
            }}>
              Cove calculates your safe-to-spend in real time — income minus expenses, always up to date. Budget smarter, save faster, stress less.
            </p>

            <div style={{
              display: "flex", gap: 12, flexWrap: "wrap",
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? "translateY(0)" : "translateY(16px)",
              transition: `all 600ms ${springs.bounce} 240ms`,
            }}>
              <button className="cta-btn" onClick={onEnter} style={{
                padding: "15px 36px",
                background: `linear-gradient(135deg, ${C.accent}, #818CF8)`,
                border: "none", borderRadius: 16,
                color: "white", fontSize: 16, fontWeight: 700, cursor: "pointer",
                boxShadow: `0 12px 40px ${C.accentGlow}`,
                transition: `all 250ms ${springs.bounce}`,
                fontFamily: "'DM Sans', sans-serif",
              }}>Get started free</button>
              <button onClick={onEnter} style={{
                padding: "15px 28px",
                background: "transparent",
                border: `1px solid ${C.borderStrong}`, borderRadius: 16,
                color: C.textSub, fontSize: 16, fontWeight: 500, cursor: "pointer",
                transition: `all 250ms ${springs.snap}`,
                fontFamily: "'DM Sans', sans-serif",
              }}
              onMouseEnter={e => { e.currentTarget.style.color = C.text; e.currentTarget.style.borderColor = C.accent + "60"; }}
              onMouseLeave={e => { e.currentTarget.style.color = C.textSub; e.currentTarget.style.borderColor = C.borderStrong; }}
              >Sign in →</button>
            </div>

            {/* Stats */}
            <div style={{
              display: "flex", gap: 32, marginTop: 52,
              paddingTop: 32, borderTop: `1px solid ${C.border}`,
              opacity: heroVisible ? 1 : 0,
              transition: `opacity 800ms ease 400ms`,
            }}>
              {STATS.map(s => (
                <div key={s.label}>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: C.text, letterSpacing: "-0.5px" }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — mock app */}
          <div style={{
            flex: isMobile ? "none" : "0 0 340px",
            width: isMobile ? "100%" : 340,
            animation: "float 6s ease-in-out infinite",
            animationDelay: "1s",
          }}>
            <MockDashboard />
          </div>
        </section>

        {/* Features grid */}
        <section style={{
          padding: isMobile ? "48px 24px" : "80px 52px",
          maxWidth: 1100, margin: "0 auto",
        }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: isMobile ? 36 : 48, color: C.text, letterSpacing: "-1px", marginBottom: 12 }}>
              Everything your money needs
            </h2>
            <p style={{ fontSize: 16, color: C.textSub, maxWidth: 480, margin: "0 auto" }}>
              Built for people who want to actually understand their finances — not just track them.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 16 }}>
            {FEATURES.map((f, i) => (
              <div key={i} className="feature-card" style={{
                background: f.accent ? C.accentSoft : C.surface,
                border: `1px solid ${f.accent ? "rgba(99,102,241,0.25)" : C.border}`,
                borderRadius: 20, padding: "28px 24px",
                transition: `all 250ms ${springs.snap}`,
                animation: `slideUp 400ms ${springs.bounce} both`,
                animationDelay: `${i * 60}ms`,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 13,
                  background: f.accent ? C.accent : C.surfaceAlt,
                  border: `1px solid ${f.accent ? "transparent" : C.borderStrong}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: f.icon === "✦" ? 18 : 22, color: f.accent ? "white" : C.text,
                  marginBottom: 18,
                  boxShadow: f.accent ? `0 8px 24px ${C.accentGlow}` : "none",
                }}>{f.icon}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: f.accent ? "#818CF8" : C.text, marginBottom: 8 }}>{f.title}</div>
                <div style={{ fontSize: 14, color: C.textSub, lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA footer */}
        <section style={{
          padding: isMobile ? "48px 24px 64px" : "80px 52px 100px",
          textAlign: "center",
        }}>
          <div style={{
            background: C.surface, border: `1px solid ${C.borderStrong}`,
            borderRadius: 32, padding: isMobile ? "48px 28px" : "72px 52px",
            maxWidth: 680, margin: "0 auto",
            position: "relative", overflow: "hidden",
          }}>
            {/* Glow behind */}
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: 400, height: 400, borderRadius: "50%",
              background: `radial-gradient(circle, ${C.accentGlow} 0%, transparent 70%)`,
              pointerEvents: "none",
            }} />

            <div style={{ position: "relative" }}>
              <div style={{ fontSize: 48, marginBottom: 20 }}>✦</div>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: isMobile ? 32 : 44, color: C.text, letterSpacing: "-1px", marginBottom: 16, lineHeight: 1.1 }}>
                Your finances,<br />finally under control.
              </h2>
              <p style={{ fontSize: 16, color: C.textSub, marginBottom: 36, lineHeight: 1.6, maxWidth: 400, margin: "0 auto 36px" }}>
                Free to use. No ads. No selling your data. Just a clean, honest view of your money.
              </p>
              <button className="cta-btn" onClick={onEnter} style={{
                padding: "16px 48px",
                background: `linear-gradient(135deg, ${C.accent}, #818CF8)`,
                border: "none", borderRadius: 16,
                color: "white", fontSize: 17, fontWeight: 700, cursor: "pointer",
                boxShadow: `0 12px 40px ${C.accentGlow}`,
                transition: `all 250ms ${springs.bounce}`,
                fontFamily: "'DM Sans', sans-serif",
              }}>Start for free →</button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div style={{ textAlign: "center", padding: "0 24px 40px", color: C.textMuted, fontSize: 13 }}>
          Built with care · No ads · No tracking
        </div>
      </div>
    </div>
  );
}
