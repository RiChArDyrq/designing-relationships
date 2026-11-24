/* ---------- use check UI (v0.5.7) ----------
 * Draws USE results (beds, bedside strips, door swings, wardrobes, walking routes) and writes
 * one report line per bedroom. Engine logic lives in engine/use-check.js.
 */
const L=(zh,en)=>uiLanguage==='en'?en:zh;
[['卧室使用检查','Bedroom use check'],['在平面上显示床位、门扇和动线','Show beds, door swings and walking routes'],
 ['使用检查（卧室）','Use check (bedrooms)'],['主卧床宽','Main bed width'],['主卧两侧都能上床','Main bed reachable from both sides'],
 ['主卧需要衣柜位（0.6 × 1.2 m）','Main bedroom needs a wardrobe (0.6 × 1.2 m)'],['优先给出使用检查合格的方案','Put layouts that pass the use check first'],
 ['尺寸为原型默认值，不是规范值。','Sizes are prototype defaults, not code values.']].forEach(([z,e])=>englishCopy.set(z,e));

function useOpts(){return{masterBed:+$('#useMaster').value,both:$('#useBoth').checked,wardrobe:$('#useWard').checked}}

// Called from 21-run-generator instead of GEN.select.
let USESTATS=null;
function pickOptions(pool,n,P){
  USESTATS=null;
  const briefs=activeBriefs(),cache=new WeakMap();
  function penalty(c){
    if(!cache.has(c)){
      c.briefEvidence=BRIEF.evaluate(BRIEF.model(c.rooms,c.doors),briefs);
      const mean=c.briefEvidence.reduce((sum,e)=>sum+e.score,0)/briefs.length;
      cache.set(c,260*(1-mean));
    }
    return cache.get(c);
  }
  const selector=briefs.length?{select:(pool,count,P)=>GEN.select(pool,count,P,penalty)}:GEN;
  if(!S.scale||!$('#usePrefer').checked){
    const out=selector.select(pool,n,P),targets=Object.fromEntries(P.R.map(r=>[r.id,r.target]));
    out.forEach(c=>c.use=S.scale?USE.check(c.rooms,c.doors,S.scale,{...useOpts(),targets}):null);
    if(briefs.length)out.forEach(penalty);
    return out;
  }
  const res=USE.selectWithUse(selector,pool,n,P,S.scale,useOpts());
  if(briefs.length)res.options.forEach(penalty);
  USESTATS=res.stats;return res.options;
}

function useSvg(u,fs,big){
  if(!u)return '';let s='';
  for(const r of u.rooms){
    const col=r.ok?'#2f6f4f':'#b3261e';
    (r.sides||[]).forEach(p=>s+='<polygon points="'+p.map(q=>q.join(',')).join(' ')+'" fill="#7fb7d6" fill-opacity=".25" stroke="none"/>');
    if(r.wardrobe)s+='<polygon class="use-wardrobe" points="'+r.wardrobe.pts.map(q=>q.join(',')).join(' ')+'" fill="#d9c7a5" fill-opacity=".9" stroke="#7a6240" stroke-width="1.1" vector-effect="non-scaling-stroke"/>';
    if(r.bed){
      s+='<polygon class="bed-footprint" points="'+r.bed.pts.map(q=>q.join(',')).join(' ')+'" fill="#fff" fill-opacity=".9" stroke="#2f5d78" stroke-width="1.5" vector-effect="non-scaling-stroke"/>';
      const p=r.bed.pts,c=[(p[0][0]+p[2][0])/2,(p[0][1]+p[2][1])/2];
      s+='<text x="'+c[0]+'" y="'+c[1]+'" font-size="'+fs+'" text-anchor="middle" fill="#2f5d78" stroke="#fff" stroke-width="'+(fs*.2)+'" paint-order="stroke">'+r.bed.width.toFixed(1)+'</text>';
    }
    r.arcs.forEach(a=>{s+='<polyline class="use-swing" points="'+a.pts.map(q=>q.join(',')).join(' ')+'" fill="none" stroke="#555" stroke-width="1" stroke-dasharray="3 2" vector-effect="non-scaling-stroke"/><line x1="'+a.hinge[0]+'" y1="'+a.hinge[1]+'" x2="'+a.leaf[0]+'" y2="'+a.leaf[1]+'" stroke="#555" stroke-width="1.2" vector-effect="non-scaling-stroke"/>'});
    if(r.path&&r.path.length>1)s+='<polyline class="use-route" points="'+r.path.map(q=>q.join(',')).join(' ')+'" fill="none" stroke="'+col+'" stroke-width="'+(big?2.4:1.6)+'" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>';
  }
  return s;
}

function useLine(r,nameOf){
  const name=esc(nameOf?nameOf(r.id):r.name);
  const role=r.role==='master'?L('主卧','Main bedroom')+(r.inferred?L('（按面积推断）',' (largest room)'):''):L('次卧','Bedroom');
  let t='<b>'+name+'</b> · '+role+' · '+r.area.toFixed(1)+' m²';
  if(r.ratio)t+=' ('+L('目标的 ','')+Math.round(r.ratio*100)+'%'+L('',' of target')+')';
  if(!r.bed)return t+' · <span style="color:#b3261e">'+L('放不下 ','No room for a ')+r.req.beds[r.req.beds.length-1].toFixed(1)+L(' m 的床（含床侧 0.6 m）',' m bed with 0.6 m beside it')+'</span>';
  const acc=r.access==='both'?L('两侧可上床','both sides reachable'):r.access==='one'?L('一侧可上床','one side reachable'):L('从门走不到床侧','bedside not reachable from the door');
  t+=' · '+L('床 ','bed ')+r.bed.width.toFixed(1)+'×2.0 · '+acc;
  if(r.pathLen!=null)t+=' · '+(r.pathLen<.15?L('门口即到床侧','door opens onto the bedside'):L('门到床侧 ','door → bedside ')+r.pathLen.toFixed(1)+' m');
  if(r.role==='master'&&r.req.wardrobe)t+=' · '+(r.wardrobe?L('有衣柜位','wardrobe fits'):'<span style="color:#a15c00">'+L('无衣柜位','no wardrobe space')+'</span>');
  const warn=[];
  if(r.issues.includes('smaller'))warn.push(L('首选 ','preferred ')+r.req.beds[0].toFixed(1)+L(' m 床放不下',' m bed does not fit'));
  if(r.issues.includes('access'))warn.push(L('主卧要求两侧上床','main bedroom needs both sides'));
  if(r.issues.includes('door'))warn.push(L('没有门','no door'));
  if(r.issues.includes('area'))warn.push(L('面积超出目标的 70–150%：床位合格靠改变房间大小','area outside 70–150% of target: the bed fits only because the room size changed'));
  if(warn.length)t+=' · <span style="color:'+(r.ok?'#a15c00':'#b3261e')+'">'+warn.join(L('；','; '))+'</span>';
  return t;
}
function useReport(u,nameOf){
  let h='';
  u.rooms.forEach(r=>h+='<div class="small">'+(r.ok?'✓ ':'✗ ')+useLine(r,nameOf)+'</div>');
  if(u.warn&&u.warn.length)h+='<div class="small" style="color:#a15c00">⚠ '+L('这些空间名称像卧室，但类型不是「卧室」，未参与检查：','These look like bedrooms but are not typed as bedroom, so they were skipped: ')+u.warn.map(esc).join(L('、',', '))+'</div>';
  return h;
}
const USE_LEGEND=()=>'<div class="small" style="color:#888">'+L('蓝色条 = 床侧 0.6 m · 虚线弧 = 门扇 · 棕色块 = 衣柜 · 实线 = 从门到床侧、0.6 m 宽可通行的最短路线 · 尺寸为原型默认值，不是规范值','Blue strip = 0.6 m bedside · dashed arc = door leaf · brown block = wardrobe · line = shortest 0.6 m-wide walk from the door to the bedside · sizes are prototype defaults, not code values')+'</div>';

// Why a relationship is missing: a plain-language guess from the graph editor's state.
function missingReason(a,b){
  const lockedNode=id=>id!=='EXT'&&GE&&GE.nodes[id]&&GE.nodes[id].locked;
  if(lockedNode(a)||lockedNode(b))return L('一端是锁定空间，位置不能移动，没排到相邻','one end is locked in place, so the two could not be placed side by side');
  if(a==='EXT'||b==='EXT')return L('需要贴外墙开门，但外墙位置被其他房间占用','needs a door on an outside wall, but other rooms took the outside wall');
  return L('在面积和形状约束下，两个房间没有排到相邻位置','under the area and shape limits the two rooms did not end up next to each other');
}

// Tab ①: check the annotated plan itself.
function renderUse(){
  const el=$('#useRep'),g=$('#luse');if(!el||!g)return;
  try{
    if(!S.rooms.length){el.innerHTML='';g.innerHTML='';return}
    if(!S.scale){el.innerHTML='<div class="small">'+L('先用比例尺工具设定比例，才能检查床位和动线。','Set the scale first to test beds and walking routes.')+'</div>';g.innerHTML='';return}
    const u=USE.check(S.rooms,USE.attach(S.rooms,S.doors,tol),S.scale,useOpts());
    el.innerHTML=u.rooms.length?useReport(u)+($('#useShow').checked?USE_LEGEND():''):'<div class="small">'+L('没有类型为「卧室」的空间。','No room is typed as bedroom.')+'</div>'+useReport({rooms:[],warn:u.warn});
    g.innerHTML=$('#useShow').checked?useSvg(u,11/view.k,false):'';
  }catch(err){el.textContent=L('使用检查出错：','Use check failed: ')+err.message;g.innerHTML='';console.error(err)}
}
['useShow','useMaster','useBoth','useWard'].forEach(id=>$('#'+id).addEventListener('change',()=>{if(TAB===1)render()}));
// Dynamic report text is written in the current language, so redraw after a language switch.
$('#language').addEventListener('click',()=>setTimeout(()=>{if(TAB===1)render();else renderRes()},0));
