"use client";
import { useState, CSSProperties } from "react";

/* ────────────────────────────────────────────────────────────
   DESIGN TOKENS
──────────────────────────────────────────────────────────── */
const C = {
  purple:      "#2D1B6B",
  purpleMid:   "#3D2A8A",
  purpleLight: "#EEE9FF",
  teal:        "#00B8A9",
  tealDark:    "#008F83",
  tealLight:   "#E0F7F5",
  tealMid:     "#B2EDE9",
  gray50:      "#F8FAFB",
  gray100:     "#EEF2F5",
  gray200:     "#DDE3EB",
  gray400:     "#96A3B4",
  gray600:     "#5A6B7D",
  gray800:     "#2C3E50",
  green:       "#22C55E",
  red:         "#EF4444",
  amber:       "#F59E0B",
  blue:        "#3B82F6",
  white:       "#FFFFFF",
};

/* ────────────────────────────────────────────────────────────
   TYPES  (SRS v4.0 Annex C)
──────────────────────────────────────────────────────────── */
type AgentStatus   = "PROSPECT"|"PROMOTED"|"ACTIVE"|"SUSPENDED";
type ApvStatus     = "PENDING_REVIEW"|"APPROVED"|"REJECTED"|"ON_HOLD";
type LedgerStatus  = "PENDING_REVIEW"|"APPROVED"|"REJECTED"|"ON_HOLD";
type ReclawStatus  = "OPEN"|"INVESTIGATING"|"RESOLVED"|"DENIED";
type Priority      = "LOW"|"MEDIUM"|"HIGH"|"CRITICAL";
type PolicyStatus  = "ACTIVE"|"INACTIVE"|"DRAFT";
type MetricType    = "PERCENT_REV"|"FIXED_USD";

interface Agent {
  id: string; idType: "PRODUCTION"|"PARTNER_KEY";
  name: string; email: string; initials: string;
  status: AgentStatus; tier: "BRONZE"|"SILVER"|"GOLD"|"PLATINUM";
  policyId?: string; parentId?: string;
  referrals: number; payable: number; location?: string;
  source: "BULK_UPLOAD"|"WEB_SIGNUP"|"APP_AUTO_ENROLL"|"TIER2_RECRUITMENT";
  geoFlag?: boolean; w9: boolean; terms: boolean;
}
interface PolicyTier { seq: number; months: number; metric: MetricType; value: number; }
interface Policy {
  id: string; name: string;
  cat: "CLEANING"|"LANDSCAPING"|"HANDYMAN"|"ALL";
  desc: string; status: PolicyStatus; tiers: PolicyTier[];
  spiff: boolean; spiffN?: number; spiffAmt?: number;
  created: string; ver: string;
}
interface Approval {
  id: string; agentId: string; agentName: string; agentEmail: string;
  type: "PARTNER_APPLICATION"|"PAYOUT_REQUEST"|"TIER_UPGRADE"|"POLICY_CHANGE";
  amount?: number; submitted: string; status: ApvStatus; notes?: string; reviewer?: string;
}
interface Ledger {
  id: string; agentId: string; agentName: string;
  projectId: string; address: string;
  txType: "EARNING"|"TIER2_OVERRIDE"|"RECLAW"|"SPIFF";
  fee: number; amount: number; status: LedgerStatus;
  policy: string; created: string; reasonCode?: string;
}
interface Reclaw {
  id: string; agentId: string; agentName: string; agentEmail: string;
  type: "COMMISSION_DISPUTE"|"PAYMENT_ERROR"|"FRAUD_REPORT"|"CHARGEBACK_REVERSAL";
  amount: number; desc: string; reasonCode: string;
  submitted: string; status: ReclawStatus; priority: Priority;
  assignedTo?: string; resolution?: string;
}

/* ────────────────────────────────────────────────────────────
   MOCK DATA  (SRS 22-step scenario)
──────────────────────────────────────────────────────────── */
const AGENTS: Agent[] = [
  { id:"X-Jane123", idType:"PARTNER_KEY", name:"Jane Mitchell", email:"jane@mdrealty.com", initials:"JM", status:"ACTIVE", tier:"GOLD", policyId:"pol-vip", referrals:47, payable:0, location:"Bethesda, MD", source:"BULK_UPLOAD", w9:true, terms:true },
  { id:"88472", idType:"PRODUCTION", name:"Bob Homeowner", email:"bob@example.com", initials:"BH", status:"ACTIVE", tier:"BRONZE", policyId:"pol-base", referrals:2, payable:0, location:"Aspen Hill, MD", source:"APP_AUTO_ENROLL", w9:false, terms:true },
  { id:"X-9a8b7c6d", idType:"PARTNER_KEY", name:"Priya Sharma", email:"priya@capitol.com", initials:"PS", status:"ACTIVE", tier:"PLATINUM", policyId:"pol-vip", parentId:"X-Jane123", referrals:89, payable:5670, location:"Arlington, VA", source:"TIER2_RECRUITMENT", w9:true, terms:true },
  { id:"X-Kevin01", idType:"PARTNER_KEY", name:"Kevin O'Brien", email:"kevin@example.com", initials:"KO", status:"PROSPECT", tier:"BRONZE", referrals:0, payable:0, location:"Washington, DC", source:"BULK_UPLOAD", w9:false, terms:false },
  { id:"X-Aisha55", idType:"PARTNER_KEY", name:"Aisha Thompson", email:"aisha@example.com", initials:"AT", status:"PROMOTED", tier:"SILVER", policyId:"pol-std", referrals:0, payable:0, location:"Rockville, MD", source:"WEB_SIGNUP", geoFlag:true, w9:false, terms:false },
  { id:"72341", idType:"PRODUCTION", name:"Marcus Williams", email:"marcus@example.com", initials:"MW", status:"ACTIVE", tier:"SILVER", policyId:"pol-std", referrals:23, payable:1150, location:"Silver Spring, MD", source:"APP_AUTO_ENROLL", w9:true, terms:true },
];

const POLICIES: Policy[] = [
  { id:"pol-vip", name:"Realtor VIP Policy", cat:"CLEANING", desc:"Temporal decay: 50% gross revenue months 1-6, 25% months 7-12. Designed for high-value realtor partners.", status:"ACTIVE", tiers:[{seq:1,months:6,metric:"PERCENT_REV",value:0.5},{seq:2,months:6,metric:"PERCENT_REV",value:0.25}], spiff:true, spiffN:10, spiffAmt:100, created:"2024-01-01", ver:"2.1" },
  { id:"pol-base", name:"Global Consumer Policy", cat:"ALL", desc:"Auto-attached to all new app registrations. Zero-friction enrollment (SRS §3.4).", status:"ACTIVE", tiers:[{seq:1,months:12,metric:"PERCENT_REV",value:0.1}], spiff:false, created:"2024-01-01", ver:"1.0" },
  { id:"pol-std", name:"Standard Commission", cat:"CLEANING", desc:"Standard 10% of gross revenue for 12 months.", status:"ACTIVE", tiers:[{seq:1,months:12,metric:"PERCENT_REV",value:0.1}], spiff:false, created:"2024-01-01", ver:"1.3" },
  { id:"pol-lawn", name:"Landscaping Flat Fee", cat:"LANDSCAPING", desc:"$20 fixed per completed job. Multi-service expansion (SRS §3.5).", status:"ACTIVE", tiers:[{seq:1,months:12,metric:"FIXED_USD",value:20}], spiff:false, created:"2024-06-01", ver:"1.0" },
  { id:"pol-holiday", name:"Holiday Boost", cat:"ALL", desc:"Temporary +3% overlay for December. Spiff after 5 referrals.", status:"ACTIVE", tiers:[{seq:1,months:1,metric:"PERCENT_REV",value:0.13}], spiff:true, spiffN:5, spiffAmt:50, created:"2024-11-20", ver:"1.0" },
  { id:"pol-q1", name:"Q1 2025 Rate Update", cat:"CLEANING", desc:"Proposed 12% rate for Q1 2025. Pending review.", status:"DRAFT", tiers:[{seq:1,months:3,metric:"PERCENT_REV",value:0.12}], spiff:false, created:"2024-12-01", ver:"0.1" },
];

const APPROVALS: Approval[] = [
  { id:"apv-001", agentId:"X-Kevin01", agentName:"Kevin O'Brien", agentEmail:"kevin@example.com", type:"PARTNER_APPLICATION", submitted:"2024-12-10", status:"PENDING_REVIEW", notes:"Maryland Realtor Expo CSV. Verify realty license." },
  { id:"apv-002", agentId:"X-Jane123", agentName:"Jane Mitchell", agentEmail:"jane@mdrealty.com", type:"PAYOUT_REQUEST", amount:1200, submitted:"2024-12-09", status:"PENDING_REVIEW", notes:"Q4 earnings payout. All ledger entries approved." },
  { id:"apv-003", agentId:"X-Aisha55", agentName:"Aisha Thompson", agentEmail:"aisha@example.com", type:"PARTNER_APPLICATION", submitted:"2024-12-08", status:"ON_HOLD", notes:"Geo-fencing alert. Vietnamese IPs on MD addresses." },
  { id:"apv-004", agentId:"88472", agentName:"Bob Homeowner", agentEmail:"bob@example.com", type:"PAYOUT_REQUEST", amount:580, submitted:"2024-12-07", status:"APPROVED", reviewer:"Admin" },
  { id:"apv-005", agentId:"72341", agentName:"Marcus Williams", agentEmail:"marcus@example.com", type:"PARTNER_APPLICATION", submitted:"2024-11-30", status:"APPROVED", reviewer:"Admin" },
  { id:"apv-006", agentId:"X-9a8b7c6d", agentName:"Priya Sharma", agentEmail:"priya@capitol.com", type:"POLICY_CHANGE", submitted:"2024-12-05", status:"REJECTED", reviewer:"Admin", notes:"Denied — Realtor VIP already superior." },
];

const LEDGER: Ledger[] = [
  { id:"ldg-001", agentId:"X-Jane123", agentName:"Jane Mitchell", projectId:"PROJ-40021", address:"123 Main Street, Aspen Hill, MD 20906", txType:"EARNING", fee:20, amount:10, status:"APPROVED", policy:"Realtor VIP — Tier 1 (50%)", created:"2024-12-01" },
  { id:"ldg-002", agentId:"X-Jane123", agentName:"Jane Mitchell", projectId:"PROJ-40021", address:"123 Main Street, Aspen Hill, MD 20906", txType:"RECLAW", fee:20, amount:-10, status:"APPROVED", policy:"Manual Adjustment", created:"2024-12-09", reasonCode:"CHARGEBACK_REVERSAL" },
  { id:"ldg-003", agentId:"X-9a8b7c6d", agentName:"Priya Sharma", projectId:"PROJ-41055", address:"456 Oak Ave, Arlington, VA 22201", txType:"EARNING", fee:35, amount:17.5, status:"APPROVED", policy:"Realtor VIP — Tier 1 (50%)", created:"2024-12-05" },
  { id:"ldg-004", agentId:"X-Jane123", agentName:"Jane Mitchell", projectId:"PROJ-41055", address:"456 Oak Ave, Arlington, VA 22201", txType:"TIER2_OVERRIDE", fee:35, amount:3.5, status:"PENDING_REVIEW", policy:"Tier-2 Override (10%) — Priya Sharma", created:"2024-12-05" },
  { id:"ldg-005", agentId:"72341", agentName:"Marcus Williams", projectId:"PROJ-39900", address:"789 Elm St, Silver Spring, MD 20901", txType:"EARNING", fee:15, amount:1.5, status:"PENDING_REVIEW", policy:"Standard — Tier 1 (10%)", created:"2024-12-10" },
  { id:"ldg-006", agentId:"X-9a8b7c6d", agentName:"Priya Sharma", projectId:"PROJ-42100", address:"12 Sunset Blvd, Bethesda, MD 20814", txType:"SPIFF", fee:0, amount:100, status:"PENDING_REVIEW", policy:"Realtor VIP — Spiff (10 referrals/Dec)", created:"2024-12-11" },
];

const RECLAWS: Reclaw[] = [
  { id:"rcl-001", agentId:"X-Jane123", agentName:"Jane Mitchell", agentEmail:"jane@mdrealty.com", type:"CHARGEBACK_REVERSAL", amount:-10, desc:"Bob Homeowner initiated fraudulent chargeback on $200 deep clean at 123 Main Street, Aspen Hill MD. KLEENUP lost funds. Reversing commission.", reasonCode:"CHARGEBACK_REVERSAL", submitted:"2024-12-09", status:"RESOLVED", priority:"HIGH", assignedTo:"Finance Team", resolution:"Commission reversed via ldg-002. Net payable $0.00." },
  { id:"rcl-002", agentId:"X-Aisha55", agentName:"Aisha Thompson", agentEmail:"aisha@example.com", type:"FRAUD_REPORT", amount:-450, desc:"Geo-fencing detected 90% of lead handoffs from Vietnamese IPs while addresses are in Maryland. Possible referral stuffing. Account auto-frozen.", reasonCode:"GEO_FRAUD_DETECTED", submitted:"2024-12-08", status:"INVESTIGATING", priority:"CRITICAL", assignedTo:"Compliance Team" },
  { id:"rcl-003", agentId:"72341", agentName:"Marcus Williams", agentEmail:"marcus@example.com", type:"COMMISSION_DISPUTE", amount:85, desc:"Commission not credited for 3 referral completions in October. Projects: PROJ-38821, PROJ-38955, PROJ-39012.", reasonCode:"MISSING_COMMISSION_CREDIT", submitted:"2024-12-01", status:"INVESTIGATING", priority:"MEDIUM", assignedTo:"Support Team" },
  { id:"rcl-004", agentId:"88472", agentName:"Bob Homeowner", agentEmail:"bob@example.com", type:"PAYMENT_ERROR", amount:-200, desc:"Double deduction from payout cycle. Expected $580, received $380.", reasonCode:"DUPLICATE_LEDGER_ENTRY", submitted:"2024-12-05", status:"OPEN", priority:"HIGH" },
];

const MONTHLY = [
  { month:"Jul", referrals:210, payouts:123 },
  { month:"Aug", referrals:245, payouts:141 },
  { month:"Sep", referrals:280, payouts:158 },
  { month:"Oct", referrals:310, payouts:172 },
  { month:"Nov", referrals:298, payouts:169 },
  { month:"Dec", referrals:342, payouts:184 },
];

/* ────────────────────────────────────────────────────────────
   SMALL UI COMPONENTS  (all inline styles, zero imports)
──────────────────────────────────────────────────────────── */
function Av({ s }: { s: string }) {
  return <div style={{ width:32,height:32,borderRadius:"50%",background:C.tealLight,color:C.tealDark,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0 }}>{s}</div>;
}

const BADGE_MAP: Record<string,{bg:string;color:string}> = {
  PENDING_REVIEW: {bg:"#FEF3C7",color:"#D97706"},
  APPROVED:       {bg:"#DCFCE7",color:"#16A34A"},
  REJECTED:       {bg:"#FEE2E2",color:"#DC2626"},
  ON_HOLD:        {bg:"#DBEAFE",color:"#2563EB"},
  ACTIVE:         {bg:"#DCFCE7",color:"#16A34A"},
  SUSPENDED:      {bg:"#FEE2E2",color:"#DC2626"},
  PROMOTED:       {bg:"#DBEAFE",color:"#2563EB"},
  PROSPECT:       {bg:C.gray100,color:C.gray600},
  DRAFT:          {bg:C.purpleLight,color:C.purple},
  INACTIVE:       {bg:C.gray100,color:C.gray600},
  OPEN:           {bg:"#FEE2E2",color:"#DC2626"},
  INVESTIGATING:  {bg:"#FEF3C7",color:"#D97706"},
  RESOLVED:       {bg:"#DCFCE7",color:"#16A34A"},
  DENIED:         {bg:C.gray100,color:C.gray600},
};

function Badge({ v }: { v: string }) {
  const m = BADGE_MAP[v] ?? {bg:C.gray100,color:C.gray600};
  return <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"2px 9px",borderRadius:20,fontSize:11,fontWeight:600,background:m.bg,color:m.color,whiteSpace:"nowrap"}}><span style={{width:5,height:5,borderRadius:"50%",background:"currentColor",display:"inline-block"}} />{v.replace(/_/g," ")}</span>;
}

function Btn({ children, onClick, v="primary", sm=false }: { children: React.ReactNode; onClick?: ()=>void; v?: "primary"|"ghost"|"approve"|"reject"|"purple"; sm?: boolean }) {
  const BG: Record<string,string> = {primary:C.teal,ghost:"transparent",approve:"#DCFCE7",reject:"#FEE2E2",purple:C.purple};
  const FG: Record<string,string> = {primary:C.white,ghost:C.gray600,approve:"#16A34A",reject:"#DC2626",purple:C.white};
  return (
    <button onClick={onClick} style={{display:"inline-flex",alignItems:"center",gap:5,padding:sm?"4px 9px":"7px 14px",borderRadius:8,fontSize:sm?11:12,fontWeight:600,cursor:"pointer",border:v==="ghost"?`1px solid ${C.gray200}`:"none",background:BG[v],color:FG[v],fontFamily:"inherit",whiteSpace:"nowrap",transition:"opacity 0.15s"}}
      onMouseEnter={e=>(e.currentTarget.style.opacity="0.8")}
      onMouseLeave={e=>(e.currentTarget.style.opacity="1")}>
      {children}
    </button>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: CSSProperties }) {
  return <div style={{background:C.white,borderRadius:14,border:`1px solid ${C.gray200}`,overflow:"hidden",...style}}>{children}</div>;
}

function CH({ title, sub, action }: { title:string; sub?:string; action?: React.ReactNode }) {
  return (
    <div style={{padding:"14px 18px",borderBottom:`1px solid ${C.gray100}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div>
        <div style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:14,color:C.purple}}>{title}</div>
        {sub && <div style={{fontSize:11,color:C.gray400,marginTop:1}}>{sub}</div>}
      </div>
      {action}
    </div>
  );
}

function StatCard({ icon, value, label, trend, up }: { icon:string; value:string|number; label:string; trend?:string; up?:boolean }) {
  return (
    <div style={{background:C.white,borderRadius:14,padding:18,border:`1px solid ${C.gray200}`}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <div style={{width:40,height:40,borderRadius:11,background:C.tealLight,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{icon}</div>
        {trend && <span style={{fontSize:11,fontWeight:600,padding:"2px 7px",borderRadius:20,background:up?"#DCFCE7":"#FEE2E2",color:up?C.green:C.red}}>{trend}</span>}
      </div>
      <div style={{fontFamily:"Syne,sans-serif",fontSize:26,fontWeight:700,color:C.purple,lineHeight:1,marginBottom:3}}>{value}</div>
      <div style={{fontSize:11,color:C.gray600,fontWeight:500}}>{label}</div>
    </div>
  );
}

function BarChart({ data, keys, colors }: { data: Record<string,number|string>[]; keys: string[]; colors: string[] }) {
  const all = data.flatMap(d => keys.map(k => Number(d[k])||0));
  const raw = Math.max(...all, 1);
  const step = Math.ceil(raw/4/10)*10||10;
  const nMax = step*4;
  const yLabels = [0,step,step*2,step*3,nMax];
  return (
    <div style={{display:"flex",height:160}}>
      <div style={{display:"flex",flexDirection:"column-reverse",justifyContent:"space-between",width:36,paddingBottom:22,flexShrink:0}}>
        {yLabels.map(v=><div key={v} style={{fontSize:10,color:C.gray400,textAlign:"right",paddingRight:6,fontWeight:500}}>{v>=1000?`${(v/1000).toFixed(1)}k`:v}</div>)}
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column"}}>
        <div style={{flex:1,display:"flex",alignItems:"flex-end",gap:8,borderLeft:`1.5px solid ${C.gray200}`,borderBottom:`1.5px solid ${C.gray200}`,padding:"6px 8px 0 8px",position:"relative"}}>
          {[25,50,75].map(p=><div key={p} style={{position:"absolute",left:0,right:0,bottom:`${p}%`,height:1,background:C.gray100}} />)}
          {data.map((d,i)=>(
            <div key={i} style={{flex:1,display:"flex",alignItems:"flex-end",gap:2,height:"100%",position:"relative",zIndex:1}}>
              {keys.map((k,ki)=>{
                const pct=(Number(d[k])/nMax)*100;
                return <div key={k} title={`${k}: ${d[k]}`} style={{flex:1,background:colors[ki],height:`${Math.max(pct,1)}%`,borderRadius:"4px 4px 0 0",cursor:"pointer"}} onMouseEnter={e=>(e.currentTarget.style.opacity="0.75")} onMouseLeave={e=>(e.currentTarget.style.opacity="1")} />;
              })}
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:8,paddingLeft:8,height:22,alignItems:"center"}}>
          {data.map((d,i)=><div key={i} style={{flex:1,textAlign:"center",fontSize:11,color:C.gray400,fontWeight:500}}>{d.month}</div>)}
        </div>
      </div>
    </div>
  );
}

function Modal({ open, onClose, title, sub, children }: { open:boolean; onClose:()=>void; title:string; sub?:string; children:React.ReactNode }) {
  if (!open) return null;
  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose();}} style={{position:"fixed",inset:0,background:"rgba(45,27,107,0.5)",backdropFilter:"blur(4px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:C.white,borderRadius:18,padding:26,width:500,maxWidth:"95vw",maxHeight:"88vh",overflowY:"auto",boxShadow:"0 24px 48px rgba(0,0,0,0.2)"}}>
        <div style={{fontFamily:"Syne,sans-serif",fontSize:17,fontWeight:700,color:C.purple,marginBottom:3}}>{title}</div>
        {sub && <div style={{fontSize:12,color:C.gray400,marginBottom:18}}>{sub}</div>}
        {children}
        <div style={{display:"flex",justifyContent:"flex-end",marginTop:18,paddingTop:14,borderTop:`1px solid ${C.gray100}`}}>
          <Btn onClick={onClose} v="ghost">Close</Btn>
        </div>
      </div>
    </div>
  );
}

const IS: CSSProperties = {width:"100%",padding:"9px 13px",border:`1px solid ${C.gray200}`,borderRadius:9,fontSize:13,fontFamily:"inherit",outline:"none",background:C.white};
function FG({ label, children }: { label:string; children:React.ReactNode }) {
  return <div style={{marginBottom:13}}><label style={{display:"block",fontSize:11,fontWeight:600,color:C.gray600,marginBottom:5,textTransform:"uppercase",letterSpacing:0.5}}>{label}</label>{children}</div>;
}

const TH_S: CSSProperties = {padding:"9px 14px",textAlign:"left",fontSize:10,fontWeight:600,textTransform:"uppercase",color:C.gray400,background:C.gray50,borderBottom:`1px solid ${C.gray100}`,whiteSpace:"nowrap"};
const TD_S: CSSProperties = {padding:"11px 14px",borderBottom:`1px solid ${C.gray100}`,verticalAlign:"middle"};

/* ────────────────────────────────────────────────────────────
   DASHBOARD PAGE
──────────────────────────────────────────────────────────── */
function PageDashboard({ go }: { go:(p:string)=>void }) {
  const pending    = APPROVALS.filter(a=>a.status==="PENDING_REVIEW"||a.status==="ON_HOLD");
  const pendingLed = LEDGER.filter(l=>l.status==="PENDING_REVIEW");
  const openRcl    = RECLAWS.filter(r=>r.status!=="RESOLVED"&&r.status!=="DENIED");
  const pendingAmt = pendingLed.reduce((s,l)=>s+Math.abs(l.amount),0);

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:22}}>
        <div>
          <div style={{fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:700,color:C.purple}}>KLEENUPLink Admin Dashboard</div>
          <div style={{fontSize:13,color:C.gray400,marginTop:3}}>Referral & Attribution Engine — Shadow Ledger Active · SRS v4.0</div>
        </div>
        <div style={{fontSize:12,color:C.gray400,textAlign:"right"}}><div style={{fontWeight:600,color:C.gray800}}>December 2024</div><div>Read-only · No Stripe access</div></div>
      </div>

      <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"#FEF3C7",border:"1px solid #FDE68A",borderRadius:10,marginBottom:20,fontSize:13,color:"#92400E"}}>
        <span>⚠️</span>
        <div><strong>2 Grey-List IP flags</strong> require manual audit before agents can be paid.{" "}
          <button onClick={()=>go("agents")} style={{background:"none",border:"none",color:"inherit",textDecoration:"underline",cursor:"pointer",fontWeight:600}}>Review in Agent Lifecycle →</button>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:14}}>
        <StatCard icon="🔔" value={pending.length} label="Pending Approvals" trend="↑ 2" up />
        <StatCard icon="📋" value={POLICIES.filter(p=>p.status==="ACTIVE").length} label="Active Policies" />
        <StatCard icon="⚠️" value={openRcl.length} label="Open Reclaws" trend="↑ 1" up />
        <StatCard icon="👥" value={127} label="Total Agents" trend="↑ 5" up />
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:22}}>
        <StatCard icon="🔗" value={342} label="Monthly Referrals" trend="↑ 14.8%" up />
        <StatCard icon="💰" value="$18.4K" label="Monthly Payouts" trend="↑ 9.2%" up />
        <StatCard icon="💵" value={`$${pendingAmt.toFixed(0)}`} label="Pending Ledger Review" />
        <StatCard icon="⚡" value="2.4d" label="Avg Resolution Time" trend="↓ 0.6d" up />
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
        {/* Pending Approvals */}
        <Card>
          <CH title="Pending Approvals" sub="Human-in-the-loop queue (SRS §5.7)" action={<Btn sm v="ghost" onClick={()=>go("approvals")}>View all</Btn>} />
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead><tr>{["Agent","Type","Status","Action"].map(h=><th key={h} style={TH_S}>{h}</th>)}</tr></thead>
            <tbody>
              {pending.slice(0,4).map(a=>(
                <tr key={a.id}>
                  <td style={TD_S}><div style={{display:"flex",alignItems:"center",gap:8}}><Av s={a.agentName.split(" ").map(w=>w[0]).join("").slice(0,2)} /><div><div style={{fontWeight:600,color:C.purple,fontSize:12}}>{a.agentName}</div><div style={{fontSize:11,color:C.gray400}}>{a.agentEmail}</div></div></div></td>
                  <td style={TD_S}><span style={{fontSize:11,color:C.gray600}}>{a.type.replace(/_/g," ")}</span></td>
                  <td style={TD_S}><Badge v={a.status} /></td>
                  <td style={TD_S}><Btn sm v="approve" onClick={()=>go("approvals")}>Review</Btn></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Shadow Ledger */}
        <Card>
          <CH title="Shadow Ledger — Pending Review" sub="Computed earnings awaiting checkmark (SRS §5.6)" action={<Btn sm v="ghost" onClick={()=>go("approvals")}>View all</Btn>} />
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead><tr>{["Agent","Type","Amount","Policy"].map(h=><th key={h} style={TH_S}>{h}</th>)}</tr></thead>
            <tbody>
              {pendingLed.map(l=>(
                <tr key={l.id}>
                  <td style={TD_S}><div style={{fontWeight:600,color:C.purple,fontSize:12}}>{l.agentName}</div><div style={{fontSize:11,color:C.gray400}}>{l.address.split(",")[0]}</div></td>
                  <td style={TD_S}><span style={{fontSize:10,background:C.tealLight,color:C.tealDark,padding:"2px 7px",borderRadius:4,fontWeight:600}}>{l.txType.replace(/_/g," ")}</span></td>
                  <td style={TD_S}><span style={{fontWeight:700,color:l.amount<0?C.red:C.purple}}>{l.amount<0?"-":"+"}${Math.abs(l.amount).toFixed(2)}</span></td>
                  <td style={{...TD_S,fontSize:11,color:C.gray400,maxWidth:130,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.policy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        {/* Reclaws */}
        <Card>
          <CH title="Active Reclaws" sub="Credit & clawback mechanism (SRS §5.7)" action={<Btn sm v="ghost" onClick={()=>go("reclaws")}>View all</Btn>} />
          <div style={{padding:"10px 14px"}}>
            {openRcl.slice(0,3).map(r=>(
              <div key={r.id} style={{borderLeft:`4px solid ${r.priority==="CRITICAL"?C.red:r.priority==="HIGH"?C.amber:C.blue}`,borderRadius:10,padding:"12px 13px",marginBottom:8,border:`1px solid ${C.gray200}`,borderLeftWidth:4}}>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <div>
                    <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",color:C.gray400,marginBottom:2}}>{r.type.replace(/_/g," ")}</div>
                    <div style={{fontWeight:600,color:C.purple,fontSize:13}}>{r.agentName}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <span style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:5,background:r.priority==="CRITICAL"?"#FEE2E2":r.priority==="HIGH"?"#FEF3C7":"#DBEAFE",color:r.priority==="CRITICAL"?C.red:r.priority==="HIGH"?C.amber:C.blue}}>{r.priority}</span>
                    <div style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:16,color:C.purple,marginTop:3}}>${Math.abs(r.amount)}</div>
                  </div>
                </div>
                <div style={{fontSize:12,color:C.gray600,margin:"6px 0",lineHeight:1.4}}>{r.desc.slice(0,80)}…</div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <Badge v={r.status} />
                  <Btn sm v="ghost" onClick={()=>go("reclaws")}>Review →</Btn>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Activity */}
        <Card>
          <CH title="Recent Activity" />
          <div style={{padding:"14px 18px"}}>
            {[
              {dot:"✅",title:"Bob's $200 deep clean — dispute window expired",time:"2 hours ago · PROJ-40021 eligible for computation"},
              {dot:"💸",title:"Jane Mitchell — $10.00 Reclaw posted",time:"3 hours ago · Reason: CHARGEBACK_REVERSAL"},
              {dot:"🔔",title:"Kevin O'Brien application submitted",time:"5 hours ago · Sourced: Maryland Realtor Expo CSV"},
              {dot:"🚨",title:"Geo-fencing alert — Aisha Thompson frozen",time:"Yesterday · 90% Vietnamese IPs on MD addresses"},
              {dot:"🤖",title:"Auto-enrollment webhook — user_id 88472 (Bob)",time:"Dec 1 · Consumer policy auto-attached"},
            ].map((item,i)=>(
              <div key={i} style={{display:"flex",gap:12,paddingBottom:16,position:"relative"}}>
                {i<4&&<div style={{position:"absolute",left:13,top:28,bottom:0,width:1,background:C.gray100}} />}
                <div style={{width:28,height:28,borderRadius:"50%",background:C.tealLight,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:12,zIndex:1}}>{item.dot}</div>
                <div><div style={{fontSize:13,fontWeight:600,color:C.purple}}>{item.title}</div><div style={{fontSize:11,color:C.gray400,marginTop:1}}>{item.time}</div></div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   APPROVALS PAGE
──────────────────────────────────────────────────────────── */
function PageApprovals() {
  const [apvs, setApvs] = useState<Approval[]>(APPROVALS);
  const [tab, setTab] = useState<"ALL"|ApvStatus>("ALL");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<{id:string;action:ApvStatus}|null>(null);

  const filtered = apvs.filter(a=>(tab==="ALL"||a.status===tab)&&(!search||a.agentName.toLowerCase().includes(search.toLowerCase())));
  const counts = {ALL:apvs.length,PENDING_REVIEW:apvs.filter(a=>a.status==="PENDING_REVIEW").length,APPROVED:apvs.filter(a=>a.status==="APPROVED").length,REJECTED:apvs.filter(a=>a.status==="REJECTED").length,ON_HOLD:apvs.filter(a=>a.status==="ON_HOLD").length};

  function confirm() {
    if(!modal) return;
    setApvs(p=>p.map(a=>a.id===modal.id?{...a,status:modal.action,reviewer:"Admin"}:a));
    setModal(null);
  }

  return (
    <div>
      <div style={{fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:700,color:C.purple,marginBottom:6}}>Approvals</div>
      <div style={{fontSize:13,color:C.gray400,marginBottom:20}}>Human-in-the-loop — no earnings move to payable without manual checkmark (SRS §5.7)</div>

      <div style={{display:"flex",gap:3,background:C.gray100,borderRadius:9,padding:4,marginBottom:16,width:"fit-content"}}>
        {(["ALL","PENDING_REVIEW","APPROVED","REJECTED","ON_HOLD"] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{padding:"6px 13px",borderRadius:7,fontSize:12,fontWeight:tab===t?700:500,cursor:"pointer",border:"none",background:tab===t?C.white:"transparent",color:tab===t?C.purple:C.gray600,boxShadow:tab===t?"0 1px 4px rgba(0,0,0,0.08)":"none",fontFamily:"inherit"}}>
            {t.replace(/_/g," ")} ({counts[t as keyof typeof counts]})
          </button>
        ))}
      </div>

      <div style={{position:"relative",marginBottom:14,width:220}}>
        <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:C.gray400}}>🔍</span>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search agents..." style={{...IS,paddingLeft:32}} />
      </div>

      <Card>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead><tr>{["Agent","Type","Amount","Submitted","Status","Notes","Actions"].map(h=><th key={h} style={TH_S}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map(a=>(
                <tr key={a.id}>
                  <td style={TD_S}><div style={{display:"flex",alignItems:"center",gap:9}}><Av s={a.agentName.split(" ").map(w=>w[0]).join("").slice(0,2)} /><div><div style={{fontWeight:600,color:C.purple,fontSize:13}}>{a.agentName}</div><div style={{fontSize:11,color:C.gray400}}>{a.agentEmail}</div></div></div></td>
                  <td style={TD_S}><span style={{fontSize:11,background:C.gray100,padding:"2px 8px",borderRadius:5,fontWeight:500}}>{a.type.replace(/_/g," ")}</span></td>
                  <td style={TD_S}><span style={{fontWeight:600,color:C.purple}}>{a.amount?`$${a.amount.toLocaleString()}`:"—"}</span></td>
                  <td style={{...TD_S,fontSize:12,color:C.gray600}}>{a.submitted}</td>
                  <td style={TD_S}><Badge v={a.status} /></td>
                  <td style={{...TD_S,fontSize:12,color:C.gray600,maxWidth:180}}>{a.notes?`${a.notes.slice(0,55)}…`:"—"}</td>
                  <td style={TD_S}>
                    <div style={{display:"flex",gap:5}}>
                      {(a.status==="PENDING_REVIEW"||a.status==="ON_HOLD")?(
                        <>
                          <Btn sm v="approve" onClick={()=>setModal({id:a.id,action:"APPROVED"})}>✓ Approve</Btn>
                          <Btn sm v="reject" onClick={()=>setModal({id:a.id,action:"REJECTED"})}>✕ Reject</Btn>
                          <Btn sm v="ghost" onClick={()=>setModal({id:a.id,action:"ON_HOLD"})}>Hold</Btn>
                        </>
                      ):<span style={{fontSize:12,color:C.gray400}}>By {a.reviewer??"—"}</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={!!modal} onClose={()=>setModal(null)} title={modal?.action==="APPROVED"?"✓ Approve":modal?.action==="REJECTED"?"✕ Reject":"⏸ On Hold"} sub="Updates the shadow ledger. Approved amounts become visible to the agent.">
        <FG label="Admin Note (optional)"><textarea placeholder="Reason for audit trail..." style={{...IS,resize:"vertical",minHeight:80}} /></FG>
        <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
          <Btn v="ghost" onClick={()=>setModal(null)}>Cancel</Btn>
          <Btn v={modal?.action==="APPROVED"?"approve":"reject"} onClick={confirm}>Confirm</Btn>
        </div>
      </Modal>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   POLICIES PAGE
──────────────────────────────────────────────────────────── */
function PagePolicies() {
  const [policies, setPolicies] = useState<Policy[]>(POLICIES);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const filtered = policies.filter(p=>!search||p.name.toLowerCase().includes(search.toLowerCase()));

  function toggle(id:string) { setPolicies(p=>p.map(pol=>pol.id===id?{...pol,status:pol.status==="ACTIVE"?"INACTIVE":"ACTIVE" as PolicyStatus}:pol)); }

  const catC: Record<string,{bg:string;text:string}> = {
    CLEANING:{bg:C.tealLight,text:C.tealDark},
    LANDSCAPING:{bg:"#DCFCE7",text:"#16A34A"},
    HANDYMAN:{bg:"#FEF3C7",text:"#D97706"},
    ALL:{bg:C.purpleLight,text:C.purple},
  };

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:22}}>
        <div>
          <div style={{fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:700,color:C.purple}}>Policy Operations</div>
          <div style={{fontSize:13,color:C.gray400,marginTop:3}}>Rules Engine — temporal decay, fixed fees, spiffs, multi-service (SRS §4). Hardcoded rates forbidden.</div>
        </div>
        <Btn onClick={()=>setShowModal(true)}>+ New Policy</Btn>
      </div>

      <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:C.purpleLight,border:"1px solid #c4b5fd",borderRadius:10,marginBottom:20,fontSize:13,color:C.purple}}>
        ℹ️ <div>All % commissions calculated against <strong>Gross 10% KLEENUP Fee</strong> before Stripe. e.g. $200 job → $20 fee → 50% = <strong>$10.00 payout</strong> (SRS §4.4)</div>
      </div>

      <div style={{position:"relative",marginBottom:16,width:240}}>
        <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:C.gray400}}>🔍</span>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search policies..." style={{...IS,paddingLeft:32}} />
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        {filtered.map(p=>{
          const cc=catC[p.cat]??catC.ALL;
          return (
            <div key={p.id} style={{background:C.white,borderRadius:14,border:`1px solid ${C.gray200}`,padding:18}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <span style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:1,color:cc.text,background:cc.bg,padding:"2px 8px",borderRadius:4}}>{p.cat}</span>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <Badge v={p.status} />
                  <div onClick={()=>toggle(p.id)} style={{width:38,height:20,borderRadius:20,background:p.status==="ACTIVE"?C.teal:C.gray200,position:"relative",cursor:"pointer",transition:"background 0.2s",flexShrink:0}}>
                    <div style={{width:16,height:16,borderRadius:"50%",background:C.white,position:"absolute",top:2,left:p.status==="ACTIVE"?20:2,transition:"left 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}} />
                  </div>
                </div>
              </div>
              <div style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:15,color:C.purple,marginBottom:5}}>{p.name}</div>
              <div style={{fontSize:12,color:C.gray400,lineHeight:1.5,marginBottom:12}}>{p.desc}</div>
              <div style={{background:C.gray50,borderRadius:9,padding:"10px 12px",marginBottom:10}}>
                <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:1,color:C.gray400,marginBottom:6}}>Decay Tiers (SRS §4.1)</div>
                {p.tiers.map(t=>(
                  <div key={t.seq} style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                    <span style={{fontSize:12,color:C.gray600}}>Tier {t.seq} · {t.months}mo</span>
                    <span style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:14,color:C.tealDark}}>{t.metric==="PERCENT_REV"?`${(t.value*100).toFixed(0)}% of Gross`:`$${t.value.toFixed(2)} flat`}</span>
                  </div>
                ))}
              </div>
              {p.spiff&&<div style={{background:"#FEF3C7",borderRadius:7,padding:"6px 10px",marginBottom:10,fontSize:12,color:"#92400E"}}>🎯 Spiff: ${p.spiffAmt} after {p.spiffN} referrals</div>}
              <div style={{fontSize:11,color:C.gray400}}>v{p.ver} · Since {p.created}</div>
            </div>
          );
        })}
      </div>

      <Modal open={showModal} onClose={()=>setShowModal(false)} title="Create New Policy" sub="Rules Engine — all rates dynamically evaluated, never hardcoded (SRS §4)">
        <FG label="Policy Name"><input style={IS} placeholder="e.g. Realtor VIP Policy" /></FG>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <FG label="Service Category"><select style={IS}><option>CLEANING</option><option>LANDSCAPING</option><option>HANDYMAN</option><option>ALL</option></select></FG>
          <FG label="Status"><select style={IS}><option>DRAFT</option><option>ACTIVE</option></select></FG>
        </div>
        <FG label="Description"><textarea style={{...IS,resize:"vertical",minHeight:70}} placeholder="Describe this policy..." /></FG>
        <div style={{background:C.gray50,borderRadius:9,padding:14,marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:1,color:C.gray400,marginBottom:10}}>Tier 1 (Temporal Decay — SRS §4.1)</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <FG label="Metric Type"><select style={IS}><option value="PERCENT_REV">% of Gross Revenue</option><option value="FIXED_USD">Fixed $ Amount</option></select></FG>
            <FG label="Value (0.50 = 50%)"><input style={IS} type="number" step="0.01" placeholder="0.50" /></FG>
          </div>
          <FG label="Duration (months)"><input style={IS} type="number" placeholder="6" /></FG>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
          <Btn v="ghost" onClick={()=>setShowModal(false)}>Cancel</Btn>
          <Btn onClick={()=>setShowModal(false)}>Create Policy</Btn>
        </div>
      </Modal>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   RECLAWS PAGE
──────────────────────────────────────────────────────────── */
function PageReclaws() {
  const [reclaws, setReclaws] = useState<Reclaw[]>(RECLAWS);
  const [sf, setSf] = useState(""); const [pf, setPf] = useState(""); const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({name:"",email:"",type:"COMMISSION_DISPUTE",amount:"",priority:"MEDIUM",desc:"",code:"MANUAL_CORRECTION",team:""});

  const filtered = reclaws.filter(r=>(!sf||r.status===sf)&&(!pf||r.priority===pf)&&(!search||r.agentName.toLowerCase().includes(search.toLowerCase())));

  function resolve(id:string) { setReclaws(p=>p.map(r=>r.id===id?{...r,status:"RESOLVED" as ReclawStatus,resolution:"Resolved by Admin"}:r)); }
  function deny(id:string)    { setReclaws(p=>p.map(r=>r.id===id?{...r,status:"DENIED" as ReclawStatus}:r)); }

  function submit() {
    setReclaws(p=>[{id:`rcl-${Date.now()}`,agentId:"manual",agentName:form.name,agentEmail:form.email,type:form.type as Reclaw["type"],amount:parseFloat(form.amount)||0,desc:form.desc,reasonCode:form.code,submitted:new Date().toISOString().split("T")[0],status:"OPEN",priority:form.priority as Priority,assignedTo:form.team||undefined},...p]);
    setShowModal(false);
  }

  const borderC = (p:Priority)=>({CRITICAL:C.red,HIGH:C.amber,MEDIUM:C.blue,LOW:C.gray400}[p]);
  const priBg   = (p:Priority)=>({CRITICAL:"#FEE2E2",HIGH:"#FEF3C7",MEDIUM:"#DBEAFE",LOW:C.gray100}[p]);
  const priTxt  = (p:Priority)=>({CRITICAL:C.red,HIGH:C.amber,MEDIUM:C.blue,LOW:C.gray600}[p]);

  const openN  = reclaws.filter(r=>r.status==="OPEN").length;
  const invN   = reclaws.filter(r=>r.status==="INVESTIGATING").length;
  const resN   = reclaws.filter(r=>r.status==="RESOLVED").length;
  const stake  = reclaws.filter(r=>r.status!=="RESOLVED"&&r.status!=="DENIED").reduce((s,r)=>s+Math.abs(r.amount),0);

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:22}}>
        <div>
          <div style={{fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:700,color:C.purple}}>Reclaws</div>
          <div style={{fontSize:13,color:C.gray400,marginTop:3}}>Manual credit/clawback — every entry requires Admin ID + Reason Code (SRS §5.7)</div>
        </div>
        <Btn onClick={()=>setShowModal(true)}>+ File Reclaw</Btn>
      </div>

      <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        {[{icon:"🔴",label:"Open",value:openN},{icon:"🟡",label:"Investigating",value:invN},{icon:"✅",label:"Resolved",value:resN},{icon:"💰",label:"Total at Stake",value:`$${stake.toFixed(2)}`}].map(m=>(
          <div key={m.label} style={{display:"flex",alignItems:"center",gap:10,background:C.white,border:`1px solid ${C.gray200}`,borderRadius:10,padding:"10px 14px"}}>
            <span style={{fontSize:18}}>{m.icon}</span>
            <div><div style={{fontSize:10,color:C.gray400,fontWeight:500}}>{m.label}</div><div style={{fontWeight:700,fontSize:15,color:C.purple}}>{m.value}</div></div>
          </div>
        ))}
      </div>

      <div style={{display:"flex",gap:10,marginBottom:14}}>
        <div style={{position:"relative"}}><span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:C.gray400}}>🔍</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search reclaws..." style={{...IS,width:200,paddingLeft:32}} /></div>
        <select value={sf} onChange={e=>setSf(e.target.value)} style={{...IS,width:"auto"}}><option value="">All Status</option><option>OPEN</option><option>INVESTIGATING</option><option>RESOLVED</option><option>DENIED</option></select>
        <select value={pf} onChange={e=>setPf(e.target.value)} style={{...IS,width:"auto"}}><option value="">All Priority</option><option>CRITICAL</option><option>HIGH</option><option>MEDIUM</option><option>LOW</option></select>
      </div>

      {filtered.map(r=>(
        <div key={r.id} style={{borderLeft:`4px solid ${borderC(r.priority)}`,borderRadius:12,padding:"14px 16px",marginBottom:10,background:C.white,border:`1px solid ${C.gray200}`,borderLeftWidth:4}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
            <div>
              <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",color:C.gray400,marginBottom:3}}>{r.type.replace(/_/g," ")}</div>
              <div style={{display:"flex",alignItems:"center",gap:8}}><Av s={r.agentName.split(" ").map(w=>w[0]).join("").slice(0,2)} /><div><div style={{fontWeight:600,color:C.purple,fontSize:13}}>{r.agentName}</div><div style={{fontSize:11,color:C.gray400}}>{r.agentEmail}</div></div></div>
            </div>
            <div style={{textAlign:"right"}}>
              <span style={{fontSize:11,fontWeight:700,padding:"2px 7px",borderRadius:5,background:priBg(r.priority),color:priTxt(r.priority)}}>{r.priority}</span>
              <div style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:20,color:r.amount<0?C.red:C.purple,marginTop:4}}>{r.amount<0?"-":"+"}${Math.abs(r.amount).toFixed(2)}</div>
            </div>
          </div>
          <div style={{fontSize:12,color:C.gray600,lineHeight:1.5,margin:"8px 0"}}>{r.desc}</div>
          <div style={{background:C.gray50,borderRadius:7,padding:"6px 10px",marginBottom:8,display:"flex",gap:12,alignItems:"center"}}>
            <span style={{fontSize:10,fontWeight:700,color:C.gray400,textTransform:"uppercase"}}>Reason Code</span>
            <span style={{fontSize:11,fontWeight:600,color:C.purple,fontFamily:"monospace"}}>{r.reasonCode}</span>
            {r.assignedTo&&<span style={{fontSize:11,color:C.gray400}}>· {r.assignedTo}</span>}
          </div>
          {r.resolution&&<div style={{background:C.tealLight,borderRadius:7,padding:"8px 10px",marginBottom:8,fontSize:12,color:C.tealDark}}><strong>Resolution:</strong> {r.resolution}</div>}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{display:"flex",gap:8,alignItems:"center"}}><Badge v={r.status} /><span style={{fontSize:11,color:C.gray400}}>Filed: {r.submitted}</span></div>
            {r.status!=="RESOLVED"&&r.status!=="DENIED"&&<div style={{display:"flex",gap:6}}><Btn sm v="approve" onClick={()=>resolve(r.id)}>Mark Resolved</Btn><Btn sm v="reject" onClick={()=>deny(r.id)}>Deny</Btn></div>}
          </div>
        </div>
      ))}

      <Modal open={showModal} onClose={()=>setShowModal(false)} title="File a Reclaw" sub="Every reclaw requires a Reason Code — permanently logged in audit trail (SRS §5.7)">
        <FG label="Agent Name"><input style={IS} value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Full name" /></FG>
        <FG label="Agent Email"><input style={IS} type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} placeholder="agent@email.com" /></FG>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <FG label="Type"><select style={IS} value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))}><option value="COMMISSION_DISPUTE">Commission Dispute</option><option value="PAYMENT_ERROR">Payment Error</option><option value="FRAUD_REPORT">Fraud Report</option><option value="CHARGEBACK_REVERSAL">Chargeback Reversal</option></select></FG>
          <FG label="Amount (negative = clawback)"><input style={IS} type="number" step="0.01" value={form.amount} onChange={e=>setForm(p=>({...p,amount:e.target.value}))} placeholder="-10.00" /></FG>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <FG label="Priority"><select style={IS} value={form.priority} onChange={e=>setForm(p=>({...p,priority:e.target.value}))}><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option></select></FG>
          <FG label="Reason Code (required)"><select style={IS} value={form.code} onChange={e=>setForm(p=>({...p,code:e.target.value}))}><option>CHARGEBACK_REVERSAL</option><option>GEO_FRAUD_DETECTED</option><option>MISSING_COMMISSION_CREDIT</option><option>DUPLICATE_LEDGER_ENTRY</option><option>POLICY_VIOLATION</option><option>MANUAL_CORRECTION</option></select></FG>
        </div>
        <FG label="Description"><textarea style={{...IS,resize:"vertical",minHeight:80}} value={form.desc} onChange={e=>setForm(p=>({...p,desc:e.target.value}))} placeholder="Detail including Project IDs, addresses..." /></FG>
        <FG label="Assign To"><select style={IS} value={form.team} onChange={e=>setForm(p=>({...p,team:e.target.value}))}><option value="">Unassigned</option><option>Support Team</option><option>Finance Team</option><option>Compliance Team</option></select></FG>
        <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
          <Btn v="ghost" onClick={()=>setShowModal(false)}>Cancel</Btn>
          <Btn onClick={submit}>File Reclaw</Btn>
        </div>
      </Modal>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   AGENTS PAGE
──────────────────────────────────────────────────────────── */
function PageAgents() {
  const [agents, setAgents] = useState<Agent[]>(AGENTS);
  const [sf, setSf] = useState(""); const [search, setSearch] = useState("");
  const [promoteModal, setPromoteModal] = useState<Agent|null>(null);
  const [bulkModal, setBulkModal] = useState(false);
  const [selPol, setSelPol] = useState("");

  const filtered = agents.filter(a=>(!sf||a.status===sf)&&(!search||a.name.toLowerCase().includes(search.toLowerCase())||a.id.toLowerCase().includes(search.toLowerCase())));
  const counts = {PROSPECT:agents.filter(a=>a.status==="PROSPECT").length,PROMOTED:agents.filter(a=>a.status==="PROMOTED").length,ACTIVE:agents.filter(a=>a.status==="ACTIVE").length,SUSPENDED:agents.filter(a=>a.status==="SUSPENDED").length};

  const promote  = (id:string) => { setAgents(p=>p.map(a=>a.id===id?{...a,status:"PROMOTED" as AgentStatus,policyId:selPol||a.policyId}:a)); setPromoteModal(null); };
  const activate = (id:string) => setAgents(p=>p.map(a=>a.id===id?{...a,status:"ACTIVE" as AgentStatus}:a));
  const suspend  = (id:string) => setAgents(p=>p.map(a=>a.id===id?{...a,status:"SUSPENDED" as AgentStatus}:a));

  const srcL: Record<string,string> = {BULK_UPLOAD:"📁 CSV Upload",WEB_SIGNUP:"🌐 Web Sign-Up",APP_AUTO_ENROLL:"📱 App Auto-Enroll",TIER2_RECRUITMENT:"🔗 Tier-2 Recruit"};
  const tierBg: Record<string,string> = {BRONZE:"#FEF3C7",GOLD:"#FEF3C7",SILVER:C.gray100,PLATINUM:C.tealLight};
  const tierTx: Record<string,string> = {BRONZE:"#92400E",GOLD:"#B45309",SILVER:C.gray600,PLATINUM:C.tealDark};

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:22}}>
        <div>
          <div style={{fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:700,color:C.purple}}>Agent Lifecycle</div>
          <div style={{fontSize:13,color:C.gray400,marginTop:3}}>State Machine: PROSPECT → PROMOTED → ACTIVE → SUSPENDED (SRS §5)</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <Btn v="ghost" onClick={()=>setBulkModal(true)}>📁 Bulk CSV Upload</Btn>
          <Btn>+ Add Prospect</Btn>
        </div>
      </div>

      {/* State machine */}
      <div style={{background:C.white,borderRadius:14,border:`1px solid ${C.gray200}`,padding:"14px 20px",marginBottom:20,display:"flex",alignItems:"center",gap:0,overflowX:"auto"}}>
        {(["PROSPECT","PROMOTED","ACTIVE","SUSPENDED"] as AgentStatus[]).map((st,i)=>(
          <div key={st} style={{display:"flex",alignItems:"center"}}>
            <div style={{padding:"8px 16px",borderRadius:8,textAlign:"center",background:st==="ACTIVE"?C.tealLight:st==="SUSPENDED"?"#FEE2E2":st==="PROMOTED"?C.purpleLight:C.gray100,border:`2px solid ${st==="ACTIVE"?C.teal:st==="SUSPENDED"?C.red:st==="PROMOTED"?C.purple:C.gray200}`,minWidth:110}}>
              <div style={{fontSize:11,fontWeight:700,color:st==="ACTIVE"?C.tealDark:st==="SUSPENDED"?C.red:st==="PROMOTED"?C.purple:C.gray600}}>{st}</div>
              <div style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:22,color:C.purple,marginTop:2}}>{counts[st]}</div>
            </div>
            {i<3&&<div style={{fontSize:18,color:C.gray400,margin:"0 6px"}}>→</div>}
          </div>
        ))}
      </div>

      <div style={{display:"flex",gap:10,marginBottom:14}}>
        <div style={{position:"relative"}}><span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:C.gray400}}>🔍</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search agents, IDs..." style={{...IS,width:220,paddingLeft:32}} /></div>
        <select value={sf} onChange={e=>setSf(e.target.value)} style={{...IS,width:"auto"}}><option value="">All Status</option><option>PROSPECT</option><option>PROMOTED</option><option>ACTIVE</option><option>SUSPENDED</option></select>
      </div>

      <Card>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead><tr>{["Agent","Agent ID","Status","Tier","Policy","Source","Net Payable","Parent","Flags","Actions"].map(h=><th key={h} style={TH_S}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map(a=>{
                const pol = POLICIES.find(p=>p.id===a.policyId);
                return (
                  <tr key={a.id}>
                    <td style={TD_S}><div style={{display:"flex",alignItems:"center",gap:9}}><Av s={a.initials} /><div><div style={{fontWeight:600,color:C.purple,fontSize:13}}>{a.name}</div><div style={{fontSize:11,color:C.gray400}}>{a.email}</div></div></div></td>
                    <td style={TD_S}><span style={{fontFamily:"monospace",fontSize:11,background:a.idType==="PARTNER_KEY"?C.purpleLight:C.tealLight,color:a.idType==="PARTNER_KEY"?C.purple:C.tealDark,padding:"2px 8px",borderRadius:5,fontWeight:600}}>{a.id}</span></td>
                    <td style={TD_S}><Badge v={a.status} /></td>
                    <td style={TD_S}><span style={{padding:"2px 7px",borderRadius:5,fontSize:11,fontWeight:700,textTransform:"uppercase",background:tierBg[a.tier],color:tierTx[a.tier]}}>{a.tier}</span></td>
                    <td style={{...TD_S,fontSize:12,color:C.gray600,maxWidth:130,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{pol?.name??"—"}</td>
                    <td style={{...TD_S,fontSize:11,color:C.gray600}}>{srcL[a.source]}</td>
                    <td style={{...TD_S,fontWeight:700,color:a.payable>0?C.purple:C.gray400}}>${a.payable.toFixed(2)}</td>
                    <td style={{...TD_S,fontSize:11,color:C.gray600,fontFamily:"monospace"}}>{a.parentId??"—"}</td>
                    <td style={TD_S}>
                      <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                        {a.geoFlag&&<span style={{fontSize:10,background:"#FEE2E2",color:C.red,padding:"1px 5px",borderRadius:4,fontWeight:700}}>🌐 GEO</span>}
                        {!a.w9&&a.status!=="PROSPECT"&&<span style={{fontSize:10,background:"#FEF3C7",color:C.amber,padding:"1px 5px",borderRadius:4,fontWeight:700}}>W-9</span>}
                        {!a.terms&&a.status!=="PROSPECT"&&<span style={{fontSize:10,background:"#DBEAFE",color:C.blue,padding:"1px 5px",borderRadius:4,fontWeight:700}}>T&C</span>}
                      </div>
                    </td>
                    <td style={TD_S}>
                      <div style={{display:"flex",gap:5}}>
                        {a.status==="PROSPECT"&&<Btn sm v="purple" onClick={()=>{setPromoteModal(a);setSelPol("");}}>Promote</Btn>}
                        {a.status==="PROMOTED"&&<Btn sm v="approve" onClick={()=>activate(a.id)}>Activate</Btn>}
                        {a.status==="ACTIVE"&&<Btn sm v="reject" onClick={()=>suspend(a.id)}>Suspend</Btn>}
                        {a.status==="SUSPENDED"&&<Btn sm v="approve" onClick={()=>activate(a.id)}>Reinstate</Btn>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={!!promoteModal} onClose={()=>setPromoteModal(null)} title={`Promote: ${promoteModal?.name}`} sub="Attach Incentive Policy → PROMOTED → AWS SES invite email dispatched (SRS §5.2–5.3)">
        {promoteModal&&(
          <>
            <div style={{background:C.gray50,borderRadius:9,padding:12,marginBottom:14,display:"flex",gap:16,fontSize:13}}>
              <div><div style={{color:C.gray400,fontSize:11}}>Agent ID</div><strong style={{fontFamily:"monospace"}}>{promoteModal.id}</strong></div>
              <div><div style={{color:C.gray400,fontSize:11}}>Source</div><strong>{srcL[promoteModal.source]}</strong></div>
              <div><div style={{color:C.gray400,fontSize:11}}>Location</div><strong>{promoteModal.location??"—"}</strong></div>
            </div>
            <FG label="Attach Incentive Policy (required)">
              <select style={IS} value={selPol} onChange={e=>setSelPol(e.target.value)}>
                <option value="">Select a policy...</option>
                {POLICIES.filter(p=>p.status==="ACTIVE").map(p=><option key={p.id} value={p.id}>{p.name} ({p.cat})</option>)}
              </select>
            </FG>
            {selPol&&(()=>{const pol=POLICIES.find(p=>p.id===selPol);return pol?<div style={{background:C.tealLight,borderRadius:9,padding:12,marginBottom:14,fontSize:12,color:C.tealDark}}><strong>{pol.name}</strong> — {pol.tiers.map(t=>`Tier ${t.seq}: ${t.metric==="PERCENT_REV"?`${(t.value*100).toFixed(0)}%`:`$${t.value}`} for ${t.months}mo`).join(", ")}</div>:null;})()}
            <FG label="Vetting Notes"><textarea style={{...IS,resize:"vertical",minHeight:70}} placeholder="e.g. Verified realty license #MD-12345..." /></FG>
            <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
              <Btn v="ghost" onClick={()=>setPromoteModal(null)}>Cancel</Btn>
              <Btn onClick={()=>promote(promoteModal.id)}>Promote & Send Invite Email</Btn>
            </div>
          </>
        )}
      </Modal>

      <Modal open={bulkModal} onClose={()=>setBulkModal(false)} title="📁 Bulk CSV Upload" sub="Import prospects from trade shows and expos (SRS §5.1)">
        <div style={{border:`2px dashed ${C.gray200}`,borderRadius:12,padding:32,textAlign:"center",marginBottom:16,cursor:"pointer"}}>
          <div style={{fontSize:32,marginBottom:8}}>📄</div>
          <div style={{fontWeight:600,color:C.purple,marginBottom:4}}>Drop CSV file here or click to upload</div>
          <div style={{fontSize:12,color:C.gray400}}>Columns: name, email, phone, location, sourced_from</div>
        </div>
        <div style={{background:C.gray50,borderRadius:9,padding:12,fontSize:12,color:C.gray600}}>
          <strong style={{display:"block",marginBottom:6}}>Example CSV format:</strong>
          <code style={{fontFamily:"monospace",fontSize:11}}>name,email,phone,location,sourced_from<br />Jane Mitchell,jane@realty.com,301-555-0101,Bethesda MD,Maryland Realtor Expo</code>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:14}}>
          <Btn v="ghost" onClick={()=>setBulkModal(false)}>Cancel</Btn>
          <Btn onClick={()=>setBulkModal(false)}>Import Prospects</Btn>
        </div>
      </Modal>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   ANALYTICS PAGE
──────────────────────────────────────────────────────────── */
function PageAnalytics() {
  const approved  = LEDGER.filter(l=>l.status==="APPROVED"&&l.txType==="EARNING").reduce((s,l)=>s+l.amount,0);
  const rclwTotal = LEDGER.filter(l=>l.txType==="RECLAW").reduce((s,l)=>s+Math.abs(l.amount),0);
  const t2Total   = LEDGER.filter(l=>l.txType==="TIER2_OVERRIDE").reduce((s,l)=>s+l.amount,0);
  const pendTotal = LEDGER.filter(l=>l.status==="PENDING_REVIEW").reduce((s,l)=>s+Math.abs(l.amount),0);

  const tc  = {PLATINUM:AGENTS.filter(a=>a.tier==="PLATINUM").length,GOLD:AGENTS.filter(a=>a.tier==="GOLD").length,SILVER:AGENTS.filter(a=>a.tier==="SILVER").length,BRONZE:AGENTS.filter(a=>a.tier==="BRONZE").length};
  const tot = Object.values(tc).reduce((a,b)=>a+b,0)||1;
  const sorted = [...AGENTS].sort((a,b)=>b.referrals-a.referrals).slice(0,5);
  const tierBg: Record<string,string> = {BRONZE:"#FEF3C7",GOLD:"#FEF3C7",SILVER:C.gray100,PLATINUM:C.tealLight};
  const tierTx: Record<string,string> = {BRONZE:"#92400E",GOLD:"#B45309",SILVER:C.gray600,PLATINUM:C.tealDark};

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:22}}>
        <div>
          <div style={{fontFamily:"Syne,sans-serif",fontSize:22,fontWeight:700,color:C.purple}}>Analytics</div>
          <div style={{fontSize:13,color:C.gray400,marginTop:3}}>KLEENUPLink performance — Shadow Ledger overview</div>
        </div>
        <Btn v="ghost">↓ Export Report</Btn>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:22}}>
        <StatCard icon="📈" value={342} label="Monthly Referrals" trend="↑ 14.8%" up />
        <StatCard icon="💵" value="$18.4K" label="Monthly Payouts" trend="↑ 9.2%" up />
        <StatCard icon="🎯" value="78%" label="Approval Rate" trend="↑ 3%" up />
        <StatCard icon="👥" value={127} label="Total Agents" trend="↑ 5" up />
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
        <Card>
          <CH title="Referral & Payout Trends" sub="Last 6 months" />
          <div style={{padding:"16px 20px 12px"}}>
            <BarChart data={MONTHLY} keys={["referrals","payouts"]} colors={[C.tealMid,C.teal]} />
            <div style={{display:"flex",gap:16,marginTop:10}}>
              {[{color:C.tealMid,label:"Referrals"},{color:C.teal,label:"Payouts (÷100)"}].map(l=>(
                <div key={l.label} style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:C.gray600}}>
                  <div style={{width:10,height:10,borderRadius:3,background:l.color}} />{l.label}
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <CH title="Shadow Ledger Summary" sub="Gross Revenue Math (SRS §4.4)" />
          <div style={{padding:20}}>
            {[{label:"Approved Earnings",value:`$${approved.toFixed(2)}`,color:C.green},{label:"Tier-2 Overrides",value:`$${t2Total.toFixed(2)}`,color:C.blue},{label:"Reclaw Reversals",value:`-$${rclwTotal.toFixed(2)}`,color:C.red},{label:"Pending Review",value:`$${pendTotal.toFixed(2)}`,color:C.amber}].map(row=>(
              <div key={row.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${C.gray100}`}}>
                <span style={{fontSize:13,color:C.gray600}}>{row.label}</span>
                <span style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:16,color:row.color}}>{row.value}</span>
              </div>
            ))}
            <div style={{marginTop:12,padding:"10px 14px",background:C.purpleLight,borderRadius:9,fontSize:12,color:C.purple}}>
              <strong>SRS §4.4:</strong> Job × 10% → KLEENUP Fee → Rate% = Payout. e.g. $200 → $20 → 50% = <strong>$10.00</strong>
            </div>
          </div>
        </Card>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
        <Card>
          <CH title="Tier Distribution" />
          <div style={{padding:20}}>
            {[{label:"🏆 Platinum",count:tc.PLATINUM,color:C.teal},{label:"⭐ Gold",count:tc.GOLD,color:C.amber},{label:"🥈 Silver",count:tc.SILVER,color:C.gray400},{label:"🥉 Bronze",count:tc.BRONZE,color:"#D97706"}].map(row=>(
              <div key={row.label} style={{display:"flex",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${C.gray100}`}}>
                <div style={{fontSize:13,fontWeight:600,minWidth:90}}>{row.label}</div>
                <div style={{flex:1,height:6,background:C.gray100,borderRadius:10,overflow:"hidden",margin:"0 14px"}}>
                  <div style={{height:"100%",background:row.color,borderRadius:10,width:`${(row.count/tot)*100}%`}} />
                </div>
                <div style={{fontSize:12,fontWeight:700,color:C.purple,minWidth:20}}>{row.count}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CH title="Agent Growth" sub="Active agents over time" />
          <div style={{padding:"16px 20px 12px"}}>
            <BarChart data={MONTHLY.map((m,i)=>({...m,agents:98+i*5+(i===4?-1:0)}))} keys={["agents"]} colors={[C.purple]} />
          </div>
        </Card>
      </div>

      <Card>
        <CH title="Top Performing Agents" sub="By total referrals" />
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead><tr>{["Rank","Agent","ID Type","Tier","Referrals","Net Payable","Status"].map(h=><th key={h} style={TH_S}>{h}</th>)}</tr></thead>
            <tbody>
              {sorted.map((a,i)=>(
                <tr key={a.id}>
                  <td style={TD_S}><span style={{fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:15,color:i===0?C.tealDark:C.gray400}}>#{i+1}</span></td>
                  <td style={TD_S}><div style={{display:"flex",alignItems:"center",gap:9}}><Av s={a.initials} /><div><div style={{fontWeight:600,color:C.purple,fontSize:13}}>{a.name}</div><div style={{fontSize:11,color:C.gray400}}>{a.location}</div></div></div></td>
                  <td style={TD_S}><span style={{fontSize:10,background:a.idType==="PARTNER_KEY"?C.purpleLight:C.tealLight,color:a.idType==="PARTNER_KEY"?C.purple:C.tealDark,padding:"2px 7px",borderRadius:4,fontWeight:700}}>{a.idType==="PARTNER_KEY"?"X- Partner":"Production"}</span></td>
                  <td style={TD_S}><span style={{padding:"2px 7px",borderRadius:5,fontSize:11,fontWeight:700,textTransform:"uppercase",background:tierBg[a.tier],color:tierTx[a.tier]}}>{a.tier}</span></td>
                  <td style={{...TD_S,fontWeight:700}}>{a.referrals}</td>
                  <td style={{...TD_S,fontWeight:700,color:a.payable>0?C.purple:C.gray400}}>${a.payable.toFixed(2)}</td>
                  <td style={TD_S}><Badge v={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
   SHELL
──────────────────────────────────────────────────────────── */
const NAV_GROUPS = [
  {section:"Overview",    items:[{id:"dashboard",label:"Dashboard",icon:"⊞"}]},
  {section:"Operations",  items:[{id:"approvals",label:"Approvals",icon:"✓",badge:3},{id:"policies",label:"Policy Operations",icon:"📋"},{id:"reclaws",label:"Reclaws",icon:"⚠",badgeAmber:true,badge:3}]},
  {section:"Agents",      items:[{id:"agents",label:"Agent Lifecycle",icon:"👥"},{id:"analytics",label:"Analytics",icon:"📊"}]},
];

export default function AdminDashboard() {
  const [page, setPage] = useState("dashboard");
  const label = NAV_GROUPS.flatMap(g=>g.items).find(i=>i.id===page)?.label??"Dashboard";

  const renderPage = () => {
    if (page==="approvals") return <PageApprovals />;
    if (page==="policies")  return <PagePolicies />;
    if (page==="reclaws")   return <PageReclaws />;
    if (page==="agents")    return <PageAgents />;
    if (page==="analytics") return <PageAnalytics />;
    return <PageDashboard go={setPage} />;
  };

  return (
    <div style={{display:"flex",minHeight:"100vh",fontFamily:"'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      {/* SIDEBAR */}
      <aside style={{width:260,background:C.purple,minHeight:"100vh",position:"fixed",left:0,top:0,display:"flex",flexDirection:"column",zIndex:100}}>
        <div style={{padding:"22px 20px 18px",borderBottom:"1px solid rgba(255,255,255,0.08)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:36,height:36,background:C.teal,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Syne,sans-serif",fontWeight:800,color:C.white,fontSize:13,flexShrink:0}}>KL</div>
            <div>
              <div style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:17,color:C.white,letterSpacing:1}}>KLE<span style={{color:C.teal}}>●</span>NUP</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",letterSpacing:"1.5px",textTransform:"uppercase"}}>Admin Portal</div>
            </div>
          </div>
        </div>

        <nav style={{padding:"14px 10px",flex:1,overflowY:"auto"}}>
          {NAV_GROUPS.map(group=>(
            <div key={group.section}>
              <div style={{fontSize:10,fontWeight:600,letterSpacing:"1.5px",textTransform:"uppercase",color:"rgba(255,255,255,0.3)",padding:"10px 10px 4px"}}>{group.section}</div>
              {group.items.map(item=>(
                <button key={item.id} onClick={()=>setPage(item.id)}
                  style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:9,color:page===item.id?C.white:"rgba(255,255,255,0.6)",cursor:"pointer",transition:"all 0.2s",fontSize:"13.5px",fontWeight:500,marginBottom:2,width:"100%",border:"none",background:page===item.id?C.teal:"transparent",fontFamily:"inherit",textAlign:"left"}}>
                  <span style={{fontSize:15,width:18,textAlign:"center",flexShrink:0}}>{item.icon}</span>
                  <span style={{flex:1}}>{item.label}</span>
                  {item.badge&&<span style={{marginLeft:"auto",background:item.badgeAmber?C.amber:C.red,color:item.badgeAmber?"#1a1a1a":C.white,fontSize:10,fontWeight:700,padding:"1px 6px",borderRadius:20,minWidth:18,textAlign:"center"}}>{item.badge}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div style={{padding:14,borderTop:"1px solid rgba(255,255,255,0.08)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px"}}>
            <div style={{width:34,height:34,background:C.teal,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,color:C.white,fontSize:12,flexShrink:0}}>AD</div>
            <div><div style={{fontSize:12,fontWeight:600,color:C.white}}>Admin User</div><div style={{fontSize:10,color:"rgba(255,255,255,0.4)"}}>Super Administrator</div></div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{marginLeft:260,flex:1,display:"flex",flexDirection:"column"}}>
        <header style={{height:64,background:C.white,borderBottom:`1px solid ${C.gray200}`,display:"flex",alignItems:"center",padding:"0 26px",gap:16,position:"sticky",top:0,zIndex:50}}>
          <div style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:18,color:C.purple,flex:1}}>{label}</div>
          <div style={{display:"flex",alignItems:"center",background:C.gray100,borderRadius:9,padding:"0 12px",gap:8,height:36,width:280,border:`1px solid ${C.gray200}`}}>
            <svg width="14" height="14" fill="none" stroke={C.gray400} strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input type="text" placeholder="Search agents, approvals, addresses..." style={{border:"none",background:"none",fontSize:13,color:C.gray800,outline:"none",width:"100%",fontFamily:"inherit"}} />
          </div>
          <div style={{width:36,height:36,borderRadius:9,border:`1px solid ${C.gray200}`,background:C.white,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:C.gray600,position:"relative"}}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            <span style={{position:"absolute",top:6,right:6,width:7,height:7,background:C.red,borderRadius:"50%",border:`2px solid ${C.white}`}} />
          </div>
        </header>

        <main style={{padding:26,flex:1}}>{renderPage()}</main>
      </div>
    </div>
  );
}
