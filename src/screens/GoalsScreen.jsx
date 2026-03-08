import { useState } from "react";
import { springs } from "../tokens/springs";
import { useCountUp } from "../hooks/useCountUp";
import GoalRing from "../components/ui/GoalRing";
import ProgressBar from "../components/ui/ProgressBar";
import Modal from "../components/ui/Modal";
import Label from "../components/ui/Label";


function GoalCard({ goal, i, user, C, onAddMoney, onTogglePause }) {
  const remaining = goal.target - goal.current;
  const deadline = goal.deadline ? new Date(goal.deadline) : null;
  const daysLeft = deadline ? Math.ceil((deadline - new Date()) / 86400000) : null;
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{
      background: C.surface, borderRadius: 22, padding: "24px",
      border: `1px solid ${hov ? C.borderStrong : C.border}`,
      boxShadow: hov ? C.shadowLg : C.shadow,
      transform: hov ? "translateY(-3px)" : "translateY(0)",
      transition: `all 200ms ${springs.snap}`,
      animation: `slideUp 300ms ${springs.bounce} both`, animationDelay: `${80 + i * 60}ms`,
      opacity: goal.paused ? 0.65 : 1,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <GoalRing current={goal.current} target={goal.target} color={goal.color} size={72} />
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontSize: 22 }}>{goal.icon}</div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 4 }}>{goal.name}</div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: C.textSub }}>
            {user.currency} {goal.current.toLocaleString()} / {user.currency} {goal.target.toLocaleString()}
          </div>
          {goal.completed && <span style={{ fontSize: 11, fontWeight: 600, color: C.income, background: C.incomeSoft, padding: "2px 8px", borderRadius: 99 }}>✓ Complete</span>}
          {goal.paused && <span style={{ fontSize: 11, fontWeight: 600, color: C.warning, background: C.warningSoft, padding: "2px 8px", borderRadius: 99 }}>Paused</span>}
        </div>
      </div>
      <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 16 }}>
        {remaining <= 0 ? "🎉 Goal reached!" :
          daysLeft !== null ? (daysLeft > 0 ? `${user.currency} ${remaining.toLocaleString()} to go · ${daysLeft} days left` : "⚠ Past deadline")
            : `${user.currency} ${remaining.toLocaleString()} to go`}
      </div>
      <ProgressBar value={goal.current} max={goal.target} color={goal.color} delay={100 + i * 60} C={C} height={6} />
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button onClick={() => onAddMoney(goal.id)} style={{
          flex: 1, padding: "10px", background: goal.color + "22", color: goal.color,
          border: `1px solid ${goal.color}40`, borderRadius: 12, cursor: "pointer", fontWeight: 600, fontSize: 13,
        }}>+ Add Money</button>
        <button onClick={onTogglePause} style={{
          padding: "10px 14px", background: C.surfaceAlt, color: C.textSub,
          border: "none", borderRadius: 12, cursor: "pointer", fontSize: 13,
        }}>{goal.paused ? "▶" : "⏸"}</button>
      </div>
    </div>
  );
}

export default function GoalsScreen({ goals, setGoals, user, C }) {
  const [addMoneyGoal, setAddMoneyGoal] = useState(null);
  const [addAmount, setAddAmount] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: "", icon: "🎯", target: "", deadline: "", color: C.accent });
  const totalSaved = goals.reduce((s, g) => s + g.current, 0);

  const savedNum = useCountUp(totalSaved, 700, 200, [totalSaved]);

  const addMoney = () => {
    const amt = parseFloat(addAmount);
    if (!amt || !addMoneyGoal) return;
    setGoals(gs => gs.map(g => g.id === addMoneyGoal ? { ...g, current: Math.min(g.current + amt, g.target) } : g));
    setAddMoneyGoal(null);
    setAddAmount("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", animation: `slideUp 300ms ${springs.bounce}` }}>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, color: C.text, letterSpacing: "-0.5px" }}>Savings Goals</h1>
        <button onClick={() => setShowNew(true)} style={{ padding: "10px 18px", background: C.accent, color: "white", border: "none", borderRadius: 12, cursor: "pointer", fontWeight: 700, fontSize: 14, boxShadow: `0 4px 16px ${C.accentGlow}` }}>+ New Goal</button>
      </div>

      <div style={{ background: C.surface, borderRadius: 20, padding: "22px 28px", border: `1px solid ${C.border}`, animation: `slideUp 300ms ${springs.bounce} both`, animationDelay: "40ms" }}>
        <Label C={C} style={{ marginBottom: 8 }}>Total Saved Across All Goals</Label>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 48, color: C.income, letterSpacing: "-1.5px" }}>{user.currency} {savedNum.toLocaleString()}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {goals.map((goal, i) => <GoalCard key={goal.id} goal={goal} i={i} user={user} C={C} onAddMoney={setAddMoneyGoal} onTogglePause={() => setGoals(gs => gs.map(g => g.id === goal.id ? { ...g, paused: !g.paused } : g))} />)}
      </div>

      {addMoneyGoal && (
        <Modal onClose={() => setAddMoneyGoal(null)} C={C} width={360}>
          <div style={{ padding: 28 }}>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: C.text, marginBottom: 20 }}>Add Money</h3>
            <input type="number" placeholder="Amount" value={addAmount} onChange={e => setAddAmount(e.target.value)}
              style={{ width: "100%", background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px", fontSize: 16, color: C.text, outline: "none", marginBottom: 14, textAlign: "center" }} />
            <button onClick={addMoney} style={{ width: "100%", padding: "13px", background: C.accent, color: "white", border: "none", borderRadius: 14, cursor: "pointer", fontWeight: 700, fontSize: 15, boxShadow: `0 8px 24px ${C.accentGlow}` }}>Save</button>
          </div>
        </Modal>
      )}

      {showNew && (
        <Modal onClose={() => setShowNew(false)} C={C} width={420}>
          <div style={{ padding: 28 }}>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: C.text, marginBottom: 20 }}>New Goal</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input placeholder="Goal name" value={newGoal.name} onChange={e => setNewGoal(g => ({ ...g, name: e.target.value }))}
                style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", fontSize: 14, color: C.text, outline: "none" }} />
              <input placeholder="Target amount" type="number" value={newGoal.target} onChange={e => setNewGoal(g => ({ ...g, target: e.target.value }))}
                style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", fontSize: 14, color: C.text, outline: "none" }} />
              <input type="date" value={newGoal.deadline} onChange={e => setNewGoal(g => ({ ...g, deadline: e.target.value }))}
                style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", fontSize: 14, color: C.text, outline: "none", colorScheme: "dark" }} />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["🎯","🏠","✈️","💻","🎓","🚗","💍","🏋️","🎮","🌍"].map(em => (
                  <button key={em} onClick={() => setNewGoal(g => ({ ...g, icon: em }))} style={{
                    width: 40, height: 40, borderRadius: 10, border: `2px solid ${newGoal.icon === em ? C.accent : "transparent"}`,
                    background: C.surfaceAlt, cursor: "pointer", fontSize: 20,
                  }}>{em}</button>
                ))}
              </div>
              <button onClick={() => {
                if (newGoal.name && newGoal.target) {
                  setGoals(gs => [...gs, { id: `g${Date.now()}`, name: newGoal.name, icon: newGoal.icon, target: parseFloat(newGoal.target), current: 0, deadline: newGoal.deadline, color: C.accent, paused: false, completed: false }]);
                  setShowNew(false);
                  setNewGoal({ name: "", icon: "🎯", target: "", deadline: "", color: C.accent });
                }
              }} style={{ padding: "13px", background: C.accent, color: "white", border: "none", borderRadius: 14, cursor: "pointer", fontWeight: 700, fontSize: 15, boxShadow: `0 8px 24px ${C.accentGlow}` }}>Create Goal</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DEBT SCREEN
// ─────────────────────────────────────────────────────────────────────────────