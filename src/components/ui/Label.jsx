export default function Label({ children, C, style = {} }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: C.textMuted, textTransform: "uppercase", ...style }}>
      {children}
    </div>
  );
}
