import { useState, useEffect } from "react";
import { springs } from "../tokens/springs";
import SlidePanel from "../components/ui/SlidePanel";
import Label from "../components/ui/Label";

export default function AddTransactionPanel({ onClose, onSave, categories, setCategories, user, C, fxRates = {}, templates = [], onSaveTemplates }) {
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [catId, setCatId] = useState(null);
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [recurring, setRecurring] = useState(false);
  const [freq, setFreq] = useState("monthly");
  const [selectedCurrency, setSelectedCurrency] = useState(user.currency);
  const [customRate, setCustomRate] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showTemplates, setShowTemplates] = useState(false);

  // Quick-create income category state
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("💰");

  // Split state
  const [splitMode, setSplitMode] = useState(false);
  const [splitCatA, setSplitCatA] = useState(null);
  const [splitCatB, setSplitCatB] = useState(null);
  const [splitPct, setSplitPct] = useState(50); // % going to catA

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // When currency changes, prefill stored rate or fetch live
  useEffect(() => {
    if (selectedCurrency === user.currency) { setCustomRate(""); return; }
    if (fxRates[selectedCurrency]) {
      setCustomRate(String(fxRates[selectedCurrency]));
    } else {
      // Fetch live rate for this currency pair
      setCustomRate("loading");
      fetch(`https://open.er-api.com/v6/latest/${user.currency}`)
        .then(r => r.json())
        .then(d => {
          if (d.rates?.[selectedCurrency]) {
            const liveRate = parseFloat((1 / d.rates[selectedCurrency]).toFixed(6));
            setCustomRate(String(liveRate));
          } else {
            setCustomRate("");
          }
        })
        .catch(() => setCustomRate(""));
    }
  }, [selectedCurrency]);

  const availableCurrencies = [user.currency, ...Object.keys(fxRates).filter(c => c !== user.currency && c !== "_updatedAt")];
  const isForeign = selectedCurrency !== user.currency;
  const isLoadingRate = customRate === "loading";
  const rate = isForeign ? (isLoadingRate ? 0 : (parseFloat(customRate) || fxRates[selectedCurrency] || 1)) : 1;
  const parsedAmount = parseFloat(amount) || 0;
  const baseAmount = isForeign ? parsedAmount * rate : parsedAmount;

  const numpad = ["1","2","3","4","5","6","7","8","9",".","0","⌫"];
  const handleNum = k => {
    if (k === "⌫") setAmount(a => a.slice(0,-1));
    else if (k === "." && amount.includes(".")) return;
    else if (amount.length > 9) return;
    else setAmount(a => a + k);
  };

  const canSave = parsedAmount > 0 && (splitMode ? (splitCatA && splitCatB && splitCatA !== splitCatB) : catId);

  const applyTemplate = (tpl) => {
    setType(tpl.type);
    setCatId(tpl.categoryId);
    setNote(tpl.note || "");
    if (tpl.amount) setAmount(String(tpl.amount));
    setShowTemplates(false);
  };

  const saveAsTemplate = () => {
    if (!catId) return;
    const cat = categories.find(c => c.id === catId);
    const tpl = {
      id: `tpl${Date.now()}`,
      type, categoryId: catId,
      note: note.trim(),
      amount: parsedAmount > 0 ? parsedAmount : null,
      icon: cat?.icon || "💸",
      label: note.trim() || cat?.name || type,
    };
    onSaveTemplates && onSaveTemplates([...templates, tpl]);
  };

  const deleteTemplate = (id) => {
    onSaveTemplates && onSaveTemplates(templates.filter(t => t.id !== id));
  };

  const handleSave = () => {
    const totalBase = isForeign ? baseAmount : parsedAmount;
    if (splitMode && splitCatA && splitCatB) {
      const amtA = parseFloat((totalBase * splitPct / 100).toFixed(2));
      const amtB = parseFloat((totalBase - amtA).toFixed(2));
      const catAObj = categories.find(c => c.id === splitCatA);
      const catBObj = categories.find(c => c.id === splitCatB);
      onSave({
        id: `t${Date.now()}`, categoryId: splitCatA,
        amount: amtA, type, note: note ? `${note} (split ${splitPct}%)` : `Split with ${catBObj?.name || ""} (${splitPct}%)`,
        date, isRecurring: false,
        originalCurrency: isForeign ? selectedCurrency : null,
        originalAmount: isForeign ? parsedAmount * splitPct / 100 : null,
        exchangeRate: isForeign ? rate : 1,
      });
      onSave({
        id: `t${Date.now() + 1}`, categoryId: splitCatB,
        amount: amtB, type, note: note ? `${note} (split ${100 - splitPct}%)` : `Split with ${catAObj?.name || ""} (${100 - splitPct}%)`,
        date, isRecurring: false,
        originalCurrency: isForeign ? selectedCurrency : null,
        originalAmount: isForeign ? parsedAmount * (100 - splitPct) / 100 : null,
        exchangeRate: isForeign ? rate : 1,
      });
    } else {
      onSave({
        id: `t${Date.now()}`, categoryId: catId,
        amount: totalBase, type, note, date, isRecurring: recurring,
        originalCurrency: isForeign ? selectedCurrency : null,
        originalAmount: isForeign ? parsedAmount : null,
        exchangeRate: isForeign ? rate : 1,
      });
    }
    onClose();
  };

  return (
    <SlidePanel onClose={onClose} C={C} title="Log Transaction">
      {/* Templates bar */}
      {templates.length > 0 && (
        <div style={{ padding: "12px 28px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: showTemplates ? 10 : 0 }}>
            <button onClick={() => setShowTemplates(s => !s)} style={{
              padding: "6px 14px", borderRadius: 99, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
              background: showTemplates ? C.accent : C.surfaceAlt,
              color: showTemplates ? "white" : C.textSub,
              transition: `all 150ms ${springs.snap}`,
            }}>⚡ Templates ({templates.length})</button>
          </div>
          {showTemplates && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, animation: `slideUp 150ms ${springs.snap}` }}>
              {templates.map(tpl => (
                <div key={tpl.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <button onClick={() => applyTemplate(tpl)} style={{
                    padding: "7px 12px", borderRadius: 99, border: `1px solid ${C.border}`,
                    background: C.surface, color: C.text, cursor: "pointer", fontSize: 13,
                    display: "flex", alignItems: "center", gap: 5,
                  }}>
                    <span>{tpl.icon}</span>{tpl.label}{tpl.amount ? ` · ${user.currency} ${tpl.amount}` : ""}
                  </button>
                  <button onClick={() => deleteTemplate(tpl.id)} style={{
                    width: 20, height: 20, borderRadius: "50%", border: "none",
                    background: C.expenseSoft, color: C.expense, cursor: "pointer", fontSize: 10,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* Type toggle */}
      <div style={{ padding: "20px 28px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", background: C.surfaceAlt, borderRadius: 12, padding: 4, gap: 4 }}>
          {["expense","income"].map(t => (
            <button key={t} onClick={() => { setType(t); setCatId(null); }} style={{
              flex: 1, padding: "9px", borderRadius: 10, border: "none", cursor: "pointer",
              background: type === t ? (t === "income" ? C.income : C.expense) : "transparent",
              color: type === t ? "white" : C.textSub,
              fontSize: 13, fontWeight: 600, textTransform: "capitalize",
              transition: `all 200ms ${springs.snap}`,
            }}>{t}</button>
          ))}
        </div>
      </div>

      {/* Currency selector (shown when multiple currencies available) */}
      {availableCurrencies.length > 1 && (
        <div style={{ padding: "12px 28px 0", display: "flex", gap: 8, flexWrap: "wrap" }}>
          {availableCurrencies.map(c => (
            <button key={c} onClick={() => setSelectedCurrency(c)} style={{
              padding: "5px 12px", borderRadius: 99, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700,
              background: selectedCurrency === c ? C.accent : C.surfaceAlt,
              color: selectedCurrency === c ? "white" : C.textSub,
              transition: `all 150ms ${springs.snap}`,
            }}>{c}</button>
          ))}
        </div>
      )}

      {/* Amount */}
      {isMobile ? (
        <div style={{ padding: "24px 28px 16px", textAlign: "center", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 52, letterSpacing: "-2px", color: amount ? C.text : C.textMuted, minHeight: 62 }}>
            {amount ? `${selectedCurrency} ${amount}` : `${selectedCurrency} 0.00`}
          </div>
          {isForeign && parsedAmount > 0 && (
            <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>
              = {user.currency} {baseAmount.toFixed(2)}
              {customRate && <span style={{ marginLeft: 6, color: C.accent }}>@ {rate}</span>}
            </div>
          )}
        </div>
      ) : (
        <div style={{ padding: "20px 28px", borderBottom: `1px solid ${C.border}` }}>
          <Label C={C} style={{ marginBottom: 8 }}>Amount</Label>
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.surfaceAlt, borderRadius: 14, padding: "12px 16px", border: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: C.textMuted }}>{selectedCurrency}</span>
            <input
              autoFocus
              type="number" min="0" step="0.01" placeholder="0.00"
              value={amount} onChange={e => setAmount(e.target.value)}
              onKeyDown={e => e.key === "Enter" && canSave && handleSave()}
              style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 28, fontFamily: "'DM Serif Display', serif", color: C.text, letterSpacing: "-1px", width: "100%" }}
            />
          </div>
          {/* FX rate + converted amount */}
          {isForeign && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, padding: "10px 14px", background: C.accentSoft, borderRadius: 12, border: `1px solid ${C.accent}22` }}>
              <span style={{ fontSize: 12, color: C.textMuted, flex: 1 }}>1 {selectedCurrency} =</span>
              {isLoadingRate ? (
                <span style={{ fontSize: 12, color: C.textMuted, fontStyle: "italic" }}>Fetching rate…</span>
              ) : (
                <input
                  type="number" min="0" step="0.0001" placeholder="rate"
                  value={customRate} onChange={e => setCustomRate(e.target.value)}
                  style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "5px 9px", fontSize: 13, color: C.text, outline: "none", width: 100, textAlign: "right", fontFamily: "'DM Mono', monospace" }}
                />
              )}
              <span style={{ fontSize: 12, color: C.textMuted }}>{user.currency}</span>
              {parsedAmount > 0 && rate > 0 && (
                <span style={{ fontSize: 13, fontWeight: 700, color: C.accent, marginLeft: 4 }}>→ {user.currency} {baseAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mobile: FX rate row */}
      {isMobile && isForeign && (
        <div style={{ padding: "10px 28px 0", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, color: C.textMuted }}>Rate: 1 {selectedCurrency} =</span>
          <input
            type="number" min="0" step="0.01" placeholder="rate"
            value={customRate} onChange={e => setCustomRate(e.target.value)}
            style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: "5px 9px", fontSize: 13, color: C.text, outline: "none", width: 90, textAlign: "right", fontFamily: "'DM Mono', monospace" }}
          />
          <span style={{ fontSize: 12, color: C.textMuted }}>{user.currency}</span>
        </div>
      )}

      {/* Category — normal or split */}
      <div style={{ padding: "16px 28px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <Label C={C}>Category</Label>
          {type === "expense" && (
            <button onClick={() => { setSplitMode(s => !s); setSplitCatA(null); setSplitCatB(null); setSplitPct(50); }} style={{
              padding: "5px 12px", borderRadius: 99, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
              background: splitMode ? C.accent : C.surfaceAlt,
              color: splitMode ? "white" : C.textSub,
              transition: `all 150ms ${springs.snap}`,
            }}>⚡ Split</button>
          )}
        </div>

        {splitMode ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Two category pickers */}
            {[
              { label: "First category", val: splitCatA, set: setSplitCatA, pct: splitPct },
              { label: "Second category", val: splitCatB, set: setSplitCatB, pct: 100 - splitPct },
            ].map(({ label, val, set, pct }) => {
              const totalBase = isForeign ? baseAmount : parsedAmount;
              const catAmt = parseFloat((totalBase * pct / 100).toFixed(2));
              return (
                <div key={label}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: C.textMuted, fontWeight: 600 }}>{label}</span>
                    {parsedAmount > 0 && (
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.accent, fontFamily: "'DM Mono', monospace" }}>
                        {user.currency} {catAmt.toLocaleString()} ({pct}%)
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                    {categories.filter(c => !c.is_income).map(cat => (
                      <button key={cat.id} onClick={() => set(cat.id)} style={{
                        padding: "6px 12px", borderRadius: 99,
                        border: `1px solid ${val === cat.id ? cat.color + "60" : "transparent"}`,
                        background: val === cat.id ? cat.color + "22" : C.surfaceAlt,
                        color: val === cat.id ? cat.color : C.textSub,
                        fontSize: 12, fontWeight: 500, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 4,
                        opacity: (label === "Second category" && cat.id === splitCatA) ? 0.3 : 1,
                        transition: `all 150ms ${springs.snap}`,
                      }}>
                        <span>{cat.icon}</span>{cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Split slider */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: C.textMuted }}>Split ratio</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.text, fontFamily: "'DM Mono', monospace" }}>{splitPct}% / {100 - splitPct}%</span>
              </div>
              <input type="range" min={5} max={95} step={5} value={splitPct}
                onChange={e => setSplitPct(Number(e.target.value))}
                style={{ width: "100%", accentColor: C.accent, cursor: "pointer" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <span style={{ fontSize: 11, color: C.textMuted }}>{categories.find(c => c.id === splitCatA)?.icon} {categories.find(c => c.id === splitCatA)?.name || "Category 1"}</span>
                <span style={{ fontSize: 11, color: C.textMuted }}>{categories.find(c => c.id === splitCatB)?.name || "Category 2"} {categories.find(c => c.id === splitCatB)?.icon}</span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {categories
              .filter(cat => type === "income" ? cat.is_income : !cat.is_income)
              .map(cat => (
                <button key={cat.id} onClick={() => setCatId(cat.id)} style={{
                  padding: "7px 13px", borderRadius: 99,
                  border: `1px solid ${catId === cat.id ? cat.color + "60" : "transparent"}`,
                  background: catId === cat.id ? cat.color + "22" : C.surfaceAlt,
                  color: catId === cat.id ? cat.color : C.textSub,
                  fontSize: 13, fontWeight: 500, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 5,
                  transition: `all 200ms ${springs.snap}`,
                }}>
                  <span>{cat.icon}</span>{cat.name}
                </button>
              ))}

            {/* Quick-create income category */}
            {type === "income" && setCategories && !showNewCat && (
              <button onClick={() => setShowNewCat(true)} style={{
                padding: "7px 13px", borderRadius: 99,
                border: `1px dashed ${C.income}50`,
                background: "transparent", color: C.income,
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 5,
                transition: `all 200ms ${springs.snap}`,
              }}>+ New category</button>
            )}

            {type === "income" && showNewCat && (
              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8, background: C.surfaceAlt, borderRadius: 14, padding: "12px 14px", border: `1px solid ${C.income}40`, marginTop: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.income, marginBottom: 2 }}>New income category</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    autoFocus
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    placeholder="Category name..."
                    onKeyDown={e => {
                      if (e.key === "Enter" && newCatName.trim()) {
                        const id = crypto.randomUUID();
                        setCategories(cats => [...cats, { id, name: newCatName.trim(), icon: newCatIcon, color: "#34C759", budget: 0, group: "Income", rollover: false, is_income: true }]);
                        setCatId(id);
                        setShowNewCat(false);
                        setNewCatName("");
                        setNewCatIcon("💰");
                      }
                      if (e.key === "Escape") { setShowNewCat(false); setNewCatName(""); }
                    }}
                    style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 12px", fontSize: 14, color: C.text, outline: "none" }}
                  />
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {["💰","💼","💻","🏪","🎁","📦","🌱","🤝","🏠","🚗"].map(em => (
                    <button key={em} onClick={() => setNewCatIcon(em)} style={{
                      width: 32, height: 32, borderRadius: 8, fontSize: 16, cursor: "pointer",
                      background: newCatIcon === em ? C.income + "30" : C.surface,
                      border: `2px solid ${newCatIcon === em ? C.income : "transparent"}`,
                    }}>{em}</button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => {
                    if (newCatName.trim()) {
                      const id = crypto.randomUUID();
                      setCategories(cats => [...cats, { id, name: newCatName.trim(), icon: newCatIcon, color: "#34C759", budget: 0, group: "Income", rollover: false, is_income: true }]);
                      setCatId(id);
                      setShowNewCat(false);
                      setNewCatName("");
                      setNewCatIcon("💰");
                    }
                  }} style={{ flex: 1, padding: "9px", background: C.income, color: "white", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "inherit" }}>
                    Add category
                  </button>
                  <button onClick={() => { setShowNewCat(false); setNewCatName(""); }} style={{ padding: "9px 16px", background: C.surface, color: C.textSub, border: "none", borderRadius: 10, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Note, date, recurring */}
      <div style={{ padding: "14px 28px", borderBottom: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 10 }}>
        <input value={note} onChange={e => setNote(e.target.value)} placeholder={splitMode ? "Add a note (applies to both splits)..." : "Add a note..."}
          style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: "11px 14px", fontSize: 14, color: C.text, outline: "none", width: "100%" }} />
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: "11px 14px", fontSize: 14, color: C.text, outline: "none", width: "100%", colorScheme: "dark" }} />
        {!splitMode && (
          <>
            <button onClick={() => setRecurring(r => !r)} style={{
              display: "flex", alignItems: "center", gap: 10, background: "none", border: "none",
              cursor: "pointer", color: C.textSub, fontSize: 14, padding: 0, textAlign: "left",
            }}>
              <div style={{ width: 40, height: 24, borderRadius: 99, background: recurring ? C.accent : C.surfaceAlt, position: "relative", transition: `background 200ms`, border: `1px solid ${C.border}` }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: "white", position: "absolute", top: 2, left: recurring ? 18 : 2, transition: `left 200ms ${springs.bounce}`, boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }} />
              </div>
              Repeat this transaction
            </button>
            {recurring && (
              <div style={{ display: "flex", gap: 8 }}>
                {["weekly","monthly","yearly"].map(f => (
                  <button key={f} onClick={() => setFreq(f)} style={{
                    padding: "7px 14px", borderRadius: 10, border: "none", cursor: "pointer",
                    background: freq === f ? C.accentSoft : C.surfaceAlt,
                    color: freq === f ? C.accent : C.textSub, fontSize: 13, fontWeight: 500, textTransform: "capitalize",
                  }}>{f}</button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Numpad — mobile only */}
      {isMobile && (
        <div style={{ padding: "14px 28px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {numpad.map(k => (
              <button key={k} onClick={() => handleNum(k)} style={{
                padding: "15px", borderRadius: 14, border: "none",
                background: C.surfaceAlt, color: C.text, fontSize: 18, fontWeight: 600, cursor: "pointer",
                transition: `transform 100ms ${springs.snap}`,
              }}
              onMouseDown={e => e.currentTarget.style.transform = "scale(0.93)"}
              onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
              >{k}</button>
            ))}
          </div>
        </div>
      )}

      {/* Save button */}
      <div style={{ padding: "8px 28px 28px" }}>
        <button disabled={!canSave} onClick={handleSave} style={{
          width: "100%", padding: "15px", borderRadius: 14, border: "none",
          background: canSave ? C.accent : C.surfaceAlt,
          color: canSave ? "white" : C.textMuted,
          fontSize: 15, fontWeight: 700, cursor: canSave ? "pointer" : "not-allowed",
          boxShadow: canSave ? `0 8px 24px ${C.accentGlow}` : "none",
          transition: `all 200ms ${springs.snap}`,
        }}>{splitMode ? "Save 2 Split Transactions" : "Save Transaction"}</button>
        {canSave && onSaveTemplates && (
          <button onClick={saveAsTemplate} style={{
            width: "100%", marginTop: 10, padding: "10px", borderRadius: 12, border: `1px dashed ${C.border}`,
            background: "transparent", color: C.textMuted, fontSize: 13, fontWeight: 500, cursor: "pointer",
          }}>⚡ Save as template</button>
        )}
      </div>
    </SlidePanel>
  );
}