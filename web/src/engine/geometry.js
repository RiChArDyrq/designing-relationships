/* ---------- geometry ---------- */
// Pure geometry helpers shared by the annotator and the generator. No DOM, no app state.
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
function area(P){let a=0;for(let i=0;i<P.length;i++){const[x1,y1]=P[i],[x2,y2]=P[(i+1)%P.length];a+=x1*y2-x2*y1}return a/2}
function centroid(P){const A=area(P);if(Math.abs(A)<1e-6)return[P.reduce((s,p)=>s+p[0],0)/P.length,P.reduce((s,p)=>s+p[1],0)/P.length];
 let cx=0,cy=0;for(let i=0;i<P.length;i++){const[x1,y1]=P[i],[x2,y2]=P[(i+1)%P.length],f=x1*y2-x2*y1;cx+=(x1+x2)*f;cy+=(y1+y2)*f}return[cx/(6*A),cy/(6*A)]}
function inPoly(p,P){let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const[xi,yi]=P[i],[xj,yj]=P[j];if(((yi>p[1])!==(yj>p[1]))&&(p[0]<(xj-xi)*(p[1]-yi)/(yj-yi)+xi))c=!c}return c}
function dSeg(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],L=dx*dx+dy*dy;let t=L?((p[0]-a[0])*dx+(p[1]-a[1])*dy)/L:0;t=Math.max(0,Math.min(1,t));return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy)}
function dPoly(p,P){let m=Infinity;for(let i=0;i<P.length;i++)m=Math.min(m,dSeg(p,P[i],P[(i+1)%P.length]));return m}
function labelPt(P){const c=centroid(P);if(inPoly(c,P))return c;
 const xs=P.map(p=>p[0]),ys=P.map(p=>p[1]);const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
 let best=c,bd=-1;for(let i=1;i<12;i++)for(let j=1;j<12;j++){const p=[x0+(x1-x0)*i/12,y0+(y1-y0)*j/12];if(inPoly(p,P)){const d=dPoly(p,P);if(d>bd){bd=d;best=p}}}return best}
function rdp(P,eps){if(P.length<3)return P;let md=0,mi=0;const a=P[0],b=P[P.length-1];
 for(let i=1;i<P.length-1;i++){const d=dSeg(P[i],a,b);if(d>md){md=d;mi=i}}
 if(md>eps){const l=rdp(P.slice(0,mi+1),eps),r=rdp(P.slice(mi),eps);return l.slice(0,-1).concat(r)}return[a,b]}
function simplifyClosed(P,eps){if(P.length<4)return P;let far=0,fd=0;P.forEach((p,i)=>{const d=dist(p,P[0]);if(d>fd){fd=d;far=i}});
 const A=rdp(P.slice(0,far+1),eps),B=rdp(P.slice(far).concat([P[0]]),eps);return A.slice(0,-1).concat(B.slice(0,-1))}

