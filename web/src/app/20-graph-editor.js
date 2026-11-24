/* ===== tab 2: edit the graph, then generate plans ===== */
let TAB=1,GE=null,GV={tx:0,ty:0,k:1},gdrag=null,GENRES=null,gPick=0,GSEED=0,geHist=[];
const ek=(a,b)=>a<b?a+'|'+b:b+'|'+a;
const gsvg=$('#gsvg');
function nodeInfo(id){if(id==='EXT')return{name:'室外',type:'exterior'};const r=room(id);if(r)return{name:r.name,type:r.type};
 const n=GE&&GE.nodes[id];return n?{name:n.name,type:n.type}:{name:String(id),type:'other'}}
const gnm=id=>nodeInfo(id).name;
function geSig(){return JSON.stringify([S.rooms,S.doors,S.scale,tol])}
function gIds(){return S.rooms.map(r=>r.id).concat(Object.keys(GE.nodes).filter(id=>GE.nodes[id].isNew))}
function gCodes(){const ids=gIds(),tot={},n={},out={};ids.forEach(id=>{const t=nodeInfo(id).type;tot[t]=(tot[t]||0)+1});
 ids.forEach(id=>{const t=nodeInfo(id).type;n[t]=(n[t]||0)+1;out[id]=TY[t].code+(tot[t]>1?n[t]:'')});out.EXT='⊕';return out}
const alive=id=>id==='EXT'||(GE.nodes[id]&&!GE.nodes[id].deleted);
const nodePos=id=>id==='EXT'?GE.ext:GE.nodes[id];
function geInit(){
 clearCandidates();const A=analyze(),nodes={};
 S.rooms.forEach(r=>{const c=labelPt(r.pts);nodes[r.id]={x:c[0],y:c[1],target:Math.abs(area(r.pts)),locked:OUTDOOR.has(r.type),isNew:false,deleted:false}});
 const seen=new Set(),edges=[];let ex=0,ey=0,en=0;
 A.edges.forEach(e=>{if(e.a===e.b)return;const k=ek(e.a,e.b);if(e.b==='EXT'){ex+=e.m[0];ey+=e.m[1];en++}if(seen.has(k))return;seen.add(k);edges.push({a:e.a,b:e.b,kind:e.kind})});
 const pts=S.rooms.flatMap(r=>r.pts),xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);
 const bx0=Math.min(...xs),bx1=Math.max(...xs),by0=Math.min(...ys),by1=Math.max(...ys),cx=(bx0+bx1)/2,cy=(by0+by1)/2,diag=Math.hypot(bx1-bx0,by1-by0);
 let ext;if(en){const mx=ex/en,my=ey/en,dx=mx-cx,dy=my-cy,L=Math.hypot(dx,dy)||1;ext={x:mx+dx/L*diag*.15,y:my+dy/L*diag*.15}}else ext={x:bx1+diag*.08,y:by1+diag*.08};
 GE={nodes,edges,base:new Map(edges.map(e=>[ek(e.a,e.b),e.kind])),ext,sel:null,link:null,sig:geSig(),briefs:[]};geHist=[];GENRES=null;
 briefDraft=null;$('#briefText').value='';
 if(S.savedDesign){restoreDesign(S.savedDesign);delete S.savedDesign}
}
function geSnap(){briefDraft=null;clearCandidates();geHist.push(JSON.stringify({nodes:GE.nodes,edges:GE.edges,ext:GE.ext,briefs:GE.briefs}));if(geHist.length>150)geHist.shift()}
function geUndo(){if(!GE||!geHist.length){toast('没有可撤销的关系图编辑');return}briefDraft=null;clearCandidates();const d=JSON.parse(geHist.pop());GE.nodes=d.nodes;GE.edges=d.edges;GE.ext=d.ext;GE.briefs=d.briefs||[];GE.sel=null;GE.link=null;renderGE()}
function fitG(){const r=gsvg.getBoundingClientRect();const ps=Object.values(GE.nodes).map(n=>[n.x,n.y]).concat([[GE.ext.x,GE.ext.y]]).concat(S.rooms.flatMap(r=>r.pts));
 const xs=ps.map(p=>p[0]),ys=ps.map(p=>p[1]),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
 const k=Math.min((r.width||600)/(x1-x0+1),(r.height||500)/(y1-y0+1))*.86;GV={k,tx:((r.width||600)-(x1-x0)*k)/2-x0*k,ty:((r.height||500)-(y1-y0)*k)/2-y0*k}}
function gToWorld(e){const r=gsvg.getBoundingClientRect();return[(e.clientX-r.left-GV.tx)/GV.k,(e.clientY-r.top-GV.ty)/GV.k]}
function toggleEdge(a,b){geSnap();const k=ek(a,b),i=GE.edges.findIndex(e=>ek(e.a,e.b)===k);
 if(i>=0){GE.edges.splice(i,1);GE.sel=null;toast(`已断开：${gnm(a)} — ${gnm(b)}`)}
 else{GE.edges.push({a,b,kind:GE.base.get(k)||'door'});GE.sel={t:'edge',k};toast(`已连接：${gnm(a)} — ${gnm(b)}`)}}
function nodeClick(id){
 if(GE.link&&GE.link!==id){const a=GE.link;GE.link=null;if(alive(a)&&alive(id))toggleEdge(a,id);else toast('被移除的空间不能连接',true);renderGE();return}
 if(GE.link===id){GE.link=null;renderGE();return}
 GE.sel={t:'node',id};GE.link=alive(id)?id:null;renderGE()}
function restoreGhost(k){geSnap();const[a,b]=k.split('|');GE.edges.push({a,b,kind:GE.base.get(k)});GE.sel={t:'edge',k};GE.link=null;toast(`已恢复：${gnm(a)} — ${gnm(b)}`);renderGE()}
function geDeleteSel(){if(!GE||!GE.sel)return;const s=GE.sel;
 if(s.t==='edge'){geSnap();GE.edges=GE.edges.filter(e=>ek(e.a,e.b)!==s.k);GE.sel=null}
 else if(s.id!=='EXT'){const n=GE.nodes[s.id];geSnap();
  if(n.isNew){delete GE.nodes[s.id];GE.edges=GE.edges.filter(e=>e.a!==s.id&&e.b!==s.id);GE.sel=null}else n.deleted=!n.deleted}
 GE.link=null;renderGE()}
gsvg.addEventListener('contextmenu',e=>e.preventDefault());
gsvg.addEventListener('mousedown',e=>{if(!GE)return;const t=e.target,nd=t.closest('[data-node]'),ed=t.closest('[data-edge]'),gh=t.closest('[data-ghost]');
 if(e.button===0&&nd){const id=nd.getAttribute('data-node'),p=nodePos(id);gdrag={type:'node',id,x:e.clientX,y:e.clientY,ox:p.x,oy:p.y,moved:false};return}
 if(e.button===0&&ed){gdrag={type:'edge',k:ed.getAttribute('data-edge'),x:e.clientX,y:e.clientY,moved:false};return}
 if(e.button===0&&gh){gdrag={type:'ghost',k:gh.getAttribute('data-ghost'),x:e.clientX,y:e.clientY,moved:false};return}
 gdrag={type:'pan',x:e.clientX,y:e.clientY,tx:GV.tx,ty:GV.ty,moved:false}});
function geMove(e){const dx=e.clientX-gdrag.x,dy=e.clientY-gdrag.y;if(Math.hypot(dx,dy)>3)gdrag.moved=true;
 if(gdrag.type==='pan'){GV.tx=gdrag.tx+dx;GV.ty=gdrag.ty+dy;drawGE()}
 else if(gdrag.type==='node'&&gdrag.moved){if(!gdrag.snap){geSnap();gdrag.snap=true}const p=nodePos(gdrag.id);p.dragged=true;p.x=gdrag.ox+dx/GV.k;p.y=gdrag.oy+dy/GV.k;drawGE()}}
function geUp(){const g=gdrag;gdrag=null;if(!GE)return;
 if(!g.moved){if(g.type==='node')nodeClick(g.id);else if(g.type==='edge'){GE.sel={t:'edge',k:g.k};GE.link=null;renderGE()}
  else if(g.type==='ghost')restoreGhost(g.k);else{GE.sel=null;GE.link=null;renderGE()}}
 else if(g.type==='node')renderGE()}
gsvg.addEventListener('wheel',e=>{e.preventDefault();if(!GE)return;const r=gsvg.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top;
 const nk=Math.min(30,Math.max(.03,GV.k*Math.exp(-e.deltaY*.0015)));GV.tx=mx-(mx-GV.tx)*nk/GV.k;GV.ty=my-(my-GV.ty)*nk/GV.k;GV.k=nk;drawGE()},{passive:false});

function drawGE(){
 if(!GE)return;const k=GV.k,cd=gCodes();
 $('#gw').setAttribute('transform',`translate(${GV.tx},${GV.ty}) scale(${k})`);
 let h='';
 S.rooms.forEach(r=>h+=`<polygon points="${r.pts.map(p=>p.join(',')).join(' ')}" fill="${TY[r.type].color}" fill-opacity=".07" stroke="#bbb" stroke-width="1" vector-effect="non-scaling-stroke"/>`);
 const cur=new Set(GE.edges.map(e=>ek(e.a,e.b)));
 GE.base.forEach((kind,kk)=>{if(cur.has(kk))return;const[a,b]=kk.split('|');if(!alive(a)||!alive(b))return;const p=nodePos(a),q=nodePos(b);
  h+=`<line x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}" stroke="#d62728" stroke-opacity=".55" stroke-width="2" stroke-dasharray="6 5" vector-effect="non-scaling-stroke"/>`;
  h+=`<line x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}" stroke="transparent" stroke-width="12" vector-effect="non-scaling-stroke" data-ghost="${kk}" style="cursor:pointer"><title>已删除的原有连接：点击恢复</title></line>`});
 GE.edges.forEach(e=>{if(!alive(e.a)||!alive(e.b))return;const kk=ek(e.a,e.b),p=nodePos(e.a),q=nodePos(e.b);
  const isNew=!GE.base.has(kk),chg=!isNew&&GE.base.get(kk)!==e.kind,isSel=GE.sel&&GE.sel.t==='edge'&&GE.sel.k===kk;
  const col=isNew?'#1a9850':(chg?'#e08a00':'#333');
  if(isSel)h+=`<line x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}" stroke="#0a66d8" stroke-opacity=".3" stroke-width="11" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`;
  h+=`<line x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}" stroke="${col}" stroke-width="${isNew?3:2}" ${e.kind==='opening'?'stroke-dasharray="7 4"':''} vector-effect="non-scaling-stroke"/>`;
  h+=`<line x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}" stroke="transparent" stroke-width="12" vector-effect="non-scaling-stroke" data-edge="${kk}" style="cursor:pointer"/>`});
 const R=14/k;
 Object.keys(GE.nodes).forEach(id=>{const n=GE.nodes[id],inf=nodeInfo(id),isSel=GE.sel&&GE.sel.t==='node'&&GE.sel.id===id,isLink=GE.link===id;
  h+=`<g data-node="${id}" style="cursor:grab" opacity="${n.deleted?.28:1}">`;
  if(isLink)h+=`<circle cx="${n.x}" cy="${n.y}" r="${R+7/k}" fill="none" stroke="#0a66d8" stroke-width="2.5" stroke-dasharray="4 3" vector-effect="non-scaling-stroke"/>`;
  else if(isSel)h+=`<circle cx="${n.x}" cy="${n.y}" r="${R+5/k}" fill="none" stroke="#111" stroke-width="2" vector-effect="non-scaling-stroke"/>`;
  if(n.locked&&!n.deleted)h+=`<circle cx="${n.x}" cy="${n.y}" r="${R+2.5/k}" fill="none" stroke="#555" stroke-width="2.5" vector-effect="non-scaling-stroke"/>`;
  h+=`<circle cx="${n.x}" cy="${n.y}" r="${R}" fill="${TY[inf.type].color}" stroke="#fff" stroke-width="1.6" ${n.isNew?'stroke-dasharray="3 2"':''} vector-effect="non-scaling-stroke"/>`;
  h+=`<text x="${n.x}" y="${n.y+3.8/k}" font-size="${10.5/k}" font-weight="700" text-anchor="middle" fill="#fff" pointer-events="none">${esc(cd[id]||'')}</text>`;
  h+=`<text x="${n.x}" y="${n.y+R+12/k}" font-size="${10.5/k}" text-anchor="middle" fill="#333" stroke="#fff" stroke-width="${3/k}" paint-order="stroke" pointer-events="none">${n.locked?'🔒 ':''}<tspan data-project-text>${esc(inf.name)}</tspan>${n.deleted?'<tspan>（已移除）</tspan>':''}</text>`;
  if(n.deleted)h+=`<path d="M${n.x-R} ${n.y-R}L${n.x+R} ${n.y+R}M${n.x+R} ${n.y-R}L${n.x-R} ${n.y+R}" stroke="#c0181f" stroke-width="2" vector-effect="non-scaling-stroke" pointer-events="none"/>`;
  h+='</g>'});
 const x=GE.ext.x,y=GE.ext.y,isS=GE.sel&&GE.sel.id==='EXT',isL=GE.link==='EXT';
 h+=`<g data-node="EXT" style="cursor:grab">${isL?`<circle cx="${x}" cy="${y}" r="${R+7/k}" fill="none" stroke="#0a66d8" stroke-width="2.5" stroke-dasharray="4 3" vector-effect="non-scaling-stroke"/>`:''}${isS&&!isL?`<circle cx="${x}" cy="${y}" r="${R+5/k}" fill="none" stroke="#111" stroke-width="2" vector-effect="non-scaling-stroke"/>`:''}
  <circle cx="${x}" cy="${y}" r="${R}" fill="#fff" stroke="#111" stroke-width="1.8" vector-effect="non-scaling-stroke"/><path d="M${x-R*.65} ${y}H${x+R*.65}M${x} ${y-R*.65}V${y+R*.65}" stroke="#111" stroke-width="1.6" vector-effect="non-scaling-stroke" pointer-events="none"/>
  <text x="${x}" y="${y+R+12/k}" font-size="${10.5/k}" text-anchor="middle" fill="#333" pointer-events="none">室外</text></g>`;
 $('#gdyn').innerHTML=h;
 $('#ghint').textContent=GE.link?`已选「${gnm(GE.link)}」→ 再点另一个节点：连接或断开（Esc 取消）`:'依次点两个节点 = 连接/断开 · 拖动节点 = 位置意向 · 点连线 = 选中 · 滚轮缩放';
}
function renderGE(){drawGE();renderGESide();renderBrief()}
function unitArea(){const u=S.scale||.01;return u*u}
function renderGESide(){
 if(!GE)return;const cd=gCodes(),ua=unitArea(),s=GE.sel;let h='';
 if(!s)h='<div class="small">点击节点或连线查看属性。依次点两个节点可连接/断开。</div>';
 else if(s.t==='node'&&s.id==='EXT')h='<div><b>⊕ 室外</b></div><div class="small" style="margin-top:4px">连到「室外」的空间，生成时必须贴着建筑外轮廓并开门。</div>';
 else if(s.t==='node'){const n=GE.nodes[s.id],inf=nodeInfo(s.id);
  h=`<div style="display:flex;gap:6px;align-items:center"><span class="dot" style="background:${TY[inf.type].color}"></span><b>${esc(cd[s.id]||'')}</b><input id="gsname" class="full" value="${esc(inf.name)}"></div>
  <select id="gstype" class="full">${TYPES.map(t=>`<option value="${t[0]}"${t[0]===inf.type?' selected':''}>${t[1]}</option>`).join('')}</select>
  <div class="prm">目标面积 <input id="gsarea" type="number" step="0.5" min="0.5" value="${(n.target*ua).toFixed(1)}"> m²</div>
  ${S.scale?'':'<div class="small">未设比例尺：按 1 px = 1 cm 估算</div>'}
  <label style="display:block;margin:6px 0"><input type="checkbox" id="gslock" ${n.locked?'checked':''} ${n.isNew?'disabled':''}> 🔒 锁定（保持原位置和形状）</label>
  <button id="gsdel">${n.isNew?'🗑 删除这个新空间':(n.deleted?'↺ 恢复这个空间':'✕ 从方案中移除这个空间')}</button>`}
 else{const[a,b]=s.k.split('|'),e=GE.edges.find(x=>ek(x.a,x.b)===s.k);
  if(e){const st=!GE.base.has(s.k)?'<span style="color:#1a9850">新增的连接</span>':(GE.base.get(s.k)!==e.kind?'<span style="color:#e08a00">原有连接（类型已改）</span>':'原有连接');
   h=`<div><b ${a!=='EXT'?'data-project-text':''}>${esc(gnm(a))}</b> ↔ <b ${b!=='EXT'?'data-project-text':''}>${esc(gnm(b))}</b></div><div class="small" style="margin:3px 0">${st}</div>
   <div class="prm">类型 <select id="gekind"><option value="door"${e.kind==='door'?' selected':''}>门</option><option value="opening"${e.kind==='opening'?' selected':''}>常开开口</option></select></div>
   <button id="gedel">🗑 删除这条连接</button>`}}
 $('#gsel').innerHTML=h;
 const on=(id,ev,f)=>{const el=$(id);if(el)el.addEventListener(ev,f)};
 on('#gsname','change',e=>{briefDraft=null;clearCandidates();const r=room(s.id);if(r)r.name=e.target.value;else GE.nodes[s.id].name=e.target.value;GE.sig=geSig();renderGE()});
 on('#gstype','change',e=>{briefDraft=null;clearCandidates();const r=room(s.id);if(r)r.type=e.target.value;else GE.nodes[s.id].type=e.target.value;GE.sig=geSig();renderGE()});
 on('#gsarea','change',e=>{const v=parseFloat(e.target.value);if(v>0){geSnap();GE.nodes[s.id].target=v/ua}renderGE()});
 on('#gslock','change',e=>{geSnap();GE.nodes[s.id].locked=e.target.checked;renderGE()});
 on('#gsdel','click',geDeleteSel);on('#gedel','click',geDeleteSel);
 on('#gekind','change',e=>{geSnap();const ed=GE.edges.find(x=>ek(x.a,x.b)===s.k);ed.kind=e.target.value;renderGE()});
 const curK=new Set(GE.edges.filter(e=>alive(e.a)&&alive(e.b)).map(e=>ek(e.a,e.b)));
 const added=[...curK].filter(k=>!GE.base.has(k)).length,removed=[...GE.base.keys()].filter(k=>{const[a,b]=k.split('|');return !curK.has(k)}).length;
 const kch=GE.edges.filter(e=>GE.base.has(ek(e.a,e.b))&&GE.base.get(ek(e.a,e.b))!==e.kind).length;
 const vals=Object.values(GE.nodes),nn=vals.filter(n=>n.isNew).length,nd=vals.filter(n=>n.deleted).length,nl=vals.filter(n=>n.locked&&!n.deleted).length;
 let sm='';if(added)sm+=`<div style="color:#1a9850">＋ ${added} 条新连接</div>`;if(removed)sm+=`<div style="color:#c0181f">− ${removed} 条连接被删除</div>`;
 if(kch)sm+=`<div style="color:#e08a00">⇄ ${kch} 条改了门/开口类型</div>`;if(nn)sm+=`<div style="color:#1a9850">＋ ${nn} 个新空间</div>`;if(nd)sm+=`<div style="color:#c0181f">− ${nd} 个空间被移除</div>`;
 if(!sm)sm='<div class="small">还没有改动。直接生成会得到关系相同、几何不同的方案。</div>';
 sm+=`<div class="small" style="margin-top:4px">共 ${curK.size} 条连接 · 🔒 锁定 ${nl} 个空间</div>`;
 $('#gsum').innerHTML=sm;
 $('#glist').innerHTML=Object.keys(GE.nodes).map(id=>{const n=GE.nodes[id],inf=nodeInfo(id),isSel=s&&s.t==='node'&&s.id===id;
  return`<div class="grow${isSel?' sel':''}${n.deleted?' del2':''}" data-id="${id}"><span class="dot" style="background:${TY[inf.type].color}"></span><b>${esc(cd[id]||'')}</b><span class="nm" data-project-text>${esc(inf.name)}</span><span class="small">${(n.target*ua).toFixed(1)} m²</span><label title="锁定" class="small"><input type="checkbox" class="glk" ${n.locked?'checked':''} ${n.isNew?'disabled':''}>🔒</label></div>`}).join('');
}
$('#glist').addEventListener('click',e=>{const row=e.target.closest('.grow');if(!row)return;const id=row.dataset.id;
 if(e.target.classList.contains('glk')){geSnap();GE.nodes[id].locked=e.target.checked;renderGE();return}
 if(e.target.tagName==='INPUT'||e.target.tagName==='LABEL')return;GE.sel={t:'node',id};GE.link=null;renderGE()});
$('#gnewType').innerHTML=TYPES.map(t=>`<option value="${t[0]}">${t[1]}</option>`).join('');
$('#gnewType').value='study';
$('#gadd').addEventListener('click',()=>{if(!GE)return;geSnap();const t=$('#gnewType').value,r=gsvg.getBoundingClientRect();
 const ar=S.rooms.filter(x=>x.type===t).map(x=>Math.abs(area(x.pts))),all=S.rooms.map(x=>Math.abs(area(x.pts))).sort((a,b)=>a-b);
 const target=ar.length?ar.reduce((a,b)=>a+b,0)/ar.length:(all[all.length>>1]||10000);
 const id=nid('n'),x=(r.width/2-GV.tx)/GV.k,y=(r.height/2-GV.ty)/GV.k;
 GE.nodes[id]={x,y,target,locked:false,isNew:true,deleted:false,type:t,name:ui(TY[t].label)+(uiLanguage==='en'?' (new)':'（新）')};
 GE.sel={t:'node',id};GE.link=id;renderGE();toast('新空间已放在中间：拖到想要的位置，再点另一个节点把它连起来')});
$('#gundo').addEventListener('click',geUndo);
$('#greset').addEventListener('click',()=>{clearCandidates();geInit();fitG();renderGE();renderRes();toast('已重置为当前平面的关系图')});

