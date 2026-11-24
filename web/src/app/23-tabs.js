/* ---------- tabs ---------- */
function switchTab(t){
 if(TAB===2 && t===1 && $('#ggo').disabled)clearCandidates();
 if(t===2&&!S.rooms.length){toast('请先在「① 标注平面」里标出房间和门',true);return}
 TAB=t;$('#tab1').classList.toggle('on',t===1);$('#tab2').classList.toggle('on',t===2);
 $('#annLeft').hidden=t!==1;$('#genLeft').hidden=t!==2;$('#annRight').hidden=t!==1;$('#genRight').hidden=t!==2;$('#genview').hidden=t!==2;
 if(t===2){$('#bar').hidden=true;
  if(!GE||GE.sig!==geSig()){const had=!!GE;geInit();if(had)toast('标注有变化，关系图已按当前平面重新提取')}
  const bg=$('#gbg');if(S.img){bg.setAttribute('href',S.img);bg.setAttribute('width',S.w);bg.setAttribute('height',S.h);bg.style.display=''}else bg.style.display='none';
  fitG();renderGE();renderRes()}
 else render()}
$('#tab1').addEventListener('click',()=>switchTab(1));
$('#tab2').addEventListener('click',()=>switchTab(2));

