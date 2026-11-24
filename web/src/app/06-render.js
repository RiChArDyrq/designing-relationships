/* ---------- rendering ---------- */
function renderCanvas(){
 drawScanLayer();
 world.setAttribute('transform',`translate(${view.tx},${view.ty}) scale(${view.k})`);
 $('#empty').style.display=S.img?'none':'flex';
 const k=view.k,cd=codes(),A=analyze();
 let h='';
 for(const r of S.rooms){const t=TY[r.type],isSel=sel&&sel.t==='room'&&sel.id===r.id;
  h+=`<polygon points="${r.pts.map(p=>p.join(',')).join(' ')}" fill="${t.color}" fill-opacity="${showGraph?.24:.4}" stroke="${isSel?'#111':t.color}" stroke-width="${isSel?3:1.6}" vector-effect="non-scaling-stroke"/>`;
  const c=labelPt(r.pts);
  h+=`<text x="${c[0]}" y="${c[1]+(showGraph?20/k:4/k)}" font-size="${11.5/k}" text-anchor="middle" fill="#222" stroke="#fff" stroke-width="${3/k}" paint-order="stroke">${esc(r.name)}</text>`;
  if(isSel)r.pts.forEach(p=>h+=`<circle cx="${p[0]}" cy="${p[1]}" r="${4.5/k}" fill="#fff" stroke="#222" stroke-width="1.4" vector-effect="non-scaling-stroke"/>`);
 }
 $('#lr').innerHTML=h;
 h='';
 for(const d of S.doors){const isSel=sel&&sel.t==='door'&&sel.id===d.id;
  if(isSel)h+=`<line x1="${d.a[0]}" y1="${d.a[1]}" x2="${d.b[0]}" y2="${d.b[1]}" stroke="#e0242b" stroke-opacity=".25" stroke-width="14" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`;
  h+=`<line x1="${d.a[0]}" y1="${d.a[1]}" x2="${d.b[0]}" y2="${d.b[1]}" stroke="${isSel?'#e0242b':(d.kind==='door'?'#8c4b16':'#1f8a63')}" stroke-width="${isSel?6:4}" stroke-linecap="round" ${d.kind==='opening'?'stroke-dasharray="7 5"':''} vector-effect="non-scaling-stroke"/>`;
  if(isSel)[d.a,d.b].forEach(p=>h+=`<circle cx="${p[0]}" cy="${p[1]}" r="${4.5/k}" fill="#fff" stroke="#e0242b" stroke-width="1.4" vector-effect="non-scaling-stroke"/>`);
 }
 $('#ld').innerHTML=h;
 h='';
 if(showGraph&&S.rooms.length){
  const cen={};S.rooms.forEach(r=>cen[r.id]=labelPt(r.pts));
  const allc=[S.rooms.reduce((s,r)=>s+cen[r.id][0],0)/S.rooms.length,S.rooms.reduce((s,r)=>s+cen[r.id][1],0)/S.rooms.length];
  for(const e of A.edges){const pa=cen[e.a];let pb;
   if(e.b==='EXT'){const dx=e.m[0]-allc[0],dy=e.m[1]-allc[1],L=Math.hypot(dx,dy)||1;pb=[e.m[0]+dx/L*34/k,e.m[1]+dy/L*34/k]}else pb=cen[e.b];
   h+=`<polyline points="${pa} ${e.m} ${pb}" fill="none" stroke="#1d1d1d" stroke-width="1.7" ${e.kind==='opening'?'stroke-dasharray="5 4"':''} vector-effect="non-scaling-stroke"/>`;
   if(e.b==='EXT'){const r=9/k;h+=`<circle cx="${pb[0]}" cy="${pb[1]}" r="${r}" fill="#fff" stroke="#111" stroke-width="1.5" vector-effect="non-scaling-stroke"/><path d="M${pb[0]-r*.7} ${pb[1]}H${pb[0]+r*.7}M${pb[0]} ${pb[1]-r*.7}V${pb[1]+r*.7}" stroke="#111" stroke-width="1.3" vector-effect="non-scaling-stroke"/>`}
  }
  for(const r of S.rooms){const c=cen[r.id];h+=`<circle cx="${c[0]}" cy="${c[1]}" r="${11/k}" fill="${TY[r.type].color}" stroke="#fff" stroke-width="1.6" vector-effect="non-scaling-stroke"/><text x="${c[0]}" y="${c[1]+3.6/k}" font-size="${10/k}" font-weight="700" text-anchor="middle" fill="#fff">${cd[r.id]}</text>`}
 }
 $('#lg').innerHTML=h;
 renderTemp();
 placeBar();
 return{A,cd};
}
function placeBar(){
 const bar=$('#bar'),it=sel&&(sel.t==='room'?room(sel.id):door(sel.id));
 if(!it||(mode!=='select'&&!drawingMenu)||drag&&drag.moved){bar.hidden=true;return}
 bar.hidden=false;
 const isDoor=sel.t==='door';
 $('#bdel').textContent=isDoor?(it.kind==='door'?'🗑 删除门':'🗑 删除开口'):`🗑 删除「${it.name}」`;
 $('#btog').style.display=isDoor?'':'none';$('#bsnap').style.display=isDoor?'none':'';
 $('#btog').textContent=it.kind==='door'?'⇄ 改为开口':'⇄ 改为门';
 const p=isDoor?[(it.a[0]+it.b[0])/2,(it.a[1]+it.b[1])/2]:labelPt(it.pts);
 const r=svg.getBoundingClientRect();
 let x=p[0]*view.k+view.tx-bar.offsetWidth/2,y=p[1]*view.k+view.ty-(isDoor?50:62);
 x=Math.max(8,Math.min(r.width-bar.offsetWidth-8,x));y=Math.max(48,Math.min(r.height-44,y));
 bar.style.left=x+'px';bar.style.top=y+'px';
}
function renderTemp(){
 const k=view.k;let h='';const c=cursor;
 if(mode==='room'&&draft.length){const pts=[...draft,...(c?[snap(c,lastEvt,null,draft[draft.length-1])]:[])];
  h+=`<polyline points="${pts.map(p=>p.join(',')).join(' ')}" fill="${TY[curType].color}" fill-opacity=".15" stroke="${TY[curType].color}" stroke-width="2" vector-effect="non-scaling-stroke"/>`;
  draft.forEach((p,i)=>h+=`<circle cx="${p[0]}" cy="${p[1]}" r="${(i?3.5:6)/k}" fill="${i?'#fff':TY[curType].color}" stroke="#222" stroke-width="1.2" vector-effect="non-scaling-stroke"/>`)}
 if((mode==='door'||mode==='opening')&&doorA&&c){const b=snap(c,lastEvt,null,doorA);h+=`<line x1="${doorA[0]}" y1="${doorA[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#e0242b" stroke-width="4" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`}
 const sl=scaleA&&c?{a:scaleA,b:c}:(mode==='scale'?S.scaleLine:null);
 if(sl)h+=`<line x1="${sl.a[0]}" y1="${sl.a[1]}" x2="${sl.b[0]}" y2="${sl.b[1]}" stroke="#0a66d8" stroke-width="2.5" vector-effect="non-scaling-stroke"/><circle cx="${sl.a[0]}" cy="${sl.a[1]}" r="${4/k}" fill="#0a66d8"/><circle cx="${sl.b[0]}" cy="${sl.b[1]}" r="${4/k}" fill="#0a66d8"/>`;
 if(c&&mode==='wand')h+=`<circle cx="${c[0]}" cy="${c[1]}" r="${8/k}" fill="${TY[curType].color}" fill-opacity=".35" stroke="${TY[curType].color}" stroke-width="1.5" vector-effect="non-scaling-stroke"/>`;
 if(c&&mode!=='select'&&mode!=='wand'){const sp=snap(c,lastEvt,null,null);if(dist(sp,c)>0)h+=`<circle cx="${sp[0]}" cy="${sp[1]}" r="${7/k}" fill="none" stroke="#0a66d8" stroke-width="1.5" vector-effect="non-scaling-stroke"/>`}
 $('#lt').innerHTML=h;
 updUndo();
}
function renderSide(A,cd){
 const s=A.sum;
 $('#sum').innerHTML=s?`<b>${s.n}</b> 个节点 · <b>${s.E}</b> 条连接 · <b>${s.rings}</b> 个环路（${s.rings?'可绕行':'树状'}）· 最大深度 <b>${s.maxd}</b>`:'<span class="small">标注房间和门后，这里会实时生成层级图</span>';
 $('#warn').innerHTML=A.warn.map(w=>`<div>⚠ ${esc(w)}</div>`).join('');
 drawJG(A,cd);
 const area2=S.scale?S.scale*S.scale:null;
 $('#list').innerHTML=S.rooms.map(r=>{const m=A.per[r.id]||{},isSel=sel&&sel.t==='room'&&sel.id===r.id;
  const integ=m.integ==null?'–':(m.integ===Infinity?'∞':m.integ.toFixed(2));
  return`<div class="item${isSel?' sel':''}" data-id="${r.id}"><span class="dot" style="background:${TY[r.type].color}"></span><b>${cd[r.id]}</b><input class="nm" value="${esc(r.name)}"><button class="del" title="删除">×</button>
  <select class="ty">${TYPES.map(t=>`<option value="${t[0]}"${t[0]===r.type?' selected':''}>${t[1]}</option>`).join('')}</select>
  <span class="meta">深度 ${m.depth??'–'} · 连接 ${m.conn??0} · 整合度 ${integ}${area2?` · ${(Math.abs(area(r.pts))*area2).toFixed(1)} m²`:''}</span></div>`}).join('')||'<div class="small">还没有空间</div>';
 const em={};A.edges.forEach(e=>em[e.id]=e);
 const nm=id=>id==='EXT'?'<span>室外</span>':'<span data-project-text>'+esc(room(id)?room(id).name:'?')+'</span>';
 let di=0,oi=0;
 $('#dlist').innerHTML=S.doors.map(d=>{const e=em[d.id],isSel=sel&&sel.t==='door'&&sel.id===d.id;
  const label=d.kind==='door'?'门 '+(++di):'开口 '+(++oi),col=d.kind==='door'?'#8c4b16':'#1f8a63';
  return`<div class="ditem${isSel?' sel':''}" data-id="${d.id}"><span class="ln" style="border-top:3px ${d.kind==='door'?'solid':'dashed'} ${col}"></span><span>${label}</span><span class="small">${e?nm(e.a)+' ↔ '+nm(e.b):'<span style="color:#c0181f">未连接</span>'}</span><button class="del" title="删除">×</button></div>`}).join('')||'<div class="small">还没有门</div>';
}
function drawJG(A,cd){
 const el=$('#jg');if(!A.root){el.setAttribute('height',60);el.setAttribute('viewBox','0 0 280 60');el.innerHTML='';return}
 const levels=[];A.dr.forEach((d,n)=>(levels[d]=levels[d]||[]).push(n));
 const x={};x[A.root]=0;
 for(let d=1;d<levels.length;d++){const L=levels[d];const bc=n=>{const p=[...A.adj.get(n)].filter(m=>A.dr.get(m)===d-1&&m in x);return p.length?p.reduce((s,m)=>s+x[m],0)/p.length:0};
  L.sort((a,b)=>bc(a)-bc(b)||String(a).localeCompare(b));L.forEach((n,i)=>x[n]=i-(L.length-1)/2)}
 const un=A.ids.filter(i=>!A.dr.has(i));if(un.length)levels.push(un),un.forEach((n,i)=>x[n]=i-(un.length-1)/2);
 const maxW=Math.max(...levels.map(l=>l.length)),W=280,sx=Math.min(44,(W-70)/Math.max(1,maxW-1)),sy=48,H=levels.length*sy+24;
 const P=n=>{const d=A.dr.has(n)?A.dr.get(n):levels.length-1;return[W/2+15+x[n]*sx,H-24-d*sy]};
 let h='';
 levels.forEach((l,d)=>{const y=H-24-d*sy;h+=`<line x1="40" x2="${W}" y1="${y}" y2="${y}" stroke="#eee"/><text x="4" y="${y+4}" font-size="10" fill="#999">${un.length&&d===levels.length-1?'未连通':'深度 '+d}</text>`});
 const done=new Set();
 A.edges.forEach(e=>{const key=[e.a,e.b].sort().join('|');if(done.has(key)||e.a===e.b)return;done.add(key);
  const[a,b]=[P(e.a),P(e.b)],dash=e.kind==='opening'?'stroke-dasharray="4 3"':'';
  if(Math.abs(a[1]-b[1])<1){const mx=(a[0]+b[0])/2,my=a[1]-Math.abs(a[0]-b[0])*.45-6;h+=`<path d="M${a[0]} ${a[1]}Q${mx} ${my} ${b[0]} ${b[1]}" fill="none" stroke="#333" stroke-width="1.3" ${dash}/>`}
  else h+=`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#333" stroke-width="1.3" ${dash}/>`});
 A.ids.forEach(n=>{const[px,py]=P(n);
  if(n==='EXT'){h+=`<circle cx="${px}" cy="${py}" r="10" fill="#fff" stroke="#111" stroke-width="1.5"/><path d="M${px-7} ${py}H${px+7}M${px} ${py-7}V${py+7}" stroke="#111" stroke-width="1.3"/>`;return}
  const r=room(n);const isSel=sel&&sel.id===n;
  h+=`<circle cx="${px}" cy="${py}" r="11" fill="${TY[r.type].color}" stroke="${isSel?'#111':'#fff'}" stroke-width="${isSel?2.4:1.5}" data-id="${n}" style="cursor:pointer"/><text x="${px}" y="${py+3.5}" font-size="9.5" font-weight="700" text-anchor="middle" fill="#fff" pointer-events="none">${cd[n]}</text>`});
 el.setAttribute('viewBox',`0 0 ${W} ${H}`);el.setAttribute('height',H);el.innerHTML=h;
}
function render(){const{A,cd}=renderCanvas();renderSide(A,cd);renderUse();$('#hint').textContent=HINTS[mode]}

