/* ---------- init ---------- */
$('#modes').innerHTML=MODES.map(([m,l,k])=>`<button data-m="${m}">${l}<span class="kbd">${k}</span></button>`).join('');
$('#types').innerHTML=TYPES.map(([t,l,c,col],i)=>`<button data-t="${t}"><span class="sw" style="background:${col}"></span>${l}<span class="kbd">${i<9?i+1:''}</span></button>`).join('');
$('#modes').addEventListener('click',e=>{const b=e.target.closest('button');if(b)setMode(b.dataset.m)});
$('#types').addEventListener('click',e=>{const b=e.target.closest('button');if(b)setType(b.dataset.t)});
window.addEventListener('resize',()=>{if(TAB===2)drawGE();else renderCanvas()});
setType('other');setMode('select');updUndo();installLanguageSwitch();
