
const TYPES=[
 ['entrance','入口','E','#e15759'],['living','客厅','L','#f28e2b'],['dining','餐厅','D','#d4b02a'],
 ['kitchen','厨房','K','#b07aa1'],['bedroom','卧室','B','#4e79a7'],['bathroom','卫生间','W','#5aa9a4'],
 ['corridor','走廊','C','#8f8f8f'],['study','书房','S','#59a14f'],['storage','储藏','St','#a89f96'],
 ['balcony','阳台/露台','T','#7fc070'],['courtyard','庭院','Y','#3f9e74'],['garage','车库','G','#6b7a8f'],
 ['other','其他','O','#ff8a9a']];
const OUTDOOR=new Set(['balcony','courtyard']);
const TY=Object.fromEntries(TYPES.map(t=>[t[0],{label:t[1],code:t[2],color:t[3]}]));
TY.exterior={label:'室外',code:'⊕',color:'#fff'};
const MODES=[['select','选择 / 平移','V'],['wand','魔棒：点击自动识别房间','W'],['room','画房间','R'],['door','门','D'],['opening','常开开口','O'],['scale','比例尺','S']];
const HINTS={
 select:'点击选中空间或门 → 浮动按钮删除 / 吸附墙线 · 拖动顶点改形状 · 拖空白处平移 · 滚轮缩放 · Ctrl+Z 撤销',
 wand:'先选空间类型，再在房间内部空白处点一下，自动沿墙线生成色块。漏到外面时调大「门洞封闭」；墙没识别出来时调大「墙线阈值」（可勾选「显示墙线识别结果」检查）',
 room:'沿房间内轮廓逐点点击 · 点回起点 / 双击 / Enter 闭合 · Shift 正交 · 右键撤销上一点 · 右键点已有对象可选中删除',
 door:'在门洞处沿墙方向点两下 · 右键点已有的门可选中并删除 · 门只接触一个房间时视为通往室外',
 opening:'常开开口（没有门扇，或开放式空间之间的分界）：沿分界点两下',
 scale:'点击一段已知长度的两个端点（如一道 900 mm 的门），再在左侧填写实际长度'
};
const $=s=>document.querySelector(s);
const svg=$('#cv'),world=$('#world');
let S={img:null,w:0,h:0,rooms:[],doors:[],scale:null,scaleLine:null,name:'my plan'};
let mode='select',curType='bedroom',draft=[],sel=null,view={tx:0,ty:0,k:1},tol=15,showGraph=true;
let cursor=null,drag=null,spaceDown=false,doorA=null,scaleA=null,idc=1,hist=[],redoStack=[];
let GRAY=null,GW=0,GH=0,GS=1,WALL=null,WALLKEY='';
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const nid=p=>p+(idc++);
const room=id=>S.rooms.find(r=>r.id===id), door=id=>S.doors.find(d=>d.id===id);
let toastT=null;
function toast(msg,err){const t=$('#toast');t.textContent=msg;t.className=err?'err':'';t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>t.hidden=true,err?6000:3500)}

