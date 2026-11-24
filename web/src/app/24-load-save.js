/* ---------- load / save ---------- */
function fit(){const r=svg.getBoundingClientRect();const k=Math.min(r.width/S.w,r.height/S.h)*.9;view={k,tx:(r.width-S.w*k)/2,ty:(r.height-S.h*k)/2+14}}
function setImage(src,cb,autoScan=false,request=++fileEpoch){
  const im=new Image();
  im.onerror=()=>{if(request===fileEpoch)toast('无法读取图片，请选用 PNG、JPEG 或保存的工程文件。',true)};
  im.onload=()=>{
    if(request!==fileEpoch)return;
    const epoch=++imageEpoch;
    clearCandidates();resetRecognition();GRAY=null;WALL=null;WALLKEY='';
    draft=[];doorA=null;scaleA=null;sel=null;drag=null;gdrag=null;GE=null;
    S={img:src,w:im.naturalWidth,h:im.naturalHeight,rooms:[],doors:[],scale:null,scaleLine:null,name:'my plan'};
    $('#aijson').value='';$('#aimodal').hidden=true;mode='select';curType='other';
    const bg=$('#bg');bg.setAttribute('href',src);bg.setAttribute('width',S.w);bg.setAttribute('height',S.h);
    bg.style.display='';$('#sbg').checked=true;hideMask();$('#showmask').checked=false;
    fit();if(cb)cb();resetHist();applyScale();if(TAB===2)switchTab(1);
    setType('other');setMode('select');render();loadGray(src,epoch,autoScan);
  };
  im.src=src;
}
$('#file').addEventListener('change',e=>{
  const f=e.target.files[0];if(!f)return;
  const request=++fileEpoch,fr=new FileReader();
  e.target.value='';
  fr.onerror=()=>{if(request===fileEpoch)toast('读取文件失败，请重新选取',true)};
  if(f.name.toLowerCase().endsWith('.json')){
    fr.onload=()=>{
      if(request!==fileEpoch)return;
      try{
        const d=JSON.parse(fr.result);if(!d.img)throw Error();
        setImage(d.img,()=>{
          S.rooms=d.rooms||[];S.doors=d.doors||[];S.scale=d.scale||null;S.scaleLine=d.scaleLine||null;S.name=d.name||'my plan';
          if(d.designGraph)S.savedDesign=d.designGraph;
          if(S.scale&&S.scaleLine)$('#slen').value=dist(S.scaleLine.a,S.scaleLine.b)*S.scale;
          idc=1+Math.max(0,...[...S.rooms,...S.doors].map(x=>parseInt(String(x.id).replace(/\D/g,''))||0));
        },false,request);
      }catch(err){toast('这个 JSON 不是保存的工程；AI 识别 JSON 请用「导入 AI 识别结果」。',true)}
    };
    fr.readAsText(f);
  }else{
    fr.onload=()=>{if(request===fileEpoch)setImage(fr.result,()=>{S.name=f.name.replace(/\.[^.]+$/,'')},true,request)};
    fr.readAsDataURL(f);
  }
});

function download(name,text){try{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'application/json'}));a.download=name;document.body.appendChild(a);a.click();a.remove()}catch(err){}}
function planJSON(rooms,doors,name){const s=S.scale||.01,H=S.h,tf=p=>[+(p[0]*s).toFixed(3),+((H-p[1])*s).toFixed(3)];
 const tot={},n={},cd={};rooms.forEach(r=>tot[r.type]=(tot[r.type]||0)+1);rooms.forEach(r=>{n[r.type]=(n[r.type]||0)+1;cd[r.id]=TY[r.type].code+(tot[r.type]>1?n[r.type]:'')});
 return{name,unit:'m',source:'Designing Relationships v0.5.9',
  meta:{scale_m_per_px:S.scale,scale_assumed:!S.scale,suggested_tol_m:+(tol*s).toFixed(3),image_size_px:[S.w,S.h]},
  rooms:rooms.map(r=>({id:r.id,code:cd[r.id],name:r.name,type:r.type==='balcony'?'terrace':r.type,outdoor:OUTDOOR.has(r.type),polygon:r.pts.map(tf)})),
  connections:doors.map(d=>({id:d.id,kind:d.kind,geometry:[tf(d.a),tf(d.b)]}))}}
$('#exp').addEventListener('click',()=>{const txt=JSON.stringify(planJSON(S.rooms,S.doors,S.name),null,1);download((S.name||'plan')+'.json',txt);$('#mt').value=txt;$('#modal').hidden=false});
$('#save').addEventListener('click',()=>download((S.name||'plan')+'.project.json',JSON.stringify({img:S.img,rooms:S.rooms,doors:S.doors,scale:S.scale,scaleLine:S.scaleLine,name:S.name,designGraph:saveDesign()})));
$('#copy').addEventListener('click',()=>{const t=$('#mt');t.select();try{navigator.clipboard.writeText(t.value)}catch(e){document.execCommand('copy')}});
$('#close').addEventListener('click',()=>$('#modal').hidden=true);

