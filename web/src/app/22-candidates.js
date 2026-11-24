/* ---------- show candidates ---------- */
function drawCand(el,c,big,ov){
 const pts=c.rooms.flatMap(r=>r.pts),xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);
 const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys),w=x1-x0,h=y1-y0,pad=Math.max(w,h)*(big?.07:.04);
 el.setAttribute('viewBox',`${x0-pad} ${y0-pad} ${w+2*pad} ${h+2*pad}`);el.setAttribute('preserveAspectRatio','xMidYMid meet');
 const fs=Math.max(w,h)/52,cen={},bc=[(x0+x1)/2,(y0+y1)/2];c.rooms.forEach(r=>cen[r.id]=labelPt(r.pts));
 let s='';
 c.rooms.forEach(r=>s+=`<polygon points="${r.pts.map(p=>p.join(',')).join(' ')}" fill="${TY[r.type]?TY[r.type].color:'#ccc'}" fill-opacity="${ov&&big?.28:.45}" stroke="#222" stroke-width="${big?2.2:1}" vector-effect="non-scaling-stroke"/>`);
 if(big&&c.briefEvidence){
   const targets=new Set(c.briefEvidence.map(e=>e.id));
   for(const r of c.rooms)if(targets.has(r.id))s+='<polygon points="'+r.pts.join(' ')+'" fill="none" stroke="#67479d" stroke-width="2.5" stroke-dasharray="7 3" vector-effect="non-scaling-stroke"/>';
 }
 if(big&&$('#showbeds').checked&&c.use)s+=useSvg(c.use,fs*.8,true);
 else if(big&&$('#showbeds').checked)for(const bedroom of c.bedrooms){
   if(!bedroom.bed)continue;
   for(const route of bedroom.bed.routes){
     s+='<polyline class="bed-route" points="'+route.points.join(' ')+'" fill="none" stroke="#166b83" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="3 3" vector-effect="non-scaling-stroke"/>';
   }
   s+='<polygon class="bed-footprint" points="'+bedroom.bed.pts.map(p=>p.join(',')).join(' ')+'" fill="#fff" fill-opacity=".72" stroke="#436981" stroke-width="1.3" stroke-dasharray="5 3" vector-effect="non-scaling-stroke"/>';
 }
 c.doors.forEach(d=>{s+=`<line x1="${d.a[0]}" y1="${d.a[1]}" x2="${d.b[0]}" y2="${d.b[1]}" stroke="#fff" stroke-width="${big?6:3}" vector-effect="non-scaling-stroke"/>`;
  s+=`<line x1="${d.a[0]}" y1="${d.a[1]}" x2="${d.b[0]}" y2="${d.b[1]}" stroke="${d.hard?'#087c48':d.kind==='door'?'#8c4b16':'#1f8a63'}" stroke-width="${big?1.6:1}" ${d.kind==='opening'?'stroke-dasharray="4 3"':''} vector-effect="non-scaling-stroke"/>`});
 if(big&&ov){c.doors.forEach(d=>{const m=[(d.a[0]+d.b[0])/2,(d.a[1]+d.b[1])/2],end=id=>{if(id!=='EXT'&&cen[id])return cen[id];const dx=m[0]-bc[0],dy=m[1]-bc[1],L=Math.hypot(dx,dy)||1;return[m[0]+dx/L*fs*2.2,m[1]+dy/L*fs*2.2]};
   const pa=end(d.ra),pb=end(d.rb);s+=`<polyline points="${pa} ${m} ${pb}" fill="none" stroke="${d.hard?'#087c48':'#1d1d1d'}" stroke-width="${d.hard?3:1.5}" ${d.kind==='opening'?'stroke-dasharray="5 4"':''} vector-effect="non-scaling-stroke"/>`;
   [d.ra,d.rb].forEach(id=>{if(id==='EXT'||!cen[id]){const p=end('EXT'),r=fs*.6;s+=`<circle cx="${p[0]}" cy="${p[1]}" r="${r}" fill="#fff" stroke="#111" stroke-width="1.3" vector-effect="non-scaling-stroke"/><path d="M${p[0]-r*.65} ${p[1]}H${p[0]+r*.65}M${p[0]} ${p[1]-r*.65}V${p[1]+r*.65}" stroke="#111" stroke-width="1.2" vector-effect="non-scaling-stroke"/>`}})});}
 c.missing.forEach(k=>{const[a,b]=k.split('|'),pa=cen[a],pb=cen[b];
  if(pa&&pb){s+=`<line x1="${pa[0]}" y1="${pa[1]}" x2="${pb[0]}" y2="${pb[1]}" stroke="#d62728" stroke-width="${big?2.5:1.6}" stroke-dasharray="6 4" vector-effect="non-scaling-stroke"/>`;
   if(big)s+=`<text x="${(pa[0]+pb[0])/2}" y="${(pa[1]+pb[1])/2+fs*.35}" font-size="${fs*1.1}" text-anchor="middle" fill="#d62728" font-weight="700" stroke="#fff" stroke-width="${fs*.25}" paint-order="stroke">✗</text>`}
  else{const p=pa||pb;if(p)s+=`<circle cx="${p[0]}" cy="${p[1]}" r="${fs*1.6}" fill="none" stroke="#d62728" stroke-width="${big?2.5:1.6}" stroke-dasharray="5 3" vector-effect="non-scaling-stroke"/>`}});
 if(big){const cd=gCodes();c.rooms.forEach(r=>{const p=cen[r.id];
  if(ov)s+=`<circle cx="${p[0]}" cy="${p[1]}" r="${fs*.75}" fill="${TY[r.type]?TY[r.type].color:'#ccc'}" stroke="#fff" stroke-width="1.4" vector-effect="non-scaling-stroke"/><text x="${p[0]}" y="${p[1]+fs*.3}" font-size="${fs*.75}" font-weight="700" text-anchor="middle" fill="#fff">${esc(cd[r.id]||'')}</text>`;
  s+=`<text x="${p[0]}" y="${p[1]+(ov?fs*1.9:fs*.35)}" font-size="${fs*.85}" text-anchor="middle" fill="#222" stroke="#fff" stroke-width="${fs*.22}" paint-order="stroke">${esc(r.name)}</text>`})}
 el.innerHTML=s;
}
function renderRes(){
 const has=!!(GENRES&&GENRES.length);$('#gempty').style.display=has?'none':'flex';$('#greport').hidden=!has;$('#gthumbs').hidden=!has;
 $('#bedtoggle').hidden=!has||!(GENRES[gPick].use&&GENRES[gPick].use.rooms.length||GENRES[gPick].bedrooms.some(b=>b.bed));
 if(!has){$('#gprev').innerHTML='';$('#gstat').textContent='';return}
 const c=GENRES[gPick],ov=$('#gov').checked;drawCand($('#gprev'),c,true,ov);
 $('#gstat').textContent=`方案 ${c.label}`;
 let h=`<div><b>方案 ${c.label}</b> · 关系满足 <b style="color:${c.missing.length?'#c0181f':'#1a7f45'}">${c.satisfied}/${c.total}</b> · 平均面积偏差 ${Math.round(c.areaErr*100)}% <span class="small">· ${c.origin}</span></div>`;
 if(c.briefEvidence?.length)h+=briefReport(c.briefEvidence);
 if(c.use){
   h+='<div class="small" style="margin-top:3px"><b>'+L('使用检查','Use check')+'</b> · '+(c.use.ok?'<span style="color:#1a7f45">'+L('全部卧室合格','all bedrooms pass')+'</span>':'<span style="color:#b3261e">'+L('有卧室未通过','some bedrooms fail')+'</span>')+
     (USESTATS?' · '+L('检查了 ','checked ')+USESTATS.checked+L(' 个不同布局，',' distinct layouts, ')+USESTATS.pass+L(' 个合格',' pass'):'')+'</div>';
   if(USESTATS&&!USESTATS.pass)h+='<div class="small" style="color:#b3261e">'+L('本轮没有全部卧室合格的布局，下面按生成器原排序给出并标出问题。可试试：调大卧室目标面积、解锁卧室旁的空间，或用「精细」重新生成。','No layout in this run passes every bedroom check; options keep the generator ranking with problems marked. Try a larger bedroom target, unlocking rooms next to bedrooms, or the Fine search.')+'</div>';
   h+=useReport(c.use,gnm)+USE_LEGEND();
 } else
 for(const b of c.bedrooms){
   const label=b.bed?'参考床位 '+b.bed.width.toFixed(2)+' × 2.00 m':S.scale?'锁定轮廓中未找到参考床位。':'设置比例尺可测试实际床位。';
   h+='<div class="small"><b>'+esc(gnm(b.id))+'</b> · <span>连续矩形区 '+Math.round(b.share*100)+'%</span> · <span>'+label+'</span>'+(b.bed&&!b.bed.routes.length?' · <span>该卧室没有标注出入口。</span>':'')+'</div>';
 }
 if(c.bedrooms.some(b=>b.bed?.routes.length))h+='<div class="small">门口至床侧的虚线表示已核验的 0.60 m 通道。</div>';
 for(const k of c.critical){const [a,b]=k.split('|');h+='<div class="ok">✓ '+esc(gnm(a))+' ↔ '+esc(gnm(b))+' · 已核对共墙和直通门洞</div>'}
 if(!c.missing.length)h+='<div class="ok">✓ 从生成的平面重新提取关系图，与你编辑后的关系图一致</div>';
 c.missing.forEach(k=>{const[a,b]=k.split('|');h+=`<div class="miss">✗ ${esc(gnm(a))} — ${esc(gnm(b))}：没有形成共用墙和门</div><div class="small" style="margin:-1px 0 3px 14px">${L('可能原因：','Likely reason: ')}${esc(missingReason(a,b))}</div>`});
 c.extra.forEach(k=>{const[a,b]=k.split('|');h+=`<div class="small">＋ 多出的连接：${esc(gnm(a))} — ${esc(gnm(b))}</div>`});
 if(c.missing.length)h+='<div class="small">可以试试：解锁相关空间、把节点拖近一点、调整目标面积，或用「精细」重新生成。</div>';
 h+='<div class="row2" style="margin-top:6px"><button id="gadopt">✔ 采用此方案（回到标注继续改）</button><button id="gexpc">↗ 导出此方案 JSON</button></div>';
 $('#greport').innerHTML=h;
 $('#gadopt').addEventListener('click',()=>adopt(gPick));
 $('#gexpc').addEventListener('click',()=>{const txt=JSON.stringify(planJSON(c.rooms,c.doors,(S.name||'plan')+' 方案'+c.label),null,1);download((S.name||'plan')+'_option_'+c.label+'.json',txt);$('#mt').value=txt;$('#modal').hidden=false});
 $('#gthumbs').innerHTML=GENRES.map((x,i)=>`<div class="th${i===gPick?' on':''}" data-i="${i}"><svg></svg><div class="tl"><b>${x.label}</b> · 关系 <span style="color:${x.missing.length?'#c0181f':'#1a7f45'}">${x.satisfied}/${x.total}</span> · 面积 ±${Math.round(x.areaErr*100)}%${x.use?(x.use.ok?' · <span style="color:#1a7f45">✓</span>':' · <span style="color:#b3261e">✗</span>'):''}</div></div>`).join('');
 document.querySelectorAll('#gthumbs .th').forEach((d,i)=>drawCand(d.querySelector('svg'),GENRES[i],false,false));
}
$('#gthumbs').addEventListener('click',e=>{const t=e.target.closest('.th');if(!t)return;gPick=+t.dataset.i;renderRes()});
$('#gov').addEventListener('change',renderRes);
$('#showbeds').addEventListener('change',renderRes);
function adopt(i){const c=GENRES[i],briefs=activeBriefs();pushHist();
 S.rooms=c.rooms.map(r=>({id:r.id,type:r.type,name:r.name,pts:r.pts.map(p=>[p[0],p[1]])}));
 S.doors=c.doors.map(d=>({id:nid(d.kind==='door'?'d':'o'),kind:d.kind,a:d.a.slice(),b:d.b.slice()}));
 tol=Math.max(3,Math.min(60,Math.round(c.cell*.35)));$('#tol').value=tol;$('#tolv').textContent=tol;
 $('#sbg').checked=false;$('#bg').style.display='none';
 if(briefs.length)S.savedDesign={briefs,source:JSON.stringify([S.rooms,S.doors,S.scale])};
 GE=null;GENRES=null;sel=null;switchTab(1);
 toast(`已采用方案 ${c.label}：底图已隐藏（左侧「显示底图」可打开），可以继续修改，或再次进入 ② 编辑关系`)}

