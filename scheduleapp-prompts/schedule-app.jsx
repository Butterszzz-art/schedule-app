import { useState, useEffect, useCallback } from "react";

const toMins  = h => Math.round(h * 60);
const toHr    = m => m / 60;
const fmtTime = h => { const t=Math.round(h*60),hh=Math.floor(t/60)%24,mm=t%60; return `${String(hh).padStart(2,"0")}:${String(mm).padStart(2,"0")}`; };
const fmtDur  = m => { if(m<60)return `${m}m`; const h=Math.floor(m/60),r=m%60; return r?`${h}h ${r}m`:`${h}h`; };
const nowHr   = () => { const d=new Date(); return d.getHours()+d.getMinutes()/60+d.getSeconds()/3600; };
const isoWeek = (d=new Date()) => { const t=new Date(d); t.setHours(0,0,0,0); t.setDate(t.getDate()+3-(t.getDay()+6)%7); const w=new Date(t.getFullYear(),0,4); return 1+Math.round(((t-w)/86400000-3+(w.getDay()+6)%7)/7); };
const weekKey = (d=new Date()) => `${d.getFullYear()}-W${String(isoWeek(d)).padStart(2,"0")}`;
const todayStr= () => new Date().toISOString().split("T")[0];
const DAY_JS  = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const DAY_KEYS= ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const todayKey= () => DAY_JS[new Date().getDay()];

// ── Prep mode detection ───────────────────────────────────────────────────────
const PREP_START = new Date("2026-08-16T00:00:00");
const PREP_END   = new Date("2026-11-02T23:59:59");
const getMode    = (d=new Date()) => d >= PREP_START && d <= PREP_END ? "prep" : "normal";
const isPrep     = () => getMode() === "prep";

// ── Show dates ────────────────────────────────────────────────────────────────
const SHOW1 = new Date("2026-10-17");
const SHOW2 = new Date("2026-10-30");
const daysUntil = date => Math.max(0, Math.ceil((date - new Date()) / 86400000));

// ── Colours ───────────────────────────────────────────────────────────────────
const KIND = {
  sleep:   {bg:"#141414",acc:"#3A3A3A",label:"Sleep"},
  meal:    {bg:"#1C1408",acc:"#C8962A",label:"Meal"},
  gym:     {bg:"#081A10",acc:"#4ADE80",label:"Gym"},
  ma:      {bg:"#1A0A08",acc:"#F87171",label:"Martial Arts"},
  cardio:  {bg:"#141414",acc:"#94A3B8",label:"Cardio"},
  mobility:{bg:"#1A0814",acc:"#F472B6",label:"Mobility"},
  posing:  {bg:"#1A1000",acc:"#E09000",label:"Posing"},
  study:   {bg:"#08101A",acc:"#60A5FA",label:"Study"},
  uni:     {bg:"#0E0820",acc:"#A78BFA",label:"University"},
  commute: {bg:"#121210",acc:"#7A7A6A",label:"Commute"},
  prep:    {bg:"#1A0E00",acc:"#FB923C",label:"Meal Prep"},
  chores:  {bg:"#1A0808",acc:"#FCA5A5",label:"Chores"},
  read:    {bg:"#081408",acc:"#86EFAC",label:"Reading"},
  free:    {bg:"#0E0E0E",acc:"#C8F060",label:"Free"},
};

const HABIT_CATS = [
  {key:"gym",     label:"Gym",        icon:"💪",kinds:["gym"],     prepOnly:false},
  {key:"posing",  label:"Posing",     icon:"🕴",kinds:["posing"],  prepOnly:true},
  {key:"cardio",  label:"Cardio",     icon:"🏃",kinds:["cardio"],  prepOnly:false},
  {key:"mobility",label:"Mobility",   icon:"🧘",kinds:["mobility"],prepOnly:false},
  {key:"study",   label:"Study",      icon:"📚",kinds:["study"],   prepOnly:false},
  {key:"nutrition",label:"Nutrition", icon:"🍱",kinds:["meal","prep"],prepOnly:false},
  {key:"reading", label:"Reading",    icon:"📖",kinds:["read"],    prepOnly:false},
  {key:"chores",  label:"Chores",     icon:"🧹",kinds:["chores"],  prepOnly:false},
];

// ── Shared non-uni blocks ─────────────────────────────────────────────────────
const mkGymDay = (pfx, gymLabel, extras=[]) => [
  {id:`${pfx}-sleep`, kind:"sleep",   label:"Sleep",        start:0,    dur:330,fixed:true},
  {id:`${pfx}-pos`,   kind:"posing",  label:"Posing",       start:5.5,  dur:25},
  {id:`${pfx}-m1`,    kind:"meal",    label:"M1",           start:5.92, dur:20},
  {id:`${pfx}-gym`,   kind:"gym",     label:gymLabel,       start:6,    dur:90},
  {id:`${pfx}-mob`,   kind:"mobility",label:"Mobility",     start:7.5,  dur:20},
  {id:`${pfx}-c1`,    kind:"commute", label:"→ Home",       start:7.83, dur:20},
  {id:`${pfx}-m2`,    kind:"meal",    label:"M2",           start:8.17, dur:30},
  {id:`${pfx}-st1`,   kind:"study",   label:"Study · 2h",   start:8.67, dur:120},
  {id:`${pfx}-brk`,   kind:"meal",    label:"break",        start:10.67,dur:20},
  {id:`${pfx}-st2`,   kind:"study",   label:"Study · 1.5h", start:11,   dur:90},
  {id:`${pfx}-m3`,    kind:"meal",    label:"M3",           start:12.5, dur:30},
  ...extras,
  {id:`${pfx}-m5`,    kind:"meal",    label:"M5",           start:19.5, dur:40},
  {id:`${pfx}-rd`,    kind:"read",    label:"Reading",      start:21,   dur:30},
  {id:`${pfx}-bed`,   kind:"sleep",   label:"Sleep",        start:21.75,dur:480,fixed:true},
];

// ── PREP MODE schedule ────────────────────────────────────────────────────────
const PREP = {
  Mon: mkGymDay("pm","Upper body",[
    {id:"pm-c2",   kind:"commute",label:"→ SP",     start:12.5, dur:25},
    {id:"pm-m4",   kind:"meal",   label:"M4",       start:15.5, dur:30},
    {id:"pm-crd",  kind:"cardio", label:"Cardio",   start:17.5, dur:30},
    {id:"pm-c3",   kind:"commute",label:"→ Home",   start:18,   dur:20},
  ]),
  Tue: mkGymDay("pt","Lower body",[
    {id:"pt-c2",   kind:"commute",label:"→ SP",     start:12.5, dur:25},
    {id:"pt-m4",   kind:"meal",   label:"M4",       start:15.5, dur:30},
    {id:"pt-c3",   kind:"commute",label:"→ Home",   start:17,   dur:20},
    // NO cardio — lower day
  ]),
  Wed:[
    {id:"pw-sleep",kind:"sleep",   label:"Sleep",         start:0,    dur:330,fixed:true},
    {id:"pw-pos",  kind:"posing",  label:"Posing",        start:5.5,  dur:25},
    {id:"pw-m1",   kind:"meal",    label:"M1",            start:5.92, dur:20},
    {id:"pw-crd",  kind:"cardio",  label:"Cardio",        start:6.5,  dur:30},
    {id:"pw-m2",   kind:"meal",    label:"M2",            start:7.0,  dur:25},
    {id:"pw-st1",  kind:"study",   label:"Study · 2h",    start:7.5,  dur:120},
    {id:"pw-brk1", kind:"meal",    label:"break",         start:9.5,  dur:20},
    {id:"pw-st2",  kind:"study",   label:"Study · 1.5h",  start:9.83, dur:90},
    {id:"pw-brk2", kind:"meal",    label:"break",         start:11.33,dur:20},
    {id:"pw-st3",  kind:"study",   label:"Study · 1h",    start:11.67,dur:60},
    {id:"pw-m3",   kind:"meal",    label:"M3",            start:12.67,dur:30},
    {id:"pw-m4",   kind:"meal",    label:"M4",            start:15.5, dur:30},
    {id:"pw-chr",  kind:"chores",  label:"Chores",        start:16,   dur:60},
    {id:"pw-prp",  kind:"prep",    label:"Mini Prep",     start:17,   dur:60},
    {id:"pw-m5",   kind:"meal",    label:"M5",            start:19.5, dur:40},
    {id:"pw-rd",   kind:"read",    label:"Reading",       start:21,   dur:30},
    {id:"pw-bed",  kind:"sleep",   label:"Sleep",         start:21.75,dur:480,fixed:true},
  ],
  Thu: mkGymDay("ph","Upper body",[
    {id:"ph-crd",  kind:"cardio", label:"Cardio",   start:13,   dur:30},
    {id:"ph-c2",   kind:"commute",label:"→ SP",     start:13.5, dur:20},
    {id:"ph-m4",   kind:"meal",   label:"M4",       start:15.5, dur:30},
    {id:"ph-c3",   kind:"commute",label:"→ Home",   start:17,   dur:20},
  ]),
  Fri: mkGymDay("pf","Lower body",[
    {id:"pf-c2",   kind:"commute",label:"→ SP",     start:12.5, dur:25},
    {id:"pf-m4",   kind:"meal",   label:"M4",       start:15.5, dur:30},
    {id:"pf-c3",   kind:"commute",label:"→ Home",   start:17,   dur:20},
    // NO cardio — lower day
  ]),
  Sat:[
    {id:"ps-sleep",kind:"sleep",   label:"Sleep",         start:0,    dur:330,fixed:true},
    {id:"ps-pos",  kind:"posing",  label:"Posing",        start:5.5,  dur:25},
    {id:"ps-m1",   kind:"meal",    label:"M1",            start:5.92, dur:20},
    {id:"ps-gym",  kind:"gym",     label:"Upper body",    start:6.5,  dur:90},
    {id:"ps-mob",  kind:"mobility",label:"Mobility",      start:8,    dur:20},
    {id:"ps-c1",   kind:"commute", label:"→ Home",        start:8.33, dur:20},
    {id:"ps-m2",   kind:"meal",    label:"M2",            start:8.67, dur:30},
    {id:"ps-st1",  kind:"study",   label:"Study · 2h",    start:9.17, dur:120},
    {id:"ps-brk",  kind:"meal",    label:"break",         start:11.17,dur:20},
    {id:"ps-st2",  kind:"study",   label:"Study · 1.5h",  start:11.5, dur:90},
    {id:"ps-m3",   kind:"meal",    label:"M3",            start:13,   dur:30},
    {id:"ps-crd",  kind:"cardio",  label:"Cardio",        start:13.5, dur:30},
    {id:"ps-free", kind:"free",    label:"Leisure",       start:14,   dur:150},
    {id:"ps-m4",   kind:"meal",    label:"M4",            start:16.5, dur:30},
    {id:"ps-m5",   kind:"meal",    label:"M5",            start:19.5, dur:40},
    {id:"ps-rd",   kind:"read",    label:"Reading",       start:21,   dur:30},
    {id:"ps-bed",  kind:"sleep",   label:"Sleep",         start:21.75,dur:480,fixed:true},
  ],
  Sun:[
    {id:"psu-sleep",kind:"sleep",  label:"Sleep",         start:0,    dur:330,fixed:true},
    {id:"psu-pos",  kind:"posing", label:"Posing",        start:5.5,  dur:25},
    {id:"psu-m1",   kind:"meal",   label:"M1",            start:5.92, dur:20},
    {id:"psu-crd",  kind:"cardio", label:"Cardio",        start:6.5,  dur:30},
    {id:"psu-m2",   kind:"meal",   label:"M2",            start:7.0,  dur:25},
    {id:"psu-chr",  kind:"chores", label:"Laundry+Clean", start:7.5,  dur:60},
    {id:"psu-st1",  kind:"study",  label:"Study · 2h",    start:8.5,  dur:120},
    {id:"psu-brk1", kind:"meal",   label:"break",         start:10.5, dur:20},
    {id:"psu-st2",  kind:"study",  label:"Study · 1.5h",  start:10.83,dur:90},
    {id:"psu-m3",   kind:"meal",   label:"M3",            start:12.33,dur:30},
    {id:"psu-prp",  kind:"prep",   label:"Meal Prep (main)",start:12.83,dur:180},
    {id:"psu-st3",  kind:"study",  label:"Study · 1h",    start:15.83,dur:60},
    {id:"psu-m4",   kind:"meal",   label:"M4",            start:19.5, dur:40},
    {id:"psu-rd",   kind:"read",   label:"Reading",       start:21,   dur:30},
    {id:"psu-bed",  kind:"sleep",  label:"Sleep",         start:21.75,dur:480,fixed:true},
  ],
};

// Sem1 uni blocks for prep mode
const P1_UNI = {
  Mon:[{id:"p1m-c2",kind:"commute",label:"→ SP",start:12.5,dur:25},{id:"p1m-u1",kind:"uni",label:"Wetensch.",start:13,dur:105,fixed:true},{id:"p1m-u2",kind:"uni",label:"Tutorial",start:15,dur:105,fixed:true},{id:"p1m-c3",kind:"commute",label:"→ Home",start:17,dur:20}],
  Tue:[{id:"p1t-c2",kind:"commute",label:"→ SP",start:12.5,dur:25},{id:"p1t-u1",kind:"uni",label:"Van Percep.",start:13,dur:105,fixed:true},{id:"p1t-u2",kind:"uni",label:"Lin. Algebra",start:15,dur:105,fixed:true},{id:"p1t-c3",kind:"commute",label:"→ Home",start:17,dur:20}],
  Wed:[{id:"p1w-u1",kind:"uni",label:"Practical (mand.)",start:9,dur:225,fixed:true},{id:"p1w-u2",kind:"uni",label:"Wetensch.",start:13,dur:105,fixed:true},{id:"p1w-c2",kind:"commute",label:"→ Home",start:15,dur:25}],
  Thu:[{id:"p1h-u1",kind:"uni",label:"Tutorial (mand.)",start:9,dur:105,fixed:true},{id:"p1h-u2",kind:"uni",label:"Test/Exam",start:13,dur:90},{id:"p1h-st3",kind:"study",label:"Lin.Alg PS",start:16,dur:90}],
  Fri:[{id:"p1f-c2",kind:"commute",label:"→ SP",start:12.5,dur:25},{id:"p1f-u1",kind:"uni",label:"Seminar",start:13,dur:105,fixed:true},{id:"p1f-u2",kind:"uni",label:"Lecture",start:15,dur:105,fixed:true},{id:"p1f-c3",kind:"commute",label:"→ Home",start:17,dur:20}],
  Sat:[],Sun:[],
};

// Sem2 uni blocks for prep mode
const P2_UNI = {
  Mon:[{id:"p2m-c2",kind:"commute",label:"→ SP",start:10.67,dur:20},{id:"p2m-u0",kind:"uni",label:"Seminar (mand.)",start:11,dur:105,fixed:true},{id:"p2m-u1",kind:"uni",label:"Computer lab",start:13,dur:105,fixed:true},{id:"p2m-u2",kind:"uni",label:"Leren&Geh.",start:15,dur:105,fixed:true},{id:"p2m-u3",kind:"uni",label:"Experimentatie",start:17,dur:105,fixed:true},{id:"p2m-c3",kind:"commute",label:"→ Home",start:18.75,dur:20}],
  Tue:[{id:"p2t-c2",kind:"commute",label:"→ SP",start:12.5,dur:25},{id:"p2t-u1",kind:"uni",label:"Exp.",start:13,dur:105,fixed:true},{id:"p2t-u2",kind:"uni",label:"Lin. Algebra",start:15,dur:105,fixed:true},{id:"p2t-u3",kind:"uni",label:"Exp. (eve)",start:17,dur:105,fixed:true},{id:"p2t-c3",kind:"commute",label:"→ Home",start:18.75,dur:20}],
  Wed:[{id:"p2w-u1",kind:"uni",label:"Computer lab",start:13,dur:105,fixed:true},{id:"p2w-c2",kind:"commute",label:"→ Home",start:15,dur:25}],
  Thu:[{id:"p2h-c2",kind:"commute",label:"→ SP",start:13,dur:20},{id:"p2h-u1",kind:"uni",label:"Leren&Geh.",start:13.33,dur:105,fixed:true},{id:"p2h-c3",kind:"commute",label:"→ Home",start:15,dur:20},{id:"p2h-st3",kind:"study",label:"Lin.Alg PS",start:16,dur:90}],
  Fri:[{id:"p2f-u0",kind:"uni",label:"Exp. 9:00 (mand.)",start:9,dur:60,fixed:true},{id:"p2f-c2",kind:"commute",label:"→ SP",start:12.5,dur:25},{id:"p2f-u1",kind:"uni",label:"Lin.Alg+L&G",start:13,dur:105,fixed:true},{id:"p2f-u2",kind:"uni",label:"Seminar",start:15,dur:105,fixed:true},{id:"p2f-c3",kind:"commute",label:"→ Home",start:17,dur:20}],
  Sat:[],Sun:[],
};

// Merge base + uni blocks
const mergeUni = (base, uni) => {
  const merged = {};
  ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].forEach(d => {
    merged[d] = [...(base[d]||[]), ...(uni[d]||[])].sort((a,b)=>a.start-b.start);
  });
  return merged;
};

const SCHEDULE = {
  prep:   { 1: mergeUni(PREP, P1_UNI), 2: mergeUni(PREP, P2_UNI) },
  normal: { 1: mergeUni(PREP, P1_UNI), 2: mergeUni(PREP, P2_UNI) }, // simplified: same for now
};

const cascade = (blocks,idx,newEndMins) => {
  const r=blocks.map(b=>({...b})); let cur=newEndMins;
  for(let i=idx+1;i<r.length;i++){
    if(r[i].fixed)break;
    const os=toMins(r[i].start);
    if(os>=cur)break;
    r[i].start=toHr(cur); cur+=r[i].dur;
  }
  return r;
};

const ST={
  async get(k){try{const r=await window.storage.get(k);return r?JSON.parse(r.value):null;}catch{return null;}},
  async set(k,v){try{await window.storage.set(k,JSON.stringify(v));}catch{}},
};

const calcStreaks=(allLogs,mode,sem)=>{
  const res={};
  Object.keys(allLogs).sort().forEach(date=>{
    const dn=DAY_JS[new Date(date+"T12:00:00").getDay()];
    const dayBlocks=(SCHEDULE[mode]?.[sem]?.[dn])||[];
    const dl=allLogs[date]||{};
    HABIT_CATS.forEach(cat=>{
      if(cat.prepOnly && mode!=="prep") return;
      if(!res[cat.key])res[cat.key]={streak:0,best:0,total:0};
      const rel=dayBlocks.filter(b=>cat.kinds.includes(b.kind)&&b.kind!=="sleep");
      if(rel.length===0) return; // no expectation — skip
      const done=rel.some(b=>dl[b.id]==="done");
      if(done){res[cat.key].streak++;res[cat.key].total++;res[cat.key].best=Math.max(res[cat.key].best,res[cat.key].streak);}
      else res[cat.key].streak=0;
    });
  });
  return res;
};

// ── Components ────────────────────────────────────────────────────────────────
function BlockCard({block,status,isCurrent,isNext,onToggle,onDelay,disabled}){
  const {bg,acc}=KIND[block.kind]||KIND.free;
  const done=status==="done",skip=status==="skipped";
  return(
    <div style={{background:done?"#0E0E0E":bg,border:`1px solid ${isCurrent?acc:done?"#1A1A1A":"#181818"}`,borderRadius:10,padding:"10px 12px",marginBottom:6,opacity:skip?0.35:disabled?0.2:1,transition:"all 0.2s",position:"relative",boxShadow:isCurrent?`0 0 0 1px ${acc}18`:"none"}}>
      {isCurrent&&<div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${acc},transparent)`,borderRadius:"10px 10px 0 0"}}/>}
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        {isCurrent&&<span style={{display:"inline-block",width:7,height:7,borderRadius:"50%",background:acc,flexShrink:0,animation:"pulse 1.5s ease-in-out infinite"}}/>}
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:1}}>
            <span style={{fontSize:10,fontWeight:700,color:acc,textTransform:"uppercase",letterSpacing:"0.07em"}}>{KIND[block.kind]?.label}</span>
            {isNext&&<span style={{fontSize:9,color:"#444",background:"#181818",padding:"1px 5px",borderRadius:3}}>NEXT</span>}
            {disabled&&<span style={{fontSize:9,color:"#333",background:"#181818",padding:"1px 5px",borderRadius:3}}>OFF</span>}
          </div>
          <div style={{fontSize:13,fontWeight:600,color:done||skip?"#444":"#F0EDE8",textDecoration:done||skip?"line-through":"none"}}>{block.label}</div>
          <div style={{fontSize:11,color:"#4A4A4A",marginTop:1}}>{fmtTime(block.start)} – {fmtTime(block.start+block.dur/60)} · {fmtDur(block.dur)}</div>
        </div>
        <div style={{display:"flex",gap:5,flexShrink:0}}>
          {isCurrent&&!done&&!skip&&<button onClick={()=>onDelay(block)} style={{background:"#181818",border:"1px solid #252525",color:"#555",borderRadius:7,padding:"5px 8px",fontSize:11,cursor:"pointer"}}>+15m</button>}
          {!disabled&&<button onClick={()=>onToggle(block.id)} style={{background:done?"#0A1A0A":skip?"#1A0A0A":"#181818",border:`1px solid ${done?"#4ADE80":skip?"#F87171":"#252525"}`,color:done?"#4ADE80":skip?"#F87171":"#444",borderRadius:7,padding:"5px 8px",fontSize:13,cursor:"pointer",minWidth:32}}>{done?"✓":skip?"✕":"○"}</button>}
        </div>
      </div>
    </div>
  );
}

function HeroCard({block,secsLeft,onDelay}){
  if(!block)return<div style={{background:"#111",borderRadius:14,padding:20,marginBottom:14,textAlign:"center",color:"#444",fontSize:13}}>All done today 🎯</div>;
  const {acc}=KIND[block.kind]||KIND.free;
  const isNow=secsLeft<=0,mins=Math.floor(secsLeft/60),secs=secsLeft%60;
  return(
    <div style={{background:"#080808",border:`1px solid ${acc}33`,borderRadius:14,padding:"18px 16px",marginBottom:14,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-30,right:-30,width:110,height:110,background:`radial-gradient(circle,${acc}10,transparent 70%)`,pointerEvents:"none"}}/>
      <div style={{fontSize:10,color:"#444",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:4}}>{isNow?"🟢 NOW":"COMING UP"}</div>
      <div style={{fontSize:21,fontWeight:700,color:"#F0EDE8",marginBottom:2}}>{block.label}</div>
      <div style={{fontSize:12,color:"#555",marginBottom:isNow?0:10}}>{fmtTime(block.start)} – {fmtTime(block.start+block.dur/60)} · {fmtDur(block.dur)}</div>
      {!isNow&&<div style={{display:"flex",alignItems:"baseline",gap:4,marginBottom:12}}>
        <span style={{fontSize:36,fontWeight:700,color:acc,fontVariantNumeric:"tabular-nums"}}>{String(mins).padStart(2,"0")}:{String(secs).padStart(2,"0")}</span>
        <span style={{fontSize:12,color:"#555"}}>until start</span>
      </div>}
      <button onClick={()=>onDelay(block)} style={{background:"#181818",border:"1px solid #252525",color:"#666",borderRadius:9,padding:"8px 14px",fontSize:12,cursor:"pointer",marginTop:isNow?12:0}}>Running late — push +15m</button>
    </div>
  );
}

function PrepBanner(){
  if(!isPrep())return null;
  const d1=daysUntil(SHOW1),d2=daysUntil(SHOW2);
  const target=d1>0?`Show 1 in ${d1}d`:`Show 2 in ${d2}d`;
  return(
    <div style={{background:"#1A1000",border:"1px solid #E0900033",borderRadius:10,padding:"8px 12px",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <span style={{fontSize:11,color:"#E09000",fontWeight:700}}>🏆 PREP MODE — MA suspended · Posing daily</span>
      <span style={{fontSize:11,color:"#E09000"}}>{target}</span>
    </div>
  );
}

function NutritionPill({dayKey}){
  const upper=["Mon","Thu","Sat"].includes(dayKey);
  const lower=["Tue","Fri"].includes(dayKey);
  const kcal=upper?2500:lower?2200:1700;
  const carbs=upper?335:lower?251:104;
  const fat=upper?55:lower?60:70;
  const label=upper?"HEAVY LIFT":lower?"MODERATE LIFT":"TRUE REST";
  const labelColor=upper?"#4ADE80":lower?"#60A5FA":"#94A3B8";
  return(
    <div style={{background:"#111",borderRadius:10,padding:"8px 12px",marginBottom:12,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
      <span style={{fontSize:10,fontWeight:700,color:labelColor,letterSpacing:"0.08em"}}>{label}</span>
      <span style={{fontSize:11,color:"#888"}}>{kcal} kcal</span>
      <span style={{fontSize:11,color:"#4ADE80",fontWeight:600}}>P 164g</span>
      <span style={{fontSize:11,color:"#60A5FA"}}>C {carbs}g</span>
      <span style={{fontSize:11,color:"#FB923C"}}>F {fat}g</span>
    </div>
  );
}

function TodayView({blocks,todayLog,disabled,onToggle,onDelay,now,today}){
  const vis=blocks.filter(b=>b.kind!=="sleep");
  const curIdx=vis.findIndex(b=>{const s=toMins(b.start),e=s+b.dur,n=toMins(now);return n>=s&&n<e;});
  const cur=curIdx>=0?vis[curIdx]:null;
  const nxt=vis.find(b=>toMins(b.start)>toMins(now))||null;
  const hero=cur||nxt;
  const secsLeft=hero&&!cur?Math.max(0,Math.round((toMins(hero.start)-toMins(now))*60)):0;
  const active=vis.filter(b=>!disabled[b.id]);
  const done=active.filter(b=>todayLog[b.id]==="done").length;
  const pct=active.length?Math.round(done/active.length*100):0;
  return(
    <div>
      <PrepBanner/>
      <HeroCard block={hero} secsLeft={secsLeft} onDelay={onDelay}/>
      <NutritionPill dayKey={today}/>
      <div style={{background:"#111",borderRadius:10,padding:"8px 12px",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <span style={{fontSize:12,color:"#555"}}>Today's progress</span>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:80,height:3,background:"#1E1E1E",borderRadius:2,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${pct}%`,background:"#C8F060",borderRadius:2,transition:"width 0.3s"}}/>
          </div>
          <span style={{fontSize:12,fontWeight:700,color:pct===100?"#C8F060":"#777"}}>{done}/{active.length}</span>
        </div>
      </div>
      {vis.map(b=><BlockCard key={b.id} block={b} status={todayLog[b.id]} isCurrent={cur?.id===b.id} isNext={!cur&&nxt?.id===b.id} onToggle={onToggle} onDelay={onDelay} disabled={!!disabled[b.id]}/>)}
    </div>
  );
}

function WeekView({sem,weekDis,onToggle,mode}){
  const [exp,setExp]=useState(null);
  const BADGE={Mon:"UPPER 💪",Tue:"LOWER 💪",Wed:mode==="prep"?"REST · Posing+Cardio":"REST · MA 🥋",Thu:"UPPER 💪",Fri:"LOWER 💪",Sat:"UPPER 💪",Sun:mode==="prep"?"REST · Posing+Cardio":"REST · MA 🥋"};
  return(
    <div>
      <div style={{background:"#1A1000",border:"1px solid #E0900033",borderRadius:10,padding:"10px 12px",marginBottom:14}}>
        <div style={{fontSize:11,fontWeight:700,color:"#E09000",marginBottom:2}}>{mode==="prep"?"🏆 PREP MODE ACTIVE":"📅 Normal schedule"}</div>
        <div style={{fontSize:11,color:"#666"}}>{mode==="prep"?"Posing daily 05:30 · MA suspended · Cardio: Mon/Thu/Sat/Wed/Sun":"Martial arts: Wed & Sun · Cardio: Mon/Thu/Sat"}</div>
      </div>
      {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(day=>{
        const blocks=(SCHEDULE[mode]?.[sem]?.[day])||[];
        const vis=blocks.filter(b=>b.kind!=="sleep");
        const offCount=vis.filter(b=>(weekDis[day]||{})[b.id]).length;
        const open=exp===day;
        const isRest=day==="Wed"||day==="Sun";
        return(
          <div key={day} style={{background:"#111",border:"1px solid #1A1A1A",borderRadius:12,marginBottom:8,overflow:"hidden"}}>
            <button onClick={()=>setExp(open?null:day)} style={{width:"100%",background:"none",border:"none",padding:"12px 14px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:14,fontWeight:700,color:"#F0EDE8"}}>{day}</span>
                  <span style={{fontSize:10,color:isRest?"#F87171":"#4ADE80",background:isRest?"#1A0808":"#081A10",padding:"2px 6px",borderRadius:4}}>{BADGE[day]}</span>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                {offCount>0&&<span style={{fontSize:11,color:"#555",background:"#1A1A1A",padding:"2px 8px",borderRadius:10}}>{offCount} off</span>}
                <span style={{color:"#333",fontSize:11}}>{open?"▲":"▼"}</span>
              </div>
            </button>
            {open&&(
              <div style={{padding:"0 14px 12px",borderTop:"1px solid #181818"}}>
                {vis.map(b=>{
                  const off=(weekDis[day]||{})[b.id]||false;
                  const {acc}=KIND[b.kind]||KIND.free;
                  return(
                    <button key={b.id} onClick={()=>!b.fixed&&onToggle(day,b.id)} style={{display:"flex",alignItems:"center",gap:10,width:"100%",background:"none",border:"none",padding:"6px 0",cursor:b.fixed?"default":"pointer",borderBottom:"1px solid #141414",opacity:off?0.35:1}}>
                      <div style={{width:7,height:7,borderRadius:"50%",background:off?"#2A2A2A":acc,flexShrink:0}}/>
                      <span style={{fontSize:12,color:off?"#444":"#888",flex:1,textAlign:"left",textDecoration:off?"line-through":"none"}}>{b.label}</span>
                      <span style={{fontSize:11,color:"#3A3A3A"}}>{fmtTime(b.start)}</span>
                      {b.fixed&&<span style={{fontSize:9,color:"#2A2A2A",background:"#181818",padding:"1px 5px",borderRadius:3}}>FIXED</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function HabitsView({allLogs,sem,mode}){
  const streaks=calcStreaks(allLogs,mode,sem);
  const last7=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-6+i);return d.toISOString().split("T")[0];});
  const visibleCats=HABIT_CATS.filter(c=>!c.prepOnly||mode==="prep");
  const weeklyDone=Object.values(streaks).reduce((a,s)=>a+s.total,0);
  return(
    <div>
      {mode==="prep"&&<div style={{background:"#1A1000",border:"1px solid #E0900033",borderRadius:10,padding:"8px 12px",marginBottom:14,fontSize:11,color:"#E09000"}}>🏆 Posing streak counts toward show readiness — protect it.</div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:20}}>
        {visibleCats.map(cat=>{
          const s=streaks[cat.key]||{streak:0,total:0};
          const glow=s.streak>=30?"#C8F060":s.streak>=7?"#4ADE80":s.streak>=3?"#4ADE8044":null;
          return(
            <div key={cat.key} style={{background:"#111",border:`1px solid ${glow||"#1A1A1A"}`,borderRadius:12,padding:"12px 14px",boxShadow:glow?`0 0 8px ${glow}22`:"none"}}>
              <div style={{fontSize:18,marginBottom:4}}>{cat.icon}</div>
              <div style={{fontSize:11,fontWeight:700,color:"#888",marginBottom:2}}>{cat.label}</div>
              <div style={{display:"flex",alignItems:"baseline",gap:3}}>
                <span style={{fontSize:26,fontWeight:700,color:s.streak>=7?"#C8F060":s.streak>=3?"#4ADE80":s.streak>0?"#888":"#2A2A2A"}}>{s.streak}</span>
                <span style={{fontSize:10,color:"#444"}}>day streak</span>
              </div>
              <div style={{fontSize:10,color:"#333",marginTop:1}}>{s.total} total</div>
            </div>
          );
        })}
      </div>
      <div style={{fontSize:11,fontWeight:700,color:"#444",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:12}}>Last 7 days</div>
      {visibleCats.map(cat=>(
        <div key={cat.key} style={{marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
            <span style={{fontSize:13}}>{cat.icon}</span>
            <span style={{fontSize:12,fontWeight:600,color:"#666"}}>{cat.label}</span>
          </div>
          <div style={{display:"flex",gap:4}}>
            {last7.map(date=>{
              const dn=DAY_JS[new Date(date+"T12:00:00").getDay()];
              const dayBlocks=(SCHEDULE[mode]?.[sem]?.[dn])||[];
              const rel=dayBlocks.filter(b=>cat.kinds.includes(b.kind)&&b.kind!=="sleep");
              const dl=allLogs[date]||{};
              const done=rel.filter(b=>dl[b.id]==="done").length;
              const pct=rel.length?done/rel.length:null;
              const isToday=date===todayStr();
              return(
                <div key={date} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                  <div style={{width:"100%",height:32,borderRadius:5,border:isToday?"1px solid #333":"1px solid transparent",background:pct===null?"#141414":pct===1?"#C8F060":pct>0.5?"#4ADE8066":pct>0?"#4ADE8022":"#181818",transition:"background 0.2s"}}/>
                  <span style={{fontSize:9,color:isToday?"#666":"#333"}}>{dn.slice(0,1)}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function LogView({allLogs,sem,mode}){
  const dates=Object.keys(allLogs).sort().reverse().slice(0,21);
  if(!dates.length)return<div style={{color:"#444",fontSize:13,textAlign:"center",marginTop:40,lineHeight:1.8}}>No logs yet.<br/>Mark blocks complete in Today view.</div>;
  return(
    <div>
      {dates.map(date=>{
        const dn=DAY_JS[new Date(date+"T12:00:00").getDay()];
        const blocks=(SCHEDULE[mode]?.[sem]?.[dn])||[];
        const ns=blocks.filter(b=>b.kind!=="sleep");
        const dl=allLogs[date]||{};
        const done=ns.filter(b=>dl[b.id]==="done").length;
        const skip=ns.filter(b=>dl[b.id]==="skipped").length;
        const pct=ns.length?Math.round(done/ns.length*100):0;
        return(
          <div key={date} style={{marginBottom:20}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
              <span style={{fontSize:13,fontWeight:700,color:"#F0EDE8"}}>{dn} <span style={{color:"#444",fontWeight:400,fontSize:11}}>{date}</span></span>
              <span style={{fontSize:13,fontWeight:700,color:pct>=80?"#C8F060":pct>=50?"#4ADE80":"#555"}}>{pct}%</span>
            </div>
            <div style={{height:2,background:"#181818",borderRadius:2,overflow:"hidden",marginBottom:8}}>
              <div style={{height:"100%",width:`${pct}%`,background:pct>=80?"#C8F060":"#4ADE80",borderRadius:2}}/>
            </div>
            {ns.map(b=>{
              const s=dl[b.id];if(!s)return null;
              const {acc}=KIND[b.kind]||KIND.free;
              return(
                <div key={b.id} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:"1px solid #131313"}}>
                  <span style={{fontSize:12,color:s==="done"?"#4ADE80":"#F87171",width:14,flexShrink:0}}>{s==="done"?"✓":"✕"}</span>
                  <span style={{fontSize:10,color:acc,width:40,flexShrink:0}}>{fmtTime(b.start)}</span>
                  <span style={{fontSize:12,color:s==="done"?"#777":"#444",textDecoration:s==="skipped"?"line-through":"none"}}>{b.label}</span>
                </div>
              );
            })}
            <div style={{fontSize:11,color:"#333",marginTop:6}}>{done} done · {skip} skipped · {ns.length-done-skip} unmarked</div>
          </div>
        );
      })}
    </div>
  );
}

// ── APP ───────────────────────────────────────────────────────────────────────
export default function App(){
  const mode=getMode();
  const [tab,setTab]=useState("today");
  const [sem,setSem]=useState(1);
  const [now,setNow]=useState(nowHr());
  const [allLogs,setAllLogs]=useState({});
  const [weekDis,setWeekDis]=useState({});
  const [adjBlocks,setAdjBlocks]=useState(null);
  const [loaded,setLoaded]=useState(false);
  const today=todayKey();

  useEffect(()=>{const t=setInterval(()=>setNow(nowHr()),1000);return()=>clearInterval(t);},[]);
  useEffect(()=>{
    (async()=>{
      const [logs,wd,sv]=await Promise.all([ST.get("all_logs"),ST.get(`wd_${weekKey()}`),ST.get("sem")]);
      setAllLogs(logs||{});setWeekDis(wd||{});setSem(sv||1);setLoaded(true);
    })();
  },[]);

  const rawBlocks=(SCHEDULE[mode]?.[sem]?.[today])||[];
  useEffect(()=>setAdjBlocks(rawBlocks.map(b=>({...b}))),[mode,sem,today]);
  const blocks=adjBlocks||rawBlocks.map(b=>({...b}));
  const todayLog=allLogs[todayStr()]||{};
  const disabledToday=weekDis[today]||{};

  const handleToggle=useCallback(async bid=>{
    const cur=(allLogs[todayStr()]||{})[bid];
    const next=cur==="done"?"skipped":cur==="skipped"?undefined:"done";
    const updated={...(allLogs[todayStr()]||{})};
    if(next===undefined)delete updated[bid];else updated[bid]=next;
    const newLogs={...allLogs,[todayStr()]:updated};
    setAllLogs(newLogs);await ST.set("all_logs",newLogs);
  },[allLogs]);

  const handleDelay=useCallback(block=>{
    setAdjBlocks(prev=>{
      const cur=prev||rawBlocks.map(b=>({...b}));
      const idx=cur.findIndex(b=>b.id===block.id);
      if(idx<0)return cur;
      return cascade(cur,idx,toMins(cur[idx].start)+cur[idx].dur+15);
    });
  },[rawBlocks]);

  const handleToggleWeek=useCallback(async(day,bid)=>{
    const updated={...weekDis,[day]:{...(weekDis[day]||{})}};
    if(updated[day][bid])delete updated[day][bid];else updated[day][bid]=true;
    setWeekDis(updated);await ST.set(`wd_${weekKey()}`,updated);
  },[weekDis]);

  const handleSem=useCallback(async s=>{setSem(s);await ST.set("sem",s);},[]);

  const NAV=[{key:"today",icon:"◈",label:"Today"},{key:"week",icon:"▦",label:"Week"},{key:"habits",icon:"🔥",label:"Habits"},{key:"log",icon:"≡",label:"Log"}];

  if(!loaded)return<div style={{background:"#0A0A0A",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Space Grotesk',system-ui,sans-serif",color:"#C8F060",fontSize:13}}>Loading…</div>;

  return(
    <div style={{background:"#0A0A0A",minHeight:"100vh",fontFamily:"'Space Grotesk',system-ui,sans-serif",color:"#F0EDE8",maxWidth:430,margin:"0 auto",display:"flex",flexDirection:"column"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(0.8)}}*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}button:active{opacity:0.75}::-webkit-scrollbar{display:none}`}</style>
      <div style={{padding:"14px 16px 10px",borderBottom:"1px solid #141414"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
          <div>
            <div style={{fontSize:10,color:"#3A3A3A",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase"}}>{new Date().toLocaleDateString("en-NL",{weekday:"long",day:"numeric",month:"short"})}</div>
            <div style={{fontSize:20,fontWeight:700,color:"#F0EDE8",marginTop:1}}>{tab==="today"?"Today":tab==="week"?"This week":tab==="habits"?"Habits":"Log"}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:22,fontWeight:700,color:"#C8F060",fontVariantNumeric:"tabular-nums"}}>{fmtTime(now)}</div>
            <div style={{fontSize:10,color:mode==="prep"?"#E09000":"#3A3A3A",fontWeight:600}}>{mode==="prep"?"PREP MODE":weekKey()}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <span style={{fontSize:10,color:"#444",fontWeight:700,letterSpacing:"0.08em"}}>SEM</span>
          {[1,2].map(s=>(
            <button key={s} onClick={()=>handleSem(s)} style={{background:sem===s?"#C8F06022":"#181818",border:`1px solid ${sem===s?"#C8F060":"#252525"}`,color:sem===s?"#C8F060":"#555",borderRadius:20,padding:"3px 10px",fontSize:10,fontWeight:600,cursor:"pointer"}}>
              {s===1?"Sem 1 · Sep–Oct":"Sem 2 · Nov–Dec"}
            </button>
          ))}
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"14px 16px 84px"}}>
        {tab==="today" &&<TodayView blocks={blocks} todayLog={todayLog} disabled={disabledToday} onToggle={handleToggle} onDelay={handleDelay} now={now} today={today}/>}
        {tab==="week"  &&<WeekView  sem={sem} weekDis={weekDis} onToggle={handleToggleWeek} mode={mode}/>}
        {tab==="habits"&&<HabitsView allLogs={allLogs} sem={sem} mode={mode}/>}
        {tab==="log"   &&<LogView    allLogs={allLogs} sem={sem} mode={mode}/>}
      </div>
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,background:"rgba(6,6,6,0.97)",backdropFilter:"blur(16px)",borderTop:"1px solid #161616",display:"flex",padding:"8px 0 20px"}}>
        {NAV.map(({key,icon,label})=>(
          <button key={key} onClick={()=>setTab(key)} style={{flex:1,background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3,color:tab===key?"#C8F060":"#333",transition:"color 0.15s"}}>
            <span style={{fontSize:17}}>{icon}</span>
            <span style={{fontSize:10,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase"}}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
