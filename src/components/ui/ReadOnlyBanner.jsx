import { springs } from "../../tokens/springs";

export default function ReadOnlyBanner({ year, C }) {
  const currentYear = new Date().getFullYear();
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      background: C.warning + "14",
      border: `1px solid ${C.warning + "44"}`,
      borderRadius: 14, padding: "11px 16px",
      fontSize: 13, color: C.warning, fontWeight: 500,
      animation: `slideUp 280ms ${springs.bounce} both`,
    }}>
      <span style={{ fontSize: 16 }}>📅</span>
      Viewing {year} — read only. Switch to {currentYear} to make changes.
    </div>
  );
}
