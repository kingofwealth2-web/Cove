import { springs } from "../../tokens/springs";

export default function EmptyState({ icon, title, description, action, onAction, C, isReadOnly }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      textAlign: "center", padding: "48px 32px",
      background: C.surface, borderRadius: 24,
      border: `1px dashed ${C.border}`,
      animation: `slideUp 300ms ${springs.bounce} both`,
      animationDelay: "80ms",
    }}>
      <div style={{
        fontSize: 48, marginBottom: 20,
        filter: "grayscale(0.2)",
        animation: `slideUp 400ms ${springs.bounce} both`,
        animationDelay: "120ms",
      }}>{icon}</div>
      <h3 style={{
        fontFamily: "'DM Serif Display', serif",
        fontSize: 22, color: C.text, margin: "0 0 10px",
        letterSpacing: "-0.3px",
      }}>{title}</h3>
      <p style={{
        fontSize: 14, color: C.textMuted, margin: "0 auto 28px",
        lineHeight: 1.65, maxWidth: 300,
      }}>{description}</p>
      {action && onAction && !isReadOnly && (
        <button onClick={onAction} style={{
          padding: "12px 28px", background: C.accent, color: "white",
          border: "none", borderRadius: 14, cursor: "pointer",
          fontSize: 14, fontWeight: 700,
          boxShadow: `0 8px 24px ${C.accentGlow}`,
          transition: `all 200ms ${springs.snap}`,
        }}
        onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
        onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
        >{action}</button>
      )}
    </div>
  );
}