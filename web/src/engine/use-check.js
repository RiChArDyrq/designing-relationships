/* ===== use check: beds, door swings, wardrobes and walking routes inside bedrooms =====
 * Pure module (no DOM, no app state). Units: plan pixels in, metres via `scale` (m/px).
 * Main bedroom : bed 1.8 (fallback 1.5) × 2.0 m, 0.6 m on both sides, wardrobe 0.6 × 1.2 m with 0.8 m in front.
 * Other bedrooms: bed 1.2 (fallback 0.9) × 2.0 m, 0.6 m on at least one side.
 * Every bedside strip used must be reachable from a door along a 0.6 m-wide route that avoids
 * the bed and the door-leaf swing. Area guard: 0.7–1.5 × the room's target area.
 * Sizes are prototype defaults, not building-code values.
 */
const USE=(()=>{
  const REQ={
    master:{beds:[1.8,1.5],len:2.0,both:true,wardrobe:true},
    secondary:{beds:[1.2,0.9],len:2.0,both:false,wardrobe:false}
  };
  const SIDE=.6,FOOT=.6,WARD_D=.6,WARD_W=1.2,WARD_FRONT=.8,PERSON=.6,GRID=.1;
  const AREA_MIN=.7,AREA_MAX=1.5;
  // Issues that make a bedroom fail. 'wardrobe' and 'smaller' (fallback bed width) are warnings.
  const BLOCKING=['bed','path','access','door','area'];
  // Same wording the generator uses for a primary bedroom, plus plain "master".
  const isMasterName=n=>/(主卧|主臥|主人房|\bmaster\b|\b(?:primary|principal|main)[\s_-]+(?:bed(?:room)?|suite)\b)/iu.test(n||'');
  const looksBedroom=n=>/bed|卧|nursery|保育|儿童|guest|客房/i.test(n||'');
  function inP(p,P){let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const[xi,yi]=P[i],[xj,yj]=P[j];if(((yi>p[1])!==(yj>p[1]))&&(p[0]<(xj-xi)*(p[1]-yi)/(yj-yi)+xi))c=!c}return c}
  function segD(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],L=dx*dx+dy*dy;let t=L?((p[0]-a[0])*dx+(p[1]-a[1])*dy)/L:0;t=Math.max(0,Math.min(1,t));return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy)}
  function polyD(p,P){let m=Infinity;for(let i=0;i<P.length;i++)m=Math.min(m,segD(p,P[i],P[(i+1)%P.length]));return m}
  function areaOf(P){let a=0;for(let i=0;i<P.length;i++){const[x1,y1]=P[i],[x2,y2]=P[(i+1)%P.length];a+=x1*y2-x2*y1}return Math.abs(a)/2}
  function roles(rooms){
    const beds=rooms.filter(r=>r.type==='bedroom');const out={};
    const named=beds.filter(r=>isMasterName(r.name));
    let master=named[0]||null,inferred=false;
    if(!master&&beds.length>1){master=beds.reduce((a,b)=>areaOf(b.pts)>areaOf(a.pts)?b:a);inferred=true}
    beds.forEach(r=>out[r.id]=r===master?'master':'secondary');
    out.__inferred=inferred?master.id:null;
    return out;
  }
  // integral image helper
  function integral(mask,nx,ny){const I=new Int32Array((nx+1)*(ny+1));
    for(let y=0;y<ny;y++){let row=0;for(let x=0;x<nx;x++){row+=mask[y*nx+x];I[(y+1)*(nx+1)+x+1]=I[y*(nx+1)+x+1]+row}}
    return (x,y,w,h)=>{if(x<0||y<0||x+w>nx||y+h>ny)return w*h;const W=nx+1;return I[(y+h)*W+x+w]-I[y*W+x+w]-I[(y+h)*W+x]+I[y*W+x]}}
  function checkRoom(room,doors,scale,role,opt){
    const req=Object.assign({},REQ[role]);
    if(role==='master'&&opt&&opt.masterBed)req.beds=[opt.masterBed].concat(req.beds.filter(w=>w<opt.masterBed));
    if(role==='master'&&opt&&opt.wardrobe===false)req.wardrobe=false;
    if(role==='master'&&opt&&opt.both===false)req.both=false;
    const P=room.pts;let best=0,ang=0;
    for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length],L=Math.hypot(b[0]-a[0],b[1]-a[1]);if(L>best){best=L;ang=Math.atan2(b[1]-a[1],b[0]-a[0])}}
    const c=Math.cos(ang),s=Math.sin(ang);
    const toL=([x,y])=>[x*c+y*s,-x*s+y*c],toP=([x,y])=>[x*c-y*s,x*s+y*c];
    const L=P.map(toL),g=GRID/scale;
    let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;L.forEach(([x,y])=>{x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y)});
    const nx=Math.max(1,Math.round((x1-x0)/g)),ny=Math.max(1,Math.round((y1-y0)/g)),N=nx*ny;
    const gx=(x1-x0)/nx,gy=(y1-y0)/ny,cc=(i,j)=>[x0+(i+.5)*gx,y0+(j+.5)*gy];
    const inside=new Uint8Array(N);for(let j=0;j<ny;j++)for(let i=0;i<nx;i++)inside[j*nx+i]=inP(cc(i,j),L)?1:0;
    // door swing squares (local cells), drawn arcs in plan coords
    const swing=new Uint8Array(N),arcs=[],starts=[];
    const myDoors=doors.filter(d=>d.ra===room.id||d.rb===room.id);
    for(const d of myDoors){
      const a=toL(d.a),b=toL(d.b),len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(len<1e-6)continue;
      const u=[(b[0]-a[0])/len,(b[1]-a[1])/len];let n=[-u[1],u[0]];
      const mid=[(a[0]+b[0])/2,(a[1]+b[1])/2];
      if(!inP([mid[0]+n[0]*len*.3,mid[1]+n[1]*len*.3],L))n=[-n[0],-n[1]];
      const open=d.kind==='opening',depth=open?Math.min(len,PERSON/scale):len;
      for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const p=cc(i,j),dx=p[0]-a[0],dy=p[1]-a[1],t=dx*u[0]+dy*u[1],q=dx*n[0]+dy*n[1];
        if(t>=-gx*.5&&t<=len+gx*.5&&q>=-gx&&q<=depth){swing[j*nx+i]=1;if(q<=Math.max(gx*2,PERSON/scale*.6)&&inside[j*nx+i])starts.push(j*nx+i)}}
      if(!open){const pts=[];for(let k=0;k<=10;k++){const t=k/10*Math.PI/2;pts.push(toP([a[0]+len*(Math.cos(t)*u[0]+Math.sin(t)*n[0]),a[1]+len*(Math.cos(t)*u[1]+Math.sin(t)*n[1])]))}
        arcs.push({hinge:toP(a),leaf:toP([a[0]+n[0]*len,a[1]+n[1]*len]),pts})}
    }
    const outside=new Uint8Array(N),blocked=new Uint8Array(N);
    for(let k=0;k<N;k++){outside[k]=inside[k]?0:1;blocked[k]=outside[k]||swing[k]}
    const sumO=integral(outside,nx,ny),sumB=integral(blocked,nx,ny);
    const cells=m=>Math.max(1,Math.round(m/scale/gx)),cellsY=m=>Math.max(1,Math.round(m/scale/gy));
    const rect2plan=(i,j,w,h)=>[[i,j],[i+w,j],[i+w,j+h],[i,j+h]].map(([a,b])=>toP([x0+a*gx,y0+b*gy]));
    const doorMid=myDoors.length?toL([(myDoors[0].a[0]+myDoors[0].b[0])/2,(myDoors[0].a[1]+myDoors[0].b[1])/2]):null;
    let found=null;
    for(const bw of req.beds){
      const opts=[];
      for(const vert of [true,false]){
        const W=vert?cells(bw):cells(req.len),H=vert?cellsY(req.len):cellsY(bw);
        const sx=cells(SIDE),sy=cellsY(SIDE);
        for(let j=0;j+H<=ny;j++)for(let i=0;i+W<=nx;i++){
          if(sumB(i,j,W,H))continue;
          // head against a wall on one short side
          const heads=[];
          if(vert){if(sumO(i,j-1,W,1)>=W*.8)heads.push('top');if(sumO(i,j+H,W,1)>=W*.8)heads.push('bottom')}
          else{if(sumO(i-1,j,1,H)>=H*.8)heads.push('left');if(sumO(i+W,j,1,H)>=H*.8)heads.push('right')}
          if(!heads.length)continue;
          const sides=vert?[[i-sx,j,sx,H],[i+W,j,sx,H]]:[[i,j-sy,W,sy],[i,j+H,W,sy]];
          const okSide=sides.map(r=>sumO(...r)===0);
          const nOk=okSide.filter(Boolean).length;
          if(nOk<(req.both?2:1))continue;
          const head=heads[0];
          const foot=vert?(head==='top'?[i,j+H,W,cellsY(FOOT)]:[i,j-cellsY(FOOT),W,cellsY(FOOT)]):(head==='left'?[i+W,j,cells(FOOT),H]:[i-cells(FOOT),j,cells(FOOT),H]);
          const footOk=sumO(...foot)===0;
          const ctr=[x0+(i+W/2)*gx,y0+(j+H/2)*gy];
          const far=doorMid?Math.hypot(ctr[0]-doorMid[0],ctr[1]-doorMid[1]):0;
          opts.push({i,j,W,H,vert,head,sides,okSide,nOk,foot,footOk,score:(nOk===2?40:0)+(footOk?15:0)+far*scale*4});
        }
      }
      opts.sort((a,b)=>b.score-a.score);
      for(const o of opts.slice(0,40)){
        // free floor for walking: inside and not bed; require person clearance via erosion
        const free=new Uint8Array(N);for(let k=0;k<N;k++)free[k]=inside[k];
        for(let y=o.j;y<o.j+o.H;y++)for(let x=o.i;x<o.i+o.W;x++)free[y*nx+x]=0;
        const notFree=new Uint8Array(N);for(let k=0;k<N;k++)notFree[k]=free[k]?0:1;
        const sumNF=integral(notFree,nx,ny),r=Math.max(1,Math.round(PERSON/2/scale/gx))-1;
        const walk=k=>{const x=k%nx,y=(k/nx)|0;return sumNF(x-r,y-r,2*r+1,2*r+1)===0};
        const target=new Uint8Array(N);
        o.sides.forEach((sr,si)=>{if(!o.okSide[si])return;const[sx0,sy0,sw,sh]=sr;for(let y=sy0;y<sy0+sh;y++)for(let x=sx0;x<sx0+sw;x++)if(x>=0&&y>=0&&x<nx&&y<ny)target[y*nx+x]=si+1});
        const prev=new Int32Array(N).fill(-2),q=[];
        starts.forEach(k=>{if(free[k]&&walk(k)&&prev[k]===-2){prev[k]=-1;q.push(k)}});
        if(!myDoors.length){found={o,bw,path:null,reached:[],note:'no-door'};break}
        const reached=new Set();let endK=-1;
        for(let h=0;h<q.length;h++){const k=q[h];if(target[k]){reached.add(target[k]);if(endK<0)endK=k}
          const x=k%nx,y=(k/nx)|0;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=nx||Y>=ny)continue;const m=Y*nx+X;if(prev[m]!==-2||!free[m]||!walk(m))continue;prev[m]=k;q.push(m)}}
        if(endK<0)continue;
        const path=[];for(let k=endK;k>=0;k=prev[k]){const x=k%nx,y=(k/nx)|0;path.push(toP(cc(x,y)))}
        path.reverse();
        found={o,bw,path,reached:[...reached],pathLen:(path.length-1)*GRID};break;
      }
      if(found)break;
    }
    const res={id:room.id,name:room.name,role,req,arcs,issues:[],area:areaOf(P)*scale*scale};
    // Area guard: a bed that fits only because the room grew (or shrank) far from its target does not count.
    const target=opt&&opt.targets&&opt.targets[room.id];
    if(target>0){res.ratio=areaOf(P)/target;if(res.ratio<AREA_MIN||res.ratio>AREA_MAX)res.issues.push('area')}
    const lw=(x1-x0)*scale,lh=(y1-y0)*scale;res.size=[Math.min(lw,lh),Math.max(lw,lh)];
    if(!found){res.ok=false;res.issues.push('bed');return res}
    const o=found.o;
    res.bed={pts:rect2plan(o.i,o.j,o.W,o.H),width:found.bw};
    res.sides=o.sides.map((sr,k)=>o.okSide[k]?rect2plan(...sr):null).filter(Boolean);
    res.access=found.reached.length>=2?'both':found.reached.length===1?'one':'none';
    res.path=found.path;res.pathLen=found.pathLen;
    res.footOk=o.footOk;
    // wardrobe: back against wall, not on bed/side strips/swing, front clearance free
    if(req.wardrobe||role==='secondary'){
      const occ=new Uint8Array(N);for(let k=0;k<N;k++)occ[k]=blocked[k];
      const mark=(i,j,w,h)=>{for(let y=j;y<j+h;y++)for(let x=i;x<i+w;x++)if(x>=0&&y>=0&&x<nx&&y<ny)occ[y*nx+x]=1};
      mark(o.i,o.j,o.W,o.H);o.sides.forEach((sr,k)=>{if(o.okSide[k])mark(...sr)});
      const sumOcc=integral(occ,nx,ny);let w=null;
      for(const vert of [false,true]){if(w)break;
        const W=vert?cells(WARD_D):cells(WARD_W),H=vert?cellsY(WARD_W):cellsY(WARD_D);
        for(let j=0;j+H<=ny&&!w;j++)for(let i=0;i+W<=nx&&!w;i++){
          if(sumOcc(i,j,W,H))continue;
          const fronts=vert?[[sumO(i-1,j,1,H)>=H*.8,[i+W,j,cells(WARD_FRONT),H]],[sumO(i+W,j,1,H)>=H*.8,[i-cells(WARD_FRONT),j,cells(WARD_FRONT),H]]]
                           :[[sumO(i,j-1,W,1)>=W*.8,[i,j+H,W,cellsY(WARD_FRONT)]],[sumO(i,j+H,W,1)>=W*.8,[i,j-cellsY(WARD_FRONT),W,cellsY(WARD_FRONT)]]];
          for(const[wall,fr]of fronts)if(wall&&sumO(...fr)===0){w={pts:rect2plan(i,j,W,H)};break}
        }}
      res.wardrobe=w;
    }
    if(!myDoors.length)res.issues.push('door');
    if(req.both&&res.access!=='both')res.issues.push('access');
    if(res.access==='none'&&myDoors.length)res.issues.push('path');
    if(req.wardrobe&&!res.wardrobe)res.issues.push('wardrobe');
    if(res.bed.width<req.beds[0])res.issues.push('smaller');
    res.ok=!res.issues.some(x=>BLOCKING.includes(x));
    return res;
  }
  function check(rooms,doors,scale,opt){
    if(!(scale>0))return null;
    const R=roles(rooms),out=[];
    rooms.forEach(r=>{if(R[r.id]&&r.pts&&r.pts.length>2){const x=checkRoom(r,doors,scale,R[r.id],opt||{});x.inferred=R.__inferred===r.id;out.push(x)}});
    const warn=rooms.filter(r=>r.type!=='bedroom'&&looksBedroom(r.name)).map(r=>r.name);
    return {rooms:out,ok:out.every(x=>x.ok),score:out.reduce((s,x)=>s+(x.ok?0:1)+(x.issues.includes('wardrobe')?.3:0)+(x.issues.includes('smaller')?.3:0),0),warn};
  }
  // annotated plans: doors carry geometry only, so find the rooms each door touches
  function attach(rooms,doors,tolPx){
    return doors.map(d=>{const m=[(d.a[0]+d.b[0])/2,(d.a[1]+d.b[1])/2];
      const hits=rooms.map(r=>({id:r.id,dd:inP(m,r.pts)?0:polyD(m,r.pts)})).filter(h=>h.dd<=tolPx).sort((a,b)=>a.dd-b.dd);
      return Object.assign({},d,{ra:hits[0]?hits[0].id:null,rb:hits[1]?hits[1].id:'EXT'})});
  }

  // Rank generator candidates. GEN.select refines and de-duplicates, so ask it for a wider
  // diverse set (3 × n), check every refined layout, then put passing layouts first while
  // keeping the generator's order inside each group.
  function selectWithUse(GEN,pool,n,P,scale,opt){
    if(!(scale>0)||!pool.length){const options=GEN.select(pool,n,P);options.forEach(c=>c.use=null);return {options,stats:null}}
    const targets={};(P.R||[]).forEach(r=>{if(r&&r.id!=null&&r.target>0)targets[r.id]=r.target});
    const o=Object.assign({},opt||{},{targets});
    const wide=GEN.select(pool,Math.max(n,n*3),P);
    wide.forEach((c,i)=>{c.use=check(c.rooms,c.doors,scale,o);c.__order=i});
    const pass=wide.filter(c=>c.use.ok);
    const options=wide.slice().sort((a,b)=>Number(!b.use.ok)-Number(!a.use.ok)===0?a.__order-b.__order:Number(!a.use.ok)-Number(!b.use.ok)).slice(0,n);
    options.forEach((c,i)=>{c.label=String.fromCharCode(65+i);delete c.__order});
    const areaOnly=wide.filter(c=>!c.use.ok&&c.use.rooms.every(r=>r.issues.every(x=>x==='area'||!BLOCKING.includes(x)))).length;
    return {options,stats:{checked:wide.length,pass:pass.length,areaOnly}};
  }
  return {check,attach,roles,selectWithUse,REQ,AREA_MIN,AREA_MAX,BLOCKING};
})();
/* ===== end use check ===== */
