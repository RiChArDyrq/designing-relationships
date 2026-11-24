/* ---------- AI pre-annotation import ---------- */
const AI_PROMPT=`你是建筑平面图标注助手。只识别本次上传的图纸，若空间使用编号，请与图例配对。引线标注按箭头终点定位，门和开放分界不清楚时留给用户核对。请识别我上传的平面图，按图上的文字标注（如 BEDROOM、KITCHEN、LIVING、卧室、厨房）找出每个空间，输出严格的 JSON，不要任何解释文字。

格式：
{"image_size":[图片宽度像素, 图片高度像素],
 "rooms":[{"name":"图上的名称","type":"类型","polygon":[[x,y],[x,y],...]}],
 "connections":[{"kind":"door 或 opening","a":[x,y],"b":[x,y]}]}

规则：
1. 坐标为图片像素坐标，原点在左上角，x 向右、y 向下。
2. polygon 沿房间内墙线顺时针给出，尽量使用水平/垂直的边。
3. type 只能从这些里选：entrance, living, dining, kitchen, bedroom, bathroom, corridor, study, storage, balcony, courtyard, garage, other。
4. 开放式空间之间（如客厅与餐厅）没有墙时，按家具/文字位置划分，并用 kind="opening" 连接。
5. connections 的 a、b 是门洞或开口两端的点，沿墙方向；通向室外的门只需贴住一个房间。
6. 没有文字标注但明显是空间的（走廊、门厅），也要标出并给出合理名称。
7. 不确定的地方宁可少标，不要编造。`;
$('#aiprompt').value=AI_PROMPT;
$('#aiimp').addEventListener('click',()=>{if(!S.img){toast('请先上传平面图',true);return}$('#aimodal').hidden=false});
$('#aiclose').addEventListener('click',()=>$('#aimodal').hidden=true);
$('#copyprompt').addEventListener('click',()=>{const t=$('#aiprompt');t.select();try{navigator.clipboard.writeText(t.value)}catch(e){document.execCommand('copy')}toast('提示词已复制')});
function importAnnotation(d,replace,silent){
 if(typeof d==='string'){const m=d.match(/\{[\s\S]*\}/);if(!m)throw new Error('没有找到 JSON');d=JSON.parse(m[0])}
 let sx=1,sy=1;const all=[...(d.rooms||[]).flatMap(r=>r.polygon||[]),...(d.connections||[]).flatMap(c=>c.a?[c.a,c.b]:(c.geometry||[]))];
 if(d.image_size){sx=S.w/d.image_size[0];sy=S.h/d.image_size[1]}
 else if(all.length&&all.every(p=>p[0]<=1.001&&p[1]<=1.001)){sx=S.w;sy=S.h}
 const T=p=>[p[0]*sx,p[1]*sy],valid=new Set(TYPES.map(t=>t[0]));
 pushHist();if(replace){S.rooms=[];S.doors=[]}
 let nr=0,nd=0;
 (d.rooms||[]).forEach(r=>{if(!r.polygon||r.polygon.length<3)return;const t=valid.has(r.type)?r.type:'other';
  S.rooms.push({id:nid('r'),type:t,name:r.name||ui(TY[t].label),pts:r.polygon.map(T)});nr++});
 (d.connections||[]).forEach(c=>{const a=c.a||(c.geometry||[])[0],b=c.b||(c.geometry||[])[1];if(!a||!b)return;
  S.doors.push({id:nid(c.kind==='opening'?'o':'d'),kind:c.kind==='opening'?'opening':'door',a:T(a),b:T(b)});nd++});
 if(d.scale_line){S.scaleLine={a:T(d.scale_line.a),b:T(d.scale_line.b)};$('#slen').value=d.scale_line.meters;applyScale()}
 drawingMenu=false;sel=null;render();if(!silent)toast(`已生成 ${nr} 个空间色块、${nd} 处门/开口，全部可编辑`);return{nr,nd}}
$('#aigo').addEventListener('click',()=>{try{importAnnotation($('#aijson').value,$('#aireplace').checked);$('#aimodal').hidden=true}
 catch(err){toast('JSON 解析失败：'+err.message,true)}});

