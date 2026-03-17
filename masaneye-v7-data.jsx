import { useState, useEffect, useRef } from "react";
import * as THREE from "three";

// ============================================================
// WEBGL HEXAGONAL PARTICLE FIELD
// ============================================================
const WebGLHexField = () => {
  const mountRef = useRef(null);
  const rafRef = useRef(0);
  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const W = el.clientWidth, H = el.clientHeight;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-W/2, W/2, H/2, -H/2, 0.1, 100);
    camera.position.z = 10;

    // --- Hex grid particles ---
    const hexR = 30;
    const hexH = hexR * Math.sqrt(3);
    const cols = Math.ceil(W / (hexR * 1.5)) + 4;
    const rows = Math.ceil(H / hexH) + 4;
    const N = cols * rows;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const sizes = new Float32Array(N);
    const phase = new Float32Array(N);
    const alpha = new Float32Array(N);

    let i = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        pos[i*3]   = c * hexR * 1.5 - W/2 - hexR * 2;
        pos[i*3+1] = r * hexH + (c%2) * hexH/2 - H/2 - hexH;
        pos[i*3+2] = 0;
        const p = Math.random();
        if (p < 0.35)      { col[i*3]=0.15; col[i*3+1]=0.39; col[i*3+2]=0.93; }
        else if (p < 0.55) { col[i*3]=0.49; col[i*3+1]=0.23; col[i*3+2]=0.93; }
        else if (p < 0.72) { col[i*3]=0.96; col[i*3+1]=0.62; col[i*3+2]=0.04; }
        else if (p < 0.85) { col[i*3]=0.08; col[i*3+1]=0.55; col[i*3+2]=0.82; }
        else               { col[i*3]=0.13; col[i*3+1]=0.70; col[i*3+2]=0.42; }
        sizes[i] = hexR * (0.6 + Math.random() * 0.5);
        phase[i] = Math.random() * Math.PI * 2;
        alpha[i] = 0.012 + Math.random() * 0.028;
        i++;
      }
    }

    const vs = `
      attribute float size;
      attribute float aPhase;
      attribute float aAlpha;
      attribute vec3 aColor;
      uniform float uTime;
      varying vec3 vCol;
      varying float vA;
      void main(){
        vCol = aColor;
        float w = sin(uTime*0.35 + aPhase)*0.5+0.5;
        float d = length(position.xy)/600.0;
        float pulse = sin(uTime*0.18 + d*2.5)*0.5+0.5;
        vA = aAlpha * (0.4 + w*0.6) * (0.5 + pulse*0.5);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        gl_PointSize = size * (0.85 + w*0.15);
      }
    `;
    const fs = `
      varying vec3 vCol;
      varying float vA;
      void main(){
        vec2 p = gl_PointCoord*2.0-1.0;
        vec2 a = abs(p);
        float hex = max(a.x*0.866+a.y*0.5, a.y) - 0.82;
        if(hex > 0.0) discard;
        float edge = smoothstep(0.0, -0.08, hex);
        float inner = smoothstep(-0.2, -0.55, hex);
        float al = (edge - inner*0.65) * vA;
        gl_FragColor = vec4(vCol, al);
      }
    `;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(alpha, 1));
    const mat = new THREE.ShaderMaterial({
      vertexShader: vs, fragmentShader: fs,
      uniforms: { uTime: { value: 0 } },
      transparent: true, depthWrite: false, blending: THREE.NormalBlending,
    });
    scene.add(new THREE.Points(geo, mat));

    // --- Subtle connection lines between neighbors ---
    const lp = [], la = [];
    for (let a2 = 0; a2 < Math.min(N, 400); a2++) {
      for (let b = a2+1; b < Math.min(N, 400); b++) {
        const dx = pos[a2*3]-pos[b*3], dy = pos[a2*3+1]-pos[b*3+1];
        if (Math.sqrt(dx*dx+dy*dy) < hexR*2.2 && Math.random() < 0.08) {
          lp.push(pos[a2*3],pos[a2*3+1],0, pos[b*3],pos[b*3+1],0);
        }
      }
    }
    if (lp.length) {
      const lg = new THREE.BufferGeometry();
      lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
      scene.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x2563eb, transparent: true, opacity: 0.025 })));
    }

    const tick = () => {
      rafRef.current = requestAnimationFrame(tick);
      mat.uniforms.uTime.value += 0.016;
      renderer.render(scene, camera);
    };
    tick();

    const onResize = () => {
      const w2 = el.clientWidth, h2 = el.clientHeight;
      camera.left=-w2/2; camera.right=w2/2; camera.top=h2/2; camera.bottom=-h2/2;
      camera.updateProjectionMatrix();
      renderer.setSize(w2, h2);
    };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
      geo.dispose(); mat.dispose(); renderer.dispose();
    };
  }, []);
  return <div ref={mountRef} style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }} />;
};

// ============================================================
// DATA SOURCE TYPES
// ============================================================
const DATA_SOURCES = {
  zalo:       { label: "Zalo",                icon: "💬", color: "#0068FF" },
  pos:        { label: "WCM POS",             icon: "🧾", color: "#16A34A" },
  supra:      { label: "SUPRA Logistics",     icon: "🏭", color: "#06b6d4" },
  direct_mch: { label: "Direct Coverage MCH", icon: "📊", color: "#f59e0b" },
  winplus:    { label: "Win+",                icon: "🏪", color: "#10b981" },
  plh:        { label: "Phuc Long Heritage",  icon: "🍵", color: "#059669" },
  email:      { label: "Internal Reports",    icon: "📧", color: "#7C3AED" },
  finance:    { label: "Internal Finance",    icon: "💰", color: "#6366f1" },
};

// ============================================================
// PEOPLE DIRECTORY
// ============================================================
const PEOPLE = {
  "sc_head":      { name: "Trương Công Minh",  role: "Head of Supply Chain — MEATDeli",     phone: "+84 912 345 678", email: "cong.minh@meatdeli.vn",        avatar: "TCM" },
  "trade_mkt":    { name: "Hoàng Minh Châu",   role: "Trade Marketing — D2",               phone: "+84 906 890 123", email: "minh.chau@wincommerce.vn",     avatar: "HMC" },
  "hr_d2":        { name: "Lê Thị Hương",      role: "HR Business Partner — D2",           phone: "+84 905 678 901", email: "thi.huong@masan.vn",           avatar: "LTH" },
  "cat_mgr":      { name: "Nguyễn Hải",        role: "Category Manager — Fresh",           phone: "+84 908 567 890", email: "hai.nguyen@wincommerce.vn",     avatar: "NH"  },
  "supra_south":  { name: "Deepak Singh",      role: "CEO — SUPRA",                        phone: "+84 916 111 222", email: "deepak.singh@supra.vn",         avatar: "DS"  },
  "supra_ops":    { name: "Nguyễn Thanh Tùng", role: "DC Ops Manager — South",             phone: "+84 917 222 333", email: "thanh.tung@supra.vn",           avatar: "NTT" },
  "mch_gt":       { name: "Lê Quốc Bảo",      role: "GT Channel Director — MCH",          phone: "+84 918 333 444", email: "quoc.bao@masanconsumer.vn",     avatar: "LQB" },
  "dc_cantho":    { name: "Phạm Tuấn",         role: "DC Manager — Cần Thơ",               phone: "+84 914 012 345", email: "tuan.pham@meatdeli.vn",         avatar: "PT"  },
  "procurement":  { name: "Phan Thanh Sơn",    role: "Procurement Director — MEATDeli",    phone: "+84 913 901 234", email: "thanh.son@meatdeli.vn",         avatar: "PTS" },
  "plh_head":     { name: "Nguyễn Thanh Phong", role: "CEO — Phuc Long Heritage",          phone: "+84 919 444 555", email: "thanh.phong@phuclong.vn",       avatar: "NTP" },
  "mch_direct":   { name: "Trần Đức Minh",     role: "Direct Coverage Director — MCH",     phone: "+84 920 555 666", email: "duc.minh@masanconsumer.vn",     avatar: "TDM" },
  "winplus_head": { name: "Lê Minh Hoàng",     role: "Win+ Channel Director — WCM",        phone: "+84 921 666 777", email: "minh.hoang@wincommerce.vn",     avatar: "LMH" },
  "cfo":          { name: "Nguyễn Hoàng Anh",  role: "Group CFO — Masan",                  phone: "+84 922 777 888", email: "hoang.anh@masan.vn",            avatar: "NHA" },
  "wcm_rural":    { name: "Phạm Thị Linh",     role: "Rural Strategy Director — WCM",      phone: "+84 923 888 999", email: "thi.linh@wincommerce.vn",       avatar: "PTL" },
};

// ============================================================
// DANNY QUERY SCENARIOS (6 scenarios — Direct Coverage MCH, Win+, PLH, Finance)
// ============================================================
const SCENARIOS = {

  // ----------------------------------------------------------
  // SCENARIO 1: MCH Direct Coverage Recovery Tracking
  // ----------------------------------------------------------
  "mch_recovery": {
    query: "How's our Direct Coverage MCH performance in March MTD across different areas?",
    sources: [
      { type: "direct_mch", name: "Direct Coverage MCH — National MTD", icon: "📊", color: "#f59e0b", items: [
        { metric: "March MTD Revenue — National", value: "₫847B vs ₫920B target", delta: "92% achievement", flag: "BELOW" },
        { metric: "Area — HCM & Southeast", value: "₫312B — 94% achievement", detail: "Strong Chin-su (₫118B, +11%). MEATDeli weak (₫34B, -22%). 12,400 stores active of 13,200 target.", flag: "STABLE" },
        { metric: "Area — Mekong Delta", value: "₫148B — 87% achievement", detail: "Lowest performing area. Magi price undercut -15% at 340+ stores. Cold chain gaps limiting MEATDeli. 8,200 stores active of 9,400 target.", flag: "DECLINING" },
        { metric: "Area — Central", value: "₫167B — 91% achievement", detail: "Omachi driving growth (₫62B, +9%). PLH packaged expanding well (+34% MoM). 6,800 stores active.", flag: "STABLE" },
        { metric: "Area — North", value: "₫220B — 96% achievement", detail: "Best performing region. Chin-su (₫82B, +14%), Omachi (₫68B, +8%), Wake-Up (₫31B, +3%). 10,800 stores active — exceeding 10,600 target.", flag: "GROWING" },
        { metric: "Direct Coverage Stores Active", value: "34,200 of 38,000 target", detail: "90% activation rate. New store additions March: 1,240 vs 1,500 target (83%). Churn: 380 stores went inactive.", flag: "BELOW" },
        { metric: "Top BU — Chin-su Condiments", value: "₫312B MTD", detail: "+8% vs plan (target ₫290B). 108% achievement. 28,400 stores carrying. Strongest in North + HCM.", flag: "GROWING" },
        { metric: "Top BU — Omachi/Kokomi Noodles", value: "₫218B MTD", detail: "+3% vs plan (target ₫212B). 103% achievement. 26,100 stores. Growth in Central + rural.", flag: "GROWING" },
        { metric: "Underperforming — Wake-Up/Vinacafé", value: "₫104B MTD", detail: "-5% vs plan (target ₫110B). 95% achievement. 18,200 stores. Trung Nguyên competitive pressure in North.", flag: "DECLINING" },
        { metric: "Underperforming — MEATDeli (via Direct)", value: "₫89B MTD", detail: "-18% vs plan (target ₫108B). 82% achievement. Only 8,400 of 12,000 target stores active. Cold chain + pricing issues.", flag: "DECLINING" },
        { metric: "Underperforming — Nam Ngư", value: "₫62B MTD", detail: "-7% vs plan (target ₫67B). 93% achievement. 15,600 stores. Magi substitution in Mekong.", flag: "DECLINING" },
      ]},
      { type: "zalo", name: "Zalo — MCH Field Teams", icon: "💬", color: "#0068FF", items: [
        { group: "MCH — Direct Coverage Mekong", sender: "Võ Hoàng — ASM Mekong", msg: "Mekong Delta struggling hard. Magi đẩy mạnh ở chợ Cần Thơ, Vĩnh Long — giá rẻ hơn 15%. Reps reporting store owners hesitant to reorder Chin-su.", time: "08:12" },
        { group: "MCH — Direct Coverage Mekong", sender: "Trần Tâm — Rep Đồng Tháp", msg: "Nhiều tiệm hỏi combo Tết Chin-su — hết hàng ko restock. Mất deal vì OOS.", time: "08:30" },
        { group: "MCH — Direct Coverage North", sender: "Nguyễn Hà — ASM Hà Nội", msg: "North team exceeding target! Chin-su + Omachi combo driving store additions. Added 420 new stores this month.", time: "09:15" },
        { group: "MCH — Direct Coverage HCM", sender: "Lê Phương — ASM HCM East", msg: "HCM competitive pressure from Circle K + GS25. GT stores near modern trade losing traffic. MEATDeli hardest hit.", time: "10:05" },
        { group: "MCH — Direct Coverage HCM", sender: "Trần Khoa — Rep Thủ Đức", msg: "MEATDeli xúc xích almost impossible to sell — cold chain inconsistent, stores don't trust freshness anymore.", time: "10:22" },
      ]},
      { type: "winplus", name: "Win+ — Cross-channel Read", icon: "🏪", color: "#10b981", items: [
        { metric: "Win+ stores in Direct Coverage areas", value: "2,840 partners overlapping", detail: "Win+ and Direct Coverage serve overlapping geography. Win+ sell-through data provides demand signal for Direct Coverage planning.", flag: "INSIGHT" },
        { metric: "Win+ vs Direct — Chin-su", value: "Win+ sell-through 94% vs Direct 88%", detail: "Win+ partners reorder faster (every 5.2 days vs Direct avg 7.8 days). Win+ model shows higher engagement.", flag: "GROWING" },
        { metric: "Win+ — MEATDeli challenge", value: "Sell-through only 52%", detail: "Win+ partners also struggling with MEATDeli. Cold chain last-mile is shared bottleneck across channels.", flag: "DECLINING" },
      ]},
      { type: "supra", name: "SUPRA — Distribution Performance", icon: "🏭", color: "#06b6d4", items: [
        { metric: "Delivery to Direct Coverage stores — National", value: "89% on-time", detail: "Target 95%. Mekong at 82%, North at 96%. DC Cần Thơ capacity constraining Mekong deliveries.", flag: "BELOW" },
        { metric: "New store first-delivery SLA", value: "72% within 48h", detail: "1,240 new stores added — 348 waited >48h for first delivery. Impacts activation rate.", flag: "BELOW" },
        { metric: "MEATDeli cold chain — Direct stores", value: "Cold chain compliance 86%", detail: "Below 97% target. 14 temp excursions this week. Mekong + HCM Southeast worst affected.", flag: "CRITICAL" },
      ]},
      { type: "plh", name: "Phuc Long — Direct Coverage Performance", icon: "🍵", color: "#059669", items: [
        { metric: "PLH Packaged in Direct Coverage stores", value: "₫47B MTD — 124% of target", detail: "12,800 stores now carrying PLH packaged. +22% vs plan. Fastest growing BU in direct coverage.", flag: "GROWING" },
        { metric: "PLH + Wake-Up combo", value: "₫18B MTD", detail: "Bundle performing well in rural. 3,200 stores trialing combo. 78% reorder rate after first purchase.", flag: "GROWING" },
      ]},
    ],
    answer: {
      summary: "Direct Coverage MCH at 92% achievement (₫847B vs ₫920B). North exceeding (+96%), Mekong dragging (87%). MEATDeli is the weakest BU at 82% achievement. PLH is the surprise star at 124%.",
      points: [
        { title: "🔴 Mekong Delta underperformance — 87% achievement, competitive + logistics", detail: "Mekong is ₫22B below plan. Root causes: (1) Magi undercut 15% on Chin-su at 340+ stores, (2) Cold chain compliance only 82% limiting MEATDeli, (3) SUPRA delivery to Mekong only 82% on-time vs 95% target. Zalo field teams confirm store owners hesitant to reorder. Win+ data shows same pattern — MEATDeli sell-through only 52%.", action: "Two-pronged: defensive pricing on Chin-su in Mekong + fix SUPRA delivery. Deploy Media Buyer Agent to shift ad spend for Chin-su and MEATDeli to Mekong region across FB/Google/TikTok.", pic: "mch_direct", impact: "₫22B", impactLabel: "MTD gap vs plan", actions: [{ label: "Deploy Media Buyer Agent — Mekong", type: "critical" }, { label: "Increase Chin-su Production for Mekong", type: "critical" }, { label: "SUPRA Route Fix — Cần Thơ DC", type: "warning" }] },
        { title: "🟡 MEATDeli direct coverage declining — 82% achievement, 8,400 of 12,000 stores", detail: "MEATDeli is ₫19B below plan across direct coverage. Only 70% store activation (vs 90% avg for other BUs). Cold chain compliance 86% (target 97%) — 14 temp excursions this week. Zalo: reps say stores don't trust freshness anymore. This is a cross-channel problem — Win+ shows same 52% sell-through.", action: "Fix cold chain first (precondition for everything else). Then retrain coverage reps with MEATDeli-specific talking points focused on quality assurance + freshness guarantee.", pic: "supra_ops", impact: "₫19B", impactLabel: "MTD gap vs plan", actions: [{ label: "Retrain Coverage Reps — MEATDeli Playbook", type: "warning" }, { label: "Adjust Pricing Agent — MEATDeli Competitive Response", type: "warning" }, { label: "Cold Chain Emergency Fix", type: "critical" }] },
        { title: "🟢 Northern outperformance — 96% achievement, scale playbook", detail: "North at ₫220B, exceeding target. 420 new stores added (vs 380 target). Key drivers: Chin-su + Omachi combo strategy, strong rep relationships, SUPRA North 96% on-time delivery. PLH also growing fast in North (+28% MoM). This playbook is replicable — combo bundling + reliable logistics = store trust.", action: "Document North playbook and deploy to Central (next closest at 91%). Reallocate ₫3B marketing budget from HCM urban (saturated) to Central + Mekong.", pic: "mch_direct", impact: "₫8B", impactLabel: "upside if Central reaches 96%", actions: [{ label: "Scale North Playbook to Central", type: "normal" }, { label: "Budget Reallocation Agent — Shift ₫3B", type: "warning" }] },
      ],
      footer: "Cross-channel insight: Win+ data validates Direct Coverage patterns. MEATDeli weakness is systemic (both channels show ~50% sell-through). PLH is the growth story — 124% achievement via direct coverage, consider accelerating distribution.",
      entities: [
        { type: "area", name: "Mekong Delta", status: "critical" }, { type: "area", name: "North", status: "ok" },
        { type: "area", name: "HCM & Southeast", status: "warning" }, { type: "area", name: "Central", status: "ok" },
        { type: "product", name: "MEATDeli", status: "critical" }, { type: "product", name: "Chin-su", status: "ok" },
        { type: "product", name: "PLH Packaged", status: "ok" }, { type: "competitor", name: "Magi — Mekong", status: "warning" },
      ]
    }
  },

  // ----------------------------------------------------------
  // SCENARIO 2: WCM Rural Scaling Deep-Dive
  // ----------------------------------------------------------
  "wcm_rural": {
    query: "What's the SKU performance in rural stores? Where can we ramp?",
    sources: [
      { type: "pos", name: "WCM POS — Rural Cluster", icon: "🧾", color: "#16A34A", items: [
        { metric: "Rural Store Revenue MTD", value: "₫2.8T", detail: "2,847 rural stores. Avg basket ₫42K (vs urban ₫78K). Revenue per store ₫983M/month — 46% below urban avg.", flag: "STABLE" },
        { metric: "Top Rural SKU #1 — Chin-su Nước mắm 500ml", value: "₫420B MTD", detail: "Penetration 94% of rural stores. Avg 32 bottles/store/week. Dominant — no real competition in rural GT.", flag: "GROWING" },
        { metric: "Top Rural SKU #2 — Omachi Tôm chua cay 5-pack", value: "₫380B MTD", detail: "Penetration 89%. Avg 24 packs/store/week. Slight cannibalization with Kokomi at overlap stores.", flag: "GROWING" },
        { metric: "Top Rural SKU #3 — Wake-Up 247 10-pack", value: "₫210B MTD", detail: "Penetration 71%. Strong morning purchase pattern. Under-indexed vs urban (85% pen).", flag: "STABLE" },
        { metric: "Rural Basket Composition", value: "68% dry goods, 22% beverages, 10% fresh/chilled", detail: "Fresh/chilled severely under-represented due to cold chain. MEATDeli only in 340 of 2,847 rural stores (12%).", flag: "INSIGHT" },
        { metric: "Rural Growth Rate", value: "+14% YoY", detail: "Outpacing urban (+6% YoY). 320 new rural stores opened in Q1. Target: 500 by Q2.", flag: "GROWING" },
      ]},
      { type: "winplus", name: "Win+ — Rural Feed", icon: "🏪", color: "#10b981", items: [
        { metric: "Win+ Rural Partners", value: "1,420 partners", detail: "340 Win+ partners in rural areas. Sell-through data shows strong demand for packaged goods. Avg order ₫1.8M/week (vs urban ₫2.8M).", flag: "STABLE" },
        { metric: "Win+ Rural Top Seller — PLH Trà Sen 250ml", value: "Sell-through 78%", detail: "Surprising rural PMF. Packaged tea replacing loose tea in younger demographics. Reorder every 8.1 days.", flag: "GROWING" },
        { metric: "Win+ Rural — MEATDeli Xúc xích", value: "Sell-through only 38%", detail: "Cold chain last-mile kills rural MEATDeli. Product arrives warm at 23% of rural Win+ partners. Returns 8.4%.", flag: "DECLINING" },
        { metric: "Win+ Rural — Omachi/Kokomi Overlap", value: "42% of partners carry both", detail: "Where both are stocked, combined noodle sell-through is 91% but per-SKU drops 15%. Cannibalization confirmed.", flag: "INSIGHT" },
      ]},
      { type: "direct_mch", name: "Direct Coverage — Rural Read", icon: "📊", color: "#f59e0b", items: [
        { metric: "MCH Direct Coverage — Rural Stores", value: "8,400 rural GT stores", detail: "MCH reps covering rural GT. Chin-su dominance confirmed: 94% of rural GT carries Chin-su vs 78% urban GT.", flag: "STABLE" },
        { metric: "Rural GT Demand Pattern — MEATDeli", value: "₫12B MTD (↓24% MoM)", detail: "Cold chain gaps mean rural GT stores getting inconsistent quality. 180 rural stores stopped ordering MEATDeli in March.", flag: "DECLINING" },
        { metric: "Rural GT — PLH Packaged Growing", value: "₫8.4B MTD (+38% MoM)", detail: "PLH packaged tea entering rural GT via MCH reps. 2,400 rural stores now carry. No cold chain needed — perfect for rural.", flag: "GROWING" },
        { metric: "MCH Rep Insight — Rural Combo Demand", value: "Chin-su + Omachi + Wake-Up bundle", detail: "Reps report rural store owners prefer pre-assembled combos. Reduces ordering complexity. 68% of rural stores want combo packs.", flag: "INSIGHT" },
      ]},
      { type: "zalo", name: "Zalo — Rural Operations", icon: "💬", color: "#0068FF", items: [
        { group: "WCM — Rural Strategy", sender: "Phạm Thị Linh — Rural Director", msg: "Rural stores showing strong demand for PLH packaged tea. Need to accelerate distribution — currently only 12% of rural stores carry it.", time: "09:30" },
        { group: "WCM — Rural Strategy", sender: "Trần Đức — Rural Ops", msg: "Cold chain to rural is the bottleneck. MEATDeli spoilage in rural routes is 11% vs 4% urban. We're losing money on every rural MEATDeli delivery.", time: "10:15" },
        { group: "MCH — Rural Coverage", sender: "Nguyễn Hà — ASM Rural North", msg: "Rural GT owners love Chin-su + Omachi combo concept. Can we get pre-packed combos from production?", time: "11:00" },
      ]},
      { type: "supra", name: "SUPRA — Rural Logistics", icon: "🏭", color: "#06b6d4", items: [
        { metric: "Rural DC Coverage", value: "62% of rural stores within 4h delivery radius", detail: "38% of rural stores require >4h delivery. These stores get deliveries 2x/week vs urban daily. 12 rural micro-DCs planned but only 3 operational.", flag: "BELOW" },
        { metric: "Rural Cold Chain Utilization", value: "62%", detail: "Refrigerated trucks for rural routes at 62% utilization — not enough volume to justify dedicated cold chain. MEATDeli rural is loss-making on logistics alone.", flag: "INEFFICIENT" },
        { metric: "Rural Dry Goods Delivery", value: "94% on-time", detail: "Dry goods (Chin-su, Omachi, Wake-Up, PLH packaged) delivery works well. No cold chain needed. Route optimization could add 400 more stores.", flag: "GROWING" },
        { metric: "Last-mile Innovation — Motorbike Pilots", value: "3 pilots active", detail: "Motorbike delivery in Mekong Delta rural. 180 stores served. Cost 40% lower than truck. Only works for dry goods + packaged items.", flag: "INSIGHT" },
      ]},
      { type: "plh", name: "Phuc Long — Rural Expansion", icon: "🍵", color: "#059669", items: [
        { metric: "PLH Packaged Tea — Rural Performance", value: "₫28B MTD (+42% MoM)", detail: "PLH packaged tea performing surprisingly well in rural. No cold chain needed. Trà Sen and Trà Oolong are top sellers. Replacing loose tea purchases.", flag: "GROWING" },
        { metric: "PLH + Wake-Up Rural Combo", value: "₫8.2B MTD", detail: "PLH tea + Wake-Up coffee combo trialed at 1,200 rural stores. 74% reorder rate. Avg combo value ₫45K — premium for rural.", flag: "GROWING" },
        { metric: "PLH Rural Store Penetration", value: "12% of rural WCM (340 stores)", detail: "Huge whitespace. If scaled to 50% (1,420 stores), projected incremental revenue ₫96B/month.", flag: "INSIGHT" },
      ]},
    ],
    answer: {
      summary: "Rural cluster at ₫2.8T MTD across 2,847 stores. Dry goods dominate (68% of basket). PLH packaged tea is the breakout — +42% MoM with no cold chain needed. MEATDeli rural is value-destructive. Clear ramp opportunities in PLH + Wake-Up combo and Chin-su/Omachi bundling.",
      points: [
        { title: "🔴 Cold chain bottleneck limiting rural MEATDeli — utilization only 62%, need to unlock or pivot", detail: "SUPRA data: rural cold chain at 62% utilization — not enough MEATDeli volume to justify dedicated trucks. Spoilage 11% on rural routes (vs 4% urban). Win+ data confirms: MEATDeli sell-through only 38% at rural partners, returns 8.4%. MCH reps report 180 rural stores stopped ordering. Rural MEATDeli is currently loss-making on logistics alone.", action: "Two options: (1) Pause rural MEATDeli expansion and redirect cold chain capacity to urban where it's profitable, or (2) Invest in rural micro-DCs (₫180B capex) to fix last-mile. Recommend option 1 short-term while building case for micro-DCs.", pic: "supra_south", impact: "₫4.2B", impactLabel: "annual rural MEATDeli loss", actions: [{ label: "Pause Rural MEATDeli Expansion", type: "critical" }, { label: "Rural Micro-DC Business Case Agent", type: "warning" }] },
        { title: "🟡 Chin-su + Omachi cannibalizing each other — need SKU optimization at 42% overlap stores", detail: "Win+ data: 42% of rural partners carry both Omachi and Kokomi. Combined sell-through 91% but per-SKU drops 15%. MCH reps confirm rural stores want simpler assortment. Pre-assembled combo packs (Chin-su + Omachi + Wake-Up) have 68% demand from rural store owners. Optimization opportunity: rationalize to 1 noodle SKU per store + combo bundling.", action: "Deploy SKU optimization model: analyze store-level data to recommend Omachi OR Kokomi (not both) per store based on local demand. Create pre-packed rural combo (Chin-su + 1 noodle + Wake-Up).", pic: "wcm_rural", impact: "₫12B", impactLabel: "annual margin improvement", actions: [{ label: "Optimize SKU Mix Agent — Rural Stores", type: "warning" }, { label: "Rural Combo Pack Production", type: "normal" }] },
        { title: "🟢 PLH packaged tea + Wake-Up combo showing strong rural PMF — ramp opportunity", detail: "PLH packaged at ₫28B MTD (+42% MoM) with only 12% rural penetration (340 stores). No cold chain needed — perfect for rural logistics. PLH + Wake-Up combo at 1,200 stores shows 74% reorder rate. If scaled to 50% penetration (1,420 stores), projected ₫96B/month incremental. SUPRA confirms dry goods delivery works well at 94% on-time. Motorbike pilots could add 400 more stores at 40% lower cost.", action: "Aggressively ramp PLH distribution to 1,420 rural stores by Q2. Scale motorbike delivery pilots from 3 to 12 regions. Bundle PLH + Wake-Up as default rural beverage combo.", pic: "plh_head", impact: "₫96B", impactLabel: "monthly upside at 50% pen", actions: [{ label: "Expand PLH Distribution Agent — Rural", type: "normal" }, { label: "Scale Motorbike Delivery Pilots", type: "normal" }, { label: "PLH + Wake-Up Combo Ramp", type: "normal" }] },
      ],
      footer: "Rural is Masan's highest-growth channel (+14% YoY vs urban +6%). The strategy is clear: double down on dry goods + PLH (no cold chain), rationalize noodle overlap, and pause MEATDeli until micro-DC infrastructure is ready.",
      entities: [
        { type: "product", name: "PLH Packaged Tea", status: "ok" }, { type: "product", name: "MEATDeli Rural", status: "critical" },
        { type: "product", name: "Chin-su Rural", status: "ok" }, { type: "product", name: "Omachi/Kokomi", status: "warning" },
        { type: "dc", name: "Rural Micro-DCs (3/12)", status: "warning" }, { type: "logistics", name: "Motorbike Pilots", status: "ok" },
      ]
    }
  },

  // ----------------------------------------------------------
  // SCENARIO 3: MEATDeli Margin Deep-Dive (updated from v6)
  // ----------------------------------------------------------
  "meatdeli_margin": {
    query: "Tại sao margin MEATDeli giảm tháng này?",
    sources: [
      { type: "zalo", name: "Zalo — MEATDeli Groups", icon: "💬", color: "#0068FF", items: [
        { group: "MEATDeli — Sales South", sender: "Trần Minh — ASM", msg: "Khách phản ánh giá cao hơn Meat Plus. Store GT chuyển đối thủ.", time: "2d ago" },
        { group: "MEATDeli — Logistics", sender: "Phạm Tuấn — DC Cần Thơ", msg: "Spoilage 6.2% vs 3.8%. Xe lạnh #7 chờ sửa 2 tuần.", time: "4d ago" },
        { group: "MEATDeli — Sales South", sender: "Lê Phương — ASM HCM East", msg: "GT stores trả hàng nhiều. Meat Plus giao tận nơi, giá rẻ hơn 12%.", time: "3d ago" },
      ]},
      { type: "supra", name: "SUPRA — Cold Chain Analytics", icon: "🏭", color: "#06b6d4", items: [
        { metric: "Cold chain compliance — South", value: "88.4%", detail: "Target 97%. DC Cần Thơ pulling avg down. 2 trucks with temp excursions >+2°C. 14 incidents this week.", flag: "CRITICAL" },
        { metric: "Fleet — Refrigerated trucks South", value: "14/18 operational", detail: "Truck #7: compressor failed, parts ETA 10 days. Truck #3: intermittent cooling. 2 in scheduled service.", flag: "DEGRADED" },
        { metric: "Spoilage cost — SUPRA tracked", value: "₫312M MTD", detail: "vs ₫189M same period last month. 65% from DC Cần Thơ routes. Temp data confirms cold chain breaks.", flag: "ALERT" },
        { metric: "DC Cần Thơ throughput", value: "↓22% capacity", detail: "Serving MEATDeli fresh + MCH dry goods. Fresh prioritized but overflow causing delays on both.", flag: "BOTTLENECK" },
      ]},
      { type: "direct_mch", name: "Direct Coverage MCH — MEATDeli Read", icon: "📊", color: "#f59e0b", items: [
        { metric: "MEATDeli via Direct Coverage — South", value: "↓18% MoM", detail: "8,400 direct coverage stores. MEATDeli declining fastest among all BUs. 380 stores stopped ordering in 30 days.", flag: "DECLINING" },
        { metric: "MEATDeli churn — Direct stores", value: "380 stores lost", detail: "73% cited price vs Meat Plus, 27% cited quality/freshness. Direct coverage reps unable to defend on both fronts.", flag: "CHURN" },
        { metric: "Meat Plus gaining in MCH territory", value: "↑31% MoM at 890 stores", detail: "Meat Plus gaining at GT stores previously covered by MCH reps. Direct relationship not enough when product has quality issues.", flag: "COMPETITOR" },
      ]},
      { type: "winplus", name: "Win+ — MEATDeli Channel", icon: "🏪", color: "#10b981", items: [
        { metric: "Win+ MEATDeli sell-through", value: "52%", detail: "Lowest of all categories at Win+ partners. Reorder every 11.3 days (slowest). Returns 6.2% (highest).", flag: "DECLINING" },
        { metric: "Win+ MEATDeli vs Meat Plus", value: "Meat Plus at 18% of Win+ partners", detail: "Win+ partners independently sourcing Meat Plus. 420 partners now carry competitor alongside MEATDeli.", flag: "COMPETITOR" },
      ]},
      { type: "pos", name: "WCM POS — MEATDeli", icon: "🧾", color: "#16A34A", items: [
        { metric: "MEATDeli volume — WCM", value: "↓11% MoM", delta: "Tier 2 concentrated", flag: "DECLINING" },
        { metric: "Markdown/waste — WCM", value: "4.8%", delta: "↑ from 2.9%", flag: "ALERT" },
      ]},
      { type: "email", name: "Finance Reports", icon: "📧", color: "#7C3AED", items: [
        { from: "FP&A", subject: "MEATDeli Margin Alert — March MTD", excerpt: "Gross margin -340bps to 22.1%. COGS +12% (feed costs), markdown +190bps, spoilage +₫123M vs budget." },
      ]},
    ],
    answer: {
      summary: "Margin giảm 340bps. SUPRA data pinpoints exact cold chain failures. Direct Coverage + Win+ data shows GT/channel damage worse than WCM POS alone — 380 stores stopped ordering entirely, Meat Plus gaining +31%.",
      points: [
        { title: "🔴 Cold chain failure — SUPRA data confirms root cause", detail: "SUPRA tracking: cold chain compliance 88.4% (target 97%). 14 temp excursions this week. Truck #7 compressor dead (10 day ETA). Spoilage cost ₫312M MTD vs ₫189M. Direct Coverage data: GT return rate spiking. Win+ returns 6.2% (highest category). Quality issues reaching end customer across ALL channels.", action: "Emergency: rent temp truck ₫3M/day (cheaper than ₫8M/day spoilage). Fix #7 or replace compressor from alternative supplier.", pic: "supra_ops", impact: "₫312M", impactLabel: "MTD spoilage cost", actions: [{ label: "Rent Temp Truck", type: "critical" }, { label: "Replace Compressor", type: "critical" }, { label: "Deploy Cold Chain Monitor Agent", type: "warning" }] },
        { title: "🔴 Channel bleeding — 380 Direct Coverage stores + Win+ partners losing to Meat Plus", detail: "Direct Coverage: 380 stores stopped ordering (73% price, 27% quality). Meat Plus gaining +31% at 890 GT stores in MCH territory. Win+ data: 420 partners now carry Meat Plus alongside MEATDeli. WCM POS only shows ↓11% — the full picture across channels is much worse. Meat Plus offering 12% lower price + door-to-door delivery.", action: "Fix cold chain FIRST (precondition). Then MCH direct reps contact 380 churned stores with quality guarantee + competitive pricing. Deploy pricing agent for tactical response.", pic: "mch_gt", impact: "₫890M", impactLabel: "annual GT revenue at risk", actions: [{ label: "GT Win-Back Program", type: "critical" }, { label: "Adjust Pricing Agent — Competitive Response", type: "warning" }, { label: "Quality Guarantee Campaign", type: "normal" }] },
        { title: "🟡 Input cost spike — structural, but cold chain fix offsets 150-200bps", detail: "Feed +12%, farm gate +8%. Not fixable short-term. But cold chain fix (₫123M spoilage saving) + GT recovery (₫890M annual) can offset 150-200bps of the 340bps decline. Shift mix to premium processed SKUs where margin is 6pp higher.", action: "Hedge Q3 forward contracts. Shift production mix to premium processed. Private label MEATDeli for WCM showing 18% gross margin vs 15% branded.", pic: "procurement", impact: "₫1.2B", impactLabel: "COGS increase/mo", actions: [{ label: "Pricing Review Agent", type: "warning" }, { label: "Production Mix Optimizer", type: "normal" }] },
      ],
      footer: "Without Direct Coverage + Win+ data: we'd see ↓11% in WCM and miss that 380 GT stores churned entirely and 420 Win+ partners added Meat Plus. Without SUPRA data: we'd know spoilage is up but not that Truck #7's compressor is the specific cause. Multi-channel visibility turns 'margin is down' into 'here's the exact truck and exact 380 stores to fix.'",
      entities: [
        { type: "truck", name: "Truck #7 — CT", status: "critical" }, { type: "dc", name: "DC Cần Thơ", status: "critical" },
        { type: "gt", name: "380 churned Direct stores", status: "critical" }, { type: "competitor", name: "Meat Plus", status: "warning" },
        { type: "channel", name: "Win+ MEATDeli", status: "warning" },
      ]
    }
  },

  // ----------------------------------------------------------
  // SCENARIO 4: District 2 Ops (updated from v6)
  // ----------------------------------------------------------
  "d2_ops": {
    query: "Chuyện gì đang xảy ra ở District 2 hôm nay?",
    sources: [
      { type: "zalo", name: "Zalo — WCM D2 Operations", icon: "💬", color: "#0068FF", items: [
        { group: "WCM D2 — Vận hành", sender: "Nguyễn Văn Hùng — SM 1247", msg: "MEATDeli xúc xích hết hàng từ sáng, NCC chưa giao.", time: "07:41" },
        { group: "WCM D2 — Vận hành", sender: "Trần Thị Mai — SM 1302", msg: "Cũng bị thiếu xúc xích MEATDeli. Gọi NCC không nghe máy.", time: "08:15" },
        { group: "WCM D2 — Regional", sender: "Phạm Đức Anh — RM D2", msg: "Circle K mới mở đối diện store 1247, đang chạy KM giảm 20%.", time: "10:05" },
        { group: "WCM D2 — Vận hành", sender: "Võ Minh Tuấn — SM 1389", msg: "Thiếu 2 NV ca tối, xin hỗ trợ.", time: "11:30" },
      ]},
      { type: "pos", name: "WCM POS — D2 Transactions", icon: "🧾", color: "#16A34A", items: [
        { metric: "Store 1247 — MEATDeli Xúc xích", value: "0 units", delta: "↓100%", flag: "STOCKOUT" },
        { metric: "Store 1302 — MEATDeli Xúc xích", value: "0 units", delta: "↓100%", flag: "STOCKOUT" },
        { metric: "District 2 — Revenue today", value: "₫847M", delta: "↓8% WoW", flag: "BELOW" },
      ]},
      { type: "supra", name: "SUPRA — Logistics & Fleet", icon: "🏭", color: "#06b6d4", items: [
        { metric: "DC Long An → D2 cluster", value: "NOT DISPATCHED", detail: "Scheduled 05:00. No pickup scan. 340 units MEATDeli remaining at dock.", flag: "DELAYED" },
        { metric: "DC Bình Dương — Available inventory", value: "520 units", detail: "MEATDeli xúc xích available. Truck VN-51C-12847 idle. 3h fulfillment if rerouted.", flag: "AVAILABLE" },
        { metric: "Fleet utilization — South today", value: "73%", detail: "4/18 trucks in maintenance. 2 overdue service. Cold chain compliance: 94.2%.", flag: "NORMAL" },
        { metric: "D2 delivery SLA today", value: "62%", detail: "5/8 scheduled deliveries completed on time. 3 delayed >2 hours.", flag: "BELOW" },
      ]},
      { type: "direct_mch", name: "Direct Coverage MCH — D2 Intelligence", icon: "📊", color: "#f59e0b", items: [
        { metric: "Direct Coverage — MEATDeli D2 GT", value: "↓18% WoW", detail: "47 GT stores in D2 showing declining MEATDeli orders. Same supply disruption hitting GT channel.", flag: "DECLINING" },
        { metric: "Direct Coverage — Meat Plus gaining D2", value: "↑31% WoW", detail: "Meat Plus gaining at 23 GT stores near WCM locations. Substitution pattern confirmed by MCH reps.", flag: "COMPETITOR" },
        { metric: "Direct Coverage — Circle K proximity", value: "6 GT stores affected", detail: "GT stores within 200m of new Circle K showing ↓12% basket size. Competitive pressure across channels.", flag: "ALERT" },
      ]},
      { type: "winplus", name: "Win+ — D2 Partner Feed", icon: "🏪", color: "#10b981", items: [
        { metric: "Win+ D2 Partners — MEATDeli", value: "3 of 8 partners OOS", detail: "Same supply chain disruption hitting Win+ partners in D2. Win+ partners flagging quality concerns on last delivery.", flag: "STOCKOUT" },
        { metric: "Win+ D2 — PLH tea performing", value: "+22% WoW", detail: "PLH packaged tea sell-through strong at D2 Win+ partners. Offsetting MEATDeli decline partially.", flag: "GROWING" },
      ]},
      { type: "email", name: "Internal Reports", icon: "📧", color: "#7C3AED", items: [
        { from: "Supply Chain", subject: "NCC Minh Phát — Performance Alert", excerpt: "Fulfillment 64%, 3rd week declining. Recommend supplier review." },
      ]},
    ],
    answer: {
      summary: "District 2: 3 vấn đề chính. SUPRA data confirms supply chain root cause. Direct Coverage MCH shows same pattern hitting GT channel — 47 stores affected.",
      points: [
        { title: "🔴 MEATDeli supply chain disruption — MT + GT + Win+", detail: "12 WCM stores + 47 GT stores + 3 Win+ partners báo thiếu hàng. SUPRA confirms DC Long An chưa dispatch (no pickup scan). Root cause: NCC Minh Phát (fulfillment 64%). Direct Coverage data confirms Meat Plus gaining +31% ở cùng khu vực — substitution đang xảy ra ở CẢ BA kênh.", action: "Reroute truck VN-51C-12847 từ DC Bình Dương (520 units, idle). Prioritize WCM stores first, allocate GT via MCH reps, then Win+ partners.", pic: "supra_ops", impact: "₫127M", impactLabel: "WCM + ₫84M GT + ₫32M Win+ = ₫243M total", actions: [{ label: "Reroute SUPRA Truck", type: "critical" }, { label: "Alert MCH Direct Coverage Reps", type: "warning" }, { label: "Notify Win+ Partners — ETA Update", type: "warning" }] },
        { title: "🟡 Circle K competitive threat — omnichannel", detail: "WCM Store 1247 revenue ↓8%. Direct Coverage shows 6 GT stores within 200m of Circle K cũng bị ↓12% basket size. Competitive pressure affects MT, GT, and Win+ channels simultaneously.", action: "Deploy counter-promo across MT + coordinate MCH direct team cho defensive pricing ở GT.", pic: "trade_mkt", impact: "₫34M", impactLabel: "MT + GT weekly risk", actions: [{ label: "Counter-Promo Agent — D2", type: "warning" }, { label: "Deploy Loyalty Program", type: "normal" }] },
        { title: "🟡 Store 1389 operational issues", detail: "Thiếu NV 2 ngày. Evening revenue ↓31%. SUPRA delivery to 1389 on-time nhưng staffing ảnh hưởng receiving.", action: "HR dispatch temp staff.", pic: "hr_d2", impact: "₫7M", impactLabel: "daily gap", actions: [{ label: "Temp Staff Dispatch", type: "warning" }] },
      ],
      footer: "New insight từ Direct Coverage + Win+ data: MEATDeli đang mất share ở cả 3 kênh cùng lúc. Single-channel view (WCM POS only) would miss 60% of the total revenue impact.",
      entities: [
        { type: "dc", name: "DC Long An", status: "critical" }, { type: "dc", name: "DC Bình Dương", status: "ok" },
        { type: "truck", name: "VN-51C-12847", status: "ok" }, { type: "supplier", name: "NCC Minh Phát", status: "critical" },
        { type: "gt", name: "47 GT stores D2", status: "warning" }, { type: "competitor", name: "Circle K D2", status: "warning" },
        { type: "channel", name: "Win+ D2 Partners", status: "warning" },
      ]
    }
  },

  // ----------------------------------------------------------
  // SCENARIO 5: Finance Covenants Layer (NEW)
  // ----------------------------------------------------------
  "finance_covenants": {
    query: "How are we looking on covenants this year given MTD performance?",
    sources: [
      { type: "finance", name: "Internal Finance — Covenant Tracker", icon: "💰", color: "#6366f1", items: [
        { metric: "Net Debt / EBITDA", value: "3.2x current vs 4.0x covenant", detail: "Headroom: 0.8x. Trailing 12M EBITDA ₫18.2T. Net debt ₫58.2T. Improving trend — was 3.5x in Q4.", flag: "STABLE" },
        { metric: "Interest Coverage Ratio", value: "2.8x vs 2.0x minimum", detail: "Headroom: 0.8x. EBITDA ₫18.2T / Interest ₫6.5T. Stable. Refinancing ₫8T bond in Q3 could improve to 3.0x.", flag: "STABLE" },
        { metric: "Minimum Cash Balance", value: "₫4.2T vs ₫2.0T covenant", detail: "Headroom: ₫2.2T. Comfortable. Cash generation strong from WCM + MCH operations.", flag: "STABLE" },
        { metric: "NWC — Net Working Capital", value: "₫8.4T current vs ₫7.2T target", detail: "₫1.2T excess tied up. MCH receivables ₫420B over, WCM inventory ₫380B excess, MEATDeli inventory ₫200B, PLH ₫200B.", flag: "ALERT" },
        { metric: "Capex MTD", value: "₫1.2T of ₫4.8T annual plan", detail: "25% utilized vs 25% time elapsed — on track. But allocation suboptimal: rural ROI 18% vs urban 12%.", flag: "STABLE" },
        { metric: "FCF YTD", value: "₫2.1T vs ₫1.8T budget", detail: "+₫300B ahead of plan. Driven by WCM revenue outperformance + MCH cost discipline. Can fund incremental rural investment.", flag: "GROWING" },
      ]},
      { type: "pos", name: "WCM POS — Revenue Trajectory", icon: "🧾", color: "#16A34A", items: [
        { metric: "WCM Q1 Run-Rate → FY Projection", value: "₫42.8T annualized", detail: "Q1 MTD ₫10.7T. If sustained, ₫42.8T FY vs ₫40.2T budget (+6.5%). Rural growing +14% YoY driving upside.", flag: "GROWING" },
        { metric: "WCM EBITDA Margin Trend", value: "4.8% → 5.2% trajectory", detail: "Improving. Private label gross margin 34% vs branded 28% helping. Rural stores lower opex per ₫ revenue.", flag: "GROWING" },
      ]},
      { type: "direct_mch", name: "MCH Revenue Trajectory", icon: "📊", color: "#f59e0b", items: [
        { metric: "MCH Q1 Run-Rate → FY Projection", value: "₫28.4T annualized", detail: "Chin-su + Omachi driving. MEATDeli drag of ₫1.8T if current trend continues. Net: ₫28.4T vs ₫29.2T budget (97%).", flag: "STABLE" },
        { metric: "MCH Direct Coverage Revenue Contribution", value: "₫10.2T annualized", detail: "Direct coverage stores contributing 36% of MCH total. Higher margin (no distributor cut). Growing +8% while indirect flat.", flag: "GROWING" },
      ]},
      { type: "plh", name: "PLH Revenue Trajectory", icon: "🍵", color: "#059669", items: [
        { metric: "PLH Q1 Run-Rate → FY Projection", value: "₫4.2T annualized", detail: "Retail stores + packaged products. Packaged growing +42% MoM. If packaged ramp continues, could reach ₫5.0T.", flag: "GROWING" },
        { metric: "PLH Store EBITDA", value: "New stores: -2% (investing), Mature: +18%", detail: "Mature PLH stores highly profitable. 42 mature stores generating ₫2.1T. 28 new stores in investment phase.", flag: "INSIGHT" },
      ]},
      { type: "email", name: "FP&A Alerts", icon: "📧", color: "#7C3AED", items: [
        { from: "FP&A — Treasury", subject: "Q3 Bond Refinancing Update", excerpt: "₫8T bond refinancing on track. Indicative rate 8.2% vs current 9.1%. Annual saving ₫72B if executed." },
        { from: "FP&A — NWC", subject: "Working Capital Review — Action Required", excerpt: "NWC ₫1.2T over target. Top items: MCH receivables (₫420B), WCM slow-moving inventory (₫380B). Recommend immediate action." },
      ]},
    ],
    answer: {
      summary: "Covenants comfortable with headroom. Net Debt/EBITDA at 3.2x vs 4.0x limit, projecting 2.9x by year-end. FCF ₫300B ahead of plan. Two optimization opportunities: ₫1.2T NWC excess and capex reallocation to higher-ROI rural.",
      points: [
        { title: "🟢 Covenants comfortable — auto-roll forward shows Net Debt/EBITDA landing at 2.9x by year-end", detail: "Current 3.2x with 0.8x headroom. WCM revenue trajectory (+6.5% vs budget), MCH at 97%, and PLH upside (could reach ₫5T) all support EBITDA improvement. Q3 bond refinancing (₫8T at 8.2% vs 9.1%) would save ₫72B annually and improve interest coverage to 3.1x. FCF ₫2.1T vs ₫1.8T budget — ₫300B ahead.", action: "Auto-update forecast model with latest revenue run-rates. Lock in Q3 refinancing timeline. Headroom sufficient to fund incremental rural capex.", pic: "cfo", impact: "₫72B", impactLabel: "annual saving from refi", actions: [{ label: "Auto-Update Forecast Model", type: "normal" }, { label: "Lock Q3 Refinancing", type: "warning" }] },
        { title: "🟡 NWC excess ₫1.2T — optimize to free cash for growth investment", detail: "₫1.2T tied up above target. Breakdown: MCH receivables ₫420B over (GT payment terms too loose — avg 42 days vs 30 day target), WCM inventory ₫380B excess (slow-moving SKUs — 1,200 SKUs with <2 turns/year), MEATDeli inventory ₫200B (safety stock too high given demand decline), PLH working capital ₫200B (new store pre-stocking). Freeing ₫800B would fund 4 rural micro-DCs.", action: "Deploy NWC optimization: tighten MCH GT payment terms to 30 days (₫420B), liquidate WCM slow-moving SKUs (₫380B), reduce MEATDeli safety stock to match actual demand.", pic: "cfo", impact: "₫1.2T", impactLabel: "cash trapped in NWC", actions: [{ label: "NWC Optimization Agent — MCH Receivables", type: "warning" }, { label: "WCM SKU Liquidation Agent", type: "warning" }, { label: "MEATDeli Safety Stock Adjustment", type: "normal" }] },
        { title: "🟡 Capex reallocation opportunity — rural ROI 18% vs urban 12%", detail: "Capex on track at 25% utilized. But allocation suboptimal: WCM Rural Expansion (ROI 18%) and PLH New Stores (ROI 22%) and Tech/Digital (ROI 25%) are under-funded vs WCM Urban (ROI 14%) and MEATDeli Farms (ROI 8%). Recommend shifting ₫200B from urban/MEATDeli to rural/PLH/tech. Private label Chin-su variant showing 34% gross margin vs 28% branded — scale opportunity.", action: "Rebalance capex: shift ₫200B from MEATDeli farms (ROI 8%) to WCM rural (ROI 18%) + PLH expansion (ROI 22%). Accelerate private label program.", pic: "cfo", impact: "₫200B", impactLabel: "capex reallocation", actions: [{ label: "Capex Reallocation Model", type: "warning" }, { label: "Private Label Scale Agent", type: "normal" }, { label: "Rural Investment Accelerator", type: "normal" }] },
      ],
      footer: "Financial health strong with multiple levers: ₫72B from refinancing, ₫1.2T from NWC optimization, ₫200B capex reallocation. Combined, these fund the rural scaling strategy without additional debt.",
      entities: [
        { type: "finance", name: "Net Debt/EBITDA 3.2x", status: "ok" }, { type: "finance", name: "NWC ₫1.2T excess", status: "warning" },
        { type: "finance", name: "FCF +₫300B ahead", status: "ok" }, { type: "finance", name: "Q3 Bond Refi ₫8T", status: "ok" },
        { type: "capex", name: "Rural ROI 18%", status: "ok" }, { type: "capex", name: "MEATDeli Farms ROI 8%", status: "warning" },
      ]
    }
  },

  // ----------------------------------------------------------
  // SCENARIO 6: Chin-su GT miền Nam (updated from v6)
  // ----------------------------------------------------------
  "chinsu_gt": {
    query: "Chin-su đang bán thế nào ở GT channel miền Nam?",
    sources: [
      { type: "direct_mch", name: "Direct Coverage MCH — Chin-su GT Analytics", icon: "📊", color: "#f59e0b", items: [
        { metric: "Chin-su nước mắm — GT South", value: "₫4.2B/week", detail: "12,400 GT stores stocking via direct coverage. Volume stable MoM. Market leader position maintained.", flag: "STABLE" },
        { metric: "Chin-su tương ớt — GT South", value: "₫1.8B/week", detail: "8,200 stores. ↑8% MoM driven by Tết promo carryover. Direct reps pushing combo deals.", flag: "GROWING" },
        { metric: "Combo Tết Chin-su + dầu ăn", value: "SOLD OUT", detail: "367 GT stores report combo depleted via direct coverage reps. 89 stores still have 2-week inventory.", flag: "STOCKOUT" },
        { metric: "GT reorder frequency — Chin-su", value: "Every 6.2 days", detail: "Top 20% stores reorder every 4.1 days. Bottom 20% every 11.3 days. Distribution gap visible in direct coverage data.", flag: "INSIGHT" },
        { metric: "Competitor: Magi nước mắm", value: "↑5% share MoM", detail: "Gaining in Mekong Delta GT. Price 15% lower. MCH reps report 340 new GT stores added Magi this month.", flag: "COMPETITOR" },
      ]},
      { type: "zalo", name: "Zalo — MCH Sales Teams", icon: "💬", color: "#0068FF", items: [
        { group: "MCH — Direct Coverage South", sender: "Võ Hoàng — ASM Mekong", msg: "Magi đang đẩy mạnh ở chợ và GT khu vực Cần Thơ, Vĩnh Long. Giá rẻ hơn 15%.", time: "Yesterday" },
        { group: "MCH — Direct Coverage South", sender: "Trần Tâm — Sales Rep Đồng Tháp", msg: "Nhiều tiệm tạp hóa hỏi có Chin-su combo Tết không, hết rồi ko restock.", time: "2d ago" },
        { group: "MCH — Direct Coverage South", sender: "Lê Phương — ASM HCM East", msg: "GT stores gần WinMart+ đang order ít hơn. Chắc khách chuyển qua MT mua.", time: "3d ago" },
      ]},
      { type: "supra", name: "SUPRA — MCH GT Distribution", icon: "🏭", color: "#06b6d4", items: [
        { metric: "MCH GT delivery — Mekong cluster", value: "87% on-time", detail: "Target 95%. Bottleneck: DC Cần Thơ capacity. Same DC serving both MEATDeli + MCH dry goods.", flag: "BELOW" },
        { metric: "MCH GT route efficiency — South", value: "342 drops/day", detail: "18 MCH vans covering 12,400 GT stores. Avg 19 drops/van/day. Industry benchmark: 25.", flag: "INEFFICIENT" },
        { metric: "Chin-su combo — DC inventory", value: "0 units", detail: "All DCs depleted. Production batch scheduled next week. 367 GT stores backlogged.", flag: "STOCKOUT" },
      ]},
      { type: "winplus", name: "Win+ — Chin-su Cross-Read", icon: "🏪", color: "#10b981", items: [
        { metric: "Win+ Chin-su Nước mắm 500ml", value: "Sell-through 94%", detail: "Top seller at Win+ partners. Reorder every 5.2 days. No competitive pressure from Magi at Win+ (Magi doesn't target Win+ channel).", flag: "GROWING" },
        { metric: "Win+ vs GT demand signal", value: "Win+ predicts GT reorder", detail: "Win+ sell-through data leads GT reorder by 3-5 days. Can use Win+ as demand forecasting signal for GT.", flag: "INSIGHT" },
      ]},
      { type: "pos", name: "WCM POS — Chin-su (MT comparison)", icon: "🧾", color: "#16A34A", items: [
        { metric: "Chin-su nước mắm — WCM national", value: "↑3% MoM", detail: "MT channel growing. WCM Chin-su share: 34% of condiments category.", flag: "GROWING" },
        { metric: "Chin-su combo Tết — WCM", value: "SOLD OUT", detail: "Same stockout pattern. 847 WCM stores depleted vs 367 GT stores.", flag: "STOCKOUT" },
      ]},
      { type: "plh", name: "Phuc Long — Cross-sell Opportunity", icon: "🍵", color: "#059669", items: [
        { metric: "PLH + Chin-su in GT stores", value: "2,400 stores carry both", detail: "Stores carrying both PLH packaged tea and Chin-su show 12% higher basket size. Cross-sell opportunity in remaining 10,000 Chin-su-only stores.", flag: "INSIGHT" },
      ]},
    ],
    answer: {
      summary: "Chin-su GT miền Nam: core business stable (₫4.2B/week), nhưng 3 issues cần attention — và Direct Coverage + Win+ data cho thấy insights mà single-channel view không thể thấy được.",
      points: [
        { title: "🔴 Combo Tết stockout — cả MT lẫn GT, production bottleneck", detail: "367 GT stores + 847 WCM stores hết combo Chin-su + dầu ăn. SUPRA confirm all DCs depleted, production batch tuần sau mới có. Direct Coverage reps report GT stores đang hỏi mà không restock được — mất doanh thu và mất trust từ chủ tiệm.", action: "Expedite production batch. Prioritize GT allocation — GT stores mất trust lâu hơn MT vì relationship-based. Direct Coverage reps need to reassure store owners with firm delivery dates.", pic: "mch_direct", impact: "₫890M", impactLabel: "estimated lost sales/week", actions: [{ label: "Expedite Production Agent", type: "critical" }, { label: "GT Allocation Plan — Direct Coverage", type: "warning" }, { label: "Rep Communication Blast", type: "normal" }] },
        { title: "🟡 Magi competitive pressure — Mekong Delta, invisible in MT data", detail: "Direct Coverage shows Magi gaining +5% share MoM ở GT channel, thêm 340 stores mới. Giá rẻ hơn 15%. Zalo confirm sales team đang thấy pressure ở Cần Thơ, Vĩnh Long, Đồng Tháp. WCM POS không thấy pattern này vì Magi weak ở MT. Win+ data shows no Magi pressure (Win+ too organized for Magi). This is purely a GT battle.", action: "Deploy targeted GT trade promo ở Mekong Delta. MCH direct coverage reps focus 340 stores mới có Magi. Use Win+ demand signal to forecast GT needs.", pic: "mch_gt", impact: "₫420M", impactLabel: "annual GT revenue at risk", actions: [{ label: "GT Counter-Promo Agent — Mekong", type: "warning" }, { label: "Brief Direct Coverage Reps", type: "normal" }, { label: "Deploy Competitive Intel Agent", type: "normal" }] },
        { title: "🟡 SUPRA GT route inefficiency + PLH cross-sell opportunity", detail: "MCH GT delivery chỉ 19 drops/van/day vs benchmark 25 — đang lãng phí 24% capacity. DC Cần Thơ bottleneck. BUT: PLH cross-sell data shows stores carrying both PLH + Chin-su have 12% higher basket. 10,000 Chin-su-only stores = PLH whitespace. Add PLH to existing Chin-su delivery routes at near-zero incremental logistics cost.", action: "Route optimization + add PLH packaged to Chin-su delivery routes. Each van already visiting these stores — just add PLH SKUs.", pic: "supra_south", impact: "₫180M", impactLabel: "annual logistics savings + ₫120B PLH upside", actions: [{ label: "Route Optimization Agent", type: "normal" }, { label: "PLH Cross-Sell — Add to Chin-su Routes", type: "normal" }] },
      ],
      footer: "Key insight: Win+ sell-through data leads GT reorder by 3-5 days — can use as demand forecasting signal. Direct Coverage data reveals Magi GT threat invisible to WCM POS. PLH + Chin-su cross-sell in GT is a zero-cost distribution play.",
      entities: [
        { type: "product", name: "Chin-su Nước mắm", status: "ok" }, { type: "product", name: "Combo Tết", status: "critical" },
        { type: "competitor", name: "Magi — Mekong", status: "warning" }, { type: "dc", name: "DC Cần Thơ", status: "warning" },
        { type: "gt", name: "12,400 GT stores South", status: "ok" }, { type: "gt", name: "340 GT — Magi new", status: "warning" },
        { type: "product", name: "PLH Cross-sell", status: "ok" },
      ]
    }
  },
};

// ============================================================
// ZALO GROUPS (Tab 2)
// ============================================================
const ZALO_GROUPS = [
  { id: "wcm_d2_ops", name: "WCM D2 — Vận hành", memberCount: 28, avatar: "D2", avatarColor: "#2563eb",
    messages: [
      { sender: "Nguyễn Văn Hùng", role: "SM 1247", msg: "Anh ơi sáng nay MEATDeli xúc xích hết rồi", time: "07:32", type: "text" },
      { sender: "Nguyễn Văn Hùng", role: "SM 1247", msg: "Gọi NCC ko ai nghe", time: "07:33", type: "text" },
      { sender: "Trần Thị Mai", role: "SM 1302", msg: "Bên em cũng bị nè", time: "07:41", type: "text" },
      { sender: "Lê Hoàng Nam", role: "SM 1455", msg: "👍", time: "07:42", type: "noise" },
      { sender: "Phạm Đức Anh", role: "RM D2", msg: "Mấy anh report lại xem store nào thiếu h MEATDeli", time: "07:45", type: "text" },
      { sender: "Võ Minh Tuấn", role: "SM 1389", msg: "Bên em có nhưng ít, chắc hết tầm 10h", time: "07:48", type: "text" },
      { sender: "Nguyễn Thị Lan", role: "NV 1247", msg: "Khách phàn nàn nhiều lắm anh ơi", time: "07:52", type: "text" },
      { sender: "Trần Thị Mai", role: "SM 1302", msg: "Gọi NCC Minh Phát lần 3 r vẫn ko nghe 😤", time: "08:01", type: "text" },
      { sender: "Lê Hoàng Nam", role: "SM 1455", msg: "Btw tủ đông khu MEATDeli kêu to bất thường, đã báo KT", time: "08:15", type: "text" },
      { sender: "Phạm Đức Anh", role: "RM D2", msg: "Ok để anh escalate NCC", time: "08:18", type: "noise" },
      { sender: "Võ Minh Tuấn", role: "SM 1389", msg: "A ơi hôm nay thiếu 2 NV ca tối nữa, hôm qua cũng thiếu", time: "08:30", type: "text" },
      { sender: "Phạm Đức Anh", role: "RM D2", msg: "Circle K mới mở đối diện 1247, KM giảm 20% khai trương", time: "08:42", type: "text" },
      { sender: "Nguyễn Văn Hùng", role: "SM 1247", msg: "Đúng r anh, khách qua bên đó nhiều", time: "08:45", type: "text" },
      { sender: "Lê Hoàng Nam", role: "SM 1455", msg: "KT nói tủ đông cần thay compressor, chờ 2-3 ngày 😢", time: "09:10", type: "text" },
      { sender: "Võ Minh Tuấn", role: "SM 1389", msg: "Ko ai support ca tối nha? 😭", time: "11:30", type: "text" },
    ]
  },
  { id: "meatdeli_logistics", name: "MEATDeli — Logistics", memberCount: 18, avatar: "LG", avatarColor: "#ea580c",
    messages: [
      { sender: "Phạm Tuấn", role: "DC Cần Thơ", msg: "Report: spoilage tháng này 6.2%, tháng trước 3.8%", time: "07:00", type: "text" },
      { sender: "Nguyễn Hải", role: "DC Long An", msg: "Sao tăng vậy anh?", time: "07:10", type: "text" },
      { sender: "Phạm Tuấn", role: "DC Cần Thơ", msg: "Xe lạnh #7 hỏng 2 tuần r, #3 cũng có vấn đề. Temp +2°C", time: "07:15", type: "text" },
      { sender: "Trần Khôi", role: "Fleet Mgr", msg: "Xe #7 chờ compressor Hàn Quốc, ETA 10 ngày", time: "07:25", type: "text" },
      { sender: "Phạm Tuấn", role: "DC Cần Thơ", msg: "10 ngày??? Mỗi ngày hư mấy chục triệu tiền hàng", time: "07:28", type: "text" },
      { sender: "Lê Vinh", role: "Production", msg: "NM đang chạy 78% capacity do thiếu NL. Feed cost tăng", time: "07:42", type: "text" },
      { sender: "Phạm Tuấn", role: "DC Cần Thơ", msg: "Vậy miền Tây thiếu hàng tiếp tuần sau?", time: "07:48", type: "text" },
      { sender: "Lê Vinh", role: "Production", msg: "Chắc chắn. Trừ khi procurement fix supply", time: "07:52", type: "text" },
      { sender: "Trần Khôi", role: "Fleet Mgr", msg: "Thuê xe lạnh tạm ko? 3tr/ngày", time: "08:00", type: "text" },
      { sender: "Phạm Tuấn", role: "DC Cần Thơ", msg: "Rẻ hơn hư hàng nhiều 👆", time: "08:10", type: "text" },
      { sender: "Nguyễn Hải", role: "DC Long An", msg: "agree, cần approve gấp", time: "08:12", type: "noise" },
    ]
  },
  { id: "mch_direct_south", name: "MCH — Direct Coverage South", memberCount: 42, avatar: "DC", avatarColor: "#f59e0b",
    messages: [
      { sender: "Võ Hoàng", role: "ASM Mekong", msg: "Team ơi Magi đẩy mạnh ở chợ GT khu Cần Thơ, Vĩnh Long", time: "08:00", type: "text" },
      { sender: "Trần Tâm", role: "Rep Đồng Tháp", msg: "Confirm, giá rẻ hơn Chin-su 15%. Nhiều tiệm bắt đầu chuyển", time: "08:08", type: "text" },
      { sender: "Lê Phương", role: "ASM HCM East", msg: "GT stores gần WinMart+ order ít hơn. Khách chuyển MT", time: "08:15", type: "text" },
      { sender: "Nguyễn Duy", role: "Rep Cần Thơ", msg: "Có ai có data Magi bán được bao nhiêu ko?", time: "08:20", type: "text" },
      { sender: "Võ Hoàng", role: "ASM Mekong", msg: "Direct coverage data shows 340 GT stores mới carry Magi tháng này", time: "08:25", type: "text" },
      { sender: "Trần Tâm", role: "Rep Đồng Tháp", msg: "Tiệm tạp hóa hỏi combo Tết Chin-su, hết rồi ko restock 😤", time: "08:30", type: "text" },
      { sender: "Phạm Loan", role: "Rep Bến Tre", msg: "Same. Mất mấy deal combo vì hết hàng", time: "08:35", type: "text" },
      { sender: "Lê Phương", role: "ASM HCM East", msg: "MEATDeli cũng bị GT trả hàng nhiều tháng này. Hàng ko tươi", time: "08:42", type: "text" },
      { sender: "Võ Hoàng", role: "ASM Mekong", msg: "Hàng giao chậm + ko đủ lạnh = hàng hư = GT mất niềm tin", time: "08:48", type: "text" },
      { sender: "Nguyễn Duy", role: "Rep Cần Thơ", msg: "Chính xác. Mấy tiệm quen bắt đầu quay lưng", time: "08:52", type: "text" },
      { sender: "Trần Tâm", role: "Rep Đồng Tháp", msg: "😢😢", time: "08:53", type: "noise" },
    ]
  },
  { id: "winplus_ops", name: "Win+ — Partner Operations", memberCount: 24, avatar: "W+", avatarColor: "#10b981",
    messages: [
      { sender: "Lê Minh Hoàng", role: "Win+ Director", msg: "Team, rural Win+ partners reporting strong PLH tea demand. Need more stock.", time: "08:30", type: "text" },
      { sender: "Nguyễn Thu", role: "Win+ Ops South", msg: "3 Win+ partners in D2 báo MEATDeli OOS. Same as WCM issue.", time: "09:00", type: "text" },
      { sender: "Trần Huy", role: "Win+ Ops Mekong", msg: "Mekong Win+ partners sell-through for Chin-su vẫn 94%. No Magi pressure ở Win+.", time: "09:15", type: "text" },
      { sender: "Phạm An", role: "Win+ Rural", msg: "PLH packaged tea trial: 84% sell-through at 8 Win+ stores in Vĩnh Long. Cần scale.", time: "09:30", type: "text" },
      { sender: "Nguyễn Thu", role: "Win+ Ops South", msg: "Win+ partners starting to source Meat Plus independently. 420 partners now carry both.", time: "10:00", type: "text" },
      { sender: "Lê Minh Hoàng", role: "Win+ Director", msg: "That's a problem. Need exclusive deal or competitive pricing.", time: "10:05", type: "text" },
    ]
  },
  { id: "plh_expansion", name: "PLH — Expansion & Ops", memberCount: 16, avatar: "PL", avatarColor: "#059669",
    messages: [
      { sender: "Nguyễn Thanh Phong", role: "CEO PLH", msg: "Packaged products update: +42% MoM. Rural channel is surprising us.", time: "08:00", type: "text" },
      { sender: "Lê Thảo", role: "PLH Sales", msg: "Rural stores replacing loose tea with our Trà Sen. Great PMF signal.", time: "08:20", type: "text" },
      { sender: "Trần Bình", role: "PLH Supply", msg: "Production capacity for packaged needs +30% if we scale to 1,420 stores.", time: "08:35", type: "text" },
      { sender: "Nguyễn Thanh Phong", role: "CEO PLH", msg: "Start capacity planning. This is our biggest growth lever.", time: "08:40", type: "text" },
      { sender: "Lê Thảo", role: "PLH Sales", msg: "PLH + Wake-Up combo reorder rate 74%. Best combo metric across Masan.", time: "09:00", type: "text" },
    ]
  },
];

// ============================================================
// HAIKU EXTRACTIONS (enriched with Direct Coverage + Win+ labels)
// ============================================================
const HAIKU_EXTRACTIONS = {
  "wcm_d2_ops": {
    groupName: "WCM D2 — Vận hành", messagesProcessed: 15, noiseFiltered: 3,
    signals: [
      { category: "STOCKOUT", urgency: "critical", store: "1247, 1302", sku: "MEATDeli Xúc xích", summary: "Stockout xúc xích tại 2+ stores. NCC không liên lạc được.", confidence: 0.96 },
      { category: "EQUIPMENT", urgency: "high", store: "1455", sku: "MEATDeli (tủ đông)", summary: "Tủ đông hỏng, cần thay compressor. ETA 2-3 ngày.", confidence: 0.94 },
      { category: "COMPETITOR", urgency: "medium", store: "1247", sku: null, summary: "Circle K khai trương đối diện, KM 20%.", confidence: 0.91 },
      { category: "STAFFING", urgency: "high", store: "1389", sku: null, summary: "Thiếu 2 NV ca tối, 2 ngày liên tiếp.", confidence: 0.93 },
    ]
  },
  "meatdeli_logistics": {
    groupName: "MEATDeli — Logistics", messagesProcessed: 11, noiseFiltered: 1,
    signals: [
      { category: "COLD_CHAIN", urgency: "critical", store: "DC Cần Thơ", sku: "MEATDeli all", summary: "Spoilage 6.2% (vs 3.8%). 2 xe lạnh hỏng. Temp +2°C above spec.", confidence: 0.97, supraMatch: "SUPRA cold chain compliance: 88.4%. Truck #7 compressor ETA 10d. ₫312M MTD spoilage." },
      { category: "SUPPLY", urgency: "critical", store: "DC Long An", sku: "MEATDeli all", summary: "NM chạy 78% capacity. Feed cost tăng → supply giảm.", confidence: 0.95, supraMatch: "SUPRA throughput: DC Cần Thơ ↓22% capacity." },
      { category: "ACTION_ITEM", urgency: "high", store: "DC Cần Thơ", sku: null, summary: "Đề xuất thuê xe lạnh tạm 3tr/ngày. Chờ approve.", confidence: 0.91, supraMatch: "SUPRA fleet: truck rental available via Viettel Post cold chain." },
    ]
  },
  "mch_direct_south": {
    groupName: "MCH — Direct Coverage South", messagesProcessed: 11, noiseFiltered: 1,
    signals: [
      { category: "COMPETITIVE", urgency: "high", store: "GT Mekong", sku: "Chin-su vs Magi", summary: "Magi gaining ở Cần Thơ, Vĩnh Long. Giá rẻ 15%. 340 new GT stores.", confidence: 0.92, directCoverageMatch: "DIRECT COVERAGE MCH: Magi +5% share MoM. Confirmed via rep visits at 340 stores." },
      { category: "STOCKOUT", urgency: "high", store: "GT South", sku: "Combo Tết Chin-su", summary: "GT stores hỏi combo Tết, hết hàng ko restock. Mất deal.", confidence: 0.90, directCoverageMatch: "DIRECT COVERAGE MCH: 367 GT stores report combo depleted via direct reps." },
      { category: "QUALITY", urgency: "high", store: "GT South", sku: "MEATDeli", summary: "GT trả hàng MEATDeli do ko tươi. Cold chain issue ảnh hưởng GT trust.", confidence: 0.93, directCoverageMatch: "DIRECT COVERAGE MCH: MEATDeli GT return rate 3.8% vs 1.2% avg. 380 stores stopped ordering." },
      { category: "CHANNEL_SHIFT", urgency: "medium", store: "GT near WCM", sku: "MCH general", summary: "GT stores gần WinMart+ bị mất traffic sang MT.", confidence: 0.85, directCoverageMatch: "DIRECT COVERAGE MCH: GT stores <500m from WCM showing ↓9% avg revenue." },
    ]
  },
  "winplus_ops": {
    groupName: "Win+ — Partner Operations", messagesProcessed: 6, noiseFiltered: 0,
    signals: [
      { category: "SUPPLY", urgency: "high", store: "Win+ D2", sku: "MEATDeli", summary: "3 Win+ partners OOS on MEATDeli. Same supply chain disruption.", confidence: 0.94, winplusMatch: "WIN+ CROSS-READ: MEATDeli sell-through 52%, lowest category. Returns 6.2%." },
      { category: "COMPETITIVE", urgency: "high", store: "Win+ National", sku: "MEATDeli vs Meat Plus", summary: "420 Win+ partners sourcing Meat Plus independently. Dual-carry.", confidence: 0.92, winplusMatch: "WIN+ CROSS-READ: Meat Plus at 18% of Win+ partners, up from 8% last month." },
      { category: "GROWTH", urgency: "medium", store: "Win+ Rural", sku: "PLH Packaged Tea", summary: "PLH packaged tea 84% sell-through at 8 Vĩnh Long stores. Scale opportunity.", confidence: 0.90, winplusMatch: "WIN+ CROSS-READ: PLH rural sell-through 78%, reorder every 8.1 days." },
    ]
  },
  "plh_expansion": {
    groupName: "PLH — Expansion & Ops", messagesProcessed: 5, noiseFiltered: 0,
    signals: [
      { category: "GROWTH", urgency: "medium", store: "PLH National", sku: "PLH Packaged", summary: "Packaged products +42% MoM. Rural driving growth. Production needs +30% capacity.", confidence: 0.95 },
      { category: "INSIGHT", urgency: "medium", store: "PLH Rural", sku: "PLH + Wake-Up Combo", summary: "PLH + Wake-Up combo 74% reorder rate. Best combo metric across Masan.", confidence: 0.91 },
    ]
  },
};

// ============================================================
// STORE INTELLIGENCE MAP DATA (updated — internal data terminology)
// ============================================================
const STORE_REGIONS = [
  { id: "hcm_d1", name: "Quận 1", lat: 10.776, lng: 106.701, stores: [
    { id: "W1001", type: "wcm", name: "WinMart+ Nguyễn Huệ", status: "ok", rev: "₫48M/d", alerts: [] },
    { id: "W1002", type: "wcm", name: "WinMart+ Lê Lợi", status: "ok", rev: "₫52M/d", alerts: [] },
    { id: "G1001", type: "gt", name: "Tạp hóa Chị Hai", status: "ok", rev: "₫3.2M/d", alerts: [] },
    { id: "G1002", type: "gt", name: "Mini Mart Kim", status: "warning", rev: "₫2.1M/d", alerts: ["Chin-su combo stockout — Direct Coverage confirmed"] },
    { id: "G1003", type: "gt", name: "Tiệm Bà Năm", status: "ok", rev: "₫1.8M/d", alerts: [] },
  ]},
  { id: "hcm_d2", name: "Quận 2 (Thủ Đức)", lat: 10.787, lng: 106.750, stores: [
    { id: "W1247", type: "wcm", name: "WinMart+ 1247", status: "critical", rev: "₫0/d", alerts: ["MEATDeli stockout", "Circle K competition", "Revenue ↓8% WoW"] },
    { id: "W1302", type: "wcm", name: "WinMart+ 1302", status: "critical", rev: "₫12M/d", alerts: ["MEATDeli stockout", "NCC Minh Phát unresponsive"] },
    { id: "W1389", type: "wcm", name: "WinMart+ 1389", status: "warning", rev: "₫28M/d", alerts: ["Staffing -2 NV ca tối", "Revenue ↓31% evening"] },
    { id: "W1455", type: "wcm", name: "WinMart+ 1455", status: "warning", rev: "₫31M/d", alerts: ["Freezer compressor failing"] },
    { id: "G2001", type: "gt", name: "Tạp hóa Thanh Hương", status: "critical", rev: "₫0/d", alerts: ["MEATDeli CHURN — Direct Coverage confirmed", "Switched to Meat Plus"] },
    { id: "G2002", type: "gt", name: "Shop Minh", status: "warning", rev: "₫1.4M/d", alerts: ["Chin-su combo inquiry — OOS at distributor"] },
    { id: "G2003", type: "gt", name: "GT Mini Q2", status: "ok", rev: "₫2.8M/d", alerts: ["PLH packaged first order via Win+"] },
    { id: "G2004", type: "gt", name: "Tiệm Cô Tư", status: "warning", rev: "₫1.1M/d", alerts: ["Chin-su tương ớt low stock: 4 bottles — Direct Coverage alert"] },
    { id: "G2005", type: "gt", name: "Quán Ba Mập", status: "critical", rev: "₫0.4M/d", alerts: ["MEATDeli return — expired product — Direct Coverage confirmed"] },
    { id: "G2006", type: "gt", name: "Mart Út Huy", status: "warning", rev: "₫1.6M/d", alerts: ["Meat Plus gaining — substitution via Direct Coverage intel"] },
    { id: "P2001", type: "winplus", name: "Win+ Partner — Q2 A", status: "critical", rev: "₫1.8M/d", alerts: ["MEATDeli OOS — same supply chain issue", "PLH tea +22% WoW"] },
    { id: "P2002", type: "winplus", name: "Win+ Partner — Q2 B", status: "ok", rev: "₫2.4M/d", alerts: ["Chin-su sell-through 94%"] },
  ]},
  { id: "hcm_d7", name: "Quận 7", lat: 10.734, lng: 106.722, stores: [
    { id: "W7001", type: "wcm", name: "WinMart+ PMH", status: "ok", rev: "₫67M/d", alerts: [] },
    { id: "W7002", type: "wcm", name: "WinMart Crescent", status: "ok", rev: "₫89M/d", alerts: [] },
    { id: "G7001", type: "gt", name: "GT Mini Q7", status: "ok", rev: "₫3.1M/d", alerts: ["PLH packaged first order: 24 boxes via Win+"] },
    { id: "G7002", type: "gt", name: "Tạp hóa Hạnh", status: "ok", rev: "₫2.4M/d", alerts: [] },
    { id: "P7001", type: "winplus", name: "Win+ Partner — Gò Vấp", status: "ok", rev: "₫2.1M/d", alerts: ["PLH tea sell-through 84%", "Kokomi +60% reorder"] },
  ]},
  { id: "hcm_bt", name: "Bình Thạnh", lat: 10.802, lng: 106.710, stores: [
    { id: "WBT01", type: "wcm", name: "WinMart+ Bạch Đằng", status: "ok", rev: "₫41M/d", alerts: [] },
    { id: "WBT02", type: "wcm", name: "WinMart+ Xô Viết", status: "warning", rev: "₫35M/d", alerts: ["MEATDeli markdown ↑4.8%"] },
    { id: "GBT01", type: "gt", name: "Tạp hóa Thanh Hương", status: "critical", rev: "₫0.8M/d", alerts: ["MEATDeli CHURN — Direct Coverage confirmed", "Switched to Meat Plus"] },
    { id: "GBT02", type: "gt", name: "Tiệm Anh Tuấn", status: "ok", rev: "₫2.2M/d", alerts: [] },
    { id: "GBT03", type: "gt", name: "Mini Mart Ngọc", status: "warning", rev: "₫1.5M/d", alerts: ["Magi first order — competitor entry via Direct Coverage"] },
  ]},
  { id: "hcm_gv", name: "Gò Vấp", lat: 10.838, lng: 106.650, stores: [
    { id: "WGV01", type: "wcm", name: "WinMart+ Quang Trung", status: "ok", rev: "₫44M/d", alerts: [] },
    { id: "GGV01", type: "gt", name: "Mini Mart Tân", status: "ok", rev: "₫3.6M/d", alerts: ["Kokomi +60% reorder — Direct Coverage confirmed"] },
    { id: "GGV02", type: "gt", name: "Tạp hóa Phương", status: "ok", rev: "₫1.9M/d", alerts: [] },
  ]},
  { id: "bienhoa", name: "Biên Hòa", lat: 10.945, lng: 106.842, stores: [
    { id: "WBH01", type: "wcm", name: "WinMart+ Đồng Khởi", status: "ok", rev: "₫38M/d", alerts: [] },
    { id: "GBH01", type: "gt", name: "Chị Ba Grocery", status: "critical", rev: "₫1.4M/d", alerts: ["Meat Plus first order 30kg — Direct Coverage alert", "Was MEATDeli exclusive — LOST"] },
    { id: "GBH02", type: "gt", name: "Tạp hóa Minh Tâm", status: "ok", rev: "₫2.0M/d", alerts: [] },
  ]},
  { id: "longan", name: "Long An", lat: 10.536, lng: 106.413, stores: [
    { id: "WLA01", type: "wcm", name: "WinMart+ Tân An", status: "ok", rev: "₫29M/d", alerts: [] },
    { id: "GLA01", type: "gt", name: "Tạp hóa Phú", status: "ok", rev: "₫1.7M/d", alerts: ["Wake-Up regular reorder — Direct Coverage stable"] },
    { id: "GLA02", type: "gt", name: "Tiệm Út Nguyên", status: "warning", rev: "₫1.2M/d", alerts: ["MEATDeli delivery delayed 3h — SUPRA tracked"] },
  ]},
  { id: "cantho", name: "Cần Thơ", lat: 10.045, lng: 105.747, stores: [
    { id: "WCT01", type: "wcm", name: "WinMart Ninh Kiều", status: "warning", rev: "₫51M/d", alerts: ["MEATDeli spoilage 6.2%", "DC Cần Thơ cold chain 88.4%"] },
    { id: "WCT02", type: "wcm", name: "WinMart+ Cái Răng", status: "warning", rev: "₫27M/d", alerts: ["MEATDeli markdown ↑"] },
    { id: "GCT01", type: "gt", name: "Mini Mart Hòa", status: "critical", rev: "₫0.6M/d", alerts: ["Magi first order 48 bottles — Direct Coverage confirmed", "Chin-su losing to Magi -15% price"] },
    { id: "GCT02", type: "gt", name: "Tạp hóa Ba Liêm", status: "warning", rev: "₫1.3M/d", alerts: ["Magi gaining — Direct Coverage intel", "MCH delivery 87% on-time"] },
    { id: "GCT03", type: "gt", name: "Chợ GT Cần Thơ", status: "critical", rev: "₫0.9M/d", alerts: ["MEATDeli return — not fresh", "Cold chain break confirmed by SUPRA"] },
    { id: "PCT01", type: "winplus", name: "Win+ Partner — Cần Thơ", status: "ok", rev: "₫1.9M/d", alerts: ["PLH tea trial: 78% sell-through", "Chin-su stable — no Magi pressure at Win+"] },
  ]},
  { id: "vinhlong", name: "Vĩnh Long", lat: 10.254, lng: 105.972, stores: [
    { id: "WVL01", type: "wcm", name: "WinMart+ Vĩnh Long", status: "ok", rev: "₫24M/d", alerts: [] },
    { id: "GVL01", type: "gt", name: "Tiệm Bà Năm", status: "critical", rev: "₫0.5M/d", alerts: ["MEATDeli return 12 packs expired — Direct Coverage confirmed", "Quality issue — cold chain"] },
    { id: "GVL02", type: "gt", name: "Tạp hóa Hai Lúa", status: "warning", rev: "₫1.1M/d", alerts: ["Magi gaining — price pressure via Direct Coverage"] },
    { id: "PVL01", type: "winplus", name: "Win+ Partner — Vĩnh Long", status: "ok", rev: "₫1.6M/d", alerts: ["PLH packaged tea first order: 120 boxes across 8 Win+ stores"] },
  ]},
  { id: "dongthap", name: "Đồng Tháp", lat: 10.467, lng: 105.633, stores: [
    { id: "WDT01", type: "wcm", name: "WinMart+ Cao Lãnh", status: "ok", rev: "₫22M/d", alerts: [] },
    { id: "GDT01", type: "gt", name: "Tạp hóa Út Em", status: "ok", rev: "₫2.3M/d", alerts: ["Omachi +25% reorder — Direct Coverage GROWTH signal"] },
    { id: "GDT02", type: "gt", name: "Tiệm Chú Bảy", status: "warning", rev: "₫0.9M/d", alerts: ["Combo Tết Chin-su OOS — Direct Coverage confirmed", "Lost deals — no restock"] },
  ]},
];

// Flatten all stores with region info
const ALL_STORES = STORE_REGIONS.flatMap(r => r.stores.map(s => ({ ...s, region: r.name, regionId: r.id })));

// Filter presets for navigation from Management Master View
const MAP_FILTERS = {
  "meatdeli_stockout": { label: "MEATDeli Stockout", match: s => s.alerts.some(a => a.toLowerCase().includes("meatdeli") && (a.toLowerCase().includes("stockout") || a.toLowerCase().includes("churn") || a.toLowerCase().includes("oos"))) },
  "meatdeli_quality": { label: "MEATDeli Quality", match: s => s.alerts.some(a => a.toLowerCase().includes("meatdeli") && (a.toLowerCase().includes("return") || a.toLowerCase().includes("spoilage") || a.toLowerCase().includes("cold chain") || a.toLowerCase().includes("expired"))) },
  "competitor_magi": { label: "Magi Competition", match: s => s.alerts.some(a => a.toLowerCase().includes("magi")) },
  "competitor_meatplus": { label: "Meat Plus Competition", match: s => s.alerts.some(a => a.toLowerCase().includes("meat plus")) },
  "chinsu_oos": { label: "Chin-su Stockout", match: s => s.alerts.some(a => a.toLowerCase().includes("chin-su") && (a.toLowerCase().includes("stockout") || a.toLowerCase().includes("oos") || a.toLowerCase().includes("combo"))) },
  "circle_k": { label: "Circle K Threat", match: s => s.alerts.some(a => a.toLowerCase().includes("circle k")) },
  "plh_growth": { label: "PLH Growth", match: s => s.alerts.some(a => a.toLowerCase().includes("plh")) },
  "winplus_alerts": { label: "Win+ Alerts", match: s => s.type === "winplus" && s.alerts.length > 0 },
  "all_critical": { label: "All Critical", match: s => s.status === "critical" },
  "all_warning": { label: "All Warnings", match: s => s.status === "warning" || s.status === "critical" },
  "all": { label: "All Stores", match: () => true },
};

// ============================================================
// DIRECT COVERAGE MCH DASHBOARD DATA (replaces KIOTVIET_METRICS)
// ============================================================
const DIRECT_COVERAGE_METRICS = {
  overview: { totalStores: "38,000", activeStores: "34,200", avgRevPerStore: "₫24.8M/mo", dataFreshness: "Real-time" },
  buPerformance: [
    { name: "Chin-su Condiments", stores: "28,400", revenue: "₫312B", growth: "+8%", status: "growing", target: "₫290B", achievement: "108%" },
    { name: "Omachi/Kokomi Noodles", stores: "26,100", revenue: "₫218B", growth: "+3%", status: "growing", target: "₫212B", achievement: "103%" },
    { name: "Wake-Up/Vinacafé", stores: "18,200", revenue: "₫104B", growth: "-5%", status: "declining", target: "₫110B", achievement: "95%" },
    { name: "MEATDeli (via Direct)", stores: "8,400", revenue: "₫89B", growth: "-18%", status: "declining", target: "₫108B", achievement: "82%" },
    { name: "Nam Ngư", stores: "15,600", revenue: "₫62B", growth: "-7%", status: "declining", target: "₫67B", achievement: "93%" },
    { name: "Phúc Long Packaged", stores: "12,800", revenue: "₫47B", growth: "+22%", status: "growing", target: "₫38B", achievement: "124%" },
  ],
  areaPerformance: [
    { name: "HCM & Southeast", stores: "12,400", achievement: "94%", highlight: "Strong Chin-su, weak MEATDeli", status: "stable", coverage: "89%", repVisits: "18.4" },
    { name: "Mekong Delta", stores: "8,200", achievement: "87%", highlight: "Magi competition, cold chain gaps", status: "declining", coverage: "74%", repVisits: "12.1" },
    { name: "Central", stores: "6,800", achievement: "91%", highlight: "Omachi growth, PLH expanding", status: "growing", coverage: "82%", repVisits: "14.8" },
    { name: "North", stores: "10,800", achievement: "96%", highlight: "Best performing region, scale playbook", status: "strong", coverage: "91%", repVisits: "19.2" },
  ],
  realtimeFeed: [
    { time: "11:42", store: "Direct Rep — Bình Dương cluster", event: "MCH MEATDeli reorder: 0 units (was 20/week) — 3 stores", flag: "CHURN" },
    { time: "11:38", store: "Direct Rep — Cần Thơ", event: "Magi pricing undercut confirmed: 15% below Chin-su at 48 stores", flag: "COMPETITOR" },
    { time: "11:35", store: "Win+ Partner — Vĩnh Long", event: "PLH packaged tea first order: 120 boxes across 8 Win+ stores", flag: "NEW_DIST" },
    { time: "11:31", store: "Direct Rep — Thủ Đức", event: "Chin-su combo Tết inquiry — out of stock at distributor", flag: "STOCKOUT" },
    { time: "11:28", store: "Direct Rep — Đồng Tháp", event: "Omachi carton reorder: 5 cartons (+25% vs last week)", flag: "GROWTH" },
    { time: "11:24", store: "Win+ Partner — Q.7 HCM", event: "PLH packaged tea trial successful: 84% sell-through in 2 weeks", flag: "GROWTH" },
    { time: "11:20", store: "Direct Rep — Biên Hòa", event: "Meat Plus first spotted at 12 GT stores — substitution risk", flag: "COMPETITOR" },
    { time: "11:17", store: "Direct Rep — Long An", event: "Wake-Up 247 regular cadence reorder: 3 cartons", flag: "STABLE" },
    { time: "11:14", store: "Win+ Partner — Gò Vấp", event: "Kokomi reorder: 8 cartons (+60% vs usual — rural demand)", flag: "GROWTH" },
    { time: "11:10", store: "Direct Rep — Q.2 HCM", event: "Chin-su tương ớt running low: 4 bottles at 6 stores", flag: "LOW_STOCK" },
  ]
};

// ============================================================
// WIN+ METRICS
// ============================================================
const WIN_PLUS_METRICS = {
  overview: { totalPartners: "4,200", activePartners: "3,840", monthlyGMV: "₫42B", avgOrderPerPartner: "₫2.4M/wk", ruralPenetration: "34%", growthMoM: "+12%" },
  productRankings: [
    { name: "Chin-su Nước mắm 500ml", sellThrough: 142, reorderRate: "Every 5.2 days", revenue: "₫8.2B", trend: "+12%", partners: "3,400" },
    { name: "Omachi Tôm chua cay (5-pack)", sellThrough: 128, reorderRate: "Every 4.8 days", revenue: "₫6.8B", trend: "+8%", partners: "3,100" },
    { name: "PLH Trà Sen 250ml (6-pack)", sellThrough: 94, reorderRate: "Every 8.1 days", revenue: "₫3.4B", trend: "+28%", partners: "2,200" },
    { name: "Wake-Up 247 (10-pack)", sellThrough: 82, reorderRate: "Every 6.4 days", revenue: "₫2.8B", trend: "-3%", partners: "1,900" },
    { name: "MEATDeli Xúc xích 200g", sellThrough: 48, reorderRate: "Every 11.3 days", revenue: "₫1.2B", trend: "-14%", partners: "1,400" },
  ],
  ruralUrbanSplit: [
    { type: "rural", label: "Rural Partners", partners: "1,420", revenue: "₫14.2B", growth: "+18%", insight: "Fastest growing segment. Omachi and Chin-su dominate. PLH packaged tea gaining traction. MEATDeli cold chain a barrier." },
    { type: "urban", label: "Urban Partners", partners: "2,420", revenue: "₫27.8B", growth: "+8%", insight: "Mature segment. Higher basket size but slower growth. PLH premium products outperforming. Competition from convenience stores." },
  ],
  partnerFeed: [
    { time: "11:45", type: "rural", flag: "GROWTH", partner: "Win+ Vĩnh Long #12", event: "First PLH packaged order — 80 units across 3 SKUs" },
    { time: "11:38", type: "urban", flag: "REORDER", partner: "Win+ Bình Thạnh #04", event: "Chin-su combo reorder 2x normal volume — promo working" },
    { time: "11:32", type: "rural", flag: "CHURN_RISK", partner: "Win+ Cần Thơ #08", event: "No MEATDeli reorder in 3 weeks — cold chain complaint" },
    { time: "11:28", type: "rural", flag: "NEW", partner: "Win+ Đồng Tháp #15", event: "New partner activated — initial order ₫4.2M" },
    { time: "11:22", type: "urban", flag: "COMPETITOR", partner: "Win+ Thủ Đức #11", event: "Circle K opened 200m away — basket size down 12%" },
  ],
  partnerGrowth: [
    { month: "Oct", count: 3420 },
    { month: "Nov", count: 3570 },
    { month: "Dec", count: 3700 },
    { month: "Jan", count: 3770 },
    { month: "Feb", count: 3810 },
    { month: "Mar", count: 3840 },
  ],
};

// ============================================================
// FINANCE DATA
// ============================================================
const FINANCE_DATA = {
  covenants: [
    { name: "Net Debt / EBITDA", current: "3.2x", limit: "4.0x", currentPct: 80, status: "ok", headroom: "0.8x", yearEndProjection: "2.9x", projectionStatus: "ok" },
    { name: "Interest Coverage", current: "2.8x", limit: "2.0x min", currentPct: 60, status: "ok", headroom: "0.8x", yearEndProjection: "3.1x", projectionStatus: "ok" },
    { name: "Minimum Cash Balance", current: "₫4.2T", limit: "₫2.0T min", currentPct: 48, status: "ok", headroom: "₫2.2T", yearEndProjection: "₫3.8T", projectionStatus: "ok" },
  ],
  nwcBreakdown: [
    { component: "MCH Receivables", bu: "Masan Consumer", current: "₫3.2T", target: "₫2.8T", excess: "₫420B", actionDetail: "Tighten GT payment terms from 45 to 30 days" },
    { component: "WCM Inventory", bu: "WinCommerce", current: "₫2.8T", target: "₫2.4T", excess: "₫380B", actionDetail: "Clear 2,400 slow-moving SKUs across 3,200 stores" },
    { component: "MEATDeli Inventory", bu: "MEATDeli", current: "₫1.4T", target: "₫1.2T", excess: "₫200B", actionDetail: "Reduce safety stock from 14 to 10 days" },
    { component: "PLH Working Capital", bu: "Phuc Long Heritage", current: "₫1.0T", target: "₫0.8T", excess: "₫200B", actionDetail: "Optimize store-level ordering cadence" },
  ],
  capexAllocation: [
    { project: "WCM Store Conversions", budget: "₫1.8T", spent: "₫420B", roi: 340, status: "on-track" },
    { project: "PLH New Stores (47 planned)", budget: "₫600B", spent: "₫140B", roi: 220, status: "on-track" },
    { project: "WCM Rural Expansion", budget: "₫800B", spent: "₫180B", roi: 180, status: "on-track" },
    { project: "MCH Production Upgrade", budget: "₫500B", spent: "₫120B", roi: 160, status: "on-track" },
    { project: "Tech/Digital Platform", budget: "₫300B", spent: "₫80B", roi: 250, status: "delayed" },
    { project: "SUPRA Cold Chain", budget: "₫400B", spent: "₫90B", roi: 120, status: "on-track" },
    { project: "MEATDeli Farms", budget: "₫400B", spent: "₫170B", roi: 80, status: "delayed" },
  ],
  privateLabelPMF: [
    { category: "WCM Fish Sauce 500ml", pmfScore: 82, plhMargin: "34%", brandMargin: "28%", marginDelta: "+680bps", insight: "Outselling Chin-su at 23% of WCM stores. Repeat rate 78%. Ready to scale nationally." },
    { category: "WCM Instant Noodles 5-pack", pmfScore: 71, plhMargin: "31%", brandMargin: "24%", marginDelta: "+700bps", insight: "Strong in urban. Weaker in rural where Omachi brand loyalty is high. Target: urban-first expansion." },
    { category: "WCM Snacks Range", pmfScore: 64, plhMargin: "42%", brandMargin: "32%", marginDelta: "+1000bps", insight: "Highest margin delta. Limited distribution. Major scale opportunity if PMF reaches 75+." },
    { category: "WCM Fresh Pork 500g", pmfScore: 45, plhMargin: "18%", brandMargin: "15%", marginDelta: "+300bps", insight: "Low PMF — customers prefer MEATDeli brand trust. Not ready to scale." },
  ],
  rollingForecast: [
    { bu: "WinCommerce (WCM)", vsTarget: "+4.2%", ytd: "₫8.4T", yearEndEst: "₫34.8T", trajectory: [
      { label: "Q1A", value: 84, display: "₫8.4T", projected: false },
      { label: "Q2E", value: 88, display: "₫8.8T", projected: true },
      { label: "Q3E", value: 91, display: "₫9.1T", projected: true },
      { label: "Q4E", value: 85, display: "₫8.5T", projected: true },
    ]},
    { bu: "MCH (Consumer)", vsTarget: "-1.8%", ytd: "₫6.2T", yearEndEst: "₫24.1T", trajectory: [
      { label: "Q1A", value: 62, display: "₫6.2T", projected: false },
      { label: "Q2E", value: 64, display: "₫6.4T", projected: true },
      { label: "Q3E", value: 60, display: "₫6.0T", projected: true },
      { label: "Q4E", value: 55, display: "₫5.5T", projected: true },
    ]},
    { bu: "Phuc Long Heritage", vsTarget: "+18.4%", ytd: "₫1.8T", yearEndEst: "₫8.2T", trajectory: [
      { label: "Q1A", value: 18, display: "₫1.8T", projected: false },
      { label: "Q2E", value: 21, display: "₫2.1T", projected: true },
      { label: "Q3E", value: 22, display: "₫2.2T", projected: true },
      { label: "Q4E", value: 21, display: "₫2.1T", projected: true },
    ]},
    { bu: "MEATDeli", vsTarget: "-8.2%", ytd: "₫2.1T", yearEndEst: "₫7.8T", trajectory: [
      { label: "Q1A", value: 21, display: "₫2.1T", projected: false },
      { label: "Q2E", value: 19, display: "₫1.9T", projected: true },
      { label: "Q3E", value: 20, display: "₫2.0T", projected: true },
      { label: "Q4E", value: 18, display: "₫1.8T", projected: true },
    ]},
  ],
};

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
      {["\u{1F4DE}","\u2709\uFE0F","Z"].map((icon,i) => (
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

export {
  WebGLHexField,
  DATA_SOURCES,
  PEOPLE,
  SCENARIOS,
  ZALO_GROUPS,
  HAIKU_EXTRACTIONS,
  STORE_REGIONS,
  ALL_STORES,
  MAP_FILTERS,
  DIRECT_COVERAGE_METRICS,
  WIN_PLUS_METRICS,
  FINANCE_DATA,
  PersonChip,
  ImpactBadge,
};

// === END OF DATA LAYER — UI COMPONENTS IN PART 2 ===
