
let scanRows=[],scanDrawing=null,scanNotice='',scanPixels=null,imageEpoch=0,fileEpoch=0,scanEpoch=0;
function resetRecognition(){
  scanEpoch++;scanRows=[];scanDrawing=null;scanNotice='';scanPixels=null;
  $('#scanReview').hidden=true;$('#scanLayer').innerHTML='';$('#scan').disabled=true;
}
function captureInk(rgba){
  const n=rgba.length/4,color=new Uint8Array(n),mono=new Uint8Array(n),wall=new Uint8Array(n);
  let count=0;
  for(let i=0;i<n;i++){
    const r=rgba[4*i],g=rgba[4*i+1],b=rgba[4*i+2];
    color[i]=Number(r<140&&g<140&&b-Math.max(r,g)>32);
    count+=color[i];
    const chroma=Math.max(r,g,b)-Math.min(r,g,b);
    mono[i]=Number(chroma<40&&Math.max(r,g,b)<127);
    wall[i]=color[i]?255:Math.min(GRAY[i],chroma>32&&b>r&&b>g&&r<185?125:255);
  }
  return {color,mono,wall,count};
}
function findRegions(pixels,labels,threshold,gap){
  const w=GW,h=GH,n=w*h;
  let barrier=Uint8Array.from(pixels.wall,v=>Number(v<threshold));
  if($('#thin').checked)barrier=dil(ero(barrier,1),1);
  barrier=dil(barrier,gap);
  const occupied=barrier,queue=new Int32Array(n),out=[];
  const limit=Math.max(90,n*.00065);
  for(let start=0;start<n;start++){
    if(occupied[start])continue;
    let tail=1,head=0,x0=w,x1=0,y0=h,y1=0;queue[0]=start;occupied[start]=1;
    while(head<tail){
      const i=queue[head++],x=i%w,y=Math.floor(i/w);
      x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
      if(x&& !occupied[i-1]){occupied[i-1]=1;queue[tail++]=i-1}
      if(x+1<w&&!occupied[i+1]){occupied[i+1]=1;queue[tail++]=i+1}
      if(y&&!occupied[i-w]){occupied[i-w]=1;queue[tail++]=i-w}
      if(y+1<h&&!occupied[i+w]){occupied[i+w]=1;queue[tail++]=i+w}
    }
    const rw=x1-x0+1,rh=y1-y0+1;
    if(!x0||!y0||x1===w-1||y1===h-1||tail<limit||tail>n*.35||rw<9||rh<9||Math.max(rw/rh,rh/rw)>10||tail/(rw*rh)<.24)continue;
    const pad=gap+2,cw=rw+pad*2,ch=rh+pad*2,local=new Uint8Array(cw*ch);
    for(let j=0;j<tail;j++){const i=queue[j];local[(Math.floor(i/w)-y0+pad)*cw+i%w-x0+pad]=1}
    const expanded=boxPass(boxPass(local,cw,ch,gap,true,'max'),cw,ch,gap,false,'max');
    let pts=simplifyClosed(traceContour(expanded,cw,ch),Math.max(2,Math.min(cw,ch)*.028));
    if(pts.length<3||pts.length>22)continue;
    pts=pts.map(([x,y])=>[(x+x0-pad)/GS,(y+y0-pad)/GS]);
    const size=Math.abs(area(pts));
    if(size*GS*GS>tail*2.8)continue;
    const inside=labels.filter(l=>inPoly(l.point,pts));
    if(inside.length>1)continue;
    if(inside.length===0 && labels.length)continue;
    out.push({pts,size,label:inside[0],certainty:tail/(rw*rh)});
  }
  return out;
}
function overlapRegion(a,b){
  const p=labelPt(a.pts),q=labelPt(b.pts);
  return inPoly(p,b.pts)||inPoly(q,a.pts);
}
function runScan(){
  if(!scanPixels)return;
  const ticket=++scanEpoch,epoch=imageEpoch;
  scanDrawing=null;scanRows=[];scanNotice='正在读取图中文字和墙线…';drawScanList();
  $('#scan').disabled=true;
  setTimeout(()=>{
    if(epoch!==imageEpoch||ticket!==scanEpoch)return;
    try{
      const pix=scanPixels;
      let found=pix.count>35?PlanLabels.read(pix.color,GW,GH):[];
      if(!found.length)found=PlanLabels.read(pix.mono,GW,GH,true);
      const labels=found.map(r=>({name:r.name,type:r.type,point:[r.x/GS,r.y/GS]}));
      const base=+$('#thr').value,gap=Math.max(1,Math.round(+$('#gap').value*GS));
      const regions=findRegions(pix,labels,base,gap);
      if(labels.length){
        const printHeight=found.map(l=>l.group[0].height).sort((a,b)=>a-b)[Math.floor(found.length/2)];
        const bridge=Math.max(gap+2,Math.round(printHeight*.65));
        const profiles=[[base,bridge],[Math.min(215,base+25),Math.max(gap*2,bridge)],
          [Math.min(220,base+50),bridge]];
        for(const [threshold,radius] of profiles)regions.push(...findRegions(pix,labels,threshold,radius));
      }
      if(labels.length){
        scanRows=labels.map(label=>{
          const hits=regions.filter(r=>r.label===label).sort((a,b)=>a.size-b.size);
          // A label inside furniture, or two incompatible outlines from different thresholds,
          // cannot establish the room boundary.
          const good=hits.filter(r=>r.size>(S.w*S.h)*.0018).reverse();
          const stable=good.find(r=>good.some(s=>s!==r && Math.min(r.size,s.size)/Math.max(r.size,s.size)>.80));
          const pts=stable?.pts||null;
          return {...label,pts:pts||null,checked:!!pts};
        });
      }else{
        scanRows=regions.sort((a,b)=>b.size-a.size).slice(0,65).map((r,i)=>({name:(uiLanguage==='en'?'Space ':'空间 ')+(i+1),type:'other',pts:r.pts,point:labelPt(r.pts),checked:true}));
      }
      scanRows=scanRows.filter(r=>!S.rooms.some(ex=>r.pts?overlapRegion(r,ex):inPoly(r.point,ex.pts)));
      const bound=scanRows.filter(r=>r.pts).length, pins=scanRows.length-bound;
      scanNotice=scanRows.length?(labels.length?'读到 '+labels.length+' 组英文名称。':'')+bound+' 个候选轮廓'+(pins?'，'+pins+' 处仅定位到文字。':'。'):
        (S.rooms.length?'未找到可新增的独立轮廓。':'未找到可靠的名称或封闭轮廓。可调整墙线阈值和门洞封闭后重试，或点魔棒、手动描边。');
    }catch(error){scanRows=[];scanNotice='识别中止：'+error.message}
    finally{if(epoch===imageEpoch&&ticket===scanEpoch){$('#scan').disabled=false;drawScanList()}}
  },15);
}
function drawScanLayer(){
  const layer=$('#scanLayer');if(!layer)return;
  layer.innerHTML=scanRows.map((r,i)=>{
    const [x,y]=r.point,k=view.k||1;
    const poly=r.pts&&r.checked?'<polygon points="'+r.pts.map(p=>p.join(',')).join(' ')+'" fill="#18798b" fill-opacity=".14" stroke="#14697a" stroke-width="2" stroke-dasharray="5 3" vector-effect="non-scaling-stroke"/>':'';
    const color=r.pts?'#14697a':'#985500', ax=x,ay=y-14/k;
    return poly+'<g pointer-events="none"><circle cx="'+ax+'" cy="'+ay+'" r="'+(8/k)+'" fill="'+color+'"/><text x="'+ax+'" y="'+(ay+3.2/k)+'" text-anchor="middle" font-size="'+(9/k)+'" fill="white">'+(i+1)+'</text></g>';
  }).join('');
}
function drawScanList(){
  const panel=$('#scanReview');panel.hidden=!scanNotice&&!scanRows.length;
  $('#scanStatus').textContent=scanNotice;
  $('#scanNames').innerHTML=scanRows.map((r,i)=>'<div class="scanrow">'+(r.pts?'<input type="checkbox" data-include="'+i+'" '+(r.checked?'checked':'')+'>':'<span></span>')+'<span data-project-text>'+String(i+1)+'. '+esc(r.name)+'</span><button type="button" data-outline="'+i+'">描边</button></div>').join('');
  const count=scanRows.filter(r=>r.pts&&r.checked).length;
  $('#scanApply').textContent='采用选中的 '+count+' 个轮廓';$('#scanApply').hidden=!count;
  drawScanLayer();
}
function consumeDrawing(r){
  if(!scanDrawing)return;
  r.name=scanDrawing.name;r.type=scanDrawing.type;
  scanRows=scanRows.filter(row=>row!==scanDrawing);scanDrawing=null;
  scanNotice='已加入手绘轮廓。';drawScanList();
}
$('#scan').addEventListener('click',runScan);
$('#scanNames').addEventListener('change',e=>{
  const i=e.target.dataset.include;if(i===undefined||!scanRows[i])return;
  scanRows[i].checked=e.target.checked;drawScanList();
});
$('#scanNames').addEventListener('click',e=>{
  const btn=e.target.closest('[data-outline]');if(!btn)return;
  const r=scanRows[+btn.dataset.outline];if(!r)return;
  sel=null;setMode('room');setType(r.type);scanDrawing=r;
  $('#hint').textContent='正在描「'+r.name+'」。沿实际边界逐点点击，按 Enter 闭合。';
});
$('#scanApply').addEventListener('click',()=>{
  const picked=scanRows.filter(r=>r.checked&&r.pts&&!S.rooms.some(s=>overlapRegion(s,r)));
  if(!picked.length)return;pushHist();
  for(const r of picked)S.rooms.push({id:nid('r'),type:r.type,name:r.name,pts:r.pts.map(p=>p.slice())});
  scanRows=scanRows.filter(r=>!picked.includes(r));scanDrawing=null;sel=null;
  scanNotice='已加入 '+picked.length+' 个候选轮廓，可拖动顶点修正。门和开口请沿图纸标注。';
  setMode('select');drawScanList();render();
});
$('#scanDismiss').addEventListener('click',()=>{scanEpoch++;scanRows=[];scanDrawing=null;scanNotice='';$('#scan').disabled=!scanPixels;drawScanList()});


/* Straight-wall layout search. All coordinates stay in plan pixels. */
