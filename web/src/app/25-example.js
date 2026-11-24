/* ---------- example plan (fictional) ---------- */
function example(annotated){
 const m=60,o=40,c=document.createElement('canvas');c.width=14*m+2*o;c.height=10*m+2*o;const g=c.getContext('2d');
 const X=x=>o+x*m,Y=y=>o+(10-y)*m;g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);
 const R=[[0,0,3,3,'entrance'],[0,3,3,5,'study'],[3,0,9,5,'living'],[9,0,12,3,'dining'],[9,3,12,5,'kitchen'],[0,5,12,6.5,'corridor'],[0,6.5,4,10,'bedroom'],[4,6.5,6.5,10,'bathroom'],[6.5,6.5,10,10,'bedroom'],[10,6.5,14,10,'bedroom']];
 g.strokeStyle='#111';g.lineWidth=8;g.lineCap='square';R.forEach(([a,b,cc,d])=>g.strokeRect(X(a),Y(d),(cc-a)*m,(d-b)*m));
 g.lineWidth=2;g.setLineDash([8,6]);g.strokeRect(X(12),Y(6.5),2*m,6.5*m);g.setLineDash([]);
 const doors=[[[1,0],[2,0]],[[1,3],[2,3]],[[4,5],[5,5]],[[10,5],[11,5]],[[2,6.5],[3,6.5]],[[5,6.5],[6,6.5]],[[8,6.5],[9,6.5]],[[10.5,6.5],[11.5,6.5]],[[12,1],[12,2]]];
 const opens=[[[3,1],[3,2.5]],[[9,.5],[9,2.5]],[[9.5,3],[11.5,3]]];
 g.fillStyle='#fff';[...doors,...opens].forEach(([p,q])=>{if(p[1]===q[1])g.fillRect(X(p[0]),Y(p[1])-6,(q[0]-p[0])*m,12);else g.fillRect(X(p[0])-6,Y(q[1]),12,(q[1]-p[1])*m)});
 g.strokeStyle='#8c6d46';g.lineWidth=1.2;doors.forEach(([p,q])=>{g.beginPath();g.moveTo(X(p[0]),Y(p[1]));g.lineTo(X(q[0]),Y(q[1]));g.stroke()});
 g.fillStyle='#999';g.font='14px sans-serif';g.fillText(ui('示例平面（虚构）· 比例 60 px = 1 m'),o,24);
 setImage(c.toDataURL('image/png'),()=>{S.name=annotated?'sample house (annotated)':'sample house';S.rooms=[];S.doors=[];sel=null;S.scale=1/60;S.scaleLine={a:[X(0),Y(-0.4)],b:[X(1),Y(-0.4)]};$('#slen').value=1;
  if(annotated){const ins=4,cnt={};
   R.concat([[12,0,14,6.5,'balcony']]).forEach(([a,b,cc,d,t])=>{cnt[t]=(cnt[t]||0)+1;S.rooms.push({id:nid('r'),type:t,name:ui(TY[t].label)+(cnt[t]>1?cnt[t]:''),pts:[[X(a)+ins,Y(b)-ins],[X(cc)-ins,Y(b)-ins],[X(cc)-ins,Y(d)+ins],[X(a)+ins,Y(d)+ins]]})});
   doors.forEach(([p,q])=>S.doors.push({id:nid('d'),kind:'door',a:[X(p[0]),Y(p[1])],b:[X(q[0]),Y(q[1])]}));
   opens.concat([[[14,2],[14,4]]]).forEach(([p,q])=>S.doors.push({id:nid('o'),kind:'opening',a:[X(p[0]),Y(p[1])],b:[X(q[0]),Y(q[1])]}))}})
}
$('#ex1').addEventListener('click',()=>example(false));
$('#ex2').addEventListener('click',()=>example(true));

