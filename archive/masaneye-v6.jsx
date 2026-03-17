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
// PEOPLE DIRECTORY
// ============================================================
const PEOPLE = {
  "sc_head": { name: "Trương Công Minh", role: "Head of Supply Chain — MEATDeli", phone: "+84 912 345 678", email: "cong.minh@meatdeli.vn", avatar: "TCM" },
  "trade_mkt": { name: "Hoàng Minh Châu", role: "Trade Marketing — D2", phone: "+84 906 890 123", email: "minh.chau@wincommerce.vn", avatar: "HMC" },
  "hr_d2": { name: "Lê Thị Hương", role: "HR Business Partner — D2", phone: "+84 905 678 901", email: "thi.huong@masan.vn", avatar: "LTH" },
  "cat_mgr": { name: "Nguyễn Hải", role: "Category Manager — Fresh", phone: "+84 908 567 890", email: "hai.nguyen@wincommerce.vn", avatar: "NH" },
  "supra_south": { name: "Deepak Singh", role: "CEO — SUPRA", phone: "+84 916 111 222", email: "deepak.singh@supra.vn", avatar: "DS" },
  "supra_ops": { name: "Nguyễn Thanh Tùng", role: "DC Ops Manager — South", phone: "+84 917 222 333", email: "thanh.tung@supra.vn", avatar: "NTT" },
  "mch_gt": { name: "Lê Quốc Bảo", role: "GT Channel Director — MCH", phone: "+84 918 333 444", email: "quoc.bao@masanconsumer.vn", avatar: "LQB" },
  "dc_cantho": { name: "Phạm Tuấn", role: "DC Manager — Cần Thơ", phone: "+84 914 012 345", email: "tuan.pham@meatdeli.vn", avatar: "PT" },
  "procurement": { name: "Phan Thanh Sơn", role: "Procurement Director — MEATDeli", phone: "+84 913 901 234", email: "thanh.son@meatdeli.vn", avatar: "PTS" },
};

// ============================================================
// DANNY QUERY SCENARIOS (now with SUPRA + KiotViet sources)
// ============================================================
const SCENARIOS = {
  "d2_ops": {
    query: "Chuyện gì đang xảy ra ở District 2 hôm nay?",
    sources: [
      { type: "zalo", name: "Zalo — WCM D2 Operations", icon: "💬", color: "#0068FF", items: [
        { group: "WCM D2 — Vận hành", sender: "Nguyễn Văn Hùng — SM 1247", msg: "MEATDeli xúc xích hết hàng từ sáng, NCC chưa giao.", time: "07:41" },
        { group: "WCM D2 — Vận hành", sender: "Trần Thị Mai — SM 1302", msg: "Cũng bị thiếu xúc xích MEATDeli. Gọi NCC không nghe máy.", time: "08:15" },
        { group: "WCM D2 — Regional", sender: "Phạm Đức Anh — RM D2", msg: "Circle K mới mở đối diện store 1247, đang chạy KM giảm 20%.", time: "10:05" },
        { group: "WCM D2 — Vận hành", sender: "Võ Minh Tuấn — SM 1389", msg: "Thiếu 2 NV ca tối, xin hỗ trợ.", time: "11:30" },
      ]},
      { type: "pos", name: "WCM POS — Transactions", icon: "🧾", color: "#16A34A", items: [
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
      { type: "kiotviet", name: "KiotViet — GT Intelligence (D2)", icon: "🏪", color: "#f59e0b", items: [
        { metric: "GT MEATDeli sell-through — D2", value: "↓18% WoW", detail: "47 GT stores in D2 showing declining MEATDeli orders. Same supply disruption hitting GT channel.", flag: "DECLINING" },
        { metric: "GT Meat Plus sell-through — D2", value: "↑31% WoW", detail: "Meat Plus gaining at 23 GT stores near WCM locations. Substitution pattern confirmed.", flag: "COMPETITOR" },
        { metric: "GT Circle K proximity impact", value: "6 GT stores affected", detail: "GT stores within 200m of new Circle K showing ↓12% basket size. Competitive pressure across channels.", flag: "ALERT" },
      ]},
      { type: "email", name: "Internal Reports", icon: "📧", color: "#7C3AED", items: [
        { from: "Supply Chain", subject: "NCC Minh Phát — Performance Alert", excerpt: "Fulfillment 64%, 3rd week declining." },
      ]},
    ],
    answer: {
      summary: "District 2: 3 vấn đề chính. SUPRA data confirms supply chain root cause. KiotViet shows same pattern hitting GT channel.",
      points: [
        { title: "🔴 MEATDeli supply chain disruption — MT + GT", detail: "12 WCM stores + 47 GT stores báo thiếu hàng. SUPRA confirms DC Long An chưa dispatch (no pickup scan). Root cause: NCC Minh Phát. GT data from KiotViet confirms Meat Plus gaining +31% ở cùng khu vực — substitution đang xảy ra ở CẢ HAI kênh.", action: "Reroute truck VN-51C-12847 từ DC Bình Dương (520 units, idle). Prioritize WCM stores first, allocate GT via MCH reps.", pic: "supra_ops", impact: "₫127M", impactLabel: "WCM + ₫84M GT = ₫211M total", actions: [{ label: "Reroute SUPRA Truck", type: "critical" }, { label: "Alert MCH GT Reps", type: "warning" }] },
        { title: "🟡 Circle K competitive threat — omnichannel", detail: "WCM Store 1247 revenue ↓8%. KiotViet shows 6 GT stores within 200m of Circle K cũng bị ↓12% basket size. Competitive pressure affects cả MT lẫn GT.", action: "Deploy counter-promo across MT + coordinate MCH GT team cho defensive pricing.", pic: "trade_mkt", impact: "₫34M", impactLabel: "MT + GT weekly risk", actions: [{ label: "Counter-Promo", type: "warning" }] },
        { title: "🟡 Store 1389 operational issues", detail: "Thiếu NV 2 ngày. Evening revenue ↓31%. SUPRA delivery to 1389 on-time nhưng staffing ảnh hưởng receiving.", action: "HR dispatch temp staff.", pic: "hr_d2", impact: "₫7M", impactLabel: "daily gap", actions: [{ label: "Temp Staff", type: "warning" }] },
      ],
      footer: "New insight từ KiotViet: MEATDeli đang mất share ở GT nhanh hơn MT. Cần coordinate response across channels.",
      entities: [
        { type: "dc", name: "DC Long An", status: "critical" }, { type: "dc", name: "DC Bình Dương", status: "ok" },
        { type: "truck", name: "VN-51C-12847", status: "ok" }, { type: "supplier", name: "NCC Minh Phát", status: "critical" },
        { type: "gt", name: "47 GT stores D2", status: "warning" }, { type: "competitor", name: "Circle K D2", status: "warning" },
      ]
    }
  },
  "chinsu_gt": {
    query: "Chin-su đang bán thế nào ở GT channel miền Nam?",
    sources: [
      { type: "kiotviet", name: "KiotViet — GT Chin-su Analytics", icon: "🏪", color: "#f59e0b", items: [
        { metric: "Chin-su nước mắm — GT South", value: "₫4.2B/week", detail: "12,400 GT stores stocking. Volume stable MoM. Market leader position maintained.", flag: "STABLE" },
        { metric: "Chin-su tương ớt — GT South", value: "₫1.8B/week", detail: "8,200 stores. ↑8% MoM driven by Tết promo carryover.", flag: "GROWING" },
        { metric: "Combo Tết Chin-su + dầu ăn", value: "SOLD OUT", detail: "367 GT stores report combo depleted. 89 stores still have 2-week inventory.", flag: "STOCKOUT" },
        { metric: "GT reorder frequency — Chin-su", value: "Every 6.2 days", detail: "Top 20% stores reorder every 4.1 days. Bottom 20% every 11.3 days. Distribution gap.", flag: "INSIGHT" },
        { metric: "Competitor: Magi nước mắm", value: "↑5% share MoM", detail: "Gaining in Mekong Delta GT. Price 15% lower. 340 new GT stores added this month.", flag: "COMPETITOR" },
      ]},
      { type: "zalo", name: "Zalo — MCH Sales Teams", icon: "💬", color: "#0068FF", items: [
        { group: "MCH — GT Sales South", sender: "Võ Hoàng — ASM Mekong", msg: "Magi đang đẩy mạnh ở chợ và GT khu vực Cần Thơ, Vĩnh Long. Giá rẻ hơn 15%.", time: "Yesterday" },
        { group: "MCH — GT Sales South", sender: "Trần Tâm — Sales Rep Đồng Tháp", msg: "Nhiều tiệm tạp hóa hỏi có Chin-su combo Tết không, hết rồi ko restock.", time: "2d ago" },
        { group: "MCH — GT Sales South", sender: "Lê Phương — ASM HCM East", msg: "GT stores gần WinMart+ đang order ít hơn. Chắc khách chuyển qua MT mua.", time: "3d ago" },
      ]},
      { type: "supra", name: "SUPRA — MCH GT Distribution", icon: "🏭", color: "#06b6d4", items: [
        { metric: "MCH GT delivery — Mekong cluster", value: "87% on-time", detail: "Target 95%. Bottleneck: DC Cần Thơ capacity. Same DC serving both MEATDeli + MCH dry goods.", flag: "BELOW" },
        { metric: "MCH GT route efficiency — South", value: "342 drops/day", detail: "18 MCH vans covering 12,400 GT stores. Avg 19 drops/van/day. Industry benchmark: 25.", flag: "INEFFICIENT" },
        { metric: "Chin-su combo — DC inventory", value: "0 units", detail: "All DCs depleted. Production batch scheduled next week. 367 GT stores backlogged.", flag: "STOCKOUT" },
      ]},
      { type: "pos", name: "WCM POS — Chin-su (for comparison)", icon: "🧾", color: "#16A34A", items: [
        { metric: "Chin-su nước mắm — WCM national", value: "↑3% MoM", detail: "MT channel growing. WCM Chin-su share: 34% of condiments category.", flag: "GROWING" },
        { metric: "Chin-su combo Tết — WCM", value: "SOLD OUT", detail: "Same stockout pattern. 847 WCM stores depleted vs 367 GT stores.", flag: "STOCKOUT" },
      ]},
    ],
    answer: {
      summary: "Chin-su GT miền Nam: core business stable, but 3 issues cần attention ngay — và KiotViet cho thấy GT insights mà trước đây mình không thấy được.",
      points: [
        { title: "🔴 Combo Tết stockout — cả MT lẫn GT", detail: "367 GT stores + 847 WCM stores hết combo Chin-su + dầu ăn. SUPRA confirm all DCs depleted, production batch tuần sau mới có. GT stores đang hỏi mà không restock được — mất doanh thu và mất trust từ chủ tiệm.", action: "Expedite production batch. Prioritize GT allocation — GT stores mất trust lâu hơn MT vì relationship-based.", pic: "mch_gt", impact: "₫890M", impactLabel: "estimated lost sales/week", actions: [{ label: "Expedite Production", type: "critical" }, { label: "GT Allocation Plan", type: "warning" }] },
        { title: "🟡 Magi competitive pressure — Mekong Delta", detail: "KiotViet shows Magi gaining +5% share MoM ở GT channel, thêm 340 stores mới. Giá rẻ hơn 15%. Zalo confirm sales team đang thấy pressure ở Cần Thơ, Vĩnh Long, Đồng Tháp. WCM POS không thấy pattern này vì Magi weak ở MT — chỉ GT data mới reveal được.", action: "Deploy targeted GT trade promo ở Mekong Delta. MCH reps focus 340 stores mới có Magi.", pic: "mch_gt", impact: "₫420M", impactLabel: "annual GT revenue at risk", actions: [{ label: "GT Counter-Promo", type: "warning" }, { label: "Brief MCH Reps", type: "normal" }] },
        { title: "🟡 SUPRA GT route inefficiency", detail: "MCH GT delivery chỉ 19 drops/van/day vs benchmark 25 — đang lãng phí 24% capacity. DC Cần Thơ bottleneck serving cả MEATDeli fresh + MCH dry goods. Mekong on-time delivery chỉ 87% vs 95% target.", action: "Route optimization study. Consider dedicated MCH GT van fleet for Mekong cluster.", pic: "supra_south", impact: "₫180M", impactLabel: "annual logistics savings", actions: [{ label: "Route Optimization", type: "normal" }] },
      ],
      footer: "Key insight: Magi gaining share ở GT mà WCM POS data hoàn toàn không thấy. Chỉ KiotViet GT data mới reveal competitive threat ở traditional trade. Đây là giá trị core của data partnership.",
      entities: [
        { type: "product", name: "Chin-su Nước mắm", status: "ok" }, { type: "product", name: "Combo Tết", status: "critical" },
        { type: "competitor", name: "Magi — Mekong", status: "warning" }, { type: "dc", name: "DC Cần Thơ", status: "warning" },
        { type: "gt", name: "12,400 GT stores South", status: "ok" }, { type: "gt", name: "340 GT — Magi new", status: "warning" },
      ]
    }
  },
  "meatdeli_margin": {
    query: "Tại sao margin MEATDeli giảm tháng này?",
    sources: [
      { type: "zalo", name: "Zalo — MEATDeli Groups", icon: "💬", color: "#0068FF", items: [
        { group: "MEATDeli — Sales South", sender: "Trần Minh — ASM", msg: "Khách phản ánh giá cao hơn Meat Plus. Store GT chuyển đối thủ.", time: "2d ago" },
        { group: "MEATDeli — Logistics", sender: "Phạm Tuấn — DC Cần Thơ", msg: "Spoilage 6.2% vs 3.8%. Xe lạnh #7 chờ sửa 2 tuần.", time: "4d ago" },
      ]},
      { type: "supra", name: "SUPRA — Cold Chain Analytics", icon: "🏭", color: "#06b6d4", items: [
        { metric: "Cold chain compliance — South", value: "88.4%", detail: "Target 97%. DC Cần Thơ pulling avg down. 2 trucks with temp excursions >+2°C. 14 incidents this week.", flag: "CRITICAL" },
        { metric: "Fleet — Refrigerated trucks South", value: "14/18 operational", detail: "Truck #7: compressor failed, parts ETA 10 days. Truck #3: intermittent cooling. 2 in scheduled service.", flag: "DEGRADED" },
        { metric: "Spoilage cost — SUPRA tracked", value: "₫312M MTD", detail: "vs ₫189M same period last month. 65% from DC Cần Thơ routes. Temp data confirms cold chain breaks.", flag: "ALERT" },
        { metric: "DC Cần Thơ throughput", value: "↓22% capacity", detail: "Serving MEATDeli fresh + MCH dry goods. Fresh prioritized but overflow causing delays on both.", flag: "BOTTLENECK" },
      ]},
      { type: "kiotviet", name: "KiotViet — GT MEATDeli", icon: "🏪", color: "#f59e0b", items: [
        { metric: "MEATDeli GT sell-through — South", value: "↓14% MoM", detail: "2,100 GT stores. Decline concentrated in Mekong Delta + Tier 2 cities.", flag: "DECLINING" },
        { metric: "Meat Plus GT sell-through — South", value: "↑28% MoM", detail: "Gaining in 890 GT stores. Strongest in price-sensitive districts.", flag: "COMPETITOR" },
        { metric: "GT stores dropping MEATDeli", value: "127 stores", detail: "Stopped reordering in last 30 days. 73% cited price, 27% cited freshness/quality issues.", flag: "CHURN" },
        { metric: "MEATDeli GT return rate", value: "3.8%", detail: "vs 1.2% industry avg. Expired/damaged product returns spiked in Mekong region.", flag: "QUALITY" },
      ]},
      { type: "pos", name: "WCM POS — MEATDeli", icon: "🧾", color: "#16A34A", items: [
        { metric: "MEATDeli volume", value: "↓11% MoM", delta: "Tier 2 concentrated", flag: "DECLINING" },
        { metric: "Markdown/waste", value: "4.8%", delta: "↑ from 2.9%", flag: "ALERT" },
      ]},
      { type: "email", name: "Finance Reports", icon: "📧", color: "#7C3AED", items: [
        { from: "FP&A", subject: "Margin Alert", excerpt: "Gross margin -340bps to 22.1%. COGS +12%, markdown +190bps." },
      ]},
    ],
    answer: {
      summary: "Margin giảm 340bps. SUPRA data pinpoints exact cold chain failures. KiotViet reveals GT damage is worse than MT — 127 stores stopped ordering entirely.",
      points: [
        { title: "🔴 Cold chain failure — SUPRA data confirms root cause", detail: "SUPRA tracking: cold chain compliance 88.4% (target 97%). 14 temp excursions this week. Truck #7 compressor dead (10 day ETA). Spoilage cost ₫312M MTD vs ₫189M. KiotViet: GT return rate 3.8% vs 1.2% avg — quality issues reaching end customer.", action: "Emergency: rent temp truck ₫3M/day (cheaper than ₫8M/day spoilage). Fix #7 or replace compressor from alternative supplier.", pic: "supra_ops", impact: "₫312M", impactLabel: "MTD spoilage cost", actions: [{ label: "Rent Temp Truck", type: "critical" }, { label: "Replace Compressor", type: "critical" }] },
        { title: "🔴 GT channel bleeding — invisible without KiotViet", detail: "127 GT stores stopped ordering MEATDeli (30 day). WCM POS only shows ↓11% — but GT is ↓14% AND churning stores. Meat Plus gaining +28% in GT vs +23% in MT. GT return rate 3.8% means quality issues from cold chain are destroying GT relationships.", action: "MCH GT team: contact 127 churned stores with quality assurance + incentive to re-order. Fix cold chain FIRST or re-engagement will fail.", pic: "mch_gt", impact: "₫890M", impactLabel: "annual GT revenue at risk", actions: [{ label: "GT Win-Back Program", type: "warning" }, { label: "Quality Guarantee", type: "normal" }] },
        { title: "🟡 Input cost spike — structural", detail: "Feed +12%, farm gate +8%. Not fixable short-term. But cold chain fix + GT recovery can offset 150-200bps of the 340bps decline.", action: "Shift mix to premium processed SKUs. Hedge Q3 forward contracts.", pic: "procurement", impact: "₫1.2B", impactLabel: "COGS increase/mo", actions: [{ label: "Pricing Review", type: "warning" }] },
      ],
      footer: "Without KiotViet data: we'd see ↓11% in MT and miss that GT is churning 127 stores entirely. Without SUPRA data: we'd know spoilage is up but not that truck #7's compressor is the specific cause. Both data layers turn this from 'margin is down' into 'here's the exact truck and exact 127 stores to fix.'",
      entities: [
        { type: "truck", name: "Truck #7 — CT", status: "critical" }, { type: "dc", name: "DC Cần Thơ", status: "critical" },
        { type: "gt", name: "127 churned GT stores", status: "critical" }, { type: "competitor", name: "Meat Plus", status: "warning" },
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
  { id: "mch_gt_south", name: "MCH — GT Sales South", memberCount: 42, avatar: "GT", avatarColor: "#f59e0b",
    messages: [
      { sender: "Võ Hoàng", role: "ASM Mekong", msg: "Team ơi Magi đẩy mạnh ở chợ GT khu Cần Thơ, Vĩnh Long", time: "08:00", type: "text" },
      { sender: "Trần Tâm", role: "Rep Đồng Tháp", msg: "Confirm, giá rẻ hơn Chin-su 15%. Nhiều tiệm bắt đầu chuyển", time: "08:08", type: "text" },
      { sender: "Lê Phương", role: "ASM HCM East", msg: "GT stores gần WinMart+ order ít hơn. Khách chuyển MT", time: "08:15", type: "text" },
      { sender: "Nguyễn Duy", role: "Rep Cần Thơ", msg: "Có ai có data Magi bán được bao nhiêu ko?", time: "08:20", type: "text" },
      { sender: "Võ Hoàng", role: "ASM Mekong", msg: "Ước tính 340 GT stores mới carry Magi tháng này", time: "08:25", type: "text" },
      { sender: "Trần Tâm", role: "Rep Đồng Tháp", msg: "Tiệm tạp hóa hỏi combo Tết Chin-su, hết rồi ko restock 😤", time: "08:30", type: "text" },
      { sender: "Phạm Loan", role: "Rep Bến Tre", msg: "Same. Mất mấy deal combo vì hết hàng", time: "08:35", type: "text" },
      { sender: "Lê Phương", role: "ASM HCM East", msg: "MEATDeli cũng bị GT trả hàng nhiều tháng này. Hàng ko tươi", time: "08:42", type: "text" },
      { sender: "Võ Hoàng", role: "ASM Mekong", msg: "Hàng giao chậm + ko đủ lạnh = hàng hư = GT mất niềm tin", time: "08:48", type: "text" },
      { sender: "Nguyễn Duy", role: "Rep Cần Thơ", msg: "Chính xác. Mấy tiệm quen bắt đầu quay lưng", time: "08:52", type: "text" },
      { sender: "Trần Tâm", role: "Rep Đồng Tháp", msg: "😢😢", time: "08:53", type: "noise" },
    ]
  },
];

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
  "mch_gt_south": {
    groupName: "MCH — GT Sales South", messagesProcessed: 11, noiseFiltered: 1,
    signals: [
      { category: "COMPETITIVE", urgency: "high", store: "GT Mekong", sku: "Chin-su vs Magi", summary: "Magi gaining ở Cần Thơ, Vĩnh Long. Giá rẻ 15%. 340 new GT stores.", confidence: 0.92, kiotMatch: "KiotViet: Magi +5% share MoM. Confirmed in 340 stores." },
      { category: "STOCKOUT", urgency: "high", store: "GT South", sku: "Combo Tết Chin-su", summary: "GT stores hỏi combo Tết, hết hàng ko restock. Mất deal.", confidence: 0.90, kiotMatch: "KiotViet: 367 GT stores report combo depleted." },
      { category: "QUALITY", urgency: "high", store: "GT South", sku: "MEATDeli", summary: "GT trả hàng MEATDeli do ko tươi. Cold chain issue ảnh hưởng GT trust.", confidence: 0.93, kiotMatch: "KiotViet: MEATDeli GT return rate 3.8% vs 1.2% avg. 127 stores stopped ordering." },
      { category: "CHANNEL_SHIFT", urgency: "medium", store: "GT near WCM", sku: "MCH general", summary: "GT stores gần WinMart+ bị mất traffic sang MT.", confidence: 0.85, kiotMatch: "KiotViet: GT stores <500m from WCM showing ↓9% avg revenue." },
    ]
  },
};

// ============================================================
// KIOTVIET GT DATA (Tab 3)
// ============================================================
// ============================================================
// STORE INTELLIGENCE MAP DATA
// ============================================================
const STORE_REGIONS = [
  { id: "hcm_d1", name: "Quận 1", lat: 10.776, lng: 106.701, stores: [
    { id: "W1001", type: "wcm", name: "WinMart+ Nguyễn Huệ", status: "ok", rev: "₫48M/d", alerts: [] },
    { id: "W1002", type: "wcm", name: "WinMart+ Lê Lợi", status: "ok", rev: "₫52M/d", alerts: [] },
    { id: "G1001", type: "gt", name: "Tạp hóa Chị Hai", status: "ok", rev: "₫3.2M/d", alerts: [] },
    { id: "G1002", type: "gt", name: "Mini Mart Kim", status: "warning", rev: "₫2.1M/d", alerts: ["Chin-su combo stockout"] },
    { id: "G1003", type: "gt", name: "Tiệm Bà Năm", status: "ok", rev: "₫1.8M/d", alerts: [] },
  ]},
  { id: "hcm_d2", name: "Quận 2 (Thủ Đức)", lat: 10.787, lng: 106.750, stores: [
    { id: "W1247", type: "wcm", name: "WinMart+ 1247", status: "critical", rev: "₫0/d", alerts: ["MEATDeli stockout", "Circle K competition", "Revenue ↓8% WoW"] },
    { id: "W1302", type: "wcm", name: "WinMart+ 1302", status: "critical", rev: "₫12M/d", alerts: ["MEATDeli stockout", "NCC Minh Phát unresponsive"] },
    { id: "W1389", type: "wcm", name: "WinMart+ 1389", status: "warning", rev: "₫28M/d", alerts: ["Staffing -2 NV ca tối", "Revenue ↓31% evening"] },
    { id: "W1455", type: "wcm", name: "WinMart+ 1455", status: "warning", rev: "₫31M/d", alerts: ["Freezer compressor failing"] },
    { id: "G2001", type: "gt", name: "Tạp hóa Thanh Hương", status: "critical", rev: "₫0/d", alerts: ["MEATDeli CHURN — stopped ordering", "Switched to Meat Plus"] },
    { id: "G2002", type: "gt", name: "Shop Minh", status: "warning", rev: "₫1.4M/d", alerts: ["Chin-su combo inquiry — OOS at distributor"] },
    { id: "G2003", type: "gt", name: "GT Mini Q2", status: "ok", rev: "₫2.8M/d", alerts: ["Phúc Long first order"] },
    { id: "G2004", type: "gt", name: "Tiệm Cô Tư", status: "warning", rev: "₫1.1M/d", alerts: ["Chin-su tương ớt low stock: 4 bottles"] },
    { id: "G2005", type: "gt", name: "Quán Ba Mập", status: "critical", rev: "₫0.4M/d", alerts: ["MEATDeli return — expired product"] },
    { id: "G2006", type: "gt", name: "Mart Út Huy", status: "warning", rev: "₫1.6M/d", alerts: ["Meat Plus gaining — substitution"] },
  ]},
  { id: "hcm_d7", name: "Quận 7", lat: 10.734, lng: 106.722, stores: [
    { id: "W7001", type: "wcm", name: "WinMart+ PMH", status: "ok", rev: "₫67M/d", alerts: [] },
    { id: "W7002", type: "wcm", name: "WinMart Crescent", status: "ok", rev: "₫89M/d", alerts: [] },
    { id: "G7001", type: "gt", name: "GT Mini Q7", status: "ok", rev: "₫3.1M/d", alerts: ["Phúc Long first order: 24 boxes"] },
    { id: "G7002", type: "gt", name: "Tạp hóa Hạnh", status: "ok", rev: "₫2.4M/d", alerts: [] },
  ]},
  { id: "hcm_bt", name: "Bình Thạnh", lat: 10.802, lng: 106.710, stores: [
    { id: "WBT01", type: "wcm", name: "WinMart+ Bạch Đằng", status: "ok", rev: "₫41M/d", alerts: [] },
    { id: "WBT02", type: "wcm", name: "WinMart+ Xô Viết", status: "warning", rev: "₫35M/d", alerts: ["MEATDeli markdown ↑4.8%"] },
    { id: "GBT01", type: "gt", name: "Tạp hóa Thanh Hương", status: "critical", rev: "₫0.8M/d", alerts: ["MEATDeli CHURN", "Switched to Meat Plus"] },
    { id: "GBT02", type: "gt", name: "Tiệm Anh Tuấn", status: "ok", rev: "₫2.2M/d", alerts: [] },
    { id: "GBT03", type: "gt", name: "Mini Mart Ngọc", status: "warning", rev: "₫1.5M/d", alerts: ["Magi first order — competitor entry"] },
  ]},
  { id: "hcm_gv", name: "Gò Vấp", lat: 10.838, lng: 106.650, stores: [
    { id: "WGV01", type: "wcm", name: "WinMart+ Quang Trung", status: "ok", rev: "₫44M/d", alerts: [] },
    { id: "GGV01", type: "gt", name: "Mini Mart Tân", status: "ok", rev: "₫3.6M/d", alerts: ["Kokomi +60% reorder"] },
    { id: "GGV02", type: "gt", name: "Tạp hóa Phương", status: "ok", rev: "₫1.9M/d", alerts: [] },
  ]},
  { id: "bienhoa", name: "Biên Hòa", lat: 10.945, lng: 106.842, stores: [
    { id: "WBH01", type: "wcm", name: "WinMart+ Đồng Khởi", status: "ok", rev: "₫38M/d", alerts: [] },
    { id: "GBH01", type: "gt", name: "Chị Ba Grocery", status: "critical", rev: "₫1.4M/d", alerts: ["Meat Plus first order 30kg", "Was MEATDeli exclusive — LOST"] },
    { id: "GBH02", type: "gt", name: "Tạp hóa Minh Tâm", status: "ok", rev: "₫2.0M/d", alerts: [] },
  ]},
  { id: "longan", name: "Long An", lat: 10.536, lng: 106.413, stores: [
    { id: "WLA01", type: "wcm", name: "WinMart+ Tân An", status: "ok", rev: "₫29M/d", alerts: [] },
    { id: "GLA01", type: "gt", name: "Tạp hóa Phú", status: "ok", rev: "₫1.7M/d", alerts: ["Wake-Up regular reorder"] },
    { id: "GLA02", type: "gt", name: "Tiệm Út Nguyên", status: "warning", rev: "₫1.2M/d", alerts: ["MEATDeli delivery delayed 3h"] },
  ]},
  { id: "cantho", name: "Cần Thơ", lat: 10.045, lng: 105.747, stores: [
    { id: "WCT01", type: "wcm", name: "WinMart Ninh Kiều", status: "warning", rev: "₫51M/d", alerts: ["MEATDeli spoilage 6.2%", "DC Cần Thơ cold chain 88.4%"] },
    { id: "WCT02", type: "wcm", name: "WinMart+ Cái Răng", status: "warning", rev: "₫27M/d", alerts: ["MEATDeli markdown ↑"] },
    { id: "GCT01", type: "gt", name: "Mini Mart Hòa", status: "critical", rev: "₫0.6M/d", alerts: ["Magi first order 48 bottles", "Chin-su losing to Magi -15% price"] },
    { id: "GCT02", type: "gt", name: "Tạp hóa Ba Liêm", status: "warning", rev: "₫1.3M/d", alerts: ["Magi gaining", "MCH delivery 87% on-time"] },
    { id: "GCT03", type: "gt", name: "Chợ GT Cần Thơ", status: "critical", rev: "₫0.9M/d", alerts: ["MEATDeli return — not fresh", "Cold chain break confirmed"] },
  ]},
  { id: "vinhlong", name: "Vĩnh Long", lat: 10.254, lng: 105.972, stores: [
    { id: "WVL01", type: "wcm", name: "WinMart+ Vĩnh Long", status: "ok", rev: "₫24M/d", alerts: [] },
    { id: "GVL01", type: "gt", name: "Tiệm Bà Năm", status: "critical", rev: "₫0.5M/d", alerts: ["MEATDeli return 12 packs expired", "Quality issue — cold chain"] },
    { id: "GVL02", type: "gt", name: "Tạp hóa Hai Lúa", status: "warning", rev: "₫1.1M/d", alerts: ["Magi gaining — price pressure"] },
  ]},
  { id: "dongthap", name: "Đồng Tháp", lat: 10.467, lng: 105.633, stores: [
    { id: "WDT01", type: "wcm", name: "WinMart+ Cao Lãnh", status: "ok", rev: "₫22M/d", alerts: [] },
    { id: "GDT01", type: "gt", name: "Tạp hóa Út Em", status: "ok", rev: "₫2.3M/d", alerts: ["Omachi +25% reorder — GROWTH"] },
    { id: "GDT02", type: "gt", name: "Tiệm Chú Bảy", status: "warning", rev: "₫0.9M/d", alerts: ["Combo Tết Chin-su OOS", "Lost deals — no restock"] },
  ]},
];

// Flatten all stores with region info
const ALL_STORES = STORE_REGIONS.flatMap(r => r.stores.map(s => ({ ...s, region: r.name, regionId: r.id })));

// Filter presets for navigation from Danny interface
const MAP_FILTERS = {
  "meatdeli_stockout": { label: "MEATDeli Stockout", match: s => s.alerts.some(a => a.toLowerCase().includes("meatdeli") && (a.toLowerCase().includes("stockout") || a.toLowerCase().includes("churn"))) },
  "meatdeli_quality": { label: "MEATDeli Quality", match: s => s.alerts.some(a => a.toLowerCase().includes("meatdeli") && (a.toLowerCase().includes("return") || a.toLowerCase().includes("spoilage") || a.toLowerCase().includes("cold chain") || a.toLowerCase().includes("expired"))) },
  "competitor_magi": { label: "Magi Competition", match: s => s.alerts.some(a => a.toLowerCase().includes("magi")) },
  "competitor_meatplus": { label: "Meat Plus Competition", match: s => s.alerts.some(a => a.toLowerCase().includes("meat plus")) },
  "chinsu_oos": { label: "Chin-su Stockout", match: s => s.alerts.some(a => a.toLowerCase().includes("chin-su") && (a.toLowerCase().includes("stockout") || a.toLowerCase().includes("oos") || a.toLowerCase().includes("combo"))) },
  "circle_k": { label: "Circle K Threat", match: s => s.alerts.some(a => a.toLowerCase().includes("circle k")) },
  "all_critical": { label: "All Critical", match: s => s.status === "critical" },
  "all_warning": { label: "All Warnings", match: s => s.status === "warning" || s.status === "critical" },
  "all": { label: "All Stores", match: () => true },
};

const KIOTVIET_METRICS = {
  overview: { totalStores: "78,400", masanSkuCoverage: "34,200", avgTxPerStore: "127/day", dataFreshness: "15 min delay" },
  categories: [
    { name: "Condiments (Chin-su, Nam Ngư)", stores: "18,400", weeklyRev: "₫28.4B", trend: "+3%", status: "stable" },
    { name: "Instant Noodles (Omachi, Kokomi)", stores: "21,200", weeklyRev: "₫41.2B", trend: "+7%", status: "growing" },
    { name: "MEATDeli (chilled/processed)", stores: "4,800", weeklyRev: "₫8.1B", trend: "-14%", status: "declining" },
    { name: "Beverages (Wake-Up, Vinacafé)", stores: "12,600", weeklyRev: "₫15.7B", trend: "+2%", status: "stable" },
    { name: "Phúc Long (packaged)", stores: "3,200", weeklyRev: "₫4.3B", trend: "+18%", status: "growing" },
  ],
  competitorWatch: [
    { brand: "Magi (nước mắm)", vs: "Chin-su", gtShare: "22%", trend: "↑5% MoM", hotspot: "Mekong Delta", risk: "high" },
    { brand: "Meat Plus", vs: "MEATDeli", gtShare: "31%", trend: "↑8% MoM", hotspot: "HCM + South", risk: "critical" },
    { brand: "Acecook", vs: "Omachi/Kokomi", gtShare: "41%", trend: "flat", hotspot: "National", risk: "low" },
    { brand: "Trung Nguyên", vs: "Wake-Up/Vinacafé", gtShare: "38%", trend: "↓2% MoM", hotspot: "North + Central", risk: "low" },
  ],
  realtimeFeed: [
    { time: "11:42", store: "Tạp hóa Thanh Hương — Q.Bình Thạnh", event: "MEATDeli xúc xích reorder: 0 units (was 20/week)", flag: "CHURN" },
    { time: "11:38", store: "Mini Mart Hòa — Cần Thơ", event: "Magi nước mắm first order: 48 bottles", flag: "COMPETITOR" },
    { time: "11:35", store: "Tiệm Bà Năm — Vĩnh Long", event: "MEATDeli return: 12 packs expired", flag: "QUALITY" },
    { time: "11:31", store: "Shop Minh — Thủ Đức", event: "Chin-su combo Tết inquiry — out of stock at distributor", flag: "STOCKOUT" },
    { time: "11:28", store: "Tạp hóa Út Em — Đồng Tháp", event: "Omachi carton reorder: 5 cartons (+25% vs last week)", flag: "GROWTH" },
    { time: "11:24", store: "GT Mini — Q.7 HCM", event: "Phúc Long packaged tea first order: 24 boxes", flag: "NEW_DIST" },
    { time: "11:20", store: "Chị Ba Grocery — Biên Hòa", event: "Meat Plus first order: 30kg (was MEATDeli exclusive)", flag: "COMPETITOR" },
    { time: "11:17", store: "Tạp hóa Phú — Long An", event: "Wake-Up 247 reorder: regular cadence, 3 cartons", flag: "STABLE" },
    { time: "11:14", store: "Mini Mart Tân — Gò Vấp", event: "Kokomi reorder: 8 cartons (+60% vs usual)", flag: "GROWTH" },
    { time: "11:10", store: "Tiệm Cô Tư — Q.2 HCM", event: "Chin-su tương ớt low stock alert: 4 bottles remaining", flag: "LOW_STOCK" },
  ]
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
// TAB 1: DANNY QUERY
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
  const typeColors = { supra: "#06b6d4", kiotviet: "#f59e0b" };
  return (
    <div style={{ background: "rgba(255,255,255,0.9)", border: `1px solid ${phase === "done" ? source.color + "44" : "#e2e8f0"}`, borderRadius: 8, padding: "9px 11px", marginBottom: 5, transition: "all 0.3s", opacity: phase === "scan" ? 0.5 : 1, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
        <span style={{ fontSize: 12 }}>{source.icon}</span>
        <span style={{ color: source.color, fontWeight: 700, fontSize: 10, fontFamily: "monospace" }}>{source.name}</span>
        {(source.type === "supra" || source.type === "kiotviet") && <span style={{ background: source.color + "22", color: source.color, fontSize: 7, padding: "1px 4px", borderRadius: 3, fontFamily: "monospace", fontWeight: 700 }}>NEW</span>}
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
              <span style={{ background: ({ STOCKOUT:"#dc262622",ALERT:"#ea580c22",COMPETITOR:"#7c3aed22",BELOW:"#eab30822",DECLINING:"#eab30822",CRITICAL:"#dc262622",DEGRADED:"#dc262622",BOTTLENECK:"#ea580c22",DELAYED:"#dc262622",AVAILABLE:"#16a34a22",NORMAL:"#16a34a22",INEFFICIENT:"#eab30822",GROWING:"#16a34a22",STABLE:"#33415522",INSIGHT:"#2563eb22",CHURN:"#dc262622",QUALITY:"#dc262622" })[it.flag] || "#33415522",
                color: ({ STOCKOUT:"#dc2626",ALERT:"#ea580c",COMPETITOR:"#7c3aed",BELOW:"#ca8a04",DECLINING:"#ca8a04",CRITICAL:"#dc2626",DEGRADED:"#dc2626",BOTTLENECK:"#ea580c",DELAYED:"#dc2626",AVAILABLE:"#16a34a",NORMAL:"#16a34a",INEFFICIENT:"#ca8a04",GROWING:"#16a34a",STABLE:"#94a3b8",INSIGHT:"#60a5fa",CHURN:"#dc2626",QUALITY:"#dc2626" })[it.flag] || "#94a3b8",
                fontSize: 7, padding: "1px 4px", borderRadius: 3, fontFamily: "monospace", fontWeight: 700, flexShrink: 0 }}>{it.flag}</span>
            </div>
            {it.detail && <div style={{ color: "#64748b", fontSize: 8, marginTop: 2 }}>{it.detail}</div>}
          </>)}
        </div>
      ))}
    </div>
  );
};

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
  return (
    <div style={{ background: "linear-gradient(135deg,#e8f0fe,#f0f4ff)", border: "1px solid #bfdbfe", borderRadius: 10, padding: "13px 15px", marginTop: 10, animation: "fadeSlide 0.4s", boxShadow: "0 2px 12px rgba(37,99,235,0.08)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <div style={{ width: 22, height: 22, borderRadius: 5, background: "linear-gradient(135deg,#2563eb,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff" }}>M</div>
        <span style={{ color: "#2563eb", fontWeight: 700, fontSize: 10, fontFamily: "monospace" }}>MasanEye — Synthesis</span>
      </div>
      <div style={{ color: "#1e293b", fontSize: 12, lineHeight: 1.4, marginBottom: 10 }}>{answer.summary}</div>
      {answer.points.slice(0, vp).map((p, i) => (
        <div key={i} style={{ background: "#f0f7ff", borderRadius: 7, padding: "10px 11px", marginBottom: 7, borderLeft: p.title.includes("🔴") ? "3px solid #ef4444" : "3px solid #eab308", animation: "fadeSlide 0.3s" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 6, marginBottom: 5 }}><div style={{ color: "#0f172a", fontSize: 11, fontWeight: 700 }}>{p.title}</div><ImpactBadge amount={p.impact} label={p.impactLabel} /></div>
          <div style={{ color: "#94a3b8", fontSize: 10, lineHeight: 1.5, marginBottom: 7 }}>{p.detail}</div>
          <div style={{ background: "#eff6ff", borderRadius: 5, padding: "5px 8px", color: "#1d4ed8", fontSize: 10, lineHeight: 1.4, marginBottom: 7, border: "1px solid #bfdbfe" }}>💡 {p.action}</div>
          {p.pic && <div style={{ marginBottom: 7 }}><div style={{ color: "#475569", fontSize: 7, fontFamily: "monospace", marginBottom: 2, fontWeight: 700 }}>PIC</div><PersonChip personKey={p.pic} onContact={onContact} /></div>}
          {p.actions && <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>{p.actions.map((a, j) => {
            const c = { critical: { bg: "#dc262622", b: "#dc262666", t: "#dc2626" }, warning: { bg: "#eab30822", b: "#eab30866", t: "#ca8a04" }, normal: { bg: "#33415522", b: "#33415566", t: "#94a3b8" } }[a.type];
            return <button key={j} onClick={() => onAction?.(a.label)} style={{ background: c.bg, border: `1px solid ${c.b}`, borderRadius: 4, padding: "3px 8px", color: c.t, fontSize: 9, cursor: "pointer", fontFamily: "monospace", fontWeight: 600 }}>▶ {a.label}</button>;
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
            const icons = { dc: "🏭", truck: "🚛", supplier: "📦", competitor: "⚔️", gt: "🏪", product: "🏷️", store: "🏬" };
            // Map entity types to store map filters
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
// TAB 2: ZALO + SUPRA INGESTION
// ============================================================
const ZaloGroupList = ({ groups, selectedId, onSelect }) => (
  <div style={{ width: 240, borderRight: "1px solid #e2e8f0", background: "#f1f5f9", overflow: "auto", flexShrink: 0 }}>
    <div style={{ padding: "10px 12px", borderBottom: "1px solid #e2e8f0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <div style={{ width: 24, height: 24, borderRadius: 5, background: "#0068FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff" }}>Z</div>
        <div><div style={{ color: "#1e293b", fontSize: 12, fontWeight: 700 }}>Trợ lý Masan</div><div style={{ color: "#4ade80", fontSize: 8, fontFamily: "monospace" }}>● Monitoring</div></div>
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
              <div style={{ color: m.type === "noise" ? "#475569" : "#475569", fontSize: 11, lineHeight: 1.3, fontStyle: m.type === "noise" ? "italic" : "normal" }}>{m.msg}</div>
              {m.type === "noise" && <span style={{ fontSize: 7, color: "#94a3b8", fontFamily: "monospace" }}>⊘ NOISE</span>}
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
          <span style={{ color: "#16a34a", fontSize: 10, fontWeight: 700, fontFamily: "monospace" }}>Haiku + SUPRA/KiotViet Enrichment</span>
        </div>
        <div style={{ color: "#475569", fontSize: 9 }}>{ext.groupName} • {ext.messagesProcessed} msgs • {ext.noiseFiltered} noise</div>
        <div style={{ marginTop: 4, fontSize: 9, fontFamily: "monospace" }}>
          {phase === "proc" && <span style={{ color: "#fbbf24", animation: "pulse 1s infinite" }}>● PROCESSING...</span>}
          {phase === "extract" && <span style={{ color: "#fbbf24", animation: "pulse 1s infinite" }}>● EXTRACTING + ENRICHING...</span>}
          {phase === "done" && <span style={{ color: "#4ade80" }}>✓ {ext.signals.length} signals enriched</span>}
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
            {s.store && <div style={{ color: "#64748b", fontSize: 8, fontFamily: "monospace" }}>{s.store}{s.sku ? ` • ${s.sku}` : ""}</div>}
            <div style={{ color: "#475569", fontSize: 10, lineHeight: 1.3, marginTop: 2 }}>{s.summary}</div>
            <div style={{ color: "#94a3b8", fontSize: 8, fontFamily: "monospace", marginTop: 2 }}>conf: {s.confidence}</div>
            {/* SUPRA enrichment */}
            {s.supraMatch && (
              <div style={{ marginTop: 4, padding: "4px 7px", background: "#06b6d411", border: "1px solid #06b6d433", borderRadius: 4 }}>
                <div style={{ color: "#06b6d4", fontSize: 7, fontFamily: "monospace", fontWeight: 700, marginBottom: 1 }}>🏭 SUPRA ENRICHMENT</div>
                <div style={{ color: "#0891b2", fontSize: 9, lineHeight: 1.3 }}>{s.supraMatch}</div>
              </div>
            )}
            {/* KiotViet enrichment */}
            {s.kiotMatch && (
              <div style={{ marginTop: 4, padding: "4px 7px", background: "#f59e0b11", border: "1px solid #f59e0b33", borderRadius: 4 }}>
                <div style={{ color: "#f59e0b", fontSize: 7, fontFamily: "monospace", fontWeight: 700, marginBottom: 1 }}>🏪 KIOTVIET GT MATCH</div>
                <div style={{ color: "#b45309", fontSize: 9, lineHeight: 1.3 }}>{s.kiotMatch}</div>
              </div>
            )}
          </div>
        ))}
        {phase === "done" && (
          <div style={{ marginTop: 6, padding: "6px 8px", background: "#16a34a11", border: "1px solid #16a34a33", borderRadius: 5, animation: "fadeSlide 0.3s" }}>
            <div style={{ color: "#4ade80", fontSize: 9, fontFamily: "monospace", fontWeight: 600 }}>→ Signals + enrichments → Postgres</div>
            <div style={{ color: "#22c55e", fontSize: 8, fontFamily: "monospace" }}>→ Available for Danny queries</div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// TAB 3: KIOTVIET GT DASHBOARD
// ============================================================
const KiotVietTab = () => {
  const [feedVis, setFeedVis] = useState(0);
  useEffect(() => { let c = 0; const iv = setInterval(() => { c++; setFeedVis(c); if (c >= KIOTVIET_METRICS.realtimeFeed.length) clearInterval(iv); }, 600); return () => clearInterval(iv); }, []);
  const flagColors = { CHURN: "#ef4444", COMPETITOR: "#7c3aed", QUALITY: "#ea580c", STOCKOUT: "#dc2626", GROWTH: "#16a34a", NEW_DIST: "#0891b2", STABLE: "#94a3b8", LOW_STOCK: "#ca8a04" };
  const trendColors = { growing: "#4ade80", stable: "#94a3b8", declining: "#ef4444" };

  return (
    <div style={{ flex: 1, overflow: "auto", padding: "14px 20px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: "#f59e0b22", border: "1px solid #f59e0b44", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏪</div>
        <div>
          <div style={{ color: "#1e293b", fontSize: 16, fontWeight: 700 }}>KiotViet GT Data Partnership</div>
          <div style={{ color: "#f59e0b", fontSize: 10, fontFamily: "monospace" }}>API Integration — 78,400 GT stores • Real-time sell-through data</div>
        </div>
      </div>

      {/* Overview metrics */}
      <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
        {Object.entries(KIOTVIET_METRICS.overview).map(([k, v]) => (
          <div key={k} style={{ flex: 1, background: "#ffffff", borderRadius: 6, padding: "8px 10px", textAlign: "center" }}>
            <div style={{ color: "#475569", fontSize: 8, fontFamily: "monospace", marginBottom: 2 }}>{{ totalStores: "GT Stores", masanSkuCoverage: "Masan SKU Coverage", avgTxPerStore: "Avg Tx/Store", dataFreshness: "Data Freshness" }[k]}</div>
            <div style={{ color: k === "dataFreshness" ? "#4ade80" : "#1e293b", fontSize: 15, fontWeight: 800, fontFamily: "monospace" }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        {/* Left: Categories + Competitors */}
        <div style={{ flex: 1 }}>
          <div style={{ color: "#475569", fontSize: 9, fontFamily: "monospace", fontWeight: 700, marginBottom: 6 }}>MASAN PRODUCT CATEGORIES — GT PERFORMANCE</div>
          {KIOTVIET_METRICS.categories.map((c, i) => (
            <div key={i} style={{ background: "#ffffff", borderRadius: 6, padding: "8px 10px", marginBottom: 4, display: "flex", alignItems: "center", gap: 8, borderLeft: `3px solid ${trendColors[c.status]}` }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#1e293b", fontSize: 11, fontWeight: 600 }}>{c.name}</div>
                <div style={{ color: "#64748b", fontSize: 9 }}>{c.stores} stores stocking</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "#1e293b", fontSize: 12, fontWeight: 700, fontFamily: "monospace" }}>{c.weeklyRev}</div>
                <div style={{ color: trendColors[c.status], fontSize: 9, fontFamily: "monospace" }}>{c.trend} MoM</div>
              </div>
            </div>
          ))}

          <div style={{ color: "#475569", fontSize: 9, fontFamily: "monospace", fontWeight: 700, marginBottom: 6, marginTop: 14 }}>COMPETITOR WATCH — GT CHANNEL</div>
          {KIOTVIET_METRICS.competitorWatch.map((c, i) => (
            <div key={i} style={{ background: "#ffffff", borderRadius: 6, padding: "8px 10px", marginBottom: 4, borderLeft: `3px solid ${{ critical: "#ef4444", high: "#f59e0b", low: "#22c55e" }[c.risk]}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ color: "#1e293b", fontSize: 11, fontWeight: 600 }}>{c.brand} <span style={{ color: "#475569", fontWeight: 400 }}>vs {c.vs}</span></span>
                <span style={{ color: { critical: "#dc2626", high: "#ca8a04", low: "#16a34a" }[c.risk], fontSize: 9, fontFamily: "monospace", fontWeight: 700 }}>{c.risk.toUpperCase()} RISK</span>
              </div>
              <div style={{ display: "flex", gap: 12, color: "#94a3b8", fontSize: 9 }}>
                <span>GT Share: <b style={{ color: "#1e293b" }}>{c.gtShare}</b></span>
                <span>Trend: <b style={{ color: c.trend.includes("↑") ? "#dc2626" : c.trend.includes("↓") ? "#16a34a" : "#94a3b8" }}>{c.trend}</b></span>
                <span>Hotspot: {c.hotspot}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Real-time feed */}
        <div style={{ width: 360, flexShrink: 0 }}>
          <div style={{ color: "#475569", fontSize: 9, fontFamily: "monospace", fontWeight: 700, marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 5, height: 5, borderRadius: 3, background: "#4ade80", animation: "pulse 1.5s infinite" }} />
            REAL-TIME GT TRANSACTION FEED
          </div>
          {KIOTVIET_METRICS.realtimeFeed.slice(0, feedVis).map((f, i) => (
            <div key={i} style={{ background: "#ffffff", borderRadius: 6, padding: "7px 9px", marginBottom: 3, animation: "fadeSlide 0.25s", borderLeft: `2px solid ${flagColors[f.flag]}33` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span style={{ color: "#64748b", fontSize: 8, fontFamily: "monospace" }}>{f.time}</span>
                <span style={{ background: flagColors[f.flag] + "22", color: flagColors[f.flag], fontSize: 7, padding: "1px 4px", borderRadius: 3, fontFamily: "monospace", fontWeight: 700 }}>{f.flag}</span>
              </div>
              <div style={{ color: "#94a3b8", fontSize: 9 }}>{f.store}</div>
              <div style={{ color: "#475569", fontSize: 10, lineHeight: 1.3 }}>{f.event}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Value proposition */}
      <div style={{ marginTop: 16, background: "#e0ecff", border: "1px solid #93c5fd", borderRadius: 8, padding: "12px 14px" }}>
        <div style={{ color: "#2563eb", fontSize: 11, fontWeight: 700, marginBottom: 6 }}>💡 Why this matters — data we'd NEVER see without KiotViet</div>
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { title: "GT Competitive Intel", detail: "Magi gaining 5% share in GT — invisible in WCM POS. Only GT data reveals traditional trade dynamics.", icon: "⚔️" },
            { title: "GT Churn Detection", detail: "127 GT stores stopped ordering MEATDeli. WCM data shows demand decline but can't identify store-level GT churn.", icon: "📉" },
            { title: "GT Quality Feedback", detail: "3.8% return rate at GT vs 1.2% avg. Cold chain issues are destroying GT trust faster than MT.", icon: "🌡️" },
            { title: "GT ↔ MT Cannibalization", detail: "GT stores near WinMart+ showing ↓9% revenue. Understanding channel dynamics prevents friendly fire.", icon: "🔄" },
          ].map((v, i) => (
            <div key={i} style={{ flex: 1, background: "#f0f4ff", borderRadius: 6, padding: "8px 10px" }}>
              <div style={{ fontSize: 16, marginBottom: 4 }}>{v.icon}</div>
              <div style={{ color: "#1e293b", fontSize: 10, fontWeight: 600, marginBottom: 3 }}>{v.title}</div>
              <div style={{ color: "#94a3b8", fontSize: 9, lineHeight: 1.4 }}>{v.detail}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// TAB 4: STORE INTELLIGENCE MAP (Hex Grid)
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
            <span style={{ color: "#64748b", fontSize: 9 }}>•</span>
            <span style={{ color: "#94a3b8", fontSize: 9 }}>{store.region}</span>
          </div>
        </div>
        <button onClick={onClose} style={{ background: "#e2e8f0", border: "none", borderRadius: 4, width: 24, height: 24, color: "#64748b", cursor: "pointer", fontSize: 12 }}>✕</button>
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
                <span style={{ color: ac, fontSize: 10 }}>{isC ? "●" : isComp ? "⚔" : "▲"}</span>
                <span style={{ color: "#475569", fontSize: 10, lineHeight: 1.3 }}>{a}</span>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ background: "#16a34a11", borderRadius: 5, padding: "8px", textAlign: "center" }}>
          <span style={{ color: "#4ade80", fontSize: 10, fontFamily: "monospace" }}>✓ No active alerts</span>
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

  // Count stats
  const totalStores = ALL_STORES.length;
  const criticalCount = ALL_STORES.filter(s => s.status === "critical").length;
  const warningCount = ALL_STORES.filter(s => s.status === "warning").length;
  const wcmCount = ALL_STORES.filter(s => s.type === "wcm").length;
  const gtCount = ALL_STORES.filter(s => s.type === "gt").length;
  const matchedCount = ALL_STORES.filter(filterFn).length;

  // Layout hexagons per region in a cluster
  const regionLayouts = STORE_REGIONS.map((region, ri) => {
    // Position regions in a geographic-ish layout
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
      {/* Left: Map */}
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
            { l: "WCM", v: wcmCount, c: "#ef4444", icon: "■" },
            { l: "GT", v: gtCount, c: "#f59e0b", icon: "■" },
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
            {/* Grid background */}
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

            {/* Region labels and connection lines */}
            {regionLayouts.map(({ region, center }, i) => (
              <g key={region.id}>
                {/* Subtle region boundary */}
                <circle cx={center.cx} cy={center.cy} r={region.stores.length * 14 + 20} fill="none" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="4,4" opacity="0.3" />
                <text x={center.cx} y={center.cy - region.stores.length * 7 - 18} textAnchor="middle" fill={hoveredRegion === region.id ? "#1e293b" : "#94a3b8"} fontSize="9" fontFamily="'Segoe UI',system-ui" fontWeight="600" style={{ transition: "fill 0.2s" }}>{region.name}</text>
              </g>
            ))}

            {/* DC markers */}
            {[
              { name: "DC Long An", x: 170, y: 310, status: "critical" },
              { name: "DC Bình Dương", x: 560, y: 60, status: "ok" },
              { name: "DC Cần Thơ", x: 80, y: 450, status: "critical" },
            ].map((dc, i) => (
              <g key={i}>
                <rect x={dc.x - 14} y={dc.y - 8} width={28} height={16} rx={3} fill={dc.status === "critical" ? "#dc262622" : "#16a34a22"} stroke={dc.status === "critical" ? "#dc2626" : "#16a34a"} strokeWidth="0.8" />
                <text x={dc.x} y={dc.y + 3} textAnchor="middle" fill={dc.status === "critical" ? "#dc2626" : "#16a34a"} fontSize="6" fontFamily="monospace" fontWeight="700">DC</text>
                <text x={dc.x} y={dc.y + 22} textAnchor="middle" fill="#475569" fontSize="6.5" fontFamily="monospace">{dc.name}</text>
                {dc.status === "critical" && <circle cx={dc.x + 16} cy={dc.y - 6} r={3} fill="#ef4444"><animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" /></circle>}
              </g>
            ))}

            {/* Store hexagons */}
            {regionLayouts.map(({ region, positions }) => (
              <g key={region.id} onMouseEnter={() => setHoveredRegion(region.id)} onMouseLeave={() => setHoveredRegion(null)}>
                {positions.map(({ store, x, y }) => (
                  <StoreHex
                    key={store.id}
                    store={store}
                    x={x} y={y}
                    size={HEX_SIZE}
                    selected={selectedStore?.id === store.id}
                    dimmed={hasFilter && !matchedIds.has(store.id)}
                    onClick={setSelectedStore}
                  />
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
            {/* Legend */}
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

            {/* Regional summary */}
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
                    <span style={{ color: "#94a3b8" }}> • </span>
                    <span style={{ color: "#f59e0b88", fontFamily: "monospace" }}>{r.stores.filter(s => s.type === "gt").length} GT</span>
                  </div>
                </div>
              );
            })}

            {/* Critical stores list */}
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
// MAIN APP
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

      {/* HEADER — glass effect */}
      <div style={{ padding: "8px 18px", borderBottom: "1px solid rgba(226,232,240,0.8)", display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.82)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", flexShrink: 0, position: "relative", zIndex: 2 }}>
        <div style={{ width: 30, height: 30, borderRadius: 6, background: "linear-gradient(135deg,#2563eb,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color: "#fff" }}>M</div>
        <div><div style={{ fontWeight: 700, fontSize: 14 }}>MasanEye</div><div style={{ color: "#475569", fontSize: 8, fontFamily: "monospace" }}>Operational Intelligence Platform</div></div>

        <div style={{ marginLeft: 24, display: "flex", gap: 2, background: "rgba(241,245,249,0.7)", borderRadius: 6, padding: 2 }}>
          {[
            { id: "query", label: "🎯 Danny Interface" },
            { id: "ingest", label: "👁️ Zalo + SUPRA Ingestion" },
            { id: "kiotviet", label: "🏪 KiotViet GT Intel" },
            { id: "storemap", label: "⬡ Store Map" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: "5px 12px", borderRadius: 4, border: "none", cursor: "pointer",
              background: tab === t.id ? "#ffffff" : "transparent", color: tab === t.id ? "#1e293b" : "#64748b",
              fontSize: 10, fontWeight: tab === t.id ? 600 : 400, fontFamily: "inherit", transition: "all 0.15s",
              boxShadow: tab === t.id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}>{t.label}</button>
          ))}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          {[{n:"Zalo",c:"#0068FF"},{n:"POS",c:"#16A34A"},{n:"SUPRA",c:"#06b6d4"},{n:"KiotViet",c:"#f59e0b"},{n:"Email",c:"#7c3aed"}].map(s => (
            <div key={s.n} style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <div style={{ width: 4, height: 4, borderRadius: 2, background: "#4ade80", animation: "pulse 2s infinite" }} />
              <span style={{ color: s.c, fontSize: 8, fontFamily: "monospace", fontWeight: 600 }}>{s.n}</span>
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
                <div style={{ color: "#94a3b8", fontSize: 17, fontWeight: 300, marginBottom: 14 }}>Chào anh Danny. Hỏi em bất cứ điều gì.</div>
                <div style={{ color: "#475569", fontSize: 8, fontFamily: "monospace", marginBottom: 5, fontWeight: 700 }}>SUGGESTED — now with SUPRA + KiotViet GT data</div>
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
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6, color: "#64748b", fontSize: 9, fontFamily: "monospace" }}><div style={{ width: 5, height: 5, borderRadius: 3, background: "#eab308", animation: "pulse 1s infinite" }} />Querying {sc.sources.length} sources (Zalo + POS + SUPRA + KiotViet + Email)...</div>
                {sc.sources.map((src, i) => <SourceCard key={i} source={src} delay={i * 1400} />)}
                <AnswerBlock answer={sc.answer} delay={sc.sources.length * 1400 + 800} onContact={(m, p) => setContactModal({ method: m, person: p })} onAction={l => setToast(l)} onNavigateMap={navigateToMap} />
                <button onClick={() => setScenario(null)} style={{ marginTop: 10, background: "transparent", border: "1px solid #e2e8f0", borderRadius: 4, padding: "4px 10px", color: "#64748b", fontSize: 9, cursor: "pointer", fontFamily: "monospace" }}>← Back</button>
              </div>
            )}
          </div>
          <div style={{ padding: "7px 18px", borderTop: "1px solid rgba(226,232,240,0.6)", background: "rgba(241,245,249,0.75)", backdropFilter: "blur(12px)", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", background: "rgba(255,255,255,0.9)", border: "1px solid #e2e8f0", borderRadius: 8, padding: "0 12px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <input value={inputVal} onChange={e => setInputVal(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && inputVal.trim()) { const l = inputVal.toLowerCase(); if (l.includes("chin") || l.includes("gt")) setScenario("chinsu_gt"); else if (l.includes("margin") || l.includes("meatdeli")) setScenario("meatdeli_margin"); else setScenario("d2_ops"); setInputVal(""); } }}
                placeholder="Hỏi gì cũng được... (thử: 'Chin-su GT miền Nam?')" style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#1e293b", fontSize: 12, padding: "9px 0", fontFamily: "inherit" }} />
              <span style={{ color: "#475569", fontSize: 8, fontFamily: "monospace" }}>⏎</span>
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

      {/* TAB 3: KIOTVIET */}
      {tab === "kiotviet" && <div style={{ flex: 1, position: "relative", zIndex: 1 }}><KiotVietTab /></div>}

      {/* TAB 4: STORE MAP */}
      {tab === "storemap" && <div style={{ flex: 1, display: "flex", position: "relative", zIndex: 1 }}><HexMapTab initialFilter={mapFilter} onNavigateBack={() => setTab("query")} /></div>}

      {/* Modal */}
      {contactModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.2)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }} onClick={() => setContactModal(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, minWidth: 290, boxShadow: "0 25px 60px rgba(0,0,0,0.12)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: "linear-gradient(135deg,#e2e8f0,#cbd5e1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#1e293b", fontFamily: "monospace" }}>{contactModal.person.avatar}</div>
              <div><div style={{ color: "#0f172a", fontSize: 14, fontWeight: 700 }}>{contactModal.person.name}</div><div style={{ color: "#64748b", fontSize: 10 }}>{contactModal.person.role}</div></div>
            </div>
            {[{ l: "Phone", v: contactModal.person.phone }, { l: "Email", v: contactModal.person.email }].map((b, i) => (
              <div key={i} style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: 6, padding: "7px 10px", marginBottom: 5, display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ fontSize: 14 }}>{i === 0 ? "📞" : "✉️"}</span>
                <div><div style={{ color: "#94a3b8", fontSize: 8 }}>{b.l}</div><div style={{ color: "#1e293b", fontSize: 12, fontFamily: "monospace" }}>{b.v}</div></div>
              </div>
            ))}
            <button onClick={() => setContactModal(null)} style={{ width: "100%", marginTop: 8, padding: "7px", background: "#2563eb", border: "none", borderRadius: 6, color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Close</button>
          </div>
        </div>
      )}

      {toast && <div style={{ position: "fixed", bottom: 16, right: 16, zIndex: 998, background: "#16a34a", borderRadius: 7, padding: "8px 14px", color: "#fff", fontSize: 11, fontWeight: 600, animation: "fadeSlide 0.3s", boxShadow: "0 4px 16px rgba(0,0,0,0.4)" }}>✓ {toast}{(() => { setTimeout(() => setToast(null), 2000); return null; })()}</div>}
    </div>
  );
}

function Ticker() {
  const [t, setT] = useState(0);
  useEffect(() => { const iv = setInterval(() => setT(x => x + 1), 2800); return () => clearInterval(iv); }, []);
  const a = [
    "🔴 STOCKOUT: MEATDeli Xúc xích — 12 WCM + 47 GT stores D2",
    "🏪 KIOTVIET: 127 GT stores stopped ordering MEATDeli (30d)",
    "🏭 SUPRA: Cold chain compliance 88.4% — DC Cần Thơ critical",
    "🟡 KIOTVIET: Magi gaining +5% GT share in Mekong Delta",
    "🔴 SUPRA: Truck #7 compressor failed — ₫312M spoilage MTD",
    "🟢 KIOTVIET: Phúc Long packaged tea +18% GT sell-through",
  ];
  return <div style={{ background: "rgba(241,245,249,0.8)", borderBottom: "1px solid rgba(226,232,240,0.6)", padding: "4px 18px", height: 22, flexShrink: 0, overflow: "hidden", backdropFilter: "blur(8px)" }}><div style={{ color: "#64748b", fontSize: 9, fontFamily: "'JetBrains Mono',monospace", whiteSpace: "nowrap" }}>{a[t % a.length]}</div></div>;
}
