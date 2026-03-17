// === UI COMPONENTS — PART 2 ===
// This file assumes all data constants are defined above it:
// PEOPLE, SCENARIOS, ZALO_GROUPS, HAIKU_EXTRACTIONS, STORE_REGIONS, ALL_STORES, MAP_FILTERS,
// DIRECT_COVERAGE_METRICS, WIN_PLUS_METRICS, FINANCE_DATA

// ============================================================
// SHARED UI COMPONENTS
// ============================================================
const PersonChip = ({ personKey, onContact }) => {
  const p = PEOPLE[personKey]; if (!p) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#e2e8f0", borderRadius: 7, padding: "7px 9px", border: "1px solid #cbd5e1" }}>
      <div style={{ width: 28, height: 28, borderRadius: 6, background: "linear-gradient(135deg,#e2e8f0,#cbd5e1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#1e293b", fontFamily: "monospace", flexShrink: 0 }}>{p.avatar}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: "#1e293b", fontSize: 11, fontWeight: 600 }}>{p.name}</div>
        <div style={{ color: "#64748b", fontSize: 8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.role}</div>
      </div>
      {["📞","✉️","Z"].map((icon,i) => (
        <button key={i} onClick={() => onContact?.(["call","email","zalo"][i], p)} style={{
          width: 26, height: 26, borderRadius: 5, border: "1px solid #ffffff15", background: "#ffffff08",
          color: ["#4ade80","#60a5fa","#60a5fa"][i], fontSize: i===2?11:12, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", fontWeight: i===2?800:400, fontFamily: i===2?"monospace":"inherit",
        }}>{icon}</button>
      ))}
    </div>
  );
};

const ImpactBadge = ({ amount, label }) => amount ? (
  <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#dc262615", border: "1px solid #dc262633", borderRadius: 4, padding: "2px 7px", flexShrink: 0 }}>
    <span style={{ color: "#dc2626", fontSize: 12, fontWeight: 800, fontFamily: "monospace" }}>{amount}</span>
    <span style={{ color: "#f87171", fontSize: 8 }}>{label}</span>
  </div>
) : null;

// ============================================================
// TAB 1: DANNY QUERY — SourceCard
// ============================================================
const SourceCard = ({ source, delay, onDone }) => {
  const [phase, setPhase] = useState("hidden");
  const [vis, setVis] = useState(0);
  useEffect(() => {
    const t = [setTimeout(() => setPhase("scan"), delay), setTimeout(() => setPhase("load"), delay + 400)];
    source.items.forEach((_, i) => t.push(setTimeout(() => { setVis(i + 1); if (i === source.items.length - 1) setTimeout(() => { setPhase("done"); onDone?.(); }, 150); }, delay + 700 + i * 280)));
    return () => t.forEach(clearTimeout);
  }, []);
  if (phase === "hidden") return null;
  const newSourceTypes = ["supra", "direct_mch", "winplus", "plh", "finance"];
  const isNew = newSourceTypes.includes(source.type);
  return (
    <div style={{ background: "rgba(255,255,255,0.9)", border: `1px solid ${phase === "done" ? source.color + "44" : "#e2e8f0"}`, borderRadius: 8, padding: "9px 11px", marginBottom: 5, transition: "all 0.3s", opacity: phase === "scan" ? 0.5 : 1, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
        <span style={{ fontSize: 12 }}>{source.icon}</span>
        <span style={{ color: source.color, fontWeight: 700, fontSize: 10, fontFamily: "monospace" }}>{source.name}</span>
        {isNew && <span style={{ background: source.color + "22", color: source.color, fontSize: 7, padding: "1px 4px", borderRadius: 3, fontFamily: "monospace", fontWeight: 700 }}>NEW</span>}
        <span style={{ marginLeft: "auto", fontSize: 8, fontFamily: "monospace" }}>
          {phase === "done" ? <span style={{ color: "#4ade80" }}>✓ {source.items.length}</span> : <span style={{ color: "#fbbf24", animation: "pulse 1s infinite" }}>●</span>}
        </span>
      </div>
      {source.items.slice(0, vis).map((it, i) => (
        <div key={i} style={{ background: "#f1f5f9", borderRadius: 5, padding: "5px 8px", marginBottom: 2, borderLeft: `2px solid ${source.color}22`, animation: "fadeSlide 0.2s" }}>
          {source.type === "zalo" ? (<>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#94a3b8", fontSize: 8, fontFamily: "monospace" }}>{it.group}</span><span style={{ color: "#475569", fontSize: 7 }}>{it.time}</span></div>
            <div style={{ color: "#64748b", fontSize: 8 }}>{it.sender}</div>
            <div style={{ color: "#475569", fontSize: 10, lineHeight: 1.3 }}>{it.msg}</div>
          </>) : source.type === "email" ? (<>
            <div style={{ color: "#64748b", fontSize: 8 }}>{it.from}</div>
            <div style={{ color: "#1e293b", fontSize: 10, fontWeight: 600 }}>{it.subject}</div>
            <div style={{ color: "#94a3b8", fontSize: 9, fontStyle: "italic" }}>"{it.excerpt}"</div>
          </>) : (<>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#94a3b8", fontSize: 9 }}>{it.metric}</div>
                <div style={{ color: "#1e293b", fontSize: 11, fontWeight: 600 }}>{it.value}</div>
              </div>
              {it.delta && <div style={{ color: "#94a3b8", fontSize: 8 }}>{it.delta}</div>}
              <span style={{ background: ({ STOCKOUT:"#dc262622",ALERT:"#ea580c22",COMPETITOR:"#7c3aed22",BELOW:"#eab30822",DECLINING:"#eab30822",CRITICAL:"#dc262622",DEGRADED:"#dc262622",BOTTLENECK:"#ea580c22",DELAYED:"#dc262622",AVAILABLE:"#16a34a22",NORMAL:"#16a34a22",INEFFICIENT:"#eab30822",GROWING:"#16a34a22",STABLE:"#33415522",INSIGHT:"#2563eb22",CHURN:"#dc262622",QUALITY:"#dc262622",COVERAGE:"#2563eb22",PARTNER:"#0891b222",RURAL:"#16a34a22",URBAN:"#7c3aed22",COVENANT:"#dc262622",NWC:"#f59e0b22",CAPEX:"#06b6d422",PMF:"#16a34a22",FORECAST:"#2563eb22" })[it.flag] || "#33415522",
                color: ({ STOCKOUT:"#dc2626",ALERT:"#ea580c",COMPETITOR:"#7c3aed",BELOW:"#ca8a04",DECLINING:"#ca8a04",CRITICAL:"#dc2626",DEGRADED:"#dc2626",BOTTLENECK:"#ea580c",DELAYED:"#dc2626",AVAILABLE:"#16a34a",NORMAL:"#16a34a",INEFFICIENT:"#ca8a04",GROWING:"#16a34a",STABLE:"#94a3b8",INSIGHT:"#60a5fa",CHURN:"#dc2626",QUALITY:"#dc2626",COVERAGE:"#60a5fa",PARTNER:"#0891b2",RURAL:"#16a34a",URBAN:"#7c3aed",COVENANT:"#dc2626",NWC:"#f59e0b",CAPEX:"#06b6d4",PMF:"#16a34a",FORECAST:"#2563eb" })[it.flag] || "#94a3b8",
                fontSize: 7, padding: "1px 4px", borderRadius: 3, fontFamily: "monospace", fontWeight: 700, flexShrink: 0 }}>{it.flag}</span>
            </div>
            {it.detail && <div style={{ color: "#64748b", fontSize: 8, marginTop: 2 }}>{it.detail}</div>}
          </>)}
        </div>
      ))}
    </div>
  );
};

// ============================================================
// TAB 1: DANNY QUERY — AnswerBlock (with llm + finance action types)
// ============================================================
const AnswerBlock = ({ answer, delay, onContact, onAction, onNavigateMap }) => {
  const [vis, setVis] = useState(false);
  const [vp, setVp] = useState(0);
  const [sf, setSf] = useState(false);
  useEffect(() => {
    const t = [setTimeout(() => setVis(true), delay)];
    answer.points.forEach((_, i) => t.push(setTimeout(() => setVp(i + 1), delay + 400 + i * 1200)));
    t.push(setTimeout(() => setSf(true), delay + 400 + answer.points.length * 1200 + 400));
    return () => t.forEach(clearTimeout);
  }, []);
  if (!vis) return null;

  const getActionStyle = (type) => {
    const styles = {
      critical: { bg: "#dc262622", b: "#dc262666", t: "#dc2626" },
      warning: { bg: "#eab30822", b: "#eab30866", t: "#ca8a04" },
      normal: { bg: "#33415522", b: "#33415566", t: "#94a3b8" },
      llm: { bg: "linear-gradient(135deg,#2563eb22,#7c3aed22)", b: "#7c3aed66", t: "#7c3aed", flat: "#2563eb18" },
      finance: { bg: "#16a34a22", b: "#16a34a66", t: "#16a34a" },
    };
    return styles[type] || styles.normal;
  };

  return (
    <div style={{ background: "linear-gradient(135deg,#e8f0fe,#f0f4ff)", border: "1px solid #bfdbfe", borderRadius: 10, padding: "13px 15px", marginTop: 10, animation: "fadeSlide 0.4s", boxShadow: "0 2px 12px rgba(37,99,235,0.08)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <div style={{ width: 22, height: 22, borderRadius: 5, background: "linear-gradient(135deg,#2563eb,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff" }}>M</div>
        <span style={{ color: "#2563eb", fontWeight: 700, fontSize: 10, fontFamily: "monospace" }}>MasanEye — Synthesis</span>
      </div>
      <div style={{ color: "#1e293b", fontSize: 12, lineHeight: 1.4, marginBottom: 10 }}>{answer.summary}</div>
      {answer.points.slice(0, vp).map((p, i) => (
        <div key={i} style={{ background: "#f0f7ff", borderRadius: 7, padding: "10px 11px", marginBottom: 7, borderLeft: p.title.includes("🔴") ? "3px solid #ef4444" : p.title.includes("🟣") ? "3px solid #7c3aed" : "3px solid #eab308", animation: "fadeSlide 0.3s" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 6, marginBottom: 5 }}><div style={{ color: "#0f172a", fontSize: 11, fontWeight: 700 }}>{p.title}</div><ImpactBadge amount={p.impact} label={p.impactLabel} /></div>
          <div style={{ color: "#94a3b8", fontSize: 10, lineHeight: 1.5, marginBottom: 7 }}>{p.detail}</div>
          <div style={{ background: "#eff6ff", borderRadius: 5, padding: "5px 8px", color: "#1d4ed8", fontSize: 10, lineHeight: 1.4, marginBottom: 7, border: "1px solid #bfdbfe" }}>💡 {p.action}</div>
          {p.pic && <div style={{ marginBottom: 7 }}><div style={{ color: "#475569", fontSize: 7, fontFamily: "monospace", marginBottom: 2, fontWeight: 700 }}>PIC</div><PersonChip personKey={p.pic} onContact={onContact} /></div>}
          {p.actions && <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>{p.actions.map((a, j) => {
            const c = getActionStyle(a.type);
            const isLlm = a.type === "llm";
            return <button key={j} onClick={() => onAction?.(a.label, a.type, a.toastMsg)} style={{
              background: isLlm ? c.flat : c.bg, border: `1px solid ${c.b}`, borderRadius: 4, padding: "3px 8px",
              color: c.t, fontSize: 9, cursor: "pointer", fontFamily: "monospace", fontWeight: 600,
              backgroundImage: isLlm ? "linear-gradient(135deg,#2563eb15,#7c3aed20)" : "none",
            }}>{isLlm ? "🤖 " : a.type === "finance" ? "💰 " : "▶ "}{a.label}</button>;
          })}</div>}
        </div>
      ))}
      {sf && <div style={{ marginTop: 8, padding: "8px 10px", background: "#e2e8f0", borderRadius: 6, color: "#2563eb", fontSize: 11, lineHeight: 1.4, animation: "fadeSlide 0.3s" }}>{answer.footer}</div>}
      {sf && answer.entities && (
        <div style={{ background: "#f0f7ff", border: "1px solid #e2e8f0", borderRadius: 7, padding: "8px 10px", marginTop: 8 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
            <div style={{ color: "#475569", fontSize: 7, fontFamily: "monospace", fontWeight: 700 }}>ENTITIES</div>
            <button onClick={() => onNavigateMap?.("all_critical")} style={{ background: "#2563eb22", border: "1px solid #2563eb44", borderRadius: 4, padding: "2px 8px", color: "#60a5fa", fontSize: 8, fontFamily: "monospace", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 3, transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#2563eb44"; }} onMouseLeave={e => { e.currentTarget.style.background = "#2563eb22"; }}>
              <span style={{ fontSize: 9 }}>⬡</span> View on Store Map
            </button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{answer.entities.map((e, i) => {
            const sc2 = { critical: "#ef4444", warning: "#eab308", ok: "#22c55e" }[e.status];
            const icons = { dc: "🏭", truck: "🚛", supplier: "📦", competitor: "⚔️", gt: "🏪", product: "🏷️", store: "🏬", finance: "💰", coverage: "📊", winplus: "🏪" };
            const entityFilterMap = { gt: "all_warning", dc: "meatdeli_quality", competitor: e.name.toLowerCase().includes("magi") ? "competitor_magi" : e.name.toLowerCase().includes("meat") ? "competitor_meatplus" : e.name.toLowerCase().includes("circle") ? "circle_k" : "all_critical" };
            const clickFilter = entityFilterMap[e.type];
            return <div key={i} onClick={() => { if (clickFilter) onNavigateMap?.(clickFilter); }} style={{ display: "flex", alignItems: "center", gap: 3, background: "#f0f4ff", border: `1px solid ${sc2}33`, borderRadius: 4, padding: "2px 7px", cursor: clickFilter ? "pointer" : "default", transition: "all 0.15s" }}
              onMouseEnter={clickFilter ? (ev => { ev.currentTarget.style.borderColor = sc2 + "88"; ev.currentTarget.style.background = "#e2e8f0"; }) : undefined}
              onMouseLeave={clickFilter ? (ev => { ev.currentTarget.style.borderColor = sc2 + "33"; ev.currentTarget.style.background = "#f0f4ff"; }) : undefined}>
              <span style={{ fontSize: 9 }}>{icons[e.type] || "📋"}</span><span style={{ color: "#475569", fontSize: 9 }}>{e.name}</span><div style={{ width: 5, height: 5, borderRadius: 3, background: sc2 }} />
              {clickFilter && <span style={{ color: "#60a5fa", fontSize: 7, marginLeft: 2 }}>⬡</span>}
            </div>;
          })}</div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// TAB 2: ZALO + SUPRA INGESTION (updated enrichment labels)
// ============================================================
const ZaloGroupList = ({ groups, selectedId, onSelect }) => (
  <div style={{ width: 240, borderRight: "1px solid #e2e8f0", background: "#f1f5f9", overflow: "auto", flexShrink: 0 }}>
    <div style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <div style={{ width: 24, height: 24, borderRadius: 5, background: "#0068FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff" }}>Z</div>
        <div><div style={{ color: "#1e293b", fontSize: 12, fontWeight: 700 }}>Tr\u1ee3 l\u00fd Masan</div><div style={{ color: "#4ade80", fontSize: 8, fontFamily: "monospace" }}>\u25cf Monitoring</div></div>
      </div>
    </div>
    {groups.map(g => (
      <div key={g.id} onClick={() => onSelect(g.id)} style={{ padding: "8px 12px", cursor: "pointer", borderBottom: "1px solid #ffffff", background: selectedId === g.id ? "#e2e8f0" : "transparent", transition: "background 0.15s" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div style={{ width: 32, height: 32, borderRadius: 7, background: g.avatarColor + "22", border: `1px solid ${g.avatarColor}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: g.avatarColor, fontFamily: "monospace", flexShrink: 0 }}>{g.avatar}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "#1e293b", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.name}</div>
            <div style={{ color: "#475569", fontSize: 9, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.messages[g.messages.length - 1]?.msg.substring(0, 30)}...</div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

const ZaloChatView = ({ group }) => {
  const [vc, setVc] = useState(0);
  const ref = useRef(null);
  useEffect(() => { setVc(0); let c = 0; const iv = setInterval(() => { c++; setVc(c); if (c >= group.messages.length) clearInterval(iv); }, 160); return () => clearInterval(iv); }, [group.id]);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [vc]);
  const colors = ["#3b82f6","#ef4444","#22c55e","#f59e0b","#8b5cf6","#ec4899","#06b6d4","#f97316"];
  const gc = (n) => colors[n.length % colors.length];
  const gi = (n) => n.split(" ").slice(-2).map(w => w[0]).join("");
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#f8fafc" }}>
      <div style={{ padding: "8px 14px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 8, background: "#ffffff" }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: group.avatarColor + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: group.avatarColor, fontFamily: "monospace" }}>{group.avatar}</div>
        <div><div style={{ color: "#1e293b", fontSize: 12, fontWeight: 600 }}>{group.name}</div><div style={{ color: "#475569", fontSize: 9 }}>{group.memberCount} members</div></div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 3 }}><div style={{ width: 5, height: 5, borderRadius: 3, background: "#4ade80", animation: "pulse 2s infinite" }} /><span style={{ color: "#4ade80", fontSize: 8, fontFamily: "monospace" }}>REC</span></div>
      </div>
      <div ref={ref} style={{ flex: 1, overflow: "auto", padding: "10px 14px" }}>
        {group.messages.slice(0, vc).map((m, i) => (
          <div key={i} style={{ marginBottom: 6, animation: "fadeSlide 0.15s", display: "flex", gap: 7 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: gc(m.sender) + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, color: gc(m.sender), flexShrink: 0, marginTop: 2 }}>{gi(m.sender)}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginBottom: 1 }}>
                <span style={{ color: gc(m.sender), fontSize: 10, fontWeight: 600 }}>{m.sender}</span><span style={{ color: "#475569", fontSize: 8 }}>{m.role}</span><span style={{ color: "#94a3b8", fontSize: 8, marginLeft: "auto" }}>{m.time}</span>
              </div>
              <div style={{ color: "#475569", fontSize: 11, lineHeight: 1.3, fontStyle: m.type === "noise" ? "italic" : "normal" }}>{m.msg}</div>
              {m.type === "noise" && <span style={{ fontSize: 7, color: "#94a3b8", fontFamily: "monospace" }}>&#8856; NOISE</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProcessingPanel = ({ groupId }) => {
  const ext = HAIKU_EXTRACTIONS[groupId];
  const [phase, setPhase] = useState("idle");
  const [vs, setVs] = useState(0);
  useEffect(() => {
    if (!ext) return;
    setPhase("idle"); setVs(0);
    const t = [setTimeout(() => setPhase("proc"), 400), setTimeout(() => setPhase("extract"), 1800)];
    ext.signals.forEach((_, i) => t.push(setTimeout(() => setVs(i + 1), 2200 + i * 500)));
    t.push(setTimeout(() => setPhase("done"), 2200 + ext.signals.length * 500 + 300));
    return () => t.forEach(clearTimeout);
  }, [groupId]);

  if (!ext) return <div style={{ width: 320, background: "#f1f5f9", borderLeft: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 11 }}>Select group</div>;

  const uc = { critical: "#ef4444", high: "#f59e0b", medium: "#3b82f6", low: "#22c55e" };
  return (
    <div style={{ width: 320, background: "#f1f5f9", borderLeft: "1px solid #e2e8f0", overflow: "auto", flexShrink: 0 }}>
      <div style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
          <div style={{ width: 18, height: 18, borderRadius: 4, background: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#fff", fontWeight: 700 }}>H</div>
          <span style={{ color: "#16a34a", fontSize: 10, fontWeight: 700, fontFamily: "monospace" }}>Haiku + Direct MCH / Win+ Enrichment</span>
        </div>
        <div style={{ color: "#475569", fontSize: 9 }}>{ext.groupName} &#8226; {ext.messagesProcessed} msgs &#8226; {ext.noiseFiltered} noise</div>
        <div style={{ marginTop: 4, fontSize: 9, fontFamily: "monospace" }}>
          {phase === "proc" && <span style={{ color: "#fbbf24", animation: "pulse 1s infinite" }}>&#9679; PROCESSING...</span>}
          {phase === "extract" && <span style={{ color: "#fbbf24", animation: "pulse 1s infinite" }}>&#9679; EXTRACTING + ENRICHING...</span>}
          {phase === "done" && <span style={{ color: "#4ade80" }}>&#10003; {ext.signals.length} signals enriched</span>}
          {phase === "idle" && <span style={{ color: "#475569" }}>WAITING...</span>}
        </div>
      </div>
      <div style={{ padding: "8px 12px" }}>
        {ext.signals.slice(0, vs).map((s, i) => (
          <div key={i} style={{ background: "#ffffff", borderRadius: 6, padding: "8px 9px", marginBottom: 5, borderLeft: `3px solid ${uc[s.urgency]}`, animation: "fadeSlide 0.25s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
              <span style={{ color: uc[s.urgency], fontSize: 8, fontFamily: "monospace", fontWeight: 700 }}>{s.category}</span>
              <span style={{ marginLeft: "auto", background: uc[s.urgency] + "22", color: uc[s.urgency], fontSize: 7, padding: "1px 4px", borderRadius: 3, fontFamily: "monospace", fontWeight: 700 }}>{s.urgency.toUpperCase()}</span>
            </div>
            {s.store && <div style={{ color: "#64748b", fontSize: 8, fontFamily: "monospace" }}>{s.store}{s.sku ? ` &#8226; ${s.sku}` : ""}</div>}
            <div style={{ color: "#475569", fontSize: 10, lineHeight: 1.3, marginTop: 2 }}>{s.summary}</div>
            <div style={{ color: "#94a3b8", fontSize: 8, fontFamily: "monospace", marginTop: 2 }}>conf: {s.confidence}</div>
            {s.supraMatch && (
              <div style={{ marginTop: 4, padding: "4px 7px", background: "#06b6d411", border: "1px solid #06b6d433", borderRadius: 4 }}>
                <div style={{ color: "#06b6d4", fontSize: 7, fontFamily: "monospace", fontWeight: 700, marginBottom: 1 }}>&#127981; SUPRA ENRICHMENT</div>
                <div style={{ color: "#0891b2", fontSize: 9, lineHeight: 1.3 }}>{s.supraMatch}</div>
              </div>
            )}
            {s.directMchMatch && (
              <div style={{ marginTop: 4, padding: "4px 7px", background: "#2563eb11", border: "1px solid #2563eb33", borderRadius: 4 }}>
                <div style={{ color: "#2563eb", fontSize: 7, fontFamily: "monospace", fontWeight: 700, marginBottom: 1 }}>&#128202; DIRECT COVERAGE MCH</div>
                <div style={{ color: "#1d4ed8", fontSize: 9, lineHeight: 1.3 }}>{s.directMchMatch}</div>
              </div>
            )}
            {s.winPlusMatch && (
              <div style={{ marginTop: 4, padding: "4px 7px", background: "#0891b211", border: "1px solid #0891b233", borderRadius: 4 }}>
                <div style={{ color: "#0891b2", fontSize: 7, fontFamily: "monospace", fontWeight: 700, marginBottom: 1 }}>&#127978; WIN+ CHANNEL MATCH</div>
                <div style={{ color: "#0e7490", fontSize: 9, lineHeight: 1.3 }}>{s.winPlusMatch}</div>
              </div>
            )}
            {s.kiotMatch && (
              <div style={{ marginTop: 4, padding: "4px 7px", background: "#f59e0b11", border: "1px solid #f59e0b33", borderRadius: 4 }}>
                <div style={{ color: "#f59e0b", fontSize: 7, fontFamily: "monospace", fontWeight: 700, marginBottom: 1 }}>&#127978; GT DATA MATCH</div>
                <div style={{ color: "#b45309", fontSize: 9, lineHeight: 1.3 }}>{s.kiotMatch}</div>
              </div>
            )}
          </div>
        ))}
        {phase === "done" && (
          <div style={{ marginTop: 6, padding: "6px 8px", background: "#16a34a11", border: "1px solid #16a34a33", borderRadius: 5, animation: "fadeSlide 0.3s" }}>
            <div style={{ color: "#4ade80", fontSize: 9, fontFamily: "monospace", fontWeight: 600 }}>&#8594; Signals + enrichments &#8594; Postgres</div>
            <div style={{ color: "#22c55e", fontSize: 8, fontFamily: "monospace" }}>&#8594; Available for queries</div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// TAB 3: DIRECT COVERAGE MCH (replaces KiotVietTab)
// ============================================================
const DirectCoverageTab = ({ onAction }) => {
  const [feedVis, setFeedVis] = useState(0);
  useEffect(() => { let c = 0; const iv = setInterval(() => { c++; setFeedVis(c); if (c >= DIRECT_COVERAGE_METRICS.realtimeFeed.length) clearInterval(iv); }, 600); return () => clearInterval(iv); }, []);
  const flagColors = { CHURN: "#ef4444", COMPETITOR: "#7c3aed", QUALITY: "#ea580c", STOCKOUT: "#dc2626", GROWTH: "#16a34a", NEW_VISIT: "#0891b2", STABLE: "#94a3b8", LOW_STOCK: "#ca8a04", COVERAGE: "#2563eb", REACTIVATED: "#22c55e", LOST: "#dc2626" };
  const trendColors = { growing: "#4ade80", stable: "#94a3b8", declining: "#ef4444", strong: "#22c55e" };

  return (
    <div style={{ flex: 1, overflow: "auto", padding: "14px 20px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: "#2563eb22", border: "1px solid #2563eb44", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>&#128202;</div>
        <div>
          <div style={{ color: "#1e293b", fontSize: 16, fontWeight: 700 }}>Direct Coverage MCH &#8212; Internal Salesforce Data</div>
          <div style={{ color: "#2563eb", fontSize: 10, fontFamily: "monospace" }}>38,000 GT stores &#8226; Real-time field rep tracking &#8226; Internal data asset</div>
        </div>
      </div>

      {/* Overview metrics */}
      <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
        {[
          { label: "Total Stores", value: DIRECT_COVERAGE_METRICS.overview.totalStores, color: "#1e293b" },
          { label: "Active Stores", value: DIRECT_COVERAGE_METRICS.overview.activeStores, color: "#16a34a" },
          { label: "Avg Rev/Store", value: DIRECT_COVERAGE_METRICS.overview.avgRevPerStore, color: "#1e293b" },
          { label: "Data Freshness", value: DIRECT_COVERAGE_METRICS.overview.dataFreshness, color: "#4ade80" },
        ].map((m, i) => (
          <div key={i} style={{ flex: 1, background: "#ffffff", borderRadius: 6, padding: "8px 10px", textAlign: "center" }}>
            <div style={{ color: "#475569", fontSize: 8, fontFamily: "monospace", marginBottom: 2 }}>{m.label}</div>
            <div style={{ color: m.color, fontSize: 15, fontWeight: 800, fontFamily: "monospace" }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        {/* Left column: BU Performance + Area Performance */}
        <div style={{ flex: 1 }}>
          <div style={{ color: "#475569", fontSize: 9, fontFamily: "monospace", fontWeight: 700, marginBottom: 6 }}>BU PERFORMANCE &#8212; DIRECT COVERAGE</div>
          {DIRECT_COVERAGE_METRICS.buPerformance.map((bu, i) => {
            const achievePct = parseFloat(bu.achievement) || 0;
            const barColor = achievePct >= 95 ? "#22c55e" : achievePct >= 85 ? "#eab308" : "#ef4444";
            return (
              <div key={i} style={{ background: "#ffffff", borderRadius: 6, padding: "8px 10px", marginBottom: 4, borderLeft: `3px solid ${barColor}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ color: "#1e293b", fontSize: 11, fontWeight: 600 }}>{bu.name}</span>
                  <span style={{ color: barColor, fontSize: 10, fontFamily: "monospace", fontWeight: 700 }}>{bu.achievement}%</span>
                </div>
                <div style={{ display: "flex", gap: 12, color: "#94a3b8", fontSize: 9, marginBottom: 4 }}>
                  <span>Stores: <b style={{ color: "#1e293b" }}>{bu.stores}</b></span>
                  <span>Revenue: <b style={{ color: "#1e293b" }}>{bu.revenue}</b></span>
                  <span>Growth: <b style={{ color: bu.growth.includes("+") ? "#16a34a" : "#ef4444" }}>{bu.growth}</b></span>
                </div>
                <div style={{ background: "#f1f5f9", borderRadius: 3, height: 6, overflow: "hidden" }}>
                  <div style={{ background: barColor, height: "100%", width: `${Math.min(achievePct, 100)}%`, borderRadius: 3, transition: "width 0.5s" }} />
                </div>
              </div>
            );
          })}

          <div style={{ color: "#475569", fontSize: 9, fontFamily: "monospace", fontWeight: 700, marginBottom: 6, marginTop: 14 }}>AREA PERFORMANCE</div>
          {DIRECT_COVERAGE_METRICS.areaPerformance.map((area, i) => (
            <div key={i} style={{ background: "#ffffff", borderRadius: 6, padding: "8px 10px", marginBottom: 4, borderLeft: `3px solid ${area.status === "strong" ? "#22c55e" : area.status === "growing" ? "#4ade80" : area.status === "stable" ? "#94a3b8" : "#ef4444"}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ color: "#1e293b", fontSize: 11, fontWeight: 600 }}>{area.name}</span>
                <span style={{ color: trendColors[area.status] || "#94a3b8", fontSize: 9, fontFamily: "monospace", fontWeight: 700 }}>{area.status.toUpperCase()}</span>
              </div>
              <div style={{ display: "flex", gap: 12, color: "#94a3b8", fontSize: 9 }}>
                <span>Stores: <b style={{ color: "#1e293b" }}>{area.stores}</b></span>
                <span>Coverage: <b style={{ color: "#1e293b" }}>{area.coverage}</b></span>
                <span>Rep visits/day: <b style={{ color: "#1e293b" }}>{area.repVisits}</b></span>
              </div>
            </div>
          ))}
        </div>

        {/* Right column: Real-time field feed */}
        <div style={{ width: 360, flexShrink: 0 }}>
          <div style={{ color: "#475569", fontSize: 9, fontFamily: "monospace", fontWeight: 700, marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 5, height: 5, borderRadius: 3, background: "#4ade80", animation: "pulse 1.5s infinite" }} />
            REAL-TIME FIELD REP FEED
          </div>
          {DIRECT_COVERAGE_METRICS.realtimeFeed.slice(0, feedVis).map((f, i) => (
            <div key={i} style={{ background: "#ffffff", borderRadius: 6, padding: "7px 9px", marginBottom: 3, animation: "fadeSlide 0.25s", borderLeft: `2px solid ${(flagColors[f.flag] || "#94a3b8")}33` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span style={{ color: "#64748b", fontSize: 8, fontFamily: "monospace" }}>{f.time}</span>
                <span style={{ background: (flagColors[f.flag] || "#94a3b8") + "22", color: flagColors[f.flag] || "#94a3b8", fontSize: 7, padding: "1px 4px", borderRadius: 3, fontFamily: "monospace", fontWeight: 700 }}>{f.flag}</span>
              </div>
              <div style={{ color: "#94a3b8", fontSize: 9 }}>{f.store}</div>
              <div style={{ color: "#475569", fontSize: 10, lineHeight: 1.3 }}>{f.event}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Value proposition */}
      <div style={{ marginTop: 16, background: "#e0ecff", border: "1px solid #93c5fd", borderRadius: 8, padding: "12px 14px" }}>
        <div style={{ color: "#2563eb", fontSize: 11, fontWeight: 700, marginBottom: 6 }}>&#128161; Why Internal Direct Coverage data is superior to external data partnerships</div>
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { title: "Full Ownership", detail: "No revenue share, no dependency on third-party API. Data is ours &#8212; 38,000 stores with daily rep visit logs and order data.", icon: "&#128274;" },
            { title: "Rep-Level Granularity", detail: "See which rep visited which store, what was ordered, what was pitched but rejected. Unmatched field intelligence.", icon: "&#128101;" },
            { title: "Competitive Blind Spot Removal", detail: "Internal reps report competitor shelf share, pricing, and promotions during visits. No external data partner can match this.", icon: "&#128065;" },
            { title: "Real-Time Actionability", detail: "Signals flow directly to MasanEye within minutes. No batch processing delays. Instant field-to-HQ intelligence loop.", icon: "&#9889;" },
          ].map((v, i) => (
            <div key={i} style={{ flex: 1, background: "#f0f4ff", borderRadius: 6, padding: "8px 10px" }}>
              <div style={{ fontSize: 16, marginBottom: 4 }} dangerouslySetInnerHTML={{ __html: v.icon }} />
              <div style={{ color: "#1e293b", fontSize: 10, fontWeight: 600, marginBottom: 3 }}>{v.title}</div>
              <div style={{ color: "#94a3b8", fontSize: 9, lineHeight: 1.4 }} dangerouslySetInnerHTML={{ __html: v.detail }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// TAB 4: WIN+ CHANNEL INTELLIGENCE (NEW)
// ============================================================
const WinPlusTab = ({ onAction }) => {
  const [feedVis, setFeedVis] = useState(0);
  const metrics = WIN_PLUS_METRICS;
  const flagColors = { CHURN: "#ef4444", CHURN_RISK: "#ef4444", COMPETITOR: "#7c3aed", GROWTH: "#16a34a", NEW: "#0891b2", REORDER: "#22c55e", STOCKOUT: "#dc2626", STABLE: "#94a3b8" };
  useEffect(() => {
    if (!metrics.partnerFeed) return;
    let c = 0;
    const iv = setInterval(() => { c++; setFeedVis(c); if (c >= metrics.partnerFeed.length) clearInterval(iv); }, 700);
    return () => clearInterval(iv);
  }, []);

  const splitColors = { rural: "#16a34a", urban: "#7c3aed" };

  return (
    <div style={{ flex: 1, overflow: "auto", padding: "14px 20px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: "#0891b222", border: "1px solid #0891b244", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>&#127978;</div>
        <div>
          <div style={{ color: "#1e293b", fontSize: 16, fontWeight: 700 }}>Win+ Channel Intelligence</div>
          <div style={{ color: "#0891b2", fontSize: 10, fontFamily: "monospace" }}>4,200 Partners &#8226; Rural + Urban Distribution &#8226; Sell-Through Analytics</div>
        </div>
        <button onClick={() => onAction && onAction("Win+ Data Export", "normal")} style={{ marginLeft: "auto", background: "#0891b222", border: "1px solid #0891b244", borderRadius: 6, padding: "5px 12px", color: "#0891b2", fontSize: 9, fontFamily: "monospace", fontWeight: 600, cursor: "pointer" }}>&#8681; Export Report</button>
      </div>

      {/* Overview metrics */}
      <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
        {[
          { label: "Total Partners", value: metrics.overview.totalPartners, color: "#1e293b" },
          { label: "Active Partners", value: metrics.overview.activePartners, color: "#16a34a" },
          { label: "Monthly GMV", value: metrics.overview.monthlyGMV, color: "#1e293b" },
          { label: "Avg Order/Partner", value: metrics.overview.avgOrderPerPartner, color: "#1e293b" },
          { label: "Rural Penetration", value: metrics.overview.ruralPenetration, color: "#16a34a" },
        ].map((m, i) => (
          <div key={i} style={{ flex: 1, background: "#ffffff", borderRadius: 6, padding: "8px 10px", textAlign: "center" }}>
            <div style={{ color: "#475569", fontSize: 8, fontFamily: "monospace", marginBottom: 2 }}>{m.label}</div>
            <div style={{ color: m.color, fontSize: 14, fontWeight: 800, fontFamily: "monospace" }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        {/* Left: Product sell-through + Rural vs Urban */}
        <div style={{ flex: 1 }}>
          <div style={{ color: "#475569", fontSize: 9, fontFamily: "monospace", fontWeight: 700, marginBottom: 6 }}>PRODUCT SELL-THROUGH RANKINGS</div>
          {metrics.productRankings.map((p, i) => {
            const barWidth = Math.min((p.sellThrough / (metrics.productRankings[0]?.sellThrough || 1)) * 100, 100);
            return (
              <div key={i} style={{ background: "#ffffff", borderRadius: 6, padding: "8px 10px", marginBottom: 4, borderLeft: `3px solid ${i < 3 ? "#22c55e" : i < 6 ? "#eab308" : "#94a3b8"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: "#94a3b8", fontSize: 10, fontFamily: "monospace", fontWeight: 700, width: 18 }}>#{i + 1}</span>
                    <span style={{ color: "#1e293b", fontSize: 11, fontWeight: 600 }}>{p.name}</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: "#1e293b", fontSize: 11, fontWeight: 700, fontFamily: "monospace" }}>{p.revenue}</div>
                    <div style={{ color: p.trend.includes("+") ? "#16a34a" : p.trend.includes("-") ? "#ef4444" : "#94a3b8", fontSize: 8, fontFamily: "monospace" }}>{p.trend} MoM</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, color: "#94a3b8", fontSize: 8, marginBottom: 3 }}>
                  <span>Partners: <b style={{ color: "#475569" }}>{p.partners}</b></span>
                  <span>Sell-through: <b style={{ color: "#475569" }}>{p.sellThrough} units/wk</b></span>
                </div>
                <div style={{ background: "#f1f5f9", borderRadius: 3, height: 4, overflow: "hidden" }}>
                  <div style={{ background: i < 3 ? "#22c55e" : i < 6 ? "#eab308" : "#94a3b8", height: "100%", width: `${barWidth}%`, borderRadius: 3, transition: "width 0.5s" }} />
                </div>
              </div>
            );
          })}

          {/* Rural vs Urban comparison */}
          <div style={{ color: "#475569", fontSize: 9, fontFamily: "monospace", fontWeight: 700, marginBottom: 6, marginTop: 14 }}>RURAL VS URBAN SPLIT</div>
          <div style={{ display: "flex", gap: 8 }}>
            {metrics.ruralUrbanSplit.map((segment, i) => (
              <div key={i} style={{ flex: 1, background: "#ffffff", borderRadius: 8, padding: "10px 12px", border: `1px solid ${splitColors[segment.type]}33` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: splitColors[segment.type] + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>{segment.type === "rural" ? "\ud83c\udf3e" : "\ud83c\udfd9"}</div>
                  <div>
                    <div style={{ color: "#1e293b", fontSize: 12, fontWeight: 700 }}>{segment.label}</div>
                    <div style={{ color: splitColors[segment.type], fontSize: 9, fontFamily: "monospace" }}>{segment.partners} partners</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                  <div style={{ flex: 1, background: "#f1f5f9", borderRadius: 4, padding: "4px 6px", textAlign: "center" }}>
                    <div style={{ color: "#94a3b8", fontSize: 7, fontFamily: "monospace" }}>REVENUE</div>
                    <div style={{ color: "#1e293b", fontSize: 11, fontWeight: 700, fontFamily: "monospace" }}>{segment.revenue}</div>
                  </div>
                  <div style={{ flex: 1, background: "#f1f5f9", borderRadius: 4, padding: "4px 6px", textAlign: "center" }}>
                    <div style={{ color: "#94a3b8", fontSize: 7, fontFamily: "monospace" }}>GROWTH</div>
                    <div style={{ color: segment.growth.includes("+") ? "#16a34a" : "#ef4444", fontSize: 11, fontWeight: 700, fontFamily: "monospace" }}>{segment.growth}</div>
                  </div>
                </div>
                <div style={{ color: "#94a3b8", fontSize: 8, lineHeight: 1.4 }}>{segment.insight}</div>
              </div>
            ))}
          </div>

          {/* Partner Growth Chart concept */}
          <div style={{ color: "#475569", fontSize: 9, fontFamily: "monospace", fontWeight: 700, marginBottom: 6, marginTop: 14 }}>PARTNER GROWTH TRAJECTORY</div>
          <div style={{ background: "#ffffff", borderRadius: 8, padding: "12px 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", height: 80, gap: 2, marginBottom: 6 }}>
              {(metrics.partnerGrowth || [
                { month: "Oct", count: 3200 }, { month: "Nov", count: 3450 }, { month: "Dec", count: 3680 },
                { month: "Jan", count: 3840 }, { month: "Feb", count: 3980 }, { month: "Mar", count: 4200 },
              ]).map((d, i) => {
                const maxVal = 4500;
                const h = (d.count / maxVal) * 70;
                return (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <span style={{ color: "#475569", fontSize: 7, fontFamily: "monospace" }}>{d.count.toLocaleString()}</span>
                    <div style={{ width: "100%", height: h, background: "linear-gradient(180deg,#0891b2,#06b6d4)", borderRadius: "3px 3px 0 0", transition: "height 0.5s" }} />
                    <span style={{ color: "#94a3b8", fontSize: 7, fontFamily: "monospace" }}>{d.month}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ textAlign: "center", color: "#0891b2", fontSize: 9, fontFamily: "monospace", fontWeight: 600 }}>+31% partner growth in 6 months</div>
          </div>
        </div>

        {/* Right: Partner feed */}
        <div style={{ width: 340, flexShrink: 0 }}>
          <div style={{ color: "#475569", fontSize: 9, fontFamily: "monospace", fontWeight: 700, marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 5, height: 5, borderRadius: 3, background: "#4ade80", animation: "pulse 1.5s infinite" }} />
            WIN+ PARTNER ACTIVITY FEED
          </div>
          {(metrics.partnerFeed || []).slice(0, feedVis).map((f, i) => (
            <div key={i} style={{ background: "#ffffff", borderRadius: 6, padding: "7px 9px", marginBottom: 3, animation: "fadeSlide 0.25s", borderLeft: `2px solid ${f.type === "rural" ? "#16a34a33" : "#7c3aed33"}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span style={{ color: "#64748b", fontSize: 8, fontFamily: "monospace" }}>{f.time}</span>
                <div style={{ display: "flex", gap: 3 }}>
                  <span style={{ background: f.type === "rural" ? "#16a34a22" : "#7c3aed22", color: f.type === "rural" ? "#16a34a" : "#7c3aed", fontSize: 6, padding: "1px 3px", borderRadius: 2, fontFamily: "monospace", fontWeight: 700 }}>{f.type.toUpperCase()}</span>
                  <span style={{ background: (flagColors[f.flag] || "#94a3b8") + "22", color: flagColors[f.flag] || "#94a3b8", fontSize: 7, padding: "1px 4px", borderRadius: 3, fontFamily: "monospace", fontWeight: 700 }}>{f.flag}</span>
                </div>
              </div>
              <div style={{ color: "#94a3b8", fontSize: 9 }}>{f.partner}</div>
              <div style={{ color: "#475569", fontSize: 10, lineHeight: 1.3 }}>{f.event}</div>
            </div>
          ))}

          {/* LLM Action buttons */}
          <div style={{ marginTop: 12, background: "linear-gradient(135deg,#2563eb11,#7c3aed11)", border: "1px solid #7c3aed33", borderRadius: 8, padding: "10px 12px" }}>
            <div style={{ color: "#7c3aed", fontSize: 9, fontFamily: "monospace", fontWeight: 700, marginBottom: 6 }}>&#129302; LLM-DEPLOYABLE ACTIONS</div>
            {[
              { label: "Optimize Rural Route Planning", toast: "Deploying Route Optimizer Agent \u2192 Analyzing 2,800 rural partner locations for optimal delivery routing..." },
              { label: "Partner Churn Prediction", toast: "Partner Churn Model running \u2192 Scoring 4,200 partners on 30-day churn probability..." },
              { label: "Product Mix Recommender", toast: "Product Mix Agent deployed \u2192 Generating SKU recommendations for 340 underperforming partners..." },
            ].map((a, i) => (
              <button key={i} onClick={() => onAction && onAction(a.label, "llm", a.toast)} style={{
                display: "block", width: "100%", textAlign: "left", marginBottom: 4, padding: "6px 10px",
                background: "linear-gradient(135deg,#2563eb15,#7c3aed15)", border: "1px solid #7c3aed44",
                borderRadius: 5, color: "#7c3aed", fontSize: 9, fontFamily: "monospace", fontWeight: 600, cursor: "pointer",
              }}>&#129302; {a.label}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// TAB 5: FINANCE & COVENANTS (NEW - MOST IMPORTANT)
// ============================================================
const FinanceTab = ({ onAction }) => {
  const data = FINANCE_DATA;

  const CovenantGauge = ({ covenant }) => {
    const pct = covenant.currentPct || 0;
    const limitPct = 100;
    const dangerZone = pct > 85;
    const warningZone = pct > 70;
    const gaugeColor = dangerZone ? "#ef4444" : warningZone ? "#eab308" : "#22c55e";
    const projColor = covenant.projectionStatus === "breach" ? "#ef4444" : covenant.projectionStatus === "warning" ? "#eab308" : "#22c55e";

    return (
      <div style={{ flex: 1, background: "#ffffff", borderRadius: 8, padding: "12px 14px", border: `1px solid ${gaugeColor}33` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ color: "#1e293b", fontSize: 11, fontWeight: 700 }}>{covenant.name}</div>
          <span style={{ background: gaugeColor + "22", color: gaugeColor, fontSize: 7, padding: "2px 6px", borderRadius: 3, fontFamily: "monospace", fontWeight: 700 }}>
            {dangerZone ? "NEAR LIMIT" : warningZone ? "WATCH" : "OK"}
          </span>
        </div>

        {/* Gauge visual */}
        <div style={{ position: "relative", height: 48, marginBottom: 8 }}>
          {/* Background track */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 10, background: "#f1f5f9", borderRadius: 5 }} />
          {/* Fill bar */}
          <div style={{ position: "absolute", bottom: 0, left: 0, height: 10, width: `${Math.min(pct, 100)}%`, background: `linear-gradient(90deg, #22c55e, ${gaugeColor})`, borderRadius: 5, transition: "width 1s" }} />
          {/* Limit marker */}
          <div style={{ position: "absolute", bottom: 0, right: 0, height: 16, width: 2, background: "#ef4444" }} />
          <div style={{ position: "absolute", bottom: 18, right: -10, color: "#ef4444", fontSize: 7, fontFamily: "monospace", fontWeight: 700 }}>LIMIT</div>

          {/* Current value label */}
          <div style={{ position: "absolute", bottom: 14, left: `${Math.min(pct, 95)}%`, transform: "translateX(-50%)" }}>
            <div style={{ color: gaugeColor, fontSize: 14, fontWeight: 800, fontFamily: "monospace", textAlign: "center" }}>{covenant.current}</div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: "#94a3b8", fontFamily: "monospace" }}>
          <span>Current: <b style={{ color: "#1e293b" }}>{covenant.current}</b></span>
          <span>Limit: <b style={{ color: "#ef4444" }}>{covenant.limit}</b></span>
        </div>

        {/* Year-end projection */}
        <div style={{ marginTop: 6, padding: "4px 8px", background: projColor + "11", border: `1px solid ${projColor}33`, borderRadius: 4 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#475569", fontSize: 8 }}>Year-end projection:</span>
            <span style={{ color: projColor, fontSize: 10, fontWeight: 700, fontFamily: "monospace" }}>{covenant.yearEndProjection}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ flex: 1, overflow: "auto", padding: "14px 20px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: "#16a34a22", border: "1px solid #16a34a44", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>&#128176;</div>
        <div>
          <div style={{ color: "#1e293b", fontSize: 16, fontWeight: 700 }}>Finance & Covenants Dashboard</div>
          <div style={{ color: "#16a34a", fontSize: 10, fontFamily: "monospace" }}>Covenant Tracker &#8226; NWC Optimization &#8226; Capex Allocation &#8226; Private Label PMF &#8226; Auto-Rolling Forecasts</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
          <button onClick={() => onAction && onAction("Auto-Update Forecast", "llm", "Auto-Rolling Forecast updated \u2192 Net Debt/EBITDA projected 2.9x year-end, NWC optimized to \u20ab1.2T target...")} style={{
            background: "linear-gradient(135deg,#2563eb15,#7c3aed15)", border: "1px solid #7c3aed44", borderRadius: 5,
            padding: "5px 10px", color: "#7c3aed", fontSize: 9, fontFamily: "monospace", fontWeight: 600, cursor: "pointer",
          }}>&#129302; Auto-Update Forecast</button>
          <button onClick={() => onAction && onAction("Finance Export", "finance")} style={{
            background: "#16a34a22", border: "1px solid #16a34a44", borderRadius: 5,
            padding: "5px 10px", color: "#16a34a", fontSize: 9, fontFamily: "monospace", fontWeight: 600, cursor: "pointer",
          }}>&#128176; Export to CFO</button>
        </div>
      </div>

      {/* Top section: Covenant status cards */}
      <div style={{ color: "#475569", fontSize: 9, fontFamily: "monospace", fontWeight: 700, marginBottom: 6 }}>COVENANT STATUS</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {data.covenants.map((c, i) => <CovenantGauge key={i} covenant={c} />)}
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        {/* Middle left: NWC breakdown */}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ color: "#475569", fontSize: 9, fontFamily: "monospace", fontWeight: 700 }}>NET WORKING CAPITAL BREAKDOWN</div>
            <button onClick={() => onAction && onAction("NWC Optimization Agent", "llm", "NWC Optimization Agent \u2192 Targeting \u20ab420B MCH receivables reduction, \u20ab180B inventory optimization, projected NWC improvement \u20ab600B...")} style={{
              background: "linear-gradient(135deg,#2563eb15,#7c3aed15)", border: "1px solid #7c3aed44", borderRadius: 4,
              padding: "3px 8px", color: "#7c3aed", fontSize: 8, fontFamily: "monospace", fontWeight: 600, cursor: "pointer",
            }}>&#129302; Optimize NWC Agent</button>
          </div>
          <div style={{ background: "#ffffff", borderRadius: 8, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 90px 70px", padding: "6px 10px", background: "#f1f5f9", gap: 4 }}>
              {["Component", "Current", "Target", "Excess", "Action"].map((h, i) => (
                <div key={i} style={{ color: "#64748b", fontSize: 7, fontFamily: "monospace", fontWeight: 700 }}>{h}</div>
              ))}
            </div>
            {data.nwcBreakdown.map((row, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 90px 70px", padding: "7px 10px", borderBottom: "1px solid #f1f5f9", gap: 4, alignItems: "center" }}>
                <div>
                  <div style={{ color: "#1e293b", fontSize: 10, fontWeight: 600 }}>{row.component}</div>
                  <div style={{ color: "#94a3b8", fontSize: 8 }}>{row.bu}</div>
                </div>
                <div style={{ color: "#1e293b", fontSize: 10, fontFamily: "monospace", fontWeight: 600 }}>{row.current}</div>
                <div style={{ color: "#16a34a", fontSize: 10, fontFamily: "monospace" }}>{row.target}</div>
                <div style={{ color: row.excess.includes("-") ? "#16a34a" : "#ef4444", fontSize: 10, fontFamily: "monospace", fontWeight: 700 }}>{row.excess}</div>
                <button onClick={() => onAction && onAction(`Optimize ${row.component}`, "finance", `NWC Agent targeting ${row.component} \u2192 ${row.actionDetail || "Optimization in progress..."}`)} style={{
                  background: "#16a34a22", border: "1px solid #16a34a44", borderRadius: 3,
                  padding: "2px 6px", color: "#16a34a", fontSize: 7, fontFamily: "monospace", fontWeight: 600, cursor: "pointer",
                }}>Optimize</button>
              </div>
            ))}
          </div>
        </div>

        {/* Middle right: Capex allocation */}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ color: "#475569", fontSize: 9, fontFamily: "monospace", fontWeight: 700 }}>CAPEX ALLOCATION & ROI RANKING</div>
            <button onClick={() => onAction && onAction("Capex Reallocation", "llm", "Capex Reallocation Agent \u2192 Shifting \u20ab120B from low-ROI projects to WCM store conversions (projected 340% ROI)...")} style={{
              background: "linear-gradient(135deg,#2563eb15,#7c3aed15)", border: "1px solid #7c3aed44", borderRadius: 4,
              padding: "3px 8px", color: "#7c3aed", fontSize: 8, fontFamily: "monospace", fontWeight: 600, cursor: "pointer",
            }}>&#129302; Reallocation Agent</button>
          </div>
          {data.capexAllocation.map((proj, i) => {
            const roiColor = proj.roi > 200 ? "#22c55e" : proj.roi > 100 ? "#eab308" : "#ef4444";
            return (
              <div key={i} style={{ background: "#ffffff", borderRadius: 6, padding: "8px 10px", marginBottom: 4, borderLeft: `3px solid ${roiColor}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                  <span style={{ color: "#1e293b", fontSize: 10, fontWeight: 600 }}>{proj.project}</span>
                  <span style={{ color: roiColor, fontSize: 10, fontFamily: "monospace", fontWeight: 700 }}>{proj.roi}% ROI</span>
                </div>
                <div style={{ display: "flex", gap: 12, color: "#94a3b8", fontSize: 8 }}>
                  <span>Budget: <b style={{ color: "#1e293b" }}>{proj.budget}</b></span>
                  <span>Spent: <b style={{ color: "#1e293b" }}>{proj.spent}</b></span>
                  <span>Status: <b style={{ color: proj.status === "on-track" ? "#16a34a" : proj.status === "delayed" ? "#eab308" : "#ef4444" }}>{proj.status}</b></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        {/* Bottom left: Private Label PMF */}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ color: "#475569", fontSize: 9, fontFamily: "monospace", fontWeight: 700 }}>PRIVATE LABEL PMF TRACKER</div>
            <button onClick={() => onAction && onAction("Scale Private Label", "llm", "Private Label Scale Agent \u2192 Identifying top 5 categories for PLH expansion, projected margin uplift +280bps...")} style={{
              background: "linear-gradient(135deg,#2563eb15,#7c3aed15)", border: "1px solid #7c3aed44", borderRadius: 4,
              padding: "3px 8px", color: "#7c3aed", fontSize: 8, fontFamily: "monospace", fontWeight: 600, cursor: "pointer",
            }}>&#129302; Scale Private Label</button>
          </div>
          {data.privateLabelPMF.map((pl, i) => (
            <div key={i} style={{ background: "#ffffff", borderRadius: 6, padding: "8px 10px", marginBottom: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ color: "#1e293b", fontSize: 10, fontWeight: 600 }}>{pl.category}</span>
                <span style={{ background: pl.pmfScore >= 80 ? "#16a34a22" : pl.pmfScore >= 60 ? "#eab30822" : "#ef444422", color: pl.pmfScore >= 80 ? "#16a34a" : pl.pmfScore >= 60 ? "#eab308" : "#ef4444", fontSize: 8, fontFamily: "monospace", fontWeight: 700, padding: "1px 5px", borderRadius: 3 }}>PMF: {pl.pmfScore}/100</span>
              </div>
              <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                <div style={{ flex: 1, background: "#f1f5f9", borderRadius: 4, padding: "3px 6px", textAlign: "center" }}>
                  <div style={{ color: "#94a3b8", fontSize: 6, fontFamily: "monospace" }}>PLH MARGIN</div>
                  <div style={{ color: "#16a34a", fontSize: 10, fontWeight: 700, fontFamily: "monospace" }}>{pl.plhMargin}</div>
                </div>
                <div style={{ flex: 1, background: "#f1f5f9", borderRadius: 4, padding: "3px 6px", textAlign: "center" }}>
                  <div style={{ color: "#94a3b8", fontSize: 6, fontFamily: "monospace" }}>BRAND MARGIN</div>
                  <div style={{ color: "#475569", fontSize: 10, fontWeight: 700, fontFamily: "monospace" }}>{pl.brandMargin}</div>
                </div>
                <div style={{ flex: 1, background: "#f1f5f9", borderRadius: 4, padding: "3px 6px", textAlign: "center" }}>
                  <div style={{ color: "#94a3b8", fontSize: 6, fontFamily: "monospace" }}>MARGIN DELTA</div>
                  <div style={{ color: "#2563eb", fontSize: 10, fontWeight: 700, fontFamily: "monospace" }}>{pl.marginDelta}</div>
                </div>
              </div>
              <div style={{ color: "#94a3b8", fontSize: 8, lineHeight: 1.3 }}>{pl.insight}</div>
            </div>
          ))}
        </div>

        {/* Bottom right: Auto-Rolling Forecast */}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ color: "#475569", fontSize: 9, fontFamily: "monospace", fontWeight: 700 }}>AUTO-ROLLING FORECAST</div>
            <button onClick={() => onAction && onAction("Auto-Update Forecast", "llm", "Auto-Rolling Forecast updated \u2192 WCM revenue trajectory +4.2% vs plan, MCH stable, PLH accelerating +18% QoQ...")} style={{
              background: "linear-gradient(135deg,#2563eb15,#7c3aed15)", border: "1px solid #7c3aed44", borderRadius: 4,
              padding: "3px 8px", color: "#7c3aed", fontSize: 8, fontFamily: "monospace", fontWeight: 600, cursor: "pointer",
            }}>&#129302; Auto-Update Forecast</button>
          </div>
          {data.rollingForecast.map((fc, i) => {
            const trendColor = fc.vsTarget.includes("+") ? "#22c55e" : fc.vsTarget.includes("-") ? "#ef4444" : "#94a3b8";
            return (
              <div key={i} style={{ background: "#ffffff", borderRadius: 6, padding: "10px 12px", marginBottom: 5, borderLeft: `3px solid ${trendColor}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ color: "#1e293b", fontSize: 11, fontWeight: 700 }}>{fc.bu}</span>
                  <span style={{ color: trendColor, fontSize: 10, fontFamily: "monospace", fontWeight: 700 }}>{fc.vsTarget} vs target</span>
                </div>
                {/* Mini trajectory bars */}
                <div style={{ display: "flex", gap: 3, marginBottom: 6 }}>
                  {(fc.trajectory || []).map((q, qi) => {
                    const maxR = Math.max(...(fc.trajectory || []).map(t => t.value));
                    const barH = (q.value / maxR) * 32;
                    return (
                      <div key={qi} style={{ flex: 1, textAlign: "center" }}>
                        <div style={{ height: 32, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                          <div style={{ width: "80%", height: barH, background: q.projected ? `${trendColor}44` : trendColor, borderRadius: "2px 2px 0 0", border: q.projected ? `1px dashed ${trendColor}` : "none" }} />
                        </div>
                        <div style={{ color: "#94a3b8", fontSize: 6, fontFamily: "monospace", marginTop: 2 }}>{q.label}</div>
                        <div style={{ color: q.projected ? trendColor : "#475569", fontSize: 7, fontFamily: "monospace", fontWeight: 600 }}>{q.display}</div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: "#94a3b8", fontFamily: "monospace" }}>
                  <span>YTD: <b style={{ color: "#1e293b" }}>{fc.ytd}</b></span>
                  <span>Year-end est: <b style={{ color: trendColor }}>{fc.yearEndEst}</b></span>
                </div>
              </div>
            );
          })}

          {/* Finance action panel */}
          <div style={{ marginTop: 8, background: "#16a34a11", border: "1px solid #16a34a33", borderRadius: 8, padding: "10px 12px" }}>
            <div style={{ color: "#16a34a", fontSize: 9, fontFamily: "monospace", fontWeight: 700, marginBottom: 6 }}>&#128176; FINANCE ACTIONS</div>
            {[
              { label: "NWC Optimization Agent", toast: "NWC Optimization Agent \u2192 Targeting \u20ab420B MCH receivables reduction, renegotiating supplier terms for \u20ab180B payables extension..." },
              { label: "Capex Reallocation", toast: "Capex Reallocation Agent \u2192 Recommending shift of \u20ab120B to high-ROI WCM conversions, pause on warehouse automation Phase 2..." },
              { label: "Covenant Monitor Alert", toast: "Covenant Monitor set \u2192 Will alert if Net Debt/EBITDA exceeds 2.8x or Interest Cover drops below 4.5x..." },
            ].map((a, i) => (
              <button key={i} onClick={() => onAction && onAction(a.label, "finance", a.toast)} style={{
                display: "block", width: "100%", textAlign: "left", marginBottom: 3, padding: "5px 9px",
                background: "#16a34a15", border: "1px solid #16a34a33", borderRadius: 4,
                color: "#16a34a", fontSize: 9, fontFamily: "monospace", fontWeight: 600, cursor: "pointer",
              }}>&#128176; {a.label}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// TAB 6: STORE INTELLIGENCE MAP (Hex Grid) - updated terminology
// ============================================================
const HEX_SIZE = 22;
const HEX_GAP = 3;
const hexPoints = (cx, cy, s) => {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    pts.push(`${cx + s * Math.cos(angle)},${cy + s * Math.sin(angle)}`);
  }
  return pts.join(" ");
};

const StoreHex = ({ store, x, y, size, selected, onClick, dimmed }) => {
  const baseColor = store.type === "wcm" ? "#ef4444" : "#f59e0b";
  const statusGlow = { critical: "#ef4444", warning: "#eab308", ok: "#22c55e" }[store.status];
  const fillOpacity = dimmed ? 0.12 : store.status === "critical" ? 0.85 : store.status === "warning" ? 0.6 : 0.35;
  const strokeW = selected ? 2.5 : store.status === "critical" ? 1.5 : 0.8;

  return (
    <g onClick={() => onClick(store)} style={{ cursor: "pointer" }}>
      {store.status === "critical" && !dimmed && (
        <polygon points={hexPoints(x, y, size + 4)} fill="none" stroke={statusGlow} strokeWidth="0.5" opacity="0.4">
          <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
        </polygon>
      )}
      <polygon
        points={hexPoints(x, y, size)}
        fill={baseColor}
        fillOpacity={fillOpacity}
        stroke={selected ? "#fff" : dimmed ? baseColor + "33" : statusGlow}
        strokeWidth={strokeW}
        style={{ transition: "all 0.2s" }}
      />
      {store.status === "critical" && !dimmed && (
        <circle cx={x} cy={y} r={3} fill="#ef4444">
          <animate attributeName="r" values="2;4;2" dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
        </circle>
      )}
      {store.status === "warning" && !dimmed && <circle cx={x} cy={y} r={2} fill="#eab308" opacity="0.8" />}
      {store.status === "ok" && !dimmed && <circle cx={x} cy={y} r={1.5} fill="#22c55e" opacity="0.5" />}
      <text x={x} y={y + size + 10} textAnchor="middle" fill={dimmed ? "#e2e8f0" : "#475569"} fontSize="5.5" fontFamily="monospace">{store.id}</text>
    </g>
  );
};

const StoreDetailPanel = ({ store, onClose }) => {
  if (!store) return null;
  const typeColor = store.type === "wcm" ? "#ef4444" : "#f59e0b";
  const statusColor = { critical: "#ef4444", warning: "#eab308", ok: "#22c55e" }[store.status];
  return (
    <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 14px", animation: "fadeSlide 0.2s" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 6, background: typeColor + "22", border: `2px solid ${typeColor}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="16" height="16" viewBox="0 0 20 20"><polygon points={hexPoints(10, 10, 8)} fill={typeColor} /></svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: "#1e293b", fontSize: 13, fontWeight: 700 }}>{store.name}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 1 }}>
            <span style={{ color: typeColor, fontSize: 8, fontFamily: "monospace", fontWeight: 700, background: typeColor + "22", padding: "1px 5px", borderRadius: 3 }}>{store.type === "wcm" ? "WCM" : "GT"}</span>
            <span style={{ color: "#64748b", fontSize: 9, fontFamily: "monospace" }}>{store.id}</span>
            <span style={{ color: "#64748b", fontSize: 9 }}>&#8226;</span>
            <span style={{ color: "#94a3b8", fontSize: 9 }}>{store.region}</span>
          </div>
        </div>
        <button onClick={onClose} style={{ background: "#e2e8f0", border: "none", borderRadius: 4, width: 24, height: 24, color: "#64748b", cursor: "pointer", fontSize: 12 }}>&#10005;</button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1, background: "#ffffff", borderRadius: 6, padding: "6px 9px" }}>
          <div style={{ color: "#475569", fontSize: 7, fontFamily: "monospace" }}>STATUS</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
            <div style={{ width: 7, height: 7, borderRadius: 4, background: statusColor }} />
            <span style={{ color: statusColor, fontSize: 11, fontWeight: 700, fontFamily: "monospace", textTransform: "uppercase" }}>{store.status}</span>
          </div>
        </div>
        <div style={{ flex: 1, background: "#ffffff", borderRadius: 6, padding: "6px 9px" }}>
          <div style={{ color: "#475569", fontSize: 7, fontFamily: "monospace" }}>REVENUE</div>
          <div style={{ color: "#1e293b", fontSize: 13, fontWeight: 800, fontFamily: "monospace", marginTop: 2 }}>{store.rev}</div>
        </div>
      </div>

      {store.alerts.length > 0 ? (
        <div>
          <div style={{ color: "#475569", fontSize: 7, fontFamily: "monospace", fontWeight: 700, marginBottom: 4 }}>ACTIVE ALERTS ({store.alerts.length})</div>
          {store.alerts.map((a, i) => {
            const isC = a.toLowerCase().includes("churn") || a.toLowerCase().includes("stockout") || a.toLowerCase().includes("lost") || a.toLowerCase().includes("return") || a.toLowerCase().includes("expired");
            const isComp = a.toLowerCase().includes("magi") || a.toLowerCase().includes("meat plus") || a.toLowerCase().includes("circle k") || a.toLowerCase().includes("competitor");
            const ac = isC ? "#ef4444" : isComp ? "#7c3aed" : "#eab308";
            return (
              <div key={i} style={{ background: "#ffffff", borderRadius: 5, padding: "5px 8px", marginBottom: 3, borderLeft: `3px solid ${ac}`, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: ac, fontSize: 10 }}>{isC ? "\u25cf" : isComp ? "\u2694" : "\u25b2"}</span>
                <span style={{ color: "#475569", fontSize: 10, lineHeight: 1.3 }}>{a}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ background: "#16a34a11", borderRadius: 5, padding: "8px", textAlign: "center" }}>
          <span style={{ color: "#4ade80", fontSize: 10, fontFamily: "monospace" }}>&#10003; No active alerts</span>
        </div>
      )}
    </div>
  );
};

const HexMapTab = ({ initialFilter, onNavigateBack }) => {
  const [filter, setFilter] = useState(initialFilter || "all");
  const [selectedStore, setSelectedStore] = useState(null);
  const [hoveredRegion, setHoveredRegion] = useState(null);

  useEffect(() => { if (initialFilter) setFilter(initialFilter); }, [initialFilter]);

  const filterFn = MAP_FILTERS[filter]?.match || (() => true);
  const matchedIds = new Set(ALL_STORES.filter(filterFn).map(s => s.id));
  const hasFilter = filter !== "all";

  const totalStores = ALL_STORES.length;
  const criticalCount = ALL_STORES.filter(s => s.status === "critical").length;
  const warningCount = ALL_STORES.filter(s => s.status === "warning").length;
  const wcmCount = ALL_STORES.filter(s => s.type === "wcm").length;
  const gtCount = ALL_STORES.filter(s => s.type === "gt").length;
  const matchedCount = ALL_STORES.filter(filterFn).length;

  const regionLayouts = STORE_REGIONS.map((region, ri) => {
    const regionPositions = {
      "hcm_d1": { cx: 380, cy: 220 }, "hcm_d2": { cx: 520, cy: 180 }, "hcm_d7": { cx: 360, cy: 320 },
      "hcm_bt": { cx: 430, cy: 140 }, "hcm_gv": { cx: 300, cy: 130 }, "bienhoa": { cx: 620, cy: 100 },
      "longan": { cx: 200, cy: 340 }, "cantho": { cx: 120, cy: 480 }, "vinhlong": { cx: 260, cy: 450 },
      "dongthap": { cx: 180, cy: 400 },
    };
    const pos = regionPositions[region.id] || { cx: 400 + ri * 80, cy: 300 };
    const storePositions = region.stores.map((store, si) => {
      const cols = Math.ceil(Math.sqrt(region.stores.length));
      const row = Math.floor(si / cols);
      const col = si % cols;
      const xOff = col * (HEX_SIZE * 1.8 + HEX_GAP) + (row % 2) * (HEX_SIZE * 0.9);
      const yOff = row * (HEX_SIZE * 1.6 + HEX_GAP);
      return { store, x: pos.cx + xOff - (cols * HEX_SIZE * 0.9), y: pos.cy + yOff };
    });
    return { region, positions: storePositions, center: pos };
  });

  return (
    <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Map Header */}
        <div style={{ padding: "10px 16px", borderBottom: "1px solid #e2e8f0", background: "#ffffff", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="20" height="20" viewBox="0 0 20 20"><polygon points={hexPoints(10, 10, 8)} fill="#2563eb" opacity="0.6" /><polygon points={hexPoints(10, 10, 8)} fill="none" stroke="#60a5fa" strokeWidth="1" /></svg>
            <span style={{ color: "#1e293b", fontSize: 13, fontWeight: 700 }}>Store Intelligence Map</span>
          </div>
          <div style={{ display: "flex", gap: 6, marginLeft: 12 }}>
            {[
              { k: "all", l: "All", c: "#94a3b8" }, { k: "all_critical", l: "Critical", c: "#ef4444" }, { k: "all_warning", l: "Warnings", c: "#eab308" },
              { k: "meatdeli_stockout", l: "MEATDeli OOS", c: "#dc2626" }, { k: "meatdeli_quality", l: "Quality", c: "#ea580c" },
              { k: "competitor_magi", l: "Magi", c: "#7c3aed" }, { k: "competitor_meatplus", l: "Meat Plus", c: "#7c3aed" },
              { k: "chinsu_oos", l: "Chin-su OOS", c: "#ca8a04" },
            ].map(f => (
              <button key={f.k} onClick={() => { setFilter(f.k); setSelectedStore(null); }} style={{
                padding: "3px 8px", borderRadius: 4, border: `1px solid ${filter === f.k ? f.c + "88" : "#e2e8f0"}`,
                background: filter === f.k ? f.c + "22" : "transparent", color: filter === f.k ? f.c : "#475569",
                fontSize: 8, fontFamily: "monospace", fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
              }}>{f.l}</button>
            ))}
          </div>
          {hasFilter && <div style={{ marginLeft: "auto", background: "#2563eb22", border: "1px solid #2563eb44", borderRadius: 4, padding: "2px 8px" }}>
            <span style={{ color: "#60a5fa", fontSize: 9, fontFamily: "monospace", fontWeight: 700 }}>{matchedCount} stores matched</span>
          </div>}
        </div>

        {/* Stats Bar */}
        <div style={{ padding: "6px 16px", borderBottom: "1px solid #e2e8f0", background: "#f1f5f9", display: "flex", gap: 12, flexShrink: 0 }}>
          {[
            { l: "Total", v: totalStores, c: "#94a3b8" },
            { l: "WCM", v: wcmCount, c: "#ef4444", icon: "\u25a0" },
            { l: "GT", v: gtCount, c: "#f59e0b", icon: "\u25a0" },
            { l: "Critical", v: criticalCount, c: "#ef4444" },
            { l: "Warning", v: warningCount, c: "#eab308" },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {s.icon && <span style={{ color: s.c, fontSize: 6 }}>{s.icon}</span>}
              <span style={{ color: "#475569", fontSize: 8, fontFamily: "monospace" }}>{s.l}:</span>
              <span style={{ color: s.c, fontSize: 9, fontWeight: 700, fontFamily: "monospace" }}>{s.v}</span>
            </div>
          ))}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 3 }}>
            <div style={{ width: 5, height: 5, borderRadius: 3, background: "#4ade80", animation: "pulse 2s infinite" }} />
            <span style={{ color: "#4ade80", fontSize: 8, fontFamily: "monospace" }}>LIVE</span>
          </div>
        </div>

        {/* SVG Map */}
        <div style={{ flex: 1, overflow: "auto", background: "#f8fafc", position: "relative" }}>
          <svg width="780" height="600" viewBox="0 0 780 600" style={{ display: "block", margin: "0 auto" }}>
            <defs>
              <pattern id="hexgrid" width="30" height="26" patternUnits="userSpaceOnUse">
                <polygon points={hexPoints(15, 13, 12)} fill="none" stroke="#e2e8f0" strokeWidth="0.4" />
              </pattern>
              <radialGradient id="mapglow" cx="50%" cy="45%" r="50%">
                <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#f8fafc" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="780" height="600" fill="url(#hexgrid)" />
            <rect width="780" height="600" fill="url(#mapglow)" />

            {regionLayouts.map(({ region, center }) => (
              <g key={region.id}>
                <circle cx={center.cx} cy={center.cy} r={region.stores.length * 14 + 20} fill="none" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="4,4" opacity="0.3" />
                <text x={center.cx} y={center.cy - region.stores.length * 7 - 18} textAnchor="middle" fill={hoveredRegion === region.id ? "#1e293b" : "#94a3b8"} fontSize="9" fontFamily="'Segoe UI',system-ui" fontWeight="600" style={{ transition: "fill 0.2s" }}>{region.name}</text>
              </g>
            ))}

            {[
              { name: "DC Long An", x: 170, y: 310, status: "critical" },
              { name: "DC B\u00ecnh D\u01b0\u01a1ng", x: 560, y: 60, status: "ok" },
              { name: "DC C\u1ea7n Th\u01a1", x: 80, y: 450, status: "critical" },
            ].map((dc, i) => (
              <g key={i}>
                <rect x={dc.x - 14} y={dc.y - 8} width={28} height={16} rx={3} fill={dc.status === "critical" ? "#dc262622" : "#16a34a22"} stroke={dc.status === "critical" ? "#dc2626" : "#16a34a"} strokeWidth="0.8" />
                <text x={dc.x} y={dc.y + 3} textAnchor="middle" fill={dc.status === "critical" ? "#dc2626" : "#16a34a"} fontSize="6" fontFamily="monospace" fontWeight="700">DC</text>
                <text x={dc.x} y={dc.y + 22} textAnchor="middle" fill="#475569" fontSize="6.5" fontFamily="monospace">{dc.name}</text>
                {dc.status === "critical" && <circle cx={dc.x + 16} cy={dc.y - 6} r={3} fill="#ef4444"><animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" /></circle>}
              </g>
            ))}

            {regionLayouts.map(({ region, positions }) => (
              <g key={region.id} onMouseEnter={() => setHoveredRegion(region.id)} onMouseLeave={() => setHoveredRegion(null)}>
                {positions.map(({ store, x, y }) => (
                  <StoreHex key={store.id} store={store} x={x} y={y} size={HEX_SIZE} selected={selectedStore?.id === store.id} dimmed={hasFilter && !matchedIds.has(store.id)} onClick={setSelectedStore} />
                ))}
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Right: Detail Panel */}
      <div style={{ width: 320, borderLeft: "1px solid #e2e8f0", background: "#f1f5f9", overflow: "auto", flexShrink: 0, padding: "12px" }}>
        <div style={{ color: "#475569", fontSize: 8, fontFamily: "monospace", fontWeight: 700, marginBottom: 8 }}>
          {selectedStore ? "STORE DETAIL" : hasFilter ? `FILTERED: ${MAP_FILTERS[filter]?.label}` : "STORE INTELLIGENCE"}
        </div>

        {selectedStore ? (
          <StoreDetailPanel store={selectedStore} onClose={() => setSelectedStore(null)} />
        ) : (
          <>
            <div style={{ background: "#ffffff", borderRadius: 6, padding: "8px 10px", marginBottom: 8 }}>
              <div style={{ color: "#475569", fontSize: 7, fontFamily: "monospace", fontWeight: 700, marginBottom: 5 }}>LEGEND</div>
              <div style={{ display: "flex", gap: 12, marginBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <svg width="16" height="14"><polygon points={hexPoints(8, 7, 6)} fill="#ef4444" fillOpacity="0.5" stroke="#ef4444" strokeWidth="0.8" /></svg>
                  <span style={{ color: "#dc2626", fontSize: 9 }}>WCM Store</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <svg width="16" height="14"><polygon points={hexPoints(8, 7, 6)} fill="#f59e0b" fillOpacity="0.5" stroke="#f59e0b" strokeWidth="0.8" /></svg>
                  <span style={{ color: "#b45309", fontSize: 9 }}>GT Store</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {[{ s: "critical", c: "#ef4444", l: "Critical" }, { s: "warning", c: "#eab308", l: "Warning" }, { s: "ok", c: "#22c55e", l: "OK" }].map(st => (
                  <div key={st.s} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    <div style={{ width: 6, height: 6, borderRadius: 3, background: st.c }} />
                    <span style={{ color: st.c, fontSize: 8, fontFamily: "monospace" }}>{st.l}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ color: "#475569", fontSize: 7, fontFamily: "monospace", fontWeight: 700, marginBottom: 5 }}>REGIONS</div>
            {STORE_REGIONS.map(r => {
              const rc = r.stores.filter(s => s.status === "critical").length;
              const rw = r.stores.filter(s => s.status === "warning").length;
              const matched = r.stores.filter(filterFn).length;
              return (
                <div key={r.id} onClick={() => { if (r.stores.length > 0) setSelectedStore(r.stores.find(s => s.status === "critical") || r.stores[0]); }}
                  style={{ background: "#ffffff", borderRadius: 5, padding: "6px 9px", marginBottom: 3, cursor: "pointer", borderLeft: `2px solid ${rc > 0 ? "#ef4444" : rw > 0 ? "#eab308" : "#22c55e"}33`, transition: "background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#e2e8f0"} onMouseLeave={e => e.currentTarget.style.background = "#ffffff"}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#1e293b", fontSize: 10, fontWeight: 600 }}>{r.name}</span>
                    <div style={{ display: "flex", gap: 4 }}>
                      {rc > 0 && <span style={{ background: "#dc262622", color: "#dc2626", fontSize: 7, padding: "1px 4px", borderRadius: 3, fontFamily: "monospace", fontWeight: 700 }}>{rc} crit</span>}
                      {rw > 0 && <span style={{ background: "#eab30822", color: "#ca8a04", fontSize: 7, padding: "1px 4px", borderRadius: 3, fontFamily: "monospace", fontWeight: 700 }}>{rw} warn</span>}
                      {hasFilter && <span style={{ background: "#2563eb22", color: "#60a5fa", fontSize: 7, padding: "1px 4px", borderRadius: 3, fontFamily: "monospace", fontWeight: 700 }}>{matched} match</span>}
                    </div>
                  </div>
                  <div style={{ color: "#475569", fontSize: 8, marginTop: 1 }}>
                    <span style={{ color: "#ef444488", fontFamily: "monospace" }}>{r.stores.filter(s => s.type === "wcm").length} WCM</span>
                    <span style={{ color: "#94a3b8" }}> &#8226; </span>
                    <span style={{ color: "#f59e0b88", fontFamily: "monospace" }}>{r.stores.filter(s => s.type === "gt").length} GT</span>
                  </div>
                </div>
              );
            })}

            <div style={{ color: "#475569", fontSize: 7, fontFamily: "monospace", fontWeight: 700, marginBottom: 5, marginTop: 10 }}>CRITICAL STORES</div>
            {ALL_STORES.filter(s => s.status === "critical" && (!hasFilter || matchedIds.has(s.id))).map(s => (
              <div key={s.id} onClick={() => setSelectedStore(s)}
                style={{ background: "#ffffff", borderRadius: 5, padding: "5px 8px", marginBottom: 2, cursor: "pointer", borderLeft: "2px solid #ef4444", transition: "background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = "#e2e8f0"} onMouseLeave={e => e.currentTarget.style.background = "#ffffff"}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ color: s.type === "wcm" ? "#ef4444" : "#f59e0b", fontSize: 7, fontFamily: "monospace", fontWeight: 700 }}>{s.type === "wcm" ? "WCM" : "GT"}</span>
                  <span style={{ color: "#1e293b", fontSize: 9, fontWeight: 600, flex: 1 }}>{s.name}</span>
                  <span style={{ color: "#475569", fontSize: 7, fontFamily: "monospace" }}>{s.region}</span>
                </div>
                <div style={{ color: "#94a3b8", fontSize: 8, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.alerts[0]}</div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

// ============================================================
// MAIN APP — MasanEyeDemo (6 tabs)
// ============================================================
export default function MasanEyeDemo() {
  const [tab, setTab] = useState("query");
  const [scenario, setScenario] = useState(null);
  const [inputVal, setInputVal] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("wcm_d2_ops");
  const [contactModal, setContactModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [mapFilter, setMapFilter] = useState("all");
  const scrollRef = useRef(null);

  const navigateToMap = (filterId) => { setMapFilter(filterId || "all"); setTab("storemap"); };

  const handleAction = (label, type, toastMsg) => {
    if (toastMsg) {
      setToast(toastMsg);
    } else if (type === "llm") {
      setToast(`Deploying ${label} Agent...`);
    } else if (type === "finance") {
      setToast(`\u2713 ${label} initiated`);
    } else {
      setToast(`\u2713 ${label}`);
    }
  };

  useEffect(() => {
    if (!scrollRef.current || !scenario) return;
    const s2 = SCENARIOS[scenario];
    if (!s2) return;
    const dur = s2.sources.length * 1400 + 800 + s2.answer.points.length * 1200 + 3000;
    const iv = setInterval(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, 150);
    const t = setTimeout(() => clearInterval(iv), dur);
    return () => { clearInterval(iv); clearTimeout(t); };
  }, [scenario]);

  const sc = scenario ? SCENARIOS[scenario] : null;

  return (
    <div style={{ background: "#f8fafc", height: "100vh", fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif", color: "#1e293b", display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500;700&display=swap');
        @keyframes fadeSlide { from { opacity:0; transform:translateY(5px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:3px} ::-webkit-scrollbar-thumb:hover{background:#94a3b8}
      `}</style>

      <WebGLHexField />

      {/* HEADER \u2014 glass effect */}
      <div style={{ padding: "8px 18px", borderBottom: "1px solid rgba(226,232,240,0.8)", display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.82)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", flexShrink: 0, position: "relative", zIndex: 2 }}>
        <div style={{ width: 30, height: 30, borderRadius: 6, background: "linear-gradient(135deg,#2563eb,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color: "#fff" }}>M</div>
        <div><div style={{ fontWeight: 700, fontSize: 14 }}>MasanEye</div><div style={{ color: "#475569", fontSize: 8, fontFamily: "monospace" }}>Operational Intelligence Platform v7</div></div>

        <div style={{ marginLeft: 24, display: "flex", gap: 2, background: "rgba(241,245,249,0.7)", borderRadius: 6, padding: 2 }}>
          {[
            { id: "query", label: "\ud83c\udfaf Management Master View" },
            { id: "ingest", label: "\ud83d\udc41\ufe0f Zalo + SUPRA Ingestion" },
            { id: "directcoverage", label: "\ud83d\udcca Direct Coverage MCH" },
            { id: "winplus", label: "\ud83c\udfea Win+ Intelligence" },
            { id: "finance", label: "\ud83d\udcb0 Finance & Covenants" },
            { id: "storemap", label: "\u2b21 Store Map" },
          ].map(t2 => (
            <button key={t2.id} onClick={() => setTab(t2.id)} style={{
              padding: "5px 10px", borderRadius: 4, border: "none", cursor: "pointer",
              background: tab === t2.id ? "#ffffff" : "transparent", color: tab === t2.id ? "#1e293b" : "#64748b",
              fontSize: 9, fontWeight: tab === t2.id ? 600 : 400, fontFamily: "inherit", transition: "all 0.15s",
              boxShadow: tab === t2.id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}>{t2.label}</button>
          ))}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {[{n:"Zalo",c:"#0068FF"},{n:"POS",c:"#16A34A"},{n:"SUPRA",c:"#06b6d4"},{n:"Direct MCH",c:"#2563eb"},{n:"Win+",c:"#0891b2"},{n:"PLH",c:"#f59e0b"},{n:"Finance",c:"#16a34a"}].map(s => (
            <div key={s.n} style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <div style={{ width: 4, height: 4, borderRadius: 2, background: "#4ade80", animation: "pulse 2s infinite" }} />
              <span style={{ color: s.c, fontSize: 7, fontFamily: "monospace", fontWeight: 600 }}>{s.n}</span>
            </div>
          ))}
        </div>
      </div>

      {/* TICKER */}
      <div style={{ position: "relative", zIndex: 1 }}><Ticker /></div>

      {/* TAB 1: QUERY */}
      {tab === "query" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative", zIndex: 1 }}>
          <div ref={scrollRef} style={{ flex: 1, overflow: "auto", padding: "12px 18px" }}>
            {!sc ? (
              <div style={{ animation: "fadeSlide 0.4s" }}>
                <div style={{ color: "#94a3b8", fontSize: 17, fontWeight: 300, marginBottom: 14 }}>H\u1ecfi em b\u1ea5t c\u1ee9 \u0111i\u1ec1u g\u00ec.</div>
                <div style={{ color: "#475569", fontSize: 8, fontFamily: "monospace", marginBottom: 5, fontWeight: 700 }}>SUGGESTED \u2014 with Direct MCH + Win+ + Finance data</div>
                {Object.entries(SCENARIOS).map(([k, s]) => (
                  <button key={k} onClick={() => setScenario(k)} style={{ display: "block", width: "100%", textAlign: "left", background: "rgba(255,255,255,0.85)", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", marginBottom: 5, color: "#475569", fontSize: 12, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
                    onMouseEnter={e => e.target.style.borderColor = "#2563eb"} onMouseLeave={e => e.target.style.borderColor = "#e2e8f0"}>
                    "{s.query}"
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ animation: "fadeSlide 0.3s" }}>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}><div style={{ background: "#2563eb", borderRadius: "10px 10px 2px 10px", padding: "8px 13px", maxWidth: "70%", fontSize: 12, color: "#fff" }}>{sc.query}</div></div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6, color: "#64748b", fontSize: 9, fontFamily: "monospace" }}><div style={{ width: 5, height: 5, borderRadius: 3, background: "#eab308", animation: "pulse 1s infinite" }} />Querying {sc.sources.length} sources (Zalo + POS + SUPRA + Direct MCH + Win+ + Finance)...</div>
                {sc.sources.map((src, i) => <SourceCard key={i} source={src} delay={i * 1400} />)}
                <AnswerBlock answer={sc.answer} delay={sc.sources.length * 1400 + 800} onContact={(m, p) => setContactModal({ method: m, person: p })} onAction={handleAction} onNavigateMap={navigateToMap} />
                <button onClick={() => setScenario(null)} style={{ marginTop: 10, background: "transparent", border: "1px solid #e2e8f0", borderRadius: 4, padding: "4px 10px", color: "#64748b", fontSize: 9, cursor: "pointer", fontFamily: "monospace" }}>\u2190 Back</button>
              </div>
            )}
          </div>
          <div style={{ padding: "7px 18px", borderTop: "1px solid rgba(226,232,240,0.6)", background: "rgba(241,245,249,0.75)", backdropFilter: "blur(12px)", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.9)", border: "1px solid #e2e8f0", borderRadius: 8, padding: "0 12px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <input value={inputVal} onChange={e => setInputVal(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && inputVal.trim()) { const l = inputVal.toLowerCase(); const keys = Object.keys(SCENARIOS); if (l.includes("chin") || l.includes("gt")) setScenario(keys.find(k => k.includes("chinsu")) || keys[1]); else if (l.includes("margin") || l.includes("meatdeli")) setScenario(keys.find(k => k.includes("margin") || k.includes("meat")) || keys[2]); else if (l.includes("finance") || l.includes("covenant") || l.includes("nwc")) setScenario(keys.find(k => k.includes("finance")) || keys[0]); else if (l.includes("win") || l.includes("rural")) setScenario(keys.find(k => k.includes("win")) || keys[0]); else setScenario(keys[0]); setInputVal(""); } }}
                placeholder="H\u1ecfi g\u00ec c\u0169ng \u0111\u01b0\u1ee3c... (th\u1eed: 'Chin-su GT mi\u1ec1n Nam?' or 'NWC status?')" style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#1e293b", fontSize: 12, padding: "9px 0", fontFamily: "inherit" }} />
              <span style={{ color: "#475569", fontSize: 8, fontFamily: "monospace" }}>\u23ce</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ZALO + SUPRA INGESTION */}
      {tab === "ingest" && (
        <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative", zIndex: 1 }}>
          <ZaloGroupList groups={ZALO_GROUPS} selectedId={selectedGroup} onSelect={setSelectedGroup} />
          <ZaloChatView group={ZALO_GROUPS.find(g => g.id === selectedGroup)} />
          <ProcessingPanel groupId={selectedGroup} />
        </div>
      )}

      {/* TAB 3: DIRECT COVERAGE MCH */}
      {tab === "directcoverage" && <div style={{ flex: 1, display: "flex", position: "relative", zIndex: 1 }}><DirectCoverageTab onAction={handleAction} /></div>}

      {/* TAB 4: WIN+ INTELLIGENCE */}
      {tab === "winplus" && <div style={{ flex: 1, display: "flex", position: "relative", zIndex: 1 }}><WinPlusTab onAction={handleAction} /></div>}

      {/* TAB 5: FINANCE & COVENANTS */}
      {tab === "finance" && <div style={{ flex: 1, display: "flex", position: "relative", zIndex: 1 }}><FinanceTab onAction={handleAction} /></div>}

      {/* TAB 6: STORE MAP */}
      {tab === "storemap" && <div style={{ flex: 1, display: "flex", position: "relative", zIndex: 1 }}><HexMapTab initialFilter={mapFilter} onNavigateBack={() => setTab("query")} /></div>}

      {/* Contact Modal */}
      {contactModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.2)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }} onClick={() => setContactModal(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, minWidth: 290, boxShadow: "0 25px 60px rgba(0,0,0,0.12)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: "linear-gradient(135deg,#e2e8f0,#cbd5e1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#1e293b", fontFamily: "monospace" }}>{contactModal.person.avatar}</div>
              <div><div style={{ color: "#0f172a", fontSize: 14, fontWeight: 700 }}>{contactModal.person.name}</div><div style={{ color: "#64748b", fontSize: 10 }}>{contactModal.person.role}</div></div>
            </div>
            {[{ l: "Phone", v: contactModal.person.phone }, { l: "Email", v: contactModal.person.email }].map((b, i) => (
              <div key={i} style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 6, padding: "7px 10px", marginBottom: 5, display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ fontSize: 14 }}>{i === 0 ? "\ud83d\udcde" : "\u2709\ufe0f"}</span>
                <div><div style={{ color: "#94a3b8", fontSize: 8 }}>{b.l}</div><div style={{ color: "#1e293b", fontSize: 12, fontFamily: "monospace" }}>{b.v}</div></div>
              </div>
            ))}
            <button onClick={() => setContactModal(null)} style={{ width: "100%", marginTop: 8, padding: "7px", background: "#2563eb", border: "none", borderRadius: 6, color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Close</button>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && <div style={{ position: "fixed", bottom: 16, right: 16, zIndex: 998, background: "linear-gradient(135deg,#16a34a,#0891b2)", borderRadius: 7, padding: "10px 16px", color: "#fff", fontSize: 11, fontWeight: 600, animation: "fadeSlide 0.3s", boxShadow: "0 4px 16px rgba(0,0,0,0.4)", maxWidth: 420, lineHeight: 1.4 }}>\u2713 {toast}{(() => { setTimeout(() => setToast(null), 3500); return null; })()}</div>}
    </div>
  );
}

// ============================================================
// TICKER (updated for v7 with Direct MCH + Win+ + PLH + Finance)
// ============================================================
function Ticker() {
  const [t, setT] = useState(0);
  useEffect(() => { const iv = setInterval(() => setT(x => x + 1), 2800); return () => clearInterval(iv); }, []);
  const a = [
    "\ud83d\udd34 STOCKOUT: MEATDeli X\u00fac x\u00edch \u2014 12 WCM + 47 GT stores D2 | Direct MCH confirms 38k store impact",
    "\ud83d\udcca DIRECT MCH: 127 GT stores stopped ordering MEATDeli (30d) \u2014 field reps confirm competitor substitution",
    "\ud83c\udfed SUPRA: Cold chain compliance 88.4% \u2014 DC C\u1ea7n Th\u01a1 critical | Truck #7 compressor ETA 10d",
    "\ud83c\udfea WIN+: 4,200 partners active \u2014 rural penetration +18% MoM | Omachi leading sell-through",
    "\ud83d\udcb0 FINANCE: Net Debt/EBITDA at 2.7x (limit 3.5x) \u2014 NWC optimization targeting \u20ab600B reduction",
    "\ud83d\udd34 COVENANT: Interest Coverage 4.8x trending to 4.2x year-end \u2014 monitor required",
    "\ud83d\udfe2 PLH: Private label margin +680bps vs branded \u2014 Snacks PMF score 82/100, ready to scale",
    "\ud83d\udfe1 CAPEX: WCM store conversion ROI 340% \u2014 Reallocation Agent recommends +\u20ab120B shift",
    "\ud83c\udfea WIN+: Rural partner growth +31% in 6 months \u2014 Mekong Delta showing strongest adoption",
    "\ud83d\udcca DIRECT MCH: Magi gaining +5% GT share in Mekong Delta \u2014 field reps deploying counter-promo",
  ];
  return <div style={{ background: "rgba(241,245,249,0.8)", borderBottom: "1px solid rgba(226,232,240,0.6)", padding: "4px 18px", height: 22, flexShrink: 0, overflow: "hidden", backdropFilter: "blur(8px)" }}><div style={{ color: "#64748b", fontSize: 9, fontFamily: "'JetBrains Mono',monospace", whiteSpace: "nowrap" }}>{a[t % a.length]}</div></div>;
}
