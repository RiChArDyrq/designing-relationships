// Engine tests. Plain JavaScript so they run in any JS engine.
// Globals from the runner: GEN + geometry helpers (src/engine/*), FIXTURES, test(name, fn), assert(cond, msg).
function inputFrom(fx){
  return {rooms: fx.rooms.map(([id,name,type,pts])=>({id,name,type,pts,locked:false,original:labelPt(pts),seed:labelPt(pts),target:Math.abs(area(pts))})),
          edges: fx.edges.map(([a,b,kind,hard])=>({a,b,kind,hard})), scale: fx.scale_m_per_px, doorPx: .9/fx.scale_m_per_px};
}
var __cache={};
function runFixture(name,trials,iters,n){
  const key=[name,trials,iters,n].join('/');if(__cache[key])return __cache[key];
  const P=GEN.prepare(inputFrom(FIXTURES[name])),pool=[];
  for(let i=0;i<trials;i++){const c=GEN.search(P,i,iters,1);if(c)pool.push(c)}
  return __cache[key]={P,pool,sel:GEN.select(pool,n,P)};
}
function lanaiSummary(){
  const {pool,sel}=runFixture('lanai',16,1500,6);
  return {pool:pool.length,options:sel.map(c=>({label:c.label,satisfied:c.satisfied,total:c.total,missing:c.missing.slice().sort(),areaErr:+c.areaErr.toFixed(3)}))};
}
test('geometry: unit square', ()=>{
  const sq=[[0,0],[1,0],[1,1],[0,1]];
  assert(Math.abs(Math.abs(area(sq))-1)<1e-9,'area should be 1');
  assert(inPoly([.5,.5],sq)&&!inPoly([1.5,.5],sq),'inPoly');
  assert(Math.abs(dist([0,0],[3,4])-5)<1e-9,'dist');
});
test('lanai: generator returns at least 4 options', ()=>{
  const {sel}=runFixture('lanai',16,1500,6);assert(sel.length>=4,'got '+sel.length);
});
test('lanai: required (hard) relationships are always kept', ()=>{
  const {sel}=runFixture('lanai',16,1500,6);
  const hard=FIXTURES.lanai.edges.filter(e=>e[3]).map(([a,b])=>a<b?a+'|'+b:b+'|'+a);
  for(const c of sel)for(const k of hard)assert(!c.missing.includes(k),'option '+c.label+' lost required edge '+k);
});
test('lanai: every option keeps the same set of rooms', ()=>{
  const {sel}=runFixture('lanai',16,1500,6);const ids=FIXTURES.lanai.rooms.map(r=>r[0]).sort().join(',');
  for(const c of sel)assert(c.rooms.map(r=>r.id).sort().join(',')===ids,'option '+c.label+' changed the room list');
});
