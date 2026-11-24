/* ---------- graph + metrics ---------- */
function codes(){const n={},tot={},out={};S.rooms.forEach(r=>tot[r.type]=(tot[r.type]||0)+1);
 S.rooms.forEach(r=>{n[r.type]=(n[r.type]||0)+1;out[r.id]=TY[r.type].code+(tot[r.type]>1?n[r.type]:'')});return out}
function buildGraph(){
 const edges=[],warn=[];let ext=false;
 for(const d of S.doors){const m=[(d.a[0]+d.b[0])/2,(d.a[1]+d.b[1])/2];
  const hits=S.rooms.map(r=>({r,dd:inPoly(m,r.pts)?0:dPoly(m,r.pts)})).filter(h=>h.dd<=tol).sort((a,b)=>a.dd-b.dd);
  const lab=d.kind==='door'?'门':'开口';
  if(!hits.length){warn.push(`一处${lab}没有接触任何房间（可调大容差、移动或删除它）`);continue}
  if(hits.length>2)warn.push(`一处${lab}同时接触 ${hits.length} 个房间，已取最近的两个`);
  const a=hits[0].r.id,b=hits[1]?hits[1].r.id:'EXT';if(b==='EXT')ext=true;
  edges.push({a,b,kind:d.kind,m,id:d.id});
 }
 const ids=S.rooms.map(r=>r.id);if(ext)ids.push('EXT');
 return{ids,edges,warn};
}
function dval(k){return k<=3?null:2*(k*(Math.log2((k+2)/3)-1)+1)/((k-1)*(k-2))}
function analyze(){
 const g=buildGraph();const adj=new Map(g.ids.map(i=>[i,new Set()]));
 g.edges.forEach(e=>{if(e.a!==e.b){adj.get(e.a).add(e.b);adj.get(e.b).add(e.a)}});
 const bfs=s=>{const d=new Map([[s,0]]),q=[s];while(q.length){const u=q.shift();for(const v of adj.get(u))if(!d.has(v)){d.set(v,d.get(u)+1);q.push(v)}}return d};
 const ent=S.rooms.find(r=>r.type==='entrance');
 const root=adj.has('EXT')?'EXT':(ent||S.rooms[0]||{}).id;
 const per={};if(!root)return{...g,adj,per,root:null};
 const dr=bfs(root);
 for(const i of g.ids){const d=bfs(i),k=d.size;let td=0;d.forEach(v=>td+=v);const md=k>1?td/(k-1):0;
  const ra=k>2?2*(md-1)/(k-2):null,D=dval(k),rra=(ra!=null&&D)?ra/D:null;
  per[i]={depth:dr.has(i)?dr.get(i):null,conn:adj.get(i).size,integ:rra===null?null:(rra===0?Infinity:1/rra)}}
 let E=0;adj.forEach(s=>E+=s.size);E/=2;
 const seen=new Set();let C=0;for(const i of g.ids)if(!seen.has(i)){C++;bfs(i).forEach((v,n)=>seen.add(n))}
 const reach=[...dr.entries()].filter(([n])=>n!==root).map(x=>x[1]);
 const unreached=g.ids.filter(i=>!dr.has(i));
 if(unreached.length&&S.rooms.length)g.warn.push(`${unreached.length} 个空间无法从${root==='EXT'?'室外':'根节点'}到达：检查是否漏画了门`);
 if(!adj.has('EXT')&&S.rooms.length)g.warn.push('还没有通往室外的门：层级图暂以入口或第一个房间为根');
 return{...g,adj,per,root,dr,sum:{n:g.ids.length,E,rings:E-g.ids.length+C,maxd:reach.length?Math.max(...reach):0}};
}

