/* Offline design briefs. Scores express relative preferences within a drawing. */
const BRIEF = (() => {
  const noiseTypes = ['living','dining','kitchen'];
  const accessTypes = ['corridor','entrance','living','dining'];
  const siteTypes = ['bedroom','study','other','living','dining'];
  const norm = s => String(s || '').toLowerCase().replace(/[\s_-]+/g,'');
  const clamp = x => Math.max(0,Math.min(1,x));
  const center = r => r.pts?.length ? labelPt(r.pts) : r.seed;
  function parse(text, rooms, choice) {
    const beds=rooms.filter(r=>r.type==='bedroom');
    const work=/书房|办公|工作\s*[区间室位空角]|工作.{0,3}空间|workspace|work(?:ing)?\s+(space|area)|home\s*office|\bstudy\b|\boffice\b/i.test(text);
    const quiet=/安静|静养|清静|隔音|少.{0,3}干扰|远离.{0,8}(客厅|噪|餐厅|厨房)|quiet|peaceful|away from.{0,15}(noise|living|kitchen|dining)/i.test(text);
    if(!work&&!quiet || /(?:不要|不需要|无需|取消|删除|移除).{0,6}(?:安静|书房|办公|工作空间)|\b(?:remove|delete|no need for|do not add|don't add)\b/i.test(text))return {error:'unsupported'};
    if(work&&quiet&&/(?:卧室|bedroom|\bb\d+\b).{0,20}(?:安静|quiet).{0,28}(?:另|同时|[;；]|and|以及|还)/i.test(text))return {error:'separate'};
    const kind=work?'study':'quiet';
    const mentionsOwner=/主人|主卧|业主|owner|master|primary bedroom/i.test(text);
    const raw=String(text).toLowerCase();
    const number=raw.match(/(?:bedroom|卧室|睡房|\bb)\s*[#号_-]?\s*(\d+)(?!\d)/i);
    const isMaster=r=>/master|primary|owner|主卧|主人房/i.test(r.name);
    const named=beds.filter(r=>{const name=norm(r.name);
      return name.length>1&&!['bedroom','卧室','睡房'].includes(name)&&norm(text).includes(name)});
    let candidates=beds;
    if(number)candidates=beds.filter(r=>norm(r.code)==='b'+Number(number[1]) ||
      (beds.length===1&&Number(number[1])===1) || norm(r.name)===norm(number[0]));
    else if(named.length)candidates=named;
    else if(mentionsOwner&&beds.some(isMaster))candidates=beds.filter(isMaster);
    const needBed=!work||mentionsOwner||!!number||named.length>0;
    if(needBed&&number&&!candidates.length)return {error:'unknownBedroom'};
    if(!work&&!beds.length)return {error:'noBedroom'};
    const picked=candidates.find(r=>r.id===choice)||(candidates.length===1?candidates[0]:null);
    if(needBed&&candidates.length&&!picked)return {kind,choose:candidates.map(r=>r.id)};
    return {kind,anchor:work&&needBed?picked?.id||null:null,target:work?null:picked.id};
  }

  // Parallel faces must overlap over a real run. Touching at a corner does not qualify.
  function sharedWall(a,b,tolerance){
    if(!a?.length||!b?.length)return false;
    for(let i=0;i<a.length;i++){
      const p=a[i],q=a[(i+1)%a.length],len=dist(p,q);
      if(!len)continue;
      const ux=(q[0]-p[0])/len,uy=(q[1]-p[1])/len;
      const across=v=>(v[0]-p[0])*uy-(v[1]-p[1])*ux;
      const along=v=>(v[0]-p[0])*ux+(v[1]-p[1])*uy;
      for(let j=0;j<b.length;j++){
        const v=b[j],w=b[(j+1)%b.length],bl=dist(v,w);
        if(!bl||Math.abs((w[0]-v[0])*uy-(w[1]-v[1])*ux)>bl*.045)continue;
        if(Math.max(Math.abs(across(v)),Math.abs(across(w)))>tolerance)continue;
        const x=along(v),y=along(w);
        if(Math.min(len,Math.max(x,y))-Math.max(0,Math.min(x,y))>Math.max(tolerance*2,Math.min(len,bl)*.10))return true;
      }
    }
    return false;
  }

  function model(rooms,edges,traceTolerance=0) {
    const byId=new Map(rooms.map(r=>[r.id,r]));
    const points=rooms.flatMap(r=>r.pts?.length?r.pts:[r.seed]).filter(Boolean);
    const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
    const diag=Math.hypot(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys))||1;
    const centers=new Map(rooms.map(r=>[r.id,center(r)]));
    const adj=new Map(rooms.map(r=>[r.id,new Set()]));
    const links=[];
    for(const e of edges){
      const a=e.ra??e.a,b=e.rb??e.b;
      if(a===b||(!byId.has(a)&&a!=='EXT')||(!byId.has(b)&&b!=='EXT'))continue;
      adj.get(a)?.add(b);adj.get(b)?.add(a);
      const m=e.m || (e.ra&&Array.isArray(e.a)?[(e.a[0]+e.b[0])/2,(e.a[1]+e.b[1])/2]:null);
      links.push({a,b,m});
    }
    return {rooms,byId,centers,adj,links,diag,tol:Math.max(diag*1e-7,Math.min(traceTolerance,diag*.008))};
  }

  function nearCorridorEnd(hall,door){
    // Only describe a corridor end for a straight rectangular corridor with a known door position.
    if(!door||!hall.pts?.length)return false;
    const p=simplifyClosed(hall.pts,1e-7);
    if(p.length!==4)return false;
    const segments=p.map((v,i)=>({a:v,b:p[(i+1)%4],len:dist(v,p[(i+1)%4])})).sort((a,b)=>b.len-a.len);
    const long=segments[0],short=segments[3];
    if(!short.len||long.len<2*short.len||Math.abs(Math.abs(area(p))-long.len*short.len)>.025*Math.abs(area(p)))return false;
    const t=((door[0]-long.a[0])*(long.b[0]-long.a[0])+(door[1]-long.a[1])*(long.b[1]-long.a[1]))/(long.len*long.len);
    return t<=.18||t>=.82;
  }

  function evidence(m,id,spec){
    const r=m.byId.get(id),p=m.centers.get(id);
    const noisy=m.rooms.filter(n=>noiseTypes.includes(n.type)&&m.centers.get(n.id));
    const distanceTo=n=>dist(p,m.centers.get(n.id));
    noisy.sort((a,b)=>distanceTo(a)-distanceTo(b));
    const nearest=noisy[0],gap=nearest?distanceTo(nearest)/m.diag:null;
    const walls=noisy.filter(n=>r===n||sharedWall(r.pts,n.pts,m.tol)).map(n=>n.id);
    const neighbors=[...(m.adj.get(id)||[])];
    const steps=new Map([[id,0]]),queue=[id];
    for(let i=0;i<queue.length;i++)for(const v of m.adj.get(queue[i])||[]){
      if(v==='EXT'||steps.has(v))continue;
      steps.set(v,steps.get(queue[i])+1);queue.push(v);
    }
    const routes=noisy.filter(n=>steps.has(n.id)).map(n=>steps.get(n.id));
    const hops=routes.length?Math.min(...routes):null;
    const hall=m.byId.get(neighbors[0]);
    const openings=m.links.filter(e=>e.a===id||e.b===id);
    const end=neighbors.length===1&&hall?.type==='corridor'&&openings.length===1&&nearCorridorEnd(hall,openings[0].m);
    const publicAccess=neighbors.filter(v=>accessTypes.includes(m.byId.get(v)?.type));
    const distanceScore=gap===null?.5:clamp(gap/.55);
    const wallScore=nearest ? Number(!walls.length) : .5;
    const routeScore=hops===null?.45:clamp((hops-1)/3);
    const privacy=end?1:neighbors.length===1?.8:neighbors.length===0?.45:neighbors.length===2?.30:0;
    const quiet=.42*distanceScore+.30*wallScore+.18*routeScore+.10*privacy;
    const anchor=m.centers.get(spec.anchor);
    const anchorGap=anchor?dist(p,anchor)/m.diag:null;
    const accessRooms=m.rooms.filter(n=>n.id!==id&&accessTypes.includes(n.type)&&m.centers.get(n.id));
    accessRooms.sort((a,b)=>accessCost(a)-accessCost(b));
    function accessCost(n){return distanceTo(n)/m.diag+({corridor:0,entrance:.12,living:.23,dining:.26}[n.type])}
    const access=accessRooms[0]?.id||null;
    const accessScore=publicAccess.length?1:access?clamp(.70-accessCost(accessRooms[0])):0;
    const study=anchor ? .36*quiet+.39*(1-clamp(anchorGap/.60))+.25*accessScore : .64*quiet+.36*accessScore;
    const score=spec.kind==='study' ? study : quiet;
    return {id,score,nearest:nearest?.id||null,gap,walls,hops,end,neighbors,access,publicAccess,anchorGap};
  }

  function sites(m,spec){
    const existing=m.byId.get(spec.target);
    if(existing?.locked)return [evidence(m,existing.id,spec)];
    let available=m.rooms.filter(r=>r.pts?.length&&!r.locked&&siteTypes.includes(r.type));
    // With traced bedrooms available, compare sleeping or flexible rooms before public zones.
    if(spec.kind==='quiet'){
      const sleeping=available.filter(r=>['bedroom','study','other'].includes(r.type));
      if(sleeping.length)available=sleeping;
    }
    if(spec.kind==='study'&&available.some(r=>r.id!==spec.anchor))available=available.filter(r=>r.id!==spec.anchor);
    return available.map(r=>evidence(m,r.id,spec)).sort((a,b)=>b.score-a.score);
  }

  function evaluate(m,specs){
    return specs.filter(s=>m.byId.has(s.target)).map(s=>{
      const measured=evidence(m,s.target,s),result={...measured,kind:s.kind,anchor:s.anchor};
      if(s.kind==='quiet'){
        const peers=m.rooms.filter(r=>r.type==='bedroom'&&r.pts?.length);
        result.bedroomCount=peers.length;
        result.quietRank=1+peers.filter(r=>r.id!==s.target&&evidence(m,r.id,s).score>measured.score+1e-6).length;
      }
      return result;
    });
  }
  return {parse,model,evidence,sites,evaluate,accessTypes,noiseTypes};
})();

