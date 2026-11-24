/* ---------- run generator ---------- */
function genInput(){
  const rooms=[],codes=gCodes();
  for(const r of S.rooms){
    const n=GE.nodes[r.id];if(!n || n.deleted)continue;
    const original=labelPt(r.pts);
    rooms.push({...r,code:codes[r.id],target:n.target,locked:n.locked,original,seed:[n.x,n.y],moved:dist(original,[n.x,n.y])>2});
  }
  for(const [id,n] of Object.entries(GE.nodes)){
    if(n.isNew&&!n.deleted)rooms.push({id,code:codes[id],type:n.type,name:n.name,pts:null,target:n.target,locked:false,original:null,seed:[n.x,n.y],moved:!!n.dragged});
  }
  const edges=GE.edges.filter(e=>alive(e.a)&&alive(e.b)).map(e=>({...e,hard:GE.base.get(ek(e.a,e.b))!==e.kind}));
  const lengths=S.doors.filter(d=>d.kind==='door').map(d=>dist(d.a,d.b)).sort((a,b)=>a-b);
  const doorPx=S.scale?.9/S.scale:lengths[lengths.length>>1];
  return {rooms,edges,doorPx,scale:S.scale,footprint:S.rooms,briefs:activeBriefs()};
}
let searchSerial=0;
function clearCandidates(){
  searchSerial++;GENRES=null;gPick=0;$('#gprep').textContent='';$('#gempty').textContent='在左侧编辑关系图，然后点「▶ 生成平面方案」';
  $('#ggo').disabled=false;$('#gprog').textContent='';renderRes();
}
$('#ggo').addEventListener('click',()=>{
  if(!GE)return;
  clearCandidates();
  const current=searchSerial,inp=genInput(),n=+$('#gn').value,it=+$('#git').value,seed=++GSEED;
  const trials=Math.max(n*8,it>=4000?240:it>=1500?128:50),pool=[];
  let P;
  try{P=GEN.prepare(inp)}catch(err){$('#gempty').textContent=err.message;$('#gprog').textContent=err.message;return}
  if(P.adjusted)$('#gprep').textContent='已在生成时校正 '+P.adjusted+' 个房间的轻微描边偏差。';
  if(P.bridged){const info=document.createElement('div');info.textContent='已在生成副本中接合 '+P.bridged+' 处窄墙缝。';$('#gprep').append(info)}
  if(P.wingDomain?.joinedArea){const msg=document.createElement('div');msg.textContent='部分分区会合并相邻房间之间的细墙缝。';$('#gprep').append(msg)}
  $('#gempty').textContent='正在生成平面方案…';
  $('#ggo').disabled=true;
  const started=Date.now();
  function step(trial) {
    if(current!==searchSerial)return;
    $('#gprog').textContent='正在比较布局 '+(trial+1)+' / '+trials;
    setTimeout(()=>{
      if(current!==searchSerial)return;
      try{
        const c=GEN.search(P,trial,it,seed);if(c)pool.push(c);
      }catch(err){$('#ggo').disabled=false;$('#gempty').textContent=$('#gprog').textContent='生成中止：'+err.message;return}
      if(trial+1<trials){step(trial+1);return}
      try{GENRES=pickOptions(pool,n,P)}catch(err){$('#ggo').disabled=false;$('#gempty').textContent=$('#gprog').textContent='生成中止：'+err.message;return}
      gPick=0;$('#ggo').disabled=false;

      $('#gprog').textContent=GENRES.length?'已生成 '+GENRES.length+' / '+n+' 个不同布局 · '+((Date.now()-started)/1000).toFixed(1)+' 秒':
        GEN.failure(P);
      if(!GENRES.length)$('#gempty').textContent=$('#gprog').textContent;
      renderRes();
    },0);
  }
  step(0);
});


