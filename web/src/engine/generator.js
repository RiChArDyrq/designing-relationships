const GEN = (() => {
  const EPS = 1e-6;
  const length = (a,b) => Math.hypot(a[0]-b[0],a[1]-b[1]);
  const cross = (a,b,c) => (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
  const pointKey = p => p.map(x=>Math.round(x*1e5)).join(',');
  const unique = xs => [...new Set(xs)].sort((a,b)=>a-b);
  function random(seed) {
    let state=seed>>>0 || 1;
    return () => {state^=state<<13;state^=state>>>17;state^=state<<5;return (state>>>0)/4294967296};
  }
  function corners(points) {
    const p=points.filter((a,i)=>length(a,points[(i+1)%points.length])>EPS);
    const out=p.filter((a,i)=>{
      const prev=p[(i+p.length-1)%p.length], next=p[(i+1)%p.length];
      return Math.abs(cross(prev,a,next))>EPS*Math.max(1,length(prev,next));
    });
    return area(out)<0 ? out.reverse() : out;
  }
  function outlineIssue(poly,allowSteps=false) {
    if(poly.length<3 || area(poly)<=EPS || new Set(poly.map(pointKey)).size!==poly.length) return 'degenerate';
    const n=poly.length;
    let wallIssue=null;
    for(let i=0;i<n;i++){
      const a=poly[(i+n-1)%n], b=poly[i], c=poly[(i+1)%n];
      const cos=((a[0]-b[0])*(c[0]-b[0])+(a[1]-b[1])*(c[1]-b[1]))/(length(a,b)*length(c,b));
      if(cross(a,b,c)>0 && cos>=0.5-1e-9) wallIssue='angle';
      // An isolated L setback has one reflex turn. A staircase repeats that turn.
      let xSign=0,ySign=0,stair=true;
      for(let j=0;j<4;j++){
        const p=poly[(i+j)%n],q=poly[(i+j+1)%n];
        const dx=q[0]-p[0],dy=q[1]-p[1];
        if(Math.abs(dx)>EPS && Math.abs(dy)>EPS){stair=false;break}
        if(xSign*dx < -EPS || ySign*dy < -EPS){stair=false;break}
        if(Math.abs(dx)>EPS)xSign=Math.sign(dx);
        if(Math.abs(dy)>EPS)ySign=Math.sign(dy);
      }
      if(!allowSteps && stair && cross(poly[i],poly[(i+1)%n],poly[(i+2)%n])<0 &&
         cross(poly[(i+2)%n],poly[(i+3)%n],poly[(i+4)%n])<0) wallIssue=wallIssue||'stairs';
      for(let j=i+2;j<n;j++){
        if(i===0 && j===n-1) continue;
        const u=poly[j],v=poly[(j+1)%n];
        if(dSeg(u,b,c)<EPS || dSeg(v,b,c)<EPS || dSeg(b,u,v)<EPS || dSeg(c,u,v)<EPS){
          // Here b->c is edge i; a nonadjacent touch would create a pinched room.
          return 'crossing';
        }
        if(cross(b,c,u)*cross(b,c,v)<0 && cross(u,v,b)*cross(u,v,c)<0)return 'crossing';
      }
    }
    return wallIssue;
  }
  const valid=poly=>!outlineIssue(poly);
  const axisAligned=pts=>pts.every((p,i)=>{
    const q=pts[(i+1)%pts.length];
    return Math.min(Math.abs(q[0]-p[0]),Math.abs(q[1]-p[1]))<=EPS;
  });
  function requireOutline(r,poly,allowSteps=false) {
    const issue=outlineIssue(poly,allowSteps);
    if(!issue)return;
    const reason={degenerate:'轮廓退化或顶点重复',angle:'含有不大于 60° 的内角',
      stairs:'含有连续的阶梯墙',crossing:'存在交叉或自接触的边'}[issue];
    throw Error('请检查「'+(r.name||r.id)+'」：'+reason+'。');
  }
  function closeOutline(raw,candidate,limit) {
    // Bound changes in both area and outline, including details removed from the trace.
    return candidate.length>=3 && Math.abs(area(candidate)-area(raw))<=Math.abs(area(raw))*.045 &&
      [[raw,candidate],[candidate,raw]].every(([a,b])=>a.every(p=>dPoly(p,b)<=limit+EPS));
  }
  // Hand-traced rectangles often contain tiny tap errors. Fit whole wall runs
  // on working copies, with a maximum displacement and an explicit area bound.
  function fitTrace(points,tol) {
    const raw=corners(points);
    if(axisAligned(raw))return null;
    const box=bounds(raw),shortSide=Math.min(box[2]-box[0],box[3]-box[1]);
    const limit=Math.min(tol,shortSide*.06);
    if(!(limit>EPS)||raw.length<3)return null;
    function project(poly) {
      const n=poly.length,axes=[],out=poly.map(p=>p.slice());
      if(n<4)return null;
      for(let i=0;i<n;i++){
        const p=poly[i],q=poly[(i+1)%n],dx=Math.abs(q[0]-p[0]),dy=Math.abs(q[1]-p[1]);
        if(Math.min(dx,dy)>Math.max(dx,dy)*.12 || Math.min(dx,dy)>limit*2)return null;
        axes.push(dx>dy?1:0); // coordinate held constant along this wall
      }
      const first=axes.findIndex((a,i)=>a!==axes[(i+n-1)%n]);if(first<0)return null;
      for(let used=0;used<n;){
        const start=used,axis=axes[(first+used)%n];
        while(used<n&&axes[(first+used)%n]===axis)used++;
        const ids=Array.from({length:used-start+1},(_,k)=>(first+start+k)%n);
        const values=ids.map(i=>poly[i][axis]),low=Math.min(...values),high=Math.max(...values);
        if(high-low>2*limit)return null;
        const mid=(low+high)/2;
        for(const i of ids)out[i][axis]=mid;
      }
      const candidate=corners(out);
      return candidate.length>=4 && closeOutline(raw,candidate,limit)?candidate:null;
    }
    const direct=project(raw);
    if(direct)return direct;
    return project(simplifyClosed(raw,limit*.85));
  }
  function bounds(p) {
    const xs=p.map(v=>v[0]),ys=p.map(v=>v[1]);
    return [Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];
  }
  // Find contained rectangles in the main wall directions. In each horizontal
  // band, the intersection of the top and bottom intervals is safe throughout.
  function roomProfile(P,poly) {
    if(P.profiles.has(poly))return P.profiles.get(poly);
    const surface=area(poly),directions=new Map();
    let returns=0;
    for(let i=0;i<poly.length;i++){
      const p=poly[i],q=poly[(i+1)%poly.length],r=poly[(i+2)%poly.length];
      if(cross(p,q,r)<-EPS)returns++;
      let angle=Math.atan2(q[1]-p[1],q[0]-p[0])%(Math.PI/2);
      if(angle<0)angle+=Math.PI/2;
      if(angle>Math.PI/2-1e-7)angle=0;
      const key=Math.round(angle*10000),prev=directions.get(key);
      directions.set(key,{angle,total:(prev?.total||0)+length(p,q)});
    }
    const axes=[...directions.values()].sort((a,b)=>b.total-a.total).slice(0,3);
    let bestArea=0,shortSide=0,longSide=0;
    const rectangles=[];
    for(const {angle} of axes){
      const cos=Math.cos(angle),sin=Math.sin(angle);
      const p=poly.map(([x,y])=>[cos*x+sin*y,-sin*x+cos*y]);
      const b=bounds(p);
      let ys=p.map(v=>v[1]);
      if(!axisAligned(p))for(let i=1;i<12;i++)ys.push(b[1]+(b[3]-b[1])*i/12);
      ys=unique(ys).filter((v,i,a)=>!i||v-a[i-1]>EPS);
      const bands=[];
      for(let k=1;k<ys.length;k++){
        const lo=ys[k-1],hi=ys[k],mid=(lo+hi)/2,hits=[];
        for(let i=0;i<p.length;i++){
          const a=p[i],z=p[(i+1)%p.length];
          if((a[1]>mid)===(z[1]>mid))continue;
          const at=y=>a[0]+(z[0]-a[0])*(y-a[1])/(z[1]-a[1]);
          hits.push([at(mid),at(lo),at(hi)]);
        }
        hits.sort((a,b)=>a[0]-b[0]);
        const band=[];
        for(let i=1;i<hits.length;i+=2){
          const x0=Math.max(hits[i-1][1],hits[i-1][2]),x1=Math.min(hits[i][1],hits[i][2]);
          if(x1>x0+EPS)band.push([x0,x1]);
        }
        bands.push(band);
      }
      const covers=(band,x,z)=>band?.some(([a,b])=>a<=x+EPS&&b>=z-EPS);
      for(let start=0;start<bands.length;start++){
        let runs=bands[start];
        for(let end=start;runs.length&&end<bands.length;end++){
          const next=bands[end+1],overlap=[];
          for(const [x,z] of runs){
            if(!covers(bands[start-1],x,z)&&!covers(next,x,z)){
              const w=z-x,h=ys[end+1]-ys[start];
              rectangles.push({x,y:ys[start],w,h,cos,sin});
              if(w*h>bestArea){bestArea=w*h;shortSide=Math.min(w,h);longSide=Math.max(w,h)}
            }
            if(next)for(const [l,r] of next){const a=Math.max(x,l),b=Math.min(z,r);if(b>a+EPS)overlap.push([a,b])}
          }
          runs=overlap;
        }
      }
    }
    rectangles.sort((a,b)=>b.w*b.h-a.w*a.h);
    const share=Math.min(1,bestArea/surface),aspect=longSide/Math.max(shortSide,EPS);
    // A thin projecting tail can have very little area but reach far beyond
    // the usable rectangle. Measure that reach in the room's own orientation.
    const core=rectangles[0];
    const reach=core?Math.max(...poly.map(([x,y])=>{
      const u=x*core.cos+y*core.sin-core.x,v=-x*core.sin+y*core.cos-core.y;
      return Math.hypot(Math.max(0,-u,u-core.w),Math.max(0,-v,v-core.h));
    }))/shortSide:Infinity;
    const irregular=share<.80||returns>2||(returns===2&&share<.95)||reach>.48||aspect>3.0;
    const penalty=135*(1-share)+10*returns+30*Math.max(0,returns-1)+
      32*Math.max(0,aspect-1.75)+65*Math.max(0,reach-.22);
    const profile={poly,share,returns,rectangles,irregular,penalty};
    P.profiles.set(poly,profile);
    return profile;
  }
  const shapeWeight=type=>({bedroom:2.5,living:1.5,dining:1.4,study:1.3,kitchen:1.1,bathroom:.75,storage:.55,other:.7,corridor:.18,entrance:.4}[type]??.35);
  const needsMainArea=type=>type==='living'||type==='dining'||type==='study';
  const usableMainArea=g=>g.share>=.68&&(g.returns<=3||g.share>=.94);
  // Try two reference beds with a clear strip on one long side, in metres.
  const primaryBedroom=r=>r.type==='bedroom'&&/(主卧|主臥|主人房|\b(?:primary|master|principal|main)[\s_-]+(?:bed(?:room)?|suite)\b)/iu.test(r.name||'');
  function bedReference(profile,scale,doors,doubleOnly=false){
    if(!(scale>0))return null;
    for(const width of doubleOnly?[1.5]:[1.5,.9])for(const r of profile.rectangles){
      const toLocal=([x,y])=>[x*r.cos+y*r.sin,-x*r.sin+y*r.cos];
      const toPlan=([x,y])=>[x*r.cos-y*r.sin,x*r.sin+y*r.cos];
      for(const sideways of [false,true]){
        const w=(sideways?2:width)/scale,h=(sideways?width:2)/scale,aisle=.6/scale;
        if(w+(sideways?0:aisle)>r.w+EPS||h+(sideways?aisle:0)>r.h+EPS)continue;
        if(!doors)return {width};
        const zones=doors.map(d=>{
          const a=toLocal(d.a),b=toLocal(d.b),len=length(a,b);
          const u=(b[0]-a[0])/len,v=(b[1]-a[1])/len;
          return {cx:(a[0]+b[0])/2,cy:(a[1]+b[1])/2,u,v,half:len/2};
        });
        const clear=(x,y)=>zones.every(({cx,cy,u,v,half})=>{
          const dx=x+w/2-cx,dy=y+h/2-cy;
          return Math.abs(dx)>=w/2+half*Math.abs(u)+aisle*Math.abs(v)-EPS||
            Math.abs(dy)>=h/2+half*Math.abs(v)+aisle*Math.abs(u)-EPS||
            Math.abs(dx*u+dy*v)>=half+w/2*Math.abs(u)+h/2*Math.abs(v)-EPS||
            Math.abs(-dx*v+dy*u)>=aisle+w/2*Math.abs(v)+h/2*Math.abs(u)-EPS;
        });
        for(const sign of [-1,1]){
          const x0=r.x+(!sideways&&sign<0?aisle:0),x1=r.x+r.w-w-(!sideways&&sign>0?aisle:0);
          const y0=r.y+(sideways&&sign<0?aisle:0),y1=r.y+r.h-h-(sideways&&sign>0?aisle:0);
          const xs=[x0,x1,(x0+x1)/2],ys=[y0,y1,(y0+y1)/2];
          for(const z of zones){
            const ex=z.half*Math.abs(z.u)+aisle*Math.abs(z.v),ey=z.half*Math.abs(z.v)+aisle*Math.abs(z.u);
            for(const x of [z.cx-ex-w,z.cx+ex])if(x>x0&&x<x1)xs.push(x);
            for(const y of [z.cy-ey-h,z.cy+ey])if(y>y0&&y<y1)ys.push(y);
          }
          for(const x of xs)for(const y of ys)if(clear(x,y)){
            const pts=[[x,y],[x+w,y],[x+w,y+h],[x,y+h]].map(toPlan);
            const side=sideways?[x+w/2,sign>0?y+h+aisle/2:y-aisle/2]:
              [sign>0?x+w+aisle/2:x-aisle/2,y+h/2];
            const routes=bedsideRoutes(profile.poly,pts,doors,toPlan(side),aisle/2);
            if(routes)return {width,pts,routes};
          }
        }
      }
    }
    return null;
  }
  // Certify the swept disk for each segment, not just its endpoints. The
  // short portal crossing treats only the actual open interval as walkable.
  function bedsideRoutes(room,bed,doors,side,radius){
    if(!doors.length)return [];
    const edges=ring=>ring.map((a,i)=>[a,ring[(i+1)%ring.length]]);
    const walls=edges(room),obstacles=walls.concat(edges(bed)),limit=radius-EPS;
    function clears(a,b,c,d){
      if(cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0)return false;
      return dSeg(a,c,d)>=limit&&dSeg(b,c,d)>=limit&&dSeg(c,a,b)>=limit&&dSeg(d,a,b)>=limit;
    }
    const validPoint=p=>inPoly(p,room)&&!inPoly(p,bed)&&obstacles.every(([c,d])=>dSeg(p,c,d)>=limit);
    const clearLine=(a,b)=>obstacles.every(([c,d])=>clears(a,b,c,d));
    if(!validPoint(side))return null;
    const portals=[];
    for(const door of doors){
      const {a,b}=door,L=length(a,b),m=[(a[0]+b[0])/2,(a[1]+b[1])/2];
      if(L<2*limit)return null;
      const dx=-(b[1]-a[1])/L*radius,dy=(b[0]-a[0])/L*radius;
      const land=[[m[0]+dx,m[1]+dy],[m[0]-dx,m[1]-dy]].find(validPoint);
      if(!land)return null;
      let matched=false;
      for(const [c,d] of obstacles){
        if(dSeg(a,c,d)<EPS&&dSeg(b,c,d)<EPS&&walls.some(w=>w[0]===c)){
          const [first,last]=length(c,a)<length(c,b)?[a,b]:[b,a];
          if(!clears(m,land,c,first)||!clears(m,land,last,d))return null;
          matched=true;
        }else if(!clears(m,land,c,d))return null;
      }
      if(!matched)return null;
      portals.push({door:door.id,m,land});
    }
    if(portals.every(p=>clearLine(p.land,side)))
      return portals.map(p=>({door:p.door,points:[p.m,p.land,side]}));
    // A visibility graph around inward-offset wall corners and outward-offset
    // bed corners supplies detours. Every edge is independently certified.
    const nodes=[side,...portals.map(p=>p.land)];
    for(const [ring,offset] of [[room,radius],[bed,-radius]]){
      for(let i=0;i<ring.length;i++){
        const a=ring[(i+ring.length-1)%ring.length],b=ring[i],c=ring[(i+1)%ring.length];
        const l1=length(a,b),l2=length(b,c);
        const u=[(a[1]-b[1])/l1,(b[0]-a[0])/l1],v=[(b[1]-c[1])/l2,(c[0]-b[0])/l2];
        const denom=1+u[0]*v[0]+u[1]*v[1];if(denom<EPS)continue;
        const p=[b[0]+offset*(u[0]+v[0])/denom,b[1]+offset*(u[1]+v[1])/denom];
        if(validPoint(p))nodes.push(p);
      }
    }
    const parents=Array(nodes.length).fill(-1),queue=[0];parents[0]=0;
    let pending=portals.length;
    for(let i=0;i<queue.length&&pending;i++){
      const k=queue[i];
      for(let j=1;j<nodes.length;j++)if(parents[j]<0&&clearLine(nodes[k],nodes[j])){
        parents[j]=k;queue.push(j);if(j<=portals.length)pending--;
      }
    }
    if(pending)return null;
    return portals.map((p,i)=>{
      const points=[p.m];for(let k=i+1;k!==0;k=parents[k])points.push(nodes[k]);
      points.push(side);return {door:p.door,points};
    });
  }
  // Split collinear walls at every endpoint, including partial overlaps and T-junctions.
  function network(polys) {
    const lines=new Map(), atoms=[];
    polys.forEach((poly,owner)=>poly.forEach((p,i)=>{
      const q=poly[(i+1)%poly.length], L=length(p,q);
      if(L<EPS)return;
      let ux=(q[0]-p[0])/L,uy=(q[1]-p[1])/L;
      const dir=(ux < -EPS || (Math.abs(ux)<EPS && uy<0))?-1:1;
      ux*=dir;uy*=dir;
      const offset=ux*p[1]-uy*p[0], key=[ux,uy,offset].map(x=>Math.round(x*1e6)).join(':');
      if(!lines.has(key))lines.set(key,{ux,uy,offset,runs:[]});
      const line=lines.get(key);
      const t=line.ux*p[0]+line.uy*p[1],s=line.ux*q[0]+line.uy*q[1];
      line.runs.push({lo:Math.min(t,s),hi:Math.max(t,s),owner,dir});
    }));
    for(const {ux,uy,offset,runs} of lines.values()){
      const cuts=unique(runs.flatMap(r=>[r.lo,r.hi]));
      const point=t=>[ux*t-uy*offset,uy*t+ux*offset];
      let last=null;
      for(let i=1;i<cuts.length;i++){
        const a=cuts[i-1],b=cuts[i];if(b-a<EPS)continue;
        const mid=(a+b)/2, owners=runs.filter(r=>mid>r.lo && mid<r.hi);
        if(!owners.length){last=null;continue}
        const tag=owners.map(r=>r.owner+':'+r.dir).join(',');
        if(last && last.tag===tag){last.b=point(b);continue}
        last={a:point(a),b:point(b),owners,tag};atoms.push(last);
      }
    }
    return atoms;
  }
  function join(a,b,forSplit=false) {
    const walls=network([a,b]);
    if(!walls.some(s=>s.owners.length===2))return null;
    const next=new Map();
    for(const wall of walls){
      if(wall.owners.length===2){if(wall.owners[0].dir===wall.owners[1].dir)return null;continue}
      const [u,v]=wall.owners[0].dir>0?[wall.a,wall.b]:[wall.b,wall.a];
      const key=pointKey(u);if(next.has(key))return null;
      next.set(key,{u,v});
    }
    if(!next.size)return null;
    const path=[],start=next.keys().next().value;let k=start;
    while(next.has(k)){const edge=next.get(k);next.delete(k);path.push(edge.u);k=pointKey(edge.v)}
    if(k!==start || next.size)return null;
    const result=corners(path);
    // An intermediate union may have a stepped rim; only the two final rooms
    // need to pass the architectural checks. Still reject non-simple unions.
    if(forSplit){const issue=outlineIssue(result,true);return !issue||issue==='angle'?result:null}
    return valid(result) ? result : null;
  }
  function cut(poly,axis,coord) {
    function half(sign) {
      const out=[];
      poly.forEach((p,i)=>{
        const q=poly[(i+1)%poly.length], dp=sign*(p[axis]-coord),dq=sign*(q[axis]-coord);
        if(dp>=-EPS)out.push(p);
        if((dp < -EPS && dq > EPS)||(dp > EPS && dq < -EPS)){
          const ratio=dp/(dp-dq);
          const v=[p[0]+ratio*(q[0]-p[0]),p[1]+ratio*(q[1]-p[1])];v[axis]=coord;out.push(v);
        }
      });return corners(out);
    }
    const a=half(-1),b=half(1);
    return valid(a)&&valid(b)&&Math.abs(area(a)+area(b)-area(poly))<1e-6*Math.max(1,area(poly)) ? [a,b] : null;
  }
  function overlaps(a,b) {
    const aa=bounds(a),bb=bounds(b);
    if(aa[2]<=bb[0]+EPS||bb[2]<=aa[0]+EPS||aa[3]<=bb[1]+EPS||bb[3]<=aa[1]+EPS)return false;
    const inside=(p,poly)=>inPoly(p,poly)&&dPoly(p,poly)>EPS;
    for(const [p,q] of [[a,b],[b,a]]){
      if(p.some(v=>inside(v,q)))return true;
    }
    if(network([a,b]).some(w=>w.owners.length===2&&w.owners[0].dir===w.owners[1].dir))return true;
    if(a.some((p,k)=>b.some((u,l)=>{
      const q=a[(k+1)%a.length],v=b[(l+1)%b.length];
      return cross(p,q,u)*cross(p,q,v)<-EPS&&cross(u,v,p)*cross(u,v,q)<-EPS;
    })))return true;
    const pa=labelPt(a),pb=labelPt(b);
    return (inside(pa,a)&&inside(pa,b))||(inside(pb,a)&&inside(pb,b));
  }
  // Vector plans can contain a diagonal facade and mostly orthogonal interior
  // partitions. Reconcile only opposing, overlapping wall faces across a thin
  // drafting gap. A bridge is added to one unlocked polygon on a working copy.
  function reconcileFaces(P){
    const parts=P.vectorBase.concat(P.fixed),movable=P.vectorBase.length;
    const maxGap=Math.min(P.door*.30,P.diag*.009),offers=[];
    const faces=parts.flatMap((poly,id)=>poly.map((p,i)=>{
      const q=poly[(i+1)%poly.length],L=length(p,q);
      return {p,q,L,id,x:(q[0]-p[0])/L,y:(q[1]-p[1])/L};
    }));
    for(let i=0;i<faces.length;i++)for(let j=i+1;j<faces.length;j++){
      const a=faces[i],b=faces[j];
      if(a.id===b.id||Math.min(a.id,b.id)>=movable||a.x*b.x+a.y*b.y>-.998)continue;
      const along=p=>(p[0]-a.p[0])*a.x+(p[1]-a.p[1])*a.y;
      const t0=along(b.p),t1=along(b.q),lo=Math.max(0,t1),hi=Math.min(a.L,t0);
      if(hi-lo<Math.max(maxGap*2,P.door*.55))continue;
      const faceA=t=>[a.p[0]+a.x*t,a.p[1]+a.y*t];
      const faceB=t=>{const f=(t-t0)/(t1-t0);return [b.p[0]+(b.q[0]-b.p[0])*f,b.p[1]+(b.q[1]-b.p[1])*f]};
      const points=[faceA(lo),faceA(hi),faceB(hi),faceB(lo)];
      const gap=(p,q)=>(q[0]-p[0])*a.y-(q[1]-p[1])*a.x;
      const gaps=[gap(points[0],points[3]),gap(points[1],points[2])];
      if(Math.min(...gaps)<-EPS||Math.max(...gaps)>maxGap||Math.max(...gaps)<EPS)continue;
      const strip=corners(points);
      if(strip.length<3||area(strip)<=EPS)continue;
      offers.push({a:a.id,b:b.id,strip,span:hi-lo});
    }
    offers.sort((a,b)=>b.span-a.span);
    let count=0;
    for(const {a,b,strip} of offers){
      if(parts.some(poly=>overlaps(poly,strip)))continue;
      // Favor the owner that gets the fewest extra corners.
      let best=null;
      for(const id of [a,b]){
        if(id>=movable)continue;
        const p=join(parts[id],strip);
        if(!p||Math.abs(area(p)-area(parts[id])-area(strip))>EPS*Math.max(1,area(p)))continue;
        const added=p.length-parts[id].length;
        if(!best||added<best.added)best={id,p,added};
      }
      if(best){parts[best.id]=best.p;count++}
    }
    P.vectorBase=parts.slice(0,movable);
    return count;
  }
  function prepare(input) {
    const traced=(input.footprint||input.rooms).filter(r=>r.pts);
    if(!traced.length)throw Error('请先标注建筑外轮廓内的空间');
    const R=input.rooms, points=traced.flatMap(r=>r.pts),box=bounds(points);
    const diag=Math.hypot(box[2]-box[0],box[3]-box[1]);
    const door=input.doorPx || diag*.035, ids=new Map(R.map((r,i)=>[r.id,i])),ext=R.length;
    const edges=input.edges.map(e=>({...e,i:e.a==='EXT'?ext:ids.get(e.a),j:e.b==='EXT'?ext:ids.get(e.b)}));
    const locked=R.map((r,i)=>r.locked?i:-1).filter(i=>i>=0), free=R.map((r,i)=>r.locked?-1:i).filter(i=>i>=0);
    const fixed=locked.map(i=>corners(R[i].pts));
    locked.forEach((id,k)=>requireOutline(R[id],fixed[k]));
    const lockIds=new Set(locked.map(i=>R[i].id));
    const tol=Math.min(diag*.007,door*.12);
    // Apply the orthogonal fit only if the whole domain qualifies.
    const fitted=traced.map(r=>{
      if(lockIds.has(r.id)||axisAligned(r.pts))return r;
      const pts=fitTrace(r.pts,tol);
      return pts?{...r,pts}:r;
    });
    const orth=fitted.every(r=>axisAligned(r.pts));
    const sources=orth?fitted:traced.map(r=>{
      // For a genuinely angled plan, preserve valid walls exactly, including shared
      // diagonals. Only remove local tracing noise when the raw outline is invalid.
      const p=corners(r.pts);
      if(lockIds.has(r.id)||valid(p)||p.length<4)return r;
      const box=bounds(p),limit=Math.min(tol,(box[2]-box[0])*.06,(box[3]-box[1])*.06);
      const simple=corners(simplifyClosed(p,limit*.85));
      return valid(simple)&&closeOutline(p,simple,limit)?{...r,pts:simple}:r;
    });
    const adjusted=sources.filter((r,i)=>r!==traced[i]).length;
    const preferences=(input.briefs||[]).filter(s=>ids.has(s.target)).map(s=>({
      target:ids.get(s.target), anchor:ids.get(s.anchor), kind:s.kind,
      noise:R.map((room,i)=>['living','dining','kitchen'].includes(room.type)?i:-1).filter(i=>i>=0)
    }));
    const P={R,edges,locked,free,fixed,ext,door,diag,sources,orth,adjusted,preferences,
      scale:input.scale>0?input.scale:null,profiles:new WeakMap(),
      stats:{trials:0,partition:0,required:0,access:0,movement:0,door:0,bedroom:0,shape:0,passed:0}};
    if(orth){
      for(const r of sources)requireOutline(r,corners(r.pts),true);
      P.domain=orthogonalDomain(P);
      P.originalBlocks=originalBlocks(P);
    }
    else {
      const movable=sources.filter(r=>!lockIds.has(r.id));
      P.vectorBase=movable.map(r=>corners(r.pts));
      movable.forEach((r,i)=>{
        const issue=outlineIssue(P.vectorBase[i]);
        if(issue==='degenerate'||issue==='crossing')requireOutline(r,P.vectorBase[i]);
      });
      const polys=P.vectorBase.concat(fixed);
      const owners=movable.concat(locked.map(i=>R[i]));
      for(let i=0;i<polys.length;i++)for(let j=0;j<i;j++){
        const a=polys[i],b=polys[j];
        if(overlaps(a,b))throw Error('请对齐「'+owners[i].name+'」和「'+owners[j].name+'」的共墙：两个轮廓重叠。');
      }
      P.bridged=reconcileFaces(P);
      // A sharp corner on an unlocked internal partition can disappear when its
      // two rooms are repartitioned. Join only real seams, with no loss of area.
      const names=movable.slice();
      for(let i=P.vectorBase.findIndex(p=>!valid(p));i>=0;i=P.vectorBase.findIndex(p=>!valid(p))){
        let neighbor=-1,whole=null;
        for(let j=0;j<P.vectorBase.length;j++){
          if(j===i)continue;
          const a=P.vectorBase[i],b=P.vectorBase[j];
          whole=join(a,b);
          if(whole && Math.abs(area(whole)-area(a)-area(b))<EPS*Math.max(1,area(whole))){neighbor=j;break}
        }
        if(neighbor<0){
          const poly=P.vectorBase[i];
          // A traced stepped partition can split into two usable pieces without
          // changing its perimeter. Both pieces must already pass the final checks.
          let best=null,largestMinimum=0;
          if(outlineIssue(poly)==='stairs')for(const axis of [0,1])for(const at of unique(poly.map(p=>p[axis]))){
            const pair=cut(poly,axis,at);
            if(!pair)continue;
            const minimum=Math.min(...pair.map(area));
            if(minimum>largestMinimum){best=pair;largestMinimum=minimum}
          }
          if(!best)requireOutline(names[i],poly);
          P.vectorBase.splice(i,1,...best);names.splice(i,1,names[i],names[i]);continue;
        }
        P.vectorBase[i]=whole;P.vectorBase.splice(neighbor,1);names.splice(neighbor,1);
      }
      // A diagonal facade need not freeze the subdivisions of a rectangular wing.
      // Protect nonrectilinear pieces and locks while reconnecting narrow wall
      // faces that belonged to different traced rooms.
      const rectilinear=P.vectorBase.filter(axisAligned),xy=rectilinear.flat();
      if(rectilinear.length>1&&unique(xy.map(v=>v[0])).length*unique(xy.map(v=>v[1])).length<=600000){
        P.wingRemainder=P.vectorBase.filter(p=>!axisAligned(p));
        P.wingDomain=orthogonalDomain({sources:rectilinear.map(pts=>({pts})),fixed:[],
          door:0,seamLimit:Math.min(P.door*.16,P.diag*.005),
          protect:P.wingRemainder.concat(P.fixed).map(bounds)});
      }
    }
    const domain=P.orth?P.domain:P.wingDomain;
    if(domain&&domain.w*domain.h<50000)P.slicing=slicingDomain(domain,P.door);
    return P;
  }
  // Use only coordinates already present in the drawing. Bridge short drafting gaps
  // between opposing room faces; empty courtyards and shafts wider than this stay empty.
  function orthogonalDomain(P) {
    const points=P.sources.flatMap(r=>r.pts),xs=unique(points.map(p=>p[0])),ys=unique(points.map(p=>p[1]));
    const w=xs.length-1,h=ys.length-1;
    if(w*h>600000)throw Error('标注顶点过密，请先合并共线顶点');
    const cells=new Int8Array(w*h);
    const owners=P.protect?new Int32Array(w*h).fill(-1):null;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const p=[(xs[x]+xs[x+1])/2,(ys[y]+ys[y+1])/2];
      const numLock=P.fixed.reduce((s,poly)=>s+Number(inPoly(p,poly)),0);
      if(numLock>1){
        const [a,b]=P.locked.filter((id,k)=>inPoly(p,P.fixed[k])).map(id=>P.R[id].name);
        throw Error('请对齐「'+a+'」和「'+b+'」的共墙：两个轮廓重叠。');
      }
      const owner=P.sources.findIndex(r=>inPoly(p,r.pts));
      cells[y*w+x]=numLock?2:Number(owner>=0);
      if(owners)owners[y*w+x]=owner;
    }
    const fill=cells.slice(),gap=P.seamLimit??P.door*.30;
    let joinedArea=0;
    for(const axis of [0,1,0,1]){
      const stops=axis?ys:xs,count=axis?h:w,rows=axis?w:h;
      const at=(k,row)=>axis?k*w+row:row*w+k;
      for(let row=0;row<rows;row++)for(let k=0;k<count;){
        if(fill[at(k,row)]){k++;continue}
        const start=k;while(k<count&&!fill[at(k,row)])k++;
        if(start===0||k===count||stops[k]-stops[start]>gap)continue;
        if(owners){
          const before=owners[at(start-1,row)],after=owners[at(k,row)];
          if(before<0||after<0||before===after)continue;
          const box=axis?[xs[row],ys[start],xs[row+1],ys[k]]:[xs[start],ys[row],xs[k],ys[row+1]];
          if(P.protect.some(b=>box[0]<b[2]&&box[2]>b[0]&&box[1]<b[3]&&box[3]>b[1]))continue;
          joinedArea+=(box[2]-box[0])*(box[3]-box[1]);
        }
        for(let t=start;t<k;t++)fill[at(t,row)]=1;
      }
    }
    return {xs,ys,w,h,fill,joinedArea};
  }
  function basicBlocks(P,rnd) {
    const {xs,ys,w,h,fill}=P.domain, remaining=fill.slice(),blocks=[];
    const sx=rnd()<.5?1:-1, sy=rnd()<.5?1:-1,trans=rnd()<.5;
    const nx=trans?h:w,ny=trans?w:h;
    const index=(x,y)=>{
      const a=trans?y:x,b=trans?x:y;
      return (sy>0?b:h-1-b)*w+(sx>0?a:w-1-a);
    };
    for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){
      if(remaining[index(x,y)]!==1)continue;
      let right=nx,best=0,endX=x,endY=y;
      for(let yy=y;yy<ny;yy++){
        let xx=x;while(xx<right && remaining[index(xx,yy)]===1)xx++;
        right=xx;if(right===x)break;
        const i=index(x,y),j=index(right-1,yy),ix=i%w,iy=Math.floor(i/w),jx=j%w,jy=Math.floor(j/w);
        const span=(xs[Math.max(ix,jx)+1]-xs[Math.min(ix,jx)])*(ys[Math.max(iy,jy)+1]-ys[Math.min(iy,jy)]);
        if(span>best){best=span;endX=right-1;endY=yy}
      }
      const a=index(x,y),b=index(endX,endY),x0=xs[Math.min(a%w,b%w)],x1=xs[Math.max(a%w,b%w)+1];
      const y0=ys[Math.min(Math.floor(a/w),Math.floor(b/w))],y1=ys[Math.max(Math.floor(a/w),Math.floor(b/w))+1];
      blocks.push([[x0,y0],[x1,y0],[x1,y1],[x0,y1]]);
      for(let yy=y;yy<=endY;yy++)for(let xx=x;xx<=endX;xx++)remaining[index(xx,yy)]=0;
    }
    return blocks;
  }
  function originalBlocks(P) {
    const {xs,ys,w,h,fill}=P.domain,locks=new Set(P.locked.map(i=>P.R[i].id));
    const movable=P.sources.filter(r=>!locks.has(r.id));
    const owner=new Int32Array(w*h).fill(-1);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const k=y*w+x;if(fill[k]!==1)continue;
      const pt=[(xs[x]+xs[x+1])/2,(ys[y]+ys[y+1])/2];
      let min=Infinity;
      for(const [j,r] of movable.entries()){
        const d=inPoly(pt,r.pts)?0:dPoly(pt,r.pts);
        if(d<min){min=d;owner[k]=j}if(d===0)break;
      }
    }
    const outlines=movable.map(()=>new Map());
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const id=owner[y*w+x];if(id<0)continue;
      const sides=[[0,-1,x,y,x+1,y],[1,0,x+1,y,x+1,y+1],[0,1,x+1,y+1,x,y+1],[-1,0,x,y+1,x,y]];
      for(const [dx,dy,x1,y1,x2,y2] of sides){
        const px=x+dx,py=y+dy;
        if(px>=0&&py>=0&&px<w&&py<h&&owner[py*w+px]===id)continue;
        const from=y1*(w+1)+x1,to=y2*(w+1)+x2;
        if(outlines[id].has(from))return null;
        outlines[id].set(from,to);
      }
    }
    const polys=[];
    for(const edges of outlines){
      if(!edges.size)return null;
      const first=edges.keys().next().value;let v=first;const ring=[];
      while(edges.has(v)){
        ring.push([xs[v%(w+1)],ys[Math.floor(v/(w+1))]]);
        const next=edges.get(v);edges.delete(v);v=next;
      }
      if(v!==first||edges.size)return null;
      const p=corners(ring);if(!valid(p))return null;polys.push(p);
    }
    return polys;
  }
  function splitRoom(p,rnd,door,forcedAxis) {
    const box=bounds(p),w=box[2]-box[0],h=box[3]-box[1];
    const preferred=forcedAxis ?? (rnd()<.78?Number(h>w):Number(w>=h));
    for(const axis of [preferred,1-preferred]){
      const span=box[axis+2]-box[axis];
      if(span<door*1.7)continue;
      let t=box[axis]+span*(.34+rnd()*.32);
      const turns=p.filter((v,i)=>cross(p[(i+p.length-1)%p.length],v,p[(i+1)%p.length])<-EPS)
        .map(v=>v[axis]).filter(v=>Math.min(v-box[axis],box[axis+2]-v)>Math.max(door*.85,span*.12));
      if(turns.length&&rnd()<.7)t=turns.reduce((a,b)=>Math.abs(a-t)<Math.abs(b-t)?a:b);
      const parts=cut(p,axis,t);
      if(parts && parts.every(q=>area(q)>.6*door*door))return parts;
    }
    return null;
  }
  function sharedPairs(parts) {
    return network(parts).filter(s=>s.owners.length===2 && s.owners[0].dir!==s.owners[1].dir);
  }
  // Partition an occupied wing with full-length straight cuts. Work on exact
  // cell unions so concave facades, shafts, courtyards and locks survive.
  function slicingDomain(domain,door){
    function subdivide(stops){
      const values=[],old=[];
      for(let i=0;i<stops.length-1;i++){
        const count=Math.max(1,Math.min(12,Math.ceil((stops[i+1]-stops[i])/(door*1.2))));
        for(let j=0;j<count;j++){values.push(stops[i]+(stops[i+1]-stops[i])*j/count);old.push(i)}
      }
      values.push(stops.at(-1));return {values,old};
    }
    const X=subdivide(domain.xs),Y=subdivide(domain.ys),w=X.old.length,h=Y.old.length;
    if(w*h>6500)return null;
    const free=new Uint8Array(w*h),areas=new Float64Array(w*h),groups=[];
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const k=y*w+x;
      free[k]=Number(domain.fill[Y.old[y]*domain.w+X.old[x]]===1);
      areas[k]=(X.values[x+1]-X.values[x])*(Y.values[y+1]-Y.values[y]);
    }
    for(let k=0;k<free.length;k++)if(free[k]){
      const cells=[k];free[k]=0;
      for(let i=0;i<cells.length;i++){
        const n=cells[i],x=n%w;
        for(const j of [x?n-1:-1,x<w-1?n+1:-1,n-w,n+w])if(free[j]){free[j]=0;cells.push(j)}
      }
      groups.push(cells);
    }
    return {w,h,areas,xs:X.values,ys:Y.values,groups};
  }
  function slicingBlocks(P,count,rnd){
    const {w,areas,xs,ys,groups}=P.slicing;
    if(count<groups.length)return null;
    function parcel(cells){
      const inside=new Set(cells),next=new Map();
      let size=0,x0=Infinity,y0=Infinity,x1=-1,y1=-1,ambiguous=false;
      function edge(a,b){if(next.has(a))ambiguous=true;next.set(a,b)}
      for(const k of cells){
        const x=k%w,y=Math.floor(k/w),a=y*(w+1)+x;
        size+=areas[k];x0=Math.min(x0,x);x1=Math.max(x1,x+1);y0=Math.min(y0,y);y1=Math.max(y1,y+1);
        if(!inside.has(k-w))edge(a,a+1);
        if(x===w-1||!inside.has(k+1))edge(a+1,a+w+2);
        if(!inside.has(k+w))edge(a+w+2,a+w+1);
        if(x===0||!inside.has(k-1))edge(a+w+1,a);
      }
      let poly=null;
      if(!ambiguous){
        const path=[],first=next.keys().next().value;let v=first;
        while(next.has(v)){path.push([xs[v%(w+1)],ys[Math.floor(v/(w+1))]]);const n=next.get(v);next.delete(v);v=n}
        if(v===first&&!next.size)poly=corners(path);
      }
      const width=xs[x1]-xs[x0],height=ys[y1]-ys[y0],aspect=Math.max(width/height,height/width);
      const fine=poly&&valid(poly);
      const cost=(fine?0:100)+Math.max(0,(poly?.length||14)-4)*2.1+25*(1-size/(width*height))+
        5*Math.max(0,aspect-2.2);
      return {cells,size,x0,y0,x1,y1,poly,fine,cost};
    }
    const pieces=groups.map(parcel);
    while(pieces.length<count){
      const order=pieces.map((q,i)=>({i,priority:(q.fine?1:5)*q.size*(.70+rnd()*.65)})).sort((a,b)=>b.priority-a.priority);
      let cutMade=false;
      for(const {i} of order){
        const q=pieces[i],choices=[];
        for(const axis of [0,1]){
          const coords=axis?ys:xs,lo=axis?q.y0:q.x0,hi=axis?q.y1:q.x1;
          const aim=.32+rnd()*.36,span=coords[hi]-coords[lo];
          const indices=[];
          for(let t=lo+1;t<hi;t++){
            const frac=(coords[t]-coords[lo])/span;
            if(frac<.14||frac>.86||Math.min(frac,1-frac)*span<P.door*.8)continue;
            const onCorner=q.poly?.some(p=>Math.abs(p[axis]-coords[t])<EPS);
            indices.push({t,merit:Math.abs(frac-aim)+(onCorner?-.32:0)+rnd()*.28});
          }
          for(const {t} of indices.sort((a,b)=>a.merit-b.merit).slice(0,4)){
            const a=[],b=[];
            for(const k of q.cells)((axis?Math.floor(k/w):k%w)<t?a:b).push(k);
            if(!a.length||!b.length)continue;
            const pair=[parcel(a),parcel(b)];
            const fraction=pair[0].size/q.size;
            if(Math.min(...pair.map(v=>v.size))<P.door*P.door*.75)continue;
            const cost=pair[0].cost+pair[1].cost+22*Math.abs(fraction-aim)+rnd()*8;
            choices.push({pair,cost});
          }
        }
        if(choices.length){
          choices.sort((a,b)=>a.cost-b.cost);pieces.splice(i,1,...choices[0].pair);cutMade=true;break;
        }
      }
      if(!cutMade)return null;
    }
    return pieces.every(q=>q.fine)?pieces.map(q=>q.poly):null;
  }
  function straightenPartitions(parts,P,rnd){
    // Re-cut pairs that contain notches. Prefer cuts that eliminate concave
    // corners on both sides without creating disproportionately small parcels.
    const seams=sharedPairs(parts).sort((a,b)=>length(b.a,b.b)-length(a.a,a.b));
    const offset=seams.length?Math.floor(rnd()*seams.length):0;
    const score=p=>{
      const g=roomProfile(P,p);
      return Math.min(250,g.penalty)+50*Number(g.irregular);
    };
    const touched=new Set();
    for(let j=0;j<seams.length;j++){
      const [a,b]=seams[(j+offset)%seams.length].owners.map(o=>o.owner);
      if(touched.has(a)||touched.has(b))continue;
      const original=[parts[a],parts[b]],areas=original.map(area).sort((x,y)=>x-y);
      if(original.every(p=>roomProfile(P,p).returns===0))continue;
      const whole=join(parts[a],parts[b],true);if(!whole)continue;
      const box=bounds(whole),turns=whole.filter((v,i)=>cross(whole[(i+whole.length-1)%whole.length],v,whole[(i+1)%whole.length])<-EPS);
      let limit=score(parts[a])+score(parts[b])-2,best=null;
      for(const axis of [0,1]){
        const mid=(box[axis]+box[axis+2])/2;
        const cuts=unique([mid,...turns.map(p=>p[axis])]);
        for(const t of cuts){
          if(Math.min(t-box[axis],box[axis+2]-t)<P.door*.8)continue;
          const pair=cut(whole,axis,t);
          if(!pair)continue;
          const small=Math.min(...pair.map(area));
          if(small<Math.max(areas[0]*.42,P.door*P.door*.70))continue;
          const value=score(pair[0])+score(pair[1])+22*Math.abs(Math.log(small/areas[0]));
          if(value<limit){limit=value;best=pair}
        }
      }
      if(best){[parts[a],parts[b]]=best;touched.add(a);touched.add(b)}
    }
  }
  function makeTemplate(P,rnd) {
    let parts;
    const wanted=P.free.length;
    if(P.slicing&&rnd()<.55){
      const extra=P.wingRemainder||[],blocks=slicingBlocks(P,wanted-extra.length,rnd);
      if(blocks)parts=blocks.concat(extra);
    }
    if(!parts){
      if(P.orth)parts=P.originalBlocks && rnd()<.40?P.originalBlocks.slice():basicBlocks(P,rnd);
      else if(P.wingDomain&&rnd()<.68)parts=basicBlocks({domain:P.wingDomain},rnd).concat(P.wingRemainder);
      else parts=P.vectorBase.slice();
    }
    if(!wanted)return parts.length?null:P.fixed.slice();
    // Merge narrow residual parcels into a neighbor before assigning any room to them.
    const minArea=Math.min(...P.free.map(i=>P.R[i].target))*.45;
    for(let pass=0,limit=parts.length+4;pass<limit;pass++){
      const fragile=parts.map(p=>{const b=bounds(p);return area(p)<minArea || Math.min(b[2]-b[0],b[3]-b[1])<P.door*.78});
      if(parts.length<=wanted && !fragile.some(Boolean))break;
      const pairs=sharedPairs(parts).map(s=>{
        const [a,b]=s.owners.map(r=>r.owner);
        return {a,b,weight:(Number(fragile[a])+Number(fragile[b])+0.1)*(1+rnd()*.35)*length(s.a,s.b)/Math.sqrt(Math.min(area(parts[a]),area(parts[b])))};
      }).sort((a,b)=>b.weight-a.weight);
      let merged=false;
      for(const {a,b} of pairs){
        if(parts.length<=wanted && !fragile[a] && !fragile[b])continue;
        const union=join(parts[a],parts[b]);if(!union)continue;
        parts[a]=union;parts.splice(b,1);merged=true;break;
      }
      if(!merged)break;
    }
    if(parts.length>wanted || !parts.length)return null;
    while(parts.length<wanted){
      const order=parts.map((p,i)=>({i,weight:area(p)*(.65+rnd()*.7)})).sort((a,b)=>b.weight-a.weight);
      let success=false;
      for(const {i} of order){const two=splitRoom(parts[i],rnd,P.door);if(two){parts.splice(i,1,...two);success=true;break}}
      if(!success)return null;
    }
    // Repartition unions with new full-length cuts to change the wall network itself.
    const changes=1+Math.floor(rnd()*Math.min(12,wanted+1));
    for(let turn=0;turn<changes;turn++){
      const pairs=sharedPairs(parts);
      if(!pairs.length)break;
      const s=pairs[Math.floor(rnd()*pairs.length)],[a,b]=s.owners.map(r=>r.owner);
      const united=join(parts[a],parts[b]);if(!united)continue;
      const across=Math.abs(s.a[0]-s.b[0])<EPS?1:0, two=splitRoom(united,rnd,P.door,rnd()<.8?across:1-across);
      if(two){parts[a]=two[0];parts[b]=two[1]}
    }
    if(rnd()<.86)straightenPartitions(parts,P,rnd);
    return parts.concat(P.fixed);
  }
  function facadeWalls(walls) {
    const rims=walls.filter(w=>w.owners.length===1), from=new Map(), outside=new Set(), seen=new Set();
    for(const w of rims){
      const start=w.owners[0].dir>0?w.a:w.b,key=pointKey(start);
      if(!from.has(key))from.set(key,[]);from.get(key).push(w);
    }
    for(const first of rims){
      if(seen.has(first))continue;
      let w=first;const loop=[],path=[];
      while(w && !seen.has(w)){
        seen.add(w);loop.push(w);
        const forward=w.owners[0].dir>0, start=forward?w.a:w.b,end=forward?w.b:w.a;
        path.push(start);
        if(pointKey(end)===pointKey(path[0])){
          if(area(path)>EPS)loop.forEach(s=>outside.add(s));break;
        }
        w=(from.get(pointKey(end))||[]).find(s=>!seen.has(s));
      }
    }
    return outside;
  }
  function layoutGeometry(P,parts) {
    const n=parts.length, walls=network(parts),facade=facadeWalls(walls);
    const spans=Array.from({length:n+1},()=>Array(n+1).fill(null));
    for(const s of walls){
      if(s.owners.length>2)return null;
      const i=s.owners[0].owner;
      if(s.owners.length===1 && !facade.has(s))continue;
      const j=s.owners.length===2?s.owners[1].owner:n;
      if(s.owners.length===2 && s.owners[0].dir===s.owners[1].dir)return null;
      const L=length(s.a,s.b);if(L<P.door-EPS || (spans[i][j]&&spans[i][j].L>=L))continue;
      spans[i][j]=spans[j][i]={a:s.a,b:s.b,L};
    }
    const centers=parts.map(p=>labelPt(p)),surface=parts.map(p=>area(p)),boxes=parts.map(bounds);
    const profiles=parts.map(p=>roomProfile(P,p));
    return {parts,spans,centers,surface,boxes,profiles};
  }
  function placement(P,G,iters,rnd) {
    const n=P.R.length,U=P.free,f=U.length;
    const assignment=Array(n+1).fill(0);assignment[n]=n;
    P.locked.forEach((id,k)=>assignment[id]=f+k);
    const bedSize=G.profiles.map(g=>P.scale?bedReference(g,P.scale,null)?.width||0:null);
    const bedOK=P.R.map(r=>G.profiles.map((g,k)=>r.locked||r.type!=='bedroom'||
      (!g.irregular&&(!P.scale||bedSize[k]>=(primaryBedroom(r)?1.5:.9)))));
    const mainOK=P.R.map(r=>G.profiles.map(g=>r.locked||!needsMainArea(r.type)||usableMainArea(g)));
    if(U.some(i=>!bedOK[i].slice(0,f).some(Boolean)))return {reason:'bedroom'};
    const costs=P.R.map((r,i)=>G.parts.map((poly,k)=>{
      const rel=Math.abs(Math.log(G.surface[k]/Math.max(EPS,r.target)));
      const b=G.boxes[k],w=b[2]-b[0],h=b[3]-b[1],asp=Math.max(w/h,h/w),limit=r.type==='corridor'?10:3.3;
      const pos=r.moved?length(r.seed,G.centers[k])/P.diag*85:0;
      const fill=G.surface[k]/(w*h);
      return 40*rel+43*rel*rel+Math.abs(G.surface[k]/r.target-1)*32+Math.max(0,asp-limit)*10+
        shapeWeight(r.type)*G.profiles[k].penalty+Math.max(0,.8-fill)*15+pos+
        (r.type==='bedroom'&&bedSize[k]===.9?35:0)+(bedOK[i][k]&&mainOK[i][k]?0:2000);
    }));
    const degrees=new Int16Array(n+1),goalDegrees=new Int16Array(n+1);
    for(const e of P.edges){goalDegrees[e.i]++;goalDegrees[e.j]++}
    const hard=Array.from({length:n},()=>[]);
    const exit=new Set();
    for(const e of P.edges){
      if(e.i===n||e.j===n)exit.add(e.i===n?e.j:e.i);
      if(!e.hard)continue;
      if(e.i!==n)hard[e.i].push(e.j);
      if(e.j!==n)hard[e.j].push(e.i);
    }
    const neighbors=G.spans.slice(0,n).map(row=>row.slice(0,n).filter(Boolean).length);
    const allowed=P.R.map((_,id)=>neighbors.map((count,k)=>
      bedOK[id][k]&&mainOK[id][k]&&count>=hard[id].filter(other=>other!==n).length &&
      (!hard[id].includes(n)||!!G.spans[k][n]) &&
      (count>0||!goalDegrees[id]||(exit.has(id)&&!!G.spans[k][n]))));
    const slots=Array.from({length:f},(_,k)=>k);
    // Reserve adjacent slots for hard links before optimizing areas. An island
    // with no shared wall must get a space allowed to open directly outdoors,
    // or a space for which the edited graph requests no access at all.
    function seeded(){
      const a=Array(n+1).fill(-1),taken=new Set();a[n]=n;
      P.locked.forEach((id,k)=>{a[id]=f+k;taken.add(f+k)});
      const fits=(id,k)=>allowed[id][k]&&hard[id].every(j=>a[j]<0||G.spans[k][a[j]]);
      if(P.locked.some(id=>!fits(id,a[id])))return null;
      let budget=1200;
      function fill(){
        if(--budget<0)return false;
        let choices=null;
        const consider=list=>{if(!choices||list.length<choices.length)choices=list};
        for(const id of U)if(a[id]<0&&(hard[id].length||P.R[id].type==='bedroom'))
          consider(slots.filter(k=>!taken.has(k)&&fits(id,k)).map(k=>[id,k]));
        for(const k of slots)if(!taken.has(k)&&!neighbors[k])
          consider(U.filter(id=>a[id]<0&&fits(id,k)).map(id=>[id,k]));
        if(!choices){
          const remaining=slots.filter(k=>!taken.has(k));
          for(const id of U)if(a[id]<0)a[id]=remaining.splice(Math.floor(rnd()*remaining.length),1)[0];
          return true;
        }
        // Shuffle equal domains without biasing the result toward the source plan.
        for(let i=choices.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[choices[i],choices[j]]=[choices[j],choices[i]]}
        for(const [id,k] of choices){
          a[id]=k;taken.add(k);if(fill())return true;a[id]=-1;taken.delete(k);
          if(budget<0)break;
        }
        return false;
      }
      return fill()?a:null;
    }
    const parent=new Int32Array(n+1);
    const root=i=>{while(i!==parent[i]){parent[i]=parent[parent[i]];i=parent[i]}return i};
    const existing=U.filter(i=>P.R[i].original);
    const far=P.R.map(r=>G.centers.map(p=>r.original&&length(r.original,p)>=P.diag*.095));
    const separations=P.preferences.length?G.centers.map((a,i)=>G.centers.map((b,j)=>({
      gap:Math.min(1,length(a,b)/(P.diag*.55)),wall:!!G.spans[i][j]
    }))):null;
    function preferenceCost(arr){
      let penalty=0;
      for(const pref of P.preferences){
        const row=separations[arr[pref.target]];
        if(pref.noise.length){
          const pairs=pref.noise.map(j=>row[arr[j]]);
          const exposure=1-Math.min(...pairs.map(pair=>pair.gap)) + Number(pairs.some(pair=>pair.wall));
          penalty+=(pref.kind==='quiet'?78:40)*exposure;
        }
        if(pref.kind==='study'&&pref.anchor!==undefined)penalty+=80*row[arr[pref.anchor]].gap;
      }
      return penalty;
    }
    let category='required';
    function evaluate(arr) {
      let cost=separations?preferenceCost(arr):0,hardMissing=false;
      for(let i=0;i<=n;i++)parent[i]=i;
      degrees.fill(0);
      for(const id of U)cost+=costs[id][arr[id]];
      for(const e of P.edges){
        if(G.spans[arr[e.i]][arr[e.j]]){degrees[e.i]++;degrees[e.j]++;parent[root(e.i)]=root(e.j);continue}
        if(e.hard)hardMissing=true;
        let distance=0;
        if(e.i!==n&&e.j!==n)distance=length(G.centers[arr[e.i]],G.centers[arr[e.j]])/P.diag;
        cost+=(e.hard?2400:65)*(1+distance*.16);
      }
      for(let id=0;id<n;id++)if(goalDegrees[id]>0 && !degrees[id])cost+=250;
      const disconnected=P.edges.reduce((sum,e)=>sum+Number(root(e.i)!==root(e.j)),0);
      const shortfall=existing.length<5?0:Math.max(0,Math.ceil(existing.length*.4)-existing.filter(i=>far[i][arr[i]]).length);
      cost+=disconnected*480+shortfall*120;
      category=hardMissing?'required':U.some(i=>!bedOK[i][arr[i]])?'bedroom':
        U.some(i=>!mainOK[i][arr[i]])?'shape':disconnected?'access':shortfall?'movement':'passed';
      return cost;
    }
    let bestCost=Infinity,bestValid=null,bestValidCost=Infinity,closest=hard.some(ids=>ids.length)?'required':'access';
    const count=Math.max(2,Math.ceil(iters/650));
    for(let run=0;run<count;run++){
      const seed=seeded();if(!seed)continue;
      U.forEach(id=>assignment[id]=seed[id]);
      let cost=evaluate(assignment);
      function remember(score){
        if(score<bestCost){bestCost=score;closest=category}
        if(category==='passed'&&score<bestValidCost){bestValidCost=score;bestValid=assignment.slice()}
      }
      remember(cost);
      if(f<2)break;
      const steps=Math.max(800,Math.ceil(iters/count)*3);
      for(let it=0;it<steps;it++){
        const i=Math.floor(rnd()*f),j=(i+1+Math.floor(rnd()*(f-1)))%f;
        const a=U[i],b=U[j],three=f>2 && rnd()<.14;
        let c=a;
        if(three){do{c=U[Math.floor(rnd()*f)]}while(c===a||c===b)}
        const aa=assignment[a],bb=assignment[b],cc=assignment[c];
        assignment[a]=bb;assignment[b]=three?cc:aa;if(three)assignment[c]=aa;
        const next=evaluate(assignment),T=43*Math.pow(.018,it/steps);
        remember(next);
        if(next<=cost || rnd()<Math.exp((cost-next)/T)){cost=next}
        else{assignment[a]=aa;assignment[b]=bb;if(three)assignment[c]=cc}
      }
    }
    return bestValid?{slots:bestValid,cost:bestValidCost}:{reason:closest};
  }
  function build(P,G,result,report={}) {
    const {slots}=result;
    const rooms=P.R.map((r,i)=>({id:r.id,name:r.name,type:r.type,pts:G.parts[slots[i]]}));
    const missing=[],doors=[],critical=[];
    for(const [i,e] of P.edges.entries()){
      const w=G.spans[slots[e.i]][slots[e.j]], key=[e.a,e.b].sort().join('|');
      if(!w){if(e.hard)return null;missing.push(key);continue}
      const size=e.kind==='opening'?Math.max(P.door,w.L*.74):P.door;
      const q=t=>[w.a[0]+(w.b[0]-w.a[0])*t,w.a[1]+(w.b[1]-w.a[1])*t];
      const a=q(.5-size/w.L*.5),b=q(.5+size/w.L*.5);
      // Re-read the complete opening from the final polygons using interior points on both sides.
      const dx=(b[0]-a[0])/size,dy=(b[1]-a[1])/size,step=Math.max(EPS*10,P.door*.0001);
      const pairAt=t=>{
        const p=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
        return [-1,1].map(s=>rooms.find(r=>inPoly([p[0]-dy*step*s,p[1]+dx*step*s],r.pts))?.id||'EXT').sort().join('|');
      };
      if([.01,.5,.99].some(t=>pairAt(t)!==key))return null;
      doors.push({id:'g'+i,kind:e.kind,a,b,ra:e.a,rb:e.b,hard:e.hard});
      if(e.hard)critical.push(key);
    }
    const parent=Array.from({length:P.ext+1},(_,i)=>i);
    const root=i=>{while(parent[i]!==i)i=parent[i];return i};
    for(const e of P.edges)if(!missing.includes([e.a,e.b].sort().join('|')))parent[root(e.i)]=root(e.j);
    if(P.edges.some(e=>root(e.i)!==root(e.j)))return null;
    const centers=P.free.map(i=>G.centers[slots[i]]);
    const before=P.free.map(i=>P.R[i].original);
    const oldDist=before.flatMap((p,i)=>p?[length(p,centers[i])/P.diag]:[]);
    const relocated=oldDist.filter(n=>n>=.095).length;
    const moveFraction=oldDist.length?relocated/oldDist.length:0;
    if(oldDist.length>=5 && moveFraction<.4)return null;
    const areaErr=P.free.reduce((sum,i)=>sum+Math.abs(G.surface[slots[i]]/P.R[i].target-1),0)/Math.max(1,P.free.length);
    const bedrooms=[];
    let shapeCost=0;
    for(let i=0;i<rooms.length;i++){
      const room=P.R[i],profile=G.profiles[slots[i]];
      if(!room.locked&&needsMainArea(room.type)&&!usableMainArea(profile)){report.reason='shape';return null}
      if(!room.locked)shapeCost+=shapeWeight(room.type)*profile.penalty;
      if(room.type!=='bedroom')continue;
      const bed=bedReference(profile,P.scale,doors.filter(d=>d.ra===room.id||d.rb===room.id),primaryBedroom(room));
      if(!room.locked&&(profile.irregular||(P.scale&&!bed))){report.reason='bedroom';return null}
      bedrooms.push({id:room.id,share:profile.share,bed,locked:room.locked});
    }
    return {rooms,doors,missing,extra:[],critical,centers,bedrooms,shapeCost,diag:P.diag,relocated,existing:oldDist.length,
      score:result.cost,total:P.edges.length,satisfied:P.edges.length-missing.length,cell:P.door*.12,areaErr,
      origin:'重排 '+relocated+'/'+oldDist.length+' 个可移动的原有空间'};
  }
  // Keep a room pairing and move its shared partition to reduce area error.
  // Each accepted move is checked against every door, the locks and the movement threshold.
  function refine(P,candidate) {
    let best=candidate,parts=best.rooms.map(r=>r.pts);
    const fixed=new Set(P.locked),slots=Array.from({length:P.R.length+1},(_,i)=>i);
    for(let pass=0;pass<2;pass++){
      let changed=false;
      const pairs=sharedPairs(parts).filter(s=>s.owners.every(o=>!fixed.has(o.owner)));
      for(const seam of pairs){
        const [a,b]=seam.owners.map(o=>o.owner),pa=parts[a],pb=parts[b],sum=area(pa)+area(pb);
        const intended=sum*P.R[a].target/(P.R[a].target+P.R[b].target);
        const shaped=[a,b].some(i=>P.R[i].type==='bedroom'||needsMainArea(P.R[i].type));
        if(Math.abs(intended-area(pa))<sum*.025&&!shaped)continue;
        const united=join(pa,pb,true);if(!united)continue;
        const axis=Math.abs(seam.a[0]-seam.b[0])<EPS?0:Math.abs(seam.a[1]-seam.b[1])<EPS?1:-1;
        if(axis<0)continue;
        const box=bounds(united), onLow=centroid(pa)[axis]<centroid(pb)[axis];
        let lo=box[axis],hi=box[axis+2],bestCut=null;
        for(let it=0;it<10;it++){
          const t=(lo+hi)/2,halves=cut(united,axis,t);if(!halves)break;
          if(area(halves[0])<(onLow?intended:sum-intended))lo=t;else hi=t;
          bestCut=onLow?halves:[halves[1],halves[0]];
        }
        const choices=bestCut?[bestCut]:[];
        if(shaped){
          const turns=united.filter((v,i)=>cross(united[(i+united.length-1)%united.length],v,united[(i+1)%united.length])<-EPS);
          for(const dim of [0,1])for(const t of unique(turns.map(v=>v[dim]))){
            if(Math.min(t-box[dim],box[dim+2]-t)<P.door*.85)continue;
            const halves=cut(united,dim,t);if(halves)choices.push(halves,[halves[1],halves[0]]);
          }
        }
        const pairCost=(i,p)=>{
          const room=P.R[i],g=roomProfile(P,p);
          if((room.type==='bedroom'&&g.irregular)||(needsMainArea(room.type)&&!usableMainArea(g)))return Infinity;
          return 60*Math.abs(area(p)/room.target-1)+shapeWeight(room.type)*g.penalty;
        };
        const before=pairCost(a,pa)+pairCost(b,pb);
        const candidates=choices.map(pair=>({pair,change:pairCost(a,pair[0])+pairCost(b,pair[1])-before}))
          .filter(x=>x.change<-.01).sort((x,y)=>x.change-y.change);
        for(const {pair} of candidates.slice(0,5)){
          const next=parts.slice();[next[a],next[b]]=pair;
          const geo=layoutGeometry(P,next);if(!geo)continue;
          const c=build(P,geo,{slots,cost:candidate.score});
          if(!c||c.missing.length>best.missing.length)continue;
          parts=next;best=c;changed=true;break;
        }
      }
      if(!changed)break;
    }
    best.score=candidate.score+(best.areaErr-candidate.areaErr)*P.free.length*60+best.shapeCost-candidate.shapeCost;
    return best;
  }
  function distance(a,b) {
    if(!a.centers.length)return {mean:0,share:0};
    const d=a.centers.map((p,i)=>length(p,b.centers[i])/a.diag);
    return {mean:d.reduce((s,v)=>s+v,0)/d.length,share:d.filter(v=>v>.08).length/d.length};
  }
  function search(P,trial,iters,seed) {
    P.stats.trials++;
    const rnd=random(Math.imul(seed,2654435761)+Math.imul(trial+1,1597334677));
    const parts=makeTemplate(P,rnd);
    if(!parts || parts.length!==P.R.length || !parts.every(valid)){P.stats.partition++;return null}
    const geo=layoutGeometry(P,parts);if(!geo){P.stats.partition++;return null}
    const result=placement(P,geo,iters,rnd);
    if(result.reason){P.stats[result.reason]++;return null}
    const report={},option=build(P,geo,result,report);
    P.stats[option?'passed':report.reason||'door']++;
    return option;
  }
  function select(pool,n,P,preferencePenalty) {
    const rank=c=>c.score+c.missing.length*22+c.areaErr*160+(preferencePenalty?preferencePenalty(c):0);
    const pre=pool.filter(Boolean).sort((a,b)=>rank(a)-rank(b));
    const sorted=(P?pre.slice(0,Math.max(n*4,16)).map(c=>refine(P,c)).concat(pre):pre)
      .sort((a,b)=>Number(!!a.missing.length)-Number(!!b.missing.length)||rank(a)-rank(b));
    const chosen=[];
    for(const c of sorted){
      if(chosen.length>=n)break;
      if(chosen.some(prev=>{const d=distance(c,prev);return d.mean<.080 || d.share<.30}))continue;
      c.label=String.fromCharCode(65+chosen.length);chosen.push(c);
    }
    return chosen;
  }
  function failure(P){
    const s=P.stats, stages=['required','bedroom','shape','access','movement','door','partition'];
    // Report the most frequent reason among the trials that reached assignment.
    const considered=s.partition===s.trials?['partition']:stages.slice(0,-1);
    const stage=considered.reduce((a,b)=>s[b]>s[a]?b:a);
    const label=i=>{
      if(i===P.ext)return 'EXT';
      const room=P.R[i];
      return P.R.some((r,k)=>k!==i&&r.name===room.name)?room.name+' ('+(room.code||room.id)+')':room.name;
    };
    const links=P.edges.filter(e=>e.hard).map(e=>label(e.i)+' ↔ '+label(e.j)).join(' / ');
    const reasons={
      bedroom:P.scale?'未找到同时满足卧室形状、床型和门口至床侧通行的摆法。请核对比例尺、卧室目标面积和直连门。':'卧室缺少规整的连续空间。请调整卧室目标面积、节点位置或相邻锁定房间。',
      shape:'客厅、餐厅或书房的连续使用面积不足。请调整相邻空间的目标面积或锁定设置。',
      partition:'通过几何检查的分区不足以继续分配房间。请检查窄缝、锯齿或锁定的边界。',
      required:links?'主要阻点是门宽与可用共墙。需同时满足的直连为 '+links+'。请核对比例尺、标注的门宽和共墙。':'主要阻点是可用共墙和室外出口。请核对比例尺及独立房间的出入口。',
      access:'主要阻点是房间通行：已匹配的门仍把需要通行的房间分隔开。请检查独立房间的出入口。',
      movement:'主要阻点是布局变化不足。请调整节点位置或解锁可移动的房间。',
      door:'开口两侧的几何核对未通过。请检查图上墙线和门洞位置。'
    };
    return '搜索 '+s.trials+' 个分区后仍无方案。 '+reasons[stage]+' 本轮门宽 '+P.door.toFixed(1)+' px。';
  }
  return {prepare,search,select,failure};
})();

/* ===== end generator ===== */

