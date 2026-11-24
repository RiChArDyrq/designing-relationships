/* ---------- interaction ---------- */
let lastEvt=null, drawingMenu=false;
function toWorld(e){const r=svg.getBoundingClientRect();return[(e.clientX-r.left-view.tx)/view.k,(e.clientY-r.top-view.ty)/view.k]}
function snap(p,e,exclude,anchor){
 if(e&&e.shiftKey&&anchor){const dx=p[0]-anchor[0],dy=p[1]-anchor[1];p=Math.abs(dx)>Math.abs(dy)?[p[0],anchor[1]]:[anchor[0],p[1]]}
 let best=null,bd=9/view.k;
 for(const r of S.rooms)for(const q of r.pts){if(q===exclude)continue;const d=dist(q,p);if(d<bd){bd=d;best=q}}
 for(const q of draft){const d=dist(q,p);if(d<bd&&q!==draft[draft.length-1]){bd=d;best=q}}
 return best?[best[0],best[1]]:p;
}
function hit(p){
 let bd=10/view.k,bestD=null;
 for(const d of S.doors){const dd=dSeg(p,d.a,d.b);if(dd<bd){bd=dd;bestD=d}}
 if(bestD)return{t:'door',id:bestD.id};
 const rs=S.rooms.filter(r=>inPoly(p,r.pts)).sort((a,b)=>Math.abs(area(a.pts))-Math.abs(area(b.pts)));
 return rs.length?{t:'room',id:rs[0].id}:null;
}
function closeDraft(){if(draft.length<3)return;drawingMenu=false;pushHist();const n=S.rooms.filter(r=>r.type===curType).length;
 const r={id:nid('r'),type:curType,name:ui(TY[curType].label)+(n?n+1:''),pts:draft};consumeDrawing(r);S.rooms.push(r);draft=[];sel={t:'room',id:r.id};render()}
function deleteSel(){if(!sel)return;pushHist();
 if(sel.t==='room')S.rooms=S.rooms.filter(r=>r.id!==sel.id);else S.doors=S.doors.filter(d=>d.id!==sel.id);sel=null;render()}
function toggleKind(){if(!sel||sel.t!=='door')return;pushHist();const d=door(sel.id);d.kind=d.kind==='door'?'opening':'door';render()}
function snapSelected(){if(!sel||sel.t!=='room'){toast('先选中一个房间',true);return}if(!GRAY){toast('图片像素不可用',true);return}
 pushHist();const n=snapRoomToWalls(room(sel.id),Math.round(12/Math.max(GS,.5)));render();toast(n?`已吸附 ${n} 条边`:'附近没有找到明显的墙线，边界保持不变')}
function snapAll(){if(!S.rooms.length||!GRAY){toast('没有可吸附的房间或图片',true);return}pushHist();let n=0;
 S.rooms.forEach(r=>n+=snapRoomToWalls(r,10));render();toast(`共吸附 ${n} 条边（只移动靠近明显墙线的边，开放空间的分界不动）`)}
function setMode(m){drawingMenu=false;scanDrawing=null;mode=m;draft=[];doorA=null;scaleA=null;document.querySelectorAll('#modes button').forEach(b=>b.classList.toggle('on',b.dataset.m===m));
 svg.style.cursor=m==='select'?'default':'crosshair';render()}
function setType(t){curType=t;document.querySelectorAll('#types button').forEach(b=>b.classList.toggle('on',b.dataset.t===t));
 if(sel&&sel.t==='room'){pushHist();const r=room(sel.id),old=TY[r.type].label;const prefix=[old,translateMessage(old)].find(label=>r.name.startsWith(label)&&/^\d*$/.test(r.name.slice(label.length)));if(prefix)r.name=ui(TY[t].label)+r.name.slice(prefix.length);r.type=t;render()}
 else if(mode==='select'&&!sel)setMode('room')}
function applyScale(){const v=parseFloat($('#slen').value);if(S.scaleLine&&v>0){const L=dist(S.scaleLine.a,S.scaleLine.b);if(L>0)S.scale=v/L}
 $('#sinfo').textContent=S.scale?`1 px = ${S.scale.toFixed(4)} m · 图幅约 ${(S.w*S.scale).toFixed(1)} × ${(S.h*S.scale).toFixed(1)} m`:'未设置：导出时按 1 px = 0.01 m'}

svg.addEventListener('contextmenu',e=>e.preventDefault());
svg.addEventListener('selectstart',e=>e.preventDefault());
svg.addEventListener('mousedown',e=>{if(!S.img)return;
 e.preventDefault();svg.focus({preventScroll:true});
 if(e.button===0&&drawingMenu){drawingMenu=false;placeBar()}
 const p=toWorld(e);
 if(e.button!==0||spaceDown){drag={type:'pan',x:e.clientX,y:e.clientY,tx:view.tx,ty:view.ty,btn:e.button,p};return}
 // Commit room vertices on press, independently of hover redraws or a later click.
 if(mode==='room'){
   if(e.detail===2){closeDraft();return}
   if(draft.length>=3&&dist(p,draft[0])<10/view.k){closeDraft();return}
   if(sel){sel=null;render()}
   const last=draft[draft.length-1],vertex=snap(p,e,null,last);
   if(last&&dist(vertex,last)<2/view.k)return;
   draft.push(vertex);cursor=p;lastEvt=e;renderTemp();return
 }
 if(mode!=='select')return;
 if(sel&&sel.t==='room'){const r=room(sel.id),i=r.pts.findIndex(q=>dist(q,p)<8/view.k);if(i>=0){drag={type:'v',r,i};return}}
 if(sel&&sel.t==='door'){const d=door(sel.id);for(const end of['a','b'])if(dist(d[end],p)<8/view.k){drag={type:'e',d,end};return}}
 sel=hit(p);if(!sel)drag={type:'pan',x:e.clientX,y:e.clientY,tx:view.tx,ty:view.ty,btn:0,p};render()});
window.addEventListener('mousemove',e=>{lastEvt=e;
 if(gdrag){geMove(e);return}
 if(drag){if(drag.type==='pan'){if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>3)drag.moved=true;
   view.tx=drag.tx+e.clientX-drag.x;view.ty=drag.ty+e.clientY-drag.y;renderCanvas()}
  else{if(!drag.moved){pushHist();drag.moved=true}
   const cur=drag.type==='v'?drag.r.pts[drag.i]:drag.d[drag.end];const p=snap(toWorld(e),e,cur,null);
   if(drag.type==='v')drag.r.pts[drag.i]=p;else drag.d[drag.end]=p;renderCanvas()}return}
 if(e.target.closest&&e.target.closest('#cv')){cursor=toWorld(e);if(mode!=='select')renderTemp()}});
window.addEventListener('mouseup',e=>{if(gdrag){geUp();return}
 const d=drag;drag=null;if(!d)return;
 if(d.type==='pan'&&d.btn===2&&!d.moved){
  if(draft.length){draft.pop();renderTemp();return}
  if(doorA||scaleA){doorA=null;scaleA=null;renderTemp();return}
  sel=hit(d.p);drawingMenu=!!sel;render();return}
 if(d.moved)render();else placeBar()});
svg.addEventListener('click',e=>{if(!S.img||e.button!==0||spaceDown)return;const raw=toWorld(e);
 if(mode==='wand'){wandAt(raw);return}
 if(mode==='door'||mode==='opening'){if(sel&&!doorA){sel=null;render()}const p=snap(raw,e,null,doorA);
  if(!doorA)doorA=p;else{if(dist(p,doorA)<2/view.k)return;pushHist();const d={id:nid(mode==='door'?'d':'o'),kind:mode,a:doorA,b:p};S.doors.push(d);doorA=null;render()}renderTemp()}
 else if(mode==='scale'){if(!scaleA)scaleA=raw;else{pushHist();S.scaleLine={a:scaleA,b:raw};scaleA=null;applyScale();render()}renderTemp()}});
svg.addEventListener('dblclick',e=>{if(mode==='room'&&!spaceDown){e.preventDefault();closeDraft()}});
svg.addEventListener('wheel',e=>{e.preventDefault();const r=svg.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top;
 const nk=Math.min(30,Math.max(.03,view.k*Math.exp(-e.deltaY*.0015)));view.tx=mx-(mx-view.tx)*nk/view.k;view.ty=my-(my-view.ty)*nk/view.k;view.k=nk;renderCanvas()},{passive:false});
window.addEventListener('keydown',e=>{if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)||e.target.closest?.('button')&&[' ','Enter'].includes(e.key))return;
 const k=e.key.toLowerCase();
 if(TAB===2){
  if((e.ctrlKey||e.metaKey)&&k==='z'){e.preventDefault();geUndo();return}
  if(k==='escape'&&GE){GE.link=null;GE.sel=null;renderGE();return}
  if(k==='delete'||k==='backspace'){e.preventDefault();geDeleteSel();return}
  return}
 if((e.ctrlKey||e.metaKey)&&k==='z'){e.preventDefault();e.shiftKey?redo():undo();return}
 if((e.ctrlKey||e.metaKey)&&k==='y'){e.preventDefault();redo();return}
 if(e.ctrlKey||e.metaKey||e.altKey)return;
 if(e.key===' '){spaceDown=true;svg.style.cursor='grab';e.preventDefault();return}
 if(k==='escape'){draft=[];doorA=null;scaleA=null;sel=null;render()}
 else if(k==='enter'){if(mode==='room')closeDraft()}
 else if(k==='backspace'||k==='delete'){e.preventDefault();if(draft.length){draft.pop();renderTemp()}else if(doorA){doorA=null;renderTemp()}else deleteSel()}
 else if(k==='g'){showGraph=!showGraph;$('#sg').checked=showGraph;render()}
 else if({v:1,w:1,r:1,d:1,o:1,s:1}[k])setMode({v:'select',w:'wand',r:'room',d:'door',o:'opening',s:'scale'}[k]);
 else if(/^[1-9]$/.test(k)&&TYPES[+k-1])setType(TYPES[+k-1][0])});
window.addEventListener('keyup',e=>{if(e.key===' '){spaceDown=false;svg.style.cursor=mode==='select'?'default':'crosshair'}});

/* floating bar */
$('#bdel').addEventListener('click',deleteSel);
$('#btog').addEventListener('click',toggleKind);
$('#bsnap').addEventListener('click',snapSelected);
$('#bx').addEventListener('click',()=>{sel=null;render()});

/* side panel events */
$('#bundo').addEventListener('click',undo);
$('#bredo').addEventListener('click',redo);
$('#snapb').addEventListener('click',snapSelected);
$('#snapall').addEventListener('click',snapAll);
['thr','gap'].forEach(id=>$('#'+id).addEventListener('input',e=>{$('#'+id+'v').textContent=e.target.value;WALL=null;if($('#showmask').checked)showMask()}));
$('#thin').addEventListener('change',()=>{WALL=null;if($('#showmask').checked)showMask()});
$('#showmask').addEventListener('change',e=>e.target.checked?showMask():hideMask());
$('#sbg').addEventListener('change',e=>{$('#bg').style.display=e.target.checked?'':'none'});
$('#list').addEventListener('click',e=>{const it=e.target.closest('.item');if(!it)return;
 if(e.target.classList.contains('del')){sel={t:'room',id:it.dataset.id};deleteSel();return}
 if(/INPUT|SELECT/.test(e.target.tagName))return;drawingMenu=true;sel={t:'room',id:it.dataset.id};render()});
$('#list').addEventListener('change',e=>{const it=e.target.closest('.item');const r=room(it.dataset.id);pushHist();
 if(e.target.classList.contains('nm'))r.name=e.target.value;if(e.target.classList.contains('ty'))r.type=e.target.value;render()});
$('#dlist').addEventListener('click',e=>{const it=e.target.closest('.ditem');if(!it)return;
 drawingMenu=true;sel={t:'door',id:it.dataset.id};if(e.target.classList.contains('del')){deleteSel();return}render()});
$('#jg').addEventListener('click',e=>{const id=e.target.getAttribute('data-id');if(id){drawingMenu=true;sel={t:'room',id};render()}});
$('#tol').addEventListener('input',e=>{tol=+e.target.value;$('#tolv').textContent=tol;render()});
$('#slen').addEventListener('change',()=>{pushHist();applyScale();render()});
$('#sg').addEventListener('change',e=>{showGraph=e.target.checked;render()});

