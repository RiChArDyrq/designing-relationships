// Use-check tests. Rooms in plan pixels at 1 px = 1 cm unless noted.
const sq=(id,name,x,y,w,h)=>({id,name,type:'bedroom',pts:[[x,y],[x+w,y],[x+w,y+h],[x,y+h]]});
const door=(id,room,a,b)=>({id,kind:'door',a,b,ra:room,rb:'C'});
const one=(room,d,opt)=>USE.check([room],d?[d]:[],.01,opt||{}).rooms[0];

test('use: 4×4 m main bedroom passes (1.8 m bed, both sides, wardrobe)', ()=>{
  const r=one(sq('m','Master Bedroom',0,0,400,400),door('d','m',[300,400],[390,400]));
  assert(r.role==='master'&&r.ok,'should pass: '+r.issues);
  assert(r.bed.width===1.8&&r.access==='both'&&r.wardrobe,'bed '+(r.bed&&r.bed.width)+' access '+r.access);
});
test('use: 2.0×2.6 m main bedroom fails (needs 1.5 + 2×0.6 = 2.7 m)', ()=>{
  const r=one(sq('m','Master Bedroom',0,0,200,260),door('d','m',[110,260],[190,260]));
  assert(!r.ok&&r.issues.includes('bed'),'issues '+r.issues);
});
test('use: 2.4×3.0 m secondary bedroom passes with a 1.2 m bed', ()=>{
  const r=one(sq('s','Bedroom 2',0,0,240,300),door('d','s',[150,300],[230,300]));
  assert(r.role==='secondary'&&r.ok&&r.bed.width===1.2,'issues '+r.issues);
});
test('use: area guard fails a room at 2.5× its target', ()=>{
  const r=one(sq('m','Master Bedroom',0,0,400,400),door('d','m',[300,400],[390,400]),{targets:{m:400*400/2.5}});
  assert(!r.ok&&r.issues.includes('area')&&Math.abs(r.ratio-2.5)<1e-9,'issues '+r.issues);
});
test('use: a bedroom without a door fails', ()=>{
  const r=one(sq('s','Bedroom 2',0,0,300,300),null);
  assert(!r.ok&&r.issues.includes('door'),'issues '+r.issues);
});
test('use: bed stays out of the door-leaf swing', ()=>{
  const r=one(sq('m','Master Bedroom',0,0,400,400),door('d','m',[300,400],[390,400]));
  const xs=r.bed.pts.map(p=>p[0]),ys=r.bed.pts.map(p=>p[1]);
  assert(r.arcs.length===1,'one swing arc expected');
  assert(!(Math.max(...xs)>300&&Math.min(...xs)<390&&Math.max(...ys)>310&&Math.min(...ys)<400),'bed overlaps the swing');
});
test('use: only the largest of several unnamed bedrooms is treated as main', ()=>{
  const u=USE.check([sq('a','Bedroom A',0,0,300,300),sq('b','Bedroom B',400,0,400,400)],[],.01,{});
  const roles=Object.fromEntries(u.rooms.map(r=>[r.id,r.role]));
  assert(roles.b==='master'&&roles.a==='secondary','roles '+JSON.stringify(roles));
});
// Samara bedrooms: clear sizes measured from the plan image (4 ft = 52 px, ±0.1 m). Door positions are assumed.
test('use: Samara bedrooms at measured size all pass', ()=>{
  const rooms=[sq('n','Nursery',0,0,320,420),sq('m','Master Bedroom',500,0,440,310),sq('g','Guest Bedroom',1000,0,400,280)];
  const doors=[door('dn','n',[230,420],[310,420]),door('dm','m',[850,310],[930,310]),door('dg','g',[1310,280],[1390,280])];
  const u=USE.check(rooms,doors,.01,{});
  assert(u.ok,'failing: '+u.rooms.filter(r=>!r.ok).map(r=>r.name+':'+r.issues).join(', '));
});
test('use: Lanai ranking puts passing layouts first', ()=>{
  const {P,pool}=runFixture('lanai',16,1500,6);
  const res=USE.selectWithUse(GEN,pool,6,P,FIXTURES.lanai.scale_m_per_px,{});
  const flags=res.options.map(c=>c.use.ok);
  assert(flags.indexOf(false)<0||flags.lastIndexOf(true)<flags.indexOf(false),'order '+flags);
  assert(res.options.every(c=>c.use.rooms.length===2),'two bedrooms expected in every option');
});
function lanaiUseSummary(){
  const {P,pool}=runFixture('lanai',16,1500,6);
  const res=USE.selectWithUse(GEN,pool,6,P,FIXTURES.lanai.scale_m_per_px,{});
  return {stats:res.stats,options:res.options.map(c=>({label:c.label,ok:c.use.ok,
    bedrooms:c.use.rooms.map(r=>({name:r.name,role:r.role,ok:r.ok,bed:r.bed?r.bed.width:null,access:r.access||null,wardrobe:!!r.wardrobe,issues:r.issues.slice().sort(),ratio:r.ratio?+r.ratio.toFixed(2):null}))}))};
}
