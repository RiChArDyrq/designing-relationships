/* Natural-language goals are kept with the editable relationship graph. */
let briefDraft=null;
function activeBriefs(){
  if(!GE)return [];
  return (GE.briefs||[]).filter(s=>GE.nodes[s.target]&&alive(s.target)&&nodeInfo(s.target).type===(s.kind==='quiet'?'bedroom':'study'))
    .map(s=>({...s,anchor:s.anchor&&GE.nodes[s.anchor]&&alive(s.anchor)&&nodeInfo(s.anchor).type==='bedroom'?s.anchor:null}));
}
function briefModel(){
  const codes=gCodes();
  const rooms=Object.entries(GE.nodes).filter(([id])=>alive(id)).map(([id,n])=>({
    ...nodeInfo(id),id,code:codes[id],pts:room(id)?.pts||null,seed:[n.x,n.y],locked:n.locked
  }));
  const traced=buildGraph().edges;
  const links=GE.edges.flatMap(e=>{
    const mates=traced.filter(t=>ek(e.a,e.b)===ek(t.a,t.b));
    return mates.length?mates:[e];
  });
  return BRIEF.model(rooms,links,tol);
}
function briefName(id){
  if(!id)return '';
  return (gCodes()[id]||'')+' '+gnm(id);
}
const briefNameHTML=id=>esc(briefName(id));
function analyzeBrief(choice,entryChoice){
  const text=$('#briefText').value.trim();
  const m=briefModel(),parsed=BRIEF.parse(text,m.rooms,choice);
  briefDraft={text,...parsed};
  if(parsed.error||parsed.choose){renderBrief();return}
  if(parsed.kind==='study'){
    const studies=m.rooms.filter(r=>r.type==='study');
    studies.sort((a,b)=>BRIEF.evidence(m,b.id,parsed).score-BRIEF.evidence(m,a.id,parsed).score);
    briefDraft.target=studies[0]?.id||null;
  }
  let ranked=BRIEF.sites(m,briefDraft);
  const best=ranked[0];
  if(!best){briefDraft.error='noSite';renderBrief();return}
  const focus=briefDraft.target&&m.byId.get(briefDraft.target);
  const current=focus?.pts?BRIEF.evidence(m,focus.id,briefDraft):null;
  const needsAccess=parsed.kind==='study'&&(!briefDraft.target||!(m.adj.get(briefDraft.target)?.size));
  const possible=m.rooms.filter(r=>r.id!==briefDraft.target&&!['balcony','courtyard','garage'].includes(r.type));
  const preferred=best.access||possible.find(r=>BRIEF.accessTypes.includes(r.type))?.id;
  const access=needsAccess?(possible.find(r=>r.id===entryChoice)?.id||preferred||null):null;
  Object.assign(briefDraft,{ranked,current,needsAccess,possible:possible.map(r=>r.id),access,choice,seed:m.centers.get(best.id)});
  renderBrief();
}
function describeEvidence(e){
  const parts=[];
  if(e.bedroomCount>1&&e.nearest)parts.push(L('按布局推断的安静程度：在 ','Layout-based quietness rank: ')+(uiLanguage==='en'?e.quietRank+' / '+e.bedroomCount+' bedrooms':e.bedroomCount+' 间卧室中排第 '+e.quietRank));
  if(e.nearest)parts.push(L('最近的活动空间为 ','Nearest activity space: ')+briefNameHTML(e.nearest)+L('，中心间距约为平面对角线的 ','; centre distance is about ')+Math.round(e.gap*100)+L('%','% of the plan diagonal'));
  else parts.push(L('图上尚未标出客厅、餐厅或厨房','No living room, dining room or kitchen is mapped'));
  if(e.nearest)parts.push(e.walls.length?L('重合或相邻的活动区墙面：','Touches activity space: ')+e.walls.map(briefNameHTML).join(' / '):L('未检测到与活动空间共墙','No shared activity-space wall detected'));
  if(e.hops!==null)parts.push(L('到最近可达活动空间需经过 ','Nearest reachable activity space: ')+e.hops+L(' 个门或开口',' door or opening crossings'));
  else parts.push(L('已知门洞不足以确认到活动空间的路径','No mapped route to an activity space'));
  if(e.end)parts.push(L('唯一标注出入口位于直走廊端部','Only mapped entrance lies at the end of a straight corridor'));
  else if(e.neighbors.length===1)parts.push(L('图上仅连一个空间','One mapped connection'));
  else if(e.neighbors.length>1)parts.push(L('图上连接 ','Mapped connections: ')+e.neighbors.length+L(' 处',''));
  if(e.anchor&&e.anchorGap!==null)parts.push(L('到 ','Distance to ')+briefNameHTML(e.anchor)+L(' 约为平面对角线的 ',' is about ')+Math.round(e.anchorGap*100)+L('%','% of the plan diagonal'));
  if(e.kind==='study'&&e.publicAccess.length)parts.push(L('可直接从 ','Direct access from ')+e.publicAccess.map(briefNameHTML).join(' / '));
  return parts.join(L('。','. '))+L('。','.');
}
function briefTitle(s){
  return s.kind==='quiet'?briefNameHTML(s.target)+L(' 优先安静',' · prioritise quiet'):
    L('书房','Workspace')+(s.anchor?L(' · 靠近 ',' · near ')+briefNameHTML(s.anchor):'');
}
function renderBrief(){
  $('#briefLabel').textContent=L('空间设计需求','Design brief');
  $('#briefText').placeholder=L('例如：卧室2需要安静，或给主人增加书房','For example: a quiet Bedroom 2, or a workspace for the owner');
  $('#briefAnalyze').textContent=L('分析需求','Analyse brief');
  $('#briefApply').textContent=L('用于生成','Apply to layouts');
  const d=briefDraft,area=$('#briefPreview');
  const tracedSite=d?.ranked?.length?room(d.ranked[0].id):null;
  $('#gbriefSite').innerHTML=tracedSite?'<polygon points="'+tracedSite.pts.join(' ')+'" fill="#7555ac" fill-opacity=".19" stroke="#67479d" stroke-width="3" stroke-dasharray="7 3" vector-effect="non-scaling-stroke"/>':'';
  $('#briefApply').hidden=!d?.ranked||!!(d.needsAccess&&!d.access);
  const errors={
    unsupported:L('目前支持卧室安静选址和书房选址。试试「卧室2需要安静」或「给主人加书房」。','Try “Bedroom 2 needs a quiet location” or “Add a workspace for the owner”.'),
    separate:L('请将卧室和书房分两次添加，两项需求可一起用于生成。','Add the bedroom and workspace briefs separately to use both in one search.'),
    unknownBedroom:L('图中找不到这个卧室编号。请使用右侧房间列表里的编号。','Bedroom number not found. Use a bedroom code from the room list.'),
    noBedroom:L('请先将一个空间标注为卧室。','First mark a space as a bedroom.'),
    noSite:L('缺少可比较的室内范围。请检查房间类型、轮廓和锁定状态。','No eligible indoor area. Check room types, outlines and locks.')
  };
  let h='';
  if(d?.error)h='<p>'+errors[d.error]+'</p>';
  else if(d?.choose){
    const prompt=d.kind==='study'?L('哪间是主人的卧室？','Which bedroom belongs to the owner?'):L('哪间卧室需要安静？','Which bedroom should be quiet?');
    h='<label for="briefChoose">'+prompt+'</label><select class="full" id="briefChoose"><option value="">'+L('选择卧室','Choose a bedroom')+'</option>'+d.choose.map(id=>'<option value="'+esc(id)+'">'+briefNameHTML(id)+'</option>').join('')+'</select>';
  }else if(d?.ranked){
    h='<p><b>'+briefTitle(d)+'</b></p>';
    if(d.kind==='study')h+='<p>'+(d.target?L('优先利用现有书房 ','Reuse existing workspace ')+briefNameHTML(d.target):L('在现有建筑范围内新增书房。','Add a workspace within the existing footprint.'))+'</p>';
    if(d.current)h+='<p>'+L('当前位置：','Current location: ')+describeEvidence({...d.current,kind:d.kind,anchor:d.anchor})+'</p>';
    if(d.target&&GE.nodes[d.target]?.locked)h+='<p>'+L('这个房间已锁定，只评估原位。','This room is locked and evaluated in place.')+'</p>';
    else h+='<p>'+L('重排时优先考虑的区域','Reference areas for repartitioning')+'</p><ol class="brief-sites">'+d.ranked.slice(0,3).map(e=>'<li>'+briefNameHTML(e.id)+'</li>').join('')+'</ol>';
    h+='<p>'+L('图中紫框为首选位置。','The purple outline marks the preferred location. ')+describeEvidence({...d.ranked[0],kind:d.kind,anchor:d.anchor})+'</p>';
    if(d.kind==='study'&&!d.anchor&&/主人|主卧|业主|owner|master/i.test(d.text))h+='<p>'+L('图中没有已标注的主人卧室，本次仅比较安静程度和公共入口。','No owner bedroom was identified. This comparison uses quietness and common-room access.')+'</p>';
    if(d.needsAccess){
      h+='<label for="briefAccess">'+L('新增直通门连接到','Connect the proposed door to')+'</label><select id="briefAccess" class="full"><option value="">'+L('选择相邻空间','Choose an adjoining room')+'</option>'+
        d.possible.map(id=>'<option value="'+esc(id)+'"'+(id===d.access?' selected':'')+'>'+briefNameHTML(id)+'</option>').join('')+'</select>';
    }
    h+='<p class="brief-note">'+L('安静程度按室内布局推断。外部噪声、墙体隔音和使用时段未知。','Quietness is inferred from the indoor layout. Outdoor noise, wall insulation and occupancy schedules are unknown.')+'</p>';
  }
  area.innerHTML=h;
  if(d?.choose)$('#briefChoose').addEventListener('change',e=>{if(e.target.value)analyzeBrief(e.target.value)});
  if(d?.needsAccess)$('#briefAccess').addEventListener('change',e=>{d.access=e.target.value||null;$('#briefApply').hidden=!d.access});
  const specs=activeBriefs();
  $('#briefActive').innerHTML=specs.length?'<p><b>'+L('生成时考虑','Active design briefs')+'</b></p>'+specs.map(s=>'<div class="brief-active-item">'+briefTitle(s)+' <button type="button" data-brief-remove="'+esc(s.target)+'">'+L('移除偏好','Remove preference')+'</button></div>').join(''):'';
}
function applyBrief(){
  const d=briefDraft;
  if(!d?.ranked||(d.needsAccess&&!d.access))return;
  geSnap();
  let target=d.target;
  if(d.kind==='study'&&!target){
    target=nid('n');
    const sizes=Object.values(GE.nodes).filter(n=>!n.deleted&&!n.locked).map(n=>n.target).sort((a,b)=>a-b);
    GE.nodes[target]={x:d.seed[0],y:d.seed[1],target:sizes[sizes.length>>1]||10000,locked:false,isNew:true,deleted:false,type:'study',name:L('书房','Study'),dragged:true};
  }
  if(d.needsAccess&&d.access&&!GE.edges.some(e=>ek(e.a,e.b)===ek(target,d.access)))GE.edges.push({a:target,b:d.access,kind:'door'});
  const spec={kind:d.kind,target,anchor:d.anchor||null,text:d.text};
  GE.briefs=activeBriefs().filter(s=>s.kind!==spec.kind||s.target!==target).concat([spec]);
  GE.sel={t:'node',id:target};GE.link=null;briefDraft=null;
  renderGE();toast(L('已加入生成需求','Design brief applied'));
}
function briefReport(results){
  return '<div class="brief-evidence" data-project-text><b>'+L('本方案的需求核对','Design brief review')+'</b>'+
    results.map(e=>'<div><b>'+briefTitle({...e,target:e.id})+'</b> · '+describeEvidence(e)+'</div>').join('')+'</div>';
}
function saveDesign(){
  if(!GE||GE.sig!==geSig())return S.savedDesign;
  if(!GE.briefs?.length&&!Object.values(GE.nodes).some(n=>n.isNew))return;
  return {nodes:GE.nodes,edges:GE.edges,briefs:activeBriefs(),source:JSON.stringify([S.rooms,S.doors,S.scale])};
}
function restoreDesign(d){
  if(!d||d.source!==JSON.stringify([S.rooms,S.doors,S.scale])||!Array.isArray(d.briefs))return;
  const specs=d.briefs.filter(s=>s&&['quiet','study'].includes(s.kind));
  if(!d.nodes){GE.briefs=specs.filter(s=>GE.nodes[s.target]);return}
  if(!Array.isArray(d.edges))return;
  const nodes=Object.entries(d.nodes);
  const owns=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);
  if(nodes.some(([id,n])=>!n||!Number.isFinite(n.x)||!Number.isFinite(n.y)||!(Number.isFinite(n.target)&&n.target>0)||
    (!owns(GE.nodes,id)&&(!/^n\d+$/.test(id)||!n.isNew||!owns(TY,n.type)))))return;
  if(Object.keys(GE.nodes).some(id=>!Object.prototype.hasOwnProperty.call(d.nodes,id)))return;
  const allowed=new Set(nodes.map(([id])=>id).concat('EXT'));
  if(d.edges.some(e=>!e||!allowed.has(e.a)||!allowed.has(e.b)||e.a===e.b||!['door','opening'].includes(e.kind)))return;
  GE.nodes=d.nodes;GE.edges=d.edges;GE.briefs=specs.filter(s=>owns(GE.nodes,s.target));
  nodes.forEach(([id])=>{if(/^n\d+$/.test(id))idc=Math.max(idc,Number(id.slice(1))+1)});
}
$('#briefAnalyze').addEventListener('click',()=>analyzeBrief());
$('#briefApply').addEventListener('click',applyBrief);
$('#briefText').addEventListener('input',()=>{briefDraft=null;renderBrief()});
$('#briefActive').addEventListener('click',e=>{
  const b=e.target.closest('[data-brief-remove]');if(!b)return;
  geSnap();GE.briefs=GE.briefs.filter(s=>s.target!==b.dataset.briefRemove);renderGE();
});
$('#language').addEventListener('click',()=>setTimeout(()=>{if(TAB===2)renderBrief()},0));

