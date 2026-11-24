/* ---------- image analysis (auto recognition) ---------- */
function loadGray(src,epoch,autoScan){const im=new Image();im.onload=()=>{if(epoch!==imageEpoch)return;
  const maxPx=2.2e6,f=Math.min(1,Math.sqrt(maxPx/(im.naturalWidth*im.naturalHeight)));
  GW=Math.round(im.naturalWidth*f);GH=Math.round(im.naturalHeight*f);GS=f;
  const c=document.createElement('canvas');c.width=GW;c.height=GH;const g=c.getContext('2d');
  g.fillStyle='#fff';g.fillRect(0,0,GW,GH);g.drawImage(im,0,0,GW,GH);
  try{const d=g.getImageData(0,0,GW,GH).data;GRAY=new Uint8Array(GW*GH);
   for(let i=0;i<GW*GH;i++)GRAY[i]=(d[4*i]*.299+d[4*i+1]*.587+d[4*i+2]*.114)|0;scanPixels=captureInk(d);}catch(e){GRAY=null;scanPixels=null}
  WALL=null;WALLKEY='';$('#scan').disabled=!scanPixels;if($('#showmask').checked)showMask();if(autoScan&&scanPixels)runScan()};im.src=src}
function boxPass(src,w,h,r,horiz,mode){
 const out=new Uint8Array(w*h);if(r<=0){out.set(src);return out}
 const n=horiz?w:h,m=horiz?h:w,idx=horiz?((i,j)=>j*w+i):((i,j)=>i*w+j);
 for(let j=0;j<m;j++){let cnt=0;
  for(let i=0;i<Math.min(r,n);i++)cnt+=src[idx(i,j)];
  for(let i=0;i<n;i++){if(i+r<n)cnt+=src[idx(i+r,j)];if(i-r-1>=0)cnt-=src[idx(i-r-1,j)];
   const span=Math.min(n-1,i+r)-Math.max(0,i-r)+1;out[idx(i,j)]=mode==='max'?(cnt>0?1:0):(cnt===span?1:0)}}
 return out}
const dil=(m,r)=>boxPass(boxPass(m,GW,GH,r,true,'max'),GW,GH,r,false,'max');
const ero=(m,r)=>boxPass(boxPass(m,GW,GH,r,true,'min'),GW,GH,r,false,'min');
function darkMask(){const thr=+$('#thr').value,m=new Uint8Array(GW*GH);for(let i=0;i<m.length;i++)m[i]=GRAY[i]<thr?1:0;
 if($('#thin').checked){const r=Math.max(1,Math.round(1.2*GS));return dil(ero(m,r),r)}return m}
function wallMask(){const key=[$('#thr').value,$('#gap').value,$('#thin').checked].join('|');
 if(WALL&&WALLKEY===key)return WALL;const gap=Math.round(+$('#gap').value*GS);WALL=dil(darkMask(),gap);WALLKEY=key;return WALL}
function showMask(){if(!GRAY)return;const m=wallMask(),c=document.createElement('canvas');c.width=GW;c.height=GH;const g=c.getContext('2d'),id=g.createImageData(GW,GH);
 for(let i=0;i<m.length;i++){if(m[i]){id.data[4*i]=230;id.data[4*i+1]=40;id.data[4*i+2]=60;id.data[4*i+3]=170}}
 g.putImageData(id,0,0);const mi=$('#maskimg');mi.setAttribute('href',c.toDataURL());mi.setAttribute('width',S.w);mi.setAttribute('height',S.h);mi.style.display=''}
function hideMask(){$('#maskimg').style.display='none'}
function traceContour(M,w,h){
 let s=-1;for(let i=0;i<w*h;i++)if(M[i]){s=i;break}if(s<0)return[];
 const D=[[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]],di=(dx,dy)=>D.findIndex(d=>d[0]===dx&&d[1]===dy);
 const sx=s%w,sy=(s/w)|0;let cx=sx,cy=sy,bd=4;const pts=[[cx,cy]];
 const on=(x,y)=>x>=0&&y>=0&&x<w&&y<h&&M[y*w+x];
 for(let it=0;it<4*(w+h)*8;it++){let f=false;
  for(let i=1;i<=8;i++){const d=(bd+i)%8,nx=cx+D[d][0],ny=cy+D[d][1];
   if(on(nx,ny)){const pd=(bd+i-1)%8,bx=cx+D[pd][0],by=cy+D[pd][1];cx=nx;cy=ny;bd=di(bx-cx,by-cy);if(bd<0)bd=4;f=true;break}}
  if(!f||(cx===sx&&cy===sy))break;pts.push([cx,cy])}
 return pts}
function orthogonalize(P){
 const Q=P.map(p=>[p[0],p[1]]);
 for(let i=0;i<Q.length;i++){const a=Q[i],b=Q[(i+1)%Q.length],dx=b[0]-a[0],dy=b[1]-a[1];
  if(Math.abs(dy)<Math.abs(dx)*.12){const y=(a[1]+b[1])/2;a[1]=y;b[1]=y}else if(Math.abs(dx)<Math.abs(dy)*.12){const x=(a[0]+b[0])/2;a[0]=x;b[0]=x}}
 return Q.filter((p,i)=>dist(p,Q[(i+1)%Q.length])>.5)}
function wandAt(p){
 if(!GRAY){toast('图片像素还没读取完成，或这张图无法读取像素',true);return}
 const W=wallMask(),gx0=Math.round(p[0]*GS),gy0=Math.round(p[1]*GS);
 let seed=-1;for(let r=0;r<20&&seed<0;r++)for(let dy=-r;dy<=r&&seed<0;dy++)for(let dx=-r;dx<=r;dx++){const x=gx0+dx,y=gy0+dy;
  if(x>=0&&y>=0&&x<GW&&y<GH&&!W[y*GW+x]){seed=y*GW+x;break}}
 if(seed<0){toast('点击处附近都是墙线：请点在房间内部的空白处，或调小「门洞封闭」',true);return}
 const R=new Uint8Array(GW*GH),st=[seed];R[seed]=1;let n=0,border=false;const lim=GW*GH*.35;
 while(st.length){const i=st.pop();n++;const x=i%GW,y=(i/GW)|0;
  if(x===0||y===0||x===GW-1||y===GH-1)border=true;
  if(n>lim){break}
  if(x>0&&!R[i-1]&&!W[i-1]){R[i-1]=1;st.push(i-1)}if(x<GW-1&&!R[i+1]&&!W[i+1]){R[i+1]=1;st.push(i+1)}
  if(y>0&&!R[i-GW]&&!W[i-GW]){R[i-GW]=1;st.push(i-GW)}if(y<GH-1&&!R[i+GW]&&!W[i+GW]){R[i+GW]=1;st.push(i+GW)}}
 if(border||n>lim){toast('识别范围漏到了房间外面（门洞或玻璃墙没有闭合）。试着调大「门洞封闭」，或改用「画房间」手动描。',true);return}
 if(n<30){toast('识别到的区域太小，可能点在了文字或家具里，换个位置试试',true);return}
 const gap=Math.round(+$('#gap').value*GS),R2=gap>0?dil(R,gap):R;
 let P=traceContour(R2,GW,GH);P=orthogonalize(simplifyClosed(P,2.2*Math.max(1,GS)));
 if(P.length<3){toast('轮廓提取失败',true);return}
 P=P.map(q=>[q[0]/GS,q[1]/GS]);
 pushHist();const cnt=S.rooms.filter(r=>r.type===curType).length;
 const r={id:nid('r'),type:curType,name:ui(TY[curType].label)+(cnt?cnt+1:''),pts:P};S.rooms.push(r);sel={t:'room',id:r.id};render();
 toast(`已生成「${r.name}」：${P.length} 个顶点。可拖动顶点修正，或在列表里改名`)}
function snapRoomToWalls(r,R){
 if(!GRAY)return 0;const M=darkMask();let moved=0;const P=r.pts;
 const dark=(x,y)=>{const gx=Math.round(x*GS),gy=Math.round(y*GS);return gx>=0&&gy>=0&&gx<GW&&gy<GH&&M[gy*GW+gx]};
 const nx=P.map(p=>p[0]),ny=P.map(p=>p[1]);
 for(let i=0;i<P.length;i++){const j=(i+1)%P.length,a=P[i],b=P[j],dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy);if(L<12)continue;
  const horiz=Math.abs(dy)<Math.abs(dx)*.12,vert=Math.abs(dx)<Math.abs(dy)*.12;if(!horiz&&!vert)continue;
  let best=null,bf=0;
  for(let o=-R;o<=R;o++){let hit=0,tot=0;
   for(let t=.08;t<=.92;t+=.02){const x=a[0]+dx*t+(vert?o:0),y=a[1]+dy*t+(horiz?o:0);tot++;if(dark(x,y))hit++}
   const f=hit/tot;if(f>bf+.02||(Math.abs(f-bf)<=.02&&best!==null&&Math.abs(o)<Math.abs(best))){bf=f;best=o}}
  if(best!==null&&bf>=.45&&best!==0){moved++;if(horiz){ny[i]=a[1]+best;ny[j]=b[1]+best}else{nx[i]=a[0]+best;nx[j]=b[0]+best}}}
 r.pts=P.map((p,i)=>[nx[i],ny[i]]);return moved}

